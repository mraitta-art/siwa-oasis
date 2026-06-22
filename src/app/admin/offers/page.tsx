'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Offer {
  id: string;
  offer_title: string;
  offer_type: 'discount_percent' | 'discount_fixed' | 'buy_x_get_y' | 'free_item' | 'loyalty_points';
  discount_value: number;
  discount_type: string;
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  usage_count: number;
  usage_limit: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  business_name: string;
  valid_until: string;
  coupon_code?: string;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([
    {
      id: '1',
      offer_title: '20% Off Summer Special',
      offer_type: 'discount_percent',
      discount_value: 20,
      discount_type: 'percent',
      status: 'active',
      is_featured: true,
      usage_count: 45,
      usage_limit: 200,
      approval_status: 'approved',
      business_name: 'Desert Tours Co',
      valid_until: '2026-08-31',
      coupon_code: 'SUMMER20',
    },
    {
      id: '2',
      offer_title: 'Save $50 on Hotel Stay',
      offer_type: 'discount_fixed',
      discount_value: 50,
      discount_type: 'fixed',
      status: 'active',
      is_featured: false,
      usage_count: 28,
      usage_limit: 100,
      approval_status: 'approved',
      business_name: 'Siwa Palace Hotel',
      valid_until: '2026-07-15',
    },
    {
      id: '3',
      offer_title: 'Buy 2 Get 1 Free Meals',
      offer_type: 'buy_x_get_y',
      discount_value: 33,
      discount_type: 'buy_x_get_y',
      status: 'draft',
      is_featured: false,
      usage_count: 0,
      usage_limit: 500,
      approval_status: 'pending',
      business_name: 'Restaurant Siwa',
      valid_until: '2026-09-30',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('discount_percent');

  const filteredOffers = offers.filter((offer) => {
    if (filterStatus !== 'all' && offer.status !== filterStatus) return false;
    if (filterApproval !== 'all' && offer.approval_status !== filterApproval) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      discount_percent: '💯',
      discount_fixed: '💰',
      buy_x_get_y: '🎁',
      free_item: '🆓',
      loyalty_points: '⭐',
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
          <h1 className="text-4xl font-bold text-white mb-2">🏷️ Offers Manager</h1>
          <p className="text-gray-400">Manage special offers, promotions, and deals</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            + New Offer
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
            Showing {filteredOffers.length} of {offers.length}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{getTypeIcon(offer.offer_type)}</span>
                    {offer.is_featured && (
                      <span className="px-2 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{offer.offer_title}</h3>
                  <p className="text-sm text-gray-400 mb-2">{offer.business_name}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-[#D4AF37]">
                    {offer.discount_type === 'percent' ? offer.discount_value + '%' : '$' + offer.discount_value}
                  </div>
                  <div className="text-xs text-gray-500">{offer.offer_type.replace(/_/g, ' ')}</div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Usage</div>
                    <div className="text-white font-semibold">{offer.usage_count}/{offer.usage_limit}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Expires</div>
                    <div className="text-white font-semibold">{offer.valid_until}</div>
                  </div>
                </div>

                {offer.coupon_code && (
                  <div className="mt-3 px-3 py-2 bg-gray-800 rounded text-center">
                    <div className="text-xs text-gray-400">Code</div>
                    <div className="text-sm font-mono font-bold text-[#D4AF37]">{offer.coupon_code}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <span className={`flex-1 text-xs px-2 py-1 rounded font-semibold text-center ${getStatusColor(offer.status)}`}>
                  {offer.status}
                </span>
                <span className={`flex-1 text-xs px-2 py-1 rounded font-semibold text-center ${getApprovalColor(offer.approval_status)}`}>
                  {offer.approval_status}
                </span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-[#556B2F] hover:opacity-90 rounded text-white font-semibold transition-opacity">
                  ✏️ Edit
                </button>
                {offer.approval_status === 'pending' && (
                  <>
                    <button className="px-3 py-2 text-sm bg-green-900 hover:bg-green-800 rounded text-green-200 font-semibold transition-colors">
                      ✓
                    </button>
                    <button className="px-3 py-2 text-sm bg-red-900 hover:bg-red-800 rounded text-red-200 font-semibold transition-colors">
                      ✕
                    </button>
                  </>
                )}
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
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{offers.length}</div>
            <div className="text-gray-400">Total Offers</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {offers.filter((o) => o.status === 'active').length}
            </div>
            <div className="text-gray-400">Active</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {offers.filter((o) => o.approval_status === 'pending').length}
            </div>
            <div className="text-gray-400">Pending Approval</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">
              {offers.reduce((sum, o) => sum + o.usage_count, 0)}
            </div>
            <div className="text-gray-400">Total Used</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Offer</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Offer Title</label>
                  <input
                    type="text"
                    placeholder="e.g., 20% Off Summer Special"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Offer Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="discount_percent">💯 Percentage Discount</option>
                    <option value="discount_fixed">💰 Fixed Amount Discount</option>
                    <option value="buy_x_get_y">🎁 Buy X Get Y</option>
                    <option value="free_item">🆓 Free Item</option>
                    <option value="loyalty_points">⭐ Loyalty Points</option>
                  </select>
                </div>

                {(selectedType === 'discount_percent' || selectedType === 'discount_fixed') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      {selectedType === 'discount_percent' ? 'Percentage (%)' : 'Amount ($)'}
                    </label>
                    <input
                      type="number"
                      placeholder={selectedType === 'discount_percent' ? '20' : '50'}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}

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
                    placeholder="SUMMER20"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" className="w-4 h-4 accent-[#D4AF37]" />
                    <span className="text-sm">Feature on Homepage</span>
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
                  Create Offer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
