'use client';

import { useState, useEffect } from 'react';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import PageNotConfigured from '@/components/PageNotConfigured';

export default function PackagesPage() {
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jana/website?id=website_packages')
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
    return <PageNotConfigured pageName="Packages" pageId="packages" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }} className="relative">
      {/* Top Banner Callout */}
      <div className="bg-[#0f172a] border-b border-[#D4AF37]/30 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[#D4AF37] font-bold">✨ Want a custom itinerary?</span>
          <span className="text-slate-300 hidden sm:inline">Mix & match salt lakes, 4x4 dunes, and eco-lodges with instant 15% bundle discounts!</span>
        </div>
        <a
          href="/customize-journey"
          className="px-3.5 py-1 rounded-full bg-[#D4AF37] text-black font-bold text-xs hover:bg-[#e5c158] transition shadow"
        >
          Customize Now →
        </a>
      </div>

      <DynamicHomepageRenderer
        layout={builderConfig.layout}
        settings={builderConfig.site_settings || null}
        pageId="packages"
      />
    </div>
  );
}
