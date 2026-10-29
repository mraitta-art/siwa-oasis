import Link from 'next/link';
import { query } from '@/lib/db';
import { getPublicAppUrl } from '@/lib/public-url';
import { BRAND_SECTORS, getBrandRouteForType } from '@/lib/brand-sectors';
import { SECTOR_COPY, type SectorHubSlug } from '@/lib/sector-content';
import { localeUrl, pathLocale } from '@/lib/site-locale';

/**
 * The readable half of a sector hub.
 *
 * The interactive search UI below is a client component, so its markup only
 * exists after JavaScript runs. This server component puts the sector's actual
 * subject matter, its listed businesses and its FAQ into the HTML that a
 * crawler or a link preview receives.
 */

async function loadSectorBusinesses(slug: SectorHubSlug) {
  try {
    const rows = await query<any>(
      `SELECT id, name, slug, type_id, is_claimed
         FROM businesses
        WHERE status = 'active' AND slug IS NOT NULL
        LIMIT 300`
    ).catch(() => []);
    const types = await query<any>('SELECT id, parent_id FROM business_types').catch(() => []);

    return (rows || [])
      .filter((b: any) => getBrandRouteForType(String(b.type_id || ''), types || []) === slug)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export default async function SectorArticle({ slug }: { slug: SectorHubSlug }) {
  const copy = SECTOR_COPY[slug];
  const sector = BRAND_SECTORS[slug];
  const ar = (await pathLocale()) !== 'en';
  const text = ar ? copy.ar : copy;
  const base = getPublicAppUrl().replace(/\/$/, '');
  const businesses = await loadSectorBusinesses(slug);
  const href = (p: string) => (ar ? `/ar${p}` : p);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: text.heading,
        description: text.metaDescription,
        url: localeUrl(base, ar ? 'ar' : 'en', `/${slug}`),
        inLanguage: ar ? 'ar' : 'en',
        about: { '@type': 'Place', name: 'Siwa Oasis', address: { '@type': 'PostalAddress', addressRegion: 'Matrouh', addressCountry: 'EG' } },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: businesses.length,
          itemListElement: businesses.map((b: any, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name,
            url: `${base}/${b.slug}`,
          })),
        },
      },
      {
        '@type': 'FAQPage',
        inLanguage: ar ? 'ar' : 'en',
        mainEntity: text.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  const h2: React.CSSProperties = {
    margin: '0 0 0.9rem',
    fontSize: 'clamp(1.15rem, 2.4vw, 1.45rem)',
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  };

  return (
    <section
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        background: '#ffffff',
        borderTop: '1px solid #eef2f7',
        padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.1rem, 4vw, 3rem)',
        fontFamily: ar ? "'Cairo', 'Noto Sans Arabic', system-ui, sans-serif" : 'inherit',
      }}
    >
      <script
        type="application/ld+json"
        // `<` is escaped so vendor or DB text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '2.4px', color: '#b08d1f', textTransform: 'uppercase' }}>
          {sector.label} · Siwa Oasis
        </p>
        {/* The other language is a real address, so it gets a link rather than
            an automatic redirect that would hide one of the two URLs. */}
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.85rem' }}>
          <Link
            href={ar ? `/${slug}` : `/ar/${slug}`}
            hrefLang={ar ? 'en' : 'ar'}
            lang={ar ? 'en' : 'ar'}
            style={{ color: '#b08d1f', fontWeight: 800, textDecoration: 'none' }}
          >
            {ar ? 'Read this page in English' : 'اقرأ هذه الصفحة بالعربية'}
          </Link>
        </p>
        <h1 style={{ margin: '0 0 1.1rem', fontSize: 'clamp(1.6rem, 3.6vw, 2.3rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {text.heading}
        </h1>

        {text.intro.map((p) => (
          <p key={p.slice(0, 24)} style={{ margin: '0 0 1rem', fontSize: '1.02rem', lineHeight: 1.85, color: '#334155' }}>
            {p}
          </p>
        ))}

        <ul style={{ margin: '1.4rem 0 2rem', padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
          {text.facts.map((f) => (
            <li key={f.slice(0, 24)} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.95rem', lineHeight: 1.65, color: '#475569' }}>
              <span aria-hidden="true" style={{ color: sector.accent, fontWeight: 900 }}>•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <h2 style={h2}>{ar ? 'المدرجون في سيويفاي' : 'Listed on Siwify'}</h2>
        {businesses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {businesses.map((b: any) => (
              <Link
                key={b.id}
                href={href(`/${b.slug}`)}
                style={{
                  display: 'block',
                  padding: '1rem 1.1rem',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  color: '#0f172a',
                  background: '#fbfcfe',
                }}
              >
                <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 800 }}>{b.name}</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{ar ? 'زر صفحته' : 'Open minisite'}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ margin: '0 0 2rem', fontSize: '0.95rem', color: '#64748b' }}>
            {ar ? 'لا يوجد مكان منشور في هذا القطاع بعد — ' : 'Nothing published in this sector yet — '}
            <Link href={href('/categories')} style={{ color: '#b08d1f', fontWeight: 800 }}>
              {ar ? 'تصفح كل الأماكن' : 'browse everything in Siwa'}
            </Link>
          </p>
        )}

        <h2 style={h2}>{ar ? 'أسئلة شائعة' : 'Questions people ask'}</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {text.faq.map((f) => (
            <details key={f.q} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem', background: '#ffffff' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>{f.q}</summary>
              <p style={{ margin: '0.6rem 0 0', fontSize: '0.95rem', lineHeight: 1.75, color: '#475569' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
