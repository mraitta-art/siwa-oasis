'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type TemplateField = {
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  options?: string[] | string;
  applies_to?: { field?: string; values?: string[] } | string | null;
};
type Template = { template_id: string; category: string; template_label: string; fields: TemplateField[] };
type TemplateResponseField = TemplateField & {
  template_id: string;
  category: string;
  template_label: string;
  field_id?: string | null;
};
type Service = {
  id: string;
  category: string;
  title: string;
  description?: string;
  price?: number | string;
  currency?: string;
  price_unit?: string;
  availability?: string;
  capacity?: string;
  attributes?: Record<string, any> | string;
  approval_status: string;
  rejection_note?: string;
};

function parse(value: unknown, fallback: any = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value ?? fallback;
}

function fieldCondition(field: TemplateField) {
  const condition = parse(field.applies_to, null);
  return condition && typeof condition === 'object' ? condition : null;
}

function serviceAttributes(service: Service) {
  const value = parse(service.attributes, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export default function VendorServiceCatalogPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [priceUnit, setPriceUnit] = useState('');
  const [availability, setAvailability] = useState('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedTemplate = templates.find(template => template.category === category);
  const categories = useMemo(
    () => templates.map(template => ({ id: template.category, label: template.template_label })),
    [templates]
  );
  const visibleFields = (selectedTemplate?.fields || []).filter(field => {
    const condition = fieldCondition(field);
    if (!condition?.field || !Array.isArray(condition.values)) return true;
    return condition.values.includes(attributes[condition.field]);
  });

  async function loadCatalog() {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/services');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load your service catalog');
      const grouped = new Map<string, Template>();
      for (const field of (Array.isArray(data.templates) ? data.templates : []) as TemplateResponseField[]) {
        if (!grouped.has(field.template_id)) {
          grouped.set(field.template_id, {
            template_id: field.template_id,
            category: field.category,
            template_label: field.template_label,
            fields: [],
          });
        }
        if (field.field_id) {
          grouped.get(field.template_id)?.fields.push({
            ...field,
            options: parse(field.options),
            applies_to: parse(field.applies_to, null),
          });
        }
      }
      setTemplates(Array.from(grouped.values()));
      setServices(data.services || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load your service catalog');
      setMessageIsError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCatalog(); }, []);

  function updateAttribute(name: string, value: any) {
    setAttributes(current => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setCategory('');
    setTitle('');
    setDescription('');
    setPrice('');
    setCurrency('EGP');
    setPriceUnit('');
    setAvailability('');
    setAttributes({});
    setEditingId('');
  }

  function editService(service: Service) {
    setEditingId(service.id);
    setCategory(service.category);
    setTitle(service.title);
    setDescription(service.description || '');
    setPrice(service.price === undefined || service.price === null ? '' : String(service.price));
    setCurrency(service.currency || 'EGP');
    setPriceUnit(service.price_unit || '');
    setAvailability(service.availability || '');
    setAttributes(serviceAttributes(service));
    setMessage('');
    window.requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    setMessageIsError(false);
    setSaving(true);
    try {
      const allowedNames = new Set((selectedTemplate?.fields || []).map(field => field.name));
      const editableAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([name]) => allowedNames.has(name))
      );
      const response = await fetch('/api/vendor/services', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          category,
          title,
          description,
          price: price || null,
          currency,
          price_unit: priceUnit || null,
          availability,
          attributes: editableAttributes,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.fields?.length ? `${data.error}: ${data.fields.join(', ')}` : data.error || 'Could not save service');
      }
      setMessage(editingId ? 'Changes submitted for admin approval.' : 'Service submitted for admin approval.');
      resetForm();
      await loadCatalog();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save service');
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(service: Service) {
    if (!window.confirm(`Delete "${service.title}"? This cannot be undone.`)) return;
    setMessage('');
    try {
      const response = await fetch(`/api/vendor/services?id=${encodeURIComponent(service.id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete service');
      setServices(current => current.filter(item => item.id !== service.id));
      if (editingId === service.id) resetForm();
      setMessage('Service deleted.');
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete service');
      setMessageIsError(true);
    }
  }

  function renderField(field: TemplateField) {
    const options = parse(field.options);
    const value = attributes[field.name];
    const commonClass = 'mt-1 w-full rounded-lg border border-slate-200 p-3';
    let control;
    if (field.field_type === 'textarea') {
      control = <textarea required={field.required} value={value || ''} onChange={event => updateAttribute(field.name, event.target.value)} className={`${commonClass} min-h-20`} />;
    } else if (field.field_type === 'select') {
      control = <select required={field.required} value={value || ''} onChange={event => updateAttribute(field.name, event.target.value)} className={commonClass}><option value="">Select</option>{options.map((option: string) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}</select>;
    } else if (field.field_type === 'multiselect') {
      control = <select multiple required={field.required} value={Array.isArray(value) ? value : []} onChange={event => updateAttribute(field.name, Array.from(event.target.selectedOptions).map(option => option.value))} className={`${commonClass} min-h-24`}>{options.map((option: string) => <option key={option} value={option}>{option}</option>)}</select>;
    } else if (field.field_type === 'boolean' || field.field_type === 'checkbox') {
      control = <input type="checkbox" checked={Boolean(value)} onChange={event => updateAttribute(field.name, event.target.checked)} className="ml-2 mt-3 h-5 w-5 accent-amber-700" />;
    } else {
      const inputType = ['number', 'date', 'email', 'url'].includes(field.field_type) ? field.field_type : 'text';
      control = <input required={field.required} type={inputType} value={value ?? ''} onChange={event => updateAttribute(field.name, inputType === 'number' ? event.target.value : event.target.value)} className={commonClass} />;
    }
    return <label key={field.name} className="text-sm font-bold">{field.label}{field.required && <span className="ml-1 text-red-600">*</span>}{control}</label>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Vendor catalog</p>
        <h1 className="mt-2 text-3xl font-black">Vehicle &amp; service listings</h1>
        <p className="mt-2 text-sm text-slate-500">Add one listing per vehicle or service. Select its type to load the relevant fields; each listing appears on your mini-site after approval.</p>
        {message && <div role="status" className={`mt-4 rounded-xl p-3 text-sm font-bold ${messageIsError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{message}</div>}

        <form ref={formRef} onSubmit={submit} className="mt-6 scroll-mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{editingId ? 'Edit service listing' : 'Add a vehicle or service'}</h2>
            {editingId && <button type="button" onClick={resetForm} className="text-sm font-bold text-slate-500">Cancel edit</button>}
          </div>
          {editingId && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">After you submit changes, this listing returns to admin review and may be temporarily hidden from your public mini-site until it is approved again.</p>}
          <label className="block text-sm font-bold">Service category
            <select required value={category} onChange={event => { setCategory(event.target.value); setAttributes({}); }} className="mt-1 w-full rounded-lg border border-slate-200 p-3">
              <option value="">Select category</option>{categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          {category && <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">Service name<input required value={title} onChange={event => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
              <label className="text-sm font-bold">Availability<input value={availability} onChange={event => setAvailability(event.target.value)} placeholder="Daily, seasonal, by request" className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
            </div>
            <label className="block text-sm font-bold">Service description<textarea required value={description} onChange={event => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 p-3" /></label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-bold">Price<input type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
              <label className="text-sm font-bold">Currency<input value={currency} onChange={event => setCurrency(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
              <label className="text-sm font-bold">Price unit<input value={priceUnit} onChange={event => setPriceUnit(event.target.value)} placeholder="per trip, per hour, per person" className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">{visibleFields.map(renderField)}</div>
            <button disabled={saving} type="submit" className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-black uppercase text-amber-300 disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Submit changes for approval' : 'Submit for approval'}</button>
          </>}
        </form>

        <section className="mt-10">
          <h2 className="text-xl font-black">Your listings</h2>
          {loading ? <p className="py-6 text-sm text-slate-500">Loading listings…</p> : services.length === 0
            ? <p className="py-6 text-sm text-slate-500">No vehicle or service listings yet.</p>
            : <div className="mt-4 grid gap-4 md:grid-cols-2">{services.map(service => {
              const details = serviceAttributes(service);
              return <article key={service.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">{String(details.vehicle_type || service.category).replace(/_/g, ' ')}</p><h3 className="mt-1 text-lg font-black">{service.title}</h3></div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{service.approval_status.replace(/_/g, ' ')}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{service.description}</p>
                <p className="mt-2 text-sm font-bold">{service.price ? `${service.currency || 'EGP'} ${service.price}${service.price_unit ? ` / ${service.price_unit}` : ''}` : 'Price on request'}</p>
                {service.rejection_note && <p className="mt-2 text-xs text-red-700">Review note: {service.rejection_note}</p>}
                <div className="mt-4 flex gap-3"><button type="button" onClick={() => editService(service)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Edit</button><button type="button" onClick={() => void deleteService(service)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Delete</button></div>
              </article>;
            })}</div>}
        </section>
      </div>
    </main>
  );
}
