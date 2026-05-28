/**
 * Run a SQL migration file against a MySQL-compatible database using env vars.
 * Usage:
 *   node scripts/run_migration.js migrations/20260528_add_visitor_profiles.sql --dry
 *
 * Env vars required: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Usage: node scripts/run_migration.js <sql-file> [--dry]');
  process.exit(2);
}

const sqlFile = argv[0];
const dryRun = argv.includes('--dry') || argv.includes('-d');

async function main() {
  const sqlPath = path.resolve(sqlFile);
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(2);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  if (dryRun) {
    console.log('--- DRY RUN ---');
    console.log(sql.substring(0, 1000));
    console.log('--- (truncated) ---');
    return;
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'siwa';

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
  console.log('Connected to DB', host, database);
  try {
    const [results] = await conn.query(sql);
    console.log('Migration executed.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
