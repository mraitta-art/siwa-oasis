/**
 * Market segments in the URL.
 *
 * Middleware runs before the database is reachable (edge runtime, no driver),
 * so the set of segments that may act as a market prefix is listed here. It
 * mirrors the `markets` rows: launching a new market means adding its slug to
 * this list, which is the only place a market costs a code change rather than a
 * row. Keep the two in step — the migration seeds these same three, plus
 * Matrouh city when it opens.
 *
 *   /siwa/gagal-hotel          -> route /gagal-hotel,  market: siwa
 *   /el-alamein/gagal-hotel    -> route /gagal-hotel,  market: elalamein
 *   /ar/siwa/gagal-hotel       -> route /gagal-hotel,  locale: ar, market: siwa
 */

export const MARKET_SEGMENTS = ['siwa', 'el-alamein', 'ras-el-hekma', 'matrouh'] as const;

/** Request header carrying the market stripped out of the URL. */
export const MARKET_HEADER = 'x-siwa-market';

export type MarketSegment = (typeof MARKET_SEGMENTS)[number];

export function isMarketSegment(segment: string | null | undefined): boolean {
  if (!segment) return false;
  return (MARKET_SEGMENTS as readonly string[]).includes(segment);
}

/**
 * First segments a business slug may never take, because they are addresses
 * the app already owns. Used when generating or validating a slug; a slug that
 * collides with one of these would be unreachable.
 */
export const RESERVED_SLUGS: readonly string[] = [
  ...MARKET_SEGMENTS,
  'api', '_next', 'admin', 'jana', 'vendor', 'login', 'logout', 'signup',
  'visitor', 'visitors', 'onboard', 'dashboard', 'uploads', 'media',
  'categories', 'blog', 'projects', 'ar', 'en',
  'siwa-stay', 'siwa-go', 'siwa-retreats',
  'sitemap.xml', 'robots.txt', 'icon.svg', 'manifest.webmanifest',
];

export function isReservedSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return RESERVED_SLUGS.includes(slug.trim().toLowerCase());
}
