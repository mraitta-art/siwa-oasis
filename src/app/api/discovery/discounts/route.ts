import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/discovery/discounts
 * Collects discounts & promotions from ALL businesses that have filled
 * the 'discounts-promotions' universal section (supporting Slot 1, Slot 2, Slot 3) in the Unified Studio.
 * 
 * Query params:
 *   ?type=<type_id>     — filter by business type / category
 *   ?business=<biz_id>  — filter by specific business (minisite view)
 *   ?season=winter      — filter by season
 *   ?discount_type=seasonal — filter by discount type
 *   ?featured=true      — only featured
 *   ?limit=50           — max results
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const typeFilter = searchParams.get('type') || '';
    const businessFilter = searchParams.get('business') || '';
    const seasonFilter = searchParams.get('season') || '';
    const discountTypeFilter = searchParams.get('discount_type') || '';
    const featuredOnly = searchParams.get('featured') === 'true';

    let sql = `
      SELECT 
        b.id, 
        b.name AS business_name, 
        b.slug,
        bt.name AS type_name,
        bt.icon AS type_icon,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".business_logo')) AS logo,
        JSON_EXTRACT(b.custom_data, '$."discounts-promotions"') AS discount_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active'
        AND JSON_EXTRACT(b.custom_data, '$."discounts-promotions"') IS NOT NULL
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

    const discounts: any[] = [];

    rows.forEach(row => {
      let data = null;
      try {
        data = typeof row.discount_data === 'string' ? JSON.parse(row.discount_data) : row.discount_data;
      } catch { return; }

      if (!data) return;

      const businessLogo = row.logo || null;

      // ────────────────────────────────────────────────────────────────
      // SLOT 1
      // ────────────────────────────────────────────────────────────────
      if (data.discount_name) {
        if (!featuredOnly || data.is_featured) {
          if (seasonFilter === '' || data.season === seasonFilter) {
            if (discountTypeFilter === '' || data.discount_type === discountTypeFilter) {
              if (businessFilter || data.visibility_on_main_site !== false) {
                discounts.push({
                  business_id: row.id,
                  business_name: row.business_name,
                  business_slug: row.slug,
                  business_logo: businessLogo,
                  type_name: row.type_name,
                  type_icon: row.type_icon,
                  discount_name: data.discount_name,
                  discount_type: data.discount_type || 'percent',
                  discount_value: data.discount_value || null,
                  applies_to: data.applies_to || 'all_services',
                  min_group_size: data.min_group_size || null,
                  season: data.season || 'all_year',
                  valid_from: data.valid_from || null,
                  valid_until: data.valid_until || null,
                  description: data.discount_description || null,
                  promo_code: data.promo_code || null,
                  discount_status: data.discount_status || 'active',
                  is_featured: !!data.is_featured,
                  slot: 1
                });
              }
            }
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // SLOT 2
      // ────────────────────────────────────────────────────────────────
      if (data.discount_name_2) {
        if (!featuredOnly || data.is_featured_2) {
          if (seasonFilter === '' || data.season_2 === seasonFilter) {
            if (discountTypeFilter === '' || data.discount_type_2 === discountTypeFilter) {
              if (businessFilter || data.visibility_on_main_site_2 !== false) {
                discounts.push({
                  business_id: `${row.id}-slot-2`,
                  business_name: row.business_name,
                  business_slug: row.slug,
                  business_logo: businessLogo,
                  type_name: row.type_name,
                  type_icon: row.type_icon,
                  discount_name: data.discount_name_2,
                  discount_type: data.discount_type_2 || 'percent',
                  discount_value: data.discount_value_2 || null,
                  applies_to: data.applies_to_2 || 'all_services',
                  min_group_size: data.min_group_size_2 || null,
                  season: data.season_2 || 'all_year',
                  valid_from: data.valid_from_2 || null,
                  valid_until: data.valid_until_2 || null,
                  description: data.discount_description_2 || null,
                  promo_code: data.promo_code_2 || null,
                  discount_status: data.discount_status_2 || 'active',
                  is_featured: !!data.is_featured_2,
                  slot: 2
                });
              }
            }
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // SLOT 3
      // ────────────────────────────────────────────────────────────────
      if (data.discount_name_3) {
        if (!featuredOnly || data.is_featured_3) {
          if (seasonFilter === '' || data.season_3 === seasonFilter) {
            if (discountTypeFilter === '' || data.discount_type_3 === discountTypeFilter) {
              if (businessFilter || data.visibility_on_main_site_3 !== false) {
                discounts.push({
                  business_id: `${row.id}-slot-3`,
                  business_name: row.business_name,
                  business_slug: row.slug,
                  business_logo: businessLogo,
                  type_name: row.type_name,
                  type_icon: row.type_icon,
                  discount_name: data.discount_name_3,
                  discount_type: data.discount_type_3 || 'percent',
                  discount_value: data.discount_value_3 || null,
                  applies_to: data.applies_to_3 || 'all_services',
                  min_group_size: data.min_group_size_3 || null,
                  season: data.season_3 || 'all_year',
                  valid_from: data.valid_from_3 || null,
                  valid_until: data.valid_until_3 || null,
                  description: data.discount_description_3 || null,
                  promo_code: data.promo_code_3 || null,
                  discount_status: data.discount_status_3 || 'active',
                  is_featured: !!data.is_featured_3,
                  slot: 3
                });
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, count: discounts.length, items: discounts });
  } catch (error: any) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
