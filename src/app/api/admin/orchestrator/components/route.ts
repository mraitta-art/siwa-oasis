import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET: List all available components for the orchestrator
export async function GET(request: NextRequest) {
  try {
    // Include the hero carousel as an available component
    const components = {
      header: {
        navigation: { name: 'Navigation Bar', icon: 'fa-bars', editable: true },
        logo: { name: 'Logo Area', icon: 'fa-heading', editable: true }
      },
      body: {
        hero_carousel: { 
          name: 'Cinematic Hero Carousel', 
          icon: 'fa-film', 
          editable: true,
          hasSlides: true,
          description: 'Full-screen carousel with YouTube, images, captions, and CTAs'
        },
        gallery: { name: 'Gallery', icon: 'fa-images', editable: true },
        testimonials: { name: 'Testimonials', icon: 'fa-quote-left', editable: true },
        services: { name: 'Services', icon: 'fa-briefcase', editable: true },
        blog: { name: 'Blog Posts', icon: 'fa-newspaper', editable: true },
        map: { name: 'Map', icon: 'fa-map', editable: true },
        video: { name: 'Video Embed', icon: 'fa-video', editable: true },
        cta_banner: { name: 'CTA Banner', icon: 'fa-bullhorn', editable: true }
      },
      footer: {
        contact: { name: 'Contact Info', icon: 'fa-envelope', editable: true },
        social: { name: 'Social Links', icon: 'fa-share-alt', editable: true },
        copyright: { name: 'Copyright', icon: 'fa-copyright', editable: true }
      }
    };

    return NextResponse.json(components);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Add hero carousel component to a template
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { template_id } = body;

    // Load slides from website_configs
    const results = await query(
      `SELECT config FROM website_configs WHERE type = 'hero_carousel' LIMIT 1`
    );

    let slides = [];
    if (results.length > 0) {
      const config = typeof results[0].config === 'string' 
        ? JSON.parse(results[0].config) 
        : results[0].config;
      slides = config.slides || [];
    }

    // Create carousel component
    const carouselComponent = {
      id: `comp_hero_${Date.now()}`,
      type: 'hero_carousel',
      name: 'Cinematic Hero Carousel',
      props: {
        slides: slides,
        autoPlay: true,
        autoPlayInterval: 8000,
        showIndicators: true,
        showArrows: true,
        showProgress: true,
        height: '100vh',
        transitionDuration: 1200
      }
    };

    return NextResponse.json({
      success: true,
      component: carouselComponent,
      slideCount: slides.length
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
