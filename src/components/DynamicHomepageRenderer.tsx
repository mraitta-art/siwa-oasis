'use client';
import React, { useEffect, useRef, useState } from 'react';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import VibeSearch from '@/components/VibeSearch';
import HomepageBlog from '@/components/HomepageBlog';
import FeaturedVibe from '@/components/FeaturedVibe';
import InvestmentMarketplaceFeed from '@/components/InvestmentMarketplaceFeed';
import ExperienceCategories from '@/components/ExperienceCategories';
import SmartJourneyPlanner from '@/components/SmartJourneyPlanner';
import InteractiveEcosystemMap from '@/components/InteractiveEcosystemMap';
import LocalProductsShowcase from '@/components/LocalProductsShowcase';
import StorytellingSection from '@/components/StorytellingSection';
import VendorPartnerCTA from '@/components/VendorPartnerCTA';
import ServicesHub from '@/components/ServicesHub';
import Link from 'next/link';

// ── Scroll-triggered fade-in wrapper ──────────────────────────────────────────
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08, rootMargin: '60px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// Error boundary removed to avoid Next.js Fast Refresh class component conflict.

// ── Section renderer ─────────────────────────────────────────────────────────
interface SectionProps {
  type: string;
  props?: any;
  siteSettings?: any;
}


const SectionRenderer = ({ type, props, siteSettings }: SectionProps) => {
  // Guard: skip sections with null/undefined type
  if (!type || typeof type !== 'string') return null;

  switch (type) {
    // ─── HERO ──────────────────────────────────────────────
    case 'hero_carousel': {
      const carouselId = props?.carousel_id || props?.siteId || 'main_hero';
      const isDynamic = props?.isDynamic !== false; // Default to dynamic for homepage
      // Build visualSettings from slot props so title fonts/colors/position apply
      const visualSettings = {
        titleColor:    props?.titleColor    || undefined,
        titleSize:     props?.titleSize     ? Number(props.titleSize)     : undefined,
        subtitleSize:  props?.subtitleSize  ? Number(props.subtitleSize)  : undefined,
        contentAlign:  (props?.contentAlign as 'center' | 'left' | 'right') || 'center',
        primaryFont:   props?.primaryFont   || undefined,
      };
      return (
        // key={carouselId} keeps the carousel instance stable across page reorders
        // so it won't re-fetch slides or reset its autoplay timer
        <section key={carouselId} style={{ height: '85vh', minHeight: '500px', position: 'relative' }}>
          <AdvancedHeroCarousel 
            height="85vh" 
            carouselName={carouselId}
            isDynamic={isDynamic}
            includeDynamicOptions={{
              businesses: props?.includeBusinesses !== false,
              journeys: props?.includeJourneys !== false,
              investment: props?.includeInvestment !== false,
              registration: props?.includeRegistration !== false
            }}
            autoPlay={props?.autoPlay !== false} 
            autoPlayInterval={props?.autoPlayInterval ? Number(props.autoPlayInterval) : (siteSettings?.carousel_interval || 8000)} 
            showIndicators={props?.showIndicators !== false}
            showArrows={props?.showArrows !== false}
            showProgress={props?.showProgress !== false}
            visualSettings={visualSettings}
          />
        </section>
      );
    }

    // ─── SEARCH ────────────────────────────────────────────
    case 'search_bar': {
      const engineId = props?.engine_id || props?.engineId || '';
      return (
        <AnimatedSection>
          <section id="discovery" style={{ background: 'var(--bg-alt)', padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 4rem)', position: 'relative' }}>
            <div className="container" style={{ 
              maxWidth: '1200px', margin: '0 auto', background: 'var(--card)', 
              padding: 'clamp(1.5rem, 5vw, 3.5rem)', borderRadius: '40px', 
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)'
            }}>
              <VibeSearch engineId={engineId} />
            </div>
          </section>
        </AnimatedSection>
      );
    }

    // ─── BLOG ──────────────────────────────────────────────
    case 'blog':
      return (
        <AnimatedSection>
          <section style={{ background: 'var(--bg)', padding: '4rem 2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <HomepageBlog title={props?.title} subtitle={props?.subtitle} maxPosts={props?.maxPosts} />
            </div>
          </section>
        </AnimatedSection>
      );

    // ─── FEATURED VIBE ─────────────────────────────────────
    case 'featured_vibe':
      return (
        <AnimatedSection>
          <section style={{ background: 'var(--bg)', padding: '0 2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <FeaturedVibe {...props} />
            </div>
          </section>
        </AnimatedSection>
      );

    // ─── INVESTMENT FEED ───────────────────────────────────
    case 'investment_feed':
      return (
        <AnimatedSection>
          <section style={{ background: 'var(--bg)', padding: '6rem 2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <InvestmentMarketplaceFeed title={props?.title} subtitle={props?.subtitle} />
            </div>
          </section>
        </AnimatedSection>
      );

    // ─── SIMPLE SERVICES CTA ──────────────────────────────
    case 'services':
      return (
        <AnimatedSection>
          <section style={{ background: 'var(--bg-alt)', padding: '6rem 2rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text)', fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>{props?.title || 'Verified Businesses'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>{props?.subtitle || 'The Gold Standard of Siwa Oasis Experiences.'}</p>
            <Link href={props?.buttonLink || '/search/vibe'} style={{ display: 'inline-block', padding: '1rem 2.5rem', background: 'var(--gold)', color: 'var(--dark)', textDecoration: 'none', borderRadius: '50px', fontWeight: 900 }}>{props?.buttonText || 'EXPLORE THE COLLECTION'}</Link>
          </section>
        </AnimatedSection>
      );

    // ─── EXPERIENCE CATEGORIES ────────────────────────────
    case 'experience_categories':
      return (
        <AnimatedSection>
          <section>
            <ExperienceCategories title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── SMART JOURNEY PLANNER ────────────────────────────
    case 'smart_journey_planner':
      return (
        <AnimatedSection>
          <section>
            <SmartJourneyPlanner title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── ECOSYSTEM MAP ────────────────────────────────────
    case 'ecosystem_map':
      return (
        <AnimatedSection>
          <section>
            <InteractiveEcosystemMap title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── LOCAL PRODUCTS ───────────────────────────────────
    case 'local_products':
      return (
        <AnimatedSection>
          <section>
            <LocalProductsShowcase title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── STORYTELLING ─────────────────────────────────────
    case 'storytelling_section':
      return (
        <AnimatedSection>
          <section>
            <StorytellingSection title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── PARTNER CTA ──────────────────────────────────────
    case 'partner_cta':
      return (
        <AnimatedSection>
          <section>
            <VendorPartnerCTA title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── SERVICES HUB ─────────────────────────────────────
    case 'services_hub':
      return (
        <AnimatedSection>
          <section>
            <ServicesHub title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── UNKNOWN ──────────────────────────────────────────
    default:
      if (process.env.NODE_ENV === 'development') {
        return (
          <div style={{
            padding: '1rem 2rem', margin: '0.5rem 0', textAlign: 'center',
            background: 'rgba(245,158,11,0.05)', border: '1px dashed rgba(245,158,11,0.3)',
            borderRadius: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem',
          }}>
            ⚠️ Unknown module type: <strong>{type}</strong>
          </div>
        );
      }
      return null;
  }
};

// ── Main renderer ─────────────────────────────────────────────────────────────
export default function DynamicHomepageRenderer({ layout, settings }: { layout: any[], settings: any }) {
  return (
    <div style={{ background: 'var(--bg)' }}>
      {layout.map((section, idx) => {
        if (!section) return null;
        try {
          return (
            <SectionRenderer 
              key={section.id || idx}
              type={section.type ?? ''} 
              props={section.props} 
              siteSettings={settings} 
            />
          );
        } catch {
          return null;
        }
      })}
    </div>
  );
}
