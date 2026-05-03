'use client';

import React, { useState, useEffect } from 'react';

interface VisibilityPolicy {
  id: string;
  name: string;
  description: string;
  role: string;
  allowed_fields: string[];
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<VisibilityPolicy[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<VisibilityPolicy> | null>(null);

  useEffect(() => { 
    Promise.all([loadPolicies(), loadAllFields()]).then(() => setLoading(false));
  }, []);

  async function loadPolicies() {
    const res = await fetch('/api/jana/policies');
    if (res.ok) setPolicies(await res.json());
  }

  async function loadAllFields() {
    const res = await fetch('/api/jana/forms');
    if (res.ok) {
      const all = await res.json();
      const unique = Array.from(new Map(all.map((f: any) => [f.name, f])).values());
      setFields(unique);
    }
  }

  async function savePolicy() {
    if (!editing?.id || !editing?.name) return;
    const isNew = !policies.find(p => p.id === editing.id);
    const res = await fetch('/api/jana/policies', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      loadPolicies();
    }
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
        <h3><i className="fas fa-shield-alt"></i> Visibility Policies</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ id: '', name: '', description: '', role: 'public', allowed_fields: [] })}>
          <i className="fas fa-plus"></i> New Policy
        </button>
      </div>

      <div className="notification-banner">
        <i className="fas fa-eye-slash"></i> Control which specific data points are visible to different user roles. For example, "Public" sees name/rating, while "Registered" sees phone numbers.
      </div>

      <div className="grid-2">
        {policies.map(policy => (
          <div key={policy.id} className="card" style={{ borderLeft: '3px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h4 style={{ color: '#1a1a2e' }}>{policy.name}</h4>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ID: <code>{policy.id}</code> · Role Target: <strong>{policy.role.toUpperCase()}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-xs btn-outline" onClick={() => setEditing(policy)}>Edit</button>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.75rem 0' }}>{policy.description || 'No description provided.'}</p>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Permitted Data Access</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {policy.allowed_fields.includes('*') ? (
                <span className="badge badge-success">FULL ACCESS (ALL FIELDS)</span>
              ) : (
                <>
                  {policy.allowed_fields.map(f => <span key={f} className="badge badge-info">{f}</span>)}
                  {policy.allowed_fields.length === 0 && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>BLOCKED (NO FIELDS)</span>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3>Edit Visibility Policy</h3>
              <button className="btn btn-xs" onClick={() => setEditing(null)}>×</button>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Policy ID</label>
                <input type="text" className="form-control" value={editing.id} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <select className="form-control" value={editing.role} onChange={e => setEditing({...editing, role: e.target.value})}>
                  <option value="public">Public (Guest)</option>
                  <option value="vendor">Vendor (Paid User)</option>
                  <option value="salesman">Salesman</option>
                  <option value="support_agent">Support Agent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Policy Name</label>
              <input type="text" className="form-control" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="e.g. Guest View Restricted" />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className="form-label">Whitelisted Fields for this Policy</label>
              <div style={{ 
                maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', padding: '1rem', background: '#f9fafb' 
              }}>
                <div className="permission-matrix">
                  <label className="permission-item" style={{ cursor: 'pointer', background: '#e0f2fe' }}>
                    <input type="checkbox" checked={editing.allowed_fields?.includes('*')} onChange={() => toggleField('*')} />
                    <strong>* GRANT FULL ACCESS</strong>
                  </label>
                  {fields.map(f => (
                    <label key={f.name} className="permission-item" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={editing.allowed_fields?.includes(f.name) || editing.allowed_fields?.includes('*')} onChange={() => toggleField(f.name)} disabled={editing.allowed_fields?.includes('*')} />
                      <span>{f.label} <small>({f.name})</small></span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePolicy}>Save Policy</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
