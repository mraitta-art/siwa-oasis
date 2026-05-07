import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSections, invalidateCache } from '@/lib/cache';

/**
 * GET Sections
 * Public: If type param is provided (returns sections for that typology)
 * Private: Otherwise (requires admin, returns all sections)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeId = searchParams.get('type');

  try {
    // 1. If typeId is provided, fetch sections mapped to that typology (Public)
    if (typeId) {
      const [typeData] = await query('SELECT sections, own_sections FROM business_types WHERE id = ?', [typeId]);
      if (!typeData) return NextResponse.json([]);

      // Combine both sections and own_sections arrays
      const sectionIds = [
        ...(typeof typeData.sections === 'string' ? JSON.parse(typeData.sections || '[]') : typeData.sections || []),
        ...(typeof typeData.own_sections === 'string' ? JSON.parse(typeData.own_sections || '[]') : typeData.own_sections || [])
      ];
      
      if (sectionIds.length === 0) return NextResponse.json([]);

      const placeholders = sectionIds.map(() => '?').join(',');
      const sections = await query(`SELECT * FROM sections WHERE id IN (${placeholders})`, sectionIds);
      
      // Enforce DNA Order: Sort sections exactly as they are ordered in the parent's JSON array
      const sortedSections = sections.sort((a: any, b: any) => sectionIds.indexOf(a.id) - sectionIds.indexOf(b.id));
      
      return NextResponse.json(sortedSections);
    }

    // 2. Otherwise, require admin to see all sections
    await requireAdmin();
    const sections = await getSections(true);
    return NextResponse.json(sections);
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });
    // Enforce: non-universal sections must have a parent
    if (!is_universal && !business_type_id) {
      return NextResponse.json({ error: 'A Master Parent business type is required for non-universal sections.' }, { status: 400 });
    }

    await execute(
      `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, icon || 'fa-info-circle', required || false, vendor_editable !== false, show_on_public !== false, is_filterable || false, show_on_card || false, is_universal || false, section_type || 'general', description || null, inheritance_rules ? (typeof inheritance_rules === 'string' ? inheritance_rules : JSON.stringify(inheritance_rules)) : null, display_order || 0, sort_order || 0, active !== false, business_type_id || null]
    );

    // --- AUTO-GENESIS: Materialize DNA Fields ---
    const structuralFields = [
      { name: 'feature_on_main', label: 'FEATURE ON MAIN WEBSITE', type: 'boolean', order: -3, help: 'Toggle this to promote to homepage.' },
      { name: 'section_news', label: 'Carousel Cinematic Teaser', type: 'text', order: -2, help: 'Short text for carousel captions.' },
      { name: 'section_gallery', label: 'Section Gallery (Serialized Captions)', type: 'gallery', order: -1, help: 'Section photos with captions.' },
      { name: 'section_blog', label: 'Master Section Story (Rich Text)', type: 'rich_text', order: 1, help: 'Full rich-text story for this section.' }
    ];

    for (const field of structuralFields) {
      const fid = `auto_${id}_${field.name}`;
      await execute(
        `INSERT IGNORE INTO form_fields 
        (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, required_feature, acl, validation)
        VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 0, ?, ?, 'template', 'hero_automation', ?, ?)`,
        [
          fid, id, field.name, field.label, field.type, field.help, field.order,
          JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] }),
          JSON.stringify({})
        ]
      );
    }
    
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = [];
    const params: any[] = [];
    if (name !== undefined) { updates.push('name=?'); params.push(name); }
    if (icon !== undefined) { updates.push('icon=?'); params.push(icon); }
    if (required !== undefined) { updates.push('required=?'); params.push(required); }
    if (vendor_editable !== undefined) { updates.push('vendor_editable=?'); params.push(vendor_editable); }
    if (show_on_public !== undefined) { updates.push('show_on_public=?'); params.push(show_on_public); }
    if (is_filterable !== undefined) { updates.push('is_filterable=?'); params.push(is_filterable); }
    if (show_on_card !== undefined) { updates.push('show_on_card=?'); params.push(show_on_card); }
    if (is_universal !== undefined) { updates.push('is_universal=?'); params.push(is_universal); }
    if (section_type !== undefined) { updates.push('section_type=?'); params.push(section_type); }
    if (description !== undefined) { updates.push('description=?'); params.push(description); }
    if (inheritance_rules !== undefined) { updates.push('inheritance_rules=?'); params.push(typeof inheritance_rules === 'string' ? inheritance_rules : JSON.stringify(inheritance_rules)); }
    if (display_order !== undefined) { updates.push('display_order=?'); params.push(display_order); }
    if (sort_order !== undefined) { updates.push('sort_order=?'); params.push(sort_order); }
    if (active !== undefined) { updates.push('active=?'); params.push(active); }
    if (business_type_id !== undefined) { updates.push('business_type_id=?'); params.push(business_type_id || null); }

    params.push(id);
    await execute(`UPDATE sections SET ${updates.join(', ')} WHERE id=?`, params);
    invalidateCache.sections();
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // CASCADING DELETE: Automatically clean up fields before deleting the section
    await execute('DELETE FROM form_fields WHERE section_id = ?', [id]);

    // Delete the section itself
    await execute('DELETE FROM sections WHERE id = ?', [id]);
    
    invalidateCache.sections();
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
