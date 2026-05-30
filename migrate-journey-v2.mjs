import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('Starting Journey Templates migration...');
  
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'siwa_oasis',
    multipleStatements: true
  });

  try {
    const filePath = path.join(process.cwd(), 'migrations', '012_create_journey_templates.sql');
    console.log('Reading migration file from:', filePath);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('SQL file size:', sql.length, 'bytes');
    
    // Split by semicolon but keep track of what we're executing
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);
      
      try {
        const result = await conn.query(stmt);
        console.log('✓ Success');
      } catch (err) {
        console.error('✗ Failed:', err.message);
        throw err;
      }
    }
    
    console.log('\n✅ Journey Templates migration successful!');
    
    // Verify the table was created
    const [tables] = await conn.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'siwa_oasis' AND TABLE_NAME = 'journey_templates'");
    console.log('✓ Table verification:', tables.length > 0 ? 'journey_templates table exists' : 'WARNING: Table not found!');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

runMigration();
