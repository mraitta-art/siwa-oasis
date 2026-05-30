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
          custom_data: state.businessData,
          status: 'pending'
        })
      });
      if (bizRes.ok) {
        localStorage.removeItem(STORAGE_KEY);
        updateState({ step: 'DEPLOYMENT' });
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
                <h2>Deployment Synchronized</h2>
                <p>The entity has been permanently written to the Siwa Registry.</p>
                
                <div className="actions">
                   <Link href="/jana/businesses" className="btn-premium">ENTER REGISTRY</Link>
                   <button onClick={() => {
                     localStorage.removeItem(STORAGE_KEY);
                     window.location.reload();
                   }} className="btn-outline">ORCHESTRATE NEW ENTITY</button>
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
        .loader-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #D4AF37; font-weight: 900; letter-spacing: 5px; }
        
        .orchestrator-container {
          min-height: 100vh;
          background: #090e17;
          color: #fff;
          padding: 4rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .bg-glow {
          position: absolute;
          top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(15,23,42,0) 70%);
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
          margin-bottom: 4rem;
        }
        
        .sub-badge {
          font-size: 0.7rem; font-weight: 900; color: #D4AF37; 
          letter-spacing: 4px; margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .title {
          font-size: 3rem; font-weight: 900; letter-spacing: -1.5px;
          margin: 0; text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .highlight { color: #D4AF37; }

        .subtitle {
          opacity: 0.6; font-size: 1rem; max-width: 500px; 
          margin: 1.5rem auto 0; line-height: 1.6;
        }

        .progress-tracker {
          display: flex; gap: 1.5rem; margin-bottom: 3.5rem;
        }

        .progress-step { flex: 1; }

        .progress-bar {
          height: 4px; border-radius: 4px;
          background: rgba(255,255,255,0.05);
          margin-bottom: 1rem; transition: all 0.4s ease;
        }

        .progress-bar.active {
          background: linear-gradient(90deg, #D4AF37, #F5E6AD);
          box-shadow: 0 0 15px rgba(212,175,55,0.4);
        }

        .progress-label {
          font-size: 0.65rem; font-weight: 900; letter-spacing: 1px;
          opacity: 0.3; transition: all 0.4s ease;
        }

        .progress-label.active-text { opacity: 1; color: #D4AF37; }
        .progress-label.passed-text { opacity: 0.8; }

        .glass-card {
          padding: 4rem; border-radius: 32px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(40px);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        .phase-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 2.5rem;
        }

        .phase-header h2 {
          font-size: 2.2rem; font-weight: 900; margin: 0;
          letter-spacing: -1px;
        }

        .btn-undo {
          background: rgba(212,175,55,0.1); color: #D4AF37;
          border: 1px solid rgba(212,175,55,0.2); cursor: pointer;
          font-weight: 900; font-size: 0.7rem; padding: 0.6rem 1.2rem;
          border-radius: 50px; transition: all 0.2s;
        }
        .btn-undo:hover { background: rgba(212,175,55,0.2); }

        .grid-selection {
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
          gap: 1.5rem;
        }

        .selection-card {
          padding: 2.5rem 1.5rem; border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.01);
          color: #fff; cursor: pointer; text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .selection-card:hover {
          background: rgba(255,255,255,0.04);
          transform: translateY(-4px);
        }

        .selection-card.selected {
          border-color: #D4AF37;
          background: rgba(212,175,55,0.08);
          box-shadow: 0 15px 30px rgba(212,175,55,0.1);
          transform: translateY(-4px);
        }

        .selection-card .icon {
          font-size: 2rem; color: #D4AF37; 
          margin-bottom: 1.5rem; display: block;
        }

        .selection-card.child .icon { color: #10b981; }

        .selection-card .name { font-weight: 800; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .selection-card .tag { font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 900; letter-spacing: 1px; }
        .selection-card .tag.success { color: #10b981; }

        .empty-state {
          grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;
          background: rgba(255,255,255,0.02); border-radius: 24px;
          border: 1px dashed rgba(255,255,255,0.1);
        }
        .empty-state i { font-size: 2.5rem; color: rgba(255,255,255,0.2); margin-bottom: 1rem; }
        .empty-state div { color: rgba(255,255,255,0.5); font-weight: 600; font-size: 0.9rem; }

        .template-card {
          border-radius: 24px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; transition: all 0.3s;
        }
        .template-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.3); }
        .template-card.selected { border: 2px solid #D4AF37; box-shadow: 0 20px 40px rgba(212,175,55,0.15); transform: translateY(-5px); }
        
        .template-card .preview-window {
          height: 160px; background: #0f172a; 
          display: flex; align-items: center; justify-content: center;
        }
        .template-card .preview-window .icon { font-size: 2.5rem; opacity: 0.2; }
        .template-card .info { padding: 1.5rem; background: rgba(255,255,255,0.03); }
        .template-card .info .name { font-weight: 900; font-size: 0.9rem; margin-bottom: 0.25rem; }
        .template-card .info .tag { font-size: 0.6rem; color: #D4AF37; font-weight: 900; letter-spacing: 1px; }

        .main-name-input { margin-bottom: 4rem; }
        .main-name-input label {
          font-size: 0.7rem; font-weight: 900; color: #D4AF37; 
          letter-spacing: 2px; display: block; margin-bottom: 1rem;
        }
        .main-name-input input {
          width: 100%; background: transparent; border: none;
          border-bottom: 2px solid rgba(255,255,255,0.1); color: #fff;
          font-size: 3rem; font-weight: 900; padding: 1rem 0; outline: none;
          transition: all 0.3s;
        }
        .main-name-input input:focus { border-bottom-color: #D4AF37; }
        .main-name-input input::placeholder { color: rgba(255,255,255,0.1); }

        .dna-form-wrapper {
          background: rgba(0,0,0,0.2);
          padding: 2rem; border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .success-content { text-align: center; padding: 2rem 0; }
        .check-ring {
          width: 100px; height: 100px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 2.5rem; font-size: 2.5rem;
          box-shadow: 0 0 50px rgba(16, 185, 129, 0.4);
        }
        .success-content h2 { font-size: 3rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 1rem; }
        .success-content p { font-size: 1.1rem; opacity: 0.6; margin-bottom: 4rem; }
        .success-content .actions { display: flex; gap: 1.5rem; justify-content: center; }

        .wizard-controls {
          margin-top: 5rem; padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
        }

        .btn-ghost {
          background: transparent; border: none; color: rgba(255,255,255,0.4);
          font-weight: 900; font-size: 0.8rem; cursor: pointer;
          letter-spacing: 1px; transition: color 0.2s;
        }
        .btn-ghost:hover:not(:disabled) { color: #fff; }
        .btn-ghost:disabled { opacity: 0.2; cursor: not-allowed; }

        .btn-premium { 
          padding: 1.25rem 3.5rem; border-radius: 50px; 
          background: linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%); 
          color: #1a1a2e; text-decoration: none; display: inline-block;
          border: none; font-weight: 900; letter-spacing: 1px; cursor: pointer;
          box-shadow: 0 20px 40px -10px rgba(212,175,55,0.5); 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-premium:hover:not(:disabled) { 
          transform: translateY(-3px); 
          box-shadow: 0 25px 50px -12px rgba(212,175,55,0.6); 
        }
        .btn-premium:disabled { background: #334155; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

        .btn-premium.next-btn { display: flex; align-items: center; gap: 1rem; }

        .btn-outline { 
          padding: 1.25rem 3.5rem; border-radius: 50px; 
          background: transparent; color: #fff; text-decoration: none;
          border: 2px solid rgba(255,255,255,0.1); 
          font-weight: 900; cursor: pointer; transition: all 0.3s;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
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
