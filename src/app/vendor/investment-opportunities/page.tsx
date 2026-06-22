'use client';

import Link from 'next/link';
import { useState } from 'react';

interface InvestmentOpportunity {
  id: string;
  opportunity_title: string;
  opportunity_type: 'equity' | 'partnership' | 'franchise' | 'joint_venture' | 'sponsorship';
  investment_amount_min: number;
  investment_amount_max: number;
  expected_roi_percent: number;
  status: 'draft' | 'published' | 'funded' | 'closed';
  approval_status: 'pending' | 'approved' | 'rejected';
  visibility_on_main_site: boolean;
  is_featured: boolean;
  investors_current: number;
  target_investors: number;
  inquiries_count: number;
  applications_count: number;
  valid_until: string;
}

export default function VendorInvestmentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([
    {
      id: '1',
      opportunity_title: 'Desert Tours Expansion',
      opportunity_type: 'equity',
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
      applications_count: 8,
      valid_until: '2026-12-31',
    },
    {
      id: '2',
      opportunity_title: 'New Safari Camp Launch',
      opportunity_type: 'partnership',
      investment_amount_min: 75000,
      investment_amount_max: 150000,
      expected_roi_percent: 20,
      status: 'draft',
      approval_status: 'pending',
      visibility_on_main_site: false,
      is_featured: false,
      investors_current: 0,
      target_investors: 3,
      inquiries_count: 0,
      applications_count: 0,
      valid_until: '2026-08-31',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredOpportunities = opportunities.filter((opp) => {
    if (filterStatus !== 'all' && opp.status !== filterStatus) return false;
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
      case 'funded':
        return 'bg-blue-900 text-blue-200';
      case 'closed':
        return 'bg-gray-800 text-gray-300';
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
          <Link href="/vendor" className="text-gray-400 hover:text-[#D4AF37] transition-colors mb-4 block">
            ← Vendor Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">💰 Investment Opportunities</h1>
          <p className="text-gray-400">Create and manage investment opportunities for your business</p>
        </div>

        {/* Info Alert */}
        <div className="mb-6 p-4 bg-blue-900 border border-blue-800 rounded-lg">
          <div className="text-blue-200 text-sm">
            <strong>ℹ️ Admin Control:</strong> Your opportunities need admin approval before showing on main
            website. You can still manage them here on your mini website.
          </div>
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

          <div className="text-gray-400 text-sm ml-auto">
            Showing {filteredOpportunities.length} of {opportunities.length}
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {filteredOpportunities.map((opp) => (
            <div key={opp.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{getTypeIcon(opp.opportunity_type)}</span>
                    {opp.is_featured && (
                      <span className="px-2 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded">⭐ Featured</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{opp.opportunity_title}</h3>
                  <div className="flex gap-2 text-xs text-gray-400 mb-2">
                    <span>{opp.opportunity_type}</span>
                    <span>•</span>
                    <span>{opp.expected_roi_percent}% ROI</span>
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="bg-gray-800 rounded p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">Investment Range</div>
                    <div className="text-white font-semibold text-sm">
                      ${opp.investment_amount_min.toLocaleString()} - ${opp.investment_amount_max.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Investors</div>
                    <div className="text-white font-semibold text-sm">
                      {opp.investors_current}/{opp.target_investors}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#556B2F] to-[#D4AF37]"
                      style={{ width: `${(opp.investors_current / opp.target_investors) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-center text-sm">
                <div>
                  <div className="text-2xl font-bold text-[#D4AF37]">{opp.inquiries_count}</div>
                  <div className="text-xs text-gray-500">Inquiries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{opp.applications_count}</div>
                  <div className="text-xs text-gray-500">Applications</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{opp.visibility_on_main_site ? '👁️' : '🙈'}</div>
                  <div className="text-xs text-gray-500">{opp.visibility_on_main_site ? 'Visible' : 'Hidden'}</div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2 mb-4">
                <span className={`flex-1 text-xs px-2 py-1 rounded font-semibold text-center ${getStatusColor(opp.status)}`}>
                  {opp.status}
                </span>
                <span className={`flex-1 text-xs px-2 py-1 rounded font-semibold text-center ${getApprovalColor(opp.approval_status)}`}>
                  {opp.approval_status}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-4 text-center">
                Expires: {opp.valid_until}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-[#556B2F] hover:opacity-90 rounded text-white font-semibold transition-opacity">
                  ✏️ Edit
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-blue-900 hover:bg-blue-800 rounded text-blue-200 font-semibold transition-colors">
                  📊 Analytics
                </button>
                <button className="px-3 py-2 text-sm bg-red-900 hover:bg-red-800 rounded text-red-200 font-semibold transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
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
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {opportunities.reduce((sum, o) => sum + o.inquiries_count, 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Inquiries</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              ${opportunities.reduce((sum, o) => sum + o.investors_current, 0) * 100000}
            </div>
            <div className="text-gray-400 text-sm">Capital Raised</div>
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
                    placeholder="Describe your investment opportunity"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    rows={3}
                  />
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
