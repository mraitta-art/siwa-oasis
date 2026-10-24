import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';

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
    ...withArabic('/siwa-stay', 'weekly', 0.9, now),
    ...withArabic('/siwa-go', 'weekly', 0.9, now),
    ...withArabic('/siwa-retreats', 'weekly', 0.9, now),
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  try {
    const businesses = await query(
      `SELECT slug, updated_at FROM businesses WHERE status = 'active' AND slug IS NOT NULL LIMIT 500`
    );
    const businessRoutes: MetadataRoute.Sitemap = (businesses || []).flatMap((b: any) =>
      withArabic(
        `/${b.slug}`,
        'weekly',
        0.7,
        b.updated_at ? new Date(b.updated_at) : now
      )
    );

    return [...staticRoutes, ...businessRoutes];
  } catch {
    return staticRoutes;
  }
}
