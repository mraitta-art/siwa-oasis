'use strict';

const { prodConfig } = require('./db-config');
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection(prodConfig);
  const tables = [
    'businesses', 'profiles', 'offers', 'packages', 'form_fields',
    'sections', 'business_types', 'card_templates', 'orchestrator_pages',
    'audit_log', 'activity_log'
  ];

  for (const table of tables) {
    try {
      const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM ${table}`);
      console.log(`${table}:${rows[0].count}`);
    } catch {
      console.log(`${table}:MISSING`);
    }
  }

  const [roles] = await connection.query('SELECT role, COUNT(*) AS count FROM profiles GROUP BY role');
  console.log(`ROLES:${JSON.stringify(roles)}`);
  await connection.end();
})().catch(error => {
  console.error(`INVENTORY_FAILED:${error.message}`);
  process.exit(1);
});
