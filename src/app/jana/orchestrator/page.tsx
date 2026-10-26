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

type Step =
  | 'MARKET'
  | 'ARCHITECTURE'
  | 'STRUCTURE'
  | 'AESTHETICS'
  | 'DNA_CONFIG'
  | 'AUTHORITY'
  | 'DEPLOYMENT';

interface DevelopmentDraft {
  kind: string;
  developerName: string;
  deliveryYear: string;
  status: string;
}

interface WizardState {
  step: Step;
  market: string;
  selectedParent: string;
  selectedType: string;
  containerKind: 'business' | 'development';
  existingDevelopmentId: string;
  locationId: string;
  development: DevelopmentDraft;
  businessName: string;
  selectedVendor: string;
  businessData: Record<string, any>;
  minisiteTemplate: string;
  fields: any[];
  createdBizId?: string;
  createdDevId?: string;
}

const STORAGE_KEY = 'siwa_governance_wizard_state';
const STEPS: Step[] = ['MARKET', 'ARCHITECTURE', 'STRUCTURE', 'AESTHETICS', 'DNA_CONFIG', 'AUTHORITY', 'DEPLOYMENT'];

// The container classifiers and lifecycle states mirror the server's
// DEVELOPMENT_KINDS / DEVELOPMENT_STATUSES. They live here as plain data so the
// picker can render without importing a server module into a client component.
const DEVELOPMENT_KINDS = ['compound', 'town', 'village', 'resort'];
const DEVELOPMENT_STATUSES = ['announced', 'under_construction', 'delivered', 'sold_out'];

