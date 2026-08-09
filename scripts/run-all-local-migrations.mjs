import { config } from 'dotenv';
config({ path: '.env.local' });
import { createConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306');
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'siwa';

const migrationsDir = path.resolve('migrations');

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let escaping = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    
    if (escaping) {
      current += ch;
      escaping = false;
      continue;
    }

    if (ch === '\\') {
      current += ch;
      escaping = true;
      continue;
    }

    if (inString) {
      current += ch;
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === ';') {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }
  return statements;
}

async function run() {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} SQL files in migrations/`);

  const conn = await createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  console.log(`Connected to local DB: ${host}/${database}`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`\nExecuting: ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split statements to execute one by one to avoid TiDB/MySQL parser limit issues
    const statements = splitStatements(sql);
    let applied = 0;
    
    for (const statement of statements) {
      if (!statement.trim()) continue;
      try {
        await conn.query(statement);
        applied++;
      } catch (err) {
        // Log error but continue (some columns might already exist)
        console.warn(`  ⚠️ Statement failed in ${file}: ${err.message}`);
      }
    }
    console.log(`  Done: ${applied}/${statements.length} statements executed.`);
  }

  await conn.end();
  console.log('\nAll migrations executed!');
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
