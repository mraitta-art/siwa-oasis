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
import { dayOnly, execute, query, queryOne } from '@/lib/db';
import { AdminDataError } from '@/lib/markets-admin';
import { UNIT_FINISHING_OPTIONS, UNIT_KINDS, UNIT_STATUSES } from '@/lib/unit-terms';

// The vocabulary is shared with the forms and the public card, and re-exported
// here so every existing caller keeps working.
export { UNIT_KINDS, UNIT_STATUSES, UNIT_FINISHING_OPTIONS };

/** Unit types whose bedroom count is not optional: a tenant asks before booking. */
const RESIDENTIAL_TYPES = new Set([
  'apartment', 'flat', 'villa', 'chalet', 'studio', 'room', 'suite', 'bungalow',
  'townhouse', 'duplex', 'penthouse', 'cabin', 'tent', 'house',
]);

/**
 * What a unit still owes before it can be published.
 *
 * A card without a price is not a listing, it is a placeholder, and renting by
 * the night without a bedroom count breaks every "2 BR" filter. Returns the
 * missing pieces in the reader's words so the admin screen can print them.
 */
export function unitGaps(unit: any): string[] {
  const kind = String(unit?.listing_kind ?? unit?.listingKind ?? '').trim();
  const type = String(unit?.unit_type ?? unit?.unitType ?? '').trim().toLowerCase();
  const price = unit?.price;
  const bedrooms = unit?.bedrooms;
  const gaps: string[] = [];

  if (!(UNIT_KINDS as readonly string[]).includes(kind)) gaps.push('whether it is for rent or for sale');
  if (price === null || price === undefined || price === '') gaps.push('a price');
  if (RESIDENTIAL_TYPES.has(type) && (bedrooms === null || bedrooms === undefined || bedrooms === '')) {
    gaps.push('how many bedrooms it has');
  }
  return gaps;
}

/**
 * What a buyer would still have to phone about.
 *
 * `unitGaps()` blocks publication; this does not. A sale unit with no payment
 * plan is a real unit at a real price, and refusing to save it would push the
 * vendor to invent a number. So the form says "the page will show nothing for
 * this" and lets them decide.
 */
export function unitAdvisories(unit: any): string[] {
  const kind = String(unit?.listing_kind ?? unit?.listingKind ?? '').trim();
  const notes: string[] = [];
  const value = (...keys: string[]) =>
    keys.map((key) => unit?.[key]).find((entry) => entry !== null && entry !== undefined && entry !== '');

  if (kind === 'sale') {
    if (!value('price_per_sqm', 'pricePerSqm') && !value('area_sqm', 'areaSqm')) {
      notes.push('a price per m² or an area, so buyers can compare projects');
    }
    if (!value('down_payment_pct', 'downPaymentPct') && !value('installment_years', 'installmentYears')) {
      notes.push('a payment plan (down payment and years)');
    }
    if (!value('delivery_year', 'deliveryYear')) notes.push('the handover year');
  }
  if (kind === 'rent_month' && !value('deposit') && !value('deposit_months', 'depositMonths')) {
    notes.push('the deposit, in cash or in months');
  }
  return notes;
}

export interface UnitAdmin {
  id: string;
  developmentId: string | null;
  /** The broker or developer whose card this is, when one claimed it. */
  businessId: string | null;
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
  /** Comparison figure a buyer divides by: price over area. */
  pricePerSqm: number | null;
  /** The payment plan, as the two numbers that describe it. */
  downPaymentPct: number | null;
  installmentYears: number | null;
  deliveryYear: number | null;
  finishing: string | null;
  furnished: boolean | null;
  deposit: number | null;
  /** Rentals that quote the deposit in months instead of cash. */
  depositMonths: number | null;
  minStayNights: number | null;
  /** `YYYY-MM-DD`, the first date a renter can move in. */
  availableFrom: string | null;
  amenities: string[];
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
    businessId: row.business_id ? String(row.business_id) : null,
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
    pricePerSqm: numberOrNull(row.price_per_sqm),
    downPaymentPct: numberOrNull(row.down_payment_pct),
    installmentYears: numberOrNull(row.installment_years),
    deliveryYear: numberOrNull(row.delivery_year),
    finishing: row.finishing ? String(row.finishing) : null,
    furnished:
      row.furnished === null || row.furnished === undefined ? null : Boolean(Number(row.furnished)),
    deposit: numberOrNull(row.deposit),
    depositMonths: numberOrNull(row.deposit_months),
    minStayNights: numberOrNull(row.min_stay_nights),
    availableFrom: dayOnly(row.available_from),
    amenities: amenityList(row.amenities),
    status: String(row.status || 'available'),
    active: Boolean(Number(row.active)),
  };
}

