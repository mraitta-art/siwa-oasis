'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import TagInput from '@/components/TagInput';
import { CANONICAL_SECTIONS } from '@/lib/section-registry';

/* ─── Types ────────────────────────────────────────────────────────── */
interface BusinessType {
  id: string; name: string; icon: string; icon_color?: string;
  is_parent: boolean; parent_id?: string | null;
  sections: string[]; own_sections: string[];
  active?: boolean | number | string | null;
}

interface Section {
  id: string; name: string; icon: string; description?: string;
  active: boolean; is_universal: boolean; sort_order: number;
  enable_gallery: boolean; enable_blog: boolean;
  vendor_editable: boolean; show_on_public: boolean; show_on_minisite: boolean;
  is_filterable?: boolean; show_on_card?: boolean;
  propagation_hero?: boolean; propagation_blog?: boolean; propagation_card?: boolean;
  curation_policy?: 'auto_approve' | 'manual_review' | 'admin_only';
  required?: boolean; required_tier?: string | null;
  inheritance_rules?: any;
}

const DEFAULT_CONTENT_POLICY = {
  vendor_can_upload_images: true,
  vendor_can_add_captions: true,
  vendor_can_write_blog: true,
  vendor_can_submit_carousel: false,
  vendor_can_request_main_carousel: false,
  requires_approval: true,
};

interface Field {
  id: string; name: string; label: string; field_type: string;
  section_id: string; business_type_id: string;
  required: boolean; vendor_editable: boolean; show_on_public: boolean;
  version_type?: 'initial' | 'latest';
  options?: any; help_text?: string; sort_order: number;
  required_feature?: string;
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
  toggle: (active: boolean, color: string): React.CSSProperties => ({
    width: 48, height: 26, borderRadius: '13px',
    background: active ? color : '#e2e8f0',
    position: 'relative', transition: 'background 0.3s',
    cursor: 'pointer', flexShrink: 0,
  }),
};

const BLANK_SECTION = (): Partial<Section> => ({
  name: '', icon: 'fa-layer-group', description: '',
  active: true, is_universal: false, sort_order: 0,
  enable_gallery: true, enable_blog: true,
  vendor_editable: true, show_on_public: true, show_on_minisite: true,
  is_filterable: false, show_on_card: false,
  propagation_hero: false, propagation_blog: false, propagation_card: false,
  curation_policy: 'manual_review',
  required: false, required_tier: null,
  inheritance_rules: { content_policy: DEFAULT_CONTENT_POLICY },
});

function getContentPolicy(section: Partial<Section>) {
  const rules = typeof section.inheritance_rules === 'string'
    ? (() => { try { return JSON.parse(section.inheritance_rules as string); } catch { return {}; } })()
    : section.inheritance_rules || {};
  return { ...DEFAULT_CONTENT_POLICY, ...(rules.content_policy || {}) };
}

const BLANK_FIELD = (sectionId: string, typeId?: string): Partial<Field> => ({
  section_id: sectionId, business_type_id: typeId || 'SECTION_TEMPLATE',
  label: '', name: `field_${Date.now()}`,
  field_type: 'text', sort_order: 99,
  required: false, vendor_editable: true, show_on_public: true,
  version_type: 'latest',
});

const isCoreSection = (id: string) => CANONICAL_SECTIONS.some(s => s.id === id);

