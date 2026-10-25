import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getMarketBySlug,
  listMarketCategories,
  listMarketListings,
  marketName,
  type Market,
} from '@/lib/markets';
import { marketCopy } from '@/lib/market-copy';
import { pathLocale } from '@/lib/site-locale';

/**
 * /{market} — the front door of one marketplace.
 *
 * The route tree stays flat (`/[slug]`), so this is rendered from the business
 * page when the slug is a market segment. Everything below is filtered by
 * `market_id`, which is the whole point: Siwa and El Alamein share a database,
 * a category tree and a renderer, and share nothing else.
 */

// The revenue-model line a market speaks in lives in market-copy.ts, shared
// with the homepage.
function accentFor(market: Market) {
  return market.themeAccent || '#D4AF37';
}

export default async function MarketHome({
  marketSlug,
  category,
}: {
  marketSlug: string;
  category?: string;
}) {
  const market = await getMarketBySlug(marketSlug);
  // A dark market has no front door: its rows exist, but nothing is published.
  if (!market || !market.active) notFound();

  const locale = (await pathLocale()) ?? market.defaultLocale;
  const ar = locale === 'ar';
  const accent = accentFor(market);
  const name = marketName(market, locale);
  const otherName = marketName(market, ar ? 'en' : 'ar');
  const copy = marketCopy(market, locale);

  const [categories, listings] = await Promise.all([
    listMarketCategories(market.slug, 12),
    listMarketListings(market.slug, { parentTypeId: category, limit: 24 }),
  ]);

  const activeCategory = category && categories.some((c) => c.id === category) ? category : null;
  const base = ar ? `/ar/${market.slug}` : `/${market.slug}`;

  // A parent category may carry its own blurb (business_types.description).
  // Stubs like "Master lodging category" say nothing, so only copy with a few
  // words behind it is shown.
  const activeFacet = categories.find((c) => c.id === activeCategory) || null;
  const categoryBlurb =
    activeFacet?.description && activeFacet.description.trim().split(/\s+/).length > 6
      ? activeFacet.description.trim()
      : null;

  return (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: '#0F172A',
        color: '#FFFFFF',
        fontFamily: "'Cairo', 'Noto Sans Arabic', 'Inter', sans-serif",
      }}
    >
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href={ar ? '/ar' : '/'} style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: 900, letterSpacing: '2px' }}>
            Siwify
          </Link>
          <Link
            href={ar ? '/ar/be-a-partner' : '/be-a-partner'}
            style={{ color: accent, textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', border: `1px solid ${accent}55`, padding: '0.45rem 0.9rem', borderRadius: 8 }}
          >
            {ar ? 'أضف نشاطك' : 'List your business'}
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ fontSize: '0.68rem', letterSpacing: '4px', fontWeight: 900, color: accent }}>
          {ar ? 'سوق' : 'MARKETPLACE'} · {market.currency}
        </div>
        <h1 style={{ margin: '0.6rem 0 0.35rem', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1.15 }}>
          {name}
        </h1>
        <div style={{ opacity: 0.5, fontSize: '0.95rem', marginBottom: '0.9rem' }}>{otherName}</div>
        <p style={{ margin: 0, maxWidth: 620, fontSize: '1rem', lineHeight: 1.8, opacity: 0.8 }}>
          {copy}
        </p>
      </section>

      {categories.length > 0 && (
        <section style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem 1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link
              href={base}
              style={{
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.5rem 0.95rem',
                borderRadius: 999,
                color: activeCategory ? '#FFFFFF' : '#0F172A',
                background: activeCategory ? 'rgba(255,255,255,0.08)' : accent,
                border: `1px solid ${activeCategory ? 'rgba(255,255,255,0.18)' : accent}`,
              }}
            >
              {ar ? 'الكل' : 'All'}
            </Link>
            {categories.map((c) => {
              const active = c.id === activeCategory;
              return (
                <Link
                  key={c.id}
                  href={`${base}?category=${encodeURIComponent(c.id)}`}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '0.5rem 0.95rem',
                    borderRadius: 999,
                    color: active ? '#0F172A' : '#F5E6AD',
                    background: active ? accent : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${active ? accent : 'rgba(212,175,55,0.3)'}`,
                  }}
                >
                  {c.name} <span style={{ opacity: 0.65 }}>{c.listings}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '1rem 1.5rem 4rem' }}>
        {categoryBlurb && (
          <p style={{ margin: '0 0 1.25rem', maxWidth: 680, fontSize: '0.92rem', lineHeight: 1.8, opacity: 0.75 }}>
            {categoryBlurb}
          </p>
        )}
        {listings.length === 0 ? (
          <div style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 14, padding: '2.5rem 1.5rem', textAlign: 'center', opacity: 0.75 }}>
            <div style={{ fontWeight: 800, marginBottom: '0.35rem' }}>
              {ar ? 'لا توجد أنشطة منشورة هنا بعد' : 'No listings published here yet'}
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              {ar ? 'كن أول من ينشر في هذا السوق.' : 'Be the first business in this market.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`${base}/${listing.slug}`}
                style={{
                  textDecoration: 'none',
                  color: '#FFFFFF',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: 140, background: listing.coverImage ? `url(${listing.coverImage}) center/cover` : `linear-gradient(135deg, ${accent}33, rgba(15,23,42,0.9))` }} />
                <div style={{ padding: '0.9rem 1rem 1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 900, color: accent }}>{listing.typeName || (ar ? 'نشاط' : 'Business')}</span>
                    {listing.isTrusted && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '1px 6px', borderRadius: 999 }}>
                        {ar ? 'موثّق' : 'VERIFIED'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.4 }}>{listing.name}</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: accent, fontWeight: 800 }}>
                    {ar ? 'افتح الموقع ←' : 'Open minisite →'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
