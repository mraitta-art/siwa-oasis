import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import crypto from 'crypto';

// POST: Request a password reset link
export async function POST(request: NextRequest) {
  // 🚧 MAINTENANCE MODE: Unactivated until testing is complete
  const isTesting = true; 
  if (isTesting) {
    return NextResponse.json({ 
      error: 'Security governance is currently undergoing final verification. Password reset services will resume shortly.' 
    }, { status: 503 });
  }

  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const user = await queryOne<any>('SELECT id FROM profiles WHERE email = ?', [email]);
    if (!user) {
      // Don't reveal if user exists for security, just say "If account exists..."
      return NextResponse.json({ success: true, message: 'If account exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await execute(
      'UPDATE profiles SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [token, expires, user.id]
    );

    // In a real app, send email here. For now, we return the token (simulated link)
    console.log(`[AUTH] Reset Link: http://localhost:3001/jana/reset-password?token=${token}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Reset link generated (check server logs in dev mode)',
      debugLink: `/jana/reset-password?token=${token}` // For easier testing
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
