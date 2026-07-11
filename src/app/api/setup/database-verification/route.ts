import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

/**
 * POST /api/setup/database-verification
 * Verifies all necessary database schema for comparison feature
 * Adds missing columns if needed
 */

export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // 1. Verify sections table has is_universal column
    try {
      const cols = await query(`DESCRIBE sections`);
      const hasUniversal = cols.some((c: any) => c.Field === 'is_universal');
      
      if (!hasUniversal) {
        await execute(`ALTER TABLE sections ADD COLUMN is_universal BOOLEAN DEFAULT FALSE`);
        results.push({ check: 'sections.is_universal', status: 'ADDED' });
      } else {
        results.push({ check: 'sections.is_universal', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'sections.is_universal', status: 'ERROR', detail: e.message });
    }

    // 2. Verify sections table has display_order column
    try {
      const cols = await query(`DESCRIBE sections`);
      const hasOrder = cols.some((c: any) => c.Field === 'display_order');
      
      if (!hasOrder) {
        await execute(`ALTER TABLE sections ADD COLUMN display_order INT DEFAULT 0`);
        results.push({ check: 'sections.display_order', status: 'ADDED' });
      } else {
        results.push({ check: 'sections.display_order', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'sections.display_order', status: 'ERROR', detail: e.message });
    }

    // 3. Verify form_fields table has is_comparable column
    try {
      const cols = await query(`DESCRIBE form_fields`);
      const hasComparable = cols.some((c: any) => c.Field === 'is_comparable');
      
      if (!hasComparable) {
        await execute(`ALTER TABLE form_fields ADD COLUMN is_comparable BOOLEAN DEFAULT FALSE`);
        results.push({ check: 'form_fields.is_comparable', status: 'ADDED' });
      } else {
        results.push({ check: 'form_fields.is_comparable', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'form_fields.is_comparable', status: 'ERROR', detail: e.message });
    }

    // 4. Create comparison_matrix table for caching comparison results
    try {
      await execute(`
        CREATE TABLE IF NOT EXISTS comparison_matrix (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          business_ids JSON NOT NULL,
          section_ids JSON,
          comparison_data LONGTEXT NOT NULL,
          comparison_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP DEFAULT DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY),
          KEY idx_created (created_at),
          KEY idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push({ check: 'comparison_matrix table', status: 'EXISTS/CREATED' });
    } catch (e: any) {
      results.push({ check: 'comparison_matrix table', status: 'ERROR', detail: e.message });
    }

    // 5. Verify businesses table
    try {
      const cols = await query(`DESCRIBE businesses`);
      const hasActive = cols.some((c: any) => c.Field === 'active');
      
      if (!hasActive) {
        await execute(`ALTER TABLE businesses ADD COLUMN active BOOLEAN DEFAULT TRUE`);
        results.push({ check: 'businesses.active', status: 'ADDED' });
      } else {
        results.push({ check: 'businesses.active', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'businesses.active', status: 'ERROR', detail: e.message });
    }

    // 6. Check for indexes on comparison-heavy queries
    try {
      const indexes = await query(`SHOW INDEX FROM businesses WHERE Key_name = 'idx_type_active'`);
      
      if (indexes.length === 0) {
        await execute(`CREATE INDEX idx_type_active ON businesses(type_id, active)`);
        results.push({ check: 'businesses index (type_id, active)', status: 'CREATED' });
      } else {
        results.push({ check: 'businesses index (type_id, active)', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'businesses index', status: 'ERROR', detail: e.message });
    }

    // 6b. Ensure anonymous system profile exists (Rule 2: every business has a default vendor)
    try {
      await execute(`
        INSERT IGNORE INTO profiles (id, email, role, display_name, created_at)
        VALUES ('anonymous', 'anonymous@siwa.today', 'anonymous', 'Unclaimed Listing', NOW())
      `);
      results.push({ check: 'anonymous profile', status: 'EXISTS/CREATED' });
    } catch (e: any) {
      results.push({ check: 'anonymous profile', status: 'ERROR', detail: e.message });
    }

    // 6c. Add is_claimed column to businesses (Rule 2: explicit claim state)
    try {
      const cols = await query(`DESCRIBE businesses`);
      const hasClaimed = cols.some((c: any) => c.Field === 'is_claimed');
      if (!hasClaimed) {
        await execute(`ALTER TABLE businesses ADD COLUMN is_claimed TINYINT(1) NOT NULL DEFAULT 0`);
        // Backfill: real vendors = claimed
        await execute(`UPDATE businesses SET is_claimed = 1 WHERE vendor_id IS NOT NULL AND vendor_id != 'anonymous' AND vendor_id != ''`);
        // Backfill: null vendor_id → anonymous
        await execute(`UPDATE businesses SET vendor_id = 'anonymous' WHERE vendor_id IS NULL OR vendor_id = ''`);
        results.push({ check: 'businesses.is_claimed', status: 'ADDED + BACKFILLED' });
      } else {
        results.push({ check: 'businesses.is_claimed', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'businesses.is_claimed', status: 'ERROR', detail: e.message });
    }

    // 7. Create section_blogs table if needed, then verify visibility columns
    try {
      await execute(`
        CREATE TABLE IF NOT EXISTS section_blogs (
          id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          section_id   VARCHAR(36) NOT NULL,
          business_id  VARCHAR(100) NOT NULL,
          vendor_id    VARCHAR(100) NOT NULL,
          title        VARCHAR(500) NOT NULL,
          content      LONGTEXT,
          excerpt      VARCHAR(1000),
          show_on_main      TINYINT(1) NOT NULL DEFAULT 1,
          show_on_minisite  TINYINT(1) NOT NULL DEFAULT 1,
          status   ENUM('draft','pending','published','rejected') DEFAULT 'pending',
          approved_by  VARCHAR(100) DEFAULT NULL,
          approval_note MEDIUMTEXT,
          approved_at  TIMESTAMP NULL DEFAULT NULL,
          published_at TIMESTAMP NULL DEFAULT NULL,
          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_section_id  (section_id),
          INDEX idx_business_id (business_id),
          INDEX idx_vendor_id   (vendor_id),
          INDEX idx_status      (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push({ check: 'section_blogs table', status: 'EXISTS/CREATED' });
    } catch (e: any) {
      results.push({ check: 'section_blogs table', status: 'ERROR', detail: e.message });
    }

    // 7b. Verify section_blogs visibility columns (for tables that already existed)
    try {
      const cols = await query(`DESCRIBE section_blogs`);
      const hasMain = cols.some((c: any) => c.Field === 'show_on_main');
      const hasMini = cols.some((c: any) => c.Field === 'show_on_minisite');
      
      if (!hasMain) {
        await execute(`ALTER TABLE section_blogs ADD COLUMN show_on_main TINYINT(1) NOT NULL DEFAULT 1`);
        results.push({ check: 'section_blogs.show_on_main', status: 'ADDED' });
      } else {
        results.push({ check: 'section_blogs.show_on_main', status: 'EXISTS' });
      }
      
      if (!hasMini) {
        await execute(`ALTER TABLE section_blogs ADD COLUMN show_on_minisite TINYINT(1) NOT NULL DEFAULT 1`);
        results.push({ check: 'section_blogs.show_on_minisite', status: 'ADDED' });
      } else {
        results.push({ check: 'section_blogs.show_on_minisite', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'section_blogs columns verification', status: 'ERROR', detail: e.message });
    }

    // 8. Verify vendor_gallery table has show_on_main and show_on_minisite columns
    try {
      const cols = await query(`DESCRIBE vendor_gallery`);
      const hasMain = cols.some((c: any) => c.Field === 'show_on_main');
      const hasMini = cols.some((c: any) => c.Field === 'show_on_minisite');
      
      if (!hasMain) {
        await execute(`ALTER TABLE vendor_gallery ADD COLUMN show_on_main BOOLEAN DEFAULT TRUE`);
        results.push({ check: 'vendor_gallery.show_on_main', status: 'ADDED' });
      } else {
        results.push({ check: 'vendor_gallery.show_on_main', status: 'EXISTS' });
      }
      
      if (!hasMini) {
        await execute(`ALTER TABLE vendor_gallery ADD COLUMN show_on_minisite BOOLEAN DEFAULT TRUE`);
        results.push({ check: 'vendor_gallery.show_on_minisite', status: 'ADDED' });
      } else {
        results.push({ check: 'vendor_gallery.show_on_minisite', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'vendor_gallery columns verification', status: 'ERROR', detail: e.message });
    }

    // 9. Verify business_types table has default_template_id (parent template inheritance)
    try {
      const cols = await query(`DESCRIBE business_types`);
      const hasDefaultTmpl = cols.some((c: any) => c.Field === 'default_template_id');
      if (!hasDefaultTmpl) {
        await execute(`ALTER TABLE business_types ADD COLUMN default_template_id VARCHAR(100) DEFAULT NULL`);
        results.push({ check: 'business_types.default_template_id', status: 'ADDED' });
      } else {
        results.push({ check: 'business_types.default_template_id', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'business_types.default_template_id verification', status: 'ERROR', detail: e.message });
    }

    // 10. Verify businesses table has resolved_template_id (caching inheritance path)
    try {
      const cols = await query(`DESCRIBE businesses`);
      const hasResolvedTmpl = cols.some((c: any) => c.Field === 'resolved_template_id');
      if (!hasResolvedTmpl) {
        await execute(`ALTER TABLE businesses ADD COLUMN resolved_template_id VARCHAR(100) DEFAULT NULL`);
        await execute(`UPDATE businesses SET resolved_template_id = template_id WHERE template_id IS NOT NULL`);
        results.push({ check: 'businesses.resolved_template_id', status: 'ADDED + BACKFILLED' });
      } else {
        results.push({ check: 'businesses.resolved_template_id', status: 'EXISTS' });
      }
    } catch (e: any) {
      results.push({ check: 'businesses.resolved_template_id verification', status: 'ERROR', detail: e.message });
    }

    return NextResponse.json({
      success: true,
      message: 'Database verification complete',
      timestamp: new Date().toISOString(),
      checks: results,
      summary: {
        total: results.length,
        added: results.filter(r => r.status === 'ADDED').length,
        exists: results.filter(r => r.status === 'EXISTS' || r.status === 'EXISTS/CREATED').length,
        errors: results.filter(r => r.status === 'ERROR').length,
      }
    });
  } catch (error: any) {
    console.error('Database Verification Error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