// Shared inline styles for the STRUCTURE step's small selects/inputs, so the
// container draft form matches the wizard's typography without a new CSS block.
const fieldLabel: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 900, color: '#d97706', letterSpacing: '1.5px', display: 'block', marginBottom: '0.4rem' };
const fieldInput: React.CSSProperties = { width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#0f172a', background: '#fff' };

function OrchestratorContent() {
  const { notify } = useAdmin();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<any[]>([]);
  const [compounds, setCompounds] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [typologies, setTypologies] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [visualTemplates, setVisualTemplates] = useState<any[]>([]);

  const [state, setState] = useState<WizardState>({
    step: 'MARKET',
    market: searchParams.get('market') || '',
    selectedParent: '',
    selectedType: searchParams.get('type') || '',
    containerKind: 'business',
    existingDevelopmentId: '',
    locationId: '',
    development: { kind: 'compound', developerName: '', deliveryYear: '', status: 'announced' },
    businessName: '',
    selectedVendor: '',
    businessData: {},
    // No template is pinned by default: the server resolves the right one from the
    // typology, its parent, then the tier. The old hardcoded 'desert_luxury_v1' was
    // a row that no longer exists.
    minisiteTemplate: '',
    fields: []
  });

  const updateState = (updates: Partial<WizardState>) => setState(prev => ({ ...prev, ...updates }));
  const updateDevelopment = (updates: Partial<DevelopmentDraft>) =>
    setState(prev => ({ ...prev, development: { ...prev.development, ...updates } }));

  // Market-independent reference data plus the market/compound hierarchy, loaded
  // once. Markets come from the admin registry, so a dark market can still be
  // authored here even while its public door is closed.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (searchParams.get('type')) parsed.selectedType = searchParams.get('type');
        if (searchParams.get('market')) parsed.market = searchParams.get('market');
        // Any cached step that is no longer in the model starts over at MARKET.
        if (parsed.step && !STEPS.includes(parsed.step)) parsed.step = 'MARKET';
        setState(prev => ({ ...prev, ...parsed, development: { ...prev.development, ...(parsed.development || {}) } }));
      } catch (e) {}
    }

    const safeJson = async (url: string) => {
      try {
        const res = await fetch(url);
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?redirect=/jana/orchestrator';
          return null;
        }
        return await res.json();
      } catch {
        return null;
      }
    };

    Promise.all([
      safeJson('/api/jana/vendors'),
      safeJson('/api/jana/sections'),
      safeJson('/api/jana/templates'),
      safeJson('/api/jana/markets'),
    ]).then(([vendorList, sectionsList, visualList, marketData]) => {
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setAllSections(Array.isArray(sectionsList) ? sectionsList : []);
      setVisualTemplates(Array.isArray(visualList) ? visualList : []);
      const list = Array.isArray(marketData?.markets) ? marketData.markets : [];
      setMarkets(list);
      setCompounds(Array.isArray(marketData?.compounds) ? marketData.compounds : []);
      setState(prev => {
        if (prev.market) return prev;
        const firstActive = list.find((m: any) => m.active) || list[0];
        return { ...prev, market: firstActive ? String(firstActive.slug ?? firstActive.id) : 'siwa' };
      });
      setLoading(false);
    });
  }, [searchParams]);

  // Market-scoped reads: only the categories offered in this market (plus the
  // shared ones) and only the places inside its geography. The write side re-checks
  // both; this simply stops the wizard from offering an invalid choice.
  useEffect(() => {
    if (!state.market) return;
    let cancelled = false;
    fetch(`/api/signup/types?market=${encodeURIComponent(state.market)}`)
      .then(res => (res.ok ? res.json() : { types: [] }))
      .then(data => { if (!cancelled) setTypologies(Array.isArray(data?.types) ? data.types : []); })
      .catch(() => { if (!cancelled) setTypologies([]); });
    fetch(`/api/jana/places?market=${encodeURIComponent(state.market)}`)
      .then(res => (res.ok ? res.json() : {}))
      .then((data: any) => { if (!cancelled) setPlaces(Array.isArray(data?.places) ? data.places : []); })
      .catch(() => { if (!cancelled) setPlaces([]); });
    // A market switch invalidates choices that no longer exist in this market.
    setState(prev => ({
      ...prev,
      selectedType: prev.selectedType && searchParams.get('type') === prev.selectedType ? prev.selectedType : '',
      selectedParent: '',
      existingDevelopmentId: '',
      locationId: '',
    }));
    return () => { cancelled = true; };
  }, [state.market]);

  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loading]);

  useEffect(() => {
    if (state.selectedType) {
      fetch(`/api/jana/forms?type=${state.selectedType}`)
        .then(res => res.json())
        .then(fields => {
          if (Array.isArray(fields)) updateState({ fields });
        })
        .catch(() => {});
    }
  }, [state.selectedType]);

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/orchestrator/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: state.market,
          containerKind: state.containerKind,
          existingDevelopmentId: state.containerKind === 'business' ? (state.existingDevelopmentId || null) : null,
          location_id: state.locationId || null,
          development: state.containerKind === 'development'
            ? { ...state.development, locationId: state.locationId || null }
            : undefined,
          name: state.businessName,
          type_id: state.selectedType,
          vendor_id: state.selectedVendor || null,
          template_id: state.minisiteTemplate || null,
          custom_data: state.businessData,
          subscription_tier: 'free',
          url_style: 'market',
          status: 'pending'
        })
      });
      const created = await res.json().catch(() => ({}));
      if (res.ok) {
        const bizId = created?.business?.id || created?.id || '';
        const devId = created?.development?.id || '';
        localStorage.removeItem(STORAGE_KEY);
        setState(prev => ({ ...prev, step: 'DEPLOYMENT', createdBizId: bizId, createdDevId: devId || undefined }));
        notify(state.containerKind === 'development' ? 'Development & Page Synthesized' : 'Entity Synthesized Successfully', 'success');
      } else {
        notify(created?.error || 'Orchestration Failed', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Orchestration Failed', 'error');
    }
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

  // The compounds that live in this market — the containers a listing can be
  // filed inside. Filtered client-side from the single admin registry read.
  const marketCompounds = compounds.filter(c => String(c.marketId) === String(state.market));
  // NOTE: "Typologies" here refers to the DATA MODEL (business classification),
  // NOT the ARCHITECTURE step (the workflow process). This distinction is intentional.
  const parentTypologies = typologies.filter(t => t.is_parent || !t.parent_id);
  const childTypologies = state.selectedParent ? typologies.filter(t => t.parent_id === state.selectedParent) : [];
  const selectedMarketName = String(markets.find(m => String(m.slug ?? m.id) === state.market)?.nameEn || state.market);

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
          
          {/* STEP 0: MARKET — every entity is filed inside one market first.
              Without this the write defaulted to Siwa, so an El Alamein compound
              landed in the wrong registry. Dark markets are selectable here on
              purpose: the desk can author a market before its public door opens. */}
          {state.step === 'MARKET' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>Choose the Market</h2>
                {state.market && (
                  <span className="tag" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>
                    Current: {selectedMarketName}
                  </span>
                )}
              </div>
              <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
                The category tree, geography and URL namespace all follow this choice.
              </p>
              <div className="grid-selection">
                {markets.map(m => {
                  const slug = String(m.slug ?? m.id);
                  return (
                    <button
                      key={slug}
                      onClick={() => updateState({ market: slug })}
                      className={`selection-card ${state.market === slug ? 'selected' : ''}`}
                    >
                      <i className="fas fa-map-location-dot icon"></i>
                      <div className="name">{m.nameEn || slug}</div>
                      <div className="tag" style={{ color: m.active ? '#059669' : '#94a3b8' }}>
                        {m.active ? 'LIVE MARKET' : 'DARK / PREPARING'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: STRUCTURE — is this a single listing, or a container
              (compound / town / resort) that other listings live inside? This is
              the four-object model: a development is its own row, not a business. */}
          {state.step === 'STRUCTURE' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>What Are You Setting Up?</h2>
              </div>
              <div className="grid-selection">
                <button
                  onClick={() => updateState({ containerKind: 'business' })}
                  className={`selection-card ${state.containerKind === 'business' ? 'selected' : ''}`}
                >
                  <i className="fas fa-store icon"></i>
                  <div className="name">Single Listing</div>
                  <div className="tag">A SHOP, HOTEL OR SERVICE</div>
                </button>
                <button
                  onClick={() => updateState({ containerKind: 'development' })}
                  className={`selection-card ${state.containerKind === 'development' ? 'selected' : ''}`}
                >
                  <i className="fas fa-building flag icon" style={{ color: '#0F4C81' }}></i>
                  <div className="name">Development / Compound</div>
                  <div className="tag">A PROJECT THAT HOLDS LISTINGS &amp; UNITS</div>
                </button>
              </div>

              <div style={{ marginTop: '2rem' }} className="dna-form-wrapper">
                <div className="form-group main-name-input" style={{ marginBottom: '1.5rem' }}>
                  <label>PLACE (OPTIONAL)</label>
                  <select
                    value={state.locationId}
                    onChange={e => updateState({ locationId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', background: '#fff' }}
                  >
                    <option value="">Market default city (recommended)</option>
                    {places.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{p.nameEn || p.nameAr} — {p.type}</option>
                    ))}
                  </select>
                </div>

                {state.containerKind === 'business' ? (
                  <div className="form-group main-name-input" style={{ marginBottom: 0 }}>
                    <label>FILE INSIDE AN EXISTING PROJECT (OPTIONAL)</label>
                    <select
                      value={state.existingDevelopmentId}
                      onChange={e => updateState({ existingDevelopmentId: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', background: '#fff' }}
                    >
                      <option value="">Standalone — not inside a project</option>
                      {marketCompounds.map(c => (
                        <option key={c.id} value={c.id}>{c.nameEn || c.nameAr} ({c.kind})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={fieldLabel}>CONTAINER KIND</label>
                      <select value={state.development.kind} onChange={e => updateDevelopment({ kind: e.target.value })} style={fieldInput}>
                        {DEVELOPMENT_KINDS.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>STATUS</label>
                      <select value={state.development.status} onChange={e => updateDevelopment({ status: e.target.value })} style={fieldInput}>
                        {DEVELOPMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>DEVELOPER (OPTIONAL)</label>
                      <input type="text" value={state.development.developerName} onChange={e => updateDevelopment({ developerName: e.target.value })} placeholder="e.g. Dorra Group" style={fieldInput} />
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>DELIVERY YEAR (OPTIONAL)</label>
                      <input type="number" inputMode="numeric" value={state.development.deliveryYear} onChange={e => updateDevelopment({ deliveryYear: e.target.value })} placeholder="2028" style={fieldInput} />
                    </div>
                    <p style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
                      The project's name and Arabic name are taken from the entity name you set on the next steps. Inventory (units) is added afterwards in the vendor inventory desk.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* STEP: AESTHETICS */}
          {state.step === 'AESTHETICS' && (
             <div className="phase-content">
                <div className="phase-header">
                   <h2>Visual Blueprint Selection</h2>
                </div>
                <div className="grid-selection templates">
                   <div
                      onClick={() => updateState({ minisiteTemplate: '' })}
                      className={`template-card ${!state.minisiteTemplate ? 'selected' : ''}`}
                   >
                      <div className="preview-window">
                         <i className={`fas fa-wand-magic-sparkles icon`}></i>
                      </div>
                      <div className="info">
                         <div className="name">AUTO (RECOMMENDED)</div>
                         <div className="tag">RESOLVED FROM TYPOLOGY &amp; TIER</div>
                      </div>
                   </div>
                   {visualTemplates.map(t => (
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
                   ))}
                   {visualTemplates.length === 0 && (
                     <div className="empty-state">
                       <i className="fas fa-palette"></i>
                       <div>No specific visual templates yet — the system resolves one from the typology and plan.</div>
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
                <p>The business entity has been created in the database. Choose how to architect its public minisite below.</p>

                {/* Minisite Architecture Choice — Only for NEW businesses */}
                <div style={{ margin: '2rem auto', maxWidth: 720, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d97706', letterSpacing: '3px', marginBottom: '1.25rem', textAlign: 'center' }}>
                    CHOOSE MINISITE ARCHITECTURE FOR THIS NEW ENTITY
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>

                    {/* Option A: Sectional (legacy free system) */}
                    <div style={{ padding: '1.75rem', borderRadius: '20px', border: '2px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-layer-group" style={{ color: '#64748b', fontSize: '1.1rem' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>Sectional Minisite</div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#22c55e', letterSpacing: '1px' }}>FREE — DEFAULT SYSTEM</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        The standard section-based minisite. Sections are inherited from the business typology and automatically populated from the business data. <strong>All existing businesses use this — zero cost.</strong>
                      </p>
                      <ul style={{ fontSize: '0.75rem', color: '#475569', paddingLeft: '1.25rem', margin: 0, lineHeight: 2 }}>
                        <li>Auto-generated from business typology</li>
                        <li>Sections show: identity, gallery, services, blogs</li>
                        <li>Fully functional from day one</li>
                        <li>No builder access needed</li>
                      </ul>
                      {state.createdBizId ? (
                        <Link
                          href={`/jana/businesses/${state.createdBizId}/orchestrate`}
                          className="btn-premium"
                          style={{ textAlign: 'center', marginTop: '0.5rem' }}
                        >
                          <i className="fas fa-layer-group" style={{ marginRight: '6px' }} /> USE SECTIONAL (FREE)
                        </Link>
                      ) : (
                        <Link href="/jana/businesses" className="btn-premium" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                          ENTER REGISTRY
                        </Link>
                      )}
                    </div>

                    {/* Option B: Builder Minisite */}
                    <div style={{ padding: '1.75rem', borderRadius: '20px', border: '2px solid #d97706', background: '#fffdf5', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 8px 24px rgba(217,119,6,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-wand-magic-sparkles" style={{ color: '#d97706', fontSize: '1.1rem' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>Builder Minisite</div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d97706', letterSpacing: '1px' }}>NEW — COMPONENT STUDIO</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Admin-designed page with drag-and-drop component blocks. Replaces or layers on top of the section system. Pre-fills from the business database. Governed by subscription tier.
                      </p>
                      <ul style={{ fontSize: '0.75rem', color: '#475569', paddingLeft: '1.25rem', margin: 0, lineHeight: 2 }}>
                        <li>Component-based (hero, gallery, packages…)</li>
                        <li>Site-specific content auto-pre-filled</li>
                        <li>Replace or untied from sections system</li>
                        <li>Admin-only studio access</li>
                      </ul>
                      {state.createdBizId ? (
                        <Link
                          href={`/jana/minisite-builder?slug=${state.createdBizId}`}
                          className="btn-premium"
                          style={{ background: '#d97706', textAlign: 'center', marginTop: '0.5rem' }}
                        >
                          <i className="fas fa-wand-magic-sparkles" style={{ marginRight: '6px' }} /> OPEN IN MINISITE BUILDER
                        </Link>
                      ) : null}
                    </div>

                  </div>

                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '1.25rem', fontWeight: 600 }}>
                    <i className="fas fa-info-circle" style={{ color: '#d97706', marginRight: '6px' }} />
                    You can always switch later. Existing sectional minisites are never affected — builder is only activated when you explicitly open the Builder Studio for a business.
                  </p>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <Link href="/jana/businesses" className="btn-outline">VIEW ALL IN REGISTRY</Link>
                </div>
             </div>
          )}

          {/* Persistent Controls */}
          {state.step !== 'DEPLOYMENT' && (
            <div className="wizard-controls">
              <button onClick={prevStep} className="btn-ghost" disabled={state.step === 'MARKET'}>
                <i className="fas fa-chevron-left"></i> PREVIOUS
              </button>
              
              <button 
                onClick={nextStep}
                className="btn-premium next-btn"
                disabled={
                  (state.step === 'MARKET' && !state.market) ||
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

      <style>{`
        .loader-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #d97706; font-weight: 900; letter-spacing: 5px; }
        
        .orchestrator-container {
          min-height: 100vh;
          background: transparent;
          color: #0f172a;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: clamp(1rem, 3vw, 2.5rem) clamp(0.75rem, 2vw, 1.5rem);
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
          margin-bottom: clamp(1.5rem, 4vw, 3rem);
        }
        
        .sub-badge {
          font-size: clamp(0.6rem, 1.5vw, 0.7rem); font-weight: 900; color: #d97706; 
          letter-spacing: clamp(2px, 0.5vw, 4px); margin-bottom: 0.5rem;
          text-transform: uppercase;
        }

        .title {
          font-size: clamp(1.75rem, 5vw, 2.8rem); font-weight: 900; letter-spacing: -1px;
          margin: 0; color: #0f172a; line-height: 1.15;
        }

        .highlight { color: #d97706; }

        .subtitle {
          color: #64748b; font-size: clamp(0.85rem, 2vw, 1rem); max-width: 500px; 
          margin: 0.75rem auto 0; line-height: 1.5; font-weight: 500;
        }

        .progress-tracker {
          display: flex; gap: clamp(0.4rem, 1.5vw, 1.5rem); margin-bottom: clamp(1.5rem, 3vw, 3rem);
          overflow-x: auto; padding-bottom: 4px;
        }

        .progress-step { flex: 1; min-width: 55px; }

        .progress-bar {
          height: 5px; border-radius: 4px;
          background: #e2e8f0;
          margin-bottom: 0.5rem; transition: all 0.4s ease;
        }

        .progress-bar.active {
          background: linear-gradient(90deg, #d97706, #f59e0b);
          box-shadow: 0 0 10px rgba(217,119,6,0.3);
        }

        .progress-label {
          font-size: clamp(0.52rem, 1.2vw, 0.65rem); font-weight: 800; letter-spacing: 0.5px;
          color: #94a3b8; transition: all 0.4s ease;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .progress-label.active-text { color: #d97706; font-weight: 900; }
        .progress-label.passed-text { color: #0f172a; font-weight: 800; }

        .glass-card {
          padding: clamp(1.25rem, 4vw, 3.5rem) clamp(1rem, 3.5vw, 3rem);
          border-radius: clamp(16px, 3vw, 24px);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .phase-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: clamp(1.25rem, 3vw, 2.5rem);
          flex-wrap: wrap; gap: 0.75rem;
        }

        .phase-header h2 {
          font-size: clamp(1.25rem, 3vw, 2rem); font-weight: 900; margin: 0; color: #0f172a;
          letter-spacing: -0.5px;
        }

        .btn-undo {
          background: #fffdf5; color: #d97706;
          border: 1px solid #fde68a; cursor: pointer;
          font-weight: 900; font-size: 0.7rem; padding: 0.5rem 1rem;
          border-radius: 50px; transition: all 0.2s;
        }
        .btn-undo:hover { background: #fef3c7; }

        .grid-selection {
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(clamp(130px, 20vw, 220px), 1fr)); 
          gap: clamp(0.75rem, 2vw, 1.5rem);
        }

        .selection-card {
          padding: clamp(1.25rem, 2.5vw, 2rem) clamp(0.75rem, 1.5vw, 1.25rem);
          border-radius: clamp(14px, 2vw, 20px);
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
          font-size: clamp(1.4rem, 3vw, 2rem); color: #d97706; 
          margin-bottom: 0.85rem; display: block;
        }

        .selection-card.child .icon { color: #059669; }

        .selection-card .name { font-weight: 800; font-size: clamp(0.82rem, 1.5vw, 0.95rem); margin-bottom: 0.35rem; color: #0f172a; line-height: 1.2; }
        .selection-card .tag { font-size: clamp(0.55rem, 1vw, 0.6rem); color: #64748b; font-weight: 900; letter-spacing: 0.5px; }
        .selection-card .tag.success { color: #059669; }

        .empty-state {
          grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem;
          background: #f8fafc; border-radius: 20px;
          border: 1px dashed #cbd5e1;
        }
        .empty-state i { font-size: 2rem; color: #94a3b8; margin-bottom: 0.75rem; }
        .empty-state div { color: #64748b; font-weight: 600; font-size: 0.85rem; }

        .template-card {
          border-radius: 18px; overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer; transition: all 0.3s;
        }
        .template-card:hover { transform: translateY(-4px); border-color: #cbd5e1; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .template-card.selected { border: 2px solid #d97706; box-shadow: 0 12px 30px rgba(217,119,6,0.15); transform: translateY(-4px); }
        
        .template-card .preview-window {
          height: clamp(100px, 15vw, 150px); background: #f1f5f9; 
          display: flex; align-items: center; justify-content: center;
        }
        .template-card .preview-window .icon { font-size: 2rem; opacity: 0.4; color: #0f172a; }
        .template-card .info { padding: 1rem; background: #ffffff; color: #0f172a; }
        .template-card .info .name { font-weight: 900; font-size: 0.85rem; margin-bottom: 0.2rem; color: #0f172a; }
        .template-card .info .tag { font-size: 0.58rem; color: #d97706; font-weight: 900; letter-spacing: 0.5px; }

        .main-name-input { margin-bottom: clamp(1.75rem, 4vw, 3.5rem); }
        .main-name-input label {
          font-size: 0.72rem; font-weight: 900; color: #d97706; 
          letter-spacing: 1.5px; display: block; margin-bottom: 0.5rem;
        }
        .main-name-input input {
          width: 100%; background: transparent; border: none;
          border-bottom: 2px solid #cbd5e1; color: #0f172a;
          font-size: clamp(1.35rem, 4vw, 2.5rem); font-weight: 900; padding: 0.5rem 0; outline: none;
          transition: all 0.3s;
        }
        .main-name-input input:focus { border-bottom-color: #d97706; }
        .main-name-input input::placeholder { color: #cbd5e1; }

        .dna-form-wrapper {
          background: #f8fafc;
          padding: clamp(1rem, 2.5vw, 2rem); border-radius: 18px;
          border: 1px solid #e2e8f0;
        }

        .success-content { text-align: center; padding: 1.5rem 0; }
        .check-ring {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem; font-size: 2rem;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }
        .success-content h2 { font-size: clamp(1.6rem, 4vw, 2.5rem); font-weight: 900; letter-spacing: -1px; margin-bottom: 0.75rem; color: #0f172a; }
        .success-content p { font-size: clamp(0.85rem, 2vw, 1.05rem); color: #64748b; margin-bottom: 2rem; }
        .success-content .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        .wizard-controls {
          margin-top: clamp(1.75rem, 4vw, 4rem); padding-top: clamp(1rem, 2.5vw, 2rem);
          border-top: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          gap: 1rem;
        }

        .btn-ghost {
          background: transparent; border: none; color: #64748b;
          font-weight: 800; font-size: 0.8rem; cursor: pointer;
          letter-spacing: 1px; transition: color 0.2s; padding: 0.75rem 1.25rem;
        }
        .btn-ghost:hover:not(:disabled) { color: #0f172a; }
        .btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

        .btn-premium { 
          padding: clamp(0.85rem, 2vw, 1.1rem) clamp(1.75rem, 4vw, 3rem); border-radius: 50px; 
          background: #0f172a; 
          color: #ffffff; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
          border: none; font-weight: 800; letter-spacing: 0.5px; cursor: pointer;
          box-shadow: 0 10px 25px rgba(15,23,42,0.15); 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: clamp(0.78rem, 1.5vw, 0.88rem);
        }
        .btn-premium:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 15px 30px rgba(15,23,42,0.25); 
          background: #1e293b;
        }
        .btn-premium:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

        .btn-premium.next-btn { display: inline-flex; align-items: center; gap: 0.75rem; }

        .btn-outline { 
          padding: clamp(0.85rem, 2vw, 1.1rem) clamp(1.75rem, 4vw, 3rem); border-radius: 50px; 
          background: #ffffff; color: #0f172a; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid #cbd5e1; 
          font-weight: 800; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          font-size: clamp(0.78rem, 1.5vw, 0.88rem);
        }
        .btn-outline:hover { border-color: #0f172a; background: #f8fafc; }

        /* MOBILE OPTIMIZATIONS (Laptop vs Phone Alignment) */
        @media (max-width: 768px) {
          .wizard-controls {
            flex-direction: column-reverse;
            gap: 0.75rem;
          }
          .wizard-controls .btn-premium,
          .wizard-controls .btn-outline,
          .wizard-controls .btn-ghost {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
          .success-content .actions .btn-premium,
          .success-content .actions .btn-outline {
            width: 100%;
          }
        }
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
