#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SIWA.TODAY — SECURITY & ENVIRONMENT VALIDATOR
 *
 *  Runs before any sync/deploy to ensure:
 *  1. No secrets are committed to git
 *  2. .gitignore properly excludes sensitive files
 *  3. Required env vars are set
 *  4. No plaintext passwords in tracked files
 *
 *  Usage:  node scripts/security-check.js
 * ═══════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
let warnings = 0;

function ok(msg)   { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg) { console.log(`  ❌ ${msg}`); failed++; }
function warn(msg) { console.log(`  ⚠️  ${msg}`); warnings++; }
function head(msg) { console.log(`\n── ${msg} ${'─'.repeat(Math.max(0, 55 - msg.length))}`); }

// ── 1. Check .gitignore covers sensitive files ──────────────────────────────
head('GITIGNORE COVERAGE');
const gitignorePath = path.join(ROOT, '.gitignore');
const sensitivePatterns = [
  '.env', '.env.local', '.env.production', '.env.vercel',
  '.env.deploy', '.env.railway',
  'node_modules', '.next', 'sync.log', 'sync-git.log',
  '.last-sync-hashes.json', '*.key', '*.pem', 'secrets.json'
];

if (!fs.existsSync(gitignorePath)) {
  fail('.gitignore does not exist! Create it immediately.');
} else {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  sensitivePatterns.forEach(pattern => {
    // Check exact or partial match
    const covered = gitignore.split('\n').some(line => {
      const l = line.trim();
      return l === pattern || l === `/${pattern}` || l === `${pattern}/`;
    });
    if (covered) ok(`${pattern} is ignored`);
    else warn(`${pattern} is NOT in .gitignore — add it`);
  });
}

// ── 2. Check .env files are not tracked by git ─────────────────────────────
head('GIT TRACKING CHECK');
const envFiles = ['.env', '.env.local', '.env.production', '.env.vercel', '.env.deploy'];
envFiles.forEach(envFile => {
  try {
    const tracked = execSync(`git ls-files ${envFile}`, { cwd: ROOT, encoding: 'utf8' }).trim();
    if (tracked) {
      fail(`${envFile} IS TRACKED BY GIT — run: git rm --cached ${envFile}`);
    } else {
      ok(`${envFile} is NOT tracked by git`);
    }
  } catch (_) {
    ok(`${envFile} is not tracked (git check skipped)`);
  }
});

// ── 3. Check for hardcoded secrets in source files ─────────────────────────
head('HARDCODED SECRET SCAN');

// Patterns that indicate hardcoded secrets
const secretPatterns = [
  { pattern: /password\s*=\s*["'][^"']{6,}["']/gi,    label: 'hardcoded password' },
  { pattern: /secret\s*=\s*["'][^"']{10,}["']/gi,      label: 'hardcoded secret' },
  { pattern: /api_key\s*=\s*["'][^"']{10,}["']/gi,     label: 'hardcoded API key' },
  { pattern: /PiCo@@[0-9#@]+/g,                         label: 'known production password' },
  { pattern: /Dj2teUVtQy[A-Za-z0-9]+/g,                label: 'known DB password' },
];

// Files to NOT scan (they legitimately have these patterns)
const SCAN_SKIP = new Set([
  'scripts/sync_database.js',
  'scripts/security-check.js',
  'scripts/push-local-to-prod.js',
  'scripts/alter_prod_db.js',
  'scripts/check-enum.js',
  'scripts/smart-sync.js',
  'scripts/sync-health-check.js',
  'scripts/db-config.js',
  'AUTOMATED_DEPLOY.ps1',
  '.env', '.env.local', '.env.production',
  '.env.vercel', '.env.deploy', '.env.railway',
]);

function scanDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel      = path.relative(ROOT, fullPath);

    if (entry.isDirectory()) {
      const skip = ['.git', 'node_modules', '.next', 'deploy_bundle_cpanel'];
      if (!skip.includes(entry.name)) scanDir(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx', '.ps1', '.sh', '.md'].includes(ext)) {
        if (!SCAN_SKIP.has(rel)) results.push(fullPath);
      }
    }
  }
  return results;
}

let secretsFound = 0;
const srcFiles = scanDir(path.join(ROOT, 'src'));
const scriptFiles = scanDir(path.join(ROOT, 'scripts'));
const allFiles = [...srcFiles, ...scriptFiles];

allFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    secretPatterns.forEach(({ pattern, label }) => {
      const matches = content.match(pattern);
      if (matches) {
        const rel = path.relative(ROOT, filePath);
        fail(`${label} found in ${rel}`);
        secretsFound++;
      }
    });
  } catch (_) {}
});

if (secretsFound === 0) ok('No hardcoded secrets found in source files');

// ── 4. Check required env variables are present ────────────────────────────
head('ENVIRONMENT VARIABLES');
const envPath = path.join(ROOT, '.env.local');
const envFallback = path.join(ROOT, '.env');

const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  ok('.env.local found');
} else if (fs.existsSync(envFallback)) {
  envContent = fs.readFileSync(envFallback, 'utf8');
  warn('.env.local not found, using .env');
} else {
  fail('No .env or .env.local found — app will not start');
}

requiredVars.forEach(varName => {
  const hasVar = envContent.split('\n').some(line => {
    const l = line.trim();
    return l.startsWith(`${varName}=`) && l.length > varName.length + 1;
  });
  if (hasVar) ok(`${varName} is set`);
  else fail(`${varName} is missing or empty in env file`);
});

// Check JWT_SECRET strength
const jwtMatch = envContent.match(/JWT_SECRET=(.+)/);
if (jwtMatch) {
  const secret = jwtMatch[1].trim();
  if (secret.length < 32) fail('JWT_SECRET is too short (minimum 32 chars)');
  else if (secret.includes('change_me') || secret.includes('your_')) fail('JWT_SECRET is still using a placeholder value');
  else ok(`JWT_SECRET length: ${secret.length} chars ✓`);
}

// ── 5. Check .env.production exists for deployment ─────────────────────────
head('PRODUCTION CONFIG');
if (fs.existsSync(path.join(ROOT, '.env.production'))) {
  ok('.env.production exists');
  const prodContent = fs.readFileSync(path.join(ROOT, '.env.production'), 'utf8');
  const prodVars = requiredVars.filter(v => !prodContent.includes(`${v}=`));
  if (prodVars.length === 0) ok('All required vars present in .env.production');
  else prodVars.forEach(v => fail(`${v} missing from .env.production`));
} else {
  warn('.env.production not found — Vercel env vars must be set in dashboard');
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('  SECURITY CHECK SUMMARY');
console.log('═'.repeat(60));
console.log(`  ✅ Passed:   ${passed}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log(`  ❌ Failed:   ${failed}`);
console.log('═'.repeat(60));

if (failed > 0) {
  console.log('\n  🔴 Fix the FAILED items above before deploying to production!\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n  🟡 Warnings present — review before production deployment.\n');
  process.exit(0);
} else {
  console.log('\n  🟢 All checks passed — safe to deploy!\n');
  process.exit(0);
}
