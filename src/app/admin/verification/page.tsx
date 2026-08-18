'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VerificationRequest {
  profile_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  trust_rejection_note: string | null;
  id_doc_front_url: string;
  id_doc_back_url: string;
  ownership_doc_url: string;
  terms_accepted_at: string | null;
  terms_accepted_ip: string | null;
  business_id: string | null;
  business_name: string | null;
  business_slug: string | null;
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/verification');
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Load verification requests error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(profileId: string) {
    if (!confirm('Are you sure you want to verify this vendor and grant them the gold Trusted Vendor badge?')) return;
    setActionInProgress(true);
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'approve' })
      });
      if (res.ok) {
        alert('✅ Vendor verified and Trusted badge issued!');
        loadRequests();
        setSelectedRequest(null);
      } else {
        const errData = await res.json();
        alert(`Approval failed: ${errData.error || 'Unknown error'}`);
      }
    } catch {
      alert('Error approving verification');
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleReject(profileId: string) {
    if (!rejectionNotes.trim()) {
      alert('Please specify a rejection reason for the vendor.');
      return;
    }
    setActionInProgress(true);
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'reject', rejectionNote: rejectionNotes })
      });
      if (res.ok) {
        alert('❌ Request rejected and vendor notified.');
        loadRequests();
        setSelectedRequest(null);
        setRejectionNotes('');
        setShowRejectForm(false);
      } else {
        const errData = await res.json();
        alert(`Rejection failed: ${errData.error || 'Unknown error'}`);
      }
    } catch {
      alert('Error rejecting verification');
    } finally {
      setActionInProgress(false);
    }
  }

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.verification_status === filterStatus;
  });

  const statusBadgeClass = (status: string) => {
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (status === 'rejected') return 'bg-rose-50 text-rose-600 border border-rose-200';
    return 'bg-slate-50 text-slate-500 border border-slate-200';
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <Link href="/admin" className="text-slate-400 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition mb-3 block">
            ← Control Center
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">🛡️ Vendor Verification Auditing</h1>
          <p className="text-slate-400 text-sm font-semibold">Verify national IDs, ownership deeds, and issue gold trust marks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          
          {/* LEFT — Queue list */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            {/* Filters */}
            <div className="flex gap-2 mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
              {([
                { key: 'pending', label: '⏳ Pending Review' },
                { key: 'verified', label: '✅ Verified/Trusted' },
                { key: 'rejected', label: '❌ Rejected' },
                { key: 'all', label: '📋 All Submissions' }
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => {
                    setFilterStatus(f.key);
                    setSelectedRequest(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                    filterStatus === f.key
                      ? 'bg-white text-[#D4AF37] shadow-sm border border-slate-100'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <i className="fas fa-circle-notch fa-spin fa-2x mb-2" />
                <p className="text-sm font-semibold">Loading verification requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-400 font-bold text-base mb-1">No requests found</p>
                <p className="text-slate-300 text-xs font-semibold">No submissions match the selected filter status.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map(r => (
                  <div
                    key={r.profile_id}
                    onClick={() => {
                      setSelectedRequest(r);
                      setShowRejectForm(false);
                      setRejectionNotes('');
                    }}
                    className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      selectedRequest?.profile_id === r.profile_id
                        ? 'border-[#D4AF37] bg-amber-50/20'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-extrabold text-slate-800 text-base">{r.display_name}</span>
                        <span className={`text-[0.62rem] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass(r.verification_status)}`}>
                          {r.verification_status.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs font-semibold text-slate-500">
                        <div>📧 {r.email} {r.phone && `| 📞 ${r.phone}`}</div>
                        <div>🏪 Business: <strong className="text-slate-700">{r.business_name || 'N/A'}</strong></div>
                        {r.terms_accepted_at && (
                          <div className="text-[0.68rem] text-slate-400">
                            ✍️ Responsibility Accepted: {formatDateTime(r.terms_accepted_at)} (IP: {r.terms_accepted_ip})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.id_doc_front_url ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`} title="ID Front">ID</span>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.ownership_doc_url ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`} title="Deed/Ownership">📄</span>
                      </div>
                      <i className="fas fa-chevron-right text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Document Viewer & Actions */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
            {selectedRequest ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-1">{selectedRequest.display_name}</h2>
                  <p className="text-slate-400 text-xs font-semibold">Audit documents & issue Trusted badge</p>
                </div>

                {/* Terms of Acceptance audit */}
                {selectedRequest.terms_accepted_at && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold text-slate-500">
                    <span className="text-emerald-600 font-bold block mb-1">✓ Responsibility Accepted</span>
                    The vendor formally signed the legal responsibility agreement on {formatDateTime(selectedRequest.terms_accepted_at)} from IP address {selectedRequest.terms_accepted_ip}.
                  </div>
                )}

                {/* Documents Previews */}
                <div className="space-y-4">
                  {/* Front */}
                  <div>
                    <label className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">National ID Front</label>
                    <a
                      href={selectedRequest.id_doc_front_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-slate-100 rounded-xl overflow-hidden group hover:border-slate-200 transition"
                    >
                      {selectedRequest.id_doc_front_url.toLowerCase().endsWith('.pdf') ? (
                        <div className="p-4 bg-slate-50 text-center text-[#D4AF37]">
                          <i className="fas fa-file-pdf fa-2x mb-1" />
                          <div className="text-[0.7rem] font-bold">Open Front ID PDF</div>
                        </div>
                      ) : (
                        <img src={selectedRequest.id_doc_front_url} alt="ID Front" className="w-full h-64 object-contain bg-slate-50 group-hover:scale-[1.01] transition duration-200" />
                      )}
                    </a>
                  </div>

                  {/* Back */}
                  <div>
                    <label className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">National ID Back</label>
                    <a
                      href={selectedRequest.id_doc_back_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-slate-100 rounded-xl overflow-hidden group hover:border-slate-200 transition"
                    >
                      {selectedRequest.id_doc_back_url.toLowerCase().endsWith('.pdf') ? (
                        <div className="p-4 bg-slate-50 text-center text-[#D4AF37]">
                          <i className="fas fa-file-pdf fa-2x mb-1" />
                          <div className="text-[0.7rem] font-bold">Open Back ID PDF</div>
                        </div>
                      ) : (
                        <img src={selectedRequest.id_doc_back_url} alt="ID Back" className="w-full h-64 object-contain bg-slate-50 group-hover:scale-[1.01] transition duration-200" />
                      )}
                    </a>
                  </div>

                  {/* Ownership Proof */}
                  <div>
                    <label className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Deed & Ownership Proof</label>
                    <a
                      href={selectedRequest.ownership_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-slate-100 rounded-xl overflow-hidden group hover:border-slate-200 transition"
                    >
                      {selectedRequest.ownership_doc_url.toLowerCase().endsWith('.pdf') ? (
                        <div className="p-4 bg-slate-50 text-center text-[#D4AF37]">
                          <i className="fas fa-file-pdf fa-2x mb-1" />
                          <div className="text-[0.7rem] font-bold">Open Ownership PDF</div>
                        </div>
                      ) : (
                        <img src={selectedRequest.ownership_doc_url} alt="Ownership Proof" className="w-full h-64 object-contain bg-slate-50 group-hover:scale-[1.01] transition duration-200" />
                      )}
                    </a>
                  </div>
                </div>

                {/* Trust rejection reason block if previously rejected */}
                {selectedRequest.verification_status === 'rejected' && selectedRequest.trust_rejection_note && (
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs font-semibold text-rose-700">
                    <span className="font-bold block mb-1">Previous Rejection Reason</span>
                    &quot;{selectedRequest.trust_rejection_note}&quot;
                  </div>
                )}

                {/* Review Action Controls */}
                {selectedRequest.verification_status === 'pending' && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {!showRejectForm ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(selectedRequest.profile_id)}
                          disabled={actionInProgress}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
                        >
                          Approve & Trust
                        </button>
                        <button
                          onClick={() => setShowRejectForm(true)}
                          disabled={actionInProgress}
                          className="px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold text-sm transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in">
                        <label className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider block">Rejection Reason (Shown to Vendor)</label>
                        <textarea
                          rows={3}
                          value={rejectionNotes}
                          onChange={(e) => setRejectionNotes(e.target.value)}
                          placeholder="e.g. Uploaded ID front image is too blurry. Please scan again with direct lighting."
                          className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-rose-400 bg-slate-50 transition"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(selectedRequest.profile_id)}
                            disabled={actionInProgress || !rejectionNotes.trim()}
                            className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition disabled:opacity-50"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => setShowRejectForm(false)}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-300">
                <i className="fas fa-file-circle-check fa-3x mb-2 opacity-50" />
                <p className="text-sm font-semibold">Select a vendor from the queue to view their documents & verify them.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
