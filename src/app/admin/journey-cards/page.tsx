'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ────────────────────────────── Types ────────────────────────────── */

interface JourneyCatalogItemBase {
  id: string;
  is_visible: boolean;
  vendor_business_ids: string[];
  image?: string;
  icon?: string;
  commercial_item_id?: string;
  business_id?: string;
  business_name?: string;
  business_slug?: string;
  business_phone?: string | null;
  whatsapp_number?: string;
  provider_type?: 'hotel' | 'operator' | 'siwify_direct' | 'artisan';
  parent_business_type_id?: string;
  child_business_type_id?: string;
  provider_badge?: string;
  is_trusted?: boolean;
  ota_benchmark_price?: number;
  ota_name?: string;
  external_check_url?: string | null;
  minisite_url?: string;
  direct_discount_note?: string;
  rating?: number;
  reviews_count?: number;
  location_name?: string;
  gallery_images?: string[];
  // Vibe, View & Sectional Experience DNA
  vibe_tags?: string[];
  setting_location?: string;
  view_type?: string;
  vibe_ambience?: string;
  seating_style?: string;
  menu_highlights?: string[];
  vehicle_type?: string;
  treatment_type?: string;
}

interface JourneyExperience extends JourneyCatalogItemBase {
  title_en: string;
  title_ar: string;
  category: string;
  category_ar: string;
  duration: string;
  duration_ar: string;
  base_price_egp: number;
  highlight_en: string;
  highlight_ar: string;
}

interface JourneyAccommodation extends JourneyCatalogItemBase {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  price_per_night: number;
  badge_en: string;
  badge_ar: string;
}

interface JourneyTransport extends JourneyCatalogItemBase {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  rate_per_day: number;
}

interface JourneyMeal extends JourneyCatalogItemBase {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  price_per_person: number;
}

interface JourneyCustomizerCatalog {
  version: 1;
  bundle_discount_percent: number;
  experiences: JourneyExperience[];
  accommodations: JourneyAccommodation[];
  transports: JourneyTransport[];
  meals: JourneyMeal[];
}

interface CardCustomLink {
  url: string;
  label?: string;
}

interface ParentBusinessType {
  id: string;
  name: string;
  icon?: string;
  icon_color?: string;
}

interface ChildBusinessType {
  id: string;
  name: string;
  parent_id: string;
  icon?: string;
}

interface RegisteredBusiness {
  id: string;
  name: string;
  slug?: string;
  type_id?: string;
  type_name?: string;
  phone?: string;
  whatsapp?: string;
  is_trusted?: boolean;
}

interface MediaPhoto {
  url: string;
  name?: string;
  source: string;
}

type TabKey = 'experiences' | 'accommodations' | 'transports' | 'meals';

/* ────────────────────────────── Palette ────────────────────────────── */

