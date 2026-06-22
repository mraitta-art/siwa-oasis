import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, data } = body || {};
    if (!data) return NextResponse.json({ success: false, error: 'Missing image data' }, { status: 400 });

    // Ensure uploads dir
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Derive ext and safe name
    const matches = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(data);
    const ext = matches ? (matches[2] === 'jpeg' ? 'jpg' : matches[2]) : 'png';
    const rawBase64 = matches ? matches[3] : data.replace(/^data:.+;base64,/, '');
    const safeName = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, '_') : `img_${Date.now()}.${ext}`;
    const finalName = safeName.includes('.') ? safeName : `${safeName}.${ext}`;

    const buffer = Buffer.from(rawBase64, 'base64');
    const outPath = path.join(uploadsDir, finalName);
    fs.writeFileSync(outPath, buffer);

    const url = `/uploads/${finalName}`;
    return NextResponse.json({ success: true, url }, { status: 201 });
  } catch (err: any) {
    console.error('Upload error', err);
    return NextResponse.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, info: 'POST image base64 to this endpoint' });
}

// Node runtime (default) so filesystem writes are allowed
