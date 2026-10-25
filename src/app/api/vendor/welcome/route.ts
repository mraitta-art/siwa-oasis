import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { parseCustomData } from '@/lib/google-places';
import { getBusinessPublicUrl } from '@/lib/public-url';
import { buildPromoKit, buildShareKit, tagMinisiteUrl } from '@/lib/promo-kit';
import { countYoutubeLinks, evaluateVendorTrial, readVendorTrial, resolveTrialQuota } from '@/lib/vendor-trial';
import { evaluateVendorPledge, readVendorPledge } from '@/lib/vendor-pledge';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];
const SCOREBOARD_DAYS = 7;

interface ViewRow {
  page_path: string;
  created_at: string | Date;
}

/**
 * The vendor's activation package, in one read.
 *
 * Everything here is derived from records that already exist: the business row,
 * the tier policy, the trial clock, the pledge, and `page_views` (which already
 * encodes taps and their `src` tags in `page_path`). No new table.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const requested = request.nextUrl.searchParams.get('businessId');
    const businessId = user.role === 'vendor' ? user.businessId : requested || user.businessId || null;
    if (!businessId) return NextResponse.json({ error: 'No business linked to this account.' }, { status: 403 });
    if (user.role !== 'vendor' && !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
    }

    const language = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ar';
    const business = await queryOne<any>(
      `SELECT id, name, slug, description, type_id, subscription_tier, vendor_phone,
              is_published, custom_data, is_claimed
       FROM businesses WHERE id = ? LIMIT 1`,
      [businessId]
    );
    if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

    const customData = parseCustomData(business.custom_data);
    const slug = String(business.slug || business.id);
    const minisiteUrl = getBusinessPublicUrl({ ...business, slug });

    // Tier policy drives the trial clock and the meters, exactly as the acceptance route does.
    let features: Record<string, any> | null = null;
    try {
      const tierRow = await queryOne<any>(
        'SELECT features FROM subscription_tiers WHERE id = ? LIMIT 1',
        [business.subscription_tier || 'free']
      );
      features = parseCustomData(tierRow?.features) as Record<string, any>;
    } catch (error: any) {
      console.warn('[vendor/welcome] tier features unavailable:', error?.message || error);
    }

    const trial = evaluateVendorTrial(readVendorTrial(customData));
    const quota = resolveTrialQuota(features);
    const pledge = evaluateVendorPledge(readVendorPledge(customData));

    const photos = Array.isArray(customData.photos) ? customData.photos.filter(Boolean) : [];
    const youtubeLinks = countYoutubeLinks(customData);

    // One read, two windows: 7 days is what the vendor sees; 30 days is context.
    const rows = await query<ViewRow>(
      `SELECT page_path, created_at FROM page_views
        WHERE business_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY created_at DESC LIMIT 5000`,
      [businessId]
    ).catch(() => [] as ViewRow[]);

    const now = Date.now();
    const scoreboard = {
      days: SCOREBOARD_DAYS,
      views7: 0,
      taps7: 0,
      views30: rows.length,
      taps30: 0,
      sources: [] as Array<{ src: string; count: number }>,
      channels: [] as Array<{ channel: string; count: number }>,
    };
    const sourceCounts = new Map<string, number>();
    const channelCounts = new Map<string, number>();

    for (const row of rows) {
      const path = String(row.page_path || '');
      const at = new Date(row.created_at as any).getTime();
      const within7 = Number.isFinite(at) ? now - at <= SCOREBOARD_DAYS * 86400000 : false;
      const isTap = path.includes('tap=');
      if (isTap) scoreboard.taps30 += 1;
      if (within7) {
        if (isTap) scoreboard.taps7 += 1;
        else scoreboard.views7 += 1;
      }
      if (!isTap) continue;
      const channel = path.match(/tap=([a-z0-9_-]+)/i)?.[1]?.toLowerCase();
      const source = path.match(/src=([a-z0-9_-]+)/i)?.[1]?.toLowerCase();
      if (channel) channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
      if (source) sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    }
    scoreboard.sources = [...sourceCounts.entries()]
      .map(([src, count]) => ({ src, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    scoreboard.channels = [...channelCounts.entries()]
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const linkVisible = pledge?.status === 'verified'
      || Boolean(pledge?.google_place_status && pledge.google_place_status === 'linked')
      || Object.keys(pledge?.social_detected || {}).length > 0;

    const tasks = [
      {
        id: 'page_live',
        label: 'Your page is live',
        labelAr: 'صفحتك منشورة',
        done: Boolean(business.is_published),
        hint: 'https://siwify.com',
        hintAr: 'الرابط جاهز للمشاركة',
      },
      {
        id: 'photos',
        label: 'At least 3 photos',
        labelAr: '٣ صور على الأقل',
        done: photos.length >= 3,
        hint: `${photos.length} / 3`,
        hintAr: `${photos.length} / ٣`,
      },
      {
        id: 'video',
        label: 'One video (YouTube or TikTok link)',
        labelAr: 'فيديو واحد (رابط يوتيوب أو تيك توك)',
        done: youtubeLinks > 0,
        hint: quota.youtube ? `${youtubeLinks} / ${quota.youtube}` : '1',
        hintAr: quota.youtube ? `${youtubeLinks} / ${quota.youtube}` : '١',
      },
      {
        id: 'link_visible',
        label: 'Your page link in a profile you own',
        labelAr: 'رابط صفحتك في حساب تملكه',
        done: linkVisible,
        hint: 'Instagram, Facebook, TikTok or Google',
        hintAr: 'إنستغرام، فيسبوك، تيك توك أو جوجل',
      },
      {
        id: 'first_tap',
        label: 'First WhatsApp tap from a visitor',
        labelAr: 'أول ضغطة واتساب من زائر',
        done: scoreboard.taps30 > 0,
        hint: `${scoreboard.taps30}`,
        hintAr: `${scoreboard.taps30}`,
      },
    ];

    return NextResponse.json({
      ok: true,
      language,
      business: {
        id: business.id,
        name: business.name,
        slug,
        url: minisiteUrl,
        tier: business.subscription_tier || 'free',
        claimed: Boolean(business.is_claimed),
        published: Boolean(business.is_published),
      },
      trial: {
        status: trial.status,
        daysRemaining: trial.days_remaining,
        daysTotal: trial.days_total,
        startedAt: trial.started_at,
        expiresAt: trial.expires_at,
        canEdit: trial.can_edit,
        staysOnline: trial.minisite_stays_online,
      },
      quota,
      tasks,
      promoKit: buildPromoKit({ businessName: business.name || '', minisiteUrl, language }),
      shareKit: buildShareKit({ businessName: business.name || '', minisiteUrl, language }),
      qr: {
        url: tagMinisiteUrl(minisiteUrl, 'qr'),
        fileName: `${slug}-qr.png`,
      },
      scoreboard,
      pledge: pledge
        ? { status: pledge.status, daysRemaining: pledge.days_remaining, google: pledge.google_place_status }
        : null,
      referral: {
        code: slug,
        text: language === 'ar'
          ? `أنا في سيوايفاي — صفحتي جاهزة. لو عندك نشاط في سيوة سجّل واذكر كودي: ${slug}`
          : `I'm on SiWiFy — my page is live. If you run a business in Siwa, sign up and mention my code: ${slug}`,
      },
      dashboardUrl: `/vendor/app?slug=${encodeURIComponent(slug)}`,
    });
  } catch (error: any) {
    console.error('[vendor/welcome GET]', error);
    return NextResponse.json({ error: 'Unable to load your activation package.' }, { status: 500 });
  }
}
