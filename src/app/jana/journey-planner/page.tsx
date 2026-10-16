'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CatalogItem {
  id: string;
  is_visible: boolean;
  vendor_business_ids: string[];
  image?: string;
  icon?: string;
  title_en?: string;
  title_ar?: string;
  name_en?: string;
  name_ar?: string;
  category?: string;
  category_ar?: string;
  duration?: string;
  duration_ar?: string;
  base_price_egp?: number;
  price_per_night?: number;
  rate_per_day?: number;
  price_per_person?: number;
  highlight_en?: string;
  highlight_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  badge_en?: string;
  badge_ar?: string;
}

interface CustomQueueItem {
  request_id: string;
  request_code: string;
  customer_name: string;
  customer_phone: string;
  wish_index: number;
  category: string;
  title: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  duration: string;
  notes: string;
  created_at: string;
  status: 'pending' | 'approved';
}

interface BookingItem {
  id: string;
  request_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  duration_days: number;
  travel_dates: string;
  adults_count: number;
  children_count: number;
  selected_experiences: any;
  accommodation_preference: string;
  transport_preference: string;
  meal_preference: string;
  estimated_price: number;
  discount_amount: number;
  final_price: number;
  status: string;
  distribution_status: string;
  itinerary_name: string;
  itinerary_summary: string;
  custom_details: any;
  created_at: string;
}

