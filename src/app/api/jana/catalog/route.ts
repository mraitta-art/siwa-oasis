import { NextRequest, NextResponse } from 'next/server';
import { execute, query, transaction } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomUUID } from 'crypto';

const PRODUCT_STATES = ['draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'];
const PROMOTION_STATES = ['draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'];

export async function GET() {
  try {
    await requireAdmin();
    const [products, promotions, discounts] = await Promise.all([
      query(`SELECT tp.*, b.name AS business_name, tcc.name AS category_name,
                    (SELECT COUNT(*) FROM tour_stops ts WHERE ts.product_id = tp.id) AS item_count,
                    (SELECT COUNT(*) FROM tour_product_components tc WHERE tc.product_id = tp.id) AS component_count
             FROM tour_products tp
             LEFT JOIN businesses b ON b.id = tp.vendor_business_id
             LEFT JOIN tour_catalog_categories tcc ON tcc.id = tp.catalog_cat_id
             ORDER BY tp.updated_at DESC`),
      query(`SELECT promo.*, b.name AS business_name, tp.name AS product_name
             FROM tour_promotions promo
             LEFT JOIN businesses b ON b.id = promo.vendor_business_id
             LEFT JOIN tour_products tp ON tp.id = promo.product_id
             ORDER BY promo.created_at DESC`),
      query(`SELECT d.*, tp.name AS product_name, b.name AS business_name
             FROM tour_product_discount_rules d
             JOIN tour_products tp ON tp.id = d.product_id
             LEFT JOIN businesses b ON b.id = tp.vendor_business_id
             ORDER BY d.updated_at DESC`),
    ]);
    return NextResponse.json({ products, promotions, discounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { entity, id, action, notes } = body;
    if (!entity || !id || !action) return NextResponse.json({ error: 'entity, id, and action are required' }, { status: 400 });
    if (!['approve', 'reject', 'publish', 'archive', 'restore'].includes(action)) return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });

    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft';
    if (entity === 'product') {
      await execute(`UPDATE tour_products SET status = ?, approval_status = ?, approval_notes = ?, approved_by = ? WHERE id = ?`, [status, status, notes || null, admin.id, id]);
    } else if (entity === 'promotion') {
      await execute(`UPDATE tour_promotions SET status = ?, approval_status = ?, approval_notes = ?, approved_by = ? WHERE id = ?`, [status, status, notes || null, admin.id, id]);
    } else if (entity === 'discount') {
      await execute(`UPDATE tour_product_discount_rules SET status = ?, approval_status = ? WHERE id = ?`, [status, status, id]);
    } else {
      return NextResponse.json({ error: 'Unsupported entity' }, { status: 400 });
    }
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { name, description, catalog_cat_id = 'multi_day_package', component_product_ids = [], stops = [], base_price_usd = null, base_price_egp = null } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const productId = randomUUID();
    const slug = `${name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await transaction(async connection => {
      await connection.query(`INSERT INTO tour_products
        (id, catalog_cat_id, product_kind, name, slug, description, base_price_usd, base_price_egp,
         is_public, is_featured, is_active, status, approval_status, created_by)
        VALUES (?, ?, 'package', ?, ?, ?, ?, ?, 0, 0, 1, 'draft', 'approved', ?)`,
        [productId, catalog_cat_id, name.trim(), slug, description || null, base_price_usd, base_price_egp, admin.id]);
      for (const componentProductId of component_product_ids) {
        await connection.query(`INSERT INTO tour_product_components (product_id, component_product_id) VALUES (?, ?)`, [productId, componentProductId]);
      }
      for (const [index, stop] of stops.entries()) {
        await connection.query(`INSERT INTO tour_stops
          (product_id, business_id, business_name, item_type, title, stop_role, day_number, time_slot,
           start_time, end_time, sequence_order, duration_hours, notes, is_optional, price_usd,
           location_name, location_address, latitude, longitude, meal_type, accommodation_nights,
           transfer_minutes, end_date, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          productId, stop.business_id || null, stop.business_name || null, stop.item_type || stop.stop_role || 'activity',
          stop.title || null, stop.stop_role || 'do', stop.day_number || 1, stop.time_slot || 'morning',
          stop.start_time || null, stop.end_time || null, index, stop.duration_hours || null, stop.notes || null,
          stop.is_optional ? 1 : 0, stop.price_usd || null, stop.location_name || null, stop.location_address || null,
          stop.latitude ?? null, stop.longitude ?? null, stop.meal_type || null, stop.accommodation_nights || null,
          stop.transfer_minutes || null, stop.end_date || null, JSON.stringify(stop.metadata || {}),
        ]);
      }
    });
    return NextResponse.json({ success: true, id: productId, status: 'draft' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
