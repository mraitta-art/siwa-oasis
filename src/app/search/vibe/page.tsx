'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy /search/vibe route - redirects to dynamic search page
 * The vibe search page is now fully configurable via the site builder
 * Default route: /search/vibe-search
 */
export default function LegacyVibeSearchRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new dynamic search page
    router.replace('/search/vibe-search');
  }, [router]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <i className="fas fa-sun fa-spin fa-4x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
      <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>REDIRECTING...</div>
    </div>
  );
}
