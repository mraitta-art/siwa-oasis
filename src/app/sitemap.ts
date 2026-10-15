import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export const revalidate = 3600; // revalidate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://siwify.com';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    const businesses = await query(
      `SELECT slug, updated_at FROM businesses WHERE status = 'active' AND slug IS NOT NULL LIMIT 500`
    );
    const businessRoutes: MetadataRoute.Sitemap = (businesses || []).map((b: any) => ({
      url: `${baseUrl}/${b.slug}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...businessRoutes];
  } catch {
    return staticRoutes;
  }
}
