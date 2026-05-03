'use client';

import React, { useState, useEffect } from 'react';

interface SearchEngine {
  id: string;
  name: string;
  allowed_fields: string[];
  filters: any[];
  active: boolean;
  card_theme: 'standard' | 'hero' | 'compact' | 'data_rich';
}

export default function SearchEnginesPage() {
  const [engines, setEngines] = useState<SearchEngine[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<SearchEngine> | null>(null);

  useEffect(() => { 
    Promise.all([loadEngines(), loadAllFields(), loadSections()]).then(() => setLoading(false));
  }, []);

  async function loadEngines() {
    const res = await fetch('/api/admin/search-engines');
    if (res.ok) setEngines(await res.json());
  }

  async function loadAllFields() {
    const res = await fetch('/api/admin/forms');
    if (res.ok) {
      const all = await res.json();
      setFields(all);
    }
  }

  async function loadSections() {
    const res = await fetch('/api/admin/sections');
    if (res.ok) setSections(await res.json());
  }

  async function saveEngine() {
    if (!editing?.id || !editing?.name) return;
    const isNew = !engines.find(e => e.id === editing.id);
    const res = await fetch('/api/admin/search-engines', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      loadEngines();
    }
  }

  async function deleteEngine(id: string) {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/admin/search-engines?id=${id}`, { method: 'DELETE' });
    if (res.ok) loadEngines();
  }

  const toggleField = (fieldKey: string) => {
    const current = editing?.allowed_fields || [];
    const next = current.includes(fieldKey) 
      ? current.filter(k => k !== fieldKey)
      : [...current, fieldKey];
    setEditing({ ...editing, allowed_fields: next });
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i></div>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-search-plus"></i> Search Engines Manager</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ id: '', name: '', allowed_fields: [], filters: [], active: true })}>
          <i className="fas fa-plus"></i> New Engine
        </button>
      </div>

      <div className="notification-banner">
        <i className="fas fa-filter"></i> Define specialized search algorithms by choosing which fields are searchable and applying pre-defined criteria.
      </div>

      <div className="grid-2">
        {engines.map(engine => (
          <div key={engine.id} className="card" style={{ borderLeft: '3px solid #D4AF37' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h4 style={{ color: '#1a1a2e' }}>{engine.name}</h4>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ID: <code>{engine.id}</code> · {engine.active ? '🟢 Active' : '🔴 Inactive'}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-xs btn-outline" onClick={() => setEditing(engine)}>Edit</button>
                <button className="btn btn-xs btn-danger" onClick={() => deleteEngine(engine.id)}>×</button>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Searchable Fields</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {engine.allowed_fields.map(f => (
                  <span key={f} className="badge badge-info">{f}</span>
                ))}
                {engine.allowed_fields.length === 0 && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No fields defined</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3>{engines.find(e => e.id === editing.id) ? 'Edit Search Engine' : 'Create Search Engine'}</h3>
              <button className="btn btn-xs" onClick={() => setEditing(null)}>×</button>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Engine ID</label>
                <input type="text" className="form-control" value={editing.id} onChange={e => setEditing({...editing, id: e.target.value})} placeholder="e.g. hotel_luxury_search" disabled={!!engines.find(e => e.id === editing.id)} />
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input type="text" className="form-control" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="e.g. Premium Hotels Search" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Result Card Characteristic (Visual Theme)</label>
                <select className="form-control" value={editing.card_theme || 'standard'} onChange={e => setEditing({...editing, card_theme: e.target.value as any})}>
                   <option value="standard">Standard (Balanced)</option>
                   <option value="hero">Hero (Large Visuals, Immersive)</option>
                   <option value="compact">Compact (List Style, Space Efficient)</option>
                   <option value="data_rich">Data-Rich (Highlight Tags & Features)</option>
                </select>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                   Determines how business cards appear when results are generated by this specific search engine.
                </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className="form-label">Define Searchable Criteria</label>
              <div style={{ 
                maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', padding: '1rem', background: '#f9fafb' 
              }}>
                <div className="section-groups">
                  {sections.map(sec => {
                    const secFields = Array.from(new Map(fields.filter(f => f.section_id === sec.id).map(f => [f.name, f])).values());
                    if (secFields.length === 0) return null;
                    
                    const allSelected = secFields.every(f => editing.allowed_fields?.includes(f.name));
                    
                    return (
                      <div key={sec.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <i className={`fas ${sec.icon}`} style={{ color: '#D4AF37' }}></i>
                               {sec.name.toUpperCase()} MODULE
                            </div>
                            <button 
                              className="btn btn-xs btn-outline" 
                              onClick={() => {
                                const fieldNames = secFields.map(f => f.name);
                                const current = editing.allowed_fields || [];
                                const next = allSelected 
                                  ? current.filter(f => !fieldNames.includes(f))
                                  : Array.from(new Set([...current, ...fieldNames]));
                                setEditing({...editing, allowed_fields: next});
                              }}
                            >
                              {allSelected ? 'DISABLE MODULE' : 'ENABLE MODULE'}
                            </button>
                         </div>
                         <div className="permission-matrix">
                           {secFields.map(f => (
                             <label key={f.name} className="permission-item" style={{ cursor: 'pointer' }}>
                               <input type="checkbox" checked={editing.allowed_fields?.includes(f.name)} onChange={() => toggleField(f.name)} />
                               <span>{f.label} <small>({f.name})</small></span>
                             </label>
                           ))}
                         </div>
                      </div>
                    );
                  })}
                  {fields.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No fields available to index. Create fields in the Form Builder first.</p>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEngine}>Save Search Engine</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
