import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PillarChrome from '@/components/pillars/PillarChrome';
import PillarTabs from '@/components/pillars/PillarTabs';
import { PillarCardGrid, PillarChipRow, type PillarCardItem } from '@/components/pillars/PillarPrimitives';
import { getPillar, pillarUrl } from '@/lib/pillars';
import { languageAlternates, pathLocale, type SiteLocale } from '@/lib/site-locale';
import { listMarkets, listMarketCategories, marketName, type MarketCategoryFacet } from '@/lib/markets';

/**
 * `/transportation` — the Egypt-wide movement pillar: the transfers, desert
 * transport, rentals and freight operators that carry people and goods between
 * the markets. Like the other pillars it is an intent that crosses every place,
 * so it is bilingual and RTL with the rest of the site (Arabic owns
 * `/transportation`, English lives at `/en/transportation`).
 *
 * It replaced the old Siwa-only sector hub: the hub pretended to be national
 * while showing one market's grid, and its address is exactly what a transport
 * section needs. The legacy aliases (`/transportations`, `/siwa-move`) still
 * redirect here through `LEGACY_HUB_TARGETS`.
 */

const pillar = getPillar('transportation')!;

async function resolveLocale(): Promise<SiteLocale> {
  return (await pathLocale()) ?? 'ar';
}

/** People-moving supply: taxis, transfers, 4x4, rentals, tuk-tuks. */
const MOBILITY_KEYS = ['logistics', 'transport', 'transfer', 'mobility', 'vehicle', 'tuk', 'taxi', 'car rental', 'نقل', 'مواصلات'];
/** Goods-moving supply: freight, production and trade. */
const FREIGHT_KEYS = ['agriculture', 'industry', 'production', 'trade', 'freight', 'cargo', 'shipping', 'logistics services', 'زراعي', 'تجارة', 'شحن'];

