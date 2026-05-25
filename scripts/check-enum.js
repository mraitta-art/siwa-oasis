const mysql = require('mysql2/promise');

async function run() {
  const localConn = await mysql.createConnection({host: '127.0.0.1', user: 'root', password: '', database: 'siwa_oasis'});
  const [localRes] = await localConn.execute('SHOW COLUMNS FROM form_fields LIKE "section_origin"');
  console.log('Local ENUM:', localRes[0].Type);

  const prodConn = await mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3iv5fPeLo2ze3jn.root',
    password: 'Dj2teUVtQyMYghF3',
    database: 'siwa_oasis',
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
