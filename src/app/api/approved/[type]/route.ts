import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const APPROVED_DIR = path.join(process.cwd(), 'data', 'approved');

function ensureDir() {
  if (!fs.existsSync(APPROVED_DIR)) fs.mkdirSync(APPROVED_DIR, { recursive: true });
}

export async function GET(req: NextRequest, { params }: any) {
  try {
    const type = params.type; // 'offers', 'investments', 'packages', 'discounts'
    const file = path.join(APPROVED_DIR, `${type}.json`);
    
    let items = [];
    if (fs.existsSync(file)) {
      try {
        items = JSON.parse(fs.readFileSync(file, 'utf-8'));
      } catch (e) {
        items = [];
      }
    }

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error('GET /api/approved/[type] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    ensureDir();
    const type = params.type;
    const file = path.join(APPROVED_DIR, `${type}.json`);

    let items = [];
    if (fs.existsSync(file)) {
      try {
        items = JSON.parse(fs.readFileSync(file, 'utf-8'));
      } catch (e) {
        items = [];
      }
    }

    const body = await req.json();
    const { id, is_featured } = body;

    // Find and update item
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx < 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (is_featured !== undefined) {
      items[idx].is_featured = is_featured;
    }

    fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf-8');
    return NextResponse.json({ success: true, item: items[idx] });
  } catch (err: any) {
    console.error('PATCH /api/approved/[type] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
