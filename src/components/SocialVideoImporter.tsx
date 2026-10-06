'use client';

import React, { useState } from 'react';

interface SocialVideoImporterProps {
  businessId: string;
  businessSlug?: string;
  businessName?: string;
  onImported?: (slide: any) => void;
  primaryColor?: string;
  lang?: 'en' | 'ar';
}

type Destination = 'hero_carousel' | 'section_gallery' | 'social_share';

const PLATFORM_HINTS: Record<string, { icon: string; label: string; labelAr: string; color: string; placeholder: string; placeholderAr: string }> = {
  tiktok:    { icon: '🎵', label: 'TikTok',    labelAr: 'تيك توك',   color: '#000000', placeholder: 'https://www.tiktok.com/@username/video/...', placeholderAr: 'https://www.tiktok.com/@username/video/...' },
  youtube:   { icon: '▶️', label: 'YouTube',   labelAr: 'يوتيوب',    color: '#FF0000', placeholder: 'https://youtu.be/... or youtube.com/watch?v=...', placeholderAr: 'https://youtu.be/... أو youtube.com/watch?v=...' },
  instagram: { icon: '📸', label: 'Instagram', labelAr: 'إنستغرام', color: '#E1306C', placeholder: 'https://www.instagram.com/reel/...', placeholderAr: 'https://www.instagram.com/reel/...' },
  facebook:  { icon: '📘', label: 'Facebook',  labelAr: 'فيسبوك',   color: '#1877F2', placeholder: 'https://www.facebook.com/watch?v=...', placeholderAr: 'https://www.facebook.com/watch?v=...' },
};

const I18N = {
  en: {
    title: 'Video Carousel & Social Sync',
    badge0Commission: '0% Commission Direct',
    subtitle: 'Upload from your TikTok, Instagram Reels, YouTube Shorts, or Facebook directly to your minisite.',
    placeholderDefault: 'Paste a TikTok, Instagram Reel, or YouTube link…',
    btnExtract: '⚡ Extract',
    btnExtracting: '⏳ Processing...',
    chooseDest: 'CHOOSE DESTINATION:',
    destCarousel: '🎡 Hero Carousel',
    destCarouselDesc: 'Main slideshow',
    destGallery: '📸 Section Gallery',
    destGalleryDesc: 'Media gallery',
    destShare: '📲 Social Bio Share',
    destShareDesc: 'Copy caption & link',
    bioAgreement: 'Bio Link Agreement: I agree to display my official link in my social media bio for direct customer bookings.',
    btnAddCarousel: '✅ Add to Minisite Carousel',
    btnAddGallery: '✅ Add to Gallery',
    btnCopyShare: '📋 Copy Link & Share Post',
    btnCancel: 'Cancel',
    successTitleCarousel: 'Video added to your Carousel!',
    successTitleGeneral: 'Media published successfully!',
    successSub: 'Your official link is ready for your social bio:',
    btnCopy: 'Copy',
    btnCopied: '✓ Copied',
    btnUploadAnother: '+ Upload Another Video',
    errNetwork: 'Network error — please check your connection and try again.',
    errGeneral: 'Failed to import video. Please check the URL.',
    errAction: 'Action failed. Please try again.',
  },
  ar: {
    title: 'استيراد وسائط وسلايدر الفيديو الذكي',
    badge0Commission: 'حجز مباشر بدون عمولة 0%',
    subtitle: 'استورد مقاطع الفيديو من تيك توك، ريلز إنستغرام، يوتيوب شورتس، أو فيسبوك مباشرة لموقعك المصغر.',
    placeholderDefault: 'الصق رابط تيك توك، ريلز إنستغرام، أو يوتيوب هنا...',
    btnExtract: '⚡ استخراج ومزامنة',
    btnExtracting: '⏳ جاري المعالجة...',
    chooseDest: 'اختر مكان نشر الفيديو:',
    destCarousel: '🎡 السلايدر الرئيسي (الهيرو)',
    destCarouselDesc: 'عرض الفيديو في واجهة الموقع',
    destGallery: '📸 معرض وسائط الأقسام',
    destGalleryDesc: 'إضافة لمعرض الصور والفيديو',
    destShare: '📲 مشاركة الرابط مع المنشور',
    destShareDesc: 'نسخ الرابط والوصف للنشر',
    bioAgreement: 'إقرار الرابط: أوافق على وضع الرابط الرسمي في البايو الخاص بي على منصات التواصل لحجز الزوار المباشر.',
    btnAddCarousel: '✅ إضافة إلى سلايدر الموقع',
    btnAddGallery: '✅ إضافة لمعرض الوسائط',
    btnCopyShare: '📋 نسخ الرابط ومشاركة المنشور',
    btnCancel: 'إلغاء',
    successTitleCarousel: 'تمت إضافة الفيديو بنجاح إلى السلايدر!',
    successTitleGeneral: 'تم نشر الوسائط بنجاح!',
    successSub: 'رابط موقعك الرسمي جاهز لوضعه في البايو الخاص بك:',
    btnCopy: 'نسخ',
    btnCopied: '✓ تم النسخ',
    btnUploadAnother: '+ استيراد فيديو آخر',
    errNetwork: 'خطأ في الاتصال — يرجى التحقق من الإنترنت والمحاولة مرة أخرى.',
    errGeneral: 'فشل استيراد الفيديو. يرجى التحقق من صحة الرابط.',
    errAction: 'تعذر إتمام العملية. يرجى المحاولة مرة أخرى.',
  },
};

