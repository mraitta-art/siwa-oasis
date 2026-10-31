import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PillarChrome from '@/components/pillars/PillarChrome';
import PillarTabs from '@/components/pillars/PillarTabs';
import PropertiesTours from '@/components/pillars/PropertiesTours';
import { PillarCardGrid, PillarChipRow, type PillarCardItem } from '@/components/pillars/PillarPrimitives';
import { getPillar, pillarUrl } from '@/lib/pillars';
import { languageAlternates, pathLocale, type SiteLocale } from '@/lib/site-locale';
import { listMarkets, listMarketCategories, marketName, type MarketCategoryFacet } from '@/lib/markets';
import { listDevelopers } from '@/lib/developers';

/**
 * `/properties` — the Egypt-wide property pillar. It gathers the real-estate
 * markets (El Alamein, Ras El Hekma, ...), the developers building there, and
 * the site's own flagship service: a facilitated tour of the shortlisted
 * projects and a face-to-face meeting with the developer.
 *
 * The tours tab is the investment half of the old "tours" idea — sites, land and
 * agricultural holdings — while the leisure half lives under `/tourism`. Markets
 * and developers are the content; the tabs are the intent.
 */

const pillar = getPillar('properties')!;

async function resolveLocale(): Promise<SiteLocale> {
  return (await pathLocale()) ?? 'ar';
}

/** Land and production supply an investor can tour, not just built units. */
const LAND_KEYS = ['land', 'agricultur', 'farm', 'estate', 'plot', 'investment', 'arable', 'أراضي', 'زراع', 'استثمار'];

