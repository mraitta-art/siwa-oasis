'use client';

import React, { useRef, useState, useCallback } from 'react';

interface SocialStoryCardProps {
  businessName: string;
  businessSlug: string;
  businessLogo?: string;
  heroImage?: string;
  categoryLabel?: string;
  tagline?: string;
  whatsappNumber?: string;
  primaryColor?: string;
  platformName?: string;
  lang?: 'en' | 'ar';
}

type CardFormat = 'story' | 'feed' | 'landscape';

const FORMAT_SIZES: Record<CardFormat, { w: number; h: number; label: string; labelAr: string; icon: string }> = {
  story:     { w: 1080, h: 1920, label: 'Instagram / TikTok Story', labelAr: 'قصة إنستغرام / تيك توك (ستوري)', icon: '📱' },
  feed:      { w: 1080, h: 1080, label: 'Instagram / Facebook Post', labelAr: 'منشور إنستغرام / فيسبوك (مربع)', icon: '⬜' },
  landscape: { w: 1280, h: 720,  label: 'Twitter / LinkedIn Banner', labelAr: 'غلاف تويتر / لينكد إن (أفقي)', icon: '🖥️' },
};

const I18N = {
  en: {
    title: 'Social Story Card Generator',
    subtitle: 'Generate a branded card to post on Instagram, TikTok, Facebook, and Twitter',
    btnGenerating: 'Generating...',
    btnReGenerate: 'Re-Generate Card',
    btnGenerate: 'Generate Card',
    btnDownload: 'Download PNG',
    btnShare: 'Share',
    howToUseTitle: '📌 HOW TO USE YOUR CARD',
    guideStory: '① Download PNG  ② Open Instagram/TikTok  ③ Add to Story  ④ Add "Link" sticker pointing to your bio link',
    guideFeed: '① Download PNG  ② Post to Instagram Feed or Facebook Page  ③ Caption: "Book directly — link in bio 🔗"',
    guideLandscape: '① Download PNG  ② Post to Twitter/X or LinkedIn  ③ Pin the post to your profile for maximum visibility',
    readyFor: 'Ready for',
    ctaBooking: '📲 Book directly · Zero platform commission',
    ctaGeneral: '✨ Explore · Discover · Experience Siwa Oasis',
  },
  ar: {
    title: 'مولد بطاقات وقصص السوشيال ميديا (ستوري / بوست)',
    subtitle: 'صمم بطاقة تسويقية تحمل هويتك ورابط حجزك المباشر للنشر على إنستغرام، تيك توك، وفيسبوك',
    btnGenerating: 'جاري التصميم...',
    btnReGenerate: 'إعادة تصميم البطاقة',
    btnGenerate: 'تصميم البطاقة',
    btnDownload: 'تحميل الصورة PNG',
    btnShare: 'مشاركة سريعة',
    howToUseTitle: '📌 كيف تستخدم بطاقتك التسويقية بذكاء',
    guideStory: '١. حمّل الصورة  ٢. افتح إنستغرام أو تيك توك  ٣. اختر إضافة ستوري  ٤. أضف ملصق "رابط / Link" يوجه لرابط موقعك المصغر',
    guideFeed: '١. حمّل الصورة  ٢. انشرها كبوست في إنستغرام أو فيسبوك  ٣. اكتب في الوصف: "احجز مباشرة بدون عمولة — الرابط في البايو 🔗"',
    guideLandscape: '١. حمّل الصورة  ٢. انشرها على تويتر أو منصاتك  ٣. ثبّت المنشور في صفحتك لأعلى نسبة وصول وتفاعل',
    readyFor: 'جاهز لـ',
    ctaBooking: '📲 احجز مباشرة · 0% عمولة وسيط',
    ctaGeneral: '✨ استمتع باكتشاف وسحر واحة سيوة الأصيلة',
  },
};

