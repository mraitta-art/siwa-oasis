import { execute, queryOne } from '@/lib/db';
import { extractGooglePlaceId, hasConsent } from '@/lib/vendor-consents';
import { getBusinessPublicUrl } from '@/lib/public-url';
import { minisiteMatchesUrl, readVendorPledge } from '@/lib/vendor-pledge';

/**
 * Read-only Google Business Profile data.
 *
 * Uses the Places API (New) `places/{place_id}` endpoint, which returns public
 * profile data without any owner authorisation. Every lookup is billable, so
 * results are snapshotted into `businesses.custom_data.google_place` and only
 * refreshed once the snapshot ages past GOOGLE_PLACE_TTL_DAYS (default 7).
 *
 * Owner-level write access (replying to reviews, setting the website field) is
 * a different product: it needs Business Profile API approval + OAuth, and is
 * deliberately not implemented here.
 */

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';
const BASE_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'googleMapsUri',
  'websiteUri',
].join(',');
const REVIEWS_FIELD_MASK = 'reviews';

export interface GooglePlaceReview {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface GooglePlaceSnapshot {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  review_count: number | null;
  opening_hours: string[];
  maps_uri: string;
  website_uri: string;
  reviews: GooglePlaceReview[];
  fetched_at: string;
  source: 'places_api';
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

export function googlePlaceTtlMs(): number {
  const days = Number(process.env.GOOGLE_PLACE_TTL_DAYS || 7);
  return (Number.isFinite(days) && days > 0 ? days : 7) * 24 * 60 * 60 * 1000;
}

export function parseCustomData(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, any>;
  if (typeof value !== 'string') return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function readPlaceSnapshot(customData: unknown): GooglePlaceSnapshot | null {
  const snapshot = parseCustomData(customData).google_place;
  if (!snapshot || typeof snapshot !== 'object') return null;
  if (!snapshot.place_id || !snapshot.fetched_at) return null;
  return snapshot as GooglePlaceSnapshot;
}

export function isSnapshotFresh(snapshot: GooglePlaceSnapshot | null): boolean {
  if (!snapshot) return false;
  const fetched = new Date(snapshot.fetched_at).getTime();
  if (!Number.isFinite(fetched)) return false;
  return Date.now() - fetched < googlePlaceTtlMs();
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Normalises a Places API (New) payload into the cached snapshot shape. */
function toSnapshot(placeId: string, payload: any): GooglePlaceSnapshot {
  const hours = payload?.regularOpeningHours?.weekdayDescriptions;
  const reviews = Array.isArray(payload?.reviews) ? payload.reviews : [];

  return {
    place_id: placeId,
    name: payload?.displayName?.text || '',
    address: payload?.formattedAddress || '',
    rating: typeof payload?.rating === 'number' ? payload.rating : null,
    review_count: typeof payload?.userRatingCount === 'number' ? payload.userRatingCount : null,
    opening_hours: Array.isArray(hours) ? hours.slice(0, 7).map(String) : [],
    maps_uri: payload?.googleMapsUri || '',
    website_uri: payload?.websiteUri || '',
    reviews: reviews.slice(0, 3).map((review: any) => ({
      author: review?.authorAttribution?.displayName || 'Google user',
      rating: Number(review?.rating) || 0,
      text: String(review?.text?.text || '').slice(0, 600),
      relativeTime: String(review?.relativePublishTimeDescription || ''),
    })),
    fetched_at: new Date().toISOString(),
    source: 'places_api',
  };
}

export type PlaceLookupResult =
  | { ok: true; snapshot: GooglePlaceSnapshot }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'http_error'; status?: number; message?: string };

export async function fetchGooglePlace(placeId: string): Promise<PlaceLookupResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { ok: false, reason: 'not_configured' };

  const includeReviews =
    process.env.GOOGLE_PLACES_INCLUDE_REVIEWS === 'true' ||
    process.env.GOOGLE_PLACES_INCLUDE_REVIEWS === '1';

  const fieldMask = includeReviews ? `${BASE_FIELD_MASK},${REVIEWS_FIELD_MASK}` : BASE_FIELD_MASK;

  try {
    const response = await fetch(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await readJson(response);
      return {
        ok: false,
        reason: response.status === 404 ? 'not_found' : 'http_error',
        status: response.status,
        message: detail?.error?.message || `Places API responded ${response.status}`,
      };
    }

    const payload = await readJson(response);
    if (!payload) return { ok: false, reason: 'http_error', message: 'Empty Places API response' };

    return { ok: true, snapshot: toSnapshot(placeId, payload) };
  } catch (error: any) {
    return { ok: false, reason: 'http_error', message: error?.message || 'Places lookup failed' };
  }
}

/**
 * Maps share links (maps.app.goo.gl, google.com/maps/...) resolve server-side to
 * the canonical URL, which carries the ChIJ place id. Free — no Places SKU used.
 */
export async function resolvePlaceIdFromMapsUrl(input: string | null | undefined): Promise<string | null> {
  const direct = extractGooglePlaceId(input);
  if (direct) return direct;
  if (!input || typeof input !== 'string' || !/^https?:\/\//i.test(input.trim())) return null;

  try {
    const response = await fetch(input.trim(), {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiWiFyBot/1.0)' },
      cache: 'no-store',
    });
    return extractGooglePlaceId(response.url) || extractGooglePlaceId(await response.text().catch(() => ''));
  } catch {
    return null;
  }
}

export type SyncResult =
  | { ok: true; snapshot: GooglePlaceSnapshot; cached: boolean }
  | { ok: false; reason: 'no_consent' | 'no_place_id' | 'not_configured' | 'not_found' | 'http_error'; message?: string };

/**
 * Refreshes one business's Google snapshot when consent is granted and the
 * cached copy is stale. Safe to call from a dashboard button or a cron script.
 */
export async function syncBusinessGooglePlace(
  businessId: string,
  options: { force?: boolean } = {}
): Promise<SyncResult> {
  const business = await queryOne<any>(
    'SELECT id, slug, custom_data, google_place_id FROM businesses WHERE id = ? LIMIT 1',
    [businessId]
  );
  if (!business) return { ok: false, reason: 'no_place_id', message: 'Business not found.' };

  const customData = parseCustomData(business.custom_data);
  if (!hasConsent(customData.consents, 'google_place_data')) {
    return { ok: false, reason: 'no_consent', message: 'The vendor has not granted Google profile data consent.' };
  }

  const cached = readPlaceSnapshot(customData);
  if (cached && !options.force && isSnapshotFresh(cached)) {
    return { ok: true, snapshot: cached, cached: true };
  }

  const placeId =
    (typeof business.google_place_id === 'string' && business.google_place_id) ||
    cached?.place_id ||
    (await resolvePlaceIdFromMapsUrl(customData.google_profile_url));

  if (!placeId) {
    return { ok: false, reason: 'no_place_id', message: 'No Google place id or Maps link on this business yet.' };
  }

  const lookup = await fetchGooglePlace(placeId);
  if (!lookup.ok) {
    return { ok: false, reason: lookup.reason, message: lookup.message };
  }

  const nextCustomData: Record<string, any> = { ...customData, google_place: lookup.snapshot };

  // The same payload proves the mutual visibility pledge when the profile's
  // website field points at the minisite — free verification on every sync.
  const pledge = readVendorPledge(customData);
  if (pledge) {
    const minisiteUrl = pledge.minisite_url || (business.slug ? getBusinessPublicUrl(business) : '');
    nextCustomData.pledge = {
      ...pledge,
      google_website_url: lookup.snapshot.website_uri || null,
      google_verified_at: minisiteMatchesUrl(lookup.snapshot.website_uri, minisiteUrl)
        ? new Date().toISOString()
        : null,
      last_evaluated_at: new Date().toISOString(),
    };
  }

  await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [
    JSON.stringify(nextCustomData),
    businessId,
  ]);

