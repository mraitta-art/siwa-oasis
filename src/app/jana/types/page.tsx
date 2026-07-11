'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';

interface BizType {
  id: string; name: string; icon: string; icon_color: string; description: string;
  is_parent: boolean; parent_id: string | null; sections: string[]; own_sections: string[];
  active: boolean; default_template_id?: string | null;
}

const COMMON_ICONS = [
  'fas fa-building', 'fas fa-hotel', 'fas fa-campground', 'fas fa-utensils',
  'fas fa-mug-hot', 'fas fa-hiking', 'fas fa-map-marked-alt', 'fas fa-landmark',
  'fas fa-spa', 'fas fa-store', 'fas fa-jeep', 'fas fa-sun', 'fas fa-moon', 'fas fa-leaf'
];

const BRAND_COLORS = [
  '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#D4AF37', '#27ae60', '#2c3e50'
];

interface DuplicateGroup {
  name: string;
  ids: string[];
  count: number;
}

export default function BusinessTypesPage() {
  const { notify } = useAdmin();
  const [types, setTypes] = useState<BizType[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateGroup | null>(null);
  const [consolidating, setConsolidating] = useState(false);
  const [selectedParentForConsolidate, setSelectedParentForConsolidate] = useState('');
  const [quickFixId, setQuickFixId] = useState<string | null>(null);
  const [quickFixParent, setQuickFixParent] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ type: BizType; children: BizType[] } | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<Partial<BizType> | null>(null);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => { 
    loadTypes(); 
    loadSections();
    loadTemplates();
    checkForDuplicates();
  }, []);

  async function loadTypes() {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/types');
      if (res.ok) {
        const data = await res.json();
        setTypes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load types:', e);
      setTypes([]);
    }
    setLoading(false);
  }

  async function loadSections() {
    try {
      const res = await fetch('/api/jana/sections');
      if (res.ok) {
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load sections:', e);
      setSections([]);
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch('/api/jana/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setTemplates([]);
    }
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
      const errData = await res.json().catch(() => null);
      notify(errData?.error || 'Failed to save typology architecture.', 'error');
    }
  }

  function downloadBackup(type: BizType, children: BizType[]) {
    const backup = {
      exported_at: new Date().toISOString(),
      warning: 'This backup was created before deletion. Import manually if you need to restore.',
      type,
      children
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${type.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function confirmDelete(type: BizType) {
    const children = types.filter(t => t.parent_id === type.id);
    setDeleteModal({ type, children });
  }

  async function executeDelete() {
    if (!deleteModal) return;
    const { type } = deleteModal;
    const res = await fetch(`/api/jana/types?id=${type.id}`, { method: 'DELETE' });
    if (res.ok) {
      notify(`🗑️ "${type.name}" deleted successfully`, 'success');
    } else {
      notify('Failed to delete type', 'error');
    }
    setDeleteModal(null);
    loadTypes();
    checkForDuplicates();
  }

  async function quickFixParentAssign(orphanId: string) {
    if (!quickFixParent) {
      notify('Please select a parent first', 'error');
      return;
    }
    const res = await fetch('/api/jana/types', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orphanId, parent_id: quickFixParent, is_parent: false })
    });
    if (res.ok) {
      notify(`✅ Assigned to parent successfully`, 'success');
      setQuickFixId(null);
      setQuickFixParent('');
      loadTypes();
    } else {
      notify('Failed to assign parent', 'error');
    }
  }

  async function checkForDuplicates() {
    try {
      const res = await fetch('/api/jana/types/verify/duplicates?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data.duplicates || []);
      }
    } catch (e) {
      console.error('Failed to check duplicates:', e);
    }
  }

  async function consolidateTypes(parentTypeId: string, childTypeIds: string[]) {
    if (childTypeIds.length === 0) return;
    
    if (!confirm(`Consolidate ${childTypeIds.length} duplicate type(s) under "${parentTypeId}"? All dependencies will be updated.`)) return;

    setConsolidating(true);
    try {
      const res = await fetch('/api/jana/types/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentTypeId,
          childTypeIds,
          action: 'merge'
        })
      });

      if (res.ok) {
        notify(`Successfully consolidated ${childTypeIds.length} types under "${parentTypeId}"`, 'success');
        // Immediately remove the resolved duplicate from state — no waiting for API
        setDuplicates(prev => prev.filter(d => d.name !== selectedDuplicate?.name));
        setShowDuplicateModal(false);
        setSelectedDuplicate(null);
        await loadTypes();
        await checkForDuplicates(); // Final authoritative check
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to consolidate types', 'error');
      }
    } catch (e: any) {
      notify(e.message || 'Failed to consolidate types', 'error');
    } finally {
      setConsolidating(false);
    }
  }

  const toggleSection = (sectionId: string) => {
    if (!editingType) return;
    // For parents: toggles own sections
    // For children: toggles own_sections (extras on top of inherited)
    const field = editingType.is_parent ? 'sections' : 'own_sections';
    const current = (editingType[field] as string[]) || [];
    const updated = current.includes(sectionId)
      ? current.filter(id => id !== sectionId)
      : [...current, sectionId];
    setEditingType({ ...editingType, [field]: updated });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!editingType) return;
    const field = editingType.is_parent ? 'sections' : 'own_sections';
    const current = [...((editingType[field] as string[]) || [])];
    if (direction === 'up' && index > 0) {
      [current[index - 1], current[index]] = [current[index], current[index - 1]];
    } else if (direction === 'down' && index < current.length - 1) {
      [current[index + 1], current[index]] = [current[index], current[index + 1]];
    }
    setEditingType({ ...editingType, [field]: current });
  };

  // Get the sections assigned to the parent of a child type
  const getParentSections = (parentId: string | null | undefined): string[] => {
    if (!parentId) return [];
    const parent = types.find(t => t.id === parentId);
    return parent?.sections || [];
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

      {/* 🚨 DUPLICATE ALERT PANEL */}
      {duplicates.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          background: '#fef2f2',
          border: '2px solid #fca5a5',
          borderRadius: '12px',
          borderLeft: '6px solid #ef4444'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.5rem', color: '#ef4444' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, color: '#991b1b', fontSize: '1rem', marginBottom: '0.25rem' }}>
                {duplicates.length} Duplicate Type Name{duplicates.length !== 1 ? 's' : ''} Detected
              </div>
              <p style={{ color: '#7f1d1d', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Multiple types share the same name. Consolidate them under a parent type to ensure consistency across all dependencies (businesses, forms, templates, etc.).
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {duplicates.map((dup, idx) => (
              <div key={idx} style={{
                background: '#fff7f7',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #fca5a5'
              }}>
                <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: '0.4rem' }}>
                  "{dup.name}" ({dup.count} types)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7f1d1d', marginBottom: '0.6rem', fontFamily: 'monospace' }}>
                  {dup.ids.join(' • ')}
                </div>
                <button
                  onClick={() => {
                    setSelectedDuplicate(dup);
                    setSelectedParentForConsolidate(dup.ids[0]);
                    setShowDuplicateModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                >
                  ✨ Consolidate Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => confirmDelete(p)}><i className="fas fa-trash"></i></button>
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
                         <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => confirmDelete(ch)}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {/* ORPHAN TYPES SECTION */}
        {types.filter(t => !t.is_parent && Number(t.is_parent) !== 1 && !t.parent_id).length > 0 && (
          <div className="tree-group" style={{ marginBottom: '1.5rem', background: '#fff1f2', borderRadius: '12px', padding: '1rem', borderLeft: `4px solid #e11d48` }}>
            <h4 style={{ color: '#be123c', marginTop: 0, marginBottom: '1rem' }}><i className="fas fa-exclamation-triangle"></i> Unlinked / Orphaned Types</h4>
            <p style={{ fontSize: '0.8rem', color: '#9f1239', marginBottom: '1rem' }}>These types are marked as children but have no assigned parent. They appear on the Sections page but are disconnected from the hierarchy. Please edit them to assign a parent, convert them to parents, or delete them.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {types.filter(t => !t.is_parent && Number(t.is_parent) !== 1 && !t.parent_id).map(orphan => (
                <div key={orphan.id} className="tree-item-advanced" style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <i className={orphan.icon || 'fas fa-question-circle'} style={{ color: '#e11d48', fontSize: '1rem' }}></i>
                       <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#be123c' }}>{orphan.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#fda4af' }}>ID: {orphan.id} • Orphaned Type</div>
                       </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button
                         className="btn btn-xs"
                         style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontWeight: 700 }}
                         onClick={() => { setQuickFixId(quickFixId === orphan.id ? null : orphan.id); setQuickFixParent(''); }}
                       >
                         ⚡ Quick Fix
                       </button>
                       <button className="btn btn-xs btn-outline" onClick={() => openEditor(orphan)}><i className="fas fa-edit"></i></button>
                       <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => confirmDelete(orphan)}><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                  {/* Quick Fix: inline parent assign */}
                  {quickFixId === orphan.id && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#fffbeb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', whiteSpace: 'nowrap' }}>Assign parent:</span>
                      <select
                        value={quickFixParent}
                        onChange={e => setQuickFixParent(e.target.value)}
                        style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '0.85rem' }}
                      >
                        <option value="">-- Select parent --</option>
                        {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button
                        style={{ padding: '0.4rem 1rem', background: '#D4AF37', color: '#1a1a2e', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        onClick={() => quickFixParentAssign(orphan.id)}
                      >
                        ✓ Apply
                      </button>
                      <button
                        style={{ padding: '0.4rem 0.75rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                        onClick={() => { setQuickFixId(null); setQuickFixParent(''); }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DELETE WARNING MODAL */}
      {deleteModal && (
        <div className="modal-overlay" style={{ padding: '1rem', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            {/* Red header */}
            <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '1.5rem', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Permanent Deletion Warning</div>
                  <div style={{ opacity: 0.85, fontSize: '0.85rem' }}>This action cannot be undone</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem', color: '#1e293b', fontWeight: 600 }}>
                You are about to delete: <span style={{ color: '#dc2626' }}>«{deleteModal.type.name}»</span>
              </p>

              {/* Cascade warning for parents */}
              {(deleteModal.type.is_parent || Number(deleteModal.type.is_parent) === 1) && deleteModal.children.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: '0.5rem', fontSize: '0.9rem' }}>🔗 CASCADE: The following children will also be deleted:</div>
                  {deleteModal.children.map(ch => (
                    <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                      <i className={ch.icon} style={{ color: ch.icon_color }}></i>
                      <span>{ch.name}</span>
                      <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({ch.id})</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e' }}>
                <strong>Also permanently deleted:</strong> all associated form fields and section assignments.
              </div>

              {/* Backup button */}
              <button
                onClick={() => downloadBackup(deleteModal.type, deleteModal.children)}
                style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', background: '#f8fafc', border: '2px dashed #94a3b8', borderRadius: '8px', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                📥 Download JSON Backup First (Recommended)
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setDeleteModal(null)}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                >
                  🗑️ Yes, Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && editingType && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ padding: '1rem' }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>{isNew ? 'Create New Typology' : 'Edit Typology Architect'}</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label required">Display Name</label>
                <input 
                  type="text" className="form-control" placeholder="e.g. Siwa Eco Lodge" 
                  value={editingType.name || ''} 
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
                  value={editingType.id || ''} 
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

              {/* ── DEFAULT MINISITE TEMPLATE (Category/Parent only) ── */}
              {editingType.is_parent && (
                <div style={{ marginTop: '1.25rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                  <label className="form-label" style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <i className="fas fa-layer-group"></i>
                    Default Free Minisite Template
                    <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>INHERITED BY ALL SUBCATEGORY NAMES</span>
                  </label>
                  <p style={{ fontSize: '0.72rem', color: '#78350f', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>
                    Every business name registered under any subcategory of this category will automatically use this minisite template unless a specific override is chosen.
                  </p>
                  <select
                    className="form-control"
                    value={editingType.default_template_id || ''}
                    onChange={e => setEditingType({...editingType, default_template_id: e.target.value || null})}
                    style={{ borderColor: editingType.default_template_id ? '#10b981' : '#fcd34d' }}
                  >
                    <option value="">-- No default template (manual selection required) --</option>
                    {templates
                      .filter((t: any) => !t.type_id || t.type_id === editingType.id)
                      .map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.level ? `[${t.level}]` : ''} {!t.type_id ? '🌐 Universal' : ''}
                        </option>
                      ))
                    }
                  </select>
                  {editingType.default_template_id && (
                    <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 700, marginTop: '0.35rem' }}>
                      ✅ All business names under this category will inherit: <strong>{templates.find(t => t.id === editingType.default_template_id)?.name}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Show inherited template info for child types */}
              {!editingType.is_parent && editingType.parent_id && (() => {
                const parentType = types.find(t => t.id === editingType.parent_id);
                const parentTemplate = parentType?.default_template_id
                  ? templates.find(t => t.id === parentType.default_template_id)
                  : null;
                return parentTemplate ? (
                  <div style={{ marginTop: '1.25rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <i className="fas fa-layer-group" style={{ color: '#16a34a' }}></i>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>Inherited Minisite Template from {parentType?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
                        Business names registered here will use: <strong>{parentTemplate.name}</strong>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

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

              {/* ── SECTION INHERITANCE PANEL ── */}
              <div style={{ marginTop: '2rem' }}>
                {editingType.is_parent ? (
                  // PARENT: Assign its own 8 sections
                  <>
                    <label className="form-label">🧬 Own Sections (Will be inherited by all children)</label>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.75rem' }}>Select up to 8 sections. These will be <strong>locked and inherited</strong> by all child typologies under this parent.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div style={{ flex: 1, maxHeight: '220px', overflowY: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {sections.map(s => (
                          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', cursor: 'pointer' }}>
                            <input type="checkbox" checked={editingType.sections?.includes(s.id)} onChange={() => toggleSection(s.id)} />
                            <span style={{ fontSize: '0.8rem', fontWeight: editingType.sections?.includes(s.id) ? 800 : 400, color: editingType.sections?.includes(s.id) ? '#D4AF37' : '#1e293b' }}>
                              {s.name}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div style={{ flex: 1, maxHeight: '220px', overflowY: 'auto', background: '#fff', padding: '1rem', borderRadius: '8px', border: '2px solid #D4AF37' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#D4AF37', marginBottom: '0.75rem', letterSpacing: '1px' }}>DNA SEQUENCE ({(editingType.sections||[]).length}/8)</div>
                        {(editingType.sections || []).length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Check sections on the left to build the sequence.</div>
                        ) : (
                          (editingType.sections || []).map((secId, index) => {
                            const sec = sections.find(s => s.id === secId);
                            if (!sec) return null;
                            return (
                              <div key={secId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem', background:'#f8fafc', borderRadius:'6px', marginBottom:'0.4rem', border:'1px solid #e2e8f0' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                                  <div style={{ background:'#D4AF37', color:'#fff', fontSize:'0.6rem', width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{index+1}</div>
                                  <span style={{ fontSize:'0.75rem', fontWeight:700 }}>{sec.name}</span>
                                </div>
                                <div style={{ display:'flex', gap:'0.2rem' }}>
                                  <button type="button" onClick={() => moveSection(index, 'up')} disabled={index===0} style={{ border:'none', background:'none', cursor:index===0?'not-allowed':'pointer', color:index===0?'#cbd5e1':'#64748b' }}><i className="fas fa-chevron-up"></i></button>
                                  <button type="button" onClick={() => moveSection(index, 'down')} disabled={index===(editingType.sections||[]).length-1} style={{ border:'none', background:'none', cursor:index===(editingType.sections||[]).length-1?'not-allowed':'pointer', color:index===(editingType.sections||[]).length-1?'#cbd5e1':'#64748b' }}><i className="fas fa-chevron-down"></i></button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // CHILD: Show parent's sections as locked + allow extra own sections
                  <>
                    {/* Locked inherited sections */}
                    <label className="form-label">🔒 Inherited from Parent (Read-Only)</label>
                    <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'0.75rem', marginBottom:'1.25rem' }}>
                      {getParentSections(editingType.parent_id).length === 0 ? (
                        <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>Parent has no sections assigned yet. Assign sections to the parent first.</span>
                      ) : (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                          {getParentSections(editingType.parent_id).map((secId, i) => {
                            const sec = sections.find(s => s.id === secId);
                            return sec ? (
                              <span key={secId} style={{ background:'#dcfce7', color:'#166534', padding:'3px 10px', borderRadius:'50px', fontSize:'0.7rem', fontWeight:700, display:'flex', alignItems:'center', gap:'4px' }}>
                                <span style={{ opacity:0.6 }}>#{i+1}</span> {sec.name} <i className="fas fa-lock" style={{ fontSize:'0.55rem' }}></i>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    {/* Own extra sections */}
                    <label className="form-label">➕ Additional Own Sections (Optional)</label>
                    <p style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:'0.75rem' }}>Add sections specific to this child type only. These are on top of the inherited ones.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div style={{ flex:1, maxHeight:'160px', overflowY:'auto', background:'#f8fafc', padding:'1rem', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
                        {sections.filter(s => !getParentSections(editingType.parent_id).includes(s.id)).map(s => (
                          <label key={s.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.4rem 0', cursor:'pointer' }}>
                            <input type="checkbox" checked={editingType.own_sections?.includes(s.id)} onChange={() => toggleSection(s.id)} />
                            <span style={{ fontSize:'0.8rem', fontWeight: editingType.own_sections?.includes(s.id) ? 800 : 400, color: editingType.own_sections?.includes(s.id) ? '#8b5cf6' : '#1e293b' }}>{s.name}</span>
                          </label>
                        ))}
                        {sections.filter(s => !getParentSections(editingType.parent_id).includes(s.id)).length === 0 && (
                          <div style={{ fontSize:'0.78rem', color:'#94a3b8' }}>All sections are already inherited from the parent.</div>
                        )}
                      </div>
                      <div style={{ flex:1, maxHeight:'160px', overflowY:'auto', background:'#fff', padding:'1rem', borderRadius:'8px', border:'2px solid #8b5cf6' }}>
                        <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#8b5cf6', marginBottom:'0.5rem' }}>OWN EXTRAS</div>
                        {(editingType.own_sections||[]).length === 0 ? (
                          <div style={{ fontSize:'0.78rem', color:'#94a3b8', fontStyle:'italic' }}>None added yet.</div>
                        ) : (
                          (editingType.own_sections||[]).map((secId, index) => {
                            const sec = sections.find(s => s.id === secId);
                            if (!sec) return null;
                            return (
                              <div key={secId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.4rem', background:'#f5f3ff', borderRadius:'6px', marginBottom:'0.3rem', border:'1px solid #ddd6fe' }}>
                                <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#5b21b6' }}>{sec.name}</span>
                                <div style={{ display:'flex', gap:'0.2rem' }}>
                                  <button type="button" onClick={() => moveSection(index, 'up')} disabled={index===0} style={{ border:'none', background:'none', cursor:index===0?'not-allowed':'pointer', color:index===0?'#cbd5e1':'#64748b' }}><i className="fas fa-chevron-up"></i></button>
                                  <button type="button" onClick={() => moveSection(index, 'down')} disabled={index===(editingType.own_sections||[]).length-1} style={{ border:'none', background:'none', cursor:'pointer', color:'#64748b' }}><i className="fas fa-chevron-down"></i></button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>CANCEL</button>
              <button className="btn btn-primary" onClick={saveType}>SAVE ARCHITECTURE</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔧 CONSOLIDATION MODAL */}
      {showDuplicateModal && selectedDuplicate && (
        <div className="modal-overlay" onClick={() => setShowDuplicateModal(false)} style={{ padding: '1rem' }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>✨ Consolidate Duplicate Types</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setShowDuplicateModal(false)}>×</button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: 700, marginBottom: '0.4rem' }}>
                  📋 Consolidating: <strong>"{selectedDuplicate.name}"</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.5rem' }}>
                  {selectedDuplicate.count} duplicate type{selectedDuplicate.count !== 1 ? 's' : ''} found: {selectedDuplicate.ids.join(', ')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#92400e', fontStyle: 'italic' }}>
                  All dependencies will be updated automatically (businesses, forms, templates, sections).
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  Select parent type to consolidate under:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                  {selectedDuplicate.ids.map(typeId => {
                    const typeObj = types.find(t => t.id === typeId);
                    return (
                      <label key={typeId} style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as any).style.background = '#f9fafb';
                        (e.currentTarget as any).style.borderColor = '#8b5cf6';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as any).style.background = '#fff';
                        (e.currentTarget as any).style.borderColor = '#e5e7eb';
                      }}
                      >
                        <input
                          type="radio"
                          name="parentType"
                          value={typeId}
                          checked={selectedParentForConsolidate === typeId}
                          onChange={(e) => setSelectedParentForConsolidate(e.target.value)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1f2937' }}>
                            {typeObj?.name || typeId}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                            ID: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>{typeId}</code>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, marginBottom: '0.4rem' }}>
                  ✅ What will happen:
                </div>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#166534' }}>
                  <li>✓ Type <strong>"{selectedParentForConsolidate || selectedDuplicate.ids[0]}"</strong> will be <span style={{ background: '#bbf7d0', padding: '1px 5px', borderRadius: '4px' }}>KEPT</span></li>
                  {selectedDuplicate.ids.filter(id => id !== (selectedParentForConsolidate || selectedDuplicate.ids[0])).map(id => (
                    <li key={id}>🗑 Type <strong>"{id}"</strong> will be <span style={{ background: '#fecaca', padding: '1px 5px', borderRadius: '4px' }}>PERMANENTLY DELETED</span></li>
                  ))}
                  <li>All businesses using deleted types are reassigned to the kept type</li>
                  <li>Form fields and templates are updated automatically</li>
                </ul>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowDuplicateModal(false)}
                disabled={consolidating}
              >
                CANCEL
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  const parentId = selectedParentForConsolidate || selectedDuplicate.ids[0];
                  const otherIds = selectedDuplicate.ids.filter(id => id !== parentId);
                  consolidateTypes(parentId, otherIds);
                }}
                disabled={consolidating}
                style={{ opacity: consolidating ? 0.6 : 1 }}
              >
                {consolidating ? '⏳ Consolidating...' : '✨ Consolidate Types'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
