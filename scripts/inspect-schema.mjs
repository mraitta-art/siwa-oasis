import { config } from 'dotenv';
config({ path: '.env.local' });
import { createPool } from 'mysql2/promise';

const pool = createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

async function run() {
  const conn = await pool.getConnection();
  const [tables] = await conn.query('SHOW TABLES');
  console.log('=== TABLES ===');
  console.log(tables.map(r => Object.values(r)[0]).join(', '));

  const [profileCols] = await conn.query('DESCRIBE profiles');
  console.log('\n=== profiles columns ===');
  profileCols.forEach(c => console.log(' ', c.Field, '|', c.Type, '|', c.Default));

  // Check if site_settings or settings table exists
  const names = tables.map(r => Object.values(r)[0]);
  for (const t of ['site_settings', 'settings', 'config', 'admin_settings']) {
    if (names.includes(t)) {
      const [rows] = await conn.query(`SELECT * FROM ${t} LIMIT 10`);
      console.log(`\n=== ${t} rows ===`, rows);
    }
  }

  conn.release();
  await pool.end();
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
