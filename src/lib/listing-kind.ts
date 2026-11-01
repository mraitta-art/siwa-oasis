/**
 * Listing kind specialization — the public-facing "what kind of offer is this"
 * layer over the raw `units.listing_kind` column.
 *
 * `unit-terms.ts` already owns the enum (`sale | rent_month | rent_night`) and
 * the price basis (`total | night | month | week | year`). Those are storage
 * truths. This file is presentation truth: given what a minisite actually
 * offers, which specialization badge, accent, CTA wording, and price unit does
 * the public visitor see?
 *
 * Three verticals, three visible characters:
 *   - Sale / Development  →  للبيع · gold · "Get Payment Plan" · total price
 *   - Long-term Rent      →  للإيجار الشهري · teal · "Schedule Viewing" · per month
 *   - Short-range Stay    →  لإقامة قصيرة · coral · "Book Your Stay" · per night
 *
 * Everything here is pure. No db, no next/headers, safe to import in a client
 * component. `formatPrice` uses `Intl.NumberFormat` with the locale the minisite
 * speaks, so Arabic pages get Arabic-indic or Latin digits consistently.
 */

import { UNIT_KINDS, type UnitKind, type UnitPriceBasis, resolvePriceBasis } from '@/lib/unit-terms';

export type ListingKind = UnitKind;
export const LISTING_KINDS: readonly ListingKind[] = UNIT_KINDS;

export function isListingKind(value: unknown): value is ListingKind {
  return typeof value === 'string' && (LISTING_KINDS as readonly string[]).includes(value);
}

// ─── The specialization card ────────────────────────────────────────────────
export interface ListingKindSpec {
  /** Stable id — the value on `units.listing_kind`. */
  kind: ListingKind;
  /** Public badge text. */
  badge: { ar: string; en: string };
  /** Compact tag for the shell header. */
  tag: { ar: string; en: string };
  /** The dominant CTA label the hero + primary buttons offer. */
  heroCta: { ar: string; en: string };
  /** Secondary CTA (contact, brochure, calendar). */
  secondaryCta: { ar: string; en: string };
  /** Accent used when the parent has not supplied one. */
  accent: string;
  /** What period a price is counted in — used by the formatter. */
  defaultPriceBasis: UnitPriceBasis;
  /** The unit suffix shown after a formatted price. */
  priceSuffix: { ar: string; en: string } | null;
  /** Field names the admin should see offered for a data slide, prioritized. */
  recommendedSlideFields: string[];
  /** Short one-line positioning shown on the minisite sub-hero. */
  subtitle: { ar: string; en: string };
}

export const LISTING_KIND_SPEC: Record<ListingKind, ListingKindSpec> = {
  sale: {
    kind: 'sale',
    badge: { ar: 'لِلبيع', en: 'For Sale' },
    tag: { ar: 'تطوير عقاري', en: 'Development' },
    heroCta: { ar: 'اطّلع على خطة السداد', en: 'Get Payment Plan' },
    secondaryCta: { ar: 'احجز زيارة الموقع', en: 'Book Site Visit' },
    accent: '#D4AF37',
    defaultPriceBasis: 'total',
    priceSuffix: null,
    recommendedSlideFields: [
      'price', 'down_payment_pct', 'installment_years', 'monthly_installment',
      'area_sqm', 'handover_date', 'delivery_year', 'finishing',
    ],
    subtitle: {
      ar: 'وحدات تمليك بخطة سداد من المطوّر',
      en: 'Freehold units with a developer payment plan',
    },
  },
  rent_month: {
    kind: 'rent_month',
    badge: { ar: 'لِلإيجار الشهري', en: 'Monthly Rent' },
    tag: { ar: 'إيجار طويل', en: 'Long-term Lease' },
    heroCta: { ar: 'احجز معاينة', en: 'Schedule Viewing' },
    secondaryCta: { ar: 'تواصل مع المالك', en: 'Contact Landlord' },
    accent: '#2DD4BF',
    defaultPriceBasis: 'month',
    priceSuffix: { ar: '/الشهر', en: '/month' },
    recommendedSlideFields: [
      'price', 'deposit', 'deposit_months', 'available_from',
      'area_sqm', 'furnished', 'bedrooms', 'contract_length',
    ],
    subtitle: {
      ar: 'إيجار سنوي أو شهري بعقد موثّق',
      en: 'Long lease with documented contract terms',
    },
  },
  rent_night: {
    kind: 'rent_night',
    badge: { ar: 'لِإقامة قصيرة', en: 'Short Stay' },
    tag: { ar: 'ضيافة', en: 'Hospitality' },
    heroCta: { ar: 'احجز إقامتك', en: 'Book Your Stay' },
    secondaryCta: { ar: 'توفّر الليالي', en: 'Check Availability' },
    accent: '#FB7185',
    defaultPriceBasis: 'night',
    priceSuffix: { ar: '/الليلة', en: '/night' },
    recommendedSlideFields: [
      'price', 'min_stay_nights', 'bedrooms', 'max_occupancy',
      'breakfast_included', 'amenities', 'check_in_time', 'rating',
    ],
    subtitle: {
      ar: 'إقامة بالليل مع خدمات الضيافة',
      en: 'Nightly stays with hospitality services',
    },
  },
};

