'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import TagInput from '@/components/TagInput';

const FIELD_TYPES = [
  { id: 'text',        label: 'Short Text',   icon: 'fa-font',               color: '#3b82f6' },
  { id: 'textarea',   label: 'Long Text',    icon: 'fa-align-left',         color: '#6366f1' },
  { id: 'rich_text',  label: 'Storyteller',  icon: 'fa-book-open',          color: '#8b5cf6' },
  { id: 'select',     label: 'Dropdown',     icon: 'fa-chevron-circle-down', color: '#0ea5e9' },
  { id: 'multiselect',label: 'Multi-Select', icon: 'fa-tasks',              color: '#06b6d4' },
  { id: 'boolean',    label: 'Toggle',       icon: 'fa-toggle-on',          color: '#10b981' },
  { id: 'gallery',    label: 'Gallery',      icon: 'fa-images',             color: '#D4AF37' },
  { id: 'map',        label: 'Map Location', icon: 'fa-map-marked-alt',     color: '#ef4444' },
  { id: 'youtube',    label: 'YouTube',      icon: 'fa-youtube',            color: '#dc2626' },
  { id: 'star_rating',label: 'Star Rating',  icon: 'fa-star',               color: '#f59e0b' },
];

const SECTION_ICONS = [
  'fa-info-circle','fa-map-marker-alt','fa-images','fa-book-open','fa-star',
  'fa-utensils','fa-bed','fa-hiking','fa-gem','fa-leaf','fa-chart-line',
  'fa-handshake','fa-users','fa-landmark','fa-palette','fa-music',
  'fa-shopping-bag','fa-compass','fa-sun','fa-moon','fa-seedling',
  'fa-fish','fa-horse','fa-camera','fa-scroll','fa-coins',
];

interface SchemaBuilderProps {
  onTypologySelected: (typeId: string, typeName: string) => void;
  selectedTypeId: string | null;
}

