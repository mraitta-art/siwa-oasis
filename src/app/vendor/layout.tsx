'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LangProvider, useLang } from '@/context/LangContext';

function VendorLayoutInner({ children }: { children: React.ReactNode }) {
  const { t, isRTL, toggleLang } = useLang();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profilePct, setProfilePct] = useState(42);
  // Builder mode: 'minisite' | 'mainsite'
  const [builderMode, setBuilderMode] = useState<'minisite' | 'mainsite'>('minisite');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Load profile completion %
  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then(data => {
        if (data?.structure) {
          const total = data.structure.reduce((acc: number, s: any) => acc + s.fields.length, 0);
          const filled = data.structure.reduce((acc: number, s: any) =>
            acc + s.fields.filter((f: any) => f.value !== null && f.value !== '' && f.value !== undefined).length, 0);
          if (total > 0) setProfilePct(Math.round((filled / total) * 100));
        }
      })
      .catch(() => {});
  }, []);

  // ── Unified nav structure ──────────────────────────────────────────────
  const navGroups = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Overview',    href: '/vendor',             icon: 'fa-home' },
        { name: 'Analytics',   href: '/vendor/analytics',   icon: 'fa-chart-line' },
      ],
    },
    {
      title: 'My Business',
      items: [
        { name: 'Business Profile',  href: '/vendor/sections',  icon: 'fa-building' },
        { name: 'Media Gallery',     href: '/vendor/media',     icon: 'fa-images' },
        { name: 'Claim a Listing',   href: '/vendor/claim',     icon: 'fa-unlock' },
      ],
    },
    // Builder group — items swap based on builderMode
    {
      title: 'Site Builder',
      isBuilder: true,
      items: builderMode === 'minisite'
        ? [
            { name: 'Content Sections',  href: '/vendor/sections',   icon: 'fa-layer-group' },
            { name: 'Theme & Colors',    href: '/vendor/minisite',   icon: 'fa-palette' },
            { name: 'Publish / Go Live', href: '/vendor/minisite',   icon: 'fa-globe',       badge: 'LIVE' },
            { name: 'Setup Wizard',      href: '/vendor/onboarding', icon: 'fa-magic',       badge: 'SETUP' },
          ]
        : [
            { name: 'Homepage Sections', href: '/jana/homepage-editor', icon: 'fa-home' },
            { name: 'Carousel Builder',  href: '/jana/carousel',        icon: 'fa-film' },
            { name: 'Blog Posts',        href: '/jana/blog',            icon: 'fa-newspaper' },
            { name: 'Preview Site',      href: '/',                     icon: 'fa-eye',        badge: 'VIEW' },
          ],
    },
    {
      title: 'Marketplace',
      items: [
        { name: 'Journey Requests',  href: '/vendor/journey-requests',         icon: 'fa-route',     badge: 'NEW' },
        { name: 'My Packages',       href: '/vendor/packages',                 icon: 'fa-box-open' },
        { name: 'Investment Ops',    href: '/vendor/investment-opportunities', icon: 'fa-chart-bar' },
      ],
    },
  ];

  const active = (href: string) =>
    pathname === href || (href !== '/vendor' && pathname.startsWith(href + '/'));

  // ── Builder mode toggle component ─────────────────────────────────────
  const BuilderToggle = () => (
    <div style={{
      margin: '0.5rem 0 0.5rem',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '4px',
      display: 'flex',
      gap: '3px',
    }}>
      {(['minisite', 'mainsite'] as const).map(mode => (
        <button
          key={mode}
          onClick={() => setBuilderMode(mode)}
          style={{
            flex: 1,
            padding: '0.35rem 0.5rem',
            borderRadius: '9px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            transition: 'all 0.15s',
            background: builderMode === mode
              ? mode === 'minisite'
                ? 'linear-gradient(135deg,#D4AF37,#f0c842)'
                : 'linear-gradient(135deg,#6366f1,#8b5cf6)'
              : 'transparent',
            color: builderMode === mode
              ? mode === 'minisite' ? '#5a3e00' : '#fff'
              : '#94a3b8',
            boxShadow: builderMode === mode ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
          }}
        >
          {mode === 'minisite' ? '🌐 My Minisite' : '🏠 Main Site'}
        </button>
      ))}
    </div>
  );

  const sidebarContent = (
    <>
      {/* Brand */}
      <div style={{ padding: '0 1.25rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
        <Link href="/vendor" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#D4AF37,#f0c842)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a3e00', fontWeight: 900, fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>S</div>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a', letterSpacing: '1.5px' }}>VENDOR HUB</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            onClick={toggleLang}
            style={{ background: '#fdf8ee', border: '1px solid #fde68a', color: '#92702a', borderRadius: '20px', padding: '3px 10px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}
          >
            {isRTL ? 'EN' : 'ع'}
          </button>
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', padding: '0.25rem' }}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Profile Completion Banner */}
      {profilePct < 80 && (
        <div style={{ margin: '0.75rem', background: profilePct < 50 ? '#fffdf5' : '#f0fdf4', border: `1px solid ${profilePct < 50 ? '#fde68a' : '#bbf7d0'}`, borderRadius: '12px', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: profilePct < 50 ? '#92702a' : '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {profilePct < 50 ? '⚡ Profile Incomplete' : '✨ Almost Done'}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: profilePct < 50 ? '#D4AF37' : '#16a34a' }}>{profilePct}%</span>
          </div>
          <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${profilePct}%`, background: profilePct < 50 ? 'linear-gradient(90deg,#D4AF37,#f0c842)' : 'linear-gradient(90deg,#22c55e,#16a34a)', transition: 'width 0.5s' }}></div>
          </div>
          <Link href="/vendor/onboarding" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: profilePct < 50 ? '#D4AF37' : '#16a34a', textDecoration: 'none' }}>
            → Complete your profile
          </Link>
        </div>
      )}

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
        {navGroups.map((group: any, idx) => (
          <div key={idx} style={{ marginBottom: '1.25rem' }}>
            {/* Group title */}
            <div style={{
              fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8',
              letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '0 0.5rem', marginBottom: '0.35rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              {group.title}
              {group.isBuilder && (
                <span style={{
                  background: builderMode === 'minisite' ? '#fef3c7' : '#ede9fe',
                  color: builderMode === 'minisite' ? '#92702a' : '#6366f1',
                  borderRadius: '20px', padding: '1px 6px', fontSize: '0.5rem', fontWeight: 900,
                }}>
                  {builderMode === 'minisite' ? 'MINISITE' : 'MAIN SITE'}
                </span>
              )}
            </div>

            {/* Builder toggle — shown only in the builder group */}
            {group.isBuilder && <BuilderToggle />}

            <nav>
              {group.items.map((item: any) => (
                <Link
                  key={`${item.href}-${item.name}`}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.55rem 0.75rem', borderRadius: '10px', textDecoration: 'none',
                    color: active(item.href) ? '#D4AF37' : '#64748b',
                    background: active(item.href) ? '#fdf8ee' : 'transparent',
                    fontSize: '0.8rem', fontWeight: active(item.href) ? 800 : 500,
                    marginBottom: '0.1rem', transition: 'all 0.15s',
                    border: active(item.href) ? '1px solid #fde68a' : '1px solid transparent',
                  }}
                >
                  <i className={`fas ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '0.75rem', color: active(item.href) ? '#D4AF37' : '#94a3b8' }}></i>
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.badge && (
                    <span style={{
                      background: item.badge === 'LIVE' ? '#22c55e' : item.badge === 'VIEW' ? '#6366f1' : '#D4AF37',
                      color: item.badge === 'LIVE' || item.badge === 'VIEW' ? '#fff' : '#5a3e00',
                      borderRadius: '20px', padding: '1px 7px', fontSize: '0.5rem', fontWeight: 900,
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* View Site + User Footer */}
      <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.75rem' }}>
        {/* Quick preview buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Link href="/" target="_blank" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.5rem 0.5rem', borderRadius: '9px', textDecoration: 'none',
            background: '#fdf8ee', border: '1px solid #fde68a',
            color: '#92702a', fontSize: '0.65rem', fontWeight: 800, transition: 'all 0.2s',
          }}>
            <i className="fas fa-store" style={{ fontSize: '0.6rem' }}></i>
            My Minisite
          </Link>
          <Link href="/" target="_blank" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.5rem 0.5rem', borderRadius: '9px', textDecoration: 'none',
            background: '#f5f3ff', border: '1px solid #ddd6fe',
            color: '#6366f1', fontSize: '0.65rem', fontWeight: 800, transition: 'all 0.2s',
          }}>
            <i className="fas fa-globe" style={{ fontSize: '0.6rem' }}></i>
            Live Site
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fdf8ee', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 900, fontSize: '0.8rem', flexShrink: 0 }}>V</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Vendor Account</div>
            <Link href="/logout" style={{ fontSize: '0.6rem', color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>Sign out</Link>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isRTL && (
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');`}</style>
      )}

      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          display: 'flex', height: '100vh', overflow: 'hidden',
          fontFamily: isRTL ? "'Cairo','Segoe UI',system-ui,sans-serif" : "'Inter','Segoe UI',system-ui,sans-serif",
          flexDirection: isRTL ? 'row-reverse' : 'row',
          background: '#fcfbfa',
        }}
      >
        {/* Mobile Overlay */}
        {isMobile && mobileOpen && (
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', zIndex: 199 }} />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <aside style={{
            width: '280px', background: '#ffffff',
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, bottom: 0,
            [isRTL ? 'right' : 'left']: 0,
            zIndex: 200,
            transform: mobileOpen ? 'translateX(0)' : (isRTL ? 'translateX(100%)' : 'translateX(-100%)'),
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            overflowY: 'auto',
            borderRight: '1px solid #f1f5f9',
            boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
          }}>
            {sidebarContent}
          </aside>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside style={{
            width: '256px', flexShrink: 0,
            background: '#ffffff',
            display: 'flex', flexDirection: 'column',
            borderRight: isRTL ? 'none' : '1px solid #f1f5f9',
            borderLeft: isRTL ? '1px solid #f1f5f9' : 'none',
            boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
          }}>
            {sidebarContent}
          </aside>
        )}

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

          {/* Topbar */}
          <header style={{
            height: '56px', flexShrink: 0,
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: isMobile ? '0 0.75rem' : '0 1.5rem',
            gap: '0.75rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isMobile && (
                <button
                  onClick={() => setMobileOpen(true)}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '8px', padding: '0.4rem 0.55rem', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <i className="fas fa-bars"></i>
                </button>
              )}
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                <span style={{ color: '#D4AF37', fontWeight: 800 }}>Vendor Hub</span>
                {' / '}
                <span style={{ color: '#1e293b' }}>{pathname === '/vendor' ? 'Overview' : pathname.split('/').pop()?.replace(/-/g, ' ') ?? 'Dashboard'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fdf8ee', padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.65rem', color: '#92702a', fontWeight: 800 }}>Profile</span>
                  <div style={{ width: '60px', height: '4px', background: '#fde68a', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${profilePct}%`, background: '#D4AF37' }}></div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 800 }}>{profilePct}%</span>
                </div>
              )}
              <Link href="/vendor/onboarding" style={{ fontSize: '0.75rem', color: '#D4AF37', textDecoration: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fdf8ee', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid #fde68a' }}>
                <i className="fas fa-magic" style={{ fontSize: '0.65rem' }}></i>
                {!isMobile && 'Setup Wizard'}
              </Link>
            </div>
          </header>

          {/* Page scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#fcfbfa' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '1.25rem' : '2rem 2.5rem' }}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <VendorLayoutInner>{children}</VendorLayoutInner>
    </LangProvider>
  );
}
