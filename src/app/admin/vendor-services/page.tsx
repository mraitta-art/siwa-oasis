'use client';

import { useEffect, useState } from 'react';

type Service = {
  id: string; title: string; category: string; business_name: string; vendor_name?: string;
  approval_status: string; audience_scopes: string[] | string; placements: string[] | string;
  booking_mode: string; package_eligible: boolean; valid_from?: string | null; valid_until?: string | null;
  rejection_note?: string | null; last_audit_action?: string | null; last_audit_note?: string | null; last_audit_at?: string | null;
};

const statuses = ['pending_approval', 'published', 'draft', 'rejected', 'suspended'];
const audiences = ['public', 'owner_customers', 'partner_customers', 'invite_only'];
const placements = ['minisite', 'marketplace', 'search', 'packages'];

function listValue(value: string[] | string) {
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

export default function AdminVendorServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [status, setStatus] = useState('pending_approval');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/vendor-services?status=${status}`);
      const data = await response.json();
      setServices(Array.isArray(data.services) ? data.services : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [status]);

  function updateLocal(id: string, patch: Partial<Service>) {
    setServices(current => current.map(service => service.id === id ? { ...service, ...patch } : service));
  }

  async function save(service: Service) {
    setSaving(service.id); setMessage('');
    const response = await fetch('/api/admin/vendor-services', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: service.id, approval_status: service.approval_status, category: service.category, audience_scopes: listValue(service.audience_scopes), placements: listValue(service.placements), booking_mode: service.booking_mode, package_eligible: service.package_eligible, valid_from: service.valid_from, valid_until: service.valid_until, rejection_note: service.rejection_note }),
    });
    setSaving(null);
    setMessage(response.ok ? 'Service governance saved.' : 'Could not save service governance.');
    if (response.ok) load();
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <a href="/admin" className="text-xs font-bold uppercase tracking-wider text-slate-400">← Control Center</a>
        <div className="mb-8 mt-3 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Admin governance</p><h1 className="text-3xl font-black">Vendor services</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Control approval, audience, placement, booking mode, and package eligibility for every service.</p></div>
          {message && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>}
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
          {statuses.map(item => <button key={item} onClick={() => setStatus(item)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase ${status === item ? 'bg-slate-900 text-amber-300' : 'text-slate-500 hover:bg-slate-50'}`}>{item.replace('_', ' ')}</button>)}
        </div>
        {loading ? <div className="rounded-2xl bg-white p-10 text-center text-slate-400">Loading services...</div> : services.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">No services in this queue.</div> : <div className="space-y-4">
          {services.map(service => {
            const serviceAudiences = listValue(service.audience_scopes); const servicePlacements = listValue(service.placements);
            return <article key={service.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{service.title}</h2><p className="text-xs font-semibold text-slate-500">{service.business_name} {service.vendor_name ? `• ${service.vendor_name}` : ''}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700">{service.approval_status.replace('_', ' ')}</span></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-bold text-slate-500">Status<select value={service.approval_status} onChange={e => updateLocal(service.id, { approval_status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800">{statuses.map(item => <option key={item}>{item}</option>)}</select></label>
                <label className="text-xs font-bold text-slate-500">Category<select value={service.category} onChange={e => updateLocal(service.id, { category: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800">{categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}<option value={service.category}>{service.category}</option></select></label>
                <label className="text-xs font-bold text-slate-500">Booking mode<select value={service.booking_mode} onChange={e => updateLocal(service.id, { booking_mode: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800"><option value="request">Request</option><option value="contact">Contact</option><option value="book">Direct booking</option></select></label>
                <label className="flex items-end gap-2 pb-2 text-xs font-bold text-slate-500"><input type="checkbox" checked={Boolean(service.package_eligible)} onChange={e => updateLocal(service.id, { package_eligible: e.target.checked })} /> Eligible for packages</label>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2"><fieldset><legend className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Audience</legend><div className="flex flex-wrap gap-2">{audiences.map(item => <label key={item} className="rounded-lg bg-slate-50 px-2 py-1 text-xs"><input type="checkbox" className="mr-1" checked={serviceAudiences.includes(item)} onChange={e => updateLocal(service.id, { audience_scopes: e.target.checked ? [...serviceAudiences, item] : serviceAudiences.filter(value => value !== item) })} />{item.replace('_', ' ')}</label>)}</div></fieldset><fieldset><legend className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Placement</legend><div className="flex flex-wrap gap-2">{placements.map(item => <label key={item} className="rounded-lg bg-slate-50 px-2 py-1 text-xs"><input type="checkbox" className="mr-1" checked={servicePlacements.includes(item)} onChange={e => updateLocal(service.id, { placements: e.target.checked ? [...servicePlacements, item] : servicePlacements.filter(value => value !== item) })} />{item}</label>)}</div></fieldset></div>
              <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-xs font-bold text-slate-500">Valid from<input type="date" value={service.valid_from || ''} onChange={e => updateLocal(service.id, { valid_from: e.target.value })} className="mt-1 block rounded-lg border border-slate-200 p-2 text-sm" /></label><label className="text-xs font-bold text-slate-500">Valid until<input type="date" value={service.valid_until || ''} onChange={e => updateLocal(service.id, { valid_until: e.target.value })} className="mt-1 block rounded-lg border border-slate-200 p-2 text-sm" /></label><label className="min-w-[240px] flex-1 text-xs font-bold text-slate-500">Admin note<input value={service.rejection_note || ''} onChange={e => updateLocal(service.id, { rejection_note: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm" placeholder="Reason or review note" /></label><button onClick={() => save(service)} disabled={saving === service.id} className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-black uppercase text-amber-300 disabled:opacity-50">{saving === service.id ? 'Saving...' : 'Save governance'}</button></div>
              {service.last_audit_action && <div className="mt-3 text-xs text-slate-400">Last audit: <strong>{service.last_audit_action}</strong>{service.last_audit_at ? ` • ${new Date(service.last_audit_at).toLocaleString()}` : ''}{service.last_audit_note ? ` • ${service.last_audit_note}` : ''}</div>}
            </article>;
          })}
        </div>}
      </div>
    </main>
  );
}