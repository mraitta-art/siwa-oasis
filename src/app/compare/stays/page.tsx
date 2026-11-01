import type { Metadata } from 'next';
import Link from 'next/link';
import { pathLocale } from '@/lib/site-locale';
import { isListingKind, type ListingKind } from '@/lib/listing-kind';
import { compareUnits, buildUnitCatalog } from '@/lib/unit-compare';
import UnitComparisonTable from '@/components/development/UnitComparisonTable';
import UnitPicker from '@/components/development/UnitPicker';
import CompareShareButton from '@/components/development/CompareShareButton';

/**
 * Compare vacation / short-term stays side by side.
 *
 * Same engine as `/compare/units`, different reader intent. A visitor looking
 * for "which hotel for my week in Siwa" does not think of themselves as
 * comparing units, but the data model is the same table and the same nightly
 * rows. This route exists so the URL, the header copy and the picker defaults
 * speak the traveler's language instead of the buyer's.
 *
 * Behavior differences from `/compare/units`:
 *   1. The picker opens pre-filtered to `?kind=rent_night` unless the URL
 *      already carries an explicit kind. A visitor arriving from a compound
 *      page or the discover tab sees nightly rows first, not a mixed pool.
 *   2. The header copy is framed around nights, min-stay and week/season
 *      budgeting rather than price-per-m² and handover.
 *   3. Cross-links point at the sibling compare routes so the four compare
 *      surfaces behave as a family, not as four unrelated pages.
 *
 * The rows themselves are the shared `UnitComparisonTable`. Every column the
 * traveler cares about — nightly price, weekly projection, twelve-month
 * projection, min stay, deposit, available-from — is already there and is
 * already kind-aware.
 *
 * URL contract (identical to `/compare/units`):
 *   `?ids=1,2,3`                  — up to four unit ids
 *   `?kind=rent_night|…`          — narrows picker; defaults to `rent_night`
 *   `?development=<id>`           — narrows picker to one compound
 */

export const dynamic = 'force-dynamic';

const HEAD = {
  ar: {
    title: 'قارن أماكن الإقامة',
    lede:
      'قارن حتى أربع أماكن إقامة قصيرة جنبًا إلى جنب: سعر الليلة، أسبوع كامل، تأمين، أقل عدد ليالٍ، وتاريخ التوفّر. تعمل عبر فندقين أو شاليهين أو بيتين في ضيعة واحدة.',
    pick: 'ابدأ باختيار أماكن الإقامة بالأعلى.',
    units: 'قارن كل الوحدات (بيع وإيجار وإقامة)',
    projects: 'قارن المشروعات كاملة',
    markets: 'قارن المناطق كفرص استثمارية',
  },
  en: {
    title: 'Compare stays',
    lede:
      'Line up to four short-stay listings side by side: nightly rate, one-week projection, deposit, minimum nights and availability. Works across two hotels, two chalets or two houses in the same village.',
    pick: 'Start by choosing stays above.',
    units: 'Compare all units (sale, rent, stay)',
    projects: 'Compare whole projects',
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

export default async function CompareStaysPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const ar = (await pathLocale()) !== 'en';
  const h = HEAD[ar ? 'ar' : 'en'];

  const ids = readIdList(sp.ids);
  // The whole point of this route is nightly stays. If the URL did not carry
  // a `?kind=`, we set it to `rent_night` so the picker opens on the right
  // shelf. A visitor who wants the broader units view clicks through to
  // `/compare/units` (linked below) rather than getting a mixed pool here.
  const kind: ListingKind | null = readKind(sp.kind) ?? 'rent_night';
  const developmentId = readString(sp.development);

  const [result, catalog] = await Promise.all([
    compareUnits(ids, MAX_UNITS),
    buildUnitCatalog({ ar, listingKind: kind, developmentId, limit: 240 }),
  ]);

  const localePrefix = ar ? '' : '/en';
  const siblings: Array<{ href: string; label: string }> = [
    { href: `${localePrefix}/compare/units`, label: h.units },
    { href: `${localePrefix}/compare/projects`, label: h.projects },
    { href: `${localePrefix}/compare/markets`, label: h.markets },
  ];

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0F172A' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900 }}>{h.title}</h1>
        <p style={{ margin: '0.6rem 0 0', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.7 }}>{h.lede}</p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '0.7rem',
            flexWrap: 'wrap',
            justifyContent: ar ? 'flex-start' : 'flex-start',
          }}
        >
          {siblings.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0F4C81', textDecoration: 'none' }}
            >
              {s.label} →
            </Link>
          ))}
          <CompareShareButton ar={ar} />
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
