import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Fetch vendor offers
// ?journey_id=X  → all offers for a journey
// ?vendor_id=current → all offers by the current vendor's business
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const journey_id = searchParams.get('journey_id');
    const vendor_id  = searchParams.get('vendor_id');

    let sql = `
      SELECT 
        o.*,
        b.name  AS business_name,
        b.slug  AS business_slug,
        b.tier  AS business_tier,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.business_info.business_logo')) AS business_logo,
        jr.vibe, jr.duration, jr.pace, jr.group_size, jr.budget,
        jr.itinerary_name, jr.arrival_date, jr.status AS journey_status,
        /* Only reveal customer contact when offer is accepted */
        IF(o.status = 'accepted', jr.customer_name,  NULL) AS customer_name,
        IF(o.status = 'accepted', jr.customer_email, NULL) AS customer_email
      FROM journey_offers o
      LEFT JOIN businesses       b  ON o.business_id = b.id
      LEFT JOIN journey_requests jr ON o.journey_id  = jr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (journey_id) {
      sql += ' AND o.journey_id = ?';
      params.push(journey_id);
    }

    if (vendor_id && vendor_id !== 'current') {
      sql += ' AND o.vendor_id = ?';
      params.push(vendor_id);
    }
    // "current" = demo mode: return all for the demo vendor business b1
    if (vendor_id === 'current') {
      sql += ' AND o.business_id = (SELECT id FROM businesses ORDER BY created_at ASC LIMIT 1)';
    }

    sql += ' ORDER BY o.created_at DESC';

    const rows = await query(sql, params) as any[];

    // Parse JSON arrays
    const offers = rows.map((row: any) => ({
      ...row,
      inclusions: typeof row.inclusions === 'string' ? JSON.parse(row.inclusions || '[]') : (row.inclusions || []),
      exclusions: typeof row.exclusions === 'string' ? JSON.parse(row.exclusions || '[]') : (row.exclusions || []),
    }));

    return NextResponse.json({ success: true, offers });
  } catch (error: any) {
    console.error('GET /api/journeys/offers error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Vendor submits an offer for a journey request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      journey_id,
      vendor_id,
      business_id,
      offer_title,
      offer_description,
      price,
      currency,
      inclusions,
      exclusions,
      validity_days,
      contact_phone,
      contact_email,
      notes,
    } = body;

    if (!journey_id || !offer_title || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: journey_id, offer_title, price' },
        { status: 400 }
      );
    }

    // Resolve business_id if "current"
    let resolvedBusinessId = business_id;
    if (!resolvedBusinessId || resolvedBusinessId === 'current') {
      const biz = await query('SELECT id FROM businesses ORDER BY created_at ASC LIMIT 1') as any[];
      resolvedBusinessId = biz[0]?.id || 'b1';
    }

    await query(
      `INSERT INTO journey_offers 
        (journey_id, vendor_id, business_id, offer_title, offer_description, price, currency,
         inclusions, exclusions, validity_days, contact_phone, contact_email, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        journey_id,
        vendor_id || null,
        resolvedBusinessId,
        offer_title,
        offer_description || '',
        price,
        currency || 'USD',
        JSON.stringify(inclusions || []),
        JSON.stringify(exclusions || []),
        validity_days || 7,
        contact_phone || '',
        contact_email || '',
        notes || '',
      ]
    );

    return NextResponse.json({ success: true, message: 'Offer submitted successfully' });
  } catch (error: any) {
    console.error('POST /api/journeys/offers error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
