import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import GlobalJourneyFloater from '@/components/GlobalJourneyFloater';
import {
  BRAND_CANONICAL_ORIGIN,
  BRAND_DESCRIPTION_AR,
  BRAND_DESCRIPTION_EN,
  BRAND_ICON_512_ABSOLUTE_URL,
  BRAND_LOCKUP_ALT_AR,
  BRAND_LOCKUP_ALT_EN,
  BRAND_MARK_ALT_AR,
  BRAND_MARK_ALT_EN,
  BRAND_MARK_ABSOLUTE_URL,
  BRAND_NAME_AR,
  BRAND_NAME_EN,
  BRAND_OG_IMAGE_ABSOLUTE_URL,
  BRAND_TITLE_AR_SUFFIX,
  BRAND_TITLE_SUFFIX,
} from '@/lib/brand-assets';
import {
  brandAlternates,
  brandPreloadLinks,
  buildBrandGraphJsonLd,
} from '@/lib/brand-schema';
import { pathLocale } from '@/lib/site-locale';

/**
 * JSON-LD must live inside a `<script type="application/ld+json">`. The value
 * is a plain string, so any `</script>` sequence inside it — including one
 * produced by an over-eager stringification — closes the tag early and lets
 * the remainder run as raw HTML. Escaping the forward slash and the two
 * line/paragraph separators that are valid JSON but not valid in a JS string
 * literal is the recommended hardening from OWASP and Google's own
 * structured-data guidance, and it keeps the payload semantically unchanged.
 *
 * The brand graph is built entirely from constants in `brand-assets.ts`, but
 * the helper is used anyway so any future edit to a caption cannot inject.
 */
