'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AccommodationTemplateTier,
  TIER_META,
  isTierEligible,
} from '@/lib/accommodation-template-registry';

export interface AccommodationMasterTemplateProps {
  data: Record<string, any>;
  tier?: AccommodationTemplateTier;
  accentColor?: string;
  mode?: 'preview' | 'live';
  onBookDirect?: (item: any) => void;
}

export default function AccommodationMasterTemplate({
  data,
  tier = 'luxury_estate',
  accentColor = '#D4AF37',
  mode = 'live',
  onBookDirect,
}: AccommodationMasterTemplateProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room_1');

  // Helper to check if a feature belongs to this tier
  const allows = (requiredTier: AccommodationTemplateTier) =>
    isTierEligible(tier, requiredTier);

  // Field fallbacks
  const businessName = data.business_name || data.title_en || 'Siwa Sanctuary';
  const tagline = data.tagline || 'Rest Beneath Ancient Desert Palms & Starlit Skies';
  const descEn = data.desc_en || data.description || 'Experience authentic mudbrick hospitality in Siwa Oasis.';
  const coverImage = data.cover_image || data.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80';
  const logoUrl = data.logo_url || data.logo;
  const rating = data.rating || 4.9;
  const reviewsCount = data.reviews_count || 48;
  const price = data.price;
  const priceOnRequest = data.price_on_request || (!price && price !== 0);
  const priceUnit = data.price_unit || 'night';
  const currency = data.currency || 'EGP';
  const locationName = data.location_name || 'Siwa Oasis, Egypt';
  const whatsappNumber = data.whatsapp_number || '201001234567';

  // Discovery fields
  const settingLocation = data.setting_location || 'on_lake_and_pool';
  const accommodationType = data.accommodation_type || 'ecolodge';
  const vibeTags: string[] = Array.isArray(data.vibe_tags) ? data.vibe_tags : ['lake_silence', 'desert_stars'];
  const viewType = data.view_type || 'Direct Salt Lake Horizon & Palm Canopy';
  const buildingMaterial = data.building_material || 'Hand-hewn Kershef Salt Rock & Palm Wood';
  const hasPool = data.has_pool !== undefined ? Boolean(data.has_pool) : true;
  const hotSpring = Boolean(data.hot_spring);

  // Photos
  const galleryImages: string[] = Array.isArray(data.gallery_images) && data.gallery_images.length > 0
    ? data.gallery_images
    : [coverImage, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80', 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80'];

  // Rooms
  const roomTypes: any[] = Array.isArray(data.room_types) && data.room_types.length > 0
    ? data.room_types
    : [
        { id: 'room_1', name_en: 'Kershef Mudbrick King Suite', name_ar: 'جناح الكرشيف الملكي', capacity: '2 Adults', price_delta: 0, desc: 'Panoramic terrace facing lake, natural ventilation, en-suite salt bath.' },
        { id: 'room_2', name_en: 'Palm Canopy Family Chalet', name_ar: 'شاليه العائلة وسط النخيل', capacity: '4 Adults', price_delta: 1200, desc: 'Two double bedrooms, shaded courtyard with direct pool and spring access.' },
      ];

  const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I would like to inquire about reserving at ${businessName} via Siwify.`)}`;

  return (
    <article
      style={{
        background: '#070b08',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* ── TIER STATUS BANNER (Preview Mode or Admin Insight) ── */}
      {mode === 'preview' && (
        <div
          style={{
            background: 'linear-gradient(90deg, #132016, #18281b)',
            padding: '0.6rem 1.25rem',
            borderBottom: '1px solid rgba(212,175,55,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{TIER_META[tier].icon}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: TIER_META[tier].color }}>
              TEMPLATE LEVEL {TIER_META[tier].level}: {TIER_META[tier].label}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'rgba(248,250,252,0.6)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {TIER_META[tier].badge}
          </span>
        </div>
      )}

      {/* ── SECTION 1: HERO / COVER / IDENTITY (Basic Listing +) ── */}
      <div style={{ position: 'relative', minHeight: '380px', overflow: 'hidden' }}>
        <img
          src={galleryImages[activePhotoIdx] || coverImage}
          alt={businessName}
          style={{
            width: '100%',
            height: '380px',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7,11,8,0.2) 0%, rgba(7,11,8,0.7) 65%, #070b08 100%)',
          }}
        />

        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {data.is_trusted && (
              <span
                style={{
                  background: 'rgba(212,175,55,0.9)',
                  color: '#070b08',
                  padding: '4px 10px',
                  borderRadius: '30px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                }}
              >
                ★ TRUSTED SANCTUARY
              </span>
            )}
            <span
              style={{
                background: 'rgba(13,21,15,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '4px 10px',
                borderRadius: '30px',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#f8fafc',
              }}
            >
              📍 {locationName}
            </span>
          </div>

          {/* Rating Pill */}
          {allows('standard_camp') && (
            <div
              style={{
                background: 'rgba(13,21,15,0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(212,175,55,0.3)',
                padding: '4px 10px',
                borderRadius: '30px',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#D4AF37',
              }}
            >
              ★ {rating} <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>({reviewsCount})</span>
            </div>
          )}
        </div>

        {/* Identity Headings overlay */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '2px solid #D4AF37',
                  objectFit: 'cover',
                  background: '#0d150f',
                }}
              />
            )}
            <div>
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
                  fontWeight: 900,
                  margin: '0 0 0.2rem',
                  color: '#f8fafc',
                  letterSpacing: '-0.02em',
                }}
              >
                {businessName}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: 'rgba(248,250,252,0.75)',
                  fontWeight: 500,
                }}
              >
                {tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: GALLERY CAROUSEL (Standard Camp +) ── */}
      {allows('standard_camp') && galleryImages.length > 1 && (
        <div
          style={{
            padding: '0.8rem 1.25rem',
            background: '#0d150f',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          {galleryImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActivePhotoIdx(i)}
              style={{
                width: '70px',
                height: '48px',
                borderRadius: '8px',
                overflow: 'hidden',
                flexShrink: 0,
                border: activePhotoIdx === i ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)',
                padding: 0,
                cursor: 'pointer',
                opacity: activePhotoIdx === i ? 1 : 0.65,
                transition: 'all 0.15s ease',
              }}
            >
              <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      {/* ── SECTION 3: DISCOVERY TAXONOMY PILLS (Standard Camp +) ── */}
      {allows('standard_camp') && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(19,32,22,0.5)',
            borderBottom: '1px solid rgba(212,175,55,0.12)',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
            Setting &amp; Vibe:
          </span>
          <span
            style={{
              background: 'rgba(212,175,55,0.15)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#D4AF37',
              padding: '3px 9px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            📍 {settingLocation.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#f8fafc',
              padding: '3px 9px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            🛖 {accommodationType.replace(/_/g, ' ').toUpperCase()}
          </span>
          {hasPool && (
            <span
              style={{
                background: 'rgba(14,165,233,0.15)',
                border: '1px solid rgba(14,165,233,0.3)',
                color: '#38bdf8',
                padding: '3px 9px',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              🏊 Pool On-Site
            </span>
          )}
          {hotSpring && (
            <span
              style={{
                background: 'rgba(249,115,22,0.15)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: '#fb923c',
                padding: '3px 9px',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              ♨️ Natural Hot Spring
            </span>
          )}
          {vibeTags.slice(0, 3).map((vt) => (
            <span
              key={vt}
              style={{
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.25)',
                color: '#86efac',
                padding: '3px 9px',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              ✨ {vt.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* ── SECTION 4: NARRATIVE & ARCHITECTURAL DNA ── */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#f8fafc' }}>
            The Sanctuary Story
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: 'rgba(248,250,252,0.7)' }}>
            {descEn}
          </p>

          {allows('standard_camp') && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.74rem', color: 'rgba(248,250,252,0.6)' }}>
                🏛️ <strong style={{ color: '#f8fafc' }}>Architecture:</strong> {buildingMaterial}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'rgba(248,250,252,0.6)' }}>
                🌅 <strong style={{ color: '#f8fafc' }}>Signature Vista:</strong> {viewType}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 5: PRICING & DIRECT VALUE STRIP ── */}
        <div
          style={{
            background: '#0d150f',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: '16px',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Direct Booking Rate
            </div>
            <div style={{ margin: '0.3rem 0', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              {priceOnRequest ? (
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D4AF37' }}>
                  Rates Upon Request
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>
                    {currency} {Number(price).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.5)' }}>
                    / {priceUnit}
                  </span>
                </>
              )}
            </div>

            {/* Direct discount perk */}
            {data.direct_discount_note && (
              <div
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  borderRadius: '8px',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.72rem',
                  color: '#D4AF37',
                  fontWeight: 600,
                  margin: '0.5rem 0',
                }}
              >
                ★ {data.direct_discount_note}
              </div>
            )}

            {/* OTA Price Benchmark Verification */}
            {allows('premium_lodge') && data.external_check_url && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                <a
                  href={data.external_check_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93c5fd', textDecoration: 'underline' }}
                >
                  {data.external_check_label || 'Compare live prices on Booking.com ↗'}
                </a>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                background: '#25D366',
                color: '#fff',
                padding: '0.65rem',
                borderRadius: '10px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>💬</span>
              <span>{priceOnRequest ? 'Inquire Direct' : 'Book on WhatsApp'}</span>
            </a>

            {onBookDirect && !priceOnRequest && (
              <button
                type="button"
                onClick={() => onBookDirect(data)}
                style={{
                  background: accentColor,
                  color: '#070b08',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reserve Online →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 6: ROOM & SUITE CONFIGURATIONS (Standard Camp +) ── */}
      {allows('standard_camp') && roomTypes.length > 0 && (
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: accentColor, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Selected Suites &amp; Living Units
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {roomTypes.map((rm) => (
              <div
                key={rm.id}
                style={{
                  background: '#0d150f',
                  border: selectedRoomId === rm.id ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setSelectedRoomId(rm.id)}
              >
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>
                  {rm.name_en}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.5)', margin: '0.2rem 0' }}>
                  👥 {rm.capacity || '2 Guests'} • {rm.desc || 'En-suite bath, natural airflow'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 7: GASTRONOMY & EXPERIENCES (Premium Lodge +) ── */}
      {allows('premium_lodge') && (data.has_on_site_restaurant || data.curated_activities) && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: '#0a100c',
            borderTop: '1px solid rgba(212,175,55,0.12)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {data.has_on_site_restaurant && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fde68a', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                🍽️ Farm-To-Table Dining
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                {data.restaurant_name || 'Sanctuary Lantern Kitchen'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.65)', marginTop: '0.25rem' }}>
                Authentic wood-fire Mandi lamb, garden date salads, cold-pressed olive oils &amp; sunrise breakfast.
              </div>
            </div>
          )}

          {data.curated_activities && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#86efac', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                🧭 Desert Expeditions On-Site
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                Curated Oasis Retreat Inclusions
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.65)', marginTop: '0.25rem' }}>
                Salt lake float therapy, 4x4 sand sea safaris &amp; fireside stargazing circles.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 8: MASTER HOT OFFER / VIP ADVANTAGE (Luxury Estate Level) ── */}
      {allows('luxury_estate') && (data.hot_offer_title || data.hot_offer_perk) && (
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(90deg, #1f1807, #132016)',
            borderTop: '1px solid rgba(212,175,55,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fde68a', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {data.hot_offer_badge || '🔥 VIP ADVANTAGE (MASTER LEVEL EXCLUSIVE)'}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#D4AF37' }}>
              {data.hot_offer_title || 'Imperial Estate Privilege'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'rgba(248,250,252,0.85)' }}>
              {data.hot_offer_perk || 'Complimentary private 4x4 desert transfer & sunset dates tea ceremony'}
            </div>
          </div>
          <div
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '20px',
              background: 'rgba(212,175,55,0.2)',
              border: '1px solid #D4AF37',
              color: '#D4AF37',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            Level 4 Master Active
          </div>
        </div>
      )}
    </article>
  );
}
