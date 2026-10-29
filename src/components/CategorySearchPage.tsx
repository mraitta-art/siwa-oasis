'use client';

/**
 * CategorySearchPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Used by all Siwify brand sector pages (/siwa-stay, /siwa-go, /siwa-table…)
 *
 * Priority:
 *  1. Admin has configured a builder layout → render DynamicHomepageRenderer
 *     (admin layout wins, vendor grid appended below)
 *  2. No admin layout → render SectionAggregationPage auto-vendor grid
 *     (zero admin config required — live data from DB automatically)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import SectionAggregationPage from '@/components/SectionAggregationPage';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import CategoryInvestmentSection from '@/components/CategoryInvestmentSection';
import SmartJourneyPlanner from '@/components/SmartJourneyPlanner';
import RetreatProgramBuilder from '@/components/RetreatProgramBuilder';
import AccommodationExplorer from '@/components/AccommodationExplorer';
import { BRAND_SECTOR_HERO } from '@/lib/brand-sectors';


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
  /** Optional explicit page slug for page-specific configuration */
  pageSlug?: string;
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
  'adventure,logistics': 'siwa-go',
  'crafts,agriculture_industry,production_trade': 'siwa-products',
  'arts_culture,education_research,events_entertainment,media_content,services_professional': 'siwa-society',
};

// ─── Per-sector hero background images ───────────────────────────────────────
const DEFAULT_HERO = {
  image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1400',
  tagline: 'Discover the best of Egypt on Siwify',
  gradient: 'linear-gradient(160deg,rgba(7,11,8,0.88) 0%,rgba(24,40,27,0.6) 60%,rgba(7,11,8,0.95) 100%)',
};

// ─── Sector icon map ──────────────────────────────────────────────────────────
const SECTOR_ICON: Record<string, string> = {
  'siwa-stay': 'fa-bed',
  'siwa-go': 'fa-compass',
  'siwa-table': 'fa-utensils',
  'siwa-retreats': 'fa-spa',
  'siwa-retreat': 'fa-spa',
  'siwa-products': 'fa-store',
  'siwa-move': 'fa-car',
  'siwa-invest': 'fa-chart-line',
  'siwa-society': 'fa-people-group',
  'siwa-experiences': 'fa-compass',
};

