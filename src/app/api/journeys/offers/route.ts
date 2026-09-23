import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

async function ensureJourneyOffersTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS journey_offers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      journey_id VARCHAR(100) NOT NULL,
      vendor_id VARCHAR(100) DEFAULT NULL,
      business_id VARCHAR(100) NOT NULL,
      offer_title VARCHAR(255) NOT NULL,
      offer_description TEXT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      currency VARCHAR(10) DEFAULT 'EGP',
      inclusions JSON DEFAULT NULL,
      exclusions JSON DEFAULT NULL,
      validity_days INT DEFAULT 7,
      contact_phone VARCHAR(50) DEFAULT '',
      contact_email VARCHAR(255) DEFAULT '',
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_journey (journey_id),
      INDEX idx_biz (business_id),
      INDEX idx_status (status)
    )
  `);
}

// GET: Fetch vendor offers
// ?journey_id=X  → all offers for a journey
// ?vendor_id=current → all offers by the current vendor's business
export async function GET(request: Request) {
  try {
    await ensureJourneyOffersTable();
    const { searchParams } = new URL(request.url);
    const journey_id = searchParams.get('journey_id');
    const vendor_id  = searchParams.get('vendor_id');
    const business_id = searchParams.get('business_id');

    let sql = `
      SELECT 
        o.*,
        b.name  AS business_name,
        b.slug  AS business_slug,
        b.subscription_tier AS business_tier,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.basic.logo')) AS business_logo,
        jr.duration_days, jr.estimated_price, jr.final_price, jr.status AS journey_status,
        /* Only reveal customer contact when offer is accepted or if admin */
        IF(o.status = 'accepted', jr.customer_name,  'Client') AS customer_name,
        IF(o.status = 'accepted', jr.customer_email, NULL) AS customer_email,
        IF(o.status = 'accepted', jr.customer_phone, NULL) AS customer_phone
      FROM journey_offers o
      LEFT JOIN businesses       b  ON o.business_id = b.id
      LEFT JOIN journey_requests jr ON o.journey_id  = jr.id OR o.journey_id = jr.request_code
      WHERE 1=1
    `;
    const params: any[] = [];

    if (journey_id) {
      sql += ' AND (o.journey_id = ? OR jr.request_code = ?)';
      params.push(journey_id, journey_id);
    }

    if (business_id) {
      sql += ' AND o.business_id = ?';
      params.push(business_id);
    } else if (vendor_id && vendor_id !== 'current') {
      sql += ' AND o.vendor_id = ?';
      params.push(vendor_id);
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
    await ensureJourneyOffersTable();
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

    await execute(
      `INSERT INTO journey_offers 
        (journey_id, vendor_id, business_id, offer_title, offer_description, price, currency,
         inclusions, exclusions, validity_days, contact_phone, contact_email, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        String(journey_id),
        vendor_id || null,
        resolvedBusinessId,
        offer_title,
        offer_description || '',
        Number(price) || 0,
        currency || 'EGP',
        JSON.stringify(inclusions || []),
        JSON.stringify(exclusions || []),
        Number(validity_days) || 7,
        contact_phone || '',
        contact_email || '',
        notes || '',
      ]
    );

    // Also update vendor dispatch status if exists
    try {
      await execute(
        `UPDATE journey_vendor_dispatches 
         SET vendor_status = 'quoted', quoted_price = ? 
         WHERE request_id = ? AND business_id = ?`,
        [Number(price) || 0, String(journey_id), resolvedBusinessId]
      );
    } catch {}

    return NextResponse.json({ success: true, message: 'Offer submitted successfully' });
  } catch (error: any) {
    console.error('POST /api/journeys/offers error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Accept, decline or withdraw an offer
export async function PATCH(request: Request) {
  try {
    await ensureJourneyOffersTable();
    const body = await request.json();
    const { offer_id, status } = body;

    if (!offer_id || !status) {
      return NextResponse.json({ error: 'offer_id and status required' }, { status: 400 });
    }

    await execute(`UPDATE journey_offers SET status = ? WHERE id = ?`, [status, offer_id]);
    return NextResponse.json({ success: true, message: `Offer status updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
