/**
 * Homepage — Server Component (SSR + ISR)
 *
 * Converted from 'use client' + useEffect to a server component so data is
 * fetched at render time on the server. Users see content immediately on
 * first byte instead of waiting for a client-side fetch waterfall.
 *
 * Caching: revalidate = 30 seconds (ISR). After the first request, Vercel
 * serves the cached HTML until it expires, then regenerates in the background.
 * Admin publishes trigger cache invalidation via the existing invalidateCache hook.
 */

import React from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MarketplaceHeader, { type NavLink } from '@/components/MarketplaceHeader';
import { getWebsiteTemplate } from '@/lib/cache';
import { optimizeImageUrlsDeep } from '@/lib/image-url';

// ISR: serve cached page for 120 seconds, then regenerate in background
// Significantly reduces Vercel Serverless Function GB-Hours and database queries
export const revalidate = 120;
// Remove force-dynamic so Next.js can cache the page output
export const dynamic = 'auto';

interface LayoutSection {
  id: string;
  type: string;
  zone?: string;
  props?: Record<string, unknown>;
}

interface SiteSettings {
  bg_color?: string;
  nav_bg_color?: string;
  logo_url?: string;
  logo_height?: number;
  site_name?: string;
  primary_color?: string;
  show_watermark?: boolean;
  carousel_interval?: number;
  footer_tagline?: string;
  footer_copyright?: string;
  header_brand_label?: string;
  header_brand_icon?: string;
  header_background_color?: string;
  header_text_color?: string;
  footer_background_color?: string;
  footer_text_color?: string;
  footer_muted_color?: string;
  show_header?: boolean;
  show_footer?: boolean;
  nav_links_text?: string;
  footer_links_text?: string;
  watermark_text?: string;
  search_headline?: string;
  search_subline?: string;
  services_title?: string;
  services_subtitle?: string;
}

interface FooterLink {
  group: string;
  label: string;
  href: string;
}

const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { group: 'EXPLORE', label: 'The Collection', href: '/search/vibe' },
  { group: 'EXPLORE', label: 'Heritage DNA', href: '#discovery' },
  { group: 'PARTNERS & GOVERNANCE', label: 'Vendor Portal', href: '/login' },
  { group: 'PARTNERS & GOVERNANCE', label: 'Become a Partner', href: '/signup' },
  { group: 'PARTNERS & GOVERNANCE', label: 'Heritage Investment', href: '/investment-opportunities' },
];

const DEFAULT_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home', icon: 'fa-house' },
  { href: '/siwa-stay', label: 'Siwa Stay', icon: 'fa-hotel' },
  { href: '/siwa-table', label: 'Siwa Table', icon: 'fa-utensils' },
  { href: '/siwa-go', label: 'Siwa Go', icon: 'fa-compass' },
  { href: '/siwa-retreats', label: 'Siwa Retreats', icon: 'fa-spa' },
  { href: '/siwa-products', label: 'Siwa Products', icon: 'fa-store' },
  { href: '/siwa-invest', label: 'Siwa Invest', icon: 'fa-chart-line' },
  { href: '/siwa-society', label: 'Siwa Society', icon: 'fa-people-group' },
];

