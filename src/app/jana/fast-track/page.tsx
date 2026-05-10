'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import DynamicForm from '@/components/DynamicForm';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';

/**
 * SIWA FAST-TRACK: INSTANT MINISITE STUDIO
 * High-octane bridge between Section Architecture and Live Website Creation.
 */

function FastTrackContent() {
  const { notify } = useAdmin();
  const searchParams = useSearchParams();
  const [sections, setSections] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  
  const [selectedBizId, setSelectedBizId] = useState('');
  const [activeSectionIds, setActiveSectionIds] = useState<string[]>(searchParams.get('sectionId') ? [searchParams.get('sectionId')!] : []);
  const [focusedSectionId, setFocusedSectionId] = useState(searchParams.get('sectionId') || '');
  const [businessData, setBusinessData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [templateSections, setTemplateSections] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/jana/sections').then(r => r.json()),
      fetch('/api/jana/businesses').then(r => r.json()),
      fetch('/api/jana/templates').then(r => r.json())
    ]).then(([sData, bData, tmplData]) => {
      setSections(Array.isArray(sData) ? sData : []);
      setBusinesses(Array.isArray(bData) ? bData : []);
      setTemplates(Array.isArray(tmplData) ? tmplData : []);
      setLoading(false);
    }).catch(err => {
      console.error('Fast-Track Data Fetch Error:', err);
      setLoading(false);
    });
  }, []);

  const [templates, setTemplates] = useState<any[]>([]);

  // When business changes, load its data and template
  useEffect(() => {
    if (selectedBizId && Array.isArray(businesses)) {
      const biz = businesses.find(b => b.id === selectedBizId);
      if (biz) {
        const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data || {};
        setBusinessData(data);
        
        // Find Template Sections
        const tmplId = biz.template_id;
        const tmpl = templates.find(t => t.id === tmplId);
        if (tmpl && Array.isArray(tmpl.layout)) {
          // Layout is flat array of components with 'type' (which is sectionId for sections)
          const blueprintIds = tmpl.layout.map((c: any) => c.type).filter(Boolean);
          setTemplateSections(blueprintIds);
        } else {
          setTemplateSections([]);
        }

        // Sync active sections from data keys
        const dataKeys = Object.keys(data).filter(k => sections.some(s => s.id === k));
        if (dataKeys.length > 0) setActiveSectionIds(dataKeys);
      }
    }
  }, [selectedBizId, businesses, sections, templates]);

  // When focused section changes, load its fields
  useEffect(() => {
    if (focusedSectionId) {
      fetch(`/api/jana/forms?type=SECTION_TEMPLATE&section=${focusedSectionId}`)
        .then(r => r.json())
        .then(fData => setFields(fData));
    }
  }, [focusedSectionId]);

  const toggleSection = (id: string) => {
    setActiveSectionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (!focusedSectionId) setFocusedSectionId(id);
  };

  const handleSave = async () => {
    if (!selectedBizId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBizId,
          custom_data: businessData
        })
      });
      if (res.ok) notify('Studio Blueprint Published', 'success');
    } catch (e) { notify('Synchronization Failed', 'error'); }
    setSaving(false);
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#D4AF37', fontWeight: 900 }}>INITIALIZING STUDIO...</div>;

  const currentBiz = Array.isArray(businesses) ? businesses.find(b => b.id === selectedBizId) : null;
  const currentSection = Array.isArray(sections) ? sections.find(s => s.id === focusedSectionId) : null;

  const renderSectionButton = (s: any, isBlueprint: boolean) => {
    const isActive = activeSectionIds.includes(s.id);
    const isExtra = isActive && !isBlueprint;
    const isFocused = focusedSectionId === s.id;
    
    // Color Logic
    let borderColor = '#e2e8f0';
    let bgColor = '#fff';
    let textColor = '#1e293b';
    let tag = null;

    if (isBlueprint) {
      borderColor = isActive ? '#6366f1' : '#e2e8f0';
      bgColor = isActive ? '#6366f110' : '#fff';
      tag = <span style={{ position: 'absolute', top: '-6px', right: '10px', background: isActive ? '#6366f1' : '#94a3b8', color: '#fff', fontSize: '0.45rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>{isActive ? 'CORE ACTIVE' : 'MANDATORY'}</span>;
    } else {
      borderColor = isActive ? '#D4AF37' : '#e2e8f0';
      bgColor = isActive ? '#D4AF3710' : '#fff';
      tag = isActive ? <span style={{ position: 'absolute', top: '-6px', right: '10px', background: '#D4AF37', color: '#fff', fontSize: '0.45rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>OPPORTUNITY ACTIVE</span> : null;
    }

    return (
      <div key={s.id} style={{ position: 'relative', marginTop: tag ? '6px' : '0' }}>
        {tag}
        <button 
          onClick={() => toggleSection(s.id)}
          style={{ 
            width: '100%', padding: '0.75rem', borderRadius: '10px', border: `2px solid ${borderColor}`,
            background: bgColor, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
            paddingRight: '2rem', minHeight: '48px'
          }}
        >
          <i className={`fas ${s.icon}`} style={{ color: isBlueprint ? (isActive ? '#6366f1' : '#94a3b8') : (isActive ? '#D4AF37' : '#94a3b8'), marginRight: '0.5rem' }}></i>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: textColor, opacity: isBlueprint || isActive ? 1 : 0.4 }}>{s.name}</span>
          {isActive && <i className="fas fa-check-circle" style={{ position: 'absolute', right: 10, top: 12, color: isBlueprint ? '#6366f1' : '#D4AF37', fontSize: '0.8rem' }}></i>}
        </button>
        {isActive && (
          <button 
            onClick={(e) => { e.stopPropagation(); setFocusedSectionId(s.id); }}
            style={{ 
              marginTop: '4px', width: '100%', padding: '4px', border: 'none', background: isFocused ? '#1e293b' : '#f1f5f9', 
              color: isFocused ? '#fff' : '#64748b', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' 
            }}
          >
            {isFocused ? 'EDITING...' : 'EDIT DATA'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      
      {/* LEFT: THE CONTROL HUB */}
      <div style={{ background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', background: '#0f172a', color: '#fff' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>FAST-TRACK BUILDER</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>INSTANT <span style={{ color: '#D4AF37' }}>STUDIO</span></h2>
        </div>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          
          {/* Step 1: Select Business */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>1. TARGET ENTITY</label>
            <select 
              className="form-control" 
              value={selectedBizId} 
              onChange={e => setSelectedBizId(e.target.value)}
              style={{ fontWeight: 800, border: '2px solid #e2e8f0' }}
            >
              <option value="">-- SELECT BUSINESS --</option>
              {Array.isArray(businesses) && businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Step 2: Select Sections */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', display: 'block', marginBottom: '1.5rem' }}>2. SITE ARCHITECTURE & OPPORTUNITIES</label>
            
            {/* CORE BLUEPRINT GROUP */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#6366f1', background: '#6366f110', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
                <i className="fas fa-layer-group"></i> BLUEPRINT CORE (MANDATORY)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {Array.isArray(sections) && sections
                  .filter(s => templateSections.includes(s.id))
                  .sort((a, b) => (activeSectionIds.includes(b.id) ? 1 : 0) - (activeSectionIds.includes(a.id) ? 1 : 0))
                  .map(s => renderSectionButton(s, true))}
              </div>
            </div>

            {/* OPPORTUNITIES GROUP */}
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', background: '#D4AF3710', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
                <i className="fas fa-star"></i> ADVANCED OPPORTUNITIES (OPTIONAL)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {Array.isArray(sections) && sections
                  .filter(s => !templateSections.includes(s.id))
                  .sort((a, b) => (activeSectionIds.includes(b.id) ? 1 : 0) - (activeSectionIds.includes(a.id) ? 1 : 0))
                  .map(s => renderSectionButton(s, false))}
              </div>
            </div>
          </div>

          {/* Step 3: Navigation Branding */}
          {activeSectionIds.length > 0 && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>3. NAVIGATION BRANDING (OPTIONAL)</label>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {sections.filter(s => activeSectionIds.includes(s.id)).map(s => (
                  <div key={s.id}>
                    <label style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                       {s.name.toUpperCase()} TAB LABEL
                    </label>
                    <input 
                      className="form-control"
                      style={{ fontSize: '0.7rem', height: '32px' }}
                      placeholder={s.name}
                      value={businessData.section_labels?.[s.id] || ''}
                      onChange={(e) => {
                        const nextLabels = { ...businessData.section_labels || {} };
                        nextLabels[s.id] = e.target.value;
                        setBusinessData({ ...businessData, section_labels: nextLabels });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Fill DNA */}
          {focusedSectionId && selectedBizId ? (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px' }}>4. EDITING: {currentSection?.name}</div>
                  <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '2px' }}>DATA WILL SYNC TO PREVIEW AUTOMATICALLY</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => window.open(`/jana/sections`, '_blank')}
                    style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '6px 12px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fas fa-cube"></i> ARCHITECT PRINCIPALS
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ 
                      background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.2)'
                    }}
                  >
                    {saving ? 'SYNCING...' : 'PUBLISH SITE'}
                  </button>
                </div>
              </div>
              <DynamicForm 
                fields={fields}
                data={businessData}
                sections={sections}
                userRole="admin"
                onChange={(sid, name, val) => setBusinessData({ ...businessData, [sid]: { ...(businessData[sid] || {}), [name]: val } })}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.3 }}>
              <i className="fas fa-mouse-pointer fa-2x" style={{ marginBottom: '1rem' }}></i>
              <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>Select a Business & Section to begin building.</div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: THE LIVE MINISITE PREVIEW */}
      <div style={{ background: '#0f172a', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 3000, display: 'flex', gap: '1rem' }}>
           <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 900, border: '1px solid rgba(34,197,94,0.2)' }}>
             <i className="fas fa-circle" style={{ fontSize: '0.4rem', marginRight: '0.5rem', verticalAlign: 'middle' }}></i> LIVE SYNC ACTIVE
           </div>
           {selectedBizId && (
             <div style={{ display: 'flex', gap: '0.5rem' }}>
               <button 
                 onClick={() => {
                   const slug = businesses.find(b => b.id === selectedBizId)?.slug || selectedBizId;
                   const url = `${window.location.origin}/${slug}`;
                   navigator.clipboard.writeText(url);
                   notify('Premium Link Copied!', 'success');
                 }}
                 className="btn btn-xs" 
                 style={{ background: '#1e293b', color: '#fff', fontWeight: 900, border: '1px solid #D4AF37' }}
               >
                 <i className="fas fa-copy" style={{ marginRight: '0.5rem' }}></i> COPY LINK
               </button>
               <a href={`/${businesses.find(b => b.id === selectedBizId)?.slug || selectedBizId}`} target="_blank" className="btn btn-xs" style={{ background: '#D4AF37', color: '#1a1a2e', fontWeight: 900 }}>VIEW PUBLIC SITE</a>
             </div>
           )}
        </div>

        {selectedBizId ? (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <AutomatedMinisiteHero 
              businessName={currentBiz?.name || 'NEW BUSINESS'}
              customData={businessData}
              activeSections={sections.filter(s => businessData[s.id])}
              tierFeatures={{ hero_automation: true }}
              settings={{ 
                height: '100vh', 
                showLogoInHero: true,
                primaryColor: '#D4AF37'
              }}
            />
            
            {/* Detailed Body Preview */}
            <div style={{ padding: '5rem', background: '#fff', color: '#1e293b' }}>
               <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>{currentSection?.name || 'Section Content'}</h3>
               <p style={{ opacity: 0.6, lineHeight: 1.8 }}>This is a high-fidelity preview of how your content integrates into the minisite structure.</p>
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', flexDirection: 'column', gap: '2rem' }}>
             <i className="fas fa-desktop fa-5x"></i>
             <h3 style={{ fontWeight: 900, letterSpacing: '4px' }}>LIVE PREVIEW ENGINE</h3>
          </div>
        )}
      </div>

    </div>
  );
}

export default function FastTrackPage() {
  return (
    <Suspense fallback={<div>Loading Studio...</div>}>
      <FastTrackContent />
    </Suspense>
  );
}
