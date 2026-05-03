'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FormsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // The Form Architect has been consolidated into the Governance Studio (Foundation Hub)
    router.replace('/jana/governance');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1e293b', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <i className="fas fa-sync fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '1.5rem' }}></i>
        <h2 style={{ fontWeight: 800 }}>CONSOLIDATING ARCHITECT...</h2>
        <p style={{ opacity: 0.6 }}>Redirecting to the Unified Foundation Hub</p>
      </div>
    </div>
  );
}
