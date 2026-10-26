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
  'listing_kind', 'bedrooms', 'bathrooms', 'area_sqm', 'price', 'currency',
  'price_per_sqm', 'down_payment_pct', 'installment_years', 'delivery_year',
  'finishing', 'furnished', 'deposit', 'deposit_months', 'min_stay_nights',
  'available_from', 'amenities', 'status',
] as const;

/** The names a vendor would plausibly type, including their singular forms. */
const UNIT_TERM_ALIASES = new Set<string>([
  ...UNIT_TERM_COLUMNS,
  'bedroom', 'bathroom', 'area', 'size', 'sqm', 'price_per_m2', 'priceperm2',
  'min_stay', 'deposit_amount', 'available_from_date', 'handover_year',
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
  return null;
}
