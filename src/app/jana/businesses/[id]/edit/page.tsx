'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function BusinessEditRedirect() {
  const { id } = useParams();

  useEffect(() => {
    if (id) window.location.replace(`/jana/businesses/${id}/orchestrate`);
  }, [id]);

  return <div style={{ padding: '3rem', color: '#64748b' }}>Opening the unified business editor...</div>;
}
