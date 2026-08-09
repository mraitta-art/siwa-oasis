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

  console.log('=== USERS IN PROFILES ===');
  const [rows] = await conn.query('SELECT id, email, role, display_name, active, approval_status, business_id FROM profiles');
  rows.forEach(r => console.log(JSON.stringify(r)));

  conn.release();
  await pool.end();
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
