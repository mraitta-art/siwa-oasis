'use client';

import React from 'react';
import type { HomeData } from '@/lib/home-data';

/**
 * How it works — three steps, localised server-side into homeData.steps.
 */
export default function MarketHowItWorks({ data, props }: { data: HomeData; props?: any }) {
  const { ar, steps } = data;
  if (!steps || steps.length === 0) return null;

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? 'كيف يعمل' : 'How it works');

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 0' }}>
      <h2 style={{ margin: '0 0 1.1rem', fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)' }}>
        {heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        {steps.map(([title, body], index) => (
          <div key={title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem 1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#8a6d16', letterSpacing: '2px', marginBottom: '0.5rem' }}>
              0{index + 1}
            </div>
            <div style={{ fontWeight: 900, fontSize: '0.96rem', color: 'var(--text)', marginBottom: '0.35rem' }}>{title}</div>
            <div style={{ fontSize: '0.84rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>{body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
