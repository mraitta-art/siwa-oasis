import { config } from 'dotenv';
config({ path: '.env.local' });
import { createPool } from 'mysql2/promise';

// Use production DB config matching smart-sync.js
const pool = createPool({
  host:     process.env.PROD_DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port:     parseInt(process.env.PROD_DB_PORT || '4000'),
  user:     process.env.PROD_DB_USER || '3iv5fPeLo2ze3jn.root',
  password: process.env.PROD_DB_PASSWORD || 'Dj2teUVtQyMYghF3',
  database: process.env.PROD_DB_NAME || 'siwa_oasis',
  ssl:      { rejectUnauthorized: false }
});

async function run() {
  const conn = await pool.getConnection();

  console.log('=== PROD TABLES ===');
  const [tables] = await conn.query('SHOW TABLES');
  console.log(tables.map(r => Object.values(r)[0]).join(', '));

  try {
    console.log('\n=== PROD section_blogs columns ===');
    const [cols] = await conn.query('DESCRIBE section_blogs');
    cols.forEach(c => console.log(' ', c.Field, '|', c.Type, '|', c.Default));
  } catch (e) {
    console.log('Failed to describe section_blogs on PROD:', e.message);
  }

  conn.release();
  await pool.end();
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
