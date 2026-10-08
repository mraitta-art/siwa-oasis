const mysql = require('mysql2/promise');

async function run() {
  const localConn = await mysql.createConnection({host: '127.0.0.1', user: 'root', password: '', database: 'siwa_oasis'});
  const [localRes] = await localConn.execute('SHOW COLUMNS FROM form_fields LIKE "section_origin"');
  console.log('Local ENUM:', localRes[0].Type);

  const prodConn = await mysql.createConnection({
    host: process.env.PROD_DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.PROD_DB_PORT || '4000'),
    user: process.env.PROD_DB_USER || process.env.DB_USER || 'root',
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PROD_DB_NAME || process.env.DB_NAME || 'siwa_oasis',
    ssl: { rejectUnauthorized: true }
  });
  const [prodRes] = await prodConn.execute('SHOW COLUMNS FROM form_fields LIKE "section_origin"');
  console.log('Prod ENUM:', prodRes[0].Type);

  const [localRows] = await localConn.execute('SELECT DISTINCT section_origin FROM form_fields');
  console.log('Local Data:', localRows.map(r => r.section_origin));

  await localConn.end();
  await prodConn.end();
}

run().catch(console.error);
