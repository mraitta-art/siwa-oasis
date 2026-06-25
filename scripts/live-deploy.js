#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SIWA.TODAY — COMPLETE AUTO-SYNC SYSTEM
 *  Watches local src/ for changes → debounces → git commit + push → Vercel
 *
 *  Usage:
 *    node scripts/live-deploy.js            # Start watcher (keeps running)
 *    node scripts/live-deploy.js --once     # Push current changes once & exit
 *    node scripts/live-deploy.js --status   # Show current sync status & exit
 *
 *  The watcher:
 *    1. Detects any file save in src/, public/, *.config.*, package.json
 *    2. Waits 4s of silence (debounce) so you can save multiple files
 *    3. Runs: git add -A → git commit → git push origin main
 *    4. Vercel receives the push and auto-deploys (2-4 min)
 *    5. Logs every action with timestamp to sync.log
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Config ────────────────────────────────────────────────────────────────
const ROOT        = path.join(__dirname, '..');
const LOG_FILE    = path.join(ROOT, 'sync.log');
const DEBOUNCE_MS = 4000;   // wait 4s after last file change before pushing
const IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.next', 'deploy_bundle_cpanel',
  '.last-sync-hashes.json', 'sync.log', 'sync-git.log'
]);

// Paths to watch
const WATCH_TARGETS = [
  path.join(ROOT, 'src'),
  path.join(ROOT, 'public'),
  path.join(ROOT, 'package.json'),
  path.join(ROOT, 'next.config.ts'),
  path.join(ROOT, 'next.config.js'),
  path.join(ROOT, 'tsconfig.json'),
  path.join(ROOT, 'tailwind.config.ts'),
  path.join(ROOT, 'tailwind.config.js'),
].filter(fs.existsSync);