function parseLinks(value: string | undefined, defaults: string): string[] {
  return (value === undefined ? defaults : value).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function isSafeLink(href: string) {
  return (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#') || /^https:\/\//i.test(href);
}

function getNavLinks(settings: SiteSettings | null): NavLink[] {
  const lines = parseLinks(settings?.nav_links_text, DEFAULT_NAV_LINKS.map(link => `${link.label} | ${link.href}`).join('\n'));
  return lines.flatMap(line => {
    const [label, ...hrefParts] = line.split('|').map(part => part.trim());
    const href = hrefParts.join('|');
    const defaultIcon = DEFAULT_NAV_LINKS.find(link => link.href === href)?.icon;
    return label && href && isSafeLink(href) ? [{ label, href, icon: defaultIcon }] : [];
  });
}

function getFooterLinks(settings: SiteSettings | null): FooterLink[] {
  const lines = parseLinks(settings?.footer_links_text, DEFAULT_FOOTER_LINKS.map(link => `${link.group} | ${link.label} | ${link.href}`).join('\n'));
  return lines.flatMap(line => {
    const [group, label, ...hrefParts] = line.split('|').map(part => part.trim());
    const href = hrefParts.join('|');
    return group && label && href && isSafeLink(href) ? [{ group, label, href }] : [];
  });
}

// ── Luminance helper — determines if a hex color is "light" ──────────────────
function isLight(hex: string | undefined): boolean {
  if (!hex) return true;
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140;
  } catch { return true; }
}

// ── Dynamically generate :root CSS overrides from settings ───────────────────
function buildThemeCSS(s: SiteSettings | null): string {
  const bg  = s?.bg_color    || '#f7f5f2';
  const pri = s?.primary_color || '#475569';
  const nav = s?.nav_bg_color  || '#ffffff';
  const light = isLight(bg);

  if (light) {
    return `:root {
      --bg: ${bg};
      --bg-alt: #ffffff;
      --card: #ffffff;
      --text: #0f172a;
      --text-muted: #475569;
      --text-light: #64748b;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --gold: ${pri};
      --gold-hover: ${pri}cc;
      --dark: ${nav};
      --shadow-sm: 0 1px 3px rgba(15,23,42,0.05);
      --shadow-md: 0 6px 20px rgba(15,23,42,0.06);
      --shadow-lg: 0 12px 30px rgba(15,23,42,0.08);
    }`;
  } else {
    return `:root {
      --bg: ${bg};
      --bg-alt: #ffffff;
      --card: rgba(255,255,255,0.96);
      --text: #0f172a;
      --text-muted: #475569;
      --text-light: #64748b;
      --border: rgba(15,23,42,0.08);
      --border-light: rgba(15,23,42,0.05);
      --gold: ${pri};
      --gold-hover: ${pri}cc;
      --dark: ${nav};
      --shadow-sm: 0 1px 3px rgba(15,23,42,0.06);
      --shadow-md: 0 6px 20px rgba(15,23,42,0.08);
      --shadow-lg: 0 12px 30px rgba(15,23,42,0.12);
    }`;
  }
}

/**
 * Server Component — data is fetched during SSR, no client waterfall.
 */
export default async function Home() {
  // Fetch from the cached layer (in-memory TTL cache + React cache deduplication)
  const config = await getWebsiteTemplate('main');

  // Render-time delivery optimisation: Cloudinary URLs pick up f_auto/q_auto/w_1600
  // here, so stored content and the admin editors keep the original URL.
  const template = optimizeImageUrlsDeep(config);

  const settings: SiteSettings | null = template?.site_settings || null;

  const rawSaved = [
    ...(template?.header_components || []),
    ...(template?.body_components || []),
    ...(template?.footer_components || []),
  ];

  const layout: LayoutSection[] = rawSaved;

  const themeCSS = buildThemeCSS(settings);
  const primary  = settings?.primary_color || '#FFB700';
  const footerLinks = getFooterLinks(settings);
  const footerGroups = Array.from(new Set(footerLinks.map(link => link.group)));
  const footerTagline = settings?.footer_tagline === undefined
    ? 'The Gold Standard of Siwa Oasis Experiences. Authenticity verified through architectural heritage.'
    : settings.footer_tagline;
  const footerCopyright = settings?.footer_copyright === undefined
    ? 'SIWIFY • ALL RIGHTS RESERVED.'
    : settings.footer_copyright;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Dynamic theme injection — overrides :root CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      {/* 🏛️ ELITE RESPONSIVE NAVIGATION */}
      {settings?.show_header !== false && (
        <MarketplaceHeader
          title={settings?.site_name || 'SiWiFy'}
          accentColor={primary}
          activePath="/"
          navLinks={getNavLinks(settings)}
          brandLabel={settings?.header_brand_label ?? 'SIWIFY'}
          brandIcon={settings?.header_brand_icon === undefined ? 'fa-sun' : settings.header_brand_icon}
          backgroundColor={settings?.header_background_color || 'rgba(8, 14, 10, 0.94)'}
          textColor={settings?.header_text_color || 'rgba(248, 250, 252, 0.88)'}
          brandImage={settings?.logo_url || ''}
          logoHeight={settings?.logo_height || 32}
        />
      )}

      {/* 🔮 DYNAMIC ORCHESTRATOR RENDERING — SSR data passed as props */}
      {layout.length > 0 ? (
        <DynamicHomepageRenderer layout={layout} settings={settings} pageId="main" />
      ) : null}

      {/* GLOBAL WATERMARK */}
      {settings?.show_watermark !== false && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, pointerEvents: 'none', opacity: 0.18, filter: 'grayscale(100%) brightness(100%)' }}>
          <div style={{ fontWeight: 900, letterSpacing: '5px', fontSize: '0.6rem', color: '#cbd5e1' }}>{settings?.watermark_text || 'SIWIFY'}</div>
        </div>
      )}

      {settings?.show_footer !== false && <footer style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', padding: '4rem 1.25rem 3rem', background: settings?.footer_background_color || '#ffffff', color: settings?.footer_text_color || '#0f172a' }}>
         <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
            <div>
               {settings?.logo_url ? (
                 <img src={settings.logo_url} alt={settings.site_name} style={{ height: `${(settings.logo_height || 40) * 1.2}px`, marginBottom: '1.25rem', objectFit: 'contain' }} />
               ) : (
                 <div style={{ fontWeight: 900, letterSpacing: '6px', fontSize: '1.1rem', color: settings?.footer_text_color || '#0f172a', marginBottom: '1.25rem' }}>{settings?.header_brand_label ?? 'SIWIFY'}</div>
               )}
               {footerTagline && <p style={{ color: settings?.footer_muted_color || '#475569', fontSize: '0.82rem', maxWidth: '300px', lineHeight: 1.8 }}>{footerTagline}</p>}
            </div>

            {footerGroups.map(group => <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
               <span style={{ fontSize: '0.64rem', fontWeight: 900, color: primary, letterSpacing: '3px', marginBottom: '0.35rem' }}>{group}</span>
               {footerLinks.filter(link => link.group === group).map(link => <Link key={`${link.label}:${link.href}`} href={link.href} style={{ color: settings?.footer_muted_color || '#334155', textDecoration: 'none', fontSize: '0.85rem' }}>{link.label}</Link>)}
            </div>)}
         </div>

         <div style={{ marginTop: '3.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(15, 23, 42, 0.08)', textAlign: 'center', opacity: 0.8, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '2px', color: '#64748b' }}>
            © {new Date().getFullYear()} {footerCopyright}
         </div>
      </footer>}
    </div>
  );
}
