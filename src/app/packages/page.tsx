'use client';

import React from 'react';

interface Package {
  id: string;
  title: string;
  business_name: string;
  brief: string;
  description: string;
  images?: string[];
  hero_images?: string[];
  is_featured: boolean;
}

export default function PackagesPage() {
  const [items, setItems] = React.useState<Package[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    fetch('/api/approved/packages')
      .then(r => r.json())
      .then(j => { 
        if (j?.success && Array.isArray(j.items)) {
          setItems(j.items);
        }
      })
      .catch(e => console.error('Failed to fetch packages', e));
  }, []);

  const visibleItems = items.filter(item => 
    !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredItems = visibleItems.filter(i => i.is_featured).slice(0, 3);

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
              Curated Travel Packages
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Explore pre-designed packages crafted by our expert vendors
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Packages */}
        {featuredItems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="text-[#D4AF37]">⭐</span> Featured Packages
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-gradient-to-br from-[#556B2F] to-[#D4AF37] rounded-lg p-1 hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all group"
                >
                  {pkg.hero_images?.[0] && (
                    <img src={pkg.hero_images[0]} alt={pkg.title} className="w-full h-32 object-cover rounded-t" />
                  )}
                  <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-3xl">📦</span>
                        <h3 className="text-lg font-bold text-white mt-2">{pkg.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{pkg.business_name}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 mb-4 flex-grow">{pkg.brief}</p>

                    <button className="w-full px-4 py-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded text-white font-semibold hover:opacity-90 transition-opacity">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
          <div className="text-gray-400 text-sm mt-2">
            Showing {visibleItems.length} package{visibleItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* All Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((pkg) => (
            <div key={pkg.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-[#D4AF37] transition-colors group">
              {pkg.hero_images?.[0] && (
                <img src={pkg.hero_images[0]} alt={pkg.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📦</span>
                  {pkg.is_featured && <span className="text-[#D4AF37] text-sm font-bold">⭐ Featured</span>}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{pkg.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{pkg.business_name}</p>
                <p className="text-gray-300 text-sm mb-4">{pkg.brief}</p>

                {pkg.images && pkg.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {pkg.images.slice(0, 3).map((u: string, i: number) => (
                      <img key={i} src={u} alt={`img-${i}`} className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}

                <button className="w-full px-4 py-2 bg-[#556B2F] rounded text-white font-semibold hover:opacity-90 transition-opacity group-hover:bg-[#D4AF37] group-hover:text-black">
                  Explore →
                </button>
              </div>
            </div>
          ))}
        </div>

        {visibleItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-400 text-lg">No packages available at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
