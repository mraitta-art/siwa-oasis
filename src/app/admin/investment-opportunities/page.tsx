'use client';

import Link from 'next/link';
import { useState } from 'react';

interface InvestmentOpportunity {
  id: string;
  opportunity_title: string;
  opportunity_type: 'equity' | 'partnership' | 'franchise' | 'joint_venture' | 'sponsorship';
  business_name: string;
  investment_amount_min: number;
  investment_amount_max: number;
  expected_roi_percent: number;
  status: 'draft' | 'published' | 'closed' | 'funded';
  approval_status: 'pending' | 'approved' | 'rejected';
  visibility_on_main_site: boolean;
  is_featured: boolean;
  investors_current: number;
  target_investors: number;
  inquiries_count: number;
}

export default function AdminInvestmentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([
    {
      id: '1',
      opportunity_title: 'Desert Tours Expansion',
      opportunity_type: 'equity',
      business_name: 'Desert Tours Co',
      investment_amount_min: 50000,
      investment_amount_max: 250000,
      expected_roi_percent: 25,
      status: 'published',
      approval_status: 'approved',
      visibility_on_main_site: true,
      is_featured: true,
      investors_current: 3,
      target_investors: 5,
      inquiries_count: 18,
    },
    {
      id: '2',
      opportunity_title: 'Siwa Palace Renovation',
      opportunity_type: 'partnership',
      business_name: 'Siwa Palace Hotel',
      investment_amount_min: 100000,
      investment_amount_max: 500000,
      expected_roi_percent: 20,
      status: 'published',
      approval_status: 'approved',
      visibility_on_main_site: true,
      is_featured: false,
      investors_current: 2,
      target_investors: 4,
      inquiries_count: 12,
    },
    {
      id: '3',
      opportunity_title: 'Restaurant Chain Franchise',
      opportunity_type: 'franchise',
      business_name: 'Restaurant Siwa',
      investment_amount_min: 30000,
      investment_amount_max: 80000,
      expected_roi_percent: 30,
      status: 'draft',
      approval_status: 'pending',
      visibility_on_main_site: false,
      is_featured: false,
      investors_current: 0,
      target_investors: 10,
      inquiries_count: 0,
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredOpportunities = opportunities.filter((opp) => {
    if (filterStatus !== 'all' && opp.status !== filterStatus) return false;
    if (filterApproval !== 'all' && opp.approval_status !== filterApproval) return false;
    if (filterVisibility !== 'all') {
      if (filterVisibility === 'visible' && !opp.visibility_on_main_site) return false;
      if (filterVisibility === 'hidden' && opp.visibility_on_main_site) return false;
    }
    return true;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      equity: '📊',
      partnership: '🤝',
      franchise: '🏢',
      joint_venture: '🔗',
      sponsorship: '🎯',
    };
    return icons[type] || '💰';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200/50';
      case 'draft':
        return 'bg-amber-50 text-amber-600 border border-amber-200/50';
      case 'closed':
        return 'bg-slate-50 text-slate-400 border border-slate-200/50';
      case 'funded':
        return 'bg-blue-50 text-blue-600 border border-blue-200/50';
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
                <span className="text-[#D4AF37]">💎</span> Investment Opportunities
              </h1>
              <p className="text-slate-500 text-sm">Review, approve, and promote investment listings and investor inquiries</p>
            </div>
            <Link href="/investment-opportunities" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 transition font-bold text-xs uppercase tracking-wider">
              View live investments page
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold rounded-2xl transition shadow-sm"
          >
            + New Opportunity
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="funded">Funded</option>
            <option value="closed">Closed</option>
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

          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Visibility</option>
            <option value="visible">Visible on Main Site</option>
            <option value="hidden">Hidden from Main Site</option>
          </select>

          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-auto">
            Showing {filteredOpportunities.length} of {opportunities.length}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm mb-12">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Opportunity</th>
                  <th className="px-6 py-4 text-left">Business</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Investment Range</th>
                  <th className="px-6 py-4 text-left">ROI</th>
                  <th className="px-6 py-4 text-left">Investors</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Approval</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-slate-800 font-extrabold flex items-center gap-2">
                          <span className="text-lg bg-amber-50 p-1.5 rounded-lg">{getTypeIcon(opp.opportunity_type)}</span>
                          {opp.opportunity_title}
                        </div>
                        {opp.visibility_on_main_site && (
                          <span className="mt-1 inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            Visible on main
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{opp.business_name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {opp.opportunity_type}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-black">
                        ${opp.investment_amount_min.toLocaleString()} - ${opp.investment_amount_max.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#D4AF37] font-black">{opp.expected_roi_percent}%</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">
                      <div>{opp.investors_current}/{opp.target_investors}</div>
                      <div className="w-20 h-1 bg-slate-100 rounded mt-1 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500"
                          style={{ width: `${(opp.investors_current / opp.target_investors) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(opp.status)}`}>
                        {opp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getApprovalColor(opp.approval_status)}`}>
                        {opp.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition">
                          ✏️ Edit
                        </button>
                        {opp.approval_status === 'pending' && (
                          <>
                            <button className="px-3.5 py-1.5 text-xs bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold transition">
                              ✓ Approve
                            </button>
                            <button className="px-3.5 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <button className="px-3.5 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
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
            <div className="text-2xl font-black text-[#D4AF37] mb-1">{opportunities.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Opportunities</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 mb-1">
              {opportunities.filter((o) => o.status === 'published').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-blue-600 mb-1">
              {opportunities.filter((o) => o.visibility_on_main_site).length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visible on Main</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-amber-600 mb-1">
              {opportunities.reduce((sum, o) => sum + o.inquiries_count, 0)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inquiries</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">
              {opportunities.reduce((sum, o) => sum + o.investors_current, 0)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Investors</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Create Investment Opportunity</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Opportunity Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Desert Tours Expansion"
                    className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Opportunity Type</label>
                  <select className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white">
                    <option>Equity</option>
                    <option>Partnership</option>
                    <option>Franchise</option>
                    <option>Joint Venture</option>
                    <option>Sponsorship</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Min Investment (USD)</label>
                    <input
                      type="number"
                      placeholder="50000"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Investment (USD)</label>
                    <input
                      type="number"
                      placeholder="250000"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expected ROI (%)</label>
                    <input
                      type="number"
                      placeholder="25"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Investors</label>
                    <input
                      type="number"
                      placeholder="5"
                      className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    placeholder="Describe this investment opportunity"
                    className="w-full px-4 py-3 bg-slate-50/30 border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-amber-50"
                    rows={3}
                  />
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2.5 text-slate-600 font-semibold text-sm cursor-pointer">
                    <input type="checkbox" className="w-4.5 h-4.5 rounded border-slate-300 accent-[#D4AF37]" />
                    <span>Feature on Main Site</span>
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
                  className="px-6 py-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button className="px-6 py-2.5 bg-[#D4AF37] hover:bg-amber-600 rounded-2xl text-white font-bold transition">
                  Create Opportunity
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