  return { ok: true, snapshot: lookup.snapshot, cached: false };
}

export type PledgeVerifyResult =
  | {
      ok: true;
      status: 'verified' | 'linked' | 'absent';
      placeId: string | null;
      website: string;
      minisiteUrl: string;
      candidates: GooglePlaceCandidate[];
    }
  | {
      ok: false;
      reason: 'not_configured' | 'no_pledge' | 'not_found' | 'http_error' | 'no_business';
      message?: string;
    };

export interface GooglePlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  website: string;
  distanceKm: number | null;
  score: number;
}

function normalizeName(value: string): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function nameScore(a: string, b: string): number {
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftTokens = new Set(left.split(' ').filter(token => token.length > 1));
  const rightTokens = new Set(right.split(' ').filter(token => token.length > 1));
  if (leftTokens.size === 0 || rightTokens.size === 0) return left.includes(right) || right.includes(left) ? 0.7 : 0;
  let shared = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) shared += 1;
  const jaccard = shared / (leftTokens.size + rightTokens.size - shared);
  const containment = left.includes(right) || right.includes(left) ? 0.25 : 0;
  return Math.min(1, jaccard + containment);
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Reads latitude/longitude from any of the shapes the minisite stores them in. */
export function readBusinessCoordinates(customData: unknown): { lat: number; lng: number } | null {
  const data = parseCustomData(customData);
  const read = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const lat = read(data.latitude ?? data.lat ?? data.basic?.latitude ?? data.sec_1_identity?.latitude ?? data.business_info?.latitude);
  const lng = read(data.longitude ?? data.lng ?? data.basic?.longitude ?? data.sec_1_identity?.longitude ?? data.business_info?.longitude);
  if (lat === null || lng === null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

/**
 * Finds whether a Google Maps profile already exists for this business, so we
 * never advise a vendor to create a duplicate listing. Read-only, one Places
 * Text Search SKU per call.
 */
export async function searchGooglePlace(input: {
  name: string;
  position?: { lat: number; lng: number } | null;
  radiusMeters?: number;
}): Promise<GooglePlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !input.name?.trim()) return [];

  const body: Record<string, unknown> = {
    textQuery: input.name.trim(),
    maxResultCount: 5,
  };
  if (input.position) {
    body.locationBias = {
      circle: {
        center: { latitude: input.position.lat, longitude: input.position.lng },
        radius: Math.max(200, Math.min(50000, input.radiusMeters || 3000)),
      },
    };
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.websiteUri',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });
    if (!response.ok) return [];

    const payload = await readJson(response);
    const places: any[] = Array.isArray(payload?.places) ? payload.places : [];

    return places
      .map((place: any): GooglePlaceCandidate | null => {
        const placeId = String(place?.id || '');
        if (!placeId) return null;
        const lat = Number(place?.location?.latitude);
        const lng = Number(place?.location?.longitude);
        const position = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
        return {
          placeId,
          name: String(place?.displayName?.text || ''),
          address: String(place?.formattedAddress || ''),
          rating: typeof place?.rating === 'number' ? place.rating : null,
          website: String(place?.websiteUri || ''),
          distanceKm: position && input.position ? Number(distanceKm(input.position, position).toFixed(2)) : null,
          score: Number(nameScore(String(place?.displayName?.text || ''), input.name).toFixed(2)),
        };
      })
      .filter((candidate: GooglePlaceCandidate | null): candidate is GooglePlaceCandidate => Boolean(candidate))
      .sort((a: GooglePlaceCandidate, b: GooglePlaceCandidate) => {
        const distanceA = a.distanceKm ?? 999;
        const distanceB = b.distanceKm ?? 999;
        if (b.score !== a.score) return b.score - a.score;
        return distanceA - distanceB;
      });
  } catch {
    return [];
  }
}

