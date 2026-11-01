/**
 * Project comparison engine.
 *
 * Lines a handful of `developments` up beside each other on the numbers a buyer
 * actually decides on — price per m², size, handover, facilities and the payment
 * plan — and marks the best value in each row so the UI can highlight it without
 * re-deriving the logic. The money maths is delegated to `property-math.ts`; this
 * file only gathers facts and ranks them.
 *
 * Market-agnostic by design: comparison is keyed on ids chosen across markets,
 * because lining one region's compound against another's is the point.
 */

import {
  getDevelopmentsByIds,
  listUnits,
  loadContractTerms,
  loadLocationBriefs,
  loadOffersWithPrices,
  type Development,
  type DevelopmentContractTerms,
  type LocationBrief,
  type PaymentPlan,
  type UnitSummary,
} from '@/lib/developments';
import {
  installmentPlan,
  installmentSchedule,
  totalAtContract,
  type InstallmentResult,
  type ScheduleResult,
  type TotalAtContractResult,
} from '@/lib/property-math';
import {
  finishingBadge,
  isComparable,
  latestSnapshot,
  pickOffer,
  type OfferSnapshot,
  type UnitOffer,
} from '@/lib/compare-offers';
import { scoreComparisons, type ScoreLine, type ScoreResult, type ScoreWeights } from '@/lib/compare-score';
import { pairwiseDistances, type PairDistance } from '@/lib/geo-distance';

/** A single project reduced to the figures the comparison table shows. */
export interface ProjectComparison {
  id: string;
  marketId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  kind: Development['kind'];
  developerName: string | null;
  status: Development['status'];
  deliveryYear: number | null;
  dataVerifiedAt: string | null;

  unitCount: number;
  saleUnitCount: number;

  /** Price range across sale units, or null when nothing saleable is priced. */
  priceMin: number | null;
  priceMax: number | null;
  pricePerSqmMin: number | null;
  pricePerSqmAvg: number | null;
  areaMin: number | null;
  areaMax: number | null;
  bedrooms: number[];

  facilities: string[];
  paymentPlans: PaymentPlan[];
  /** The most buyer-friendly advertised plan: longest term, then lowest down. */
  bestPlan: PaymentPlan | null;
  /** Worked instalment figure for the cheapest unit on the best plan. */
  calculator: { price: number; downPaymentPct: number; installmentYears: number; result: InstallmentResult } | null;

  // Best-value flags, filled by `markBest` once every project is built.
  bestValue: boolean;
  bestTerm: boolean;
  bestDownPayment: boolean;
  bestFacilities: boolean;
  earliestHandover: boolean;

  // ── Added by the honesty layer. Every one is optional, so an existing caller
  // rendering `/developers/[slug]` keeps byte-identical markup: the new rows
  // appear only where a component asks for them.
  /** The `developers` row behind `developerName`, when the link exists. */
  developerId?: string | null;
  /** The project's own pin, and whether an admin has checked it. */
  lat?: number | null;
  lng?: number | null;
  locationVerified?: boolean;
  /** What "delivered" means at this project, in the admin's words. */
  deliveryNote?: string | null;
  /** `developments.location_id`, kept even when the geography row is unreadable. */
  locationId?: string | null;
  /** District/city names, resolved on request. Null means "not loaded", not "nowhere". */
  location?: LocationBrief | null;
}

function numberPoints(values: (number | null | undefined)[]): number[] {
  return values
    .map((v) => (v === null || v === undefined ? null : Number(v)))
    .filter((v): v is number => v !== null && Number.isFinite(v) && v > 0);
}

