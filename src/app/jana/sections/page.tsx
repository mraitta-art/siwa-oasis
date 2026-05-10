'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useSearchParams } from 'next/navigation';
import TagInput from '@/components/TagInput';
import { SIWA_DEFS } from '@/lib/governance/constants';

const SECTION_ICONS = SIWA_DEFS.sectionIcons;
const FIELD_LIBRARY = SIWA_DEFS.fieldLibrary;
const STANDARD_FIELD_NAMES = SIWA_DEFS.sectionStandards.map(s => s.name);

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
  // Inline blueprint designer — replaces modal
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sectionFieldsMap, setSectionFieldsMap] = useState<Record<string, any[]>>({});
  const [fieldDefs, setFieldDefs] = useState<any[]>([]);
  const [libraryComponents, setLibraryComponents] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
  const [inspectingField, setInspectingField] = useState<any | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  // Link to Types
  const [linkingSection, setLinkingSection] = useState<string | null>(null);
  const [selectedLinkTypes, setSelectedLinkTypes] = useState<string[]>([]);

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
    const [secRes, typesRes, fdRes, libRes] = await Promise.all([
      fetch('/api/jana/sections'),
      fetch('/api/jana/types'),
      fetch('/api/jana/field-definitions'),
      fetch('/api/jana/component-library')
    ]);
    if (secRes.ok) setSections(await secRes.json());
    if (typesRes.ok) setBusinessTypes(await typesRes.json());
    if (fdRes.ok) setFieldDefs(await fdRes.json());
    if (libRes.ok) setLibraryComponents(await libRes.json());
    setLoading(false);
  }

  async function loadSectionFields(sid: string) {
    const res = await fetch(`/api/jana/forms?type=SECTION_TEMPLATE&section=${sid}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`[BLUEPRINT] Loaded ${data.length} fields for section ${sid}:`, data);
      setSectionFieldsMap(prev => ({ ...prev, [sid]: data }));
    }
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

  async function updateFieldInSection(sid: string) {
    if (!inspectingField) return;
    const res = await fetch('/api/jana/forms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inspectingField)
    });
    if (res.ok) {
      notify('Field updated.', 'success');
      loadSectionFields(sid);
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
      notify('Block architected successfully.', 'success');
      setShowModal(false);
      // ── AUTO-INJECT STANDARD DNA FIELDS on new section ──
      if (isNew && editingSection.id) {
        const sid = editingSection.id;
        const standardFields = SIWA_DEFS.sectionStandards;
        await Promise.all(standardFields.map(f =>
          fetch('/api/jana/forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...f, business_type_id: 'SECTION_TEMPLATE', section_id: sid, required: false, vendor_editable: true })
          })
        ));
        notify('Standard DNA fields auto-injected ✓', 'success');
      }
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

  async function moveSection(id: string, direction: number) {
    const currentIndex = sections.findIndex(s => s.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const newSections = [...sections];
    const temp = newSections[currentIndex];
    newSections[currentIndex] = newSections[newIndex];
    newSections[newIndex] = temp;
    
    setSections(newSections);
    
    try {
      // Re-index sequentially to prevent SQLite locks (SQLITE_BUSY) or Failed to fetch errors
      for (let index = 0; index < newSections.length; index++) {
        const sec = newSections[index];
        await fetch('/api/jana/sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sec.id, sort_order: index + 1 })
        });
      }
      notify('Order synchronized successfully.', 'success');
    } catch (e) {
      notify('Failed to update order', 'error');
      loadSections();
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i></div>;

  return (
    <div className="animate-in" style={{ paddingBottom: '5rem' }}>
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

      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-layer-group" style={{ color: '#1e293b' }}></i> Section Architect
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>Architect the DNA of your platform. Universal blocks apply to all businesses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditor(null)} style={{ background: '#1e293b', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 900 }}>
          <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i> NEW BLOCK
        </button>
      </div>

      {/* STATS & FILTERS */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '0.6rem 1.25rem', fontSize: '0.75rem', fontWeight: 900, color: '#D4AF37' }}>
          <i className="fas fa-globe" style={{ marginRight: '0.5rem' }}></i>
          {sections.filter(s => s.is_universal).length} UNIVERSAL
        </div>
        {Array.from(new Set(sections.filter(s => !s.is_universal && s.business_type_id).map(s => s.business_type_id))).map(tid => {
          const type = businessTypes.find(t => t.id === tid);
          return (
            <div key={tid} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 1.25rem', fontSize: '0.75rem', fontWeight: 900, color: '#1e293b' }}>
              <i className="fas fa-sitemap" style={{ marginRight: '0.5rem', color: '#94a3b8' }}></i>
              {type?.name || tid}
            </div>
          );
        })}
      </div>

      {/* SECTIONS LIST (INLINE ARCHITECTURE) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {sections.map(s => {
          const isExpanded = expandedSection === s.id;
          const fields = sectionFieldsMap[s.id] || [];
          
          return (
            <div key={s.id} style={{ 
              background: '#fff', 
              borderRadius: '24px', 
              border: isExpanded ? '2px solid #D4AF37' : '1px solid #e2e8f0',
              boxShadow: isExpanded ? '0 20px 40px -10px rgba(212,175,55,0.15)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}>
              {/* HEADER ROW */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ 
                  width: '56px', height: '56px', 
                  background: s.is_universal ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#f8fafc', 
                  borderRadius: '16px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '1.5rem', 
                  color: s.is_universal ? '#D4AF37' : '#1e293b',
                  flexShrink: 0
                }}>
                  <i className={`fas ${s.icon}`}></i>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{s.name}</h3>
                    {s.is_universal && <span style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>UNIVERSAL</span>}
                    {s.required && <span style={{ color: '#ef4444', fontSize: '0.6rem' }}><i className="fas fa-lock"></i> REQ</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{s.id}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                      <i className="fas fa-cubes" style={{ marginRight: '0.4rem', color: '#D4AF37' }}></i>
                      {fields.length} Blueprint Fields
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginRight: '0.5rem' }}>
                    <button onClick={() => moveSection(s.id, -1)} className="btn-icon" style={{ fontSize: '0.7rem', padding: '0.2rem' }} title="Move Up"><i className="fas fa-chevron-up"></i></button>
                    <button onClick={() => moveSection(s.id, 1)} className="btn-icon" style={{ fontSize: '0.7rem', padding: '0.2rem' }} title="Move Down"><i className="fas fa-chevron-down"></i></button>
                  </div>

                  <button 
                    onClick={() => {
                      if (isExpanded) setExpandedSection(null);
                      else { setExpandedSection(s.id); loadSectionFields(s.id); }
                      setInspectingField(null);
                    }}
                    style={{ 
                      padding: '0.6rem 1.25rem', 
                      borderRadius: '12px', 
                      background: isExpanded ? '#D4AF37' : '#1e293b',
                      color: isExpanded ? '#1e293b' : '#fff',
                      border: 'none',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-pencil-ruler'}`}></i>
                    {isExpanded ? 'HIDE DESIGNER' : 'DESIGN BLUEPRINT'}
                  </button>

                  <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>

                  <button onClick={() => openEditor(s)} className="btn-icon" title="Edit Metadata"><i className="fas fa-cog"></i></button>
                  <button 
                    onClick={() => {
                      setLinkingSection(s.id);
                      const linked = businessTypes.filter(t => (t as any).sections?.includes(s.id)).map(t => t.id);
                      setSelectedLinkTypes(linked);
                    }} 
                    className="btn-icon" title="Link to Typologies" style={{ color: '#3b82f6' }}
                  >
                    <i className="fas fa-link"></i>
                  </button>
                  {returnTo && (
                    <button 
                      onClick={() => assignAndReturn(s.id)}
                      style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      ASSIGN
                    </button>
                  )}
                  <button onClick={() => deleteSection(s.id)} className="btn-icon" style={{ color: '#ef4444' }}><i className="fas fa-trash"></i></button>
                </div>
              </div>

              {/* EXPANDED BLUEPRINT DESIGNER */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f1f5f9', background: '#fcfcfc', display: 'flex', height: '550px' }} className="animate-in">
                  {/* LEFT: FIELD LIBRARY / ADD */}
                  <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8fafc' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>ADD TO BLUEPRINT</div>
                    
                    {!addingField ? (
                      <button 
                        onClick={() => setAddingField(true)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <i className="fas fa-plus"></i> NEW CUSTOM FIELD
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="animate-in">
                        <input 
                          type="text" className="form-control" placeholder="Field Label..." 
                          value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)}
                          autoFocus
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                          {FIELD_LIBRARY.map(t => (
                            <button key={t.id} onClick={() => setNewFieldType(t.id)} style={{
                              padding: '0.5rem 0.25rem', borderRadius: '8px', border: newFieldType === t.id ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                              background: newFieldType === t.id ? `${t.color}10` : '#fff', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 800
                            }}>
                              <i className={`fas ${t.icon}`} style={{ color: t.color, display: 'block', marginBottom: '2px' }}></i>
                              {t.name}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => addFieldToSection(s.id)} style={{ flex: 1, background: '#D4AF37', color: '#1e293b', border: 'none', borderRadius: '8px', fontWeight: 900, padding: '0.6rem', fontSize: '0.75rem' }}>SAVE</button>
                          <button onClick={() => setAddingField(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.6rem', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(212,175,55,0.05)', borderRadius: '12px', border: '1px dashed rgba(212,175,55,0.3)', fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.6 }}>
                      <i className="fas fa-shield-alt" style={{ color: '#D4AF37', marginRight: '0.4rem' }}></i>
                      <strong style={{ color: '#D4AF37' }}>Standard Foundation:</strong> Gallery, Blog, Teasers and Status toggles are automatically injected into all new section blueprints.
                    </div>
                  </div>

                  {/* CENTER: PREVIEW / CANVAS */}
                  <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', marginBottom: '1.5rem', letterSpacing: '1px' }}>ACTIVE BLUEPRINT DNA (CLICK TO INSPECT)</div>
                    
                    {(() => {
                      const standards = SIWA_DEFS.sectionStandards;
                      const missing = standards.filter(st => !fields.some((f: any) => f.name === st.name));
                      
                      if (missing.length > 0) {
                        return (
                          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff9e6', borderRadius: '16px', border: '1.5px solid #ffcc0040', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffcc0020', color: '#856404', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-exclamation-triangle"></i>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#856404' }}>FOUNDATION INCOMPLETE</div>
                                <div style={{ fontSize: '0.65rem', color: '#856404', opacity: 0.8 }}>Missing {missing.length} standard fields: {missing.map(m => m.label).join(', ')}</div>
                              </div>
                            </div>
                            <button 
                              className="btn btn-xs btn-primary"
                              onClick={async () => {
                                setIsAssigning(true);
                                try {
                                  await Promise.all(missing.map(f => 
                                    fetch('/api/jana/forms', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ 
                                        name: f.name, 
                                        label: f.label, 
                                        field_type: f.field_type, 
                                        business_type_id: 'SECTION_TEMPLATE', 
                                        section_id: s.id, 
                                        required: false, 
                                        vendor_editable: true,
                                        sort_order: 99
                                      })
                                    })
                                  ));
                                  notify('Foundation DNA Repaired ✓', 'success');
                                  loadSectionFields(s.id);
                                } finally {
                                  setIsAssigning(false);
                                }
                              }}
                            >
                              <i className="fas fa-magic" style={{ marginRight: '0.5rem' }}></i> REPAIR DNA
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '16px', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                            <i className="fas fa-check-circle"></i>
                          </div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534' }}>SECTION FOUNDATION IS HEALTHY & COMPLIANT</div>
                        </div>
                      );
                    })()}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {fields.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', border: '2px dashed #f1f5f9', borderRadius: '16px', color: '#cbd5e1' }}>
                          No custom fields in this blueprint yet.
                        </div>
                      )}
                      {fields.map((f: any) => {
                        const isStd = STANDARD_FIELD_NAMES.includes(f.name);
                        const lib = FIELD_LIBRARY.find(l => l.id === f.field_type);
                        const isInspecting = inspectingField?.id === f.id;

                        return (
                          <div 
                            key={f.id} 
                            onClick={() => setInspectingField(isInspecting ? null : f)}
                            style={{ 
                              padding: '1rem 1.25rem', 
                              background: isInspecting ? 'rgba(212,175,55,0.04)' : isStd ? 'rgba(212,175,55,0.015)' : '#fff',
                              border: isInspecting ? '2px solid #D4AF37' : isStd ? '1px solid rgba(212,175,55,0.2)' : '1px solid #f1f5f9',
                              borderRadius: '12px',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '40px', height: '40px', background: isStd ? 'rgba(212,175,55,0.1)' : '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className={`fas ${lib?.icon || 'fa-cube'}`} style={{ color: isStd ? '#D4AF37' : lib?.color || '#64748b' }}></i>
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{f.label}</div>
                                <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.field_type} {isStd ? '• STANDARD' : ''}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {isStd && <span style={{ fontSize: '0.55rem', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>FOUNDATION</span>}
                              <button onClick={(e) => { e.stopPropagation(); removeFieldFromSection(f.id, s.id); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', opacity: 0.5 }}><i className="fas fa-times"></i></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: INSPECTOR */}
                  {inspectingField && (
                    <div style={{ width: '340px', borderLeft: '1px solid #e2e8f0', padding: '1.5rem', background: '#fff', overflowY: 'auto' }} className="animate-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px' }}>PROPERTY INSPECTOR</div>
                        <button onClick={() => setInspectingField(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><i className="fas fa-times"></i></button>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6rem' }}>DISPLAY LABEL</label>
                        <input type="text" className="form-control" value={inspectingField.label || ''} onChange={e => setInspectingField({ ...inspectingField, label: e.target.value })} />
                      </div>

                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label" style={{ fontSize: '0.6rem' }}>DATABASE KEY (SLUG)</label>
                        <input type="text" className="form-control" value={inspectingField.name || ''} onChange={e => setInspectingField({ ...inspectingField, name: e.target.value })} style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#f8fafc' }} />
                      </div>

                      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="form-label" style={{ fontSize: '0.6rem' }}>GOVERNANCE FLAGS</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                          <input type="checkbox" checked={!!inspectingField.required} onChange={e => setInspectingField({ ...inspectingField, required: e.target.checked })} /> MANDATORY
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                          <input type="checkbox" checked={!!inspectingField.vendor_editable} onChange={e => setInspectingField({ ...inspectingField, vendor_editable: e.target.checked })} /> VENDOR EDITABLE
                        </label>
                      </div>

                      {inspectingField.field_type === 'component' && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0f4ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                          <label className="form-label" style={{ fontSize: '0.6rem', color: '#3b82f6' }}>LIBRARY COMPONENT BINDING</label>
                          <select 
                            className="form-control"
                            style={{ marginTop: '0.5rem' }}
                            value={inspectingField.options?.component_id || ''}
                            onChange={e => setInspectingField({ ...inspectingField, options: { ...inspectingField.options, component_id: e.target.value } })}
                          >
                            <option value="">-- Select Component --</option>
                            {libraryComponents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      )}

                      {['select', 'multiselect', 'checkbox_group'].includes(inspectingField.field_type) && (
                        <div style={{ marginTop: '1.5rem' }}>
                          <TagInput 
                            value={Array.isArray(inspectingField.options) ? inspectingField.options : []}
                            onChange={tags => setInspectingField({ ...inspectingField, options: tags })}
                          />
                        </div>
                      )}

                      <button 
                        onClick={() => updateFieldInSection(s.id)}
                        style={{ width: '100%', marginTop: '2rem', padding: '0.8rem', borderRadius: '12px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                      >
                        APPLY CHANGES
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- MODALS --- */}

      {/* METADATA EDITOR MODAL */}
      {showModal && editingSection && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="card animate-in" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>{isNew ? 'Create New Block' : 'Edit Block Metadata'}</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label required">Display Name</label>
                <input type="text" className="form-control" value={editingSection.name || ''} onChange={e => { setEditingSection({...editingSection, name: e.target.value}); generateId(e.target.value); }} />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Database ID (Slug)</label>
                <input type="text" className="form-control" value={editingSection.id || ''} readOnly={!isNew} onChange={e => setEditingSection({...editingSection, id: e.target.value})} style={{ background: '#f8fafc', fontFamily: 'monospace' }} />
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Visual Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', maxHeight: '100px', overflowY: 'auto' }}>
                  {SECTION_ICONS.map(icon => (
                    <div 
                      key={icon} 
                      onClick={() => setEditingSection({...editingSection, icon})}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: editingSection.icon === icon ? '2px solid #D4AF37' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: editingSection.icon === icon ? '#fff' : 'transparent' }}
                    >
                      <i className={`fas ${icon}`} style={{ color: editingSection.icon === icon ? '#D4AF37' : '#64748b' }}></i>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Governance Flags</label>
                <div className="grid-2">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.is_universal} onChange={e => setEditingSection({...editingSection, is_universal: e.target.checked})} /> UNIVERSAL
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.required} onChange={e => setEditingSection({...editingSection, required: e.target.checked})} /> MANDATORY
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Visibility Governance</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.show_on_public} onChange={e => setEditingSection({...editingSection, show_on_public: e.target.checked})} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0369a1' }}>Public Minisite Visibility</div>
                      <div style={{ fontSize: '0.65rem', color: '#0369a1', opacity: 0.8 }}>Allow this section to be rendered on the vendor's public website.</div>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.is_filterable} onChange={e => setEditingSection({...editingSection, is_filterable: e.target.checked})} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#9d174d' }}>Search Engine Discovery</div>
                      <div style={{ fontSize: '0.65rem', color: '#9d174d', opacity: 0.8 }}>Allow search engines to filter businesses by data in this section.</div>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!editingSection.show_on_card} onChange={e => setEditingSection({...editingSection, show_on_card: e.target.checked})} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#065f46' }}>Result Card Display</div>
                      <div style={{ fontSize: '0.65rem', color: '#065f46', opacity: 0.8 }}>Highlight key data from this section on search result listing cards.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="card-footer" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>CANCEL</button>
              <button className="btn btn-primary" onClick={saveSection}>SAVE ARCHITECTURE</button>
            </div>
          </div>
        </div>
      )}

      {/* LINKING MODAL */}
      {linkingSection && (
        <div className="modal-overlay" onClick={() => setLinkingSection(null)}>
          <div className="card animate-in" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3><i className="fas fa-link"></i> Link to Business Types</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setLinkingSection(null)}>✕</button>
            </div>
            <div style={{ padding: '2rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Select which business typologies should inherit this section blueprint.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {businessTypes.map(t => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedLinkTypes.includes(t.id)} 
                      onChange={e => {
                        if (e.target.checked) setSelectedLinkTypes([...selectedLinkTypes, t.id]);
                        else setSelectedLinkTypes(selectedLinkTypes.filter(id => id !== t.id));
                      }}
                    />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="card-footer">
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={async () => {
                  setIsAssigning(true);
                  try {
                    const updates = businessTypes.map(async (t) => {
                      const shouldBeLinked = selectedLinkTypes.includes(t.id);
                      const currentSections = Array.isArray((t as any).sections) ? (t as any).sections : [];
                      
                      let newSections;
                      if (shouldBeLinked && !currentSections.includes(linkingSection)) {
                        newSections = [...currentSections, linkingSection];
                      } else if (!shouldBeLinked && currentSections.includes(linkingSection)) {
                        newSections = currentSections.filter((id: string) => id !== linkingSection);
                      } else {
                        return; // No change needed
                      }

                      return fetch('/api/jana/types', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...t, sections: newSections })
                      });
                    });

                    await Promise.all(updates);
                    notify('Governance mapping updated successfully.', 'success');
                    loadSections(); // Refresh local state
                    setLinkingSection(null);
                  } catch (e) {
                    notify('Failed to update mapping.', 'error');
                  } finally {
                    setIsAssigning(false);
                  }
                }}
              >
                UPDATE MAPPING
              </button>
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

