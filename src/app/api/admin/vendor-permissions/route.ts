import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/vendor-permissions
 * List all businesses with their package/studio permissions
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    // Ensure column exists
    try {
      await execute(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS can_create_packages TINYINT(1) DEFAULT 0`);
    } catch {}

    const rows = await query(`
      SELECT b.id, b.name, b.slug, b.type_id, b.subscription_tier, b.active,
             b.can_create_packages,
             p.display_name as owner_name, p.email as owner_email,
             COUNT(DISTINCT psi.id) as studio_items_count
      FROM businesses b
      LEFT JOIN profiles p ON p.business_id = b.id AND p.role = 'vendor'
      LEFT JOIN package_studio_items psi ON psi.business_id = b.id
      GROUP BY b.id
      ORDER BY b.name ASC
    `) as any[];

    return NextResponse.json(rows.map(r => ({
      ...r,
      can_create_packages: Boolean(r.can_create_packages),
      studio_items_count: Number(r.studio_items_count) || 0,
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'Admin access required' ? 403 : 500 });
  }
}

/**
 * PATCH /api/admin/vendor-permissions
 * Toggle permission for a specific business
 * Body: { businessId, can_create_packages: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const { businessId, can_create_packages } = await req.json();

    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    try {
      await execute(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS can_create_packages TINYINT(1) DEFAULT 0`);
    } catch {}

    await execute(
      `UPDATE businesses SET can_create_packages = ? WHERE id = ?`,
      [can_create_packages ? 1 : 0, businessId]
    );

    return NextResponse.json({
      success: true,
      message: can_create_packages
        ? 'Package Studio access GRANTED for this vendor'
        : 'Package Studio access REVOKED for this vendor'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'Admin access required' ? 403 : 500 });
  }
}
