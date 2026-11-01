import { query } from '@/lib/db';
import { resolveSectionId } from '@/lib/section-registry';

/**
 * The field definitions a minisite's own sections ask, in the shape the hero
 * info blocks read (`buildFieldsIndexFromSections`).
 *
 * The sectional page (`/[slug]/[section]`) already carries `sections[].fields`
 * because it renders the field grid itself. The flat landing page (`/[slug]`)
 * never needed them — until an admin placed a "fields + values" block on a hero
 * slide there: the block had the picks but no definitions to resolve them from,
 * so it printed nothing while the same slide worked on the section tab. This is
 * the one query that makes the two surfaces answer alike.
 *
 * The walk is the full typology chain, not just the typology and the universal
 * template. A child like `hotel_units` defines almost nothing of its own — its
 * questions are inherited from `accommodation` — so a shallow predicate returned
 * an empty set for exactly the businesses whose slides need it most. The same
 * `SECTION_TEMPLATE -> parent -> child` order the admin form API uses, so a hero
 * block and the vendor's form never disagree about which definition won.
 */

export interface MinisiteSectionFieldDef {
  name: string;
  label: string | null;
  /** The Arabic question. Nullable: an absent one means the field was written in English only. */
  label_ar: string | null;
  field_type?: string;
  /**
   * The admin's category within the section (`field_groups.name`). Carried rather
   * than re-queried so a group block can find its members from the index alone.
   */
  group_key?: string | null;
}

/** One `field_groups` row resolved to the section it belongs to. */
export interface MinisiteSectionGroupDef {
  name: string;
  label: string;
  label_ar: string | null;
  sort_order: number;
}

/** A group plus the canonical section it was defined in — what the caller needs to file it. */
type ResolvedGroup = MinisiteSectionGroupDef & { sectionId: string };

export interface MinisiteSectionFields {
  /** Canonical section id — the key `custom_data` stores that section's answers under. */
  id: string;
  fields: MinisiteSectionFieldDef[];
  /** The categories the admin named inside this section, in their own order. */
  groups: MinisiteSectionGroupDef[];
}

/**
 * Does this database have the group layer yet?
 *
 * Checked once and cached for the same reason `api/jana/forms` caches it: the
 * columns are named in the SELECT list, so asking for them on a database where
 * `20261116_field_groups.sql` has not been applied would fail the whole query and
 * leave every hero block on every minisite printing nothing. With the check, a
 * missing migration costs the groups and changes nothing else.
 */
let groupLayerSupport: { value: boolean; checkedAt: number } | null = null;

async function supportsFieldGroups(): Promise<boolean> {
  if (groupLayerSupport && Date.now() - groupLayerSupport.checkedAt < 30000) return groupLayerSupport.value;
  try {
    const columns = await query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'form_fields'
         AND COLUMN_NAME IN ('group_key', 'excluded')`
    ) as any[];
    const tables = await query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'field_groups'`
    ) as any[];
    const available = columns.length === 2 && tables.length === 1;
    groupLayerSupport = { value: available, checkedAt: Date.now() };
    return available;
  } catch {
    groupLayerSupport = { value: false, checkedAt: Date.now() };
    return false;
  }
}

/**
 * `SECTION_TEMPLATE` first, then the root typology, then … then the typology
 * itself last, so a caller can simply process rows in that order and let the
 * most specific definition overwrite what came before — the merge rule the admin
 * form API already follows.
 */
export async function resolveTypologyChainIds(typeId: string | null | undefined): Promise<string[]> {
  const chain: string[] = [];
  const type = String(typeId || '').trim();
  if (!type) return chain;

  const visited = new Set<string>();
  let currentId: string | null = type;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const row: any[] = await query<any>('SELECT id, parent_id FROM business_types WHERE id = ?', [currentId]).catch(() => []);
    const found: any = Array.isArray(row) ? row[0] : null;
    if (!found) break;
    chain.unshift(String(found.id));
    currentId = found.parent_id ? String(found.parent_id) : null;
  }
  return chain;
}

