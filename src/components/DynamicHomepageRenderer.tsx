'use client';
import React from 'react';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import VibeSearch from '@/components/VibeSearch';
import HomepageBlog from '@/components/HomepageBlog';
import FeaturedVibe from '@/components/FeaturedVibe';
import InvestmentMarketplaceFeed from '@/components/InvestmentMarketplaceFeed';
import Link from 'next/link';

interface SectionProps {
  type: string;
  props?: any;
  siteSettings?: any;
}

const SectionRenderer = ({ type, props, siteSettings }: SectionProps) => {
  switch (type) {
    case 'hero_carousel':
      const carouselId = props?.carousel_id || props?.siteId || 'main_hero';
      return (
        <section style={{ height: '85vh', minHeight: '500px', position: 'relative' }}>
          <AdvancedHeroCarousel 
            height="85vh" 
            carouselName={carouselId}
            autoPlay={true} 
            autoPlayInterval={siteSettings?.carousel_interval || 8000} 
            showIndicators={true}
          />
        </section>
      );

    case 'search_bar':
      const engineId = props?.engine_id || props?.engineId || '';
      return (
        <section id="discovery" style={{ background: '#0a0f1d', padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 4rem)', position: 'relative' }}>
          <div className="container" style={{ 
            maxWidth: '1200px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', 
            backdropFilter: 'blur(40px)', padding: 'clamp(1.5rem, 5vw, 3.5rem)', borderRadius: '40px', 
            border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)'
          }}>
            <VibeSearch engineId={engineId} />
          </div>
        </section>
      );

    case 'blog':
      return (
        <section style={{ background: '#0f172a', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <HomepageBlog />
          </div>
        </section>
      );

    case 'featured_vibe':
      return (
        <section style={{ background: '#0f172a', padding: '0 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <FeaturedVibe {...props} />
          </div>
        </section>
      );

    case 'investment_feed':
      return (
        <section style={{ background: '#0f172a', padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <InvestmentMarketplaceFeed />
          </div>
        </section>
      );

    case 'services':
      return (
        <section style={{ background: '#0a0f1d', padding: '6rem 2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Verified Businesses</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '3rem' }}>The Gold Standard of Siwa Oasis Experiences.</p>
          <Link href="/search/vibe" style={{ display: 'inline-block', padding: '1rem 2.5rem', background: '#D4AF37', color: '#1a1a2e', textDecoration: 'none', borderRadius: '50px', fontWeight: 900 }}>EXPLORE THE COLLECTION</Link>
        </section>
      );

    default:
      return null;
  }
};

export default function DynamicHomepageRenderer({ layout, settings }: { layout: any[], settings: any }) {
  return (
    <div style={{ background: '#0f172a' }}>
      {layout.map((section, idx) => (
        <SectionRenderer 
          key={section.id || idx} 
          type={section.type} 
          props={section.props} 
          siteSettings={settings} 
        />
      ))}
    </div>
  );
}
