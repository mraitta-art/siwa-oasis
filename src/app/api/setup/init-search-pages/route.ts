import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/setup/init-search-pages
 * Initialize default search pages after table creation
 * Creates the default "vibe-search" page if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Check if table exists
    const tableCheck = await query(`
      SELECT 1 FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'search_pages'
    `);

    if (tableCheck.length === 0) {
      return NextResponse.json(
        { error: 'search_pages table does not exist. Run /api/setup/search-pages-table first.' },
        { status: 400 }
      );
    }

    // Check if default page already exists
    const existing = await query(
      'SELECT id FROM search_pages WHERE slug = ?',
      ['vibe-search']
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Default vibe-search page already exists'
      });
    }

    // Create default vibe-search page
    const pageId = uuidv4();
    await execute(
      `INSERT INTO search_pages (
        id, slug, title, description, search_engine_id,
        hero_enabled, hero_carousel_id, hero_height_vh, hero_autoplay,
        components, is_published, is_visible,
        custom_seo_title, custom_seo_description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pageId,
        'vibe-search',
        'Discover Your Siwa Vibe',
        'Explore experiences and businesses through the unique vibes of Siwa Oasis. Select your vibe and discover what awaits.',
        null, // Will use default vibe search engine
        true, // hero_enabled
        'main_hero',
        85,
        true,
        JSON.stringify([]), // No additional components
        true, // is_published
        true, // is_visible
        'Discover Your Siwa Vibe | Siwa Today',
        'Explore authentic experiences and businesses in Siwa Oasis. Find exactly what you\'re looking for through curated vibe-based search.',
        'system'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Default search pages initialized',
      pages: ['vibe-search']
    });
  } catch (e: any) {
    console.error('Error initializing search pages:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/init-search-pages
 * Check initialization status
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const pages = await query(
      'SELECT slug, title, is_published FROM search_pages ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      initialized: pages.length > 0,
      pages
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