/** Group rows for a typology chain, in inheritance order (universal first, child last). */
export async function loadFieldGroupsForChain(
  chainIds: string[],
  sectionIds?: string[]
): Promise<ResolvedGroup[]> {
  if (!chainIds.length || !(await supportsFieldGroups())) return [];
  const wanted = [...new Set((sectionIds || []).filter(Boolean).map(resolveSectionId))];
  const placeholders = chainIds.map(() => '?').join(',');
  let sql = `SELECT g.section_id, g.name, g.label, g.label_ar, g.sort_order, g.business_type_id
               FROM field_groups g
              WHERE g.business_type_id IN (${placeholders})
                AND g.active = 1`;
  const params: any[] = [...chainIds];
  if (wanted.length) {
    const secPlaceholders = wanted.map(() => '?').join(',');
    sql += ` AND g.section_id IN (${secPlaceholders})`;
    params.push(...wanted);
  }
  // Same ranking the field merge uses, so a group and the fields inside it can
  // never disagree about which level of the typology won.
  sql += ` ORDER BY CASE business_type_id` +
    chainIds.map(() => ' WHEN ? THEN ?').join('') +
    ` ELSE 0 END DESC, g.sort_order ASC`;
  const rankedParams = [...params];
  chainIds.forEach((id, index) => rankedParams.push(id, chainIds.length - index));

  const rows = await query<any>(sql, rankedParams).catch(() => []);
  const merged = new Map<string, ResolvedGroup>();
  for (const row of rows || []) {
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    const sectionId = resolveSectionId(String(row?.section_id || ''));
    if (!name || !sectionId) continue;
    if (wanted.length && !wanted.includes(sectionId)) continue;
    merged.set(`${sectionId}:${name}`, {
      sectionId,
      name,
      label: String(row.label || name.replace(/[_-]+/g, ' ')),
      label_ar: row.label_ar ? String(row.label_ar) : null,
      sort_order: Number(row.sort_order || 0),
    });
  }
  // Queried least-specific first; the ORDER BY above lets the most specific level
  // replace a group of the same (section, name) wholesale, exactly like a field.
  return Array.from(merged.values()).sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * The definitions and categories one set of sections asks for one typology.
 *
 * `excluded = 1` is the subtractive case the additive merge could not express: a
 * child that inherits a parent question and refuses it marks its own row
 * excluded, and the field disappears from the resolved form here rather than
 * being re-typed at every level that wants it gone.
 */
export async function loadMinisiteSectionFields(
  typeId: string | null | undefined,
  sectionIds: string[]
): Promise<MinisiteSectionFields[]> {
  const wanted = [...new Set((sectionIds || []).filter(Boolean).map(resolveSectionId))];
  if (!wanted.length) return [];

  const chainIds = await resolveTypologyChainIds(typeId);
  const hasGroups = await supportsFieldGroups();
  const idsToFetch = chainIds.length ? ['SECTION_TEMPLATE', ...chainIds] : ['SECTION_TEMPLATE'];

  const placeholders = wanted.map(() => '?').join(',');
  // Only this typology chain's questions plus the universal template's — a field
  // some unrelated business type defined under the same section id is not this page's.
  const extraColumns = hasGroups ? ', group_key, excluded' : '';
  const rows = await query<any>(
    `SELECT section_id, name, label, label_ar, field_type, sort_order, business_type_id${extraColumns}
       FROM form_fields
      WHERE section_id IN (${placeholders})
        AND business_type_id IN (?)
      ORDER BY CASE business_type_id` +
      idsToFetch.map(() => ' WHEN ? THEN ?').join('') +
      ` ELSE 0 END ASC, sort_order ASC`,
    [wanted, idsToFetch, ...idsToFetch.flatMap((id, index) => [id, index + 1])]
  ).catch(() => []);

  // A field is attached to the section it is asked in, but the row may name that
  // section by a legacy alias (`facilities` for `sec_3_facilities`), and the
  // answer in custom_data is keyed by the canonical id. One resolution step keeps
  // the block, the grid and the stored value on the same section.
  const grouped = new Map<string, MinisiteSectionFieldDef[]>();
  const seen = new Map<string, Set<string>>();

  for (const row of rows || []) {
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    if (!name) continue;
    if (hasGroups && Number(row?.excluded ?? 0) === 1) {
      // The most specific row wins last, so a child's exclusion is only visible
      // once every inherited copy has already been written — dropping the field
      // here would delete a parent's answer that this level never refused.
      const bucket = grouped.get(resolveSectionId(String(row.section_id || '')));
      if (bucket) {
        const cut = bucket.findIndex(field => field.name === name);
        if (cut >= 0) bucket.splice(cut, 1);
        seen.get(resolveSectionId(String(row.section_id || '')))?.delete(name);
      }
      continue;
    }
    const sectionId = resolveSectionId(String(row.section_id || ''));
    if (!wanted.includes(sectionId)) continue;

    const bucket = grouped.get(sectionId) || [];
    const names = seen.get(sectionId) || new Set<string>();
    const groupKey = hasGroups && typeof row?.group_key === 'string' && row.group_key.trim() ? row.group_key.trim() : null;
    const existing = bucket.findIndex(field => field.name === name);
    if (existing >= 0) {
      // Later (more specific) rows replace the earlier definition wholesale.
      bucket[existing] = { name, label: row.label ? String(row.label) : null, label_ar: row.label_ar ? String(row.label_ar) : null, field_type: row.field_type ? String(row.field_type) : undefined, group_key: groupKey };
      grouped.set(sectionId, bucket);
      continue;
    }
    names.add(name);
    bucket.push({
      name,
      label: row.label ? String(row.label) : null,
      label_ar: row.label_ar ? String(row.label_ar) : null,
      field_type: row.field_type ? String(row.field_type) : undefined,
      group_key: groupKey,
    });
    grouped.set(sectionId, bucket);
    seen.set(sectionId, names);
  }

  const groups = await loadFieldGroupsForChain(chainIds.length ? idsToFetch : [], wanted);
  const groupsBySection = new Map<string, MinisiteSectionGroupDef[]>();
  for (const group of groups) {
    const bucket = groupsBySection.get(group.sectionId) || [];
    bucket.push({ name: group.name, label: group.label, label_ar: group.label_ar, sort_order: group.sort_order });
    groupsBySection.set(group.sectionId, bucket);
  }

  return wanted
    .filter(id => (grouped.get(id) || []).length > 0 || (groupsBySection.get(id) || []).length > 0)
    .map(id => ({
      id,
      fields: grouped.get(id) || [],
      groups: groupsBySection.get(id) || [],
    }));
}
