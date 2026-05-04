'use client';
export const dynamic = 'force-dynamic';

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
  vendor_editable: boolean; show_on_public: boolean; options?: any; help_text?: string;
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
      setSections(prev => prev.map((s: any) => ({ ...s, fields: fieldsBySection[s.id] || [] })));
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
      
      {/* --- HEADER: SYSTEM COMMAND CENTER --------------------------- */}
      <header style={{ 
        background: '#0f172a', padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/jana" style={{ textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, background: '#D4AF37', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
              <i className="fas fa-dna fa-lg"></i>
            </div>
            <div style={{ fontWeight: 900, letterSpacing: '2px', fontSize: '1rem' }}>SIWA <span style={{ color: '#D4AF37' }}>DNA</span></div>
          </Link>
          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '1px' }}>ARCHITECT v6.0</div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {types.map((t: any) => {
            const isActive = selectedType === t.id;
            const isParent = !!t.is_parent;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none',
                  background: isActive ? '#D4AF37' : 'transparent',
                  color: isActive ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, fontSize: '0.65rem'
                }}
              >
                <i className={`fas ${t.icon}`} style={{ fontSize: '0.9rem' }}></i>
                {t.name.toUpperCase()}
                {isParent && <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#0f172a' : '#D4AF37' }}></div>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowHierarchy(true)}
            style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}
          >
            HIERARCHY
          </button>
          <Link href="/jana" className="btn btn-sm btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>EXIT</Link>
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
        
        {/* --- LEFT: MASTER CATEGORIES ------------------------------- */}
        <nav style={{ 
          background: '#fff', 
          borderRight: '1px solid #f1f5f9', 
          padding: leftCollapsed ? '1rem' : '2.5rem', 
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '4px 0 24px rgba(15,23,42,0.02)'
        }}>
          <button 
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            style={{ position: 'absolute', top: '1.25rem', right: leftCollapsed ? '50%' : '1.25rem', transform: leftCollapsed ? 'translateX(50%)' : 'none', background: '#f8fafc', border: '1px solid #e2e8f0', width: 32, height: 32, borderRadius: '10px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}
          >
            <i className={`fas fa-chevron-${leftCollapsed ? 'right' : 'left'}`} style={{ fontSize: '0.7rem' }}></i>
          </button>

          {!leftCollapsed && (
            <div className="animate-in">
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>BLUEPRINT INDEX</span>
                <span style={{ background: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{sections.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {sections.map((s: any) => {
                  const isActive = activeSection === s.id;
                  const hasPropagation = s.fields.some((f: any) => f.name === 'mini_blog');
                  return (
                    <button 
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      style={{ 
                        textAlign: 'left', padding: '1rem', borderRadius: '18px', border: isActive ? `1.5px solid ${systemColor}20` : '1px solid transparent',
                        background: isActive ? `${systemColor}05` : 'transparent',
                        color: isActive ? '#1e293b' : '#64748b',
                        fontWeight: isActive ? 900 : 700, fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <div style={{ width: 42, height: 42, borderRadius: '12px', background: isActive ? systemColor : '#f8fafc', color: isActive ? '#fff' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: isActive ? 'none' : '1px solid #f1f5f9' }}>
                        <i className={`fas ${s.icon}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '2px' }}>{s.name}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 800 }}>{s.fields.length} DNA PATTERNS</div>
                      </div>
                      {hasPropagation && <i className="fas fa-magic" style={{ fontSize: '0.7rem', color: isActive ? systemColor : '#cbd5e1', opacity: 0.5 }}></i>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {leftCollapsed && (
            <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              {sections.map((s: any) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ width: 44, height: 44, borderRadius: '12px', background: activeSection === s.id ? systemColor : '#f8fafc', color: activeSection === s.id ? '#fff' : '#cbd5e1', border: activeSection === s.id ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${s.icon}`} style={{ fontSize: '1rem' }}></i>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* --- CENTER: BLUEPRINT EDITOR ----------------------------- */}
        <main style={{ padding: '3.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)', background: '#f8fafc' }}>
          <div style={{ maxWidth: leftCollapsed && rightCollapsed ? '1200px' : '850px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
            
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: '#fff', padding: '1.5rem 2rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
               <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Architectural Layer</div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#1e293b' }}>{activeSect?.name} <span style={{ opacity: 0.3, fontWeight: 300 }}>/</span> Blueprints</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <button 
                      onClick={() => { setPreviewType('full'); setShowPreview(true); }}
                      style={{ background: 'none', border: 'none', color: '#1e293b', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}
                    >
                      <i className="fas fa-expand-arrows-alt" style={{ color: '#D4AF37' }}></i> PREVIEW FULL JOURNEY
                    </button>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '1.25rem' }}>
                  <button 
                    onClick={() => { setPreviewType('section'); setShowPreview(true); }}
                    style={{ 
                      padding: '0.85rem 1.5rem', borderRadius: '12px', background: '#f8fafc', color: '#1e293b', 
                      border: '1px solid #e2e8f0', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s'
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
                    style={{ 
                       padding: '0.85rem 2.25rem', borderRadius: '12px', background: '#1e293b', color: '#fff', 
                       border: 'none', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', 
                       display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px rgba(30,41,59,0.3)', transition: 'all 0.2s'
                    }}
                 >
                   <i className="fas fa-plus"></i> ADD FIELD
                 </button>
               </div>
            </div>

            {/* Field Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!activeSect?.fields || activeSect.fields.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                    <i className="fas fa-folder-open fa-3x" style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}></i>
                    <p style={{ fontWeight: 800, color: '#94a3b8' }}>Empty DNA Section. Add fields to start building.</p>
                 </div>
               ) : [...activeSect.fields].sort((a,b) => a.sort_order - b.sort_order).map((field: any) => {
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
                      background: '#fff', borderRadius: '24px', 
                      border: isDNA ? `2.5px solid ${statusColor}40` : '1px solid #f1f5f9', 
                      padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '2rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                      opacity: isInherited ? 0.85 : 1
                    }}
                  >
                    <div style={{ 
                      width: 54, height: 54, borderRadius: '16px', background: `${typeInfo?.color || '#eee'}10`, 
                      color: typeInfo?.color || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '1.4rem', border: `1px solid ${typeInfo?.color || '#eee'}20` 
                    }}>
                      <i className={`fas ${typeInfo?.icon || 'fa-cube'}`}></i>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e293b', letterSpacing: '-0.3px' }}>{field.label}</div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                           <span style={{ fontSize: '0.55rem', padding: '4px 10px', background: `${statusColor}10`, color: statusColor, borderRadius: '8px', fontWeight: 900, border: `1px solid ${statusColor}30`, letterSpacing: '0.5px' }}>
                             {statusLabel}
                           </span>
                           {field.required && <span style={{ fontSize: '0.55rem', padding: '4px 10px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: '8px', fontWeight: 900, border: '1px solid rgba(239,68,68,0.1)' }}>REQUIRED</span>}
                           {!field.vendor_editable && <span style={{ fontSize: '0.55rem', padding: '4px 10px', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', borderRadius: '8px', fontWeight: 900, border: '1px solid rgba(212,175,55,0.1)' }}>LOCKED</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.6rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <i className="fas fa-terminal" style={{ fontSize: '0.55rem', opacity: 0.5 }}></i>
                           {field.name}
                        </div>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }}></div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                           {typeInfo?.label} Archetype
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                         <>
                           <button onClick={() => setEditingField(field)} className="btn-action edit" style={{ width: 40, height: 40, borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', transition: 'all 0.2s' }}>
                             <i className="fas fa-cog"></i>
                           </button>
                           <button onClick={() => setShowDeleteConfirm(field.id)} className="btn-action delete" style={{ width: 40, height: 40, borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#ef4444', transition: 'all 0.2s' }}>
                             <i className="fas fa-trash-alt"></i>
                           </button>
                         </>
                       <div style={{ cursor: 'grab', color: '#cbd5e1', marginLeft: '0.5rem' }}>
                          <i className="fas fa-grip-vertical"></i>
                       </div>
                    </div>

                    {/* Inline Delete Confirmation */}
                    {isDeleting && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', zIndex: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#1e293b' }}>PURGE <span style={{ color: '#ef4444' }}>{field.label.toUpperCase()}</span>?</div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                           <button onClick={() => deleteField(field.id)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', boxShadow: '0 8px 16px rgba(239,68,68,0.2)' }}>YES, PURGE</button>
                           <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#f1f5f9', color: '#1e293b', border: 'none', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>CANCEL</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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

          {!rightCollapsed && (
            <div className="animate-in" style={{ padding: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px' }}>PROPERTY INSPECTOR</div>
                  <button onClick={() => setEditingField(null)} style={{ width: 32, height: 32, borderRadius: '10px', background: '#f8fafc', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                </div>
                
                {editingField ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  <div className="inspector-section">
                    <label className="f-label" style={{ marginBottom: '1.25rem', opacity: 0.5 }}>FIELD IDENTITY</label>
                    <div className="f-group">
                      <label className="f-label" style={{ fontSize: '0.6rem' }}>LABEL</label>
                      <input 
                        type="text" className="f-input" value={editingField.label} 
                        onChange={e => setEditingField({...editingField, label: e.target.value})} 
                      />
                    </div>
                    <div className="f-group" style={{ marginTop: '1.25rem' }}>
                      <label className="f-label" style={{ fontSize: '0.6rem' }}>DATABASE KEY</label>
                      <input 
                        type="text" className="f-input" value={editingField.name} 
                        onChange={e => setEditingField({...editingField, name: e.target.value})} 
                        disabled={!!editingField.id}
                        style={{ opacity: editingField.id ? 0.4 : 1, background: editingField.id ? '#f1f5f9' : '#fff' }}
                      />
                    </div>
                  </div>

                  <div className="inspector-section">
                    <label className="f-label" style={{ marginBottom: '1.25rem', opacity: 0.5 }}>DATA ARCHETYPE</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {FIELD_TYPES.map((t: any) => (
                        <button 
                          key={t.value}
                          onClick={() => setEditingField({...editingField, field_type: t.value})}
                          style={{ 
                            padding: '0.75rem 0.25rem', borderRadius: '12px', border: editingField.field_type === t.value ? `2px solid ${t.color}` : '1.5px solid #f8fafc',
                            background: editingField.field_type === t.value ? `${t.color}10` : '#fff',
                            fontSize: '0.6rem', fontWeight: 900, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#1e293b'
                          }}
                        >
                          <i className={`fas ${t.icon}`} style={{ display: 'block', fontSize: '1rem', marginBottom: '0.4rem', color: t.color }}></i>
                          {t.label.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="inspector-section">
                    <label className="f-label" style={{ marginBottom: '1.25rem', opacity: 0.5 }}>GOVERNANCE LAYER</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label className="toggle-btn">
                         <input type="checkbox" checked={editingField.required} onChange={e => setEditingField({...editingField, required: e.target.checked})} />
                         MANDATORY (REQUIRED FIELD)
                      </label>
                      <label className="toggle-btn">
                         <input type="checkbox" checked={editingField.vendor_editable} onChange={e => setEditingField({...editingField, vendor_editable: e.target.checked})} />
                         VENDOR EDITABLE PERMISSION
                      </label>
                      <label className="toggle-btn">
                         <input type="checkbox" checked={editingField.show_on_public} onChange={e => setEditingField({...editingField, show_on_public: e.target.checked})} />
                         PUBLIC DISCOVERY VISIBILITY
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setEditingField(null)} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>CANCEL</button>
                    <button onClick={saveField} disabled={saving} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 10px 20px -5px rgba(30,41,59,0.4)' }}>COMMIT DNA</button>
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
          </div>
        )}
      </aside>

      </div>

      {/* --- PREVIEW MODAL: CINEMATIC STORYTELLER --------------------- */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '950px', background: '#fff', borderRadius: '40px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <header style={{ padding: '3rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Visual Verification</div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.75rem', color: '#1e293b', letterSpacing: '-0.5px' }}>
                  {previewType === 'full' ? 'Master Storyteller' : 'Chapter Preview'}
                </h3>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ width: 54, height: 54, borderRadius: '18px', background: '#f8fafc', color: '#1e293b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #f1f5f9' }}>
                <i className="fas fa-times fa-lg"></i>
              </button>
            </header>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 6rem' }}>
              <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '5rem' }}>
                {(previewType === 'full' ? sections : [activeSect]).map((sect: any, sIdx: number) => (
                  <div key={sect?.id || sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {previewType === 'full' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                         <div style={{ width: 48, height: 48, background: '#1e293b', color: '#D4AF37', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                           <i className={`fas ${sect?.icon || 'fa-layer-group'}`}></i>
                         </div>
                         <h4 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem', color: '#1e293b' }}>{sect?.name}</h4>
                      </div>
                    )}
                    
                    {!sect?.fields || sect.fields.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '32px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 800 }}>
                        <i className="fas fa-ghost fa-2x" style={{ display: 'block', marginBottom: '1rem', opacity: 0.3 }}></i>
                        NO PATTERNS DEFINED
                      </div>
                    ) : sect.fields.sort((a: any, b: any) => a.sort_order - b.sort_order).map((f: any) => (
                      <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#1e293b', opacity: 0.8 }}>
                            {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                             {f.vendor_editable === false && (
                               <span style={{ fontSize: '0.55rem', color: '#D4AF37', fontWeight: 900, padding: '5px 12px', background: 'rgba(212,175,55,0.08)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.1)' }}>
                                 <i className="fas fa-lock" style={{ marginRight: '6px' }}></i> ADMIN SOVEREIGN
                               </span>
                             )}
                             {!f.show_on_public && (
                               <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 900, padding: '5px 12px', background: '#f1f5f9', borderRadius: '8px' }}>
                                 INTERNAL
                               </span>
                             )}
                          </div>
                        </div>

                        {['textarea', 'rich_text'].includes(f.field_type) ? (
                          <div style={{ minHeight: '140px', background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: '24px', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.8, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ height: 12, width: '80%', background: '#f8fafc', borderRadius: 4, marginBottom: 12 }}></div>
                            <div style={{ height: 12, width: '95%', background: '#f8fafc', borderRadius: 4, marginBottom: 12 }}></div>
                            <div style={{ height: 12, width: '60%', background: '#f8fafc', borderRadius: 4 }}></div>
                          </div>
                        ) : f.field_type === 'gallery' ? (
                          <div style={{ height: '180px', background: 'linear-gradient(135deg, rgba(212,175,55,0.05), rgba(212,175,55,0.02))', border: '2px dashed #D4AF3750', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                            <i className="fas fa-images fa-2x" style={{ marginBottom: '1rem', opacity: 0.4 }}></i>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px' }}>{f.label.toUpperCase()} STUDIO</span>
                          </div>
                        ) : (
                          <div style={{ height: '64px', background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: '18px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            {f.placeholder || `Prototype value for ${f.label}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <footer style={{ padding: '2.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
              <button onClick={() => setShowPreview(false)} style={{ background: '#1e293b', border: 'none', padding: '1.1rem 4rem', borderRadius: '20px', color: '#fff', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 15px 30px rgba(30,41,59,0.3)', transition: 'all 0.3s' }}>
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
