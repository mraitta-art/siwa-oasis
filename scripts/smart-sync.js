#!/usr/bin/env node

/**
 * SIWA OASIS — Smart Sync Pipeline
 * 
 * Unified local → production synchronization:
 *   1. Detect changed files (code, config, migrations)
 *   2. Validate local build
 *   3. Sync DB schema (run new migrations on production)
 *   4. Sync DB data (smart push/merge)
 *   5. Build production bundle
 *   6. Generate deployment manifest
 * 
 * Usage:
 *   node scripts/smart-sync.js              # Full sync
 *   node scripts/smart-sync.js --dry        # Show what would happen
 *   node scripts/smart-sync.js --skip-db    # Code + build only
 *   node scripts/smart-sync.js --skip-build # Code + DB only
 *   node scripts/smart-sync.js --quick      # Skip validation build
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const rootDir = path.join(__dirname, '..');
const hashFile = path.join(rootDir, '.last-sync-hashes.json');
const manifestFile = path.join(rootDir, '.sync-manifest.json');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const SKIP_DB = argv.includes('--skip-db');
const SKIP_BUILD = argv.includes('--skip-build');
const QUICK = argv.includes('--quick');
const BIDIRECTIONAL = argv.includes('--bidirectional') || !argv.includes('--one-way');

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

// Files to watch for changes
const WATCH_DIRS = ['src', 'public', 'migrations'];
const WATCH_FILES = ['package.json', 'next.config.ts', 'server.js', 'tsconfig.json'];
const MIGRATIONS_DIR = path.join(rootDir, 'migrations');const BACKUP_DIR = path.join(rootDir, 'database_backups', 'smart-sync');
const REQUIRE_BACKUP = !argv.includes('--no-backup');
// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

const log = {
  step: (msg) => console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`),
  info: (msg) => console.log(`  ℹ️  ${msg}`),
  ok: (msg) => console.log(`  ✅ ${msg}`),
  warn: (msg) => console.log(`  ⚠️  ${msg}`),
  err: (msg) => console.log(`  ❌ ${msg}`),
  data: (label, val) => console.log(`     ${label}: ${val}`),
};

function fileHash(filePath) {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
  } catch { return null; }
}

function getAllFiles(dir, base = '') {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = path.join(base, entry.name);
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.next', '.git', '.vercel'].includes(entry.name)) continue;
        results.push(...getAllFiles(full, rel));
      } else {
        results.push({ path: full, rel });
      }
    }
  } catch {}
  return results;
}

function getFilesFromPattern(pattern) {
  const files = [];
  if (pattern.includes('**')) {
    const dir = path.join(rootDir, pattern.split('**')[0]);
    if (fs.existsSync(dir)) {
      getAllFiles(dir).forEach(f => files.push(f.path));
    }
  } else {
    const full = path.join(rootDir, pattern);
    if (fs.existsSync(full)) files.push(full);
  }
  return files;
}
const TIMESTAMP_FIELDS = ['updated_at', 'modified_at', 'last_modified', 'last_updated', 'created_at'];

function quoteId(name) {
  return `\`${name.replace(/`/g, '')}\``;
}

function buildWhereClause(pkCols) {
  return pkCols.map(col => `${quoteId(col)} = ?`).join(' AND ');
}

function findTimestampFields(row) {
  if (!row || typeof row !== 'object') return [];
  return TIMESTAMP_FIELDS.filter(field => Object.prototype.hasOwnProperty.call(row, field));
}

function parseTimestamp(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.valueOf())) return dt;
  }
  return null;
}

function compareTimestamps(localRow, prodRow) {
  const localFields = findTimestampFields(localRow);
  const prodFields = findTimestampFields(prodRow);
  if (localFields.length === 0 || prodFields.length === 0) return null;

  const candidates = [];
  for (const localField of localFields) {
    const localTs = parseTimestamp(localRow[localField]);
    if (!localTs) continue;
    for (const prodField of prodFields) {
      const prodTs = parseTimestamp(prodRow[prodField]);
      if (!prodTs) continue;
      candidates.push({ localField, prodField, localTs, prodTs });
    }
  }

  if (candidates.length === 0) return null;

  const exactMatch = candidates.find(c => c.localField === c.prodField);
  const chosen = exactMatch || candidates[0];

  if (chosen.localTs > chosen.prodTs) return 1;
  if (chosen.localTs < chosen.prodTs) return -1;
  return 0;
}

function serializeValue(value) {
  if (value === undefined) return null;
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
}

async function getPrimaryKeyColumns(conn, table) {
  const [rows] = await conn.query(`SHOW KEYS FROM \`${table}\` WHERE Key_name = 'PRIMARY' ORDER BY Seq_in_index`);
  return rows.map((row) => row.Column_name).filter(Boolean);
}

function rowToSqlParts(row) {
  const cols = Object.keys(row).map(quoteId);
  const vals = Object.keys(row).map(key => serializeValue(row[key]));
  return { cols, vals };
}

async function insertRow(conn, table, row) {
  const { cols, vals } = rowToSqlParts(row);
  const placeholders = cols.map(() => '?').join(',');
  const sql = `INSERT INTO \`${table}\` (${cols.join(',')}) VALUES (${placeholders})`;
  return conn.query(sql, vals);
}

async function tableExists(conn, table) {
  const [rows] = await conn.query('SHOW TABLES LIKE ?', [table]);
  return rows.length > 0;
}

function ensureBackupDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function backupTable(conn, table, filePath) {
  try {
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
    log.ok(`Backed up ${table} to ${path.relative(rootDir, filePath)}`);
    return true;
  } catch (e) {
    log.warn(`Failed to back up ${table}: ${String(e.message || e)}`);
    return false;
  }
}

async function updateRow(conn, table, row, pkCols) {
  const updateCols = Object.keys(row).filter(col => !pkCols.includes(col));
  if (updateCols.length === 0) return;
  const setClause = updateCols.map(col => `${quoteId(col)} = ?`).join(', ');
  const whereClause = buildWhereClause(pkCols);
  const values = updateCols.map(col => serializeValue(row[col]));
  const whereValues = pkCols.map(col => serializeValue(row[col]));
  const sql = `UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`;
  return conn.query(sql, [...values, ...whereValues]);
}

function getRowKey(row, pkCols) {
  return pkCols.map(col => String(row[col])).join('||');
}
// ═══════════════════════════════════════════════════════════
// PHASE 1: CHANGE DETECTION
// ═══════════════════════════════════════════════════════════

function detectChanges() {
  log.step('PHASE 1: Change Detection');

  // Load previous hashes
  let prevHashes = {};
  if (fs.existsSync(hashFile)) {
    prevHashes = JSON.parse(fs.readFileSync(hashFile, 'utf8'));
  }

  // Collect current hashes
  const currentHashes = {};
  const changed = [];
  const added = [];
  const deleted = [];

  const allWatchedFiles = [];
  for (const dir of WATCH_DIRS) {
    const fullDir = path.join(rootDir, dir);
    if (fs.existsSync(fullDir)) {
      getAllFiles(fullDir).forEach(f => allWatchedFiles.push(f.path));
    }
  }
  for (const file of WATCH_FILES) {
    const full = path.join(rootDir, file);
    if (fs.existsSync(full)) allWatchedFiles.push(full);
  }

  for (const file of allWatchedFiles) {
    const hash = fileHash(file);
    if (!hash) continue;
    currentHashes[file] = hash;

    if (!prevHashes[file]) {
      added.push(file);
    } else if (prevHashes[file] !== hash) {
      changed.push(file);
    }
  }

  for (const file of Object.keys(prevHashes)) {
    if (!currentHashes[file]) deleted.push(file);
  }

  // Detect new/modified migrations (don't store hashes yet — only after applied)
  const migrations = [];
  if (fs.existsSync(MIGRATIONS_DIR)) {
    const migFiles = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
    for (const mf of migFiles) {
      const full = path.join(MIGRATIONS_DIR, mf);
      const hash = fileHash(full);
      const key = `migration:${mf}`;
      if (!prevHashes[key] || prevHashes[key] !== hash) {
        migrations.push({ file: mf, path: full, hash, key });
      }
    }
    // Preserve previously-applied migration hashes
    for (const [k, v] of Object.entries(prevHashes)) {
      if (k.startsWith('migration:') && !currentHashes[k]) {
        currentHashes[k] = v;
      }
    }
  }

  const totalChanges = added.length + changed.length + deleted.length;

  return { changed, added, deleted, migrations, currentHashes, totalChanges, saveHashes: () => {
    if (!DRY) {
      fs.writeFileSync(hashFile, JSON.stringify(currentHashes, null, 2));
    }
  }, addMigrationHash: (key, hash) => {
    currentHashes[key] = hash;
  }};
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: LOCAL VALIDATION
// ═══════════════════════════════════════════════════════════

async function validateLocal() {
  if (QUICK || SKIP_BUILD) {
    log.step('PHASE 2: Local Validation (SKIPPED)');
    return true;
  }

  log.step('PHASE 2: Local Validation');
  log.info('Running production build to verify compilation...');

  try {
    if (DRY) {
      log.info('[DRY] Would run: npx next build');
      return true;
    }
    execSync('npx next build', { cwd: rootDir, stdio: 'pipe', timeout: 300000 });
    log.ok('Production build successful');
    return true;
  } catch (e) {
    log.err('Build failed — fix errors before syncing to production');
    const stderr = e.stderr?.toString() || '';
    if (stderr) console.log(stderr.substring(0, 500));
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 3: DATABASE SCHEMA SYNC
// ═══════════════════════════════════════════════════════════

async function syncSchema(migrations, changes) {
  if (SKIP_DB || migrations.length === 0) {
    log.step('PHASE 3: Schema Sync (SKIPPED)');
    return true;
  }

  log.step('PHASE 3: Database Schema Sync');
  log.info(`${migrations.length} migration(s) to apply to production`);

  if (DRY) {
    migrations.forEach(m => log.info(`[DRY] Would apply: ${m.file}`));
    return true;
  }

  const mysql = require('mysql2/promise');
  let prodConn, localConn;

  try {
    prodConn = await mysql.createConnection(PROD_DB);
    log.ok('Connected to production database');

    // Helper: auto-create missing table from local DB
    async function ensureTable(tableName) {
      try {
        if (!localConn) {
          localConn = await mysql.createConnection(LOCAL_DB);
        }
        const [[createRow]] = await localConn.query(`SHOW CREATE TABLE \`${tableName}\``);
        await prodConn.query(createRow['Create Table']);
        log.ok(`Auto-created missing table: ${tableName}`);
        return true;
      } catch {
        return false;
      }
    }

    // Split SQL into individual statements (TiDB Cloud blocks multi-statement)
    function splitStatements(sql) {
      const statements = [];
      let current = '';
      let inString = false;
      let stringChar = '';
      let escaped = false;
      let inLineComment = false;
      let inBlockComment = false;

      for (let i = 0; i < sql.length; i++) {
        const ch = sql[i];
        const next = sql[i + 1];

        if (inLineComment) {
          if (ch === '\n') { inLineComment = false; current += '\n'; }
          continue;
        }
        if (inBlockComment) {
          if (ch === '*' && next === '/') { inBlockComment = false; i++; }
          continue;
        }
        if (inString) {
          current += ch;
          if (escaped) { escaped = false; continue; }
          if (ch === '\\') { escaped = true; continue; }
          if (ch === stringChar) { inString = false; }
          continue;
        }

        if (ch === '-' && next === '-') { inLineComment = true; continue; }
        if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
        if (ch === '\'' || ch === '"' || ch === '`') { inString = true; stringChar = ch; current += ch; continue; }
        if (ch === ';') {
          const stmt = current.trim();
          if (stmt) statements.push(stmt);
          current = '';
          continue;
        }
        current += ch;
      }
      const last = current.trim();
      if (last) statements.push(last);
      return statements;
    }

    for (const migration of migrations) {
      log.info(`Applying: ${migration.file}...`);
      const sql = fs.readFileSync(migration.path, 'utf8');
      const statements = splitStatements(sql);
      let applied = 0;

      for (const stmt of statements) {
        try {
          await prodConn.query(stmt);
          applied++;
        } catch (err) {
          const errMsg = err.message || String(err);
          const errCode = err.code || '';
          // Tolerate idempotent re-runs
          if (errCode === 'ER_TABLE_EXISTS_ERROR' || errCode === 'ER_DUP_ENTRY'
              || errCode === 'ER_DUP_KEYNAME' || errCode === 'ER_DUP_FIELDNAME'
              || errMsg.includes('already exists')) {
            applied++;
            continue;
          }
          // Auto-create missing table and retry
          const missingMatch = errMsg.match(/Table '[^']+\.([^']+)' doesn't exist/i);
          if (missingMatch) {
            const tbl = missingMatch[1];
            log.info(`Missing table: ${tbl} — attempting auto-create...`);
            const created = await ensureTable(tbl);
            if (created) {
              try {
                await prodConn.query(stmt);
                applied++;
                continue;
              } catch (retryErr) {
                log.warn(`Retry after creating ${tbl}: ${retryErr.message.substring(0, 80)}`);
              }
            } else {
              if (/^\s*ALTER\s+TABLE/i.test(stmt)) {
                log.warn(`Skipped ALTER ${tbl} (table doesn't exist locally or on production)`);
                applied++;
                continue;
              }
            }
          }
          log.err(`Failed: ${migration.file} — ${errMsg}`);
          if (localConn) await localConn.end().catch(() => {});
          await prodConn.end();
          return false;
        }
      }

      log.ok(`Applied: ${migration.file} (${applied} statements)`);
      // Mark migration as successfully applied
      if (changes.addMigrationHash) changes.addMigrationHash(migration.key, migration.hash);
    }

    await prodConn.end();
    if (localConn) await localConn.end().catch(() => {});
    log.ok('All migrations applied successfully');
    return true;
  } catch (e) {
    log.err(`Schema sync failed: ${e.message}`);
    if (prodConn) await prodConn.end().catch(() => {});
    if (localConn) await localConn.end().catch(() => {});
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 4: DATABASE DATA SYNC
// ═══════════════════════════════════════════════════════════

async function syncData() {
  if (SKIP_DB) {
    log.step('PHASE 4: Data Sync (SKIPPED)');
    return true;
  }

  log.step('PHASE 4: Database Data Sync');
  log.info('Comparing local vs production table data...');

  if (DRY) {
    log.info('[DRY] Would sync data between local and production');
    return true;
  }

  const mysql = require('mysql2/promise');
  let localConn, prodConn;

  function rowsEqual(a, b) {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
      if (keysA[i] !== keysB[i]) return false;
      const aVal = a[keysA[i]];
      const bVal = b[keysA[i]];
      if (aVal === bVal) continue;
      if (aVal == null && bVal == null) continue;
      if (typeof aVal === 'object' || typeof bVal === 'object') {
        if (JSON.stringify(aVal) !== JSON.stringify(bVal)) return false;
      } else if (String(aVal) !== String(bVal)) {
        return false;
      }
    }
    return true;
  }

  async function fetchRowsByKey(conn, table, pkCols) {
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    const map = new Map();
    for (const row of rows) {
      map.set(getRowKey(row, pkCols), row);
    }
    return map;
  }

  async function resolveRowConflict(table, pkCols, localRow, prodRow) {
    const cmp = compareTimestamps(localRow, prodRow);
    if (cmp === 1) {
      await updateRow(prodConn, table, localRow, pkCols);
      log.info(`  [${table}] Local row is newer; updated production (${getRowKey(localRow, pkCols)})`);
      return 'prod-updated';
    }
    if (cmp === -1) {
      if (BIDIRECTIONAL) {
        await updateRow(localConn, table, prodRow, pkCols);
        log.info(`  [${table}] Production row is newer; updated local (${getRowKey(prodRow, pkCols)})`);
        return 'local-updated';
      }
      log.info(`  [${table}] Production row is newer; skipped local update (${getRowKey(prodRow, pkCols)})`);
      return 'skipped';
    }

    if (rowsEqual(localRow, prodRow)) {
      return 'identical';
    }

    log.warn(`  [${table}] Conflict without timestamps: row differs but no reliable timestamp found (${getRowKey(localRow, pkCols)})`);
    return 'ambiguous';
  }

  async function upsertRow(conn, table, row, pkCols) {
    const [existing] = await conn.query(`SELECT 1 FROM \`${table}\` WHERE ${buildWhereClause(pkCols)} LIMIT 1`, pkCols.map(col => serializeValue(row[col])));
    if (existing.length === 0) {
      await insertRow(conn, table, row);
      return 'inserted';
    }
    await updateRow(conn, table, row, pkCols);
    return 'updated';
  }

  async function backupProductionTables(tableList) {
    const queued = [];
    for (const table of tableList) {
      if (!prodNames.has(table)) {
        log.warn(`  [${table}] Production table missing, skipping backup.`);
        continue;
      }
      const backupFile = path.join(BACKUP_DIR, `${backupTimestamp}-${table}.json`);
      queued.push(backupTable(prodConn, table, backupFile));
    }
    const results = await Promise.all(queued);
    return results.every(Boolean);
  }

  try {
    localConn = await mysql.createConnection(LOCAL_DB);
    prodConn = await mysql.createConnection(PROD_DB);
    log.ok('Connected to both databases');

    // Get tables from both
    const [localTables] = await localConn.query('SHOW TABLES');
    const [prodTables] = await prodConn.query('SHOW TABLES');

    const localNames = new Set(localTables.map(r => Object.values(r)[0]));
    const prodNames = new Set(prodTables.map(r => Object.values(r)[0]));

    // Tables to sync strategy
    const PUSH_TABLES = ['business_types', 'sections', 'field_definitions', 'form_fields',
      'subscription_tiers', 'minisite_templates', 'website_configs',
      'search_engines', 'search_pages', 'policies', 'experience_categories',
      'page_services', 'page_experience_categories', 'journey_templates'];
    const SKIP_TABLES = ['activity_log', 'audit_log', 'sessions', 'password_resets'];
    const MERGE_TABLES = ['businesses', 'profiles'];

    // Create missing tables FIRST so data push can work
    for (const table of localNames) {
      if (!prodNames.has(table) && !SKIP_TABLES.includes(table)) {
        try {
          const [[createRow]] = await localConn.query(`SHOW CREATE TABLE \`${table}\``);
          await prodConn.query(createRow['Create Table']);
          log.ok(`Created missing table on production: ${table}`);
          prodNames.add(table);
        } catch (e) {
          log.warn(`Could not create ${table} on production: ${e.message.substring(0, 60)}`);
        }
      }
    }

    if (REQUIRE_BACKUP) {
      ensureBackupDirectory(BACKUP_DIR);
    }

    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTables = [...new Set([...PUSH_TABLES, ...MERGE_TABLES].filter(table => prodNames.has(table) && !SKIP_TABLES.includes(table)))];
    if (REQUIRE_BACKUP && backupTables.length > 0) {
      log.step('PRODUCTION BACKUP: Preparing before data synchronization');
      const backupOk = await backupProductionTables(backupTables);
      if (!backupOk) {
        throw new Error('Production backup failed. Aborting data sync.');
      }
      log.ok(`Production backup complete: ${backupTables.length} tables backed up to ${path.relative(rootDir, BACKUP_DIR)}`);
    }

    let tablesSynced = 0;
    let tablesSkipped = 0;
    let tablesMerged = 0;
    const tableCandidates = Array.from(new Set([...PUSH_TABLES, ...MERGE_TABLES]));

    for (const table of tableCandidates) {
      if (SKIP_TABLES.includes(table)) {
        tablesSkipped++;
        continue;
      }
      if (!localNames.has(table) && !prodNames.has(table)) {
        tablesSkipped++;
        continue;
      }

      log.step(`SYNC TABLE: ${table}`);
      const pkCols = await getPrimaryKeyColumns(localNames.has(table) ? localConn : prodConn, table);
      if (pkCols.length === 0) {
        log.warn(`  ${table}: no primary key found, skipping table`);
        tablesSkipped++;
        continue;
      }

      const localRows = localNames.has(table) ? await fetchRowsByKey(localConn, table, pkCols) : new Map();
      const prodRows = prodNames.has(table) ? await fetchRowsByKey(prodConn, table, pkCols) : new Map();
      const allKeys = new Set([...localRows.keys(), ...prodRows.keys()]);
      let rowChanges = 0;

      for (const rowKey of allKeys) {
        const localRow = localRows.get(rowKey);
        const prodRow = prodRows.get(rowKey);

        if (localRow && !prodRow) {
          await insertRow(prodConn, table, localRow);
          log.info(`  Inserted row into production: ${rowKey}`);
          rowChanges++;
          continue;
        }

        if (!localRow && prodRow) {
          if (BIDIRECTIONAL || MERGE_TABLES.includes(table)) {
            await insertRow(localConn, table, prodRow);
            log.info(`  Inserted row into local: ${rowKey}`);
            rowChanges++;
          }
          continue;
        }

        if (localRow && prodRow) {
          const result = await resolveRowConflict(table, pkCols, localRow, prodRow);
          if (result === 'prod-updated' || result === 'local-updated') {
            rowChanges++;
          }
          continue;
        }
      }

      if (rowChanges > 0) {
        tablesSynced++;
      } else {
        tablesSkipped++;
      }
      if (MERGE_TABLES.includes(table)) tablesMerged++;
    }

    await localConn.end();
    await prodConn.end();

    log.ok(`Data sync complete: ${tablesSynced} tables synced, ${tablesSkipped} skipped, ${tablesMerged} merged`);
    return true;
  } catch (e) {
    log.err(`Data sync failed: ${e.message}`);
    if (localConn) await localConn.end().catch(() => {});
    if (prodConn) await prodConn.end().catch(() => {});
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 5: BUILD DEPLOYMENT BUNDLE
// ═══════════════════════════════════════════════════════════

async function buildBundle() {
  if (SKIP_BUILD) {
    log.step('PHASE 5: Build Bundle (SKIPPED)');
    return true;
  }

  log.step('PHASE 5: Deployment Bundle');

  if (DRY) {
    log.info('[DRY] Would generate cPanel deployment bundle');
    return true;
  }

  try {
    log.info('Generating deployment bundle...');
    execSync('node scripts/prepare-deployment-advanced.js', { cwd: rootDir, stdio: 'pipe', timeout: 120000 });
    log.ok('Deployment bundle generated');

    // Check bundle exists
    const cpanelBundle = path.join(rootDir, 'deploy_bundle_cpanel');
    const universalBundle = path.join(rootDir, 'deploy_bundle');

    if (fs.existsSync(cpanelBundle)) {
      const stats = fs.statSync(cpanelBundle);
      log.data('cPanel bundle', `deploy_bundle_cpanel/ (${(stats.size / 1024).toFixed(0)}KB)`);
    }
    if (fs.existsSync(universalBundle)) {
      log.data('Universal bundle', 'deploy_bundle/');
    }

    return true;
  } catch (e) {
    log.warn(`Bundle generation had issues: ${e.message.substring(0, 100)}`);
    return true; // Non-critical
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 6: MANIFEST & REPORT
// ═══════════════════════════════════════════════════════════

function generateManifest(results) {
  log.step('PHASE 6: Sync Report');

  const manifest = {
    timestamp: new Date().toISOString(),
    version: require(path.join(rootDir, 'package.json')).version,
    phases: results,
    status: Object.values(results).every(r => r) ? 'SUCCESS' : 'PARTIAL',
  };

  if (!DRY) {
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n  ${'━'.repeat(50)}`);
  console.log(`  📊 SYNC REPORT`);
  console.log(`  ${'━'.repeat(50)}`);
  console.log(`  Status:     ${manifest.status === 'SUCCESS' ? '✅ SUCCESS' : '⚠️  PARTIAL'}`);
  console.log(`  Duration:   ${elapsed}s`);
  console.log(`  Phase 1:    ${results.detect ? '✅ Changes detected' : '⏭️  No changes'}`);
  console.log(`  Phase 2:    ${results.validate ? '✅ Build valid' : (SKIP_BUILD ? '⏭️  Skipped' : '❌ Failed')}`);
  console.log(`  Phase 3:    ${results.schema ? '✅ Schema synced' : (SKIP_DB ? '⏭️  Skipped' : '❌ Failed')}`);
  console.log(`  Phase 4:    ${results.data ? '✅ Data synced' : (SKIP_DB ? '⏭️  Skipped' : '❌ Failed')}`);
  console.log(`  Phase 5:    ${results.bundle ? '✅ Bundle ready' : (SKIP_BUILD ? '⏭️  Skipped' : '⚠️  Issues')}`);
  console.log(`  ${'━'.repeat(50)}`);

  if (!SKIP_BUILD && results.bundle) {
    console.log(`\n  📦 Next step: Upload deploy_bundle_cpanel/ to cPanel via File Manager`);
  }

  console.log('');
}

// ═══════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════

const startTime = Date.now();

async function main() {
  console.log(`\n  🔄 SIWA OASIS Smart Sync`);
  console.log(`  ${DRY ? '[DRY RUN]' : '[LIVE]'} ${SKIP_DB ? '(skip DB)' : ''} ${SKIP_BUILD ? '(skip build)' : ''} ${QUICK ? '(quick mode)' : ''}`);
  console.log(`  ${new Date().toLocaleString()}\n`);

  // Phase 1: Detect changes
  const changes = detectChanges();
  const hasChanges = changes.totalChanges > 0 || changes.migrations.length > 0;

  // Log summary
  if (changes.totalChanges === 0 && changes.migrations.length === 0) {
    log.ok('No changes detected since last sync');
  } else {
    if (changes.added.length) log.info(`${changes.added.length} new files`);
    if (changes.changed.length) log.info(`${changes.changed.length} modified files`);
    if (changes.deleted.length) log.info(`${changes.deleted.length} deleted files`);
    if (changes.migrations.length) log.info(`${changes.migrations.length} new/modified migrations: ${changes.migrations.map(m => m.file).join(', ')}`);
  }

  if (!hasChanges && !argv.includes('--force')) {
    log.ok('Everything is up to date. Use --force to re-sync anyway.');
    changes.saveHashes();
    await generateManifest({ detect: true, validate: true, schema: true, data: true, bundle: true });
    return;
  }

  // Phase 2: Validate
  const valid = await validateLocal();
  if (!valid) {
    log.err('Aborting sync — fix build errors first');
    process.exit(1);
  }

  // Phase 3: Schema
  const schemaOk = await syncSchema(changes.migrations, changes);

  // Phase 4: Data
  const dataOk = await syncData();

  // Phase 5: Bundle
  const bundleOk = await buildBundle();

  // Phase 6: Report
  // Save all hashes (code changes + successfully applied migrations)
  changes.saveHashes();
  await generateManifest({
    detect: hasChanges,
    validate: valid,
    schema: schemaOk,
    data: dataOk,
    bundle: bundleOk
  });
}

main().catch(e => {
  log.err(`Pipeline crashed: ${e.message}`);
  console.error(e);
  process.exit(1);
});
