import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import crypto from 'crypto';

/**
 * AUTO-HEAL: Ensure journey_requests and journey_vendor_dispatches tables exist
 */
async function ensureJourneyTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS journey_requests (
      id VARCHAR(100) PRIMARY KEY,
      request_code VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255) DEFAULT '',
      duration_days INT DEFAULT 3,
      travel_dates VARCHAR(100) DEFAULT '',
      adults_count INT DEFAULT 2,
      children_count INT DEFAULT 0,
      selected_experiences JSON DEFAULT NULL,
      accommodation_preference VARCHAR(100) DEFAULT 'ecolodge',
      transport_preference VARCHAR(100) DEFAULT '4x4_land_cruiser',
      meal_preference VARCHAR(100) DEFAULT 'traditional_siwan',
      guide_language VARCHAR(50) DEFAULT 'english',
      special_notes TEXT,
      estimated_price DECIMAL(10,2) DEFAULT 0.00,
      discount_amount DECIMAL(10,2) DEFAULT 0.00,
      final_price DECIMAL(10,2) DEFAULT 0.00,
      selected_business_ids JSON DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_code (request_code),
      INDEX idx_phone (customer_phone),
      INDEX idx_status (status)
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS journey_vendor_dispatches (
      id VARCHAR(100) PRIMARY KEY,
      request_id VARCHAR(100) NOT NULL,
      business_id VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'experience_provider',
      vendor_status VARCHAR(50) DEFAULT 'pending',
      quoted_price DECIMAL(10,2) DEFAULT NULL,
      vendor_notes TEXT,
      whatsapp_notified BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_req (request_id),
      INDEX idx_biz (business_id)
    )
  `);
}

/**
 * POST /api/journeys/custom-dispatch
 * Dispatches a visitor's customized tour requirements to selected businesses & creates tracking records
 */
export async function POST(req: NextRequest) {
  try {
    await ensureJourneyTables();
    const body = await req.json();

    const {
      customer_name,
      customer_phone,
      customer_email = '',
      duration_days = 3,
      travel_dates = '',
      adults_count = 2,
      children_count = 0,
      selected_experiences = [],
      accommodation_preference = 'ecolodge',
      transport_preference = '4x4_land_cruiser',
      meal_preference = 'traditional_siwan',
      guide_language = 'english',
      special_notes = '',
      estimated_price = 0,
      discount_amount = 0,
      final_price = 0,
      selected_business_ids = []
    } = body;

    if (!customer_name?.trim() || !customer_phone?.trim()) {
      return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const requestCode = `SIW-${Math.floor(100000 + Math.random() * 900000)}`;

    await execute(
      `INSERT INTO journey_requests (
        id, request_code, customer_name, customer_phone, customer_email,
        duration_days, travel_dates, adults_count, children_count,
        selected_experiences, accommodation_preference, transport_preference,
        meal_preference, guide_language, special_notes, estimated_price,
        discount_amount, final_price, selected_business_ids, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        requestCode,
        customer_name.trim(),
        customer_phone.trim(),
        customer_email.trim(),
        Number(duration_days) || 3,
        travel_dates,
        Number(adults_count) || 2,
        Number(children_count) || 0,
        JSON.stringify(selected_experiences || []),
        accommodation_preference,
        transport_preference,
        meal_preference,
        guide_language,
        special_notes,
        Number(estimated_price) || 0,
        Number(discount_amount) || 0,
        Number(final_price) || 0,
        JSON.stringify(selected_business_ids || [])
      ]
    );

    // If specific businesses were chosen, create dispatch records for each vendor
    const dispatches: any[] = [];
    if (Array.isArray(selected_business_ids) && selected_business_ids.length > 0) {
      for (const bizId of selected_business_ids) {
        const dispatchId = crypto.randomUUID();
        await execute(
          `INSERT INTO journey_vendor_dispatches (id, request_id, business_id, role, vendor_status)
           VALUES (?, ?, ?, 'selected_provider', 'pending')`,
          [dispatchId, id, bizId]
        );

        // Fetch vendor phone/name for WhatsApp link generation
        const bizRow = await queryOne(
          `SELECT id, name, vendor_phone, custom_data FROM businesses WHERE id = ?`,
          [bizId]
        ) as any;

        if (bizRow) {
          let phone = bizRow.vendor_phone;
          if (!phone && bizRow.custom_data) {
            try {
              const cd = typeof bizRow.custom_data === 'string' ? JSON.parse(bizRow.custom_data) : bizRow.custom_data;
              phone = cd?.basic?.whatsapp || cd?.basic?.phone || cd?.sec_1_identity?.phone;
            } catch {}
          }
          dispatches.push({
            business_id: bizId,
            business_name: bizRow.name,
            phone: phone || null
          });
        }
      }
    }

    // Build Formatted WhatsApp Dispatch Message for Visitor / Admin / Vendors
    const experiencesList = (selected_experiences as any[])
      .map((e: any) => typeof e === 'object' ? `• ${e.title || e.name}` : `• ${e}`)
      .join('%0A');

    const formattedWhatsAppSummary = 
      `*🌟 NEW SIWIFY CUSTOM JOURNEY [${requestCode}]*%0A` +
      `----------------------------------------%0A` +
      `👤 *Traveler:* ${encodeURIComponent(customer_name)}%0A` +
      `📞 *Phone:* ${encodeURIComponent(customer_phone)}%0A` +
      `⏱️ *Duration:* ${duration_days} Days / ${travel_dates ? encodeURIComponent(travel_dates) : 'Flexible Dates'}%0A` +
      `👥 *Guests:* ${adults_count} Adults${children_count > 0 ? `, ${children_count} Children` : ''}%0A` +
      `🛏️ *Stay Style:* ${encodeURIComponent(accommodation_preference)}%0A` +
      `🚙 *Transport:* ${encodeURIComponent(transport_preference)}%0A` +
      `🗣️ *Guide Language:* ${encodeURIComponent(guide_language)}%0A` +
      `----------------------------------------%0A` +
      `🎯 *Selected Experiences:*%0A${experiencesList}%0A` +
      `----------------------------------------%0A` +
      `💰 *Estimated Total:* ${final_price > 0 ? `${final_price} EGP` : 'Custom Quote'}` +
      (discount_amount > 0 ? ` _(Saved ${discount_amount} EGP with Bundle Discount!)_` : '') + `%0A` +
      (special_notes ? `📝 *Notes:* ${encodeURIComponent(special_notes)}%0A` : '') +
      `----------------------------------------%0A` +
      `👉 View on SiWiFy Portal: https://siwify.com/journey-requests/${id}`;

    return NextResponse.json({
      success: true,
      id,
      request_code: requestCode,
      whatsapp_summary_text: formattedWhatsAppSummary,
      dispatched_vendors: dispatches
    }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/journeys/custom-dispatch
 * Retrieve journey requests for admin or visitor lookup
 */
export async function GET(req: NextRequest) {
  try {
    await ensureJourneyTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    if (id) {
      const request = await queryOne(
        `SELECT jr.* FROM journey_requests jr WHERE jr.id = ? OR jr.request_code = ?`,
        [id, id]
      ) as any;

      if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

      const dispatches = await query(
        `SELECT jvd.*, b.name as business_name, b.slug as business_slug
         FROM journey_vendor_dispatches jvd
         JOIN businesses b ON jvd.business_id = b.id
         WHERE jvd.request_id = ?`,
        [request.id]
      );

      return NextResponse.json({
        ...request,
        selected_experiences: typeof request.selected_experiences === 'string' ? JSON.parse(request.selected_experiences) : request.selected_experiences || [],
        dispatches
      });
    }

    let sql = `SELECT * FROM journey_requests WHERE 1=1 `;
    const params: any[] = [];

    if (phone) {
      sql += ` AND customer_phone = ? `;
      params.push(phone);
    }
    if (status && status !== 'all') {
      sql += ` AND status = ? `;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT 100 `;
    const rows = await query(sql, params) as any[];

    return NextResponse.json(rows.map((r) => ({
      ...r,
      selected_experiences: typeof r.selected_experiences === 'string' ? JSON.parse(r.selected_experiences) : r.selected_experiences || []
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
