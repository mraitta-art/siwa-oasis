'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

export interface MarketplaceItem {
  id: string;
  business_id: string | null;
  business_name?: string;
  business_slug?: string;
  business_type_name?: string;
  section_id: string;
  title: string;
  title_ar: string;
  slug: string;
  item_type: 'package' | 'tour' | 'activity' | 'discount_offer' | 'room_bundle' | 'retreat';
  category_id: string;
  description: string;
  description_ar: string;
  duration_type: 'hours' | 'full_day' | 'multi_day';
  duration_value: number;
  price_amount: number;
  original_price: number | null;
  discount_percentage: number;
  discount_type: 'none' | 'percent' | 'fixed' | 'early_bird' | 'coupon';
  coupon_code: string;
  pricing_unit: 'per_person' | 'per_group' | 'per_room' | 'fixed';
  currency: string;
  itinerary: Array<{ day: number; title: string; title_ar?: string; description?: string; description_ar?: string }>;
  included_features: string[];
  excluded_features: string[];
  media: Array<{ url: string; caption?: string }>;
  status: 'draft' | 'pending_approval' | 'approved' | 'suspended' | 'archived';
  publish_on_minisite: boolean;
  publish_on_main_portal: boolean;
  is_featured: boolean;
  booking_cta_type: 'whatsapp' | 'phone' | 'url' | 'custom_quote';
  booking_cta_url: string;
  target_scope?: 'platform' | 'parent_category' | 'child_typology' | 'multi_business';
  target_type_id?: string | null;
  assignments?: Array<{
    id?: string;
    business_id: string;
    business_name?: string;
    business_slug?: string;
    business_tier?: string;
    business_role?: string;
    role?: string;
    revenue_share_percentage?: number | null;
    commission_split_pct?: number | null;
    visible_on_minisite?: boolean;
    vendor_acceptance_status?: string;
  }>;
  created_at?: string;
}

