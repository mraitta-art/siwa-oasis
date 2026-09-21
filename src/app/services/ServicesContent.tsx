'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

// Default services — shown when no admin config exists yet
const DEFAULT_SERVICES = [
  { id: 1, name: 'Accommodation',        icon: '🏨', description: 'Desert hotels, camps, and resorts',             color: 'from-blue-500 to-blue-600',   slug: 'accommodation' },
  { id: 2, name: 'Tours & Experiences',  icon: '🐪', description: 'Desert safaris, hiking, and guides',           color: 'from-yellow-500 to-yellow-600', slug: 'tours-experiences' },
  { id: 3, name: 'Food & Beverage',      icon: '🍽️', description: 'Restaurants, cafes, and dining',               color: 'from-orange-500 to-orange-600', slug: 'food-beverage' },
  { id: 4, name: 'Transportation',       icon: '🚗', description: 'Rentals, taxis, and transfers',               color: 'from-green-500 to-green-600',   slug: 'transportation' },
  { id: 5, name: 'Shopping',             icon: '🛍️', description: 'Souvenirs, crafts, and local products',       color: 'from-purple-500 to-purple-600', slug: 'shopping' },
  { id: 6, name: 'Entertainment',        icon: '🎪', description: 'Shows, cultural events, and activities',      color: 'from-pink-500 to-pink-600',     slug: 'entertainment' },
  { id: 7, name: 'Wellness',             icon: '🧘', description: 'Spa, yoga, and relaxation',                  color: 'from-teal-500 to-teal-600',     slug: 'wellness' },
  { id: 8, name: 'Photography',          icon: '📸', description: 'Photography services and tours',              color: 'from-indigo-500 to-indigo-600', slug: 'photography' },
];

export default function ServicesContent() {
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [services, setServices]           = useState<typeof DEFAULT_SERVICES>(DEFAULT_SERVICES);
  const [heroText, setHeroText]           = useState({ title: 'Siwa Services', subtitle: 'Discover the best services and experiences in the Siwa Oasis' });
  const [loaded, setLoaded]               = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        // 1. Try the page builder config first
        const res = await fetch('/api/jana/website?id=website_services');
        if (res.ok) {
          const data = await res.json();
          const config = Array.isArray(data) ? data[0] : data;
          const layout = [
            ...(config?.header_components || []),
            ...(config?.body_components   || []),
            ...(config?.footer_components || []),
          ];
          if (layout.length > 0) {
            setBuilderConfig({ ...config, layout });
            setLoaded(true);
            return;
          }
          // Pull hero text from site_settings if available
          if (config?.site_settings?.services_title)
            setHeroText({ title: config.site_settings.services_title, subtitle: config.site_settings.services_subtitle || heroText.subtitle });
        }
      } catch { /* fall through to default */ }

      // 2. Fetch live business types from DB to populate service cards dynamically
      try {
        const typesRes = await fetch('/api/jana/types');
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          const types: any[] = Array.isArray(typesData) ? typesData : (typesData.types || []);
          if (types.length > 0) {
            const colors = ['from-blue-500 to-blue-600','from-yellow-500 to-yellow-600','from-orange-500 to-orange-600','from-green-500 to-green-600','from-purple-500 to-purple-600','from-pink-500 to-pink-600','from-teal-500 to-teal-600','from-indigo-500 to-indigo-600'];
            setServices(types.slice(0, 12).map((t: any, i: number) => ({
              id: t.id || i,
              name: t.name || t.label || 'Service',
              icon: t.icon || '✨',
              description: t.description || `Explore ${t.name || 'this service'} in Siwa Oasis`,
              color: colors[i % colors.length],
              slug: (t.id || t.name || 'service').toLowerCase().replace(/\s+/g, '-'),
            })));
          }
        }
      } catch { /* use DEFAULT_SERVICES */ }

      setLoaded(true);
    }
    loadConfig();
  }, []);

  // If builder config exists, let DynamicHomepageRenderer take over
  if (builderConfig) {
    return <DynamicHomepageRenderer layout={builderConfig.layout} settings={builderConfig.site_settings || null} pageId="services" />;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-[#D4AF37] text-sm font-bold tracking-widest animate-pulse">LOADING SERVICES…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              {heroText.title}
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">{heroText.subtitle}</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Link key={service.id} href={`/search/${service.slug}`} className="group relative overflow-hidden rounded-lg">
              <div className={`bg-gradient-to-br ${service.color} p-8 h-full`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
                <div className="relative z-10">
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                  <p className="text-gray-100 mb-4">{service.description}</p>
                  <div className="inline-flex items-center text-white group-hover:translate-x-2 transition-transform">
                    <span className="text-sm font-semibold">Explore</span>
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-white to-transparent transition-opacity rounded-lg" />
            </Link>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Search All Services</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input type="text" placeholder="Search services..." className="px-6 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] w-full sm:w-96" />
            <button className="px-8 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto">Search</button>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Can't find what you're looking for?</h3>
        <p className="text-gray-400 mb-8">Browse all businesses in the Siwa Oasis marketplace</p>
        <Link href="/search" className="inline-block px-8 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          Explore All Businesses
        </Link>
      </div>

      {/* Admin hint */}
      <div className="text-center py-4 text-xs text-gray-700">
        Admin: edit this page at{' '}
        <a href="/admin/homepage-editor/website_services" className="underline hover:text-[#D4AF37]">/admin/homepage-editor/website_services</a>
      </div>
    </div>
  );
}
