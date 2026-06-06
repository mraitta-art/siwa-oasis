'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/context/AdminContext';

interface DataFillerProps {
  selectedTypeId: string | null;
  selectedTypeName: string | null;
}

export default function DataFiller({ selectedTypeId, selectedTypeName }: DataFillerProps) {
  const { notify } = useAdmin();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [fields, setFields] = useState<Record<string, any[]>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [completion, setCompletion] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Inline create business
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizSlug, setNewBizSlug] = useState('');
  const [creatingBiz, setCreatingBiz] = useState(false);

  // Load businesses for this typology
  useEffect(() => {
    if (!selectedTypeId) { setBusinesses([]); setSelectedBusiness(null); return; }
    fetch(`/api/jana/businesses?type=${selectedTypeId}`)
      .then(r => r.json())
      .then(data => setBusinesses(Array.isArray(data) ? data : []))
      .catch(() => setBusinesses([]));
  }, [selectedTypeId]);

  // Load sections and fields when a business is selected
  const loadBlueprint = useCallback(async (business: any) => {
    if (!business) return;
    try {
      const secRes = await fetch(`/api/jana/sections?type=${selectedTypeId}`);
      const sectionData = secRes.ok ? await secRes.json() : [];
      setSections(Array.isArray(sectionData) ? sectionData : []);

      const fieldMap: Record<string, any[]> = {};
      await Promise.all((Array.isArray(sectionData) ? sectionData : []).map(async (s: any) => {
        const fr = await fetch(`/api/jana/forms?type=SECTION_TEMPLATE&section=${s.id}`);
        fieldMap[s.id] = fr.ok ? await fr.json() : [];
      }));
      setFields(fieldMap);

      // Load existing data from business
      const existing = business.custom_data || {};
      const flat: Record<string, any> = {};
      Object.entries(existing).forEach(([secId, secData]: [string, any]) => {
        if (typeof secData === 'object' && secData !== null) {
          Object.entries(secData).forEach(([k, v]) => { flat[`${secId}__${k}`] = v; });
        }
      });
      setFormData(flat);

      if (Array.isArray(sectionData) && sectionData.length > 0) {
        setActiveTab(sectionData[0].id);
      }
    } catch (e) { console.error(e); }
  }, [selectedTypeId]);

  function selectBusiness(biz: any) {
    setSelectedBusiness(biz);
    loadBlueprint(biz);
  }

  // Create business inline
  async function createBusinessInline() {
    if (!newBizName.trim()) { notify('Business name is required', 'error'); return; }
    if (!selectedTypeId) { notify('Category not selected', 'error'); return; }
    setCreatingBiz(true);
    const slug = newBizSlug.trim() || newBizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBizName, slug, type_id: selectedTypeId })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to create'); }
      const created = await res.json();
      notify(`Business "${newBizName}" registered!`, 'success');
      setNewBizName('');
      setNewBizSlug('');
      setCreatingBusiness(false);
      // Refresh list and select
      const updatedList = await fetch(`/api/jana/businesses?type=${selectedTypeId}`).then(r => r.json());
      setBusinesses(Array.isArray(updatedList) ? updatedList : []);
      const found = Array.isArray(updatedList) ? updatedList.find((b: any) => b.slug === slug || b.name === newBizName) : created;
      if (found) selectBusiness(found);
    } catch (e: any) { notify(e.message || 'Failed to create business', 'error'); }
    setCreatingBiz(false);
  }

  // Save current tab data (autosave on tab switch)
  async function saveSection(sectionId: string) {
    if (!selectedBusiness) return;
    setSaving(true);
    // Build section data from flat form
    const sectionData: Record<string, any> = {};
    Object.entries(formData).forEach(([key, val]) => {
      if (key.startsWith(sectionId + '__')) {
        sectionData[key.replace(sectionId + '__', '')] = val;
      }
    });
    const current = typeof selectedBusiness.custom_data === 'object' ? (selectedBusiness.custom_data || {}) : {};
    const updated = { ...current, [sectionId]: sectionData };
    try {
      await fetch(`/api/jana/businesses/${selectedBusiness.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_data: updated })
      });
      setSelectedBusiness({ ...selectedBusiness, custom_data: updated });
      setCompletion(prev => ({ ...prev, [sectionId]: true }));
      notify('Section saved!', 'success');
    } catch (e) { notify('Save failed', 'error'); }
    setSaving(false);
  }

  async function publishStory() {
    if (!selectedBusiness) return;
    setPublishing(true);
    // Build full data structure
    const allData: Record<string, Record<string, any>> = {};
    sections.forEach(section => {
      const sectionData: Record<string, any> = {};
      Object.entries(formData).forEach(([key, val]) => {
        if (key.startsWith(section.id + '__')) {
          sectionData[key.replace(section.id + '__', '')] = val;
        }
      });
      if (Object.keys(sectionData).length > 0) allData[section.id] = sectionData;
    });
    try {
      await fetch(`/api/jana/businesses/${selectedBusiness.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_data: allData })
      });
      notify(`"${selectedBusiness.name}" is now LIVE! 🎉`, 'success');
    } catch (e) { notify('Publish failed', 'error'); }
    setPublishing(false);
  }

  // Completeness score
  const filledSections = sections.filter(s => {
    const sFields = fields[s.id] || [];
    return sFields.some(f => {
      const val = formData[`${s.id}__${f.name}`];
      return val !== undefined && val !== null && val !== '';
    });
  });
  const completePct = sections.length > 0 ? Math.round((filledSections.length / sections.length) * 100) : 0;

  function getFieldValue(sectionId: string, fieldName: string) {
    return formData[`${sectionId}__${fieldName}`] ?? '';
  }
  function setFieldValue(sectionId: string, fieldName: string, value: any) {
    setFormData(prev => ({ ...prev, [`${sectionId}__${fieldName}`]: value }));
  }

  function renderField(section: any, field: any) {
    const key = `${section.id}__${field.name}`;
    const value = getFieldValue(section.id, field.name);
    const options = Array.isArray(field.options) ? field.options : [];

    const inputStyle: React.CSSProperties = {
      width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
      border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem',
      color: '#1e293b', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    };

    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea key={key} value={value} onChange={e => setFieldValue(section.id, field.name, e.target.value)}
            placeholder={field.help_text || `Enter ${field.label.toLowerCase()}...`} rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }} />
        );
      case 'rich_text':
        return (
          <div key={key} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#f1f5f9', padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8' }}>STORYTELLER EDITOR</span>
              <i className="fas fa-book-open" style={{ color: '#8b5cf6', fontSize: '0.75rem' }}></i>
            </div>
            <textarea value={value} onChange={e => setFieldValue(section.id, field.name, e.target.value)}
              placeholder={`${field.help_text || 'Write your story here...'} \n\nTip: Use paragraphs for the best reading experience.`} rows={6}
              style={{ ...inputStyle, border: 'none', borderRadius: 0, background: '#fff', padding: '1.25rem' }} />
          </div>
        );
      case 'select':
        return (
          <select key={key} value={value} onChange={e => setFieldValue(section.id, field.name, e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">-- Select {field.label} --</option>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'multiselect':
        return (
          <div key={key} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0', minHeight: '48px' }}>
            {options.map((opt: string) => {
              const selected = Array.isArray(value) && value.includes(opt);
              return (
                <button key={opt} onClick={() => {
                  const current = Array.isArray(value) ? value : [];
                  setFieldValue(section.id, field.name, selected ? current.filter((v: string) => v !== opt) : [...current, opt]);
                }} style={{
                  padding: '0.3rem 0.75rem', borderRadius: '8px', border: selected ? '2px solid #D4AF37' : '1.5px solid #e2e8f0',
                  background: selected ? '#fef3c7' : '#fff', color: selected ? '#92400e' : '#64748b',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                }}>
                  {selected && <i className="fas fa-check" style={{ marginRight: '4px', fontSize: '0.65rem' }}></i>}
                  {opt}
                </button>
              );
            })}
          </div>
        );
      case 'boolean':
        return (
          <button key={key} onClick={() => setFieldValue(section.id, field.name, !value)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: value ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', width: 'fit-content' }}>
            <div style={{ width: 44, height: 24, borderRadius: '12px', background: value ? '#10b981' : '#cbd5e1', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: value ? '#10b981' : '#94a3b8' }}>{value ? 'Yes / Active' : 'No / Inactive'}</span>
          </button>
        );
      case 'gallery':
        return (
          <div key={key} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
            <input className="form-control" placeholder="Enter image URLs (comma-separated)" value={Array.isArray(value) ? value.join(', ') : value}
              onChange={e => setFieldValue(section.id, field.name, e.target.value.split(',').map((u: string) => u.trim()).filter(Boolean))}
              style={{ marginBottom: '0.5rem' }} />
            {Array.isArray(value) && value.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {value.filter((u: string) => u).map((url: string, i: number) => (
                  <div key={i} style={{ width: 80, height: 60, borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`preview-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'map':
        return (
          <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>LATITUDE</label>
              <input type="number" step="any" value={Array.isArray(value) ? value[0] : ''} onChange={e => {
                const coords = Array.isArray(value) ? [...value] : ['', ''];
                coords[0] = e.target.value;
                setFieldValue(section.id, field.name, coords);
              }} placeholder="29.2050" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>LONGITUDE</label>
              <input type="number" step="any" value={Array.isArray(value) ? value[1] : ''} onChange={e => {
                const coords = Array.isArray(value) ? [...value] : ['', ''];
                coords[1] = e.target.value;
                setFieldValue(section.id, field.name, coords);
              }} placeholder="25.5150" style={inputStyle} />
            </div>
          </div>
        );
      case 'youtube':
        return (
          <div key={key}>
            <input value={value} onChange={e => setFieldValue(section.id, field.name, e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} />
            {value && (
              <div style={{ marginTop: '0.75rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <iframe src={`https://www.youtube.com/embed/${extractYouTubeId(value)}`}
                  width="100%" height="200" frameBorder="0" allowFullScreen style={{ display: 'block' }} />
              </div>
            )}
          </div>
        );
      case 'star_rating':
        return (
          <div key={key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setFieldValue(section.id, field.name, star)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.75rem', color: (value || 0) >= star ? '#f59e0b' : '#e2e8f0', padding: '0' }}>★</button>
            ))}
            {value > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', marginLeft: '0.5rem' }}>{value} / 5</span>}
          </div>
        );
      default:
        return (
          <input key={key} type="text" value={value} onChange={e => setFieldValue(section.id, field.name, e.target.value)}
            placeholder={field.help_text || `Enter ${field.label.toLowerCase()}...`} style={inputStyle} />
        );
    }
  }

  if (!selectedTypeId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem', color: '#94a3b8', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
        <i className="fas fa-arrow-left fa-2x" style={{ color: '#e2e8f0' }}></i>
        <div style={{ fontWeight: 800, fontSize: '1rem' }}>First select a business category in Stage 1</div>
        <div style={{ fontSize: '0.75rem' }}>Switch to the Schema Builder tab and pick a typology</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem' }}>

      {/* LEFT: Business selector + progress */}
      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Business Selector */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-store" style={{ color: '#D4AF37' }}></i>
            SELECT BUSINESS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {businesses.map(b => {
              const hasData = b.custom_data && Object.keys(b.custom_data).length > 0;
              const isSelected = selectedBusiness?.id === b.id;
              return (
                <button key={b.id} onClick={() => selectBusiness(b)} style={{
                  padding: '0.85rem 1rem', borderRadius: '12px', border: isSelected ? '2px solid #D4AF37' : '1.5px solid #e2e8f0',
                  background: isSelected ? '#fef3c7' : '#f8fafc', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>{b.name}</div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{b.slug}</div>
                  </div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', background: hasData ? '#dcfce7' : '#f1f5f9', color: hasData ? '#16a34a' : '#94a3b8' }}>
                    {hasData ? 'HAS DATA' : 'EMPTY'}
                  </div>
                </button>
              );
            })}
            {businesses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>No businesses for this category</div>
            )}
          </div>

          {/* Inline Create */}
          {!creatingBusiness ? (
            <button onClick={() => setCreatingBusiness(true)} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px dashed #cbd5e1', background: 'transparent', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fas fa-plus"></i> REGISTER NEW BUSINESS
            </button>
          ) : (
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #D4AF37' }}>
              <input className="form-control" placeholder="Business name" value={newBizName}
                onChange={e => { setNewBizName(e.target.value); setNewBizSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }}
                style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }} />
              <input className="form-control" placeholder="Slug (auto-filled)" value={newBizSlug}
                onChange={e => setNewBizSlug(e.target.value)} style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={createBusinessInline} disabled={creatingBiz} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: '#D4AF37', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>
                  {creatingBiz ? <i className="fas fa-spinner fa-spin"></i> : 'CREATE'}
                </button>
                <button onClick={() => setCreatingBusiness(false)} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}
        </div>

        {/* Completion Sidebar */}
        {selectedBusiness && sections.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#0f172a' }}>COMPLETENESS</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: completePct >= 80 ? '#10b981' : completePct >= 50 ? '#f59e0b' : '#ef4444' }}>{completePct}%</div>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: '3px', marginBottom: '1rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completePct}%`, background: completePct >= 80 ? '#10b981' : completePct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {sections.map(section => {
                const sFields = fields[section.id] || [];
                const isFilled = sFields.some(f => {
                  const val = formData[`${section.id}__${f.name}`];
                  return val !== undefined && val !== null && val !== '';
                });
                const isActive = activeTab === section.id;
                return (
                  <button key={section.id} onClick={() => setActiveTab(section.id)} style={{
                    padding: '0.6rem 0.85rem', borderRadius: '10px', border: isActive ? '2px solid #D4AF37' : '1px solid #f1f5f9',
                    background: isActive ? '#fef3c7' : '#f8fafc', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className={`fas ${section.icon}`} style={{ color: '#D4AF37', fontSize: '0.7rem', width: 12 }}></i>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e293b' }}>{section.name}</span>
                    </div>
                    <i className={`fas ${isFilled ? 'fa-check-circle' : 'fa-circle'}`} style={{ color: isFilled ? '#10b981' : '#e2e8f0', fontSize: '0.8rem' }}></i>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Form Area */}
      {selectedBusiness ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Business Header */}
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '2px', marginBottom: '0.35rem' }}>
                {selectedTypeName?.toUpperCase()} — DATA STUDIO
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{selectedBusiness.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>/{selectedBusiness.slug}</div>
            </div>
            <button onClick={publishStory} disabled={publishing} style={{
              padding: '0.9rem 2rem', borderRadius: '14px', background: 'linear-gradient(135deg, #D4AF37 0%, #f59e0b 100%)',
              color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              {publishing ? <><i className="fas fa-spinner fa-spin"></i> PUBLISHING...</> : <><i className="fas fa-rocket"></i> PUBLISH STORY</>}
            </button>
          </div>

          {/* Section Tabs */}
          {sections.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: '#f8fafc', padding: '0.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                {sections.map(section => {
                  const sFields = fields[section.id] || [];
                  const isFilled = sFields.some(f => {
                    const val = formData[`${section.id}__${f.name}`];
                    return val !== undefined && val !== null && val !== '';
                  });
                  const isActive = activeTab === section.id;
                  return (
                    <button key={section.id} onClick={() => setActiveTab(section.id)} style={{
                      padding: '0.6rem 1.1rem', borderRadius: '10px',
                      border: isActive ? '2px solid #D4AF37' : '1.5px solid transparent',
                      background: isActive ? '#fff' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s'
                    }}>
                      <i className={`fas ${section.icon}`} style={{ color: isActive ? '#D4AF37' : '#94a3b8', fontSize: '0.75rem' }}></i>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isActive ? '#1e293b' : '#64748b' }}>{section.name}</span>
                      {isFilled && <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '0.65rem' }}></i>}
                    </button>
                  );
                })}
              </div>

              {/* Active Section Form */}
              {sections.filter(s => s.id === activeTab).map(section => (
                <div key={section.id} style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: '1.1rem' }}>
                        <i className={`fas ${section.icon}`}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>{section.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{(fields[section.id] || []).length} fields in this section</div>
                      </div>
                    </div>
                    <button onClick={() => saveSection(section.id)} disabled={saving} style={{
                      padding: '0.65rem 1.5rem', borderRadius: '12px', background: '#1e293b', color: '#fff',
                      border: 'none', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      {saving ? <><i className="fas fa-spinner fa-spin"></i> SAVING...</> : <><i className="fas fa-save"></i> SAVE SECTION</>}
                    </button>
                  </div>

                  {(fields[section.id] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <i className="fas fa-puzzle-piece fa-2x" style={{ color: '#e2e8f0', marginBottom: '1rem' }}></i>
                      <div style={{ fontWeight: 700 }}>No fields defined for this section</div>
                      <div style={{ fontSize: '0.75rem' }}>Go to Stage 1 → Schema Builder to add fields to this section</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {(fields[section.id] || []).map((field: any) => (
                        <div key={field.id}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#374151', marginBottom: '0.6rem' }}>
                            {field.label}
                            {field.required && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>*</span>}
                            {field.vendor_editable && <span style={{ fontSize: '0.55rem', background: '#e0f2fe', color: '#0284c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>VENDOR EDITABLE</span>}
                          </label>
                          {field.help_text && !['rich_text'].includes(field.field_type) && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{field.help_text}</div>
                          )}
                          {renderField(section, field)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {sections.length === 0 && (
            <div style={{ background: '#fff', borderRadius: '20px', padding: '3rem', border: '2px dashed #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
              <i className="fas fa-blueprint fa-2x" style={{ color: '#e2e8f0', marginBottom: '1rem' }}></i>
              <div style={{ fontWeight: 700 }}>No sections defined for {selectedTypeName}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Go to Stage 1 to build the schema first</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '20px', border: '2px dashed #e2e8f0', padding: '4rem', color: '#94a3b8', textAlign: 'center', gap: '1rem' }}>
          <i className="fas fa-hand-pointer fa-2x" style={{ color: '#e2e8f0' }}></i>
          <div style={{ fontWeight: 800 }}>Select a business from the list</div>
          <div style={{ fontSize: '0.75rem' }}>Or register a new one using the button below the list</div>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}
