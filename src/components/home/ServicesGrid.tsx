'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';

/**
 * "Our services" — the prominent category grid. Each tile is a live door:
 * it shows the supply behind the category (from listMarketCategories) so a
 * visitor only ever clicks into a shelf that actually has businesses.
 */
function iconClass(icon: string | null): { fa: string } | { glyph: string } | null {
  if (!icon) return null;
  const raw = icon.trim();
  if (!raw) return null;
  // A bare fontawesome suffix ("house" / "fa-house") renders as an <i>.
  if (/^fa(s|-)?[a-z0-9-]+$/i.test(raw) || /^[a-z][a-z0-9-]*$/i.test(raw)) {
    const name = raw.startsWith('fa-') ? raw : `fa-${raw}`;
    return { fa: `fas ${name}` };
  }
  // Anything else (an emoji, a short label) is shown verbatim.
  return { glyph: raw };
}

export default function ServicesGrid({ data, props }: { data: HomeData; props?: any }) {
  const { ar, base, accent } = data;

  const max = Number.isFinite(props?.max) && props.max > 0 ? Math.trunc(props.max) : 12;
  const categories = data.categories.slice(0, max);
  const allHref = ar ? '/categories' : '/en/categories';

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? 'خدماتنا' : 'Our services');
  const subtitle = typeof props?.subtitle === 'string' && props.subtitle
    ? props.subtitle
    : (ar
        ? 'تصفّح حسب التصنيف عبر وجهات مصر — كل بطاقة تفتح الأنشطة الموثّقة المنشورة فيها.'
        : 'Browse by category across Egypt\u2019s destinations \u2014 every tile opens the verified businesses published in it.');

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
            {heading}
          </h2>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.7 }}>
            {subtitle}
          </p>
        </div>
        <Link href={allHref} style={{ color: accent, fontSize: '0.82rem', fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {ar ? 'كل التصنيفات ←' : 'View all categories →'}
        </Link>
      </div>

      {categories.length === 0 ? (
        <div style={{ border: '1px dashed var(--border)', borderRadius: 14, padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {ar ? 'لا توجد أنشطة منشورة بعد.' : 'No businesses published yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {categories.map(c => {
            const icon = iconClass(c.icon);
            const name = ar ? c.nameAr || c.name : c.name;
            const desc = c.description ? (ar ? c.description : c.description) : null;
            return (
              <Link
                key={c.id}
                href={`${base}?category=${encodeURIComponent(c.id)}`}
                style={{
                  textDecoration: 'none',
                  color: 'var(--text)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  padding: '1.4rem 1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.7rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                  <span
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      color: '#0F172A',
                      background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
                      flexShrink: 0,
                    }}
                  >
                    {icon && 'fa' in icon
                      ? <i className={(icon as { fa: string }).fa} aria-hidden />
                      : icon && 'glyph' in icon
                        ? (icon as { glyph: string }).glyph
                        : '•'}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--text-light)', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.2rem 0.6rem' }}>
                    {c.listings} {ar ? 'نشاط' : (c.listings === 1 ? 'listing' : 'listings')}
                  </span>
                </div>

                <div style={{ fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.35 }}>{name}</div>
                {desc && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {desc}
                  </div>
                )}
                <div style={{ marginTop: 'auto', fontSize: '0.78rem', fontWeight: 900, color: accent }}>
                  {ar ? 'تصفّح ←' : 'Browse →'}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
