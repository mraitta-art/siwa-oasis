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
  adminPath?: string;
  activePath?: string;
  navLinks?: NavLink[];
  accentColor?: string;
}

export const CANONICAL_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home', icon: 'fa-house' },
  { href: '/activities', label: 'Activities', icon: 'fa-person-hiking' },
  { href: '/accommodations', label: 'Stays', icon: 'fa-hotel' },
  { href: '/restaurants', label: 'Dining', icon: 'fa-utensils' },
  { href: '/packages', label: 'Packages', icon: 'fa-box-open' },
  { href: '/crafts-wellness', label: 'Crafts & Wellness', icon: 'fa-spa' },
  { href: '/offers', label: 'Offers', icon: 'fa-tag' },
  { href: '/customize-journey', label: 'Custom Journey', icon: 'fa-wand-magic-sparkles' },
  { href: '/investment-opportunities', label: 'Investments', icon: 'fa-gem' },
];

export default function MarketplaceHeader({
  title = 'SiWiFy',
  adminPath = '/jana',
  activePath,
  navLinks = CANONICAL_NAV_LINKS,
  accentColor = '#D4AF37',
}: MarketplaceHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(15, 23, 42, 0.92)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.15rem',
              letterSpacing: '2px',
            }}
          >
            <i className="fas fa-sun" style={{ color: accentColor, fontSize: '1.25rem' }} />
            <span>SIWIFY</span>
          </Link>
          {title && title !== 'SiWiFy' && (
            <span
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 600,
                borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                paddingLeft: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden lg:flex"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexWrap: 'wrap',
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
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.4rem 0.8rem',
                  borderRadius: '999px',
                  transition: 'all 0.2s ease',
                  background: isActive ? accentColor : 'transparent',
                  color: isActive ? '#0f172a' : 'rgba(255, 255, 255, 0.85)',
                  boxShadow: isActive ? `0 4px 14px ${accentColor}40` : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {link.icon && <i className={`fas ${link.icon}`} style={{ fontSize: '0.75rem' }} />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action buttons & Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {adminPath && (
            <Link
              href={adminPath}
              style={{
                textDecoration: 'none',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: accentColor,
                border: `1px solid ${accentColor}40`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <i className="fas fa-screwdriver-wrench" />
              <span>Admin</span>
            </Link>
          )}

          {/* Mobile menu toggle button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '0.45rem 0.65rem',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1rem 1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: 'calc(100vh - 65px)',
            overflowY: 'auto',
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
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: isActive ? `${accentColor}20` : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? accentColor : '#ffffff',
                  border: isActive ? `1px solid ${accentColor}40` : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {link.icon && <i className={`fas ${link.icon}`} style={{ width: '18px', textAlign: 'center' }} />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
