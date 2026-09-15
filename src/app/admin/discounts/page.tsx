'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

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
  segment: 'Hotels' | 'Tours' | 'Restaurants' | 'All Services';
}

const initialDiscounts: Discount[] = [
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
    segment: 'Hotels',
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
    segment: 'All Services',
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
    segment: 'Tours',
  },
  {
    id: '4',
    discount_name: 'Family Dining Offer',
    discount_type: 'fixed',
    discount_value: 50,
    applicable_to: 'Restaurants',
    status: 'active',
    is_automatic: false,
    usage_count: 32,
    approval_status: 'approved',
    valid_until: '2026-09-30',
    coupon_code: 'FAMILY50',
    segment: 'Restaurants',
  },
  {
    id: '5',
    discount_name: 'Long Stay Escape',
    discount_type: 'percent',
    discount_value: 20,
    applicable_to: 'Hotels & Tours',
    status: 'inactive',
    is_automatic: true,
    usage_count: 41,
    approval_status: 'rejected',
    valid_until: '2026-07-15',
    segment: 'Hotels',
  },
];

const typeLabels: Record<string, string> = {
  percent: 'Percent',
  fixed: 'Fixed',
  tiered: 'Tiered',
  volume: 'Volume',
  seasonal: 'Seasonal',
};

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredDiscounts = useMemo(() => {
    return discounts.filter((discount) => {
      if (filterStatus !== 'all' && discount.status !== filterStatus) return false;
      if (filterType !== 'all' && discount.discount_type !== filterType) return false;
      if (filterApproval !== 'all' && discount.approval_status !== filterApproval) return false;
      return true;
    });
  }, [discounts, filterStatus, filterType, filterApproval]);

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

  const activeCount = discounts.filter((d) => d.status === 'active').length;
  const pendingCount = discounts.filter((d) => d.approval_status === 'pending').length;
  const usageTotal = discounts.reduce((sum, d) => sum + d.usage_count, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf8,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-700 p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-amber-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_35%,#111827_100%)] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href="/admin" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 transition hover:text-[#f5d56a]">
              ← Control Center
            </Link>
            <Link href="/discounts" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#f5d56a] transition hover:bg-white/10">
              View live page
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#f5d56a]">
                Product & Offers / Offer Categories
              </p>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5d56a]/15 text-2xl shadow-inner shadow-[#f5d56a]/20">💰</span>
                <h1 className="text-3xl font-black text-white sm:text-4xl">Discounts Manager</h1>
              </div>
            </div>

            <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-2xl bg-[#f5d56a] px-5 py-3 text-sm font-black text-slate-900 shadow-[0_12px_24px_rgba(245,213,106,0.3)] transition hover:bg-[#f1c94b]"
              >
                + New Discount
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
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Campaigns</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-[#A87C00]">{discounts.length}</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{discounts.length}</div>
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
            <div className="mt-2 text-xs text-slate-400">Bookings + bookings</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.8fr]">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Offer catalog</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Discount campaigns</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed</option>
                  <option value="tiered">Tiered</option>
                  <option value="volume">Volume</option>
                  <option value="seasonal">Seasonal</option>
                </select>

                <select
                  value={filterApproval}
                  onChange={(e) => setFilterApproval(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                >
                  <option value="all">All Approvals</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Showing {filteredDiscounts.length} of {discounts.length}
              </div>

              <div className="space-y-4">
                {filteredDiscounts.map((discount) => (
                  <article key={discount.id} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-amber-200 hover:bg-amber-50/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                            {discount.segment}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getStatusColor(discount.status)}`}>
                            {discount.status}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getApprovalColor(discount.approval_status)}`}>
                            {discount.approval_status}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900">{discount.discount_name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>Valid until {discount.valid_until}</span>
                          <span>{discount.applicable_to}</span>
                          <span>{discount.usage_count} uses</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">
                            <span>{getTypeIcon(discount.discount_type)}</span>
                            {typeLabels[discount.discount_type] || discount.discount_type}
                          </span>
                          <span className="text-2xl font-black text-slate-900">{discount.discount_value}{discount.discount_type === 'percent' ? '%' : ''}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100">
                            Edit
                          </button>
                          <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 transition hover:bg-emerald-100">
                            Approve
                          </button>
                          <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A87C00]">Performance</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>Hotels</span>
                    <span>68%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-amber-100">
                    <div className="h-2.5 w-[68%] rounded-full bg-[#D4AF37]" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>Tours</span>
                    <span>49%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-amber-100">
                    <div className="h-2.5 w-[49%] rounded-full bg-[#D4AF37]" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>Restaurants</span>
                    <span>32%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-amber-100">
                    <div className="h-2.5 w-[32%] rounded-full bg-[#D4AF37]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Quick insight</p>
              <div className="mt-3 space-y-4">
                <div>
                  <div className="text-3xl font-black text-slate-900">{Math.max(...discounts.map((d) => d.usage_count))}</div>
                  <div className="text-xs text-slate-500">Highest usage campaign</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Top segment</div>
                  <div className="mt-1 text-base font-black text-slate-800">Hotels & stays</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Healthy flow</div>
                  <div className="mt-1 text-base font-black text-emerald-800">{activeCount} active campaigns</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Create</p>
                  <h2 className="text-2xl font-black text-slate-900">New Discount</h2>
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
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Discount name</label>
                  <input
                    type="text"
                    placeholder="Luxury Weekend Escape"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Type</label>
                    <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white">
                      <option>Percentage</option>
                      <option>Fixed</option>
                      <option>Tiered</option>
                      <option>Volume</option>
                      <option>Seasonal</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Value</label>
                    <input
                      type="number"
                      placeholder="15"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Applies to</label>
                    <input
                      type="text"
                      placeholder="Hotels & Tours"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Segment</label>
                    <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white">
                      <option>All Services</option>
                      <option>Hotels</option>
                      <option>Tours</option>
                      <option>Restaurants</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Valid from</label>
                    <input type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Valid until</label>
                    <input type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Coupon code</label>
                  <input
                    type="text"
                    placeholder="SAVE15"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#D4AF37] focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input type="checkbox" className="h-4 w-4 accent-[#D4AF37]" />
                    Auto apply
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input type="checkbox" className="h-4 w-4 accent-[#D4AF37]" />
                    Requires approval
                  </label>
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
