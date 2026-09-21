import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_for_development');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'siwa_session';
const PLATFORM_ROOT_DOMAINS = new Set(['siwify.com', 'www.siwify.com', 'localhost', '127.0.0.1']);

/* ─── System Subdomain Routing Table ────────────────────────────────── */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  // Main Oasis Portal
  'siwaoasis': '/',
  'siwa': '/',
  'oasis': '/',
  'home': '/',
  'main': '/',

  // Category & Sector Portals
  'staywith': '/accommodations',
  'stay': '/accommodations',
  'accommodations': '/accommodations',
  'hotels': '/accommodations',
  'camps': '/accommodations',
  'lodges': '/accommodations',

  'movewith': '/transportation',
  'move': '/transportation',
  'transportation': '/transportation',
  'transport': '/transportation',
  'transfers': '/transportation',

  'tours': '/activities',
  'activities': '/activities',
  'experiences': '/activities',
  'safari': '/activities',

  'eatwith': '/food-beverage',
  'eat': '/food-beverage',
  'food': '/food-beverage',
  'restaurants': '/food-beverage',
  'dining': '/food-beverage',

  'crafts': '/crafts-wellness',
  'wellness': '/crafts-wellness',
  'healing': '/crafts-wellness',
  'spa': '/crafts-wellness',

  'trade': '/production-trade',
  'production': '/production-trade',
  'dates': '/production-trade',
  'olives': '/production-trade',

  'services': '/services',
  'explore': '/services',

  // Stories, Media & Community
  'stories': '/blog',
  'story': '/blog',
  'blog': '/blog',
  'magazine': '/blog',
  'news': '/blog',

  // Commercial, Deals & Growth
  'offers': '/offers',
  'deals': '/offers',
  'packages': '/packages',
  'discounts': '/discounts',
  'auctions': '/auctions',
  'invest': '/investment-opportunities',
  'investment': '/investment-opportunities',
  'journeys': '/journeys',
  'journey': '/journeys',
  'planner': '/journeys',

  // Partners & Onboarding
  'partner': '/be-a-partner',
  'partners': '/be-a-partner',
  'join': '/be-a-partner',
};

// Unified role-based route protection table
const ROUTE_GUARDS: Record<string, string[]> = {
  '/admin':      ['super_admin', 'content_admin', 'sales_manager', 'support_agent'],
  '/api/admin':  ['super_admin', 'content_admin', 'sales_manager', 'support_agent'],
  '/jana':       ['super_admin', 'content_admin', 'sales_manager', 'support_agent'],
  '/vendor':     ['vendor', 'super_admin', 'content_admin', 'sales_manager'],
  '/salesman':   ['super_admin', 'sales_manager', 'salesman'],
};

async function verifySession(request: NextRequest): Promise<{ role: string } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { role: (payload as any).role };
  } catch {
    return null;
  }
}

/**
 * Extracts the active subdomain or custom domain from the incoming request.
 */
function extractSubdomain(request: NextRequest): { subdomain: string | null; isCustomDomain: boolean; hostname: string } {
  const hostHeader = request.headers.get('host') || '';
  const hostname = hostHeader.split(':')[0].toLowerCase();

  // Support query param override for local testing (e.g. localhost:3000/?subdomain=staywith)
  const queryOverride = request.nextUrl.searchParams.get('subdomain') || request.nextUrl.searchParams.get('preview_subdomain');
  if (queryOverride) {
    return { subdomain: queryOverride.toLowerCase(), isCustomDomain: false, hostname };
  }

  // Check for standard localhost or IP
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { subdomain: null, isCustomDomain: false, hostname };
  }

  // Check for *.localhost subdomains (e.g. staywith.localhost:3000)
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    return { subdomain: sub !== 'www' ? sub : null, isCustomDomain: false, hostname };
  }

  // Check for *.siwify.com subdomains
  if (hostname.endsWith('.siwify.com')) {
    const sub = hostname.replace('.siwify.com', '');
    return { subdomain: (sub !== 'www' && sub.length > 0) ? sub : null, isCustomDomain: false, hostname };
  }

  // Root platform domain
  if (PLATFORM_ROOT_DOMAINS.has(hostname) || hostname.endsWith('.vercel.app')) {
    return { subdomain: null, isCustomDomain: false, hostname };
  }

  // Full Custom Domain (e.g. siwalodge.com, desertresort.com)
  return { subdomain: null, isCustomDomain: true, hostname };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Session & Role Route Guards
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_GUARDS)) {
    if (pathname.startsWith(prefix)) {
      const session = await verifySession(request);
      if (!session || !allowedRoles.includes(session.role)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized. Valid session required.' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', pathname.startsWith('/vendor') ? 'vendor_required' : 'admin_required');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/jana', request.url));
      }
      break;
    }
  }

  // Skip subdomain rewriting for API routes and internal Next assets
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/jana') || pathname.startsWith('/admin') || pathname.startsWith('/vendor')) {
    return NextResponse.next();
  }

  const { subdomain, isCustomDomain, hostname } = extractSubdomain(request);

  // 2. Full Custom Domain Handling (e.g. vendor's custom domain hotel.com -> /hotel.com or /[slug])
  if (isCustomDomain && hostname) {
    if (pathname === `/${hostname}` || pathname.startsWith(`/${hostname}/`)) {
      return NextResponse.next();
    }
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === '/' ? `/${hostname}` : `/${hostname}${pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // 3. Subdomain Routing (System Portals & Vendor Minisite Subdomains)
  if (subdomain) {
    const targetRoute = SUBDOMAIN_ROUTES[subdomain];

    if (targetRoute) {
      // Loop protection: if already at the target route, pass through directly
      if (pathname === targetRoute || (targetRoute !== '/' && pathname.startsWith(targetRoute))) {
        return NextResponse.next();
      }

      if (pathname === '/') {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = targetRoute;
        return NextResponse.rewrite(rewriteUrl);
      }

      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `${targetRoute}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
      return NextResponse.rewrite(rewriteUrl);
    } else {
      // Vendor Minisite Subdomain (e.g. taghaghien.siwify.com -> /taghaghien)
      if (pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`)) {
        return NextResponse.next();
      }
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = pathname === '/' ? `/${subdomain}` : `/${subdomain}${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public media / assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .css, .js)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};
