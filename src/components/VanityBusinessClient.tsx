'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';

/**
 * VANITY URL CLIENT COMPONENT
 * Handles the interactive minisite UI.
 */
export default function VanityBusinessClient({ slug, initialData, sections }: { slug: string, initialData: any, sections: any[] }) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Sync active tab when sections change or on mount
  useEffect(() => {
    if (sections && sections.length > 0) {
      // Check for hash link first
      const hash = window.location.hash.replace('#', '');
      const hasMatchingSection = sections.some(s => s.id === hash);
      
      if (hasMatchingSection) {
        setActiveTab(hash);
      } else {
        setActiveTab(sections[0].id);
      }
    }

    // Listen for hash changes (for carousel jumps)
    const handleHash = () => {
      const h = window.location.hash.replace('#', '');
      if (sections.some(s => s.id === h)) setActiveTab(h);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [slug, sections]);

  const biz = initialData;
  const activeSections = sections;

  const data = biz.custom_data || {};
  const curation = biz.curation_data ? (typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data) : {};
  const sectionValues = Object.values(data) as any[];
  const dynamicPhone = data.phone || sectionValues.find(s => s?.phone)?.phone || '+20 (12) SIWA-OASIS';
  const dynamicEmail = data.email || sectionValues.find(s => s?.email)?.email || '';
  const dynamicAddress = data.address || sectionValues.find(s => s?.address)?.address || 'Siwa Oasis, Matrouh, Egypt';
  const dynamicLogo = data.business_logo || data.logo || sectionValues.find(s => s?.business_logo || s?.logo)?.business_logo || sectionValues.find(s => s?.logo)?.logo || undefined;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      <AutomatedMinisiteHero 
        businessName={biz.name}
        businessLogo={biz.tier_features?.allow_custom_logo ? dynamicLogo : undefined}
        activeSections={activeSections}
        customData={data}
        curationData={curation}
        tierFeatures={{ 
          hero_automation: true, 
          remove_watermark: biz.tier_features?.remove_watermark,
          allow_youtube_story: biz.tier_features?.allow_youtube_story 
        }}
      />

      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '1rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b' }}>{(biz?.name || '').toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {activeSections.map(s => {
              const customLabel = biz.custom_data?.section_labels?.[s.id] || s.name;
              return (
                <button 
                  key={s.id} 
                  onClick={() => {
                    window.location.hash = s.id;
                    setActiveTab(s.id);
                  }}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: activeTab === s.id ? '#D4AF37' : '#64748b', 
                    fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px',
                    borderBottom: activeTab === s.id ? '2px solid #D4AF37' : '2px solid transparent',
                    paddingBottom: '0.5rem', transition: 'all 0.3s'
                  }}>
                  {(customLabel || '').toUpperCase()}
                </button>
              );
            })}
          </div>
          <Link href="/" className="btn btn-sm btn-outline gold-border">SIWA TODAY</Link>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '1200px', padding: '4rem 1.5rem' }}>
        <div style={{ gridTemplateColumns: '1fr 380px', display: 'grid', gap: '4rem' }}>
          <main>
            {activeSections.filter(s => s.id === activeTab).map(section => {
              const secData = data[section.id];
              const customLabel = biz.custom_data?.section_labels?.[section.id] || section.name;
              if (!secData) return <div key={section.id} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No data available for {customLabel}.</div>;

              return (
                <section key={section.id} id={section.id} className="animate-in fade-in duration-500" style={{ marginBottom: '6rem', scrollMarginTop: '100px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      <i className={`fas ${section.icon || 'fa-layer-group'}`}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>{customLabel}</h2>
                      <div style={{ height: '3px', width: '40px', background: '#D4AF37', marginTop: '0.5rem' }}></div>
                    </div>
                  </div>

                  <div>
                      {secData.section_blog ? (
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: secData.section_blog }} style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '2.5rem' }} />
                      ) : (
                        <div style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '2.5rem' }}>
                          {secData.section_news || secData.description || `Experience the finest of ${section.name} at our establishment.`}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {Object.entries(secData).map(([key, val]) => {
                          if (['section_news', 'section_gallery', 'section_blog', 'mini_blog', 'feature_on_main', 'youtube_story', 'description'].includes(key)) return null;
                          return (
                            <div key={key} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem' }}>{(key || '').replace(/_/g, ' ').toUpperCase()}</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{Array.isArray(val) ? val.join(', ') : String(val)}</div>
                            </div>
                          );
                        })}
                      </div>

                      {secData.section_gallery && Array.isArray(secData.section_gallery) && (
                        <div style={{ marginTop: '2.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                            {secData.section_gallery.map((item: any, i: number) => {
                              const mediaUrl = typeof item === 'object' ? item.url : item;
                              const caption = typeof item === 'object' ? item.caption : '';
                              const isVideo = mediaUrl && (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.mov') || mediaUrl.includes('/video/upload/'));
                              
                              return (
                                <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid #f1f5f9' }}>
                                  <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#000' }}>
                                    {isVideo ? (
                                      <video src={mediaUrl} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <img src={mediaUrl} alt={caption || `${section.name} gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                  </div>
                                  {caption && <div style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{caption}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                </section>
              );
            })}
          </main>
          <aside>
            <div style={{ position: 'sticky', top: '100px' }}>
              <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '24px', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Book Experience</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ color: '#D4AF37' }}><i className="fas fa-phone-alt"></i></div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dynamicPhone}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ color: '#D4AF37' }}><i className="fas fa-map-marker-alt"></i></div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{dynamicAddress}</div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 900 }}>ENQUIRE NOW</button>
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
