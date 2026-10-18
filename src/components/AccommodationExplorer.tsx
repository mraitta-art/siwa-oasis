'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CommercialItem, CommercialOption } from '@/lib/commercial-types';
import { DEFAULT_COMMERCIAL_ITEMS } from '@/lib/commercial-catalog';
import CommercialBookingModal from '@/components/CommercialBookingModal';

export interface FilterItemOption {
  id: string;
  label: string;
  icon?: string;
  desc?: string;
}

export interface AccommodationExplorerProps {
  accentColor?: string;
  initialSetting?: string;
  initialVibe?: string;
  initialType?: string;
  title?: string;
  subtitle?: string;
  customSettings?: FilterItemOption[];
  customVibes?: FilterItemOption[];
  customTypes?: FilterItemOption[];
}

// ─── DEFAULT FILTER TAXONOMIES (Extensible by Admin & Live DB Items) ─────────

const DEFAULT_SETTING_FILTERS: FilterItemOption[] = [
  { id: 'all', label: 'All Settings & Views', icon: '✦' },
  { id: 'on_lake', label: 'On Lake Shore', icon: '🌊', desc: 'Direct salt lake waterfront' },
  { id: 'on_lake_and_pool', label: 'On Lake & Pool', icon: '🌊🏊', desc: 'Waterfront shore + fresh spring pool' },
  { id: 'dune', label: 'Deep Sand Dunes', icon: '🏜️', desc: '100m dunes & stargazing crests' },
  { id: 'multiple_views', label: 'Multiple Views (360°)', icon: '🌅', desc: 'Citadel, salt lakes & palm canopy' },
  { id: 'oasis_palms', label: 'Oasis Palm Groves', icon: '🌴', desc: 'Date palm forests & private spring pools' },
];

const DEFAULT_VIBE_FILTERS: FilterItemOption[] = [
  { id: 'all', label: 'All Vibes', icon: '✨' },
  { id: 'lake_silence', label: 'Lake Silence & Meditation', icon: '🧘' },
  { id: 'desert_stars', label: 'Desert Stars & Stargazing', icon: '🌌' },
  { id: 'heritage', label: 'Heritage Wisdom & Mudbrick', icon: '🏺' },
  { id: 'salt_healing', label: 'Salt Healing & Relaxation', icon: '♨️' },
];

const DEFAULT_TYPE_FILTERS: FilterItemOption[] = [
  { id: 'all', label: 'All Stay Types', icon: '🛖' },
  { id: 'salt_chalet', label: 'Salt Chalets', icon: '🌊' },
  { id: 'ecolodge', label: 'Heritage Eco-Lodges', icon: '🛖' },
  { id: 'glamping', label: 'Glamping Domes & Tents', icon: '⛺' },
  { id: 'heritage_suite', label: 'Citadel Mudbrick Suites', icon: '🏰' },
  { id: 'villa', label: 'Private Villas & Compounds', icon: '🏡' },
];

