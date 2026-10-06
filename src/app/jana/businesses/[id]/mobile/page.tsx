'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ─── i18n ─────────────────────────────────────────────────── */
const T = {
  en: {
    privateCenter: 'YOUR BUSINESS COMMAND CENTER',
    tier: (t: string) => `${t.toUpperCase()} PLAN`,
    liveBadge: '🟢 MINISITE LIVE',
    pendingBadge: '🟡 MINISITE PENDING',
    viewSite: 'View Live Site',
    shareDash: 'Share Dashboard',
    copied: 'Copied!',
    stagesTitle: 'YOUR JOURNEY — Follow These Steps',
    stagesDone: (n: number, t: number) => `${n} of ${t} steps completed`,
    upgradeTitle: 'UNLOCK MORE FEATURES',
    upgradeDesc: 'Upgrade to Premium for Marketplace, Leads CRM & Direct Booking Engine.',
    upgradeBtn: 'See Plans',
    contactUs: 'Need Help? Contact Us',
    whatsappUs: 'WhatsApp Support',
    poweredBy: 'Powered by SiWiFy.com — Siwa Oasis Digital Platform',
    stages: [
      {
        num: '01',
        title: 'Claim Your Account',
        desc: 'Verify your identity as the official business owner to get full control of your profile.',
        cta: 'Claim Now →',
        doneCta: '✓ Account Claimed',
        icon: '🔑',
        color: '#D4AF37',
      },
      {
        num: '02',
        title: 'Complete Your Profile',
        desc: 'Add your business name, WhatsApp number, photos, and a short description so guests can find you.',
        cta: 'Edit Profile →',
        doneCta: '✓ Profile Ready',
        icon: '✏️',
        color: '#6366f1',
      },
      {
        num: '03',
        title: 'Your Live Minisite',
        desc: 'Your free business page is LIVE on SiWiFy.com. Share it on WhatsApp, Instagram & Google Maps.',
        cta: 'View & Share →',
        doneCta: '✓ Site is Live',
        icon: '🌐',
        color: '#22c55e',
      },
      {
        num: '04',
        title: 'Add Your Services & Offers',
        desc: 'List what you offer — tours, rooms, meals, experiences — so guests can browse and book directly.',
        cta: 'Add Services →',
        doneCta: '✓ Services Added',
        icon: '🎯',
        color: '#f59e0b',
      },
      {
        num: '05',
        title: 'Grow on Social Media',
        desc: 'Use your free Social Media Toolkit to create Reels, Stories & posts — all branded for your business.',
        cta: 'Open Toolkit →',
        doneCta: '✓ Toolkit Active',
        icon: '📲',
        color: '#ec4899',
      },
    ],
  },
  ar: {
    privateCenter: 'مركز إدارة نشاطك التجاري',
    tier: (t: string) => `باقة ${t === 'free' ? 'المجانية' : t === 'standard' ? 'الأساسية' : 'البريميوم'}`,
    liveBadge: '🟢 موقعك شغّال',
    pendingBadge: '🟡 الموقع قيد التفعيل',
    viewSite: 'عرض الموقع',
    shareDash: 'مشاركة الرابط',
    copied: 'تم النسخ!',
    stagesTitle: 'خطواتك — اتبعها بالترتيب',
    stagesDone: (n: number, t: number) => `أتممت ${n} من أصل ${t} خطوات`,
    upgradeTitle: 'افتح مزايا أكثر',
    upgradeDesc: 'ترقّى للبريميوم لتفعيل المتجر الإلكتروني وإدارة الحجوزات والعملاء.',
    upgradeBtn: 'شاهد الباقات',
    contactUs: 'تحتاج مساعدة؟ تواصل معنا',
    whatsappUs: 'واتساب الدعم',
    poweredBy: 'مشغّل بواسطة SiWiFy.com — منصة واحة سيوة الرقمية',
    stages: [
      {
        num: '٠١',
        title: 'أكّد حسابك',
        desc: 'تحقّق من هويتك كصاحب النشاط الرسمي للحصول على تحكم كامل في صفحتك.',
        cta: 'تأكيد الآن ←',
        doneCta: '✓ تم تأكيد الحساب',
        icon: '🔑',
        color: '#D4AF37',
      },
      {
        num: '٠٢',
        title: 'أكمل ملف نشاطك',
        desc: 'أضف اسم نشاطك، رقم الواتساب، الصور، ووصفاً مختصراً حتى يجدك الزوار بسهولة.',
        cta: 'تعديل الملف ←',
        doneCta: '✓ الملف مكتمل',
        icon: '✏️',
        color: '#6366f1',
      },
      {
        num: '٠٣',
        title: 'موقعك المصغر شغّال',
        desc: 'صفحتك مباشرة على SiWiFy.com. شاركها على واتساب وإنستغرام وخرائط جوجل.',
        cta: 'عرض ومشاركة ←',
        doneCta: '✓ الموقع نشط',
        icon: '🌐',
        color: '#22c55e',
      },
      {
        num: '٠٤',
        title: 'أضف خدماتك وعروضك',
        desc: 'سجّل ما تقدمه — جولات، غرف، وجبات، تجارب — حتى يتمكن الضيوف من الحجز مباشرة.',
        cta: 'إضافة خدمات ←',
        doneCta: '✓ الخدمات مضافة',
        icon: '🎯',
        color: '#f59e0b',
      },
      {
        num: '٠٥',
        title: 'نمّ على السوشيال ميديا',
        desc: 'استخدم أدوات السوشيال المجانية لإنشاء ريلز وستوري وبوستات بهوية نشاطك.',
        cta: 'فتح الأدوات ←',
        doneCta: '✓ الأدوات نشطة',
        icon: '📲',
        color: '#ec4899',
      },
    ],
  },
};

