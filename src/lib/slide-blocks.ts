/**
 * Slide Info Blocks — a per-slide, admin-approved content layer for the
 * minisite hero carousel. A slide already owns media (image/video/YouTube/
 * embed) + title/subtitle/caption; this library adds placed "info blocks"
 * that surface captions, field labels, or field label+value pairs at
 * fixed positions with a preset layout.
 *
 * Design decisions (locked with the user):
 *   - Slides and body are independent surfaces. A field may appear on the hero
 *     block, on the body grid, on both, or on neither — the admin's call, made
 *     through the field visibility system (`hide_field` / `hide_value`), not
 *     through an automatic exclusion.
 *   - 9-zone grid (not free drag): safe under RTL + mobile.
 *   - Layouts: pill (caption), minimal text, vertical card, chip row, glass
 *     panel, and spec-sheet (a table-style block whose price-bearing fields are
 *     formatted with the minisite's listing kind: /night, /month, or total).
 *   - Governance: vendor may PROPOSE blocks, but `approved` is admin-only.
 *     Any write from a non-admin path forces approved=false.
 *   - Storage: JSON inside the existing `website_configs.hero_carousel_*`
 *     row (no DB migration). Hiding never deletes; raw field values stay
 *     in custom_data so section-blog interpolation is preserved.
 */

import { getSectionLookupIds, resolveSectionId } from '@/lib/section-registry';

export type BlockKind =
  | 'caption'          // reuse slide.caption as a positioned block (already exists)
  | 'fieldLabels'      // just labels: [Location] [Price] [Area]
  | 'fieldValues'      // just values (masked respected): [Siwa] [850 EGP] [120m²]
  | 'fieldsValues';    // label + value pairs, admin-approved presentation

export type BlockZone =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type BlockLayout =
  | 'pill'         // small uppercase pill (default for caption)
  | 'minimal'      // plain text, no container
  | 'card'         // vertical card: label above value, thin divider between pairs
  | 'chip-row'     // horizontal wrap of chips (good for feature lists)
  | 'glass'        // glass panel with heavier blur (spec-list feel)
  | 'spec-sheet';  // table rows with kind-aware price formatting (sale / rent / stay)

export interface SlideBlock {
  /** Stable id so the admin UI can reorder + React can key. */
  id: string;
  kind: BlockKind;
  zone: BlockZone;
  layout: BlockLayout;
  /**
   * Which fields this block projects. Empty for `kind: 'caption'`.
   * Field names match `sections.fields[].name` (the same keys the existing
   * custom_data.field_visibility system uses).
   */
  fieldKeys?: string[];
  /**
   * The section `fieldKeys` were picked from. Optional: a block saved before
   * the picker existed carries none and resolves across every active section,
   * exactly as it always did. When it is present the block reads that section's
   * own answer for the key, so two sections that ask the same question
   * (`price`, `location`) cannot quietly print the other one's value.
   */
  sectionId?: string;
  /**
   * The admin's category within `sectionId` — `field_groups.name`. When it is
   * present and `fieldKeys` is empty, the block projects every field of that
   * group in the order the definitions set, and the overlay prints the group's
   * bilingual label as the heading. Chosen over retyping eight keys per slide
   * because a category belongs to the typology, not to one slide.
   *
   * Optional forever: a block saved without it resolves exactly as it always
   * did, from its own `fieldKeys`.
   */
  groupKey?: string;
  /**
   * Which slice of the group this slide carries, 1-based. A category with more
   * questions than one block can hold (eight) is not one slide — it is consecutive
   * slides under the same heading, and this says which page of the category this
   * block prints. Absent means page 1.
   */
  groupPage?: number;
  /** Optional free-text for kind='caption' when you want a per-block caption. */
  text?: string;
  /** Admin-only flag. Vendor writes are forced to false by the API layer. */
  approved: boolean;
}

/**
 * Resolved display data for a single field, ready to be printed inside a
 * hero block. Built from a section's field metadata + custom_data values.
 * Also imported by the overlay component — kept here to avoid a circular ref.
 */
