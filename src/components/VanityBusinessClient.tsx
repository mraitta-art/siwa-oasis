'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';
import ServicesHub from '@/components/ServicesHub';
import ExperienceCategories from '@/components/ExperienceCategories';
import SmartJourneyPlanner from '@/components/SmartJourneyPlanner';
import InteractiveEcosystemMap from '@/components/InteractiveEcosystemMap';
import DynamicComponentRenderer from '@/components/DynamicComponentRenderer';
import MinisiteQRCode from '@/components/MinisiteQRCode';
import { filterCoreSectionsForBusinessType, getMinisiteSectionIds, isSectionApprovedForMinisite } from '@/lib/section-registry';
import type { MinisiteTemplatePlan } from '@/lib/minisite-template';

/**
 * VANITY URL CLIENT COMPONENT
 * Handles the interactive minisite UI.
 */
function interpolateFieldTokens(text: string, secData: Record<string, any> = {}, sectionFields: any[] = []): string {
  if (!text || typeof text !== 'string') return text || '';

  return text.replace(/\{\{([^}]+)\}\}/g, (match, rawKey) => {
    const key = rawKey.trim().toLowerCase();
    
    // Find matching field definition by name or label
    const fieldDef = (sectionFields || []).find((f: any) => 
      String(f?.name || '').toLowerCase() === key || 
      String(f?.label || '').toLowerCase() === key
    );

    const dataKey = fieldDef?.name || key;
    const rawVal = secData?.[dataKey] ?? secData?.[key];

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return '';
    }

    if (Array.isArray(rawVal)) {
      return rawVal.map(v => typeof v === 'object' ? (v.name || v.label || JSON.stringify(v)) : String(v)).join(', ');
    }

    if (typeof rawVal === 'boolean') {
      return rawVal ? 'Yes' : 'No';
    }

    if (typeof rawVal === 'object') {
      return rawVal.name || rawVal.title || rawVal.label || rawVal.value || JSON.stringify(rawVal);
    }

    return String(rawVal);
  });
}

function prepareRichContent(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  const decoded = text.includes('&lt;') || text.includes('&gt;')
    ? text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    : text;
  return /<\/?[a-z][\s\S]*>/i.test(decoded)
    ? decoded
    : decoded.replace(/\r?\n/g, '<br />');
}

