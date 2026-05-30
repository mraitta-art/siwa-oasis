import fs from 'fs';
import mysql from 'mysql2/promise';

async function runMigration() {
  let conn;
  try {
    console.log('Connecting to database...');
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'siwa_oasis',
      multipleStatements: true
    });
    console.log('✓ Connected to database');
    
    console.log('Reading migration file...');
    const sql = fs.readFileSync('./migrations/012_create_journey_templates.sql', 'utf8');
    console.log('✓ File size:', sql.length, 'bytes');
    
    // Split statements more carefully - remove comments first
    const lines = sql.split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    const statements = lines
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`✓ Found ${statements.length} statements\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      console.log('Preview:', stmt.substring(0, 60).replace(/\n/g, ' ') + '...\n');
      
      try {
        await conn.query(stmt);
        console.log('✓ Success\n');
      } catch (err) {
        console.error('✗ Failed:', err.message, '\n');
        throw err;
      }
    }
    
    // Verify table exists
    console.log('Verifying table...');
    const [tables] = await conn.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'siwa_oasis' AND TABLE_NAME = 'journey_templates'"
    );
    
    if (tables && tables.length > 0) {
      console.log('✓ Table journey_templates exists');
      
      const [records] = await conn.query('SELECT COUNT(*) as count FROM journey_templates');
      console.log(`✓ Table contains ${records[0].count} records`);
      
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.error('✗ Table not found after migration');
      process.exit(1);
    }
    
  } catch (err) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', err.message);
    if (err.sql) console.error('SQL:', err.sql);
    console.error('Code:', err.code);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

runMigration();
