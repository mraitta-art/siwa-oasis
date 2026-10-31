import React from 'react';
import Link from 'next/link';
import MarketplaceHeader, { type NavLink } from '@/components/MarketplaceHeader';
import { PILLARS, pillarUrl, type PillarSlug } from '@/lib/pillars';
import type { SiteLocale } from '@/lib/site-locale';

/**
 * The shared chrome for the pillar pages (`/tourism`, `/properties`,
 * `/transportation`, `/plan`): the same marketplace header the home page wears,
 * a localised hero band that names the intent with a tab bar across the
 * sections, and the global footer.
 *
 * It is a Server Component — only the header it renders is a client island — so
 * a page passes its server-fetched body straight in as `children` and keeps full
 * SSR/SEO. Arabic is `dir=rtl` from the root layout; this mirrors the reading
 * direction and swaps every string through the `ar` flag the caller resolved.
 */

/** Header links for a pillar page: home, the four pillars, all categories. */
export function pillarNavLinks(locale: SiteLocale): NavLink[] {
  const ar = locale === 'ar';
  const icons: Record<PillarSlug, string> = {
    tourism: 'fa-umbrella-beach',
    properties: 'fa-building-universal-access',
    transportation: 'fa-truck-fast',
    plan: 'fa-route',
  };
  return [
    { href: ar ? '/' : '/en', label: ar ? 'الرئيسية' : 'Home', icon: 'fa-house' },
    ...PILLARS.map(p => ({ href: pillarUrl(p.slug, locale), label: ar ? p.label.ar : p.label.en, icon: icons[p.slug] })),
    { href: ar ? '/categories' : '/en/categories', label: ar ? 'التصنيفات' : 'Categories', icon: 'fa-layer-group' },
  ];
}

export default function PillarChrome({
  locale,
  activePath,
  eyebrow,
  title,
  subtitle,
  accent,
  icon,
  children,
}: {
  locale: SiteLocale;
  activePath: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: string;
  children: React.ReactNode;
}) {
  const ar = locale === 'ar';

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <MarketplaceHeader
        title="SiWiFy"
        accentColor={accent}
        activePath={activePath}
        navLinks={pillarNavLinks(locale)}
        brandLabel="SIWIFY"
        brandIcon="fa-sun"
        backgroundColor="rgba(8, 14, 10, 0.94)"
        textColor="rgba(248, 250, 252, 0.88)"
      />

      {/* Hero band — names the intent, links the sibling pillars */}
      <section
        style={{
          background: `linear-gradient(135deg, #0F172A 0%, #1B2436 55%, ${accent}33 100%)`,
          color: '#FFFFFF',
          borderBottom: `1px solid ${accent}44`,
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(3rem, 7vw, 4.5rem) 1.5rem clamp(2.5rem, 6vw, 3.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', letterSpacing: '4px', fontWeight: 900, color: accent }}>
            <i className={`fas ${icon}`} aria-hidden="true" />
            <span>{eyebrow}</span>
          </div>
          <h1 style={{ margin: '0.7rem 0 0.4rem', fontSize: 'clamp(2rem, 5.5vw, 3.4rem)', fontWeight: 900, lineHeight: 1.12 }}>
            {title}
          </h1>
          <p style={{ margin: 0, maxWidth: 700, fontSize: '1.02rem', lineHeight: 1.8, opacity: 0.82 }}>
            {subtitle}
          </p>

          {/* Pillar tab bar — the section switcher (Tourism · Properties ·
              Transportation · Plan). Linked HeroUI tabs (`tabs__tab` markup
              with data-selected), rendered server-side so every pillar stays a
              real crawlable <a href> in the SSR payload. */}
          <nav
            aria-label={ar ? 'أقسام المنصة' : 'Platform sections'}
            dir={ar ? 'rtl' : 'ltr'}
            className="tabs tabs--secondary"
            data-orientation="horizontal"
            style={{ display: 'flex', marginTop: '1.7rem' }}
          >
            <div className="tabs__list-container">
              <div className="tabs__list" role="tablist" style={{ display: 'flex', gap: '0.25rem' }}>
                {PILLARS.map(p => {
                  const active = pillarUrl(p.slug, locale) === activePath;
                  return (
                    <Link
                      key={p.slug}
                      href={pillarUrl(p.slug, locale)}
                      role="tab"
                      aria-selected={active}
                      data-selected={active ? 'true' : undefined}
                      className="tabs__tab"
                      style={{
                        width: 'auto',
                        color: active ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
                        fontWeight: active ? 900 : 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        borderBottom: active ? `2px solid ${p.accent}` : '2px solid transparent',
                      }}
                    >
                      <i className={`fas ${p.icon}`} aria-hidden="true" style={{ color: active ? p.accent : undefined }} />
                      {ar ? p.label.ar : p.label.en}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </section>

      {/* Page body, fetched and rendered by the server route */}
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(2rem, 5vw, 3.5rem) 1.5rem' }}>{children}</main>

      <footer style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', padding: '3rem 1.5rem 2.5rem', background: '#ffffff', color: '#0f172a' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1rem 2rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, letterSpacing: '2px', fontSize: '0.7rem', color: accent }}>SIWIFY</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.82rem' }}>
            {PILLARS.map(p => (
              <Link key={p.slug} href={pillarUrl(p.slug, locale)} className="link link--primary" style={{ color: '#475569', textDecoration: 'none' }}>
                {ar ? p.label.ar : p.label.en}
              </Link>
            ))}
            <Link href={ar ? '/be-a-partner' : '/en/be-a-partner'} style={{ color: '#475569', textDecoration: 'none' }}>
              {ar ? 'أضف نشاطك' : 'List your business'}
            </Link>
          </div>
        </div>
        <div style={{ maxWidth: 1120, margin: '2rem auto 0', paddingTop: '1.25rem', borderTop: '1px solid rgba(15, 23, 42, 0.08)', textAlign: ar ? 'right' : 'left', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1.5px', color: '#64748b' }}>
          © {new Date().getFullYear()} SIWIFY • {ar ? 'كل الحقوق محفوظة.' : 'ALL RIGHTS RESERVED.'}
        </div>
      </footer>
    </div>
  );
}
