import Link from 'next/link';
import UnitsBoard from '@/components/UnitsBoard';
import { normalizeCustomData, queryOne, stripCustomDataSecrets } from '@/lib/db';
import {
  getDevelopmentFacets,
  isPlaceKind,
  listDevelopmentListings,
  listUnits,
  type Development,
} from '@/lib/developments';

/**
 * A compound's public page.
 *
 * The compound is a container, not a content entity: it owns facts (developer,
 * delivery year, status) and supply (listings, units), but it has no template and
 * no sections. So this page renders what the compound can actually answer for —
 * its header, a directory of what is inside it, and its inventory — and never
 * pretends to be a minisite.
 *
 * When `page_business_id` is set, that business speaks for the project: its
 * tagline becomes the intro band and its minisite stays at its own address. The
 * link is one-way on purpose; the compound URL never redirects, so an address
 * that is already printed on a QR code cannot change owner.
 */

const STATUS: Record<Development['status'], { ar: string; en: string }> = {
  announced: { ar: 'قيد الإعلان', en: 'Announced' },
  under_construction: { ar: 'تحت الإنشاء', en: 'Under construction' },
  delivered: { ar: 'تم التسليم', en: 'Delivered' },
  sold_out: { ar: 'مباع بالكامل', en: 'Sold out' },
};

/** The classifier, in the visitor's language. */
const KIND: Record<string, { ar: string; en: string }> = {
  compound: { ar: 'مجمع', en: 'Compound' },
  town: { ar: 'بلدة', en: 'Town' },
  village: { ar: 'قرية', en: 'Village' },
  resort: { ar: 'منتجع', en: 'Resort' },
};

const LABEL = {
  ar: {
    back: '← كل المشروعات',
    about: 'عن المشروع',
    available: 'الوحدات المتاحة',
    empty: 'لا توجد وحدات أو أنشطة منشورة في هذا المشروع بعد.',
    open: 'افتح صفحة المشروع',
  },
  en: {
    back: '← All projects',
    about: 'About this project',
    available: 'Available units',
    empty: 'No units or businesses are published in this project yet.',
    open: 'Open the project page',
  },
};

/** A town or a village is a place, so the page stops calling it a project. */
const PLACE_LABEL = {
  ar: {
    back: '← رجوع إلى المدينة',
    about: 'عن هذه البلدة',
    available: 'الوحدات المتاحة',
    empty: 'لا توجد أنشطة منشورة هنا بعد.',
    open: 'افتح الصفحة',
  },
  en: {
    back: '← Back to the market',
    about: 'About this area',
    available: 'Available units',
    empty: 'No businesses are published in this area yet.',
    open: 'Open the page',
  },
};

export default async function CompoundPage({
  compound,
  marketSlug,
  lang,
}: {
  compound: Development;
  marketSlug: string;
  lang: 'ar' | 'en';
}) {
  const ar = lang === 'ar';
  // A town has no developer or delivery date, and calling it a project reads
  // wrong to the visitor who typed its name. Only the words change; the page,
  // the categories and the URL stay the same.
  const place = isPlaceKind(compound.kind);
  const t = place ? PLACE_LABEL[ar ? 'ar' : 'en'] : LABEL[ar ? 'ar' : 'en'];
  const href = (path: string) => (ar ? `/ar${path}` : path);

  const [facets, listings, units, pageBusiness] = await Promise.all([
    getDevelopmentFacets(compound.id),
    listDevelopmentListings(compound.id, { limit: 120 }),
    listUnits({ developmentId: compound.id, limit: 60 }),
    compound.pageBusinessId
      ? queryOne<any>(
          'SELECT id, slug, name, name_ar, custom_data FROM businesses WHERE id = ? LIMIT 1',
          [compound.pageBusinessId]
        ).catch(() => null)
      : Promise.resolve(null),
  ]);

  const title = ar
    ? compound.nameAr || compound.nameEn || compound.slug
    : compound.nameEn || compound.nameAr || compound.slug;

  // Only the tagline is read, after the row is stripped exactly like the listing
  // page strips it: this component feeds no client boundary, but the habit is
  // what keeps secrets out of a page that is copied from elsewhere.
  let tagline = '';
  if (pageBusiness) {
    const cd = normalizeCustomData(stripCustomDataSecrets(pageBusiness.custom_data));
    tagline = String(
      cd?.tagline ||
        cd?.business_info?.tagline ||
        cd?.basic?.tagline ||
        cd?.description ||
        cd?.business_info?.description ||
        ''
    )
      .replace(/<[^>]*>/g, ' ')
      .trim();
  }

  // The facet query groups by COALESCE(bt.parent_id, bt.id), so a top-level
  // category has a null parentTypeId and must be matched on its own type id.
  // Without this, every top-level category would collapse into "Other".
  const groupKey = (listing: (typeof listings)[number]) =>
    listing.parentTypeId || listing.typeId;

  const groups = facets
    .map((facet) => ({
      key: facet.parentTypeId,
      // `||` not `??`: an editor can save the Arabic field empty, and an empty
      // heading is worse than the English one.
      label: ar ? facet.parentTypeNameAr || facet.parentTypeName : facet.parentTypeName,
      items: listings.filter((listing) => groupKey(listing) === facet.parentTypeId),
    }))
    .filter((group) => group.items.length > 0);

  const ungrouped = listings.filter(
    (listing) => !facets.some((facet) => facet.parentTypeId === groupKey(listing))
  );

  const chips = [
    (KIND[compound.kind] || KIND.compound)[ar ? 'ar' : 'en'],
    ...(place
      ? []
      : [
          compound.developerName,
          compound.deliveryYear ? String(compound.deliveryYear) : null,
          STATUS[compound.status][ar ? 'ar' : 'en'],
        ]),
  ].filter(Boolean) as string[];

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0F172A' }}>
      <header style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 1.5rem' }}>
        <Link
          href={href(`/${marketSlug}`)}
          style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textDecoration: 'none' }}
        >
          {t.back}
        </Link>
        <h1 style={{ margin: '0.75rem 0 0.6rem', fontSize: '2rem', fontWeight: 900, lineHeight: 1.25 }}>
          {title}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {chips.map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.3rem 0.7rem',
                borderRadius: 999,
                background: '#F1F5F9',
                color: '#475569',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </header>

      {tagline && (
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 900,
                color: '#94A3B8',
                letterSpacing: '1.5px',
                marginBottom: '0.5rem',
              }}
            >
              {t.about.toUpperCase()}
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.8 }}>{tagline}</p>
            {pageBusiness?.slug && (
              <Link
                href={href(`/${marketSlug}/${pageBusiness.slug}`)}
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: '#0F4C81',
                  textDecoration: 'none',
                }}
              >
                {t.open} →
              </Link>
            )}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {groups.length === 0 && ungrouped.length === 0 && units.length === 0 && (
          <p style={{ color: '#64748B', lineHeight: 1.8 }}>{t.empty}</p>
        )}

        {[...groups, ...(ungrouped.length ? [{ key: 'other', label: ar ? 'أخرى' : 'Other', items: ungrouped }] : [])].map(
          (group) => (
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
                      display: 'block',
                      padding: '1rem 1.1rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: 14,
                      textDecoration: 'none',
                      color: '#0F172A',
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                      {ar ? listing.nameAr || listing.name : listing.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
                      {ar ? listing.typeNameAr || listing.typeName : listing.typeName}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}

        {units.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 1rem' }}>{t.available}</h2>
            <UnitsBoard units={units} ar={ar} />
          </div>
        )}
      </section>
    </div>
  );
}
