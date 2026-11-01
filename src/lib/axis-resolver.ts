/**
 * The four axes a public minisite composes a slide from.
 *
 * A Properties / Real-Estate business is not one hierarchy — it is four
 * orthogonal ones fused together:
 *
 *   Axis 1 — Typology   (the Layer 0 → parent → child chain the sections
 *                        resolver already returns).
 *   Axis 2 — Developer  (a linked corporate business — brand, portfolio,
 *                        certifications. Absent on pure broker listings).
 *   Axis 3 — Location   (the geography chain: area → city → region → market).
 *   Axis 4 — Units      (the inventory engine, discriminated by listing_kind).
 *
 * Every parent that owns inventory uses the same shape — an "owner" entity,
 * a place, and an inventory engine — with different names per parent.
 *
 * This file turns the loose inputs (a `biz` row + a `PropertyBundle`) into a
 * flat field map that `buildFieldsIndexFromSections` merges into its own
 * result, so a data slide can pick `developer.name` or `location.area` exactly
 * the same way it picks `handover_date` from the typology axis.
 *
 * Pure. No db, no next/headers, safe to import in a client component.
 */

import type { ResolvedField } from '@/lib/slide-blocks';
import type { UnitKind } from '@/lib/unit-terms';
import type { ListingKind } from '@/lib/listing-kind';

/**
 * Loose developer shape. Filled from the linked corporate business when
 * present; a broker-only listing returns null and no `developer.*` keys
 * surface in the picker.
 */
export interface AxisDeveloperInput {
  name?: string | null;
  nameAr?: string | null;
  name_ar?: string | null;
  brand?: string | null;
  foundedYear?: number | string | null;
  founded_year?: number | string | null;
  portfolioCount?: number | null;
  portfolio_count?: number | null;
  certifications?: string[] | string | null;
  yearsInMarket?: number | string | null;
  years_in_market?: number | string | null;
  tagline?: string | null;
  taglineAr?: string | null;
}

export interface AxisLocationInput {
  /** The most specific place label the caller has (neighborhood / district). */
  area?: string | null;
  areaAr?: string | null;
  area_ar?: string | null;
  city?: string | null;
  cityAr?: string | null;
  city_ar?: string | null;
  region?: string | null;
  regionAr?: string | null;
  region_ar?: string | null;
  country?: string | null;
  address?: string | null;
  addressAr?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  landmarks?: string[] | string | null;
}

/**
 * Loose inventory summary. The caller has already collapsed the units to a
 * per-kind roll-up; this file just prints it as fields.
 */
export interface AxisUnitsSummaryInput {
  count?: number;
  availableCount?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  avgPrice?: number | null;
  minAreaSqm?: number | null;
  maxAreaSqm?: number | null;
  bedrooms?: number | null;
  currency?: string;
  listingKind?: ListingKind | UnitKind | null;
  /** When the same business holds multiple kinds, one row per kind. */
  byKind?: Array<{
    kind: ListingKind | UnitKind;
    count?: number;
    minPrice?: number | null;
    maxPrice?: number | null;
    currency?: string;
  }>;
  /** The single cheapest unit — an "Starting from" anchor for the hero. */
  cheapest?: {
    price?: number | null;
    currency?: string;
    title?: string | null;
    listingKind?: ListingKind | UnitKind | null;
  } | null;
  /** Best payment plan for a Sale minisite (Egyptian market default). */
  bestPlan?: {
    downPaymentPct?: number | null;
    installmentYears?: number | null;
    monthlyAmount?: number | null;
    currency?: string;
  } | null;
}

export interface BuildAxesInput {
  developer?: AxisDeveloperInput | null;
  location?: AxisLocationInput | null;
  units?: AxisUnitsSummaryInput | null;
  ar?: boolean;
}

/**
 * Turn the loose axis inputs into a flat field map.
 *
 * A key is only emitted when the input actually carries a value — a business
 * without a developer link never shows `developer.*` rows, and a compound
 * without an inventory rollup has no `unit.*` keys. The overlay then prints
 * the exact label + value; the picker only surfaces keys this function
 * returned, so an admin can't pick a field the minisite cannot answer.
 */
