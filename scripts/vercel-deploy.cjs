#!/usr/bin/env node
/**
 * One-click production deploy for siwify.com, budget-aware for the Vercel Hobby plan.
 *
 * STRATEGY — every rule below exists because it threatens the free tier:
 *
 *   R1  One build at a time .......... Hobby allows a single concurrent build, so a second
 *                                      deploy queues and both waste build minutes.
 *   R2  Daily deployment budget ...... 100 deployments/day. Refuse at 80, warn at 60.
 *   R3  Type check before push ....... next.config.ts sets ignoreBuildErrors, so a broken
 *                                      build would otherwise reach production silently.
 *   R4  No secrets in the commit ..... .env files and private keys are never committed.
 *   R5  Source-upload ceiling ........ 100 MB cap on uploaded source. public/ fails at
 *                                      90 MB, warns at 70 MB.
 *   R6  Egress guard ................. Fast Data Transfer is 100 GB/month and one large
 *                                      hero image can retire it; changed media over 1.5 MB
 *                                      is reported (that is what sets the monthly cliff).
 *   R7  Push once, to the watched repo  Vercel only builds mraitta-art/siwa-oasis. A bare
 *                                      `git push` already mirrors the fork, so never run a
 *                                      CLI deploy alongside it.
 *   R8  Verify the live alias ....... A green build is not a working site; health and key
 *                                      routes are asserted before the run is called a success.
 *
 * Usage:
 *   node scripts/vercel-deploy.cjs                  full run (gates -> commit -> push -> wait -> verify)
 *   node scripts/vercel-deploy.cjs -m "message"     full run with a chosen commit message
 *   node scripts/vercel-deploy.cjs --dry-run        gates only, nothing committed or pushed
 *   node scripts/vercel-deploy.cjs --fast           skip the type check gate (R3)
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_ID = 'prj_vCitnOksBb9IsdV8wsA9NX8GaRzf';
const BASE_URL = process.env.SIWA_DEPLOY_BASE_URL || 'https://siwify.com';
const MAX_BUILDS_PER_DAY = 80;
const WARN_BUILDS_PER_DAY = 60;
const PUBLIC_FAIL_MB = 90;
const PUBLIC_WARN_MB = 70;
const LARGE_ASSET_MB = 1.5;
const BUILD_WAIT_MS = 10 * 60 * 1000;

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const argValue = (name) => {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  return argv[i + 1] || null;
};

const DRY_RUN = flag('--dry-run');
const FAST = flag('--fast');
const MESSAGE = argValue('-m') || argValue('--message');

const color = process.stdout.isTTY
  ? { dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', reset: '\x1b[0m' }
  : { dim: '', red: '', green: '', yellow: '', cyan: '', reset: '' };

const log = (msg) => console.log(msg);
const step = (msg) => log(`\n${color.cyan}==>${color.reset} ${msg}`);
const ok = (msg) => log(`  ${color.green}ok${color.reset}   ${msg}`);
const warn = (msg) => log(`  ${color.yellow}warn${color.reset} ${msg}`);
const fail = (msg) => log(`  ${color.red}fail${color.reset} ${msg}`);
const info = (msg) => log(`  ${color.dim}${msg}${color.reset}`);

function die(msg, code = 1) {
  fail(msg);
  log(`\n${color.red}Deploy aborted.${color.reset} Nothing was pushed.`);
  process.exit(code);
}

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32' && cmd.endsWith('.cmd'),
    env: { ...process.env, GCM_INTERACTIVE: 'never', GIT_TERMINAL_PROMPT: '0', ...env },
  });
  return {
    code: typeof res.status === 'number' ? res.status : 1,
    out: `${res.stdout || ''}${res.stderr || ''}`.trim(),
  };
}

function git(args) {
  return run('git', args);
}

function readVercelToken() {
  const candidates = [
    path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'com.vercel.cli', 'Data', 'auth.json'),
    path.join(os.homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
    path.join(os.homedir(), '.vercel', 'auth.json'),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (parsed.token) return parsed.token;
    } catch {
      /* unreadable candidate, try the next one */
    }
  }
  return null;
}

async function vercel(pathname, token) {
  const res = await fetch(`https://api.vercel.com${pathname}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status} for ${pathname}`);
  return res.json();
}

function dirSizeMb(dir) {
  let total = 0;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else total += fs.statSync(full).size;
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return total / (1024 * 1024);
}

function changedFiles() {
  const { out } = git(['status', '--porcelain']);
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[A-Z?!\s]{1,2}\s+/, '').replace(/^"|"$/g, '').split(' -> ').pop());
}

function areaOf(file) {
  const parts = file.split('/');
  if (parts[0] === 'src' && parts[1] === 'app') return parts[2] === 'api' ? 'api' : 'pages';
  return parts[0] || 'root';
}

