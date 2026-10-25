/**
 * Admin reads and writes for the market hierarchy.
 *
 * One tree: a market row owns compounds (`developments`), and a compound holds
 * listings (`businesses`). Only the listing renders publicly, so "add a villa"
 * always means a business row — the compound decides where it is presented.
 *
 * Geography is part of creating a market, not a separate chore. `locations`
 * already models country -> governorate -> city, and Egypt with its 27
 * governorates is seeded, so a new market only needs its own city row. That
 * row is created here (idempotently, keyed on `path`) and linked in both
 * directions: `markets.location_id` points at the city, and the city records
 * `market_id`. The two tables deliberately have no foreign key — they would
 * form a cycle MySQL rejects — so both writes live in this file.
 */

import crypto from 'crypto';
import { query, queryOne, execute } from '@/lib/db';
import {
  DEFAULT_MARKET_SLUG,
  getMarketBySlug,
  invalidateMarketCache,
  listMarkets,
} from '@/lib/markets';
import { isReservedSlug } from '@/lib/market-routes';

/** A validation failure the API turns into a 4xx instead of a 500. */
export class AdminDataError extends Error {
  status: number;
  rule?: string;
  constructor(message: string, status = 400, rule?: string) {
    super(message);
    this.name = 'AdminDataError';
    this.status = status;
    this.rule = rule;
  }
}

export interface MarketAdmin {
  id: string;
  slug: string;
  locationId: string | null;
  locationPath: string | null;
  locationLabel: string | null;
  nameAr: string;
  nameEn: string;
  host: string | null;
  defaultLocale: string;
  currency: string;
  revenueModel: string;
  themeAccent: string | null;
  active: boolean;
  launchNotes: string | null;
  listings: number;
  compounds: number;
}

export interface CompoundAdmin {
  id: string;
  marketId: string;
  locationId: string | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  developerName: string | null;
  deliveryYear: number | null;
  status: string;
  active: boolean;
  listings: number;
  /** Business that speaks for this compound, when one is linked. */
  pageBusinessId: string | null;
}

export interface ListingAdmin {
  id: string;
  name: string;
  slug: string;
  marketId: string;
  developmentId: string | null;
  status: string;
  tier: string;
  typeId: string | null;
  typeName: string | null;
  typeIcon: string | null;
}

export interface GovernorateOption {
  id: string;
  nameEn: string;
  nameAr: string;
  path: string;
}

const DEFAULT_MARKET_ACCENT = '#0F4C81';
const DEFAULT_COUNTRY_ID = 'eg';
const REVENUE_MODELS = ['tourism_whatsapp', 'directory_lead', 'realestate_lead'];
const DEVELOPMENT_STATUSES = ['announced', 'under_construction', 'delivered', 'sold_out'];
const LOCATION_TYPES = ['country', 'governorate', 'city', 'town', 'neighborhood', 'area'];

/* ─── Geography ──────────────────────────────────────────────────────────── */

/**
 * The governorates a market can belong to. Egypt's 27 rows are seeded by
 * `20261025_markets_and_geo.sql`; nothing else is a valid parent for a city.
 */
export async function listGovernorates(): Promise<GovernorateOption[]> {
  try {
    const rows = await query(
      `SELECT id, name_en, name_ar, path
       FROM locations
       WHERE type = 'governorate' AND active = 1
       ORDER BY sort_order, name_en`
    );
    return (rows as any[]).map((row) => ({
      id: String(row.id),
      nameEn: String(row.name_en ?? row.id),
      nameAr: String(row.name_ar ?? row.name_en ?? row.id),
      path: String(row.path || row.id),
    }));
  } catch {
    return [];
  }
}

/**
 * The city row a market sits in, created on demand.
 *
 * `locations.path` is the natural key (`eg/matrouh/siwa`), and it is unique,
 * so lookup happens on the path rather than on the id: El Alamein's seeded row
 * is `eg-matrouh-elalamein` while its path follows the slug, and recomputing
 * an id would create a duplicate city beside the real one.
 */
