'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { tagMinisiteUrl } from '@/lib/promo-kit';

interface MinisiteQRCodeProps {
  businessName: string;
  targetUrl?: string;
  slug?: string;
  businessId?: string;
  compact?: boolean;
  /** Attribution tag encoded in the QR itself, so scans are measurable. */
  src?: string;
}

export default function MinisiteQRCode({ businessName, targetUrl, slug, businessId, compact = false, src }: MinisiteQRCodeProps) {
  const [resolvedUrl, setResolvedUrl] = useState(targetUrl || '');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrEnabled, setQrEnabled] = useState(!businessId);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const baseUrl = targetUrl || (slug
      ? `${window.location.origin}/${encodeURIComponent(slug)}`
      : window.location.href.split(/[?#]/)[0]);
    const pageUrl = src ? tagMinisiteUrl(baseUrl, src) : baseUrl;
    setResolvedUrl(pageUrl);
    setQrCodeUrl('');
    setError('');

    async function createQrCode() {
      try {
        const parsedUrl = new URL(pageUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('The minisite URL is invalid.');
        }

        if (businessId) {
          const response = await fetch(`/api/minisite-services/${encodeURIComponent(businessId)}`);
          if (!response.ok) throw new Error('QR-code availability could not be verified.');
          const service = await response.json();
          if (service.qrEnabled !== true) {
            if (!cancelled) setQrEnabled(false);
            return;
          }
        }

        const dataUrl = await QRCode.toDataURL(pageUrl, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 320,
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (!cancelled) {
          setQrEnabled(true);
          setQrCodeUrl(dataUrl);
        }
      } catch (cause) {
        console.error('[MinisiteQRCode] Failed to generate QR code:', cause);
        if (!cancelled) {
          setQrEnabled(false);
          setError(cause instanceof Error ? cause.message : 'Unable to generate the QR code.');
        }
      }
    }

    void createQrCode();
    return () => {
      cancelled = true;
    };
  }, [businessId, slug, targetUrl, src]);

  if (error) return <p role="status" style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</p>;
  if (!qrEnabled || !resolvedUrl || !qrCodeUrl) return null;

  const fileName = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'minisite'}-qr.png`;

  return (
    <section style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: compact ? '0.6rem' : '1rem', padding: compact ? '1rem' : '1.5rem', background: '#fff', borderRadius: '12px', color: '#1e293b' }}>
      <img src={qrCodeUrl} alt={`QR code for ${businessName}`} width={compact ? 128 : 220} height={compact ? 128 : 220} style={{ display: 'block' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: compact ? '0.65rem' : '0.75rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Scan this minisite</div>
        {!compact && <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: '#64748b', maxWidth: '260px', overflowWrap: 'anywhere' }}>{resolvedUrl}</div>}
      </div>
      <a href={qrCodeUrl} download={fileName} style={{ color: '#0f766e', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}>
        <i className="fas fa-download" style={{ marginRight: '0.35rem' }} /> DOWNLOAD QR
      </a>
    </section>
  );
}
