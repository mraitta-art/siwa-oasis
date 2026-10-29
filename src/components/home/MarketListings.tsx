'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';
import { optimizeImageUrlsDeep } from '@/lib/image-url';

/**
 * Newest listings in the market. Renders nothing when there is no supply, so an
 * empty market's front door does not show a bare heading.
 */
export default function MarketListings({ data, props }: { data: HomeData; props?: any }) {
  const { ar, base, accent, name } = data;

  const max = Number.isFinite(props?.max) && props.max > 0 ? Math.trunc(props.max) : 6;
  const listings = data.listings.slice(0, max);
  if (listings.length === 0) return null;

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? `أحدث الأنشطة في ${name}` : `Newest in ${name}`);

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>
      <h2 style={{ margin: '0 0 1.1rem', fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)' }}>
        {heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.1rem' }}>
        {listings.map(listing => {
          const cover = listing.coverImage ? optimizeImageUrlsDeep(listing.coverImage) : null;
          const title = ar ? listing.nameAr || listing.name : listing.name;
          const type = ar ? (listing.typeNameAr || listing.typeName) : listing.typeName;
          return (
            <Link
              key={listing.id}
              href={`${base}/${listing.slug}`}
              style={{
                textDecoration: 'none',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                color: 'var(--text)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  height: 140,
                  background: cover
                    ? `url(${cover}) center/cover`
                    : `linear-gradient(135deg, ${accent}55, #0F172A)`,
                }}
              />
              <div style={{ padding: '0.95rem 1.05rem 1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 900, color: '#8a6d16' }}>
                    {type || (ar ? 'نشاط' : 'Business')}
                  </span>
                  {listing.isTrusted && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'rgba(34,197,94,0.15)', color: '#15803d', padding: '1px 6px', borderRadius: 999 }}>
                      {ar ? 'موثّق' : 'VERIFIED'}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.02rem', lineHeight: 1.4 }}>{title}</div>
                <div style={{ marginTop: '0.55rem', fontSize: '0.74rem', fontWeight: 800, color: '#8a6d16' }}>
                  {ar ? 'افتح الموقع ←' : 'Open minisite →'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