function matchesCategory(facet: MarketCategoryFacet, keys: string[]): boolean {
  const haystack = `${facet.id} ${facet.name} ${facet.nameAr ?? ''}`.toLowerCase();
  return keys.some(k => haystack.includes(k));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const ar = locale === 'ar';
  const title = ar ? pillar.title.ar : pillar.title.en;
  const description = ar ? pillar.subtitle.ar : pillar.subtitle.en;
  return {
    title,
    description,
    alternates: {
      canonical: `https://siwify.com${locale === 'en' ? '/en/properties' : '/properties'}`,
      languages: languageAlternates('https://siwify.com', '/properties'),
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function PropertiesPage() {
  const locale = await resolveLocale();
  const ar = locale === 'ar';

  const [markets, developers] = await Promise.all([
    listMarkets({ activeOnly: false }),
    listDevelopers(),
  ]);

  // A property market earns as a real-estate lead. Some are seeded and dark, so
  // they show as "coming soon" — a dark market's URL answers 404, never linked.
  const propertyMarkets = markets.filter(m => m.revenueModel === 'realestate_lead');
  const developerProjects = developers.map(d => (ar ? d.nameAr || d.name : d.name)).filter(Boolean);
  const tourProjects = Array.from(new Set([
    ...propertyMarkets.map(m => marketName(m, locale)),
    ...developerProjects,
  ])).slice(0, 30);

  // Land / agriculture doors come from the same live supply the other pillars read.
  const activeSlugs = propertyMarkets.filter(m => m.active).map(m => m.slug);
  const facetGroups = await Promise.all(
    (activeSlugs.length ? activeSlugs : markets.filter(m => m.active).map(m => m.slug)).map(slug => listMarketCategories(slug, 12))
  );
  const merged = new Map<string, MarketCategoryFacet>();
  facetGroups.flat().forEach(c => {
    const prev = merged.get(c.id);
    merged.set(c.id, prev ? { ...prev, listings: prev.listings + c.listings } : c);
  });
  const land = Array.from(merged.values())
    .filter(c => matchesCategory(c, LAND_KEYS))
    .sort((a, b) => b.listings - a.listings)
    .slice(0, 8);

  const marketCards: PillarCardItem[] = propertyMarkets.map(m => ({
    key: m.slug,
    title: marketName(m, locale),
    subtitle: ar ? m.nameEn : m.nameAr,
    icon: 'fa-city',
    accent: m.themeAccent || pillar.accent,
    href: m.active ? (ar ? `/${m.slug}` : `/en/${m.slug}`) : null,
    actionLabel: m.active
      ? (ar ? 'تصفّح المشروعات ←' : 'Browse developments →')
      : (ar ? 'قريبًا' : 'Coming soon'),
  }));

  return (
    <PillarChrome
      locale={locale}
      activePath={pillarUrl('properties', locale)}
      eyebrow={ar ? pillar.eyebrow.ar : pillar.eyebrow.en}
      title={ar ? pillar.title.ar : pillar.title.en}
      subtitle={ar ? pillar.subtitle.ar : pillar.subtitle.en}
      accent={pillar.accent}
      icon={pillar.icon}
    >
      <PillarTabs
        ar={ar}
        accent={pillar.accent}
        ariaLabel={ar ? 'أقسام العقارات' : 'Property sections'}
        tabs={[
          {
            id: 'tours',
            label: ar ? 'جولات استثمارية' : 'Investment tours',
            icon: 'fa-car-side',
            content: (
              <div style={{ display: 'grid', gap: '2rem' }}>
                <PropertiesTours ar={ar} accent={pillar.accent} projects={tourProjects} />

                <div>
                  <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text)' }}>
                    {ar ? 'أراضي ومشروعات زراعية' : 'Land & agricultural holdings'}
                  </h2>
                  <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.8, maxWidth: 720 }}>
                    {ar
                      ? 'نفس الجولة تنطبق على الأرض والإنتاج: معاينة القطع والأراضي الزراعية ومناقشة المالك مباشرة.'
                      : 'The same tour applies to land and production: view plots and agricultural holdings and talk to the owner directly.'}
                  </p>
                  {land.length > 0 ? (
                    <PillarChipRow
                      items={land.map(c => ({
                        key: c.id,
                        label: ar ? c.nameAr || c.name : c.name,
                        icon: c.icon,
                        count: c.listings,
                        href: `${ar ? '/categories' : '/en/categories'}?category=${encodeURIComponent(c.id)}`,
                      }))}
                      accent={pillar.accent}
                    />
                  ) : (
                    <PillarChipRow
                      items={[{
                        key: 'soon',
                        label: ar ? 'قريبًا — تُفتح مع أول منشور' : 'Coming soon — opens with the first listing',
                        icon: 'fa-clock',
                        href: ar ? '/categories' : '/en/categories',
                      }]}
                      accent={pillar.accent}
                    />
                  )}
                </div>
              </div>
            ),
          },
          {
            id: 'markets',
            label: ar ? 'أسواق العقارات' : 'Property markets',
            icon: 'fa-city',
            content: propertyMarkets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>{ar ? 'لا توجد أسواق عقارية بعد.' : 'No property markets yet.'}</p>
            ) : (
              <PillarCardGrid items={marketCards} />
            ),
          },
          {
            id: 'developers',
            label: ar ? 'المطوّرون' : 'Developers',
            icon: 'fa-building',
            content: developers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>{ar ? 'لا يوجد مطوّرون بعد.' : 'No developers yet.'}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.9rem' }}>
                {developers.slice(0, 12).map(d => (
                  <Link
                    key={d.id}
                    href={ar ? `/developers/${d.slug}` : `/en/developers/${d.slug}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--text)',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '1rem 1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {d.logoUrl ? (
                      <img src={d.logoUrl} alt="" style={{ height: 34, width: 34, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid var(--border)' }} />
                    ) : (
                      <i className="fas fa-building" aria-hidden="true" style={{ color: pillar.accent, fontSize: '1.2rem' }} />
                    )}
                    <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{ar ? d.nameAr || d.name : d.name}</span>
                  </Link>
                ))}
              </div>
            ),
          },
        ]}
      />

      {/* Movement is the sibling section: a tour needs a driver */}
      <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
          {ar ? 'تنقّلات داخل الوجهة؟' : 'Moving around the destination?'}
        </span>
        <Link
          href={pillarUrl('transportation', locale)}
          style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.8rem' }}
        >
          {ar ? 'النقل واللوجستيات' : 'Transportation & logistics'}
        </Link>
      </div>
    </PillarChrome>
  );
}
