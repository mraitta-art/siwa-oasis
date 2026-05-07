'use client';
export const dynamic = 'force-dynamic';

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
  business_type_id?: string | null;
}

interface BusinessType {
  id: string;
  name: string;
  parent_id: string | null;
}

const SECTION_ICONS = [
  'fa-info-circle', 'fa-map-marker-alt', 'fa-phone', 'fa-list', 'fa-calendar',
  'fa-box', 'fa-star', 'fa-bed', 'fa-wifi', 'fa-campground', 'fa-fire',
  'fa-cube', 'fa-clock', 'fa-feather', 'fa-utensils', 'fa-chair', 'fa-mug-hot',
  'fa-route', 'fa-hourglass', 'fa-language', 'fa-tags', 'fa-water', 'fa-landmark'
];

// Standard foundation fields — auto-created with every new section, fully editable
const STANDARD_FIELD_NAMES = ['feature_on_main', 'section_news', 'section_gallery', 'section_blog'];

const FIELD_LIBRARY = [
  { id: 'text', name: 'Short Text', icon: 'fa-font', color: '#3b82f6' },
  { id: 'textarea', name: 'Long Text / Teaser', icon: 'fa-align-left', color: '#8b5cf6' },
  { id: 'rich_text', name: 'Rich Text Blog', icon: 'fa-paragraph', color: '#7c3aed' },
  { id: 'number', name: 'Number / Price', icon: 'fa-hashtag', color: '#10b981' },
  { id: 'select', name: 'Dropdown List', icon: 'fa-list-ul', color: '#f59e0b' },
  { id: 'checkbox', name: 'Yes/No Toggle', icon: 'fa-check-square', color: '#06b6d4' },
  { id: 'gallery', name: 'Image Gallery', icon: 'fa-images', color: '#ec4899' },
  { id: 'url', name: 'Link / URL', icon: 'fa-link', color: '#64748b' },
  { id: 'email', name: 'Email Address', icon: 'fa-envelope', color: '#0ea5e9' },
  { id: 'phone', name: 'Phone Number', icon: 'fa-phone', color: '#16a34a' },
];

