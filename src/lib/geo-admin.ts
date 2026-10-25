/**
 * The geography tree behind every market.
 *
 * `locations` is one adjacency list — country -> governorate -> city -> town ->
 * area / neighborhood — joined by the unique `path` (`eg/matrouh/siwa/shali`).
 * The path is the real identity: it is what a URL segment, a sitemap entry and
 * a market's city row are derived from, so it is computed on write and never
 * typed by hand.
 *
 * Two rules keep the tree honest:
 *   1. A level only accepts the children it can represent (a country holds
 *      governorates, a neighborhood holds nothing) — see `CHILD_TYPES`.
 *   2. Nothing that a market or a listing depends on can be deleted, because a
 *      market stores `location_id` and every listing inherits it.
 */

import { query, queryOne, execute } from '@/lib/db';
import { AdminDataError } from '@/lib/markets-admin';

export type GeoType =
  | 'country'
  | 'governorate'
  | 'city'
  | 'district'
  | 'town'
  | 'area'
  | 'neighborhood';

/**
 * What may sit under each level. An `area` is allowed straight under a
 * governorate because that is how the North Coast is addressed today
 * (`eg/matrouh/sidi-abdelrahman`), and a `city` reaches a `neighborhood`
 * (`eg/matrouh/siwa/shali`).
 *
 * `district` is the deliberate widening: a city is usually split into districts
 * long before it is split into neighborhoods, so an admin can now say
 * `el-alamein / downtown` without inventing a town. The database column is a
 * plain VARCHAR, so adding the next level here is a code change only.
 */
const CHILD_TYPES: Record<GeoType, GeoType[]> = {
  country: ['governorate'],
  governorate: ['city', 'town', 'area'],
  city: ['district', 'town', 'area', 'neighborhood'],
  district: ['area', 'neighborhood'],
  town: ['area', 'neighborhood'],
  area: ['neighborhood'],
  neighborhood: [],
};

/** country / governorate / city / district / zone — five is where an address stops meaning anything. */
const MAX_DEPTH = 5;

const GEO_TYPE_LABELS: Record<GeoType, string> = {
  country: 'country',
  governorate: 'governorate',
  city: 'city',
  district: 'district',
  town: 'town',
  area: 'area',
  neighborhood: 'neighborhood',
};

export interface GeoNode {
  id: string;
  parentId: string | null;
  type: GeoType;
  slug: string;
  path: string;
  nameAr: string;
  nameEn: string;
  lat: number | null;
  lng: number | null;
  active: boolean;
  sortOrder: number;
  /** The market that claims this place, if any. */
  marketId: string | null;
  /** Businesses filed directly here. */
  listings: number;
  /** Markets whose `location_id` is this row. */
  markets: number;
  children: GeoNode[];
}

export interface GeoOption {
  id: string;
  path: string;
  type: GeoType;
  label: string;
  depth: number;
  marketId: string | null;
}

export function isGeoType(value: string): value is GeoType {
  return Object.prototype.hasOwnProperty.call(CHILD_TYPES, value);
}

