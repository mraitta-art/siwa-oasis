import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { parseCustomData } from '@/lib/google-places';
import { buildAirbnbKit, sanitizeForAirbnb } from '@/lib/airbnb-kit';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];

/**
 * Airbnb content pack for the signed-in vendor.
 *
 * Read-only: Airbnb has no public content API and forbids off-platform links in
 * listing text, so we prepare compliant copy the host pastes themselves. The
 * optional POST body `{ draft }` runs the same sanitiser over text the vendor
 * already wrote, so they can check a listing before publishing it.
 */
async function resolveBusiness(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated', status: 401 as const };

  const requested = request.nextUrl.searchParams.get('businessId');
  const businessId = user.role === 'vendor' ? user.businessId : requested || user.businessId || null;

  if (!businessId) return { error: 'No business linked to this account.', status: 403 as const };
  if (user.role !== 'vendor' && !ADMIN_ROLES.includes(user.role)) {
    return { error: 'Not allowed.', status: 403 as const };
  }
  return { businessId, role: user.role };
}

function countPhotos(customData: Record<string, any>): number {
  const buckets = [customData.photos, customData.gallery, customData.media?.photos, customData.images];
  let total = 0;
  for (const bucket of buckets) {
    if (Array.isArray(bucket)) total = Math.max(total, bucket.filter(Boolean).length);
  }
  return total;
}

export async function GET(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const business = await queryOne<any>(
    'SELECT id, name, slug, description, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const customData = parseCustomData(business.custom_data);
  const kit = buildAirbnbKit({
    name: business.name || '',
    description: business.description,
    customData,
    photoCount: countPhotos(customData),
  });

  return NextResponse.json({
    businessId: business.id,
    slug: business.slug,
    kit,
  });
}

/** Checks a draft listing the vendor already wrote against Airbnb's link rules. */
export async function POST(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body = await request.json().catch(() => ({}));
  const draft = typeof body?.draft === 'string' ? body.draft.slice(0, 5000) : '';
  if (!draft.trim()) {
    return NextResponse.json({ error: 'Nothing to check.' }, { status: 400 });
  }

  const result = sanitizeForAirbnb(draft);
  return NextResponse.json({
    success: true,
    blocked: result.removed.length > 0,
    removed: result.removed,
    cleaned: result.text,
  });
}
