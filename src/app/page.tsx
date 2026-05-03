'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

export default function HomePage() {
  const [pageData, setPageData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [carouselSlides, setCarouselSlides] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeroCarousel, setShowHeroCarousel] = useState(true);

  useEffect(() => {
    async function init() {
      // 1. Fetch Carousel Slides (Manual + Discovery)
      try {
        const [manualRes, featuredRes, blogRes] = await Promise.all([
          fetch('/api/admin/hero-carousel'),
          fetch('/api/discovery/featured'),
          fetch('/api/discovery/blog?limit=6')
        ]);

        const manual = manualRes.ok ? (await manualRes.json()).slides || [] : [];
        const featured = featuredRes.ok ? (await featuredRes.json()).slides || [] : [];
        const blogs = blogRes.ok ? (await blogRes.json()).posts || [] : [];

        setCarouselSlides([...manual, ...featured]);
        setBlogPosts(blogs);
      } catch (e) { console.error('Discovery fetch fail:', e); }

      // 2. Fetch Website Settings
      try {
        const sRes = await fetch('/api/admin/website?type=main');
        if (sRes.ok) {
          const sData = await sRes.json();
          const settings = sData[0]?.site_settings || {};
          setSettings(settings);
          // Check if hero carousel should be shown (defaults to true)
          setShowHeroCarousel(settings?.show_hero_carousel !== false);
        }
      } catch (e) { console.error('Settings fetch fail:', e); }

      // 3. Fetch Page Structure
      try {
        const pRes = await fetch('/api/admin/website/pages?siteId=website_main');
        if (pRes.ok) {
          const pData = await pRes.json();
          const indexPage = pData.find((p: any) => p.slug === 'index' || p.slug === 'home');
          setPageData(indexPage || pData[0]);
        }
      } catch (e) { console.error('Page fetch fail:', e); }

      setLoading(false);
    }
    init();
  }, []);

  const renderComponent = (c: any) => {
    const primaryColor = settings?.primary_color || '#D4AF37';
    
    // Handle Hero/Cinematic Carousels
    if (['hero_carousel', 'hero', 'cinematic_carousel'].includes(c.type)) {
      const slides = c.props?.slides?.length > 0 ? c.props.slides : carouselSlides;
      if (slides && slides.length > 0) {
        return (
          <AdvancedHeroCarousel
            key={c.id}
            slides={slides}
            autoPlay={settings?.carousel_autoplay !== false}
            autoPlayInterval={settings?.carousel_interval || 8000}
            transitionDuration={c.props?.transitionDuration || 1200}
            height={c.props?.height || '100vh'}
            showIndicators={c.props?.showIndicators !== false}
            showArrows={c.props?.showArrows !== false}
            showProgress={c.props?.showProgress !== false}
          />
        );
      }
      return null;
    }

    // Handle Master Blog Component
    if (c.type === 'blog') {
      return (
        <section key={c.id} style={{ maxWidth: 1400, margin: '0 auto', padding: '4rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ maxWidth: '700px' }}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1 }}>{c.props?.title || 'SIWA STORIES'}</h2>
              <p style={{ color: '#64748b', fontSize: 'clamp(1rem, 2vw, 1.25rem)', marginTop: '1.5rem', lineHeight: 1.6 }}>Discover curated narratives from our community partners.</p>
            </div>
            <Link href="/stories" style={{ 
              padding: '1rem 2rem', 
              border: `2px solid ${primaryColor}`, 
              color: primaryColor, 
              borderRadius: '50px', 
              fontWeight: 800, 
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}>EXPLORE ALL</Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', 
            gap: '2rem' 
          }}>
            {blogPosts.map((post: any) => (
              <Link href={post.slug} key={post.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                    <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 20, left: 20, background: primaryColor, color: '#fff', padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800 }}>
                      {post.sectionName}
                    </div>
                  </div>
                  <div style={{ padding: '2rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: primaryColor, marginBottom: '0.5rem' }}>{post.businessName.toUpperCase()}</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem', lineHeight: 1.2 }}>{post.title}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{post.excerpt}</p>
                    <div style={{ marginTop: 'auto', fontWeight: 900, fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      READ STORY <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem', color: primaryColor }}></i>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    return (
      <div key={c.id} style={{ padding: '2rem', border: '1px dashed #eee', textAlign: 'center', margin: '1rem', borderRadius: '12px' }}>
        <i className="fas fa-cube" style={{ color: primaryColor, marginRight: '0.5rem' }}></i> {c.name} (Production Ready)
      </div>
    );
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-sun fa-spin fa-3x" style={{ color: '#D4AF37' }}></i></div>;

  const allComponents = [
    ...(pageData?.header_components || []),
    ...(pageData?.body_components || []),
    ...(pageData?.components || [])
  ];

  const hasHeroComponent = allComponents.some((c: any) => 
    ['hero_carousel', 'hero', 'cinematic_carousel'].includes(c.type)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{ padding: '1.5rem 3rem', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>
          <i className="fas fa-sun" style={{ color: settings?.primary_color || '#D4AF37', marginRight: '0.75rem' }}></i>
          {settings?.site_name?.toUpperCase() || 'SIWA TODAY'}
        </h1>
        <div style={{ display: 'flex', gap: '3rem', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '2px', color: '#1e293b' }}>
          <span>DISCOVER</span>
          <span>PLAN</span>
          <span>STAY</span>
          <Link href="/login" style={{ color: settings?.primary_color || '#D4AF37', textDecoration: 'none' }}>SIGN IN</Link>
        </div>
      </nav>

      {/* 1. Header Components */}
      {pageData?.header_components?.map(renderComponent)}

      {/* 2. Fallback Hero (Only if enabled and not explicitly disabled) */}
      {showHeroCarousel && !hasHeroComponent && carouselSlides.length > 0 && (
        <AdvancedHeroCarousel
          slides={carouselSlides}
          autoPlay={settings?.carousel_autoplay !== false}
          autoPlayInterval={settings?.carousel_interval || 8000}
          height="100vh"
          showIndicators={true}
          showArrows={true}
          showProgress={true}
        />
      )}

      {/* 3. Main Content */}
      <main>
        {pageData?.components?.map(renderComponent)}
        {!pageData?.components?.length && !pageData?.header_components?.length && (
           <div style={{ textAlign: 'center', padding: '15rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🏜️</div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>WELCOME TO {settings?.site_name?.toUpperCase()}</h2>
              <p style={{ color: '#64748b', fontSize: '1.2rem' }}>The Master Orchestrator is curating your Siwa experience...</p>
           </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer style={{ background: '#0f172a', color: '#fff', padding: '6rem 3rem' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '0.5rem' }}>{settings?.site_name?.toUpperCase()}</h2>
            <p style={{ opacity: 0.6, fontSize: '1rem' }}>{settings?.footerText || 'Your premier guide to the Siwa Oasis experience.'}</p>
          </div>
          <div style={{ opacity: 0.4, fontSize: '0.8rem', fontWeight: 700 }}>
            © {new Date().getFullYear()} SIWA TODAY • ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
