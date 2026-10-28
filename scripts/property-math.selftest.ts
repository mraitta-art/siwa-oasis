/**
 * Self-test for the property payment math.
 *
 * There is no test runner wired into this project, so this is a plain tsx
 * script that asserts the calculators reconcile and exits non-zero on any
 * failure — the same style the other scripts in this folder use.
 *
 * Run with:  npx tsx scripts/property-math.selftest.ts
 */
import { installmentPlan } from '../src/lib/property-math';

let failures = 0;
function check(name: string, condition: boolean, got?: unknown) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}${got !== undefined ? ` (got ${JSON.stringify(got)})` : ''}`);
  }
}

// Interest-free developer plan: price spread evenly after a down payment.
const a = installmentPlan({ price: 1_000_000, downPaymentPct: 25, installmentYears: 5, frequency: 'monthly' });
check('interest-free returns a plan', a !== null, a);
if (a) {
  check('down payment is 25%', a.downPayment === 250_000, a.downPayment);
  check('financed is the remainder', a.financedAmount === 750_000, a.financedAmount);
  check('60 monthly instalments', a.totalPeriods === 60, a.totalPeriods);
  check('instalment = financed / periods', Math.abs(a.perPeriod - 750_000 / 60) < 0.02, a.perPeriod);
  check('total paid equals the sticker price', Math.abs(a.totalPaid - 1_000_000) <= 0.6, a.totalPaid);
  check('no interest uplift', Math.abs(a.interestPaid) <= 0.6, a.interestPaid);
  check('months = 60', a.months === 60, a.months);
}

// Quarterly cadence over the same plan.
const q = installmentPlan({ price: 1_000_000, downPaymentPct: 25, installmentYears: 5, frequency: 'quarterly' });
check('quarterly has 20 periods', q?.totalPeriods === 20, q?.totalPeriods);
check('quarterly months still 60', q?.months === 60, q?.months);

// A zero-down plan finances the whole price.
const z = installmentPlan({ price: 800_000, downPaymentPct: 0, installmentYears: 8, frequency: 'annual' });
check('zero down finances everything', z?.financedAmount === 800_000, z?.financedAmount);
check('annual over 8y = 8 periods', z?.totalPeriods === 8, z?.totalPeriods);

// Interest-bearing: an amortizing payment should exceed the interest-free slice
// and pay back more than it borrowed.
const m = installmentPlan({ price: 1_000_000, downPaymentPct: 20, installmentYears: 10, frequency: 'monthly', annualInterestRate: 15 });
check('interest plan exists', m !== null, m);
if (m) {
  const interestFreeSlice = m.financedAmount / m.totalPeriods;
  check('payment carries interest', m.perPeriod > interestFreeSlice, m.perPeriod);
  check('total paid exceeds price', m.totalPaid > 1_000_000, m.totalPaid);
  check('interest uplift positive', m.interestPaid > 0, m.interestPaid);
}

// Guards: impossible plans return null rather than a fabricated number.
check('non-positive price is null', installmentPlan({ price: 0, downPaymentPct: 10, installmentYears: 5, frequency: 'monthly' }) === null);
check('zero years is null', installmentPlan({ price: 500_000, downPaymentPct: 10, installmentYears: 0, frequency: 'monthly' }) === null);
check('down pct clamped to 100', (() => {
  const r = installmentPlan({ price: 500_000, downPaymentPct: 250, installmentYears: 3, frequency: 'monthly' });
  return r !== null && r.financedAmount === 0;
})());

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll property-math checks passed.');
