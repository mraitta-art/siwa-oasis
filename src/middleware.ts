import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_secret');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'siwa_session';

// Unified role-based route protection table
const ROUTE_GUARDS: Record<string, string[]> = {
  '/jana':     ['super_admin', 'content_admin', 'sales_manager', 'support_agent'],
  '/vendor':   ['super_admin', 'content_admin', 'vendor'],
  '/salesman': ['super_admin', 'sales_manager', 'salesman'],
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

  // Find matching guard
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_GUARDS)) {
    if (pathname.startsWith(prefix)) {
      const session = await verifySession(request);
      if (!session || !allowedRoles.includes(session.role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/jana/:path*', '/vendor/:path*', '/salesman/:path*'],
};
