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
  try {
    // Check if admin_settings row exists
    const [existing] = await conn.query(
      `SELECT id FROM website_configs WHERE type = 'admin_settings' LIMIT 1`
    );
    if (existing.length > 0) {
      // Merge vendor_registration_mode into existing config
      await conn.query(`
        UPDATE website_configs
        SET config = JSON_MERGE_PATCH(config, '{"vendor_registration_mode":"open"}')
        WHERE type = 'admin_settings'
      `);
      console.log("OK: vendor_registration_mode merged into existing admin_settings config.");
    } else {
      await conn.query(`
        INSERT INTO website_configs (type, config)
        VALUES ('admin_settings', '{"vendor_registration_mode":"open"}')
      `);
      console.log("OK: admin_settings row created with vendor_registration_mode = 'open'.");
    }
    console.log('Migration complete!');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
