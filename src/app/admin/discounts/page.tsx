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
          <h1 className="text-4xl font-bold text-white mb-2">💰 Discounts Manager</h1>
          <p className="text-gray-400">Manage system-wide discounts and pricing rules</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            + New Discount
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Types</option>
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="tiered">Tiered</option>
            <option value="volume">Volume</option>
            <option value="seasonal">Seasonal</option>
          </select>

          <div className="text-gray-400 text-sm ml-auto">
            Showing {filteredDiscounts.length} of {discounts.length}
          </div>
        </div>

        {/* Discounts Table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Discount Name</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Value</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Applies To</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Usage</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Auto Apply</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Approval</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="border-b border-gray-900 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        <span className="text-xl">{getTypeIcon(discount.discount_type)}</span>
                        {discount.discount_name}
                      </div>
                      {discount.coupon_code && (
                        <div className="text-xs text-gray-500 mt-1">Code: {discount.coupon_code}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm px-2 py-1 bg-gray-800 rounded text-gray-300 capitalize">
                      {discount.discount_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-bold text-lg">
                      {discount.discount_type === 'percent' ? discount.discount_value + '%' : '$' + discount.discount_value}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{discount.applicable_to}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{discount.usage_count}</div>
                    <div className="text-xs text-gray-500">times used</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        discount.is_automatic
                          ? 'bg-green-900 text-green-200'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {discount.is_automatic ? '✓ Auto' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(discount.status)}`}>
                      {discount.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getApprovalColor(discount.approval_status)}`}>
                      {discount.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-[#556B2F] hover:opacity-90 rounded text-white transition-opacity">
                        ✏️ Edit
                      </button>
                      {discount.approval_status === 'pending' && (
                        <>
                          <button className="px-3 py-1 text-xs bg-green-900 hover:bg-green-800 rounded text-green-200 transition-colors">
                            ✓
                          </button>
                          <button className="px-3 py-1 text-xs bg-red-900 hover:bg-red-800 rounded text-red-200 transition-colors">
                            ✕
                          </button>
                        </>
                      )}
                      <button className="px-3 py-1 text-xs bg-red-900 hover:bg-red-800 rounded text-red-200 transition-colors">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{discounts.length}</div>
            <div className="text-gray-400 text-sm">Total Discounts</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {discounts.filter((d) => d.status === 'active').length}
            </div>
            <div className="text-gray-400 text-sm">Active</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {discounts.filter((d) => d.approval_status === 'pending').length}
            </div>
            <div className="text-gray-400 text-sm">Pending</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {discounts.filter((d) => d.is_automatic).length}
            </div>
            <div className="text-gray-400 text-sm">Auto Apply</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">
              {discounts.reduce((sum, d) => sum + d.usage_count, 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Used</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Discount</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Discount Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Volume Discount - Hotels"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Discount Type</label>
                  <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                    <option>Percentage</option>
                    <option>Fixed Amount</option>
                    <option>Tiered</option>
                    <option>Volume</option>
                    <option>Seasonal</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Discount Value</label>
                    <input
                      type="number"
                      placeholder="15"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Applies To</label>
                    <input
                      type="text"
                      placeholder="All Services"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Valid From</label>
                    <input
                      type="date"
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

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="SAVE15"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" className="w-4 h-4 accent-[#D4AF37]" />
                    <span className="text-sm">Auto Apply</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" className="w-4 h-4 accent-[#D4AF37]" />
                    <span className="text-sm">Requires Approval</span>
                  </label>
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
