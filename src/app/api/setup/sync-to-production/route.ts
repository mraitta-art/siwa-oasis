import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/setup/sync-to-production
 * Synchronize component registry from development to production
 * - Validates all components
 * - Exports component definitions
 * - Creates migration package
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    if (process.env.NODE_ENV === 'production') {
      await requireAdmin();
    }

    // 1. Fetch all components from registry
    const components = await query(`
      SELECT 
        id, \`key\`, name, description, icon, zone, category,
        enabled, manager_url, default_props, required_props,
        min_version, deprecated, sort_order, created_by, created_at
      FROM site_components
      ORDER BY zone, sort_order
    `);

    // 2. Validate components
    const validation = {
      total: components.length,
      valid: 0,
      issues: [] as string[]
    };

    const validComponents = [];
    for (const comp of components) {
      const issues = [];
      
      if (!comp.key) issues.push('Missing key');
      if (!comp.name) issues.push('Missing name');
      if (!comp.zone) issues.push('Missing zone');
      if (!['header', 'body', 'footer'].includes(comp.zone)) issues.push('Invalid zone');

      if (issues.length === 0) {
        validation.valid++;
        validComponents.push(comp);
      } else {
        validation.issues.push(`${comp.name || comp.key}: ${issues.join(', ')}`);
      }
    }

    // 3. Create export package
    const exportPackage = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      components: validComponents,
      validation,
      metadata: {
        totalComponents: components.length,
        validComponents: validation.valid,
        zones: [...new Set(validComponents.map(c => c.zone))],
        categories: [...new Set(validComponents.map(c => c.category).filter(c => c))],
      }
    };

    // 4. Generate SQL migration script
    const migrationSQL = `
-- Component Registry Migration
-- Generated: ${new Date().toISOString()}
-- Synced from: ${process.env.NODE_ENV}
-- Components: ${validation.valid}

SET FOREIGN_KEY_CHECKS=0;

-- Backup existing components
CREATE TABLE IF NOT EXISTS site_components_backup_${Date.now()} AS SELECT * FROM site_components;

-- Delete old components (optional - uncomment to refresh)
-- DELETE FROM site_components WHERE created_by = 'system';

-- Insert new/updated components
${validComponents.map(comp => `
INSERT INTO site_components 
(id, \`key\`, name, description, icon, zone, category, enabled, manager_url, default_props, required_props, min_version, deprecated, sort_order, created_by, created_at)
VALUES (
  '${comp.id}',
  '${comp.key.replace(/'/g, "\\'")}',
  '${comp.name.replace(/'/g, "\\'")}',
  ${comp.description ? `'${comp.description.replace(/'/g, "\\'")}'` : 'NULL'},
  '${comp.icon}',
  '${comp.zone}',
  ${comp.category ? `'${comp.category.replace(/'/g, "\\'")}'` : 'NULL'},
  ${comp.enabled ? 1 : 0},
  ${comp.manager_url ? `'${comp.manager_url.replace(/'/g, "\\'")}'` : 'NULL'},
  ${comp.default_props ? `'${JSON.stringify(comp.default_props).replace(/'/g, "\\'")}'` : 'NULL'},
  ${comp.required_props ? `'${JSON.stringify(comp.required_props).replace(/'/g, "\\'")}'` : 'NULL'},
  ${comp.min_version ? `'${comp.min_version}'` : 'NULL'},
  ${comp.deprecated ? 1 : 0},
  ${comp.sort_order},
  'migration',
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  icon = VALUES(icon),
  category = VALUES(category),
  enabled = VALUES(enabled),
  manager_url = VALUES(manager_url),
  sort_order = VALUES(sort_order),
  updated_at = NOW();
`).join('\n')}

SET FOREIGN_KEY_CHECKS=1;

-- Verify migration
SELECT COUNT(*) as component_count FROM site_components;
SELECT zone, COUNT(*) as count FROM site_components GROUP BY zone;
    `.trim();

    return NextResponse.json({
      success: true,
      message: 'Component registry exported and ready for production sync',
      exportPackage,
      migrationSQL,
      instructions: [
        '1. Download the migrationSQL script',
        '2. Connect to production database',
        '3. Execute the SQL script',
        '4. Verify: SELECT COUNT(*) FROM site_components',
        '5. Test component registry at /jana/components',
        '6. Test site builder at /jana/website'
      ]
    });
  } catch (e: any) {
    console.error('Production sync error:', e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/sync-to-production
 * Check sync status and differences
 */
export async function GET(request: NextRequest) {
  try {
    const components = await query(`
      SELECT zone, COUNT(*) as count, SUM(IF(enabled=true,1,0)) as enabled
      FROM site_components
      GROUP BY zone
    `);

    const deprecatedCount = await query('SELECT COUNT(*) as count FROM site_components WHERE deprecated = true');

    return NextResponse.json({
      success: true,
      status: 'ready_to_sync',
      environment: process.env.NODE_ENV,
      registry: {
        byZone: components,
        deprecated: deprecatedCount[0]?.count || 0,
        readyForProduction: components.length > 0
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
