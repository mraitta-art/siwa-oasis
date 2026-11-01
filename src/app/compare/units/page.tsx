import type { Metadata } from 'next';
import Link from 'next/link';
import { pathLocale } from '@/lib/site-locale';
import { isListingKind, type ListingKind } from '@/lib/listing-kind';
import { compareUnits, buildUnitCatalog } from '@/lib/unit-compare';
import UnitComparisonTable from '@/components/development/UnitComparisonTable';
import UnitPicker from '@/components/development/UnitPicker';

/**
 * Compare specific units side by side.
 *
 * Sibling of `/compare/projects`. The projects route answers "which compound
 * should I look at"; this one answers "which specific apartment is the better
 * buy" — same compound or across two, chosen by unit id.
 *
 * One route serves both languages: middleware negotiates the locale into
 * `x-siwa-locale` and the ids live in the query, so `/en/compare/units` and
 * `/compare/units?ids=…` are the same page (bare path is Arabic). Server-
 * rendered so the numbers are in the HTML, and marked `noindex` — a saved
 * shortlist is a private state, not a page worth crawling.
 *
 * URL contract:
 *   `?ids=1,2,3`        — up to four unit ids, rendered in caller order
 *   `?kind=sale|rent_month|rent_night`  — narrows the picker catalog
 *   `?development=<id>` — narrows the picker to one compound
 * The picker rewrites these keys as the visitor ticks and unticks.
 */

export const dynamic = 'force-dynamic';

const HEAD = {
  ar: {
    title: 'قارن الوحدات',
    lede:
      'قارن حتى أربع وحدات جنبًا إلى جنب: السعر، السعر للمتر، المساحة، المرافق، التسليم وخطط السداد. تعمل أيضًا عبر مشروعين أو سوقين مختلفين.',
    pick: 'ابدأ باختيار الوحدات بالأعلى.',
    projects: 'قارن المشروعات كاملة بدلًا من ذلك',
    markets: 'قارن المناطق كفرص استثمارية',
  },
  en: {
    title: 'Compare units',
    lede:
      'Line up to four units side by side: price, price per m², area, amenities, handover and payment plans — across two compounds or two markets if you want.',
    pick: 'Start by choosing units above.',
    projects: 'Compare whole projects instead',
    markets: 'Compare markets as opportunities',
  },
};

const MAX_UNITS = 4;

export async function generateMetadata(): Promise<Metadata> {
  const ar = (await pathLocale()) !== 'en';
  const h = HEAD[ar ? 'ar' : 'en'];
  return {
    title: `${h.title} | SiWiFy`,
    description: h.lede,
    robots: { index: false, follow: true },
  };
}

/** Parse the searchParams object Next.js hands a server component. */
function readIdList(value: string | string[] | undefined): string[] {
  const raw = typeof value === 'string' ? value : Array.isArray(value) ? value.join(',') : '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX_UNITS);
}

function readKind(value: string | string[] | undefined): ListingKind | null {
  const raw = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined;
  return isListingKind(raw) ? raw : null;
}

function readString(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

export default async function CompareUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const ar = (await pathLocale()) !== 'en';
  const h = HEAD[ar ? 'ar' : 'en'];

  const ids = readIdList(sp.ids);
  const kind = readKind(sp.kind);
  const developmentId = readString(sp.development);

  // The compare and the catalog are two reads that can go out in parallel —
  // the compare needs exactly the picked ids in order, the catalog needs a
  // kind-narrowed active set the picker can browse.
  const [result, catalog] = await Promise.all([
    compareUnits(ids, MAX_UNITS),
    buildUnitCatalog({ ar, listingKind: kind, developmentId, limit: 240 }),
  ]);

  const localePrefix = ar ? '' : '/en';

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0F172A' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900 }}>{h.title}</h1>
        <p style={{ margin: '0.6rem 0 0', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.7 }}>{h.lede}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.7rem', flexWrap: 'wrap' }}>
          <Link
            href={`${localePrefix}/compare/projects`}
            style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0F4C81', textDecoration: 'none' }}
          >
            {h.projects} →
          </Link>
          <Link
            href={`${localePrefix}/compare/markets`}
            style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0F4C81', textDecoration: 'none' }}
          >
            {h.markets} →
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 1.25rem' }}>
        <UnitPicker
          catalog={catalog}
          selected={ids}
          ar={ar}
          max={MAX_UNITS}
          activeKind={kind}
        />
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {result.units.length > 0 ? (
          <UnitComparisonTable
            units={result.units}
            ar={ar}
            mixedKind={result.mixedKind}
            commonKind={result.commonKind}
          />
        ) : (
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>{h.pick}</p>
        )}
      </section>
    </div>
  );
}
