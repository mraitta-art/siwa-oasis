import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Join via businesses.vendor_id = profiles.id (the correct foreign key)
    const rows = await query<any>(
      `SELECT p.id as profile_id, p.display_name, p.email, p.phone, p.verification_status, p.trust_rejection_note,
              p.id_doc_front_url, p.id_doc_back_url, p.ownership_doc_url, p.terms_accepted_at, p.terms_accepted_ip,
              b.id as business_id, b.name as business_name, b.slug as business_slug
       FROM profiles p
       LEFT JOIN businesses b ON b.vendor_id = p.id
       WHERE p.id_doc_front_url IS NOT NULL
         AND p.role = 'vendor'
       ORDER BY 
         CASE p.verification_status
           WHEN 'pending' THEN 1
           WHEN 'rejected' THEN 2
           WHEN 'unverified' THEN 3
           WHEN 'verified' THEN 4
           ELSE 5
         END ASC, p.updated_at DESC`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('[ADMIN VERIFICATION GET ERROR]', error);
    return NextResponse.json({ error: error.message || 'Unauthorized access' }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, action, rejectionNote } = await request.json();

    if (!profileId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing profile ID or invalid action' }, { status: 400 });
    }

    // Find the business linked to this vendor profile
    const bizRows = (await query(`SELECT id FROM businesses WHERE vendor_id = ? LIMIT 1`, [profileId])) as any[];
    const businessId = bizRows.length > 0 ? bizRows[0].id : null;

    if (action === 'approve') {
      // 1. Mark profile verified
      await execute(
        `UPDATE profiles 
         SET verification_status = 'verified', trust_rejection_note = NULL, updated_at = NOW() 
         WHERE id = ?`,
        [profileId]
      );

      // 2. Mark all their businesses as trusted and permanently visible
      if (businessId) {
        await execute(
          `UPDATE businesses 
           SET is_trusted = 1, status = 'active', minisite_visible_until = NULL, trusted_at = NOW(), trusted_by = ? 
           WHERE vendor_id = ?`,
          [adminUser.id, profileId]
        );
      }
    } else {
      // Reject action
      if (!rejectionNote) {
        return NextResponse.json({ error: 'Rejection note is required when rejecting verification' }, { status: 400 });
      }

      // 1. Mark profile rejected with note
      await execute(
        `UPDATE profiles 
         SET verification_status = 'rejected', trust_rejection_note = ?, updated_at = NOW() 
         WHERE id = ?`,
        [rejectionNote, profileId]
      );

      // 2. Remove trusted status from all their businesses
      await execute(
        `UPDATE businesses 
         SET is_trusted = 0 
         WHERE vendor_id = ?`,
        [profileId]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`
    });
  } catch (error: any) {
    console.error('[ADMIN VERIFICATION PATCH ERROR]', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
