'use strict';

const { prodConfig } = require('./db-config');
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection(prodConfig);
  const [profiles] = await connection.query('SELECT id, email, role, business_id, active, approval_status FROM profiles ORDER BY role, email');
  console.log(JSON.stringify(profiles, null, 2));
  const [businesses] = await connection.query('SELECT id, name, type_id, vendor_id FROM businesses ORDER BY id');
  console.log(JSON.stringify(businesses, null, 2));
  await connection.end();
})().catch(error => {
  console.error(`INSPECT_FAILED:${error.message}`);
  process.exit(1);
});
