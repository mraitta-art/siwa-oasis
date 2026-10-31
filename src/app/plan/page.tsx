import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PillarChrome from '@/components/pillars/PillarChrome';
import { getPillar, pillarUrl } from '@/lib/pillars';
import { languageAlternates, pathLocale, type SiteLocale } from '@/lib/site-locale';

/**
 * `/plan` — "prepare your journey". This is the intent funnel that sits above the
 * other two pillars: a visitor first says what the trip is *for* — an investment,
 * a pleasure escape, or a journey that is both — and is then routed to properties,
 * tourism, or a combination of the two.
 */

const pillar = getPillar('plan')!;

async function resolveLocale(): Promise<SiteLocale> {
  return (await pathLocale()) ?? 'ar';
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const ar = locale === 'ar';
  const title = ar ? pillar.title.ar : pillar.title.en;
  const description = ar ? pillar.subtitle.ar : pillar.subtitle.en;
  return {
    title,
    description,
    alternates: {
      canonical: `https://siwify.com${locale === 'en' ? '/en/plan' : '/plan'}`,
      languages: languageAlternates('https://siwify.com', '/plan'),
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function PlanPage() {
  const locale = await resolveLocale();
  const ar = locale === 'ar';

  const intents = [
    {
      key: 'invest',
      icon: 'fa-chart-line',
      accent: '#0F4C81',
      label: { ar: 'للاستثمار', en: 'For investment' },
      body: {
        ar: 'مشروعات عقارية وفرص دخول في مصر — أسعار، خطط سداد، ومواعيد معاينة مع المطوّرين.',
        en: 'Property developments and entry opportunities across Egypt — prices, payment plans and viewings with the developers.',
      },
      cta: { ar: 'استكشف العقارات', en: 'Explore properties' },
      href: pillarUrl('properties', locale),
    },
    {
      key: 'pleasure',
      icon: 'fa-umbrella-beach',
      accent: '#0ea5e9',
      label: { ar: 'للمتعة', en: 'For pleasure' },
      body: {
        ar: 'رحلات، إقامة ومطاعم في كل أنحاء مصر — احجز مباشرة مع أصحاب الأنشطة الموثّقة.',
        en: 'Trips, stays and dining all over Egypt — book direct with verified local owners.',
      },
      cta: { ar: 'استكشف السياحة', en: 'Explore tourism' },
      href: pillarUrl('tourism', locale),
    },
    {
      key: 'both',
      icon: 'fa-scale-balanced',
      accent: '#8b5cf6',
      label: { ar: 'للاثنين معًا', en: 'For both' },
      body: {
        ar: 'رحلة تجمع المتعة والاستثمار: زر الوجهة، واقضِ إجازتك، وافحص فرصة عقارية في المنطقة نفسها.',
        en: 'A trip that blends both: visit a destination, enjoy the escape, and scout a property opportunity in the same area.',
      },
      cta: { ar: 'ابدأ المزيج', en: 'Start the mix' },
      // "Both" is the one journey with no single page — it points at the two
      // pillars it combines, so the chooser always lands somewhere real.
      href: null,
    },
  ];

  return (
    <PillarChrome
      locale={locale}
      activePath={pillarUrl('plan', locale)}
      eyebrow={ar ? pillar.eyebrow.ar : pillar.eyebrow.en}
      title={ar ? pillar.title.ar : pillar.title.en}
      subtitle={ar ? pillar.subtitle.ar : pillar.subtitle.en}
      accent={pillar.accent}
      icon={pillar.icon}
    >
      <p style={{ margin: '0 0 1.8rem', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.8, maxWidth: 720 }}>
        {ar ? 'اختر نيتك أولًا — نجهّز لك المسار المناسب.' : 'Choose your intent first — we set the matching route.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
        {intents.map(intent => {
          const cardInner = (
            <>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: `${intent.accent}1f`, border: `1px solid ${intent.accent}55`, color: intent.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
                <i className={`fas ${intent.icon}`} aria-hidden="true" />
              </div>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)' }}>
                {ar ? intent.label.ar : intent.label.en}
              </h2>
              <p style={{ margin: '0 0 1.1rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.75 }}>
                {ar ? intent.body.ar : intent.body.en}
              </p>
              <span style={{ fontWeight: 900, fontSize: '0.85rem', color: intent.accent, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {ar ? intent.cta.ar : intent.cta.en}
                <i className="fas fa-arrow-right" aria-hidden="true" style={{ fontSize: '0.75rem' }} />
              </span>
            </>
          );

          const cardStyle: React.CSSProperties = {
            textDecoration: 'none',
            color: 'inherit',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderTop: `3px solid ${intent.accent}`,
            borderRadius: 18,
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          };

          if (intent.href) {
            return (
              <Link key={intent.key} href={intent.href} style={cardStyle}>
                {cardInner}
              </Link>
            );
          }

          // "Both" offers the two real destinations it combines.
          return (
            <div key={intent.key} style={cardStyle}>
              {cardInner}
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
                <Link href={pillarUrl('properties', locale)} style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.8rem' }}>
                  {ar ? 'العقارات' : 'Properties'}
                </Link>
                <Link href={pillarUrl('tourism', locale)} style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.8rem' }}>
                  {ar ? 'السياحة' : 'Tourism'}
                </Link>
                <Link href={pillarUrl('transportation', locale)} style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.8rem' }}>
                  {ar ? 'النقل' : 'Transportation'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </PillarChrome>
  );
}
