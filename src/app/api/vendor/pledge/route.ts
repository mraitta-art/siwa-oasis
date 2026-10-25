import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { isGooglePlacesConfigured, parseCustomData, verifyPledgeGoogleLink } from '@/lib/google-places';
import { getBusinessPublicUrl } from '@/lib/public-url';
import { buildPromoKit } from '@/lib/promo-kit';
import {
  VENDOR_PLEDGE_VERSION,
  buildVendorPledge,
  evaluateVendorPledge,
  readVendorPledge,
} from '@/lib/vendor-pledge';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];

/**
 * Mutual visibility pledge for the signed-in vendor.
 *
 * GET  — pledge status, promo kit copy and the minisite URL.
 * POST — `{ action: 'verify' }` re-checks the Google profile website field,
 *        `{ action: 'accept' }` records the pledge for a pre-existing business
 *        that accepted the agreement before section 7 existed.
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

function shapePledge(business: any, language: 'en' | 'ar', googleSetup: Record<string, any> | null) {
  const customData = parseCustomData(business.custom_data);
  const minisiteUrl = business.slug ? getBusinessPublicUrl(business) : '';
  const pledge = evaluateVendorPledge(readVendorPledge(customData));
  return {
    businessId: business.id,
    slug: business.slug,
    minisiteUrl,
    pledgeVersion: VENDOR_PLEDGE_VERSION,
    pledge,
    googlePlaceStatus: pledge?.google_place_status || 'unknown',
    googlePlaceCheckedAt: pledge?.google_place_checked_at || null,
    googleSetup,
    promoKit: buildPromoKit({ businessName: business.name || '', minisiteUrl, language }),
    googleConfigured: isGooglePlacesConfigured(),
  };
}

/**
 * Everything a vendor needs to create a Google profile themselves, taken from
 * data they already gave us. We prepare it; Google still has to verify them.
 */
async function buildGoogleSetup(business: any, minisiteUrl: string) {
  const customData = parseCustomData(business.custom_data);
  const identity = {
    ...(customData.business_info || {}),
    ...(customData.sec_1_identity || {}),
    ...(customData.basic || {}),
    ...(customData.identity || {}),
  };

  let category = '';
  if (business.type_id) {
    try {
      const typeRow = await queryOne<any>('SELECT name FROM business_types WHERE id = ? LIMIT 1', [business.type_id]);
      category = typeRow?.name ? String(typeRow.name) : '';
    } catch (error: any) {
      console.warn('[vendor/pledge] business_types lookup skipped:', error?.message || error);
    }
  }

  const photos = Array.isArray(customData.photos) ? customData.photos.map(String).filter(Boolean).slice(0, 5) : [];

  return {
    name: String(business.name || ''),
    category,
    address: String(identity.address || customData.address || ''),
    phone: String(business.vendor_phone || identity.phone || identity.whatsapp || customData.phone || ''),
    website: minisiteUrl,
    description: String(business.description || '').slice(0, 750),
    photos,
    addBusinessUrl: 'https://business.google.com/add',
    note: 'Google verifies every new profile itself (postcard, phone or video). We cannot skip that step and we do not create listings without the owner.',
  };
}

export async function GET(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const business = await queryOne<any>(
    'SELECT id, name, slug, description, type_id, vendor_phone, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const language = request.nextUrl.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
  const minisiteUrl = business.slug ? getBusinessPublicUrl(business) : '';
  const googleSetup = await buildGoogleSetup(business, minisiteUrl);
  return NextResponse.json(shapePledge(business, language, googleSetup));
}

export async function POST(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action === 'accept' ? 'accept' : 'verify';
  const language = body?.lang === 'ar' || request.nextUrl.searchParams.get('lang') === 'ar' ? 'ar' : 'en';

  const business = await queryOne<any>(
    'SELECT id, name, slug, description, type_id, vendor_phone, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const customData = parseCustomData(business.custom_data);

  if (action === 'accept' && !readVendorPledge(customData)) {
    await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [
      JSON.stringify({
        ...customData,
        pledge: buildVendorPledge({
          slug: business.slug || business.id,
          via: resolved.role === 'vendor' ? 'vendor_dashboard' : 'admin_dashboard',
        }),
      }),
      business.id,
    ]);
  }

  const verification = await verifyPledgeGoogleLink(business.id);

  const updated = await queryOne<any>(
    'SELECT id, name, slug, description, type_id, vendor_phone, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [business.id]
  );

  if (business.slug) {
    invalidateCache.websiteSettings();
    revalidatePath(`/${business.slug}`);
  }

  const refreshed = updated || business;
  const minisiteUrl = refreshed.slug ? getBusinessPublicUrl(refreshed) : '';

  return NextResponse.json({
    success: true,
    action,
    verification,
    ...shapePledge(refreshed, language, await buildGoogleSetup(refreshed, minisiteUrl)),
  });
}
