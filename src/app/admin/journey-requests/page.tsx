'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, AlertCircle, MessageSquare, Users } from 'lucide-react';

interface JourneyRequest {
  id: string;
  visitor_name: string;
  visitor_email: string;
  title: string;
  duration_days: number;
  budget_usd_max: number;
  vibe: string;
  status: string;
  approval_decision: string;
  matched_policy_id: string;
  interested_vendor_count: number;
  created_at: Date;
}

export default function AdminJourneyRequestsPage() {
  const [requests, setRequests] = useState<JourneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const query = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/admin/journey-requests${query}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async (requestId: string) => {
    try {
      const vendorId = window.prompt('Enter vendor ID to forward to (e.g. vendor_123):');
      if (!vendorId) return;
      const mode = window.prompt('Forward mode: "full_contact" or "proxy" (reply via admin)?', 'proxy');
      if (!mode) return;

      const res = await fetch('/api/admin/forward-to-vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, vendorId, mode })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.forwarded === 'full_contact') {
          alert('Forwarded with full contact. Vendor contact: ' + JSON.stringify(data.vendorContact));
        } else {
          alert('Forwarded as proxy. Vendor will reply via admin inbox.');
        }
      } else {
        alert('Failed to forward: ' + (data.error || res.statusText));
      }
    } catch (err: any) {
      console.error(err);
      alert('Unexpected error while forwarding');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-400" size={18} />;
      case 'rejected':
        return <XCircle className="text-red-400" size={18} />;
      case 'under_review':
        return <Clock className="text-yellow-400" size={18} />;
      case 'vendor_quoted':
        return <AlertCircle className="text-blue-400" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
    }
  };

  const getVibeColor = (vibe: string) => {
    const colors: Record<string, string> = {
      wellness: 'bg-green-900 text-green-200',
      adventure: 'bg-orange-900 text-orange-200',
      culinary: 'bg-red-900 text-red-200',
      cultural: 'bg-purple-900 text-purple-200',
      luxury: 'bg-yellow-900 text-yellow-200'
    };
    return colors[vibe] || 'bg-gray-700 text-gray-200';
  };

  const stats = {
    total: requests.length,
    approved: requests.filter(r => r.status === 'approved').length,
    pending: requests.filter(r => r.status === 'under_review').length,
    quoted: requests.filter(r => r.status === 'vendor_quoted').length,
    vendorInterest: requests.reduce((sum, r) => sum + r.interested_vendor_count, 0)
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Journey Requests Dashboard</h1>
          <p className="text-gray-400">Review visitor requests, approve/assign to vendors, track engagement</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#556B2F]">
            <div className="text-gray-400 text-sm mb-2">Total Requests</div>
            <div className="text-3xl font-bold text-[#FFD700]">{stats.total}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-green-700">
            <div className="text-gray-400 text-sm mb-2">Approved</div>
            <div className="text-3xl font-bold text-green-400">{stats.approved}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-yellow-700">
            <div className="text-gray-400 text-sm mb-2">Under Review</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-blue-700">
            <div className="text-gray-400 text-sm mb-2">Vendor Quoted</div>
            <div className="text-3xl font-bold text-blue-400">{stats.quoted}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#FFD700]">
            <div className="text-gray-400 text-sm mb-2">Vendor Interest</div>
            <div className="text-3xl font-bold text-[#FFD700]">{stats.vendorInterest}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['all', 'under_review', 'approved', 'vendor_quoted'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                filter === status
                  ? 'bg-[#556B2F] text-[#FFD700]'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]'
              }`}
            >
              {status === 'all' ? 'All Requests' : status.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="bg-[#2a2a2a] p-12 rounded-lg text-center">
            <AlertCircle className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400">No journey requests found</p>
          </div>
        ) : (
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#556B2F]">
                <tr>
                  <th className="px-6 py-4 text-left">Request</th>
                  <th className="px-6 py-4 text-left">Visitor</th>
                  <th className="px-6 py-4 text-center">Duration</th>
                  <th className="px-6 py-4 text-center">Budget</th>
                  <th className="px-6 py-4 text-center">Vibe</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Interest</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a3a]">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-[#333333] transition">
                    <td className="px-6 py-4">
                      <Link href={`/admin/journey-requests/${request.id}`} className="hover:text-[#FFD700] transition">
                        <div className="font-semibold text-white">{request.title}</div>
                        <div className="text-sm text-gray-400">{request.id.substring(0, 8)}...</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold">{request.visitor_name}</div>
                        <div className="text-sm text-gray-400">{request.visitor_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{request.duration_days} days</td>
                    <td className="px-6 py-4 text-center font-semibold text-[#FFD700]">${request.budget_usd_max}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getVibeColor(request.vibe)}`}>
                        {request.vibe}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="text-sm">{request.status.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {request.interested_vendor_count > 0 ? (
                        <span className="flex items-center justify-center gap-1 text-green-400 font-bold">
                          <Users size={16} />
                          {request.interested_vendor_count}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleForward(request.id)}
                          className="px-3 py-1 bg-[#556B2F] text-[#FFD700] rounded hover:opacity-90 text-sm font-semibold"
                          title="Forward to vendor"
                        >
                          Forward
                        </button>
                        <Link
                          href={`/admin/journey-requests/${request.id}`}
                          className="text-[#FFD700] hover:text-white transition inline-block"
                        >
                          <MessageSquare size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-lg border-l-4 border-green-600">
            <h3 className="text-lg font-bold text-green-400 mb-3">How It Works</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✓ Visitor submits journey request</li>
              <li>✓ System matches to policy + vendors</li>
              <li>✓ Admin reviews approval if needed</li>
              <li>✓ Vendors notified + send quotes</li>
              <li>✓ Journey created + booked</li>
            </ul>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border-l-4 border-[#FFD700]">
            <h3 className="text-lg font-bold text-[#FFD700] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/admin/journey-policies" className="block text-[#FFD700] hover:text-white transition">
                → Configure Policies
              </Link>
              <Link href="/admin/journey-requests?status=under_review" className="block text-[#FFD700] hover:text-white transition">
                → Review Pending Requests
              </Link>
              <Link href="/admin/analytics/journey-requests" className="block text-[#FFD700] hover:text-white transition">
                → View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
