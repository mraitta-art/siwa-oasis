import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS } from '@/lib/section-registry';
import { invalidateCache } from '@/lib/cache';

const SECTION_COLUMNS = ['id', 'name', 'icon', 'required', 'vendor_editable', 'show_on_public', 'is_universal', 'display_order', 'sort_order', 'active'];
const TYPE_COLUMNS = ['id', 'name', 'icon', 'icon_color', 'description', 'is_parent', 'parent_id', 'sections', 'own_sections', 'sort_order', 'active'];
const FIELD_COLUMNS = ['id', 'business_type_id', 'section_id', 'name', 'label', 'field_type', 'required', 'vendor_editable', 'searchable', 'help_text', 'options', 'validation', 'acl', 'default_value', 'sort_order', 'required_feature', 'section_origin', 'version_type'];

function parseJson(value: unknown, fallback: unknown) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function cleanRow(row: Record<string, unknown>, columns: string[]) {
  return columns.reduce<Record<string, unknown>>((result, column) => {
    if (row[column] !== undefined) result[column] = row[column];
    return result;
  }, {});
}

function sqlValue(value: unknown) {
  return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
}

async function upsert(table: string, row: Record<string, unknown>, key: string) {
  const entries = Object.entries(row);
  const columns = entries.map(([column]) => column);
  const values = entries.map(([, value]) => sqlValue(value));
  const updates = columns.filter(column => column !== key).map(column => `${column} = VALUES(${column})`);
  await execute(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) ON DUPLICATE KEY UPDATE ${updates.join(', ') || `${key} = VALUES(${key})`}`,
    values
  );
}

export async function GET() {
  try {
    await requireAdmin();
    const sections = await query('SELECT * FROM sections WHERE id IN (?) ORDER BY display_order, sort_order, id', [CANONICAL_SECTION_IDS]);
    const types = await query('SELECT * FROM business_types ORDER BY sort_order, id');
    const fields = await query('SELECT * FROM form_fields WHERE section_id IN (?) ORDER BY business_type_id, section_id, sort_order, name', [CANONICAL_SECTION_IDS]);
    return NextResponse.json({
      format: 'siwa-blueprint',
      version: 1,
      exported_at: new Date().toISOString(),
      canonical_section_ids: CANONICAL_SECTION_IDS,
      sections,
      business_types: types,
      form_fields: fields,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Blueprint export failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const packageData = await request.json();
    if (packageData?.format !== 'siwa-blueprint' || packageData?.version !== 1) {
      return NextResponse.json({ error: 'Invalid blueprint package format' }, { status: 400 });
    }
    if (!Array.isArray(packageData.sections) || !Array.isArray(packageData.business_types) || !Array.isArray(packageData.form_fields)) {
      return NextResponse.json({ error: 'Blueprint package is missing sections, business types, or fields' }, { status: 400 });
    }

    const sectionIds = new Set(CANONICAL_SECTION_IDS);
    const importedSections = packageData.sections.filter((row: any) => sectionIds.has(row.id));
    const importedTypes = packageData.business_types.filter((row: any) => typeof row.id === 'string' && row.id !== 'SECTION_TEMPLATE');
    const typeIds = new Set(importedTypes.map((row: any) => row.id));
    const importedFields = packageData.form_fields.filter((row: any) => sectionIds.has(row.section_id) && typeIds.has(row.business_type_id));

    for (const raw of importedSections) {
      const row = cleanRow(raw, SECTION_COLUMNS);
      if (row.id && row.name) await upsert('sections', row, 'id');
    }
    for (const raw of importedTypes) {
      const row = cleanRow(raw, TYPE_COLUMNS);
      if (row.id && row.name) {
        row.sections = parseJson(row.sections, []);
        row.own_sections = parseJson(row.own_sections, []);
        await upsert('business_types', row, 'id');
      }
    }
    for (const raw of importedFields) {
      const row = cleanRow(raw, FIELD_COLUMNS);
      if (row.id && row.business_type_id && row.section_id && row.name && row.label && row.field_type) {
        row.options = parseJson(row.options, null);
        row.validation = parseJson(row.validation, {});
        row.acl = parseJson(row.acl, {});
        await upsert('form_fields', row, 'id');
      }
    }

    invalidateCache.businessTypes();
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({ success: true, sections: importedSections.length, business_types: importedTypes.length, form_fields: importedFields.length });
  } catch (error: any) {
    console.error('[BLUEPRINT IMPORT ERROR]', error);
    return NextResponse.json({ error: error.message || 'Blueprint import failed' }, { status: 500 });
  }
}
