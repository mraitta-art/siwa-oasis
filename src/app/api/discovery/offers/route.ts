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
    const requestedTypeIds = [...new Set(typeFilter.split(',').map(id => id.trim()).filter(Boolean))];
    const businessTypeIds = new Set<string>();
    const targetTypeIds = new Set<string>();

    if (requestedTypeIds.length > 0) {
      const typePlaceholders = requestedTypeIds.map(() => '?').join(',');
      const types = await query(
        `SELECT id, parent_id FROM business_types
         WHERE id IN (${typePlaceholders}) OR parent_id IN (${typePlaceholders})`,
        [...requestedTypeIds, ...requestedTypeIds]
      ) as any[];
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
    }

    // Query active businesses
    let sql = `
      SELECT 
        b.id, 
        b.name AS business_name, 
        b.slug,
        b.subscription_tier AS tier,
        bt.name AS type_name,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".business_logo')) AS logo,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$."business_info".logo')) AS fallback_logo,
        JSON_EXTRACT(b.custom_data, '$."offers-packages"') AS studio_offer_data,
        JSON_EXTRACT(b.custom_data, '$."offers-promotions"') AS offers_promotions_data,
        JSON_EXTRACT(b.custom_data, '$."package"') AS package_data,
        JSON_EXTRACT(b.custom_data, '$.offers_packages') AS legacy_offer_data,
        JSON_EXTRACT(b.custom_data, '$."sec_8_rates_offers"') AS type_offer_data
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active'
    `;

    const params: any[] = [];

    if (typeFilter) {
      const typeIds = [...businessTypeIds];
      sql += ` AND b.type_id IN (${typeIds.map(() => '?').join(',')}) `;
      params.push(...typeIds);
    }

    if (businessFilter) {
      sql += ` AND b.id = ? `;
      params.push(businessFilter);
    }

    sql += ` ORDER BY b.subscription_tier DESC, b.created_at DESC `;

    const rows = await query(sql, params) as any[];

    // Fetch all experience packages from database to merge
    const dbPackages = await query(
      'SELECT * FROM experience_packages WHERE active = 1'
    ) as any[];

    const offers: any[] = [];
    const marketplaceOffers: any[] = [];

    const canonicalProductParams: any[] = [];
    let canonicalProductSql = `
            SELECT tp.*, b.name AS business_name, b.slug AS business_slug,
              b.subscription_tier AS tier, bt.name AS type_name
      FROM tour_products tp
      LEFT JOIN businesses b ON b.id = tp.vendor_business_id
      LEFT JOIN business_types bt ON bt.id = b.type_id
      WHERE tp.is_active = 1
        AND tp.is_public = 1
        AND tp.approval_status IN ('approved', 'published')
        AND (tp.valid_from IS NULL OR tp.valid_from <= CURRENT_DATE())
        AND (tp.valid_until IS NULL OR tp.valid_until >= CURRENT_DATE())
    `;
    if (businessFilter) {
      canonicalProductSql += ' AND tp.vendor_business_id = ?';
      canonicalProductParams.push(businessFilter);
    }
    if (typeFilter) {
      const typeIds = [...businessTypeIds];
      canonicalProductSql += ` AND b.type_id IN (${typeIds.map(() => '?').join(',')})`;
      canonicalProductParams.push(...typeIds);
    }
    canonicalProductSql += ' ORDER BY tp.is_featured DESC, tp.updated_at DESC';

    const canonicalProducts = await query(canonicalProductSql, canonicalProductParams) as any[];
    canonicalProducts.forEach(product => {
      if (featuredOnly && !product.is_featured) return;
      offers.push({
        business_id: product.vendor_business_id || `product-${product.id}`,
        business_name: product.business_name || product.vendor_name || 'Siwa Today',
        business_slug: product.business_slug || null,
        business_logo: product.image_url || null,
        tier: product.tier || null,
        type_name: product.type_name || null,
        title: product.name,
        type: product.product_kind || 'package',
        price: product.base_price_usd || product.base_price_egp || null,
        original_price: product.base_price_usd || product.base_price_egp || null,
        discount: null,
        description: product.description || null,
        inclusions: product.included || null,
        valid_until: product.valid_until || null,
        link: product.business_slug ? `/p/${product.business_slug}` : '/packages',
        image: product.image_url || null,
        is_featured: !!product.is_featured,
        source: 'tour_products_canonical',
        product_id: product.id,
      });
    });

        let canonicalPromotionSql = `
      SELECT promo.*, b.name AS business_name, b.slug AS business_slug,
            b.type_id AS business_type_id, bt.name AS type_name,
            tp.name AS product_name, tp.base_price_usd, tp.base_price_egp
      FROM tour_promotions promo
      LEFT JOIN businesses b ON b.id = promo.vendor_business_id
      LEFT JOIN business_types bt ON bt.id = b.type_id
      LEFT JOIN tour_products tp ON tp.id = promo.product_id
      WHERE promo.is_active = 1
        AND (promo.valid_from IS NULL OR promo.valid_from <= CURRENT_DATE())
        AND (promo.valid_until IS NULL OR promo.valid_until >= CURRENT_DATE())
    `;
    const canonicalPromotionParams: any[] = [];
    if (businessFilter) {
      canonicalPromotionSql += ' AND promo.vendor_business_id = ?';
      canonicalPromotionParams.push(businessFilter);
    }
    if (typeFilter) {
      const typeIds = [...businessTypeIds];
      canonicalPromotionSql += ` AND b.type_id IN (${typeIds.map(() => '?').join(',')})`;
      canonicalPromotionParams.push(...typeIds);
    }
    const canonicalPromotions = await query(canonicalPromotionSql, canonicalPromotionParams) as any[];
    canonicalPromotions.forEach(promotion => {
      if (businessFilter && promotion.vendor_business_id !== businessFilter) return;
      if (featuredOnly) return;
      offers.push({
        business_id: promotion.vendor_business_id || `promotion-${promotion.id}`,
        business_name: promotion.business_name || 'Siwa Today',
        business_slug: promotion.business_slug || null,
        tier: promotion.tier || null,
        type_name: promotion.type_name || null,
        title: promotion.name,
        type: 'offer',
        price: promotion.base_price_usd || promotion.base_price_egp || null,
        original_price: promotion.base_price_usd || promotion.base_price_egp || null,
        discount: `${promotion.discount_value}${promotion.discount_type === 'percent' ? '%' : ''}`,
        description: promotion.conditions || null,
        valid_from: promotion.valid_from || null,
        valid_until: promotion.valid_until || null,
        link: promotion.business_slug ? `/p/${promotion.business_slug}` : '/offers',
        is_featured: false,
        source: 'tour_promotions_canonical',
        promotion_id: promotion.id,
      });
    });

    // Merge admin-created marketplace deals into the same visitor feed.
    // These queries are read-only so discovery never triggers the admin API's schema setup.
    try {
      const marketplaceRows = await query<any>(`
        SELECT m.*, b.name AS business_name, b.slug AS business_slug,
               b.type_id AS business_type_id, bt.name AS business_type_name,
               target_type.name AS target_type_name
        FROM marketplace_items m
        LEFT JOIN businesses b ON b.id = m.business_id
        LEFT JOIN business_types bt ON bt.id = b.type_id
        LEFT JOIN business_types target_type ON target_type.id = m.target_type_id
        WHERE m.status = 'approved' AND m.publish_on_main_portal = 1
          AND m.item_type NOT IN ('investment', 'room', 'transport_service', 'menu_item', 'product', 'trade_product', 'factory_visit')
        ORDER BY m.is_featured DESC, m.updated_at DESC
        LIMIT 500
      `);

      const marketplaceIds = marketplaceRows.map((item: any) => String(item.id));
      const assignmentsByItem = new Map<string, any[]>();
      if (marketplaceIds.length > 0) {
        try {
          const assignmentRows = await query<any>(`
            SELECT pba.item_id, pba.business_role, b.id AS business_id,
                   b.name AS business_name, b.slug AS business_slug,
                   b.type_id AS business_type_id, bt.name AS business_type_name
            FROM package_business_assignments pba
            JOIN businesses b ON b.id = pba.business_id
            LEFT JOIN business_types bt ON bt.id = b.type_id
            WHERE pba.item_id IN (${marketplaceIds.map(() => '?').join(',')})
              AND pba.vendor_acceptance_status IN ('accepted', 'approved')
            ORDER BY pba.created_at ASC
          `, marketplaceIds);
          assignmentRows.forEach((assignment: any) => {
            const key = String(assignment.item_id);
            assignmentsByItem.set(key, [...(assignmentsByItem.get(key) || []), {
              id: String(assignment.business_id),
              name: assignment.business_name,
              slug: assignment.business_slug,
              type_id: assignment.business_type_id,
              type_name: assignment.business_type_name,
              role: assignment.business_role,
            }]);
          });
        } catch {
          // Items remain discoverable if the optional assignment table is unavailable.
        }
      }

      marketplaceRows.forEach((item: any) => {
        const providers = assignmentsByItem.get(String(item.id)) || [];
        const ownerBusinessId = item.business_id ? String(item.business_id) : null;
        if (businessFilter && ownerBusinessId !== businessFilter && !providers.some(provider => provider.id === businessFilter)) return;
        if (featuredOnly && !item.is_featured) return;

        const matchesType = !typeFilter
          || item.target_scope === 'platform'
          || targetTypeIds.has(String(item.target_type_id || ''))
          || businessTypeIds.has(String(item.business_type_id || ''))
          || providers.some(provider => businessTypeIds.has(String(provider.type_id || '')));
        if (!matchesType) return;

        const media = typeof item.media === 'string' ? JSON.parse(item.media || '[]') : item.media;
        const firstImage = Array.isArray(media) ? media.find((entry: any) => entry?.url)?.url : null;
        const discountPercent = Number(item.discount_percentage) || 0;
        const ownerIsPlatform = !ownerBusinessId;
        const itemType = item.item_type || 'package';

        marketplaceOffers.push({
          id: item.id,
          business_id: ownerBusinessId || 'siwify-platform',
          business_name: item.business_name || 'Siwify',
          business_slug: item.business_slug || null,
          business_type_id: item.business_type_id || null,
          business_logo: null,
          owner_type: ownerIsPlatform ? 'platform' : 'vendor',
          type_name: item.business_type_name || item.target_type_name || null,
          title: item.title,
          type: itemType === 'discount_offer' ? 'discount' : itemType,
          item_type: itemType,
          price: item.price_amount || null,
          original_price: item.original_price || null,
          discount: discountPercent > 0 ? `${discountPercent}%` : item.coupon_code || null,
          description: item.description || null,
          inclusions: item.included_features || null,
          link: item.business_slug ? `/p/${item.business_slug}` : '/offers',
          image: firstImage,
          is_featured: !!item.is_featured,
          source: 'admin_marketplace',
          target_scope: item.target_scope,
          target_type_id: item.target_type_id || null,
          target_type_name: item.target_type_name || null,
          category_id: item.category_id || null,
          category_specs: (() => {
            try { return typeof item.category_specs === 'string' ? JSON.parse(item.category_specs) : item.category_specs || {}; }
            catch { return {}; }
          })(),
          itinerary: (() => {
            try { return typeof item.itinerary === 'string' ? JSON.parse(item.itinerary) : item.itinerary || []; }
            catch { return []; }
          })(),
          providers: ownerBusinessId && providers.length === 0 ? [{
            id: ownerBusinessId,
            name: item.business_name,
            slug: item.business_slug,
            type_id: item.business_type_id,
            type_name: item.business_type_name,
          }] : providers,
        });
      });
    } catch (error) {
      console.warn('Admin marketplace items are unavailable in discovery:', error);
    }

    function buildTypeSpecificOffer(typeOfferData: any, row: any, businessLogo: string | null) {
      if (!typeOfferData || typeof typeOfferData !== 'object' || Object.keys(typeOfferData).length === 0) return null;

      const rawDiscounts = typeOfferData.active_discounts || typeOfferData.group_discounts || typeOfferData.discount || typeOfferData.discount_pct || null;
      const discount = Array.isArray(rawDiscounts)
        ? rawDiscounts.filter(Boolean).join(', ')
        : typeof rawDiscounts === 'string'
          ? rawDiscounts
          : null;

      const descriptionParts: string[] = [];
      if (typeOfferData.offer_description) descriptionParts.push(typeOfferData.offer_description);
      if (typeOfferData.special_conditions) descriptionParts.push(typeOfferData.special_conditions);
      if (typeOfferData.group_discounts) descriptionParts.push(`Group Discounts: ${typeOfferData.group_discounts}`);
      if (typeOfferData.shipping_info) descriptionParts.push(`Shipping Info: ${typeOfferData.shipping_info}`);
      if (typeOfferData.active_discounts && !Array.isArray(typeOfferData.active_discounts)) descriptionParts.push(typeOfferData.active_discounts);

      const description = descriptionParts.filter(Boolean).join(' | ') || null;
      const price = typeOfferData.price_standard || typeOfferData.avg_meal_price || typeOfferData.offer_price || typeOfferData.price || null;
      const title = typeOfferData.offer_title || typeOfferData.title || typeOfferData.name || `${row.business_name} Rates & Offers`;

      if (!title && !price && !description && !discount) return null;

      return {
        business_id: `${row.id}-type-rates`,
        business_name: row.business_name,
        business_slug: row.slug,
        business_logo: businessLogo,
        tier: row.tier,
        type_name: row.type_name,
        title,
        type: 'special_offer',
        price,
        original_price: null,
        discount,
        description,
        inclusions: typeOfferData.offer_inclusions || null,
        valid_from: typeOfferData.offer_valid_from || null,
        valid_until: typeOfferData.offer_valid_until || null,
        min_guests: typeOfferData.offer_min_guests || null,
        max_guests: typeOfferData.offer_max_guests || null,
        link: typeOfferData.offer_cta_link || typeOfferData.link || `/p/${row.slug}`,
        image: typeOfferData.offer_image || null,
        is_featured: !!typeOfferData.is_featured,
        source: 'type_section_rates_offers'
      };
    }

    rows.forEach(row => {
      let studioData = null;
      let offersPromotionsData = null;
      let packageData = null;
      let legacyData = null;
      let typeOfferData = null;

      try {
        studioData = row.studio_offer_data ? (typeof row.studio_offer_data === 'string' ? JSON.parse(row.studio_offer_data) : row.studio_offer_data) : null;
        offersPromotionsData = row.offers_promotions_data ? (typeof row.offers_promotions_data === 'string' ? JSON.parse(row.offers_promotions_data) : row.offers_promotions_data) : null;
        packageData = row.package_data ? (typeof row.package_data === 'string' ? JSON.parse(row.package_data) : row.package_data) : null;
        legacyData = row.legacy_offer_data ? (typeof row.legacy_offer_data === 'string' ? JSON.parse(row.legacy_offer_data) : row.legacy_offer_data) : null;
        typeOfferData = row.type_offer_data ? (typeof row.type_offer_data === 'string' ? JSON.parse(row.type_offer_data) : row.type_offer_data) : null;
      } catch (e) {
        console.error('Error parsing JSON offers for business:', row.id);
      }

      const businessLogo = row.logo || row.fallback_logo || null;

      // ────────────────────────────────────────────────────────────────
      // 1. SLOT 1 (Studio offers, new offers/promotions, or packages)
      // ────────────────────────────────────────────────────────────────
      if (studioData && studioData.offer_title) {
        if (!featuredOnly || studioData.is_featured) {
          if (businessFilter || studioData.visibility_on_main_site !== false) {
            offers.push({
              business_id: row.id,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: studioData.offer_title,
              type: studioData.offer_type || 'special_offer',
              price: studioData.offer_price || null,
              original_price: studioData.offer_original_price || null,
              discount: studioData.offer_discount || null,
              description: studioData.offer_description || null,
              inclusions: studioData.offer_inclusions || null,
              valid_from: studioData.offer_valid_from || null,
              valid_until: studioData.offer_valid_until || null,
              min_guests: studioData.offer_min_guests || null,
              max_guests: studioData.offer_max_guests || null,
              link: studioData.offer_cta_link || `/p/${row.slug}`,
              image: studioData.offer_image || null,
              is_featured: !!studioData.is_featured,
              source: 'studio_slot_1'
            });
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // 2. SLOT 2 (Universal section)
      // ────────────────────────────────────────────────────────────────
      if (studioData && studioData.offer_title_2) {
        if (!featuredOnly || studioData.is_featured_2) {
          if (businessFilter || studioData.visibility_on_main_site_2 !== false) {
            offers.push({
              business_id: `${row.id}-slot-2`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: studioData.offer_title_2,
              type: studioData.offer_type_2 || 'special_offer',
              price: studioData.offer_price_2 || null,
              original_price: studioData.offer_original_price_2 || null,
              discount: studioData.offer_discount_2 || null,
              description: studioData.offer_description_2 || null,
              inclusions: studioData.offer_inclusions_2 || null,
              valid_from: studioData.offer_valid_from_2 || null,
              valid_until: studioData.offer_valid_until_2 || null,
              min_guests: studioData.offer_min_guests_2 || null,
              max_guests: studioData.offer_max_guests_2 || null,
              link: studioData.offer_cta_link_2 || `/p/${row.slug}`,
              image: studioData.offer_image_2 || null,
              is_featured: !!studioData.is_featured_2,
              source: 'studio_slot_2'
            });
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // 3. SLOT 3 (Universal section)
      // ────────────────────────────────────────────────────────────────
      if (studioData && studioData.offer_title_3) {
        if (!featuredOnly || studioData.is_featured_3) {
          if (businessFilter || studioData.visibility_on_main_site_3 !== false) {
            offers.push({
              business_id: `${row.id}-slot-3`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: studioData.offer_title_3,
              type: studioData.offer_type_3 || 'special_offer',
              price: studioData.offer_price_3 || null,
              original_price: studioData.offer_original_price_3 || null,
              discount: studioData.offer_discount_3 || null,
              description: studioData.offer_description_3 || null,
              inclusions: studioData.offer_inclusions_3 || null,
              valid_from: studioData.offer_valid_from_3 || null,
              valid_until: studioData.offer_valid_until_3 || null,
              min_guests: studioData.offer_min_guests_3 || null,
              max_guests: studioData.offer_max_guests_3 || null,
              link: studioData.offer_cta_link_3 || `/p/${row.slug}`,
              image: studioData.offer_image_3 || null,
              is_featured: !!studioData.is_featured_3,
              source: 'studio_slot_3'
            });
          }
        }
      }

      if (offersPromotionsData && offersPromotionsData.offer_title) {
        if (!featuredOnly || offersPromotionsData.is_featured) {
          if (businessFilter || offersPromotionsData.visibility_on_main_site !== false) {
            offers.push({
              business_id: row.id,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: offersPromotionsData.offer_title,
              type: offersPromotionsData.offer_type || 'special_offer',
              price: offersPromotionsData.offer_price || null,
              original_price: offersPromotionsData.offer_original_price || null,
              discount: offersPromotionsData.offer_discount || null,
              description: offersPromotionsData.offer_description || null,
              inclusions: offersPromotionsData.offer_inclusions || null,
              valid_from: offersPromotionsData.offer_valid_from || null,
              valid_until: offersPromotionsData.offer_valid_until || null,
              min_guests: offersPromotionsData.offer_min_guests || null,
              max_guests: offersPromotionsData.offer_max_guests || null,
              link: offersPromotionsData.offer_cta_link || `/p/${row.slug}`,
              image: offersPromotionsData.offer_image || null,
              is_featured: !!offersPromotionsData.is_featured,
              source: 'offers_promotions_slot_1'
            });
          }
        }
      }

      if (offersPromotionsData && offersPromotionsData.offer_title_2) {
        if (!featuredOnly || offersPromotionsData.is_featured_2) {
          if (businessFilter || offersPromotionsData.visibility_on_main_site_2 !== false) {
            offers.push({
              business_id: `${row.id}-offers-promo-slot-2`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: offersPromotionsData.offer_title_2,
              type: offersPromotionsData.offer_type_2 || 'special_offer',
              price: offersPromotionsData.offer_price_2 || null,
              original_price: offersPromotionsData.offer_original_price_2 || null,
              discount: offersPromotionsData.offer_discount_2 || null,
              description: offersPromotionsData.offer_description_2 || null,
              inclusions: offersPromotionsData.offer_inclusions_2 || null,
              valid_from: offersPromotionsData.offer_valid_from_2 || null,
              valid_until: offersPromotionsData.offer_valid_until_2 || null,
              min_guests: offersPromotionsData.offer_min_guests_2 || null,
              max_guests: offersPromotionsData.offer_max_guests_2 || null,
              link: offersPromotionsData.offer_cta_link_2 || `/p/${row.slug}`,
              image: offersPromotionsData.offer_image_2 || null,
              is_featured: !!offersPromotionsData.is_featured_2,
              source: 'offers_promotions_slot_2'
            });
          }
        }
      }

      if (offersPromotionsData && offersPromotionsData.offer_title_3) {
        if (!featuredOnly || offersPromotionsData.is_featured_3) {
          if (businessFilter || offersPromotionsData.visibility_on_main_site_3 !== false) {
            offers.push({
              business_id: `${row.id}-offers-promo-slot-3`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: offersPromotionsData.offer_title_3,
              type: offersPromotionsData.offer_type_3 || 'special_offer',
              price: offersPromotionsData.offer_price_3 || null,
              original_price: offersPromotionsData.offer_original_price_3 || null,
              discount: offersPromotionsData.offer_discount_3 || null,
              description: offersPromotionsData.offer_description_3 || null,
              inclusions: offersPromotionsData.offer_inclusions_3 || null,
              valid_from: offersPromotionsData.offer_valid_from_3 || null,
              valid_until: offersPromotionsData.offer_valid_until_3 || null,
              min_guests: offersPromotionsData.offer_min_guests_3 || null,
              max_guests: offersPromotionsData.offer_max_guests_3 || null,
              link: offersPromotionsData.offer_cta_link_3 || `/p/${row.slug}`,
              image: offersPromotionsData.offer_image_3 || null,
              is_featured: !!offersPromotionsData.is_featured_3,
              source: 'offers_promotions_slot_3'
            });
          }
        }
      }

      if (packageData && packageData.offer_title) {
        if (!featuredOnly || packageData.is_featured) {
          if (businessFilter || packageData.visibility_on_main_site !== false) {
            offers.push({
              business_id: `${row.id}-package-slot-1`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: packageData.offer_title,
              type: packageData.offer_type || 'package',
              price: packageData.offer_price || null,
              original_price: packageData.offer_original_price || null,
              discount: packageData.offer_discount || null,
              description: packageData.offer_description || null,
              inclusions: packageData.offer_inclusions || null,
              valid_from: packageData.offer_valid_from || null,
              valid_until: packageData.offer_valid_until || null,
              min_guests: packageData.offer_min_guests || null,
              max_guests: packageData.offer_max_guests || null,
              link: packageData.offer_cta_link || `/p/${row.slug}`,
              image: packageData.offer_image || null,
              is_featured: !!packageData.is_featured,
              source: 'package_slot_1'
            });
          }
        }
      }

      if (packageData && packageData.offer_title_2) {
        if (!featuredOnly || packageData.is_featured_2) {
          if (businessFilter || packageData.visibility_on_main_site_2 !== false) {
            offers.push({
              business_id: `${row.id}-package-slot-2`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: packageData.offer_title_2,
              type: packageData.offer_type_2 || 'package',
              price: packageData.offer_price_2 || null,
              original_price: packageData.offer_original_price_2 || null,
              discount: packageData.offer_discount_2 || null,
              description: packageData.offer_description_2 || null,
              inclusions: packageData.offer_inclusions_2 || null,
              valid_from: packageData.offer_valid_from_2 || null,
              valid_until: packageData.offer_valid_until_2 || null,
              min_guests: packageData.offer_min_guests_2 || null,
              max_guests: packageData.offer_max_guests_2 || null,
              link: packageData.offer_cta_link_2 || `/p/${row.slug}`,
              image: packageData.offer_image_2 || null,
              is_featured: !!packageData.is_featured_2,
              source: 'package_slot_2'
            });
          }
        }
      }

      if (packageData && packageData.offer_title_3) {
        if (!featuredOnly || packageData.is_featured_3) {
          if (businessFilter || packageData.visibility_on_main_site_3 !== false) {
            offers.push({
              business_id: `${row.id}-package-slot-3`,
              business_name: row.business_name,
              business_slug: row.slug,
              business_logo: businessLogo,
              tier: row.tier,
              type_name: row.type_name,
              title: packageData.offer_title_3,
              type: packageData.offer_type_3 || 'package',
              price: packageData.offer_price_3 || null,
              original_price: packageData.offer_original_price_3 || null,
              discount: packageData.offer_discount_3 || null,
              description: packageData.offer_description_3 || null,
              inclusions: packageData.offer_inclusions_3 || null,
              valid_from: packageData.offer_valid_from_3 || null,
              valid_until: packageData.offer_valid_until_3 || null,
              min_guests: packageData.offer_min_guests_3 || null,
              max_guests: packageData.offer_max_guests_3 || null,
              link: packageData.offer_cta_link_3 || `/p/${row.slug}`,
              image: packageData.offer_image_3 || null,
              is_featured: !!packageData.is_featured_3,
              source: 'package_slot_3'
            });
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // 4. LEGACY OFFERS
      // ────────────────────────────────────────────────────────────────
      if (!studioData && !offersPromotionsData && !packageData && legacyData && (legacyData.offers_packages_offer_title || legacyData.offer_title)) {
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
          original_price: legacyData.offers_packages_offer_original_price || null,
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
      // 5. TYPE-SPECIFIC OFFER SECTION
      // ────────────────────────────────────────────────────────────────
      const typeSpecificOffer = buildTypeSpecificOffer(typeOfferData, row, businessLogo);
      if (typeSpecificOffer) {
        if (!featuredOnly || typeOfferData.is_featured) {
          if (businessFilter || typeOfferData.visibility_on_main_site !== false) {
            offers.push(typeSpecificOffer);
          }
        }
      }

      // ────────────────────────────────────────────────────────────────
      // 6. EXPERIENCE PACKAGES DATABASE MERGE
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

    // Interleave both sources so one large catalog cannot crowd out the other.
    const mergedOffers: any[] = [];
    for (let index = 0; index < Math.max(offers.length, marketplaceOffers.length); index++) {
      if (marketplaceOffers[index]) mergedOffers.push(marketplaceOffers[index]);
      if (offers[index]) mergedOffers.push(offers[index]);
    }

    const slicedOffers = mergedOffers.slice(0, limit);

    return NextResponse.json({ success: true, count: slicedOffers.length, offers: slicedOffers });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
