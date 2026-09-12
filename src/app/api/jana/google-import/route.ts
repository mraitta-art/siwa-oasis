import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import crypto from 'crypto';
import { chatWithSourceAgent, enrichSourceWithAi, getConfiguredAiProviders, type SourceAgentChatMessage, type SourceAiProvider } from '@/lib/source-agent';
import { parseHospitalityRawText } from '@/lib/hospitality-mapper';
import { detectBusinessCategory } from '@/lib/category-detector';

interface GooglePlaceData {
  name: string;
  address: string;
  phone: string;
  website: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: any[];
  photos: string[];
  placeId: string;
  sourceProvider?: string;
  sourceUrl?: string;
  detailsAvailable?: boolean;
  aiDraft?: OllamaDraft;
}

interface OllamaDraft {
  suggested_type: string;
  confidence: number;
  sections: Record<string, Record<string, unknown>>;
  missing_fields: string[];
  verification_notes: string[];
}

const IMPORT_SECTIONS = [
  'sec_1_identity',
  'sec_2_ambience',
  'sec_3_facilities',
  'sec_4_gastronomy',
  'sec_5_experiences',
  'sec_6_guardian',
  'sec_7_investment',
  'sec_8_connector',
  'sec_9_marketplace_catalog',
  'sec_10_testimonials_faqs',
] as const;

function emptyImportSections() {
  return Object.fromEntries(IMPORT_SECTIONS.map(section => [section, {}])) as Record<string, Record<string, unknown>>;
}

async function enrichWithOllama(place: GooglePlaceData): Promise<OllamaDraft> {
  const endpoint = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const prompt = `You are a cautious business data analyst. Convert the supplied Google Maps facts into a JSON draft for a Siwa Oasis business database.
Rules:
- Use only facts in SOURCE_FACTS. Never invent facilities, services, history, prices, reviews, opening hours, ownership, safety claims, or contact details.
- You may classify the place from its name and facts, but set confidence below 0.7 when uncertain.
- Put unknown fields in missing_fields and leave their section values empty.
- Any interpretation or generated wording must be listed in verification_notes and treated as needing admin verification.
- Return JSON only, matching this exact shape: {"suggested_type":"hotel|restaurant|activity|attraction|transportation|craft|wellness|other","confidence":0,"sections":{},"missing_fields":[],"verification_notes":[]}.
- sections must contain exactly these keys and use objects: ${IMPORT_SECTIONS.join(', ')}.
SOURCE_FACTS:
${JSON.stringify({ name: place.name, address: place.address, phone: place.phone, website: place.website, latitude: place.lat, longitude: place.lng, rating: place.rating, reviews: place.reviews, photos: place.photos, place_id: place.placeId }, null, 2)}`;

  let response: Response;
  try {
    response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, format: 'json', stream: false, options: { temperature: 0.1 } }),
    });
  } catch (error: any) {
    throw new Error(`Ollama is not reachable at ${endpoint}. Start Ollama before importing: ${error.message}`);
  }
  if (!response.ok) throw new Error(`Ollama enrichment failed with HTTP ${response.status}. Confirm that model "${model}" is installed.`);

  const payload = await response.json();
  let draft: Partial<OllamaDraft>;
  try {
    draft = JSON.parse(payload.response || '{}');
  } catch {
    throw new Error('Ollama returned invalid JSON. No draft was saved.');
  }

  const sections = emptyImportSections();
  for (const section of IMPORT_SECTIONS) {
    if (draft.sections?.[section] && typeof draft.sections[section] === 'object') sections[section] = draft.sections[section] as Record<string, unknown>;
  }
  return {
    suggested_type: String(draft.suggested_type || 'other'),
    confidence: Math.max(0, Math.min(1, Number(draft.confidence) || 0)),
    sections,
    missing_fields: Array.isArray(draft.missing_fields) ? draft.missing_fields.map(String) : [],
    verification_notes: Array.isArray(draft.verification_notes) ? draft.verification_notes.map(String) : [],
  };
}

interface ParsedGoogleMapsLink {
  name?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

function isGoogleMapsHost(hostname: string) {
  return /(^|\.)google\.[a-z.]+$/i.test(hostname) || hostname === 'maps.app.goo.gl' || hostname === 'goo.gl' || hostname.includes('consent.google.');
}

function unwrapGoogleUrl(inputUrl: string): string {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.hostname.includes('consent.google.') || parsed.searchParams.has('continue')) {
      const continueTarget = parsed.searchParams.get('continue');
      if (continueTarget && /^https?:\/\//i.test(continueTarget)) {
        return unwrapGoogleUrl(continueTarget);
      }
    }
    if (parsed.searchParams.has('q') && /^https?:\/\//i.test(parsed.searchParams.get('q') || '')) {
      return unwrapGoogleUrl(parsed.searchParams.get('q')!);
    }
    return inputUrl;
  } catch {
    return inputUrl;
  }
}

