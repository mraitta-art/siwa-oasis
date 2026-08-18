'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';
import ServicesHub from '@/components/ServicesHub';
import ExperienceCategories from '@/components/ExperienceCategories';
import SmartJourneyPlanner from '@/components/SmartJourneyPlanner';
import InteractiveEcosystemMap from '@/components/InteractiveEcosystemMap';
import DynamicComponentRenderer from '@/components/DynamicComponentRenderer';

/**
 * VANITY URL CLIENT COMPONENT
 * Handles the interactive minisite UI.
 */
export default function VanityBusinessClient({ 
  slug, 
  initialData, 
  sections, 
  sectionLabels = {}, 
  sectionComponents = {},
  isMasterTemplate = false,
  isTrusted = false
}: { 
  slug: string, 
  initialData: any, 
  sections: any[], 
  sectionLabels?: Record<string, string>,
  sectionComponents?: Record<string, any[]>,
  isMasterTemplate?: boolean,
  isTrusted?: boolean
}) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [isRTL, setIsRTL] = useState(false);
  const [allowedMinisiteComponentKeys, setAllowedMinisiteComponentKeys] = useState<string[]>([]);

  // Detect RTL direction on mount
  useEffect(() => {
    setIsRTL(document.documentElement.dir === 'rtl' || window.getComputedStyle(document.body).direction === 'rtl');
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    const loadAllowedComponents = async () => {
      try {
        const res = await fetch('/api/jana/site-components?enabled=true&public=true');
        if (!res.ok) return;

        const data = await res.json();
        if (!Array.isArray(data) || !isMounted) return;

        const allowed = data.filter((component: any) => {
          try {
            const rawCfg = component.component_config;
            const cfg = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : (rawCfg || {});
            return cfg?.minisite_access === true;
          } catch {
            return false;
          }
        }).map((component: any) => component.key);

        setAllowedMinisiteComponentKeys(allowed);
      } catch (error) {
        console.error('Failed to load minisite component permissions', error);
      }
    };

    loadAllowedComponents();
    return () => { isMounted = false; };
  }, []);

  const showToastMessage = (msg: string) => {
    setToast({ message: msg, show: true });
  };

  const biz = initialData;
  const activeSections = sections;

  const data = biz.custom_data || {};
  const curation = biz.curation_data ? (typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data) : {};
  
  // Resolve Brand Assets — priority: basic (new) → sec_1_identity (legacy) → business_info (legacy) → root custom_data
  const identity = data.basic || data.sec_1_identity || data.business_info || {};
  const dynamicPhone = isMasterTemplate ? '+20 (10) SIWA-TODAY' : (identity.phone || data.phone || '+20 (12) SIWA-OASIS');
  const dynamicEmail = isMasterTemplate ? 'hello@siwa.today' : (identity.email || data.email || '');
  const dynamicAddress = isMasterTemplate ? 'Oasis District, Shali Town, Siwa, Egypt' : (identity.address || data.address || 'Siwa Oasis, Matrouh, Egypt');
  const dynamicLogo = identity.business_logo || identity.cover_image || identity.logo || data.business_logo || data.logo || undefined;
  const dynamicInstagram = identity.instagram_handle || data.instagram_handle || '';
  const dynamicFacebook = identity.facebook_link || data.facebook_link || '';
  const dynamicTiktok = identity.tiktok_handle || data.tiktok_handle || '';
  const dynamicWechat = identity.wechat_id || data.wechat_id || '';

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
      {isMasterTemplate && (
        <div style={{ 
          background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)', 
          color: '#fff', 
          padding: '0.75rem 1.5rem', 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          fontWeight: 800, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem',
          flexWrap: 'wrap',
          borderBottom: '2px solid #fbbf24',
          position: 'relative',
          zIndex: 9999
        }}>
          <span>
            <i className="fas fa-magic" style={{ color: '#fbbf24', marginRight: '0.5rem' }}></i>
            PREVIEWING CATEGORY MASTER TEMPLATE: This page acts as a design blueprint.
          </span>
          <Link 
            href="/signup?role=vendor" 
            style={{ 
              background: '#fbbf24', 
              color: '#1e1b4b', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              textDecoration: 'none', 
              fontSize: '0.7rem', 
              fontWeight: 900,
              boxShadow: '0 4px 10px rgba(251,191,36,0.3)',
              display: 'inline-block'
            }}
          >
            USE THIS TEMPLATE FOR YOUR BUSINESS
          </Link>
        </div>
      )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {(biz?.name || '').toUpperCase()}
            </div>
            {isTrusted && (
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '12px',
                background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37', fontSize: '0.55rem', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                flexShrink: 0
              }} title="Verified Authentic Heritage Business">
                <i className="fas fa-check-circle" /> TRUSTED
              </span>
            )}
          </div>
          
          {/* Desktop tabs */}
          <div className="minisite-desktop-tabs" style={{ display: 'flex', gap: '2rem' }}>
            {activeSections.map(s => {
              const customLabel = sectionLabels[s.id] || s.name;
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
              const customLabel = sectionLabels[s.id] || s.name;
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
              const sectionComponentInstances = sectionComponents[section.id] || [];
              const customLabel = sectionLabels[section.id] || section.name;

              // Core DB-backed assets
              const dbBlog = Array.isArray(section.blogs) && section.blogs.length > 0 ? section.blogs[0] : null;
              const dbGallery = Array.isArray(section.gallery) ? section.gallery : null;

              // Hide completely empty sections from public view
              const hasContent = secData || sectionComponentInstances.length > 0 || dbBlog || (dbGallery && dbGallery.length > 0);
              if (!hasContent) return null;

              // Filter gallery items by placement
              const carouselImages = dbGallery 
                ? dbGallery.filter((img: any) => img.placement === 'carousel' || img.placement === 'both')
                : (secData?.section_gallery && Array.isArray(secData.section_gallery) ? secData.section_gallery : []);

              const bodyImages = dbGallery
                ? dbGallery.filter((img: any) => img.placement === 'body' || img.placement === 'both')
                : [];

              // Helpers for type-aware rendering
              const renderFieldValue = (key: string, val: any, fieldDef: any) => {
                const fieldType = fieldDef?.field_type || 'text';
                const opts = fieldDef?.options ? (typeof fieldDef.options === 'string' ? JSON.parse(fieldDef.options) : fieldDef.options) : null;
                if (val === null || val === undefined || val === '') return null;

                // star_rating → gold stars
                if (fieldType === 'star_rating') {
                  const stars = Math.round(Number(val)) || 0;
                  return <div style={{ display: 'flex', gap: '0.15rem' }}>{Array.from({ length: 5 }, (_, i) => <i key={i} className="fas fa-star" style={{ color: i < stars ? '#f59e0b' : '#e2e8f0', fontSize: '1rem' }} />)}</div>;
                }
                // boolean → badge
                if (fieldType === 'boolean') {
                  return <span style={{ padding: '0.2rem 0.7rem', borderRadius: '20px', background: val ? '#dcfce7' : '#fee2e2', color: val ? '#15803d' : '#b91c1c', fontWeight: 800, fontSize: '0.75rem' }}>{val ? '✓ Yes' : '✗ No'}</span>;
                }
                // multiselect / array → colored tag badges
                if (fieldType === 'multiselect' || Array.isArray(val)) {
                  const tags = Array.isArray(val) ? val : String(val).split(',');
                  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>{tags.map((tag: string, i: number) => <span key={i} style={{ padding: '0.2rem 0.7rem', borderRadius: '20px', background: '#fef9c3', color: '#854d0e', fontWeight: 700, fontSize: '0.75rem' }}>{tag.trim()}</span>)}</div>;
                }
                // select → pill badge
                if (fieldType === 'select') {
                  return <span style={{ padding: '0.25rem 0.8rem', borderRadius: '20px', background: '#f0f9ff', color: '#0369a1', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #bae6fd' }}>{String(val)}</span>;
                }
                // youtube → thumbnail link
                if (fieldType === 'youtube') {
                  const ytId = String(val).match(/(?:youtu.be\/|v=)([^&?/]+)/)?.[1];
                  return ytId ? <a href={String(val)} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 700, textDecoration: 'none' }}><i className="fab fa-youtube" /> Watch on YouTube</a> : <span style={{ fontSize: '0.85rem' }}>{String(val)}</span>;
                }
                // action_button → CTA button
                if (fieldType === 'action_button') {
                  return <a href={String(val)} target="_blank" rel="noopener" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#D4AF37', color: '#fff', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', textDecoration: 'none' }}>Book Now →</a>;
                }
                // rich_text → safe HTML
                if (fieldType === 'rich_text') {
                  return <div dangerouslySetInnerHTML={{ __html: String(val) }} style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }} />;
                }
                // default → text
                return <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{String(val)}</span>;
              };

              return (
                <section key={section.id} id={section.id} className="animate-in fade-in duration-500" style={{ marginBottom: '6rem', scrollMarginTop: '100px' }}>
                  {/* Section Title */}
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
                    {/* CAROUSEL IMAGES (Top placement) */}
                    {carouselImages.length > 0 && (
                      <div style={{ marginBottom: '2.5rem', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '1rem', padding: '1rem', background: '#f8fafc' }}>
                          {carouselImages.map((item: any, idx: number) => {
                            const url = typeof item === 'object' ? item.url : item;
                            const caption = typeof item === 'object' ? item.caption : '';
                            const isVideo = url && (url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.includes('/video/upload/'));
                            return (
                              <div key={idx} style={{ flex: '0 0 85%', minWidth: '280px', scrollSnapAlign: 'start', borderRadius: '16px', overflow: 'hidden', background: '#000', height: '340px', position: 'relative' }}>
                                {isVideo ? (
                                  <video src={url} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <img src={url} alt={caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                                {/* Rich Slide Overlay */}
                                {(() => {
                                  const raw = typeof item === 'object' ? item.slide_data : null;
                                  const sd = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
                                  const showOverlay = sd.show_overlay !== false;
                                  const hasContent = sd.title || caption || (sd.cta_label && sd.cta_url);
                                  if (!showOverlay || !hasContent) return null;
                                  return (
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.88))', padding: '2rem 1.25rem 1.25rem' }}>
                                      {sd.title && (
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: caption ? '0.35rem' : 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                                          {sd.title}
                                        </div>
                                      )}
                                      {caption && (
                                        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4, marginBottom: (sd.cta_label && sd.cta_url) ? '0.75rem' : 0 }}>
                                          {caption}
                                        </div>
                                      )}
                                      {sd.cta_label && sd.cta_url && (
                                        <a href={sd.cta_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.4rem 1rem', background: '#D4AF37', color: '#1a1a1a', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.3px' }}>
                                          {sd.cta_label} →
                                        </a>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* BLOG / NARRATIVE */}
                    {dbBlog ? (
                      <div style={{ marginBottom: '2.5rem', background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{dbBlog.title}</h3>
                        <div className="rich-content" dangerouslySetInnerHTML={{ __html: dbBlog.content }} style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8 }} />
                      </div>
                    ) : secData?.section_blog ? (
                      <div className="rich-content" dangerouslySetInnerHTML={{ __html: secData.section_blog }} style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '2.5rem' }} />
                    ) : secData?.description ? (
                      <div style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '2.5rem' }}>
                        {secData.section_news || secData.description}
                      </div>
                    ) : null}

                    {/* CUSTOM FIELDS GRID */}
                    {secData && (
                      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
                        {Object.entries(secData).map(([key, val]) => {
                          if (['section_news', 'section_gallery', 'section_blog', 'mini_blog', 'feature_on_main', 'youtube_story', 'description', 'section_labels', 'hidden_sections', 'basic', 'about', 'section_title'].includes(key)) return null;

                          const matchedField = Array.isArray(section.fields) ? section.fields.find((f: any) => f.name === key) : null;
                          const displayName = matchedField ? matchedField.label.toUpperCase() : (key || '').replace(/_/g, ' ').toUpperCase();
                          
                          // 1. DYNAMIC GATE: If price field is blank or set to 'call', show a Call for Price CTA
                          let finalVal = val;
                          const isPriceField = key.includes('price');
                          if (isPriceField && (!val || String(val).toLowerCase() === 'call' || String(val).toLowerCase() === 'call us')) {
                            finalVal = `call_for_price_fallback`;
                          }

                          if (finalVal === null || finalVal === undefined || finalVal === '') return null;

                          // 2. FEATURE GATE: Blur prices on public minisite for unverified free tier listings to encourage promotion
                          const isGated = isPriceField && !isTrusted && biz.subscription_tier === 'free';

                          if (isGated) {
                            return (
                              <div key={key} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem' }}>{displayName}</div>
                                <div style={{ filter: 'blur(5px)', userSelect: 'none', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>$150 / Night</div>
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem' }}>
                                  <span style={{ fontSize: '0.55rem', fontWeight: 900, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="fas fa-lock" /> VERIFIED ONLY
                                  </span>
                                  <span style={{ fontSize: '0.5rem', color: '#94a3b8', fontWeight: 700 }}>Unlock upon official verification</span>
                                </div>
                              </div>
                            );
                          }

                          // 3. Render Field
                          const rendered = finalVal === 'call_for_price_fallback' ? (
                            <a href={`tel:${dynamicPhone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#D4AF37', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>
                              <i className="fas fa-phone-alt" /> CALL FOR PRICE
                            </a>
                          ) : renderFieldValue(key, finalVal, matchedField);

                          if (!rendered) return null;

                          return (
                            <div key={key} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem' }}>{displayName}</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{rendered}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* DYNAMIC COMPONENT INSTANCES */}
                    {sectionComponentInstances.length > 0 && (
                      <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
                        {sectionComponentInstances.map(component => (
                          <div key={component.id} style={{ marginBottom: '2rem' }}>
                            <DynamicComponentRenderer component={component} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BODY IMAGES (In-line / Bottom grid placement) */}
                    {bodyImages.length > 0 && (
                      <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                          {bodyImages.map((item: any, i: number) => {
                            const mediaUrl = typeof item === 'object' ? item.url : item;
                            const caption = typeof item === 'object' ? item.caption : '';
                            const isVideo = mediaUrl && (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.mov') || mediaUrl.includes('/video/upload/'));
                            
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
                                    <img src={mediaUrl} alt={caption || `${section.name} image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

            {allowedMinisiteComponentKeys.length > 0 && (
              <div style={{ marginTop: '4rem', display: 'grid', gap: '2rem' }}>
                {allowedMinisiteComponentKeys.includes('service_directory') || allowedMinisiteComponentKeys.includes('services_hub') ? (
                  <section style={{ padding: '2rem 0' }}>
                    <ServicesHub title="Featured Services" subtitle="Experience the best of this business and its partners." />
                  </section>
                ) : null}
                {allowedMinisiteComponentKeys.includes('experience_categories') || allowedMinisiteComponentKeys.includes('category_showcase') ? (
                  <section style={{ padding: '2rem 0' }}>
                    <ExperienceCategories title="Experience Categories" subtitle="Browse curated experiences offered here." />
                  </section>
                ) : null}
                {allowedMinisiteComponentKeys.includes('smart_journey_planner') || allowedMinisiteComponentKeys.includes('journey_collection') ? (
                  <section style={{ padding: '2rem 0' }}>
                    <SmartJourneyPlanner title="Plan Your Visit" subtitle="Shape your trip around the highlights of this destination." />
                  </section>
                ) : null}
                {allowedMinisiteComponentKeys.includes('ecosystem_map') ? (
                  <section style={{ padding: '2rem 0' }}>
                    <InteractiveEcosystemMap title="Ecosystem Map" subtitle="See how this experience connects to its wider network." />
                  </section>
                ) : null}
              </div>
            )}
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

                  <a 
                    href={`tel:${dynamicPhone.replace(/[^0-9+]/g, '')}`}
                    className="btn btn-primary" 
                    style={{ 
                      width: '100%', padding: '1.2rem', borderRadius: '12px', 
                      fontWeight: 900, background: '#1e293b', color: '#fff', 
                      marginTop: '2.5rem', display: 'block', textAlign: 'center', 
                      textDecoration: 'none' 
                    }}
                  >
                    ENQUIRE DIRECTLY
                  </a>
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
            display: 'flex', justifyContent: 'flex-start',
            animation: 'fadeInBackdrop 0.3s ease-out'
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="minisite-mobile-drawer"
            style={{
              width: '80%', maxWidth: '360px', height: '100%',
              background: '#fff', 
              boxShadow: isRTL ? '-10px 0 30px rgba(0,0,0,0.1)' : '10px 0 30px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column',
              animation: isRTL ? 'slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideInFromLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
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
                  const customLabel = sectionLabels[s.id] || s.name;
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
