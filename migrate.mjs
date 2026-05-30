import mysql from 'mysql2/promise';
import fs from 'fs';

async function runMigration() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'siwa_oasis'
  });

  try {
    const sql = fs.readFileSync('./migrations/011_create_admin_editable_pages.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log('Executing:', stmt.substring(0, 80) + '...');
        await conn.execute(stmt);
      }
    }
    
    console.log('\n✅ Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

runMigration();
