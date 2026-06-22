'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Package {
  id: string;
  package_name: string;
  package_type: 'bundle' | 'tier' | 'service_package' | 'combo';
  base_price: number;
  package_price: number;
  savings_percentage: number;
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  quantity_sold: number;
  quantity_available: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  valid_until: string;
}

export default function VendorPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([
    {
      id: '1',
      package_name: 'Premium Safari - 3 Days',
      package_type: 'service_package',
      base_price: 350,
      package_price: 280,
      savings_percentage: 20,
      status: 'active',
      is_featured: true,
      quantity_sold: 12,
      quantity_available: 50,
      approval_status: 'approved',
      valid_until: '2026-12-31',
    },
    {
      id: '2',
      package_name: 'Comfort Hotel Bundle - 2 Nights',
      package_type: 'bundle',
      base_price: 200,
      package_price: 160,
      savings_percentage: 20,
      status: 'active',
      is_featured: false,
      quantity_sold: 8,
      quantity_available: 100,
      approval_status: 'approved',
      valid_until: '2026-08-31',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredPackages = packages.filter((pkg) => {
    if (filterStatus !== 'all' && pkg.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-200';
      case 'inactive':
        return 'bg-gray-800 text-gray-300';
      case 'draft':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  const getApprovalColor = (approval: string) => {
    switch (approval) {
      case 'approved':
        return 'bg-green-900 text-green-200';
      case 'pending':
        return 'bg-yellow-900 text-yellow-200';
      case 'rejected':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/vendor" className="text-gray-400 hover:text-[#D4AF37] transition-colors mb-4 block">
            ← Vendor Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">📦 My Packages</h1>
          <p className="text-gray-400">Create and manage your product packages and bundles</p>
        </div>

        {/* Info Alert */}
        <div className="mb-6 p-4 bg-blue-900 border border-blue-800 rounded-lg">
          <div className="text-blue-200 text-sm">
            <strong>ℹ️ Admin Approval Required:</strong> Your packages require admin approval before going live.
            Check status below.
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            + Create Package
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="text-gray-400 text-sm ml-auto">
            Showing {filteredPackages.length} of {packages.length}
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {pkg.is_featured && (
                    <span className="inline-block px-2 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded mb-2">
                      ⭐ Featured
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-white mt-2 mb-1">{pkg.package_name}</h3>
                  <div className="text-sm text-gray-400 mb-3">
                    Type: <span className="text-gray-300 font-semibold">{pkg.package_type}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Original</div>
                    <div className="text-lg font-bold text-gray-400 line-through">${pkg.base_price}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Your Price</div>
                    <div className="text-lg font-bold text-[#D4AF37]">${pkg.package_price}</div>
                  </div>
                </div>
                <div className="text-center mt-2 text-green-400 font-semibold text-sm">
                  Save {pkg.savings_percentage}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <div className="text-gray-500">Sold</div>
                  <div className="text-white font-semibold">{pkg.quantity_sold}</div>
                </div>
                <div>
                  <div className="text-gray-500">Available</div>
                  <div className="text-white font-semibold">{pkg.quantity_available}</div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <span className={`flex-1 text-xs px-2 py-1 rounded font-semibold text-center ${getStatusColor(pkg.status)}`}>
                  {pkg.status}
                </span>
                <span className={`flex-1 text-xs px-2 py-1 rounded font-semibold text-center ${getApprovalColor(pkg.approval_status)}`}>
                  {pkg.approval_status}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-3 text-center">
                Expires: {pkg.valid_until}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-[#556B2F] hover:opacity-90 rounded text-white font-semibold transition-opacity">
                  ✏️ Edit
                </button>
                <button className="px-3 py-2 text-sm bg-red-900 hover:bg-red-800 rounded text-red-200 font-semibold transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{packages.length}</div>
            <div className="text-gray-400 text-sm">Total Packages</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {packages.filter((p) => p.status === 'active').length}
            </div>
            <div className="text-gray-400 text-sm">Active</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {packages.filter((p) => p.approval_status === 'pending').length}
            </div>
            <div className="text-gray-400 text-sm">Pending Approval</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">
              {packages.reduce((sum, p) => sum + p.quantity_sold, 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Sold</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Package</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Package Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Premium Safari - 3 Days"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Package Type</label>
                  <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                    <option>Service Package</option>
                    <option>Bundle</option>
                    <option>Tier</option>
                    <option>Combo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Original Price</label>
                    <input
                      type="number"
                      placeholder="350"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Package Price</label>
                    <input
                      type="number"
                      placeholder="280"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                  <textarea
                    placeholder="What's included in this package?"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Quantity Available</label>
                    <input
                      type="number"
                      placeholder="50"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Valid Until</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 p-3 bg-gray-800 rounded">
                  <input type="checkbox" className="w-4 h-4 accent-[#D4AF37]" />
                  <span className="text-white text-sm font-semibold">Feature on Homepage</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-gray-800 rounded text-white font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded text-white font-semibold hover:opacity-90 transition-opacity">
                  Create Package
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
