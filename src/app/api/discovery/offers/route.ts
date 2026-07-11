import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/discovery/offers
 * Collects offers & packages from ALL businesses that have filled
 * either the new 'offers-packages' universal section (supporting Slot 1, Slot 2, Slot 3),
 * the legacy 'offers_packages' key, OR from the experience_packages database table.
 * 
 * Query params:
 *   ?type=<type_id>     — filter by business type / category
 *   ?business=<biz_id>  — filter by specific business (minisite view)
 *   ?featured=true      — only featured
 *   ?limit=50           — max results
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const typeFilter = searchParams.get('type') || '';
    const businessFilter = searchParams.get('business') || '';
    const featuredOnly = searchParams.get('featured') === 'true';

    // Query active businesses
    let sql = `
      SELECT 
        b.id, 
        b.name AS business_name, 
        b.slug,
        b.tier,
        bt.name AS type_name,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".business_logo')) AS logo,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".logo')) AS fallback_logo,
        JSON_EXTRACT(b.custom_data, '$."offers-packages"') AS new_offer_data,
        JSON_EXTRACT(b.custom_data, '$.offers_packages') AS legacy_offer_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active'
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

    sql += ` ORDER BY b.tier DESC, b.created_at DESC `;

    const rows = await query(sql, params) as any[];

    // Fetch all experience packages from database to merge
    const dbPackages = await query(
      'SELECT * FROM experience_packages WHERE active = 1'
    ) as any[];

    const offers: any[] = [];

    rows.forEach(row => {
      let data = null;
      let legacyData = null;

      try {
        data = row.new_offer_data ? (typeof row.new_offer_data === 'string' ? JSON.parse(row.new_offer_data) : row.new_offer_data) : null;
        legacyData = row.legacy_offer_data ? (typeof row.legacy_offer_data === 'string' ? JSON.parse(row.legacy_offer_data) : row.legacy_offer_data) : null;
      } catch (e) {
        console.error('Error parsing JSON offers for business:', row.id);
      }

      const businessLogo = row.logo || row.fallback_logo || null;

      // ────────────────────────────────────────────────────────────────
      // 1. SLOT 1 (Universal section)
      // ────────────────────────────────────────────────────────────────
      if (data && data.offer_title) {
        if (!featuredOnly || data.is_featured) {
          if (businessFilter || data.visibility_on_main_site !== false) {
            offers.push({
              business_id: row.id,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: data.offer_title,
              type: data.offer_type || 'special_offer',
              price: data.offer_price || null,
              original_price: data.offer_original_price || null,
              discount: data.offer_discount || null,
              description: data.offer_description || null,
              inclusions: data.offer_inclusions || null,
              valid_from: data.offer_valid_from || null,
              valid_until: data.offer_valid_until || null,
              min_guests: data.offer_min_guests || null,
              max_guests: data.offer_max_guests || null,
              link: data.offer_cta_link || `/p/${row.slug}`,
              image: data.offer_image || null,
              is_featured: !!data.is_featured,
              source: 'studio_slot_1'
            });
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // 2. SLOT 2 (Universal section)
      // ────────────────────────────────────────────────────────────────
      if (data && data.offer_title_2) {
        if (!featuredOnly || data.is_featured_2) {
          if (businessFilter || data.visibility_on_main_site_2 !== false) {
            offers.push({
              business_id: `${row.id}-slot-2`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: data.offer_title_2,
              type: data.offer_type_2 || 'special_offer',
              price: data.offer_price_2 || null,
              original_price: data.offer_original_price_2 || null,
              discount: data.offer_discount_2 || null,
              description: data.offer_description_2 || null,
              inclusions: data.offer_inclusions_2 || null,
              valid_from: data.offer_valid_from_2 || null,
              valid_until: data.offer_valid_until_2 || null,
              min_guests: data.offer_min_guests_2 || null,
              max_guests: data.offer_max_guests_2 || null,
              link: data.offer_cta_link_2 || `/p/${row.slug}`,
              image: data.offer_image_2 || null,
              is_featured: !!data.is_featured_2,
              source: 'studio_slot_2'
            });
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // 3. SLOT 3 (Universal section)
      // ────────────────────────────────────────────────────────────────
      if (data && data.offer_title_3) {
        if (!featuredOnly || data.is_featured_3) {
          if (businessFilter || data.visibility_on_main_site_3 !== false) {
            offers.push({
              business_id: `${row.id}-slot-3`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: data.offer_title_3,
              type: data.offer_type_3 || 'special_offer',
              price: data.offer_price_3 || null,
              original_price: data.offer_original_price_3 || null,
              discount: data.offer_discount_3 || null,
              description: data.offer_description_3 || null,
              inclusions: data.offer_inclusions_3 || null,
              valid_from: data.offer_valid_from_3 || null,
              valid_until: data.offer_valid_until_3 || null,
              min_guests: data.offer_min_guests_3 || null,
              max_guests: data.offer_max_guests_3 || null,
              link: data.offer_cta_link_3 || `/p/${row.slug}`,
              image: data.offer_image_3 || null,
              is_featured: !!data.is_featured_3,
              source: 'studio_slot_3'
            });
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // 4. LEGACY OFFERS
      // ────────────────────────────────────────────────────────────────
      if (!data && legacyData && (legacyData.offers_packages_offer_title || legacyData.offer_title)) {
        const legacyTitle = legacyData.offers_packages_offer_title || legacyData.offer_title;
        offers.push({
          business_id: `${row.id}-legacy`,
          business_name: row.business_name,
          business_slug: row.slug,
          business_logo: businessLogo,
          tier: row.tier,
          type_name: row.type_name,
          title: legacyTitle,
          type: legacyData.offer_type || 'special_offer',
          price: legacyData.offers_packages_offer_price || legacyData.offer_price || null,
          original_price: legacyData.offer_original_price || null,
          discount: legacyData.offers_packages_offer_discount || legacyData.offer_discount || null,
          description: legacyData.offers_packages_offer_description || legacyData.offer_description || null,
          inclusions: legacyData.offers_packages_offer_inclusions || legacyData.offer_inclusions || null,
          valid_until: legacyData.offers_packages_offer_expiry || legacyData.offer_valid_until || null,
          link: legacyData.offers_packages_offer_cta_link || legacyData.offer_cta_link || `/p/${row.slug}`,
          image: legacyData.offers_packages_offer_image || legacyData.offer_image || null,
          is_featured: !!legacyData.is_featured,
          source: 'legacy_data'
        });
      }

      // ────────────────────────────────────────────────────────────────
      // 5. EXPERIENCE PACKAGES DATABASE MERGE
      // ────────────────────────────────────────────────────────────────
      const linkedDbPkgs = dbPackages.filter(pkg => {
        try {
          const bizIds = typeof pkg.business_ids === 'string' ? JSON.parse(pkg.business_ids) : pkg.business_ids;
          return Array.isArray(bizIds) && bizIds.includes(row.id);
        } catch { return false; }
      });

      linkedDbPkgs.forEach(pkg => {
        let price = null;
        try {
          const pricing = typeof pkg.pricing === 'string' ? JSON.parse(pkg.pricing) : pkg.pricing;
          price = pricing?.price || pricing?.base_price || null;
        } catch {}

        offers.push({
          business_id: `pkg-${pkg.id}`,
          business_name: row.business_name,
          business_slug: row.slug,
          business_logo: businessLogo,
          tier: row.tier,
          type_name: row.type_name,
          title: pkg.name,
          type: 'package',
          price: price,
          description: pkg.description,
          link: `/p/${row.slug}`,
          is_featured: false,
          source: 'experience_packages_db'
        });
      });
    });

    // Apply limits
    const slicedOffers = offers.slice(0, limit);

    return NextResponse.json({ success: true, count: slicedOffers.length, offers: slicedOffers });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
