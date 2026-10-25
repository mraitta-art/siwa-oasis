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

import { query } from '@/lib/db';

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
  areaSqm: number | null;
  price: number | null;
  currency: string;
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
  };
}

const DEVELOPMENT_COLUMNS = `id, market_id, location_id, slug, name_ar, name_en, kind,
  developer_name, lat, lng, delivery_year, status, page_business_id`;

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
      `SELECT b.id, b.slug, b.name, b.name_ar, b.type_id, bt.name AS type_name, bt.parent_id
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
              bedrooms, area_sqm, price, currency, status
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
      areaSqm: row.area_sqm === null || row.area_sqm === undefined ? null : Number(row.area_sqm),
      price: row.price === null || row.price === undefined ? null : Number(row.price),
      currency: String(row.currency || 'EGP'),
      status: String(row.status || 'available'),
    }));
  } catch {
    return [];
  }
}
