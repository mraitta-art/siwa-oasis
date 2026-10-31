'use client';

import React from 'react';
import Link from 'next/link';
import type { HomeData } from '@/lib/home-data';
import type { Market, MarketCategoryFacet } from '@/lib/markets';
import PillarTabs from '@/components/pillars/PillarTabs';
import { PillarCardGrid, PillarChipRow, type PillarCardItem } from '@/components/pillars/PillarPrimitives';
import { PILLARS, pillarUrl } from '@/lib/pillars';

/**
 * The pillar gateway — the platform's three sections plus the plan page, shown
 * from the home front door as HeroUI tabs.
 *
 * The tabs are the intents (tourism, property, movement, planning), never the
 * places: Siwa and every other market appear as cards *inside* a tab. Each
 * section is a candidate subdomain later, so they stay separable here — one
 * panel each, one page each, no shared state between them.
 *
 * Like the other front-door blocks it reads homeData (resolved server-side) for
 * its data and never fetches its own API. `lib/markets` is imported as types
 * only: the module itself talks to the database and cannot cross the client
 * boundary.
 */

/** Market name in the page language, without the server-only markets helper. */
function nameOf(market: Market, ar: boolean): string {
  return (ar ? market.nameAr || market.nameEn : market.nameEn || market.nameAr) || market.slug;
}

function matchesCategory(facet: MarketCategoryFacet, keys: string[]): boolean {
  const haystack = `${facet.id} ${facet.name} ${facet.nameAr ?? ''}`.toLowerCase();
  return keys.some(k => haystack.includes(k));
}

const MOBILITY_KEYS = ['logistics', 'transport', 'transfer', 'mobility', 'vehicle', 'tuk', 'taxi', 'نقل', 'مواصلات'];
const FREIGHT_KEYS = ['agriculture', 'industry', 'production', 'trade', 'freight', 'cargo', 'shipping', 'تجارة', 'شحن'];

