'use client';

import React, { useState, useEffect } from 'react';

interface Expression {
  id: string;
  name: string;
  type: 'select' | 'multi-select' | 'boolean' | 'range' | 'text';
  options: string[];
  searchable: boolean;
}

export default function ExpressionsPage() {
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Expression> | null>(null);

  useEffect(() => { loadExpressions(); }, []);

  async function loadExpressions() {
    setLoading(true);
    const res = await fetch('/api/admin/expressions');
    if (res.ok) setExpressions(await res.json());
    setLoading(false);
  }

  async function saveExpression() {
    if (!editing?.id || !editing?.name) return;
    const isNew = !expressions.find(e => e.id === editing.id);
    const res = await fetch('/api/admin/expressions', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      loadExpressions();
    }
  }

  async function deleteExpression(id: string) {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/admin/expressions?id=${id}`, { method: 'DELETE' });
    if (res.ok) loadExpressions();
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i></div>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-flask"></i> Vibe & Expression Manager</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ id: '', name: '', type: 'select', options: [], searchable: true })}>
          <i className="fas fa-plus"></i> New Expression
        </button>
      </div>

      <div className="notification-banner">
        <i className="fas fa-magic"></i> Expressions are dynamic terminologies like "Vibe", "Construction", or "Sustainability" that can be used across multiple business types.
      </div>

      <div className="grid-2">
        {expressions.map(exp => (
          <div key={exp.id} className="card" style={{ borderLeft: '3px solid #D4AF37' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h4 style={{ color: '#1a1a2e' }}>{exp.name}</h4>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ID: <code>{exp.id}</code> · Type: <strong>{exp.type}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-xs btn-outline" onClick={() => setEditing(exp)}>Edit</button>
                <button className="btn btn-xs btn-danger" onClick={() => deleteExpression(exp.id)}>×</button>
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {exp.options.map((opt, i) => (
                <span key={i} className="badge badge-info">{opt}</span>
              ))}
              {exp.options.length === 0 && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No options defined</span>}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal-content animate-in">
            <div className="modal-header">
              <h3>{expressions.find(e => e.id === editing.id) ? 'Edit Expression' : 'Create Expression'}</h3>
              <button className="btn btn-xs" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Expression ID (machine key)</label>
              <input type="text" className="form-control" value={editing.id} onChange={e => setEditing({...editing, id: e.target.value})} placeholder="e.g. construction_style" disabled={!!expressions.find(e => e.id === editing.id)} />
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input type="text" className="form-control" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="e.g. Architecture Style" />
            </div>
            <div className="form-group">
              <label className="form-label">Input Type</label>
              <select className="form-control" value={editing.type} onChange={e => setEditing({...editing, type: e.target.value as any})}>
                <option value="select">Dropdown / Single Choice</option>
                <option value="multi-select">Multi-Select Tags</option>
                <option value="boolean">Boolean (Yes/No)</option>
                <option value="range">Numeric Range</option>
                <option value="text">Free Text</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Options (one per line)</label>
              <textarea 
                className="form-control" 
                rows={5} 
                value={editing.options?.join('\n')} 
                onChange={e => setEditing({...editing, options: e.target.value.split('\n').filter(x => x.trim())})}
                placeholder="Option A&#10;Option B&#10;Option C"
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.searchable} onChange={e => setEditing({...editing, searchable: e.target.checked})} />
                Searchable as Filter
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveExpression}>Save Expression</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
