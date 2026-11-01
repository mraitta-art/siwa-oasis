import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { getSectionLookupIds, resolveSectionId } from '@/lib/section-registry';
import { resolveTypologyChainIds } from '@/lib/minisite-section-fields';

/**
 * Field groups — the categorization layer an admin creates inside a section.
 *
 * A group is scoped by exactly the triple a field is
 * (`business_type_id`, `section_id`, `name`), which is what lets it inherit
 * through the typology walk that already exists instead of adding a second
 * system: define "الشروط المالية / Financial terms" on `accommodation` and its
 * children resolve it; a child may define the same `name` to change the wording
 * or the membership, and that level wins.
 *
 * Membership itself lives on the field (`form_fields.group_key`), written through
 * `/api/jana/forms`, so an inherited, overridden or excluded field always carries
 * its own category with it. This route owns the categories; it never copies a
 * field into them.
 */

const NAME_PATTERN = /^[a-z0-9][a-z0-9_]{1,63}$/;

let groupLayerSupport: { value: boolean; checkedAt: number } | null = null;

async function supportsFieldGroups() {
  if (groupLayerSupport && Date.now() - groupLayerSupport.checkedAt < 30000) return groupLayerSupport.value;
  try {
    const tables = await query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'field_groups'`
    ) as any[];
    const columns = await query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'form_fields'
         AND COLUMN_NAME IN ('group_key', 'excluded')`
    ) as any[];
    const available = tables.length === 1 && columns.length === 2;
    groupLayerSupport = { value: available, checkedAt: Date.now() };
    return available;
  } catch {
    groupLayerSupport = { value: false, checkedAt: Date.now() };
    return false;
  }
}

const MIGRATION_MESSAGE = 'Apply migrations/20261116_field_groups.sql before editing field groups.';

