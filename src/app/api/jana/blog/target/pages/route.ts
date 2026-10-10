import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { listSiteBlogLocations } from '@/lib/site-blog-locations';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ pages: await listSiteBlogLocations() });
  } catch (error) {
    console.error('Failed to load main-site blog locations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load main-site pages' },
      { status: 500 },
    );
  }
}