function minMax(values: number[]): [number | null, number | null] {
  if (values.length === 0) return [null, null];
  return [Math.min(...values), Math.max(...values)];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Effective price per m²: the stored figure, else price ÷ area when both exist. */
function pricePerSqmOf(unit: UnitSummary): number | null {
  if (unit.pricePerSqm && unit.pricePerSqm > 0) return unit.pricePerSqm;
  if (unit.price && unit.areaSqm && unit.areaSqm > 0) return unit.price / unit.areaSqm;
  return null;
}

function planFromUnit(unit: UnitSummary): PaymentPlan | null {
  if (unit.downPaymentPct === null && unit.installmentYears === null) return null;
  return {
    name: 'Unit plan',
    downPaymentPct: unit.downPaymentPct,
    installmentYears: unit.installmentYears,
    frequency: 'monthly',
    postHandover: false,
  };
}

/** Longest term wins; on a tie the lower down payment wins. */
function pickBestPlan(plans: PaymentPlan[]): PaymentPlan | null {
  const usable = plans.filter((p) => (p.installmentYears ?? 0) > 0);
  if (usable.length === 0) return null;
  return usable.reduce((best, plan) => {
    if ((plan.installmentYears ?? 0) > (best.installmentYears ?? 0)) return plan;
    if ((plan.installmentYears ?? 0) === (best.installmentYears ?? 0)) {
      const a = plan.downPaymentPct ?? 100;
      const b = best.downPaymentPct ?? 100;
      if (a < b) return plan;
    }
    return best;
  }, usable[0]);
}

function buildProject(dev: Development, units: UnitSummary[]): ProjectComparison {
  const saleUnits = units.filter((u) => u.listingKind === 'sale');
  const pricedSale = saleUnits.filter((u) => u.price && u.price > 0);

  const priceValues = numberPoints(pricedSale.map((u) => u.price));
  const [priceMin, priceMax] = minMax(priceValues);

  const psqmValues = numberPoints(saleUnits.map(pricePerSqmOf));
  const [psqmMin] = minMax(psqmValues);
  const psqmAvg = average(psqmValues);

  const areaValues = numberPoints(saleUnits.map((u) => u.areaSqm));
  const [areaMin, areaMax] = minMax(areaValues);

  const bedrooms = [...new Set(saleUnits.map((u) => u.bedrooms).filter((b): b is number => b !== null))].sort(
    (a, b) => a - b
  );

  // Advertised project plans win; unit-derived plans are the fallback.
  const unitPlans = saleUnits.map(planFromUnit).filter((p): p is PaymentPlan => p !== null);
  const paymentPlans = dev.paymentPlans.length > 0 ? dev.paymentPlans : unitPlans;
  const bestPlan = pickBestPlan(paymentPlans);

  // Seed the calculator from the cheapest priced sale unit on the best plan.
  let calculator: ProjectComparison['calculator'] = null;
  if (bestPlan && pricedSale.length > 0) {
    const cheapest = pricedSale.reduce((low, u) => ((u.price ?? Infinity) < (low.price ?? Infinity) ? u : low), pricedSale[0]);
    const price = cheapest.price ?? 0;
    const result = installmentPlan({
      price,
      downPaymentPct: bestPlan.downPaymentPct ?? 0,
      installmentYears: bestPlan.installmentYears ?? 0,
      frequency: bestPlan.frequency,
    });
    if (result) {
      calculator = {
        price,
        downPaymentPct: bestPlan.downPaymentPct ?? 0,
        installmentYears: bestPlan.installmentYears ?? 0,
        result,
      };
    }
  }

  return {
    id: dev.id,
    marketId: dev.marketId,
    slug: dev.slug,
    nameEn: dev.nameEn,
    nameAr: dev.nameAr,
    kind: dev.kind,
    developerName: dev.developerName,
    status: dev.status,
    deliveryYear: dev.deliveryYear,
    dataVerifiedAt: dev.dataVerifiedAt,
    unitCount: units.length,
    saleUnitCount: saleUnits.length,
    priceMin,
    priceMax,
    pricePerSqmMin: psqmMin,
    pricePerSqmAvg: psqmAvg,
    areaMin,
    areaMax,
    bedrooms,
    facilities: dev.facilities,
    paymentPlans,
    bestPlan,
    calculator,
    bestValue: false,
    bestTerm: false,
    bestDownPayment: false,
    bestFacilities: false,
    earliestHandover: false,
    developerId: dev.developerId,
    lat: dev.lat,
    lng: dev.lng,
    locationVerified: dev.locationVerified,
    deliveryNote: dev.deliveryNote,
    locationId: dev.locationId,
  };
}

/**
 * Mark the best project in each comparable row. Only meaningful with two or more
 * projects; every tied project is flagged, so a draw shows more than one star.
 */
function markBest(projects: ProjectComparison[]): void {
  if (projects.length < 2) return;

  const flag = (values: (number | null)[], pick: (nums: number[]) => number | null) => {
    const nums = values.filter((v): v is number => v !== null && Number.isFinite(v));
    if (nums.length === 0) return null;
    return pick(nums);
  };

  const lowestValue = flag(projects.map((p) => p.pricePerSqmMin), (nums) => Math.min(...nums));
  if (lowestValue !== null) {
    projects.forEach((p) => {
      if (p.pricePerSqmMin !== null && p.pricePerSqmMin === lowestValue) p.bestValue = true;
    });
  }

  const longestTerm = flag(projects.map((p) => p.bestPlan?.installmentYears ?? null), (nums) => Math.max(...nums));
  if (longestTerm !== null) {
    projects.forEach((p) => {
      if ((p.bestPlan?.installmentYears ?? null) === longestTerm) p.bestTerm = true;
    });
  }

  const lowestDown = flag(projects.map((p) => p.bestPlan?.downPaymentPct ?? null), (nums) => Math.min(...nums));
  if (lowestDown !== null) {
    projects.forEach((p) => {
      if ((p.bestPlan?.downPaymentPct ?? null) === lowestDown) p.bestDownPayment = true;
    });
  }

  const mostFacilities = projects.reduce((max, p) => Math.max(max, p.facilities.length), 0);
  if (mostFacilities > 0) {
    projects.forEach((p) => {
      if (p.facilities.length === mostFacilities) p.bestFacilities = true;
    });
  }

  const earliest = flag(projects.map((p) => p.deliveryYear), (nums) => Math.min(...nums));
  if (earliest !== null) {
    projects.forEach((p) => {
      if (p.deliveryYear === earliest) p.earliestHandover = true;
    });
  }
}

/**
 * Compare up to `maxProjects` developments (default 4, matching the UI cap).
 * Unknown or inactive ids are silently dropped, and the result keeps the order
 * the caller asked for.
 *
 * `withLocations` is opt-in because it costs one extra query: the geography name
 * is a display concern for the compare page, and `/developers/[slug]` should not
 * pay for a join it does not render.
 */
export async function compareDevelopments(
  ids: string[],
  maxProjects = 4,
  options: { withLocations?: boolean } = {}
): Promise<ProjectComparison[]> {
  const limited = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))].slice(0, maxProjects);
  if (limited.length === 0) return [];

  const devs = await getDevelopmentsByIds(limited);
  const projects = await Promise.all(
    devs.map(async (dev) => {
      const units = await listUnits({ developmentId: dev.id, limit: 200 });
      return buildProject(dev, units);
    })
  );

  markBest(projects);

  if (options.withLocations) {
    const briefs = await loadLocationBriefs(projects.map((p) => p.locationId || '').filter(Boolean));
    projects.forEach((p) => {
      p.location = p.locationId ? briefs[p.locationId] ?? null : null;
    });
  }

  return projects;
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection-scoped comparison.
//
// `compareDevelopments()` above answers "line these projects up". This answers
// the harder question the honesty layer exists for: "on the same unit type, the
// same finishing, the same size, and with the same contract obligations counted".
// It changes nothing about the old function — it calls it, then reads the offer
// and terms tables beside it.
// ─────────────────────────────────────────────────────────────────────────────

