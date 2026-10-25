import type { Metadata } from 'next';
import { BRAND_SECTOR_HERO } from '@/lib/brand-sectors';
import { SECTOR_COPY } from '@/lib/sector-content';
import { getPublicAppUrl } from '@/lib/public-url';
import { languageAlternates, localeUrl, pathLocale } from '@/lib/site-locale';

type SectorSlug = 'siwa-stay' | 'siwa-go' | 'siwa-retreats';

/**
 * Shared metadata for the three sector hubs.
 *
 * Canonical points at the locale the visitor actually landed on, and the
 * `languages` block declares the other one, so `/ar/siwa-stay` and
 * `/siwa-stay` are treated as translations of each other rather than as
 * duplicate pages competing for the same query. The rendered language follows
 * the URL for the same reason: one address, one language, no negotiation.
 */
export async function sectorMetadata(slug: SectorSlug): Promise<Metadata> {
  const canonicalLocale = (await pathLocale()) ?? 'en';
  const ar = canonicalLocale === 'ar';
  const copy = SECTOR_COPY[slug];
  const text = ar ? copy.ar : copy;
  const base = getPublicAppUrl().replace(/\/$/, '');
  const path = `/${slug}`;
  const canonical = localeUrl(base, canonicalLocale, path);
  const image = BRAND_SECTOR_HERO[slug]?.image || `${base}/brand/og-image.png`;

  return {
    title: text.metaTitle,
    description: text.metaDescription,
    alternates: {
      canonical,
      languages: languageAlternates(base, path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: text.metaTitle,
      description: text.metaDescription,
      url: canonical,
      siteName: 'Siwify',
      type: 'website',
      locale: ar ? 'ar_EG' : 'en_US',
      alternateLocale: ar ? ['en_US'] : ['ar_EG'],
      images: [{ url: image, width: 1200, height: 630, alt: text.heading }],
    },
    twitter: {
      card: 'summary_large_image',
      title: text.metaTitle,
      description: text.metaDescription,
      images: [image],
    },
  };
}
