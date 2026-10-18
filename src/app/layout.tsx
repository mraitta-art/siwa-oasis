import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import GlobalJourneyFloater from '@/components/GlobalJourneyFloater';

export const metadata: Metadata = {
  metadataBase: new URL('https://siwify.com'),
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
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'SIWIFY - Siwa Oasis Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'SIWIFY | The Premium Desert Marketplace of Siwa Oasis',
    description: 'Discover Siwa Oasis - Hotels, eco-lodges, restaurants, 4x4 safari, healing salt lakes, and direct bookings on SiWiFy.com',
    images: ['/icons/icon-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-48x48.png?v=siwify2026', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png?v=siwify2026', sizes: '96x96', type: 'image/png' },
      { url: '/icon.svg?v=siwify2026', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=siwify2026', sizes: '48x48' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=siwify2026', sizes: '180x180', type: 'image/png' },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="aVaJnjKee5G26q8GlEFhvJL3eOtWUO0lj1yPNZ-7J7I" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=siwify2026" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=siwify2026" />
        <link rel="icon" href="/icon.svg?v=siwify2026" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico?v=siwify2026" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=siwify2026" />
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

