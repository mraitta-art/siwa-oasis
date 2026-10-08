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
import MarketplaceHeader from '@/components/MarketplaceHeader';
import CategoryCommercialTabs from '@/components/CategoryCommercialTabs';
import CategoryInvestmentSection from '@/components/CategoryInvestmentSection';

interface BusinessType {
  id: string;
  name: string;
  parent_id: string | null;
}

interface CategorySearchPageProps {
  category: string;
  label: string;
  title: string;
  description: string;
  accent: string;
  /** Optional canonical section ID for the aggregation layer */
  sectionId?: string;
  /** Skip this component's builder fetch when a parent page already rendered it. */
  skipBuilderFetch?: boolean;
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
  adventure:        'sec_2_ambience',
  logistics:        'sec_6_guardian',
  agriculture_industry: 'sec_9_marketplace_catalog',
  services_professional: 'sec_6_guardian',
  investment_parent: 'sec_7_investment',
  arts_culture:     'sec_2_ambience',
  education_research: 'sec_6_guardian',
  events_entertainment: 'sec_2_ambience',
  media_content:   'sec_9_marketplace_catalog',
  journeys: 'sec_5_experiences',
};

const CATEGORY_TO_PARENT: Record<string, string> = {
  accommodation: 'accommodation', accommodations: 'accommodation',
  restaurant: 'food', restaurants: 'food', food: 'food', 'food-beverage': 'food',
  activity: 'adventure', activities: 'adventure', journeys: 'adventure',
  transportation: 'logistics', transportations: 'logistics',
  crafts: 'crafts', wellness: 'wellness',
  'production-trade': 'agriculture_industry',
  services: 'services_professional',
  investment: 'investment_parent',
};

const CATEGORY_TO_TYPE_FILTER: Record<string, string> = {
  'crafts-wellness': 'crafts,wellness',
};

const CATEGORY_TO_PAGE: Record<string, string> = {
  accommodation: 'accommodations', food: 'food-beverage', adventure: 'activities',
  logistics: 'transportation', agriculture_industry: 'production-trade',
  services_professional: 'services', investment_parent: 'investment-opportunities',
  crafts: 'crafts-wellness',
  wellness: 'crafts-wellness',
  journeys: 'journeys',
};