export default function VanityBusinessClient({ 
  slug, 
  initialData, 
  sections, 
  sectionLabels = {}, 
  sectionLabelsAr = {},
  sectionComponents = {},
  templatePlan = null,
  isMasterTemplate = false,
  isTrusted = false,
  siteSettings,
  initialActiveTab,
  lockedSections = [],
  isAdmin = false
}: { 
  slug: string, 
  initialData: any, 
  sections: any[], 
  sectionLabels?: Record<string, string>,
  sectionLabelsAr?: Record<string, string>,
  sectionComponents?: Record<string, any[]>,
  templatePlan?: MinisiteTemplatePlan | null,
  isMasterTemplate?: boolean,
  isTrusted?: boolean,
  siteSettings?: any,
  initialActiveTab?: string,
  lockedSections?: string[],
  isAdmin?: boolean
}) {
  const [activeTab, setActiveTab] = useState<string | null>(initialActiveTab || null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [allowedMinisiteComponentKeys, setAllowedMinisiteComponentKeys] = useState<string[]>([]);
  const [liveSettings, setLiveSettings] = useState<any>(siteSettings || null);
  const [minisiteLang, setMinisiteLang] = useState<'en' | 'ar'>('en');
  const [isRTL, setIsRTL] = useState(false);
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);

  // Fetch live marketplace packages, tours, and discounts for this business
  useEffect(() => {
    if (initialData?.id) {
      fetch(`/api/jana/marketplace?businessId=${encodeURIComponent(initialData.id)}&status=approved`)
        .then((r) => r.ok ? r.json() : [])
        .then((items) => {
          if (Array.isArray(items)) setMarketplaceItems(items);
        })
        .catch(() => {});
    }
  }, [initialData?.id]);

  // Initialize minisite language from localStorage or document default
  useEffect(() => {
    try {
      const saved = localStorage.getItem('minisite_lang') as 'en' | 'ar' | null;
      if (saved === 'ar' || saved === 'en') {
        setMinisiteLang(saved);
        setIsRTL(saved === 'ar');
      } else {
        const docRTL = document.documentElement.dir === 'rtl' || window.getComputedStyle(document.body).direction === 'rtl';
        setMinisiteLang(docRTL ? 'ar' : 'en');
        setIsRTL(docRTL);
      }
    } catch {
      setIsRTL(false);
    }
  }, []);

  const switchLanguage = (lang: 'en' | 'ar') => {
    setMinisiteLang(lang);
    setIsRTL(lang === 'ar');
    try {
      localStorage.setItem('minisite_lang', lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    } catch {}
  };

  useEffect(() => {
    if (!liveSettings) {
      fetch('/api/jana/website?id=website_main')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const cfg = Array.isArray(data) ? data[0] : data;
          if (cfg?.site_settings) {
            setLiveSettings(cfg.site_settings);
          }
        })
        .catch(() => {});
    }
  }, [liveSettings]);

  // Sync active tab when sections change or on mount
  useEffect(() => {
    if (sections && sections.length > 0) {
      const sectionAliases: Record<string, string> = {
        'packages': 'sec_9_marketplace_catalog',
        'catalog': 'sec_9_marketplace_catalog',
        'tours': 'sec_5_experiences',
        'experiences': 'sec_5_experiences',
        'overview': 'sec_1_identity',
        'vibe': 'sec_2_ambience'
      };
      
      if (initialActiveTab) {
        const resolvedInitial = sectionAliases[initialActiveTab] || initialActiveTab;
        if (sections.some(s => s.id === resolvedInitial)) {
          setActiveTab(resolvedInitial);
          return;
        }
      }

      const rawHash = window.location.hash.replace('#', '');
      const hash = sectionAliases[rawHash] || rawHash;
      const hasMatchingSection = sections.some(s => s.id === hash);
      
      if (hasMatchingSection) {
        setActiveTab(hash);
      } else if (!activeTab || !sections.some(s => s.id === activeTab)) {
        setActiveTab(sections[0].id);
      }
    }

    // Listen for hash changes (for carousel jumps)
    const handleHash = () => {
      const sectionAliases: Record<string, string> = {
        'packages': 'sec_9_marketplace_catalog',
        'catalog': 'sec_9_marketplace_catalog',
        'tours': 'sec_5_experiences',
        'experiences': 'sec_5_experiences',
        'overview': 'sec_1_identity',
        'vibe': 'sec_2_ambience'
      };
      const rawH = window.location.hash.replace('#', '');
      const h = sectionAliases[rawH] || rawH;
      if (sections.some(s => s.id === h)) setActiveTab(h);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [slug, sections, initialActiveTab]);

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
  const data = biz.custom_data || {};
  const curation = biz.curation_data ? (typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data) : {};

  // Dynamically filter activeSections so sections without active components or data automatically disappear from header tabs, mobile menu, and hero
  const activeSections = React.useMemo(() => {
    const sourceSections = (sections || []).length > 0 ? sections : getMinisiteSectionIds(biz?.type_id, []).map(id => ({ id }));
    const allowedIds = new Set(filterCoreSectionsForBusinessType(biz?.type_id, sourceSections.map(section => section.id)));
    const seenIds = new Set<string>();

    return sourceSections.filter(section => {
      if (!section || !section.id) return false;
      if (seenIds.has(section.id)) return false;
      if (!allowedIds.has(section.id)) return false;
      if (!isSectionApprovedForMinisite(section.id, data, undefined, isAdmin)) return false;

      seenIds.add(section.id);
      return true;
    });
  }, [sections, data, biz?.type_id, isAdmin]);
  
  // Resolve Brand Assets — priority: basic (new) → sec_1_identity (legacy) → business_info (legacy) → root custom_data
  const identity = { ...(data.business_info || {}), ...(data.sec_1_identity || {}), ...(data.basic || {}) };
  const dynamicPhone = isMasterTemplate ? '+201000000000' : (biz.vendor_phone || identity.phone || data.phone || '+201200000000');
  const dynamicWhatsapp = isMasterTemplate ? '201000000000' : (identity.whatsapp || identity.whatsapp_number || data.whatsapp || biz.vendor_phone || identity.phone || '201200000000');
  const dynamicWhatsappMsg = identity.whatsapp_message || data.whatsapp_message || '';
  const cleanPhone = String(dynamicPhone).replace(/[^0-9+]/g, '');
  const cleanWhatsapp = String(dynamicWhatsapp).replace(/[^0-9]/g, '');
  const whatsappMsgQuery = dynamicWhatsappMsg ? `?text=${encodeURIComponent(dynamicWhatsappMsg)}` : '';
  const whatsappLink = `https://wa.me/${cleanWhatsapp || cleanPhone.replace('+', '')}${whatsappMsgQuery}`;
  const dynamicEmail = isMasterTemplate ? 'hello@siwify.com' : (identity.email || data.email || '');
  const dynamicAddress = isMasterTemplate ? 'Oasis District, Shali Town, Siwa, Egypt' : (identity.address || data.address || 'Siwa Oasis, Matrouh, Egypt');
  const dynamicLogo = identity.business_logo || identity.cover_image || identity.logo || data.business_logo || data.logo || undefined;
  const logoSize = identity.logo_size || data.logo_size || data.basic?.logo_size || 'lg';
  const logoPosition = identity.logo_position || data.logo_position || data.basic?.logo_position || 'left';
  const dynamicInstagram = identity.instagram_handle || data.instagram_handle || '';
  const dynamicFacebook = identity.facebook_link || data.facebook_link || '';
  const dynamicTiktok = identity.tiktok_handle || data.tiktok_handle || '';
  const dynamicWechat = identity.wechat_id || data.wechat_id || '';

  const platformName = liveSettings?.site_name || siteSettings?.site_name || 'SiWiFy.com';
  const platformLogo = liveSettings?.logo_url || siteSettings?.logo_url || '';

  // Filter out hero_carousel from template components: AutomatedMinisiteHero handles the business-specific hero
  const serializedTemplateComponents = (templatePlan?.components || []).filter(c => c.type !== 'hero_carousel');

  // Multilingual label helper: resolves Arabic label if active and present, otherwise standard label/section name
  const getSectionLabel = (sectionId: string, defaultName: string) => {
    if (minisiteLang === 'ar' && sectionLabelsAr[sectionId]) {
      return sectionLabelsAr[sectionId];
    }
    return sectionLabels[sectionId] || defaultName;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = biz.name || `${platformName} Minisite`;
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
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '6rem', direction: isRTL ? 'rtl' : 'ltr' }}>
      {serializedTemplateComponents.length > 0 && (
        <div data-minisite-template={templatePlan?.templateId}>
          {serializedTemplateComponents.map(component => (
            <DynamicComponentRenderer
              key={component.id}
              component={{ type: component.type, props: component.props, label: component.label }}
            />
          ))}
        </div>
      )}
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
        businessId={biz.id}
        businessName={biz.name}
        businessLogo={biz.tier_features?.allow_custom_logo !== false ? dynamicLogo : (dynamicLogo || undefined)}
        logoSize={logoSize}
        logoPosition={logoPosition}
        activeSections={activeSections}
        activeSectionId={activeTab}
        customData={data}
        curationData={curation}
        tierFeatures={{ 
          hero_automation: true, 
          remove_watermark: biz.tier_features?.remove_watermark,
          allow_youtube_story: biz.tier_features?.allow_youtube_story 
        }}
        settings={liveSettings || siteSettings || {}}
        onSectionNavigate={(sectionId) => {
          const sectionAliases: Record<string, string> = {
            'packages': 'sec_9_marketplace_catalog',
            'catalog': 'sec_9_marketplace_catalog',
            'tours': 'sec_5_experiences',
            'experiences': 'sec_5_experiences',
            'overview': 'sec_1_identity',
            'vibe': 'sec_2_ambience'
          };
          const target = sectionAliases[sectionId] || sectionId;
          try {
            window.history.pushState(null, '', `/${slug}/${target}`);
          } catch {}
          setActiveTab(target);
          const navEl = document.querySelector('nav');
          if (navEl) {
            navEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
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
              const customLabel = getSectionLabel(s.id, s.name);
              const isLocked = lockedSections.includes(s.id);
              return (
                <button 
                  key={s.id} 
                  onClick={() => {
                    try {
                      window.history.pushState(null, '', `/${slug}/${s.id}`);
                    } catch {}
                    setActiveTab(s.id);
                  }}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: activeTab === s.id ? '#D4AF37' : '#64748b', 
                    fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px',
                    borderBottom: activeTab === s.id ? '2px solid #D4AF37' : '2px solid transparent',
                    paddingBottom: '0.5rem', transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                  {(customLabel || '').toUpperCase()}
                  {isLocked && <i className="fas fa-lock" style={{ fontSize: '0.6rem', color: '#f59e0b' }} />}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Fixed Phone & WhatsApp Quick Direct Contact Buttons */}
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '20px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.68rem',
                  fontWeight: 900, textDecoration: 'none', transition: 'all 0.2s'
                }}
                title="Call Phone Direct"
              >
                <i className="fas fa-phone-alt" style={{ color: '#D4AF37', fontSize: '0.75rem' }} />
                <span>CALL</span>
              </a>
            )}
            {cleanWhatsapp && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '20px', background: '#dcfce7',
                  border: '1px solid #86efac', color: '#15803d', fontSize: '0.68rem',
                  fontWeight: 900, textDecoration: 'none', transition: 'all 0.2s'
                }}
                title="Chat on WhatsApp"
              >
                <i className="fab fa-whatsapp" style={{ color: '#16a34a', fontSize: '0.85rem' }} />
                <span>WHATSAPP</span>
              </a>
            )}

            {/* Language Toggle Switcher — only shown when admin enables multilingual */}
            {(liveSettings?.enable_minisite_multilingual === true || biz?.tier_features?.allow_multilingual === true) && (
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', 
                borderRadius: '20px', padding: '3px', border: '1px solid #e2e8f0' 
              }}>
                <button
                  type="button"
                  onClick={() => switchLanguage('en')}
                  style={{
                    border: 'none', background: minisiteLang === 'en' ? '#1e293b' : 'transparent',
                    color: minisiteLang === 'en' ? '#fff' : '#64748b',
                    padding: '3px 9px', borderRadius: '16px', fontSize: '0.65rem',
                    fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage('ar')}
                  style={{
                    border: 'none', background: minisiteLang === 'ar' ? '#D4AF37' : 'transparent',
                    color: minisiteLang === 'ar' ? '#1e293b' : '#64748b',
                    padding: '3px 9px', borderRadius: '16px', fontSize: '0.65rem',
                    fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  عربي
                </button>
              </div>
            )}

            <Link href="/" className="btn btn-sm btn-outline gold-border minisite-desktop-home">
              {platformLogo ? (
                <img src={platformLogo} alt={platformName} style={{ height: '18px', objectFit: 'contain' }} />
              ) : platformName}
            </Link>
          </div>

          {/* Mobile navigation toggle */}
          <div className="minisite-mobile-header-btns" style={{ display: 'none', gap: '0.5rem', alignItems: 'center' }}>
            {/* Mobile Language Switcher — only shown when admin enables multilingual */}
            {(liveSettings?.enable_minisite_multilingual === true || biz?.tier_features?.allow_multilingual === true) && (
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', 
                borderRadius: '16px', padding: '2px', border: '1px solid #e2e8f0' 
              }}>
                <button
                  type="button"
                  onClick={() => switchLanguage(minisiteLang === 'en' ? 'ar' : 'en')}
                  style={{
                    border: 'none', background: 'transparent',
                    color: '#1e293b', padding: '2px 7px', fontSize: '0.65rem',
                    fontWeight: 900, cursor: 'pointer'
                  }}
                >
                  {minisiteLang === 'en' ? 'عربي' : 'EN'}
                </button>
              </div>
            )}
            <Link href="/" style={{ color: '#64748b', padding: '0.5rem', fontSize: '1.1rem' }} title={`${platformName} Home`}>
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
              const customLabel = getSectionLabel(s.id, s.name);
              const isLocked = lockedSections.includes(s.id);
              return (
                <button 
                  key={s.id} 
                  onClick={() => {
                    try {
                      window.history.pushState(null, '', `/${slug}/${s.id}`);
                    } catch {}
                    setActiveTab(s.id);
                  }}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                    color: activeTab === s.id ? '#D4AF37' : '#64748b', 
                    fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.5px',
                    borderBottom: activeTab === s.id ? '2px solid #D4AF37' : '2px solid transparent',
                    paddingBottom: '0.4rem', transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                  {(customLabel || '').toUpperCase()}
                  {isLocked && <i className="fas fa-lock" style={{ fontSize: '0.55rem', color: '#f59e0b' }} />}
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
              const customLabel = getSectionLabel(section.id, section.name);

              // Core DB-backed assets
              const dbBlog = Array.isArray(section.blogs) && section.blogs.length > 0 ? section.blogs[0] : null;
              // An empty vendor gallery must not hide the uploaded section_gallery in custom_data.
              const dbGallery = Array.isArray(section.gallery) && section.gallery.length > 0 ? section.gallery : null;
              const hasTours = Array.isArray(section.tourProducts) && section.tourProducts.length > 0;

              // Show every valid travel-core section in the nav and on-page flow, even when
              // the business has not filled a particular section yet. Empty sections still need
              // to appear so the tab structure is reliable and consistent.
              const sectionHasDefinedFields = Array.isArray(section.fields) && section.fields.length > 0;
              const hasContent = sectionHasDefinedFields || !!secData || sectionComponentInstances.length > 0 || !!dbBlog || (dbGallery && dbGallery.length > 0) || hasTours;
              if (!hasContent && !activeSections.some(s => s.id === section.id)) return null;

              // Merge approved DB media with admin-selected custom media while keeping DB rows authoritative.
              const sectionMeta = data.section_content_meta?.[section.id] || {};
              const storedGallery = (sectionMeta.galleryStatus === undefined || sectionMeta.galleryStatus === 'approved') && sectionMeta.galleryOnMinisite !== false && Array.isArray(secData?.section_gallery)
                ? secData.section_gallery
                : [];
              const legacyGallery = Array.isArray(secData?._media?.images) ? secData._media.images : [];
              const gallerySource: any[] = [];
              const galleryIds = new Set<string>();
              const galleryUrls = new Set<string>();
              [...(dbGallery || []), ...storedGallery, ...legacyGallery].forEach((img: any) => {
                const id = img && typeof img === 'object' ? img.id : null;
                const url = typeof img === 'string' ? img : img?.url;
                const normalizedUrl = typeof url === 'string' ? url.trim().replace(/\/$/, '').toLowerCase() : '';
                const normalizedId = id !== undefined && id !== null && String(id) !== '' ? String(id) : '';
                if ((normalizedId && galleryIds.has(normalizedId)) || (normalizedUrl && galleryUrls.has(normalizedUrl))) return;
                if (normalizedId) galleryIds.add(normalizedId);
                if (normalizedUrl) galleryUrls.add(normalizedUrl);
                gallerySource.push(img);
              });

              const carouselImages = gallerySource.filter((img: any) =>
                dbGallery?.includes(img)
                  ? img.placement === 'carousel' || img.placement === 'both' || img.is_minisite_carousel
                  : typeof img === 'string' ||
                    (img?.is_minisite_carousel !== false && img?.in_carousel !== false && img?.placement !== 'body')
              );

              const bodyImages = gallerySource.filter((img: any) =>
                typeof img === 'object' &&
                (img?.placement === 'body' || img?.placement === 'both' || img?.is_minisite_carousel === false)
              );

              // Helpers for type-aware rendering
              const renderFieldValue = (key: string, val: any, fieldDef: any) => {
                const fieldType = fieldDef?.field_type || 'text';
                const opts = fieldDef?.options ? (typeof fieldDef.options === 'string' ? JSON.parse(fieldDef.options) : fieldDef.options) : null;
                if (val === null || val === undefined || val === '') return null;

                // star_rating or numerical rating with dual display
                if (fieldType === 'star_rating' || key === 'rating' || key === 'platform_rating' || key === 'ota_rating') {
                  const numVal = Number(val);
                  const isTenScale = numVal > 5;
                  const stars = Math.round(isTenScale ? numVal / 2 : numVal);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                        {numVal}{isTenScale ? '/10' : '/5'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <i key={i} className="fas fa-star" style={{ color: i < stars ? '#f59e0b' : '#e2e8f0', fontSize: '0.9rem' }} />
                        ))}
                      </div>
                      {secData?.source && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          via {secData.source}
                        </span>
                      )}
                    </div>
                  );
                }
                // boolean → badge
                if (fieldType === 'boolean') {
                  return <span style={{ padding: '0.2rem 0.7rem', borderRadius: '20px', background: val ? '#dcfce7' : '#fee2e2', color: val ? '#15803d' : '#b91c1c', fontWeight: 800, fontSize: '0.75rem' }}>{val ? '✓ Yes' : '✗ No'}</span>;
                }
                // tags / multiselect / array → colored tag badges
                if (fieldType === 'tags' || fieldType === 'multiselect' || Array.isArray(val)) {
                  const tags = Array.isArray(val) ? val : (typeof val === 'string' ? val.split(',') : []);
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {tags.map((tag: any, i: number) => {
                        const str = typeof tag === 'object' ? JSON.stringify(tag) : String(tag).trim();
                        return (
                          <span key={i} style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#f1f5f9', color: '#1e293b', fontWeight: 700, fontSize: '0.78rem', border: '1px solid #e2e8f0' }}>
                            {str}
                          </span>
                        );
                      })}
                    </div>
                  );
                }
                // json / structured cards (room_types, review_highlights)
                if (fieldType === 'json' || (typeof val === 'object' && val !== null)) {
                  if (key === 'room_types' && Array.isArray(val)) {
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', width: '100%' }}>
                        {val.map((rm: any, i: number) => (
                          <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{rm.name}</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.2rem' }}>🛏️ {rm.beds}</div>
                            {rm.features && <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{rm.features}</div>}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (key === 'review_highlights' && Array.isArray(val)) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                        {val.map((rev: any, i: number) => (
                          <div key={i} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1.5px solid #f1f5f9', fontStyle: 'italic', color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                            "{rev.text}"
                            <div style={{ fontStyle: 'normal', fontWeight: 800, color: '#D4AF37', fontSize: '0.75rem', marginTop: '0.4rem', textAlign: 'right' }}>
                              — {rev.author} ({rev.country})
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <pre style={{ fontSize: '0.75rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', overflowX: 'auto' }}>{JSON.stringify(val, null, 2)}</pre>;
                }
                // select → pill badge
                if (fieldType === 'select') {
                  return <span style={{ padding: '0.25rem 0.8rem', borderRadius: '20px', background: '#f0f9ff', color: '#0369a1', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #bae6fd' }}>{String(val)}</span>;
                }
                // url → link
                if (fieldType === 'url' && String(val).startsWith('http')) {
                  return (
                    <a href={String(val)} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }} /> {String(val).replace(/^https?:\/\/(www\.)?/, '').slice(0, 35)}...
                    </a>
                  );
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
                  return <div dangerouslySetInnerHTML={{ __html: prepareRichContent(val) }} style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }} />;
                }
                // default → text
                return <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{String(val)}</span>;
              };

              const isLocked = lockedSections.includes(section.id);

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

                  {isLocked ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      borderRadius: '24px', padding: '3.5rem 2rem', textAlign: 'center', color: '#fff',
                      border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(212,175,55,0.4)' }}>
                        <i className="fas fa-crown" style={{ color: '#D4AF37', fontSize: '1.75rem' }} />
                      </div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.75rem', color: '#f8fafc' }}>
                        Premium Feature: {customLabel}
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                        This section requires an active subscription tier upgrade for <strong style={{ color: '#D4AF37' }}>{biz.name}</strong> to unlock public showcase features.
                      </p>
                      <Link href="/vendor/upgrade" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.8rem 1.75rem', background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                        color: '#1a1000', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
                        textDecoration: 'none', boxShadow: '0 4px 14px rgba(212,175,55,0.3)'
                      }}>
                        <i className="fas fa-arrow-up" /> Upgrade Tier to Unlock
                      </Link>
                    </div>
                  ) : (
                  <div>
                    {/* CAROUSEL IMAGES (Top placement) */}
                    {carouselImages.length > 0 && (
                      <div style={{ marginBottom: '2.5rem', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '1rem', padding: '1rem', background: '#f8fafc' }}>
                          {carouselImages.map((item: any, idx: number) => {
                            const url = typeof item === 'object' ? item.url : item;
                            const caption = typeof item === 'object'
                              ? (minisiteLang === 'ar' && item.caption_ar ? item.caption_ar : item.caption || '')
                              : '';
                            const isVideo = url && (url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.includes('/video/upload/'));
                            const raw = typeof item === 'object' ? item.slide_data : null;
                            const sd = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
                            const title = minisiteLang === 'ar' && sd.title_ar ? sd.title_ar : (sd.title || '');
                            const ctaLabel = minisiteLang === 'ar' && sd.cta_label_ar ? sd.cta_label_ar : (sd.cta_label || '');
                            const targetSection = sd.target_section_id;

                            return (
                              <div
                                key={idx}
                                style={{
                                  flex: '0 0 85%',
                                  minWidth: '280px',
                                  scrollSnapAlign: 'start',
                                  borderRadius: '16px',
                                  overflow: 'hidden',
                                  background: '#000',
                                  height: '340px',
                                  position: 'relative',
                                  cursor: targetSection ? 'pointer' : 'default'
                                }}
                                onClick={() => {
                                  if (targetSection) {
                                    try {
                                      window.history.pushState(null, '', `/${slug}/${targetSection}`);
                                    } catch {}
                                    setActiveTab(targetSection);
                                    const navEl = document.querySelector('nav');
                                    if (navEl) navEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }}
                              >
                                {isVideo ? (
                                  <video src={url} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <img src={url} alt={caption || title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                                {/* Rich Slide Overlay */}
                                {(() => {
                                  const showOverlay = sd.show_overlay !== false;
                                  const hasContent = title || caption || (ctaLabel && (sd.cta_url || targetSection));
                                  if (!showOverlay || !hasContent) return null;
                                  return (
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.88))', padding: '2rem 1.25rem 1.25rem' }}>
                                      {title && (
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: caption ? '0.35rem' : 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                                          {title}
                                        </div>
                                      )}
                                      {caption && (
                                        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4, marginBottom: (ctaLabel && (sd.cta_url || targetSection)) ? '0.75rem' : 0 }}>
                                          {caption}
                                        </div>
                                      )}
                                      {ctaLabel && (
                                        <a
                                          href={targetSection ? `/${slug}/${targetSection}` : (sd.cta_url || '#')}
                                          target={targetSection || (sd.cta_url && sd.cta_url.startsWith('#')) ? '_self' : '_blank'}
                                          rel="noopener noreferrer"
                                          onClick={(e) => {
                                            if (targetSection) {
                                              e.preventDefault();
                                              try { window.history.pushState(null, '', `/${slug}/${targetSection}`); } catch {}
                                              setActiveTab(targetSection);
                                              const navEl = document.querySelector('nav');
                                              if (navEl) navEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                          }}
                                          style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.4rem 1rem', background: '#D4AF37', color: '#1a1a1a', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.3px' }}
                                        >
                                          {ctaLabel} →
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

                    {/* BLOG / NARRATIVE WITH DYNAMIC FIELD TOKEN INTERPOLATION & BILINGUAL TITLES */}
                    {(() => {
                      const sectionMeta = data?.section_content_meta?.[section.id] || {};
                      const showBlogOnMinisite = sectionMeta.blogOnMinisite !== false && sectionMeta.blogOnMinisite !== 0;

                      if (!showBlogOnMinisite) return null;

                      if (dbBlog && !(minisiteLang === 'ar' && secData?.section_blog_ar)) {
                        const interpolated = interpolateFieldTokens(dbBlog.content, secData, section.fields);
                        return (
                          <div style={{ marginBottom: '2.5rem', background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{dbBlog.title}</h3>
                            <div className="rich-content" dangerouslySetInnerHTML={{ __html: prepareRichContent(interpolated) }} style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8 }} />
                          </div>
                        );
                      }

                      if (minisiteLang === 'ar' && (secData?.section_blog_ar || secData?.description_ar || secData?.section_news_ar)) {
                        const rawBlog = secData?.section_blog_ar || secData?.section_news_ar || secData?.description_ar;
                        const blogTitleDisplay = secData?.section_blog_title_ar || '';
                        const interpolated = interpolateFieldTokens(rawBlog, secData, section.fields);
                        return (
                          <div style={{ marginBottom: '2.5rem', background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', direction: 'rtl', textAlign: 'right' }}>
                            {blogTitleDisplay && <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>{blogTitleDisplay}</h3>}
                            <div className="rich-content" dangerouslySetInnerHTML={{ __html: prepareRichContent(interpolated) }} style={{ fontSize: '1.1rem', color: '#334155', lineHeight: 1.9 }} />
                          </div>
                        );
                      }

                      if (secData?.section_blog || secData?.mini_blog || secData?.description || secData?.section_news || secData?._media?.mini_blog) {
                        const rawBlog = secData?.section_blog || secData?.mini_blog || secData?._media?.mini_blog || secData?.section_news || secData?.description;
                        const blogTitleDisplay = secData?.section_blog_title || '';
                        const interpolated = interpolateFieldTokens(rawBlog, secData, section.fields);
                        return (
                          <div style={{ marginBottom: '2.5rem', background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                            {blogTitleDisplay && <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{blogTitleDisplay}</h3>}
                            <div className="rich-content" dangerouslySetInnerHTML={{ __html: prepareRichContent(interpolated) }} style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8 }} />
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* CUSTOM FIELDS GRID */}
                    {(secData || sectionHasDefinedFields) && (
                      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
                        {(() => {
                          const fieldEntries: Array<{ key: string; val: any; matchedField: any }> = [];
                          const seen = new Set<string>();

                          if (Array.isArray(section.fields)) {
                            section.fields.forEach((field: any) => {
                              const key = field?.name;
                              if (!key) return;
                              seen.add(key);
                              fieldEntries.push({ key, val: secData?.[key], matchedField: field });
                            });
                          }

                          if (secData) {
                            Object.entries(secData).forEach(([key, val]) => {
                              if (seen.has(key)) return;
                              const matchedField = Array.isArray(section.fields) ? section.fields.find((f: any) => f.name === key) : null;
                              fieldEntries.push({ key, val, matchedField });
                            });
                          }

                          return fieldEntries.map(({ key, val, matchedField }, index) => {
                            if (['_media', 'media', 'section_news', 'section_gallery', 'section_blog', 'mini_blog', 'feature_on_main', 'youtube_story', 'description', 'section_labels', 'hidden_sections', 'basic', 'about', 'section_title'].includes(key)) return null;

                            const isPublic = matchedField ? (matchedField.acl?.read ? matchedField.acl.read.includes('public') : true) : true;
                            if (!isPublic) return null;

                            const displayName = matchedField ? matchedField.label.toUpperCase() : (key || '').replace(/_/g, ' ').toUpperCase();
                            const uniqueKey = `${section.id || 'section'}-${key || 'field'}-${index}`;

                            let finalVal = val;
                            const isPriceField = key.includes('price');
                            if (isPriceField && (!val || String(val).toLowerCase() === 'call' || String(val).toLowerCase() === 'call us')) {
                              finalVal = 'call_for_price_fallback';
                            }

                            const isEmptyValue = finalVal === null || finalVal === undefined || finalVal === '';
                            const isGated = isPriceField && !isTrusted && biz.subscription_tier === 'free';

                            if (isGated) {
                              return (
                                <div key={uniqueKey} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
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

                            const ctaPhoneNumber = section.cta_phone || section.cta_phone_override || dynamicPhone;
                            const rendered = isEmptyValue
                              ? <span style={{ color: '#94a3b8', fontWeight: 600, fontStyle: 'italic' }}>Not provided</span>
                              : finalVal === 'call_for_price_fallback'
                                ? (
                                  <a href={`tel:${ctaPhoneNumber}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#D4AF37', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>
                                    <i className="fas fa-phone-alt" /> CALL FOR PRICE
                                  </a>
                                )
                                : renderFieldValue(key, finalVal, matchedField);

                            const isFullWidth = ['room_types', 'review_highlights', 'facilities_list', 'safety_features', 'activities', 'tours', 'dietary_options', 'description', 'pool_features', 'spa_services'].includes(key);

                            return (
                              <div key={uniqueKey} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', gridColumn: isFullWidth ? '1 / -1' : 'auto' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem' }}>{displayName}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{rendered}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {/* DYNAMIC COMPONENT INSTANCES */}
                    {sectionComponentInstances.length > 0 && (
                      <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
                        {sectionComponentInstances.map(component => {
                          const componentTitle = component.title || component.label || component.props?.title || component.props?.custom_title || 'Section Component';
                          return (
                            <div key={component.id} style={{ marginBottom: '2rem' }}>
                              <div style={{ marginBottom: '1rem', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8' }}>
                                {componentTitle}
                              </div>
                              <DynamicComponentRenderer component={component} />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* UNIFIED MARKETPLACE PACKAGES, TOURS & SPECIAL OFFERS */}
                    {(() => {
                      const sectionItems = marketplaceItems.filter((item) => {
                        if (!item.publish_on_minisite) return false;
                        if (item.section_id === section.id) return true;
                        if (section.id === 'sec_9_marketplace_catalog' && (!item.section_id || item.section_id === 'sec_9_marketplace_catalog' || item.item_type === 'package' || item.item_type === 'discount_offer')) return true;
                        if (section.id === 'sec_5_experiences' && (item.item_type === 'tour' || item.item_type === 'activity' || item.item_type === 'retreat')) return true;
                        return false;
                      });

                      if (sectionItems.length === 0) return null;

                      return (
                        <div style={{ marginTop: '2.5rem', marginBottom: '3rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <div style={{ color: '#D4AF37', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                ✦ {minisiteLang === 'ar' ? 'الباقات والعروض الخاصة' : 'PACKAGES, TOURS & EXCLUSIVE OFFERS'}
                              </div>
                              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                                {minisiteLang === 'ar' ? 'العروض والبرامج السياحية المتاحة' : 'Featured Packages & Special Programs'}
                              </h3>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' }}>
                            {sectionItems.map((item: any) => {
                              const title = minisiteLang === 'ar' && item.title_ar ? item.title_ar : item.title;
                              const desc = minisiteLang === 'ar' && item.description_ar ? item.description_ar : item.description;
                              const coverImg = item.media?.[0]?.url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600';
                              const hasDiscount = (item.discount_percentage > 0) || (item.original_price && item.original_price > item.price_amount);

                              // Build WhatsApp pre-filled booking inquiry
                              const inquiryMsg = encodeURIComponent(
                                `Hello! I would like to inquire about booking the "${item.title}" (${item.price_amount > 0 ? `${item.price_amount} ${item.currency}` : 'Offer'}) on SiWiFy.`
                              );
                              const itemWhatsappLink = `https://wa.me/${cleanWhatsapp || cleanPhone.replace('+', '')}?text=${inquiryMsg}`;

                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    background: '#fff',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    border: item.is_featured ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                                    boxShadow: item.is_featured ? '0 8px 30px rgba(212,175,55,0.18)' : '0 4px 16px rgba(0,0,0,0.04)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {/* Image Header */}
                                  <div style={{ height: '180px', position: 'relative', background: '#090e17' }}>
                                    <img src={coverImg} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    
                                    {/* Type Badge */}
                                    <div style={{ position: 'absolute', top: 10, left: 10, background: '#0f172a', color: '#fff', padding: '3px 9px', borderRadius: '12px', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase' }}>
                                      {item.item_type.replace('_', ' ')}
                                    </div>

                                    {/* Duration Badge */}
                                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)', color: '#fbbf24', padding: '3px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900 }}>
                                      ⏱️ {item.duration_value} {item.duration_type.replace('_', ' ')}
                                    </div>

                                    {/* Discount Tag */}
                                    {hasDiscount && (
                                      <div style={{ position: 'absolute', bottom: 10, right: 10, background: '#dc2626', color: '#fff', padding: '3px 9px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 900 }}>
                                        {item.discount_percentage ? `${item.discount_percentage}% OFF` : 'SPECIAL OFFER'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Body */}
                                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                                      {title}
                                    </h4>

                                    {desc && (
                                      <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, flex: 1 }}>
                                        {desc.length > 120 ? `${desc.substring(0, 120)}...` : desc}
                                      </p>
                                    )}

                                    {/* Pricing & CTA */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.9rem', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
                                      <div>
                                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                                          {item.pricing_unit.replace('_', ' ')}
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                                          {item.price_amount > 0 ? `${item.price_amount} ${item.currency}` : 'Contact Us'}
                                        </div>
                                        {item.original_price && (
                                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                            {item.original_price} {item.currency}
                                          </div>
                                        )}
                                      </div>

                                      <a
                                        href={item.booking_cta_type === 'url' && item.booking_cta_url ? item.booking_cta_url : itemWhatsappLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          padding: '0.6rem 1.15rem',
                                          background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                                          color: '#1a1000',
                                          borderRadius: '10px',
                                          fontWeight: 900,
                                          fontSize: '0.75rem',
                                          textDecoration: 'none',
                                          boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px'
                                        }}
                                      >
                                        <i className="fab fa-whatsapp" /> {minisiteLang === 'ar' ? 'حجز / استفسار' : 'Book / Inquire'} →
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* TOUR PRODUCTS & PACKAGES CATALOG GRID (LEGACY DB-BACKED) */}
                    {Array.isArray(section.tourProducts) && section.tourProducts.length > 0 && (
                      <div style={{ marginTop: '2.5rem', marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>
                              <i className="fas fa-cubes" style={{ color: '#D4AF37', marginRight: '0.6rem' }} />
                              Featured Packages & Expeditions
                            </h3>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                              Browse curated tour packages, group safaris, and custom itineraries.
                            </div>
                          </div>
                          <Link href="/journey-builder-advanced" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#1e293b', fontWeight: 800, fontSize: '0.78rem', textDecoration: 'none' }}>
                            <i className="fas fa-sliders-h" style={{ color: '#D4AF37' }} /> Custom Journey Builder →
                          </Link>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' }}>
                          {section.tourProducts.map((tour: any) => {
                            const highlights = (() => {
                              try {
                                return typeof tour.highlights === 'string' ? JSON.parse(tour.highlights) : tour.highlights || [];
                              } catch {
                                return [];
                              }
                            })();

                            return (
                              <div key={tour.id} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}>
                                <div style={{ height: '190px', position: 'relative', background: '#0f172a', overflow: 'hidden' }}>
                                  <img src={tour.image_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62'} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', color: '#fbbf24', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, border: '1px solid rgba(251,191,36,0.3)' }}>
                                    ⏱️ {tour.duration_days} Days / {tour.duration_hours || 8}h
                                  </div>
                                </div>

                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>{tour.name}</h4>
                                  <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
                                    {tour.description ? (tour.description.length > 120 ? tour.description.substring(0, 120) + '...' : tour.description) : 'Experience authentic Siwa Oasis with expert guides.'}
                                  </p>

                                  {Array.isArray(highlights) && highlights.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                                      {highlights.slice(0, 3).map((h: string, idx: number) => (
                                        <span key={idx} style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#f1f5f9', color: '#334155' }}>
                                          ✦ {h}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                    <div>
                                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.5px' }}>STARTING FROM</div>
                                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                                        ${tour.base_price_usd} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>/ pax</span>
                                      </div>
                                    </div>

                                    <Link href={`/journey-builder-advanced?preset=${encodeURIComponent(tour.name)}`} style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #D4AF37, #f59e0b)', color: '#1a1000', borderRadius: '12px', fontWeight: 900, fontSize: '0.78rem', textDecoration: 'none', boxShadow: '0 4px 12px rgba(212,175,55,0.2)' }}>
                                      Inquire Package →
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                  )}
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
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#D4AF37' }}>MANAGED BY SIWIFY</span>
                  </div>
                  
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900 }}>Exclusive Offer</h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '2rem', lineHeight: 1.6 }}>This establishment is part of the SiWiFy.com Heritage Collection. Book through our platform for verified rates and premium support.</p>
                  
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
                    VIEW {platformName.toUpperCase()} OFFER
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

      {/* FOOTER */}
      <footer style={{ background: '#0f172a', padding: '4.5rem 1.5rem', color: '#fff', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <MinisiteQRCode businessName={biz.name || 'SiWiFy.com Minisite'} businessId={biz.id} compact />
        </div>

        {(!biz.subscription_tier || biz.subscription_tier === 'free') && !isTrusted && !isMasterTemplate ? (
          /* Free Tier Footer (Promoting Siwify Platform & Upgrade) */
          <div>
            <div style={{ fontWeight: 900, letterSpacing: '3px', fontSize: '1.35rem', marginBottom: '0.5rem', color: '#D4AF37' }}>
              {platformName}
            </div>
            <p style={{ opacity: 0.6, fontSize: '0.8rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              This is a free verified minisite powered by {platformName}. Want your own whitelabel booking site without watermarks?
            </p>
            <Link
              href="/be-a-partner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(212,175,55,0.15)',
                border: '1px solid rgba(212,175,55,0.4)',
                color: '#D4AF37',
                padding: '0.55rem 1.25rem',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.78rem',
                textDecoration: 'none'
              }}
            >
              ✦ Create Your Free Business Minisite →
            </Link>
          </div>
        ) : (
          /* Paid / Promoted Tier Footer (100% Vendor-First Authority) */
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', padding: '4px 12px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 900, marginBottom: '1rem' }}>
              ★ VERIFIED OASIS PARTNER
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.5rem' }}>
              {biz.name}
            </div>
            <p style={{ opacity: 0.5, fontSize: '0.78rem', margin: 0 }}>
              © {new Date().getFullYear()} {biz.name}. All rights reserved.
            </p>
          </div>
        )}
      </footer>

      {/* FREE TIER SIWIFY WATERMARK PILL */}
      {(!biz.subscription_tier || biz.subscription_tier === 'free') && !isTrusted && !isMasterTemplate && (
        <div
          className="minisite-watermark-pill"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: isRTL ? 'auto' : '24px',
            right: isRTL ? '24px' : 'auto',
            zIndex: 9998,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <Link
            href="/vendor/upgrade"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '50px',
              padding: '0.45rem 0.95rem',
              color: '#f8fafc',
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              fontSize: '0.75rem',
              fontWeight: 800,
              transition: 'all 0.2s'
            }}
          >
            <span style={{ color: '#D4AF37' }}>⚡</span>
            <span>Powered by <strong>{platformName}</strong></span>
            <span style={{
              background: 'rgba(212, 175, 55, 0.2)',
              color: '#D4AF37',
              padding: '2px 7px',
              borderRadius: '10px',
              fontSize: '0.65rem',
              fontWeight: 900
            }}>
              UPGRADE
            </span>
          </Link>
        </div>
      )}

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
                  const customLabel = getSectionLabel(s.id, s.name);
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
                {platformName.toUpperCase()} PLATFORM
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
          gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center'
        }}
      >
        <a 
          href={`tel:${cleanPhone}`}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'stretch',
            justifyContent: 'center', height: '100%', textDecoration: 'none', color: '#1e293b'
          }}
          title="Call Phone"
        >
          <i className="fas fa-phone-alt" style={{ fontSize: '1.1rem', color: '#D4AF37', marginBottom: '0.2rem' }}></i>
          <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.5px' }}>CALL DIRECT</span>
        </a>

        <a 
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'stretch',
            justifyContent: 'center', height: '100%', textDecoration: 'none', color: '#15803d',
            borderLeft: '1px solid #f1f5f9'
          }}
          title="Chat on WhatsApp"
        >
          <i className="fab fa-whatsapp" style={{ fontSize: '1.25rem', color: '#16a34a', marginBottom: '0.2rem' }}></i>
          <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.5px' }}>WHATSAPP</span>
        </a>

        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', border: 'none', background: 'none', cursor: 'pointer', justifySelf: 'stretch',
            color: '#1e293b', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9'
          }}
        >
          <i className="fas fa-compass" style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.2rem' }}></i>
          <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.5px' }}>CHAPTERS</span>
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
          <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.5px' }}>SHARE SITE</span>
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

      {/* FLOATING QUICK ADMIN ACTION TOOLBAR — ONLY VISIBLE TO AUTHENTICATED ADMINS */}
      {isAdmin && (
        <aside 
          aria-label="Admin Quick Tools"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: isRTL ? 'auto' : '24px',
            left: isRTL ? '24px' : 'auto',
            zIndex: 9999,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
        {isAdminToolsOpen ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            minWidth: '220px',
            color: '#fff',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D4AF37', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="fas fa-bolt" /> ADMIN STUDIO
              </div>
              <button 
                onClick={() => setIsAdminToolsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', padding: '2px' }}
                aria-label="Close admin tools"
              >
                ✕
              </button>
            </div>

            <Link
              href={`/jana/hero-carousel?targetScope=minisite&businessId=${biz?.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#f8fafc',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.45rem 0.6rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-images" style={{ color: '#D4AF37', width: '16px' }} />
              <span>Edit Hero & Carousels</span>
            </Link>

            <Link
              href="/jana/content"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#f8fafc',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.45rem 0.6rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-photo-film" style={{ color: '#38bdf8', width: '16px' }} />
              <span>Edit Content & Stories</span>
            </Link>

            <Link
              href={`/jana/businesses/${biz?.id}/edit`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#f8fafc',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.45rem 0.6rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-cog" style={{ color: '#a78bfa', width: '16px' }} />
              <span>Business Settings</span>
            </Link>

            <Link
              href="/jana/minisite-builder"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#f8fafc',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.45rem 0.6rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-store" style={{ color: '#34d399', width: '16px' }} />
              <span>Minisite Studio Hub</span>
            </Link>
          </div>
        ) : (
          <button
            onClick={() => setIsAdminToolsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '50px',
              padding: '0.55rem 1rem',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}
          >
            <i className="fas fa-bolt" style={{ color: '#D4AF37' }} />
            <span>ADMIN EDIT</span>
          </button>
        )}
      </aside>
      )}
    </div>
  );
}
