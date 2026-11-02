'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import VendorTierFeatureModal from '@/components/VendorTierFeatureModal';

interface LocaleContent {
  hero_title_lead: string;
  hero_title_highlight: string;
  hero_subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  benefit1_title: string;
  benefit1_text: string;
  benefit2_title: string;
  benefit2_text: string;
  benefit3_title: string;
  benefit3_text: string;
  form_title: string;
  form_subtitle: string;
  label_business_name: string;
  ph_business_name: string;
  label_email: string;
  ph_email: string;
  label_password: string;
  ph_password: string;
  label_type: string;
  ph_select_type: string;
  btn_submit: string;
  btn_submitting: string;
  success_title: string;
  success_message: string;
  btn_dashboard: string;
  or_full_wizard: string;
  link_full_wizard: string;
}

const CONTENT: Record<'ar' | 'en', LocaleContent> = {
  ar: {
    hero_title_lead: 'طوّر ونمّ أعمالك في ',
    hero_title_highlight: 'واحة سيوة ومصر',
    hero_subtitle:
      'انضم إلى المنصة الرقمية الأولى للفنادق والمنتجعات، المطاعم، الجولات، والمشروعات العقارية. احصل على موقع مصغر تفاعلي سينمائي وتواصل مباشرة مع آلاف الزوار والعملاء.',
    cta_primary: 'ابدأ التسجيل الآن',
    cta_secondary: 'تصفح المنصة',
    benefit1_title: 'مواقع مصغرة سينمائية',
    benefit1_text:
      'اعرض نشاطك التجاري بصفحة متطورة بتصميم المجلات الفاخرة مخصصة لسرد قصة علامتك وتفاصيل خدماتك.',
    benefit2_title: 'ظهور واكتشاف متميز',
    benefit2_text:
      'اظهر في نتائج البحث المتقدم والمقارنات الذكية المصفاة بحسب الأجواء، والموقع الجغرافي، والمميزات الحصرية.',
    benefit3_title: 'إدارة ذاتية مرنة',
    benefit3_text:
      'حدّث بياناتك، صورك، عروضك، وقوائمك في أي وقت بكل سهولة عبر لوحة تحكم البائع الخاصة بك.',
    form_title: 'انضم كشريك في المنصة',
    form_subtitle: 'سجّل نشاطك التجاري اليوم وابدأ رحلتك الرقمية.',
    label_business_name: 'اسم النشاط التجاري',
    ph_business_name: 'مثال: منتجع وردة الصحراء البيئي',
    label_email: 'البريد الإلكتروني',
    ph_email: 'contact@yourbusiness.com',
    label_password: 'كلمة المرور',
    ph_password: '٨ أحرف على الأقل',
    label_type: 'فئة النشاط',
    ph_select_type: 'اختر نوع النشاط التجاري…',
    btn_submit: 'إنشاء الحساب',
    btn_submitting: 'جارٍ التسجيل…',
    success_title: 'مرحبًا بك في المنصة!',
    success_message:
      'تم إنشاء حساب الشريك بنجاح. سيقوم فريقنا بمراجعة طلبك وتفعيل بياناتك للتواصل المباشر.',
    btn_dashboard: 'الانتقال إلى لوحة تحكم البائع ←',
    or_full_wizard: 'هل ترغب في المطالبة بملف موجود أو تسجيل نشاط بالهاتف مباشرة؟',
    link_full_wizard: 'استخدم معالج التسجيل الكامل المتقدم ←',
  },
  en: {
    hero_title_lead: 'Grow Your Business in ',
    hero_title_highlight: 'Siwa Oasis & Egypt',
    hero_subtitle:
      'Join the premium marketplace for hotels, eco-lodges, restaurants, 4x4 safaris, and real estate developments. Get your own cinematic mini-site and reach thousands of explorers.',
    cta_primary: 'GET STARTED',
    cta_secondary: 'EXPLORE PLATFORM',
    benefit1_title: 'Cinematic Mini-Sites',
    benefit1_text:
      'Showcase your business with a high-fidelity, magazine-style page designed for storytelling and direct bookings.',
    benefit2_title: 'Premium Discovery',
    benefit2_text:
      'Appear in advanced search and comparisons filtered by atmosphere, vibe, geographic market, and specific attributes.',
    benefit3_title: 'Self-Management',
    benefit3_text:
      'Update your menu, photos, inventory, and availability anytime through your dedicated vendor dashboard.',
    form_title: 'Become a Partner',
    form_subtitle: 'Start your journey with us today.',
    label_business_name: 'BUSINESS NAME',
    ph_business_name: 'e.g. Desert Rose Eco Lodge',
    label_email: 'EMAIL ADDRESS',
    ph_email: 'contact@yourbusiness.com',
    label_password: 'PASSWORD',
    ph_password: 'Min. 8 characters',
    label_type: 'BUSINESS TYPE',
    ph_select_type: 'Select your business type…',
    btn_submit: 'CREATE ACCOUNT',
    btn_submitting: 'PROCESSING…',
    success_title: 'Welcome to the Platform!',
    success_message:
      'Your partner account has been created. Our team will review your application and contact you shortly.',
    btn_dashboard: 'GO TO VENDOR DASHBOARD →',
    or_full_wizard: 'Looking to claim an existing listing or use phone-first onboarding?',
    link_full_wizard: 'Use the Full Vendor Intake Wizard →',
  },
};