function jsonLdSafe(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Root metadata. Everything that Google reads about the SiWiFy brand on a
 * cold crawl lives here, so the JSON-LD graph in the body must stay aligned
 * with the tags below. Change a segment wording in `brand-assets.ts` and
 * both surfaces follow.
 */
export const metadata: Metadata = {
  metadataBase: new URL(BRAND_CANONICAL_ORIGIN),
  applicationName: BRAND_NAME_EN,
  authors: [{ name: 'SiWiFy Marketplace', url: `${BRAND_CANONICAL_ORIGIN}/about` }],
  publisher: 'SiWiFy',
  creator: 'SiWiFy',
  // Arabic owns the bare path, English lives under /en. Google reads these
  // hreflang hints and shows the right variant to the right audience.
  alternates: brandAlternates(),
  // The template lets every route render "Page | SiWiFy — Egypt's …" without
  // retyping the brand clause. `default` is what shows when no route overrides.
  title: {
    default: BRAND_TITLE_SUFFIX,
    template: `%s | ${BRAND_TITLE_SUFFIX}`,
  },
  description: BRAND_DESCRIPTION_EN,
  keywords: [
    'SiWiFy',
    'Siwify',
    '\u0633\u064a\u0648\u064a\u0641\u0627\u064a',
    'Egypt properties marketplace',
    'Egypt tourism marketplace',
    'Egypt accommodation booking',
    'Egypt investment listings',
    'Egypt locations directory',
    '\u0633\u0648\u0642 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0641\u064a \u0645\u0635\u0631',
    '\u0633\u0648\u0642 \u0627\u0644\u0633\u064a\u0627\u062d\u0629 \u0641\u064a \u0645\u0635\u0631',
    '\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a \u0641\u064a \u0645\u0635\u0631',
    '\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631 \u0641\u064a \u0645\u0635\u0631',
    'Siwa Oasis',
    'North Coast Egypt',
    'Sharm El Sheikh',
    'Hurghada',
  ],
  category: 'marketplace',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    // Arabic owns the bare path, so `ar_EG` is the primary locale; the
    // alternates list publishes the English and generic-Arabic variants so
    // a shared card resolves the correct script per audience.
    locale: 'ar_EG',
    url: `${BRAND_CANONICAL_ORIGIN}/`,
    alternateLocale: ['en_US', 'ar_AR'],
    siteName: BRAND_NAME_EN,
    title: BRAND_TITLE_SUFFIX,
    description: BRAND_DESCRIPTION_EN,
    images: [
      {
        url: BRAND_OG_IMAGE_ABSOLUTE_URL,
        width: 1200,
        height: 630,
        alt: BRAND_LOCKUP_ALT_EN,
      },
      {
        url: BRAND_MARK_ABSOLUTE_URL,
        width: 128,
        height: 128,
        alt: BRAND_MARK_ALT_EN,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@siwify',
    creator: '@siwify',
    title: BRAND_TITLE_SUFFIX,
    description: BRAND_DESCRIPTION_EN,
    images: [
      {
        url: BRAND_OG_IMAGE_ABSOLUTE_URL,
        alt: BRAND_LOCKUP_ALT_EN,
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon-48x48.png?v=siwify-gold-2026', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png?v=siwify-gold-2026', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192x192.png?v=siwify-gold-2026', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico?v=siwify-gold-2026', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
    ],
    shortcut: [{ url: '/favicon.ico?v=siwify-gold-2026', type: 'image/x-icon' }],
    apple: [
      { url: '/apple-touch-icon.png?v=siwify-gold-2026', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icon.svg?v=siwify-gold-2026',
        color: '#D4AF37',
      },
    ],
  },
  formatDetection: { telephone: true, address: true },
  verification: {
    google: 'aVaJnjKee5G26q8GlEFhvJL3eOtWUO0lj1yPNZ-7J7I',
  },
  other: {
    // Bilingual signals Google uses to bind the marketplace name to the
    // Egyptian entity, and Pinterest/Facebook use `og:locale` to pick the
    // right audience for a shared card.
    'og:description:ar': BRAND_DESCRIPTION_AR,
    'og:title:ar': BRAND_TITLE_AR_SUFFIX,
    'x-dialect': 'ar-EG,en',
    'content-language': 'ar-EG, en',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1e' },
    { media: '(prefers-color-scheme: light)', color: '#D4AF37' },
  ],
  colorScheme: 'normal',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The document language follows the URL, not Accept-Language: the bare path
  // is Arabic and `/en/...` is the only English address, so the dashboards
  // (never rewritten under /en) must not inherit `dir` from a visitor's browser
  // settings. Reading a request header here makes every route dynamic.
  const locale = (await pathLocale()) ?? 'ar';
  const brandGraph = buildBrandGraphJsonLd();
  const preloads = brandPreloadLinks();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="google-site-verification" content="aVaJnjKee5G26q8GlEFhvJL3eOtWUO0lj1yPNZ-7J7I" />
        <meta name="msapplication-TileColor" content="#0a0f1e" />
        <meta name="msapplication-TileImage" content={BRAND_ICON_512_ABSOLUTE_URL} />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* Preload the emblem + warm the origin connection so the header
            mark paints on the first frame instead of after hydration. */}
        {preloads.map((link, i) => (
          <link key={`brand-preload-${i}`} {...link} />
        ))}
        {/* Bilingual brand caption used by Image Search when the emblem is
            indexed independently of the page it appears on. */}
        <link rel="image_src" href={BRAND_MARK_ABSOLUTE_URL} />
        <meta property="og:image:alt" content={BRAND_MARK_ALT_EN} />
        <meta property="og:image:alt:ar" content={BRAND_MARK_ALT_AR} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased">
        {/* The graph is emitted once at the root so every route inherits the
            Organization ↔ WebSite ↔ ImageObject identity binding. Individual
            pages still add their own LocalBusiness/Product entries; those
            reference the same `@id` anchors so Google resolves the entity in
            a single crawl. */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLdSafe(brandGraph) }}
        />
        {children}
        <AnalyticsTracker />
        <GlobalJourneyFloater />
      </body>
    </html>
  );
}
