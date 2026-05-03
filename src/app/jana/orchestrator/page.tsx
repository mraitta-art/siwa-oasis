'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DynamicForm from '@/components/DynamicForm';
import { useAdmin } from '@/context/AdminContext';

/**
 * GOVERNANCE ORCHESTRATOR (PREMIUM)
 * The world-class onboarding engine for Siwa Oasis entities.
 */

type Step = 'ARCHITECTURE' | 'IDENTITY' | 'AMBIENCE' | 'AUTHORITY' | 'SUCCESS';

interface WizardState {
  step: Step; selectedType: string; businessName: string;
  selectedVendor: string; businessData: Record<string, any>;
  minisiteTemplate: string; fields: any[];
}

const STORAGE_KEY = 'siwa_governance_wizard_state';

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
        setState(parsed);
      } catch (e) {}
    }

    Promise.all([
      fetch('/api/jana/types').then(res => res.json()),
      fetch('/api/jana/vendors').then(res => res.json()),
      fetch('/api/jana/sections').then(res => res.json()),
      fetch('/api/jana/website/templates').then(res => res.json()).catch(() => [])
    ]).then(([types, vendorList, sectionsList, visualList]) => {
      setTypologies(Array.isArray(types) ? types : []);
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setAllSections(Array.isArray(sectionsList) ? sectionsList : []);
      setVisualTemplates(Array.isArray(visualList) ? visualList : []);
      setLoading(false);
    });
  }, []);

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
        updateState({ step: 'SUCCESS' });
        notify('Entity Synchronized', 'success');
      }
    } catch (err) { notify('Orchestration Failed', 'error'); }
    setLoading(false);
  };

  if (loading) return <div className="loader-screen">ORCHESTRATING...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
           <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '4px', marginBottom: '1rem' }}>SYSTEM INITIATION</div>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px' }}>GOVERNANCE <span style={{ color: '#D4AF37' }}>ORCHESTRATOR</span></h1>
           <p style={{ opacity: 0.5, fontSize: '0.9rem', maxWidth: '500px', margin: '1rem auto' }}>Establish a new high-fidelity entity in the Siwa Oasis marketplace registry.</p>
        </header>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '4rem' }}>
           {['ARCHITECTURE', 'IDENTITY', 'AMBIENCE', 'AUTHORITY'].map((s, i) => {
             const active = state.step === s;
             const passed = ['ARCHITECTURE', 'IDENTITY', 'AMBIENCE', 'AUTHORITY', 'SUCCESS'].indexOf(state.step) > i;
             return (
               <div key={s} style={{ flex: 1 }}>
                 <div style={{ height: '4px', background: active || passed ? '#D4AF37' : 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '1rem' }}></div>
                 <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: active ? 1 : 0.4 }}>{s}</div>
               </div>
             );
           })}
        </div>

        <div className="glass-card animate-in" style={{ padding: '4rem', borderRadius: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
          
          {state.step === 'ARCHITECTURE' && (
            <div className="phase-content">
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Define Typology</h2>
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {typologies.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => updateState({ selectedType: t.id })}
                    style={{ 
                      padding: '2rem', borderRadius: '20px', border: state.selectedType === t.id ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                      background: state.selectedType === t.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                      color: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                    }}
                  >
                    <i className={`fas ${t.icon || 'fa-layer-group'}`} style={{ fontSize: '1.5rem', color: '#D4AF37', marginBottom: '1rem', display: 'block' }}></i>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{t.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.step === 'IDENTITY' && (
            <div className="phase-content">
               <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Identity DNA</h2>
               <div className="form-group" style={{ marginBottom: '3rem' }}>
                 <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>ENTITY NAME</label>
                 <input 
                   type="text" 
                   value={state.businessName} 
                   onChange={e => updateState({ businessName: e.target.value })}
                   style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '2.5rem', fontWeight: 900, padding: '1rem 0', outline: 'none' }}
                   placeholder="Siwa Oasis Sands..."
                 />
               </div>

               <DynamicForm 
                 fields={state.fields}
                 data={state.businessData}
                 sections={allSections}
                 userRole="admin"
                 onChange={(sid, name, val) => updateState({ businessData: { ...state.businessData, [sid]: { ...(state.businessData[sid] || {}), [name]: val } } })}
               />
            </div>
          )}

          {state.step === 'AMBIENCE' && (
             <div className="phase-content">
                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Atmosphere Archetype</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
                   {visualTemplates.map(t => (
                     <div 
                        key={t.id} 
                        onClick={() => updateState({ minisiteTemplate: t.id })}
                        style={{ 
                          borderRadius: '24px', overflow: 'hidden', border: state.minisiteTemplate === t.id ? '3px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer', transition: 'all 0.3s'
                        }}
                     >
                        <div style={{ height: '140px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <i className="fas fa-magic fa-2x" style={{ opacity: 0.2 }}></i>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
                           <div style={{ fontWeight: 900, fontSize: '0.8rem' }}>{t.name?.toUpperCase() || t.id}</div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {state.step === 'SUCCESS' && (
             <div style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '2rem' }}>
                  <i className="fas fa-check"></i>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Orchestration Complete</h2>
                <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                   <Link href="/jana/businesses" className="btn-premium">REGISTRY</Link>
                   <button onClick={() => window.location.reload()} className="btn-outline">NEW START</button>
                </div>
             </div>
          )}

          {/* Controls */}
          {state.step !== 'SUCCESS' && (
            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  const steps: Step[] = ['ARCHITECTURE', 'IDENTITY', 'AMBIENCE', 'AUTHORITY'];
                  const idx = steps.indexOf(state.step);
                  if (idx > 0) updateState({ step: steps[idx-1] });
                }} 
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                <i className="fas fa-chevron-left"></i> PREVIOUS PHASE
              </button>
              <button 
                onClick={() => {
                  if (state.step === 'AMBIENCE') handleFinalize();
                  else {
                    const steps: Step[] = ['ARCHITECTURE', 'IDENTITY', 'AMBIENCE', 'AUTHORITY'];
                    const idx = steps.indexOf(state.step);
                    updateState({ step: steps[idx+1] });
                  }
                }}
                className="btn-premium"
              >
                {state.step === 'AMBIENCE' ? 'FINALIZE' : 'NEXT PHASE'} <i className="fas fa-chevron-right" style={{ marginLeft: '1rem' }}></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .loader-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #D4AF37; font-weight: 900; letter-spacing: 5px; }
        .btn-premium { 
          padding: 1.25rem 3.5rem; border-radius: 3rem; background: #D4AF37; color: #fff; 
          border: none; font-weight: 900; letter-spacing: 1px; cursor: pointer;
          box-shadow: 0 20px 40px -10px rgba(212,175,55,0.4); transition: all 0.2s;
        }
        .btn-premium:hover { transform: translateY(-3px); box-shadow: 0 25px 50px -12px rgba(212,175,55,0.5); }
        .btn-outline { 
          padding: 1.25rem 3.5rem; border-radius: 3rem; background: transparent; color: #fff; 
          border: 2px solid rgba(255,255,255,0.1); font-weight: 900; cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default function GovernanceWizardPage() {
  return (
    <Suspense fallback={<div className="loader-screen">LOADING...</div>}>
      <OrchestratorContent />
    </Suspense>
  );
}
