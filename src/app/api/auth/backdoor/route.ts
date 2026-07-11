import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_for_development');

export async function GET(req: Request) {
  // Only allow on local dev
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const token = await new SignJWT({
      id: 'a1',
      email: 'super@siwa.com',
      role: 'super_admin',
      displayName: 'Super Admin',
      businessId: null,
      subscriptionTier: 'premium'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const res = NextResponse.redirect(new URL('/jana/businesses', req.url));
    res.cookies.set('siwa_session', token, {
      httpOnly: true,
      secure: false, // http is fine for localhost
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create backdoor session' }, { status: 500 });
  }
}
