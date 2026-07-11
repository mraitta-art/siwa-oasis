const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
async function fix() {
  const c = await mysql.createConnection({ host:process.env.DB_HOST, user:process.env.DB_USER, password:process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306), ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud') ? { rejectUnauthorized: false } : undefined });
  
  try {
    await c.query('ALTER TABLE businesses ADD COLUMN slug VARCHAR(255) DEFAULT NULL AFTER name');
    console.log('Added slug column to businesses table');
    // populate slug for existing businesses
    await c.query("UPDATE businesses SET slug = REPLACE(LOWER(name), ' ', '-') WHERE slug IS NULL");
    console.log('Populated slug for existing businesses');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('Slug already exists');
    else console.error(e);
  }
  
  await c.end();
}
fix().catch(console.error);
