import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Fetch all open journey requests (for vendors to browse)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const vendor_id = searchParams.get('vendor_id');
    const business_category = searchParams.get('business_category');
    
    // For admins, they can view everything (will pass a specific param or just call a different API).
    // But for vendors hitting this endpoint, enforce distribution rules:
    const asAdmin = searchParams.get('admin') === 'true';

    let sql = `SELECT * FROM journey_requests WHERE status = ?`;
    const params: any[] = [status];

    if (!asAdmin) {
      // Must be dispatched
      sql += ` AND distribution_status = 'dispatched'`;
      // Target checks: If target_business_type_id is set, it must match business_category.
      // If target_vendor_id is set, it must match vendor_id.
      if (vendor_id && vendor_id !== 'current') {
        sql += ` AND (target_vendor_id IS NULL OR target_vendor_id = ?)`;
        params.push(vendor_id);
      } else {
        sql += ` AND target_vendor_id IS NULL`;
      }
      if (business_category) {
        sql += ` AND (target_business_type_id IS NULL OR target_business_type_id = ?)`;
        params.push(business_category);
      } else {
        sql += ` AND target_business_type_id IS NULL`;
      }
    } else {
      // Admin might want to filter by distribution_status
      const d_status = searchParams.get('distribution_status');
      if (d_status) {
        sql += ` AND distribution_status = ?`;
        params.push(d_status);
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    let rows = await query(sql, params) as any[];

    // Mask data for vendors if admin chose to hide contact
    if (!asAdmin) {
      rows = rows.map(r => {
        if (!r.reveal_contact) {
          return {
            ...r,
            customer_email: null,
            customer_name: 'Marketplace Guest',
          };
        }
        return r;
      });
    }

    return NextResponse.json({ success: true, journeys: rows });
  } catch (error: any) {
    console.error('GET /api/journeys error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Customer submits a new custom journey request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_email,
      request_type,
      vibe,
      duration,
      pace,
      interests,
      budget,
      group_size,
      arrival_date,
      special_requests,
      itinerary_name,
      itinerary_summary,
      custom_details
    } = body;

    if (!customer_name || !customer_email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customer_name, customer_email' },
        { status: 400 }
      );
    }

    // Insert marketplace request
    await query(
      `INSERT INTO journey_requests 
        (customer_name, customer_email, request_type, vibe, duration, pace, interests, budget, group_size, arrival_date, special_requests, itinerary_name, itinerary_summary, custom_details, status, distribution_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'admin_review')`,
      [
        customer_name,
        customer_email,
        request_type || 'journey',
        vibe || '',
        duration || '',
        pace || '',
        JSON.stringify(interests || []),
        budget || '',
        group_size || 1,
        arrival_date || null,
        special_requests || '',
        itinerary_name || '',
        itinerary_summary || '',
        custom_details ? JSON.stringify(custom_details) : null
      ]
    );

    // Fetch inserted row
    const rows = await query(
      `SELECT * FROM journey_requests WHERE customer_email = ? ORDER BY created_at DESC LIMIT 1`,
      [customer_email]
    ) as any[];

    return NextResponse.json({ success: true, journey: rows[0] });
  } catch (error: any) {
    console.error('POST /api/journeys error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
