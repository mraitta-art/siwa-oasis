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
  { id: 'h8', type: 'storytelling_section', props: {} },
  { id: 'h9', type: 'partner_cta', props: {} }
];

export default function Home() {
  // Start with default layout immediately — no blocking spinner
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

  return (
    <div style={{ minHeight: '100vh', background: settings?.bg_color || 'linear-gradient(135deg, #556B2F, #6B8E23)' }}>
      
      {/* 🏛️ ELITE NAVIGATION (Global Signature) */}
      <nav style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, 
        padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 4rem)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: settings?.nav_bg_color 
          ? `linear-gradient(to bottom, ${settings.nav_bg_color}, transparent)` 
          : 'linear-gradient(to bottom, rgba(85, 107, 47, 0.85), transparent)' 
      }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 900, fontSize: 'clamp(1rem, 3vw, 1.25rem)', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.site_name || 'Siwa Today'} style={{ height: `${settings.logo_height || 40}px`, objectFit: 'contain' }} />
          ) : (
            <>
              <i className="fas fa-sun" style={{ color: settings?.primary_color || '#FFB700', fontSize: '1.5rem' }}></i>
              <span>{settings?.site_name?.toUpperCase().split(' ')[0] || 'SIWA'}.<span style={{ color: settings?.primary_color || '#FFB700' }}>{settings?.site_name?.toUpperCase().split(' ')[1] || 'TODAY'}</span></span>
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

      {/* 🌍 FOOTER (Global Navigation) */}
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
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: settings?.primary_color || '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>EXPLORE</span>
               <Link href="/search/vibe" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>The Collection</Link>
               <Link href="#discovery" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Heritage DNA</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: settings?.primary_color || '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>GOVERNANCE</span>
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
