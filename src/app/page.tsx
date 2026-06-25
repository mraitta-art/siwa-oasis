'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

interface LayoutSection {
  id: string;
  type: string;
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
}

const DEFAULT_LAYOUT: LayoutSection[] = [
  { id: 'h1', type: 'hero_carousel', props: { siteId: 'discovery', isDynamic: true, includeBusinesses: true, includeJourneys: true, includeInvestment: true, includeRegistration: true } },
  { id: 'h2', type: 'services_hub', props: {} },
  { id: 'h3', type: 'experience_categories', props: {} },
  { id: 'h4', type: 'search_bar', props: {} },
  { id: 'h5', type: 'smart_journey_planner', props: {} },
  { id: 'h6', type: 'ecosystem_map', props: {} },
  { id: 'h7', type: 'local_products', props: {} },
  { id: 'h8', type: 'investment_feed', props: { title: 'Heritage Investment Opportunities', subtitle: 'HERITAGE CAPITAL' } },
  { id: 'h9', type: 'storytelling_section', props: {} },
  { id: 'h10', type: 'partner_cta', props: {} }
];

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

export default function Home() {
  const [layout, setLayout] = useState<LayoutSection[]>(DEFAULT_LAYOUT);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/jana/website?id=website_main');
        if (res.ok) {
          const data = await res.json();
          const config = data[0];
          if (config) {
            const allComponents: LayoutSection[] = [
              ...(config.header_components || []),
              ...(config.body_components || []),
              ...(config.footer_components || [])
            ];
            if (allComponents.length > 0) setLayout(allComponents);
            if (config.site_settings) setSettings(config.site_settings);
          }
        }
      } catch (e) { 
        console.error('Homepage init fail:', e);
      }
    }
    init();
  }, []);

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
            <img src={settings.logo_url} alt={settings.site_name || 'Siwa Today'} style={{ height: `${settings.logo_height || 40}px`, objectFit: 'contain' }} />
          ) : (
            <>
              <i className="fas fa-sun" style={{ color: primary, fontSize: '1.5rem' }}></i>
              <span>{(settings?.site_name || 'Siwa Today').toUpperCase().split(' ')[0]}.<span style={{ color: primary }}>{(settings?.site_name || 'Siwa Today').toUpperCase().split(' ')[1] || 'TODAY'}</span></span>
            </>
          )}
        </Link>
      </nav>

      {/* 🔮 DYNAMIC ORCHESTRATOR RENDERING */}
      <DynamicHomepageRenderer layout={layout} settings={settings} />

      {/* GLOBAL WATERMARK */}
      {settings?.show_watermark !== false && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, pointerEvents: 'none', opacity: 0.3, filter: 'grayscale(100%) brightness(200%)' }}>
          <div style={{ fontWeight: 900, letterSpacing: '5px', fontSize: '0.6rem', color: '#fff' }}>SIWA.TODAY</div>
        </div>
      )}

      {/* 🌍 FOOTER — always dark cinematic */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8rem 4rem', background: '#0a0f1d', color: '#fff' }}>
         <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
            <div>
               {settings?.logo_url ? (
                 <img src={settings.logo_url} alt={settings.site_name} style={{ height: `${(settings.logo_height || 40) * 1.2}px`, marginBottom: '1.5rem', objectFit: 'contain' }} />
               ) : (
                 <div style={{ fontWeight: 900, letterSpacing: '8px', fontSize: '1.25rem', color: '#fff', marginBottom: '1.5rem' }}>SIWA.TODAY</div>
               )}
               <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.8 }}>The Gold Standard of Siwa Oasis Experiences. Authenticity verified through architectural heritage.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: primary, letterSpacing: '3px', marginBottom: '0.5rem' }}>EXPLORE</span>
               <Link href="/search/vibe" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>The Collection</Link>
               <Link href="#discovery" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Heritage DNA</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: primary, letterSpacing: '3px', marginBottom: '0.5rem' }}>GOVERNANCE</span>
               <Link href="/admin" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Admin / Partner Login</Link>
               <Link href="/investment" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Heritage Investment</Link>
            </div>
         </div>

         <div style={{ marginTop: '8rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px' }}>
            © {new Date().getFullYear()} SIWA.TODAY • ALL RIGHTS RESERVED.
         </div>
      </footer>
    </div>
  );
}
