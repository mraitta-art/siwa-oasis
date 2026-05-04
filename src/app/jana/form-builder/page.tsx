'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * MASTER FORM ARCHITECT (PREMIUM v5.0)
 * The definitive engine for Siwa Oasis Governance.
 */

interface Field {
  id: string; name: string; label: string; field_type: string;
  section_id: string; business_type_id: string; required: boolean;
  vendor_editable: boolean; options?: any; help_text?: string;
  placeholder?: string; sort_order: number; acl?: any;
  validation?: any; is_searchable?: boolean; is_inherited?: boolean;
}

interface Section { id: string; name: string; icon: string; fields: Field[]; }

interface BusinessType { id: string; name: string; icon: string; is_parent: boolean; parent_id?: string; icon_color?: string; }

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: 'fa-font', color: '#3b82f6' },
  { value: 'textarea', label: 'Long Narrative', icon: 'fa-align-left', color: '#8b5cf6' },
  { value: 'number', label: 'Numeric Value', icon: 'fa-hashtag', color: '#10b981' },
  { value: 'select', label: 'Dropdown List', icon: 'fa-list-ul', color: '#f59e0b' },
  { value: 'gallery', label: 'Media Gallery', icon: 'fa-images', color: '#ec4899' },
  { value: 'checkbox', label: 'Binary Toggle', icon: 'fa-check-square', color: '#06b6d4' },
];

