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
    id: 'basics',
    title: 'BASICS & SETTINGS',
    subtitle: 'Structure & forms',
    icon: 'fa-cubes',
    accent: '#60a5fa',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Blueprint Architect', path: '/jana/governance', icon: 'fa-microchip', exact: true },
      { name: 'Business Types', path: '/jana/types', icon: 'fa-folder-tree' },
      { name: 'Unified Section Architect', path: '/jana/sections', icon: 'fa-table-cells' },
      { name: 'Unified Form Builder', path: '/jana/business-forms', icon: 'fa-file-alt' },
      { name: 'Master Templates', path: '/jana/templates', icon: 'fa-gem' },
      {
        name: 'Blueprints',
        path: '/jana/blueprints',
        icon: 'fa-drafting-compass',
        children: [
          { name: 'Blueprint Canvas', path: '/jana/blueprints', icon: 'fa-cubes', exact: true },
          { name: 'Atom Registry', path: '/jana/blueprints/atoms', icon: 'fa-atom' },
        ]
      },
      { name: 'Vendor Tiers', path: '/jana/tiers', icon: 'fa-shield-alt' },
      { name: 'Vibe Expressions', path: '/jana/expressions', icon: 'fa-sparkles' },
    ]
  },
  {
    id: 'data_feed',
    title: 'DATA FEED & INPUT',
    subtitle: 'Feed the system',
    icon: 'fa-database',
    accent: '#22c55e',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Business Registry', path: '/jana/businesses', icon: 'fa-building' },
      { name: 'Onboarding Wizard', path: '/jana/orchestrator', icon: 'fa-magic' },
      { name: 'Fast-Track Builder', path: '/jana/fast-track', icon: 'fa-bolt' },
      { name: 'Unified Builder', path: '/jana/unified-builder', icon: 'fa-sitemap' },
      { name: 'Unified Studio', path: '/jana/studio', icon: 'fa-drafting-compass' },
      { name: 'Vendors', path: '/jana/vendors', icon: 'fa-user-tie' },
      { name: 'Packages', path: '/jana/packages', icon: 'fa-box-open' },
      { name: 'Benefits', path: '/jana/benefits', icon: 'fa-gift' },
      { name: 'Auctions', path: '/jana/auctions', icon: 'fa-gavel', badge: 'NEW' },
      { name: 'Dispatch', path: '/jana/dispatch', icon: 'fa-paper-plane' },
    ]
  },
  {
    id: 'display',
    title: 'DISPLAY & CONTENT',
    subtitle: 'What visitors see',
    icon: 'fa-photo-film',
    accent: '#a78bfa',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Blog Hub', path: '/jana/blog', icon: 'fa-newspaper' },
      { name: 'Blog Layout Builder', path: '/jana/blog-layout-builder', icon: 'fa-table-columns' },
      { name: 'Blog Templates', path: '/jana/blog-templates', icon: 'fa-file-invoice' },
      { name: 'Blog Integration', path: '/jana/blog-integration', icon: 'fa-plug' },
      { name: 'Hero Carousel', path: '/jana/hero-carousel', icon: 'fa-images' },
      { name: 'Component Library', path: '/jana/component-library', icon: 'fa-layer-group' },
      { name: 'Components', path: '/jana/components', icon: 'fa-puzzle-piece' },
      { name: 'Visual Editor', path: '/jana/website', icon: 'fa-palette' },
      { name: 'Pages Manager', path: '/jana/pages', icon: 'fa-copy' },
      { name: 'Section Status Map', path: '/jana/homepage-editor', icon: 'fa-home' },
      { name: 'Card Layouts', path: '/jana/cards', icon: 'fa-id-card' },
      { name: 'Minisite Builder', path: '/jana/minisite', icon: 'fa-store' },
      { name: 'Search Engines', path: '/jana/search-engines', icon: 'fa-search' },
      { name: 'Search Pages', path: '/jana/search-pages', icon: 'fa-filter-list' },
      { name: 'Search & Compare', path: '/jana/search-compare', icon: 'fa-sliders' },
      { name: 'Mobile View', path: '/jana/mobile', icon: 'fa-mobile-alt' },
      { name: 'Services', path: '/jana/services-manager', icon: 'fa-concierge-bell' },
      { name: 'Categories', path: '/jana/experience-categories-manager', icon: 'fa-mountain-city' },
      { name: 'Journeys', path: '/jana/journey-templates-manager', icon: 'fa-route' },
    ]
  },
  {
    id: 'reports',
    title: 'REPORTS & CONTROL',
    subtitle: 'Visibility & insights',
    icon: 'fa-chart-line',
    accent: '#f59e0b',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { name: 'Section Overrides', path: '/admin/section-overrides', icon: 'fa-user-gear' },
      { name: 'Section Visibility', path: '/admin/section-visibility', icon: 'fa-eye' },
      { name: 'POI Settings', path: '/admin/poi-settings', icon: 'fa-location-dot' },
      { name: 'Packages Approval', path: '/admin/packages', icon: 'fa-box' },
      { name: 'Offers Approval', path: '/admin/offers', icon: 'fa-gift' },
      { name: 'Discount Campaigns', path: '/admin/discounts', icon: 'fa-tags' },
      { name: 'Investment Opps', path: '/admin/investment-opportunities', icon: 'fa-hand-holding-dollar' },
      { name: 'Journey Requests', path: '/admin/journey-requests', icon: 'fa-route' },
      { name: 'Journey Policies', path: '/admin/journey-policies', icon: 'fa-gavel' },
      { name: 'Journey Analytics', path: '/admin/analytics/journey-requests', icon: 'fa-chart-line' },
      { name: 'Vendor Analytics', path: '/admin/analytics/vendor-performance', icon: 'fa-chart-simple' },
    ]
  },
  {
    id: 'system',
    title: 'SYSTEM',
    subtitle: 'Maintenance & config',
    icon: 'fa-gear',
    accent: '#94a3b8',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { name: 'Data Manager', path: '/jana/data-manager', icon: 'fa-database' },
      { name: 'Forms', path: '/jana/forms', icon: 'fa-clipboard-list' },
      { name: 'Moderation', path: '/jana/moderation', icon: 'fa-user-shield' },
      { name: 'Upgrades', path: '/jana/upgrades', icon: 'fa-arrow-up-right-dots' },
      { name: 'Policies', path: '/jana/policies', icon: 'fa-scale-balanced' },
      { name: 'Diagnostic', path: '/jana/diagnostic', icon: 'fa-heartbeat' },
      { name: 'Audit Logs', path: '/jana/audit', icon: 'fa-history' },
      { name: 'Curation', path: '/jana/curation', icon: 'fa-filter' },
      { name: 'System Setup', path: '/jana/setup', icon: 'fa-screwdriver-wrench' },
      { name: 'Demo Automation', path: '/jana/demo-automation', icon: 'fa-robot' },
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

  const isActiveItem = (item: any): boolean => {
    if (item.exact) return pathname === item.path;
    if (item.children) {
      return item.children.some(isActiveItem) || pathname.startsWith(item.path);
    }
    return pathname.startsWith(item.path);
  };

  const isActive = isActiveItem;

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
    if (pathname.startsWith('/jana/blueprints/atoms')) return { title: 'Atom Registry', tip: 'Manage the shared atom library used by all blueprints.' };
    if (pathname.startsWith('/jana/blueprints/') && pathname !== '/jana/blueprints') return { title: 'Blueprint Editor', tip: 'Edit type-specific blueprints, media, and mini-blog content.' };
    if (pathname.includes('/blueprints')) return { title: 'Blueprints', tip: 'Visual architecture blueprints — map out the full structure of your marketplace.' };
    if (pathname.includes('/business-forms')) return { title: 'Business Forms', tip: 'Configure forms used during business onboarding and data collection.' };
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
    if (pathname.includes('/carousel-diagnostic')) return { title: 'Carousel Diagnostic', tip: 'Debug and test carousel components, check slide loading and transitions.' };
    if (pathname.includes('/components')) return { title: 'Components', tip: 'Browse and manage individual UI components for pages and minisites.' };
    if (pathname.includes('/services-manager')) return { title: 'Services', tip: 'Manage page services displayed across the platform.' };
    if (pathname.includes('/experience-categories')) return { title: 'Categories', tip: 'Manage experience categories for discovery and filtering.' };
    if (pathname.includes('/journey-templates')) return { title: 'Journey Templates', tip: 'Design reusable journey templates for customer onboarding.' };
    // Site & Pages
    if (pathname.includes('/website')) return { title: 'Visual Editor', tip: 'Build the public homepage with drag-and-drop components.' };
    if (pathname.includes('/homepage-editor')) return { title: 'Homepage Editor', tip: 'Quick homepage configuration: layout sections, settings, and content.' };
    if (pathname.includes('/page-builder')) return { title: 'Page Builder', tip: 'Build custom pages using components from the library.' };
    if (pathname.includes('/pages')) return { title: 'Pages Manager', tip: 'Manage all custom pages, their routes, and publication status.' };
    if (pathname.includes('/minisite')) return { title: 'Minisite Builder', tip: 'Build and preview vendor minisites — each business gets its own branded page.' };
    if (pathname.includes('/search-compare')) return { title: 'Search & Compare', tip: 'Side-by-side comparison tool for businesses, packages, and offers.' };
    if (pathname.includes('/mobile')) return { title: 'Mobile View', tip: 'Preview and optimize your pages for mobile devices.' };
    if (pathname.includes('/search-engines')) return { title: 'Search Engines', tip: 'Configure multi-criteria search with filterable fields.' };
    if (pathname.includes('/search-pages')) return { title: 'Search Pages', tip: 'Manage search page configurations and result layouts.' };
    // Businesses
    if (pathname.includes('/studio')) return { title: 'Unified Studio', tip: 'Stage 1: Define category schema. Stage 2: Select a business and fill its data.' };
    if (pathname.includes('/businesses')) return { title: 'Business Registry', tip: 'Onboard and manage businesses using forms defined in Foundation.' };
    if (pathname.includes('/orchestrator')) return { title: 'Onboarding Wizard', tip: 'Guided flow: select type, fill data, assign vendor, publish.' };
    if (pathname.includes('/fast-track')) return { title: 'Fast-Track Builder', tip: 'Quickly add businesses with minimal friction.' };
    if (pathname.includes('/unified-builder')) return { title: 'Unified Builder', tip: 'Centralized workspace for schema, forms, components, pages, and launch actions.' };
    if (pathname.includes('/vendors')) return { title: 'Vendors', tip: 'Assign vendor accounts to manage their own business listings.' };
    if (pathname.includes('/packages')) return { title: 'Packages', tip: 'Create and manage experience packages offered by businesses.' };
    if (pathname.includes('/auctions')) return { title: 'Auctions', tip: 'Manage auction listings for exclusive experiences and investment opportunities.' };
    if (pathname.includes('/dispatch')) return { title: 'Dispatch', tip: 'Send notifications, announcements, and messages to vendors and visitors.' };
    if (pathname.includes('/benefits')) return { title: 'Benefits', tip: 'Configure and manage vendor tier benefits and perks.' };
    // Tools
    if (pathname.includes('/form-builder-enhanced')) return { title: 'Enhanced Form Builder', tip: 'Advanced drag-and-drop form builder with conditional logic and validation.' };
    if (pathname.includes('/form-builder')) return { title: 'Form Builder', tip: 'Quick visual form builder — create fields, sections, and modules easily.' };
    if (pathname.includes('/demo-automation')) return { title: 'Demo Automation', tip: 'Generate demo data and automate repetitive setup tasks.' };
    // System
    if (pathname.includes('/data-manager')) return { title: 'Data Manager', tip: 'Import, export, and backup your database.' };
    if (pathname.includes('/forms')) return { title: 'Forms', tip: 'Manage form definitions and field configurations.' };
    if (pathname.includes('/moderation')) return { title: 'Moderation', tip: 'Review and moderate user-submitted content.' };
    if (pathname.includes('/upgrades')) return { title: 'Upgrades', tip: 'Review and approve vendor upgrade requests.' };
    if (pathname.includes('/policies')) return { title: 'Policies', tip: 'Define search visibility policies that control what data each role can see.' };
    if (pathname.includes('/diagnostic')) return { title: 'Diagnostic', tip: 'System health checks and component diagnostics.' };
    if (pathname.includes('/audit')) return { title: 'Audit Logs', tip: 'View activity history and change tracking.' };
    if (pathname.includes('/curation')) return { title: 'Curation', tip: 'Content filtering and curation rules.' };
    if (pathname.includes('/setup')) return { title: 'System Setup', tip: 'Run database schema verification, seed default components, and configure universal sections.' };
    return { title: 'Governance CMS', tip: 'Navigate the pipeline from Foundation through Publication.' };
  };

  const guide = getPageGuide();

  // Determine sidebar width for desktop
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 60 : 270);

  // Render the sidebar content. `showLabels` controls whether text labels are visible
  const renderSidebarContent = (showLabels: boolean) => {
    return (
      <div style={{ color: '#cbd5e1', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'space-between' : 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {!showLabels ? (
            <div style={{ fontWeight: 900, color: '#fff' }}>SIWA</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontWeight: 900, color: '#fff' }}>SIWA</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Governance</div>
            </div>
          )}
          {showLabels && (
            <button onClick={() => setSidebarCollapsed(s => !s)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }} title="Toggle sidebar">
              <i className={`fas ${sidebarCollapsed ? 'fa-angle-right' : 'fa-angle-left'}`} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.id} style={{ marginBottom: '0.6rem' }}>
              <div onClick={() => toggleGroup(group.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: group.collapsible ? 'pointer' : 'default', padding: '0.35rem 0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <i className={`fas ${group.icon}`} style={{ color: group.accent }} />
                  {showLabels && <strong style={{ fontSize: '0.78rem', color: '#e6eefb' }}>{group.title}</strong>}
                </div>
                {showLabels && group.collapsible && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{collapsedGroups[group.id] ? '+' : '-'}</div>}
              </div>

              {(!group.collapsible || !collapsedGroups[group.id]) && (
                <div style={{ marginTop: '0.45rem', display: 'grid', gap: '0.25rem' }}>
                  {group.items.map((item: any) => (
                    <div key={item.path} data-sidebar-active={isActive(item) ? 'true' : 'false'} style={{ display: 'flex', alignItems: 'center' }}>
                      <Link href={item.path} style={{ textDecoration: 'none', color: isActive(item) ? '#fff' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: showLabels ? '0.75rem' : '0' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive(item) ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                          <i className={`fas ${item.icon || 'fa-circle'}`} />
                        </div>
                        {showLabels && <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{item.name}</div>}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          {showLabels && (
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Logged in as <strong style={{ color: '#fff' }}>Admin</strong></div>
          )}
        </div>
      </div>
    );
  };


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
