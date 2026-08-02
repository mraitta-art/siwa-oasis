'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [stats] = useState({
    businesses: { total: 47, active: 42, pending: 5, new_this_month: 8 },
    packages: { total: 234, pending_approval: 12, visible: 198, featured: 28 },
    offers: { total: 189, pending_approval: 8, active: 156 },
    discounts: { total: 95, pending_approval: 3, auto_apply: 42 },
    investments: { total: 34, pending_approval: 6, applications: 127 },
    sections: { total: 156, pending_approval: 5, featured: 31 },
    users: { total: 1200, new_this_month: 145 },
    revenue: { total_used: '$47,234', pending: '$8,920' },
  });

  const [pendingApprovals] = useState([
    { id: 1, type: '📦', item: 'Package: "Luxury Desert Tour"', business: 'Desert Tours Co', time: '30 mins ago' },
    { id: 2, type: '🎁', item: 'Offer: "Buy 2 Get 1 Free"', business: 'Restaurant Siwa', time: '2 hours ago' },
    { id: 3, type: '💵', item: 'Investment: "Resort Expansion"', business: 'Siwa Palace Hotel', time: '4 hours ago' },
    { id: 4, type: '📋', item: 'Section: "Team Gallery"', business: 'Desert Tours Co', time: '6 hours ago' },
    { id: 5, type: '💰', item: 'Discount: "Bulk Purchase"', business: 'Souk Marketplace', time: '1 day ago' },
  ]);

  const [lastUpdated, setLastUpdated] = useState('');
  const [deployStatus, setDeployStatus] = useState<{ running: boolean; lastDeploy?: { status: string; triggeredAt: string; durationMs?: number; commitHash?: string } | null } | null>(null);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
    // Fetch deploy status for the widget
    fetch('/api/admin/deployment/status')
      .then(r => r.json())
      .then(d => setDeployStatus(d))
      .catch(() => {});
  }, []);

  const adminSections = [
    {
      category: '📦 Inventory Management',
      items: [
        {
          icon: '📦',
          label: 'Packages',
          description: 'Approve & manage packages',
          badge: `${stats.packages.pending_approval} pending`,
          href: '/admin/packages',
          color: 'from-blue-900 to-blue-700',
        },
        {
          icon: '🎁',
          label: 'Offers',
          description: 'Review & feature offers',
          badge: `${stats.offers.pending_approval} pending`,
          href: '/admin/offers',
          color: 'from-green-900 to-green-700',
        },
        {
          icon: '💰',
          label: 'Discounts',
          description: 'Manage discount campaigns',
          badge: `${stats.discounts.pending_approval} pending`,
          href: '/admin/discounts',
          color: 'from-yellow-900 to-yellow-700',
        },
      ],
    },
    {
      category: '💵 Investment & Opportunities',
      items: [
        {
          icon: '💵',
          label: 'Investment Opps',
          description: 'Approve investment listings',
          badge: `${stats.investments.pending_approval} pending`,
          href: '/admin/investment-opportunities',
          color: 'from-purple-900 to-purple-700',
        },
      ],
    },
    {
      category: '🌐 Content Management',
      items: [
        {
          icon: '📋',
          label: 'Section Visibility',
          description: 'Control minisite & main site',
          badge: `${stats.sections.pending_approval} pending`,
          href: '/admin/section-visibility',
          color: 'from-pink-900 to-pink-700',
        },
        {
          icon: '💡',
          label: 'Field Requests',
          description: 'Review custom vendor field suggestions',
          badge: 'Suggest System',
          href: '/admin/field-requests',
          color: 'from-amber-900 to-amber-700',
        },
      ],
    },
    {
      category: '🌐 Public Marketplace',
      items: [
        {
          icon: '🌍',
          label: 'Offers & Packages',
          description: 'Preview the live offers and packages page',
          badge: 'Live page',
          href: '/offers',
          color: 'from-emerald-900 to-emerald-700',
        },
        {
          icon: '🏷️',
          label: 'Discounts',
          description: 'Preview the live discounts page',
          badge: 'Live page',
          href: '/discounts',
          color: 'from-yellow-900 to-yellow-700',
        },
        {
          icon: '💎',
          label: 'Investment Hub',
          description: 'Preview the live investment opportunities page',
          badge: 'Live page',
          href: '/investment-opportunities',
          color: 'from-purple-900 to-purple-700',
        },
      ],
    },
    {
      category: '🛡️ Governance & Tier Overrides',
      items: [
        {
          icon: '🛡️',
          label: 'Section Overrides',
          description: 'Grant vendors access to premium sections ("asked & excused")',
          badge: 'Override tiers',
          href: '/admin/section-overrides',
          color: 'from-amber-900 to-amber-700',
        },
        {
          icon: '📊',
          label: 'POI Settings',
          description: 'Global & vendor permissions',
          badge: 'Configure',
          href: '/admin/poi-settings',
          color: 'from-indigo-900 to-indigo-700',
        },
      ],
    },

    {
      category: '👥 Business & User Management',
      items: [
        {
          icon: '🏪',
          label: 'Businesses',
          description: 'Manage all vendor accounts',
          badge: `${stats.businesses.pending} pending`,
          href: '/admin/businesses',
          color: 'from-red-900 to-red-700',
        },
        {
          icon: '👤',
          label: 'Users',
          description: 'Manage user accounts',
          badge: `${stats.users.new_this_month} new`,
          href: '/admin/users',
          color: 'from-cyan-900 to-cyan-700',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 font-sans">
      {/* Header */}
      <div className="border-b border-amber-100 bg-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="text-[#D4AF37]">⚙️</span> Admin Control Center
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">Manage businesses, approvals, and platform settings from a clean admin workspace.</p>
          </div>
          <Link href="/jana" className="inline-flex items-center gap-2 self-start md:self-center px-5 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 transition font-bold text-sm">
            ← Return to Jana
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Businesses</div>
            <div className="text-3xl font-black text-slate-800 mt-2">{stats.businesses.total}</div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="text-sm font-bold text-rose-400 uppercase tracking-wider">Pending Approvals</div>
            <div className="text-3xl font-black text-rose-600 mt-2">{stats.businesses.pending}</div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Packages</div>
            <div className="text-3xl font-black text-slate-800 mt-2">{stats.packages.total}</div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Platform Revenue</div>
            <div className="text-3xl font-black text-[#D4AF37] mt-2">{stats.revenue.total_used}</div>
          </div>
        </div>

        {/* Action Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase">Package Queue</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{stats.packages.pending_approval} pending</div>
          </div>
          <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase">Offers Queue</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{stats.offers.pending_approval} pending</div>
          </div>
          <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase">New Users</div>
            <div className="mt-1 text-lg font-bold text-slate-800">+{stats.users.new_this_month}</div>
          </div>
          <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase">Investments</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{stats.investments.pending_approval} pending</div>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingApprovals.length > 0 && (
          <div className="mb-12 rounded-3xl bg-amber-50/40 border border-amber-200/60 p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">⏳ Approvals Pending Action ({pendingApprovals.length})</h2>
                <p className="mt-1 text-sm text-slate-500">These items require administrative verification before appearing publicly.</p>
              </div>
              <button className="rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition">
                Process Approvals
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-start gap-4">
                  <span className="text-2xl bg-amber-50 p-2.5 rounded-xl">{item.type}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{item.item}</div>
                    <div className="text-xs text-slate-400 mt-1 font-semibold">{item.business} • {item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Management Sections */}
        {adminSections.map((section, idx) => (
          <div key={idx} className="mb-12">
            <h2 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">{section.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} className="group">
                  <div className="h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-amber-200">
                    <div>
                      <div className={`inline-flex rounded-xl bg-amber-50 p-3 text-lg font-bold text-[#D4AF37]`}>
                        {item.icon}
                      </div>
                      <h3 className="mt-5 text-lg font-extrabold text-slate-800 group-hover:text-[#D4AF37] transition">{item.label}</h3>
                      <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-400">{item.description}</p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-400">{item.badge}</span>
                      <span className="text-[#D4AF37] transition group-hover:underline">Open Drawer →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* ── Deployment Control Center Widget ── */}
        <div className="mb-8 rounded-3xl overflow-hidden border border-slate-200 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f0c29ee, #302b63ee)' }}>
          <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
            {/* Status Ring */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: deployStatus?.running ? 'radial-gradient(circle, #f59e0b55, #f59e0b11)' : deployStatus?.lastDeploy?.status === 'failed' ? 'radial-gradient(circle, #ef444455, #ef444411)' : 'radial-gradient(circle, #22c55e55, #22c55e11)', border: `3px solid ${deployStatus?.running ? '#f59e0b' : deployStatus?.lastDeploy?.status === 'failed' ? '#ef4444' : '#22c55e'}`, boxShadow: `0 0 18px ${deployStatus?.running ? '#f59e0b44' : deployStatus?.lastDeploy?.status === 'failed' ? '#ef444444' : '#22c55e44'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {deployStatus?.running ? '⚙️' : deployStatus?.lastDeploy?.status === 'failed' ? '❌' : '🚀'}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>🚀 Deployment Control Center</h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                {deployStatus?.running ? '⚙️ Deployment in progress…' :
                  deployStatus?.lastDeploy ? `Last deploy: ${deployStatus.lastDeploy.status === 'success' ? '✅ Success' : '❌ Failed'} · ${deployStatus.lastDeploy.triggeredAt ? new Date(deployStatus.lastDeploy.triggeredAt).toLocaleString() : ''}` :
                  'No deployments recorded yet. Click to start your first deploy.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/admin/deployment" style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Open Control Center →</Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-3xl border border-amber-100 bg-[#fffdfb] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">⚡ System Shortcuts</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Fast access to global parameters and logs.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/jana/data-manager" className="rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-850 transition">Data Manager</Link>
              <Link href="/jana/diagnostic" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">System Diagnostics</Link>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-slate-400 text-xs font-semibold">
          <p>Control center last updated: {lastUpdated || 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}
