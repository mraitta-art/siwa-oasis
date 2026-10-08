import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSectionBridge } from '@/lib/section-mainsite-bridge';
import { CANONICAL_SECTION_LABELS } from '@/lib/minisite-governance-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId  = searchParams.get('section') || 'sec_1_identity';
    const search     = (searchParams.get('search') || '').trim();
    const limit      = Math.min(parseInt(searchParams.get('limit') || '60', 10), 120);

    const bridge      = getSectionBridge(sectionId);
    const sectionMeta = CANONICAL_SECTION_LABELS[sectionId] ?? null;

    if (!bridge) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    const hasSearch   = search.length > 0;
    const searchWhere = hasSearch ? `AND (b.name LIKE ? OR bt.name LIKE ?)` : '';
    const searchArgs: string[] = hasSearch ? [`%${search}%`, `%${search}%`] : [];

    let vendors: any[] = [];

    // ─── Per-section aggregation SQL ─────────────────────────────────────────

    switch (sectionId) {

      // Programs & Packages — tour_products (is_active = 1)
      case 'sec_5_experiences': {
        vendors = await query<any>(
          `SELECT
             b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
             b.vendor_whatsapp, b.vendor_phone,
             bt.name AS type_name,
             COUNT(tp.id) AS item_count,
             MAX(tp.image_url) AS section_image,
             MIN(tp.price) AS min_price,
             MAX(tp.price) AS max_price
           FROM businesses b
           LEFT JOIN business_types bt ON b.type_id = bt.id
           INNER JOIN tour_products tp
             ON tp.vendor_business_id = b.id AND tp.is_active = 1
           WHERE b.slug IS NOT NULL ${searchWhere}
           GROUP BY b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
                    b.vendor_whatsapp, b.vendor_phone, bt.name
           ORDER BY b.is_trusted DESC, item_count DESC
           LIMIT ?`,
          [...searchArgs, limit]
        ).catch(() => []);
        break;
      }

      // Special Offers & Deals — tour_products with discount_percent > 0 or featured
      case 'sec_8_connector': {
        vendors = await query<any>(
          `SELECT
             b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
             b.vendor_whatsapp, b.vendor_phone,
             bt.name AS type_name,
             COUNT(tp.id) AS item_count,
             MAX(tp.discount_percent) AS max_discount,
             MAX(tp.image_url) AS section_image,
             MIN(tp.price) AS min_price,
             NULL AS max_price
           FROM businesses b
           LEFT JOIN business_types bt ON b.type_id = bt.id
           INNER JOIN tour_products tp
             ON tp.vendor_business_id = b.id
             AND tp.is_active = 1
             AND (tp.discount_percent > 0 OR tp.is_featured = 1)
           WHERE b.slug IS NOT NULL ${searchWhere}
           GROUP BY b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
                    b.vendor_whatsapp, b.vendor_phone, bt.name
           ORDER BY max_discount DESC, item_count DESC
           LIMIT ?`,
          [...searchArgs, limit]
        ).catch(() => []);
        break;
      }

      // Marketplace & Local Products — marketplace_items (approved)
      case 'sec_9_marketplace_catalog': {
        vendors = await query<any>(
          `SELECT
             b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
             b.vendor_whatsapp, b.vendor_phone,
             bt.name AS type_name,
             COUNT(mi.id) AS item_count,
             MAX(mi.image_url) AS section_image,
             MIN(mi.price) AS min_price,
             NULL AS max_price,
             NULL AS max_discount
           FROM businesses b
           LEFT JOIN business_types bt ON b.type_id = bt.id
           INNER JOIN marketplace_items mi
             ON mi.business_id = b.id AND mi.status = 'approved'
           WHERE b.slug IS NOT NULL ${searchWhere}
           GROUP BY b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
                    b.vendor_whatsapp, b.vendor_phone, bt.name
           ORDER BY b.is_trusted DESC, item_count DESC
           LIMIT ?`,
          [...searchArgs, limit]
        ).catch(() => []);
        break;
      }

      // Vibe / Ambience / Facilities / Gastronomy — vendor_gallery by section_id
      case 'sec_2_ambience':
      case 'sec_3_facilities':
      case 'sec_4_gastronomy': {
        vendors = await query<any>(
          `SELECT
             b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
             b.vendor_whatsapp, b.vendor_phone,
             bt.name AS type_name,
             COUNT(vg.id) AS item_count,
             MAX(vg.url) AS section_image,
             NULL AS min_price, NULL AS max_price, NULL AS max_discount
           FROM businesses b
           LEFT JOIN business_types bt ON b.type_id = bt.id
           LEFT JOIN vendor_gallery vg
             ON vg.business_id = b.id
             AND vg.approval_status = 'approved'
             AND vg.show_on_minisite = 1
             AND vg.section_id = ?
           WHERE b.slug IS NOT NULL ${searchWhere}
           GROUP BY b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
                    b.vendor_whatsapp, b.vendor_phone, bt.name
           HAVING item_count > 0
           ORDER BY b.is_trusted DESC, item_count DESC
           LIMIT ?`,
          [sectionId, ...searchArgs, limit]
        ).catch(() => []);
        break;
      }

      // Investment & Partnerships — businesses with investment custom_data
      case 'sec_7_investment': {
        vendors = await query<any>(
          `SELECT
             b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
             b.vendor_whatsapp, b.vendor_phone,
             bt.name AS type_name,
             0 AS item_count,
             b.cover_image AS section_image,
             NULL AS min_price, NULL AS max_price, NULL AS max_discount
           FROM businesses b
           LEFT JOIN business_types bt ON b.type_id = bt.id
           WHERE b.slug IS NOT NULL
             AND (
               JSON_EXTRACT(b.custom_data, '$.sec_7_investment') IS NOT NULL
               OR JSON_EXTRACT(b.custom_data, '$.investment') IS NOT NULL
             )
             ${searchWhere}
           ORDER BY b.is_trusted DESC, b.name ASC
           LIMIT ?`,
          [...searchArgs, limit]
        ).catch(() => []);
        break;
      }

      // Operations & Structure / Trust & Reviews — all active businesses
      case 'sec_6_guardian':
      case 'sec_10_testimonials_faqs':
      case 'sec_1_identity':
      default: {
        vendors = await query<any>(
          `SELECT
             b.id, b.name, b.slug, b.logo_url, b.cover_image, b.is_trusted,
             b.vendor_whatsapp, b.vendor_phone,
             bt.name AS type_name,
             0 AS item_count,
             b.cover_image AS section_image,
             NULL AS min_price, NULL AS max_price, NULL AS max_discount
           FROM businesses b
           LEFT JOIN business_types bt ON b.type_id = bt.id
           WHERE b.slug IS NOT NULL ${searchWhere}
           ORDER BY b.is_trusted DESC, b.name ASC
           LIMIT ?`,
          [...searchArgs, limit]
        ).catch(() => []);
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