const C = {
  bg: '#0b1120',
  card: '#0f172a',
  border: 'rgba(255,255,255,0.06)',
  gold: '#D4AF37',
  green: '#4ade80',
  red: '#f87171',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

/* ────────────────────────────── Shared Styles ────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f1f5f9',
  fontSize: '0.82rem',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.68rem',
  fontWeight: 800,
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  marginBottom: '5px',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '70px',
  resize: 'vertical' as const,
};

/* ────────────────────────────── Helpers ────────────────────────────── */

function genId(): string {
  return 'card_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function blankExperience(): JourneyExperience {
  return {
    id: genId(), is_visible: true, vendor_business_ids: [],
    title_en: '', title_ar: '', category: '', category_ar: '',
    duration: '', duration_ar: '', base_price_egp: 0,
    highlight_en: '', highlight_ar: '',
  };
}
function blankAccommodation(): JourneyAccommodation {
  return {
    id: genId(), is_visible: true, vendor_business_ids: [],
    name_en: '', name_ar: '', desc_en: '', desc_ar: '',
    price_per_night: 0, badge_en: '', badge_ar: '',
  };
}
function blankTransport(): JourneyTransport {
  return {
    id: genId(), is_visible: true, vendor_business_ids: [],
    name_en: '', name_ar: '', desc_en: '', desc_ar: '', rate_per_day: 0,
  };
}
function blankMeal(): JourneyMeal {
  return {
    id: genId(), is_visible: true, vendor_business_ids: [],
    name_en: '', name_ar: '', desc_en: '', desc_ar: '', price_per_person: 0,
  };
}

const TAB_META: { key: TabKey; icon: string; label: string; priceLabel: string }[] = [
  { key: 'experiences', icon: '🏛️', label: 'Experiences', priceLabel: 'Base Price (EGP)' },
  { key: 'accommodations', icon: '🛖', label: 'Accommodation', priceLabel: 'Price / Night (EGP)' },
  { key: 'transports', icon: '🚙', label: 'Transport', priceLabel: 'Rate / Day (EGP)' },
  { key: 'meals', icon: '🍽️', label: 'Dining', priceLabel: 'Price / Person (EGP)' },
];

function getItemTitle(item: any, tab: TabKey): string {
  if (tab === 'experiences') return item.title_en || '(untitled)';
  return item.name_en || '(untitled)';
}
function getItemTitleAr(item: any, tab: TabKey): string {
  if (tab === 'experiences') return item.title_ar || '';
  return item.name_ar || '';
}
function getItemPrice(item: any, tab: TabKey): number {
  if (tab === 'experiences') return item.base_price_egp ?? 0;
  if (tab === 'accommodations') return item.price_per_night ?? 0;
  if (tab === 'transports') return item.rate_per_day ?? 0;
  return item.price_per_person ?? 0;
}
function getPriceField(tab: TabKey): string {
  if (tab === 'experiences') return 'base_price_egp';
  if (tab === 'accommodations') return 'price_per_night';
  if (tab === 'transports') return 'rate_per_day';
  return 'price_per_person';
}
function getTitleField(tab: TabKey): string {
  return tab === 'experiences' ? 'title_en' : 'name_en';
}
function getTitleArField(tab: TabKey): string {
  return tab === 'experiences' ? 'title_ar' : 'name_ar';
}
function getDescField(tab: TabKey): string {
  return tab === 'experiences' ? 'highlight_en' : 'desc_en';
}
function getDescArField(tab: TabKey): string {
  return tab === 'experiences' ? 'highlight_ar' : 'desc_ar';
}

/* ────────────────────────────── Component ────────────────────────── */

export default function JourneyCardsPage() {
  const [catalog, setCatalog] = useState<JourneyCustomizerCatalog | null>(null);
  const [revision, setRevision] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('experiences');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [linksMap, setLinksMap] = useState<Record<string, CardCustomLink[]>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Hierarchy state (Parent types, Child types, Registered businesses)
  const [parents, setParents] = useState<ParentBusinessType[]>([]);
  const [childrenTypes, setChildrenTypes] = useState<ChildBusinessType[]>([]);
  const [businesses, setBusinesses] = useState<RegisteredBusiness[]>([]);

  // Media Library & Upload state
  const [mediaLibrary, setMediaLibrary] = useState<MediaPhoto[]>([]);
  const [mediaPickerCardId, setMediaPickerCardId] = useState<string | null>(null);
  const [uploadingForCardId, setUploadingForCardId] = useState<string | null>(null);

  /* ── Fetch ── */
  useEffect(() => {
    (async () => {
      try {
        const [catRes, linksRes, hierRes, mediaRes] = await Promise.all([
          fetch('/api/journeys/customizer?view=admin'),
          fetch('/api/admin/commercial-links'),
          fetch('/api/admin/businesses-hierarchy').catch(() => null),
          fetch('/api/admin/media-library').catch(() => null),
        ]);
        if (!catRes.ok) throw new Error('Failed to load catalog');
        const catData = await catRes.json();
        setCatalog(catData.catalog);
        setRevision(catData.revision ?? 0);

        if (linksRes.ok) {
          const linksData = await linksRes.json();
          if (linksData.links_map) setLinksMap(linksData.links_map);
        }

        if (hierRes && hierRes.ok) {
          const hierData = await hierRes.json();
          if (hierData.parents) setParents(hierData.parents);
          if (hierData.children) setChildrenTypes(hierData.children);
          if (hierData.businesses) setBusinesses(hierData.businesses);
        }

        if (mediaRes && mediaRes.ok) {
          const mData = await mediaRes.json();
          if (mData.images) setMediaLibrary(mData.images);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Local file upload handler ── */
  const handleFileUpload = async (tab: TabKey, idx: number, cardId: string, file: File) => {
    setUploadingForCardId(cardId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessName', 'journey_cards');
      formData.append('sectionName', tab);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        updateItem(tab, idx, 'image', data.url);
        // Also add to active media library picker
        setMediaLibrary((prev) => [{ url: data.url, name: file.name, source: 'upload' }, ...prev]);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingForCardId(null);
    }
  };

  /* ── Save ── */
  const save = useCallback(async () => {
    if (!catalog) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/journeys/customizer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalog }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Save failed');
      }
      setDirty(false);
      setSavedFlash(true);
      setRevision((r) => r + 1);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [catalog]);

  /* ── Mutators ── */
  const updateItem = useCallback((tab: TabKey, idx: number, field: string, value: any) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const arr = [...(prev[tab] as any[])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [tab]: arr };
    });
    setDirty(true);
  }, []);

  const deleteItem = useCallback((tab: TabKey, idx: number) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const arr = [...(prev[tab] as any[])];
      arr.splice(idx, 1);
      return { ...prev, [tab]: arr };
    });
    setDirty(true);
    setDeleteConfirm(null);
  }, []);

  const addItem = useCallback((tab: TabKey) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const factories: Record<TabKey, () => any> = {
        experiences: blankExperience,
        accommodations: blankAccommodation,
        transports: blankTransport,
        meals: blankMeal,
      };
      const arr = [...(prev[tab] as any[]), factories[tab]()];
      return { ...prev, [tab]: arr };
    });
    setDirty(true);
  }, []);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /* ── Counts ── */
  const totalItems = catalog
    ? catalog.experiences.length + catalog.accommodations.length + catalog.transports.length + catalog.meals.length
    : 0;

  /* ── Loading / Error states ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🎯</div>
          <div style={{ color: C.textSecondary, fontSize: '0.9rem' }}>Loading Journey Cards…</div>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.red, fontSize: '1rem' }}>⚠️ {error || 'Failed to load catalog'}</div>
      </div>
    );
  }

  const currentItems = catalog[activeTab] as any[];
  const tabMeta = TAB_META.find((t) => t.key === activeTab)!;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.textPrimary, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ── Top Bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`, padding: '1rem 2rem',
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/admin" style={{ color: C.textSecondary, fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ← Control Center
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>🎯 Journey Cards Manager</h1>
              <div style={{ fontSize: '0.72rem', color: C.textMuted, marginTop: '2px' }}>
                {totalItems} Cards · Revision {revision}
                {dirty && (
                  <span style={{ color: C.gold, marginLeft: '0.75rem', fontWeight: 700 }}>● Unsaved changes</span>
                )}
                {savedFlash && (
                  <span style={{ color: C.green, marginLeft: '0.75rem', fontWeight: 700 }}>✓ Saved!</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving || !dirty}
            style={{
              padding: '0.6rem 1.8rem',
              borderRadius: '12px',
              border: 'none',
              background: dirty ? `linear-gradient(135deg, ${C.gold}, #b8941f)` : 'rgba(255,255,255,0.06)',
              color: dirty ? '#000' : C.textMuted,
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: dirty ? 'pointer' : 'default',
              opacity: saving ? 0.6 : 1,
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {saving ? '⏳ Saving…' : '💾 Save All Changes'}
          </button>
        </div>

        {error && (
          <div style={{
            maxWidth: '1600px', margin: '0.5rem auto 0', padding: '0.6rem 1rem',
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '10px', color: C.red, fontSize: '0.8rem',
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ── Tab Strip ── */}
      <div style={{
        position: 'sticky', top: '75px', zIndex: 40,
        background: 'rgba(11,17,32,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`, padding: '0 2rem',
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '0', overflowX: 'auto' }}>
          {TAB_META.map((t) => {
            const count = (catalog[t.key] as any[]).length;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '0.85rem 1.4rem',
                  border: 'none',
                  borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                  background: 'transparent',
                  color: active ? C.gold : C.textSecondary,
                  fontWeight: active ? 800 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                {t.icon} {t.label} <span style={{ opacity: 0.6, marginLeft: '0.3rem' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Cards Grid ── */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem 2rem 8rem' }}>
        {currentItems.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem', color: C.textMuted, fontSize: '0.9rem',
          }}>
            No {tabMeta.label.toLowerCase()} cards yet. Click &quot;+ Add New Card&quot; below.
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.25rem',
        }}>
          {currentItems.map((item: any, idx: number) => {
            const itemId = item.id;
            const secKey = (s: string) => `${itemId}_${s}`;
            const isExpanded = (s: string) => !!expandedSections[secKey(s)];

            return (
              <div
                key={itemId}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* ─── Header Section ─── */}
                <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
                  {/* Image preview */}
                  {item.image && (
                    <div style={{
                      width: '100%', height: '120px', borderRadius: '10px',
                      overflow: 'hidden', marginBottom: '0.75rem',
                      background: 'rgba(255,255,255,0.03)',
                    }}>
                      <img
                        src={item.image}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div>
                      <label style={labelStyle}>Icon</label>
                      <input
                        value={item.icon || ''}
                        onChange={(e) => updateItem(activeTab, idx, 'icon', e.target.value)}
                        style={{ ...inputStyle, width: '50px', textAlign: 'center', fontSize: '1.2rem', padding: '0.4rem' }}
                        placeholder="🏛️"
                      />
                    </div>

                    {/* Titles */}
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Title (EN)</label>
                      <input
                        value={getItemTitle(item, activeTab) === '(untitled)' ? '' : getItemTitle(item, activeTab)}
                        onChange={(e) => updateItem(activeTab, idx, getTitleField(activeTab), e.target.value)}
                        style={{ ...inputStyle, fontWeight: 700, fontSize: '0.9rem' }}
                        placeholder="Card title…"
                      />
                    </div>

                    {/* Visibility toggle + delete */}
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', paddingTop: '18px' }}>
                      <button
                        onClick={() => updateItem(activeTab, idx, 'is_visible', !item.is_visible)}
                        title={item.is_visible ? 'Visible' : 'Hidden'}
                        style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          border: `1px solid ${item.is_visible ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                          background: item.is_visible ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                          color: item.is_visible ? C.green : C.red,
                          cursor: 'pointer', fontSize: '0.9rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {item.is_visible ? '👁' : '🚫'}
                      </button>
                      <button
                        onClick={() => {
                          if (deleteConfirm === itemId) {
                            deleteItem(activeTab, idx);
                          } else {
                            setDeleteConfirm(itemId);
                            setTimeout(() => setDeleteConfirm(null), 3000);
                          }
                        }}
                        title={deleteConfirm === itemId ? 'Click again to confirm' : 'Delete card'}
                        style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          border: `1px solid ${deleteConfirm === itemId ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.06)'}`,
                          background: deleteConfirm === itemId ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.03)',
                          color: deleteConfirm === itemId ? C.red : C.textMuted,
                          cursor: 'pointer', fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* Arabic title */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={labelStyle}>Title (AR)</label>
                    <input
                      value={getItemTitleAr(item, activeTab)}
                      onChange={(e) => updateItem(activeTab, idx, getTitleArField(activeTab), e.target.value)}
                      style={{ ...inputStyle, direction: 'rtl' as any }}
                      placeholder="العنوان بالعربية…"
                    />
                  </div>

                  {/* Image URL & Multi-source Photo Picker */}
                  <div style={{ marginTop: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Card Photo</label>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {/* 1. Local Device File Upload */}
                        <label
                          style={{
                            fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8',
                            background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
                            padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(activeTab, idx, itemId, f);
                            }}
                          />
                          {uploadingForCardId === itemId ? '⏳ Uploading…' : '📁 Upload from Device'}
                        </label>

                        {/* 2. Choose from Existing Library */}
                        <button
                          type="button"
                          onClick={() => setMediaPickerCardId(mediaPickerCardId === itemId ? null : itemId)}
                          style={{
                            fontSize: '0.68rem', fontWeight: 800, color: C.gold,
                            background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                            padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {mediaPickerCardId === itemId ? '✕ Close Library' : '🖼️ Pick Existing'}
                        </button>
                      </div>
                    </div>

                    <input
                      value={item.image || ''}
                      onChange={(e) => updateItem(activeTab, idx, 'image', e.target.value)}
                      style={inputStyle}
                      placeholder="https://… or select / upload above"
                    />

                    {/* Existing Media Library Grid Drawer */}
                    {mediaPickerCardId === itemId && (
                      <div style={{
                        marginTop: '0.5rem', padding: '0.65rem', borderRadius: '10px',
                        background: 'rgba(0,0,0,0.5)', border: `1px solid ${C.border}`,
                        maxHeight: '180px', overflowY: 'auto',
                      }}>
                        <div style={{ fontSize: '0.65rem', color: C.textSecondary, marginBottom: '0.4rem', fontWeight: 700 }}>
                          Select from uploaded & curated Siwa photos ({mediaLibrary.length}):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.4rem' }}>
                          {mediaLibrary.map((photo, pIdx) => (
                            <div
                              key={photo.url + pIdx}
                              onClick={() => {
                                updateItem(activeTab, idx, 'image', photo.url);
                                setMediaPickerCardId(null);
                              }}
                              title={photo.name || photo.url}
                              style={{
                                height: '52px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
                                border: item.image === photo.url ? `2px solid ${C.gold}` : '1px solid rgba(255,255,255,0.1)',
                                position: 'relative', background: '#000',
                              }}
                            >
                              <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Provider Section (collapsible) ─── */}
                <CollapsibleSection
                  title="🏢 Service Provider"
                  expanded={isExpanded('provider')}
                  onToggle={() => toggleSection(secKey('provider'))}
                >
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {/* 1. Parent Business Type Selector */}
                    <div>
                      <label style={labelStyle}>👑 Parent Category (Sector)</label>
                      <select
                        value={item.parent_business_type_id || (activeTab === 'accommodations' ? 'accommodation' : activeTab === 'transports' ? 'logistics' : activeTab === 'meals' ? 'food' : 'adventure')}
                        onChange={(e) => {
                          const pVal = e.target.value;
                          updateItem(activeTab, idx, 'parent_business_type_id', pVal);
                          // Reset child subtype if it doesn't match new parent
                          updateItem(activeTab, idx, 'child_business_type_id', '');
                        }}
                        style={{ ...inputStyle, cursor: 'pointer', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
                      >
                        <option value="">— Select Parent Category —</option>
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Child Sub-Type Selector (Based on selected Parent) */}
                    <div>
                      <label style={labelStyle}>📋 Child Business Type (Specific Sub-type)</label>
                      <select
                        value={item.child_business_type_id || ''}
                        onChange={(e) => {
                          const cVal = e.target.value;
                          updateItem(activeTab, idx, 'child_business_type_id', cVal);
                          const childObj = childrenTypes.find(c => c.id === cVal);
                          if (childObj && !item.provider_badge) {
                            updateItem(activeTab, idx, 'provider_badge', childObj.name);
                          }
                        }}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">— Select Child Sub-Type —</option>
                        {childrenTypes
                          .filter((c) => {
                            const activeParent = item.parent_business_type_id || (activeTab === 'accommodations' ? 'accommodation' : activeTab === 'transports' ? 'logistics' : activeTab === 'meals' ? 'food' : 'adventure');
                            return !activeParent || c.parent_id === activeParent;
                          })
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 3. Link Existing Registered Business (Instant Autofill) */}
                    <div>
                      <label style={labelStyle}>🏪 Link Registered Business (Optional)</label>
                      <select
                        value={item.business_id || ''}
                        onChange={(e) => {
                          const bId = e.target.value;
                          const bObj = businesses.find(b => b.id === bId);
                          if (bObj) {
                            updateItem(activeTab, idx, 'business_id', bObj.id);
                            updateItem(activeTab, idx, 'business_name', bObj.name);
                            if (bObj.slug) updateItem(activeTab, idx, 'business_slug', bObj.slug);
                            if (bObj.phone) updateItem(activeTab, idx, 'business_phone', bObj.phone);
                            if (bObj.whatsapp) updateItem(activeTab, idx, 'whatsapp_number', bObj.whatsapp);
                            if (bObj.is_trusted !== undefined) updateItem(activeTab, idx, 'is_trusted', bObj.is_trusted);
                            if (bObj.type_id) {
                              updateItem(activeTab, idx, 'child_business_type_id', bObj.type_id);
                              const matchedChild = childrenTypes.find(c => c.id === bObj.type_id);
                              if (matchedChild?.parent_id) {
                                updateItem(activeTab, idx, 'parent_business_type_id', matchedChild.parent_id);
                              }
                            }
                          } else {
                            updateItem(activeTab, idx, 'business_id', '');
                          }
                        }}
                        style={{ ...inputStyle, cursor: 'pointer', color: C.gold }}
                      >
                        <option value="">— Choose Registered Business Instance —</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.is_trusted ? '🛡️ ' : ''}{b.name} ({b.type_name || b.type_id || 'Business'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Business Name & Slug */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={labelStyle}>Business Name</label>
                        <input
                          value={item.business_name || ''}
                          onChange={(e) => {
                            updateItem(activeTab, idx, 'business_name', e.target.value);
                            if (!item.business_slug) {
                              updateItem(activeTab, idx, 'business_slug', slugify(e.target.value));
                            }
                          }}
                          style={inputStyle}
                          placeholder="Business name…"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Business Slug (Minisite Link)</label>
                        <input
                          value={item.business_slug || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'business_slug', e.target.value)}
                          style={inputStyle}
                          placeholder="auto-generated-slug"
                        />
                      </div>
                    </div>

                    {/* 5. Provider Type & Badge */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={labelStyle}>Provider Operational Type</label>
                        <select
                          value={item.provider_type || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'provider_type', e.target.value || undefined)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          <option value="">— None —</option>
                          <option value="hotel">Hotel / Lodge</option>
                          <option value="operator">Tour / Safari Operator</option>
                          <option value="siwify_direct">Siwify Direct</option>
                          <option value="artisan">Artisan / Producer</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Provider Badge Text</label>
                        <input
                          value={item.provider_badge || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'provider_badge', e.target.value)}
                          style={inputStyle}
                          placeholder="e.g. ⭐ Verified Sanctuary"
                        />
                      </div>
                    </div>

                    {/* 6. Trusted checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                      <label style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!item.is_trusted}
                          onChange={(e) => updateItem(activeTab, idx, 'is_trusted', e.target.checked)}
                          style={{ accentColor: C.green }}
                        />
                        Trusted Provider
                      </label>
                      {item.is_trusted && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700,
                          background: 'rgba(74,222,128,0.12)', color: C.green,
                          padding: '0.2rem 0.5rem', borderRadius: '6px',
                        }}>
                          ✓ Verified Platform Partner 🛡️
                        </span>
                      )}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* ─── Pricing & OTA Section (collapsible) ─── */}
                <CollapsibleSection
                  title="💰 Pricing & OTA Comparison"
                  expanded={isExpanded('pricing')}
                  onToggle={() => toggleSection(secKey('pricing'))}
                >
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={labelStyle}>{tabMeta.priceLabel}</label>
                        <input
                          type="number"
                          value={getItemPrice(item, activeTab)}
                          onChange={(e) => updateItem(activeTab, idx, getPriceField(activeTab), parseFloat(e.target.value) || 0)}
                          style={inputStyle}
                          min="0"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>OTA Reference Price (EGP)</label>
                        <input
                          type="number"
                          value={item.ota_benchmark_price ?? ''}
                          onChange={(e) => updateItem(activeTab, idx, 'ota_benchmark_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                          style={inputStyle}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={labelStyle}>OTA Name</label>
                        <input
                          value={item.ota_name || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'ota_name', e.target.value)}
                          style={inputStyle}
                          placeholder="e.g. Booking.com, Viator"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>External Check URL</label>
                        <input
                          value={item.external_check_url || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'external_check_url', e.target.value || null)}
                          style={inputStyle}
                          placeholder="https://…"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Direct Discount Note (&quot;Our Offer&quot;)</label>
                      <textarea
                        value={item.direct_discount_note || ''}
                        onChange={(e) => updateItem(activeTab, idx, 'direct_discount_note', e.target.value)}
                        style={textareaStyle}
                        placeholder="e.g. Book direct & save 15%…"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* ─── Description Section (collapsible) ─── */}
                <CollapsibleSection
                  title="📝 Descriptions"
                  expanded={isExpanded('desc')}
                  onToggle={() => toggleSection(secKey('desc'))}
                >
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <div>
                      <label style={labelStyle}>{activeTab === 'experiences' ? 'Highlight (EN)' : 'Description (EN)'}</label>
                      <textarea
                        value={item[getDescField(activeTab)] || ''}
                        onChange={(e) => updateItem(activeTab, idx, getDescField(activeTab), e.target.value)}
                        style={textareaStyle}
                        placeholder="English description…"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{activeTab === 'experiences' ? 'Highlight (AR)' : 'Description (AR)'}</label>
                      <textarea
                        value={item[getDescArField(activeTab)] || ''}
                        onChange={(e) => updateItem(activeTab, idx, getDescArField(activeTab), e.target.value)}
                        style={{ ...textareaStyle, direction: 'rtl' as any }}
                        placeholder="…الوصف بالعربية"
                      />
                    </div>

                    {/* Experience-specific fields */}
                    {activeTab === 'experiences' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <div>
                          <label style={labelStyle}>Category (EN)</label>
                          <input
                            value={item.category || ''}
                            onChange={(e) => updateItem(activeTab, idx, 'category', e.target.value)}
                            style={inputStyle}
                            placeholder="Safari, Cultural…"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Category (AR)</label>
                          <input
                            value={item.category_ar || ''}
                            onChange={(e) => updateItem(activeTab, idx, 'category_ar', e.target.value)}
                            style={{ ...inputStyle, direction: 'rtl' as any }}
                            placeholder="الفئة…"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Duration (EN)</label>
                          <input
                            value={item.duration || ''}
                            onChange={(e) => updateItem(activeTab, idx, 'duration', e.target.value)}
                            style={inputStyle}
                            placeholder="3 hours, Full day…"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Duration (AR)</label>
                          <input
                            value={item.duration_ar || ''}
                            onChange={(e) => updateItem(activeTab, idx, 'duration_ar', e.target.value)}
                            style={{ ...inputStyle, direction: 'rtl' as any }}
                            placeholder="المدة…"
                          />
                        </div>
                      </div>
                    )}

                    {/* Accommodation-specific fields */}
                    {activeTab === 'accommodations' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <div>
                          <label style={labelStyle}>Badge (EN)</label>
                          <input
                            value={item.badge_en || ''}
                            onChange={(e) => updateItem(activeTab, idx, 'badge_en', e.target.value)}
                            style={inputStyle}
                            placeholder="Best Value, Premium…"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Badge (AR)</label>
                          <input
                            value={item.badge_ar || ''}
                            onChange={(e) => updateItem(activeTab, idx, 'badge_ar', e.target.value)}
                            style={{ ...inputStyle, direction: 'rtl' as any }}
                            placeholder="الشارة…"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* ─── Atmospheric DNA & Vibe Architecture (collapsible) ─── */}
                <CollapsibleSection
                  title="✨ Vibe, Views & Atmospheric DNA"
                  expanded={isExpanded('vibe_dna')}
                  onToggle={() => toggleSection(secKey('vibe_dna'))}
                >
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {/* Setting Location & View Type */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.6rem' }}>
                      <div>
                        <label style={labelStyle}>Oasis Setting Location</label>
                        <select
                          value={item.setting_location || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'setting_location', e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          <option value="">— Select Oasis Setting —</option>
                          <option value="on_lake">Waterfront Salt Lake Shore</option>
                          <option value="on_lake_and_pool">Lakefront & Spring Pool</option>
                          <option value="dune">Great Sand Sea Dunes</option>
                          <option value="oasis_palms">Ancient Palm Groves</option>
                          <option value="citadel">Old Shali Citadel Ruins</option>
                          <option value="spring">Natural Thermal Spring Basin</option>
                          <option value="multiple_views">Multiple Panoramas (Mountain & Dunes)</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>View Type Panorama</label>
                        <input
                          value={item.view_type || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'view_type', e.target.value)}
                          style={inputStyle}
                          placeholder="e.g. Waterfront Salt Lake Horizon & Golden Dunes"
                        />
                      </div>
                    </div>

                    {/* Vibe Tags */}
                    <div>
                      <label style={labelStyle}>Vibe Tags (Comma Separated)</label>
                      <input
                        value={Array.isArray(item.vibe_tags) ? item.vibe_tags.join(', ') : (item.vibe_tags || '')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          updateItem(activeTab, idx, 'vibe_tags', tags);
                        }}
                        style={inputStyle}
                        placeholder="e.g. silence, lake_silence, desert_stars, organic_food, heritage"
                      />
                    </div>

                    {/* Ambience & Seating Style */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={labelStyle}>Atmospheric Ambience</label>
                        <input
                          value={item.vibe_ambience || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'vibe_ambience', e.target.value)}
                          style={inputStyle}
                          placeholder="e.g. Candlelit Acoustic Silence"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Seating / Furniture Style</label>
                        <input
                          value={item.seating_style || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'seating_style', e.target.value)}
                          style={inputStyle}
                          placeholder="e.g. Handwoven Bedouin Kilims on Soft Sand"
                        />
                      </div>
                    </div>

                    {/* Sector-Specific Sectional Fields */}
                    {activeTab === 'meals' && (
                      <div>
                        <label style={labelStyle}>Culinary DNA & Menu Highlights (Comma Separated)</label>
                        <input
                          value={Array.isArray(item.menu_highlights) ? item.menu_highlights.join(', ') : (item.menu_highlights || '')}
                          onChange={(e) => {
                            const menus = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            updateItem(activeTab, idx, 'menu_highlights', menus);
                          }}
                          style={inputStyle}
                          placeholder="e.g. Subterranean Mandi Lamb, Cold-Pressed Olive Oil, Date Confectionery"
                        />
                      </div>
                    )}

                    {activeTab === 'transports' && (
                      <div>
                        <label style={labelStyle}>Transit Fleet / Vehicle Type</label>
                        <input
                          value={item.vehicle_type || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'vehicle_type', e.target.value)}
                          style={inputStyle}
                          placeholder="e.g. VIP AC 4x4 Land Cruiser with Pro Sandboard"
                        />
                      </div>
                    )}

                    {activeTab === 'experiences' && (
                      <div>
                        <label style={labelStyle}>Natural Treatment / Healing Protocol</label>
                        <select
                          value={item.treatment_type || ''}
                          onChange={(e) => updateItem(activeTab, idx, 'treatment_type', e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer', color: C.gold }}
                        >
                          <option value="">— Non-Medical / Pure Leisure —</option>
                          <option value="sand_therapy_detox">🏜️ Sand Bath Joint & Rheumatism Therapy (جبل دكرور)</option>
                          <option value="salt_lake_healing">🌊 Hyper-Saline Salt Float & Skin Healing (بحيرات الملح)</option>
                          <option value="sulfur_springs_plunge">♨️ Volcanic Sulfur Spring Muscle Soak (بئر واحد)</option>
                          <option value="herbal_nutrition_reset">🌿 Herbal & Organic Olive Oil Detox (استشفاء عشبي)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* ─── Commercial Links Bridge (collapsible) ─── */}
                <CollapsibleSection
                  title="🔗 Admin Curated Links"
                  expanded={isExpanded('links')}
                  onToggle={() => toggleSection(secKey('links'))}
                >
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <div>
                      <label style={labelStyle}>Commercial Item ID</label>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        {item.commercial_item_id ? (
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace',
                            background: 'rgba(212,175,55,0.1)', color: C.gold,
                            padding: '0.35rem 0.65rem', borderRadius: '8px',
                            border: `1px solid rgba(212,175,55,0.2)`,
                          }}>
                            {item.commercial_item_id}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: C.textMuted }}>Not linked</span>
                        )}
                        {item.commercial_item_id && linksMap[item.commercial_item_id] && (
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700,
                            background: 'rgba(74,222,128,0.1)', color: C.green,
                            padding: '0.2rem 0.5rem', borderRadius: '6px',
                          }}>
                            {linksMap[item.commercial_item_id].length} external link{linksMap[item.commercial_item_id].length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Set / Update Commercial Item ID</label>
                      <input
                        value={item.commercial_item_id || ''}
                        onChange={(e) => updateItem(activeTab, idx, 'commercial_item_id', e.target.value || undefined)}
                        style={inputStyle}
                        placeholder="e.g. comm_abc123"
                      />
                    </div>
                    <Link
                      href="/admin/commercial-links"
                      style={{
                        fontSize: '0.78rem', color: C.gold, textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      Edit links in Card Links Manager →
                    </Link>
                  </div>
                </CollapsibleSection>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(11,17,32,0.95)', backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${C.border}`, padding: '0.85rem 2rem',
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={save}
            disabled={saving || !dirty}
            style={{
              flex: 1, padding: '0.75rem 1.5rem', borderRadius: '12px',
              border: 'none',
              background: dirty ? `linear-gradient(135deg, ${C.gold}, #b8941f)` : 'rgba(255,255,255,0.06)',
              color: dirty ? '#000' : C.textMuted,
              fontWeight: 800, fontSize: '0.88rem', cursor: dirty ? 'pointer' : 'default',
              opacity: saving ? 0.6 : 1, transition: 'all 0.2s', fontFamily: 'inherit',
            }}
          >
            {saving ? '⏳ Saving…' : dirty ? '💾 Save All Changes' : '✓ All Saved'}
          </button>
          <button
            onClick={() => addItem(activeTab)}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '12px',
              border: `1px solid rgba(212,175,55,0.3)`,
              background: 'rgba(212,175,55,0.08)',
              color: C.gold, fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            + Add New Card
          </button>

          {dirty && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: C.gold,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              whiteSpace: 'nowrap',
            }}>
              ● Unsaved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── CollapsibleSection ────────────────── */

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderTop: `1px solid ${C.border}` }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '0.7rem 1.25rem',
          background: 'transparent', border: 'none',
          color: C.textSecondary, fontSize: '0.75rem', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span>{title}</span>
        <span style={{
          fontSize: '0.65rem',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ▼
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '0 1.25rem 1rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}
