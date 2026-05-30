import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get('visibleOnly') === 'true';
    const featuredOnly = searchParams.get('featuredOnly') === 'true';

    let sql = 'SELECT * FROM journey_templates';
    const conditions = [];

    if (visibleOnly) conditions.push('is_visible = 1');
    if (featuredOnly) conditions.push('is_featured = 1');

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY display_order ASC';

    const templates = await query(sql);
    
    // Parse JSON fields from strings to arrays
    const parsedTemplates = (templates as any[]).map((template) => ({
      ...template,
      themes: typeof template.themes === 'string' ? JSON.parse(template.themes || '[]') : template.themes,
      services: typeof template.services === 'string' ? JSON.parse(template.services || '[]') : template.services,
      highlights: typeof template.highlights === 'string' ? JSON.parse(template.highlights || '[]') : template.highlights,
      itinerary_details: typeof template.itinerary_details === 'string' ? JSON.parse(template.itinerary_details || '[]') : template.itinerary_details,
      featured_businesses: typeof template.featured_businesses === 'string' ? JSON.parse(template.featured_businesses || '[]') : template.featured_businesses,
      investment_types: typeof template.investment_types === 'string' ? JSON.parse(template.investment_types || '[]') : template.investment_types,
      featured_properties: typeof template.featured_properties === 'string' ? JSON.parse(template.featured_properties || '[]') : template.featured_properties,
      success_stories: typeof template.success_stories === 'string' ? JSON.parse(template.success_stories || '[]') : template.success_stories,
    }));
    
    return NextResponse.json(parsedTemplates, { status: 200 });
  } catch (error) {
    console.error('GET /api/jana/journey-templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      subtitle,
      duration_days,
      themes,
      services,
      featured_image_url,
      icon,
      color,
      highlights,
      itinerary_details,
      featured_businesses,
      estimated_cost_usd_min,
      estimated_cost_usd_max,
      difficulty_level,
      best_season,
      max_group_size,
      admin_notes,
      display_order,
      is_investment_journey,
      investment_types,
      investment_description,
      minimum_investment_usd,
      estimated_roi_percent,
      investment_partner_name,
      investment_partner_contact,
      featured_properties,
      success_stories,
      requirements_text,
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields: id, name' }, { status: 400 });
    }

    const sql = `
      INSERT INTO journey_templates (
        id, name, description, subtitle, duration_days, themes, services,
        featured_image_url, icon, color, highlights, itinerary_details,
        featured_businesses, estimated_cost_usd_min, estimated_cost_usd_max,
        difficulty_level, best_season, max_group_size, admin_notes, display_order,
        is_investment_journey, investment_types, investment_description, minimum_investment_usd,
        estimated_roi_percent, investment_partner_name, investment_partner_contact,
        featured_properties, success_stories, requirements_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        subtitle = VALUES(subtitle),
        duration_days = VALUES(duration_days),
        themes = VALUES(themes),
        services = VALUES(services),
        featured_image_url = VALUES(featured_image_url),
        icon = VALUES(icon),
        color = VALUES(color),
        highlights = VALUES(highlights),
        itinerary_details = VALUES(itinerary_details),
        featured_businesses = VALUES(featured_businesses),
        estimated_cost_usd_min = VALUES(estimated_cost_usd_min),
        estimated_cost_usd_max = VALUES(estimated_cost_usd_max),
        difficulty_level = VALUES(difficulty_level),
        best_season = VALUES(best_season),
        max_group_size = VALUES(max_group_size),
        admin_notes = VALUES(admin_notes),
        display_order = VALUES(display_order),
        is_investment_journey = VALUES(is_investment_journey),
        investment_types = VALUES(investment_types),
        investment_description = VALUES(investment_description),
        minimum_investment_usd = VALUES(minimum_investment_usd),
        estimated_roi_percent = VALUES(estimated_roi_percent),
        investment_partner_name = VALUES(investment_partner_name),
        investment_partner_contact = VALUES(investment_partner_contact),
        featured_properties = VALUES(featured_properties),
        success_stories = VALUES(success_stories),
        requirements_text = VALUES(requirements_text)
    `;

    await query(sql, [
      id,
      name,
      description,
      subtitle,
      duration_days,
      JSON.stringify(themes || []),
      JSON.stringify(services || []),
      featured_image_url,
      icon,
      color,
      JSON.stringify(highlights || []),
      JSON.stringify(itinerary_details || []),
      JSON.stringify(featured_businesses || []),
      estimated_cost_usd_min,
      estimated_cost_usd_max,
      difficulty_level,
      best_season,
      max_group_size,
      admin_notes,
      display_order || 0,
      is_investment_journey ? 1 : 0,
      JSON.stringify(investment_types || []),
      investment_description || null,
      minimum_investment_usd || 0,
      estimated_roi_percent || 0,
      investment_partner_name || null,
      investment_partner_contact || null,
      JSON.stringify(featured_properties || []),
      JSON.stringify(success_stories || []),
      requirements_text || null,
    ]);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/jana/journey-templates:', error);
    return NextResponse.json({ error: 'Failed to create/update template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_visible, is_featured, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 });
    }

    const updates = [];
    const params = [];

    if (typeof is_visible === 'boolean') {
      updates.push('is_visible = ?');
      params.push(is_visible);
    }

    if (typeof is_featured === 'boolean') {
      updates.push('is_featured = ?');
      params.push(is_featured);
    }

    if (typeof display_order === 'number') {
      updates.push('display_order = ?');
      params.push(display_order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(id);
    const sql = `UPDATE journey_templates SET ${updates.join(', ')} WHERE id = ?`;

    await query(sql, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/jana/journey-templates:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 });
    }

    await query('DELETE FROM journey_templates WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/jana/journey-templates:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
