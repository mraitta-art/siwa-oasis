import Link from 'next/link';
import type { MarketOpportunity } from '@/lib/market-opportunity';

/**
 * Markets lined up as investment places, not as listings.
 *
 * Same visual grammar as the project table — one column per market, a "★" on the
 * best figure in each row — because a buyer who learned to read one should read
 * the other for free. A market column header links to that market's own door.
 */

const L = {
  ar: {
    projects: 'عدد المشروعات',
    supply: 'الوحدات المعروضة للبيع',
    entry: 'أقل سعر (نقطة الدخول)',
    avgPrice: 'متوسط السعر',
    avgPpsm: 'متوسط السعر للمتر',
    minPpsm: 'أقل سعر للمتر',
    handover: 'متوسط التسليم',
    best: 'الأفضل',
    none: '—',
    sqmUnit: 'م²',
    yearUnit: 'سنة',
    door: 'صفحة المنطقة',
    note: 'مؤشر استرشادي بناءً على المعروض حالياً، وليس معدلاً إحصائياً ولا ضماناً لتغيّر الأسعار.',
  },
  en: {
    projects: 'Active projects',
    supply: 'Units for sale',
    entry: 'Entry price (lowest)',
    avgPrice: 'Average price',
    avgPpsm: 'Average price / m²',
    minPpsm: 'Lowest price / m²',
    handover: 'Average handover',
    best: 'Best',
    none: '—',
    sqmUnit: 'm²',
    yearUnit: 'yr',
    door: 'Market page',
    note: 'Indicative snapshot of current supply — not a statistical index or a price forecast.',
  },
};

function money(value: number, ar: boolean, currency: string): string {
  return new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export default function MarketComparisonTable({
  markets,
  ar = false,
}: {
  markets: MarketOpportunity[];
  ar?: boolean;
}) {
  const t = L[ar ? 'ar' : 'en'];
  const localePrefix = ar ? '' : '/en';

  const value = (list: (number | null)[]) => list.filter((n): n is number => n !== null);
  const minOf = (key: (m: MarketOpportunity) => number | null) => {
    const nums = value(markets.map(key));
    return nums.length ? Math.min(...nums) : null;
  };
  const maxOf = (key: (m: MarketOpportunity) => number | null) => {
    const nums = value(markets.map(key));
    return nums.length ? Math.max(...nums) : null;
  };

  // A single market has no "best" — with one column the flag would be meaningless.
  const multi = markets.length > 1;
  const bestEntry = multi ? minOf((m) => m.entryPrice) : null;
  const bestAvgPpsm = multi ? minOf((m) => m.avgPricePerSqm) : null;
  const bestMinPpsm = multi ? minOf((m) => m.minPricePerSqm) : null;
  const bestSupply = multi ? maxOf((m) => m.saleUnits) : null;
  const bestHandover = multi ? minOf((m) => m.avgHandover) : null;

  const fmtMoney = (v: number | null, currency: string) => (v === null ? t.none : money(Math.round(v), ar, currency));
  const fmtInt = (v: number | null) => (v === null ? t.none : String(v));

  const rows: { label: string; render: (m: MarketOpportunity) => { text: string; best?: boolean } }[] = [
    { label: t.projects, render: (m) => ({ text: fmtInt(m.projectCount) }) },
    { label: t.supply, render: (m) => ({ text: fmtInt(m.saleUnits), best: m.saleUnits > 0 && m.saleUnits === bestSupply }) },
    { label: t.entry, render: (m) => ({ text: fmtMoney(m.entryPrice, m.currency), best: m.entryPrice !== null && m.entryPrice === bestEntry }) },
    { label: t.avgPrice, render: (m) => ({ text: fmtMoney(m.avgPrice, m.currency) }) },
    { label: t.avgPpsm, render: (m) => ({ text: m.avgPricePerSqm === null ? t.none : `${money(Math.round(m.avgPricePerSqm), ar, m.currency)}/${t.sqmUnit}`, best: m.avgPricePerSqm !== null && m.avgPricePerSqm === bestAvgPpsm }) },
    { label: t.minPpsm, render: (m) => ({ text: m.minPricePerSqm === null ? t.none : `${money(Math.round(m.minPricePerSqm), ar, m.currency)}/${t.sqmUnit}`, best: m.minPricePerSqm !== null && m.minPricePerSqm === bestMinPpsm }) },
    { label: t.handover, render: (m) => ({ text: m.avgHandover === null ? t.none : `${m.avgHandover} ${t.yearUnit}`, best: m.avgHandover !== null && m.avgHandover === bestHandover }) },
  ];

  return (
    <div dir={ar ? 'rtl' : 'ltr'}>
      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ textAlign: ar ? 'right' : 'left', padding: '0.9rem 1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', minWidth: 130 }} />
              {markets.map((m) => {
                const name = ar ? m.nameAr || m.name : m.name || m.nameAr;
                return (
                  <th key={m.marketId} style={{ textAlign: ar ? 'right' : 'left', padding: '0.9rem 1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A' }}>{name}</div>
                    <Link href={`${localePrefix}/${m.marketId}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F4C81', textDecoration: 'none' }}>
                      {t.door} →
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} style={{ background: rowIndex % 2 ? '#FCFDFE' : '#FFFFFF' }}>
                <th scope="row" style={{ textAlign: ar ? 'right' : 'left', padding: '0.7rem 1rem', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', whiteSpace: 'nowrap', borderBottom: '1px solid #F1F5F9' }}>
                  {row.label}
                </th>
                {markets.map((m) => {
                  const cell = row.render(m);
                  return (
                    <td key={m.marketId} style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#0F172A', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>
                      {cell.text}
                      {cell.best ? (
                        <span title={t.best} style={{ marginInlineStart: '0.4rem', color: '#0F4C81', fontWeight: 900 }}>★</span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: '0.6rem 0.25rem 0' }}>{t.note}</p>
    </div>
  );
}
