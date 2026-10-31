/**
 * Slide Info Blocks — a per-slide, admin-approved content layer for the
 * minisite hero carousel. A slide already owns media (image/video/YouTube/
 * embed) + title/subtitle/caption; this library adds placed "info blocks"
 * that surface captions, field labels, or field label+value pairs at
 * fixed positions with a preset layout.
 *
 * Design decisions (locked with the user):
 *   - Model A: fields are picked PER SLIDE. Body pages automatically
 *     skip any field a slide has claimed.
 *   - 9-zone grid (not free drag): safe under RTL + mobile.
 *   - Layouts: pill (caption), minimal text, vertical card, chip row, glass panel.
 *   - Governance: vendor may PROPOSE blocks, but `approved` is admin-only.
 *     Any write from a non-admin path forces approved=false.
 *   - Storage: JSON inside the existing `website_configs.hero_carousel_*`
 *     row (no DB migration). Hiding never deletes; raw field values stay
 *     in custom_data so section-blog interpolation is preserved.
 */

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
  | 'glass';       // glass panel with heavier blur (spec-list feel)

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
  'pill', 'minimal', 'card', 'chip-row', 'glass',
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
    // Approved is admin-only. Vendors can propose, never unlock.
    const approved = opts.trusted ? Boolean(b.approved) : false;
    out.push({
      id,
      kind,
      zone,
      layout,
      fieldKeys: kind === 'caption' ? [] : keys,
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

// ─── Bilingual labels for the admin editor ─────────────────────────────────
export const BLOCK_KIND_LABEL: Record<BlockKind, { ar: string; en: string }> = {
  caption:       { ar: 'الكابشن',            en: 'Caption' },
  fieldLabels:   { ar: 'أسماء الحقول',       en: 'Field labels only' },
  fieldValues:   { ar: 'قيم الحقول',         en: 'Field values only' },
  fieldsValues:  { ar: 'الحقول وقيمها',      en: 'Fields + values' },
};

export const BLOCK_LAYOUT_LABEL: Record<BlockLayout, { ar: string; en: string }> = {
  'pill':     { ar: 'شارة (Pill)',    en: 'Pill' },
  'minimal':  { ar: 'نص بسيط',        en: 'Minimal text' },
  'card':     { ar: 'بطاقة رأسية',    en: 'Vertical card' },
  'chip-row': { ar: 'شرائح أفقية',    en: 'Chip row' },
  'glass':    { ar: 'لوحة زجاجية',    en: 'Glass panel' },
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
}

/**
 * Build a flat fieldName → { label, value, valueHidden? } lookup that the
 * SlideInfoBlocksOverlay consumes. Rules mirror the existing body
 * renderer (VanityBusinessClient.renderFieldsBlock):
 *   - Arabic label wins when `ar` and label_ar are present.
 *   - custom_data.field_visibility[sectionId][fieldName] === 'hide_value'
 *     keeps the label but blanks the value → overlay prints "—".
 *   - 'hide_field' entries are omitted entirely (label + value gone).
 */
export function buildFieldsIndexFromSections({
  sections = [],
  customData = {},
  ar = true,
}: BuildFieldsIndexInput): Record<string, ResolvedField> {
  const index: Record<string, ResolvedField> = {};
  const visibilityMap: Record<string, Record<string, string>> =
    (customData && typeof customData === 'object' && (customData as any).field_visibility) || {};

  for (const section of sections) {
    if (!section) continue;
    const sectionId = String(section.id || '');
    if (!sectionId) continue;
    const secVisibility = visibilityMap[sectionId] || {};
    const sectionData =
      (customData as any)?.[sectionId] ||
      (customData as any)?.[String(section.id).replace(/^sec_\d+_/, '')] ||
      {};
    const fields: any[] = Array.isArray(section.fields) ? section.fields : [];

    for (const f of fields) {
      const name = typeof f?.name === 'string' ? f.name : '';
      if (!name) continue;
      if (secVisibility[name] === 'hide_field') continue;
      const rawLabel = (ar && f.label_ar) ? f.label_ar : (f.label || name.replace(/_/g, ' '));
      const valueHidden = secVisibility[name] === 'hide_value';
      const rawVal = sectionData?.[name];
      const value = valueHidden
        ? ''
        : (typeof rawVal === 'string' ? rawVal : rawVal == null ? '' : safeStringify(rawVal));
      // First write wins so cross-section duplicates don't fight. Fields are
      // expected to be section-scoped but a defensive guard is cheap.
      if (!index[name]) {
        index[name] = { label: String(rawLabel || name), value, valueHidden };
      }
    }
  }
  return index;
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
