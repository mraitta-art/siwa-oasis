import { query } from '@/lib/db';

export interface DuplicateCandidate {
  id: string;
  name: string;
  score: number;
  reasons: string[];
  address?: string;
  phone?: string;
  website?: string;
  category?: string;
  lat?: number | null;
  lng?: number | null;
}

export function normalizeBusinessText(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeBusinessText(value).split(' ').filter(Boolean));
}

function jaccardSimilarity(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size && !b.size) return 1;
  const union = new Set([...a, ...b]);
  const intersection = [...a].filter(token => b.has(token));
  return intersection.length / Math.max(union.size, 1);
}

function textSimilarity(left: string, right: string): number {
  const a = normalizeBusinessText(left);
  const b = normalizeBusinessText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const jaccard = jaccardSimilarity(a, b);
  const longer = a.length > b.length ? a : b;
  const shorter = a.length <= b.length ? a : b;
  if (!longer || !shorter) return 0;
  const prefix = shorter.length > 0 && longer.startsWith(shorter) ? 0.25 : 0;
  return Math.max(jaccard, prefix);
}

function phoneSimilarity(left?: string | null, right?: string | null): number {
  const normalizePhone = (value: string | null | undefined) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '').slice(-10);
  };
  const a = normalizePhone(left);
  const b = normalizePhone(right);
  if (!a || !b) return 0;
  return a === b ? 1 : 0;
}

function addressSimilarity(left?: string | null, right?: string | null): number {
  const a = normalizeBusinessText(left);
  const b = normalizeBusinessText(right);
  if (!a || !b) return 0;
  return textSimilarity(a, b);
}

function coordsDistance(latA?: number | null, lngA?: number | null, latB?: number | null, lngB?: number | null): number {
  if (latA == null || lngA == null || latB == null || lngB == null) return Infinity;
  const dx = latA - latB;
  const dy = lngA - lngB;
  return Math.sqrt(dx * dx + dy * dy);
}

function geoScore(latA?: number | null, lngA?: number | null, latB?: number | null, lngB?: number | null): number {
  const distance = coordsDistance(latA, lngA, latB, lngB);
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 0.0005) return 1;
  if (distance <= 0.005) return 0.8;
  if (distance <= 0.02) return 0.5;
  return 0;
}

export function scoreDuplicateBusiness(candidate: {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  lat?: number | null;
  lng?: number | null;
}, existing: {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  lat?: number | null;
  lng?: number | null;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const nameScore = textSimilarity(candidate.name || '', existing.name || '');
  const addressScore = addressSimilarity(candidate.address || '', existing.address || '');
  const phoneScore = phoneSimilarity(candidate.phone || '', existing.phone || '');
  const websiteScore = candidate.website && existing.website
    ? normalizeBusinessText(candidate.website).includes(normalizeBusinessText(existing.website)) || normalizeBusinessText(existing.website).includes(normalizeBusinessText(candidate.website))
      ? 1
      : 0
    : 0;
  const geoScoreValue = geoScore(candidate.lat, candidate.lng, existing.lat, existing.lng);

  const weighted = (
    nameScore * 0.35 +
    addressScore * 0.25 +
    geoScoreValue * 0.2 +
    phoneScore * 0.1 +
    websiteScore * 0.1
  );

  if (nameScore > 0.7) reasons.push('Very similar name');
  if (addressScore > 0.6) reasons.push('Address overlap');
  if (geoScoreValue > 0.5) reasons.push('Nearby coordinates');
  if (phoneScore > 0) reasons.push('Matching phone');
  if (websiteScore > 0) reasons.push('Matching website');

  return { score: Number(weighted.toFixed(3)), reasons };
}

function readBusinessRecordFields(rawRow: any) {
  const customData = typeof rawRow?.custom_data === 'string' ? JSON.parse(rawRow.custom_data || '{}') : rawRow?.custom_data || {};
  const location = customData.location || {};
  const contact = customData.contact || {};
  const metadata = customData.source_provenance || {};
  return {
    id: rawRow?.id,
    name: rawRow?.name || customData.basic?.name || customData.name || '',
    address: location.address || customData.location?.address || '',
    phone: contact.phone || customData.contact?.phone || '',
    website: contact.website || customData.contact?.website || '',
    lat: Number(location.lat ?? customData.location?.lat ?? 0),
    lng: Number(location.lng ?? customData.location?.lng ?? 0),
    category: metadata.source_category || rawRow?.type_id || '',
  };
}

export async function findDuplicateCandidates(input: {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  lat?: number | null;
  lng?: number | null;
}, limit = 6) {
  const businesses = await query<any[]>(`SELECT id, name, custom_data FROM businesses WHERE name IS NOT NULL ORDER BY created_at DESC LIMIT 200`);
  const matches: DuplicateCandidate[] = [];

  for (const row of businesses) {
    const existing = readBusinessRecordFields(row);
    const { score, reasons } = scoreDuplicateBusiness(input, existing);
    if (score >= 0.62) {
      matches.push({
        id: String(existing.id),
        name: existing.name,
        score,
        reasons,
        address: existing.address,
        phone: existing.phone,
        website: existing.website,
        category: existing.category,
        lat: existing.lat,
        lng: existing.lng,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}
