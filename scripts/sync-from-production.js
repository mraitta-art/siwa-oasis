#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const backupDir = path.join(rootDir, 'database_backups', 'from-production');
fs.mkdirSync(backupDir, { recursive: true });

const PROD_DB = {
  host: process.env.PROD_DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.PROD_DB_PORT || '4000'),
  user: process.env.PROD_DB_USER || '3iv5fPeLo2ze3jn.root',
  password: process.env.PROD_DB_PASSWORD || 'Dj2teUVtQyMYghF3',
  database: process.env.PROD_DB_NAME || 'siwa_oasis',
  ssl: { rejectUnauthorized: false }
};

const LOCAL_DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'siwa_oasis'
};

async function main() {
  console.log('Fetching production database snapshot...');
  const prodConn = await mysql.createConnection(PROD_DB);
  const [tables] = await prodConn.query('SHOW TABLES');
  const tableNames = tables.map((row) => Object.values(row)[0]);

  const snapshot = {};
  for (const table of tableNames) {
    const [rows] = await prodConn.query(`SELECT * FROM \`${table}\``);
    snapshot[table] = rows;
  }

  const backupFile = path.join(backupDir, `prod-snapshot-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2));
  console.log(`Saved production snapshot to ${backupFile}`);

  try {
    const localConn = await mysql.createConnection(LOCAL_DB);
    for (const table of tableNames) {
      await localConn.query(`DROP TABLE IF EXISTS \`${table}\``);
      if (snapshot[table].length === 0) {
        continue;
      }
      const cols = Object.keys(snapshot[table][0]).map((c) => `\`${c}\``).join(',');
      const placeholders = Object.keys(snapshot[table][0]).map(() => '?').join(',');
      const createParts = Object.entries(snapshot[table][0]).map(([k, v]) => `\`${k}\` ${typeof v === 'number' ? 'BIGINT' : 'TEXT'}`);
      await localConn.query(`CREATE TABLE \`${table}\` (${createParts.join(', ')})`);
      for (const row of snapshot[table]) {
        const values = Object.values(row);
        await localConn.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, values);
      }
    }
    await localConn.end();
    console.log('Local database updated from production snapshot.');
  } catch (error) {
    console.error('Local update failed:', error.message);
  }

  await prodConn.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