/** Why a price figure is what it is. Never inferred silently. */
export type PriceBasis =
  /** The project's own approved capture for this exact unit type and grade. */
  | 'approved_offer'
  /** No approved offer, so nothing is printed as a comparable price. */
  | 'undocumented';

/** Where the EGP amount a total was computed from came from. */
export type UnitPriceBasis =
  /** The cheapest priced sale unit on file for this project. */
  | 'cheapest_listed_unit'
  /** No unit entered, so price = approved ppm × the requested area. */
  | 'estimated_from_ppm_and_area'
  | 'undocumented';

export interface SelectionProvenance {
  capturedAt: string;
  sourceType: string;
  sourceUrl: string;
  currency: string;
  ppmMin: number | null;
  ppmMax: number | null;
}

export interface SelectionProject extends ProjectComparison {
  /** The offer the selection resolved to, or null when this project has none. */
  offer: UnitOffer | null;
  /** An offer exists AND carries an approved figure — the score's gate. */
  comparable: boolean;
  /** `stated` when the offer names a grade, `mixed` when it cannot be split. */
  finishingClaim: 'mixed' | 'stated';
  /** The provenance-backed EGP/m² the table prints. Null = `غير موثّق`. */
  pricePerSqm: number | null;
  priceBasis: PriceBasis;
  provenance: SelectionProvenance | null;
  terms: DevelopmentContractTerms | null;
  unitPrice: number | null;
  unitPriceBasis: UnitPriceBasis;
  /** The plan the chooser selected (or the best one when none was selected). */
  plan: PaymentPlan | null;
  schedule: ScheduleResult | null;
  totalAtContract: TotalAtContractResult | null;
  score: number;
  scoreBreakdown: ScoreLine[];
}

