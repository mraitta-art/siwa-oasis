import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/setup/site-components-table
 * Initialize the site_components registry table
 * Allows admins to control which components are available in the site builder
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for setup endpoints in development
    if (process.env.NODE_ENV !== 'development') {
      await requireAdmin();
    }

    // Check if table already exists
    const tableCheck = await query(`
      SELECT 1 FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'site_components'
    `);

    if (tableCheck.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Table already exists'
      });
    }

    // Create the site_components table
    await execute(`
      CREATE TABLE IF NOT EXISTS site_components (
        id VARCHAR(36) PRIMARY KEY,
        \`key\` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique component key (hero_carousel, search_bar, etc.)',
        name VARCHAR(200) NOT NULL COMMENT 'Display name',
        description TEXT COMMENT 'Component description',
        icon VARCHAR(50) COMMENT 'Icon emoji or class',
        zone ENUM('header', 'body', 'footer') NOT NULL COMMENT 'Where component can be placed',
        category VARCHAR(50) COMMENT 'Component category (Hero, Search, Content, CTA, Footer)',
        enabled BOOLEAN DEFAULT TRUE COMMENT 'Is component available for admins to use',
        manager_url VARCHAR(200) COMMENT 'URL to component manager (/jana/hero-carousel)',
        default_props JSON COMMENT 'Default properties when component is added',
        required_props JSON COMMENT 'Required props that must be configured',
        min_version VARCHAR(20) COMMENT 'Minimum app version this component requires',
        deprecated BOOLEAN DEFAULT FALSE COMMENT 'Is this component deprecated',
        sort_order INT DEFAULT 999 COMMENT 'Display order in palette',
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_key (\`key\`),
        INDEX idx_zone (zone),
        INDEX idx_category (category),
        INDEX idx_enabled (enabled),
        INDEX idx_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    return NextResponse.json({
      success: true,
      message: 'site_components table created successfully'
    });
  } catch (e: any) {
    console.error('Error creating site_components table:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/site-components-table
 * Check if table exists and show status
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const tableCheck = await query(`
      SELECT 1 FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'site_components'
    `);

    const exists = tableCheck.length > 0;

    if (exists) {
      const count = await query('SELECT COUNT(*) as total FROM site_components');
      return NextResponse.json({
        success: true,
        exists: true,
        message: 'site_components table exists',
        componentCount: count[0]?.total || 0
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      message: 'site_components table does not exist'
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
