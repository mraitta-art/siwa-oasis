import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

// Parse device type from user-agent
function parseDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (!ua) return 'desktop';
  const lower = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(lower)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile/.test(lower)) return 'mobile';
  return 'desktop';
}

// Classify page type from the path
function classifyPage(path: string): { pageType: string; businessSlug: string | null } {
  if (path === '/') return { pageType: 'homepage', businessSlug: null };
  if (path.startsWith('/jana')) return { pageType: 'admin', businessSlug: null };
  if (path.startsWith('/vendor')) return { pageType: 'vendor', businessSlug: null };
  if (path.startsWith('/offers')) return { pageType: 'offers', businessSlug: null };
  if (path.startsWith('/packages')) return { pageType: 'packages', businessSlug: null };
  if (path.startsWith('/discounts')) return { pageType: 'discounts', businessSlug: null };
  if (path.startsWith('/investment')) return { pageType: 'investments', businessSlug: null };
  if (path.startsWith('/auctions')) return { pageType: 'auctions', businessSlug: null };
  if (path.startsWith('/blog')) return { pageType: 'blog', businessSlug: null };
  if (path.startsWith('/login') || path.startsWith('/signup')) return { pageType: 'auth', businessSlug: null };
  if (path.startsWith('/explore') || path.startsWith('/search')) return { pageType: 'discovery', businessSlug: null };

  // If it's a single-segment path like /my-hotel-slug, it's likely a business minisite
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 1 && !segments[0].startsWith('_')) {
    return { pageType: 'business', businessSlug: segments[0] };
  }

  return { pageType: 'other', businessSlug: null };
}

// Extract primary language/country from Accept-Language header
function parseCountry(acceptLang: string | null): string | null {
  if (!acceptLang) return null;
  const match = acceptLang.match(/^([a-z]{2})(?:-([A-Z]{2}))?/i);
  if (match && match[2]) return match[2]; // e.g. "en-US" → "US"
  if (match && match[1]) return match[1].toUpperCase(); // e.g. "ar" → "AR"
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: pagePath, referrer, duration_ms, session_id } = body;

    if (!pagePath || typeof pagePath !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing path' }, { status: 400 });
    }

    const ua = request.headers.get('user-agent') || '';
    const acceptLang = request.headers.get('accept-language');
    const deviceType = parseDeviceType(ua);
    const country = parseCountry(acceptLang);
    const { pageType, businessSlug } = classifyPage(pagePath);

    // Resolve business_id from slug if it's a business page
    let businessId: string | null = null;
    if (businessSlug) {
      try {
        const rows = await query<{ id: string }>('SELECT id FROM businesses WHERE slug = ? LIMIT 1', [businessSlug]);
        if (rows.length > 0) businessId = rows[0].id;
      } catch {
        // If businesses table doesn't exist yet, just skip
      }
    }

    // Use the session_id from the client, or generate one from IP+UA as fallback
    const sid = session_id || 'anon-' + Buffer.from(
      (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') + ua
    ).toString('base64').substring(0, 32);

    await execute(
      `INSERT INTO page_views (session_id, page_path, page_type, business_id, referrer, user_agent, device_type, country, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sid.substring(0, 64),
        pagePath.substring(0, 500),
        pageType,
        businessId,
        (referrer || '').substring(0, 1000) || null,
        ua.substring(0, 500),
        deviceType,
        country,
        duration_ms && typeof duration_ms === 'number' ? Math.min(duration_ms, 3600000) : null,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Analytics Track Error]', err.message);
    // Never fail the page load — always return success even on DB errors
    return NextResponse.json({ ok: true });
  }
}
