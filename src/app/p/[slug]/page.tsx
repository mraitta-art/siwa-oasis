'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

export default function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('');
  const [layout, setLayout] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Resolve params then fetch page data
    Promise.resolve(params).then(({ slug: s }) => {
      setSlug(s);
      fetch(`/api/jana/website?id=website_${s}`)
        .then(r => r.json())
        .then(data => {
          const cfg = Array.isArray(data) ? data[0] : null;
          if (!cfg) {
            setNotFound(true);
          } else {
            const all = [
              ...(cfg.header_components || []),
              ...(cfg.body_components || []),
              ...(cfg.footer_components || []),
            ];
            setLayout(all);
            setSettings(cfg.site_settings || null);
          }
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    });
  }, [params]);

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
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Navigation */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 4rem)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(15,23,42,0.8), transparent)',
      }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 900, fontSize: 'clamp(1rem, 3vw, 1.25rem)', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.site_name || 'Siwa Today'} style={{ height: `${settings.logo_height || 40}px`, objectFit: 'contain' }} />
          ) : (
            <>
              <i className="fas fa-sun" style={{ color: '#D4AF37', fontSize: '1.5rem' }}></i>
              <span>
                {settings?.site_name?.toUpperCase().split(' ')[0] || 'SIWA'}.
                <span style={{ color: '#D4AF37' }}>{settings?.site_name?.toUpperCase().split(' ')[1] || 'TODAY'}</span>
              </span>
            </>
          )}
        </Link>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', padding: '0.5rem 1.25rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', transition: 'all 0.2s' }}>
          ← HOME
        </Link>
      </nav>

      {/* Render all admin-configured components */}
      <DynamicHomepageRenderer layout={layout} settings={settings} />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4rem 4rem', background: '#0a0f1d', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontWeight: 900, letterSpacing: '8px', fontSize: '1rem', color: '#fff' }}>SIWA.TODAY</div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 800, letterSpacing: '2px' }}>
            © {new Date().getFullYear()} SIWA.TODAY • ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>

      {/* Watermark */}
      {settings?.show_watermark !== false && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, pointerEvents: 'none', opacity: 0.3, filter: 'grayscale(100%) brightness(200%)' }}>
          <div style={{ fontWeight: 900, letterSpacing: '5px', fontSize: '0.6rem', color: '#fff' }}>SIWA.TODAY</div>
        </div>
      )}
    </div>
  );
}