export default function CategorySearchPage({
  category,
  label,
  title,
  description,
  accent,
  sectionId: propSectionId,
  skipBuilderFetch = false,
}: CategorySearchPageProps) {

  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [parentTypes, setParentTypes] = useState<BusinessType[]>([]);
  const [childTypes, setChildTypes] = useState<BusinessType[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadBusinessTypes() {
      try {
        const parentsResponse = await fetch('/api/business-types?is_parent=true');
        const parentsData = parentsResponse.ok ? await parentsResponse.json() : [];
        const parents: BusinessType[] = Array.isArray(parentsData) ? parentsData : [];
        const childrenResponse = parents.length
          ? await fetch(`/api/business-types?parent_ids=${parents.map(type => encodeURIComponent(type.id)).join(',')}`)
          : null;
        const childrenData = childrenResponse?.ok ? await childrenResponse.json() : [];
        const children: BusinessType[] = Array.isArray(childrenData) ? childrenData : [];
        const requestedTypeId = new URLSearchParams(window.location.search).get('type');
        const requestedChild = children.find(type => type.id === requestedTypeId);
        const requestedParent = parents.find(type => type.id === requestedTypeId);
        const childMatch = requestedChild || children.find(type => type.id === category);
        const mappedParent = CATEGORY_TO_PARENT[category.toLowerCase()] || category;
        if (!cancelled) {
          setParentTypes(parents);
          setChildTypes(children);
          setSelectedParentId(childMatch?.parent_id || requestedParent?.id || (parents.some(type => type.id === mappedParent) ? mappedParent : ''));
          setSelectedChildId(childMatch?.id || '');
        }
      } catch {
        if (!cancelled) {
          setParentTypes([]);
          setChildTypes([]);
        }
      }
    }
    loadBusinessTypes();
    return () => { cancelled = true; };
  }, [category]);

  const selectedTypeId = selectedChildId || selectedParentId || CATEGORY_TO_TYPE_FILTER[category.toLowerCase()] || category;
  const selectedTypeName = childTypes.find(type => type.id === selectedChildId)?.name
    || parentTypes.find(type => type.id === selectedParentId)?.name
    || label;
  const categorySelector = (
    <section aria-label="Filter businesses by category" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', padding: '1rem clamp(1rem, 3vw, 2rem)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <label style={{ display: 'grid', gap: '0.3rem', color: '#526459', fontSize: '0.7rem', fontWeight: 800 }}>
        Parent category
        <select value={selectedParentId} onChange={event => { setSelectedParentId(event.target.value); setSelectedChildId(''); }} style={{ minWidth: 210, padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: 5, background: '#fff', color: '#17251d' }}>
          <option value="">Combined / select a sector</option>
          {parentTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      </label>
      <label style={{ display: 'grid', gap: '0.3rem', color: '#526459', fontSize: '0.7rem', fontWeight: 800 }}>
        Business type
        <select value={selectedChildId} disabled={!selectedParentId} onChange={event => setSelectedChildId(event.target.value)} style={{ minWidth: 210, padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: 5, background: '#fff', color: '#17251d' }}>
          <option value="">All types in category</option>
          {childTypes.filter(type => type.parent_id === selectedParentId).map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      </label>
    </section>
  );

  // Resolve section ID
  const typeParentId = childTypes.find(type => type.id === category)?.parent_id || CATEGORY_TO_PARENT[category.toLowerCase()] || category;
  const resolvedSection =
    propSectionId ||
    CATEGORY_TO_SECTION[category.toLowerCase()] ||
    CATEGORY_TO_SECTION[typeParentId] ||
    'sec_1_identity';

  // Resolve page config key
  const pagePath = CATEGORY_TO_PAGE[category.toLowerCase()] || CATEGORY_TO_PAGE[typeParentId] || (
    category === 'accommodation' ? 'accommodations' :
    category === 'transportation' ? 'transportation' :
    category === 'food' ? 'food-beverage' :
    category === 'activity' ? 'activities' :
    category === 'crafts-wellness' ? 'crafts-wellness' :
    category === 'restaurant' ? 'restaurants' :
    `${category}s`
  );

  useEffect(() => {
    if (skipBuilderFetch) {
      setLoading(false);
      return;
    }
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
  }, [pagePath, skipBuilderFetch]);

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
    const resolvedLayout = builderConfig.layout.map((section: any) => {
      if (section?.type === 'search_bar') {
        return { ...section, props: { ...(section.props || {}), defaultCategory: selectedTypeId } };
      }
      if (section?.type === 'category_commercial_tabs') {
        return { ...section, props: { ...(section.props || {}), category: selectedTypeId } };
      }
      return section;
    });
    const hasCommercialTabs = resolvedLayout.some((section: any) => section?.type === 'category_commercial_tabs');

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
        <MarketplaceHeader
          title={label}
          accentColor={accent}
        />
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
          categoryFilter={selectedTypeId}
          topContent={categorySelector}
        />
        {!hasCommercialTabs && <CategoryCommercialTabs category={selectedTypeId} />}
        <CategoryInvestmentSection typeId={selectedTypeId} label={selectedTypeName} />
      </div>
    );
  }

  // ── No admin layout → full auto-aggregation page ────────────────────────────
  return (
    <>
      <SectionAggregationPage
        sectionId={resolvedSection}
        pageConfigId={`website_${pagePath}`}
        pageLabel={title}
        description={description}
        accentColor={accent}
        ctaLabel={`Explore ${label}`}
        showPartnerCta
        categoryFilter={selectedTypeId}
        topContent={categorySelector}
      />
      <CategoryCommercialTabs category={selectedTypeId} />
      <CategoryInvestmentSection typeId={selectedTypeId} label={selectedTypeName} />
    </>
  );
}

