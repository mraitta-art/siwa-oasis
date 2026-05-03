'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';

interface FieldDefinition {
  id: string;
  name: string;
  icon: string;
  category: string;
  hasOptions: boolean;
}

const CATEGORIES = ['Standard', 'Multimedia', 'Choice Systems', 'Governance', 'Specialized'];

export default function FieldPrinciplesPage() {
  const { notify } = useAdmin();
  const [definitions, setDefinitions] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [showModal, setShowModal] = useState(false);
  const [editingDef, setEditingDef] = useState<Partial<FieldDefinition> | null>(null);

  useEffect(() => { loadDefinitions(); }, []);

  async function loadDefinitions() {
    setLoading(true);
    const res = await fetch('/api/jana/field-definitions');
    if (res.ok) setDefinitions(await res.json());
    setLoading(false);
  }

  const openEditor = (def: FieldDefinition | null) => {
    setEditingDef(def || { id: '', name: '', icon: 'fa-cube', category: 'Standard', hasOptions: false });
    setShowModal(true);
  };

  async function saveDefinition() {
    if (!editingDef?.id || !editingDef?.name) {
      notify('ID and Name are required.', 'error');
      return;
    }
    
    const res = await fetch('/api/jana/field-definitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingDef),
    });

    if (res.ok) {
      notify(`Principle "${editingDef.name}" synchronized.`, 'success');
      setShowModal(false);
      loadDefinitions();
    }
  }

  async function deleteDefinition(id: string) {
    if (!confirm(`Archive the principle "${id}"? It will be removed from the library.`)) return;
    const res = await fetch(`/api/jana/field-definitions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('Principle archived.', 'warning');
      loadDefinitions();
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}><i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i></div>;

  return (
    <div className="animate-in">
      <div className="card-header">
        <div>
          <h3><i className="fas fa-cubes"></i> Platform Principles</h3>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Configure the core data types available in your marketplace ecosystem.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditor(null)}>
          <i className="fas fa-plus"></i> NEW PRINCIPLE
        </button>
      </div>

      <div className="notification-banner" style={{ margin: '1.5rem 0' }}>
         <i className="fas fa-info-circle"></i> These items populate the <strong>Element Library</strong> in the Form Architect. Removing an item here will hide it from future forms.
      </div>

      {CATEGORIES.map(cat => {
        const items = definitions.filter(d => d.category === cat);
        if (items.length === 0) return null;
        
        return (
          <div key={cat} style={{ marginBottom: '2.5rem' }}>
             <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>{cat.toUpperCase()} TOOLS</h4>
             <div className="grid-4">
                {items.map(def => (
                  <div key={def.id} className="card h-full" style={{ padding: '1.25rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                     <div style={{ width: '50px', height: '50px', background: 'rgba(212,175,55,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#D4AF37', marginBottom: '1rem' }}>
                        <i className={`fas ${def.icon}`}></i>
                     </div>
                     <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{def.name}</div>
                     <code style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>{def.id}</code>
                     
                     <div style={{ marginTop: '1.5rem', width: '100%', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-xs btn-outline" onClick={() => openEditor(def)}><i className="fas fa-edit"></i></button>
                        <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => deleteDefinition(def.id)}><i className="fas fa-trash"></i></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );
      })}

      {/* EDITOR MODAL */}
      {showModal && editingDef && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
           <div className="card animate-in" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
              <div className="card-header">
                 <h3>Define Data Principle</h3>
                 <button onClick={() => setShowModal(false)} className="btn btn-xs btn-outline">×</button>
              </div>
              
              <div style={{ padding: '1.5rem 0' }}>
                 <div className="form-group">
                    <label className="form-label required">Unique Principle ID (Slug)</label>
                    <input 
                      type="text" className="form-control" placeholder="e.g. signature_pad"
                      value={editingDef.id} 
                      onChange={e => setEditingDef({...editingDef, id: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                    />
                 </div>
                 <div className="form-group">
                    <label className="form-label required">Display Name</label>
                    <input type="text" className="form-control" value={editingDef.name} onChange={e => setEditingDef({...editingDef, name: e.target.value})} />
                 </div>
                 <div className="grid-2">
                    <div className="form-group">
                       <label className="form-label">Category</label>
                       <select className="form-control" value={editingDef.category} onChange={e => setEditingDef({...editingDef, category: e.target.value})}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="form-group">
                       <label className="form-label">Icon (FontAwesome)</label>
                       <input type="text" className="form-control" value={editingDef.icon} onChange={e => setEditingDef({...editingDef, icon: e.target.value})} />
                    </div>
                 </div>
                 <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                       <input type="checkbox" checked={editingDef.hasOptions} onChange={e => setEditingDef({...editingDef, hasOptions: e.target.checked})} />
                       <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Supports Multiple Options?</span>
                    </label>
                 </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                 <button className="btn btn-outline" onClick={() => setShowModal(false)}>CANCEL</button>
                 <button className="btn btn-primary" onClick={saveDefinition}>SYNCHRONIZE PRINCIPLE</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
