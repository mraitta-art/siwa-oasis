'use strict';

const { prodConfig } = require('./db-config');
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection(prodConfig);
  const [keys] = await connection.query(
    `SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE
     FROM information_schema.KEY_COLUMN_USAGE k
     JOIN information_schema.REFERENTIAL_CONSTRAINTS r
       ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
     WHERE k.CONSTRAINT_SCHEMA = ?
      AND (k.REFERENCED_TABLE_NAME IN ('businesses', 'profiles') OR k.TABLE_NAME IN ('businesses', 'profiles'))
     ORDER BY TABLE_NAME, COLUMN_NAME`,
    [prodConfig.database]
  );
  console.log(JSON.stringify(keys, null, 2));
  await connection.end();
})().catch(error => {
  console.error(`FOREIGN_KEY_INSPECT_FAILED:${error.message}`);
  process.exit(1);
});
