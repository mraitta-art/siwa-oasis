'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import { MinisiteChromeProvider, MinisiteLangProvider, MinisiteLangToggle, useHasMinisiteLang, useMinisiteLang } from '@/components/minisite/MinisiteLang';
import { HeroLink } from '@/components/ui/HeroPrimitives';
import { label, pick, type MinisiteLang } from '@/lib/minisite-i18n';
import { MINISITE_VERTICAL_THEMES, type CtaKey, type MinisiteVertical } from '@/lib/minisite-verticals';
import { normalizePhoneValue } from '@/lib/egypt-phone';
import { PILLARS, pillarLabel, pillarUrl } from '@/lib/pillars';

/**
 * MinisiteShell — the only chrome a public minisite wears.
 *
 * Two surfaces render one business today: the flat landing page (`/[slug]`,
 * `MinisiteBuilderRenderer`) and the sectional page (`/[slug]/[section]`,
 * `VanityBusinessClient`). Each used to build its own header, tab row, CTA
 * cluster and footer, so the same venue looked like two different products and
 * an English literal could appear on the flat page while its tabs were Arabic.
 * Both now hand their body to this shell, which owns the chrome once: the design
 * cannot diverge because there is only one place that draws it, and the only
 * per-vertical difference left is the accent coming from MINISITE_VERTICAL_THEMES.
 *
 * Three rules this file keeps:
 * - The section tabs are real `<a href>` links carrying HeroUI's `tabs__tab`
 *   markup — the same markup the pillar band emits — so every section of every
 *   minisite stays server-rendered and crawlable.
 * - The language is the provider's, never a local copy. This component renders
 *   `MinisiteLangProvider`, so the chrome and everything handed in as `children`
 *   or `hero` read one state and one stored key.
 * - Geometry uses logical properties (`marginInline*`, `borderInline*`, `inset
 *   inline`), never `left`/`right`, so flipping `dir` mirrors the layout instead
 *   of breaking it.
 */

export interface MinisiteShellBrand {
  name: string;
  /** Arabic brand name; `pick()` falls back to `name` when it is empty. */
  nameAr?: string | null;
  /** Typology badge — "Boutique camp", "Compound", … */
  typeLabel?: string | null;
  typeLabelAr?: string | null;
  logo?: string | null;
  /** Cover band image. Only passed when the page has no hero block of its own. */
  cover?: string | null;
  isTrusted?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  /**
   * Public specialization chip: what kind of offer this business represents.
   * Renders next to the brand name as the first thing a visitor reads after
   * the identity, so "For Sale", "Monthly Rent", and "Short Stay" are visible
   * even before the first scroll. Absent means no chip — the minisite shows
   * only its typology badge.
   */
  specialization?: {
    ar: string;
    en: string;
    /** The accent the chip uses. Falls back to the vertical's accent. */
    accent?: string;
  } | null;
}

export interface MinisiteShellSection {
  id: string;
  label: string;
  labelAr?: string | null;
  /** Absolute, locale-free href: `/{slug}/{section}`. */
  href: string;
  /** Gated by the membership tier: shown, locked, never a dead link. */
  locked?: boolean;
  icon?: string | null;
}

export interface MinisiteShellContact {
  phone?: string | null;
  whatsapp?: string | null;
  /** Vendor's pre-filled WhatsApp wording, kept when the shell builds a plain chat link. */
  whatsappMessage?: string | null;
}

export interface MinisiteShellPlatform {
  name?: string;
  logo?: string | null;
  /** Arabic owns the bare path, so an English minisite goes home under /en. */
  homeHref?: string;
}

export interface MinisiteShellProps {
  vertical: MinisiteVertical;
  brand: MinisiteShellBrand;
  /** Section tabs. Empty renders the chrome without a tab band (a flat one-pager). */
  sections?: MinisiteShellSection[];
  /** Currently open section id; `null` means the overview (flat landing) is showing. */
  activeSectionId?: string | null;
  /** The flat landing page address, offered as the first "overview" tab. */
  overviewHref?: string;
  contact?: MinisiteShellContact;
  /** Server seed from `pathLocale()`: `/en/<slug>` paints English HTML first. */
  initialLang?: MinisiteLang;
  showPlatformNav?: boolean;
  showPlatformFooter?: boolean;
  platform?: MinisiteShellPlatform;
  /** Page-opening hero — the surface's own, rendered above the sticky chrome. */
  hero?: React.ReactNode;
  /** Share affordance for surfaces that already implement it (the sectional body). */
  onShare?: () => void;
  children: React.ReactNode;
}

