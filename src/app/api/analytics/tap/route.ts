import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Tap beacon — records "this visitor chose to contact the vendor".
 *
 * Deliberately rides on `page_views` instead of a new table: the dashboard needs
 * taps joined to views by business, and `page_path` already carries the slug.
 * Encoding is `/<slug>?tap=<channel>&src=<source>` so both dimensions survive
 * grouping without a schema change (migrate-before-deploy stays satisfied).
 *
 * Contract: always answers 200. This endpoint is called from a contact button;
 * a 4xx/5xx here would show up as a broken WhatsApp link in the field.
 */

const CHANNELS = new Set(['whatsapp', 'call', 'directions', 'email', 'share', 'book']);

function parseDeviceType(ua: string): string {
  const value = (ua || '').toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(value)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|windows phone/.test(value)) return 'mobile';
  return 'desktop';
}

function parseCountry(headers: Headers): string | null {
  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country-code');
  return country ? country.toUpperCase().slice(0, 2) : null;
}

/** Referrer wins only when there is no explicit `?src=` tag. */
function deriveSource(src: unknown, referrer: string): string | null {
  const explicit = typeof src === 'string' ? src.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) : '';
  if (explicit) return explicit;
  const ref = (referrer || '').toLowerCase();
  if (!ref) return null;
  if (/instagram/.test(ref)) return 'instagram';
  if (/facebook|fb\./.test(ref)) return 'facebook';
  if (/tiktok/.test(ref)) return 'tiktok';
  if (/google\./.test(ref)) return 'google';
  if (/wa\.me|whatsapp/.test(ref)) return 'whatsapp';
  if (/airbnb/.test(ref)) return 'airbnb';
  if (/bing\./.test(ref)) return 'bing';
  return 'referral';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));

    const slug = String(body?.slug || '').trim().toLowerCase().slice(0, 120);
    const channel = String(body?.channel || '').trim().toLowerCase();

    if (!slug || !CHANNELS.has(channel)) {
      return NextResponse.json({ ok: true, skipped: 'invalid_payload' });
    }

    const business = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM businesses WHERE slug = ? LIMIT 1',
      [slug]
    ).catch(() => null);

    // Unclaimed slugs (reserved words, deleted businesses) are silently ignored.
    if (!business?.id) {
      return NextResponse.json({ ok: true, skipped: 'unknown_slug' });
    }

    const ua = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const source = deriveSource(body?.src, referrer);

    const sessionId = String(body?.session_id || '').trim().slice(0, 64)
      || 'anon-' + Buffer.from(
        (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') + ua
      ).toString('base64').substring(0, 32);

    const pagePath = `/${slug}?tap=${channel}${source ? `&src=${source}` : ''}`;

    await execute(
      `INSERT INTO page_views (session_id, page_path, page_type, business_id, referrer, user_agent, device_type, country)
       VALUES (?, ?, 'minisite_tap', ?, ?, ?, ?, ?)`,
      [
        sessionId,
        pagePath.substring(0, 500),
        business.id,
        referrer ? referrer.substring(0, 500) : null,
        ua.substring(0, 500),
        parseDeviceType(ua),
        parseCountry(request.headers),
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[analytics/tap] failed', error);
    return NextResponse.json({ ok: true, skipped: 'storage_unavailable' });
  }
}

/** Cheap health check so ops can confirm the route is deployed without faking a tap. */
export async function GET() {
  return NextResponse.json({ ok: true, writes: 'page_views/page_type=minisite_tap' });
}
