import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser, requireAdmin, requireVendor } from '@/lib/auth';
import { DEFAULT_JOURNEY_CUSTOMIZER, type JourneyCustomizerCatalog } from '@/lib/journey-customizer-catalog';
import { ensureJourneyTables } from '@/lib/journey-request-store';
import crypto from 'crypto';

async function loadJourneyCatalog(): Promise<{ catalog: JourneyCustomizerCatalog; revision: number }> {
  let row: { catalog: unknown; revision: number } | null;
  try {
    row = await queryOne<{ catalog: unknown; revision: number }>(
      'SELECT catalog, revision FROM journey_customizer_catalog WHERE config_key = ? LIMIT 1',
      ['default']
    );
  } catch (error: any) {
    if (error?.code !== 'ER_NO_SUCH_TABLE') throw error;
    row = null;
  }
  if (!row?.catalog) return { catalog: DEFAULT_JOURNEY_CUSTOMIZER, revision: 0 };
  return {
    catalog: typeof row.catalog === 'string' ? JSON.parse(row.catalog) : row.catalog as JourneyCustomizerCatalog,
    revision: Number(row.revision) || 0,
  };
}

/**
 * POST /api/journeys/custom-dispatch
 * Dispatches a visitor's customized tour requirements to selected businesses & creates tracking records
 */
