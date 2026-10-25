import { query, normalizeCustomData } from '@/lib/db';
import { businessPublicPath } from '@/lib/public-url';
import {
  resolveSectionId,
  filterCoreSectionsForBusinessType,
  isSectionHidden,
  isSectionApprovedForMinisite,
  getEffectiveSectionLabel,
} from '@/lib/section-registry';

/**
 * Resolves the section "tabs" (cases) a public minisite should offer.
 * Mirrors the server-side filter used by /[slug]/[section] so a tab never
 * points at a section that would be hidden/unapproved, and only lists a case
 * when it actually has content (section data, approved gallery images, or
 * published section blogs). Returns links to the existing /{slug}/{section}
 * route (VanityBusinessClient renders each case with its full features).
 */

export interface SectionNavItem {
  id: string;
  label: string;
  href: string;
}

function safeJson(value: string): any {
  try { return JSON.parse(value || '[]'); } catch { return []; }
}

function parseArr(value: unknown): string[] {
  const arr = typeof value === 'string' ? safeJson(value) : value;
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
}

function secNum(id: string): number {
  const m = /^sec_(\d+)/.exec(id);
  return m ? Number(m[1]) : 999;
}

async function collectTypeSectionIds(typeId: string | null | undefined): Promise<string[]> {
  const ids = new Set<string>();
  let cursor = typeId || null;
  const guard = new Set<string>();
  while (cursor && !guard.has(cursor)) {
    guard.add(cursor);
    const rows = await query<any>('SELECT parent_id, sections, own_sections FROM business_types WHERE id = ?', [cursor]).catch(() => []);
    if (!rows.length) break;
    const t = rows[0];
    parseArr(t.sections).forEach((id) => ids.add(id));
    parseArr(t.own_sections).forEach((id) => ids.add(id));
    cursor = t.parent_id || null;
  }
  return [...ids];
}

export async function resolveSectionNav(business: any): Promise<SectionNavItem[]> {
  if (!business?.id) return [];

  let candidateIds = filterCoreSectionsForBusinessType(business.type_id, await collectTypeSectionIds(business.type_id));
  if (candidateIds.length === 0) {
    const universal = await query<any>(
      "SELECT id FROM sections WHERE is_universal = 1 AND (show_on_public = 1 OR show_on_public = TRUE) ORDER BY sort_order ASC",
    ).catch(() => []);
    candidateIds = universal.map((r: any) => r.id);
  }
  if (candidateIds.length === 0) return [];

  const customData = normalizeCustomData(business.custom_data);

  // Public, placed-in-body section definitions (also include universal sections, like the route does).
  const ph = candidateIds.map(() => '?').join(',');
  const defs = await query<any>(
    `SELECT id, name, options FROM sections WHERE (id IN (${ph}) OR is_universal = 1) AND (show_on_public = 1 OR show_on_public = TRUE) ORDER BY sort_order ASC`,
    candidateIds,
  ).catch(() => []);
  if (!defs.length) return [];

  // Only columns that exist on business_section_controls. Selecting a column
  // this table does not have (approval_status / show_on_minisite) made the
  // whole query throw and silently dropped every admin override.
  const controls = await query<any>(
    'SELECT section_id, custom_label, admin_hidden, admin_disabled FROM business_section_controls WHERE business_id = ?',
    [business.id],
  ).catch(() => []);
  const controlMap: Record<string, any> = Object.fromEntries(controls.map((c: any) => [c.section_id, c]));

  const gallery = await query<any>(
    "SELECT section_id, COUNT(*) AS n FROM vendor_gallery WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1 GROUP BY section_id",
    [business.id],
  ).catch(() => []);
  const blogs = await query<any>(
    "SELECT section_id, COUNT(*) AS n FROM section_blogs WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1 GROUP BY section_id",
    [business.id],
  ).catch(() => []);
  const galleryMap: Record<string, number> = Object.fromEntries(gallery.map((r: any) => [r.section_id, Number(r.n || 0)]));
  const blogMap: Record<string, number> = Object.fromEntries(blogs.map((r: any) => [r.section_id, Number(r.n || 0)]));

  const out: SectionNavItem[] = [];
  const seen = new Set<string>();

  for (const def of defs) {
    const id = resolveSectionId(def.id);
    if (seen.has(id)) continue;

    const ctrl = controlMap[def.id] || controlMap[id] || null;

    const options = typeof def.options === 'string' ? safeJson(def.options) : (def.options || {});
    if (Array.isArray(options?.placements) && !options.placements.includes('body')) continue;

    if (isSectionHidden(id, customData, ctrl, [], false)) continue;
    if (!isSectionApprovedForMinisite(id, customData, ctrl, false)) continue;

    const raw = customData[id] || customData[def.id];
    const hasOwnData = !!raw && typeof raw === 'object' && Object.keys(raw).length > 0;
    const hasGallery = (galleryMap[id] || galleryMap[def.id] || 0) > 0;
    const hasBlog = (blogMap[id] || blogMap[def.id] || 0) > 0;
    if (!hasOwnData && !hasGallery && !hasBlog) continue;

    seen.add(id);
    out.push({ id, label: getEffectiveSectionLabel(id, def.name, customData, ctrl), href: `${businessPublicPath(business)}/${id}` });
  }

  out.sort((a, b) => secNum(a.id) - secNum(b.id) || a.label.localeCompare(b.label));
  return out;
}
