import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/setup/init-site-components
 * Seed default components from the hardcoded PALETTE into the database
 * This initializes the component registry
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for setup endpoints in development
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin();
    }

    // Check if table exists
    const tableCheck = await query(`
      SELECT 1 FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'site_components'
    `);

    if (tableCheck.length === 0) {
      return NextResponse.json(
        { error: 'site_components table does not exist. Run /api/setup/site-components-table first.' },
        { status: 400 }
      );
    }

    // Default components from PALETTE
    const DEFAULT_COMPONENTS = [
      // Header
      { key: 'hero_carousel', name: 'Hero Carousel', zone: 'header', category: 'Hero', icon: '🎬', manager_url: '/jana/hero-carousel', sort_order: 10 },
      { key: 'search_bar', name: 'Search Bar (Compact)', zone: 'header', category: 'Search', icon: '🔍', manager_url: '/jana/search-engines', sort_order: 20 },

      // Body
      { key: 'hero_carousel', name: 'Hero Carousel', zone: 'body', category: 'Hero', icon: '🎬', manager_url: '/jana/hero-carousel', sort_order: 10 },
      { key: 'services_hub', name: 'Services Hub', zone: 'body', category: 'Content', icon: '🏛️', manager_url: '/jana/businesses', sort_order: 20 },
      { key: 'experience_categories', name: 'Experience Categories', zone: 'body', category: 'Content', icon: '🎭', manager_url: null, sort_order: 30 },
      { key: 'search_bar', name: 'Search Engine (Full)', zone: 'body', category: 'Search', icon: '🔍', manager_url: '/jana/search-engines', sort_order: 40 },
      { key: 'smart_journey_planner', name: 'Journey Planner', zone: 'body', category: 'Content', icon: '🗓️', manager_url: null, sort_order: 50 },
      { key: 'ecosystem_map', name: 'Interactive Map', zone: 'body', category: 'Content', icon: '🗺️', manager_url: null, sort_order: 60 },
      { key: 'local_products', name: 'Local Products', zone: 'body', category: 'Commerce', icon: '🫒', manager_url: null, sort_order: 70 },
      { key: 'storytelling_section', name: 'Storytelling', zone: 'body', category: 'Content', icon: '📖', manager_url: null, sort_order: 80 },
      { key: 'partner_cta', name: 'Partner CTA', zone: 'body', category: 'CTA', icon: '🤝', manager_url: null, sort_order: 90 },
      { key: 'blog', name: 'Blog / Articles', zone: 'body', category: 'Content', icon: '📰', manager_url: '/jana/blog', sort_order: 100 },
      { key: 'featured_vibe', name: 'Featured Vibe Story', zone: 'body', category: 'Content', icon: '🪄', manager_url: null, sort_order: 110 },
      { key: 'investment_feed', name: 'Investment Marketplace', zone: 'body', category: 'Commerce', icon: '💎', manager_url: null, sort_order: 120 },
      { key: 'services', name: 'Business Listings CTA', zone: 'body', category: 'Content', icon: '🏢', manager_url: '/jana/businesses', sort_order: 130 },
      { key: 'testimonials', name: 'Testimonials', zone: 'body', category: 'Content', icon: '⭐', manager_url: null, sort_order: 140 },
      { key: 'newsletter', name: 'Newsletter Signup', zone: 'body', category: 'CTA', icon: '📧', manager_url: null, sort_order: 150 },
      { key: 'search_pages', name: 'Search Pages', zone: 'body', category: 'Search', icon: '🔎', manager_url: '/jana/search-pages', sort_order: 160 },

      // Footer
      { key: 'partner_cta', name: 'Partner CTA (Footer)', zone: 'footer', category: 'CTA', icon: '🤝', manager_url: null, sort_order: 10 },
      { key: 'blog', name: 'Recent Articles (Footer)', zone: 'footer', category: 'Content', icon: '📰', manager_url: '/jana/blog', sort_order: 20 },
    ];

    let created = 0;
    let skipped = 0;

    for (const comp of DEFAULT_COMPONENTS) {
      // Check if component already exists (by key + zone combo for uniqueness)
      const existing = await query(
        'SELECT id FROM site_components WHERE `key` = ? AND zone = ?',
        [comp.key, comp.zone]
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const id = uuidv4();
      await execute(
        `INSERT INTO site_components (id, \`key\`, name, zone, category, icon, manager_url, sort_order, enabled, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          comp.key,
          comp.name,
          comp.zone,
          comp.category,
          comp.icon,
          comp.manager_url,
          comp.sort_order,
          true,
          'system'
        ]
      );
      created++;
    }

    return NextResponse.json({
      success: true,
      message: `Initialized site components registry`,
      created,
      skipped,
      total: created + skipped
    });
  } catch (e: any) {
    console.error('Error initializing site components:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/init-site-components
 * Check initialization status
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const components = await query(
      'SELECT COUNT(*) as total FROM site_components'
    );

    return NextResponse.json({
      success: true,
      initialized: components[0]?.total > 0,
      componentCount: components[0]?.total || 0
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