async function resolveCityLocation(options: {
  marketSlug: string;
  nameEn: string;
  nameAr: string;
  governorateId?: string | null;
  createIfMissing: boolean;
  lat?: number | null;
  lng?: number | null;
}): Promise<string | null> {
  const { marketSlug, nameEn, nameAr, createIfMissing } = options;

  const governorateId = String(options.governorateId || '').trim();
  if (!governorateId) return null;

  const governorate = (await queryOne(
    `SELECT id, name_en, slug, path, parent_id FROM locations WHERE id = ? LIMIT 1`,
    [governorateId]
  )) as any;

  if (!governorate) {
    throw new AdminDataError(`Governorate "${governorateId}" does not exist.`);
  }

  const governoratePath = String(governorate.path || governorate.id);
  const cityPath = `${governoratePath}/${marketSlug}`;

  const existing = (await queryOne(
    `SELECT id FROM locations WHERE path = ? LIMIT 1`,
    [cityPath]
  )) as any;
  if (existing) return String(existing.id);

  if (!createIfMissing) return null;

  // The id only has to be readable and stable; the path carries the meaning.
  const governorateSegment = String(governorate.slug || governoratePath.split('/').pop() || 'eg');
  const baseId = `${DEFAULT_COUNTRY_ID}-${governorateSegment}-${marketSlug}`;
  let cityId = baseId;
  let counter = 1;
  while (await queryOne('SELECT id FROM locations WHERE id = ? LIMIT 1', [cityId])) {
    cityId = `${baseId}-${counter++}`;
  }

  const lat = Number.isFinite(Number(options.lat)) && options.lat !== null && options.lat !== undefined
    ? Number(options.lat)
    : null;
  const lng = Number.isFinite(Number(options.lng)) && options.lng !== null && options.lng !== undefined
    ? Number(options.lng)
    : null;

  await execute(
    `INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path,
                            lat, lng, market_id, active, sort_order)
     VALUES (?, ?, ?, ?, 'city', ?, ?, ?, ?, ?, ?, 1, 100)`,
    [
      cityId,
      nameEn,
      nameAr || nameEn,
      nameEn,
      String(governorate.id),
      marketSlug,
      cityPath,
      lat,
      lng,
      marketSlug,
    ]
  );

  return cityId;
}

/** Keep `locations.market_id` pointing back at the market that owns the city. */
async function linkLocationToMarket(locationId: string | null, marketSlug: string): Promise<void> {
  if (!locationId) return;
  // Release the row the market used to own before claiming the new one. Without
  // this a moved market keeps its old city marked as taken, so that place can
  // never be picked again from the market form's location list.
  await execute('UPDATE locations SET market_id = NULL WHERE market_id = ? AND id <> ?', [
    marketSlug,
    locationId,
  ]);
  await execute('UPDATE locations SET market_id = ? WHERE id = ?', [marketSlug, locationId]);
}

/* ─── Reads ──────────────────────────────────────────────────────────────── */

function toMarketAdmin(row: any): MarketAdmin {
  return {
    id: String(row.id ?? row.slug),
    slug: String(row.slug),
    locationId: row.location_id ? String(row.location_id) : null,
    locationPath: row.location_path ? String(row.location_path) : null,
    locationLabel: row.location_name_en ? String(row.location_name_en) : null,
    nameAr: String(row.name_ar ?? row.slug),
    nameEn: String(row.name_en ?? row.slug),
    host: row.host ? String(row.host).toLowerCase() : null,
    defaultLocale: row.default_locale === 'en' ? 'en' : 'ar',
    currency: String(row.currency || 'EGP'),
    revenueModel: String(row.revenue_model || 'tourism_whatsapp'),
    themeAccent: row.theme_accent ? String(row.theme_accent) : null,
    active: Boolean(Number(row.active)),
    launchNotes: row.launch_notes ? String(row.launch_notes) : null,
    listings: Number(row.listings) || 0,
    compounds: Number(row.compounds) || 0,
  };
}

/** Every market, live or dark, with how much supply sits under it. */
export async function listMarketsAdmin(): Promise<MarketAdmin[]> {
  try {
    const rows = await query(
      `SELECT m.id, m.slug, m.location_id, m.name_ar, m.name_en, m.host,
              m.default_locale, m.currency, m.revenue_model, m.theme_accent,
              m.active, m.launch_notes,
              l.path AS location_path, l.name_en AS location_name_en,
              (SELECT COUNT(*) FROM businesses b WHERE b.market_id = m.slug) AS listings,
              (SELECT COUNT(*) FROM developments d WHERE d.market_id = m.slug AND d.active = 1) AS compounds
       FROM markets m
       LEFT JOIN locations l ON l.id = m.location_id
       ORDER BY m.active DESC, m.name_en`
    );
    return (rows as any[]).map(toMarketAdmin);
  } catch {
    // `markets` not migrated yet: fall back to the registry seeds so the
    // screen still opens and the operator can create the missing row.
    const seeds = await listMarkets({ activeOnly: false });
    return seeds.map((market) => ({
      ...market,
      id: market.slug,
      locationPath: null,
      locationLabel: null,
      launchNotes: null,
      listings: 0,
      compounds: 0,
    }));
  }
}

