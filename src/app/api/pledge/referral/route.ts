import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { parseCustomData } from '@/lib/google-places';
import { detectSocialSource, readVendorPledge, VENDOR_PLEDGE_VERSION } from '@/lib/vendor-pledge';

const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Public beacon fired by a minisite when the visitor arrived from a social app.
 *
 * Instagram and TikTok give us no way to read a bio back, so a real referral
 * click from that platform is the honest evidence we can collect. Writes are
 * throttled to once per platform per week and fail silently.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const slug = typeof body?.slug === 'string' ? body.slug.trim().slice(0, 120) : '';
  if (!slug) return NextResponse.json({ success: false }, { status: 400 });

  const source = detectSocialSource({
    referrer: typeof body?.referrer === 'string' ? body.referrer.slice(0, 500) : null,
    utmSource: typeof body?.utmSource === 'string' ? body.utmSource.slice(0, 60) : null,
  });
  if (!source) return NextResponse.json({ success: true, recorded: false });

  const business = await queryOne<any>(
    'SELECT id, custom_data FROM businesses WHERE slug = ? LIMIT 1',
    [slug]
  );
  if (!business) return NextResponse.json({ success: true, recorded: false });

  const customData = parseCustomData(business.custom_data);
  const pledge = readVendorPledge(customData);
  if (!pledge || pledge.version !== VENDOR_PLEDGE_VERSION) {
    return NextResponse.json({ success: true, recorded: false });
  }

  const previous = pledge.social_detected?.[source];
  const previousAt = previous ? new Date(previous).getTime() : 0;
  if (Number.isFinite(previousAt) && Date.now() - previousAt < REFRESH_AFTER_MS) {
    return NextResponse.json({ success: true, recorded: false });
  }

  await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [
    JSON.stringify({
      ...customData,
      pledge: {
        ...pledge,
        social_detected: { ...(pledge.social_detected || {}), [source]: new Date().toISOString() },
        last_evaluated_at: new Date().toISOString(),
      },
    }),
    business.id,
  ]);

  return NextResponse.json({ success: true, recorded: true, source });
}
