import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const ALL_SECTIONS = [
  { id: 'sec_1_identity',           name: 'Identity & Heritage',            tier_minimum: 'free' },
  { id: 'sec_2_ambience',           name: 'Design & Ambience',              tier_minimum: 'free' },
  { id: 'sec_3_facilities',         name: 'Infrastructure & Pools',         tier_minimum: 'basic' },
  { id: 'sec_4_gastronomy',         name: 'Culinary Craft',                 tier_minimum: 'basic' },
  { id: 'sec_5_experiences',        name: 'Experiences & Programs',         tier_minimum: 'basic' },
  { id: 'sec_6_guardian',           name: 'Sustainability DNA',             tier_minimum: 'basic' },
  { id: 'sec_7_investment',         name: 'Business & Investment',          tier_minimum: 'premium' },
  { id: 'sec_8_connector',          name: 'Rates, Offers & Access',         tier_minimum: 'premium' },
  { id: 'sec_9_marketplace_catalog',name: 'Marketplace & Products Catalog', tier_minimum: 'premium' },
  { id: 'sec_10_testimonials_faqs', name: 'Testimonials & FAQs',            tier_minimum: 'premium' },
];

/**
 * GET /api/jana/admin-overrides?businessId=xxx
 * Returns a business's current override config and available sections
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      // List all businesses with their override state
      const businesses = await query<any>(
        `SELECT b.id, b.name, b.slug, b.subscription_tier, b.admin_overrides,
                bt.name as type_name
         FROM businesses b
         LEFT JOIN business_types bt ON b.type_id = bt.id
         WHERE b.status = 'active'
         ORDER BY b.subscription_tier ASC, b.name ASC`
      );

      return NextResponse.json(businesses.map((biz: any) => {
        let overrides = {};
        try {
          overrides = biz.admin_overrides
            ? (typeof biz.admin_overrides === 'string' ? JSON.parse(biz.admin_overrides) : biz.admin_overrides)
            : {};
        } catch (e) { /* ignore */ }
        return { ...biz, admin_overrides: overrides };
      }));
    }

    // Single business detail
    const [biz] = await query<any>('SELECT id, name, subscription_tier, admin_overrides FROM businesses WHERE id = ?', [businessId]);
    if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    let currentOverrides: any = {};
    try {
      currentOverrides = biz.admin_overrides
        ? (typeof biz.admin_overrides === 'string' ? JSON.parse(biz.admin_overrides) : biz.admin_overrides)
        : {};
    } catch (e) { /* ignore */ }

    return NextResponse.json({
      business: { id: biz.id, name: biz.name, tier: biz.subscription_tier },
      overrides: currentOverrides,
      available_sections: ALL_SECTIONS,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/jana/admin-overrides
 * Update admin overrides for a business.
 * Body: { businessId: string, allowed_sections: string[], note?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { businessId, allowed_sections, note } = body;

    if (!businessId || !Array.isArray(allowed_sections)) {
      return NextResponse.json({ error: 'businessId and allowed_sections are required' }, { status: 400 });
    }

    const overrides = {
      allowed_sections,
      note: note || '',
      granted_by: admin.email,
      granted_at: new Date().toISOString(),
    };

    await execute(
      'UPDATE businesses SET admin_overrides = ? WHERE id = ?',
      [JSON.stringify(overrides), businessId]
    );

    return NextResponse.json({ success: true, overrides });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/jana/admin-overrides?businessId=xxx
 * Clear all admin overrides for a business
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    await execute('UPDATE businesses SET admin_overrides = NULL WHERE id = ?', [businessId]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
