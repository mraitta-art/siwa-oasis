'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface CategoryPageItem {
  id: string;
  pageKey: string;
  label: string;
  icon: string;
  url: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultAccent: string;
  defaultParents: string[];
}

interface ParentTypeOption {
  id: string;
  name: string;
  icon?: string;
}

const CATEGORY_PAGES: CategoryPageItem[] = [
  {
    id:          'website_siwa-products',
    pageKey:     'siwa-products',
    label:       'Siwa Products (Brand Sector)',
    icon:        '🛍️',
    url:         '/siwa-products',
    defaultTitle:       'Discover products grown and made in Siwa',
    defaultDescription: 'Shop local food, dates, olive products, crafts, handmade goods, and products from Siwa producers.',
    defaultAccent:      '#9b6832',
    defaultParents:     ['food', 'crafts', 'agriculture_industry'],
  },
  {
    id:          'website_siwa-stay',
    pageKey:     'siwa-stay',
    label:       'Siwa Stay (Brand Sector)',
    icon:        '🛌',
    url:         '/siwa-stay',
    defaultTitle:       'Find your stay in Siwa Oasis',
    defaultDescription: 'Explore hotels, eco-lodges, camps, retreats, and accommodation offers from Siwify and local providers.',
    defaultAccent:      '#287a55',
    defaultParents:     ['accommodation'],
  },
  {
    id:          'website_siwa-go',
    pageKey:     'siwa-go',
    label:       'Siwa Go (Brand Sector)',
    icon:        '🧭',
    url:         '/siwa-go',
    defaultTitle:       'Move and explore Siwa Oasis',
    defaultDescription: 'Plan the journey, book transport, and discover tours, activities, and local guides across Siwa.',
    defaultAccent:      '#287a55',
    defaultParents:     ['adventure', 'logistics'],
  },
  {
    id:          'website_siwa-retreats',
    pageKey:     'siwa-retreats',
    label:       'Siwa Retreats (Brand Sector)',
    icon:        '🧖',
    url:         '/siwa-retreats',
    defaultTitle:       'Rest and restore in Siwa',
    defaultDescription: 'Explore wellness stays, salt lakes, hot springs, sand baths, spas, and restorative retreats.',
    defaultAccent:      '#58765a',
    defaultParents:     ['wellness'],
  },
  {
    id:          'website_siwa-society',
    pageKey:     'siwa-society',
    label:       'Siwa Society (Brand Sector)',
    icon:        '👥',
    url:         '/siwa-society',
    defaultTitle:       'Meet the people and culture of Siwa',
    defaultDescription: 'Discover cultural organizations, community events, educators, creators, and local professional services.',
    defaultAccent:      '#64776b',
    defaultParents:     ['arts_culture', 'education_research', 'events_entertainment', 'media_content', 'services_professional'],
  },
  {
    id:          'website_siwa-invest',
    pageKey:     'siwa-invest',
    label:       'Siwa Invest (Brand Sector)',
    icon:        '📈',
    url:         '/siwa-invest',
    defaultTitle:       'Invest in Siwa Oasis',
    defaultDescription: 'Explore approved investments and partnerships from Siwify and businesses across Siwa.',
    defaultAccent:      '#98713a',
    defaultParents:     ['investment_parent'],
  },
  {
    id:          'website_accommodations',
    pageKey:     'accommodations',
    label:       'Accommodations',
    icon:        '🏨',
    url:         '/accommodations',
    defaultTitle:       'Find the perfect place to stay in Siwa',
    defaultDescription: 'Search across eco-lodges, boutique hotels, heritage stays, camps, and desert retreats, then browse packages, offers, and discounts from each business.',
    defaultAccent:      '#92400e',
    defaultParents:     ['accommodation'],
  },
  {
    id:          'website_activities',
    pageKey:     'activities',
    label:       'Activities',
    icon:        '🏄',
    url:         '/activities',
    defaultTitle:       'Experience the oasis your way',
    defaultDescription: 'Find desert adventures, cultural experiences, wellness activities, and memorable things to do using the full activity search criteria.',
    defaultAccent:      '#16a34a',
    defaultParents:     ['adventure'],
  },
  {
    id:          'website_restaurants',
    pageKey:     'restaurants',
    label:       'Restaurants',
    icon:        '🍽️',
    url:         '/restaurants',
    defaultTitle:       'Taste the flavours of Siwa Oasis',
    defaultDescription: 'Find authentic Siwan cuisine, international restaurants, desert cafes, and local dining experiences.',
    defaultAccent:      '#dc2626',
    defaultParents:     ['food'],
  },
  {
    id:          'website_food-beverage',
    pageKey:     'food-beverage',
    label:       'Food & Beverage',
    icon:        '☕',
    url:         '/food-beverage',
    defaultTitle:       'Food & Beverage in Siwa',
    defaultDescription: 'Explore all food, drink, and dining options across the Siwa Oasis from street food to fine dining.',
    defaultAccent:      '#b45309',
    defaultParents:     ['food'],
  },
  {
    id:          'website_transportation',
    pageKey:     'transportation',
    label:       'Transportation',
    icon:        '🚗',
    url:         '/transportation',
    defaultTitle:       'Get around Siwa Oasis',
    defaultDescription: 'Find 4x4 rentals, taxi services, transfers, and guided transport across the oasis.',
    defaultAccent:      '#2563eb',
    defaultParents:     ['logistics'],
  },
  {
    id:          'website_crafts-wellness',
    pageKey:     'crafts-wellness',
    label:       'Crafts & Wellness',
    icon:        '🧘',
    url:         '/crafts-wellness',
    defaultTitle:       'Authentic Siwan Handicrafts & Healing Spas',
    defaultDescription: 'Discover handmade crafts, traditional artisans, wellness spas, and relaxation experiences rooted in Siwan heritage.',
    defaultAccent:      '#7c3aed',
    defaultParents:     ['crafts', 'wellness'],
  },
  {
    id:          'website_production-trade',
    pageKey:     'production-trade',
    label:       'Production & Trade',
    icon:        '🌿',
    url:         '/production-trade',
    defaultTitle:       'Siwa Production & Trade',
    defaultDescription: 'Explore local agricultural production, olive oil, dates, natural products, and trade opportunities in Siwa.',
    defaultAccent:      '#16a34a',
    defaultParents:     ['agriculture_industry'],
  },
];