export interface SelectionInput {
  ids: string[];
  /** Required: the comparable key starts at the unit type. */
  unitType: string;
  /** '' or null = "any grade / not stated", which is what the mixed band answers. */
  finishing?: string | null;
  areaSqm?: number | null;
  /** Index into the project's own `paymentPlans`; null falls back to `bestPlan`. */
  planIndex?: number | null;
  weights?: Partial<ScoreWeights>;
  includeCommission?: boolean;
  /** Admin preview only: reads unpublished offers and captures. */
  includeUnpublished?: boolean;
  maxProjects?: number;
}

export interface SelectionComparisonResult {
  projects: SelectionProject[];
  score: ScoreResult;
  /** Straight-line distance between every pair, with the approximate flag. */
  pairwise: PairDistance[];
  /** How many projects actually entered the ranking. */
  comparableCount: number;
  selection: { unitType: string; finishing: string; areaSqm: number | null; includeCommission: boolean };
}

function planAt(plans: PaymentPlan[], index: number | null | undefined, fallback: PaymentPlan | null): PaymentPlan | null {
  if (index === null || index === undefined) return fallback;
  return plans[index] ?? null;
}

/**
 * Compare the selection, then score only what can honestly be scored.
 *
 * Three rules carried through the whole function:
 * - The printed price comes from an approved capture, never from the units table.
 *   A project with no capture shows `غير موثّق` and leaves the ranking — a missing
 *   figure is not a cheap figure.
 * - The EGP amount a total is built from is either a listed unit or an explicit
 *   ppm × area estimate, and which one it was travels with the number.
 * - Contract terms are read per project. Absent terms do not make a total zero;
 *   `totalAtContract()` lists each undocumented line instead.
 */
