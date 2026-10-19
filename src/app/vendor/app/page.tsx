'use client';

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

export default function VendorAppHubPage() {
  const searchParams = useSearchParams();
  const slugParam = searchParams.get('slug');

  const [biz, setBiz] = useState<BusinessDetails | null>(null);
  const [permissions, setPermissions] = useState<PermissionsMap>({
    minisite: true,
    social_bio: true,
    profile_editor: true,
  });
  const [loading, setLoading] = useState(true);
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadData();
  }, [slugParam]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch vendor's current business profile
      let bizData: any = null;
      const resBiz = await fetch('/api/vendor/business');
      if (resBiz.ok) {
        bizData = await resBiz.json();
      }

      // If no business loaded via session, try fetching by slug or demo fallback
      if (!bizData?.id && slugParam) {
        const resPublic = await fetch(`/api/businesses/${slugParam}`);
        if (resPublic.ok) {
          bizData = await resPublic.json();
        }
      }

      if (!bizData?.id) {
        // Fallback placeholder for newly claimed / demo vendor
        bizData = {
          id: 'demo-vendor',
          name: 'نشاطك التجاري في سيوة',
          slug: slugParam || 'siwa-partner',
          subscription_tier: 'pro',
          is_claimed: true,
        };
      }

      setBiz(bizData);

      // 2. Load Permissions for this business
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

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://siwify.com';
  const minisiteUrl = `${origin}/${biz?.slug || 'my-page'}`;
  const bioText = `🌴 احجز معنا مباشرة عبر موقعنا الرسمي في سيوة:\n🔗 ${minisiteUrl}`;

  function copyToClipboard(text: string, isBio = false) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isBio) {
        setCopiedBio(true);
        setTimeout(() => setCopiedBio(false), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
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
        fontFamily: "'Inter', 'Cairo', sans-serif",
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

        {/* ─── TOP BAR ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
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

          <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: currentTier.bg,
            color: currentTier.color,
            border: `1px solid ${currentTier.border}`,
            fontSize: '0.72rem',
            fontWeight: 800,
          }}>
            {currentTier.label}
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
              onClick={() => copyToClipboard(minisiteUrl, false)}
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
              onClick={() => copyToClipboard(bioText, true)}
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
            عندما يضغط عليه السياح سيفتح كارتك الشخصي للحجز المباشر بالأسعار والواتساب بدون عمولة (0%).
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
                transition: 'transform 0.2s',
              }}
            >
              <div style={{ fontSize: '1.6rem' }}>✏️</div>
              <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#f8fafc' }}>
                تعديل الصور والأسعار
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                تحديث صور المركبة، الأسعار، وأرقام الاتصال
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
              <div style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.15rem',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                <div style={{ fontSize: '1.6rem', filter: 'grayscale(1)' }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>صانع الستوري</div>
                <div style={{ fontSize: '0.7rem' }}>متاح في الباقة الاحترافية (Pro)</div>
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
              <div style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.15rem',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                <div style={{ fontSize: '1.6rem', filter: 'grayscale(1)' }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>استوديو الباقات</div>
                <div style={{ fontSize: '0.7rem' }}>متاح للشركاء المعتمدين</div>
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
              <div style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.15rem',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                <div style={{ fontSize: '1.6rem', filter: 'grayscale(1)' }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>إحصائيات الزيارات</div>
                <div style={{ fontSize: '0.7rem' }}>يتطلب ترقية الباقة</div>
              </div>
            )}

          </div>
        </div>

        {/* ─── QUICK WHATSAPP SUPPORT FOR VENDOR ────────────────────────── */}
        <div style={{
          background: 'rgba(37,211,102,0.08)',
          border: '1px solid rgba(37,211,102,0.25)',
          borderRadius: '18px',
          padding: '1.1rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#4ade80' }}>
              💬 خط دعم الشركاء في سيوة
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
              فريق جنا معك خطوة بخطوة لأي استفسار أو ترقية لباقات أعلى
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
            <span>واتساب الدعم</span>
            <span>💬</span>
          </a>
        </div>

      </div>
    </div>
  );
}
