import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const type = searchParams.get('type') || '';

    // Query active businesses
    // We select id, name, slug, logo, and the specific offers_packages data from custom_data
    let sql = `
      SELECT 
        b.id, 
        b.name AS business_name, 
        b.slug, 
        b.tier,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.business_info.business_logo')) AS logo,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.business_info.logo')) AS fallback_logo,
        JSON_EXTRACT(b.custom_data, '$.offers_packages') AS offer_data
      FROM businesses b
      WHERE b.status = 'active'
        AND JSON_EXTRACT(b.custom_data, '$.offers_packages') IS NOT NULL
    `;
    
    const params: any[] = [];

    if (type) {
      sql += ` AND b.type_id = ?`;
      params.push(type);
    }

    sql += ` ORDER BY b.tier DESC, b.created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = await query(sql, params) as any[];

    // Process and format the offers
    const offers = rows.map(row => {
      let offerData = null;
      try {
        offerData = typeof row.offer_data === 'string' ? JSON.parse(row.offer_data) : row.offer_data;
      } catch (e) {
        console.error('Error parsing offer data for business', row.id);
      }

      if (!offerData || !offerData.offers_packages_offer_title) return null;

      // Extract specific fields based on our form definition
      return {
        business_id: row.id,
        business_name: row.business_name,
        business_slug: row.slug,
        business_logo: row.logo || row.fallback_logo || null,
        tier: row.tier,
        title: offerData.offers_packages_offer_title,
        price: offerData.offers_packages_offer_price,
        discount: offerData.offers_packages_offer_discount,
        description: offerData.offers_packages_offer_description,
        inclusions: offerData.offers_packages_offer_inclusions, // could be string or array
        expiry: offerData.offers_packages_offer_expiry,
        link: offerData.offers_packages_offer_cta_link || `/offers/${row.slug}`, // Platform link or direct
        image: offerData.offers_packages_offer_image,
      };
    }).filter(Boolean); // Remove nulls

    return NextResponse.json({ success: true, count: offers.length, offers });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
