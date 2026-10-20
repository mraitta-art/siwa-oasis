export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/jana/invites
 * Returns all onboard_invites with business + acceptance tracking for CRM view.
 * Admin only.
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();

    // Ensure table exists before querying
    await execute(`
      CREATE TABLE IF NOT EXISTS onboard_invites (
        token VARCHAR(64) PRIMARY KEY,
        business_id VARCHAR(100) NOT NULL,
        business_name VARCHAR(255),
        business_slug VARCHAR(100),
        parent_type_id VARCHAR(100),
        parent_type_name VARCHAR(255),
        child_type_id VARCHAR(100),
        child_type_name VARCHAR(255),
        child_type_regulations TEXT,
        subscription_tier VARCHAR(30) DEFAULT 'free',
        dispatch_mode VARCHAR(20) DEFAULT 'direct',
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        admin_notes TEXT
      )
    `);

    const invites = await query<any>(`
      SELECT
        oi.token,
        oi.business_id,
        oi.business_name,
        oi.business_slug,
        oi.parent_type_name,
        oi.child_type_name,
        oi.subscription_tier,
        oi.dispatch_mode,
        oi.status,
        oi.created_at,
        oi.accepted_at,
        oi.expires_at,
        oi.admin_notes,
        b.is_claimed,
        b.published,
        b.custom_data,
        wc.value AS minisite_config
      FROM onboard_invites oi
      LEFT JOIN businesses b ON b.id = oi.business_id
      LEFT JOIN website_configs wc
        ON wc.key = CONCAT('minisite_layout_', oi.business_slug)
        AND wc.type = 'minisite_layout'
      ORDER BY oi.created_at DESC
    `);

    const enriched = invites.map((inv: any) => {
      let customData: any = {};
      try {
        customData = typeof inv.custom_data === 'string' ? JSON.parse(inv.custom_data) : (inv.custom_data || {});
      } catch {}

      const whatsapp = customData?.basic?.whatsapp || customData?.whatsapp || customData?.sec_1_identity?.whatsapp || '';
      const phone = customData?.basic?.phone || customData?.phone || '';
      const hasMinisite = !!inv.minisite_config;

      // Auto-expire if past expires_at
      const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date() && inv.status === 'pending';

      return {
        token: inv.token,
        business_id: inv.business_id,
        business_name: inv.business_name,
        business_slug: inv.business_slug,
        parent_type_name: inv.parent_type_name,
        child_type_name: inv.child_type_name,
        subscription_tier: inv.subscription_tier,
        dispatch_mode: inv.dispatch_mode,
        status: isExpired ? 'expired' : inv.status,
        created_at: inv.created_at,
        accepted_at: inv.accepted_at,
        expires_at: inv.expires_at,
        admin_notes: inv.admin_notes,
        is_claimed: !!inv.is_claimed,
        published: !!inv.published,
        has_minisite: hasMinisite,
        whatsapp,
        phone,
        onboard_url: `https://siwify.com/onboard/${inv.token}`,
        vendor_url: `https://siwify.com/vendor/app?slug=${inv.business_slug}`,
        minisite_url: `https://siwify.com/${inv.business_slug}`,
      };
    });

    // Summary stats
    const total = enriched.length;
    const pending = enriched.filter((i: any) => i.status === 'pending').length;
    const accepted = enriched.filter((i: any) => i.status === 'accepted').length;
    const expired = enriched.filter((i: any) => i.status === 'expired').length;
    const claimed = enriched.filter((i: any) => i.is_claimed).length;
    const withMinisite = enriched.filter((i: any) => i.has_minisite).length;
    const direct = enriched.filter((i: any) => i.dispatch_mode === 'direct').length;
    const gatekeeper = enriched.filter((i: any) => i.dispatch_mode === 'gatekeeper').length;

    return NextResponse.json({
      stats: { total, pending, accepted, expired, claimed, withMinisite, direct, gatekeeper },
      invites: enriched,
    });
  } catch (e: any) {
    console.error('[jana/invites GET] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/jana/invites
 * Admin can update notes or resend/expire a specific invite.
 * Body: { token, admin_notes?, action? }
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { token, admin_notes, action } = body;

    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    const invite = await queryOne('SELECT * FROM onboard_invites WHERE token = ?', [token]) as any;
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

    if (action === 'expire') {
      await execute("UPDATE onboard_invites SET status = 'expired' WHERE token = ?", [token]);
      return NextResponse.json({ success: true, status: 'expired' });
    }

    if (action === 'reset') {
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      await execute(
        "UPDATE onboard_invites SET status = 'pending', accepted_at = NULL, expires_at = ? WHERE token = ?",
        [newExpiry, token]
      );
      return NextResponse.json({ success: true, status: 'pending', expires_at: newExpiry });
    }

    if (admin_notes !== undefined) {
      await execute('UPDATE onboard_invites SET admin_notes = ? WHERE token = ?', [admin_notes, token]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No valid action' }, { status: 400 });
  } catch (e: any) {
    console.error('[jana/invites PATCH] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
