import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const files = fs.readdirSync(uploadsDir);
    const mediaFiles = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
      .map(file => ({
        name: file,
        url: `/uploads/${file}`,
        size: fs.statSync(path.join(uploadsDir, file)).size,
        modified: fs.statSync(path.join(uploadsDir, file)).mtime
      }));

    return NextResponse.json(mediaFiles);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
