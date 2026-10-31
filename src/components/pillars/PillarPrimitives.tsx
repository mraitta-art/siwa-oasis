'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Chip } from '@heroui/react';

/**
 * HeroUI building blocks shared by the pillar pages and the homepage gateway.
 *
 * They take plain serializable data, so a Server Component can fetch on the
 * page and hand the result down without crossing the client boundary with
 * functions or class instances. Both are direction-agnostic: the page owns
 * `dir`, and the grids use logical properties so Arabic mirrors correctly.
 */

export interface PillarCardItem {
  key: string;
  title: string;
  /** Second script of a bilingual name, or a short qualifier. */
  subtitle?: string | null;
  icon: string;
  accent: string;
  /** Null renders a disabled "coming soon" card — a dark door has no URL. */
  href: string | null;
  actionLabel: string;
}

export function PillarCardGrid({
  items,
  minWidth = 230,
  style,
}: {
  items: PillarCardItem[];
  minWidth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        gap: '0.9rem',
        ...style,
      }}
    >
      {items.map(item => {
        const body = (
          <Card.Root
            variant="secondary"
            className="h-full"
            style={{
              borderStartStartRadius: 14,
              border: '1px solid var(--border)',
              borderInlineStart: `3px solid ${item.accent}`,
              background: 'var(--card)',
              boxShadow: 'var(--shadow-sm)',
              opacity: item.href ? 1 : 0.72,
              height: '100%',
            }}
          >
            <Card.Content style={{ padding: '1.15rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className={`fas ${item.icon}`} aria-hidden="true" style={{ color: item.accent }} />
                <span style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text)' }}>{item.title}</span>
              </span>
              {item.subtitle && (
                <span style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 700 }}>{item.subtitle}</span>
              )}
              <span
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: item.href ? item.accent : 'var(--text-light)',
                }}
              >
                {item.actionLabel}
              </span>
            </Card.Content>
          </Card.Root>
        );

        return item.href ? (
          <Link key={item.key} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            {body}
          </Link>
        ) : (
          <div key={item.key} aria-disabled="true">
            {body}
          </div>
        );
      })}
    </div>
  );
}

export interface PillarChipItem {
  key: string;
  label: string;
  icon?: string | null;
  count?: number;
  href: string;
}

export function PillarChipRow({ items, accent = '#D4AF37' }: { items: PillarChipItem[]; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {items.map(c => (
        <Link key={c.key} href={c.href} style={{ textDecoration: 'none' }}>
          <Chip.Root variant="soft" color="default" style={{ cursor: 'pointer' }}>
            <Chip.Label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}>
              {c.icon && <i className={`fas ${c.icon}`} aria-hidden="true" style={{ color: accent }} />}
              {c.label}
              {typeof c.count === 'number' && (
                <span style={{ color: 'var(--text-light)', fontWeight: 700, fontSize: '0.72rem' }}>{c.count}</span>
              )}
            </Chip.Label>
          </Chip.Root>
        </Link>
      ))}
    </div>
  );
}
