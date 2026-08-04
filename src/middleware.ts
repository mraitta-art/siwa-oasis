import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_for_development');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'siwa_session';

// Unified role-based route protection table
const ROUTE_GUARDS: Record<string, string[]> = {
  '/admin':      ['super_admin', 'content_admin', 'sales_manager'],
  '/api/admin':  ['super_admin', 'content_admin', 'sales_manager'],
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Safety: warn if running production with the fallback JWT secret
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('[SECURITY] JWT_SECRET env var is not set — using insecure fallback in production!');
  }

  // Find matching guard
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_GUARDS)) {
    if (pathname.startsWith(prefix)) {
      const session = await verifySession(request);
      if (!session || !allowedRoles.includes(session.role)) {
        // Redirect with appropriate error message for vendor routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized. Valid session required.' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', pathname.startsWith('/vendor') ? 'vendor_required' : 'admin_required');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin', '/admin/:path*',
    '/api/admin/:path*',
    '/jana', '/jana/:path*', 
    '/vendor', '/vendor/:path*', 
    '/salesman', '/salesman/:path*'
  ],
};
