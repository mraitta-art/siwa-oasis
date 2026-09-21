'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

interface Item {
  id: string;
  business_slug: string;
  title: string;
  type: string;
  category: 'offer' | 'package' | 'discount';
  business_name: string;
  brief: string;
  description: string;
  image?: string | null;
  is_featured: boolean;
  source?: string;
  price?: number | null;
  original_price?: number | null;
  discount_pct?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  offer_type?: string;
  discount_value?: string | null;
  discount_type?: string | null;
  promo_code?: string | null;
  season?: string | null;
  discount_status?: string;
}

export default function MainSiteOffersPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'offers' | 'packages' | 'discounts'>('all');

  useEffect(() => {
    fetch('/api/jana/website?id=website_offers')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const config = Array.isArray(data) ? data[0] : data;
        const layout = [
          ...(config?.header_components || []),
          ...(config?.body_components || []),
          ...(config?.footer_components || []),
        ];
        if (layout.length > 0) {
          setBuilderConfig({ ...config, layout });
        }
      })
      .catch(() => {});
    async function fetchData() {
      try {
        const [offersRes, discountsRes] = await Promise.all([
          fetch('/api/discovery/offers'),
          fetch('/api/discovery/discounts'),
        ]);
        const [offersData, discountsData] = await Promise.all([
          offersRes.json(), discountsRes.json(),
        ]);

        const offerSource = offersData?.offers || offersData?.items || [];
        const mappedOffers: Item[] = offerSource.map((item: any) => {
          const rawType = item.type || item.offer_type || item.discount_type || '';
          const hasDiscount = !!item.discount_value || !!item.discount || !!item.discount_type || !!item.discount_name;
          const isPackage = rawType === 'package' || rawType === 'experience_package' || item.source?.startsWith('package_') || item.source === 'experience_packages_db';
          const category: Item['category'] = isPackage ? 'package' : hasDiscount ? 'discount' : 'offer';
          const title = item.title || item.offer_title || item.discount_name || item.package_name || '';
          const description = item.description || item.offer_description || item.discount_description || '';

          return {
            id: item.business_id || item.id,
            business_slug: item.business_slug || item.business_id || item.id,
            title,
            type: rawType || (category === 'package' ? 'package' : 'special_offer'),
            category,
            business_name: item.business_name || '',
            brief: (description || title || '').substring(0, 140),
            description,
            image: item.image || item.offer_image || null,
            is_featured: !!item.is_featured,
            source: item.source,
            price: item.price ? parseFloat(item.price) : null,
            original_price: item.original_price ? parseFloat(item.original_price) : null,
            discount_pct: item.discount || null,
            valid_from: item.valid_from || item.valid_from_2 || item.valid_from_3 || null,
            valid_until: item.valid_until || item.valid_until_2 || item.valid_until_3 || null,
            offer_type: item.type || item.offer_type || 'special_offer',
            discount_value: item.discount_value || null,
            discount_type: item.discount_type || null,
            promo_code: item.promo_code || null,
            season: item.season || null,
            discount_status: item.discount_status || '',
          };
        });

        const mappedDiscounts: Item[] = (discountsData?.items || discountsData?.discounts || []).map((item: any) => ({
          id: `${item.business_id}-discount-${item.slot || 1}`,
          business_slug: item.business_slug || item.business_id,
          title: item.discount_name || 'Discount',
          type: item.discount_type || 'discount',
          category: 'discount',
          business_name: item.business_name || '',
          brief: item.description || item.discount_name || '',
          description: item.description || '',
          image: item.business_logo || null,
          is_featured: !!item.is_featured,
          source: 'discount-section',
          discount_value: item.discount_value || null,
          discount_type: item.discount_type || null,
          promo_code: item.promo_code || null,
          season: item.season || null,
          valid_from: item.valid_from || null,
          valid_until: item.valid_until || null,
          discount_status: item.discount_status || '',
        }));

        setItems([...mappedOffers, ...mappedDiscounts]);
      } catch (e) {
        console.error('Failed to fetch offers', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const visibleItems = items.filter((item) => {
    if (filterCategory === 'offers' && item.category !== 'offer') return false;
    if (filterCategory === 'packages' && item.category !== 'package') return false;
    if (filterCategory === 'discounts' && item.category !== 'discount') return false;
    if (featuredOnly && !item.is_featured) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && !item.business_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const featuredItems = items.filter(o => o.is_featured && (
    filterCategory === 'all' ||
    (filterCategory === 'offers' && o.category === 'offer') ||
    (filterCategory === 'packages' && o.category === 'package') ||
    (filterCategory === 'discounts' && o.category === 'discount')
  )).slice(0, 3);

  function formatDate(d: string | null | undefined) {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  }

  if (builderConfig) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
        <DynamicHomepageRenderer
          layout={builderConfig.layout}
          settings={builderConfig.site_settings || null}
          pageId="offers"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf8,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-800">
      <MarketplaceHeader title="Offers & Packages" adminPath="/admin/offers" activePath="/offers" />

      {/* Operable Hero Carousel for Offers */}
      <AdvancedHeroCarousel
        carouselName="offers_hero"
        height="clamp(380px, 55vh, 600px)"
      />

      <div className="page-shell py-10 sm:py-14 lg:py-16">
        <div className="premium-surface p-6 sm:p-8 lg:p-10">
          <div className="page-header mb-8 border-none pb-0">
            <p className="premium-kicker text-[10px] text-[#a87c00]">Curated deals</p>
            <h1 className="page-title mt-3">Offers &amp; Packages</h1>
            <p className="page-subtitle">
              Discover special offers, packages, and exclusive deals from businesses across Siwa Oasis.
            </p>
            <div className="gold-divider" />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="/admin/offers" className="premium-button">🔧 Moderate offers</a>
              <a href="/packages" className="secondary-button">📦 Browse packages</a>
              <a href="/discounts" className="secondary-button">🏷️ Browse discounts</a>
            </div>
          </div>

          {!loading && featuredItems.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-black text-slate-900">Featured Deals</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {featuredItems.map((item) => (
                  <Link key={item.id} href={`/p/${item.business_slug}`} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(212,175,55,0.15)]">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#fef3c7] via-[#f5d56a]/20 to-[#e2e8f0] text-4xl">
                        {item.category === 'package' ? '📦' : item.category === 'discount' ? '🏷️' : '🎁'}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <span className="text-2xl">{item.type === 'offer' ? '🎁' : '🏷️'}</span>
                          <h3 className="mt-2 text-lg font-black text-slate-900">{item.title}</h3>
                          <p className="mt-2 text-sm text-slate-500">{item.business_name}</p>
                        </div>
                        {item.discount_value ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                            {item.discount_value}{item.discount_type === 'percent' ? '%' : ''}
                          </span>
                        ) : item.discount_pct ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#a87c00]">
                            {item.discount_pct}%
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{item.brief}</p>
                      {item.promo_code && (
                        <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-center">
                          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Promo code</span>
                          <span className="text-sm font-black tracking-[0.18em] text-[#a87c00]">{item.promo_code}</span>
                        </div>
                      )}
                      {item.valid_until && (
                        <div className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                          Valid until {formatDate(item.valid_until)}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <input
              type="text"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37]"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37]"
            >
              <option value="all">All</option>
              <option value="offers">Offers</option>
              <option value="packages">Packages</option>
              <option value="discounts">Discounts</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={featuredOnly} onChange={e => setFeaturedOnly(e.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />
              Featured only
            </label>
            <span className="ml-auto text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent" />
              <p className="text-slate-500">Loading offers...</p>
            </div>
          )}

          {!loading && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.04)] transition hover:border-[#f5d56a] hover:shadow-[0_20px_38px_rgba(212,175,55,0.12)]">
                  {item.image ? (
                    <div className="relative h-40 overflow-hidden">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      {item.is_featured && (
                        <span className="absolute right-4 top-4 rounded-full bg-[#f5d56a] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-900">
                          Featured
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#fef3c7] via-[#f5d56a]/20 to-[#e2e8f0] text-4xl">
                      {item.category === 'package' ? '📦' : item.category === 'discount' ? '🏷️' : '🎁'}
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.category}</p>
                        <h3 className="mt-1 text-xl font-black text-slate-900">{item.title}</h3>
                      </div>
                      {item.discount_value ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                          {item.discount_value}{item.discount_type === 'percent' ? '%' : ''}
                        </span>
                      ) : item.discount_pct ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#a87c00]">
                          {item.discount_pct}%
                        </span>
                      ) : null}
                    </div>

                    <p className="mb-3 text-sm font-semibold text-slate-500">{item.business_name}</p>
                    <p className="mb-4 text-sm leading-6 text-slate-600">{item.brief || item.description}</p>

                    <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {item.valid_until && <span className="rounded-full bg-slate-100 px-2 py-1">Until {formatDate(item.valid_until)}</span>}
                      {item.promo_code && <span className="rounded-full bg-amber-50 px-2 py-1 text-[#a87c00]">Code: {item.promo_code}</span>}
                    </div>

                    <Link href={`/p/${item.business_slug}`} className="premium-button w-full">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && visibleItems.length === 0 && (
            <div className="premium-surface py-16 text-center">
              <p className="text-xl font-black text-slate-800">No offers found</p>
              <p className="mt-2 text-slate-500">Try another search or filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
