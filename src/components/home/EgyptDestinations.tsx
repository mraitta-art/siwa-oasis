'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';

// marketName lives in '@/lib/markets', which pulls in next/headers (server-only).
// This renders inside the client builder tree, so the name is resolved inline
// rather than imported — the same reason MarketsShowcase inlines it.
function displayName(market: { nameAr: string; nameEn: string }, ar: boolean): string {
  return ar ? market.nameAr : market.nameEn;
}

function blurb(market: { revenueModel: string }, ar: boolean): string {
  if (market.revenueModel === 'realestate_lead') {
    return ar ? 'عقارات ومنتجعات' : 'Properties & resorts';
  }
  if (market.revenueModel === 'directory_lead') {
    return ar ? 'دليل الأنشطة' : 'Local directory';
  }
  return ar ? 'سياحة وإقامة' : 'Tourism & stays';
}

/**
 * Egypt destinations. Surfaces the whole market network on the root landing so
 * the domain reads as a national marketplace, not a single oasis. A live market
 * links to its front door; a seeded-dark one is shown as "Coming soon" and is
 * never linked, because a dark market's URL answers 404.
 */
export default function EgyptDestinations({ data, props }: { data: HomeData; props?: any }) {
  const { ar, accent } = data;

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? 'استكشف حسب الوجهة' : 'Explore by destination');
  const subtitle = typeof props?.subtitle === 'string' && props.subtitle
    ? props.subtitle
    : (ar
        ? 'ننطلق سوقًا بسوق في أنحاء مصر — مصافَح، شاليهات، مخيمات ورحلات موثّقة.'
        : 'We open market by market across Egypt — serviced apartments, chalets, camps and verified tours.');

  const max = Number.isFinite(props?.max) && props.max > 0 ? Math.trunc(props.max) : 12;
  const destinations = data.allMarkets.slice(0, max);
  if (destinations.length === 0) return null;

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 0' }}>
      <div style={{ marginBottom: '1.4rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3.2vw, 1.9rem)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
          {heading}
        </h2>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.7 }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.9rem' }}>
        {destinations.map(m => {
          const label = displayName(m, ar);
          const tag = blurb(m, ar);
          const cardStyle = {
            textDecoration: 'none',
            color: 'var(--text)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${m.themeAccent || accent}`,
            borderRadius: 14,
            padding: '1.15rem 1.2rem',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '0.3rem',
            boxShadow: 'var(--shadow-sm)',
            opacity: m.active ? 1 : 0.72,
          };
          if (!m.active) {
            return (
              <div key={m.slug} style={cardStyle} aria-disabled="true">
                <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{label}</div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-light)' }}>{tag}</div>
                <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', color: accent, textTransform: 'uppercase' }}>
                  {ar ? 'قريبًا' : 'Coming soon'}
                </div>
              </div>
            );
          }
          return (
            <Link key={m.slug} href={ar ? `/${m.slug}` : `/en/${m.slug}`} style={cardStyle}>
              <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{label}</div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-light)' }}>{tag}</div>
              <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', fontWeight: 900, color: accent }}>
                {ar ? 'تصفّح ←' : 'Browse →'}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
