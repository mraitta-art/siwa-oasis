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

export default function AdminPackagesPage() {
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

  // Multi-selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal / Drawer state
  const [editingItem, setEditingItem] = useState<Partial<MarketplaceItem> | null>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'pricing' | 'vendors' | 'channels'>('basic');
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

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q) || item.title_ar?.toLowerCase().includes(q);
        const matchesBiz = item.business_name?.toLowerCase().includes(q);
        const matchesType = item.item_type?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesSlug = item.slug?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBiz && !matchesType && !matchesDesc && !matchesSlug) return false;
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
        showToast(`Status updated to ${newStatus}`, 'success');
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
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/jana/marketplace?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        setSelectedIds(prev => prev.filter(i => i !== id));
        showToast('Package removed from catalog', 'success');
      } else {
        showToast('Failed to delete package', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  // Bulk Status Update
  const handleBulkStatus = async (newStatus: MarketplaceItem['status']) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id =>
        fetch('/api/jana/marketplace', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus })
        })
      ));
      setItems(prev => prev.map(i => selectedIds.includes(i.id) ? { ...i, status: newStatus } : i));
      showToast(`Updated ${selectedIds.length} items to ${newStatus}`, 'success');
      setSelectedIds([]);
    } catch (e) {
      showToast('Bulk update failed', 'error');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected packages?`)) return;
    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/jana/marketplace?id=${id}`, { method: 'DELETE' })
      ));
      setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
      showToast(`Deleted ${selectedIds.length} packages`, 'success');
      setSelectedIds([]);
    } catch (e) {
      showToast('Bulk deletion failed', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
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

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case 'tour': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">🏜️ Tour</span>;
      case 'package': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-200">📦 Package</span>;
      case 'room_bundle': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">🏨 Stay Bundle</span>;
      case 'discount_offer': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">🏷️ Deal Offer</span>;
      case 'activity': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">🏄 Activity</span>;
      case 'retreat': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-800 border border-teal-200">🧘 Retreat</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 antialiased p-3 sm:p-5 lg:p-7 font-sans">
      
      {/* ── TOAST NOTIFICATION ───────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-black transition-all transform animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-slate-900 text-emerald-400 border-emerald-500/40' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-500/40' :
          'bg-slate-900 text-amber-300 border-amber-500/40'
        }`}>
          <span className="text-base">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="mx-auto max-w-[1600px] space-y-4">
        
        {/* ── 1. LUXURY MIDNIGHT EXECUTIVE HEADER ───────────────────────── */}
        <div className="overflow-hidden rounded-[24px] border border-[#D4AF37]/30 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-5 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.25)] text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            
            {/* Title & Navigation */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/admin" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] hover:underline flex items-center gap-1">
                  <span>← CONTROL CENTER</span>
                </Link>
                <span className="text-slate-500">•</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">CATALOG & EXPERIENCE ARCHITECT</span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-2xl shadow-inner shadow-[#D4AF37]/20 text-[#D4AF37]">
                  📦
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Package & Offer Studio
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      Centralized Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Govern centralized platform itineraries, co-hosted multi-vendor bundles, and individual vendor services.
                  </p>
                </div>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                onClick={loadData}
                disabled={loading}
                title="Synchronize Catalog"
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <i className={`fas fa-sync-alt text-xs ${loading ? 'fa-spin' : ''}`}></i>
              </button>

              <Link
                href="/packages"
                target="_blank"
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-white/15 bg-white/5 text-xs font-black text-slate-200 hover:bg-white/10 transition backdrop-blur-sm"
              >
                <i className="fas fa-eye text-[#D4AF37] text-[11px]"></i>
                <span>Public Portal</span>
              </Link>

              <Link
                href="/jana/packages"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-blue-400/30 bg-blue-500/15 text-xs font-black text-blue-300 hover:bg-blue-500/25 transition"
              >
                <i className="fas fa-network-wired text-blue-400 text-xs"></i>
                <span>Multi-Vendor Matrix</span>
              </Link>

              <Link
                href="/package-studio"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-amber-400/30 bg-amber-500/15 text-xs font-black text-[#D4AF37] hover:bg-amber-500/25 transition"
              >
                <i className="fas fa-magic text-[#D4AF37] text-xs"></i>
                <span>Rich Visual Studio</span>
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
                  setModalTab('basic');
                  setIsCreating(true);
                }}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] hover:from-[#e5c158] hover:to-[#c46115] text-slate-950 font-black text-xs shadow-[0_10px_20px_rgba(212,175,55,0.25)] transition"
              >
                <span className="text-sm">+</span>
                <span>Create Package</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── 2. EXECUTIVE 5-KPI METRIC STRIP ──────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition hover:shadow-md">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              <span>Catalog Assets</span>
              <span className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs">📦</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">Total live catalog offers</div>
          </div>

          <div className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition hover:shadow-md">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-1">
              <span>Active on Portal</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.approved}</div>
            <div className="text-[10px] font-bold text-emerald-700/70 mt-0.5">Publicly discoverable</div>
          </div>

          <div className="rounded-2xl border border-amber-200/60 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition hover:shadow-md">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">
              <span>Pending Review</span>
              <span className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-xs font-black">⚡</span>
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
            <div className="text-[10px] font-bold text-amber-700/70 mt-0.5">Awaiting verification</div>
          </div>

          <div className="rounded-2xl border border-blue-200/60 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition hover:shadow-md">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-600 mb-1">
              <span>Multi-Vendor</span>
              <span className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-black">🤝</span>
            </div>
            <div className="text-2xl font-black text-blue-600">{stats.multiVendor}</div>
            <div className="text-[10px] font-bold text-blue-700/70 mt-0.5">Syndicated co-hosted</div>
          </div>

          <div className="rounded-2xl border border-[#D4AF37]/40 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition hover:shadow-md col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#D4AF37] mb-1">
              <span>Featured Stars</span>
              <span className="text-[#D4AF37] text-sm">⭐</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.featured}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">Top portal banners</div>
          </div>

        </div>

        {/* ── 3. REFINED CONTROL & FILTER BAR ──────────────────────────── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm space-y-3">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Instant Search Bar */}
            <div className="relative flex-1 min-w-[260px]">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by package name, vendor, duration, or keyword..."
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-[#D4AF37] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills & Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Scope Segmented Buttons */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold">
                {[
                  { id: 'all', label: 'All Scopes' },
                  { id: 'platform', label: 'Platform Direct' },
                  { id: 'multi_business', label: '🤝 Multi-Vendor' },
                  { id: 'single_vendor', label: 'Vendor Direct' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScopeFilter(s.id)}
                    className={`h-8 px-3 rounded-lg transition ${
                      scopeFilter === s.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Type Select */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="package">📦 Packages</option>
                <option value="tour">🏜️ Desert Tours</option>
                <option value="activity">🏄 Activities</option>
                <option value="room_bundle">🏨 Stay Bundles</option>
                <option value="discount_offer">🏷️ Special Deals</option>
                <option value="retreat">🧘 Wellness Retreats</option>
              </select>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Active / Published</option>
                <option value="pending">Pending Review</option>
                <option value="draft">Drafts</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* Vendor Select */}
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="h-9 px-3 max-w-[160px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#D4AF37] cursor-pointer truncate"
              >
                <option value="all">All Vendors</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Reset Filters */}
              {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || scopeFilter !== 'all' || vendorFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setScopeFilter('all');
                    setVendorFilter('all');
                  }}
                  className="h-9 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition"
                >
                  Reset
                </button>
              )}

              {/* Density View Switcher */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 ml-auto">
                <button
                  onClick={() => setViewMode('compact_table')}
                  title="Compact High-Density Table"
                  className={`h-8 px-3 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                    viewMode === 'compact_table' ? 'bg-white text-slate-950 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <i className="fas fa-table"></i>
                  <span className="hidden sm:inline">Compact Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Visual Bento Grid"
                  className={`h-8 px-3 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                    viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <i className="fas fa-th-large"></i>
                  <span className="hidden sm:inline">Bento Grid</span>
                </button>
              </div>

            </div>

          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0f172a] text-white animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-xs font-black">
                <span className="h-5 w-5 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center text-[10px]">
                  {selectedIds.length}
                </span>
                <span>Packages selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatus('approved')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition"
                >
                  ✓ Approve Selected
                </button>
                <button
                  onClick={() => handleBulkStatus('suspended')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black transition"
                >
                  ⏸ Suspend
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black transition"
                >
                  🗑 Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1.5 rounded-lg border border-white/20 text-slate-400 hover:text-white text-[11px] font-bold"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── 4. CATALOG DATA VIEW (COMPACT TABLE OR GRID) ─────────────── */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#D4AF37] border-t-transparent"></div>
            <p className="mt-4 text-xs font-black text-slate-500 tracking-widest uppercase">Synchronizing Catalog Matrix...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="text-5xl mb-3">📦</div>
            <h3 className="text-lg font-black text-slate-900">No packages found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">No items match your active filters. Try adjusting your query or create a new package for the catalog.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
                setScopeFilter('all');
                setVendorFilter('all');
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'compact_table' ? (
          /* ── MASTER-CLASS COMPACT TABLE ── */
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                    </th>
                    <th className="py-3 px-3 w-8 text-center">★</th>
                    <th className="py-3 px-3 min-w-[280px]">Package Offer & Details</th>
                    <th className="py-3 px-3 min-w-[170px]">Vendor & Scope</th>
                    <th className="py-3 px-3 min-w-[140px]">Pricing & Discount</th>
                    <th className="py-3 px-3 min-w-[110px]">Distribution</th>
                    <th className="py-3 px-3 min-w-[120px]">Status</th>
                    <th className="py-3 px-3 text-right min-w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((pkg) => {
                    const isSelected = selectedIds.includes(pkg.id);
                    const thumb = pkg.media?.[0]?.url || 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=240';
                    const hasDiscount = pkg.original_price && Number(pkg.original_price) > Number(pkg.price_amount);
                    const discountPct = hasDiscount ? Math.round(((Number(pkg.original_price) - Number(pkg.price_amount)) / Number(pkg.original_price)) * 100) : 0;
                    const partnerCount = pkg.assignments?.length || 0;

                    return (
                      <tr
                        key={pkg.id}
                        className={`transition-colors group ${
                          isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(pkg.id)}
                            className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                          />
                        </td>

                        {/* Star Priority */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleFeatured(pkg)}
                            title={pkg.is_featured ? 'Featured Top Star' : 'Mark as Featured'}
                            className={`text-base transition ${pkg.is_featured ? 'text-[#D4AF37] hover:scale-125' : 'text-slate-300 hover:text-[#D4AF37]'}`}
                          >
                            ★
                          </button>
                        </td>

                        {/* Package Info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                              <img src={thumb} alt={pkg.title} className="h-full w-full object-cover group-hover:scale-110 transition duration-300" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-xs group-hover:text-amber-700 transition">
                                  {pkg.title}
                                </span>
                                {getItemTypeBadge(pkg.item_type)}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {pkg.title_ar && <span className="font-arabic text-slate-500 font-semibold">{pkg.title_ar}</span>}
                                <span>•</span>
                                <span>⏱ {pkg.duration_value || 1} {pkg.duration_type === 'hours' ? 'hrs' : 'days'}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">/{pkg.slug}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Vendor & Scope */}
                        <td className="py-3 px-3">
                          {pkg.target_scope === 'multi_business' || partnerCount > 0 ? (
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                                <span>🤝 Multi-Vendor</span>
                                <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.2 text-[9px]">{partnerCount} Partners</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[150px]">
                                {pkg.business_name || 'Co-Hosted Experience'}
                              </div>
                            </div>
                          ) : pkg.business_id ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs truncate max-w-[160px]">
                                {pkg.business_name || 'Single Business'}
                              </div>
                              <div className="text-[10px] text-emerald-600 font-bold">Exclusive Vendor Service</div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200">
                                🌐 Platform Direct
                              </span>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Central Management</div>
                            </div>
                          )}
                        </td>

                        {/* Pricing & Margin */}
                        <td className="py-3 px-3">
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
                          <div className="text-[10px] font-bold">
                            {hasDiscount ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Save {discountPct}%</span>
                            ) : (
                              <span className="text-slate-400 capitalize">{pkg.pricing_unit?.replace('_', ' ') || 'per person'}</span>
                            )}
                          </div>
                        </td>

                        {/* Distribution Channels */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              title={pkg.publish_on_main_portal !== false ? 'Active on Main Portal' : 'Hidden from Portal'}
                              className={`h-6 px-2 rounded-lg flex items-center gap-1 text-[10px] font-black border ${
                                pkg.publish_on_main_portal !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              <span>🌐 Portal</span>
                            </span>
                            <span
                              title={pkg.publish_on_minisite !== false ? 'Synced with Minisites' : 'Hidden from Minisites'}
                              className={`h-6 px-2 rounded-lg flex items-center gap-1 text-[10px] font-black border ${
                                pkg.publish_on_minisite !== false ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              <span>🏪 Mini</span>
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <select
                            value={pkg.status}
                            onChange={(e) => handleQuickStatusToggle(pkg, e.target.value as any)}
                            className={`h-7 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer outline-none transition ${
                              pkg.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              pkg.status === 'pending_approval' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              pkg.status === 'suspended' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="approved">✓ Approved / Active</option>
                            <option value="pending_approval">⚡ Pending Review</option>
                            <option value="draft">Draft</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pkg.status === 'pending_approval' && (
                              <button
                                onClick={() => handleQuickStatusToggle(pkg, 'approved')}
                                className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] transition shadow-sm"
                              >
                                ✓ Approve
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingItem(pkg);
                                setModalTab('basic');
                                setIsCreating(false);
                              }}
                              title="Edit Package"
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold transition flex items-center justify-center shadow-sm"
                            >
                              <i className="fas fa-pencil-alt text-[10px]"></i>
                            </button>

                            <Link
                              href="/jana/packages"
                              title="Assign Co-Hosts in Multi-Vendor Engine"
                              className="h-7 w-7 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition flex items-center justify-center shadow-sm"
                            >
                              <i className="fas fa-network-wired text-[10px]"></i>
                            </Link>

                            <button
                              onClick={() => handleDeleteItem(pkg.id, pkg.title)}
                              title="Delete Package"
                              className="h-7 w-7 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center justify-center shadow-sm"
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
          /* ── LUXURY BENTO CARDS GRID ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((pkg) => {
              const thumb = pkg.media?.[0]?.url || 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=500';
              const hasDiscount = pkg.original_price && Number(pkg.original_price) > Number(pkg.price_amount);
              const discountPct = hasDiscount ? Math.round(((Number(pkg.original_price) - Number(pkg.price_amount)) / Number(pkg.original_price)) * 100) : 0;
              const partnerCount = pkg.assignments?.length || 0;

              return (
                <div
                  key={pkg.id}
                  className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Media Header */}
                    <div className="relative h-44 bg-slate-900 overflow-hidden">
                      <img src={thumb} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                      
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {getItemTypeBadge(pkg.item_type)}
                        {pkg.is_featured && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#D4AF37] text-slate-950">
                            ⭐ FEATURED
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => handleToggleFeatured(pkg)}
                          className="h-8 w-8 rounded-full bg-slate-950/60 backdrop-blur-md text-white hover:text-[#D4AF37] flex items-center justify-center text-sm transition"
                        >
                          ★
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-black drop-shadow truncate">
                            {pkg.business_name || 'Platform Experience'}
                          </div>
                          <div className="text-[10px] text-slate-300 font-semibold">
                            ⏱ {pkg.duration_value || 1} {pkg.duration_type || 'days'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-[#D4AF37] drop-shadow">
                            {pkg.currency || '$'}{Number(pkg.price_amount).toLocaleString()}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-emerald-300 font-bold drop-shadow">
                              Save {discountPct}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-700 transition">
                        {pkg.title}
                      </h4>
                      {pkg.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500">
                          {partnerCount > 0 ? `🤝 ${partnerCount} Multi-Vendors` : '🏢 Direct'}
                        </span>
                        <select
                          value={pkg.status}
                          onChange={(e) => handleQuickStatusToggle(pkg, e.target.value as any)}
                          className="text-[10px] font-black uppercase tracking-wider rounded-md border px-1.5 py-0.5 bg-slate-50 text-slate-700"
                        >
                          <option value="approved">✓ Approved</option>
                          <option value="pending_approval">⚡ Pending</option>
                          <option value="draft">Draft</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(pkg);
                        setModalTab('basic');
                        setIsCreating(false);
                      }}
                      className="flex-1 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fas fa-pencil-alt text-[10px] text-slate-400"></i>
                      <span>Edit</span>
                    </button>
                    <Link
                      href="/jana/packages"
                      className="h-8 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-black transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <i className="fas fa-network-wired text-[10px] text-amber-600"></i>
                      <span>Assign</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteItem(pkg.id, pkg.title)}
                      className="h-8 w-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center"
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

      {/* ── 5. MASTER-CLASS SLIDE-OVER / MODAL ───────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#1e293b] text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-amber-400 text-lg">
                  {isCreating ? '✨' : '✏️'}
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isCreating ? 'Create Experience Package' : `Edit: ${editingItem.title || 'Package Offer'}`}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Catalog Configuration & Multi-Vendor Synchronization</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-slate-100 bg-slate-50 px-6 gap-2 pt-2">
              {[
                { id: 'basic', label: '1. Basic Info & Description', icon: 'fa-info-circle' },
                { id: 'pricing', label: '2. Pricing & Savings', icon: 'fa-tag' },
                { id: 'vendors', label: '3. Scope & Lead Vendor', icon: 'fa-handshake' },
                { id: 'channels', label: '4. Distribution Channels', icon: 'fa-globe' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id as any)}
                  className={`pb-2.5 px-3 text-xs font-black border-b-2 transition flex items-center gap-1.5 ${
                    modalTab === tab.id ? 'border-[#D4AF37] text-slate-950' : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <i className={`fas ${tab.icon} text-[10px]`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              
              {/* TAB 1: BASIC INFO */}
              {modalTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Package Title (English) *</label>
                      <input
                        type="text"
                        required
                        value={editingItem.title || ''}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, title: e.target.value }))}
                        placeholder="e.g. Great Sand Sea Safari & Sunset Dinner"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Package Title (Arabic)</label>
                      <input
                        type="text"
                        dir="rtl"
                        value={editingItem.title_ar || ''}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, title_ar: e.target.value }))}
                        placeholder="رحلة بحر الرمال الأعظم وعشاء الغروب"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Item Kind / Typology</label>
                      <select
                        value={editingItem.item_type || 'package'}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, item_type: e.target.value as any }))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      >
                        <option value="package">📦 Package Journey</option>
                        <option value="tour">🏜️ Desert Tour</option>
                        <option value="activity">🏄 Outdoor Activity</option>
                        <option value="room_bundle">🏨 Accommodation Stay Bundle</option>
                        <option value="discount_offer">🏷️ Special Discount Deal</option>
                        <option value="retreat">🧘 Wellness Retreat</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">URL Identifier (Slug)</label>
                      <input
                        type="text"
                        value={editingItem.slug || ''}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, slug: e.target.value }))}
                        placeholder="sand-sea-safari-sunset"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Executive Summary / Description</label>
                    <textarea
                      rows={3}
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, description: e.target.value }))}
                      placeholder="Cinematic overview of the tour, scenery, highlights, and experience..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & SAVINGS */}
              {modalTab === 'pricing' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Offer Price *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editingItem.price_amount ?? ''}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, price_amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-900 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Original Price</label>
                      <input
                        type="number"
                        step="any"
                        value={editingItem.original_price ?? ''}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, original_price: e.target.value ? parseFloat(e.target.value) : null }))}
                        placeholder="e.g. 250"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                      <select
                        value={editingItem.currency || 'USD'}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, currency: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EGP">EGP (LE)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Pricing Unit</label>
                      <select
                        value={editingItem.pricing_unit || 'per_person'}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, pricing_unit: e.target.value as any }))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#D4AF37] focus:bg-white transition"
                      >
                        <option value="per_person">Per Person</option>
                        <option value="per_group">Per Group</option>
                        <option value="per_room">Per Room</option>
                        <option value="fixed">Fixed Price</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Duration Value & Type</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingItem.duration_value ?? 1}
                          onChange={(e) => setEditingItem(prev => ({ ...prev!, duration_value: parseInt(e.target.value) || 1 }))}
                          className="w-16 h-10 px-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 text-center"
                        />
                        <select
                          value={editingItem.duration_type || 'full_day'}
                          onChange={(e) => setEditingItem(prev => ({ ...prev!, duration_type: e.target.value as any }))}
                          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                        >
                          <option value="hours">Hours</option>
                          <option value="full_day">Days (Single/Multi)</option>
                          <option value="multi_day">Multi-day Retreat</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Discount Mode</label>
                      <select
                        value={editingItem.discount_type || 'none'}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, discount_type: e.target.value as any }))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                      >
                        <option value="none">Standard Pricing</option>
                        <option value="percent">Percentage Discount</option>
                        <option value="early_bird">Early Bird Deal</option>
                        <option value="coupon">Coupon Protected</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VENDORS & SCOPE */}
              {modalTab === 'vendors' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Target Governance Scope</label>
                      <select
                        value={editingItem.target_scope || 'platform'}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, target_scope: e.target.value as any }))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                      >
                        <option value="platform">🌐 Platform Direct (Siwa Central)</option>
                        <option value="multi_business">🤝 Multi-Vendor (Co-Hosted Syndication)</option>
                        <option value="parent_category">Category Tier Assignment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Primary Host / Lead Vendor</label>
                      <select
                        value={editingItem.business_id || ''}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, business_id: e.target.value ? e.target.value : null }))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                      >
                        <option value="">None (Platform Centrally Managed)</option>
                        {businesses.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900">
                    <div className="font-black text-xs mb-1 flex items-center gap-1.5">
                      <i className="fas fa-info-circle text-amber-600"></i>
                      <span>Multi-Vendor Co-Hosting Matrix</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      To attach multiple accommodation, transport, and tour providers with automated revenue-splits, visit the <strong>Multi-Vendor Assignment Matrix</strong> at <Link href="/jana/packages" className="underline font-bold text-amber-700">/jana/packages</Link>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: CHANNELS & VISIBILITY */}
              {modalTab === 'channels' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Distribution Channels</div>
                    
                    <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingItem.publish_on_main_portal !== false}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, publish_on_main_portal: e.target.checked }))}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <div>
                        <div className="font-black text-slate-800 text-xs">Publish on Main Portal (siwify.com/packages)</div>
                        <div className="text-[10px] text-slate-400">Makes the package available in search, discovery, and direct booking.</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingItem.publish_on_minisite !== false}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, publish_on_minisite: e.target.checked }))}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <div>
                        <div className="font-black text-slate-800 text-xs">Display on Vendor Minisites</div>
                        <div className="text-[10px] text-slate-400">Shows under the Packages section on the assigned vendor storefronts.</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editingItem.is_featured}
                        onChange={(e) => setEditingItem(prev => ({ ...prev!, is_featured: e.target.checked }))}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <div>
                        <div className="font-black text-amber-700 text-xs">★ Priority Featured Highlight</div>
                        <div className="text-[10px] text-slate-400">Pins to the top carousel of the packages experience hub.</div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Publication Status</label>
                    <select
                      value={editingItem.status || 'approved'}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, status: e.target.value as any }))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      <option value="approved">✓ Active / Approved</option>
                      <option value="pending_approval">⚡ Pending Review</option>
                      <option value="draft">Draft</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {modalTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'channels') setModalTab('vendors');
                        else if (modalTab === 'vendors') setModalTab('pricing');
                        else if (modalTab === 'pricing') setModalTab('basic');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
                    >
                      ← Previous
                    </button>
                  )}
                  {modalTab !== 'channels' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'basic') setModalTab('pricing');
                        else if (modalTab === 'pricing') setModalTab('vendors');
                        else if (modalTab === 'vendors') setModalTab('channels');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold text-xs hover:bg-slate-100 transition"
                    >
                      Next Step →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] hover:from-[#e5c158] hover:to-[#c46115] text-slate-950 font-black text-xs shadow-sm transition"
                  >
                    {saving ? 'Saving...' : isCreating ? 'Publish Package' : 'Save Changes'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
