'use client';

import React, { useState, useEffect } from 'react';
import { MobileAdConfig } from '@/app/api/jana/mobile-ads/route';

interface MobileDashboardAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const PRESETS: { label: string; config: Partial<MobileAdConfig> }[] = [
  {
    label: '📢 إعلان المنصة وتصدر الدليل (الافتراضي)',
    config: {
      enabled: true,
      badgeAr: 'إعلان المنصة الرسمي',
      badgeEn: 'OFFICIAL PLATFORM NOTICE',
      icon: '📢',
      titleAr: 'فرصتك الحصرية لتصدر نتائج رحلات سيوة والخرائط الرقمية 🌴',
      titleEn: 'Exclusive Opportunity: Top #1 Ranking on Siwa Trips & Maps 🌴',
      descAr: 'عملاؤك وزوار سيوة يبحثون عنك الآن! حافظ على سرعة الرد عبر واتساب، وحدّث صور مركبتك/خدمتك باستمرار لتصلك حجوزات أكثر مباشرة وبدون أي عمولة.',
      descEn: 'Guests are discovering Siwa right now! Reply promptly on WhatsApp and keep your service photos updated to maximize direct, commission-free bookings.',
      ctaTextAr: 'تواصل مع إدارة المنصة',
      ctaTextEn: 'Contact Support',
      whatsappNumber: '201000000000',
    },
  },
  {
    label: '🔥 افتتاح الموسم السياحي وحملة الشتاء',
    config: {
      enabled: true,
      badgeAr: 'موسم سيوة الذهبي 2026',
      badgeEn: 'SIWA GOLDEN SEASON 2026',
      icon: '🔥',
      titleAr: 'الموسم السياحي بدأ! جهّز أسعارك واملأ جدول رحلاتك ⛺🌄',
      titleEn: 'The Season is Here! Set Your Rates & Fill Your Schedule ⛺🌄',
      descAr: 'الآلاف من زوار سيوة ومجموعات التخييم والسفاري يحجزون رحلاتهم الآن. تأكد من تحديث أسعارك وتوافرك من هاتفك فوراً.',
      descEn: 'Thousands of desert safari and camp lovers are booking right now. Update your seasonal rates and availability directly from your phone.',
      ctaTextAr: 'ترقية الحساب وحملات الترويج',
      ctaTextEn: 'Promote Your Business',
      whatsappNumber: '201000000000',
    },
  },
  {
    label: '⭐ تنبيه تحديث الصور والأسعار (عمولة 0%)',
    config: {
      enabled: true,
      badgeAr: 'نصيحة نجاح الشركاء',
      badgeEn: 'PARTNER SUCCESS TIP',
      icon: '⭐',
      titleAr: 'أضف صورك الحديثة لتحصل على حجز مباشر أسرع 📸',
      titleEn: 'Upload Fresh Photos For 3x More Direct Bookings 📸',
      descAr: 'الزوار يفضلون السيارات والفنادق التي تعرض صوراً واضحة وجذابة. احرص على وضع صور نظافة المركبة وجودة الخدمة.',
      descEn: 'Guests strongly prefer profiles with clear real photos. Ensure your service looks pristine and ready.',
      ctaTextAr: 'طلب مساعدة في التصوير والصفحة',
      ctaTextEn: 'Request Media Support',
      whatsappNumber: '201000000000',
    },
  },
];

