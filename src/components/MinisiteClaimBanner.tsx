'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface MinisiteClaimBannerProps {
  businessId: string;
  businessName: string;
  slug: string;
  initialClaimed?: boolean;
  primaryColor?: string;
}

export default function MinisiteClaimBanner({
  businessId,
  businessName,
  slug,
  initialClaimed = false,
  primaryColor = '#D4AF37',
}: MinisiteClaimBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClaimed, setIsClaimed] = useState(initialClaimed);
  const [loading, setLoading] = useState(false);
  const [vendorPhone, setVendorPhone] = useState('');
  const [agreeBio, setAgreeBio] = useState(true);
  const [agreeSocial, setAgreeSocial] = useState(true);
  const [successData, setSuccessData] = useState<any>(null);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('claim') === '1' || urlParams.get('preview') === 'claim') {
      setIsOpen(true);
    }
  }, []);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/businesses/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          slug,
          vendorPhone,
          agreeBioLink: agreeBio,
          agreeSocialSync: agreeSocial,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsClaimed(true);
        setSuccessData(data);
      } else {
        alert(data.error || (lang === 'ar' ? 'فشل تأكيد ملكية الموقع المصغر.' : 'Failed to claim minisite.'));
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'خطأ في الاتصال بالخادم.' : 'Network error claiming minisite.');
    } finally {
      setLoading(false);
    }
  };

  const isRTL = lang === 'ar';
  const mobileDashboardUrl = `/jana/businesses/${businessId}/mobile`;
  const claimPageUrl = `/vendor/claim?slug=${slug}`;
  const socialToolkitUrl = `/vendor/social-toolkit?slug=${slug}`;

  return (
    <>
      {/* ── TOP STICKY OFFICIAL SIWIFY RIBBON ── */}
      <aside
        aria-label="Official Siwify Partner Ribbon"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: isClaimed
            ? 'linear-gradient(90deg, #064e3b 0%, #065f46 50%, #022c22 100%)'
            : 'linear-gradient(90deg, #0a0f1e 0%, #1e1b4b 50%, #0a0f1e 100%)',
          borderBottom: `2px solid ${isClaimed ? '#34d399' : primaryColor}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          fontFamily: isRTL ? "'Noto Sans Arabic', 'Inter', sans-serif" : "'Inter', sans-serif",
          color: '#fff',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: isCollapsed ? '0.35rem 1rem' : '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem',
          }}
        >
          {/* RIBBON LEFT / MAIN MESSAGE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: '1 1 320px', minWidth: 0 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                background: isClaimed ? '#10b981' : 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {isClaimed ? '✓' : '👑'}
            </span>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    background: isClaimed ? 'rgba(52,211,153,0.2)' : 'rgba(212,175,55,0.2)',
                    color: isClaimed ? '#6ee7b7' : '#F5E6AD',
                    border: `1px solid ${isClaimed ? 'rgba(52,211,153,0.4)' : 'rgba(212,175,55,0.4)'}`,
                    padding: '1px 6px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {isClaimed
                    ? (isRTL ? 'شريك معتمد وموثق' : 'VERIFIED PARTNER')
                    : (isRTL ? 'موقعك الرسمي على SiWiFy' : 'OFFICIAL MINISITE')}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
                  SiWiFy.com
                </span>
              </div>

              {!isCollapsed && (
                <div style={{ fontSize: '0.78rem', color: '#f1f5f9', fontWeight: 700, marginTop: '2px', lineHeight: 1.35 }}>
                  {isClaimed ? (
                    isRTL ? (
                      <>
                        هذا الموقع موثق رسمياً لـ <strong>{businessName}</strong> — حجوزات مباشرة 100% بدون وسيط أو عمولة.
                      </>
                    ) : (
                      <>
                        Officially verified portal for <strong>{businessName}</strong> — 0% Commission Direct Bookings.
                      </>
                    )
                  ) : (
                    isRTL ? (
                      <>
                        هل أنت صاحب نشاط <strong>{businessName}</strong>؟ تم تجهيز هذا الموقع مجاناً من أجلك. أكّد ملكيتك للتحكم بأسعارك وبياناتك فوراً.
                      </>
                    ) : (
                      <>
                        Are you the owner of <strong>{businessName}</strong>? Claim your free pre-configured minisite to manage rates &amp; trips.
                      </>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIBBON RIGHT / ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* CLAIM BUTTON (IF UNCLAIMED) */}
            {!isClaimed && (
              <>
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  style={{
                    padding: '0.42rem 0.95rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                    color: '#0a0f1e',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    border: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 10px rgba(212,175,55,0.3)',
                  }}
                >
                  <span>🔑</span>
                  <span>{isRTL ? 'تأكيد واعتماد الملكية (مجاناً)' : 'Claim Profile (Free)'}</span>
                </button>

                <Link
                  href={mobileDashboardUrl}
                  style={{
                    padding: '0.42rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>📲</span>
                  <span>{isRTL ? 'إدارة الأسعار من الموبايل' : 'Mobile Trips Hub'}</span>
                </Link>
              </>
            )}

            {/* IF CLAIMED: DIRECT SHORTCUTS TO MANAGEMENT */}
            {isClaimed && (
              <>
                <Link
                  href={mobileDashboardUrl}
                  style={{
                    padding: '0.42rem 0.9rem',
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#0a0f1e',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                  }}
                >
                  <span>⚙️</span>
                  <span>{isRTL ? 'لوحة تحكم الهاتف (تعديل الأسعار)' : 'Manage Rates & Trips'}</span>
                </Link>

                <Link
                  href={socialToolkitUrl}
                  style={{
                    padding: '0.42rem 0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#F5E6AD',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>🎬</span>
                  <span>{isRTL ? 'صانع الفيديوهات والريلز' : 'Social Reels'}</span>
                </Link>
              </>
            )}

            {/* LANGUAGE SWITCHER */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* COLLAPSE / EXPAND TOGGLE */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Ribbon' : 'Minimize Ribbon'}
              style={{
                background: 'transparent',
                border: 0,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.2rem 0.4rem',
              }}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── CLAIM MODAL DIALOG (1-TAP CLAIM & ONBOARDING) ── */}
      {isOpen && (
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
            fontFamily: isRTL ? "'Noto Sans Arabic', 'Inter', sans-serif" : "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              background: '#0f172a',
              color: '#fff',
              borderRadius: '28px',
              maxWidth: '560px',
              width: '100%',
              padding: '2.2rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              position: 'relative',
              border: `1.5px solid ${primaryColor}`,
            }}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                left: isRTL ? '1.25rem' : 'auto',
                right: isRTL ? 'auto' : '1.25rem',
                border: 0,
                background: 'rgba(255,255,255,0.08)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {!successData ? (
              /* CLAIM FORM */
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(212,175,55,0.18)',
                    color: '#D4AF37',
                    padding: '4px 12px',
                    borderRadius: '50px',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    marginBottom: '1rem',
                    border: '1px solid rgba(212,175,55,0.3)',
                  }}
                >
                  ★ {isRTL ? 'المنصة الرقمية الأولى لواحة سيوة — SiWiFy.com' : 'OFFICIAL SIWIFY DIGITAL REGISTRY'}
                </div>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem 0' }}>
                  {isRTL ? `تأكيد واستلام موقع: ${businessName}` : `Claim & Activate ${businessName}`}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                  {isRTL
                    ? 'تم تجهيز وبرمجة هذا الموقع المصغر لك مسبقاً لعرض مركبتك أو خدماتك برابط مباشر. أكّد رقم واتساب الخاص بك لاستلام لوحة التحكم فوراً وبدون أي عمولة (0%).'
                    : 'This official digital minisite is pre-configured for your business. Enter your WhatsApp number to take ownership and unlock direct bookings.'}
                </p>

                {/* VIP BENEFITS CHECKLIST */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    padding: '1.15rem',
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#D4AF37', marginBottom: '0.65rem' }}>
                    🎁 {isRTL ? 'المزايا المشمولة مجاناً 100% فور التأكيد:' : 'INCLUDED FOR FREE UPON CLAIMING:'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <div>✅ {isRTL ? 'حجز مباشر فوري عبر واتساب (عمولة 0% ومكسبك كامل في جيبك)' : '1-Click WhatsApp Direct Bookings (0% commission)'}</div>
                    <div>✅ {isRTL ? 'لوحة تحكم خفيفة على هاتفك لتعديل أوقات العمل وأسعار المشاوير/الغرف' : 'Mobile Command App to update rates and availability'}</div>
                    <div>✅ {isRTL ? 'صانع فيديوهات واستوري ريلز باسمك ولوجو خدمتك' : 'Branded Video Reels Maker for TikTok & Instagram'}</div>
                    <div>✅ {isRTL ? 'شارة الشريك السيوي المعتمد والموثق رسمياً' : 'Official Verified Siwan Partner Badge'}</div>
                  </div>
                </div>

                {/* PHONE INPUT */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.4rem' }}>
                    {isRTL ? 'رقم الواتساب الخاص بك (لاستقبال حجوزات الزوار مباشرة):' : 'Your WhatsApp Number (for guest direct bookings):'}
                  </label>
                  <input
                    type="tel"
                    placeholder={isRTL ? 'مثال: 01012345678 أو +201012345678' : '+20 1X XXXX XXXX'}
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    dir="ltr"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid rgba(212,175,55,0.4)',
                      background: '#1e293b',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* CONSENT CHECKBOXES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={agreeBio}
                      onChange={(e) => setAgreeBio(e.target.checked)}
                      style={{ accentColor: primaryColor, width: 16, height: 16 }}
                    />
                    <span>{isRTL ? 'أوافق على وضع رابط الموقع في بايو حساباتي للتواصل المباشر' : 'I agree to place this link in my social media bio'}</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={agreeSocial}
                      onChange={(e) => setAgreeSocial(e.target.checked)}
                      style={{ accentColor: primaryColor, width: 16, height: 16 }}
                    />
                    <span>{isRTL ? 'أرغب بمزامنة عروضي وخدماتي مع دليل سياحة سيوة الرسمي' : 'Sync my offers with Siwa Official Tourist Directory'}</span>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                    color: '#0a0f1e',
                    border: 0,
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px rgba(212,175,55,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {loading
                    ? (isRTL ? '⏳ جارٍ تفعيل وتوثيق حسابك...' : 'Activating Minisite...')
                    : (isRTL ? '✅ تأكيد واستلام موقعي ولوحة تحكمي فوراً' : '✅ Accept & Claim My Minisite (1-Tap)')}
                </button>
              </div>
            ) : (
              /* SUCCESS STATE */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80', margin: '0 0 0.5rem 0' }}>
                  {isRTL ? 'مبروك! تم توثيق واعتماد موقعك بنجاح' : 'Congratulations!'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {isRTL
                    ? 'أصبح موقعك نشطاً ومعتمداً الآن. يمكنك البدء في استقبال الحجوزات أو إدارة أسعارك من هاتفك.'
                    : 'Your official minisite is now verified and active. You can now manage your rates and receive direct bookings.'}
                </p>

                <div
                  dir="ltr"
                  style={{
                    background: '#1e293b',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(212,175,55,0.4)',
                    marginBottom: '1.25rem',
                    wordBreak: 'break-all',
                    fontWeight: 800,
                    color: '#D4AF37',
                    fontSize: '0.88rem',
                  }}
                >
                  🔗 {successData.business?.vanityUrl || `https://siwify.com/${slug}`}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link
                    href={mobileDashboardUrl}
                    style={{
                      flex: 1,
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                      color: '#0a0f1e',
                      textDecoration: 'none',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>📲</span>
                    <span>{isRTL ? 'فتح لوحة تحكم الهاتف الآن' : 'Open Mobile Dashboard'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      const link = successData.business?.vanityUrl || `https://siwify.com/${slug}`;
                      if (navigator.clipboard) navigator.clipboard.writeText(link);
                      alert(isRTL ? 'تم نسخ الرابط! الصقه في بايو إنستغرام أو واتساب' : 'Link copied to clipboard!');
                    }}
                    style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    📋 {isRTL ? 'نسخ الرابط' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
