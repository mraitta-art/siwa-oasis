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
  const [uploading, setUploading] = useState(false);
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

      <div className="container-fluid" style={{ marginTop: '2rem', paddingBottom: '10rem' }}>
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
                   <div style={{ position: 'relative', width: '100px', height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {biz.custom_data?.basic?.business_logo ? <img src={biz.custom_data.basic.business_logo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }} alt="Logo" /> : <i className="fas fa-image fa-2x" style={{ opacity: 0.1 }}></i>}
                      {uploading && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-spinner fa-spin" style={{ color: '#D4AF37' }}></i>
                        </div>
                      )}
                   </div>
                   
                   <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input 
                          type="text" 
                          className="dna-input" 
                          style={{ flex: 1 }}
                          placeholder="Paste Logo URL from Cloudinary..." 
                          value={biz.custom_data?.basic?.business_logo || ''} 
                          onChange={e => updateCustomData('basic', 'business_logo', e.target.value)} 
                        />
                        <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.85rem 2rem', fontSize: '0.7rem', flexShrink: 0 }}>
                           <i className="fas fa-upload"></i> UPLOAD FROM DEVICE
                           <input 
                             type="file" 
                             hidden 
                             accept="image/*" 
                             onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (!file) return;

                               // Optimistic Local Preview
                               const localUrl = URL.createObjectURL(file);
                               updateCustomData('basic', 'business_logo', localUrl);

                               setUploading(true);
                               try {
                                 const fd = new FormData();
                                 fd.append('file', file);
                                 fd.append('businessName', biz.name);
                                 fd.append('sectionName', 'branding');
                                 const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                 const data = await res.json();
                                 if (data.url) {
                                   updateCustomData('basic', 'business_logo', data.url);
                                   notify('Logo Synchronized', 'success');
                                 }
                               } catch (err) {
                                 notify('Upload Failed', 'error');
                               } finally {
                                 setUploading(false);
                                 URL.revokeObjectURL(localUrl);
                               }
                             }}
                           />
                        </label>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>
                        <i className="fas fa-info-circle" style={{ color: '#D4AF37', marginRight: '5px' }}></i> 
                        PRO TIP: For best results, use a transparent PNG or SVG logo.
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Site Architecture</h2>
              <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', marginBottom: '1.5rem', letterSpacing: '2px' }}>BLUEPRINT CORE</h3>
                  <div className="section-grid-mini">
                    {sections.filter(s => templateSections.includes(s.id)).map(s => (
                      <div key={s.id} className="section-item-static">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                           <i className={`fas ${s.icon}`} style={{ color: '#6366f1' }}></i> {s.name}
                        </span>
                        <span className="badge-blue" style={{ background: '#6366f1', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.5rem', fontWeight: 900 }}>MANDATORY</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', marginBottom: '1.5rem', letterSpacing: '2px' }}>DNA OPPORTUNITIES</h3>
                  <div className="section-grid-mini">
                    {sections.filter(s => !templateSections.includes(s.id)).map(s => {
                      const isActive = activeSectionIds.includes(s.id);
                      return (
                        <div key={s.id} className={`section-item-toggle ${isActive ? 'active' : ''}`} style={{ padding: '1rem' }} onClick={() => {
                          if (isActive) {
                            const next = { ...biz.custom_data };
                            delete next[s.id];
                            updateBiz({ custom_data: next });
                          } else {
                            updateCustomData(s.id, 'initialized', true);
                          }
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <i className={`fas ${s.icon}`}></i> {s.name}
                          </span>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isActive ? '#D4AF37' : 'rgba(255,255,255,0.1)', boxShadow: isActive ? '0 0 10px rgba(212,175,55,0.4)' : 'none' }}></div>
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
            <div className="tab-content animate-in" style={{ display: 'flex', gap: '2rem' }}>
              <aside className="dna-sidebar" style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '2rem', height: 'fit-content' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', marginBottom: '1rem', paddingLeft: '1rem' }}>ACTIVE DNA LAYERS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sections.filter(s => activeSectionIds.includes(s.id)).map(s => {
                    // Mock progress logic: check if custom_data[s.id] has more than just 'initialized'
                    const sData = biz.custom_data?.[s.id] || {};
                    const dataPoints = Object.keys(sData).filter(k => k !== 'initialized' && sData[k]).length;
                    const isFed = dataPoints > 0;
                    
                    return (
                      <button 
                        key={s.id} 
                        className={`dna-nav-btn ${activeSectionId === s.id ? 'active' : ''}`}
                        onClick={() => setActiveSectionId(s.id)}
                        style={{ padding: '1rem', fontSize: '0.8rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <i className={`fas ${s.icon}`} style={{ width: '1.2rem', textAlign: 'center' }}></i> 
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {biz.custom_data?.basic?.section_labels?.[s.id] || s.name}
                          </span>
                        </div>
                        {isFed && <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '0.7rem' }}></i>}
                      </button>
                    );
                  })}
                </div>
              </aside>
              <main style={{ flex: 1, minWidth: 0 }}>
                {activeSectionId && (
                  <div key={activeSectionId} className="animate-in">
                    <div style={{ 
                      position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15,23,42,0.8)', 
                      backdropFilter: 'blur(10px)', padding: '1rem 0', marginBottom: '2rem',
                      borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
                        <i className={`fas ${sections.find(s => s.id === activeSectionId)?.icon}`} style={{ color: '#D4AF37', marginRight: '1rem' }}></i>
                        {sections.find(s => s.id === activeSectionId)?.name} Feeding
                      </h2>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>LAYER: {activeSectionId.toUpperCase()}</div>
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
              <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {sections.filter(s => activeSectionIds.includes(s.id)).map(s => (
                  <div key={s.id} className="form-group" style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
          padding: 0 2rem; 
        }

        .orchestrator-header { 
          background: radial-gradient(circle at top right, rgba(212,175,55,0.1), transparent), #0f172a; 
          padding: 6rem 0 0; 
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .badge-premium { 
          display: inline-block; background: #D4AF37; color: #1e293b; 
          padding: 6px 16px; borderRadius: 50px; font-size: 0.6rem; 
          font-weight: 900; letter-spacing: 2px; margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(212,175,55,0.4);
          font-family: 'Outfit', sans-serif;
        }

        .title { 
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2rem, 5vw, 3.5rem); 
          font-weight: 900; margin: 0; letter-spacing: -2px; 
          text-shadow: 0 10px 40px rgba(0,0,0,0.6);
          line-height: 1;
        }
        
        .orchestrator-tabs { display: flex; gap: clamp(1rem, 2vw, 3rem); margin-top: 4rem; flex-wrap: wrap; }
        .tab-btn { 
          background: none; border: none; color: rgba(255,255,255,0.3); 
          font-weight: 900; font-size: 0.75rem; letter-spacing: 2px; 
          padding: 1rem 0; cursor: pointer; border-bottom: 3px solid transparent; 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Outfit', sans-serif;
        }
        .tab-btn:hover { color: #fff; }
        .tab-btn.active { color: #D4AF37; border-bottom-color: #D4AF37; text-shadow: 0 0 15px rgba(212,175,55,0.5); }

        .glass-card { 
          background: rgba(255,255,255,0.02); 
          border-radius: 32px; padding: clamp(1.5rem, 3vw, 3.5rem); 
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.7); 
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(40px);
          width: 100%;
        }

        .section-title { 
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem; font-weight: 900; margin: 0 0 3rem; 
          color: #fff; border-left: 5px solid #D4AF37; padding-left: 1.5rem;
          letter-spacing: -0.5px;
        }

        .grid-responsive { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
          gap: 2rem; 
        }

        @media (max-width: 768px) {
          .container-fluid { padding: 0 1rem; }
          .grid-responsive { grid-template-columns: 1fr; }
          .orchestrator-tabs { gap: 1rem; }
          .glass-card { padding: 1.5rem; }
          .dna-sidebar { width: 100% !important; padding: 0 !important; border: none !important; position: relative !important; top: 0 !important; margin-bottom: 2rem; }
          .tab-content { flex-direction: column !important; }
        }

        .dna-label { 
          font-size: 0.6rem; font-weight: 900; color: #D4AF37; 
          letter-spacing: 1.5px; display: block; margin-bottom: 1rem;
          font-family: 'Outfit', sans-serif;
        }
        
        .dna-input { 
          width: 100%; 
          background: rgba(255,255,255,0.03); 
          border: 1.2px solid rgba(255,255,255,0.08); 
          borderRadius: 12px; padding: 1rem; color: #fff; 
          font-weight: 600; outline: none; transition: all 0.3s;
          font-size: 0.9rem;
        }
        .dna-input:focus { border-color: #D4AF37; background: rgba(212,175,55,0.04); box-shadow: 0 0 15px rgba(212,175,55,0.1); }

        .section-grid-mini { display: grid; gap: 0.75rem; }
        
        .section-item-static { 
          background: rgba(255,255,255,0.02); padding: 1rem; 
          borderRadius: 12px; display: flex; justifyContent: space-between; 
          alignItems: center; font-weight: 800; color: #cbd5e1; font-size: 0.85rem;
          border: 1px solid rgba(255,255,255,0.04);
        }

        .section-item-toggle { 
          background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.06); 
          padding: 1rem; borderRadius: 12px; display: flex; justifyContent: space-between; 
          alignItems: center; font-weight: 800; color: #94a3b8; cursor: pointer; transition: all 0.3s;
        }
        .section-item-toggle:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
        .section-item-toggle.active { border-color: #D4AF37; background: rgba(212,175,55,0.06); color: #fff; }
        
        .dna-sidebar { 
          display: flex; flexDirection: column; gap: 0.75rem; 
          border-right: 1px solid rgba(255,255,255,0.05); padding-right: 2rem; 
        }
        
        .dna-nav-btn { 
          background: transparent; border: none; text-align: left; 
          padding: 1rem; borderRadius: 12px; font-weight: 800; 
          color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.4s; 
          display: flex; alignItems: center; gap: 1rem;
          font-family: 'Outfit', sans-serif;
        }
        .dna-nav-btn:hover:not(.active) { background: rgba(255,255,255,0.03); color: #fff; }
        .dna-nav-btn.active { 
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
          color: #D4AF37; border: 1px solid rgba(212,175,55,0.2);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }

        .btn-premium { 
          padding: 1rem 2.5rem; border-radius: 50px; 
          background: linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%); 
          color: #1a1a2e; border: none; font-weight: 900; letter-spacing: 1.5px; cursor: pointer;
          box-shadow: 0 12px 30px rgba(212,175,55,0.3); 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; alignItems: center; gap: 0.75rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
        }
        .btn-premium:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(212,175,55,0.4); }
        
        .btn-outline { 
          padding: 1rem 2.5rem; border-radius: 50px; 
          background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.1); 
          font-weight: 900; letter-spacing: 1.5px; cursor: pointer; transition: all 0.4s;
          display: flex; alignItems: center; gap: 0.75rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
        }
        .btn-outline:hover { border-color: #D4AF37; background: rgba(212,175,55,0.05); transform: translateY(-2px); }

        .loader-screen { 
          height: 100vh; display: flex; align-items: center; justify-content: center; 
          background: #090e17; color: #D4AF37; font-weight: 900; letter-spacing: 10px; 
          font-family: 'Outfit', sans-serif; font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
}
