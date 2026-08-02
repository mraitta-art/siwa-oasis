'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FieldRequest {
  id: number;
  business_id: string;
  vendor_id: string;
  section_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  business_name: string;
  business_type_id: string;
  section_name?: string;
  vendor_name?: string;
}

export default function AdminFieldRequestsPage() {
  const [requests, setRequests] = useState<FieldRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/admin/field-requests');
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      } else {
        setError(data.error || 'Failed to load requests');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: number, status: 'approved' | 'rejected') {
    setActionMsg('Processing...');
    try {
      const res = await fetch('/api/admin/field-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(`✅ Request successfully ${status}!`);
        // Refresh list
        fetchRequests();
      } else {
        setActionMsg(`❌ ${data.error || 'Action failed'}`);
      }
    } catch {
      setActionMsg('❌ Network error');
    }
    setTimeout(() => setActionMsg(''), 5000);
  }

  const filtered = requests.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 font-sans pb-12">
      {/* Header */}
      <div className="border-b border-amber-100 bg-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="text-[#D4AF37]">💡</span> Vendor Field Requirements
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
              Review custom field suggestions and requirements requested by partners. Approved suggestions are auto-provisioned.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition font-bold text-sm">
              ← Admin Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex justify-between items-center gap-4 flex-wrap mb-8 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
            {['all', 'pending', 'approved', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                  filterStatus === st
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>

          {actionMsg && (
            <div className="text-xs font-bold text-[#D4AF37]">{actionMsg}</div>
          )}
        </div>

        {/* Requests Table/List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="mt-3 text-slate-400 text-sm font-semibold">Loading requests queue...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-6 text-center">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-base font-extrabold text-slate-800">No field requests found</h3>
            <p className="text-xs text-slate-400 mt-1">Vendor suggestions matching this filter will show up here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filtered.map(req => (
              <div 
                key={req.id} 
                className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-amber-200 transition"
              >
                {/* Request Content Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '3px 8px',
                      borderRadius: '20px',
                      background: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: req.status === 'approved' ? '#15803d' : req.status === 'rejected' ? '#b91c1c' : '#d97706',
                      textTransform: 'uppercase',
                    }}>
                      {req.status}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Submitted: {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                      {req.field_label}
                    </h3>
                    <div className="text-xs text-slate-400 font-semibold mt-1 flex gap-4 flex-wrap">
                      <span>🏪 Business: <strong className="text-slate-600">{req.business_name}</strong></span>
                      <span>🔑 Key: <code className="bg-slate-50 px-1.5 py-0.5 rounded text-amber-600">{req.field_name}</code></span>
                      <span>🧬 Type: <strong className="text-slate-600">{req.field_type}</strong></span>
                    </div>
                  </div>

                  {/* Business Requirement/Reason */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Reason</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {req.reason || 'No specific reason provided.'}
                    </p>
                  </div>

                  {/* Context Info */}
                  <div className="text-xs text-slate-400 font-bold flex gap-4 flex-wrap">
                    <span>🧬 Business Type: <code className="bg-slate-100 px-1 py-0.5 rounded">{req.business_type_id}</code></span>
                    <span>📋 Target Section: <code className="bg-slate-100 px-1 py-0.5 rounded">{req.section_name || req.section_id}</code></span>
                    {req.vendor_name && <span>👤 Vendor: <strong className="text-slate-500">{req.vendor_name}</strong></span>}
                  </div>
                </div>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex md:flex-col justify-end gap-3 self-center min-w-[150px] w-full md:w-auto">
                    <button 
                      onClick={() => handleAction(req.id, 'approved')}
                      className="flex-1 md:flex-initial rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 px-6 shadow-sm transition"
                    >
                      Approve & Provision
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="flex-1 md:flex-initial rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs py-2.5 px-6 transition"
                    >
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
