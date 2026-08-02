import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = process.cwd();
const SCHEDULE_FILE = path.join(PROJECT_ROOT, 'deploy-schedule.json');

export interface ScheduleConfig {
  enabled: boolean;
  preset: 'nightly' | 'every6h' | 'every12h' | 'custom' | 'off';
  cronExpression: string;     // e.g. "0 2 * * *" = 2am daily
  timezone: string;           // e.g. "Africa/Cairo"
  lastRun?: string;
  nextRun?: string;
  alarms: {
    browserPush: boolean;
    webhookUrl: string;
    onFailOnly: boolean;
    emailAddress: string;
  };
}

const DEFAULT_CONFIG: ScheduleConfig = {
  enabled: false,
  preset: 'nightly',
  cronExpression: '0 2 * * *',
  timezone: 'Africa/Cairo',
  alarms: {
    browserPush: true,
    webhookUrl: '',
    onFailOnly: true,
    emailAddress: '',
  },
};

function readConfig(): ScheduleConfig {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8')) };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export async function GET() {
  return NextResponse.json(readConfig());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readConfig();
    const updated: ScheduleConfig = {
      ...current,
      ...body,
      alarms: {
        ...current.alarms,
        ...(body.alarms ?? {}),
      },
    };

    // Compute nextRun from cron expression (simple preview)
    if (updated.enabled && updated.cronExpression) {
      updated.nextRun = computeNextRun(updated.cronExpression);
    } else {
      updated.nextRun = undefined;
    }

    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(updated, null, 2));
    return NextResponse.json({ success: true, config: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** Simple next-run preview — computes next occurrence for common cron expressions */
function computeNextRun(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 'Unknown schedule';
  const [min, hour] = parts;
  const now = new Date();
  const next = new Date();
  const h = parseInt(hour) || 0;
  const m = parseInt(min) || 0;
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toISOString();
}