/** A comma-separated box on the admin form, a JSON array in the column. */
function amenityList(value: any): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (!value) return [];
  if (Buffer.isBuffer(value)) return amenityList(value.toString('utf8'));
  const text = String(value).trim();
  if (text.startsWith('[')) {
    try { return amenityList(JSON.parse(text)); } catch { /* fall through to CSV */ }
  }
  return text.split(',').map((entry) => entry.trim()).filter(Boolean);
}

/** `units` stores a date, not a timestamp; anything else is a typo, not a date. */
function dateOrNull(value: any): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

/** Kept rather than rejected: projects name their own finishing levels. */
function finishingOrNull(value: any): string | null {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, 64) : null;
}

/** Three states, because "the vendor never said" is not the same as "not". */
function furnishedOrNull(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    if (!value.trim()) return null;
    return /^(1|true|yes|y)$/i.test(value.trim()) ? 1 : 0;
  }
  return value ? 1 : 0;
}

/** Every unit inside one container, newest first. */
export async function listUnitsAdmin(developmentId: string): Promise<UnitAdmin[]> {
  return selectUnits('development_id = ?', [String(developmentId || '').trim()]);
}

/**
 * Everything one business has on sale or under rent.
 *
 * A broker's own cards carry `business_id`, and a developer's project units
 * hang off the container instead, so the vendor's screen unions the two: a
 * broker handed a compound would otherwise see an empty page.
 */
export async function listUnitsForBusiness(businessId: string, developmentId?: string | null): Promise<UnitAdmin[]> {
  const clauses = ['business_id = ?'];
  const params: any[] = [String(businessId || '').trim()];
  if (developmentId) {
    clauses.push('development_id = ?');
    params.push(String(developmentId));
  }
  return selectUnits(clauses.join(' OR '), params);
}

async function selectUnits(where: string, params: any[]): Promise<UnitAdmin[]> {
  if (!String(params[0] || '').trim()) return [];
  try {
    const rows = await query(
      `SELECT id, market_id, development_id, business_id, slug, title_ar, title_en,
              unit_type, listing_kind, bedrooms, bathrooms, area_sqm, price, currency,
              price_per_sqm, down_payment_pct, installment_years, delivery_year,
              finishing, furnished, deposit, deposit_months, min_stay_nights,
              available_from, amenities, status, active
         FROM units
        WHERE ${where}
        ORDER BY created_at DESC`,
      params
    );
    return (rows as any[]).map(toUnit);
  } catch {
    // `units` not migrated: the container simply has no inventory yet.
    return [];
  }
}