export default function FormArchitectPage() {
  const { notify } = useAdmin();
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [currentType, setCurrentType] = useState<BusinessType | null>(null);
  const [parentType, setParentType] = useState<BusinessType | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const [editingField, setEditingField] = useState<Partial<Field> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'section' | 'full'>('section');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/jana/types'),
        fetch('/api/jana/sections')
      ]);
      const typeList = await tRes.json();
      setTypes(Array.isArray(typeList) ? typeList : []);
      if (Array.isArray(typeList) && typeList.length > 0) setSelectedType(typeList[0].id);

      const sectList = await sRes.json();
      setSections(Array.isArray(sectList) ? sectList.map((s: any) => ({ ...s, fields: [] })) : []);
      if (Array.isArray(sectList) && sectList.length > 0) setActiveSection(sectList[0].id);
    } catch (e) { 
      console.error('Sync Error:', e);
      notify('System Sync Failed: Check Database Connection', 'error'); 
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedType) {
      loadFields();
      const type = types.find(t => t.id === selectedType);
      setCurrentType(type || null);
      if (type?.parent_id) {
        setParentType(types.find(t => t.id === type.parent_id) || null);
      } else if (type?.is_parent) {
        setParentType(type);
      } else {
        setParentType(null);
      }
    }
  }, [selectedType, types]);

  async function loadFields() {
    try {
      const res = await fetch(`/api/jana/forms?type=${selectedType}`);
      const fields = await res.json();
      const fieldsBySection: any = {};
      fields.forEach((f: any) => {
        if (!fieldsBySection[f.section_id]) fieldsBySection[f.section_id] = [];
        fieldsBySection[f.section_id].push(f);
      });
      setSections(prev => prev.map(s => ({ ...s, fields: fieldsBySection[s.id] || [] })));
    } catch (e) { console.error(e); }
  }

  const handleAddField = (sectionId: string) => {
    setEditingField({
      section_id: sectionId,
      business_type_id: selectedType,
      field_type: 'text',
      label: 'New DNA Field',
      name: `field_${Date.now()}`,
      sort_order: 99,
      required: false,
      vendor_editable: true
    });
  };

  const handlePreWireNarrative = async (sectionId: string) => {
    const narrativeFields = [
      { name: 'mini_blog', label: 'Section Narrative (Mini-Blog)', field_type: 'textarea', sort_order: 0 },
      { name: 'section_gallery', label: 'Visual Gallery', field_type: 'gallery', sort_order: 1 },
      { name: 'youtube_story', label: 'YouTube Cinematic Story', field_type: 'text', sort_order: 2 }
    ];

    setSaving(true);
    try {
      for (const field of narrativeFields) {
        const exists = sections.find(s => s.id === sectionId)?.fields.some(f => f.name === field.name);
        if (exists) continue;

        await fetch('/api/jana/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...field, section_id: sectionId, business_type_id: selectedType, required: false, vendor_editable: true })
        });
      }
      notify('System Pre-Wired!', 'success');
      loadFields();
    } catch (e) { notify('Wiring Failed', 'error'); }
    setSaving(false);
  };

  async function saveField() {
    if (!editingField) return;
    setSaving(true);
    try {
      const method = editingField.id ? 'PUT' : 'POST';
      const res = await fetch('/api/jana/forms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingField)
      });
      if (res.ok) {
        notify('DNA Pattern Saved', 'success');
        setEditingField(null);
        loadFields();
      }
    } catch (e) { notify('Architectural Breach', 'error'); }
    setSaving(false);
  }

  async function deleteField(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/forms?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Field Purged', 'success');
        loadFields();
      }
    } catch (e) { notify('Deletion Failed', 'error'); }
    setSaving(false);
    setShowDeleteConfirm(null);
  }

  if (loading) return <div className="loader-screen">RECONSTRUCTING DNA...</div>;

  const systemColor = parentType?.icon_color || '#D4AF37';
  const activeSect = sections.find(s => s.id === activeSection);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ────────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: `2px solid ${systemColor}20`, padding: '1.25rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: systemColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', boxShadow: `0 8px 16px ${systemColor}30` }}>
            <i className={parentType?.icon || 'fas fa-dna'}></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{currentType?.name.toUpperCase()}</h1>
              <span style={{ fontSize: '0.6rem', padding: '3px 10px', background: `${systemColor}15`, color: systemColor, borderRadius: '6px', fontWeight: 900, border: `1px solid ${systemColor}20` }}>
                {parentType?.name.toUpperCase()} SYSTEM
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Master Blueprint Architect</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={() => setShowHierarchy(true)}
            style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            <i className="fas fa-chart-pie"></i> HIERARCHY
          </button>
          <select 
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}
          >
            {types.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()} Blueprints</option>)}
          </select>
          <Link href="/jana/governance" className="btn-glass">GOVERNANCE HUB</Link>
        </div>
      </header>

      {/* ── HIERARCHY DASHBOARD OVERLAY ────────────────────────── */}
      {showHierarchy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
           <div style={{ background: '#fff', width: '100%', maxWidth: '1000px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', padding: '3rem', color: '#fff', position: 'relative' }}>
                <button onClick={() => setShowHierarchy(false)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>DNA Hierarchy Overview</h2>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontWeight: 600 }}>Structural audit of the platform Content DNA</p>
              </div>
              
              <div style={{ padding: '3rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                <div style={{ padding: '2rem', borderRadius: '24px', background: '#fef3c7', border: '1px solid #fcd34d' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#92400e', letterSpacing: '1px', marginBottom: '1rem' }}>UNIVERSAL DNA (GOLD)</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{sections.reduce((acc, s) => acc + s.fields.filter(f => !f.is_inherited && f.section_id === 'basic').length, 0)}</div>
                  <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.5rem', fontWeight: 600 }}>Standard fields applied across the entire Siwa Oasis ecosystem.</p>
                </div>
                <div style={{ padding: '2rem', borderRadius: '24px', background: '#dbeafe', border: '1px solid #93c5fd' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1e40af', letterSpacing: '1px', marginBottom: '1rem' }}>COMMON DNA (BLUE)</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{sections.reduce((acc, s) => acc + s.fields.filter(f => f.is_inherited).length, 0)}</div>
                  <p style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.5rem', fontWeight: 600 }}>Inherited fields shared with parents and siblings in this system.</p>
                </div>
                <div style={{ padding: '2rem', borderRadius: '24px', background: '#d1fae5', border: '1px solid #6ee7b7' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#065f46', letterSpacing: '1px', marginBottom: '1rem' }}>UNIQUE DNA (GREEN)</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{sections.reduce((acc, s) => acc + s.fields.filter(f => !f.is_inherited && f.section_id !== 'basic').length, 0)}</div>
                  <p style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.5rem', fontWeight: 600 }}>Type-specific fields that define the unique identity of this business.</p>
                </div>
              </div>

              <div style={{ padding: '0 3rem 3rem 3rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowHierarchy(false)} style={{ padding: '1rem 3rem', borderRadius: '16px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>CLOSE AUDIT</button>
              </div>
           </div>
        </div>
      )}

      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: `${leftCollapsed ? '60px' : '320px'} 1fr ${rightCollapsed ? '60px' : '420px'}`, 
        gap: '0',
        transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* ── LEFT: MASTER CATEGORIES ─────────────────────────────── */}
        <nav style={{ 
          background: '#fff', 
          borderRight: '1px solid #e2e8f0', 
          padding: leftCollapsed ? '1rem' : '2rem', 
          overflowY: 'auto',
          position: 'relative'
        }}>
          <button 
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            style={{ position: 'absolute', top: '1rem', right: leftCollapsed ? '50%' : '1rem', transform: leftCollapsed ? 'translateX(50%)' : 'none', background: '#f1f5f9', border: 'none', width: 28, height: 28, borderRadius: '8px', cursor: 'pointer', zIndex: 10 }}
          >
            <i className={`fas fa-chevron-${leftCollapsed ? 'right' : 'left'}`} style={{ fontSize: '0.7rem' }}></i>
          </button>

          {!leftCollapsed && (
            <div className="animate-in">
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>DNA CATEGORIES</span>
                <span>{sections.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sections.map(s => {
                  const isActive = activeSection === s.id;
                  const hasPropagation = s.fields.some(f => f.name === 'mini_blog');
                  return (
                    <button 
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      style={{ 
                        textAlign: 'left', padding: '1.1rem', borderRadius: '16px', border: isActive ? `1.5px solid ${systemColor}30` : '1px solid transparent',
                        background: isActive ? `${systemColor}05` : 'transparent',
                        color: isActive ? systemColor : '#64748b',
                        fontWeight: isActive ? 900 : 600, fontSize: '0.9rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: isActive ? systemColor : '#f1f5f9', color: isActive ? '#fff' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                        <i className={`fas ${s.icon}`}></i>
                      </div>
                      {s.name}
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {hasPropagation && <i className="fas fa-rss" style={{ fontSize: '0.6rem', color: isActive ? systemColor : '#cbd5e1' }}></i>}
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{s.fields.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {leftCollapsed && (
            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ width: 40, height: 40, borderRadius: '10px', background: activeSection === s.id ? systemColor : '#f1f5f9', color: activeSection === s.id ? '#fff' : '#cbd5e1', border: 'none', cursor: 'pointer' }}>
                  <i className={`fas ${s.icon}`}></i>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* ── CENTER: BLUEPRINT EDITOR ───────────────────────────── */}
        <main style={{ padding: '3.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)', background: '#f8fafc' }}>
          <div style={{ maxWidth: leftCollapsed && rightCollapsed ? '1200px' : '850px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
            
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: '#fff', padding: '1.5rem 2rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
               <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{activeSect?.name} Configuration</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Define the architectural fields for this DNA section.</p>
                    <button 
                      onClick={() => { setPreviewType('full'); setShowPreview(true); }}
                      style={{ background: 'none', border: 'none', color: systemColor, fontWeight: 900, fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      <i className="fas fa-book-open" style={{ marginRight: '4px' }}></i> PREVIEW FULL STORYTELLER FORM
                    </button>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => { setPreviewType('section'); setShowPreview(true); }}
                    style={{ 
                      padding: '0.85rem 1.5rem', borderRadius: '12px', background: '#1e293b', color: '#fff', border: 'none', 
                      fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      boxShadow: '0 4px 12px rgba(30,41,59,0.2)', transition: 'all 0.2s'
                    }}
                  >
                    <i className="fas fa-eye" style={{ color: '#D4AF37' }}></i> CHAPTER PREVIEW
                  </button>
                 <button 
                   onClick={async () => {
                     if (window.confirm('Inject Gold Standards for this industry?')) {
                       const r = await fetch('/api/setup/seed-standards');
                       if (r.ok) { notify('Standards Injected Successfully!', 'success'); window.location.reload(); }
                     }
                   }}
                   style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1.5px solid #D4AF37', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                 >
                   <i className="fas fa-magic"></i> STANDARDIZE
                 </button>
                 {!activeSect?.fields.some(f => f.name === 'mini_blog') && (
                    <button 
                      onClick={() => handlePreWireNarrative(activeSection)}
                      className="btn-wire"
                      style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                      <i className="fas fa-bolt"></i> PRE-WIRE
                    </button>
                 )}
                 <button 
                    onClick={() => handleAddField(activeSection)}
                    style={{ padding: '0.85rem 1.5rem', borderRadius: '12px', background: systemColor, color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: `0 10px 20px ${systemColor}20` }}
                 >
                   <i className="fas fa-plus"></i> ADD FIELD
                 </button>
               </div>
            </div>

            {/* Field Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeSect?.fields.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                    <i className="fas fa-folder-open fa-3x" style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}></i>
                    <p style={{ fontWeight: 800, color: '#94a3b8' }}>Empty DNA Section. Add fields to start building.</p>
                 </div>
               ) : activeSect?.fields.sort((a,b) => a.sort_order - b.sort_order).map(field => {
                const typeInfo = FIELD_TYPES.find(t => t.value === field.field_type);
                const isDNA = ['feature_on_main', 'section_news', 'section_gallery', 'section_blog'].includes(field.name);
                const isUniversal = field.business_type_id === 'SECTION_TEMPLATE';
                const isInherited = field.business_type_id !== selectedType && !isUniversal;
                const isDeleting = showDeleteConfirm === field.id;

                let statusColor = '#6EE7B7'; // Unique
                let statusLabel = 'UNIQUE DNA';
                
                if (isUniversal) {
                  statusColor = '#D4AF37';
                  statusLabel = 'MASTER DNA';
                } else if (isInherited) {
                  statusColor = '#3b82f6';
                  statusLabel = 'INHERITED FROM PARENT';
                }

                return (
                  <div 
                    key={field.id} 
                    className="field-card" 
                    style={{ 
                      background: '#fff', borderRadius: '20px', border: isDNA ? `2px solid #D4AF3740` : '1px solid #e2e8f0', 
                      borderLeft: `6px solid ${statusColor}`,
                      padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.3s',
                      position: 'relative', overflow: 'hidden',
                      opacity: isInherited ? 0.8 : 1
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${typeInfo?.color || '#eee'}10`, color: typeInfo?.color || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      <i className={`fas ${typeInfo?.icon || 'fa-cube'}`}></i>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1e293b' }}>{field.label}</div>
                        <span style={{ fontSize: '0.55rem', padding: '2px 8px', background: `${statusColor}15`, color: statusColor, borderRadius: '6px', fontWeight: 900, border: `1px solid ${statusColor}30` }}>
                          {statusLabel}
                        </span>
                        {isDNA && <i className="fas fa-dna" style={{ color: '#D4AF37', fontSize: '0.7rem' }}></i>}
                        {field.required && <span style={{ fontSize: '0.55rem', color: '#ef4444', fontWeight: 900 }}>* REQUIRED</span>}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: 700 }}>
                        {field.name} <span style={{ opacity: 0.3 }}>|</span> {field.field_type} <span style={{ opacity: 0.3 }}>|</span> ORDER: {field.sort_order}
                      </div>
                    </div>

                    {!isInherited && !isUniversal ? (
                      <div style={{ display: 'flex', gap: '0.5rem', opacity: isDeleting ? 0.2 : 1 }}>
                        <button onClick={() => setEditingField(field)} className="btn-action edit" title="Edit Properties"><i className="fas fa-edit"></i></button>
                        <button onClick={() => setShowDeleteConfirm(field.id)} className="btn-action delete" title="Purge Field"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    ) : (
                      <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }} title="Managed by Parent Hierarchy">
                        <i className="fas fa-lock"></i>
                      </div>
                    )}

                    {/* Inline Delete Confirmation */}
                    {isDeleting && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', zIndex: 10 }}>
                        <span style={{ fontWeight: 900, fontSize: '0.8rem', color: '#ef4444' }}>PURGE THIS DNA PATTERN?</span>
                        <button onClick={() => deleteField(field.id)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>YES, PURGE</button>
                        <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', background: '#f1f5f9', color: '#1e293b', border: 'none', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>CANCEL</button>
                      </div>
                    )}
                  </div>
                );
              })

            </div>
          </div>
        </main>

        {/* ── RIGHT: MASTER CONFIGURATION ────────────────────────── */}
        <aside style={{ 
          background: '#fff', 
          borderLeft: '1px solid #e2e8f0', 
          padding: rightCollapsed ? '1rem' : '2.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto',
          position: 'relative'
        }}>
           <button 
            onClick={() => setRightCollapsed(!rightCollapsed)}
            style={{ position: 'absolute', top: '1rem', left: rightCollapsed ? '50%' : '1rem', transform: rightCollapsed ? 'translateX(-50%)' : 'none', background: '#f1f5f9', border: 'none', width: 28, height: 28, borderRadius: '8px', cursor: 'pointer', zIndex: 10 }}
          >
            <i className={`fas fa-chevron-${rightCollapsed ? 'left' : 'right'}`} style={{ fontSize: '0.7rem' }}></i>
          </button>

           {editingField && !rightCollapsed ? (
             <div className="animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px' }}>FIELD CONFIGURATION</div>
                   <button onClick={() => setEditingField(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><i className="fas fa-times fa-lg"></i></button>
                </div>
                
                <div className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="f-group">
                    <label className="f-label">DISPLAY LABEL</label>
                    <input 
                      type="text" className="f-input" value={editingField.label} 
                      onChange={e => setEditingField({...editingField, label: e.target.value})} 
                      placeholder="e.g. Traditional Bedding"
                    />
                  </div>

                  <div className="f-group">
                    <label className="f-label">SYSTEM KEY (DB NAME)</label>
                    <input 
                      type="text" className="f-input" value={editingField.name} 
                      onChange={e => setEditingField({...editingField, name: e.target.value})} 
                      readOnly={!!editingField.id}
                      style={{ opacity: editingField.id ? 0.5 : 1, cursor: editingField.id ? 'not-allowed' : 'text' }}
                    />
                    <small style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>Key must be unique and lowercase.</small>
                  </div>

                  <div className="f-group">
                    <label className="f-label">FIELD ARCHETYPE</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {FIELD_TYPES.map(t => (
                        <button 
                          key={t.value}
                          onClick={() => setEditingField({...editingField, field_type: t.value})}
                          style={{ 
                            padding: '1rem', borderRadius: '14px', border: editingField.field_type === t.value ? `2px solid ${t.color}` : '1px solid #f1f5f9',
                            background: editingField.field_type === t.value ? `${t.color}05` : '#fff',
                            fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <i className={`fas ${t.icon}`} style={{ display: 'block', fontSize: '1.25rem', marginBottom: '0.5rem', color: t.color }}></i>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <label className="toggle-btn" style={{ flex: 1, minWidth: '100px' }}>
                       <input type="checkbox" checked={editingField.required} onChange={e => setEditingField({...editingField, required: e.target.checked})} />
                       MANDATORY
                    </label>
                    <label className="toggle-btn" style={{ flex: 1, minWidth: '130px' }}>
                       <input type="checkbox" checked={editingField.vendor_editable} onChange={e => setEditingField({...editingField, vendor_editable: e.target.checked})} />
                       VENDOR EDITABLE
                    </label>
                    <label className="toggle-btn" style={{ flex: 1, minWidth: '130px' }}>
                       <input type="checkbox" checked={editingField.show_on_public} onChange={e => setEditingField({...editingField, show_on_public: e.target.checked})} />
                       SHOW ON PUBLIC
                    </label>
                  </div>

                  <div className="f-group">
                    <label className="f-label">SORT ORDER</label>
                    <input 
                      type="number" className="f-input" value={editingField.sort_order} 
                      onChange={e => setEditingField({...editingField, sort_order: parseInt(e.target.value)})} 
                    />
                  </div>

                  <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setEditingField(null)} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>CANCEL</button>
                    <button onClick={saveField} disabled={saving} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 10px 20px -5px rgba(30,41,59,0.3)' }}>{saving ? 'SAVING...' : 'COMMIT CHANGES'}</button>
                  </div>
                </div>
             </div>
           ) : (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
               <div style={{ width: 70, height: 70, borderRadius: '50%', background: `${systemColor}10`, color: systemColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.8rem' }}>
                 <i className="fas fa-project-diagram"></i>
               </div>
               <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>System Architect</h3>
               <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.6 }}>
                 Select a field from the **{activeSect?.name}** blueprint to modify its architectural properties or propagation logic.
               </p>
             </div>
           )}
        </aside>

      </div>

      {/* ── PREVIEW MODAL ─────────────────────────────────────────── */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '850px', background: '#fff', borderRadius: '40px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <header style={{ padding: '2.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: '#1e293b' }}>
                  {previewType === 'full' ? 'Master Storyteller Preview' : 'Chapter Preview'}
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                  {previewType === 'full' 
                    ? `Full journey for ${currentType?.name || 'this industry'}` 
                    : `Previewing chapter: ${activeSect?.name || 'Loading...'}`}
                </p>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ width: 44, height: 44, borderRadius: '14px', border: 'none', background: '#f1f5f9', color: '#1e293b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-times fa-lg"></i>
              </button>
            </header>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '4rem' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                {(previewType === 'full' ? sections : [activeSect]).map((sect, sIdx) => (
                  <div key={sect?.id || sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {previewType === 'full' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                         <div style={{ width: 36, height: 36, background: systemColor, color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <i className={`fas ${sect?.icon || 'fa-layer-group'}`}></i>
                         </div>
                         <h4 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{sect?.name}</h4>
                      </div>
                    )}
                    
                    {!sect?.fields || sect.fields.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0', opacity: 0.5 }}>
                        No fields defined in {sect?.name}.
                      </div>
                    ) : sect.fields.sort((a,b) => a.sort_order - b.sort_order).map(f => (
                      <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: f.vendor_editable === false ? 0.5 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#1e293b' }}>
                            {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {f.vendor_editable === false && (
                            <span style={{ fontSize: '0.6rem', color: '#D4AF37', fontWeight: 900, padding: '4px 10px', background: 'rgba(212,175,55,0.1)', borderRadius: '6px' }}>
                              <i className="fas fa-lock" style={{ marginRight: '4px' }}></i> ADMIN ONLY
                            </span>
                          )}
                        </div>
                        {['textarea', 'rich_text'].includes(f.field_type) ? (
                          <div style={{ minHeight: '100px', background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: '16px', padding: '1.25rem', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            Narrative content for {f.label}...
                          </div>
                        ) : f.field_type === 'gallery' ? (
                          <div style={{ height: '140px', background: 'rgba(212,175,55,0.03)', border: '2px dashed #D4AF3740', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                            <i className="fas fa-images fa-lg" style={{ marginBottom: '0.5rem', opacity: 0.5 }}></i>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{f.label.toUpperCase()} COMPONENT</span>
                          </div>
                        ) : (
                          <div style={{ height: '50px', background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: '14px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                            {f.placeholder || `Value for ${f.label}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <footer style={{ padding: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', background: '#fcfcfc' }}>
              <button onClick={() => setShowPreview(false)} className="btn btn-primary" style={{ background: '#1e293b', border: 'none', padding: '1rem 3rem', borderRadius: '16px', fontWeight: 900 }}>
                RETURN TO ARCHITECT
              </button>
            </footer>
          </div>
        </div>
      )}

      <style jsx>{`
        .btn-glass { padding: 0.75rem 1.5rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; color: #1e293b; text-decoration: none; font-size: 0.8rem; font-weight: 800; transition: all 0.2s; }
        .btn-glass:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
        
        .field-card:hover { transform: translateY(-3px); border-color: ${systemColor}50 !important; box-shadow: 0 10px 20px rgba(0,0,0,0.02); }
        
        .btn-action { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #f1f5f9; background: #fff; cursor: pointer; transition: all 0.2s; display: flex; alignItems: center; justifyContent: center; }
        .btn-action.edit:hover { background: #3b82f6; color: #fff; border-color: #3b82f6; }
        .btn-action.delete:hover { background: #ef4444; color: #fff; border-color: #ef4444; }

        .f-label { display: block; fontSize: 0.7rem; fontWeight: 900; color: #64748b; marginBottom: 0.6rem; letterSpacing: 0.5px; }
        .f-input { width: 100%; padding: 0.9rem 1.1rem; border-radius: 12px; border: 1.5px solid #f1f5f9; background: #f8fafc; outline: none; font-weight: 700; font-size: 0.9rem; color: #1e293b; transition: all 0.2s; }
        .f-input:focus { border-color: ${systemColor}; background: #fff; box-shadow: 0 0 0 4px ${systemColor}15; }
        
        .toggle-btn { flex: 1; padding: 0.75rem; border-radius: 12px; background: #f8fafc; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 0.75rem; font-size: 0.7rem; fontWeight: 800; cursor: pointer; transition: all 0.2s; }
        .toggle-btn:has(input:checked) { background: #fff; border-color: #D4AF37; }
        
        .loader-screen { height: 100vh; display: flex; align-items: center; justifyContent: center; background: #0f172a; color: #D4AF37; font-weight: 900; letter-spacing: 5px; }
      `}</style>
    </div>
  );
}