export default function SchemaBuilder({ onTypologySelected, selectedTypeId }: SchemaBuilderProps) {
  const { notify } = useAdmin();

  // Data — type hierarchy
  const [types, setTypes]           = useState<any[]>([]);
  const [selectedTypeName, setSelectedTypeName] = useState<string>('');
  const [sections, setSections]     = useState<any[]>([]);
  const [fields, setFields]         = useState<Record<string, any[]>>({});
  const [loadingTypes, setLoadingTypes] = useState(true);

  // UI State
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [addingSection, setAddingSection]     = useState(false);
  const [savingSection, setSavingSection]     = useState(false);
  const [newSection, setNewSection]           = useState({ name: '', icon: 'fa-info-circle', is_universal: false, required: false });

  // Section editing state
  const [editingSection, setEditingSection]       = useState<string | null>(null);
  const [editSectionData, setEditSectionData]     = useState<any>(null);
  const [savingEditSection, setSavingEditSection] = useState(false);
  const [deletingSection, setDeletingSection]     = useState<string | null>(null);

  const [addingField, setAddingField]         = useState<string | null>(null);
  const [newField, setNewField]               = useState({ label: '', field_type: 'text', required: false, vendor_editable: true, options: [] as string[] });
  const [inspectingField, setInspectingField] = useState<any | null>(null);
  const [saving, setSaving]                   = useState(false);

  // ── Load all business types (hierarchy) ──
  useEffect(() => {
    setLoadingTypes(true);
    fetch('/api/jana/types')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTypes(data);
          // Auto-expand all parents
          const expanded: Record<string, boolean> = {};
          data.filter((t: any) => t.is_parent || Number(t.is_parent) === 1).forEach((t: any) => { expanded[t.id] = true; });
          setExpandedParents(expanded);
        }
      })
      .catch(() => setTypes([]))
      .finally(() => setLoadingTypes(false));
  }, []);

  useEffect(() => {
    if (!selectedTypeId) { setSections([]); setFields({}); return; }
    loadSections(selectedTypeId);
  }, [selectedTypeId]);

  async function loadSections(typeId: string) {
    try {
      const res = await fetch(`/api/jana/sections?type=${typeId}`);
      if (res.ok) {
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);

        const fr = await fetch('/api/jana/forms?type=SECTION_TEMPLATE');
        const map: Record<string, any[]> = {};
        (Array.isArray(data) ? data : []).forEach((s: any) => { map[s.id] = []; });
        if (fr.ok) {
          const allFields = await fr.json();
          if (Array.isArray(allFields)) {
            allFields.forEach((field: any) => {
              if (map[field.section_id]) map[field.section_id].push(field);
            });
          }
        }
        setFields(map);
      }
    } catch (e) { console.error(e); }
  }

  // ── Select a type from hierarchy ──
  function selectType(type: any) {
    setSelectedTypeName(type.name);
    onTypologySelected(type.id, type.name);
  }

  // Helpers for hierarchy
  const parents = types.filter((t: any) => t.is_parent || Number(t.is_parent) === 1);
  const childrenOf = (parentId: string) => types.filter((t: any) => t.parent_id === parentId);
  // Types with no parent and not a parent themselves (standalone leaves)
  const standaloneTypes = types.filter((t: any) => !t.parent_id && !(t.is_parent || Number(t.is_parent) === 1));

  // ── Create section + attach to type ──
  async function saveNewSection() {
    if (!newSection.name.trim()) { notify('Section name is required', 'error'); return; }
    if (!selectedTypeId) { notify('Select a business first', 'error'); return; }
    setSavingSection(true);
    const sectionId = 'sec_' + Date.now();
    try {
      const res = await fetch('/api/jana/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sectionId,
          name: newSection.name,
          icon: newSection.icon,
          is_universal: newSection.is_universal,
          required: newSection.required,
          vendor_editable: true,
          show_on_public: true,
          sort_order: sections.length + 1,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }

      const typeRes = await fetch(`/api/jana/types?id=${selectedTypeId}`);
      if (typeRes.ok) {
        const typeData = await typeRes.json();
        const existing = typeof typeData.own_sections === 'string'
          ? JSON.parse(typeData.own_sections || '[]')
          : (typeData.own_sections || []);
        await fetch('/api/jana/types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedTypeId, own_sections: [...existing, sectionId] }),
        });
      }

      notify(`Section "${newSection.name}" created!`, 'success');
      setAddingSection(false);
      setNewSection({ name: '', icon: 'fa-info-circle', is_universal: false, required: false });
      loadSections(selectedTypeId);
    } catch (e: any) { notify(e.message || 'Failed to create section', 'error'); }
    setSavingSection(false);
  }

  // ── Remove a section from this type's assignment ──
  async function removeSectionFromType(sectionId: string) {
    if (!selectedTypeId) return;
    setSaving(true);
    try {
      const typeRes = await fetch(`/api/jana/types?id=${selectedTypeId}`);
      if (!typeRes.ok) throw new Error('Failed to load type');
      const typeData = await typeRes.json();
      const existingOwn: string[] = typeof typeData.own_sections === 'string'
        ? JSON.parse(typeData.own_sections || '[]')
        : (typeData.own_sections || []);
      const existingAll: string[] = typeof typeData.sections === 'string'
        ? JSON.parse(typeData.sections || '[]')
        : (typeData.sections || []);

      // Remove from whichever list it's in
      const newOwn = existingOwn.filter((id: string) => id !== sectionId);
      const newAll = existingAll.filter((id: string) => id !== sectionId);

      await fetch('/api/jana/types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTypeId, own_sections: newOwn, sections: newAll }),
      });

      notify('Section removed from this business type', 'success');
      setDeletingSection(null);
      loadSections(selectedTypeId);
    } catch (e: any) { notify(e.message || 'Remove failed', 'error'); }
    setSaving(false);
  }

  // ── Update section settings ──
  async function updateSection() {
    if (!editSectionData?.id) return;
    if (!editSectionData.name?.trim()) { notify('Section name is required', 'error'); return; }
    setSavingEditSection(true);
    try {
      const res = await fetch('/api/jana/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSectionData),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Save failed'); }
      notify(`Section "${editSectionData.name}" updated!`, 'success');
      setEditingSection(null);
      setEditSectionData(null);
      if (selectedTypeId) loadSections(selectedTypeId);
    } catch (e: any) { notify(e.message || 'Update failed', 'error'); }
    setSavingEditSection(false);
  }

  // ── Field CRUD ──
  async function saveNewField(sectionId: string) {
    if (!newField.label.trim()) { notify('Field label is required', 'error'); return; }
    setSaving(true);
    const name = newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    try {
      const res = await fetch('/api/jana/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type_id: 'SECTION_TEMPLATE',
          section_id: sectionId,
          name,
          label: newField.label,
          field_type: newField.field_type,
          required: newField.required,
          vendor_editable: newField.vendor_editable,
          options: newField.options.length ? newField.options : null,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      notify('Field added to section blueprint!', 'success');
      setAddingField(null);
      setNewField({ label: '', field_type: 'text', required: false, vendor_editable: true, options: [] });
      loadSections(selectedTypeId!);
    } catch (e: any) { notify(e.message || 'Failed to add field', 'error'); }
    setSaving(false);
  }

  async function updateField() {
    if (!inspectingField) return;
    setSaving(true);
    try {
      await fetch('/api/jana/forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectingField),
      });
      notify('Field updated!', 'success');
      setInspectingField(null);
      loadSections(selectedTypeId!);
    } catch (e: any) { notify(e.message || 'Update failed', 'error'); }
    setSaving(false);
  }

  async function deleteField(fieldId: string) {
    if (!confirm('Delete this field permanently?')) return;
    try {
      await fetch(`/api/jana/forms?id=${fieldId}`, { method: 'DELETE' });
      notify('Field removed from blueprint', 'success');
      setInspectingField(null);
      loadSections(selectedTypeId!);
    } catch (e) { notify('Delete failed', 'error'); }
  }


  const accentColor = '#D4AF37';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── DELETE SECTION CONFIRM MODAL ── */}
      {deletingSection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Remove Section?</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
              This will <strong>unassign</strong> this section from{' '}
              <strong>{selectedTypeName || 'this business type'}</strong>.<br />
              The section itself is not deleted — it can be re-assigned later.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
              <button onClick={() => setDeletingSection(null)}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => removeSectionFromType(deletingSection)} disabled={saving}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                {saving ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1A — TYPOLOGY HIERARCHY ── */}
      <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
            <i className="fas fa-layer-group"></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>Step 1A — Select Business Category</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Choose a typology from the hierarchy created in the Typology Architect</div>
          </div>
          {selectedTypeId && (
            <button onClick={() => { setSelectedTypeName(''); onTypologySelected('', ''); setSections([]); }}
              style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '0.4rem 0.9rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {loadingTypes ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Loading typologies…
          </div>
        ) : types.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
            <i className="fas fa-sitemap fa-2x" style={{ display: 'block', marginBottom: '0.75rem', color: '#e2e8f0' }}></i>
            No business types found. Create them first in the Typology Architect.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

            {/* Parent groups with children */}
            {parents.map(parent => {
              const children = childrenOf(parent.id);
              const isOpen = !!expandedParents[parent.id];
              const parentSelected = selectedTypeId === parent.id;
              return (
                <div key={parent.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                  {/* Parent row — clickable to expand/collapse AND to select */}
                  <div style={{ display: 'flex', alignItems: 'center', background: parentSelected ? `${accentColor}10` : '#f8fafc', borderBottom: isOpen && children.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <button
                      onClick={() => selectType(parent)}
                      style={{
                        flex: 1, textAlign: 'left', padding: '0.9rem 1.25rem',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
                        background: parentSelected ? accentColor : (parent.icon_color ? `${parent.icon_color}18` : '#e2e8f0'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: parentSelected ? '#fff' : (parent.icon_color || '#64748b'), fontSize: '0.9rem',
                      }}>
                        <i className={`fas ${parent.icon || 'fa-folder'}`}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '0.88rem', color: parentSelected ? '#0f172a' : '#1e293b' }}>{parent.name}</div>
                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: '1px' }}>
                          CATEGORY · {children.length} subcategor{children.length === 1 ? 'y' : 'ies'}
                        </div>
                      </div>
                      {parentSelected && <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: accentColor, fontSize: '1rem' }}></i>}
                    </button>
                    {/* Collapse/expand toggle */}
                    {children.length > 0 && (
                      <button
                        onClick={() => setExpandedParents(prev => ({ ...prev, [parent.id]: !isOpen }))}
                        style={{ padding: '0.9rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem' }}
                      >
                        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
                      </button>
                    )}
                  </div>

                  {/* Children */}
                  {isOpen && children.map(child => {
                    const isSelected = selectedTypeId === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => selectType(child)}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '0.75rem 1.25rem 0.75rem 3rem',
                          background: isSelected ? `${accentColor}10` : '#fff',
                          border: 'none', borderTop: '1px solid #f8fafc',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                          background: isSelected ? accentColor : (child.icon_color ? `${child.icon_color}15` : '#f1f5f9'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? '#fff' : (child.icon_color || '#94a3b8'), fontSize: '0.75rem',
                        }}>
                          <i className={`fas ${child.icon || 'fa-tag'}`}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? '#0f172a' : '#475569' }}>{child.name}</div>
                          <div style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700 }}>SUBCATEGORY</div>
                        </div>
                        {isSelected && <i className="fas fa-check-circle" style={{ color: accentColor, fontSize: '0.9rem', flexShrink: 0 }}></i>}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Standalone types (no parent, not a parent) */}
            {standaloneTypes.length > 0 && (
              <div style={{ marginTop: parents.length > 0 ? '0.25rem' : 0 }}>
                {parents.length > 0 && (
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', padding: '0.5rem 0.25rem', marginTop: '0.25rem' }}>STANDALONE TYPES</div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                  {standaloneTypes.map(type => {
                    const isSelected = selectedTypeId === type.id;
                    return (
                      <button key={type.id} onClick={() => selectType(type)} style={{
                        padding: '0.85rem 1rem', borderRadius: '12px',
                        border: isSelected ? `2px solid ${accentColor}` : '1.5px solid #e2e8f0',
                        background: isSelected ? `${accentColor}10` : '#f8fafc',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                      }}>
                        <i className={`fas ${type.icon || 'fa-building'}`} style={{ fontSize: '1rem', color: isSelected ? accentColor : (type.icon_color || '#94a3b8'), flexShrink: 0 }}></i>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isSelected ? '#0f172a' : '#475569' }}>{type.name}</div>
                        </div>
                        {isSelected && <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: accentColor, flexShrink: 0 }}></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STEP 1B — SECTIONS ── */}
      {selectedTypeId && (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <i className="fas fa-cubes"></i>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>Step 1B — Define Sections</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {sections.length} section{sections.length !== 1 ? 's' : ''} for{' '}
                  <strong style={{ color: '#1e293b' }}>{selectedTypeName}</strong>
                </div>
              </div>
            </div>
            <button onClick={() => setAddingSection(true)} style={{
              background: '#1e293b', color: '#fff', border: 'none', padding: '0.6rem 1.25rem',
              borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <i className="fas fa-plus"></i> ADD SECTION
            </button>
          </div>

          {/* New Section Form */}
          {addingSection && (
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>SECTION NAME *</label>
                  <input className="form-control" placeholder="e.g. Heritage Story" value={newSection.name}
                    onChange={e => setNewSection({ ...newSection, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>ICON</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '80px', overflowY: 'auto', padding: '0.5rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {SECTION_ICONS.map(icon => (
                      <button key={icon} type="button" onClick={() => setNewSection({ ...newSection, icon })} style={{
                        width: 30, height: 30, border: newSection.icon === icon ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                        borderRadius: '6px', background: newSection.icon === icon ? '#fef3c7' : '#f8fafc', cursor: 'pointer',
                      }}>
                        <i className={`fas ${icon}`} style={{ fontSize: '0.75rem', color: newSection.icon === icon ? '#D4AF37' : '#94a3b8' }}></i>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newSection.is_universal} onChange={e => setNewSection({ ...newSection, is_universal: e.target.checked })} />
                  Universal (all businesses)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newSection.required} onChange={e => setNewSection({ ...newSection, required: e.target.checked })} />
                  Required
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={saveNewSection} disabled={savingSection} style={{ background: '#D4AF37', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}>
                  {savingSection ? <><i className="fas fa-spinner fa-spin"></i> SAVING...</> : <><i className="fas fa-save"></i> CREATE SECTION</>}
                </button>
                <button onClick={() => setAddingSection(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}>CANCEL</button>
              </div>
            </div>
          )}

          {/* Sections List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sections.map(section => {
              const sectionFields = fields[section.id] || [];
              const isExpanded = expandedSection === section.id;
              return (
                <div key={section.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Section Header */}
                  <div style={{ padding: '1.25rem 1.5rem', background: isExpanded ? '#1e293b' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                    {/* Left — clickable to expand */}
                    <div onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer', minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: isExpanded ? 'rgba(212,175,55,0.2)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', flexShrink: 0 }}>
                        <i className={`fas ${section.icon || 'fa-layer-group'}`}></i>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isExpanded ? '#fff' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{section.name}</div>
                        <div style={{ fontSize: '0.6rem', color: isExpanded ? '#94a3b8' : '#64748b', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {sectionFields.length} fields
                          {section.is_universal && <span style={{ background: '#D4AF3720', color: '#D4AF37', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>UNIVERSAL</span>}
                          {section.required && <span style={{ background: '#ef444420', color: '#ef4444', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>REQUIRED</span>}
                        </div>
                      </div>
                    </div>
                    {/* Right — action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {/* ✏️ Edit */}
                      <button
                        type="button"
                        title="Edit section settings"
                        onClick={e => {
                          e.stopPropagation();
                          if (editingSection === section.id) {
                            setEditingSection(null); setEditSectionData(null);
                          } else {
                            setEditingSection(section.id);
                            setEditSectionData({ ...section });
                            setExpandedSection(section.id);
                          }
                        }}
                        style={{
                          background: editingSection === section.id ? '#D4AF37' : (isExpanded ? 'rgba(255,255,255,0.12)' : '#e9eef4'),
                          border: 'none',
                          color: editingSection === section.id ? '#fff' : (isExpanded ? '#D4AF37' : '#64748b'),
                          width: 32, height: 32, borderRadius: '8px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        <i className="fas fa-pen" />
                      </button>
                      {/* 🗑️ Delete (remove from type) */}
                      <button
                        type="button"
                        title="Remove section from this business type"
                        onClick={e => { e.stopPropagation(); setDeletingSection(section.id); }}
                        style={{
                          background: isExpanded ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                          border: 'none',
                          color: '#ef4444',
                          width: 32, height: 32, borderRadius: '8px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                      <i
                        onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                        style={{ color: isExpanded ? '#D4AF37' : '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem' }}
                      ></i>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div style={{ padding: '1.5rem', background: '#fff' }}>

                      {/* ── INLINE SECTION EDITOR ── */}
                      {editingSection === section.id && editSectionData && (
                        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#fef9ee', borderRadius: '16px', border: '2px solid #D4AF3740' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', marginBottom: '1rem' }}>✏️ EDIT SECTION SETTINGS</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>SECTION NAME *</label>
                              <input className="form-control" value={editSectionData.name || ''} onChange={e => setEditSectionData({ ...editSectionData, name: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>ICON</label>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '80px', overflowY: 'auto', padding: '0.5rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                {SECTION_ICONS.map(icon => (
                                  <button key={icon} type="button" onClick={() => setEditSectionData({ ...editSectionData, icon })} style={{
                                    width: 30, height: 30, border: editSectionData.icon === icon ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                                    borderRadius: '6px', background: editSectionData.icon === icon ? '#fef3c7' : '#f8fafc', cursor: 'pointer',
                                  }}>
                                    <i className={`fas ${icon}`} style={{ fontSize: '0.75rem', color: editSectionData.icon === icon ? '#D4AF37' : '#94a3b8' }}></i>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {[
                              { key: 'is_universal',   label: 'Universal (all businesses)' },
                              { key: 'required',        label: 'Required' },
                              { key: 'enable_gallery',  label: 'Gallery Enabled' },
                              { key: 'enable_blog',     label: 'Blog Enabled' },
                              { key: 'vendor_editable', label: 'Vendor Editable' },
                              { key: 'show_on_public',  label: 'Public Visible' },
                            ].map(({ key, label }) => (
                              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                                <input type="checkbox" checked={!!editSectionData[key]} onChange={e => setEditSectionData({ ...editSectionData, [key]: e.target.checked })} />
                                {label}
                              </label>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="button" onClick={updateSection} disabled={savingEditSection} style={{ background: '#D4AF37', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>
                              {savingEditSection ? <><i className="fas fa-spinner fa-spin"></i> SAVING...</> : <><i className="fas fa-save"></i> SAVE SECTION</>}
                            </button>
                            <button type="button" onClick={() => { setEditingSection(null); setEditSectionData(null); }} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>CANCEL</button>
                          </div>
                        </div>
                      )}

                      {/* Field Blueprint header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>STEP 1C — FIELD BLUEPRINT</div>
                        <button onClick={() => { setAddingField(section.id); setInspectingField(null); }} style={{
                          background: '#f8fafc', color: '#1e293b', border: '1.5px solid #e2e8f0', padding: '0.4rem 0.9rem',
                          borderRadius: '8px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer',
                        }}>
                          <i className="fas fa-plus" style={{ marginRight: '4px' }}></i> ADD FIELD
                        </button>
                      </div>

                      {/* Existing Fields */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {sectionFields.map((f: any) => {
                          const ft = FIELD_TYPES.find(t => t.id === f.field_type);
                          const isInspecting = inspectingField?.id === f.id;
                          return (
                            <div key={f.id}>
                              <div onClick={() => { setInspectingField(isInspecting ? null : f); setAddingField(null); }}
                                style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', border: isInspecting ? '2px solid #3b82f6' : '1px solid #f1f5f9', background: isInspecting ? '#eff6ff' : '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <i className={`fas ${ft?.icon || 'fa-cube'}`} style={{ color: ft?.color || '#94a3b8', width: 16 }}></i>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{f.label}</div>
                                    <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{(f.field_type || '').toUpperCase()} {f.required ? '• REQUIRED' : ''} {f.vendor_editable ? '• VENDOR EDITABLE' : ''}</div>
                                  </div>
                                </div>
                                <i className={`fas fa-chevron-${isInspecting ? 'up' : 'right'}`} style={{ color: '#cbd5e1', fontSize: '0.7rem' }}></i>
                              </div>

                              {/* Inline Field Inspector */}
                              {isInspecting && (
                                <div style={{ margin: '0.5rem 0', padding: '1.5rem', background: '#eff6ff', borderRadius: '12px', border: '1.5px solid #bfdbfe' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                      <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>LABEL</label>
                                      <input className="form-control" value={inspectingField.label} onChange={e => setInspectingField({ ...inspectingField, label: e.target.value })} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>HELP TEXT</label>
                                      <input className="form-control" placeholder="Guidance for vendors..." value={inspectingField.help_text || ''} onChange={e => setInspectingField({ ...inspectingField, help_text: e.target.value })} />
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={!!inspectingField.required} onChange={e => setInspectingField({ ...inspectingField, required: e.target.checked })} /> Required
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={!!inspectingField.vendor_editable} onChange={e => setInspectingField({ ...inspectingField, vendor_editable: e.target.checked })} /> Vendor Editable
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={!!inspectingField.searchable} onChange={e => setInspectingField({ ...inspectingField, searchable: e.target.checked })} /> Searchable/Filter
                                    </label>
                                  </div>
                                  {['select', 'multiselect', 'checkbox_group'].includes(inspectingField.field_type) && (
                                    <div style={{ marginBottom: '1rem' }}>
                                      <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>OPTIONS (press Enter to add)</label>
                                      <TagInput value={Array.isArray(inspectingField.options) ? inspectingField.options : []} onChange={tags => setInspectingField({ ...inspectingField, options: tags })} />
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={updateField} disabled={saving} style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>
                                      {saving ? 'SAVING...' : 'APPLY CHANGES'}
                                    </button>
                                    <button onClick={() => deleteField(f.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                    <button onClick={() => setInspectingField(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>CANCEL</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add New Field Form */}
                      {addingField === section.id && (
                        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>FIELD LABEL *</label>
                              <input className="form-control" placeholder="e.g. Price Range" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} />
                            </div>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>FIELD TYPE</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                              {FIELD_TYPES.map(ft => (
                                <button key={ft.id} onClick={() => setNewField({ ...newField, field_type: ft.id })} style={{
                                  padding: '0.6rem', borderRadius: '10px', border: newField.field_type === ft.id ? `2px solid ${ft.color}` : '1.5px solid #e2e8f0',
                                  background: newField.field_type === ft.id ? `${ft.color}10` : '#fff', cursor: 'pointer', textAlign: 'center',
                                }}>
                                  <i className={`fas ${ft.icon}`} style={{ color: ft.color, display: 'block', marginBottom: '3px', fontSize: '0.9rem' }}></i>
                                  <div style={{ fontSize: '0.55rem', fontWeight: 800, color: newField.field_type === ft.id ? '#1e293b' : '#94a3b8' }}>{ft.label}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          {['select', 'multiselect', 'checkbox_group'].includes(newField.field_type) && (
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>OPTIONS</label>
                              <TagInput value={newField.options} onChange={tags => setNewField({ ...newField, options: tags })} />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              <input type="checkbox" checked={newField.required} onChange={e => setNewField({ ...newField, required: e.target.checked })} /> Required
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              <input type="checkbox" checked={newField.vendor_editable} onChange={e => setNewField({ ...newField, vendor_editable: e.target.checked })} /> Vendor Editable
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => saveNewField(section.id)} disabled={saving} style={{ background: '#D4AF37', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>
                              {saving ? 'SAVING...' : 'ADD TO BLUEPRINT'}
                            </button>
                            <button onClick={() => setAddingField(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>CANCEL</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {sections.length === 0 && !addingSection && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', border: '2px dashed #f1f5f9', borderRadius: '16px' }}>
                <i className="fas fa-cubes fa-2x" style={{ marginBottom: '1rem', color: '#e2e8f0' }}></i>
                <div style={{ fontWeight: 700 }}>No sections defined yet</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Click "ADD SECTION" to define the first chapter of this business's DNA</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
