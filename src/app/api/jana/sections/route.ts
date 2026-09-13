import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSections, invalidateCache } from '@/lib/cache';

async function getSectionColumns() {
  const columns = await query(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sections'
  `);
  return new Set((columns as any[]).map((c: any) => c.COLUMN_NAME));
}

/**
 * GET Sections
 * Public: If type param is provided (returns sections for that typology)
 * Private: Otherwise (requires admin, returns all sections)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeId = searchParams.get('type');
  const id = searchParams.get('id');

  try {
    // If ID is provided, return a single section
    if (id) {
      const [section] = await query('SELECT * FROM sections WHERE id = ?', [id]);
      if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      return NextResponse.json(section);
    }

    // 1. If typeId is provided, fetch sections mapped to that typology and its parent hierarchy (Public / Management)
    if (typeId) {
      const sectionIds = new Set<string>();
      let currentId: string | null = typeId;

      while (currentId) {
        const typeRows = await query('SELECT id, parent_id, sections, own_sections FROM business_types WHERE id = ?', [currentId]) as any[];
        if (typeRows.length > 0) {
          const t = typeRows[0];
          const s1 = typeof t.sections === 'string' ? JSON.parse(t.sections || '[]') : t.sections || [];
          if (Array.isArray(s1)) s1.forEach((s: string) => sectionIds.add(s));
          const s2 = typeof t.own_sections === 'string' ? JSON.parse(t.own_sections || '[]') : t.own_sections || [];
          if (Array.isArray(s2)) s2.forEach((s: string) => sectionIds.add(s));
          currentId = t.parent_id;
        } else {
          currentId = null;
        }
      }

      // Essential baseline sections
      ['identity', 'location', 'testimonials'].forEach(s => sectionIds.add(s));

      const idsArray = Array.from(sectionIds);
      if (idsArray.length === 0) return NextResponse.json([]);

      const sections = await query(`SELECT * FROM sections WHERE id IN (${idsArray.map(() => '?').join(',')}) ORDER BY sort_order ASC, name ASC`, idsArray);
      
      // Sort sections according to the type's section order
      const sortedSections = (sections as any[]).sort((a: any, b: any) => {
        const idxA = idsArray.indexOf(a.id);
        const idxB = idsArray.indexOf(b.id);
        const safeIdxA = idxA === -1 ? 9999 : idxA;
        const safeIdxB = idxB === -1 ? 9999 : idxB;
        return safeIdxA - safeIdxB;
      });
      
      return NextResponse.json(sortedSections);
    }

    // 2. Otherwise, require admin to see all sections (including inactive)
    await requireAdmin();
    const sections = await getSections(false);
    return NextResponse.json(sections);
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, icon, required, vendor_editable, show_on_public, show_on_minisite, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id, propagation_hero, propagation_blog, propagation_card, enable_gallery = true, enable_blog = true, curation_policy = 'manual_review', options } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });
    console.log('[SECTIONS POST] Attempting to create section:', { id, name, business_type_id, is_universal });

    try {
      await execute(
        `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, show_on_minisite, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id, propagation_hero, propagation_blog, propagation_card, enable_gallery, enable_blog, curation_policy, options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, name, icon || 'fa-info-circle', required || false, vendor_editable !== false, show_on_public !== false, show_on_minisite !== false, is_filterable || false, show_on_card || false, is_universal || false, section_type || 'general', description || null, 
          inheritance_rules ? (typeof inheritance_rules === 'string' ? inheritance_rules : JSON.stringify(inheritance_rules)) : null, 
          display_order || 0, sort_order || 0, active !== false, business_type_id || null,
          propagation_hero || false, propagation_blog || false, propagation_card || false,
          enable_gallery ? 1 : 0, enable_blog ? 1 : 0, curation_policy, options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null
        ]
      );
      console.log('[SECTIONS POST] Section created successfully');
    } catch (dbErr: any) {
      console.error('[SECTIONS POST DB ERROR]', dbErr);
      return NextResponse.json({ error: `Database Error: ${dbErr.message}` }, { status: 500 });
    }

    // --- AUTO-GENESIS: Materialize DNA Fields ---
    const structuralFields = [
      { name: 'feature_on_main', label: 'FEATURE ON MAIN WEBSITE', type: 'boolean', order: -3, help: 'Toggle this to promote to homepage.' },
      { name: 'section_news', label: 'Carousel Cinematic Teaser', type: 'text', order: -2, help: 'Short text for carousel captions.' },
      { name: 'section_gallery', label: 'Section Gallery (Serialized Captions)', type: 'gallery', order: -1, help: 'Section photos with captions.' },
      { name: 'section_blog', label: 'Master Section Story (Rich Text)', type: 'rich_text', order: 1, help: 'Full rich-text story for this section.' }
    ];

    const crypto = require('crypto');
    for (const field of structuralFields) {
      const fullFid = `auto_${id}_${field.name}`;
      const fid = fullFid.length <= 36 
        ? fullFid 
        : `auto_${crypto.createHash('md5').update(`${id}:${field.name}`).digest('hex').slice(0, 31)}`;

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
    const { id, name, icon, required, vendor_editable, show_on_public, show_on_minisite, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id, propagation_hero, propagation_blog, propagation_card, enable_gallery, enable_blog, curation_policy, options } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const availableColumns = await getSectionColumns();
    const updates: string[] = [];
    const params: any[] = [];

    const applyUpdate = (column: string, value: any) => {
      if (!availableColumns.has(column)) return;
      updates.push(`${column}=?`);
      params.push(value);
    };

    if (name !== undefined) { applyUpdate('name', name); }
    if (icon !== undefined) { applyUpdate('icon', icon); }
    if (required !== undefined) { applyUpdate('required', required); }
    if (vendor_editable !== undefined) { applyUpdate('vendor_editable', vendor_editable); }
    if (show_on_public !== undefined) { applyUpdate('show_on_public', show_on_public); }
    if (show_on_minisite !== undefined) { applyUpdate('show_on_minisite', show_on_minisite); }
    if (is_filterable !== undefined) { applyUpdate('is_filterable', is_filterable); }
    if (show_on_card !== undefined) { applyUpdate('show_on_card', show_on_card); }
    if (is_universal !== undefined) { applyUpdate('is_universal', is_universal); }
    if (section_type !== undefined) { applyUpdate('section_type', section_type); }
    if (description !== undefined) { applyUpdate('description', description); }
    if (inheritance_rules !== undefined) { applyUpdate('inheritance_rules', typeof inheritance_rules === 'string' ? inheritance_rules : JSON.stringify(inheritance_rules)); }
    if (display_order !== undefined) { applyUpdate('display_order', display_order); }
    if (sort_order !== undefined) { applyUpdate('sort_order', sort_order); }
    if (active !== undefined) { applyUpdate('active', active); }
    if (business_type_id !== undefined) { applyUpdate('business_type_id', business_type_id || null); }
    if (propagation_hero !== undefined) { applyUpdate('propagation_hero', propagation_hero); }
    if (propagation_blog !== undefined) { applyUpdate('propagation_blog', propagation_blog); }
    if (propagation_card !== undefined) { applyUpdate('propagation_card', propagation_card); }
    if (enable_gallery !== undefined) { applyUpdate('enable_gallery', enable_gallery ? 1 : 0); }
    if (enable_blog !== undefined) { applyUpdate('enable_blog', enable_blog ? 1 : 0); }
    if (curation_policy !== undefined) { applyUpdate('curation_policy', curation_policy); }
    if (options !== undefined) { applyUpdate('options', typeof options === 'string' ? options : JSON.stringify(options)); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No supported section fields to update' }, { status: 400 });
    }

    console.log('[SECTIONS PUT] Attempting to update section:', { id, updates: updates.length });

    params.push(id);
    try {
      await execute(`UPDATE sections SET ${updates.join(', ')} WHERE id=?`, params);
      console.log('[SECTIONS PUT] Section updated successfully');
    } catch (dbErr: any) {
      console.error('[SECTIONS PUT DB ERROR]', dbErr);
      return NextResponse.json({ error: `Database Error: ${dbErr.message}` }, { status: 500 });
    }
    invalidateCache.sections();
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const typeId = searchParams.get('type_id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (typeId) {
      // Remove section from specific business type's own_sections / sections
      const typeRows = await query('SELECT id, own_sections, sections FROM business_types WHERE id = ?', [typeId]) as any[];
      if (typeRows.length > 0) {
        const typeRow = typeRows[0];
        const own = (typeof typeRow.own_sections === 'string' ? JSON.parse(typeRow.own_sections || '[]') : typeRow.own_sections || []).filter((s: string) => s !== id);
        const secs = (typeof typeRow.sections === 'string' ? JSON.parse(typeRow.sections || '[]') : typeRow.sections || []).filter((s: string) => s !== id);
        await execute('UPDATE business_types SET own_sections = ?, sections = ? WHERE id = ?', [JSON.stringify(own), JSON.stringify(secs), typeId]);
      }
      invalidateCache.sections();
      return NextResponse.json({ success: true, mode: 'unlinked' });
    }

    // Admin Full Delete: CASCADING DELETE fields and section row (no restrictions)
    await execute('DELETE FROM form_fields WHERE section_id = ?', [id]);
    await execute('DELETE FROM sections WHERE id = ?', [id]);
    
    invalidateCache.sections();
    return NextResponse.json({ success: true, mode: 'deleted' });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
