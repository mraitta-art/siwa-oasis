import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import crypto from 'crypto';
import { createBusinessEntity } from '@/lib/business-creation';

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
  return /(^|\.)google\.[a-z.]+$/i.test(hostname) || hostname === 'maps.app.goo.gl' || hostname === 'goo.gl';
}

function extractCoordinates(value: string) {
  const decodedValue = decodeURIComponent(value);
  const coordinateMatch = decodedValue.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
    || decodedValue.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!coordinateMatch) return null;

  const lat = Number(coordinateMatch[1]);
  const lng = Number(coordinateMatch[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

function parseGoogleMapsLink(value: string): ParsedGoogleMapsLink | null {
  try {
    const url = new URL(value);
    if (!isGoogleMapsHost(url.hostname)) return null;

    const nameMatch = url.pathname.match(/\/maps\/place\/([^/@?]+)/i);
    const coordinates = extractCoordinates(url.href);

    return {
      name: nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, ' ') : url.searchParams.get('q') || undefined,
      ...coordinates,
      placeId: url.searchParams.get('query_place_id') || url.searchParams.get('place_id') || undefined,
    };
  } catch {
    return null;
  }
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

async function extractGoogleMapsData(link: string): Promise<GooglePlaceData> {
  const response = await fetch(link, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiwaOasisImporter/1.0)', Accept: 'text/html' },
  });
  if (!response.ok) throw new Error(`Google Maps returned HTTP ${response.status}`);

  const html = await response.text();
  const finalUrl = response.url || link;
  const parsedUrl = parseGoogleMapsLink(finalUrl) || parseGoogleMapsLink(link) || {};
  const coordinates: { lat?: number; lng?: number } = parsedUrl.lat !== undefined && parsedUrl.lng !== undefined
    ? { lat: parsedUrl.lat, lng: parsedUrl.lng }
    : extractCoordinates(html) || {};

  const structuredData: any[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      structuredData.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {}
  }
  const schema = structuredData.find(item => item?.name || item?.geo) || {};
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
  const name = schema.name || parsedUrl.name || (metaTitle ? decodeHtml(metaTitle[1]) : titleMatch ? decodeHtml(titleMatch[1]).replace(/\s*-\s*Google Maps.*$/i, '') : '');
  const address = typeof schema.address === 'string'
    ? schema.address
    : schema.address ? [schema.address.streetAddress, schema.address.addressLocality, schema.address.addressRegion, schema.address.postalCode, schema.address.addressCountry].filter(Boolean).join(', ') : '';
  const geo = schema.geo || {};
  const schemaCoordinates: { lat?: number; lng?: number } = Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude))
    ? { lat: Number(geo.latitude), lng: Number(geo.longitude) }
    : {};
  const finalCoordinates: { lat?: number; lng?: number } = coordinates.lat !== undefined && coordinates.lng !== undefined ? coordinates : schemaCoordinates;
  const photos = (Array.isArray(schema.image) ? schema.image : schema.image ? [schema.image] : [])
    .filter((photo: unknown): photo is string => typeof photo === 'string')
    .slice(0, 5);
  const placeIdMatch = finalUrl.match(/!1s([^!]+)/);

  if (!name || finalCoordinates.lat === undefined || finalCoordinates.lng === undefined) {
    throw new Error('The shared Google Maps page did not expose a readable place name and coordinates. Use the full place share link.');
  }

  return {
    name,
    address,
    phone: schema.telephone || '',
    website: schema.url && !String(schema.url).includes('google.') ? schema.url : '',
    lat: finalCoordinates.lat,
    lng: finalCoordinates.lng,
    rating: Number(schema.aggregateRating?.ratingValue || 0),
    reviews: [],
    photos,
    placeId: parsedUrl.placeId || (placeIdMatch ? decodeURIComponent(placeIdMatch[1]) : `google_maps_${finalCoordinates.lat}_${finalCoordinates.lng}`),
    detailsAvailable: true,
  };
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

    // ─── ACTION 1: FETCH DATA ──────────────────────────────────────────────
    if (action === 'fetch') {
      const { urlOrQuery } = body;
      if (!urlOrQuery?.trim()) {
        return NextResponse.json({ error: 'A Google Maps place share link is required' }, { status: 400 });
      }

      if (!/^https?:\/\//i.test(urlOrQuery.trim()) || !parseGoogleMapsLink(urlOrQuery.trim())) {
        return NextResponse.json({ error: 'Paste a Google Maps place share link. Search terms are not supported because this importer does not use the Google Places API.' }, { status: 400 });
      }

      try {
        const place = await extractGoogleMapsData(urlOrQuery.trim());
        place.aiDraft = await enrichWithOllama(place);
        return NextResponse.json({ success: true, source: 'Google Maps shared page', place });
      } catch (e: any) {
        console.error('Google Maps shared-link import failed:', e);
        return NextResponse.json({ error: e.message || 'Could not read the Google Maps shared link.' }, { status: 502 });
      }
    }

    // ─── ACTION 2: SAVE BUSINESS & NOTIFY ADMIN ────────────────────────────
    if (action === 'save') {
      const { name, type_id, google_place_id, contributor_name, google_data } = body;
      
      if (!name || !type_id || !google_place_id) {
        return NextResponse.json({ error: 'Name, typology, and Google Place ID are required to import' }, { status: 400 });
      }

      if (!google_data || !Number.isFinite(google_data.lat) || !Number.isFinite(google_data.lng)) {
        return NextResponse.json({ error: 'Real place coordinates are required. No business was imported.' }, { status: 400 });
      }

      // Format custom_data matching core typology schema
      const aiDraft = google_data.aiDraft as OllamaDraft | undefined;
      const importedSections = aiDraft?.sections || emptyImportSections();
      const custom_data = {
        ...importedSections,
        basic: {
          name,
          description: importedSections.sec_1_identity?.description || `Imported from Google Maps. Rating: ${google_data.rating || 0}/5.`,
        },
        location: {
          address: google_data.address || '',
          lat: google_data.lat,
          lng: google_data.lng
        },
        contact: {
          phone: google_data.phone || '',
          website: google_data.website || ''
        },
        google_contribution: {
          google_place_id,
          rating: google_data.rating || 0,
          reviews: google_data.reviews || [],
          contributor_name: contributor_name || 'Anonymous Contributor',
          contributed_at: new Date().toISOString()
        },
        import_analysis: {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
          confidence: aiDraft?.confidence || 0,
          missing_fields: aiDraft?.missing_fields || [],
          verification_notes: aiDraft?.verification_notes || [],
          imported_at: new Date().toISOString(),
        }
      };

      const created = await createBusinessEntity({
        name,
        type_id,
        custom_data,
        status: 'pending',
        is_standalone: true,
        source: 'google_maps_import',
        actor_id: user.id,
      });

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
        id: created.id,
        slug: created.slug,
        name
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('Google Import Error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.message?.includes('authenticated') ? 401 : 500 });
  }
}
