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
