import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET: Dynamic Homepage Pools
 * Query params: ?type=investment | offers | products | eco
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'products';

    let sql = `
      SELECT b.id, b.name, b.slug, b.subscription_tier, b.custom_data, 
             bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = 'active' AND b.published = 1
    `;

    const results = await query(sql) as any[];

    // Filter results programmatically to avoid complex JSON_EXTRACT MySQL version incompatibilities
    const filtered = results.filter((biz: any) => {
      if (!biz.custom_data) return false;
      let data: any = {};
      try {
        data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
      } catch (e) {
        return false;
      }

      if (type === 'investment') {
        // Gated: Premium/Gold/VIP only
        if (biz.subscription_tier === 'free') return false;
        const invest = data.sec_7_investment;
        return !!(invest && (invest.investment_opps || invest.timeshare_details));
      }

      if (type === 'offers') {
        const offers = data.sec_8_connector;
        if (!offers) return false;
        const discount = parseFloat(offers.discount_pct || offers.discount);
        return !isNaN(discount) && discount > 0;
      }

      if (type === 'products') {
        const market = data.sec_9_marketplace_catalog;
        if (!market || !market.product_list) return false;
        
        // Parse product list if it's a string, or check length if it's an array
        let list: any[] = [];
        try {
          list = typeof market.product_list === 'string' ? JSON.parse(market.product_list) : market.product_list;
        } catch (e) {
          // If it is raw text storytelling description of products, treat it as active if long enough
          return typeof market.product_list === 'string' && market.product_list.trim().length > 10;
        }
        return Array.isArray(list) ? list.length > 0 : !!market.product_list;
      }

      if (type === 'eco') {
        const guardian = data.sec_6_guardian;
        return !!(guardian && (guardian.solar_powered || guardian.eco_materials || guardian.plastic_free));
      }

      return false;
    });

    // Format output
    const formatted = filtered.map((biz: any) => {
      let data: any = {};
      try {
        data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
      } catch (e) {}

      return {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        subscription_tier: biz.subscription_tier,
        type_name: biz.type_name,
        type_icon: biz.type_icon,
        type_icon_color: biz.type_icon_color,
        custom_data: data
      };
    });

    return NextResponse.json(formatted);
  } catch (e: any) {
    console.error("Homepage Pools fetch failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