export default function CategorySearchPage({
  category,
  label,
  title,
  description,
  accent,
  sectionId: propSectionId,
  skipBuilderFetch = false,
  pageSlug,
}: CategorySearchPageProps) {

  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [parentTypes, setParentTypes] = useState<BusinessType[]>([]);
  const [childTypes, setChildTypes] = useState<BusinessType[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');

  // Resolve page config key
  const effectivePageKey = pageSlug || CATEGORY_TO_PAGE[category.toLowerCase()] || (
    category === 'accommodation' ? 'accommodations' :
    category === 'transportation' ? 'transportation' :
    category === 'food' ? 'food-beverage' :
    category === 'activity' ? 'activities' :
    category === 'crafts-wellness' ? 'crafts-wellness' :
    category === 'restaurant' ? 'restaurants' :
    category.includes(',') ? 'siwa-products' :
    `${category}s`
  );

  const heroConfig = BRAND_SECTOR_HERO[pageSlug || ''] || DEFAULT_HERO;
  const sectorIcon = SECTOR_ICON[pageSlug || ''] || 'fa-sun';

  useEffect(() => {
    let cancelled = false;
    async function loadBusinessTypes() {
      try {
        const [parentsResponse, visibilityResponse] = await Promise.all([
          fetch('/api/business-types?is_parent=true'),
          fetch(`/api/category-parent-visibility?page=${encodeURIComponent(effectivePageKey)}`).catch(() => null),
        ]);

        const parentsData = parentsResponse.ok ? await parentsResponse.json() : [];
        const allParents: BusinessType[] = Array.isArray(parentsData) ? parentsData : [];

        let allowedParentIds: string[] | null = null;
        if (visibilityResponse && visibilityResponse.ok) {
          const visData = await visibilityResponse.json();
          if (Array.isArray(visData.visible_parents) && visData.visible_parents.length > 0) {
            allowedParentIds = visData.visible_parents;
          }
        }

        if (!allowedParentIds && category.includes(',')) {
          allowedParentIds = category.split(',').map(c => c.trim().toLowerCase());
        }

        const parents = allowedParentIds
          ? allParents.filter(p => allowedParentIds!.includes(p.id.toLowerCase()))
          : allParents;

        const childrenResponse = parents.length
          ? await fetch(`/api/business-types?parent_ids=${parents.map(type => encodeURIComponent(type.id)).join(',')}`)
          : null;
        const childrenData = childrenResponse?.ok ? await childrenResponse.json() : [];
        const children: BusinessType[] = Array.isArray(childrenData) ? childrenData : [];
        const requestedTypeId = new URLSearchParams(window.location.search).get('type');
        const fixedParentId = CATEGORY_TO_PARENT[category.toLowerCase()]
          || (parents.some(type => type.id === category) ? category : '');
        const requestedChild = children.find(type =>
          type.id === requestedTypeId && (!fixedParentId || type.parent_id === fixedParentId)
        );
        const requestedParent = parents.find(type => type.id === requestedTypeId);
        const childMatch = requestedChild || children.find(type =>
          type.id === category && (!fixedParentId || type.parent_id === fixedParentId)
        );
        if (!cancelled) {
          setParentTypes(parents);
          setChildTypes(children);
          setSelectedParentId(fixedParentId || childMatch?.parent_id || requestedParent?.id || '');
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
  }, [category, effectivePageKey]);

  const selectedTypeId = selectedChildId || selectedParentId || CATEGORY_TO_TYPE_FILTER[category.toLowerCase()] || category;
  const selectedTypeName = childTypes.find(type => type.id === selectedChildId)?.name
    || parentTypes.find(type => type.id === selectedParentId)?.name
    || label;
  const fixedParentId = CATEGORY_TO_PARENT[category.toLowerCase()]
    || (parentTypes.some(type => type.id === category) ? category : '');
  const fixedParent = parentTypes.find(type => type.id === fixedParentId);
  const fixedParentName = fixedParent?.name || label;

  // ─── Dark cinematic pill filter bar ──────────────────────────────────────────
  const categorySelector = (
    <section
      aria-label="Filter businesses by category"
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.6rem',
        flexWrap: 'wrap',
        padding: '1.25rem clamp(1rem, 3vw, 2rem)',
        background: 'rgba(13, 21, 15, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {!fixedParentId && parentTypes.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', alignSelf: 'center' }}>Sector</span>
          {parentTypes.map(type => {
            const isActive = selectedParentId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => { setSelectedParentId(type.id); setSelectedChildId(''); }}
                style={{
                  background: isActive ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.05)',
                  border: isActive ? `1px solid rgba(212,175,55,0.45)` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '50px',
                  color: isActive ? '#D4AF37' : 'rgba(248,250,252,0.65)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.42rem 0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {type.name}
              </button>
            );
          })}
          {selectedParentId && (
            <button
              onClick={() => { setSelectedParentId(''); setSelectedChildId(''); }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '50px',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.42rem 0.75rem',
                cursor: 'pointer',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {selectedParentId && childTypes.filter(type => type.parent_id === selectedParentId).length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', alignSelf: 'center' }}>
            {fixedParentId ? `${fixedParentName} type` : 'Type'}
          </span>
          <button
            onClick={() => setSelectedChildId('')}
            style={{
              background: !selectedChildId ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.05)',
              border: !selectedChildId ? `1px solid rgba(212,175,55,0.45)` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50px',
              color: !selectedChildId ? '#D4AF37' : 'rgba(248,250,252,0.55)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.42rem 0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            All types
          </button>
          {childTypes.filter(type => type.parent_id === selectedParentId).map(type => {
            const isActive = selectedChildId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedChildId(type.id)}
                style={{
                  background: isActive ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.05)',
                  border: isActive ? `1px solid rgba(212,175,55,0.45)` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '50px',
                  color: isActive ? '#D4AF37' : 'rgba(248,250,252,0.65)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.42rem 0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {type.name}
              </button>
            );
          })}
        </div>
      )}

      {/* When fixedParentId: show only child type pills in a single row */}
      {fixedParentId && childTypes.filter(type => type.parent_id === selectedParentId).length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => setSelectedChildId('')}
            style={{
              background: !selectedChildId ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.05)',
              border: !selectedChildId ? `1px solid rgba(212,175,55,0.45)` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50px',
              color: !selectedChildId ? '#D4AF37' : 'rgba(248,250,252,0.55)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.42rem 0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            All {fixedParentName.toLowerCase()} types
          </button>
          {childTypes.filter(type => type.parent_id === selectedParentId).map(type => {
            const isActive = selectedChildId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedChildId(type.id)}
                style={{
                  background: isActive ? `rgba(212,175,55,0.15)` : 'rgba(255,255,255,0.05)',
                  border: isActive ? `1px solid rgba(212,175,55,0.45)` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '50px',
                  color: isActive ? '#D4AF37' : 'rgba(248,250,252,0.65)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.42rem 0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {type.name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );

  // Resolve section ID
  const typeParentId = childTypes.find(type => type.id === category)?.parent_id || CATEGORY_TO_PARENT[category.toLowerCase()] || category;
  const resolvedSection =
    propSectionId ||
    CATEGORY_TO_SECTION[category.toLowerCase()] ||
    CATEGORY_TO_SECTION[typeParentId] ||
    'sec_1_identity';

  const pagePath = effectivePageKey;

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
        minHeight: '100vh', background: '#FFFFFF',
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
    const resolvedLayout = builderConfig.layout.map((section: any) => {
      if (section?.type === 'search_bar') {
        return { ...section, props: { ...(section.props || {}), defaultCategory: selectedTypeId } };
      }
      if (section?.type === 'category_commercial_tabs') {
        return { ...section, props: { ...(section.props || {}), category: selectedTypeId } };
      }
      if (section?.type === 'sector_directory') {
        return { ...section, props: { ...(section.props || {}), categoryFilter: selectedTypeId } };
      }
      return section;
    });

    const isSectorLayoutManaged = builderConfig.site_settings?.sector_layout_managed === true;
    const visibleLayout = resolvedLayout.filter((section: any) =>
      (section?.type !== 'sector_directory' || builderConfig.site_settings?.show_sector_directory !== false)
      && (section?.type !== 'sector_investment' || builderConfig.site_settings?.show_sector_investment !== false)
    );
    const finalLayout = (pageSlug === 'siwa-retreats' || pageSlug === 'siwa-retreat')
      && !visibleLayout.some((s: any) => s?.type === 'retreat_program_builder')
      ? [{ id: 'sec_retreat_builder', type: 'retreat_program_builder', props: { accentColor: accent } }, ...visibleLayout]
      : visibleLayout;

    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
        <MarketplaceHeader
          title={label}
          accentColor={accent}
        />
        <DynamicHomepageRenderer
          layout={finalLayout}
          settings={builderConfig?.site_settings || { primary_color: accent }}
          pageId={pagePath}
          sectorDirectoryTopContent={categorySelector}
        />

        {/* Legacy layouts keep these live sections until saved in the block editor. */}
        {!isSectorLayoutManaged
          && builderConfig.site_settings?.show_sector_directory !== false
          && !finalLayout.some((section: any) => section?.type === 'sector_directory') && (
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
        )}
        {!isSectorLayoutManaged
          && builderConfig.site_settings?.show_sector_investment !== false
          && !finalLayout.some((section: any) => section?.type === 'sector_investment') && (
          <CategoryInvestmentSection typeId={selectedTypeId} label={selectedTypeName} />
        )}
      </div>
    );
  }

  // ── No admin layout → full auto-aggregation page ────────────────────────────
  const isPlanningCategory = ['accommodation', 'accommodations', 'food', 'restaurants', 'restaurant', 'adventure', 'activity', 'activities', 'logistics', 'transportation', 'wellness'].includes(category.toLowerCase()) || Boolean(pageSlug?.startsWith('siwa-'));

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes heroPulse { 0%,100% { transform: scale(1.02); } 50% { transform: scale(1.06); } }
      `}</style>

      <MarketplaceHeader
        title={label}
        accentColor={accent}
      />

      {/* ── Cinematic per-sector hero ──────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        height: 'clamp(340px, 52vw, 600px)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Hero background image with Ken Burns */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${heroConfig.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'heroPulse 20s ease-in-out infinite',
          transformOrigin: 'center',
        }} />

        {/* Cinematic gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: heroConfig.gradient,
        }} />

        {/* Gold accent radial glow */}
        <div style={{
          position: 'absolute',
          bottom: '-60px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: `radial-gradient(ellipse at center, ${accent}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center',
          padding: '0 clamp(1.5rem, 5vw, 4rem)',
          maxWidth: '900px',
          animation: 'fadeUp 0.8s ease both',
        }}>
          {/* Sector pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: `${accent}1f`,
            border: `1px solid ${accent}55`,
            backdropFilter: 'blur(12px)',
            borderRadius: '50px',
            padding: '0.35rem 0.9rem',
            marginBottom: '1.25rem',
            fontSize: '0.68rem', fontWeight: 900, letterSpacing: '2px',
            color: accent, textTransform: 'uppercase',
          }}>
            <i className={`fas ${sectorIcon}`} style={{ fontSize: '0.65rem' }} />
            {label}
          </div>

          {/* Main heading */}
          <h1 style={{
            fontSize: 'clamp(2rem, 5.5vw, 4.5rem)',
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: '0 0 0.75rem',
            textShadow: '0 4px 32px rgba(0,0,0,0.5)',
          }}>
            {title}
          </h1>

          {/* Tagline */}
          <p style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.2rem)',
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 400,
            lineHeight: 1.6,
            margin: '0 auto 1.75rem',
            maxWidth: '600px',
          }}>
            {heroConfig.tagline}
          </p>

          {/* Description snippet */}
          <p style={{
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: '0 auto',
          }}>
            {description}
          </p>
        </div>

        {/* Bottom fade to main dark bg */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '120px',
          background: 'linear-gradient(to bottom, transparent, #FFFFFF)',
        }} />
      </section>

      {/* ── RetreatProgramBuilder, AccommodationExplorer, or SmartJourneyPlanner ── */}
      {pageSlug === 'siwa-retreats' || pageSlug === 'siwa-retreat' || category === 'wellness' ? (
        <>
          <RetreatProgramBuilder accentColor={accent} />
          <SmartJourneyPlanner
            mode="retreatment"
            category={category}
            subtitle={label}
          />
        </>
      ) : pageSlug === 'siwa-stay' || category === 'accommodation' ? (
        <>
          <AccommodationExplorer accentColor={accent} />
          <SmartJourneyPlanner
            mode="accommodation"
            category={category}
            subtitle={label}
          />
        </>
      ) : pageSlug === 'siwa-go' || pageSlug === 'siwa-experiences' || category === 'adventure' ? (
        <SmartJourneyPlanner
          mode="safaris"
          category={category}
          subtitle={label}
        />
      ) : pageSlug === 'siwa-move' || category === 'logistics' || category === 'transportation' ? (
        <SmartJourneyPlanner
          mode="transport"
          category={category}
          subtitle={label}
        />
      ) : pageSlug === 'siwa-table' || category === 'food' || category === 'restaurant' || category === 'restaurants' ? (
        <SmartJourneyPlanner
          mode="dining"
          category={category}
          subtitle={label}
        />
      ) : isPlanningCategory ? (
        <SmartJourneyPlanner
          mode="all"
          category={category}
          subtitle={label}
        />
      ) : null}

      {/* ── Vendor grid with dark pill filters ──────────────────────────────── */}
      {(pageSlug === 'siwa-stay' || category === 'accommodation') ? (
        // For siwa-stay: AccommodationExplorer above IS the full DB-driven display.
        // Only show the partner CTA strip + investment section (no duplicate vendor grid).
        <div style={{
          maxWidth: '1320px', margin: '0 auto',
          padding: 'clamp(2rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)',
        }}>
          {/* Partner CTA strip */}
          <div style={{
            padding: 'clamp(2rem, 4vw, 3rem)',
            background: 'linear-gradient(135deg, #101c13, #F1F5F9)',
            borderRadius: '20px',
            display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
            alignItems: 'center', justifyContent: 'space-between',
            color: '#fff',
            boxShadow: '0 0 80px rgba(212,175,55,0.06) inset',
            border: '1px solid rgba(212,175,55,0.2)',
          }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '0.35rem' }}>
                Own a Lodge, Chalet, or Camp in Siwa?
              </div>
              <p style={{ opacity: 0.7, fontSize: '0.85rem', margin: 0 }}>
                List your property on Siwify and get a cinematic minisite with direct WhatsApp bookings — 0% commission.
              </p>
            </div>
            <Link
              href="/be-a-partner"
              style={{
                background: accent, color: '#fff',
                padding: '0.85rem 2rem', borderRadius: '50px',
                fontWeight: 800, textDecoration: 'none',
                fontSize: '0.9rem', flexShrink: 0,
                boxShadow: `0 6px 20px ${accent}55`,
              }}
            >
              List Your Property →
            </Link>
          </div>
        </div>
      ) : (
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
      )}
      <CategoryInvestmentSection typeId={selectedTypeId} label={selectedTypeName} />
    </div>
  );
}
