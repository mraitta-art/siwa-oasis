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
      case 'approved':    return <CheckCircle className="text-emerald-500" size={16} />;
      case 'rejected':    return <XCircle className="text-rose-500" size={16} />;
      case 'under_review': return <Clock className="text-amber-500" size={16} />;
      case 'vendor_quoted': return <AlertCircle className="text-blue-500" size={16} />;
      default:            return <Clock className="text-slate-400" size={16} />;
    }
  };

  const getVibeBadge = (vibe: string) => {
    const styles: Record<string, string> = {
      wellness:  'bg-emerald-50 text-emerald-700 border-emerald-200',
      adventure: 'bg-orange-50 text-orange-700 border-orange-200',
      culinary:  'bg-rose-50 text-rose-700 border-rose-200',
      cultural:  'bg-purple-50 text-purple-700 border-purple-200',
      luxury:    'bg-amber-50 text-amber-700 border-amber-200',
    };
    return styles[vibe] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const stats = {
    total:          requests.length,
    approved:       requests.filter(r => r.status === 'approved').length,
    pending:        requests.filter(r => r.status === 'under_review').length,
    quoted:         requests.filter(r => r.status === 'vendor_quoted').length,
    vendorInterest: requests.reduce((sum, r) => sum + r.interested_vendor_count, 0)
  };

  const filters = [
    { key: 'all',          label: 'All' },
    { key: 'under_review', label: '⏳ Under Review' },
    { key: 'approved',     label: '✅ Approved' },
    { key: 'vendor_quoted', label: '💬 Vendor Quoted' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">

        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <Link href="/admin" className="text-slate-400 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition mb-3 block">
            ← Control Center
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
            🗺️ Journey Requests
          </h1>
          <p className="text-slate-400 text-sm font-semibold">Review visitor requests, assign to vendors and track engagement</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-[#D4AF37]', bg: 'bg-amber-50 border-amber-200/60' },
            { label: 'Approved', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200/60' },
            { label: 'Under Review', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/60' },
            { label: 'Vendor Quoted', value: stats.quoted, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200/60' },
            { label: 'Vendor Interest', value: stats.vendorInterest, color: 'text-[#D4AF37]', bg: 'bg-amber-50 border-amber-200/60' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-5`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{s.label}</div>
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                filter === f.key
                  ? 'bg-white text-[#D4AF37] shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-semibold shadow-sm">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-400 font-semibold">No journey requests found</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-400 uppercase tracking-wider">Request</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-400 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">Budget</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">Vibe</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">Interest</th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <Link href={`/admin/journey-requests/${request.id}`} className="hover:text-[#D4AF37] transition">
                        <div className="font-extrabold text-slate-800 text-sm">{request.title}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{request.id.substring(0, 8)}...</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">{request.visitor_name}</div>
                      <div className="text-xs text-slate-400">{request.visitor_email}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-600">{request.duration_days}d</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-extrabold text-[#D4AF37]">${request.budget_usd_max}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getVibeBadge(request.vibe)}`}>
                        {request.vibe}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {getStatusIcon(request.status)}
                        <span className="text-xs font-semibold text-slate-600">{request.status.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {request.interested_vendor_count > 0 ? (
                        <span className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-sm">
                          <Users size={14} />
                          {request.interested_vendor_count}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleForward(request.id)}
                          className="px-3 py-1.5 bg-[#D4AF37] hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition"
                        >
                          Forward
                        </button>
                        <Link
                          href={`/admin/journey-requests/${request.id}`}
                          className="text-slate-400 hover:text-[#D4AF37] transition"
                        >
                          <MessageSquare size={16} />
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm border-l-4 border-l-emerald-400">
            <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> How It Works
            </h3>
            <ul className="text-sm text-slate-500 font-semibold space-y-2">
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400 shrink-0" /> Visitor submits journey request</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400 shrink-0" /> System matches to policy + vendors</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400 shrink-0" /> Admin reviews approval if needed</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400 shrink-0" /> Vendors notified + send quotes</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400 shrink-0" /> Journey created + booked</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm border-l-4 border-l-[#D4AF37]">
            <h3 className="text-base font-extrabold text-slate-800 mb-3">⚡ Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { href: '/admin/journey-policies', label: 'Configure Policies' },
                { href: '/admin/journey-requests?status=under_review', label: 'Review Pending Requests' },
                { href: '/admin/analytics', label: 'View Analytics' },
              ].map(a => (
                <Link key={a.href} href={a.href} className="flex items-center gap-2 text-sm font-bold text-[#D4AF37] hover:text-amber-700 transition">
                  <span>→</span> {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
