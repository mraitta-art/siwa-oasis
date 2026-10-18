'use client';

import React, { useState, useRef } from 'react';
import { CommercialItem, CommercialOption, CardCustomLink } from '@/lib/commercial-types';
import CommercialBookingModal from '@/components/CommercialBookingModal';

export interface CommercialBookingEngineProps {
  item: CommercialItem;
  mode?: 'standalone' | 'embedded';
  slotTimeStart?: string;
  slotTimeEnd?: string;
  onSelectOption?: (option: CommercialOption) => void;
  onCustomiseClick?: () => void;
  accentColor?: string;
  showDirectBookButton?: boolean;
}

// ─── Authentic Siwa Oasis Palette (Olive, Date Roots, Palm, Golden Dunes) ──
const SECTOR_CONFIG: Record<string, { gradient: string; label: string; icon: string; accent: string }> = {
  accommodation:  { gradient: 'linear-gradient(135deg, #132016 0%, #223425 100%)', label: 'Accommodation', icon: '🛖', accent: '#3fa36c' },
  dining:         { gradient: 'linear-gradient(135deg, #24140a 0%, #4a2814 100%)', label: 'Dining',        icon: '🍽️', accent: '#e58e26' },
  transports:     { gradient: 'linear-gradient(135deg, #18281b 0%, #28402c 100%)', label: 'Transport',     icon: '🚙', accent: '#d4af37' },
  activities:     { gradient: 'linear-gradient(135deg, #14281c 0%, #20422d 100%)', label: 'Activity',      icon: '🌊', accent: '#4ade80' },
  tours:          { gradient: 'linear-gradient(135deg, #2a1e0e 0%, #4d371a 100%)', label: 'Tour',          icon: '🧭', accent: '#f59e0b' },
  products:       { gradient: 'linear-gradient(135deg, #25180f 0%, #462c19 100%)', label: 'Product',       icon: '🫒', accent: '#c8963e' },
};

// ─── LINK TYPE STYLES (Oasis Dark Olive, Date Roots & Dune Gold) ─────────────
const LINK_TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  platform_vendor: { bg: 'linear-gradient(135deg, #15291b, #24422b)', color: '#86efac', border: '1px solid rgba(134,239,172,0.3)' },
  external_ota:    { bg: 'linear-gradient(135deg, #1c271e, #253629)', color: '#fde68a', border: '1px solid rgba(212,175,55,0.25)' },
  direct_partner:  { bg: 'linear-gradient(135deg, #331e11, #52311b)', color: '#fde68a', border: '1px solid rgba(245,158,11,0.3)' },
  social_contact:  { bg: 'linear-gradient(135deg, #182e1f, #23472e)', color: '#86efac', border: '1px solid rgba(74,222,128,0.3)' },
  custom:          { bg: '#1c271e', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' },
};

