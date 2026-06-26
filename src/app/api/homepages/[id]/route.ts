import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'homepages');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ success: true, page: null });
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return NextResponse.json({ success: true, page: JSON.parse(raw) });
  } catch (err: any) {
    console.error('GET homepage error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const file = path.join(DATA_DIR, `${id}.json`);
    
    // Maintain full file structure when saving updates
    let existingData = {};
    if (fs.existsSync(file)) {
      try {
        existingData = JSON.parse(fs.readFileSync(file, 'utf-8'));
      } catch (e) {
        console.warn('Failed to parse existing page data, overwriting', e);
      }
    }

    const updatedPage = {
      ...existingData,
      ...body,
      id, // ensure ID is preserved
      lastModified: new Date().toISOString().split('T')[0]
    };

    fs.writeFileSync(file, JSON.stringify(updatedPage, null, 2), 'utf-8');
    return NextResponse.json({ success: true, saved: file }, { status: 201 });
  } catch (err: any) {
    console.error('POST homepage error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = path.join(DATA_DIR, `${id}.json`);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      return NextResponse.json({ success: true, message: `Homepage ${id} deleted successfully` });
    }
    return NextResponse.json({ success: false, error: 'Homepage not found' }, { status: 404 });
  } catch (err: any) {
    console.error('DELETE homepage error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
