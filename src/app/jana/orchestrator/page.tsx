'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DynamicForm from '@/components/DynamicForm';
import { useAdmin } from '@/context/AdminContext';

/**
 * GOVERNANCE ORCHESTRATOR (PREMIUM)
 * The world-class onboarding engine for Siwa Oasis entities.
 * 
 * TERMINOLOGY DECLARATION:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * • "ARCHITECTURE" Step: Workflow phase/stage in the onboarding process
 * • "Typology/Typologies": Business classification taxonomy (Hotel, Restaurant, etc.)
 * 
 * This component uses both terms intentionally:
 *   - Step names (ARCHITECTURE, AESTHETICS, DNA_CONFIG, etc.) → Process/workflow structure
 *   - UI headings ("Select Typology") → Data model/business categories being selected
 * 
 * These are NOT synonymous and serve different conceptual purposes.
 * Developers: Do not standardize these to one term—this distinction is intentional.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

type Step = 'ARCHITECTURE' | 'AESTHETICS' | 'DNA_CONFIG' | 'AUTHORITY' | 'DEPLOYMENT';

interface WizardState {
  step: Step;
  selectedParent: string;
  selectedType: string;
  businessName: string;
  selectedVendor: string;
  businessData: Record<string, any>;
  minisiteTemplate: string;
  fields: any[];
  createdBizId?: string;
}

const STORAGE_KEY = 'siwa_governance_wizard_state';
const STEPS: Step[] = ['ARCHITECTURE', 'AESTHETICS', 'DNA_CONFIG', 'AUTHORITY', 'DEPLOYMENT'];

function OrchestratorContent() {
  const { notify } = useAdmin();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [typologies, setTypologies] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [visualTemplates, setVisualTemplates] = useState<any[]>([]);

  const [state, setState] = useState<WizardState>({
    step: 'ARCHITECTURE',
    selectedParent: '',
    selectedType: searchParams.get('type') || '',
    businessName: '',
    selectedVendor: '',
    businessData: {},
    minisiteTemplate: 'desert_luxury_v1',
    fields: []
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (searchParams.get('type')) parsed.selectedType = searchParams.get('type');
        if (searchParams.get('template')) parsed.minisiteTemplate = searchParams.get('template');
        
        // Auto-fix for old cached states (e.g., if step was 'IDENTITY' or 'AMBIENCE')
        if (parsed.step && !STEPS.includes(parsed.step)) {
          parsed.step = 'ARCHITECTURE';
        }
        
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    } else if (searchParams.get('template')) {
      setState(prev => ({ ...prev, minisiteTemplate: searchParams.get('template') || prev.minisiteTemplate }));
    }

    Promise.all([
      fetch('/api/jana/types').then(res => res.json()),
      fetch('/api/jana/vendors').then(res => res.json()),
      fetch('/api/jana/sections').then(res => res.json()),
      fetch('/api/jana/templates').then(res => res.json()).catch(() => [])
    ]).then(([types, vendorList, sectionsList, visualList]) => {
      setTypologies(Array.isArray(types) ? types : []);
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setAllSections(Array.isArray(sectionsList) ? sectionsList : []);
      setVisualTemplates(Array.isArray(visualList) ? visualList : []);
      setLoading(false);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loading]);

  useEffect(() => {
    if (state.selectedType) {
      fetch(`/api/jana/forms?type=${state.selectedType}`)
        .then(res => res.json())
        .then(fields => {
          if (Array.isArray(fields)) updateState({ fields });
        });
    }
  }, [state.selectedType]);

  const updateState = (updates: Partial<WizardState>) => setState(prev => ({ ...prev, ...updates }));

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const bizRes = await fetch('/api/jana/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.businessName,
          type_id: state.selectedType,
          vendor_id: state.selectedVendor,
          template_id: state.minisiteTemplate,
          custom_data: state.businessData,
          status: 'pending'
        })
      });
      if (bizRes.ok) {
        const created = await bizRes.json();
        localStorage.removeItem(STORAGE_KEY);
        updateState({ step: 'DEPLOYMENT', createdBizId: created.id });
        notify('Entity Synthesized Successfully', 'success');
      }
    } catch (err) { notify('Orchestration Failed', 'error'); }
    setLoading(false);
  };

  const nextStep = () => {
    if (state.step === 'AUTHORITY') return handleFinalize();
    const idx = STEPS.indexOf(state.step);
    if (idx < STEPS.length - 1) updateState({ step: STEPS[idx + 1] });
  };

  const prevStep = () => {
    const idx = STEPS.indexOf(state.step);
    if (idx > 0) updateState({ step: STEPS[idx - 1] });
  };

  if (loading) return <div className="loader-screen">ORCHESTRATING...</div>;

  // Filter typologies (business categories) into parent/child hierarchy
  // NOTE: "Typologies" here refers to the DATA MODEL (business classification)
  // NOT the ARCHITECTURE step (which is the workflow process above)
  const parentTypologies = typologies.filter(t => t.is_parent || !t.parent_id);
  const childTypologies = state.selectedParent ? typologies.filter(t => t.parent_id === state.selectedParent) : [];

  return (
    <div className="orchestrator-container">
      <div className="bg-glow"></div>
      
      <div className="wizard-wrapper">
        {/* Wizard Header */}
        <header className="wizard-header">
           <div className="sub-badge">SYSTEM INITIATION</div>
           <h1 className="title">GOVERNANCE <span className="highlight">ORCHESTRATOR</span></h1>
           <p className="subtitle">Architect and deploy high-fidelity entities into the Siwa Oasis registry.</p>
        </header>

        {/* Progress Tracker */}
        <div className="progress-tracker">
           {STEPS.map((s, i) => {
             const active = state.step === s;
             const passed = STEPS.indexOf(state.step) > i;
             return (
               <div key={s} className="progress-step">
                 <div className={`progress-bar ${active || passed ? 'active' : ''}`}></div>
                 <div className={`progress-label ${active ? 'active-text' : passed ? 'passed-text' : ''}`}>{s.replace('_', ' ')}</div>
               </div>
             );
           })}
        </div>

        {/* Active Phase Glass Card */}
        <div className="glass-card animate-in">
          
          {/* STEP 1: ARCHITECTURE - Business Type Selection */}
          {/* NOTE: This STEP is called "ARCHITECTURE" (workflow process),
                    but it displays "Typology" headings (data classification).
                    This is intentional: ARCHITECTURE describes the workflow phase,
                    while "Typology" describes the business category being selected. */}
          {state.step === 'ARCHITECTURE' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>{state.selectedParent ? 'Select Child Typology' : 'Define Master Typology'}</h2>
                {state.selectedParent && (
                  <button onClick={() => updateState({ selectedParent: '', selectedType: '' })} className="btn-undo">
                    <i className="fas fa-undo-alt"></i> CHANGE PARENT
                  </button>
                )}
              </div>
              
              {!state.selectedParent ? (
                <div className="grid-selection">
                  {parentTypologies.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => updateState({ selectedParent: t.id, selectedType: t.id })}
                      className={`selection-card ${state.selectedParent === t.id ? 'selected' : ''}`}
                    >
                      <i className={`fas ${t.icon || 'fa-layer-group'} icon`}></i>
                      <div className="name">{t.name}</div>
                      <div className="tag">PARENT CATEGORY</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid-selection">
                  {childTypologies.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-info-circle"></i>
                      <div>No sub-typologies found. You can proceed with the primary category.</div>
                    </div>
                  ) : childTypologies.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => updateState({ selectedType: t.id })}
                      className={`selection-card child ${state.selectedType === t.id ? 'selected' : ''}`}
                    >
                      <i className={`fas ${t.icon || 'fa-sitemap'} icon`}></i>
                      <div className="name">{t.name}</div>
                      <div className="tag success">CHILD TYPOLOGY</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: AESTHETICS */}
          {state.step === 'AESTHETICS' && (
             <div className="phase-content">
                <div className="phase-header">
                   <h2>Visual Blueprint Selection</h2>
                </div>
                <div className="grid-selection templates">
                   {visualTemplates.length > 0 ? visualTemplates.map(t => (
                     <div 
                        key={t.id} 
                        onClick={() => updateState({ minisiteTemplate: t.id })}
                        className={`template-card ${state.minisiteTemplate === t.id ? 'selected' : ''}`}
                     >
                        <div className="preview-window">
                           <i className={`fas ${t.type_icon || 'fa-magic'} icon`}></i>
                        </div>
                        <div className="info">
                           <div className="name">{t.name?.toUpperCase() || t.id}</div>
                           <div className="tag">{t.type_name ? t.type_name.toUpperCase() : 'UNIVERSAL MINISITE'}</div>
                        </div>
                     </div>
                   )) : (
                     <div className="empty-state">
                       <i className="fas fa-palette"></i>
                       <div>No specific visual templates found. Using 'desert_luxury_v1' fallback.</div>
                     </div>
                   )}
                </div>
             </div>
          )}

          {/* STEP 3: DNA_CONFIG (IDENTITY) */}
          {state.step === 'DNA_CONFIG' && (
            <div className="phase-content">
               <div className="phase-header">
                 <h2>Entity DNA & Content</h2>
               </div>
               
               <div className="form-group main-name-input">
                 <label>PRIMARY ENTITY NAME</label>
                 <input 
                   type="text" 
                   value={state.businessName || ''} 
                   onChange={e => updateState({ businessName: e.target.value })}
                   placeholder="e.g. Adrère Amellal Resort..."
                   autoFocus
                 />
               </div>

               <div className="dna-form-wrapper">
                 <DynamicForm 
                   fields={state.fields}
                   data={state.businessData}
                   sections={allSections}
                   userRole="admin"
                   onChange={(sid, name, val) => updateState({ businessData: { ...state.businessData, [sid]: { ...(state.businessData[sid] || {}), [name]: val } } })}
                 />
               </div>
            </div>
          )}

          {/* STEP 4: AUTHORITY (VENDOR MAPPING) */}
          {state.step === 'AUTHORITY' && (
            <div className="phase-content">
               <div className="phase-header">
                 <h2>Vendor Authority & Ownership</h2>
               </div>
               <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
                 Assign an external vendor to manage this entity, or leave it blank if internally managed.
               </p>
               
               <div className="grid-selection">
                 <button 
                   onClick={() => updateState({ selectedVendor: '' })}
                   className={`selection-card ${!state.selectedVendor ? 'selected' : ''}`}
                 >
                   <i className="fas fa-shield-alt icon" style={{ color: '#10b981' }}></i>
                   <div className="name">Internal Management</div>
                   <div className="tag">SIWA GOVERNANCE</div>
                 </button>
                 
                 {vendors.map(v => (
                   <button 
                     key={v.id} 
                     onClick={() => updateState({ selectedVendor: v.id })}
                     className={`selection-card ${state.selectedVendor === v.id ? 'selected' : ''}`}
                   >
                     <i className="fas fa-user-tie icon" style={{ color: '#3b82f6' }}></i>
                     <div className="name">{v.display_name || v.email}</div>
                     <div className="tag">VENDOR ACCOUNT</div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* STEP 5: DEPLOYMENT (SUCCESS) */}
          {state.step === 'DEPLOYMENT' && (
             <div className="success-content">
                <div className="check-ring">
                  <i className="fas fa-check"></i>
                </div>
                <h2>Entity Registered &amp; Ready</h2>
                <p>The business entity has been created in the database. Open the Unified Orchestrator to add logo, photos, carousel slides, and AI stories.</p>
                
                <div className="actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                   {state.createdBizId ? (
                     <Link href={`/jana/businesses/${state.createdBizId}/orchestrate`} className="btn-premium">
                       <i className="fas fa-wand-magic-sparkles" style={{ marginRight: '6px' }} /> OPEN IN UNIFIED ORCHESTRATOR &amp; EDIT
                     </Link>
                   ) : (
                     <Link href="/jana/businesses" className="btn-premium">ENTER BUSINESS REGISTRY</Link>
                   )}
                   <Link href="/jana/businesses" className="btn-outline">VIEW ALL IN REGISTRY</Link>
                </div>
             </div>
          )}

          {/* Persistent Controls */}
          {state.step !== 'DEPLOYMENT' && (
            <div className="wizard-controls">
              <button onClick={prevStep} className="btn-ghost" disabled={state.step === 'ARCHITECTURE'}>
                <i className="fas fa-chevron-left"></i> PREVIOUS
              </button>
              
              <button 
                onClick={nextStep}
                className="btn-premium next-btn"
                disabled={
                  (state.step === 'ARCHITECTURE' && !state.selectedType) ||
                  (state.step === 'DNA_CONFIG' && !state.businessName)
                }
              >
                {state.step === 'AUTHORITY' ? 'SYNTHESIZE & DEPLOY' : 'PROCEED'} 
                <i className={state.step === 'AUTHORITY' ? "fas fa-rocket" : "fas fa-chevron-right"}></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .loader-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #d97706; font-weight: 900; letter-spacing: 5px; }
        
        .orchestrator-container {
          min-height: 100vh;
          background: transparent;
          color: #0f172a;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .bg-glow {
          position: absolute;
          top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(217,119,6,0.06) 0%, rgba(255,255,255,0) 70%);
          pointer-events: none;
          z-index: 0;
        }

        .wizard-wrapper {
          max-width: 1050px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .wizard-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .sub-badge {
          font-size: 0.7rem; font-weight: 900; color: #d97706; 
          letter-spacing: 4px; margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        .title {
          font-size: 2.8rem; font-weight: 900; letter-spacing: -1px;
          margin: 0; color: #0f172a;
        }

        .highlight { color: #d97706; }

        .subtitle {
          color: #64748b; font-size: 1rem; max-width: 500px; 
          margin: 1rem auto 0; line-height: 1.6; font-weight: 500;
        }

        .progress-tracker {
          display: flex; gap: 1.5rem; margin-bottom: 3rem;
        }

        .progress-step { flex: 1; }

        .progress-bar {
          height: 5px; border-radius: 4px;
          background: #e2e8f0;
          margin-bottom: 0.75rem; transition: all 0.4s ease;
        }

        .progress-bar.active {
          background: linear-gradient(90deg, #d97706, #f59e0b);
          box-shadow: 0 0 10px rgba(217,119,6,0.3);
        }

        .progress-label {
          font-size: 0.65rem; font-weight: 800; letter-spacing: 1px;
          color: #94a3b8; transition: all 0.4s ease;
        }

        .progress-label.active-text { color: #d97706; font-weight: 900; }
        .progress-label.passed-text { color: #0f172a; font-weight: 800; }

        .glass-card {
          padding: 3.5rem 3rem; border-radius: 24px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .phase-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 2.5rem;
        }

        .phase-header h2 {
          font-size: 2rem; font-weight: 900; margin: 0; color: #0f172a;
          letter-spacing: -0.5px;
        }

        .btn-undo {
          background: #fffdf5; color: #d97706;
          border: 1px solid #fde68a; cursor: pointer;
          font-weight: 900; font-size: 0.7rem; padding: 0.6rem 1.2rem;
          border-radius: 50px; transition: all 0.2s;
        }
        .btn-undo:hover { background: #fef3c7; }

        .grid-selection {
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
          gap: 1.5rem;
        }

        .selection-card {
          padding: 2rem 1.25rem; border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a; cursor: pointer; text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .selection-card:hover {
          background: #ffffff;
          border-color: #cbd5e1;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }

        .selection-card.selected {
          border-color: #d97706;
          background: #fffdf5;
          box-shadow: 0 10px 25px rgba(217,119,6,0.12);
          transform: translateY(-4px);
        }

        .selection-card .icon {
          font-size: 2rem; color: #d97706; 
          margin-bottom: 1.25rem; display: block;
        }

        .selection-card.child .icon { color: #059669; }

        .selection-card .name { font-weight: 800; font-size: 0.95rem; margin-bottom: 0.5rem; color: #0f172a; }
        .selection-card .tag { font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 1px; }
        .selection-card .tag.success { color: #059669; }

        .empty-state {
          grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;
          background: #f8fafc; border-radius: 24px;
          border: 1px dashed #cbd5e1;
        }
        .empty-state i { font-size: 2.5rem; color: #94a3b8; margin-bottom: 1rem; }
        .empty-state div { color: #64748b; font-weight: 600; font-size: 0.9rem; }

        .template-card {
          border-radius: 20px; overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer; transition: all 0.3s;
        }
        .template-card:hover { transform: translateY(-4px); border-color: #cbd5e1; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .template-card.selected { border: 2px solid #d97706; box-shadow: 0 12px 30px rgba(217,119,6,0.15); transform: translateY(-4px); }
        
        .template-card .preview-window {
          height: 150px; background: #f1f5f9; 
          display: flex; align-items: center; justify-content: center;
        }
        .template-card .preview-window .icon { font-size: 2.5rem; opacity: 0.4; color: #0f172a; }
        .template-card .info { padding: 1.25rem; background: #ffffff; color: #0f172a; }
        .template-card .info .name { font-weight: 900; font-size: 0.9rem; margin-bottom: 0.25rem; color: #0f172a; }
        .template-card .info .tag { font-size: 0.6rem; color: #d97706; font-weight: 900; letter-spacing: 1px; }

        .main-name-input { margin-bottom: 3.5rem; }
        .main-name-input label {
          font-size: 0.75rem; font-weight: 900; color: #d97706; 
          letter-spacing: 2px; display: block; margin-bottom: 0.75rem;
        }
        .main-name-input input {
          width: 100%; background: transparent; border: none;
          border-bottom: 2px solid #cbd5e1; color: #0f172a;
          font-size: 2.5rem; font-weight: 900; padding: 0.75rem 0; outline: none;
          transition: all 0.3s;
        }
        .main-name-input input:focus { border-bottom-color: #d97706; }
        .main-name-input input::placeholder { color: #cbd5e1; }

        .dna-form-wrapper {
          background: #f8fafc;
          padding: 2rem; border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        .success-content { text-align: center; padding: 2rem 0; }
        .check-ring {
          width: 90px; height: 90px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 2rem; font-size: 2.2rem;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }
        .success-content h2 { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 1rem; color: #0f172a; }
        .success-content p { font-size: 1.05rem; color: #64748b; margin-bottom: 3rem; }
        .success-content .actions { display: flex; gap: 1.25rem; justify-content: center; }

        .wizard-controls {
          margin-top: 4rem; padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
        }

        .btn-ghost {
          background: transparent; border: none; color: #64748b;
          font-weight: 800; font-size: 0.8rem; cursor: pointer;
          letter-spacing: 1px; transition: color 0.2s;
        }
        .btn-ghost:hover:not(:disabled) { color: #0f172a; }
        .btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

        .btn-premium { 
          padding: 1.1rem 3rem; border-radius: 50px; 
          background: #0f172a; 
          color: #ffffff; text-decoration: none; display: inline-block;
          border: none; font-weight: 800; letter-spacing: 1px; cursor: pointer;
          box-shadow: 0 10px 25px rgba(15,23,42,0.15); 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-premium:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 15px 30px rgba(15,23,42,0.25); 
          background: #1e293b;
        }
        .btn-premium:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

        .btn-premium.next-btn { display: flex; align-items: center; gap: 0.75rem; }

        .btn-outline { 
          padding: 1.1rem 3rem; border-radius: 50px; 
          background: #ffffff; color: #0f172a; text-decoration: none;
          border: 1px solid #cbd5e1; 
          font-weight: 800; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .btn-outline:hover { border-color: #0f172a; background: #f8fafc; }
      `}</style>
    </div>
  );
}

export default function GovernanceWizardPage() {
  return (
    <Suspense fallback={<div className="loader-screen">INITIALIZING PROTOCOLS...</div>}>
      <OrchestratorContent />
    </Suspense>
  );
}
