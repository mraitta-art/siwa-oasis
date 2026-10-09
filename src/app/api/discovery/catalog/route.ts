import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PUBLIC_CATALOG_ITEM_TYPE_IDS } from '@/lib/marketplace-item-types';

function parseJson(value: unknown, fallback: any) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business') || '';
    const typeId = searchParams.get('type') || '';
    const requestedKinds = (searchParams.get('kind') || PUBLIC_CATALOG_ITEM_TYPE_IDS.join(','))
      .split(',')
      .map(kind => kind.trim())
      .filter(kind => (PUBLIC_CATALOG_ITEM_TYPE_IDS as readonly string[]).includes(kind));
    const limitValue = Number.parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(limitValue, 100)) : 50;
    if (requestedKinds.length === 0) return NextResponse.json({ items: [] });

    let businessTypeIds: string[] = [];
    if (typeId) {
      const typeRows = await query(
        'SELECT id FROM business_types WHERE id = ? OR parent_id = ?',
        [typeId, typeId]
      ) as any[];
      businessTypeIds = typeRows.map(type => String(type.id));
      if (businessTypeIds.length === 0) businessTypeIds = [typeId];
    }

    let sql = `
      SELECT m.*, b.name AS business_name, b.slug AS business_slug,
             b.type_id AS business_type_id, bt.name AS business_type_name
      FROM marketplace_items m
      LEFT JOIN businesses b ON b.id = m.business_id
      LEFT JOIN business_types bt ON bt.id = b.type_id
      WHERE m.section_id = 'sec_9_marketplace_catalog'
        AND m.item_type IN (?)
        AND m.status = 'approved'
        AND m.publish_on_main_portal = 1
    `;
    const params: any[] = [requestedKinds];

    if (businessId) {
      sql += ` AND (m.business_id = ? OR EXISTS (
        SELECT 1 FROM package_business_assignments pba
        WHERE pba.item_id = m.id AND pba.business_id = ?
          AND pba.vendor_acceptance_status IN ('accepted', 'approved')
      ))`;
      params.push(businessId, businessId);
    }

    if (typeId) {
      sql += ' AND (b.type_id IN (?) OR m.target_type_id IN (?))';
      params.push(businessTypeIds, businessTypeIds);
    }

    sql += ' ORDER BY m.is_featured DESC, m.updated_at DESC LIMIT ?';
    params.push(limit);

    const rows = await query(sql, params) as any[];
    const items = rows.map(item => ({
      ...item,
      media: parseJson(item.media, []),
      category_specs: parseJson(item.category_specs, {}),
      included_features: parseJson(item.included_features, []),
      excluded_features: parseJson(item.excluded_features, []),
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('[DISCOVERY CATALOG ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to load catalog items' }, { status: 500 });
  }
}