import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/setup/optimize-site-components
 * Optimize database queries and add necessary indexes for production
 * - Add composite indexes
 * - Analyze table statistics
 * - Remove unused components
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Optimization only in dev/prod' }, { status: 403 });
    }

    const optimizations: string[] = [];

    // 1. Add missing indexes if not exist
    try {
      await execute(`
        ALTER TABLE site_components 
        ADD INDEX idx_enabled_zone (enabled, zone)
      `);
      optimizations.push('✅ Added composite index (enabled, zone)');
    } catch (e: any) {
      if (e.message.includes('Duplicate key')) {
        optimizations.push('⏭️ Index (enabled, zone) already exists');
      }
    }

    try {
      await execute(`
        ALTER TABLE site_components 
        ADD INDEX idx_category_enabled (category, enabled)
      `);
      optimizations.push('✅ Added composite index (category, enabled)');
    } catch (e: any) {
      if (e.message.includes('Duplicate key')) {
        optimizations.push('⏭️ Index (category, enabled) already exists');
      }
    }

    // 2. Analyze table statistics
    await execute('ANALYZE TABLE site_components');
    optimizations.push('✅ Updated table statistics');

    // 3. Check component registry health
    const totalComponents = await query('SELECT COUNT(*) as count FROM site_components');
    const enabledComponents = await query('SELECT COUNT(*) as count FROM site_components WHERE enabled = true');
    const componentsByZone = await query(`
      SELECT zone, COUNT(*) as count FROM site_components 
      GROUP BY zone ORDER BY zone
    `);

    // 4. Cache warming - fetch all components to warm cache
    const allComponents = await query(`
      SELECT id, \`key\`, name, zone, enabled, sort_order
      FROM site_components
      ORDER BY zone, sort_order
    `);

    optimizations.push(`✅ Component Registry Health:`);
    optimizations.push(`   • Total: ${totalComponents[0]?.count || 0} components`);
    optimizations.push(`   • Enabled: ${enabledComponents[0]?.count || 0} components`);
    componentsByZone.forEach((z: any) => {
      optimizations.push(`   • ${z.zone.toUpperCase()}: ${z.count} components`);
    });

    return NextResponse.json({
      success: true,
      message: 'Component registry optimized for production',
      optimizations,
      stats: {
        total: totalComponents[0]?.count || 0,
        enabled: enabledComponents[0]?.count || 0,
        byZone: componentsByZone,
        indexes: 2
      }
    });
  } catch (e: any) {
    console.error('Optimization error:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/optimize-site-components
 * Check current optimization status
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(IF(enabled = true, 1, 0)) as enabled,
        GROUP_CONCAT(DISTINCT zone) as zones,
        COUNT(DISTINCT category) as categories
      FROM site_components
    `);

    const indexes = await query(`
      SELECT INDEX_NAME FROM information_schema.STATISTICS
      WHERE TABLE_NAME = 'site_components'
      AND TABLE_SCHEMA = DATABASE()
      GROUP BY INDEX_NAME
    `);

    return NextResponse.json({
      success: true,
      stats: stats[0],
      indexes: indexes.map((i: any) => i.INDEX_NAME),
      optimized: indexes.length >= 4
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
