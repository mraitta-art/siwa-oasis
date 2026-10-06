'use client';

import React, { useState, useEffect } from 'react';

export interface MinisiteClaimBannerProps {
  businessId: string;
  businessName: string;
  slug: string;
  initialClaimed?: boolean;
  primaryColor?: string;
}

export default function MinisiteClaimBanner({
  businessId,
  businessName,
  slug,
  initialClaimed = false,
  primaryColor = '#D4AF37',
}: MinisiteClaimBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClaimed, setIsClaimed] = useState(initialClaimed);
  const [loading, setLoading] = useState(false);
  const [vendorPhone, setVendorPhone] = useState('');
  const [agreeBio, setAgreeBio] = useState(true);
  const [agreeSocial, setAgreeSocial] = useState(true);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('claim') === '1' || urlParams.get('preview') === 'claim') {
      setIsOpen(true);
    }
  }, []);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/businesses/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          slug,
          vendorPhone,
          agreeBioLink: agreeBio,
          agreeSocialSync: agreeSocial,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsClaimed(true);
        setSuccessData(data);
      } else {
        alert(data.error || 'Failed to claim minisite.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error claiming minisite.');
    } finally {
      setLoading(false);
    }
  };

  if (isClaimed && !successData) return null;

  return (
    <>
      {/* FLOATING INVITATION TRIGGER (IF NOT ALREADY OPEN) */}
      {!isOpen && !isClaimed && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            color: '#fff',
            border: `2px solid ${primaryColor}`,
            padding: '10px 18px',
            borderRadius: '50px',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'pulse 2s infinite'
          }}
        >
          <span style={{ color: primaryColor }}>👑</span>
          <span>Claim Official Minisite</span>
        </button>
      )}

      {/* CLAIM MODAL DIALOG */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '28px',
            maxWidth: '540px',
            width: '100%',
            padding: '2.2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
            border: '1px solid #f1f5f9'
          }}>
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                border: 0,
                background: '#f1f5f9',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem',
                color: '#64748b'
              }}
            >
              ✕
            </button>

            {!successData ? (
              /* CLAIM FORM */
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(212,175,55,0.15)', color: '#b45309', padding: '4px 12px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 900, marginBottom: '1rem' }}>
                  ★ OFFICIAL SIWIFY MINISITE
                </div>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  Claim & Activate {businessName}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                  This official digital minisite is pre-configured for your business. Accept with 1-tap to take ownership and unlock direct bookings.
                </p>

                {/* VIP BENEFITS CHECKLIST */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
                    🎁 INCLUDED FOR FREE UPON ACCEPTANCE:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#334155' }}>
                    <div>✅ <strong>1-Click WhatsApp Direct Bookings</strong> (Zero commission)</div>
                    <div>✅ <strong>Auto-Synced HD Video Carousel</strong> (from TikTok & Instagram)</div>
                    <div>✅ <strong>Print-Ready QR Standee</strong> for physical reception/tables</div>
                    <div>✅ <strong>30-Day Gold Verified Partner Badge 🥇</strong></div>
                  </div>
                </div>

                {/* PHONE INPUT */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    Your WhatsApp Number (for receiving guest bookings)
                  </label>
                  <input
                    type="tel"
                    placeholder="+20 1X XXXX XXXX"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* AGREEMENT CHECKBOXES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={agreeBio} onChange={(e) => setAgreeBio(e.target.checked)} style={{ marginTop: '2px' }} />
                    <span>I agree to feature my official minisite link (<strong>siwify.com/{slug}</strong>) in my social media bio.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={agreeSocial} onChange={(e) => setAgreeSocial(e.target.checked)} style={{ marginTop: '2px' }} />
                    <span>I agree to auto-sync public reels and photos to my hero carousel.</span>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                    color: '#1a1000',
                    border: 0,
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px rgba(212,175,55,0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? 'Activating Minisite...' : '✅ Accept & Claim My Minisite (1-Tap)'}
                </button>
              </div>
            ) : (
              /* SUCCESS STATE */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  Congratulations!
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Your official minisite is now verified and active.
                </p>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', wordBreak: 'break-all', fontWeight: 800, color: '#0f172a' }}>
                  🔗 {successData.business?.vanityUrl}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(successData.business?.vanityUrl);
                      alert('Copied link to clipboard! Paste it in your Instagram / TikTok Bio.');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: '#0f172a',
                      color: '#fff',
                      border: 0,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy Bio Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderRadius: '12px',
                      background: '#f1f5f9',
                      color: '#1e293b',
                      border: 0,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    View My Site
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
