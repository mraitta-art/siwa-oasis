import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const vendors = await query(
      'SELECT id, email, display_name FROM profiles WHERE role = "vendor" AND active = TRUE ORDER BY display_name'
    );
    return NextResponse.json(vendors);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
