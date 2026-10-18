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

function isLightBackground(color: string | undefined): boolean {
  if (!color) return false;
  const s = color.toLowerCase().trim();
  if (s.startsWith('#fff') || s.startsWith('#f') || s.startsWith('white')) return true;
  const match = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 135;
  }
  return false;
}

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

  const light = isLightBackground(backgroundColor);

  // Dynamic contrast colors: 100% visible on both dark luxury glass and light backgrounds
  const brandColor = light ? '#0f172a' : '#f8fafc';
  const navInactiveColor = light ? '#1e293b' : 'rgba(248, 250, 252, 0.88)';
  const navActiveColor = light ? '#B8860B' : '#D4AF37';
  const navActiveBg = light ? 'rgba(184, 134, 11, 0.12)' : 'rgba(212, 175, 55, 0.12)';
  const navActiveBorder = light ? 'rgba(184, 134, 11, 0.3)' : 'rgba(212, 175, 55, 0.3)';
  const navIconInactive = light ? '#475569' : 'rgba(248, 250, 252, 0.65)';
  const burgerColor = light ? '#0f172a' : '#ffffff';
  const burgerBg = light ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';
  const burgerBorder = light ? 'rgba(0, 0, 0, 0.12)' : 'rgba(212, 175, 55, 0.25)';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: backgroundColor,
        borderBottom: light ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(212, 175, 55, 0.12)',
        boxShadow: light ? '0 4px 20px rgba(0,0,0,0.06)' : '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Responsive CSS */}
      <style>{`
        .mh-desktop-nav { display: none !important; }
        .mh-burger      { display: inline-flex !important; }
        .mh-mobile-strip { display: flex !important; }
        .mh-desktop-nav::-webkit-scrollbar,
        .mh-mobile-strip::-webkit-scrollbar { display: none; }

        @media (min-width: 1024px) {
          .mh-desktop-nav { display: flex !important; }
          .mh-burger      { display: none !important; }
          .mh-mobile-strip { display: none !important; }
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
        .mh-link:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: '1500px',
          margin: '0 auto',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {/* Brand */}
        {showBrand && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flexShrink: 0 }}>
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: brandColor,
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
                  opacity: 0.9,
                  fontWeight: 700,
                  borderLeft: light ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(212, 175, 55, 0.2)',
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

        {/* Desktop nav — visible on desktop >= 1024px */}
        <nav
          className="mh-desktop-nav"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(0.12rem, 0.35vw, 0.3rem)',
            flexWrap: 'nowrap',
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
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
                  fontSize: 'clamp(0.68rem, 0.78vw, 0.76rem)',
                  fontWeight: 700,
                  padding: '0.45rem clamp(0.35rem, 0.55vw, 0.7rem)',
                  borderRadius: '999px',
                  transition: 'all 0.2s ease',
                  background: isActive ? navActiveBg : 'transparent',
                  color: isActive ? navActiveColor : navInactiveColor,
                  border: isActive ? `1px solid ${navActiveBorder}` : '1px solid transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {link.icon && (
                  <i
                    className={`fas ${link.icon}`}
                    style={{ fontSize: '0.68rem', color: isActive ? navActiveColor : navIconInactive }}
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
            background: burgerBg,
            border: `1px solid ${burgerBorder}`,
            borderRadius: '10px',
            color: burgerColor,
            padding: '0',
            fontSize: '1.05rem',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            flexShrink: 0,
          }}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
      </div>

      {/* ── Mobile/Inspect Horizontal Quick Bar: All pages immediately visible at the top! ── */}
      <div
        className="mh-mobile-strip"
        style={{
          padding: '0.3rem 0.75rem 0.55rem',
          gap: '0.35rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          borderTop: light ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(212, 175, 55, 0.1)',
        }}
      >
        {navLinks.map((link) => {
          const isActive = activePath === link.href;
          return (
            <Link
              key={`mstrip-${link.href}`}
              href={link.href}
              style={{
                textDecoration: 'none',
                fontSize: '0.73rem',
                fontWeight: 700,
                padding: '0.32rem 0.65rem',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexShrink: 0,
                background: isActive ? navActiveBg : (light ? 'rgba(0,0,0,0.04)' : 'rgba(255, 255, 255, 0.04)'),
                color: isActive ? navActiveColor : navInactiveColor,
                border: isActive ? `1px solid ${navActiveBorder}` : (light ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255, 255, 255, 0.08)'),
              }}
            >
              {link.icon && (
                <i
                  className={`fas ${link.icon}`}
                  style={{ fontSize: '0.68rem', color: isActive ? navActiveColor : navIconInactive }}
                />
              )}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Mobile Drawer — slides down below header ────────────────────────── */}
      <div className={`mh-drawer${mobileMenuOpen ? ' open' : ''}`}>
        <div
          style={{
            background: light ? '#ffffff' : 'rgba(8, 14, 10, 0.98)',
            borderTop: light ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(212,175,55,0.12)',
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
                key={`drawer-${link.href}`}
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
                  background: isActive ? navActiveBg : 'transparent',
                  color: isActive ? navActiveColor : navInactiveColor,
                  border: isActive ? `1px solid ${navActiveBorder}` : (light ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(212,175,55,0.06)'),
                }}
              >
                {link.icon && (
                  <i
                    className={`fas ${link.icon}`}
                    style={{
                      width: '20px',
                      textAlign: 'center',
                      fontSize: '0.92rem',
                      color: isActive ? navActiveColor : navIconInactive,
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
