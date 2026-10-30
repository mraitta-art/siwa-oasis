'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';
import { PILLARS, pillarUrl } from '@/lib/pillars';

/**
 * The Egypt-wide front-door hero for the platform root (`/`).
 *
 * This is deliberately NOT a single market: it positions Siwify as Egypt's
 * marketplace for properties and tourism, with the individual destinations
 * (Siwa, El Alamein, Ras El Hekma, ...) surfaced by the destinations band
 * below it. That is what unties the domain from Siwa in search — the root
 * headline and the derived <title> speak for the country, not one oasis.
 *
 * It reads only homeData (resolved server-side), so it adds no client fetch
 * and keeps SSR/SEO parity.
 */
export default function EgyptHero({ data, props }: { data: HomeData; props?: any }) {
  const { ar, accent, inventory, categories, locale } = data;

  const title = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? 'سوق العقارات والسياحة في مصر' : 'Egypt\u2019s marketplace for properties & tourism');
  const subtitle = typeof props?.subtitle === 'string' && props.subtitle
    ? props.subtitle
    : (ar
        ? 'منتجعات، شاليهات، فنادق، مخيمات صحراوية ورحلات — أنشِطة موثّقة في كل أنحاء مصر. تواصل مباشر مع الملاك بدون وسيط.'
        : 'Resorts, chalets, hotels, desert camps and tours \u2014 verified businesses all over Egypt. Talk to owners directly, no middleman.');

  const browseHref = typeof props?.buttonLink === 'string' && props.buttonLink
    ? props.buttonLink
    : (ar ? '/categories' : '/en/categories');
  const browseLabel = typeof props?.buttonText === 'string' && props.buttonText
    ? props.buttonText
    : (ar ? 'تصفّح التصنيفات' : 'Browse categories');
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
          {ar ? 'سوق مصري' : 'EGYPT MARKETPLACE'}
        </div>

        <h1 style={{ margin: '0.7rem 0 0.4rem', fontSize: 'clamp(2.3rem, 6vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1 }}>
          {title}
        </h1>

        <p style={{ margin: 0, maxWidth: 680, fontSize: '1.05rem', lineHeight: 1.8, opacity: 0.82 }}>
          {subtitle}
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
            {ar ? 'أضف نشاطك مجانًا' : 'List your business \u2014 free'}
          </Link>
        </div>

        {/* Universal quick-nav: the hero itself is a door into every specialized
            page — the three intents plus the general category map — so a first-time
            visitor can self-classify without scrolling. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
          {PILLARS.map((p) => (
            <Link
              key={p.slug}
              href={pillarUrl(p.slug, locale)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 999,
                border: `1px solid ${p.accent}66`,
                background: `${p.accent}1f`,
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              <i className={`fas ${p.icon}`} aria-hidden style={{ color: p.accent }} />
              {ar ? p.label.ar : p.label.en}
            </Link>
          ))}
          <Link
            href={ar ? '/categories' : '/en/categories'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.28)',
              background: 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
          >
            <i className="fas fa-layer-group" aria-hidden /> {ar ? 'كل التصنيفات' : 'All categories'}
          </Link>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.9rem', marginTop: '2.4rem', fontSize: '0.76rem', fontWeight: 800, opacity: 0.72 }}>
          <span>{inventory} {ar ? 'نشاط منشور' : 'live listings'}</span>
          <span>{categories.length} {ar ? 'تصنيف' : 'categories'}</span>
          <span>{ar ? 'حجز مباشر' : 'Direct booking'}</span>
        </div>
      </div>
    </section>
  );
}
