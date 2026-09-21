'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuctionItem {
  business_id: string;
  business_name: string;
  business_slug: string;
  type_name: string;
  type_icon: string;
  auction_title: string;
  auction_type: string;
  starting_price: string;
  reserve_price: string | null;
  buy_now_price: string | null;
  auction_start: string;
  auction_end: string;
  auction_status: 'upcoming' | 'live' | 'ended' | 'sold' | 'cancelled';
  auction_description: string;
  is_featured: boolean;
}

interface Business {
  id: string;
  name: string;
  slug: string;
}

const AUCTION_TYPES = ['asset', 'service', 'experience', 'property', 'license'];
const STATUSES: AuctionItem['auction_status'][] = ['upcoming', 'live', 'ended', 'sold', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  live:      'bg-red-500 text-white animate-pulse',
  upcoming:  'bg-blue-500 text-white',
  ended:     'bg-gray-600 text-gray-200',
  sold:      'bg-green-600 text-white',
  cancelled: 'bg-gray-700 text-gray-400',
};

const EMPTY_FORM = {
  business_id:   '',
  auction_title: '',
  auction_type:  'asset',
  auction_description: '',
  starting_price: '',
  reserve_price:  '',
  buy_now_price:  '',
  auction_start:  '',
  auction_end:    '',
  auction_status: 'upcoming' as AuctionItem['auction_status'],
  is_featured:    false,
  auction_contact: '',
  auction_terms:  '',
};

