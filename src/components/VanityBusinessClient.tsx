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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

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

  // Toast auto-hide
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToastMessage = (msg: string) => {
    setToast({ message: msg, show: true });
  };

  const biz = initialData;
  const activeSections = sections;

  const data = biz.custom_data || {};
  const curation = biz.curation_data ? (typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data) : {};
  
  // Resolve Brand Assets from Chapter 1 (HERITAGE & IDENTITY)
  const identity = data.sec_1_identity || {};
  const dynamicPhone = identity.phone || data.phone || '+20 (12) SIWA-OASIS';
  const dynamicEmail = identity.email || data.email || '';
  const dynamicAddress = identity.address || data.address || 'Siwa Oasis, Matrouh, Egypt';
  const dynamicLogo = identity.business_logo || identity.logo || data.business_logo || data.logo || undefined;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = biz.name || 'Siwa Today Minisite';
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl
        });
      } catch (err) {
        navigator.clipboard.writeText(shareUrl);
        showToastMessage('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToastMessage('Link copied to clipboard!');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '6rem' }}>
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
        <div className="container minisite-nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', padding: '0 1.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
            {(biz?.name || '').toUpperCase()}
          </div>
          
          {/* Desktop tabs */}
          <div className="minisite-desktop-tabs" style={{ display: 'flex', gap: '2rem' }}>
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

          <Link href="/" className="btn btn-sm btn-outline gold-border minisite-desktop-home">SIWA TODAY</Link>

          {/* Mobile navigation toggle */}
          <div className="minisite-mobile-header-btns" style={{ display: 'none', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/" style={{ color: '#64748b', padding: '0.5rem', fontSize: '1.1rem' }} title="Siwa Today Home">
              <i className="fas fa-home"></i>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b', padding: '0.5rem', fontSize: '1.2rem' }}
              title="Open Chapters Menu"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>

        {/* Mobile Swipeable Tab Bar */}
        <div className="minisite-mobile-tabs-sub" style={{ display: 'none', marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
          <div className="minisite-nav-tabs" style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
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
                    background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                    color: activeTab === s.id ? '#D4AF37' : '#64748b', 
                    fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.5px',
                    borderBottom: activeTab === s.id ? '2px solid #D4AF37' : '2px solid transparent',
                    paddingBottom: '0.4rem', transition: 'all 0.3s'
                  }}>
                  {(customLabel || '').toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '1200px', padding: '4rem 1.5rem' }}>
        <div className="minisite-layout">
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

                    <div className="grid-2">
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                          {secData.section_gallery.map((item: any, i: number) => {
                            const isObj = typeof item === 'object';
                            const mediaUrl = isObj ? item.url : item;
                            const caption = isObj ? item.caption : '';
                            const displayMode = isObj ? item.display_mode : 'image';
                            const bgColor = isObj ? item.bg_color : '#fff';
                            const isVideo = mediaUrl && (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.mov') || mediaUrl.includes('/video/upload/'));
                            
                            const hasMedia = !!mediaUrl;
                            const hasCaption = !!caption;

                            if (displayMode === 'text_only' || (!hasMedia && hasCaption)) {
                              return (
                                <div key={i} style={{ 
                                  borderRadius: '20px', padding: '2.5rem', background: hasMedia ? bgColor : 'linear-gradient(135deg, #0f172a, #1e293b)', 
                                  border: '1px solid rgba(212,175,55,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                  justifyContent: 'center', textAlign: 'center', minHeight: '280px', position: 'relative',
                                  boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', gridColumn: caption?.length > 100 ? '1 / -1' : 'auto'
                                }}>
                                  {/* SIWA TODAY WATERMARK FALLBACK */}
                                  {!hasMedia && (
                                    <div style={{ 
                                      position: 'absolute', top: '1.5rem', fontSize: '0.6rem', fontWeight: 900, 
                                      color: '#D4AF37', letterSpacing: '4px', opacity: 0.5 
                                    }}>
                                      SIWA TODAY • HERITAGE ARCHIVE
                                    </div>
                                  )}
                                  
                                  <div style={{ 
                                    fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.6, 
                                    color: (bgColor === '#1e293b' || bgColor === '#000' || !hasMedia) ? '#fff' : '#1e293b',
                                    fontStyle: 'italic', fontFamily: 'serif'
                                  }}>
                                    "{caption}"
                                  </div>

                                  {!hasMedia && (
                                    <div style={{ 
                                      position: 'absolute', bottom: '1.5rem', fontSize: '0.5rem', 
                                      color: 'rgba(255,255,255,0.2)', fontWeight: 800 
                                    }}>
                                      VERIFIED NARRATIVE
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div key={i} style={{ 
                                borderRadius: '20px', overflow: 'hidden', background: '#fff', 
                                border: '1px solid #f1f5f9', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.03)',
                                gridColumn: caption?.length > 200 ? '1 / -1' : 'auto'
                              }}>
                                <div style={{ height: '240px', overflow: 'hidden', position: 'relative', background: '#000' }}>
                                  {isVideo ? (
                                    <video src={mediaUrl} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <img src={mediaUrl} alt={caption || `${section.name} gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  )}
                                </div>
                                {caption && (
                                  <div style={{ padding: '1.5rem', fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, fontWeight: 500, borderTop: '1px solid #f8fafc' }}>
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
          </main>
          <aside>
            <div style={{ position: 'sticky', top: '100px' }}>
              {biz.subscription_tier === 'free' ? (
                /* 🏛️ PLATFORM-MANAGED SIDEBAR (FREE TIER) */
                <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '24px', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '8px', height: '8px', background: '#D4AF37', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#D4AF37' }}>MANAGED BY SIWA.TODAY</span>
                  </div>
                  
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900 }}>Exclusive Offer</h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '2rem', lineHeight: 1.6 }}>This establishment is part of the Siwa Today Heritage Collection. Book through our platform for verified rates and premium support.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                      <div style={{ color: '#D4AF37', fontSize: '1.2rem' }}><i className="fas fa-certificate"></i></div>
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6 }}>STATUS</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Verified Heritage Site</div>
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={`/offers/${biz.slug}`} 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '1.2rem', borderRadius: '12px', fontWeight: 900, textAlign: 'center', textDecoration: 'none', background: 'linear-gradient(135deg, #D4AF37, #F59E0B)', color: '#1a1a2e', boxShadow: '0 10px 20px rgba(212,175,55,0.3)' }}
                  >
                    VIEW SIWA TODAY OFFER
                  </Link>
                  
                  <div style={{ marginTop: '1.5rem', textAlign: 'center', opacity: 0.4, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px' }}>
                    SECURE BOOKING • BEST RATE GUARANTEE
                  </div>
                </div>
              ) : (
                /* 🏨 VENDOR-DIRECT SIDEBAR (PAID TIER) */
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', color: '#1e293b', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 900 }}>Direct Contact</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                        <i className="fas fa-phone-alt"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>PHONE</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{dynamicPhone}</div>
                      </div>
                    </div>

                    {dynamicEmail && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>EMAIL</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dynamicEmail}</div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                        <i className="fas fa-map-marker-alt"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>LOCATION</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{dynamicAddress}</div>
                      </div>
                    </div>
                  </div>

                  {/* 🌍 SOCIAL CONNECT */}
                  {(identity.instagram_handle || identity.facebook_link || identity.tiktok_handle || identity.wechat_id) && (
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1.5rem' }}>SOCIAL CONNECT</div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {identity.instagram_handle && (
                          <a href={`https://instagram.com/${identity.instagram_handle.replace('@', '')}`} target="_blank" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                            <i className="fab fa-instagram"></i>
                          </a>
                        )}
                        {identity.facebook_link && (
                          <a href={identity.facebook_link} target="_blank" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1877F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                            <i className="fab fa-facebook-f"></i>
                          </a>
                        )}
                        {identity.tiktok_handle && (
                          <a href={`https://tiktok.com/@${identity.tiktok_handle.replace('@', '')}`} target="_blank" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                            <i className="fab fa-tiktok"></i>
                          </a>
                        )}
                        {identity.wechat_id && (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#07C160', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} title={`WeChat ID: ${identity.wechat_id}`}>
                            <i className="fab fa-weixin"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '12px', fontWeight: 900, background: '#1e293b', color: '#fff', marginTop: '2.5rem' }}>ENQUIRE DIRECTLY</button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <footer style={{ background: '#0f172a', padding: '5rem 0', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontWeight: 900, letterSpacing: '4px', fontSize: '1.5rem', marginBottom: '1rem' }}>SIWA TODAY</div>
        <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Automated Cinematic Minisite Engine v4.0</p>
      </footer>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="minisite-mobile-drawer-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'flex-end',
            animation: 'fadeInBackdrop 0.3s ease-out'
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="minisite-mobile-drawer"
            style={{
              width: '80%', maxWidth: '360px', height: '100%',
              background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column',
              animation: 'slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(biz?.name || '').toUpperCase()}
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem', padding: '0.25rem' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '1rem' }}>BUSINESS CHAPTERS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
                {activeSections.map(s => {
                  const customLabel = biz.custom_data?.section_labels?.[s.id] || s.name;
                  const isActive = activeTab === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        window.location.hash = s.id;
                        setActiveTab(s.id);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        width: '100%', padding: '1rem', borderRadius: '14px',
                        border: '1px solid',
                        borderColor: isActive ? 'rgba(212, 175, 55, 0.3)' : '#f1f5f9',
                        background: isActive ? 'rgba(212, 175, 55, 0.05)' : '#f8fafc',
                        color: isActive ? '#D4AF37' : '#475569',
                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                        fontWeight: isActive ? 800 : 600, fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '8px', 
                        background: isActive ? '#D4AF37' : '#fff', 
                        color: isActive ? '#fff' : '#64748b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}>
                        <i className={`fas ${s.icon || 'fa-layer-group'}`} style={{ fontSize: '0.8rem' }}></i>
                      </div>
                      <span style={{ flex: 1 }}>{(customLabel || '').toUpperCase()}</span>
                      {isActive && <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem', color: '#D4AF37' }}></i>}
                    </button>
                  );
                })}
              </div>

              {/* Direct Contact Card */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem' }}>DIRECT CONTACT</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <a href={`tel:${dynamicPhone}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', textDecoration: 'none', color: '#1e293b' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', border: '1px solid #e2e8f0' }}>
                      <i className="fas fa-phone-alt" style={{ fontSize: '0.7rem' }}></i>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{dynamicPhone}</div>
                  </a>

                  {dynamicEmail && (
                    <a href={`mailto:${dynamicEmail}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', textDecoration: 'none', color: '#1e293b', overflow: 'hidden' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', border: '1px solid #e2e8f0' }}>
                        <i className="fas fa-envelope" style={{ fontSize: '0.7rem' }}></i>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dynamicEmail}</div>
                    </a>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#1e293b' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', border: '1px solid #e2e8f0' }}>
                      <i className="fas fa-map-marker-alt" style={{ fontSize: '0.7rem' }}></i>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', lineHeight: 1.3 }}>{dynamicAddress}</div>
                  </div>
                </div>

                {/* Social Connect */}
                {(identity.instagram_handle || identity.facebook_link || identity.tiktok_handle || identity.wechat_id) && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {identity.instagram_handle && (
                        <a href={`https://instagram.com/${identity.instagram_handle.replace('@', '')}`} target="_blank" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.8rem' }}>
                          <i className="fab fa-instagram"></i>
                        </a>
                      )}
                      {identity.facebook_link && (
                        <a href={identity.facebook_link} target="_blank" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1877F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.8rem' }}>
                          <i className="fab fa-facebook-f"></i>
                        </a>
                      )}
                      {identity.tiktok_handle && (
                        <a href={`https://tiktok.com/@${identity.tiktok_handle.replace('@', '')}`} target="_blank" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.8rem' }}>
                          <i className="fab fa-tiktok"></i>
                        </a>
                      )}
                      {identity.wechat_id && (
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#07C160', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }} title={`WeChat ID: ${identity.wechat_id}`}>
                          <i className="fab fa-weixin"></i>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', textAlign: 'center' }}>
              <Link 
                href="/" 
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  textDecoration: 'none', color: '#fff', background: '#1e293b',
                  padding: '0.8rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem'
                }}
              >
                <i className="fas fa-sun" style={{ color: '#D4AF37' }}></i>
                SIWA TODAY PLATFORM
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM ACTIONS BAR (MOBILE ONLY) */}
      <div 
        className="minisite-mobile-bottom-bar"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99,
          height: '65px', background: '#fff', borderTop: '1px solid rgba(212,175,55,0.2)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', display: 'none',
          gridTemplateColumns: 'repeat(3, 1fr)', alignItems: 'center'
        }}
      >
        {biz.subscription_tier === 'free' ? (
          <Link 
            href={`/offers/${biz.slug}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'stretch',
              justifyContent: 'center', height: '100%', textDecoration: 'none', color: '#D4AF37'
            }}
          >
            <i className="fas fa-certificate" style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}></i>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.5px' }}>VIEW OFFER</span>
          </Link>
        ) : (
          <a 
            href={`tel:${dynamicPhone}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'stretch',
              justifyContent: 'center', height: '100%', textDecoration: 'none', color: '#1e293b'
            }}
          >
            <i className="fas fa-phone-alt" style={{ fontSize: '1.1rem', color: '#D4AF37', marginBottom: '0.2rem' }}></i>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.5px' }}>CALL DIRECT</span>
          </a>
        )}

        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', border: 'none', background: 'none', cursor: 'pointer', justifySelf: 'stretch',
            color: '#1e293b', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9'
          }}
        >
          <i className="fas fa-compass" style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.2rem' }}></i>
          <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.5px' }}>CHAPTERS</span>
        </button>

        <button 
          onClick={handleShare}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', border: 'none', background: 'none', cursor: 'pointer', justifySelf: 'stretch',
            color: '#1e293b'
          }}
        >
          <i className="fas fa-share-alt" style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '0.2rem' }}></i>
          <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.5px' }}>SHARE SITE</span>
        </button>
      </div>

      {/* TOAST ALERTS */}
      {toast.show && (
        <div 
          className="minisite-toast"
          style={{
            position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1100, background: '#1e293b', color: '#fff', padding: '0.75rem 1.5rem',
            borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          <i className="fas fa-check-circle" style={{ color: '#D4AF37' }}></i>
          {toast.message}
        </div>
      )}
    </div>
  );
}
