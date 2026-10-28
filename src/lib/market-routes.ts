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
 * Sector hubs that predate the market concept.
 *
 * Each one is named after Siwa in its own address, so no other market could
 * ever use it, and most were never populated: they answered 200 with a header,
 * a footer and an empty grid. The supply they pretended to show is the same
 * rows the market door already filters, so each one now points at the category
 * door it was imitating.
 *
 * The route files stay in the app because the subdomain aliases below still
 * resolve through them, but a direct request is answered with a permanent
 * redirect and the aliases are retargeted by this same map. Adding a market
 * costs a row; retiring a hub costs an entry here.
 *
 *   /siwa-stay  -> /siwa?category=accommodation
 *   /ar/siwa-go -> /ar/siwa?category=adventure
 */
export const LEGACY_HUB_TARGETS: Record<string, { market: string; category: string }> = {
  // Stays
  '/siwa-stay': { market: 'siwa', category: 'accommodation' },
  '/accommodations': { market: 'siwa', category: 'accommodation' },
  // Excursions
  '/siwa-go': { market: 'siwa', category: 'adventure' },
  '/siwa-experiences': { market: 'siwa', category: 'adventure' },
  '/activities': { market: 'siwa', category: 'adventure' },
  // Food
  '/siwa-table': { market: 'siwa', category: 'food' },
  '/food-beverage': { market: 'siwa', category: 'food' },
  '/restaurants': { market: 'siwa', category: 'food' },
  // Crafts & wellness
  '/siwa-craft': { market: 'siwa', category: 'crafts' },
  '/crafts-wellness': { market: 'siwa', category: 'crafts' },
  '/siwa-retreat': { market: 'siwa', category: 'retreats' },
  '/siwa-retreats': { market: 'siwa', category: 'retreats' },
  // Transport
  '/siwa-move': { market: 'siwa', category: 'logistics' },
  '/transportation': { market: 'siwa', category: 'logistics' },
  '/transportations': { market: 'siwa', category: 'logistics' },
  // Investment
  '/siwa-invest': { market: 'siwa', category: 'investment_parent' },
  '/investment-opportunities': { market: 'siwa', category: 'investment_parent' },
  // Production & trade
  '/siwa-products': { market: 'siwa', category: 'agriculture_industry' },
  '/siwa-grown-produced': { market: 'siwa', category: 'agriculture_industry' },
  '/production-trade': { market: 'siwa', category: 'agriculture_industry' },
  // Services
  '/siwa-services': { market: 'siwa', category: 'services_professional' },
  '/services': { market: 'siwa', category: 'services_professional' },
  // Heritage
  '/siwa-society': { market: 'siwa', category: 'arts_culture' },
};

/**
 * First segments a business slug may never take, because they are addresses
 * the app already owns. Used when generating or validating a slug; a slug that
 * collides with one of these would be unreachable.
 */
export const RESERVED_SLUGS: readonly string[] = [
  ...MARKET_SEGMENTS,
  ...Object.keys(LEGACY_HUB_TARGETS).map((path) => path.slice(1)),
  'api', '_next', 'admin', 'jana', 'vendor', 'login', 'logout', 'signup',
  'visitor', 'visitors', 'onboard', 'dashboard', 'uploads', 'media',
  'categories', 'blog', 'projects', 'ar', 'en',
  // Comparison and developer-portfolio routes are static first segments; a
  // business may never take the address the app already owns.
  'compare', 'developers',
  'sitemap.xml', 'robots.txt', 'icon.svg', 'manifest.webmanifest',
];

export function isReservedSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return RESERVED_SLUGS.includes(slug.trim().toLowerCase());
}
