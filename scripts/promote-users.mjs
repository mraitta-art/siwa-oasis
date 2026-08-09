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

  console.log('Updating super@siiwa.com to super_admin...');
  const [res] = await conn.query(
    `UPDATE profiles 
     SET role = 'super_admin', business_id = NULL 
     WHERE email = 'super@siiwa.com'`
  );
  console.log('Update result:', res);

  console.log('Updating aboulfotouh@gmail.com to super_admin...');
  const [res2] = await conn.query(
    `UPDATE profiles 
     SET role = 'super_admin', business_id = NULL 
     WHERE email = 'aboulfotouh@gmail.com'`
  );
  console.log('Update result 2:', res2);

  await conn.end();
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
