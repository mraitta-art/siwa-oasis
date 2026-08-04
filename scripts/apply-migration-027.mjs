import { config } from 'dotenv';
config({ path: '.env.local' });
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

async function run() {
  const sql = readFileSync('migrations/027_section_blog_curation_columns.sql', 'utf8');
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

  const conn = await createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  for (const s of stmts) {
    if (!s) continue;
    try {
      await conn.query(s);
      console.log('✅ OK:', s.substring(0, 80));
    } catch (e) {
      console.warn('⚠️  WARN:', e.message);
    }
  }

  await conn.end();
  console.log('\nDone applying migration 027!');
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