export async function POST(req: NextRequest) {
  try {
    await ensureJourneyTables();
    const body = await req.json();
    const { catalog, revision: catalogRevision } = await loadJourneyCatalog();
    const {
      customer_name,
      customer_phone,
      customer_email = '',
      duration_days = 3,
      travel_dates = '',
      adults_count = 2,
      children_count = 0,
      selected_experience_ids,
      selected_experiences = [],
      accommodation_id,
      transport_id,
      meal_id,
      accommodation_preference,
      transport_preference,
      meal_preference,
      interface_language = 'en',
      guide_language = 'English',
      special_notes = '',
    } = body;

    if (!customer_name?.trim() || !customer_phone?.trim()) {
      return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
    }

    const interfaceLanguage = interface_language === 'ar' ? 'ar' : 'en';
    const dayCount = Math.max(1, Math.min(30, Number.parseInt(String(duration_days), 10) || 3));
    const adults = Math.max(1, Math.min(30, Number(adults_count) || 1));
    const children = Math.max(0, Math.min(30, Number(children_count) || 0));
    const totalGuests = adults + children;
    const requestedExperienceIds: string[] = Array.isArray(selected_experience_ids)
      ? selected_experience_ids.map(String)
      : (Array.isArray(selected_experiences) ? selected_experiences.map((item: any) => String(item?.id || item)) : []);
    const uniqueExperienceIds = [...new Set(requestedExperienceIds)];
    const selectedExperienceItems = uniqueExperienceIds.map(itemId => catalog.experiences.find(item => item.id === itemId && item.is_visible));

    if (selectedExperienceItems.some(item => !item)) {
      return NextResponse.json({ error: 'One or more selected experiences are no longer available.' }, { status: 400 });
    }
    if (selectedExperienceItems.length === 0) {
      return NextResponse.json({ error: 'Select at least one available experience.' }, { status: 400 });
    }

    const resolveItem = <T extends { id: string; is_visible: boolean; vendor_business_ids: string[]; name_en?: string; name_ar?: string }>(items: T[], id: unknown, legacyName: unknown) => {
      const key = typeof id === 'string' ? id : '';
      if (key) return items.find(item => item.id === key && item.is_visible) || null;
      const name = typeof legacyName === 'string' ? legacyName : '';
      return items.find(item => item.is_visible && (item.name_en === name || item.name_ar === name)) || null;
    };

    const stayItem = resolveItem(catalog.accommodations, accommodation_id, accommodation_preference);
    const transportItem = resolveItem(catalog.transports, transport_id, transport_preference);
    const mealItem = resolveItem(catalog.meals, meal_id, meal_preference);
    if ((accommodation_id && !stayItem) || (transport_id && !transportItem) || (meal_id && !mealItem)) {
      return NextResponse.json({ error: 'One or more selected options are no longer available.' }, { status: 400 });
    }

    const experiencesSubtotal = selectedExperienceItems.reduce((sum, item) => sum + (
      item ? item.base_price_egp * adults + item.base_price_egp * 0.5 * children : 0
    ), 0);
    const nights = Math.max(1, dayCount - 1);
    const staySubtotal = stayItem ? stayItem.price_per_night * nights : 0;
    const transportSubtotal = transportItem ? transportItem.rate_per_day * dayCount : 0;
    const mealsSubtotal = mealItem ? mealItem.price_per_person * (adults + children * 0.5) * dayCount : 0;
    const estimatedPrice = experiencesSubtotal + staySubtotal + transportSubtotal + mealsSubtotal;
    const discountPercent = uniqueExperienceIds.length >= 3 ? Number(catalog.bundle_discount_percent) || 0 : 0;
    const discountAmount = Math.round(estimatedPrice * discountPercent / 100);
    const finalPrice = Math.max(0, estimatedPrice - discountAmount);
    const localizedName = (item: { name_en?: string; name_ar?: string } | null) => item
      ? (interfaceLanguage === 'ar' ? item.name_ar : item.name_en) || item.id
      : 'None';

    const experienceSnapshots = selectedExperienceItems.map(item => ({
      ...item,
      title: interfaceLanguage === 'ar' ? item!.title_ar : item!.title_en,
      price: item!.base_price_egp,
    }));
    const optionSnapshot = (item: any, price: number) => item ? ({
      id: item.id,
      title_en: item.name_en,
      title_ar: item.name_ar,
      title: interfaceLanguage === 'ar' ? item.name_ar : item.name_en,
      description_en: item.desc_en,
      description_ar: item.desc_ar,
      price,
      vendor_business_ids: item.vendor_business_ids || [],
    }) : null;

    const catalogSnapshot = {
      interface_language: interfaceLanguage,
      catalog_revision: catalogRevision,
      bundle_discount_percent: discountPercent,
      experiences: experienceSnapshots,
      accommodation: optionSnapshot(stayItem, stayItem?.price_per_night || 0),
      transport: optionSnapshot(transportItem, transportItem?.rate_per_day || 0),
      meal: optionSnapshot(mealItem, mealItem?.price_per_person || 0),
    };
    const selectedBusinessIds = [...new Set([
      ...experienceSnapshots.flatMap(item => item!.vendor_business_ids || []),
      ...(stayItem?.vendor_business_ids || []),
      ...(transportItem?.vendor_business_ids || []),
      ...(mealItem?.vendor_business_ids || []),
    ])];
    const activeBusinessIds = selectedBusinessIds.length
      ? await query(`SELECT id FROM businesses WHERE active = 1 AND id IN (${selectedBusinessIds.map(() => '?').join(',')})`, selectedBusinessIds).then(rows => rows.map((row: any) => String(row.id))).catch(() => [])
      : [];
    const dispatchStatus = activeBusinessIds.length ? 'dispatched' : 'admin_review';

    const requestCode = `SIW-${Math.floor(100000 + Math.random() * 900000)}`;
    const expTitles = experienceSnapshots.map(item => item!.title).join(', ');
    const stayTitle = localizedName(stayItem);
    const transportTitle = localizedName(transportItem);
    const mealTitle = localizedName(mealItem);
    const itinerarySummary = `Custom ${dayCount}-Day Siwa Journey: ${expTitles}. Stay: ${stayTitle}, Transport: ${transportTitle}, Meals: ${mealTitle}.`;
    const customDetails = {
      catalog_snapshot: catalogSnapshot,
      selected_experiences: experienceSnapshots,
      accommodation_preference: stayTitle,
      transport_preference: transportTitle,
      meal_preference: mealTitle,
      guide_language: guide_language || 'English',
      interface_language: interfaceLanguage,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      estimated_price: estimatedPrice,
      final_price: finalPrice,
    };

    const idColumn = (await query<{ Type: string; Extra: string }>("SHOW COLUMNS FROM journey_requests LIKE 'id'"))[0];
    const usesAutoIncrementId = Boolean(idColumn?.Extra?.toLowerCase().includes('auto_increment'));
    const requestedId = usesAutoIncrementId ? null : crypto.randomUUID();
    const requestRecord: Record<string, unknown> = {
      request_code: requestCode,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email.trim(),
      duration_days: dayCount,
      travel_dates,
      adults_count: adults,
      children_count: children,
      selected_experiences: JSON.stringify(experienceSnapshots),
      accommodation_preference: stayTitle,
      transport_preference: transportTitle,
      meal_preference: mealTitle,
      guide_language: guide_language || 'English',
      interface_language: interfaceLanguage,
      catalog_revision: catalogRevision,
      special_notes,
      estimated_price: estimatedPrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      selected_business_ids: JSON.stringify(activeBusinessIds),
      status: 'open',
      distribution_status: dispatchStatus,
      request_type: 'journey',
      budget: finalPrice > 0 ? `${finalPrice} EGP` : 'Custom Quote',
      duration: `${dayCount} Days`,
      group_size: totalGuests,
      arrival_date: travel_dates || 'Flexible',
      special_requests: special_notes || '',
      itinerary_name: `Siwa ${dayCount}-Day Custom Experience [${requestCode}]`,
      itinerary_summary: itinerarySummary,
      custom_details: JSON.stringify(customDetails),
    };
    if (requestedId) requestRecord.id = requestedId;
    const columns = Object.keys(requestRecord);
    const insertResult = await execute(
      `INSERT INTO journey_requests (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      Object.values(requestRecord)
    );
    const id = requestedId || String(insertResult.insertId);

    const dispatches: any[] = [];
    for (const bizId of activeBusinessIds) {
      const dispatchId = crypto.randomUUID();
      try {
        await execute(
          `INSERT INTO journey_vendor_dispatches (id, request_id, business_id, role, vendor_status)
           VALUES (?, ?, ?, 'matched_provider', 'pending')`,
          [dispatchId, id, bizId]
        );

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
      } catch {}
    }

    // Build Formatted WhatsApp Dispatch Message for Visitor / Admin / Vendors
    const experiencesList = experienceSnapshots
      .map(item => `• ${encodeURIComponent(item!.title || item!.id)}`)
      .join('%0A');

    const formattedWhatsAppSummary = 
      `*🌟 NEW SIWIFY CUSTOM JOURNEY [${requestCode}]*%0A` +
      `----------------------------------------%0A` +
      `👤 *Traveler:* ${encodeURIComponent(customer_name)}%0A` +
      `📞 *Phone:* ${encodeURIComponent(customer_phone)}%0A` +
      `⏱️ *Duration:* ${dayCount} Days / ${travel_dates ? encodeURIComponent(travel_dates) : 'Flexible Dates'}%0A` +
      `👥 *Guests:* ${adults} Adults${children > 0 ? `, ${children} Children` : ''}%0A` +
      `🛏️ *Stay Style:* ${encodeURIComponent(stayTitle)}%0A` +
      `🚙 *Transport:* ${encodeURIComponent(transportTitle)}%0A` +
      `🍽️ *Dining:* ${encodeURIComponent(mealTitle)}%0A` +
      `🗣️ *Guide Language:* ${encodeURIComponent(guide_language)}%0A` +
      `----------------------------------------%0A` +
      `🎯 *Selected Experiences:*%0A${experiencesList}%0A` +
      `----------------------------------------%0A` +
      `💰 *Estimated Total:* ${finalPrice > 0 ? `${finalPrice} EGP` : 'Custom Quote'}` +
      (discountAmount > 0 ? ` _(Saved ${discountAmount} EGP with ${discountPercent}% Bundle Discount!)_` : '') + `%0A` +
      (special_notes ? `📝 *Notes:* ${encodeURIComponent(special_notes)}%0A` : '') +
      `----------------------------------------%0A` +
      `👉 Track on SiWiFy Portal: https://siwify.com/visitor/journey-request/${id}`;

    return NextResponse.json({
      success: true,
      id,
      request_code: requestCode,
      whatsapp_summary_text: formattedWhatsAppSummary,
      dispatched_vendors: dispatches
    }, { status: 201 });

  } catch (e: any) {
    const statusCode = e?.message?.includes('authenticated') || e?.message?.includes('Admin access') || e?.message?.includes('Vendor access') ? 403 : 500;
    return NextResponse.json({ error: e.message }, { status: statusCode });
  }
}

/**
 * GET /api/journeys/custom-dispatch
 * Retrieve journey requests for admin, visitor, or vendor inquiries
 */
export async function GET(req: NextRequest) {
  try {
    await ensureJourneyTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');
    const requestedBusinessId = searchParams.get('vendor_business_id');
    let vendorBusinessId: string | null = null;
    const sessionUser = await getCurrentUser();
    const adminRoles = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];
    const isAdmin = Boolean(sessionUser && adminRoles.includes(sessionUser.role));

    if (requestedBusinessId) {
      const user = await requireVendor();
      if (user.role === 'vendor') {
        if (!user.businessId || user.businessId !== requestedBusinessId) {
          return NextResponse.json({ error: 'Vendor access denied' }, { status: 403 });
        }
        vendorBusinessId = user.businessId;
      } else {
        vendorBusinessId = requestedBusinessId;
      }
    } else if (!id) {
      await requireAdmin();
    }

    if (id) {
      const request = vendorBusinessId
        ? await queryOne(
          `SELECT jr.* FROM journey_requests jr
           INNER JOIN journey_vendor_dispatches jvd ON jvd.request_id = jr.id AND jvd.business_id = ?
           WHERE jr.id = ? OR jr.request_code = ? LIMIT 1`,
          [vendorBusinessId, id, id]
        ) as any
        : await queryOne(
          `SELECT jr.* FROM journey_requests jr WHERE jr.id = ? OR jr.request_code = ?`,
          [id, id]
        ) as any;

      if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

      const dispatches = isAdmin || vendorBusinessId ? await query(
        `SELECT jvd.*, b.name as business_name, b.slug as business_slug
         FROM journey_vendor_dispatches jvd
         JOIN businesses b ON jvd.business_id = b.id
         WHERE jvd.request_id = ? ${vendorBusinessId ? 'AND jvd.business_id = ?' : ''}`,
        vendorBusinessId ? [request.id, vendorBusinessId] : [request.id]
      ) : [];

      // Also fetch any formal offers submitted by vendors
      let offers: any[] = [];
      try {
        offers = await query(
          `SELECT o.*, b.name as business_name, b.slug as business_slug
           FROM journey_offers o
           LEFT JOIN businesses b ON o.business_id = b.id
           WHERE o.journey_id = ? ${vendorBusinessId ? 'AND o.business_id = ?' : isAdmin ? '' : `AND o.status = 'accepted'`} ORDER BY o.created_at DESC`,
          vendorBusinessId ? [request.id, vendorBusinessId] : [request.id]
        ) as any[];
      } catch {}

      const canSeeContact = isAdmin || (Boolean(vendorBusinessId) && Boolean(request.reveal_contact));
      const safeRequest = canSeeContact ? request : {
        ...request,
        customer_name: 'Marketplace Guest',
        customer_email: null,
        customer_phone: null,
      };
      return NextResponse.json({
        ...safeRequest,
        selected_experiences: typeof request.selected_experiences === 'string' ? JSON.parse(request.selected_experiences) : request.selected_experiences || [],
        custom_details: typeof request.custom_details === 'string' ? JSON.parse(request.custom_details) : request.custom_details || {},
        dispatches,
        offers
      });
    }

    let sql = vendorBusinessId
      ? `SELECT jr.*, jvd.business_id AS assigned_business_id, jvd.vendor_status AS vendor_status
         FROM journey_requests jr
         INNER JOIN journey_vendor_dispatches jvd ON jvd.request_id = jr.id
         WHERE jvd.business_id = ? `
      : `SELECT * FROM journey_requests WHERE 1=1 `;
    const params: any[] = vendorBusinessId ? [vendorBusinessId] : [];

    if (phone) {
      sql += ` AND customer_phone = ? `;
      params.push(phone);
    }
    if (status && status !== 'all') {
      sql += ` AND status = ? `;
      params.push(status);
    }
    sql += vendorBusinessId ? ` ORDER BY jr.created_at DESC LIMIT 100 ` : ` ORDER BY created_at DESC LIMIT 100 `;
    const rows = await query(sql, params) as any[];

    return NextResponse.json(rows.map((r) => ({
      ...r,
      ...(vendorBusinessId && !r.reveal_contact ? { customer_name: 'Marketplace Guest', customer_email: null, customer_phone: null } : {}),
      selected_experiences: typeof r.selected_experiences === 'string' ? JSON.parse(r.selected_experiences) : r.selected_experiences || [],
      custom_details: typeof r.custom_details === 'string' ? JSON.parse(r.custom_details) : r.custom_details || {}
    })));
  } catch (e: any) {
    const statusCode = e?.message?.includes('authenticated') || e?.message?.includes('Admin access') || e?.message?.includes('Vendor access') ? 403 : 500;
    return NextResponse.json({ error: e.message }, { status: statusCode });
  }
}

