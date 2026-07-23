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

    // Apply limits
    const slicedOffers = offers.slice(0, limit);

    return NextResponse.json({ success: true, count: slicedOffers.length, offers: slicedOffers });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
