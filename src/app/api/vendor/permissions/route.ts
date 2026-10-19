export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

/**
 * Default capabilities per subscription tier
 */
export const TIER_PERMISSIONS: Record<string, Record<string, boolean>> = {
  free: {
    minisite: true,
    social_bio: true,
    profile_editor: true,
    inquiry_notifications: false,
    content_creator: false,
    analytics_dashboard: false,
    packages_studio: false,
    journey_planner_listing: false,
    verified_badge: false,
  },
  pro: {
    minisite: true,
    social_bio: true,
    profile_editor: true,
    inquiry_notifications: true,
    content_creator: true,
    analytics_dashboard: true,
    packages_studio: true,
    journey_planner_listing: false,
    verified_badge: false,
  },
  verified_partner: {
    minisite: true,
    social_bio: true,
    profile_editor: true,
    inquiry_notifications: true,
    content_creator: true,
    analytics_dashboard: true,
    packages_studio: true,
    journey_planner_listing: true,
    verified_badge: true,
  },
};

export async function ensurePermissionsTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS vendor_feature_overrides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id VARCHAR(100) NOT NULL,
      feature_key VARCHAR(100) NOT NULL,
      is_enabled TINYINT(1) NOT NULL,
      admin_note VARCHAR(255) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_biz_feature (business_id, feature_key)
    )
  `);
}

/**
 * Helper to compute effective permissions for a business
 */
export async function getEffectivePermissions(businessId: string, subscriptionTier: string = 'free') {
  await ensurePermissionsTable();
  const base = { ...(TIER_PERMISSIONS[subscriptionTier] || TIER_PERMISSIONS.free) };

  const overrides = await query(
    `SELECT feature_key, is_enabled FROM vendor_feature_overrides WHERE business_id = ?`,
    [businessId]
  ) as any[];

  for (const row of overrides) {
    base[row.feature_key] = Boolean(row.is_enabled);
  }

  return base;
}

/**
 * GET /api/vendor/permissions?businessId=...
 * Accessible by: Admin or the authenticated Vendor for their business.
 * If no businessId provided, returns active vendor's permissions.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let targetBizId = searchParams.get('businessId');
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!targetBizId) {
      if (user.role === 'vendor') {
        const profile = await queryOne('SELECT business_id FROM profiles WHERE id = ?', [user.id]) as any;
        targetBizId = profile?.business_id;
      }
    }

    if (!targetBizId) {
      return NextResponse.json({ error: 'No business associated' }, { status: 400 });
    }

    const biz = await queryOne('SELECT id, name, slug, subscription_tier, is_claimed FROM businesses WHERE id = ?', [targetBizId]) as any;
    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const tier = biz.subscription_tier || 'free';
    const effective = await getEffectivePermissions(targetBizId, tier);

    // Get any active overrides
    const overrides = await query(
      'SELECT feature_key, is_enabled, admin_note FROM vendor_feature_overrides WHERE business_id = ?',
      [targetBizId]
    ) as any[];

    return NextResponse.json({
      business_id: targetBizId,
      business_name: biz.name,
      business_slug: biz.slug,
      subscription_tier: tier,
      permissions: effective,
      overrides: overrides.reduce((acc, row) => {
        acc[row.feature_key] = { is_enabled: Boolean(row.is_enabled), note: row.admin_note };
        return acc;
      }, {} as Record<string, any>),
    });
  } catch (e: any) {
    console.error('[vendor/permissions GET] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/vendor/permissions
 * Admin only: override a specific feature for a business
 * Body: { businessId, featureKey, isEnabled, adminNote? }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensurePermissionsTable();

    const body = await request.json();
    const { businessId, featureKey, isEnabled, adminNote = null } = body;

    if (!businessId || !featureKey) {
      return NextResponse.json({ error: 'businessId and featureKey are required' }, { status: 400 });
    }

    await execute(
      `INSERT INTO vendor_feature_overrides (business_id, feature_key, is_enabled, admin_note)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), admin_note = VALUES(admin_note)`,
      [businessId, featureKey, isEnabled ? 1 : 0, adminNote]
    );

    const biz = await queryOne('SELECT subscription_tier FROM businesses WHERE id = ?', [businessId]) as any;
    const effective = await getEffectivePermissions(businessId, biz?.subscription_tier || 'free');

    return NextResponse.json({
      success: true,
      message: `Permission "${featureKey}" updated successfully.`,
      permissions: effective,
    });
  } catch (e: any) {
    console.error('[vendor/permissions POST] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
