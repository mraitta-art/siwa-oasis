'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';
import { optimizeImageUrlsDeep } from '@/lib/image-url';

/**
 * The developers building in this market. This is the differentiator the
 * developers migration was made for: an investor can open a brand and see its
 * whole portfolio. Reads listDevelopersByMarket (server), so it simply hides on
 * a database that has not run the migration yet (the query returns []).
 */
export default function FeaturedDevelopers({ data, props }: { data: HomeData; props?: any }) {
  const { ar, accent, name } = data;

  const max = Number.isFinite(props?.max) && props.max > 0 ? Math.trunc(props.max) : 8;
  const developers = data.developers.slice(0, max);
  if (developers.length === 0) return null;

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? `مطوّرون يبنون في ${name}` : `Developers building in ${name}`);
  const subtitle = typeof props?.subtitle === 'string' && props.subtitle
    ? props.subtitle
    : (ar ? 'افتح أي مطوّر لترى كامل مشروعاته وتقارنها جنبًا إلى جنب.' : 'Open any developer to compare their whole portfolio side by side.');

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>
      <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)' }}>
        {heading}
      </h2>
      <p style={{ margin: '0 0 1.2rem', fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.7 }}>
        {subtitle}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.9rem' }}>
        {developers.map(dev => (
          <Link
            key={dev.id}
            href={ar ? `/developers/${dev.slug}` : `/en/developers/${dev.slug}`}
            style={{
              textDecoration: 'none',
              color: 'var(--text)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '1.2rem 1.1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.6rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: dev.logoUrl
                  ? `url(${optimizeImageUrlsDeep(dev.logoUrl)}) center/contain no-repeat, #ffffff`
                  : `linear-gradient(135deg, ${accent}33, var(--bg-alt))`,
                border: '1px solid var(--border)',
              }}
            />
            <div style={{ fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.35 }}>
              {ar ? dev.nameAr || dev.name : dev.name}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0F172A', background: accent, borderRadius: 999, padding: '0.15rem 0.6rem' }}>
              {dev.projects} {ar ? 'مشروع' : (dev.projects === 1 ? 'project' : 'projects')}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
