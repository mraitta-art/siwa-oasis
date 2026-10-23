export const dynamic = 'force-dynamic';

import { randomUUID } from 'crypto';
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
      if (invite.status === 'accepted') {
        return NextResponse.json({
          success: true,
          already_accepted: true,
          message: 'حسابك مفعل بالفعل وجاهز للاستخدام.',
          business_slug: invite.business_slug,
          redirect: `/vendor/app?slug=${invite.business_slug}&tier=${invite.subscription_tier}&onboarded=1`,
        });
      }
      return NextResponse.json(
        { error: 'This invite has already been used or expired', current_status: invite.status },
        { status: 409 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await execute(`UPDATE onboard_invites SET status = 'expired' WHERE token = ?`, [token]);
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    // Apply tier to business + mark it as published (visible on platform).
    // service_level = 'template' pins this vendor to Level 1 (self-serve) of the
    // 3-level vendor minisite system; the tier falls back to 'free' when the
    // invite carries no explicit tier.
    await execute(
      `UPDATE businesses
       SET subscription_tier = ?, service_level = 'template', published = 1
       WHERE id = ?`,
      [invite.subscription_tier || 'free', invite.business_id]
    );

    // 3-Level Vendor System (Level 1): auto-assign the default minisite template
    // for the business type and record the initial level assignment. Defensive so a
    // missing minisite_templates / vendor_level_transitions table never blocks a claim.
    try {
      const bizForLevel = await queryOne<any>(
        `SELECT id, type_id, service_level FROM businesses WHERE id = ?`,
        [invite.business_id]
      );
      if (bizForLevel) {
        let assignedTemplateId: string | null = null;
        if (bizForLevel.type_id) {
          const defaultTemplate = await queryOne<any>(
            `SELECT id FROM minisite_templates
             WHERE category_id = ?
             ORDER BY created_at ASC LIMIT 1`,
            [bizForLevel.type_id]
          );
          assignedTemplateId = defaultTemplate?.id ?? null;
          if (assignedTemplateId) {
            await execute(
              `UPDATE businesses SET template_id = ? WHERE id = ? AND (template_id IS NULL OR template_id = '')`,
              [assignedTemplateId, invite.business_id]
            );
          }
        }

        // Audit trail: from_level NULL marks the very first assignment. Only insert
        // once per business so re-claimed/expired-token flows stay idempotent.
        const existingTransition = await queryOne<any>(
          `SELECT id FROM vendor_level_transitions WHERE business_id = ? LIMIT 1`,
          [invite.business_id]
        );
        if (!existingTransition) {
          await execute(
            `INSERT INTO vendor_level_transitions
               (id, business_id, from_level, to_level, triggered_by, trigger_type, reason, metadata)
             VALUES (?, ?, NULL, 'template', NULL, 'manual', ?, ?)`,
            [
              randomUUID(),
              invite.business_id,
              'Initial template level assignment on profile claim',
              JSON.stringify({
                source: 'onboard_claim',
                token,
                assigned_template_id: assignedTemplateId,
              }),
            ]
          );
        }
      }
    } catch (levelErr: any) {
      console.warn('[onboard] vendor level assignment warning:', levelErr?.message || levelErr);
    }

    // Mark invite as accepted
    await execute(
      `UPDATE onboard_invites SET status = 'accepted', accepted_at = NOW() WHERE token = ?`,
      [token]
    );

    // Update CRM outreach status to 'claimed' automatically
    try {
      const bizRow = await queryOne(`SELECT custom_data FROM businesses WHERE id = ?`, [invite.business_id]) as any;
      if (bizRow) {
        let cd: any = {};
        try { cd = typeof bizRow.custom_data === 'string' ? JSON.parse(bizRow.custom_data) : (bizRow.custom_data || {}); } catch {}
        cd.outreach_status = 'claimed';
        cd.onboarded_at = new Date().toISOString();
        cd.onboard_token = token;
        await execute(`UPDATE businesses SET custom_data = ? WHERE id = ?`, [JSON.stringify(cd), invite.business_id]);
      }
    } catch (crmErr) {
      console.warn('[onboard] CRM update warning:', crmErr);
    }

    return NextResponse.json({
      success:        true,
      message:        'تم قبول اللوائح والأنظمة. حسابك جاهز الآن!',
      business_slug:  invite.business_slug,
      redirect:       `/vendor/app?slug=${invite.business_slug}&tier=${invite.subscription_tier}&onboarded=1`,
    });
  } catch (e: any) {
    console.error('[onboard/token POST] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
