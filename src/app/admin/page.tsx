'use client';

import Link from 'next/link';
import { useState } from 'react';

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
          icon: '🏠',
          label: 'Homepages',
          description: 'Manage independent homepages',
          badge: 'Create & edit',
          href: '/admin/homepages-manager',
          color: 'from-orange-900 to-orange-700',
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#556B2F] to-[#D4AF37] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            ⚙️ Admin Control Center
          </h1>
          <p className="text-white/90">Manage all businesses, approvals, and platform settings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-[#D4AF37]">{stats.businesses.total}</div>
            <div className="text-xs text-gray-400">Businesses</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-red-400">{stats.businesses.pending}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-[#D4AF37]">{stats.packages.total}</div>
            <div className="text-xs text-gray-400">Packages</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-red-400">{stats.packages.pending_approval}</div>
            <div className="text-xs text-gray-400">Approvals</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-[#D4AF37]">{stats.offers.total}</div>
            <div className="text-xs text-gray-400">Offers</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-[#D4AF37]">{stats.investments.total}</div>
            <div className="text-xs text-gray-400">Investments</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-[#D4AF37]">{stats.users.total}</div>
            <div className="text-xs text-gray-400">Users</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-green-400">{stats.revenue.total_used}</div>
            <div className="text-xs text-gray-400">Discounts Used</div>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingApprovals.length > 0 && (
          <div className="mb-12 bg-yellow-900/30 border border-yellow-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-200 mb-4">
              ⏳ {pendingApprovals.length} Items Awaiting Approval
            </h2>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.type}</span>
                    <div>
                      <p className="text-sm text-white font-semibold">{item.item}</p>
                      <p className="text-xs text-gray-400">{item.business} • {item.time}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-xs bg-[#556B2F] hover:opacity-90 rounded text-white font-semibold">
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Management Sections */}
        {adminSections.map((section, idx) => (
          <div key={idx} className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">{section.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`bg-gradient-to-br ${item.color} p-1 rounded-lg cursor-pointer hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all`}>
                    <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="text-4xl mb-3">{item.icon}</div>
                        <h3 className="text-lg font-bold text-white mb-1">{item.label}</h3>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-white bg-gray-800 px-2 py-1 rounded font-semibold">{item.badge}</span>
                        <span className="text-[#D4AF37]">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">⚡ Quick Actions</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-2 bg-white text-[#556B2F] rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Review Pending Items
            </button>
            <button className="px-6 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors">
              View Reports
            </button>
            <button className="px-6 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors">
              System Settings
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
