// Migration: Add is_shared column to businesses table
// Run: node scripts/add-is-shared.mjs (from project root)

import { config } from 'dotenv';
import { createPool } from 'mysql2/promise';

config({ path: '.env.local' });

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
  try {
    // Check if column already exists
    const [cols] = await conn.query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [process.env.DB_NAME, 'businesses', 'is_shared']
    );

    if (cols.length > 0) {
      console.log('SKIP: is_shared column already exists on businesses table.');
    } else {
      await conn.query(
        'ALTER TABLE businesses ADD COLUMN is_shared TINYINT(1) NOT NULL DEFAULT 1'
      );
      console.log('OK: is_shared column added to businesses table (default=1 for all existing records).');
    }

    // Confirm current counts
    const [rows] = await conn.query('SELECT COUNT(*) as total FROM businesses');
    console.log('Total businesses in DB:', rows[0].total);
    console.log('DONE - Migration complete!');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
