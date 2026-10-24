import { query } from '@/lib/db';
import type { MinisiteManifest, MinisiteManifestSection } from '@/lib/minisite-manifest';

/**
 * Non-destructive "builder → sectional" converter used by the BizDev Stage.
 *
 * It turns a builder layout (component props) into a DRAFT minisite manifest
 * that mirrors the canonical section store, and produces a readiness report
 * explaining what still blocks the sections from rendering publicly.
 *
 * It NEVER writes businesses.custom_data, vendor_gallery, section_blogs,
 * business_types, and NEVER publishes. Saving only touches minisite_manifests
 * (draft), which has no effect on any public route until an explicit publish.
 */

// Builder component type → canonical section id. Explicit props.section_id
// always wins over this heuristic map.
export const COMPONENT_SECTION_MAP: Record<string, string> = {
  vendor_hero: 'sec_1_identity',
  hero_carousel: 'sec_1_identity',
  vendor_carousel: 'sec_1_identity',
  vendor_gallery: 'sec_2_ambience',
  vendor_services: 'sec_3_facilities',
  service_catalog: 'sec_3_facilities',
  vendor_packages: 'sec_5_experiences',
  marketplace: 'sec_9_marketplace_catalog',
  cta_section: 'sec_8_connector',
  text_section: 'sec_6_guardian',
  testimonials: 'sec_10_testimonials_faqs',
  faq: 'sec_10_testimonials_faqs',
};

// Layout/positioning props that are builder presentation only — not section content.
const LAYOUT_ONLY_KEYS = new Set(['section_id', 'order', 'id', 'style', 'layout', 'variant', 'columns', 'cols']);

function parseArray(value: unknown): string[] {
  const arr = typeof value === 'string' ? safeJson(value) : value;
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value); } catch { return []; }
}

function sectionPrefixOrder(id: string): number {
  const m = /^sec_(\d+)/.exec(id);
  return m ? Number(m[1]) : 999;
}

export function mapComponentToSection(comp: any): string | null {
  const explicit = comp?.props?.section_id;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  return COMPONENT_SECTION_MAP[comp?.type] || null;
}

/** Aggregate builder components into canonical sections, merging their props into section content. */
export function builderLayoutToSections(
  layout: any,
  customData: Record<string, any> = {},
): MinisiteManifestSection[] {
  const components = Array.isArray(layout?.components) ? layout.components : [];
  const bySection = new Map<string, { components: any[]; content: Record<string, unknown> }>();

  for (const comp of components) {
    const sectionId = mapComponentToSection(comp);
    if (!sectionId) continue;
    const bucket = bySection.get(sectionId) || { components: [], content: {} };
    bucket.components.push(comp);
    const props = comp?.props && typeof comp.props === 'object' ? comp.props : {};
    for (const [key, value] of Object.entries(props)) {
      if (LAYOUT_ONLY_KEYS.has(key)) continue;
      bucket.content[key] = value;
    }
    bySection.set(sectionId, bucket);
  }

  const orderedIds = [...bySection.keys()].sort(
    (a, b) => sectionPrefixOrder(a) - sectionPrefixOrder(b) || a.localeCompare(b),
  );

  return orderedIds.map((id, index) => {
    const bucket = bySection.get(id)!;
    const existing = customData[id] && typeof customData[id] === 'object' ? customData[id] : {};
    return {
      id,
      order: index,
      enabled: true,
      label: id,
      // Existing canonical data stays authoritative; builder props only fill gaps.
      content: { ...bucket.content, ...existing },
      approval_status: 'draft',
      components: bucket.components,
    };
  });
}

export interface SectionReadiness {
  id: string;
  existsInSectionsTable: boolean;
  showOnPublic: boolean;
  inBusinessType: boolean;
  universal: boolean;
  fieldCount: number;
  renderableNow: boolean;
  gap: string | null;
}

/**
 * Explains, per section, whether the live sectional route can render it today.
 * The route builds its section list from business_types (type hierarchy) +
 * universal sections + the sections table, and only overlays a published
 * manifest onto sections that already resolve. So a section is renderable now
 * only if it exists, is public, and is reachable via the type or universal.
 */
export async function getSectionalReadinessReport(
  typeId: string | null,
  sectionIds: string[],
): Promise<SectionReadiness[]> {
  const typeSectionIds = new Set<string>();
  let cursor = typeId || null;
  const guard = new Set<string>();
  while (cursor && !guard.has(cursor)) {
    guard.add(cursor);
    const rows = await query<any>('SELECT parent_id, sections, own_sections FROM business_types WHERE id = ?', [cursor]);
    if (!rows.length) break;
    const t = rows[0];
    parseArray(t.sections).forEach((id) => typeSectionIds.add(id));
    parseArray(t.own_sections).forEach((id) => typeSectionIds.add(id));
    cursor = t.parent_id || null;
  }

  const placeholders = sectionIds.map(() => '?').join(',');
  const defs = sectionIds.length
    ? await query<any>(`SELECT id, name, is_universal, show_on_public FROM sections WHERE id IN (${placeholders})`, sectionIds)
    : [];
  const defMap: Record<string, any> = Object.fromEntries(defs.map((d: any) => [d.id, d]));

  const universalRows = await query<any>('SELECT id FROM sections WHERE is_universal = 1 AND (show_on_public = 1 OR show_on_public = TRUE)');
  const universalIds = new Set(universalRows.map((r: any) => r.id));

  const fieldRows = typeId
    ? await query<any>('SELECT section_id, COUNT(*) AS n FROM form_fields WHERE business_type_id = ? GROUP BY section_id', [typeId])
    : [];
  const fieldMap: Record<string, number> = Object.fromEntries(fieldRows.map((f: any) => [f.section_id, Number(f.n || 0)]));

  return sectionIds.map((id) => {
    const def = defMap[id];
    const existsInSectionsTable = !!def;
    const showOnPublic = def ? def.show_on_public === 1 || def.show_on_public === true : false;
    const inBusinessType = typeSectionIds.has(id);
    const universal = universalIds.has(id);
    const renderableNow = existsInSectionsTable && showOnPublic && (inBusinessType || universal);

    let gap: string | null = null;
    if (!existsInSectionsTable) gap = 'Section is not defined in the `sections` table.';
    else if (!showOnPublic && !universal) gap = 'Section is not public (show_on_public = 0).';
    else if (!inBusinessType && !universal) gap = 'Not reachable: add it to this business type (`business_types.sections` / `own_sections`) or mark it `is_universal`.';

    return {
      id,
      existsInSectionsTable,
      showOnPublic,
      inBusinessType,
      universal,
      fieldCount: fieldMap[id] || 0,
      renderableNow,
      gap,
    };
  });
}

export function buildDraftManifest(
  businessId: string,
  templateId: string | null,
  sections: MinisiteManifestSection[],
): MinisiteManifest {
  return {
    schema_version: 1,
    business_id: businessId,
    revision: 0,
    status: 'draft',
    template_id: templateId || null,
    sections,
    pages: [],
    metadata: { source: 'bizdev-convert', updated_at: new Date().toISOString() },
  };
}
