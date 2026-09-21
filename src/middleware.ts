import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_for_development');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'siwa_session';
const PLATFORM_ROOT_DOMAINS = new Set(['siwify.com', 'www.siwify.com', 'localhost', '127.0.0.1']);

/* ─── SEO-Optimized Subdomain Routing Table ────────────────────────── */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  // ── Main Oasis Portals
  'siwaoasis': '/',
  'siwa-oasis': '/',
  'siwa': '/',
  'siwatoday': '/',
  'siwa-today': '/',
  'oasis': '/',
  'home': '/',
  'main': '/',

  // ── Accommodations & Stays (SEO: siwastay, siwastayat, siwahotels, siwacamps)
  'siwastay': '/accommodations',
  'siwa-stay': '/accommodations',
  'siwastayat': '/accommodations',
  'siwa-stay-at': '/accommodations',
  'siwastaywith': '/accommodations',
  'siwa-stay-with': '/accommodations',
  'staywith': '/accommodations',
  'stay': '/accommodations',
  'siwahotels': '/accommodations',
  'siwa-hotels': '/accommodations',
  'siwacamps': '/accommodations',
  'siwa-camps': '/accommodations',
  'siwalodges': '/accommodations',
  'siwa-lodges': '/accommodations',
  'siwaresorts': '/accommodations',
  'siwa-resorts': '/accommodations',
  'siwaaccommodations': '/accommodations',
  'siwa-accommodations': '/accommodations',
  'accommodations': '/accommodations',
  'hotels': '/accommodations',
  'camps': '/accommodations',
  'lodges': '/accommodations',

  // ── Transportation & Mobility (SEO: siwamove, siwatransport, siwatransfers, siwa4x4)
  'siwamove': '/transportation',
  'siwa-move': '/transportation',
  'siwamovewith': '/transportation',
  'siwa-move-with': '/transportation',
  'movewith': '/transportation',
  'move': '/transportation',
  'siwatransport': '/transportation',
  'siwa-transport': '/transportation',
  'siwatransportation': '/transportation',
  'siwa-transportation': '/transportation',
  'siwatransfers': '/transportation',
  'siwa-transfers': '/transportation',
  'siwa4x4': '/transportation',
  'siwa-4x4': '/transportation',
  'transportation': '/transportation',
  'transport': '/transportation',
  'transfers': '/transportation',

  // ── Activities & Desert Tours (SEO: siwatours, siwasafari, siwaactivities)
  'siwatours': '/activities',
  'siwa-tours': '/activities',
  'siwasafari': '/activities',
  'siwa-safari': '/activities',
  'siwaactivities': '/activities',
  'siwa-activities': '/activities',
  'siwaexperiences': '/activities',
  'siwa-experiences': '/activities',
  'siwaadventure': '/activities',
  'siwa-adventure': '/activities',
  'tours': '/activities',
  'activities': '/activities',
  'experiences': '/activities',
  'safari': '/activities',

  // ── Food, Restaurants & Dining (SEO: siwaeat, siwafood, siwadining, siwarestaurants)
  'siwaeat': '/food-beverage',
  'siwa-eat': '/food-beverage',
  'siwaeatwith': '/food-beverage',
  'siwa-eat-with': '/food-beverage',
  'eatwith': '/food-beverage',
  'eat': '/food-beverage',
  'siwafood': '/food-beverage',
  'siwa-food': '/food-beverage',
  'siwadining': '/food-beverage',
  'siwa-dining': '/food-beverage',
  'siwarestaurants': '/food-beverage',
  'siwa-restaurants': '/food-beverage',
  'siwacafes': '/food-beverage',
  'food': '/food-beverage',
  'restaurants': '/food-beverage',
  'dining': '/food-beverage',

  // ── Crafts, Healing & Wellness (SEO: siwacrafts, siwawellness, siwasalt, siwaspa)
  'siwacrafts': '/crafts-wellness',
  'siwa-crafts': '/crafts-wellness',
  'siwawellness': '/crafts-wellness',
  'siwa-wellness': '/crafts-wellness',
  'siwasalt': '/crafts-wellness',
  'siwa-salt': '/crafts-wellness',
  'siwahealing': '/crafts-wellness',
  'siwa-healing': '/crafts-wellness',
  'siwaspa': '/crafts-wellness',
  'siwa-spa': '/crafts-wellness',
  'crafts': '/crafts-wellness',
  'wellness': '/crafts-wellness',
  'healing': '/crafts-wellness',
  'spa': '/crafts-wellness',

  // ── Production & Trade (SEO: siwatrade, siwadates, siwaolives, siwaproduction)
  'siwatrade': '/production-trade',
  'siwa-trade': '/production-trade',
  'siwaproduction': '/production-trade',
  'siwa-production': '/production-trade',
  'siwadates': '/production-trade',
  'siwa-dates': '/production-trade',
  'siwaolives': '/production-trade',
  'siwa-olives': '/production-trade',
  'siwaexport': '/production-trade',
  'trade': '/production-trade',
  'production': '/production-trade',
  'dates': '/production-trade',
  'olives': '/production-trade',

  // ── Services & Exploration
  'siwaservices': '/services',
  'siwa-services': '/services',
  'siwaexplore': '/services',
  'siwa-explore': '/services',
  'services': '/services',
  'explore': '/services',

  // ── Stories & Magazine (SEO: siwastories, siwablog, siwamagazine)
  'siwastories': '/blog',
  'siwa-stories': '/blog',
  'siwablog': '/blog',
  'siwa-blog': '/blog',
  'siwamagazine': '/blog',
  'siwa-magazine': '/blog',
  'siwanews': '/blog',
  'stories': '/blog',
  'story': '/blog',
  'blog': '/blog',
  'magazine': '/blog',
  'news': '/blog',

  // ── Commercial, Deals & Growth
  'siwadeals': '/offers',
  'siwa-deals': '/offers',
  'siwaoffers': '/offers',
  'siwa-offers': '/offers',
  'siwapackages': '/packages',
  'siwa-packages': '/packages',
  'siwadiscounts': '/discounts',
  'siwa-discounts': '/discounts',
  'siwaauctions': '/auctions',
  'siwa-auctions': '/auctions',
  'siwainvest': '/investment-opportunities',
  'siwa-invest': '/investment-opportunities',
  'siwainvestment': '/investment-opportunities',
  'siwa-investment': '/investment-opportunities',
  'offers': '/offers',
  'deals': '/offers',
  'packages': '/packages',
  'discounts': '/discounts',
  'auctions': '/auctions',
  'invest': '/investment-opportunities',
  'investment': '/investment-opportunities',

  // ── Journeys & Itineraries (SEO: siwajourneys, siwaplanner)
  'siwajourneys': '/journeys',
  'siwa-journeys': '/journeys',
  'siwajourney': '/journeys',
  'siwa-journey': '/journeys',
  'siwaplanner': '/journeys',
  'siwa-planner': '/journeys',
  'journeys': '/journeys',
  'journey': '/journeys',
  'planner': '/journeys',

  // ── Partners & Onboarding (SEO: siwapartner, siwapartners, siwajoin)
  'siwapartner': '/be-a-partner',
  'siwa-partner': '/be-a-partner',
  'siwapartners': '/be-a-partner',
  'siwa-partners': '/be-a-partner',
  'siwajoin': '/be-a-partner',
  'siwa-join': '/be-a-partner',
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

  // Support query param override for local testing (e.g. localhost:3000/?subdomain=siwastay)
  const queryOverride = request.nextUrl.searchParams.get('subdomain') || request.nextUrl.searchParams.get('preview_subdomain');
  if (queryOverride) {
    return { subdomain: queryOverride.toLowerCase(), isCustomDomain: false, hostname };
  }

  // Check for standard localhost or IP
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { subdomain: null, isCustomDomain: false, hostname };
  }

  // Check for *.localhost subdomains (e.g. siwastay.localhost:3000)
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    return { subdomain: sub !== 'www' ? sub : null, isCustomDomain: false, hostname };
  }

  // Check for *.siwify.com subdomains (e.g. siwastay.siwify.com)
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

  // ── Main-Site Only Routes Guard (Journey Builder is exclusively a main platform experience)
  const isMainSiteOnlyRoute = pathname.startsWith('/journey-builder') || pathname.startsWith('/journey-builder-advanced');
  if (isMainSiteOnlyRoute && (subdomain || isCustomDomain)) {
    const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const mainHost = isLocal ? (request.headers.get('host')?.includes(':') ? `localhost:${request.headers.get('host')?.split(':')[1]}` : 'localhost:3000') : 'siwify.com';
    const proto = isLocal ? 'http' : 'https';
    const redirectUrl = new URL(`${proto}://${mainHost}${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

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
      // Loop protection: if already at target route, pass through directly
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