function SectionsContent() {
  const { notify } = useAdmin();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const typeId = searchParams.get('typeId'); // The typology we are adding to

  const [sections, setSections] = useState<Section[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
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
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  // --- AUTO-ASSIGN LOGIC (THE "MANIPULATION" FIX) ---
  async function assignAndReturn(sectionId: string) {
    if (!typeId) return;
    setIsAssigning(true);
    try {
      // 1. Fetch the absolute latest typology state
      const tRes = await fetch('/api/jana/types');
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
      const saveRes = await fetch('/api/jana/types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (saveRes.ok) {
        notify(`Success! ${targetType.name} now includes ${sectionId}.`, 'success');
        // Decode and return
        const destination = returnTo ? decodeURIComponent(returnTo) : '/jana/governance';
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
    const [secRes, typesRes, fdRes] = await Promise.all([
      fetch('/api/jana/sections'),
      fetch('/api/jana/types'),
      fetch('/api/jana/field-definitions')
    ]);
    if (secRes.ok) setSections(await secRes.json());
    if (typesRes.ok) setBusinessTypes(await typesRes.json());
    if (fdRes.ok) setFieldDefs(await fdRes.json());
    setLoading(false);
  }

  async function loadSectionFields(sid: string) {
    setSectionFields([]);
    const res = await fetch(`/api/jana/forms?type=SECTION_TEMPLATE&section=${sid}`);
    if (res.ok) setSectionFields(await res.json());
  }

  async function addFieldToSection(sid: string) {
    if (!newFieldLabel.trim()) { notify('Please enter a field label', 'error'); return; }
    const name = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const res = await fetch('/api/jana/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_type_id: 'SECTION_TEMPLATE',
        section_id: sid,
        name,
        label: newFieldLabel,
        field_type: newFieldType
      })
    });
    if (res.ok) {
      notify(`"${newFieldLabel}" added to blueprint.`, 'success');
      setAddingField(false);
      setNewFieldLabel('');
      setNewFieldType('text');
      loadSectionFields(sid);
    } else {
      const err = await res.json();
      notify(err.error || 'Failed to add field', 'error');
    }
  }

  async function removeFieldFromSection(fid: string, sid: string) {
    const res = await fetch(`/api/jana/forms?id=${fid}`, { method: 'DELETE' });
    if (res.ok) {
      loadSectionFields(sid);
    } else {
      const err = await res.json();
      notify(err.error || 'Cannot delete this field', 'error');
    }
  }

  async function updateFieldInSection() {
    if (!inspectingField) return;
    const res = await fetch('/api/jana/forms', {
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
        is_filterable: false, show_on_card: false, is_universal: false,
        business_type_id: null
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
    if (!editingSection?.id || !editingSection?.name) {
      notify('Block Name and ID are required.', 'error'); return;
    }
    // ENFORCE: non-universal sections MUST have a parent
    if (!editingSection.is_universal && !editingSection.business_type_id) {
      notify('A Master Parent business type is required. If this section applies to ALL types, toggle "Universal".', 'error');
      return;
    }
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch('/api/jana/sections', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSection),
    });
    if (res.ok) {
      notify(`Block architected successfully.`, 'success');
      setShowModal(false);
      loadSections();
    } else {
      const err = await res.json();
      notify(err.error || 'Failed to save section.', 'error');
    }
  }

  async function deleteSection(id: string) {
    if (!confirm(`Delete section "${id}"?`)) return;
    await fetch(`/api/jana/sections?id=${id}`, { method: 'DELETE' });
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
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Every section must declare a Master Parent — no orphan sections allowed.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditor(null)}>
          <i className="fas fa-plus"></i> CREATE NEW SECTION
        </button>
      </div>

      {/* STATS BAR */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '0.75rem 1.25rem', fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37' }}>
          <i className="fas fa-globe" style={{ marginRight: '0.5rem' }}></i>
          {sections.filter(s => s.is_universal).length} UNIVERSAL
        </div>
        {Array.from(new Set(sections.filter(s => !s.is_universal && s.business_type_id).map(s => s.business_type_id))).map(tid => {
          const type = businessTypes.find(t => t.id === tid);
          const count = sections.filter(s => s.business_type_id === tid).length;
          return (
            <div key={tid} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1.25rem', fontSize: '0.7rem', fontWeight: 900, color: '#1e293b' }}>
              <i className="fas fa-sitemap" style={{ marginRight: '0.5rem', color: '#64748b' }}></i>
              {type?.name || tid}: {count}
            </div>
          );
        })}
        {sections.filter(s => !s.is_universal && !s.business_type_id).length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.75rem 1.25rem', fontSize: '0.7rem', fontWeight: 900, color: '#ef4444' }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {sections.filter(s => !s.is_universal && !s.business_type_id).length} ORPHANED
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: '2rem' }}>
        {sections.map(s => (
          <div key={s.id} className="card h-full" 
            style={{ 
              background: '#fff',
              border: `1px solid ${!s.is_universal && !s.business_type_id ? 'rgba(239,68,68,0.3)' : '#e2e8f0'}`,
              borderTop: `4px solid ${s.is_universal ? '#D4AF37' : !s.business_type_id ? '#ef4444' : '#1e293b'}`, 
              boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', 
              position: 'relative',
              transition: 'all 0.3s ease',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
            
            {s.is_universal ? (
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 8px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-globe"></i> UNIVERSAL
              </div>
            ) : s.business_type_id ? (
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(30,41,59,0.06)', color: '#1e293b', padding: '4px 8px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-sitemap"></i> {businessTypes.find(t => t.id === s.business_type_id)?.name || s.business_type_id}
              </div>
            ) : (
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-exclamation-triangle"></i> NO PARENT
              </div>
            )}

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ 
                    width: '50px', height: '50px', 
                    background: s.is_universal ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#f8fafc', 
                    borderRadius: '14px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '1.4rem', 
                    color: s.is_universal ? '#D4AF37' : '#1e293b',
                    boxShadow: s.is_universal ? '0 10px 15px -3px rgba(0,0,0,0.2)' : 'none'
                  }}>
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>BLOCK_ID: {s.id}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-xs btn-outline" style={{ border: 'none', background: '#f8fafc' }} onClick={() => openEditor(s)}><i className="fas fa-cog" style={{ color: '#64748b' }}></i></button>
                  <button className="btn btn-xs btn-outline" style={{ border: 'none', background: '#fef2f2' }} onClick={() => deleteSection(s.id)}><i className="fas fa-trash" style={{ color: '#ef4444' }}></i></button>
                </div>
              </div>

              <div className="governance-matrix" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div title="Mandatory" style={{ fontSize: '0.65rem', padding: '0.6rem', borderRadius: '8px', background: s.required ? 'rgba(239, 68, 68, 0.05)' : '#f8fafc', color: s.required ? '#ef4444' : '#94a3b8', textAlign: 'center', border: s.required ? '1px solid rgba(239, 68, 68, 0.1)' : '1px solid #f1f5f9', fontWeight: 800 }}>
                  <i className={`fas ${s.required ? 'fa-lock' : 'fa-lock-open'}`} style={{ marginRight: '4px' }}></i> REQ
                </div>
                <div title="Vendor Editable" style={{ fontSize: '0.65rem', padding: '0.6rem', borderRadius: '8px', background: s.vendor_editable ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc', color: s.vendor_editable ? '#10b981' : '#94a3b8', textAlign: 'center', border: s.vendor_editable ? '1px solid rgba(16, 185, 129, 0.1)' : '1px solid #f1f5f9', fontWeight: 800 }}>
                  <i className={`fas ${s.vendor_editable ? 'fa-user-edit' : 'fa-user-shield'}`} style={{ marginRight: '4px' }}></i> {s.vendor_editable ? 'VNDR' : 'ADM'}
                </div>
                <div title="Public Visibility" style={{ fontSize: '0.65rem', padding: '0.6rem', borderRadius: '8px', background: s.show_on_public ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc', color: s.show_on_public ? '#3b82f6' : '#94a3b8', textAlign: 'center', border: s.show_on_public ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid #f1f5f9', fontWeight: 800 }}>
                  <i className={`fas ${s.show_on_public ? 'fa-eye' : 'fa-eye-slash'}`} style={{ marginRight: '4px' }}></i> PUB
                </div>
              </div>

              <button
                className="btn btn-sm btn-primary"
                style={{ 
                  width: '100%', 
                  marginTop: '1.5rem', 
                  fontWeight: 900, 
                  background: s.is_universal ? '#D4AF37' : '#1e293b', 
                  borderColor: s.is_universal ? '#D4AF37' : '#1e293b',
                  color: s.is_universal ? '#1e293b' : '#fff',
                  borderRadius: '12px',
                  padding: '0.8rem',
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onClick={() => { setShowComponentDesigner(s.id); loadSectionFields(s.id); }}
              >
                <i className="fas fa-pencil-ruler" style={{ marginRight: '0.75rem' }}></i> DESIGN BLUEPRINT
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
                  value={editingSection.name || ''}
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
                  value={editingSection.id || ''}
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

              {/* MASTER PARENT SELECTOR */}
              <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', border: !editingSection.is_universal && !editingSection.business_type_id ? '2px solid rgba(239,68,68,0.4)' : '1px solid #e2e8f0', background: !editingSection.is_universal && !editingSection.business_type_id ? 'rgba(239,68,68,0.02)' : '#f9fafb' }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: editingSection.is_universal ? '#94a3b8' : '#1e293b' }}>
                  <i className="fas fa-sitemap" style={{ marginRight: '0.5rem', color: '#D4AF37' }}></i>
                  MASTER PARENT BUSINESS TYPE {!editingSection.is_universal && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <select
                  className="form-control"
                  style={{ marginTop: '0.5rem', opacity: editingSection.is_universal ? 0.4 : 1 }}
                  disabled={!!editingSection.is_universal}
                  value={editingSection.business_type_id || ''}
                  onChange={e => setEditingSection({ ...editingSection, business_type_id: e.target.value || null })}
                >
                  <option value="">— Select Parent Type —</option>
                  {businessTypes.filter(t => !t.parent_id).map(t => (
                    <optgroup key={t.id} label={t.name}>
                      <option value={t.id}>{t.name} (parent)</option>
                      {businessTypes.filter(c => c.parent_id === t.id).map(c => (
                        <option key={c.id} value={c.id}>  ↳ {c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {editingSection.is_universal && (
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.4rem' }}>Universal sections apply to ALL types — no parent needed.</div>
                )}
                {!editingSection.is_universal && !editingSection.business_type_id && (
                  <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.4rem' }}><i className="fas fa-exclamation-triangle" style={{ marginRight: '0.25rem' }}></i>Parent required. Cannot save without assigning a parent type.</div>
                )}
              </div>

              <div style={{ marginTop: '2rem' }}>
                <label className="form-label" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'block' }}>Governance Matrix Configuration</label>
                <div className="grid-2">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.required} onChange={e => setEditingSection({ ...editingSection, required: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Required (Mandatory Data)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.vendor_editable} onChange={e => setEditingSection({ ...editingSection, vendor_editable: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Vendor Editable Permissions</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.show_on_public} onChange={e => setEditingSection({ ...editingSection, show_on_public: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Active on Public Pages</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.is_filterable} onChange={e => setEditingSection({ ...editingSection, is_filterable: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Enable as Search Filter</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.show_on_card} onChange={e => setEditingSection({ ...editingSection, show_on_card: e.target.checked })} />
                    <span style={{ fontSize: '0.85rem' }}>Display on Mini-Cards</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.is_universal} onChange={e => setEditingSection({ ...editingSection, is_universal: e.target.checked })} />
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
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}><i className="fas fa-pencil-ruler"></i> Component Blueprint: {sections.find(s => s.id === showComponentDesigner)?.name}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <a href={`/jana/fast-track?sectionId=${showComponentDesigner}`} style={{ textDecoration: 'none', background: '#10b981', color: '#fff', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <i className="fas fa-bolt"></i> FAST-FILL SECTION
                </a>
                <a href="/jana/form-builder" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#D4AF37', color: '#1e293b', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <i className="fas fa-eye"></i> PREVIEW IN ARCHITECT
                </a>
                <button className="btn btn-xs btn-outline" onClick={() => setShowComponentDesigner(null)}>×</button>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Sidebar: ADD FIELD PANEL */}
              <div style={{ width: '240px', background: '#f8fafc', padding: '1.5rem', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>ADD CUSTOM FIELD</div>
                
                {!addingField ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', background: '#1e293b', borderColor: '#1e293b', fontSize: '0.75rem' }}
                    onClick={() => setAddingField(true)}
                  >
                    <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i> NEW FIELD
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Field Label (e.g. Bed Count)"
                      value={newFieldLabel || ''}
                      onChange={e => setNewFieldLabel(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {FIELD_LIBRARY.map(t => (
                        <button key={t.id}
                          onClick={() => setNewFieldType(t.id)}
                          style={{
                            padding: '0.5rem 0.25rem', borderRadius: '8px', border: newFieldType === t.id ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                            background: newFieldType === t.id ? `${t.color}10` : '#fff', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 800, textAlign: 'center'
                          }}
                        >
                          <i className={`fas ${t.icon}`} style={{ display: 'block', color: t.color, marginBottom: '2px' }}></i>
                          {t.name}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.7rem', background: '#D4AF37', borderColor: '#D4AF37', color: '#1e293b' }}
                        onClick={() => addFieldToSection(showComponentDesigner!)}>
                        SAVE
                      </button>
                      <button className="btn btn-outline" style={{ fontSize: '0.7rem' }} onClick={() => { setAddingField(false); setNewFieldLabel(''); setNewFieldType('text'); }}>
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(212,175,55,0.05)', borderRadius: '8px', border: '1px dashed rgba(212,175,55,0.3)', fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <i className="fas fa-cubes" style={{ color: '#D4AF37', marginRight: '0.4rem' }}></i>
                  <strong style={{ color: '#D4AF37' }}>Standard fields</strong> (Gallery, Blog, Teaser, Feature Toggle) are auto-created with every new section. Fully editable.
                </div>
              </div>

              {/* Canvas */}
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#fcfcfc' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', marginBottom: '1.5rem', letterSpacing: '1px' }}>BLUEPRINT PREVIEW (Click to Edit)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* ALL FIELDS — unified list, standard + custom treated equally */}
                  {sectionFields.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #f1f5f9', borderRadius: '12px', color: '#cbd5e1', fontSize: '0.75rem' }}>
                      No fields yet. Standard fields will appear when synced.
                    </div>
                  )}
                  {sectionFields.map(f => {
                    const isStandard = STANDARD_FIELD_NAMES.includes(f.name);
                    const fieldLib = FIELD_LIBRARY.find(d => d.id === f.field_type);
                    const defIcon = fieldDefs.find(d => d.id === f.field_type);
                    const iconToUse = fieldLib?.icon || defIcon?.icon || 'fa-cube';
                    const colorToUse = fieldLib?.color || '#64748b';
                    return (
                      <div key={f.id}
                        style={{
                          padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: isStandard ? 'rgba(212,175,55,0.03)' : '#fff',
                          borderRadius: '10px',
                          border: inspectingField?.id === f.id ? '2px solid #D4AF37' : isStandard ? '1px solid rgba(212,175,55,0.2)' : '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setInspectingField(f)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '36px', height: '36px', background: isStandard ? 'rgba(212,175,55,0.1)' : '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={`fas ${iconToUse}`} style={{ color: isStandard ? '#D4AF37' : colorToUse }}></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85rem' }}>{f.label}</div>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase' }}>
                              {f.field_type}{isStandard ? ' · STANDARD' : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isStandard && (
                            <span style={{ fontSize: '0.55rem', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', padding: '2px 7px', borderRadius: '4px', fontWeight: 900 }}>STANDARD</span>
                          )}
                          <button className="btn btn-xs btn-outline" style={{ color: '#ef4444', borderColor: '#fee2e2', padding: '4px 6px' }} onClick={(e) => { e.stopPropagation(); removeFieldFromSection(f.id, showComponentDesigner); }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* SYNC BUTTON — if any standard fields are missing, offer to create them */}
                  {sectionFields.filter(f => STANDARD_FIELD_NAMES.includes(f.name)).length < 4 && (
                    <button style={{ background: '#1e293b', color: '#D4AF37', border: 'none', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', width: '100%', marginTop: '0.5rem' }}
                      onClick={async () => { const r = await fetch('/api/setup/migrate-sections'); if (r.ok) { notify('Standard fields synced!', 'success'); loadSectionFields(showComponentDesigner!); } }}>
                      <i className="fas fa-sync" style={{ marginRight: '0.5rem' }}></i> SYNC MISSING STANDARD FIELDS
                    </button>
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
                      value={inspectingField.label || ''}
                      onChange={e => setInspectingField({ ...inspectingField, label: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>DATABASE KEY</label>
                    <input
                      type="text" className="form-control"
                      value={inspectingField.name || ''}
                      onChange={e => setInspectingField({ ...inspectingField, name: e.target.value })}
                    />
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>GOVERNANCE LAYER</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #f1f5f9' }}>
                       <input type="checkbox" checked={!!inspectingField.required} onChange={e => setInspectingField({...inspectingField, required: e.target.checked})} />
                       <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>MANDATORY (REQUIRED FIELD)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #f1f5f9' }}>
                       <input type="checkbox" checked={!!inspectingField.vendor_editable} onChange={e => setInspectingField({...inspectingField, vendor_editable: e.target.checked})} />
                       <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>VENDOR EDITABLE PERMISSION</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #f1f5f9' }}>
                       <input type="checkbox" checked={!!inspectingField.show_on_public} onChange={e => setInspectingField({...inspectingField, show_on_public: e.target.checked})} />
                       <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>PUBLIC DISCOVERY VISIBILITY</span>
                    </label>
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

