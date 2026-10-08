'use client';

import React from 'react';
import Link from 'next/link';
import { CanonicalSectionId, CANONICAL_SECTIONS } from '@/lib/section-registry';
import { getSectionBridge, SectionBridgeEntry } from '@/lib/section-mainsite-bridge';

export interface SectionBridgeItem {
  id: string;
  title: string;
  description?: string;
  price?: number | string;
  currency?: string;
  image_url?: string;
  booking_url?: string;
  business_id?: string;
  business_name?: string;
  business_slug?: string;
  business_logo?: string;
  vendor_phone?: string;
  vendor_whatsapp?: string;
  is_featured?: boolean | number;
  discount_percent?: number;
}

export interface SectionMainSiteBridgeHubProps {
  /** The canonical section ID this hub block represents */
  sectionId: CanonicalSectionId;
  /** Items to render inside this section hub (e.g. packages, offers, gallery) */
  items?: SectionBridgeItem[];
  /** If scoped to a specific business */
  business?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    phone?: string;
    whatsapp?: string;
    is_trusted?: boolean;
  };
  /** Context: 'main_site' = embedded on siwify.com page, 'minisite' = embedded on business minisite */
  context?: 'main_site' | 'minisite';
  /** Title override */
  customTitle?: string;
  /** Subtitle override */
  customSubtitle?: string;
  /** Show navigation back to the opposite hub */
  showBridgeCrossLink?: boolean;
}

