import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'journey-config.json');

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    const json = JSON.parse(raw);
    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Basic validation: ensure categories and vibes exist
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    const toWrite = JSON.stringify({ categories: body.categories || [], vibes: body.vibes || {} }, null, 2);
    await fs.writeFile(CONFIG_PATH, toWrite, 'utf8');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save' }, { status: 500 });
  }
}
