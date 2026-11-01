/**
 * Unit comparison engine.
 *
 * Lines a handful of individual units up beside each other on the numbers a
 * visitor actually decides on — total price, price per m², area, bedrooms,
 * handover, plan terms and amenities — and marks the best value in each row so
 * the UI can highlight it without re-deriving the logic.
 *
 * This is the sibling of `development-compare.ts`. That file answers "which
 * compound should I look at". This one answers "which specific apartment is
 * the better buy". They compose: a visitor lines up four compounds in
 * `/compare/projects`, picks one, then compares its units here.
 *
 * Cross-kind normalization is deliberately cautious. A sale unit divided by a
 * payment plan is a monthly obligation; a rent_night unit multiplied by 30 is a
 * month of hotel-style stay. Those two numbers mean different things and are
 * shown side-by-side only inside an explicit "approximate monthly equivalent"
 * column with an asterisk, never merged silently into a single "price" row.
 *
 * Market-agnostic by design: units are keyed on ids, so a saved shortlist can
 * cross two developments and two markets. The URL owns the state.
 */

import { getUnitsByIds, listAllActiveUnits, getDevelopmentsByIds, type UnitSummary } from '@/lib/developments';
import { LISTING_KIND_SPEC, isListingKind, type ListingKind } from '@/lib/listing-kind';

/** One unit reduced to the figures the comparison table shows. */
export interface UnitComparison extends UnitSummary {
  /**
   * Effective EGP per m²: the stored `pricePerSqm` if a number, else the
   * `price / areaSqm` arithmetic when both are present. Null when neither can
   * be computed — never zero, because zero is a real price on a gifted unit.
   */
  effectivePricePerSqm: number | null;

  /**
   * Monthly obligation for the buyer. Only sale units carry a plan, and only
   * when both a price and a plan are present:
   *   monthlyCost = price × (1 − downPaymentPct / 100) ÷ (installmentYears × 12)
   * A rent_month unit's price IS the monthly cost, so it returns the price.
   * A rent_night unit returns null; the night→month projection lives in
   * `nightlyToMonthlyEquivalent` and is marked as an approximation there.
   */
  monthlyCost: number | null;

  /**
   * Approximate monthly equivalent of a nightly stay: `price × 30`.
   * Non-null ONLY for `rent_night` rows. Printed under a "تقديري / est." badge
   * so a visitor comparing one month-apartment against one nightly-stay sees
   * the number but is not tricked into treating them as the same contract.
   */
  nightlyToMonthlyEquivalent: number | null;

  /**
   * Approximate weekly equivalent of a nightly stay: `price × 7`. Non-null
   * ONLY for `rent_night` rows. Presented because short-stay visitors plan in
   * weeks (a beach week, a safari weekend) rather than months, and a monthly
   * projection can make a 4-night trip look unaffordable when it is not.
   */
  nightlyToWeeklyEquivalent: number | null;

  /**
   * Twelve-month cost projection, an apples-to-apples long-horizon figure that
   * every kind can contribute to:
   *   sale        = down-payment amount + (monthly obligation × 12)
   *   rent_month  = price × 12
   *   rent_night  = price × 30 × 12   (a full-year stay; a projection)
   * Null when any ingredient is missing. This is the ONLY number that lets a
   * mixed shortlist be read as one column, so the table marks it with an
   * explicit "12-month view" label and the mixed-kind notice still applies.
   */
  twelveMonthProjection: number | null;

  /** Whether the unit has a usable sale plan; drives the "no plan" empty cell. */
  hasPlan: boolean;

  // ── Best-value flags ─────────────────────────────────────────────────────
  // Every one is set by `markBest` after all rows are built, so a tied value
  // flags both rows and the UI can print two stars rather than picking an
  // arbitrary winner.
  bestPrice: boolean;
  bestPricePerSqm: boolean;
  biggestArea: boolean;
  earliestHandover: boolean;
  mostBedrooms: boolean;
  mostAmenities: boolean;
  longestTerm: boolean;
  lowestDown: boolean;
  cheapestMonthly: boolean;
  /** Cheapest `twelveMonthProjection`. Only meaningful when the shortlist is
   *  two or more rows AND at least two of them have a non-null projection. */
  cheapestYear: boolean;
}