export default function UnifiedMarketplaceCommandCenter() {
  const { notify } = useAdmin();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter States
  const [mode, setMode] = useState<'all' | 'platform' | 'vendor_proxy' | 'multi_vendor'>('all');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing / Creation Modal
  const [editingItem, setEditingItem] = useState<Partial<MarketplaceItem> | null>(null);
  const [activeTab, setActiveTab] = useState<'basics' | 'pricing_discounts' | 'itinerary' | 'media' | 'targeting_forwarding' | 'governance'>('basics');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');

  // Partner addition state for Tab 5
  const [partnerToAdd, setPartnerToAdd] = useState<{
    business_id: string;
    role: string;
    commission_split_pct: number;
    visible_on_minisite: boolean;
  }>({
    business_id: '',
    role: 'partner',
    commission_split_pct: 0,
    visible_on_minisite: true
  });

  // Derived parent and child types
  const parentTypes = useMemo(() => businessTypes.filter(t => t.is_parent || !t.parent_id), [businessTypes]);
  const childTypes = useMemo(() => businessTypes.filter(t => !t.is_parent && t.parent_id), [businessTypes]);

  const addPartnerToEditingItem = () => {
    if (!partnerToAdd.business_id) return;
    const currentAssignments = editingItem?.assignments || [];
    if (currentAssignments.some(a => String(a.business_id) === String(partnerToAdd.business_id))) {
      notify?.('This business is already assigned to this package', 'error');
      return;
    }
    const updated = [
      ...currentAssignments,
      {
        business_id: partnerToAdd.business_id,
        role: partnerToAdd.role || 'partner',
        business_role: partnerToAdd.role || 'partner',
        commission_split_pct: Number(partnerToAdd.commission_split_pct) || 0,
        revenue_share_percentage: Number(partnerToAdd.commission_split_pct) || 0,
        visible_on_minisite: partnerToAdd.visible_on_minisite !== false,
        vendor_acceptance_status: 'approved'
      }
    ];
    setEditingItem(prev => prev ? ({ ...prev, assignments: updated }) : null);
    setPartnerToAdd({ business_id: '', role: 'partner', commission_split_pct: 0, visible_on_minisite: true });
  };

  const removePartnerFromEditingItem = (bizId: string) => {
    setEditingItem(prev => prev ? ({
      ...prev,
      assignments: (prev.assignments || []).filter(a => String(a.business_id) !== String(bizId))
    }) : null);
  };

  const updatePartnerInEditingItem = (bizId: string, patch: Partial<{ role: string; business_role?: string; commission_split_pct: number; revenue_share_percentage?: number; visible_on_minisite: boolean }>) => {
    setEditingItem(prev => prev ? ({
      ...prev,
      assignments: (prev.assignments || []).map(a => {
        if (String(a.business_id) !== String(bizId)) return a;
        const role = patch.role || patch.business_role || a.role || a.business_role || 'partner';
        const pct = patch.commission_split_pct !== undefined ? patch.commission_split_pct : (patch.revenue_share_percentage !== undefined ? patch.revenue_share_percentage : (a.commission_split_pct ?? a.revenue_share_percentage ?? 0));
        return {
          ...a,
          ...patch,
          role,
          business_role: role,
          commission_split_pct: pct,
          revenue_share_percentage: pct
        };
      })
    }) : null);
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

      const marketData = await marketRes.json();
      const bizData = await bizRes.json();
      const typesData = typesRes.ok ? await typesRes.json() : [];

      setItems(Array.isArray(marketData) ? marketData : []);
      setBusinesses(Array.isArray(bizData) ? bizData : []);
      setBusinessTypes(Array.isArray(typesData) ? typesData : []);
    } catch (err: any) {
      notify('Failed to load marketplace catalog', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (mode === 'platform' && (item.business_id !== null || (item.target_scope && item.target_scope !== 'platform'))) return false;
      if (mode === 'vendor_proxy' && item.business_id !== selectedVendorId) return false;
      if (mode === 'multi_vendor' && (item.target_scope !== 'multi_business' && (item.assignments?.length || 0) === 0)) return false;
      if (typeFilter !== 'all' && item.item_type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q) || (item.title_ar || '').includes(q);
        const matchBiz = (item.business_name || '').toLowerCase().includes(q);
        const matchCode = (item.coupon_code || '').toLowerCase().includes(q);
        if (!matchTitle && !matchBiz && !matchCode) return false;
      }
      return true;
    });
  }, [items, mode, selectedVendorId, typeFilter, statusFilter, searchQuery]);

  // Quick Status Actions
  async function toggleStatus(item: MarketplaceItem, nextStatus: MarketplaceItem['status']) {
    try {
      const res = await fetch('/api/jana/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: nextStatus })
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
        notify(`Status changed to ${nextStatus}`, 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch {
      notify('Failed to update status', 'error');
    }
  }

  async function toggleFeatured(item: MarketplaceItem) {
    try {
      const nextFeatured = !item.is_featured;
      const res = await fetch('/api/jana/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_featured: nextFeatured })
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_featured: nextFeatured } : i)));
        notify(nextFeatured ? 'Promoted to Featured 👑' : 'Removed from Featured', 'success');
      }
    } catch {
      notify('Failed to toggle featured status', 'error');
    }
  }

  async function toggleVisibility(item: MarketplaceItem, field: 'publish_on_minisite' | 'publish_on_main_portal') {
    try {
      const nextVal = !item[field];
      const res = await fetch('/api/jana/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, [field]: nextVal })
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, [field]: nextVal } : i)));
        notify('Visibility switch updated', 'success');
      }
    } catch {
      notify('Failed to update visibility', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to permanently delete this item?')) return;
    try {
      const res = await fetch(`/api/jana/marketplace?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        notify('Item deleted successfully', 'success');
      }
    } catch {
      notify('Failed to delete item', 'error');
    }
  }

  // Save Modal
  async function handleSaveItem() {
    if (!editingItem?.title?.trim()) {
      return notify('Title is required', 'error');
    }

    setSaving(true);
    try {
      const isNew = !editingItem.id;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...editingItem,
        business_id: editingItem.business_id || null,
        duration_value: Number(editingItem.duration_value) || 1,
        price_amount: Number(editingItem.price_amount) || 0,
        original_price: editingItem.original_price ? Number(editingItem.original_price) : null,
        discount_percentage: Number(editingItem.discount_percentage) || 0,
        target_scope: editingItem.target_scope || 'platform',
        target_type_id: editingItem.target_type_id || null,
        assignments: editingItem.assignments || []
      };

      const res = await fetch('/api/jana/marketplace', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        notify(`Item ${isNew ? 'created' : 'updated'} successfully!`, 'success');
        setEditingItem(null);
        loadData();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
    } catch (err: any) {
      notify(err.message || 'Error saving item', 'error');
    } finally {
      setSaving(false);
    }
  }

  function startNewItem(type: MarketplaceItem['item_type'] = 'package') {
    setEditingItem({
      business_id: mode === 'vendor_proxy' && selectedVendorId ? selectedVendorId : null,
      section_id: type === 'tour' || type === 'activity' ? 'sec_5_experiences' : 'sec_9_marketplace_catalog',
      title: '',
      title_ar: '',
      item_type: type,
      category_id: 'general',
      description: '',
      description_ar: '',
      duration_type: type === 'tour' || type === 'package' ? 'full_day' : 'hours',
      duration_value: 1,
      price_amount: 0,
      original_price: null,
      discount_percentage: 0,
      discount_type: 'none',
      coupon_code: '',
      pricing_unit: 'per_person',
      currency: 'EGP',
      itinerary: [],
      included_features: [],
      excluded_features: [],
      media: [],
      status: 'approved',
      publish_on_minisite: true,
      publish_on_main_portal: true,
      is_featured: false,
      booking_cta_type: 'whatsapp',
      booking_cta_url: '',
      target_scope: 'platform',
      target_type_id: null,
      assignments: []
    });
    setActiveTab('basics');
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* ── TOP HEADER ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            👑 PLATFORM GOVERNANCE &amp; INVENTORY ENGINE
          </div>
          <h1 style={{ margin: '0.25rem 0', fontSize: '1.9rem', fontWeight: 900, color: '#0f172a' }}>
            Unified Marketplace, Tours &amp; Offers Studio
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
            Manage packages, tours, programs, activities, and discount promotions for the main website and individual vendor minisites.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => startNewItem('package')}
            style={{ padding: '0.65rem 1.1rem', background: '#D4AF37', color: '#1a1000', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}
          >
            <i className="fas fa-plus-circle" /> Create New Package
          </button>
          <button
            onClick={() => startNewItem('tour')}
            style={{ padding: '0.65rem 1.1rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fas fa-compass" /> Create Tour / Safari
          </button>
          <button
            onClick={() => startNewItem('discount_offer')}
            style={{ padding: '0.65rem 1.1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fas fa-tags" /> Add Special Offer / Discount
          </button>
        </div>
      </header>

      {/* ── SUPER ADMIN DUAL-MODE GOVERNANCE BAR ── */}
      <section style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          
          {/* Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fas fa-user-shield" style={{ color: '#6366f1', marginRight: '6px' }} />
              Management Mode:
            </span>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
              <button
                onClick={() => setMode('all')}
                style={{ border: 'none', background: mode === 'all' ? '#0f172a' : 'transparent', color: mode === 'all' ? '#fff' : '#64748b', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                All Platform Items ({items.length})
              </button>
              <button
                onClick={() => setMode('platform')}
                style={{ border: 'none', background: mode === 'platform' ? '#D4AF37' : 'transparent', color: mode === 'platform' ? '#1a1000' : '#64748b', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                🌐 Main Portal Catalog
              </button>
              <button
                onClick={() => setMode('vendor_proxy')}
                style={{ border: 'none', background: mode === 'vendor_proxy' ? '#6366f1' : 'transparent', color: mode === 'vendor_proxy' ? '#fff' : '#64748b', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                🏪 Vendor Minisite
              </button>
              <button
                onClick={() => setMode('multi_vendor')}
                style={{ border: 'none', background: mode === 'multi_vendor' ? '#10b981' : 'transparent', color: mode === 'multi_vendor' ? '#fff' : '#64748b', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                🤝 Multi-Vendor Bundles
              </button>
            </div>
          </div>

          {/* Vendor Selector Dropdown (When in Vendor Proxy mode) */}
          {mode === 'vendor_proxy' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', border: '1.5px solid #6366f1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, background: '#eef2ff', color: '#312e81' }}
              >
                <option value="">-- Choose Vendor to Proxy / Seed Data --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type_name || 'Business'}) · Tier: {b.subscription_tier || 'free'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {/* Search */}
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, business, or code..."
            style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
          />

          {/* Item Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <option value="all">All Types (Packages, Tours, Offers...)</option>
            <option value="package">📦 Packages &amp; Bundles</option>
            <option value="tour">🧭 Tours &amp; Safaris</option>
            <option value="activity">🎯 Activities &amp; Day Trips</option>
            <option value="discount_offer">🏷️ Special Offers &amp; Discounts</option>
            <option value="room_bundle">🛏️ Stay &amp; Room Packages</option>
            <option value="retreat">🧘 Wellness Retreats</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <option value="all">All Statuses</option>
            <option value="approved">✅ Approved &amp; Live</option>
            <option value="pending_approval">⏳ Pending Moderation</option>
            <option value="draft">📝 Draft (Private)</option>
            <option value="suspended">⏸️ Suspended</option>
          </select>
        </div>
      </section>

      {/* ── INVENTORY GRID ── */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#D4AF37', marginBottom: '1rem', display: 'block' }} />
          Loading Marketplace Engine...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px dashed #cbd5e1', borderRadius: '18px', padding: '5rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>No Items Found</h3>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem' }}>
            No marketplace items match your active filters. Create one above to get started.
          </p>
          <button
            onClick={() => startNewItem('package')}
            style={{ padding: '0.65rem 1.25rem', background: '#D4AF37', color: '#1a1000', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            + Create First Package
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredItems.map((item) => {
            const hasDiscount = (item.discount_percentage > 0) || (item.original_price && item.original_price > item.price_amount);
            const coverImage = item.media?.[0]?.url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600';

            return (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  border: item.is_featured ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: item.is_featured ? '0 4px 20px rgba(212,175,55,0.15)' : '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s'
                }}
              >
                {/* Card Top Image & Badges */}
                <div style={{ height: '170px', position: 'relative', background: '#090e17' }}>
                  <img src={coverImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {/* Status Badge */}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      background: item.status === 'approved' ? '#16a34a' : item.status === 'pending_approval' ? '#eab308' : item.status === 'suspended' ? '#ef4444' : '#64748b',
                      color: '#fff'
                    }}>
                      {item.status}
                    </span>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      background: '#0f172a',
                      color: '#fff',
                      textTransform: 'uppercase'
                    }}>
                      {item.item_type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Featured Crown */}
                  {item.is_featured && (
                    <div style={{ position: 'absolute', top: 10, right: 10, background: '#D4AF37', color: '#1a1000', fontSize: '0.65rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fas fa-crown" /> FEATURED
                    </div>
                  )}

                  {/* Savings Tag */}
                  {hasDiscount && (
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: '#dc2626', color: '#fff', fontSize: '0.68rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px' }}>
                      {item.discount_percentage ? `${item.discount_percentage}% OFF` : 'SPECIAL OFFER'}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Business Attribution & Scope Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    {item.target_scope === 'multi_business' && (item.assignments?.length || 0) > 0 ? (
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px' }}>
                        🤝 Multi-Vendor ({item.assignments?.length} Partners)
                      </span>
                    ) : item.target_scope === 'parent_category' ? (
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '12px' }}>
                        📁 Parent Sector Syndicate
                      </span>
                    ) : item.target_scope === 'child_typology' ? (
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '12px' }}>
                        📂 Typology Syndicate
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: item.business_name ? '#6366f1' : '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <i className={`fas ${item.business_name ? 'fa-store' : 'fa-globe'}`} style={{ marginRight: '5px' }} />
                        {item.business_name ? `${item.business_name} (${item.business_type_name || 'Vendor'})` : 'Main Portal Platform Offer'}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                    {item.title}
                  </h3>
                  {item.title_ar && (
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textAlign: 'right', direction: 'rtl', marginBottom: '0.5rem' }}>
                      {item.title_ar}
                    </div>
                  )}

                  {/* Pricing & Duration */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0.75rem 0', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                        {item.price_amount > 0 ? `${item.price_amount} ${item.currency}` : 'Free / Contact'}
                      </span>
                      {item.original_price && (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                          {item.original_price} {item.currency}
                        </span>
                      )}
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                        {item.pricing_unit.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>
                      <i className="fas fa-clock" style={{ marginRight: '4px', color: '#D4AF37' }} />
                      {item.duration_value} {item.duration_type.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Visibility Toggles */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.publish_on_minisite}
                        onChange={() => toggleVisibility(item, 'publish_on_minisite')}
                      />
                      Minisite
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.publish_on_main_portal}
                        onChange={() => toggleVisibility(item, 'publish_on_main_portal')}
                      />
                      Main Portal
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleFeatured(item)}
                      style={{ border: 'none', background: 'transparent', color: item.is_featured ? '#D4AF37' : '#94a3b8', cursor: 'pointer', fontWeight: 800 }}
                    >
                      👑 {item.is_featured ? 'Featured' : 'Make Featured'}
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => { setEditingItem(item); setActiveTab('basics'); }}
                      style={{ flex: 1, padding: '0.55rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <i className="fas fa-edit" /> Edit
                    </button>

                    {item.status !== 'approved' && (
                      <button
                        onClick={() => toggleStatus(item, 'approved')}
                        style={{ padding: '0.55rem 0.75rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        title="Approve &amp; Publish Live"
                      >
                        <i className="fas fa-check" />
                      </button>
                    )}

                    {item.status === 'approved' && (
                      <button
                        onClick={() => toggleStatus(item, 'suspended')}
                        style={{ padding: '0.55rem 0.75rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        title="Suspend Item"
                      >
                        <i className="fas fa-pause" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: '0.55rem 0.75rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      title="Delete"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EDIT / CREATE MODAL ── */}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '20px 20px 0 0' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  {editingItem.id ? 'Edit Marketplace Offer / Tour' : 'Create New Marketplace Item'}
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Universal inventory builder with typology-adaptive pricing and itinerary
                </span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#fff', padding: '0 1rem', overflowX: 'auto' }}>
              {([
                ['basics', '1. Basics & Details'],
                ['pricing_discounts', '2. Pricing & Discounts'],
                ['itinerary', '3. Multi-Day Itinerary'],
                ['media', '4. Media & Photos'],
                ['targeting_forwarding', '5. 🎯 Targeting & Multi-Vendor'],
                ['governance', '6. Governance & Booking']
              ] as const).map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  style={{
                    padding: '0.8rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: activeTab === tabKey ? '3px solid #D4AF37' : '3px solid transparent',
                    color: activeTab === tabKey ? '#0f172a' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', flex: 1, display: 'grid', gap: '1.25rem' }}>
              
              {/* TAB 1: BASICS */}
              {activeTab === 'basics' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        ASSIGN TO BUSINESS (OR LEAVE BLANK FOR GLOBAL PLATFORM)
                      </label>
                      <select
                        value={editingItem.business_id || ''}
                        onChange={(e) => setEditingItem((p) => ({ ...p, business_id: e.target.value || null }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        <option value="">🌐 Global Platform (SiWiFy Main Marketplace)</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.type_name || 'Business'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        ITEM TYPE
                      </label>
                      <select
                        value={editingItem.item_type || 'package'}
                        onChange={(e) => setEditingItem((p) => ({ ...p, item_type: e.target.value as any }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        <option value="package">📦 Multi-Day Package &amp; Bundle</option>
                        <option value="tour">🧭 Desert Tour / Safari / Itinerary</option>
                        <option value="activity">🎯 Single Activity / Experience</option>
                        <option value="discount_offer">🏷️ Special Discount &amp; Promo Code</option>
                        <option value="room_bundle">🛏️ Stay &amp; Room Package</option>
                        <option value="retreat">🧘 Wellness &amp; Yoga Retreat</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        TITLE (ENGLISH) *
                      </label>
                      <input
                        value={editingItem.title || ''}
                        onChange={(e) => setEditingItem((p) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. 3-Day Magic of Siwa Discovery Package"
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem', textAlign: 'right' }}>
                        عنوان الباقة أو الرحلة (بالعربية)
                      </label>
                      <input
                        value={editingItem.title_ar || ''}
                        onChange={(e) => setEditingItem((p) => ({ ...p, title_ar: e.target.value }))}
                        placeholder="مثال: برنامج ٣ أيام لاكتشاف سحر واحة سيوة"
                        dir="rtl"
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        DESCRIPTION (ENGLISH)
                      </label>
                      <textarea
                        value={editingItem.description || ''}
                        onChange={(e) => setEditingItem((p) => ({ ...p, description: e.target.value }))}
                        rows={4}
                        placeholder="Describe the package highlights, experiences, and journey details..."
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem', textAlign: 'right' }}>
                        الوصف الكامل (بالعربية)
                      </label>
                      <textarea
                        value={editingItem.description_ar || ''}
                        onChange={(e) => setEditingItem((p) => ({ ...p, description_ar: e.target.value }))}
                        rows={4}
                        dir="rtl"
                        placeholder="اكتب تفاصيل ومميزات البرنامج والرحلة باللغة العربية..."
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'right', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & DISCOUNTS */}
              {activeTab === 'pricing_discounts' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        PRICE AMOUNT
                      </label>
                      <input
                        type="number"
                        value={editingItem.price_amount ?? 0}
                        onChange={(e) => setEditingItem((p) => ({ ...p, price_amount: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        ORIGINAL / STRIKETHROUGH PRICE
                      </label>
                      <input
                        type="number"
                        value={editingItem.original_price ?? ''}
                        onChange={(e) => setEditingItem((p) => ({ ...p, original_price: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="e.g. 2500"
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        CURRENCY
                      </label>
                      <select
                        value={editingItem.currency || 'EGP'}
                        onChange={(e) => setEditingItem((p) => ({ ...p, currency: e.target.value }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}
                      >
                        <option value="EGP">EGP (Egyptian Pound)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        PRICING UNIT
                      </label>
                      <select
                        value={editingItem.pricing_unit || 'per_person'}
                        onChange={(e) => setEditingItem((p) => ({ ...p, pricing_unit: e.target.value as any }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        <option value="per_person">Per Person</option>
                        <option value="per_group">Per Group / Vehicle</option>
                        <option value="per_room">Per Room / Night</option>
                        <option value="fixed">Fixed Flat Rate</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Discounts Panel */}
                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-percent" style={{ color: '#16a34a' }} />
                      Special Promotion &amp; Discount Configuration
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                          DISCOUNT TYPE
                        </label>
                        <select
                          value={editingItem.discount_type || 'none'}
                          onChange={(e) => setEditingItem((p) => ({ ...p, discount_type: e.target.value as any }))}
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        >
                          <option value="none">No Discount</option>
                          <option value="percent">Percentage Off (%)</option>
                          <option value="fixed">Fixed Amount Off</option>
                          <option value="early_bird">Early Bird Advance Booking</option>
                          <option value="coupon">Coupon Code Required</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                          DISCOUNT PERCENTAGE (%)
                        </label>
                        <input
                          type="number"
                          value={editingItem.discount_percentage ?? 0}
                          onChange={(e) => setEditingItem((p) => ({ ...p, discount_percentage: Number(e.target.value) }))}
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                          PROMO COUPON CODE (OPTIONAL)
                        </label>
                        <input
                          value={editingItem.coupon_code || ''}
                          onChange={(e) => setEditingItem((p) => ({ ...p, coupon_code: e.target.value.toUpperCase() }))}
                          placeholder="e.g. SIWA20"
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ITINERARY */}
              {activeTab === 'itinerary' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>Day-by-Day Journey Itinerary</h4>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Add sequential milestones for tours and multi-day packages.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingItem((p) => ({
                        ...p,
                        itinerary: [...(p?.itinerary || []), { day: (p?.itinerary?.length || 0) + 1, title: '', title_ar: '', description: '', description_ar: '' }]
                      }))}
                      style={{ padding: '0.45rem 0.9rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Add Day / Milestone
                    </button>
                  </div>

                  {(editingItem.itinerary || []).map((step, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.9rem', display: 'grid', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#D4AF37' }}>
                          DAY {step.day || idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingItem((p) => ({ ...p, itinerary: (p?.itinerary || []).filter((_, i) => i !== idx) }))}
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 800 }}
                        >
                          Remove Day
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          value={step.title}
                          onChange={(e) => {
                            const next = [...(editingItem.itinerary || [])];
                            next[idx].title = e.target.value;
                            setEditingItem((p) => ({ ...p, itinerary: next }));
                          }}
                          placeholder="Day Title (e.g. Great Sand Sea Safari &amp; Sunset Camp)"
                          style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        />
                        <input
                          value={step.title_ar || ''}
                          onChange={(e) => {
                            const next = [...(editingItem.itinerary || [])];
                            next[idx].title_ar = e.target.value;
                            setEditingItem((p) => ({ ...p, itinerary: next }));
                          }}
                          placeholder="عنوان اليوم بالعربية"
                          dir="rtl"
                          style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', textAlign: 'right' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: MEDIA & FEATURES */}
              {activeTab === 'media' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Photo Adder */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                      ADD PHOTO URL TO GALLERY
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="https://... (image URL)"
                        style={{ flex: 1, padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newMediaUrl.trim()) return;
                          setEditingItem((p) => ({ ...p, media: [...(p?.media || []), { url: newMediaUrl.trim() }] }));
                          setNewMediaUrl('');
                        }}
                        style={{ padding: '0 1.25rem', background: '#D4AF37', color: '#1a1000', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        + Add Photo
                      </button>
                    </div>
                  </div>

                  {/* Media Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    {(editingItem.media || []).map((m, idx) => (
                      <div key={idx} style={{ height: '90px', position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                        <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setEditingItem((p) => ({ ...p, media: (p?.media || []).filter((_, i) => i !== idx) }))}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: TARGETING & MULTI-VENDOR FORWARDING */}
              {activeTab === 'targeting_forwarding' && (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  
                  {/* Scope Selection Cards */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: '#334155', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                      DISTRIBUTION &amp; ASSIGNMENT TARGET SCOPE
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {[
                        {
                          id: 'platform',
                          icon: '🌐',
                          title: 'Platform Exclusive',
                          desc: 'SiWiFy flagship tour. Managed centrally by platform concierge.'
                        },
                        {
                          id: 'parent_category',
                          icon: '🏛️',
                          title: 'Parent Sector',
                          desc: 'Auto-syndicate to all vendors in a major sector (e.g., all Eco-Lodges).'
                        },
                        {
                          id: 'child_typology',
                          icon: '🎯',
                          title: 'Child Typology',
                          desc: 'Target specialized vendors belonging to a specific sub-niche.'
                        },
                        {
                          id: 'multi_business',
                          icon: '🤝',
                          title: 'Multi-Vendor Bundle',
                          desc: 'Joint itinerary combining 2+ businesses with custom roles & splits.'
                        }
                      ].map(card => {
                        const isSelected = (editingItem.target_scope || 'platform') === card.id;
                        return (
                          <div
                            key={card.id}
                            onClick={() => setEditingItem(p => ({ ...p, target_scope: card.id as any }))}
                            style={{
                              padding: '0.9rem',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                              background: isSelected ? 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(245,158,11,0.04))' : '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
                              {isSelected && <span style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 900, background: '#fef3c7', padding: '2px 8px', borderRadius: '12px' }}>ACTIVE</span>}
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: isSelected ? '#92400e' : '#1e293b' }}>
                              {card.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3 }}>
                              {card.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contextual Sub-Selectors based on scope */}
                  {editingItem.target_scope === 'parent_category' && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.4rem' }}>
                        SELECT PARENT CATEGORY / SECTOR
                      </label>
                      <select
                        value={editingItem.target_type_id || ''}
                        onChange={(e) => setEditingItem(p => ({ ...p, target_type_id: e.target.value }))}
                        style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}
                      >
                        <option value="">-- Choose Parent Sector --</option>
                        {parentTypes.map(pt => (
                          <option key={pt.id} value={pt.id}>
                            {pt.icon || '📁'} {pt.name_en || pt.name} ({pt.name_ar || 'قطاع'})
                          </option>
                        ))}
                      </select>
                      {editingItem.target_type_id && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#475569', background: '#e2e8f0', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                          ⚡ <strong>Auto-Syndication Active:</strong> All businesses registered under this parent category (and its child sub-types) will automatically receive and co-host this package in their minisites.
                        </div>
                      )}
                    </div>
                  )}

                  {editingItem.target_scope === 'child_typology' && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.4rem' }}>
                        SELECT CHILD TYPOLOGY
                      </label>
                      <select
                        value={editingItem.target_type_id || ''}
                        onChange={(e) => setEditingItem(p => ({ ...p, target_type_id: e.target.value }))}
                        style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}
                      >
                        <option value="">-- Choose Sub-Typology --</option>
                        {childTypes.map(ct => (
                          <option key={ct.id} value={ct.id}>
                            {ct.icon || '🏷️'} {ct.name_en || ct.name} ({ct.name_ar || 'نوع فرعي'})
                          </option>
                        ))}
                      </select>
                      {editingItem.target_type_id && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#475569', background: '#e2e8f0', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                          🎯 <strong>Specialized Targeting Active:</strong> All businesses matching this exact typology will be syndicated with this package.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multi-Vendor / Custom Assigned Partners Builder */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                          🤝 Multi-Business Joint Team &amp; Forwarding Matrix
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Assign specific vendors to co-deliver this experience, allocate revenue shares, and check tier capabilities.
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', color: '#334155' }}>
                        {editingItem.assignments?.length || 0} Vendors Assigned
                      </span>
                    </div>

                    {/* Add Partner Form */}
                    <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto', gap: '0.6rem', alignItems: 'end', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                          SELECT VENDOR BUSINESS
                        </label>
                        <select
                          value={partnerToAdd.business_id}
                          onChange={(e) => setPartnerToAdd(p => ({ ...p, business_id: e.target.value }))}
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          <option value="">-- Choose Business --</option>
                          {businesses.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.subscription_tier ? b.subscription_tier.toUpperCase() : 'FREE'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                          ASSIGNED ROLE
                        </label>
                        <select
                          value={partnerToAdd.role}
                          onChange={(e) => setPartnerToAdd(p => ({ ...p, role: e.target.value }))}
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          <option value="lead_organizer">👑 Lead Organizer / Host</option>
                          <option value="accommodation">🏨 Hotel / Ecolodge / Camp</option>
                          <option value="safari_transport">🚙 4x4 Dune Safari / Transfer</option>
                          <option value="guide">🧭 Certified Eco/Bedouin Guide</option>
                          <option value="dining">🍽️ Traditional Bedouin Dining</option>
                          <option value="wellness">🌿 Salt Lake / Sand Bath / Spa</option>
                          <option value="partner">🤝 Service Partner</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                          REV SHARE %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={partnerToAdd.commission_split_pct}
                          onChange={(e) => setPartnerToAdd(p => ({ ...p, commission_split_pct: Number(e.target.value) }))}
                          placeholder="e.g. 35"
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={addPartnerToEditingItem}
                        style={{
                          padding: '0.55rem 1rem',
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          height: '35px'
                        }}
                      >
                        + Add Partner
                      </button>
                    </div>

                    {/* Assigned Partners Table / Cards */}
                    {(!editingItem.assignments || editingItem.assignments.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', background: '#fafafa', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.78rem' }}>
                        No individual vendor partners assigned yet. If using Parent or Child scope, all matching vendors are included automatically.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {editingItem.assignments.map((assign, idx) => {
                          const biz = businesses.find(b => String(b.id) === String(assign.business_id));
                          const tier = (biz?.subscription_tier || 'free').toLowerCase();
                          const isLowTier = tier === 'free' || tier === 'basic';
                          const tierColor = tier === 'vip' ? '#10b981' : tier === 'gold' ? '#d97706' : tier === 'premium' ? '#8b5cf6' : tier === 'basic' ? '#3b82f6' : '#6b7280';

                          return (
                            <div
                              key={assign.business_id || idx}
                              style={{
                                padding: '0.85rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                display: 'grid',
                                gridTemplateColumns: '2fr 1.5fr 1fr auto auto',
                                gap: '0.75rem',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b' }}>
                                    {biz?.name || `Business #${assign.business_id}`}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 900,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: `${tierColor}15`,
                                      color: tierColor,
                                      border: `1px solid ${tierColor}40`
                                    }}
                                  >
                                    {tier.toUpperCase()}
                                  </span>
                                </div>
                                {isLowTier && (
                                  <div style={{ fontSize: '0.65rem', color: '#d97706', marginTop: '2px', fontWeight: 600 }}>
                                    ⚠️ Standard Tier: Bookings routed via admin. Upgrade to Gold/VIP for direct WhatsApp routing.
                                  </div>
                                )}
                              </div>

                              <div>
                                <select
                                  value={assign.role || 'partner'}
                                  onChange={(e) => updatePartnerInEditingItem(String(assign.business_id), { role: e.target.value })}
                                  style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  <option value="lead_organizer">👑 Lead Host</option>
                                  <option value="accommodation">🏨 Hotel/Camp</option>
                                  <option value="safari_transport">🚙 4x4 Safari</option>
                                  <option value="guide">🧭 Guide</option>
                                  <option value="dining">🍽️ Dining</option>
                                  <option value="wellness">🌿 Wellness/Spa</option>
                                  <option value="partner">🤝 Partner</option>
                                </select>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={assign.commission_split_pct || 0}
                                  onChange={(e) => updatePartnerInEditingItem(String(assign.business_id), { commission_split_pct: Number(e.target.value) })}
                                  style={{ width: '60px', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}
                                />
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>%</span>
                              </div>

                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#334155', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <input
                                  type="checkbox"
                                  checked={assign.visible_on_minisite !== false}
                                  onChange={(e) => updatePartnerInEditingItem(String(assign.business_id), { visible_on_minisite: e.target.checked })}
                                />
                                Show on Minisite
                              </label>

                              <button
                                type="button"
                                onClick={() => removePartnerFromEditingItem(String(assign.business_id))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' }}
                                title="Remove Vendor"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}

                        {/* Revenue Split Summary */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                          <span style={{ color: '#64748b' }}>Total Revenue Share Allocated:</span>
                          <span
                            style={{
                              color: (editingItem.assignments.reduce((sum, a) => sum + (Number(a.commission_split_pct) || 0), 0)) === 100 ? '#10b981' : '#f59e0b',
                              background: '#fff',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            {editingItem.assignments.reduce((sum, a) => sum + (Number(a.commission_split_pct) || 0), 0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 6: GOVERNANCE & BOOKING */}
              {activeTab === 'governance' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        PUBLICATION &amp; MODERATION STATUS
                      </label>
                      <select
                        value={editingItem.status || 'approved'}
                        onChange={(e) => setEditingItem((p) => ({ ...p, status: e.target.value as any }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        <option value="approved">✅ Approved &amp; Live Publicly</option>
                        <option value="pending_approval">⏳ Pending Moderation</option>
                        <option value="draft">📝 Draft Mode (Private)</option>
                        <option value="suspended">⏸️ Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                        BOOKING CTA BEHAVIOR
                      </label>
                      <select
                        value={editingItem.booking_cta_type || 'whatsapp'}
                        onChange={(e) => setEditingItem((p) => ({ ...p, booking_cta_type: e.target.value as any }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        <option value="whatsapp">Direct WhatsApp Inquiry</option>
                        <option value="phone">Direct Phone Call</option>
                        <option value="url">External Booking Link (URL)</option>
                        <option value="custom_quote">Request Custom Journey Quote</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingItem.publish_on_minisite !== false}
                        onChange={(e) => setEditingItem((p) => ({ ...p, publish_on_minisite: e.target.checked }))}
                      />
                      Publish on Vendor Minisite Catalog
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingItem.publish_on_main_portal !== false}
                        onChange={(e) => setEditingItem((p) => ({ ...p, publish_on_main_portal: e.target.checked }))}
                      />
                      Show on Main SiWiFy Marketplace
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!editingItem.is_featured}
                        onChange={(e) => setEditingItem((p) => ({ ...p, is_featured: e.target.checked }))}
                      />
                      👑 Featured Spotlight Item
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderRadius: '0 0 20px 20px' }}>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ padding: '0.65rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', color: '#475569', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={saving}
                style={{ padding: '0.65rem 1.75rem', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #D4AF37, #f59e0b)', color: '#1a1000', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.82rem', cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(212,175,55,0.35)' }}
              >
                <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                {saving ? 'Saving...' : (editingItem.id ? 'Save Changes' : 'Create & Publish Item')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
