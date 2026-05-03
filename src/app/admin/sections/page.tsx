'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useSearchParams } from 'next/navigation';

interface Section {
  id: string;
  name: string;
  icon: string;
  required: boolean;
  vendor_editable: boolean;
  show_on_public: boolean;
  is_filterable: boolean;
  show_on_card: boolean;
  is_universal: boolean;
}

const SECTION_ICONS = [
  'fa-info-circle', 'fa-map-marker-alt', 'fa-phone', 'fa-list', 'fa-calendar',
  'fa-box', 'fa-star', 'fa-bed', 'fa-wifi', 'fa-campground', 'fa-fire',
  'fa-cube', 'fa-clock', 'fa-feather', 'fa-utensils', 'fa-chair', 'fa-mug-hot',
  'fa-route', 'fa-hourglass', 'fa-language', 'fa-tags', 'fa-water', 'fa-landmark'
];

function SectionsContent() {
  const { notify } = useAdmin();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const typeId = searchParams.get('typeId'); // The typology we are adding to

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // Editor State
  const [showModal, setShowModal] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [showComponentDesigner, setShowComponentDesigner] = useState<string | null>(null);
  const [sectionFields, setSectionFields] = useState<any[]>([]);
  const [fieldDefs, setFieldDefs] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
  const [inspectingField, setInspectingField] = useState<any | null>(null);

  // --- AUTO-ASSIGN LOGIC (THE "MANIPULATION" FIX) ---
  async function assignAndReturn(sectionId: string) {
    if (!typeId) return;
    setIsAssigning(true);
    try {
      // 1. Fetch the absolute latest typology state
      const tRes = await fetch('/api/admin/types');
      if (!tRes.ok) throw new Error('Could not connect to Typology Registry');
      const allTypes = await tRes.json();
      const targetType = allTypes.find((t: any) => t.id === typeId);

      if (!targetType) throw new Error('Target typology has disappeared or changed ID');

      // 2. Manipulate the sections array
      const currentSections = Array.isArray(targetType.sections) ? targetType.sections : [];
      const updatedSections = currentSections.includes(sectionId)
        ? currentSections
        : [...currentSections, sectionId];

      // 3. Construct a perfect payload for the PUT API
      const payload = {
        id: targetType.id,
        name: targetType.name,
        icon: targetType.icon || 'fa-box',
        icon_color: targetType.icon_color || '#D4AF37',
        description: targetType.description || '',
        is_parent: targetType.is_parent ? 1 : 0,
        parent_id: targetType.parent_id || null,
        active: 1, // Ensure it stays active
        sections: updatedSections,
        own_sections: targetType.own_sections || []
      };

      // 4. Save to Database
      const saveRes = await fetch('/api/admin/types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (saveRes.ok) {
        notify(`Success! ${targetType.name} now includes ${sectionId}.`, 'success');
        // Decode and return
        const destination = returnTo ? decodeURIComponent(returnTo) : '/admin/governance';
        window.location.href = destination;
      } else {
        const errData = await saveRes.json();
        throw new Error(errData.error || 'The Governance Registry rejected this assignment');
      }
    } catch (e: any) {
      notify(`Assignment Failed: ${e.message}`, 'error');
    } finally {
      setIsAssigning(false);
    }
  }

  useEffect(() => { loadSections(); }, []);

  async function loadSections() {
    setLoading(true);
    const res = await fetch('/api/admin/sections');
    if (res.ok) setSections(await res.json());
    const fdRes = await fetch('/api/admin/field-definitions');
    if (fdRes.ok) setFieldDefs(await fdRes.json());
    setLoading(false);
  }

  async function loadSectionFields(sid: string) {
    const res = await fetch(`/api/admin/forms?type=SECTION_TEMPLATE&section=${sid}`);
    if (res.ok) setSectionFields(await res.json());
  }

  async function addFieldToSection(sid: string, defId: string) {
    const def = fieldDefs.find(d => d.id === defId);
    if (!def) return;
    const res = await fetch('/api/admin/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_type_id: 'SECTION_TEMPLATE',
        section_id: sid,
        name: def.id + '_' + Date.now().toString().slice(-4),
        label: def.name,
        field_type: def.id
      })
    });
    if (res.ok) {
      notify(`${def.name} added to blueprint.`, 'success');
      loadSectionFields(sid);
    }
  }

  async function removeFieldFromSection(fid: string, sid: string) {
    await fetch(`/api/admin/forms?id=${fid}`, { method: 'DELETE' });
    loadSectionFields(sid);
  }

  async function updateFieldInSection() {
    if (!inspectingField) return;
    const res = await fetch('/api/admin/forms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inspectingField)
    });
    if (res.ok) {
      notify('Component updated in blueprint.', 'success');
      loadSectionFields(showComponentDesigner!);
      setInspectingField(null);
    }
  }

  const openEditor = (section: Partial<Section> | null) => {
    if (section) {
      setEditingSection({ ...section });
      setIsNew(false);
    } else {
      setEditingSection({
        id: '', name: '', icon: 'fa-info-circle',
        required: false, vendor_editable: true, show_on_public: true,
        is_filterable: false, show_on_card: false, is_universal: false
      });
      setIsNew(true);
    }
    setShowModal(true);
  };

  const generateId = (name: string) => {
    if (!isNew) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setEditingSection(prev => prev ? { ...prev, id: slug } : null);
  };

  async function saveSection() {
    if (!editingSection?.id || !editingSection?.name) return;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch('/api/admin/sections', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSection),
    });
    if (res.ok) {
      notify(`Block architected successfully.`, 'success');
      setShowModal(false);
      loadSections();
    }
  }

  async function deleteSection(id: string) {
    if (!confirm(`Delete section "${id}"?`)) return;
    await fetch(`/api/admin/sections?id=${id}`, { method: 'DELETE' });
    loadSections();
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i></div>;

  return (
    <div className="animate-in">
      {isAssigning && (
        <div className="modal-overlay" style={{ background: 'rgba(255,255,255,0.8)', zIndex: 9999 }}>
          <div style={{ textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '1rem' }}></i>
            <p style={{ fontWeight: 800 }}>MAPPING ARCHITECTURE...</p>
          </div>
        </div>
      )}

      {returnTo && (
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)', padding: '1.25rem 2.5rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(212,175,55,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-magic" style={{ color: '#D4AF37', fontSize: '1.1rem' }}></i>
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.5px' }}>WIZARD: COMPONENT MAPPING</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Select or create a module blueprint to assign it to the active typology.</div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ background: '#D4AF37', color: '#1a1a2e', border: 'none', fontWeight: 900, padding: '0.75rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}
            onClick={() => window.location.href = returnTo}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '0.75rem' }}></i> RETURN TO STUDIO
          </button>
        </div>
      )}

      <div className="card-header">
        <div>
          <h3><i className="fas fa-layer-group"></i> Section Architect</h3>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Define and govern informational blocks for your business ecosystem.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditor(null)}>
          <i className="fas fa-plus"></i> CREATE NEW SECTION
        </button>
      </div>

      <div className="grid-2" style={{ marginTop: '2rem' }}>
        {sections.map(s => (
          <div key={s.id} className="card h-full" style={{ borderLeft: `4px solid ${s.is_universal ? '#10b981' : '#D4AF37'}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', position: 'relative' }}>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#f3f4f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#1a1a2e' }}>
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1a1a2e' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>ID: {s.id}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-xs btn-outline" onClick={() => openEditor(s)}><i className="fas fa-edit"></i></button>
                  <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => deleteSection(s.id)}><i className="fas fa-trash"></i></button>
                </div>
              </div>

              {/* ACTIONABLE ASSIGN BUTTON (WIZARD ONLY) */}
              {typeId && (
                <button
                  className="btn btn-sm btn-primary"
                  style={{ width: '100%', marginTop: '1rem', background: '#0f172a', borderColor: '#0f172a' }}
                  onClick={() => assignAndReturn(s.id)}
                >
                  <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i> SELECT & ASSIGN
                </button>
              )}

              <div className="governance-matrix" style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div title="Mandatory" style={{ fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px', background: s.required ? '#fee2e2' : '#f3f4f6', color: s.required ? '#991b1b' : '#6b7280', textAlign: 'center' }}>
                  <i className={`fas ${s.required ? 'fa-lock' : 'fa-lock-open'}`}></i> REQ
                </div>
                <div title="Vendor Editable" style={{ fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px', background: s.vendor_editable ? '#d1fae5' : '#fef3c7', color: s.vendor_editable ? '#065f46' : '#92400e', textAlign: 'center' }}>
                  <i className={`fas ${s.vendor_editable ? 'fa-edit' : 'fa-user-shield'}`}></i> {s.vendor_editable ? 'VNDR' : 'ADM'}
                </div>
                <div title="Public Visibility" style={{ fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px', background: s.show_on_public ? '#dbeafe' : '#f3f4f6', color: s.show_on_public ? '#1e40af' : '#6b7280', textAlign: 'center' }}>
                  <i className={`fas ${s.show_on_public ? 'fa-eye' : 'fa-eye-slash'}`}></i> PUB
                </div>
                <div title="Search Filter" style={{ fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px', background: s.is_filterable ? '#ede9fe' : '#f3f4f6', color: s.is_filterable ? '#5b21b6' : '#6b7280', textAlign: 'center' }}>
                  <i className="fas fa-search"></i> FLTR
                </div>
                <div title="Show on Card" style={{ fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px', background: s.show_on_card ? '#fae8ff' : '#f3f4f6', color: s.show_on_card ? '#86198f' : '#6b7280', textAlign: 'center' }}>
                  <i className="fas fa-id-card"></i> CARD
                </div>
                <div title="Universal Usage" style={{ fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px', background: s.is_universal ? '#ecfdf5' : '#f3f4f6', color: s.is_universal ? '#065f46' : '#6b7280', textAlign: 'center' }}>
                  <i className="fas fa-globe-africa"></i> UNIV
                </div>
              </div>

              <button
                className="btn btn-sm btn-outline"
                style={{ width: '100%', marginTop: '1.5rem', fontWeight: 800, color: '#D4AF37', borderColor: '#D4AF37' }}
                onClick={() => { setShowComponentDesigner(s.id); loadSectionFields(s.id); }}
              >
                <i className="fas fa-pencil-ruler" style={{ marginRight: '0.5rem' }}></i> DESIGN COMPONENTS
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDITOR MODAL */}
      {showModal && editingSection && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="card animate-in" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>{isNew ? 'Define New Block' : 'Architect Data Block'}</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label required">Block Name</label>
                <input
                  type="text" className="form-control" placeholder="e.g. Wellness Spa"
                  value={editingSection.name}
                  onChange={e => {
                    setEditingSection({ ...editingSection, name: e.target.value });
                    generateId(e.target.value);
                  }}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Database Identity (Slug)</label>
                <input
                  type="text" className="form-control" style={{ background: '#f8fafc', fontFamily: 'monospace' }}
                  value={editingSection.id}
                  readOnly={!isNew}
                  onChange={e => setEditingSection({ ...editingSection, id: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Visual Icon Binder</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {SECTION_ICONS.map(icon => (
                    <div
                      key={icon}
                      onClick={() => setEditingSection({ ...editingSection, icon })}
                      style={{ width: '36px', height: '36px', borderRadius: '6px', border: editingSection.icon === icon ? '2px solid #D4AF37' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: editingSection.icon === icon ? '#fff' : 'transparent' }}
                    >
                      <i className={`fas ${icon}`} style={{ color: editingSection.icon === icon ? '#D4AF37' : '#6b7280' }}></i>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <label className="form-label" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'block' }}>Governance Matrix Configuration</label>
                <div className="grid-2">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingSection.required} onChange={e => setEditingSection({ ...editingSection, required: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Required (Mandatory Data)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingSection.vendor_editable} onChange={e => setEditingSection({ ...editingSection, vendor_editable: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Vendor Editable Permissions</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingSection.show_on_public} onChange={e => setEditingSection({ ...editingSection, show_on_public: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Active on Public Pages</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingSection.is_filterable} onChange={e => setEditingSection({ ...editingSection, is_filterable: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Enable as Search Filter</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingSection.show_on_card} onChange={e => setEditingSection({ ...editingSection, show_on_card: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Display on Mini-Cards</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingSection.is_universal} onChange={e => setEditingSection({ ...editingSection, is_universal: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Universal (Apply to ALL)</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>CANCEL</button>
              <button className="btn btn-primary" onClick={saveSection}>ARCHITECT BLOCK</button>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENT DESIGNER MODAL */}
      {showComponentDesigner && (
        <div className="modal-overlay" onClick={() => setShowComponentDesigner(null)}>
          <div className="card animate-in" style={{ width: inspectingField ? '1100px' : '800px', display: 'flex', flexDirection: 'column', height: '80vh', transition: 'all 0.3s' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3><i className="fas fa-pencil-ruler"></i> Component Blueprint: {sections.find(s => s.id === showComponentDesigner)?.name}</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setShowComponentDesigner(null)}>×</button>
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Sidebar (Elements) */}
              <div style={{ width: '240px', background: '#f8fafc', padding: '1.5rem', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', marginBottom: '1rem', letterSpacing: '1px' }}>LIBRARY ELEMENTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {fieldDefs.map(def => (
                    <div key={def.id} className="field-pill" style={{ cursor: 'pointer', padding: '0.6rem' }} onClick={() => addFieldToSection(showComponentDesigner, def.id)}>
                      <i className={`fas ${def.icon}`} style={{ color: '#D4AF37' }}></i>
                      {def.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Canvas */}
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#fcfcfc' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', marginBottom: '1.5rem', letterSpacing: '1px' }}>BLUEPRINT PREVIEW (Click to Edit)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sectionFields.map(f => (
                    <div key={f.id}
                      className="studio-glass-panel"
                      style={{
                        padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: inspectingField?.id === f.id ? '#fff' : '#ffffff',
                        border: inspectingField?.id === f.id ? '2px solid #D4AF37' : '1px solid #f1f5f9',
                        cursor: 'pointer',
                        boxShadow: inspectingField?.id === f.id ? '0 10px 15px -3px rgba(212, 175, 55, 0.1)' : 'none'
                      }}
                      onClick={() => setInspectingField(f)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '32px', height: '32px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`fas ${fieldDefs.find(d => d.id === f.field_type)?.icon || 'fa-cube'}`} style={{ color: '#D4AF37' }}></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#1e293b' }}>{f.label}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>{f.field_type}</div>
                        </div>
                      </div>
                      <button className="btn btn-xs btn-outline" style={{ color: '#ef4444', borderColor: '#fee2e2' }} onClick={(e) => { e.stopPropagation(); removeFieldFromSection(f.id, showComponentDesigner); }}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  {sectionFields.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#cbd5e1' }}>
                      <i className="fas fa-drafting-compass fa-3x" style={{ marginBottom: '1rem', opacity: 0.2 }}></i>
                      <p>No components added to this blueprint yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector (Right Sidebar) */}
              {inspectingField && (
                <div style={{ width: '320px', background: '#fff', padding: '1.5rem', borderLeft: '1px solid #e2e8f0', overflowY: 'auto' }} className="animate-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px' }}>COMPONENT SETTINGS</div>
                    <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setInspectingField(null)}><i className="fas fa-times"></i></button>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>DISPLAY LABEL</label>
                    <input
                      type="text" className="form-control"
                      value={inspectingField.label}
                      onChange={e => setInspectingField({ ...inspectingField, label: e.target.value })}
                    />
                  </div>

                  {['select', 'checkbox_group'].includes(inspectingField.field_type) && (
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>OPTIONS (Comma separated)</label>
                      <textarea
                        className="form-control" rows={8}
                        placeholder="Choice 1, Choice 2, Choice 3..."
                        value={Array.isArray(inspectingField.options) ? inspectingField.options.join(', ') : ''}
                        onChange={e => setInspectingField({ ...inspectingField, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      />
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.5rem' }}>Separate multiple choices with commas.</div>
                    </div>
                  )}

                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={updateFieldInSection}>
                      <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i> APPLY CHANGES
                    </button>
                    <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setInspectingField(null)}>CANCEL</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '1.5rem', background: '#f9fafb', borderTop: '1px solid #f3f4f6', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setShowComponentDesigner(null)}>SAVE BLUEPRINT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SectionsPage() {
  return (
    <Suspense fallback={<div className="loading-screen"><i className="fas fa-spinner fa-spin"></i> Loading...</div>}>
      <SectionsContent />
    </Suspense>
  );
}

