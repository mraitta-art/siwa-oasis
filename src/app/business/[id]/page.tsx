'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

export default function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSections, setActiveSections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (activeSections.length > 0 && !activeTab) {
      setActiveTab(activeSections[0].id);
    }
  }, [activeSections, activeTab]);

  useEffect(() => {
    async function loadData() {
      try {
        const bRes = await fetch(`/api/businesses/${id}`);
        const bizData = await bRes.json();
        setBiz(bizData);

        // Fetch sections for this typology
        const sRes = await fetch(`/api/jana/sections?type=${bizData.type_id}`);
        let sections = await sRes.json();

        // TIER-BASED FILTERING: Only show sections allowed by the tier
        const allowed = bizData.tier_features?.allowed_public_sections;
        if (allowed && Array.isArray(allowed)) {
           sections = sections.filter((s: any) => allowed.includes(s.id));
        }

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

  // DYNAMIC HUNT: Find contact info and logo either at the root or nested inside any dynamic section
  const sectionValues = Object.values(data) as any[];
  const dynamicPhone = data.phone || sectionValues.find(s => s?.phone)?.phone || '+20 (12) SIWA-OASIS';
  const dynamicEmail = data.email || sectionValues.find(s => s?.email)?.email || '';
  const dynamicAddress = data.address || sectionValues.find(s => s?.address)?.address || 'Siwa Oasis, Matrouh, Egypt';
  const dynamicLogo = data.business_logo || data.logo || sectionValues.find(s => s?.business_logo || s?.logo)?.business_logo || sectionValues.find(s => s?.logo)?.logo || undefined;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": biz.name,
          "description": biz.name + " in Siwa Oasis",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Siwa Oasis",
            "addressRegion": "Matrouh",
            "addressCountry": "EG"
          },
          "url": `https://siwa.today/business/${id}`
        }) }}
      />
      
      {/* 1. CINEMATIC AUTOMATED HERO */}
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

      {/* 2. NAVIGATION BAR (Sticky) */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '1rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b' }}>{(biz?.name || '').toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {activeSections.map(s => (
              <button 
                key={s.id} 
                onClick={() => setActiveTab(s.id)}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: activeTab === s.id ? '#D4AF37' : '#64748b', 
                  fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px',
                  borderBottom: activeTab === s.id ? '2px solid #D4AF37' : '2px solid transparent',
                  paddingBottom: '0.5rem', transition: 'all 0.3s'
                }}>
                {(s?.name || '').toUpperCase()}
              </button>
            ))}
          </div>
          <Link href="/" className="btn btn-sm btn-outline gold-border">SIWA TODAY</Link>
        </div>
      </nav>

      {/* 3. DYNAMIC CONTENT BLOCKS */}
      <div className="container" style={{ maxWidth: '1200px', padding: '4rem 1.5rem' }}>
        
        {/* If the business has custom Page Builder components, render them */}
        {biz.components && Array.isArray(biz.components) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
             {biz.components.map((c: any) => {
               // Reuse the same logic as the main marketplace renderer
               // but context-aware for the specific business
               if (['hero_carousel', 'hero', 'cinematic_carousel'].includes(c.type)) {
                 const nameToLoad = c.props?.carouselName || `biz_${id}_${c.id}`;
                 return (
                   <div key={c.id}>
                     <AdvancedHeroCarousel 
                       carouselName={nameToLoad} 
                       height={c.props?.height || "60vh"} 
                       autoPlay={true}
                     />
                   </div>
                 );
               }
               // Add other component types as needed...
               return <div key={c.id}>Component: {c.type}</div>;
             })}
          </div>
        ) : (
          /* FALLBACK: Original Automatic Section Rendering */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '4rem' }}>
            <main>
              {activeSections.filter(s => s.id === activeTab).map(section => {
                const secData = data[section.id];
                if (!secData) return <div key={section.id} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No data available for {section.name}.</div>;

                return (
                  <section key={section.id} className="animate-in fade-in duration-500" style={{ marginBottom: '6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                        <i className={`fas ${section.icon || 'fa-layer-group'}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>{section.name}</h2>
                        <div style={{ height: '3px', width: '40px', background: '#D4AF37', marginTop: '0.5rem' }}></div>
                      </div>
                    </div>

                    <div>
                        {secData.section_blog ? (
                          <div 
                            className="rich-content" 
                            dangerouslySetInnerHTML={{ __html: secData.section_blog }} 
                            style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '2.5rem' }}
                          />
                        ) : secData.mini_blog ? (
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
                            if (['section_news', 'section_gallery', 'section_blog', 'mini_blog', 'feature_on_main', 'youtube_story', 'description'].includes(key)) return null;
                            return (
                              <div key={key} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem' }}>{(key || '').replace(/_/g, ' ').toUpperCase()}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                                  {Array.isArray(val) ? val.join(', ') : String(val)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Local Gallery (If not handled by hero) */}
                        {secData.section_gallery && Array.isArray(secData.section_gallery) && (
                          <div style={{ marginTop: '2.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                              {secData.section_gallery.map((item: any, i: number) => {
                                const imgUrl = typeof item === 'object' ? item.url : item;
                                const caption = typeof item === 'object' ? item.caption : '';
                                return (
                                  <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
                                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                      <img 
                                        src={imgUrl} 
                                        alt={caption || `${section.name} gallery ${i + 1}`} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} 
                                      />
                                      {!biz.tier_features?.remove_watermark && (
                                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(15,23,42,0.6)', color: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.5rem', fontWeight: 900, letterSpacing: '1px', pointerEvents: 'none', backdropFilter: 'blur(2px)' }}>
                                          SIWA TODAY
                                        </div>
                                      )}
                                    </div>
                                    {caption && (
                                      <div style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#475569', fontWeight: 600, lineHeight: 1.5, borderTop: '1px solid #f8fafc' }}>
                                        {caption}
                                      </div>
                                    )}
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

              {/* RELATED STORIES — Accumulated Section Blogs */}
              {(() => {
                const stories = activeSections
                  .filter(s => {
                    const sd = data[s.id];
                    return sd && (sd.section_blog || sd.mini_blog);
                  })
                  .map(s => ({
                    sectionId: s.id,
                    sectionName: s.name,
                    sectionIcon: s.icon,
                    content: data[s.id].section_blog || data[s.id].mini_blog,
                    image: Array.isArray(data[s.id].section_gallery) && data[s.id].section_gallery[0]
                      ? (typeof data[s.id].section_gallery[0] === 'object' ? data[s.id].section_gallery[0].url : data[s.id].section_gallery[0])
                      : null
                  }));

                if (stories.length === 0) return null;

                return (
                  <section style={{ marginTop: '4rem', scrollMarginTop: '100px' }} id="stories">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                      <div style={{ width: '48px', height: '48px', background: '#1e293b', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                        <i className="fas fa-newspaper"></i>
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>Related Stories</h2>
                        <div style={{ height: '3px', width: '40px', background: '#D4AF37', marginTop: '0.5rem' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      {stories.map(story => (
                        <Link key={story.sectionId} href={`/business/${id}/stories/${story.sectionId}`}
                          style={{
                            background: '#fff', borderRadius: '20px', overflow: 'hidden',
                            border: '1px solid #f1f5f9', textDecoration: 'none', color: 'inherit',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.04)', transition: 'all 0.3s',
                            display: 'flex', flexDirection: 'column'
                          }}
                        >
                          {story.image && (
                            <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                              <img src={story.image} alt={story.sectionName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {!biz.tier_features?.remove_watermark && (
                                <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(15,23,42,0.6)', color: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.5rem', fontWeight: 900, letterSpacing: '1px', pointerEvents: 'none', backdropFilter: 'blur(2px)' }}>
                                  SIWA TODAY
                                </div>
                              )}
                            </div>
                          )}
                          <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <i className={`fas ${story.sectionIcon || 'fa-feather'}`} style={{ color: '#D4AF37', fontSize: '0.8rem' }}></i>
                              <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '1px', color: '#D4AF37', textTransform: 'uppercase' }}>{story.sectionName}</span>
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>
                              {biz.name}: {story.sectionName}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                              {story.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })()}
            </main>
            
            <aside>
              <div style={{ position: 'sticky', top: '100px' }}>
                <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '24px', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Book Experience</h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '2rem' }}>Ready to visit {biz.name}? Our team in Siwa Oasis is ready to welcome you.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ color: '#D4AF37' }}><i className="fas fa-phone-alt"></i></div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        {biz.tier_features?.allow_direct_contact ? dynamicPhone : '+20 (12) SIWA-OASIS'}
                      </div>
                    </div>
                    {biz.tier_features?.allow_direct_contact && dynamicEmail && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ color: '#D4AF37' }}><i className="fas fa-envelope"></i></div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dynamicEmail}</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ color: '#D4AF37' }}><i className="fas fa-map-marker-alt"></i></div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{dynamicAddress}</div>
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 900, boxShadow: '0 10px 15px -3px rgba(212, 175, 55, 0.4)' }}>
                    {biz.tier_features?.allow_direct_contact ? 'CONTACT VENDOR' : 'ENQUIRE NOW'}
                  </button>
                </div>

                {/* Verified Badge */}
                {biz.tier_features?.show_verified_badge && (
                  <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                     <div style={{ color: '#22c55e', fontSize: '1.5rem' }}><i className="fas fa-check-circle"></i></div>
                     <div>
                        <div style={{ fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>SIWA TRUST VERIFIED</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Inspected and certified heritage unit.</div>
                     </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <footer style={{ background: '#0f172a', padding: '5rem 0', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontWeight: 900, letterSpacing: '4px', fontSize: '1.5rem', marginBottom: '1rem' }}>SIWA TODAY</div>
        <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Automated Cinematic Minisite Engine v4.0</p>
      </footer>
    </div>
  );
}

