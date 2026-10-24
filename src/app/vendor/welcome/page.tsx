'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MinisiteQRCode from '@/components/MinisiteQRCode';

interface WelcomePayload {
  business: { id: string; name: string; slug: string; url: string; tier: string; claimed: boolean; published: boolean };
  trial: {
    status: string;
    daysRemaining: number;
    daysTotal: number;
    startedAt: string | null;
    expiresAt: string | null;
    canEdit: boolean;
    staysOnline: boolean;
  };
  quota: { photos: number | null; slides: number | null; videos: number | null; youtube: number | null; storageMB: number | null };
  tasks: Array<{ id: string; label: string; labelAr: string; done: boolean; hint: string; hintAr: string }>;
  promoKit: Array<{ platform: string; label: string; field: string; limit: number | null; value: string; deepLink: string; note: string }>;
  shareKit: Array<{ id: string; label: string; labelAr: string; place: string; text: string; tag: string }>;
  qr: { url: string; fileName: string };
  scoreboard: {
    days: number;
    views7: number;
    taps7: number;
    views30: number;
    taps30: number;
    sources: Array<{ src: string; count: number }>;
    channels: Array<{ channel: string; count: number }>;
  };
  pledge: { status: string; daysRemaining: number; google: string } | null;
  referral: { code: string; text: string };
  dashboardUrl: string;
}

const SOURCE_LABELS: Record<string, string> = {
  ig: 'Instagram',
  instagram: 'Instagram',
  fb: 'Facebook',
  facebook: 'Facebook',
  tt: 'TikTok',
  tiktok: 'TikTok',
  google: 'Google',
  qr: 'QR',
  post: 'Post',
  story: 'Story',
  status: 'WA status',
  wa: 'WA reply',
  siwify: 'SiWiFy',
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Call',
  directions: 'Directions',
  email: 'Email',
  share: 'Share',
  book: 'Booking',
};

