import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { listMarkets } from '@/lib/markets';
import { businessPublicPath } from '@/lib/public-url';

export const revalidate = 3600; // revalidate hourly

const BASE = 'https://siwify.com';

/**
 * Routes are listed per language with matching hreflang alternates, so Google
 * treats /ar/siwa-stay and /siwa-stay as translations of one page instead of
 * two pages competing for the same query.
 *
 * Only pages that are actually translated get an Arabic twin. The homepage and
 * /categories are still English-only, so listing them as Arabic would be a lie
 * that the crawl would immediately expose.
 */
function withArabic(
  path: string,
  changeFrequency: 'daily' | 'weekly' | 'monthly',
  priority: number,
  lastModified: Date,
  lastModifiedAr: Date = lastModified
): MetadataRoute.Sitemap {
  const en = `${BASE}${path}`;
  const ar = `${BASE}/ar${path}`;
  const languages = { en, ar, 'x-default': en };

  return [
    { url: en, lastModified, changeFrequency, priority, alternates: { languages } },
    { url: ar, lastModified: lastModifiedAr, changeFrequency, priority, alternates: { languages } },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Only routes that actually exist. `/explore` and `/stories` were listed here
  // but never built, so every crawl of this file produced two soft 404s.
  //
  // The Siwa-named sector hubs (/siwa-stay, /siwa-go, /siwa-retreats) were listed
  // here too. They now 308 to the market's category doors, and a sitemap must
  // advertise destinations, not redirects — the market route below covers them.
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE}/categories`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...withArabic('/be-a-partner', 'monthly', 0.6, now),
  ];

  try {
    // Each live market owns a front door. Dark markets are omitted: a URL that
    // answers 404 has no business in a sitemap.
    const markets = await listMarkets({ activeOnly: true });
    const marketRoutes: MetadataRoute.Sitemap = markets.flatMap((market) =>
      withArabic(`/${market.slug}`, 'daily', 0.8, now)
    );

    // `market_id` arrives with the markets migration. Until it is applied the
    // column-aware query comes back empty, so fall back to the flat listing
    // rather than silently dropping every business from the sitemap.
    let businesses = await query(
      `SELECT slug, market_id, url_style, updated_at FROM businesses WHERE status = 'active' AND slug IS NOT NULL LIMIT 500`
    );
    if (!businesses || businesses.length === 0) {
      businesses = await query(
        `SELECT slug, updated_at FROM businesses WHERE status = 'active' AND slug IS NOT NULL LIMIT 500`
      );
    }
    const businessRoutes: MetadataRoute.Sitemap = (businesses || []).flatMap((b: any) =>
      withArabic(
        // Each listing is listed at the address it answers at: the short form,
        // or the form inside its market. Listing both would be asking a crawler
        // to index a page that only exists to point at another one.
        businessPublicPath(b),
        'weekly',
        0.7,
        b.updated_at ? new Date(b.updated_at) : now
      )
    );

    return [...staticRoutes, ...marketRoutes, ...businessRoutes];
  } catch {
    return staticRoutes;
  }
}