export default function SectionMainSiteBridgeHub({
  sectionId,
  items = [],
  business,
  context = 'main_site',
  customTitle,
  customSubtitle,
  showBridgeCrossLink = true,
}: SectionMainSiteBridgeHubProps) {
  const sectionMeta = (CANONICAL_SECTIONS as readonly any[]).find((s) => s.id === sectionId) || null;
  const bridge: SectionBridgeEntry | null = getSectionBridge(sectionId);

  const sectionName = sectionMeta?.name || 'Section Hub';
  const sectionMainSiteLabel = sectionMeta?.mainSiteLabel || sectionName;

  const title =
    customTitle ||
    (context === 'main_site'
      ? business
        ? `${business.name} — ${sectionName}`
        : sectionMainSiteLabel
      : sectionName);

  const defaultSubtitle =
    sectionId === 'sec_8_connector'
      ? context === 'main_site'
        ? business
          ? `Direct promotional deals, seasonal savings, and 0% commission direct rates from ${business.name}.`
          : `Verified promotional deals, seasonal savings, and exclusive direct discounts across Siwa Oasis.`
        : `Exclusive direct reservation offers & discounts from ${business?.name || 'this provider'} with instant confirmation.`
      : sectionId === 'sec_5_experiences'
      ? context === 'main_site'
        ? business
          ? `Complete travel packages, multi-day itineraries, and desert tours curated by ${business.name}.`
          : `All-inclusive journeys, desert safari itineraries, and guided experience packages across Siwa Oasis.`
        : `Handcrafted tour packages, safari expeditions, and curated itineraries by ${business?.name || 'this provider'}.`
      : context === 'main_site'
      ? business
        ? `Direct from ${business.name} with 0% platform commission & instant WhatsApp confirmation.`
        : `Verified offerings curated across Siwa Oasis businesses with direct booking rates.`
      : `Part of our official SiwaToday ${sectionMainSiteLabel} presence.`;

  const subtitle = customSubtitle || defaultSubtitle;

  const mainSiteUrl = sectionMeta?.mainSiteUrl || '/';
  const minisiteUrl = business ? `/${business.slug}#${sectionId}` : null;

  return (
    <div
      id={sectionId}
      style={{
        width: '100%',
        margin: '2rem 0',
        padding: 'clamp(1.25rem, 3vw, 2.5rem)',
        borderRadius: '1.25rem',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(9, 14, 23, 0.98))',
        border: '1px solid rgba(212, 175, 55, 0.22)',
        color: '#f8fafc',
        fontFamily: 'inherit',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* ─── Header & Bridge Metadata ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${sectionMeta?.color || '#D4AF37'} 0%, rgba(212, 175, 55, 0.2) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {sectionMeta?.emoji || '✨'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: sectionMeta?.color || '#D4AF37',
                  background: 'rgba(212, 175, 55, 0.1)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                {sectionMeta?.id}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <i className="fas fa-database" style={{ fontSize: '0.65rem', color: '#10b981' }} />
                {sectionMeta?.primaryTable} (Live Synced)
              </span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
                fontWeight: 800,
                color: '#ffffff',
                margin: '0.3rem 0 0 0',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h2>
          </div>
        </div>

        {/* ─── Bidirectional Cross-Navigation Pill ──────────────────────────── */}
        {showBridgeCrossLink && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {context === 'main_site' && minisiteUrl && business ? (
              <Link
                href={minisiteUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#D4AF37',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '0.65rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fas fa-store" />
                <span>Visit {business.name} Minisite Hub</span>
                <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
              </Link>
            ) : (
              <Link
                href={mainSiteUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '0.65rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fas fa-globe" />
                <span>Explore all {sectionMeta?.mainSiteLabel || 'Packages'} on Main Site</span>
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.75rem' }} />
              </Link>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.92rem', color: '#94a3b8', margin: '0 0 1.5rem 0', maxWidth: '780px' }}>
        {subtitle}
      </p>

      {/* ─── Items Grid ────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{sectionMeta?.emoji || '📦'}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
            No active items currently listed in {sectionMeta?.name || 'this section'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
            When items are added in the admin catalog or vendor hub, they instantly appear on both the main site {mainSiteUrl} and the business minisite.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {items.map((item) => {
            const itemBizName = item.business_name || business?.name || 'Siwa Provider';
            const itemBizSlug = item.business_slug || business?.slug;
            const itemPhone = item.vendor_phone || business?.phone;
            const itemWhatsapp = item.vendor_whatsapp || business?.whatsapp || itemPhone;
            const cleanPhone = itemWhatsapp ? itemWhatsapp.replace(/[^0-9]/g, '') : '';
            const waUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello ${itemBizName}, I am inquiring about "${item.title}" seen on SiwaToday. Can I get direct reservation pricing?`
                )}`
              : null;

            return (
              <div
                key={item.id}
                style={{
                  borderRadius: '1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Media Image */}
                {item.image_url ? (
                  <div style={{ position: 'relative', height: '175px', width: '100%', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {item.discount_percent && item.discount_percent > 0 ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#dc2626',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        -{item.discount_percent}% OFF
                      </span>
                    ) : null}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#D4AF37',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                      }}
                    >
                      0% Commission
                    </span>
                  </div>
                ) : null}

                {/* Content */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {itemBizName && (
                    <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 700, marginBottom: '0.35rem' }}>
                      {itemBizSlug ? (
                        <Link href={`/${itemBizSlug}`} style={{ color: '#D4AF37', textDecoration: 'none' }}>
                          <i className="fas fa-store" style={{ marginRight: '0.35rem' }} />
                          {itemBizName}
                        </Link>
                      ) : (
                        <span>{itemBizName}</span>
                      )}
                    </div>
                  )}

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
                    {item.title}
                  </h3>

                  {item.description && (
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: '#94a3b8',
                        margin: '0 0 1rem 0',
                        lineHeight: 1.4,
                        flex: 1,
                      }}
                    >
                      {item.description.length > 110 ? `${item.description.slice(0, 110)}...` : item.description}
                    </p>
                  )}

                  {/* Price & Actions */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      {item.price ? (
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                          {item.price} <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.currency || 'EGP'}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                          Direct Booking
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#25D366',
                            color: '#fff',
                            textDecoration: 'none',
                            fontSize: '1rem',
                          }}
                          title="WhatsApp direct reservation"
                        >
                          <i className="fab fa-whatsapp" />
                        </a>
                      )}
                      {itemPhone && (
                        <a
                          href={`tel:${itemPhone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                          }}
                          title="Call direct"
                        >
                          <i className="fas fa-phone" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
