import { NextRequest, NextResponse } from 'next/server';
import { createToken, type SessionUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Backdoor access is disabled in production.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const email = (url.searchParams.get('email') || 'super@siwa.com').trim().toLowerCase();
    const redirectTo = url.searchParams.get('redirect') || '/jana';

    const user = await queryOne<any>(
      'SELECT id, email, role, display_name, business_id, subscription_tier, active FROM profiles WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Backdoor login user not found or inactive.' }, { status: 404 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      businessId: user.business_id,
      subscriptionTier: user.subscription_tier,
    };

    const token = await createToken(sessionUser);
    const response = NextResponse.redirect(new URL(redirectTo.startsWith('/') ? redirectTo : '/jana', url.origin));
    response.cookies.set(process.env.SESSION_COOKIE_NAME || 'siwa_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Backdoor login failed:', error);
    return NextResponse.json({ error: error.message || 'Backdoor login failed' }, { status: 500 });
  }
}
