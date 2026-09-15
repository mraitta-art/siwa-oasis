'use client';

import React, { useState, useEffect } from 'react';

interface WhatsAppInviteModalProps {
  businessId: string;
  businessName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppInviteModal({
  businessId,
  businessName = 'Business',
  isOpen,
  onClose
}: WhatsAppInviteModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [trialUnit, setTrialUnit] = useState<'hours' | 'days' | 'months'>('hours');
  const [trialValue, setTrialValue] = useState<number>(12);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (isOpen && businessId) {
      loadAccessInvite();
    }
  }, [isOpen, businessId]);

  async function loadAccessInvite() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        trialUnit,
        trialValue: String(trialValue)
      });
      const res = await fetch(`/api/jana/businesses/${businessId}/access-invite?${params.toString()}`);
      if (res.ok) {
        const inviteData = await res.json();
        setData(inviteData);
        setPhone(inviteData.phone || '');
        if (inviteData.trialUnit) setTrialUnit(inviteData.trialUnit);
        if (inviteData.trialValue) setTrialValue(Number(inviteData.trialValue));
      }
    } catch (e) {
      console.error('Failed to load access invite', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegeneratePassword() {
    if (!confirm('Are you sure you want to regenerate a new temporary password? The previous one will no longer work.')) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await fetch(`/api/jana/businesses/${businessId}/access-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialUnit, trialValue })
      });
      if (res.ok) {
        await loadAccessInvite();
        copyToClipboard('regenerated', 'New password generated!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  }

  const copyToClipboard = async (fieldName: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 3000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  if (!isOpen) return null;

  const currentMessage = lang === 'ar' ? (data?.whatsappMessageAr || '') : (data?.whatsappMessageEn || '');
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanPhone ? cleanPhone : ''}?text=${encodeURIComponent(currentMessage)}`;
  const selectedDurationLabel = `${trialValue} ${trialUnit}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', fontFamily: "'Inter', sans-serif"
    }} onClick={onClose}>
      
      <div style={{
        background: '#fff', borderRadius: '24px', maxWidth: '780px', width: '100%',
        maxHeight: '92vh', overflowY: 'auto', padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        animation: 'scaleIn 0.2s ease-out'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px',
              background: '#25D366', color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
            }}>
              <i className="fab fa-whatsapp" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                WhatsApp Access &amp; Barcode Kit
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                For <strong style={{ color: '#0f172a' }}>{data?.businessName || businessName}</strong>
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem',
              cursor: 'pointer', padding: '0.2rem', lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#25D366', marginBottom: '1rem' }} />
            <div>Generating Barcode &amp; Temporary Access Credentials...</div>
          </div>
        ) : (
          <>
            {/* Quick Cards Grid: Barcode + Credentials */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.25rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              
              {/* QR Barcode Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '0.75rem', borderRadius: '14px', border: '1px solid #e2e8f0', minWidth: '130px' }}>
                <img src={data?.barcodeUrl} alt="QR Barcode" style={{ width: '110px', height: '110px', display: 'block' }} />
                <a
                  href={data?.barcodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f766e', marginTop: '0.4rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  <i className="fas fa-download" /> DOWNLOAD QR
                </a>
              </div>

              {/* Credentials Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                
                {/* Minisite URL */}
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
                    🌐 MINISITE PUBLIC LINK
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={data?.minisiteUrl || ''}
                      style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#fff', fontWeight: 600, color: '#0f172a' }}
                    />
                    <button
                      onClick={() => copyToClipboard('url', data?.minisiteUrl)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: copiedField === 'url' ? '#dcfce7' : '#fff', color: copiedField === 'url' ? '#166534' : '#1e293b', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {copiedField === 'url' ? '✓ Copied' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* Username / Email */}
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
                    👤 TEMPORARY VENDOR USERNAME
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={data?.username || ''}
                      style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#fff', fontWeight: 700, color: '#0f172a' }}
                    />
                    <button
                      onClick={() => copyToClipboard('username', data?.username)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: copiedField === 'username' ? '#dcfce7' : '#fff', color: copiedField === 'username' ? '#166534' : '#1e293b', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {copiedField === 'username' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
                      🔑 TEMPORARY VENDOR PASSWORD
                    </div>
                    <button
                      onClick={handleRegeneratePassword}
                      disabled={regenerating}
                      style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <i className={regenerating ? "fas fa-spinner fa-spin" : "fas fa-sync-alt"} /> Regenerate
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        readOnly
                        value={data?.tempPassword || ''}
                        style={{ width: '100%', padding: '0.35rem 2rem 0.35rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#fff', fontWeight: 800, letterSpacing: showPassword ? 'normal' : '2px', color: '#b91c1c' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem' }}
                      >
                        <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
                      </button>
                    </div>
                    <button
                      onClick={() => copyToClipboard('password', data?.tempPassword)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: copiedField === 'password' ? '#dcfce7' : '#fff', color: copiedField === 'password' ? '#166534' : '#1e293b', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {copiedField === 'password' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Recipient Phone & Language Picker */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                  RECIPIENT WHATSAPP PHONE NUMBER
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="tel"
                    placeholder="e.g. +20 101 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ flex: 1, padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                  TRIAL UNIT
                </label>
                <select
                  value={trialUnit}
                  onChange={(e) => setTrialUnit(e.target.value as 'hours' | 'days' | 'months')}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, background: '#fff' }}
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                  DURATION
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={trialValue}
                  onChange={(e) => setTrialValue(Math.max(1, Number(e.target.value) || 1))}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, background: '#fff' }}
                />
              </div>

              <div style={{ gridColumn: '2 / span 2' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                  MESSAGE LANGUAGE
                </label>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    style={{
                      flex: 1, padding: '0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '0.75rem', fontWeight: 800,
                      background: lang === 'en' ? '#0f172a' : 'transparent',
                      color: lang === 'en' ? '#fff' : '#64748b'
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('ar')}
                    style={{
                      flex: 1, padding: '0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '0.75rem', fontWeight: 800,
                      background: lang === 'ar' ? '#25D366' : 'transparent',
                      color: lang === 'ar' ? '#fff' : '#64748b'
                    }}
                  >
                    العربية
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                TRIAL SETTINGS • QR = PUBLIC PAGE ONLY • DASHBOARD = PRIVATE ACCESS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {[
                  `Access window: ${selectedDurationLabel}`,
                  'Public QR opens the minisite only',
                  'Dashboard login is sent separately',
                  'Public page remains live after expiry',
                  'Dashboard access ends when the trial expires'
                ].map(item => (
                  <div key={item} style={{ padding: '0.5rem 0.7rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#334155', fontWeight: 700 }}>
                    <i className="fas fa-check" style={{ color: '#16a34a', marginRight: '0.4rem' }} />{item}
                  </div>
                ))}
              </div>
            </div>

            {/* Formatted WhatsApp Message Preview */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>
                  PREVIEW MESSAGE (READY TO SEND / PASTE)
                </span>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                  <i className="fas fa-check" /> Formatted for WhatsApp Markdown (*bold*, _italic_)
                </span>
              </div>
              <textarea
                readOnly
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                rows={7}
                value={currentMessage}
                style={{
                  width: '100%', padding: '0.8rem', borderRadius: '12px',
                  border: '1px solid #cbd5e1', background: '#f8fafc',
                  fontSize: '0.8rem', lineHeight: 1.5, color: '#1e293b',
                  fontFamily: 'monospace, sans-serif'
                }}
              />
            </div>

            {/* Bottom Master Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <a
                  href={data?.minisiteUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1',
                    background: '#fff', color: '#0f172a', fontSize: '0.8rem', fontWeight: 900,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)'
                  }}
                >
                  <i className="fas fa-external-link-alt" /> OPEN MINISITE
                </a>
                <a
                  href={data?.loginUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1',
                    background: '#fff', color: '#0f172a', fontSize: '0.8rem', fontWeight: 900,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)'
                  }}
                >
                  <i className="fas fa-user-shield" /> OPEN DASHBOARD
                </a>
              </div>

              {/* COPY TO CLIPBOARD BUTTON */}
              <button
                type="button"
                onClick={() => copyToClipboard('all', currentMessage)}
                style={{
                  padding: '0.85rem', borderRadius: '12px', border: 'none',
                  background: copiedField === 'all' ? '#10b981' : '#0f172a',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s'
                }}
              >
                <i className={copiedField === 'all' ? "fas fa-check-double" : "fas fa-copy"} />
                {copiedField === 'all' ? 'COPIED TO CLIPBOARD! ✅' : 'COPY FOR WHATSAPP'}
              </button>

              {/* DIRECT OPEN IN WHATSAPP BUTTON */}
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.85rem', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 900,
                  textDecoration: 'none', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
                  transition: 'transform 0.15s', gridColumn: '1 / span 2'
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                SEND VIA WHATSAPP
              </a>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
