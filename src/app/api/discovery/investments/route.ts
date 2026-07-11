import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/discovery/investments
 * Collects investment opportunities from ALL businesses that have filled
 * the 'investment-opportunity' universal section in the Unified Studio.
 * 
 * Query params:
 *   ?type=<type_id>     — filter by business type / category
 *   ?business=<biz_id>  — filter by specific business (minisite view)
 *   ?featured=true      — only featured opportunities
 *   ?limit=50           — max results
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const typeFilter = searchParams.get('type') || '';
    const businessFilter = searchParams.get('business') || '';
    const featuredOnly = searchParams.get('featured') === 'true';

    let sql = `
      SELECT 
        b.id, 
        b.name AS business_name, 
        b.slug,
        bt.name AS type_name,
        bt.icon AS type_icon,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."sec_1_identity".business_logo')),
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".business_logo')),
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".logo'))
        ) AS logo,
        JSON_EXTRACT(b.custom_data, '$."investment-opportunity"') AS investment_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active'
        AND JSON_EXTRACT(b.custom_data, '$."investment-opportunity"') IS NOT NULL
    `;

    const params: any[] = [];

    if (typeFilter) {
      // Include child types if this is a parent category
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

    const investments = rows.map(row => {
      let data = null;
      try {
        data = typeof row.investment_data === 'string' ? JSON.parse(row.investment_data) : row.investment_data;
      } catch { return null; }

      if (!data || !data.opportunity_title) return null;

      // Check visibility
      if (!businessFilter && data.visibility_on_main_site === false) return null;
      if (featuredOnly && !data.is_featured) return null;

      return {
        business_id: row.id,
        business_name: row.business_name,
        business_slug: row.slug,
        business_logo: row.logo || null,
        type_name: row.type_name,
        type_icon: row.type_icon,
        // Investment fields
        opportunity_title: data.opportunity_title,
        opportunity_type: data.opportunity_type || 'equity',
        investment_amount_min: data.investment_amount_min || null,
        investment_amount_max: data.investment_amount_max || null,
        expected_roi_percent: data.expected_roi_percent || null,
        business_stage: data.business_stage || null,
        annual_revenue: data.annual_revenue || null,
        investment_status: data.investment_status || 'open',
        target_investors: data.target_investors || null,
        investment_description: data.investment_description || null,
        investment_highlights: data.investment_highlights || null,
        roi_potential: data.roi_potential || null,
        is_featured: !!data.is_featured,
        contact_for_details: !!data.contact_for_details,
        investment_contact: data.investment_contact || null,
        // Timeline/traction fields
        years_in_business: data.years_in_business || null,
        investors_current: data.investors_current || null,
        equity_offered: data.equity_offered || null,
        break_even_timeline: data.break_even_timeline || null,
      };
    }).filter(Boolean);

    return NextResponse.json({ success: true, count: investments.length, items: investments });
  } catch (error: any) {
    console.error('Error fetching investment opportunities:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
