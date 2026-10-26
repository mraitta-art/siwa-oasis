'use client';

import React from 'react';
import Link from 'next/link';

export interface SectionTabItem {
  id: string;
  label: string;
  /** Arabic label carried from resolveSectionNav; the page swaps it in for /ar. */
  labelAr?: string;
  href: string;
}

interface Props {
  slug: string;
  items: SectionTabItem[];
  activeId?: string;
  lang?: 'en' | 'ar';
}

const LABELS = {
  en: { overview: 'Overview' },
  ar: { overview: 'نظرة عامة' },
};

/**
 * Section navigator for a public minisite. Each tab links to /{slug}/{section},
 * where VanityBusinessClient renders the full features of that case. Renders
 * nothing when the minisite has no populated sections (stays a flat page).
 */
export default function MinisiteSectionTabs({ slug, items, activeId, lang = 'en' }: Props) {
  if (!items || items.length === 0) return null;
  const overview = (LABELS[lang] || LABELS.en).overview;
  const isActive = (id: string) => (activeId ? activeId === id : false);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        padding: '0.6rem 0.9rem',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'saturate(180%) blur(8px)',
        borderBottom: '1px solid #E2E8F0',
        whiteSpace: 'nowrap',
      }}
    >
      <Link
        href={`/${slug}`}
        style={{
          flex: '0 0 auto',
          padding: '0.45rem 0.9rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 900,
          textDecoration: 'none',
          background: !activeId ? '#0F172A' : 'transparent',
          color: !activeId ? '#FFFFFF' : '#334155',
          border: '1px solid ' + (!activeId ? '#0F172A' : '#E2E8F0'),
        }}
      >
        🏠 {overview}
      </Link>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          style={{
            flex: '0 0 auto',
            padding: '0.45rem 0.9rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            textDecoration: 'none',
            background: isActive(item.id) ? '#D4AF37' : '#F8FAFC',
            color: isActive(item.id) ? '#0F172A' : '#334155',
            border: '1px solid ' + (isActive(item.id) ? '#D4AF37' : '#E2E8F0'),
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
