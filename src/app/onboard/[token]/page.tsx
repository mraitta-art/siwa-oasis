'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface InviteData {
  token: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  parent_type_name: string;
  child_type_name: string;
  child_type_regulations: string;
  subscription_tier: 'free' | 'pro' | 'verified_partner';
  dispatch_mode: 'direct' | 'gatekeeper';
  status: 'pending' | 'accepted' | 'expired' | 'claimed';
  is_claimed: boolean;
  expires_at: string;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free:             { label: '🆓 Free — مجاناً',                color: '#94a3b8' },
  pro:              { label: '⭐ Pro — احترافي',               color: '#D4AF37' },
  verified_partner: { label: '✅ Verified Partner — شريك معتمد', color: '#4ade80' },
};

export default function OnboardTokenPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [hasReadRules, setHasReadRules] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);
  const rulesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/onboard/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'رابط غير صالح أو منتهي الصلاحية');
        } else {
          setInvite(data);
          if (data.status === 'accepted') {
            setAccepted(true);
            setRedirect(`/vendor/claim?slug=${data.business_slug}&tier=${data.subscription_tier}&onboarded=1`);
          }
          // Direct mode: skip gatekeeper, go straight to claim
          if (data.dispatch_mode === 'direct' && data.status === 'pending') {
            setRedirect(`/vendor/claim?slug=${data.business_slug}&tier=${data.subscription_tier}`);
          }
        }
      } catch (e: any) {
        setError(e.message || 'خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Auto redirect
  useEffect(() => {
    if (redirect) {
      const timer = setTimeout(() => { window.location.href = redirect; }, 2000);
      return () => clearTimeout(timer);
    }
  }, [redirect]);

  async function handleAccept() {
    if (!hasReadRules) return;
    try {
      setAccepting(true);
      const res = await fetch(`/api/onboard/${token}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAccepted(true);
        setRedirect(data.redirect);
      } else {
        setError(data.error || 'فشل في قبول اللوائح');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAccepting(false);
    }
  }

  function handleRulesScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      setHasReadRules(true);
    }
  }

  const base: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #070B12 0%, #0f172a 50%, #0b1520 100%)',
    fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={base}>
        <div style={{ textAlign: 'center', color: '#D4AF37' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontSize: '1rem' }}>جاري تحميل بيانات الدعوة...</div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div style={base}>
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '24px',
          padding: '2.5rem',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#f87171', margin: '0 0 0.75rem', fontSize: '1.3rem', fontWeight: 900 }}>
            رابط غير صالح
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>{error}</p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.65rem 1.5rem',
              background: '#D4AF37',
              color: '#0f172a',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 900,
              fontSize: '0.9rem',
            }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  /* ── Redirect / Accepted ── */
  if (redirect || accepted) {
    return (
      <div style={base}>
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(74,222,128,0.35)',
          borderRadius: '24px',
          padding: '2.5rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#4ade80', margin: '0 0 0.75rem', fontSize: '1.4rem', fontWeight: 900 }}>
            تم القبول بنجاح!
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6 }}>
            مرحباً بك في منصة سيوايفاي! جاري تحويلك لصفحة استلام حسابك...
          </p>
          <div style={{ marginTop: '1.5rem', width: '100%', height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #D4AF37, #4ade80)',
              animation: 'pgbar 2s linear forwards',
            }} />
          </div>
          <style>{`@keyframes pgbar { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const tierInfo = TIER_LABELS[invite.subscription_tier] || { label: invite.subscription_tier, color: '#94a3b8' };

  const defaultRegulations = `بوصفك مزوداً معتمداً ضمن تصنيف "${invite.child_type_name}" على منصة سيوايفاي، أنت توافق على الالتزام بما يلي:

1. تقديم خدماتك بمستوى عالٍ من الاحترافية والصدق مع العملاء.
2. الالتزام بالأسعار المُعلنة على صفحتك دون مفاجآت.
3. الرد على استفسارات العملاء خلال 24 ساعة كحد أقصى.
4. عدم تقديم معلومات مضللة أو صور غير حقيقية لخدماتك.
5. الامتثال لجميع قوانين السياحة والخدمات المحلية في واحة سيوة.
6. منح سيوايفاي حق الإزالة الفورية للحساب في حال الإخلال بهذه اللوائح.
7. الالتزام بمبادئ الاستدامة البيئية والتراث الثقافي لسيوة.

بالنقر على "قبول اللوائح والانضمام" أنت تؤكد أنك صاحب النشاط أو ممثله المفوض، وتلتزم بجميع الشروط والأحكام أعلاه.`;

  return (
    <div style={base}>
      <div style={{ width: '100%', maxWidth: '720px' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>
            SIWIFY · بوابة الانضمام الرسمية
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, color: '#f8fafc', lineHeight: 1.2 }}>
            مرحباً بك في سيوايفاي 🌴
          </h1>
          <p style={{ margin: '0.75rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            دعوة رسمية لـ <strong style={{ color: '#D4AF37' }}>{invite.business_name}</strong>
          </p>
        </div>

        {/* BUSINESS IDENTITY CARD */}
        <div style={{
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '18px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px', marginBottom: '0.3rem' }}>
              التصنيف المعتمد
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
              {invite.parent_type_name} ➔ {invite.child_type_name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1.5px', marginBottom: '0.3rem' }}>
              الباقة المخصصة
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: tierInfo.color }}>
              {tierInfo.label}
            </div>
          </div>
        </div>

        {/* REGULATIONS PANEL */}
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{
            margin: '0 0 1rem',
            color: '#D4AF37',
            fontSize: '0.95rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>📜</span>
            لوائح وأنظمة التشغيل المعتمدة — {invite.child_type_name}
          </h3>

          <div
            ref={rulesRef}
            onScroll={handleRulesScroll}
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              lineHeight: 1.85,
              color: '#cbd5e1',
              fontSize: '0.88rem',
              whiteSpace: 'pre-wrap',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(212,175,55,0.3) transparent',
            }}
          >
            {invite.child_type_regulations?.trim() || defaultRegulations}
          </div>

          <div style={{ marginTop: '0.85rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasReadRules ? (
              <span style={{ color: '#4ade80', fontWeight: 700 }}>✓ تمت قراءة اللوائح والأنظمة بالكامل</span>
            ) : (
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>⬇ يرجى التمرير لأسفل لقراءة اللوائح كاملة قبل القبول</span>
            )}
          </div>
        </div>

        {/* ACCEPTANCE CHECKBOX */}
        {!hasReadRules && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="force-read"
              onChange={(e) => { if (e.target.checked) setHasReadRules(true); }}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#D4AF37' }}
            />
            <label htmlFor="force-read" style={{ fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
              أقر بأنني قرأت ووافقت على جميع اللوائح والأنظمة المذكورة أعلاه
            </label>
          </div>
        )}

        {/* ACCEPT BUTTON */}
        <button
          type="button"
          onClick={handleAccept}
          disabled={!hasReadRules || accepting}
          style={{
            width: '100%',
            padding: '1.1rem',
            borderRadius: '16px',
            background: hasReadRules
              ? 'linear-gradient(135deg, #D4AF37 0%, #f59e0b 100%)'
              : '#1e293b',
            color: hasReadRules ? '#0f172a' : '#475569',
            border: 'none',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: hasReadRules ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: hasReadRules ? '0 8px 25px rgba(212,175,55,0.35)' : 'none',
            letterSpacing: '0.5px',
          }}
        >
          {accepting ? '⏳ جاري المعالجة...' : '✅ قبول اللوائح والانضمام لسيوايفاي 🚀'}
        </button>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: '#475569', lineHeight: 1.6 }}>
          بقبولك أنت تؤكد أنك صاحب النشاط أو ممثله المفوض.
          <br />
          ينتهي هذا الرابط في:{' '}
          {invite.expires_at
            ? new Date(invite.expires_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'قريباً'}
        </div>
      </div>
    </div>
  );
}