function detectPlatformClient(url: string): string | null {
  if (!url) return null;
  const clean = url.toLowerCase();
  if (clean.includes('tiktok.com')) return 'tiktok';
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'youtube';
  if (clean.includes('instagram.com') || clean.includes('instagr.am')) return 'instagram';
  if (clean.includes('facebook.com') || clean.includes('fb.watch')) return 'facebook';
  if (clean.includes('vimeo.com')) return 'vimeo';
  return null;
}

export default function SocialVideoImporter({
  businessId,
  businessSlug,
  businessName,
  onImported,
  primaryColor = '#D4AF37',
  lang = 'en',
}: SocialVideoImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [destination, setDestination] = useState<Destination>('hero_carousel');
  const [agreedToBioLink, setAgreedToBioLink] = useState(true);
  const [copiedBio, setCopiedBio] = useState(false);

  const t = I18N[lang] || I18N.en;
  const isRTL = lang === 'ar';

  const effectiveSlug = businessSlug || businessId;
  const vanityUrl = `https://siwify.com/${effectiveSlug}`;
  const detectedPlatform = detectPlatformClient(url);
  const hint = detectedPlatform ? PLATFORM_HINTS[detectedPlatform] : null;

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setImported(false);

    try {
      const res = await fetch('/api/siwify/social-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errGeneral);
      } else {
        setResult(data);
      }
    } catch {
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDestination = async () => {
    if (!result) return;
    setLoading(true);
    setError(null);

    try {
      if (agreedToBioLink) {
        fetch('/api/jana/businesses/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            slug: effectiveSlug,
            agreedToBioLink: true,
            sourcePlatform: result.platform,
          }),
        }).catch(() => {});
      }

      if (destination === 'hero_carousel') {
        const saveRes = await fetch(`/api/jana/businesses/${encodeURIComponent(businessId)}/carousel-slide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide: result.suggested_slide,
            source_url: result.originalUrl,
            platform: result.platform,
            thumbnail: result.thumbnail,
          }),
        });

        if (!saveRes.ok) {
          const errData = await saveRes.json().catch(() => ({}));
          throw new Error(errData.error || t.errAction);
        }

        setImported(true);
        if (onImported) onImported(result.suggested_slide);
      } else if (destination === 'section_gallery') {
        const galleryRes = await fetch('/api/vendor/gallery/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            url: result.videoUrl || result.thumbnail,
            caption: result.title,
            resourceType: result.videoUrl ? 'video' : 'image',
            sectionId: 'sec_1_identity',
          }),
        });

        if (!galleryRes.ok) {
          const errData = await galleryRes.json().catch(() => ({}));
          throw new Error(errData.error || t.errAction);
        }

        setImported(true);
        if (onImported) onImported(result.suggested_slide);
      } else if (destination === 'social_share') {
        const shareText = lang === 'ar'
          ? `🌴 احجز معنا مباشرة في سيوة (${businessName || 'تجربتنا المميزة'}) بدون عمولة وسيط عبر الرابط المباشر: ${vanityUrl} #${effectiveSlug} #سيوة #مصر`
          : `🌴 Discover ${businessName || 'our experience'} in Siwa Oasis! Book directly with 0% platform commission: ${vanityUrl} #${effectiveSlug} #SiwaOasis #Egypt`;
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          setCopiedBio(true);
        }
        setImported(true);
      }
    } catch (err: any) {
      setError(err?.message || t.errAction);
    } finally {
      setLoading(false);
    }
  };

  const copyMinisiteLink = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(vanityUrl);
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 3000);
    }
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: '#fff',
        borderRadius: '20px',
        border: '1px solid #f1f5f9',
        padding: '1.5rem',
        boxSizing: 'border-box',
        maxWidth: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        textAlign: isRTL ? 'right' : 'left',
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🎬</span> {t.title}
          </h4>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '50px', background: 'rgba(212,175,55,0.12)', color: '#92400e' }}>
            {t.badge0Commission}
          </span>
        </div>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
          {t.subtitle}
        </p>
      </div>

      {/* PLATFORM BADGES */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {Object.entries(PLATFORM_HINTS).map(([key, p]) => (
          <div
            key={key}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '3px 10px', borderRadius: '50px', fontSize: '0.72rem',
              fontWeight: 800, background: '#f8fafc', border: '1px solid',
              color: detectedPlatform === key ? p.color : '#64748b',
              borderColor: detectedPlatform === key ? p.color : '#e2e8f0',
              transition: 'all 0.2s',
            }}
          >
            {p.icon} {isRTL ? p.labelAr : p.label}
          </div>
        ))}
      </div>

      {/* URL INPUT & EXTRACT BUTTON */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setResult(null); setError(null); setImported(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          placeholder={hint ? (isRTL ? hint.placeholderAr : hint.placeholder) : t.placeholderDefault}
          style={{
            flex: 1, padding: '0.75rem 1rem', borderRadius: '12px',
            border: `2px solid ${hint ? hint.color : '#e2e8f0'}`,
            fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            textAlign: isRTL ? 'right' : 'left',
          }}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !url.trim()}
          style={{
            padding: '0.75rem 1.25rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#fff', border: 0, fontWeight: 800, fontSize: '0.85rem',
            cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? t.btnExtracting : t.btnExtract}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '10px',
          background: '#fef2f2', border: '1px solid #fca5a5',
          color: '#991b1b', fontSize: '0.8rem', marginBottom: '0.75rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* RESULT & DESTINATION SELECTION */}
      {result && !imported && (
        <div style={{
          background: '#f8fafc', borderRadius: '16px',
          border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '0.85rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          {/* Card Preview */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt={result.title}
                style={{
                  width: '84px', height: '84px', borderRadius: '10px',
                  objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fff', padding: '2px 8px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 800, color: '#475569', border: '1px solid #e2e8f0', marginBottom: '0.3rem' }}>
                {result.platformIcon || '🎬'} {result.platformLabel || result.platform}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {result.title}
              </div>
              {result.author && (
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>@{result.author}</div>
              )}
            </div>
          </div>

          {/* DESTINATION SELECTOR */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              {t.chooseDest}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {[
                { id: 'hero_carousel', label: t.destCarousel, desc: t.destCarouselDesc },
                { id: 'section_gallery', label: t.destGallery, desc: t.destGalleryDesc },
                { id: 'social_share', label: t.destShare, desc: t.destShareDesc },
              ].map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => setDestination(dest.id as Destination)}
                  style={{
                    padding: '0.6rem 0.75rem', borderRadius: '10px',
                    textAlign: isRTL ? 'right' : 'left',
                    border: `2px solid ${destination === dest.id ? primaryColor : '#e2e8f0'}`,
                    background: destination === dest.id ? 'rgba(212,175,55,0.08)' : '#fff',
                    color: destination === dest.id ? '#1a1000' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{dest.label}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{dest.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 1-CLICK BIO LINK AGREEMENT CHECKBOX */}
          <div style={{
            background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          }}>
            <input
              type="checkbox"
              id="bio_agree"
              checked={agreedToBioLink}
              onChange={(e) => setAgreedToBioLink(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer', accentColor: primaryColor }}
            />
            <label htmlFor="bio_agree" style={{ fontSize: '0.76rem', color: '#334155', lineHeight: 1.4, cursor: 'pointer' }}>
              <strong>{isRTL ? 'إقرار الرابط في البايو:' : 'Bio Link Agreement:'}</strong>{' '}
              {isRTL ? (
                <>أوافق على وضع رابط موقعي المصغر الرسمي (<code>{effectiveSlug}</code>) في حساباتي على مواقع التواصل لتسهيل الحجز المباشر للزوار.</>
              ) : (
                <>I agree to display my official link (<code>{effectiveSlug}</code>) in my social media bio for direct customer bookings.</>
              )}
            </label>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleExecuteDestination}
              disabled={loading}
              style={{
                flex: 1, padding: '0.8rem', borderRadius: '10px',
                background: `linear-gradient(135deg, ${primaryColor}, #f59e0b)`,
                color: '#1a1000', border: 0, fontWeight: 900, fontSize: '0.88rem',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
              }}
            >
              {loading ? (isRTL ? 'جاري المعالجة...' : 'Processing...') : (
                destination === 'hero_carousel' ? t.btnAddCarousel :
                destination === 'section_gallery' ? t.btnAddGallery :
                t.btnCopyShare
              )}
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setUrl(''); }}
              style={{
                padding: '0.8rem 1rem', borderRadius: '10px',
                background: '#f1f5f9', color: '#475569', border: 0,
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              {t.btnCancel}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS STATE */}
      {imported && (
        <div style={{
          padding: '1rem', borderRadius: '14px', background: '#f0fdf4',
          border: '1px solid #86efac', display: 'flex', flexDirection: 'column', gap: '0.6rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🎉</span>
            <div>
              <div style={{ fontWeight: 800, color: '#14532d', fontSize: '0.88rem' }}>
                {destination === 'hero_carousel' ? t.successTitleCarousel : t.successTitleGeneral}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#16a34a' }}>
                {t.successSub}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px',
            border: '1px solid #bbf7d0',
          }}>
            <code style={{ flex: 1, fontSize: '0.78rem', color: '#14532d', fontWeight: 800, direction: 'ltr', textAlign: 'left' }}>
              {vanityUrl}
            </code>
            <button
              type="button"
              onClick={copyMinisiteLink}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '6px',
                background: '#15803d', color: '#fff', border: 0,
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
              }}
            >
              {copiedBio ? t.btnCopied : t.btnCopy}
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setImported(false); setUrl(''); setResult(null); }}
            style={{
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
              padding: '0.4rem 0.85rem', borderRadius: '8px',
              background: '#fff', border: '1px solid #86efac', color: '#14532d',
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.2rem',
            }}
          >
            {t.btnUploadAnother}
          </button>
        </div>
      )}
    </div>
  );
}
