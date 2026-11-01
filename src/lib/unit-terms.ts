/**
 * The vocabulary of a unit, with no database behind it.
 *
 * `units-admin.ts` owns the writes and `developments.ts` owns the reads, but a
 * form and a public card need the same words without pulling mysql2 into the
 * browser bundle, so the lists live here and both sides import them.
 */

export const UNIT_KINDS = ['rent_night', 'rent_month', 'sale'] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export const UNIT_STATUSES = ['available', 'reserved', 'sold', 'rented', 'inactive'] as const;

/**
 * Per what period `price` is counted.
 *
 * `listing_kind` already implied a period — night, month, total — but the
 * inference fails on a timeshare week, which is *sold* (so the kind is `sale`)
 * and priced per week. Keeping this orthogonal rather than adding a fourth
 * `listing_kind` value is deliberate: `UNIT_KINDS` and the read in
 * `developments.ts` both whitelist the three enum values and coerce anything
 * unknown to `rent_night`, so a new enum value would have rendered a timeshare
 * as a nightly rental instead of failing loudly.
 *
 * A NULL column keeps the old inference, so no row written before this existed
 * changes meaning. `inferredPriceBasis` is that old rule, in one place.
 */
export const UNIT_PRICE_BASIS = ['total', 'night', 'month', 'week', 'year'] as const;
export type UnitPriceBasis = (typeof UNIT_PRICE_BASIS)[number];

const PRICE_BASIS_LABEL: Record<UnitPriceBasis, { en: string; ar: string }> = {
  total: { en: 'Total price', ar: 'السعر الإجمالي' },
  night: { en: 'Per night', ar: 'لكل ليلة' },
  month: { en: 'Per month', ar: 'لكل شهر' },
  week: { en: 'Per week', ar: 'لكل أسبوع' },
  year: { en: 'Per year', ar: 'لكل سنة' },
};

export function isUnitPriceBasis(value: unknown): value is UnitPriceBasis {
  return (UNIT_PRICE_BASIS as readonly string[]).includes(String(value ?? '').trim().toLowerCase());
}

/** The period a price is counted in, falling back to the pre-column inference. */
export function resolvePriceBasis(
  stored: unknown,
  listingKind: unknown
): UnitPriceBasis {
  if (isUnitPriceBasis(stored)) return String(stored).trim().toLowerCase() as UnitPriceBasis;
  return inferredPriceBasis(listingKind);
}

export function inferredPriceBasis(listingKind: unknown): UnitPriceBasis {
  const kind = String(listingKind ?? '').trim();
  if (kind === 'rent_night') return 'night';
  if (kind === 'rent_month') return 'month';
  return 'total';
}

export function priceBasisLabel(value: unknown, ar: boolean): string | null {
  const known = (UNIT_PRICE_BASIS as readonly string[]).includes(String(value ?? ''))
    ? (String(value) as UnitPriceBasis)
    : null;
  return known ? PRICE_BASIS_LABEL[known][ar ? 'ar' : 'en'] : null;
}

/**
 * How a unit is handed over.
 *
 * `finishing` is a VARCHAR and not an ENUM because the coast projects keep
 * naming their own grades; this is what the forms offer, and a value written
 * some other way is kept and printed as typed rather than rejected.
 */
export const UNIT_FINISHING_OPTIONS = [
  { id: 'finished', en: 'Fully finished', ar: 'تشطيب كامل' },
  { id: 'super_finish', en: 'Super finish', ar: 'سوبر تشطيب' },
  { id: 'semi_finished', en: 'Semi finished', ar: 'نصف تشطيب' },
  { id: 'core_and_shell', en: 'Core and shell', ar: 'بدون تشطيب' },
] as const;

export function finishingLabel(value: string | null | undefined, ar: boolean): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const known = UNIT_FINISHING_OPTIONS.find((option) => option.id === text);
  return known ? known[ar ? 'ar' : 'en'] : text;
}

/**
 * The offer terms that belong on `units` and nowhere else.
 *
 * A field declared over one of these names would create a second answer to the
 * same question, and the two would drift the first time a price changed. The
 * field editor refuses them and points at the inventory screen instead.
 */
export const UNIT_TERM_COLUMNS = [
  'listing_kind', 'unit_type', 'bedrooms', 'bathrooms', 'area_sqm', 'price', 'currency',
  'price_per_sqm', 'price_basis', 'down_payment_pct', 'installment_years', 'delivery_year',
  'finishing', 'furnished', 'deposit', 'deposit_months', 'min_stay_nights',
  'available_from', 'amenities', 'status',
] as const;

/** The names a vendor would plausibly type, including their singular forms. */
const UNIT_TERM_ALIASES = new Set<string>([
  ...UNIT_TERM_COLUMNS,
  'bedroom', 'bathroom', 'area', 'size', 'sqm', 'price_per_m2', 'priceperm2',
  'min_stay', 'deposit_amount', 'available_from_date', 'handover_year',
  // `unit_type` was a real column the guard did not cover, so a form field of
  // the same name could be created and answer the same question twice. Note
  // `room_type` is deliberately NOT here: it is the hotel's offer category
  // (`accommodation` catalog spec), a different question from what a unit is.
  'property_type', 'asset_type', 'unittype',
  'price_per', 'price_period', 'pricebasis', 'price_unit', 'rent_period',
]);

/**
 * Does this field name collide with a real column?
 *
 * Compared on the slugified form so `areaSqm`, `area_sqm` and `Area SQM` all
 * hit the same guard.
 */
export function collidesWithUnitTerm(name: unknown): string | null {
  const raw = String(name ?? '').trim();
  if (!raw) return null;
  const flattened = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!flattened) return null;
  if (UNIT_TERM_ALIASES.has(flattened)) return flattened;
  // `num_rooms`, `rooms_number`: the bedroom question asked with other words.
  // A prose field is allowed to be called `payment_plan`, because the numbers
  // of a plan live on the unit and the words about it do not.
  if (/^(num|no|number)_rooms$/.test(flattened) || /_rooms_number$/.test(flattened)) return 'bedrooms';
  // The same question in the order a vendor actually types it.
  if (/^(num|no|number)_of_rooms$/.test(flattened) || /^(room|bedroom)_count$/.test(flattened)) return 'bedrooms';
  if (/^price_(per|in)_/.test(flattened)) return 'price_basis';
  return null;
}
