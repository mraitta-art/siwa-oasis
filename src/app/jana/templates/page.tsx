'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

interface Template {
  id: string;
  name: string;
  level: string;
  type_id: string;
  type_name?: string;
  type_icon?: string;
  type_icon_color?: string;
  description: string;
  layout: any[];
  features: any;
}

export default function TemplateArchitect() {
  const { notify } = useAdmin();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [formStep, setFormStep] = useState(1); // 1=Parent, 2=Name+Level, 3=Components

  // Derived: only top-level parents for step 1
  const parentTypes = businessTypes.filter((t: any) => t.is_parent);
  // Children of the currently selected parent
  const childTypes = editingTemplate?.type_id
    ? businessTypes.filter((t: any) => t.parent_id === editingTemplate.type_id || t.id === editingTemplate.type_id)
    : [];

  useEffect(() => {
    fetchTemplates();
    fetch('/api/jana/types').then(r => r.json()).then(data => setBusinessTypes(Array.isArray(data) ? data : []));
  }, []);

  // Reset step when opening form
  function openNewForm() {
    setEditingTemplate({ id: '', name: '', level: 'standard', type_id: '', description: '', layout: [], features: {} });
    setFormStep(1);
  }

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/jana/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.map((t: any) => ({
          ...t,
          layout: typeof t.layout === 'string' ? JSON.parse(t.layout) : t.layout || [],
          features: typeof t.features === 'string' ? JSON.parse(t.features) : t.features || {}
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }


  async function handleSave() {
    if (!editingTemplate?.type_id) {
      notify('Step 1: Select a Parent Business Type first.', 'error', true);
      setFormStep(1); return;
    }
    if (!editingTemplate?.name) {
      notify('Step 2: Template Name is required.', 'error', true);
      setFormStep(2); return;
    }
    if (!editingTemplate?.id) {
      // Auto-generate ID from name
      const autoId = editingTemplate.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      setEditingTemplate(prev => ({ ...prev, id: autoId }));
      editingTemplate.id = autoId;
    }

    try {
      const res = await fetch('/api/jana/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingTemplate,
          type_id: editingTemplate.type_id === 'universal' ? null : editingTemplate.type_id
        })
      });

      if (res.ok) {
        notify('Template saved to library', 'success');
        fetchTemplates();
        setEditingTemplate(null);
      } else {
        const data = await res.json();
        notify(data.error || 'Failed to save', 'error', true);
      }
    } catch (e) {
      notify('Error saving template', 'error', true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure? This will remove this master blueprint.')) return;
    try {
      const res = await fetch(`/api/jana/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Template deleted', 'success');
        fetchTemplates();
      } else {
        const data = await res.json();
        notify(data.error || 'Delete failed — this template might be in use by businesses or tiers.', 'error', true);
      }
    } catch (e) {
      notify('Delete failed', 'error', true);
    }
  }

  function addComponent(type: string) {
    if (!editingTemplate) return;
    const newComponent = {
      id: `comp_${Date.now()}`,
      type,
      props: type === 'hero_carousel' ? { carouselName: 'main_hero' } : {}
    };
    setEditingTemplate({
      ...editingTemplate,
      layout: [...(editingTemplate.layout || []), newComponent]
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <Link href="/jana" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 800 }}>
              ← ADMIN DASHBOARD
            </Link>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', margin: '0.5rem 0 0 0', letterSpacing: '-1px' }}>
              TEMPLATE ARCHITECT
            </h1>
            <p style={{ color: '#64748b' }}>Define the visual DNA and feature sets for your minisite marketplace.</p>
          </div>
          {!editingTemplate && (
            <button 
              onClick={openNewForm}
              className="btn btn-primary"
              style={{ background: '#D4AF37', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 800, color: '#fff', cursor: 'pointer' }}
            >
              + CREATE MASTER BLUEPRINT
            </button>
          )}
        </div>


        {editingTemplate ? (
          <div style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>

            {/* ── STEP INDICATOR ── */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '2.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              {[{n:1,label:'1. Select Parent'},{n:2,label:'2. Name & Level'},{n:3,label:'3. Components'}].map(s => (
                <button key={s.n} onClick={() => setFormStep(s.n)}
                  style={{ flex:1, padding:'0.75rem', fontWeight:800, fontSize:'0.75rem', border:'none', cursor:'pointer',
                    background: formStep === s.n ? '#D4AF37' : formStep > s.n ? '#10b981' : '#f8fafc',
                    color: formStep >= s.n ? '#fff' : '#94a3b8' }}>
                  {formStep > s.n ? '✓ ' : ''}{s.label}
                </button>
              ))}
            </div>

            {/* ── STEP 1: SELECT PARENT TYPE ── */}
            {formStep === 1 && (
              <div>
                <h2 style={{ fontWeight:900, marginBottom:'0.5rem', color:'#0f172a' }}>Step 1 — Select Parent Business Type</h2>
                <p style={{ color:'#64748b', marginBottom:'2rem', fontSize:'0.85rem' }}>This template will be available to <strong>all children</strong> of the parent you select. Only top-level parent types are shown.</p>
                
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
                  {parentTypes.length === 0 && (
                    <div style={{ gridColumn:'1/-1', padding:'2rem', background:'#fef9c3', borderRadius:'12px', color:'#92400e', fontWeight:700 }}>
                      ⚠️ No parent types found. Go to Business Types and mark at least one as a Parent.
                    </div>
                  )}
                  {/* 🌍 UNIVERSAL OPTION */}
                  <div 
                    onClick={() => setEditingTemplate({...editingTemplate, type_id: 'universal'})}
                    style={{ padding:'1.25rem', borderRadius:'12px', cursor:'pointer', border:`2px solid ${editingTemplate?.type_id === 'universal' ? '#D4AF37' : '#e2e8f0'}`,
                      background: editingTemplate?.type_id === 'universal' ? '#fffbeb' : '#f8fafc', transition:'all 0.15s' }}>
                    <i className="fas fa-globe" style={{ color: '#D4AF37', fontSize:'1.5rem', marginBottom:'0.5rem', display:'block' }}></i>
                    <div style={{ fontWeight:800, fontSize:'0.9rem' }}>Universal Template</div>
                    <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:'0.25rem' }}>
                      Valid for ALL parent types
                    </div>
                  </div>

                  {parentTypes.map((pt: any) => (
                    <div key={pt.id}
                      onClick={() => setEditingTemplate({...editingTemplate, type_id: pt.id})}
                      style={{ padding:'1.25rem', borderRadius:'12px', cursor:'pointer', border:`2px solid ${editingTemplate?.type_id === pt.id ? pt.icon_color || '#D4AF37' : '#e2e8f0'}`,
                        background: editingTemplate?.type_id === pt.id ? '#fffbeb' : '#f8fafc', transition:'all 0.15s' }}>
                      <i className={pt.icon || 'fas fa-folder'} style={{ color: pt.icon_color || '#D4AF37', fontSize:'1.5rem', marginBottom:'0.5rem', display:'block' }}></i>
                      <div style={{ fontWeight:800, fontSize:'0.9rem' }}>{pt.name}</div>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:'0.25rem' }}>
                        {businessTypes.filter((c: any) => c.parent_id === pt.id).length} child types
                      </div>
                    </div>
                  ))}
                </div>

                {editingTemplate?.type_id && (
                  <div style={{ background: editingTemplate.type_id === 'universal' ? '#eff6ff' : '#f0fdf4', border: `1px solid ${editingTemplate.type_id === 'universal' ? '#93c5fd' : '#86efac'}`, borderRadius:'12px', padding:'1rem', marginBottom:'1.5rem' }}>
                    <div style={{ fontWeight:800, fontSize:'0.75rem', color: editingTemplate.type_id === 'universal' ? '#1e40af' : '#166534', marginBottom:'0.5rem' }}>
                      {editingTemplate.type_id === 'universal' ? '🌐 GLOBAL AVAILABILITY:' : '✅ WILL BE INHERITED BY:'}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                      {editingTemplate.type_id === 'universal' ? (
                        <span style={{ color:'#1e40af', fontSize:'0.75rem', fontWeight:700 }}>This template will be available for selection by ALL business types.</span>
                      ) : (
                        <>
                          {businessTypes.filter((c: any) => c.parent_id === editingTemplate.type_id).map((c: any) => (
                            <span key={c.id} style={{ background:'#dcfce7', color:'#166534', padding:'3px 10px', borderRadius:'50px', fontSize:'0.7rem', fontWeight:700 }}>
                              <i className={c.icon || 'fas fa-tag'} style={{ marginRight:'4px' }}></i>{c.name}
                            </span>
                          ))}
                          {businessTypes.filter((c: any) => c.parent_id === editingTemplate.type_id).length === 0 && (
                            <span style={{ color:'#94a3b8', fontSize:'0.75rem' }}>No child types yet — children you add later will inherit this template.</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                <button disabled={!editingTemplate?.type_id}
                  onClick={() => setFormStep(2)}
                  style={{ background: editingTemplate?.type_id ? '#D4AF37' : '#cbd5e1', color:'#fff', border:'none', padding:'0.85rem 2.5rem', borderRadius:'12px', fontWeight:800, cursor: editingTemplate?.type_id ? 'pointer' : 'not-allowed' }}>
                  NEXT: Set Name & Level →
                </button>
              </div>
            )}

            {/* ── STEP 2: NAME & LEVEL ── */}
            {formStep === 2 && (
              <div>
                <h2 style={{ fontWeight:900, marginBottom:'0.5rem', color:'#0f172a' }}>Step 2 — Template Name & Level</h2>
                <p style={{ color:'#64748b', marginBottom:'2rem', fontSize:'0.85rem' }}>Give this blueprint a clear name and assign its governance level.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'2rem' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'0.7rem', fontWeight:800, color:'#64748b', marginBottom:'0.5rem' }}>TEMPLATE NAME *</label>
                    <input value={editingTemplate?.name || ''}
                      onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      placeholder="e.g. Eco-Lodge Heritage Standard"
                      style={{ width:'100%', padding:'0.9rem 1rem', borderRadius:'10px', border:`2px solid ${editingTemplate?.name ? '#10b981' : '#e2e8f0'}`, outline:'none', fontSize:'0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'0.7rem', fontWeight:800, color:'#64748b', marginBottom:'0.5rem' }}>GOVERNANCE LEVEL</label>
                    <select value={(editingTemplate as any)?.level || 'standard'}
                      onChange={e => setEditingTemplate({...editingTemplate, ...(editingTemplate as any), level: e.target.value} as any)}
                      style={{ width:'100%', padding:'0.9rem 1rem', borderRadius:'10px', border:'2px solid #e2e8f0', outline:'none', fontSize:'0.9rem', fontWeight:700 }}>
                      <option value="basic">Basic — Minimal layout for free tier</option>
                      <option value="standard">Standard — Default layout for most vendors</option>
                      <option value="premium">Premium — Full cinematic experience</option>
                      <option value="enterprise">Enterprise — White-label / custom branding</option>
                    </select>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ display:'block', fontSize:'0.7rem', fontWeight:800, color:'#64748b', marginBottom:'0.5rem' }}>DESCRIPTION (optional)</label>
                    <textarea value={editingTemplate?.description || ''}
                      onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                      placeholder="What makes this template unique..."
                      rows={2}
                      style={{ width:'100%', padding:'0.9rem 1rem', borderRadius:'10px', border:'2px solid #e2e8f0', outline:'none', fontSize:'0.85rem', resize:'none' }}
                    />
                  </div>
                </div>
                <div style={{ display:'flex', gap:'1rem' }}>
                  <button onClick={() => setFormStep(1)} style={{ background:'#f1f5f9', border:'none', padding:'0.85rem 2rem', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>← BACK</button>
                  <button disabled={!editingTemplate?.name} onClick={() => setFormStep(3)}
                    style={{ background: editingTemplate?.name ? '#D4AF37' : '#cbd5e1', color:'#fff', border:'none', padding:'0.85rem 2.5rem', borderRadius:'12px', fontWeight:800, cursor: editingTemplate?.name ? 'pointer' : 'not-allowed' }}>
                    NEXT: Add Components →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: COMPONENTS & FEATURES ── */}
            {formStep === 3 && (
              <div>
                <h2 style={{ fontWeight:900, marginBottom:'0.5rem', color:'#0f172a' }}>Step 3 — Components & Feature DNA</h2>
                <p style={{ color:'#64748b', marginBottom:'2rem', fontSize:'0.85rem' }}>Define the visual blocks and feature gates for this template.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:'3rem' }}>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                      <h3 style={{ fontWeight:900, margin:0 }}>Layout Components</h3>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <button onClick={() => addComponent('hero_carousel')} style={{ fontSize:'0.7rem', fontWeight:800, background:'#f1f5f9', border:'none', padding:'0.4rem 0.8rem', borderRadius:'8px', cursor:'pointer' }}>+ CAROUSEL</button>
                        <button onClick={() => addComponent('gallery')} style={{ fontSize:'0.7rem', fontWeight:800, background:'#f1f5f9', border:'none', padding:'0.4rem 0.8rem', borderRadius:'8px', cursor:'pointer' }}>+ GALLERY</button>
                        <button onClick={() => addComponent('blog')} style={{ fontSize:'0.7rem', fontWeight:800, background:'#f1f5f9', border:'none', padding:'0.4rem 0.8rem', borderRadius:'8px', cursor:'pointer' }}>+ BLOG</button>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                      {editingTemplate?.layout?.map((c, i) => (
                        <div key={c.id} style={{ background:'#f8fafc', padding:'1rem', borderRadius:'12px', border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                            <div style={{ width:'28px', height:'28px', background:'#D4AF37', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'0.75rem', fontWeight:800 }}>{i+1}</div>
                            <div style={{ fontWeight:800, fontSize:'0.85rem' }}>{(c.type || 'unknown').toUpperCase()}</div>
                          </div>
                          <button onClick={() => { const nl = editingTemplate.layout?.filter((_:any,idx:number)=>idx!==i); setEditingTemplate({...editingTemplate,layout:nl}); }}
                            style={{ color:'#ef4444', border:'none', background:'transparent', cursor:'pointer', fontWeight:800, fontSize:'0.75rem' }}>REMOVE</button>
                        </div>
                      ))}
                      {(!editingTemplate?.layout || editingTemplate.layout.length === 0) && (
                        <div style={{ padding:'2rem', border:'2px dashed #e2e8f0', borderRadius:'12px', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem' }}>Add components above to define the visual flow.</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 900, margin: '0 0 1rem 0' }}>Feature DNA</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[
                        { id: 'captions', name: 'Enable Image Captions' },
                        { id: 'booking', name: 'Enable Booking Button' },
                        { id: 'verification', name: 'Show Heritage Verified Badge' },
                        { id: 'youtube_bg', name: 'YouTube Cinematic Background' },
                        { id: 'direct_contact', name: 'Allow Direct Contact' },
                        { id: 'custom_logo', name: 'Custom Business Logo' },
                      ].map(f => (
                        <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                          <input type="checkbox" checked={!!editingTemplate?.features?.[f.id]}
                            onChange={e => setEditingTemplate({ ...editingTemplate, features: { ...editingTemplate?.features, [f.id]: e.target.checked } })} />
                          {f.name}
                        </label>
                      ))}
                    </div>

                    <h3 style={{ fontWeight: 900, margin: '2rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-eye-slash" style={{ fontSize: '0.9rem', color: '#64748b' }}></i>
                      Section Governance
                    </h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', padding: '0.5rem', letterSpacing: '0.5px' }}>HIDE SECTIONS FOR THIS BLUEPRINT</div>
                      {(() => {
                        // Fetch sections if we haven't already (already done in parent or similar)
                        // For now we assume sections are loaded or use a placeholder if not
                        // Let's add a quick state to hold sections in this component
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {businessTypes.find(t => t.id === editingTemplate?.type_id)?.sections?.map((sid: string) => (
                              <label key={sid} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', border: '1px solid #f1f5f9' }}>
                                <input 
                                  type="checkbox" 
                                  checked={!!editingTemplate?.features?.hidden_sections?.includes(sid)}
                                  onChange={e => {
                                    const current = editingTemplate?.features?.hidden_sections || [];
                                    const next = e.target.checked ? [...current, sid] : current.filter((id: string) => id !== sid);
                                    setEditingTemplate({ ...editingTemplate, features: { ...editingTemplate?.features, hidden_sections: next } });
                                  }} 
                                />
                                <span style={{ fontWeight: 700 }}>{sid.replace(/_/g, ' ').toUpperCase()}</span>
                              </label>
                            ))}
                            {(!businessTypes.find(t => t.id === editingTemplate?.type_id)?.sections || businessTypes.find(t => t.id === editingTemplate?.type_id)?.sections?.length === 0) && (
                              <div style={{ padding: '1rem', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>No sections linked to this type.</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop:'2rem', display:'flex', gap:'1rem' }}>
                  <button onClick={() => setFormStep(2)} style={{ background:'#f1f5f9', border:'none', padding:'0.85rem 2rem', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>← BACK</button>
                  <button onClick={handleSave} style={{ background:'#10b981', color:'#fff', border:'none', padding:'0.85rem 3rem', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>💾 SAVE BLUEPRINT</button>
                  <button onClick={() => setEditingTemplate(null)} style={{ background:'#64748b', color:'#fff', border:'none', padding:'0.85rem 2rem', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>CANCEL</button>
                </div>
              </div>
            )}

          </div>
        ) : (
          // ── LISTING: Universal + grouped by parent type ──
          <div>
            {/* ── UNIVERSAL TEMPLATES (no type_id) ── */}
            {(() => {
              const universalTemplates = templates.filter(t => !t.type_id);
              if (universalTemplates.length === 0) return null;
              return (
                <div style={{ marginBottom:'3rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:'3px solid #10b981' }}>
                    <i className="fas fa-globe" style={{ color: '#10b981', fontSize:'1.2rem' }}></i>
                    <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:900, color:'#0f172a' }}>Universal Templates</h2>
                    <span style={{ fontSize:'0.65rem', background:'#dcfce7', padding:'2px 8px', borderRadius:'50px', color:'#166534', fontWeight:700 }}>{universalTemplates.length} blueprint{universalTemplates.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize:'0.6rem', background:'#f0fdf4', color:'#15803d', padding:'2px 8px', borderRadius:'50px', fontWeight:600 }}>Available for ALL business types</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
                    {universalTemplates.map(t => (
                      <div key={t.id} style={{ background:'#fff', borderRadius:'16px', padding:'1.5rem', border:'2px solid #10b981', position:'relative' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                            <span style={{ background:'#10b981', color:'#fff', padding:'2px 8px', borderRadius:'50px', fontSize:'0.55rem', fontWeight:800 }}>🌐 UNIVERSAL</span>
                            {(t as any).level && <span style={{ background:'#1e293b', color:'#fff', padding:'2px 8px', borderRadius:'50px', fontSize:'0.55rem', fontWeight:800 }}>{(t.level || '').toUpperCase()}</span>}
                          </div>
                          <div style={{ display:'flex', gap:'0.4rem' }}>
                            <Link href={`/jana/orchestrator?template=${t.id}`} style={{ textDecoration: 'none' }}>
                              <button style={{ background:'#dbeafe', color:'#1e40af', border:'none', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'0.65rem', fontWeight:800 }}>BUILD SITE</button>
                            </Link>
                            <button onClick={() => { setEditingTemplate(t); setFormStep(2); }} style={{ background:'#f1f5f9', border:'none', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'0.65rem', fontWeight:800 }}>EDIT</button>
                            <button onClick={() => handleDelete(t.id)} style={{ background:'#fee2e2', color:'#991b1b', border:'none', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'0.65rem', fontWeight:800 }}>DEL</button>
                          </div>
                        </div>
                        <h3 style={{ fontWeight:900, fontSize:'1.1rem', marginBottom:'0.25rem' }}>{t.name}</h3>
                        <p style={{ color:'#64748b', fontSize:'0.7rem', marginBottom:'0.5rem' }}>{t.description}</p>
                        <p style={{ color:'#94a3b8', fontSize:'0.65rem', marginBottom:'0.75rem' }}>ID: {t.id}</p>
                        <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                          {t.layout.map((c: any, i: number) => (
                            <span key={i} style={{ background:'#f0fdf4', padding:'2px 7px', borderRadius:'6px', fontSize:'0.6rem', fontWeight:800, color:'#166534' }}>{(c.type || 'unknown').toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── TYPE-SPECIFIC TEMPLATES ── */}
            {parentTypes.map((pt: any) => {
              const ptTemplates = templates.filter(t => t.type_id === pt.id);
              if (ptTemplates.length === 0) return null;
              return (
                <div key={pt.id} style={{ marginBottom:'3rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:`3px solid ${pt.icon_color || '#D4AF37'}` }}>
                    <i className={pt.icon || 'fas fa-folder'} style={{ color: pt.icon_color || '#D4AF37', fontSize:'1.2rem' }}></i>
                    <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:900, color:'#0f172a' }}>{pt.name}</h2>
                    <span style={{ fontSize:'0.65rem', background:'#f1f5f9', padding:'2px 8px', borderRadius:'50px', color:'#64748b', fontWeight:700 }}>{ptTemplates.length} blueprint{ptTemplates.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
                    {ptTemplates.map(t => (
                      <div key={t.id} style={{ background:'#fff', borderRadius:'16px', padding:'1.5rem', border:`2px solid ${pt.icon_color || '#e2e8f0'}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                            <span style={{ background:'#D4AF37', color:'#fff', padding:'2px 8px', borderRadius:'50px', fontSize:'0.55rem', fontWeight:800 }}>BLUEPRINT</span>
                            {(t as any).level && <span style={{ background:'#1e293b', color:'#fff', padding:'2px 8px', borderRadius:'50px', fontSize:'0.55rem', fontWeight:800 }}>{(t.level || '').toUpperCase()}</span>}
                          </div>
                          <div style={{ display:'flex', gap:'0.4rem' }}>
                            <Link href={`/jana/orchestrator?template=${t.id}&type=${pt.id}`} style={{ textDecoration: 'none' }}>
                              <button style={{ background:'#dbeafe', color:'#1e40af', border:'none', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'0.65rem', fontWeight:800 }}>BUILD SITE</button>
                            </Link>
                            <button onClick={() => { setEditingTemplate(t); setFormStep(2); }} style={{ background:'#f1f5f9', border:'none', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'0.65rem', fontWeight:800 }}>EDIT</button>
                            <button onClick={() => handleDelete(t.id)} style={{ background:'#fee2e2', color:'#991b1b', border:'none', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'0.65rem', fontWeight:800 }}>DEL</button>
                          </div>
                        </div>
                        <h3 style={{ fontWeight:900, fontSize:'1.1rem', marginBottom:'0.25rem' }}>{t.name}</h3>
                        <p style={{ color:'#94a3b8', fontSize:'0.7rem', marginBottom:'0.75rem' }}>ID: {t.id}</p>
                        <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                          {t.layout.map((c: any, i: number) => (
                            <span key={i} style={{ background:'#f8fafc', padding:'2px 7px', borderRadius:'6px', fontSize:'0.6rem', fontWeight:800, color:'#64748b' }}>{(c.type || 'unknown').toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && !loading && (
              <div style={{ textAlign:'center', padding:'6rem', background:'#fff', borderRadius:'24px', border:'2px dashed #e2e8f0' }}>
                <h3>No Blueprints Yet</h3>
                <p style={{ color:'#94a3b8' }}>Click "Create Master Blueprint" and follow the 3-step governance flow.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

