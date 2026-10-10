'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type TemplateField = {
  template_id: string;
  category: string;
  template_label: string;
  template_description?: string;
  field_id?: string;
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  options?: string[] | string;
  applies_to?: { field?: string; values?: string[] } | string | null;
  publicly_visible?: boolean;
  display_order?: number;
  active?: boolean;
};

const EMPTY_FIELD = {
  name: '',
  label: '',
  field_type: 'text',
  required: false,
  options: '',
  applies_to_values: [] as string[],
  publicly_visible: true,
  display_order: 100,
};

function parse(value: unknown, fallback: any = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value ?? fallback;
}

export default function ServiceTemplatesPage() {
  const [rows, setRows] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [form, setForm] = useState(EMPTY_FIELD);
  const editorRef = useRef<HTMLFormElement>(null);

  const templates = useMemo(() => {
    const result = new Map<string, TemplateField>();
    rows.forEach(row => {
      if (!result.has(row.template_id)) result.set(row.template_id, row);
    });
    return Array.from(result.values());
  }, [rows]);
  const template = templates.find(item => item.template_id === 'transportation_standard');
  const activeRows = rows.filter(row => row.template_id === template?.template_id && Number(row.active) !== 0 && row.field_id);
  const vehicleTypeField = activeRows.find(row => row.name === 'vehicle_type');
  const vehicleTypes: string[] = parse(vehicleTypeField?.options);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/service-templates');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load service field definitions');
      setRows(Array.isArray(data) ? data.map(row => ({
        ...row,
        options: parse(row.options),
        applies_to: parse(row.applies_to, null),
      })) : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load service field definitions');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function editField(field: TemplateField) {
    const options: string[] = parse(field.options);
    const appliesTo = parse(field.applies_to, null);
    setEditingName(field.name);
    setForm({
      name: field.name,
      label: field.label,
      field_type: field.field_type,
      required: Boolean(field.required),
      options: options.join(', '),
      applies_to_values: Array.isArray(appliesTo?.values) ? appliesTo.values : [],
      publicly_visible: field.publicly_visible !== false,
      display_order: Number(field.display_order) || 100,
    });
    setMessage('');
    window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function resetForm() {
    setForm(EMPTY_FIELD);
    setEditingName('');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!template) return;
    setSaving(true);
    setMessage('');
    setIsError(false);
    try {
      const options = form.options.split(',').map(value => value.trim()).filter(Boolean);
      const response = await fetch('/api/admin/service-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.template_id,
          category: template.category,
          template_label: template.template_label,
          template_description: template.template_description,
          name: form.name.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          label: form.label.trim(),
          field_type: form.field_type,
          required: form.required,
          options,
          display_order: form.display_order,
          applies_to: form.applies_to_values.length ? { field: 'vehicle_type', values: form.applies_to_values } : null,
          publicly_visible: form.publicly_visible,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save service field');
      setMessage('Field saved. Vendors will see it in the transportation catalog.');
      resetForm();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save service field');
      setIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(field: TemplateField) {
    if (!window.confirm(`Hide "${field.label}" from new vendor listings? Existing listings keep their saved value.`)) return;
    try {
      const query = new URLSearchParams({ template_id: field.template_id, name: field.name });
      const response = await fetch(`/api/admin/service-templates?${query}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not deactivate field');
      setMessage('Field hidden from new listings.');
      setIsError(false);
      if (editingName === field.name) resetForm();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not deactivate field');
      setIsError(true);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-slate-800">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Admin · Vendor catalog</p>
      <h1 className="mt-2 text-3xl font-black">Transportation service fields</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Configure transport types and the dynamic details vendors must provide for each vehicle or service. Fields can apply to every listing or only selected transport types.</p>
      {message && <div role="status" className={`mt-4 rounded-xl p-3 text-sm font-bold ${isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{message}</div>}
      {loading ? <p className="py-8 text-sm text-slate-500">Loading field definitions…</p> : !template ? <p className="py-8 text-sm text-red-700">No active transportation service template is configured. Apply the transportation service migration first.</p> : <>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Configured fields</h2>
            <div className="mt-4 space-y-3">
              {activeRows.map(field => {
                const appliesTo = parse(field.applies_to, null);
                return <article key={field.name} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4">
                  <div className="min-w-0">
                    <h3 className="font-bold">{field.label}{field.required && <span className="ml-2 text-xs text-red-600">Required</span>}</h3>
                    <p className="mt-1 text-xs text-slate-500">{field.name} · {field.field_type}{appliesTo?.values?.length ? ` · ${appliesTo.values.join(', ')}` : ' · all types'} · {field.publicly_visible === false ? 'admin only' : 'shown publicly'}</p>
                    {parse(field.options).length > 0 && <p className="mt-1 text-xs text-slate-500">Options: {parse(field.options).join(', ')}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => editField(field)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Edit</button>
                    <button type="button" onClick={() => void deactivate(field)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Hide</button>
                  </div>
                </article>;
              })}
            </div>
          </section>

          <form ref={editorRef} onSubmit={save} className="h-fit scroll-mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-black">{editingName ? 'Edit field' : 'Add a field'}</h2>{editingName && <button type="button" onClick={resetForm} className="text-xs font-bold text-slate-500">Cancel</button>}</div>
            <label className="block text-sm font-bold">Field key<input required disabled={Boolean(editingName)} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="operating_license" className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
            <label className="block text-sm font-bold">Label<input required value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
            <label className="block text-sm font-bold">Input type<select value={form.field_type} onChange={event => setForm({ ...form, field_type: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-3">{['text', 'textarea', 'number', 'date', 'email', 'url', 'select', 'multiselect', 'boolean'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            {['select', 'multiselect'].includes(form.field_type) && <label className="block text-sm font-bold">Options (comma-separated)<textarea required value={form.options} onChange={event => setForm({ ...form, options: event.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 p-3" /></label>}
            {vehicleTypes.length > 0 && form.name !== 'vehicle_type' && <fieldset><legend className="text-sm font-bold">Show only for these transport types</legend><p className="mb-2 mt-1 text-xs text-slate-500">Leave all unchecked to show this field for every type.</p><div className="grid grid-cols-2 gap-2">{vehicleTypes.map(value => <label key={value} className="flex items-center gap-2 text-xs capitalize"><input type="checkbox" checked={form.applies_to_values.includes(value)} onChange={event => setForm({ ...form, applies_to_values: event.target.checked ? [...form.applies_to_values, value] : form.applies_to_values.filter(item => item !== value) })} />{value.replace(/_/g, ' ')}</label>)}</div></fieldset>}
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.required} onChange={event => setForm({ ...form, required: event.target.checked })} />Required for matching listings</label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.publicly_visible} onChange={event => setForm({ ...form, publicly_visible: event.target.checked })} />Show this field on public mini-sites</label>
            <label className="block text-sm font-bold">Display order<input type="number" value={form.display_order} onChange={event => setForm({ ...form, display_order: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>
            <button disabled={saving} className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-amber-300 disabled:opacity-50">{saving ? 'Saving…' : 'Save field'}</button>
          </form>
        </div>
      </>}
    </main>
  );
}