/**
 * PATCH /api/journeys/custom-dispatch
 * Update status of request or vendor dispatch (Accept, Decline, Quote, Reassign)
 */
export async function PATCH(req: NextRequest) {
  try {
    await ensureJourneyTables();
    const body = await req.json();
    const { id, request_id, business_id, status, vendor_status, quoted_price, vendor_notes } = body;

    if (request_id && vendor_status) {
      const sessionUser = await getCurrentUser();
      if (!sessionUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const adminRoles = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];
      const isAdmin = adminRoles.includes(sessionUser.role);
      const effectiveBusinessId = isAdmin ? String(business_id || '') : String((await requireVendor()).businessId || '');
      if (!effectiveBusinessId) return NextResponse.json({ error: 'Vendor business is required' }, { status: 400 });
      if (!['pending', 'dispatched', 'accepted', 'declined', 'quoted'].includes(vendor_status)) {
        return NextResponse.json({ error: 'Invalid vendor status' }, { status: 400 });
      }

      const requestRow = await queryOne('SELECT id FROM journey_requests WHERE id = ?', [request_id]);
      if (!requestRow) return NextResponse.json({ error: 'Journey request not found' }, { status: 404 });
      const existingDispatch = await queryOne(
        'SELECT id FROM journey_vendor_dispatches WHERE request_id = ? AND business_id = ? LIMIT 1',
        [request_id, effectiveBusinessId]
      );
      if (!existingDispatch && !isAdmin) return NextResponse.json({ error: 'This request is not assigned to your business' }, { status: 403 });
      if (!existingDispatch && isAdmin) {
        await execute(
          `INSERT INTO journey_vendor_dispatches (id, request_id, business_id, role, vendor_status)
           VALUES (?, ?, ?, 'admin_assigned', ?)`,
          [crypto.randomUUID(), request_id, effectiveBusinessId, vendor_status]
        );
      } else {
        await execute(
          `UPDATE journey_vendor_dispatches
           SET vendor_status = ?, quoted_price = ?, vendor_notes = ?
           WHERE request_id = ? AND business_id = ?`,
          [vendor_status, quoted_price ? Number(quoted_price) : null, vendor_notes || null, request_id, effectiveBusinessId]
        );
      }

      await execute(`UPDATE journey_requests SET distribution_status = 'dispatched' WHERE id = ? AND distribution_status = 'admin_review'`, [request_id]);
      return NextResponse.json({ success: true, message: `Vendor response recorded as ${vendor_status}` });
    }

    // Master journey request status is an admin-only action.
    if (id && status) {
      await requireAdmin();
      await execute(`UPDATE journey_requests SET status = ? WHERE id = ?`, [status, id]);
      return NextResponse.json({ success: true, message: `Request status updated to ${status}` });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (e: any) {
    const status = e?.message?.includes('authenticated') || e?.message?.includes('Admin access') || e?.message?.includes('Vendor access') ? 403 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
