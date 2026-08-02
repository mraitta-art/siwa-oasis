import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = process.cwd();
const LOG_FILE = path.join(PROJECT_ROOT, 'deploy-log.json');
const LOCK_FILE = path.join(PROJECT_ROOT, '.deploy-running.lock');

export async function GET() {
  let history: object[] = [];
  try {
    if (fs.existsSync(LOG_FILE)) {
      history = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    }
  } catch {}

  const running = fs.existsSync(LOCK_FILE);
  const lastDeploy = history.length > 0 ? history[history.length - 1] : null;

  // Get current git info
  let gitInfo: { branch?: string; hash?: string; dirty?: boolean } = {};
  try {
    const { execSync } = await import('child_process');
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: PROJECT_ROOT }).toString().trim();
    const hash = execSync('git rev-parse --short HEAD', { cwd: PROJECT_ROOT }).toString().trim();
    const status = execSync('git status --porcelain', { cwd: PROJECT_ROOT }).toString().trim();
    gitInfo = { branch, hash, dirty: status.length > 0 };
  } catch {}

  return NextResponse.json({
    running,
    lastDeploy,
    history: history.slice(-20).reverse(),
    git: gitInfo,
    serverTime: new Date().toISOString(),
  });
}
