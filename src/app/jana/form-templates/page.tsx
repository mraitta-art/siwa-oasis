'use client';

import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

type SectionChoice = { section_id: string; required: boolean; sort_order: number; section_name?: string };
type FormTemplate = { id: string; name: string; purpose: string; type_id: string | null; type_name?: string; status: string; description?: string; sections: SectionChoice[] };

export default function FormTemplatesPage() {
  const { notify } = useAdmin();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [editing, setEditing] = useState<Partial<FormTemplate> | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [templateResponse, typeResponse, sectionResponse] = await Promise.all([
        fetch('/api/jana/form-templates'), fetch('/api/jana/types'), fetch('/api/jana/sections')
      ]);
      const readJson = async (response: Response) => {
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) return null;
        return response.json();
      };
      const [templateData, typeData, sectionData] = await Promise.all([
        readJson(templateResponse), readJson(typeResponse), readJson(sectionResponse)
      ]);
      if (Array.isArray(templateData)) setTemplates(templateData);
      if (Array.isArray(typeData)) setTypes(typeData);
      if (Array.isArray(sectionData)) setSections(sectionData);
    } catch { notify('Could not load form templates', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing({ id: '', name: '', purpose: 'onboarding', type_id: null, status: 'draft', description: '', sections: [] });
  }

  function toggleSection(sectionId: string) {
    if (!editing) return;
    const current = editing.sections || [];
    const exists = current.some(item => item.section_id === sectionId);
    setEditing({ ...editing, sections: exists ? current.filter(item => item.section_id !== sectionId) : [...current, { section_id: sectionId, required: false, sort_order: current.length }] });
  }

  function moveSection(sectionId: string, direction: 'up' | 'down') {
    if (!editing) return;
    const current = [...(editing.sections || [])];
    const index = current.findIndex(item => item.section_id === sectionId);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return;
    [current[index], current[nextIndex]] = [current[nextIndex], current[index]];
    setEditing({ ...editing, sections: current.map((item, itemIndex) => ({ ...item, sort_order: itemIndex })) });
  }

  async function save() {
    if (!editing?.name || !editing.id) { notify('Template ID and name are required', 'error'); return; }
    const response = await fetch('/api/jana/form-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok) { notify(data.error || 'Could not save form template', 'error'); return; }
    notify('Form template saved', 'success'); setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this form template?')) return;
    const response = await fetch(`/api/jana/form-templates?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok) { notify(data.error || 'Could not delete form template', 'error'); return; }
    notify('Form template deleted', 'success'); load();
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading form templates...</div>;

  return <div style={{ maxWidth: 1100, margin: '0 auto' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
      <div><h1 style={{ margin: 0, color: '#0f172a' }}>Form Templates</h1><p style={{ color: '#64748b' }}>Reusable collection contracts: choose available sections once, then reuse them for onboarding and business forms.</p></div>
      {!editing && <button onClick={startNew} style={{ background: '#D4AF37', color: '#1e293b', border: 0, borderRadius: 8, padding: '0.75rem 1rem', fontWeight: 800 }}>+ New Form Template</button>}
    </header>

    {editing ? <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem' }}>
      <h2 style={{ marginTop: 0 }}>Configure collection contract</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <label>Template ID<input value={editing.id || ''} onChange={e => setEditing({ ...editing, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_') })} style={inputStyle} /></label>
        <label>Name<input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} style={inputStyle} /></label>
        <label>Scope<select value={editing.type_id || ''} onChange={e => setEditing({ ...editing, type_id: e.target.value || null })} style={inputStyle}><option value="">Universal: available everywhere</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
        <label>Purpose<select value={editing.purpose || 'onboarding'} onChange={e => setEditing({ ...editing, purpose: e.target.value })} style={inputStyle}><option value="onboarding">Onboarding</option><option value="business_edit">Business edit</option><option value="vendor_update">Vendor update</option><option value="custom_request">Custom request</option></select></label>
      </div>
      <label style={{ display: 'block', marginTop: '1rem' }}>Description<textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} style={{ ...inputStyle, minHeight: 70 }} /></label>
      <h3>Sections collected and priority</h3>
      <p style={{ color: '#64748b', fontSize: '0.78rem' }}>Choose any sections. Required status and priority are controlled independently of typology inheritance.</p>
      <div style={{ display: 'grid', gap: '0.4rem', maxHeight: 360, overflowY: 'auto' }}>{sections.map(section => {
        const selected = (editing.sections || []).find(item => item.section_id === section.id);
        return <div key={section.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #e2e8f0', padding: '0.65rem', borderRadius: 8 }}>
          <input type="checkbox" checked={!!selected} onChange={() => toggleSection(section.id)} /><span style={{ flex: 1, fontWeight: 700 }}>{section.name}</span>
          {selected && <><label style={{ fontSize: '0.75rem' }}><input type="checkbox" checked={!!selected.required} onChange={() => setEditing({ ...editing, sections: (editing.sections || []).map(item => item.section_id === section.id ? { ...item, required: !item.required } : item) })} /> Required</label><button type="button" onClick={() => moveSection(section.id, 'up')} aria-label={`Move ${section.name} up`} disabled={editing.sections?.[0]?.section_id === section.id} style={iconButton}>↑</button><button type="button" onClick={() => moveSection(section.id, 'down')} aria-label={`Move ${section.name} down`} disabled={editing.sections?.[editing.sections.length - 1]?.section_id === section.id} style={iconButton}>↓</button></>}
        </div>;
      })}</div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}><button onClick={save} style={primaryButton}>Save Template</button><button onClick={() => setEditing(null)} style={secondaryButton}>Cancel</button></div>
    </section> : <div style={{ display: 'grid', gap: '0.75rem' }}>{templates.map(template => <article key={template.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><strong>{template.name}</strong><div style={{ color: '#64748b', fontSize: '0.8rem' }}>{template.type_name || 'Universal'} · {template.purpose} · {template.sections.length} sections</div><div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>{template.sections.map(item => <span key={item.section_id} style={{ background: item.required ? '#dcfce7' : '#f1f5f9', padding: '0.2rem 0.45rem', borderRadius: 5, fontSize: '0.7rem' }}>{item.section_name || item.section_id}{item.required ? ' *' : ''}</span>)}</div></div><div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}><button onClick={() => setEditing(template)} style={secondaryButton}>Edit</button><button onClick={() => remove(template.id)} style={{ ...secondaryButton, color: '#b91c1c' }}>Delete</button></div></article>)}{templates.length === 0 && <div style={{ background: '#fff', padding: '2rem', textAlign: 'center', color: '#64748b' }}>No form templates yet.</div>}</div>}
  </div>;
}

const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box' as const, padding: '0.65rem', marginTop: '0.35rem', border: '1px solid #cbd5e1', borderRadius: 7 };
const primaryButton = { background: '#0f766e', color: '#fff', border: 0, borderRadius: 7, padding: '0.65rem 1rem', fontWeight: 800 };
const secondaryButton = { background: '#f1f5f9', color: '#334155', border: 0, borderRadius: 7, padding: '0.65rem 1rem', fontWeight: 700 };
const iconButton = { background: '#e2e8f0', color: '#334155', border: 0, borderRadius: 5, padding: '0.2rem 0.45rem', fontWeight: 900, cursor: 'pointer' };
