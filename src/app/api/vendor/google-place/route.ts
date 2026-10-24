import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { isGooglePlacesConfigured, parseCustomData, readPlaceSnapshot, syncBusinessGooglePlace } from '@/lib/google-places';
import { hasConsent } from '@/lib/vendor-consents';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];

async function resolveBusinessId(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated', status: 401 as const };

  const requested = request.nextUrl.searchParams.get('businessId');
  if (requested && ADMIN_ROLES.includes(user.role)) return { businessId: requested };
  if (user.businessId) return { businessId: user.businessId };

  return { error: 'No business linked to this account.', status: 403 as const };
}

/** Cached Google snapshot for the dashboard / minisite — never triggers a lookup. */
export async function GET(request: NextRequest) {
  const resolved = await resolveBusinessId(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const business = await queryOne<any>('SELECT id, custom_data FROM businesses WHERE id = ? LIMIT 1', [
    resolved.businessId,
  ]);
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const customData = parseCustomData(business.custom_data);
  return NextResponse.json({
    configured: isGooglePlacesConfigured(),
    consentGranted: hasConsent(customData.consents, 'google_place_data'),
    googleProfileUrl: typeof customData.google_profile_url === 'string' ? customData.google_profile_url : '',
    snapshot: readPlaceSnapshot(customData),
  });
}

/** Manually refresh the snapshot (dashboard button / admin action). */
export async function POST(request: NextRequest) {
  const resolved = await resolveBusinessId(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body = await request.json().catch(() => ({}));
  const result = await syncBusinessGooglePlace(resolved.businessId, { force: body?.force === true });

  if (result.ok) {
    return NextResponse.json({ success: true, cached: result.cached, snapshot: result.snapshot });
  }

  const status = result.reason === 'no_consent' ? 403 : result.reason === 'not_configured' ? 503 : 422;
  return NextResponse.json({ error: result.message || result.reason, reason: result.reason }, { status });
}
