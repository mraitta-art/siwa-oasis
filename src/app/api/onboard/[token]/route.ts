export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

type RouteParams = { params: { token: string } };

/**
 * GET /api/onboard/[token]
 * Public — fetches invite details so the onboarding page can render.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invite = await queryOne(
      `SELECT oi.*, b.is_claimed, b.whatsapp, b.phone
       FROM onboard_invites oi
       LEFT JOIN businesses b ON b.id = oi.business_id
       WHERE oi.token = ?`,
      [token]
    ) as any;

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
    }

    // Mark expired if past expires_at
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      if (invite.status === 'pending') {
        await execute(`UPDATE onboard_invites SET status = 'expired' WHERE token = ?`, [token]);
      }
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    if (invite.status === 'expired') {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      token:                  invite.token,
      business_id:            invite.business_id,
      business_name:          invite.business_name,
      business_slug:          invite.business_slug,
      parent_type_id:         invite.parent_type_id,
      parent_type_name:       invite.parent_type_name,
      child_type_id:          invite.child_type_id,
      child_type_name:        invite.child_type_name,
      child_type_regulations: invite.child_type_regulations,
      subscription_tier:      invite.subscription_tier,
      dispatch_mode:          invite.dispatch_mode,
      status:                 invite.status,
      is_claimed:             !!invite.is_claimed,
      expires_at:             invite.expires_at,
    });
  } catch (e: any) {
    console.error('[onboard/token GET] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/onboard/[token]
 * Public — vendor accepts the regulations, activates their business profile.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invite = await queryOne(
      `SELECT * FROM onboard_invites WHERE token = ?`,
      [token]
    ) as any;

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invite has already been used or expired', current_status: invite.status },
        { status: 409 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await execute(`UPDATE onboard_invites SET status = 'expired' WHERE token = ?`, [token]);
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    // Apply tier to business
    await execute(
      `UPDATE businesses SET subscription_tier = ? WHERE id = ?`,
      [invite.subscription_tier, invite.business_id]
    );

    // Mark invite as accepted
    await execute(
      `UPDATE onboard_invites SET status = 'accepted', accepted_at = NOW() WHERE token = ?`,
      [token]
    );

    return NextResponse.json({
      success:        true,
      message:        'تم قبول اللوائح والأنظمة. حسابك جاهز الآن!',
      business_slug:  invite.business_slug,
      redirect:       `/vendor/claim?slug=${invite.business_slug}&tier=${invite.subscription_tier}&onboarded=1`,
    });
  } catch (e: any) {
    console.error('[onboard/token POST] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
