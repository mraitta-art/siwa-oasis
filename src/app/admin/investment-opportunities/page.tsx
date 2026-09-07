'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface InvestmentOpportunity {
  id: string;
  business_id?: string;
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
  verification_count?: number;
  show_on_minisite?: boolean;
  minisite_display_mode?: 'section' | 'page';
}

interface ContactVerification {
  slot_number: number;
  phone: string;
  contact_name: string | null;
  verified: boolean | number;
  called_at: string | null;
  notes: string | null;
}

export default function AdminInvestmentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [verificationByBusiness, setVerificationByBusiness] = useState<Record<string, ContactVerification[]>>({});

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  async function loadOpportunities() {
    setLoading(true);
    setError('');
    fetch('/api/admin/investment-opportunities')
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load opportunities');
        setOpportunities(data.items || []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function updateOpportunity(id: string, updates: Record<string, any>) {
    setActionBusy(id);
    setError('');
    try {
      const response = await fetch('/api/admin/investment-opportunities', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error('Failed to update opportunity');
      setOpportunities(current => current.map(item => item.id === id ? { ...item, ...updates } : item));
      setNotice('Opportunity updated');
      setTimeout(() => setNotice(''), 2500);
    } catch (err: any) { setError(err.message); }
    finally { setActionBusy(null); }
  }

  async function deleteOpportunity(id: string) {
    if (!window.confirm('Remove this investment opportunity from the business?')) return;
    setActionBusy(id);
    try {
      const response = await fetch(`/api/admin/investment-opportunities?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete opportunity');
      setOpportunities(current => current.filter(item => item.id !== id));
      setNotice('Opportunity removed');
      setTimeout(() => setNotice(''), 2500);
    } catch (err: any) { setError(err.message); }
    finally { setActionBusy(null); }
  }

  async function loadVerification(businessId: string) {
    const response = await fetch(`/api/admin/investment-opportunities/verification?businessId=${encodeURIComponent(businessId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load verification records');
    setVerificationByBusiness(current => ({ ...current, [businessId]: data.items || [] }));
  }

  async function verifyContact(businessId: string, contact: ContactVerification) {
    const contactName = window.prompt(`Name confirmed for ${contact.phone}`, contact.contact_name || '');
    if (!contactName?.trim()) return;
    const notes = window.prompt('Optional call notes', contact.notes || '') || '';
    const response = await fetch('/api/admin/investment-opportunities/verification', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, slotNumber: contact.slot_number, verified: true, contactName, notes }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save verification');
    await loadVerification(businessId);
    setOpportunities(current => current.map(item => item.id === businessId ? { ...item, verification_count: (item.verification_count || 0) + (contact.verified ? 0 : 1) } : item));
    setNotice(`Contact ${contact.slot_number} verified`);
    setTimeout(() => setNotice(''), 2500);
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    if (filterStatus !== 'all' && opp.status !== filterStatus) return false;
    if (filterApproval !== 'all' && opp.approval_status !== filterApproval) return false;
    if (filterVisibility !== 'all') {
      if (filterVisibility === 'visible' && !opp.visibility_on_main_site) return false;
      if (filterVisibility === 'hidden' && opp.visibility_on_main_site) return false;
    }
    return true;
  });

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
          <Link href="/jana/businesses" className="px-6 py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold rounded-2xl transition shadow-sm">
            + Create from Business Form
          </Link>
          <button onClick={loadOpportunities} disabled={loading} className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50 disabled:opacity-50">
            {loading ? 'Refreshing...' : 'Refresh'}
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

        {error && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        {notice && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

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
                {loading && <tr><td colSpan={9} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">Loading business opportunities...</td></tr>}
                {!loading && filteredOpportunities.length === 0 && <tr><td colSpan={9} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">No business has submitted an investment opportunity yet.</td></tr>}
                {filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                    <td className="px-6 py-4 font-extrabold text-slate-800">{opp.opportunity_title}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{opp.business_name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{opp.opportunity_type}</td>
                    <td className="px-6 py-4 font-black text-slate-800">${opp.investment_amount_min.toLocaleString()} - ${opp.investment_amount_max.toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-[#D4AF37]">{opp.expected_roi_percent}%</td>
                    <td className="px-6 py-4 font-semibold text-slate-500">{opp.investors_current}/{opp.target_investors}</td>
                    <td className="px-6 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${getStatusColor(opp.status)}`}>{opp.status}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${getApprovalColor(opp.approval_status)}`}>{opp.approval_status}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button disabled={actionBusy === opp.id} onClick={() => updateOpportunity(opp.id, { visibility_on_main_site: !opp.visibility_on_main_site })} className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition disabled:opacity-50">
                          {opp.visibility_on_main_site ? 'Hide' : 'Show'}
                        </button>
                        <button disabled={actionBusy === opp.id || opp.approval_status !== 'approved'} onClick={() => updateOpportunity(opp.id, { show_on_minisite: !opp.show_on_minisite })} className="px-3 py-1.5 text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-indigo-700 font-bold transition disabled:opacity-50">
                          {opp.show_on_minisite ? 'Hide Minisite' : 'Show Minisite'}
                        </button>
                        {opp.approval_status === 'pending' && <>
                          <button disabled={actionBusy === opp.id} onClick={() => updateOpportunity(opp.id, { approval_status: 'approved', status: 'published', visibility_on_main_site: true, show_on_minisite: true })} className="px-3 py-1.5 text-xs bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold transition disabled:opacity-50">Approve</button>
                          <button disabled={actionBusy === opp.id} onClick={() => updateOpportunity(opp.id, { approval_status: 'rejected', visibility_on_main_site: false })} className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition disabled:opacity-50">Reject</button>
                        </>}
                        <button disabled={actionBusy === opp.id} onClick={() => deleteOpportunity(opp.id)} className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition disabled:opacity-50">Delete</button>
                        <button onClick={() => loadVerification(opp.id)} className="px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl text-blue-700 font-bold transition">Calls {opp.verification_count || 0}/3</button>
                      </div>
                      {verificationByBusiness[opp.id] && <div className="mt-3 min-w-[260px] rounded-xl bg-slate-50 p-3 text-xs">
                        <div className="mb-2 font-black uppercase tracking-wider text-slate-400">Manual responsibility calls</div>
                        {verificationByBusiness[opp.id].map(contact => <div key={contact.slot_number} className="flex items-center justify-between gap-2 border-b border-slate-200 py-2 last:border-0">
                          <span className="font-semibold text-slate-600">{contact.slot_number}. {contact.phone}<br /><span className="text-slate-400">{contact.contact_name || 'Name not recorded'}</span></span>
                          {contact.verified ? <span className="font-black text-emerald-600">Verified</span> : <button onClick={() => verifyContact(opp.id, contact)} className="rounded-lg bg-white px-2 py-1 font-bold text-amber-700 shadow-sm">Log call</button>}
                        </div>)}
                      </div>}
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
        {false && (
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
                  onClick={() => undefined}
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
