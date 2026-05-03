import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIWA OASIS | The Premium Desert Marketplace',
  description: 'Discover Siwa Oasis - Hotels, restaurants, tours, shops and experiences in Egypt\'s most magical desert oasis',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
