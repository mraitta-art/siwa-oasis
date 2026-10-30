/**
 * Developments and their inventory.
 *
 * A development is a container inside a market — a compound, resort or project
 * ("Hacienda Bay", "Marassi"). It holds businesses of any category (a café, a
 * supermarket, a pharmacy) and units (chalets for rent or sale), which is why
 * it is neither a location nor a business type.
 *
 * The facet query below is what turns one compound page into a directory:
 * group its listings by their parent category and you get the tabs a visitor
 * expects (إقامة · مطاعم · متاجر · خدمات) without a single extra table.
 */

import { dayOnly, query } from '@/lib/db';

/**
 * What a container is, not where it sits.
 *
 * A compound is somebody's project; a town is a settlement that already exists
 * and happens to hold schools, shops and cafés. Both need the same page, so both
 * are `developments` rows and only this classifier differs.
 */
export const DEVELOPMENT_KINDS = ['compound', 'town', 'village', 'resort'] as const;
export type DevelopmentKind = (typeof DEVELOPMENT_KINDS)[number];

/** Kinds that describe a place rather than a developer's project. */
export function isPlaceKind(kind: string): boolean {
  return kind === 'town' || kind === 'village';
}

export function normalizeKind(value: unknown): DevelopmentKind {
  const text = String(value ?? '').trim().toLowerCase();
  return (DEVELOPMENT_KINDS as readonly string[]).includes(text) ? (text as DevelopmentKind) : 'compound';
}

/** `units.amenities` and `developments.facilities` are JSON; a Buffer or a string both mean the same list. */
export function amenitiesOf(value: any): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (!value) return [];
  const text = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * A project-level payment plan, before any unit is entered.
 *
 * `frequency` is the instalment cadence; `post_handover` marks a plan whose
 * instalments only begin after delivery. Numbers are left raw — the calculator
 * in `property-math.ts` turns them into an instalment figure.
 */
export interface PaymentPlan {
  name: string;
  downPaymentPct: number | null;
  installmentYears: number | null;
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  postHandover: boolean;
}

const PAYMENT_FREQUENCIES: PaymentPlan['frequency'][] = ['monthly', 'quarterly', 'semi_annual', 'annual'];

function numberOf(value: any): number | null {
  return value === null || value === undefined || value === '' ? null : Number(value);
}

export function paymentPlansOf(value: any): PaymentPlan[] {
  const raw = Array.isArray(value) ? value : value ? safeJson(value) : null;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry: any) => entry && typeof entry === 'object')
    .map((entry: any) => ({
      name: String(entry.name ?? '').trim(),
      downPaymentPct: numberOf(entry.down_payment_pct ?? entry.downPaymentPct),
      installmentYears: numberOf(entry.installment_years ?? entry.installmentYears),
      frequency: (PAYMENT_FREQUENCIES as readonly string[]).includes(String(entry.frequency))
        ? (String(entry.frequency) as PaymentPlan['frequency'])
        : 'monthly',
      postHandover: Boolean(Number(entry.post_handover ?? entry.postHandover ?? 0)),
    }));
}