export default function CommercialBookingEngine({
  item,
  mode = 'standalone',
  slotTimeStart,
  slotTimeEnd,
  onSelectOption,
  onCustomiseClick,
  accentColor = '#D4AF37',
  showDirectBookButton = true,
}: CommercialBookingEngineProps) {
  const [selectedOption, setSelectedOption] = useState<CommercialOption | null>(
    item.options && item.options.length > 0 ? item.options[0] : null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const multiplier = selectedOption?.multiplier ?? 1;
  const currentPrice = Math.round(item.price * multiplier);

  const gallery = item.gallery_images && item.gallery_images.length > 0
    ? item.gallery_images
    : [item.image];

  // Resolve links (admin custom_links first, then legacy comparison_links)
  const resolvedLinks: CardCustomLink[] = (item.custom_links && item.custom_links.length > 0)
    ? item.custom_links.filter(l => l.is_active !== false)
    : (item.comparison_links ? [
        ...(item.comparison_links.booking_com_url ? [{
          id: 'legacy_booking', title: 'Booking.com Benchmark',
          url: item.comparison_links.booking_com_url, type: 'external_ota' as const,
          ota_name: item.comparison_links.ota_name ?? 'Booking.com',
          benchmark_price: item.comparison_links.ota_benchmark_price,
          badge_text: `Booking.com`, accent_color: '#d4af37', icon: '🏨', is_active: true,
        }] : []),
        ...(item.comparison_links.tripadvisor_url ? [{
          id: 'legacy_ta', title: 'TripAdvisor Traveler Rating',
          url: item.comparison_links.tripadvisor_url, type: 'external_ota' as const,
          ota_name: 'TripAdvisor', badge_text: 'TripAdvisor',
          accent_color: '#4ade80', icon: '⭐', is_active: true,
        }] : []),
        ...(item.comparison_links.viator_url ? [{
          id: 'legacy_viator', title: 'Viator Experience Check',
          url: item.comparison_links.viator_url, type: 'external_ota' as const,
          ota_name: 'Viator', badge_text: 'Viator',
          accent_color: '#f59e0b', icon: '🧭', is_active: true,
        }] : []),
        ...(item.comparison_links.google_reviews_url ? [{
          id: 'legacy_google', title: 'Google Maps & Location',
          url: item.comparison_links.google_reviews_url, type: 'custom' as const,
          badge_text: 'Google Maps', accent_color: '#e58e26', icon: '📍', is_active: true,
        }] : []),
      ] : []);

  const benchmarkLink = resolvedLinks.find(l => l.benchmark_price && l.benchmark_price > currentPrice);
  const savings = benchmarkLink?.benchmark_price ? benchmarkLink.benchmark_price - currentPrice : null;

  const cfg = SECTOR_CONFIG[item.sector] ?? SECTOR_CONFIG.accommodation;

  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setActiveImg(i => (i === 0 ? gallery.length - 1 : i - 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setActiveImg(i => (i === gallery.length - 1 ? 0 : i + 1)); };
  const handleOption = (opt: CommercialOption) => { setSelectedOption(opt); onSelectOption?.(opt); };

  // ═══════════════════════════════════════════════════════════════════════════════
  // ① EMBEDDED MODE — Compact Dark Olive Glass Card (Itinerary & Retreat Day Plan)
  // ═══════════════════════════════════════════════════════════════════════════════
  if (mode === 'embedded') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #0d150f 0%, #17241a 100%)',
        border: '1px solid rgba(212,175,55,0.18)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}>
        {/* Accent glow line top */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }} />

        {/* Compact Gallery Strip */}
        {gallery.length > 0 && (
          <div style={{ position: 'relative', height: '140px', overflow: 'hidden', background: '#111b13' }}>
            <img
              src={gallery[activeImg]}
              alt={item.title_en}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(13,21,15,0.92) 0%, transparent 60%)',
            }} />

            {/* Sector badge */}
            <div style={{
              position: 'absolute', top: '8px', left: '10px',
              background: 'rgba(13,21,15,0.85)', backdropFilter: 'blur(12px)',
              border: `1px solid ${accentColor}40`,
              padding: '3px 10px', borderRadius: '20px',
              fontSize: '0.65rem', fontWeight: 800, color: accentColor,
              textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <span>{item.icon || cfg.icon}</span>
              <span>{cfg.label}</span>
            </div>

            {/* Time slot badge */}
            {(slotTimeStart || slotTimeEnd) && (
              <div style={{
                position: 'absolute', top: '8px', right: '10px',
                background: 'rgba(13,21,15,0.85)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '0.68rem', fontWeight: 800, color: '#e2e8f0',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span>⏱️</span>
                <span>{slotTimeStart}{slotTimeEnd ? ` – ${slotTimeEnd}` : ''}</span>
              </div>
            )}

            {/* Photo nav */}
            {gallery.length > 1 && (
              <>
                <button type="button" onClick={handlePrev} aria-label="Previous image" style={{
                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: '26px', height: '26px', color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>‹</button>
                <button type="button" onClick={handleNext} aria-label="Next image" style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: '26px', height: '26px', color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>›</button>
              </>
            )}

            {/* Rating */}
            {item.rating && (
              <div style={{
                position: 'absolute', bottom: '8px', right: '10px',
                background: 'rgba(13,21,15,0.85)', backdropFilter: 'blur(8px)',
                padding: '3px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px',
                fontSize: '0.7rem', fontWeight: 900, color: '#fbbf24',
              }}>
                ★ {item.rating}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Title row */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor, marginBottom: '3px' }}>
              {item.business_name}
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1.35 }}>
              {item.title_en}
            </h4>
          </div>

          {/* Description */}
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(248,250,252,0.65)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.desc_en}
          </p>

          {/* ── SPECIAL TRANSPORTATION MODERN HUB ── */}
          {item.sector === 'transports' && (
            <div style={{
              background: 'linear-gradient(145deg, #132015, #1d3020)',
              borderRadius: '14px',
              padding: '0.75rem 0.85rem',
              border: '1px solid rgba(212,175,55,0.2)',
              display: 'flex', flexDirection: 'column', gap: '0.55rem',
            }}>
              {item.route_label && (
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fde68a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛣️</span><span>{item.route_label}</span>
                </div>
              )}

              {/* Transit dual-schedule */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(46,75,49,0.4)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '0.5rem 0.6rem' }}>
                  <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: '#86efac', fontWeight: 800, marginBottom: '2px' }}>
                    📍 DEPARTS
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#4ade80' }}>
                    {item.departure_time || 'Daily Schedule'}
                  </div>
                  {item.departure_station && (
                    <div style={{ fontSize: '0.64rem', color: 'rgba(248,250,252,0.65)', marginTop: '2px' }}>
                      {item.departure_station}
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(69,40,23,0.45)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '10px', padding: '0.5rem 0.6rem' }}>
                  <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: '#fde68a', fontWeight: 800, marginBottom: '2px' }}>
                    🏁 ARRIVES
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#D4AF37' }}>
                    {item.estimated_arrival_time || 'Siwa Center'}
                  </div>
                  {item.arrival_station && (
                    <div style={{ fontSize: '0.64rem', color: 'rgba(248,250,252,0.65)', marginTop: '2px' }}>
                      {item.arrival_station}
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle & Capacity Pill */}
              {(item.vehicle_type || item.vehicle_capacity) && (
                <div style={{ fontSize: '0.68rem', color: '#f8fafc', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🚐</span>
                  <span style={{ fontWeight: 700 }}>{item.vehicle_type}</span>
                  {item.vehicle_capacity && <span style={{ opacity: 0.6 }}>· {item.vehicle_capacity} Seats</span>}
                </div>
              )}
            </div>
          )}

          {/* Trust & Provider Links */}
          {resolvedLinks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {resolvedLinks.slice(0, 3).map(link => {
                const isPV = link.type === 'platform_vendor' || link.is_registered_vendor;
                const st = LINK_TYPE_STYLE[link.type] ?? LINK_TYPE_STYLE.custom;
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '0.3rem 0.7rem', borderRadius: '20px',
                    fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none',
                    background: st.bg, color: st.color, border: st.border,
                    transition: 'all 0.15s ease',
                  }}>
                    <span>{link.icon ?? '↗'}</span>
                    <span>{link.badge_text ?? link.title}</span>
                    {isPV && <span style={{ fontSize: '0.6rem' }}>🛡️</span>}
                  </a>
                );
              })}
            </div>
          )}

          {/* Hot Offer */}
          {item.hot_offer && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(69,40,23,0.6), rgba(89,52,30,0.4))',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '12px', padding: '0.6rem 0.8rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🔥</span>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.hot_offer.badge_label ?? 'Direct Booking Advantage'}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'rgba(248,250,252,0.85)', marginTop: '2px', lineHeight: 1.4 }}>
                  {item.hot_offer.perk_description}
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          {item.options && item.options.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {item.options.map(opt => {
                const isSelected = selectedOption?.id === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => handleOption(opt)} style={{
                    padding: '0.32rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                    border: isSelected ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)',
                    background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                    color: isSelected ? accentColor : 'rgba(248,250,252,0.65)', transition: 'all 0.15s',
                  }}>
                    {opt.name_en}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(248,250,252,0.45)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Direct Rate</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                  {item.currency} {currentPrice.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.5)' }}>/{item.price_unit}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              {onCustomiseClick && (
                <button type="button" onClick={onCustomiseClick} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.35rem 0.7rem',
                  fontSize: '0.7rem', fontWeight: 700, color: '#cbd5e1', cursor: 'pointer',
                }}>
                  Change
                </button>
              )}
              {showDirectBookButton && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #c8963e 100%)`,
                    color: '#0d150f',
                    border: 'none', borderRadius: '8px',
                    padding: '0.45rem 1rem', fontSize: '0.75rem', fontWeight: 900,
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(212,175,55,0.25)',
                  }}
                >
                  Book Direct
                </button>
              )}
            </div>
          </div>
        </div>

        {isModalOpen && (
          <CommercialBookingModal
            item={item}
            onClose={() => setIsModalOpen(false)}
            accentColor={accentColor}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ② STANDALONE MODE — Full Cinematic Dark Olive & Golden Dunes Showcase Card
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <article
      ref={cardRef}
      style={{
        background: '#0d150f',
        border: '1px solid rgba(212,175,55,0.18)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)';
      }}
    >
      {/* ── ① HERO GALLERY CAROUSEL ── */}
      <div style={{ position: 'relative', height: '260px', overflow: 'hidden', background: '#111b13' }}>
        <img
          src={gallery[activeImg]}
          alt={item.title_en}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          loading="lazy"
        />

        {/* Cinematic gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, #0d150f 0%, rgba(13,21,15,0.4) 50%, rgba(13,21,15,0.1) 100%)',
        }} />

        {/* Top Badges Bar */}
        <div style={{
          position: 'absolute', top: '14px', left: '14px', right: '14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 2,
        }}>
          {/* Sector Pill */}
          <div style={{
            background: 'rgba(13,21,15,0.85)', backdropFilter: 'blur(12px)',
            border: `1px solid ${accentColor}40`,
            padding: '4px 12px', borderRadius: '30px',
            fontSize: '0.7rem', fontWeight: 900, color: accentColor,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            display: 'flex', alignItems: 'center', gap: '5px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}>
            <span>{item.icon || cfg.icon}</span>
            <span>{cfg.label}</span>
          </div>

          {/* Rating Chip */}
          {item.rating && (
            <div style={{
              background: 'rgba(13,21,15,0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(251,191,36,0.3)',
              padding: '4px 10px', borderRadius: '20px',
              fontSize: '0.74rem', fontWeight: 900, color: '#fbbf24',
              display: 'flex', alignItems: 'center', gap: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>
              <span>★</span>
              <span>{item.rating}</span>
              {item.reviews_count && (
                <span style={{ color: 'rgba(248,250,252,0.6)', fontSize: '0.68rem', fontWeight: 600 }}>
                  ({item.reviews_count})
                </span>
              )}
            </div>
          )}

          {/* Photo counter */}
          {gallery.length > 1 && (
            <div style={{
              background: 'rgba(13,21,15,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '3px 10px', borderRadius: '20px',
              fontSize: '0.65rem', fontWeight: 800, color: '#cbd5e1',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <span>📷</span>
              <span>{activeImg + 1}/{gallery.length}</span>
            </div>
          )}
        </div>

        {/* Carousel Controls */}
        {gallery.length > 1 && (
          <>
            <button type="button" onClick={handlePrev} aria-label="Previous image" style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(13,21,15,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%',
              width: '36px', height: '36px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', transition: 'all 0.2s', zIndex: 3,
            }}>‹</button>
            <button type="button" onClick={handleNext} aria-label="Next image" style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(13,21,15,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%',
              width: '36px', height: '36px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', transition: 'all 0.2s', zIndex: 3,
            }}>›</button>

            {/* Pill-dot indicator */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '5px', alignItems: 'center', zIndex: 3,
            }}>
              {gallery.map((_, idx) => (
                <button key={idx} type="button" onClick={() => setActiveImg(idx)} aria-label={`View photo ${idx + 1}`} style={{
                  width: idx === activeImg ? '22px' : '6px',
                  height: '6px', borderRadius: '3px', border: 'none', padding: 0, cursor: 'pointer',
                  background: idx === activeImg ? accentColor : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.25s ease',
                  boxShadow: idx === activeImg ? `0 0 8px ${accentColor}` : 'none',
                }} />
              ))}
            </div>
          </>
        )}

        {/* Title overlay on hero */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '1rem 1.4rem 1.1rem',
          zIndex: 2,
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
            {item.business_name}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            {item.title_en}
          </h3>
          {item.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.72rem', color: 'rgba(248,250,252,0.75)' }}>
              <span>📍</span><span>{item.location_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ② CARD BODY ── */}
      <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'rgba(248,250,252,0.7)', lineHeight: 1.65 }}>
          {item.desc_en}
        </p>

        {/* ── ③ VERIFIED LINKS & BENCHMARK PRICES (Dark Olive / Date Roots) ── */}
        {resolvedLinks.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #111b12 0%, #19271a 100%)',
            borderRadius: '18px',
            padding: '1rem 1.15rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            border: '1px solid rgba(212,175,55,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.67rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                🔗 Verified Provider &amp; Market Rates
              </span>
            </div>

            {/* Link pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {resolvedLinks.map(link => {
                const isPV = link.type === 'platform_vendor' || link.is_registered_vendor;
                const st = LINK_TYPE_STYLE[link.type] ?? LINK_TYPE_STYLE.custom;
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '0.4rem 0.9rem', borderRadius: '30px',
                    fontSize: '0.73rem', fontWeight: 800, textDecoration: 'none',
                    background: st.bg, color: st.color, border: st.border,
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}>
                    <span>{link.icon ?? '↗'}</span>
                    <span>{link.badge_text ?? link.title}</span>
                    {isPV && <span style={{ fontSize: '0.6rem' }}>🛡️</span>}
                    {link.benchmark_price && (
                      <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 700 }}>
                        EGP {link.benchmark_price.toLocaleString()}
                      </span>
                    )}
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>↗</span>
                  </a>
                );
              })}
            </div>

            {/* Arbitrage savings callout */}
            {benchmarkLink && savings && savings > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.65rem 0.9rem',
                background: 'linear-gradient(135deg, rgba(34,54,36,0.6), rgba(46,75,49,0.4))',
                border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: '12px',
                flexWrap: 'wrap', gap: '0.4rem',
              }}>
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>{benchmarkLink.ota_name ?? 'Market'} benchmark: </span>
                  <span style={{ textDecoration: 'line-through', fontWeight: 800, color: 'rgba(248,250,252,0.45)' }}>
                    EGP {benchmarkLink.benchmark_price?.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 800 }}>Direct Savings:</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #15291b, #24422b)',
                    color: '#86efac', padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.72rem', fontWeight: 900,
                    border: '1px solid rgba(74,222,128,0.3)',
                  }}>
                    💰 EGP {savings.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ④ HOT OFFER CALLOUT (Date Palm Roots & Golden Dunes) ── */}
        {item.hot_offer && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(62,36,21,0.6) 0%, rgba(94,55,32,0.4) 50%, rgba(36,54,37,0.5) 100%)',
            border: '1.5px solid rgba(212,175,55,0.35)',
            borderRadius: '18px',
            padding: '1rem 1.15rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(212,175,55,0.15)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>🔥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                {item.hot_offer.badge_label ?? 'Direct Booking Advantage'}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1.35, marginBottom: '4px' }}>
                {item.hot_offer.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fde68a', lineHeight: 1.5 }}>
                {item.hot_offer.perk_description}
              </div>
            </div>
          </div>
        )}

        {/* ── ⑤ MODERN TRANSPORTATION COMPLETE SPECIFICATION ── */}
        {item.sector === 'transports' && (
          <div style={{
            background: 'linear-gradient(145deg, #111c13 0%, #1a2a1c 100%)',
            borderRadius: '20px', padding: '1.15rem',
            display: 'flex', flexDirection: 'column', gap: '0.85rem',
            border: '1px solid rgba(212,175,55,0.22)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          }}>
            {/* Header: Journey Type & Route */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>🚌</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.booking_unit_type === 'seat' ? 'Scheduled Passenger Coach' : 'Private Desert 4x4 Expedition'}
                </span>
              </div>
              {item.duration_approx && (
                <span style={{
                  background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                  padding: '3px 12px', borderRadius: '20px',
                  fontSize: '0.7rem', color: '#fde68a', fontWeight: 800,
                }}>
                  ⏱️ Journey: {item.duration_approx}
                </span>
              )}
            </div>

            {item.route_label && (
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                🛣️ {item.route_label}
              </div>
            )}

            {/* Departure ─── Arrival Visual Transit Path */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Departure Station */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(34,54,36,0.6), rgba(46,75,49,0.35))',
                border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: '14px', padding: '0.8rem 0.9rem',
              }}>
                <div style={{ fontSize: '0.62rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '3px' }}>
                  📍 DEPARTURE STATION
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ade80' }}>
                  {item.departure_time ?? 'Scheduled Departure'}
                </div>
                {item.departure_station && (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(248,250,252,0.85)', marginTop: '4px', fontWeight: 600 }}>
                    {item.departure_station}
                  </div>
                )}
              </div>

              {/* Arrival Station */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(62,36,21,0.6), rgba(89,52,30,0.35))',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: '14px', padding: '0.8rem 0.9rem',
              }}>
                <div style={{ fontSize: '0.62rem', color: '#fde68a', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '3px' }}>
                  🏁 OASIS ARRIVAL
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#D4AF37' }}>
                  {item.estimated_arrival_time ?? 'Siwa Arrival'}
                </div>
                {item.arrival_station && (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(248,250,252,0.85)', marginTop: '4px', fontWeight: 600 }}>
                    {item.arrival_station}
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Model & Fleet Capacity Strip */}
            {(item.vehicle_type || item.vehicle_capacity) && (
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', padding: '0.65rem 0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f8fafc' }}>
                  <span>🚐</span>
                  <span><strong style={{ color: '#D4AF37' }}>Fleet Model:</strong> {item.vehicle_type}</span>
                </div>
                {item.vehicle_capacity && (
                  <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 800 }}>
                    👥 Capacity: {item.vehicle_capacity} Seats
                  </div>
                )}
              </div>
            )}

            {/* Amenities Grid */}
            {item.amenities && item.amenities.length > 0 && (
              <div>
                <div style={{ fontSize: '0.64rem', fontWeight: 900, color: 'rgba(248,250,252,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Vehicle Comforts &amp; Features:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {item.amenities.map((a, i) => (
                    <span key={i} style={{
                      background: 'rgba(46,75,49,0.3)',
                      border: '1px solid rgba(74,222,128,0.2)',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '0.7rem', color: '#e2e8f0', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span style={{ color: '#4ade80' }}>✓</span> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ⑥ SENSORY & ARCHITECTURAL DNA (Non-transport) ── */}
        {item.sector !== 'transports' && (item.building_material || item.view_type || item.vibe_ambience || item.menu_highlights) && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '0.9rem 1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
          }}>
            {item.building_material && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#cbd5e1' }}>
                <span>🏛️</span>
                <span><strong style={{ color: '#D4AF37' }}>Structure:</strong> {item.building_material}</span>
              </div>
            )}
            {item.view_type && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#cbd5e1' }}>
                <span>🌅</span>
                <span><strong style={{ color: '#D4AF37' }}>View:</strong> {item.view_type}</span>
              </div>
            )}
            {item.vibe_ambience && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: 'rgba(248,250,252,0.7)' }}>
                <span>✨</span><em>{item.vibe_ambience}</em>
              </div>
            )}
            {item.menu_highlights && item.menu_highlights.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#cbd5e1', gridColumn: '1 / -1' }}>
                <span>🍽️</span><span><strong style={{ color: '#D4AF37' }}>Menu:</strong> {item.menu_highlights.join(' · ')}</span>
              </div>
            )}
          </div>
        )}

        {/* ── ⑦ EXECUTING PARTNER BADGE ── */}
        {item.executing_partner && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
            background: 'linear-gradient(135deg, rgba(20,38,23,0.7) 0%, rgba(34,60,38,0.5) 100%)',
            border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: '14px', padding: '0.65rem 0.9rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#f8fafc' }}>{item.executing_partner.name}</div>
                <div style={{ fontSize: '0.68rem', color: '#86efac' }}>{item.executing_partner.role_title}</div>
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #15291b, #24422b)',
              color: '#86efac', padding: '4px 12px', borderRadius: '20px',
              fontSize: '0.65rem', fontWeight: 900,
              border: '1px solid rgba(134,239,172,0.3)',
            }}>
              {item.executing_partner.verified_badge}
            </div>
          </div>
        )}

        {/* ── ⑧ OPTION SELECTOR ── */}
        {item.options && item.options.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'rgba(248,250,252,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Configuration / Route:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {item.options.map(opt => {
                const isSel = selectedOption?.id === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => handleOption(opt)} style={{
                    padding: '0.45rem 0.95rem', borderRadius: '10px',
                    fontSize: '0.77rem', fontWeight: 700, cursor: 'pointer',
                    border: isSel ? `2px solid ${accentColor}` : '1.5px solid rgba(255,255,255,0.08)',
                    background: isSel ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                    color: isSel ? '#fde68a' : 'rgba(248,250,252,0.7)',
                    transition: 'all 0.15s ease',
                    boxShadow: isSel ? '0 0 12px rgba(212,175,55,0.2)' : 'none',
                  }}>
                    {opt.name_en}
                    {opt.capacity && <span style={{ fontSize: '0.65rem', marginLeft: '4px', opacity: 0.6 }}>· {opt.capacity}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ⑨ PACKAGE INCLUSIONS ── */}
        {item.inclusions && item.inclusions.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              ✨ Package Inclusions:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.35rem' }}>
              {item.inclusions.map((inc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: 'rgba(248,250,252,0.8)' }}>
                  <span style={{ color: '#4ade80', fontWeight: 900, flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ⑩ PRICE & DIRECT BOOKING CTA ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'auto', paddingTop: '1.1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <div>
            {item.original_price && item.original_price > currentPrice && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)', textDecoration: 'line-through', marginBottom: '1px' }}>
                {item.currency} {item.original_price.toLocaleString()}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                {item.currency} {currentPrice.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', fontWeight: 600 }}>/{item.price_unit}</span>
            </div>
            {item.discount_percentage && item.discount_percentage > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 800, marginTop: '1px' }}>
                Save {item.discount_percentage}% Direct Booking Advantage
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, #b88628 100%)`,
              color: '#0d150f',
              border: 'none',
              padding: '0.85rem 1.8rem',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 900,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(212,175,55,0.25)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(212,175,55,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'none';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(212,175,55,0.25)';
            }}
          >
            <span>{cfg.icon}</span>
            <span>Book Directly</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <CommercialBookingModal
          item={item}
          onClose={() => setIsModalOpen(false)}
          accentColor={accentColor}
        />
      )}
    </article>
  );
}
