'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import TagInput from '@/components/TagInput';

/* ─── Types ────────────────────────────────────────────────────────── */
interface BusinessType {
  id: string; name: string; icon: string; icon_color?: string;
  is_parent: boolean; parent_id?: string | null;
  sections: string[]; own_sections: string[];
}

interface Section {
  id: string; name: string; icon: string; description?: string;
  active: boolean; is_universal: boolean; sort_order: number;
  enable_gallery: boolean; enable_blog: boolean;
  vendor_editable: boolean; show_on_public: boolean;
}

interface Field {
  id: string; name: string; label: string; field_type: string;
  section_id: string; business_type_id: string;
  required: boolean; vendor_editable: boolean; show_on_public: boolean;
  version_type?: 'initial' | 'latest';
  options?: any; help_text?: string; sort_order: number;
}

const FIELD_TYPES = [
  { value: 'text',           label: 'Short Text',       icon: 'fa-font',        color: '#3b82f6' },
  { value: 'textarea',       label: 'Long Text',        icon: 'fa-align-left',  color: '#8b5cf6' },
  { value: 'rich_text',      label: 'Rich Text',        icon: 'fa-feather',     color: '#7c3aed' },
  { value: 'number',         label: 'Number',           icon: 'fa-hashtag',     color: '#10b981' },
  { value: 'select',         label: 'Dropdown',         icon: 'fa-list-ul',     color: '#f59e0b' },
  { value: 'multiselect',    label: 'Multi-Select',     icon: 'fa-tasks',       color: '#d946ef' },
  { value: 'checkbox_group', label: 'Checkboxes',       icon: 'fa-check-double',color: '#8b5cf6' },
  { value: 'boolean',        label: 'Toggle',           icon: 'fa-toggle-on',   color: '#10b981' },
  { value: 'gallery',        label: 'Gallery',          icon: 'fa-images',      color: '#ec4899' },
  { value: 'youtube',        label: 'YouTube',          icon: 'fa-video',       color: '#ef4444' },
  { value: 'star_rating',    label: 'Star Rating',      icon: 'fa-star',        color: '#fbbf24' },
  { value: 'action_button',  label: 'Call-to-Action',   icon: 'fa-bolt',        color: '#D4AF37' },
];

/* ─── Helpers ───────────────────────────────────────────────────────── */
const css = {
  tab: (active: boolean, color = '#D4AF37'): React.CSSProperties => ({
    padding: '0.65rem 1.4rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
    fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.5px', transition: 'all 0.2s',
    background: active ? color : 'transparent',
    color: active ? '#fff' : '#94a3b8',
    boxShadow: active ? `0 4px 12px ${color}40` : 'none',
  }),
  input: (): React.CSSProperties => ({
    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
    background: '#fff', color: '#1e293b',
  }),
  label: (): React.CSSProperties => ({
    fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8',
    letterSpacing: '1.5px', textTransform: 'uppercase' as const,
    marginBottom: '0.4rem', display: 'block',
  }),
  btn: (color: string, light = false): React.CSSProperties => ({
    padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontWeight: 900, fontSize: '0.75rem', transition: 'all 0.2s',
    background: light ? `${color}15` : color,
    color: light ? color : '#fff',
    boxShadow: light ? 'none' : `0 4px 12px ${color}40`,
  }),
};

const BLANK_SECTION = (): Partial<Section> => ({
  name: '', icon: 'fa-layer-group', description: '',
  active: true, is_universal: false, sort_order: 0,
  enable_gallery: true, enable_blog: true,
  vendor_editable: true, show_on_public: true,
});

const BLANK_FIELD = (sectionId: string, typeId?: string): Partial<Field> => ({
  section_id: sectionId, business_type_id: typeId || 'SECTION_TEMPLATE',
  label: '', name: `field_${Date.now()}`,
  field_type: 'text', sort_order: 99,
  required: false, vendor_editable: true, show_on_public: true,
  version_type: 'latest',
});

/* ─── Core Sections (essential for every vendor) ─────────────────────── */
const CORE_SECTIONS: Record<string, { color: string; label: string; emoji: string }> = {
  basic:        { color: '#10b981', label: 'Identity & Contact',       emoji: '🏷️' },
  vibe:         { color: '#8b5cf6', label: 'Vibe & Atmosphere',        emoji: '✨' },
  experience:   { color: '#f59e0b', label: 'Experiences & Activities',  emoji: '🎯' },
  location:     { color: '#3b82f6', label: 'Location & Map',           emoji: '📍' },
  gallery:      { color: '#ec4899', label: 'Gallery & Media',          emoji: '🖼️' },
  offers:       { color: '#ef4444', label: 'Offers & Packages',        emoji: '🎁' },
  testimonials: { color: '#06b6d4', label: 'Reviews & Testimonials',   emoji: '⭐' },
};

const isCoreSection = (id: string) => id in CORE_SECTIONS;

