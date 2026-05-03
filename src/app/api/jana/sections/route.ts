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
        ...JSON.parse(typeData.sections || '[]'),
        ...JSON.parse(typeData.own_sections || '[]')
      ];
      
      if (sectionIds.length === 0) return NextResponse.json([]);

      const placeholders = sectionIds.map(() => '?').join(',');
      const sections = await query(`SELECT * FROM sections WHERE id IN (${placeholders}) ORDER BY display_order ASC`, sectionIds);
      return NextResponse.json(sections);
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
    const { id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });

    await execute(
      `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, icon || 'fa-info-circle', required || false, vendor_editable !== false, show_on_public !== false, is_filterable || false, show_on_card || false, is_universal || false, section_type || 'general', description || null, inheritance_rules ? (typeof inheritance_rules === 'string' ? inheritance_rules : JSON.stringify(inheritance_rules)) : null, display_order || 0, sort_order || 0]
    );
    
    invalidateCache.sections();
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = [];
    const params = [];
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

    const [usage] = await query('SELECT COUNT(*) as count FROM form_fields WHERE section_id = ?', [id]);
    if ((usage as any).count > 0) {
      return NextResponse.json({ error: `Cannot delete section: It contains ${(usage as any).count} fields.` }, { status: 400 });
    }

    await execute('DELETE FROM sections WHERE id = ?', [id]);
    invalidateCache.sections();
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
