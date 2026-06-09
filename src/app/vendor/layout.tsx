'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LangProvider, useLang } from '@/context/LangContext';

function VendorLayoutInner({ children }: { children: React.ReactNode }) {
  const { t, isRTL, toggleLang, lang } = useLang();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navGroups = [
    {
      title: t.navDashboard,
      items: [
        { name: t.overview,   href: '/vendor',            icon: 'fa-home' },
        { name: t.analytics,  href: '/vendor/analytics',  icon: 'fa-chart-line' },
      ],
    },
    {
      title: t.navBusinessProfile,
      items: [
        { name: t.editInformation, href: '/vendor/profile', icon: 'fa-edit' },
        { name: t.mediaGallery,    href: '/vendor/media',   icon: 'fa-images' },
      ],
    },
    {
      title: t.navMinisiteBuilder,
      items: [
        { name: t.designStudio,    href: '/vendor/minisite',  icon: 'fa-paint-brush' },
        { name: t.publishSettings, href: '/vendor/settings',  icon: 'fa-globe' },
      ],
    },
    {
      title: t.navMarketplace,
      items: [
        { name: t.marketplaceReqs, href: '/vendor/journey-requests',           icon: 'fa-route',         badge: 'NEW' },
        { name: t.myOffers,        href: '/vendor/journey-requests/my-offers', icon: 'fa-file-invoice' },
      ],
    },
    {
      title: t.navVendorTiers,
      items: [
        { name: t.myVendorTier,   href: '/vendor/tier',    icon: 'fa-gem' },
        { name: t.requestUpgrade, href: '/vendor/upgrade', icon: 'fa-arrow-up' },
      ],
    },
  ];

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div style={{
        height: '60px', display: 'flex', alignItems: 'center',
        padding: '0 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
        justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row',
      }}>
        <Link href="/vendor" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#D4AF37,#F5E6AD)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a2e', fontWeight: 900, fontSize: '0.75rem' }}>S</div>
          <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#fff' }}>
            {isRTL ? 'مركز البائع' : 'VENDOR HUB'}
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            style={{
              background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)',
              color: '#D4AF37', borderRadius: '20px', padding: '3px 10px',
              fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t.langToggle}
          </button>
          {/* Close on mobile */}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.25rem' }}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
        {navGroups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.4rem', textAlign: isRTL ? 'right' : 'left' }}>
              {group.title}
            </div>
            <nav>
              {group.items.map((item: any) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                      padding: '0.55rem 0.75rem', borderRadius: '8px', textDecoration: 'none',
                      color: active ? '#D4AF37' : 'rgba(255,255,255,0.55)',
                      background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                      fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                      marginBottom: '0.15rem', transition: 'all 0.2s',
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    }}
                  >
                    <i className={`fas ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '0.75rem', opacity: active ? 1 : 0.6 }}></i>
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {item.badge && (
                      <span style={{ background: '#D4AF37', color: '#1a1a2e', borderRadius: '20px', padding: '1px 7px', fontSize: '0.5rem', fontWeight: 900 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Card */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 900, fontSize: '0.8rem', flexShrink: 0 }}>
          {isRTL ? 'ب' : 'V'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isRTL ? 'أحمد البائع' : 'Ahmed Vendor'}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#D4AF37', fontWeight: 700 }}>
            {isRTL ? 'بائع مميز' : 'Premium Vendor'}
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
          background: '#0f172a',
        }}
      >
        {/* ── Mobile Overlay ── */}
        {isMobile && mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 199 }}
          />
        )}

        {/* ── Mobile Drawer ── */}
        {isMobile && (
          <aside style={{
            width: '280px', background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)',
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, bottom: 0,
            [isRTL ? 'right' : 'left']: 0,
            zIndex: 200,
            transform: mobileOpen ? 'translateX(0)' : (isRTL ? 'translateX(100%)' : 'translateX(-100%)'),
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            overflowY: 'auto',
          }}>
            {sidebarContent}
          </aside>
        )}

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <aside style={{
            width: '260px', flexShrink: 0,
            background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)',
            display: 'flex', flexDirection: 'column',
            borderRight: isRTL ? 'none' : '1px solid rgba(255,255,255,0.05)',
            borderLeft: isRTL ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            {sidebarContent}
          </aside>
        )}

        {/* ── Main Content ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

          {/* Top Bar */}
          <header style={{
            height: '56px', flexShrink: 0,
            background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: isMobile ? '0 0.75rem' : '0 1.5rem',
            gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Hamburger */}
              {isMobile && (
                <button
                  onClick={() => setMobileOpen(true)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', borderRadius: '8px', padding: '0.45rem 0.6rem',
                    fontSize: '1rem', cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-bars"></i>
                </button>
              )}
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ color: '#D4AF37', fontWeight: 700 }}>
                  {isRTL ? 'الرئيسية' : 'Dashboard'}
                </span>
                {isRTL ? ' / نظرة عامة' : ' / Overview'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <i className="fas fa-database" style={{ color: '#D4AF37', fontSize: '0.7rem' }}></i>
                  <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg,#D4AF37,#F5E6AD)' }}></div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>65% {t.mediaUsage}</span>
                </div>
              )}
              <Link href="/" target="_blank" style={{ fontSize: '0.75rem', color: '#D4AF37', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }}></i>
                {!isMobile && (isRTL ? 'عرض الموقع' : 'Live Site')}
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '1.5rem 2rem', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
