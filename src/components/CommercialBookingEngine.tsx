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

// ─── Sector Config ───────────────────────────────────────────────────────────
const SECTOR_CONFIG: Record<string, { gradient: string; label: string; icon: string }> = {
  accommodation:  { gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', label: 'Accommodation', icon: '🛖' },
  dining:         { gradient: 'linear-gradient(135deg, #1a0a00 0%, #3d1c00 100%)', label: 'Dining', icon: '🍽️' },
  transports:     { gradient: 'linear-gradient(135deg, #0c1445 0%, #1a237e 100%)', label: 'Transport', icon: '🚙' },
  activities:     { gradient: 'linear-gradient(135deg, #0a2012 0%, #14532d 100%)', label: 'Activity', icon: '🌊' },
  tours:          { gradient: 'linear-gradient(135deg, #1a0030 0%, #3b0066 100%)', label: 'Tour', icon: '🏛️' },
  products:       { gradient: 'linear-gradient(135deg, #1a1200 0%, #3d2d00 100%)', label: 'Product', icon: '🫒' },
};

// ─── LINK TYPE STYLES ─────────────────────────────────────────────────────────
const LINK_TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  platform_vendor: { bg: 'linear-gradient(135deg, #052e16, #14532d)', color: '#86efac', border: '1.5px solid rgba(134,239,172,0.3)' },
  external_ota:    { bg: '#1e293b', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' },
  direct_partner:  { bg: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,0.2)' },
  social_contact:  { bg: 'linear-gradient(135deg, #052e16, #065f46)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.3)' },
  custom:          { bg: '#1e293b', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' },
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
  const [isHovered, setIsHovered] = useState(false);
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
          id: 'legacy_booking', title: 'Booking.com Price Check',
          url: item.comparison_links.booking_com_url, type: 'external_ota' as const,
          ota_name: item.comparison_links.ota_name ?? 'Booking.com',
          benchmark_price: item.comparison_links.ota_benchmark_price,
          badge_text: `Booking.com`, accent_color: '#003580', icon: '🏨', is_active: true,
        }] : []),
        ...(item.comparison_links.tripadvisor_url ? [{
          id: 'legacy_ta', title: 'TripAdvisor Reviews',
          url: item.comparison_links.tripadvisor_url, type: 'external_ota' as const,
          ota_name: 'TripAdvisor', badge_text: 'TripAdvisor',
          accent_color: '#00aa6c', icon: '⭐', is_active: true,
        }] : []),
        ...(item.comparison_links.viator_url ? [{
          id: 'legacy_viator', title: 'Viator Experience',
          url: item.comparison_links.viator_url, type: 'external_ota' as const,
          ota_name: 'Viator', badge_text: 'Viator',
          accent_color: '#ff5533', icon: '🧭', is_active: true,
        }] : []),
        ...(item.comparison_links.google_reviews_url ? [{
          id: 'legacy_google', title: 'Google Reviews & Map',
          url: item.comparison_links.google_reviews_url, type: 'custom' as const,
          badge_text: 'Google Maps', accent_color: '#ea4335', icon: '📍', is_active: true,
        }] : []),
      ] : []);

  const benchmarkLink = resolvedLinks.find(l => l.benchmark_price && l.benchmark_price > currentPrice);
  const savings = benchmarkLink?.benchmark_price ? benchmarkLink.benchmark_price - currentPrice : null;

  const cfg = SECTOR_CONFIG[item.sector] ?? SECTOR_CONFIG.accommodation;

  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setActiveImg(i => (i === 0 ? gallery.length - 1 : i - 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setActiveImg(i => (i === gallery.length - 1 ? 0 : i + 1)); };
  const handleOption = (opt: CommercialOption) => { setSelectedOption(opt); onSelectOption?.(opt); };

  // ═══════════════════════════════════════════════════════════════════════════════
  // ①  EMBEDDED MODE — Compact dark glass card for Retreat Timeline / Planner
  // ═══════════════════════════════════════════════════════════════════════════════
  if (mode === 'embedded') {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}>
        {/* Accent glow line top */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: 0.7,
        }} />

        {/* Mini Image Strip with thumbnails */}
        {gallery.length > 0 && (
          <div style={{ position: 'relative', height: '130px', overflow: 'hidden', background: '#0a0f1e' }}>
            <img
              src={gallery[activeImg]}
              alt={item.title_en}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'all 0.4s ease' }}
            />
            {/* Dark gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.65) 100%)',
            }} />

            {/* Sector badge */}
            <div style={{
              position: 'absolute', top: '8px', left: '10px',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
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
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
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
                <button type="button" onClick={handlePrev} style={{
                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>‹</button>
                <button type="button" onClick={handleNext} style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>›</button>
              </>
            )}

            {/* Rating */}
            {item.rating && (
              <div style={{
                position: 'absolute', bottom: '8px', right: '10px',
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                padding: '3px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px',
                fontSize: '0.7rem', fontWeight: 900, color: '#fbbf24',
              }}>
                ★ {item.rating}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {/* Title row */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor, marginBottom: '3px' }}>
              {item.business_name}
            </div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1.35 }}>
              {item.title_en}
            </h4>
          </div>

          {/* Description */}
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.desc_en}
          </p>

          {/* Sensory DNA row */}
          {(item.view_type || item.vibe_ambience || item.menu_highlights) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {item.view_type && (
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', gap: '6px' }}>
                  <span style={{ color: accentColor }}>🌅</span>
                  <span style={{ fontWeight: 700, color: accentColor }}>{item.view_type}</span>
                </div>
              )}
              {item.vibe_ambience && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', gap: '6px' }}>
                  <span>✨</span><span style={{ fontStyle: 'italic' }}>{item.vibe_ambience}</span>
                </div>
              )}
              {item.menu_highlights && item.menu_highlights.length > 0 && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span>🍽️</span><span>{item.menu_highlights.slice(0, 3).join(' · ')}</span>
                </div>
              )}
              {item.route_label && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', gap: '6px' }}>
                  <span>🛣️</span><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{item.route_label}</span>
                </div>
              )}
            </div>
          )}

          {/* Transit block */}
          {item.sector === 'transports' && item.departure_time && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(2,132,199,0.2)', borderRadius: '10px', padding: '0.5rem 0.65rem' }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#7dd3fc', fontWeight: 800, marginBottom: '2px' }}>Departure</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#38bdf8' }}>{item.departure_time}</div>
                {item.departure_station && <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '1px' }}>{item.departure_station}</div>}
              </div>
              <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '10px', padding: '0.5rem 0.65rem' }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#86efac', fontWeight: 800, marginBottom: '2px' }}>Arrival</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#4ade80' }}>{item.estimated_arrival_time ?? '—'}</div>
                {item.arrival_station && <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '1px' }}>{item.arrival_station}</div>}
              </div>
            </div>
          )}

          {/* Trust Links */}
          {resolvedLinks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {resolvedLinks.slice(0, 3).map(link => {
                const isPV = link.type === 'platform_vendor' || link.is_registered_vendor;
                const st = LINK_TYPE_STYLE[link.type] ?? LINK_TYPE_STYLE.custom;
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '0.28rem 0.65rem', borderRadius: '20px',
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
              background: 'linear-gradient(135deg, rgba(120,53,15,0.4), rgba(146,64,14,0.2))',
              border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: '10px', padding: '0.55rem 0.75rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1rem' }}>🔥</span>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.hot_offer.badge_label ?? 'Direct Booking Perk'}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#fde68a', marginTop: '2px', lineHeight: 1.4 }}>
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
                    padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                    border: isSelected ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)',
                    background: isSelected ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
                    color: isSelected ? accentColor : '#94a3b8', transition: 'all 0.15s',
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
              <div style={{ fontSize: '0.62rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Included Rate</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f1f5f9' }}>
                  {item.currency} {currentPrice.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>/{item.price_unit}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              {onCustomiseClick && (
                <button type="button" onClick={onCustomiseClick} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.35rem 0.7rem',
                  fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer',
                }}>
                  Change
                </button>
              )}
              {showDirectBookButton && (
                <button type="button" onClick={() => setIsModalOpen(true)} style={{
                  background: `linear-gradient(135deg, ${accentColor}, #f0c842)`,
                  border: 'none', borderRadius: '8px', padding: '0.35rem 0.85rem',
                  fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', cursor: 'pointer',
                  boxShadow: `0 4px 14px ${accentColor}40`,
                }}>
                  Book Now
                </button>
              )}
            </div>
          </div>
        </div>

        {isModalOpen && (
          <CommercialBookingModal item={item} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} accentColor={accentColor} />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ②  STANDALONE MODE — Full cinematic card for /siwa-stay, /siwa-table etc.
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#ffffff',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: isHovered
          ? `0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px ${accentColor}30`
          : '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative',
      }}
    >
      {/* ── ① HERO GALLERY ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '260px', background: '#0a0f1e', overflow: 'hidden', flexShrink: 0 }}>
        {/* Main Image */}
        <img
          src={gallery[activeImg]}
          alt={item.title_en}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.6s ease, opacity 0.4s ease',
            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
          }}
        />

        {/* Cinematic Gradient Overlays */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%),
                       linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        {/* Sector Pill — top left */}
        <div style={{
          position: 'absolute', top: '14px', left: '14px',
          background: cfg.gradient,
          border: `1px solid ${accentColor}40`,
          backdropFilter: 'blur(16px)',
          padding: '5px 13px', borderRadius: '30px',
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '0.67rem', fontWeight: 900, color: accentColor,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
        }}>
          <span style={{ fontSize: '0.85rem' }}>{item.icon ?? cfg.icon}</span>
          <span>{cfg.label}</span>
        </div>

        {/* Discount badge — top left (secondary) */}
        {item.discount_percentage && item.discount_percentage > 0 && (
          <div style={{
            position: 'absolute', top: '14px', left: '14px', marginTop: '36px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            borderRadius: '8px', padding: '4px 10px',
            fontSize: '0.68rem', fontWeight: 900, color: '#fff',
            boxShadow: '0 3px 12px rgba(220,38,38,0.4)',
          }}>
            -{item.discount_percentage}% OFF
          </div>
        )}

        {/* Top right — Rating + image counter */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px',
        }}>
          {/* Rating chip */}
          {item.rating && (
            <div style={{
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '5px 12px', borderRadius: '30px',
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '0.78rem', fontWeight: 900, color: '#fbbf24',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}>
              <span>★</span>
              <span>{item.rating}</span>
              {item.reviews_count && (
                <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                  ({item.reviews_count})
                </span>
              )}
            </div>
          )}

          {/* Photo counter */}
          {gallery.length > 1 && (
            <div style={{
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
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
            <button type="button" onClick={handlePrev} aria-label="Previous" style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
              width: '36px', height: '36px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 300, transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>‹</button>
            <button type="button" onClick={handleNext} aria-label="Next" style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
              width: '36px', height: '36px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 300, transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>›</button>

            {/* Pill-dot indicator */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              {gallery.map((_, idx) => (
                <button key={idx} type="button" onClick={() => setActiveImg(idx)} style={{
                  width: idx === activeImg ? '22px' : '6px',
                  height: '6px', borderRadius: '3px', border: 'none', padding: 0, cursor: 'pointer',
                  background: idx === activeImg ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.25s ease',
                  boxShadow: idx === activeImg ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
                }} />
              ))}
            </div>
          </>
        )}

        {/* Bottom — Title overlay on hero */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '1rem 1.4rem 1.1rem',
          zIndex: 2,
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
            {item.business_name}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {item.title_en}
          </h3>
          {item.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.72)' }}>
              <span>📍</span><span>{item.location_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ② BODY ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.65 }}>
          {item.desc_en}
        </p>

        {/* ── ③ TRUST LINKS & PRICE BENCHMARK ── */}
        {resolvedLinks.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '20px',
            padding: '1rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.67rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                🔗 Verified Links & Reference Prices
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    <span>{link.icon ?? '↗'}</span>
                    <span>{link.badge_text ?? link.title}</span>
                    {isPV && <span style={{ fontSize: '0.6rem' }}>🛡️</span>}
                    {link.benchmark_price && (
                      <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 600 }}>
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
                padding: '0.6rem 0.85rem',
                background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(16,185,129,0.06))',
                border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: '12px',
                flexWrap: 'wrap', gap: '0.4rem',
              }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  <span>{benchmarkLink.ota_name ?? 'OTA'} rate: </span>
                  <span style={{ textDecoration: 'line-through', fontWeight: 800, color: '#94a3b8' }}>
                    EGP {benchmarkLink.benchmark_price?.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>You Save:</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #052e16, #14532d)',
                    color: '#86efac', padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.72rem', fontWeight: 900,
                    border: '1px solid rgba(74,222,128,0.2)',
                  }}>
                    💰 EGP {savings.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ④ HOT OFFER CALLOUT ── */}
        {item.hot_offer && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fff7ed 100%)',
            border: '1.5px solid rgba(245,158,11,0.35)',
            borderRadius: '18px',
            padding: '1rem 1.15rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
            boxShadow: '0 4px 20px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251,191,36,0.2), transparent)',
              pointerEvents: 'none',
            }} />
            <div style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>🔥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                {item.hot_offer.badge_label ?? 'Direct Booking Advantage'}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#78350f', lineHeight: 1.35, marginBottom: '4px' }}>
                {item.hot_offer.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
                {item.hot_offer.perk_description}
              </div>
            </div>
          </div>
        )}

        {/* ── ⑤ SENSORY / ARCHITECTURAL DNA ── */}
        {(item.building_material || item.view_type || item.vibe_ambience || item.seating_style || item.menu_highlights) && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '0.9rem 1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
          }}>
            {item.building_material && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#334155' }}>
                <span style={{ color: '#94a3b8' }}>🏛️</span>
                <span><strong style={{ color: '#475569' }}>Structure:</strong> {item.building_material}</span>
              </div>
            )}
            {item.view_type && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#334155' }}>
                <span style={{ color: accentColor }}>🌅</span>
                <span><strong style={{ color: accentColor }}>View:</strong> {item.view_type}</span>
              </div>
            )}
            {item.vibe_ambience && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#475569' }}>
                <span>✨</span>
                <em>{item.vibe_ambience}</em>
              </div>
            )}
            {item.seating_style && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#475569' }}>
                <span>🪑</span>
                <span>{item.seating_style}</span>
              </div>
            )}
            {item.menu_highlights && item.menu_highlights.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.79rem', color: '#475569', gridColumn: '1 / -1' }}>
                <span>🍽️</span>
                <span><strong>Menu:</strong> {item.menu_highlights.join(' · ')}</span>
              </div>
            )}
          </div>
        )}

        {/* ── ⑥ TRANSPORT SCHEDULE BLOCK ── */}
        {item.sector === 'transports' && (item.departure_time || item.route_label) && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: '18px', padding: '1rem 1.15rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            border: `1px solid ${accentColor}20`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🚌 {item.booking_unit_type === 'seat' ? 'Scheduled Coach' : 'Private Charter'}
              </span>
              {item.duration_approx && (
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
                  ⏱️ {item.duration_approx}
                </span>
              )}
            </div>
            {item.route_label && (
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f1f5f9' }}>🛣️ {item.route_label}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(2,132,199,0.25)', borderRadius: '12px', padding: '0.65rem 0.8rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#7dd3fc', textTransform: 'uppercase', fontWeight: 800, marginBottom: '3px' }}>Departs</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>{item.departure_time ?? 'On-demand'}</div>
                {item.departure_station && <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px' }}>📍 {item.departure_station}</div>}
              </div>
              <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '12px', padding: '0.65rem 0.8rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 800, marginBottom: '3px' }}>Arrives</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#4ade80' }}>{item.estimated_arrival_time ?? '—'}</div>
                {item.arrival_station && <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px' }}>🏁 {item.arrival_station}</div>}
              </div>
            </div>
            {item.amenities && item.amenities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {item.amenities.map((a, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 10px', borderRadius: '20px', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                    ✓ {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ⑦ EXECUTING PARTNER BADGE ── */}
        {item.executing_partner && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: '14px', padding: '0.65rem 0.9rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#166534' }}>{item.executing_partner.name}</div>
                <div style={{ fontSize: '0.68rem', color: '#15803d' }}>{item.executing_partner.role_title}</div>
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #14532d, #166534)',
              color: '#86efac', padding: '4px 12px', borderRadius: '20px',
              fontSize: '0.65rem', fontWeight: 900,
              border: '1px solid rgba(134,239,172,0.25)',
            }}>
              {item.executing_partner.verified_badge}
            </div>
          </div>
        )}

        {/* ── ⑧ OPTION SELECTOR ── */}
        {item.options && item.options.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Choose Option:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {item.options.map(opt => {
                const isSel = selectedOption?.id === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => handleOption(opt)} style={{
                    padding: '0.45rem 0.9rem', borderRadius: '10px',
                    fontSize: '0.77rem', fontWeight: 700, cursor: 'pointer',
                    border: isSel ? `2px solid ${accentColor}` : '1.5px solid #e2e8f0',
                    background: isSel ? `${accentColor}12` : '#f8fafc',
                    color: isSel ? '#854d0e' : '#475569',
                    transition: 'all 0.15s ease',
                    boxShadow: isSel ? `0 0 0 3px ${accentColor}20` : 'none',
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
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              ✨ Package Includes:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.35rem' }}>
              {item.inclusions.map((inc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: '#475569' }}>
                  <span style={{ color: '#16a34a', fontWeight: 900, flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ⑩ PRICE + CTA FOOTER ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'auto', paddingTop: '1rem',
          borderTop: '1px solid #f1f5f9',
          gap: '0.75rem', flexWrap: 'wrap',
        }}>
          {/* Price Block */}
          <div>
            {item.original_price && item.original_price > currentPrice && (
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '1px' }}>
                {item.currency} {item.original_price.toLocaleString()}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {item.currency} {currentPrice.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>/{item.price_unit}</span>
            </div>
            {item.discount_percentage && item.discount_percentage > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 800, marginTop: '1px' }}>
                Save {item.discount_percentage}% — Limited Offer
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, #f0c842 100%)`,
              color: '#0f172a',
              border: 'none',
              padding: '0.85rem 1.8rem',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: `0 6px 24px ${accentColor}50`,
              transition: 'all 0.2s ease',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 10px 32px ${accentColor}60`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 24px ${accentColor}50`;
            }}
          >
            Book Now →
          </button>
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      {isModalOpen && (
        <CommercialBookingModal
          item={{ ...item, price: currentPrice }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          accentColor={accentColor}
        />
      )}
    </article>
  );
}