// ─── Detection ──────────────────────────────────────────────────────────────
/**
 * A unit shape loose enough to accept the server's UnitSummary or a client's
 * ad-hoc row. Only `listingKind` is required; `price` is optional and used
 * to break ties when a business has two kinds and the cheapest should lead.
 */
export interface KindBearing {
  listingKind?: unknown;
  listing_kind?: unknown;
  price?: unknown;
  currency?: unknown;
  priceBasis?: unknown;
  price_basis?: unknown;
}

export interface DetectedKind {
  /** The kind the minisite presents publicly. Never null when any unit exists. */
  primary: ListingKind | null;
  /** Every kind the business holds, sorted by the count of units. */
  all: ListingKind[];
  /** How many units were inspected. */
  count: number;
  /** True when more than one kind is present (mixed-business case). */
  mixed: boolean;
}

/**
 * Decide what the public minisite should say this business is.
 *
 * Rule (kept simple and honest):
 *   - 1 kind  → that kind is primary.
 *   - N kinds → the one with the most units wins; ties broken by
 *               sale > rent_month > rent_night (owner intent order, since a
 *               developer selling most units and renting a few still reads
 *               "For Sale" to a visitor).
 *   - 0 kinds → null; the business wears no specialization badge.
 */
export function detectListingKind(units: KindBearing[] | undefined | null): DetectedKind {
  if (!Array.isArray(units) || units.length === 0) {
    return { primary: null, all: [], count: 0, mixed: false };
  }
  const tally = new Map<ListingKind, number>();
  for (const u of units) {
    const raw = u?.listingKind ?? u?.listing_kind;
    if (!isListingKind(raw)) continue;
    tally.set(raw, (tally.get(raw) || 0) + 1);
  }
  const all = [...tally.keys()];
  if (all.length === 0) {
    return { primary: null, all: [], count: units.length, mixed: false };
  }
  const priority: Record<ListingKind, number> = { sale: 3, rent_month: 2, rent_night: 1 };
  const primary = all.sort((a, b) => {
    const ca = tally.get(a) || 0;
    const cb = tally.get(b) || 0;
    if (cb !== ca) return cb - ca;
    return priority[b] - priority[a];
  })[0];
  return {
    primary,
    all,
    count: units.length,
    mixed: all.length > 1,
  };
}

/** Safe accessor: never returns null, uses a soft default for unknown kinds. */
export function specFor(kind: ListingKind | null | undefined): ListingKindSpec | null {
  if (!isListingKind(kind)) return null;
  return LISTING_KIND_SPEC[kind];
}

// ─── Price formatting ───────────────────────────────────────────────────────
const CURRENCY_LOCALE: Record<string, string> = {
  EGP: 'ar-EG',
  USD: 'en-US',
  EUR: 'de-DE',
  SAR: 'ar-SA',
  AED: 'ar-AE',
  GBP: 'en-GB',
};

/**
 * Arabic-first: minisites print with Latin digits because that is what the
 * market already reads on price cards (a compound's price tag uses Western
 * numerals even in Arabic copy). Flip `useArabicIndic` to true if the platform
 * ever commits to Arabic-Indic digits across the whole surface.
 */
export interface FormatPriceOptions {
  ar?: boolean;
  useArabicIndic?: boolean;
  compact?: boolean;
  showSuffix?: boolean;
}

/** Compact short-form thresholds so a "4,250,000 EGP" reads as "4.25M EGP". */
function compactThresholds() {
  return [
    { divisor: 1_000_000_000, suffix: 'B' },
    { divisor: 1_000_000, suffix: 'M' },
    { divisor: 1_000, suffix: 'K' },
  ] as const;
}

