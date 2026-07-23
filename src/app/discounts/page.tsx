'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import MarketplaceHeader from '@/components/MarketplaceHeader';

interface DiscountItem {
  id: string;
  business_slug: string;
  title: string;
  business_name: string;
  brief: string;
  description: string;
  discount_value: string | null;
  discount_type: string | null;
  applies_to: string | null;
  min_group_size: number | null;
  season: string | null;
  valid_from: string | null;
  valid_until: string | null;
  promo_code: string | null;
  discount_status: string;
  is_featured: boolean;
  slot: number;
}

const SEASON_ICONS: Record<string, string> = {
  winter: '❄️', summer: '☀️', spring: '🌸', autumn: '🍂', all_year: '📅', ramadan: '🌙', holiday: '🎉',
};

export default function DiscountsPage() {
  const [items, setItems] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetch('/api/discovery/discounts')
      .then(r => r.json())
      .then(j => {
        const source = j?.items || j?.discounts || [];
        setItems(source.map((item: any) => ({
          id: `${item.business_id}-slot-${item.slot || 1}`,
          business_slug: item.business_slug || item.business_id,
          title: item.discount_name || '',
          business_name: item.business_name || '',
          brief: item.description
            ? item.description.substring(0, 140)
            : `${item.discount_value || ''}${item.discount_type === 'percent' ? '% off' : item.discount_type === 'fixed_amount' ? ' off' : ''} — ${item.season?.replace('_', ' ') || 'All year'}`,
          description: item.description || '',
          discount_value: item.discount_value || null,
          discount_type: item.discount_type || null,
          applies_to: item.applies_to || null,
          min_group_size: item.min_group_size ? parseInt(item.min_group_size) : null,
          season: item.season || null,
          valid_from: item.valid_from || null,
          valid_until: item.valid_until || null,
          promo_code: item.promo_code || null,
          discount_status: item.discount_status || 'active',
          is_featured: !!item.is_featured,
          slot: item.slot || 1,
        })));
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const allSeasons = [...new Set(items.map(i => i.season).filter(Boolean))];
  const allTypes = [...new Set(items.map(i => i.discount_type).filter(Boolean))];

  const visible = items.filter(item => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.business_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (seasonFilter && item.season !== seasonFilter) return false;
    if (typeFilter && item.discount_type !== typeFilter) return false;
    return true;
  });

  const featured = visible.filter(i => i.is_featured);
  const regular = visible.filter(i => !i.is_featured);

  function fmtDate(d: string | null) {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); } catch { return d; }
  }

  function DiscountCard({ item }: { item: DiscountItem }) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-[#D4AF37]/60 transition-all group flex flex-col h-full">
        {/* Colored header bar */}
        <div className="h-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37]" />
        <div className="p-5 flex flex-col flex-grow">
          {/* Season + Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{SEASON_ICONS[item.season || 'all_year'] || '📅'}</span>
              <span className="text-[10px] text-gray-500 capitalize font-semibold">{(item.season || 'all_year').replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.is_featured && <span className="text-[#D4AF37] text-xs">⭐</span>}
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.discount_status === 'active' ? 'bg-green-900/60 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                {item.discount_status?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Business name */}
          <p className="text-[10px] text-[#D4AF37] font-black tracking-widest mb-1 uppercase">{item.business_name}</p>

          {/* Title */}
          <h3 className="text-base font-bold text-white mb-2 line-clamp-2">{item.title}</h3>

          {/* Discount badge */}
          {item.discount_value && (
            <div className="mb-3 px-3 py-2.5 bg-green-950/50 border border-green-800/40 rounded-xl flex items-center justify-between">
              <span className="text-xs text-green-400">You save</span>
              <span className="text-green-400 font-black text-lg">
                {item.discount_value}{item.discount_type === 'percent' ? '%' : item.discount_type === 'fixed_amount' ? ' EGP' : ''} OFF
              </span>
            </div>
          )}

          {/* Applies to */}
          {item.applies_to && item.applies_to !== 'all_services' && (
            <p className="text-[10px] text-gray-500 mb-2">Applies to: <span className="text-gray-400 capitalize">{item.applies_to.replace('_', ' ')}</span></p>
          )}

          {/* Min group */}
          {item.min_group_size && item.min_group_size > 1 && (
            <p className="text-[10px] text-blue-400 mb-2">👥 Group of {item.min_group_size}+ required</p>
          )}

          {/* Brief */}
          {item.brief && <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-grow">{item.brief}</p>}

          {/* Promo code */}
          {item.promo_code && (
            <div className="mb-3 px-3 py-2 bg-gray-800 border border-dashed border-[#D4AF37]/60 rounded-xl text-center">
              <span className="text-[10px] text-gray-400 block mb-0.5">PROMO CODE</span>
              <span className="text-[#D4AF37] font-black tracking-widest">{item.promo_code}</span>
            </div>
          )}

          {/* Validity */}
          {(item.valid_from || item.valid_until) && (
            <p className="text-[10px] text-gray-500 mb-3">
              {item.valid_from ? `From ${fmtDate(item.valid_from)} ` : ''}
              {item.valid_until ? `until ${fmtDate(item.valid_until)}` : ''}
            </p>
          )}

          <Link
            href={`/p/${item.business_slug}`}
            className="mt-auto w-full py-2.5 bg-gray-800 group-hover:bg-gradient-to-r group-hover:from-[#556B2F] group-hover:to-[#D4AF37] rounded-xl text-white text-xs font-bold text-center block transition-all"
          >
            View Minisite →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white">
      <MarketplaceHeader title="Discounts" adminPath="/admin/discounts" activePath="/discounts" />

      {/* Hero */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">🏷️ Special Discounts</span>
          </h1>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Save more with seasonal deals, group discounts, and exclusive promotions from businesses across Siwa Oasis
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/admin/discounts" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition">
              🔧 Moderate discounts
            </a>
            <a href="/offers" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10 transition">
              🎁 Browse offers
            </a>
            <a href="/packages" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10 transition">
              📦 Browse packages
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Filters */}
        <div className="mb-10 flex flex-wrap gap-3 items-center bg-gray-900/60 p-5 rounded-2xl border border-gray-800">
          <input
            type="text" placeholder="Search discounts..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-44 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37]"
          />
          {allSeasons.length > 0 && (
            <select value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none">
              <option value="">All Seasons</option>
              {allSeasons.map(s => <option key={s} value={s!} className="capitalize">{(s || '').replace('_', ' ')}</option>)}
            </select>
          )}
          {allTypes.length > 0 && (
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none">
              <option value="">All Types</option>
              {allTypes.map(t => <option key={t} value={t!} className="capitalize">{(t || '').replace('_', ' ')}</option>)}
            </select>
          )}
          <span className="text-xs text-gray-500 ml-auto">{visible.length} discount{visible.length !== 1 ? 's' : ''}</span>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading discounts...</p>
          </div>
        )}

        {/* Featured */}
        {!loading && featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="text-[#D4AF37]">⭐</span> Featured Deals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(item => <DiscountCard key={item.id} item={item} />)}
            </div>
          </div>
        )}

        {/* Regular */}
        {!loading && regular.length > 0 && (
          <div>
            {featured.length > 0 && <h2 className="text-xl font-bold mb-6 text-gray-300">All Discounts</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regular.map(item => <DiscountCard key={item.id} item={item} />)}
            </div>
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400">No discounts found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