const OVERVIEW_ID = '__overview';

/** The vertical's header CTA cluster, resolved for the language on screen. */
function buildCtas(
  keys: CtaKey[],
  ar: boolean,
  opts: {
    digits: string;
    tel: string;
    whatsappMessage?: string | null;
    businessName: string;
    labels: Record<string, string>;
  }
) {
  const locale = ar ? 'ar' : 'en';
  const waLink = (intent: string) =>
    `https://wa.me/${opts.digits}${intent ? `?text=${encodeURIComponent(intent)}` : ''}`;

  return keys
    .map(key => {
      // The vertical theme owns the wording; the dictionary only backstops the two
      // keys it also defines, so a CTA label can never come out undefined.
      const text =
        opts.labels[key] || (key === 'whatsapp_book' ? label('whatsapp', ar) : key === 'call' ? label('call', ar) : key);
      if (key === 'call') {
        if (!opts.tel) return null;
        return { key, label: text, href: `tel:${opts.tel}`, icon: 'fas fa-phone-alt', variant: 'outline' as const, external: false };
      }
      if (key === 'whatsapp_book') {
        if (!opts.digits) return null;
        return {
          key,
          label: text,
          href: waLink(opts.whatsappMessage || ''),
          icon: 'fab fa-whatsapp',
          variant: 'primary' as const,
          external: true,
        };
      }
      if (key === 'plan_trip') {
        return { key, label: text, href: pillarUrl('plan', locale), icon: 'fas fa-route', variant: 'secondary' as const, external: false };
      }
      if (key === 'viewing') {
        if (!opts.digits) return null;
        const intent = ar
          ? `أرغب في حجز معاينة لـ ${opts.businessName}`
          : `I'd like to book a viewing of ${opts.businessName}`;
        return { key, label: text, href: waLink(intent), icon: 'fas fa-building', variant: 'primary' as const, external: true };
      }
      if (key === 'developer') {
        if (!opts.digits) return null;
        const intent = ar
          ? `أرغب في التحدث إلى المطوّر بشأن ${opts.businessName}`
          : `I'd like to talk to the developer about ${opts.businessName}`;
        return { key, label: text, href: waLink(intent), icon: 'fas fa-user-tie', variant: 'outline' as const, external: true };
      }
      return null;
    })
    .filter(Boolean) as Array<{
      key: CtaKey;
      label: string;
      href: string;
      icon: string;
      variant: 'primary' | 'secondary' | 'outline';
      external: boolean;
    }>;
}

export default function MinisiteShell(props: MinisiteShellProps) {
  const chrome = (
    <MinisiteChromeProvider>
      <MinisiteShellChrome {...props} />
    </MinisiteChromeProvider>
  );
  // The route that owns the language already wrapped this surface; only stand
  // up a provider when there is none, so one minisite never has two states.
  if (useHasMinisiteLang()) return chrome;
  return <MinisiteLangProvider initialLang={props.initialLang ?? 'ar'}>{chrome}</MinisiteLangProvider>;
}

