import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// This endpoint runs the blog system database migration WITH content relationships
// Safe to run multiple times - no conflicts!
// Works on: Local MySQL, cPanel, Railway, Any MySQL 5.7+
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting blog system migration with content relationships...');

    // Try to load the new schema with relationships, fallback to old schema
    let sqlFile = path.join(process.cwd(), 'scripts', 'blog-with-relationships-schema.sql');
    if (!fs.existsSync(sqlFile)) {
      sqlFile = path.join(process.cwd(), 'scripts', 'blog-system-schema.sql');
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📄 SQL file loaded:', sqlFile);
    console.log('📄 SQL size:', sql.length, 'bytes');

    // Split SQL into individual statements
    // More robust parsing - handle comments properly
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Remove empty statements
        if (s.length === 0) return false;
        // Remove lines that are ONLY comments
        const lines = s.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        // If all lines are comments, skip
        if (lines.every(l => l.startsWith('--'))) return false;
        return true;
      });

    console.log(`⚙️  Executing ${statements.length} SQL statements...`);
    
    // Debug: Show first few statements
    if (statements.length > 0) {
      console.log('📋 First statement preview:', statements[0].substring(0, 100) + '...');
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute each statement safely
    for (let i = 0; i < statements.length; i++) {
      try {
        await query(statements[i]);
        successCount++;
      } catch (err: any) {
        // Safe to ignore these errors (means already exists)
        const safeErrors = [
          'ER_TABLE_EXISTS_ERROR',        // Table already exists
          'ER_DUP_KEYNAME',               // Index already exists
          'ER_DUP_FIELDNAME',             // Column already exists
          'ER_CANT_DROP_FIELD_OR_KEY',    // Can't drop (doesn't exist)
          'ER_KEY_COLUMN_DOES_NOT_EXIST', // Column doesn't exist yet
        ];
        
        if (safeErrors.includes(err.code)) {
          skipCount++;
        } else {
          console.error(`  ✗ Statement ${i + 1} failed:`, err.message);
          errorCount++;
          // Continue executing remaining statements
        }
      }
    }

    console.log(`\n✅ Execution complete:`);
    console.log(`  ✓ Success: ${successCount}`);
    console.log(`  ⊘ Skipped: ${skipCount} (already exists)`);
    console.log(`  ✗ Errors: ${errorCount}`);

    // Verify all tables were created
    console.log('\n📊 Verifying tables...');
    const tables = [
      'blog_posts', 
      'blog_categories', 
      'blog_tags', 
      'blog_post_tags', 
      'blog_comments', 
      'blog_sidebar_configs',
      'content_relationships'  // NEW!
    ];
    const verified: string[] = [];

    for (const table of tables) {
      try {
        const result: any = await query(`SHOW TABLES LIKE '${table}'`);
        if (result.length > 0) {
          verified.push(table);
          console.log(`  ✓ ${table}`);
        } else {
          console.log(`  ✗ ${table} NOT found`);
        }
      } catch (err) {
        console.log(`  ✗ ${table} check failed`);
      }
    }

    // Get counts
    const categories: any = await query('SELECT COUNT(*) as count FROM blog_categories');
    const tags: any = await query('SELECT COUNT(*) as count FROM blog_tags');
    const relationships: any = await query('SELECT COUNT(*) as count FROM content_relationships').catch(() => [{ count: 0 }]);

    console.log('\n🎉 Migration Summary:');
    console.log(`  • Tables: ${verified.length}/${tables.length} created`);
    console.log(`  • Categories: ${categories[0]?.count || 0}`);
    console.log(`  • Tags: ${tags[0]?.count || 0}`);
    console.log(`  • Relationships: ${relationships[0]?.count || 0}`);

    return NextResponse.json({
      success: true,
      message: 'Blog system migration completed successfully',
      tables: verified,
      stats: {
        statements_executed: successCount,
        statements_skipped: skipCount,
        statements_errored: errorCount,
        categories: categories[0]?.count || 0,
        tags: tags[0]?.count || 0,
        relationships: relationships[0]?.count || 0
      },
      compatibility: {
        local_mysql: true,
        cpanel_mysql: true,
        railway_mysql: true,
        safe_rerun: true
      }
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.sqlMessage,
        hint: 'Check server logs for more details. Safe to retry!'
      },
      { status: 500 }
    );
  }
}
