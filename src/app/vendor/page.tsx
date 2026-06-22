'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function VendorDashboardPage() {
  const [stats] = useState({
    packages: { total: 12, active: 10, pending: 2, sold: 145 },
    offers: { total: 8, active: 6, pending: 2, used: 324 },
    discounts: { total: 5, active: 4, pending: 1, used: 89 },
    investments: { total: 3, active: 2, pending: 1, inquiries: 27 },
    sections: { total: 6, visible: 5, pending: 1 },
  });

  const [recentActivity] = useState([
    { id: 1, type: 'offer', message: 'New offer "50% Off" approved', time: '2 hours ago', status: '✅' },
    { id: 2, type: 'inquiry', message: 'New inquiry on Winter Package', time: '4 hours ago', status: '💬' },
    { id: 3, type: 'investment', message: 'New investor application received', time: '1 day ago', status: '📊' },
    { id: 4, type: 'section', message: 'Gallery section now featured', time: '2 days ago', status: '⭐' },
    { id: 5, type: 'package', message: 'Package "3-Night Stay" visible on main site', time: '3 days ago', status: '👁️' },
  ]);

  const dashboardItems = [
    {
      icon: '📦',
      label: 'Packages',
      description: 'Manage product bundles & deals',
      stats: `${stats.packages.active}/${stats.packages.total} active`,
      href: '/vendor/packages',
      color: 'from-blue-900 to-blue-700',
    },
    {
      icon: '🎁',
      label: 'Offers',
      description: 'Create & manage promotions',
      stats: `${stats.offers.active}/${stats.offers.total} active`,
      href: '/vendor/offers',
      color: 'from-green-900 to-green-700',
    },
    {
      icon: '💰',
      label: 'Discounts',
      description: 'Set up discount campaigns',
      stats: `${stats.discounts.active}/${stats.discounts.total} active`,
      href: '/vendor/discounts',
      color: 'from-yellow-900 to-yellow-700',
    },
    {
      icon: '💵',
      label: 'Investments',
      description: 'Manage investment opportunities',
      stats: `${stats.investments.inquiries} inquiries`,
      href: '/vendor/investment-opportunities',
      color: 'from-purple-900 to-purple-700',
    },
    {
      icon: '📋',
      label: 'Sections',
      description: 'Manage minisite sections',
      stats: `${stats.sections.visible} visible`,
      href: '/vendor/sections',
      color: 'from-pink-900 to-pink-700',
    },
    {
      icon: '⚙️',
      label: 'Settings',
      description: 'Profile & preferences',
      stats: 'Configure',
      href: '/vendor/settings',
      color: 'from-gray-900 to-gray-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#556B2F] to-[#D4AF37] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            🏪 Vendor Dashboard
          </h1>
          <p className="text-white/90">Manage your business, content, and offerings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#D4AF37]">{stats.packages.total}</div>
            <div className="text-xs text-gray-400">Packages</div>
            <div className="text-xs text-green-400 mt-1">{stats.packages.active} active</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#D4AF37]">{stats.offers.total}</div>
            <div className="text-xs text-gray-400">Offers</div>
            <div className="text-xs text-green-400 mt-1">{stats.offers.active} active</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#D4AF37]">{stats.discounts.total}</div>
            <div className="text-xs text-gray-400">Discounts</div>
            <div className="text-xs text-green-400 mt-1">{stats.discounts.active} active</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#D4AF37]">{stats.investments.inquiries}</div>
            <div className="text-xs text-gray-400">Inquiries</div>
            <div className="text-xs text-green-400 mt-1">{stats.investments.total} investments</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#D4AF37]">{stats.sections.visible}</div>
            <div className="text-xs text-gray-400">Sections</div>
            <div className="text-xs text-green-400 mt-1">On minisite</div>
          </div>
        </div>

        {/* Main Management Grid */}
        <h2 className="text-2xl font-bold text-white mb-6">📊 Management Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {dashboardItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`bg-gradient-to-br ${item.color} p-1 rounded-lg cursor-pointer hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all`}>
                <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.label}</h3>
                    <p className="text-sm text-gray-400 mb-4">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{item.stats}</span>
                    <span className="text-[#D4AF37]">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">📈 Recent Activity</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {recentActivity.map((activity, idx) => (
              <div
                key={activity.id}
                className={`px-6 py-4 ${idx !== recentActivity.length - 1 ? 'border-b border-gray-800' : ''} hover:bg-gray-800 transition-colors`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{activity.status}</span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Grow?</h2>
          <p className="text-white/90 mb-6">Create new offerings and expand your reach</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/vendor/packages"
              className="px-6 py-2 bg-white text-[#556B2F] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              + New Package
            </Link>
            <Link
              href="/vendor/offers"
              className="px-6 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              + New Offer
            </Link>
            <Link
              href="/vendor/investment-opportunities"
              className="px-6 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              + New Investment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
