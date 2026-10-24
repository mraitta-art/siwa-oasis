import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { parseCustomData } from '@/lib/google-places';
import { getPublicMinisiteUrl } from '@/lib/public-url';
import { VENDOR_SERVICE_CATALOG } from '@/lib/vendor-services';
import {
  VENDOR_TRIAL_VERSION,
  buildVendorTrial,
  countYoutubeLinks,
  evaluateVendorTrial,
  extendVendorTrial,
  readVendorTrial,
  resolveServiceStates,
  resolveTrialDays,
  resolveTrialQuota,
} from '@/lib/vendor-trial';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];

/**
 * Free-period status for the signed-in vendor.
 *
 * GET  — days left, quota in use, service states, and the admin-set period.
 * POST — admin only: start, extend or end a business's period.
 *
 * Nothing here deletes or unpublishes anything; the end of a period only stops
 * editing and pauses the growth services.
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

async function readTier(tierId: string) {
  const row = await queryOne<any>('SELECT name, features FROM subscription_tiers WHERE id = ? LIMIT 1', [tierId]);
  const features = typeof row?.features === 'string' ? JSON.parse(row.features) : row?.features || {};
  return { name: String(row?.name || tierId), features };
}

/** What the vendor has already used of each "try one" allowance. */
async function readUsage(businessId: string, customData: Record<string, any>) {
  let videos = 0;
  let slides = 0;

  try {
    const row = await queryOne<any>(
      `SELECT COUNT(*) AS total FROM vendor_gallery
        WHERE vendor_id IN (SELECT id FROM profiles WHERE business_id = ?)
          AND mime_type LIKE 'video/%'`,
      [businessId]
    );
    videos = Number(row?.total) || 0;
  } catch {
    // Gallery table is optional on older deployments.
  }

  try {
    const row = await queryOne<any>('SELECT config FROM website_configs WHERE type = ? LIMIT 1', [
      `hero_carousel_biz_${businessId}_hero`,
    ]);
    const config = typeof row?.config === 'string' ? JSON.parse(row.config) : row?.config;
    slides = Array.isArray(config?.slides) ? config.slides.length : 0;
  } catch {
    // No carousel configured yet.
  }

  return { videos, slides, youtube: countYoutubeLinks(customData) };
}

function shapeBusiness(
  business: any,
  customData: Record<string, any>,
  features: Record<string, any>,
  tierName: string,
  usage: { videos: number; slides: number; youtube: number },
) {
  const trial = readVendorTrial(customData);
  const evaluated = evaluateVendorTrial(trial);
  const states = resolveServiceStates(evaluated, features);

  return {
    businessId: business.id,
    slug: business.slug,
    minisiteUrl: business.slug ? getPublicMinisiteUrl(business.slug) : '',
    trialVersion: VENDOR_TRIAL_VERSION,
    trial: evaluated,
    defaultDays: resolveTrialDays(features),
    tier: { id: business.subscription_tier || 'free', name: tierName },
    quota: {
      ...resolveTrialQuota(features),
      photosUsed: countPhotos(customData),
      videosUsed: usage.videos,
      slidesUsed: usage.slides,
      youtubeUsed: usage.youtube,
    },
    services: VENDOR_SERVICE_CATALOG.map(service => ({
      key: service.key,
      label: service.label,
      description: service.description,
      category: service.category,
      state: states[service.key] || 'upgrade',
    })),
  };
}

export async function GET(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const business = await queryOne<any>(
    'SELECT id, name, slug, subscription_tier, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const customData = parseCustomData(business.custom_data);
  const tier = await readTier(business.subscription_tier || 'free');
  const usage = await readUsage(business.id, customData);

  return NextResponse.json({
    ...shapeBusiness(business, customData, tier.features, tier.name, usage),
    canManage: resolved.role !== 'vendor',
  });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveBusiness(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (resolved.role === 'vendor') {
    return NextResponse.json({ error: 'Only SiWiFy can change the free period.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = ['start', 'extend', 'end'].includes(body?.action) ? body.action : null;
  if (!action) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  const business = await queryOne<any>(
    'SELECT id, name, slug, subscription_tier, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [resolved.businessId]
  );
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

  const customData = parseCustomData(business.custom_data);
  const tier = await readTier(business.subscription_tier || 'free');
  const requestedDays = Number(body?.days);
  const days = Number.isFinite(requestedDays) && requestedDays > 0 ? Math.floor(requestedDays) : resolveTrialDays(tier.features);

  const existing = readVendorTrial(customData);
  let trial;
  if (action === 'start') {
    trial = buildVendorTrial({ days, via: 'admin_dashboard' });
  } else if (action === 'extend') {
    trial = existing
      ? extendVendorTrial(existing, days)
      : buildVendorTrial({ days, via: 'admin_dashboard' });
  } else {
    // 'end' keeps the record and the start date, so the history stays auditable.
    // One millisecond after the start reads as "ended" without erasing the row.
    const base = existing || buildVendorTrial({ days, via: 'admin_dashboard' });
    const startedMs = new Date(base.trial_started_at).getTime();
    trial = { ...base, trial_expires_at: new Date(startedMs + 1).toISOString() };
  }

  const nextCustomData = { ...customData, trial };
  await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [JSON.stringify(nextCustomData), business.id]);

  if (business.slug) {
    invalidateCache.websiteSettings();
    revalidatePath(`/${business.slug}`);
  }

  return NextResponse.json({
    success: true,
    action,
    ...shapeBusiness(business, nextCustomData, tier.features, tier.name, await readUsage(business.id, nextCustomData)),
    canManage: true,
  });
}
