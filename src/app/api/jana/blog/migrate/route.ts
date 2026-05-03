import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// This endpoint runs the blog system database migration
// Should only be called once by admin
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting blog system migration...');

    // Read the SQL file
    const sqlFile = path.join(process.cwd(), 'scripts', 'blog-system-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 SQL file loaded:', sql.length, 'bytes');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`⚙️  Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      try {
        await query(statements[i]);
        console.log(`  ✓ Statement ${i + 1} executed`);
      } catch (err: any) {
        // Ignore "table already exists" errors
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`  ⚠ Statement ${i + 1}: Table already exists (skipped)`);
        } else {
          console.error(`  ✗ Statement ${i + 1} failed:`, err.message);
          throw err;
        }
      }
    }

    // Verify tables
    console.log('\n✅ Verifying tables...');
    const tables = ['blog_posts', 'blog_categories', 'blog_tags', 'blog_post_tags', 'blog_comments', 'blog_sidebar_configs'];
    const verified: string[] = [];

    for (const table of tables) {
      const result: any = await query(`SHOW TABLES LIKE '${table}'`);
      if (result.length > 0) {
        verified.push(table);
        console.log(`  ✓ ${table}`);
      } else {
        console.log(`  ✗ ${table} NOT found`);
      }
    }

    // Get counts
    const categories: any = await query('SELECT COUNT(*) as count FROM blog_categories');
    const tags: any = await query('SELECT COUNT(*) as count FROM blog_tags');

    console.log('\n📊 Migration complete!');
    console.log(`  • Tables created: ${verified.length}/${tables.length}`);
    console.log(`  • Categories: ${categories[0]?.count || 0}`);
    console.log(`  • Tags: ${tags[0]?.count || 0}`);

    return NextResponse.json({
      success: true,
      message: 'Blog system database migration completed',
      tables: verified,
      stats: {
        categories: categories[0]?.count || 0,
        tags: tags[0]?.count || 0
      }
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.sqlMessage 
      },
      { status: 500 }
    );
  }
}
