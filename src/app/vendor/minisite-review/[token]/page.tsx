'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import MinisiteBuilderRenderer from '@/components/MinisiteBuilderRenderer';
import { VENDOR_AGREEMENT_SECTIONS, VENDOR_PLEDGE_ACKNOWLEDGMENT } from '@/lib/vendor-agreement';
import { VENDOR_CONSENT_VERSION, VENDOR_OPTIONAL_CONSENTS, VENDOR_SOCIAL_FIELDS } from '@/lib/vendor-consents';
import type { MinisiteLayout } from '@/lib/minisite-layout';

interface ReviewPayload {
  business: {
    id: string;
    name: string;
    slug: string;
    type_id: string;
    type_name: string;
    custom_data: Record<string, unknown>;
    gallery: Array<Record<string, unknown>>;
    blogs: Array<Record<string, unknown>>;
    tourProducts: Array<Record<string, unknown>>;
    siteSettings: Record<string, unknown>;
  };
  handoff: { id: string; revision: number; status: string; layout: MinisiteLayout };
  agreementVersion: string;
}

export default function VendorMinisiteReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [consents, setConsents] = useState<Record<string, boolean>>({
    social_links: false,
    google_place_data: false,
  });
  const [social, setSocial] = useState<Record<string, string>>({
    instagram_handle: '',
    facebook_link: '',
    tiktok_handle: '',
  });
  const [googleProfileUrl, setGoogleProfileUrl] = useState('');

  useEffect(() => {
    if (navigator.language.toLowerCase().startsWith('ar')) setLanguage('ar');
    fetch(`/api/vendor/minisite-review/${encodeURIComponent(token)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load the invitation.');
        setPayload(data);
        const customData = (data?.business?.custom_data || {}) as Record<string, any>;
        const identity = (customData.identity || {}) as Record<string, string>;
        setSocial({
          instagram_handle: identity.instagram_handle || '',
          facebook_link: identity.facebook_link || '',
          tiktok_handle: identity.tiktok_handle || '',
        });
        if (typeof customData.google_profile_url === 'string') setGoogleProfileUrl(customData.google_profile_url);
      })
      .catch(cause => setError(cause.message || 'Unable to load the invitation.'));
  }, [token]);

  async function acceptInvitation() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/vendor/minisite-review/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          language,
          consents,
          social,
          googleProfileUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to activate your SIWIFY page.');
      window.location.assign(data.redirect || `/vendor/app?slug=${encodeURIComponent(payload?.business.slug || '')}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to activate your SIWIFY page.');
      setBusy(false);
    }
  }

  if (error && !payload) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>{language === 'ar' ? 'تعذر فتح الدعوة' : 'Invitation unavailable'}</h1>
          <p>{error}</p>
          <Link href="/" style={linkStyle}>{language === 'ar' ? 'العودة إلى SiWiFy' : 'Return to SiWiFy'}</Link>
        </section>
      </main>
    );
  }
  if (!payload) {
    return <main style={pageStyle}><section style={cardStyle}>{language === 'ar' ? 'جارٍ تجهيز صفحتك…' : 'Preparing your SIWIFY page…'}</section></main>;
  }

  const isArabic = language === 'ar';
  const isPublished = payload.handoff.status === 'published';

  return (
    <main style={{ ...pageStyle, direction: isArabic ? 'rtl' : 'ltr' }}>
      <header style={{ ...cardStyle, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
        <p style={{ margin: 0, color: '#9a6b00', fontWeight: 800 }}>SIWIFY · {isArabic ? 'موقعك جاهز' : 'YOUR MINISITE IS READY'}</p>
        <h1 style={{ margin: '8px 0', color: '#0f172a' }}>
          {isArabic ? `مبروك، ${payload.business.name}!` : `Congratulations, ${payload.business.name}!`}
        </h1>
        <p style={{ margin: 0, color: '#475569' }}>
          {isArabic
            ? 'صفحتك جاهزة على SiWiFy. اضغط مرة واحدة للموافقة وتفعيل الوصول إلى صفحتك ولوحة التحكم.'
            : 'Your SIWIFY page is ready. Tap once to approve it and activate your page and dashboard access.'}
        </p>
      </header>

      <section style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <MinisiteBuilderRenderer layout={payload.handoff.layout} business={payload.business} />
      </section>

      <section style={{ ...cardStyle, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18, color: '#0f172a' }}>
          {isArabic ? 'روابطك وبيانات جوجل (اختياري)' : 'Your links & Google data (optional)'}
        </h2>
        <p style={{ marginTop: 0, color: '#475569', fontSize: 13, lineHeight: 1.7 }}>
          {isArabic
            ? 'هذه الإذونات منفصلة عن الاتفاقية وليست إلزامية. يمكنك منحها أو سحبها لاحقًا من لوحة التحكم.'
            : 'These permissions are separate from the agreement and are not required. You can grant or withdraw each one later from your dashboard.'}
        </p>

        {VENDOR_OPTIONAL_CONSENTS.map(consent => (
          <div key={consent.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(consents[consent.id])}
                onChange={event => setConsents(current => ({ ...current, [consent.id]: event.target.checked }))}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: '#0f766e' }}
              />
              <span>
                <strong style={{ color: '#0f172a' }}>{isArabic ? consent.titleAr : consent.title}</strong>
                <span style={{ display: 'block', color: '#64748b', fontSize: 12, lineHeight: 1.6, marginTop: 2 }}>
                  {isArabic ? consent.bodyAr : consent.body}
                </span>
              </span>
            </label>

            {consent.id === 'social_links' && consents.social_links && (
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {VENDOR_SOCIAL_FIELDS.map(field => (
                  <label key={field.key} style={fieldLabelStyle}>
                    {field.label}
                    <input
                      value={social[field.key] || ''}
                      onChange={event => setSocial(current => ({ ...current, [field.key]: event.target.value }))}
                      placeholder={field.placeholder}
                      style={inputStyle}
                    />
                  </label>
                ))}
              </div>
            )}

            {consent.id === 'google_place_data' && consents.google_place_data && (
              <label style={{ ...fieldLabelStyle, marginTop: 12 }}>
                {isArabic ? 'رابط ملفك على خرائط جوجل' : 'Your Google Maps profile link'}
                <input
                  value={googleProfileUrl}
                  onChange={event => setGoogleProfileUrl(event.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  style={inputStyle}
                />
                <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 500 }}>
                  {isArabic
                    ? 'نقرأ البيانات العامة فقط (التقييم، عدد المراجعات، ساعات العمل).'
                    : 'We read public data only (rating, review count, opening hours). Nothing is posted to your Google profile.'}
                </span>
              </label>
            )}
          </div>
        ))}
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 11 }}>
          {isArabic ? 'إصدار الإذن' : 'Consent version'} {VENDOR_CONSENT_VERSION}
        </p>
      </section>

      <section style={cardStyle}>
        <p style={{ marginTop: 0, color: '#334155', lineHeight: 1.7 }}>
          {isArabic
            ? 'بالضغط على «موافق وتفعيل صفحتي»، تؤكد أنك مخول بإدارة هذا النشاط، وتوافق على بيانات الصفحة المعروضة واتفاقية مشاركة البائعين في SiWiFy.'
            : 'By tapping “Accept & activate my SIWIFY page,” you confirm you are authorized to manage this business, approve the page shown above, and accept the SiWiFy Vendor Participation Agreement.'}
        </p>

        <div style={{ marginBottom: 18, padding: 14, background: '#f8fafc', border: '1px solid #cbd5e1', borderLeft: '4px solid #0f766e', borderRadius: 10 }}>
          <strong style={{ display: 'block', marginBottom: 6, color: '#0f172a' }}>
            {isArabic ? 'التزام الظهور المتبادل (الخطة المجانية)' : 'Mutual visibility (free plan)'}
          </strong>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.65, fontSize: 13 }}>
            {isArabic ? VENDOR_PLEDGE_ACKNOWLEDGMENT.ar : VENDOR_PLEDGE_ACKNOWLEDGMENT.en}
          </p>
          <p style={{ margin: '8px 0 0', color: '#0f766e', fontWeight: 700, fontSize: 12 }}>
            {isArabic
              ? 'لا نطلب كلمات المرور أبدًا، ولن يُحذف موقعك إذا لم يظهر الرابط.'
              : 'We never ask for passwords, and your minisite is never deleted if the link is missing.'}
          </p>
        </div>
        <details style={{ marginBottom: 18 }}>
          <summary style={{ cursor: 'pointer', color: '#475569', fontWeight: 700 }}>
            {isArabic ? `عرض اتفاقية البائعين (${payload.agreementVersion})` : `View vendor agreement (${payload.agreementVersion})`}
          </summary>
          <div style={{ maxHeight: 280, overflow: 'auto', marginTop: 12, padding: 14, border: '1px solid #e2e8f0', borderRadius: 10 }}>
            {VENDOR_AGREEMENT_SECTIONS.map(section => (
              <article key={section.title} style={{ marginBottom: 12 }}>
                <strong>{isArabic ? section.titleAr : section.title}</strong>
                <p style={{ lineHeight: 1.7, margin: '5px 0' }}>{isArabic ? section.bodyAr : section.body}</p>
              </article>
            ))}
          </div>
        </details>
        {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
        {isPublished ? (
          <p role="status" style={{ color: '#166534', fontWeight: 700 }}>
            {isArabic ? 'تم تفعيل صفحتك. جارٍ فتح لوحة التحكم…' : 'Your page is active. Opening your dashboard…'}
          </p>
        ) : (
          <button type="button" disabled={busy} onClick={acceptInvitation} style={primaryButton}>
            {busy
              ? (isArabic ? 'جارٍ التفعيل…' : 'Activating…')
              : (isArabic ? 'موافق وتفعيل صفحتي' : 'Accept & activate my SIWIFY page')}
          </button>
        )}
      </section>
      <footer style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>SiWiFy · {isArabic ? 'صفحتك، بإدارتك' : 'Your page, managed by you'}</footer>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f1f5f9', padding: '24px max(16px, calc((100vw - 1100px) / 2))', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,.05)' };
const primaryButton: React.CSSProperties = { display: 'block', width: '100%', border: 0, borderRadius: 10, padding: '15px 18px', background: '#0f766e', color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer' };
const linkStyle: React.CSSProperties = { color: '#0f766e', fontWeight: 700 };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#fff' };
const fieldLabelStyle: React.CSSProperties = { display: 'grid', gap: 2, fontSize: 12, fontWeight: 700, color: '#475569' };
