'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';

/**
 * The market hero — the front door's headline. Reads the active market from
 * homeData (resolved server-side) rather than a slideshow, so opening a new
 * market is a row change, not a page change.
 */
export default function MarketHero({ data, props }: { data: HomeData; props?: any }) {
  const { ar, name, otherName, accent, base, inventory, market, copy } = data;

  const browseHref = typeof props?.buttonLink === 'string' && props.buttonLink ? props.buttonLink : base;
  const browseLabel = typeof props?.buttonText === 'string' && props.buttonText
    ? props.buttonText
    : (ar ? `تصفّح ${inventory} نشاطًا ←` : `Browse ${inventory} ${inventory === 1 ? 'business' : 'businesses'} →`);
  const listHref = ar ? '/be-a-partner' : '/en/be-a-partner';

  return (
    <section
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        background: `linear-gradient(135deg, #0F172A 0%, #1B2436 55%, ${accent}33 100%)`,
        color: '#FFFFFF',
        borderBottom: `1px solid ${accent}44`,
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(3.5rem, 8vw, 5rem) 1.5rem clamp(3rem, 7vw, 4rem)' }}>
        <div style={{ fontSize: '0.68rem', letterSpacing: '4px', fontWeight: 900, color: accent }}>
          {ar ? 'سوق' : 'MARKETPLACE'} · {market.currency}
        </div>

        <h1 style={{ margin: '0.7rem 0 0.25rem', fontSize: 'clamp(2.3rem, 6vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1 }}>
          {name}
        </h1>
        <div style={{ opacity: 0.45, fontSize: '1rem', marginBottom: '1.1rem' }}>{otherName}</div>

        <p style={{ margin: 0, maxWidth: 640, fontSize: '1.05rem', lineHeight: 1.8, opacity: 0.82 }}>
          {copy}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', marginTop: '1.8rem' }}>
          <Link
            href={browseHref}
            style={{
              background: accent,
              color: '#0F172A',
              textDecoration: 'none',
              fontWeight: 900,
              fontSize: '0.88rem',
              padding: '0.85rem 1.4rem',
              borderRadius: 12,
              boxShadow: `0 10px 30px ${accent}33`,
            }}
          >
            {browseLabel}
          </Link>
          <Link
            href={listHref}
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              padding: '0.85rem 1.4rem',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {ar ? 'أضف نشاطك مجانًا' : 'List your business — free'}
          </Link>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.9rem', marginTop: '2.4rem', fontSize: '0.76rem', fontWeight: 800, opacity: 0.72 }}>
          <span>{inventory} {ar ? 'نشاط منشور' : 'live listings'}</span>
          <span>{data.categories.length} {ar ? 'تصنيف' : 'categories'}</span>
          <span>{ar ? 'الدفع بالجنيه' : `Priced in ${market.currency}`}</span>
        </div>
      </div>
    </section>
  );
}
