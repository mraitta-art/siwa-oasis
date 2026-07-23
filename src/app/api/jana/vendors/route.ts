import { NextResponse } from 'next/server';
import { query as safeQuery } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const vendors = await safeQuery(
      'SELECT id, email, display_name FROM profiles WHERE role = "vendor" AND active = TRUE ORDER BY display_name'
    );
    return NextResponse.json(vendors);
  } catch (e: any) {
    const msg = e?.message || 'Unknown error';
    if (msg.includes('Not authenticated')) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes('Admin access required')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
