import fs from 'fs';
import db from './src/lib/db.js';

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const sql = fs.readFileSync('./migrations/012_create_journey_templates.sql', 'utf8');
    console.log('File size:', sql.length, 'bytes');
    
    // Get a connection from the pool
    const conn = await db.getConnection();
    console.log('✓ Connected to database');
    
    try {
      // Execute the entire SQL file (including multi-statement)
      await conn.query(sql);
      console.log('✓ SQL executed successfully');
      
      // Verify table exists
      const [tables] = await conn.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'siwa_oasis' AND TABLE_NAME = 'journey_templates'"
      );
      
      if (tables && tables.length > 0) {
        console.log('✓ Table journey_templates created successfully');
        
        // Count records
        const [records] = await conn.query('SELECT COUNT(*) as count FROM journey_templates');
        console.log(`✓ Table contains ${records[0].count} records`);
        
        console.log('\n✅ Migration completed successfully!');
      } else {
        console.error('✗ Table journey_templates not found after migration');
        process.exit(1);
      }
    } finally {
      conn.release();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', err.message);
    if (err.sql) console.error('SQL:', err.sql);
    console.error('Code:', err.code);
    process.exit(1);
  }
}

runMigration();
