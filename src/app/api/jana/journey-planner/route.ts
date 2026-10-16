import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { DEFAULT_JOURNEY_CUSTOMIZER, type JourneyCustomizerCatalog } from '@/lib/journey-customizer-catalog';
import { ensureJourneyTables } from '@/lib/journey-request-store';

const CONFIG_KEY = 'default';

async function getOrInitCatalog(): Promise<{ catalog: JourneyCustomizerCatalog; revision: number }> {
  try {
    const row = await queryOne<{ catalog: unknown; revision: number }>(
      'SELECT catalog, revision FROM journey_customizer_catalog WHERE config_key = ? LIMIT 1',
      [CONFIG_KEY]
    );
    if (row?.catalog) {
      const parsed = typeof row.catalog === 'string' ? JSON.parse(row.catalog) : row.catalog;
      return { catalog: parsed as JourneyCustomizerCatalog, revision: Number(row.revision) || 1 };
    }
  } catch (err: any) {
    if (err?.code !== 'ER_NO_SUCH_TABLE') {
      console.error('Error querying journey_customizer_catalog:', err);
    }
  }
  return { catalog: DEFAULT_JOURNEY_CUSTOMIZER, revision: 1 };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureJourneyTables();

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'all';

    // 1. Load Catalog & Deals
    const { catalog, revision } = await getOrInitCatalog();

    // 2. Load Registered Businesses for Vendor assignment
    const businesses = await query(`
      SELECT b.id, b.name, b.slug, b.type_id, bt.name as type_name, bt.parent_id as parent_type_id,
             b.vendor_phone, b.active
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      ORDER BY b.name ASC
    `).catch(() => []);

    // 3. Load Journey Bookings / PMS requests
    const bookings = await query(`
      SELECT id, request_code, customer_name, customer_phone, customer_email,
             duration_days, travel_dates, adults_count, children_count,
             selected_experiences, accommodation_preference, transport_preference, meal_preference,
             guide_language, interface_language, special_notes,
             estimated_price, discount_amount, final_price,
             selected_business_ids, status, distribution_status,
             itinerary_name, itinerary_summary, custom_details, created_at
      FROM journey_requests
      ORDER BY created_at DESC
      LIMIT 100
    `).catch(() => []);

    // Extract custom crowdsourced items from bookings
    const customQueue: any[] = [];
    bookings.forEach((b: any) => {
      try {
        let details = b.custom_details;
        if (typeof details === 'string') details = JSON.parse(details);
        if (details?.custom_wishes && Array.isArray(details.custom_wishes)) {
          details.custom_wishes.forEach((w: any, idx: number) => {
            customQueue.push({
              request_id: b.id,
              request_code: b.request_code,
              customer_name: b.customer_name,
              customer_phone: b.customer_phone,
              wish_index: idx,
              category: w.category || 'experience',
              title: w.title || w.name,
              start_date: w.start_date || w.requested_date || b.travel_dates,
              start_time: w.start_time || w.requested_time || '10:00 AM',
              end_date: w.end_date || '',
              end_time: w.end_time || '',
              duration: w.duration || '',
              notes: w.notes || '',
              created_at: b.created_at,
              status: w.approved_to_catalog ? 'approved' : 'pending',
            });
          });
        }
      } catch {}
    });

    return NextResponse.json({
      success: true,
      catalog,
      revision,
      businesses,
      bookings,
      customQueue,
    });
  } catch (error: any) {
    console.error('Error in GET /api/jana/journey-planner:', error);
    return NextResponse.json({ error: error?.message || 'Unauthorized or server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureJourneyTables();

    const body = await req.json();
    const { action } = body;

    // Action 1: Update Catalog & Discount percentage / Deals
    if (action === 'save_catalog') {
      const { catalog } = body;
      if (!catalog) {
        return NextResponse.json({ error: 'Catalog data required' }, { status: 400 });
      }

      await execute(`
        CREATE TABLE IF NOT EXISTS journey_customizer_catalog (
          config_key VARCHAR(50) NOT NULL PRIMARY KEY,
          catalog JSON NOT NULL,
          revision INT NOT NULL DEFAULT 1,
          updated_by VARCHAR(100) DEFAULT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
      `);

      await execute(`
        INSERT INTO journey_customizer_catalog (config_key, catalog, revision, updated_by)
        VALUES (?, ?, 1, 'admin')
        ON DUPLICATE KEY UPDATE
          catalog = VALUES(catalog),
          revision = revision + 1,
          updated_by = 'admin',
          updated_at = CURRENT_TIMESTAMP
      `, [CONFIG_KEY, JSON.stringify(catalog)]);

      return NextResponse.json({ success: true, message: 'Catalog saved successfully' });
    }

    // Action 2: Approve Crowdsourced Custom Wish into official catalog
    if (action === 'approve_custom_item') {
      const { wish, target_group, price = 500 } = body;
      if (!wish || !target_group) {
        return NextResponse.json({ error: 'Wish details and target group required' }, { status: 400 });
      }

      const { catalog } = await getOrInitCatalog();
      const newId = `approved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (target_group === 'accommodations') {
        catalog.accommodations.push({
          id: newId,
          is_visible: true,
          vendor_business_ids: [],
          name_en: wish.title,
          name_ar: wish.title_ar || wish.title,
          desc_en: wish.notes || 'Curated community recommendation in Siwa Oasis.',
          desc_ar: wish.notes || 'إقامة مميزة موصى بها من مجتمع سيوة.',
          price_per_night: Number(price) || 800,
          badge_en: 'Verified Local',
          badge_ar: 'محلي موثق',
        });
      } else if (target_group === 'transports') {
        catalog.transports.push({
          id: newId,
          is_visible: true,
          vendor_business_ids: [],
          name_en: wish.title,
          name_ar: wish.title_ar || wish.title,
          desc_en: wish.notes || 'Reliable private transit service in Siwa Oasis.',
          desc_ar: wish.notes || 'خدمة توصيل ونقل موثوقة في سيوة.',
          rate_per_day: Number(price) || 1200,
        });
      } else if (target_group === 'meals') {
        catalog.meals.push({
          id: newId,
          is_visible: true,
          vendor_business_ids: [],
          name_en: wish.title,
          name_ar: wish.title_ar || wish.title,
          desc_en: wish.notes || 'Authentic dining experience in Siwa Oasis.',
          desc_ar: wish.notes || 'تجربة عشاء سيوية تقليدية أصيلة.',
          price_per_person: Number(price) || 250,
        });
      } else {
        // default to experiences
        catalog.experiences.push({
          id: newId,
          is_visible: true,
          vendor_business_ids: [],
          title_en: wish.title,
          title_ar: wish.title_ar || wish.title,
          category: 'Community Discovery',
          category_ar: 'اكتشافات المجتمع',
          duration: wish.duration || '3-4 Hours',
          duration_ar: '٣ - ٤ ساعات',
          base_price_egp: Number(price) || 500,
          highlight_en: wish.notes || 'Verified community discovery in Siwa Oasis.',
          highlight_ar: wish.notes || 'تجربة استكشاف مميزة موثقة في واحة سيوة.',
          icon: '✨',
        });
      }

      await execute(`
        UPDATE journey_customizer_catalog
        SET catalog = ?, revision = revision + 1, updated_by = 'admin'
        WHERE config_key = ?
      `, [JSON.stringify(catalog), CONFIG_KEY]);

      // If tied to a specific journey request, mark as approved in custom_details
      if (wish.request_id) {
        const reqRow = await queryOne<{ custom_details: any }>(
          `SELECT custom_details FROM journey_requests WHERE id = ?`,
          [wish.request_id]
        );
        if (reqRow?.custom_details) {
          let cd = typeof reqRow.custom_details === 'string' ? JSON.parse(reqRow.custom_details) : reqRow.custom_details;
          if (cd?.custom_wishes && Array.isArray(cd.custom_wishes)) {
            cd.custom_wishes.forEach((w: any) => {
              if (w.title === wish.title) w.approved_to_catalog = true;
            });
            await execute(
              `UPDATE journey_requests SET custom_details = ? WHERE id = ?`,
              [JSON.stringify(cd), wish.request_id]
            );
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Item approved and added to catalog', newId });
    }

    // Action 3: Update Booking / Reservation PMS Status
    if (action === 'update_booking_status') {
      const { request_id, status, distribution_status } = body;
      if (!request_id) {
        return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
      }

      await execute(`
        UPDATE journey_requests
        SET status = COALESCE(?, status),
            distribution_status = COALESCE(?, distribution_status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status || null, distribution_status || null, request_id]);

      return NextResponse.json({ success: true, message: 'Booking status updated' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/jana/journey-planner:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
