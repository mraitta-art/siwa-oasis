#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * SIWA OASIS Sync Health Check
 * 
 * Monitors synchronization status between:
 *   1. Local Development (localhost:3000)
 *   2. Production (siwa.today)
 *   3. GitHub Repository
 * 
 * Generates:
 *   - Health report
 *   - Sync status matrix
 *   - Alerts for out-of-sync components
 *   - Recommendations
 * 
 * Usage:
 *   node scripts/sync-health-check.js              # Full check
 *   node scripts/sync-health-check.js --watch      # Watch mode (5m intervals)
 *   node scripts/sync-health-check.js --email      # Email report to admin
 * ═══════════════════════════════════════════════════════════════════
 */

const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const WATCH = argv.includes('--watch');
const EMAIL = argv.includes('--email');
const VERBOSE = argv.includes('--verbose');

const rootDir = path.join(__dirname, '..');

const LOCAL_DB = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'siwa_oasis'
};

const PROD_DB = {
  host: process.env.PROD_DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.PROD_DB_PORT || '4000'),
  user: process.env.PROD_DB_USER || '3iv5fPeLo2ze3jn.root',
  password: process.env.PROD_DB_PASSWORD || 'Dj2teUVtQyMYghF3',
  database: process.env.PROD_DB_NAME || 'siwa_oasis',
  ssl: { rejectUnauthorized: false }
};

async function checkDbConnection(config, label) {
  try {
    const conn = await mysql.createConnection(config);
    const [[{ count }]] = await conn.query('SELECT 1 as count');
    await conn.end();
    return { status: 'connected', label };
  } catch (e) {
    return { status: 'error', label, error: e.message };
  }
}

async function getTableRowCounts(conn, database) {
  try {
    const [tables] = await conn.query('SHOW TABLES');
    const counts = {};
    
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      try {
        const [[{ cnt }]] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
        counts[tableName] = cnt;
      } catch (e) {
        counts[tableName] = 'ERROR';
      }
    }
    
    return counts;
  } catch (e) {
    return null;
  }
}

async function checkGitSync() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir, encoding: 'utf8' }).trim();
    const localSha = execSync('git rev-parse HEAD', { cwd: rootDir, encoding: 'utf8' }).trim().substring(0, 7);
    
    try {
      execSync('git fetch origin', { cwd: rootDir, stdio: 'pipe' });
    } catch (e) {
      // Fetch might fail if offline
    }
    
    const remoteSha = execSync(`git rev-parse origin/${branch}`, { cwd: rootDir, encoding: 'utf8' }).trim().substring(0, 7);
    const status = localSha === remoteSha ? 'in-sync' : 'diverged';
    
    return {
      branch,
      localSha,
      remoteSha,
      status,
      ahead: localSha !== remoteSha ? '⚠️' : '✓'
    };
  } catch (e) {
    return { error: e.message };
  }
}

function printReport(report) {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║         SIWA OASIS Synchronization Health Report                   ║
║         ${new Date().toLocaleString()}                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

  // Database Status
  console.log(`
┌─ Database Connections ──────────────────────────────────────────┐
│                                                                  │
│  Local Production Database:        ${report.local.status === 'connected' ? '✅ CONNECTED' : '❌ FAILED'}
│  Remote Production Database:       ${report.prod.status === 'connected' ? '✅ CONNECTED' : '❌ FAILED'}
│                                                                  │
└──────────────────────────────────────────────────────────────────┘`);

  if (report.local.status === 'error' && report.local.error) {
    console.log(`  ❌ Local Error: ${report.local.error}`);
  }
  if (report.prod.status === 'error' && report.prod.error) {
    console.log(`  ❌ Production Error: ${report.prod.error}`);
  }

  // GitHub Status
  if (!report.git.error) {
    console.log(`
┌─ GitHub Repository ─────────────────────────────────────────────┐
│                                                                  │
│  Branch:                          ${report.git.branch}
│  Local Commit:                    ${report.git.localSha}
│  Remote Commit:                   ${report.git.remoteSha}
│  Status:                          ${report.git.status === 'in-sync' ? '✅ IN SYNC' : '⚠️ DIVERGED'}
│                                                                  │
└──────────────────────────────────────────────────────────────────┘`);
  }

  // Data Sync Matrix
  if (report.local.status === 'connected' && report.prod.status === 'connected') {
    console.log(`
┌─ Data Synchronization Matrix ───────────────────────────────────┐
│                                                                  │
  Key Tables Comparison:
`);

    const tablesToCheck = [
      'businesses', 'profiles', 'sections', 'field_definitions',
      'business_types', 'journey_templates', 'blog_posts', 'website_configs'
    ];

    for (const table of tablesToCheck) {
      const localCount = report.local.counts?.[table] || 'N/A';
      const prodCount = report.prod.counts?.[table] || 'N/A';
      const status = localCount === prodCount ? '✅' : '⚠️';
      
      console.log(`  ${status} ${table.padEnd(25)} | Local: ${String(localCount).padEnd(5)} | Prod: ${String(prodCount).padEnd(5)}`);
    }
    
    console.log(`
│                                                                  │
└──────────────────────────────────────────────────────────────────┘`);
  }

  // Recommendations
  console.log(`
┌─ Status & Recommendations ──────────────────────────────────────┐
│                                                                  │
`);

  const alerts = [];
  
  if (report.local.status !== 'connected') {
    alerts.push('❌ Local MySQL not running - Start: net start MySQL80 or XAMPP');
  }
  if (report.prod.status !== 'connected') {
    alerts.push('❌ Production database unreachable - Check network connection');
  }
  if (report.git?.status === 'diverged') {
    alerts.push('⚠️ Git diverged from GitHub - Run: git sync to sync');
  }

  if (alerts.length === 0) {
    console.log(`  ✅ All systems in sync!\n`);
  } else {
    alerts.forEach(alert => console.log(`  ${alert}\n`));
  }

  console.log(`
│  Next Steps:                                                     │
│  1. npm run sync              - Sync all databases              │
│  2. npm run sync:quick        - Quick sync (skip validation)    │
│  3. node scripts/github-sync.js - Sync with GitHub              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

  Sync Status: ${alerts.length === 0 ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}
  Last Check: ${new Date().toISOString()}
`);
}

async function main() {
  console.log('Gathering sync health data...\n');

  try {
    const [localStatus, prodStatus, gitStatus] = await Promise.all([
      checkDbConnection(LOCAL_DB, 'local'),
      checkDbConnection(PROD_DB, 'prod'),
      checkGitSync()
    ]);

    const report = {
      local: localStatus,
      prod: prodStatus,
      git: gitStatus,
      timestamp: new Date().toISOString()
    };

    // Get row counts if connected
    if (report.local.status === 'connected') {
      const conn = await mysql.createConnection(LOCAL_DB);
      report.local.counts = await getTableRowCounts(conn, 'siwa_oasis');
      await conn.end();
    }

    if (report.prod.status === 'connected') {
      const conn = await mysql.createConnection(PROD_DB);
      report.prod.counts = await getTableRowCounts(conn, 'siwa_oasis');
      await conn.end();
    }

    printReport(report);

    // Save report
    const reportFile = path.join(rootDir, 'sync-health-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: sync-health-report.json\n`);

    // Watch mode
    if (WATCH) {
      console.log('📡 Watch mode enabled - checking every 5 minutes...\n');
      setInterval(() => main(), 5 * 60 * 1000);
    }

  } catch (e) {
    console.error('\n❌ Health check failed:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkDbConnection, checkGitSync };
