'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

interface MarketplaceHeaderProps {
  title?: string;
  activePath?: string;
  navLinks?: NavLink[];
  accentColor?: string;
  brandLabel?: string;
  brandIcon?: string;
  brandImage?: string;
  logoHeight?: number;
  showBrand?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export const CANONICAL_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home', icon: 'fa-house' },
  { href: '/siwa-stay', label: 'Siwa Stay', icon: 'fa-hotel' },
  { href: '/siwa-table', label: 'Siwa Table', icon: 'fa-utensils' },
  { href: '/siwa-go', label: 'Siwa Go', icon: 'fa-compass' },
  { href: '/siwa-retreats', label: 'Siwa Retreats', icon: 'fa-spa' },
  { href: '/siwa-products', label: 'Siwa Products', icon: 'fa-store' },
  { href: '/siwa-invest', label: 'Siwa Invest', icon: 'fa-chart-line' },
  { href: '/siwa-society', label: 'Siwa Society', icon: 'fa-people-group' },
];

export default function MarketplaceHeader({
  title = 'SiWiFy',
  activePath,
  navLinks = CANONICAL_NAV_LINKS,
  accentColor = '#D4AF37',
  brandLabel = 'SIWIFY',
  brandIcon = 'fa-sun',
  brandImage = '',
  logoHeight = 32,
  showBrand = true,
  backgroundColor = 'rgba(8, 14, 10, 0.94)',
  textColor = 'rgba(248, 250, 252, 0.85)',
}: MarketplaceHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: backgroundColor,
        borderBottom: '1px solid rgba(212, 175, 55, 0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Responsive CSS — media queries control desktop nav vs hamburger visibility */}
      <style>{`
        .mh-desktop-nav { display: none !important; }
        .mh-burger      { display: inline-flex !important; }
        @media (min-width: 1024px) {
          .mh-desktop-nav { display: flex !important; }
          .mh-burger      { display: none !important; }
        }
        .mh-drawer {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
        }
        .mh-drawer.open {
          max-height: 90vh;
          opacity: 1;
        }
        @media (min-width: 1024px) {
          .mh-drawer { display: none !important; }
        }
        .mh-link:hover { opacity: 0.82; }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: '1500px',
          margin: '0 auto',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {/* Brand */}
        {showBrand && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flexShrink: 1 }}>
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: '#f8fafc',
                fontWeight: 900,
                fontSize: '0.96rem',
                letterSpacing: '2.2px',
                flexShrink: 0,
              }}
            >
              {brandImage
                ? <img
                    src={brandImage}
                    alt=""
                    style={{
                      height: `clamp(16px, ${Math.max(16, Math.min(120, logoHeight))}px, 120px)`,
                      width: 'auto',
                      maxWidth: 180,
                      objectFit: 'contain',
                    }}
                  />
                : <>
                    {brandIcon && <i className={`fas ${brandIcon}`} style={{ color: accentColor, fontSize: '0.95rem' }} />}
                    {brandLabel && <span>{brandLabel}</span>}
                  </>
              }
            </Link>
            {title && title !== 'SiWiFy' && (
              <span
                style={{
                  fontSize: '0.68rem',
                  color: accentColor,
                  opacity: 0.8,
                  fontWeight: 700,
                  borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
                  paddingLeft: '0.6rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'clamp(60px, 20vw, 160px)',
                }}
              >
                {title}
              </span>
            )}
          </div>
        )}

        {/* Desktop nav — hidden on mobile via .mh-desktop-nav CSS class */}
        <nav
          className="mh-desktop-nav"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.12rem',
            flexWrap: 'nowrap',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {navLinks.map((link) => {
            const isActive = activePath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="mh-link"
                style={{
                  textDecoration: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.52rem 0.7rem',
                  borderRadius: '999px',
                  transition: 'all 0.2s ease',
                  background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color: isActive ? '#D4AF37' : 'rgba(248, 250, 252, 0.72)',
                  border: isActive ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.28rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.icon && (
                  <i
                    className={`fas ${link.icon}`}
                    style={{ fontSize: '0.68rem', color: isActive ? accentColor : 'rgba(248,250,252,0.45)' }}
                  />
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Hamburger — hidden on desktop via .mh-burger CSS class */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          className="mh-burger"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '10px',
            color: '#ffffff',
            padding: '0',
            fontSize: '1rem',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            flexShrink: 0,
          }}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
      </div>

      {/* ── Mobile Drawer — slides down below header ────────────────────────── */}
      <div className={`mh-drawer${mobileMenuOpen ? ' open' : ''}`}>
        <div
          style={{
            background: 'rgba(8, 14, 10, 0.98)',
            borderTop: '1px solid rgba(212,175,55,0.12)',
            padding: '0.75rem 0.85rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            overflowY: 'auto',
            maxHeight: '85vh',
            boxShadow: '0 18px 35px rgba(0, 0, 0, 0.5)',
          }}
        >
          {navLinks.map((link) => {
            const isActive = activePath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: 'none',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  minHeight: '48px',       /* tap-target ≥ 48px */
                  background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color: isActive ? '#D4AF37' : 'rgba(248, 250, 252, 0.85)',
                  border: isActive ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(212,175,55,0.06)',
                }}
              >
                {link.icon && (
                  <i
                    className={`fas ${link.icon}`}
                    style={{
                      width: '20px',
                      textAlign: 'center',
                      fontSize: '0.92rem',
                      color: isActive ? accentColor : 'rgba(248,250,252,0.45)',
                    }}
                  />
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