export default function JanaJourneyPlannerPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'deals' | 'moderation' | 'pms'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'experiences' | 'accommodations' | 'transports' | 'meals'>('all');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<any>(null);
  const [revision, setRevision] = useState(1);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [customQueue, setCustomQueue] = useState<CustomQueueItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Modal for new item
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<'experiences' | 'accommodations' | 'transports' | 'meals'>('experiences');
  const [newItem, setNewItem] = useState<any>({
    title_en: '',
    title_ar: '',
    category: 'Safari & Adventure',
    duration: '3-4 Hours',
    price: 500,
    highlight_en: '',
    icon: '✨',
    vendor_business_ids: [],
  });

  // Modal for approving custom wish
  const [approvingWish, setApprovingWish] = useState<CustomQueueItem | null>(null);
  const [wishTargetGroup, setWishTargetGroup] = useState<'experiences' | 'accommodations' | 'transports' | 'meals'>('experiences');
  const [wishApprovedPrice, setWishApprovedPrice] = useState<number>(650);

  const fetchPlannerData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jana/journey-planner');
      const data = await res.json();
      if (data.success) {
        setCatalog(data.catalog);
        setRevision(data.revision);
        setBusinesses(data.businesses || []);
        setBookings(data.bookings || []);
        setCustomQueue(data.customQueue || []);
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading Journey Planner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const saveCatalog = async (updatedCatalog = catalog) => {
    setSaving(true);
    try {
      const res = await fetch('/api/jana/journey-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_catalog',
          catalog: updatedCatalog,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Catalog & Deals successfully saved!');
        setCatalog(updatedCatalog);
        setRevision(r => r + 1);
      } else {
        showToast(data.error || 'Failed to save catalog');
      }
    } catch {
      showToast('Network error while saving catalog');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = (group: string, id: string) => {
    if (!catalog) return;
    const updated = {
      ...catalog,
      [group]: catalog[group].map((item: any) =>
        item.id === id ? { ...item, is_visible: !item.is_visible } : item
      ),
    };
    setCatalog(updated);
    saveCatalog(updated);
  };

  const handlePriceChange = (group: string, id: string, newPrice: number) => {
    if (!catalog) return;
    const priceKey = group === 'experiences' ? 'base_price_egp'
      : group === 'accommodations' ? 'price_per_night'
      : group === 'transports' ? 'rate_per_day' : 'price_per_person';

    const updated = {
      ...catalog,
      [group]: catalog[group].map((item: any) =>
        item.id === id ? { ...item, [priceKey]: Math.max(0, newPrice) } : item
      ),
    };
    setCatalog(updated);
  };

  const handleVendorAssignment = (group: string, id: string, vendorId: string) => {
    if (!catalog) return;
    const updated = {
      ...catalog,
      [group]: catalog[group].map((item: any) => {
        if (item.id !== id) return item;
        const current = item.vendor_business_ids || [];
        const next = current.includes(vendorId)
          ? current.filter((v: string) => v !== vendorId)
          : [...current, vendorId];
        return { ...item, vendor_business_ids: next };
      }),
    };
    setCatalog(updated);
  };

  const handleCreateOffering = () => {
    if (!newItem.title_en?.trim()) {
      showToast('Please enter an offering title');
      return;
    }
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const group = addCategory;
    const itemData: any = {
      id,
      is_visible: true,
      vendor_business_ids: newItem.vendor_business_ids || [],
      icon: newItem.icon || '✨',
    };

    if (group === 'experiences') {
      itemData.title_en = newItem.title_en;
      itemData.title_ar = newItem.title_ar || newItem.title_en;
      itemData.category = newItem.category || 'Safari & Adventure';
      itemData.category_ar = 'سفاري ومغامرة';
      itemData.duration = newItem.duration || '3-4 Hours';
      itemData.duration_ar = '٣ - ٤ ساعات';
      itemData.base_price_egp = Number(newItem.price) || 500;
      itemData.highlight_en = newItem.highlight_en || '';
      itemData.highlight_ar = newItem.highlight_ar || '';
    } else if (group === 'accommodations') {
      itemData.name_en = newItem.title_en;
      itemData.name_ar = newItem.title_ar || newItem.title_en;
      itemData.desc_en = newItem.highlight_en || 'Luxury stay in Siwa Oasis';
      itemData.desc_ar = 'إقامة فاخرة في واحة سيوة';
      itemData.price_per_night = Number(newItem.price) || 800;
      itemData.badge_en = 'Curated';
      itemData.badge_ar = 'مختار بعناية';
    } else if (group === 'transports') {
      itemData.name_en = newItem.title_en;
      itemData.name_ar = newItem.title_ar || newItem.title_en;
      itemData.desc_en = newItem.highlight_en || 'Private transit';
      itemData.desc_ar = 'توصيل ونقل خاص';
      itemData.rate_per_day = Number(newItem.price) || 1200;
    } else {
      itemData.name_en = newItem.title_en;
      itemData.name_ar = newItem.title_ar || newItem.title_en;
      itemData.desc_en = newItem.highlight_en || 'Traditional dining';
      itemData.desc_ar = 'وليمة سيوية تقليدية';
      itemData.price_per_person = Number(newItem.price) || 300;
    }

    const updated = {
      ...catalog,
      [group]: [itemData, ...(catalog[group] || [])],
    };
    setCatalog(updated);
    saveCatalog(updated);
    setShowAddModal(false);
    setNewItem({
      title_en: '',
      title_ar: '',
      category: 'Safari & Adventure',
      duration: '3-4 Hours',
      price: 500,
      highlight_en: '',
      icon: '✨',
      vendor_business_ids: [],
    });
  };

  const handleApproveWish = async () => {
    if (!approvingWish) return;
    try {
      const res = await fetch('/api/jana/journey-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_custom_item',
          wish: approvingWish,
          target_group: wishTargetGroup,
          price: wishApprovedPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Approved "${approvingWish.title}" into catalog!`);
        setApprovingWish(null);
        fetchPlannerData();
      } else {
        showToast(data.error || 'Failed to approve item');
      }
    } catch {
      showToast('Error approving item');
    }
  };

  const handleUpdateBookingStatus = async (requestId: string, status: string, distStatus?: string) => {
    try {
      const res = await fetch('/api/jana/journey-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_booking_status',
          request_id: requestId,
          status,
          distribution_status: distStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Reservation status updated');
        setBookings(prev => prev.map(b => b.id === requestId ? { ...b, status, ...(distStatus ? { distribution_status: distStatus } : {}) } : b));
      }
    } catch {
      showToast('Failed to update status');
    }
  };

  const allOfferingsCount = catalog
    ? (catalog.experiences?.length || 0) +
      (catalog.accommodations?.length || 0) +
      (catalog.transports?.length || 0) +
      (catalog.meals?.length || 0)
    : 0;

  const pendingWishCount = customQueue.filter(q => q.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: '#D4AF37', color: '#000', padding: '0.85rem 1.75rem',
          borderRadius: '50px', fontWeight: 800, fontSize: '0.9rem',
          boxShadow: '0 10px 30px rgba(212,175,55,0.4)',
          animation: 'fadeSlideUp 0.3s ease',
        }}>
          <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }} />
          {toast}
        </div>
      )}

      {/* Header Bar */}
      <header style={{
        background: 'rgba(13,15,20,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '1.25rem 2rem', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link href="/jana/website" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#D4AF37', width: '38px', height: '38px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <i className="fas fa-arrow-left" />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                Smart Journey Planner <span style={{ color: '#D4AF37' }}>Command Center</span>
              </h1>
              <span style={{
                background: 'rgba(212,175,55,0.15)', color: '#D4AF37',
                border: '1px solid rgba(212,175,55,0.3)', padding: '0.2rem 0.65rem',
                borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800,
              }}>
                v{revision} Live
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Universal Multi-Sector Reservation System, Real-Time Deals Engine & Crowdsourced Ingestion
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #f0c842)',
              color: '#000', border: 'none', padding: '0.65rem 1.4rem',
              borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <i className="fas fa-plus" /> Add Offering
          </button>
          <button
            onClick={() => saveCatalog()}
            disabled={saving}
            style={{
              background: saving ? '#475569' : '#1e293b',
              color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
              padding: '0.65rem 1.4rem', borderRadius: '12px', fontWeight: 700,
              fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <i className={saving ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-arrow-up'} />
            {saving ? 'Saving...' : 'Deploy Changes'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem' }}>
        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: '#111520', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>CATALOG OFFERINGS</span>
              <i className="fas fa-layer-group" style={{ color: '#D4AF37' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginTop: '0.5rem' }}>
              {allOfferingsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Across 5 parent categories
            </div>
          </div>

          <div style={{ background: '#111520', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>COMBO DEAL BUNDLE</span>
              <i className="fas fa-percent" style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginTop: '0.5rem' }}>
              {catalog?.bundle_discount_percent || 15}% OFF
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Triggered on 3+ category selections
            </div>
          </div>

          <div style={{ background: '#111520', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>PENDING INGESTION QUEUE</span>
              <i className="fas fa-wand-magic-sparkles" style={{ color: '#ec4899' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: pendingWishCount > 0 ? '#ec4899' : '#fff', marginTop: '0.5rem' }}>
              {pendingWishCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Visitor custom unlisted wishes
            </div>
          </div>

          <div style={{ background: '#111520', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>RESERVATION REQUESTS (PMS)</span>
              <i className="fas fa-clipboard-list" style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', marginTop: '0.5rem' }}>
              {bookings.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Live customer journey bookings
            </div>
          </div>
        </div>

        {/* Primary Tabs Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '2rem', overflowX: 'auto' }}>
          {[
            { id: 'catalog', label: '1. Offerings & Hierarchy', icon: 'fa-boxes-stacked', count: allOfferingsCount },
            { id: 'deals', label: '2. Deals & Discount Engine', icon: 'fa-tags', badge: `${catalog?.bundle_discount_percent || 15}%` },
            { id: 'moderation', label: '3. Crowdsourced Queue', icon: 'fa-inbox', badge: pendingWishCount ? `${pendingWishCount} New` : undefined, badgeColor: '#ec4899' },
            { id: 'pms', label: '4. Reservations PMS', icon: 'fa-calendar-check', count: bookings.length },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: active ? '#D4AF37' : '#94a3b8',
                  border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                  padding: '0.75rem 1.4rem', borderRadius: '14px',
                  fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                }}
              >
                <i className={`fas ${tab.icon}`} />
                {tab.label}
                {tab.badge && (
                  <span style={{
                    background: tab.badgeColor || '#10b981', color: '#fff',
                    padding: '0.15rem 0.5rem', borderRadius: '20px',
                    fontSize: '0.7rem', fontWeight: 900,
                  }}>
                    {tab.badge}
                  </span>
                )}
                {typeof tab.count === 'number' && !tab.badge && (
                  <span style={{
                    background: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
                    padding: '0.15rem 0.5rem', borderRadius: '20px',
                    fontSize: '0.7rem', fontWeight: 800,
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: CATALOG & HIERARCHY ───────────────────────────────────── */}
        {activeTab === 'catalog' && (
          <div>
            {/* Category Filter Chips */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Offerings', icon: 'fa-globe' },
                { id: 'accommodations', label: '🏨 Accommodations (Ecolodges/Hotels)', count: catalog?.accommodations?.length },
                { id: 'experiences', label: '🚙 Safaris & Tours', count: catalog?.experiences?.length },
                { id: 'transports', label: '🚐 Transportation & Transfers', count: catalog?.transports?.length },
                { id: 'meals', label: '🍽️ Dining & Feasts', count: catalog?.meals?.length },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  style={{
                    background: selectedCategory === cat.id ? '#D4AF37' : '#141824',
                    color: selectedCategory === cat.id ? '#000' : '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '0.5rem 1rem', borderRadius: '10px',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {cat.label} {cat.count !== undefined ? `(${cat.count})` : ''}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {/* Experiences / Safaris */}
              {(selectedCategory === 'all' || selectedCategory === 'experiences') &&
                catalog?.experiences?.map((item: any) => renderCatalogCard('experiences', item))}

              {/* Accommodations */}
              {(selectedCategory === 'all' || selectedCategory === 'accommodations') &&
                catalog?.accommodations?.map((item: any) => renderCatalogCard('accommodations', item))}

              {/* Transports */}
              {(selectedCategory === 'all' || selectedCategory === 'transports') &&
                catalog?.transports?.map((item: any) => renderCatalogCard('transports', item))}

              {/* Meals */}
              {(selectedCategory === 'all' || selectedCategory === 'meals') &&
                catalog?.meals?.map((item: any) => renderCatalogCard('meals', item))}
            </div>
          </div>
        )}

        {/* ─── TAB 2: DEALS & DISCOUNTS ENGINE ──────────────────────────────── */}
        {activeTab === 'deals' && (
          <div style={{ background: '#111520', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', maxWidth: '800px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-tags" style={{ color: '#D4AF37' }} /> Contextual Deals & Combo Discount Configuration
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>
              Visitors who bundle 3 or more parent selections (e.g. Accommodation + Safari + Dinner) automatically unlock this bundle discount. Flashing deal badges also notify them of exclusive extras.
            </p>

            <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Combo Bundle Discount Percentage (%)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={catalog?.bundle_discount_percent || 15}
                  onChange={(e) => setCatalog({ ...catalog, bundle_discount_percent: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: '#D4AF37', height: '8px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', minWidth: '80px', textAlign: 'right' }}>
                  {catalog?.bundle_discount_percent || 15}%
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                Deducted dynamically from the estimated total before WhatsApp dispatch and checkout.
              </p>
            </div>

            <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
                Active Flash Promotional Notifiers (Live beside selections)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { badge: '🔥 COMBO DEAL', text: 'Bundle with Safari & Save 15%', color: '#f59e0b' },
                  { badge: '🎁 COMPLIMENTARY', text: 'Free Bedouin sunset tea included with every tour', color: '#10b981' },
                  { badge: '⚡ INSTANT CONFIRMATION', text: 'Direct verified vendor WhatsApp dispatch', color: '#3b82f6' },
                  { badge: '🌟 MID-WEEK SPECIAL', text: 'Complimentary room upgrade subject to availability', color: '#a855f7' },
                ].map((deal, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: '#0a0d14', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ background: `${deal.color}22`, color: deal.color, border: `1px solid ${deal.color}44`, padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900 }}>
                      {deal.badge}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
                      {deal.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveCatalog()}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #f0c842)',
                color: '#000', border: 'none', padding: '0.85rem 2rem',
                borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              <i className="fas fa-check" /> Save Deal Engine Rules
            </button>
          </div>
        )}

        {/* ─── TAB 3: CROWDSOURCED QUEUE & MODERATION ────────────────────────── */}
        {activeTab === 'moderation' && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
                  Crowdsourced Discovery & Custom Ingestion Queue
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                  When visitors click "+ Add Custom Selection" in the journey planner, their custom wishes appear here. Admins can approve them directly into the public database.
                </p>
              </div>
            </div>

            {customQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#111520', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <i className="fas fa-inbox" style={{ fontSize: '2.5rem', color: '#64748b', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8' }}>No pending custom submissions</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '420px', margin: '0.5rem auto 0' }}>
                  When visitors request unlisted spots or activities in their journey planner, they will show up here for one-click catalog approval.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {customQueue.map((item, idx) => (
                  <div key={idx} style={{
                    background: '#111520', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px', padding: '1.5rem', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{
                          background: item.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(236,72,153,0.15)',
                          color: item.status === 'approved' ? '#10b981' : '#ec4899',
                          border: `1px solid ${item.status === 'approved' ? '#10b98144' : '#ec489944'}`,
                          padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                        }}>
                          {item.status === 'approved' ? '✅ In Catalog' : '✨ Custom Wish'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Ref: {item.request_code}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem' }}>
                        {item.title}
                      </h3>

                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem', background: '#0a0d14', padding: '0.75rem', borderRadius: '10px' }}>
                        <div><strong>Category:</strong> <span style={{ textTransform: 'capitalize', color: '#D4AF37' }}>{item.category}</span></div>
                        {item.start_date && <div><strong>Date:</strong> {item.start_date}</div>}
                        {item.start_time && <div><strong>Time:</strong> {item.start_time}</div>}
                        {item.notes && <div style={{ marginTop: '0.4rem', color: '#cbd5e1' }}><strong>Notes:</strong> &quot;{item.notes}&quot;</div>}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Requested by: <strong>{item.customer_name}</strong> ({item.customer_phone})
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.75rem' }}>
                      {item.status !== 'approved' && (
                        <button
                          onClick={() => {
                            setApprovingWish(item);
                            setWishTargetGroup(
                              item.category.includes('accom') ? 'accommodations'
                              : item.category.includes('trans') ? 'transports'
                              : item.category.includes('meal') ? 'meals' : 'experiences'
                            );
                          }}
                          style={{
                            flex: 1, background: '#D4AF37', color: '#000',
                            border: 'none', padding: '0.65rem', borderRadius: '10px',
                            fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                          }}
                        >
                          <i className="fas fa-check-circle" style={{ marginRight: '0.4rem' }} /> Approve & Save
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${item.customer_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'rgba(37,211,102,0.12)', color: '#25D366',
                          border: '1px solid rgba(37,211,102,0.3)', padding: '0.65rem 1rem',
                          borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem',
                          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}
                      >
                        <i className="fab fa-whatsapp" /> WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: RESERVATIONS PMS ───────────────────────────────────────── */}
        {activeTab === 'pms' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
                Universal Multi-Sector Reservation Manifest (PMS)
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Live customer journey requests with exact start/end dates and times across all sectors.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {bookings.map((b) => {
                let experiences: any[] = [];
                try {
                  experiences = typeof b.selected_experiences === 'string'
                    ? JSON.parse(b.selected_experiences) : b.selected_experiences || [];
                } catch {}

                let customDetails: any = {};
                try {
                  customDetails = typeof b.custom_details === 'string'
                    ? JSON.parse(b.custom_details) : b.custom_details || {};
                } catch {}

                return (
                  <div key={b.id} style={{
                    background: '#111520', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px', padding: '1.5rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                          <span style={{ background: '#D4AF37', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900 }}>
                            {b.request_code}
                          </span>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                            {b.customer_name}
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          <span><i className="fas fa-phone" style={{ marginRight: '0.3rem', color: '#D4AF37' }} /> {b.customer_phone}</span>
                          <span><i className="fas fa-clock" style={{ marginRight: '0.3rem', color: '#3b82f6' }} /> {b.duration_days} Days ({b.travel_dates || 'Flexible Dates'})</span>
                          <span><i className="fas fa-users" style={{ marginRight: '0.3rem', color: '#10b981' }} /> {b.adults_count} Adults, {b.children_count} Children</span>
                        </div>
                      </div>

                      {/* Pricing and Action Pills */}
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>
                            {Number(b.final_price).toLocaleString()} EGP
                          </span>
                          {b.discount_amount > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginLeft: '0.5rem', textDecoration: 'line-through' }}>
                              {Number(b.estimated_price).toLocaleString()} EGP
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select
                            value={b.status || 'open'}
                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                            style={{
                              background: '#0a0d14', color: '#cbd5e1',
                              border: '1px solid rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem',
                              borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                            }}
                          >
                            <option value="open">Open / Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <a
                            href={`https://wa.me/${b.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${b.customer_name}, regarding your Siwa Journey [${b.request_code}]:`)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#25D366', color: '#000', padding: '0.35rem 0.85rem',
                              borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem',
                              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem',
                            }}
                          >
                            <i className="fab fa-whatsapp" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Breakdown */}
                    <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800 }}>🏨 ACCOMMODATION</div>
                        <div style={{ color: '#cbd5e1', fontWeight: 600 }}>{b.accommodation_preference || 'Standard Ecolodge'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800 }}>🚐 TRANSPORTATION</div>
                        <div style={{ color: '#cbd5e1', fontWeight: 600 }}>{b.transport_preference || '4x4 Private'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800 }}>🍽️ DINING</div>
                        <div style={{ color: '#cbd5e1', fontWeight: 600 }}>{b.meal_preference || 'Traditional Siwan'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800 }}>🚙 SAFARIS & TOURS ({experiences.length})</div>
                        <div style={{ color: '#D4AF37', fontWeight: 600 }}>
                          {experiences.map((e: any) => e.title || e.title_en).join(', ') || 'None selected'}
                        </div>
                      </div>
                    </div>

                    {/* Custom Wishes badge if present */}
                    {customDetails?.custom_wishes && customDetails.custom_wishes.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 800 }}>
                          <i className="fas fa-sparkles" /> Custom Wishes:
                        </span>
                        {customDetails.custom_wishes.map((w: any, idx: number) => (
                          <span key={idx} style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.2)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                            {w.title} ({w.start_date || 'Flexible'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ─── MODAL: ADD CATALOG OFFERING ────────────────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#111520', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', maxWidth: '580px', width: '100%', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Add New Journey Offering</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Parent Sector</label>
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value as any)}
                  style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                >
                  <option value="experiences">🚙 Safaris & Tours</option>
                  <option value="accommodations">🏨 Accommodation (Ecolodge / Hotel)</option>
                  <option value="transports">🚐 Transportation & Transfers</option>
                  <option value="meals">🍽️ Dining & Feasts</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Offering Title (English) *</label>
                <input
                  type="text"
                  placeholder="e.g. 4x4 Sunset Safari at Bir Wahed"
                  value={newItem.title_en}
                  onChange={(e) => setNewItem({ ...newItem, title_en: e.target.value })}
                  style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Offering Title (Arabic)</label>
                <input
                  type="text"
                  placeholder="e.g. سفاري 4x4 عند الغروب في عين بئر واحد"
                  value={newItem.title_ar}
                  onChange={(e) => setNewItem({ ...newItem, title_ar: e.target.value })}
                  dir="rtl"
                  style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Base Price (EGP)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Duration / Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. 3-4 Hours or Per Night"
                    value={newItem.duration}
                    onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                    style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Highlights / Description</label>
                <textarea
                  rows={2}
                  placeholder="Key features, inclusions (e.g. Bedouin tea, 4x4 Land Cruiser, guide)"
                  value={newItem.highlight_en}
                  onChange={(e) => setNewItem({ ...newItem, highlight_en: e.target.value })}
                  style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOffering}
                  style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Add to Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPROVE CROWDSOURCED WISH ─────────────────────────────────── */}
      {approvingWish && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#111520', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', maxWidth: '520px', width: '100%', padding: '2rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Approve Custom Wish to Database
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Save <strong>&quot;{approvingWish.title}&quot;</strong> permanently into the official SiWiFy public journey catalog.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Target Catalog Group</label>
                <select
                  value={wishTargetGroup}
                  onChange={(e) => setWishTargetGroup(e.target.value as any)}
                  style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                >
                  <option value="experiences">🚙 Safaris & Tours (Experiences)</option>
                  <option value="accommodations">🏨 Accommodation</option>
                  <option value="transports">🚐 Transportation</option>
                  <option value="meals">🍽️ Dining & Culinary</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Catalog Price (EGP)</label>
                <input
                  type="number"
                  value={wishApprovedPrice}
                  onChange={(e) => setWishApprovedPrice(Number(e.target.value))}
                  style={{ width: '100%', background: '#0a0d14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setApprovingWish(null)}
                  style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveWish}
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Confirm & Deploy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderCatalogCard(group: string, item: any) {
    const title = item.title_en || item.name_en || 'Untitled';
    const subtitle = item.category || item.badge_en || '';
    const price = item.base_price_egp ?? item.price_per_night ?? item.rate_per_day ?? item.price_per_person ?? 0;
    const priceLabel = group === 'accommodations' ? '/ night'
      : group === 'transports' ? '/ day'
      : group === 'meals' ? '/ person' : '';

    return (
      <div key={item.id} style={{
        background: '#111520', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', opacity: item.is_visible ? 1 : 0.5,
        transition: 'all 0.2s ease',
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{item.icon || (group === 'accommodations' ? '🏨' : group === 'transports' ? '🚐' : group === 'meals' ? '🍽️' : '🚙')}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => handleToggleVisibility(group, item.id)}
                title={item.is_visible ? 'Visible on main site' : 'Hidden from main site'}
                style={{
                  background: item.is_visible ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: item.is_visible ? '#10b981' : '#ef4444',
                  border: 'none', padding: '0.25rem 0.65rem', borderRadius: '8px',
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                }}
              >
                {item.is_visible ? 'ACTIVE' : 'HIDDEN'}
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#fff' }}>
            {title}
          </h3>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 700, marginBottom: '0.75rem' }}>
              {subtitle}
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>
            {item.highlight_en || item.desc_en || 'Siwa Oasis curated option'}
          </p>
        </div>

        <div>
          {/* Price setting */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0d14', padding: '0.65rem 0.85rem', borderRadius: '10px', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>PRICE {priceLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(group, item.id, Number(e.target.value))}
                style={{ width: '80px', background: 'transparent', border: 'none', color: '#10b981', fontWeight: 800, fontSize: '1rem', textAlign: 'right', outline: 'none' }}
              />
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>EGP</span>
            </div>
          </div>

          {/* Linked Vendors dropdown */}
          <div style={{ fontSize: '0.75rem' }}>
            <div style={{ color: '#64748b', fontWeight: 700, marginBottom: '0.35rem' }}>
              ASSIGNED VENDOR BUSINESSES ({item.vendor_business_ids?.length || 0}):
            </div>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleVendorAssignment(group, item.id, e.target.value);
              }}
              style={{ width: '100%', background: '#0a0d14', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.75rem' }}
            >
              <option value="">+ Link registered vendor...</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {item.vendor_business_ids?.includes(b.id) ? '✓ ' : ''}{b.name} ({b.type_name || 'Business'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }
}