export default function AccommodationExplorer({
  accentColor = '#D4AF37',
  initialSetting = 'all',
  initialVibe = 'all',
  initialType = 'all',
  title = 'Explore Accommodations by Vibe, Setting & Views',
  subtitle = 'Discover Siwa’s premier verified eco-lodges, lake chalets, and dune camps. Every card directly connects you to the provider’s dedicated minisite with direct transparent pricing.',
  customSettings,
  customVibes,
  customTypes
}: AccommodationExplorerProps) {
  // Multi-selection filter states (arrays of IDs)
  const [selectedSettings, setSelectedSettings] = useState<string[]>(
    initialSetting && initialSetting !== 'all' ? [initialSetting] : []
  );
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    initialVibe && initialVibe !== 'all' ? [initialVibe] : []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialType && initialType !== 'all' ? [initialType] : []
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active room option selection per item { [itemId]: CommercialOption }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CommercialOption>>({});

  // Active photo gallery carousel indices per item { [itemId]: number }
  const [activePhotos, setActivePhotos] = useState<Record<string, number>>({});

  // Active modal item for direct reservation
  const [bookingModalItem, setBookingModalItem] = useState<CommercialItem | null>(null);

  // ── DB-driven data ────────────────────────────────────────────────────────
  const [dbItems, setDbItems] = useState<CommercialItem[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbSettings, setDbSettings] = useState<string[]>([]);
  const [dbVibes, setDbVibes] = useState<string[]>([]);
  const [dbTypes, setDbTypes] = useState<string[]>([]);

  useEffect(() => {
    setDbLoading(true);
    fetch('/api/accommodation-vendors?limit=60')
      .then(r => r.ok ? r.json() : { items: [], available_settings: [], available_vibes: [], available_types: [] })
      .then(data => {
        const fetched: CommercialItem[] = data.items || [];
        setDbItems(fetched);
        setDbSettings(data.available_settings || []);
        setDbVibes(data.available_vibes || []);
        setDbTypes(data.available_types || []);
      })
      .catch(() => setDbItems([]))
      .finally(() => setDbLoading(false));
  }, []);

  // Merge: DB items first, static catalog as demo fallback when DB is empty
  const accommodationItems = useMemo<CommercialItem[]>(() => {
    if (dbLoading) return [];
    if (dbItems.length > 0) return dbItems;
    return DEFAULT_COMMERCIAL_ITEMS.filter(item => item.sector === 'accommodation');
  }, [dbItems, dbLoading]);

  // Dynamically resolved filters (admin props > DB-discovered > catalog discovery > default taxonomy)
  const availableSettingFilters = useMemo(() => {
    if (customSettings && customSettings.length > 0) return customSettings;
    const base = [...DEFAULT_SETTING_FILTERS];
    // Add DB-discovered settings not already in default list
    dbSettings.forEach(s => {
      if (s && !base.some(b => b.id === s)) {
        base.push({ id: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: '📍' });
      }
    });
    accommodationItems.forEach(item => {
      if (item.setting_location && !base.some(b => b.id === item.setting_location)) {
        base.push({
          id: item.setting_location,
          label: item.setting_location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          icon: '📍',
          desc: item.view_type || 'Custom View'
        });
      }
    });
    return base;
  }, [customSettings, accommodationItems, dbSettings]);

  const availableVibeFilters = useMemo(() => {
    if (customVibes && customVibes.length > 0) return customVibes;
    const base = [...DEFAULT_VIBE_FILTERS];
    // Add DB-discovered vibes not already in default list
    dbVibes.forEach(vt => {
      if (vt && !base.some(b => b.id === vt)) {
        base.push({ id: vt, label: vt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: '✨' });
      }
    });
    accommodationItems.forEach(item => {
      item.vibe_tags?.forEach(vt => {
        if (!base.some(b => b.id === vt)) {
          base.push({
            id: vt,
            label: vt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            icon: '✨'
          });
        }
      });
    });
    return base;
  }, [customVibes, accommodationItems, dbVibes]);

  const availableTypeFilters = useMemo(() => {
    if (customTypes && customTypes.length > 0) return customTypes;
    const base = [...DEFAULT_TYPE_FILTERS];
    // Add DB-discovered types not already in default list
    dbTypes.forEach(t => {
      if (t && !base.some(b => b.id === t)) {
        base.push({ id: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: '🛖' });
      }
    });
    accommodationItems.forEach(item => {
      if (item.accommodation_type && !base.some(b => b.id === item.accommodation_type)) {
        base.push({
          id: item.accommodation_type,
          label: item.accommodation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          icon: '🛖'
        });
      }
    });
    return base;
  }, [customTypes, accommodationItems, dbTypes]);

  // Toggle multi-selection helpers
  const toggleSettingFilter = (id: string) => {
    if (id === 'all') {
      setSelectedSettings([]);
      return;
    }
    setSelectedSettings(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleVibeFilter = (id: string) => {
    if (id === 'all') {
      setSelectedVibes([]);
      return;
    }
    setSelectedVibes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTypeFilter = (id: string) => {
    if (id === 'all') {
      setSelectedTypes([]);
      return;
    }
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Multi-faceted search & filter evaluation
  const filteredItems = useMemo(() => {
    return accommodationItems.filter(item => {
      // Search query filter (matches title, description, location, or partner name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.business_name?.toLowerCase().includes(q) || item.title_en?.toLowerCase().includes(q);
        const matchesDesc = item.desc_en?.toLowerCase().includes(q);
        const matchesLocation = item.location_name?.toLowerCase().includes(q) || item.view_type?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesLocation) return false;
      }

      // 1. Multi-Setting filter (OR matches across active selections)
      if (selectedSettings.length > 0) {
        if (!item.setting_location || !selectedSettings.includes(item.setting_location)) return false;
      }

      // 2. Multi-Vibe filter (matches if item has ANY of the selected vibes)
      if (selectedVibes.length > 0) {
        const hasVibe = selectedVibes.some(v => item.vibe_tags?.includes(v));
        if (!hasVibe) return false;
      }

      // 3. Multi-Type filter (matches if item is ANY of the selected types)
      if (selectedTypes.length > 0) {
        if (!item.accommodation_type || !selectedTypes.includes(item.accommodation_type)) return false;
      }

      return true;
    });
  }, [accommodationItems, searchQuery, selectedSettings, selectedVibes, selectedTypes]);

  const activeFiltersCount = selectedSettings.length + selectedVibes.length + selectedTypes.length + (searchQuery.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedSettings([]);
    setSelectedVibes([]);
    setSelectedTypes([]);
    setSearchQuery('');
  };

  // ── Loading skeleton while fetching from DB ───────────────────────────────
  if (dbLoading) {
    return (
      <section style={{
        background: 'linear-gradient(180deg, #070b08 0%, #0d150f 50%, #101c13 100%)',
        color: '#f8fafc',
        padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 3vw, 2.5rem)',
        borderTop: '1px solid rgba(212,175,55,0.15)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
        minHeight: '340px', justifyContent: 'center',
      }}>
        <style>{`
          @keyframes accSpin { to { transform: rotate(360deg); } }
          @keyframes accPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        `}</style>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          border: `3px solid ${accentColor}`, borderTopColor: 'transparent',
          animation: 'accSpin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: '0.82rem', color: 'rgba(248,250,252,0.5)', letterSpacing: '1px' }}>
          Loading verified sanctuaries…
        </div>
        {/* Skeleton cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%), 1fr))',
          gap: '1.25rem', width: '100%', maxWidth: '1360px',
          animation: 'accPulse 1.5s ease-in-out infinite',
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              background: '#0d150f', borderRadius: '20px', overflow: 'hidden',
              border: '1px solid rgba(212,175,55,0.12)',
            }}>
              <div style={{ height: '220px', background: '#132016' }} />
              <div style={{ padding: '1rem' }}>
                <div style={{ height: '14px', background: '#18281b', borderRadius: '6px', marginBottom: '0.6rem', width: '65%' }} />
                <div style={{ height: '11px', background: '#18281b', borderRadius: '6px', width: '42%', marginBottom: '0.9rem' }} />
                <div style={{ height: '36px', background: '#18281b', borderRadius: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section style={{
      background: 'linear-gradient(180deg, #070b08 0%, #0d150f 50%, #101c13 100%)',
      color: '#f8fafc',
      padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 3vw, 2.5rem)',
      borderTop: '1px solid rgba(212,175,55,0.15)',
      borderBottom: '1px solid rgba(212,175,55,0.15)',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        {/* ── 1. HEADER SECTION ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: accentColor,
            padding: '0.4rem 1.1rem',
            borderRadius: '30px',
            fontSize: '0.72rem',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            <span>✦</span>
            <span>SIWA SANCTUARY &amp; LODGE DISCOVERY</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.9rem, 4vw, 3rem)',
            fontWeight: 900,
            margin: '0 0 0.8rem',
            letterSpacing: '-0.02em',
            color: '#f8fafc'
          }}>
            {title}
          </h2>

          <p style={{
            maxWidth: '780px',
            margin: '0 auto',
            fontSize: '1rem',
            color: 'rgba(248,250,252,0.7)',
            lineHeight: 1.6
          }}>
            {subtitle}
          </p>
        </div>

        {/* ── 2. MULTI-FACETED FILTER CONTROL BOARD ───────────────────────────── */}
        <div style={{
          background: 'rgba(13,21,15,0.92)',
          border: '1px solid rgba(212,175,55,0.22)',
          borderRadius: '24px',
          padding: '1.5rem clamp(1rem, 2.5vw, 1.8rem)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          marginBottom: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>

          {/* Row 0: Live Search Input Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search sanctuaries by name, mudbrick, pool, spring or lake..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#101a12',
                border: '1.5px solid rgba(212,175,55,0.25)',
                borderRadius: '16px',
                padding: '0.75rem 1rem 0.75rem 2.8rem',
                color: '#f8fafc',
                fontSize: '0.86rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)'; }}
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>
              📍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

          {/* Row A: Location & Setting Multi-Select Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>
                📍 Filter by Location &amp; Views (Multi-Select)
              </span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.5)' }}>
                {selectedSettings.length > 0 ? `${selectedSettings.length} selected` : 'Select multiple settings'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
              {availableSettingFilters.map(f => {
                const isActive = f.id === 'all'
                  ? selectedSettings.length === 0
                  : selectedSettings.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleSettingFilter(f.id)}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #1f3624, #2a4c33)' : '#132016',
                      border: isActive ? `1.5px solid ${accentColor}` : '1px solid rgba(212,175,55,0.18)',
                      color: isActive ? '#f8fafc' : 'rgba(248,250,252,0.75)',
                      padding: '0.55rem 1rem',
                      borderRadius: '14px',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 800 : 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.18s ease',
                      boxShadow: isActive ? '0 4px 15px rgba(212,175,55,0.2)' : 'none'
                    }}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                    {isActive && f.id !== 'all' && (
                      <span style={{ fontSize: '0.65rem', color: accentColor, marginLeft: '2px' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

          {/* Row B & C Grid: Vibe and Stay Type Filters (Multi-Select) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Vibe Selection */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86efac' }}>
                  ✨ Experience Vibe
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(248,250,252,0.45)' }}>
                  {selectedVibes.length > 0 ? `${selectedVibes.length} active` : 'Pick any combination'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {availableVibeFilters.map(v => {
                  const isActive = v.id === 'all'
                    ? selectedVibes.length === 0
                    : selectedVibes.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVibeFilter(v.id)}
                      style={{
                        background: isActive ? 'linear-gradient(135deg, #1a3826, #245236)' : '#101a12',
                        border: isActive ? '1.5px solid #4ade80' : '1px solid rgba(255,255,255,0.08)',
                        color: isActive ? '#f8fafc' : 'rgba(248,250,252,0.7)',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '12px',
                        fontSize: '0.74rem',
                        fontWeight: isActive ? 800 : 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <span>{v.icon}</span>
                      <span>{v.label}</span>
                      {isActive && v.id !== 'all' && (
                        <span style={{ fontSize: '0.62rem', color: '#4ade80' }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fde68a' }}>
                  🛖 Accommodation Type
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(248,250,252,0.45)' }}>
                  {selectedTypes.length > 0 ? `${selectedTypes.length} active` : 'Select stay styles'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {availableTypeFilters.map(t => {
                  const isActive = t.id === 'all'
                    ? selectedTypes.length === 0
                    : selectedTypes.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTypeFilter(t.id)}
                      style={{
                        background: isActive ? 'linear-gradient(135deg, #3d2c16, #5c411c)' : '#101a12',
                        border: isActive ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                        color: isActive ? '#f8fafc' : 'rgba(248,250,252,0.7)',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '12px',
                        fontSize: '0.74rem',
                        fontWeight: isActive ? 800 : 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                      {isActive && t.id !== 'all' && (
                        <span style={{ fontSize: '0.62rem', color: accentColor }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Active Status Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.76rem',
            color: 'rgba(248,250,252,0.65)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                Showing <strong style={{ color: '#f8fafc' }}>{filteredItems.length} verified stays</strong>
                {activeFiltersCount > 0 && <span> matching your criteria</span>}
              </div>
              {/* Data source badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: dbItems.length > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(212,175,55,0.08)',
                border: dbItems.length > 0 ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(212,175,55,0.2)',
                borderRadius: '20px', padding: '0.2rem 0.65rem',
                fontSize: '0.65rem', fontWeight: 800,
                color: dbItems.length > 0 ? '#4ade80' : accentColor,
                letterSpacing: '0.5px',
              }}>
                <span style={{ fontSize: '0.55rem' }}>●</span>
                {dbItems.length > 0 ? 'Live Data' : 'Demo Mode'}
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: accentColor,
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ✕ Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* ── 3. ACCOMMODATION CARDS GRID ──────────────────────────────────────── */}
        {filteredItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: '#0d150f',
            border: '2px dashed rgba(212,175,55,0.2)',
            borderRadius: '24px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛖</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem' }}>
              No stays match this specific filter combination
            </h3>
            <p style={{ color: 'rgba(248,250,252,0.6)', maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.86rem' }}>
              Try broadening your location or vibe selection to explore all verified Siwan eco-lodges, lake chalets, and dune retreats.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: accentColor,
                color: '#070b08',
                padding: '0.75rem 1.75rem',
                borderRadius: '30px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Show All Available Accommodations
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2rem'
          }}>
            {filteredItems.map(item => {
              // Pricing status
              const hasPrice = typeof item.price === 'number' && item.price > 0 && !item.price_on_request;
              const currentOption = selectedOptions[item.id] || (item.options ? item.options[0] : null);
              const multiplier = currentOption?.multiplier ?? 1;
              const calculatedPrice = hasPrice ? Math.round((item.price || 0) * multiplier) : 0;

              // Gallery carousel
              const gallery = item.gallery_images && item.gallery_images.length > 0 ? item.gallery_images : [item.image];
              const activeIndex = activePhotos[item.id] ?? 0;

              const handlePrevPhoto = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setActivePhotos(prev => ({
                  ...prev,
                  [item.id]: activeIndex === 0 ? gallery.length - 1 : activeIndex - 1
                }));
              };

              const handleNextPhoto = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setActivePhotos(prev => ({
                  ...prev,
                  [item.id]: activeIndex === gallery.length - 1 ? 0 : activeIndex + 1
                }));
              };

              // General Info / Minisite URL (supports dedicated minisite or custom general URL)
              const generalInfoUrl = item.minisite_url || (item.business_slug ? `/${item.business_slug}#sec_3_facilities` : '#');
              const isExternalInfoUrl = generalInfoUrl.startsWith('http://') || generalInfoUrl.startsWith('https://') || generalInfoUrl.startsWith('//');
              const infoButtonLabel = item.minisite_label || 'More About ↗';

              // External price verification & comparison URL (e.g. Booking.com, TripAdvisor)
              const externalCheckUrl = item.external_check_url ||
                item.comparison_links?.booking_com_url ||
                item.comparison_links?.tripadvisor_url ||
                item.custom_links?.find(l => l.type === 'external_ota')?.url;
              const externalCheckLabel = item.external_check_label ||
                (item.comparison_links?.ota_name ? `Check on ${item.comparison_links.ota_name} ↗` : 'Check on Booking.com ↗');

              // Benchmark price savings
              const benchmarkPrice = item.comparison_links?.ota_benchmark_price;
              const savings = hasPrice && benchmarkPrice && benchmarkPrice > calculatedPrice ? benchmarkPrice - calculatedPrice : null;

              return (
                <article
                  key={item.id}
                  style={{
                    background: '#0d150f',
                    border: '1px solid rgba(212,175,55,0.22)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    position: 'relative'
                  }}
                >
                  {/* ── CARD TOP: PROVIDER HEADER STRIP ── */}
                  <div style={{
                    padding: '0.85rem 1.25rem',
                    background: 'linear-gradient(90deg, #101c13 0%, #152618 100%)',
                    borderBottom: '1px solid rgba(212,175,55,0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    {isExternalInfoUrl ? (
                      <a
                        href={generalInfoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>🏛️</span>
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {item.business_name}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span>✓ Verified Provider</span>
                            <span>•</span>
                            <span style={{ textDecoration: 'underline' }}>{infoButtonLabel}</span>
                          </div>
                        </div>
                      </a>
                    ) : (
                      <Link
                        href={generalInfoUrl}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>🏛️</span>
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {item.business_name}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span>✓ Verified Provider</span>
                            <span>•</span>
                            <span style={{ textDecoration: 'underline' }}>{infoButtonLabel}</span>
                          </div>
                        </div>
                      </Link>
                    )}

                    {item.rating && (
                      <div style={{
                        background: 'rgba(212,175,55,0.15)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        color: accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span>★</span>
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* ── CARD PHOTO GALLERY CAROUSEL ── */}
                  <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', background: '#070b08' }}>
                    <img
                      src={gallery[activeIndex]}
                      alt={item.title_en}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(13,21,15,0.92) 0%, rgba(13,21,15,0.2) 60%, transparent 100%)'
                    }} />

                    {/* View tag pill */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(8,14,10,0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      color: '#fde68a',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{item.icon || '📍'}</span>
                      <span>{item.badge_en || 'Siwa Sanctuary'}</span>
                    </div>

                    {/* Has pool badge if true */}
                    {item.has_pool && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(21,78,54,0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(74,222,128,0.4)',
                        color: '#86efac',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 800
                      }}>
                        🏊 Spring Pool
                      </div>
                    )}

                    {/* Photo Carousel Controls */}
                    {gallery.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevPhoto}
                          aria-label="Previous photo"
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.65)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            lineHeight: 1
                          }}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={handleNextPhoto}
                          aria-label="Next photo"
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.65)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            lineHeight: 1
                          }}
                        >
                          ›
                        </button>

                        {/* Dot indicators */}
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '4px'
                        }}>
                          {gallery.map((_, i) => (
                            <span
                              key={i}
                              style={{
                                width: i === activeIndex ? '16px' : '5px',
                                height: '5px',
                                borderRadius: '3px',
                                background: i === activeIndex ? accentColor : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.2s ease'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── CARD BODY ── */}
                  <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.85rem' }}>
                    
                    {/* Location View Detailed Headline */}
                    {item.view_type && (
                      <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(212,175,55,0.08)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(212,175,55,0.18)'
                      }}>
                        <span>📍</span>
                        <span>{item.view_type}</span>
                      </div>
                    )}

                    <div>
                      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1.35 }}>
                        {item.title_en}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(248,250,252,0.7)', lineHeight: 1.55 }}>
                        {item.desc_en}
                      </p>
                    </div>

                    {/* Room Tier Options Selector */}
                    {item.options && item.options.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.67rem', fontWeight: 800, color: 'rgba(248,250,252,0.6)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          Select Room Tier / Layout:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {item.options.map(opt => {
                            const isOptActive = currentOption?.id === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedOptions(prev => ({ ...prev, [item.id]: opt }))}
                                style={{
                                  background: isOptActive ? 'rgba(212,175,55,0.18)' : '#132016',
                                  border: isOptActive ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                                  color: isOptActive ? '#f8fafc' : 'rgba(248,250,252,0.7)',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '8px',
                                  fontSize: '0.72rem',
                                  fontWeight: isOptActive ? 800 : 600,
                                  cursor: 'pointer'
                                }}
                              >
                                <span>{opt.name_en}</span>
                                {opt.capacity && <span style={{ opacity: 0.6 }}> ({opt.capacity})</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hot Offer Direct Perk Banner */}
                    {item.hot_offer && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(62,36,21,0.7) 0%, rgba(36,54,37,0.6) 100%)',
                        border: '1px solid rgba(212,175,55,0.35)',
                        borderRadius: '12px',
                        padding: '0.6rem 0.85rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.6rem'
                      }}>
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🔥</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fde68a', textTransform: 'uppercase' }}>
                            {item.hot_offer.badge_label || 'Direct Booker Advantage'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'rgba(248,250,252,0.9)', marginTop: '2px', lineHeight: 1.4 }}>
                            {item.hot_offer.perk_description}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── EXTERNAL PRICE CHECK & PLATFORM DISCOUNT CALLOUT ── */}
                    {(externalCheckUrl || item.direct_discount_note || benchmarkPrice || item.discount_percentage) && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(16,28,19,0.85) 0%, rgba(21,38,24,0.7) 100%)',
                        border: '1px solid rgba(212,175,55,0.22)',
                        borderRadius: '12px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {externalCheckUrl && (
                            <a
                              href={externalCheckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.72rem',
                                color: '#93c5fd',
                                textDecoration: 'none',
                                fontWeight: 800,
                                background: 'rgba(30,58,138,0.25)',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(147,197,253,0.3)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>🏨</span>
                              <span>{externalCheckLabel}</span>
                            </a>
                          )}

                          {benchmarkPrice && (
                            <div style={{ fontSize: '0.68rem', color: 'rgba(248,250,252,0.55)', marginLeft: 'auto' }}>
                              OTA Price: <span style={{ textDecoration: 'line-through' }}>EGP {benchmarkPrice.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Direct Platform Discount Note */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.73rem',
                          color: '#4ade80',
                          fontWeight: 800
                        }}>
                          <span>🛡️</span>
                          <span>
                            {item.direct_discount_note ||
                             (savings ? `Book direct on Siwify & save EGP ${savings.toLocaleString()} vs external OTAs` :
                             (item.discount_percentage ? `Get our ${item.discount_percentage}% Direct Platform Discount` :
                             'Direct Platform Advantage: Best Rate Guarantee + Local Oasis Perks'))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Price and Comparison Strip */}
                    <div style={{
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline'
                    }}>
                      {hasPrice ? (
                        <div>
                          {benchmarkPrice && savings && (
                            <div style={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.5)', marginBottom: '2px' }}>
                              <span>Booking.com: </span>
                              <span style={{ textDecoration: 'line-through' }}>EGP {benchmarkPrice.toLocaleString()}</span>
                              <span style={{ color: '#4ade80', fontWeight: 800, marginLeft: '4px' }}>Save EGP {savings.toLocaleString()}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: accentColor }}>
                              EGP {calculatedPrice.toLocaleString()}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.6)', fontWeight: 700 }}>
                              /{item.price_unit || 'night'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: '0.66rem', color: '#fde68a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            ✨ Transparent Direct Rates
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: accentColor }}>
                            Rates Upon Request
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'rgba(248,250,252,0.5)' }}>
                            Custom direct quote &amp; seasonal availability
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dual Action CTAs: More About / General Link + Direct Reservation/Inquiry */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem', marginTop: '0.2rem' }}>
                      {isExternalInfoUrl ? (
                        <a
                          href={generalInfoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#132016',
                            border: `1.5px solid ${accentColor}`,
                            color: '#f8fafc',
                            padding: '0.75rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                          }}
                        >
                          <span>🏛️ {infoButtonLabel}</span>
                        </a>
                      ) : (
                        <Link
                          href={generalInfoUrl}
                          style={{
                            background: '#132016',
                            border: `1.5px solid ${accentColor}`,
                            color: '#f8fafc',
                            padding: '0.75rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                          }}
                        >
                          <span>🏛️ {infoButtonLabel}</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => setBookingModalItem(item)}
                        style={{
                          background: 'linear-gradient(135deg, #d4af37 0%, #b48a28 100%)',
                          color: '#070b08',
                          border: 'none',
                          padding: '0.75rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
                        }}
                      >
                        <span>{hasPrice ? 'Reserve Direct →' : 'Inquire Direct →'}</span>
                      </button>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>

      {/* Direct Booking Modal */}
      {bookingModalItem && (
        <CommercialBookingModal
          item={bookingModalItem}
          onClose={() => setBookingModalItem(null)}
          accentColor={accentColor}
        />
      )}
    </section>
  );
}