/* ─── ToggleRow Helper ──────────────────────────────────────────────── */
function ToggleRow({
  value, onChange, label, sub, icon, color,
}: { value: boolean; onChange: (v: boolean) => void; label: string; sub: string; icon: string; color: string }) {
  return (
    <label style={{
      padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
      borderBottom: '1px solid #f8fafc', borderRight: '1px solid #f8fafc',
      background: value ? `${color}06` : '#fff', transition: 'background 0.2s',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: '10px', background: value ? `${color}15` : '#f8fafc', color: value ? color : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>
        <i className={`fas ${icon}`} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#1e293b' }}>{label}</div>
        <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>{sub}</div>
      </div>
      <div onClick={() => onChange(!value)} style={css.toggle(value, color)}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 25 : 3, transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </label>
  );
}

/* ─── Component ─────────────────────────────────────────────────────── */
export default function UnifiedSectionArchitect() {

  /* ── Core Data State ────────────────────────────────────────────────── */
  const [businessTypes,  setBusinessTypes]  = useState<BusinessType[]>([]);
  const [sections,       setSections]       = useState<Section[]>([]);
  const [fields,         setFields]         = useState<Field[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState<{ msg: string; type: 'success'|'error' } | null>(null);

  /* ── Business/Typology Context ──────────────────────────────────────── */
  const [selectedCategory, setSelectedCategory] = useState<string>('');   // parent type id
  const [selectedType,     setSelectedType]     = useState<string>('');   // child type id (typology)
  const [assignedSections, setAssignedSections] = useState<string[]>([]);

  /* ── Section List / Sidebar ─────────────────────────────────────────── */
  const [sidebarMode,    setSidebarMode]   = useState<'sections' | 'new'>('sections');
  const [sectionSearch,  setSectionSearch] = useState('');
  const [sectionFilter,  setSectionFilter] = useState<'all'|'active'|'inactive'|'protected'|'universal'>('all');
  const [libSearch,      setLibSearch]     = useState('');    // library (right) panel search
  const [leftPanelWidth, setLeftPanelWidth] = useState(560);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  /* ── Editor State ───────────────────────────────────────────────────── */
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [activeTab,       setActiveTab]       = useState<'meta'|'fields'|'assign'|'topology'>('meta');
  const [editSection,     setEditSection]     = useState<Partial<Section>>(BLANK_SECTION());
  const [editField,       setEditField]       = useState<Partial<Field> | null>(null);
  const [saving,          setSaving]          = useState(false);
  const [deletingId,      setDeletingId]      = useState<string|null>(null);

  /* ── Topology Map ───────────────────────────────────────────────────── */
  const [topologyMap, setTopologyMap] = useState<{ id: string; name: string; icon: string; icon_color?: string; is_parent: boolean }[]>([]);

  /* ── Notifications ──────────────────────────────────────────────────── */
  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load All ───────────────────────────────────────────────────────── */
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
      if (Array.isArray(types)) {
        setExpandedParents(prev => Object.keys(prev).length > 0 ? prev :
          Object.fromEntries(types.filter((t: BusinessType) => t.is_parent || Number(t.is_parent) === 1).map((t: BusinessType) => [t.id, true]))
        );
      }
      setSections(Array.isArray(secs) ? secs : []);
    } catch { notify('Failed to load data', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Load Fields ─────────────────────────────────────────────────────── */
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

  useEffect(() => {
    if (activeTab === 'fields' && selectedSection) {
      loadFields(selectedSection, selectedType);
    }
  }, [activeTab, selectedSection, selectedType, loadFields]);

  /* ── Build Topology Map for selected section ──────────────────────────── */
  const buildTopologyMap = useCallback((sectionId: string, allTypes: BusinessType[]) => {
    if (!sectionId) { setTopologyMap([]); return; }
    const using = allTypes.filter(t => {
      const s = t.sections || [];
      const o = t.own_sections || [];
      return s.includes(sectionId) || o.includes(sectionId);
    });
    setTopologyMap(using.map(t => ({ id: t.id, name: t.name, icon: t.icon, icon_color: t.icon_color, is_parent: !!(t.is_parent || Number(t.is_parent) === 1) })));
  }, []);

  /* ── Select Typology ─────────────────────────────────────────────────── */
  const selectType = (typeId: string) => {
    setSelectedType(typeId);
    const t = businessTypes.find(t => t.id === typeId);
    if (t) {
      const isParent = t.is_parent || Number(t.is_parent) === 1;
      setAssignedSections(isParent ? (t.sections || []) : (t.own_sections || []));
    }
    if (selectedSection) loadFields(selectedSection, typeId);
  };

  /* ── Select Section ──────────────────────────────────────────────────── */
  const selectSection = (sec: Section) => {
    setSelectedSection(sec.id);
    setEditSection({ ...sec });
    setEditField(null);
    loadFields(sec.id, selectedType);
    buildTopologyMap(sec.id, businessTypes);
    if (activeTab === 'topology') setActiveTab('meta');
  };

  /* ── Derived Data ────────────────────────────────────────────────────── */
  const currentSection   = sections.find(s => s.id === selectedSection);
  const parents          = businessTypes.filter(t => (t.is_parent || Number(t.is_parent) === 1) && t.id !== 'SECTION_TEMPLATE' && t.active !== false && Number(t.active) !== 0).sort((a, b) => a.name.localeCompare(b.name));
  const children         = (parentId: string) => businessTypes.filter(t => !t.is_parent && Number(t.is_parent) !== 1 && t.parent_id === parentId && t.active !== false && Number(t.active) !== 0).sort((a, b) => a.name.localeCompare(b.name));
  const selectableTypes  = businessTypes.filter(t => !t.is_parent && Number(t.is_parent) !== 1 && t.parent_id && t.id !== 'SECTION_TEMPLATE' && t.active !== false && Number(t.active) !== 0).sort((a, b) => a.name.localeCompare(b.name));

  const currentType    = businessTypes.find(t => t.id === selectedType);
  const currentParent  = currentType?.parent_id ? businessTypes.find(t => t.id === currentType.parent_id) : (currentType?.is_parent ? currentType : null);
  const categoryChildren = selectedCategory ? children(selectedCategory) : [];

  /* sections in the assigned column (left split) */
  const inheritedIds: string[] = (() => {
    if (!selectedType) return [];
    const t = businessTypes.find(t => t.id === selectedType);
    if (!t) return [];
    const uniIds = sections.filter(s => s.is_universal).map(s => s.id);
    const parentIds: string[] = [];
    if (t.parent_id) {
      const parent = businessTypes.find(p => p.id === t.parent_id);
      if (parent) parentIds.push(...(parent.sections || []));
    }
    return [...new Set([...uniIds, ...parentIds])];
  })();
  const ownIds: string[]       = selectedType ? assignedSections.filter(id => !inheritedIds.includes(id)) : [];
  const allAssignedIds: string[] = [...new Set([...inheritedIds, ...ownIds])];

  /* sections for library (right split / global list) */
  const libSections = sections.filter(s => {
    const q = libSearch.trim().toLowerCase();
    const matchesSearch = !q || `${s.name} ${s.id} ${s.description || ''}`.toLowerCase().includes(q);
    return matchesSearch;
  });

  /* global sections list (when no type selected) */
  const visibleSections = sections.filter(sec => {
    const q = sectionSearch.trim().toLowerCase();
    const matchesSearch = !q || `${sec.name} ${sec.id} ${sec.description || ''}`.toLowerCase().includes(q);
    const matchesFilter =
      sectionFilter === 'all'       ? true :
      sectionFilter === 'active'    ? sec.active !== false :
      sectionFilter === 'inactive'  ? sec.active === false :
      sectionFilter === 'protected' ? (sec.is_universal || isCoreSection(sec.id)) :
      sectionFilter === 'universal' ? sec.is_universal :
      true;
    // type context filter: if type selected, only show assigned sections
    const matchesType = !selectedType || allAssignedIds.includes(sec.id);
    return matchesSearch && matchesFilter && matchesType;
  });

  /* ── CRUD: Section ──────────────────────────────────────────────────── */
  const saveSection = async () => {
    if (!editSection.name?.trim()) { notify('Section name is required', 'error'); return; }
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
        notify(editSection.id ? 'Section updated — all typologies will reflect new settings.' : 'Section created!');
        await loadAll();
        if (!editSection.id) { setEditSection(BLANK_SECTION()); setSidebarMode('sections'); }
      } else {
        const e = await res.json().catch(() => ({}));
        notify(e.error || 'Save failed', 'error');
      }
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  const archiveSection = async (sectionId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/sections?id=${encodeURIComponent(sectionId)}&mode=archive`, { method: 'DELETE' });
      if (res.ok) {
        notify('Section archived — hidden from vendors but data is preserved for compare/analytics.');
        await loadAll();
      } else { notify('Archive failed', 'error'); }
    } catch { notify('Archive failed', 'error'); }
    setSaving(false);
  };

  const deleteSection = async (sectionId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/sections?id=${encodeURIComponent(sectionId)}&mode=delete`, { method: 'DELETE' });
      if (res.ok) {
        notify('Section deleted!');
        setSelectedSection(''); setEditSection(BLANK_SECTION()); await loadAll();
      } else {
        const e = await res.json().catch(() => ({}));
        if (e.code === 'PROTECTED_SECTION') {
          notify('This is a universal section. Use Archive or Force Delete (super-admin only).', 'error');
        } else {
          notify(e.error || 'Delete failed', 'error');
        }
      }
    } catch { notify('Delete failed', 'error'); }
    setSaving(false); setDeletingId(null);
  };

  const forceDeleteSection = async (sectionId: string) => {
    const confirmation = window.prompt(`Force deletion is irreversible. Type the section ID (${sectionId}) to confirm:`);
    if (confirmation !== sectionId) { notify('Force deletion cancelled.', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/sections?id=${encodeURIComponent(sectionId)}&mode=delete&force=true`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Force deletion failed');
      notify('Protected section force-deleted.');
      setSelectedSection(''); setEditSection(BLANK_SECTION()); await loadAll();
    } catch (error: any) { notify(error.message || 'Force deletion failed', 'error'); }
    setSaving(false);
  };

  const unlinkSectionFromType = async (sectionId: string, typeId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/sections?id=${encodeURIComponent(sectionId)}&type_id=${encodeURIComponent(typeId)}&mode=unlink`, { method: 'DELETE' });
      if (res.ok) {
        notify('Section unlinked from this typology. Data preserved.');
        await loadAll();
        if (selectedType === typeId) {
          const t = businessTypes.find(t => t.id === typeId);
          if (t) setAssignedSections(ownIds.filter(id => id !== sectionId));
        }
      } else { notify('Unlink failed', 'error'); }
    } catch { notify('Unlink failed', 'error'); }
    setSaving(false);
  };

  /* ── CRUD: Field ────────────────────────────────────────────────────── */
  const saveField = async () => {
    if (!editField) return;
    if (!editField.label?.trim()) { notify('Label is required', 'error'); return; }
    if (!editField.business_type_id) { notify('Business category is required', 'error'); return; }
    setSaving(true);
    try {
      const method = editField.id ? 'PUT' : 'POST';
      const res = await fetch('/api/jana/forms', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editField),
      });
      if (res.ok) {
        notify(editField.id ? 'Field updated!' : 'Field created!');
        setEditField(null); loadFields(selectedSection, selectedType);
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
    setSaving(false); setDeletingId(null);
  };

  /* ── Type Assignment / Topology ────────────────────────────────────── */
  const addSectionToType = async (sectionId: string, typeId: string) => {
    if (!typeId) { notify('Select a typology first', 'error'); return; }
    if (allAssignedIds.includes(sectionId)) { notify('Already assigned to this typology', 'error'); return; }
    const t = businessTypes.find(bt => bt.id === typeId);
    if (!t) return;
    const isParent = t.is_parent || Number(t.is_parent) === 1;
    const nextOwn  = isParent ? [...(t.sections || []), sectionId] : [...(t.own_sections || []), sectionId];
    setSaving(true);
    try {
      const body = { ...t, sections: isParent ? nextOwn : (t.sections || []), own_sections: isParent ? (t.own_sections || []) : nextOwn };
      const res = await fetch('/api/jana/types', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        notify('Section added to typology!');
        await loadAll();
        setAssignedSections(nextOwn);
      } else { notify('Failed to add section', 'error'); }
    } catch { notify('Failed to add section', 'error'); }
    setSaving(false);
  };

  const removeSectionFromType = async (sectionId: string) => {
    if (!selectedType) return;
    const t = businessTypes.find(bt => bt.id === selectedType);
    if (!t) return;
    const isParent   = t.is_parent || Number(t.is_parent) === 1;
    const nextOwn    = isParent
      ? (t.sections || []).filter((id: string) => id !== sectionId)
      : (t.own_sections || []).filter((id: string) => id !== sectionId);
    setSaving(true);
    try {
      const body = { ...t, sections: isParent ? nextOwn : (t.sections || []), own_sections: isParent ? (t.own_sections || []) : nextOwn };
      const res = await fetch('/api/jana/types', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        notify('Section removed from typology — data preserved.');
        await loadAll();
        setAssignedSections(prev => prev.filter(id => id !== sectionId));
        if (selectedSection === sectionId) setSelectedSection('');
      } else { notify('Failed to remove section', 'error'); }
    } catch { notify('Failed to remove section', 'error'); }
    setSaving(false);
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    if (!selectedType) return;
    const nextOwn = [...ownIds];
    const target  = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= nextOwn.length) return;
    [nextOwn[index], nextOwn[target]] = [nextOwn[target], nextOwn[index]];
    setAssignedSections([...inheritedIds, ...nextOwn]);
    const t = businessTypes.find(bt => bt.id === selectedType);
    if (!t) return;
    const isParent = t.is_parent || Number(t.is_parent) === 1;
    setSaving(true);
    try {
      const body = { ...t, sections: isParent ? nextOwn : (t.sections || []), own_sections: isParent ? (t.own_sections || []) : nextOwn };
      const res = await fetch('/api/jana/types', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { notify('Section order updated!'); await loadAll(); }
      else { notify('Failed to save order', 'error'); }
    } catch { notify('Failed to save order', 'error'); }
    setSaving(false);
  };

  const saveAssignments = async () => {
    if (!selectedType) { notify('Select a typology first', 'error'); return; }
    setSaving(true);
    try {
      const typeRes = await fetch('/api/jana/types?id=' + selectedType + '&t=' + Date.now());
      const currentType = await typeRes.json();
      const isParent = currentType.is_parent || Number(currentType.is_parent) === 1;
      const body = {
        ...currentType,
        sections: isParent ? assignedSections : (currentType.sections || []),
        own_sections: isParent ? (currentType.own_sections || []) : assignedSections,
      };
      const res = await fetch('/api/jana/types', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { notify('Assignments saved!'); await loadAll(); }
      else { notify('Save failed', 'error'); }
    } catch { notify('Save failed', 'error'); }
    setSaving(false);
  };

  const saveSectionOverrides = async (secId: string, updatedRules: any) => {
    try {
      const res = await fetch('/api/jana/sections', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: secId, inheritance_rules: updatedRules }),
      });
      if (res.ok) {
        notify('Override saved!');
        setSections(prev => prev.map(s => s.id === secId ? { ...s, inheritance_rules: updatedRules } : s));
      } else { notify('Failed to save override', 'error'); }
    } catch { notify('Failed to save override', 'error'); }
  };

  /* ── Propagate protection flag to all children of a parent ───────────── */
  const propagateToChildren = async (flag: keyof Section, value: any) => {
    if (!selectedSection) return;
    const childTypologies = businessTypes.filter(t => !t.is_parent && Number(t.is_parent) !== 1 && topologyMap.some(tm => tm.id === t.id));
    if (childTypologies.length === 0) { notify('No child typologies to propagate to.'); return; }
    // Just save the flag on the global section; all typologies using it will inherit it
    setSaving(true);
    try {
      const res = await fetch('/api/jana/sections', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSection, [flag]: value }),
      });
      if (res.ok) {
        notify(`"${String(flag)}" flag set — all ${childTypologies.length} typologies using this section will reflect the change.`);
        setEditSection(s => ({ ...s, [flag]: value }));
        await loadAll();
      } else { notify('Propagation failed', 'error'); }
    } catch { notify('Propagation failed', 'error'); }
    setSaving(false);
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '4px', fontSize: '1rem' }}>LOADING ARCHITECT…</div>
    </div>
  );

  /* ── Section Item for lists ─────────────────────────────────────────── */
  const SectionListItem = ({ sec, showActions = true, onAdd, isLibrary = false }: {
    sec: Section; showActions?: boolean; onAdd?: () => void; isLibrary?: boolean;
  }) => {
    const isActive  = sec.id === selectedSection;
    const isEnabled = sec.active !== false;
    const core      = CANONICAL_SECTIONS.find(s => s.id === sec.id) ?? null;
    const isCore    = Boolean(core);
    const coreColor = core?.color ?? (sec.is_universal ? '#2563eb' : '#64748b');
    const isAssigned = allAssignedIds.includes(sec.id);

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.65rem 0.75rem', borderRadius: '10px', marginBottom: '2px',
        border: isActive ? `1.5px solid ${coreColor}` : '1px solid #e2e8f0',
        borderLeft: `4px solid ${isCore ? coreColor : (isActive ? '#2563eb' : (isEnabled ? '#e2e8f0' : '#fecaca'))}`,
        background: isActive ? `${coreColor}0a` : (isEnabled ? '#fff' : '#fafafa'),
        opacity: isEnabled ? 1 : 0.7,
        transition: 'all 0.18s',
        cursor: 'pointer',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
          background: isActive ? coreColor : `${coreColor}18`,
          color: isActive ? '#fff' : coreColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
        }} onClick={() => selectSection(sec)}>
          <i className={`fas ${sec.icon || 'fa-layer-group'}`} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => selectSection(sec)}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.name}</div>
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '2px' }}>
            {isCore && <span style={{ fontSize: '0.55rem', fontWeight: 900, background: `${coreColor}18`, color: coreColor, padding: '1px 5px', borderRadius: '4px' }}>ESSENTIAL</span>}
            {sec.is_universal && <span style={{ fontSize: '0.55rem', fontWeight: 900, background: '#dbeafe', color: '#1d4ed8', padding: '1px 5px', borderRadius: '4px' }}>🌐 UNIVERSAL</span>}
            {!sec.vendor_editable && <span style={{ fontSize: '0.55rem', fontWeight: 900, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px' }}>🔒 LOCKED</span>}
            {!sec.show_on_minisite && <span style={{ fontSize: '0.55rem', fontWeight: 900, background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px' }}>HIDDEN</span>}
            {!isEnabled && <span style={{ fontSize: '0.55rem', fontWeight: 900, background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px' }}>🚫 INACTIVE</span>}
          </div>
        </div>
        {isLibrary && !isAssigned && selectedType && onAdd && (
          <button onClick={onAdd} title="Add to this typology" style={{ border: 'none', background: '#10b981', color: '#fff', width: 26, height: 26, borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
            <i className="fas fa-plus" />
          </button>
        )}
        {isLibrary && isAssigned && <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 900, flexShrink: 0 }}>✓</span>}
      </div>
    );
  };

  const isProtectedSection = currentSection && (currentSection.is_universal || isCoreSection(currentSection.id || ''));

  return (
    <div className="sa-shell" style={{ background: '#f4f7fb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .sa-shell { color: #172033; }
        .sa-shell button, .sa-shell input, .sa-shell select, .sa-shell textarea { font-family: inherit; }
        .sa-grid { flex: 1; height: calc(100vh - 120px); min-height: 0; display: grid; grid-template-columns: ${leftPanelWidth}px minmax(0,1fr); grid-template-rows: 1fr; overflow: hidden; background: #e2e8f0; gap: 1px; }
        .sa-sidebar { width:100%!important; min-width:0!important; height:100%!important; overflow-y:auto!important; background:#fff; }
        .sa-editor  { min-width:0!important; width:100%!important; height:100%!important; overflow-y:auto!important; background:#f8fafc; }
        .sa-sidebar, .sa-editor { scrollbar-width:thin; scrollbar-color:#cbd5e1 transparent; }
        .sa-split { display:grid; grid-template-columns:1fr 1fr; height:100%; overflow:hidden; }
        .sa-split-col { overflow-y:auto; height:100%; scrollbar-width:thin; scrollbar-color:#cbd5e1 transparent; }
        @media(max-width:1000px){ .sa-grid{display:block;height:auto;min-height:calc(100vh - 80px);} .sa-sidebar,.sa-editor{height:auto!important;width:100%!important;} }
        input:focus,textarea:focus,select:focus{border-color:#D4AF37!important;box-shadow:0 0 0 3px rgba(212,175,55,.12);}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:'fixed',top:'1.5rem',right:'2rem',zIndex:9999,padding:'1rem 1.75rem',borderRadius:'16px',fontWeight:800,fontSize:'0.85rem', background:toast.type==='success'?'#10b981':'#ef4444',color:'#fff',boxShadow:`0 10px 30px ${toast.type==='success'?'#10b98140':'#ef444440'}`,animation:'slideDown 0.3s ease' }}>
          <i className={`fas fa-${toast.type==='success'?'check-circle':'exclamation-circle'}`} style={{marginRight:'0.75rem'}} />
          {toast.msg}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'3rem',maxWidth:'420px',width:'100%',textAlign:'center',boxShadow:'0 25px 50px rgba(0,0,0,0.4)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>⚠️</div>
            <h3 style={{margin:'0 0 0.5rem',color:'#1e293b'}}>Confirm Delete</h3>
            <p style={{color:'#64748b',fontSize:'0.85rem',lineHeight:1.6}}>This will <strong>permanently delete</strong> the section and all its auto-generated fields.</p>
            <div style={{display:'flex',gap:'1rem',marginTop:'2rem'}}>
              <button onClick={() => setDeletingId(null)} style={css.btn('#e2e8f0',true)}>Cancel</button>
              <button onClick={() => deletingId.startsWith('field_') ? deleteField(deletingId.slice(6)) : deleteSection(deletingId)} style={css.btn('#ef4444')}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header style={{ background:'#0f172a',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,0.08)',position:'sticky',top:0,zIndex:100,boxShadow:'0 4px 20px rgba(15,23,42,0.12)' }}>
        <div style={{display:'flex',alignItems:'center',gap:'1.25rem'}}>
          <div style={{width:42,height:42,background:'linear-gradient(135deg,#D4AF37,#f59e0b)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="fas fa-layer-group" style={{color:'#0f172a',fontSize:'1rem'}} />
          </div>
          <div>
            <div style={{fontSize:'0.58rem',color:'#D4AF37',fontWeight:900,letterSpacing:'3px'}}>SECTION ARCHITECT</div>
            <div style={{fontSize:'0.95rem',fontWeight:900,color:'#fff'}}>Unified Section Manager</div>
          </div>
        </div>

        {/* Business Context Selector */}
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flex:1,maxWidth:620,margin:'0 2rem'}}>
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setSelectedType('');
              setAssignedSections([]);
            }}
            style={{ flex:1, padding:'0.55rem 1rem', borderRadius:'10px', border:'1.5px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:'0.75rem', fontWeight:700, outline:'none' }}
          >
            <option value="" style={{background:'#1e293b'}}>— All Categories —</option>
            {parents.map(p => <option key={p.id} value={p.id} style={{background:'#1e293b'}}>{p.name}</option>)}
          </select>

          <i className="fas fa-chevron-right" style={{color:'rgba(255,255,255,0.3)',fontSize:'0.65rem',flexShrink:0}} />

          {/* Typology */}
          <select
            value={selectedType}
            onChange={e => { if (e.target.value) selectType(e.target.value); else { setSelectedType(''); setAssignedSections([]); }}}
            style={{ flex:1, padding:'0.55rem 1rem', borderRadius:'10px', border:'1.5px solid rgba(255,255,255,0.12)', background: selectedType ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.08)', color: selectedType ? '#D4AF37' : 'rgba(255,255,255,0.7)', fontSize:'0.75rem', fontWeight:700, outline:'none' }}
          >
            <option value="" style={{background:'#1e293b'}}>— All Typologies —</option>
            {(selectedCategory ? categoryChildren : selectableTypes).map(t => <option key={t.id} value={t.id} style={{background:'#1e293b',color:'#fff'}}>{t.name}</option>)}
          </select>

          {selectedType && (
            <button
              onClick={() => { setSelectedType(''); setSelectedCategory(''); setAssignedSections([]); }}
              title="Clear context"
              style={{background:'rgba(255,255,255,0.08)',border:'none',color:'rgba(255,255,255,0.5)',padding:'0.55rem 0.75rem',borderRadius:'8px',cursor:'pointer',fontSize:'0.7rem'}}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
          <div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.3)',fontWeight:700}}>
            {sections.length} sections · {businessTypes.length} types
            {selectedType && currentType && <span style={{color:'#D4AF37'}}> · {currentType.name}</span>}
          </div>
          <Link href="/jana" style={{padding:'0.55rem 1.1rem',borderRadius:'10px',background:'rgba(255,255,255,0.08)',color:'#fff',textDecoration:'none',fontSize:'0.7rem',fontWeight:800}}>
            ← Back
          </Link>
        </div>
      </header>

      {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
      <div className="sa-grid">

        {/* ── PANEL 1: SIDEBAR ─────────────────────────────────────────── */}
        <nav className="sa-sidebar" style={{minWidth:`${leftPanelWidth}px`,width:`${leftPanelWidth}px`,display:'flex',flexDirection:'column',borderRight:'1px solid #dbe3ee'}}>

          {/* Sidebar top bar */}
          <div style={{padding:'0.75rem',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafbfd',flexShrink:0}}>
            <div style={{display:'flex',background:'#f1f5f9',padding:'3px',borderRadius:'8px',gap:'2px'}}>
              <button onClick={() => { setSidebarMode('sections'); }} style={{ padding:'0.3rem 0.7rem',borderRadius:'6px',fontSize:'0.62rem',fontWeight:800,border:'none',cursor:'pointer', background:sidebarMode==='sections'?'#fff':'transparent', color:sidebarMode==='sections'?'#1e293b':'#64748b', boxShadow:sidebarMode==='sections'?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.2s' }}>
                {selectedType ? '📋 ASSIGNED SECTIONS' : `📋 ALL SECTIONS (${sections.length})`}
              </button>
              <button onClick={() => { setSidebarMode('new'); setSelectedSection(''); setEditSection(BLANK_SECTION()); setEditField(null); setActiveTab('meta'); }} style={{ padding:'0.3rem 0.7rem',borderRadius:'6px',fontSize:'0.62rem',fontWeight:800,border:'none',cursor:'pointer', background:sidebarMode==='new'?'#D4AF37':'transparent', color:sidebarMode==='new'?'#fff':'#64748b', boxShadow:sidebarMode==='new'?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.2s' }}>
                <i className="fas fa-plus" style={{marginRight:'0.25rem'}} /> NEW
              </button>
            </div>
            <input type="range" min={360} max={640} step={10} value={leftPanelWidth} onChange={e => setLeftPanelWidth(Number(e.target.value))} title="Resize" aria-label="Resize panel" style={{width:48,accentColor:'#D4AF37'}} />
          </div>

          {/* ── "New" mode ─────────────────────────────────────────── */}
          {sidebarMode === 'new' ? (
            <div style={{padding:'1.25rem 0.9rem',minWidth:'300px'}}>
              <div style={{padding:'1rem',borderRadius:'14px',background:'#fffbeb',border:'1px solid #fde68a',marginBottom:'0.8rem'}}>
                <div style={{color:'#92400e',fontSize:'0.62rem',fontWeight:900,letterSpacing:'1px'}}>CREATE NEW SECTION</div>
                <div style={{color:'#78350f',fontSize:'0.72rem',lineHeight:1.5,marginTop:'0.35rem'}}>
                  {selectedType
                    ? `This section will be created globally and optionally added to "${currentType?.name}".`
                    : 'This creates a global section. Select a typology in the header to auto-assign it.'}
                </div>
              </div>
              <button onClick={() => setSidebarMode('sections')} style={{...css.btn('#0f172a'),width:'100%',fontSize:'0.7rem'}}>
                <i className="fas fa-arrow-left" style={{marginRight:'0.4rem'}} /> Back to Sections
              </button>
            </div>
          ) : selectedType ? (
            /* ── SPLIT VIEW: assigned | library ─────────────────────── */
            <div className="sa-split" style={{flex:1}}>

              {/* LEFT col: Assigned Sections */}
              <div className="sa-split-col" style={{borderRight:'1px solid #e2e8f0',display:'flex',flexDirection:'column'}}>
                <div style={{padding:'0.7rem 0.75rem',borderBottom:'1px solid #f1f5f9',background:'#fafbfd',flexShrink:0}}>
                  <div style={{fontSize:'0.58rem',fontWeight:900,color:'#64748b',letterSpacing:'1.5px'}}>ASSIGNED TO TYPOLOGY</div>
                  <div style={{fontSize:'0.72rem',fontWeight:800,color:'#1e293b',marginTop:'2px'}}>{currentType?.name}</div>
                  <div style={{fontSize:'0.58rem',color:'#94a3b8',marginTop:'1px'}}>{allAssignedIds.length} sections</div>
                </div>
                <div style={{padding:'0.5rem',flex:1,overflowY:'auto'}}>
                  {/* Inherited / Universal */}
                  {inheritedIds.length > 0 && (
                    <div style={{marginBottom:'0.5rem'}}>
                      <div style={{fontSize:'0.55rem',fontWeight:900,color:'#94a3b8',letterSpacing:'1px',padding:'0.25rem 0.35rem',marginBottom:'0.25rem'}}>🔒 INHERITED (GLOBAL)</div>
                      {inheritedIds.map(sid => {
                        const sec = sections.find(s => s.id === sid);
                        if (!sec) return null;
                        return <SectionListItem key={sec.id} sec={sec} />;
                      })}
                    </div>
                  )}
                  {/* Own Sections */}
                  <div>
                    <div style={{fontSize:'0.55rem',fontWeight:900,color:'#D4AF37',letterSpacing:'1px',padding:'0.25rem 0.35rem',marginBottom:'0.25rem'}}>✨ OWN SECTIONS</div>
                    {ownIds.map((sid, idx) => {
                      const sec = sections.find(s => s.id === sid);
                      if (!sec) return null;
                      return (
                        <div key={sec.id} style={{display:'flex',alignItems:'center',gap:'2px',marginBottom:'2px'}}>
                          <div style={{flex:1}}>
                            <SectionListItem sec={sec} />
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:'1px',flexShrink:0}}>
                            <button disabled={idx===0} onClick={() => moveSection(idx,'up')} style={{border:'none',background:'#f1f5f9',width:20,height:20,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',color:idx===0?'#cbd5e1':'#64748b',cursor:idx===0?'not-allowed':'pointer',fontSize:'0.55rem'}}><i className="fas fa-chevron-up"/></button>
                            <button disabled={idx===ownIds.length-1} onClick={() => moveSection(idx,'down')} style={{border:'none',background:'#f1f5f9',width:20,height:20,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',color:idx===ownIds.length-1?'#cbd5e1':'#64748b',cursor:idx===ownIds.length-1?'not-allowed':'pointer',fontSize:'0.55rem'}}><i className="fas fa-chevron-down"/></button>
                            <button onClick={() => removeSectionFromType(sec.id)} title="Remove from typology (data kept)" style={{border:'none',background:'#fee2e2',width:20,height:20,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444',cursor:'pointer',fontSize:'0.55rem'}}><i className="fas fa-unlink"/></button>
                          </div>
                        </div>
                      );
                    })}
                    {ownIds.length === 0 && (
                      <div style={{padding:'1rem',border:'1.5px dashed #e2e8f0',borderRadius:'8px',textAlign:'center',fontSize:'0.7rem',color:'#94a3b8'}}>No custom sections.<br/>Add from the library →</div>
                    )}
                  </div>
                </div>
                {/* Save Assignments button */}
                <div style={{padding:'0.5rem',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
                  <button onClick={saveAssignments} disabled={saving} style={{...css.btn('#10b981'),width:'100%',fontSize:'0.7rem',padding:'0.6rem'}}>
                    {saving ? '…' : <><i className="fas fa-save" style={{marginRight:'0.4rem'}}/>Save Layout</>}
                  </button>
                </div>
              </div>

              {/* RIGHT col: Section Library */}
              <div className="sa-split-col" style={{display:'flex',flexDirection:'column',background:'#f8fafc'}}>
                <div style={{padding:'0.7rem 0.75rem',borderBottom:'1px solid #f1f5f9',background:'#f8fafc',flexShrink:0}}>
                  <div style={{fontSize:'0.58rem',fontWeight:900,color:'#64748b',letterSpacing:'1.5px'}}>SECTION LIBRARY</div>
                  <div style={{fontSize:'0.58rem',color:'#94a3b8',marginTop:'1px'}}>Click + to add to typology</div>
                  <input
                    value={libSearch}
                    onChange={e => setLibSearch(e.target.value)}
                    placeholder="Search sections…"
                    style={{...css.input(),marginTop:'0.5rem',padding:'0.45rem 0.75rem',fontSize:'0.72rem',borderRadius:'8px'}}
                  />
                </div>
                <div style={{padding:'0.5rem',flex:1,overflowY:'auto'}}>
                  {libSections.map(sec => (
                    <SectionListItem
                      key={sec.id}
                      sec={sec}
                      isLibrary={true}
                      onAdd={() => addSectionToType(sec.id, selectedType)}
                    />
                  ))}
                  {libSections.length === 0 && (
                    <div style={{textAlign:'center',padding:'2rem',color:'#94a3b8',fontSize:'0.75rem'}}>No sections found</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── GLOBAL SECTIONS LIST (no typology selected) ─────────── */
            <>
              <div style={{padding:'0.75rem',borderBottom:'1px solid #e2e8f0',background:'#f8fafc',flexShrink:0}}>
                <div style={{position:'relative'}}>
                  <i className="fas fa-search" style={{position:'absolute',left:'0.9rem',top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:'0.8rem'}} />
                  <input value={sectionSearch} onChange={e => setSectionSearch(e.target.value)} placeholder="Search sections by name, ID…" aria-label="Search sections" style={{...css.input(),padding:'0.65rem 0.9rem 0.65rem 2.25rem',fontSize:'0.78rem',borderRadius:'10px'}} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.3rem',marginTop:'0.6rem'}}>
                  {(['all','active','inactive','protected','universal'] as const).map(f => (
                    <button key={f} onClick={() => setSectionFilter(f)} style={{
                      padding:'0.4rem 0.1rem',border:'1px solid',borderColor:sectionFilter===f?'#0f172a':'#cbd5e1',borderRadius:'6px',
                      background:sectionFilter===f?'#0f172a':'#ffffff',color:sectionFilter===f?'#fff':'#475569',
                      fontSize:'0.58rem',fontWeight:900,cursor:'pointer',textTransform:'uppercase',transition:'all 0.2s'
                    }}>{f}</button>
                  ))}
                </div>
                <div style={{marginTop:'0.5rem',fontSize:'0.65rem',color:'#64748b',fontWeight:700}}>
                  Showing {visibleSections.length} of {sections.length}
                </div>
              </div>

              {/* Legend */}
              <div style={{padding:'0.6rem 1rem',borderBottom:'1px solid #d1fae5',background:'linear-gradient(135deg,#f0fdf4,#ecfdf5)',display:'flex',alignItems:'center',gap:'0.6rem',flexShrink:0}}>
                <i className="fas fa-shield-halved" style={{color:'#10b981',fontSize:'0.9rem'}} />
                <span style={{fontSize:'0.68rem',color:'#065f46',fontWeight:700,lineHeight:1.4}}>
                  <strong>Essential</strong> sections = always-on, data preserved. Admins can hide/lock but not delete.
                </span>
              </div>

              <div style={{padding:'0.75rem',flex:1,overflowY:'auto'}}>
                {[...visibleSections].sort((a, b) => {
                  if ((a.active !== false) !== (b.active !== false)) return (a.active !== false) ? -1 : 1;
                  return (isCoreSection(b.id) ? 1 : 0) - (isCoreSection(a.id) ? 1 : 0);
                }).map(sec => <SectionListItem key={sec.id} sec={sec} />)}
                {visibleSections.length === 0 && (
                  <div style={{padding:'2rem',textAlign:'center',color:'#94a3b8',fontSize:'0.8rem'}}>No sections match your filter.</div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* ── PANEL 2: EDITOR ────────────────────────────────────────── */}
        <main className="sa-editor" style={{display:'flex',flexDirection:'column'}}>

          {/* Tab Bar */}
          <div style={{background:'#fff',borderBottom:'1px solid #f1f5f9',padding:'0 2rem',display:'flex',gap:'0.4rem',alignItems:'center',minHeight:'58px',flexShrink:0}}>
            {[
              { key:'meta',     label:'Section Settings', icon:'fa-sliders-h' },
              { key:'fields',   label:'Field Builder',    icon:'fa-list-alt',   disabled:!selectedSection },
              { key:'assign',   label:'Type Assignment',  icon:'fa-sitemap',    disabled:!selectedSection },
              { key:'topology', label:'Topology Map',     icon:'fa-project-diagram', disabled:!selectedSection },
            ].map(({ key, label, icon, disabled }) => (
              <button key={key} onClick={() => !disabled && setActiveTab(key as any)} disabled={!!disabled} style={{ ...css.tab(activeTab===key), opacity:disabled?0.35:1, cursor:disabled?'not-allowed':'pointer' }}>
                <i className={`fas ${icon}`} style={{marginRight:'0.45rem'}} />{label}
              </button>
            ))}

            {/* Right actions */}
            {currentSection && (
              <div style={{marginLeft:'auto',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                <span style={{fontSize:'0.62rem',fontWeight:900,color:currentSection.active?'#10b981':'#94a3b8',background:currentSection.active?'#dcfce7':'#f1f5f9',padding:'4px 10px',borderRadius:'8px'}}>
                  {currentSection.active ? '● ACTIVE' : '○ INACTIVE'}
                </span>
                {isProtectedSection ? (
                  <div style={{display:'flex',gap:'0.4rem'}}>
                    <button onClick={() => archiveSection(selectedSection)} style={{...css.btn('#f59e0b',true),padding:'0.5rem 0.9rem',fontSize:'0.68rem'}}>
                      <i className="fas fa-archive" style={{marginRight:'0.3rem'}} />Archive
                    </button>
                    <button onClick={() => forceDeleteSection(selectedSection)} style={{...css.btn('#7f1d1d',true),padding:'0.5rem 0.9rem',fontSize:'0.68rem'}}>
                      <i className="fas fa-skull-crossbones" style={{marginRight:'0.3rem'}} />Force Delete
                    </button>
                  </div>
                ) : (
                  <div style={{display:'flex',gap:'0.4rem'}}>
                    <button onClick={() => archiveSection(selectedSection)} style={{...css.btn('#f59e0b',true),padding:'0.5rem 0.9rem',fontSize:'0.68rem'}}>
                      <i className="fas fa-archive" style={{marginRight:'0.3rem'}} />Archive
                    </button>
                    <button onClick={() => setDeletingId(selectedSection)} style={{...css.btn('#ef4444',true),padding:'0.5rem 0.9rem',fontSize:'0.68rem'}}>
                      <i className="fas fa-trash" style={{marginRight:'0.3rem'}} />Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── TAB: META ─────────────────────────────────────────────── */}
          {activeTab === 'meta' && (
            <div style={{padding:'2.5rem',maxWidth:'960px',width:'100%'}}>
              <h2 style={{margin:'0 0 0.25rem',fontSize:'1.25rem',fontWeight:900,color:'#1e293b'}}>
                {selectedSection ? 'Edit Section' : 'Create New Section'}
              </h2>
              <p style={{color:'#94a3b8',fontSize:'0.78rem',marginBottom:'2rem'}}>
                {selectedSection ? `Editing "${currentSection?.name}" — changes apply to ALL typologies using this section.` : 'Define a new reusable section with feature flags and visibility rules.'}
              </p>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'2rem'}}>

                {/* Name */}
                <div style={{gridColumn:'1 / -1'}}>
                  <label style={css.label()}>Section Name *</label>
                  <input style={css.input()} value={editSection.name||''} onChange={e => setEditSection(s => ({...s,name:e.target.value}))} placeholder="e.g. Amenities, Location, Pricing" />
                </div>

                {/* Icon */}
                <div>
                  <label style={css.label()}>Icon (Font Awesome class)</label>
                  <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                    <input style={{...css.input(),flex:1}} value={editSection.icon||''} onChange={e => setEditSection(s => ({...s,icon:e.target.value}))} placeholder="fa-star" />
                    <div style={{width:44,height:44,borderRadius:'12px',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #e2e8f0',fontSize:'1.1rem',color:'#D4AF37',flexShrink:0}}>
                      <i className={`fas ${editSection.icon||'fa-layer-group'}`} />
                    </div>
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label style={css.label()}>Sort Order</label>
                  <input style={css.input()} type="number" value={editSection.sort_order??0} onChange={e => setEditSection(s => ({...s,sort_order:+e.target.value}))} />
                </div>

                {/* Description */}
                <div style={{gridColumn:'1 / -1'}}>
                  <label style={css.label()}>Description (optional)</label>
                  <textarea style={{...css.input(),minHeight:'70px',resize:'vertical',fontFamily:'inherit'}} value={editSection.description||''} onChange={e => setEditSection(s => ({...s,description:e.target.value}))} placeholder="Brief description of this section's purpose…" />
                </div>

                {/* Curation Policy */}
                <div>
                  <label style={css.label()}>Curation Policy</label>
                  <select style={css.input()} value={editSection.curation_policy||'manual_review'} onChange={e => setEditSection(s => ({...s,curation_policy:e.target.value as any}))}>
                    <option value="auto_approve">Auto-Approve (live instantly)</option>
                    <option value="manual_review">Manual Review (admin moderation)</option>
                    <option value="admin_only">Admin Only (no vendor uploads)</option>
                  </select>
                </div>

                {/* Required Tier */}
                <div>
                  <label style={css.label()}>Required Subscription Tier</label>
                  <select style={css.input()} value={editSection.required_tier||''} onChange={e => setEditSection(s => ({...s,required_tier:e.target.value||null}))}>
                    <option value="">Free / Public (all tiers)</option>
                    <option value="basic">Basic or Higher</option>
                    <option value="pro">Pro or Higher</option>
                    <option value="premium">Premium or Higher</option>
                    <option value="enterprise">Enterprise Only</option>
                  </select>
                </div>
              </div>

              {/* ── VISIBILITY & PROTECTION FLAGS ─────────────────────── */}
              <div style={{background:'#fff',borderRadius:'20px',border:'1.5px solid #e2e8f0',overflow:'hidden',marginBottom:'1.5rem'}}>
                <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:'0.75rem',background:'linear-gradient(135deg,#fafbfd,#fff)'}}>
                  <i className="fas fa-shield-halved" style={{color:'#D4AF37'}} />
                  <span style={{fontWeight:900,fontSize:'0.85rem',color:'#1e293b'}}>Protection & Visibility Flags</span>
                  <span style={{fontSize:'0.62rem',color:'#94a3b8',fontWeight:700}}>Applies globally to all typologies using this section</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                  <ToggleRow value={!!(editSection as any).active}           onChange={v => setEditSection(s => ({...s,active:v}))}           label="Section Active"         sub="Section visible to vendors & public"            icon="fa-eye"          color="#10b981" />
                  <ToggleRow value={!!(editSection as any).is_universal}     onChange={v => setEditSection(s => ({...s,is_universal:v}))}     label="Universal (Global Lock)" sub="Inherited by ALL typologies. Cannot be deleted."  icon="fa-globe"        color="#3b82f6" />
                  <ToggleRow value={!!(editSection as any).vendor_editable}  onChange={v => setEditSection(s => ({...s,vendor_editable:v}))}  label="Vendor Editable"        sub="Vendors can edit fields in this section"         icon="fa-user-edit"    color="#8b5cf6" />
                  <ToggleRow value={!!(editSection as any).required}         onChange={v => setEditSection(s => ({...s,required:v}))}         label="Required Section"        sub="Vendors cannot skip or remove this section"      icon="fa-lock"         color="#ef4444" />
                  <ToggleRow value={!!(editSection as any).show_on_public}   onChange={v => setEditSection(s => ({...s,show_on_public:v}))}   label="Public Visibility"       sub="Show on public listings & discovery"            icon="fa-globe-europe" color="#ec4899" />
                  <ToggleRow value={!!(editSection as any).show_on_minisite} onChange={v => setEditSection(s => ({...s,show_on_minisite:v}))} label="Minisite Visibility"     sub="Show on vendor's public minisite page"          icon="fa-store"        color="#0f766e" />
                  <ToggleRow value={!!(editSection as any).show_on_card}     onChange={v => setEditSection(s => ({...s,show_on_card:v}))}     label="Show on Card"           sub="Preview card in discovery listings"              icon="fa-id-card"      color="#f59e0b" />
                  <ToggleRow value={!!(editSection as any).is_filterable}    onChange={v => setEditSection(s => ({...s,is_filterable:v}))}    label="Filterable"             sub="Include in search & filter dropdowns"            icon="fa-filter"       color="#6366f1" />
                  <ToggleRow value={!!(editSection as any).enable_gallery}   onChange={v => setEditSection(s => ({...s,enable_gallery:v}))}   label="Gallery Enabled"        sub="Show Gallery upload tab to vendors"              icon="fa-images"       color="#6366f1" />
                  <ToggleRow value={!!(editSection as any).enable_blog}      onChange={v => setEditSection(s => ({...s,enable_blog:v}))}      label="Blog / Story Enabled"   sub="Show Blog/Story tab to vendors"                  icon="fa-feather-alt"  color="#f59e0b" />
                  <ToggleRow value={!!(editSection as any).propagation_hero} onChange={v => setEditSection(s => ({...s,propagation_hero:v}))} label="Hero Propagation"       sub="This section feeds the minisite hero banner"     icon="fa-panorama"     color="#d946ef" />
                  <ToggleRow value={!!(editSection as any).propagation_blog} onChange={v => setEditSection(s => ({...s,propagation_blog:v}))} label="Blog Propagation"       sub="This section feeds the main blog stream"         icon="fa-rss"          color="#ea580c" />
                  <ToggleRow value={!!(editSection as any).propagation_card} onChange={v => setEditSection(s => ({...s,propagation_card:v}))} label="Card Propagation"       sub="This section feeds the discovery card preview"   icon="fa-rectangle-list" color="#0284c7" />
                </div>
              </div>

              {/* Protection Release Banner */}
              {editSection.is_universal && (
                <div style={{background:'rgba(59,130,246,0.05)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:'16px',padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
                  <div>
                    <div style={{fontSize:'0.68rem',fontWeight:900,color:'#3b82f6',letterSpacing:'1px',marginBottom:'0.25rem'}}>🔒 UNIVERSAL PROTECTION ACTIVE</div>
                    <div style={{fontSize:'0.72rem',color:'#475569',lineHeight:1.5}}>This section is inherited by ALL typologies. Releasing it makes it optionally assignable. Data and existing assignments are preserved.</div>
                  </div>
                  <button type="button" onClick={() => { setEditSection(s => ({...s,is_universal:false})); notify('Protection released — section can now be optionally assigned.'); }} style={{padding:'0.7rem 1.1rem',borderRadius:'12px',border:'1px solid rgba(59,130,246,0.35)',background:'rgba(59,130,246,0.08)',color:'#1d4ed8',fontWeight:800,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
                    <i className="fas fa-unlock" style={{marginRight:'0.5rem'}} />Release Protection
                  </button>
                </div>
              )}

              {/* Content Authority */}
              {(() => {
                const policy = getContentPolicy(editSection);
                const updatePolicy = (key: keyof typeof DEFAULT_CONTENT_POLICY, value: boolean) => {
                  const rules = typeof editSection.inheritance_rules === 'string'
                    ? (() => { try { return JSON.parse(editSection.inheritance_rules as string); } catch { return {}; } })()
                    : editSection.inheritance_rules || {};
                  setEditSection(sec => ({ ...sec, inheritance_rules: { ...rules, content_policy: { ...policy, [key]: value } } }));
                };
                const controls = [
                  ['vendor_can_upload_images',       'Vendor image uploads',      'Allow vendors to submit section images'],
                  ['vendor_can_add_captions',        'Vendor captions',           'Allow vendors to add image captions'],
                  ['vendor_can_write_blog',          'Vendor section stories',    'Allow vendors to write a blog/story'],
                  ['vendor_can_submit_carousel',     'Minisite carousel requests','Allow vendors to request minisite placement'],
                  ['vendor_can_request_main_carousel','Main carousel requests',   'Allow vendors to request homepage carousel'],
                  ['requires_approval',              'Admin approval required',   'Content stays pending until admin approves'],
                ] as const;
                return (
                  <div style={{background:'#fff',borderRadius:'20px',border:'1.5px solid #e2e8f0',overflow:'hidden',marginBottom:'2rem'}}>
                    <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:'0.75rem'}}>
                      <i className="fas fa-user-shield" style={{color:'#0f766e'}} />
                      <span style={{fontWeight:900,fontSize:'0.85rem',color:'#1e293b'}}>Content Authority</span>
                      <span style={{fontSize:'0.62rem',color:'#94a3b8',fontWeight:700}}>Vendor permissions for content in this section</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                      {controls.map(([key, label, sub]) => (
                        <label key={key} style={{padding:'0.9rem 1.4rem',display:'flex',alignItems:'center',gap:'0.75rem',borderBottom:'1px solid #f8fafc',cursor:'pointer'}}>
                          <input type="checkbox" checked={!!policy[key]} onChange={e => updatePolicy(key, e.target.checked)} style={{width:16,height:16,accentColor:'#0f766e'}} />
                          <span><strong style={{display:'block',fontSize:'0.75rem',color:'#1e293b'}}>{label}</strong><small style={{display:'block',marginTop:'0.1rem',color:'#94a3b8',fontSize:'0.6rem'}}>{sub}</small></span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Save */}
              <div style={{display:'flex',gap:'1rem'}}>
                <button onClick={saveSection} disabled={saving} style={{...css.btn('#1e293b'),minWidth:'180px'}}>
                  {saving ? <><i className="fas fa-spinner fa-spin" style={{marginRight:'0.5rem'}} />Saving…</> : <><i className="fas fa-save" style={{marginRight:'0.5rem'}} />{selectedSection ? 'Update Section' : 'Create Section'}</>}
                </button>
                {selectedSection && !isProtectedSection && (
                  <button onClick={() => archiveSection(selectedSection)} disabled={saving} style={{...css.btn('#f59e0b',true)}}>
                    <i className="fas fa-archive" style={{marginRight:'0.5rem'}} />Archive (Keep Data)
                  </button>
                )}
                {selectedSection && sidebarMode === 'sections' && selectedType && (
                  <button onClick={() => unlinkSectionFromType(selectedSection, selectedType)} disabled={saving} style={{...css.btn('#94a3b8',true)}}>
                    <i className="fas fa-unlink" style={{marginRight:'0.5rem'}} />Unlink from {currentType?.name}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: FIELDS ────────────────────────────────────────────── */}
          {activeTab === 'fields' && (
            <div style={{padding:'2rem 1.5rem 2.5rem',maxWidth:'1200px',width:'100%'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
                <div>
                  <h2 style={{margin:0,fontSize:'1.2rem',fontWeight:900,color:'#1e293b'}}>Field Builder</h2>
                  <p style={{color:'#94a3b8',fontSize:'0.78rem',marginTop:'0.25rem'}}>Fields for <strong>{currentSection?.name}</strong></p>
                </div>
                <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                  <select value={selectedType} onChange={e => selectType(e.target.value)} style={{...css.input(),width:'min(100%,280px)',minWidth:0,padding:'0.55rem 1rem'}}>
                    <option value="">— All Categories & Typologies —</option>
                    {selectableTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={() => setEditField(BLANK_FIELD(selectedSection, selectedType))} style={css.btn('#10b981')}>
                    <i className="fas fa-plus" style={{marginRight:'0.5rem'}} />Add Field
                  </button>
                </div>
              </div>

              {fields.length === 0 ? (
                <div style={{textAlign:'center',padding:'5rem',background:'#fff',borderRadius:'24px',border:'2px dashed #e2e8f0'}}>
                  <i className="fas fa-folder-open fa-3x" style={{color:'#e2e8f0',marginBottom:'1rem',display:'block'}} />
                  <p style={{color:'#94a3b8',fontWeight:700}}>No fields yet. Click "Add Field" to start building this section's form.</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'0.9rem'}}>
                  {[...fields]
                    .filter(f => !selectedType || f.business_type_id === selectedType || f.business_type_id === 'SECTION_TEMPLATE')
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(f => {
                      const ti = FIELD_TYPES.find(t => t.value === f.field_type);
                      const isTemplate = f.business_type_id === 'SECTION_TEMPLATE';
                      const bt = businessTypes.find(t => t.id === f.business_type_id);
                      const typeLabel = bt ? bt.name : (isTemplate ? 'Universal Template' : f.business_type_id);
                      return (
                        <div key={f.id} style={{background:'#fff',borderRadius:'18px',padding:'1.25rem 1.5rem',border:isTemplate?'1.5px solid #D4AF3740':'1px solid #f1f5f9',display:'flex',alignItems:'flex-start',gap:'1.25rem',flexWrap:'wrap',justifyContent:'space-between',boxShadow:'0 2px 8px rgba(0,0,0,0.03)'}}>
                          <div style={{width:46,height:46,borderRadius:'14px',background:`${ti?.color||'#eee'}12`,color:ti?.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>
                            <i className={`fas ${ti?.icon||'fa-cube'}`} />
                          </div>
                          <div style={{flex:'1 1 320px',minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap'}}>
                              <span style={{fontWeight:900,fontSize:'0.95rem',color:'#1e293b'}}>{f.label}</span>
                              <span style={{fontSize:'0.55rem',padding:'3px 8px',background:isTemplate?'#fef3c7':'#e0f2fe',color:isTemplate?'#b45309':'#0369a1',borderRadius:'6px',fontWeight:900}}>{typeLabel.toUpperCase()}</span>
                              {f.required && <span style={{fontSize:'0.55rem',padding:'3px 8px',background:'#fee2e2',color:'#ef4444',borderRadius:'6px',fontWeight:900}}>REQUIRED</span>}
                              {!f.vendor_editable && <span style={{fontSize:'0.55rem',padding:'3px 8px',background:'#fef3c7',color:'#92400e',borderRadius:'6px',fontWeight:900}}>ADMIN ONLY</span>}
                              {f.version_type && <span style={{fontSize:'0.55rem',padding:'3px 8px',background:f.version_type==='initial'?'#eef2ff':'#ecfdf5',color:f.version_type==='initial'?'#3730a3':'#166534',borderRadius:'6px',fontWeight:900}}>{f.version_type.toUpperCase()}</span>}
                            </div>
                            <div style={{fontSize:'0.65rem',color:'#94a3b8',marginTop:'4px',fontWeight:700}}>
                              <code style={{background:'#f8fafc',padding:'1px 6px',borderRadius:'4px'}}>{f.name}</code>
                              {' · '}{ti?.label}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'0.6rem',flexShrink:0,marginLeft:'auto',alignItems:'center'}}>
                            <button onClick={() => setEditField(f)} style={{height:38,padding:'0 0.9rem',borderRadius:'10px',background:'#f8fafc',border:'1px solid #e2e8f0',color:'#64748b',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.75rem',fontWeight:800}}>
                              <i className="fas fa-cog" />Edit
                            </button>
                            <button onClick={() => setDeletingId('field_'+f.id)} style={{height:38,padding:'0 0.9rem',borderRadius:'10px',background:'#fff0f0',border:'1px solid #fecaca',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.75rem',fontWeight:800}}>
                              <i className="fas fa-trash" />Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Field Editor Modal */}
              {editField && (
                <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.8)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
                  <div style={{background:'#fff',borderRadius:'28px',width:'100%',maxWidth:'600px',maxHeight:'90vh',overflowY:'auto',padding:'3rem',boxShadow:'0 25px 50px rgba(0,0,0,0.4)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
                      <div>
                        <div style={{fontSize:'0.65rem',color:'#D4AF37',fontWeight:900,letterSpacing:'2px'}}>FIELD EDITOR</div>
                        <h3 style={{margin:0,fontSize:'1.2rem',fontWeight:900,color:'#1e293b'}}>{editField.id ? 'Edit Field' : 'New Field'}</h3>
                      </div>
                      <button onClick={() => setEditField(null)} style={{width:36,height:36,borderRadius:'10px',background:'#f8fafc',border:'none',cursor:'pointer',color:'#94a3b8'}}><i className="fas fa-times" /></button>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
                      <div>
                        <label style={css.label()}>Label (displayed to vendor) *</label>
                        <input style={css.input()} value={editField.label||''} onChange={e => setEditField(f => ({...f!,label:e.target.value}))} placeholder="e.g. Number of Rooms" />
                      </div>
                      <div>
                        <label style={css.label()}>Business Category / Typology *</label>
                        <select value={editField.business_type_id||''} onChange={e => setEditField(f => ({...f!,business_type_id:e.target.value}))} style={css.input()}>
                          <option value="SECTION_TEMPLATE">Universal Template</option>
                          {selectableTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={css.label()}>Database Key (snake_case)</label>
                        <input style={{...css.input(),opacity:editField.id?0.5:1}} value={editField.name||''} onChange={e => setEditField(f => ({...f!,name:e.target.value}))} disabled={!!editField.id} placeholder="e.g. num_rooms" />
                      </div>
                      <div>
                        <label style={css.label()}>Save Version</label>
                        <select value={editField.version_type||'latest'} onChange={e => setEditField(f => ({...f!,version_type:e.target.value as any}))} style={css.input()}>
                          <option value="latest">Latest Update</option>
                          <option value="initial">Initial Default</option>
                        </select>
                      </div>
                      <div>
                        <label style={css.label()}>Field Type</label>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem'}}>
                          {FIELD_TYPES.map(t => (
                            <button key={t.value} onClick={() => setEditField(f => ({...f!,field_type:t.value}))} style={{padding:'0.75rem 0.25rem',borderRadius:'10px',border:editField.field_type===t.value?`2px solid ${t.color}`:'1.5px solid #f1f5f9',background:editField.field_type===t.value?`${t.color}12`:'#fff',fontSize:'0.58rem',fontWeight:900,cursor:'pointer',textAlign:'center',color:'#1e293b'}}>
                              <i className={`fas ${t.icon}`} style={{display:'block',color:t.color,fontSize:'1rem',marginBottom:'0.3rem'}} />{t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {['select','multiselect','checkbox_group'].includes(editField.field_type||'') && (
                        <div>
                          <label style={css.label()}>Options</label>
                          <TagInput value={Array.isArray(editField.options)?editField.options:[]} onChange={opts => setEditField(f => ({...f!,options:opts}))} placeholder="Add an option and press Enter" label="Options" />
                        </div>
                      )}
                      <div>
                        <label style={css.label()}>Help Text (optional)</label>
                        <input style={css.input()} value={editField.help_text||''} onChange={e => setEditField(f => ({...f!,help_text:e.target.value}))} placeholder="Guidance shown below the field" />
                      </div>
                      <div>
                        <label style={css.label()}>Feature / Tier Lock</label>
                        <select value={editField.required_feature||''} onChange={e => setEditField(f => ({...f!,required_feature:e.target.value||undefined}))} style={css.input()}>
                          <option value="">No Tier Lock (Available to All)</option>
                          <option value="allowedSections">Allowed Sections Only</option>
                          <option value="canCustomizeTemplate">Custom Templates (Gold+)</option>
                          <option value="hero_automation">Cinema Hero/Blogs (Premium+)</option>
                          <option value="investment_gating">Investment Opportunity (Gold+)</option>
                        </select>
                      </div>
                      <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap'}}>
                        {[{ key:'required',label:'Required' },{ key:'vendor_editable',label:'Vendor Editable' },{ key:'show_on_public',label:'Public Visibility' }].map(({ key, label }) => (
                          <label key={key} style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',color:'#475569'}}>
                            <input type="checkbox" checked={!!(editField as any)[key]} onChange={e => setEditField(f => ({...f!,[key]:e.target.checked}))} />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:'1rem',paddingTop:'0.5rem'}}>
                        <button onClick={() => setEditField(null)} style={{...css.btn('#e2e8f0',true),flex:1,color:'#64748b'}}>Cancel</button>
                        <button onClick={saveField} disabled={saving} style={{...css.btn('#1e293b'),flex:1}}>
                          {saving ? 'Saving…' : editField.id ? 'Update Field' : 'Create Field'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ASSIGN ───────────────────────────────────────────── */}
          {activeTab === 'assign' && (
            <div style={{padding:'2.5rem',maxWidth:'760px'}}>
              <h2 style={{margin:'0 0 0.25rem',fontSize:'1.2rem',fontWeight:900,color:'#1e293b'}}>Type Assignment</h2>
              <p style={{color:'#94a3b8',fontSize:'0.78rem',marginBottom:'2rem'}}>Assign <strong>{currentSection?.name}</strong> to categories and typologies. Toggle which forms use it.</p>

              <div style={{marginBottom:'2rem'}}>
                <label style={css.label()}>Select Category or Typology</label>
                <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
                  {parents.map(parent => (
                    <div key={parent.id}>
                      <button onClick={() => selectType(parent.id)} style={{width:'100%',textAlign:'left',padding:'0.8rem 1.1rem',borderRadius:'10px',border:selectedType===parent.id?'2px solid #D4AF37':'1px solid #e2e8f0',background:selectedType===parent.id?'#fffbeb':'#fff',cursor:'pointer',fontWeight:800,fontSize:'0.82rem',color:'#1e293b',display:'flex',alignItems:'center',gap:'0.75rem'}}>
                        <i className={`fas ${parent.icon}`} style={{color:parent.icon_color||'#D4AF37'}} />{parent.name}
                        <span style={{fontSize:'0.6rem',color:'#94a3b8',fontWeight:600,marginLeft:'auto'}}>Category</span>
                      </button>
                      {children(parent.id).map(child => (
                        <button key={child.id} onClick={() => selectType(child.id)} style={{width:'100%',textAlign:'left',padding:'0.65rem 1.1rem 0.65rem 2.5rem',borderRadius:'9px',border:selectedType===child.id?'2px solid #D4AF37':'1px solid transparent',background:selectedType===child.id?'#fffbeb':'transparent',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',color:'#475569',display:'flex',alignItems:'center',gap:'0.75rem',marginTop:'2px'}}>
                          <i className={`fas ${child.icon}`} style={{color:child.icon_color||'#6366f1',fontSize:'0.78rem'}} />{child.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {selectedType && (
                <>
                  <div style={{background:'#fff',borderRadius:'16px',border:'1.5px solid #e2e8f0',overflow:'hidden',marginBottom:'1.5rem'}}>
                    <div style={{padding:'0.9rem 1.4rem',borderBottom:'1px solid #f1f5f9',fontSize:'0.62rem',fontWeight:900,color:'#94a3b8',letterSpacing:'1px',background:'#fafbfd'}}>
                      TYPOLOGY OVERRIDES FOR: {currentType?.name?.toUpperCase()}
                    </div>
                    {sections.filter(s => selectedSection ? s.id === selectedSection : true).map(sec => {
                      const isUniversal = !!sec.is_universal;
                      const checked = isUniversal || assignedSections.includes(sec.id);
                      const rules = (() => { try { return typeof sec.inheritance_rules === 'string' ? JSON.parse(sec.inheritance_rules) : sec.inheritance_rules || {}; } catch { return {}; } })();
                      const typologyRules = rules.typologies?.[selectedType] || {};
                      const requiredOverride = typologyRules.required_override || 'default';

                      const handleOverride = (key: string, value: any) => {
                        const updatedRules = { ...rules, typologies: { ...(rules.typologies || {}), [selectedType]: { ...(typologyRules || {}), [key]: value } } };
                        saveSectionOverrides(sec.id, updatedRules);
                      };

                      return (
                        <div key={sec.id} style={{borderBottom:'1px solid #f8fafc'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.9rem 1.4rem',background:checked?'#fffbeb':'#fff'}}>
                            <input type="checkbox" checked={checked} disabled={isUniversal} onChange={() => {
                              setAssignedSections(prev => prev.includes(sec.id) ? prev.filter(id => id !== sec.id) : [...prev, sec.id]);
                            }} style={{width:18,height:18,cursor:isUniversal?'not-allowed':'pointer',accentColor:'#D4AF37'}} />
                            <div style={{width:34,height:34,borderRadius:'9px',background:checked?'#D4AF3715':'#f8fafc',color:checked?'#D4AF37':'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center'}}><i className={`fas ${sec.icon||'fa-layer-group'}`} /></div>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:800,fontSize:'0.82rem',color:'#1e293b'}}>{sec.name}</div>
                              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginTop:'2px'}}>{isUniversal ? '🌐 Universal — always inherited' : ''}</div>
                            </div>
                            {checked && <i className="fas fa-check-circle" style={{color:'#D4AF37'}} />}
                          </div>
                          {checked && (
                            <div style={{background:'#fafbfc',borderTop:'1px solid #f1f5f9',padding:'0.65rem 1.4rem 0.8rem 3.5rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                              <div>
                                <label style={{...css.label(),fontSize:'0.5rem',marginBottom:'0.2rem'}}>Required Override</label>
                                <select value={requiredOverride} onChange={e => handleOverride('required_override',e.target.value)} style={{...css.input(),padding:'0.4rem 0.75rem',fontSize:'0.72rem'}}>
                                  <option value="default">Default ({sec.required ? 'Required' : 'Optional'})</option>
                                  <option value="required">Force Required</option>
                                  <option value="optional">Force Optional</option>
                                </select>
                              </div>
                              <div style={{display:'flex',alignItems:'center'}}>
                                <label style={{display:'flex',alignItems:'center',gap:'0.4rem',cursor:'pointer',fontSize:'0.72rem',fontWeight:800,color:'#475569',marginTop:'1.2rem'}}>
                                  <input type="checkbox" checked={!!typologyRules.order_locked} onChange={e => handleOverride('order_locked',e.target.checked)} style={{accentColor:'#D4AF37'}} />
                                  Lock Layout Order
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={saveAssignments} disabled={saving} style={{...css.btn('#10b981'),width:'100%'}}>
                    {saving ? 'Saving…' : <><i className="fas fa-save" style={{marginRight:'0.5rem'}} />Save Assignments</>}
                  </button>
                </>
              )}
              {!selectedType && (
                <div style={{textAlign:'center',padding:'4rem',background:'#fff',borderRadius:'20px',border:'2px dashed #e2e8f0'}}>
                  <i className="fas fa-sitemap fa-2x" style={{color:'#e2e8f0',marginBottom:'1rem',display:'block'}} />
                  <p style={{color:'#94a3b8',fontWeight:700}}>Select a category or typology above to manage assignments.</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: TOPOLOGY MAP ─────────────────────────────────────── */}
          {activeTab === 'topology' && (
            <div style={{padding:'2.5rem',maxWidth:'760px'}}>
              <h2 style={{margin:'0 0 0.25rem',fontSize:'1.2rem',fontWeight:900,color:'#1e293b'}}>Topology Map</h2>
              <p style={{color:'#94a3b8',fontSize:'0.78rem',marginBottom:'2rem'}}>
                Shows which categories and typologies currently use <strong>{currentSection?.name}</strong>. Any flag change from the Settings tab applies to ALL of them immediately.
              </p>

              {/* Section flag quick-apply panel */}
              <div style={{background:'#fff',borderRadius:'20px',border:'1.5px solid #e2e8f0',overflow:'hidden',marginBottom:'2rem'}}>
                <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:'0.75rem',background:'linear-gradient(135deg,#fafbfd,#fff)'}}>
                  <i className="fas fa-broadcast-tower" style={{color:'#D4AF37'}} />
                  <span style={{fontWeight:900,fontSize:'0.85rem',color:'#1e293b'}}>Propagate Flag Changes</span>
                  <span style={{fontSize:'0.62rem',color:'#94a3b8',fontWeight:700}}>These buttons update the section flag globally — all {topologyMap.length} typologies using it will reflect the change instantly.</span>
                </div>
                <div style={{padding:'1.5rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  {[
                    { flag:'show_on_minisite' as keyof Section, label:'Show on Minisite', on:true, icon:'fa-store', color:'#10b981' },
                    { flag:'show_on_minisite' as keyof Section, label:'Hide from Minisite', on:false, icon:'fa-store-slash', color:'#ef4444' },
                    { flag:'vendor_editable'  as keyof Section, label:'Allow Vendor Edit', on:true, icon:'fa-user-edit', color:'#8b5cf6' },
                    { flag:'vendor_editable'  as keyof Section, label:'Lock from Vendors', on:false, icon:'fa-lock', color:'#f59e0b' },
                    { flag:'show_on_public'   as keyof Section, label:'Make Public', on:true, icon:'fa-globe', color:'#3b82f6' },
                    { flag:'show_on_public'   as keyof Section, label:'Hide from Public', on:false, icon:'fa-eye-slash', color:'#64748b' },
                    { flag:'required'         as keyof Section, label:'Mark Required', on:true, icon:'fa-asterisk', color:'#ef4444' },
                    { flag:'required'         as keyof Section, label:'Make Optional', on:false, icon:'fa-minus', color:'#94a3b8' },
                  ].map(({ flag, label, on, icon, color }) => (
                    <button key={`${flag}-${on}`} onClick={() => propagateToChildren(flag, on)} disabled={saving} style={{ padding:'0.75rem 1rem', borderRadius:'12px', border:`1.5px solid ${color}30`, background:`${color}08`, color, fontWeight:800, fontSize:'0.72rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.6rem', transition:'all 0.2s' }}>
                      <i className={`fas ${icon}`} style={{flexShrink:0}} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topology tree */}
              <div style={{background:'#fff',borderRadius:'20px',border:'1.5px solid #e2e8f0',overflow:'hidden'}}>
                <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid #f1f5f9',background:'#fafbfd'}}>
                  <span style={{fontWeight:900,fontSize:'0.85rem',color:'#1e293b'}}>{topologyMap.length} typologies use this section</span>
                </div>
                {topologyMap.length === 0 ? (
                  <div style={{padding:'3rem',textAlign:'center',color:'#94a3b8',fontSize:'0.8rem'}}>
                    <i className="fas fa-project-diagram fa-2x" style={{color:'#e2e8f0',display:'block',marginBottom:'1rem'}} />
                    This section is not assigned to any typology yet. Go to the Assign tab to add it.
                  </div>
                ) : (
                  <div style={{padding:'1rem'}}>
                    {topologyMap.map(t => {
                      const parentOfThis = businessTypes.find(p => p.id === businessTypes.find(bt => bt.id === t.id)?.parent_id);
                      return (
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',borderRadius:'10px',border:'1px solid #f1f5f9',marginBottom:'0.4rem',background:'#fafbfd'}}>
                          <div style={{width:34,height:34,borderRadius:'9px',background:t.icon_color?`${t.icon_color}20`:'#D4AF3720',color:t.icon_color||'#D4AF37',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',flexShrink:0}}>
                            <i className={`fas ${t.icon||'fa-building'}`} />
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:800,fontSize:'0.82rem',color:'#1e293b'}}>{t.name}</div>
                            {parentOfThis && <div style={{fontSize:'0.6rem',color:'#94a3b8',marginTop:'2px'}}>↳ Child of {parentOfThis.name}</div>}
                          </div>
                          <span style={{fontSize:'0.6rem',fontWeight:900,padding:'3px 8px',borderRadius:'6px',background:t.is_parent?'#dbeafe':'#dcfce7',color:t.is_parent?'#1d4ed8':'#166534'}}>
                            {t.is_parent ? 'CATEGORY' : 'TYPOLOGY'}
                          </span>
                          <button onClick={() => { setSelectedType(t.id); selectType(t.id); setActiveTab('assign'); }} style={{border:'1px solid #e2e8f0',background:'#fff',borderRadius:'8px',padding:'0.35rem 0.75rem',cursor:'pointer',fontSize:'0.65rem',fontWeight:800,color:'#64748b'}}>
                            Manage →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section flags at-a-glance */}
              {currentSection && (
                <div style={{background:'#fff',borderRadius:'20px',border:'1.5px solid #e2e8f0',marginTop:'2rem',overflow:'hidden'}}>
                  <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid #f1f5f9',background:'#fafbfd',fontWeight:900,fontSize:'0.85rem',color:'#1e293b'}}>Current Section Flags</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
                    {[
                      { label:'Active',       val:currentSection.active,          color:'#10b981' },
                      { label:'Universal',    val:currentSection.is_universal,    color:'#3b82f6' },
                      { label:'Vend. Edit',   val:currentSection.vendor_editable, color:'#8b5cf6' },
                      { label:'Required',     val:currentSection.required,        color:'#ef4444' },
                      { label:'Public',       val:currentSection.show_on_public,  color:'#ec4899' },
                      { label:'Minisite',     val:currentSection.show_on_minisite,color:'#0f766e' },
                      { label:'Gallery',      val:currentSection.enable_gallery,  color:'#6366f1' },
                      { label:'Blog/Story',   val:currentSection.enable_blog,     color:'#f59e0b' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{padding:'0.9rem 1rem',borderBottom:'1px solid #f8fafc',borderRight:'1px solid #f8fafc',textAlign:'center'}}>
                        <div style={{fontSize:'0.6rem',color:'#94a3b8',fontWeight:700,marginBottom:'0.35rem'}}>{label}</div>
                        <div style={{fontWeight:900,color:val?color:'#cbd5e1',fontSize:'0.9rem'}}>{val?'✓ ON':'✕ OFF'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
