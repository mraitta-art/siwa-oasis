'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LangProvider, useLang } from '@/context/LangContext';

/* ─── Types ──────────────────────────────────────────────── */
interface VendorInfo {
  name: string;
  slug: string;
  email?: string;
  profilePct: number;
  journeyCount: number;
  isPublished: boolean;
}

/* ─── Nav Structure ──────────────────────────────────────── */
const NAV_GROUPS = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Overview',        href: '/vendor',                          icon: 'fa-grid-2',      faIcon: 'fa-th-large' },
      { name: 'Analytics',       href: '/vendor/analytics',                icon: 'fa-chart-line',  faIcon: 'fa-chart-line' },
    ],
  },
  {
    title: 'My Business',
    items: [
      { name: 'Content & Profile',  href: '/vendor/sections',              faIcon: 'fa-layer-group' },
      { name: 'Media Gallery',      href: '/vendor/media',                 faIcon: 'fa-images' },
      { name: 'Theme & Publish',    href: '/vendor/minisite',              faIcon: 'fa-globe',      badge: 'LIVE' },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { name: 'Journey Requests',   href: '/vendor/journey-requests',      faIcon: 'fa-route',      badge: 'REQ' },
      { name: 'My Packages',        href: '/vendor/packages',              faIcon: 'fa-box-open' },
      { name: 'Investments',        href: '/vendor/investment-opportunities', faIcon: 'fa-chart-bar' },
    ],
  },
];

const MOBILE_TABS = [
  { name: 'Home',     href: '/vendor',                   faIcon: 'fa-th-large' },
  { name: 'Content',  href: '/vendor/sections',          faIcon: 'fa-layer-group' },
  { name: 'Media',    href: '/vendor/media',             faIcon: 'fa-images' },
  { name: 'Requests', href: '/vendor/journey-requests',  faIcon: 'fa-route' },
  { name: 'Publish',  href: '/vendor/minisite',          faIcon: 'fa-globe' },
];

