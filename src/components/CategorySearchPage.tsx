'use client';

import React, { useState } from 'react';
import VibeSearch from '@/components/VibeSearch';
import CategoryCommercialTabs from '@/components/CategoryCommercialTabs';

interface CategorySearchPageProps {
  category: string;
  label: string;
  title: string;
  description: string;
  accent: string;
}

export default function CategorySearchPage({
  category,
  label,
  title,
  description,
  accent,
}: CategorySearchPageProps) {
  const [activeView, setActiveView] = useState<'search' | 'deals'>('search');
  const pagePath = category === 'accommodation'
    ? 'accommodations'
    : category === 'transportation'
      ? 'transportation'
    : category === 'food'
      ? 'food-beverage'
    : category === 'activity'
      ? 'activities'
      : `${category}s`;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <header style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.9)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', gap: '1rem' }}>
          <a href="/" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 900, letterSpacing: '2px' }}>SIWA OASIS</a>
          <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
            <a href="/" style={{ color: '#475569', textDecoration: 'none' }}>Home</a>
            <a href={`/${pagePath}`} style={{ color: '#475569', textDecoration: 'none' }}>{label} Search</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', background: `${accent}18`, color: accent, padding: '0.45rem 0.9rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {label} Finder
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 900, margin: '1rem 0 0.75rem', lineHeight: 1.1 }}>
            {title}
          </h1>
          <p style={{ maxWidth: '720px', margin: '0 auto', color: '#475569', fontSize: '1rem', lineHeight: 1.75 }}>
            {description}
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e2e8f0', borderRadius: '30px', boxShadow: '0 20px 45px -30px rgba(15, 23, 42, 0.3)', padding: '1.25rem', marginTop: '1rem' }}>
          <div role="tablist" aria-label={`${label} discovery`} style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
            {[
              { id: 'search' as const, label: 'Search businesses' },
              { id: 'deals' as const, label: 'Packages, offers & discounts' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeView === tab.id}
                onClick={() => setActiveView(tab.id)}
                style={{ padding: '0.8rem 0.95rem', border: 'none', borderBottom: activeView === tab.id ? '2px solid #D4AF37' : '2px solid transparent', background: 'transparent', color: activeView === tab.id ? '#a16207' : '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900, whiteSpace: 'nowrap' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeView === 'search' ? <VibeSearch defaultCategory={category} /> : <CategoryCommercialTabs category={category} />}
        </div>
      </main>
    </div>
  );
}
