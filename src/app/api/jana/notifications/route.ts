import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET: Load notifications for a specific business
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const results = await query(
      `SELECT * FROM notifications WHERE (business_id = ? OR is_global = 1) ORDER BY created_at DESC LIMIT 20`,
      [businessId]
    );
    
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Admin sends a message to vendors
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { businessId, title, message, type = 'info', isGlobal = false } = await request.json();

    await execute(
      `INSERT INTO notifications (id, business_id, title, message, type, is_global, created_at) 
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [isGlobal ? null : businessId, title, message, type, isGlobal ? 1 : 0]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
