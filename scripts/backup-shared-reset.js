'use strict';

const fs = require('fs');
const path = require('path');
const { prodConfig } = require('./db-config');
const mysql = require('mysql2/promise');

(async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'database_backups', 'pre-reset', timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  const connection = await mysql.createConnection(prodConfig);
  const [tableRows] = await connection.query('SHOW TABLES');
  const tables = tableRows.map(row => Object.values(row)[0]);
  const manifest = { created_at: new Date().toISOString(), database: prodConfig.database, tables: [] };

  for (const table of tables) {
    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(rows, null, 2), 'utf8');
    manifest.tables.push({ table, rows: rows.length });
    console.log(`BACKED_UP ${table}:${rows.length}`);
  }

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await connection.end();
  console.log(`BACKUP_DIR:${backupDir}`);
})().catch(error => {
  console.error(`BACKUP_FAILED:${error.message}`);
  process.exit(1);
});
