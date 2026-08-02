import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * ADMIN FIELD REQUESTS MANAGEMENT API
 * Allows super_admin or content_admin to review and resolve custom field suggestions.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // Allow super_admin or content_admin
    if (!user || !['super_admin', 'content_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await query(
      'SELECT r.*, b.name as business_name, b.type_id as business_type_id, s.name as section_name, p.display_name as vendor_name ' +
      'FROM field_requests r ' +
      'JOIN businesses b ON r.business_id = b.id ' +
      'LEFT JOIN sections s ON r.section_id = s.id ' +
      'LEFT JOIN profiles p ON r.vendor_id = p.id ' +
      'ORDER BY r.created_at DESC'
    );

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Fetch all field requests error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'content_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    // 1. Fetch the request details
    const requestRes = await query(
      'SELECT r.*, b.type_id as business_type_id ' +
      'FROM field_requests r ' +
      'JOIN businesses b ON r.business_id = b.id ' +
      'WHERE r.id = ?',
      [id]
    );

    if (requestRes.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    const r = requestRes[0];

    // 2. Update status in field_requests table
    await execute(
      'UPDATE field_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    // 3. If approved, automatically create the new field in form_fields for that business type!
    if (status === 'approved') {
      try {
        // Insert field definition into form_fields
        await execute(
          'INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, section_origin, required, sort_order) ' +
          'VALUES (UUID(), ?, ?, ?, ?, ?, "own", 0, 99) ' +
          'ON DUPLICATE KEY UPDATE label = ?',
          [r.business_type_id, r.section_id, r.field_name, r.field_label, r.field_type, r.field_label]
        );
      } catch (err) {
        console.error('Failed to auto-provision form field:', err);
      }
    }

    return NextResponse.json({ success: true, message: `Request has been marked as ${status}.` });
  } catch (error) {
    console.error('Respond to field request error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
