/**
 * Field groups — the categorization layer between a section and a hero slide.
 *
 * A section answers "what does this page say about this business", one value per
 * question. A group is the admin's own name for a bundle of those questions
 * ("الشروط المالية / Financial terms", "الحجز والإلغاء / Booking & cancellation"),
 * so a slide can present a category instead of eight loose keys.
 *
 * A group is scoped by exactly the same triple a field is
 * (`business_type_id`, `section_id`, `name`), which is what lets the existing
 * `SECTION_TEMPLATE -> parent -> child` walk in `api/jana/forms` resolve it
 * without inventing a second inheritance system: define a group on
 * `accommodation` and its 15 children inherit it; a child may redefine the same
 * `name` to change its label or membership.
 *
 * Membership lives on the field (`form_fields.group_key`), not in a join table,
 * for the same reason: a field that is inherited, overridden or excluded carries
 * its group with it automatically, so there is no second copy of the truth to
 * keep in sync.
 *
 * No database here — the admin editor and the slide overlay both import this,
 * and neither may pull mysql2 into the browser bundle.
 */

import { resolveSectionId } from '@/lib/section-registry';

export interface FieldGroupDef {
  id: string;
  /** 'SECTION_TEMPLATE', a parent typology, or a child — same scoping as a field. */
  businessTypeId: string;
  sectionId: string;
  name: string;
  label: string;
  labelAr: string | null;
  helpText?: string | null;
  sortOrder?: number;
}

export interface GroupedField {
  name: string;
  label: string;
  labelAr?: string | null;
  value?: string;
  /** 'hide_value' keeps the label and blanks the answer; 'hide_field' omits both. */
  valueHidden?: boolean;
}

/** The cap one block can carry — mirrors `MAX_FIELDS_PER_BLOCK` in slide-blocks.ts. */
export const FIELDS_PER_GROUP_PAGE = 8;

export function groupKeyOf(group: Pick<FieldGroupDef, 'sectionId' | 'name'>): string {
  return `${resolveSectionId(group.sectionId)}:${String(group.name || '').trim()}`;
}

/**
 * Index the groups a typology chain resolves to, most specific winning.
 *
 * `rows` must arrive in inheritance order (universal first, then root, then
 * child), which is the order `api/jana/forms` already fetches them in. A later
 * row with the same (section, name) replaces the earlier one wholesale — the
 * same rule `fieldKey()` applies to fields, so a group and its fields can never
 * disagree about which level won.
 */
export function buildGroupIndex(rows: Array<Partial<FieldGroupDef> & Record<string, any>>): Map<string, FieldGroupDef> {
  const index = new Map<string, FieldGroupDef>();
  for (const row of rows || []) {
    const name = String(row?.name ?? '').trim();
    const sectionId = String(row?.section_id ?? row?.sectionId ?? '').trim();
    if (!name || !sectionId) continue;
    const def: FieldGroupDef = {
      id: String(row.id ?? `${sectionId}:${name}`),
      businessTypeId: String(row.business_type_id ?? row.businessTypeId ?? ''),
      sectionId: resolveSectionId(sectionId),
      name,
      label: String(row.label ?? name.replace(/[_-]+/g, ' ')),
      labelAr: row.label_ar || row.labelAr ? String(row.label_ar || row.labelAr) : null,
      helpText: row.help_text ?? row.helpText ?? null,
      sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    };
    index.set(groupKeyOf(def), def);
  }
  return index;
}

/** The heading one block prints, in the language the page speaks. */
export function groupHeading(group: FieldGroupDef | undefined, ar: boolean): string | null {
  if (!group) return null;
  const text = ar ? (group.labelAr || group.label) : group.label;
  const trimmed = String(text ?? '').trim();
  return trimmed || null;
}

/**
 * Every field a block should print for one group, in the order the admin set.
 *
 * Membership is read off the field definitions, so a field the child excluded
 * (`form_fields.excluded = 1`) is simply absent from the list it was built from
 * and cannot reappear here. Passing `undefined` for `groupKey` returns the
 * caller's own list untouched, which is what keeps every slide saved before this
 * layer rendering exactly as it did.
 */
export function expandGroupFields(
  groupKey: string | null | undefined,
  fieldsInSection: GroupedField[],
): GroupedField[] {
  const key = String(groupKey ?? '').trim();
  if (!key) return fieldsInSection;
  return fieldsInSection.filter(field => String((field as any).groupKey ?? '') === key);
}

/**
 * Split a resolved group into the pages a carousel can carry.
 *
 * A block holds eight keys and a slide holds six blocks, so a fourteen-field
 * category is not one slide — it is two slides under the same heading. The
 * caller decides whether to write those as real slides; this only says where
 * the cut falls, and never silently drops the tail.
 */
export function chunkGroupFields(
  fields: GroupedField[],
  perPage = FIELDS_PER_GROUP_PAGE,
): GroupedField[][] {
  const size = Math.max(1, Math.floor(perPage));
  const pages: GroupedField[][] = [];
  for (let i = 0; i < fields.length; i += size) pages.push(fields.slice(i, i + size));
  return pages;
}

export function groupPageCount(totalFields: number, perPage = FIELDS_PER_GROUP_PAGE): number {
  if (totalFields <= 0) return 0;
  return Math.ceil(totalFields / Math.max(1, Math.floor(perPage)));
}
