/**
 * Property payment math — pure, no database, safe to import in a client component.
 *
 * A developer's Egyptian payment plan is usually the price itself spread over a
 * schedule: a down payment, then equal instalments across N years, with no bank
 * interest baked in. That is the default here (`annualInterestRate` 0). When a
 * figure does carry a rate — a mortgage, an interest-bearing plan — pass it and
 * the instalment becomes a standard amortizing payment instead.
 *
 * Everything returns raw numbers in the same unit it was given (EGP, USD, ...).
 * Formatting, currency symbols and Arabic labels belong to the components, not
 * here, so this file can be reused by the server compare engine and the browser
 * calculator without pulling either in.
 */

export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  semi_annual: 2,
  annual: 1,
};

export function isPaymentFrequency(value: unknown): value is PaymentFrequency {
  return typeof value === 'string' && (Object.keys(PERIODS_PER_YEAR) as string[]).includes(value);
}

export interface InstallmentInput {
  /** Full price of the unit. */
  price: number;
  /** Down payment as a percentage of the price (0–100). */
  downPaymentPct: number;
  /** Number of years the remainder is spread over. */
  installmentYears: number;
  /** How often an instalment falls due. */
  frequency: PaymentFrequency;
  /** Optional annual interest rate as a percentage (0 = interest-free developer plan). */
  annualInterestRate?: number;
}

export interface InstallmentResult {
  downPayment: number;
  financedAmount: number;
  /** Amount due each period. */
  perPeriod: number;
  totalPeriods: number;
  /** Down payment plus every instalment — what the buyer actually pays in. */
  totalPaid: number;
  /** `totalPeriods` expressed in months, for a "over N months" line. */
  months: number;
  /** `totalPaid - price`: the uplift a financed plan adds over the sticker price. */
  interestPaid: number;
}

function round(value: number): number {
  // Money to 2 decimals without letting float dust (…0000004) leak into the UI.
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const clampPct = (pct: number) => Math.min(Math.max(Number(pct) || 0, 0), 100);

/**
 * Turn a price + a plan into a down payment, a per-period instalment and totals.
 *
 * Returns `null` for anything that cannot be a plan: a non-positive price, or a
 * schedule with zero years (nothing to divide by). Callers show "add a plan"
 * rather than a fabricated number.
 */
export function installmentPlan(input: InstallmentInput): InstallmentResult | null {
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) return null;

  const years = Number(input.installmentYears);
  if (!Number.isFinite(years) || years <= 0) return null;

  const perYear = PERIODS_PER_YEAR[input.frequency] ?? 12;
  const totalPeriods = Math.max(Math.round(years * perYear), 1);

  const downPayment = round((price * clampPct(input.downPaymentPct)) / 100);
  const financedAmount = round(price - downPayment);

  const rate = Number(input.annualInterestRate) || 0;
  const periodicRate = rate / 100 / perYear;

  let perPeriodRaw: number;
  if (periodicRate > 0) {
    // Standard amortizing payment: P * r / (1 - (1 + r)^-n).
    perPeriodRaw = (financedAmount * periodicRate) / (1 - Math.pow(1 + periodicRate, -totalPeriods));
  } else {
    // Interest-free developer plan: the financed balance spread evenly.
    perPeriodRaw = financedAmount / totalPeriods;
  }

  const perPeriod = round(perPeriodRaw);
  const totalPaid = round(downPayment + perPeriod * totalPeriods);

  return {
    downPayment,
    financedAmount,
    perPeriod,
    totalPeriods,
    totalPaid,
    months: totalPeriods * Math.round(12 / perYear),
    interestPaid: round(totalPaid - price),
  };
}

