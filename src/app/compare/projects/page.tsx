import type { Metadata } from 'next';
import Link from 'next/link';
import { pathLocale } from '@/lib/site-locale';
import { compareDevelopments } from '@/lib/development-compare';
import { listAllActiveCompounds } from '@/lib/developments';
import ProjectComparisonTable from '@/components/development/ProjectComparisonTable';
import ProjectPicker from '@/components/development/ProjectPicker';
import InstallmentCalculator from '@/components/development/InstallmentCalculator';

/**
 * Compare property projects side by side.
 *
 * One route serves both languages — middleware negotiates the locale into an
 * `x-siwa-locale` header, and the ids live in the query, so `/en/compare/projects`
 * and `/compare/projects?ids=…` are the same page (the bare path is Arabic). It is
 * rendered server-side so the numbers are in the HTML, and marked noindex: a saved
 * combination of ids is a private shortlist, not a page worth crawling.
 */

export const dynamic = 'force-dynamic';

const HEAD = {
  ar: {
    title: 'قارن المشروعات',
    lede: 'قارن حتى أربعة مشروعات جنبًا إلى جنب: السعر للمتر، المساحة، التسليم، المرافق وخطط السداد.',
    pick: 'ابدأ باختيار المشروعات بالأعلى.',
    calcTitle: 'احسب قسطك',
    markets: 'قارن المناطق كفرص استثمارية',
  },
  en: {
    title: 'Compare projects',
    lede: 'Line up to four projects side by side: price per m², area, handover, facilities and payment plans.',
    pick: 'Start by choosing projects above.',
    calcTitle: 'Work out your instalment',
    markets: 'Compare markets as opportunities',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const ar = (await pathLocale()) !== 'en';
  const h = HEAD[ar ? 'ar' : 'en'];
  return {
    title: `${h.title} | Siwify`,
    description: h.lede,
    robots: { index: false, follow: true },
  };
}

export default async function CompareProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const ar = (await pathLocale()) !== 'en';
  const h = HEAD[ar ? 'ar' : 'en'];

  const rawIds = typeof sp.ids === 'string' ? sp.ids : Array.isArray(sp.ids) ? sp.ids.join(',') : '';
  const ids = rawIds.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 4);

  const [projects, catalog] = await Promise.all([
    compareDevelopments(ids),
    listAllActiveCompounds('compound'),
  ]);

  const pickerCatalog = catalog.map((dev) => ({
    id: dev.id,
    name: ar ? dev.nameAr || dev.nameEn : dev.nameEn || dev.nameAr,
    groupName: dev.marketId,
  }));

  // Seed the calculator from the first project that actually has a plan; if none
  // do (a fresh shortlist), the widget opens empty and the visitor fills it in.
  const seedProject = projects.find((p) => p.calculator) || projects[0];
  const seed = seedProject?.calculator
    ? {
        price: seedProject.calculator.price,
        downPaymentPct: seedProject.calculator.downPaymentPct,
        installmentYears: seedProject.calculator.installmentYears,
        frequency: seedProject.bestPlan?.frequency || 'monthly',
      }
    : { price: 0, downPaymentPct: 0, installmentYears: 0, frequency: 'monthly' as const };

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0F172A' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900 }}>{h.title}</h1>
        <p style={{ margin: '0.6rem 0 0', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.7 }}>{h.lede}</p>
        <Link
          href={`${ar ? '' : '/en'}/compare/markets`}
          style={{ display: 'inline-block', marginTop: '0.7rem', fontSize: '0.82rem', fontWeight: 900, color: '#0F4C81', textDecoration: 'none' }}
        >
          {h.markets} →
        </Link>
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 1.25rem' }}>
        <ProjectPicker catalog={pickerCatalog} selected={ids} ar={ar} max={4} />
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 2rem' }}>
        {projects.length > 0 ? (
          <ProjectComparisonTable projects={projects} ar={ar} currency="EGP" />
        ) : (
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>{h.pick}</p>
        )}
      </section>

      {projects.length > 0 && (
        <section style={{ maxWidth: 520, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 1rem' }}>{h.calcTitle}</div>
          <InstallmentCalculator seed={seed} currency="EGP" ar={ar} />
        </section>
      )}
    </div>
  );
}