export interface ResolvedField {
  label: string;
  value: string;
  /** true when admin set field_visibility='hide_value' → overlay renders '—'. */
  valueHidden?: boolean;
  /** The group this field belongs to within its section, for `groupKey` blocks. */
  groupKey?: string;
  /**
   * true when the answer came from `custom_data` with no `form_fields`
   * definition behind it. The label is then the key itself, humanized — never a
   * translation nobody wrote.
   */
  fromStoredValue?: boolean;
}

// ─── Zone positioning ────────────────────────────────────────────────────────
// We use inset-inline (logical) so LTR/RTL flips naturally. The carousel
// container has dir set from MinisiteLangProvider, so `inlineStart` on an
// Arabic page = right edge, matching Arabic reading order.
export const ZONE_GRID: Record<BlockZone, { justify: string; align: string; writing?: 'start' | 'end' | 'center' }> = {
  'top-left':      { justify: 'flex-start', align: 'flex-start' },
  'top-center':    { justify: 'center',     align: 'flex-start' },
  'top-right':     { justify: 'flex-end',   align: 'flex-start' },
  'middle-left':   { justify: 'flex-start', align: 'center' },
  'middle-center': { justify: 'center',     align: 'center' },
  'middle-right':  { justify: 'flex-end',   align: 'center' },
  'bottom-left':   { justify: 'flex-start', align: 'flex-end' },
  'bottom-center': { justify: 'center',     align: 'flex-end' },
  'bottom-right':  { justify: 'flex-end',   align: 'flex-end' },
};

export const VALID_KINDS: ReadonlySet<BlockKind> = new Set<BlockKind>([
  'caption', 'fieldLabels', 'fieldValues', 'fieldsValues',
]);
export const VALID_ZONES: ReadonlySet<BlockZone> = new Set<BlockZone>(Object.keys(ZONE_GRID) as BlockZone[]);
export const VALID_LAYOUTS: ReadonlySet<BlockLayout> = new Set<BlockLayout>([
  'pill', 'minimal', 'card', 'chip-row', 'glass', 'spec-sheet',
]);

// Layout defaults per kind — matches what the user described.
export function defaultLayoutForKind(kind: BlockKind): BlockLayout {
  switch (kind) {
    case 'caption': return 'pill';
    case 'fieldLabels': return 'minimal';
    case 'fieldValues': return 'chip-row';
    case 'fieldsValues': return 'card';
  }
}

// How many field entries are worth rendering before the panel becomes noise.
const MAX_FIELDS_PER_BLOCK = 8;
const MAX_TEXT_LEN = 240;
const MAX_FIELD_NAME_LEN = 64;
const MAX_BLOCKS_PER_SLIDE = 6;

/**
 * `custom_data[sectionId]` is written by more than the field forms, and a hero
 * block has no business printing any of it. Anything underscore-led, any
 * visibility blob, and any non-primitive housekeeping key is skipped so a
 * definition-less value can only ever surface a real answer.
 */
const STORED_KEY_SKIP = new Set(['field_visibility', 'media', 'gallery', 'sections', 'options', '_meta']);

function isPrintableStoredValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return false;
  return true;
}