function safeJson(value: any): any {
  const text = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export interface Development {
  id: string;
  marketId: string;
  locationId: string | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  kind: DevelopmentKind;
  developerName: string | null;
  lat: number | null;
  lng: number | null;
  deliveryYear: number | null;
  status: 'announced' | 'under_construction' | 'delivered' | 'sold_out';
  /** Business that serves as this compound's page, when one is linked. */
  pageBusinessId: string | null;
  /** Compound-level facilities; a unit may override via its own amenities. */
  facilities: string[];
  /** Advertised payment plans, used to seed the calculator when no unit is entered. */
  paymentPlans: PaymentPlan[];
  /** `YYYY-MM-DD` the admin last checked prices/plans, or null. Printed as "verified on". */
  dataVerifiedAt: string | null;
}

export interface DevelopmentFacet {
  /** Parent category id — the tab. */
  parentTypeId: string;
  parentTypeName: string;
  /** Arabic parent name when an editor wrote one; null means "use parentTypeName". */
  parentTypeNameAr: string | null;
  listings: number;
}

export interface DevelopmentListing {
  id: string;
  slug: string;
  /** English name, unchanged: existing callers keep working. */
  name: string;
  /** Arabic name when an admin wrote one, otherwise the English name. */
  nameAr: string;
  typeId: string;
  typeName: string;
  /** Arabic typology name; null means "use typeName". */
  typeNameAr: string | null;
  parentTypeId: string | null;
}

export interface UnitSummary {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  unitType: string | null;
  listingKind: 'rent_night' | 'rent_month' | 'sale';
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  price: number | null;
  currency: string;
  /** What one square metre costs: the figure a buyer compares projects on. */
  pricePerSqm: number | null;
  /** The payment plan, as the two numbers that describe it. */
  downPaymentPct: number | null;
  installmentYears: number | null;
  deliveryYear: number | null;
  finishing: string | null;
  furnished: boolean | null;
  /** Refundable amount asked for a rental; null on sale units. */
  deposit: number | null;
  depositMonths: number | null;
  minStayNights: number | null;
  /** `YYYY-MM-DD`, so the client component receives a string and not a Date. */
  availableFrom: string | null;
  amenities: string[];
  status: string;
}

function toDevelopment(row: any): Development {
  return {
    id: String(row.id),
    marketId: String(row.market_id),
    locationId: row.location_id ? String(row.location_id) : null,
    slug: String(row.slug),
    nameAr: String(row.name_ar ?? row.name_en ?? row.slug),
    nameEn: String(row.name_en ?? row.name_ar ?? row.slug),
    kind: normalizeKind(row.kind),
    developerName: row.developer_name ? String(row.developer_name) : null,
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    deliveryYear: row.delivery_year === null || row.delivery_year === undefined ? null : Number(row.delivery_year),
    status: (['announced', 'under_construction', 'delivered', 'sold_out'].includes(String(row.status))
      ? String(row.status)
      : 'announced') as Development['status'],
    pageBusinessId: row.page_business_id ? String(row.page_business_id) : null,
    facilities: amenitiesOf(row.facilities),
    paymentPlans: paymentPlansOf(row.payment_plans),
    dataVerifiedAt: dayOnly(row.data_verified_at),
  };
}

const DEVELOPMENT_COLUMNS = `id, market_id, location_id, slug, name_ar, name_en, kind,
  developer_name, lat, lng, delivery_year, status, page_business_id,
  facilities, payment_plans, data_verified_at`;

/**
 * Active containers in one market, for the market's project index.
 *
 * `kind` narrows the list when a caller wants projects only; a market page that
 * separates compounds from towns passes the classifier instead of filtering in
 * the browser, where the two would eventually drift.
 */
export async function listDevelopments(marketSlug: string, kind?: DevelopmentKind): Promise<Development[]> {
  try {
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments
       WHERE active = 1 AND market_id = ?${kind ? ' AND kind = ?' : ''}
       ORDER BY name_en`,
      kind ? [marketSlug, kind] : [marketSlug]
    );
    return (rows || []).map(toDevelopment);
  } catch {
    return [];
  }
}

/**
 * Every active container across markets, for the market-agnostic compare picker.
 *
 * Comparison is not bound to one market, so the picker lists what a visitor can
 * actually line up anywhere on the platform. `kind` defaults to projects only —
 * a town is not something you compare with a compound on price per m².
 */
export async function listAllActiveCompounds(kind?: DevelopmentKind): Promise<Development[]> {
  try {
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments
       WHERE active = 1${kind ? ' AND kind = ?' : ''}
       ORDER BY market_id, name_en`,
      kind ? [kind] : []
    );
    return (rows || []).map(toDevelopment);
  } catch {
    return [];
  }
}

export async function getDevelopmentBySlug(marketSlug: string, slug: string): Promise<Development | null> {
  try {
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments
       WHERE active = 1 AND market_id = ? AND slug = ?
       LIMIT 1`,
      [marketSlug, slug]
    );
    return rows && rows.length > 0 ? toDevelopment(rows[0]) : null;
  } catch {
    return null;
  }
}

/**
 * A container by its id, for callers that already hold the id — a listing's
 * `development_id`, or a compare selection — and have no market/slug to name it.
 */
export async function getDevelopmentById(developmentId: string): Promise<Development | null> {
  const target = String(developmentId || '').trim();
  if (!target) return null;
  try {
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments WHERE active = 1 AND id = ? LIMIT 1`,
      [target]
    );
    return rows && rows.length > 0 ? toDevelopment(rows[0]) : null;
  } catch {
    return null;
  }
}

