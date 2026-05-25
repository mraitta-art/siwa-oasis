const mysql = require('mysql2/promise');

async function run() {
  const localConn = await mysql.createConnection({host: '127.0.0.1', user: 'root', password: '', database: 'siwa_oasis'});
  
  const [result] = await localConn.execute("UPDATE form_fields SET section_origin = 'own' WHERE section_origin = '' OR section_origin IS NULL");
  console.log(`Updated ${result.affectedRows} rows.`);
  
  await localConn.end();
}

run().catch(console.error);
