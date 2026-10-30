import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PillarChrome from '@/components/pillars/PillarChrome';
import { getPillar, pillarUrl } from '@/lib/pillars';
import { languageAlternates, pathLocale, type SiteLocale } from '@/lib/site-locale';
import { listMarkets, listMarketCategories, marketName, type Market } from '@/lib/markets';

/**
 * `/tourism` — the Egypt-wide travel pillar. A market is a place; this is the
 * intent that cuts across every non-property market: stays, trips, dining and
 * local services. It lists the destinations that serve travellers and points at
 * the shared category doors, and it is bilingual and RTL like the rest of the
 * site (Arabic owns `/tourism`, English lives at `/en/tourism`).
 */

const pillar = getPillar('tourism')!;

async function resolveLocale(): Promise<SiteLocale> {
  return (await pathLocale()) ?? 'ar';
}

/** A destination is "tourism" when it does not earn as a real-estate lead. */
function isTourismMarket(market: Market): boolean {
  return market.revenueModel !== 'realestate_lead';
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
      canonical: `https://siwify.com${locale === 'en' ? '/en/tourism' : '/tourism'}`,
      languages: languageAlternates('https://siwify.com', '/tourism'),
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function TourismPage() {
  const locale = await resolveLocale();
  const ar = locale === 'ar';

  const allMarkets = await listMarkets({ activeOnly: false });
  const destinations = allMarkets.filter(isTourismMarket);

  // Live category doors, resolved from the active tourism markets' supply.
  const activeSlugs = destinations.filter(m => m.active).map(m => m.slug);
  const facets = await Promise.all(activeSlugs.map(slug => listMarketCategories(slug, 6)));
  const merged = new Map<string, { name: string; nameAr: string | null; listings: number }>();
  facets.flat().forEach(c => {
    const prev = merged.get(c.id);
    merged.set(c.id, {
      name: c.name,
      nameAr: c.nameAr,
      listings: (prev?.listings ?? 0) + c.listings,
    });
  });
  const categories = Array.from(merged.values()).sort((a, b) => b.listings - a.listings).slice(0, 8);

  return (
    <PillarChrome
      locale={locale}
      activePath={pillarUrl('tourism', locale)}
      eyebrow={ar ? pillar.eyebrow.ar : pillar.eyebrow.en}
      title={ar ? pillar.title.ar : pillar.title.en}
      subtitle={ar ? pillar.subtitle.ar : pillar.subtitle.en}
      accent={pillar.accent}
      icon={pillar.icon}
    >
      {/* Destinations */}
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
        {ar ? 'الوجهات' : 'Destinations'}
      </h2>
      {destinations.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{ar ? 'لا توجد وجهات بعد.' : 'No destinations yet.'}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.9rem', marginBottom: '3rem' }}>
          {destinations.map(m => {
            const label = marketName(m, locale);
            const card: React.CSSProperties = {
              textDecoration: 'none',
              color: 'var(--text)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${m.themeAccent || pillar.accent}`,
              borderRadius: 14,
              padding: '1.15rem 1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              boxShadow: 'var(--shadow-sm)',
              opacity: m.active ? 1 : 0.72,
            };
            const sub = ar ? m.nameEn : m.nameAr;
            const body = m.active
              ? (ar ? 'تصفّح الوجهة ←' : 'Browse the destination →')
              : (ar ? 'قريبًا' : 'Coming soon');
            const inner = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-location-dot" aria-hidden="true" style={{ color: m.themeAccent || pillar.accent }} />
                  <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>{label}</span>
                </div>
                {sub && <span style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 700 }}>{sub}</span>}
                <span style={{ marginTop: '0.3rem', fontSize: '0.8rem', fontWeight: 900, color: m.active ? pillar.accent : 'var(--text-light)' }}>{body}</span>
              </>
            );
            return m.active ? (
              <Link key={m.slug} href={ar ? `/${m.slug}` : `/en/${m.slug}`} style={card}>{inner}</Link>
            ) : (
              <div key={m.slug} style={card} aria-disabled="true">{inner}</div>
            );
          })}
        </div>
      )}

      {/* Browse by travel category */}
      {categories.length > 0 && (
        <>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
            {ar ? 'تصفّح حسب النوع' : 'Browse by type'}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
            {categories.map(c => {
              const name = ar ? c.nameAr || c.name : c.name;
              return (
                <Link
                  key={c.name}
                  href={ar ? '/categories' : '/en/categories'}
                  style={{
                    textDecoration: 'none',
                    color: 'var(--text)',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 999,
                    padding: '0.6rem 1.05rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {name}
                  <span style={{ color: 'var(--text-light)', fontWeight: 700, fontSize: '0.75rem' }}>{c.listings}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </PillarChrome>
  );
}
