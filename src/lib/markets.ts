/**
 * Market registry.
 *
 * A "market" is one area we operate as its own marketplace: Siwa today, El
 * Alamein and Ras El Hekma seeded and dark. It is a row, not a code branch —
 * branding, category tree, pricing and conversion style hang off the row so a
 * new area never means a new deployment.
 *
 * The table is the authority. `SEED_MARKETS` carries the same three rows so the
 * app still resolves a market on a database that has not run the migration yet;
 * keep the two in step when a market is launched.
 */

import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { MARKET_HEADER } from '@/lib/market-routes';

export type MarketSlug = 'siwa' | 'el-alamein' | 'ras-el-hekma';

export type MarketRevenueModel = 'tourism_whatsapp' | 'directory_lead' | 'realestate_lead';

export type MarketLocale = 'en' | 'ar';

export interface Market {
  slug: string;
  locationId: string | null;
  nameAr: string;
  nameEn: string;
  /** Hostname that serves this market, without scheme or port. */
  host: string | null;
  defaultLocale: MarketLocale;
  currency: string;
  revenueModel: MarketRevenueModel;
  themeAccent: string | null;
  active: boolean;
}

/** Siwa is both the live market and the default for any host we do not map. */
export const DEFAULT_MARKET_SLUG: MarketSlug = 'siwa';

const SEED_MARKETS: Market[] = [
  {
    slug: 'siwa',
    locationId: 'eg-matrouh-siwa',
    nameAr: 'سيوة',
    nameEn: 'Siwa Oasis',
    host: 'siwify.com',
    defaultLocale: 'en',
    currency: 'EGP',
    revenueModel: 'tourism_whatsapp',
    themeAccent: '#D4AF37',
    active: true,
  },
  {
    slug: 'el-alamein',
    locationId: 'eg-matrouh-elalamein',
    nameAr: 'العلمين',
    nameEn: 'El Alamein',
    host: 'elalamein.siwify.com',
    defaultLocale: 'ar',
    currency: 'EGP',
    revenueModel: 'realestate_lead',
    themeAccent: '#0F4C81',
    active: false,
  },
  {
    slug: 'ras-el-hekma',
    locationId: 'eg-matrouh-raselhekma',
    nameAr: 'راس الحكمة',
    nameEn: 'Ras El Hekma',
    host: 'raselhekma.siwify.com',
    defaultLocale: 'ar',
    currency: 'EGP',
    revenueModel: 'realestate_lead',
    themeAccent: '#0B6E4F',
    active: false,
  },
];

const CACHE_TTL = 60 * 1000;

let cachedAt = 0;
let cachedRows: Market[] | null = null;

function fromRow(row: any): Market {
  return {
    slug: String(row.slug),
    locationId: row.location_id ? String(row.location_id) : null,
    nameAr: String(row.name_ar ?? row.name_en ?? row.slug),
    nameEn: String(row.name_en ?? row.name_ar ?? row.slug),
    host: row.host ? String(row.host).toLowerCase() : null,
    defaultLocale: row.default_locale === 'ar' ? 'ar' : 'en',
    currency: String(row.currency || 'EGP'),
    revenueModel:
      row.revenue_model === 'realestate_lead' || row.revenue_model === 'directory_lead'
        ? row.revenue_model
        : 'tourism_whatsapp',
    themeAccent: row.theme_accent ? String(row.theme_accent) : null,
    active: Boolean(Number(row.active)),
  };
}

/** All markets, live or dark. Falls back to the seeds if the table is missing. */
async function loadMarkets(): Promise<Market[]> {
  if (cachedRows && Date.now() - cachedAt < CACHE_TTL) return cachedRows;

  try {
    const rows = await query(
      `SELECT slug, location_id, name_ar, name_en, host, default_locale, currency,
              revenue_model, theme_accent, active
       FROM markets
       ORDER BY active DESC, slug`
    );
    if (Array.isArray(rows) && rows.length > 0) {
      cachedRows = rows.map(fromRow);
      cachedAt = Date.now();
      return cachedRows;
    }
  } catch {
    // Table not migrated yet, or the database is down: the seeds keep the site up.
  }

  return SEED_MARKETS;
}

