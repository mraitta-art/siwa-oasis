import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Dynamic carousel endpoint that aggregates data from multiple sources
interface Slide {
  id: string;
  type: 'image' | 'youtube' | 'video' | 'branded';
  mediaUrl: string | null;
  title: string;
  subtitle: string;
  caption?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaType?: 'page' | 'search' | 'external' | 'custom';
  overlayOpacity?: number;
  animation?: 'fade' | 'zoom' | 'slide' | 'kenburns';
  displayOrder?: number;
  imageFit?: 'cover' | 'contain';
  imagePosition?: 'center' | 'top' | 'bottom';
  bgColor?: string;
  _source?: 'manual' | 'business' | 'journey' | 'investment' | 'workflow';
  isOverride?: boolean;
}

// GET: Load dynamic carousel slides from multiple data sources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBusinesses = searchParams.get('businesses') !== 'false';
    const includeJourneys = searchParams.get('journeys') !== 'false';
    const includeInvestment = searchParams.get('investment') !== 'false';
    const includeRegistration = searchParams.get('registration') !== 'false';

    // Dictionaries for active dynamic records from DB mapped to Slide representations
    const dbSlidesMap = new Map<string, Slide>();

    // 1. Load active businesses/services
    try {
      const services = await query(
        `SELECT id, name, tagline, image_url, icon 
         FROM page_services 
         WHERE is_visible = 1 
         ORDER BY display_order ASC 
         LIMIT 5`
      );

      if (services && services.length > 0) {
        services.forEach((service: any) => {
          if (service.image_url) {
            dbSlidesMap.set(`business_${service.id}`, {
              id: `business_${service.id}`,
              _source: 'business',
              type: 'image',
              mediaUrl: service.image_url,
              title: `🏢 ${service.name}`,
              subtitle: 'Verified Business',
              caption: service.tagline || 'Authentic Siwa Experience',
              ctaText: 'Explore This Business',
              ctaLink: `/search/vibe?service=${service.id}`,
              ctaType: 'search',
              animation: 'zoom',
              overlayOpacity: 0.4
            });
          }
        });
      }
    } catch (e) {
      console.error('Failed to fetch businesses for carousel:', e);
    }

    // 2. Load active journeys
    try {
      const journeys = await query(
        `SELECT id, name, description, featured_image_url, duration_days, estimated_cost_usd_min, estimated_cost_usd_max
         FROM journey_templates 
         WHERE is_visible = 1 AND is_investment_journey = 0
         ORDER BY display_order ASC 
         LIMIT 4`
      );

      if (journeys && journeys.length > 0) {
        journeys.forEach((journey: any) => {
          if (journey.featured_image_url) {
            dbSlidesMap.set(`journey_${journey.id}`, {
              id: `journey_${journey.id}`,
              _source: 'journey',
              type: 'image',
              mediaUrl: journey.featured_image_url,
              title: `✈️ ${journey.name}`,
              subtitle: `${journey.duration_days}D Journey • $${journey.estimated_cost_usd_min}-$${journey.estimated_cost_usd_max}`,
              caption: journey.description || 'Curated Experience',
              ctaText: 'View Journey',
              ctaLink: `/journeys/${journey.id}`,
              ctaType: 'page',
              animation: 'kenburns',
              overlayOpacity: 0.3
            });
          }
        });
      }
    } catch (e) {
      console.error('Failed to fetch journeys for carousel:', e);
    }

    // 3. Load active investment journeys
    try {
      const investmentJourneys = await query(
        `SELECT id, name, description, featured_image_url, duration_days, estimated_cost_usd_min, estimated_cost_usd_max, minimum_investment_usd, estimated_roi_percent
         FROM journey_templates 
         WHERE is_visible = 1 AND is_investment_journey = 1
         ORDER BY display_order ASC 
         LIMIT 3`
      );

      if (investmentJourneys && investmentJourneys.length > 0) {
        investmentJourneys.forEach((inv: any) => {
          if (inv.featured_image_url) {
            dbSlidesMap.set(`investment_${inv.id}`, {
              id: `investment_${inv.id}`,
              _source: 'investment',
              type: 'image',
              mediaUrl: inv.featured_image_url,
              title: `💼 ${inv.name}`,
              subtitle: `${inv.estimated_roi_percent}% ROI • Min: $${inv.minimum_investment_usd?.toLocaleString()}`,
              caption: `${inv.duration_days}D Journey - Investment Opportunity: ${inv.description?.substring(0, 100)}...`,
              ctaText: 'View Investment',
              ctaLink: `/journeys/${inv.id}`,
              ctaType: 'page',
              animation: 'slide',
              overlayOpacity: 0.35
            });
          }
        });
      }
    } catch (e) {
      console.error('Failed to fetch investment journeys for carousel:', e);
    }

    // 4. Load static workflow slides
    const workflowSlides: Slide[] = [
      {
        id: 'workflow_register',
        _source: 'workflow',
        type: 'branded',
        mediaUrl: null,
        title: '📝 Create Your Request',
        subtitle: 'Tell us your preferences',
        caption: 'Fill out a simple questionnaire about your interests, budget, and travel dates. The more details you provide, the better offers you\'ll receive.',
        ctaText: 'Start Request',
        ctaLink: '/journeys?action=request',
        ctaType: 'page',
        animation: 'fade',
        overlayOpacity: 0.5
      },
      {
        id: 'workflow_match',
        _source: 'workflow',
        type: 'branded',
        mediaUrl: null,
        title: '🔍 We Find The Best Matches',
        subtitle: 'Our network gets to work',
        caption: 'We analyze your preferences and connect you with the most relevant businesses and journey providers from our verified network.',
        ctaText: 'Learn More',
        ctaLink: '/how-it-works',
        ctaType: 'page',
        animation: 'fade',
        overlayOpacity: 0.5
      },
      {
        id: 'workflow_offers',
        _source: 'workflow',
        type: 'branded',
        mediaUrl: null,
        title: '💎 Receive Exclusive Offers',
        subtitle: 'Customized for you',
        caption: 'Get personalized offers directly from businesses, with special rates and packages tailored to your specific needs and budget.',
        ctaText: 'Check Offers',
        ctaLink: '/my-requests',
        ctaType: 'page',
        animation: 'fade',
        overlayOpacity: 0.5
      },
      {
        id: 'workflow_book',
        _source: 'workflow',
        type: 'branded',
        mediaUrl: null,
        title: '✅ Book & Enjoy',
        subtitle: 'Your journey awaits',
        caption: 'Compare offers side-by-side, select the best fit, and book your experience. Enjoy full support throughout your journey.',
        ctaText: 'Get Started',
        ctaLink: '/journeys?action=request',
        ctaType: 'page',
        animation: 'fade',
        overlayOpacity: 0.5
      }
    ];
    workflowSlides.forEach(s => dbSlidesMap.set(s.id, s));

    // Load saved configuration and deleted ID track list
    let savedSlides: Slide[] = [];
    let deletedDynamicIds: string[] = [];
    let sourceType = 'hero_carousel_main';

    async function loadSavedCarouselConfig() {
      const fallbackTypes = ['hero_carousel_main', 'hero_carousel_discovery'];
      for (const type of fallbackTypes) {
        try {
          const savedConfig = await query(
            `SELECT config FROM website_configs WHERE type = ? LIMIT 1`,
            [type]
          );
          if (savedConfig && savedConfig.length > 0) {
            const config = typeof savedConfig[0].config === 'string'
              ? JSON.parse(savedConfig[0].config)
              : savedConfig[0].config;
            return { config, type };
          }
        } catch (e) {
          console.error(`Failed to fetch manually saved carousel slides for ${type}:`, e);
        }
      }
      return { config: null, type: null };
    }

    try {
      const result = await loadSavedCarouselConfig();
      if (result.config) {
        savedSlides = result.config?.slides || [];
        deletedDynamicIds = result.config?.deletedDynamicIds || [];
        sourceType = result.type || sourceType;
      }
    } catch (e) {
      console.error('Failed to fetch manually saved carousel slides:', e);
    }

    const finalSlides: Slide[] = [];
    const usedIds = new Set<string>();

    if (savedSlides.length > 0) {
      // Reconstruct slides using the saved order
      for (const saved of savedSlides) {
        if (saved.id.startsWith('slide_')) {
          // Manual custom slide - use directly
          finalSlides.push({ ...saved, _source: 'manual' });
          usedIds.add(saved.id);
        } else {
          // Dynamic slide - check if active in database
          const dbSlide = dbSlidesMap.get(saved.id);
          if (dbSlide) {
            if (saved.isOverride) {
              // Merge user customization overrides over the active DB entry
              finalSlides.push({
                ...dbSlide,
                ...saved,
                _source: dbSlide._source
              });
            } else {
              // Untouched dynamic slide - use latest active DB entry (enabling live updates)
              finalSlides.push(dbSlide);
            }
            usedIds.add(saved.id);
          }
        }
      }

      // Append any NEW active dynamic slides not yet saved or deleted
      const newDynamicSlides: Slide[] = [];
      dbSlidesMap.forEach((dbSlide, id) => {
        if (!usedIds.has(id) && !deletedDynamicIds.includes(id)) {
          const isBusiness = id.startsWith('business_') && includeBusinesses;
          const isJourney = id.startsWith('journey_') && includeJourneys;
          const isInvestment = id.startsWith('investment_') && includeInvestment;
          const isWorkflow = id.startsWith('workflow_') && includeRegistration && finalSlides.length === 0 && newDynamicSlides.length === 0;

          if (isBusiness || isJourney || isInvestment || isWorkflow) {
            newDynamicSlides.push(dbSlide);
          }
        }
      });
      finalSlides.push(...newDynamicSlides);

    } else {
      // Default dynamic merging when no saved layout is found
      if (includeBusinesses) {
        dbSlidesMap.forEach((slide, id) => {
          if (id.startsWith('business_')) finalSlides.push(slide);
        });
      }
      if (includeJourneys) {
        dbSlidesMap.forEach((slide, id) => {
          if (id.startsWith('journey_')) finalSlides.push(slide);
        });
      }
      if (includeInvestment) {
        dbSlidesMap.forEach((slide, id) => {
          if (id.startsWith('investment_')) finalSlides.push(slide);
        });
      }
      if (includeRegistration && finalSlides.length === 0) {
        dbSlidesMap.forEach((slide, id) => {
          if (id.startsWith('workflow_')) finalSlides.push(slide);
        });
      }
    }

    // If completely empty, insert a fallback slide
    if (finalSlides.length === 0) {
      finalSlides.push({
        id: 'default_hero',
        type: 'branded',
        mediaUrl: null,
        title: 'Welcome to Siwa Oasis',
        subtitle: 'Authentic Experiences, Investment Opportunities',
        caption: 'Discover curated journeys and investment opportunities in the heart of the Siwa Oasis',
        ctaText: 'Explore Now',
        ctaLink: '/',
        ctaType: 'page',
        animation: 'kenburns',
        overlayOpacity: 0.4
      });
    }

    // Set proper display orders matching current array position
    const orderedSlides = finalSlides.map((s, i) => ({ ...s, displayOrder: i }));

    return NextResponse.json({ 
      slides: orderedSlides, 
      count: orderedSlides.length,
      deletedDynamicIds,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error('Failed to load dynamic hero carousel:', e);
    
    return NextResponse.json({ 
      slides: [{
        id: 'error_fallback',
        type: 'branded',
        mediaUrl: null,
        title: 'Welcome to Siwa',
        subtitle: 'Discover authentic experiences',
        animation: 'fade',
        overlayOpacity: 0.4
      }],
      error: e.message
    });
  }
}
