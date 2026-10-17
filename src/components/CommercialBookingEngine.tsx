'use client';

import React, { useState } from 'react';
import { CommercialItem, SectorType, CommercialOption } from '@/lib/commercial-types';
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

export default function CommercialBookingEngine({
  item,
  mode = 'standalone',
  slotTimeStart,
  slotTimeEnd,
  onSelectOption,
  onCustomiseClick,
  accentColor = '#D4AF37',
  showDirectBookButton = true
}: CommercialBookingEngineProps) {
  const [selectedOption, setSelectedOption] = useState<CommercialOption | null>(
    item.options && item.options.length > 0 ? item.options[0] : null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const multiplier = selectedOption?.multiplier || 1;
  const currentPrice = Math.round(item.price * multiplier);

  const handleOptionChange = (opt: CommercialOption) => {
    setSelectedOption(opt);
    if (onSelectOption) onSelectOption(opt);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EMBEDDED RETREAT TIMELINE MODE
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === 'embedded') {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{item.icon || '🛖'}</span>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>
                {item.sector.toUpperCase()} • {item.business_name}
              </div>
              <h4 style={{ margin: '0.15rem 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {item.title_en}
              </h4>
            </div>
          </div>

          {(slotTimeStart || slotTimeEnd) && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.3rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span>⏱️</span>
              <span>{slotTimeStart || ''} {slotTimeEnd ? `— ${slotTimeEnd}` : ''}</span>
            </div>
          )}
        </div>

        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
          {item.desc_en}
        </p>

        {/* Sensory & Architectural DNA (Material, View, Vibe, Menu) */}
        {(item.building_material || item.view_type || item.vibe_ambience || item.menu_highlights) && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #f1f5f9',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            fontSize: '0.74rem'
          }}>
            {item.building_material && (
              <div style={{ display: 'flex', gap: '0.4rem', color: '#334155' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>🏛️ Structure:</span>
                <span>{item.building_material}</span>
              </div>
            )}
            {item.view_type && (
              <div style={{ display: 'flex', gap: '0.4rem', color: '#334155' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>🌅 View:</span>
                <span style={{ fontWeight: 800, color: accentColor }}>{item.view_type}</span>
              </div>
            )}
            {item.vibe_ambience && (
              <div style={{ display: 'flex', gap: '0.4rem', color: '#334155' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>✨ Atmosphere:</span>
                <span style={{ fontStyle: 'italic' }}>{item.vibe_ambience}</span>
              </div>
            )}
            {item.menu_highlights && item.menu_highlights.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', color: '#334155', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>🍽️ Menu Highlights:</span>
                <span>{item.menu_highlights.join(' • ')}</span>
              </div>
            )}
          </div>
        )}


        {/* Room / Tier Option Selector */}
        {item.options && item.options.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.2rem' }}>
            {item.options.map((opt) => {
              const isSelected = selectedOption?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOptionChange(opt)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected ? `2px solid ${accentColor}` : '1px solid #cbd5e1',
                    background: isSelected ? 'rgba(212,175,55,0.08)' : '#f8fafc',
                    color: isSelected ? '#854d0e' : '#334155'
                  }}
                >
                  {opt.name_en} {opt.multiplier && opt.multiplier !== 1 ? `(x${opt.multiplier})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer Actions & Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Included Rate: </span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{item.currency} {currentPrice.toLocaleString()}</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}> /{item.price_unit}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onCustomiseClick && (
              <button
                type="button"
                onClick={onCustomiseClick}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Change {item.sector === 'accommodation' ? 'Lodge' : item.sector}
              </button>
            )}

            {showDirectBookButton && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: accentColor,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                Book Standalone
              </button>
            )}
          </div>
        </div>

        {isModalOpen && (
          <CommercialBookingModal
            item={item}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            accentColor={accentColor}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STANDALONE MODE (E.G. FOR /siwa-stay OR HOTEL MINISITE)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <article style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      {/* Visual Header */}
      <div style={{ position: 'relative', width: '100%', height: '220px', background: '#1e293b' }}>
        <img
          src={item.image}
          alt={item.title_en}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap'
        }}>
          {item.badge_en && (
            <span style={{
              background: 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(8px)',
              color: accentColor,
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              {item.badge_en}
            </span>
          )}
          {item.discount_percentage && item.discount_percentage > 0 && (
            <span style={{
              background: '#dc2626',
              color: '#ffffff',
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.68rem',
              fontWeight: 900
            }}>
              -{item.discount_percentage}% OFF
            </span>
          )}
        </div>

        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(6px)',
          padding: '0.25rem 0.55rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>★</span>
          <span>{item.rating || 4.9}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>
            {item.business_name}
          </span>
          {item.location_name && (
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>📍 {item.location_name}</span>
          )}
        </div>

        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
          {item.title_en}
        </h3>

        <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.55, flex: 1 }}>
          {item.desc_en}
        </p>

        {/* Sensory & Architectural DNA (Material, View, Vibe, Menu) */}
        {(item.building_material || item.view_type || item.vibe_ambience || item.menu_highlights) && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            fontSize: '0.8rem'
          }}>
            {item.building_material && (
              <div style={{ display: 'flex', gap: '0.5rem', color: '#334155' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>🏛️ Architecture / Material:</span>
                <span style={{ fontWeight: 600 }}>{item.building_material}</span>
              </div>
            )}
            {item.view_type && (
              <div style={{ display: 'flex', gap: '0.5rem', color: '#334155' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>🌅 Panoramic View:</span>
                <span style={{ fontWeight: 800, color: accentColor }}>{item.view_type}</span>
              </div>
            )}
            {item.vibe_ambience && (
              <div style={{ display: 'flex', gap: '0.5rem', color: '#334155' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>✨ Ambient Vibe:</span>
                <span style={{ fontStyle: 'italic', color: '#1e293b' }}>{item.vibe_ambience}</span>
              </div>
            )}
            {item.seating_style && (
              <div style={{ display: 'flex', gap: '0.5rem', color: '#334155' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>🪑 Seating Arrangement:</span>
                <span>{item.seating_style}</span>
              </div>
            )}
            {item.menu_highlights && item.menu_highlights.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', color: '#334155', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, color: '#64748b' }}>🍽️ Signature Menu:</span>
                <span style={{ fontWeight: 600 }}>{item.menu_highlights.join(' • ')}</span>
              </div>
            )}
          </div>
        )}


        {/* Options / Room types if present */}
        {item.options && item.options.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Select Room / Tier Option:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {item.options.map(opt => {
                const isSelected = selectedOption?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleOptionChange(opt)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${accentColor}` : '1px solid #e2e8f0',
                      background: isSelected ? 'rgba(212,175,55,0.08)' : '#f8fafc',
                      color: isSelected ? '#854d0e' : '#334155'
                    }}
                  >
                    {opt.name_en}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Inclusions if Package */}
        {item.inclusions && item.inclusions.length > 0 && (
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              ✨ Package Includes:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
              {item.inclusions.map((inc, i) => (
                <li key={i}>{inc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Pricing & CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <div>
            {item.original_price && item.original_price > currentPrice && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                {item.currency} {item.original_price.toLocaleString()}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                {item.currency} {currentPrice.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                /{item.price_unit}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              background: accentColor,
              color: '#0f172a',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,175,55,0.3)',
              transition: 'transform 0.15s ease'
            }}
          >
            Book Now →
          </button>
        </div>
      </div>

      {isModalOpen && (
        <CommercialBookingModal
          item={{
            ...item,
            price: currentPrice
          }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          accentColor={accentColor}
        />
      )}
    </article>
  );
}