/** The cadence word a label uses, so the UI does not re-derive it from a switch. */
export function frequencyLabelKey(frequency: PaymentFrequency): 'month' | 'quarter' | 'halfYear' | 'year' {
  switch (frequency) {
    case 'quarterly':
      return 'quarter';
    case 'semi_annual':
      return 'halfYear';
    case 'annual':
      return 'year';
    default:
      return 'month';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The two figures below were added for the comparison honesty layer. Everything
// above this line is untouched and keeps its exact behaviour.
// ─────────────────────────────────────────────────────────────────────────────

export interface ScheduleInput {
  price: number;
  downPaymentPct: number;
  installmentYears: number;
  /**
   * The cadence the developer published. `null` / missing is allowed because a
   * lot of plans advertise "EGP X per month" only when the buyer asks; it is
   * then computed monthly AND flagged, so a guessed cadence can never be printed
   * as a stated one.
   */
  frequency?: PaymentFrequency | null;
  /** Portion of the price held back until handover, as a percentage. */
  deliveryPaymentPct?: number | null;
  /**
   * The share the plan says the instalments themselves cover. When it is stated,
   * the three shares can be checked against each other; when it is not, the
   * instalments are whatever the price has left, which reconciles by definition
   * and is therefore flagged in `installmentPctAssumed`.
   */
  installmentPct?: number | null;
}

export interface ScheduleResult {
  /** The cadence actually used, which is monthly when none was stated. */
  frequency: PaymentFrequency;
  periodLabel: 'month' | 'quarter' | 'halfYear' | 'year';
  /** True when `frequency` is a fallback rather than something the plan said. */
  labelledMonthlyEquivalent: boolean;
  perPeriod: number;
  totalPeriods: number;
  downPayment: number;
  deliveryPayment: number;
  /** `perPeriod × totalPeriods`, i.e. what the instalments really add up to. */
  installmentsTotal: number;
  totalPaid: number;
  /** `price − totalPaid`. Only large when the plan's own shares disagree. */
  finalPeriodAdjustment: number;
  /** True when down payment + instalments + delivery payment reconcile to the price. */
  totalsReconcile: boolean;
  /**
   * True when the instalment share was derived as "whatever the price has left"
   * rather than published. Such a schedule reconciles by construction, so
   * `totalsReconcile` is a statement about our arithmetic and not about the plan
   * — the UI must not present the two as the same kind of check.
   */
  installmentPctAssumed: boolean;
  /** The share of the price the instalments cover, stated or assumed. */
  installmentPct: number;
  /** `down + instalments + delivery`, which should be 100 for a whole plan. */
  planPctSum: number;
}

/**
 * The full shape of a plan: the down payment, the handover portion, and the
 * instalments in between.
 *
 * `installmentPlan()` answers "what is the monthly figure". This answers "how is
 * the price distributed", which is the question a comparison table has to answer
 * to be honest — and it is the one that can be checked, because the three parts
 * must add back to the price.
 *
 * What `totalsReconcile` can prove depends on what the plan published. With a
 * stated `installmentPct`, the three shares are the developer's own claim and a
 * gap is a real contradiction in the plan. Without one, the instalments are our
 * residual and the total can only ever disagree by rounding — so
 * `installmentPctAssumed` is set and the reconciliation says nothing about the
 * project. Reporting the second case as if it were the first would be exactly the
 * kind of false assurance this layer exists to stop.
 */
export function installmentSchedule(input: ScheduleInput): ScheduleResult | null {
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) return null;

  const years = Number(input.installmentYears);
  if (!Number.isFinite(years) || years <= 0) return null;

  // A missing or unrecognised cadence is computed monthly and flagged.
  const stated = isPaymentFrequency(input.frequency) ? (input.frequency as PaymentFrequency) : null;
  const frequency: PaymentFrequency = stated ?? 'monthly';
  const perYear = PERIODS_PER_YEAR[frequency];
  const totalPeriods = Math.max(Math.round(years * perYear), 1);

  const downPaymentPct = clampPct(input.downPaymentPct);
  const deliveryPaymentPct = clampPct(Number(input.deliveryPaymentPct) || 0);

  const published = Number(input.installmentPct);
  const hasPublished = Number.isFinite(published) && published > 0;
  const installmentPct = hasPublished ? clampPct(published) : 100 - downPaymentPct - deliveryPaymentPct;

  // A plan that takes 100% of the price before the instalments even start is not
  // a schedule; spreading zero over six years would print "EGP 0 per month" for a
  // contradiction in what was published.
  if (installmentPct <= 0) return null;

  const downPayment = round((price * downPaymentPct) / 100);
  const deliveryPayment = round((price * deliveryPaymentPct) / 100);
  const financed = round((price * installmentPct) / 100);

  const perPeriod = round(financed / totalPeriods);
  const installmentsTotal = round(perPeriod * totalPeriods);
  const totalPaid = round(downPayment + installmentsTotal + deliveryPayment);
  const finalPeriodAdjustment = round(price - totalPaid);

  // Each period can lose up to half a piastre to rounding, plus one more for the
  // two sums. Anything larger than that is not rounding — it is a plan whose
  // published percentages do not describe the price, and that must show.
  const tolerance = totalPeriods * 0.005 + 0.02;

  return {
    frequency,
    periodLabel: frequencyLabelKey(frequency),
    labelledMonthlyEquivalent: stated === null,
    perPeriod,
    totalPeriods,
    downPayment,
    deliveryPayment,
    installmentsTotal,
    totalPaid,
    finalPeriodAdjustment,
    totalsReconcile: Math.abs(finalPeriodAdjustment) <= tolerance,
    installmentPctAssumed: !hasPublished,
    installmentPct: round(installmentPct),
    planPctSum: round(downPaymentPct + installmentPct + deliveryPaymentPct),
  };
}

/**
 * The money columns of `development_contract_terms`, narrowed to what a total
 * needs. Structural so this file stays free of the database.
 */
export interface ContractTermsForTotal {
  maintenanceDepositPct?: number | null;
  /** Only `at_contract` belongs in a total paid at signing. */
  maintenanceDueTiming?: 'at_contract' | 'at_delivery' | 'unknown' | string | null;
  transferFeesPct?: number | null;
  transferFeesFixed?: number | null;
  brokerCommissionPct?: number | null;
}

export interface TotalLine {
  key: string;
  amount: number | null;
  /** False when the figure is simply not on record — never rendered as 0. */
  documented: boolean;
  /** Why a line is absent from the total, for the tooltip / footnote. */
  reason?: 'undocumented' | 'due_at_delivery' | 'timing_unknown' | 'not_requested';
}

export interface TotalAtContractInput {
  /** The EGP amount payable at signing. Null when the plan is not stated. */
  downPayment?: number | null;
  unitPrice?: number | null;
  terms?: ContractTermsForTotal | null;
  /** A buyer comparing cash deals has no broker; the line is then excluded by choice. */
  includeCommission?: boolean;
}

export interface TotalAtContractResult {
  total: number;
  lines: TotalLine[];
  /** True when any line could not be counted, so `total` is a floor, not the bill. */
  excludesUndocumented: boolean;
}

/**
 * What leaves the buyer's pocket at signing.
 *
 * The rule that makes this different from a sum: a component nobody documented
 * is LISTED as missing and left out of the total, and the result says so. Zeroing
 * it would print "EGP 1,200,000 at contract" for a project whose transfer fee we
 * have never asked about — a number that looks checked and is not.
 */
export function totalAtContract(input: TotalAtContractInput): TotalAtContractResult {
  const unitPrice = Number(input.unitPrice);
  const hasPrice = Number.isFinite(unitPrice) && unitPrice > 0;
  const terms = input.terms || {};

  const lines: TotalLine[] = [];

  const down = Number(input.downPayment);
  lines.push(
    Number.isFinite(down) && down >= 0
      ? { key: 'down_payment', amount: round(down), documented: true }
      : { key: 'down_payment', amount: null, documented: false, reason: 'undocumented' }
  );

  // Maintenance deposit: a real cost at signing only when it is due at signing.
  const maintenancePct = Number(terms.maintenanceDepositPct);
  const hasMaintenancePct = Number.isFinite(maintenancePct) && maintenancePct > 0;
  if (!hasMaintenancePct) {
    lines.push({ key: 'maintenance_deposit', amount: null, documented: false, reason: 'undocumented' });
  } else if (terms.maintenanceDueTiming === 'at_contract' && hasPrice) {
    lines.push({ key: 'maintenance_deposit', amount: round((unitPrice * maintenancePct) / 100), documented: true });
  } else if (terms.maintenanceDueTiming === 'at_delivery') {
    lines.push({ key: 'maintenance_deposit', amount: null, documented: false, reason: 'due_at_delivery' });
  } else if (terms.maintenanceDueTiming === 'unknown' || !hasPrice) {
    lines.push({ key: 'maintenance_deposit', amount: null, documented: false, reason: 'timing_unknown' });
  } else {
    lines.push({ key: 'maintenance_deposit', amount: null, documented: false, reason: 'undocumented' });
  }

  // Transfer fees: a percentage and a fixed amount are both legitimate answers,
  // and a fixed one wins when both are on record because it is the specific claim.
  const transferPct = Number(terms.transferFeesPct);
  const transferFixed = Number(terms.transferFeesFixed);
  if (Number.isFinite(transferFixed) && transferFixed > 0) {
    lines.push({ key: 'transfer_fees', amount: round(transferFixed), documented: true });
  } else if (Number.isFinite(transferPct) && transferPct > 0 && hasPrice) {
    lines.push({ key: 'transfer_fees', amount: round((unitPrice * transferPct) / 100), documented: true });
  } else {
    lines.push({ key: 'transfer_fees', amount: null, documented: false, reason: 'undocumented' });
  }

  if (input.includeCommission) {
    const commissionPct = Number(terms.brokerCommissionPct);
    lines.push(
      Number.isFinite(commissionPct) && commissionPct > 0 && hasPrice
        ? { key: 'broker_commission', amount: round((unitPrice * commissionPct) / 100), documented: true }
        : { key: 'broker_commission', amount: null, documented: false, reason: 'undocumented' }
    );
  } else {
    lines.push({ key: 'broker_commission', amount: null, documented: false, reason: 'not_requested' });
  }

  const total = round(lines.reduce((sum, line) => sum + (line.amount ?? 0), 0));
  // Only a line that COULD have been counted and wasn't makes the total partial:
  // a commission the buyer deliberately excluded is not a missing fact.
  const excludesUndocumented = lines.some(
    (line) => line.amount === null && line.reason !== 'not_requested'
  );

  return { total, lines, excludesUndocumented };
}
