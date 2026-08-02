'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/* ─── Types ─────────────────────────────────────────────── */
interface StatCard { label: string; value: string | number; sub?: string; color: string; icon: string; }
interface NavGroup { title: string; items: { label: string; icon: string; href: string; badge?: string; badgeColor?: string }[] }

/* ─── Sidebar nav groups ─────────────────────────────────── */
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: '🏠', href: '/admin' },
      { label: 'Analytics', icon: '📊', href: '/admin/analytics' },
      { label: 'Deployment', icon: '🚀', href: '/admin/deployment', badge: 'LIVE', badgeColor: '#22c55e' },
    ],
  },
  {
    title: 'Approvals',
    items: [
      { label: 'Packages', icon: '📦', href: '/admin/packages', badge: '12', badgeColor: '#f59e0b' },
      { label: 'Offers', icon: '🎁', href: '/admin/offers', badge: '8', badgeColor: '#f59e0b' },
      { label: 'Discounts', icon: '💰', href: '/admin/discounts', badge: '3', badgeColor: '#f59e0b' },
      { label: 'Investment Ops', icon: '💵', href: '/admin/investment-opportunities', badge: '6', badgeColor: '#f59e0b' },
      { label: 'Field Requests', icon: '💡', href: '/admin/field-requests' },
      { label: 'Submissions', icon: '📥', href: '/admin/submissions' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Section Visibility', icon: '👁️', href: '/admin/section-visibility' },
      { label: 'Section Overrides', icon: '🛡️', href: '/admin/section-overrides' },
      { label: 'Blog Approval', icon: '📝', href: '/admin/blog-approval' },
      { label: 'Image Curation', icon: '🖼️', href: '/admin/image-curation' },
      { label: 'Homepage Editor', icon: '🏗️', href: '/admin/homepage-editor' },
      { label: 'Homepage Sections', icon: '📄', href: '/admin/homepage-sections' },
    ],
  },
  {
    title: 'Journeys',
    items: [
      { label: 'Journey Requests', icon: '🗺️', href: '/admin/journey-requests', badge: 'NEW', badgeColor: '#6366f1' },
      { label: 'Journey Config', icon: '⚙️', href: '/admin/journey-config' },
      { label: 'Journey Policies', icon: '📋', href: '/admin/journey-policies' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Businesses', icon: '🏪', href: '/admin/sections' },
      { label: 'POI Settings', icon: '📍', href: '/admin/poi-settings' },
      { label: 'Vendor Comms', icon: '💬', href: '/admin/vendor-communication' },
      { label: 'Visitor Merge', icon: '🔀', href: '/admin/visitor-merge' },
    ],
  },
];

const GOLD  = '#D4AF37';
const GOLD2 = '#f0c842';

export default function AdminDashboardPage() {
  const [deployStatus, setDeployStatus] = useState<{
    running: boolean;
    lastDeploy?: { status: string; triggeredAt: string; commitHash?: string } | null;
  } | null>(null);
  const [activePath, setActivePath] = useState('/admin');
  const [now, setNow] = useState('');

  useEffect(() => {
    setNow(new Date().toLocaleString());
    setActivePath(window.location.pathname);
    fetch('/api/admin/deployment/status')
      .then(r => r.json())
      .then(d => setDeployStatus(d))
      .catch(() => {});
  }, []);

  const stats: StatCard[] = [
    { label: 'Total Businesses',  value: 47,        sub: '+8 this month',      color: GOLD,      icon: '🏪' },
    { label: 'Pending Approvals', value: 34,        sub: 'Across all queues',  color: '#f59e0b', icon: '⏳' },
    { label: 'Active Packages',   value: 198,       sub: '12 awaiting review', color: '#6366f1', icon: '📦' },
    { label: 'New Users',         value: 145,       sub: 'This month',         color: '#22c55e', icon: '👥' },
    { label: 'Platform Revenue',  value: '$47,234', sub: '$8,920 pending',     color: GOLD2,     icon: '💳' },
    { label: 'Journey Requests',  value: 23,        sub: '5 unread today',     color: '#ec4899', icon: '🗺️' },
    { label: 'Active Offers',     value: 156,       sub: '8 awaiting review',  color: '#14b8a6', icon: '🎁' },
    { label: 'Investment Opps',   value: 34,        sub: '6 pending approval', color: '#8b5cf6', icon: '💵' },
  ];

  const pendingItems = [
    { id: 1, icon: '📦', title: 'Package: "Luxury Desert Tour"',  business: 'Desert Tours Co',   time: '30 min ago', href: '/admin/packages',                 urgency: 'high' },
    { id: 2, icon: '🎁', title: 'Offer: "Buy 2 Get 1 Free"',      business: 'Restaurant Siwa',   time: '2 hrs ago',  href: '/admin/offers',                   urgency: 'high' },
    { id: 3, icon: '💵', title: 'Investment: "Resort Expansion"', business: 'Siwa Palace Hotel', time: '4 hrs ago',  href: '/admin/investment-opportunities', urgency: 'med'  },
    { id: 4, icon: '📋', title: 'Section: "Team Gallery"',        business: 'Desert Tours Co',   time: '6 hrs ago',  href: '/admin/section-visibility',       urgency: 'med'  },
    { id: 5, icon: '💰', title: 'Discount: "Bulk Purchase"',      business: 'Souk Marketplace',  time: '1 day ago',  href: '/admin/discounts',                urgency: 'low'  },
    { id: 6, icon: '💡', title: 'Field Request: "Opening Hours"', business: 'Shali Eco Lodge',   time: '2 days ago', href: '/admin/field-requests',           urgency: 'low'  },
  ];

  const quickLaunch = [
    { icon: '📊', label: 'Analytics',        href: '/admin/analytics',            color: '#6366f1' },
    { icon: '🗺️', label: 'Journey Requests', href: '/admin/journey-requests',     color: '#ec4899' },
    { icon: '👁️', label: 'Visibility',       href: '/admin/section-visibility',   color: '#14b8a6' },
    { icon: '🏗️', label: 'HP Editor',        href: '/admin/homepage-editor',      color: '#f59e0b' },
    { icon: '🔀', label: 'Visitor Merge',    href: '/admin/visitor-merge',        color: '#8b5cf6' },
    { icon: '💬', label: 'Vendor Comms',     href: '/admin/vendor-communication', color: '#22c55e' },
    { icon: '🖼️', label: 'Images',           href: '/admin/image-curation',       color: '#f97316' },
    { icon: '🚀', label: 'Deployment',       href: '/admin/deployment',           color: '#0ea5e9' },
  ];

  const deployOK    = !deployStatus?.running && deployStatus?.lastDeploy?.status !== 'failed';
  const deployColor = deployStatus?.running
    ? '#f59e0b'
    : deployStatus?.lastDeploy?.status === 'failed' ? '#ef4444' : '#22c55e';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080b14', fontFamily: '"Inter","Segoe UI",sans-serif', color: '#e2e8f0' }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'linear-gradient(180deg,#0d1117 0%,#0f1923 100%)',
        borderRight: '1px solid rgba(212,175,55,0.12)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#3d2800', flexShrink: 0, boxShadow: `0 0 20px ${GOLD}44` }}>⚙️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.75rem', color: '#f8fafc', letterSpacing: 2 }}>ADMIN</div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, letterSpacing: 1 }}>CONTROL CENTER</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.title} style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#475569', letterSpacing: '2px', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.4rem' }}>
                {group.title}
              </div>
              {group.items.map(item => {
                const isActive = activePath === item.href;
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.5rem 0.75rem', borderRadius: 10, textDecoration: 'none', marginBottom: '0.1rem',
                    background: isActive ? `linear-gradient(90deg,${GOLD}22,transparent)` : 'transparent',
                    border: isActive ? `1px solid ${GOLD}33` : '1px solid transparent',
                    color: isActive ? GOLD : '#94a3b8',
                    fontSize: '0.78rem', fontWeight: isActive ? 800 : 500, transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ background: item.badgeColor ?? '#475569', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '0.5rem', fontWeight: 900 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <Link href="/jana" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>
            ← Back to Jana CMS
          </Link>
        </div>
      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(8,11,20,0.88)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
          padding: '0 2rem', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: 1 }}>Admin Dashboard</h1>
            <span style={{ fontSize: '0.58rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '2px 10px', fontWeight: 900, letterSpacing: '1px' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700 }}>{now}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${deployColor}44`, borderRadius: 20, padding: '4px 12px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: deployColor, boxShadow: `0 0 8px ${deployColor}`, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: '0.58rem', fontWeight: 900, color: deployColor }}>
                {deployStatus?.running ? 'DEPLOYING' : deployStatus?.lastDeploy?.status === 'failed' ? 'FAILED' : 'DEPLOYED'}
              </span>
            </div>
            <Link href="/admin/deployment" style={{ padding: '6px 14px', background: `linear-gradient(135deg,${GOLD},${GOLD2})`, borderRadius: 8, color: '#3d2800', fontWeight: 800, fontSize: '0.7rem', textDecoration: 'none' }}>
              🚀 Deploy
            </Link>
          </div>
        </header>

        <div style={{ padding: '2rem', flex: 1 }}>

          {/* Welcome strip */}
          <div style={{ marginBottom: '2rem', background: 'linear-gradient(135deg,rgba(212,175,55,0.08),rgba(99,102,241,0.06))', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 20, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px' }}>Good {greeting}, Admin 👋</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 600 }}>Siwa Oasis Platform · {pendingItems.length} items awaiting your action today</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/admin/journey-requests" style={{ padding: '0.6rem 1.25rem', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 10, color: '#f472b6', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none' }}>🗺️ Journey Requests</Link>
              <Link href="/admin/analytics"        style={{ padding: '0.6rem 1.25rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: '#818cf8', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none' }}>📊 Analytics</Link>
            </div>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s,border-color 0.2s', cursor: 'default' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.borderColor = `${s.color}44`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 64, height: 64, background: `radial-gradient(circle,${s.color}22,transparent)`, pointerEvents: 'none' }} />
                <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.35rem' }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '0.25rem', fontWeight: 600 }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Approvals + Quick Launch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>

            {/* Approval inbox */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9' }}>⏳ Approval Inbox</div>
                  <div style={{ fontSize: '0.63rem', color: '#475569', marginTop: '0.15rem', fontWeight: 600 }}>Items requiring your review</div>
                </div>
                <span style={{ background: '#f59e0b', color: '#3d2800', borderRadius: 20, padding: '3px 10px', fontSize: '0.63rem', fontWeight: 900 }}>{pendingItems.length} pending</span>
              </div>
              {pendingItems.map((item, i) => (
                <Link key={item.id} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: i < pendingItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: item.urgency === 'high' ? 'rgba(245,158,11,0.12)' : item.urgency === 'med' ? 'rgba(99,102,241,0.12)' : 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 600, marginTop: '0.2rem' }}>{item.business} · {item.time}</div>
                  </div>
                  <div style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: item.urgency === 'high' ? '#f59e0b' : item.urgency === 'med' ? '#6366f1' : '#334155', boxShadow: item.urgency === 'high' ? '0 0 8px #f59e0b' : 'none' }} />
                </Link>
              ))}
            </div>

            {/* Quick launch */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9' }}>⚡ Quick Launch</div>
                <div style={{ fontSize: '0.63rem', color: '#475569', marginTop: '0.15rem', fontWeight: 600 }}>Fast access to key tools</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', padding: '1.25rem' }}>
                {quickLaunch.map((q, i) => (
                  <Link key={i} href={q.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', borderRadius: 14, border: `1px solid ${q.color}22`, background: `${q.color}0d`, textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `${q.color}20`; el.style.borderColor = `${q.color}55`; el.style.transform = 'scale(1.04)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `${q.color}0d`; el.style.borderColor = `${q.color}22`; el.style.transform = 'scale(1)'; }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{q.icon}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: q.color, textAlign: 'center', letterSpacing: '0.5px' }}>{q.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* All management areas */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#475569', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>All Management Areas</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '0.85rem' }}>
              {NAV_GROUPS.slice(1).flatMap(g => g.items).map((item, i) => (
                <Link key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1.2rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, textDecoration: 'none', color: '#94a3b8', transition: 'all 0.18s', fontSize: '0.8rem', fontWeight: 600 }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(212,175,55,0.08)'; el.style.borderColor = 'rgba(212,175,55,0.25)'; el.style.color = GOLD; el.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(255,255,255,0.025)'; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.color = '#94a3b8'; el.style.transform = 'translateX(0)'; }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: item.badgeColor ?? '#334155', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.5rem', fontWeight: 900 }}>{item.badge}</span>
                  )}
                  <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>›</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Deployment banner */}
          <div style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg,#0f0c29,#1e1b4b)', border: `1px solid ${deployColor}33`, borderRadius: 20, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: `radial-gradient(circle,${deployColor}33,transparent)`, border: `2.5px solid ${deployColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, boxShadow: `0 0 20px ${deployColor}44` }}>
              {deployStatus?.running ? '⚙️' : deployOK ? '✅' : '❌'}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9' }}>🚀 Deployment Status</div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.3rem', fontWeight: 600 }}>
                {deployStatus?.running ? '⚙️ Deployment in progress…'
                  : deployStatus?.lastDeploy
                    ? `Last deploy: ${deployStatus.lastDeploy.status === 'success' ? '✅ Succeeded' : '❌ Failed'} · ${deployStatus.lastDeploy.triggeredAt ? new Date(deployStatus.lastDeploy.triggeredAt).toLocaleString() : ''}`
                    : 'No deployments recorded yet.'}
              </div>
            </div>
            <Link href="/admin/deployment" style={{ padding: '0.65rem 1.5rem', background: `linear-gradient(135deg,${GOLD},${GOLD2})`, borderRadius: 10, color: '#3d2800', fontWeight: 800, fontSize: '0.78rem', textDecoration: 'none', flexShrink: 0, boxShadow: `0 4px 20px ${GOLD}33` }}>
              Open Control Center →
            </Link>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', color: '#1e293b', fontSize: '0.62rem', fontWeight: 600, paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            Siwa Oasis Admin · Control Center · Last loaded {now || '…'}
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
