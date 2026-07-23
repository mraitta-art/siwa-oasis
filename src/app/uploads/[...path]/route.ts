import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getMediaFilePath } from '@/lib/media-storage';

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.m4v': 'video/x-m4v'
  };
  return map[ext] || 'application/octet-stream';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path: segments } = await params;
    const relativePath = (segments || []).join('/');
    if (!relativePath) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
    }

    const filePath = getMediaFilePath(relativePath);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': getContentType(filePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Media serve error', error);
    return NextResponse.json({ error: 'Unable to serve media' }, { status: 500 });
  }
}
