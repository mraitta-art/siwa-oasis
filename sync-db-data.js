const mysql = require('mysql2/promise');

async function syncData() {
  const localDb = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'siwa_oasis'
  });

  const prodDb = await mysql.createConnection({
    host: process.env.PROD_DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.PROD_DB_PORT || '4000'),
    user: process.env.PROD_DB_USER || process.env.DB_USER || 'root',
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PROD_DB_NAME || process.env.DB_NAME || 'siwa_oasis',
    ssl: { rejectUnauthorized: false }
  });

  const tables = ['journey_templates', 'orchestrator_pages', 'site_components'];

  for (const table of tables) {
    console.log(`Syncing ${table}...`);
    const [rows] = await localDb.query(`SELECT * FROM ${table}`);
    
    if (rows.length === 0) {
      console.log(`No data in ${table}`);
      continue;
    }

    // Clear prod table
    await prodDb.query(`TRUNCATE TABLE ${table}`);

    for (const row of rows) {
      const keys = Object.keys(row);
      // For site_components, wrap `key` in backticks
      const escapedKeys = keys.map(k => k === 'key' ? '`key`' : k);
      const values = Object.values(row);
      
      const placeholders = values.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${escapedKeys.join(', ')}) VALUES (${placeholders})`;
      
      try {
        await prodDb.query(query, values);
      } catch (err) {
        console.error(`Error inserting into ${table}:`, err.message);
      }
    }
    console.log(`Inserted ${rows.length} rows into ${table}`);
  }

  console.log('Sync complete!');
  process.exit(0);
}

syncData().catch(console.error);