export function humanizeStoredKey(name: string): string {
  return String(name || '')
    .replace(/[_\-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
}

// ─── Sanitizer ───────────────────────────────────────────────────────────────
/**
 * Coerce arbitrary input (from admin or vendor) into a safe SlideBlock[].
 * `trusted` = true only from the admin route; vendor writes must pass
 * trusted=false which forces approved=false on every block.
 *
 * This is a defense-in-depth guard — the API route is already admin-gated
 * (requireAdmin), but a compromised admin session or a copy-paste of the
 * payload must still not inject scripts, giant strings, or unknown types.
 */
export function sanitizeSlideBlocks(input: unknown, opts: { trusted: boolean }): SlideBlock[] {
  if (!Array.isArray(input)) return [];
  const out: SlideBlock[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const b = raw as Record<string, any>;
    const kind = VALID_KINDS.has(b.kind) ? (b.kind as BlockKind) : null;
    if (!kind) continue;
    const zone = VALID_ZONES.has(b.zone) ? (b.zone as BlockZone) : 'bottom-center';
    const layout = VALID_LAYOUTS.has(b.layout) ? (b.layout as BlockLayout) : defaultLayoutForKind(kind);
    const text = typeof b.text === 'string' ? b.text.slice(0, MAX_TEXT_LEN) : undefined;
    const keys = Array.isArray(b.fieldKeys)
      ? b.fieldKeys
          .filter((k: unknown) => typeof k === 'string' && k.trim().length > 0)
          .map((k: string) => k.trim().slice(0, MAX_FIELD_NAME_LEN))
          .slice(0, MAX_FIELDS_PER_BLOCK)
      : [];
    const id = typeof b.id === 'string' && b.id ? b.id.slice(0, 64) : `blk_${Math.random().toString(36).slice(2, 10)}`;
    // The section a block reads from is stored canonical, so a legacy alias
    // typed into the payload still finds the same section at render time.
    const rawSection =
      typeof b.sectionId === 'string' && b.sectionId.trim() ? b.sectionId.trim().slice(0, 64) : '';
    const sectionId = kind === 'caption' || !rawSection ? undefined : resolveSectionId(rawSection);
    // A category name is free-form data, not a lookup: keep it short and strip
    // the section prefix, which `sectionId` already carries.
    const groupKey =
      kind === 'caption' || typeof b.groupKey !== 'string' || !b.groupKey.trim()
        ? undefined
        : b.groupKey.trim().slice(0, MAX_FIELD_NAME_LEN);
    // Approved is admin-only. Vendors can propose, never unlock.
    const approved = opts.trusted ? Boolean(b.approved) : false;
    // A page number outside the group is not an error the sanitizer can invent a
    // fix for, but a stray value must not erase the block either: it is clamped to
    // a positive integer and the renderer shows nothing when the slice is empty.
    const groupPage = Number.isFinite(Number(b.groupPage)) && Number(b.groupPage) > 1
      ? Math.floor(Number(b.groupPage))
      : undefined;
    out.push({
      id,
      kind,
      zone,
      layout,
      fieldKeys: kind === 'caption' ? [] : keys,
      ...(sectionId ? { sectionId } : {}),
      ...(groupKey ? { groupKey, ...(groupPage ? { groupPage } : {}) } : {}),
      text: kind === 'caption' ? text : undefined,
      approved,
    });
    if (out.length >= MAX_BLOCKS_PER_SLIDE) break;
  }
  return out;
}

/**
 * Given the sanitized slides for a business, return the union of every
 * field key currently claimed by an APPROVED fields-ish block. The body
 * renderer (`renderFieldsBlock`) uses this to avoid showing the same field
 * twice (once on the hero, once on the body).
 *
 * Only approved blocks count — an admin-proposed-but-not-approved block
 * should not suppress the body copy of a field.
 */
export function extractClaimedFieldKeys(slides: Array<{ blocks?: unknown }>): Set<string> {
  const set = new Set<string>();
  for (const s of slides) {
    const blocks = Array.isArray(s?.blocks) ? (s.blocks as SlideBlock[]) : [];
    for (const b of blocks) {
      if (!b?.approved) continue;
      if (b.kind === 'caption') continue;
      for (const key of (b.fieldKeys || [])) {
        if (typeof key === 'string' && key) set.add(key);
      }
    }
  }
  return set;
}

/**
 * The same union, split by the section a block was told to read.
 * `sectionId` is optional on a block, so the body renderer needs both views: a
 * field claimed inside section A must disappear from A's grid, while an
 * unscoped (legacy) block claims its key everywhere.
 */
export function extractClaimedFieldKeysBySection(
  slides: Array<{ blocks?: unknown }>,
  /**
   * When the caller can supply the resolved index, a block that names a group
   * claims the group's members too — otherwise the body grid prints a field the
   * hero already shows. Without it, blocks claim only their explicit keys, which
   * is exactly the behaviour every saved slide has today.
   */
  index?: SlideFieldsIndex
): { anySection: Set<string>; bySection: Record<string, Set<string>> } {
  const anySection = new Set<string>();
  const bySection: Record<string, Set<string>> = {};
  for (const s of slides) {
    const blocks = Array.isArray(s?.blocks) ? (s.blocks as SlideBlock[]) : [];
    for (const b of blocks) {
      if (!b?.approved || b.kind === 'caption') continue;
      const sectionId = b.sectionId ? resolveSectionId(b.sectionId) : '';
      const target = sectionId ? (bySection[sectionId] ||= new Set<string>()) : anySection;
      for (const key of b.fieldKeys || []) {
        if (typeof key === 'string' && key) target.add(key);
      }
      if (index && b.groupKey) {
        for (const entry of fieldsOfGroup(b.groupKey, index, sectionId || undefined)) {
          target.add(entry.key);
        }
      }
    }
  }
  return { anySection, bySection };
}

// ─── Bilingual labels for the admin editor ─────────────────────────────────
export const BLOCK_KIND_LABEL: Record<BlockKind, { ar: string; en: string }> = {
  caption:       { ar: 'الكابشن',            en: 'Caption' },
  fieldLabels:   { ar: 'أسماء الحقول',       en: 'Field labels only' },
  fieldValues:   { ar: 'قيم الحقول',         en: 'Field values only' },
  fieldsValues:  { ar: 'الحقول وقيمها',      en: 'Fields + values' },
};

export const BLOCK_LAYOUT_LABEL: Record<BlockLayout, { ar: string; en: string }> = {
  'pill':       { ar: 'شارة (Pill)',    en: 'Pill' },
  'minimal':    { ar: 'نص بسيط',        en: 'Minimal text' },
  'card':       { ar: 'بطاقة رأسية',    en: 'Vertical card' },
  'chip-row':   { ar: 'شرائح أفقية',    en: 'Chip row' },
  'glass':      { ar: 'لوحة زجاجية',    en: 'Glass panel' },
  'spec-sheet': { ar: 'ورقة مواصفات',   en: 'Spec sheet' },
};

export const BLOCK_ZONE_LABEL: Record<BlockZone, { ar: string; en: string }> = {
  'top-left':      { ar: 'أعلى يمين',   en: 'Top-left' },   // Arabic-first: "top-right visual" = "start"
  'top-center':    { ar: 'أعلى وسط',    en: 'Top-center' },
  'top-right':     { ar: 'أعلى يسار',   en: 'Top-right' },
  'middle-left':   { ar: 'وسط يمين',    en: 'Middle-left' },
  'middle-center': { ar: 'في المنتصف',  en: 'Center' },
  'middle-right':  { ar: 'وسط يسار',    en: 'Middle-right' },
  'bottom-left':   { ar: 'أسفل يمين',   en: 'Bottom-left' },
  'bottom-center': { ar: 'أسفل الوسط',  en: 'Bottom-center' },
  'bottom-right':  { ar: 'أسفل يسار',   en: 'Bottom-right' },
};

/**
 * The footnote a masked value leaves behind.
 * Kept here so the overlay prints the sentence in the language the page speaks
 * instead of a hard-coded English line over an Arabic hero.
 */
export const BLOCK_HIDDEN_LEGEND = {
  ar: '— = مخفي بواسطة الإدارة',
  en: '— = hidden by admin',
};

// ─── Field index builder (client-side) ────────────────────────────────────
// Merged from `use client` boundaries — this is pure and importable anywhere.
// `ResolvedField` is declared above (see SlideBlock area) so this file has
// no dependency on the overlay component (which imports types from here).
export interface BuildFieldsIndexInput {
  /** Sections array as returned by /api/jana/businesses — each may carry .fields[]. */
  sections?: Array<any>;
  /** Parsed custom_data blob keyed by sectionId (biz.custom_data). */
  customData?: Record<string, any>;
  /** Arabic-first toggle from MinisiteLangProvider. */
  ar?: boolean;
  /**
   * `field_groups` rows the typology chain resolves to, in inheritance order
   * (universal, then parent, then child). Only their labels are needed here —
   * membership is carried on the fields themselves.
   */
  fieldGroups?: Array<any>;
}

/** fieldName → resolved presentation. */
export type FlatFieldsIndex = Record<string, ResolvedField>;

/** Section-aware field lookup: a block reads its own section first. */
export interface SlideFieldsIndex {
  flat: FlatFieldsIndex;
  bySection: Record<string, FlatFieldsIndex>;
  /**
   * The bilingual label of each group, keyed `sectionId:groupName`. A block
   * carrying `groupKey` prints this as its heading; absent means the group was
   * deleted or never seeded, and the block still renders without one.
   */
  groupLabels?: Record<string, { en: string; ar?: string | null }>;
}

/**
 * Build the lookup the SlideInfoBlocksOverlay consumes.
 * Rules mirror the existing body renderer (VanityBusinessClient.renderFieldsBlock)
 * on purpose — the hero and the body must agree about the same field or an admin
 * sees a value in one place and a dash in the other:
 *   - Arabic label wins when `ar` and label_ar are present.
 *   - Values are read from `custom_data[sectionId]`, the same single blob the body
 *     grid reads (no cross-section merging).
 *   - custom_data.field_visibility[sectionId][fieldName] === 'hide_value'
 *     keeps the label but blanks the value → overlay prints "—".
 *   - 'hide_field' entries are omitted entirely (label + value gone).
 *
 * Two views come back: `bySection`, keyed by the canonical section id (and every
 * legacy alias that maps to it, so an old block still resolves), and `flat`, the
 * first-writer-wins union the unscoped blocks have always used.
 */
export function buildFieldsIndexFromSections({
  sections = [],
  customData = {},
  ar = true,
  fieldGroups = [],
}: BuildFieldsIndexInput): SlideFieldsIndex {
  const flat: FlatFieldsIndex = {};
  const bySection: Record<string, FlatFieldsIndex> = {};
  const visibilityMap: Record<string, Record<string, string>> =
    (customData && typeof customData === 'object' && (customData as any).field_visibility) || {};
  // Later rows win, the same rule the field merge already follows, so a group a
  // child redefines prints the child's wording and nothing else.
  const groupLabels: Record<string, { en: string; ar?: string | null }> = {};
  for (const g of fieldGroups || []) {
    const name = typeof g?.name === 'string' ? g.name.trim() : '';
    const sectionId = typeof g?.section_id === 'string' ? g.section_id : (typeof g?.sectionId === 'string' ? g.sectionId : '');
    if (!name || !sectionId) continue;
    groupLabels[`${resolveSectionId(sectionId)}:${name}`] = {
      en: String(g.label || humanizeStoredKey(name)),
      ar: g.label_ar ? String(g.label_ar) : null,
    };
  }

  for (const section of sections) {
    if (!section) continue;
    const sectionId = String(section.id || '');
    if (!sectionId) continue;
    const canonicalId = resolveSectionId(sectionId);
    const secVisibility = visibilityMap[sectionId] || visibilityMap[canonicalId] || {};
    const sectionData =
      (customData as any)?.[sectionId] ||
      (customData as any)?.[canonicalId] ||
      (customData as any)?.[String(sectionId).replace(/^sec_\d+_/, '')] ||
      {};
    const fields: any[] = Array.isArray(section.fields) ? section.fields : [];
    // A section can carry its own categories (the loaders attach them), which is
    // how a heading reaches a slide without a second query per page.
    const sectionGroups: any[] = Array.isArray((section as any).groups) ? (section as any).groups : [];
    for (const g of sectionGroups) {
      const name = typeof g?.name === 'string' ? g.name.trim() : '';
      if (!name) continue;
      const key = `${canonicalId}:${name}`;
      if (groupLabels[key]) continue;
      groupLabels[key] = {
        en: String(g.label || humanizeStoredKey(name)),
        ar: g.label_ar ? String(g.label_ar) : null,
      };
    }
    // A block may name its section by the canonical id or by any historical
    // alias, and it is the same section either way.
    const scopedIds = getSectionLookupIds(sectionId);

    for (const f of fields) {
      const name = typeof f?.name === 'string' ? f.name : '';
      if (!name) continue;
      if (secVisibility[name] === 'hide_field') continue;
      // A child that refuses a parent field drops it from the resolved form, so
      // it can never reach a hero block or claim a place in the body grid.
      if (Number(f?.excluded ?? 0) === 1) continue;
      const rawLabel = (ar && f.label_ar) ? f.label_ar : (f.label || name.replace(/_/g, ' '));
      const valueHidden = secVisibility[name] === 'hide_value';
      const rawVal = sectionData?.[name];
      const value = valueHidden
        ? ''
        : (typeof rawVal === 'string' ? rawVal : rawVal == null ? '' : safeStringify(rawVal));
      const groupKey = typeof f?.group_key === 'string' && f.group_key.trim()
        ? f.group_key.trim()
        : (typeof f?.groupKey === 'string' && f.groupKey.trim() ? f.groupKey.trim() : undefined);
      const resolved: ResolvedField = { label: String(rawLabel || name), value, valueHidden, ...(groupKey ? { groupKey } : {}) };

      for (const alias of scopedIds) {
        const bucket = (bySection[alias] ||= {});
        // First write wins inside a section too: a typology can inherit the same
        // field definition at two levels, and the duplicate must not flip.
        if (!bucket[name]) bucket[name] = resolved;
      }
      // First write wins across sections as well, so cross-section duplicates
      // cannot fight over what an unscoped block prints.
      if (!flat[name]) flat[name] = resolved;
    }

    // The stored-value pass. A business can hold an answer that no `form_fields`
    // row defines — which is the normal state for anything typed before the
    // definition existed — and a hero block must be able to show it rather than
    // print nothing. The label is the key, humanized, in both languages: no
    // Arabic is invented here, because nobody wrote one.
    if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
      for (const [name, rawVal] of Object.entries(sectionData)) {
        if (!name || STORED_KEY_SKIP.has(name) || name.startsWith('_')) continue;
        if (secVisibility[name] === 'hide_field') continue;
        if (!isPrintableStoredValue(rawVal)) continue;
        if (flat[name] || bySection[canonicalId]?.[name]) continue;
        const valueHidden = secVisibility[name] === 'hide_value';
        const resolved: ResolvedField = {
          label: humanizeStoredKey(name),
          value: valueHidden ? '' : safeStringify(rawVal),
          valueHidden,
          fromStoredValue: true,
        };
        for (const alias of scopedIds) {
          const bucket = (bySection[alias] ||= {});
          if (!bucket[name]) bucket[name] = resolved;
        }
        if (!flat[name]) flat[name] = resolved;
      }
    }
  }
  return { flat, bySection, groupLabels };
}

/**
 * Accept either shape. A surface that only knows the old flat map keeps working
 * unchanged; its blocks simply resolve section-agnostically, as before.
 */
export function asFieldsIndex(
  index?: SlideFieldsIndex | FlatFieldsIndex | null
): SlideFieldsIndex {
  if (!index) return { flat: {}, bySection: {} };
  if ('flat' in index || 'bySection' in index) return index as SlideFieldsIndex;
  return { flat: index as FlatFieldsIndex, bySection: {} };
}

/**
 * The field entries one group owns, in definition order.
 *
 * Read off the index rather than a second query, so a group can only ever
 * contain fields this page is already allowed to show: an excluded definition is
 * absent, a `hide_field` visibility is absent, and a stored-only answer is
 * present with its humanized label.
 *
 * `sectionId` empty means look across every section, matching how an unscoped
 * legacy block resolves.
 */
export function fieldsOfGroup(
  groupKey: string,
  index: SlideFieldsIndex,
  sectionId?: string,
): Array<{ key: string; resolved: ResolvedField }> {
  const key = String(groupKey || '').trim();
  if (!key) return [];
  const scoped = sectionId ? index.bySection[resolveSectionId(sectionId)] : undefined;
  const source: FlatFieldsIndex = scoped || index.flat;
  const seen = new Set<string>();
  const entries: Array<{ key: string; resolved: ResolvedField }> = [];
  for (const [name, resolved] of Object.entries(source)) {
    if (resolved?.groupKey !== key) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    entries.push({ key: name, resolved });
  }
  // An unscoped lookup already collapsed duplicates into `flat`; a scoped one
  // needs nothing further. Sorted by nothing but insertion order, which is the
  // definitions' own sort_order.
  return entries;
}

/** The heading a group block prints, or null when the group no longer exists. */
export function groupLabelFor(
  groupKey: string,
  sectionId: string | undefined,
  index: SlideFieldsIndex,
  ar: boolean,
): string | null {
  const key = String(groupKey || '').trim();
  if (!key || !index.groupLabels) return null;
  const lookup = `${sectionId ? resolveSectionId(sectionId) : ''}:${key}`;
  const label = index.groupLabels[lookup] || (sectionId ? null : Object.entries(index.groupLabels).find(([k]) => k.endsWith(`:${key}`))?.[1]);
  if (!label) return null;
  const text = ar ? (label.ar || label.en) : label.en;
  return String(text || '').trim() || null;
}

/**
 * The field entries a block should print, in the order the admin picked them.
 * Entries with neither a label nor a value are dropped, which is what makes a
 * masked or deleted field disappear instead of printing an empty pill.
 *
 * A block that names a group and no keys projects the whole group; a block that
 * names keys projects exactly those keys, group or not, so an admin can still
 * hand-pick a subset of a category.
 */
export function resolveBlockEntries(
  block: Pick<SlideBlock, 'fieldKeys' | 'sectionId' | 'groupKey' | 'groupPage'>,
  index: SlideFieldsIndex
): Array<{ key: string; resolved: ResolvedField }> {
  const scoped = block.sectionId ? index.bySection[resolveSectionId(block.sectionId)] : undefined;
  const explicit = (block.fieldKeys || []).filter(Boolean);
  if (!explicit.length && block.groupKey) {
    const members = fieldsOfGroup(block.groupKey, index, block.sectionId);
    // Page 2 of a fourteen-field category is fields 9-14, printed under the same
    // heading on the next slide — the tail is never dropped.
    const page = Math.max(1, Math.floor(Number(block.groupPage) || 1));
    return members.slice((page - 1) * MAX_FIELDS_PER_BLOCK, page * MAX_FIELDS_PER_BLOCK);
  }
  return explicit
    .map(key => ({ key, resolved: scoped?.[key] || index.flat[key] }))
    .filter((entry): entry is { key: string; resolved: ResolvedField } =>
      Boolean(entry.resolved && (entry.resolved.label || entry.resolved.value)));
}

/**
 * The same written form the overlay prints, so an admin previewing a value in the
 * editor cannot be shown something the live slide will not say.
 */
export function stringifyFieldValue(value: unknown): string {
  return safeStringify(value);
}

function safeStringify(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(safeStringify).filter(Boolean).join(', ');
  if (typeof v === 'object') {
    // Prefer human-friendly keys over dumping JSON into a hero panel.
    const name = v.name || v.title || v.label || v.value;
    if (typeof name === 'string') return name;
    try { return JSON.stringify(v); } catch { return ''; }
  }
  return String(v);
}
