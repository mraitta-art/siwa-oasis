import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSectionBridge } from '@/lib/section-mainsite-bridge';
import { CANONICAL_SECTION_LABELS } from '@/lib/minisite-governance-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId  = searchParams.get('section') || 'sec_1_identity';
    const category   = (searchParams.get('category') || '').trim();
    const search     = (searchParams.get('search') || '').trim();
    const limit      = Math.min(parseInt(searchParams.get('limit') || '60', 10), 120);

    const bridge      = getSectionBridge(sectionId);
    const sectionMeta = CANONICAL_SECTION_LABELS[sectionId] ?? null;

    if (!bridge) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    let filterWhere = '';
    const filterArgs: string[] = [];

    // Typology / Category Parent-Child Filtering
    if (category) {
      const catLower = category.toLowerCase();
      const categoryAliases: Record<string, string> = {
        accommodations: 'accommodation',
        restaurants: 'food',
        restaurant: 'food',
        food: 'food',
        activities: 'adventure',
        activity: 'adventure',
        transportation: 'logistics',
        transportations: 'logistics',
        'production-trade': 'agriculture_industry',
        services: 'services_professional',
        journeys: 'adventure',
      };
      const typeId = categoryAliases[catLower] || catLower;
      const requestedTypeIds = typeId.split(',').map(id => id.trim().toLowerCase()).filter(Boolean);
      const typePlaceholders = requestedTypeIds.map(() => '?').join(',');
      const typeRows = await query<any>(
        `SELECT id FROM business_types
         WHERE LOWER(id) IN (${typePlaceholders}) OR LOWER(parent_id) IN (${typePlaceholders})`,
        [...requestedTypeIds, ...requestedTypeIds]
      ).catch(() => []);

      if (typeRows.length > 0) {
        filterWhere += ` AND LOWER(bt.id) IN (${typeRows.map(() => '?').join(',')})`;
        filterArgs.push(...typeRows.map((type: any) => String(type.id).toLowerCase()));
      } else if (catLower.includes('craft') || catLower.includes('wellness') || catLower.includes('spa')) {
        filterWhere += ` AND (LOWER(bt.id) IN ('sand_bath', 'crafts', 'wellness', 'herb', 'dates', 'olive_oil', 'salt_lamp') OR LOWER(bt.name) LIKE '%wellness%' OR LOWER(bt.name) LIKE '%craft%' OR LOWER(bt.name) LIKE '%bath%' OR LOWER(bt.name) LIKE '%spa%')`;
      } else if (catLower.includes('accommodat') || catLower.includes('hotel') || catLower.includes('camp') || catLower.includes('lodge')) {
        filterWhere += ` AND (LOWER(bt.id) IN ('hotel', 'camps', 'siwa_retreat', 'lodge', 'resort') OR LOWER(bt.name) LIKE '%hotel%' OR LOWER(bt.name) LIKE '%camp%' OR LOWER(bt.name) LIKE '%retreat%' OR LOWER(bt.name) LIKE '%lodge%')`;
      } else if (catLower.includes('restaurant') || catLower.includes('food') || catLower.includes('dining') || catLower.includes('cafe')) {
        filterWhere += ` AND (LOWER(bt.id) IN ('restaurant', 'cafe', 'kitchen', 'food') OR LOWER(bt.name) LIKE '%restaurant%' OR LOWER(bt.name) LIKE '%cafe%' OR LOWER(bt.name) LIKE '%dining%')`;
      } else if (catLower.includes('tour') || catLower.includes('package') || catLower.includes('travel') || catLower.includes('safari')) {
        filterWhere += ` AND (LOWER(bt.id) IN ('travel_agency', 'tour_operator', 'safari', 'guide') OR LOWER(bt.name) LIKE '%travel%' OR LOWER(bt.name) LIKE '%tour%' OR LOWER(bt.name) LIKE '%safari%')`;
      } else {
        filterWhere += ` AND (LOWER(bt.id) = ? OR LOWER(bt.name) LIKE ?)`;
        filterArgs.push(catLower, `%${catLower}%`);
      }
    }

    const hasSearch   = search.length > 0;
    const searchWhere = `${filterWhere} ${hasSearch ? `AND (b.name LIKE ? OR bt.name LIKE ?)` : ''}`;
    const searchArgs: string[] = hasSearch ? [...filterArgs, `%${search}%`, `%${search}%`] : filterArgs;

    let vendors: any[] = [];


    // ─── Per-section aggregation SQL ─────────────────────────────────────────

    switch (sectionId) {

      // Programs & Packages — tour_products (is_active = 1) or experience_packages
      case 'sec_5_experiences': {
        try {
          const rawBiz = await query<any>(
            `SELECT b.*, bt.name AS type_name FROM businesses b
             LEFT JOIN business_types bt ON b.type_id = bt.id
             WHERE b.slug IS NOT NULL ${searchWhere}
             ORDER BY b.is_trusted DESC, b.name ASC
             LIMIT ?`,
            [...searchArgs, limit]
          );

          const productRows = await query<any>(
            `SELECT vendor_business_id, image_url, price FROM tour_products WHERE is_active = 1`
          ).catch(() => []);

          const expRows = await query<any>(
            `SELECT id, name, pricing, cover_image, business_ids FROM experience_packages WHERE active = 1`
          ).catch(() => []);

          vendors = (rawBiz || []).map((b: any) => {
            const bizProducts = (productRows || []).filter((p: any) => String(p.vendor_business_id) === String(b.id));
            const bizExps = (expRows || []).filter((e: any) => {
              try {
                const bids = typeof e.business_ids === 'string' ? JSON.parse(e.business_ids) : e.business_ids;
                return Array.isArray(bids) && bids.map(String).includes(String(b.id));
              } catch { return false; }
            });

            const totalItems = bizProducts.length + bizExps.length;
            const parsedCustom = typeof b.custom_data === 'string' ? JSON.parse(b.custom_data) : (b.custom_data || {});
            const identity = { ...(parsedCustom.basic || {}), ...(parsedCustom.sec_1_identity || {}), ...(parsedCustom.business_info || {}) };

            const prices = bizProducts.map((p: any) => Number(p.price)).filter((n: number) => !isNaN(n) && n > 0);
            const minP = prices.length > 0 ? Math.min(...prices) : null;
            const maxP = prices.length > 0 ? Math.max(...prices) : null;

            return {
              id: b.id,
              name: b.name,
              slug: b.slug,
              logo_url: identity.business_logo || identity.logo || b.logo_url || null,
              cover_image: identity.cover_image || b.cover_image || null,
              is_trusted: b.is_trusted || false,
              type_name: b.type_name,
              vendor_whatsapp: identity.whatsapp || b.vendor_whatsapp || b.phone || null,
              vendor_phone: identity.phone || b.vendor_phone || b.phone || null,
              item_count: totalItems,
              section_image: bizProducts[0]?.image_url || bizExps[0]?.cover_image || null,
              min_price: minP,
              max_price: maxP,
              max_discount: null,
            };
          });
        } catch (e) {
          console.error('[sec_5_experiences fallback error]', e);
          vendors = [];
        }
        break;
      }

      // Special Offers & Deals
      case 'sec_8_connector': {
        try {
          const rawBiz = await query<any>(
            `SELECT b.*, bt.name AS type_name FROM businesses b
             LEFT JOIN business_types bt ON b.type_id = bt.id
             WHERE b.slug IS NOT NULL ${searchWhere}
             ORDER BY b.is_trusted DESC, b.name ASC
             LIMIT ?`,
            [...searchArgs, limit]
          );

          const offerRows = await query<any>(
            `SELECT vendor_business_id, image_url, price, discount_percent FROM tour_products 
             WHERE is_active = 1 AND (discount_percent > 0 OR is_featured = 1)`
          ).catch(() => []);

          vendors = (rawBiz || []).map((b: any) => {
            const bizOffers = (offerRows || []).filter((o: any) => String(o.vendor_business_id) === String(b.id));
            const parsedCustom = typeof b.custom_data === 'string' ? JSON.parse(b.custom_data) : (b.custom_data || {});
            const identity = { ...(parsedCustom.basic || {}), ...(parsedCustom.sec_1_identity || {}), ...(parsedCustom.business_info || {}) };

            const discounts = bizOffers.map((o: any) => Number(o.discount_percent)).filter((d: number) => !isNaN(d) && d > 0);
            const maxD = discounts.length > 0 ? Math.max(...discounts) : null;

            return {
              id: b.id,
              name: b.name,
              slug: b.slug,
              logo_url: identity.business_logo || identity.logo || b.logo_url || null,
              cover_image: identity.cover_image || b.cover_image || null,
              is_trusted: b.is_trusted || false,
              type_name: b.type_name,
              vendor_whatsapp: identity.whatsapp || b.vendor_whatsapp || b.phone || null,
              vendor_phone: identity.phone || b.vendor_phone || b.phone || null,
              item_count: bizOffers.length,
              section_image: bizOffers[0]?.image_url || null,
              min_price: bizOffers[0]?.price || null,
              max_price: null,
              max_discount: maxD,
            };
          });
        } catch (e) {
          console.error('[sec_8_connector fallback error]', e);
          vendors = [];
        }
        break;
      }

      // Default & other sections: Vibe, Facilities, Dining, Services, etc.
      default: {
        try {
          const rawBiz = await query<any>(
            `SELECT b.*, bt.name AS type_name FROM businesses b
             LEFT JOIN business_types bt ON b.type_id = bt.id
             WHERE b.slug IS NOT NULL ${searchWhere}
             ORDER BY b.is_trusted DESC, b.name ASC
             LIMIT ?`,
            [...searchArgs, limit]
          );

          vendors = (rawBiz || []).map((b: any) => {
            const parsedCustom = typeof b.custom_data === 'string' ? JSON.parse(b.custom_data) : (b.custom_data || {});
            const identity = { ...(parsedCustom.basic || {}), ...(parsedCustom.sec_1_identity || {}), ...(parsedCustom.business_info || {}) };

            return {
              id: b.id,
              name: b.name,
              slug: b.slug,
              logo_url: identity.business_logo || identity.logo || b.logo_url || null,
              cover_image: identity.cover_image || b.cover_image || null,
              is_trusted: b.is_trusted || false,
              type_name: b.type_name,
              vendor_whatsapp: identity.whatsapp || b.vendor_whatsapp || b.phone || null,
              vendor_phone: identity.phone || b.vendor_phone || b.phone || null,
              item_count: 0,
              section_image: identity.cover_image || b.cover_image || null,
              min_price: null,
              max_price: null,
              max_discount: null,
            };
          });
        } catch (e) {
          console.error('[section-vendors default error]', e);
          vendors = [];
        }
        break;
      }
    }


    return NextResponse.json({
      vendors: vendors || [],
      sectionMeta,
      bridge: {
        label:           bridge.label,
        mainSiteMirror:  bridge.mainSiteMirror,
        adminContentPath: bridge.adminContentPath,
        vendorContentPath: bridge.vendorContentPath,
      },
      sectionId,
      total: (vendors || []).length,
    });

  } catch (error: any) {
    console.error('[section-vendors GET]', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
