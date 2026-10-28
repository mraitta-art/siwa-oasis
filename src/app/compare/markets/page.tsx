import type { Metadata } from 'next';
import Link from 'next/link';
import { pathLocale } from '@/lib/site-locale';
import { listMarkets } from '@/lib/markets';
import { compareMarketOpportunities } from '@/lib/market-opportunity';
import MarketComparisonTable from '@/components/development/MarketComparisonTable';
import ProjectPicker from '@/components/development/ProjectPicker';

/**
 * Compare markets as places to invest.
 *
 * The project comparison answers "which compound"; this answers the question one
 * level up — "which area." It reuses the exact picker and URL mechanics of the
 * project page (`?ids=` of market slugs), rendered server-side and marked
 * noindex, because a chosen set of markets is a private shortlist, not a page to
 * crawl.
 */

export const dynamic = 'force-dynamic';

const HEAD = {
  ar: {
    title: 'قارن المناطق كفرص استثمارية',
    lede: 'قارن حتى أربع مناطق جنبًا إلى جنب: عدد المشروعات، المعروض للبيع، نقطة الدخول، متوسط السعر للمتر ومتوسط التسليم.',
    pick: 'ابدأ باختيار المناطق بالأعلى.',
    pickerTitle: 'اختر المناطق للمقارنة',
    projects: 'قارن المشروعات',
  },
  en: {
    title: 'Compare markets as opportunities',
    lede: 'Line up to four areas side by side: project count, for-sale supply, entry price, average price per m² and handover.',
    pick: 'Start by choosing markets above.',
    pickerTitle: 'Choose markets to compare',
    projects: 'Compare projects',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const ar = (await pathLocale()) === 'ar';
  const h = HEAD[ar ? 'ar' : 'en'];
  return {
    title: `${h.title} | Siwify`,
    description: h.lede,
    robots: { index: false, follow: true },
  };
}

export default async function CompareMarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const ar = (await pathLocale()) === 'ar';
  const h = HEAD[ar ? 'ar' : 'en'];

  const rawIds = typeof sp.ids === 'string' ? sp.ids : Array.isArray(sp.ids) ? sp.ids.join(',') : '';
  const ids = rawIds.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 4);

  const [opportunity, catalog] = await Promise.all([
    compareMarketOpportunities(ids),
    listMarkets({ activeOnly: false }),
  ]);

  const pickerCatalog = catalog.map((m) => ({
    id: m.slug,
    name: ar ? m.nameAr || m.nameEn : m.nameEn || m.nameAr,
    groupName: '',
  }));

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0F172A' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900 }}>{h.title}</h1>
        <p style={{ margin: '0.6rem 0 0', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.7 }}>{h.lede}</p>
        <Link
          href={`${ar ? '/ar' : ''}/compare/projects`}
          style={{ display: 'inline-block', marginTop: '0.7rem', fontSize: '0.82rem', fontWeight: 900, color: '#0F4C81', textDecoration: 'none' }}
        >
          {h.projects} →
        </Link>
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 1.25rem' }}>
        <ProjectPicker catalog={pickerCatalog} selected={ids} ar={ar} max={4} title={h.pickerTitle} />
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {opportunity.length > 0 ? (
          <MarketComparisonTable markets={opportunity} ar={ar} />
        ) : (
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>{h.pick}</p>
        )}
      </section>
    </div>
  );
}
