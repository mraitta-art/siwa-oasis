import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getOrCreateManifest, publishManifest, validateMinisiteManifest } from '@/lib/minisite-manifest';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const user = await requireAdmin();
    const { businessId } = await params;
    const draft = await getOrCreateManifest(businessId, user.id);
    const errors = validateMinisiteManifest(draft);
    if (errors.length) return NextResponse.json({ error: 'Manifest validation failed.', errors }, { status: 422 });
    const published = await publishManifest(businessId, user.id);
    return NextResponse.json({ success: true, manifest: published });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Manifest publish failed' }, { status: 400 });
  }
}