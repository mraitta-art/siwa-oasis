'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToUnifiedArchitect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/jana/sections');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.9rem', fontFamily: 'sans-serif' }}>
        REDIRECTING TO UNIFIED SECTION ARCHITECT...
      </div>
    </div>
  );
}
