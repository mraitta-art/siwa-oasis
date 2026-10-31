import React from 'react';
import type { Metadata } from 'next';
import PillarChrome from '@/components/pillars/PillarChrome';
import PillarTabs from '@/components/pillars/PillarTabs';
import { PillarCardGrid, PillarChipRow, type PillarCardItem } from '@/components/pillars/PillarPrimitives';
import { getPillar, pillarUrl } from '@/lib/pillars';
import { languageAlternates, pathLocale, type SiteLocale } from '@/lib/site-locale';
import { listMarkets, listMarketCategories, marketName, type Market, type MarketCategoryFacet } from '@/lib/markets';

/**
 * `/tourism` — the Egypt-wide travel pillar. A market is a place; this is the
 * intent that cuts across every non-property market: stays, trips, dining and
 * local services. It lists the destinations that serve travellers and points at
 * the shared category doors, and it is bilingual and RTL like the rest of the
 * site (Arabic owns `/tourism`, English lives at `/en/tourism`).
 *
 * The places are the content, never the navigation: Siwa and every other
 * destination live *inside* the tabs, while the tabs themselves are the design
 * of a travel trip — where to go, or what kind of tour to take.
 */

const pillar = getPillar('tourism')!;

async function resolveLocale(): Promise<SiteLocale> {
  return (await pathLocale()) ?? 'ar';
}

/** A destination is "tourism" when it does not earn as a real-estate lead. */
function isTourismMarket(market: Market): boolean {
  return market.revenueModel !== 'realestate_lead';
}

/** Tours taken to spend time: excursions, retreats, wellness, experiences. */
const LEISURE_KEYS = ['adventure', 'wellness', 'retreat', 'tour', 'safari', 'experience', 'activity', 'excursion', 'مغامرة', 'ريتريت', 'رحلة', 'جولة'];

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
      canonical: `https://siwify.com${locale === 'en' ? '/en/tourism' : '/tourism'}`,
      languages: languageAlternates('https://siwify.com', '/tourism'),
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function TourismPage() {
  const locale = await resolveLocale();
  const ar = locale === 'ar';

  const allMarkets = await listMarkets({ activeOnly: false });
  const destinations = allMarkets.filter(isTourismMarket);

  // Live category doors, resolved from the active tourism markets' supply.
  const activeSlugs = destinations.filter(m => m.active).map(m => m.slug);
  const facets = await Promise.all(activeSlugs.map(slug => listMarketCategories(slug, 12)));
  const merged = new Map<string, MarketCategoryFacet>();
  facets.flat().forEach(c => {
    const prev = merged.get(c.id);
    merged.set(c.id, prev ? { ...prev, listings: prev.listings + c.listings } : c);
  });
  const all = Array.from(merged.values()).sort((a, b) => b.listings - a.listings);
  const leisure = all.filter(c => matchesCategory(c, LEISURE_KEYS)).slice(0, 10);
  const types = all.slice(0, 8);

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

  const destinationCards: PillarCardItem[] = destinations.map(m => ({
    key: m.slug,
    title: marketName(m, locale),
    subtitle: ar ? m.nameEn : m.nameAr,
    icon: 'fa-location-dot',
    accent: m.themeAccent || pillar.accent,
    href: m.active ? (ar ? `/${m.slug}` : `/en/${m.slug}`) : null,
    actionLabel: m.active
      ? (ar ? 'تصفّح الوجهة ←' : 'Browse the destination →')
      : (ar ? 'قريبًا' : 'Coming soon'),
  }));

  const emptyNote = (
    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
      {ar ? 'لا توجد أبواب نشطة بعد — تُفتح أول ما ينشر مزوّد خدمة.' : 'No live doors yet — they open as soon as operators publish.'}
    </p>
  );

  return (
    <PillarChrome
      locale={locale}
      activePath={pillarUrl('tourism', locale)}
      eyebrow={ar ? pillar.eyebrow.ar : pillar.eyebrow.en}
      title={ar ? pillar.title.ar : pillar.title.en}
      subtitle={ar ? pillar.subtitle.ar : pillar.subtitle.en}
      accent={pillar.accent}
      icon={pillar.icon}
    >
      <PillarTabs
        ar={ar}
        accent={pillar.accent}
        ariaLabel={ar ? 'أقسام السياحة' : 'Tourism sections'}
        tabs={[
          {
            id: 'destinations',
            label: ar ? 'الوجهات' : 'Destinations',
            icon: 'fa-location-dot',
            content: destinations.length === 0 ? emptyNote : <PillarCardGrid items={destinationCards} />,
          },
          {
            id: 'tours',
            label: ar ? 'جولات وريتريت' : 'Tours & retreats',
            icon: 'fa-compass',
            content: (
              <div style={{ display: 'grid', gap: '1.6rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
                    {ar ? 'جولات لقضاء الوقت والاستجمام' : 'Tours to spend time, and retreats to slow down'}
                  </h2>
                  <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.8, maxWidth: 720 }}>
                    {ar
                      ? 'رحلات صحراوية، ريتريتات وعافية، وتجارب محلية — تُحجز مباشرة مع المنظّم الموثّق في الوجهة.'
                      : 'Desert safaris, retreats and wellness escapes, and local experiences — booked direct with the organiser in the destination.'}
                  </p>
                  {leisure.length > 0 ? <PillarChipRow items={chipItems(leisure)} accent={pillar.accent} /> : emptyNote}
                </div>
              </div>
            ),
          },
          {
            id: 'types',
            label: ar ? 'حسب النوع' : 'By type',
            icon: 'fa-layer-group',
            content: types.length > 0 ? <PillarChipRow items={chipItems(types)} accent={pillar.accent} /> : emptyNote,
          },
        ]}
      />
    </PillarChrome>
  );
}
