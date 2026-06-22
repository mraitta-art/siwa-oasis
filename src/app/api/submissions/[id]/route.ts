import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'submissions');
const APPROVED_DIR = path.join(process.cwd(), 'data', 'approved');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(APPROVED_DIR)) fs.mkdirSync(APPROVED_DIR, { recursive: true });
}

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    ensureDirs();
    const id = params.id;
    const file = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const submission = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (body.action === 'approve') {
      submission.status = 'approved';
      submission.approved_at = new Date().toISOString();
      submission.approved_by = body.admin || 'admin';

      // append to approved/{type}.json
      const listFile = path.join(APPROVED_DIR, `${submission.type}.json`);
      let list = [];
      if (fs.existsSync(listFile)) {
        try { list = JSON.parse(fs.readFileSync(listFile, 'utf-8')); } catch(e) { list = []; }
      }
      list.unshift(submission);
      fs.writeFileSync(listFile, JSON.stringify(list, null, 2), 'utf-8');

      // update original submission
      fs.writeFileSync(file, JSON.stringify(submission, null, 2), 'utf-8');
      return NextResponse.json({ success: true, submission });
    }

    if (body.action === 'reject') {
      submission.status = 'rejected';
      submission.rejected_at = new Date().toISOString();
      submission.rejected_by = body.admin || 'admin';
      submission.rejection_reason = body.reason || null;
      fs.writeFileSync(file, JSON.stringify(submission, null, 2), 'utf-8');
      return NextResponse.json({ success: true, submission });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('PATCH /api/submissions/[id] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: any) {
  try {
    const id = params.id;
    const file = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const submission = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error('GET /api/submissions/[id] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
