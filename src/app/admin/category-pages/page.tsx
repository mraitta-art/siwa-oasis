'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const CATEGORY_PAGES = [
  {
    id:          'website_accommodations',
    label:       'Accommodations',
    icon:        '🏨',
    url:         '/accommodations',
    defaultTitle:       'Find the perfect place to stay in Siwa',
    defaultDescription: 'Search across eco-lodges, boutique hotels, heritage stays, camps, and desert retreats, then browse packages, offers, and discounts from each business.',
    defaultAccent:      '#92400e',
  },
  {
    id:          'website_activities',
    label:       'Activities',
    icon:        '🏄',
    url:         '/activities',
    defaultTitle:       'Experience the oasis your way',
    defaultDescription: 'Find desert adventures, cultural experiences, wellness activities, and memorable things to do using the full activity search criteria.',
    defaultAccent:      '#16a34a',
  },
  {
    id:          'website_restaurants',
    label:       'Restaurants',
    icon:        '🍽️',
    url:         '/restaurants',
    defaultTitle:       'Taste the flavours of Siwa Oasis',
    defaultDescription: 'Find authentic Siwan cuisine, international restaurants, desert cafes, and local dining experiences.',
    defaultAccent:      '#dc2626',
  },
  {
    id:          'website_food-beverage',
    label:       'Food & Beverage',
    icon:        '☕',
    url:         '/food-beverage',
    defaultTitle:       'Food & Beverage in Siwa',
    defaultDescription: 'Explore all food, drink, and dining options across the Siwa Oasis from street food to fine dining.',
    defaultAccent:      '#b45309',
  },
  {
    id:          'website_transportation',
    label:       'Transportation',
    icon:        '🚗',
    url:         '/transportation',
    defaultTitle:       'Get around Siwa Oasis',
    defaultDescription: 'Find 4x4 rentals, taxi services, transfers, and guided transport across the oasis.',
    defaultAccent:      '#2563eb',
  },
  {
    id:          'website_crafts-wellness',
    label:       'Crafts & Wellness',
    icon:        '🧘',
    url:         '/crafts-wellness',
    defaultTitle:       'Authentic Siwan Handicrafts & Healing Spas',
    defaultDescription: 'Discover handmade crafts, traditional artisans, wellness spas, and relaxation experiences rooted in Siwan heritage.',
    defaultAccent:      '#7c3aed',
  },
  {
    id:          'website_production-trade',
    label:       'Production & Trade',
    icon:        '🌿',
    url:         '/production-trade',
    defaultTitle:       'Siwa Production & Trade',
    defaultDescription: 'Explore local agricultural production, olive oil, dates, natural products, and trade opportunities in Siwa.',
    defaultAccent:      '#16a34a',
  },
];

type ConfigStatus = 'loading' | 'configured' | 'default';

export default function CategoryPagesAdmin() {
  const [statuses, setStatuses] = useState<Record<string, ConfigStatus>>({});
  const [seeding,  setSeeding]  = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check which category pages have a builder config
    const init: Record<string, ConfigStatus> = {};
    CATEGORY_PAGES.forEach(p => { init[p.id] = 'loading'; });
    setStatuses(init);

    CATEGORY_PAGES.forEach(async (page) => {
      try {
        const res = await fetch(`/api/jana/website?id=${page.id}`);
        if (!res.ok) { setStatuses(s => ({ ...s, [page.id]: 'default' })); return; }
        const data = await res.json();
        const config = Array.isArray(data) ? data[0] : data;
        const hasLayout = config && ['header_components','body_components','footer_components'].some(k => Array.isArray(config[k]));
        setStatuses(s => ({ ...s, [page.id]: hasLayout ? 'configured' : 'default' }));
      } catch {
        setStatuses(s => ({ ...s, [page.id]: 'default' }));
      }
    });
  }, []);

  // Seed a default config for a category page so admin can edit it
  async function seedConfig(page: typeof CATEGORY_PAGES[0]) {
    setSeeding(s => ({ ...s, [page.id]: true }));
    setMessages(m => ({ ...m, [page.id]: '' }));
    try {
      const res = await fetch('/api/jana/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: page.id,
          header_components: [],
          body_components:   [],
          footer_components: [],
          site_settings: {
            page_title:   page.defaultTitle,
            page_subtitle: page.defaultDescription,
            accent_color: page.defaultAccent,
          },
        }),
      });
      if (res.ok) {
        setStatuses(s => ({ ...s, [page.id]: 'configured' }));
        setMessages(m => ({ ...m, [page.id]: '✅ Config created! You can now edit this page.' }));
      } else {
        const err = await res.json();
        setMessages(m => ({ ...m, [page.id]: `❌ ${err.error || 'Failed to seed config'}` }));
      }
    } catch {
      setMessages(m => ({ ...m, [page.id]: '❌ Network error' }));
    } finally {
      setSeeding(s => ({ ...s, [page.id]: false }));
    }
  }

  async function seedAll() {
    for (const page of CATEGORY_PAGES) {
      if (statuses[page.id] !== 'configured') {
        await seedConfig(page);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
          <h1 className="text-xl font-bold">📱 Category Pages Manager</h1>
        </div>
        <button
          onClick={seedAll}
          className="px-4 py-2 bg-[#D4AF37] text-black font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          ⚡ Seed All Defaults
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-gray-400 text-sm mb-6">
          Each category page (Accommodations, Activities, etc.) uses hardcoded title/description as a fallback.
          To make a page fully editable by admin, click <strong className="text-white">Create Config</strong> to seed a DB record,
          then use <strong className="text-white">Open Editor</strong> to customise it with the page builder.
        </p>

        <div className="grid gap-4">
          {CATEGORY_PAGES.map(page => (
            <div key={page.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{page.icon}</span>
                <div>
                  <h3 className="font-bold text-white">{page.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{page.url}</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-md">“{page.defaultTitle}”</p>
                  {messages[page.id] && (
                    <p className="text-xs mt-1" style={{ color: messages[page.id].startsWith('✅') ? '#4ade80' : '#f87171' }}>
                      {messages[page.id]}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Status badge */}
                {statuses[page.id] === 'loading' && (
                  <span className="text-xs text-gray-500 animate-pulse">Checking…</span>
                )}
                {statuses[page.id] === 'configured' && (
                  <span className="text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-1 rounded-full font-bold">✅ Configured</span>
                )}
                {statuses[page.id] === 'default' && (
                  <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700 px-2 py-1 rounded-full font-bold">⚠️ Default (hardcoded)</span>
                )}

                {/* Seed button if not configured */}
                {statuses[page.id] === 'default' && (
                  <button
                    onClick={() => seedConfig(page)}
                    disabled={seeding[page.id]}
                    className="px-3 py-1.5 bg-[#556B2F] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {seeding[page.id] ? 'Creating…' : '+ Create Config'}
                  </button>
                )}

                {/* View public page */}
                <Link href={page.url} target="_blank" className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-600 transition-colors">
                  👁 Preview
                </Link>

                {/* Open in page builder */}
                <Link
                  href={`/admin/homepage-editor/${encodeURIComponent(page.id)}`}
                  className="px-3 py-1.5 bg-[#D4AF37] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  🏗️ Open Editor
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-xs text-gray-500">
          <strong className="text-gray-300">How it works:</strong> When a category page loads, it first checks for a saved builder config in the database.
          If one exists, the full page builder layout is used instead of the hardcoded fallback.
          Clicking “Create Config” seeds an empty config with the current default text so admin can start editing immediately.
        </div>
      </div>
    </div>
  );
}
