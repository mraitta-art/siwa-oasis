'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';

/**
 * Category doors, built from live supply. Counts come from
 * listMarketCategories (server), so a door never links to an empty shelf.
 */
export default function MarketCategories({ data, props }: { data: HomeData; props?: any }) {
  const { ar, base, accent } = data;

  const max = Number.isFinite(props?.max) && props.max > 0 ? Math.trunc(props.max) : 8;
  const categories = data.categories.slice(0, max);

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? 'تصفّح حسب التصنيف' : 'Browse by category');

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)' }}>
          {heading}
        </h2>
        <Link href={base} style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'none' }}>
          {ar ? 'الكل ←' : 'All →'}
        </Link>
      </div>

      {categories.length === 0 ? (
        <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: '1.9rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {ar ? 'لا توجد أنشطة منشورة بعد.' : 'No businesses published yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.9rem' }}>
          {categories.map(c => (
            <Link
              key={c.id}
              href={`${base}?category=${encodeURIComponent(c.id)}`}
              style={{
                textDecoration: 'none',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '1.15rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '0.93rem', color: 'var(--text)' }}>
                {ar ? c.nameAr || c.name : c.name}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0F172A', background: accent, borderRadius: 999, padding: '0.18rem 0.55rem' }}>
                {c.listings}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