export function buildAxesFieldsIndex(input: BuildAxesInput): Record<string, ResolvedField> {
  const out: Record<string, ResolvedField> = {};
  const ar = input.ar ?? true;

  const dev = input.developer;
  if (dev && hasAny(dev, ['name', 'nameAr', 'name_ar', 'brand', 'foundedYear', 'founded_year', 'portfolioCount', 'portfolio_count', 'certifications', 'yearsInMarket', 'years_in_market', 'tagline', 'taglineAr'])) {
    const devName = dev.name || dev.nameAr || dev.name_ar;
    if (devName) put(out, 'developer.name', arLabel('Developer', 'المطوّر', ar), String(devName));
    const devBrand = dev.brand;
    if (devBrand) put(out, 'developer.brand', arLabel('Brand', 'العلامة', ar), String(devBrand));
    const devFounded = dev.foundedYear ?? dev.founded_year;
    if (devFounded) put(out, 'developer.founded', arLabel('Founded', 'سنة التأسيس', ar), String(devFounded));
    const devYears = dev.yearsInMarket ?? dev.years_in_market ?? (dev.foundedYear || dev.founded_year ? computeYears(dev.foundedYear ?? dev.founded_year) : null);
    if (devYears) put(out, 'developer.years_in_market', arLabel('Years in market', 'سنوات الخبرة', ar), String(devYears));
    const devPortfolio = dev.portfolioCount ?? dev.portfolio_count;
    if (devPortfolio) put(out, 'developer.portfolio_count', arLabel('Projects delivered', 'مشاريع منفّذة', ar), String(devPortfolio));
    const devCerts = normalizeList(dev.certifications);
    if (devCerts.length) put(out, 'developer.certifications', arLabel('Certifications', 'الشهادات', ar), devCerts.join(', '));
    const devTagline = ar && (dev.taglineAr) ? dev.taglineAr : dev.tagline;
    if (devTagline) put(out, 'developer.tagline', arLabel('Tagline', 'الشعار', ar), String(devTagline));
  }

  const loc = input.location;
  if (loc && hasAny(loc, ['area', 'areaAr', 'area_ar', 'city', 'cityAr', 'city_ar', 'region', 'regionAr', 'region_ar', 'country', 'address', 'addressAr', 'coordinates', 'landmarks'])) {
    const area = loc.area || loc.areaAr || loc.area_ar;
    if (area) put(out, 'location.area', arLabel('Area', 'المنطقة', ar), String(area));
    const city = loc.city || loc.cityAr || loc.city_ar;
    if (city) put(out, 'location.city', arLabel('City', 'المدينة', ar), String(city));
    const region = loc.region || loc.regionAr || loc.region_ar;
    if (region) put(out, 'location.region', arLabel('Region', 'الإقليم', ar), String(region));
    if (loc.country) put(out, 'location.country', arLabel('Country', 'الدولة', ar), String(loc.country));
    const address = ar && loc.addressAr ? loc.addressAr : loc.address;
    if (address) put(out, 'location.address', arLabel('Address', 'العنوان', ar), String(address));
    if (loc.coordinates && typeof loc.coordinates === 'object') {
      const { lat, lng } = loc.coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        put(out, 'location.coordinates', arLabel('Coordinates', 'الإحداثيات', ar), `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    }
    const landmarks = normalizeList(loc.landmarks);
    if (landmarks.length) put(out, 'location.landmarks', arLabel('Nearby landmarks', 'المعالم القريبة', ar), landmarks.join(', '));
  }

  const units = input.units;
  if (units && hasAny(units, ['count', 'availableCount', 'minPrice', 'maxPrice', 'avgPrice', 'minAreaSqm', 'maxAreaSqm', 'bedrooms', 'cheapest', 'bestPlan', 'byKind'])) {
    if (typeof units.count === 'number' && units.count > 0) {
      put(out, 'unit.count', arLabel('Total units', 'إجمالي الوحدات', ar), String(units.count));
    }
    if (typeof units.availableCount === 'number') {
      put(out, 'unit.available', arLabel('Available', 'المتاح', ar), String(units.availableCount));
    }
    const cur = units.currency || 'EGP';
    // Prices are emitted as raw numbers; the overlay's price formatter picks
    // them up through `maybeFormatPriceField` and the minisite's kind context.
    if (units.minPrice != null) put(out, 'unit.min_price', arLabel('Starting price', 'أقل سعر', ar), String(units.minPrice));
    if (units.maxPrice != null) put(out, 'unit.max_price', arLabel('Highest price', 'أعلى سعر', ar), String(units.maxPrice));
    if (units.avgPrice != null) put(out, 'unit.avg_price', arLabel('Average price', 'متوسط السعر', ar), String(units.avgPrice));
    if (units.minAreaSqm != null) put(out, 'unit.min_area', arLabel('Smallest unit', 'أصغر وحدة', ar), `${units.minAreaSqm} m²`);
    if (units.maxAreaSqm != null) put(out, 'unit.max_area', arLabel('Largest unit', 'أكبر وحدة', ar), `${units.maxAreaSqm} m²`);
    if (units.bedrooms != null) put(out, 'unit.bedrooms', arLabel('Bedrooms', 'غرف النوم', ar), String(units.bedrooms));
    if (units.cheapest?.price != null) {
      put(out, 'unit.cheapest_price', arLabel('Starting from', 'يبدأ من', ar), String(units.cheapest.price));
      if (units.cheapest.title) {
        put(out, 'unit.cheapest_title', arLabel('Cheapest unit', 'أرخص وحدة', ar), String(units.cheapest.title));
      }
    }
    if (units.bestPlan) {
      if (units.bestPlan.downPaymentPct != null) {
        put(out, 'plan.down_payment_pct', arLabel('Down payment', 'المقدم', ar), `${units.bestPlan.downPaymentPct}%`);
      }
      if (units.bestPlan.installmentYears != null) {
        put(out, 'plan.installment_years', arLabel('Installment years', 'سنوات التقسيط', ar), String(units.bestPlan.installmentYears));
      }
      if (units.bestPlan.monthlyAmount != null) {
        put(out, 'plan.monthly_amount', arLabel('Monthly installment', 'القسط الشهري', ar), String(units.bestPlan.monthlyAmount));
      }
    }
    if (Array.isArray(units.byKind) && units.byKind.length) {
      for (const k of units.byKind) {
        if (!k?.kind) continue;
        const label = kindInlineLabel(k.kind, ar);
        if (typeof k.count === 'number') put(out, `unit.${k.kind}.count`, arLabel(`${label} units`, `وحدات ${label}`, ar), String(k.count));
        if (k.minPrice != null) put(out, `unit.${k.kind}.min_price`, arLabel(`${label} starting`, `يبدأ ${label}`, ar), String(k.minPrice));
      }
    }
    // The currency itself is worth exposing so a spec-sheet can render the
    // trailing "EGP" without the caller having to type it.
    if (cur && cur !== 'EGP') put(out, 'unit.currency', arLabel('Currency', 'العملة', ar), cur);
  }

  return out;
}

/** What axis a key belongs to, for the admin picker's group headers. */
export function axisOfKey(key: string): 'typology' | 'developer' | 'location' | 'unit' | 'plan' | 'other' {
  if (key.startsWith('developer.')) return 'developer';
  if (key.startsWith('location.')) return 'location';
  if (key.startsWith('unit.')) return 'unit';
  if (key.startsWith('plan.')) return 'plan';
  return 'other';
}

/** Human-readable axis groups for the admin picker. */
export const AXIS_GROUP_LABEL = {
  typology:   { ar: 'حقول القسم',                en: 'Section fields' },
  developer:  { ar: 'المطوّر',                   en: 'Developer' },
  location:   { ar: 'الموقع',                    en: 'Location' },
  unit:       { ar: 'الوحدات',                   en: 'Units / inventory' },
  plan:       { ar: 'خطة السداد',                en: 'Payment plan' },
  other:      { ar: 'أخرى',                      en: 'Other' },
} as const;

/**
 * The Egyptian-market quick-add presets, grouped by kind. Used by the slide
 * editor's "Quick add" button and by a template seeding script.
 */
export const KIND_QUICK_ADD: Record<ListingKind, { label: { ar: string; en: string }; fieldKeys: string[] }> = {
  sale: {
    label: { ar: 'ورقة بيع (خطة سداد)', en: 'Sales card (payment plan)' },
    fieldKeys: [
      'unit.cheapest_price',
      'plan.down_payment_pct',
      'plan.installment_years',
      'developer.name',
      'location.area',
    ],
  },
  rent_month: {
    label: { ar: 'ورقة إيجار شهري', en: 'Rental card (monthly)' },
    fieldKeys: [
      'unit.cheapest_price',
      'unit.available',
      'location.area',
      'unit.min_area',
    ],
  },
  rent_night: {
    label: { ar: 'ورقة إقامة', en: 'Stay card' },
    fieldKeys: [
      'unit.cheapest_price',
      'unit.count',
      'location.landmarks',
      'developer.brand',
    ],
  },
};

// ─── internals ───────────────────────────────────────────────────────────────
function put(map: Record<string, ResolvedField>, key: string, label: string, value: string) {
  map[key] = { label, value };
}

function arLabel(en: string, ar: string, isArabic: boolean): string {
  return isArabic ? ar : en;
}

function hasAny(obj: object, keys: string[]): boolean {
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (v != null && v !== '') return true;
  }
  return false;
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,،;]/).map(v => v.trim()).filter(Boolean);
  }
  return [];
}

function computeYears(founded: unknown): number | null {
  const y = Number(founded);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  const currentYear = new Date().getFullYear();
  const diff = currentYear - y;
  return diff > 0 ? diff : null;
}

function kindInlineLabel(kind: string, ar: boolean): string {
  if (ar) {
    if (kind === 'sale') return 'للبيع';
    if (kind === 'rent_month') return 'شهري';
    if (kind === 'rent_night') return 'ليلة';
    return kind;
  }
  if (kind === 'sale') return 'sale';
  if (kind === 'rent_month') return 'monthly';
  if (kind === 'rent_night') return 'nightly';
  return kind;
}

/**
 * Collapse a `UnitSummary[]` (or any row with `price`, `listingKind`,
 * `areaSqm`, `currency`, `status`) into the rollup shape this file consumes.
 *
 * Not exported through the server boundary — the caller is a client component
 * that already has the array in hand from the vertical's `propertyBundle`.
 */
export function summarizeUnits(
  units: Array<{
    price?: number | null;
    currency?: string;
    listingKind?: string | null;
    listing_kind?: string | null;
    areaSqm?: number | null;
    area_sqm?: number | null;
    bedrooms?: number | null;
    status?: string | null;
    titleAr?: string | null;
    title_ar?: string | null;
  }>,
  bestPlan?: {
    downPaymentPct?: number | null;
    installmentYears?: number | null;
    monthlyAmount?: number | null;
    currency?: string;
  } | null
): AxisUnitsSummaryInput {
  const out: AxisUnitsSummaryInput = {
    count: units.length,
    byKind: [],
    bestPlan: bestPlan || undefined,
  };
  if (units.length === 0) return out;
  const prices: number[] = [];
  const areas: number[] = [];
  let availableCount = 0;
  let firstCurrency: string | null = null;
  let cheapest: { price: number; title?: string | null; kind?: string | null } | null = null;
  const kindTally = new Map<string, { count: number; minPrice: number | null }>();
  for (const u of units) {
    const p = Number(u?.price);
    const kind = String(u?.listingKind ?? u?.listing_kind ?? 'sale');
    const cur = String(u?.currency || 'EGP');
    if (!firstCurrency) firstCurrency = cur;
    const status = String(u?.status || 'available').toLowerCase();
    if (status === 'available') availableCount += 1;
    if (Number.isFinite(p) && p > 0) {
      prices.push(p);
      if (!cheapest || p < cheapest.price) {
        cheapest = {
          price: p,
          title: u?.titleAr || u?.title_ar || null,
          kind,
        };
      }
      const prev = kindTally.get(kind) || { count: 0, minPrice: null };
      kindTally.set(kind, {
        count: prev.count + 1,
        minPrice: prev.minPrice == null ? p : Math.min(prev.minPrice, p),
      });
    }
    const area = Number(u?.areaSqm ?? u?.area_sqm);
    if (Number.isFinite(area) && area > 0) areas.push(area);
  }
  out.availableCount = availableCount;
  out.currency = firstCurrency || 'EGP';
  if (prices.length) {
    out.minPrice = Math.min(...prices);
    out.maxPrice = Math.max(...prices);
    out.avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  }
  if (areas.length) {
    out.minAreaSqm = Math.min(...areas);
    out.maxAreaSqm = Math.max(...areas);
  }
  if (cheapest) {
    out.cheapest = {
      price: cheapest.price,
      currency: firstCurrency || 'EGP',
      title: cheapest.title || null,
      listingKind: (cheapest.kind as ListingKind | undefined) || null,
    };
  }
  for (const [kind, t] of kindTally.entries()) {
    (out.byKind ||= []).push({
      kind: kind as ListingKind,
      count: t.count,
      minPrice: t.minPrice,
      currency: firstCurrency || 'EGP',
    });
  }
  return out;
}
