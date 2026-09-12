import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, execute, queryOne } from '@/lib/db';
import { parseHospitalityRawText } from '@/lib/hospitality-mapper';
import crypto from 'crypto';

/**
 * PASTE & IMPORT API
 * Parses pasted text from Booking.com, TripAdvisor, OTA listings, or social profiles
 * and maps the data to our structured section schema.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { action = 'parse', text = '', businessId, typeId = 'hotel', parentId = 'accommodation', customSlug } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text content is required for parsing' }, { status: 400 });
    }

    // 1. Parse raw text into structured section model
    const parsedData = parseHospitalityRawText(text);

    // If just parsing/previewing, return the structured preview
    if (action === 'parse') {
      return NextResponse.json({
        success: true,
        preview: parsedData,
        summary: {
          name: parsedData.basic.name || 'Unnamed Property',
          rating: parsedData.testimonials.rating || null,
          reviews_count: parsedData.testimonials.reviews_count || 0,
          pools_count: parsedData.facilities.pools_count || 0,
          room_types_count: (parsedData.rooms?.room_types || []).length,
          reviews_highlights_count: (parsedData.testimonials.review_highlights || []).length,
          has_hot_spring: Boolean(parsedData.facilities.hot_spring),
          has_restaurant: Boolean(parsedData.gastronomy.restaurant_name),
        }
      });
    }

    // 2. Action === 'save': Save or update into database
    if (action === 'save') {
      const name = parsedData.basic.name || 'Imported Hospitality Business';
      const rawSlug = customSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = rawSlug || `biz-${Date.now()}`;

      // Build complete custom_data JSON
      const customData = {
        basic: parsedData.basic,
        facilities: parsedData.facilities,
        gastronomy: parsedData.gastronomy,
        experience: parsedData.experience,
        rooms: parsedData.rooms,
        testimonials: parsedData.testimonials,
        location: parsedData.location,
        connector: parsedData.connector,
        vibe: parsedData.vibe,
        active_minisite_sections: parsedData.active_minisite_sections,
        source_provenance: {
          source_mode: 'paste_import',
          imported_by: user?.email || 'admin@siwify.com',
          imported_at: new Date().toISOString(),
          source_url: parsedData.basic.booking_url || '',
        }
      };

      if (businessId) {
        // Update existing business
        await execute(
          `UPDATE businesses 
           SET custom_data = ?, 
               name = COALESCE(NULLIF(?, ''), name),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [JSON.stringify(customData), name, businessId]
        );
        return NextResponse.json({ success: true, message: 'Business updated successfully', businessId, slug });
      } else {
        // Create new business listing
        const res = await execute(
          `INSERT INTO businesses 
           (name, slug, type_id, status, published, approved_by_vendor, custom_data, created_at, updated_at) 
           VALUES (?, ?, ?, 'active', 1, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [name, slug, typeId, JSON.stringify(customData)]
        ) as any;

        const newId = res.insertId;
        return NextResponse.json({
          success: true,
          message: 'Business created and imported successfully',
          businessId: newId,
          slug
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[PASTE-IMPORT ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
