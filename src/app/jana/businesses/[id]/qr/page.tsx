'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BusinessQRCodePage() {
  const { id } = useParams();
  const router = useRouter();
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'sand' | 'midnight' | 'minimal'>('sand');
  
  // Custom flyer texts (customizable on the fly before printing!)
  const [customPromo, setCustomPromo] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  useEffect(() => {
    if (id) {
      loadBusiness();
    }
  }, [id]);

  async function loadBusiness() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/businesses?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setBiz(data);
        setCustomTitle(data.name);
        setCustomPromo(`Scan to discover our full story, view cinematic photos, and book experiences directly on Siwa.Today.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6F0', color: '#1e293b' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '1rem' }}></i>
          <p style={{ fontWeight: 800, letterSpacing: '1px' }}>GENERATING QR KIT...</p>
        </div>
      </div>
    );
  }

  if (!biz) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Business Not Found</h2>
        <Link href="/jana/businesses" className="btn btn-primary">Back to Registry</Link>
      </div>
    );
  }

  const targetUrl = `https://www.siwa.today/${biz.slug || biz.id}`;
  // Use public dynamic QR code generator API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}&color=000000&bgcolor=ffffff`;

  // Styling based on active theme
  const getThemeStyles = () => {
    switch (theme) {
      case 'midnight':
        return {
          wrapper: { background: '#0f172a', color: '#f8fafc', border: '12px double #D4AF37' },
          accentText: { color: '#D4AF37' },
          card: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' },
          logo: { color: '#D4AF37' }
        };
      case 'minimal':
        return {
          wrapper: { background: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0' },
          accentText: { color: '#6b7280' },
          card: { background: '#f8fafc', border: '1px dashed #cbd5e1' },
          logo: { color: '#1e293b' }
        };
      case 'sand':
      default:
        return {
          wrapper: { background: '#FAF6F0', color: '#1e293b', border: '12px double #8b5cf6' },
          accentText: { color: '#D4AF37' },
          card: { background: '#ffffff', border: '1px solid #eae1d4' },
          logo: { color: '#8b5cf6' }
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem' }}>
      
      {/* ── TOOLBAR (Hidden in Print) ── */}
      <div className="no-print" style={{
        maxWidth: '800px', margin: '0 auto 2rem auto', background: '#fff',
        padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'grid', gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 900 }}>🏷️ Cinematic QR Flyer Studio</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Create and customize a physical table-tent or checkout flyer for this partner.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/jana/businesses" className="btn btn-xs" style={{ background: '#f1f5f9', color: '#64748b', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
              <i className="fas fa-arrow-left"></i> Registry
            </Link>
            <button onClick={() => window.print()} className="btn btn-xs" style={{ background: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              <i className="fas fa-print"></i> Print Flyer
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
          {/* Custom title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Custom Heading</label>
            <input type="text" className="form-control" value={customTitle} onChange={e => setCustomTitle(e.target.value)} style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }} />
          </div>
          {/* Custom promo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Promo Message</label>
            <input type="text" className="form-control" value={customPromo} onChange={e => setCustomPromo(e.target.value)} style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }} />
          </div>
          {/* Theme selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Flyer Theme</label>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['sand', 'midnight', 'minimal'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer',
                    background: theme === t ? '#1e293b' : '#f1f5f9', color: theme === t ? '#fff' : '#64748b',
                    border: 'none', fontWeight: 700, textTransform: 'capitalize'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── THE FLYER CANVAS (Scaled for A4 paper printout) ── */}
      <div className="print-canvas" style={{
        width: '210mm',
        height: '297mm',
        margin: '0 auto',
        boxSizing: 'border-box',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        transition: 'all 0.3s',
        ...styles.wrapper
      }}>
        
        {/* Flyer Top Header */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', ...styles.accentText }}>
            Welcome to the Oasis
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '0.75rem 0', fontFamily: 'Outfit, sans-serif', letterSpacing: '-1px', lineHeight: 1.1 }}>
            {customTitle}
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.4rem 1.25rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700 }}>
            <i className="fas fa-location-dot" style={{ color: '#D4AF37' }}></i>
            SIWA OASIS, EGYPT
          </div>
        </div>

        {/* Central QR Code Framed Container */}
        <div style={{
          padding: '2.5rem',
          borderRadius: '24px',
          textAlign: 'center',
          maxWidth: '450px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
          ...styles.card
        }}>
          {/* QR Code Frame */}
          <div style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            marginBottom: '1.5rem',
            display: 'inline-block'
          }}>
            <img src={qrCodeUrl} alt="Siwa.Today QR Link" style={{ width: '220px', height: '220px', display: 'block' }} />
          </div>

          <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Scan with your Camera
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5, color: theme === 'midnight' ? '#cbd5e1' : '#475569' }}>
            {customPromo}
          </p>
        </div>

        {/* Flyer Footer with branding */}
        <div style={{
          width: '100%',
          borderTop: '2px solid rgba(139, 92, 246, 0.1)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>EXCLUSIVE DIGITAL PARTNER</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <i className="fas fa-umbrella-beach" style={{ ...styles.logo }}></i>
              SIWA<span style={{ ...styles.logo }}>.TODAY</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', display: 'block' }}>POWERED BY</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#D4AF37', letterSpacing: '1px' }}>SIWIFY</span>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-canvas {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            padding: 2cm !important;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
        }
      `}</style>

    </div>
  );
}
