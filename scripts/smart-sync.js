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
const MIGRATIONS_DIR = path.join(rootDir, 'migrations');

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
    log.info('[DRY] Would sync data from local to production');
    return true;
  }

  const mysql = require('mysql2/promise');
  let localConn, prodConn;

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

    let synced = 0, skipped = 0, merged = 0;

    for (const table of PUSH_TABLES) {
      if (!localNames.has(table)) { skipped++; continue; }

      try {
        const [rows] = await localConn.query(`SELECT * FROM \`${table}\``);
        if (rows.length === 0) { skipped++; continue; }

        const cols = Object.keys(rows[0]);
        let upserted = 0;

        for (const row of rows) {
          const vals = cols.map(c => {
            const v = row[c];
            return (v !== null && typeof v === 'object' && !(v instanceof Date)) ? JSON.stringify(v) : v;
          });
          const placeholders = cols.map(() => '?').join(',');
          const updates = cols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(',');
          const sql = `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(',')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;
          await prodConn.query(sql, vals);
          upserted++;
        }

        log.ok(`${table}: ${upserted} rows pushed to production`);
        synced++;
      } catch (e) {
        log.warn(`${table}: ${e.message.substring(0, 80)}`);
        skipped++;
      }
    }

    await localConn.end();
    await prodConn.end();

    log.ok(`Data sync complete: ${synced} tables synced, ${skipped} skipped, ${merged} merged`);
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
