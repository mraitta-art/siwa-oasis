/**
 * Field destination panel — the C-7 answer to "which surface shows which field".
 *
 * A minisite field has exactly four public destinations:
 *
 *   carousel   — the field is a hero slide; the body grid does not print it.
 *   body       — the field is a body card; the hero does not print it.
 *   both       — (default) the admin has chosen to repeat the value on both.
 *   hidden     — the field exists in the definition but the public surface
 *                shows nothing (kept for internal records + blog tokens).
 *
 * This layer stores the choice as a separate blob so it does not fight with
 * the older two-state `custom_data.field_visibility` mask:
 *
 *   custom_data.field_visibility[sec][key]   = 'hide_field' | 'hide_value' | null
 *   custom_data.field_destinations[sec][key] = 'carousel' | 'body' | 'both' | 'hidden' | null
 *
 * `destinations` is the newer, richer model; `visibility` is the older, cruder
 * one. Both can be present at the same time — a field the admin marked
 * `hide_value` keeps its destination but the value prints as `—` (that's the
 * masking layer). A field marked `hide_field` is treated as `hidden` in the
 * destination layer for backward compatibility, so a page written before this
 * file existed still behaves the same way.
 *
 * Pure. Safe in a client component.
 */

export type FieldDestination = 'carousel' | 'body' | 'both' | 'hidden';

export const FIELD_DESTINATIONS: readonly FieldDestination[] = ['carousel', 'body', 'both', 'hidden'];

export function isFieldDestination(value: unknown): value is FieldDestination {
  return typeof value === 'string' && (FIELD_DESTINATIONS as readonly string[]).includes(value);
}

/** Bilingual label for the admin picker. */
export const FIELD_DESTINATIONS_LABEL: Record<FieldDestination, { ar: string; en: string }> = {
  carousel: { ar: ' على السلايدر فقط',      en: 'Carousel only' },
  body:     { ar: ' على الصفحة فقط',        en: 'Body only' },
  both:     { ar: ' على الاثنين (مكرر)',    en: 'Both (repeated)' },
  hidden:   { ar: 'مخفي عن الزائر',          en: 'Hidden from public' },
};

/**
 * Two shapes on `custom_data` — the older visibility mask and the newer
 * destinations map. Both keyed `[sectionId][fieldName]`.
 */
export type VisibilityMap = Record<string, Record<string, string>>;
export type DestinationsMap = Record<string, Record<string, string>>;

/**
 * Resolve one field's destination, honoring both layers.
 *
 * Precedence (highest to lowest):
 *   1. `visibility === 'hide_field'` — legacy hard-hiding, always wins.
 *   2. `destinations` entry — the newer, richer admin panel setting.
 *   3. default `'both'`.
 *
 * `hide_value` is orthogonal — it masks the value but keeps the label on the
 * surface that was chosen. It is handled by the caller when printing.
 */
export function resolveDestination(
  destinations: DestinationsMap | null | undefined,
  visibility: VisibilityMap | null | undefined,
  sectionId: string,
  key: string,
): FieldDestination {
  const secKey = normalizeSectionKey(sectionId);
  const vis = visibility?.[secKey]?.[key] ?? visibility?.[sectionId]?.[key];
  if (vis === 'hide_field') return 'hidden';
  const dest = destinations?.[secKey]?.[key] ?? destinations?.[sectionId]?.[key];
  if (isFieldDestination(dest)) return dest;
  return 'both';
}

/** Should this field appear in a hero block for this section? */
export function showsOnCarousel(dest: FieldDestination): boolean {
  return dest === 'carousel' || dest === 'both';
}

/** Should this field appear in the section's body grid? */
export function showsOnBody(dest: FieldDestination): boolean {
  return dest === 'body' || dest === 'both';
}

/**
 * Filter a body field entry list — used by the body grid renderer so a field
 * marked `carousel` or `hidden` drops out. `hide_field` legacy already implies
 * hidden; `destinations` values are applied after the legacy visibility filter
 * so both layers agree.
 */
export function bodyAllows(
  destinations: DestinationsMap | null | undefined,
  visibility: VisibilityMap | null | undefined,
  sectionId: string,
  key: string,
): boolean {
  const dest = resolveDestination(destinations, visibility, sectionId, key);
  return showsOnBody(dest);
}

/**
 * The set of field keys a hero slide may project for a section. Slides read
 * through the same resolver, so a `body`-only field cannot be picked onto a
 * hero even if the admin typed the key into the payload.
 */
export function carouselAllowedKeys(
  destinations: DestinationsMap | null | undefined,
  visibility: VisibilityMap | null | undefined,
  sectionId: string,
  keys: Iterable<string>,
): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const dest = resolveDestination(destinations, visibility, sectionId, k);
    if (showsOnCarousel(dest)) out.push(k);
  }
  return out;
}

/**
 * Write a destination entry, preserving the existing `custom_data` blob.
 * Returns a shallow clone; the caller assigns it back into `custom_data`.
 */
export function setDestination(
  destinations: DestinationsMap | null | undefined,
  sectionId: string,
  key: string,
  value: FieldDestination | null,
): DestinationsMap {
  const next: DestinationsMap = { ...(destinations || {}) };
  const sec = normalizeSectionKey(sectionId);
  const inner = { ...(next[sec] || {}) };
  if (value == null) {
    delete inner[key];
  } else {
    inner[key] = value;
  }
  if (Object.keys(inner).length === 0) {
    delete next[sec];
  } else {
    next[sec] = inner;
  }
  return next;
}

/**
 * Read the destinations blob off a business's `custom_data`. Tolerates nulls
 * and unexpected types so the panel can be introduced before every page has
 * been re-saved.
 */
export function readDestinations(customData: any): DestinationsMap {
  const raw = customData && typeof customData === 'object' ? (customData as any).field_destinations : null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: DestinationsMap = {};
  for (const [secId, inner] of Object.entries(raw)) {
    if (!inner || typeof inner !== 'object' || Array.isArray(inner)) continue;
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(inner)) {
      if (isFieldDestination(v)) clean[k] = v;
    }
    if (Object.keys(clean).length) out[secId] = clean;
  }
  return out;
}

// `sec_1` and `sec_1_identity` reach the same bucket; the legacy alias map in
// `section-registry.ts` owns that equivalence, but we normalize the leading
// `sec_N` prefix here so the destinations blob doesn't need to be re-keyed
// every time a canonical section id changes spelling.
function normalizeSectionKey(sectionId: string): string {
  const raw = String(sectionId || '').trim();
  if (!raw) return '';
  const m = raw.match(/^(sec_\d+)/i);
  return m ? m[1].toLowerCase() : raw;
}
