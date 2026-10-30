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
import CategoryCommercialTabs from '@/components/CategoryCommercialTabs';
import CategoryPageHero from '@/components/CategoryPageHero';
import DynamicComponentRenderer from '@/components/DynamicComponentRenderer';
import DynamicSectorBookingShowcase from '@/components/DynamicSectorBookingShowcase';
import RetreatProgramBuilder from '@/components/RetreatProgramBuilder';
import AccommodationExplorer from '@/components/AccommodationExplorer';
import AuctionsShowcase from '@/components/AuctionsShowcase';

import PartnerRegistrationForm from '@/components/PartnerRegistrationForm';
import MarketHero from '@/components/home/MarketHero';
import EgyptHero from '@/components/home/EgyptHero';
import EgyptDestinations from '@/components/home/EgyptDestinations';
import PillarGateway from '@/components/home/PillarGateway';
import MarketsShowcase from '@/components/home/MarketsShowcase';
import MarketCategories from '@/components/home/MarketCategories';
import MarketListings from '@/components/home/MarketListings';
import FeaturedDevelopers from '@/components/home/FeaturedDevelopers';
import MarketHowItWorks from '@/components/home/MarketHowItWorks';
import ServicesGrid from '@/components/home/ServicesGrid';
import type { HomeData } from '@/lib/home-data';
import Link from 'next/link';
import { validateComponentProps } from '@/lib/component-contracts';
import { sitePathFromPageId } from '@/lib/site-blog-paths';
import SectionAggregationPage from '@/components/SectionAggregationPage';
import CategoryInvestmentSection from '@/components/CategoryInvestmentSection';
import { BRAND_SECTORS, type BrandSectorSlug } from '@/lib/brand-sectors';

// ── Section Context for above-the-fold immediate rendering ────────────────────
const SectionIndexContext = React.createContext<{ isFirst: boolean }>({ isFirst: false });

