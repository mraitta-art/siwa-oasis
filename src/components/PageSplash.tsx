import React from 'react';
import BrandLoader from '@/components/BrandLoader';

/**
 * Full-screen splash for route segments that hand off to the client: the admin
 * console, the vendor portal, the search and compare tools. It lives in each of
 * those segments' `loading.tsx` instead of at the app root, because a root
 * loading boundary wraps every public page, React flushes that shell before the
 * page resolves, and `notFound()` can then no longer answer with a 404 status.
 */
export default function PageSplash({ sublabel = 'Siwa Oasis · Digital Platform' }: { sublabel?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#0a0f1e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <BrandLoader size={104} label="SiWiFy.com" sublabel={sublabel} />
    </div>
  );
}
