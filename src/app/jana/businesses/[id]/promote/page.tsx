'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

export default function TemplatePromotionWizard() {
  const { id } = useParams();
  const router = useRouter();
  const { notify } = useAdmin();
  
  const [biz, setBiz] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [bizRes, tmplRes, secRes] = await Promise.all([
          fetch(`/api/jana/businesses?id=${id}`),
          fetch(`/api/jana/templates`),
          fetch(`/api/jana/sections`)
        ]);
        
        const b = await bizRes.json();
        const t = await tmplRes.json();
        const s = await secRes.json();
        
        setBiz(b);
        setTemplates(t.filter((tmpl: any) => !tmpl.type_id || tmpl.type_id === b.type_id));
        setSections(s);
        
        // Auto-select current template if exists
        if (b.template_id) {
          setSelectedTemplate(t.find((tmpl: any) => tmpl.id === b.template_id));
        }
      } catch (err) {
        notify('Failed to load promotion data', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, notify]);

  const handlePromote = async () => {
    if (!selectedTemplate) return;
    setPromoting(true);
    try {
      const res = await fetch(`/api/jana/businesses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          template_id: selectedTemplate.id,
          // We don't change custom_data here, the PATCH handles deep merge and preservation
        })
      });
      
      if (res.ok) {
        notify('Business Promoted Successfully!', 'success');
        router.push(`/jana/businesses/${id}/orchestrate`);
      } else {
        throw new Error('Promotion failed');
      }
    } catch (err: any) {
      notify(err.message || 'Promotion Error', 'error');
    } finally {
      setPromoting(false);
    }
  };

  if (loading) return <div className="loader-screen">CALIBRATING BLUEPRINT...</div>;

  const currentTemplate = templates.find(t => t.id === biz.template_id);
  const customData = biz.custom_data || {};
  const dataSections = Object.keys(customData).filter(k => typeof customData[k] === 'object');

  return (
    <div className="promotion-wizard">
      <div className="wizard-header">
        <div className="container">
          <Link href="/jana/businesses" className="back-link">← BUSINESS REGISTRY</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <div className="badge-gold">TEMPLATE PROMOTION WIZARD</div>
                <h1 className="title">{biz.name?.toUpperCase()}</h1>
                <p className="subtitle">Transition between blueprints with zero data loss.</p>
             </div>
             <button 
               className="btn-promote" 
               disabled={!selectedTemplate || selectedTemplate.id === biz.template_id || promoting}
               onClick={handlePromote}
             >
                {promoting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-rocket"></i>}
                {promoting ? 'PROMOTING...' : 'FINALIZE PROMOTION'}
             </button>
          </div>
        </div>
      </div>

      <div className="container wizard-body">
        <div className="grid-wizard">
          
          {/* STEP 1: SELECT NEW BLUEPRINT */}
          <section className="wizard-step card-glass">
            <h2 className="step-title">1. Select Target Blueprint</h2>
            <div className="template-grid">
              {templates.map(t => (
                <div 
                  key={t.id} 
                  className={`template-card ${selectedTemplate?.id === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  <div className="card-header">
                    <span className="level-badge">{t.level?.toUpperCase()}</span>
                    {t.id === biz.template_id && <span className="current-badge">CURRENT</span>}
                  </div>
                  <h3 className="tmpl-name">{t.name}</h3>
                  <p className="tmpl-desc">{t.description}</p>
                  <div className="tmpl-footer">
                     <div className="comp-count">{t.layout?.length || 0} Components</div>
                     {!t.type_id && <i className="fas fa-globe" title="Universal Template"></i>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* STEP 2: DATA MAPPING PREVIEW */}
          <section className="wizard-step card-glass">
            <h2 className="step-title">2. Blueprint DNA Alignment</h2>
            {selectedTemplate ? (
              <div className="mapping-preview">
                <div className="mapping-header">
                   <div>DATA INTEGRITY STATUS: <span style={{ color: '#22c55e' }}>SECURE</span></div>
                   <p>The following DNA layers will be active in the new layout.</p>
                </div>
                
                <div className="mapping-list">
                  {/* CORE SECTIONS (Mapped from Template Layout) */}
                  <div className="map-group">
                    <div className="group-label">CORE ARCHITECTURE</div>
                    {selectedTemplate.layout?.map((comp: any) => {
                      const section = sections.find(s => s.id === comp.type) || { name: comp.type, icon: 'fa-cube' };
                      const hasData = !!customData[comp.type];
                      return (
                        <div key={comp.id} className="map-item">
                           <div className="item-info">
                              <i className={`fas ${section.icon}`}></i>
                              <div>
                                 <div className="item-name">{section.name}</div>
                                 <div className="item-status">{hasData ? '✅ Existing Data Found' : '⚪ Ready for Entry'}</div>
                              </div>
                           </div>
                           <div className="badge-mapped">MAPPED</div>
                        </div>
                      );
                    })}
                  </div >

                  {/* OPPORTUNITIES (Other sections with data) */}
                  <div className="map-group">
                    <div className="group-label">DNA OPPORTUNITIES (PRESERVED)</div>
                    {dataSections
                      .filter(sid => !selectedTemplate.layout?.some((c: any) => c.type === sid))
                      .map(sid => {
                        const section = sections.find(s => s.id === sid) || { name: sid, icon: 'fa-database' };
                        return (
                          <div key={sid} className="map-item preserved">
                             <div className="item-info">
                                <i className={`fas ${section.icon}`}></i>
                                <div>
                                   <div className="item-name">{section.name}</div>
                                   <div className="item-status">Preserved in background</div>
                                </div>
                             </div>
                             <div className="badge-preserved">PRESERVED</div>
                          </div>
                        );
                      })
                    }
                    {dataSections.filter(sid => !selectedTemplate.layout?.some((c: any) => c.type === sid)).length === 0 && (
                      <p style={{ fontSize: '0.7rem', opacity: 0.5, padding: '1rem' }}>No unmapped data sections found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-map-signs fa-3x"></i>
                <p>Select a blueprint to preview DNA alignment.</p>
              </div>
            )}
          </section>

        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;900&family=Inter:wght@400;600;800&display=swap');

        .promotion-wizard {
          min-height: 100vh;
          background: #090e17;
          color: #fff;
          font-family: 'Inter', sans-serif;
          padding-bottom: 5rem;
        }

        .container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .wizard-header {
          background: radial-gradient(circle at top right, rgba(212,175,55,0.1), transparent), #0f172a;
          padding: 6rem 0 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 3rem;
        }

        .back-link {
          color: #D4AF37;
          text-decoration: none;
          font-weight: 800;
          font-size: 0.8rem;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 1.5rem;
        }

        .badge-gold {
          background: #D4AF37;
          color: #0f172a;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 1rem;
          display: inline-block;
        }

        .title {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          margin: 0;
          letter-spacing: -2px;
          line-height: 1;
        }

        .subtitle {
          margin: 0.5rem 0 0;
          color: #94a3b8;
          font-weight: 500;
        }

        .btn-promote {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          border: none;
          padding: 1.25rem 3rem;
          border-radius: 50px;
          font-weight: 900;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-promote:hover:not(:disabled) {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 20px 50px rgba(16, 185, 129, 0.4);
        }

        .btn-promote:disabled {
          background: #334155;
          color: #64748b;
          cursor: not-allowed;
          box-shadow: none;
        }

        .grid-wizard {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .card-glass {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
        }

        .step-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          margin: 0 0 2rem 0;
          color: #D4AF37;
          letter-spacing: -0.5px;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 1rem;
        }

        .template-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .template-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-3px);
        }

        .template-card.active {
          background: rgba(212, 175, 55, 0.05);
          border-color: #D4AF37;
          box-shadow: 0 10px 40px rgba(212, 175, 55, 0.1);
        }

        .level-badge {
          font-size: 0.5rem;
          font-weight: 900;
          background: #1e293b;
          color: #fff;
          padding: 2px 8px;
          border-radius: 50px;
          letter-spacing: 1px;
        }

        .current-badge {
          font-size: 0.5rem;
          font-weight: 900;
          background: #D4AF37;
          color: #000;
          padding: 2px 8px;
          border-radius: 50px;
          margin-left: 0.5rem;
        }

        .tmpl-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          margin: 1rem 0 0.5rem;
          font-size: 1.1rem;
        }

        .tmpl-desc {
          font-size: 0.75rem;
          color: #94a3b8;
          line-height: 1.5;
          height: 3em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .tmpl-footer {
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 800;
          color: #D4AF37;
        }

        .mapping-preview {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .mapping-header {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .mapping-header div {
          font-weight: 900;
          font-size: 0.7rem;
          letter-spacing: 1.5px;
          margin-bottom: 0.5rem;
        }

        .mapping-header p {
          margin: 0;
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .mapping-list {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .group-label {
          font-size: 0.65rem;
          font-weight: 900;
          color: #D4AF37;
          letter-spacing: 2px;
          margin-bottom: 1rem;
        }

        .map-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          padding: 1rem 1.5rem;
          margin-bottom: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .item-info i {
          color: #D4AF37;
          font-size: 1.2rem;
          width: 1.5rem;
          text-align: center;
        }

        .item-name {
          font-weight: 800;
          font-size: 0.9rem;
        }

        .item-status {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .badge-mapped {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          font-size: 0.55rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .badge-preserved {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          font-size: 0.55rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #475569;
          gap: 1.5rem;
        }

        .loader-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #090e17;
          color: #D4AF37;
          font-weight: 900;
          letter-spacing: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
        }

        @media (max-width: 1024px) {
          .grid-wizard { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
