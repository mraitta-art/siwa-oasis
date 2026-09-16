'use client';

import { useEffect, useMemo, useState } from 'react';

type TemplateField = { name: string; label: string; field_type: string; required: boolean; options?: string[] | string };
type Template = { template_id: string; category: string; template_label: string; fields: TemplateField[] };

function parse(value: unknown): any[] { if (Array.isArray(value)) return value; if (typeof value === 'string') { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } } return []; }

export default function VendorServiceCatalogPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [priceUnit, setPriceUnit] = useState('');
  const [availability, setAvailability] = useState('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [message, setMessage] = useState('');
  const selectedTemplate = templates.find(template => template.category === category);
  const categories = useMemo(() => templates.map(template => ({ id: template.category, label: template.template_label })), [templates]);

  useEffect(() => { fetch('/api/vendor/services').then(response => response.json()).then(data => setTemplates(Object.values((data.templates || []).reduce((map: Record<string, Template>, field: any) => { if (!map[field.template_id]) map[field.template_id] = { template_id: field.template_id, category: field.category, template_label: field.template_label, fields: [] }; if (field.field_id) map[field.template_id].fields.push({ ...field, options: parse(field.options) }); return map; }, {})))); }, []);

  function updateAttribute(name: string, value: any) { setAttributes(current => ({ ...current, [name]: value })); }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage('');
    const response = await fetch('/api/vendor/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, title, description, price: price || null, currency, price_unit: priceUnit || null, availability, attributes }) });
    const data = await response.json();
    setMessage(response.ok ? 'Service submitted for admin approval.' : data.error || 'Could not save service');
    if (response.ok) { setTitle(''); setDescription(''); setPrice(''); setAttributes({}); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8"><div className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Vendor catalog</p><h1 className="mt-2 text-3xl font-black">Add a service</h1><p className="mt-2 text-sm text-slate-500">Choose a category to load the admin-defined fields for this service.</p>{message && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>}<form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><label className="block text-sm font-bold">Service category<select required value={category} onChange={event => { setCategory(event.target.value); setAttributes({}); }} className="mt-1 w-full rounded-lg border border-slate-200 p-3"> <option value="">Select category</option>{categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{category && <><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Service name<input required value={title} onChange={event => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label><label className="text-sm font-bold">Availability<input value={availability} onChange={event => setAvailability(event.target.value)} placeholder="Daily, seasonal, by request" className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label></div><label className="block text-sm font-bold">Description<textarea required value={description} onChange={event => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 p-3" /></label><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-bold">Price<input type="number" value={price} onChange={event => setPrice(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label><label className="text-sm font-bold">Currency<input value={currency} onChange={event => setCurrency(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label><label className="text-sm font-bold">Price unit<input value={priceUnit} onChange={event => setPriceUnit(event.target.value)} placeholder="per person" className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label></div><div className="grid gap-4 sm:grid-cols-2">{selectedTemplate?.fields.map(field => <label key={field.name} className="text-sm font-bold">{field.label}{field.field_type === 'textarea' ? <textarea required={field.required} value={attributes[field.name] || ''} onChange={event => updateAttribute(field.name, event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 p-3" /> : field.field_type === 'select' ? <select required={field.required} value={attributes[field.name] || ''} onChange={event => updateAttribute(field.name, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3"><option value="">Select</option>{parse(field.options).map(option => <option key={option} value={option}>{option}</option>)}</select> : field.field_type === 'multiselect' ? <select multiple value={Array.isArray(attributes[field.name]) ? attributes[field.name] : []} onChange={event => updateAttribute(field.name, Array.from(event.target.selectedOptions).map(option => option.value))} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 p-3">{parse(field.options).map(option => <option key={option} value={option}>{option}</option>)}</select> : <input required={field.required} type={field.field_type === 'number' ? 'number' : 'text'} value={attributes[field.name] || ''} onChange={event => updateAttribute(field.name, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" />}</label>)}</div><button type="submit" className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-black uppercase text-amber-300">Submit for approval</button></>}</form></div></main>;
}