export function childTypesFor(type: GeoType): GeoType[] {
  return CHILD_TYPES[type];
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toGeoType(value: any): GeoType {
  const type = String(value || '');
  return isGeoType(type) ? type : 'city';
}

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

/* ─── Reads ──────────────────────────────────────────────────────────────── */

/**
 * The whole tree in one round trip: every location, plus how much supply hangs
 * off each node. Building the tree in memory avoids one query per level.
 */
export async function listGeoTree(): Promise<GeoNode[]> {
  const [rows, listingRows, marketRows] = await Promise.all([
    query(
      `SELECT id, parent_id, type, slug, path, name, name_ar, name_en,
              lat, lng, active, sort_order, market_id
       FROM locations
       ORDER BY sort_order, name_en, name`
    ),
    query(
      `SELECT location_id, COUNT(*) AS n
       FROM businesses
       WHERE location_id IS NOT NULL
       GROUP BY location_id`
    ),
    query(
      `SELECT location_id, COUNT(*) AS n
       FROM markets
       WHERE location_id IS NOT NULL
       GROUP BY location_id`
    ),
  ]);

  const listingsBy = new Map<string, number>();
  for (const row of listingRows as any[]) {
    listingsBy.set(String(row.location_id), Number(row.n) || 0);
  }
  const marketsBy = new Map<string, number>();
  for (const row of marketRows as any[]) {
    marketsBy.set(String(row.location_id), Number(row.n) || 0);
  }

  const nodes = new Map<string, GeoNode>();
  for (const row of rows as any[]) {
    const id = String(row.id);
    nodes.set(id, {
      id,
      parentId: row.parent_id ? String(row.parent_id) : null,
      type: toGeoType(row.type),
      slug: String(row.slug || id),
      path: String(row.path || id),
      nameAr: String(row.name_ar || row.name || row.slug || id),
      nameEn: String(row.name_en || row.name || row.slug || id),
      lat: toNumber(row.lat),
      lng: toNumber(row.lng),
      active: Boolean(Number(row.active)),
      sortOrder: Number(row.sort_order) || 0,
      marketId: row.market_id ? String(row.market_id) : null,
      listings: listingsBy.get(id) || 0,
      markets: marketsBy.get(id) || 0,
      children: [],
    });
  }

  const roots: GeoNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/**
 * Flatten a loaded tree into `<select>` options. Pure, so a caller that already
 * holds the tree does not pay for a second read.
 */
export function flattenGeo(tree: GeoNode[]): GeoOption[] {
  const options: GeoOption[] = [];

  const walk = (nodes: GeoNode[], trail: string[]) => {
    for (const node of nodes) {
      const names = [...trail, node.nameEn];
      options.push({
        id: node.id,
        path: node.path,
        type: node.type,
        label: names.join(' / '),
        depth: node.path.split('/').filter(Boolean).length,
        marketId: node.marketId,
      });
      walk(node.children, names);
    }
  };

  walk(tree, []);
  return options;
}

/** The whole tree, flattened and labelled for a `<select>`. */
export async function listGeoOptions(): Promise<GeoOption[]> {
  return flattenGeo(await listGeoTree());
}

async function requireRow(id: string) {
  const row = (await queryOne(
    'SELECT id, parent_id, type, slug, path FROM locations WHERE id = ? LIMIT 1',
    [id]
  )) as any;
  if (!row) throw new AdminDataError(`Location "${id}" does not exist.`, 404);
  return row;
}

async function requireMarket(slug: string): Promise<string> {
  const market = (await queryOne('SELECT slug FROM markets WHERE slug = ? LIMIT 1', [slug])) as any;
  if (!market) {
    throw new AdminDataError(`Market "${slug}" does not exist yet.`, 404, 'UNKNOWN_MARKET');
  }
  return String(market.slug);
}

/** The market that uses this row as its city, if one does. */
async function marketSittingAt(locationId: string): Promise<string | null> {
  const row = (await queryOne('SELECT slug FROM markets WHERE location_id = ? LIMIT 1', [
    locationId,
  ])) as any;
  return row?.slug ? String(row.slug) : null;
}

/* ─── Writes ─────────────────────────────────────────────────────────────── */

/**
 * Add a place under an existing one. The id follows the same
 * `<parent>-<slug>` convention the seeds use, and the path is derived, so a new
 * city is addressable the moment it is written.
 */
export async function createLocation(input: any): Promise<{ id: string; path: string }> {
  const parentId = String(input?.parentId || input?.parent_id || '').trim();
  if (!parentId) {
    throw new AdminDataError(
      'Every place sits under a parent — pick the governorate (or the city) it belongs to.',
      400,
      'PARENT_REQUIRED'
    );
  }

  const parent = await requireRow(parentId);
  const parentType = toGeoType(parent.type);
  const allowed = CHILD_TYPES[parentType];

  if (allowed.length === 0) {
    throw new AdminDataError(
      `A ${GEO_TYPE_LABELS[parentType]} is the end of the line — nothing can sit inside it.`,
      400,
      'GEO_TYPE_NOT_ALLOWED'
    );
  }

  const requestedType = String(input?.type || '').trim();
  const type: GeoType = isGeoType(requestedType) ? requestedType : allowed[0];
  if (!allowed.includes(type)) {
    throw new AdminDataError(
      `A ${GEO_TYPE_LABELS[parentType]} can only hold: ${allowed
        .map((child) => GEO_TYPE_LABELS[child])
        .join(', ')}.`,
      400,
      'GEO_TYPE_NOT_ALLOWED'
    );
  }

  const parentPath = String(parent.path || parent.id);
  if (parentPath.split('/').filter(Boolean).length + 1 > MAX_DEPTH) {
    throw new AdminDataError(
      `The tree stops at ${MAX_DEPTH} levels: country / governorate / city / district / zone.`,
      400,
      'GEO_DEPTH_EXCEEDED'
    );
  }

  const nameEn = String(input?.nameEn || input?.name_en || '').trim();
  const nameAr = String(input?.nameAr || input?.name_ar || '').trim() || nameEn;
  if (!nameEn) throw new AdminDataError('An English name is required.');

  const slug = slugify(String(input?.slug || nameEn));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new AdminDataError(
      'This name has no Latin letters in it, so it needs an explicit slug — lowercase letters, digits and single hyphens, for example "hurghada".'
    );
  }

  const path = `${parentPath}/${slug}`;
  if (await queryOne('SELECT id FROM locations WHERE path = ? LIMIT 1', [path])) {
    throw new AdminDataError(`"${path}" already exists.`, 409, 'LOCATION_EXISTS');
  }

  const baseId = `${parentId}-${slug}`;
  let id = baseId;
  let counter = 1;
  while (await queryOne('SELECT id FROM locations WHERE id = ? LIMIT 1', [id])) {
    id = `${baseId}-${counter++}`;
  }

  let marketId: string | null = null;
  if (input?.marketId) marketId = await requireMarket(String(input.marketId).trim().toLowerCase());

  const sortOrder = Number(input?.sortOrder);

  await execute(
    `INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path,
                            lat, lng, market_id, active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      nameEn,
      nameAr,
      nameEn,
      type,
      parentId,
      slug,
      path,
      toNumber(input?.lat),
      toNumber(input?.lng),
      marketId,
      input?.active === false ? 0 : 1,
      Number.isFinite(sortOrder) ? sortOrder : 100,
    ]
  );

  return { id, path };
}

/**
 * Update a place. Renaming its slug rewrites the path of itself and of every
 * descendant, because children carry the full path with them. A market's own
 * city cannot be renamed away from the market's slug: `createMarket` looks that
 * row up by path, so a divergence would silently create a second city.
 */
export async function updateLocation(id: string, patch: any): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Location id is required.');

  const current = await requireRow(target);

  if (patch && 'slug' in patch) {
    const nextSlug = slugify(String(patch.slug || ''));
    const currentSlug = String(current.slug || '');

    if (nextSlug && nextSlug !== currentSlug) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nextSlug)) {
        throw new AdminDataError(
          'Slug must be lowercase letters, digits and single hyphens — for example "hurghada".'
        );
      }

      const owningMarket = await marketSittingAt(target);
      if (owningMarket && owningMarket !== nextSlug) {
        throw new AdminDataError(
          `This row is the city of the "${owningMarket}" market, so its slug has to stay "${owningMarket}".`,
          409,
          'LOCATION_IS_MARKET_CITY'
        );
      }

      const oldPath = String(current.path || current.id);
      const parentPath = oldPath.split('/').slice(0, -1).join('/');
      const newPath = parentPath ? `${parentPath}/${nextSlug}` : nextSlug;

      if (await queryOne('SELECT id FROM locations WHERE path = ? AND id <> ? LIMIT 1', [newPath, target])) {
        throw new AdminDataError(`"${newPath}" already exists.`, 409, 'LOCATION_EXISTS');
      }

      // Children first: their paths embed the old prefix.
      const descendants = (await query(
        'SELECT id, path FROM locations WHERE path LIKE ?',
        [`${oldPath}/%`]
      )) as any[];
      for (const child of descendants) {
        const rewritten = `${newPath}${String(child.path).slice(oldPath.length)}`;
        await execute('UPDATE locations SET path = ? WHERE id = ?', [rewritten, String(child.id)]);
      }

      await execute('UPDATE locations SET path = ?, slug = ? WHERE id = ?', [
        newPath,
        nextSlug,
        target,
      ]);
    }
  }

  const columns: Record<string, string> = {
    nameAr: 'name_ar',
    nameEn: 'name_en',
    lat: 'lat',
    lng: 'lng',
    active: 'active',
    sortOrder: 'sort_order',
    marketId: 'market_id',
  };

  const sets: string[] = [];
  const params: any[] = [];

  for (const [key, column] of Object.entries(columns)) {
    if (!patch || !(key in patch)) continue;
    let value: any = patch[key];

    if (column === 'active') value = value ? 1 : 0;
    if (column === 'sort_order') {
      const numeric = Number(value);
      value = Number.isFinite(numeric) ? numeric : 100;
    }
    if (column === 'lat' || column === 'lng') value = toNumber(value);
    if (column === 'market_id') {
      value = value ? await requireMarket(String(value).trim().toLowerCase()) : null;
    }
    if ((column === 'name_ar' || column === 'name_en') && !String(value || '').trim()) {
      throw new AdminDataError('A place keeps both names: neither can be empty.');
    }

    sets.push(`${column} = ?`);
    params.push(value === '' ? null : value);
  }

  if (sets.length === 0) return;
  params.push(target);
  await execute(`UPDATE locations SET ${sets.join(', ')} WHERE id = ?`, params);
}

/**
 * Delete a place only when nothing depends on it. Geography outlives the
 * market that claimed it, so a market's city is refused rather than cascaded.
 */
export async function deleteLocation(id: string): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Location id is required.');

  const current = await requireRow(target);

  const children = (await queryOne('SELECT COUNT(*) AS n FROM locations WHERE parent_id = ?', [
    target,
  ])) as any;
  if (Number(children?.n) > 0) {
    throw new AdminDataError(
      `"${current.path}" still holds ${children.n} place(s) — delete or move them first.`,
      409,
      'LOCATION_HAS_CHILDREN'
    );
  }

  const owningMarket = await marketSittingAt(target);
  if (owningMarket) {
    throw new AdminDataError(
      `"${current.path}" is the city of the "${owningMarket}" market. Move the market to another place first.`,
      409,
      'LOCATION_IS_MARKET_CITY'
    );
  }

  const listings = (await queryOne('SELECT COUNT(*) AS n FROM businesses WHERE location_id = ?', [
    target,
  ])) as any;
  if (Number(listings?.n) > 0) {
    throw new AdminDataError(
      `"${current.path}" still holds ${listings.n} listing(s). Re-file them first.`,
      409,
      'LOCATION_HAS_LISTINGS'
    );
  }

  await execute('DELETE FROM locations WHERE id = ?', [target]);
}
