'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

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
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    // 1. Fetch site builder layout if configured
    fetch('/api/jana/website?id=website_discounts')
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
      <div className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-[#f5d56a] hover:shadow-[0_18px_34px_rgba(212,175,55,0.12)]">
        <div className="h-2 bg-gradient-to-r from-[#556B2F] via-[#d4af37] to-[#f4c95d]" />
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              <span>{SEASON_ICONS[item.season || 'all_year'] || '📅'}</span>
              <span>{(item.season || 'all_year').replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.is_featured && <span className="text-[#a87c00]">⭐</span>}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${item.discount_status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {item.discount_status?.toUpperCase()}
              </span>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a87c00]">{item.business_name}</p>
          <h3 className="mt-2 text-xl font-black text-slate-900">{item.title}</h3>

          {item.discount_value && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">You save</span>
              <span className="text-lg font-black text-emerald-700">
                {item.discount_value}{item.discount_type === 'percent' ? '%' : item.discount_type === 'fixed_amount' ? ' EGP' : ''}
              </span>
            </div>
          )}

          {item.applies_to && item.applies_to !== 'all_services' && (
            <p className="mt-3 text-[11px] text-slate-500">Applies to: <span className="font-semibold capitalize text-slate-600">{item.applies_to.replace('_', ' ')}</span></p>
          )}

          {item.min_group_size && item.min_group_size > 1 && (
            <p className="mt-2 text-[11px] font-semibold text-blue-600">👥 Group of {item.min_group_size}+ required</p>
          )}

          {item.brief && <p className="mt-3 text-sm leading-6 text-slate-600">{item.brief}</p>}

          {item.promo_code && (
            <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-center">
              <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Promo code</span>
              <span className="text-sm font-black tracking-[0.18em] text-[#a87c00]">{item.promo_code}</span>
            </div>
          )}

          {(item.valid_from || item.valid_until) && (
            <p className="mt-3 text-[11px] text-slate-500">
              {item.valid_from ? `From ${fmtDate(item.valid_from)} ` : ''}
              {item.valid_until ? `until ${fmtDate(item.valid_until)}` : ''}
            </p>
          )}

          <Link href={`/p/${item.business_slug}`} className="premium-button mt-5 w-full">
            View Minisite
          </Link>
        </div>
      </div>
    );
  }

  if (builderConfig) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
        <DynamicHomepageRenderer
          layout={builderConfig.layout}
          settings={builderConfig.site_settings || null}
          pageId="discounts"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf8,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-800">
      <MarketplaceHeader title="Discounts" adminPath="/admin/discounts" activePath="/discounts" />

      {/* Operable Hero Carousel for Discounts */}
      <AdvancedHeroCarousel
        carouselName="discounts_hero"
        height="clamp(380px, 55vh, 600px)"
      />

      <div className="page-shell py-10 sm:py-14 lg:py-16">
        <div className="premium-surface p-6 sm:p-8 lg:p-10">
          <div className="page-header mb-8 border-none pb-0">
            <p className="premium-kicker text-[10px] text-[#a87c00]">Seasonal savings</p>
            <h1 className="page-title mt-3">Special Discounts</h1>
            <p className="page-subtitle">
              Save more with seasonal deals, group discounts, and exclusive promotions from businesses across Siwa Oasis.
            </p>
            <div className="gold-divider" />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="/admin/discounts" className="premium-button">🔧 Moderate discounts</a>
              <a href="/offers" className="secondary-button">🎁 Browse offers</a>
              <a href="/packages" className="secondary-button">📦 Browse packages</a>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3">
            <input
              type="text"
              placeholder="Search discounts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37]"
            />
            {allSeasons.length > 0 && (
              <select value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37]">
                <option value="">All Seasons</option>
                {allSeasons.map(s => <option key={s} value={s!}>{(s || '').replace('_', ' ')}</option>)}
              </select>
            )}
            {allTypes.length > 0 && (
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37]">
                <option value="">All Types</option>
                {allTypes.map(t => <option key={t} value={t!}>{(t || '').replace('_', ' ')}</option>)}
              </select>
            )}
            <span className="ml-auto text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{visible.length} deals</span>
          </div>

          {loading && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent" />
              <p className="text-slate-500">Loading discounts...</p>
            </div>
          )}

          {!loading && featured.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-black text-slate-900">Featured Deals</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featured.map(item => <DiscountCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {!loading && regular.length > 0 && (
            <div>
              {featured.length > 0 && <h2 className="mb-6 text-2xl font-black text-slate-900">All Discounts</h2>}
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {regular.map(item => <DiscountCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="premium-surface py-16 text-center">
              <div className="text-4xl">🔍</div>
              <p className="mt-4 text-xl font-black text-slate-800">No discounts found</p>
              <p className="mt-2 text-slate-500">Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