/** Compounds across every market; the screen groups them by `marketId`. */
export async function listCompoundsAdmin(): Promise<CompoundAdmin[]> {
  try {
    const rows = await query(
      `SELECT d.id, d.market_id, d.location_id, d.slug, d.name_ar, d.name_en,
              d.developer_name, d.delivery_year, d.status, d.active, d.page_business_id,
              (SELECT COUNT(*) FROM businesses b WHERE b.development_id = d.id) AS listings
       FROM developments d
       ORDER BY d.market_id, d.name_en`
    );
    return (rows as any[]).map((row) => ({
      id: String(row.id),
      marketId: String(row.market_id),
      locationId: row.location_id ? String(row.location_id) : null,
      slug: String(row.slug),
      nameAr: String(row.name_ar ?? row.slug),
      nameEn: String(row.name_en ?? row.slug),
      developerName: row.developer_name ? String(row.developer_name) : null,
      deliveryYear:
        row.delivery_year === null || row.delivery_year === undefined ? null : Number(row.delivery_year),
      status: DEVELOPMENT_STATUSES.includes(String(row.status)) ? String(row.status) : 'announced',
      active: Boolean(Number(row.active)),
      listings: Number(row.listings) || 0,
      pageBusinessId: row.page_business_id ? String(row.page_business_id) : null,
    }));
  } catch {
    return [];
  }
}

/**
 * Every listing, with the compound it sits in. One read beats a request per
 * market, and the screen groups them client-side.
 */
export async function listListingsAdmin(): Promise<ListingAdmin[]> {
  try {
    const rows = await query(
      `SELECT b.id, b.name, b.slug, b.market_id, b.development_id, b.status,
              b.subscription_tier, b.type_id,
              bt.name AS type_name, bt.icon AS type_icon
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.type_id
       ORDER BY b.market_id, b.name
       LIMIT 2000`
    );
    return (rows as any[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug || row.id),
      marketId: String(row.market_id || DEFAULT_MARKET_SLUG),
      developmentId: row.development_id ? String(row.development_id) : null,
      status: String(row.status || 'pending'),
      tier: String(row.subscription_tier || 'free'),
      typeId: row.type_id ? String(row.type_id) : null,
      typeName: row.type_name ? String(row.type_name) : null,
      typeIcon: row.type_icon ? String(row.type_icon) : null,
    }));
  } catch {
    return [];
  }
}

/* ─── Market writes ──────────────────────────────────────────────────────── */

function normalizeHost(value: any): string | null {
  if (!value) return null;
  const host = String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
  return host || null;
}

function normalizeSlug(value: any): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

/**
 * Create a market and its city in one step. The slug becomes a URL segment and
 * a location path segment, so it is validated against the reserved route list.
 */