/**
 * Drop the in-process cache. A dashboard write must be visible on the next
 * request instead of waiting out the TTL, otherwise activating a market looks
 * like it silently failed.
 */
export function invalidateMarketCache(): void {
  cachedRows = null;
  cachedAt = 0;
}

export async function listMarkets(options: { activeOnly?: boolean } = {}): Promise<Market[]> {
  const rows = await loadMarkets();
  return options.activeOnly === false ? rows : rows.filter((market) => market.active);
}

export async function getMarketBySlug(slug: string | null | undefined): Promise<Market | null> {
  if (!slug) return null;
  const wanted = slug.trim().toLowerCase();
  const rows = await loadMarkets();
  return rows.find((market) => market.slug === wanted) ?? null;
}

function normalizeHost(host: string | null | undefined): string {
  if (!host) return '';
  return host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

/**
 * The market a hostname serves. An unmapped host (localhost, an IP, a preview
 * deployment) resolves to Siwa, because that is the site as it exists today.
 *
 * This returns dark markets too — the caller decides. A dark market must not be
 * served, indexed or listed even though its host resolves.
 */
export async function getMarketForHost(host: string | null | undefined): Promise<Market> {
  const wanted = normalizeHost(host);
  const rows = await loadMarkets();

  const exact = rows.find((market) => normalizeHost(market.host) === wanted && wanted !== '');
  if (exact) return exact;

  // `<market>.siwify.com` resolves by label even before the row's host is set.
  const label = wanted.endsWith('.siwify.com') ? wanted.slice(0, -'.siwify.com'.length) : '';
  if (label) {
    const byLabel = rows.find((market) => market.slug === label);
    if (byLabel) return byLabel;
  }

  return rows.find((market) => market.slug === DEFAULT_MARKET_SLUG) ?? SEED_MARKETS[0];
}

/** Absolute origin for a market, used by canonicals, sitemaps and links. */
export function marketSiteUrl(market: Market): string {
  return `https://${normalizeHost(market.host) || 'siwify.com'}`;
}

/** Display name in the language of the page being rendered. */
export function marketName(market: Market, locale: MarketLocale): string {
  return locale === 'ar' ? market.nameAr : market.nameEn;
}

/**
 * SQL predicate for a market's category tree.
 *
 * A null `market_id` means the category is shared by every market; a tagged
 * row is offered only in its own market. Every read of `business_types` must
 * use this instead of `market_id = ?`, otherwise Siwa would lose the shared
 * half of its tree the day a second market opens.
 */
export const MARKET_TYPE_SCOPE_SQL = '(market_id IS NULL OR market_id = ?)';

export function marketTypeScope(marketSlug: string): { sql: string; params: string[] } {
  return { sql: MARKET_TYPE_SCOPE_SQL, params: [marketSlug] };
}

/**
 * The market the current URL named, or null for a legacy flat URL.
 * Server components only: this reads request headers.
 */
export async function pathMarketSlug(): Promise<string | null> {
  try {
    const value = (await headers()).get(MARKET_HEADER);
    if (!value) return null;
    return /^[a-z0-9-]+$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

/* ─── Market front door data ─────────────────────────────────────────────── */

const LIMIT_CEILING = 60;

function clampLimit(value: number | undefined, fallback: number) {
  const n = Number.isFinite(value) ? Math.trunc(value as number) : fallback;
  return Math.min(Math.max(n, 1), LIMIT_CEILING);
}

export interface MarketCategoryFacet {
  id: string;
  name: string;
  /** Arabic name when an editor wrote one; null means "use `name`". */
  nameAr: string | null;
  icon: string | null;
  /** Parent category blurb, when an editor has written one. */
  description: string | null;
  listings: number;
}

/**
 * Top-level categories that actually have supply in this market, with counts.
 * Rolling a child typology up to its parent is what turns 84 Siwa typologies
 * into a handful of doors a visitor can choose from.
 */
export async function listMarketCategories(marketSlug: string, limit = 12): Promise<MarketCategoryFacet[]> {
  const rows = await query(
    `SELECT COALESCE(bt.parent_id, bt.id) AS id,
            COALESCE(pt.name, bt.name) AS name,
            COALESCE(pt.name_ar, bt.name_ar) AS name_ar,
            COALESCE(pt.icon, bt.icon) AS icon,
            MAX(COALESCE(pt.description, bt.description)) AS description,
            COUNT(*) AS listings
     FROM businesses b
     JOIN business_types bt ON bt.id = b.type_id
     LEFT JOIN business_types pt ON pt.id = bt.parent_id
     WHERE b.market_id = ? AND b.status = 'active'
     GROUP BY id, name, name_ar, icon
     ORDER BY listings DESC, name
     LIMIT ${clampLimit(limit, 12)}`,
    [marketSlug]
  );

  return (rows as any[]).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? row.id),
    nameAr: row.name_ar ? String(row.name_ar) : null,
    icon: row.icon ? String(row.icon) : null,
    description: row.description ? String(row.description) : null,
    listings: Number(row.listings) || 0,
  }));
}

