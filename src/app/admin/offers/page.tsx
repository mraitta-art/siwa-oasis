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
                <span className="text-[#D4AF37]">🏷️</span> Offers Manager
              </h1>
              <p className="text-slate-500 text-sm">Review, approve, and promote special deals and offers</p>
            </div>
            <Link href="/offers" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 transition font-bold text-xs uppercase tracking-wider">
              View live offers page
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold rounded-2xl transition shadow-sm"
          >
            + New Offer
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
            Showing {filteredOffers.length} of {offers.length}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:border-amber-200 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl bg-amber-50 p-2 rounded-xl">{getTypeIcon(offer.offer_type)}</span>
                    {offer.is_featured && (
                      <span className="px-2.5 py-1 bg-amber-100 text-[#D4AF37] text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 mb-1">{offer.offer_title}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{offer.business_name}</p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-[#D4AF37]">
                    {offer.discount_type === 'percent' ? offer.discount_value + '%' : '$' + offer.discount_value}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{offer.offer_type.replace(/_/g, ' ')}</div>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <div className="text-slate-400 font-bold">Usage</div>
                    <div className="text-slate-700 mt-0.5">{offer.usage_count}/{offer.usage_limit}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold">Expires</div>
                    <div className="text-slate-700 mt-0.5">{offer.valid_until}</div>
                  </div>
                </div>

                {offer.coupon_code && (
                  <div className="mt-3 px-3 py-2 bg-slate-50 border border-slate-200/40 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Coupon Code: </span>
                    <span className="text-sm font-mono font-bold text-[#D4AF37] ml-1">{offer.coupon_code}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-4">
                <span className={`flex-1 text-[10px] py-1.5 rounded-full font-bold text-center uppercase tracking-wider ${getStatusColor(offer.status)}`}>
                  {offer.status}
                </span>
                <span className={`flex-1 text-[10px] py-1.5 rounded-full font-bold text-center uppercase tracking-wider ${getApprovalColor(offer.approval_status)}`}>
                  {offer.approval_status}
                </span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition">
                  ✏️ Edit
                </button>
                {offer.approval_status === 'pending' && (
                  <>
                    <button className="px-3.5 py-2 text-xs bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold transition">
                      ✓
                    </button>
                    <button className="px-3.5 py-2 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
                      ✕
                    </button>
                  </>
                )}
                <button className="px-3.5 py-2 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">{offers.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Offers</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 mb-1">
              {offers.filter((o) => o.status === 'active').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-amber-600 mb-1">
              {offers.filter((o) => o.approval_status === 'pending').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">
              {offers.reduce((sum, o) => sum + o.usage_count, 0)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Usage Count</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Create New Offer</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Offer Title</label>
                  <input
                    type="text"
                    placeholder="e.g., 20% Off Summer Special"
                    className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Offer Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white"
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {selectedType === 'discount_percent' ? 'Percentage (%)' : 'Amount ($)'}
                    </label>
                    <input
                      type="number"
                      placeholder={selectedType === 'discount_percent' ? '20' : '50'}
                      className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valid From</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valid Until</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="SUMMER20"
                    className="w-full px-4 py-3 bg-slate-55/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                  />
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2.5 text-slate-600 font-semibold text-sm cursor-pointer">
                    <input type="checkbox" className="w-4.5 h-4.5 rounded border-slate-300 accent-[#D4AF37]" />
                    <span>Feature on Homepage</span>
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
                  className="px-6 py-2.5 bg-slate-55/20 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button className="px-6 py-2.5 bg-[#D4AF37] hover:bg-amber-600 rounded-2xl text-white font-bold transition">
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
