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
        JSON_EXTRACT(b.custom_data, '$."discount"') AS discount_data,
        JSON_EXTRACT(b.custom_data, '$."discounts-promotions"') AS legacy_discount_data,
        JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers"') AS type_offer_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active'
        AND (
          JSON_EXTRACT(b.custom_data, '$."discount"') IS NOT NULL
          OR JSON_EXTRACT(b.custom_data, '$."discounts-promotions"') IS NOT NULL
          OR JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers"') IS NOT NULL
        )
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
      const businessLogo = row.logo || null;
      let data = null;
      let legacyDiscountData = null;
      let typeOfferData = null;
      try {
        data = row.discount_data ? (typeof row.discount_data === 'string' ? JSON.parse(row.discount_data) : row.discount_data) : null;
        legacyDiscountData = row.legacy_discount_data ? (typeof row.legacy_discount_data === 'string' ? JSON.parse(row.legacy_discount_data) : row.legacy_discount_data) : null;
        typeOfferData = row.type_offer_data ? (typeof row.type_offer_data === 'string' ? JSON.parse(row.type_offer_data) : row.type_offer_data) : null;
      } catch { return; }

      if (!data && legacyDiscountData) {
        data = legacyDiscountData;
      }

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
                  slot: 3,
                  source: 'studio_slot_3'
                });
              }
            }
          }
        }
      }

      const typeSpecificDiscount = buildTypeSpecificDiscount(typeOfferData, row, businessLogo);
      if (typeSpecificDiscount) {
        if (!featuredOnly || typeOfferData?.is_featured) {
          if (businessFilter || typeOfferData?.visibility_on_main_site !== false) {
            discounts.push(typeSpecificDiscount);
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

function buildTypeSpecificDiscount(typeOfferData: any, row: any, businessLogo: string | null) {
  if (!typeOfferData || typeof typeOfferData !== 'object' || Object.keys(typeOfferData).length === 0) return null;

  const rawDiscounts = typeOfferData.active_discounts || typeOfferData.group_discounts || typeOfferData.shipping_info || null;
  const discountValue = Array.isArray(rawDiscounts)
    ? rawDiscounts.filter(Boolean).join(', ')
    : typeof rawDiscounts === 'string'
      ? rawDiscounts
      : null;

  const descriptionParts: string[] = [];
  if (typeOfferData.special_conditions) descriptionParts.push(typeOfferData.special_conditions);
  if (typeOfferData.active_discounts) descriptionParts.push(`Active Discounts: ${Array.isArray(typeOfferData.active_discounts) ? typeOfferData.active_discounts.join(', ') : typeOfferData.active_discounts}`);
  if (typeOfferData.group_discounts) descriptionParts.push(`Group Discounts: ${typeOfferData.group_discounts}`);
  if (typeOfferData.shipping_info) descriptionParts.push(`Shipping Info: ${typeOfferData.shipping_info}`);
  if (typeOfferData.price_standard) descriptionParts.push(`Standard Rate: ${typeOfferData.price_standard}`);
  if (typeOfferData.avg_meal_price) descriptionParts.push(`Average Meal Price: ${typeOfferData.avg_meal_price}`);

  const description = descriptionParts.filter(Boolean).join(' | ') || null;
  const title = typeOfferData.discount_name || typeOfferData.offer_title || typeOfferData.title || `${row.business_name} Special Rate`;

  if (!title && !description && !discountValue) return null;

  return {
    business_id: `${row.id}-type-discount`,
    business_name: row.business_name,
    business_slug: row.slug,
    business_logo: businessLogo,
    type_name: row.type_name,
    type_icon: row.type_icon,
    discount_name: title,
    discount_type: typeOfferData.offer_type || 'special',
    discount_value: discountValue,
    applies_to: 'all_services',
    min_group_size: typeOfferData.offer_min_guests || null,
    season: 'all_year',
    valid_from: typeOfferData.offer_valid_from || null,
    valid_until: typeOfferData.offer_valid_until || null,
    description,
    promo_code: typeOfferData.offer_cta_link || null,
    discount_status: 'active',
    is_featured: !!typeOfferData.is_featured,
    slot: 0,
    source: 'type_section_rates_offers'
  };
}
