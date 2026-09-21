'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToMinisiteTemplates() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/jana/page-builder/templates');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.9rem', fontFamily: 'sans-serif' }}>
        REDIRECTING TO MINISITE TEMPLATES BUILDER...
      </div>
    </div>
  );
}
