import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { target_business_type_id, target_vendor_id, distribution_status, reveal_contact } = body;

    // We only allow setting distribution_status to 'dispatched' or back to 'admin_review'
    const finalStatus = distribution_status || 'dispatched';

    await query(
      `UPDATE journey_requests 
       SET distribution_status = ?, target_business_type_id = ?, target_vendor_id = ?, reveal_contact = ?
       WHERE id = ?`,
      [finalStatus, target_business_type_id || null, target_vendor_id || null, reveal_contact ? 1 : 0, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PATCH /api/journeys/[id]/dispatch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
