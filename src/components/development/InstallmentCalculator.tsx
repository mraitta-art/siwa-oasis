'use client';

import { useMemo, useState } from 'react';
import { installmentPlan, type PaymentFrequency } from '@/lib/property-math';

/**
 * A working instalment calculator.
 *
 * Pure client state over `property-math.ts`: change the price, the down payment,
 * the term or the cadence and the numbers move. It is seeded from a project's
 * real plan so it opens on something true, but the visitor owns every input —
 * nothing here is a quote, and the caption says so.
 *
 * Currency and direction come from the caller (the market owns the currency);
 * the component never hardcodes EGP.
 */

const STRINGS = {
  ar: {
    title: 'حاسبة الأقساط',
    price: 'السعر',
    down: 'الدفعة المقدمة %',
    years: 'مدة التقسيط (سنوات)',
    frequency: 'دورية السداد',
    interest: 'نسبة الفائدة السنوية % (اختياري)',
    perPeriod: 'قيمة القسط',
    downAmount: 'الدفعة المقدمة',
    totalPaid: 'إجمالي المدفوع',
    months: 'على مدى',
    monthsUnit: 'شهرًا',
    uplift: 'فوق سعر البيع',
    none: 'أدخل سعرًا ومدة لحساب القسط.',
    disclaimer: 'توضيحي فقط — وليس عرضًا رسميًا من المطوّر.',
    freq: { monthly: 'شهري', quarterly: 'ربع سنوي', semi_annual: 'نصف سنوي', annual: 'سنوي' } as Record<PaymentFrequency, string>,
    periodWord: { monthly: 'شهريًا', quarterly: 'ربع سنويًا', semi_annual: 'نصف سنويًا', annual: 'سنويًا' } as Record<PaymentFrequency, string>,
  },
  en: {
    title: 'Instalment calculator',
    price: 'Price',
    down: 'Down payment %',
    years: 'Term (years)',
    frequency: 'Payment frequency',
    interest: 'Annual interest rate % (optional)',
    perPeriod: 'Instalment',
    downAmount: 'Down payment',
    totalPaid: 'Total paid',
    months: 'over',
    monthsUnit: 'months',
    uplift: 'above sticker price',
    none: 'Enter a price and a term to see the instalment.',
    disclaimer: 'Illustrative only — not a formal offer from the developer.',
    freq: { monthly: 'Monthly', quarterly: 'Quarterly', semi_annual: 'Semi-annual', annual: 'Annual' } as Record<PaymentFrequency, string>,
    periodWord: { monthly: 'per month', quarterly: 'per quarter', semi_annual: 'every 6 months', annual: 'per year' } as Record<PaymentFrequency, string>,
  },
};

const field: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  fontSize: '0.9rem',
  fontWeight: 700,
  color: '#0F172A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
};
const label: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.3rem' };

export default function InstallmentCalculator({
  seed,
  currency = 'EGP',
  ar = false,
}: {
  seed: { price: number; downPaymentPct: number; installmentYears: number; frequency: PaymentFrequency };
  currency?: string;
  ar?: boolean;
}) {
  const t = STRINGS[ar ? 'ar' : 'en'];
  const [price, setPrice] = useState(String(seed.price || ''));
  const [downPct, setDownPct] = useState(String(seed.downPaymentPct ?? ''));
  const [years, setYears] = useState(String(seed.installmentYears || ''));
  const [frequency, setFrequency] = useState<PaymentFrequency>(seed.frequency || 'monthly');
  const [rate, setRate] = useState('');

  const result = useMemo(() => {
    const priceNum = Number(price);
    const yearsNum = Number(years);
    if (!Number.isFinite(priceNum) || priceNum <= 0 || !Number.isFinite(yearsNum) || yearsNum <= 0) return null;
    return installmentPlan({
      price: priceNum,
      downPaymentPct: Number(downPct) || 0,
      installmentYears: yearsNum,
      frequency,
      annualInterestRate: Number(rate) || 0,
    });
  }, [price, downPct, years, frequency, rate]);

  const locale = ar ? 'ar-EG' : 'en-US';
  const money = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', background: '#FFFFFF' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94A3B8', letterSpacing: '1.5px', marginBottom: '0.9rem' }}>
        {t.title.toUpperCase()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={label}>{t.price}</label>
          <input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} style={field} />
        </div>
        <div>
          <label style={label}>{t.down}</label>
          <input type="number" inputMode="numeric" value={downPct} onChange={(e) => setDownPct(e.target.value)} style={field} />
        </div>
        <div>
          <label style={label}>{t.years}</label>
          <input type="number" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} style={field} />
        </div>
        <div>
          <label style={label}>{t.frequency}</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as PaymentFrequency)} style={field}>
            {(Object.keys(t.freq) as PaymentFrequency[]).map((key) => (
              <option key={key} value={key}>
                {t.freq[key]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>{t.interest}</label>
          <input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" style={field} />
        </div>
      </div>

      {result ? (
        <div style={{ marginTop: '1rem', borderTop: '1px dashed #E2E8F0', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>{t.perPeriod}</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F4C81' }}>
              {money(result.perPeriod)}
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}> {t.periodWord[frequency]}</span>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569', marginBottom: '0.35rem' }}>
            <span>{t.downAmount}</span>
            <strong>{money(result.downPayment)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569', marginBottom: '0.35rem' }}>
            <span>{t.totalPaid}</span>
            <strong>{money(result.totalPaid)}</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
            {t.months} {result.months} {t.monthsUnit}
            {result.interestPaid > 0 ? ` · ${money(result.interestPaid)} ${t.uplift}` : ''}
          </div>
        </div>
      ) : (
        <p style={{ margin: '1rem 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>{t.none}</p>
      )}

      <p style={{ margin: '0.9rem 0 0', fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>{t.disclaimer}</p>
    </div>
  );
}
