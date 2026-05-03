// Script to create website_configs table
// Run with: node scripts/create-configs-table.mjs

import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function createTable() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    
    connection = await createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'siwa_oasis',
    });

    console.log('✅ Connected to database');

    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS website_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(100) UNIQUE NOT NULL,
        config JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    console.log('📝 Creating website_configs table...');
    await connection.execute(createTableSQL);
    console.log('✅ Table created successfully!');

    // Insert default hero carousel config
    const insertDefaultSQL = `
      INSERT IGNORE INTO website_configs (type, config) VALUES (?, ?)
    `;

    console.log('📝 Inserting default hero carousel config...');
    await connection.execute(insertDefaultSQL, ['hero_carousel', JSON.stringify({ slides: [] })]);
    console.log('✅ Default config inserted!');

    // Verify the table exists
    const [rows] = await connection.execute(
      'SELECT type, config FROM website_configs WHERE type = ?',
      ['hero_carousel']
    );

    console.log('\n✅ VERIFICATION:');
    console.log('Table: website_configs');
    console.log('Type:', rows[0].type);
    console.log('Config:', rows[0].config);
    console.log('\n🎉 All done! The carousel should now work!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure your .env.local has correct database credentials!');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
}

createTable();
