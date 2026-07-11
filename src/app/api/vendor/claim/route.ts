export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireVendor } from '@/lib/auth';

/**
 * GET /api/vendor/claim
 * Returns unclaimed business listings available to this vendor.
 * Sorted: matching type first, then all other unclaimed listings.
 *
 * POST /api/vendor/claim
 * Vendor claims a business by ID. Sets vendor_id + is_claimed = 1.
 */

export async function GET(request: NextRequest) {
  try {
    const user = await requireVendor();

    // Get vendor's profile to know their business type
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

    // Fetch all unclaimed businesses with type info
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

    // Split: matching type (or parent) first, then others
    const myType: any[] = [];
    const others: any[] = [];

    for (const biz of unclaimed) {
      const isMatch = vendorTypeId
        ? biz.type_id === vendorTypeId || biz.type_parent_id === vendorParentId
        : false;
      (isMatch ? myType : others).push({ ...biz, isMatchingType: isMatch });
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireVendor();
    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    // Fetch the target business
    const biz = await queryOne(
      'SELECT id, name, vendor_id, is_claimed FROM businesses WHERE id = ?',
      [businessId]
    ) as any;

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Only allow claiming unclaimed businesses
    if (biz.is_claimed && biz.vendor_id !== 'anonymous') {
      return NextResponse.json({
        error: `"${biz.name}" has already been claimed by another vendor.`,
        code: 'ALREADY_CLAIMED'
      }, { status: 409 });
    }

    // Check vendor doesn't already own a different business
    const existingClaim = await queryOne(
      'SELECT id, name FROM businesses WHERE vendor_id = ? AND is_claimed = 1 AND id != ?',
      [user.id, businessId]
    ) as any;

    // (Allow claiming — vendor may manage multiple listings)

    // Claim: set vendor_id, is_claimed = 1, link profile's business_id
    await execute(
      `UPDATE businesses SET vendor_id = ?, is_claimed = 1, approved_by_vendor = 1 WHERE id = ?`,
      [user.id, businessId]
    );

    // Link business to vendor's profile
    await execute(
      `UPDATE profiles SET business_id = ? WHERE id = ?`,
      [businessId, user.id]
    );

    return NextResponse.json({
      success: true,
      message: `You are now the owner of "${biz.name}". Your minisite is live!`,
      businessId,
      slug: biz.slug,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message?.includes('authenticated') ? 401 : 500 }
    );
  }
}