export async function createMarket(
  input: any
): Promise<{ slug: string; active: boolean; locationId: string | null; locationPath: string | null }> {
  const slug = normalizeSlug(input?.slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new AdminDataError(
      'Slug must be lowercase letters, digits and single hyphens — for example "hurghada".'
    );
  }
  if (isReservedSlug(slug)) {
    throw new AdminDataError(
      `"${slug}" is already a route or an existing market segment. Pick another slug.`,
      409,
      'SLUG_RESERVED'
    );
  }
  if (await queryOne('SELECT slug FROM markets WHERE slug = ? LIMIT 1', [slug])) {
    throw new AdminDataError(`Market "${slug}" already exists.`, 409, 'MARKET_EXISTS');
  }

  const nameEn = String(input?.nameEn || '').trim();
  const nameAr = String(input?.nameAr || '').trim();
  if (!nameEn || !nameAr) {
    throw new AdminDataError('Both the English and the Arabic name are required.');
  }

  const governorateId = input?.governorateId ? String(input.governorateId).trim() : null;
  const explicitLocationId = input?.locationId ? String(input.locationId).trim() : null;

  if (explicitLocationId) {
    const location = (await queryOne('SELECT id, path FROM locations WHERE id = ? LIMIT 1', [
      explicitLocationId,
    ])) as any;
    if (!location) {
      throw new AdminDataError(`Location "${explicitLocationId}" does not exist.`);
    }
  } else if (!governorateId) {
    throw new AdminDataError(
      'Pick a governorate. A market belongs to a place, and its city row is created from that choice.',
      400,
      'GOVERNORATE_REQUIRED'
    );
  }

  const locale = input?.defaultLocale === 'en' ? 'en' : 'ar';
  const revenueModel = REVENUE_MODELS.includes(String(input?.revenueModel))
    ? String(input.revenueModel)
    : 'tourism_whatsapp';
  const currency = String(input?.currency || 'EGP').toUpperCase().slice(0, 3);
  const host = normalizeHost(input?.host);
  const accent = String(input?.themeAccent || DEFAULT_MARKET_ACCENT).slice(0, 20);
  const active = input?.active ? 1 : 0;
  const notes = input?.launchNotes ? String(input.launchNotes) : null;
  const createCity = input?.createCity !== false;

  await execute(
    `INSERT INTO markets (id, slug, location_id, name_ar, name_en, host, default_locale,
                          currency, revenue_model, theme_accent, active, launch_notes)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [slug, slug, nameAr, nameEn, host, locale, currency, revenueModel, accent, active, notes]
  );

  let locationId = explicitLocationId;
  let locationPath: string | null = null;

  try {
    if (!locationId) {
      locationId = await resolveCityLocation({
        marketSlug: slug,
        nameEn,
        nameAr,
        governorateId,
        createIfMissing: createCity,
        lat: input?.lat ?? null,
        lng: input?.lng ?? null,
      });
    }
    if (locationId) {
      await execute('UPDATE markets SET location_id = ? WHERE slug = ?', [locationId, slug]);
      await linkLocationToMarket(locationId, slug);
      const row = (await queryOne('SELECT path FROM locations WHERE id = ? LIMIT 1', [
        locationId,
      ])) as any;
      locationPath = row?.path ? String(row.path) : null;
    }
  } catch (error) {
    // The market row would be left without its place. Undo it so a retry is clean.
    await execute('DELETE FROM markets WHERE slug = ?', [slug]);
    throw error;
  }

  invalidateMarketCache();
  return { slug, active: Boolean(active), locationId, locationPath };
}

/**
 * Update a market. The slug is deliberately not editable: `businesses.market_id`
 * stores it, so renaming would orphan every listing under the old address.
 */
export async function updateMarket(slug: string, patch: any): Promise<void> {
  const target = normalizeSlug(slug);
  if (!target) throw new AdminDataError('Market slug is required.');
  const current = (await queryOne('SELECT slug, location_id FROM markets WHERE slug = ? LIMIT 1', [
    target,
  ])) as any;
  if (!current) throw new AdminDataError(`Market "${target}" not found.`, 404);

  // Moving a market to another governorate rebuilds its city row before the
  // column update, so a failed geography step leaves the market unchanged.
  if (patch && (patch.governorateId || patch.locationId !== undefined)) {
    const nameRow = (await queryOne('SELECT name_en, name_ar FROM markets WHERE slug = ? LIMIT 1', [
      target,
    ])) as any;

    let nextLocationId: string | null = patch.locationId ? String(patch.locationId).trim() : null;

    if (!nextLocationId && patch.governorateId) {
      nextLocationId = await resolveCityLocation({
        marketSlug: target,
        nameEn: String(patch.nameEn || nameRow?.name_en || target),
        nameAr: String(patch.nameAr || nameRow?.name_ar || target),
        governorateId: String(patch.governorateId),
        createIfMissing: patch.createCity !== false,
        lat: patch.lat ?? null,
        lng: patch.lng ?? null,
      });
    }

    if (nextLocationId) {
      const location = await queryOne('SELECT id FROM locations WHERE id = ? LIMIT 1', [nextLocationId]);
      if (!location) throw new AdminDataError(`Location "${nextLocationId}" does not exist.`);
      await execute('UPDATE markets SET location_id = ? WHERE slug = ?', [nextLocationId, target]);
      await linkLocationToMarket(nextLocationId, target);
    } else if (patch.locationId === null || patch.locationId === '') {
      await execute('UPDATE markets SET location_id = NULL WHERE slug = ?', [target]);
    }
  }

  const columns: Record<string, string> = {
    nameAr: 'name_ar',
    nameEn: 'name_en',
    host: 'host',
    defaultLocale: 'default_locale',
    currency: 'currency',
    revenueModel: 'revenue_model',
    themeAccent: 'theme_accent',
    active: 'active',
    launchNotes: 'launch_notes',
  };

  const sets: string[] = [];
  const params: any[] = [];

  for (const [key, column] of Object.entries(columns)) {
    if (!patch || !(key in patch)) continue;
    let value: any = patch[key];

    if (column === 'active') value = value ? 1 : 0;
    if (column === 'host') value = normalizeHost(value);

    if ((column === 'name_ar' || column === 'name_en') && !String(value || '').trim()) {
      throw new AdminDataError('A market keeps both names: neither can be empty.');
    }
    if (column === 'default_locale' && value !== 'ar' && value !== 'en') {
      throw new AdminDataError('Default locale must be "ar" or "en".');
    }
    if (column === 'revenue_model' && !REVENUE_MODELS.includes(String(value))) {
      throw new AdminDataError('Unknown revenue model.');
    }
    if (column === 'currency') value = String(value || 'EGP').toUpperCase().slice(0, 3);
    if (column === 'theme_accent') value = String(value || DEFAULT_MARKET_ACCENT).slice(0, 20);
    if (column === 'launch_notes') value = value ? String(value) : null;

    sets.push(`${column} = ?`);
    params.push(value === '' ? null : value);
  }

  if (sets.length > 0) {
    params.push(target);
    await execute(`UPDATE markets SET ${sets.join(', ')} WHERE slug = ?`, params);
  }

  invalidateMarketCache();
}

/** Delete a market that has never received supply. */
export async function deleteMarket(slug: string): Promise<void> {
  const target = normalizeSlug(slug);
  if (!target) throw new AdminDataError('Market slug is required.');
  if (target === DEFAULT_MARKET_SLUG) {
    throw new AdminDataError(
      'Siwa is the default market and the fallback for every unmapped host. It cannot be deleted.'
    );
  }
  if (!(await queryOne('SELECT slug FROM markets WHERE slug = ? LIMIT 1', [target]))) {
    throw new AdminDataError(`Market "${target}" not found.`, 404);
  }

  const bizCount = (await queryOne('SELECT COUNT(*) AS n FROM businesses WHERE market_id = ?', [
    target,
  ])) as any;
  if (Number(bizCount?.n) > 0) {
    throw new AdminDataError(
      `This market still holds ${bizCount.n} listing(s). Move or delete them first.`,
      409,
      'MARKET_NOT_EMPTY'
    );
  }
  const devCount = (await queryOne('SELECT COUNT(*) AS n FROM developments WHERE market_id = ?', [
    target,
  ])) as any;
  if (Number(devCount?.n) > 0) {
    throw new AdminDataError(
      `This market still holds ${devCount.n} compound(s). Delete them first.`,
      409,
      'MARKET_NOT_EMPTY'
    );
  }

  // The city row stays: it is geography, and it may be shared or reused later.
  // Only its back-reference to the deleted market is cleared.
  await execute('UPDATE locations SET market_id = NULL WHERE market_id = ?', [target]);
  await execute('DELETE FROM markets WHERE slug = ?', [target]);

  invalidateMarketCache();
}

/* ─── Compound writes ────────────────────────────────────────────────────── */

function slugify(value: string): string {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Create a compound inside a market, inheriting the market's city by default. */
export async function createCompound(input: any): Promise<{ id: string; slug: string }> {
  const marketSlug = normalizeSlug(input?.market ?? input?.marketId);
  const market = await getMarketBySlug(marketSlug);
  if (!market) {
    throw new AdminDataError(
      `Market "${marketSlug}" does not exist yet. Create it before adding a compound.`,
      404,
      'UNKNOWN_MARKET'
    );
  }

  const nameEn = String(input?.nameEn || '').trim();
  const nameAr = String(input?.nameAr || '').trim() || nameEn;
  if (!nameEn) throw new AdminDataError('A compound needs an English name.');

  // The optional page business. It must already sit in the same market, or the
  // compound would publish another market's listing as its own front page.
  const pageBusinessId = input?.pageBusinessId ? String(input.pageBusinessId).trim() : null;
  if (pageBusinessId) {
    const pageBiz = (await queryOne('SELECT id, market_id FROM businesses WHERE id = ? LIMIT 1', [
      pageBusinessId,
    ])) as any;
    if (!pageBiz) throw new AdminDataError('That page business does not exist.', 404);
    if (String(pageBiz.market_id) !== market.slug) {
      throw new AdminDataError(
        `That business belongs to ${pageBiz.market_id}, not ${market.slug}.`,
        400
      );
    }
  }

  const baseSlug = slugify(nameEn) || 'compound';
  let compoundSlug = baseSlug;
  let counter = 1;
  while (await queryOne('SELECT id FROM developments WHERE slug = ? LIMIT 1', [compoundSlug])) {
    compoundSlug = `${baseSlug}-${counter++}`;
  }

  const status = DEVELOPMENT_STATUSES.includes(String(input?.status))
    ? String(input.status)
    : 'announced';
  const rawYear = Number(input?.deliveryYear);
  const deliveryYear = Number.isFinite(rawYear) && rawYear > 1900 ? Math.trunc(rawYear) : null;

  const rawLat = Number(input?.lat);
  const rawLng = Number(input?.lng);
  const lat = input?.lat !== '' && input?.lat !== undefined && Number.isFinite(rawLat) ? rawLat : null;
  const lng = input?.lng !== '' && input?.lng !== undefined && Number.isFinite(rawLng) ? rawLng : null;

  const id = crypto.randomUUID();

  await execute(
    `INSERT INTO developments (id, market_id, location_id, slug, name_ar, name_en,
                               developer_name, lat, lng, delivery_year, status, active, page_business_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      market.slug,
      input?.locationId ? String(input.locationId) : market.locationId,
      compoundSlug,
      nameAr,
      nameEn,
      input?.developerName ? String(input.developerName) : null,
      lat,
      lng,
      deliveryYear,
      status,
      input?.active === false ? 0 : 1,
      pageBusinessId,
    ]
  );

  return { id, slug: compoundSlug };
}

