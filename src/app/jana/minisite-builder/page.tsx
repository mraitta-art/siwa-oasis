'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  COMPONENT_META,
  CANONICAL_SECTION_LABELS,
  MinisiteComponentType,
  MinisiteMode,
  MinisiteTier,
  MinisiteLayout,
  MinisiteLayoutComponent,
} from '@/lib/minisite-governance-client';

export const dynamic = 'force-dynamic';

export default function MinisiteBuilderStudio() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontWeight: 700 }}>
            <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '1rem' }} />
            <div>Loading Minisite Builder Studio...</div>
          </div>
        </div>
      }
    >
      <MinisiteBuilderStudioContent />
    </Suspense>
  );
}

function MinisiteBuilderStudioContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get('slug') || '';

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [siteContext, setSiteContext] = useState<any>(null);
  const [allowedComponents, setAllowedComponents] = useState<MinisiteComponentType[]>([]);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Helper to generate site-specific default props for a component
  const getSiteDefaultsForComp = (type: MinisiteComponentType, ctx: any, bInfo: any) => {
    const bizName = ctx?.name || bInfo?.name || '';
    const bizDesc = ctx?.description || ctx?.tagline || bInfo?.description || '';
    const bizPhone = ctx?.phone || bInfo?.phone || '';
    const bizCover = ctx?.cover_image || bInfo?.cover_image || '';
    const bizLogo = ctx?.logo_url || bInfo?.logo_url || '';
    const bizGallery = Array.isArray(ctx?.gallery) ? ctx.gallery : [];
    const bizServices = Array.isArray(ctx?.services) ? ctx.services : [];
    const bizProducts = Array.isArray(ctx?.products) ? ctx.products : [];

    switch (type) {
      case 'vendor_hero':
        return {
          title: bizName,
          subtitle: bizDesc.substring(0, 180),
          coverImage: bizCover,
          logoUrl: bizLogo,
          ctaText: bizPhone ? (lang === 'ar' ? 'تواصل عبر واتساب' : 'Direct WhatsApp') : (lang === 'ar' ? 'تواصل معنا' : 'Get in Touch'),
          ctaLink: bizPhone ? `https://wa.me/${bizPhone.replace(/[^0-9]/g, '')}` : '#contact',
        };
      case 'vendor_gallery':
        return {
          title: lang === 'ar' ? `معرض صور ومساحات ${bizName}` : `${bizName} Visual Showcase`,
          subtitle: lang === 'ar' ? 'لقطات أصيلة من قلب واحة سيوة الساحرة.' : 'Authentic moments and spaces captured from the oasis.',
          images: bizGallery.slice(0, 8).map((g: any) => g.url),
        };
      case 'vendor_services':
        return {
          title: lang === 'ar' ? `خدمات ومميزات ${bizName}` : `${bizName} Services & Amenities`,
          subtitle: lang === 'ar' ? 'ضيافة صحراوية أصيلة وتجارب متكاملة.' : 'Curated desert hospitality and tailored services.',
          services: bizServices.length > 0 ? bizServices : ['Desert Hospitality', 'Custom Itineraries', 'Local Expertise'],
        };
      case 'vendor_packages':
        return {
          title: lang === 'ar' ? 'الباقات والعروض الحصرية' : 'Curated Packages & Offers',
          subtitle: lang === 'ar' ? 'عروض وباقات خاصة مع حجز مباشر عبر الواتساب.' : 'Exclusive promotional rates with instant booking.',
          packages: bizProducts.slice(0, 6),
        };
      case 'vendor_carousel':
        return {
          title: lang === 'ar' ? `جولة سينمائية في ${bizName}` : `Cinematic Tour of ${bizName}`,
          subtitle: lang === 'ar' ? 'استكشف أجمل المشاهد والتفاصيل.' : 'Explore breathtaking highlights and spaces.',
        };
      case 'vendor_blog':
        return {
          title: lang === 'ar' ? 'أحدث القصص والمقالات' : 'Stories & Insights',
          subtitle: lang === 'ar' ? 'دليل واحة سيوة وتجارب فريدة من نوعها.' : 'Insights, local guides, and stories from the oasis.',
        };
      case 'cta_section':
        return {
          title: lang === 'ar' ? `هل أنت مستعد لزيارة ${bizName}؟` : `Ready to Experience ${bizName}?`,
          subtitle: lang === 'ar' ? 'فريقنا متاح على مدار الساعة للإجابة على استفساراتك وحجز تجربتك.' : 'Our team is ready to welcome you and plan your visit directly on WhatsApp.',
          buttonText: lang === 'ar' ? 'ابدأ المحادثة الآن' : 'Inquire on WhatsApp',
          buttonLink: bizPhone ? `https://wa.me/${bizPhone.replace(/[^0-9]/g, '')}` : '',
        };
      case 'text_section':
        return {
          title: lang === 'ar' ? `عن ${bizName}` : `About ${bizName}`,
          content: bizDesc || (lang === 'ar' ? `مرحبًا بكم في ${bizName} في واحة سيوة.` : `Welcome to ${bizName} in the heart of Siwa Oasis.`),
        };
      case 'faq':
        return {
          title: lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions',
          subtitle: lang === 'ar' ? 'إليك كل ما تحتاج لمعرفته قبل الحجز والزيارة.' : 'Everything you need to know prior to booking your visit.',
        };
      case 'testimonials':
        return {
          title: lang === 'ar' ? 'آراء الضيوف والزوار' : 'Guest Reviews & Experiences',
          subtitle: lang === 'ar' ? 'تجارب حقيقية من ضيوفنا الكرام.' : 'Authentic reflections from travelers who experienced our hospitality.',
        };
      default:
        return {};
    }
  };

  // Studio State
  const [mode, setMode] = useState<MinisiteMode>('replace');
  const [components, setComponents] = useState<MinisiteLayoutComponent[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>({
    primary_color: '#D4AF37',
    bg_color: '#090e17',
    text_color: '#f8fafc',
    show_platform_nav: true,
    show_platform_footer: true,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [governanceRules, setGovernanceRules] = useState<Record<MinisiteTier, MinisiteComponentType[]>>({
    free: [],
    standard: [],
    premium: [],
    admin: [],
  });

  // Hub Overview State
  const [overviewData, setOverviewData] = useState<{
    existingLayouts: any[];
    availableForBuilder: any[];
    stats: { total: number; builderCount: number; sectionalCount: number };
  } | null>(null);
  const [hubTab, setHubTab] = useState<'update' | 'create' | 'bridges'>('update');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExistingLayout, setIsExistingLayout] = useState(false);

  // Load business list and overview status
  const loadOverview = async () => {
    try {
      const res = await fetch('/api/jana/minisite-layout?overview=1');
      let data = res.ok ? await res.json() : null;
      let existingList = data?.existingLayouts || [];
      let availableList = data?.availableForBuilder || [];

      // Fallback if overview query returned 0 businesses
      if (existingList.length === 0 && availableList.length === 0) {
        try {
          const fbRes = await fetch('/api/jana/businesses');
          if (fbRes.ok) {
            const rawBizList = await fbRes.json();
            if (Array.isArray(rawBizList) && rawBizList.length > 0) {
              availableList = rawBizList.map((b: any) => ({
                id: b.id,
                name: b.name,
                slug: b.slug || b.id,
                type_id: b.type_id,
                type_name: b.type_name || 'Generic Typology',
                subscription_tier: b.subscription_tier || 'free',
                tier: b.subscription_tier || 'free',
                logo_url: b.logo_url || null,
                cover_image: b.cover_image || null,
                hasLayout: false,
                layoutMode: null,
                layoutUpdatedAt: null,
                componentsCount: 0,
              }));
              data = {
                existingLayouts: [],
                availableForBuilder: availableList,
                stats: {
                  total: availableList.length,
                  builderCount: 0,
                  sectionalCount: availableList.length,
                },
              };
            }
          }
        } catch (fbErr) {
          console.warn('Fallback to /api/jana/businesses failed:', fbErr);
        }
      }

      if (data) {
        setOverviewData(data);
        const combined = [...(data.existingLayouts || existingList), ...(data.availableForBuilder || availableList)];
        setBusinesses(combined);
        if ((!data.existingLayouts || data.existingLayouts.length === 0) && (data.availableForBuilder?.length > 0)) {
          setHubTab('create');
        }
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      if (!initialSlug) setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  // Load layout and governance when selected business changes
  useEffect(() => {
    if (!selectedSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage(null);

    fetch(`/api/jana/minisite-layout?slug=${selectedSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage({ text: data.error, type: 'error' });
          return;
        }
        setBusinessInfo(data.business);
        setSiteContext(data.siteContext || null);
        setAllowedComponents(data.allowedComponents || []);

        if (data.layout) {
          setIsExistingLayout(true);
          setMode(data.layout.mode || 'replace');
          setComponents(data.layout.components || []);
          setSiteSettings(data.layout.site_settings || {});
        } else {
          // Default initial layout tailored to THIS business's data
          setIsExistingLayout(false);
          setMode('replace');
          const ctx = data.siteContext;
          const bInfo = data.business;
          setComponents([
            { id: 'hero_1', type: 'vendor_hero', order: 0, props: getSiteDefaultsForComp('vendor_hero', ctx, bInfo) },
            { id: 'gallery_1', type: 'vendor_gallery', order: 1, props: getSiteDefaultsForComp('vendor_gallery', ctx, bInfo) },
            { id: 'services_1', type: 'vendor_services', order: 2, props: getSiteDefaultsForComp('vendor_services', ctx, bInfo) },
            { id: 'cta_1', type: 'cta_section', order: 3, props: getSiteDefaultsForComp('cta_section', ctx, bInfo) },
          ]);
        }
      })
      .catch((err) => setMessage({ text: err.message, type: 'error' }))
      .finally(() => setLoading(false));
  }, [selectedSlug]);

  // Open governance modal & load rules
  const handleOpenGovernance = () => {
    fetch('/api/jana/minisite-layout?governance=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.rules) setGovernanceRules(data.rules);
        setShowGovernanceModal(true);
      })
      .catch(() => alert('Failed to load governance rules'));
  };

  const handleSaveGovernance = async () => {
    try {
      const res = await fetch('/api/jana/minisite-layout?governance=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: governanceRules }),
      });
      if (!res.ok) throw new Error('Save failed');
      alert('Governance rules updated successfully!');
      setShowGovernanceModal(false);
      // Refresh current business allowed
      if (selectedSlug) {
        const ref = await fetch(`/api/jana/minisite-layout?slug=${selectedSlug}`).then((r) => r.json());
        if (ref.allowedComponents) setAllowedComponents(ref.allowedComponents);
        if (ref.siteContext) setSiteContext(ref.siteContext);
      }
    } catch (err: any) {
      alert(err.message || 'Error saving rules');
    }
  };

  // Add Component to Canvas with site-specific pre-populated properties
  const handleAddComponent = (type: MinisiteComponentType) => {
    const siteDefaults = getSiteDefaultsForComp(type, siteContext, businessInfo);
    const newComp: MinisiteLayoutComponent = {
      id: `${type}_${Date.now()}`,
      type,
      order: components.length,
      props: siteDefaults,
    };
    setComponents([...components, newComp]);
    setSelectedCompId(newComp.id);
  };

  // Reset a specific component back to this site's current database defaults
  const handleResetComponentToSiteDefaults = (comp: MinisiteLayoutComponent) => {
    const siteDefaults = getSiteDefaultsForComp(comp.type, siteContext, businessInfo);
    const updated = components.map((c) =>
      c.id === comp.id ? { ...c, props: { ...siteDefaults } } : c
    );
    setComponents(updated);
  };

  // Move component up/down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= components.length) return;
    const reordered = [...components];
    const temp = reordered[index];
    reordered[index] = reordered[target];
    reordered[target] = temp;
    reordered.forEach((c, idx) => (c.order = idx));
    setComponents(reordered);
  };

  // Remove component
  const handleRemove = (id: string) => {
    const filtered = components.filter((c) => c.id !== id);
    filtered.forEach((c, idx) => (c.order = idx));
    setComponents(filtered);
    if (selectedCompId === id) setSelectedCompId(null);
  };

  // Save layout
  const handleSaveLayout = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload: MinisiteLayout = {
        mode,
        components,
        site_settings: siteSettings,
      };

      const res = await fetch(`/api/jana/minisite-layout?slug=${selectedSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setMessage({
        text: `Layout published successfully! ${
          data.strippedCount > 0 ? `(${data.strippedCount} non-tier items removed)` : ''
        }`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete layout & reset to section system
  const handleDeleteLayout = async (slugToDelete?: string) => {
    const targetSlug = slugToDelete || selectedSlug;
    if (!targetSlug) return;
    if (
      !confirm(
        'Are you sure you want to delete this custom layout? The business minisite will immediately revert to the automatic free section system.'
      )
    )
      return;

    try {
      const res = await fetch(`/api/jana/minisite-layout?slug=${targetSlug}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      alert('Minisite reverted to default free section architecture.');
      await loadOverview();
      if (selectedSlug === targetSlug) {
        setSelectedSlug('');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const selectedComp = components.find((c) => c.id === selectedCompId);
  const liveUrl = businessInfo?.slug ? `/${businessInfo.slug}` : `/`;

  // ─────────────────────────────────────────────────────────────
  // ── HUB VIEW: Dispatch Hub when no target minisite is selected
  // ─────────────────────────────────────────────────────────────
  if (!selectedSlug) {
    const existing = (overviewData?.existingLayouts || []).filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name?.toLowerCase().includes(q) ||
        b.slug?.toLowerCase().includes(q) ||
        b.type_name?.toLowerCase().includes(q)
      );
    });

    const available = (overviewData?.availableForBuilder || []).filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name?.toLowerCase().includes(q) ||
        b.slug?.toLowerCase().includes(q) ||
        b.type_name?.toLowerCase().includes(q)
      );
    });

    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '1.5rem', fontFamily: "'Inter', sans-serif" }}>
        {/* Hub Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  color: '#D4AF37',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                ADMIN GOVERNANCE STUDIO
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#fef3c7',
                  color: '#b45309',
                  fontWeight: 800,
                }}
              >
                DISPATCH HUB
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {lang === 'ar' ? 'منصة توجيه وإدارة مواقع الميني سايت' : 'Minisite Architecture & Dispatch Hub'}
            </h1>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              {lang === 'ar'
                ? 'حدد ما إذا كنت ترغب في تحديث موقع ميني سايت مبني بمكونات مخصصة، أو إنشاء وتفعيل موقع جديد من سجل الأنشطة المجاني.'
                : 'Choose whether to update an active component-built minisite or create a new one from the free sectional registry.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              🌐 {lang === 'en' ? '🇸🇦 عربي' : '🇬🇧 English'}
            </button>
            <button
              onClick={handleOpenGovernance}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <i className="fas fa-shield-halved" style={{ color: '#D4AF37' }} /> Tier Governance Rules
            </button>
          </div>
        </header>

        {/* Overview Statistics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '18px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>
              TOTAL REGISTERED ENTITIES
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
              {overviewData?.stats?.total ?? businesses.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Available in the Oasis database
            </div>
          </div>

          <div
            onClick={() => setHubTab('update')}
            style={{
              padding: '1.5rem',
              borderRadius: '18px',
              background: hubTab === 'update' ? '#fffdf5' : '#ffffff',
              border: `2px solid ${hubTab === 'update' ? '#D4AF37' : '#e2e8f0'}`,
              cursor: 'pointer',
              boxShadow: hubTab === 'update' ? '0 6px 20px rgba(212,175,55,0.15)' : '0 4px 12px rgba(0,0,0,0.02)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#d97706', letterSpacing: '1px', textTransform: 'uppercase' }}>
                ⚡ ACTIVE BUILDER MINISITES
              </div>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '50px', background: '#fef3c7', color: '#b45309', fontWeight: 800 }}>
                CUSTOM DESIGNED
              </span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706', marginTop: '0.4rem' }}>
              {overviewData?.stats?.builderCount ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#78350f', marginTop: '0.35rem', fontWeight: 600 }}>
              Custom component layouts published • Click to view &amp; update
            </div>
          </div>

          <div
            onClick={() => setHubTab('create')}
            style={{
              padding: '1.5rem',
              borderRadius: '18px',
              background: hubTab === 'create' ? '#f0fdf4' : '#ffffff',
              border: `2px solid ${hubTab === 'create' ? '#16a34a' : '#e2e8f0'}`,
              cursor: 'pointer',
              boxShadow: hubTab === 'create' ? '0 6px 20px rgba(22,163,74,0.12)' : '0 4px 12px rgba(0,0,0,0.02)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#15803d', letterSpacing: '1px', textTransform: 'uppercase' }}>
                🛡️ FREE SECTIONAL MINISITES
              </div>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '50px', background: '#dcfce7', color: '#166534', fontWeight: 800 }}>
                STANDARD SYSTEM
              </span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803d', marginTop: '0.4rem' }}>
              {overviewData?.stats?.sectionalCount ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '0.35rem', fontWeight: 600 }}>
              Running free automatic sections • Click to upgrade to Builder
            </div>
          </div>
        </div>

        {/* Tab Selection & Search Navigation Bar */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Main Action Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setHubTab('update')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '9px',
                border: 'none',
                background: hubTab === 'update' ? '#0f172a' : 'transparent',
                color: hubTab === 'update' ? '#ffffff' : '#64748b',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: hubTab === 'update' ? '0 4px 12px rgba(15,23,42,0.15)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <i className="fas fa-rotate" style={{ color: hubTab === 'update' ? '#D4AF37' : '#94a3b8' }} />
              {lang === 'ar' ? 'تحديث المواقع المخصصة الحالية' : 'Update Existing Builder Minisites'}
              <span style={{ fontSize: '0.75rem', padding: '2px 7px', borderRadius: '50px', background: hubTab === 'update' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: hubTab === 'update' ? '#fff' : '#64748b' }}>
                {overviewData?.stats?.builderCount ?? 0}
              </span>
            </button>

            <button
              onClick={() => setHubTab('create')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '9px',
                border: 'none',
                background: hubTab === 'create' ? '#0f172a' : 'transparent',
                color: hubTab === 'create' ? '#ffffff' : '#64748b',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: hubTab === 'create' ? '0 4px 12px rgba(15,23,42,0.15)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <i className="fas fa-plus" style={{ color: hubTab === 'create' ? '#22c55e' : '#94a3b8' }} />
              {lang === 'ar' ? 'إنشاء وتفعيل ميني سايت جديد' : 'Create New Builder Minisite'}
              <span style={{ fontSize: '0.75rem', padding: '2px 7px', borderRadius: '50px', background: hubTab === 'create' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: hubTab === 'create' ? '#fff' : '#64748b' }}>
                {overviewData?.stats?.sectionalCount ?? 0}
              </span>
            </button>

            <button
              onClick={() => setHubTab('bridges')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '9px',
                border: 'none',
                background: hubTab === 'bridges' ? '#0f172a' : 'transparent',
                color: hubTab === 'bridges' ? '#ffffff' : '#64748b',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: hubTab === 'bridges' ? '0 4px 12px rgba(15,23,42,0.15)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <i className="fas fa-network-wired" style={{ color: hubTab === 'bridges' ? '#38bdf8' : '#94a3b8' }} />
              {lang === 'ar' ? 'جسور الأقسام والموقع الرئيسي' : 'Section & Main-Site Bridges'}
              <span style={{ fontSize: '0.75rem', padding: '2px 7px', borderRadius: '50px', background: hubTab === 'bridges' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: hubTab === 'bridges' ? '#fff' : '#64748b' }}>
                10
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 300px', maxWidth: '480px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن نشاط بالاسم أو التصنيف...' : 'Filter entities by name, slug or typology...'}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* TAB 1: UPDATE EXISTING BUILDER MINISITES */}
        {hubTab === 'update' && (
          <div>
            {existing.length === 0 ? (
              <div
                style={{
                  padding: '4rem 2rem',
                  borderRadius: '20px',
                  background: '#ffffff',
                  border: '2px dashed #cbd5e1',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffdf5', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#d97706', fontSize: '1.5rem' }}>
                  <i className="fas fa-wand-magic-sparkles" />
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  {searchQuery ? 'No matching builder minisites' : 'No custom builder minisites deployed yet'}
                </h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: '#64748b', maxWidth: 520, marginInline: 'auto' }}>
                  {searchQuery
                    ? 'Try adjusting your search query, or switch to the Create New tab to upgrade an entity.'
                    : 'All registered businesses are currently safely operating on the Free Sectional system. Click below to choose an entity and design your first custom layout.'}
                </p>
                <button
                  onClick={() => setHubTab('create')}
                  style={{
                    padding: '0.75rem 1.6rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.2)',
                  }}
                >
                  <i className="fas fa-plus" style={{ marginRight: '6px', color: '#22c55e' }} />
                  Create Your First Builder Minisite
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {existing.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: '18px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div>
                      {/* Top badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: item.layoutMode === 'untied' ? '#faf5ff' : '#eff6ff',
                            color: item.layoutMode === 'untied' ? '#7e22ce' : '#1d4ed8',
                            border: `1px solid ${item.layoutMode === 'untied' ? '#e9d5ff' : '#bfdbfe'}`,
                            fontWeight: 800,
                          }}
                        >
                          {item.layoutMode === 'untied' ? 'Untied Mode' : 'Replace Mode (Auto-Synced)'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: item.tier === 'premium' ? '#fdf4ff' : item.tier === 'standard' ? '#eff6ff' : '#fefce8',
                            color: item.tier === 'premium' ? '#9333ea' : item.tier === 'standard' ? '#2563eb' : '#ca8a04',
                            fontWeight: 800,
                          }}
                        >
                          {item.tier.toUpperCase()} TIER
                        </span>
                      </div>

                      {/* Business identity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                        {item.logo_url ? (
                          <img
                            src={item.logo_url}
                            alt=""
                            style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '12px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#D4AF37',
                              fontWeight: 900,
                              fontSize: '1.1rem',
                            }}
                          >
                            {item.name?.charAt(0) || 'B'}
                          </div>
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                            {item.name}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            /{item.slug} • <span style={{ color: '#0f172a', fontWeight: 600 }}>{item.type_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Layout info metrics */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: '10px',
                          padding: '0.65rem 0.85rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          <i className="fas fa-cubes" style={{ color: '#D4AF37', marginRight: '6px' }} />
                          <strong>{item.componentsCount}</strong> Layout Blocks
                        </span>
                        {item.layoutUpdatedAt && (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {new Date(item.layoutUpdatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                      <button
                        onClick={() => setSelectedSlug(item.slug)}
                        style={{
                          flex: 1,
                          padding: '0.6rem 0.9rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#0f172a',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <i className="fas fa-pen-to-square" style={{ color: '#D4AF37' }} />
                        {lang === 'ar' ? 'تعديل وتحديث الموقع' : 'Edit & Update Layout'}
                      </button>

                      <a
                        href={`/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '0.6rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#0f172a',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        title="View Live Minisite"
                      >
                        <i className="fas fa-external-link-alt" />
                      </a>

                      <button
                        onClick={() => handleDeleteLayout(item.slug)}
                        style={{
                          padding: '0.6rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          color: '#dc2626',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Revert to Free Sectional Minisite"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE / UPGRADE NEW MINISITE FROM SECTIONAL */}
        {hubTab === 'create' && (
          <div>
            {/* Explanatory Policy Banner */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}
              >
                <i className="fas fa-shield-check" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#166534', marginBottom: '0.2rem' }}>
                  {lang === 'ar' ? 'سجل مواقع الميني سايت المجانية (Sectional)' : 'Free Sectional Minisite Registry'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.5 }}>
                  {lang === 'ar'
                    ? 'جميع الأنشطة أدناه تعمل حالياً بالنظام الأوتوماتيكي المجاني. عند اختيار أي نشاط، سيتم فتح محرر المكونات مع تعبئة بيانات النشاط تلقائياً لتصميم ميني سايت مخصص.'
                    : 'All entities below are currently running on the automatic Free Sectional system. Selecting any business launches the Builder Studio with its real database assets pre-filled.'}
                </div>
              </div>
            </div>

            {available.length === 0 ? (
              <div
                style={{
                  padding: '3rem 2rem',
                  borderRadius: '18px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <i className="fas fa-check-circle fa-2x" style={{ color: '#22c55e', marginBottom: '0.75rem' }} />
                <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>
                  {searchQuery ? 'No matching entities found' : 'All entities have been customized!'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Switch to the "Update Existing Builder Minisites" tab to edit your deployed layouts.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {available.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: '18px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div>
                      {/* Top tags */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            fontWeight: 800,
                          }}
                        >
                          ✓ SECTIONAL (FREE)
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: item.tier === 'premium' ? '#fdf4ff' : item.tier === 'standard' ? '#eff6ff' : '#fefce8',
                            color: item.tier === 'premium' ? '#9333ea' : item.tier === 'standard' ? '#2563eb' : '#ca8a04',
                            fontWeight: 800,
                          }}
                        >
                          {item.tier.toUpperCase()} TIER
                        </span>
                      </div>

                      {/* Business identity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                        {item.logo_url ? (
                          <img
                            src={item.logo_url}
                            alt=""
                            style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '12px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b',
                              fontWeight: 900,
                              fontSize: '1.1rem',
                            }}
                          >
                            {item.name?.charAt(0) || 'B'}
                          </div>
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                            {item.name}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            /{item.slug} • <span style={{ color: '#0f172a', fontWeight: 600 }}>{item.type_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                      <button
                        onClick={() => setSelectedSlug(item.slug)}
                        style={{
                          flex: 1,
                          padding: '0.65rem 1rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#0f172a',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
                        }}
                      >
                        <i className="fas fa-wand-magic-sparkles" style={{ color: '#D4AF37' }} />
                        {lang === 'ar' ? 'إنشاء وتفعيل ميني سايت مخصص' : 'Create Builder Layout'}
                      </button>

                      <a
                        href={`/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#64748b',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        title="Preview Sectional Minisite"
                      >
                        <i className="fas fa-eye" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECTION & MAIN-SITE BRIDGES ARCHITECTURE */}
        {hubTab === 'bridges' && (
          <div>
            {/* Banner explaining the Section Mini-Hub Architecture */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#ffffff',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '14px',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#D4AF37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  flexShrink: 0,
                }}
              >
                <i className="fas fa-network-wired" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    CROSS-HUB ARCHITECTURE
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    <i className="fas fa-check-circle" style={{ marginRight: '4px' }} />
                    Zero Data Duplication
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc' }}>
                  {lang === 'ar' ? 'جسور الأقسام الموحدة: الميني سايت كبوابة مخصصة للموقع الرئيسي' : 'Sectional Mini-Hub to Main-Site Bridge Registry'}
                </h3>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, maxWidth: '850px' }}>
                  {lang === 'ar'
                    ? 'كل قسم في الميني سايت هو بمثابة نافذة مخصصة (Mini Hub) تعكس نفس بيانات وقسم الموقع الرئيسي لنفس النشاط. على سبيل المثال، قسم الباقات في الميني سايت يقرأ من نفس جدول باقات الموقع الرئيسي، والتعديل يظهر في الاثنين معاً.'
                    : 'Each business minisite section functions as a scoped Mini Hub to the corresponding main site section. Data is shared from the same single source of truth: tour packages, catalog items, and galleries seamlessly connect both domains.'}
                </p>
              </div>
            </div>

            {/* 10 Canonical Sections Bridge Matrix Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {Object.entries(CANONICAL_SECTION_LABELS).map(([secId, sec]) => {
                const linkedComponents = Object.entries(COMPONENT_META).filter(([, comp]) =>
                  comp.canonicalSections?.includes(secId)
                );

                return (
                  <div
                    key={secId}
                    style={{
                      borderRadius: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      {/* Section Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{sec.emoji}</span>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                              {sec.label}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: sec.color, fontWeight: 800, background: `${sec.color}15`, padding: '1px 6px', borderRadius: '4px' }}>
                              {secId}
                            </span>
                          </div>
                        </div>

                        {/* Main Site Mirror Pill */}
                        <a
                          href={sec.mainSiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#2563eb',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Open Main Site Equivalent"
                        >
                          <i className="fas fa-globe" />
                          <span>{sec.mainSiteUrl}</span>
                          <i className="fas fa-external-link-alt" style={{ fontSize: '0.6rem' }} />
                        </a>
                      </div>

                      {/* Bridge Summary */}
                      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.85rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <i className="fas fa-database" style={{ color: '#10b981' }} />
                          <span>Storage:</span>
                          <code style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 700 }}>
                            {secId === 'sec_5_experiences' || secId === 'sec_8_connector'
                              ? 'tour_products'
                              : secId === 'sec_9_marketplace_catalog'
                              ? 'marketplace_items'
                              : secId === 'sec_2_ambience' || secId === 'sec_3_facilities' || secId === 'sec_4_gastronomy'
                              ? 'vendor_gallery'
                              : 'businesses'}
                          </code>
                          <span style={{ marginLeft: 'auto', color: '#10b981', fontWeight: 800, fontSize: '0.68rem' }}>
                            🟢 2-Way Synced
                          </span>
                        </div>
                      </div>

                      {/* Compatible Minisite Builder Components */}
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                          Compatible Builder Components:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {linkedComponents.map(([compKey, compMeta]) => (
                            <span
                              key={compKey}
                              style={{
                                fontSize: '0.7rem',
                                padding: '3px 7px',
                                borderRadius: '6px',
                                background: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className={`fas ${compMeta.icon}`} style={{ fontSize: '0.65rem', color: '#D4AF37' }} />
                              {compMeta.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action */}
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Canonical Section {secId.replace('sec_', '#')}
                      </span>
                      <button
                        onClick={() => {
                          setHubTab('create');
                        }}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Apply to Entities →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Governance Matrix Modal */}
        {showGovernanceModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  Component Tier Governance Matrix
                </h2>
                <button
                  onClick={() => setShowGovernanceModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {(['free', 'standard', 'premium', 'admin'] as MinisiteTier[]).map((tier) => (
                  <div key={tier} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', color: '#0f172a' }}>
                        {tier} Tier Rulebook
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                        {governanceRules[tier]?.length || 0} allowed
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                      {Object.keys(COMPONENT_META).map((cKey) => {
                        const type = cKey as MinisiteComponentType;
                        const meta = COMPONENT_META[type];
                        const isChecked = governanceRules[tier]?.includes(type);

                        return (
                          <label
                            key={type}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              background: isChecked ? '#ffffff' : 'transparent',
                              border: isChecked ? '1px solid #cbd5e1' : '1px solid transparent',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: isChecked ? '#0f172a' : '#94a3b8',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = governanceRules[tier] || [];
                                const updated = e.target.checked
                                  ? [...current, type]
                                  : current.filter((x) => x !== type);
                                setGovernanceRules({ ...governanceRules, [tier]: updated });
                              }}
                            />
                            <i className={`fas ${meta.icon}`} style={{ color: isChecked ? '#D4AF37' : '#cbd5e1' }} />
                            <span>{meta.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowGovernanceModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGovernance}
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                >
                  Save Tier Matrix
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ── CANVAS STUDIO VIEW: Target Minisite is Selected
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '1.5rem', fontFamily: "'Inter', sans-serif" }}>
      {/* Studio Header Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <button
              onClick={() => {
                setSelectedSlug('');
                loadOverview();
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <i className="fas fa-arrow-left" />
              {lang === 'ar' ? 'العودة للمنصة الرئيسية' : 'All Minisites Hub'}
            </button>

            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                color: '#D4AF37',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              BUILDER STUDIO
            </span>

            {isExistingLayout ? (
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  fontWeight: 900,
                }}
              >
                ⚡ UPDATING ACTIVE LAYOUT
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#fffdf5',
                  color: '#d97706',
                  border: '1px solid #fde68a',
                  fontWeight: 900,
                }}
              >
                ✨ CREATING NEW LAYOUT (UPGRADING FROM SECTIONAL)
              </span>
            )}
          </div>
          <h1 style={{ margin: '0.2rem 0', fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
            {businessInfo?.name || selectedSlug} Minisite Canvas
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Regulate custom layout blocks, govern tier privileges, and toggle Replace vs. Untied mode.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            style={{
              padding: '0.55rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            🌐 {lang === 'en' ? '🇸🇦 عربي' : '🇬🇧 English'}
          </button>

          <button
            onClick={handleOpenGovernance}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="fas fa-shield-halved" style={{ color: '#D4AF37' }} /> Tier Governance Rules
          </button>

          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              border: '1px solid #2563eb',
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="fas fa-external-link-alt" /> Preview Live
          </a>

          <button
            onClick={handleSaveLayout}
            disabled={saving || !selectedSlug}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '10px',
              border: 'none',
              background: saving ? '#94a3b8' : '#0f172a',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
            }}
          >
            <i className="fas fa-cloud-arrow-up" style={{ color: '#D4AF37' }} />
            {saving ? 'Publishing...' : 'Publish Layout'}
          </button>
        </div>
      </header>

      {/* Quick Content Bridges Toolbar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '1rem 1.35rem',
          marginBottom: '1.5rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 18px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {lang === 'ar' ? 'جسور الإدارة المتكاملة للمحتوى' : 'UNIFIED CONTENT MANAGEMENT BRIDGES'}
            </span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
            {lang === 'ar' ? `الربط المباشر مع أدوات المحتوى: ${businessInfo?.name || selectedSlug}` : `Direct Content Flow & Management: ${businessInfo?.name || selectedSlug}`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link
            href={`/jana/blog/editor?target_type=business_minisite&businessId=${businessInfo?.id || ''}&sectionId=sec_1_identity`}
            target="_blank"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              background: 'rgba(37, 99, 235, 0.25)',
              border: '1px solid #3b82f6',
              color: '#93c5fd',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="fas fa-pen-nib" style={{ color: '#60a5fa' }} />
            {lang === 'ar' ? '✍️ كتابة مقال ونشره' : '✍️ Blog Studio'}
          </Link>

          <Link
            href={`/vendor/social-toolkit?slug=${selectedSlug}`}
            target="_blank"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              background: 'rgba(236, 72, 153, 0.25)',
              border: '1px solid #ec4899',
              color: '#fbcfe8',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="fas fa-video" style={{ color: '#f472b6' }} />
            {lang === 'ar' ? '🎬 مزامنة الفيديوهات والريلز' : '🎬 Reels & Videos'}
          </Link>

          <Link
            href="/vendor/packages"
            target="_blank"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid #10b981',
              color: '#a7f3d0',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="fas fa-box-open" style={{ color: '#34d399' }} />
            {lang === 'ar' ? '📦 باقات وتجارب' : '📦 Package Studio'}
          </Link>

          <Link
            href="/jana/whatsapp-outreach"
            target="_blank"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.25)',
              border: '1px solid #22c55e',
              color: '#bbf7d0',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="fab fa-whatsapp" style={{ color: '#4ade80' }} />
            {lang === 'ar' ? '📲 تفعيل الواتساب' : '📲 WhatsApp Hub'}
          </Link>
        </div>
      </div>

      {/* Status banner */}
      {message && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Business Selector & Mode Control Panel */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.4rem' }}>
            SELECT TARGET MINISITE
          </label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#0f172a',
              background: '#f8fafc',
            }}
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.slug || b.id}>
                {b.name} ({b.slug || b.id})
              </option>
            ))}
          </select>
        </div>

        {/* Business Tier & Metadata */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.4rem' }}>
            BUSINESS GOVERNANCE STATUS
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '8px',
                background:
                  businessInfo?.tier === 'premium'
                    ? '#fdf4ff'
                    : businessInfo?.tier === 'standard'
                    ? '#eff6ff'
                    : '#fefce8',
                color:
                  businessInfo?.tier === 'premium'
                    ? '#9333ea'
                    : businessInfo?.tier === 'standard'
                    ? '#2563eb'
                    : '#ca8a04',
                border: '1px solid currentColor',
              }}
            >
              {businessInfo?.tier || 'Free'} Tier
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              {businessInfo?.type_name || 'Category'}
            </span>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.4rem' }}>
            RENDERING ARCHITECTURE MODE
          </label>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', width: 'fit-content' }}>
            <button
              onClick={() => setMode('replace')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'replace' ? '#ffffff' : 'transparent',
                color: mode === 'replace' ? '#0f172a' : '#64748b',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: mode === 'replace' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Replace Mode
            </button>
            <button
              onClick={() => setMode('untied')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'untied' ? '#ffffff' : 'transparent',
                color: mode === 'untied' ? '#0f172a' : '#64748b',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: mode === 'untied' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Untied Mode (Free Canvas)
            </button>
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
            {mode === 'replace'
              ? 'Auto-injects vendor database records (gallery, packages, stories) into layout blocks.'
              : 'Pure page builder. Components do not bind to vendor database records.'}
          </p>
        </div>
      </section>

      {/* Main Studio 3-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(260px, 24vw, 320px) 1fr clamp(280px, 26vw, 360px)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: COMPONENT PALETTE ────────────────── */}
        <aside
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            position: 'sticky',
            top: '1rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.2rem' }}>
              Component Palette
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
              Filtered by {businessInfo?.name}&apos;s tier rules
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(Object.keys(COMPONENT_META) as MinisiteComponentType[]).map((type) => {
              const meta = COMPONENT_META[type];
              const isAllowed = allowedComponents.includes(type);

              return (
                <div
                  key={type}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isAllowed ? '#e2e8f0' : '#f1f5f9',
                    background: isAllowed ? '#ffffff' : '#f8fafc',
                    opacity: isAllowed ? 1 : 0.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <i className={`fas ${meta.icon}`} style={{ color: isAllowed ? '#D4AF37' : '#94a3b8', fontSize: '0.9rem' }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                        {meta.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'capitalize' }}>
                          {meta.tier} Tier
                        </span>
                        {meta.mainSitePages && meta.mainSitePages[0] && (
                          <span style={{ fontSize: '0.62rem', background: '#eff6ff', color: '#2563eb', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                            🌐 {meta.mainSitePages[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAllowed ? (
                    <button
                      onClick={() => handleAddComponent(type)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      + Add
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      <i className="fas fa-lock" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER: CANVAS / REORDER LIST ─────────── */}
        <main
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            minHeight: '520px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Active Layout Blocks ({components.length})
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Reorder using arrows • Click to edit properties
              </span>
            </div>
            {components.length > 0 && (
              <button
                onClick={() => handleDeleteLayout()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Reset to Default
              </button>
            )}
          </div>

          {components.length === 0 ? (
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '14px',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <i className="fas fa-layer-group" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.75rem' }} />
              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                Canvas is empty. Add components from the palette on the left.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {components.map((comp, index) => {
                const meta = COMPONENT_META[comp.type] || {
                  label: comp.type,
                  icon: 'fa-cube',
                };
                const isSelected = selectedCompId === comp.id;

                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedCompId(comp.id)}
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: isSelected ? '#D4AF37' : '#e2e8f0',
                      background: isSelected ? '#fffdf7' : '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          color: '#475569',
                        }}
                      >
                        {index + 1}
                      </span>
                      <i className={`fas ${meta.icon}`} style={{ color: '#D4AF37', fontSize: '1.1rem' }} />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                          {meta.label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Type: <code>{comp.type}</code>
                          </span>
                          {meta.mainSitePages && meta.mainSitePages[0] && (
                            <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <i className="fas fa-link" style={{ fontSize: '0.55rem' }} /> Mirrors {meta.mainSitePages[0]}
                            </span>
                          )}
                          {meta.canonicalSections && meta.canonicalSections[0] && (
                            <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {meta.canonicalSections[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.4 : 1,
                        }}
                      >
                        <i className="fas fa-arrow-up" style={{ fontSize: '0.75rem' }} />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === components.length - 1}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          cursor: index === components.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === components.length - 1 ? 0.4 : 1,
                        }}
                      >
                        <i className="fas fa-arrow-down" style={{ fontSize: '0.75rem' }} />
                      </button>
                      <button
                        onClick={() => handleRemove(comp.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          color: '#dc2626',
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fas fa-trash" style={{ fontSize: '0.75rem' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── RIGHT: PROPERTY & THEME SETTINGS ─────── */}
        <aside
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            position: 'sticky',
            top: '1rem',
          }}
        >
          {selectedComp ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Block Properties
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800 }}>
                    {selectedComp.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetComponentToSiteDefaults(selectedComp)}
                  title="Reset props to this business's current database values"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fas fa-rotate" /> Reset to Site DB
                </button>
              </div>

              {/* Form fields for selected component props */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                    Block Title
                  </label>
                  <input
                    type="text"
                    value={String(selectedComp.props?.title ?? '')}
                    onChange={(e) => {
                      const updated = components.map((c) =>
                        c.id === selectedComp.id
                          ? { ...c, props: { ...(c.props || {}), title: e.target.value } }
                          : c
                      );
                      setComponents(updated);
                    }}
                    placeholder="Custom section title"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                    Subtitle / Description
                  </label>
                  <textarea
                    rows={3}
                    value={String(selectedComp.props?.subtitle ?? selectedComp.props?.description ?? selectedComp.props?.content ?? '')}
                    onChange={(e) => {
                      const updated = components.map((c) =>
                        c.id === selectedComp.id
                          ? {
                              ...c,
                              props: {
                                ...(c.props || {}),
                                subtitle: e.target.value,
                                description: e.target.value,
                                content: e.target.value,
                              },
                            }
                          : c
                      );
                      setComponents(updated);
                    }}
                    placeholder="Brief description or narrative text"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                {/* Additional props for CTA */}
                {selectedComp.type === 'cta_section' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={String(selectedComp.props?.buttonText ?? '')}
                      onChange={(e) => {
                        const updated = components.map((c) =>
                          c.id === selectedComp.id
                            ? { ...c, props: { ...(c.props || {}), buttonText: e.target.value } }
                            : c
                        );
                        setComponents(updated);
                      }}
                      placeholder="e.g. Inquire on WhatsApp"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                )}

                {/* ── CONTEXTUAL MANAGEMENT BRIDGES ── */}
                {/* Each bridge links directly to THIS business's specific management section */}

                {/* vendor_hero → Identity & Branding in business orchestrator */}
                {selectedComp.type === 'vendor_hero' && businessInfo?.id && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#92400e', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      <i className="fas fa-fingerprint" style={{ marginRight: '6px', color: '#d97706' }} />
                      MANAGE IDENTITY &amp; LOGO FOR THIS BUSINESS
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#78350f', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      Edit the business name, logo, cover photo, tagline, and WhatsApp number — they auto-sync to this hero block in Replace mode.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/jana/businesses/${businessInfo.id}/orchestrate?section=sec_1_identity`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#d97706', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-id-card" /> Edit Identity &amp; Logo
                      </Link>
                      <Link href={`/jana/businesses/${businessInfo.id}/orchestrate?tab=BRANDING`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#92400e', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-palette" /> Branding &amp; Nav
                      </Link>
                    </div>
                  </div>
                )}

                {/* vendor_gallery → Gallery management for this specific business */}
                {selectedComp.type === 'vendor_gallery' && businessInfo?.id && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #D4AF37', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      <i className="fas fa-images" style={{ marginRight: '6px', color: '#D4AF37' }} />
                      MANAGE GALLERY FOR: {(businessInfo?.name || selectedSlug).toUpperCase()}
                    </div>
                    {siteContext?.gallery?.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {siteContext.gallery.slice(0, 6).map((img: any, i: number) => (
                          <img key={i} src={img.url} alt={img.caption || ''} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                        ))}
                        {siteContext.gallery.length > 6 && (
                          <div style={{ width: 48, height: 48, borderRadius: '6px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>
                            +{siteContext.gallery.length - 6}
                          </div>
                        )}
                      </div>
                    )}
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      {siteContext?.gallery?.length > 0
                        ? `${siteContext.gallery.length} approved photos found for this business. Upload more or manage approval below.`
                        : 'No approved gallery photos yet for this business. Upload and approve photos below.'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/jana/businesses/${businessInfo.id}/orchestrate?tab=CONTENT&section=sec_gallery`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#0f172a', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-cloud-arrow-up" /> Upload &amp; Approve Photos
                      </Link>
                      <Link href={`/jana/content?businessId=${businessInfo.id}`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#D4AF37', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-photo-film" /> Media Studio
                      </Link>
                    </div>
                  </div>
                )}

                {/* vendor_services → Services / Amenities section in business content */}
                {selectedComp.type === 'vendor_services' && businessInfo?.id && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#075985', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      <i className="fas fa-concierge-bell" style={{ marginRight: '6px', color: '#0284c7' }} />
                      MANAGE SERVICES FOR: {(businessInfo?.name || selectedSlug).toUpperCase()}
                    </div>
                    {siteContext?.services?.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {siteContext.services.slice(0, 5).map((svc: string, i: number) => (
                          <span key={i} style={{ padding: '3px 10px', borderRadius: '50px', background: '#e0f2fe', color: '#075985', fontSize: '0.68rem', fontWeight: 700 }}>{svc}</span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: '0.72rem', color: '#0369a1', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      {siteContext?.services?.length > 0
                        ? `${siteContext.services.length} services/amenities found. Edit them in the CONTENT tab.`
                        : 'No services defined yet. Add them via the business identity/amenities section below.'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/jana/businesses/${businessInfo.id}/orchestrate?tab=CONTENT&section=sec_1_identity`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#0284c7', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-list-check" /> Edit Services &amp; Amenities
                      </Link>
                      <Link href={`/jana/vendor-services?businessId=${businessInfo.id}`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#075985', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-concierge-bell" /> Vendor Services Manager
                      </Link>
                    </div>
                  </div>
                )}

                {/* vendor_packages → Tour packages for this specific business */}
                {selectedComp.type === 'vendor_packages' && businessInfo?.id && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#065f46', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      <i className="fas fa-box-open" style={{ marginRight: '6px', color: '#059669' }} />
                      PACKAGES FOR: {(businessInfo?.name || selectedSlug).toUpperCase()}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#047857', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      {siteContext?.products?.length > 0
                        ? `${siteContext.products.length} active packages/tours found for this business. In Replace mode they auto-display.`
                        : 'No active packages yet for this business. Create them in the Commercial tab.'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/jana/businesses/${businessInfo.id}/orchestrate?tab=COMMERCIAL`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#059669', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-compass" /> Manage Packages &amp; Tours
                      </Link>
                      <Link href={`/admin/packages?businessId=${businessInfo.id}`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#065f46', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-plus" /> Create New Package
                      </Link>
                    </div>
                  </div>
                )}

                {/* vendor_blog → Blog content for this specific business */}
                {selectedComp.type === 'vendor_blog' && businessInfo?.id && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1e40af', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      <i className="fas fa-newspaper" style={{ marginRight: '6px', color: '#2563eb' }} />
                      BLOG POSTS FOR: {(businessInfo?.name || selectedSlug).toUpperCase()}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#1d4ed8', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      {siteContext?.blogs?.length > 0
                        ? `${siteContext.blogs.length} published posts found. In Replace mode they auto-display on the minisite.`
                        : 'No published blog posts yet. Write and attach posts to this business below.'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/jana/blog/editor?target_type=business_minisite&businessId=${businessInfo.id}&slug=${selectedSlug}`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#2563eb', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-feather-pointed" /> Write New Post
                      </Link>
                      <Link href={`/jana/businesses/${businessInfo.id}/orchestrate?tab=CONTENT`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#1e40af', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-list" /> View All Posts
                      </Link>
                    </div>
                  </div>
                )}

                {/* vendor_carousel → Hero carousel management for this specific business */}
                {selectedComp.type === 'vendor_carousel' && businessInfo?.id && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#fdf2f8', border: '1px solid #fbcfe8', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#9d174d', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      <i className="fas fa-film" style={{ marginRight: '6px', color: '#ec4899' }} />
                      HERO CAROUSEL FOR: {(businessInfo?.name || selectedSlug).toUpperCase()}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#db2777', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      This carousel is isolated to <strong>minisite_{selectedSlug}_hero</strong>. Slides managed separately per business — no cross-business data mixing.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/jana/hero-carousel?carouselName=minisite_${selectedSlug}_hero`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#ec4899', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-images" /> Manage Carousel Slides
                      </Link>
                      <Link href={`/vendor/social-toolkit?slug=${selectedSlug}`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '8px', background: '#9d174d', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                        <i className="fas fa-video" /> Sync Reels &amp; Videos
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem' }}>
                Minisite Style & Canvas Settings
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                    Primary Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={siteSettings.primary_color || '#D4AF37'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, primary_color: e.target.value })}
                      style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                    />
                    <input
                      type="text"
                      value={siteSettings.primary_color || '#D4AF37'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, primary_color: e.target.value })}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                    Background Tone
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={siteSettings.bg_color || '#090e17'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, bg_color: e.target.value })}
                      style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                    />
                    <input
                      type="text"
                      value={siteSettings.bg_color || '#090e17'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, bg_color: e.target.value })}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={siteSettings.show_platform_nav !== false}
                      onChange={(e) => setSiteSettings({ ...siteSettings, show_platform_nav: e.target.checked })}
                    />
                    Show Siwify Registry Top Bar
                  </label>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={siteSettings.show_platform_footer !== false}
                      onChange={(e) => setSiteSettings({ ...siteSettings, show_platform_footer: e.target.checked })}
                    />
                    Show Platform Registry Footer
                  </label>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── GOVERNANCE MATRIX MODAL ────────────────── */}
      {showGovernanceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: 780,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Tier Component Governance Matrix
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Admin regulates which components are permissible for each subscription tier.
                </p>
              </div>
              <button
                onClick={() => setShowGovernanceModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Component</th>
                    {(['free', 'standard', 'premium', 'admin'] as MinisiteTier[]).map((t) => (
                      <th key={t} style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(COMPONENT_META) as MinisiteComponentType[]).map((type) => (
                    <tr key={type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                        <i className={`fas ${COMPONENT_META[type].icon}`} style={{ marginRight: '0.5rem', color: '#D4AF37' }} />
                        {COMPONENT_META[type].label}
                      </td>
                      {(['free', 'standard', 'premium', 'admin'] as MinisiteTier[]).map((tier) => {
                        const isChecked = governanceRules[tier]?.includes(type);
                        return (
                          <td key={tier} style={{ padding: '0.75rem' }}>
                            <input
                              type="checkbox"
                              checked={isChecked || false}
                              onChange={(e) => {
                                const current = governanceRules[tier] || [];
                                const updated = e.target.checked
                                  ? [...current, type]
                                  : current.filter((x) => x !== type);
                                setGovernanceRules({ ...governanceRules, [tier]: updated });
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowGovernanceModal(false)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGovernance}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Save Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
