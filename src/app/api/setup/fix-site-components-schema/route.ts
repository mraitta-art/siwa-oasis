import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

/**
 * POST /api/setup/fix-site-components-schema
 * Fix the site_components table schema to allow same key in different zones
 * Drops the existing table and recreates it with proper unique constraints
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for setup endpoints in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    // Drop existing table
    await execute(`DROP TABLE IF EXISTS site_components`);
    console.log('[SETUP] Dropped existing site_components table');

    // Create the corrected table with composite unique key on (key, zone)
    await execute(`
      CREATE TABLE site_components (
        id VARCHAR(36) PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL COMMENT 'Component key (hero_carousel, search_bar, etc.)',
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
        
        UNIQUE KEY uk_key_zone (\`key\`, zone) COMMENT 'Same component can appear in multiple zones',
        INDEX idx_zone (zone),
        INDEX idx_category (category),
        INDEX idx_enabled (enabled),
        INDEX idx_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[SETUP] Created corrected site_components table');

    return NextResponse.json({
      success: true,
      message: 'Schema fixed - table recreated with composite unique key (key, zone)',
      nextStep: 'Call POST /api/setup/init-site-components to seed components'
    });
  } catch (e: any) {
    console.error('Error fixing site_components schema:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