export async function compareDevelopmentsBySelection(input: SelectionInput): Promise<SelectionComparisonResult> {
  const maxProjects = input.maxProjects ?? 4;
  const includeUnpublished = Boolean(input.includeUnpublished);
  const projects = await compareDevelopments(input.ids, maxProjects, { withLocations: true });
  const selection = {
    unitType: String(input.unitType ?? '').trim(),
    finishing: String(input.finishing ?? '').trim(),
    areaSqm: input.areaSqm === null || input.areaSqm === undefined ? null : Number(input.areaSqm),
    includeCommission: Boolean(input.includeCommission),
  };

  const ids = projects.map((p) => p.id);
  const [offers, termsById] = await Promise.all([
    loadOffersWithPrices(ids, { unitType: selection.unitType || undefined, includeUnpublished }),
    loadContractTerms(ids),
  ]);

  const offersByDev = new Map<string, UnitOffer[]>();
  for (const offer of offers) {
    const bucket = offersByDev.get(offer.developmentId);
    if (bucket) bucket.push(offer);
    else offersByDev.set(offer.developmentId, [offer]);
  }

  const enriched: SelectionProject[] = projects.map((project) => {
    const devOffers = offersByDev.get(project.id) || [];
    const offer = pickOffer(devOffers, selection.unitType, selection.finishing, {
      areaSqm: selection.areaSqm,
      includeUnpublished,
    });
    const snapshot: OfferSnapshot | null = offer ? latestSnapshot(offer, { includeUnpublished }) : null;
    const comparable = isComparable(offer, { includeUnpublished });
    const pricePerSqm = comparable && snapshot ? snapshot.ppmMid : null;

    const plan = planAt(project.paymentPlans, input.planIndex, project.bestPlan);

    // Price basis, stated rather than assumed. A listed unit is the developer's
    // own asking price; ppm × area is our arithmetic on a capture and must be
    // labelled as an estimate wherever it is printed.
    let unitPrice: number | null = project.calculator?.price ?? project.priceMin ?? null;
    let unitPriceBasis: UnitPriceBasis = unitPrice ? 'cheapest_listed_unit' : 'undocumented';
    if (!unitPrice && pricePerSqm && selection.areaSqm && selection.areaSqm > 0) {
      unitPrice = Math.round(pricePerSqm * selection.areaSqm * 100) / 100;
      unitPriceBasis = 'estimated_from_ppm_and_area';
    }

    const downPaymentPct = plan?.downPaymentPct ?? null;
    const downPayment =
      unitPrice !== null && downPaymentPct !== null ? Math.round(unitPrice * (downPaymentPct / 100) * 100) / 100 : null;

    const schedule =
      unitPrice !== null && plan && (plan.installmentYears ?? 0) > 0
        ? installmentSchedule({
            price: unitPrice,
            downPaymentPct: downPaymentPct ?? 0,
            installmentYears: plan.installmentYears ?? 0,
            frequency: plan.frequency ?? null,
          })
        : null;

    return {
      ...project,
      offer,
      comparable,
      finishingClaim: finishingBadge(offer),
      pricePerSqm,
      priceBasis: pricePerSqm !== null ? 'approved_offer' : 'undocumented',
      provenance: snapshot
        ? {
            capturedAt: snapshot.capturedAt,
            sourceType: snapshot.sourceType,
            sourceUrl: snapshot.sourceUrl,
            currency: snapshot.currency,
            ppmMin: snapshot.ppmMin,
            ppmMax: snapshot.ppmMax,
          }
        : null,
      terms: termsById[project.id] ?? null,
      unitPrice,
      unitPriceBasis,
      plan,
      schedule,
      totalAtContract: totalAtContract({
        downPayment,
        unitPrice,
        terms: termsById[project.id]
          ? {
              maintenanceDepositPct: termsById[project.id].maintenanceDepositPct,
              maintenanceDueTiming: termsById[project.id].maintenanceDueTiming,
              transferFeesPct: termsById[project.id].transferFeesPct,
              transferFeesFixed: termsById[project.id].transferFeesFixed,
              brokerCommissionPct: termsById[project.id].brokerCommissionPct,
            }
          : null,
        includeCommission: selection.includeCommission,
      }),
      score: 0,
      scoreBreakdown: [],
    };
  });

  const score = scoreComparisons(
    enriched.map((project) => ({
      id: project.id,
      comparable: project.comparable,
      pricePerSqm: project.pricePerSqm,
      downPaymentPct: project.plan?.downPaymentPct ?? null,
      installmentYears: project.plan?.installmentYears ?? null,
      deliveryYear: project.deliveryYear,
    })),
    { weights: input.weights }
  );

  for (const project of enriched) {
    project.score = score.scores[project.id] ?? 0;
    project.scoreBreakdown = score.breakdown[project.id] || [];
  }

  return {
    projects: enriched,
    score,
    pairwise: pairwiseDistances(
      enriched.map((project) => ({
        id: project.id,
        lat: project.lat ?? null,
        lng: project.lng ?? null,
        verified: project.locationVerified,
        locationId: project.locationId ?? null,
      }))
    ),
    comparableCount: score.comparedIds.length,
    selection,
  };
}
