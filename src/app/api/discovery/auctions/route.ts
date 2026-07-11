import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/discovery/auctions
 * Collects auction listings from ALL businesses that have filled
 * the 'auction' universal section in the Unified Studio.
 * 
 * Query params:
 *   ?type=<type_id>     — filter by business type / category
 *   ?business=<biz_id>  — filter by specific business (minisite view)
 *   ?status=live         — filter by auction status (upcoming/live/ended/sold)
 *   ?featured=true      — only featured
 *   ?limit=50           — max results
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const typeFilter = searchParams.get('type') || '';
    const businessFilter = searchParams.get('business') || '';
    const statusFilter = searchParams.get('status') || '';
    const featuredOnly = searchParams.get('featured') === 'true';

    let sql = `
      SELECT 
        b.id, 
        b.name AS business_name, 
        b.slug,
        bt.name AS type_name,
        bt.icon AS type_icon,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.\"sec_1_identity\".business_logo')),
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.\"business_info\".business_logo')),
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.\"business_info\".logo'))
        ) AS logo,
        JSON_EXTRACT(b.custom_data, '$.\"auction\"') AS auction_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active'
        AND JSON_EXTRACT(b.custom_data, '$.\"auction\"') IS NOT NULL
    `;

    const params: any[] = [];

    if (typeFilter) {
      const types = await query(
        'SELECT id FROM business_types WHERE id = ? OR parent_id = ?',
        [typeFilter, typeFilter]
      );
      const typeIds = (types as any[]).map(t => t.id);
      if (typeIds.length > 0) {
        sql += ` AND b.type_id IN (${typeIds.map(() => '?').join(',')}) `;
        params.push(...typeIds);
      }
    }

    if (businessFilter) {
      sql += ` AND b.id = ? `;
      params.push(businessFilter);
    }

    sql += ` ORDER BY b.created_at DESC LIMIT ? `;
    params.push(limit);

    const rows = await query(sql, params) as any[];

    const auctions = rows.map(row => {
      let data = null;
      try {
        data = typeof row.auction_data === 'string' ? JSON.parse(row.auction_data) : row.auction_data;
      } catch { return null; }

      if (!data || !data.auction_title) return null;
      if (!businessFilter && data.visibility_on_main_site === false) return null;
      if (featuredOnly && !data.is_featured) return null;
      if (statusFilter && data.auction_status !== statusFilter) return null;

      return {
        business_id: row.id,
        business_name: row.business_name,
        business_slug: row.slug,
        type_name: row.type_name,
        type_icon: row.type_icon,
        business_logo: row.logo || null,
        // Auction fields
        auction_title: data.auction_title,
        auction_type: data.auction_type || 'asset',
        starting_price: data.starting_price || null,
        reserve_price: data.reserve_price || null,
        buy_now_price: data.buy_now_price || null,
        auction_start: data.auction_start || null,
        auction_end: data.auction_end || null,
        auction_status: data.auction_status || 'upcoming',
        auction_description: data.auction_description || null,
        auction_terms: data.auction_terms || null,
        auction_contact: data.auction_contact || null,
        is_featured: !!data.is_featured,
      };
    }).filter(Boolean);

    return NextResponse.json({ success: true, count: auctions.length, items: auctions });
  } catch (error: any) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
