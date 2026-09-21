'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import PageNotConfigured from '@/components/PageNotConfigured';

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
    } catch { return true; }
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
      <div style={{ minHeight: '100vh', background: '#070B12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasLayout = cfg?.header_components?.length || cfg?.body_components?.length || cfg?.footer_components?.length;

  if (!cfg || !hasLayout) {
    return <PageNotConfigured pageName="Journeys" pageId="journeys" />;
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
