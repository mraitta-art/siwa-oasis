'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Plus, Edit, Trash2, ToggleRight } from 'lucide-react';

interface JourneyPolicy {
  id: string;
  policy_name: string;
  description?: string;
  request_type: string;
  approval_required: boolean;
  auto_approve_enabled: boolean;
  max_items_allowed: number;
  max_days_allowed: number;
  featured_boost_price?: number;
  vendor_commission_percent: number;
  is_active: boolean;
  is_default: boolean;
  priority: number;
}

export default function AdminJourneyPoliciesPage() {
  const [policies, setPolicies] = useState<JourneyPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/admin/journey-policies?is_active=true');
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestTypeLabels: Record<string, string> = {
    ready_made: '🎯 Ready-Made',
    custom_request: '✏️ Custom Request',
    template_modify: '📋 Template Modify',
    urgent_needs: '⚡ Urgent Needs'
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Journey Request Policies</h1>
            <p className="text-gray-400">Control how visitor journey requests are processed and routed to vendors</p>
          </div>
          <Link
            href="/admin/journey-policies/create"
            className="flex items-center gap-2 px-6 py-3 bg-[#556B2F] text-[#FFD700] rounded-lg hover:bg-[#6B8234] transition"
          >
            <Plus size={20} />
            New Policy
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#556B2F]">
            <div className="text-gray-400 text-sm mb-2">Total Policies</div>
            <div className="text-3xl font-bold text-[#FFD700]">{policies.length}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#556B2F]">
            <div className="text-gray-400 text-sm mb-2">Auto-Approve</div>
            <div className="text-3xl font-bold text-[#FFD700]">{policies.filter(p => p.auto_approve_enabled).length}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#556B2F]">
            <div className="text-gray-400 text-sm mb-2">Avg Commission</div>
            <div className="text-3xl font-bold text-[#FFD700]">
              {Math.round(policies.reduce((sum, p) => sum + p.vendor_commission_percent, 0) / policies.length)}%
            </div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#556B2F]">
            <div className="text-gray-400 text-sm mb-2">Default Policy</div>
            <div className="text-3xl font-bold text-[#FFD700]">{policies.find(p => p.is_default)?.policy_name || 'None'}</div>
          </div>
        </div>

        {/* Policies Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading policies...</div>
        ) : (
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#556B2F]">
                <tr>
                  <th className="px-6 py-4 text-left">Policy Name</th>
                  <th className="px-6 py-4 text-left">Request Type</th>
                  <th className="px-6 py-4 text-center">Max Items</th>
                  <th className="px-6 py-4 text-center">Auto-Approve</th>
                  <th className="px-6 py-4 text-center">Commission</th>
                  <th className="px-6 py-4 text-center">Default</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a3a]">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-[#333333] transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{policy.policy_name}</div>
                        <div className="text-sm text-gray-400">{policy.description?.substring(0, 40)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#556B2F] px-3 py-1 rounded-full text-sm">
                        {requestTypeLabels[policy.request_type] || policy.request_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{policy.max_items_allowed}</td>
                    <td className="px-6 py-4 text-center">
                      {policy.auto_approve_enabled ? (
                        <span className="text-green-400">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">✗ No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-[#FFD700]">{policy.vendor_commission_percent}%</td>
                    <td className="px-6 py-4 text-center">
                      {policy.is_default ? (
                        <span className="text-green-400 font-bold">★ DEFAULT</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/journey-policies/${policy.id}/edit`}
                          className="p-2 text-gray-400 hover:text-[#FFD700] transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          className="p-2 text-gray-400 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Documentation */}
        <div className="mt-12 bg-[#2a2a2a] p-8 rounded-lg border-l-4 border-[#FFD700]">
          <div className="flex gap-4 items-start">
            <Settings className="text-[#FFD700] flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-xl font-bold text-[#FFD700] mb-3">Policy Controls Everything</h3>
              <ul className="text-gray-300 space-y-2 mb-4">
                <li>✓ <strong>Auto-Approval:</strong> Requests auto-approve based on rules (budget, items, duration)</li>
                <li>✓ <strong>Vendor Assignment:</strong> Routes to right vendors automatically or manually</li>
                <li>✓ <strong>Approval Workflow:</strong> System → Admin → Vendor approval stages</li>
                <li>✓ <strong>Revenue Optimization:</strong> Featured boost pricing and commission structure</li>
                <li>✓ <strong>Request Constraints:</strong> Min/max items, days, group size, season restrictions</li>
              </ul>
              <p className="text-sm text-gray-400 mb-4">
                Each policy defines how a specific type of journey request flows through the system, from submission → vendor notification → approval → booking.
              </p>
              <Link
                href="/admin/section-guide"
                className="text-[#FFD700] hover:text-white transition inline-block"
              >
                View System Guide →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