async function requireDevelopment(id: string): Promise<any> {
  // The currency belongs to the market, not the container: `developments` never
  // had the column, so it is read from the market the container sits in.
  const development = (await queryOne(
    `SELECT d.id, d.market_id, d.slug, m.currency
       FROM developments d
       LEFT JOIN markets m ON m.id = d.market_id
      WHERE d.id = ?
      LIMIT 1`,
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

  const deposit = numberOrNull(input?.deposit);
  const depositMonths = numberOrNull(input?.depositMonths ?? input?.deposit_months);
  const minStayNights = numberOrNull(input?.minStayNights ?? input?.min_stay_nights);
  const availableFrom = dateOrNull(input?.availableFrom ?? input?.available_from);
  const amenities = amenityList(input?.amenities);
  const active = input?.active === false ? 0 : 1;

  // The publish gate: a unit that goes live has to answer the questions a
  // visitor filters on, or it becomes a blank card in the results.
  if (active) {
    const gaps = unitGaps({
      listingKind,
      price: input?.price,
      unitType: input?.unitType,
      bedrooms: input?.bedrooms,
    });
    if (gaps.length) throw new AdminDataError(`A published unit needs ${gaps.join(', ')}.`);
  }

  const id = crypto.randomUUID();
  // A unit can be handed to the broker who sells it, so their own dashboard
  // shows it without them having to retype it.
  const businessId = String(input?.businessId ?? input?.business_id ?? '').trim() || null;
  await execute(
    `INSERT INTO units (id, market_id, development_id, business_id, slug, title_ar, title_en, unit_type,
                        listing_kind, bedrooms, bathrooms, area_sqm, price, currency,
                        price_per_sqm, down_payment_pct, installment_years, delivery_year,
                        finishing, furnished, deposit, deposit_months, min_stay_nights,
                        available_from, amenities, status, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      String(development.market_id),
      String(development.id),
      businessId,
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
      numberOrNull(input?.pricePerSqm ?? input?.price_per_sqm),
      numberOrNull(input?.downPaymentPct ?? input?.down_payment_pct),
      numberOrNull(input?.installmentYears ?? input?.installment_years),
      numberOrNull(input?.deliveryYear ?? input?.delivery_year),
      finishingOrNull(input?.finishing),
      furnishedOrNull(input?.furnished),
      deposit,
      depositMonths,
      minStayNights,
      availableFrom,
      amenities.length ? JSON.stringify(amenities) : null,
      status,
      active,
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
    pricePerSqm: 'price_per_sqm',
    downPaymentPct: 'down_payment_pct',
    installmentYears: 'installment_years',
    deliveryYear: 'delivery_year',
    finishing: 'finishing',
    furnished: 'furnished',
    businessId: 'business_id',
    deposit: 'deposit',
    depositMonths: 'deposit_months',
    minStayNights: 'min_stay_nights',
    availableFrom: 'available_from',
    amenities: 'amenities',
    status: 'status',
    active: 'active',
  };

  const sets: string[] = [];
  const params: any[] = [];
  // Turning a unit on is the moment the page starts advertising it, so it is
  // also the moment the publish gate is checked.
  const activating = Boolean(patch && 'active' in patch && patch.active);

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
    if (
      [
        'bedrooms', 'bathrooms', 'area_sqm', 'price', 'deposit', 'deposit_months',
        'min_stay_nights', 'price_per_sqm', 'down_payment_pct', 'installment_years',
        'delivery_year',
      ].includes(column)
    ) {
      value = numberOrNull(value);
    }
    if (column === 'available_from') value = dateOrNull(value);
    if (column === 'finishing') value = finishingOrNull(value);
    if (column === 'furnished') value = furnishedOrNull(value);
    if (column === 'business_id') value = String(value ?? '').trim() || null;
    if (column === 'amenities') {
      const list = amenityList(value);
      value = list.length ? JSON.stringify(list) : null;
    }

    sets.push(`${column} = ?`);
    params.push(value === '' ? null : value);
  }

  if (sets.length === 0) return;
  params.push(target);
  await execute(`UPDATE units SET ${sets.join(', ')} WHERE id = ?`, params);

  if (activating) {
    const row = await queryOne(
      'SELECT listing_kind, price, unit_type, bedrooms FROM units WHERE id = ? LIMIT 1',
      [target]
    );
    const gaps = unitGaps(row);
    if (gaps.length) {
      // Roll the switch back: an incomplete unit must not stay published just
      // because the rest of the patch was accepted.
      await execute('UPDATE units SET active = 0 WHERE id = ?', [target]);
      throw new AdminDataError(`A published unit needs ${gaps.join(', ')}.`);
    }
  }
}

export async function deleteUnit(id: string): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Unit id is required.');
  const count = (await queryOne('SELECT COUNT(*) AS n FROM units WHERE id = ?', [target])) as any;
  if (!Number(count?.n)) throw new AdminDataError('Unit not found.', 404);
  await execute('DELETE FROM units WHERE id = ?', [target]);
}