export default function SocialStoryCardGenerator({
  businessName,
  businessSlug,
  businessLogo,
  heroImage,
  categoryLabel = 'Siwa Oasis Experience',
  tagline,
  whatsappNumber,
  primaryColor = '#D4AF37',
  platformName = 'SiWiFy.com',
  lang = 'en',
}: SocialStoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<CardFormat>('story');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const t = I18N[lang] || I18N.en;
  const isRTL = lang === 'ar';

  const vanityUrl = `${platformName.toLowerCase()}/${businessSlug}`;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
    : null;

  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setGenerating(true);
    const { w, h } = FORMAT_SIZES[format];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    // ── Background ────────────────────────────────────────────────────
    if (heroImage) {
      try {
        const bgImg = await loadImage(heroImage);
        const imgAspect = bgImg.width / bgImg.height;
        const canvasAspect = w / h;
        let sw: number, sh: number, sx: number, sy: number;
        if (imgAspect > canvasAspect) {
          sh = bgImg.height; sw = sh * canvasAspect;
          sx = (bgImg.width - sw) / 2; sy = 0;
        } else {
          sw = bgImg.width; sh = sw / canvasAspect;
          sx = 0; sy = (bgImg.height - sh) / 2;
        }
        ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, w, h);
      } catch {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Dark gradient overlay for text legibility ─────────────────────
    const overlay = ctx.createLinearGradient(0, 0, 0, h);
    overlay.addColorStop(0,   'rgba(0,0,0,0.25)');
    overlay.addColorStop(0.4, 'rgba(0,0,0,0.15)');
    overlay.addColorStop(0.7, 'rgba(0,0,0,0.65)');
    overlay.addColorStop(1,   'rgba(0,0,0,0.90)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);

    // ── Scale helper (base canvas is 1080px wide) ─────────────────────
    const sc = w / 1080;

    // ── PLATFORM BRANDING strip (top) ─────────────────────────────────
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, w, Math.round(8 * sc));

    // Platform badge top-left / top-right
    const badgePad = Math.round(32 * sc);
    const badgeFontSize = Math.round(28 * sc);
    ctx.font = `900 ${badgeFontSize}px "Cairo", "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.textAlign = isRTL ? 'right' : 'left';
    ctx.fillText(platformName.toUpperCase(), isRTL ? w - badgePad : badgePad, badgePad + badgeFontSize);
    ctx.globalAlpha = 1;

    // ── LOGO (if available) ────────────────────────────────────────────
    const logoY = format === 'story' ? h * 0.25 : h * 0.18;
    if (businessLogo) {
      try {
        const logoImg = await loadImage(businessLogo);
        const maxLogoH = Math.round(160 * sc);
        const logoAspect = logoImg.width / logoImg.height;
        const logoW = Math.min(maxLogoH * logoAspect, Math.round(380 * sc));
        const logoH = logoW / logoAspect;
        const logoX = (w - logoW) / 2;
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      } catch { /* skip logo if load fails */ }
    }

    // ── BUSINESS NAME ─────────────────────────────────────────────────
    const nameY = format === 'story' ? h * 0.72 : h * 0.62;
    const nameFontSize = Math.round(68 * sc);
    ctx.font = `900 ${nameFontSize}px "Cairo", "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = Math.round(20 * sc);

    // Wrap long names
    const maxNameWidth = w - Math.round(120 * sc);
    const words = businessName.toUpperCase().split(' ');
    let line = '';
    const nameLines: string[] = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxNameWidth && line) {
        nameLines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) nameLines.push(line);
    const lineHeight = nameFontSize * 1.15;
    nameLines.forEach((l, i) => {
      ctx.fillText(l, w / 2, nameY + i * lineHeight);
    });
    ctx.shadowBlur = 0;

    // ── CATEGORY PILL ─────────────────────────────────────────────────
    const pillY = nameY + nameLines.length * lineHeight + Math.round(20 * sc);
    const catFontSize = Math.round(26 * sc);
    ctx.font = `700 ${catFontSize}px "Cairo", Arial, sans-serif`;
    const catText = categoryLabel.toUpperCase();
    const catW = ctx.measureText(catText).width + Math.round(48 * sc);
    const catH = Math.round(50 * sc);
    const catX = (w - catW) / 2;
    ctx.fillStyle = primaryColor;
    ctx.globalAlpha = 0.95;
    
    // Rounded rect
    ctx.beginPath();
    const r = Math.round(25 * sc);
    ctx.moveTo(catX + r, pillY);
    ctx.lineTo(catX + catW - r, pillY);
    ctx.quadraticCurveTo(catX + catW, pillY, catX + catW, pillY + r);
    ctx.lineTo(catX + catW, pillY + catH - r);
    ctx.quadraticCurveTo(catX + catW, pillY + catH, catX + catW - r, pillY + catH);
    ctx.lineTo(catX + r, pillY + catH);
    ctx.quadraticCurveTo(catX, pillY + catH, catX, pillY + catH - r);
    ctx.lineTo(catX, pillY + r);
    ctx.quadraticCurveTo(catX, pillY, catX + r, pillY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1a1000';
    ctx.fillText(catText, w / 2, pillY + catFontSize + Math.round(11 * sc));

    // ── TAGLINE ───────────────────────────────────────────────────────
    if (tagline) {
      const tagY = pillY + catH + Math.round(36 * sc);
      const tagFontSize = Math.round(30 * sc);
      ctx.font = `600 ${tagFontSize}px "Cairo", Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(tagline.substring(0, 80), w / 2, tagY);
    }

    // ── BOTTOM CTA STRIP ──────────────────────────────────────────────
    const ctaStripH = Math.round(140 * sc);
    const ctaStripY = h - ctaStripH;

    // Gold strip
    ctx.fillStyle = primaryColor;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, ctaStripY, w, ctaStripH);
    ctx.globalAlpha = 1;

    // Vanity link
    const linkFontSize = Math.round(34 * sc);
    ctx.font = `900 ${linkFontSize}px "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'center';
    ctx.fillText(`🔗 ${vanityUrl}`, w / 2, ctaStripY + Math.round(55 * sc));

    // CTA text
    const ctaFontSize = Math.round(26 * sc);
    ctx.font = `700 ${ctaFontSize}px "Cairo", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const ctaLine = whatsappUrl ? t.ctaBooking : t.ctaGeneral;
    ctx.fillText(ctaLine, w / 2, ctaStripY + Math.round(100 * sc));

    // ── Bottom gold bar ───────────────────────────────────────────────
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, h - Math.round(8 * sc), w, Math.round(8 * sc));

    // Export preview
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setPreviewUrl(dataUrl);
    setGenerated(true);
    setGenerating(false);
  }, [format, businessName, businessSlug, businessLogo, heroImage, categoryLabel, tagline, whatsappNumber, primaryColor, platformName, vanityUrl, whatsappUrl, isRTL, t]);

  const downloadCard = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `siwify-${businessSlug}-${format}-card.png`;
    a.click();
  };

  const shareCard = async () => {
    if (!previewUrl) return;
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], `siwify-${businessSlug}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${businessName} on SiWiFy.com`,
          text: isRTL ? `احجز معنا مباشرة في سيوة عبر الرابط: https://${vanityUrl}` : `Book directly at https://${vanityUrl}`,
          files: [file],
        });
      } else {
        downloadCard();
      }
    } catch {
      downloadCard();
    }
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        padding: '2rem',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
        maxWidth: '100%',
        boxSizing: 'border-box',
        textAlign: isRTL ? 'right' : 'left',
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(212,175,55,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
            flexShrink: 0,
          }}>🎨</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
              {t.title}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
              {t.subtitle}
            </div>
          </div>
        </div>
      </div>

      {/* FORMAT SELECTOR */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(Object.entries(FORMAT_SIZES) as [CardFormat, typeof FORMAT_SIZES[CardFormat]][]).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setFormat(key); setGenerated(false); setPreviewUrl(null); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', borderRadius: '10px', border: '2px solid',
              borderColor: format === key ? primaryColor : '#e2e8f0',
              background: format === key ? 'rgba(212,175,55,0.1)' : '#fafbfc',
              color: format === key ? '#1a1000' : '#64748b',
              fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>{meta.icon}</span>
            <span>{isRTL ? meta.labelAr : meta.label}</span>
          </button>
        ))}
      </div>

      {/* CANVAS (hidden — used for rendering) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* PREVIEW */}
      {previewUrl && (
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <img
            src={previewUrl}
            alt="Social Card Preview"
            style={{
              maxWidth: '100%',
              maxHeight: format === 'story' ? '500px' : '300px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              objectFit: 'contain'
            }}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
            {FORMAT_SIZES[format].w} × {FORMAT_SIZES[format].h}px — {t.readyFor} {isRTL ? FORMAT_SIZES[format].labelAr : FORMAT_SIZES[format].label}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={drawCard}
          disabled={generating}
          style={{
            flex: 1, minWidth: '160px', padding: '0.85rem 1.25rem',
            borderRadius: '12px', background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#fff', border: 0, fontWeight: 800, fontSize: '0.88rem',
            cursor: generating ? 'wait' : 'pointer',
            boxShadow: '0 4px 14px rgba(15,23,42,0.18)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          <span>🎨</span>
          <span>{generating ? t.btnGenerating : generated ? t.btnReGenerate : t.btnGenerate}</span>
        </button>

        {generated && previewUrl && (
          <>
            <button
              type="button"
              onClick={downloadCard}
              style={{
                padding: '0.85rem 1.25rem', borderRadius: '12px',
                background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                color: '#1a1000', border: 0, fontWeight: 800, fontSize: '0.88rem',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <span>⬇️</span>
              <span>{t.btnDownload}</span>
            </button>

            <button
              type="button"
              onClick={shareCard}
              style={{
                padding: '0.85rem 1.1rem', borderRadius: '12px',
                background: '#fff', color: '#1e293b',
                border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.88rem',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <span>📤</span>
              <span>{t.btnShare}</span>
            </button>
          </>
        )}
      </div>

      {/* PLATFORM GUIDE */}
      <div style={{
        marginTop: '1.25rem', padding: '0.85rem 1rem',
        background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9'
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
          {t.howToUseTitle}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
          {format === 'story' && t.guideStory}
          {format === 'feed' && t.guideFeed}
          {format === 'landscape' && t.guideLandscape}
        </div>
      </div>
    </div>
  );
}
