import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = process.cwd();
const LOG_FILE = path.join(PROJECT_ROOT, 'deploy-log.json');
const LOCK_FILE = path.join(PROJECT_ROOT, '.deploy-running.lock');

function readLog(): DeployLog[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function writeLog(entries: DeployLog[]) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries.slice(-50), null, 2));
}

export interface DeployLog {
  id: string;
  triggeredBy: string;
  triggeredAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: 'running' | 'success' | 'failed';
  commitHash?: string;
  output?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  // Prevent concurrent deploys
  if (fs.existsSync(LOCK_FILE)) {
    return NextResponse.json({ error: 'A deployment is already in progress.' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const triggeredBy = body.triggeredBy ?? 'admin-ui';

  const jobId = `deploy-${Date.now()}`;
  const startedAt = new Date().toISOString();

  // Write lock + initial log entry
  fs.writeFileSync(LOCK_FILE, jobId);
  const logs = readLog();
  const entry: DeployLog = {
    id: jobId,
    triggeredBy,
    triggeredAt: startedAt,
    status: 'running',
  };
  logs.push(entry);
  writeLog(logs);

  // Spawn deploy script non-blocking
  const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'live-deploy.js');
  const child = spawn('node', [scriptPath, '--once'], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: 'pipe',
  });

  let outputBuf = '';
  let errorBuf = '';

  child.stdout?.on('data', (d) => { outputBuf += d.toString(); });
  child.stderr?.on('data', (d) => { errorBuf += d.toString(); });

  child.on('close', (code) => {
    // Remove lock
    try { fs.unlinkSync(LOCK_FILE); } catch {}

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(startedAt).getTime();

    // Try to extract commit hash from output
    const hashMatch = outputBuf.match(/\b([a-f0-9]{7,40})\b/);
    const commitHash = hashMatch?.[1];

    const allLogs = readLog();
    const idx = allLogs.findIndex((l) => l.id === jobId);
    const updated: DeployLog = {
      ...entry,
      finishedAt,
      durationMs,
      status: code === 0 ? 'success' : 'failed',
      commitHash,
      output: outputBuf.slice(-2000),
      error: errorBuf.slice(-1000) || undefined,
    };
    if (idx !== -1) allLogs[idx] = updated;
    else allLogs.push(updated);
    writeLog(allLogs);

    // Trigger alarm webhook if configured
    try {
      const schedPath = path.join(PROJECT_ROOT, 'deploy-schedule.json');
      if (fs.existsSync(schedPath)) {
        const sched = JSON.parse(fs.readFileSync(schedPath, 'utf-8'));
        const webhookUrl: string = sched?.alarms?.webhookUrl ?? '';
        const alarmOnFail: boolean = sched?.alarms?.onFailOnly ?? true;
        const shouldAlarm = webhookUrl && (!alarmOnFail || code !== 0);
        if (shouldAlarm) {
          const emoji = code === 0 ? '✅' : '❌';
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `${emoji} Siwa Deploy ${code === 0 ? 'SUCCESS' : 'FAILED'} — ${new Date().toLocaleString()} (${Math.round(durationMs / 1000)}s)`,
            }),
          }).catch(() => {});
        }
      }
    } catch {}
  });

  child.unref();

  return NextResponse.json({ jobId, startedAt, message: 'Deployment started.' });
}
