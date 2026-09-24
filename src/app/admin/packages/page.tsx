'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export interface MarketplaceItem {
  id: string;
  business_id: string | null;
  business_name?: string;
  business_slug?: string;
  business_type_name?: string;
  section_id?: string;
  title: string;
  title_ar?: string;
  slug: string;
  item_type: 'package' | 'tour' | 'activity' | 'discount_offer' | 'room_bundle' | 'retreat';
  category_id?: string;
  description?: string;
  description_ar?: string;
  duration_type?: 'hours' | 'full_day' | 'multi_day';
  duration_value?: number;
  price_amount: number;
  original_price?: number | null;
  discount_percentage?: number;
  discount_type?: 'none' | 'percent' | 'fixed' | 'early_bird' | 'coupon';
  coupon_code?: string;
  pricing_unit?: 'per_person' | 'per_group' | 'per_room' | 'fixed';
  currency?: string;
  media?: Array<{ url: string; caption?: string }>;
  status: 'draft' | 'pending_approval' | 'approved' | 'suspended' | 'archived';
  publish_on_minisite?: boolean;
  publish_on_main_portal?: boolean;
  is_featured?: boolean;
  target_scope?: 'platform' | 'parent_category' | 'child_typology' | 'multi_business';
  target_type_id?: string | null;
  assignments?: Array<{
    business_id: string;
    business_name?: string;
    business_role?: string;
    revenue_share_percentage?: number | null;
    visible_on_minisite?: boolean;
  }>;
  created_at?: string;
}

