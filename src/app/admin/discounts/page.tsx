'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Discount {
  id: string;
  discount_name: string;
  discount_type: 'percent' | 'fixed' | 'tiered' | 'volume' | 'seasonal';
  discount_value: number;
  min_quantity?: number;
  max_quantity?: number;
  applicable_to: string;
  status: 'active' | 'inactive' | 'draft';
  is_automatic: boolean;
  usage_count: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  valid_until: string;
  coupon_code?: string;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([
    {
      id: '1',
      discount_name: 'Volume Discount - Hotels',
      discount_type: 'tiered',
      discount_value: 10,
      min_quantity: 5,
      max_quantity: 10,
      applicable_to: 'Hotels',
      status: 'active',
      is_automatic: true,
      usage_count: 156,
      approval_status: 'approved',
      valid_until: '2026-12-31',
    },
    {
      id: '2',
      discount_name: 'Early Bird Booking',
      discount_type: 'percent',
      discount_value: 15,
      applicable_to: 'All Services',
      status: 'active',
      is_automatic: false,
      usage_count: 89,
      approval_status: 'approved',
      valid_until: '2026-08-31',
      coupon_code: 'EARLY15',
    },
    {
      id: '3',
      discount_name: 'Seasonal Winter Sale',
      discount_type: 'seasonal',
      discount_value: 25,
      applicable_to: 'Tourism Services',
      status: 'draft',
      is_automatic: true,
      usage_count: 0,
      approval_status: 'pending',
      valid_until: '2026-01-31',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredDiscounts = discounts.filter((discount) => {
    if (filterStatus !== 'all' && discount.status !== filterStatus) return false;
    if (filterType !== 'all' && discount.discount_type !== filterType) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      percent: '💯',
      fixed: '💰',
      tiered: '📊',
      volume: '📦',
      seasonal: '🎄',
    };
    return icons[type] || '🏷️';
  };

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
                <span className="text-[#D4AF37]">💰</span> Discounts Manager
              </h1>
              <p className="text-slate-500 text-sm">Manage system-wide discounts and pricing rules</p>
            </div>
            <Link href="/discounts" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 transition font-bold text-xs uppercase tracking-wider">
              View live discounts page
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold rounded-2xl transition shadow-sm"
          >
            + New Discount
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
            Showing {filteredDiscounts.length} of {discounts.length}
          </div>
        </div>

        {/* Discounts Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm mb-12">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Campaign Name</th>
                  <th className="px-6 py-4 text-left">Applies To</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Value</th>
                  <th className="px-6 py-4 text-left">Method</th>
                  <th className="px-6 py-4 text-left">Used</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Approval</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDiscounts.map((disc) => (
                  <tr key={disc.id} className="hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-slate-800 font-extrabold">{disc.discount_name}</div>
                        <div className="text-xs text-slate-400 font-semibold mt-1">Expires: {disc.valid_until}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{disc.applicable_to}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg font-bold text-slate-500 uppercase tracking-wider">
                        {getTypeIcon(disc.discount_type)} {disc.discount_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">
                      {disc.discount_value}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${disc.is_automatic ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500'}`}>
                        {disc.is_automatic ? '⚡ Automatic' : '🎫 Code: ' + disc.coupon_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">
                      {disc.usage_count} times
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(disc.status)}`}>
                        {disc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getApprovalColor(disc.approval_status)}`}>
                        {disc.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition">
                          ✏️ Edit
                        </button>
                        {disc.approval_status === 'pending' && (
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">{discounts.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Campaigns</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 mb-1">
              {discounts.filter((d) => d.status === 'active').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-amber-600 mb-1">
              {discounts.filter((d) => d.approval_status === 'pending').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-blue-600 mb-1">
              {discounts.filter((d) => d.is_automatic).length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auto-Applied</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">
              {discounts.reduce((sum, d) => sum + d.usage_count, 0)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total System Uses</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Create New Discount</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Volume Discount - Hotels"
                    className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Type</label>
                  <select className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white">
                    <option>Percentage</option>
                    <option>Fixed Amount</option>
                    <option>Tiered</option>
                    <option>Volume</option>
                    <option>Seasonal</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Value</label>
                    <input
                      type="number"
                      placeholder="15"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Applies To</label>
                    <input
                      type="text"
                      placeholder="All Services"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valid From</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valid Until</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="SAVE15"
                    className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                  />
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2.5 text-slate-600 font-semibold text-sm cursor-pointer">
                    <input type="checkbox" className="w-4.5 h-4.5 rounded border-slate-300 accent-[#D4AF37]" />
                    <span>Auto Apply</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-slate-600 font-semibold text-sm cursor-pointer">
                    <input type="checkbox" className="w-4.5 h-4.5 rounded border-slate-300 accent-[#D4AF37]" />
                    <span>Requires Approval</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 bg-slate-50/20 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button className="px-6 py-2.5 bg-[#D4AF37] hover:bg-amber-600 rounded-2xl text-white font-bold transition">
                  Create Discount
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
