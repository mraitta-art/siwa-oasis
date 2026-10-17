import { NextRequest, NextResponse } from 'next/server';
import { BookingPayload } from '@/lib/commercial-types';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload: BookingPayload = await req.json();

    if (!payload.item_title || !payload.customer_name || !payload.customer_phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required reservation fields (name, phone, item)' },
        { status: 400 }
      );
    }

    const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // 1. Persist to database (journey_requests & audit_log)
    try {
      const requestCode = `SIWA-${payload.sector.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(
        `INSERT INTO journey_requests (
          id, request_code, customer_name, customer_phone,
          adults_count, children_count,
          estimated_price, final_price,
          status, distribution_status, request_type,
          itinerary_name, itinerary_summary, custom_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', 'dispatched', 'commercial_booking', ?, ?, ?)`,
        [
          bookingId,
          requestCode,
          payload.customer_name.trim(),
          payload.customer_phone.trim(),
          payload.adults_count || 1,
          payload.children_count || 0,
          payload.total_price,
          payload.total_price,
          payload.item_title,
          `Commercial Reservation: ${payload.item_title} (${payload.sector}) for ${payload.customer_name}`,
          JSON.stringify({
            ...payload,
            booking_id: bookingId,
            booked_at: nowIso
          })
        ]
      );
    } catch (dbErr: any) {
      console.warn('Could not write booking to journey_requests table:', dbErr.message);
    }

    try {
      await pool.query(
        `INSERT INTO audit_log (id, action, details, created_at) VALUES (?, ?, ?, NOW())`,
        [
          `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          'COMMERCIAL_BOOKING_DISPATCH',
          JSON.stringify({
            booking_id: bookingId,
            item_title: payload.item_title,
            sector: payload.sector,
            kind: payload.kind,
            customer_name: payload.customer_name,
            customer_phone: payload.customer_phone,
            total_price: payload.total_price,
            business_name: payload.business_name
          })
        ]
      );
    } catch (auditErr: any) {
      // non-blocking fallback
    }


    // 2. Format localized WhatsApp message for the vendor/concierge
    const datesInfo = payload.start_date
      ? `📅 Date: ${payload.start_date}${payload.end_date ? ` to ${payload.end_date}` : ''}`
      : '';
    const guestsInfo = `👥 Guests: ${payload.adults_count || 1} Adult(s)${payload.children_count ? `, ${payload.children_count} Child(ren)` : ''}`;
    const optionInfo = payload.selected_option_name ? `🏷️ Tier / Option: ${payload.selected_option_name}` : '';
    const quantityInfo = payload.quantity && payload.quantity > 1 ? `🔢 Quantity: ${payload.quantity}` : '';

    const messageText = [
      `🌟 *NEW SIWIFY RESERVATION REQUEST* 🌟`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏨 *Sector:* ${payload.sector.toUpperCase()} (${payload.kind.toUpperCase()})`,
      `📦 *Item:* ${payload.item_title}`,
      `🏪 *Business:* ${payload.business_name || 'Siwify Official'}`,
      optionInfo,
      datesInfo,
      guestsInfo,
      quantityInfo,
      `💰 *Total Estimated:* ${payload.total_price} ${payload.currency || 'EGP'}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Customer Name:* ${payload.customer_name}`,
      `📞 *Customer Phone:* ${payload.customer_phone}`,
      payload.customer_notes ? `📝 *Notes:* ${payload.customer_notes}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🚀 *Booked via Siwify.com Platform Engine*`
    ]
      .filter(Boolean)
      .join('\n');

    const vendorPhone = payload.whatsapp_number || payload.business_phone || '201000000000';
    const cleanPhone = vendorPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      created_at: nowIso,
      whatsapp_url: whatsappUrl,
      summary: {
        item_title: payload.item_title,
        total_price: payload.total_price,
        currency: payload.currency || 'EGP',
        customer_name: payload.customer_name
      }
    });
  } catch (error: any) {
    console.error('Reservation submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process reservation' },
      { status: 500 }
    );
  }
}
