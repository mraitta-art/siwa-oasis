import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PillarChrome from '@/components/pillars/PillarChrome';
import PropertiesTours from '@/components/pillars/PropertiesTours';
import { getPillar, pillarUrl } from '@/lib/pillars';
import { languageAlternates, pathLocale, type SiteLocale } from '@/lib/site-locale';
import { listMarkets, marketName } from '@/lib/markets';
import { listDevelopers } from '@/lib/developers';

/**
 * `/properties` — the Egypt-wide property pillar. It gathers the real-estate
 * markets (El Alamein, Ras El Hekma, ...), the developers building there, and
 * the site's own flagship service: a facilitated tour of the shortlisted
 * projects and a face-to-face meeting with the developer.
 */

const pillar = getPillar('properties')!;

async function resolveLocale(): Promise<SiteLocale> {
  return (await pathLocale()) ?? 'ar';
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
      {/* The flagship service */}
      <div style={{ marginBottom: '3rem' }}>
        <PropertiesTours ar={ar} accent={pillar.accent} projects={tourProjects} />
      </div>

      {/* Property destinations */}
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
        {ar ? 'أسواق العقارات' : 'Property markets'}
      </h2>
      {propertyMarkets.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{ar ? 'لا توجد أسواق عقارية بعد.' : 'No property markets yet.'}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.9rem', marginBottom: '3rem' }}>
          {propertyMarkets.map(m => {
            const label = marketName(m, locale);
            const sub = ar ? m.nameEn : m.nameAr;
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
            const inner = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-city" aria-hidden="true" style={{ color: m.themeAccent || pillar.accent }} />
                  <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>{label}</span>
                </div>
                {sub && <span style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 700 }}>{sub}</span>}
                <span style={{ marginTop: '0.3rem', fontSize: '0.8rem', fontWeight: 900, color: m.active ? pillar.accent : 'var(--text-light)' }}>
                  {m.active ? (ar ? 'تصفّح المشروعات ←' : 'Browse developments →') : (ar ? 'قريبًا' : 'Coming soon')}
                </span>
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

      {/* Developers */}
      {developers.length > 0 && (
        <>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
            {ar ? 'المطوّرون' : 'Developers'}
          </h2>
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
        </>
      )}
    </PillarChrome>
  );
}
