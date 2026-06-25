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
  business_name: string;
  valid_until: string;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([
    {
      id: '1',
      package_name: 'Desert Safari Premium',
      package_type: 'bundle',
      base_price: 250,
      package_price: 180,
      savings_percentage: 28,
      status: 'active',
      is_featured: true,
      quantity_sold: 12,
      quantity_available: 50,
      approval_status: 'approved',
      business_name: 'Desert Tours Co',
      valid_until: '2026-12-31',
    },
    {
      id: '2',
      package_name: 'Luxury Hotel Weekend',
      package_type: 'service_package',
      base_price: 450,
      package_price: 380,
      savings_percentage: 16,
      status: 'active',
      is_featured: false,
      quantity_sold: 8,
      quantity_available: 100,
      approval_status: 'approved',
      business_name: 'Siwa Palace Hotel',
      valid_until: '2026-06-30',
    },
    {
      id: '3',
      package_name: 'Gourmet Dining Experience',
      package_type: 'combo',
      base_price: 150,
      package_price: 120,
      savings_percentage: 20,
      status: 'draft',
      is_featured: false,
      quantity_sold: 0,
      quantity_available: 200,
      approval_status: 'pending',
      business_name: 'Restaurant Siwa',
      valid_until: '2026-08-15',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredPackages = packages.filter((pkg) => {
    if (filterStatus !== 'all' && pkg.status !== filterStatus) return false;
    if (filterApproval !== 'all' && pkg.approval_status !== filterApproval) return false;
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
          <Link href="/admin" className="text-gray-400 hover:text-[#D4AF37] transition-colors mb-4 block">
            ← Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">📦 Packages Manager</h1>
          <p className="text-gray-400">Manage product bundles and service packages</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            + New Package
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

          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="text-gray-400 text-sm ml-auto">
            Showing {filteredPackages.length} of {packages.length}
          </div>
        </div>

        {/* Packages Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Package Name</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Business</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Price</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Savings</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Sales</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Approval</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-gray-900 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-white font-semibold">{pkg.package_name}</div>
                      <div className="text-xs text-gray-500">Expires: {pkg.valid_until}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{pkg.business_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm px-2 py-1 bg-gray-800 rounded text-gray-300">
                      {pkg.package_type === 'service_package' ? '⚙️ Service' : '📦 ' + pkg.package_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-semibold">${pkg.package_price}</div>
                    <div className="text-xs text-gray-500 line-through">${pkg.base_price}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[#D4AF37] font-bold">{pkg.savings_percentage}%</div>
                    <div className="text-xs text-gray-500">${pkg.base_price - pkg.package_price}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white">{pkg.quantity_sold}</div>
                    <div className="text-xs text-gray-500">of {pkg.quantity_available}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(pkg.status)}`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getApprovalColor(pkg.approval_status)}`}>
                      {pkg.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-[#556B2F] hover:opacity-90 rounded text-white transition-opacity">
                        ✏️ Edit
                      </button>
                      {pkg.approval_status === 'pending' && (
                        <>
                          <button className="px-3 py-1 text-xs bg-green-900 hover:bg-green-800 rounded text-green-200 transition-colors">
                            ✓ Approve
                          </button>
                          <button className="px-3 py-1 text-xs bg-red-900 hover:bg-red-800 rounded text-red-200 transition-colors">
                            ✕ Reject
                          </button>
                        </>
                      )}
                      <button className="px-3 py-1 text-xs bg-red-900 hover:bg-red-800 rounded text-red-200 transition-colors">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{packages.length}</div>
            <div className="text-gray-400">Total Packages</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {packages.filter((p) => p.status === 'active').length}
            </div>
            <div className="text-gray-400">Active</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {packages.filter((p) => p.approval_status === 'pending').length}
            </div>
            <div className="text-gray-400">Pending Approval</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">
              {packages.reduce((sum, p) => sum + p.quantity_sold, 0)}
            </div>
            <div className="text-gray-400">Total Sold</div>
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
                    placeholder="e.g., Desert Safari Premium"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Package Type</label>
                  <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                    <option>Bundle</option>
                    <option>Service Package</option>
                    <option>Tier</option>
                    <option>Combo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Base Price</label>
                    <input
                      type="number"
                      placeholder="$250"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Package Price</label>
                    <input
                      type="number"
                      placeholder="$180"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                  <textarea
                    placeholder="Describe what's included in this package"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    rows={3}
                  />
                </div>
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
