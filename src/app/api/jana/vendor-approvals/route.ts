import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * ADMIN VENDOR APPROVALS API
 *
 * GET  ?setting=mode           → returns current vendor_registration_mode
 * GET  ?status=pending|approved|rejected  → returns vendors by approval_status
 * PATCH { mode }               → update registration mode (open | approval_required)
 * PATCH { userId, action, reason? } → approve / reject / revoke a vendor
 */

async function getRegistrationMode(): Promise<string> {
  const row = (await queryOne(
    `SELECT config FROM website_configs WHERE type = 'admin_settings' LIMIT 1`
  )) as any;
  if (!row) return 'approval_required';
  const cfg = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
  return cfg?.vendor_registration_mode || 'approval_required';
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const setting = searchParams.get('setting');
    const status  = searchParams.get('status');

    // Return current registration mode
    if (setting === 'mode') {
      const mode = await getRegistrationMode();
      return NextResponse.json({ mode });
    }

    const approvalStatus = status || 'pending';
    const vendors = await query(
      `SELECT p.id, p.id as userId, p.display_name, p.email, p.phone, p.approval_status, p.rejection_reason,
              p.active, p.created_at,
              b.name as business_name, b.slug as business_slug,
              bt.name as category_name, bt.name as category, bt.icon as category_icon
       FROM profiles p
       LEFT JOIN businesses b  ON p.business_id = b.id
       LEFT JOIN business_types bt ON b.type_id = bt.id
       WHERE p.role = 'vendor' AND p.approval_status = ?
       ORDER BY p.created_at DESC`,
      [approvalStatus]
    );

    return NextResponse.json(vendors);
  } catch (error: any) {
    console.error('Vendor approvals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor approvals' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    // Update registration mode
    if (body.mode !== undefined) {
      const mode = body.mode === 'approval_required' ? 'approval_required' : 'open';
      const existing = (await queryOne(
        `SELECT id FROM website_configs WHERE type = 'admin_settings' LIMIT 1`
      )) as any;

      if (existing) {
        await execute(
          `UPDATE website_configs
           SET config = JSON_MERGE_PATCH(config, ?)
           WHERE type = 'admin_settings'`,
          [JSON.stringify({ vendor_registration_mode: mode })]
        );
      } else {
        await execute(
          `INSERT INTO website_configs (type, config) VALUES ('admin_settings', ?)`,
          [JSON.stringify({ vendor_registration_mode: mode })]
        );
      }
      return NextResponse.json({ success: true, mode });
    }

    // Approve / reject / revoke a vendor
    const { userId, action, reason } = body;
    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    // Get the vendor's business ID first
    const profile = (await queryOne(
      'SELECT business_id FROM profiles WHERE id = ?',
      [userId]
    )) as any;
    const businessId = profile?.business_id;

    if (action === 'approve') {
      // 1. Approve vendor profile
      await execute(
        `UPDATE profiles SET approval_status = 'approved', active = 1, rejection_reason = NULL WHERE id = ?`,
        [userId]
      );

      // 2. Reactivate business listing and assign ownership if anonymous
      if (businessId) {
        const business = (await queryOne(
          'SELECT vendor_id, status FROM businesses WHERE id = ?',
          [businessId]
        )) as any;

        if (business) {
          const isUnowned = !business.vendor_id || business.vendor_id === '' || business.vendor_id === 'anonymous';
          await execute(
            `UPDATE businesses 
             SET status = 'active', 
                 vendor_id = ?,
                 is_claimed = 1,
                 approved_by_vendor = 1
             WHERE id = ?`,
            [isUnowned ? userId : business.vendor_id, businessId]
          );
        }
      }

      return NextResponse.json({ success: true, message: 'Vendor approved and business activated.' });
    }

    if (action === 'reject' || action === 'revoke') {
      const statusText = action === 'reject' ? 'rejected' : 'revoked';
      
      // 1. Suspend/Reject vendor profile
      await execute(
        `UPDATE profiles SET approval_status = 'rejected', active = 0, rejection_reason = ? WHERE id = ?`,
        [reason || `Access ${statusText} by admin`, userId]
      );

      // 2. Check if there are other active approved vendors for this business
      if (businessId) {
        const [activeCountRow] = (await query(
          `SELECT COUNT(*) as active_count FROM profiles 
           WHERE business_id = ? AND active = 1 AND approval_status = 'approved' AND id != ?`,
          [businessId, userId]
        )) as any[];

        const activeCount = activeCountRow?.active_count || 0;

        if (activeCount === 0) {
          // No other active approved vendors remain. Mark business as inactive so it is hidden.
          const business = (await queryOne(
            'SELECT vendor_id FROM businesses WHERE id = ?',
            [businessId]
          )) as any;

          if (business) {
            const isOwner = business.vendor_id === userId;
            await execute(
              `UPDATE businesses 
               SET status = 'inactive', 
                   vendor_id = ?,
                   is_claimed = ?,
                   approved_by_vendor = ?
               WHERE id = ?`,
              [isOwner ? 'anonymous' : business.vendor_id, isOwner ? 0 : 1, isOwner ? 0 : 1, businessId]
            );
          }
        }
      }

      return NextResponse.json({ success: true, message: `Vendor ${statusText} and business access updated.` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Vendor approvals PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update vendor approval' }, { status: 500 });
  }
}
