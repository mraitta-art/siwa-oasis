'use client';

import React from 'react';
import Link from 'next/link';
import { LangProvider, useLang } from '@/context/LangContext';

/* ─── Inner layout that has access to useLang() ───────────────────────── */
function VendorLayoutInner({ children }: { children: React.ReactNode }) {
  const { t, isRTL, toggleLang, lang } = useLang();

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
        { name: t.requestUpgrade, href: '/vendor/upgrade', icon: 'fa-arrow-up text-brand-400' },
      ],
    },
  ];

  return (
    <>
      {/* Load Cairo font for Arabic */}
      {isRTL && (
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        `}</style>
      )}

      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: isRTL
            ? "'Cairo', 'Segoe UI', system-ui, sans-serif"
            : "'Inter', 'Segoe UI', system-ui, sans-serif",
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }}
      >
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 glass-panel !rounded-none !border-y-0 !border-l-0 flex flex-col z-20">

          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-700/50" style={{ justifyContent: 'space-between' }}>
            <Link href="/vendor">
              <h1 className="font-outfit text-xl font-bold tracking-tight text-white inline-flex items-center gap-2">
                <span className="text-brand-400">{isRTL ? 'مركز' : 'VENDOR'}</span>
                {isRTL ? 'البائع' : 'HUB'}
              </h1>
            </Link>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
              style={{
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.35)',
                color: '#D4AF37',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.7rem',
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {t.langToggle}
            </button>
          </div>

          {/* Business Selector */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t.activeBusiness}</p>
              <p className="font-medium text-white truncate">Siwa Paradise Hotel</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded border border-brand-500/30">
                  {t.premiumTier}
                </span>
                <button className="text-xs text-slate-400 hover:text-white">
                  {t.switchBusiness} <i className="fas fa-chevron-down"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
            {navGroups.map((group, idx) => (
              <div key={idx} className="px-4">
                <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <nav className="space-y-1">
                  {group.items.map((item: any) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <i className={`fas ${item.icon} w-5 text-center text-slate-400 group-hover:text-white`}></i>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span style={{
                          background: '#D4AF37', color: '#1a1a2e', borderRadius: '20px',
                          padding: '0.1rem 0.45rem', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.5px',
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

          {/* User Card */}
          <div className="p-4 border-t border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
              {isRTL ? 'ب' : 'V'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">
                {isRTL ? 'أحمد البائع' : 'Ahmed Vendor'}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ───────────────────────────────────────── */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="h-16 flex-shrink-0 glass-panel !rounded-none !border-x-0 !border-t-0 flex justify-between items-center px-8 z-10">
            <div className="text-sm text-slate-400">
              <span className="text-brand-400 font-medium">
                {isRTL ? 'الرئيسية' : 'Dashboard'}
              </span>
              {isRTL ? ' / نظرة عامة' : ' / Overview'}
            </div>

            {/* Tier Quota Global Indicator */}
            <div className="flex items-center gap-6">
              <div
                className="hidden md:flex items-center gap-3 bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-700/50"
                title={isRTL ? 'حدود الوسائط الخاصة بك' : 'Your media limits'}
              >
                <i className="fas fa-database text-brand-400 text-xs"></i>
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 w-[65%]"></div>
                </div>
                <span className="text-xs text-slate-300 font-medium tracking-wide">
                  65% {t.mediaUsage}
                </span>
              </div>
              <Link href="/" target="_blank" className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
                {t.viewLiveMinisite}
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 relative z-0">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

/* ─── Public export wraps inner layout with the LangProvider ──────────── */
export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <VendorLayoutInner>{children}</VendorLayoutInner>
    </LangProvider>
  );
}
