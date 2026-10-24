import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { parseCustomData, resolvePlaceIdFromMapsUrl } from '@/lib/google-places';
import {
  VENDOR_CONSENT_VERSION,
  buildConsentLedger,
  extractGooglePlaceId,
  hasConsent,
  sanitizeSocialInput,
  VENDOR_OPTIONAL_CONSENT_IDS,
} from '@/lib/vendor-consents';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];

/**
 * Social links + optional consents for the signed-in vendor's business.
 * Consent is additive here (grant) and removable via DELETE, so a vendor can
 * withdraw a permission without touching the signed participation agreement.
 */
async function resolveBusiness(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated', status: 401 as const };

  const requested = request.nextUrl.searchParams.get('businessId');
  const businessId =
    user.role === 'vendor' ? user.businessId : requested || user.businessId || null;

  if (!businessId) return { error: 'No business linked to this account.', status: 403 as const };
  if (user.role !== 'vendor' && !ADMIN_ROLES.includes(user.role)) {
    return { error: 'Not allowed.', status: 403 as const };
  }

  return { businessId, role: user.role };
}

function shapeResponse(customData: Record<string, any>) {
  const identity = customData.identity || {};
  return {
    consentVersion: VENDOR_CONSENT_VERSION,
    social: {
      instagram_handle: identity.instagram_handle || '',
      facebook_link: identity.facebook_link || '',
      tiktok_handle: identity.tiktok_handle || '',
    },
    googleProfileUrl: typeof customData.google_profile_url === 'string' ? customData.google_profile_url : '',
    consents: {
      social_links: hasConsent(customData.consents, 'social_links'),
      google_place_data: hasConsent(customData.consents, 'google_place_data'),
    },
  };
}

export async function GET(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const business = await queryOne<any>(
    'SELECT id, slug, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  return NextResponse.json({ businessId: business.id, slug: business.slug, ...shapeResponse(parseCustomData(business.custom_data)) });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body = await request.json().catch(() => ({}));
  const business = await queryOne<any>(
    'SELECT id, slug, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const customData = parseCustomData(business.custom_data);
  const social = sanitizeSocialInput(body?.social);
  const googleProfileUrl =
    typeof body?.googleProfileUrl === 'string' ? body.googleProfileUrl.trim().slice(0, 500) : undefined;

  const identity = { ...(customData.identity || {}), ...social };
  const consents = {
    ...(customData.consents || {}),
    ...buildConsentLedger(
      body?.consents && typeof body.consents === 'object' ? body.consents : undefined,
      resolved.role === 'vendor' ? 'vendor_dashboard' : 'admin_dashboard'
    ),
  };

  const nextCustomData: Record<string, any> = {
    ...customData,
    identity,
    consents,
  };
  if (googleProfileUrl !== undefined) nextCustomData.google_profile_url = googleProfileUrl;

  await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [
    JSON.stringify(nextCustomData),
    business.id,
  ]);

  // A pasted Maps link usually carries the ChIJ id — keep the column in sync so
  // the Places sync can run without another lookup.
  const placeId =
    extractGooglePlaceId(googleProfileUrl) ||
    (googleProfileUrl ? await resolvePlaceIdFromMapsUrl(googleProfileUrl) : null);
  if (placeId) {
    try {
      await execute('UPDATE businesses SET google_place_id = ? WHERE id = ?', [placeId, business.id]);
    } catch (error: any) {
      console.warn('[vendor/brand-links] google_place_id column unavailable:', error?.message || error);
    }
  }

  invalidateCache.websiteSettings();
  if (business.slug) {
    revalidatePath(`/${business.slug}`);
    revalidatePath('/[slug]', 'page');
  }

  return NextResponse.json({
    success: true,
    businessId: business.id,
    slug: business.slug,
    placeIdResolved: Boolean(placeId),
    ...shapeResponse(nextCustomData),
  });
}

/** Withdraw one optional consent (keeps the signed agreement untouched). */
export async function DELETE(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const id = request.nextUrl.searchParams.get('consent');
  if (!id || !VENDOR_OPTIONAL_CONSENT_IDS.includes(id as any)) {
    return NextResponse.json({ error: 'Unknown consent.' }, { status: 400 });
  }

  const business = await queryOne<any>(
    'SELECT id, slug, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const customData = parseCustomData(business.custom_data);
  const consents = { ...(customData.consents || {}) };
  delete consents[id];

  const nextCustomData = { ...customData, consents };
  await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [
    JSON.stringify(nextCustomData),
    business.id,
  ]);

  invalidateCache.websiteSettings();
  if (business.slug) revalidatePath(`/${business.slug}`);

  return NextResponse.json({ success: true, ...shapeResponse(nextCustomData) });
}
