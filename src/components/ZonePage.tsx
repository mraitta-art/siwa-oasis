import Link from 'next/link';
import {
  getZoneFacets,
  listZoneListings,
  type Zone,
} from '@/lib/zones';

/**
 * A zone's public page — /{market}/{zone}.
 *
 * The place is a location row, not a content entity: it has a name, a level and
 * a parent, and nothing else. So the page answers the one question a place can
 * answer — "what is published here?" — grouped by the parent typology a visitor
 * came for, and never pretends to be a minisite.
 *
 * A zone slug only wins an address after businesses, CMS pages and compounds
 * have failed to claim it (see [slug]/page.tsx), so no live URL changes owner.
 */

const TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  country: { ar: 'دولة', en: 'Country' },
  governorate: { ar: 'محافظة', en: 'Governorate' },
  city: { ar: 'مدينة', en: 'City' },
  district: { ar: 'حي', en: 'District' },
  town: { ar: 'بلدة', en: 'Town' },
  area: { ar: 'منطقة', en: 'Area' },
  neighborhood: { ar: 'حي سكني', en: 'Neighbourhood' },
};

const LABEL = {
  ar: {
    back: '← كل السوق',
    empty: 'لا يوجد نشاط منشور في هذه المنطقة بعد.',
    emptyHint: 'اختر منطقة أخرى، أو تصفح السوق بالكامل.',
    other: 'أخرى',
    open: 'افتح الموقع',
    listings: 'نشاط',
  },
  en: {
    back: '← Back to the market',
    empty: 'Nothing is published in this area yet.',
    emptyHint: 'Pick another area, or browse the whole market.',
    other: 'Other',
    open: 'Open minisite',
    listings: 'businesses',
  },
};

export default async function ZonePage({
  zone,
  marketSlug,
  lang,
}: {
  zone: Zone;
  marketSlug: string;
  lang: 'ar' | 'en';
}) {
  const ar = lang === 'ar';
  const t = LABEL[ar ? 'ar' : 'en'];
  const href = (path: string) => (ar ? `/ar${path}` : path);

  const [facets, listings] = await Promise.all([
    getZoneFacets(zone),
    listZoneListings(zone),
  ]);

  const title = ar ? zone.nameAr || zone.nameEn : zone.nameEn || zone.nameAr;
  const otherName = ar ? zone.nameEn : zone.nameAr;
  const typeLabel = TYPE_LABEL[zone.type]?.[ar ? 'ar' : 'en'] || zone.type;

  // Facets group by COALESCE(parent_id, id), so a top-level typology arrives
  // with its own id and must be matched on the type id instead.
  const groupKey = (listing: (typeof listings)[number]) =>
    listing.parentTypeId || listing.typeId;

  const groups = facets
    .map((facet) => ({
      key: facet.parentTypeId,
      // `||` not `??`: an editor can save the Arabic field empty.
      label: ar ? facet.parentTypeNameAr || facet.parentTypeName : facet.parentTypeName,
      items: listings.filter((listing) => groupKey(listing) === facet.parentTypeId),
    }))
    .filter((group) => group.items.length > 0);

  const ungrouped = listings.filter(
    (listing) => !facets.some((facet) => facet.parentTypeId === groupKey(listing))
  );

  const sections = [
    ...groups,
    ...(ungrouped.length ? [{ key: 'other', label: t.other, items: ungrouped }] : []),
  ];

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0F172A' }}>
      <header style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 1.5rem' }}>
        <Link
          href={href(`/${marketSlug}`)}
          style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textDecoration: 'none' }}
        >
          {t.back}
        </Link>
        <h1 style={{ margin: '0.75rem 0 0.35rem', fontSize: '2rem', fontWeight: 900, lineHeight: 1.25 }}>
          {title}
        </h1>
        <div style={{ fontSize: '0.9rem', color: '#94A3B8', marginBottom: '0.75rem' }}>{otherName}</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.3rem 0.7rem',
              borderRadius: 999,
              background: '#F1F5F9',
              color: '#475569',
            }}
          >
            {typeLabel}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.3rem 0.7rem',
              borderRadius: 999,
              background: '#0F172A',
              color: '#FFFFFF',
            }}
          >
            {zone.listings} {t.listings}
          </span>
        </div>
      </header>

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {sections.length === 0 && (
          <div
            style={{
              border: '1px dashed #CBD5E1',
              borderRadius: 14,
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: '0.35rem' }}>{t.empty}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
              <Link href={href(`/${marketSlug}`)} style={{ color: '#0F4C81', fontWeight: 800, textDecoration: 'none' }}>
                {t.emptyHint}
              </Link>
            </div>
          </div>
        )}

        {sections.map((group) => (
          <div key={group.key} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 1rem' }}>
              {group.label}
              <span style={{ fontWeight: 700, color: '#94A3B8', fontSize: '0.8rem' }}> · {group.items.length}</span>
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {group.items.map((listing) => (
                <Link
                  key={listing.id}
                  href={href(`/${marketSlug}/${listing.slug}`)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: '#0F172A',
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    style={{
                      height: 110,
                      background: listing.coverImage
                        ? `url(${listing.coverImage}) center/cover`
                        : 'linear-gradient(135deg, #E2E8F0, #F8FAFC)',
                    }}
                  />
                  <div style={{ padding: '0.85rem 1rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#0F4C81' }}>
                        {(ar ? listing.typeNameAr || listing.typeName : listing.typeName) || typeLabel}
                      </span>
                      {listing.isTrusted && (
                        <span
                          style={{
                            fontSize: '0.58rem',
                            fontWeight: 900,
                            background: '#DCFCE7',
                            color: '#166534',
                            padding: '1px 6px',
                            borderRadius: 999,
                          }}
                        >
                          {ar ? 'موثّق' : 'VERIFIED'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.4 }}>
                      {(ar ? listing.nameAr || listing.name : listing.name)}
                    </div>
                    <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', fontWeight: 800, color: '#0F4C81' }}>
                      {t.open} {ar ? '←' : '→'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
