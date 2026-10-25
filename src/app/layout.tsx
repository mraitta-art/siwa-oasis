import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import GlobalJourneyFloater from '@/components/GlobalJourneyFloater';
import { BRAND_OG_IMAGE_URL, BRAND_ICON_512_URL } from '@/lib/brand-assets';
import { pathLocale } from '@/lib/site-locale';

export const metadata: Metadata = {
  metadataBase: new URL('https://siwify.com'),
  applicationName: 'SiWiFy',
  title: 'SIWIFY | The Premium Desert Marketplace of Siwa Oasis',
  description: 'Discover Siwa Oasis - Hotels, eco-lodges, restaurants, 4x4 safari, healing salt lakes, and direct bookings on SiWiFy.com',
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
    locale: 'en_US',
    url: 'https://siwify.com',
    siteName: 'SIWIFY',
    title: 'SIWIFY | The Premium Desert Marketplace of Siwa Oasis',
    description: 'Discover Siwa Oasis - Hotels, eco-lodges, restaurants, 4x4 safari, healing salt lakes, and direct bookings on SiWiFy.com',
    images: [
      {
        url: BRAND_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'SiWiFy.com - Siwa Oasis Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIWIFY | The Premium Desert Marketplace of Siwa Oasis',
    description: 'Discover Siwa Oasis - Hotels, eco-lodges, restaurants, 4x4 safari, healing salt lakes, and direct bookings on SiWiFy.com',
    images: [BRAND_OG_IMAGE_URL],
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
  },
  verification: {
    google: 'aVaJnjKee5G26q8GlEFhvJL3eOtWUO0lj1yPNZ-7J7I',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0f1e',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The document language follows the URL, not Accept-Language: `/ar/...` is the
  // only Arabic address, and the dashboards (never rewritten under /ar) must not
  // inherit `dir="rtl"` from a visitor's browser settings. Reading a request
  // header here makes every route dynamic — see the build output for the count.
  const locale = (await pathLocale()) ?? 'en';

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="google-site-verification" content="aVaJnjKee5G26q8GlEFhvJL3eOtWUO0lj1yPNZ-7J7I" />
        <meta name="msapplication-TileColor" content="#0a0f1e" />
        <meta name="msapplication-TileImage" content={BRAND_ICON_512_URL} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased">
        {children}
        <AnalyticsTracker />
        <GlobalJourneyFloater />
      </body>
    </html>
  );
}
