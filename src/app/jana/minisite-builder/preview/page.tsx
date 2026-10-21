'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MinisiteBuilderRenderer from '@/components/MinisiteBuilderRenderer';

export default function MinisiteDraftPreviewPage() {
  const searchParams = useSearchParams();
  const handoffId = searchParams.get('handoffId') || '';
  const [draft, setDraft] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!handoffId) {
      setError('Draft identifier is missing.');
      return;
    }
    fetch(`/api/jana/minisite-handoffs?handoffId=${encodeURIComponent(handoffId)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load the draft preview.');
        setDraft(data);
      })
      .catch(cause => setError(cause.message || 'Unable to load the draft preview.'));
  }, [handoffId]);

  if (error) {
    return <main style={statusStyle}><h1>Draft preview unavailable</h1><p>{error}</p><Link href="/jana/minisite-builder">Return to Minisite Builder</Link></main>;
  }
  if (!draft) return <main style={statusStyle}>Loading draft preview…</main>;
  if (!draft.business) return <main style={statusStyle}>The business for this draft no longer exists.</main>;

  return (
    <>
      <div style={bannerStyle}>
        <strong>ADMIN DRAFT PREVIEW · {draft.business.name} · REVISION {draft.revision}</strong>
        <Link href="/jana/minisite-builder" style={{ color: '#fff' }}>Back to builder</Link>
      </div>
      <MinisiteBuilderRenderer layout={draft.layout} business={draft.business} />
    </>
  );
}

const statusStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 10, background: '#f8fafc', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' };
const bannerStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 1000, display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 18px', background: '#0f172a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13 };
