import { execute, query } from '../src/lib/db';

async function fixAll() {
  console.log('🔧 Fixing homepage config...');

  try {
    // 1. Build the clean homepage layout — hero_carousel_id matches our saved slides
    const cleanLayout = {
      header_components: [],
      body_components: [
        {
          id: 'h1',
          type: 'hero_carousel',
          name: 'Hero Carousel',
          zone: 'body',
          props: {
            title: 'Hero Carousel',
            carousel_id: 'discovery', // ← matches hero_carousel_discovery in DB
          },
        },
        {
          id: 'h2',
          type: 'services_hub',
          name: 'Services Hub',
          zone: 'body',
          props: { title: 'Services Hub' },
        },
        {
          id: 'h3',
          type: 'experience_categories',
          name: 'Experience Categories',
          zone: 'body',
          props: { title: 'Experience Categories' },
        },
        {
          id: 'h4',
          type: 'search_bar',
          name: 'Search Engine',
          zone: 'body',
          props: { title: 'Search Engine' },
        },
        {
          id: 'h5',
          type: 'smart_journey_planner',
          name: 'Journey Planner',
          zone: 'body',
          props: { title: 'Journey Planner' },
        },
        {
          id: 'h6',
          type: 'ecosystem_map',
          name: 'Interactive Map',
          zone: 'body',
          props: { title: 'Interactive Map' },
        },
        {
          id: 'h7',
          type: 'local_products',
          name: 'Local Products',
          zone: 'body',
          props: { title: 'Local Products' },
        },
        {
          id: 'h8',
          type: 'storytelling_section',
          name: 'Storytelling',
          zone: 'body',
          props: { title: 'Storytelling' },
        },
        {
          id: 'h9',
          type: 'partner_cta',
          name: 'Partner CTA',
          zone: 'body',
          props: { title: 'Partner CTA' },
        },
      ],
      footer_components: [],
      site_settings: {
        site_name: 'Siwa Today',
        primary_color: '#D4AF37',
        tagline: 'Experience the magic of the oasis.',
        show_logo_in_hero: false,
        carousel_autoplay: true,
        carousel_interval: 8000,
        show_watermark: true,
        logo_url: 'https://res.cloudinary.com/di8icdism/image/upload/v1778437895/siwa-oasis/businesses/mainwebsite/branding/exloixs0fegkoplpjeqh.png',
        logo_height: 40,
      },
    };

    await execute(
      `INSERT INTO website_configs (type, config, updated_at) 
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       config = VALUES(config),
       updated_at = VALUES(updated_at)`,
      ['website_main', JSON.stringify(cleanLayout)]
    );

    console.log('✅ Homepage layout updated! carousel_id → discovery');

    // 2. Verify the slides exist
    const slides = await query(
      `SELECT config FROM website_configs WHERE type = 'hero_carousel_discovery' LIMIT 1`
    );

    if (slides.length > 0) {
      const cfg = typeof slides[0].config === 'string' ? JSON.parse(slides[0].config) : slides[0].config;
      const count = cfg?.slides?.length || 0;
      console.log(`✅ Carousel slides found: ${count} slides under 'discovery'`);
    } else {
      console.log('⚠️  No slides found under hero_carousel_discovery — admin must add slides via /jana/hero-carousel');
    }

    console.log('\n🎉 All done! Visit http://localhost:3000 to see the homepage.');
    console.log('📋 Admin can manage carousel at: http://localhost:3000/jana/hero-carousel (use ID: discovery)');
    console.log('🏗️  Admin can manage layout at: http://localhost:3000/jana/website');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

fixAll();
