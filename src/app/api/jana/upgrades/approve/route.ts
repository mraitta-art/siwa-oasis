import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // 1. Fetch the request details
    const requests = (await query('SELECT * FROM upgrade_requests WHERE id = ?', [requestId])) as any[];
    if (requests.length === 0) {
      return NextResponse.json({ error: 'Upgrade request not found' }, { status: 404 });
    }
    const upgradeReq = requests[0];

    if (upgradeReq.status !== 'pending') {
      return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
    }

    // 2. Perform Atomic Upgrade
    // We update the business tier AND the profile tier
    // First, find the vendor ID for this business
    const businesses = (await query('SELECT vendor_id FROM businesses WHERE id = ?', [upgradeReq.business_id])) as any[];
    const vendorId = businesses[0]?.vendor_id;

    // Update Request Status
    await execute(
      'UPDATE upgrade_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', admin.id, requestId]
    );

    // Update Business Tier
    await execute(
      'UPDATE businesses SET subscription_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [upgradeReq.requested_tier, upgradeReq.business_id]
    );

    // Update Vendor Profile Tier
    if (vendorId) {
      await execute(
        'UPDATE profiles SET subscription_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [upgradeReq.requested_tier, vendorId]
      );
    }

    return NextResponse.json({ success: true, message: `Upgraded business to ${upgradeReq.requested_tier}` });

  } catch (error: any) {
    console.error('Approval Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve upgrade' }, { status: 500 });
  }
}
