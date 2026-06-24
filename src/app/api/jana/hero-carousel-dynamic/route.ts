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
}

// GET: Load dynamic carousel slides from multiple data sources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBusinesses = searchParams.get('businesses') !== 'false';
    const includeJourneys = searchParams.get('journeys') !== 'false';
    const includeInvestment = searchParams.get('investment') !== 'false';
    const includeRegistration = searchParams.get('registration') !== 'false';

    const slides: Slide[] = [];

    // ─ 0. MANUALLY SAVED SLIDES (HIGHEST PRIORITY — always shown first) ──────
    // These are slides the admin explicitly added via the Hero Carousel Editor,
    // including any YouTube videos, uploaded images, or custom slides.
    try {
      const savedConfig = await query(
        `SELECT config FROM website_configs WHERE type = 'hero_carousel_main' LIMIT 1`
      );
      if (savedConfig && savedConfig.length > 0) {
        const config = typeof savedConfig[0].config === 'string'
          ? JSON.parse(savedConfig[0].config)
          : savedConfig[0].config;
        const savedSlides: Slide[] = config?.slides || [];
        if (savedSlides.length > 0) {
          // Sort by displayOrder if available
          savedSlides.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          slides.push(...savedSlides);
        }
      }
    } catch (e) {
      console.error('Failed to fetch manually saved carousel slides:', e);
    }

    // ─ 1. BUSINESSES/SERVICES SLIDES ────────────────────────────────────────
    if (includeBusinesses) {
      try {
        // Try to fetch from page_services
        const services = await query(
          `SELECT id, name, tagline, image_url, icon 
           FROM page_services 
           WHERE is_visible = 1 
           ORDER BY display_order ASC 
           LIMIT 5`
        );

        if (services && services.length > 0) {
          services.forEach((service: any) => {
            // Don't duplicate manually added slides
            const alreadyAdded = slides.some(s => s.id === `business_${service.id}`);
            if (!alreadyAdded && service.image_url) {
              slides.push({
                id: `business_${service.id}`,
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
    }

    // ─ 2. JOURNEY TEMPLATES SLIDES ──────────────────────────────────────────
    if (includeJourneys) {
      try {
        const journeys = await query(
          `SELECT id, name, description, featured_image_url, duration_days, estimated_cost_usd_min, estimated_cost_usd_max, is_investment_journey
           FROM journey_templates 
           WHERE is_visible = 1 AND is_investment_journey = 0
           ORDER BY display_order ASC 
           LIMIT 4`
        );

        if (journeys && journeys.length > 0) {
          journeys.forEach((journey: any) => {
            const alreadyAdded = slides.some(s => s.id === `journey_${journey.id}`);
            if (!alreadyAdded && journey.featured_image_url) {
              slides.push({
                id: `journey_${journey.id}`,
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
    }

    // ─ 3. INVESTMENT JOURNEYS SLIDES ───────────────────────────────────────
    if (includeInvestment) {
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
            const alreadyAdded = slides.some(s => s.id === `investment_${inv.id}`);
            if (!alreadyAdded && inv.featured_image_url) {
              slides.push({
                id: `investment_${inv.id}`,
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
    }

    // ─ 4. REGISTRATION & OFFER WORKFLOW SLIDES (only if no manual slides exist) ─
    // Only add these branded workflow slides if the admin hasn't configured
    // their own custom slides, to avoid cluttering the carousel.
    if (includeRegistration && slides.length === 0) {
      const workflowSlides: Slide[] = [
        {
          id: 'workflow_register',
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
      slides.push(...workflowSlides);
    }

    // Fallback slides if absolutely no data found
    if (slides.length === 0) {
      slides.push({
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

    return NextResponse.json({ 
      slides, 
      count: slides.length,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error('Failed to load dynamic hero carousel:', e);
    
    // Return minimal fallback
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
