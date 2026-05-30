#!/usr/bin/env node

const db = require('./src/lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running migration: Create admin-editable pages tables...');
    
    const migrationSql = fs.readFileSync(
      path.join(__dirname, 'migrations/011_create_admin_editable_pages.sql'),
      'utf8'
    );

    // Split by semicolon and execute each statement
    const statements = migrationSql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  → Executing: ${statement.substring(0, 60)}...`);
        await db.query(statement);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('   - Created table: page_services');
    console.log('   - Created table: page_experience_categories');
    console.log('   - Inserted initial data for both tables');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
