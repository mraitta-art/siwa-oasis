'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/context/AdminContext';

/* ─────────────────────────────────────────────────────────
   GOVERNANCE PIPELINE — Sidebar navigation groups.
   Ordered by the actual data lifecycle dependency chain:
   Foundation → Forms → Discovery → Registry → Publication
   ───────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    id: 'pipeline',
    title: '🛡️ GOVERNANCE PIPELINE',
    subtitle: 'Binary Structural Steps',
    collapsible: false,
    items: [
      { name: '1. Foundation Architect', path: '/jana/governance', icon: 'fa-microchip', exact: true },
      { name: '2. Fast-Track Builder', path: '/jana/fast-track', icon: 'fa-bolt', exact: true },
      { name: '3. Onboarding Wizard', path: '/jana/orchestrator', icon: 'fa-magic' },
      { name: '4. Business Registry', path: '/jana/businesses', icon: 'fa-briefcase' },
      { name: '5. Visual Orchestrator', path: '/jana/website', icon: 'fa-palette' },
      { name: '6. Data Manager', path: '/jana/data-manager', icon: 'fa-server' },
    ]
  },
  {
    id: 'architect',
    title: '🏗️ MASTER ARCHITECT',
    subtitle: 'Blueprint Control',
    collapsible: true,
    items: [
      { name: 'Business Types', path: '/jana/types', icon: 'fa-folder-tree' },
      { name: 'Data Sections', path: '/jana/sections', icon: 'fa-columns' },
      { name: 'Form Fields', path: '/jana/form-builder', icon: 'fa-list-check' },
      { name: 'Search Engines', path: '/jana/search-engines', icon: 'fa-search' },
      { name: 'Card Layouts', path: '/jana/cards', icon: 'fa-id-card' },
      { name: 'Master Templates', path: '/jana/templates', icon: 'fa-gem' },
      { name: 'Vendor Tiers', path: '/jana/tiers', icon: 'fa-shield-alt' },
    ]
  },
  {
    id: 'components',
    title: '📦 COMPONENTS',
    subtitle: 'Library & Builders',
    collapsible: true,
    items: [
      { name: 'Component Library', path: '/jana/component-library', icon: 'fa-layer-group' },
      { name: 'Hero Carousel', path: '/jana/hero-carousel', icon: 'fa-images' },
      { name: 'Blog Manager', path: '/jana/blog', icon: 'fa-newspaper' },
    ]
  }
];


function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { advancedMode, setAdvancedMode } = useAdmin();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    if (pathname === '/jana') return { title: 'Governance Dashboard', tip: 'Overview of your marketplace ecosystem. Start the Foundation Architect for blueprint setup.' };
    if (pathname.includes('/sections')) return { title: 'Data Sections', tip: 'Define reusable data containers first — these become available when configuring types.' };
    if (pathname.includes('/types')) return { title: 'Typology Tree', tip: 'Define parent categories and their children. Assign sections to control what data each type collects.' };
    if (pathname.includes('/expressions')) return { title: 'Vibe & Expressions', tip: 'Define searchable atmosphere tags like "Rustic", "Spiritual", "Eco-friendly".' };
    if (pathname.includes('/forms')) return { title: 'Form Architect', tip: 'Add fields to types. Fields on parents are inherited by all children automatically.' };
    if (pathname.includes('/governance')) return { title: 'Foundation Architect', tip: 'Guided blueprint flow: Identity → Modules → Fields → Governance.' };
    if (pathname.includes('/policies')) return { title: 'Policies & Logic', tip: 'Define search visibility policies that control what data each role can see.' };
    if (pathname.includes('/search-engines')) return { title: 'Search Engines', tip: 'Configure multi-criteria search with filterable fields from your form definitions.' };
    if (pathname.includes('/cards')) return { title: 'Card Layouts', tip: 'Design how business listings appear in search results. Choose visible fields per type.' };
    if (pathname.includes('/businesses')) return { title: 'Business Manager', tip: 'Onboard and manage businesses using forms defined in the Architect.' };
    if (pathname.includes('/vendors')) return { title: 'Vendor Authority', tip: 'Assign vendor accounts to manage their own business listings.' };
    if (pathname.includes('/orchestrator')) return { title: 'Orchestration Wizard', tip: 'Guided flow: select type → fill data → assign vendor → publish.' };
    if (pathname.includes('/website')) return { title: 'Website Designer', tip: 'Build the public homepage with drag-and-drop components.' };
    if (pathname.includes('/component-library')) return { title: 'Component Library', tip: 'Manage all reusable components: carousels, sidebars, galleries, and more.' };
    if (pathname.includes('/hero-carousel')) return { title: 'Hero Carousel Builder', tip: 'Create cinematic carousel slides and save them to the component library.' };
    if (pathname.includes('/blog/sidebar')) return { title: 'Blog Sidebar Builder', tip: 'Design custom blog sidebar layouts and save to the library.' };
    if (pathname.includes('/page-builder')) return { title: 'Page Builder', tip: 'Build custom pages using components from the library.' };
    if (pathname.includes('/blog')) return { title: 'Blog Manager', tip: 'Create and manage blog posts with rich content and SEO optimization.' };
    if (pathname.includes('/blog-layout-builder')) return { title: 'Blog Layout Builder', tip: 'Design custom blog grid layouts with live preview and copy generated code.' };
    if (pathname.includes('/blog-templates')) return { title: 'Blog Templates', tip: 'Browse pre-built blog component templates for forms and mini-sites.' };
    if (pathname.includes('/blog-integration')) return { title: 'Blog Integration Tool', tip: 'Configure and generate blog sections with easy presets for any page.' };
    return { title: 'Marketplace Governance', tip: 'Navigate the pipeline from Foundation through Publication.' };
  };

  const guide = getPageGuide();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* ─── SIDEBAR ─── */}
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
        {/* Brand Header */}
        <div style={{
          padding: sidebarCollapsed ? '1rem 0.5rem' : '1.25rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '32px', height: '32px', background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.8rem', color: '#1a1a2e', flexShrink: 0,
          }}>S</div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>SIWA OASIS</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Governance CMS</div>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            background: 'rgba(255,255,255,0.04)', border: 'none', color: 'rgba(255,255,255,0.4)',
            padding: '0.5rem', cursor: 'pointer', fontSize: '0.7rem', margin: '0.25rem 0.5rem',
            borderRadius: '6px', transition: 'all 0.2s',
          }}
        >
          <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          {!sidebarCollapsed && <span style={{ marginLeft: '0.5rem' }}>Collapse</span>}
        </button>

        {/* Nav Groups */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_GROUPS.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.id];
            const hasActiveItem = group.items.some(item => isActive(item));

            return (
              <div key={group.id} style={{ marginBottom: '0.25rem' }}>
                {/* Group Header */}
                {!sidebarCollapsed && (
                  <div
                    onClick={() => group.collapsible !== false && toggleGroup(group.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem', cursor: group.collapsible !== false ? 'pointer' : 'default',
                      borderRadius: '6px', marginBottom: '0.15rem',
                    }}
                  >
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1px',
                      color: hasActiveItem ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                      transition: 'color 0.2s',
                    }}>
                      {group.title}
                    </div>
                    {group.collapsible !== false && (
                      <i className={`fas fa-chevron-${isGroupCollapsed ? 'right' : 'down'}`}
                         style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}></i>
                    )}
                  </div>
                )}

                {/* Group Items */}
                {(!isGroupCollapsed || sidebarCollapsed) && group.items.map(item => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      data-sidebar-active={active ? 'true' : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: sidebarCollapsed ? '0.6rem' : '0.55rem 0.75rem 0.55rem 1.25rem',
                        borderRadius: '8px', textDecoration: 'none',
                        background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                        color: active ? '#D4AF37' : 'rgba(255,255,255,0.55)',
                        fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                        transition: 'all 0.2s',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        borderLeft: active && !sidebarCollapsed ? '3px solid #D4AF37' : '3px solid transparent',
                      }}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <i className={`fas ${item.icon}`} style={{
                        width: '16px', textAlign: 'center', fontSize: '0.75rem',
                        opacity: active ? 1 : 0.6,
                      }}></i>
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div style={{
            padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)',
          }}>
            <i className="fas fa-shield-alt" style={{ color: '#10b981', marginRight: '0.5rem' }}></i>
            Governance v3.0 — Production
          </div>
        )}
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{
        marginLeft: sidebarCollapsed ? '60px' : '270px',
        flex: 1,
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Top Bar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '0.75rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{guide.title}</h2>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{guide.tip}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Advanced Mode Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '2rem',
              border: '1px solid #e2e8f0', fontSize: '0.65rem', fontWeight: 700,
              color: advancedMode ? '#D4AF37' : '#94a3b8',
            }}>
              <i className={`fas ${advancedMode ? 'fa-terminal' : 'fa-user'}`}></i>
              {advancedMode ? 'ADV' : 'STD'}
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
              <i className="fas fa-bell" style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>
              <div style={{
                width: '32px', height: '32px', background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1a1a2e', fontWeight: 800, fontSize: '0.75rem',
              }}>A</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="animate-in" style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
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
