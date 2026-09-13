import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'list';

  try {
    if (action === 'categories') {
      const cats = await query(`
        SELECT id, parent_id, name, name_ar, icon, color, sort_order
        FROM tour_catalog_categories
        WHERE is_active = 1
        ORDER BY sort_order ASC, id ASC
      `);
      return NextResponse.json(cats);
    }

    if (action === 'list') {
      const products = await query(`
        SELECT
          tp.*,
          tcc.name AS category_name,
          tcc.icon AS category_icon,
          tcc.color AS category_color,
          (SELECT COUNT(*) FROM tour_stops ts WHERE ts.product_id = tp.id) AS stop_count
        FROM tour_products tp
        LEFT JOIN tour_catalog_categories tcc ON tp.catalog_cat_id = tcc.id
        WHERE tp.is_active = 1
        ORDER BY tp.is_featured DESC, tp.created_at DESC
      `);
      return NextResponse.json(products);
    }

    if (action === 'get') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const [product] = await query(`
        SELECT tp.*, tcc.name AS category_name, tcc.icon AS category_icon, tcc.color AS category_color
        FROM tour_products tp
        LEFT JOIN tour_catalog_categories tcc ON tp.catalog_cat_id = tcc.id
        WHERE tp.id = ?
      `, [id]) as any[];

      if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const stops = await query(`
        SELECT ts.*, b.name AS business_name, b.slug AS business_slug,
               bt.name AS type_name, bt.icon AS type_icon, bt.icon_color AS type_icon_color,
               bt.parent_id AS parent_type_id
        FROM tour_stops ts
        JOIN businesses b ON ts.business_id = b.id
        LEFT JOIN business_types bt ON b.type_id = bt.id
        WHERE ts.product_id = ?
        ORDER BY ts.day_number ASC, ts.sequence_order ASC
      `, [id]);

      return NextResponse.json({ ...product, stops });
    }

    if (action === 'businesses') {
      const search = searchParams.get('q') || '';
      const role = searchParams.get('role') || '';

      // Map stop role to parent_type_id hints for filtering
      const roleParentMap: Record<string, string[]> = {
        stay:   ['accommodation'],
        eat:    ['food'],
        visit:  ['agriculture_industry', 'crafts', 'arts_culture', 'education_research'],
        do:     ['adventure', 'wellness', 'events_entertainment'],
        travel: ['logistics'],
        buy:    ['crafts'],
      };

      const parentFilter = role && roleParentMap[role] ? roleParentMap[role] : [];
      const likeQ = `%${search}%`;

      let sql = `
        SELECT b.id, b.name, b.slug, b.type_id,
               bt.name AS type_name, bt.icon AS type_icon,
               bt.icon_color AS type_icon_color, bt.parent_id AS parent_type_id,
               pbt.name AS parent_type_name
        FROM businesses b
        LEFT JOIN business_types bt ON b.type_id = bt.id
        LEFT JOIN business_types pbt ON bt.parent_id = pbt.id
        WHERE b.status = 'active'
      `;
      const params: any[] = [];

      if (search) {
        sql += ` AND b.name LIKE ?`;
        params.push(likeQ);
      }

      if (parentFilter.length > 0) {
        sql += ` AND bt.parent_id IN (${parentFilter.map(() => '?').join(',')})`;
        params.push(...parentFilter);
      }

      sql += ` ORDER BY b.name ASC LIMIT 60`;

      const businesses = await query(sql, params);
      return NextResponse.json(businesses);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: any) {
    console.error('[tour-builder GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'save_product') {
      const {
        id, catalog_cat_id, name, name_ar, slug, description, description_ar,
        duration_days, duration_hours, difficulty, pace,
        group_size_min, group_size_max,
        base_price_usd, base_price_egp, price_per,
        included, excluded, highlights, best_season, tags,
        image_url, is_public, is_featured,
        vendor_business_id, vendor_name,
        stops = []
      } = body;

      if (!catalog_cat_id || !name) {
        return NextResponse.json({ error: 'catalog_cat_id and name are required' }, { status: 400 });
      }

      const safeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      let productId = id;

      if (id) {
        // UPDATE
        await query(`
          UPDATE tour_products SET
            catalog_cat_id=?, name=?, name_ar=?, slug=?, description=?, description_ar=?,
            duration_days=?, duration_hours=?, difficulty=?, pace=?,
            group_size_min=?, group_size_max=?,
            base_price_usd=?, base_price_egp=?, price_per=?,
            included=?, excluded=?, highlights=?, best_season=?, tags=?,
            image_url=?, is_public=?, is_featured=?,
            vendor_business_id=?, vendor_name=?,
            updated_at=NOW()
          WHERE id=?
        `, [
          catalog_cat_id, name, name_ar || null, safeSlug, description || null, description_ar || null,
          duration_days || 1, duration_hours || null, difficulty || 'easy', pace || 'moderate',
          group_size_min || 1, group_size_max || 20,
          base_price_usd || null, base_price_egp || null, price_per || 'person',
          JSON.stringify(included || []), JSON.stringify(excluded || []),
          JSON.stringify(highlights || []), best_season || null, JSON.stringify(tags || []),
          image_url || null, is_public ? 1 : 0, is_featured ? 1 : 0,
          vendor_business_id || null, vendor_name || null,
          id
        ]);

        // Delete existing stops and re-insert
        await query('DELETE FROM tour_stops WHERE product_id = ?', [id]);
      } else {
        // INSERT
        const result = await query(`
          INSERT INTO tour_products
            (catalog_cat_id, name, name_ar, slug, description, description_ar,
             duration_days, duration_hours, difficulty, pace,
             group_size_min, group_size_max,
             base_price_usd, base_price_egp, price_per,
             included, excluded, highlights, best_season, tags,
             image_url, is_public, is_featured,
             vendor_business_id, vendor_name)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
          catalog_cat_id, name, name_ar || null, safeSlug, description || null, description_ar || null,
          duration_days || 1, duration_hours || null, difficulty || 'easy', pace || 'moderate',
          group_size_min || 1, group_size_max || 20,
          base_price_usd || null, base_price_egp || null, price_per || 'person',
          JSON.stringify(included || []), JSON.stringify(excluded || []),
          JSON.stringify(highlights || []), best_season || null, JSON.stringify(tags || []),
          image_url || null, is_public ? 1 : 0, is_featured ? 1 : 0,
          vendor_business_id || null, vendor_name || null
        ]) as any;
        productId = result.insertId || id;

        // After insert, get the UUID
        const [newRow] = await query('SELECT id FROM tour_products WHERE slug = ? ORDER BY created_at DESC LIMIT 1', [safeSlug]) as any[];
        if (newRow) productId = newRow.id;
      }

      // Insert stops
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        await query(`
          INSERT INTO tour_stops
            (product_id, business_id, business_name, stop_role, day_number,
             time_slot, start_time, end_time, start_date,
             sequence_order, duration_hours, notes, is_optional, price_usd)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
          productId, s.business_id, s.business_name || null, s.stop_role,
          s.day_number || 1,
          s.time_slot || 'morning',
          s.start_time || null,
          s.end_time || null,
          s.start_date || null,
          i,
          s.duration_hours || null,
          s.notes || null,
          s.is_optional ? 1 : 0,
          s.price_usd || null
        ]);
      }

      return NextResponse.json({ success: true, id: productId, slug: safeSlug });
    }

    if (action === 'delete_product') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      await query('DELETE FROM tour_stops WHERE product_id = ?', [id]);
      await query('DELETE FROM tour_products WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: any) {
    console.error('[tour-builder POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
