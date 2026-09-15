'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import MarketplaceHeader from '@/components/MarketplaceHeader';

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
          const packages = j.offers
            .filter((item: any) => item.type === 'package' || item.type === 'experience_package' || item.source?.startsWith('package_') || item.source === 'experience_packages_db')
            .map((item: any) => ({
              id: item.business_id || item.id,
              business_slug: item.business_slug || item.business_id,
              title: item.title || item.offer_title || '',
              business_name: item.business_name || '',
              brief: item.description ? item.description.substring(0, 150) + '...' : '',
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

  function formatDate(d: string | null | undefined) {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf8,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-800">
      <MarketplaceHeader title="Packages" adminPath="/admin/packages" activePath="/packages" />

      <div className="page-shell py-10 sm:py-14 lg:py-16">
        <div className="premium-surface p-6 sm:p-8 lg:p-10">
          <div className="page-header mb-8 border-none pb-0">
            <p className="premium-kicker text-[10px] text-[#a87c00]">Curated experiences</p>
            <h1 className="page-title mt-3">Curated Travel Packages</h1>
            <p className="page-subtitle">
              Explore premium pre-designed packages and desert experiences crafted by local experts across Siwa Oasis.
            </p>
            <div className="gold-divider" />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="/admin/packages" className="premium-button">🔧 Moderate packages</a>
              <a href="/offers" className="secondary-button">🎁 Browse offers</a>
              <a href="/discounts" className="secondary-button">🏷️ Browse discounts</a>
            </div>
          </div>

          {!loading && featuredItems.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-black text-slate-900">Featured Packages</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {featuredItems.map((pkg) => (
                  <Link key={pkg.id} href={`/p/${pkg.business_slug}`} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(212,175,55,0.15)]">
                    {pkg.image ? (
                      <img src={pkg.image} alt={pkg.title} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#fef3c7] via-[#f5d56a]/20 to-[#e2e8f0] text-4xl">📦</div>
                    )}
                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <span className="text-2xl">📦</span>
                        {pkg.price && (
                          <div className="text-right">
                            {pkg.original_price && <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 line-through">${pkg.original_price}</span>}
                            <span className="text-xl font-black text-[#a87c00]">${pkg.price}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{pkg.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{pkg.business_name}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{pkg.brief}</p>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        {pkg.valid_until && <span>Valid {formatDate(pkg.valid_until)}</span>}
                        <span className="text-[#a87c00]">View details →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <input
              type="text"
              placeholder="Search packages by title or business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37]"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {visibleItems.length} package{visibleItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent" />
              <p className="text-slate-500">Loading packages...</p>
            </div>
          )}

          {!loading && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((pkg) => (
                <div key={pkg.id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.04)] transition hover:border-[#f5d56a] hover:shadow-[0_20px_38px_rgba(212,175,55,0.12)]">
                  {pkg.image ? (
                    <img src={pkg.image} alt={pkg.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#fef3c7] via-[#f5d56a]/20 to-[#e2e8f0] text-4xl">📦</div>
                  )}

                  <div className="p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{pkg.business_name}</span>
                      {pkg.is_featured && <span className="text-[#a87c00]">⭐</span>}
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{pkg.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{pkg.brief}</p>

                    {pkg.price && (
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Package Deal</span>
                        <div className="flex items-baseline gap-2">
                          {pkg.original_price && <span className="text-[10px] text-slate-400 line-through">${pkg.original_price}</span>}
                          <span className="text-lg font-black text-[#a87c00]">${pkg.price}</span>
                        </div>
                      </div>
                    )}

                    <Link href={`/p/${pkg.business_slug}`} className="premium-button mt-5 w-full">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && visibleItems.length === 0 && (
            <div className="premium-surface py-16 text-center">
              <div className="text-4xl">📦</div>
              <p className="mt-4 text-xl font-black text-slate-800">No packages found</p>
              <p className="mt-2 text-slate-500">Try another search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