function matchesCategory(facet: MarketCategoryFacet, keys: string[]): boolean {
  const haystack = `${facet.id} ${facet.name} ${facet.nameAr ?? ''}`.toLowerCase();
  return keys.some(k => haystack.includes(k));
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
      canonical: `https://siwify.com${locale === 'en' ? '/en/transportation' : '/transportation'}`,
      languages: languageAlternates('https://siwify.com', '/transportation'),
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function TransportationPage() {
  const locale = await resolveLocale();
  const ar = locale === 'ar';

  const allMarkets = await listMarkets({ activeOnly: false });
  // Movement is a service intent, so every destination has it — a market earns
  // elsewhere, but its travellers still need a driver.
  const destinations = allMarkets;
  const activeSlugs = destinations.filter(m => m.active).map(m => m.slug);

  // Live doors, resolved from the active markets' actual supply.
  const facets = await Promise.all(activeSlugs.map(slug => listMarketCategories(slug, 12)));
  const merged = new Map<string, MarketCategoryFacet>();
  facets.flat().forEach(c => {
    const prev = merged.get(c.id);
    merged.set(c.id, prev ? { ...prev, listings: prev.listings + c.listings } : c);
  });
  const all = Array.from(merged.values());
  const mobility = all.filter(c => matchesCategory(c, MOBILITY_KEYS)).sort((a, b) => b.listings - a.listings).slice(0, 8);
  const freight = all.filter(c => matchesCategory(c, FREIGHT_KEYS)).sort((a, b) => b.listings - a.listings).slice(0, 8);

  const categoryHref = (id: string) =>
    `${ar ? '/categories' : '/en/categories'}?category=${encodeURIComponent(id)}`;
  const chipItems = (list: MarketCategoryFacet[]) =>
    list.map(c => ({
      key: c.id,
      label: ar ? c.nameAr || c.name : c.name,
      icon: c.icon,
      count: c.listings,
      href: categoryHref(c.id),
    }));

  const marketCards: PillarCardItem[] = destinations.map(m => ({
    key: m.slug,
    title: marketName(m, locale),
    subtitle: ar ? m.nameEn : m.nameAr,
    icon: 'fa-location-dot',
    accent: m.themeAccent || pillar.accent,
    href: m.active ? (ar ? `/${m.slug}` : `/en/${m.slug}`) : null,
    actionLabel: m.active
      ? (ar ? 'تصفّح الخدمة في الوجهة ←' : 'Browse the destination →')
      : (ar ? 'قريبًا' : 'Coming soon'),
  }));

  const emptyNote = (
    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
      {ar ? 'لا توجد تصنيفات نشطة لهذا القسم بعد — تُفتح تلقائيًا أول ما ينشر مزوّد خدمة.' : 'No live doors in this section yet — it opens as soon as an operator publishes.'}
    </p>
  );

  return (
    <PillarChrome
      locale={locale}
      activePath={pillarUrl('transportation', locale)}
      eyebrow={ar ? pillar.eyebrow.ar : pillar.eyebrow.en}
      title={ar ? pillar.title.ar : pillar.title.en}
      subtitle={ar ? pillar.subtitle.ar : pillar.subtitle.en}
      accent={pillar.accent}
      icon={pillar.icon}
    >
      <PillarTabs
        ar={ar}
        accent={pillar.accent}
        ariaLabel={ar ? 'أقسام النقل واللوجستيات' : 'Transportation sections'}
        tabs={[
          {
            id: 'mobility',
            label: ar ? 'تنقّلات ونقل أشخاص' : 'Transfers & mobility',
            icon: 'fa-taxi',
            content: (
              <div style={{ display: 'grid', gap: '1.1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
                  {ar ? 'تنقّلات داخل كل وجهة' : 'Getting around, in every destination'}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.8, maxWidth: 720 }}>
                  {ar
                    ? 'تحويلات من المطار، دفع رباعي للصحراء، تكاتك وتأجير — تواصل مباشر مع السائق أو الشركة بدون عمولة.'
                    : 'Airport transfers, 4x4 desert runs, tuk-tuks and rentals — deal straight with the driver or company, no commission.'}
                </p>
                {mobility.length > 0 ? <PillarChipRow items={chipItems(mobility)} accent={pillar.accent} /> : emptyNote}
              </div>
            ),
          },
          {
            id: 'freight',
            label: ar ? 'شحن وتجارة' : 'Freight & trade',
            icon: 'fa-truck-pickup',
            content: (
              <div style={{ display: 'grid', gap: '1.1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
                  {ar ? 'نقل البضائع والإنتاج' : 'Moving goods and produce'}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.8, maxWidth: 720 }}>
                  {ar
                    ? 'شحن بضائع، إنتاج زراعي وتجارة بين الأسواق — نفس المبدأ: تتفق مع المزوّد مباشرة.'
                    : 'Freight, agricultural produce and trade between markets — same principle: you deal with the supplier directly.'}
                </p>
                {freight.length > 0 ? <PillarChipRow items={chipItems(freight)} accent={pillar.accent} /> : emptyNote}
              </div>
            ),
          },
          {
            id: 'destinations',
            label: ar ? 'حسب الوجهة' : 'By destination',
            icon: 'fa-map-location-dot',
            content: (
              <div style={{ display: 'grid', gap: '1.1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
                  {ar ? 'الوجهات' : 'Destinations'}
                </h2>
                <PillarCardGrid items={marketCards} />
              </div>
            ),
          },
        ]}
      />

      {/* Cross-section note: movement feeds the other two sections */}
      <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
          {ar ? 'تحتاج تنقّلات ضمن رحلة؟' : 'Moving as part of a trip?'}
        </span>
        <Link
          href={pillarUrl('tourism', locale)}
          style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.8rem' }}
        >
          {ar ? 'السياحة' : 'Tourism'}
        </Link>
        <Link
          href={pillarUrl('properties', locale)}
          style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.8rem' }}
        >
          {ar ? 'العقارات' : 'Properties'}
        </Link>
      </div>
    </PillarChrome>
  );
}
