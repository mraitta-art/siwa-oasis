'use client';

import React, { useEffect, useState } from 'react';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import PageNotConfigured from '@/components/PageNotConfigured';

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

  // Resolve the page path key used in website_configs (fix crafts-wellness double-s bug)
  const pagePath =
    category === 'accommodation'
      ? 'accommodations'
      : category === 'transportation'
      ? 'transportation'
      : category === 'food'
      ? 'food-beverage'
      : category === 'activity'
      ? 'activities'
      : category === 'crafts-wellness'
      ? 'crafts-wellness'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070B12' }}>
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No builder config saved yet — show admin prompt
  if (!builderConfig) {
    return (
      <PageNotConfigured
        pageName={label}
        pageId={pagePath}
      />
    );
  }

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
    </div>
  );
}