// ── Scroll-triggered fade-in wrapper (bypassed for top/above-the-fold content) ─
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { isFirst } = React.useContext(SectionIndexContext);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(isFirst);

  useEffect(() => {
    if (isFirst || visible) return;
    const el = ref.current;
    if (!el) return;

    // Fast check: if element is already within or near viewport, make visible immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < (window.innerHeight || 800) + 120) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isFirst, visible]);

  if (isFirst) {
    return <div style={{ opacity: 1, transform: 'none' }}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: visible
          ? `opacity 0.6s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`
          : 'none',
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
  pagePath?: string;
  sectorDirectoryTopContent?: React.ReactNode;
  homeData?: HomeData;
}


const SectionRenderer = ({ type, props, siteSettings, pageId, pagePath, sectorDirectoryTopContent, homeData }: SectionProps) => {
  // Guard: skip sections with null/undefined type
  if (!type || typeof type !== 'string') return null;

  props = validateComponentProps(type, props);

  // ─── MARKETPLACE FRONT DOOR ────────────────────────────
  // These blocks render the live market (hero, other markets, category doors,
  // newest listings, developers, how-it-works). They read homeData resolved
  // server-side, so they are only meaningful on the home page; without it they
  // stay silent rather than crash on another pageId.
  switch (type) {
    case 'market_hero':
      return homeData ? <MarketHero data={homeData} props={props} /> : null;
    case 'egypt_hero':
      return homeData ? <EgyptHero data={homeData} props={props} /> : null;
    case 'egypt_destinations':
      return homeData ? <AnimatedSection><EgyptDestinations data={homeData} props={props} /></AnimatedSection> : null;
    case 'pillar_gateway':
      return homeData ? <AnimatedSection><PillarGateway data={homeData} props={props} /></AnimatedSection> : null;
    case 'markets_showcase':
      return homeData ? <MarketsShowcase data={homeData} props={props} /> : null;
    case 'market_categories':
      return homeData ? <AnimatedSection><MarketCategories data={homeData} props={props} /></AnimatedSection> : null;
    case 'market_listings':
      return homeData ? <AnimatedSection><MarketListings data={homeData} props={props} /></AnimatedSection> : null;
    case 'featured_developers':
      return homeData ? <AnimatedSection><FeaturedDevelopers data={homeData} props={props} /></AnimatedSection> : null;
    case 'services_categories':
      return homeData ? <AnimatedSection><ServicesGrid data={homeData} props={props} /></AnimatedSection> : null;
    case 'how_it_works':
      return homeData ? <AnimatedSection><MarketHowItWorks data={homeData} props={props} /></AnimatedSection> : null;
  }
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
      const isDynamic = props?.isDynamic === true && carouselId !== 'discovery'; // discovery always uses static slides
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
        // No fixed height on the wrapper — when AdvancedHeroCarousel returns null (no slides yet),
        // this section collapses to zero so the next slot (e.g. category_hero) shows as the fallback.
        <section key={carouselId} style={{ position: 'relative' }}>
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

    // ─── CATEGORY HERO ─────────────────────────────────────
    case 'category_hero': {
      const cat = props?.category || (pageId === 'accommodations' ? 'accommodation' : pageId === 'transportation' ? 'transportation' : pageId === 'activities' ? 'activity' : pageId === 'food-beverage' ? 'food' : pageId || 'accommodation');
      const label = props?.label || (pageId ? pageId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Category');
      const title = props?.title || `Find the perfect ${label} in Egypt`;
      const accent = props?.accent || '#D4AF37';
      return (
        <CategoryPageHero category={cat} label={label} title={title} accent={accent} />
      );
    }

    case 'brand_sector_hero': {
      const accent = props?.accent || siteSettings?.primary_color || '#D4AF37';
      return (
        <section
          style={{
            minHeight: 'clamp(420px, 72vh, 760px)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 1.5rem',
            textAlign: 'center',
            backgroundImage: `${props?.gradient || 'linear-gradient(160deg,rgba(7,11,8,0.88),rgba(7,11,8,0.65),rgba(7,11,8,0.95))'}, url("${props?.image || ''}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div style={{ maxWidth: 900, position: 'relative', zIndex: 1 }}>
            <div style={{ color: accent, fontSize: '0.72rem', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              {props?.label || ''}
            </div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 5.5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 1rem', textShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
              {props?.title || ''}
            </h1>
            {props?.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(1rem, 2vw, 1.3rem)', margin: '0 auto 1rem', maxWidth: 680 }}>{props.subtitle}</p>}
            {props?.description && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 auto', maxWidth: 640 }}>{props.description}</p>}
          </div>
        </section>
      );
    }

    // ─── CATEGORY COMMERCIAL TABS (DEALS, PACKAGES, DISCOUNTS) ────
    case 'category_commercial_tabs': {
      const cat = props?.category || (pageId === 'accommodations' ? 'accommodation' : pageId === 'transportation' ? 'transportation' : pageId === 'activities' ? 'activity' : pageId === 'food-beverage' ? 'food' : pageId || 'accommodation');
      return (
        <AnimatedSection>
          <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <CategoryCommercialTabs category={cat} />
          </section>
        </AnimatedSection>
      );
    }

    // ─── SEARCH ────────────────────────────────────────────
    case 'search_bar': {
      const engineId = props?.engine_id || props?.engineId || '';
      const cat = props?.defaultCategory || (pageId === 'accommodations' ? 'accommodation' : pageId === 'transportation' ? 'transportation' : pageId === 'activities' ? 'activity' : pageId === 'food-beverage' ? 'food' : undefined);
      return (
        <AnimatedSection>
          <section id="discovery" style={{ background: 'var(--bg-alt)', padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 4rem)', position: 'relative' }}>
            <div className="container" style={{ 
              maxWidth: '1200px', margin: '0 auto', background: 'var(--card)', 
              padding: 'clamp(1.5rem, 5vw, 3.5rem)', borderRadius: '40px', 
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)'
            }}>
              <VibeSearch engineId={engineId} defaultCategory={cat} title={props?.title} subtitle={props?.subtitle} />
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
              <HomepageBlog title={props?.title} subtitle={props?.subtitle} maxPosts={props?.maxPosts} blogLayout={props?.blogLayout} pagePath={pagePath || sitePathFromPageId(pageId)} />
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
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>{props?.subtitle || 'Verified businesses and services across Egypt.'}</p>
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

    // ─── SECTOR BOOKING SHOWCASE & DEDICATED RESERVATION MODULES ──
    case 'sector_booking_showcase':
    case 'commercial_deals_matrix':
    case 'reservation_accommodation':
    case 'reservation_dining':
    case 'reservation_transportation':
    case 'reservation_transports':
    case 'reservation_activities':
    case 'reservation_tours':
    case 'reservation_products': {
      const explicitSector = 
        type === 'reservation_accommodation' ? 'accommodation' :
        type === 'reservation_dining' ? 'dining' :
        (type === 'reservation_transportation' || type === 'reservation_transports') ? 'transports' :
        type === 'reservation_activities' ? 'activities' :
        type === 'reservation_tours' ? 'tours' :
        type === 'reservation_products' ? 'products' :
        (props?.sector || 'all');

      return (
        <AnimatedSection>
          <DynamicSectorBookingShowcase
            sector={explicitSector}
            businessId={props?.businessId || props?.business_id}
            businessSlug={props?.businessSlug || props?.business_slug}
            title={props?.title}
            subtitle={props?.subtitle}
            accentColor={props?.accentColor || siteSettings?.primary_color || '#D4AF37'}
            defaultKind={props?.defaultKind || (type === 'commercial_deals_matrix' ? 'offer' : 'all')}
            allowSectorSwitching={props?.allowSectorSwitching !== false && explicitSector === 'all'}
          />
        </AnimatedSection>
      );
    }


    // ─── ACCOMMODATION EXPLORER (Vibe, Setting & Minisite Hub) ───
    case 'accommodation_explorer':
      return (
        <AnimatedSection>
          <AccommodationExplorer
            accentColor={props?.accentColor || siteSettings?.primary_color || '#D4AF37'}
            initialSetting={props?.initialSetting || 'all'}
            initialVibe={props?.initialVibe || 'all'}
            initialType={props?.initialType || 'all'}
            title={props?.title}
            subtitle={props?.subtitle}
          />
        </AnimatedSection>
      );

    // ─── RETREAT PROGRAM BUILDER ──────────────────────────
    case 'retreat_program_builder':
      return (
        <AnimatedSection>
          <RetreatProgramBuilder
            initialProgramId={props?.initialProgramId || props?.program_id || 'retreat_silence_3days'}
            accentColor={props?.accentColor || siteSettings?.primary_color || '#D4AF37'}
          />
        </AnimatedSection>
      );

    case 'sector_directory': {
      const sector = typeof pageId === 'string' && Object.prototype.hasOwnProperty.call(BRAND_SECTORS, pageId)
        ? BRAND_SECTORS[pageId as BrandSectorSlug]
        : null;
      return (
        <AnimatedSection>
          <SectionAggregationPage
            sectionId={String(props?.sectionId || sector?.sectionId || 'sec_1_identity')}
            pageConfigId={`__embedded_${pageId}`}
            pageLabel={String(props?.title || props?.label || sector?.label || pageId)}
            description={String(props?.description || props?.subtitle || sector?.description || '')}
            accentColor={String(props?.accentColor || siteSettings?.primary_color || sector?.accent || '#D4AF37')}
            ctaLabel={String(props?.ctaLabel || `Explore ${sector?.label || pageId}`)}
            showPartnerCta={props?.showPartnerCta !== false}
            skipBuilderFetch
            categoryFilter={String(props?.categoryFilter || props?.category || sector?.category || pageId)}
            topContent={sectorDirectoryTopContent}
          />
        </AnimatedSection>
      );
    }

    case 'sector_investment': {
      const sector = typeof pageId === 'string' && Object.prototype.hasOwnProperty.call(BRAND_SECTORS, pageId)
        ? BRAND_SECTORS[pageId as BrandSectorSlug]
        : null;
      return (
        <AnimatedSection>
          <CategoryInvestmentSection
            typeId={String(props?.category || sector?.category || pageId)}
            label={String(props?.label || props?.title || sector?.label || pageId)}
          />
        </AnimatedSection>
      );
    }

    // ─── SMART JOURNEY PLANNER ────────────────────────────

    case 'journey_collection':
    case 'smart_journey_planner':
      return (
        <AnimatedSection>
          <section>
            <SmartJourneyPlanner
              title={props?.title}
              subtitle={props?.subtitle}
              mode={props?.mode}
              category={props?.category || pageId}
            />
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
            <StorytellingSection title={props?.title} subtitle={props?.subtitle} pagePath={pagePath || sitePathFromPageId(pageId)} />
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

    // ─── AUCTIONS FEED & SHOWCASE ─────────────────────────
    case 'auctions_feed':
    case 'auctions_showcase':
      return (
        <AnimatedSection>
          <section style={{ background: 'var(--bg, #0f172a)' }}>
            <AuctionsShowcase title={props?.title} subtitle={props?.subtitle} />
          </section>
        </AnimatedSection>
      );

    // ─── PARTNER REGISTRATION FORM ────────────────────────
    case 'partner_registration_form':
      return (
        <AnimatedSection>
          <section style={{ background: 'var(--bg, #f8fafc)' }}>
            <PartnerRegistrationForm
              title={props?.title}
              subtitle={props?.subtitle}
              hero_title={props?.hero_title}
              hero_subtitle={props?.hero_subtitle}
            />
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
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{props?.subtitle || 'Receive the latest listings and stories from across Egypt.'}</p>
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
            <h2 style={{ color: 'var(--text)', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', marginBottom: '1rem' }}>{props?.title || 'Explore Egypt'}</h2>
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
export default function DynamicHomepageRenderer({ layout, settings, pageId = 'main', pagePath, sectorDirectoryTopContent, homeData }: { layout: any[], settings: any, pageId?: string, pagePath?: string; sectorDirectoryTopContent?: React.ReactNode; homeData?: HomeData }) {
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
              <SectionIndexContext.Provider value={{ isFirst: idx === 0 }}>
                <SectionRenderer
                  type={section.type ?? ''}
                  props={section.props}
                  siteSettings={settings}
                  pageId={pageId}
                  pagePath={pagePath}
                  sectorDirectoryTopContent={sectorDirectoryTopContent}
                  homeData={homeData}
                />
              </SectionIndexContext.Provider>
            </div>
          );
        } catch {
          return null;
        }
      })}
    </div>
  );
}