export interface UnitComparisonResult {
  units: UnitComparison[];
  /**
   * The listing kind all the picked units share. Null when the shortlist mixes
   * kinds — the table then renders a bilingual notice above the grid and the
   * monthly-equivalent column is the only honest join across kinds.
   */
  commonKind: ListingKind | null;
  /** True when the shortlist mixed two or more kinds. */
  mixedKind: boolean;
}

// ─── Numeric helpers (kept local; same shape as development-compare.ts so
// future extraction to a shared module is a mechanical move) ─────────────────

function num(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function monthlyCostOf(u: UnitSummary): number | null {
  if (u.listingKind === 'rent_month') return num(u.price);
  if (u.listingKind !== 'sale') return null;
  const price = num(u.price);
  if (price === null) return null;
  const years = num(u.installmentYears);
  if (years === null || years <= 0) return null;
  const downPct = u.downPaymentPct === null || u.downPaymentPct === undefined ? 0 : Number(u.downPaymentPct);
  if (!Number.isFinite(downPct) || downPct < 0 || downPct > 100) return null;
  const financed = price * (1 - downPct / 100);
  return Math.round((financed / (years * 12)) * 100) / 100;
}

/** Night→month equivalent. Not a real month-cost — a projection. */
function nightMonthlyEquivalent(u: UnitSummary): number | null {
  if (u.listingKind !== 'rent_night') return null;
  const price = num(u.price);
  return price === null ? null : Math.round(price * 30 * 100) / 100;
}

/** Night→week equivalent. Same honesty rule as the monthly projection. */
function nightWeeklyEquivalent(u: UnitSummary): number | null {
  if (u.listingKind !== 'rent_night') return null;
  const price = num(u.price);
  return price === null ? null : Math.round(price * 7 * 100) / 100;
}

/**
 * Twelve-month cost projection. Different formulas per kind because they
 * measure different commitments, but the OUTPUT is one number in EGP so the
 * reader can line them up. Nightly stays are projections and are labelled as
 * such in the table; sale rows include the down-payment cash so the year cost
 * reflects what actually leaves the buyer's account in 12 months.
 */
function twelveMonthProjectionOf(u: UnitSummary): number | null {
  const price = num(u.price);
  if (price === null) return null;
  if (u.listingKind === 'rent_month') return Math.round(price * 12 * 100) / 100;
  if (u.listingKind === 'rent_night') return Math.round(price * 30 * 12 * 100) / 100;
  // sale: cash down + 12 × monthly obligation. Falls back to null when the
  // row has no plan because a cash-price single-payment "year cost" would be
  // misleading — the whole price is due at once, not amortized over twelve.
  const years = num(u.installmentYears);
  if (years === null || years <= 0) return null;
  const downPct = u.downPaymentPct === null || u.downPaymentPct === undefined ? 0 : Number(u.downPaymentPct);
  if (!Number.isFinite(downPct) || downPct < 0 || downPct > 100) return null;
  const cash = price * (downPct / 100);
  const financed = price * (1 - downPct / 100);
  const monthly = financed / (years * 12);
  return Math.round((cash + monthly * 12) * 100) / 100;
}

function effectivePpsqm(u: UnitSummary): number | null {
  const stored = num(u.pricePerSqm);
  if (stored !== null) return stored;
  const price = num(u.price);
  const area = num(u.areaSqm);
  if (price !== null && area !== null && area > 0) return Math.round((price / area) * 100) / 100;
  return null;
}

/**
 * Detect whether the whole shortlist shares a kind. Returns the kind on a
 * homogeneous set, or `null` on a mixed one. Order-independent, so a saved
 * `?ids=` list still reads the same after reload.
 */
function detectCommonKind(units: UnitSummary[]): ListingKind | null {
  if (units.length === 0) return null;
  const first = units[0].listingKind;
  if (!isListingKind(first)) return null;
  for (const u of units) if (u.listingKind !== first) return null;
  return first;
}

function decorate(u: UnitSummary): UnitComparison {
  const monthly = monthlyCostOf(u);
  const nightly = nightMonthlyEquivalent(u);
  const weekly = nightWeeklyEquivalent(u);
  const year = twelveMonthProjectionOf(u);
  return {
    ...u,
    effectivePricePerSqm: effectivePpsqm(u),
    monthlyCost: monthly,
    nightlyToMonthlyEquivalent: nightly,
    nightlyToWeeklyEquivalent: weekly,
    twelveMonthProjection: year,
    hasPlan:
      u.listingKind === 'sale'
      && (u.downPaymentPct !== null || u.installmentYears !== null),
    bestPrice: false,
    bestPricePerSqm: false,
    biggestArea: false,
    earliestHandover: false,
    mostBedrooms: false,
    mostAmenities: false,
    longestTerm: false,
    lowestDown: false,
    cheapestMonthly: false,
    cheapestYear: false,
  };
}

/**
 * Flag the winning rows. Only runs when the shortlist has two or more units;
 * a single-row compare cannot have a "best" because there is nothing to beat.
 * Ties flag every matching row so a shared minimum shows two stars.
 */
function markBest(rows: UnitComparison[]): void {
  if (rows.length < 2) return;

  // Cheapest total price — the headline figure for a sale shortlist.
  const prices = rows.map((r) => num(r.price)).filter((v): v is number => v !== null);
  if (prices.length > 0) {
    const low = Math.min(...prices);
    for (const r of rows) if (num(r.price) === low) r.bestPrice = true;
  }

  // Best value: lowest effective price per m², independent of kind.
  const ppmValues = rows.map((r) => r.effectivePricePerSqm).filter((v): v is number => v !== null);
  if (ppmValues.length > 0) {
    const low = Math.min(...ppmValues);
    for (const r of rows) if (r.effectivePricePerSqm !== null && r.effectivePricePerSqm === low) r.bestPricePerSqm = true;
  }

  // Biggest area (buyer's "value for size" question).
  const areas = rows.map((r) => num(r.areaSqm)).filter((v): v is number => v !== null);
  if (areas.length > 0) {
    const high = Math.max(...areas);
    for (const r of rows) if (num(r.areaSqm) === high) r.biggestArea = true;
  }

  // Earliest handover — smaller year wins.
  const years = rows.map((r) => r.deliveryYear).filter((v): v is number => v !== null && Number.isFinite(v));
  if (years.length > 0) {
    const low = Math.min(...years);
    for (const r of rows) if (r.deliveryYear === low) r.earliestHandover = true;
  }

  // Most bedrooms. Only meaningful when at least one row has a real number
  // (studios legitimately carry 0, so we compare with the actual value).
  const bedVals = rows.map((r) => r.bedrooms).filter((v): v is number => v !== null && Number.isFinite(v));
  if (bedVals.length > 0) {
    const high = Math.max(...bedVals);
    for (const r of rows) if (r.bedrooms !== null && r.bedrooms === high) r.mostBedrooms = true;
  }

  // Most amenities. Ties flagged so two fully-equipped villas both earn a star.
  const amenityCounts = rows.map((r) => r.amenities.length);
  const maxAmenities = Math.max(...amenityCounts);
  if (maxAmenities > 0) {
    for (const r of rows) if (r.amenities.length === maxAmenities) r.mostAmenities = true;
  }

  // Longest installment term. Sale-only concept; if nobody has a plan, skip.
  const terms = rows.map((r) => num(r.installmentYears)).filter((v): v is number => v !== null);
  if (terms.length > 0) {
    const high = Math.max(...terms);
    for (const r of rows) if (num(r.installmentYears) === high) r.longestTerm = true;
  }

  // Lowest down-payment percentage. Only for sale rows with a real plan.
  const downs = rows
    .filter((r) => r.listingKind === 'sale')
    .map((r) => (r.downPaymentPct === null || r.downPaymentPct === undefined ? null : Number(r.downPaymentPct)))
    .filter((v): v is number => v !== null && Number.isFinite(v) && v >= 0 && v <= 100);
  if (downs.length > 0) {
    const low = Math.min(...downs);
    for (const r of rows) {
      if (r.listingKind !== 'sale') continue;
      const d = r.downPaymentPct === null || r.downPaymentPct === undefined ? null : Number(r.downPaymentPct);
      if (d !== null && d === low) r.lowestDown = true;
    }
  }

  // Cheapest monthly. Uses `monthlyCost` (real obligation for sale-plan and
  // rent_month rows) and, when the set is cross-kind, also considers the
  // `nightlyToMonthlyEquivalent` projection so a nightly-stay row can still
  // win its own comparison cell — the UI reads the asterisk badge separately.
  const monthlies = rows
    .map((r) => r.monthlyCost ?? r.nightlyToMonthlyEquivalent)
    .filter((v): v is number => v !== null && Number.isFinite(v) && v > 0);
  if (monthlies.length > 0) {
    const low = Math.min(...monthlies);
    for (const r of rows) {
      const eff = r.monthlyCost ?? r.nightlyToMonthlyEquivalent;
      if (eff !== null && eff === low) r.cheapestMonthly = true;
    }
  }

  // Cheapest 12-month projection. The single long-horizon number that mixes
  // kinds honestly. Only flag when at least two rows have a value, otherwise
  // the star just marks the only present row.
  const yearVals = rows
    .map((r) => r.twelveMonthProjection)
    .filter((v): v is number => v !== null && Number.isFinite(v) && v > 0);
  if (yearVals.length >= 2) {
    const low = Math.min(...yearVals);
    for (const r of rows) {
      if (r.twelveMonthProjection !== null && r.twelveMonthProjection === low) r.cheapestYear = true;
    }
  }
}

/**
 * Fetch and decorate. Unknown/inactive ids are silently dropped and caller
 * order is preserved (matching `compareDevelopments`).
 *
 * `max` (default 4) is a UI cap: past four columns a comparison stops being
 * a comparison and becomes a data table nobody reads. Anything above that is
 * a search problem.
 */
export async function compareUnits(ids: string[], max = 4): Promise<UnitComparisonResult> {
  const limited = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))].slice(0, max);
  const units = await getUnitsByIds(limited);
  const rows = units.map(decorate);
  markBest(rows);
  const commonKind = detectCommonKind(rows);
  return {
    units: rows,
    commonKind,
    mixedKind: rows.length >= 2 && commonKind === null,
  };
}

