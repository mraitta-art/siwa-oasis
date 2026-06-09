'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/context/AdminContext';

/* ─────────────────────────────────────────────────────────
   GOVERNANCE PIPELINE — Sidebar navigation groups.
   5 focused groups ordered by workflow:
   Foundation → Content → Site → Businesses → System
   ───────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    id: 'foundation',
    title: 'FOUNDATION',
    subtitle: 'Schema & Structure',
    icon: 'fa-cubes',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Blueprint Architect', path: '/jana/governance', icon: 'fa-microchip', exact: true },
      { name: 'Business Types', path: '/jana/types', icon: 'fa-folder-tree' },
      { name: 'Sections', path: '/jana/sections', icon: 'fa-table-cells' },
      { name: 'Master Templates', path: '/jana/templates', icon: 'fa-gem' },
      { name: 'Vendor Tiers', path: '/jana/tiers', icon: 'fa-shield-alt' },
      { name: 'Card Layouts', path: '/jana/cards', icon: 'fa-id-card' },
    ]
  },
  {
    id: 'content',
    title: 'CONTENT',
    subtitle: 'Media & Components',
    icon: 'fa-photo-film',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Blog Hub', path: '/jana/blog', icon: 'fa-newspaper' },
      { name: 'Hero Carousel', path: '/jana/hero-carousel', icon: 'fa-images' },
      { name: 'Component Library', path: '/jana/component-library', icon: 'fa-layer-group' },
      { name: 'Services', path: '/jana/services-manager', icon: 'fa-server-group' },
      { name: 'Categories', path: '/jana/experience-categories-manager', icon: 'fa-mountain-city' },
      { name: 'Journeys', path: '/jana/journey-templates-manager', icon: 'fa-route' },
    ]
  },
  {
    id: 'site',
    title: 'SITE & PAGES',
    subtitle: 'Public-Facing Design',
    icon: 'fa-display',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Visual Editor', path: '/jana/website', icon: 'fa-palette' },
      { name: 'Homepage Editor', path: '/jana/homepage-editor', icon: 'fa-home' },
      { name: 'Page Builder', path: '/jana/page-builder', icon: 'fa-object-group' },
      { name: 'Search Engines', path: '/jana/search-engines', icon: 'fa-search' },
      { name: 'Search Pages', path: '/jana/search-pages', icon: 'fa-filter-list' },
    ]
  },
  {
    id: 'businesses',
    title: 'BUSINESSES',
    subtitle: 'Registry & Operations',
    icon: 'fa-briefcase',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Business Registry', path: '/jana/businesses', icon: 'fa-building' },
      { name: 'Onboarding Wizard', path: '/jana/orchestrator', icon: 'fa-magic' },
      { name: 'Fast-Track Builder', path: '/jana/fast-track', icon: 'fa-bolt' },
      { name: 'Vendors', path: '/jana/vendors', icon: 'fa-user-tie' },
      { name: 'Packages', path: '/jana/packages', icon: 'fa-box-open' },
    ]
  },
  {
    id: 'system',
    title: 'SYSTEM',
    subtitle: 'Maintenance & Config',
    icon: 'fa-gear',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { name: 'Data Manager', path: '/jana/data-manager', icon: 'fa-database' },
      { name: 'Forms', path: '/jana/forms', icon: 'fa-rectangle-list' },
      { name: 'Moderation', path: '/jana/moderation', icon: 'fa-user-shield' },
      { name: 'Upgrades', path: '/jana/upgrades', icon: 'fa-arrow-up-right-dots' },
      { name: 'Policies', path: '/jana/policies', icon: 'fa-scale-balanced' },
      { name: 'Diagnostic', path: '/jana/diagnostic', icon: 'fa-stethoscope' },
      { name: 'Audit Logs', path: '/jana/audit', icon: 'fa-history' },
      { name: 'Curation', path: '/jana/curation', icon: 'fa-filter' },
    ]
  }
];


function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { advancedMode, setAdvancedMode } = useAdmin();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => { if (g.defaultCollapsed) defaults[g.id] = true; });
    return defaults;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (item: any) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  // AUTO-EXPAND: Ensure any collapsible group containing the active page is expanded
  useEffect(() => {
    NAV_GROUPS.forEach(group => {
      if (group.collapsible && group.items.some(item => isActive(item))) {
        setCollapsedGroups(prev => {
          if (prev[group.id]) return { ...prev, [group.id]: false };
          return prev;
        });
      }
    });
    // Auto-scroll active sidebar item into view
    setTimeout(() => {
      const activeEl = document.querySelector('[data-sidebar-active="true"]');
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 100);
  }, [pathname]);

  // Contextual guidance based on current page
  const getPageGuide = () => {
    if (pathname === '/jana') return { title: 'Dashboard', tip: 'Overview of your marketplace ecosystem.' };
    // Foundation
    if (pathname.includes('/governance')) return { title: 'Blueprint Architect', tip: 'Guided blueprint flow: Identity, Modules, Fields, Governance.' };
    if (pathname.includes('/types')) return { title: 'Business Types', tip: 'Define parent categories and their children. Assign sections to control what data each type collects.' };
    if (pathname.includes('/sections')) return { title: 'Sections', tip: 'Define reusable data containers — these become available when configuring types.' };
    if (pathname.includes('/templates')) return { title: 'Master Templates', tip: 'Design reusable templates for business types.' };
    if (pathname.includes('/tiers')) return { title: 'Vendor Tiers', tip: 'Define subscription tiers with feature quotas.' };
    if (pathname.includes('/cards')) return { title: 'Card Layouts', tip: 'Design how business listings appear in search results. Choose visible fields per type.' };
    if (pathname.includes('/expressions')) return { title: 'Vibe Expressions', tip: 'Define searchable atmosphere tags like Rustic, Spiritual, Eco-friendly.' };
    // Content
    if (pathname.includes('/blog/sidebar')) return { title: 'Blog Sidebar Builder', tip: 'Design custom blog sidebar layouts and save to the library.' };
    if (pathname.includes('/blog-layout-builder') || pathname.includes('/blog/layouts')) return { title: 'Blog Layout Builder', tip: 'Design custom blog grid layouts with live preview.' };
    if (pathname.includes('/blog-templates') || pathname.includes('/blog/templates')) return { title: 'Blog Templates', tip: 'Browse pre-built blog component templates.' };
    if (pathname.includes('/blog-integration') || pathname.includes('/blog/integration')) return { title: 'Blog Integration', tip: 'Configure and generate blog sections with easy presets.' };
    if (pathname.includes('/blog')) return { title: 'Blog Hub', tip: 'Create and manage blog posts, layouts, templates, and integrations.' };
    if (pathname.includes('/hero-carousel')) return { title: 'Hero Carousel', tip: 'Create cinematic carousel slides and save them to the component library.' };
    if (pathname.includes('/component-library')) return { title: 'Component Library', tip: 'Manage all reusable components: carousels, sidebars, galleries, and more.' };
    if (pathname.includes('/services-manager')) return { title: 'Services', tip: 'Manage page services displayed across the platform.' };
    if (pathname.includes('/experience-categories')) return { title: 'Categories', tip: 'Manage experience categories for discovery and filtering.' };
    if (pathname.includes('/journey-templates')) return { title: 'Journey Templates', tip: 'Design reusable journey templates for customer onboarding.' };
    // Site & Pages
    if (pathname.includes('/website')) return { title: 'Visual Editor', tip: 'Build the public homepage with drag-and-drop components.' };
    if (pathname.includes('/homepage-editor')) return { title: 'Homepage Editor', tip: 'Quick homepage configuration: layout sections, settings, and content.' };
    if (pathname.includes('/page-builder')) return { title: 'Page Builder', tip: 'Build custom pages using components from the library.' };
    if (pathname.includes('/search-engines')) return { title: 'Search Engines', tip: 'Configure multi-criteria search with filterable fields.' };
    if (pathname.includes('/search-pages')) return { title: 'Search Pages', tip: 'Manage search page configurations and result layouts.' };
    // Businesses
    if (pathname.includes('/studio')) return { title: 'Unified Studio', tip: 'Stage 1: Define category schema. Stage 2: Select a business and fill its data.' };
    if (pathname.includes('/businesses')) return { title: 'Business Registry', tip: 'Onboard and manage businesses using forms defined in Foundation.' };
    if (pathname.includes('/orchestrator')) return { title: 'Onboarding Wizard', tip: 'Guided flow: select type, fill data, assign vendor, publish.' };
    if (pathname.includes('/fast-track')) return { title: 'Fast-Track Builder', tip: 'Quickly add businesses with minimal friction.' };
    if (pathname.includes('/vendors')) return { title: 'Vendors', tip: 'Assign vendor accounts to manage their own business listings.' };
    if (pathname.includes('/packages')) return { title: 'Packages', tip: 'Create and manage experience packages offered by businesses.' };
    // System
    if (pathname.includes('/data-manager')) return { title: 'Data Manager', tip: 'Import, export, and backup your database.' };
    if (pathname.includes('/forms')) return { title: 'Forms', tip: 'Manage form definitions and field configurations.' };
    if (pathname.includes('/moderation')) return { title: 'Moderation', tip: 'Review and moderate user-submitted content.' };
    if (pathname.includes('/upgrades')) return { title: 'Upgrades', tip: 'Review and approve vendor upgrade requests.' };
    if (pathname.includes('/policies')) return { title: 'Policies', tip: 'Define search visibility policies that control what data each role can see.' };
    if (pathname.includes('/diagnostic')) return { title: 'Diagnostic', tip: 'System health checks and component diagnostics.' };
    if (pathname.includes('/audit')) return { title: 'Audit Logs', tip: 'View activity history and change tracking.' };
    if (pathname.includes('/curation')) return { title: 'Curation', tip: 'Content filtering and curation rules.' };
    return { title: 'Governance CMS', tip: 'Navigate the pipeline from Foundation through Publication.' };
  };

  const guide = getPageGuide();

  // Determine sidebar width for desktop
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 60 : 270);

  // Render sidebar content (shared between desktop sidebar and mobile drawer)
  const renderSidebarContent = (showLabels: boolean) => (
    <>
      {/* Brand Header */}
      <div style={{
        padding: showLabels ? '1.25rem 1.25rem' : '1rem 0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        justifyContent: showLabels ? 'flex-start' : 'center',
      }}>
        <div style={{
          width: '32px', height: '32px', background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '0.8rem', color: '#1a1a2e', flexShrink: 0,
        }}>S</div>
        {showLabels && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>SIWA OASIS</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Governance CMS</div>
          </div>
        )}
        {/* Close button on mobile */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Desktop collapse toggle (not shown on mobile) */}
      {!isMobile && (
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            background: 'rgba(255,255,255,0.04)', border: 'none', color: 'rgba(255,255,255,0.4)',
            padding: '0.5rem', cursor: 'pointer', fontSize: '0.7rem', margin: '0.25rem 0.5rem',
            borderRadius: '6px', transition: 'all 0.2s',
          }}
        >
          <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          {showLabels && <span style={{ marginLeft: '0.5rem' }}>Collapse</span>}
        </button>
      )}

      {/* Nav Groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_GROUPS.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.id];
          const hasActiveItem = group.items.some(item => isActive(item));

          return (
            <div key={group.id} style={{ marginBottom: '0.25rem' }}>
              {/* Group Header */}
              {showLabels && (
                <div
                  onClick={() => group.collapsible !== false && toggleGroup(group.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', cursor: group.collapsible !== false ? 'pointer' : 'default',
                    borderRadius: '6px', marginBottom: '0.15rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className={`fas ${group.icon}`} style={{
                      fontSize: '0.55rem', color: hasActiveItem ? '#D4AF37' : 'rgba(255,255,255,0.25)',
                      width: '14px', textAlign: 'center',
                    }}></i>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1.5px',
                      color: hasActiveItem ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                      transition: 'color 0.2s',
                    }}>
                      {group.title}
                    </div>
                  </div>
                  {group.collapsible !== false && (
                    <i className={`fas fa-chevron-${isGroupCollapsed ? 'right' : 'down'}`}
                       style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}></i>
                  )}
                </div>
              )}

              {/* Group Items */}
              {(!isGroupCollapsed || !showLabels) && group.items.map(item => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    data-sidebar-active={active ? 'true' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: showLabels ? '0.55rem 0.75rem 0.55rem 1.25rem' : '0.6rem',
                      borderRadius: '8px', textDecoration: 'none',
                      background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                      color: active ? '#D4AF37' : 'rgba(255,255,255,0.55)',
                      fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                      transition: 'all 0.2s',
                      justifyContent: showLabels ? 'flex-start' : 'center',
                      borderLeft: active && showLabels ? '3px solid #D4AF37' : '3px solid transparent',
                    }}
                    title={!showLabels ? item.name : undefined}
                  >
                    <i className={`fas ${item.icon}`} style={{
                      width: '16px', textAlign: 'center', fontSize: '0.75rem',
                      opacity: active ? 1 : 0.6,
                    }}></i>
                    {showLabels && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {showLabels && (
        <div style={{
          padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)',
        }}>
          <i className="fas fa-shield-alt" style={{ color: '#10b981', marginRight: '0.5rem' }}></i>
          Governance v3.0 — Production
        </div>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>

      {/* ─── MOBILE OVERLAY ─── */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            zIndex: 199, animation: 'fadeIn 0.2s',
          }}
        />
      )}

      {/* ─── MOBILE DRAWER ─── */}
      {isMobile && (
        <aside style={{
          width: '280px',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 200,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
        }}>
          {renderSidebarContent(true)}
        </aside>
      )}

      {/* ─── DESKTOP SIDEBAR ─── */}
      {!isMobile && (
        <aside style={{
          width: sidebarCollapsed ? '60px' : '270px',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
        }}>
          {renderSidebarContent(!sidebarCollapsed)}
        </aside>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? '60px' : '270px'),
        flex: 1,
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: isMobile ? '100%' : 'auto',
      }}>
        {/* Top Bar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '0.75rem 1rem' : '0.75rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 50,
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
            {/* Hamburger button (mobile only) */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px',
                  color: '#1e293b', fontSize: '1.1rem', cursor: 'pointer',
                  padding: '0.5rem 0.65rem', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className="fas fa-bars"></i>
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{guide.title}</h2>
              {!isMobile && <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{guide.tip}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.5rem', flexShrink: 0 }}>
            {/* Advanced Mode Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '2rem',
              border: '1px solid #e2e8f0', fontSize: '0.65rem', fontWeight: 700,
              color: advancedMode ? '#D4AF37' : '#94a3b8',
            }}>
              <i className={`fas ${advancedMode ? 'fa-terminal' : 'fa-user'}`}></i>
              {!isMobile && (advancedMode ? 'ADV' : 'STD')}
              <label style={{ position: 'relative', display: 'inline-block', width: '28px', height: '16px', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: advancedMode ? '#D4AF37' : '#cbd5e1', transition: '.3s', borderRadius: '16px',
                }}></span>
              </label>
            </div>

            {/* User Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {!isMobile && <i className="fas fa-bell" style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>}
              <div style={{
                width: '32px', height: '32px', background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1a1a2e', fontWeight: 800, fontSize: '0.75rem',
              }}>A</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="animate-in" style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem 2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>
        {children}
      </AdminLayoutInner>
    </AdminProvider>
  );
}
