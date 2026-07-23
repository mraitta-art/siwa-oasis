import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { listStoredMediaFiles } from '@/lib/media-storage';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const mediaFiles = listStoredMediaFiles().filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name));
    return NextResponse.json(mediaFiles);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
