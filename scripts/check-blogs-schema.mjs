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

  console.log('=== sections columns ===');
  const [cols1] = await conn.query('DESCRIBE sections');
  cols1.forEach(c => console.log(' ', c.Field, '|', c.Type, '|', c.Default));

  try {
    console.log('\n=== business_posts columns ===');
    const [cols2] = await conn.query('DESCRIBE business_posts');
    cols2.forEach(c => console.log(' ', c.Field, '|', c.Type, '|', c.Default));
  } catch (e) {
    console.log('No business_posts table:', e.message);
  }

  try {
    console.log('\n=== blog_posts columns ===');
    const [cols3] = await conn.query('DESCRIBE blog_posts');
    cols3.forEach(c => console.log(' ', c.Field, '|', c.Type, '|', c.Default));
  } catch (e) {
    console.log('No blog_posts table:', e.message);
  }

  conn.release();
  await pool.end();
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
