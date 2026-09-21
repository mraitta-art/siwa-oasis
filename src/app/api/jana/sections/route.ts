import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { execute, query, transaction } from '@/lib/db';
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
      if (searchParams.get('mode') === 'dependencies') {
        const count = async (sql: string, params: string[] = [id]) => {
          try {
            const [row] = await query<any>(sql, params);
            return Number(row?.count || 0);
          } catch { return 0; }
        };
        const [fields, components, blogs, gallery, typeAssignments] = await Promise.all([
          count('SELECT COUNT(*) AS count FROM form_fields WHERE section_id = ?'),
          count('SELECT COUNT(*) AS count FROM section_components WHERE section_id = ?'),
          count('SELECT COUNT(*) AS count FROM section_blogs WHERE section_id = ?'),
          count('SELECT COUNT(*) AS count FROM vendor_gallery WHERE section_id = ?'),
          count(`SELECT COUNT(*) AS count FROM business_types WHERE JSON_CONTAINS(COALESCE(sections, JSON_ARRAY()), JSON_QUOTE(?)) OR JSON_CONTAINS(COALESCE(own_sections, JSON_ARRAY()), JSON_QUOTE(?))`, [id, id]),
        ]);
        return NextResponse.json({ section, dependencies: { fields, components, blogs, gallery, typeAssignments } });
      }
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

      // Keep legacy baseline sections only for typologies with no assignment yet.
      if (sectionIds.size === 0) {
        ['identity', 'location', 'testimonials'].forEach(s => sectionIds.add(s));
      }

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
    const message = e?.message || 'Failed to load sections';
    const status = /authenticated|admin access required/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, icon, required, vendor_editable, show_on_public, show_on_minisite, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id, propagation_hero, propagation_blog, propagation_card, enable_gallery = true, enable_blog = true, curation_policy = 'manual_review', options, required_tier } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });
    console.log('[SECTIONS POST] Attempting to create section:', { id, name, business_type_id, is_universal });

    try {
      await execute(
        `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, show_on_minisite, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id, propagation_hero, propagation_blog, propagation_card, enable_gallery, enable_blog, curation_policy, options, required_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, name, icon || 'fa-info-circle', required || false, vendor_editable !== false, show_on_public !== false, show_on_minisite !== false, is_filterable || false, show_on_card || false, is_universal || false, section_type || 'general', description || null, 
          inheritance_rules ? (typeof inheritance_rules === 'string' ? inheritance_rules : JSON.stringify(inheritance_rules)) : null, 
          display_order || 0, sort_order || 0, active !== false, business_type_id || null,
          propagation_hero || false, propagation_blog || false, propagation_card || false,
          enable_gallery ? 1 : 0, enable_blog ? 1 : 0, curation_policy, options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null,
          required_tier || null
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
    const { id, name, icon, required, vendor_editable, show_on_public, show_on_minisite, is_filterable, show_on_card, is_universal, section_type, description, inheritance_rules, display_order, sort_order, active, business_type_id, propagation_hero, propagation_blog, propagation_card, enable_gallery, enable_blog, curation_policy, options, required_tier } = body;
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
    if (required_tier !== undefined) { applyUpdate('required_tier', required_tier || null); }

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
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const typeId = searchParams.get('type_id');
    const mode = searchParams.get('mode') || (typeId ? 'unlink' : 'delete');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (mode === 'unlink') {
      if (!typeId) return NextResponse.json({ error: 'type_id is required when unlinking a section.' }, { status: 400 });
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

    if (mode !== 'delete') {
      if (mode === 'archive') {
        await execute('UPDATE sections SET active = 0, show_on_public = 0, show_on_minisite = 0 WHERE id = ?', [id]);
        invalidateCache.sections();
        return NextResponse.json({ success: true, mode: 'archived' });
      }
      return NextResponse.json({ error: 'Unsupported section deletion mode.' }, { status: 400 });
    }

    const section = await query('SELECT id, name, is_universal FROM sections WHERE id = ?', [id]) as any[];
    if (!section.length) return NextResponse.json({ error: 'Section not found.' }, { status: 404 });
    let confirmation = '';
    try {
      const body = await request.json();
      confirmation = typeof body?.confirmation === 'string' ? body.confirmation : '';
    } catch {}
    const protectedSection = section[0].is_universal === 1 || section[0].is_universal === true;
    const forceDelete = searchParams.get('force') === 'true';
    if (forceDelete && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Force deletion requires super_admin access.' }, { status: 403 });
    }
    if (protectedSection && (!forceDelete || user.role !== 'super_admin')) {
      return NextResponse.json({
        error: 'Protected section. Use archive/unlink, or force deletion as super_admin.',
        code: 'PROTECTED_SECTION',
        required_mode: 'force',
      }, { status: 403 });
    }
    if (forceDelete && confirmation !== id) {
      return NextResponse.json({ error: `Type the section ID "${id}" to confirm force deletion.` }, { status: 400 });
    }

    // Full definition delete: remove every reference in one transaction.
    await transaction(async connection => {
      const [types] = await connection.query('SELECT id, sections, own_sections FROM business_types') as any;
      for (const type of types as any[]) {
        const parseIds = (value: unknown) => {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') { try { return JSON.parse(value || '[]'); } catch { return []; } }
          return [];
        };
        const sections = parseIds(type.sections).filter((sectionId: string) => sectionId !== id);
        const ownSections = parseIds(type.own_sections).filter((sectionId: string) => sectionId !== id);
        if (sections.length !== parseIds(type.sections).length || ownSections.length !== parseIds(type.own_sections).length) {
          await connection.query('UPDATE business_types SET sections = ?, own_sections = ? WHERE id = ?', [JSON.stringify(sections), JSON.stringify(ownSections), type.id]);
        }
      }

      await connection.query('DELETE FROM section_blogs WHERE section_id = ?', [id]);
      await connection.query('DELETE FROM vendor_gallery WHERE section_id = ?', [id]);
      await connection.query('DELETE FROM form_fields WHERE section_id = ?', [id]);
      await connection.query('DELETE FROM section_components WHERE section_id = ?', [id]);
      await connection.query('DELETE FROM sections WHERE id = ?', [id]);
    });
    
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({ success: true, mode: 'deleted' });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
