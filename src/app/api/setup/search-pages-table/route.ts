import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/setup/search-pages-table
 * Creates the search_pages table for fully editable search pages
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Create search_pages table
    await execute(`
      CREATE TABLE IF NOT EXISTS search_pages (
        id VARCHAR(36) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        search_engine_id VARCHAR(100),
        
        -- Hero Carousel Configuration
        hero_enabled BOOLEAN DEFAULT 1,
        hero_carousel_id VARCHAR(100),
        hero_height_vh INT DEFAULT 85,
        hero_autoplay BOOLEAN DEFAULT 1,
        
        -- Layout & Components
        components JSON DEFAULT '[]',
        layout_settings JSON DEFAULT '{}',
        
        -- Visibility & Control
        is_published BOOLEAN DEFAULT 1,
        is_visible BOOLEAN DEFAULT 1,
        show_breadcrumb BOOLEAN DEFAULT 1,
        custom_seo_title VARCHAR(255),
        custom_seo_description TEXT,
        
        -- Metadata
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_slug (slug),
        INDEX idx_published (is_published),
        FOREIGN KEY (search_engine_id) REFERENCES search_engines(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    return NextResponse.json({
      success: true,
      message: 'search_pages table created successfully'
    });
  } catch (e: any) {
    console.error('Error creating search_pages table:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/search-pages-table
 * Verify table exists
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const result = await execute(`
      SELECT 1 FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'search_pages'
    `);

    if (result.length > 0) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: 'search_pages table exists'
      });
    } else {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'search_pages table does not exist'
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
