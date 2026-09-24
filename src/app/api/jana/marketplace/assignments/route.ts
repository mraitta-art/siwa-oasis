import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

/**
 * AUTO-HEAL: Ensure package_business_assignments table exists
 */
async function ensureAssignmentsTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS package_business_assignments (
      id VARCHAR(100) PRIMARY KEY,
      item_id VARCHAR(100) NOT NULL,
      business_id VARCHAR(100) NOT NULL,
      business_role VARCHAR(50) DEFAULT 'partner',
      revenue_share_percentage DECIMAL(5,2) DEFAULT NULL,
      vendor_acceptance_status VARCHAR(30) DEFAULT 'accepted',
      visible_on_minisite BOOLEAN DEFAULT 1,
      assigned_by VARCHAR(100) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_item (item_id),
      INDEX idx_biz (business_id),
      INDEX idx_status (vendor_acceptance_status)
    )
  `);
}

/**
 * GET /api/jana/marketplace/assignments
 * ?itemId=<id>         — fetch all businesses assigned to a package/offer
 * ?businessId=<id>     — fetch all packages/offers assigned to a business
 */
export async function GET(req: NextRequest) {
  try {
    await ensureAssignmentsTable();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const businessId = searchParams.get('businessId');

    if (itemId) {
      const rows = await query(`
        SELECT pba.*, b.name as business_name, b.slug as business_slug,
               b.subscription_tier as business_tier, b.type_id as business_type_id,
               bt.name as business_type_name
        FROM package_business_assignments pba
        LEFT JOIN businesses b ON pba.business_id = b.id
        LEFT JOIN business_types bt ON b.type_id = bt.id
        WHERE pba.item_id = ?
        ORDER BY pba.created_at ASC
      `, [itemId]) as any[];

      return NextResponse.json(rows.map(r => ({
        ...r,
        visible_on_minisite: Boolean(r.visible_on_minisite),
        revenue_share_percentage: r.revenue_share_percentage ? Number(r.revenue_share_percentage) : null
      })));
    }

    if (businessId) {
      const rows = await query(`
        SELECT pba.*, m.title as item_title, m.title_ar as item_title_ar,
               m.item_type, m.price_amount, m.currency, m.status as item_status
        FROM package_business_assignments pba
        LEFT JOIN marketplace_items m ON pba.item_id = m.id
        WHERE pba.business_id = ?
        ORDER BY pba.created_at DESC
      `, [businessId]) as any[];

      return NextResponse.json(rows.map(r => ({
        ...r,
        visible_on_minisite: Boolean(r.visible_on_minisite)
      })));
    }

    return NextResponse.json({ error: 'itemId or businessId required' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/jana/marketplace/assignments
 * Centralized Admin tool to forward / assign a package or offer to:
 * 1. Scope: 'parent_category' (all businesses under parent type)
 * 2. Scope: 'child_typology' (all businesses under child type)
 * 3. Scope: 'multi_business' (explicit list of businesses with roles)
 */
export async function POST(req: NextRequest) {
  try {
    await ensureAssignmentsTable();
    const user = await requireAdmin();
    const body = await req.json();

    const {
      item_id,
      target_scope = 'multi_business', // 'parent_category' | 'child_typology' | 'multi_business'
      target_type_id = null,
      assignments = [] // Array<{ business_id, business_role, revenue_share_percentage, visible_on_minisite }>
    } = body;

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    }

    // Clean existing assignments for this item
    await execute('DELETE FROM package_business_assignments WHERE item_id = ?', [item_id]);

    const insertedAssignments: any[] = [];

    if (target_scope === 'parent_category' && target_type_id) {
      // Auto-assign to all active businesses under parent category
      const businessesInParent = await query(`
        SELECT b.id, b.name, b.subscription_tier
        FROM businesses b
        WHERE b.active = 1 AND b.type_id IN (
          SELECT id FROM business_types WHERE parent_id = ? OR id = ?
        )
      `, [target_type_id, target_type_id]) as any[];

      for (const biz of businessesInParent) {
        const id = crypto.randomUUID();
        await execute(`
          INSERT INTO package_business_assignments (
            id, item_id, business_id, business_role, vendor_acceptance_status, visible_on_minisite, assigned_by
          ) VALUES (?, ?, ?, 'partner', 'accepted', 1, ?)
        `, [id, item_id, biz.id, user.id]);

        insertedAssignments.push({ id, business_id: biz.id, business_name: biz.name });
      }
    } else if (target_scope === 'child_typology' && target_type_id) {
      // Auto-assign to all active businesses in this child typology
      const businessesInChild = await query(`
        SELECT b.id, b.name, b.subscription_tier
        FROM businesses b
        WHERE b.active = 1 AND b.type_id = ?
      `, [target_type_id]) as any[];

      for (const biz of businessesInChild) {
        const id = crypto.randomUUID();
        await execute(`
          INSERT INTO package_business_assignments (
            id, item_id, business_id, business_role, vendor_acceptance_status, visible_on_minisite, assigned_by
          ) VALUES (?, ?, ?, 'partner', 'accepted', 1, ?)
        `, [id, item_id, biz.id, user.id]);

        insertedAssignments.push({ id, business_id: biz.id, business_name: biz.name });
      }
    } else if (Array.isArray(assignments) && assignments.length > 0) {
      // Multi-business custom combo with custom roles
      for (const a of assignments) {
        if (!a.business_id) continue;
        const id = crypto.randomUUID();
        await execute(`
          INSERT INTO package_business_assignments (
            id, item_id, business_id, business_role, revenue_share_percentage,
            vendor_acceptance_status, visible_on_minisite, assigned_by
          ) VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?)
        `, [
          id,
          item_id,
          a.business_id,
          a.business_role || 'partner',
          a.revenue_share_percentage ? Number(a.revenue_share_percentage) : null,
          a.visible_on_minisite !== false ? 1 : 0,
          user.id
        ]);
        insertedAssignments.push({ id, business_id: a.business_id, role: a.business_role });
      }
    }

    // Update target_scope and target_type_id on marketplace_items if exists
    try {
      await execute(`
        UPDATE marketplace_items
        SET target_scope = ?, target_type_id = ?
        WHERE id = ?
      `, [target_scope, target_type_id || null, item_id]);
    } catch {}

    // Also update package_studio_items if exists
    try {
      await execute(`
        UPDATE package_studio_items
        SET target_scope = ?, target_type_id = ?
        WHERE id = ?
      `, [target_scope, target_type_id || null, item_id]);
    } catch {}

    return NextResponse.json({
      success: true,
      item_id,
      target_scope,
      assigned_count: insertedAssignments.length,
      assignments: insertedAssignments
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/jana/marketplace/assignments
 * Update an individual assignment (e.g. vendor accepts/declines, changes minisite visibility)
 */
export async function PATCH(req: NextRequest) {
  try {
    await ensureAssignmentsTable();
    const body = await req.json();
    const { id, vendor_acceptance_status, visible_on_minisite, business_role, revenue_share_percentage } = body;

    if (!id) return NextResponse.json({ error: 'Assignment id required' }, { status: 400 });

    const sets: string[] = [];
    const params: any[] = [];

    if (vendor_acceptance_status !== undefined) {
      sets.push('vendor_acceptance_status = ?');
      params.push(vendor_acceptance_status);
    }
    if (visible_on_minisite !== undefined) {
      sets.push('visible_on_minisite = ?');
      params.push(visible_on_minisite ? 1 : 0);
    }
    if (business_role !== undefined) {
      sets.push('business_role = ?');
      params.push(business_role);
    }
    if (revenue_share_percentage !== undefined) {
      sets.push('revenue_share_percentage = ?');
      params.push(revenue_share_percentage ? Number(revenue_share_percentage) : null);
    }

    if (sets.length > 0) {
      params.push(id);
      await execute(`UPDATE package_business_assignments SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({ success: true, message: 'Assignment updated' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/jana/marketplace/assignments?id=<id>
 */
export async function DELETE(req: NextRequest) {
  try {
    await ensureAssignmentsTable();
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await execute('DELETE FROM package_business_assignments WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Assignment removed' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
