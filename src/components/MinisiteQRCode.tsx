'use client';

import { useEffect, useState } from 'react';

interface MinisiteQRCodeProps {
  businessName: string;
  targetUrl?: string;
  businessId?: string;
  compact?: boolean;
}

export default function MinisiteQRCode({ businessName, targetUrl, businessId, compact = false }: MinisiteQRCodeProps) {
  const [resolvedUrl, setResolvedUrl] = useState(targetUrl || '');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!targetUrl) setResolvedUrl(window.location.href.split('#')[0]);
    if (businessId) {
      fetch(`/api/minisite-services/${businessId}`)
        .then(response => response.json())
        .then(data => setEnabled(data?.qrEnabled !== false))
        .catch(() => setEnabled(true));
    }
  }, [businessId, targetUrl]);

  if (!resolvedUrl || !enabled) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(resolvedUrl)}&color=000000&bgcolor=ffffff`;
  const fileName = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'minisite'}-qr.png`;

  return (
    <section style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: compact ? '0.6rem' : '1rem', padding: compact ? '1rem' : '1.5rem', background: '#fff', borderRadius: '12px', color: '#1e293b' }}>
      <img src={qrCodeUrl} alt={`QR code for ${businessName}`} width={compact ? 128 : 180} height={compact ? 128 : 180} style={{ display: 'block' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: compact ? '0.65rem' : '0.75rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Scan this minisite</div>
        {!compact && <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: '#64748b', maxWidth: '220px', overflowWrap: 'anywhere' }}>{resolvedUrl}</div>}
      </div>
      <a href={qrCodeUrl} download={fileName} target="_blank" rel="noreferrer" style={{ color: '#0f766e', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}>
        <i className="fas fa-download" style={{ marginRight: '0.35rem' }} /> DOWNLOAD QR
      </a>
    </section>
  );
}