/**
 * The row shape `UnitPicker` renders. Combines the unit's own display facts
 * with its compound's name so a reader scanning "702 · Garden Lakes · 2 BR"
 * sees the project, not just the id. Kind badge and accent come from the
 * `LISTING_KIND_SPEC` card so the picker and the table agree on color words.
 *
 * Lives next to the engine rather than in the client component because the
 * catalog is fetched server-side, in the same round trip as the compare rows,
 * and the shape must not drift between the two sides.
 */
export interface UnitCatalogRow {
  id: string;
  name: string;
  groupName: string;
  unitType: string | null;
  kind: ListingKind;
  kindBadge: string;
  kindAccent: string;
}

/**
 * Build the picker catalog. Reads every active unit and joins each one to its
 * compound so `groupName` is a real project title, not a numeric id.
 *
 * Units that belong to a listing business (no compound) fall back to the
 * business name when it is available, or to a locale-neutral "Direct listing"
 * label. The caller controls the language via `ar`.
 */
export async function buildUnitCatalog(opts: {
  ar: boolean;
  listingKind?: ListingKind | null;
  developmentId?: string | null;
  limit?: number;
}): Promise<UnitCatalogRow[]> {
  const units = await listAllActiveUnits({
    listingKind: opts.listingKind ?? undefined,
    developmentId: opts.developmentId ?? undefined,
    limit: opts.limit ?? 240,
  });
  // Group-name resolution needs one query, not one-per-row. Pull every
  // distinct `development_id` we have on the units, then read them together.
  const devIds = new Set<string>();
  for (const u of units) if (u.developmentId) devIds.add(u.developmentId);
  const nameById = new Map<string, string>();
  if (devIds.size > 0) {
    const devs = await getDevelopmentsByIds([...devIds]);
    for (const d of devs) {
      nameById.set(d.id, opts.ar ? d.nameAr || d.nameEn : d.nameEn || d.nameAr);
    }
  }
  return units.map((u) => {
    const title = opts.ar
      ? u.titleAr || u.titleEn || u.slug
      : u.titleEn || u.titleAr || u.slug;
    const groupName =
      (u.developmentId && nameById.get(u.developmentId))
      || (opts.ar ? 'قائمة مباشرة' : 'Direct listing');
    const spec = LISTING_KIND_SPEC[u.listingKind as ListingKind];
    return {
      id: u.id,
      name: title,
      groupName,
      unitType: u.unitType || null,
      kind: u.listingKind,
      kindBadge: spec ? (opts.ar ? spec.badge.ar : spec.badge.en) : u.listingKind,
      kindAccent: spec ? spec.accent : '#94A3B8',
    };
  });
}

