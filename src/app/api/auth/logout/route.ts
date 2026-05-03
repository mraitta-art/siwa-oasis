import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL('/login', url.origin));
  response.cookies.delete(process.env.SESSION_COOKIE_NAME || 'siwa_session');
  return response;
}
