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
import { getWebsiteTemplate } from '@/lib/cache';

// ISR: serve cached page for 30 seconds, then regenerate in background
export const revalidate = 30;
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
  search_headline?: string;
  search_subline?: string;
  services_title?: string;
  services_subtitle?: string;
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
  const bg  = s?.bg_color    || '#FAF6F0';
  const pri = s?.primary_color || '#FFB700';
  const nav = s?.nav_bg_color  || '#556B2F';
  const light = isLight(bg);

  if (light) {
    return `:root {
      --bg: ${bg};
      --bg-alt: ${bg}ee;
      --card: #ffffff;
      --text: #202D15;
      --text-muted: #5A4A3A;
      --text-light: #8E7B6C;
      --border: #E8DFD3;
      --border-light: #F4ECE0;
      --gold: ${pri};
      --gold-hover: ${pri}cc;
      --dark: ${nav};
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
      --shadow-lg: 0 10px 25px rgba(0,0,0,0.10);
    }`;
  } else {
    return `:root {
      --bg: ${bg};
      --bg-alt: ${bg}dd;
      --card: rgba(255,255,255,0.04);
      --text: #f8fafc;
      --text-muted: #cbd5e1;
      --text-light: #94a3b8;
      --border: rgba(255,255,255,0.08);
      --border-light: rgba(255,255,255,0.05);
      --gold: ${pri};
      --gold-hover: ${pri}cc;
      --dark: ${nav};
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
      --shadow-lg: 0 10px 25px rgba(0,0,0,0.5);
    }`;
  }
}

function dedupeSections(sections: LayoutSection[]): LayoutSection[] {
  const seen = new Set<string>();
  return sections.filter(section => {
    const props = section.props || {};
    const sortedProps = Object.keys(props).sort().reduce((acc, key) => {
      acc[key] = (props as any)[key];
      return acc;
    }, {} as Record<string, unknown>);
    const key = `${section.type}:${JSON.stringify(sortedProps)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Server Component — data is fetched during SSR, no client waterfall.
 */
export default async function Home() {
  // Fetch from the cached layer (in-memory TTL cache + React cache deduplication)
  const config = await getWebsiteTemplate('main');

  const settings: SiteSettings | null = config?.site_settings || null;

  const hasSavedLayout = Boolean(config) &&
    ['header_components', 'body_components', 'footer_components'].some(
      key => Array.isArray((config as any)?.[key])
    );

  const layout: LayoutSection[] = hasSavedLayout
    ? dedupeSections([
        ...(config?.header_components || []),
        ...(config?.body_components || []),
        ...(config?.footer_components || []),
      ])
    : [];

  const themeCSS = buildThemeCSS(settings);
  const primary  = settings?.primary_color || '#FFB700';
  const navBg    = settings?.nav_bg_color  || '#556B2F';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Dynamic theme injection — overrides :root CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      {/* 🏛️ ELITE NAVIGATION */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 4rem)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: `linear-gradient(to bottom, ${navBg}dd, transparent)`
      }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 900, fontSize: 'clamp(1rem, 3vw, 1.25rem)', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.site_name || 'SiWiFy.com'} style={{ height: `${settings.logo_height || 40}px`, objectFit: 'contain' }} />
          ) : (
            <>
              <i className="fas fa-sun" style={{ color: primary, fontSize: '1.5rem' }}></i>
              <span style={{ color: primary }}>{settings?.site_name || 'SiWiFy.com'}</span>
            </>
          )}
        </Link>
      </nav>

      {/* 🔮 DYNAMIC ORCHESTRATOR RENDERING — SSR data passed as props */}
      {hasSavedLayout ? (
        <DynamicHomepageRenderer layout={layout} settings={settings} pageId="main" />
      ) : (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '720px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#D4AF37', fontWeight: 900 }}>Homepage Builder Required</h1>
            <p style={{ color: '#eee', fontSize: '1rem', lineHeight: 1.8, marginBottom: '2rem' }}>
              This homepage is controlled by the admin builder. Create or publish a <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>website_main</code> configuration in the portal architect to display content here.
            </p>
            <Link href="/jana/website?page=homepage" style={{ display: 'inline-block', padding: '1rem 2rem', background: '#D4AF37', color: '#000', borderRadius: '999px', fontWeight: 900, textDecoration: 'none' }}>
              Open Homepage Builder
            </Link>
          </div>
        </div>
      )}

      {/* GLOBAL WATERMARK */}
      {settings?.show_watermark !== false && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, pointerEvents: 'none', opacity: 0.3, filter: 'grayscale(100%) brightness(200%)' }}>
          <div style={{ fontWeight: 900, letterSpacing: '5px', fontSize: '0.6rem', color: '#fff' }}>SIWIFY</div>
        </div>
      )}

      {/* 🌍 FOOTER — always dark cinematic */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8rem 4rem', background: '#2b1409', color: '#f7e7d0' }}>
         <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
            <div>
               {settings?.logo_url ? (
                 <img src={settings.logo_url} alt={settings.site_name} style={{ height: `${(settings.logo_height || 40) * 1.2}px`, marginBottom: '1.5rem', objectFit: 'contain' }} />
               ) : (
                 <div style={{ fontWeight: 900, letterSpacing: '8px', fontSize: '1.25rem', color: '#f7e7d0', marginBottom: '1.5rem' }}>SIWIFY</div>
               )}
               <p style={{ color: 'rgba(247,231,208,0.72)', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.8 }}>{settings?.footer_tagline || 'The Gold Standard of Siwa Oasis Experiences. Authenticity verified through architectural heritage.'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: primary, letterSpacing: '3px', marginBottom: '0.5rem' }}>EXPLORE</span>
               <Link href="/search/vibe" style={{ color: 'rgba(247,231,208,0.78)', textDecoration: 'none', fontSize: '0.85rem' }}>The Collection</Link>
               <Link href="#discovery" style={{ color: 'rgba(247,231,208,0.78)', textDecoration: 'none', fontSize: '0.85rem' }}>Heritage DNA</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: primary, letterSpacing: '3px', marginBottom: '0.5rem' }}>PARTNERS &amp; GOVERNANCE</span>
               <Link href="/login" style={{ color: 'rgba(247,231,208,0.78)', textDecoration: 'none', fontSize: '0.85rem' }}>Vendor Portal</Link>
               <Link href="/signup" style={{ textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', color: primary }}>Become a Partner (Free Minisite)</Link>
               <Link href="/investment-opportunities" style={{ color: 'rgba(247,231,208,0.78)', textDecoration: 'none', fontSize: '0.85rem' }}>Heritage Investment</Link>
            </div>
         </div>

         <div style={{ marginTop: '8rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', opacity: 0.7, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', color: 'rgba(247,231,208,0.7)' }}>
            © {new Date().getFullYear()} {settings?.footer_copyright || 'SIWIFY • ALL RIGHTS RESERVED.'}
         </div>
      </footer>
    </div>
  );
}