export default function BeAPartnerPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Route-based language detection: /en/* is English, bare path is Arabic (Egypt-first standard)
  const isEn = pathname?.startsWith('/en');
  const locale: 'ar' | 'en' = isEn ? 'en' : 'ar';
  const t = CONTENT[locale];
  const isRtl = locale === 'ar';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [builderConfig, setBuilderConfig] = useState<any>(null);

  // Form field state
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [typologyId, setTypologyId] = useState('');

  useEffect(() => {
    // Load CMS config if exists
    fetch('/api/jana/website?id=website_be-a-partner')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const config = Array.isArray(data) ? data[0] : data;
          const layout = [
            ...(config?.header_components || []),
            ...(config?.body_components || []),
            ...(config?.footer_components || []),
          ];
          if (layout.length > 0) {
            setBuilderConfig({ ...config, layout });
          }
        }
      })
      .catch(() => {});

    // Load business types
    fetch('/api/jana/types')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const arr = Array.isArray(data) ? data : data.types || [];
          setTypes(
            arr.map((item: any) => ({
              id: String(item.id),
              name: isRtl && item.name_ar ? item.name_ar : item.name || item.label || item.id,
            }))
          );
        }
      })
      .catch(() => {});
  }, [isRtl]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, email, password, typologyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isRtl ? 'فشل التسجيل، يرجى المحاولة مرة أخرى.' : 'Registration failed. Please try again.'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(
        isRtl
          ? 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.'
          : 'Network error. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (builderConfig) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
        <DynamicHomepageRenderer layout={builderConfig.layout} settings={builderConfig.site_settings || null} pageId="be-a-partner" />
      </div>
    );
  }

  const signupUrl = isEn ? '/en/signup' : '/signup';
  const homeUrl = isEn ? '/en' : '/';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: '#fff',
        color: '#1a1a2e',
        fontFamily: isRtl ? "'Cairo', system-ui, -apple-system, sans-serif" : "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          padding: '6rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0a0f1e 0%, #1e293b 100%)',
          color: '#fff',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: '1.5rem', [isRtl ? 'left' : 'right']: '2rem' }}>
          <Link
            href={isEn ? '/be-a-partner' : '/en/be-a-partner'}
            style={{
              color: '#D4AF37',
              fontSize: '0.85rem',
              fontWeight: 800,
              textDecoration: 'none',
              padding: '0.4rem 0.9rem',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: 20,
              background: 'rgba(212,175,55,0.1)',
            }}
          >
            {isEn ? 'العربية' : 'English'}
          </Link>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {t.hero_title_lead}
          <span style={{ color: '#D4AF37' }}>{t.hero_title_highlight}</span>
        </h1>
        <p
          style={{
            fontSize: '1.2rem',
            opacity: 0.85,
            maxWidth: '750px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          {t.hero_subtitle}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#register"
            style={{
              background: '#D4AF37',
              color: '#0a0f1e',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              fontWeight: 900,
              textDecoration: 'none',
              boxShadow: '0 10px 25px rgba(212,175,55,0.3)',
            }}
          >
            {t.cta_primary}
          </a>
          <Link
            href={homeUrl}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {t.cta_secondary}
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
          {[
            { icon: '🎬', title: t.benefit1_title, text: t.benefit1_text },
            { icon: '🔍', title: t.benefit2_title, text: t.benefit2_text },
            { icon: '📊', title: t.benefit3_title, text: t.benefit3_text },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                background: '#f8fafc',
                padding: '2rem',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{b.icon}</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.8rem', color: '#0f172a' }}>{b.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '0.95rem' }}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" style={{ padding: '5rem 2rem', background: '#f8fafc' }}>
        <div
          style={{
            maxWidth: '540px',
            margin: '0 auto',
            background: '#fff',
            padding: '3rem 2.5rem',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
            border: '1px solid #eef2f6',
          }}
        >
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
              <h2 style={{ fontWeight: 900, marginBottom: '1rem', color: '#0f172a' }}>{t.success_title}</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>{t.success_message}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => router.push('/vendor')}
                  style={{
                    width: '100%',
                    background: '#D4AF37',
                    color: '#0a0f1e',
                    padding: '1.1rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t.btn_dashboard}
                </button>
              </div>
              <VendorTierFeatureModal forceOpen={true} businessName={businessName} onClose={() => router.push('/vendor')} />
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 900, marginBottom: '0.5rem', fontSize: '1.85rem', color: '#0f172a' }}>{t.form_title}</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>{t.form_subtitle}</p>

              {error && (
                <div
                  style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    padding: '0.875rem 1rem',
                    borderRadius: '10px',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '1.35rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.45rem', fontSize: '0.82rem', color: '#334155' }}>
                    {t.label_business_name}
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={t.ph_business_name}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem',
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.35rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.45rem', fontSize: '0.82rem', color: '#334155' }}>
                    {t.label_email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.ph_email}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem',
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.35rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.45rem', fontSize: '0.82rem', color: '#334155' }}>
                    {t.label_password}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.ph_password}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem',
                    }}
                    minLength={8}
                    required
                  />
                </div>

                {types.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.45rem', fontSize: '0.82rem', color: '#334155' }}>
                      {t.label_type}
                    </label>
                    <select
                      value={typologyId}
                      onChange={(e) => setTypologyId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.9rem 1rem',
                        borderRadius: '12px',
                        border: '2px solid #e2e8f0',
                        outline: 'none',
                        background: '#fff',
                        boxSizing: 'border-box',
                        fontSize: '0.95rem',
                      }}
                      required
                    >
                      <option value="">{t.ph_select_type}</option>
                      {types.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#94a3b8' : '#0a0f1e',
                    color: '#fff',
                    padding: '1.15rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '1rem',
                  }}
                >
                  {loading ? t.btn_submitting : t.btn_submit}
                </button>
              </form>

              {/* Link to full intake wizard */}
              <div
                style={{
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #e2e8f0',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t.or_full_wizard}</p>
                <Link
                  href={signupUrl}
                  style={{
                    color: '#0F4C81',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                  }}
                >
                  {t.link_full_wizard}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
