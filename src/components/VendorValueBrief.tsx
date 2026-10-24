import React from 'react';
import {
  VENDOR_VALUE_ASK,
  VENDOR_VALUE_FREE,
  VENDOR_VALUE_INTRO,
  VENDOR_VALUE_NOTE,
  VENDOR_VALUE_UPGRADE,
} from '@/lib/vendor-value-copy';

interface VendorValueBriefProps {
  language: 'ar' | 'en';
  /** `compact` keeps the pre-acceptance page short; `full` is for the dashboard. */
  variant?: 'compact' | 'full';
  businessName?: string;
}

export default function VendorValueBrief({ language, variant = 'full', businessName }: VendorValueBriefProps) {
  const ar = language === 'ar';
  const free = variant === 'compact' ? VENDOR_VALUE_FREE.slice(0, 6) : VENDOR_VALUE_FREE;
  const upgrade = variant === 'compact' ? VENDOR_VALUE_UPGRADE.slice(0, 4) : VENDOR_VALUE_UPGRADE;
  const ask = variant === 'compact' ? VENDOR_VALUE_ASK.slice(0, 1) : VENDOR_VALUE_ASK;

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ textAlign: ar ? 'right' : 'left' }}>
      <style>{`
        .vvb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.6rem; }
        .vvb-item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 0.85rem; background: #fbfdff; }
        .vvb-num { width: 22px; height: 22px; border-radius: 999px; background: #ccfbf1; color: #0f766e; display: inline-grid; place-items: center; font-size: 0.68rem; font-weight: 900; margin-inline-end: 0.4rem; }
        .vvb-title { font-size: 0.83rem; font-weight: 900; color: #0f172a; }
        .vvb-body { font-size: 0.74rem; color: #475569; line-height: 1.65; margin-top: 0.25rem; }
        @media (max-width: 640px) { .vvb-grid { grid-template-columns: 1fr; } }
      `}</style>

      <p style={{ margin: '0 0 0.9rem', fontSize: '0.8rem', color: '#334155', lineHeight: 1.7 }}>
        {ar ? VENDOR_VALUE_INTRO.ar : VENDOR_VALUE_INTRO.en}
      </p>

      <div className="vvb-grid">
        {free.map((item, index) => (
          <div key={item.title} className="vvb-item">
            <div className="vvb-title">
              <span className="vvb-num">{index + 1}</span>
              {ar ? item.titleAr : item.title}
            </div>
            <div className="vvb-body">{ar ? item.bodyAr : item.body}</div>
          </div>
        ))}
      </div>

      <details style={{ marginTop: '0.9rem', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.7rem 0.85rem', background: '#fffdf5' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 900, fontSize: '0.84rem', color: '#7c5e10' }}>
          {ar ? 'وماذا يتغير عند الترقية؟' : 'What changes when you upgrade?'}
        </summary>
        <div className="vvb-grid" style={{ marginTop: '0.7rem' }}>
          {upgrade.map(item => (
            <div key={item.title} className="vvb-item" style={{ background: '#fff' }}>
              <div className="vvb-title">{ar ? item.titleAr : item.title}</div>
              <div className="vvb-body">{ar ? item.bodyAr : item.body}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '0.7rem 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
          {ar
            ? 'الترقية اختيارية. الصفحة تعمل بدونها، والحدود مكتوبة في لوحة التحكم قبل أي دفع.'
            : 'Upgrading is optional. The page works without it, and every limit is shown in your dashboard before any payment.'}
        </p>
      </details>

      <div style={{ marginTop: '0.9rem', padding: '0.75rem 0.85rem', border: '1px solid #d1fae5', borderRadius: 12, background: '#f0fdfa' }}>
        <div style={{ fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f766e' }}>
          {ar ? 'ما نطلبه منك مقابل ذلك' : 'What we ask in return'}
        </div>
        {ask.map(item => (
          <p key={item.title} style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#334155', lineHeight: 1.7 }}>
            <strong>{ar ? item.titleAr : item.title}:</strong> {ar ? item.bodyAr : item.body}
          </p>
        ))}
      </div>

      <p style={{ margin: '0.7rem 0 0', fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.6 }}>
        {businessName ? `${businessName} · ` : ''}{ar ? VENDOR_VALUE_NOTE.ar : VENDOR_VALUE_NOTE.en}
      </p>
    </div>
  );
}
