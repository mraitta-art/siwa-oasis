'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MarketplaceHeader from '@/components/MarketplaceHeader';

// ── Luminance helper ─────────────────────────────────────────────────────────
function isLight(hex?: string): boolean {
  if (!hex) return true;
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140;
  } catch { return true; }
}

function buildThemeCSS(settings: any): string {
  const bg  = settings?.bg_color    || '#070b08';
  const pri = settings?.primary_color || '#D4AF37';
  const nav = settings?.nav_bg_color  || 'rgba(7, 11, 18, 0.92)';
  const light = isLight(bg);
  if (light) {
    return `:root { --bg:${bg}; --bg-alt:${bg}ee; --card:#ffffff; --text:#0f172a; --text-muted:#475569; --text-light:#64748b; --border:#e2e8f0; --border-light:#f1f5f9; --gold:${pri}; --gold-hover:${pri}cc; --dark:${nav}; --shadow-sm:0 1px 3px rgba(0,0,0,0.06); --shadow-md:0 4px 12px rgba(0,0,0,0.08); --shadow-lg:0 10px 25px rgba(0,0,0,0.10); }`;
  }
  return `:root { --bg:${bg}; --bg-alt:#0d150f; --card:rgba(255,255,255,0.04); --text:#f8fafc; --text-muted:#cbd5e1; --text-light:#94a3b8; --border:rgba(212,175,55,0.15); --border-light:rgba(255,255,255,0.05); --gold:${pri}; --gold-hover:${pri}cc; --dark:${nav}; --shadow-sm:0 1px 3px rgba(0,0,0,0.3); --shadow-md:0 4px 12px rgba(0,0,0,0.4); --shadow-lg:0 10px 25px rgba(0,0,0,0.5); }`;
}

export default function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [layout, setLayout] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const { slug: s } = await Promise.resolve(params);
      setSlug(s);

      const tryFetch = async (pageId: string) => {
        const res = await fetch(`/api/jana/website?id=${pageId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) ? data[0] : data;
      };

      const cfg = await tryFetch(`website_${s}`);
      if (!cfg) {
        // CANONICAL RULE: If no custom builder landing page, redirect to the single canonical business minisite /[slug]
        router.replace(`/${s}`);
        return;
      } else {
        const all = [
          ...(cfg.header_components || []),
          ...(cfg.body_components || []),
          ...(cfg.footer_components || []),
        ];
        setLayout(all);
        setSettings(cfg.site_settings || null);
      }
      setLoading(false);
    }

    loadPage();
  }, [params, router]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <i className="fas fa-sun fa-spin fa-4x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
        <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>LOADING PAGE...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
        <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '4rem' }}>404</h1>
        <p style={{ opacity: 0.5 }}>The page &ldquo;{slug}&rdquo; does not exist yet.</p>
        <p style={{ opacity: 0.3, fontSize: '0.8rem' }}>Create it in the admin → Portal Architect</p>
        <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return Home</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Dynamic theme variables */}
      <style dangerouslySetInnerHTML={{ __html: buildThemeCSS(settings) }} />
      {/* Global Marketplace Navigation */}
      <MarketplaceHeader
        title={settings?.site_name || slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
        accentColor={settings?.primary_color || '#D4AF37'}
      />

      {/* Render all admin-configured components */}
      <DynamicHomepageRenderer layout={layout} settings={settings} pageId={`p:${slug}`} pagePath={`/p/${slug}`} />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4rem 4rem', background: '#0a0f1d', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontWeight: 900, letterSpacing: '8px', fontSize: '1rem', color: '#fff' }}>SIWIFY</div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 800, letterSpacing: '2px' }}>
            © {new Date().getFullYear()} SIWIFY • ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>

      {/* Watermark */}
      {settings?.show_watermark !== false && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, pointerEvents: 'none', opacity: 0.3, filter: 'grayscale(100%) brightness(200%)' }}>
          <div style={{ fontWeight: 900, letterSpacing: '5px', fontSize: '0.6rem', color: '#fff' }}>SIWIFY</div>
        </div>
      )}
    </div>
  );
}