/* ─── CSS injected once ───────────────────────────────────── */
const VENDOR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cairo:wght@400;600;700;900&display=swap');

  :root {
    --gold:      #D4AF37;
    --gold-lite: #f0c842;
    --gold-dim:  rgba(212,175,55,0.12);
    --gold-dim2: rgba(212,175,55,0.06);
    --sidebar:   #0d0f14;
    --sidebar2:  #13161e;
    --sidebar3:  #1a1e28;
    --border-s:  rgba(255,255,255,0.06);
    --text-s1:   #f8fafc;
    --text-s2:   #94a3b8;
    --text-s3:   #64748b;
    --main-bg:   #f7f8fb;
    --card-bg:   #ffffff;
    --card-border: #eef0f5;
    --text-m1:   #0f172a;
    --text-m2:   #334155;
    --text-m3:   #64748b;
    --radius-lg: 20px;
    --radius-xl: 28px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .vendor-root {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    background: var(--main-bg);
  }
  .vendor-root[dir="rtl"] {
    font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif;
  }

  /* ── Sidebar ── */
  .vs-sidebar {
    width: 260px;
    flex-shrink: 0;
    background: var(--sidebar);
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border-s);
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    z-index: 50;
  }
  [dir="rtl"] .vs-sidebar {
    border-right: none;
    border-left: 1px solid var(--border-s);
  }

  /* Brand */
  .vs-brand {
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    border-bottom: 1px solid var(--border-s);
    flex-shrink: 0;
  }
  .vs-brand-logo {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-decoration: none;
  }
  .vs-brand-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--gold), var(--gold-lite));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 0.95rem; color: #2a1a00;
    box-shadow: 0 4px 16px rgba(212,175,55,0.35);
    flex-shrink: 0;
  }
  .vs-brand-text {
    display: flex; flex-direction: column;
  }
  .vs-brand-name {
    font-size: 0.72rem; font-weight: 900;
    color: var(--text-s1); letter-spacing: 2px;
    text-transform: uppercase;
  }
  .vs-brand-sub {
    font-size: 0.55rem; font-weight: 600;
    color: var(--gold); letter-spacing: 0.5px;
    opacity: 0.8;
  }

  /* Vendor Profile Card in Sidebar */
  .vs-profile-card {
    margin: 0.875rem 0.875rem 0;
    background: var(--sidebar3);
    border: 1px solid var(--border-s);
    border-radius: 14px;
    padding: 0.875rem;
  }
  .vs-profile-top {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;
  }
  .vs-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), #b8860b);
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 0.95rem; color: #2a1a00;
    flex-shrink: 0; box-shadow: 0 0 0 2px rgba(212,175,55,0.3);
  }
  .vs-profile-info { flex: 1; min-width: 0; }
  .vs-profile-name {
    font-size: 0.75rem; font-weight: 700; color: var(--text-s1);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vs-profile-type {
    font-size: 0.6rem; font-weight: 600; color: var(--gold); opacity: 0.85;
    margin-top: 1px;
  }
  .vs-pub-badge {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: 20px; font-size: 0.5rem;
    font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .vs-pub-badge.live {
    background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.2);
  }
  .vs-pub-badge.draft {
    background: rgba(245,158,11,0.12); color: var(--gold); border: 1px solid rgba(212,175,55,0.2);
  }

  /* Profile completion ring */
  .vs-ring-wrap {
    display: flex; align-items: center; gap: 0.65rem;
  }
  .vs-ring-info { flex: 1; }
  .vs-ring-label {
    font-size: 0.6rem; font-weight: 700; color: var(--text-s3);
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;
  }
  .vs-ring-bar {
    height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden;
  }
  .vs-ring-fill {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, var(--gold), var(--gold-lite));
    transition: width 1s ease-out;
  }
  .vs-ring-pct {
    font-size: 0.65rem; font-weight: 800; color: var(--gold); margin-top: 4px;
  }

  /* Nav */
  .vs-nav-scroll {
    flex: 1; overflow-y: auto; padding: 0.75rem 0.75rem;
  }
  .vs-nav-scroll::-webkit-scrollbar { width: 3px; }
  .vs-nav-scroll::-webkit-scrollbar-track { background: transparent; }
  .vs-nav-scroll::-webkit-scrollbar-thumb { background: var(--border-s); border-radius: 2px; }

  .vs-nav-group { margin-bottom: 1.5rem; }
  .vs-nav-title {
    font-size: 0.5rem; font-weight: 900; color: var(--text-s3);
    letter-spacing: 1.8px; text-transform: uppercase;
    padding: 0 0.5rem; margin-bottom: 0.35rem;
  }
  .vs-nav-item {
    display: flex; align-items: center; gap: 0.65rem;
    padding: 0.6rem 0.75rem; border-radius: 10px;
    text-decoration: none; font-size: 0.8rem; font-weight: 500;
    color: var(--text-s2); margin-bottom: 2px;
    transition: var(--transition);
    border: 1px solid transparent;
    position: relative;
  }
  .vs-nav-item:hover {
    background: var(--sidebar3); color: var(--text-s1);
    border-color: var(--border-s);
  }
  .vs-nav-item.active {
    background: var(--gold-dim);
    color: var(--gold);
    border-color: rgba(212,175,55,0.2);
    font-weight: 700;
  }
  .vs-nav-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 3px;
    background: var(--gold);
    border-radius: 0 2px 2px 0;
  }
  [dir="rtl"] .vs-nav-item.active::before {
    left: auto; right: 0;
    border-radius: 2px 0 0 2px;
  }
  .vs-nav-icon {
    width: 18px; text-align: center; font-size: 0.75rem;
    flex-shrink: 0; opacity: 0.7; transition: var(--transition);
  }
  .vs-nav-item.active .vs-nav-icon,
  .vs-nav-item:hover .vs-nav-icon { opacity: 1; }
  .vs-nav-badge {
    margin-left: auto; padding: 1px 7px;
    border-radius: 20px; font-size: 0.48rem; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .vs-nav-badge.live { background: rgba(34,197,94,0.15); color: #4ade80; }
  .vs-nav-badge.new  { background: rgba(212,175,55,0.15); color: var(--gold); }
  .vs-nav-badge.req  { background: rgba(99,102,241,0.15); color: #818cf8; }

  /* Sidebar Footer */
  .vs-sidebar-footer {
    border-top: 1px solid var(--border-s);
    padding: 0.875rem;
    flex-shrink: 0;
  }
  .vs-footer-links {
    display: flex; gap: 0.5rem; margin-bottom: 0.75rem;
  }
  .vs-footer-link {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 0.35rem; padding: 0.5rem 0.25rem; border-radius: 9px;
    text-decoration: none; font-size: 0.62rem; font-weight: 700;
    transition: var(--transition); border: 1px solid;
  }
  .vs-footer-link.minisite {
    background: var(--gold-dim2); border-color: rgba(212,175,55,0.2); color: var(--gold);
  }
  .vs-footer-link.minisite:hover { background: var(--gold-dim); }
  .vs-footer-link.site {
    background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.15); color: #818cf8;
  }
  .vs-footer-link.site:hover { background: rgba(99,102,241,0.14); }
  .vs-user-row {
    display: flex; align-items: center; gap: 0.65rem;
  }
  .vs-user-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--sidebar3); border: 1.5px solid var(--border-s);
    display: flex; align-items: center; justify-content: center;
    color: var(--gold); font-weight: 900; font-size: 0.75rem; flex-shrink: 0;
  }
  .vs-user-info { flex: 1; min-width: 0; }
  .vs-user-name {
    font-size: 0.7rem; font-weight: 700; color: var(--text-s2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vs-user-logout {
    font-size: 0.58rem; color: var(--text-s3); text-decoration: none;
    font-weight: 600; transition: var(--transition);
  }
  .vs-user-logout:hover { color: #f87171; }
  .vs-lang-btn {
    background: var(--sidebar3); border: 1px solid var(--border-s);
    color: var(--gold); border-radius: 20px; padding: 3px 10px;
    font-size: 0.58rem; font-weight: 900; cursor: pointer;
    transition: var(--transition); letter-spacing: 0.5px;
  }
  .vs-lang-btn:hover { background: var(--gold-dim); }

  /* ── Main area ── */
  .vs-main {
    flex: 1; display: flex; flex-direction: column;
    height: 100vh; overflow: hidden; min-width: 0;
  }

  /* Topbar */
  .vs-topbar {
    height: 60px; flex-shrink: 0;
    background: var(--card-bg);
    border-bottom: 1px solid var(--card-border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1.75rem; gap: 1rem;
    box-shadow: var(--shadow-sm);
  }
  .vs-topbar-left { display: flex; align-items: center; gap: 0.85rem; }
  .vs-topbar-right { display: flex; align-items: center; gap: 0.65rem; }

  .vs-hamburger {
    background: #f1f5f9; border: 1px solid #e2e8f0;
    color: #64748b; border-radius: 9px; padding: 0.45rem 0.6rem;
    font-size: 0.9rem; cursor: pointer; transition: var(--transition);
    line-height: 1;
  }
  .vs-hamburger:hover { background: #e2e8f0; }

  .vs-breadcrumb {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.78rem; color: var(--text-m3); font-weight: 500;
  }
  .vs-breadcrumb-root { color: var(--gold); font-weight: 800; }
  .vs-breadcrumb-sep { color: #cbd5e1; }
  .vs-breadcrumb-page { color: var(--text-m1); font-weight: 700; }

  .vs-topbar-profile-pill {
    display: flex; align-items: center; gap: 0.5rem;
    background: #fdf8ee; padding: 0.3rem 0.75rem 0.3rem 0.4rem;
    border-radius: 20px; border: 1px solid #fde68a;
    cursor: default;
  }
  .vs-topbar-pct-bar {
    width: 56px; height: 4px; background: #fde68a;
    border-radius: 2px; overflow: hidden;
  }
  .vs-topbar-pct-fill {
    height: 100%; background: var(--gold); transition: width 1s ease-out;
  }
  .vs-topbar-pct-label {
    font-size: 0.65rem; font-weight: 800; color: var(--gold);
  }

  .vs-notif-btn {
    position: relative; background: #f8fafc;
    border: 1px solid #e2e8f0; border-radius: 10px;
    width: 36px; height: 36px; display: flex;
    align-items: center; justify-content: center;
    color: var(--text-m3); font-size: 0.85rem; cursor: pointer;
    transition: var(--transition); text-decoration: none;
  }
  .vs-notif-btn:hover { background: #fdf8ee; border-color: #fde68a; color: var(--gold); }
  .vs-notif-badge {
    position: absolute; top: -4px; right: -4px;
    background: #ef4444; color: #fff;
    width: 17px; height: 17px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.48rem; font-weight: 900; border: 2px solid #fff;
  }

  .vs-topbar-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), #b8860b);
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 0.8rem; color: #2a1a00;
    cursor: pointer; flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(212,175,55,0.25);
  }

  /* ── Page scroll ── */
  .vs-scroll {
    flex: 1; overflow-y: auto; background: var(--main-bg);
  }
  .vs-scroll::-webkit-scrollbar { width: 5px; }
  .vs-scroll::-webkit-scrollbar-track { background: transparent; }
  .vs-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
  .vs-page { max-width: 1400px; margin: 0 auto; padding: 2rem 2.25rem; }

  /* Mobile */
  @media (max-width: 768px) {
    .vs-sidebar { display: none; }
    .vs-sidebar.mobile-open {
      display: flex !important;
      position: fixed; top: 0; bottom: 0; left: 0;
      width: 280px; z-index: 300;
    }
    [dir="rtl"] .vs-sidebar.mobile-open { left: auto; right: 0; }
    .vs-mobile-overlay {
      display: none;
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px); z-index: 299;
    }
    .vs-mobile-overlay.open { display: block; }
    .vs-topbar { padding: 0 1rem; }
    .vs-page { padding: 1.25rem 1rem 5rem; }
    .vs-bottom-tabs {
      display: flex !important;
    }
  }
  @media (min-width: 769px) {
    .vs-bottom-tabs { display: none !important; }
    .vs-sidebar { display: flex !important; }
  }

  /* Bottom tabs (mobile) */
  .vs-bottom-tabs {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--card-bg);
    border-top: 1px solid var(--card-border);
    padding: 0.4rem 0 0.5rem;
    z-index: 200;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
    display: none;
  }
  .vs-tab {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 3px; padding: 0.25rem 0;
    text-decoration: none; color: var(--text-m3);
    font-size: 0.55rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.4px;
    transition: var(--transition);
  }
  .vs-tab i { font-size: 1rem; transition: var(--transition); }
  .vs-tab.active { color: var(--gold); }
  .vs-tab.active i { transform: translateY(-2px); }
`;

/* ─── Inner Layout ───────────────────────────────────────── */
function VendorLayoutInner({ children }: { children: React.ReactNode }) {
  const { isRTL, toggleLang } = useLang();
  const pathname = usePathname();
  const router   = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [vendor,     setVendor]     = useState<VendorInfo>({
    name: 'Vendor Account', slug: '', profilePct: 0, journeyCount: 0, isPublished: false,
  });

  /* Responsive detection */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Close drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* Load vendor info */
  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then((data: any) => {
        if (!data?.business) return;
        const total  = (data.structure || []).reduce((a: number, s: any) => a + s.fields.length, 0);
        const filled = (data.structure || []).reduce((a: number, s: any) =>
          a + s.fields.filter((f: any) => f.value != null && f.value !== '').length, 0);
        setVendor({
          name:         data.business.name || 'Vendor Account',
          slug:         data.business.slug || '',
          isPublished:  !!(data.business.is_published || data.business.published),
          profilePct:   total > 0 ? Math.round((filled / total) * 100) : 0,
          journeyCount: 0,
        });
      })
      .catch(() => {});

    /* Journey request count */
    fetch('/api/vendor/journey-requests')
      .then(r => r.json())
      .then((d: any) => {
        const cnt = Array.isArray(d) ? d.filter((r: any) => r.status === 'pending').length
                  : Array.isArray(d?.requests) ? d.requests.filter((r: any) => r.status === 'pending').length
                  : 0;
        setVendor(prev => ({ ...prev, journeyCount: cnt }));
      })
      .catch(() => {});
  }, []);

  /* Active route check */
  const isActive = useCallback((href: string) =>
    pathname === href || (href !== '/vendor' && pathname.startsWith(href + '/')),
  [pathname]);

  /* Page title from route */
  const pageTitle = (() => {
    if (pathname === '/vendor') return 'Overview';
    const seg = pathname.split('/').filter(Boolean).pop() || '';
    return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  })();

  /* Initials */
  const initials = vendor.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  /* ── Sidebar JSX ── */
  const sidebarJSX = (
    <>
      {/* Brand */}
      <div className="vs-brand">
        <Link href="/vendor" className="vs-brand-logo">
          <div className="vs-brand-icon">S</div>
          <div className="vs-brand-text">
            <span className="vs-brand-name">Vendor Hub</span>
            <span className="vs-brand-sub">Siwa Oasis Portal</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button className="vs-lang-btn" onClick={toggleLang}>
            {isRTL ? 'EN' : 'ع'}
          </button>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer', lineHeight: 1 }}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {/* Vendor Profile Card */}
      <div className="vs-profile-card">
        <div className="vs-profile-top">
          <div className="vs-avatar">{initials}</div>
          <div className="vs-profile-info">
            <div className="vs-profile-name">{vendor.name}</div>
            <div className="vs-profile-type">
              <span className={`vs-pub-badge ${vendor.isPublished ? 'live' : 'draft'}`}>
                <i className={`fas fa-circle`} style={{ fontSize: '0.4rem' }} />
                {vendor.isPublished ? 'Live' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
        <div className="vs-ring-wrap">
          <div className="vs-ring-info">
            <div className="vs-ring-label">Profile Completion</div>
            <div className="vs-ring-bar">
              <div className="vs-ring-fill" style={{ width: `${vendor.profilePct}%` }} />
            </div>
            <div className="vs-ring-pct">{vendor.profilePct}% complete</div>
          </div>
          <Link
            href="/vendor/sections"
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            title="Edit Profile"
          >
            <i className="fas fa-pen" style={{ fontSize: '0.65rem', color: 'var(--gold)' }} />
          </Link>
        </div>
      </div>

      {/* Nav groups */}
      <div className="vs-nav-scroll">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="vs-nav-group">
            <div className="vs-nav-title">{group.title}</div>
            <nav>
              {group.items.map((item: any) => {
                const active = isActive(item.href);
                /* Inject live journey count badge */
                let badgeLabel = item.badge;
                let badgeClass = 'new';
                if (item.href === '/vendor/journey-requests' && vendor.journeyCount > 0) {
                  badgeLabel = String(vendor.journeyCount);
                  badgeClass = 'req';
                }
                if (item.badge === 'LIVE') badgeClass = 'live';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`vs-nav-item${active ? ' active' : ''}`}
                  >
                    <i className={`fas ${item.faIcon} vs-nav-icon`} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {badgeLabel && (
                      <span className={`vs-nav-badge ${badgeClass}`}>{badgeLabel}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="vs-sidebar-footer">
        <div className="vs-footer-links">
          <Link
            href={vendor.slug ? `/${vendor.slug}` : '#'}
            target={vendor.slug ? '_blank' : undefined}
            className="vs-footer-link minisite"
          >
            <i className="fas fa-store" style={{ fontSize: '0.6rem' }} />
            My Minisite
          </Link>
          <Link href="/" target="_blank" className="vs-footer-link site">
            <i className="fas fa-globe" style={{ fontSize: '0.6rem' }} />
            Live Site
          </Link>
        </div>
        <div className="vs-user-row">
          <div className="vs-user-avatar">{initials}</div>
          <div className="vs-user-info">
            <div className="vs-user-name">{vendor.name}</div>
            <Link href="/logout" className="vs-user-logout">Sign out →</Link>
          </div>
          <button
            className="vs-lang-btn"
            onClick={toggleLang}
            style={{ flexShrink: 0 }}
          >
            {isRTL ? 'EN' : 'ع'}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: VENDOR_CSS }} />

      <div className="vendor-root" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Mobile overlay */}
        <div
          className={`vs-mobile-overlay${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`vs-sidebar${isMobile && mobileOpen ? ' mobile-open' : ''}`}>
          {sidebarJSX}
        </aside>

        {/* Main */}
        <main className="vs-main">
          {/* Topbar */}
          <header className="vs-topbar">
            <div className="vs-topbar-left">
              {isMobile && (
                <button className="vs-hamburger" onClick={() => setMobileOpen(true)}>
                  <i className="fas fa-bars" />
                </button>
              )}
              <div className="vs-breadcrumb">
                <span className="vs-breadcrumb-root">Vendor Hub</span>
                <span className="vs-breadcrumb-sep">/</span>
                <span className="vs-breadcrumb-page">{pageTitle}</span>
              </div>
            </div>

            <div className="vs-topbar-right">
              {/* Profile % pill — desktop only */}
              {!isMobile && (
                <div className="vs-topbar-profile-pill">
                  <span style={{ fontSize: '0.62rem', color: '#92702a', fontWeight: 800 }}>Profile</span>
                  <div className="vs-topbar-pct-bar">
                    <div className="vs-topbar-pct-fill" style={{ width: `${vendor.profilePct}%` }} />
                  </div>
                  <span className="vs-topbar-pct-label">{vendor.profilePct}%</span>
                </div>
              )}

              {/* Notifications */}
              <Link href="/vendor/journey-requests" className="vs-notif-btn" title="Journey Requests">
                <i className="fas fa-bell" />
                {vendor.journeyCount > 0 && (
                  <span className="vs-notif-badge">{vendor.journeyCount}</span>
                )}
              </Link>

              {/* Avatar */}
              <div className="vs-topbar-avatar" title={vendor.name}>{initials}</div>
            </div>
          </header>

          {/* Page Content */}
          <div className="vs-scroll">
            <div className="vs-page">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Tabs */}
        <nav className="vs-bottom-tabs">
          {MOBILE_TABS.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`vs-tab${isActive(tab.href) ? ' active' : ''}`}
            >
              <i className={`fas ${tab.faIcon}`} />
              <span>{tab.name}</span>
            </Link>
          ))}
        </nav>
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
