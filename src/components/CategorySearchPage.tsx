'use client';

import React, { useEffect, useState } from 'react';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

interface CategorySearchPageProps {
  category: string;
  label: string;
  title: string;
  description: string;
  accent: string;
}

export default function CategorySearchPage({
  category,
  label,
  title,
  description,
  accent,
}: CategorySearchPageProps) {
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pagePath = category === 'accommodation'
    ? 'accommodations'
    : category === 'transportation'
      ? 'transportation'
    : category === 'food'
      ? 'food-beverage'
    : category === 'activity'
      ? 'activities'
      : `${category}s`;

  useEffect(() => {
    fetch(`/api/jana/website?id=website_${pagePath}`)
      .then(response => response.ok ? response.json() : [])
      .then(result => {
        const config = Array.isArray(result) ? result[0] : result;
        const layout = [
          ...(config?.header_components || []),
          ...(config?.body_components || []),
          ...(config?.footer_components || []),
        ];
        setBuilderConfig(layout.length > 0 ? { ...config, layout } : null);
      })
      .catch(() => setBuilderConfig(null))
      .finally(() => setLoading(false));
  }, [pagePath]);

  // Default dynamic layout if no customized database config has been saved yet
  const defaultDynamicLayout = [
    // ── Hero Carousel — managed at /jana/hero-carousel?mainPreset=<pagePath>_hero ──
    {
      id: `${pagePath}_carousel`,
      type: 'hero_carousel',
      props: { carousel_id: `${pagePath}_hero` }
    },
    // ── Thematic static hero banner (shown when carousel has no slides yet) ──
    {
      id: `${pagePath}_hero`,
      type: 'category_hero',
      props: { category, label, title, accent, description }
    },
    {
      id: `${pagePath}_search`,
      type: 'search_bar',
      props: { defaultCategory: category }
    },
    {
      id: `${pagePath}_deals`,
      type: 'category_commercial_tabs',
      props: { category }
    },
    {
      id: `${pagePath}_directory`,
      type: 'services_hub',
      props: { title: `${label} Directory`, subtitle: `Verified ${label.toLowerCase()} partners across Siwa Oasis` }
    },
    {
      id: `${pagePath}_story`,
      type: 'storytelling_section',
      props: { title: `Authentic ${label} in Siwa`, subtitle: 'Discover the traditions, heritage, and serene beauty of the oasis.' }
    },
    {
      id: `${pagePath}_partner_cta`,
      type: 'partner_cta',
      props: { title: `Are you a ${label} provider in Siwa?`, subtitle: 'Join our ecosystem to list your business and receive direct bookings.' }
    }
  ];

  const activeLayout = builderConfig?.layout || defaultDynamicLayout;

  const resolvedLayout = activeLayout.map((section: any) => (
    section?.type === 'search_bar'
      ? { ...section, props: { ...(section.props || {}), defaultCategory: section.props?.defaultCategory || category } }
      : section
  ));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
      <DynamicHomepageRenderer
        layout={resolvedLayout}
        settings={builderConfig?.site_settings || { primary_color: accent }}
        pageId={pagePath}
      />
    </div>
  );
}