export default function VendorWelcomePage() {
  const [data, setData] = useState<WelcomePayload | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language && !navigator.language.toLowerCase().startsWith('ar')) {
      setLanguage('en');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vendor/welcome?lang=${language}`)
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load.');
        if (!cancelled) setData(payload);
      })
      .catch(cause => { if (!cancelled) setError(cause.message || 'Unable to load.'); });
    return () => { cancelled = true; };
  }, [language]);

  const ar = language === 'ar';

  const copy = useCallback(async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setError(ar ? 'النسخ لم يعمل — حدد النص يدويًا.' : 'Copy failed — select the text manually.');
    }
  }, [ar]);

  const doneCount = useMemo(() => data?.tasks.filter(task => task.done).length || 0, [data]);

  if (error && !data) {
    return (
      <main className="vw-wrap">
        <section className="vw-card">
          <h1>{ar ? 'تعذر فتح الصفحة' : 'Unable to open this page'}</h1>
          <p style={{ color: '#475569' }}>{error}</p>
          <Link href="/vendor/app" style={primaryLink}>{ar ? 'إلى لوحة التحكم' : 'Go to dashboard'}</Link>
        </section>
      </main>
    );
  }

  if (!data) {
    return <main className="vw-wrap"><section className="vw-card">{ar ? 'جارٍ التجهيز…' : 'Preparing…'}</section></main>;
  }

  const { business, trial, tasks, promoKit, shareKit, qr, scoreboard, referral } = data;

  return (
    <main className="vw-wrap">
      <style>{`
        .vw-wrap { min-height: 100vh; background: #f8fafc; padding: 1.5rem; color: #0f172a; font-family: Inter, system-ui, sans-serif; }
        .vw-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.35rem; margin-bottom: 1rem; box-shadow: 0 8px 24px rgba(15,23,42,.05); }
        .vw-hero { background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: #fff; border: 0; }
        .vw-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
        .vw-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
        .vw-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
        .vw-btn { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 10px; padding: 0.55rem 0.8rem; font-weight: 800; font-size: 0.78rem; cursor: pointer; }
        .vw-btn-primary { background: #0f766e; border-color: #0f766e; color: #fff; }
        .vw-btn-gold { background: #D4AF37; border-color: #D4AF37; color: #1f2937; }
        .vw-copy { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 0.7rem 0.8rem; font-size: 0.78rem; white-space: pre-wrap; word-break: break-word; color: #334155; line-height: 1.6; }
        .vw-label { font-size: 0.66rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
        .vw-task { display: flex; gap: 0.7rem; align-items: flex-start; padding: 0.6rem 0; border-bottom: 1px solid #f1f5f9; }
        .vw-tick { width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center; font-size: 0.7rem; font-weight: 900; flex: 0 0 auto; }
        @media (max-width: 640px) {
          .vw-wrap { padding: 0.85rem; }
          .vw-card { padding: 1rem; border-radius: 14px; }
          .vw-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="vw-card vw-hero">
        <div className="vw-row" style={{ justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span className="vw-label" style={{ color: 'rgba(255,255,255,.72)' }}>{ar ? 'صفحتك جاهزة' : 'Your page is live'}</span>
          <button
            type="button"
            className="vw-btn"
            style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}
            onClick={() => setLanguage(ar ? 'en' : 'ar')}
          >
            {ar ? 'EN' : 'عربي'}
          </button>
        </div>
        <h1 style={{ margin: '0 0 0.35rem', fontSize: 'clamp(1.35rem, 4vw, 1.9rem)', fontWeight: 900 }}>{business.name}</h1>
        <p style={{ margin: '0 0 1rem', opacity: 0.85, fontSize: '0.85rem' }}>
          {ar
            ? `${doneCount} من ${tasks.length} خطوات مكتملة — كل ما تحتاجه للمشاركة أدناه.`
            : `${doneCount} of ${tasks.length} steps done — everything you need to share is below.`}
        </p>
        <div className="vw-row">
          <button type="button" className="vw-btn vw-btn-gold" onClick={() => copy('url', business.url)}>
            {copied === 'url' ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'انسخ رابط صفحتك' : 'Copy your link')}
          </button>
          <a href={business.url} target="_blank" rel="noreferrer" className="vw-btn" style={{ background: 'rgba(255,255,255,.14)', color: '#fff', borderColor: 'rgba(255,255,255,.3)', textDecoration: 'none' }}>
            {ar ? 'افتح الصفحة' : 'Open page'}
          </a>
        </div>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', opacity: 0.75, wordBreak: 'break-all' }}>{business.url}</p>
      </section>

      <section className="vw-card">
        <div className="vw-stats">
          <div>
            <div className="vw-label">{ar ? 'أيام التجربة' : 'Trial days'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{trial.daysRemaining}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{ar ? 'من' : 'of'} {trial.daysTotal}</div>
          </div>
          <div>
            <div className="vw-label">{ar ? 'مشاهدات ٧ أيام' : 'Views, 7 days'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{scoreboard.views7}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{scoreboard.views30} {ar ? 'في ٣٠ يومًا' : 'in 30 days'}</div>
          </div>
          <div>
            <div className="vw-label">{ar ? 'ضغطات واتساب' : 'WhatsApp taps'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f766e' }}>{scoreboard.taps7}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{scoreboard.taps30} {ar ? 'في ٣٠ يومًا' : 'in 30 days'}</div>
          </div>
        </div>
        {trial.status === 'ended' && (
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>
            {ar
              ? 'انتهت فترة التجربة. صفحتك تبقى منشورة، ويمكنك تجديد الخدمات في أي وقت.'
              : 'Your trial has ended. Your page stays online, and you can renew services anytime.'}
          </p>
        )}
      </section>

      <section className="vw-card">
        <h2 style={sectionTitle}>{ar ? 'خطواتك الخمس' : 'Your five steps'}</h2>
        {tasks.map(task => (
          <div key={task.id} className="vw-task">
            <span className="vw-tick" style={{ background: task.done ? '#dcfce7' : '#f1f5f9', color: task.done ? '#166534' : '#94a3b8' }}>
              {task.done ? '✓' : '•'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{ar ? task.labelAr : task.label}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ar ? task.hintAr : task.hint}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="vw-grid">
        <section className="vw-card">
          <h2 style={sectionTitle}>{ar ? 'نصوص جاهزة للمشاركة' : 'Ready-to-post text'}</h2>
          <p style={sectionNote}>
            {ar
              ? 'كل نص فيه رابط مُعلَّم باسم المنصة، لذلك نعرف من أين جاء الزائر.'
              : 'Each caption carries a tagged link, so we can tell which platform brought the visitor.'}
          </p>
          {shareKit.map(item => (
            <div key={item.id} style={{ marginBottom: '0.85rem' }}>
              <div className="vw-label">{ar ? item.labelAr : item.label}</div>
              <div className="vw-copy" style={{ marginTop: 4 }}>{item.text}</div>
              <div className="vw-row" style={{ marginTop: 6 }}>
                <button type="button" className="vw-btn" onClick={() => copy(`share-${item.id}`, item.text)}>
                  {copied === `share-${item.id}` ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'انسخ' : 'Copy')}
                </button>
                <a
                  className="vw-btn"
                  style={{ textDecoration: 'none' }}
                  href={`https://wa.me/?text=${encodeURIComponent(item.text)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {ar ? 'أرسل في واتساب' : 'Send on WhatsApp'}
                </a>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{item.place}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="vw-card">
          <h2 style={sectionTitle}>{ar ? 'البايو وحقل الموقع' : 'Bio and website field'}</h2>
          <p style={sectionNote}>
            {ar
              ? 'نص داخل الحد المسموح لكل منصة، ورابط مباشر يفتح شاشة التعديل.'
              : 'Text inside each platform limit, plus a deep link that opens the edit screen.'}
          </p>
          {promoKit.map(item => (
            <div key={item.platform} style={{ marginBottom: '0.85rem' }}>
              <div className="vw-label">{item.label}{item.limit ? ` · ${item.limit}` : ''}</div>
              <div className="vw-copy" style={{ marginTop: 4 }}>{item.value}</div>
              <div className="vw-row" style={{ marginTop: 6 }}>
                <button type="button" className="vw-btn" onClick={() => copy(`kit-${item.platform}`, item.value)}>
                  {copied === `kit-${item.platform}` ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'انسخ' : 'Copy')}
                </button>
                <a className="vw-btn" style={{ textDecoration: 'none' }} href={item.deepLink} target="_blank" rel="noreferrer">
                  {ar ? 'افتح' : 'Open'}
                </a>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{item.note}</div>
            </div>
          ))}
        </section>

        <section className="vw-card">
          <h2 style={sectionTitle}>{ar ? 'رمز QR' : 'QR code'}</h2>
          <p style={sectionNote}>
            {ar
              ? 'اطبعه والصقه على التوك توك أو المحل. كل مسح يُسجَّل باسم QR.'
              : 'Print it and put it on the tuk-tuk or in the shop. Every scan is recorded as QR.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <MinisiteQRCode businessName={business.name} targetUrl={qr.url} businessId={business.id} />
          </div>
          <button type="button" className="vw-btn" onClick={() => copy('qr', qr.url)}>
            {copied === 'qr' ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'انسخ رابط QR' : 'Copy QR link')}
          </button>
        </section>

        <section className="vw-card">
          <h2 style={sectionTitle}>{ar ? 'من أين يأتي الزوار' : 'Where visitors come from'}</h2>
          {scoreboard.sources.length === 0 ? (
            <p style={sectionNote}>
              {ar
                ? 'لا توجد زيارات مُعلَّمة بعد. انشر أحد النصوص أعلاه، وسيظهر المصدر هنا.'
                : 'No tagged visits yet. Post one of the captions above and the source appears here.'}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {scoreboard.sources.map(source => (
                <div key={source.src} className="vw-row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{SOURCE_LABELS[source.src] || source.src}</span>
                  <span style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 900 }}>{source.count}</span>
                </div>
              ))}
            </div>
          )}
          {scoreboard.channels.length > 0 && (
            <p style={{ ...sectionNote, marginTop: '0.75rem' }}>
              {scoreboard.channels.map(c => `${CHANNEL_LABELS[c.channel] || c.channel}: ${c.count}`).join(' · ')}
            </p>
          )}
        </section>

        <section className="vw-card">
          <h2 style={sectionTitle}>{ar ? 'كود الإحالة' : 'Your referral code'}</h2>
          <p style={sectionNote}>
            {ar
              ? 'كل بائع تجلبه بكودك يساعدنا على توسيع الخدمة في سيوة — وسنعرف أن الفضل لك.'
              : 'Every vendor you bring with your code helps SiWiFy grow in Siwa — and we know who to thank.'}
          </p>
          <div className="vw-copy" style={{ fontWeight: 900, letterSpacing: '0.08em', textAlign: 'center' }}>{referral.code}</div>
          <div className="vw-row" style={{ marginTop: 8 }}>
            <button type="button" className="vw-btn vw-btn-primary" onClick={() => copy('ref', referral.text)}>
              {copied === 'ref' ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'انسخ الرسالة' : 'Copy message')}
            </button>
            <a
              className="vw-btn"
              style={{ textDecoration: 'none' }}
              href={`https://wa.me/?text=${encodeURIComponent(referral.text)}`}
              target="_blank"
              rel="noreferrer"
            >
              {ar ? 'أرسل لصديق' : 'Send to a friend'}
            </a>
          </div>
        </section>
      </div>

      <section className="vw-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href={data.dashboardUrl} style={primaryLink}>{ar ? 'إلى لوحة التحكم' : 'Go to dashboard'}</Link>
        <span style={{ fontSize: '0.72rem', color: '#64748b', alignSelf: 'center' }}>
          {ar ? 'سيوايفاي — صفحتك، بإدارتك' : 'SiWiFy — your page, managed by you'}
        </span>
      </section>
    </main>
  );
}

const sectionTitle: React.CSSProperties = { margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 900, color: '#0f172a' };
const sectionNote: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '0.76rem', color: '#64748b', lineHeight: 1.6 };
const primaryLink: React.CSSProperties = {
  display: 'inline-block',
  background: '#0f766e',
  color: '#fff',
  textDecoration: 'none',
  padding: '0.7rem 1.1rem',
  borderRadius: 10,
  fontWeight: 900,
  fontSize: '0.82rem',
};
