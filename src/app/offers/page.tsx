'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Item {
  id: string;
  business_slug: string;
  title: string;
  type: 'offer' | 'discount';
  business_name: string;
  brief: string;
  description: string;
  image?: string | null;
  is_featured: boolean;
  // offer fields
  price?: number | null;
  original_price?: number | null;
  discount_pct?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  offer_type?: string;
  // discount fields
  discount_value?: string | null;
  discount_type?: string | null;
  promo_code?: string | null;
  season?: string | null;
  discount_status?: string;
}

export default function MainSiteOffersPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'discount'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [offersRes, discountsRes] = await Promise.all([
          fetch('/api/discovery/offers'),
          fetch('/api/discovery/discounts')
        ]);
        const offersData = await offersRes.json();
        const discountsData = await discountsRes.json();

        let combined: Item[] = [];

        // Map offers (supports both new slot structure and legacy)
        const offerSource = offersData?.offers || offersData?.items || [];
        combined.push(...offerSource.map((item: any) => ({
          id: item.business_id || item.id,
          business_slug: item.business_slug || item.business_id || item.id,
          title: item.title || item.offer_title || '',
          business_name: item.business_name || '',
          brief: (item.description || '').substring(0, 140),
          description: item.description || '',
          image: item.image || item.offer_image || null,
          is_featured: !!item.is_featured,
          type: 'offer' as const,
          price: item.price ? parseFloat(item.price) : null,
          original_price: item.original_price ? parseFloat(item.original_price) : null,
          discount_pct: item.discount || null,
          valid_from: item.valid_from || null,
          valid_until: item.valid_until || null,
          offer_type: item.type || item.offer_type || 'special_offer',
        })));

        // Map discounts
        const discountSource = discountsData?.items || discountsData?.discounts || [];
        combined.push(...discountSource.map((item: any) => ({
          id: `${item.business_id}-disc-${item.slot || 1}`,
          business_slug: item.business_slug || item.business_id || item.id,
          title: item.discount_name || '',
          business_name: item.business_name || '',
          brief: item.description ? item.description.substring(0, 140) : `${item.discount_value || ''}${item.discount_type === 'percent' ? '% off' : ' off'}`,
          description: item.description || '',
          image: null,
          is_featured: !!item.is_featured,
          type: 'discount' as const,
          discount_value: item.discount_value || null,
          discount_type: item.discount_type || null,
          promo_code: item.promo_code || null,
          season: item.season || null,
          valid_from: item.valid_from || null,
          valid_until: item.valid_until || null,
          discount_status: item.discount_status || 'active',
        })));

        setItems(combined);
      } catch (e) {
        console.error('Failed to fetch offers/discounts', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const visibleItems = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (featuredOnly && !item.is_featured) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && !item.business_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const featuredItems = items.filter(o => o.is_featured).slice(0, 3);

  function formatDate(d: string | null | undefined) {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              Offers &amp; Discounts
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Discover special deals and exclusive promotions from businesses across Siwa Oasis
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Featured Deals */}
        {!loading && featuredItems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="text-[#D4AF37]">⭐</span> Featured Deals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/p/${item.business_slug}`}
                  className="bg-gradient-to-br from-[#556B2F] to-[#D4AF37] rounded-2xl p-[1px] hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all group block"
                >
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-full h-36 object-cover rounded-t-2xl" />
                  )}
                  <div className="bg-gray-900 rounded-2xl p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xl">{item.type === 'offer' ? '🎁' : '🏷️'}</span>
                        <h3 className="text-base font-bold text-white mt-2 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{item.business_name}</p>
                      </div>
                      {item.type === 'offer' && item.discount_pct && (
                        <span className="bg-[#D4AF37] text-black text-xs font-black px-2 py-1 rounded-lg shrink-0">{item.discount_pct}% OFF</span>
                      )}
                      {item.type === 'discount' && item.discount_value && (
                        <span className="bg-green-500 text-white text-xs font-black px-2 py-1 rounded-lg shrink-0">
                          {item.discount_value}{item.discount_type === 'percent' ? '% OFF' : ' OFF'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 mb-3 flex-grow line-clamp-2">{item.brief}</p>
                    {item.promo_code && (
                      <div className="mb-3 px-3 py-1.5 bg-gray-800 border border-dashed border-[#D4AF37] rounded-lg text-center">
                        <span className="text-[10px] text-gray-400 block">PROMO CODE</span>
                        <span className="text-[#D4AF37] font-black tracking-widest text-sm">{item.promo_code}</span>
                      </div>
                    )}
                    {item.valid_until && (
                      <p className="text-[10px] text-gray-500 mb-3">Valid until: {formatDate(item.valid_until)}</p>
                    )}
                    <span className="w-full text-center py-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-xl text-white text-xs font-bold group-hover:opacity-90 transition-opacity mt-auto block">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-8 flex flex-wrap gap-4 items-center bg-gray-900/60 p-5 rounded-2xl border border-gray-800">
          <input
            type="text"
            placeholder="Search offers &amp; discounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Types</option>
            <option value="offer">Offers &amp; Packages</option>
            <option value="discount">Discounts &amp; Promos</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={featuredOnly} onChange={e => setFeaturedOnly(e.target.checked)} className="w-4 h-4 accent-[#D4AF37]" />
            <span className="text-sm font-semibold text-gray-300">⭐ Featured only</span>
          </label>
          <span className="text-xs text-gray-500 ml-auto">{visibleItems.length} result{visibleItems.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading deals...</p>
          </div>
        )}

        {/* All Items Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-[#D4AF37]/60 transition-all group flex flex-col">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-4xl">
                    {item.type === 'offer' ? '🎁' : '🏷️'}
                  </div>
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
                      {item.type === 'offer' ? (item.offer_type || 'Special Offer') : (item.discount_type === 'percent' ? 'Percentage Discount' : item.discount_type === 'seasonal' ? 'Seasonal Deal' : 'Discount')}
                    </span>
                    {item.is_featured && <span className="text-[#D4AF37] text-xs font-bold">⭐</span>}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{item.business_name}</p>
                  {item.brief && <p className="text-xs text-gray-300 mb-3 line-clamp-3 flex-grow">{item.brief}</p>}

                  {/* Discount value badge */}
                  {item.type === 'discount' && item.discount_value && (
                    <div className="mb-3 px-3 py-2 bg-green-950/60 border border-green-800/50 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-green-400">Discount</span>
                      <span className="text-green-400 font-black">{item.discount_value}{item.discount_type === 'percent' ? '%' : ''} OFF</span>
                    </div>
                  )}
                  {item.type === 'offer' && item.price && (
                    <div className="mb-3 px-3 py-2 bg-yellow-950/40 border border-yellow-800/30 rounded-xl flex items-center justify-between">
                      {item.original_price && <span className="text-xs text-gray-500 line-through">${item.original_price}</span>}
                      <span className="text-[#D4AF37] font-black">${item.price}</span>
                    </div>
                  )}

                  {/* Promo code */}
                  {item.promo_code && (
                    <div className="mb-3 px-3 py-1.5 bg-gray-800 border border-dashed border-[#D4AF37]/60 rounded-lg text-center">
                      <span className="text-[10px] text-gray-400 block">PROMO CODE</span>
                      <span className="text-[#D4AF37] font-black tracking-widest text-sm">{item.promo_code}</span>
                    </div>
                  )}

                  {/* Season tag */}
                  {item.season && item.season !== 'all_year' && (
                    <p className="text-[10px] text-gray-500 mb-2 capitalize">📅 {item.season.replace('_', ' ')} season</p>
                  )}
                  {item.valid_until && (
                    <p className="text-[10px] text-gray-500 mb-3">Expires: {formatDate(item.valid_until)}</p>
                  )}

                  <Link
                    href={`/p/${item.business_slug}`}
                    className="mt-auto w-full px-4 py-2.5 bg-gray-800 group-hover:bg-gradient-to-r group-hover:from-[#556B2F] group-hover:to-[#D4AF37] rounded-xl text-white text-xs font-bold transition-all text-center block"
                  >
                    View on Minisite →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && visibleItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg mb-2">No offers or discounts found</p>
            <p className="text-gray-600 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