async function main() {
  log(`${color.cyan}SIWA deploy${color.reset} ${color.dim}${ROOT}${color.reset}`);
  info(`mode: ${DRY_RUN ? 'dry-run (gates only)' : 'full'}${FAST ? ', fast (no tsc)' : ''}`);

  // ---- R7 preconditions -------------------------------------------------------
  step('Checking repository state');
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).out;
  if (branch !== 'main') die(`Branch is "${branch}" — production must deploy from main.`);
  ok('branch main');

  const dirty = changedFiles();
  const sha = git(['rev-parse', 'HEAD']).out;
  const upstreamSha = git(['ls-remote', 'upstream', '--heads', 'main']).out.split(/\s+/)[0] || '';
  const ahead = sha !== upstreamSha;
  if (dirty.length === 0 && !ahead) {
    ok('nothing to deploy — working tree clean and upstream is at this commit');
    log(`\n${color.green}Nothing to do.${color.reset}`);
    process.exit(0);
  }
  if (dirty.length) ok(`${dirty.length} changed file(s)`);
  if (ahead) info(`HEAD ${sha.slice(0, 7)} differs from upstream ${upstreamSha.slice(0, 7) || 'unknown'}`);

  // ---- R4 secrets -------------------------------------------------------------
  step('Scanning the commit for secrets');
  const secret = dirty.find((f) => /(^|\/)\.env(\.|$)/.test(f) || /\.(pem|key|pfx|p12)$/i.test(f));
  if (secret) die(`Refusing to commit credential file: ${secret}`);
  ok('no .env or private key files staged');

  // ---- R5 source upload ceiling -------------------------------------------------
  step('Checking uploaded source weight (Hobby cap: 100 MB)');
  const publicMb = dirSizeMb(path.join(ROOT, 'public'));
  if (publicMb >= PUBLIC_FAIL_MB) die(`public/ is ${publicMb.toFixed(1)} MB — close to the 100 MB cap. Move media off public/ first.`);
  if (publicMb >= PUBLIC_WARN_MB) warn(`public/ is ${publicMb.toFixed(1)} MB (warn at ${PUBLIC_WARN_MB} MB)`);
  else ok(`public/ is ${publicMb.toFixed(1)} MB`);

  // ---- R6 egress guard ---------------------------------------------------------
  const heavy = dirty
    .filter((f) => f.startsWith('public/') && fs.existsSync(path.join(ROOT, f)))
    .map((f) => ({ f, mb: fs.statSync(path.join(ROOT, f)).size / (1024 * 1024) }))
    .filter((x) => x.mb > LARGE_ASSET_MB);
  if (heavy.length) {
    warn(`${heavy.length} media file(s) over ${LARGE_ASSET_MB} MB in this deploy — each one sets the monthly egress cliff:`);
    for (const x of heavy) info(`${x.mb.toFixed(2)} MB  ${x.f}`);
  } else {
    ok('no oversized media in this change');
  }

  // ---- R1 / R2 Vercel budget state --------------------------------------------
  const token = readVercelToken();
  if (!token) {
    warn('no Vercel token found — skipping build-budget preflight (R1, R2)');
  } else {
    try {
      step('Checking Vercel build budget');
      const { deployments } = await vercel(`/v6/deployments?projectId=${PROJECT_ID}&limit=30`, token);
      const active = deployments.filter((d) => ['QUEUED', 'BUILDING', 'INITIALIZING'].includes(d.state));
      const today = deployments.filter((d) => Date.now() - d.createdAt < 24 * 60 * 60 * 1000);

      if (active.length) {
        warn(`${active.length} build already in flight (Hobby allows 1) — waiting for it to finish`);
        for (let i = 0; i < 36; i += 1) {
          await new Promise((r) => setTimeout(r, 10000));
          const now = await vercel(`/v6/deployments?projectId=${PROJECT_ID}&limit=5`, token);
          if (!now.deployments.some((d) => ['QUEUED', 'BUILDING', 'INITIALIZING'].includes(d.state))) break;
        }
        ok('previous build finished');
      } else {
        ok('no build in flight');
      }

      if (today.length >= MAX_BUILDS_PER_DAY) die(`${today.length} deployments in the last 24h — daily budget guard (${MAX_BUILDS_PER_DAY}/100). Try again later.`);
      if (today.length >= WARN_BUILDS_PER_DAY) warn(`${today.length} deployments in the last 24h (warn at ${WARN_BUILDS_PER_DAY}, hard cap 100)`);
      else ok(`${today.length} deployments in the last 24h`);
    } catch (e) {
      warn(`Vercel preflight skipped: ${e.message}`);
    }
  }

  // ---- R3 type check -----------------------------------------------------------
  if (!FAST) {
    step('Type checking (next.config ignores build errors, so this is the real gate)');
    const tsc = run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsc', '--noEmit']);
    if (tsc.code !== 0) {
      log(tsc.out.split('\n').slice(0, 25).join('\n'));
      die('Type check failed.');
    }
    ok('tsc --noEmit clean');
  }

  if (DRY_RUN) {
    log(`\n${color.green}Dry run complete.${color.reset} All gates passed; nothing committed or pushed.`);
    process.exit(0);
  }

  // ---- commit ------------------------------------------------------------------
  let targetSha = sha;
  if (dirty.length) {
    step('Committing');
    const areas = [...new Set(dirty.map(areaOf))].slice(0, 4).join(', ');
    const message = MESSAGE || `deploy: update ${areas} (${dirty.length} files)`;
    const staged = git(['add', '-A']);
    if (staged.code !== 0) die(`git add failed: ${staged.out}`);
    const commit = git(['commit', '-m', message]);
    if (commit.code !== 0) die(`git commit failed: ${commit.out}`);
    targetSha = git(['rev-parse', 'HEAD']).out;
    ok(`${targetSha.slice(0, 7)} ${message}`);
  } else {
    step('Nothing to commit');
    ok(`pushing existing commit ${targetSha.slice(0, 7)}`);
  }

  // ---- R7 push (mirrors the fork as a side effect) ------------------------------
  step('Pushing to mraitta-art/siwa-oasis (Vercel source) and mirroring the fork');
  const push = git(['push']);
  if (push.code !== 0) {
    log(push.out);
    die('git push failed. Check the GitHub credential, then re-run.');
  }
  ok(push.out.split('\n').filter(Boolean).slice(-2).join(' | ') || 'pushed');

  // ---- wait for the git build ---------------------------------------------------
  let deployment = null;
  if (token) {
    step('Waiting for the Vercel build triggered by this push');
    const started = Date.now();
    let lastState = '';
    while (Date.now() - started < BUILD_WAIT_MS) {
      await new Promise((r) => setTimeout(r, 10000));
      const { deployments } = await vercel(`/v6/deployments?projectId=${PROJECT_ID}&limit=10`, token);
      const match = deployments.find((d) => (d.meta?.githubCommitSha || '').startsWith(targetSha));
      if (!match) {
        info('no deployment for this commit yet…');
        continue;
      }
      if (match.state !== lastState) {
        lastState = match.state;
        info(`${match.state} ${Math.round((Date.now() - started) / 1000)}s`);
      }
      if (match.state === 'READY') {
        deployment = match;
        break;
      }
      if (['ERROR', 'CANCELED'].includes(match.state)) {
        log(`\nBuild logs: https://vercel.com/mraitta-1404s-projects/siwa-oasis/deployments`);
        die(`Vercel build ended in ${match.state}. Production still serves the previous deployment.`);
      }
    }
    if (!deployment) die('Timed out waiting for the Vercel build (10 min).');
    ok(`${deployment.state} in ${Math.round((Date.now() - started) / 1000)}s — ${deployment.url}`);
  } else {
    warn('no Vercel token — cannot confirm the build; verify the dashboard');
  }

  // ---- R8 live verification ------------------------------------------------------
  step(`Verifying ${BASE_URL}`);
  const checks = [
    { path: '/api/health', expect: 200, assert: (body) => body.includes('"database":"connected"') },
    { path: '/api/jana/approval-packages', expect: 401 },
    { path: '/api/jana/outreach/batch-send', expect: 405 },
  ];
  let bad = 0;
  for (const check of checks) {
    try {
      const res = await fetch(`${BASE_URL}${check.path}`, { redirect: 'manual' });
      const body = check.assert ? await res.text() : '';
      const good = res.status === check.expect && (!check.assert || check.assert(body));
      if (good) ok(`${check.path} -> ${res.status}`);
      else {
        bad += 1;
        fail(`${check.path} -> ${res.status} (expected ${check.expect})`);
      }
    } catch (e) {
      bad += 1;
      fail(`${check.path} -> ${e.message}`);
    }
  }

  if (bad > 0) {
    log(`\n${color.red}Site verification failed.${color.reset}`);
    log(`Roll back with:  git revert --no-edit ${targetSha.slice(0, 7)} && git push`);
    process.exit(1);
  }

  log(`\n${color.green}Deployed ${targetSha.slice(0, 7)} to ${BASE_URL}${color.reset}`);
  log(`${color.dim}git push is still the only step needed next time.${color.reset}`);
}

main().catch((e) => {
  fail(e && e.stack ? e.stack : String(e));
  process.exit(1);
});
