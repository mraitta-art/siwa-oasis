import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const businessId = new URL(request.url).searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    const rows = await query(
      `SELECT slot_number, phone, contact_name, verified, called_at, verified_by, notes
       FROM investment_contact_verifications WHERE business_id = ? ORDER BY slot_number`,
      [businessId]
    );
    return NextResponse.json({ success: true, items: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load verification records' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { businessId, slotNumber, verified, contactName, notes } = body;
    if (!businessId || ![1, 2, 3].includes(Number(slotNumber))) {
      return NextResponse.json({ error: 'Business ID and verification slot 1, 2, or 3 are required' }, { status: 400 });
    }
    const rows = await query(
      'SELECT id FROM investment_contact_verifications WHERE business_id = ? AND slot_number = ?',
      [businessId, Number(slotNumber)]
    ) as any[];
    if (!rows.length) return NextResponse.json({ error: 'Verification slot not found' }, { status: 404 });

    await execute(
      `UPDATE investment_contact_verifications
       SET verified = ?, contact_name = ?, called_at = ?, verified_by = ?, notes = ?
       WHERE business_id = ? AND slot_number = ?`,
      [verified ? 1 : 0, String(contactName || '').trim() || null, verified ? new Date() : null, verified ? admin.id : null, String(notes || '').trim() || null, businessId, Number(slotNumber)]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to save verification record' }, { status: 500 });
  }
}
