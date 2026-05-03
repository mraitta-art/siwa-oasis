'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';

export default function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSections, setActiveSections] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const bRes = await fetch(`/api/businesses/${id}`);
        const data = await bRes.json();
        setBiz(data);

        // Fetch sections for this typology to know what to render
        const sRes = await fetch(`/api/jana/sections?type=${data.type_id}`);
        const sections = await sRes.json();
        setActiveSections(sections);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) return (
    <div style={{ background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <i className="fas fa-circle-notch fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '1.5rem' }}></i>
      <span style={{ fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 700, opacity: 0.5 }}>GENERATING MINISITE...</span>
    </div>
  );
  
  if (!biz) return <div style={{ textAlign: 'center', padding: '5rem' }}><h3>Business not found</h3><Link href="/">Back home</Link></div>;

  const data = biz.custom_data || {};
  const curation = biz.curation_data ? (typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data) : {};

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* 1. CINEMATIC AUTOMATED HERO */}
      <AutomatedMinisiteHero 
        businessName={biz.name}
        activeSections={activeSections}
        customData={data}
        curationData={curation}
        tierFeatures={{ hero_automation: true }} // Assumed for the demo profile
      />

      {/* 2. NAVIGATION BAR (Sticky) */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '1rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b' }}>{biz.name.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {activeSections.slice(0, 5).map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px' }}>
                {s.name.toUpperCase()}
              </a>
            ))}
          </div>
          <Link href="/" className="btn btn-sm btn-outline gold-border">SIWA TODAY</Link>
        </div>
      </nav>

      {/* 3. DYNAMIC CONTENT BLOCKS */}
      <div className="container" style={{ maxWidth: '1200px', padding: '4rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '4rem' }}>
          
          <main>
            {activeSections.map(section => {
              const secData = data[section.id];
              if (!secData) return null;

              return (
                <section key={section.id} id={section.id} style={{ marginBottom: '6rem', scrollMarginTop: '100px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      <i className={`fas ${section.icon || 'fa-layer-group'}`}></i>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>{section.name}</h2>
                      <div style={{ height: '3px', width: '40px', background: '#D4AF37', marginTop: '0.5rem' }}></div>
                    </div>
                  </div>

                  {secData.mini_blog ? (
                    <div 
                      className="rich-content" 
                      dangerouslySetInnerHTML={{ __html: secData.mini_blog }} 
                      style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '2.5rem' }}
                    />
                  ) : (
                    <div style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '2.5rem' }}>
                      {secData.section_news || secData.description || `Experience the finest of ${section.name} at our establishment.`}
                    </div>
                  )}

                  {/* Secondary Data Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {Object.entries(secData).map(([key, val]) => {
                      if (['section_news', 'section_gallery'].includes(key)) return null;
                      return (
                        <div key={key} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem' }}>{key.replace('_', ' ').toUpperCase()}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                            {Array.isArray(val) ? val.join(', ') : String(val)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Local Gallery (If not handled by hero) */}
                  {secData.section_gallery && Array.isArray(secData.section_gallery) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '2.5rem' }}>
                      {secData.section_gallery.map((item: any, i: number) => (
                        <div key={i} style={{ height: '150px', borderRadius: '12px', overflow: 'hidden' }}>
                          <img 
                            src={typeof item === 'object' ? item.url : item} 
                            alt={`${section.name} gallery`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </main>

          <aside>
            <div style={{ position: 'sticky', top: '100px' }}>
              <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '24px', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Book Experience</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '2rem' }}>Ready to visit {biz.name}? Our team in Siwa Oasis is ready to welcome you.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ color: '#D4AF37' }}><i className="fas fa-phone-alt"></i></div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>+20 (12) SIWA-OASIS</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ color: '#D4AF37' }}><i className="fas fa-map-marker-alt"></i></div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Siwa Oasis, Matrouh, Egypt</div>
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 900, boxShadow: '0 10px 15px -3px rgba(212, 175, 55, 0.4)' }}>
                  ENQUIRE NOW
                </button>
              </div>

              {/* Verified Badge */}
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                 <div style={{ color: '#22c55e', fontSize: '1.5rem' }}><i className="fas fa-check-circle"></i></div>
                 <div>
                    <div style={{ fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>SIWA TRUST VERIFIED</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Inspected and certified heritage unit.</div>
                 </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      <footer style={{ background: '#0f172a', padding: '5rem 0', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontWeight: 900, letterSpacing: '4px', fontSize: '1.5rem', marginBottom: '1rem' }}>SIWA TODAY</div>
        <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Automated Cinematic Minisite Engine v4.0</p>
      </footer>
    </div>
  );
}

