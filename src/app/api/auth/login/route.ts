import { NextRequest, NextResponse } from 'next/server';
import { login, createToken } from '@/lib/auth';
import { execute as dbExec } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, password } = await request.json();
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    if (!email || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log(`[LOGIN] Attempting login for ${email}`);
    const user = await login(email, password);
    if (!user) {
      console.log(`[LOGIN] Auth failed for ${email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log(`[LOGIN] Auth success for ${email}, creating token`);
    const token = await createToken(user);

    // Log the login (Optional: don't crash if logs table missing)
    try {
      await dbExec(
        'INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), user.id, user.email, user.role, 'login', `${user.email} logged in`]
      );
      await dbExec(
        'INSERT INTO activity_log (message, user_email) VALUES (?, ?)',
        [`Login: ${user.email} (${user.role})`, user.email]
      );
    } catch (e) {
      console.warn('Logging skipped: table might be missing', e);
    }

    const response = NextResponse.json({ success: true, user });
    const cookieOptions: Parameters<typeof response.cookies.set>[2] = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };
    const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
    if (cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }
    response.cookies.set(process.env.SESSION_COOKIE_NAME || 'siwa_session', token, cookieOptions);

    return response;
  } catch (error: any) {
    console.error('Login error:', error.message, error.stack);
    return NextResponse.json({ error: `Login failed: ${error.message}` }, { status: 500 });
  }
}
