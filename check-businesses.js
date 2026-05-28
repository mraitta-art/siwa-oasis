const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'siwa_oasis'
  });

  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, subscription_tier, template_id FROM businesses`
    );
    console.log("ALL BUSINESSES (VENDORS) IN DATABASE:");
    rows.forEach(row => {
      console.log(`- ID: ${row.id}`);
      console.log(`  Name: ${row.name}`);
      console.log(`  Slug: ${row.slug}`);
      console.log(`  Tier: ${row.subscription_tier}`);
      console.log(`  Template ID: ${row.template_id}`);
    });
  } catch (err) {
    console.error("Database query failed:", err.message);
  }
  process.exit(0);
}

check();