export default function CompactAdminPackagesPage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'compact_table' | 'grid'>('compact_table');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');

  // Modal / Drawer state
  const [editingItem, setEditingItem] = useState<Partial<MarketplaceItem> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [marketRes, bizRes, typesRes] = await Promise.all([
        fetch('/api/jana/marketplace'),
        fetch('/api/jana/businesses'),
        fetch('/api/jana/types')
      ]);

      const marketData = marketRes.ok ? await marketRes.json() : [];
      const bizData = bizRes.ok ? await bizRes.json() : [];
      const typesData = typesRes.ok ? await typesRes.json() : [];

      setItems(Array.isArray(marketData) ? marketData : []);
      setBusinesses(Array.isArray(bizData) ? bizData : []);
      setBusinessTypes(Array.isArray(typesData) ? typesData : []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load packages catalog', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Filter computation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q) || item.title_ar?.toLowerCase().includes(q);
        const matchesBiz = item.business_name?.toLowerCase().includes(q);
        const matchesType = item.item_type?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBiz && !matchesType && !matchesDesc) return false;
      }
      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'approved' && item.status !== 'approved') return false;
        if (statusFilter === 'pending' && item.status !== 'pending_approval') return false;
        if (statusFilter === 'draft' && item.status !== 'draft') return false;
        if (statusFilter === 'suspended' && item.status !== 'suspended') return false;
      }
      // Item Type
      if (typeFilter !== 'all' && item.item_type !== typeFilter) return false;
      // Scope
      if (scopeFilter !== 'all') {
        if (scopeFilter === 'platform' && item.target_scope !== 'platform' && item.business_id !== null) return false;
        if (scopeFilter === 'multi_business' && (item.target_scope !== 'multi_business' && (item.assignments?.length || 0) === 0)) return false;
        if (scopeFilter === 'single_vendor' && (item.business_id === null || (item.assignments?.length || 0) > 0)) return false;
      }
      // Vendor
      if (vendorFilter !== 'all' && item.business_id !== vendorFilter) return false;

      return true;
    });
  }, [items, searchQuery, statusFilter, typeFilter, scopeFilter, vendorFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = items.length;
    const approved = items.filter(i => i.status === 'approved').length;
    const pending = items.filter(i => i.status === 'pending_approval').length;
    const multiVendor = items.filter(i => i.target_scope === 'multi_business' || (i.assignments && i.assignments.length > 0)).length;
    const featured = items.filter(i => i.is_featured).length;
    return { total, approved, pending, multiVendor, featured };
  }, [items]);

  // Quick 1-Click Status Update
  const handleQuickStatusToggle = async (item: MarketplaceItem, newStatus: MarketplaceItem['status']) => {
    try {
      const res = await fetch('/api/jana/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus })
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
        showToast(`Package marked as ${newStatus}`, 'success');
      } else {
        showToast('Status update failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Status update failed', 'error');
    }
  };

  // Quick Featured Toggle
  const handleToggleFeatured = async (item: MarketplaceItem) => {
    const nextVal = !item.is_featured;
    try {
      const res = await fetch('/api/jana/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_featured: nextVal })
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: nextVal } : i));
        showToast(nextVal ? 'Highlighted as Featured ⭐' : 'Removed from Featured', 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Update failed', 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/jana/marketplace?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        showToast('Package removed from catalog', 'success');
      } else {
        showToast('Failed to delete package', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  // Save Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const method = isCreating ? 'POST' : 'PUT';
      const payload = {
        ...editingItem,
        slug: editingItem.slug || editingItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `pkg-${Date.now()}`,
        price_amount: Number(editingItem.price_amount) || 0,
        original_price: editingItem.original_price ? Number(editingItem.original_price) : null,
      };

      const res = await fetch('/api/jana/marketplace', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(isCreating ? 'New package created successfully!' : 'Package updated successfully!', 'success');
        setEditingItem(null);
        setIsCreating(false);
        loadData();
      } else {
        showToast(data.error || 'Failed to save package', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Save error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active / Approved</span>;
      case 'pending_approval':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Pending Review</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Draft</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Suspended</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'tour': return '🏜️ Tour';
      case 'package': return '📦 Package';
      case 'room_bundle': return '🏨 Hotel Bundle';
      case 'discount_offer': return '🏷️ Deal';
      case 'activity': return '🏄 Activity';
      case 'retreat': return '🧘 Retreat';
      default: return '📦 Item';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased p-4 sm:p-6 lg:p-8 font-sans">
      {/* TOAST NOTIFIER */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold transition-all transform animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-slate-900 text-emerald-400 border-emerald-500/30' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-500/30' :
          'bg-slate-900 text-amber-300 border-amber-500/30'
        }`}>
          <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="mx-auto max-w-[1550px] space-y-5">
        
        {/* ── 1. COMPACT EXECUTIVE TOP BAR ──────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Left Title & Breadcrumbs */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 text-xl border border-amber-500/20">
                📦
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <Link href="/admin" className="hover:text-amber-600 transition">Control Center</Link>
                  <span>/</span>
                  <span className="text-amber-600">Packages & Journey Offers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-black text-slate-900">Compact Package Manager</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                  </span>
                  {stats.pending > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse border border-amber-300">
                      ⚡ {stats.pending} pending review
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                onClick={loadData}
                disabled={loading}
                title="Reload Catalog"
                className="inline-flex items-center justify-center h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              </button>

              <Link
                href="/packages"
                target="_blank"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
              >
                <i className="fas fa-external-link-alt text-[10px] text-slate-400"></i>
                <span>Live Portal</span>
              </Link>

              <Link
                href="/jana/packages"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
              >
                <i className="fas fa-network-wired text-amber-600"></i>
                <span>Multi-Vendor Hub</span>
              </Link>

              <Link
                href="/package-studio"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-900 text-xs font-bold text-amber-400 hover:bg-slate-800 transition shadow-sm"
              >
                <i className="fas fa-paint-brush"></i>
                <span>Studio Editor</span>
              </Link>

              <button
                onClick={() => {
                  setEditingItem({
                    title: '',
                    title_ar: '',
                    slug: '',
                    item_type: 'package',
                    business_id: null,
                    category_id: 'general',
                    price_amount: 0,
                    original_price: 0,
                    currency: 'USD',
                    pricing_unit: 'per_person',
                    duration_type: 'full_day',
                    duration_value: 1,
                    status: 'approved',
                    publish_on_main_portal: true,
                    publish_on_minisite: true,
                    target_scope: 'platform'
                  });
                  setIsCreating(true);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-sm"
              >
                <span>+ New Package</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── 2. HIGH-EFFICIENCY COMPACT KPI STRIP ───────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
              <span>Catalog Total</span>
              <span className="text-slate-500">📦</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">All packages & offers</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-600 mb-1">
              <span>Active & Live</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.approved}</div>
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Published on portal</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-600 mb-1">
              <span>Pending Review</span>
              <span className="text-amber-500">⚡</span>
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Awaiting approval</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-blue-600 mb-1">
              <span>Multi-Vendor</span>
              <span className="text-blue-500">🤝</span>
            </div>
            <div className="text-2xl font-black text-blue-600">{stats.multiVendor}</div>
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Syndicated co-hosted</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-600 mb-1">
              <span>Featured Stars</span>
              <span className="text-amber-400">⭐</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.featured}</div>
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Priority promoted</div>
          </div>
        </div>

        {/* ── 3. SMART COMPACT TOOLBAR (FILTERS & CONTROLS) ─────────────── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search package, vendor, category, keyword..."
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Scope */}
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Scopes</option>
                <option value="platform">Platform Direct</option>
                <option value="multi_business">Multi-Vendor (Co-Hosted)</option>
                <option value="single_vendor">Vendor Exclusive</option>
              </select>

              {/* Item Type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="package">Packages</option>
                <option value="tour">Tours</option>
                <option value="activity">Activities</option>
                <option value="room_bundle">Room Bundles</option>
                <option value="discount_offer">Discount Offers</option>
                <option value="retreat">Retreats</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Active / Approved</option>
                <option value="pending">Pending Review</option>
                <option value="draft">Drafts</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* Vendor Filter */}
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="h-9 px-2.5 max-w-[160px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer truncate"
              >
                <option value="all">All Vendors</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Clear filters if active */}
              {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || scopeFilter !== 'all' || vendorFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setScopeFilter('all');
                    setVendorFilter('all');
                  }}
                  className="h-9 px-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition"
                >
                  Reset
                </button>
              )}

              {/* Layout Switcher */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 ml-auto">
                <button
                  onClick={() => setViewMode('compact_table')}
                  title="High-Density Compact Table"
                  className={`h-7 px-2.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                    viewMode === 'compact_table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <i className="fas fa-list"></i>
                  <span className="hidden sm:inline">Compact Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Card Grid"
                  className={`h-7 px-2.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <i className="fas fa-th-large"></i>
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* ── 4. DATA PRESENTATION (COMPACT TABLE OR GRID) ─────────────── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
            <p className="mt-3 text-xs font-bold text-slate-500 tracking-wider uppercase">Loading Package Catalog...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-base font-extrabold text-slate-800">No packages match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try clearing your filters or creating a new tour package offer for the Siwa catalog.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
                setScopeFilter('all');
                setVendorFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'compact_table' ? (
          /* ── ULTRA-COMPACT HIGH DENSITY TABLE ── */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3.5 w-8 text-center">★</th>
                    <th className="py-2.5 px-3.5 min-w-[260px]">Package Offer & Kind</th>
                    <th className="py-2.5 px-3.5 min-w-[170px]">Vendor Scope</th>
                    <th className="py-2.5 px-3.5 min-w-[130px]">Pricing & Savings</th>
                    <th className="py-2.5 px-3.5 min-w-[100px]">Channels</th>
                    <th className="py-2.5 px-3.5 min-w-[120px]">Status</th>
                    <th className="py-2.5 px-3.5 text-right min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((pkg) => {
                    const thumb = pkg.media?.[0]?.url || 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=200';
                    const hasDiscount = pkg.original_price && Number(pkg.original_price) > Number(pkg.price_amount);
                    const discountPct = hasDiscount ? Math.round(((Number(pkg.original_price) - Number(pkg.price_amount)) / Number(pkg.original_price)) * 100) : 0;
                    const partnerCount = pkg.assignments?.length || 0;

                    return (
                      <tr key={pkg.id} className="hover:bg-amber-500/[0.03] transition-colors group">
                        
                        {/* Featured Star */}
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={() => handleToggleFeatured(pkg)}
                            title={pkg.is_featured ? 'Featured on Portal Top' : 'Mark as Featured'}
                            className={`text-sm transition ${pkg.is_featured ? 'text-amber-400 hover:text-amber-500 scale-110' : 'text-slate-300 hover:text-amber-400'}`}
                          >
                            ★
                          </button>
                        </td>

                        {/* Title & Kind */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                              <img src={thumb} alt={pkg.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 truncate max-w-[220px] text-xs">
                                  {pkg.title}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {getItemTypeIcon(pkg.item_type)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>⏱ {pkg.duration_value || 1} {pkg.duration_type === 'hours' ? 'hours' : pkg.duration_type === 'full_day' ? 'days' : 'days'}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">/{pkg.slug}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Vendor Scope */}
                        <td className="py-2.5 px-3.5">
                          {pkg.target_scope === 'multi_business' || partnerCount > 0 ? (
                            <div>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                <span>🤝 Multi-Vendor</span>
                                <span className="bg-blue-600 text-white rounded-full px-1 text-[8px]">{partnerCount}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[150px]">
                                {pkg.business_name || 'Syndicated Hub'}
                              </div>
                            </div>
                          ) : pkg.business_id ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs truncate max-w-[150px]">
                                {pkg.business_name || 'Single Business'}
                              </div>
                              <div className="text-[10px] text-emerald-600 font-semibold">Vendor Direct</div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                🌐 Platform Direct
                              </span>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Centrally Governed</div>
                            </div>
                          )}
                        </td>

                        {/* Pricing & Savings */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-slate-900 text-sm">
                              {pkg.currency || '$'}{Number(pkg.price_amount).toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {pkg.currency || '$'}{Number(pkg.original_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            {hasDiscount ? (
                              <span className="text-amber-600 font-bold">Save {discountPct}%</span>
                            ) : (
                              <span>{pkg.pricing_unit?.replace('_', ' ') || 'per person'}</span>
                            )}
                          </div>
                        </td>

                        {/* Channels */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              title={pkg.publish_on_main_portal !== false ? 'Published on Main Portal' : 'Hidden from Portal'}
                              className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] border ${
                                pkg.publish_on_main_portal !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              🌐
                            </span>
                            <span
                              title={pkg.publish_on_minisite !== false ? 'Shown on Vendor Minisites' : 'Hidden from Minisite'}
                              className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] border ${
                                pkg.publish_on_minisite !== false ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              🏪
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(pkg.status)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pkg.status === 'pending_approval' && (
                              <button
                                onClick={() => handleQuickStatusToggle(pkg, 'approved')}
                                title="1-Click Approve"
                                className="h-7 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] transition"
                              >
                                ✓ Approve
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingItem(pkg);
                                setIsCreating(false);
                              }}
                              title="Quick Edit"
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold transition flex items-center justify-center"
                            >
                              <i className="fas fa-pencil-alt text-[10px]"></i>
                            </button>

                            <Link
                              href={`/jana/packages`}
                              title="Deep Multi-Vendor Assignment Engine"
                              className="h-7 w-7 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition flex items-center justify-center"
                            >
                              <i className="fas fa-network-wired text-[10px]"></i>
                            </Link>

                            <button
                              onClick={() => handleDeleteItem(pkg.id, pkg.title)}
                              title="Delete Package"
                              className="h-7 w-7 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center justify-center"
                            >
                              <i className="fas fa-trash-alt text-[10px]"></i>
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── MODERN COMPACT GRID ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((pkg) => {
              const thumb = pkg.media?.[0]?.url || 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=400';
              const hasDiscount = pkg.original_price && Number(pkg.original_price) > Number(pkg.price_amount);
              const discountPct = hasDiscount ? Math.round(((Number(pkg.original_price) - Number(pkg.price_amount)) / Number(pkg.original_price)) * 100) : 0;
              const partnerCount = pkg.assignments?.length || 0;

              return (
                <div key={pkg.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                  <div>
                    <div className="relative h-36 bg-slate-100 overflow-hidden">
                      <img src={thumb} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                      
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-900/80 text-white backdrop-blur-sm">
                          {getItemTypeIcon(pkg.item_type)}
                        </span>
                        {pkg.is_featured && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950">
                            ⭐ FEATURED
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <button
                          onClick={() => handleToggleFeatured(pkg)}
                          className="h-7 w-7 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:text-amber-400 flex items-center justify-center text-xs transition"
                        >
                          ★
                        </button>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between text-white">
                        <div className="text-xs font-black drop-shadow-sm truncate pr-2">
                          {pkg.business_name || 'Platform Journey'}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-amber-300">
                            {pkg.currency || '$'}{Number(pkg.price_amount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-tight line-clamp-2">
                        {pkg.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>⏱ {pkg.duration_value || 1} {pkg.duration_type || 'days'}</span>
                        {hasDiscount && (
                          <span className="text-emerald-600 font-bold">{discountPct}% OFF</span>
                        )}
                        <span>{getStatusBadge(pkg.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(pkg);
                        setIsCreating(false);
                      }}
                      className="flex-1 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>✏️ Quick Edit</span>
                    </button>
                    <Link
                      href="/jana/packages"
                      className="h-7 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>🤝 Assign</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteItem(pkg.id, pkg.title)}
                      className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── 5. QUICK CREATE / EDIT MODAL ─────────────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 text-base">
                  {isCreating ? '✨' : '✏️'}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isCreating ? 'Create New Package' : `Edit: ${editingItem.title || 'Package'}`}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct Catalog Integration</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Package Title (EN) *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, title: e.target.value }))}
                    placeholder="Desert Sunset & Salt Lake Safari"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Package Title (AR)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={editingItem.title_ar || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, title_ar: e.target.value }))}
                    placeholder="رحلة سفاري بحيرات الملح وغروب الصحراء"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Item Kind</label>
                  <select
                    value={editingItem.item_type || 'package'}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, item_type: e.target.value as any }))}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="package">Package Offer</option>
                    <option value="tour">Tour Experience</option>
                    <option value="activity">Activity</option>
                    <option value="room_bundle">Room Bundle</option>
                    <option value="discount_offer">Discount Deal</option>
                    <option value="retreat">Retreat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Target Scope</label>
                  <select
                    value={editingItem.target_scope || 'platform'}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, target_scope: e.target.value as any }))}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="platform">Platform Direct (Siwa Central)</option>
                    <option value="multi_business">Multi-Vendor (Co-Hosted)</option>
                    <option value="parent_category">Category Tier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Lead Business / Vendor</label>
                  <select
                    value={editingItem.business_id || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, business_id: e.target.value ? e.target.value : null }))}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="">None (Platform Direct)</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Offer Price *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingItem.price_amount ?? ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, price_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Base/Original Price</label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.original_price ?? ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, original_price: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                  <select
                    value={editingItem.currency || 'USD'}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, currency: e.target.value }))}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EGP">EGP (LE)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Duration</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={editingItem.duration_value ?? 1}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, duration_value: parseInt(e.target.value) || 1 }))}
                      className="w-14 h-9 px-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 text-center"
                    />
                    <select
                      value={editingItem.duration_type || 'full_day'}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, duration_type: e.target.value as any }))}
                      className="flex-1 h-9 px-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      <option value="hours">Hours</option>
                      <option value="full_day">Days</option>
                      <option value="multi_day">Multi-day</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev!, description: e.target.value }))}
                  placeholder="Cinematic overview of the itinerary, key highlights, and inclusions..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Status & Distribution Toggles */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.publish_on_main_portal !== false}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, publish_on_main_portal: e.target.checked }))}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-bold text-slate-700 text-[11px]">Show on Portal</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.publish_on_minisite !== false}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, publish_on_minisite: e.target.checked }))}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-bold text-slate-700 text-[11px]">Show on Minisite</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingItem.is_featured}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, is_featured: e.target.checked }))}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-bold text-amber-700 text-[11px]">★ Featured Star</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status:</span>
                  <select
                    value={editingItem.status || 'approved'}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, status: e.target.value as any }))}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    <option value="approved">Active / Approved</option>
                    <option value="pending_approval">Pending Review</option>
                    <option value="draft">Draft</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-sm"
                >
                  {saving ? 'Saving...' : isCreating ? 'Create Package' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
