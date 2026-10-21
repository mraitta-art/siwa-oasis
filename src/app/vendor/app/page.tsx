'use client';

import VendorCRMAnnouncements from '@/components/VendorCRMAnnouncements';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

interface BusinessDetails {
  id: string;
  name: string;
  slug: string;
  type_name?: string;
  parent_type_name?: string;
  whatsapp?: string;
  phone?: string;
  subscription_tier: string;
  is_claimed: boolean;
}

interface PermissionsMap {
  minisite?: boolean;
  social_bio?: boolean;
  profile_editor?: boolean;
  inquiry_notifications?: boolean;
  content_creator?: boolean;
  analytics_dashboard?: boolean;
  packages_studio?: boolean;
  journey_planner_listing?: boolean;
  verified_badge?: boolean;
}

interface MobileAdNotice {
  enabled: boolean;
  badgeAr?: string;
  titleAr?: string;
  descAr?: string;
  icon?: string;
  ctaTextAr?: string;
  whatsappNumber?: string;
}

export default function VendorAppHubPage() {
  const searchParams = useSearchParams();
  const slugParam = searchParams.get('slug');

  const [biz, setBiz] = useState<BusinessDetails | null>(null);
  const [permissions, setPermissions] = useState<PermissionsMap>({
    minisite: true,
    social_bio: true,
    profile_editor: true,
  });
  const [adNotice, setAdNotice] = useState<MobileAdNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadData();
    loadAdNotice();
  }, [slugParam]);

  async function loadData() {
    setLoading(true);
    try {
      let bizData: any = null;
      const resBiz = await fetch('/api/vendor/business');
      if (resBiz.ok) {
        bizData = await resBiz.json();
      }

      if (!bizData?.id && slugParam) {
        const resPublic = await fetch(`/api/businesses/${slugParam}`);
        if (resPublic.ok) {
          bizData = await resPublic.json();
        }
      }

      if (!bizData?.id) {
        bizData = {
          id: 'demo-vendor',
          name: 'نشاطك التجاري في سيوة',
          slug: slugParam || 'siwa-partner',
          subscription_tier: 'pro',
          is_claimed: true,
        };
      }

      setBiz(bizData);

      const resPerms = await fetch(`/api/vendor/permissions?businessId=${bizData.id}`);
      if (resPerms.ok) {
        const permsData = await resPerms.json();
        if (permsData.permissions) {
          setPermissions(permsData.permissions);
        }
      }
    } catch (e) {
      console.error('Failed to load vendor app hub:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAdNotice() {
    try {
      const res = await fetch('/api/jana/mobile-ads');
      if (res.ok) {
        const data = await res.json();
        if (data?.ad && data.ad.enabled) {
          setAdNotice(data.ad);
        }
      }
    } catch (e) {
      console.warn('Could not load mobile ads ribbon', e);
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://siwify.com';
  const minisiteUrl = `${origin}/${biz?.slug || 'my-page'}`;
  const bioText = `🌴 احجز معنا مباشرة وبأفضل سعر بدون وسيط في سيوة:\n🔗 ${minisiteUrl}`;
  const inviteText = `يا هلا بيك يا كابتن وزميلنا في سيوة! 🌴✨\nمنصة SiWiFy بتعمل صفحة وكارت رقمي مجاناً لكل أنشطة سيوة لحجز الزوار المباشر وربط روابط بوكينج وجوجل ماب الخاصة بيك.\nسجل واستلم كارتك وتطبيقك فوراً من هنا:\n👉 ${origin}/vendor/app`;

  function copyToClipboard(text: string, type: 'bio' | 'link' | 'invite') {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'bio') {
        setCopiedBio(true);
        setTimeout(() => setCopiedBio(false), 2500);
      } else if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2500);
      }
    }
  }

  const tierColors: Record<string, { bg: string; color: string; border: string; label: string }> = {
    free: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)', label: 'باقة مجانية (Free)' },
    pro: { bg: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: 'rgba(212,175,55,0.4)', label: '⭐ شريك محترف (Pro)' },
    verified_partner: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80', border: 'rgba(74,222,128,0.4)', label: '✅ شريك معتمد وموثق (Verified Partner)' },
  };

  const currentTier = tierColors[biz?.subscription_tier || 'free'] || tierColors.free;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070B12',
        color: '#D4AF37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Cairo', 'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌴</div>
          <div style={{ fontSize: '1rem', fontWeight: 800 }}>جاري تشغيل تطبيق SiWiFy للشركاء...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #070B12 0%, #0f172a 60%, #070B12 100%)',
      color: '#f8fafc',
      fontFamily: "'Cairo', 'Inter', sans-serif",
      direction: 'rtl',
      padding: '1.25rem 1rem 4rem',
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* ─── PWA INSTALL NOTIFICATION ───────────────────────────────── */}
        <PWAInstallPrompt />

        {/* ─── LIVE NEWS RIBBON & OFFICIAL BROADCAST (إذا كان مفعلاً من الإدارة) ─── */}
        {biz?.id && <VendorCRMAnnouncements businessId={biz.id} />}

        {adNotice && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(20,29,47,0.95) 100%)',
            border: '1.5px solid #D4AF37',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 20px rgba(212,175,55,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{adNotice.icon || '📢'}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#D4AF37', color: '#070B12', padding: '1px 6px', borderRadius: '4px' }}>
                    {adNotice.badgeAr || 'تنبيه عاجل'}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#f8fafc' }}>
                    {adNotice.titleAr}
                  </span>
                </div>
                {adNotice.descAr && (
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    {adNotice.descAr}
                  </div>
                )}
              </div>
            </div>

            {adNotice.whatsappNumber && (
              <a
                href={`https://wa.me/${adNotice.whatsappNumber}?text=${encodeURIComponent('مرحباً إدارة سيوة، بخصوص إعلان المنصة: ' + (adNotice.titleAr || ''))}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  background: '#25D366',
                  color: '#070B12',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                }}
              >
                {adNotice.ctaTextAr || 'متابعة'}
              </a>
            )}
          </div>
        )}

        {/* ─── TOP BAR ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🌴</span>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px' }}>
                تطبيق الشركاء المعتمدين
              </div>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                {biz?.name}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: currentTier.bg,
              color: currentTier.color,
              border: `1px solid ${currentTier.border}`,
              fontSize: '0.72rem',
              fontWeight: 800,
            }}>
              {currentTier.label}
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                color: '#070B12',
                border: 0,
                fontSize: '0.72rem',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ترقية ⚡
            </button>
          </div>
        </div>

        {/* ─── VALUE PROPOSITION STRIP (خدماتنا وتفاوض الكوبونات والاتصال المباشر) ─── */}
        <div style={{
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '18px',
          padding: '1.15rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🤝</span>
            <span style={{ fontWeight: 900, color: '#D4AF37', fontSize: '0.9rem' }}>
              كيف تخدمك منصة SiWiFy لتطوير نشاطك وزيادة زوارك؟
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div>
              🌐 <strong>صفحتك وكارتك أونلاين:</strong> نضع نشاطك ومركبتك/مخيمك على الموقع العام لزوار سيوة مع توثيق اسمك.
            </div>
            <div>
              🔗 <strong>ربط كل مواقع الحجز الخاصة بك:</strong> نضع روابطك المباشرة (Booking.com، خرائط Google، إنستغرام، فيسبوك) ليختار الزائر طريقته المفضلة.
            </div>
            <div>
              📞 <strong>اتصال ومحادثة مباشرة بدون وسيط:</strong> الزائر يتصل بك أو يراسلك على واتسابك مباشرة دون أي طرف ثالث.
            </div>
            <div>
              🎟️ <strong>نسبة تفاوضية لتقديم كوبونات حصرية للزوار:</strong> عمولتنا تفاوضية ومرنة، ويمكنك تقديم خصومات وكوبونات خاصة لرواد سيوة لتشجيعهم على اختيارك وتصدر ترتيب البحث.
            </div>
          </div>
        </div>

        {/* ─── CARD 1: OFFICIAL MINISITE & SOCIAL BIO TOOL (CRITICAL) ──── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(15,23,42,0.95))',
          border: '1.5px solid #D4AF37',
          borderRadius: '22px',
          padding: '1.4rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🔗</span>
              <span style={{ fontWeight: 900, color: '#D4AF37', fontSize: '0.95rem' }}>
                موقعك وكارت الحجز المباشر (Minisite)
              </span>
            </div>
            <a
              href={minisiteUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.75rem',
                color: '#4ade80',
                textDecoration: 'none',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              معاينة الصفحة ↗
            </a>
          </div>

          <div style={{
            background: 'rgba(2,6,23,0.8)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.82rem',
            color: '#cbd5e1',
            direction: 'ltr',
            wordBreak: 'break-all',
            marginBottom: '1rem',
            fontFamily: 'monospace',
          }}>
            {minisiteUrl}
          </div>

          {/* Social Bio Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => copyToClipboard(minisiteUrl, 'link')}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>📋</span>
              <span>{copiedLink ? '✓ تم النسخ!' : 'نسخ الرابط'}</span>
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(bioText, 'bio')}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                color: '#070B12',
                border: 0,
                fontWeight: 900,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
              }}
            >
              <span>📲</span>
              <span>{copiedBio ? '✓ جاهز لوضعه بالبايو!' : 'نسخ نص بايو السوشيال'}</span>
            </button>
          </div>

          {/* Instructions for Instagram & TikTok Bio */}
          <div style={{
            marginTop: '0.85rem',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            fontSize: '0.75rem',
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            💡 <strong>ضع هذا الرابط في بايو حسابك على إنستغرام أو تيك توك:</strong>
            <br />
            عندما يضغط عليه السياح سيفتح كارتك الشخصي للحجز المباشر بالأسعار ورقم هاتفك وروابطك الرسمية بدون وسيط (0% عمولة).
          </div>
        </div>

        {/* ─── CARD 2: PERMISSION-AWARE VENDOR TOOLS ─────────────────── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#D4AF37', marginBottom: '0.85rem' }}>
            🛠️ أدواتك المعتمدة من إدارة المنصة:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>

            {/* Profile & Minisite Content Editor (Always accessible) */}
            <Link
              href="/vendor/minisite"
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.15rem',
                textDecoration: 'none',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '1.6rem' }}>✏️</div>
              <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#f8fafc' }}>
                تعديل الصور والأسعار والروابط
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                إضافة روابط بوكينج وجوجل ماب وأرقامك
              </div>
            </Link>

            {/* Content Creator / Stories Studio (Permission-Aware) */}
            {permissions.content_creator ? (
              <Link
                href="/vendor/social-toolkit"
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  textDecoration: 'none',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '1.6rem' }}>🎬</div>
                <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#D4AF37' }}>
                  صانع الفيديوهات والستوري
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  تصاميم وفيديوهات ريلز جاهزة باسمك
                </div>
              </Link>
            ) : (
              <div
                onClick={() => setShowUpgradeModal(true)}
                style={{
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  color: '#64748b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '1.6rem', filter: 'grayscale(1)' }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>صانع الستوري</div>
                <div style={{ fontSize: '0.7rem', color: '#D4AF37' }}>اضغط لترقية الباقة (Pro) ↗</div>
              </div>
            )}

            {/* Packages Studio (Permission-Aware) */}
            {permissions.packages_studio ? (
              <Link
                href="/vendor/packages"
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  textDecoration: 'none',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '1.6rem' }}>📦</div>
                <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#4ade80' }}>
                  إدارة الباقات والرحلات
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  إنشاء عروض وجولات خاصة بنشاطك
                </div>
              </Link>
            ) : (
              <div
                onClick={() => setShowUpgradeModal(true)}
                style={{
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  color: '#64748b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '1.6rem', filter: 'grayscale(1)' }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>استوديو الباقات</div>
                <div style={{ fontSize: '0.7rem', color: '#D4AF37' }}>متاح للشركاء المعتمدين ↗</div>
              </div>
            )}

            {/* Analytics Dashboard (Permission-Aware) */}
            {permissions.analytics_dashboard ? (
              <Link
                href="/vendor/analytics"
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  textDecoration: 'none',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '1.6rem' }}>📊</div>
                <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#f8fafc' }}>
                  إحصائيات الزيارات
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  عدد نقرات الرابط والرسائل المستلمة
                </div>
              </Link>
            ) : (
              <div
                onClick={() => setShowUpgradeModal(true)}
                style={{
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  color: '#64748b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '1.6rem', filter: 'grayscale(1)' }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>إحصائيات الزيارات</div>
                <div style={{ fontSize: '0.7rem', color: '#D4AF37' }}>يتطلب ترقية الباقة ↗</div>
              </div>
            )}

          </div>
        </div>

        {/* ─── CARD 3: VIRAL GROWTH & SHARING WITH FELLOW VENDORS ──────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,211,102,0.1) 0%, rgba(15,23,42,0.95) 100%)',
          border: '1.5px solid rgba(37,211,102,0.3)',
          borderRadius: '20px',
          padding: '1.25rem 1.4rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🤝</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#4ade80' }}>
                شارك التطبيق مع زملائك في سيوة (Viral Referral)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                ساعد زملاءك من سائقي التوك توك والدفع الرباعي والمخيمات ليستلموا كارتهم المجاني
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.85rem' }}>
            <button
              type="button"
              onClick={() => copyToClipboard(inviteText, 'invite')}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {copiedInvite ? '✓ تم نسخ رسالة الدعوة!' : '📋 نسخ رسالة الدعوة'}
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                background: '#25D366',
                color: '#070B12',
                fontWeight: 900,
                fontSize: '0.8rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
              }}
            >
              <span>إرسال لزميل عبر واتساب</span>
              <span>💬</span>
            </a>
          </div>
        </div>

        {/* ─── QUICK WHATSAPP SUPPORT FOR VENDOR ────────────────────────── */}
        <div style={{
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '18px',
          padding: '1.1rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#D4AF37' }}>
              💬 خط دعم الشركاء في سيوة
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
              فريق جنا معك خطوة بخطوة للاتفاق على كوبونات الزوار وترقية الباقات
            </div>
          </div>

          <a
            href="https://wa.me/201000000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%81%D8%B1%D9%8A%D9%82%20%D8%B3%D9%8A%D9%88%D8%A7%D9%8A%D9%81%D8%A7%D9%8A%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D9%81%D9%8A%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '12px',
              background: '#25D366',
              color: '#070B12',
              fontWeight: 900,
              fontSize: '0.8rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>واتساب الإدارة</span>
            <span>💬</span>
          </a>
        </div>

      </div>

      {/* ─── MODAL: WHY & HOW TO UPGRADE + NEGOTIABLE COUPONS ─────────── */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(7, 11, 18, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}>
          <div style={{
            background: '#0f172a',
            border: '1.5px solid #D4AF37',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(15,23,42,0.95))',
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px' }}>
                  دليل الترقية وشراكة سيوة
                </div>
                <h3 style={{ margin: '0.2rem 0 0', color: '#fff', fontSize: '1.15rem', fontWeight: 900 }}>
                  لماذا وكيف ترقي حسابك على SiWiFy؟
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 0,
                  color: '#fff',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', lineHeight: 1.7, fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(212,175,55,0.06)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div style={{ fontWeight: 900, color: '#D4AF37', marginBottom: '0.35rem' }}>
                  🎯 مزايا الترقية للشريك المحترف والموثق:
                </div>
                <ul style={{ margin: 0, paddingRight: '1.2rem', color: '#cbd5e1' }}>
                  <li><strong>تصدر نتائج البحث:</strong> ظهور نشاطك في المراكز الأولى عند بحث السياح عن رحلات وسفاري وفنادق سيوة.</li>
                  <li><strong>إدراجك في مخطط الرحلات (Smart Journey Planner):</strong> ربط خدماتك في برامج الزوار الشاملة.</li>
                  <li><strong>صانع الستوري والفيديوهات:</strong> أدوات تصميم مخصصة لإنستغرام وتيك توك باسمك وشعارك.</li>
                  <li><strong>شارة التوثيق الرسمية (Verified Partner):</strong> تزيد ثقة السائح وتضاعف الحجوزات 3 أضعاف.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(34,197,94,0.06)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontWeight: 900, color: '#4ade80', marginBottom: '0.35rem' }}>
                  🎟️ نظام الكوبونات والتفاوض الخاص:
                </div>
                <div style={{ color: '#cbd5e1' }}>
                  نحن نعمل بنظام الشراكة المرنة! إذا قدمت كود خصم أو كوبون حصري لزوار المنصة، نقوم بتمييز نشاطك مجاناً وإبراز عرضك في الصفحة الرئيسية وعلى منصاتنا في السوشيال ميديا.
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 900, color: '#fff', marginBottom: '0.4rem' }}>
                  📞 كيف تبدأ الترقية أو الاتفاق على كوبون؟
                </div>
                <div style={{ color: '#94a3b8' }}>
                  تواصل مباشرة مع إدارة المنصة عبر واتساب، وسيتم تفعيل الميزات الإضافية لحسابك فوراً.
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                إغلاق
              </button>

              <a
                href={`https://wa.me/201000000000?text=${encodeURIComponent(`مرحباً إدارة SiWiFy، أرغب في ترقية حسابي (${biz?.name}) والاتفاق على تقديم كوبون خصم للزوار.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.65rem 1.35rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                  color: '#070B12',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                }}
              >
                <span>طلب الترقية والتفاوض عبر واتساب ⚡</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
