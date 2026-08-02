#!/usr/bin/env node
/**
 * SIWA.TODAY — Deployment Schedule Runner
 * Runs as a background process. Every minute it checks deploy-schedule.json
 * and fires live-deploy.js --once when the cron expression matches.
 *
 * Usage:
 *   node scripts/schedule-runner.js
 *
 * To stop:
 *   Press Ctrl+C, or close the window.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCHEDULE_FILE = path.join(PROJECT_ROOT, 'deploy-schedule.json');
const LOG_FILE = path.join(PROJECT_ROOT, 'deploy-log.json');
const LOCK_FILE = path.join(PROJECT_ROOT, '.deploy-running.lock');
const SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'live-deploy.js');

// ── Logging ────────────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });
  console.log(`[${ts}] [schedule-runner] ${msg}`);
}

// ── Cron match ─────────────────────────────────────────────────────────────
function cronMatches(expression, date) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [min, hour, dom, month, dow] = parts;

  const match = (field, value) => {
    if (field === '*') return true;
    if (field.includes('/')) {
      const [, step] = field.split('/');
      return value % parseInt(step) === 0;
    }
    if (field.includes(',')) return field.split(',').map(Number).includes(value);
    return parseInt(field) === value;
  };

  return (
    match(min,   date.getMinutes()) &&
    match(hour,  date.getHours())   &&
    match(dom,   date.getDate())    &&
    match(month, date.getMonth() + 1) &&
    match(dow,   date.getDay())
  );
}

// ── Read / Write helpers ───────────────────────────────────────────────────
function readSchedule() {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function readLog() {
  try {
    if (fs.existsSync(LOG_FILE)) return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } catch {}
  return [];
}

function writeLog(entries) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries.slice(-50), null, 2));
}

// ── Deploy trigger ─────────────────────────────────────────────────────────
function triggerDeploy(triggeredBy = 'scheduler') {
  if (fs.existsSync(LOCK_FILE)) {
    log('⚠️  Deploy already running, skipping scheduled trigger.');
    return;
  }

  const jobId = `deploy-${Date.now()}`;
  const startedAt = new Date().toISOString();
  fs.writeFileSync(LOCK_FILE, jobId);
  log(`🚀 Triggering scheduled deploy — jobId: ${jobId}`);

  const logs = readLog();
  const entry = { id: jobId, triggeredBy, triggeredAt: startedAt, status: 'running' };
  logs.push(entry);
  writeLog(logs);

  let out = '';
  let err = '';
  const child = spawn('node', [SCRIPT, '--once'], { cwd: PROJECT_ROOT, stdio: 'pipe' });

  child.stdout.on('data', (d) => { out += d.toString(); process.stdout.write(d); });
  child.stderr.on('data', (d) => { err += d.toString(); process.stderr.write(d); });

  child.on('close', (code) => {
    try { fs.unlinkSync(LOCK_FILE); } catch {}
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(startedAt).getTime();
    const hashMatch = out.match(/\b([a-f0-9]{7,40})\b/);
    const commitHash = hashMatch?.[1];

    const allLogs = readLog();
    const idx = allLogs.findIndex((l) => l.id === jobId);
    const updated = {
      ...entry,
      finishedAt,
      durationMs,
      status: code === 0 ? 'success' : 'failed',
      commitHash,
      output: out.slice(-2000),
      error: err.slice(-1000) || undefined,
    };
    if (idx !== -1) allLogs[idx] = updated;
    else allLogs.push(updated);
    writeLog(allLogs);

    const emoji = code === 0 ? '✅' : '❌';
    log(`${emoji} Deploy ${code === 0 ? 'succeeded' : 'failed'} in ${Math.round(durationMs / 1000)}s`);

    // Update lastRun in schedule
    try {
      const sched = readSchedule();
      if (sched) {
        sched.lastRun = finishedAt;
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(sched, null, 2));
      }
    } catch {}

    // Webhook alarm
    try {
      const sched = readSchedule();
      const webhookUrl = sched?.alarms?.webhookUrl ?? '';
      const onFailOnly = sched?.alarms?.onFailOnly ?? true;
      const shouldAlarm = webhookUrl && (!onFailOnly || code !== 0);
      if (shouldAlarm) {
        const text = `${emoji} Siwa.Today Scheduled Deploy ${code === 0 ? 'SUCCESS' : 'FAILED'} — ${new Date().toLocaleString()} (${Math.round(durationMs / 1000)}s)`;
        // Use dynamic import for fetch (Node 18+)
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }).catch(() => {});
      }
    } catch {}
  });
}

// ── Main loop ──────────────────────────────────────────────────────────────
log('✅ Schedule runner started. Checking every 60 seconds...');
log(`   Schedule file: ${SCHEDULE_FILE}`);

setInterval(() => {
  const sched = readSchedule();
  if (!sched || !sched.enabled) return;

  const now = new Date();
  if (cronMatches(sched.cronExpression, now)) {
    log(`⏰ Cron match: "${sched.cronExpression}" — triggering deploy...`);
    triggerDeploy('scheduler');
  }
}, 60_000);

// Keep alive
process.on('SIGINT', () => {
  log('👋 Schedule runner stopped.');
  process.exit(0);
});
