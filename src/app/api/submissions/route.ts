import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'submissions');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
  try {
    ensureDir();
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const items = files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')); } catch (e) { return null; }
    }).filter(Boolean);
    return NextResponse.json({ success: true, submissions: items });
  } catch (err: any) {
    console.error('GET /api/submissions error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const now = new Date().toISOString();
    const submission = {
      id,
      type: body.type || 'offer',
      title: body.title || '',
      brief: body.brief || '',
      description: body.description || '',
      images: Array.isArray(body.images) ? body.images : [],
      hero_images: Array.isArray(body.hero_images) ? body.hero_images : [],
      business_id: body.business_id || null,
      business_name: body.business_name || null,
      status: 'pending',
      created_at: now,
    };

    ensureDir();
    fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(submission, null, 2), 'utf-8');
    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error('POST /api/submissions error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
