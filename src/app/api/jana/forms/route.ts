import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getFormFields, getBusinessTypeById, invalidateCache } from '@/lib/cache';
import { mergeBlueprintSchemas, type BlueprintSchema } from '@/lib/governance/blueprint-core';
import { getSectionLookupIds, resolveFormFieldSectionId, resolveSectionId } from '@/lib/section-registry';
import { CATALOG_SPEC_ITEM_TYPE_IDS } from '@/lib/marketplace-item-types';
import crypto from 'crypto';

let formFieldScopeSupport: { value: boolean; checkedAt: number } | null = null;

async function supportsFormFieldScope() {
  if (formFieldScopeSupport && Date.now() - formFieldScopeSupport.checkedAt < 30000) {
    return formFieldScopeSupport.value;
  }

  try {
    const columns = await query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'form_fields'
         AND COLUMN_NAME IN ('field_scope', 'applies_to')`
    ) as any[];
    const available = columns.length === 2;
    formFieldScopeSupport = { value: available, checkedAt: Date.now() };
    return available;
  } catch {
    formFieldScopeSupport = { value: false, checkedAt: Date.now() };
    return false;
  }
}

async function ensureBusinessOverrideTable() {
  await execute(`CREATE TABLE IF NOT EXISTS business_form_overrides (
    id VARCHAR(100) PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL,
    field_key VARCHAR(255) NOT NULL,
    source_field_id VARCHAR(100) NULL,
    payload JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY business_form_override_key (business_id, field_key)
  )`);
}

function parseJson(value: any, fallback: any = {}) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function fieldKey(field: any) {
  return `${field.section_id || 'basic'}:${field.name}:${field.version_type || 'latest'}`;
}

async function getBusinessForm(businessId: string) {
  await ensureBusinessOverrideTable();
  const business = await queryOne('SELECT id, type_id FROM businesses WHERE id = ?', [businessId]) as any;
  if (!business) return null;

  const typeIds: string[] = [];
  let currentId: string | null = business.type_id;
  while (currentId) {
    const type = await queryOne('SELECT id, parent_id FROM business_types WHERE id = ?', [currentId]) as any;
    if (!type) break;
    typeIds.unshift(type.id);
    currentId = type.parent_id || null;
  }

  const merged = new Map<string, any>();
  // Fetch each inheritance level in order so the most specific definition
  // always wins, regardless of database row ordering.
  for (const sourceTypeId of ['SECTION_TEMPLATE', ...typeIds]) {
    const fields = await query(
      'SELECT * FROM form_fields WHERE business_type_id = ? ORDER BY sort_order ASC',
      [sourceTypeId]
    ) as any[];
    for (const field of fields) {
      const normalized = {
        ...field,
        options: parseJson(field.options, []),
        validation: parseJson(field.validation, {}),
        acl: parseJson(field.acl, {}),
        source_level: sourceTypeId === 'SECTION_TEMPLATE' ? 'universal' : sourceTypeId === business.type_id ? 'child' : 'parent',
        source_id: sourceTypeId,
        override_level: sourceTypeId === business.type_id ? 'child' : 'parent'
      };
      merged.set(fieldKey(normalized), normalized);
    }
  }

  const overrides = await query('SELECT * FROM business_form_overrides WHERE business_id = ?', [businessId]) as any[];
  for (const override of overrides) {
    const payload = parseJson(override.payload, {});
    const inherited = merged.get(override.field_key) || {};
    merged.set(override.field_key, {
      ...inherited,
      ...payload,
      id: override.id,
      source_field_id: override.source_field_id,
      business_id: businessId,
      override_level: 'business'
    });
  }

  return Array.from(merged.values())
    .map(field => ({
      ...field,
      source_section_id: field.section_id,
      section_id: resolveFormFieldSectionId(String(field.source_id || field.business_type_id || ''), String(field.name || ''), String(field.section_id || 'basic')),
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('type');
    const section = searchParams.get('section');
    const businessId = searchParams.get('business');
    const requestedScope = searchParams.get('scope') || 'profile';
    const fieldScope = ['profile', 'catalog_spec', 'all'].includes(requestedScope) ? requestedScope : 'profile';
    const hasFieldScopeColumns = await supportsFormFieldScope();
    let blueprintFields: any[] = [];

    if (fieldScope === 'catalog_spec' && !hasFieldScopeColumns) {
      return NextResponse.json({ error: 'Apply migration 039_form_field_applicability.sql before editing catalog specifications.' }, { status: 503 });
    }

    if (businessId) {
      const fields = await getBusinessForm(businessId);
      if (!fields) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      const scopedFields = fields.filter((field: any) => fieldScope === 'all' || (field.field_scope || 'profile') === fieldScope);
      return NextResponse.json(section ? scopedFields.filter((field: any) => resolveSectionId(String(field.section_id)) === resolveSectionId(section)) : scopedFields);
    }

    if (typeId) {
      const includeInherited = searchParams.get('include_inherited') !== 'false';
      const source = searchParams.get('source');
      
      // 1. Fetch the type and iteratively find all ancestors
      const typesToFetch = [];

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

      if (typeId !== 'SECTION_TEMPLATE' && source !== 'database' && fieldScope !== 'catalog_spec') {
        // Find if we have a blueprint_schema configured in business_types
        let targetSchema: any = null;
        const parseSchema = (value: unknown) => {
          if (!value) return null;
          if (typeof value === 'object') return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return null;
            }
          }
          return null;
        };

        const inheritedSchemas: BlueprintSchema[] = [];
        const visitedTypeIds = new Set<string>();
        let currentTypeId: string | null = typeId;

        while (currentTypeId && !visitedTypeIds.has(currentTypeId)) {
          visitedTypeIds.add(currentTypeId);
          const currentType = await queryOne(
            'SELECT id, parent_id, blueprint_schema FROM business_types WHERE id = ?',
            [currentTypeId]
          ) as any;
          if (!currentType) break;

          const currentSchema = parseSchema(currentType.blueprint_schema) as BlueprintSchema | null;
          if (currentSchema) inheritedSchemas.unshift(currentSchema);
          currentTypeId = currentType.parent_id || null;
        }

        targetSchema = mergeBlueprintSchemas(inheritedSchemas);

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
              { name: 'feature_on_main', label: 'FEATURE ON MAIN WEBSITE', type: 'checkbox', help: 'Toggle this to automatically promote this section as a slide on the main Siwify homepage.', sort_order: -3 }
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
                section_origin: 'template',
                version_type: 'latest'
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

          blueprintFields = Array.from(fieldMap.values()).map(f => {
            const readRoles = Array.isArray(f.acl?.read) ? f.acl.read : ['public'];
            return {
              ...f,
              field_scope: 'profile',
              applies_to: [],
              show_on_public: readRoles.includes('public')
            };
          });
        }
      }

      const allSectionIds = new Set<string>();
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
          allSectionIds.add(resolveSectionId(section));
        } else {
          const allSecs = await query('SELECT id FROM sections') as any[];
          allSecs.forEach(s => allSectionIds.add(s.id));
        }
      }

      const sectionIdsArray = [...new Set(Array.from(allSectionIds).map(sectionId => resolveSectionId(String(sectionId))))];

      // 2. Fetch fields
      const idsToFetch = ['SECTION_TEMPLATE', ...typesToFetch.map(t => t.id)];
      const sourcePriority = new Map<string, number>([
        [typeId, 0],
        ...typesToFetch.filter(t => t.id !== typeId).map((t, index) => [t.id, index + 1] as [string, number]),
        ['SECTION_TEMPLATE', Number.MAX_SAFE_INTEGER],
      ]);
      
      let sql = 'SELECT * FROM form_fields WHERE business_type_id IN (?)';
      const params: any[] = [idsToFetch];
      
      if (typeId === 'SECTION_TEMPLATE') {
        if (section) {
          sql += ' AND section_id IN (?)';
          params.push(getSectionLookupIds(section));
        }
      } else if (section) {
        sql += ' AND section_id IN (?)';
        params.push([...new Set(sectionIdsArray.flatMap(getSectionLookupIds))]);
      } else if (sectionIdsArray.length > 0) {
        sql += ' AND section_id IN (?)';
        params.push([...new Set(sectionIdsArray.flatMap(getSectionLookupIds))]);
      } else if (typeId !== 'SECTION_TEMPLATE') {
        return NextResponse.json([]);
      }

      if (fieldScope !== 'all' && hasFieldScopeColumns) {
        sql += " AND COALESCE(field_scope, 'profile') = ?";
        params.push(fieldScope);
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
      const explicitFieldNames = new Set<string>();
      
      // A. Add explicit fields from DB
      for (const f of allFields) {
        const versionType = f.version_type || 'latest';
        const sourceSectionId = String(f.section_id);
        const sectionId = resolveFormFieldSectionId(String(f.business_type_id || ''), String(f.name || ''), sourceSectionId);
        if (section && sectionId !== resolveSectionId(section)) continue;
        const key = `${sectionId}:${f.name}:${versionType}`;
        explicitFieldNames.add(`${sectionId}:${f.name}`);
        const existing = fieldMap.get(key);
        const fieldPriority = sourcePriority.get(f.business_type_id) ?? Number.MAX_SAFE_INTEGER - 1;
        const existingPriority = existing ? (sourcePriority.get(existing.business_type_id) ?? Number.MAX_SAFE_INTEGER - 1) : Number.MAX_SAFE_INTEGER;
        if (existing && existingPriority <= fieldPriority) continue;
        fieldMap.set(key, {
          ...f,
          section_id: sectionId,
          source_section_id: sourceSectionId,
          field_scope: f.field_scope || 'profile',
          applies_to: parseJson(f.applies_to, []),
          version_type: versionType,
          source_level: f.business_type_id === typeId ? 'selected' : f.business_type_id === 'SECTION_TEMPLATE' ? 'universal' : 'parent',
          is_inherited: f.business_type_id !== typeId,
          options: (() => { try { return typeof f.options === 'string' ? JSON.parse(f.options) : f.options; } catch(e) { return f.options; } })(),
          validation: (() => { try { return typeof f.validation === 'string' ? JSON.parse(f.validation) : f.validation; } catch(e) { return f.validation; } })(),
          acl: (() => { try { return typeof f.acl === 'string' ? JSON.parse(f.acl) : f.acl; } catch(e) { return f.acl; } })(),
          required_feature: f.required_feature || null
        });
      }

      const blueprintFieldNames = new Set<string>();
      for (const blueprintField of blueprintFields) {
        const versionType = blueprintField.version_type || 'latest';
        const nameKey = `${blueprintField.section_id}:${blueprintField.name}`;
        blueprintFieldNames.add(nameKey);
        if (explicitFieldNames.has(nameKey)) continue;

        const key = `${nameKey}:${versionType}`;
        if (!fieldMap.has(key)) {
          fieldMap.set(key, { ...blueprintField, version_type: versionType });
        }
      }

      // B. AUTO-INJECT Structural Defaults (Mini-Blog & Gallery) only if NOT already in DB
      const hasExplicitField = (sid: string, name: string) =>
        explicitFieldNames.has(`${sid}:${name}`) || blueprintFieldNames.has(`${sid}:${name}`);
      sectionIdsArray.forEach(sid => {
        const blogKey = `${sid}:section_blog`;
        if (!hasExplicitField(sid, 'section_blog')) {
          fieldMap.set(blogKey, {
            id: `auto-blog-${sid}`,
            business_type_id: 'SECTION_TEMPLATE',
            section_id: sid,
            name: 'section_blog',
            label: 'Master Section Story (Rich Text)',
            field_type: 'rich_text',
            required_feature: 'hero_automation',
            sort_order: 1,
            help_text: 'Use this advanced editor to design the full story for this section on the page.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
            ,is_inherited: true,
          });
        }

        const newsKey = `${sid}:section_news`;
        if (!hasExplicitField(sid, 'section_news')) {
          fieldMap.set(newsKey, {
            id: `auto-news-${sid}`,
            business_type_id: 'SECTION_TEMPLATE',
            section_id: sid,
            name: 'section_news',
            label: 'Carousel Cinematic Teaser (Mini-Blog)',
            field_type: 'textarea',
            required_feature: 'hero_automation',
            sort_order: -2,
            help_text: 'This short text will appear as captions on the automated hero.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
            ,is_inherited: true,
          });
        }

        const galleryKey = `${sid}:section_gallery`;
        if (!hasExplicitField(sid, 'section_gallery')) {
          fieldMap.set(galleryKey, {
            id: `auto-gallery-${sid}`,
            business_type_id: 'SECTION_TEMPLATE',
            section_id: sid,
            name: 'section_gallery',
            label: 'Section Gallery (Serialized Captions)',
            field_type: 'gallery',
            required_feature: 'hero_automation',
            sort_order: -1,
            help_text: 'Add photos. Each photo caption becomes a slide title in the automated carousel.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
            ,is_inherited: true,
          });
        }

        const promoteKey = `${sid}:feature_on_main`;
        if (!hasExplicitField(sid, 'feature_on_main')) {
          fieldMap.set(promoteKey, {
            id: `auto-promote-${sid}`,
            business_type_id: 'SECTION_TEMPLATE',
            section_id: sid,
            name: 'feature_on_main',
            label: 'FEATURE ON MAIN WEBSITE',
            field_type: 'checkbox',
            required_feature: 'hero_automation',
            sort_order: -3,
            help_text: 'Toggle this to automatically promote this section as a slide on the main Siwify homepage.',
            acl: { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] },
            validation: {}
            ,is_inherited: true,
          });
        }
      });

      const fieldsList = Array.from(fieldMap.values()).filter(field => !section || field.section_id === resolveSectionId(section)).map(f => {
        const readRoles = Array.isArray(f.acl?.read) ? f.acl.read : ['public'];
        return {
          ...f,
          show_on_public: readRoles.includes('public')
        };
      });
      return NextResponse.json(fieldsList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    }

    const fields = await query('SELECT * FROM form_fields ORDER BY business_type_id, section_id, sort_order') as any[];
    const mappedFields = fields.map(f => {
      const parsedAcl = (() => { try { return typeof f.acl === 'string' ? JSON.parse(f.acl) : f.acl; } catch { return {}; } })();
      const readRoles = Array.isArray(parsedAcl?.read) ? parsedAcl.read : ['public'];
      return {
        ...f,
        options: (() => { try { return typeof f.options === 'string' ? JSON.parse(f.options) : f.options; } catch { return f.options; } })(),
        validation: (() => { try { return typeof f.validation === 'string' ? JSON.parse(f.validation) : f.validation; } catch { return f.validation; } })(),
        acl: parsedAcl,
        show_on_public: readRoles.includes('public')
      };
    });
    return NextResponse.json(mappedFields);
  } catch (e: any) { 
    console.error('[FORMS API ERROR]', e);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    if (body.business_id) {
      if (body.field_scope === 'catalog_spec') {
        return NextResponse.json({ error: 'Catalog specifications must be defined on a business type, not a business override.' }, { status: 400 });
      }
      await ensureBusinessOverrideTable();
      const { business_id, source_field_id = null } = body;
      const payload = { ...body };
      delete payload.business_id;
      delete payload.source_field_id;
      const id = crypto.randomUUID();
      const key = body.field_key || fieldKey(body);
      await execute(
        'INSERT INTO business_form_overrides (id, business_id, field_key, source_field_id, payload) VALUES (?, ?, ?, ?, ?)',
        [id, business_id, key, source_field_id, JSON.stringify(payload)]
      );
      return NextResponse.json({ id }, { status: 201 });
    }
    const { business_type_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, default_value, sort_order, required_feature, version_type } = body;
    const section_id = resolveSectionId(String(body.section_id || 'basic'));
    const field_scope = body.field_scope === 'catalog_spec' ? 'catalog_spec' : 'profile';
    const rawAppliesTo = parseJson(body.applies_to, []);
    const applies_to = Array.isArray(rawAppliesTo)
      ? [...new Set(rawAppliesTo.filter((item: unknown): item is string => typeof item === 'string' && CATALOG_SPEC_ITEM_TYPE_IDS.includes(item as any)))]
      : [];
    const finalVersionType = version_type === 'initial' ? 'initial' : 'latest';
    const hasFieldScopeColumns = await supportsFormFieldScope();

    if (!business_type_id || !name || !label || !field_type) {
      return NextResponse.json({ error: 'Missing required fields: business_type_id, name, label, field_type' }, { status: 400 });
    }
    if (field_scope === 'catalog_spec' && section_id !== 'sec_9_marketplace_catalog') {
      return NextResponse.json({ error: 'Catalog specification fields must belong to the Marketplace & Local Products section.' }, { status: 400 });
    }
    if (field_scope === 'catalog_spec' && !hasFieldScopeColumns) {
      return NextResponse.json({ error: 'Apply migration 039_form_field_applicability.sql before creating catalog specifications.' }, { status: 503 });
    }
    if (field_scope === 'catalog_spec' && applies_to.length === 0) {
      return NextResponse.json({ error: 'Choose at least one listing kind for this catalog specification.' }, { status: 400 });
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
    const finalValidation = typeof validation === 'string' ? validation : JSON.stringify(validation || {});
    const finalOptions = options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null;

    // Resolve ACL based on show_on_public flag
    const aclObj = acl ? (typeof acl === 'string' ? JSON.parse(acl) : acl) : { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] };
    if (body.show_on_public !== undefined) {
      const show = !!body.show_on_public;
      if (!aclObj.read) aclObj.read = [];
      if (show && !aclObj.read.includes('public')) {
        aclObj.read.push('public');
      } else if (!show) {
        aclObj.read = aclObj.read.filter((r: string) => r !== 'public');
      }
    }
    const finalAcl = JSON.stringify(aclObj);

    console.log('[FORMS POST] Creating field with params:', {
      id, business_type_id, section_id, name, label, field_type, 
      required: required ? 1 : 0, vendor_editable: vendor_editable ?? 1,
      sort_order: finalSortOrder
    });

    try {
      const commonParams = [
        id, business_type_id, section_id, name, label, field_type,
        required ? 1 : 0, vendor_editable ?? 1, searchable ? 1 : 0, help_text || null,
        finalOptions, finalValidation, finalAcl,
        default_value || null, finalSortOrder, required_feature || null,
        body.section_origin || 'own'
      ];
      if (hasFieldScopeColumns) {
        await execute(
          `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, default_value, sort_order, required_feature, section_origin, field_scope, applies_to, version_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...commonParams, field_scope, field_scope === 'catalog_spec' ? JSON.stringify(applies_to) : null, finalVersionType]
        );
      } else {
        await execute(
          `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, default_value, sort_order, required_feature, section_origin, version_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...commonParams, finalVersionType]
        );
      }
      console.log('[FORMS POST] Field created successfully');
      invalidateCache.formFields();
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
    if (body.business_id) {
      if (body.field_scope === 'catalog_spec') {
        return NextResponse.json({ error: 'Catalog specifications must be defined on a business type, not a business override.' }, { status: 400 });
      }
      await ensureBusinessOverrideTable();
      const { business_id, id, source_field_id = id } = body;
      const existingOverride = id ? await queryOne('SELECT * FROM business_form_overrides WHERE id = ? AND business_id = ?', [id, business_id]) as any : null;
      const inherited = !existingOverride && id ? await queryOne('SELECT * FROM form_fields WHERE id = ?', [id]) as any : null;
      const payload = { ...(existingOverride ? parseJson(existingOverride.payload, {}) : inherited || {}), ...body };
      delete payload.business_id;
      delete payload.source_field_id;
      delete payload.id;
      const key = existingOverride?.field_key || body.field_key || fieldKey(payload);

      if (existingOverride) {
        await execute('UPDATE business_form_overrides SET payload = ?, field_key = ?, source_field_id = ? WHERE id = ? AND business_id = ?', [JSON.stringify(payload), key, existingOverride.source_field_id || source_field_id, existingOverride.id, business_id]);
        return NextResponse.json({ success: true, id: existingOverride.id, override: true });
      }

      const overrideId = crypto.randomUUID();
      await execute(
        'INSERT INTO business_form_overrides (id, business_id, field_key, source_field_id, payload) VALUES (?, ?, ?, ?, ?)',
        [overrideId, business_id, key, source_field_id, JSON.stringify(payload)]
      );
      return NextResponse.json({ success: true, id: overrideId, override: true });
    }
    const { id, label, required, vendor_editable, searchable, help_text, sort_order, options, section_id, is_hidden, acl, validation, field_type, required_feature, version_type, field_scope, applies_to } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const currentField = await queryOne('SELECT * FROM form_fields WHERE id = ?', [id]) as any;
    const hasFieldScopeColumns = await supportsFormFieldScope();
    const targetVersionType = version_type === 'initial' ? 'initial' : 'latest';
    const currentFieldVersionType = currentField?.version_type || 'latest';
    const nextFieldScope = field_scope === undefined
      ? currentField?.field_scope || 'profile'
      : field_scope === 'catalog_spec' ? 'catalog_spec' : 'profile';
    const nextSectionId = resolveSectionId(String(section_id || currentField?.section_id || 'basic'));
    const rawNextAppliesTo = applies_to === undefined ? parseJson(currentField?.applies_to, []) : parseJson(applies_to, []);
    const nextAppliesTo = Array.isArray(rawNextAppliesTo)
      ? [...new Set(rawNextAppliesTo.filter((item: unknown): item is string => typeof item === 'string' && CATALOG_SPEC_ITEM_TYPE_IDS.includes(item as any)))]
      : [];

    if (nextFieldScope === 'catalog_spec' && nextSectionId !== 'sec_9_marketplace_catalog') {
      return NextResponse.json({ error: 'Catalog specification fields must belong to the Marketplace & Local Products section.' }, { status: 400 });
    }
    if (nextFieldScope === 'catalog_spec' && !hasFieldScopeColumns) {
      return NextResponse.json({ error: 'Apply migration 039_form_field_applicability.sql before editing catalog specifications.' }, { status: 503 });
    }
    if (nextFieldScope === 'catalog_spec' && nextAppliesTo.length === 0) {
      return NextResponse.json({ error: 'Choose at least one listing kind for this catalog specification.' }, { status: 400 });
    }

    // Editing an inherited child field creates a child-owned copy.
    if (currentField && body.business_type_id && currentField.business_type_id !== body.business_type_id) {
      const childFieldId = crypto.randomUUID();
      const childFieldParams = [
        childFieldId,
        body.business_type_id,
        nextSectionId,
        currentField.name,
        label ?? currentField.label,
        field_type ?? currentField.field_type,
        required !== undefined ? (required ? 1 : 0) : currentField.required,
        vendor_editable !== undefined ? (vendor_editable ? 1 : 0) : currentField.vendor_editable,
        searchable !== undefined ? (searchable ? 1 : 0) : currentField.searchable,
        help_text ?? currentField.help_text,
        options !== undefined ? (typeof options === 'string' ? options : JSON.stringify(options)) : currentField.options,
        validation !== undefined ? (typeof validation === 'string' ? validation : JSON.stringify(validation)) : currentField.validation,
        acl !== undefined ? (typeof acl === 'string' ? acl : JSON.stringify(acl)) : currentField.acl,
        currentField.default_value || null,
        sort_order !== undefined ? sort_order : currentField.sort_order || 0,
      ];
      if (hasFieldScopeColumns) {
        await execute(
          `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, default_value, sort_order, section_origin, field_scope, applies_to, required_feature, version_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'own', ?, ?, ?, ?)`,
          [...childFieldParams, nextFieldScope, nextFieldScope === 'catalog_spec' ? JSON.stringify(nextAppliesTo) : null, required_feature ?? currentField.required_feature ?? null, targetVersionType]
        );
      } else {
        await execute(
          `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, default_value, sort_order, section_origin, required_feature, version_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'own', ?, ?)`,
          [...childFieldParams, required_feature ?? currentField.required_feature ?? null, targetVersionType]
        );
      }
      invalidateCache.formFields();
      return NextResponse.json({ success: true, id: childFieldId, override: true });
    }

    // If we're saving to a different version than the current record, keep the current record intact
    // and create/update the sibling version record instead.
    if (currentField && currentFieldVersionType !== targetVersionType) {
      const existingSibling = await queryOne(
        'SELECT * FROM form_fields WHERE business_type_id = ? AND section_id = ? AND name = ? AND version_type = ?',
        [currentField.business_type_id, currentField.section_id, currentField.name, targetVersionType]
      ) as any;

      const siblingId = existingSibling?.id || crypto.randomUUID();
      const fieldPayload = {
        ...currentField,
        ...body,
        id: siblingId,
        version_type: targetVersionType,
        section_id: nextSectionId,
        field_type: field_type || currentField.field_type,
        name: currentField.name,
        business_type_id: currentField.business_type_id,
        label: label || currentField.label,
        field_scope: nextFieldScope,
        applies_to: nextFieldScope === 'catalog_spec' ? nextAppliesTo : null,
      };

      const siblingParams = [
          fieldPayload.id,
          fieldPayload.business_type_id,
          fieldPayload.section_id,
          fieldPayload.name,
          fieldPayload.label,
          fieldPayload.field_type,
          fieldPayload.required ? 1 : 0,
          fieldPayload.vendor_editable ?? 1,
          fieldPayload.searchable ? 1 : 0,
          fieldPayload.help_text || null,
          fieldPayload.options ? (typeof fieldPayload.options === 'string' ? fieldPayload.options : JSON.stringify(fieldPayload.options)) : null,
          fieldPayload.validation ? (typeof fieldPayload.validation === 'string' ? fieldPayload.validation : JSON.stringify(fieldPayload.validation)) : JSON.stringify({}),
          fieldPayload.acl ? (typeof fieldPayload.acl === 'string' ? fieldPayload.acl : JSON.stringify(fieldPayload.acl)) : JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] }),
          sort_order !== undefined ? sort_order : currentField.sort_order || 0,
          fieldPayload.section_origin || currentField.section_origin || 'own',
          required_feature || currentField.required_feature || null,
          targetVersionType,
      ];
      if (hasFieldScopeColumns) {
        await execute(
          `REPLACE INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, sort_order, section_origin, field_scope, applies_to, required_feature, version_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...siblingParams.slice(0, 15), fieldPayload.field_scope || currentField.field_scope || 'profile', fieldPayload.field_scope === 'catalog_spec' ? JSON.stringify(fieldPayload.applies_to || []) : null, ...siblingParams.slice(15)]
        );
      } else {
        await execute(
          `REPLACE INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, sort_order, section_origin, required_feature, version_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          siblingParams
        );
      }

      return NextResponse.json({ success: true, id: siblingId });
    }

    // Resolve ACL updates based on show_on_public flag
    let finalAclString = undefined;
    if (body.show_on_public !== undefined || acl !== undefined) {
      let aclObj = acl ? (typeof acl === 'string' ? JSON.parse(acl) : acl) : null;
      if (!aclObj && currentField?.acl) {
        aclObj = typeof currentField.acl === 'string' ? JSON.parse(currentField.acl) : currentField.acl;
      }
      if (!aclObj) {
        aclObj = { read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] };
      }
      if (body.show_on_public !== undefined) {
        const show = !!body.show_on_public;
        if (!aclObj.read) aclObj.read = [];
        if (show && !aclObj.read.includes('public')) {
          aclObj.read.push('public');
        } else if (!show) {
          aclObj.read = aclObj.read.filter((r: string) => r !== 'public');
        }
      }
      finalAclString = JSON.stringify(aclObj);
    }

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
    if (section_id !== undefined) { updates.push('section_id=?'); params.push(nextSectionId); }
    if (field_scope !== undefined && hasFieldScopeColumns) { updates.push('field_scope=?'); params.push(nextFieldScope); }
    if ((applies_to !== undefined || field_scope !== undefined) && hasFieldScopeColumns) {
      updates.push('applies_to=?');
      params.push(nextFieldScope === 'catalog_spec' ? JSON.stringify(nextAppliesTo) : null);
    }
    if (finalAclString !== undefined) { updates.push('acl=?'); params.push(finalAclString); }
    else if (acl !== undefined) { updates.push('acl=?'); params.push(typeof acl === 'string' ? acl : JSON.stringify(acl)); }
    if (validation !== undefined) { updates.push('validation=?'); params.push(typeof validation === 'string' ? validation : JSON.stringify(validation)); }
    if (required_feature !== undefined) { updates.push('required_feature=?'); params.push(required_feature); }
    if (version_type !== undefined) { updates.push('version_type=?'); params.push(targetVersionType); }

    if (updates.length > 0) {
      params.push(id);
      const result = await execute(`UPDATE form_fields SET ${updates.join(',')} WHERE id=?`, params);
      
      // SELF-HEALING: If no rows were updated and it's an auto-generated ID, materialize it now!
      if (result.affectedRows === 0 && id.startsWith('auto-')) {
        console.log(`[FORMS PUT] Virtual ID ${id} detected. Materializing...`);
        const name = body.name || id.split('-').pop(); // Extract name from auto-blog-sid
        const virtualFieldParams = [
          id,
          nextSectionId,
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
        ];
        if (hasFieldScopeColumns) {
          await execute(
            `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, sort_order, section_origin, field_scope, applies_to, required_feature, version_type)
             VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'template', 'profile', NULL, ?, ?)`,
            [...virtualFieldParams, required_feature || null, targetVersionType]
          );
        } else {
          await execute(
            `INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, validation, acl, sort_order, section_origin, required_feature, version_type)
             VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'template', ?, ?)`,
            [...virtualFieldParams, required_feature || null, targetVersionType]
          );
        }
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
    const businessId = searchParams.get('business');

    if (businessId && id) {
      await ensureBusinessOverrideTable();
      await execute('DELETE FROM business_form_overrides WHERE id = ? AND business_id = ?', [id, businessId]);
      return NextResponse.json({ success: true, deleted: 'business override' });
    }

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