/** `SECTION_TEMPLATE` first, then root … then the typology itself last. */
async function sourceIdsFor(typeId: string): Promise<string[]> {
  const chain = await resolveTypologyChainIds(typeId);
  return ['SECTION_TEMPLATE', ...(chain.length ? chain : [typeId])];
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    if (!(await supportsFieldGroups())) {
      return NextResponse.json({ error: MIGRATION_MESSAGE, rule: 'field_groups_migration_missing' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('type');
    const businessId = searchParams.get('business');
    const sectionFilter = searchParams.get('section');
    const includeInherited = searchParams.get('include_inherited') !== 'false';

    let resolvedTypeId = typeId;
    if (!resolvedTypeId && businessId) {
      const rows = await query<any>('SELECT type_id FROM businesses WHERE id = ?', [businessId]).catch(() => []);
      resolvedTypeId = rows[0]?.type_id ? String(rows[0].type_id) : null;
    }
    if (!resolvedTypeId) {
      return NextResponse.json({ error: 'Provide a type or business param.' }, { status: 400 });
    }

    const sourceIds = includeInherited ? await sourceIdsFor(resolvedTypeId) : [resolvedTypeId];
    const placeholders = sourceIds.map(() => '?').join(',');

    const rows = await query<any>(
      `SELECT id, business_type_id, section_id, name, label, label_ar, help_text, sort_order, active
         FROM field_groups
        WHERE business_type_id IN (${placeholders})
        ORDER BY CASE business_type_id` +
        sourceIds.map(() => ' WHEN ? THEN ?').join('') +
        ` ELSE 0 END ASC, sort_order ASC, name ASC`,
      [...sourceIds, ...sourceIds.flatMap((id, index) => [id, index + 1])]
    );

    // Later (more specific) rows replace an earlier group of the same
    // (section, name) wholesale — the identical rule `api/jana/forms` applies to
    // fields, so a category and the fields inside it cannot disagree.
    const merged = new Map<string, any>();
    for (const row of rows || []) {
      const sectionId = resolveSectionId(String(row.section_id || ''));
      const name = String(row.name || '');
      if (!name) continue;
      merged.set(`${sectionId}:${name}`, {
        ...row,
        section_id: sectionId,
        is_inherited: row.business_type_id !== resolvedTypeId,
        source_level: row.business_type_id === 'SECTION_TEMPLATE' ? 'universal' : row.business_type_id === resolvedTypeId ? 'selected' : 'parent',
      });
    }
    // Membership is per field, and a field inherited from a parent keeps its own
    // `group_key`, so a group is resolved from the definitions that carry it
    // rather than counted at one level only.
    const groups = Array.from(merged.values());
    if (sectionFilter) {
      const wanted = resolveSectionId(sectionFilter);
      return NextResponse.json(groups.filter(g => g.section_id === wanted));
    }
    return NextResponse.json(groups.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
  } catch (e: any) {
    console.error('[FIELD GROUPS GET ERROR]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    if (!(await supportsFieldGroups())) {
      return NextResponse.json({ error: MIGRATION_MESSAGE, rule: 'field_groups_migration_missing' }, { status: 503 });
    }

    const body = await request.json();
    const businessTypeId = String(body.business_type_id || '').trim();
    const name = String(body.name || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    const label = String(body.label || '').trim();
    const labelAr = String(body.label_ar || '').trim();
    const sectionId = resolveSectionId(String(body.section_id || '').trim());

    if (!businessTypeId || !sectionId) {
      return NextResponse.json({ error: 'business_type_id and section_id are required.' }, { status: 400 });
    }
    if (!NAME_PATTERN.test(name)) {
      return NextResponse.json(
        { error: 'A category key is a stable identifier: lowercase letters, digits and underscores, 2-64 characters (e.g. "financial_terms"). The wording visitors see goes in the label fields.' },
        { status: 400 }
      );
    }
    if (!label || !labelAr) {
      return NextResponse.json(
        { error: 'A category needs both languages: an English label and its Arabic one. An /ar slide printing an English heading is a visible defect, not a fallback.' },
        { status: 400 }
      );
    }

    const sectionRows = await query<any>('SELECT id FROM sections WHERE id = ?', [sectionId]).catch(() => []);
    if (!sectionRows.length) {
      return NextResponse.json({ error: `Section "${sectionId}" does not exist. Create it in /jana/sections first.` }, { status: 400 });
    }

    const id = String(body.id || '').trim() || crypto.randomUUID();
    const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
    const active = body.active === false ? 0 : 1;

    await execute(
      `INSERT INTO field_groups (id, business_type_id, section_id, name, label, label_ar, help_text, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label = VALUES(label), label_ar = VALUES(label_ar), help_text = VALUES(help_text),
                               sort_order = VALUES(sort_order), active = VALUES(active)`,
      [id, businessTypeId, sectionId, name, label, labelAr, String(body.help_text || '').trim() || null, sortOrder, active]
    );

    const [existing] = await query<any>('SELECT id FROM field_groups WHERE business_type_id = ? AND section_id = ? AND name = ?', [businessTypeId, sectionId, name]);
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({ id: existing?.id || id, created: true }, { status: 201 });
  } catch (e: any) {
    console.error('[FIELD GROUPS POST ERROR]', e);
    const message = String(e?.message || '');
    if (/duplicate/i.test(message)) {
      return NextResponse.json({ error: `Category "${e.message}" already exists at this level of the typology. Edit it instead of creating a second one.` }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    if (!(await supportsFieldGroups())) {
      return NextResponse.json({ error: MIGRATION_MESSAGE, rule: 'field_groups_migration_missing' }, { status: 503 });
    }

    const body = await request.json();
    const id = String(body.id || '').trim();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const current = await query<any>('SELECT * FROM field_groups WHERE id = ?', [id]);
    if (!current.length) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    const row = current[0];

    const updates: string[] = [];
    const params: any[] = [];
    if (body.label !== undefined) {
      const label = String(body.label).trim();
      if (!label) return NextResponse.json({ error: 'The English label cannot be empty.' }, { status: 400 });
      updates.push('label=?'); params.push(label);
    }
    if (body.label_ar !== undefined) {
      const labelAr = String(body.label_ar).trim();
      if (!labelAr) return NextResponse.json({ error: 'The Arabic label cannot be empty — an /ar slide would print an English heading.' }, { status: 400 });
      updates.push('label_ar=?'); params.push(labelAr);
    }
    if (body.help_text !== undefined) { updates.push('help_text=?'); params.push(String(body.help_text).trim() || null); }
    if (body.sort_order !== undefined) { updates.push('sort_order=?'); params.push(Number(body.sort_order) || 0); }
    if (body.active !== undefined) { updates.push('active=?'); params.push(body.active ? 1 : 0); }

    // Renaming the key is a rename of the membership link, not a new category:
    // every field carrying the old name is moved with it, or the group would be
    // left empty and the old one orphaned across the whole typology.
    let renamedFrom: string | null = null;
    if (body.name !== undefined) {
      const name = String(body.name).trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (!NAME_PATTERN.test(name)) return NextResponse.json({ error: 'Category key format invalid: lowercase letters, digits and underscores, 2-64 characters.' }, { status: 400 });
      if (name !== row.name) {
        updates.push('name=?'); params.push(name);
        renamedFrom = row.name;
      }
    }
    if (body.section_id !== undefined) {
      const sectionId = resolveSectionId(String(body.section_id).trim());
      if (sectionId && sectionId !== row.section_id) { updates.push('section_id=?'); params.push(sectionId); }
    }

    if (updates.length) {
      params.push(id);
      await execute(`UPDATE field_groups SET ${updates.join(',')} WHERE id = ?`, params);
    }

    if (renamedFrom) {
      const newName = String(body.name).trim().toLowerCase().replace(/[\s-]+/g, '_');
      await execute('UPDATE form_fields SET group_key = ? WHERE business_type_id = ? AND group_key = ?', [newName, row.business_type_id, renamedFrom]);
    }

    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[FIELD GROUPS PUT ERROR]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    if (!(await supportsFieldGroups())) {
      return NextResponse.json({ error: MIGRATION_MESSAGE, rule: 'field_groups_migration_missing' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Provide an id param' }, { status: 400 });

    const rows = await query<any>('SELECT * FROM field_groups WHERE id = ?', [id]);
    if (!rows.length) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    const row = rows[0];

    await execute('DELETE FROM field_groups WHERE id = ?', [id]);
    // Deleting the category must not delete an answer: the fields stay exactly as
    // they are, only ungrouped, so nothing vanishes from a vendor's form or the
    // body grid. A block that still names the gone group renders without a
    // heading rather than printing a stale label.
    await execute('UPDATE form_fields SET group_key = NULL WHERE business_type_id = ? AND section_id IN (?) AND group_key = ?', [
      row.business_type_id,
      getSectionLookupIds(String(row.section_id)),
      row.name,
    ]);

    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({ success: true, ungrouped: true });
  } catch (e: any) {
    console.error('[FIELD GROUPS DELETE ERROR]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
