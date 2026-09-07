'use client';
import React, { useEffect, useRef, useState } from 'react';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import VibeSearch from '@/components/VibeSearch';
import HomepageBlog from '@/components/HomepageBlog';
import FeaturedVibe from '@/components/FeaturedVibe';
import InvestmentMarketplaceFeed from '@/components/InvestmentMarketplaceFeed';
import DiscoveryGateway from '@/components/DiscoveryGateway';
import ExperienceCategories from '@/components/ExperienceCategories';
import SmartJourneyPlanner from '@/components/SmartJourneyPlanner';
import InteractiveEcosystemMap from '@/components/InteractiveEcosystemMap';
import LocalProductsShowcase from '@/components/LocalProductsShowcase';
import StorytellingSection from '@/components/StorytellingSection';
import VendorPartnerCTA from '@/components/VendorPartnerCTA';
import ServicesHub from '@/components/ServicesHub';
import DynamicComponentRenderer from '@/components/DynamicComponentRenderer';
import Link from 'next/link';
import { validateComponentProps } from '@/lib/component-contracts';

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
  pageId?: string;
}


const SectionRenderer = ({ type, props, siteSettings, pageId }: SectionProps) => {
  // Guard: skip sections with null/undefined type
  if (!type || typeof type !== 'string') return null;

  props = validateComponentProps(type, props);
  const responsiveSectionStyle = {
    paddingTop: `clamp(${Number(props?.padding_mobile || 32)}px, 6vw, ${Number(props?.padding_desktop || 72)}px)`,
    paddingBottom: `clamp(${Number(props?.padding_mobile || 32)}px, 6vw, ${Number(props?.padding_desktop || 72)}px)`,
    maxWidth: `${Number(props?.content_max_width || 1400)}px`,
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  switch (type) {
    // ─── HERO ──────────────────────────────────────────────
    case 'hero_carousel': {
      const configuredCarouselId = props?.carousel_id || props?.siteId;
      const carouselId = configuredCarouselId && configuredCarouselId !== 'discovery'
        ? configuredCarouselId
        : `${pageId || 'main'}_hero`;
      const isDynamic = props?.isDynamic !== false && carouselId !== 'discovery'; // discovery always uses static slides
      // Build visualSettings from slot props so title fonts/colors/position apply
      const visualSettings = {
        titleColor:    props?.titleColor    || undefined,
        titleSize:     props?.titleSize     ? Number(props.titleSize)     : undefined,
        subtitleSize:  props?.subtitleSize  ? Number(props.subtitleSize)  : undefined,
        contentAlign:  (props?.contentAlign as 'center' | 'left' | 'right') || 'center',
        primaryFont:   props?.primaryFont   || undefined,
      };
      const mobileHeight = Number(props?.height_mobile || 500);
      const desktopHeight = Number(props?.height_desktop || 720);
      const responsiveHeight = `clamp(${mobileHeight}px, 75vh, ${desktopHeight}px)`;
      return (
        // key={carouselId} keeps the carousel instance stable across page reorders
        // so it won't re-fetch slides or reset its autoplay timer
        <section key={carouselId} style={{ height: responsiveHeight, minHeight: `${mobileHeight}px`, position: 'relative' }}>
          <AdvancedHeroCarousel 
            height={responsiveHeight}
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

    case 'discovery_gateway':
      return (
        <AnimatedSection>
          <DiscoveryGateway eyebrow={props?.eyebrow} title={props?.title} subtitle={props?.subtitle} destinations={props?.destinations} />
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

    // ─── SERVICE DIRECTORY / CATEGORY CARDS ─────────────────
    case 'service_directory':
    case 'services_hub':
      return (
        <AnimatedSection>
          <section>
            <ServicesHub title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    case 'category_showcase':
    case 'experience_categories':
      return (
        <AnimatedSection>
          <section>
            <ExperienceCategories title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── SMART JOURNEY PLANNER ────────────────────────────
    case 'journey_collection':
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

    // ─── GENERIC REGISTRY COMPONENTS ─────────────────────
    case 'cta_section':
    case 'text_section':
    case 'testimonials':
    case 'faq':
      return (
        <AnimatedSection>
          <div style={responsiveSectionStyle}>
            <DynamicComponentRenderer component={{ type, props }} />
          </div>
        </AnimatedSection>
      );

    case 'newsletter':
      return (
        <AnimatedSection>
          <section style={{ ...responsiveSectionStyle, paddingLeft: 'clamp(1rem, 5vw, 2rem)', paddingRight: 'clamp(1rem, 5vw, 2rem)', background: 'var(--bg-alt)', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text)', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', marginBottom: '0.75rem' }}>{props?.title || 'Stay connected'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{props?.subtitle || 'Receive the latest Siwa stories and experiences.'}</p>
            <form style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', maxWidth: '620px', margin: '0 auto' }}>
              <input type="email" required placeholder={String(props?.placeholder_text || 'Enter your email...')} aria-label="Email address" style={{ flex: '1 1 260px', minWidth: 0, padding: '0.85rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card)', color: 'var(--text)' }} />
              <button type="submit" style={{ flex: '0 1 auto', padding: '0.85rem 1.25rem', border: 0, borderRadius: '8px', background: 'var(--gold)', color: 'var(--dark)', fontWeight: 800 }}>{props?.button_text || 'Subscribe'}</button>
            </form>
          </section>
        </AnimatedSection>
      );

    case 'search_pages':
      return (
        <AnimatedSection>
          <section style={{ ...responsiveSectionStyle, paddingLeft: '1rem', paddingRight: '1rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text)', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', marginBottom: '1rem' }}>{props?.title || 'Explore Siwa'}</h2>
            <Link href={props?.buttonLink || '/search'} style={{ display: 'inline-block', padding: '0.85rem 1.25rem', borderRadius: '8px', background: 'var(--gold)', color: 'var(--dark)', textDecoration: 'none', fontWeight: 800 }}>{props?.buttonText || 'Search listings'}</Link>
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

function logDuplicateSectionIds(layout: any[]) {
  if (process.env.NODE_ENV !== 'development') return;
  const idCounts = new Map<string, number>();

  layout.forEach((section) => {
    if (!section || typeof section !== 'object') return;
    const id = section.id;
    if (typeof id === 'string' && id.trim().length > 0) {
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
  });

  const duplicates = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    console.warn(
      'Duplicate homepage builder section ids detected. This can cause React key collisions or unexpected renderer behavior.',
      duplicates.map(([id, count]) => `${id} (${count})`).join(', '),
      layout
    );
  }
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export default function DynamicHomepageRenderer({ layout, settings, pageId = 'main' }: { layout: any[], settings: any, pageId?: string }) {
  React.useEffect(() => {
    logDuplicateSectionIds(layout);
  }, [layout]);

  return (
    <div style={{ background: 'var(--bg)' }}>
      {layout.map((section, idx) => {
        if (!section) return null;
        try {
          return (
            <div
              key={`${section.id ?? section.type ?? 'section'}-${idx}`}
              className="component-responsive-shell"
              data-component-type={section.type ?? undefined}
            >
              <SectionRenderer
                type={section.type ?? ''}
                props={section.props}
                siteSettings={settings}
                pageId={pageId}
              />
            </div>
          );
        } catch {
          return null;
        }
      })}
    </div>
  );
}
