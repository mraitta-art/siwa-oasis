'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass, MapPin, Calendar, Users, Sparkles, Check, CheckCircle, Clock,
  ArrowRight, ShieldCheck, Tag, Phone, Share2, Search, Filter, RefreshCw,
  ExternalLink, UserCheck, AlertCircle, MessageSquare, ChevronDown, CheckCircle2,
  DollarSign
} from 'lucide-react';

interface JourneyRequest {
  id: string;
  request_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  duration_days: number;
  travel_dates?: string;
  adults_count: number;
  children_count: number;
  selected_experiences: any[];
  accommodation_preference?: string;
  transport_preference?: string;
  meal_preference?: string;
  guide_language?: string;
  special_notes?: string;
  estimated_price: number;
  discount_amount: number;
  final_price: number;
  status: string;
  created_at: string;
  dispatches?: any[];
  offers?: any[];
}

export default function SuperAdminJourneyRequestsPage() {
  const [requests, setRequests] = useState<JourneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [businesses, setBusinesses] = useState<any[]>([]);

  // Modal for routing/dispatching request to a vendor
  const [routeModalReq, setRouteModalReq] = useState<JourneyRequest | null>(null);
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [dispatching, setDispatching] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, bizRes] = await Promise.all([
        fetch('/api/journeys/custom-dispatch'),
        fetch('/api/jana/businesses')
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(Array.isArray(data) ? data : []);
      }
      if (bizRes.ok) {
        const bizData = await bizRes.json();
        setBusinesses(Array.isArray(bizData) ? bizData : []);
      }
    } catch (e) {
      console.error('Failed to load journey requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update status of journey request
  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/journeys/custom-dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dispatch / Assign a vendor to this request
  const handleAssignVendor = async () => {
    if (!routeModalReq || !selectedBizId) return;
    setDispatching(true);
    try {
      const res = await fetch('/api/journeys/custom-dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: routeModalReq.id,
          business_id: selectedBizId,
          vendor_status: 'dispatched'
        })
      });
      if (res.ok) {
        setRouteModalReq(null);
        setSelectedBizId('');
        await loadData();
      } else {
        alert('Could not assign vendor');
      }
    } catch {
      alert('Network error while assigning vendor');
    } finally {
      setDispatching(false);
    }
  };

  // Filter requests
  const filtered = requests.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const term = search.toLowerCase().trim();
    const matchesSearch = !term ||
      r.request_code?.toLowerCase().includes(term) ||
      r.customer_name?.toLowerCase().includes(term) ||
      r.customer_phone?.includes(term);
    return matchesStatus && matchesSearch;
  });

  // Calculate high-level stats
  const totalGrossVolume = requests.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0);
  const totalSavingsGiven = requests.reduce((sum, r) => sum + (Number(r.discount_amount) || 0), 0);
  const openRequestsCount = requests.filter(r => r.status === 'open' || r.status === 'pending').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Compass size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                🛡️ Custom Journey Requests Command Center
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Master monitoring, automated vendor dispatch & live conversion tracking across SiWiFy
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/customize-journey"
            target="_blank"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
          >
            <span>Open Customizer</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#D4AF37] text-black hover:bg-[#e5c158] flex items-center gap-1.5 transition shadow"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Total Requests
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {requests.length}
          </div>
          <div className="text-[11px] text-amber-500 font-bold mt-1">
            {openRequestsCount} currently active
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Total Pipeline Value
          </div>
          <div className="text-2xl font-extrabold text-[#D4AF37] font-mono mt-1">
            {totalGrossVolume.toLocaleString()} <span className="text-xs font-sans text-slate-500">EGP</span>
          </div>
          <div className="text-[11px] text-emerald-500 font-bold mt-1">
            Direct local bookings
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Bundle Savings Delivered
          </div>
          <div className="text-2xl font-extrabold text-emerald-500 font-mono mt-1">
            {totalSavingsGiven.toLocaleString()} <span className="text-xs font-sans text-slate-500">EGP</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Via 15% Multi-Experience Discount
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Active Verified Vendors
          </div>
          <div className="text-2xl font-extrabold text-indigo-500 mt-1">
            {businesses.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Hotels, Safaris, Camps & Guides
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-[#0C121E] p-3 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'open', label: 'Open' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white dark:bg-[#D4AF37] dark:text-black shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search code, name, phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-black/40 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Loading journey requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0D1524] border border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-12 text-center space-y-3">
          <Compass size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No Custom Journey Requests Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When visitors use the interactive tour customizer at /customize-journey, their custom requests and vendor dispatch records appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => {
            const waText = encodeURIComponent(`Hi ${req.customer_name}! This is SiWiFy Concierge regarding your custom journey request [${req.request_code}]. We have received your itinerary for ${req.duration_days} days in Siwa.`);
            const cleanPhone = (req.customer_phone || '').replace(/[^\d+]/g, '');

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-[#D4AF37]/50 transition shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-bold">
                      {req.request_code || 'SIW-XXXXXX'}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{req.customer_name}</span>
                        {req.travel_dates && (
                          <span className="text-xs font-normal text-slate-400">
                            • {req.travel_dates}
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                        <span>📞 {req.customer_phone}</span>
                        {req.customer_email && <span>✉️ {req.customer_email}</span>}
                        <span>👥 {req.adults_count} Adults{req.children_count > 0 ? `, ${req.children_count} Children` : ''}</span>
                        <span>⏱️ {req.duration_days} Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      req.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : req.status === 'cancelled'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {req.status}
                    </span>

                    <select
                      value={req.status}
                      onChange={e => updateStatus(req.id, e.target.value)}
                      className="text-xs bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-xl px-2.5 py-1 text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Experiences */}
                  <div className="space-y-1 bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                    <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                      Selected Experiences ({req.selected_experiences?.length || 0})
                    </div>
                    <div className="space-y-1 pt-1">
                      {(req.selected_experiences || []).map((exp: any, i: number) => (
                        <div key={i} className="text-slate-600 dark:text-slate-300 truncate">
                          • {typeof exp === 'object' ? (exp.title || exp.name || exp.id) : exp}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stay & Transport */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                    <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                      Stay, Transport & Hospitality
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      <strong>🛏️ Stay:</strong> {req.accommodation_preference || 'None'}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      <strong>🚙 Vehicle:</strong> {req.transport_preference || 'None'}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      <strong>🍽️ Meals:</strong> {req.meal_preference || 'Standard'}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      <strong>🗣️ Guide:</strong> {req.guide_language || 'Arabic / English'}
                    </div>
                  </div>

                  {/* Pricing & Financials */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                    <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                      Financial Summary
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Gross Estimated:</span>
                      <span className="font-mono">{Number(req.estimated_price).toLocaleString()} EGP</span>
                    </div>
                    {req.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-500 font-bold">
                        <span>Bundle Discount (15%):</span>
                        <span className="font-mono">-{Number(req.discount_amount).toLocaleString()} EGP</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-[#D4AF37] pt-1 border-t border-slate-200 dark:border-white/10">
                      <span>Net Total:</span>
                      <span className="font-mono">{Number(req.final_price).toLocaleString()} EGP</span>
                    </div>
                  </div>
                </div>

                {/* Special Notes if any */}
                {req.special_notes && (
                  <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 p-2.5 rounded-xl">
                    <strong>Traveler Notes:</strong> {req.special_notes}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${waText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <span>💬 WhatsApp Client</span>
                    </a>

                    <Link
                      href={`/visitor/journey-request/${req.id}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <span>👁️ Visitor View</span>
                    </Link>

                    <button
                      onClick={() => setRouteModalReq(req)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <UserCheck size={13} />
                      <span>Route to Vendor</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Received: {new Date(req.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ROUTE / DISPATCH MODAL */}
      {routeModalReq && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Route Request [{routeModalReq.request_code}] to Verified Vendor
            </h3>
            <p className="text-xs text-slate-500">
              Select an active local Siwan business (lodge, safari operator, restaurant) to dispatch this request to their vendor dashboard.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Business / Vendor:
              </label>
              <select
                value={selectedBizId}
                onChange={e => setSelectedBizId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
              >
                <option value="">-- Choose a vendor business --</option>
                {businesses.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.subscription_tier || 'standard'} · {b.type_id || 'general'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setRouteModalReq(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignVendor}
                disabled={!selectedBizId || dispatching}
                className="px-5 py-2 rounded-xl bg-[#D4AF37] text-black font-bold text-xs hover:bg-[#e5c158] transition disabled:opacity-50"
              >
                {dispatching ? 'Assigning...' : 'Assign & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
