'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/context/LangContext';

interface BusinessDetails {
  id: string;
  name: string;
  slug: string;
  type_id: string;
  type_name: string;
  type_icon: string;
  type_color: string;
  parent_type_name: string;
  subscription_tier: string;
  is_claimed: boolean;
  phone?: string;
}

interface UnclaimedBiz {
  id: string;
  name: string;
  slug: string;
  type_id: string;
  type_name: string;
  type_icon: string;
  type_color: string;
  parent_type_name: string;
  template_name: string | null;
  subscription_tier: string;
  isMatchingType: boolean;
  created_at: string;
}

interface DirectoryData {
  vendorTypeId: string | null;
  vendorTypeName: string | null;
  myType: UnclaimedBiz[];
  others: UnclaimedBiz[];
  total: number;
}

function VendorClaimContent() {
  const { isRTL } = useLang();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const initialTier = searchParams.get('tier');

  // Single business claim state
  const [targetBiz, setTargetBiz] = useState<BusinessDetails | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(Boolean(slug));
  const [bizError, setBizError] = useState<string | null>(null);

  // Form inputs for direct claim
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Directory claim state (for logged-in vendors browsing)
  const [dirData, setDirData] = useState<DirectoryData | null>(null);
  const [loadingDir, setLoadingDir] = useState(false);
  const [dirError, setDirError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Load single business if slug is present
  useEffect(() => {
    if (!slug) return;
    async function loadBiz() {
      setLoadingBiz(true);
      setBizError(null);
      try {
        const res = await fetch(`/api/vendor/claim?slug=${encodeURIComponent(slug!)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'لم يتم العثور على النشاط التجاري المطلوب');
        }
        setTargetBiz(data.business);
        if (data.business?.phone) {
          setPhone(data.business.phone);
        }
      } catch (err: any) {
        setBizError(err.message || 'خطأ في جلب بيانات النشاط');
      } finally {
        setLoadingBiz(false);
      }
    }
    loadBiz();
  }, [slug]);

  // Load directory if no slug
  useEffect(() => {
    if (slug) return;
    async function loadDirectory() {
      setLoadingDir(true);
      setDirError(null);
      try {
        const res = await fetch('/api/vendor/claim');
        const data = await res.json();
        if (res.ok) {
          setDirData(data);
        } else {
          setDirError(data.error || 'يرجى تسجيل الدخول لعرض الأنشطة المتاحة');
        }
      } catch (err: any) {
        setDirError(err.message);
      } finally {
        setLoadingDir(false);
      }
    }
    loadDirectory();
  }, [slug]);

  // Handle claiming with phone + password
  async function handleDirectClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) {
      setBizError('يرجى إدخال رقم الهاتف وكلمة المرور');
      return;
    }
    setSubmitting(true);
    setBizError(null);
    try {
      const res = await fetch('/api/vendor/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: targetBiz?.slug || slug,
          businessId: targetBiz?.id,
          phone,
          password,
          owner_name: ownerName || targetBiz?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل في استلام الحساب');
      }
      setSubmitSuccess(data.message || 'تم تأكيد واستلام نشاطك بنجاح! جاري تحويلك...');
      setTimeout(() => {
        window.location.href = data.redirect || `/vendor/app?slug=${targetBiz?.slug || slug}&claimed=1`;
      }, 1200);
    } catch (err: any) {
      setBizError(err.message || 'حدث خطأ أثناء معالجة الطلب');
    } finally {
      setSubmitting(false);
    }
  }

  // ── RENDER 1: SINGLE BUSINESS CLAIM (From WhatsApp Invitation) ──
  if (slug) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        fontFamily: isRTL ? "'Noto Sans Arabic', 'Cairo', sans-serif" : "'Inter', system-ui, sans-serif",
        direction: isRTL ? 'rtl' : 'ltr',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}>
        <div style={{
          maxWidth: '560px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.06), 0 4px 10px -2px rgba(0,0,0,0.03)',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        }}>
          {/* Header Brand */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(212,175,55,0.12)',
              color: '#B48608',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '50px',
              padding: '0.3rem 0.85rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '1px',
              marginBottom: '0.85rem',
            }}>
              <span>🌴</span> SIWIFY · تأكيد ملكية النشاط التجاري
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 900, color: '#0F172A' }}>
              مرحباً بك في سيوة الرقمية! ✨
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6 }}>
              تم إعداد صفحتك وتطبيقك وموقعك على منصة سيوايفاي، فقط أكّد ملكيتك واستلم لوحة تحكمك.
            </p>
          </div>

          {loadingBiz ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#B48608' }}>
              <div style={{ width: 44, height: 44, border: '4px solid #E2E8F0', borderTop: '4px solid #B48608', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>جاري استرجاع بيانات نشاطك...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : targetBiz?.is_claimed ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                نشاط &quot;{targetBiz.name}&quot; مفعل ومملوك بالفعل
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                هذا النشاط مرتبط بالفعل بحساب معتمد على المنصة. إذا كنت صاحب هذا النشاط، تفضل بتسجيل الدخول مباشرة.
              </p>
              <Link
                href={`/login?redirect=/vendor/app?slug=${targetBiz.slug}`}
                style={{
                  display: 'inline-block',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  padding: '0.85rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                تسجيل الدخول إلى لوحة التحكم ➔
              </Link>
            </div>
          ) : (
            <>
              {/* Business Identity Card */}
              {targetBiz && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginBottom: '1.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      النشاط التجاري المراد استلامه
                    </span>
                    <span style={{
                      background: '#DCFCE7',
                      color: '#166534',
                      border: '1px solid #86EFAC',
                      borderRadius: '8px',
                      padding: '0.15rem 0.55rem',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                    }}>
                      جاهز للاستلام 0% عمولة
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.35rem' }}>
                    {targetBiz.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>📂 {targetBiz.parent_type_name} ➔ {targetBiz.type_name}</span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#B48608', fontWeight: 700 }}>
                      باقة: {initialTier || targetBiz.subscription_tier}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {bizError && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                }}>
                  ⚠️ {bizError}
                </div>
              )}

              {/* Success Message */}
              {submitSuccess && (
                <div style={{
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#166534',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                }}>
                  🎉 {submitSuccess}
                </div>
              )}

              {/* Claim Form */}
              <form onSubmit={handleDirectClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    📱 رقم الهاتف أو الواتساب:
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.25rem', display: 'block' }}>
                    هذا الرقم سيُستخدم لتسجيل دخولك وتلقي تنبيهات الحجوزات المباشرة.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    👤 اسم المالك / المسؤول:
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="اسمك الكريم"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    🔑 أنشئ كلمة مرور لحسابك:
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="اختر كلمة مرور من 6 خانات على الأقل"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.95rem 1.5rem',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {submitting ? '⏳ جاري تفعيل الحساب...' : '✅ تأكيد الملكية واستلام لوحة تحكمك فوراً 🚀'}
                </button>
              </form>
            </>
          )}

          {/* Footer note */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              منصة سيوايفاي الرسمية · ربط مباشر بين مقدمي الخدمة والزوار بدون عمولات وسيطة.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER 2: DIRECTORY CLAIM (Fallback for logged-in vendors) ──
  return (
    <div style={{
      fontFamily: isRTL ? "'Noto Sans Arabic', 'Cairo', sans-serif" : "'Inter', system-ui, sans-serif",
      direction: isRTL ? 'rtl' : 'ltr',
      minHeight: '100vh',
      background: '#F8FAFC',
    }}>
      {/* Header */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
            🔑 تأكيد واستلام صفحة نشاطك التجاري
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.8rem' }}>
            اختر نشاطك التجاري لتأكيد ملكيتك وتفعيل تطبيقك وموقعك فوراً
          </p>
        </div>
        <Link
          href="/vendor"
          style={{
            color: '#64748B',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>←</span> العودة للوحة التحكم
        </Link>
      </div>

      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {dirError && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
              مرحباً بك في بوابة شركاء سيوة
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              {dirError}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link
                href="/login"
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/"
                style={{
                  background: '#F1F5F9',
                  color: '#334155',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                الصفحة الرئيسية
              </Link>
            </div>
          </div>
        )}

        {dirData && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="ابحث عن نشاطك بالاسم..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[...(dirData.myType || []), ...(dirData.others || [])]
                .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()))
                .map(biz => (
                  <div
                    key={biz.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                        {biz.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                        {biz.parent_type_name} ➔ {biz.type_name}
                      </div>
                    </div>
                    <Link
                      href={`/vendor/claim?slug=${biz.slug}`}
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                      }}
                    >
                      استلام النشاط ➔
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorClaimPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748B', fontWeight: 700 }}>جاري التحميل...</div>
      </div>
    }>
      <VendorClaimContent />
    </Suspense>
  );
}
