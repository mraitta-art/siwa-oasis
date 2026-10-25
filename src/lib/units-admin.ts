/**
 * Inventory inside a container.
 *
 * A chalet is not a business. Five hundred chalets in one compound would be
 * five hundred thin minisites; they are `units` rows under one page, so a town
 * or a project can show what is actually for rent or for sale without touching
 * the listing registry. `units` is written here and read by
 * `listUnits()` in `src/lib/developments.ts` for the public page.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from '@/lib/db';
import { AdminDataError } from '@/lib/markets-admin';

export const UNIT_KINDS = ['rent_night', 'rent_month', 'sale'] as const;
export const UNIT_STATUSES = ['available', 'reserved', 'sold', 'rented', 'inactive'] as const;

export interface UnitAdmin {
  id: string;
  developmentId: string | null;
  marketId: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  unitType: string | null;
  listingKind: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  price: number | null;
  currency: string;
  status: string;
  active: boolean;
}

function numberOrNull(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function toUnit(row: any): UnitAdmin {
  return {
    id: String(row.id),
    developmentId: row.development_id ? String(row.development_id) : null,
    marketId: String(row.market_id || 'siwa'),
    slug: String(row.slug),
    titleAr: String(row.title_ar ?? ''),
    titleEn: row.title_en ? String(row.title_en) : null,
    unitType: row.unit_type ? String(row.unit_type) : null,
    listingKind: String(row.listing_kind || 'rent_night'),
    bedrooms: numberOrNull(row.bedrooms),
    bathrooms: numberOrNull(row.bathrooms),
    areaSqm: numberOrNull(row.area_sqm),
    price: numberOrNull(row.price),
    currency: String(row.currency || 'EGP'),
    status: String(row.status || 'available'),
    active: Boolean(Number(row.active)),
  };
}

/** Every unit inside one container, newest first. */
export async function listUnitsAdmin(developmentId: string): Promise<UnitAdmin[]> {
  const target = String(developmentId || '').trim();
  if (!target) return [];
  try {
    const rows = await query(
      `SELECT id, development_id, market_id, slug, title_ar, title_en, unit_type,
              listing_kind, bedrooms, bathrooms, area_sqm, price, currency, status, active
         FROM units
        WHERE development_id = ?
        ORDER BY created_at DESC`,
      [target]
    );
    return (rows as any[]).map(toUnit);
  } catch {
    // `units` not migrated: the container simply has no inventory yet.
    return [];
  }
}

async function requireDevelopment(id: string): Promise<any> {
  const development = (await queryOne(
    'SELECT id, market_id, slug, currency FROM developments WHERE id = ? LIMIT 1',
    [String(id || '')]
  )) as any;
  if (!development) throw new AdminDataError('Container not found.', 404);
  return development;
}

/** Create a unit inside a container. The Arabic title is the required one. */
export async function createUnit(input: any): Promise<{ id: string; slug: string }> {
  const development = await requireDevelopment(input?.developmentId || input?.development_id);

  const titleAr = String(input?.titleAr ?? input?.title_ar ?? '').trim();
  const titleEn = String(input?.titleEn ?? input?.title_en ?? '').trim();
  // Arabic is what the storefront prints when it cannot print English, so a
  // unit without one is a blank card on the Arabic page.
  if (!titleAr) throw new AdminDataError('A unit needs an Arabic title.');

  const listingKind = (UNIT_KINDS as readonly string[]).includes(String(input?.listingKind))
    ? String(input.listingKind)
    : 'rent_night';
  const status = (UNIT_STATUSES as readonly string[]).includes(String(input?.status))
    ? String(input.status)
    : 'available';

  const base = slugify(titleEn || titleAr) || 'unit';
  let unitSlug = `${String(development.slug)}-${base}`;
  let counter = 2;
  while (await queryOne('SELECT id FROM units WHERE slug = ? LIMIT 1', [unitSlug])) {
    unitSlug = `${String(development.slug)}-${base}-${counter++}`;
  }

  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO units (id, market_id, development_id, slug, title_ar, title_en, unit_type,
                        listing_kind, bedrooms, bathrooms, area_sqm, price, currency, status, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      String(development.market_id),
      String(development.id),
      unitSlug,
      titleAr,
      titleEn || null,
      input?.unitType ? String(input.unitType).trim() : null,
      listingKind,
      numberOrNull(input?.bedrooms),
      numberOrNull(input?.bathrooms),
      numberOrNull(input?.areaSqm ?? input?.area_sqm),
      numberOrNull(input?.price),
      input?.currency ? String(input.currency).trim().toUpperCase().slice(0, 3) : development.currency || 'EGP',
      status,
      input?.active === false ? 0 : 1,
    ]
  );

  return { id, slug: unitSlug };
}

export async function updateUnit(id: string, patch: any): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Unit id is required.');
  if (!(await queryOne('SELECT id FROM units WHERE id = ? LIMIT 1', [target]))) {
    throw new AdminDataError('Unit not found.', 404);
  }

  const columns: Record<string, string> = {
    titleAr: 'title_ar',
    titleEn: 'title_en',
    unitType: 'unit_type',
    listingKind: 'listing_kind',
    bedrooms: 'bedrooms',
    bathrooms: 'bathrooms',
    areaSqm: 'area_sqm',
    price: 'price',
    currency: 'currency',
    status: 'status',
    active: 'active',
  };

  const sets: string[] = [];
  const params: any[] = [];

  for (const [key, column] of Object.entries(columns)) {
    if (!patch || !(key in patch)) continue;
    let value: any = patch[key];

    if (column === 'title_ar' && !String(value ?? '').trim()) {
      throw new AdminDataError('A unit keeps its Arabic title.');
    }
    if (column === 'listing_kind') {
      if (!(UNIT_KINDS as readonly string[]).includes(String(value))) {
        throw new AdminDataError('Unknown unit listing kind.');
      }
      value = String(value);
    }
    if (column === 'status') {
      if (!(UNIT_STATUSES as readonly string[]).includes(String(value))) {
        throw new AdminDataError('Unknown unit status.');
      }
      value = String(value);
    }
    if (column === 'active') value = value ? 1 : 0;
    if (column === 'currency') value = String(value || 'EGP').toUpperCase().slice(0, 3);
    if (['bedrooms', 'bathrooms', 'area_sqm', 'price'].includes(column)) {
      value = numberOrNull(value);
    }

    sets.push(`${column} = ?`);
    params.push(value === '' ? null : value);
  }

  if (sets.length === 0) return;
  params.push(target);
  await execute(`UPDATE units SET ${sets.join(', ')} WHERE id = ?`, params);
}

export async function deleteUnit(id: string): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Unit id is required.');
  const count = (await queryOne('SELECT COUNT(*) AS n FROM units WHERE id = ?', [target])) as any;
  if (!Number(count?.n)) throw new AdminDataError('Unit not found.', 404);
  await execute('DELETE FROM units WHERE id = ?', [target]);
}
