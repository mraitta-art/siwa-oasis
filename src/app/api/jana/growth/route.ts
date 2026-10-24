import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getPublicMinisiteUrl } from '@/lib/public-url';
import { evaluateVendorTrial, readVendorTrial } from '@/lib/vendor-trial';
import { evaluateVendorPledge, readVendorPledge } from '@/lib/vendor-pledge';

export const dynamic = 'force-dynamic';

/**
 * Growth playbook API.
 *
 * Reads only what already exists (`page_views`, `businesses`,
 * `vendor_service_controls`) and derives the five steps of the gradual plan
 * from data, so the page can never claim a step is done when it is not.
 *
 * Two writes, both manual by design (no cron yet):
 *   - send_digest : sends/reports the weekly vendor numbers
 *   - set_pass    : sets the "reach" season pass (`services_expires_at`)
 */

const TAP_RE = /[?&]tap=([a-z]+)/i;
const SRC_RE = /[?&]src=([a-z0-9_-]+)/i;
const DAY_MS = 86_400_000;

type ViewAgg = {
  business_id: string;
  page_path: string;
  hits_7: string | number;
  hits_30: string | number;
};

type BizRow = {
  id: string;
  slug: string;
  name: string;
  tier: string | null;
  service_level: string | null;
  vendor_phone: string | null;
  custom_data: any;
  services_expires_at: string | null;
};

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function topKey(map: Map<string, number>): string | null {
  let best: string | null = null;
  let bestValue = 0;
  for (const [key, value] of map) {
    if (value > bestValue) {
      best = key;
      bestValue = value;
    }
  }
  return best;
}

