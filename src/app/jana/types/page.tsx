'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';

interface BizType {
  id: string; name: string; icon: string; icon_color: string; description: string;
  is_parent: boolean; parent_id: string | null; sections: string[]; own_sections: string[];
  active: boolean;
}

const COMMON_ICONS = [
  'fas fa-building', 'fas fa-hotel', 'fas fa-campground', 'fas fa-utensils',
  'fas fa-mug-hot', 'fas fa-hiking', 'fas fa-map-marked-alt', 'fas fa-landmark',
  'fas fa-spa', 'fas fa-store', 'fas fa-jeep', 'fas fa-sun', 'fas fa-moon', 'fas fa-leaf'
];

const BRAND_COLORS = [
  '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#D4AF37', '#27ae60', '#2c3e50'
];

export default function BusinessTypesPage() {
  const { notify } = useAdmin();
  const [types, setTypes] = useState<BizType[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<Partial<BizType> | null>(null);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => { 
    loadTypes(); 
    loadSections();
  }, []);

  async function loadTypes() {
    setLoading(true);
    const res = await fetch('/api/jana/types');
    if (res.ok) setTypes(await res.json());
    setLoading(false);
  }

  async function loadSections() {
    const res = await fetch('/api/jana/sections');
    if (res.ok) setSections(await res.json());
  }

  const parents = types.filter(t => t.is_parent || Number(t.is_parent) === 1);
  const getChildren = (pid: string) => types.filter(t => t.parent_id === pid);

  const openEditor = (type: Partial<BizType> | null) => {
    if (type) {
      setEditingType({...type});
      setIsNew(false);
    } else {
      setEditingType({
        id: '', name: '', icon: 'fas fa-building', icon_color: '#8b5cf6',
        description: '', is_parent: false, parent_id: '', sections: [], own_sections: [], active: true
      });
      setIsNew(true);
    }
    setShowModal(true);
  };

  const generateId = (name: string) => {
    if (!isNew) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setEditingType(prev => prev ? { ...prev, id: slug } : null);
  };

  async function saveType() {
    if (!editingType?.id || !editingType?.name) return;
    
    // Validate parent_id requirement
    if (!editingType.is_parent && !editingType.parent_id) {
      notify('Child types must have a parent selected.', 'error');
      return;
    }
    
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch('/api/jana/types', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingType),
    });
    
    if (res.ok) {
      notify(`Typology ${editingType.name} saved successfully`, 'success');
      setShowModal(false);
      loadTypes();
    } else {
      notify('Failed to save typology architecture.', 'error');
    }
  }

  async function deleteType(id: string) {
    if (!confirm(`Delete type "${id}"?`)) return;
    await fetch(`/api/jana/types?id=${id}`, { method: 'DELETE' });
    loadTypes();
  }

  const toggleSection = (sectionId: string) => {
    if (!editingType) return;
    const current = editingType.sections || [];
    const updated = current.includes(sectionId)
      ? current.filter(id => id !== sectionId)
      : [...current, sectionId];
    setEditingType({ ...editingType, sections: updated });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i></div>;

  return (
    <div className="animate-in">
      <div className="card-header">
        <div>
          <h3><i className="fas fa-sitemap"></i> Typology Architect</h3>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Define the hierarchical structure of your marketplace entities.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditor(null)}>
          <i className="fas fa-plus"></i> NEW TYPOLOGY
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {parents.map(p => {
          const kids = getChildren(p.id);
          return (
            <div key={p.id} className="tree-group" style={{ marginBottom: '1.5rem', background: '#f8fafc', borderRadius: '12px', padding: '1rem', borderLeft: `4px solid ${p.icon_color}` }}>
              <div className="tree-item-advanced" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: '40px', height: '40px', background: `${p.icon_color}20`, color: p.icon_color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      <i className={p.icon}></i>
                   </div>
                   <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <div style={{ fontWeight: 800, color: '#1a1a2e' }}>{p.name}</div>
                         <span className="badge badge-primary" style={{ fontSize: '0.55rem', background: '#1a1a2e' }}>MASTER FOUNDATION</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>ID: {p.id} • Biological Parent Category</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-xs btn-outline" onClick={() => openEditor(p)}><i className="fas fa-edit"></i></button>
                  <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => deleteType(p.id)}><i className="fas fa-trash"></i></button>
                </div>
              </div>

              {kids.length > 0 && (
                <div style={{ marginLeft: '3rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {kids.map(ch => (
                    <div key={ch.id} className="tree-item-advanced" style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <i className={ch.icon} style={{ color: ch.icon_color, fontSize: '1rem' }}></i>
                         <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ch.name}</div>
                            <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>ID: {ch.id} • Child Typology</div>
                         </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button className="btn btn-xs btn-outline" onClick={() => openEditor(ch)}><i className="fas fa-edit"></i></button>
                         <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => deleteType(ch.id)}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && editingType && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="card animate-in" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>{isNew ? 'Create New Typology' : 'Edit Typology Architect'}</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label required">Display Name</label>
                <input 
                  type="text" className="form-control" placeholder="e.g. Siwa Eco Lodge" 
                  value={editingType.name} 
                  onChange={e => {
                    setEditingType({...editingType, name: e.target.value});
                    generateId(e.target.value);
                  }} 
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Database ID (Auto-Generated)</label>
                <input 
                  type="text" className="form-control" style={{ background: '#f8fafc', fontFamily: 'monospace' }} 
                  value={editingType.id} 
                  readOnly={!isNew}
                  onChange={e => setEditingType({...editingType, id: e.target.value})} 
                />
              </div>

              <div className="grid-2" style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Classification</label>
                  <select className="form-control" value={editingType.is_parent ? 'parent' : 'child'} onChange={e => setEditingType({...editingType, is_parent: e.target.value === 'parent', parent_id: e.target.value === 'parent' ? null : editingType.parent_id})}>
                    <option value="parent">Parent Category</option>
                    <option value="child">Child Typology</option>
                  </select>
                </div>
                {!editingType.is_parent && (
                  <div className="form-group">
                    <label className="form-label required">Link to Parent</label>
                    <select className="form-control" value={editingType.parent_id || ''} onChange={e => setEditingType({...editingType, parent_id: e.target.value})}>
                      <option value="">-- Choose Parent --</option>
                      {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Icon & Branding</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {COMMON_ICONS.map(icon => (
                    <div 
                      key={icon} 
                      onClick={() => setEditingType({...editingType, icon})}
                      style={{ width: '36px', height: '36px', borderRadius: '6px', border: editingType.icon === icon ? '2px solid #D4AF37' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: editingType.icon === icon ? '#D4AF3710' : '#fff' }}
                    >
                      <i className={icon} style={{ color: editingType.icon === icon ? '#D4AF37' : '#6b7280' }}></i>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <label className="form-label">Data Section Inheritance (Presets)</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {sections.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={editingType.sections?.includes(s.id)} onChange={() => toggleSection(s.id)} />
                      <span style={{ fontSize: '0.8rem' }}>{s.name} <small style={{ color: '#9ca3af' }}>({s.id})</small></span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>CANCEL</button>
              <button className="btn btn-primary" onClick={saveType}>SAVE ARCHITECTURE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