function extractCoordinates(value: string) {
  const decodedValue = decodeURIComponent(value);
  const coordinateMatch = decodedValue.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
    || decodedValue.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    || decodedValue.match(/[?&](?:q|query|ll|sll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    || decodedValue.match(/\/search\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    || decodedValue.match(/\/dir\/[^\/]*\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!coordinateMatch) return null;

  const lat = Number(coordinateMatch[1]);
  const lng = Number(coordinateMatch[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

function parseGoogleMapsLink(rawUrl: string): ParsedGoogleMapsLink | null {
  try {
    const value = unwrapGoogleUrl(rawUrl);
    const url = new URL(value);
    if (!isGoogleMapsHost(url.hostname)) return null;

    const nameMatch = url.pathname.match(/\/maps\/place\/([^/@?]+)/i);
    const coordinates = extractCoordinates(url.href);

    let candidateName = nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, ' ') : url.searchParams.get('q') || undefined;
    if (candidateName && (candidateName.toLowerCase().includes('google maps') || candidateName.toLowerCase().includes('consent') || /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(candidateName))) {
      candidateName = undefined;
    }

    return {
      name: candidateName,
      ...coordinates,
      placeId: url.searchParams.get('query_place_id') || url.searchParams.get('place_id') || undefined,
    };
  } catch {
    return null;
  }
}

async function geocodeWithNominatim(query: string): Promise<{ lat: number; lng: number; address: string; displayName: string } | null> {
  try {
    const cleanQuery = query.replace(/[+_-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanQuery) return null;

    const searchTarget = /siwa/i.test(cleanQuery) ? cleanQuery : `${cleanQuery}, Siwa, Egypt`;
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTarget)}&format=json&addressdetails=1&limit=1`;

    const res = await fetch(endpoint, {
      headers: { 'User-Agent': 'SiwaOasisImporter/2.0 (contact@siwify.com)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const match = data[0];
      const lat = Number(match.lat);
      const lng = Number(match.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          lat,
          lng,
          address: match.display_name || '',
          displayName: match.name || match.display_name?.split(',')?.[0] || query,
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim geocoding fallback failed:', err);
  }
  return null;
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeExtractedText(value: string) {
  return value.replace(/\r/g, '\n').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').replace(/\s+/g, ' ').trim();
}

function extractTextSourceData(rawText: string): GooglePlaceData {
  const parsed = parseHospitalityRawText(rawText || '');
  const text = normalizeExtractedText(rawText || '');
  const coordinates = extractCoordinates(text);

  const name = parsed.basic.name || 'Imported Business';
  const address = parsed.basic.address || (coordinates ? 'Siwa Oasis, Egypt' : 'Siwa Oasis, Egypt');
  const phone = parsed.connector.phone || parsed.basic.phone || '';
  const website = parsed.connector.website || parsed.basic.booking_url || '';
  const rating = parsed.testimonials.rating ? +(parsed.testimonials.rating / 2).toFixed(1) : 0; // standard 5-star scale for GooglePlaceData
  const reviews = (parsed.testimonials.review_highlights || []).map((r: any) => ({
    author_name: r.author || 'Guest',
    text: r.text,
    rating: 5,
    country: r.country,
  }));

  // Build structured AI draft sections from parsed hospitality data
  const aiSections: Record<string, Record<string, unknown>> = {
    sec_1_identity: parsed.basic,
    sec_2_ambience: parsed.vibe,
    sec_3_facilities: parsed.facilities,
    sec_4_gastronomy: parsed.gastronomy,
    sec_5_experiences: parsed.experience,
    sec_6_guardian: {},
    sec_7_investment: {},
    sec_8_connector: parsed.connector,
    sec_9_marketplace_catalog: parsed.rooms,
    sec_10_testimonials_faqs: {
      ...parsed.testimonials,
      reviews,
    }
  };

  return {
    name: String(name).trim() || 'Imported Business',
    address,
    phone,
    website,
    lat: coordinates?.lat || 29.2032,
    lng: coordinates?.lng || 25.5195,
    rating,
    reviews,
    photos: [],
    placeId: `manual_text_${crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)}`,
    sourceProvider: 'manual_text',
    sourceUrl: parsed.basic.booking_url || '',
    detailsAvailable: true,
    aiDraft: {
      suggested_type: 'accommodation',
      confidence: 0.95,
      sections: aiSections,
      missing_fields: [],
      verification_notes: ['Extracted and structured via Smart Hospitality Parser'],
    }
  };
}

async function extractGoogleMapsData(rawLink: string): Promise<GooglePlaceData> {
  const link = unwrapGoogleUrl(rawLink);
  let finalUrl = link;
  let html = '';

  try {
    const response = await fetch(link, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    finalUrl = unwrapGoogleUrl(response.url || link);
    if (response.ok) {
      html = await response.text();
    }
  } catch (fetchErr: any) {
    console.warn('Google Maps direct fetch notice:', fetchErr?.message || fetchErr);
  }

  if (html) {
    const metaRefresh = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i);
    if (metaRefresh && metaRefresh[1]) {
      finalUrl = unwrapGoogleUrl(metaRefresh[1]);
    }
  }

  const parsedUrl = parseGoogleMapsLink(finalUrl) || parseGoogleMapsLink(link) || {};
  let coordinates: { lat?: number; lng?: number } = parsedUrl.lat !== undefined && parsedUrl.lng !== undefined
    ? { lat: parsedUrl.lat, lng: parsedUrl.lng }
    : extractCoordinates(html) || {};

  const structuredData: any[] = [];
  if (html) {
    for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const parsed = JSON.parse(match[1]);
        structuredData.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      } catch {}
    }
  }
  const schema = structuredData.find(item => item?.name || item?.geo) || {};
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);

  let rawName = schema.name || parsedUrl.name || (metaTitle ? decodeHtml(metaTitle[1]) : titleMatch ? decodeHtml(titleMatch[1]).replace(/\s*-\s*Google Maps.*$/i, '') : '');
  if (rawName && (/^google maps$/i.test(rawName.trim()) || /before you continue to google/i.test(rawName) || /^consent/i.test(rawName))) {
    rawName = parsedUrl.name || '';
  }
  let name = rawName || 'Imported Place';

  let address = typeof schema.address === 'string'
    ? schema.address
    : schema.address ? [schema.address.streetAddress, schema.address.addressLocality, schema.address.addressRegion, schema.address.postalCode, schema.address.addressCountry].filter(Boolean).join(', ') : '';

  const geo = schema.geo || {};
  if (coordinates.lat === undefined || coordinates.lng === undefined) {
    if (Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude))) {
      coordinates = { lat: Number(geo.latitude), lng: Number(geo.longitude) };
    }
  }

  if ((coordinates.lat === undefined || coordinates.lng === undefined || !address) && name && name !== 'Imported Place') {
    const geoFallback = await geocodeWithNominatim(name);
    if (geoFallback) {
      if (coordinates.lat === undefined || coordinates.lng === undefined) {
        coordinates = { lat: geoFallback.lat, lng: geoFallback.lng };
      }
      if (!address) {
        address = geoFallback.address;
      }
    }
  }

  const photos = (Array.isArray(schema.image) ? schema.image : schema.image ? [schema.image] : [])
    .filter((photo: unknown): photo is string => typeof photo === 'string')
    .slice(0, 5);
  const placeIdMatch = finalUrl.match(/!1s([^!]+)/);

  const finalLat = coordinates.lat !== undefined ? coordinates.lat : 29.2032;
  const finalLng = coordinates.lng !== undefined ? coordinates.lng : 25.5195;

  return {
    name,
    address: address || 'Siwa Oasis, Matrouh Governorate, Egypt',
    phone: schema.telephone || '',
    website: schema.url && !String(schema.url).includes('google.') ? schema.url : '',
    lat: finalLat,
    lng: finalLng,
    rating: Number(schema.aggregateRating?.ratingValue || 0),
    reviews: [],
    photos,
    placeId: parsedUrl.placeId || (placeIdMatch ? decodeURIComponent(placeIdMatch[1]) : `google_maps_${finalLat}_${finalLng}`),
    sourceProvider: 'google_maps',
    sourceUrl: rawLink,
    detailsAvailable: Boolean(coordinates.lat !== undefined && coordinates.lng !== undefined),
  };
}

function providerFromUrl(link: string) {
  const hostname = new URL(link).hostname.toLowerCase().replace(/^www\./, '');
  if (hostname.includes('google.')) return 'google_maps';
  if (hostname.includes('booking.com')) return 'booking.com';
  if (hostname.includes('tripadvisor.')) return 'tripadvisor';
  if (hostname.includes('airbnb.')) return 'airbnb';
  return hostname;
}

function isSafePublicSourceUrl(link: string) {
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '::1' || hostname === '0.0.0.0' || hostname.endsWith('.local')) return false;
    if (/^(10|127)\./.test(hostname) || /^192\.168\./.test(hostname) || /^169\.254\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function extractMetaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)`, 'i'));
  return match?.[1] || '';
}

async function extractGenericSourceData(link: string): Promise<GooglePlaceData> {
  let html = '';
  try {
    const response = await fetch(link, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      },
    });
    if (response.ok) {
      html = await response.text();
    }
  } catch (fetchErr: any) {
    console.warn('Generic source fetch notice:', fetchErr?.message || fetchErr);
  }

  // If HTML was obtained, parse structured schema and metadata
  const structuredData: any[] = [];
  if (html) {
    for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const parsed = JSON.parse(match[1]);
        structuredData.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      } catch {}
    }
  }

  const schema = structuredData.find(item => item?.name || item?.address || item?.geo) || {};
  const titleMatch = html ? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) : null;
  const parsedFromText = html ? parseHospitalityRawText(html) : null;

  let rawName = schema.name || extractMetaContent(html, 'og:title') || (titleMatch ? decodeHtml(titleMatch[1]) : '');
  if (!rawName) {
    try {
      const u = new URL(link);
      const slugPart = u.pathname.split('/').filter(Boolean).pop()?.replace(/[-_.]+/g, ' ') || 'Imported Business';
      rawName = slugPart.replace(/\.html?$/i, '').replace(/hotel\s+eg\s+/i, '').replace(/\b\w/g, l => l.toUpperCase());
    } catch {
      rawName = 'Imported Business';
    }
  }
  const name = rawName || 'Imported Business';

  const address = typeof schema.address === 'string'
    ? schema.address
    : schema.address ? [schema.address.streetAddress, schema.address.addressLocality, schema.address.addressRegion, schema.address.postalCode, schema.address.addressCountry].filter(Boolean).join(', ') : (parsedFromText?.basic.address || 'Siwa Oasis, Egypt');

  const geo = schema.geo || {};
  const lat = Number(geo.latitude) || 29.2032;
  const lng = Number(geo.longitude) || 25.5195;
  const image = schema.image || extractMetaContent(html, 'og:image');
  const photos = (Array.isArray(image) ? image : image ? [image] : []).filter((photo: unknown): photo is string => typeof photo === 'string').slice(0, 5);
  const rating = Number(schema.aggregateRating?.ratingValue || parsedFromText?.testimonials.rating || 0);

  const place: GooglePlaceData = {
    name,
    address,
    phone: schema.telephone || parsedFromText?.connector.phone || '',
    website: schema.url || link,
    lat,
    lng,
    rating,
    reviews: parsedFromText?.testimonials.review_highlights || [],
    photos,
    placeId: schema.identifier || `${providerFromUrl(link)}_${crypto.createHash('sha256').update(link).digest('hex').slice(0, 16)}`,
    sourceProvider: providerFromUrl(link),
    sourceUrl: link,
    detailsAvailable: Boolean(html && (schema.name || schema.geo)),
  };

  if (parsedFromText) {
    place.aiDraft = {
      suggested_type: 'accommodation',
      confidence: 0.9,
      sections: {
        sec_1_identity: parsedFromText.basic,
        sec_2_ambience: parsedFromText.vibe,
        sec_3_facilities: parsedFromText.facilities,
        sec_4_gastronomy: parsedFromText.gastronomy,
        sec_5_experiences: parsedFromText.experience,
        sec_6_guardian: {},
        sec_7_investment: {},
        sec_8_connector: parsedFromText.connector,
        sec_9_marketplace_catalog: parsedFromText.accommodation,
        sec_10_testimonials_faqs: parsedFromText.testimonials,
      },
      missing_fields: [],
      verification_notes: ['Structured via Universal Hospitality Parser'],
    };
  }

  return place;
}

