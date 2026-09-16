import { NextResponse } from 'next/server';
import { query as safeQuery } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { tags, category, engineId, childType, minimumPassengers } = await request.json();

    const categoryAliases: Record<string, string[]> = {
      accommodation: ['accommodation', 'hotel', 'lodge', 'resort', 'camp'],
      transportation: ['transportation', 'transport', 'logistics', 'transfer', 'taxi', 'rental'],
      restaurant: ['restaurant', 'food', 'cafe', 'dining'],
      activity: ['activity', 'adventure', 'tour', 'experience', 'attraction'],
    };
    const normalizedCategory = typeof category === 'string' ? category.trim().toLowerCase() : '';
    const categoryTerms = categoryAliases[normalizedCategory] || (normalizedCategory ? [normalizedCategory] : []);

    if ((!tags || !Array.isArray(tags) || tags.length === 0) && categoryTerms.length === 0) {
      const all: any = await safeQuery(`
        SELECT b.*, bt.name as type_name 
        FROM businesses b
        JOIN business_types bt ON b.type_id = bt.id
        WHERE b.status = 'active' AND b.published = 1
        ORDER BY b.is_featured DESC, b.is_recommended DESC, b.is_trusted DESC, b.views DESC
        LIMIT 20
      `);
      return NextResponse.json(all);
    }

    // 1. Resolve which fields/paths we should search
    let searchablePaths = ['$.experience_vibe.vibe_tags', '$.vibe.vibe_tags']; // Default

    if (normalizedCategory === 'transportation') {
      searchablePaths = [
        '$.sec_1_identity.service_model',
        '$.sec_2_ambience.travel_style',
        '$.sec_2_ambience.comfort_level',
        '$.sec_2_ambience.vehicle_types',
        '$.sec_3_facilities.vehicle_types',
        '$.sec_3_facilities.vehicle_features',
        '$.sec_3_facilities.accessibility_features',
        '$.sec_3_facilities.equipment_available',
        '$.sec_3_services.vehicle_types',
        '$.sec_4_gastronomy.journey_services',
        '$.sec_4_gastronomy.route_types',
        '$.sec_4_gastronomy.pickup_options',
        '$.sec_6_guardian.driver_requirements',
        '$.sec_8_connector.pricing_model',
        '$.sec_8_connector.payment_methods',
      ];
    }

    if (normalizedCategory === 'restaurant') {
      searchablePaths = [
        '$.sec_1_identity.restaurant_concept',
        '$.sec_2_ambience.seating_style',
        '$.sec_3_facilities.facilities',
        '$.sec_4_gastronomy.cuisine_types',
        '$.sec_4_gastronomy.dietary_options',
        '$.sec_4_gastronomy.menu_courses',
        '$.sec_4_gastronomy.price_range',
        '$.sec_5_experiences.signature_experiences',
        '$.sec_6_guardian.service_options',
        '$.sec_6_guardian.reservation_methods',
        '$.sec_8_connector.payment_methods',
      ];
    }

    if (normalizedCategory === 'food') {
      searchablePaths = [
        '$.sec_1_identity.restaurant_concept',
        '$.sec_2_ambience.seating_style',
        '$.sec_3_facilities.facilities',
        '$.sec_4_gastronomy.cuisine_types',
        '$.sec_4_gastronomy.dietary_options',
        '$.sec_4_gastronomy.menu_courses',
        '$.sec_4_gastronomy.price_range',
        '$.sec_6_guardian.service_options',
        '$.sec_6_guardian.reservation_methods',
      ];
    }

    if (engineId) {
      const engine: any = await safeQuery(`
        SELECT se.allowed_fields 
        FROM search_engines se 
        WHERE se.id = ?`, [engineId]
      );
      
      if (engine[0]?.allowed_fields) {
        const fieldNames = typeof engine[0].allowed_fields === 'string' ? JSON.parse(engine[0].allowed_fields) : engine[0].allowed_fields;
        
        // Fetch section_id for each field to build the JSON path, filtered by is_filterable governance
        const fields: any[] = await safeQuery(
          `SELECT ff.name, ff.section_id 
           FROM form_fields ff
           JOIN sections s ON ff.section_id = s.id
           WHERE ff.name IN (${fieldNames.map(() => '?').join(',')})
           AND s.is_filterable = 1`,
          fieldNames
        );
        
        searchablePaths = fields.map(f => `$.${f.section_id}.${f.name}`);
      }
    }

    /**
     * DYNAMIC JSON SEARCH
     * For each tag, it must exist in AT LEAST ONE of the searchable paths.
     * All selected tags must be satisfied (Intersection).
     */
    const conditions: string[] = [];
    const params: any[] = [];

    if (categoryTerms.length > 0) {
      conditions.push(`(${categoryTerms.map(() => '(LOWER(bt.id) = ? OR LOWER(bt.name) LIKE ? OR LOWER(parent_bt.id) = ? OR LOWER(parent_bt.name) LIKE ?)').join(' OR ')})`);
      categoryTerms.forEach(term => {
        params.push(term, `%${term}%`, term, `%${term}%`);
      });
    }

    if (typeof childType === 'string' && childType.trim()) {
      conditions.push('LOWER(bt.id) = ?');
      params.push(childType.trim().toLowerCase());
    }

    (Array.isArray(tags) ? tags : []).forEach(tag => {
      const pathConditions = searchablePaths.map(path => {
        params.push(tag);
        return `JSON_CONTAINS(custom_data, JSON_QUOTE(?), '${path}')`;
      }).join(' OR ');
      conditions.push(`(${pathConditions})`);
    });

    if (normalizedCategory === 'transportation' && Number.isFinite(Number(minimumPassengers)) && Number(minimumPassengers) > 0) {
      conditions.push(`(
        CAST(JSON_UNQUOTE(JSON_EXTRACT(custom_data, '$.sec_3_facilities.passenger_capacity')) AS DECIMAL(10, 2)) >= ?
        OR CAST(JSON_UNQUOTE(JSON_EXTRACT(custom_data, '$.sec_3_facilities.tuk_tuk_capacity')) AS DECIMAL(10, 2)) >= ?
        OR CAST(JSON_UNQUOTE(JSON_EXTRACT(custom_data, '$.sec_3_facilities.airport_transfer_capacity')) AS DECIMAL(10, 2)) >= ?
      )`);
      params.push(Number(minimumPassengers), Number(minimumPassengers), Number(minimumPassengers));
    }

    const results: any = await safeQuery(`
      SELECT b.*, bt.name as type_name 
      FROM businesses b
      JOIN business_types bt ON b.type_id = bt.id
      LEFT JOIN business_types parent_bt ON bt.parent_id = parent_bt.id
      WHERE b.status = 'active' AND b.published = 1 AND ${conditions.join(' AND ')}
      ORDER BY b.is_featured DESC, b.is_recommended DESC, b.is_trusted DESC, b.views DESC
    `, params);
    
    // --- GOVERNANCE: FILTER CUSTOM DATA BY SECTION VISIBILITY ---
    const hiddenSections = await safeQuery('SELECT id FROM sections WHERE show_on_card = 0');
    const hiddenIds = hiddenSections.map((s: any) => s.id);

    const filteredResults = results.map((biz: any) => {
      try {
        const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : (biz.custom_data || {});
        hiddenIds.forEach((id: string) => {
          if (data[id]) delete data[id];
        });
        return { ...biz, custom_data: data };
      } catch (e) {
        return biz;
      }
    });

    return NextResponse.json(filteredResults);

  } catch (error: any) {
    console.error('Vibe Search Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
