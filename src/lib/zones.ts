import { query, queryOne } from '@/lib/db';
import { getMarketBySlug, firstImage } from '@/lib/markets';

/**
 * Zones: the place half of the directory.
 *
 * A market is a city. Under it an admin can carve districts, towns, areas and
 * neighborhoods (`src/lib/geo-admin.ts`), and a listing can be filed at any of
 * those levels. This module turns one of those rows into a public page —
 * /{market}/{zone} — listing everything published inside that place, grouped by
 * the typology a visitor came for.
 *
 * Listings with `location_id = NULL` are deliberately excluded. A null means
 * "inherits the market's city", so it belongs to the city and not to one of its
 * districts; counting it in every district would show the same shop three times.
 */

export interface Zone {
  id: string;
  slug: string;
  /** Chain-joined path (`eg/matrouh/el-alamein/downtown`). */
  path: string;
  type: string;
  nameAr: string;
  nameEn: string;
  parentId: string | null;
  lat: number | null;
  lng: number | null;
  marketSlug: string;
  /** Live listings filed at this place or anywhere below it. */
  listings: number;
}

export interface ZoneFacet {
  parentTypeId: string;
  parentTypeName: string;
  /** Arabic name when an editor wrote one; null means "use parentTypeName". */
  parentTypeNameAr: string | null;
  icon: string | null;
  listings: number;
}

export interface ZoneListing {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  typeId: string | null;
  typeName: string | null;
  typeNameAr: string | null;
  parentTypeId: string | null;
  isTrusted: boolean;
  coverImage: string | null;
}

export interface ZoneChip {
  id: string;
  slug: string;
  type: string;
  nameAr: string;
  nameEn: string;
  listings: number;
}

