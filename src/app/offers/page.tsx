'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Item {
  id: string;
  title: string;
  type: 'offer' | 'discount';
  business_name: string;
  brief: string;
  description: string;
  images?: string[];
  hero_images?: string[];
  is_featured: boolean;
}

export default function MainSiteOffersPage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both offers and discounts
        const [offersRes, discountsRes] = await Promise.all([
          fetch('/api/approved/offers'),
          fetch('/api/approved/discounts')
        ]);

        const offersData = await offersRes.json();
        const discountsData = await discountsRes.json();

        let combined: Item[] = [];
        
        if (offersData?.success && Array.isArray(offersData.items)) {
          combined.push(...offersData.items.map((item: any) => ({
            ...item,
            type: 'offer' as const
          })));
        }

        if (discountsData?.success && Array.isArray(discountsData.items)) {
          combined.push(...discountsData.items.map((item: any) => ({
            ...item,
            type: 'discount' as const
          })));
        }

        setItems(combined);
      } catch (e) {
        console.error('Failed to fetch offers/discounts', e);
      }
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'discount'>('all');

  const visibleItems = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const featuredItems = visibleItems.filter((o) => o.is_featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              Offers & Discounts
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Discover special offers and promotions from top businesses in Siwa Oasis
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Deals */}
        {featuredItems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="text-[#D4AF37]">⭐</span> Featured Deals
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-[#556B2F] to-[#D4AF37] rounded-lg p-1 hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all group"
                >
                  {item.hero_images?.[0] && (
                    <img src={item.hero_images[0]} alt={item.title} className="w-full h-32 object-cover rounded" />
                  )}
                  <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-2xl">{item.type === 'offer' ? '🎁' : '🏷️'}</span>
                        <h3 className="text-lg font-bold text-white mt-2">{item.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{item.business_name}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 mb-4 flex-grow">{item.brief}</p>

                    <button className="w-full px-4 py-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded text-white font-semibold hover:opacity-90 transition-opacity">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-8">
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search offers & discounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All</option>
              <option value="offer">Offers Only</option>
              <option value="discount">Discounts Only</option>
            </select>

            <label className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white cursor-pointer hover:border-[#D4AF37] transition-colors">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    // Show only featured
                    setFilterType('all');
                  }
                }}
                className="w-4 h-4 accent-[#D4AF37]"
              />
              <span className="text-sm font-semibold">⭐ Featured Only</span>
            </label>
          </div>

          <div className="text-gray-400 text-sm">
            Showing {visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* All Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-[#D4AF37] transition-colors group">
              {item.hero_images?.[0] && (
                <img src={item.hero_images[0]} alt={item.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{item.type === 'offer' ? '🎁' : '🏷️'}</span>
                  {item.is_featured && <span className="text-[#D4AF37] text-sm font-bold">⭐ Featured</span>}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{item.business_name}</p>
                <p className="text-gray-300 text-sm mb-4">{item.brief}</p>

                {item.images && item.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {item.images.slice(0, 3).map((u: string, i: number) => (
                      <img key={i} src={u} alt={`img-${i}`} className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}

                <button className="w-full px-4 py-2 bg-[#556B2F] rounded text-white font-semibold hover:opacity-90 transition-opacity group-hover:bg-[#D4AF37] group-hover:text-black">
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>

        {visibleItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">No offers or discounts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