/**
 * The project a business page speaks for, when the link is stored on the
 * development side (`page_business_id`) rather than on the business.
 *
 * The compound→business pointer is one-way by design, so a Properties minisite
 * that only knows its own business id still reaches its project through here.
 */
export async function getDevelopmentByPageBusinessId(businessId: string): Promise<Development | null> {
  const target = String(businessId || '').trim();
  if (!target) return null;
  try {
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments WHERE active = 1 AND page_business_id = ? LIMIT 1`,
      [target]
    );
    return rows && rows.length > 0 ? toDevelopment(rows[0]) : null;
  } catch {
    return null;
  }
}

/**
 * A project an admin chose to place at siwify.com/{slug} as well as its
 * /{market}/{slug} rule. Resolved across markets (a vanity is global), only for
 * a market-less URL, and only after every other branch in the router — so the
 * flag claims an address, it never steals one.
 */
export async function getRootDevelopment(slug: string): Promise<Development | null> {
  const target = String(slug || '').trim();
  if (!target) return null;
  try {
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments
       WHERE active = 1 AND place_at_root = 1 AND slug = ?
       LIMIT 1`,
      [target]
    );
    return rows && rows.length > 0 ? toDevelopment(rows[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Containers by id, for the comparison view.
 *
 * Comparison is keyed on ids chosen across markets, so this deliberately does
 * not take a market slug — a buyer lining El Alamein against a North Coast
 * project is the whole point. Order follows the ids given, so the columns the
 * user picked stay in the order they picked them.
 */
export async function getDevelopmentsByIds(ids: string[]): Promise<Development[]> {
  const clean = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (clean.length === 0) return [];
  try {
    const placeholders = clean.map(() => '?').join(',');
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments
       WHERE active = 1 AND id IN (${placeholders})`,
      clean
    );
    const byId = new Map<string, Development>(((rows || []) as any[]).map((row) => [String(row.id), toDevelopment(row)]));
    return clean.map((id) => byId.get(id)).filter((d): d is Development => Boolean(d));
  } catch {
    return [];
  }
}

/**
 * Every active container a single developer built, across markets.
 *
 * This is the investor question the free-text `developer_name` could never
 * answer reliably ("sodic" vs "Sodic" were different strings). Now that a
 * development points at a `developers` row, one query returns the portfolio a
 * buyer can browse and line up against itself.
 */
export async function getDevelopmentsByDeveloperId(developerId: string): Promise<Development[]> {
  try {
    const rows = await query(
      `SELECT ${DEVELOPMENT_COLUMNS} FROM developments
       WHERE active = 1 AND developer_id = ?
       ORDER BY market_id, name_en`,
      [developerId]
    );
    return (rows || []).map(toDevelopment);
  } catch {
    return [];
  }
}

/**
 * Which of these developments the admin pinned at the site root.
 *
 * Used to prefer a project's short vanity address over its /{market}/{slug}
 * rule when linking a portfolio. Degrades to an empty set if the flag column is
 * not present yet, so a portfolio built before migration 20261108 still renders.
 */
export async function listRootPinnedSlugs(ids: string[]): Promise<Set<string>> {
  const clean = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (clean.length === 0) return new Set();
  try {
    const placeholders = clean.map(() => '?').join(',');
    const rows = await query(
      `SELECT slug FROM developments WHERE active = 1 AND place_at_root = 1 AND id IN (${placeholders})`,
      clean
    );
    return new Set((rows || []).map((row: any) => String(row.slug)));
  } catch {
    return new Set();
  }
}

/**
 * The compound's own tabs: how many listings it has under each parent category.
 * Groups by the parent when one exists, otherwise by the type itself, so a
 * top-level category still produces a tab instead of disappearing.
 */
export async function getDevelopmentFacets(developmentId: string): Promise<DevelopmentFacet[]> {
  try {
    const rows = await query(
      `SELECT COALESCE(bt.parent_id, bt.id) AS parent_type_id,
              COALESCE(pt.name, bt.name) AS parent_type_name,
              COALESCE(pt.name_ar, bt.name_ar) AS parent_type_name_ar,
              COUNT(*) AS listings
       FROM businesses b
       JOIN business_types bt ON bt.id = b.type_id
       LEFT JOIN business_types pt ON pt.id = bt.parent_id
       WHERE b.development_id = ? AND b.status = 'active'
       GROUP BY parent_type_id, parent_type_name, parent_type_name_ar
       ORDER BY listings DESC, parent_type_name`,
      [developmentId]
    );
    return (rows || []).map((row: any) => ({
      parentTypeId: String(row.parent_type_id),
      parentTypeName: String(row.parent_type_name ?? row.parent_type_id),
      parentTypeNameAr: row.parent_type_name_ar ? String(row.parent_type_name_ar) : null,
      listings: Number(row.listings),
    }));
  } catch {
    return [];
  }
}

/** Listings inside a development, optionally narrowed to one facet/tab. */
export async function listDevelopmentListings(
  developmentId: string,
  options: { parentTypeId?: string | null; limit?: number } = {}
): Promise<DevelopmentListing[]> {
  const limit = Math.min(Math.max(options.limit ?? 60, 1), 200);
  const params: any[] = [developmentId];

  let facetFilter = '';
  if (options.parentTypeId) {
    facetFilter = ' AND COALESCE(bt.parent_id, bt.id) = ?';
    params.push(options.parentTypeId);
  }

  try {
    const rows = await query(
      `SELECT b.id, b.slug, b.name, b.name_ar, b.type_id,
              bt.name AS type_name, bt.name_ar AS type_name_ar, bt.parent_id
       FROM businesses b
       JOIN business_types bt ON bt.id = b.type_id
       WHERE b.development_id = ? AND b.status = 'active'${facetFilter}
       ORDER BY COALESCE(NULLIF(b.name_ar, ''), b.name)
       LIMIT ${limit}`,
      params
    );
    return (rows || []).map((row: any) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      // `||` not `??`: the column is nullable and an admin may have saved an
      // empty string, and an empty title is worse than an English one.
      nameAr: String(row.name_ar || row.name),
      typeId: String(row.type_id),
      typeName: String(row.type_name ?? row.type_id),
      typeNameAr: row.type_name_ar ? String(row.type_name_ar) : null,
      parentTypeId: row.parent_id ? String(row.parent_id) : null,
    }));
  } catch {
    return [];
  }
}

/** Units of inventory under a development, or under one listing business. */
export async function listUnits(
  options: { developmentId?: string | null; businessId?: string | null; listingKind?: UnitSummary['listingKind']; limit?: number }
): Promise<UnitSummary[]> {
  const limit = Math.min(Math.max(options.limit ?? 60, 1), 200);
  const where: string[] = ['active = 1'];
  const params: any[] = [];

  if (options.developmentId) {
    where.push('development_id = ?');
    params.push(options.developmentId);
  }
  if (options.businessId) {
    where.push('business_id = ?');
    params.push(options.businessId);
  }
  if (options.listingKind) {
    where.push('listing_kind = ?');
    params.push(options.listingKind);
  }

  if (params.length === 0) return [];

  try {
    const rows = await query(
      `SELECT id, slug, title_ar, title_en, unit_type, listing_kind,
              bedrooms, bathrooms, area_sqm, price, currency,
              price_per_sqm, down_payment_pct, installment_years, delivery_year,
              finishing, furnished,
              deposit, deposit_months, min_stay_nights, available_from, amenities, status
       FROM units
       WHERE ${where.join(' AND ')}
       ORDER BY price IS NULL, price
       LIMIT ${limit}`,
      params
    );
    return (rows || []).map((row: any) => ({
      id: String(row.id),
      slug: String(row.slug),
      titleAr: String(row.title_ar),
      titleEn: row.title_en ? String(row.title_en) : null,
      unitType: row.unit_type ? String(row.unit_type) : null,
      listingKind: (['rent_night', 'rent_month', 'sale'].includes(String(row.listing_kind))
        ? String(row.listing_kind)
        : 'rent_night') as UnitSummary['listingKind'],
      bedrooms: row.bedrooms === null || row.bedrooms === undefined ? null : Number(row.bedrooms),
      bathrooms: row.bathrooms === null || row.bathrooms === undefined ? null : Number(row.bathrooms),
      areaSqm: row.area_sqm === null || row.area_sqm === undefined ? null : Number(row.area_sqm),
      price: row.price === null || row.price === undefined ? null : Number(row.price),
      currency: String(row.currency || 'EGP'),
      pricePerSqm: row.price_per_sqm === null || row.price_per_sqm === undefined ? null : Number(row.price_per_sqm),
      downPaymentPct:
        row.down_payment_pct === null || row.down_payment_pct === undefined ? null : Number(row.down_payment_pct),
      installmentYears:
        row.installment_years === null || row.installment_years === undefined
          ? null
          : Number(row.installment_years),
      deliveryYear:
        row.delivery_year === null || row.delivery_year === undefined ? null : Number(row.delivery_year),
      finishing: row.finishing ? String(row.finishing) : null,
      furnished:
        row.furnished === null || row.furnished === undefined ? null : Boolean(Number(row.furnished)),
      deposit: row.deposit === null || row.deposit === undefined ? null : Number(row.deposit),
      depositMonths:
        row.deposit_months === null || row.deposit_months === undefined ? null : Number(row.deposit_months),
      minStayNights:
        row.min_stay_nights === null || row.min_stay_nights === undefined
          ? null
          : Number(row.min_stay_nights),
      availableFrom: dayOnly(row.available_from),
      amenities: amenitiesOf(row.amenities),
      status: String(row.status || 'available'),
    }));
  } catch {
    return [];
  }
}

/**
 * The project-level facts a compound page (and a Properties minisite) shows.
 *
 * Extracted verbatim from the inline computation that used to live in
 * CompoundPage, so the bespoke project page and the themed business minisite can
 * never drift: cheapest sale unit, the advertised-or-unit-derived payment plans,
 * the plan with the longest instalment, a calculator seed, and the compare link
 * with up to three same-market competitors. A town or village (`place`) carries
 * none of this, and the flags say so rather than rendering empty panels.
 */
export interface DevelopmentFacts {
  place: boolean;
  plans: PaymentPlan[];
  bestPlan: PaymentPlan | null;
  cheapest: UnitSummary | null;
  calcSeed: {
    price: number;
    downPaymentPct: number;
    installmentYears: number;
    frequency: PaymentPlan['frequency'];
  } | null;
  currency: string;
  hasFacts: boolean;
  competitorIds: string[];
  /** Compare link without a locale prefix; callers add their own. */
  compareQueryString: string;
}

export function buildDevelopmentFacts(
  development: Development,
  units: UnitSummary[],
  siblingProjects: Development[]
): DevelopmentFacts {
  const place = isPlaceKind(development.kind);

  const saleUnits = units.filter((u) => u.listingKind === 'sale' && u.price && u.price > 0);
  const cheapest = saleUnits.reduce<UnitSummary | null>(
    (low, u) => ((low?.price ?? Infinity) > (u.price ?? Infinity) ? u : low),
    saleUnits.length ? saleUnits[0] : null
  );

  // Advertised plans win; unit-derived plans are the fallback.
  const plans: PaymentPlan[] =
    development.paymentPlans.length > 0
      ? development.paymentPlans
      : saleUnits
          .filter((u) => u.downPaymentPct !== null || u.installmentYears !== null)
          .map((u) => ({
            name: '',
            downPaymentPct: u.downPaymentPct,
            installmentYears: u.installmentYears,
            frequency: 'monthly' as PaymentPlan['frequency'],
            postHandover: false,
          }));

  const bestPlan = plans
    .filter((p) => (p.installmentYears ?? 0) > 0)
    .reduce<PaymentPlan | null>((best, p) => ((p.installmentYears ?? 0) > (best?.installmentYears ?? 0) ? p : best), null);

  const calcSeed =
    cheapest?.price && bestPlan?.installmentYears
      ? {
          price: cheapest.price,
          downPaymentPct: bestPlan.downPaymentPct ?? 0,
          installmentYears: bestPlan.installmentYears,
          frequency: bestPlan.frequency,
        }
      : null;

  const currency = units[0]?.currency || 'EGP';
  const hasFacts = !place && (development.facilities.length > 0 || plans.length > 0 || Boolean(development.dataVerifiedAt));

  const competitorIds = siblingProjects
    .filter((s: Development) => s.id !== development.id)
    .slice(0, 3)
    .map((s: Development) => s.id);

  return {
    place,
    plans,
    bestPlan,
    cheapest,
    calcSeed,
    currency,
    hasFacts,
    competitorIds,
    compareQueryString: `/compare/projects?ids=${[development.id, ...competitorIds].join(',')}`,
  };
}
