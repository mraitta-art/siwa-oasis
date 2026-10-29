'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';

// marketName is inlined rather than imported from '@/lib/markets': that module
// pulls in next/headers (server-only), and this component renders inside the
// client builder tree, so importing it there breaks the client bundle.
function displayName(market: { nameAr: string; nameEn: string }, ar: boolean): string {
  return ar ? market.nameAr : market.nameEn;
}

/**
 * Other markets. Only shows when there is more than one active market, so a
 * single-market deployment never gets an empty "OTHER MARKETS" heading.
 */
export default function MarketsShowcase({ data, props }: { data: HomeData; props?: any }) {
  const { ar, markets, accent } = data;
  if (markets.length <= 1) return null;

  const others = markets.filter(m => m.slug !== data.market.slug);
  if (others.length === 0) return null;

  const heading = typeof props?.title === 'string' && props.title ? props.title : (ar ? 'أسواق أخرى' : 'OTHER MARKETS');

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>
      <h2 style={{ margin: '0 0 1.1rem', fontSize: '0.7rem', letterSpacing: '3px', fontWeight: 900, color: 'var(--text-light)' }}>
        {heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.9rem' }}>
        {others.map(m => (
          <Link
            key={m.slug}
            href={ar ? `/${m.slug}` : `/en/${m.slug}`}
            style={{
              textDecoration: 'none',
              color: 'var(--text)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${m.themeAccent || accent}`,
              borderRadius: 12,
              padding: '1.05rem 1.15rem',
              fontWeight: 800,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {displayName(m, ar)}
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.25rem' }}>
              {m.currency}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