/* ─── Component ─────────────────────────────────────────────────────── */
export default function UnifiedSectionArchitect() {
  /* State */
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [sections,       setSections]      = useState<Section[]>([]);
  const [fields,         setFields]        = useState<Field[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [toast,          setToast]         = useState<{ msg: string; type: 'success'|'error' } | null>(null);

  /* Selection */
  const [selectedType,    setSelectedType]    = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [activeTab,       setActiveTab]       = useState<'meta'|'fields'|'assign'>('meta');

  /* Editing state */
  const [editSection, setEditSection]   = useState<Partial<Section>>(BLANK_SECTION());
  const [editField,   setEditField]     = useState<Partial<Field> | null>(null);
  const [saving,      setSaving]        = useState(false);
  const [versionSaveMode, setVersionSaveMode] = useState<'initial'|'latest'>('latest');
  const [deletingId,  setDeletingId]    = useState<string|null>(null);
  const [collapsedPanels, setCollapsedPanels] = useState({ left: false, center: false, right: false });

  /* Assigned sections for selected type */
  const [assignedSections, setAssignedSections] = useState<string[]>([]);

  /* ── Data Loading ──────────────────────────────────────────────────── */
  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/jana/types?t=' + Date.now()),
        fetch('/api/jana/sections?t=' + Date.now()),
      ]);
      const types = await tRes.json();
      const secs  = await sRes.json();
      setBusinessTypes(Array.isArray(types) ? types : []);
      setSections(Array.isArray(secs)  ? secs  : []);
    } catch { notify('Failed to load data', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadFields = useCallback(async (sectionId: string, typeId?: string) => {
    if (!sectionId) return;
    try {
      const url = typeId 
        ? `/api/jana/forms?type=${typeId}&t=${Date.now()}`
        : `/api/jana/forms?t=${Date.now()}`;
      const res = await fetch(url);
      const all = await res.json();
      setFields(Array.isArray(all) ? all.filter((f: any) => f.section_id === sectionId) : []);
    } catch { notify('Failed to load fields', 'error'); }
  }, []);

  /* Select a section → populate edit form + load fields */
  const selectSection = (sec: Section) => {
    setSelectedSection(sec.id);
    setEditSection({ ...sec });
    setEditField(null);
    // If selecting a section for the first time, open fields tab directly
    setActiveTab(prev => (prev === 'meta' && !selectedSection) ? 'fields' : prev);
    loadFields(sec.id, selectedType);
  };

  /* Select a business type → update assigned sections list */
  const selectType = (typeId: string) => {
    setSelectedType(typeId);
    const t = businessTypes.find(t => t.id === typeId);
    if (t) {
      const isParent = t.is_parent || Number(t.is_parent) === 1;
      setAssignedSections(isParent ? (t.sections || []) : (t.own_sections || []));
    }
    if (selectedSection) loadFields(selectedSection, typeId);
  };

  /* When tab changes to fields, reload */
  useEffect(() => {
    if (activeTab === 'fields' && selectedSection) {
      loadFields(selectedSection, selectedType);
    }
  }, [activeTab, selectedSection, selectedType, loadFields]);


  /* ── CRUD: Section ──────────────────────────────────────────────────── */
  const saveSection = async () => {
    if (!editSection.name?.trim()) { notify('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const method = editSection.id ? 'PUT' : 'POST';
      const body: any = { ...editSection };
      if (!editSection.id) {
        body.id = editSection.name!.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
      const res = await fetch('/api/jana/sections', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) {
        notify(editSection.id ? 'Section updated!' : 'Section created!');
        await loadAll();
        if (!editSection.id) setEditSection(BLANK_SECTION());
      } else {
        const e = await res.json().catch(() => ({}));
        notify(e.error || 'Save failed', 'error');
      }
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  const deleteSection = async (sectionId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/sections?id=${sectionId}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Section deleted!');
        setSelectedSection('');
        setEditSection(BLANK_SECTION());
        await loadAll();
      } else { notify('Delete failed', 'error'); }
    } catch { notify('Delete failed', 'error'); }
    setSaving(false);
    setDeletingId(null);
  };

  /* ── CRUD: Field ────────────────────────────────────────────────────── */
  const saveField = async () => {
    if (!editField) return;
    if (!editField.label?.trim()) { notify('Label is required', 'error'); return; }
    if (!editField.business_type_id) { notify('Business Type is required', 'error'); return; }
    setSaving(true);
    try {
      const method = editField.id ? 'PUT' : 'POST';
      const res = await fetch('/api/jana/forms', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editField),
      });

      if (res.ok) {
        notify(editField.id ? 'Field updated!' : 'Field created!');
        setEditField(null);
        loadFields(selectedSection, selectedType);
      } else { notify('Save failed', 'error'); }
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  const deleteField = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/forms?id=${id}`, { method: 'DELETE' });
      if (res.ok) { notify('Field deleted!'); loadFields(selectedSection, selectedType); }
      else { notify('Delete failed', 'error'); }
    } catch { notify('Delete failed', 'error'); }
    setSaving(false);
    setDeletingId(null);
  };

  /* ── CRUD: Assignments ──────────────────────────────────────────────── */
  const toggleAssign = (sectionId: string) => {
    setAssignedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const saveAssignments = async () => {
    if (!selectedType) { notify('Select a type first', 'error'); return; }
    setSaving(true);
    try {
      const typeRes = await fetch('/api/jana/types?id=' + selectedType + '&t=' + Date.now());
      const currentType = await typeRes.json();
      const isParent = currentType.is_parent || Number(currentType.is_parent) === 1;
      const body = {
        id: currentType.id, name: currentType.name, icon: currentType.icon,
        icon_color: currentType.icon_color, description: currentType.description,
        is_parent: currentType.is_parent, parent_id: currentType.parent_id, active: currentType.active !== false,
        sections:      isParent ? assignedSections         : (currentType.sections || []),
        own_sections:  isParent ? (currentType.own_sections || []) : assignedSections,
      };
      const res = await fetch('/api/jana/types', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { notify('Assignments saved!'); await loadAll(); }
      else { notify('Save failed', 'error'); }
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const currentSection = sections.find(s => s.id === selectedSection);
  const parents  = businessTypes.filter(t => (t.is_parent || Number(t.is_parent) === 1) && ['accommodation', 'food', 'adventure', 'wellness'].includes(t.id));
  const children = (parentId: string) => businessTypes.filter(t => t.parent_id === parentId);
  const mainGridColumns = `${collapsedPanels.left ? '0px' : '320px'} ${collapsedPanels.center ? '72px' : 'minmax(720px, 1fr)'} ${collapsedPanels.right ? '0px' : '360px'}`;
  const togglePanel = (panel: 'left' | 'center' | 'right') => {
    setCollapsedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '4px', fontSize: '1rem' }}>LOADING ARCHITECT…</div>
    </div>
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '2rem', zIndex: 9999,
          padding: '1rem 1.75rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.85rem',
          background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff',
          boxShadow: `0 10px 30px ${toast.type === 'success' ? '#10b98140' : '#ef444440'}`,
          animation: 'slideDown 0.3s ease',
        }}>
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} style={{ marginRight: '0.75rem' }} />
          {toast.msg}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Confirm Delete</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
              This will <strong>permanently delete</strong> the section and all its auto-generated fields. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setDeletingId(null)} style={css.btn('#e2e8f0', true)}>Cancel</button>
              <button
                onClick={() => deletingId.startsWith('field_') ? deleteField(deletingId.slice(6)) : deleteSection(deletingId)}
                style={css.btn('#ef4444')}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <header style={{
        background: '#0f172a', padding: '1.25rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #D4AF37, #f59e0b)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-layer-group" style={{ color: '#0f172a', fontSize: '1.1rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '3px' }}>UNIFIED</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Section Architect</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
            {sections.length} sections · {businessTypes.length} types
          </div>
          <a href="/jana" style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 800 }}>
            ← Back to Jana
          </a>
        </div>
      </header>

      {/* ── MAIN 3-PANEL LAYOUT ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: mainGridColumns, height: 'calc(100vh - 80px)', width: '100%', minWidth: '1500px', overflowX: 'auto' }}>

        {/* ── PANEL 1: Section List ──────────────────────────────────── */}
        <nav style={{
          background: '#fff', borderRight: collapsedPanels.left ? 'none' : '1px solid #f1f5f9',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
          minWidth: collapsedPanels.left ? '0px' : '320px',
          width: collapsedPanels.left ? '0px' : '320px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
        }}>
          {!collapsedPanels.left && (
            <>
              <div style={{ padding: '0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '300px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '1.5px' }}>SECTIONS</span>
                <button onClick={() => togglePanel('left')} style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-chevron-left" />
                </button>
              </div>

              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', minWidth: '300px' }}>
                <button
                  onClick={() => { setSelectedSection(''); setEditSection(BLANK_SECTION()); setEditField(null); setActiveTab('meta'); }}
                  style={{ ...css.btn('#D4AF37'), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <i className="fas fa-plus" /> New Section
                </button>
              </div>

              {/* Core Sections Legend */}
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', minWidth: '300px', background: '#f0fdf4' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#10b981', letterSpacing: '1.5px', marginBottom: '0.4rem' }}>🛡️ CORE SECTIONS (ESSENTIAL)</div>
                <div style={{ fontSize: '0.62rem', color: '#64748b', lineHeight: 1.5, fontWeight: 600 }}>
                  These 7 sections contain the essential fields every vendor must fill. They are color-coded for quick identification.
                </div>
              </div>

              <div style={{ padding: '0.75rem', flex: 1, overflowY: 'auto', minWidth: '300px' }}>
                {/* Render core sections first, then the rest */}
                {[...sections].sort((a, b) => {
                  const aCore = isCoreSection(a.id) ? 0 : 1;
                  const bCore = isCoreSection(b.id) ? 0 : 1;
                  if (aCore !== bCore) return aCore - bCore;
                  return 0;
                }).map((sec, idx, arr) => {
                  const isActive = sec.id === selectedSection;
                  const core = CORE_SECTIONS[sec.id];
                  const isCore = !!core;
                  const prevWasCore = idx > 0 && isCoreSection(arr[idx - 1].id);
                  const showDivider = !isCore && (idx === 0 || prevWasCore);

                  return (
                    <div key={sec.id}>
                      {showDivider && (
                        <div style={{ padding: '0.6rem 1rem', margin: '0.5rem 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                          <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>OTHER SECTIONS</span>
                          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                        </div>
                      )}
                      <button
                        onClick={() => selectSection(sec)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          borderStyle: 'solid',
                          borderTopWidth: '1.5px',
                          borderBottomWidth: '1.5px',
                          borderRightWidth: '1.5px',
                          borderLeftWidth: isCore ? '3px' : '1.5px',
                          borderTopColor: isActive ? (isCore ? core.color + '60' : '#D4AF3740') : 'transparent',
                          borderBottomColor: isActive ? (isCore ? core.color + '60' : '#D4AF3740') : 'transparent',
                          borderRightColor: isActive ? (isCore ? core.color + '60' : '#D4AF3740') : 'transparent',
                          borderLeftColor: isCore ? core.color : (isActive ? '#D4AF3740' : 'transparent'),
                          background: isActive ? (isCore ? core.color + '08' : '#fffbeb') : 'transparent',
                          cursor: 'pointer', marginBottom: '2px', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: '0.85rem',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                          background: isActive ? (isCore ? core.color : '#D4AF37') : (isCore ? core.color + '15' : '#f1f5f9'),
                          color: isActive ? '#fff' : (isCore ? core.color : '#94a3b8'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                        }}>
                          <i className={`fas ${sec.icon || 'fa-layer-group'}`} />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isActive ? '#1e293b' : '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sec.name}
                            </span>
                            {isCore && (
                              <span style={{
                                fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.5px',
                                background: core.color + '18', color: core.color,
                                padding: '1px 6px', borderRadius: '6px', border: `1px solid ${core.color}30`,
                                whiteSpace: 'nowrap', flexShrink: 0,
                              }}>CORE</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: '2px', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {isCore && <span style={{ color: core.color }}>{core.emoji} {core.label}</span>}
                            {!isCore && sec.enable_gallery && <span style={{ color: '#6366f1' }}>◆ Gallery</span>}
                            {!isCore && sec.enable_blog    && <span style={{ color: '#f59e0b' }}>◆ Blog</span>}
                            {!sec.active && <span style={{ color: '#ef4444' }}>● Inactive</span>}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* ── PANEL 2: Editor ────────────────────────────────────────── */}
        <main style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'auto', background: '#f8fafc', minWidth: collapsedPanels.center ? '72px' : '720px', width: collapsedPanels.center ? '72px' : 'auto' }}>
          <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '0 2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', minHeight: '60px' }}>
            {collapsedPanels.left && (
              <button onClick={() => togglePanel('left')} style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Show Sections Drawer">
                <i className="fas fa-bars" />
              </button>
            )}
            <button onClick={() => togglePanel('center')} style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fas fa-chevron-${collapsedPanels.center ? 'right' : 'left'}`} />
            </button>
            {!collapsedPanels.center && (
              <>
                {[
                  { key: 'meta',   label: 'Section Settings', icon: 'fa-sliders-h' },
                  { key: 'fields', label: 'Field Builder',    icon: 'fa-list-alt', disabled: !selectedSection },
                  { key: 'assign', label: 'Type Assignment',  icon: 'fa-sitemap',  disabled: !selectedSection },
                ].map(({ key, label, icon, disabled }) => (
                  <button
                    key={key}
                    onClick={() => !disabled && setActiveTab(key as any)}
                    disabled={!!disabled}
                    style={{
                      ...css.tab(activeTab === key),
                      opacity: disabled ? 0.35 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <i className={`fas ${icon}`} style={{ marginRight: '0.5rem' }} />
                    {label}
                  </button>
                ))}
                {currentSection && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 900, color: currentSection.active ? '#10b981' : '#94a3b8',
                      background: currentSection.active ? '#dcfce7' : '#f1f5f9',
                      padding: '4px 10px', borderRadius: '8px',
                    }}>
                      {currentSection.active ? '● ACTIVE' : '○ INACTIVE'}
                    </span>
                    {['vibe', 'experience', 'investment-opportunity', 'invest', 'auction', 'offers-promotions', 'package', 'discount', 'offers-packages', 'discounts-promotions', 'sponsorship', 'business_info'].includes(selectedSection) ? (
                      <button
                        disabled
                        title="This section is used by the main website's features (e.g. investment, packages, auctions) and cannot be deleted."
                        style={{
                          ...css.btn('#94a3b8', true),
                          padding: '0.6rem 1rem',
                          fontSize: '0.7rem',
                          cursor: 'not-allowed',
                          background: '#f1f5f9',
                          borderColor: '#cbd5e1',
                          color: '#94a3b8',
                        }}
                      >
                        <i className="fas fa-lock" style={{ marginRight: '0.4rem' }} /> System Locked
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeletingId(selectedSection)}
                        style={{ ...css.btn('#ef4444', true), padding: '0.6rem 1rem', fontSize: '0.7rem' }}
                      >
                        <i className="fas fa-trash" style={{ marginRight: '0.4rem' }} /> Delete
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {collapsedPanels.right && !collapsedPanels.center && (
              <button onClick={() => togglePanel('right')} style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', flexShrink: 0 }} title="Show Stats &amp; Info Drawer">
                <i className="fas fa-info-circle" />
              </button>
            )}
          </div>

          {collapsedPanels.center ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 800, fontSize: '0.8rem', padding: '2rem' }}>
              Editor collapsed. Click the arrow to expand.
            </div>
          ) : (
            <>
          {/* ── TAB: META ─────────────────────────────────────────── */}
          {activeTab === 'meta' && (
            <div style={{ padding: '2.5rem', maxWidth: '960px', width: '100%' }}>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>
                {selectedSection ? 'Edit Section' : 'Create New Section'}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '2.5rem' }}>
                {selectedSection ? `Editing "${currentSection?.name}"` : 'Define a new section with feature flags and visibility rules.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={css.label()}>Section Name *</label>
                  <input style={css.input()} value={editSection.name || ''} onChange={e => setEditSection(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Amenities, Location, Pricing" />
                </div>

                {/* Icon */}
                <div>
                  <label style={css.label()}>Icon (Font Awesome class)</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input style={{ ...css.input(), flex: 1 }} value={editSection.icon || ''} onChange={e => setEditSection(s => ({ ...s, icon: e.target.value }))} placeholder="fa-star" />
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', fontSize: '1.1rem', color: '#D4AF37', flexShrink: 0 }}>
                      <i className={`fas ${editSection.icon || 'fa-layer-group'}`} />
                    </div>
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label style={css.label()}>Sort Order</label>
                  <input style={css.input()} type="number" value={editSection.sort_order ?? 0} onChange={e => setEditSection(s => ({ ...s, sort_order: +e.target.value }))} />
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={css.label()}>Description (optional)</label>
                  <textarea
                    style={{ ...css.input(), minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                    value={editSection.description || ''}
                    onChange={e => setEditSection(s => ({ ...s, description: e.target.value }))}
                    placeholder="Brief description of this section's purpose…"
                  />
                </div>
              </div>

              {/* Feature Flags */}
              <div style={{ background: '#fff', borderRadius: '20px', border: '1.5px solid #e2e8f0', overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fas fa-toggle-on" style={{ color: '#D4AF37' }} />
                  <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#1e293b' }}>Feature Flags</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>Control what vendors can access per section</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {[
                    { key: 'active',         label: 'Section Active',      sub: 'Visible to vendors and public', icon: 'fa-eye',          color: '#10b981' },
                    { key: 'is_universal',   label: 'Universal Section',   sub: 'Inherited by all types',        icon: 'fa-globe',        color: '#3b82f6' },
                    { key: 'enable_gallery', label: 'Gallery Enabled',     sub: 'Show Gallery tab to vendors',   icon: 'fa-images',       color: '#6366f1' },
                    { key: 'enable_blog',    label: 'Blog / Story Enabled', sub: 'Show Blog tab to vendors',     icon: 'fa-feather-alt',  color: '#f59e0b' },
                    { key: 'vendor_editable',label: 'Vendor Editable',     sub: 'Vendors can edit fields',       icon: 'fa-user-edit',    color: '#8b5cf6' },
                    { key: 'show_on_public', label: 'Public Visibility',   sub: 'Shown on public listing page',  icon: 'fa-globe-europe', color: '#ec4899' },
                  ].map(({ key, label, sub, icon, color }) => {
                    const val = !!(editSection as any)[key];
                    return (
                      <label
                        key={key}
                        style={{
                          padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                          borderBottom: '1px solid #f8fafc', borderRight: '1px solid #f8fafc',
                          background: val ? `${color}06` : '#fff', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{ width: 42, height: 42, borderRadius: '12px', background: val ? `${color}15` : '#f8fafc', color: val ? color : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, transition: 'all 0.2s' }}>
                          <i className={`fas ${icon}`} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>{label}</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{sub}</div>
                        </div>
                        <div
                          onClick={() => setEditSection(s => ({ ...s, [key]: !val }))}
                          style={{
                            width: 48, height: 26, borderRadius: '13px', background: val ? color : '#e2e8f0',
                            position: 'relative', transition: 'background 0.3s', cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 3, left: val ? 25 : 3, transition: 'left 0.3s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }} />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button onClick={saveSection} disabled={saving} style={{ ...css.btn('#1e293b'), minWidth: '200px' }}>
                {saving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} />Saving…</> : <><i className="fas fa-save" style={{ marginRight: '0.5rem' }} />{selectedSection ? 'Update Section' : 'Create Section'}</>}
              </button>
            </div>
          )}

          {/* ── TAB: FIELDS ───────────────────────────────────────── */}
          {activeTab === 'fields' && (
            <div style={{ padding: '2rem 1.5rem 2.5rem', maxWidth: '1200px', width: '100%' }}>
              {/* Type Selector for Fields */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>Field Builder</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Fields for <strong>{currentSection?.name}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    value={selectedType}
                    onChange={e => selectType(e.target.value)}
                    style={{ ...css.input(), width: 'auto', padding: '0.6rem 1rem' }}
                  >
                    <option value="">— All Business Types —</option>
                    {businessTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditField(BLANK_FIELD(selectedSection, selectedType))}
                    style={css.btn('#10b981')}
                  >
                    <i className="fas fa-plus" style={{ marginRight: '0.5rem' }} /> Add Field
                  </button>
                </div>
              </div>

              {fields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                  <i className="fas fa-folder-open fa-3x" style={{ color: '#e2e8f0', marginBottom: '1rem', display: 'block' }} />
                  <p style={{ color: '#94a3b8', fontWeight: 700 }}>No fields yet. Click "Add Field" to start.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {[...fields]
                    .filter(f => !selectedType || f.business_type_id === selectedType || f.business_type_id === 'SECTION_TEMPLATE')
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(f => {
                      const ti = FIELD_TYPES.find(t => t.value === f.field_type);
                      const isTemplate = f.business_type_id === 'SECTION_TEMPLATE';
                      const bt = businessTypes.find(t => t.id === f.business_type_id);
                      const typeLabel = bt ? bt.name : (isTemplate ? 'Universal Template' : f.business_type_id);

                      return (
                        <div key={f.id} style={{
                          background: '#fff', borderRadius: '18px', padding: '1.25rem 1.5rem',
                          border: isTemplate ? '1.5px solid #D4AF3740' : '1px solid #f1f5f9',
                          display: 'flex', alignItems: 'flex-start', gap: '1.25rem',
                          flexWrap: 'wrap', justifyContent: 'space-between',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        }}>
                          <div style={{ width: 46, height: 46, borderRadius: '14px', background: `${ti?.color || '#eee'}12`, color: ti?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                            <i className={`fas ${ti?.icon || 'fa-cube'}`} />
                          </div>
                          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1e293b' }}>{f.label}</span>
                              <span style={{ fontSize: '0.55rem', padding: '3px 8px', background: isTemplate ? '#fef3c7' : '#e0f2fe', color: isTemplate ? '#b45309' : '#0369a1', borderRadius: '6px', fontWeight: 900 }}>
                                {typeLabel.toUpperCase()}
                              </span>
                              {f.required && <span style={{ fontSize: '0.55rem', padding: '3px 8px', background: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontWeight: 900 }}>REQUIRED</span>}
                              {!f.vendor_editable && <span style={{ fontSize: '0.55rem', padding: '3px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontWeight: 900 }}>ADMIN ONLY</span>}
                            {f.version_type && <span style={{ fontSize: '0.55rem', padding: '3px 8px', background: f.version_type === 'initial' ? '#eef2ff' : '#ecfdf5', color: f.version_type === 'initial' ? '#3730a3' : '#166534', borderRadius: '6px', fontWeight: 900 }}>{f.version_type.toUpperCase()}</span>}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', fontWeight: 700 }}>
                              <code style={{ background: '#f8fafc', padding: '1px 6px', borderRadius: '4px' }}>{f.name}</code>
                              {' · '}{ti?.label}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%', marginTop: '0.5rem' }}>
                            <button onClick={() => setEditField(f)} style={{ minWidth: '88px', height: '40px', padding: '0 0.8rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 800 }}>
                              <i className="fas fa-cog" style={{ fontSize: '0.8rem' }} /> Edit
                            </button>
                            <button onClick={() => setDeletingId('field_' + f.id)} style={{ minWidth: '92px', height: '40px', padding: '0 0.8rem', borderRadius: '10px', background: '#fff0f0', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 800 }}>
                              <i className="fas fa-trash" style={{ fontSize: '0.8rem' }} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Field Editor Modal (inline) */}
              {editField && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <div style={{ background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '2px' }}>FIELD EDITOR</div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{editField.id ? 'Edit Field' : 'New Field'}</h3>
                      </div>
                      <button onClick={() => setEditField(null)} style={{ width: 36, height: 36, borderRadius: '10px', background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <i className="fas fa-times" />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label style={css.label()}>Label (displayed to vendor) *</label>
                        <input style={css.input()} value={editField.label || ''} onChange={e => setEditField(f => ({ ...f!, label: e.target.value }))} placeholder="e.g. Number of Rooms" />
                      </div>
                      <div>
                        <label style={css.label()}>Business Type (Belongs To) *</label>
                        <select
                          value={editField.business_type_id || ''}
                          onChange={e => setEditField(f => ({ ...f!, business_type_id: e.target.value }))}
                          style={css.input()}
                        >
                          <option value="SECTION_TEMPLATE">Universal Template</option>
                          {businessTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={css.label()}>Database Key (snake_case)</label>
                        <input style={{ ...css.input(), opacity: editField.id ? 0.5 : 1 }} value={editField.name || ''} onChange={e => setEditField(f => ({ ...f!, name: e.target.value }))} disabled={!!editField.id} placeholder="e.g. num_rooms" />
                      </div>

                      <div>
                        <label style={css.label()}>Save Version</label>
                        <select
                          value={editField.version_type || 'latest'}
                          onChange={e => setEditField(f => ({ ...f!, version_type: e.target.value as 'initial' | 'latest' }))}
                          style={css.input()}
                        >
                          <option value="latest">Latest Update</option>
                          <option value="initial">Initial Default</option>
                        </select>
                      </div>

                      <div>
                        <label style={css.label()}>Field Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                          {FIELD_TYPES.map(t => (
                            <button
                              key={t.value}
                              onClick={() => setEditField(f => ({ ...f!, field_type: t.value }))}
                              style={{
                                padding: '0.75rem 0.25rem', borderRadius: '10px', border: editField.field_type === t.value ? `2px solid ${t.color}` : '1.5px solid #f1f5f9',
                                background: editField.field_type === t.value ? `${t.color}12` : '#fff',
                                fontSize: '0.58rem', fontWeight: 900, cursor: 'pointer', textAlign: 'center', color: '#1e293b',
                              }}
                            >
                              <i className={`fas ${t.icon}`} style={{ display: 'block', color: t.color, fontSize: '1rem', marginBottom: '0.3rem' }} />
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {['select', 'multiselect', 'checkbox_group'].includes(editField.field_type || '') && (
                        <div>
                          <label style={css.label()}>Options</label>
                          <TagInput
                            value={Array.isArray(editField.options) ? editField.options : []}
                            onChange={options => setEditField(f => ({ ...f!, options }))}
                            placeholder="Add an option and press Enter"
                            label="Options"
                          />
                        </div>
                      )}

                      <div>
                        <label style={css.label()}>Help Text (optional)</label>
                        <input style={css.input()} value={editField.help_text || ''} onChange={e => setEditField(f => ({ ...f!, help_text: e.target.value }))} placeholder="Guidance shown below the field" />
                      </div>

                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {[
                          { key: 'required',        label: 'Required' },
                          { key: 'vendor_editable', label: 'Vendor Editable' },
                          { key: 'show_on_public',  label: 'Public Visibility' },
                        ].map(({ key, label }) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                            <input
                              type="checkbox"
                              checked={!!(editField as any)[key]}
                              onChange={e => setEditField(f => ({ ...f!, [key]: e.target.checked }))}
                            />
                            {label}
                          </label>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                        <button onClick={() => setEditField(null)} style={{ ...css.btn('#e2e8f0', true), flex: 1, color: '#64748b' }}>Cancel</button>
                        <button onClick={saveField} disabled={saving} style={{ ...css.btn('#1e293b'), flex: 1 }}>
                          {saving ? 'Saving…' : editField.id ? 'Update Field' : 'Create Field'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ASSIGN ───────────────────────────────────────── */}
          {activeTab === 'assign' && (
            <div style={{ padding: '2.5rem', maxWidth: '760px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>Type Assignment</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Assign <strong>{currentSection?.name}</strong> to business types, or toggle which types use it.</p>
                </div>
              </div>

              {/* Type picker */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={css.label()}>Select Business Type to Manage Its Sections</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {parents.map(parent => (
                    <div key={parent.id}>
                      <button
                        onClick={() => selectType(parent.id)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '0.9rem 1.25rem', borderRadius: '12px',
                          border: selectedType === parent.id ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                          background: selectedType === parent.id ? '#fffbeb' : '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#1e293b',
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                        }}
                      >
                        <i className={`fas ${parent.icon}`} style={{ color: parent.icon_color || '#D4AF37' }} />
                        {parent.name}
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginLeft: 'auto' }}>Category</span>
                      </button>
                      {children(parent.id).map(child => (
                        <button
                          key={child.id}
                          onClick={() => selectType(child.id)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '0.75rem 1.25rem 0.75rem 2.5rem', borderRadius: '10px',
                            border: selectedType === child.id ? '2px solid #D4AF37' : '1px solid transparent',
                            background: selectedType === child.id ? '#fffbeb' : 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: '#475569',
                            display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2px',
                          }}
                        >
                          <i className={`fas ${child.icon}`} style={{ color: child.icon_color || '#6366f1', fontSize: '0.8rem' }} />
                          {child.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {selectedType && (
                <>
                  <div style={{ background: '#fff', borderRadius: '20px', border: '1.5px solid #e2e8f0', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>
                      SECTIONS ASSIGNED TO {businessTypes.find(t => t.id === selectedType)?.name?.toUpperCase()}
                    </div>
                    {sections.map(sec => {
                      const checked = assignedSections.includes(sec.id);
                      return (
                        <div
                          key={sec.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem',
                            borderBottom: '1px solid #f8fafc',
                            background: checked ? '#fffbeb' : '#fff', transition: 'background 0.2s',
                          }}
                        >
                          <input type="checkbox" checked={checked} onChange={() => toggleAssign(sec.id)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#D4AF37', flexShrink: 0 }} />
                          <div style={{ width: 36, height: 36, borderRadius: '10px', background: checked ? '#D4AF3715' : '#f8fafc', color: checked ? '#D4AF37' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                            <i className={`fas ${sec.icon || 'fa-layer-group'}`} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{sec.name}</div>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: '2px', display: 'flex', gap: '0.5rem' }}>
                              {sec.enable_gallery && <span style={{ color: '#6366f1' }}>Gallery</span>}
                              {sec.enable_blog    && <span style={{ color: '#f59e0b' }}>Blog</span>}
                              {sec.is_universal   && <span style={{ color: '#3b82f6' }}>Universal</span>}
                            </div>
                          </div>
                          {/* Edit section button — jumps to meta tab with this section loaded */}
                          <button
                            type="button"
                            title="Edit this section"
                            onClick={() => { selectSection(sec); setActiveTab('meta'); }}
                            style={{
                              flexShrink: 0, width: 32, height: 32, borderRadius: '8px',
                              background: '#f1f5f9', border: '1px solid #e2e8f0',
                              color: '#6366f1', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f115'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; }}
                          >
                            <i className="fas fa-pen" />
                          </button>
                          {checked && <i className="fas fa-check-circle" style={{ color: '#D4AF37', fontSize: '1.1rem', flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={saveAssignments} disabled={saving} style={{ ...css.btn('#10b981'), width: '100%' }}>
                    {saving ? 'Saving…' : <><i className="fas fa-save" style={{ marginRight: '0.5rem' }} />Save Assignments</>}
                  </button>
                </>
              )}

              {!selectedType && (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                  <i className="fas fa-sitemap fa-2x" style={{ color: '#e2e8f0', marginBottom: '1rem', display: 'block' }} />
                  <p style={{ color: '#94a3b8', fontWeight: 700 }}>Select a business type above to manage assignments.</p>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </main>

        {/* ── PANEL 3: Quick Stats / Help ─────────────────────────── */}
        <aside style={{
          background: '#fff', borderLeft: collapsedPanels.right ? 'none' : '1px solid #f1f5f9',
          overflowY: 'auto', overflowX: 'hidden',
          padding: collapsedPanels.right ? '0' : '2rem 1.75rem',
          minWidth: collapsedPanels.right ? '0px' : '360px',
          width: collapsedPanels.right ? '0px' : '360px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {!collapsedPanels.right && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', minWidth: '320px' }}>
                <button onClick={() => togglePanel('right')} style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '1.5rem' }}>SYSTEM OVERVIEW</div>

              {/* Stats */}
              {[
            { label: 'Total Sections',      value: sections.length,                                  color: '#D4AF37', icon: 'fa-layer-group' },
            { label: 'Gallery Enabled',     value: sections.filter(s => s.enable_gallery).length,    color: '#6366f1', icon: 'fa-images' },
            { label: 'Blog Enabled',        value: sections.filter(s => s.enable_blog).length,       color: '#f59e0b', icon: 'fa-feather-alt' },
            { label: 'Active Sections',     value: sections.filter(s => s.active).length,            color: '#10b981', icon: 'fa-eye' },
            { label: 'Business Types',      value: businessTypes.length,                             color: '#3b82f6', icon: 'fa-briefcase' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem',
                  background: `${color}08`, borderRadius: '14px', marginBottom: '0.5rem',
                  border: `1px solid ${color}20`,
                }}>
                  <i className={`fas ${icon}`} style={{ color, fontSize: '0.9rem', width: 20, textAlign: 'center' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{label}</div>
                  </div>
                  <div style={{ fontWeight: 900, color, fontSize: '1.1rem' }}>{value}</div>
                </div>
              ))}

              {/* Current section info */}
              {currentSection && (
                <>
                  <div style={{ height: 1, background: '#f1f5f9', margin: '1.5rem 0' }} />
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1rem' }}>SELECTED SECTION</div>
                  <div style={{ background: '#fafafa', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#D4AF3715', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        <i className={`fas ${currentSection.icon || 'fa-layer-group'}`} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#1e293b' }}>{currentSection.name}</div>
                        <code style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{currentSection.id}</code>
                      </div>
                    </div>

                    {[
                      { label: 'Active',       val: currentSection.active,         color: '#10b981' },
                      { label: 'Gallery',      val: currentSection.enable_gallery, color: '#6366f1' },
                      { label: 'Blog',         val: currentSection.enable_blog,    color: '#f59e0b' },
                      { label: 'Universal',    val: currentSection.is_universal,   color: '#3b82f6' },
                      { label: 'Vend. Edit',   val: currentSection.vendor_editable,color: '#8b5cf6' },
                      { label: 'Public',       val: currentSection.show_on_public, color: '#ec4899' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid #f8fafc' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>{label}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: val ? color : '#cbd5e1' }}>
                          {val ? '✓ ON' : '✕ OFF'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Help tips */}
              <div style={{ height: 1, background: '#f1f5f9', margin: '1.5rem 0' }} />
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1rem' }}>QUICK GUIDE</div>
              {[
                { icon: 'fa-layer-group', tip: 'Select a section on the left to edit it, or click "New Section" to create one.' },
                { icon: 'fa-images',      tip: '"Gallery Enabled" shows the Gallery tab to vendors for this section.' },
                { icon: 'fa-feather-alt', tip: '"Blog Enabled" shows the Blog/Story tab to vendors for this section.' },
                { icon: 'fa-list-alt',    tip: 'The Field Builder tab lets you add form fields specific to a business type.' },
                { icon: 'fa-sitemap',     tip: 'Use Type Assignment to decide which types get this section.' },
              ].map(({ icon, tip }, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', alignItems: 'flex-start' }}>
                  <i className={`fas ${icon}`} style={{ color: '#D4AF37', marginTop: '2px', fontSize: '0.8rem', width: 16, textAlign: 'center', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        input:focus, textarea:focus, select:focus { border-color: #D4AF37 !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.12); }
      `}</style>
    </div>
  );
}
