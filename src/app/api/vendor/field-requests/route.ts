import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * VENDOR CUSTOM FIELD REQUESTS API
 * Allows vendors to suggest new fields/sections to admin or list their requests.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    // Retrieve all field requests by this vendor
    const requests = await query(
      'SELECT r.*, s.name as section_name ' +
      'FROM field_requests r ' +
      'LEFT JOIN sections s ON r.section_id = s.id ' +
      'WHERE r.business_id = ? ' +
      'ORDER BY r.created_at DESC',
      [user.businessId]
    );

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Fetch field requests error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    const { section_id, field_name, field_label, field_type, reason } = await req.json();

    if (!section_id || !field_name || !field_label || !field_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert new request
    await execute(
      'INSERT INTO field_requests (business_id, vendor_id, section_id, field_name, field_label, field_type, reason, status) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, "pending")',
      [
        user.businessId,
        user.id,
        section_id,
        field_name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'),
        field_label.trim(),
        field_type,
        reason || ''
      ]
    );

    return NextResponse.json({ success: true, message: 'Custom field suggestion submitted successfully.' });
  } catch (error) {
    console.error('Submit field request error:', error);
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}
