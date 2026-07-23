import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

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

async function loadJourneyPage() {
  const res = await fetch('/api/jana/website?id=website_journeys', { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export default async function JourneysPage() {
  const cfg = await loadJourneyPage();

  if (!cfg) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ maxWidth: '700px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem', color: '#D4AF37' }}>Journey Explorer</h1>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#cbd5e1' }}>
            This page is ready to be powered by your admin builder. Create a new website config named <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>website_journeys</code> via the portal architect, then add sections like a hero carousel, search bar, featured journeys, and planner.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/jana/pages" style={{ padding: '0.85rem 1.5rem', background: '#D4AF37', color: '#000', borderRadius: '10px', fontWeight: 900, textDecoration: 'none' }}>
              Open Pages Manager
            </Link>
            <Link href="/jana/website?page=journeys" style={{ padding: '0.85rem 1.5rem', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none' }}>
              Edit Journey Page
            </Link>
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
      <DynamicHomepageRenderer layout={layout} settings={cfg.site_settings || null} />
    </div>
  );
}
