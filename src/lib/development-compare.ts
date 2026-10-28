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
  type Development,
  type UnitSummary,
  type PaymentPlan,
} from '@/lib/developments';
import { installmentPlan, type InstallmentResult } from '@/lib/property-math';

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
 */
export async function compareDevelopments(ids: string[], maxProjects = 4): Promise<ProjectComparison[]> {
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
  return projects;
}
