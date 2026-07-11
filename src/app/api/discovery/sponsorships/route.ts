import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/discovery/sponsorships
 * Collects sponsorship & partnership opportunities from ALL businesses
 * that have filled the 'sponsorship' universal section in the Unified Studio.
 * 
 * Query params:
 *   ?type=<type_id>     — filter by business type / category
 *   ?business=<biz_id>  — filter by specific business
 *   ?tier=gold          — filter by sponsorship tier
 *   ?featured=true      — only featured
 *   ?limit=50           — max results
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const typeFilter = searchParams.get('type') || '';
    const businessFilter = searchParams.get('business') || '';
    const tierFilter = searchParams.get('tier') || '';
    const featuredOnly = searchParams.get('featured') === 'true';

    let sql = `
      SELECT 
        b.id, 
        b.name AS business_name, 
        b.slug,
        bt.name AS type_name,
        bt.icon AS type_icon,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".business_logo')) AS logo,
        JSON_EXTRACT(b.custom_data, '$."sponsorship"') AS sponsorship_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active'
        AND JSON_EXTRACT(b.custom_data, '$."sponsorship"') IS NOT NULL
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

    const sponsorships = rows.map(row => {
      let data = null;
      try {
        data = typeof row.sponsorship_data === 'string' ? JSON.parse(row.sponsorship_data) : row.sponsorship_data;
      } catch { return null; }

      if (!data || !data.sponsorship_title) return null;
      if (!businessFilter && data.visibility_on_main_site === false) return null;
      if (featuredOnly && !data.is_featured) return null;
      if (tierFilter && data.sponsorship_tier !== tierFilter) return null;

      return {
        business_id: row.id,
        business_name: row.business_name,
        business_slug: row.slug,
        business_logo: row.logo || null,
        type_name: row.type_name,
        type_icon: row.type_icon,
        // Sponsorship fields
        sponsorship_title: data.sponsorship_title,
        sponsorship_type: data.sponsorship_type || 'event_sponsor',
        sponsorship_tier: data.sponsorship_tier || 'custom',
        sponsorship_value: data.sponsorship_value || null,
        sponsorship_benefits: data.sponsorship_benefits || null,
        sponsorship_duration: data.sponsorship_duration || null,
        sponsorship_description: data.sponsorship_description || null,
        is_featured: !!data.is_featured,
      };
    }).filter(Boolean);

    return NextResponse.json({ success: true, count: sponsorships.length, items: sponsorships });
  } catch (error: any) {
    console.error('Error fetching sponsorships:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
