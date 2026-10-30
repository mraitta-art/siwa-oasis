'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';
import { PILLARS, pillarUrl } from '@/lib/pillars';

/**
 * The pillar gateway — the three main pages shown from the home front door.
 *
 * A market is a place; these are the intents that cross places (travel,
 * property, planning both). This band is how a first-time visitor meets the
 * `/tourism`, `/properties` and `/plan` pages from `/`, so the marketplace reads
 * as Egypt-wide and organised by purpose, not only by destination.
 *
 * Like the other front-door blocks it reads homeData (resolved server-side) for
 * the language, and never fetches its own API.
 */
export default function PillarGateway({ data, props }: { data: HomeData; props?: any }) {
  const ar = data.ar;
  const locale = data.locale;

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? 'ابدأ رحلتك' : 'Start your journey');
  const subtitle = typeof props?.subtitle === 'string' && props.subtitle
    ? props.subtitle
    : (ar
        ? 'ثلاث طرق رئيسية لمصر — للسياحة، للعقارات، أو لخطّط رحلتك للاثنين.'
        : 'Three main ways into Egypt — for tourism, for properties, or to plan your journey for both.');

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem 0' }}>
      <div style={{ marginBottom: '1.4rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3.2vw, 1.9rem)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
          {heading}
        </h2>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.7 }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {PILLARS.map(p => (
          <Link
            key={p.slug}
            href={pillarUrl(p.slug, locale)}
            style={{
              textDecoration: 'none',
              color: 'var(--text)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderTop: `3px solid ${p.accent}`,
              borderRadius: 18,
              padding: '1.4rem 1.3rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 14, background: `${p.accent}1f`, border: `1px solid ${p.accent}55`, color: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '0.4rem' }}>
              <i className={`fas ${p.icon}`} aria-hidden="true" />
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.12rem' }}>{ar ? p.label.ar : p.label.en}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, flex: 1 }}>{ar ? p.blurb.ar : p.blurb.en}</div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', fontWeight: 900, color: p.accent }}>
              {ar ? 'افتح ←' : 'Open →'}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
