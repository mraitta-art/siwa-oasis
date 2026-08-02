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
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200/50';
      case 'inactive':
        return 'bg-slate-50 text-slate-400 border border-slate-200/50';
      case 'draft':
        return 'bg-amber-50 text-amber-600 border border-amber-200/50';
      default:
        return 'bg-slate-50 text-slate-400';
    }
  };

  const getApprovalColor = (approval: string) => {
    switch (approval) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200/50';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border border-amber-200/50';
      case 'rejected':
        return 'bg-rose-50 text-rose-600 border border-rose-200/50';
      default:
        return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <Link href="/admin" className="text-slate-400 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition-colors mb-4 block">
            ← Control Center
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                <span className="text-[#D4AF37]">📦</span> Packages Manager
              </h1>
              <p className="text-slate-500 text-sm">Approve and edit product bundles and service packages</p>
            </div>
            <Link href="/packages" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 transition font-bold text-xs uppercase tracking-wider">
              View live packages page
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold rounded-2xl transition shadow-sm"
          >
            + New Package
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-auto">
            Showing {filteredPackages.length} of {packages.length}
          </div>
        </div>

        {/* Packages Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm mb-12">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Package Name</th>
                  <th className="px-6 py-4 text-left">Business</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Price</th>
                  <th className="px-6 py-4 text-left">Savings</th>
                  <th className="px-6 py-4 text-left">Sales</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Approval</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-slate-800 font-extrabold">{pkg.package_name}</div>
                        <div className="text-xs text-slate-400 font-semibold mt-1">Expires: {pkg.valid_until}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{pkg.business_name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg font-bold text-slate-500 uppercase tracking-wider">
                        {pkg.package_type === 'service_package' ? '⚙️ Service' : '📦 ' + pkg.package_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-black">${pkg.package_price}</div>
                      <div className="text-xs text-slate-400 font-semibold line-through mt-0.5">${pkg.base_price}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#D4AF37] font-black">{pkg.savings_percentage}%</div>
                      <div className="text-xs text-slate-400 font-semibold mt-0.5">${pkg.base_price - pkg.package_price} off</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      <div>{pkg.quantity_sold} sold</div>
                      <div className="text-xs text-slate-400 font-semibold mt-0.5">of {pkg.quantity_available}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(pkg.status)}`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getApprovalColor(pkg.approval_status)}`}>
                        {pkg.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition">
                          ✏️ Edit
                        </button>
                        {pkg.approval_status === 'pending' && (
                          <>
                            <button className="px-3 py-1.5 text-xs bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold transition">
                              ✓ Approve
                            </button>
                            <button className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <button className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">{packages.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Packages</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 mb-1">
              {packages.filter((p) => p.status === 'active').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-amber-600 mb-1">
              {packages.filter((p) => p.approval_status === 'pending').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">
              {packages.reduce((sum, p) => sum + p.quantity_sold, 0)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units Sold</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Create New Package</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Package Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Desert Safari Premium"
                    className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Package Type</label>
                  <select className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white">
                    <option>Bundle</option>
                    <option>Service Package</option>
                    <option>Tier</option>
                    <option>Combo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Base Price (USD)</label>
                    <input
                      type="number"
                      placeholder="250"
                      className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Package Price (USD)</label>
                    <input
                      type="number"
                      placeholder="180"
                      className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    placeholder="Describe what's included in this package"
                    className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button className="px-6 py-2.5 bg-[#D4AF37] hover:bg-amber-600 rounded-2xl text-white font-bold transition">
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
