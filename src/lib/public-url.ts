export function normalizeBusinessSlug(value: string) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getBusinessSlugCandidates(value: string): string[] {
  const raw = String(value ?? '').trim();
  if (!raw) return [];

  const normalized = normalizeBusinessSlug(raw);
  const variants = new Set<string>([
    raw,
    raw.toLowerCase(),
    raw.trim().toLowerCase(),
    normalized,
    raw.replace(/\s+/g, '-').toLowerCase(),
    raw.replace(/[_\s]+/g, '-').toLowerCase(),
    raw.replace(/&/g, 'and').toLowerCase(),
    raw.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase(),
    normalized.replace(/-/g, ''),
  ]);

  return [...variants].filter((entry) => entry && entry.trim().length > 0);
}

export function slugifyBusinessName(name: string) {
  return normalizeBusinessSlug(name);
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://siwify.com';
}

export function getPublicMinisiteUrl(slug: string) {
  return `${getPublicAppUrl().replace(/\/$/, '')}/${slug}`;
}
