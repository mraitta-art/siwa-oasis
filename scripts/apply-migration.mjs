/**
 * Apply one SQL migration file to the database in .env.local.
 *
 * The other runners either hardcode a filename (apply-migration-027.mjs) or run
 * every file in migrations/ (run-all-local-migrations.mjs), and
 * scripts/run_migration.js reads process.env without loading .env.local — so a
 * single named migration had no one-command path.
 *
 * Usage:
 *   node scripts/apply-migration.mjs migrations/20261027_arabic_storage_and_compound_page.sql
 *   node scripts/apply-migration.mjs migrations/20261027_...sql --dry
 *
 * Statements run one by one and failures are reported, not fatal: a migration
 * that is already applied reports "duplicate column" on some engines and must
 * not stop the statements after it.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const sqlFile = process.argv[2];
const dryRun = process.argv.includes('--dry');

if (!sqlFile) {
  console.error('Usage: node scripts/apply-migration.mjs <sql-file> [--dry]');
  process.exit(2);
}

/**
 * Split on ';' outside quotes.
 *
 * Comments are removed while scanning, not afterwards: a prose comment is full
 * of apostrophes ("this compound's page"), and one of those would flip the
 * quote state and split the next statement in the wrong place.
 */
function splitStatements(sql) {
  const statements = [];
  let buf = '';
  let quote = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (quote) {
      buf += ch;
      if (ch === quote && sql[i - 1] !== '\\') quote = null;
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      buf += '\n';
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      buf += ch;
      continue;
    }

    if (ch === ';') {
      statements.push(buf);
      buf = '';
      continue;
    }

    buf += ch;
  }

  if (buf.trim()) statements.push(buf);
  return statements.map((statement) => statement.trim()).filter(Boolean);
}

const statements = splitStatements(readFileSync(sqlFile, 'utf8'));
console.log(`${sqlFile}: ${statements.length} statement(s)`);

if (dryRun) {
  statements.forEach((s, i) => console.log(`\n--- ${i + 1} ---\n${s}`));
  process.exit(0);
}

const conn = await createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
});

let ok = 0;
let failed = 0;

for (const statement of statements) {
  try {
    await conn.query(statement);
    ok++;
    console.log(`  ok   ${statement.replace(/\s+/g, ' ').slice(0, 90)}`);
  } catch (error) {
    failed++;
    console.warn(`  FAIL ${error.message} :: ${statement.replace(/\s+/g, ' ').slice(0, 90)}`);
  }
}

await conn.end();
console.log(`\n${ok} applied, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
