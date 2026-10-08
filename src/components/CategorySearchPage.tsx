'use client';

/**
 * CategorySearchPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Used by: /activities, /restaurants, /accommodations, /crafts-wellness
 *
 * Priority:
 *  1. Admin has configured a builder layout → render DynamicHomepageRenderer
 *     (admin layout wins, vendor grid appended below)
 *  2. No admin layout → render SectionAggregationPage auto-vendor grid
 *     (zero admin config required — live data from DB automatically)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import SectionAggregationPage from '@/components/SectionAggregationPage';

interface CategorySearchPageProps {
  category: string;
  label: string;
  title: string;
  description: string;
  accent: string;
  /** Optional canonical section ID for the aggregation layer */
  sectionId?: string;
}

/** Map category slug to canonical section ID */
const CATEGORY_TO_SECTION: Record<string, string> = {
  activity:         'sec_2_ambience',
  activities:       'sec_2_ambience',
  accommodation:    'sec_3_facilities',
  accommodations:   'sec_3_facilities',
  restaurant:       'sec_4_gastronomy',
  restaurants:      'sec_4_gastronomy',
  food:             'sec_4_gastronomy',
  'food-beverage':  'sec_4_gastronomy',
  'crafts-wellness':'sec_9_marketplace_catalog',
  crafts:           'sec_9_marketplace_catalog',
  wellness:         'sec_9_marketplace_catalog',
  services:         'sec_6_guardian',
  investment:       'sec_7_investment',
};

export default function CategorySearchPage({
  category,
  label,
  title,
  description,
  accent,
  sectionId: propSectionId,
}: CategorySearchPageProps) {

  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [loading, setLoading]             = useState(true);

  // Resolve section ID
  const resolvedSection =
    propSectionId ||
    CATEGORY_TO_SECTION[category.toLowerCase()] ||
    'sec_1_identity';

  // Resolve page config key
  const pagePath =
    category === 'accommodation'    ? 'accommodations' :
    category === 'transportation'   ? 'transportation' :
    category === 'food'             ? 'food-beverage' :
    category === 'activity'         ? 'activities' :
    category === 'crafts-wellness'  ? 'crafts-wellness' :
    category === 'restaurant'       ? 'restaurants' :
    `${category}s`;

  useEffect(() => {
    fetch(`/api/jana/website?id=website_${pagePath}`)
      .then(r => r.ok ? r.json() : [])
      .then(result => {
        const config = Array.isArray(result) ? result[0] : result;
        const layout = [
          ...(config?.header_components || []),
          ...(config?.body_components   || []),
          ...(config?.footer_components || []),
        ];
        setBuilderConfig(layout.length > 0 ? { ...config, layout } : null);
      })
      .catch(() => setBuilderConfig(null))
      .finally(() => setLoading(false));
  }, [pagePath]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#070B12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: `2.5px solid ${accent}`, borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Admin builder layout — renders it, PLUS appends vendor grid below ───────
  if (builderConfig) {
    // Ensure search_bar sections carry the correct category
    const resolvedLayout = builderConfig.layout.map((section: any) =>
      section?.type === 'search_bar'
        ? { ...section, props: { ...(section.props || {}), defaultCategory: section.props?.defaultCategory || category } }
        : section
    );

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
        <DynamicHomepageRenderer
          layout={resolvedLayout}
          settings={builderConfig?.site_settings || { primary_color: accent }}
          pageId={pagePath}
        />
        {/* Live vendor section grid appended below the builder layout */}
        <SectionAggregationPage
          sectionId={resolvedSection}
          pageConfigId={`__embedded_${pagePath}`}
          pageLabel={label}
          description={description}
          accentColor={accent}
          ctaLabel={`Explore ${label}`}
          showPartnerCta
          skipBuilderFetch
        />
      </div>
    );
  }

  // ── No admin layout → full auto-aggregation page ────────────────────────────
  return (
    <SectionAggregationPage
      sectionId={resolvedSection}
      pageConfigId={`website_${pagePath}`}
      pageLabel={title}
      description={description}
      accentColor={accent}
      ctaLabel={`Explore ${label}`}
      showPartnerCta
    />
  );
}