type ConfigStatus = 'loading' | 'configured' | 'default';

export default function CategoryPagesAdmin() {
  const [statuses, setStatuses] = useState<Record<string, ConfigStatus>>({});
  const [seeding,  setSeeding]  = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  
  // Parent visibility configuration
  const [parentTypes, setParentTypes] = useState<ParentTypeOption[]>([]);
  const [pageVisibilities, setPageVisibilities] = useState<Record<string, string[]>>({});
  const [savingVisibility, setSavingVisibility] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'visibility' | 'builder'>('visibility');

  useEffect(() => {
    // 1. Check which category pages have a builder config
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

    // 2. Load all available parent business types
    fetch('/api/business-types?is_parent=true')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setParentTypes(data.map(item => ({ id: item.id, name: item.name, icon: item.icon })));
        }
      })
      .catch(() => {});

    // 3. Load saved parent category visibility rules
    fetch('/api/category-parent-visibility')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.config) {
          setPageVisibilities(data.config);
        } else {
          // Initialize with default parents
          const defaults: Record<string, string[]> = {};
          CATEGORY_PAGES.forEach(p => {
            defaults[p.pageKey] = p.defaultParents;
          });
          setPageVisibilities(defaults);
        }
      })
      .catch(() => {});
  }, []);

  // Save selected parent categories for a page
  async function saveVisibility(pageKey: string, parentsToSave: string[]) {
    setSavingVisibility(s => ({ ...s, [pageKey]: true }));
    try {
      const res = await fetch('/api/admin/category-parent-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageKey,
          visible_parents: parentsToSave,
        }),
      });

      if (res.ok) {
        setMessages(m => ({ ...m, [pageKey]: '✅ Parent visibility updated! Child types will reflect this immediately.' }));
        setTimeout(() => setMessages(m => ({ ...m, [pageKey]: '' })), 4000);
      } else {
        const err = await res.json();
        setMessages(m => ({ ...m, [pageKey]: `❌ ${err.error || 'Failed to save visibility'}` }));
      }
    } catch {
      setMessages(m => ({ ...m, [pageKey]: '❌ Network error saving visibility' }));
    } finally {
      setSavingVisibility(s => ({ ...s, [pageKey]: false }));
    }
  }

  function toggleParentCategory(pageKey: string, parentId: string) {
    const current = pageVisibilities[pageKey] || CATEGORY_PAGES.find(p => p.pageKey === pageKey)?.defaultParents || [];
    const updated = current.includes(parentId)
      ? current.filter(id => id !== parentId)
      : [...current, parentId];
    
    setPageVisibilities(prev => ({
      ...prev,
      [pageKey]: updated,
    }));
  }

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
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm font-bold">← Admin</Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span>📱</span> Category Pages &amp; Parent Visibility Manager
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Control which parent categories (and their child types) are available on each portal or marketplace page
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('visibility')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'visibility' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🎯 Parent Category Filter
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'builder' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🏗️ Page Builder Layouts
            </button>
          </div>
          <button
            onClick={seedAll}
            className="px-4 py-2 bg-slate-800 border border-gray-700 text-gray-200 font-bold text-xs rounded-lg hover:bg-slate-700 transition"
          >
            ⚡ Seed All Defaults
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-950/40 via-gray-900 to-gray-900 border border-amber-800/40 rounded-2xl flex items-start gap-4">
          <span className="text-2xl mt-0.5">💡</span>
          <div>
            <h3 className="text-sm font-bold text-amber-300">
              Parent-Child Category Governance for Sector Pages
            </h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              For pages like <strong>/siwa-products</strong>, only relevant product parent categories (e.g. <em>Food &amp; Beverage</em>, <em>Trade &amp; Crafts</em>, <em>Agriculture &amp; Production</em>) and their child types should be selectable. 
              Use the checkboxes below to select which parent categories show up on each page. The child dropdown will strictly filter per the selected parents.
            </p>
          </div>
        </div>

        {/* Visibility View */}
        {activeTab === 'visibility' && (
          <div className="space-y-6">
            {CATEGORY_PAGES.map(page => {
              const currentAllowed = pageVisibilities[page.pageKey] || page.defaultParents;
              const isSaving = Boolean(savingVisibility[page.pageKey]);

              return (
                <div key={page.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 bg-gray-800/80 rounded-xl">{page.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white">{page.label}</h2>
                          <code className="text-xs text-amber-400 bg-amber-950/50 border border-amber-900 px-2 py-0.5 rounded font-mono">
                            {page.url}
                          </code>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 max-w-xl">
                          {page.defaultDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={page.url}
                        target="_blank"
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition"
                      >
                        👁️ Preview Live
                      </Link>
                      <button
                        onClick={() => saveVisibility(page.pageKey, currentAllowed)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : '💾 Save Parent Visibility'}
                      </button>
                    </div>
                  </div>

                  {messages[page.pageKey] && (
                    <div className="mt-3 text-xs font-bold" style={{ color: messages[page.pageKey].startsWith('✅') ? '#4ade80' : '#f87171' }}>
                      {messages[page.pageKey]}
                    </div>
                  )}

                  {/* Parent categories checkboxes */}
                  <div className="mt-5">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-3">
                      Select Allowed Parent Categories for this page:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {parentTypes.map(parent => {
                        const isChecked = currentAllowed.includes(parent.id.toLowerCase());
                        return (
                          <label
                            key={parent.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                              isChecked
                                ? 'bg-amber-950/20 border-amber-600/60 text-amber-200'
                                : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleParentCategory(page.pageKey, parent.id.toLowerCase())}
                              className="rounded border-gray-700 text-[#D4AF37] focus:ring-amber-500 w-4 h-4 bg-gray-900"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate">{parent.name}</span>
                              <span className="text-[10px] text-gray-500 font-mono block">{parent.id}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {parentTypes.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">Loading parent categories...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Builder View */}
        {activeTab === 'builder' && (
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
                  {statuses[page.id] === 'loading' && (
                    <span className="text-xs text-gray-500 animate-pulse">Checking…</span>
                  )}
                  {statuses[page.id] === 'configured' && (
                    <span className="text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-1 rounded-full font-bold">✅ Configured</span>
                  )}
                  {statuses[page.id] === 'default' && (
                    <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700 px-2 py-1 rounded-full font-bold">⚠️ Default (hardcoded)</span>
                  )}

                  {statuses[page.id] === 'default' && (
                    <button
                      onClick={() => seedConfig(page)}
                      disabled={seeding[page.id]}
                      className="px-3 py-1.5 bg-[#556B2F] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {seeding[page.id] ? 'Creating…' : '+ Create Config'}
                    </button>
                  )}

                  <Link href={page.url} target="_blank" className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-600 transition-colors">
                    👁 Preview
                  </Link>

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
        )}

      </div>
    </div>
  );
}
