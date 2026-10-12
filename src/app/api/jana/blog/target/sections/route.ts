import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { normalizeCustomData, queryStrict } from '@/lib/db';
import { getEffectiveSectionLabel, getMinisiteSectionIds, isSectionApprovedForMinisite, isSectionHidden, filterCoreSectionsForBusinessType } from '@/lib/section-registry';
import { getPublishedManifest } from '@/lib/minisite-manifest';
import { fetchMinisiteLayout } from '@/lib/minisite-layout';
import { findBusinessSectionBlogConflict } from '@/lib/blog-distribution';

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error('Business section configuration contains invalid JSON');
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const businessId = new URL(request.url).searchParams.get('business_id');
    if (!businessId) return NextResponse.json({ error: 'Business is required' }, { status: 400 });

    const businesses = await queryStrict<{
      id: string;
      slug: string | null;
      type_id: string | null;
      custom_data: unknown;
      template_features: unknown;
    }>(
      `SELECT b.id, b.slug, b.type_id, b.custom_data, mt.settings AS template_features
       FROM businesses b
       LEFT JOIN minisite_templates mt ON mt.id = b.template_id
       WHERE b.id = ? LIMIT 1`,
      [businessId],
    );
    const business = businesses[0];
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const customLayout = await fetchMinisiteLayout(business.slug || '');
    if (customLayout?.components.length) {
      return NextResponse.json({ mode: 'builder', sections: [] });
    }

    const allTypes = await queryStrict<{
      id: string;
      parent_id: string | null;
      sections: unknown;
      own_sections: unknown;
    }>('SELECT id, parent_id, sections, own_sections FROM business_types');
    const typesById = new Map(allTypes.map(type => [type.id, type]));
    const sectionIds = new Set<string>();
    const visited = new Set<string>();
    let typeId = business.type_id;
    while (typeId && !visited.has(typeId)) {
      visited.add(typeId);
      const type = typesById.get(typeId);
      if (!type) break;
      const inherited = parseJson<unknown>(type.sections, []);
      const own = parseJson<unknown>(type.own_sections, []);
      if (Array.isArray(inherited)) inherited.forEach(id => { if (typeof id === 'string') sectionIds.add(id); });
      if (Array.isArray(own)) own.forEach(id => { if (typeof id === 'string') sectionIds.add(id); });
      typeId = type.parent_id;
    }

    let ids = [...sectionIds];
    if (ids.length === 0) ids = filterCoreSectionsForBusinessType(business.type_id, []);
    if (ids.length === 0) ids = getMinisiteSectionIds(business.type_id, []);
    if (ids.length === 0) {
      const universal = await queryStrict<{ id: string }>(
        'SELECT id FROM sections WHERE is_universal = 1 AND (show_on_public = 1 OR show_on_public = TRUE) ORDER BY sort_order',
      );
      ids = universal.map(section => section.id);
    }

    const sectionRows = ids.length
      ? await queryStrict<{
          id: string;
          name: string;
          sort_order: number;
          options: unknown;
          required: boolean | number | string;
          inheritance_rules: unknown;
        }>(
          `SELECT * FROM sections
           WHERE (id IN (${ids.map(() => '?').join(',')}) OR is_universal = 1)
             AND (show_on_public = 1 OR show_on_public = TRUE)
           ORDER BY sort_order ASC`,
          ids,
        )
      : [];
    const controls = await queryStrict<{
      section_id: string;
      custom_label: string | null;
      admin_hidden: number | boolean | null;
    }>(
      'SELECT section_id, custom_label, admin_hidden FROM business_section_controls WHERE business_id = ?',
      [businessId],
    );
    const controlsBySection = new Map(controls.map(control => [control.section_id, control]));
    const customData = normalizeCustomData(business.custom_data);
    const templateFeatures = parseJson<Record<string, unknown>>(business.template_features, {});
    const templateHidden = Array.isArray(templateFeatures.hidden_sections) ? templateFeatures.hidden_sections : [];
    const customHidden = (customData.basic as Record<string, unknown> | undefined)?.hidden_sections || customData.hidden_sections;
    const publishedManifest = await getPublishedManifest(businessId);
    const manifestSections = publishedManifest
      ? new Map(publishedManifest.sections.map(section => [section.id, section]))
      : null;
    const { searchParams } = new URL(request.url);
    const SUPPORTED_LANGUAGES = ['en', 'ar', 'it', 'de', 'fr', 'es'] as const;
    type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
    const language = (searchParams.get('language') || 'en') as SupportedLanguage;
    const excludePostId = searchParams.get('exclude_post_id') || undefined;
    const excludeSectionBlogId = searchParams.get('exclude_section_blog_id') || undefined;
    if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      return NextResponse.json({ error: 'Unsupported blog language. Supported: en, ar, it, de, fr, es' }, { status: 400 });
    }

    const seen = new Set<string>();
    const visibleSections = sectionRows.filter(section => {
      if (!section?.id || seen.has(section.id)) return false;
      const options = parseJson<Record<string, unknown>>(section.options, {});
      const placements = options.placements;
      const control = controlsBySection.get(section.id);
      if (Array.isArray(placements) && !placements.includes('body')) return false;
      if (isSectionHidden(section.id, customData, control, templateHidden, false)) return false;
      if (Array.isArray(customHidden) && customHidden.includes(section.id)) return false;
      if (!isSectionApprovedForMinisite(section.id, customData, control, false)) return false;
      if (manifestSections?.get(section.id)?.enabled === false) return false;
      seen.add(section.id);
      return true;
    });

    const sections = [];
    for (const section of visibleSections) {
      // Check conflict for all 6 supported languages in parallel
      const conflictResults = await Promise.all(
        SUPPORTED_LANGUAGES.map(lang =>
          findBusinessSectionBlogConflict(businessId, section.id, lang, excludePostId, excludeSectionBlogId)
        )
      );
      const available = Object.fromEntries(
        SUPPORTED_LANGUAGES.map((lang, i) => [lang, !conflictResults[i]])
      ) as Record<SupportedLanguage, boolean>;

      sections.push({
        id: section.id,
        label: getEffectiveSectionLabel(section.id, section.name, customData, controlsBySection.get(section.id)),
        available,
      });
    }

    return NextResponse.json({
      mode: 'section_based',
      sections,
      availableCount: sections.filter(section => section.available[language]).length,
      language,
    });
  } catch (error) {
    console.error('Failed to load visible minisite sections for blog targeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load visible business sections' },
      { status: 500 },
    );
  }
}
