import { NextResponse } from 'next/server';
import { query as safeQuery, queryOne, execute } from '@/lib/db';
import { requireAdmin, requireVendor } from '@/lib/auth';
import { ensureJourneyTables } from '@/lib/journey-request-store';
import crypto from 'crypto';

// GET: Fetch all open journey requests (for vendors to browse)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const asAdmin = searchParams.get('admin') === 'true';
    const user = asAdmin ? await requireAdmin() : await requireVendor();
    let vendorId = '';
    let businessCategory = '';

    if (!asAdmin) {
      if (!user.businessId) return NextResponse.json({ success: false, error: 'Vendor business is not linked to this account' }, { status: 403 });
      vendorId = user.id;
      const business = await queryOne<{ type_id: string }>('SELECT type_id FROM businesses WHERE id = ? LIMIT 1', [user.businessId]);
      businessCategory = business?.type_id || '';
    }

    let sql = `SELECT * FROM journey_requests WHERE status = ?`;
    const params: any[] = [status];

    if (!asAdmin) {
      // Must be dispatched
      sql += ` AND distribution_status = 'dispatched'`;
      // Requests routed through explicit vendor dispatches are returned by the scoped dispatch feed.
      sql += ` AND NOT EXISTS (SELECT 1 FROM journey_vendor_dispatches jvd WHERE jvd.request_id = journey_requests.id)`;
      // Target checks: If target_business_type_id is set, it must match business_category.
      // If target_vendor_id is set, it must match vendor_id.
      if (vendorId) {
        sql += ` AND (target_vendor_id IS NULL OR target_vendor_id = ?)`;
        params.push(vendorId);
      } else {
        sql += ` AND target_vendor_id IS NULL`;
      }
      if (businessCategory) {
        sql += ` AND (target_business_type_id IS NULL OR target_business_type_id = ?)`;
        params.push(businessCategory);
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

    let rows = await safeQuery(sql, params) as any[];

    // Mask data for vendors if admin chose to hide contact
    if (!asAdmin) {
      rows = rows.map(r => {
        if (!r.reveal_contact) {
          return {
            ...r,
            customer_email: null,
            customer_phone: null,
            customer_name: 'Marketplace Guest',
          };
        }
        return r;
      });
    }

    return NextResponse.json({ success: true, journeys: rows });
  } catch (error: any) {
    console.error('GET /api/journeys error:', error);
    const statusCode = error?.message?.includes('authenticated') || error?.message?.includes('Admin access') || error?.message?.includes('Vendor access') ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status: statusCode });
  }
}

// POST: Customer submits a new custom journey request
export async function POST(request: Request) {
  try {
    await ensureJourneyTables();
    const body = await request.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      request_type,
      vibe,
      vibes,
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

    if (!customer_name || !customer_phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customer_name, customer_phone' },
        { status: 400 }
      );
    }

    const idColumn = (await safeQuery<{ Type: string; Extra: string }>("SHOW COLUMNS FROM journey_requests LIKE 'id'"))[0];
    const usesAutoIncrementId = Boolean(idColumn?.Extra?.toLowerCase().includes('auto_increment'));
    const id = usesAutoIncrementId ? null : crypto.randomUUID();
    const requestCode = `SIW-${Math.floor(100000 + Math.random() * 900000)}`;
    const details = custom_details && typeof custom_details === 'object' ? custom_details : {};
    const selectedExperiences = Array.isArray(details.selected_experiences)
      ? details.selected_experiences
      : Array.isArray(details.timeline_items) ? details.timeline_items : [];
    const selectedBusinessIds = Array.isArray(body.selected_business_ids) ? body.selected_business_ids : [];
    const dayCount = Math.max(1, Math.min(30, Number.parseInt(String(duration), 10) || 3));
    const finalDetails = {
      ...details,
      interface_language: body.interface_language === 'ar' ? 'ar' : 'en',
      legacy_planner: { request_type, vibe, vibes, pace, interests },
    };
    const requestRecord: Record<string, unknown> = {
      request_code: requestCode,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email || '',
      duration_days: dayCount,
      travel_dates: arrival_date || '',
      adults_count: Math.max(1, Number(group_size) || 1),
      children_count: 0,
      selected_experiences: JSON.stringify(selectedExperiences),
      accommodation_preference: String(details.accommodation_preference || 'None'),
      transport_preference: String(details.transport_preference || 'None'),
      meal_preference: String(details.meal_preference || 'None'),
      guide_language: String(details.guide_language || 'English'),
      interface_language: body.interface_language === 'ar' ? 'ar' : 'en',
      catalog_revision: null,
      special_notes: special_requests || '',
      estimated_price: Number(details.estimated_price) || 0,
      discount_amount: Number(details.discount_amount) || 0,
      final_price: Number(details.final_price || details.estimated_price) || 0,
      selected_business_ids: JSON.stringify(selectedBusinessIds),
      status: 'open',
      distribution_status: selectedBusinessIds.length ? 'dispatched' : 'admin_review',
      request_type: String(request_type || 'journey'),
      budget: budget || 'Flexible',
      duration: String(duration || `${dayCount} Days`),
      group_size: Math.max(1, Number(group_size) || 1),
      arrival_date: arrival_date || 'Flexible',
      special_requests: special_requests || '',
      itinerary_name: itinerary_name || `${vibe || 'Siwa'} Journey`,
      itinerary_summary: itinerary_summary || special_requests || 'Customized journey request',
      custom_details: JSON.stringify(finalDetails),
    };
    if (id) requestRecord.id = id;
    const columns = Object.keys(requestRecord);
    const result = await execute(
      `INSERT INTO journey_requests (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      Object.values(requestRecord)
    );
    const journeyId = id || String(result.insertId);

    return NextResponse.json({ success: true, journey: { id: journeyId, request_code: requestCode, ...requestRecord } });
  } catch (error: any) {
    console.error('POST /api/journeys error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
