import { Metadata } from 'next';
import Link from 'next/link';
import { getWebsiteTemplate } from '@/lib/cache';
import DynamicForm from '@/components/DynamicForm';
import MasterCard from '@/components/MasterCard';
import VibeSearch from '@/components/VibeSearch';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * SEO ENGINE FOR CUSTOM PAGES
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const configId = `website_${slug}`;
    const results = await query<any>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [configId]
    );

    if (results.length === 0) {
      return { title: `${slug.toUpperCase()} | Siwa Oasis` };
    }

    const config = typeof results[0].config === 'string'
      ? JSON.parse(results[0].config)
      : results[0].config;

    const settings = config?.site_settings || {};

    return {
      title: `${settings.site_name || slug.toUpperCase()} | Siwa Oasis`,
      description: settings.tagline || 'Discover the magic of Siwa Oasis.',
    };
  } catch (e) {
    return { title: 'Siwa Today' };
  }
}

/**
 * CUSTOM PAGE RENDERER
 */
export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const configId = `website_${slug}`;
    const results = await query<any>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [configId]
    );

    if (results.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', height: '100vh', color: '#fff' }}>
          <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '4rem' }}>404</h1>
          <p style={{ opacity: 0.5 }}>The page "{slug}" does not exist.</p>
          <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return Home</Link>
        </div>
      );
    }

    const page = typeof results[0].config === 'string'
      ? JSON.parse(results[0].config)
      : results[0].config;

    const { header_components = [], body_components = [], footer_components = [], site_settings = {} } = page;

    const renderComponent = (c: any) => {
      switch (c.type) {
        case 'navigation':
          return (
            <nav key={c.id} style={{
              padding: '1.5rem 4rem', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000,
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px' }}>
                SIWA.<span style={{ color: site_settings.primary_color || '#D4AF37' }}>TODAY</span>
              </div>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800 }}>BACK HOME</Link>
            </nav>
          );

        case 'hero_carousel':
          return (
            <AdvancedHeroCarousel
              key={c.id}
              carouselName={c.props?.carousel_id || 'main'}
              height="80vh"
            />
          );

        case 'search_bar':
          return (
            <section key={c.id} style={{ background: '#0a0f1d', padding: '4rem 2rem' }}>
              <div style={{ maxWidth: 1000, margin: '0 auto', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: 40, border: '1px solid rgba(255,255,255,0.08)' }}>
                <VibeSearch engineId={c.props?.engine_id} />
              </div>
            </section>
          );

        case 'services':
        case 'businesses':
          return (
            <section key={c.id} style={{ padding: '6rem 2rem', background: '#0f172a' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <h2 style={{ color: '#fff', fontSize: '3rem', fontWeight: 900, marginBottom: '3rem', textAlign: 'center' }}>
                  {site_settings.site_name || 'Registry'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                  {/* Placeholder for business list - will be fetched client-side in the component */}
                  <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', gridColumn: '1/-1', padding: '4rem' }}>
                    Discovery Engine Active...
                  </div>
                </div>
              </div>
            </section>
          );

        case 'blog':
          return (
            <section key={c.id} style={{ padding: '6rem 2rem', background: '#0a0f1d' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <h2 style={{ color: site_settings.primary_color || '#D4AF37', fontSize: '1rem', fontWeight: 900, letterSpacing: '4px', marginBottom: '1rem' }}>JOURNAL</h2>
                <div style={{ height: '2px', width: '60px', background: site_settings.primary_color || '#D4AF37', marginBottom: '3rem' }}></div>
                <div style={{ color: '#fff', opacity: 0.5 }}>Latest stories from the oasis will appear here.</div>
              </div>
            </section>
          );

        default:
          return (
            <div key={c.id} style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fff', color: '#0f172a' }}>
              <h3 style={{ fontWeight: 900 }}>{c.name || c.type.toUpperCase()}</h3>
              <p style={{ opacity: 0.5 }}>Standard block content here.</p>
            </div>
          );
      }
    };

    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <header>{header_components.map(renderComponent)}</header>
        <main>{body_components.map(renderComponent)}</main>
        <footer>{footer_components.map(renderComponent)}</footer>
      </div>
    );
  } catch (e) {
    return <div style={{ padding: '5rem' }}>Error loading page content.</div>;
  }
}