/**
 * Bilingual label for the mixed-kind notice. Kept next to the engine so a UI
 * change here updates every consumer at once.
 */
export const MIXED_KIND_NOTICE = {
  ar: {
    title: 'مقارنة بين أنواع مختلفة للعرض',
    body:
      'بعض الوحدات مختارة للبيع أو للإيجار الشهري أو للإقامة القصيرة. تُحسب التكلفة الشهرية التقريبية للوحدة المُباعة بقسمة المتبقي على مدة الخطة، وتُحسب للإقامة القصيرة بضرب سعر الليلة في ثلاثين ليلة. القراءتان لا تعنيان نفس الالتزام التعاقدي — المقارنة هنا إرشادية لا حسابية.',
  },
  en: {
    title: 'Comparing different listing kinds',
    body:
      'Some of the units you picked are for sale, for monthly rent, or for a nightly stay. Sale rows show the monthly obligation on the payment plan; nightly rows show 30 × the nightly rate as a projection. Those two numbers do not describe the same contract — the monthly column is a guide, not an invoice.',
  },
} as const;

/** Bilingual column labels the table renders, kept here so the picker, the
 *  table, and any downstream OG/SEO copy stay word-identical. */
export const UNIT_COMPARE_LABELS = {
  ar: {
    badge: (kind: ListingKind) => LISTING_KIND_SPEC[kind].badge.ar,
    price: 'السعر',
    ppsqm: 'السعر للمتر',
    area: 'المساحة',
    bedrooms: 'غرف النوم',
    bathrooms: 'الحمامات',
    unitType: 'نوع الوحدة',
    finishing: 'التشطيب',
    furnished: 'المفروش',
    handover: 'التسليم',
    delivery: 'سنة التسليم',
    down: 'المقدمة',
    term: 'مدة الخطة',
    monthly: 'التكلفة الشهرية',
    monthlyApprox: 'شهرى تقديري',
    weeklyApprox: 'أسبوعى تقديري',
    twelveMonth: 'تكلفة ١٢ شهر',
    twelveMonthNote: {
      sale: 'دفعة + ١٢ قسط',
      rent_month: 'إيجار سنة كاملة',
      rent_night: 'إقامة سنة كاملة (تقديرى)',
    } as Record<ListingKind, string>,
    deposit: 'التأمين',
    minStay: 'أقل عدد ليالٍ',
    availableFrom: 'متاح من',
    amenities: 'المرافق',
    status: 'الحالة',
    viewUnit: 'صفحة الوحدة',
    none: '—',
    best: 'الأفضل',
    sqmUnit: 'م²',
    yearUnit: 'سنة',
    yesLabel: 'مفروشة',
    noLabel: 'غير مفروشة',
    unknown: 'غير محدد',
  },
  en: {
    badge: (kind: ListingKind) => LISTING_KIND_SPEC[kind].badge.en,
    price: 'Price',
    ppsqm: 'Price / m²',
    area: 'Area',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    unitType: 'Unit type',
    finishing: 'Finishing',
    furnished: 'Furnished',
    handover: 'Handover',
    delivery: 'Delivery year',
    down: 'Down payment',
    term: 'Plan term',
    monthly: 'Monthly cost',
    monthlyApprox: 'Monthly (est.)',
    weeklyApprox: 'Weekly (est.)',
    twelveMonth: '12-month cost',
    twelveMonthNote: {
      sale: 'down + 12 instalments',
      rent_month: 'one full year of rent',
      rent_night: 'one full year of stay (est.)',
    } as Record<ListingKind, string>,
    deposit: 'Deposit',
    minStay: 'Min stay',
    availableFrom: 'Available from',
    amenities: 'Amenities',
    status: 'Status',
    viewUnit: 'Unit page',
    none: '—',
    best: 'Best',
    sqmUnit: 'm²',
    yearUnit: 'yr',
    yesLabel: 'Furnished',
    noLabel: 'Unfurnished',
    unknown: 'Not stated',
  },
} as const;
