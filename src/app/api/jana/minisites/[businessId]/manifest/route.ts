import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getOrCreateManifest, saveDraftManifest, validateMinisiteManifest, type MinisiteManifest } from '@/lib/minisite-manifest';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const user = await requireAdmin();
    const { businessId } = await params;
    const manifest = await getOrCreateManifest(businessId, user.id);
    return NextResponse.json({ manifest, errors: validateMinisiteManifest(manifest) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Manifest unavailable' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const user = await requireAdmin();
    const { businessId } = await params;
    const body = await request.json();
    const manifest = body.manifest as MinisiteManifest;
    if (!manifest || typeof manifest !== 'object') {
      return NextResponse.json({ error: 'A manifest object is required.' }, { status: 400 });
    }
    const saved = await saveDraftManifest(businessId, manifest, body.event_type || 'admin_patch', user.id);
    return NextResponse.json({ manifest: saved, errors: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Manifest save failed' }, { status: 400 });
  }
}