import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/signup/check-email?email=xxx or ?phone=yyy
// Returns { taken: boolean } — used for real-time validation on signup form blur
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();
  const phone = searchParams.get('phone')?.trim();

  if (email) {
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ taken: false });
    }
    try {
      const rows = await query('SELECT id FROM profiles WHERE email = ? LIMIT 1', [email]) as any[];
      return NextResponse.json({ taken: rows.length > 0 });
    } catch {
      return NextResponse.json({ taken: false });
    }
  }

  if (phone) {
    try {
      const rows = await query('SELECT id FROM profiles WHERE phone = ? LIMIT 1', [phone]) as any[];
      return NextResponse.json({ taken: rows.length > 0 });
    } catch {
      return NextResponse.json({ taken: false });
    }
  }

  return NextResponse.json({ taken: false });
}
