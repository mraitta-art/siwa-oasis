'use client';

import React, { useState, useEffect } from 'react';
import { CommercialItem, SectorType, CommercialKind } from '@/lib/commercial-types';
import CommercialBookingModal from '@/components/CommercialBookingModal';

export interface DynamicSectorBookingShowcaseProps {
  sector?: SectorType | 'all';
  businessId?: string;
  businessSlug?: string;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  defaultKind?: CommercialKind | 'all';
  allowSectorSwitching?: boolean;
}

const SECTOR_LABELS: Record<SectorType, { en: string; icon: string }> = {
  accommodation: { en: 'Stay & Eco-Lodges', icon: 'ðŸ›–' },
  dining:        { en: 'Dining & Feasts',   icon: 'ðŸ½ï¸' },
  products:      { en: 'Oasis Products',    icon: 'ðŸ«’' },
  transports:    { en: 'Desert Transports', icon: 'ðŸš™' },
  activities:    { en: 'Wellness & Lakes',  icon: 'ðŸŒŠ' },
  tours:         { en: 'Guided Tours',      icon: 'ðŸ›ï¸' }
};

export default function DynamicSectorBookingShowcase({
  sector = 'all',
  businessId,
  businessSlug,
  title,
  subtitle,
  accentColor = '#D4AF37',
  defaultKind = 'all',
  allowSectorSwitching = true
}: DynamicSectorBookingShowcaseProps) {
  const [selectedSector, setSelectedSector] = useState<SectorType | 'all'>(sector);
  const [selectedKind, setSelectedKind] = useState<CommercialKind | 'all'>(defaultKind);
  const [selectedVibe, setSelectedVibe] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<string>('all');
  const [selectedSetting, setSelectedSetting] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [items, setItems] = useState<CommercialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBookingItem, setActiveBookingItem] = useState<CommercialItem | null>(null);

  // Fetch items dynamically with multi-criteria Vibe & View search
  useEffect(() => {
    let isMounted = true;
    async function fetchItems() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSector !== 'all') params.set('sector', selectedSector);
        if (selectedKind !== 'all') params.set('kind', selectedKind);
        if (selectedVibe !== 'all') params.set('vibe', selectedVibe);
        if (selectedView !== 'all') params.set('view', selectedView);
        if (selectedSetting !== 'all') params.set('setting', selectedSetting);
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (businessId) params.set('business_id', businessId);
        if (businessSlug) params.set('business_slug', businessSlug);

        const res = await fetch(`/api/commercial/items?${params.toString()}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setItems(data.items || []);
        }
      } catch (err) {
        console.error('Failed to load commercial items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchItems();
    return () => { isMounted = false; };
  }, [selectedSector, selectedKind, selectedVibe, selectedView, selectedSetting, searchQuery, businessId, businessSlug]);

  return (
    <section style={{
      padding: '4rem 1.5rem',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #101912 100%)',
      color: '#0F172A',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header Block */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.8rem',
            borderRadius: '20px',
            background: 'rgba(212, 175, 55, 0.12)',
            color: accentColor,
            border: `1px solid rgba(212, 175, 55, 0.3)`,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '0.6rem'
          }}>
            âœ¦ DYNAMIC SECTOR RESERVATION ENGINE
          </span>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
            fontWeight: 900,
            margin: '0.4rem 0',
            letterSpacing: '-0.5px'
          }}>
            {title || (businessSlug ? `Bookings & Packages` : `Verified Oasis Offerings`)}
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '0.95rem',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {subtitle || `Select direct bookings, discounted rates, or curated packages tailored to each verified provider in Siwa.`}
          </p>
        </div>

        {/* 1. Sector Switcher (if allowed & not single business locked) */}
        {allowSectorSwitching && !businessId && (
          <div style={{
            display: 'flex',
            gap: '0.6rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setSelectedSector('all')}
              style={{
                padding: '0.65rem 1.2rem',
                borderRadius: '30px',
                border: selectedSector === 'all' ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                background: selectedSector === 'all' ? accentColor : 'rgba(255,255,255,0.03)',
                color: selectedSector === 'all' ? '#000' : '#cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              ðŸŒŸ All Sectors
            </button>
            {(Object.keys(SECTOR_LABELS) as SectorType[]).map(s => {
              const info = SECTOR_LABELS[s];
              const isSelected = selectedSector === s;
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSector(s)}
                  style={{
                    padding: '0.65rem 1.2rem',
                    borderRadius: '30px',
                    border: isSelected ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? accentColor : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#000' : '#cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>{info.icon}</span>
                  <span>{info.en}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Commercial Kind Filter (All | Direct | Packages | Discounts & Offers) */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'all', label: 'All Listings' },
            { id: 'package', label: 'ðŸ“¦ Bundled Packages' },
            { id: 'discount', label: 'ðŸ·ï¸ Special Discounts' },
            { id: 'direct', label: 'âš¡ Direct Booking' }
          ].map(k => {
            const isSelected = selectedKind === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setSelectedKind(k.id as any)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(255,255,255,0.12)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  color: isSelected ? '#fff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {k.label}
              </button>
            );
          })}
        </div>

        {/* 2.5 Vibe, Views & Setting Atmospheric Filter Bar */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: '18px',
          padding: '1rem 1.25rem',
          marginBottom: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem' }}>âœ¨</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Filter by Oasis Vibe, Setting & Views
              </span>
            </div>

            {/* Quick search input */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Search sand baths, candlelit, lake..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.85rem 0.45rem 2rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#0a0f18',
                  color: '#fff',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#64748b' }}>ðŸ”</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  âœ•
                </button>
              )}
            </div>
          </div>

          {/* Vibe Selection Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: '0.3rem' }}>
              VIBE:
            </span>
            {[
              { id: 'all', label: 'All Vibes' },
              { id: 'sand_bath', label: 'ðŸœï¸ Sand Bath Healing' },
              { id: 'sulfur_spring', label: 'â™¨ï¸ Hot Sulfur Spring' },
              { id: 'salt_lake_float', label: 'ðŸŒŠ Salt Lake Float' },
              { id: 'candlelit_desert', label: 'ðŸ•¯ï¸ Candlelit Desert' },
              { id: 'eco_retreat', label: 'ðŸŒ¿ Eco Sanctuary' },
              { id: 'bedouin_night', label: 'â›º Bedouin Camp' },
              { id: 'lake_view', label: 'ðŸŒ… Sunset Lake' },
              { id: 'deep_desert', label: 'ðŸš™ Great Sand Sea' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVibe(v.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: selectedVibe === v.id ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                  background: selectedVibe === v.id ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
                  color: selectedVibe === v.id ? accentColor : '#cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Setting / Views Selection Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: '0.3rem' }}>
              VIEW / LOCATION:
            </span>
            {[
              { id: 'all', label: 'All Views' },
              { id: 'lake_view', label: 'ðŸŒ… Lake View' },
              { id: 'dune_view', label: 'ðŸœï¸ Dunes View' },
              { id: 'oasis_garden', label: 'ðŸŒ´ Palm Grove' },
              { id: 'mountain_view', label: 'â›°ï¸ Dakrour Mountain' },
              { id: 'cleopatra_spring', label: 'ðŸ’§ Cleopatra Spring' }
            ].map(vw => (
              <button
                key={vw.id}
                onClick={() => setSelectedView(vw.id)}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '16px',
                  border: selectedView === vw.id ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedView === vw.id ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)',
                  color: selectedView === vw.id ? '#38bdf8' : '#cbd5e1',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {vw.label}
              </button>
            ))}
            {(selectedVibe !== 'all' || selectedView !== 'all' || searchQuery.trim()) && (
              <button
                onClick={() => {
                  setSelectedVibe('all');
                  setSelectedView('all');
                  setSelectedSetting('all');
                  setSearchQuery('');
                }}
                style={{
                  marginLeft: 'auto',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '14px',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Reset Filters âœ•
              </button>
            )}
          </div>
        </div>

        {/* 3. Items Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: `2.5px solid ${accentColor}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading offerings...
          </div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <p style={{ color: '#64748b', margin: 0 }}>No items match the chosen filter.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem'
          }}>
            {items.map(item => (
              <article
                key={item.id}
                style={{
                  background: '#F8FAFC',
                  borderRadius: '24px',
                  border: item.kind === 'package' ? `1px solid ${accentColor}` : '1px solid rgba(212,175,55,0.18)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  position: 'relative'
                }}
              >
                {/* Image & Badge */}
                <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                  <img
                    src={item.image}
                    alt={item.title_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Badge */}
                  {item.badge_en && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      background: item.kind === 'package' ? accentColor : 'rgba(15, 23, 42, 0.85)',
                      color: item.kind === 'package' ? '#000' : '#fff',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      backdropFilter: 'blur(4px)'
                    }}>
                      {item.badge_en}
                    </div>
                  )}

                  {/* Sector Icon Tag */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <span>{item.icon || 'âœ¦'}</span>
                    <span style={{ textTransform: 'capitalize' }}>{item.sector}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Business provider note */}
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: accentColor,
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem'
                  }}>
                    {item.business_name}
                  </div>

                  <h3 style={{
                    margin: '0 0 0.5rem',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.4
                  }}>
                    {item.title_en}
                  </h3>

                  <p style={{
                    color: '#64748b',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    margin: '0 0 1rem',
                    flex: 1
                  }}>
                    {item.desc_en}
                  </p>

                  {/* Package inclusions list */}
                  {item.inclusions && item.inclusions.length > 0 && (
                    <ul style={{
                      margin: '0 0 1.25rem',
                      paddingLeft: '1.2rem',
                      fontSize: '0.75rem',
                      color: '#475569',
                      lineHeight: 1.7
                    }}>
                      {item.inclusions.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  )}

                  {/* Pricing and Action row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div>
                      {item.original_price && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          textDecoration: 'line-through'
                        }}>
                          {item.original_price} {item.currency}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>
                          {item.price}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                          {item.currency} / {item.price_unit}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveBookingItem(item)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '14px',
                        background: item.kind === 'package' ? accentColor : 'rgba(255,255,255,0.08)',
                        color: item.kind === 'package' ? '#000' : '#fff',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        boxShadow: item.kind === 'package' ? `0 4px 15px rgba(212, 175, 55, 0.25)` : 'none'
                      }}
                    >
                      {item.kind === 'package' ? 'Book Package â†’' : 'Reserve â†’'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Booking popup modal */}
      {activeBookingItem && (
        <CommercialBookingModal
          item={activeBookingItem}
          onClose={() => setActiveBookingItem(null)}
          accentColor={accentColor}
        />
      )}
    </section>
  );
}
