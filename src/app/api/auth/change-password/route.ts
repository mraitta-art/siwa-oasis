import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, comparePassword, hashPassword } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

/**
 * Self-service password change. Any signed-in account can rotate its own
 * password; the current one is required so a stolen cookie alone is not enough
 * to take the account.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 10) {
      return NextResponse.json({ error: 'Use at least 10 characters' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'The new password must be different' }, { status: 400 });
    }

    const row = await queryOne<any>('SELECT password_hash FROM profiles WHERE id = ?', [user.id]);
    if (!row?.password_hash) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const valid = await comparePassword(currentPassword, row.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    await execute(
      'UPDATE profiles SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [await hashPassword(newPassword), user.id]
    );

    // Record the fact, never the secret.
    try {
      await execute(
        'INSERT INTO activity_log (message, user_email) VALUES (?, ?)',
        [`Password changed: ${user.email}`, user.email]
      );
    } catch {
      // Logging is best effort; a missing table must not fail the change.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password change failed:', error?.message);
    return NextResponse.json({ error: error?.message || 'Could not change password' }, { status: 500 });
  }
}
