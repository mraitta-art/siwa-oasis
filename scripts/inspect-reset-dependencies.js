'use strict';

const { prodConfig } = require('./db-config');
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection(prodConfig);
  const [columns] = await connection.query(
    `SELECT TABLE_NAME, COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND COLUMN_NAME IN ('business_id', 'vendor_id', 'user_id', 'requested_by', 'reviewed_by', 'created_by', 'profile_id')
     ORDER BY TABLE_NAME, COLUMN_NAME`,
    [prodConfig.database]
  );
  console.log(JSON.stringify(columns, null, 2));
  await connection.end();
})().catch(error => {
  console.error(`DEPENDENCY_INSPECT_FAILED:${error.message}`);
  process.exit(1);
});