function MinisiteShellChrome({
  vertical,
  brand,
  sections = [],
  activeSectionId = null,
  overviewHref,
  contact,
  showPlatformNav = true,
  showPlatformFooter = true,
  platform,
  hero,
  onShare,
  children,
}: MinisiteShellProps) {
  const { ar, lang } = useMinisiteLang();
  const theme = MINISITE_VERTICAL_THEMES[vertical];
  const accent = theme.accent;
  const platformName = platform?.name || 'SiWiFy';
  const homeHref = platform?.homeHref || (ar ? '/' : '/en');

  // Every name resolves Arabic-first with the English form behind it, so a
  // half-translated minisite still reads complete.
  const displayName = pick(ar, brand.nameAr, brand.name) || platformName;
  const displayType = pick(ar, brand.typeLabelAr, brand.typeLabel);

  const digits = normalizePhoneValue(contact?.whatsapp || contact?.phone || '');
  const tel = digits ? `+${digits}` : '';
  const ctas = buildCtas(theme.ctas, ar, {
    digits,
    tel,
    whatsappMessage: contact?.whatsappMessage,
    businessName: displayName,
    labels: theme.labels[ar ? 'ar' : 'en'],
  });

  const tabs: Array<MinisiteShellSection & { id: string }> = overviewHref
    ? [{ id: OVERVIEW_ID, label: label('overview', ar), href: overviewHref }, ...sections]
    : sections;
  const showTabs = tabs.length > 1;

  const barStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(255,255,255,0.94)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Platform strip — the way back to the marketplace. Scrolls away; the
          brand bar below it is what stays pinned. */}
      {showPlatformNav && (
        <div
          style={{
            background: '#0F172A',
            color: 'rgba(248,250,252,0.88)',
            padding: '0.5rem clamp(1rem, 3vw, 2rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '1px',
          }}
        >
          <Link
            href={homeHref}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#F8FAFC', textDecoration: 'none' }}
          >
            {platform?.logo ? (
              <img src={platform.logo} alt={platformName} style={{ height: 18, objectFit: 'contain' }} />
            ) : (
              <i className="fas fa-sun" aria-hidden="true" style={{ color: accent }} />
            )}
            <span>{platformName.toUpperCase()}</span>
          </Link>
          <nav aria-label={ar ? 'أقسام المنصة' : 'Platform sections'} style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            {PILLARS.map(p => (
              <Link
                key={p.slug}
                href={pillarUrl(p.slug, lang)}
                style={{ color: 'rgba(248,250,252,0.75)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {pillarLabel(p, lang)}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {hero}

      {/* Brand bar + section tabs: the sticky chrome a visitor navigates by. */}
      <header style={barStyle}>
        <div
          className="minisite-nav-container"
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '0.7rem clamp(1rem, 3vw, 2rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            {brand.logo && (
              <img
                src={brand.logo}
                alt=""
                style={{
                  height: 30,
                  width: 30,
                  objectFit: 'contain',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 'min(46vw, 260px)',
                }}
              >
                {displayName}
              </div>
              {displayType && (
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-light)' }}>
                  {displayType}
                </div>
              )}
            </div>

            {brand.isTrusted && (
              <Chip.Root variant="soft" style={{ flexShrink: 0, background: theme.accentSoft, border: `1px solid ${accent}` }}>
                <Chip.Label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: accent, fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                  <i className="fas fa-check-circle" aria-hidden="true" />
                  {label('verified', ar)}
                </Chip.Label>
              </Chip.Root>
            )}

            {brand.specialization && (() => {
              const s = brand.specialization;
              const text = pick(ar, s.ar, s.en) || s.en;
              const chipAccent = s.accent || accent;
              if (!text) return null;
              return (
                <Chip.Root
                  variant="primary"
                  style={{
                    flexShrink: 0,
                    background: `${chipAccent}22`,
                    border: `1px solid ${chipAccent}`,
                  }}
                >
                  <Chip.Label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: chipAccent,
                      fontSize: '0.55rem',
                      fontWeight: 900,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    <i className="fas fa-tag" aria-hidden="true" />
                    {text}
                  </Chip.Label>
                </Chip.Root>
              );
            })()}

            {typeof brand.rating === 'number' && brand.rating > 0 && (
              <Chip.Root variant="soft" style={{ flexShrink: 0 }}>
                <Chip.Label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', fontWeight: 900, color: '#B45309' }}>
                  <i className="fas fa-star" aria-hidden="true" style={{ color: '#F59E0B' }} />
                  {brand.rating.toFixed(1)}
                  {typeof brand.reviewCount === 'number' && brand.reviewCount > 0 && (
                    <span style={{ color: 'var(--text-light)', fontWeight: 700 }}>({brand.reviewCount})</span>
                  )}
                </Chip.Label>
              </Chip.Root>
            )}
          </div>

          {/* Actions: the vertical's CTA cluster, then the language switch. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="minisite-shell-ctas" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {ctas.map(cta => (
                <HeroLink
                  key={cta.key}
                  href={cta.href}
                  label={cta.label}
                  icon={cta.icon}
                  variant={cta.variant}
                  size="sm"
                  accent={accent}
                  external={cta.external}
                  title={cta.label}
                  style={{ borderRadius: 999 }}
                />
              ))}
            </div>

            {onShare && (
              <span title={label('share', ar)} style={{ display: 'inline-flex' }}>
                <Button variant="ghost" size="sm" isIconOnly aria-label={label('share', ar)} onPress={onShare}>
                  <i className="fas fa-share-alt" aria-hidden="true" />
                </Button>
              </span>
            )}

            <MinisiteLangToggle accent={accent} size="sm" />

            <Link
              href={homeHref}
              className="minisite-mobile-header-btns"
              style={{ color: 'var(--text-light)', padding: '0.4rem', fontSize: '1rem', textDecoration: 'none', display: 'none' }}
              aria-label={ar ? 'الرئيسية' : 'Home'}
            >
              <i className="fas fa-house" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {showTabs && (
          <nav
            aria-label={ar ? 'أقسام الصفحة' : 'Page sections'}
            className="tabs tabs--secondary"
            data-orientation="horizontal"
            style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)' }}
          >
            <div className="tabs__list-container">
              <div className="tabs__list minisite-nav-tabs" role="tablist" style={{ display: 'flex', gap: '0.25rem' }}>
                {tabs.map(tab => {
                  const active = tab.id === OVERVIEW_ID ? !activeSectionId : activeSectionId === tab.id;
                  const text = tab.id === OVERVIEW_ID ? tab.label : pick(ar, tab.labelAr, tab.label);
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      role="tab"
                      aria-selected={active}
                      data-selected={active ? 'true' : undefined}
                      className="tabs__tab"
                      title={tab.locked ? label('locked', ar) : undefined}
                      style={{
                        width: 'auto',
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textDecoration: 'none',
                        fontWeight: active ? 900 : 700,
                        fontSize: '0.72rem',
                        letterSpacing: '0.4px',
                        color: active ? accent : 'var(--text-light)',
                        borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
                      }}
                    >
                      {tab.icon && <i className={`fas ${tab.icon}`} aria-hidden="true" />}
                      {text}
                      {tab.locked && <i className="fas fa-lock" aria-hidden="true" style={{ fontSize: '0.58rem', color: '#F59E0B' }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        )}
      </header>

      {brand.cover && (
        <div
          aria-hidden="true"
          style={{
            height: 'clamp(90px, 18vh, 180px)',
            backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.72), ${accent}66), url(${brand.cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      <main>{children}</main>

      {showPlatformFooter && (
        <footer style={{ borderTop: '1px solid var(--border)', background: '#fff', padding: '2.5rem clamp(1rem, 3vw, 2rem)', color: 'var(--text-light)' }}>
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem 2rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 900, letterSpacing: '2px', fontSize: '0.7rem', color: accent }}>{platformName.toUpperCase()}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem' }}>
              {PILLARS.map(p => (
                <Link key={p.slug} href={pillarUrl(p.slug, lang)} style={{ color: '#475569', textDecoration: 'none' }}>
                  {pillarLabel(p, lang)}
                </Link>
              ))}
              <Link href={ar ? '/be-a-partner' : '/en/be-a-partner'} style={{ color: '#475569', textDecoration: 'none' }}>
                {label('list_your_business', ar)}
              </Link>
            </div>
          </div>
          <div
            style={{
              maxWidth: 1240,
              margin: '1.5rem auto 0',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              color: '#64748b',
            }}
          >
            © {new Date().getFullYear()} {platformName.toUpperCase()} • {label('all_rights', ar).toUpperCase()}
          </div>
        </footer>
      )}
    </div>
  );
}
