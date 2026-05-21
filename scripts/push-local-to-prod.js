const mysql = require('mysql2/promise');

async function sync() {
  const localConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'siwa_oasis'
  };

  const prodConfig = {
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3iv5fPeLo2ze3jn.root',
    password: 'Dj2teUVtQyMYghF3',
    database: 'siwa_oasis',
    ssl: { rejectUnauthorized: true }
  };

  const localConn = await mysql.createConnection(localConfig);
  const prodConn = await mysql.createConnection(prodConfig);

  const tables = [
    'subscription_tiers',
    'minisite_templates',
    'business_types',
    'sections',
    'form_fields',
    'businesses'
  ];

  console.log('🔄 Starting Data Synchronization...');

  for (const table of tables) {
    console.log(`\nSyncing table: ${table}...`);
    const [rows] = await localConn.execute(`SELECT * FROM ${table}`);
    console.log(`Found ${rows.length} rows locally.`);

    for (const row of rows) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map(() => '?').join(',');
      const updates = keys.map(k => `${k} = VALUES(${k})`).join(',');

      const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;
      
      // Convert JSON objects to strings for MySQL
      const sanitizedValues = values.map(v => (typeof v === 'object' && v !== null && !(v instanceof Date)) ? JSON.stringify(v) : v);

      await prodConn.execute(sql, sanitizedValues);
    }
    console.log(`✅ Table ${table} synced.`);
  }

  await localConn.end();
  await prodConn.end();
  console.log('\n✨ ALL DATA SYNCHRONIZED TO PRODUCTION.');
}

sync().catch(console.error);
