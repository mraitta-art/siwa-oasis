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

/**
 * Where a listing answers: the short address or the one inside its market.
 *
 * 'root' is the platform default because it is what the vendor-facing stack has
 * always printed (QR codes, prospect outreach, welcome emails). 'market' exists
 * for listings that should read as part of their district. Both shapes resolve
 * either way, so switching only changes which one the platform advertises.
 */
export type UrlStyle = 'root' | 'market';

interface AddressableBusiness {
  slug?: string | null;
  id?: string | null;
  market_id?: string | null;
  marketId?: string | null;
  url_style?: string | null;
}

export function urlStyleOf(business: AddressableBusiness | null | undefined): UrlStyle {
  return String(business?.url_style || '').toLowerCase() === 'market' ? 'market' : 'root';
}

/** The canonical path of a listing: '/villa-name' or '/hurghada/villa-name'. */
export function businessPublicPath(business: AddressableBusiness, fallbackMarket = 'siwa'): string {
  const slug = String(business?.slug || business?.id || '').replace(/^\/+|\/+$/g, '');
  if (!slug) return '/';
  if (urlStyleOf(business) === 'market') {
    return `/${business.market_id || business.marketId || fallbackMarket}/${slug}`;
  }
  return `/${slug}`;
}

/** Absolute URL for anything a human will read or scan. */
export function getBusinessPublicUrl(business: AddressableBusiness, fallbackMarket = 'siwa'): string {
  return `${getPublicAppUrl().replace(/\/$/, '')}${businessPublicPath(business, fallbackMarket)}`;
}
