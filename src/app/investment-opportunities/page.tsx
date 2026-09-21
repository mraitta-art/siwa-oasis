'use client';

import { useState, useEffect } from 'react';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import PageNotConfigured from '@/components/PageNotConfigured';

export default function MainSiteInvestmentOpportunitiesPage() {
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jana/website?id=website_investment-opportunities')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const config = Array.isArray(data) ? data[0] : data;
        const layout = [
          ...(config?.header_components || []),
          ...(config?.body_components || []),
          ...(config?.footer_components || []),
        ];
        setBuilderConfig(layout.length > 0 ? { ...config, layout } : null);
      })
      .catch(() => setBuilderConfig(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070B12' }}>
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!builderConfig) {
    return <PageNotConfigured pageName="Investment Opportunities" pageId="investment-opportunities" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
      <DynamicHomepageRenderer
        layout={builderConfig.layout}
        settings={builderConfig.site_settings || null}
        pageId="investment-opportunities"
      />
    </div>
  );
}