/* ─── Stage CTA URLs ─────────────────────────────────────────── */
function getStageCta(stageIdx: number, slug: string, bizId: string): string {
  const urls = [
    `/vendor/claim?slug=${slug}`,         // 0 - Claim
    `/vendor/profile`,                     // 1 - Edit profile
    `/${slug}`,                            // 2 - View minisite
    `/vendor/services`,                    // 3 - Services
    `/vendor/social-toolkit?slug=${slug}`, // 4 - Social toolkit
  ];
  return urls[stageIdx] || '/vendor/profile';
}

/* ─── Component ─────────────────────────────────────────────── */
export default function FreeVendorMobileDashboard() {
  const { id } = useParams();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [minisiteStatus, setMinisiteStatus] = useState<string>('inactive');
  const [dashCopied, setDashCopied] = useState(false);
  // Track which stages the user has "tapped" (optimistic progress)
  const [tappedStages, setTappedStages] = useState<Set<number>>(new Set());

  const t = T[lang];
  const isRTL = lang === 'ar';

  useEffect(() => {
    async function fetchData() {
      try {
        const bRes = await fetch(`/api/vendor/business?id=${id}&sections=1`);
        if (!bRes.ok) { setLoading(false); return; }
        const bData = await bRes.json();
        const biz = bData.business || bData;
        setBusiness(biz || null);

        // Load minisite status
        try {
          const mRes = await fetch(`/api/minisite-services/${id}`);
          if (mRes.ok) {
            const mData = await mRes.json();
            setMinisiteStatus(mData.minisiteStatus || 'inactive');
          }
        } catch {}

        // Auto-mark stage 02 done if profile has whatsapp/phone
        const cd = biz?.custom_data || {};
        const hasWhatsapp = cd.basic?.whatsapp || cd.sec_1_identity?.whatsapp || cd.whatsapp;
        const hasPhoto = cd.basic?.business_logo || cd.sec_1_identity?.business_logo;
        const initialTapped = new Set<number>();
        if (biz?.is_claimed) initialTapped.add(0);
        if (hasWhatsapp || hasPhoto) initialTapped.add(1);
        if (biz?.published) initialTapped.add(2);
        setTappedStages(initialTapped);
      } catch (e) {
        console.error('Dashboard load failed', e);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  function copyDashboardLink() {
    const link = `${window.location.origin}/jana/businesses/${id}/mobile`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setDashCopied(true);
      setTimeout(() => setDashCopied(false), 2500);
    }
  }

  if (loading) return (
    <div style={{ background: '#0a0f1e', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '3px' }}>SiWiFy.com</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!business) return (
    <div style={{ background: '#0a0f1e', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', color: '#fff' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.5rem' }}>Access Restricted</div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '2rem' }}>This dashboard is private. Contact SiWiFy.com to get access.</div>
      <a href="https://wa.me/201000000000" style={{ color: '#25D366', fontWeight: 700, fontSize: '0.9rem' }}>
        <i className="fab fa-whatsapp" /> WhatsApp Us
      </a>
    </div>
  );

  const slug = business.slug || '';
  const tier = business.subscription_tier || 'free';
  const isMiniLive = minisiteStatus === 'active' || business.published;
  const completedCount = tappedStages.size;
  const totalStages = t.stages.length;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: '#0a0f1e',
        minHeight: '100vh',
        paddingBottom: '100px',
        color: '#fff',
        fontFamily: isRTL
          ? "'Noto Sans Arabic', 'Segoe UI', sans-serif"
          : "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=Noto+Sans+Arabic:wght@400;600;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow:0 0 0 3px rgba(34,197,94,0.3); } 50% { box-shadow:0 0 0 7px rgba(34,197,94,0.08); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .stage-card { animation: fadeUp 0.4s ease both; }
        .stage-card:nth-child(1) { animation-delay: 0.05s; }
        .stage-card:nth-child(2) { animation-delay: 0.1s; }
        .stage-card:nth-child(3) { animation-delay: 0.15s; }
        .stage-card:nth-child(4) { animation-delay: 0.2s; }
        .stage-card:nth-child(5) { animation-delay: 0.25s; }
      `}</style>

      {/* ── TOP HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        padding: '1.5rem 1.25rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo + name */}
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', marginBottom: '2px' }}>
              {t.privateCenter}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              {business.name}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: '2px' }}>
              {t.tier(tier)}
            </div>
          </div>

          {/* Lang toggle */}
          <div style={{
            display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '3px',
          }}>
            <button
              onClick={() => setLang('ar')}
              style={{
                padding: '5px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '0.65rem', fontWeight: 900,
                background: lang === 'ar' ? '#D4AF37' : 'transparent',
                color: lang === 'ar' ? '#0a0f1e' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              عربي
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '5px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '0.65rem', fontWeight: 900,
                background: lang === 'en' ? '#D4AF37' : 'transparent',
                color: lang === 'en' ? '#0a0f1e' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.25rem' }}>

        {/* ── MINISITE STATUS BANNER ── */}
        <div style={{
          marginBottom: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '20px',
          background: isMiniLive
            ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))'
            : 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
          border: `1px solid ${isMiniLive ? 'rgba(34,197,94,0.3)' : 'rgba(212,175,55,0.25)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: isMiniLive ? '#22c55e' : '#D4AF37',
              flexShrink: 0,
              animation: isMiniLive ? 'pulse 2s infinite' : 'none',
            }} />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: isMiniLive ? '#22c55e' : '#D4AF37', letterSpacing: '1px' }}>
                {isMiniLive ? t.liveBadge : t.pendingBadge}
              </div>
              {isMiniLive && slug && (
                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: '1px' }}>
                  siwify.com/{slug}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isMiniLive && slug && (
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: '10px',
                  background: '#22c55e', color: '#0a0f1e',
                  fontSize: '0.62rem', fontWeight: 900, textDecoration: 'none',
                }}
              >
                {t.viewSite} ↗
              </a>
            )}
            <button
              onClick={copyDashboardLink}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '10px',
                background: dashCopied ? '#22c55e' : 'rgba(255,255,255,0.08)',
                color: dashCopied ? '#0a0f1e' : 'rgba(255,255,255,0.6)',
                fontSize: '0.62rem', fontWeight: 900, border: 'none', cursor: 'pointer',
              }}
            >
              {dashCopied ? t.copied : `🔗 ${t.shareDash}`}
            </button>
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div style={{
          marginBottom: '1.75rem',
          padding: '1rem 1.25rem',
          borderRadius: '18px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px' }}>
              {t.stagesTitle}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>
              {t.stagesDone(completedCount, totalStages)}
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {t.stages.map((_, i) => (
              <React.Fragment key={i}>
                <div style={{
                  width: tappedStages.has(i) ? 28 : 20,
                  height: 8,
                  borderRadius: 4,
                  background: tappedStages.has(i) ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s',
                  flexShrink: 0,
                }} />
                {i < totalStages - 1 && (
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── STAGE CARDS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
          {t.stages.map((stage, i) => {
            const isDone = tappedStages.has(i);
            const isNext = !isDone && !Array.from({ length: i }).some((_, j) => !tappedStages.has(j));

            return (
              <div
                key={i}
                className="stage-card"
                style={{
                  borderRadius: '22px',
                  border: `1px solid ${isDone
                    ? 'rgba(34,197,94,0.2)'
                    : isNext
                      ? `${stage.color}40`
                      : 'rgba(255,255,255,0.05)'}`,
                  background: isDone
                    ? 'rgba(34,197,94,0.05)'
                    : isNext
                      ? `linear-gradient(135deg, ${stage.color}08, transparent)`
                      : 'rgba(255,255,255,0.02)',
                  padding: '1.25rem',
                  opacity: (!isDone && !isNext) ? 0.55 : 1,
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Step number + icon */}
                  <div style={{
                    width: 48, height: 48, flexShrink: 0, borderRadius: '14px',
                    background: isDone ? 'rgba(34,197,94,0.15)' : `${stage.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem',
                    border: isDone
                      ? '1px solid rgba(34,197,94,0.25)'
                      : `1px solid ${stage.color}30`,
                  }}>
                    {isDone ? '✅' : stage.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <div style={{
                        fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1.5px',
                        color: isDone ? '#22c55e' : stage.color,
                      }}>
                        {lang === 'ar' ? `الخطوة ${stage.num}` : `STEP ${stage.num}`}
                      </div>
                      {isNext && (
                        <div style={{
                          fontSize: '0.52rem', fontWeight: 900, padding: '2px 8px',
                          borderRadius: '50px', background: `${stage.color}20`,
                          color: stage.color, letterSpacing: '0.5px',
                        }}>
                          {lang === 'ar' ? 'التالي' : 'UP NEXT'}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isDone ? '#94a3b8' : '#fff', marginBottom: '0.35rem' }}>
                      {stage.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                      {stage.desc}
                    </div>

                    {/* CTA Button */}
                    {i === 2 ? (
                      // Stage 3 (Minisite) — external link
                      <a
                        href={getStageCta(i, slug, id as string)}
                        target={i === 2 ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        onClick={() => setTappedStages(prev => new Set([...prev, i]))}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1.1rem',
                          borderRadius: '12px',
                          background: isDone ? 'rgba(255,255,255,0.05)' : stage.color,
                          color: isDone ? '#94a3b8' : (stage.color === '#D4AF37' || stage.color === '#22c55e' || stage.color === '#f59e0b') ? '#0a0f1e' : '#fff',
                          fontSize: '0.75rem', fontWeight: 900,
                          textDecoration: 'none',
                          opacity: (!isDone && !isNext) ? 0.5 : 1,
                          pointerEvents: (!isDone && !isNext) ? 'none' : 'auto',
                        }}
                      >
                        {isDone ? stage.doneCta : stage.cta}
                      </a>
                    ) : (
                      <Link
                        href={getStageCta(i, slug, id as string)}
                        onClick={() => setTappedStages(prev => new Set([...prev, i]))}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1.1rem',
                          borderRadius: '12px',
                          background: isDone ? 'rgba(255,255,255,0.05)' : stage.color,
                          color: isDone ? '#94a3b8' : (stage.color === '#D4AF37' || stage.color === '#22c55e' || stage.color === '#f59e0b') ? '#0a0f1e' : '#fff',
                          fontSize: '0.75rem', fontWeight: 900,
                          textDecoration: 'none',
                          opacity: (!isDone && !isNext) ? 0.5 : 1,
                          pointerEvents: (!isDone && !isNext) ? 'none' : 'auto',
                        }}
                      >
                        {isDone ? stage.doneCta : stage.cta}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── UPGRADE BANNER (Free tier only) ── */}
        {tier === 'free' && (
          <Link href="/vendor/upgrade" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.25rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #b45309 100%)',
              padding: '1.25rem 1.5rem', borderRadius: '22px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
            }}>
              <div>
                <div style={{ fontWeight: 900, color: '#0a0f1e', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                  {t.upgradeTitle}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(10,15,30,0.75)', fontWeight: 700, lineHeight: 1.4 }}>
                  {t.upgradeDesc}
                </div>
              </div>
              <div style={{
                background: 'rgba(10,15,30,0.15)', color: '#0a0f1e',
                fontWeight: 900, fontSize: '0.7rem', padding: '0.4rem 0.85rem',
                borderRadius: '10px', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {t.upgradeBtn} →
              </div>
            </div>
          </Link>
        )}

        {/* ── SUPPORT CONTACT ── */}
        <div style={{
          padding: '1.1rem 1.25rem', borderRadius: '18px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>
            {t.contactUs}
          </div>
          <a
            href="https://wa.me/201093312121"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.9rem', borderRadius: '10px',
              background: '#25D366', color: '#fff',
              fontSize: '0.7rem', fontWeight: 900, textDecoration: 'none', flexShrink: 0,
            }}
          >
            <i className="fab fa-whatsapp" /> {t.whatsappUs}
          </a>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center', color: '#334155', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.5px' }}>
          {t.poweredBy}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '72px',
        background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 1000,
      }}>
        {[
          { icon: 'fa-home', label: lang === 'ar' ? 'الرئيسية' : 'Home', href: null, active: true },
          { icon: 'fa-globe', label: lang === 'ar' ? 'موقعي' : 'My Site', href: slug ? `/${slug}` : null, active: false },
          { icon: 'fa-comment-alt', label: lang === 'ar' ? 'الرسائل' : 'Messages', href: '/vendor/leads', active: false },
          { icon: 'fa-cog', label: lang === 'ar' ? 'إعدادات' : 'Settings', href: '/vendor/profile', active: false },
        ].map((item, i) =>
          item.href ? (
            <a
              key={i}
              href={item.href}
              target={item.icon === 'fa-globe' ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{ textAlign: 'center', color: '#4b5563', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
            >
              <i className={`fas ${item.icon}`} style={{ fontSize: '1.1rem' }} />
              <div style={{ fontSize: '0.48rem', fontWeight: 900, letterSpacing: '0.5px' }}>{item.label}</div>
            </a>
          ) : (
            <div
              key={i}
              style={{ textAlign: 'center', color: item.active ? '#D4AF37' : '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
            >
              <i className={`fas ${item.icon}`} style={{ fontSize: '1.1rem' }} />
              <div style={{ fontSize: '0.48rem', fontWeight: 900, letterSpacing: '0.5px' }}>{item.label}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
