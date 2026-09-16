'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type TemplateRow = { template_id: string; category: string; template_label: string; name?: string; label?: string; field_type?: string; required?: boolean; options?: string[] | string };

function parseOptions(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
  return [];
}

export default function AdminServiceTemplatesPage() {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [selected, setSelected] = useState('');
  const [field, setField] = useState({ name: '', label: '', field_type: 'text', required: false, options: '' });
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/admin/service-templates');
    const data = await response.json();
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  const templates = Array.from(new Map(rows.map(row => [row.template_id, row])).values());
  const fields = rows.filter(row => row.template_id === selected && row.name);

  async function addField(event: React.FormEvent) {
    event.preventDefault();
    const template = templates.find(item => item.template_id === selected);
    if (!template) return;
    const response = await fetch('/api/admin/service-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: selected, category: template.category, template_label: template.template_label, name: field.name, label: field.label, field_type: field.field_type, required: field.required, options: field.options.split(',').map(item => item.trim()).filter(Boolean), display_order: fields.length * 10 }),
    });
    setMessage(response.ok ? 'Template field saved.' : 'Could not save template field.');
    if (response.ok) { setField({ name: '', label: '', field_type: 'text', required: false, options: '' }); load(); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/admin/vendor-services" className="text-xs font-bold uppercase tracking-wider text-slate-400">← Vendor services</Link><div className="mb-8 mt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Dynamic schema</p><h1 className="text-3xl font-black">Service templates</h1><p className="mt-2 text-sm text-slate-500">Define category-specific fields used by vendor service forms.</p></div>{message && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>}<div className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">Categories</h2>{templates.map(template => <button key={template.template_id} onClick={() => setSelected(template.template_id)} className={`mb-2 block w-full rounded-lg p-3 text-left text-sm font-bold ${selected === template.template_id ? 'bg-slate-900 text-amber-300' : 'bg-slate-50 text-slate-700'}`}>{template.template_label}<span className="block text-xs font-normal opacity-70">{template.category}</span></button>)}</aside><section className="rounded-2xl border border-slate-200 bg-white p-5">{selected ? <><h2 className="text-xl font-black">{templates.find(item => item.template_id === selected)?.template_label}</h2><div className="mt-4 space-y-2">{fields.map(item => <div key={`${item.template_id}-${item.name}`} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"><span className="font-bold">{item.label} <span className="text-xs font-normal text-slate-500">({item.name})</span></span><span className="text-xs text-slate-500">{item.field_type}{item.required ? ' • required' : ''}{parseOptions(item.options).length ? ` • ${parseOptions(item.options).length} options` : ''}</span></div>)}</div><form onSubmit={addField} className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2"><input required placeholder="Field name" value={field.name} onChange={event => setField({ ...field, name: event.target.value })} className="rounded-lg border border-slate-200 p-3 text-sm" /><input required placeholder="Field label" value={field.label} onChange={event => setField({ ...field, label: event.target.value })} className="rounded-lg border border-slate-200 p-3 text-sm" /><select value={field.field_type} onChange={event => setField({ ...field, field_type: event.target.value })} className="rounded-lg border border-slate-200 p-3 text-sm"><option value="text">Text</option><option value="textarea">Textarea</option><option value="number">Number</option><option value="select">Select</option><option value="multiselect">Multi-select</option><option value="boolean">Boolean</option></select><input placeholder="Options separated by commas" value={field.options} onChange={event => setField({ ...field, options: event.target.value })} className="rounded-lg border border-slate-200 p-3 text-sm" /><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={field.required} onChange={event => setField({ ...field, required: event.target.checked })} /> Required</label><button className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-black uppercase text-amber-300">Add field</button></form></> : <div className="p-10 text-center text-slate-400">Select a service category.</div>}</section></div></div></main>;
}
