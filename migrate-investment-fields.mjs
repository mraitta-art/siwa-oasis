import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'siwa_oasis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function runMigration() {
  const conn = await pool.getConnection();
  
  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '013_add_investment_fields_to_journey_templates.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('[Migration] Reading:', migrationPath);
    console.log('[Migration] File size:', sqlContent.length, 'bytes');
    
    // Remove comment lines and split by semicolon
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim())
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`[Migration] Found ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[Statement ${i + 1}/${statements.length}]`);
      console.log('Executing:', statement.substring(0, 80) + '...');
      
      await conn.query(statement);
      console.log('✓ Statement executed successfully');
    }
    
    console.log('\n✓ Migration completed successfully!');
    
    // Verify the new columns exist
    const checkColumns = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = "journey_templates" AND TABLE_SCHEMA = "siwa_oasis"';
    const [columns] = await conn.query(checkColumns);
    
    console.log('\n[Verification] New columns in journey_templates:');
    const newColumns = ['is_investment_journey', 'investment_types', 'investment_description', 'minimum_investment_usd', 'estimated_roi_percent', 'investment_partner_name', 'investment_partner_contact', 'featured_properties', 'success_stories', 'requirements_text'];
    
    columns.forEach(col => {
      if (newColumns.includes(col.COLUMN_NAME)) {
        console.log(`  ✓ ${col.COLUMN_NAME}`);
      }
    });
    
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await conn.release();
    await pool.end();
  }
}

runMigration();
