'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DynamicForm from '@/components/DynamicForm';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';

/**
 * UNIFIED BUSINESS DNA ORCHESTRATOR
 * A state-of-the-art, fluid dashboard for feeding business data and architecture.
 */

type Tab = 'IDENTITY' | 'ARCHITECTURE' | 'CONTENT' | 'BRANDING' | 'MEDIA';

export default function BusinessOrchestrator() {
  const { id } = useParams();
  const { notify } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('IDENTITY');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biz, setBiz] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [bizRes, secRes] = await Promise.all([
          fetch(`/api/jana/businesses?id=${id}`),
          fetch(`/api/jana/sections`)
        ]);
        
        const bizData = await bizRes.json();
        const secData = await secRes.json();

        if (bizData.error) throw new Error(bizData.error);
        
        setBiz(bizData);
        setSections(secData);
        
        const fieldRes = await fetch(`/api/jana/forms?type=${bizData.type_id}`);
        const fieldData = await fieldRes.json();
        setBiz((prev: any) => ({ ...prev, fields: fieldData }));

        const templateSections = bizData.template_sections || [];
        const firstActive = secData.find((s: any) => 
          (bizData.custom_data?.[s.id] || templateSections.includes(s.id))
        );
        if (firstActive) setActiveSectionId(firstActive.id);
        
      } catch (err: any) {
        notify(err.message || 'Failed to load orchestrator data', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, notify]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jana/businesses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...biz })
      });
      if (res.ok) {
        notify('Business DNA Synchronized', 'success');
      } else {
        throw new Error('Save failed');
      }
    } catch (err: any) {
      notify(err.message || 'Synchronization Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateBiz = (updates: any) => {
    setBiz((prev: any) => ({ ...prev, ...updates }));
  };

  const updateCustomData = (sectionId: string, fieldName: string, value: any) => {
    setBiz((prev: any) => ({
      ...prev,
      custom_data: {
        ...prev.custom_data,
        [sectionId]: {
          ...(prev.custom_data?.[sectionId] || {}),
          [fieldName]: value
        }
      }
    }));
  };

  if (loading) return <div className="loader-screen">ORCHESTRATING DNA...</div>;
  if (!biz) return <div className="loader-screen" style={{ color: '#ef4444' }}>BUSINESS ENTITY NOT FOUND</div>;

  const templateSections = biz.template_sections || [];
  const activeSectionIds = sections
    .filter(s => biz.custom_data?.[s.id] || templateSections.includes(s.id))
    .map(s => s.id);

  return (
    <div className="orchestrator-page">
      <div className="orchestrator-header">
        <div className="container-fluid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="badge-premium">GOVERNANCE COMMAND CENTER</div>
              <h1 className="title">{biz.name?.toUpperCase()}</h1>
              <p style={{ margin: '1rem 0 0', opacity: 0.5, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px' }}>
                <i className="fas fa-fingerprint"></i> UUID: {id}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href={`/${biz.slug}`} target="_blank" className="btn btn-outline">
                <i className="fas fa-external-link-alt"></i> VIEW MINISITE
              </Link>
              <button onClick={handleSave} disabled={saving} className="btn btn-premium">
                {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                {saving ? 'SYNCHRONIZING...' : 'SAVE ALL CHANGES'}
              </button>
            </div>
          </div>

          <div className="orchestrator-tabs">
            {(['IDENTITY', 'ARCHITECTURE', 'CONTENT', 'BRANDING', 'MEDIA'] as Tab[]).map(t => (
              <button 
                key={t} 
                className={`tab-btn ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-fluid" style={{ marginTop: '3rem', paddingBottom: '10rem' }}>
        <div className="glass-card animate-in">
          
          {/* TAB 1: IDENTITY */}
          {activeTab === 'IDENTITY' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Core Business Principals</h2>
              <div className="grid-responsive">
                <div className="form-group">
                  <label className="dna-label">Business Name</label>
                  <input type="text" className="dna-input" value={biz.name || ''} onChange={e => updateBiz({ name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="dna-label">URL Slug</label>
                  <input type="text" className="dna-input" value={biz.slug || ''} onChange={e => updateBiz({ slug: e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: '3rem' }}>
                <label className="dna-label">Minisite Logo</label>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                   <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {biz.custom_data?.basic?.business_logo ? <img src={biz.custom_data.basic.business_logo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }} alt="Logo" /> : <i className="fas fa-image fa-2x" style={{ opacity: 0.1 }}></i>}
                   </div>
                   <input type="text" className="dna-input" placeholder="Paste Logo URL from Cloudinary..." value={biz.custom_data?.basic?.business_logo || ''} onChange={e => updateCustomData('basic', 'business_logo', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Site Architecture (Blueprint vs Opportunities)</h2>
              <div className="grid-responsive">
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6366f1', marginBottom: '2rem', letterSpacing: '2px' }}>BLUEPRINT CORE (MANDATORY)</h3>
                  <div className="section-grid-mini">
                    {sections.filter(s => templateSections.includes(s.id)).map(s => (
                      <div key={s.id} className="section-item-static">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <i className={`fas ${s.icon}`} style={{ color: '#6366f1' }}></i> {s.name}
                        </span>
                        <span className="badge-blue" style={{ background: '#6366f1', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 900 }}>MANDATORY</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#D4AF37', marginBottom: '2rem', letterSpacing: '2px' }}>ADVANCED OPPORTUNITIES</h3>
                  <div className="section-grid-mini">
                    {sections.filter(s => !templateSections.includes(s.id)).map(s => {
                      const isActive = activeSectionIds.includes(s.id);
                      return (
                        <div key={s.id} className={`section-item-toggle ${isActive ? 'active' : ''}`} onClick={() => {
                          if (isActive) {
                            const next = { ...biz.custom_data };
                            delete next[s.id];
                            updateBiz({ custom_data: next });
                          } else {
                            updateCustomData(s.id, 'initialized', true);
                          }
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <i className={`fas ${s.icon}`}></i> {s.name}
                          </span>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: isActive ? '#D4AF37' : 'rgba(255,255,255,0.1)', boxShadow: isActive ? '0 0 15px rgba(212,175,55,0.6)' : 'none' }}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT DNA */}
          {activeTab === 'CONTENT' && (
            <div className="tab-content animate-in" style={{ display: 'flex', gap: '4rem' }}>
              <aside className="dna-sidebar" style={{ width: '350px', flexShrink: 0 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', marginBottom: '1.5rem', paddingLeft: '1rem' }}>ACTIVE DNA LAYERS</div>
                {sections.filter(s => activeSectionIds.includes(s.id)).map(s => (
                  <button 
                    key={s.id} 
                    className={`dna-nav-btn ${activeSectionId === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSectionId(s.id)}
                  >
                    <i className={`fas ${s.icon}`}></i> {biz.custom_data?.basic?.section_labels?.[s.id] || s.name}
                  </button>
                ))}
              </aside>
              <main style={{ flex: 1, minWidth: 0 }}>
                {activeSectionId && (
                  <div key={activeSectionId} className="animate-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>{sections.find(s => s.id === activeSectionId)?.name} Feeding Area</h2>
                    </div>
                    <DynamicForm 
                      fields={biz.fields?.filter((f: any) => (f.section_id || 'basic') === activeSectionId) || []}
                      data={biz.custom_data || {}}
                      sections={sections}
                      userRole="admin"
                      onChange={updateCustomData}
                      businessName={biz.name}
                    />
                  </div>
                )}
              </main>
            </div>
          )}

          {/* TAB 4: BRANDING */}
          {activeTab === 'BRANDING' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Navigation Branding Overrides</h2>
              <div className="grid-responsive">
                {sections.filter(s => activeSectionIds.includes(s.id)).map(s => (
                  <div key={s.id} className="form-group">
                    <label className="dna-label">{s.name.toUpperCase()} TAB LABEL</label>
                    <input 
                      type="text" 
                      className="dna-input" 
                      placeholder={s.name} 
                      value={biz.custom_data?.basic?.section_labels?.[s.id] || ''}
                      onChange={e => {
                        const next = { ...(biz.custom_data?.basic?.section_labels || {}) };
                        next[s.id] = e.target.value;
                        updateCustomData('basic', 'section_labels', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MEDIA */}
          {activeTab === 'MEDIA' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Unified Business Media Assets</h2>
              <div className="media-grid">
                <div style={{ padding: '6rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <i className="fas fa-film fa-3x" style={{ opacity: 0.1, marginBottom: '1.5rem' }}></i>
                  <div style={{ fontWeight: 700, opacity: 0.4 }}>Media Library is data-driven. Assets appear here after feeding the "CONTENT" tab.</div>
                  <Link href="/jana/hero-carousel" className="btn btn-premium" style={{ marginTop: '2rem', display: 'inline-flex' }}>
                    OPEN HERO MANAGER
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@300;500;900&display=swap');

        .orchestrator-page { 
          min-height: 100vh; 
          background: #090e17; 
          padding-bottom: 5rem; 
          color: #fff; 
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }
        
        .container-fluid { 
          width: 100%; 
          max-width: 1800px; 
          margin: 0 auto; 
          padding: 0 4rem; 
        }

        .orchestrator-header { 
          background: radial-gradient(circle at top right, rgba(212,175,55,0.1), transparent), #0f172a; 
          padding: 8rem 0 0; 
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .badge-premium { 
          display: inline-block; background: #D4AF37; color: #1e293b; 
          padding: 8px 20px; borderRadius: 50px; font-size: 0.7rem; 
          font-weight: 900; letter-spacing: 3px; margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(212,175,55,0.4);
          font-family: 'Outfit', sans-serif;
        }

        .title { 
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.5rem, 6vw, 4.5rem); 
          font-weight: 900; margin: 0; letter-spacing: -3px; 
          text-shadow: 0 10px 40px rgba(0,0,0,0.6);
          line-height: 1;
        }
        
        .orchestrator-tabs { display: flex; gap: clamp(1rem, 3vw, 4rem); margin-top: 5rem; flex-wrap: wrap; }
        .tab-btn { 
          background: none; border: none; color: rgba(255,255,255,0.3); 
          font-weight: 900; font-size: 0.85rem; letter-spacing: 3px; 
          padding: 1.5rem 0; cursor: pointer; border-bottom: 4px solid transparent; 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Outfit', sans-serif;
        }
        .tab-btn:hover { color: #fff; }
        .tab-btn.active { color: #D4AF37; border-bottom-color: #D4AF37; text-shadow: 0 0 15px rgba(212,175,55,0.5); }

        .glass-card { 
          background: rgba(255,255,255,0.02); 
          border-radius: 40px; padding: clamp(2rem, 5vw, 5rem); 
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.7); 
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(40px);
          width: 100%;
        }

        .section-title { 
          font-family: 'Outfit', sans-serif;
          font-size: 2rem; font-weight: 900; margin: 0 0 4rem; 
          color: #fff; border-left: 6px solid #D4AF37; padding-left: 2.5rem;
          letter-spacing: -1px;
        }

        .grid-responsive { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
          gap: 3rem; 
        }

        @media (max-width: 768px) {
          .container-fluid { padding: 0 1.5rem; }
          .grid-responsive { grid-template-columns: 1fr; }
          .orchestrator-tabs { gap: 1.5rem; }
          .glass-card { padding: 2rem; }
        }

        .dna-label { 
          font-size: 0.7rem; font-weight: 900; color: #D4AF37; 
          letter-spacing: 2px; display: block; margin-bottom: 1.25rem;
          font-family: 'Outfit', sans-serif;
        }
        
        .dna-input { 
          width: 100%; 
          background: rgba(255,255,255,0.03); 
          border: 1.5px solid rgba(255,255,255,0.08); 
          borderRadius: 16px; padding: 1.25rem; color: #fff; 
          font-weight: 600; outline: none; transition: all 0.3s;
          font-size: 1rem;
        }
        .dna-input:focus { border-color: #D4AF37; background: rgba(212,175,55,0.04); box-shadow: 0 0 20px rgba(212,175,55,0.1); }

        .section-grid-mini { display: grid; gap: 1rem; }
        
        .section-item-static { 
          background: rgba(255,255,255,0.03); padding: 1.5rem; 
          borderRadius: 20px; display: flex; justifyContent: space-between; 
          alignItems: center; font-weight: 800; color: #cbd5e1; font-size: 1rem;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .section-item-toggle { 
          background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.08); 
          padding: 1.5rem; borderRadius: 20px; display: flex; justifyContent: space-between; 
          alignItems: center; font-weight: 800; color: #94a3b8; cursor: pointer; transition: all 0.3s;
        }
        .section-item-toggle:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.2); transform: translateY(-3px); }
        .section-item-toggle.active { border-color: #D4AF37; background: rgba(212,175,55,0.08); color: #fff; }
        
        .dna-sidebar { 
          display: flex; flexDirection: column; gap: 1rem; 
          border-right: 1px solid rgba(255,255,255,0.05); padding-right: 3rem; 
          min-height: 500px;
        }
        
        .dna-nav-btn { 
          background: transparent; border: none; text-align: left; 
          padding: 1.5rem; borderRadius: 20px; font-weight: 800; 
          color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.4s; 
          display: flex; alignItems: center; gap: 1.5rem;
          font-family: 'Outfit', sans-serif;
        }
        .dna-nav-btn:hover:not(.active) { background: rgba(255,255,255,0.04); color: #fff; }
        .dna-nav-btn.active { 
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
          color: #D4AF37; border: 1px solid rgba(212,175,55,0.3);
          box-shadow: 0 15px 30px rgba(0,0,0,0.4);
        }

        .btn-premium { 
          padding: 1.25rem 3rem; border-radius: 50px; 
          background: linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%); 
          color: #1a1a2e; border: none; font-weight: 900; letter-spacing: 2px; cursor: pointer;
          box-shadow: 0 15px 40px rgba(212,175,55,0.4); 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; alignItems: center; gap: 1rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
        }
        .btn-premium:hover:not(:disabled) { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(212,175,55,0.5); }
        
        .btn-outline { 
          padding: 1.25rem 3rem; border-radius: 50px; 
          background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.1); 
          font-weight: 900; letter-spacing: 2px; cursor: pointer; transition: all 0.4s;
          display: flex; alignItems: center; gap: 1rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
        }
        .btn-outline:hover { border-color: #D4AF37; background: rgba(212,175,55,0.06); transform: translateY(-2px); }

        .loader-screen { 
          height: 100vh; display: flex; align-items: center; justify-content: center; 
          background: #090e17; color: #D4AF37; font-weight: 900; letter-spacing: 15px; 
          font-family: 'Outfit', sans-serif; font-size: 1.5rem;
        }
      `}</style>
    </div>
  );
}
