import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'homepages');

export async function GET(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    const file = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return NextResponse.json({ success: true, page: null });
    const raw = fs.readFileSync(file, 'utf-8');
    return NextResponse.json({ success: true, page: JSON.parse(raw) });
  } catch (err: any) {
    console.error('GET homepages error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    const body = await request.json();
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const file = path.join(DATA_DIR, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true, saved: file }, { status: 201 });
  } catch (err: any) {
    console.error('POST homepages error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
