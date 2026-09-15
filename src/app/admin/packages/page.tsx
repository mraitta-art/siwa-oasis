'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Package {
  id: string;
  package_name: string;
  business_type: 'accommodation' | 'tour' | 'transport' | 'restaurant' | 'activity' | 'all';
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

const initialPackages: Package[] = [
  {
    id: '1',
    package_name: 'Desert Safari Premium',
    business_type: 'tour',
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
    business_type: 'accommodation',
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
    business_type: 'restaurant',
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
];

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
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
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'draft':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getApprovalColor = (approval: string) => {
    switch (approval) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const activeCount = packages.filter((p) => p.status === 'active').length;
  const pendingCount = packages.filter((p) => p.approval_status === 'pending').length;
  const totalUnitsSold = packages.reduce((sum, p) => sum + p.quantity_sold, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf8,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-700 p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-amber-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_35%,#111827_100%)] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href="/admin" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 transition hover:text-[#f5d56a]">
              ← Control Center
            </Link>
            <Link href="/packages" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#f5d56a] transition hover:bg-white/10">
              View live page
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#f5d56a]">
                Product & Offers / Package System
              </p>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5d56a]/15 text-2xl shadow-inner shadow-[#f5d56a]/20">📦</span>
                <h1 className="text-3xl font-black text-white sm:text-4xl">Packages Manager</h1>
              </div>
            </div>

            <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-2xl bg-[#f5d56a] px-5 py-3 text-sm font-black text-slate-900 shadow-[0_12px_24px_rgba(245,213,106,0.3)] transition hover:bg-[#f1c94b]"
              >
                + New Package
              </button>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Packages</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-[#A87C00]">{packages.length}</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{packages.length}</div>
            <div className="mt-2 text-xs text-slate-400">Live collection</div>
          </div>

          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Active</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{activeCount}</span>
            </div>
            <div className="text-3xl font-black text-emerald-600">{activeCount}</div>
            <div className="mt-2 text-xs text-slate-400">Visible to visitors</div>
          </div>

          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Pending</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{pendingCount}</span>
            </div>
            <div className="text-3xl font-black text-amber-600">{pendingCount}</div>
            <div className="mt-2 text-xs text-slate-400">Awaiting review</div>
          </div>

          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Sales</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">Live</span>
            </div>
            <div className="text-3xl font-black text-blue-600">{totalUnitsSold}</div>
            <div className="mt-2 text-xs text-slate-400">Total units sold</div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="ml-auto text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            Showing {filteredPackages.length} of {packages.length}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] mb-12">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Package Name</th>
                  <th className="px-6 py-4 text-left">Business Type</th>
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
                  <tr key={pkg.id} className="hover:bg-slate-50/60 transition-colors text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-slate-800 font-extrabold">{pkg.package_name}</div>
                        <div className="text-xs text-slate-400 font-semibold mt-1">Expires: {pkg.valid_until}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600 capitalize">{pkg.business_type}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{pkg.business_name}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-full font-black uppercase tracking-[0.12em] text-slate-600">
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
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getStatusColor(pkg.status)}`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getApprovalColor(pkg.approval_status)}`}>
                        {pkg.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1.5 text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition">
                          ✏️ Edit
                        </button>
                        {pkg.approval_status === 'pending' && (
                          <>
                            <button className="px-3 py-1.5 text-[10px] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold transition">
                              ✓ Approve
                            </button>
                            <button className="px-3 py-1.5 text-[10px] bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <button className="px-3 py-1.5 text-[10px] bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
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

        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Create</p>
                  <h2 className="text-2xl font-black text-slate-900">New Package</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Package name</label>
                  <input
                    type="text"
                    placeholder="Desert Escape Bundle"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Business type</label>
                    <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white">
                      <option value="accommodation">Accommodation</option>
                      <option value="tour">Tour</option>
                      <option value="transport">Transportation</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="activity">Activity</option>
                      <option value="all">All Business Types</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Package type</label>
                    <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white">
                      <option value="bundle">Bundle</option>
                      <option value="service_package">Service Package</option>
                      <option value="combo">Combo</option>
                      <option value="tier">Tier</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Base price</label>
                    <input type="number" placeholder="250" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Offer price</label>
                    <input type="number" placeholder="180" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Business name</label>
                  <input type="text" placeholder="Desert Tours Co" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button className="rounded-2xl bg-[#D4AF37] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#c89a1b]">
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
