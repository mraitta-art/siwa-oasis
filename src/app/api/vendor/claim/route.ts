export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser, requireVendor, hashPassword, createToken, setSessionCookie } from '@/lib/auth';

/**
 * GET /api/vendor/claim
 * - If ?slug=... is provided: PUBLIC. Returns business info for claiming.
 * - Otherwise: requires vendor session. Returns list of all unclaimed businesses.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // ── Public Single Business Lookup for WhatsApp claim links ──
    if (slug) {
      const biz = await queryOne(
        `SELECT b.id, b.name, b.slug, b.type_id, b.subscription_tier, b.is_claimed, b.vendor_id,
                b.custom_data,
                bt.name       AS type_name,
                bt.icon       AS type_icon,
                bt.icon_color AS type_color,
                pt.name       AS parent_type_name
         FROM businesses b
         LEFT JOIN business_types bt ON b.type_id = bt.id
         LEFT JOIN business_types pt ON bt.parent_id = pt.id
         WHERE b.slug = ?
         LIMIT 1`,
        [slug]
      ) as any;

      if (!biz) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      let phone = '';
      try {
        const cd = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : (biz.custom_data || {});
        phone = cd.phone || cd.contact_phone || cd.whatsapp || '';
      } catch {}

      return NextResponse.json({
        business: {
          id: biz.id,
          name: biz.name,
          slug: biz.slug,
          type_id: biz.type_id,
          type_name: biz.type_name || 'خدمة معتمدة',
          type_icon: biz.type_icon || 'fa-store',
          type_color: biz.type_color || '#D4AF37',
          parent_type_name: biz.parent_type_name || 'سياحة وضيافة سيوة',
          subscription_tier: biz.subscription_tier || 'free',
          is_claimed: !!biz.is_claimed && biz.vendor_id !== 'anonymous',
          phone,
        }
      });
    }

    // ── Authenticated Directory of Unclaimed Businesses ──
    const user = await requireVendor();

    const profile = await queryOne(
      `SELECT p.*, b.type_id as business_type_id, bt.parent_id as business_parent_id
       FROM profiles p
       LEFT JOIN businesses b ON b.vendor_id = p.id AND b.is_claimed = 1
       LEFT JOIN business_types bt ON b.type_id = bt.id
       WHERE p.id = ?
       LIMIT 1`,
      [user.id]
    ) as any;

    const vendorTypeId = profile?.business_type_id || null;
    const vendorParentId = profile?.business_parent_id || null;

    const unclaimed = await query(`
      SELECT
        b.id, b.name, b.slug, b.type_id, b.subscription_tier,
        b.created_at,
        bt.name      AS type_name,
        bt.icon      AS type_icon,
        bt.icon_color AS type_color,
        bt.parent_id AS type_parent_id,
        pt.name      AS parent_type_name,
        mt.id        AS template_id,
        mt.name      AS template_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      LEFT JOIN business_types pt ON bt.parent_id = pt.id
      LEFT JOIN minisite_templates mt ON b.template_id = mt.id OR b.resolved_template_id = mt.id
      WHERE (b.is_claimed = 0 OR b.vendor_id IS NULL OR b.vendor_id = 'anonymous')
        AND b.status = 'active'
      ORDER BY b.name ASC
    `) as any[];

    const myType: any[] = [];
    const others: any[] = [];

    for (const b of unclaimed) {
      const isMatch = vendorTypeId
        ? b.type_id === vendorTypeId || b.type_parent_id === vendorParentId
        : false;
      (isMatch ? myType : others).push({ ...b, isMatchingType: isMatch });
    }

    return NextResponse.json({
      vendorTypeId,
      vendorTypeName: myType[0]?.type_name || null,
      myType,
      others,
      total: unclaimed.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message?.includes('authenticated') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/vendor/claim
 * Claims a business listing.
 * - Supports existing authenticated vendor session.
 * - Supports new vendor claiming via WhatsApp invitation link with { slug, phone, password, owner_name }.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, slug, phone, password, owner_name } = body;

    let user = await getCurrentUser();

    // Find target business
    let biz: any = null;
    if (businessId) {
      biz = await queryOne('SELECT * FROM businesses WHERE id = ?', [businessId]);
    } else if (slug) {
      biz = await queryOne('SELECT * FROM businesses WHERE slug = ?', [slug]);
    }

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if already claimed by someone else
    if (biz.is_claimed && biz.vendor_id && biz.vendor_id !== 'anonymous' && user?.id !== biz.vendor_id) {
      return NextResponse.json({
        error: `"${biz.name}" has already been claimed.`,
        code: 'ALREADY_CLAIMED'
      }, { status: 409 });
    }

    // If user is not yet logged in, create / link their vendor account now
    if (!user) {
      if (!phone || !password) {
        return NextResponse.json({
          error: 'يرجى إدخال رقم الهاتف وكلمة المرور لتأكيد ملكية الحساب وحمايته'
        }, { status: 400 });
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const vendorEmail = `${cleanPhone}@vendor.siwify.com`;
      const passwordHash = await hashPassword(password);
      const displayName = owner_name || biz.name;

      let profile = await queryOne<any>(
        'SELECT id, email, role FROM profiles WHERE LOWER(email) = ?',
        [vendorEmail.toLowerCase()]
      );

      if (!profile) {
        const newUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        await execute(
          `INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active, approval_status, created_at)
           VALUES (?, ?, ?, 'vendor', ?, ?, ?, 1, 'approved', NOW())`,
          [newUserId, vendorEmail, passwordHash, displayName, biz.id, biz.subscription_tier || 'free']
        );
        profile = { id: newUserId, email: vendorEmail, role: 'vendor' };
      } else {
        await execute(
          `UPDATE profiles SET password_hash = ?, business_id = ?, active = 1, approval_status = 'approved' WHERE id = ?`,
          [passwordHash, biz.id, profile.id]
        );
      }

      user = {
        id: profile.id,
        email: profile.email,
        role: 'vendor',
        displayName: displayName,
        businessId: biz.id,
        subscriptionTier: biz.subscription_tier || 'free',
      };

      // Set authentication cookie so they are logged in immediately
      const token = await createToken(user);
      await setSessionCookie(token);
    }

    // Update business to claimed and active
    await execute(
      `UPDATE businesses SET vendor_id = ?, is_claimed = 1, approved_by_vendor = 1, status = 'active' WHERE id = ?`,
      [user.id, biz.id]
    );

    // Link business to user profile
    await execute(
      `UPDATE profiles SET business_id = ? WHERE id = ?`,
      [biz.id, user.id]
    );

    return NextResponse.json({
      success: true,
      message: `مبروك! تم تأكيد وتفعيل نشاطك "${biz.name}" بنجاح.`,
      businessId: biz.id,
      slug: biz.slug,
      redirect: `/vendor/app?slug=${biz.slug}&claimed=1`,
    });
  } catch (e: any) {
    console.error('[POST /api/vendor/claim] Error:', e);
    return NextResponse.json(
      { error: e.message || 'Claim failed' },
      { status: 500 }
    );
  }
}
