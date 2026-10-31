'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, Chip } from '@heroui/react';

/**
 * HeroPrimitives — the shared HeroUI building blocks for the platform's public
 * surfaces: pillar pages, the homepage gateway and every minisite.
 *
 * They exist so "the same design" is literal rather than aspirational: a
 * minisite and a pillar page render the same card, the same chip and the same
 * button, and only the accent hue differs.
 *
 * Two forms of each interactive primitive, because they have different jobs:
 * - `HeroCardGrid` / `HeroChipRow` / `HeroLink` build real `<a href>` elements
 *   carrying HeroUI's class markup. A Server Component can render them, a
 *   crawler can follow them, and the RSC payload stays serializable.
 * - `HeroButton` is the HeroUI component itself, for actions that are click
 *   handlers rather than navigation. HeroUI's Button cannot render an anchor, so
 *   it is never used where a link is needed.
 *
 * Everything here takes plain serializable data and writes direction-agnostic
 * CSS (logical properties), so Arabic mirrors correctly when the minisite
 * language flips.
 */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** HeroUI button variants this codebase uses for chrome and CTAs. */
export type HeroButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
export type HeroButtonSize = 'sm' | 'md' | 'lg';

/** A solid primary icon inherits the white ink; the rest carry the accent. */
const iconInk = (variant: HeroButtonVariant, accent?: string) => (variant === 'primary' ? undefined : accent);

export interface HeroLinkProps {
  href: string;
  label: string;
  icon?: string | null;
  variant?: HeroButtonVariant;
  size?: HeroButtonSize;
  /** Paints the accent into a link-styled action; the vertical's hue, not a per-page choice. */
  accent?: string;
  external?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  ariaLabel?: string;
}

/** A link that looks like a HeroUI button. Used for every navigational CTA. */
export function HeroLink({
  href,
  label,
  icon,
  variant = 'primary',
  size = 'md',
  accent,
  external,
  fullWidth,
  className,
  style,
  title,
  ariaLabel,
}: HeroLinkProps) {
  const classes = cx(
    'button',
    `button--${variant}`,
    size !== 'md' && `button--${size}`,
    fullWidth && 'button--full-width',
    className
  );
  // An accent-painted primary keeps the vertical's hue; every other variant
  // inherits the theme so the chrome cannot drift per page.
  const painted: React.CSSProperties =
    variant === 'primary' && accent
      ? { background: accent, borderColor: accent, color: '#ffffff' }
      : variant === 'outline' && accent
        ? { borderColor: accent, color: accent }
        : {};
  const inner = (
    <>
      {icon && (
        <i
          className={icon.startsWith('fab') || icon.startsWith('fas') ? icon : `fas ${icon}`}
          aria-hidden="true"
          style={{ color: iconInk(variant, accent) }}
        />
      )}
      <span>{label}</span>
    </>
  );
  const shared = { className: classes, style: { ...painted, ...style }, title, 'aria-label': ariaLabel } as const;

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...shared}>
      {inner}
    </a>
  ) : (
    <Link href={href} {...shared}>
      {inner}
    </Link>
  );
}

export interface HeroButtonProps {
  onPress: () => void;
  label: string;
  icon?: string | null;
  variant?: HeroButtonVariant;
  size?: HeroButtonSize;
  accent?: string;
  isDisabled?: boolean;
  isIconOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/** A real action (toggle, copy, open) rather than a navigation. */
export function HeroButton({
  onPress,
  label,
  icon,
  variant = 'secondary',
  size = 'md',
  accent,
  isDisabled,
  isIconOnly,
  fullWidth,
  className,
  style,
  title,
}: HeroButtonProps) {
  // HeroUI's Button takes no native `title`, and spreading unknown props into a
  // data-react-aria component drops them. When a tooltip is asked for, the
  // button rides in a plain span that carries it.
  const button = (
    <Button
      variant={variant}
      size={size}
      isDisabled={isDisabled}
      isIconOnly={isIconOnly}
      fullWidth={fullWidth}
      className={className}
      style={style}
      aria-label={isIconOnly ? label : undefined}
      onPress={onPress}
    >
      {icon && (
        <i
          className={icon.startsWith('fab') || icon.startsWith('fas') ? icon : `fas ${icon}`}
          aria-hidden="true"
          style={{ color: accent }}
        />
      )}
      <span>{label}</span>
    </Button>
  );
  if (!title) return button;
  return (
    <span title={title} style={{ display: fullWidth ? 'block' : 'inline-block' }}>
      {button}
    </span>
  );
}

export interface HeroCardItem {
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

/**
 * The card grid every surface uses for a list of things: categories, markets,
 * destinations, packages, units. A null href keeps the card visible but inert,
 * so a section that exists without a page yet still reads as intentional.
 */
export function HeroCardGrid({
  items,
  minWidth = 230,
  style,
}: {
  items: HeroCardItem[];
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

export interface HeroChipItem {
  key: string;
  label: string;
  icon?: string | null;
  count?: number;
  /** Null renders the chip as an inert "coming soon" pill. */
  href: string | null;
}

/** The pill row used for categories, facets and quick jumps. */
export function HeroChipRow({ items, accent = '#D4AF37' }: { items: HeroChipItem[]; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {items.map(c => {
        const chip = (
          <Chip.Root
            variant="soft"
            color="default"
            style={{ cursor: c.href ? 'pointer' : 'default', opacity: c.href ? 1 : 0.7 }}
          >
            <Chip.Label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}>
              {c.icon && <i className={`fas ${c.icon}`} aria-hidden="true" style={{ color: accent }} />}
              {c.label}
              {typeof c.count === 'number' && (
                <span style={{ color: 'var(--text-light)', fontWeight: 700, fontSize: '0.72rem' }}>{c.count}</span>
              )}
            </Chip.Label>
          </Chip.Root>
        );
        return c.href ? (
          <Link key={c.key} href={c.href} style={{ textDecoration: 'none' }}>
            {chip}
          </Link>
        ) : (
          <span key={c.key} aria-disabled="true">
            {chip}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The heading block that opens a section: accent rule, icon, title, subtitle.
 * Both minisite surfaces use it so a section reads the same on the flat landing
 * page and inside a section tab.
 */
export function HeroSectionHeading({
  title,
  subtitle,
  icon,
  accent,
  align = 'start',
  as: Tag = 'h2',
  style,
}: {
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  accent: string;
  align?: 'start' | 'center';
  as?: 'h2' | 'h3';
  style?: React.CSSProperties;
}) {
  return (
    <div
      dir="inherit"
      style={{
        textAlign: align,
        marginInline: align === 'center' ? 'auto' : undefined,
        marginBottom: '1.4rem',
        ...style,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.68rem',
          fontWeight: 900,
          letterSpacing: '3px',
          color: accent,
        }}
      >
        {icon && <i className={`fas ${icon}`} aria-hidden="true" />}
      </span>
      <Tag
        style={{
          margin: icon ? '0.3rem 0 0' : 0,
          fontSize: 'clamp(1.4rem, 3vw, 2.1rem)',
          fontWeight: 900,
          lineHeight: 1.2,
          color: 'var(--text)',
        }}
      >
        {title}
      </Tag>
      {subtitle && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-light)' }}>{subtitle}</p>
      )}
    </div>
  );
}
