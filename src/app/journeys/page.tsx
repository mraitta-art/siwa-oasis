'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import SmartJourneyPlanner from '@/components/SmartJourneyPlanner';

function buildThemeCSS(settings: any): string {
  const bg = settings?.bg_color || '#FAF6F0';
  const pri = settings?.primary_color || '#FFB700';
  const nav = settings?.nav_bg_color || '#556B2F';
  const light = (() => {
    if (!bg) return true;
    try {
      const c = bg.replace('#', '');
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140;
    } catch {
      return true;
    }
  })();

  if (light) {
    return `:root { --bg:${bg}; --bg-alt:${bg}ee; --card:#ffffff; --text:#202D15; --text-muted:#5A4A3A; --text-light:#8E7B6C; --border:#E8DFD3; --border-light:#F4ECE0; --gold:${pri}; --gold-hover:${pri}cc; --dark:${nav}; --shadow-sm:0 1px 3px rgba(0,0,0,0.06); --shadow-md:0 4px 12px rgba(0,0,0,0.08); --shadow-lg:0 10px 25px rgba(0,0,0,0.10); }`;
  }

  return `:root { --bg:${bg}; --bg-alt:${bg}dd; --card:rgba(255,255,255,0.04); --text:#f8fafc; --text-muted:#cbd5e1; --text-light:#94a3b8; --border:rgba(255,255,255,0.08); --border-light:rgba(255,255,255,0.05); --gold:${pri}; --gold-hover:${pri}cc; --dark:${nav}; --shadow-sm:0 1px 3px rgba(0,0,0,0.3); --shadow-md:0 4px 12px rgba(0,0,0,0.4); --shadow-lg:0 10px 25px rgba(0,0,0,0.5); }`;
}

export default function JourneysPage() {
  const [cfg, setCfg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jana/website?id=website_journeys')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const config = Array.isArray(data) ? data[0] : data;
        setCfg(config || null);
      })
      .catch(() => setCfg(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '4px', fontSize: '0.9rem' }}>LOADING JOURNEYS…</div>
      </div>
    );
  }

  if (!cfg || (!cfg.header_components?.length && !cfg.body_components?.length && !cfg.footer_components?.length)) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ display: 'inline-block', background: 'rgba(212,175,55,0.15)', color: '#D4AF37', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Tailored Siwa Itineraries
            </span>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, margin: '1rem 0 0.5rem', color: '#fff' }}>
              Smart Journey Planner
            </h1>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7 }}>
              Build your custom Siwa expedition step-by-step. Select your travel duration, preferences, and pace to discover curated activities, camps, and heritage guides.
            </p>
          </header>

          <div style={{ background: '#1e293b', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <SmartJourneyPlanner />
          </div>
        </div>
      </div>
    );
  }

  const layout = [
    ...(cfg.header_components || []),
    ...(cfg.body_components || []),
    ...(cfg.footer_components || []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style dangerouslySetInnerHTML={{ __html: buildThemeCSS(cfg.site_settings || {}) }} />
      <DynamicHomepageRenderer layout={layout} settings={cfg.site_settings || null} pageId="journeys" />
    </div>
  );
}
