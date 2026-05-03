import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

// This endpoint creates the missing website_configs table
// Visit: http://localhost:3000/api/setup/create-tables
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Creating website_configs table...');

    // Create the table
    await execute(`
      CREATE TABLE IF NOT EXISTS website_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(100) UNIQUE NOT NULL,
        config JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Table created successfully!');

    // Insert default carousel config
    await execute(`
      INSERT IGNORE INTO website_configs (type, config) VALUES (?, ?)
    `, ['hero_carousel', JSON.stringify({ slides: [] })]);

    console.log('✅ Default carousel config inserted!');

    // Verify table exists
    const tables = await query(`
      SHOW TABLES LIKE 'website_configs'
    `);

    const tableExists = tables.length > 0;

    return NextResponse.json({
      success: true,
      message: 'Table created successfully!',
      tableExists: tableExists,
      tables: tables
    });

  } catch (error: any) {
    console.error('❌ Error creating table:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Check database connection in .env.local'
    }, { status: 500 });
  }
}
