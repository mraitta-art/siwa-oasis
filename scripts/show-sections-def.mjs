import { config } from 'dotenv';
config({ path: '.env.local' });
import { createConnection } from 'mysql2/promise';

async function run() {
  const conn = await createConnection({
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa',
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  console.log('=== SHOW CREATE TABLE sections ===');
  const [rows1] = await conn.query('SHOW CREATE TABLE sections');
  console.log(rows1[0]['Create Table']);

  console.log('\n=== CHARACTER SET & COLLATION OF DATABASE ===');
  const [rows2] = await conn.query('SELECT @@character_set_database, @@collation_database');
  console.log(rows2[0]);

  await conn.end();
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