export default function PillarGateway({ data, props }: { data: HomeData; props?: any }) {
  const ar = data.ar;
  const locale = data.locale;

  const heading = typeof props?.title === 'string' && props.title
    ? props.title
    : (ar ? 'ابدأ رحلتك' : 'Start your journey');
  const subtitle = typeof props?.subtitle === 'string' && props.subtitle
    ? props.subtitle
    : (ar
        ? 'ثلاثة أقسام رئيسية لمصر — السياحة، العقارات، والنقل واللوجستيات — وبوّابة تخطّط بها مزيجًا بينها.'
        : 'Three main sections into Egypt — tourism, properties, and transportation & logistics — plus a gateway to plan a mix of them.');

  const { categories, platform, base, developers, allMarkets } = data;

  const categoryHref = (id: string) => {
    const path = platform ? (ar ? '/categories' : '/en/categories') : base;
    return `${path}?category=${encodeURIComponent(id)}`;
  };
  const pillarHref = (slug: Parameters<typeof pillarUrl>[0]) => pillarUrl(slug, locale);

  const chipItems = (list: MarketCategoryFacet[]) =>
    list.map(c => ({
      key: c.id,
      label: ar ? c.nameAr || c.name : c.name,
      icon: c.icon,
      count: c.listings,
      href: categoryHref(c.id),
    }));

  // Places, not tabs: each section shows the markets that serve its intent.
  const marketCards = (list: Market[], icon: string, accent: string, cta: string): PillarCardItem[] =>
    list.slice(0, 9).map(m => ({
      key: m.slug,
      title: nameOf(m, ar),
      subtitle: ar ? m.nameEn : m.nameAr,
      icon,
      accent: m.themeAccent || accent,
      href: m.active ? (ar ? `/${m.slug}` : `/en/${m.slug}`) : null,
      actionLabel: m.active ? cta : (ar ? 'قريبًا' : 'Coming soon'),
    }));

  const tourismMarkets = allMarkets.filter(m => m.revenueModel !== 'realestate_lead');
  const propertyMarkets = allMarkets.filter(m => m.revenueModel === 'realestate_lead');
  const mobility = categories.filter(c => matchesCategory(c, MOBILITY_KEYS));
  const freight = categories.filter(c => matchesCategory(c, FREIGHT_KEYS));

  const sectionCta = (slug: 'tourism' | 'properties' | 'transportation' | 'plan', accent: string, label: string) => (
    <Link
      href={pillarHref(slug)}
      className="button button--primary"
      style={{ alignSelf: 'flex-start', background: accent, color: '#fff', textDecoration: 'none', width: 'fit-content' }}
    >
      {label}
    </Link>
  );

  const panel = (children: React.ReactNode) => (
    <div style={{ display: 'grid', gap: '1.2rem' }}>{children}</div>
  );

  const tabs = [
    {
      id: 'tourism',
      label: ar ? 'السياحة والسفر' : 'Tourism & travel',
      icon: 'fa-umbrella-beach',
      content: panel(
        <>
          <PillarCardGrid items={marketCards(tourismMarkets, 'fa-location-dot', '#0ea5e9', ar ? 'تصفّح الوجهة ←' : 'Browse →')} />
          {categories.length > 0 && <PillarChipRow items={chipItems(categories.slice(0, 6))} accent="#0ea5e9" />}
          {sectionCta('tourism', '#0ea5e9', ar ? 'افتح قسم السياحة ←' : 'Open tourism →')}
        </>
      ),
    },
    {
      id: 'properties',
      label: ar ? 'العقارات' : 'Properties',
      icon: 'fa-building-universal-access',
      content: panel(
        <>
          {propertyMarkets.length > 0 ? (
            <PillarCardGrid items={marketCards(propertyMarkets, 'fa-city', '#0F4C81', ar ? 'تصفّح المشروعات ←' : 'Browse →')} />
          ) : (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {ar ? 'أسواق العقارات تُفتح سوقًا سوقًا — العلمين وراس الحكمة ضمن القائمة.' : 'Property markets open one by one — El Alamein and Ras El Hekma are on the list.'}
            </p>
          )}
          {developers.length > 0 && (
            <PillarChipRow
              items={developers.slice(0, 6).map(d => ({
                key: d.id,
                label: `${ar ? d.nameAr || d.name : d.name} (${d.projects})`,
                icon: 'fa-building',
                href: ar ? `/developers/${d.slug}` : `/en/developers/${d.slug}`,
              }))}
              accent="#0F4C81"
            />
          )}
          {sectionCta('properties', '#0F4C81', ar ? 'افتح قسم العقارات ←' : 'Open properties →')}
        </>
      ),
    },
    {
      id: 'transportation',
      label: ar ? 'نقل ولوجستيات' : 'Transportation & logistics',
      icon: 'fa-truck-fast',
      content: panel(
        <>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.8, maxWidth: 700 }}>
            {ar
              ? 'تحويلات، دفع رباعي وتكاتك للناس، وشحن وإنتاج للبضائع — نفس المبدأ: تتفق مع المزوّد مباشرة.'
              : 'Transfers, 4x4 and tuk-tuks for people, freight and produce for goods — same principle: you deal with the provider directly.'}
          </p>
          {(mobility.length > 0 || freight.length > 0) ? (
            <PillarChipRow items={chipItems([...mobility, ...freight].slice(0, 8))} accent="#b45309" />
          ) : (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {ar ? 'لا توجد أبواب نقل نشطة في هذا السوق بعد.' : 'No live transport doors in this market yet.'}
            </p>
          )}
          {sectionCta('transportation', '#b45309', ar ? 'افتح قسم النقل ←' : 'Open transportation →')}
        </>
      ),
    },
    {
      id: 'plan',
      label: ar ? 'خطّط رحلتك' : 'Plan your journey',
      icon: 'fa-route',
      content: panel(
        <>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.8, maxWidth: 700 }}>
            {ar
              ? 'للاستثمار، للمتعة، أو للاثنين معًا — اختر نيتك ونجهّز لك المسار عبر الأقسام الثلاثة.'
              : 'For investment, for pleasure, or both — choose your intent and we route it across the three sections.'}
          </p>
          {sectionCta('plan', '#8b5cf6', ar ? 'ابدأ التخطيط ←' : 'Start planning →')}
        </>
      ),
    },
  ];

  return (
    <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem 0' }}>
      <div style={{ marginBottom: '1.2rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D4AF37' }}>
          {ar ? 'بوّابة مصر' : 'Egypt Gateway'}
        </span>
        <h2 style={{ margin: '0.4rem 0 0', fontSize: 'clamp(1.4rem, 3.2vw, 1.9rem)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
          {heading}
        </h2>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.7 }}>
          {subtitle}
        </p>
      </div>

      <PillarTabs
        ar={ar}
        accent={PILLARS[0].accent}
        defaultTab="tourism"
        ariaLabel={ar ? 'أقسام المنصة' : 'Platform sections'}
        tabs={tabs}
      />
    </section>
  );
}