export async function updateCompound(id: string, patch: any): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Compound id is required.');
  if (!(await queryOne('SELECT id FROM developments WHERE id = ? LIMIT 1', [target]))) {
    throw new AdminDataError('Compound not found.', 404);
  }

  const columns: Record<string, string> = {
    nameAr: 'name_ar',
    nameEn: 'name_en',
    developerName: 'developer_name',
    deliveryYear: 'delivery_year',
    status: 'status',
    active: 'active',
    locationId: 'location_id',
    pageBusinessId: 'page_business_id',
  };

  const sets: string[] = [];
  const params: any[] = [];

  for (const [key, column] of Object.entries(columns)) {
    if (!patch || !(key in patch)) continue;
    let value: any = patch[key];

    if (column === 'status') {
      if (!DEVELOPMENT_STATUSES.includes(String(value))) {
        throw new AdminDataError('Unknown compound status.');
      }
      value = String(value);
    }
    if (column === 'active') value = value ? 1 : 0;
    if (column === 'delivery_year') {
      const year = Number(value);
      value = Number.isFinite(year) && year > 1900 ? Math.trunc(year) : null;
    }
    if (column === 'developer_name') value = value ? String(value) : null;
    if (column === 'location_id') value = value ? String(value) : null;
    // name_ar is NOT NULL, and the generic line below turns '' into NULL, which
    // TiDB rejects. An empty Arabic name means "leave what is there", not "erase".
    if (column === 'name_ar' && !String(value ?? '').trim()) continue;
    if (column === 'name_en' && !String(value || '').trim()) {
      throw new AdminDataError('A compound keeps its English name.');
    }

    sets.push(`${column} = ?`);
    params.push(value === '' ? null : value);
  }

  if (sets.length === 0) return;
  params.push(target);
  await execute(`UPDATE developments SET ${sets.join(', ')} WHERE id = ?`, params);
}

/** Delete a compound only when no listing or unit is filed under it. */
export async function deleteCompound(id: string): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Compound id is required.');

  const bizCount = (await queryOne('SELECT COUNT(*) AS n FROM businesses WHERE development_id = ?', [
    target,
  ])) as any;
  if (Number(bizCount?.n) > 0) {
    throw new AdminDataError(
      `This compound still holds ${bizCount.n} listing(s). Move them out first.`,
      409,
      'COMPOUND_NOT_EMPTY'
    );
  }

  try {
    const unitCount = (await queryOne('SELECT COUNT(*) AS n FROM units WHERE development_id = ?', [
      target,
    ])) as any;
    if (Number(unitCount?.n) > 0) {
      throw new AdminDataError(
        `This compound still holds ${unitCount.n} unit(s). Delete them first.`,
        409,
        'COMPOUND_NOT_EMPTY'
      );
    }
  } catch (error) {
    if (error instanceof AdminDataError) throw error;
    // `units` not migrated: nothing can reference the compound through it.
  }

  await execute('DELETE FROM developments WHERE id = ?', [target]);
}

/** Exposed so a future geography screen can reuse the same validation. */
export function isKnownLocationType(value: string): boolean {
  return LOCATION_TYPES.includes(value);
}
