'use client';

import React, { useState, useEffect } from 'react';
import { CARD_LAYOUTS } from '@/lib/governance/constants';

interface CardTemplate {
  id: string;
  business_type_id: string;
  layout: string;
  visible_fields: string[];
}

export default function CardBuilderPage() {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editType, setEditType] = useState<string | null>(null);

  useEffect(() => { 
    Promise.all([loadTemplates(), loadTypes(), loadFields(), loadSections()]).then(() => setLoading(false));
  }, []);

  async function loadTemplates() {
    const res = await fetch('/api/jana/cards');
    if (res.ok) setTemplates(await res.json());
  }

  async function loadTypes() {
    const res = await fetch('/api/jana/types');
    if (res.ok) setTypes(await res.json());
  }

  async function loadFields() {
    const res = await fetch('/api/jana/forms');
    if (res.ok) {
      const all = await res.json();
      setFields(all); // Keep all to know their sections
    }
  }

  async function loadSections() {
    const res = await fetch('/api/jana/sections');
    if (res.ok) setSections(await res.json());
  }

  const getTemplate = (typeId: string) => templates.find(t => t.business_type_id === typeId) || {
    id: `tpl_${typeId}`, business_type_id: typeId, layout: 'standard', visible_fields: ['name', 'description', 'stars']
  };

  async function saveTemplate(tpl: CardTemplate) {
    const isNew = !templates.find(t => t.id === tpl.id);
    const res = await fetch('/api/jana/cards', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tpl),
    });
    if (res.ok) {
      setEditType(null);
      loadTemplates();
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i></div>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-id-card"></i> Card Builder & Designer</h3>
      </div>

      <div className="notification-banner">
        <i className="fas fa-palette"></i> Customize how each business type appears in search results. Choose layouts and toggle visible data fields.
      </div>

      <div className="grid-2">
        {types.map(type => {
          const tpl = getTemplate(type.id);
          const layout = (CARD_LAYOUTS as any)[tpl.layout] || CARD_LAYOUTS.standard;
          return (
            <div key={type.id} className="card" style={{ borderTop: `4px solid ${type.icon_color || '#D4AF37'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className={type.icon} style={{ color: type.icon_color, fontSize: '1.25rem' }}></i>
                  <div>
                    <h4 style={{ margin: 0 }}>{type.name}</h4>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{layout.name} Layout</span>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setEditType(type.id)}>
                  <i className="fas fa-edit"></i> Customize Card
                </button>
              </div>

              {/* Mini Preview */}
              <div style={{ 
                marginTop: '1.25rem', padding: '1rem', background: '#f9fafb', 
                borderRadius: '0.5rem', border: '1px solid #e5e7eb',
                height: 140, overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: 80, height: 60, background: '#eee', borderRadius: '4px' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Business Name</div>
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>★★★★★ (4.9) · {type.name}</div>
                    <div style={{ margin: '4px 0', height: 4, background: '#e5e7eb', width: '80%' }}></div>
                    <div style={{ margin: '4px 0', height: 4, background: '#f3f4f6', width: '60%' }}></div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                      {tpl.visible_fields.slice(0, 3).map(f => (
                        <div key={f} style={{ fontSize: '0.55rem', background: '#e0f2fe', padding: '1px 4px', borderRadius: 2 }}>{f}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editType && (() => {
        const type = types.find(t => t.id === editType);
        const [editingTpl, setEditingTpl] = useState(getTemplate(editType));
        
        return (
          <div className="modal-overlay">
            <div className="modal-content animate-in" style={{ maxWidth: 900 }}>
              <div className="modal-header">
                <h3>Card Designer: {type?.name}</h3>
                <button className="btn btn-xs" onClick={() => setEditType(null)}>×</button>
              </div>

              <div className="grid-2">
                <div>
                  <label className="form-label">Step 1: Choose Base Layout</label>
                  <div className="grid-2" style={{ gap: '0.5rem' }}>
                    {Object.values(CARD_LAYOUTS).map(l => (
                      <div 
                        key={l.id} 
                        className={`card ${editingTpl.layout === l.id ? 'active' : ''}`}
                        style={{ 
                          padding: '0.75rem', cursor: 'pointer', textAlign: 'center', 
                          border: editingTpl.layout === l.id ? '2px solid #D4AF37' : '1px solid #e5e7eb',
                          background: editingTpl.layout === l.id ? '#fff9e6' : '#fff'
                        }}
                        onClick={() => setEditingTpl({...editingTpl, layout: l.id})}
                      >
                        <i className={`fas ${l.icon}`} style={{ fontSize: '1.5rem', color: '#D4AF37', marginBottom: '0.5rem', display: 'block' }}></i>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{l.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{l.description}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <label className="form-label">Step 2: Toggle Visible Fields</label>
                    <div style={{ 
                      maxHeight: 250, overflowY: 'auto', border: '1px solid #e5e7eb', 
                      padding: '1rem', borderRadius: '0.5rem', background: '#fafafa' 
                    }}>
                      <div className="section-groups">
                        {sections.map(sec => {
                          const secFields = Array.from(new Map(fields.filter(f => f.section_id === sec.id).map(f => [f.name, f])).values());
                          if (secFields.length === 0) return null;
                          
                          const allSelected = secFields.every(f => editingTpl.visible_fields.includes(f.name));
                          
                          return (
                            <div key={sec.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                     <i className={`fas ${sec.icon}`} style={{ color: '#D4AF37' }}></i>
                                     {sec.name.toUpperCase()} MODULE
                                  </div>
                                  <button 
                                    className="btn btn-xs btn-outline" 
                                    onClick={() => {
                                      const fieldNames = secFields.map(f => f.name);
                                      const next = allSelected 
                                        ? editingTpl.visible_fields.filter(f => !fieldNames.includes(f))
                                        : Array.from(new Set([...editingTpl.visible_fields, ...fieldNames]));
                                      setEditingTpl({...editingTpl, visible_fields: next});
                                    }}
                                  >
                                    {allSelected ? 'UNSELECT ALL' : 'SELECT ALL'}
                                  </button>
                               </div>
                               <div className="permission-matrix">
                                 {secFields.map(f => (
                                   <label key={f.name} className="permission-item" style={{ cursor: 'pointer' }}>
                                     <input 
                                       type="checkbox" 
                                       checked={editingTpl.visible_fields.includes(f.name)} 
                                       onChange={() => {
                                         const next = editingTpl.visible_fields.includes(f.name) 
                                           ? editingTpl.visible_fields.filter(x => x !== f.name)
                                           : [...editingTpl.visible_fields, f.name];
                                         setEditingTpl({...editingTpl, visible_fields: next});
                                       }} 
                                     />
                                     <span>{f.label}</span>
                                   </label>
                                 ))}
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f3f4f6', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label className="form-label" style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>LIVE PREVIEW: {editingTpl.layout.toUpperCase()}</label>
                  
                  {/* The Preview Card */}
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: '1rem', 
                    width: '100%', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                    overflow: 'hidden',
                    maxWidth: editingTpl.layout === 'hero' ? 350 : 300,
                    transition: 'all 0.3s ease'
                  }}>
                    {editingTpl.layout === 'hero' ? (
                      <div style={{ height: 250, background: '#eee', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                         <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                         <div style={{ padding: '1.5rem', position: 'relative', color: '#fff', width: '100%' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 700 }}>{type?.name}</div>
                            <h3 style={{ margin: '4px 0', color: '#fff' }}>Luxury Sample Oasis</h3>
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                              {editingTpl.visible_fields.slice(0, 3).map(f => (
                                <span key={f} style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 2 }}>{f}</span>
                              ))}
                            </div>
                         </div>
                         <div style={{ position: 'absolute', top: 15, right: 15, background: '#D4AF37', borderRadius: '20px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                          ★ 4.9
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ height: editingTpl.layout === 'compact' ? 100 : 160, background: '#eee', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 10, right: 10, background: '#fff', borderRadius: '20px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700 }}>
                            ★ 4.9
                          </div>
                        </div>
                        <div style={{ padding: editingTpl.layout === 'compact' ? '0.75rem' : '1.5rem' }}>
                          <h4 style={{ margin: 0 }}>Sample {type?.name}</h4>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0' }}>Authentic Siwa Experience</p>
                          
                          {editingTpl.layout === 'data_rich' ? (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                               <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', marginBottom: '0.5rem' }}>VIBE & ATMOSPHERE</div>
                               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                  {editingTpl.visible_fields.map(f => (
                                    <span key={f} style={{ background: '#fff9e6', color: '#D4AF37', border: '1px solid #D4AF3744', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800 }}>
                                      # {f.toUpperCase()}
                                    </span>
                                  ))}
                               </div>
                            </div>
                          ) : editingTpl.layout !== 'compact' && (
                            <div style={{ margin: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {editingTpl.visible_fields.map(f => (
                                <span key={f} className="badge badge-info" style={{ fontSize: '0.6rem' }}>{f}</span>
                              ))}
                              {editingTpl.visible_fields.length === 0 && <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>No fields mapped</span>}
                            </div>
                          )}

                          <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>View Details</button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditType(null)}>Cancel</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => saveTemplate(editingTpl)}>Apply Changes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
