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

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">⚙️ Admin Control Center</h1>
          <p className="text-slate-600">Manage businesses, approvals, and platform settings from a clean admin workspace.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl font-semibold text-slate-900">{stats.businesses.total}</div>
            <div className="text-sm text-slate-500 mt-1">Businesses</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl font-semibold text-rose-600">{stats.businesses.pending}</div>
            <div className="text-sm text-slate-500 mt-1">Pending Approvals</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl font-semibold text-slate-900">{stats.packages.total}</div>
            <div className="text-sm text-slate-500 mt-1">Packages</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl font-semibold text-emerald-600">{stats.revenue.total_used}</div>
            <div className="text-sm text-slate-500 mt-1">Revenue Used</div>
          </div>
        </div>

        {/* Action Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          <div className="rounded-2xl bg-slate-100 p-5 border border-slate-200">
            <div className="text-sm text-slate-500">Package Approvals</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{stats.packages.pending_approval}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-5 border border-slate-200">
            <div className="text-sm text-slate-500">Offer Approvals</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{stats.offers.pending_approval}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-5 border border-slate-200">
            <div className="text-sm text-slate-500">New Users</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{stats.users.new_this_month}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-5 border border-slate-200">
            <div className="text-sm text-slate-500">Investments Pending</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{stats.investments.pending_approval}</div>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingApprovals.length > 0 && (
          <div className="mb-12 rounded-3xl bg-amber-50 border border-amber-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">⏳ {pendingApprovals.length} items need your review</h2>
                <p className="mt-1 text-sm text-slate-600">These approvals are waiting for action from the admin team.</p>
              </div>
              <button className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors">
                Review approvals
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {pendingApprovals.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{item.type}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.item}</div>
                      <div className="text-sm text-slate-500">{item.business} • {item.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Management Sections */}
        {adminSections.map((section, idx) => (
          <div key={idx} className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-5">{section.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} className="group">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className={`inline-flex rounded-2xl bg-gradient-to-r px-3 py-2 text-sm font-semibold text-white shadow-sm ${item.color}`}>
                      {item.icon}
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-900">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                    <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1">{item.badge}</span>
                      <span className="font-semibold text-slate-900 transition group-hover:text-emerald-600">View</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">⚡ Quick Actions</h2>
              <p className="mt-2 text-sm text-slate-600">Fast access to the most important admin tasks.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">Review Pending Items</button>
              <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition">View Reports</button>
              <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition">System Settings</button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Last updated: {lastUpdated || 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}