// ─── Logging ───────────────────────────────────────────────────────────────
function log(msg, level = 'info') {
  const icons = { info: 'ℹ', success: '✅', warning: '⚠️', error: '❌', push: '🚀' };
  const icon  = icons[level] || 'ℹ';
  const ts    = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const line  = `[${ts}] ${icon}  ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (_) {}
}

function separator(char = '─', len = 68) {
  const line = char.repeat(len);
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (_) {}
}

// ─── Git helpers ───────────────────────────────────────────────────────────
function git(cmd, silent = false) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: ROOT, encoding: 'utf8',
      stdio: silent ? 'pipe' : 'pipe'
    }).trim();
  } catch (e) {
    throw new Error(e.stderr || e.message);
  }
}

function hasUncommittedChanges() {
  try {
    const status = git('status --porcelain', true);
    return status.length > 0;
  } catch (_) { return false; }
}

function getChangedFiles() {
  try {
    const status = git('status --porcelain', true);
    return status.split('\n').filter(Boolean).map(l => l.trim().replace(/^\S+\s+/, ''));
  } catch (_) { return []; }
}

function getCurrentBranch() {
  try { return git('rev-parse --abbrev-ref HEAD', true); } catch (_) { return 'main'; }
}

function getLastCommitHash() {
  try { return git('rev-parse --short HEAD', true); } catch (_) { return 'unknown'; }
}

function getLastCommitMessage() {
  try { return git('log -1 --pretty=%s', true); } catch (_) { return ''; }
}

// ─── Core push routine ─────────────────────────────────────────────────────
let pushing = false;

async function pushChanges(reason = 'file change') {
  if (pushing) {
    log('Push already in progress — skipping duplicate trigger', 'warning');
    return;
  }
  pushing = true;

  separator('═');
  log(`PUSH TRIGGERED: ${reason}`, 'push');
  separator();

  try {
    // 1. Stage everything
    const changed = getChangedFiles();
    if (changed.length === 0) {
      log('Nothing to commit — working tree clean', 'info');
      pushing = false;
      return;
    }

    log(`Staging ${changed.length} changed file(s):`);
    changed.slice(0, 10).forEach(f => log(`  • ${f}`));
    if (changed.length > 10) log(`  …and ${changed.length - 10} more`);

    git('add -A');
    log('git add -A ✓', 'success');

    // 2. Commit with auto-message
    const ts      = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const msg     = `auto-sync: ${changed.length} file(s) updated [${ts}]`;
    git(`commit -m "${msg}"`);
    const hash = getLastCommitHash();
    log(`Committed: ${hash} — "${msg}"`, 'success');

    // 3. Push
    log(`Pushing to GitHub (origin/${getCurrentBranch()})...`);
    git(`push origin ${getCurrentBranch()}`);
    log('Pushed to GitHub ✓', 'success');

    separator();
    log('Vercel deployment triggered — live in ~2-4 min at siwa.today', 'success');
    separator('═');

  } catch (err) {
    separator();
    log(`Push failed: ${err.message}`, 'error');
    log('Fix the error above and changes will retry on next file save', 'warning');
    separator('═');
  } finally {
    pushing = false;
  }
}

// ─── Debouncer ─────────────────────────────────────────────────────────────
let debounceTimer  = null;
let pendingFiles   = new Set();

function onFileChange(filePath) {
  // Ignore hidden files, node_modules, .next, etc.
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  if (parts.some(p => IGNORE_DIRS.has(p))) return;
  if (path.basename(filePath).startsWith('.')) return;

  pendingFiles.add(rel);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const files = [...pendingFiles];
    pendingFiles.clear();
    debounceTimer = null;
    pushChanges(`${files.length} file(s) saved`);
  }, DEBOUNCE_MS);
}

// ─── File watcher ──────────────────────────────────────────────────────────
function startWatcher() {
  separator('═');
  log('SIWA.TODAY LIVE-DEPLOY WATCHER STARTED', 'push');
  separator();
  log(`Watching ${WATCH_TARGETS.length} target(s) for changes...`);
  WATCH_TARGETS.forEach(t => log(`  📁 ${path.relative(ROOT, t)}`));
  log(`Debounce: ${DEBOUNCE_MS / 1000}s — pushes after last file save`);
  log(`Log file: sync.log`);
  log(`Branch:   origin/${getCurrentBranch()}`);
  log(`Commit:   ${getLastCommitHash()} — ${getLastCommitMessage()}`);
  separator();
  log('Press Ctrl+C to stop. File saves now auto-push to siwa.today.', 'success');
  separator('═');

  WATCH_TARGETS.forEach(target => {
    try {
      const isDir = fs.statSync(target).isDirectory();
      fs.watch(target, { recursive: isDir }, (_event, filename) => {
        if (filename) {
          const full = isDir ? path.join(target, filename) : target;
          onFileChange(full);
        }
      });
    } catch (e) {
      log(`Could not watch ${target}: ${e.message}`, 'warning');
    }
  });

  // Keep-alive
  process.stdin.resume();

  // On exit, cancel any pending push
  process.on('SIGINT', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    separator('═');
    log('Watcher stopped by user.', 'warning');
    separator('═');
    process.exit(0);
  });
}

// ─── Status command ────────────────────────────────────────────────────────
function showStatus() {
  separator('═');
  log('SIWA.TODAY SYNC STATUS');
  separator();
  log(`Branch:        origin/${getCurrentBranch()}`);
  log(`Last commit:   ${getLastCommitHash()} — ${getLastCommitMessage()}`);
  const changed = getChangedFiles();
  if (changed.length === 0) {
    log('Local changes: none — fully in sync with GitHub ✓', 'success');
  } else {
    log(`Local changes: ${changed.length} unstaged file(s)`, 'warning');
    changed.forEach(f => log(`  • ${f}`));
    log('Run with --once to push them now', 'info');
  }
  separator('═');
}

// ─── Entry point ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--status')) {
  showStatus();
} else if (args.includes('--once')) {
  if (hasUncommittedChanges()) {
    pushChanges('manual --once push').then(() => process.exit(0));
  } else {
    log('Nothing to push — working tree is clean', 'success');
    process.exit(0);
  }
} else {
  startWatcher();
}