/** Conservative on purpose: a wrong match would link the wrong business. */
function isConfidentMatch(candidate: GooglePlaceCandidate): boolean {
  const distance = candidate.distanceKm;
  if (distance !== null && distance <= 0.25) return candidate.score >= 0.3;
  if (distance !== null && distance <= 3) return candidate.score >= 0.6;
  return candidate.score >= 0.85;
}

/**
 * One call that answers "does this business have a Google profile, and does it
 * point at the minisite?".
 *
 * - No linked place → search around the stored coordinates.
 * - Confident match → attach it, then check the website field.
 * - No match → record `absent` so the dashboard can offer the setup path.
 */
export async function verifyPledgeGoogleLink(businessId: string): Promise<PledgeVerifyResult> {
  const business = await queryOne<any>(
    'SELECT id, slug, name, custom_data, google_place_id FROM businesses WHERE id = ? LIMIT 1',
    [businessId]
  );
  if (!business) return { ok: false, reason: 'no_business', message: 'Business not found.' };

  const customData = parseCustomData(business.custom_data);
  const pledge = readVendorPledge(customData);
  if (!pledge) {
    return { ok: false, reason: 'no_pledge', message: 'This business has not accepted the visibility pledge yet.' };
  }

  const minisiteUrl = pledge.minisite_url || (business.slug ? getBusinessPublicUrl(business) : '');
  const now = new Date().toISOString();

  if (!isGooglePlacesConfigured()) {
    return { ok: false, reason: 'not_configured', message: 'Google Places API is not configured on this deployment.' };
  }

  let placeId: string | null =
    (typeof business.google_place_id === 'string' && business.google_place_id) || null;

  if (!placeId) {
    placeId = await resolvePlaceIdFromMapsUrl(customData.google_profile_url);
  }

  const candidates: GooglePlaceCandidate[] = [];

  if (!placeId) {
    const found = await searchGooglePlace({
      name: String(business.name || ''),
      position: readBusinessCoordinates(customData),
    });
    candidates.push(...found);

    const confident = found.find(isConfidentMatch);
    if (!confident) {
      await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [
        JSON.stringify({
          ...customData,
          pledge: {
            ...pledge,
            google_place_status: 'absent',
            google_place_checked_at: now,
            last_evaluated_at: now,
          },
        }),
        businessId,
      ]);
      return { ok: true, status: 'absent', placeId: null, website: '', minisiteUrl, candidates: found };
    }

    placeId = confident.placeId;
    await execute('UPDATE businesses SET google_place_id = ? WHERE id = ?', [placeId, businessId]).catch(
      (error: any) => console.warn('[google-places] google_place_id column unavailable:', error?.message || error)
    );
  }

  const lookup = await fetchGooglePlace(placeId);
  if (!lookup.ok) return { ok: false, reason: lookup.reason, message: lookup.message };

  const website = lookup.snapshot.website_uri || '';
  const matched = minisiteMatchesUrl(website, minisiteUrl);

  await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [
    JSON.stringify({
      ...customData,
      pledge: {
        ...pledge,
        google_place_status: 'linked',
        google_place_checked_at: now,
        google_website_url: website || null,
        google_verified_at: matched ? now : null,
        last_evaluated_at: now,
      },
    }),
    businessId,
  ]);

  return {
    ok: true,
    status: matched ? 'verified' : 'linked',
    placeId,
    website,
    minisiteUrl,
    candidates,
  };
}