export default function MobileDashboardAdsModal({ isOpen, onClose, onSaved }: MobileDashboardAdsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');

  const [form, setForm] = useState<MobileAdConfig>({
    enabled: true,
    badgeAr: 'إعلان المنصة الرسمي',
    badgeEn: 'OFFICIAL PLATFORM NOTICE',
    titleAr: 'فرصتك الحصرية لتصدر نتائج رحلات سيوة والخرائط الرقمية 🌴',
    titleEn: 'Exclusive Opportunity: Top #1 Ranking on Siwa Trips & Maps 🌴',
    descAr: 'عملاؤك وزوار سيوة يبحثون عنك الآن! حافظ على سرعة الرد عبر واتساب، وحدّث صور مركبتك/خدمتك باستمرار لتصلك حجوزات أكثر مباشرة وبدون أي عمولة.',
    descEn: 'Guests are discovering Siwa right now! Reply promptly on WhatsApp and keep your service photos updated to maximize direct, commission-free bookings.',
    ctaTextAr: 'تواصل مع إدارة المنصة',
    ctaTextEn: 'Contact Support',
    ctaLink: '',
    icon: '📢',
    whatsappNumber: '201000000000',
  });

  useEffect(() => {
    if (isOpen) {
      loadAdConfig();
    }
  }, [isOpen]);

  async function loadAdConfig() {
    try {
      setLoading(true);
      const res = await fetch('/api/jana/mobile-ads');
      if (res.ok) {
        const data = await res.json();
        if (data.ad) {
          setForm(data.ad);
        }
      }
    } catch (e) {
      console.error('Failed to load mobile ad config', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch('/api/jana/mobile-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad: form }),
      });
      if (res.ok) {
        alert('✅ تم حفظ وتحديث إعلان وتنبيهات تطبيق الموبايل بنجاح!');
        if (onSaved) onSaved();
        onClose();
      } else {
        const err = await res.json();
        alert(`❌ فشل الحفظ: ${err.error || 'حدث خطأ'}`);
      }
    } catch (e: any) {
      alert(`❌ خطأ في الاتصال: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    setForm(prev => ({ ...prev, ...preset.config }));
  }

  if (!isOpen) return null;

  const isRTL = previewLang === 'ar';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#fff',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          borderRadius: '24px',
          border: '1px solid rgba(212,175,55,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(15,23,42,0.9))',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>
              MOBILE COMMAND DASHBOARD · BANNERS &amp; BROADCAST ADS
            </div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
              📢 إدارة إعلانات وبانرات لوحة تحكم الموبايل للشركاء
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              تظهر هذه البانرات مباشرة في أعلى داشبورد الشريك على الهاتف (/jana/businesses/[id]/mobile)
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 0,
              color: '#fff',
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* TOP CONTROLS & PRESETS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#1e293b', padding: '1rem 1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 900, fontSize: '0.9rem', color: form.enabled ? '#4ade80' : '#94a3b8' }}>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm(prev => ({ ...prev, enabled: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#D4AF37', cursor: 'pointer' }}
                />
                <span>{form.enabled ? '🟢 البانر مفعّل وظاهر في التطبيق' : '⚪ البانر معطّل ومخفي'}</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>نماذج سريعة:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#D4AF37',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* LIVE VISUAL PREVIEW ON MOBILE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#D4AF37' }}>
                📱 معاينة حية ومباشرة في واجهة الموبايل (Live Dashboard Preview):
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setPreviewLang('ar')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: 0,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: previewLang === 'ar' ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                    color: previewLang === 'ar' ? '#0f172a' : '#cbd5e1',
                  }}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang('en')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: 0,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: previewLang === 'en' ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                    color: previewLang === 'en' ? '#0f172a' : '#cbd5e1',
                  }}
                >
                  English
                </button>
              </div>
            </div>

            <div
              dir={isRTL ? 'rtl' : 'ltr'}
              style={{
                padding: '1.2rem',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(99,102,241,0.12) 100%)',
                border: '1.5px solid rgba(212,175,55,0.35)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(212,175,55,0.3)',
                }}>
                  {form.icon || '📢'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, background: '#D4AF37', color: '#0a0f1e', padding: '1px 6px', borderRadius: '6px', letterSpacing: '0.8px' }}>
                      {isRTL ? (form.badgeAr || 'إعلان المنصة الرسمي') : (form.badgeEn || 'OFFICIAL NOTICE')}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 700 }}>
                      SiWiFy.com
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: '4px' }}>
                    {isRTL ? (form.titleAr || 'عنوان الإعلان') : (form.titleEn || 'Notice Title')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {isRTL ? (form.descAr || 'تفاصيل الإعلان...') : (form.descEn || 'Notice details...')}
                  </div>
                  <div>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.4rem 0.85rem', borderRadius: '10px',
                        background: '#25D366', color: '#0a0f1e',
                        fontSize: '0.68rem', fontWeight: 900, textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                      }}
                    >
                      <i className="fab fa-whatsapp" style={{ fontSize: '0.8rem' }} />
                      {isRTL ? (form.ctaTextAr || 'تواصل معنا') : (form.ctaTextEn || 'Contact Us')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FORM FIELDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
            {/* ARABIC COLUMN */}
            <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🇸🇦</span>
                <span>بيانات الإعلان باللغة العربية:</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>شارة التنبيه (Badge):</label>
                <input
                  type="text"
                  value={form.badgeAr}
                  onChange={(e) => setForm(prev => ({ ...prev, badgeAr: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>العنوان الرئيسي (Title):</label>
                <input
                  type="text"
                  value={form.titleAr}
                  onChange={(e) => setForm(prev => ({ ...prev, titleAr: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>النص التوضيحي (Description):</label>
                <textarea
                  value={form.descAr}
                  onChange={(e) => setForm(prev => ({ ...prev, descAr: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>نص زر الإجراء (CTA Button Text):</label>
                <input
                  type="text"
                  value={form.ctaTextAr}
                  onChange={(e) => setForm(prev => ({ ...prev, ctaTextAr: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* ENGLISH COLUMN */}
            <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🇬🇧</span>
                <span>English Broadcast Details:</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Badge Text:</label>
                <input
                  type="text"
                  value={form.badgeEn}
                  onChange={(e) => setForm(prev => ({ ...prev, badgeEn: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Title:</label>
                <input
                  type="text"
                  value={form.titleEn}
                  onChange={(e) => setForm(prev => ({ ...prev, titleEn: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Description:</label>
                <textarea
                  value={form.descEn}
                  onChange={(e) => setForm(prev => ({ ...prev, descEn: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>CTA Button Text:</label>
                <input
                  type="text"
                  value={form.ctaTextEn}
                  onChange={(e) => setForm(prev => ({ ...prev, ctaTextEn: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* SHARED SETTINGS: ICON, WHATSAPP & CTA LINK */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: '#1e293b', padding: '1.25rem', borderRadius: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                أيقونة الإعلان (Icon Emoji):
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {['📢', '⭐', '🔥', '🌴', '🚀', '🎯', '💡'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, icon: emoji }))}
                    style={{
                      width: 32, height: 32, borderRadius: '8px',
                      background: form.icon === emoji ? '#D4AF37' : '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer', fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                رقم واتساب الإدارة / الدعم:
              </label>
              <input
                type="text"
                value={form.whatsappNumber}
                onChange={(e) => setForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                placeholder="201000000000"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                رابط مخصص بديل (اختياري):
              </label>
              <input
                type="text"
                value={form.ctaLink}
                onChange={(e) => setForm(prev => ({ ...prev, ctaLink: e.target.value }))}
                placeholder="https://siwify.com/... (فارغ = واتساب تلقائي)"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(15,23,42,0.95)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)',
              color: '#cbd5e1',
              border: 0,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.65rem 1.75rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
              color: '#0f172a',
              border: 0,
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
            }}
          >
            {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ وتحديث الإعلان الآن'}
          </button>
        </div>
      </div>
    </div>
  );
}