function normalizePhone(raw: unknown): string | null {
  let digits = String(raw ?? '').replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = '20' + digits.slice(1);
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

function sqlDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function buildDigestMessage(input: {
  name: string;
  views: number;
  taps: number;
  topChannel: string | null;
  url: string;
}): string {
  const channelLine = input.topChannel
    ? `أكثر تواصل: ${input.topChannel}`
    : 'لا يوجد تواصل مسجّل بعد';
  return [
    `السلام عليكم ${input.name}،`,
    '',
    `صفحتك على سيوايفاي هذا الأسبوع:`,
    `${input.views} زيارة · ${input.taps} تواصل مباشر`,
    `${channelLine}`,
    '',
    `شارك الرابط: ${input.url}`,
    '',
    `SiWiFy · 0% commission on direct bookings`,
  ].join('\n');
}

export async function GET() {
  try {
    await requireAdmin();

    // One grouped read over 30 days; taps and sources are encoded in page_path.
    const viewRows = await query<ViewAgg>(
      `SELECT business_id, page_path,
              SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS hits_7,
              COUNT(*) AS hits_30
         FROM page_views
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND business_id IS NOT NULL
        GROUP BY business_id, page_path
        LIMIT 5000`
    ).catch(() => [] as ViewAgg[]);

    type Bundle = {
      views7: number; views30: number;
      taps7: number; taps30: number;
      channels: Map<string, number>;
      sources: Map<string, number>;
    };
    const byBusiness = new Map<string, Bundle>();

    for (const row of viewRows) {
      const businessId = String(row.business_id || '');
      if (!businessId) continue;
      const bucket = byBusiness.get(businessId) || {
        views7: 0, views30: 0, taps7: 0, taps30: 0,
        channels: new Map<string, number>(), sources: new Map<string, number>(),
      };

      const hits7 = num(row.hits_7);
      const hits30 = num(row.hits_30);
      const tapMatch = TAP_RE.exec(row.page_path || '');
      const srcMatch = SRC_RE.exec(row.page_path || '');

      if (tapMatch) {
        bucket.taps7 += hits7;
        bucket.taps30 += hits30;
        const channel = tapMatch[1].toLowerCase();
        bucket.channels.set(channel, (bucket.channels.get(channel) || 0) + hits30);
      } else {
        bucket.views7 += hits7;
        bucket.views30 += hits30;
      }
      if (srcMatch) {
        const source = srcMatch[1].toLowerCase();
        bucket.sources.set(source, (bucket.sources.get(source) || 0) + hits30);
      }

      byBusiness.set(businessId, bucket);
    }

    // Season pass lives on a side table; degrade to nulls on older deployments.
    let businesses: BizRow[] = [];
    try {
      businesses = await query<BizRow>(
        `SELECT b.id, b.slug, b.name, b.subscription_tier AS tier, b.service_level,
                b.vendor_phone, b.custom_data, vsc.services_expires_at
           FROM businesses b
           LEFT JOIN vendor_service_controls vsc ON vsc.business_id = b.id
          WHERE b.is_claimed = 1
          ORDER BY b.updated_at DESC
          LIMIT 400`
      );
    } catch {
      businesses = await query<BizRow>(
        `SELECT b.id, b.slug, b.name, b.subscription_tier AS tier, b.service_level,
                b.vendor_phone, b.custom_data, NULL AS services_expires_at
           FROM businesses b
          WHERE b.is_claimed = 1
          ORDER BY b.updated_at DESC
          LIMIT 400`
      ).catch(() => [] as BizRow[]);
    }

    const now = Date.now();
    const rows = businesses.map((b) => {
      const bundle = byBusiness.get(b.id);
      const trial = evaluateVendorTrial(readVendorTrial(b.custom_data));
      const pledge = evaluateVendorPledge(readVendorPledge(b.custom_data));
      const digest = (b.custom_data?.digest || {}) as { last_sent_at?: string; views?: number; taps?: number };
      const lastSent = digest.last_sent_at && Number.isFinite(new Date(digest.last_sent_at).getTime())
        ? new Date(digest.last_sent_at).getTime()
        : null;

      return {
        id: b.id,
        slug: b.slug,
        name: b.name,
        url: getPublicMinisiteUrl(b.slug),
        tier: b.tier || 'free',
        service_level: b.service_level || 'template',
        phone: b.vendor_phone,
        views7: bundle?.views7 || 0,
        views30: bundle?.views30 || 0,
        taps7: bundle?.taps7 || 0,
        taps30: bundle?.taps30 || 0,
        topChannel: bundle ? topKey(bundle.channels) : null,
        topSource: bundle ? topKey(bundle.sources) : null,
        trial_status: trial.status,
        trial_days_left: trial.days_remaining,
        pledge_status: pledge?.status || 'none',
        pledge_days_left: pledge?.days_remaining ?? null,
        digest_last_sent_at: lastSent ? new Date(lastSent).toISOString() : null,
        digest_due_days: lastSent === null ? null : Math.floor((now - lastSent) / DAY_MS),
        pass_expires_at: b.services_expires_at,
      };
    });

    rows.sort((a, b) => (b.taps7 - a.taps7) || (b.views7 - a.views7) || a.name.localeCompare(b.name));

    const claimed = rows.length;
    const shared = rows.filter((r) => r.views7 > 0).length;
    const contactable = rows.filter((r) => normalizePhone(r.phone)).length;
    const totals = {
      claimed,
      shared,
      never_shared: claimed - shared,
      contactable,
      views7: rows.reduce((sum, r) => sum + r.views7, 0),
      taps7: rows.reduce((sum, r) => sum + r.taps7, 0),
      taps30: rows.reduce((sum, r) => sum + r.taps30, 0),
      digest_sent_7: rows.filter((r) => r.digest_last_sent_at && new Date(r.digest_last_sent_at).getTime() >= now - 7 * DAY_MS).length,
      digest_overdue: rows.filter((r) => r.digest_last_sent_at === null || (r.digest_due_days ?? 0) >= 7).length,
      trial_active: rows.filter((r) => r.trial_status === 'active').length,
      trial_ending: rows.filter((r) => r.trial_status === 'active' && r.trial_days_left <= 14).length,
      pass_active: rows.filter((r) => r.pass_expires_at && new Date(r.pass_expires_at).getTime() > now).length,
    };

    const shareRate = claimed ? shared / claimed : 0;
    const contactRate = claimed ? contactable / claimed : 0;

    const steps = [
      {
        key: 'sensor',
        title: 'Step 1 · Turn the tap beacon on',
        owner: 'Engineering',
        why: 'Without taps you are guessing. A tap = a visitor pressed WhatsApp/call/map on the vendor page.',
        metric: `${totals.taps7} taps in 7 days`,
        status: totals.taps30 > 0 ? 'done' : 'blocked',
        fix: 'Mount MinisiteTapTracker on /[slug] and /[slug]/[section].',
      },
      {
        key: 'share',
        title: 'Step 2 · Get 5 vendors to share their own link',
        owner: 'Sales',
        why: 'The page only works when the vendor sends it to people who already know them.',
        metric: `${shared}/${claimed} shared (${Math.round(shareRate * 100)}%)`,
        status: claimed === 0 ? 'blocked' : shareRate >= 0.5 ? 'done' : 'ready',
        fix: 'Send the link plus the QR to the vendor on WhatsApp, ask them to post it in their bio.',
      },
      {
        key: 'contact',
        title: 'Step 3 · Make sure you can reach every vendor',
        owner: 'Support',
        why: 'A digest, a reminder or a renewal cannot be delivered to a business with no valid number.',
        metric: `${contactable}/${claimed} reachable (${Math.round(contactRate * 100)}%)`,
        status: claimed === 0 ? 'blocked' : contactRate >= 0.9 ? 'done' : 'ready',
        fix: 'Fill vendor_phone from the vendor interview, not from Google.',
      },
      {
        key: 'digest',
        title: 'Step 4 · Send the weekly numbers back to them',
        owner: 'Support',
        why: 'A vendor who sees "12 visits, 3 WhatsApp taps" renews. A vendor who sees nothing churns.',
        metric: `${totals.digest_sent_7} sent this week · ${totals.digest_overdue} overdue`,
        status: totals.digest_overdue === 0 && totals.digest_sent_7 > 0 ? 'done' : claimed === 0 ? 'blocked' : 'ready',
        fix: 'Use the digest panel below for the first ten sends, then automate.',
      },
      {
        key: 'reach',
        title: 'Step 5 · Charge for reach, not for existence',
        owner: 'Admin',
        why: 'Never paywall the page. Sell featured placement, season passes and routed requests instead.',
        metric: `${totals.pass_active} active season passes`,
        status: totals.pass_active > 0 ? 'done' : 'ready',
        fix: 'Set a 120-day pass on the best 3 vendors before the season starts.',
      },
    ] as const;

    const alerts: Array<{
      key: string;
      severity: 'high' | 'medium' | 'low';
      business_id: string;
      business_name: string;
      message: string;
      action: string;
    }> = [];

    for (const row of rows) {
      if (!normalizePhone(row.phone)) {
        alerts.push({
          key: `phone:${row.id}`, severity: 'high', business_id: row.id, business_name: row.name,
          message: 'No reachable WhatsApp number — you cannot deliver their numbers.',
          action: 'Add vendor_phone',
        });
      }
      if (row.views7 === 0) {
        alerts.push({
          key: `share:${row.id}`, severity: 'medium', business_id: row.id, business_name: row.name,
          message: 'Zero visits in 7 days — the link was never shared.',
          action: 'Send share kit',
        });
      }
      if (row.views7 > 0 && row.taps7 === 0) {
        alerts.push({
          key: `silent:${row.id}`, severity: 'medium', business_id: row.id, business_name: row.name,
          message: `${row.views7} visits and no taps — check the contact buttons.`,
          action: 'Inspect minisite',
        });
      }
      if (row.digest_due_days === null || row.digest_due_days >= 7) {
        alerts.push({
          key: `digest:${row.id}`, severity: 'low', business_id: row.id, business_name: row.name,
          message: row.digest_due_days === null ? 'Never sent a digest.' : `Digest due ${row.digest_due_days} days ago.`,
          action: 'Send digest',
        });
      }
      if (row.trial_status === 'active' && row.trial_days_left <= 14) {
        alerts.push({
          key: `trial:${row.id}`, severity: 'high', business_id: row.id, business_name: row.name,
          message: `Free trial ends in ${row.trial_days_left} days.`,
          action: 'Book a call',
        });
      }
      if (row.pledge_status === 'expired') {
        alerts.push({
          key: `pledge:${row.id}`, severity: 'low', business_id: row.id, business_name: row.name,
          message: 'Mutual-visibility pledge grace period expired without a verified social link.',
          action: 'Verify links',
        });
      }
    }

    const severityRank = { high: 0, medium: 1, low: 2 } as const;
    alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      totals,
      steps,
      alerts: alerts.slice(0, 40),
      rows,
    });
  } catch (error: any) {
    const unauthenticated = String(error?.message || '').includes('authenticated')
      || String(error?.message || '').includes('Admin access');
    console.error('[jana/growth] GET failed', error);
    return NextResponse.json(
      { error: unauthenticated ? 'Not authorized' : 'Failed to load growth signals' },
      { status: unauthenticated ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({} as any));
    const action = String(body?.action || '');
    const businessId = String(body?.businessId || '').trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const business = await queryOne<{
      id: string; name: string; slug: string; vendor_phone: string | null; custom_data: any;
    }>(
      'SELECT id, name, slug, vendor_phone, custom_data FROM businesses WHERE id = ? LIMIT 1',
      [businessId]
    );
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (action === 'send_digest') {
      const stats = await queryOne<{ views: string | number; taps: string | number }>(
        `SELECT
           SUM(CASE WHEN page_path LIKE '%tap=%' THEN 1 ELSE 0 END) AS taps,
           SUM(CASE WHEN page_path NOT LIKE '%tap=%' THEN 1 ELSE 0 END) AS views
         FROM page_views
        WHERE business_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [business.id]
      ).catch(() => null);

      const views = num(stats?.views);
      const taps = num(stats?.taps);
      const bundles = await query<{ page_path: string }>(
        `SELECT page_path FROM page_views
          WHERE business_id = ? AND page_path LIKE '%tap=%'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [business.id]
      ).catch(() => [] as { page_path: string }[]);

      const channelCounts = new Map<string, number>();
      for (const row of bundles) {
        const match = TAP_RE.exec(row.page_path || '');
        if (match) channelCounts.set(match[1], (channelCounts.get(match[1]) || 0) + 1);
      }

      const url = getPublicMinisiteUrl(business.slug);
      const text = buildDigestMessage({
        name: business.name,
        views,
        taps,
        topChannel: topKey(channelCounts),
        url,
      });

      if (body?.dryRun) {
        return NextResponse.json({ ok: true, sent: false, dryRun: true, text, views, taps });
      }

      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const templateName = process.env.WHATSAPP_DIGEST_TEMPLATE;
      const apiVersion = process.env.WHATSAPP_API_VERSION;
      const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar';
      const to = normalizePhone(business.vendor_phone);

      if (!accessToken || !phoneNumberId || !templateName || !apiVersion) {
        return NextResponse.json({
          ok: true,
          sent: false,
          reason: 'digest_template_not_configured',
          text,
          hint: 'Set WHATSAPP_DIGEST_TEMPLATE (body params: name, views, taps). Until then copy the text manually.',
        });
      }
      if (!to) {
        return NextResponse.json({ ok: false, error: 'No valid vendor WhatsApp number.', text }, { status: 400 });
      }

      const graphResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: business.name },
                { type: 'text', text: String(views) },
                { type: 'text', text: String(taps) },
              ],
            }],
          },
        }),
      });

      const graphBody = await graphResponse.json().catch(() => ({} as any));
      if (!graphResponse.ok) {
        console.error('[jana/growth] digest send failed', graphBody);
        return NextResponse.json(
          { ok: false, error: graphBody?.error?.message || 'WhatsApp send failed', text },
          { status: 502 }
        );
      }

      const messageId = graphBody?.messages?.[0]?.id || null;
      const customData = {
        ...(business.custom_data || {}),
        digest: {
          last_sent_at: new Date().toISOString(),
          views,
          taps,
          message_id: messageId,
          sent_by: admin.email || admin.id,
        },
      };
      await execute('UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?', [
        JSON.stringify(customData),
        business.id,
      ]);

      return NextResponse.json({ ok: true, sent: true, messageId, text, views, taps });
    }

    if (action === 'set_pass') {
      const days = Math.min(730, Math.max(0, Math.round(Number(body?.days) || 0)));
      const expiresAt = days > 0 ? sqlDate(new Date(Date.now() + days * DAY_MS)) : null;
      const note = days > 0
        ? `Reach pass · ${days} days · set by ${admin.email || admin.id}`
        : `Reach pass cleared by ${admin.email || admin.id}`;

      // Leaves minisite_status untouched on update so an admin suspension survives.
      await execute(
        `INSERT INTO vendor_service_controls (business_id, minisite_status, services_expires_at, admin_note)
         VALUES (?, 'active', ?, ?)
         ON DUPLICATE KEY UPDATE services_expires_at = VALUES(services_expires_at), admin_note = VALUES(admin_note)`,
        [business.id, expiresAt, note]
      );

      return NextResponse.json({ ok: true, days, expires_at: expiresAt });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    const unauthenticated = String(error?.message || '').includes('authenticated')
      || String(error?.message || '').includes('Admin access');
    console.error('[jana/growth] POST failed', error);
    return NextResponse.json(
      { error: unauthenticated ? 'Not authorized' : 'Action failed' },
      { status: unauthenticated ? 401 : 500 }
    );
  }
}
