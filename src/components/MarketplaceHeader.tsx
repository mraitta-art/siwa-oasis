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
      <div
        style={{
          maxWidth: '1500px',
          margin: '0 auto',
          padding: '0.8rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {showBrand && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexShrink: 1 }}>
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
            }}
          >
            {brandImage
              ? <img src={brandImage} alt="" style={{ height: `clamp(16px, ${Math.max(16, Math.min(120, logoHeight))}px, 120px)`, width: 'auto', maxWidth: 180, objectFit: 'contain' }} />
              : <>
                  {brandIcon && <i className={`fas ${brandIcon}`} style={{ color: accentColor, fontSize: '0.95rem' }} />}
                  {brandLabel && <span>{brandLabel}</span>}
                </>}
          </Link>
          {title && title !== 'SiWiFy' && (
            <span
              style={{
                fontSize: '0.7rem',
                color: accentColor,
                opacity: 0.8,
                fontWeight: 700,
                borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
                paddingLeft: '0.7rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
          )}
        </div>}

        <nav
          className="hidden lg:flex"
          style={{
            display: 'flex',
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
                {link.icon && <i className={`fas ${link.icon}`} style={{ fontSize: '0.68rem', color: isActive ? accentColor : 'rgba(248,250,252,0.45)' }} />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '10px',
            color: '#ffffff',
            padding: '0.55rem 0.7rem',
            fontSize: '0.96rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          style={{
            background: 'rgba(8, 14, 10, 0.98)',
            borderTop: '1px solid rgba(212,175,55,0.12)',
            padding: '0.85rem 1rem 1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            maxHeight: 'calc(100vh - 70px)',
            overflowY: 'auto',
            boxShadow: '0 18px 35px rgba(0, 0, 0, 0.4)',
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
                  padding: '0.8rem 0.9rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.7rem',
                  background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color: isActive ? '#D4AF37' : 'rgba(248, 250, 252, 0.72)',
                  border: isActive ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(212,175,55,0.06)',
                }}
              >
                {link.icon && <i className={`fas ${link.icon}`} style={{ width: '18px', textAlign: 'center', color: isActive ? accentColor : 'rgba(248,250,252,0.45)' }} />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
