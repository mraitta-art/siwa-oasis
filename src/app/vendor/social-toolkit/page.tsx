'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SocialVideoImporter from '@/components/SocialVideoImporter';
import SocialStoryCardGenerator from '@/components/SocialStoryCardGenerator';
import { useLang } from '@/context/LangContext';

interface BusinessInfo {
  id: string;
  slug: string;
  name: string;
  type_name?: string;
  logo?: string;
  hero_image?: string;
  tagline?: string;
  whatsapp?: string;
}

function SocialToolkitContent() {
  const searchParams = useSearchParams();
  const querySlug = searchParams.get('slug') || searchParams.get('businessSlug');
  const queryBizId = searchParams.get('businessId');

  const { lang, setLang } = useLang();
  const isRTL = lang === 'ar';

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'story' | 'whatsapp'>('all');
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // WhatsApp helper
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    // Listen for PWA beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        isRTL
          ? 'لتثبيت التطبيق على جهازك:\n• في متصفح كروم/إيدج: اضغط على أيقونة التثبيت في شريط العنوان (Install App).\n• في آيفون (سفاري): اضغط زر المشاركة (Share) ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
          : 'To install the app:\n• On Chrome/Edge: Click the Install icon in the address bar.\n• On iPhone (Safari): Tap Share and select "Add to Home Screen".'
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    loadBusiness();
  }, [querySlug, queryBizId]);

  async function loadBusiness() {
    try {
      setLoading(true);
      // 1. Try vendor story first
      const res = await fetch('/api/vendor/story');
      if (res.ok) {
        const data = await res.json();
        const biz = data.business || {};
        const customData = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data || '{}') : (biz.custom_data || {});
        
        // Find hero image from gallery if available
        let foundHero = '';
        if (data.structure) {
          for (const s of data.structure) {
            const secData = customData[s.id];
            if (secData?.section_gallery && Array.isArray(secData.section_gallery) && secData.section_gallery.length > 0) {
              const item = secData.section_gallery[0];
              foundHero = typeof item === 'object' ? item.url : item;
              break;
            }
          }
        }

        setBusiness({
          id: biz.id || queryBizId || 'siwa-retreats',
          slug: biz.slug || querySlug || 'siwa-retreats',
          name: biz.name || 'Siwa Oasis Partner',
          type_name: biz.type_name || customData.category || 'Desert Retreat',
          logo: customData.logo || customData.basic?.logo || undefined,
          hero_image: foundHero || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
          tagline: customData.tagline || customData.basic?.tagline || 'Experience Authentic Siwa',
          whatsapp: customData.whatsapp || customData.basic?.whatsapp || biz.phone || '+201000000000',
        });
      } else {
        // Fallback default
        setBusiness({
          id: queryBizId || 'biz_siwa_retreats',
          slug: querySlug || 'siwa-retreats',
          name: 'Siwa Retreats & Safari',
          type_name: 'Luxury Eco-Lodge & Experiences',
          hero_image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
          tagline: 'Authentic Luxury in Egypt\'s Desert Oasis',
          whatsapp: '+201000000000',
        });
      }
    } catch {
      setBusiness({
        id: queryBizId || 'biz_siwa_retreats',
        slug: querySlug || 'siwa-retreats',
        name: 'Siwa Oasis Partner',
        type_name: 'Oasis Business',
        hero_image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
        tagline: 'Explore Siwa Oasis',
      });
    } finally {
      setLoading(false);
    }
  }

  const effectiveSlug = business?.slug || 'siwa-retreats';
  const vanityUrl = `https://siwify.com/${effectiveSlug}`;

  const customerWhatsappMessage = isRTL
    ? `أهلاً بك! 🌴 احجز إقامتك ورحلتك مباشرة معنا في سيوة بدون عمولة عبر الرابط المباشر:\n${vanityUrl}\nنتشرف باستضافتكم وخدمتكم بكل سرور ✨`
    : `Hello! 🌴 Book your stay and desert experience directly with us in Siwa Oasis (0% platform commission):\n${vanityUrl}\nWe look forward to hosting you! ✨`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(vanityUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(customerWhatsappMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleOpenWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(customerWhatsappMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '1.5rem',
        fontFamily: isRTL ? "'Cairo', sans-serif" : "'Inter', sans-serif",
      }}
    >
      {/* TOP BAR / APP HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
            }}
          >
            📲
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              {isRTL ? 'تطبيق إدارة السوشيال ميديا ونمو الحجوزات' : 'Social Media & Growth Command App'}
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {isRTL
                ? 'أداة حصرية لأصحاب الأعمال لاستيراد الفيديوهات وتصميم بطاقات النشر'
                : 'Exclusive command center for partners to import reels & create branded story cards'}
            </div>
          </div>
        </div>

        {/* CONTROLS: LANGUAGE SWITCHER & INSTALL APP BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Language Toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setLang('ar')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '9px',
                border: 0,
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: lang === 'ar' ? '#fff' : 'transparent',
                color: lang === 'ar' ? '#0f172a' : '#64748b',
                boxShadow: lang === 'ar' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              🇸🇦 العربية
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '9px',
                border: 0,
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: lang === 'en' ? '#fff' : 'transparent',
                color: lang === 'en' ? '#0f172a' : '#64748b',
                boxShadow: lang === 'en' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              🇬🇧 English
            </button>
          </div>

          {/* Desktop/Mobile App Install Button */}
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '12px',
              background: isInstalled
                ? '#15803d'
                : 'linear-gradient(135deg, #D4AF37, #f59e0b)',
              color: isInstalled ? '#fff' : '#1a1000',
              border: 0,
              fontWeight: 900,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
            }}
          >
            <span>{isInstalled ? '✅' : '⬇️'}</span>
            <span>
              {isInstalled
                ? (isRTL ? 'التطبيق مثبت بجهازك' : 'App Installed')
                : (isRTL ? 'تثبيت التطبيق على سطح المكتب/الموبايل' : 'Install Desktop / Mobile App')}
            </span>
          </button>
        </div>
      </div>

      {/* WHATSAPP & DIRECT ACCESS BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          color: '#fff',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(6,78,59,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#25D366',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              flexShrink: 0,
            }}
          >
            <i className="fab fa-whatsapp"></i>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', marginBottom: '0.2rem' }}>
              {isRTL ? 'حزمة واتساب السريعة وروابط البايو المباشرة' : 'WhatsApp Instant Access & Bio Link Suite'}
            </div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
              {isRTL
                ? 'شارك رابطك المباشر مع العملاء عبر واتساب بنقرة واحدة لتحقيق حجوزات فورية بدون عمولة'
                : '1-Click share your direct booking link via WhatsApp to secure zero-commission reservations'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              background: '#fff',
              color: '#064e3b',
              border: 0,
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {copiedLink ? (isRTL ? '✓ تم نسخ الرابط' : '✓ Copied Link') : (isRTL ? '🔗 نسخ الرابط' : '🔗 Copy Link')}
          </button>
          <button
            type="button"
            onClick={handleCopyMessage}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {copiedMessage ? (isRTL ? '✓ تم نسخ الرسالة' : '✓ Copied Message') : (isRTL ? '📋 نسخ رسالة العملاء' : '📋 Copy Text')}
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsAppShare}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '10px',
              background: '#25D366',
              color: '#fff',
              border: 0,
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="fab fa-whatsapp"></i>
            <span>{isRTL ? 'مشاركة عبر واتساب' : 'Send on WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', labelEn: '⚡ All Growth Tools', labelAr: '⚡ جميع الأدوات' },
          { id: 'video', labelEn: '🎬 Video & Reels Importer', labelAr: '🎬 استيراد ريلز وفيديوهات' },
          { id: 'story', labelEn: '🎨 Story Card Generator', labelAr: '🎨 مصمم بطاقات السوشيال' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              border: '1.5px solid',
              borderColor: activeTab === tab.id ? '#0f172a' : '#e2e8f0',
              background: activeTab === tab.id ? '#0f172a' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {isRTL ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* MAIN TWO-COLUMN APP WORKSPACE */}
      {business && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeTab === 'all' ? 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))' : '1fr',
            gap: '1.5rem',
          }}
        >
          {/* MODULE 1: VIDEO IMPORTER */}
          {(activeTab === 'all' || activeTab === 'video') && (
            <div>
              <SocialVideoImporter
                businessId={business.id}
                businessSlug={business.slug}
                businessName={business.name}
                primaryColor="#D4AF37"
                lang={lang}
              />
            </div>
          )}

          {/* MODULE 2: STORY CARD GENERATOR */}
          {(activeTab === 'all' || activeTab === 'story') && (
            <div>
              <SocialStoryCardGenerator
                businessName={business.name}
                businessSlug={business.slug}
                businessLogo={business.logo}
                heroImage={business.hero_image}
                categoryLabel={business.type_name || (isRTL ? 'تجربة مميزة في سيوة' : 'Siwa Experience')}
                tagline={business.tagline}
                whatsappNumber={business.whatsapp}
                primaryColor="#D4AF37"
                platformName="SiWiFy.com"
                lang={lang}
              />
            </div>
          )}
        </div>
      )}

      {/* FOOTER INFO & GUIDELINES */}
      <div
        style={{
          marginTop: '2.5rem',
          padding: '1.25rem 1.5rem',
          background: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#64748b',
        }}
      >
        <div>
          <strong>{isRTL ? 'نصيحة للمحافظة على أقصى وصول:' : 'Pro Growth Tip:'}</strong>{' '}
          {isRTL
            ? 'احرص على تثبيت رابط موقعك المصغر في البايو على تيك توك وإنستغرام، واستخدم كود UTM لمعرفة مصدر كل زائر وحجز.'
            : 'Pin your minisite link in your TikTok & Instagram bios, and review your visitor analytics to identify your highest-converting channels.'}
        </div>
        <Link
          href={`/${effectiveSlug}`}
          target="_blank"
          style={{
            fontWeight: 800,
            color: '#D4AF37',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{isRTL ? 'معاينة الموقع المصغر العام' : 'View Live Minisite'}</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

export default function VendorSocialToolkitPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          ⏳ Loading Social Growth Toolkit...
        </div>
      }
    >
      <SocialToolkitContent />
    </Suspense>
  );
}