/**
 * Format a raw amount + currency + basis into a display string.
 *   formatPrice(4_250_000, 'EGP', 'total', { ar: true, compact: true })
 *     → "4.25M EGP"
 *   formatPrice(25_000, 'EGP', 'month',   { ar: true })
 *     → "٢٥٬٠٠٠ EGP /الشهر"
 */
export function formatPrice(
  amount: unknown,
  currency: unknown,
  basis: UnitPriceBasis,
  opts: FormatPriceOptions = {}
): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '';
  const cur = String(currency || 'EGP').toUpperCase().trim() || 'EGP';
  const ar = opts.ar ?? true;
  const locale = opts.useArabicIndic ? 'ar-EG' : (CURRENCY_LOCALE[cur] || 'en-US');
  const numberLocale = opts.useArabicIndic ? locale : 'en-US'; // digits stay Latin by default

  let body: string;
  if (opts.compact) {
    const hit = compactThresholds().find(t => n >= t.divisor);
    if (hit) {
      const scaled = n / hit.divisor;
      body = `${scaled.toFixed(scaled >= 10 ? 0 : 2).replace(/\.00$/, '')}${hit.suffix}`;
    } else {
      body = new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(n);
    }
  } else {
    body = new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(n);
  }

  const currencyTag = cur;
  const suffix = basis !== 'total' ? priceBasisSuffix(basis, ar) : '';
  const shownSuffix = opts.showSuffix === false ? '' : suffix;
  return ar
    ? `${body} ${currencyTag}${shownSuffix ? ' ' + shownSuffix : ''}`
    : `${currencyTag} ${body}${shownSuffix ? ' ' + shownSuffix : ''}`;
}

/** "/الشهر" / "/الليلة" / "/السنة" / "/أسبوع". Empty for total. */
export function priceBasisSuffix(basis: UnitPriceBasis, ar: boolean): string {
  switch (basis) {
    case 'night': return ar ? '/الليلة' : '/night';
    case 'month': return ar ? '/الشهر' : '/month';
    case 'week':  return ar ? '/الأسبوع' : '/week';
    case 'year':  return ar ? '/السنة' : '/year';
    case 'total':
    default:      return '';
  }
}

/** Convenience: pick the basis from a unit's stored value + kind. */
export function priceBasisFor(u: KindBearing | undefined | null): UnitPriceBasis {
  return resolvePriceBasis(u?.priceBasis ?? u?.price_basis, u?.listingKind ?? u?.listing_kind);
}

// ─── Field-name heuristics for the overlay ──────────────────────────────────
/**
 * Some field names are price-bearing regardless of what the admin typed. The
 * overlay uses this to decide whether to run a value through `formatPrice`.
 * A stored "4250000" is only formatted if this returns true, so a phone number
 * or an area never gets a currency sign pasted on it.
 */
const PRICE_BEARING_KEYS = new Set([
  'price', 'total_price', 'starting_price', 'min_price', 'max_price',
  'monthly_rent', 'yearly_rent', 'nightly_rate', 'rate',
  'deposit', 'deposit_amount',
  'monthly_installment', 'installment_amount',
]);

/**
 * Is this field key a price? Matches exact names and common variants like
 * `price_egp`, `sale_price`, `unit_price`.
 */
export function isPriceBearingField(name: unknown): boolean {
  const raw = String(name ?? '').trim().toLowerCase();
  if (!raw) return false;
  if (PRICE_BEARING_KEYS.has(raw)) return true;
  return /(^|_)(price|amount|rent|rate|deposit|installment)(_|$)/.test(raw);
}

/**
 * Format a raw field value if the field key looks like a price. Returns the
 * original string when the field is not price-bearing or when the amount is
 * not a positive number, so admin-authored prose that happens to say "Price:
 * on request" is never mangled.
 */
export function maybeFormatPriceField(
  name: string,
  rawValue: unknown,
  context: { kind: ListingKind | null; currency?: unknown; ar?: boolean; priceBasis?: UnitPriceBasis }
): string {
  const text = String(rawValue ?? '');
  if (!text) return text;
  if (!isPriceBearingField(name)) return text;
  const asNumber = Number(text.replace(/[,\s]/g, ''));
  if (!Number.isFinite(asNumber) || asNumber <= 0) return text;
  const spec = specFor(context.kind);
  const basis = context.priceBasis || spec?.defaultPriceBasis || 'total';
  return formatPrice(asNumber, context.currency || 'EGP', basis, {
    ar: context.ar ?? true,
    compact: basis === 'total' && asNumber >= 100_000,
  });
}