function option(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function toZone(row: any, marketSlug: string): Zone {
  return {
    id: String(row.id),
    slug: String(row.slug),
    path: String(row.path || ''),
    type: String(row.type || 'area'),
    nameAr: String(row.name_ar || row.name || row.slug),
    nameEn: String(row.name_en || row.name || row.slug),
    parentId: row.parent_id ? String(row.parent_id) : null,
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    marketSlug,
    listings: Number(row.listings) || 0,
  };
}

/**
 * One place, resolved inside its market.
 *
 * The market's own city row is excluded: /el-alamein/el-alamein would be the
 * market page wearing a second hat, and two URLs for one page is exactly what
 * the canonical rule at the top of [slug]/page.tsx exists to avoid.
 */
export async function getZone(marketSlug: string, slug: string): Promise<Zone | null> {
  if (!/^[a-z0-9-]+$/.test(marketSlug) || !/^[a-z0-9-]+$/.test(slug)) return null;

  try {
    const market = await getMarketBySlug(marketSlug);
    if (!market || !market.active || !market.locationId) return null;

    const city = await queryOne<{ path: string }>(
      'SELECT path FROM locations WHERE id = ? LIMIT 1',
      [market.locationId]
    );
    const cityPath = option(city?.path);
    // Without a place row the market owns no ground, so it cannot own a zone.
    if (!cityPath) return null;

    const row = await queryOne<any>(
      `SELECT z.id, z.slug, z.path, z.type, z.name, z.name_ar, z.name_en,
              z.parent_id, z.lat, z.lng,
              (SELECT COUNT(*)
                 FROM businesses b
                 JOIN locations l ON l.id = b.location_id
                WHERE b.market_id = ? AND b.status = 'active'
                  AND (l.path = z.path OR l.path LIKE CONCAT(z.path, '/%'))) AS listings
         FROM locations z
        WHERE z.slug = ? AND z.active = 1 AND z.id <> ?
          AND (z.path = ? OR z.path LIKE CONCAT(?, '/%'))
        LIMIT 1`,
      [marketSlug, slug, market.locationId, cityPath, cityPath]
    );

    return row ? toZone(row, marketSlug) : null;
  } catch {
    return null;
  }
}

/** The zone's tabs: how much supply sits under each parent typology. */
export async function getZoneFacets(zone: Zone): Promise<ZoneFacet[]> {
  try {
    const rows = await query(
      `SELECT COALESCE(bt.parent_id, bt.id) AS parent_type_id,
              COALESCE(pt.name, bt.name) AS parent_type_name,
              COALESCE(pt.name_ar, bt.name_ar) AS parent_type_name_ar,
              COALESCE(pt.icon, bt.icon) AS icon,
              COUNT(*) AS listings
         FROM businesses b
         JOIN business_types bt ON bt.id = b.type_id
         LEFT JOIN business_types pt ON pt.id = bt.parent_id
         JOIN locations l ON l.id = b.location_id
        WHERE b.market_id = ? AND b.status = 'active'
          AND (l.path = ? OR l.path LIKE CONCAT(?, '/%'))
        GROUP BY parent_type_id, parent_type_name, parent_type_name_ar, icon
        ORDER BY listings DESC, parent_type_name`,
      [zone.marketSlug, zone.path, zone.path]
    );
    return (rows as any[]).map((row) => ({
      parentTypeId: String(row.parent_type_id),
      parentTypeName: String(row.parent_type_name ?? row.parent_type_id),
      parentTypeNameAr: option(row.parent_type_name_ar),
      icon: row.icon ? String(row.icon) : null,
      listings: Number(row.listings) || 0,
    }));
  } catch {
    return [];
  }
}

/** Everything published in the zone, newest and most-trusted first. */
export async function listZoneListings(zone: Zone, limit = 120): Promise<ZoneListing[]> {
  const capped = Math.min(Math.max(Math.trunc(limit) || 120, 1), 240);
  try {
    const rows = await query(
      `SELECT b.id, b.slug, b.name, b.name_ar, b.type_id, b.is_trusted, b.custom_data,
              bt.name AS type_name, bt.name_ar AS type_name_ar, bt.parent_id
         FROM businesses b
         LEFT JOIN business_types bt ON bt.id = b.type_id
         JOIN locations l ON l.id = b.location_id
        WHERE b.market_id = ? AND b.status = 'active'
          AND (l.path = ? OR l.path LIKE CONCAT(?, '/%'))
        ORDER BY b.is_featured DESC, b.is_trusted DESC, b.created_at DESC
        LIMIT ${capped}`,
      [zone.marketSlug, zone.path, zone.path]
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
        nameAr: option(row.name_ar),
        typeId: option(row.type_id),
        typeName: option(row.type_name),
        typeNameAr: option(row.type_name_ar),
        parentTypeId: option(row.parent_id),
        isTrusted: Number(row.is_trusted) === 1,
        coverImage: firstImage(customData),
      };
    });
  } catch {
    return [];
  }
}

/**
 * The market city's direct children that have supply, for the front door's
 * "browse by area" strip. A district with no listings is not a door.
 */
export async function listMarketZones(marketSlug: string, limit = 8): Promise<ZoneChip[]> {
  const capped = Math.min(Math.max(Math.trunc(limit) || 8, 1), 24);
  try {
    const market = await getMarketBySlug(marketSlug);
    if (!market || !market.locationId) return [];

    const rows = await query(
      `SELECT z.id, z.slug, z.type, z.name, z.name_ar, z.name_en, COUNT(b.id) AS listings
         FROM locations z
         JOIN locations l ON (l.id = z.id OR l.path LIKE CONCAT(z.path, '/%'))
         JOIN businesses b ON b.location_id = l.id
        WHERE z.parent_id = ? AND z.active = 1
          AND b.market_id = ? AND b.status = 'active'
        GROUP BY z.id, z.slug, z.type, z.name, z.name_ar, z.name_en
        ORDER BY listings DESC, z.sort_order, z.name_en
        LIMIT ${capped}`,
      [market.locationId, marketSlug]
    );

    return (rows as any[]).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      type: String(row.type || 'area'),
      nameAr: String(row.name_ar || row.name || row.slug),
      nameEn: String(row.name_en || row.name || row.slug),
      listings: Number(row.listings) || 0,
    }));
  } catch {
    return [];
  }
}
