'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import JourneyCustomizerEditor from './JourneyCustomizerEditor';
import {
  Compass, MapPin, Calendar, Users, Sparkles, Check, CheckCircle, Clock,
  ArrowRight, ShieldCheck, Tag, Phone, Share2, Search, Filter, RefreshCw,
  ExternalLink, UserCheck, AlertCircle, MessageSquare, ChevronDown, CheckCircle2,
  DollarSign
} from 'lucide-react';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US').format(Math.round(value));

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
  custom_details?: any;
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
  const [showCatalogEditor, setShowCatalogEditor] = useState(false);

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

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      const term = search.toLowerCase().trim();
      const matchesSearch = !term ||
        r.request_code?.toLowerCase().includes(term) ||
        r.customer_name?.toLowerCase().includes(term) ||
        r.customer_phone?.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [filterStatus, requests, search]);

  const stats = useMemo(() => {
    const totalGrossVolume = requests.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0);
    const totalSavingsGiven = requests.reduce((sum, r) => sum + (Number(r.discount_amount) || 0), 0);
    const openRequestsCount = requests.filter(r => r.status === 'open' || r.status === 'pending').length;
    return { totalGrossVolume, totalSavingsGiven, openRequestsCount };
  }, [requests]);

  const { totalGrossVolume, totalSavingsGiven, openRequestsCount } = stats;

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-slate-100 p-4 text-slate-900 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700">
              <Compass size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">SiWiFy operations</p>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                Custom Journey Request Center
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCatalogEditor(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <Tag size={13} />
              <span>Customize visitor options</span>
            </button>
            <Link
              href="/customize-journey"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <span>Open Customizer</span>
              <ExternalLink size={13} />
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-[11px] font-bold text-white shadow transition hover:bg-slate-700 disabled:cursor-progress"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-5 text-xs text-slate-600">
          Master monitoring, vendor dispatch, and live conversion tracking across the Siwa journey pipeline.
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Requests
          </div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {requests.length}
          </div>
          <div className="mt-1 text-[11px] font-bold text-slate-600">
            {openRequestsCount} currently active
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Pipeline Value
          </div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-slate-800">
            {formatCurrency(totalGrossVolume)} <span className="text-xs font-sans text-slate-500">EGP</span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-slate-600">
            Direct local bookings
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bundle Savings Delivered
          </div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-slate-800">
            {formatCurrency(totalSavingsGiven)} <span className="text-xs font-sans text-slate-500">EGP</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Via 15% multi-experience discount
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Verified Vendors
          </div>
          <div className="mt-1 text-2xl font-extrabold text-slate-800">
            {businesses.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Hotels, Safaris, Camps & Guides
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row">
        <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
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
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-200'
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
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <Compass size={36} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-700">
            No Custom Journey Requests Found
          </h3>
          <p className="mx-auto max-w-sm text-xs text-slate-500">
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
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >
                {/* Header row */}
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-700">
                      {req.request_code || 'SIW-XXXXXX'}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <span>{req.customer_name}</span>
                        {req.travel_dates && (
                          <span className="text-xs font-normal text-slate-400">
                            • {req.travel_dates}
                          </span>
                        )}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                        <span>📞 {req.customer_phone}</span>
                        {req.customer_email && <span>✉️ {req.customer_email}</span>}
                        <span>👥 {req.adults_count} Adults{req.children_count > 0 ? `, ${req.children_count} Children` : ''}</span>
                        <span>⏱️ {req.duration_days} Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      req.status === 'confirmed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : req.status === 'cancelled'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                      {req.status}
                    </span>

                    <select
                      value={req.status}
                      onChange={e => updateStatus(req.id, e.target.value)}
                      className="rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
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
                  <div className="space-y-1 rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Selected Experiences ({req.selected_experiences?.length || 0})
                    </div>
                    <div className="space-y-1 pt-1">
                      {(req.selected_experiences || []).map((exp: any, i: number) => (
                        <div key={i} className="text-slate-600">
                          • {typeof exp === 'object' ? (
                            exp.title_en && exp.title_ar ? (
                              <span className="inline-flex flex-col align-top">
                                <span>{exp.title_en}</span>
                                <span dir="rtl" lang="ar" className="text-slate-500">{exp.title_ar}</span>
                              </span>
                            ) : (exp.title || exp.name || exp.id)
                          ) : exp}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stay & Transport */}
                  <div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Stay, Transport & Hospitality
                    </div>
                    <div className="text-slate-600">
                      <strong>🛏️ Stay:</strong> {req.custom_details?.catalog_snapshot?.accommodation?.title_en
                        ? <span className="inline-flex flex-col"><span>{req.custom_details.catalog_snapshot.accommodation.title_en}</span><span dir="rtl" lang="ar" className="text-slate-500">{req.custom_details.catalog_snapshot.accommodation.title_ar}</span></span>
                        : (req.accommodation_preference || 'None')}
                    </div>
                    <div className="text-slate-600">
                      <strong>🚙 Vehicle:</strong> {req.custom_details?.catalog_snapshot?.transport?.title_en
                        ? <span className="inline-flex flex-col"><span>{req.custom_details.catalog_snapshot.transport.title_en}</span><span dir="rtl" lang="ar" className="text-slate-500">{req.custom_details.catalog_snapshot.transport.title_ar}</span></span>
                        : (req.transport_preference || 'None')}
                    </div>
                    <div className="text-slate-600">
                      <strong>🍽️ Meals:</strong> {req.custom_details?.catalog_snapshot?.meal?.title_en
                        ? <span className="inline-flex flex-col"><span>{req.custom_details.catalog_snapshot.meal.title_en}</span><span dir="rtl" lang="ar" className="text-slate-500">{req.custom_details.catalog_snapshot.meal.title_ar}</span></span>
                        : (req.meal_preference || 'Standard')}
                    </div>
                    <div className="text-slate-600">
                      <strong>🗣️ Guide:</strong> {req.guide_language || 'Arabic / English'}
                    </div>
                  </div>

                  {/* Pricing & Financials */}
                  <div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Financial Summary
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Estimated:</span>
                      <span className="font-mono">{formatCurrency(Number(req.estimated_price))} EGP</span>
                    </div>
                    {req.discount_amount > 0 && (
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>Bundle Discount (15%):</span>
                        <span className="font-mono">-{formatCurrency(Number(req.discount_amount))} EGP</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold text-slate-800">
                      <span>Net Total:</span>
                      <span className="font-mono">{formatCurrency(Number(req.final_price))} EGP</span>
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
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${waText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                    >
                      <span>💬 WhatsApp Client</span>
                    </a>

                    <Link
                      href={`/visitor/journey-request/${req.id}`}
                      target="_blank"
                      className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                      <span>👁️ Visitor View</span>
                    </Link>

                    <button
                      onClick={() => setRouteModalReq(req)}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Route Request [{routeModalReq.request_code}] to Verified Vendor
            </h3>
            <p className="text-xs text-slate-500">
              Select an active local Siwan business (lodge, safari operator, restaurant) to dispatch this request to their vendor dashboard.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Select Business / Vendor:
              </label>
              <select
                value={selectedBizId}
                onChange={e => setSelectedBizId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:outline-none"
              >
                <option value="">-- Choose a vendor business --</option>
                {businesses.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.subscription_tier || 'standard'} · {b.type_id || 'general'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setRouteModalReq(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignVendor}
                disabled={!selectedBizId || dispatching}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {dispatching ? 'Assigning...' : 'Assign & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCatalogEditor && (
        <JourneyCustomizerEditor onClose={() => setShowCatalogEditor(false)} />
      )}

    </div>
  );
}
