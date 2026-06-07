import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getFormFields, getBusinessTypeById, invalidateCache } from '@/lib/cache';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('type');
    const section = searchParams.get('section');

    if (typeId) {
      const includeInherited = searchParams.get('include_inherited') !== 'false';
      
      // 1. Fetch the type and iteratively find all ancestors
      const typesToFetch = [];
      let currentId = typeId;

      if (typeId === 'FACTORY') {
        // Factory is a flat registry of master blocks, skip inheritance
        // Check BOTH business_type_id AND section_id for FACTORY
        const factoryFields = await query(
          'SELECT * FROM form_fields WHERE business_type_id = ? OR section_id = ? ORDER BY sort_order ASC',
          ['FACTORY', 'FACTORY']
        );
        return NextResponse.json(factoryFields.map(f => ({
          ...f,
          options: (() => { try { return typeof f.options === 'string' ? JSON.parse(f.options) : f.options; } catch(e) { return f.options; } })(),
          validation: (() => { try { return typeof f.validation === 'string' ? JSON.parse(f.validation) : f.validation; } catch(e) { return f.validation; } })(),
          acl: (() => { try { return typeof f.acl === 'string' ? JSON.parse(f.acl) : f.acl; } catch(e) { return f.acl; } })(),
        })));
      }

      if (typeId !== 'SECTION_TEMPLATE') {
        // Find if we have a blueprint_schema configured in business_types
        let targetSchema: any = null;
        const typeInfo = await queryOne('SELECT blueprint_schema, parent_id FROM business_types WHERE id = ?', [typeId]) as any;
        if (typeInfo?.blueprint_schema) {
          targetSchema = JSON.parse(typeInfo.blueprint_schema);
        } else if (typeInfo?.parent_id) {
          const parentInfo = await queryOne('SELECT blueprint_schema FROM business_types WHERE id = ?', [typeInfo.parent_id]) as any;
          if (parentInfo?.blueprint_schema) {
            targetSchema = JSON.parse(parentInfo.blueprint_schema);
          }
        }

        if (targetSchema && targetSchema.chapters) {
          const CHAPTER_TO_SECTION: Record<string, string> = {
            identity: 'sec_1_identity',
            vibe: 'sec_2_ambience',
            amenities: 'sec_3_facilities',
            cuisine: 'sec_4_gastronomy',
            programs: 'sec_5_experiences',
            ecology: 'sec_6_guardian',
            invest: 'sec_7_investment',
            offers: 'sec_8_connector',
          };

          const fieldMap = new Map();
          const atomIds: string[] = [];

          for (const [ch, chData] of Object.entries(targetSchema.chapters)) {
            const schemaCh = chData as { layer1?: string[]; layer2?: string[] };
            if (schemaCh?.layer1) atomIds.push(...schemaCh.layer1);
            if (schemaCh?.layer2) atomIds.push(...schemaCh.layer2);
          }

          let atoms: any[] = [];
          if (atomIds.length > 0) {
            atoms = await query('SELECT * FROM blueprint_atoms WHERE id IN (?) AND active = 1', [atomIds]);
          }

          const atomMap = new Map(atoms.map(a => [a.id, a]));

          for (const [ch, chData] of Object.entries(targetSchema.chapters)) {
            const sectionId = CHAPTER_TO_SECTION[ch];
            if (!sectionId) continue;

            // Auto-inject structural defaults
            const structuralDefaults = [
              { name: 'section_gallery', label: 'CINEMATIC GALLERY', type: 'gallery', help: 'High-res photos for carousel slides.', sort_order: -2 },
              { name: 'section_blog', label: 'NARRATIVE BLOG (RICH)', type: 'rich_text', help: 'The deep story for this chapter.', sort_order: 100 },
              { name: 'section_news', label: 'Carousel Cinematic Teaser (Mini-Blog)', type: 'textarea', help: 'This short text will appear as captions on the automated hero.', sort_order: -1 },
              { name: 'feature_on_main', label: 'FEATURE ON MAIN WEBSITE', type: 'checkbox', help: 'Toggle this to automatically promote this section as a slide on the main Siwa.Today homepage.', sort_order: -3 }
            ];

            structuralDefaults.forEach(f => {
              const key = `${sectionId}:${f.name}`;
              fieldMap.set(key, {
                id: `auto-${ch}-${f.name}`,
                business_type_id: typeId,
                section_id: sectionId,
                name: f.name,
                label: f.label,
                field_type: f.type,
                required: 0,
                vendor_editable: 1,
                searchable: 1,
                help_text: f.help,
                options: [],
                validation: {},
                acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
                sort_order: f.sort_order,
                section_origin: 'template'
              });
            });

            const schemaCh = chData as { layer1?: string[]; layer2?: string[] };
            const activeChAtoms = [
              ...(schemaCh?.layer1 || []),
              ...(schemaCh?.layer2 || [])
            ];

            activeChAtoms.forEach(atomId => {
              const atom = atomMap.get(atomId) as any;
              if (!atom) return;

              const key = `${sectionId}:${atom.id}`;
              fieldMap.set(key, {
                id: `atom-${atom.id}`,
                business_type_id: typeId,
                section_id: sectionId,
                name: atom.id,
                label: atom.label,
                field_type: atom.type,
                required: 0,
                vendor_editable: 1,
                searchable: 1,
                help_text: atom.display_hint || null,
                options: (() => { try { return typeof atom.options_json === 'string' ? JSON.parse(atom.options_json) : atom.options_json || []; } catch(e) { return []; } })(),
                validation: (() => { try { return typeof atom.validation_json === 'string' ? JSON.parse(atom.validation_json) : atom.validation_json || {}; } catch(e) { return {}; } })(),
                acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
                sort_order: atom.sort_order || 0,
                section_origin: 'own'
              });
            });
          }

          let fieldsList = Array.from(fieldMap.values());
          if (section) {
            fieldsList = fieldsList.filter(f => f.section_id === section);
          }
          fieldsList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          return NextResponse.json(fieldsList);
        }
      }

      let allSectionIds = new Set<string>();
      if (typeId !== 'SECTION_TEMPLATE') {
        let currentId: string | null = typeId;
        while (currentId) {
          const typeInfo = await queryOne('SELECT id, parent_id, sections, own_sections FROM business_types WHERE id = ?', [currentId]) as any;
          if (typeInfo) {
             typesToFetch.push(typeInfo);
             currentId = includeInherited ? (typeInfo.parent_id as string | null) : null;
             // Prevent infinite loops
             if (currentId === typeInfo.id) currentId = null;
          } else {
             currentId = null;
          }
        }
        typesToFetch.forEach(t => {
           try {
               const s1 = typeof t.sections === 'string' ? JSON.parse(t.sections) : t.sections;
               if (Array.isArray(s1)) s1.forEach(s => allSectionIds.add(s));
               const s2 = typeof t.own_sections === 'string' ? JSON.parse(t.own_sections) : t.own_sections;
               if (Array.isArray(s2)) s2.forEach(s => allSectionIds.add(s));
           } catch(e) {}
        });
      } else {
        if (section) {
          allSectionIds.add(section);
        } else {
          const allSecs = await query('SELECT id FROM sections') as any[];
          allSecs.forEach(s => allSectionIds.add(s.id));
        }
      }

      const sectionIdsArray = Array.from(allSectionIds);

      // 2. Fetch fields
      const idsToFetch = ['SECTION_TEMPLATE', ...typesToFetch.map(t => t.id)];
      
      let sql = 'SELECT * FROM form_fields WHERE business_type_id IN (?)';
      const params: any[] = [idsToFetch];
      
      if (section || typeId === 'SECTION_TEMPLATE') {
        if (section) {
          sql += ' AND section_id = ?';
          params.push(section);
        }
      } else if (sectionIdsArray.length > 0) {
        sql += ' AND section_id IN (?)';
        params.push(sectionIdsArray);
      } else if (typeId !== 'SECTION_TEMPLATE') {
        return NextResponse.json([]);
      }
      
      sql += ` ORDER BY 
        CASE 
          WHEN business_type_id = 'SECTION_TEMPLATE' THEN 1 
          WHEN business_type_id = ? THEN 3 
          ELSE 2 
        END ASC, sort_order ASC`; 
      params.push(typeId);
      
      const allFields = await query(sql, params);
      
      // 3. Process and deduplicate
      const fieldMap = new Map();
      
      // A. Add explicit fields from DB
      for (const f of allFields) {
        const key = `${f.section_id}:${f.name}`;
        fieldMap.set(key, {
          ...f,
          options: (() => { try { return typeof f.options === 'string' ? JSON.parse(f.options) : f.options; } catch(e) { return f.options; } })(),
          validation: (() => { try { return typeof f.validation === 'string' ? JSON.parse(f.validation) : f.validation; } catch(e) { return f.validation; } })(),
          acl: (() => { try { return typeof f.acl === 'string' ? JSON.parse(f.acl) : f.acl; } catch(e) { return f.acl; } })(),
          required_feature: f.required_feature || null
        });
      }

      // B. AUTO-INJECT Structural Defaults (Mini-Blog & Gallery) only if NOT already in DB
      sectionIdsArray.forEach(sid => {
        const blogKey = `${sid}:section_blog`;
        if (!fieldMap.has(blogKey)) {
          fieldMap.set(blogKey, {
            id: `auto-blog-${sid}`,
            section_id: sid,
            name: 'section_blog',
            label: 'Master Section Story (Rich Text)',
            field_type: 'rich_text',
            required_feature: 'hero_automation',
            sort_order: 1, 
            help_text: 'Use this advanced editor to design the full story for this section on the page.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
          });
        }

        const newsKey = `${sid}:section_news`;
        if (!fieldMap.has(newsKey)) {
          fieldMap.set(newsKey, {
            id: `auto-news-${sid}`,
            section_id: sid,
            name: 'section_news',
            label: 'Carousel Cinematic Teaser (Mini-Blog)',
            field_type: 'textarea',
            required_feature: 'hero_automation', 
            sort_order: -2, 
            help_text: 'This short text will appear as captions on the automated hero.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
          });
        }

        const galleryKey = `${sid}:section_gallery`;
        if (!fieldMap.has(galleryKey)) {
          fieldMap.set(galleryKey, {
            id: `auto-gallery-${sid}`,
            section_id: sid,
            name: 'section_gallery',
            label: 'Section Gallery (Serialized Captions)',
            field_type: 'gallery',
            required_feature: 'hero_automation', 
            sort_order: -1, 
            help_text: 'Add photos. Each photo caption becomes a slide title in the automated carousel.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
          });
        }

        const promoteKey = `${sid}:feature_on_main`;
        if (!fieldMap.has(promoteKey)) {
          fieldMap.set(promoteKey, {
            id: `auto-promote-${sid}`,
            section_id: sid,
            name: 'feature_on_main',
            label: 'FEATURE ON MAIN WEBSITE',
            field_type: 'checkbox',
            required_feature: 'hero_automation',
            sort_order: -3, 
            help_text: 'Toggle this to automatically promote this section as a slide on the main Siwa.Today homepage.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
          });
        }
      });

      return NextResponse.json(Array.from(fieldMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    }

    const fields = await query('SELECT * FROM form_fields ORDER BY business_type_id, section_id, sort_order');
    return NextResponse.json(fields);
  } catch (e: any) { 
    console.error('[FORMS API ERROR]', e);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { business_type_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, default_value, sort_order, required_feature } = body;
    const section_id = body.section_id || 'basic';

    if (!business_type_id || !name || !label || !field_type) {
      return NextResponse.json({ error: 'Missing required fields: business_type_id, name, label, field_type' }, { status: 400 });
    }

    // Ensure the 'basic' section exists (self-healing)
    await execute(
      `INSERT IGNORE INTO sections (id, name, icon, required, vendor_editable, show_on_public) VALUES (?, ?, ?, ?, ?, ?)`,
      ['basic', 'Basic Information', 'fa-info-circle', 1, 1, 1]
    );

    // Ensure the 'factory_pool' section exists for Master DNA archetypes
    if (business_type_id === 'FACTORY' || section_id === 'factory_pool') {
      await execute(
        `INSERT IGNORE INTO sections (id, name, icon, required, vendor_editable, show_on_public) VALUES (?, ?, ?, ?, ?, ?)`,
        ['factory_pool', 'Factory Pool', 'fa-microchip', 0, 0, 0]
      );
    }

    const id = crypto.randomUUID();
    const [maxOrder] = await query('SELECT COALESCE(MAX(sort_order), 0) as m FROM form_fields WHERE business_type_id = ? AND section_id = ?', [business_type_id, section_id]);

    const finalSortOrder = sort_order ?? (((maxOrder as any)?.m || 0) + 1);
    const finalAcl = typeof acl === 'string' ? acl : JSON.stringify(acl || { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] });
    const finalValidation = typeof validation === 'string' ? validation : JSON.stringify(validation || {});
    const finalOptions = options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null;

    console.log('[FORMS POST] Creating field with params:', {
      id, business_type_id, section_id, name, label, field_type, 
      required: required ? 1 : 0, vendor_editable: vendor_editable ?? 1,
      sort_order: finalSortOrder
    });

    try {
      await execute(
        `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, default_value, sort_order, required_feature, section_origin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, business_type_id, section_id, name, label, field_type,
          required ? 1 : 0, vendor_editable ?? 1, searchable ? 1 : 0, help_text || null,
          finalOptions, finalValidation, finalAcl,
          default_value || null, finalSortOrder, required_feature || null,
          body.section_origin || 'own'
        ]
      );
      console.log('[FORMS POST] Field created successfully');
    } catch (dbErr: any) {
      console.error('[FORMS POST DB ERROR]', dbErr);
      return NextResponse.json({ error: `Database Error: ${dbErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) { 
    console.error('[FORMS POST ERROR]', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 }); 
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, label, required, vendor_editable, searchable, help_text, sort_order, options, section_id, is_hidden, acl, validation, field_type, required_feature } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = [];
    const params = [];
    if (label !== undefined) { updates.push('label=?'); params.push(label); }
    if (field_type !== undefined) { updates.push('field_type=?'); params.push(field_type); }
    if (required !== undefined) { updates.push('required=?'); params.push(required ? 1 : 0); }
    if (vendor_editable !== undefined) { updates.push('vendor_editable=?'); params.push(vendor_editable ? 1 : 0); }
    if (searchable !== undefined) { updates.push('searchable=?'); params.push(searchable ? 1 : 0); }
    if (help_text !== undefined) { updates.push('help_text=?'); params.push(help_text); }
    if (sort_order !== undefined) { updates.push('sort_order=?'); params.push(sort_order); }
    if (options !== undefined) { updates.push('options=?'); params.push(typeof options === 'string' ? options : JSON.stringify(options)); }
    if (section_id !== undefined) { updates.push('section_id=?'); params.push(section_id); }
    if (acl !== undefined) { updates.push('acl=?'); params.push(typeof acl === 'string' ? acl : JSON.stringify(acl)); }
    if (validation !== undefined) { updates.push('validation=?'); params.push(typeof validation === 'string' ? validation : JSON.stringify(validation)); }
    if (required_feature !== undefined) { updates.push('required_feature=?'); params.push(required_feature); }

    if (updates.length > 0) {
      params.push(id);
      const result = await execute(`UPDATE form_fields SET ${updates.join(',')} WHERE id=?`, params);
      
      // SELF-HEALING: If no rows were updated and it's an auto-generated ID, materialize it now!
      if (result.affectedRows === 0 && id.startsWith('auto-')) {
        console.log(`[FORMS PUT] Virtual ID ${id} detected. Materializing...`);
        const name = body.name || id.split('-').pop(); // Extract name from auto-blog-sid
        await execute(
          `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, sort_order, section_origin, required_feature)
           VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'template', ?)`,
          [
            id, 
            section_id || 'basic', 
            name, 
            label || name, 
            field_type || 'text',
            required ? 1 : 0, 
            vendor_editable ?? 1, 
            searchable ? 1 : 0, 
            help_text || null,
            options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null,
            JSON.stringify(validation || {}),
            JSON.stringify(acl || { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] }),
            sort_order || 0,
            required_feature || null
          ]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) { 
    console.error('[FORMS PUT ERROR]', e);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const typeId = searchParams.get('type');

    if (typeId) {
      // Bulk delete all fields belonging to a parent type (for template reset)
      await execute('DELETE FROM form_fields WHERE business_type_id = ?', [typeId]);
      return NextResponse.json({ success: true, deleted: 'all fields for type' });
    }
    if (id) {
      // Standard fields (including DNA foundation fields) are fully deletable.
      // DNA fields are auto-created with every new section, so they are always
      // available as the standard foundation — no need for deletion locks.
      await execute('DELETE FROM form_fields WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Provide id or type param' }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
