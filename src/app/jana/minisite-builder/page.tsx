'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  COMPONENT_META,
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

  // Load business list
  useEffect(() => {
    fetch('/api/jana/businesses')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBusinesses(list);
        if (!selectedSlug && list.length > 0) {
          setSelectedSlug(list[0].slug || list[0].id);
        }
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

  // Load layout and governance when selected business changes
  useEffect(() => {
    if (!selectedSlug) return;
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
          setMode(data.layout.mode || 'replace');
          setComponents(data.layout.components || []);
          setSiteSettings(data.layout.site_settings || {});
        } else {
          // Default initial layout tailored to THIS business's data
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
  const handleDeleteLayout = async () => {
    if (!selectedSlug) return;
    if (
      !confirm(
        'Are you sure you want to delete this custom layout? The business minisite will immediately revert to the automatic section system.'
      )
    )
      return;

    try {
      const res = await fetch(`/api/jana/minisite-layout?slug=${selectedSlug}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      alert('Minisite reverted to default section architecture.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const selectedComp = components.find((c) => c.id === selectedCompId);
  const liveUrl = businessInfo?.slug ? `/${businessInfo.slug}` : `/`;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#fef3c7',
                color: '#b45309',
                fontWeight: 800,
              }}
            >
              ADMIN ONLY
            </span>
          </div>
          <h1 style={{ margin: '0.2rem 0', fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
            Minisite Architect & Builder
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
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'capitalize' }}>
                        {meta.tier} Tier
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
                onClick={handleDeleteLayout}
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
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Type: <code>{comp.type}</code>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Block Properties
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800 }}>
                  {selectedComp.type}
                </span>
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

                {/* Contextual Bridge: Blog Post Studio */}
                {selectedComp.type === 'vendor_blog' && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e40af', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-newspaper" style={{ color: '#2563eb' }} />
                      {lang === 'ar' ? 'إدارة ونشر مقالات هذا النشاط' : 'Manage & Write Blog Posts'}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#3b82f6', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      {lang === 'ar'
                        ? 'يمكنك كتابة مقال ونشره مباشرة ليكون مربوطاً بهذا النشاط وقسمه المحدد عبر محرر المقالات الموحد.'
                        : 'Write and publish rich articles directly attached to this business and section via the unified blog editor.'}
                    </p>
                    <Link
                      href={`/jana/blog/editor?target_type=business_minisite&businessId=${businessInfo?.id || ''}&sectionId=sec_1_identity`}
                      target="_blank"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      <i className="fas fa-feather-pointed" />
                      {lang === 'ar' ? 'فتح محرر المقالات' : 'Launch Blog Editor'}
                    </Link>
                  </div>
                )}

                {/* Contextual Bridge: Reels / Video Sync */}
                {selectedComp.type === 'vendor_carousel' && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#fdf2f8', border: '1px solid #fbcfe8', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9d174d', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-film" style={{ color: '#ec4899' }} />
                      {lang === 'ar' ? 'مزامنة فيديوهات وريلز السوشيال' : 'Sync Reels & Videos'}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#db2777', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      {lang === 'ar'
                        ? 'استورد فيديوهات إنستجرام وتيك توك وربطها بسلايدر الهيرو أو المعرض لهذا النشاط.'
                        : 'Import Instagram and TikTok videos directly into this business carousel & gallery.'}
                    </p>
                    <Link
                      href={`/vendor/social-toolkit?slug=${selectedSlug}`}
                      target="_blank"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        background: '#ec4899',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      <i className="fas fa-video" />
                      {lang === 'ar' ? 'فتح أدوات السوشيال' : 'Launch Social Toolkit'}
                    </Link>
                  </div>
                )}

                {/* Contextual Bridge: Packages */}
                {selectedComp.type === 'vendor_packages' && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065f46', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-box-open" style={{ color: '#059669' }} />
                      {lang === 'ar' ? 'باقات وتجارب الجولات' : 'Tour & Package Studio'}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#047857', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      {lang === 'ar'
                        ? 'إدارة باقات التجارب السياحية والأسعار وخيارات الحجز.'
                        : 'Manage tour packages, pricing tiers, and booking options.'}
                    </p>
                    <Link
                      href="/vendor/packages"
                      target="_blank"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        background: '#059669',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      <i className="fas fa-compass" />
                      {lang === 'ar' ? 'فتح استوديو الباقات' : 'Open Package Studio'}
                    </Link>
                  </div>
                )}

                {/* Contextual Bridge: Gallery */}
                {selectedComp.type === 'vendor_gallery' && (
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-images" style={{ color: '#D4AF37' }} />
                      {lang === 'ar' ? 'معرض صور النشاط' : 'Business Gallery & Media'}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      {lang === 'ar'
                        ? 'رفع وإدارة الصور والفيديوهات في معرض النشاط.'
                        : 'Upload and approve media items displayed in this gallery block.'}
                    </p>
                    <Link
                      href={`/vendor/social-toolkit?slug=${selectedSlug}`}
                      target="_blank"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        background: '#334155',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      <i className="fas fa-cloud-arrow-up" />
                      {lang === 'ar' ? 'إدارة الوسائط' : 'Manage Media'}
                    </Link>
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
