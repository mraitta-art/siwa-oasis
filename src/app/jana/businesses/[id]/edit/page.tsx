'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';

/**
 * PREMIUM BUSINESS DNA ARCHITECT
 * An immersive, state-of-the-art interface for high-fidelity data entry.
 */
export default function BusinessEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [biz, setBiz] = useState<any>(null);
  const [parentType, setParentType] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [tier, setTier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── LOCAL PERSISTENCE ───────────────────────────────────────────
  const STORAGE_KEY = `siwa_edit_draft_${id}`;

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && biz) {
      try {
        const parsed = JSON.parse(saved);
        setBiz((prev: any) => ({ ...prev, custom_data: parsed }));
      } catch (e) { console.error("Failed to restore draft", e); }
    }
  }, [loading]);

  useEffect(() => {
    if (biz?.custom_data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(biz.custom_data));
    }
  }, [biz?.custom_data]);

  // ── DATA FETCHING ───────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    try {
      const bRes = await fetch(`/api/jana/businesses?id=${id}`);
      const business = await bRes.json();
      setBiz(business);

      // Fetch Type & Parent info
      const tInfoRes = await fetch(`/api/jana/types?id=${business.type_id}`);
      const typeInfo = await tInfoRes.json();
      if (typeInfo.parent_id) {
        const pRes = await fetch(`/api/jana/types?id=${typeInfo.parent_id}`);
        setParentType(await pRes.json());
      } else if (typeInfo.is_parent) {
        setParentType(typeInfo);
      }

      const fRes = await fetch(`/api/jana/forms?type=${business.type_id}`);
      const schema = await fRes.json();
      setFields(schema);

      const sRes = await fetch('/api/jana/sections');
      const allSections = await sRes.json();
      const uniqueSectionIds = Array.from(new Set(schema.map((f: any) => f.section_id)));
      const filteredSections = allSections.filter((s: any) => uniqueSectionIds.includes(s.id));
      setSections(filteredSections);
      if (filteredSections.length > 0) setActiveTab(filteredSections[0].id);

      const trRes = await fetch('/api/jana/tiers');
      const allTiers = await trRes.json();
      const myTier = allTiers.find((t: any) => t.id === business.subscription_tier);
      setTier(myTier);

    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const handleDataChange = (sectionId: string, name: string, value: any) => {
    setBiz((prev: any) => {
      const nextCustom = { ...prev.custom_data || {} };
      if (!nextCustom[sectionId]) nextCustom[sectionId] = {};
      nextCustom[sectionId][name] = value;
      return { ...prev, custom_data: nextCustom };
    });
  };

  async function saveBusiness() {
    setSaving(true);
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          custom_data: biz.custom_data
        })
      });
      if (res.ok) {
        localStorage.removeItem(STORAGE_KEY);
        alert('✨ Business DNA Synchronized with the Oasis!');
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  // Calculate Progress
  const totalSections = sections.length;
  const filledSections = sections.filter(s => biz?.custom_data?.[s.id] && Object.keys(biz.custom_data[s.id]).length > 0).length;
  const progressPercent = Math.round((filledSections / totalSections) * 100) || 0;

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>
      <div className="spinner-glow"></div>
      <p style={{ marginTop: '2rem', fontWeight: 700, letterSpacing: '2px', opacity: 0.6 }}>INITIALIZING ARCHITECT</p>
    </div>
  );

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', paddingBottom: '5rem' }}>
      
      {/* ── STICKY TOP NAV ────────────────────────────────────────── */}
      <nav style={{ 
        position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.8)', 
        backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/jana/businesses" style={{ width: 40, height: 40, borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>DNA ARCHITECT</div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{biz.name}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: progressPercent === 100 ? '#10b981' : (parentType?.icon_color || '#D4AF37'), marginBottom: '4px' }}>
              {progressPercent === 100 ? 'READY FOR PUBLISHING' : `ORCHESTRATION: ${progressPercent}%`}
            </div>
            <div style={{ width: '180px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: `linear-gradient(90deg, ${parentType?.icon_color || '#D4AF37'}, #F5E6AD)`, borderRadius: '3px', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
            </div>
          </div>
          
          <Link
            href={`/jana/businesses/${id}/qr`}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '14px', background: '#fff',
              color: '#475569', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.85rem',
              cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <i className="fas fa-qrcode"></i> QR KIT
          </Link>

          <button 
            onClick={saveBusiness} 
            disabled={saving}
            className={`btn-premium ${saving ? 'loading' : ''}`}
            style={{ 
              padding: '0.75rem 2rem', borderRadius: '14px', background: '#1e293b', 
              color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem',
              cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(30,41,59,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}
          >
            {saving ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
            {saving ? 'SYNCING...' : 'PUBLISH CHANGES'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1500px', margin: '3rem auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '250px 1fr 350px', gap: '3rem', alignItems: 'start' }}>
        
        {/* ── LEFT: SECTION NAV ───────────────────────────────────── */}
        <aside style={{ position: 'sticky', top: '7rem' }}>
          <div style={{ marginBottom: '2.5rem', padding: '1.25rem', borderRadius: '20px', background: `${parentType?.icon_color || '#D4AF37'}10`, border: `1px solid ${parentType?.icon_color || '#D4AF37'}20` }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: parentType?.icon_color || '#D4AF37', letterSpacing: '2px', marginBottom: '0.5rem' }}>MASTER DNA SYSTEM</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <i className={parentType?.icon || 'fas fa-dna'}></i>
               {parentType?.name.toUpperCase() || 'MASTER'} ARCHITECT
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', marginBottom: '1.5rem' }}>BLUEPRINT SECTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sections.map(s => {
                const isActive = activeTab === s.id;
                const sectionFields = fields.filter((f: any) => f.section_id === s.id);
                const filledFields = sectionFields.filter((f: any) => biz.custom_data?.[s.id]?.[f.name]);
                const health = sectionFields.length > 0 ? Math.round((filledFields.length / sectionFields.length) * 100) : 0;
                
                return (
                  <button 
                    key={s.id}
                    onClick={() => {
                      setActiveTab(s.id);
                      document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    style={{ 
                      textAlign: 'left', padding: '1rem', borderRadius: '12px', border: 'none',
                      background: isActive ? '#1e293b' : 'transparent',
                      color: isActive ? '#fff' : '#64748b',
                      fontWeight: isActive ? 800 : 600, fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s',
                      position: 'relative', overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '4px', height: '100%', position: 'absolute', left: 0, top: 0, background: health === 100 ? '#10b981' : (health > 0 ? '#D4AF37' : '#e2e8f0') }}></div>
                    <i className={`fas ${s.icon}`} style={{ width: 20, color: isActive ? '#D4AF37' : '#94a3b8' }}></i>
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 900 }}>{health}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '20px', color: '#fff' }}>
             <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 800 }}>Master Tip</h4>
             <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7, lineHeight: 1.5 }}>
               A complete DNA profile increases minisite visibility by up to 40%. Fill out the "Vibe" section for cinematic impact.
             </p>
          </div>
        </aside>

        {/* ── CENTER: THE FORM ────────────────────────────────────── */}
        <div ref={scrollContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* NAVIGATION BRANDING (LABEL OVERRIDES) */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#6366f1' }}>
                <i className="fas fa-tags"></i>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Navigation Branding</h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Override default section labels for bespoke branding.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {sections.map(s => (
                <div key={s.id}>
                  <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>
                    {s.name.toUpperCase()} TAB LABEL
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder={s.name}
                    value={biz.custom_data?.section_labels?.[s.id] || ''}
                    onChange={(e) => {
                      const nextLabels = { ...biz.custom_data?.section_labels || {} };
                      nextLabels[s.id] = e.target.value;
                      setBiz((prev: any) => ({
                        ...prev,
                        custom_data: { ...prev.custom_data, section_labels: nextLabels }
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {sections.map(section => (
            <div 
              key={section.id} 
              id={`section-${section.id}`}
              className={`section-card ${activeTab === section.id ? 'active' : ''}`}
              style={{ 
                background: '#fff', borderRadius: '24px', padding: '3rem', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 10px 15px -3px rgba(0,0,0,0.01)',
                border: activeTab === section.id ? '2px solid #D4AF37' : '1px solid #f1f5f9',
                display: activeTab === section.id ? 'block' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#D4AF37' }}>
                  <i className={`fas ${section.icon}`}></i>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{section.name}</h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Category Configuration Module</p>
                </div>
              </div>
 
              <DynamicForm 
                fields={fields.filter(f => f.section_id === section.id)}
                data={biz.custom_data || {}}
                onChange={handleDataChange}
                sections={[section]}
                userRole="admin"
                tierFeatures={tier?.features || {}}
                businessName={biz.name}
                typology={parentType?.name}
              />
            </div>
          ))}
        </div>

        {/* ── RIGHT: LIVE PREVIEW & NARRATIVE STATUS ─────────────── */}
        <aside style={{ position: 'sticky', top: '7rem' }}>
           <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', marginBottom: '1.5rem' }}>LIVE HERO PROPAGATION</div>
           
           {/* CINEMATIC PREVIEW CARD */}
           <div style={{ background: '#1e293b', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ height: '200px', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                {/* Simulated Carousel Logic */}
                {(() => {
                  const currentSection = sections.find(s => s.id === activeTab);
                  const secData = biz.custom_data?.[activeTab] || {};
                  const bgImage = secData.section_gallery?.[0]?.url || secData.logo || "https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=800";
                  const story = secData.mini_blog || secData.description || "Synthesizing DNA story...";
                  
                  return (
                    <>
                      <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                      <div style={{ position: 'absolute', inset: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(to top, rgba(15,23,42,0.9), transparent)' }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                          {currentSection?.name.toUpperCase()} DNA
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {story}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div style={{ padding: '1.5rem', background: '#fff' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>{biz.name}</h3>
                <div style={{ fontSize: '0.65rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <i className="fas fa-magic" style={{ color: '#D4AF37' }}></i>
                   Automated Story Propagation Active
                </div>
                
                <Link href={`/${biz.slug || biz.id}`} target="_blank" style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', textDecoration: 'none', padding: '0.75rem', background: '#1e293b', color: '#fff', borderRadius: '12px', fontWeight: 800, fontSize: '0.7rem' }}>
                  VIEW FULL MINISITE
                </Link>
              </div>
           </div>

           <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
               <i className="fas fa-rss" style={{ color: '#D4AF37' }}></i>
               <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>Blog Collection</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sections.map(s => {
                  const hasBlog = biz.custom_data?.[s.id]?.mini_blog?.length > 50;
                  return (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', opacity: hasBlog ? 1 : 0.4 }}>
                      <span style={{ color: '#64748b' }}>{s.name} Story</span>
                      {hasBlog ? <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> : <i className="fas fa-circle" style={{ color: '#e2e8f0' }}></i>}
                    </div>
                  );
                })}
             </div>
           </div>
        </aside>

      </div>

      <style jsx>{`
        .spinner-glow {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(212, 175, 55, 0.1);
          border-top: 4px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite, glow 2s ease-in-out infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0); } 50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.4); } }
        
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(30,41,59,0.4);
        }
        .btn-premium:active { transform: translateY(0); }
        .btn-premium.loading { opacity: 0.8; cursor: wait; }

        .section-card { animation: fadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