// Helper to create URL-friendly slugs
function slugify(text: string) {
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
  return slug || `google-place-${crypto.randomUUID().slice(0, 8)}`;
}

// POST: Resolve URL/query or save the imported business
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { action = 'fetch' } = body;

    if (action === 'providers') {
      return NextResponse.json({ providers: getConfiguredAiProviders() });
    }

    if (action === 'detect_category') {
      const { text = '', url = '' } = body;
      const detected = detectBusinessCategory(text, url);
      return NextResponse.json({ success: true, detected });
    }

    if (action === 'chat') {
      const { messages, sourceCategory, sourceParentCategory, sourceUrl, adminConfirmed, aiProvider = 'built_in', draft } = body;
      const supportedProviders: SourceAiProvider[] = ['built_in', 'gemini', 'openai', 'claude', 'ollama', 'manus'];
      if (sourceCategory !== undefined && typeof sourceCategory !== 'string') {
        return NextResponse.json({ error: 'Business category must be text when provided.' }, { status: 400 });
      }
      if (sourceParentCategory !== undefined && typeof sourceParentCategory !== 'string') {
        return NextResponse.json({ error: 'Business parent category must be text when provided.' }, { status: 400 });
      }
      if (sourceUrl !== undefined && typeof sourceUrl !== 'string') {
        return NextResponse.json({ error: 'Source link must be text when provided.' }, { status: 400 });
      }
      if (!supportedProviders.includes(aiProvider)) {
        return NextResponse.json({ error: 'Unsupported AI provider.' }, { status: 400 });
      }
      if (!Array.isArray(messages) || !messages.length || messages.some((message: SourceAgentChatMessage) => !['user', 'assistant'].includes(message?.role) || typeof message?.content !== 'string')) {
        return NextResponse.json({ error: 'A valid chat message is required.' }, { status: 400 });
      }
      try {
        const reply = await chatWithSourceAgent(aiProvider, messages.slice(-12), String(sourceCategory), String(sourceUrl), draft, adminConfirmed === true);
        return NextResponse.json({ reply, aiProvider });
      } catch (error: any) {
        return NextResponse.json({ error: error.message || 'The selected AI agent could not reply.' }, { status: 502 });
      }
    }

    // ─── ACTION 1: FETCH DATA ──────────────────────────────────────────────
    if (action === 'fetch') {
      let { urlOrQuery, sourceText, sourceMode = 'url', sourceCategory, sourceParentCategory, adminConfirmed = true, plan_approved = true, aiProvider = 'built_in' } = body;

      // Smart Auto-detect or resolve category
      const detected = detectBusinessCategory(sourceText || '', urlOrQuery || '');
      let resolvedCategory = String(sourceCategory || '').trim();
      let resolvedParentCategory = String(sourceParentCategory || '').trim();

      if (!resolvedCategory) {
        resolvedCategory = detected.childId;
        resolvedParentCategory = detected.parentId;
      }

      // Verify category in DB or fallback
      const categoryRow = await queryOne('SELECT id, name, is_parent, parent_id FROM business_types WHERE id = ?', [resolvedCategory]) as any;
      if (!categoryRow || categoryRow.is_parent) {
        resolvedCategory = detected.childId || 'hotel';
        resolvedParentCategory = detected.parentId || 'accommodation';
      } else if (categoryRow.parent_id) {
        resolvedParentCategory = categoryRow.parent_id;
      }

      const supportedProviders: SourceAiProvider[] = ['built_in', 'gemini', 'openai', 'claude', 'ollama', 'manus'];
      if (!supportedProviders.includes(aiProvider)) {
        aiProvider = 'built_in';
      }

      const mode = sourceMode === 'text' ? 'text' : 'url';

      if (mode === 'text') {
        const rawText = String(sourceText || '').trim();
        if (!rawText) {
          return NextResponse.json({ error: 'Please paste the source text or extracted business details to analyze.' }, { status: 400 });
        }

        try {
          const place = extractTextSourceData(rawText);
          place.aiDraft = await enrichSourceWithAi(aiProvider, place, resolvedCategory);
          return NextResponse.json({
            success: true,
            source: 'manual_text',
            aiProvider,
            place,
            sourceType: 'text',
            category: resolvedCategory,
            parentCategory: resolvedParentCategory,
            detectedCategory: detected
          });
        } catch (e: any) {
          console.error('Text-source import failed:', e);
          return NextResponse.json({ error: e.message || 'Could not analyze the supplied text.' }, { status: 502 });
        }
      }

      const normalizedInput = String(urlOrQuery || '').trim();
      let place: GooglePlaceData;

      try {
        if (/^https?:\/\//i.test(normalizedInput)) {
          if ((normalizedInput.match(/https?:\/\//gi) || []).length !== 1) {
            return NextResponse.json({ error: 'Submit exactly one source link per import.' }, { status: 400 });
          }
          if (!isSafePublicSourceUrl(normalizedInput)) {
            return NextResponse.json({ error: 'Use one public HTTPS source link. Local, private-network, and non-HTTPS URLs are not allowed.' }, { status: 400 });
          }
          place = parseGoogleMapsLink(normalizedInput)
            ? await extractGoogleMapsData(normalizedInput)
            : await extractGenericSourceData(normalizedInput);
        } else if (normalizedInput.length >= 2) {
          const geoResult = await geocodeWithNominatim(normalizedInput);
          const name = geoResult?.displayName || normalizedInput;
          const lat = geoResult?.lat || 29.2032;
          const lng = geoResult?.lng || 25.5195;
          const address = geoResult?.address || `${normalizedInput}, Siwa Oasis, Egypt`;

          place = {
            name,
            address,
            phone: '',
            website: '',
            lat,
            lng,
            rating: 0,
            reviews: [],
            photos: [],
            placeId: `search_${crypto.createHash('sha256').update(normalizedInput).digest('hex').slice(0, 16)}`,
            sourceProvider: 'location_search',
            sourceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedInput + ' Siwa Egypt')}`,
            detailsAvailable: Boolean(geoResult),
          };
        } else {
          return NextResponse.json({ error: 'Please enter a valid website link, Google Maps link, or place name to search.' }, { status: 400 });
        }

        place.aiDraft = await enrichSourceWithAi(aiProvider, place, resolvedCategory);
        return NextResponse.json({
          success: true,
          source: place.sourceProvider || 'source_import',
          aiProvider,
          place,
          sourceType: 'url',
          category: resolvedCategory,
          parentCategory: resolvedParentCategory,
          detectedCategory: detected
        });
      } catch (e: any) {
        console.error('Source import failed:', e);
        return NextResponse.json({ error: e.message || 'Could not read or process the supplied source.' }, { status: 502 });
      }
    }

    if (action === 'approve') {
      const { businessId, decision = 'approved', notes = '' } = body;
      if (!businessId) {
        return NextResponse.json({ error: 'A business ID is required to approve or publish the import.' }, { status: 400 });
      }

      const validDecisions = ['pending', 'approved', 'rejected', 'published', 'hidden'];
      if (!validDecisions.includes(decision)) {
        return NextResponse.json({ error: 'Unsupported approval decision.' }, { status: 400 });
      }

      const statusMap: Record<string, { status: string; published: number; approved_by_vendor: number }> = {
        pending: { status: 'pending', published: 0, approved_by_vendor: 0 },
        approved: { status: 'active', published: 0, approved_by_vendor: 0 },
        rejected: { status: 'rejected', published: 0, approved_by_vendor: 0 },
        published: { status: 'active', published: 1, approved_by_vendor: 0 },
        hidden: { status: 'active', published: 0, approved_by_vendor: 0 },
      };

      const nextState = statusMap[decision];
      await execute(
        `UPDATE businesses SET status = ?, published = ?, approved_by_vendor = ?, updated_at = CURRENT_TIMESTAMP, custom_data = JSON_SET(COALESCE(custom_data, '{}'), '$.admin_decision', JSON_OBJECT('decision', ?, 'processed_by', ?, 'processed_at', ?, 'notes', ?)) WHERE id = ?`,
        [nextState.status, nextState.published, nextState.approved_by_vendor, decision, user.email, new Date().toISOString(), notes || '', businessId]
      );

      return NextResponse.json({ success: true, decision, status: nextState.status, published: nextState.published });
    }

    // ─── ACTION 2: SAVE BUSINESS & NOTIFY ADMIN ────────────────────────────
    if (action === 'save') {
      const {
        name,
        type_id,
        source_url,
        source_category,
        source_parent_category,
        source_mode,
        source_provenance,
        policy_updates,
        regulation_updates,
        admin_confirmed,
        plan_approved,
        ai_provider = 'built_in',
        google_place_id,
        contributor_name,
        google_data,
        publish_immediately = true,
      } = body;
      
      let effectiveName = String(name || google_data?.name || '').trim();
      let effectiveTypeId = String(type_id || source_category || '').trim();
      const effectivePlaceId = String(google_place_id || google_data?.placeId || `import_${Date.now()}`).trim();
      const effectiveSourceUrl = String(source_url || google_data?.sourceUrl || effectivePlaceId || 'source_import').trim();

      // Safety: if name is a single generic venue-category word (e.g. "Beach", "Hotel"), prefer google_data.name
      const GENERIC_NAME_RE = /^(beach|hotel|resort|camp|hostel|restaurant|cafe|spa|lodge|villa|inn|guesthouse|guest house|adventure|safari|tour|apartment|flat|room|chalet|bungalow|motel|property|accommodation|riad|retreat|farm)$/i;
      if (GENERIC_NAME_RE.test(effectiveName)) {
        const fallback = String(google_data?.name || '').trim();
        if (fallback && !GENERIC_NAME_RE.test(fallback)) {
          effectiveName = fallback;
        }
      }

      if (!effectiveName) {
        effectiveName = 'Imported Hospitality Business';
      }
      if (!effectiveTypeId) {
        effectiveTypeId = 'hotel';
      }

      // Check if selected type is valid leaf child; if not, find appropriate child or default to hotel
      let selectedTypeRow = await queryOne('SELECT id, name, is_parent, parent_id FROM business_types WHERE id = ?', [effectiveTypeId]) as any;
      if (!selectedTypeRow || selectedTypeRow.is_parent) {
        // If user passed a parent category ID like 'accommodation', pick its first child (e.g. 'hotel')
        const firstChild = await queryOne('SELECT id, name, is_parent, parent_id FROM business_types WHERE parent_id = ? AND is_parent = 0 LIMIT 1', [effectiveTypeId]) as any;
        if (firstChild) {
          effectiveTypeId = firstChild.id;
          selectedTypeRow = firstChild;
        } else {
          effectiveTypeId = 'hotel';
          selectedTypeRow = await queryOne('SELECT id, name, is_parent, parent_id FROM business_types WHERE id = "hotel"') as any;
        }
      }

      const supportedProviders: SourceAiProvider[] = ['built_in', 'gemini', 'openai', 'claude', 'ollama', 'manus'];
      if (!supportedProviders.includes(ai_provider)) {
        aiProvider = 'built_in';
      }

      const effectiveLat = Number(google_data?.lat) || 29.2032;
      const effectiveLng = Number(google_data?.lng) || 25.5195;

      // ─── LOAD REAL SECTION IDs FOR THIS TYPOLOGY ────────────────────────────
      // The minisite renders data[section.id] where section.id is the real DB id
      // (e.g. "hotel_info", "restaurant_menu", "experience"). We must map our
      // sec_N_* extracted fields into those real IDs so the minisite finds them.
      let realSectionIds: string[] = [];
      try {
        const typeDataForSections = await queryOne(
          'SELECT sections, own_sections FROM business_types WHERE id = ?',
          [effectiveTypeId]
        ) as any;
        if (typeDataForSections) {
          const s1 = typeof typeDataForSections.sections === 'string'
            ? JSON.parse(typeDataForSections.sections || '[]')
            : (typeDataForSections.sections || []);
          const s2 = typeof typeDataForSections.own_sections === 'string'
            ? JSON.parse(typeDataForSections.own_sections || '[]')
            : (typeDataForSections.own_sections || []);
          realSectionIds = [...s1, ...s2].filter(Boolean);
        }
      } catch { /* non-fatal: fall back to sec_N keys */ }

      // Format custom_data matching core typology schema
      const aiDraft = google_data?.aiDraft as OllamaDraft | undefined;
      const importedSections = aiDraft?.sections || emptyImportSections();
      const normalizedPolicyText = typeof policy_updates === 'string' ? policy_updates.trim() : '';
      const normalizedRegulationText = typeof regulation_updates === 'string' ? regulation_updates.trim() : '';

      // ─── SECTION-TO-FIELDS MAPPING ──────────────────────────────────────────
      // Each real section gets ONLY the fields that belong to it.
      // This avoids repeating all data in every section tab on the minisite.
      const extractedIdentity   = (importedSections.sec_1_identity            || {}) as Record<string, unknown>;
      const extractedAmbience   = (importedSections.sec_2_ambience            || {}) as Record<string, unknown>;
      const extractedFacilities = (importedSections.sec_3_facilities          || {}) as Record<string, unknown>;
      const extractedGastro     = (importedSections.sec_4_gastronomy          || {}) as Record<string, unknown>;
      const extractedExp        = (importedSections.sec_5_experiences         || {}) as Record<string, unknown>;
      const extractedConnector  = (importedSections.sec_8_connector           || {}) as Record<string, unknown>;
      const extractedRooms        = (importedSections.sec_9_marketplace_catalog || {}) as Record<string, unknown>;
      const extractedTestimons  = (importedSections.sec_10_testimonials_faqs  || {}) as Record<string, unknown>;

      const resolvedPhone   = google_data?.phone   || (extractedIdentity.phone   as string) || (extractedConnector.contact_phone   as string) || '';
      const resolvedWebsite = google_data?.website || (extractedIdentity.website as string) || (extractedConnector.official_website as string) || '';
      const resolvedAddress = google_data?.address || (extractedIdentity.address as string) || 'Siwa Oasis, Egypt';
      const resolvedRating  = google_data?.rating  || (extractedTestimons.rating as number) || 0;
      const resolvedDesc    = (extractedIdentity.description as string) || `${effectiveName} in Siwa Oasis. Rating: ${resolvedRating}/5.`;

      // ── INTERNAL FIELDS: hidden from minisite visitors ──────────────────────
      const INTERNAL_KEYS = new Set([
        'lat','lng','latitude','longitude','source_place_id','source_provider',
        'source_origin','verification_status','imported_at','google_maps_url',
        'photos','source_id','section_news',
      ]);

      // ── AUTO-GENERATE SECTION BLOG BASED ON EXTRACTED FIELD DATA ────────────
      function buildSectionBlog(kind: string, fields: Record<string, unknown>): string {
        if (kind === 'identity' || kind === 'basic') {
          const desc = (fields.description as string) || `${effectiveName} is an authentic eco-heritage establishment located in Siwa Oasis.`;
          return `<h3>Overview &amp; Profile Specifications</h3><p>${desc}</p><p>Combining traditional desert craftsmanship with verified hospitality standards, <strong>${effectiveName}</strong> serves as a gateway to exploring the natural wonders of Siwa Oasis—from historic salt lakes and palm groves to the ancient Shali citadel.</p>`;
        }
        if (kind === 'vibe') {
          const vibe = (fields.vibe as string) || 'Authentic Siwan Eco';
          const arch = (fields.architecture as string) || 'Traditional Kershef & Palm Wood';
          const atmos = (fields.atmosphere as string) || 'Serene Desert Oasis Setting';
          return `<h3>Vibe, Architecture &amp; Desert Aesthetics</h3><p>The atmosphere at <strong>${effectiveName}</strong> is defined by <em>${vibe}</em> styling, designed to blend harmoniously into the oasis landscape. Construction features <strong>${arch}</strong>—a centuries-old building technique using sun-dried salt rock, clay, and palm timbers that naturally regulates indoor climate.</p><p>Guests experience a <em>${atmos}</em> with open-air relaxation courtyards, soft ambient desert lighting, and acoustic tranquility far from city noise.</p>`;
        }
        if (kind === 'facilities') {
          const wifi = fields.wifi ? 'Complimentary High-Speed WiFi' : 'Digital Detox Setting';
          const ac = fields.air_conditioning ? 'Climate-Controlled Suites' : 'Natural Kershef Passive Thermal Cooling';
          const pool = fields.pool ? 'Oasis Spring Pool Access' : 'Proximity to Thermal Salt Springs';
          const dining = fields.restaurant_on_site ? 'On-Site Organic Siwan Kitchen' : 'Curated Local Dining Partnerships';
          return `<h3>Amenities &amp; Facility Specifications</h3><p><strong>${effectiveName}</strong> offers a range of curated amenities tailored for desert comfort and sustainability:</p><ul style="margin-left:1.5rem; margin-bottom:1rem; line-height:1.8;"><li><strong>Connectivity:</strong> ${wifi}</li><li><strong>Climate Comfort:</strong> ${ac}</li><li><strong>Water &amp; Relaxation:</strong> ${pool}</li><li><strong>Gastronomy:</strong> ${dining}</li></ul><p>All facilities strictly adhere to Siwa Oasis eco-preservation standards, ensuring minimal environmental impact while maintaining high hospitality quality.</p>`;
        }
        if (kind === 'experience' || kind === 'gastronomy') {
          const expType = (fields.experience_type as string) || (fields.cuisine as string) || 'Desert Safaris & Heritage Exploration';
          const dur = (fields.duration as string) || 'Half-Day & Multi-Day Itineraries';
          return `<h3>Curated Experiences &amp; Guided Excursions</h3><p>Guests at <strong>${effectiveName}</strong> can partake in specialized <em>${expType}</em> operating across Siwa's iconic landscapes. Programs feature <strong>${dur}</strong> with expert local Bedouin guides.</p><p>Popular curated activities include Great Sand Sea 4x4 safaris, sunset tea over Fatnas Island, therapeutic dips in natural salt lakes, and starlight fireside storytelling.</p>`;
        }
        if (kind === 'location') {
          const addr = (fields.address as string) || resolvedAddress || 'Siwa Oasis, Matrouh Governorate, Egypt';
          return `<h3>Location &amp; Travel Specifications</h3><p><strong>${effectiveName}</strong> is located at <em>${addr}</em>. Positioned among date palm groves and salt springs, the property provides convenient access to key historical and natural landmarks including Shali Fortress, Cleopatra Spring, and the Temple of the Oracle.</p>`;
        }
        if (kind === 'offers') {
          return `<h3>Seasonal Offers &amp; Package Specifications</h3><p><strong>${effectiveName}</strong> offers customizable stay packages, desert retreat bundles, and group excursion rates throughout the season. Enquire directly via WhatsApp or phone for current rates and safari bundles.</p>`;
        }
        if (kind === 'gallery') {
          return `<h3>Visual Documentation &amp; Media Specifications</h3><p>Photographic archive showcasing the architectural details, palm gardens, guest suites, and surrounding oasis scenery of <strong>${effectiveName}</strong>.</p>`;
        }
        if (kind === 'testimonials') {
          return `<h3>Guest Impressions &amp; Quality Specifications</h3><p>Verified visitor feedback and guest reviews celebrating the authentic Bedouin hospitality and service quality at <strong>${effectiveName}</strong>.</p>`;
        }
        return `<h3>${kind} Specifications</h3><p>Specification overview for <strong>${effectiveName}</strong>.</p>`;
      }

      // ── SECTION-SPECIFIC DATA BLOCKS ────────────────────────────────────────
      // identity / basic section
      const identityBlock = {
        name: effectiveName,
        description: resolvedDesc,
        address: resolvedAddress,
        phone: resolvedPhone,
        website: resolvedWebsite,
        lat: effectiveLat,
        lng: effectiveLng,
        rating: resolvedRating,
        section_news: `${effectiveName} in Siwa Oasis`,
        section_blog: buildSectionBlog('basic', { description: resolvedDesc }),
        mini_blog: buildSectionBlog('basic', { description: resolvedDesc }),
        ...(Object.fromEntries(Object.entries(extractedIdentity).filter(([k]) => !INTERNAL_KEYS.has(k)))),
      };

      // ambience / vibe section
      const ambienceFields = Object.keys(extractedAmbience).length ? extractedAmbience : { vibe: 'Siwa Oasis', atmosphere: 'Relaxed Desert Setting' };
      const ambienceBlock = {
        ...ambienceFields,
        description: resolvedDesc,
        section_blog: buildSectionBlog('vibe', ambienceFields),
        mini_blog: buildSectionBlog('vibe', ambienceFields),
      };

      // facilities section
      const facilitiesFields = Object.keys(extractedFacilities).length ? extractedFacilities : {};
      const facilitiesBlock = {
        ...facilitiesFields,
        description: `Facilities at ${effectiveName}`,
        section_blog: buildSectionBlog('facilities', facilitiesFields),
        mini_blog: buildSectionBlog('facilities', facilitiesFields),
      };

      // gastronomy section
      const gastronomyBlock = {
        ...(Object.keys(extractedGastro).length ? extractedGastro : {}),
        description: `Dining & cuisine at ${effectiveName}`,
        section_blog: buildSectionBlog('gastronomy', extractedGastro),
        mini_blog: buildSectionBlog('gastronomy', extractedGastro),
      };

      // experience / activity section
      const experienceBlock = {
        ...(Object.keys(extractedExp).length ? extractedExp : {}),
        description: `Experiences at ${effectiveName}`,
        section_blog: buildSectionBlog('experience', extractedExp),
        mini_blog: buildSectionBlog('experience', extractedExp),
      };

      // connector / contact section
      const connectorBlock = {
        contact_phone: resolvedPhone,
        whatsapp: resolvedPhone,
        official_website: resolvedWebsite,
        description: `Contact ${effectiveName}`,
        section_blog: buildSectionBlog('contact', { phone: resolvedPhone }),
        mini_blog: buildSectionBlog('contact', { phone: resolvedPhone }),
        ...(Object.fromEntries(Object.entries(extractedConnector).filter(([k]) => !INTERNAL_KEYS.has(k)))),
      };

      // testimonials / reviews section
      const testimonialsBlock = {
        rating: resolvedRating,
        reviews_count: (google_data?.reviews || []).length,
        highlight: resolvedRating >= 4.5 ? `Highly rated — ${resolvedRating}/5` : resolvedRating >= 4.0 ? `Well rated — ${resolvedRating}/5` : '',
        description: `Reviews for ${effectiveName}`,
        section_blog: buildSectionBlog('testimonials', { rating: resolvedRating }),
        mini_blog: buildSectionBlog('testimonials', { rating: resolvedRating }),
        ...(Object.fromEntries(Object.entries(extractedTestimons).filter(([k]) => !INTERNAL_KEYS.has(k)))),
      };

      // location section
      const locationBlock = {
        address: resolvedAddress,
        lat: effectiveLat,
        lng: effectiveLng,
        google_maps_embed_url: `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}&output=embed`,
        description: `Location of ${effectiveName}`,
        section_blog: buildSectionBlog('location', { address: resolvedAddress }),
        mini_blog: buildSectionBlog('location', { address: resolvedAddress }),
      };

      // gallery section
      const galleryBlock = {
        description: `Photo gallery & media for ${effectiveName}`,
        section_gallery: google_data?.photos || (extractedIdentity.photos as string[]) || [],
        section_blog: buildSectionBlog('gallery', {}),
        mini_blog: buildSectionBlog('gallery', {}),
      };

      // offers & deals section
      const offersBlock = {
        description: `Special offers, packages, and seasonal promotions for ${effectiveName}`,
        section_blog: buildSectionBlog('offers', {}),
        mini_blog: buildSectionBlog('offers', {}),
      };

      // rooms section (room types, total rooms, starting price)
      // Named 'rooms' to avoid conflict with 'accommodation' business-type parent category
      const roomsBlock = {
        description: `Rooms and accommodation options at ${effectiveName}`,
        section_blog: buildSectionBlog('accommodation', {}),
        mini_blog: buildSectionBlog('accommodation', {}),
        ...(Object.fromEntries(Object.entries(extractedRooms).filter(([k]) => !INTERNAL_KEYS.has(k)))),
      };

      const genericFallbackBlock = {
        description: `Information about ${effectiveName}`,
        section_blog: buildSectionBlog('generic', {}),
        mini_blog: buildSectionBlog('generic', {}),
      };

      // ── MAP SECTION IDs TO THEIR SPECIFIC BLOCK ─────────────────────────────
      function blockForSection(sectionId: string): Record<string, unknown> {
        const id = sectionId.toLowerCase();
        if (/basic|identity|info|about|overview|business_info/.test(id)) return identityBlock;
        if (/vibe|ambien|atmosphere|style|mood|feel/.test(id)) return ambienceBlock;
        if (/facilit|ameniti|feature|service|equipment/.test(id)) return facilitiesBlock;
        if (/gastro|food|dining|menu|cuisine|kitchen|drink|beverage/.test(id)) return gastronomyBlock;
        if (/experi|activit|tour|safari|adventure|trip|outdoor|excurs/.test(id)) return experienceBlock;
        if (/room|stay|chalet|suite|bed|catalog|lodging/.test(id)) return roomsBlock;
        if (/accommodat/.test(id)) return roomsBlock;
        if (/connect|contact|reach|enquir|social|phone|whatsapp/.test(id)) return connectorBlock;
        if (/testimon|review|rating|feedback|comment/.test(id)) return testimonialsBlock;
        if (/location|map|where|address|direction/.test(id)) return locationBlock;
        if (/gallery|photo|media|image/.test(id)) return galleryBlock;
        if (/offer|deal|package|discount|promo|bundle/.test(id)) return offersBlock;
        return genericFallbackBlock;
      }

      // ── INJECT INTO REAL SECTION IDs ────────────────────────────────────────
      const sectionMappedData: Record<string, unknown> = {};
      for (const sectionId of realSectionIds) {
        sectionMappedData[sectionId] = blockForSection(sectionId);
      }

      // admin-selected minisite sections (all enabled by default)
      const activeMinisite: string[] = body.active_minisite_sections
        ? (Array.isArray(body.active_minisite_sections) ? body.active_minisite_sections : [])
        : realSectionIds; // default: all

      const custom_data = {
        ...importedSections,        // sec_N_* archive
        ...sectionMappedData,       // ← real section IDs, section-specific blocks
        active_minisite_sections: activeMinisite,
        basic: {
          name: effectiveName,
          description: resolvedDesc,
        },
        location: locationBlock,
        contact: {
          phone: resolvedPhone,
          website: resolvedWebsite,
        },
        source_provenance: {
          source_url: effectiveSourceUrl,
          source_category: String(source_category || effectiveTypeId),
          source_mode: source_mode || source_provenance?.mode || 'unknown',
          source_mode_status: source_provenance?.status || (source_mode === 'text' ? 'saved_text' : 'live_url'),
          source_snapshot_captured_at: source_provenance?.capturedAt || new Date().toISOString(),
          admin_confirmed: Boolean(admin_confirmed),
          plan_approved: Boolean(plan_approved),
          source_provider: google_data?.sourceProvider || 'unknown',
          source_id: effectivePlaceId,
          ai_provider,
          policy_updated: Boolean(normalizedPolicyText),
          regulation_updated: Boolean(normalizedRegulationText)
        },
        policy_and_regulations: {
          policy_text: normalizedPolicyText || '',
          regulation_text: normalizedRegulationText || '',
          updated_by_admin: Boolean(admin_confirmed),
          updated_at: new Date().toISOString()
        },
        google_contribution: {
          google_place_id,
          rating: google_data.rating || 0,
          reviews: google_data.reviews || [],
          contributor_name: contributor_name || 'Anonymous Contributor',
          contributed_at: new Date().toISOString()
        },
        import_analysis: {
          provider: ai_provider,
          model: process.env[`${String(ai_provider).toUpperCase()}_MODEL`] || process.env.OLLAMA_MODEL || 'configured-default',
          confidence: aiDraft?.confidence || 0,
          missing_fields: aiDraft?.missing_fields || [],
          verification_notes: aiDraft?.verification_notes || [],
          plan_approved: Boolean(plan_approved),
          imported_at: new Date().toISOString(),
        }
      };

      const slug = slugify(name);
      
      // Auto-assign default template for 'free' subscription tier
      let template_id = null;
      try {
        const tierRow = await queryOne('SELECT default_template_id FROM subscription_tiers WHERE id = "free"') as any;
        if (tierRow?.default_template_id) {
          template_id = tierRow.default_template_id;
        }
      } catch {}

      const id = crypto.randomUUID();
      const shouldPublish = publish_immediately === true || body.publish === true;
      const targetStatus = shouldPublish ? 'active' : 'pending';
      const targetPublished = shouldPublish ? 1 : 0;

      await execute(
        `INSERT INTO businesses (id, name, slug, type_id, subscription_tier, template_id, custom_data, status, published, approved_by_vendor) 
         VALUES (?, ?, ?, ?, 'free', ?, ?, ?, ?, 0)`,
        [id, effectiveName, slug, effectiveTypeId, template_id, JSON.stringify(custom_data), targetStatus, targetPublished]
      );


      // Create Admin Dashboard Activity Log Notification
      try {
        const displayContributor = contributor_name?.trim() || 'Google Local Guide';
        await execute(
          `INSERT INTO activity_log (message, user_email) VALUES (?, ?)`,
          [`Google Import: New business "${name}" imported by contributor "${displayContributor}".`, 'system']
        );

        // Audit Log Entry
        await execute(
          `INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), user.id, user.email, user.role, 'import_business', `Imported via Google Maps: ${name} (Place ID: ${google_place_id})`]
        );
      } catch (e) {
        console.warn('Dashboard activity log notification skipped:', e);
      }

      return NextResponse.json({
        success: true,
        id,
        slug,
        name
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('Google Import Error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.message?.includes('authenticated') ? 401 : 500 });
  }
}
