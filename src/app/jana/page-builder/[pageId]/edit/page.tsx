'use client';

/**
 * Page Editor - Placeholder (Fixing Build Errors)
 */

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PageEditorPage() {
  const router = useRouter();

  return (
    <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', color: '#fff' }}>
      <h2 style={{ fontWeight: 900 }}>PAGE EDITOR UNAVAILABLE</h2>
      <p style={{ margin: '1rem 0', opacity: 0.7 }}>The Page Builder system is undergoing a governance synchronization. Please use the <b>Master Orchestrator Wizard</b> for all current page designs.</p>
      <button onClick={() => router.push('/jana/orchestrator')} style={{ background: '#D4AF37', color: '#1a1a2e', border: 'none', padding: '0.75rem 2rem', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}>
        GO TO WIZARD
      </button>
    </div>
  );
}