export interface MarketListing {
  id: string;
  slug: string;
  name: string;
  /** Arabic display name when an admin wrote one; null means "use name". */
  nameAr: string | null;
  typeId: string | null;
  typeName: string | null;
  /** Arabic typology name; null means "use typeName". */
  typeNameAr: string | null;
  parentTypeId: string | null;
  isTrusted: boolean;
  coverImage: string | null;
}

/** The one place a listing's cover image is guessed from stored custom_data. */
export function firstImage(customData: any): string | null {
  if (!customData || typeof customData !== 'object') return null;
  return (
    customData.cover_image ||
    customData.basic?.cover_image ||
    customData.sec_1_identity?.cover_image ||
    customData.business_info?.cover_image ||
    customData.business_logo ||
    customData.basic?.business_logo ||
    null
  );
}

/**
 * Live listings in one market, optionally narrowed to one parent category.
 * This is the only read that decides what a market's front door shows, so the
 * market predicate lives here rather than in each page.
 */
export async function listMarketListings(
  marketSlug: string,
  options: { parentTypeId?: string | null; limit?: number } = {}
): Promise<MarketListing[]> {
  const parentTypeId = options.parentTypeId ? String(options.parentTypeId) : null;
  const limit = clampLimit(options.limit, 24);

  const rows = await query(
    `SELECT b.id, b.slug, b.name, b.name_ar, b.type_id, b.is_trusted, b.custom_data,
            bt.name AS type_name, bt.name_ar AS type_name_ar, bt.parent_id
     FROM businesses b
     LEFT JOIN business_types bt ON bt.id = b.type_id
     WHERE b.market_id = ? AND b.status = 'active'
       ${parentTypeId ? 'AND (bt.parent_id = ? OR bt.id = ?)' : ''}
     ORDER BY b.is_featured DESC, b.is_trusted DESC, b.created_at DESC
     LIMIT ${limit}`,
    parentTypeId ? [marketSlug, parentTypeId, parentTypeId] : [marketSlug]
  );

  return (rows as any[]).map((row) => {
    let customData: any = row.custom_data;
    if (typeof customData === 'string') {
      try { customData = JSON.parse(customData); } catch { customData = null; }
    }
    return {
      id: String(row.id),
      slug: String(row.slug || row.id),
      name: String(row.name),
      nameAr: row.name_ar ? String(row.name_ar) : null,
      typeId: row.type_id ? String(row.type_id) : null,
      typeName: row.type_name ? String(row.type_name) : null,
      typeNameAr: row.type_name_ar ? String(row.type_name_ar) : null,
      parentTypeId: row.parent_id ? String(row.parent_id) : null,
      isTrusted: Number(row.is_trusted) === 1,
      coverImage: firstImage(customData),
    };
  });
}
