'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Offer {
  id: string;
  offer_title: string;
  business_type: 'accommodation' | 'tour' | 'transport' | 'restaurant' | 'activity' | 'all';
  offer_target: 'standalone' | 'package_associated' | 'all';
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

const initialOffers: Offer[] = [
  {
    id: '1',
    offer_title: '20% Off Summer Special',
    business_type: 'tour',
    offer_target: 'standalone',
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
    business_type: 'accommodation',
    offer_target: 'standalone',
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
    business_type: 'restaurant',
    offer_target: 'standalone',
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
];

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
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

  const activeCount = offers.filter((o) => o.status === 'active').length;
  const pendingCount = offers.filter((o) => o.approval_status === 'pending').length;
  const usageTotal = offers.reduce((sum, o) => sum + o.usage_count, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf8,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-700 p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-amber-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_35%,#111827_100%)] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href="/admin" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 transition hover:text-[#f5d56a]">
              ← Control Center
            </Link>
            <Link href="/offers" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#f5d56a] transition hover:bg-white/10">
              View live page
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#f5d56a]">
                Product & Offers / Offer Categories
              </p>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5d56a]/15 text-2xl shadow-inner shadow-[#f5d56a]/20">🏷️</span>
                <h1 className="text-3xl font-black text-white sm:text-4xl">Offers Manager</h1>
              </div>
            </div>

            <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
              <Link href="/admin/vendor-services" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100">
                Govern services
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-2xl bg-[#f5d56a] px-5 py-3 text-sm font-black text-slate-900 shadow-[0_12px_24px_rgba(245,213,106,0.3)] transition hover:bg-[#f1c94b]"
              >
                + New Offer
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
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Offers</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-[#A87C00]">{offers.length}</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{offers.length}</div>
            <div className="mt-2 text-xs text-slate-400">Across all segments</div>
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
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Usage</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">Live</span>
            </div>
            <div className="text-3xl font-black text-blue-600">{usageTotal}</div>
            <div className="mt-2 text-xs text-slate-400">Total actions recorded</div>
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
            Showing {filteredOffers.length} of {offers.length}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-12">
          {filteredOffers.map((offer) => (
            <article key={offer.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:border-amber-200 hover:shadow-[0_18px_36px_rgba(212,175,55,0.12)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl">{getTypeIcon(offer.offer_type)}</span>
                  {offer.is_featured && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#A87C00]">
                      Featured
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">
                    {offer.discount_type === 'percent' ? `${offer.discount_value}%` : `$${offer.discount_value}`}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{offer.offer_type.replace(/_/g, ' ')}</div>
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-lg font-black text-slate-900">{offer.offer_title}</h3>
                <p className="mt-1 text-sm text-slate-500">{offer.business_name}</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getStatusColor(offer.status)}`}>
                  {offer.status}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getApprovalColor(offer.approval_status)}`}>
                  {offer.approval_status}
                </span>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Type</div>
                  <div className="mt-1 capitalize text-slate-700">{offer.business_type}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Target</div>
                  <div className="mt-1 capitalize text-slate-700">{offer.offer_target.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Usage</div>
                  <div className="mt-1 text-slate-700">{offer.usage_count}/{offer.usage_limit}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Expires</div>
                  <div className="mt-1 text-slate-700">{offer.valid_until}</div>
                </div>
              </div>

              {offer.coupon_code && (
                <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.12em] text-[#A87C00]">
                  Coupon: {offer.coupon_code}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100">
                  ✏️ Edit
                </button>
                {offer.approval_status === 'pending' && (
                  <>
                    <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 transition hover:bg-emerald-100">
                      ✓
                    </button>
                    <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100">
                      ✕
                    </button>
                  </>
                )}
                <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100">
                  🗑️
                </button>
              </div>
            </article>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Create</p>
                  <h2 className="text-2xl font-black text-slate-900">New Offer</h2>
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
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Offer name</label>
                  <input
                    type="text"
                    placeholder="Sunrise Tour Special"
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
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Target</label>
                    <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white">
                      <option value="standalone">Standalone Offer</option>
                      <option value="package_associated">Package-Associated</option>
                      <option value="all">Any</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Offer type</label>
                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white">
                      <option value="discount_percent">Percentage Discount</option>
                      <option value="discount_fixed">Fixed Discount</option>
                      <option value="buy_x_get_y">Buy X Get Y</option>
                      <option value="free_item">Free Item</option>
                      <option value="loyalty_points">Loyalty Points</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Value</label>
                    <input type="number" placeholder="20" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white" />
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