export default function AdminAuctionsPage() {
  const [auctions,    setAuctions]    = useState<AuctionItem[]>([]);
  const [businesses,  setBusinesses]  = useState<Business[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadAuctions();
    loadBusinesses();
  }, []);

  async function loadAuctions() {
    setLoading(true);
    try {
      const res = await fetch('/api/discovery/auctions?limit=200');
      const data = await res.json();
      setAuctions(data.items || []);
    } catch { setAuctions([]); }
    setLoading(false);
  }

  async function loadBusinesses() {
    try {
      const res = await fetch('/api/jana/businesses?limit=200');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.businesses || data.items || []);
      setBusinesses(arr.map((b: any) => ({ id: b.id, name: b.name, slug: b.slug })));
    } catch { setBusinesses([]); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    if (!form.business_id) { setSaveError('Please select a business.'); setSaving(false); return; }
    if (!form.auction_title) { setSaveError('Auction title is required.'); setSaving(false); return; }
    if (!form.starting_price) { setSaveError('Starting price is required.'); setSaving(false); return; }

    try {
      // Save the auction data into the business's custom_data via the vendor sections API
      const payload = {
        business_id: form.business_id,
        section_key: 'auction',
        data: {
          auction_title:       form.auction_title,
          auction_type:        form.auction_type,
          auction_description: form.auction_description,
          starting_price:      form.starting_price,
          reserve_price:       form.reserve_price  || null,
          buy_now_price:       form.buy_now_price   || null,
          auction_start:       form.auction_start   || null,
          auction_end:         form.auction_end     || null,
          auction_status:      form.auction_status,
          is_featured:         form.is_featured,
          auction_contact:     form.auction_contact || null,
          auction_terms:       form.auction_terms   || null,
          visibility_on_main_site: true,
        },
      };

      const res = await fetch('/api/jana/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveError(err.error || 'Failed to save auction.');
        return;
      }

      setSaveSuccess('Auction saved! Refreshing list…');
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadAuctions();
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = filterStatus === 'all' ? auctions : auctions.filter(a => a.auction_status === filterStatus);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
          <h1 className="text-xl font-bold">🔨 Auction Management</h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSaveError(''); setSaveSuccess(''); }}
          className="px-4 py-2 bg-[#D4AF37] text-black font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          {showForm ? '✕ Cancel' : '+ Create Auction'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Form */}
        {showForm && (
          <div className="mb-8 bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6 text-[#D4AF37]">Create / Update Auction</h2>

            {saveError   && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">{saveError}</div>}
            {saveSuccess  && <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">{saveSuccess}</div>}

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 mb-1">BUSINESS *</label>
                <select
                  value={form.business_id}
                  onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                  required
                >
                  <option value="">Select a business…</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 mb-1">AUCTION TITLE *</label>
                <input
                  type="text"
                  value={form.auction_title}
                  onChange={e => setForm(f => ({ ...f, auction_title: e.target.value }))}
                  placeholder="e.g. Premium Desert Safari Package"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              {/* Type & Status */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">AUCTION TYPE</label>
                <select
                  value={form.auction_type}
                  onChange={e => setForm(f => ({ ...f, auction_type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  {AUCTION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">STATUS</label>
                <select
                  value={form.auction_status}
                  onChange={e => setForm(f => ({ ...f, auction_status: e.target.value as AuctionItem['auction_status'] }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              {/* Prices */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">STARTING PRICE (USD) *</label>
                <input
                  type="number"
                  value={form.starting_price}
                  onChange={e => setForm(f => ({ ...f, starting_price: e.target.value }))}
                  placeholder="100"
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">BUY NOW PRICE (USD)</label>
                <input
                  type="number"
                  value={form.buy_now_price}
                  onChange={e => setForm(f => ({ ...f, buy_now_price: e.target.value }))}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">RESERVE PRICE (USD)</label>
                <input
                  type="number"
                  value={form.reserve_price}
                  onChange={e => setForm(f => ({ ...f, reserve_price: e.target.value }))}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">CONTACT (phone/email)</label>
                <input
                  type="text"
                  value={form.auction_contact}
                  onChange={e => setForm(f => ({ ...f, auction_contact: e.target.value }))}
                  placeholder="+20 111 234 5678"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">START DATE</label>
                <input
                  type="datetime-local"
                  value={form.auction_start}
                  onChange={e => setForm(f => ({ ...f, auction_start: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">END DATE</label>
                <input
                  type="datetime-local"
                  value={form.auction_end}
                  onChange={e => setForm(f => ({ ...f, auction_end: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 mb-1">DESCRIPTION</label>
                <textarea
                  value={form.auction_description}
                  onChange={e => setForm(f => ({ ...f, auction_description: e.target.value }))}
                  placeholder="Describe what's being auctioned…"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              {/* Terms */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 mb-1">TERMS & CONDITIONS</label>
                <textarea
                  value={form.auction_terms}
                  onChange={e => setForm(f => ({ ...f, auction_terms: e.target.value }))}
                  placeholder="Optional terms…"
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.is_featured}
                  onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="featured" className="text-sm text-gray-300">Feature this auction on the public page</label>
              </div>

              {/* Submit */}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#D4AF37] text-black font-bold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving…' : '💾 Save Auction'}
                </button>
                <Link href="/auctions" target="_blank" className="px-6 py-2.5 bg-gray-700 text-white font-bold text-sm rounded-lg hover:bg-gray-600 transition-colors">
                  👁 Preview Public Page
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <span className="text-sm text-gray-400 font-bold">Filter:</span>
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterStatus === s ? 'bg-[#D4AF37] text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">{filtered.length} auctions</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-gray-400">Loading auctions…</div>
        )}

        {/* Auctions Table */}
        {!loading && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-xs text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Auction</th>
                  <th className="px-4 py-3 text-left">Business</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Starting Price</th>
                  <th className="px-4 py-3 text-left">Buy Now</th>
                  <th className="px-4 py-3 text-left">Ends</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((auc, i) => (
                  <tr key={i} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{auc.auction_title}</div>
                      {auc.is_featured && <span className="text-[10px] text-[#D4AF37] font-bold">★ FEATURED</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{auc.business_name}</td>
                    <td className="px-4 py-3 text-gray-400">{auc.auction_type}</td>
                    <td className="px-4 py-3 text-white font-semibold">${parseFloat(auc.starting_price || '0').toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#D4AF37]">{auc.buy_now_price ? `$${parseFloat(auc.buy_now_price).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{auc.auction_end || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[auc.auction_status] || 'bg-gray-700 text-gray-300'}`}>
                        {auc.auction_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/vendor?business=${auc.business_id}#auction`}
                        className="text-xs text-[#D4AF37] hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      No auctions found. Create one using the button above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
