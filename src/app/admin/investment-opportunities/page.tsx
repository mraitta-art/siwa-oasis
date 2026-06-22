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
        return 'bg-green-900 text-green-200';
      case 'draft':
        return 'bg-yellow-900 text-yellow-200';
      case 'closed':
        return 'bg-gray-800 text-gray-300';
      case 'funded':
        return 'bg-blue-900 text-blue-200';
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
          <h1 className="text-4xl font-bold text-white mb-2">💰 Investment Opportunities</h1>
          <p className="text-gray-400">Manage business investment listings and investor inquiries</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            + New Opportunity
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
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
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Visibility</option>
            <option value="visible">Visible on Main Site</option>
            <option value="hidden">Hidden from Main Site</option>
          </select>

          <div className="text-gray-400 text-sm ml-auto">
            Showing {filteredOpportunities.length} of {opportunities.length}
          </div>
        </div>

        {/* Opportunities Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Opportunity</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Business</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Investment Range</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">ROI</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Investors</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Visibility</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.map((opp) => (
                <tr key={opp.id} className="border-b border-gray-900 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        <span className="text-xl">{getTypeIcon(opp.opportunity_type)}</span>
                        {opp.opportunity_title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{opp.inquiries_count} inquiries</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{opp.business_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm px-2 py-1 bg-gray-800 rounded text-gray-300 capitalize">
                      {opp.opportunity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-semibold text-sm">
                      ${opp.investment_amount_min.toLocaleString()} - ${opp.investment_amount_max.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#D4AF37] font-bold">{opp.expected_roi_percent}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-semibold">
                      {opp.investors_current}/{opp.target_investors}
                    </div>
                    <div className="text-xs text-gray-500">
                      <div className="w-20 h-1 bg-gray-800 rounded mt-1 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#556B2F] to-[#D4AF37]"
                          style={{ width: `${(opp.investors_current / opp.target_investors) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(opp.status)}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        opp.visibility_on_main_site
                          ? 'bg-green-900 text-green-200'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {opp.visibility_on_main_site ? '👁️ Visible' : '🙈 Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-[#556B2F] hover:opacity-90 rounded text-white transition-opacity">
                        ✏️ Edit
                      </button>
                      <button
                        className="px-3 py-1 text-xs rounded text-white transition-opacity font-semibold"
                        style={{
                          backgroundColor: opp.visibility_on_main_site ? '#7c3aed' : '#3b82f6',
                        }}
                      >
                        {opp.visibility_on_main_site ? '🙈 Hide' : '👁️ Show'}
                      </button>
                      {opp.approval_status === 'pending' && (
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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{opportunities.length}</div>
            <div className="text-gray-400 text-sm">Total Opportunities</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {opportunities.filter((o) => o.status === 'published').length}
            </div>
            <div className="text-gray-400 text-sm">Published</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {opportunities.filter((o) => o.visibility_on_main_site).length}
            </div>
            <div className="text-gray-400 text-sm">Visible on Main</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {opportunities.reduce((sum, o) => sum + o.inquiries_count, 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Inquiries</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              {opportunities.reduce((sum, o) => sum + o.investors_current, 0)}
            </div>
            <div className="text-gray-400 text-sm">Active Investors</div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Create Investment Opportunity</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Opportunity Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Desert Tours Expansion"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Opportunity Type</label>
                  <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]">
                    <option>Equity</option>
                    <option>Partnership</option>
                    <option>Franchise</option>
                    <option>Joint Venture</option>
                    <option>Sponsorship</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Min Investment</label>
                    <input
                      type="number"
                      placeholder="50000"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Max Investment</label>
                    <input
                      type="number"
                      placeholder="250000"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Expected ROI (%)</label>
                    <input
                      type="number"
                      placeholder="25"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Target Investors</label>
                    <input
                      type="number"
                      placeholder="5"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                  <textarea
                    placeholder="Describe this investment opportunity"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 bg-gray-800 rounded">
                    <input type="checkbox" className="w-4 h-4 accent-[#D4AF37]" />
                    <span className="text-white text-sm font-semibold">Feature on Main Site</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-gray-800 rounded">
                    <input type="checkbox" className="w-4 h-4 accent-[#D4AF37]" />
                    <span className="text-white text-sm font-semibold">Requires Approval</span>
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
