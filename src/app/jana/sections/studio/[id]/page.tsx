'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import TagInput from '@/components/TagInput';
import { SIWA_DEFS } from '@/lib/governance/constants';

const SECTION_ICONS = SIWA_DEFS.sectionIcons;
const FIELD_LIBRARY = SIWA_DEFS.fieldLibrary;

/**
 * 🏛️ SIWA SECTION STUDIO (COMMAND CENTER)
 * High-fidelity orchestrator for section DNA and Ecosystem Propagation.
 */
export default function SectionStudioPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useAdmin();

  const [section, setSection] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const initialTab = (searchParams.get('tab') as any) || 'dna';
  const [activeTab, setActiveTab] = useState<'dna' | 'items' | 'wiring' | 'components' | 'feed'>(initialTab);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [multiBusinessData, setMultiBusinessData] = useState<Record<string, any>>({});
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [expressions, setExpressions] = useState<any[]>([]);
  const [optionMode, setOptionMode] = useState<'custom' | 'expression'>('custom');

  useEffect(() => {
    if (id) loadData();
    loadBusinesses();
  }, [id]);

  async function loadBusinesses() {
    try {
      // Fetch businesses with their type metadata for governance checks
      const t = Date.now();
      const res = await fetch(`/api/jana/businesses?includeType=true&t=${t}`);
      if (res.ok) {
        const allBiz = await res.json();
        
        // GOVERNANCE FILTER: Only show businesses authorized for this section
        const filtered = allBiz.filter((biz: any) => {
          if (section?.is_universal) return true;
          
          // Check if the business type includes this section ID
          const typeSections = [
            ...(typeof biz.type_sections === 'string' ? JSON.parse(biz.type_sections || '[]') : biz.type_sections || []),
            ...(typeof biz.type_own_sections === 'string' ? JSON.parse(biz.type_own_sections || '[]') : biz.type_own_sections || [])
          ];
          
          return typeSections.includes(id);
        });
        
        setBusinesses(filtered);
      }
    } catch (e) { console.error(e); }
  }

  // Fetch data for all businesses for THIS section
  useEffect(() => {
    if (activeTab === 'feed' && id) {
      loadMultiFeed();
    }
  }, [activeTab, id]);

  async function loadMultiFeed() {
    try {
      const res = await fetch(`/api/jana/data-feed?sectionId=${id}`);
      if (res.ok) {
        const data = await res.json();
        // Convert array to Record<business_id, Record<field_name, value>>
        const mapping: any = {};
        data.forEach((row: any) => {
          if (!mapping[row.business_id]) mapping[row.business_id] = {};
          mapping[row.business_id][row.field_name] = row.value;
        });
        setMultiBusinessData(mapping);
      }
    } catch (e) { console.error(e); }
  }

  async function saveMultiFeed() {
    try {
      await fetch('/api/jana/data-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: id, data: multiBusinessData })
      });
      notify('Global Data Synchronized!', 'success');
    } catch (e) { notify('Mass Sync Failed', 'error'); }
  }

  // Editor States
  const [inspectingField, setInspectingField] = useState<any | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  async function loadData() {
    setLoading(true);
    try {
      const t = Date.now();
      const [secRes, fieldsRes, typesRes, exprRes] = await Promise.all([
        fetch(`/api/jana/sections?id=${id}&t=${t}`),
        fetch(`/api/jana/forms?type=SECTION_TEMPLATE&section=${id}&t=${t}`),
        fetch(`/api/jana/types?t=${t}`),
        fetch(`/api/jana/expressions?t=${t}`)
      ]);
      if (exprRes.ok) setExpressions(await exprRes.json());
      
      if (secRes.ok) setSection(await secRes.json());
      if (fieldsRes.ok) {
        const fieldData = await fieldsRes.json();
        setFields(fieldData);
        
        // ATOMIC DEEP-LINK: If a field is specified in URL, inspect it immediately
        const targetField = searchParams.get('field');
        if (targetField) {
          const found = fieldData.find((f: any) => f.name === targetField || f.id === targetField);
          if (found) setInspectingField(found);
        }
      }
      if (typesRes.ok) setBusinessTypes(await typesRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveSection() {
    try {
      const res = await fetch('/api/jana/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(section)
      });
      if (res.ok) notify('Section Sovereignty Synchronized ✓', 'success');
    } catch (e) { notify('Sync Failed', 'error'); }
  }

  async function saveField() {
    if (!inspectingField) return;
    try {
      await fetch('/api/jana/forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectingField)
      });
      notify('Field DNA updated.', 'success');
      loadData();
      setInspectingField(null);
    } catch (e) { notify('Field Update Failed', 'error'); }
  }

  async function addField() {
    if (!newFieldLabel.trim()) {
      notify('Please enter a Field Label before saving.', 'error');
      return;
    }
    const name = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    try {
      const res = await fetch('/api/jana/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type_id: 'SECTION_TEMPLATE',
          section_id: id,
          name,
          label: newFieldLabel,
          field_type: newFieldType
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save field');
      }

      notify('Field added to blueprint.', 'success');
      setAddingField(false);
      setNewFieldLabel('');
      loadData();
    } catch (e: any) { notify(e.message || 'Failed to add field', 'error'); }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <i className="fas fa-microchip fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
       <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.75rem' }}>INITIALIZING SOVEREIGN STUDIO...</div>
    </div>
  );

  if (!section) return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <h2 style={{ color: '#1e293b' }}>Section Architecture Not Found</h2>
       <Link href="/jana/sections" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none', marginTop: '1rem' }}>RETURN TO ARCHITECT</Link>
    </div>
  );

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* TOP NAVIGATION BAR */}
      <nav style={{ background: '#fff', padding: '1rem 3rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/jana/sections" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: '1.25rem' }}>
              <i className={`fas ${section.icon}`}></i>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{section.name} Studio</h1>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>{section?.id?.toUpperCase()} • ORCHESTRATION MODE</div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={saveSection} style={{ background: '#D4AF37', color: '#1a1a2e', padding: '0.75rem 2rem', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,175,55,0.2)' }}>
              SAVE SOVEREIGNTY
           </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        
        {/* LEFT: LAYER NAVIGATION */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { id: 'dna', label: '1. GOVERNANCE DNA', icon: 'fa-dna' },
            { id: 'items', label: '2. ATOMIC BLUEPRINT', icon: 'fa-cubes' },
            { id: 'wiring', label: '3. ECOSYSTEM WIRING', icon: 'fa-project-diagram' },
            { id: 'components', label: '4. COMPONENT LOGIC', icon: 'fa-code-branch' },
            { id: 'feed', label: '5. GLOBAL DATA FEED', icon: 'fa-server' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{ 
                padding: '1.25rem 1.5rem', borderRadius: '16px', border: 'none', textAlign: 'left',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                fontWeight: activeTab === tab.id ? 900 : 600,
                fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                boxShadow: activeTab === tab.id ? '0 10px 20px -5px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.id ? '#D4AF37' : '#cbd5e1' }}></i>
              {tab.label}
            </button>
          ))}

          <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
             <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem' }}>ORCHESTRATION STATUS</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: section.propagation_hero ? 1 : 0.4 }}>
                   <i className="fas fa-film" style={{ color: '#D4AF37' }}></i>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Hero Sync Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: section.propagation_blog ? 1 : 0.4 }}>
                   <i className="fas fa-feather-alt" style={{ color: '#D4AF37' }}></i>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Blog Sync Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: section.is_filterable ? 1 : 0.4 }}>
                   <i className="fas fa-search" style={{ color: '#D4AF37' }}></i>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Discovery Active</span>
                </div>
             </div>
          </div>
        </aside>

        {/* RIGHT: LAYER CONTENT */}
        <section style={{ background: '#fff', borderRadius: '32px', border: '1px solid #e2e8f0', minHeight: '600px', padding: '3rem', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.03)' }}>
          
          {/* TAB 1: GOVERNANCE DNA */}
          {activeTab === 'dna' && (
            <div className="animate-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem' }}>Governance DNA</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input type="text" className="form-control" value={section.name || ''} onChange={e => setSection({ ...section, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Database ID (Static)</label>
                  <input type="text" className="form-control" value={section.id} readOnly style={{ background: '#f8fafc', color: '#94a3b8', fontFamily: 'monospace' }} />
                </div>
                <div className="form-group">
                   <label className="form-label">System Icon</label>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                      {SECTION_ICONS.map(icon => (
                        <div key={icon} onClick={() => setSection({...section, icon})} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '8px', border: section.icon === icon ? '2px solid #D4AF37' : '1px solid transparent', background: section.icon === icon ? '#fff' : 'transparent' }}>
                           <i className={`fas ${icon}`} style={{ color: section.icon === icon ? '#D4AF37' : '#cbd5e1' }}></i>
                        </div>
                      ))}
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <label className="form-label">Inheritance & Governance</label>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!section.is_universal} onChange={e => setSection({...section, is_universal: e.target.checked})} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Universal Block</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Applies to every single business in the oasis registry.</div>
                      </div>
                   </label>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!section.required} onChange={e => setSection({...section, required: e.target.checked})} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Mandatory Requirement</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Vendors cannot publish their minisite without this data.</div>
                      </div>
                   </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATOMIC BLUEPRINT */}
          {activeTab === 'items' && (
            <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
               <div>
                 {/* STUDIO HEADER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <Link href="/jana/sections" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
                          <i className="fas fa-arrow-left"></i> Architect Dashboard
                        </Link>
                        <span style={{ 
                          background: '#D4AF37', 
                          color: '#fff', 
                          fontSize: '0.65rem', 
                          fontWeight: 900, 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          letterSpacing: '1px',
                          boxShadow: '0 4px 10px rgba(212,175,55,0.3)'
                        }}>
                          <i className="fas fa-microchip" style={{ marginRight: '0.5rem' }}></i>
                          ORCHESTRATION MODE
                        </span>
                      </div>
                      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, color: '#1e293b', letterSpacing: '-1px' }}>
                        {section?.name.toUpperCase()} <span style={{ color: '#D4AF37' }}>STUDIO</span>
                      </h1>
                      <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                        Orchestrating the DNA, Blueprint, and Global Feed for the <strong>{section?.name}</strong> ecosystem.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Atomic Blueprint</h2>
                    <button onClick={() => setAddingField(true)} style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>+ ADD FIELD</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     {fields.map(f => (
                       <div key={f.id} onClick={() => setInspectingField(f)} style={{ padding: '1rem 1.5rem', background: inspectingField?.id === f.id ? '#f0f4ff' : '#fff', border: inspectingField?.id === f.id ? '2px solid #3b82f6' : '1px solid #f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                             <div style={{ width: '40px', height: '40px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className={`fas ${FIELD_LIBRARY.find(l => l.id === f.field_type)?.icon || 'fa-cube'}`} style={{ color: '#D4AF37' }}></i>
                             </div>
                             <div>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{f.label}</div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{f.field_type.toUpperCase()} • {f.searchable ? 'FILTERABLE' : 'INFO ONLY'}</div>
                             </div>
                          </div>
                          <i className="fas fa-chevron-right" style={{ color: '#cbd5e1' }}></i>
                       </div>
                     ))}
                  </div>

                  {addingField && (
                    <div style={{ marginTop: '2rem', padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                       <input type="text" placeholder="Field Label (e.g. Price Range)" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontWeight: 700 }} />
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                          {FIELD_LIBRARY.map(t => (
                            <button key={t.id} onClick={() => setNewFieldType(t.id)} style={{ padding: '0.75rem', borderRadius: '10px', border: newFieldType === t.id ? `2px solid ${t.color}` : '1px solid #e2e8f0', background: '#fff', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                               <i className={`fas ${t.icon}`} style={{ color: t.color, display: 'block', marginBottom: '4px' }}></i> {t.name}
                            </button>
                          ))}
                       </div>
                       <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={addField} style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#D4AF37', fontWeight: 900 }}>SAVE TO BLUEPRINT</button>
                          <button onClick={() => setAddingField(false)} style={{ padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#f1f5f9', fontWeight: 900 }}>CANCEL</button>
                       </div>
                    </div>
                  )}
               </div>

               {/* FIELD INSPECTOR */}
               <aside>
                  {inspectingField ? (
                    <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', position: 'sticky', top: '6rem' }}>
                       <h3 style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', fontWeight: 900, color: '#D4AF37' }}>ITEM INSPECTOR</h3>
                       <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>LABEL</label>
                          <input type="text" className="form-control" value={inspectingField.label} onChange={e => setInspectingField({...inspectingField, label: e.target.value})} />
                       </div>
                       <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>PERMISSION FLAGS</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#fff', borderRadius: '10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}>
                             <input type="checkbox" checked={!!inspectingField.searchable} onChange={e => setInspectingField({...inspectingField, searchable: e.target.checked})} /> INCLUDE IN FILTER UI
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#fff', borderRadius: '10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}>
                             <input type="checkbox" checked={!!inspectingField.vendor_editable} onChange={e => setInspectingField({...inspectingField, vendor_editable: e.target.checked})} /> VENDOR EDITABLE
                          </label>
                       </div>

                       {['select', 'multiselect'].includes(inspectingField.field_type) && (
                         <div style={{ marginTop: '1.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.65rem' }}>DATA OPTIONS</label>
                            <TagInput value={Array.isArray(inspectingField.options) ? inspectingField.options : []} onChange={tags => setInspectingField({...inspectingField, options: tags})} />
                         </div>
                       )}

                       <button onClick={saveField} style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '12px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>APPLY BLUEPRINT</button>
                       
                       <button 
                        onClick={() => setActiveTab('feed')}
                        style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)', fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem' }}
                       >
                          FEED THIS DATA →
                       </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', border: '2px dashed #f1f5f9', borderRadius: '24px' }}>
                       Select a field to inspect its atomic properties.
                    </div>
                  )}
               </aside>
            </div>
          )}

          {/* TAB 3: ECOSYSTEM WIRING */}
          {activeTab === 'wiring' && (
            <div className="animate-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Ecosystem Wiring</h2>
              <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>Control how this section's data propagates through the portal's high-fidelity channels.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* HERO PROPAGATION */}
                <div style={{ padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', background: section.propagation_hero ? 'rgba(212,175,55,0.03)' : '#fff', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                   <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: section.propagation_hero ? '#D4AF37' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.propagation_hero ? '#fff' : '#94a3b8', fontSize: '1.5rem' }}>
                      <i className="fas fa-film"></i>
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Minisite Hero Propagation</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        When enabled, all images in this section's gallery fields will automatically feed the cinematic hero carousel on the business's public minisite.
                      </div>
                   </div>
                   <label className="switch">
                      <input type="checkbox" checked={!!section.propagation_hero} onChange={e => setSection({...section, propagation_hero: e.target.checked})} />
                      <span className="slider round"></span>
                   </label>
                </div>

                {/* BLOG PROPAGATION */}
                <div style={{ padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', background: section.propagation_blog ? 'rgba(59,130,246,0.03)' : '#fff', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                   <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: section.propagation_blog ? '#3b82f6' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.propagation_blog ? '#fff' : '#94a3b8', fontSize: '1.5rem' }}>
                      <i className="fas fa-feather-alt"></i>
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Master Blog Synchronization</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        Automatically publish long-form content from this section to the business's centralized blog feed and the portal's experience discovery engine.
                      </div>
                   </div>
                   <label className="switch">
                      <input type="checkbox" checked={!!section.propagation_blog} onChange={e => setSection({...section, propagation_blog: e.target.checked})} />
                      <span className="slider round"></span>
                   </label>
                </div>

                {/* SEARCH PROPAGATION */}
                <div style={{ padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', background: section.is_filterable ? 'rgba(16,185,129,0.03)' : '#fff', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                   <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: section.is_filterable ? '#10b981' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.is_filterable ? '#fff' : '#94a3b8', fontSize: '1.5rem' }}>
                      <i className="fas fa-search-plus"></i>
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Discovery Filter Integration</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        Enable this section to contribute its 'Sovereign Fields' to the global search engine filters.
                      </div>
                   </div>
                   <label className="switch">
                      <input type="checkbox" checked={!!section.is_filterable} onChange={e => setSection({...section, is_filterable: e.target.checked})} />
                      <span className="slider round"></span>
                   </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GLOBAL DATA FEED */}
          {activeTab === 'feed' && (
            <div className="animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Global Data Feed</h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Directly populate this section for multiple businesses across the oasis.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {/* HIERARCHY FILTER */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <i className="fas fa-filter" style={{ color: '#94a3b8', fontSize: '0.75rem' }}></i>
                    <select 
                      style={{ background: 'transparent', border: 'none', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', outline: 'none', cursor: 'pointer' }}
                      value={selectedTypeId || ''}
                      onChange={e => setSelectedTypeId(e.target.value || null)}
                    >
                      <option value="">ALL TYPOLOGIES</option>
                      {businessTypes.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.parent_id ? '↳ ' : '■ '}{t.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={saveMultiFeed}
                    style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <i className="fas fa-sync"></i>
                    MASS SYNCHRONIZE
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', width: '250px' }}>BUSINESS</th>
                      {fields.map(f => (
                        <th key={f.id} style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>{f.label.toUpperCase()}</div>
                            <Link 
                              href={`/jana/sections/studio/${id}?tab=items&field=${f.name}`}
                              style={{ color: '#cbd5e1', fontSize: '0.6rem', textDecoration: 'none' }}
                              title="Edit Field Blueprint"
                            >
                              <i className="fas fa-pencil-ruler"></i>
                            </Link>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.filter(biz => !selectedTypeId || biz.type_id === selectedTypeId || biz.parent_id === selectedTypeId).map(biz => (
                      <tr key={biz.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {biz.logo_url ? <img src={biz.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-store" style={{ color: '#cbd5e1' }}></i>}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800 }}>{biz.name}</div>
                              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>ID: {biz.id}</div>
                            </div>
                          </div>
                        </td>
                        {fields.map(f => (
                          <td key={f.id} style={{ padding: '1rem', verticalAlign: 'top' }}>
                            {f.field_type === 'boolean' || f.field_type === 'checkbox' ? (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <div style={{ position: 'relative', width: '40px', height: '22px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!(multiBusinessData[biz.id]?.[f.name])}
                                    onChange={e => {
                                      const newData = { ...multiBusinessData };
                                      if (!newData[biz.id]) newData[biz.id] = {};
                                      newData[biz.id][f.name] = e.target.checked;
                                      setMultiBusinessData(newData);
                                    }}
                                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                  />
                                  <span style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '22px',
                                    background: multiBusinessData[biz.id]?.[f.name] ? '#D4AF37' : '#cbd5e1', transition: '0.3s',
                                  }}>
                                    <span style={{
                                      position: 'absolute', height: '16px', width: '16px', left: multiBusinessData[biz.id]?.[f.name] ? '21px' : '3px', bottom: '3px',
                                      background: '#fff', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}></span>
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: multiBusinessData[biz.id]?.[f.name] ? '#1e293b' : '#94a3b8' }}>
                                  {multiBusinessData[biz.id]?.[f.name] ? 'ON' : 'OFF'}
                                </span>
                              </label>
                            ) : f.field_type === 'select' || f.field_type === 'multiselect' ? (
                              <select 
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', outlineColor: '#3b82f6', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                                value={multiBusinessData[biz.id]?.[f.name] || ''}
                                onChange={e => {
                                  const newData = { ...multiBusinessData };
                                  if (!newData[biz.id]) newData[biz.id] = {};
                                  newData[biz.id][f.name] = e.target.value;
                                  setMultiBusinessData(newData);
                                }}
                              >
                                <option value="">Select...</option>
                                {(Array.isArray(f.options) ? f.options : []).map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : f.field_type === 'gallery' ? (
                              <Link 
                                href={`/jana/businesses/${biz.id}/orchestrate?section=${id}&field=${f.name}`}
                                style={{ padding: '0.6rem 1rem', borderRadius: '10px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                              >
                                <i className="fas fa-camera"></i> GALLERY
                              </Link>
                            ) : f.field_type === 'rich_text' || f.name.includes('blog') || f.name.includes('story') ? (
                              <Link 
                                href={`/jana/businesses/${biz.id}/orchestrate?section=${id}&field=${f.name}`}
                                style={{ padding: '0.6rem 1rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                              >
                                <i className="fas fa-feather-alt"></i> OPEN EDITOR
                              </Link>
                            ) : f.field_type === 'textarea' ? (
                              <textarea 
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', outlineColor: '#3b82f6', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', minHeight: '60px', resize: 'vertical' }}
                                value={multiBusinessData[biz.id]?.[f.name] || ''}
                                onChange={e => {
                                  const newData = { ...multiBusinessData };
                                  if (!newData[biz.id]) newData[biz.id] = {};
                                  newData[biz.id][f.name] = e.target.value;
                                  setMultiBusinessData(newData);
                                }}
                                placeholder="Enter text..."
                              />
                            ) : (
                              <input 
                                type="text"
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', outlineColor: '#3b82f6', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                                value={multiBusinessData[biz.id]?.[f.name] || ''}
                                onChange={e => {
                                  const newData = { ...multiBusinessData };
                                  if (!newData[biz.id]) newData[biz.id] = {};
                                  newData[biz.id][f.name] = e.target.value;
                                  setMultiBusinessData(newData);
                                }}
                                placeholder="Enter value..."
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMPONENTS */}
          {activeTab === 'components' && (
            <div className="animate-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Component Logic</h2>
              <div style={{ background: '#f8fafc', padding: '4rem', borderRadius: '24px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                 <i className="fas fa-tools fa-3x" style={{ color: '#cbd5e1', marginBottom: '2rem' }}></i>
                 <h3 style={{ color: '#1e293b' }}>Section-Specific Logic Orchestrator</h3>
                 <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>This layer allows you to attach functional logic (YouTube, Price Calculators, Booking Widgets) specifically to this section's public minisite page.</p>
                 <button 
                   onClick={() => window.open('/jana/component-library', '_blank')}
                   style={{ marginTop: '2rem', padding: '1rem 2.5rem', borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                 >
                    OPEN COMPONENT LIBRARY
                 </button>
              </div>
            </div>
          )}

        </section>
      </div>

      <style jsx>{`
        .switch { position: relative; display: inline-block; width: 60px; height: 34px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
        input:checked + .slider { background-color: #D4AF37; }
        input:checked + .slider:before { transform: translateX(26px); }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }
        .animate-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}
