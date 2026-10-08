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
    const requestedTypeIds = [...new Set(typeFilter.split(',').map(id => id.trim()).filter(Boolean))];
    const businessTypeIds = new Set<string>();
    const targetTypeIds = new Set<string>();

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

    if (requestedTypeIds.length > 0) {
      const typePlaceholders = requestedTypeIds.map(() => '?').join(',');
      const types = await query<any>(
        `SELECT id, parent_id FROM business_types
         WHERE id IN (${typePlaceholders}) OR parent_id IN (${typePlaceholders})`,
        [...requestedTypeIds, ...requestedTypeIds]
      );
      types.forEach(type => {
        businessTypeIds.add(String(type.id));
        targetTypeIds.add(String(type.id));
        if (type.parent_id) targetTypeIds.add(String(type.parent_id));
      });
      if (businessTypeIds.size === 0) {
        requestedTypeIds.forEach(typeId => {
          businessTypeIds.add(typeId);
          targetTypeIds.add(typeId);
        });
      }
      const typeIds = [...businessTypeIds];
      sql += ` AND b.type_id IN (${typeIds.map(() => '?').join(',')}) `;
      params.push(...typeIds);
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

      // Only explicitly approved and published opportunities are public.
      if (data.approval_status !== 'approved') return null;
      if (data.status && !['published', 'funded'].includes(data.status)) return null;

      // Check visibility
      if (!businessFilter && data.visibility_on_main_site === false) return null;
      if (featuredOnly && !data.is_featured) return null;

      return {
        business_id: row.id,
        business_name: row.business_name,
        business_slug: row.slug,
        owner_type: 'vendor',
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

    const platformInvestments: any[] = [];
    try {
      const marketplaceRows = await query<any>(`
        SELECT m.*, b.name AS business_name, b.slug AS business_slug,
               b.type_id AS business_type_id, bt.name AS business_type_name,
               target_type.name AS target_type_name
        FROM marketplace_items m
        LEFT JOIN businesses b ON b.id = m.business_id
        LEFT JOIN business_types bt ON bt.id = b.type_id
        LEFT JOIN business_types target_type ON target_type.id = m.target_type_id
        WHERE m.item_type = 'investment'
          AND m.status = 'approved'
          AND m.publish_on_main_portal = 1
        ORDER BY m.is_featured DESC, m.updated_at DESC
        LIMIT 500
      `);

      const marketplaceIds = marketplaceRows.map((item: any) => String(item.id));
      const providersByItem = new Map<string, any[]>();
      if (marketplaceIds.length > 0) {
        try {
          const assignments = await query<any>(`
            SELECT pba.item_id, b.id AS business_id, b.name AS business_name,
                   b.slug AS business_slug, b.type_id AS business_type_id,
                   bt.name AS business_type_name
            FROM package_business_assignments pba
            JOIN businesses b ON b.id = pba.business_id
            LEFT JOIN business_types bt ON bt.id = b.type_id
            WHERE pba.item_id IN (${marketplaceIds.map(() => '?').join(',')})
              AND pba.vendor_acceptance_status IN ('accepted', 'approved')
            ORDER BY pba.created_at ASC
          `, marketplaceIds);
          assignments.forEach((assignment: any) => {
            const key = String(assignment.item_id);
            providersByItem.set(key, [...(providersByItem.get(key) || []), {
              id: String(assignment.business_id),
              name: assignment.business_name,
              slug: assignment.business_slug,
              type_id: assignment.business_type_id,
              type_name: assignment.business_type_name,
            }]);
          });
        } catch {
          // The investment remains public when provider assignments are unavailable.
        }
      }

      marketplaceRows.forEach((item: any) => {
        const providers = providersByItem.get(String(item.id)) || [];
        const ownerBusinessId = item.business_id ? String(item.business_id) : null;
        if (businessFilter && ownerBusinessId !== businessFilter && !providers.some(provider => provider.id === businessFilter)) return;
        if (featuredOnly && !Number(item.is_featured)) return;

        const matchesType = !typeFilter
          || item.target_scope === 'platform'
          || targetTypeIds.has(String(item.target_type_id || ''))
          || businessTypeIds.has(String(item.business_type_id || ''))
          || providers.some(provider => businessTypeIds.has(String(provider.type_id || '')));
        if (!matchesType) return;

        platformInvestments.push({
          id: String(item.id),
          business_id: ownerBusinessId || `siwify-${item.id}`,
          business_name: item.business_name || 'Siwify',
          business_slug: item.business_slug || null,
          owner_type: ownerBusinessId ? 'vendor' : 'platform',
          business_logo: null,
          type_name: item.business_type_name || item.target_type_name || providers[0]?.type_name || null,
          opportunity_title: item.title,
          opportunity_type: item.investment_type || 'equity',
          investment_amount_min: item.investment_amount_min ?? null,
          investment_amount_max: item.investment_amount_max ?? null,
          expected_roi_percent: item.expected_roi_percent ?? null,
          business_stage: item.business_stage || null,
          investment_status: 'open',
          target_investors: item.target_investors ?? null,
          investment_description: item.description || null,
          investment_highlights: item.investment_highlights || null,
          is_featured: Boolean(Number(item.is_featured)),
          contact_for_details: item.booking_cta_type === 'custom_quote',
          investment_contact: item.booking_cta_url || null,
          owner_business_id: ownerBusinessId,
          target_scope: item.target_scope,
          target_type_id: item.target_type_id || null,
          target_type_name: item.target_type_name || null,
          currency: item.currency || 'USD',
          providers: ownerBusinessId && providers.length === 0 ? [{
            id: ownerBusinessId,
            name: item.business_name,
            slug: item.business_slug,
            type_id: item.business_type_id,
            type_name: item.business_type_name,
          }] : providers,
          source: 'platform_marketplace',
        });
      });
    } catch (error) {
      console.warn('Platform investment items are unavailable in discovery:', error);
    }

    const mergedInvestments: any[] = [];
    for (let index = 0; index < Math.max(investments.length, platformInvestments.length); index++) {
      if (platformInvestments[index]) mergedInvestments.push(platformInvestments[index]);
      if (investments[index]) mergedInvestments.push(investments[index]);
    }

    const items = mergedInvestments.slice(0, limit);
    return NextResponse.json({ success: true, count: items.length, items });
  } catch (error: any) {
    console.error('Error fetching investment opportunities:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
