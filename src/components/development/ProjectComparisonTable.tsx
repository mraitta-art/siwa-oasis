import Link from 'next/link';
import type { ProjectComparison } from '@/lib/development-compare';

/**
 * The side-by-side table. One column per project, one row per comparison axis.
 *
 * A best value is marked with a "★" so a visitor scanning four compounds sees,
 * instantly, which is cheapest per m², which has the longest term, which hands
 * over first. The marks come precomputed from `development-compare.ts`; this
 * component only draws them.
 */

const L = {
  ar: {
    developer: 'المطوّر',
    statusWord: 'الحالة',
    status: { announced: 'قيد الإعلان', under_construction: 'تحت الإنشاء', delivered: 'تم التسليم', sold_out: 'مباع بالكامل' } as Record<string, string>,
    handover: 'التسليم',
    priceRange: 'نطاق السعر',
    pricePerSqm: 'السعر للمتر',
    area: 'المساحة',
    bedrooms: 'غرف النوم',
    facilities: 'المرافق',
    bestPlan: 'أفضل خطة سداد',
    instalment: 'القسط التقريبي',
    verified: 'تم التحقق',
    view: 'صفحة المشروع',
    none: '—',
    best: 'الأفضل',
    sqmUnit: 'م²',
    yearUnit: 'سنة',
    downUnit: 'مقدمة',
  },
  en: {
    developer: 'Developer',
    statusWord: 'Status',
    status: { announced: 'Announced', under_construction: 'Under construction', delivered: 'Delivered', sold_out: 'Sold out' } as Record<string, string>,
    handover: 'Handover',
    priceRange: 'Price range',
    pricePerSqm: 'Price / m²',
    area: 'Area',
    bedrooms: 'Bedrooms',
    facilities: 'Facilities',
    bestPlan: 'Best plan',
    instalment: 'Est. instalment',
    verified: 'Verified',
    view: 'Project page',
    none: '—',
    best: 'Best',
    sqmUnit: 'm²',
    yearUnit: 'yr',
    downUnit: 'down',
  },
};

function money(value: number, ar: boolean, currency: string): string {
  return new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export default function ProjectComparisonTable({
  projects,
  ar = false,
  currency = 'EGP',
}: {
  projects: ProjectComparison[];
  ar?: boolean;
  currency?: string;
}) {
  const t = L[ar ? 'ar' : 'en'];
  const num = (value: number | null) => (value === null ? null : value);

  const rows: { label: string; render: (p: ProjectComparison) => { text: string; best?: boolean } }[] = [
    { label: t.developer, render: (p) => ({ text: p.developerName || t.none }) },
    { label: t.statusWord, render: (p) => ({ text: t.status[p.status] || p.status }) },
    { label: t.handover, render: (p) => ({ text: p.deliveryYear ? String(p.deliveryYear) : t.none, best: p.earliestHandover }) },
    {
      label: t.priceRange,
      render: (p) => {
        const min = num(p.priceMin);
        const max = num(p.priceMax);
        if (min === null) return { text: t.none };
        return { text: max !== null && max !== min ? `${money(min, ar, currency)} – ${money(max, ar, currency)}` : money(min, ar, currency) };
      },
    },
    {
      label: t.pricePerSqm,
      render: (p) => ({ text: p.pricePerSqmMin !== null ? `${money(Math.round(p.pricePerSqmMin), ar, currency)}/${t.sqmUnit}` : t.none, best: p.bestValue }),
    },
    {
      label: t.area,
      render: (p) => {
        if (p.areaMin === null) return { text: t.none };
        return { text: p.areaMax !== null && p.areaMax !== p.areaMin ? `${p.areaMin}–${p.areaMax} ${t.sqmUnit}` : `${p.areaMin} ${t.sqmUnit}` };
      },
    },
    { label: t.bedrooms, render: (p) => ({ text: p.bedrooms.length ? p.bedrooms.join(' · ') : t.none }) },
    { label: t.facilities, render: (p) => ({ text: p.facilities.length ? p.facilities.join(', ') : t.none, best: p.bestFacilities }) },
    {
      label: t.bestPlan,
      render: (p) => {
        if (!p.bestPlan) return { text: t.none };
        const parts = [
          p.bestPlan.downPaymentPct !== null ? `${p.bestPlan.downPaymentPct}% ${t.downUnit}` : null,
          p.bestPlan.installmentYears !== null ? `${p.bestPlan.installmentYears} ${t.yearUnit}` : null,
        ].filter(Boolean);
        return { text: parts.length ? parts.join(' · ') : t.none, best: p.bestTerm || p.bestDownPayment };
      },
    },
    {
      label: t.instalment,
      render: (p) => ({ text: p.calculator ? money(p.calculator.result.perPeriod, ar, currency) : t.none }),
    },
    { label: t.verified, render: (p) => ({ text: p.dataVerifiedAt || t.none }) },
  ];

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
        <thead>
          <tr>
            <th style={{ textAlign: ar ? 'right' : 'left', padding: '0.9rem 1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', minWidth: 120 }} />
            {projects.map((p) => {
              const name = ar ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
              return (
                <th
                  key={p.id}
                  style={{ textAlign: ar ? 'right' : 'left', padding: '0.9rem 1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', verticalAlign: 'top' }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A' }}>{name}</div>
                  <Link href={`/${p.marketId}/${p.slug}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F4C81', textDecoration: 'none' }}>
                    {t.view} →
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
              {projects.map((p) => {
                const cell = row.render(p);
                return (
                  <td key={p.id} style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#0F172A', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>
                    {cell.text}
                    {cell.best && cell.text !== t.none ? (
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
  );
}
