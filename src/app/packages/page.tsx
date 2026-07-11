'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

interface Package {
  id: string;
  business_slug: string;
  title: string;
  business_name: string;
  brief: string;
  description: string;
  image?: string | null;
  is_featured: boolean;
  price?: number | null;
  original_price?: number | null;
  discount?: string | null;
  valid_until?: string | null;
}

export default function PackagesPage() {
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/discovery/offers')
      .then(r => r.json())
      .then(j => { 
        if (j?.success && Array.isArray(j.offers)) {
          // Filter to show only items that are packages (e.g. type is package or has package-related title/description, or by default all if offers represent packages)
          // We can show all offers returned as packages since offers page also includes discounts.
          const packages = j.offers
            .filter((item: any) => item.type === 'package' || item.type === 'experience_package' || !item.type || item.type === 'special_offer')
            .map((item: any) => ({
              id: item.business_id || item.id,
              business_slug: item.business_slug || item.business_id,
              title: item.title || item.offer_title || '',
              business_name: item.business_name || '',
              brief: item.description ? (item.description.substring(0, 150) + '...') : '',
              description: item.description || '',
              image: item.image || item.offer_image || null,
              is_featured: !!item.is_featured,
              price: item.price ? parseFloat(item.price) : null,
              original_price: item.original_price ? parseFloat(item.original_price) : null,
              discount: item.discount || null,
              valid_until: item.valid_until || null,
            }));
          setItems(packages);
        }
      })
      .catch(e => console.error('Failed to fetch packages', e))
      .finally(() => setLoading(false));
  }, []);

  const visibleItems = items.filter(item => 
    !searchTerm || 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.business_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredItems = visibleItems.filter(i => i.is_featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              Curated Travel Packages
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Explore premium pre-designed packages and desert experiences crafted by local experts
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Featured Packages */}
        {!loading && featuredItems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="text-[#D4AF37]">⭐</span> Featured Packages
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/p/${pkg.business_slug}`}
                  className="bg-gradient-to-br from-[#556B2F] to-[#D4AF37] rounded-2xl p-[1px] hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all group block"
                >
                  {pkg.image && (
                    <img src={pkg.image} alt={pkg.title} className="w-full h-36 object-cover rounded-t-2xl" />
                  )}
                  <div className="bg-gray-900 rounded-2xl p-6 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">📦</span>
                        {pkg.price && (
                          <div className="text-right">
                            {pkg.original_price && <span className="text-xs text-gray-500 line-through block">${pkg.original_price}</span>}
                            <span className="text-[#D4AF37] font-black text-lg">${pkg.price}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-3 line-clamp-2">{pkg.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 mb-3">{pkg.business_name}</p>
                      <p className="text-xs text-gray-350 line-clamp-3 mb-4">{pkg.brief}</p>
                    </div>

                    <span className="w-full text-center py-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-xl text-white text-xs font-bold group-hover:opacity-90 transition-all mt-auto block">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8 flex flex-wrap gap-4 items-center bg-gray-900/60 p-5 rounded-2xl border border-gray-800">
          <input
            type="text"
            placeholder="Search packages by title or business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] transition-colors text-white"
          />
          <span className="text-xs text-gray-500 ml-auto">
            {visibleItems.length} package{visibleItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading packages...</p>
          </div>
        )}

        {/* All Packages */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((pkg) => (
              <div key={pkg.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-[#D4AF37]/60 transition-all group flex flex-col">
                {pkg.image ? (
                  <img src={pkg.image} alt={pkg.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-3xl">
                    📦
                  </div>
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">{pkg.business_name}</span>
                    {pkg.is_featured && <span className="text-[#D4AF37] text-xs">⭐</span>}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 line-clamp-2">{pkg.title}</h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-3 flex-grow">{pkg.brief}</p>

                  {pkg.price && (
                    <div className="mb-4 px-3 py-2 bg-yellow-950/40 border border-yellow-800/30 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-gray-400">Package Deal</span>
                      <div className="flex items-baseline gap-1.5">
                        {pkg.original_price && <span className="text-xs text-gray-500 line-through">${pkg.original_price}</span>}
                        <span className="text-[#D4AF37] font-black">${pkg.price}</span>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/p/${pkg.business_slug}`}
                    className="w-full py-2.5 bg-gray-800 group-hover:bg-gradient-to-r group-hover:from-[#556B2F] group-hover:to-[#D4AF37] rounded-xl text-white text-xs font-bold text-center block transition-all"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && visibleItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-400 text-lg">No packages found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
