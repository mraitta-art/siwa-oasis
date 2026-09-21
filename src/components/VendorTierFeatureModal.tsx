'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface VendorModalSettings {
  enabled: boolean;
  frequency: 'every_session' | 'every_24h' | 'every_3d' | 'every_7d' | 'once_only' | 'disabled';
  target_tier: 'free_only' | 'all';
  enable_watermark: boolean;
  watermark_text: string;
  watermark_link: string;
  promo_badge: string;
  headline: string;
  subtitle: string;
  free_tier_features: string[];
  pro_tier_features: string[];
}

interface Props {
  forceOpen?: boolean;
  onClose?: () => void;
  vendorTier?: string;
  businessName?: string;
}

const STORAGE_KEY = 'siwa_vendor_tier_modal_last_shown';

export default function VendorTierFeatureModal({
  forceOpen = false,
  onClose,
  vendorTier = 'free',
  businessName = 'Your Business'
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<VendorModalSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'services'>('overview');

  useEffect(() => {
    async function initModal() {
      try {
        const res = await fetch('/api/admin/vendor-modal-settings');
        if (!res.ok) return;
        const data: VendorModalSettings = await res.json();
        setSettings(data);

        if (forceOpen) {
          setIsOpen(true);
          return;
        }

        if (!data.enabled || data.frequency === 'disabled') {
          return;
        }

        // Target audience check
        const isFree = !vendorTier || vendorTier.toLowerCase() === 'free';
        if (data.target_tier === 'free_only' && !isFree) {
          return;
        }

        // Frequency check
        const lastShownStr = localStorage.getItem(STORAGE_KEY);
        if (!lastShownStr) {
          setIsOpen(true);
          return;
        }

        const lastShown = parseInt(lastShownStr, 10);
        const now = Date.now();
        const diffHours = (now - lastShown) / (1000 * 60 * 60);

        if (data.frequency === 'every_session') {
          const sessionShown = sessionStorage.getItem(STORAGE_KEY + '_session');
          if (!sessionShown) {
            setIsOpen(true);
          }
        } else if (data.frequency === 'every_24h' && diffHours >= 24) {
          setIsOpen(true);
        } else if (data.frequency === 'every_3d' && diffHours >= 72) {
          setIsOpen(true);
        } else if (data.frequency === 'every_7d' && diffHours >= 168) {
          setIsOpen(true);
        }
      } catch (err) {
        console.error('[VENDOR MODAL INIT ERROR]', err);
      }
    }

    initModal();
  }, [forceOpen, vendorTier]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    sessionStorage.setItem(STORAGE_KEY + '_session', 'true');
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      padding: '1rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        maxWidth: '860px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Close Button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          title="Close Modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '2.5rem 2rem 2rem',
          borderRadius: '24px 24px 0 0',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#D4AF37',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            marginBottom: '1rem'
          }}>
            ✦ {settings?.promo_badge || 'Official Siwify Vendor Ecosystem'}
          </div>

          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            margin: '0 0 0.5rem',
            color: '#ffffff',
            lineHeight: 1.2
          }}>
            {settings?.headline || 'Welcome to Your Siwify Minisite & Partner Ecosystem'}
          </h2>

          <p style={{
            color: '#94a3b8',
            fontSize: '0.9rem',
            margin: 0,
            maxWidth: '680px',
            lineHeight: 1.5
          }}>
            {settings?.subtitle || 'All features, packages, templates, and vendor tier authority declared below.'}
          </p>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '0.25rem'
          }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'overview' ? '#D4AF37' : '#94a3b8',
                borderBottom: activeTab === 'overview' ? '2px solid #D4AF37' : '2px solid transparent',
                padding: '0.5rem 0.75rem',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🏷️ Free Template Inclusions
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'comparison' ? '#D4AF37' : '#94a3b8',
                borderBottom: activeTab === 'comparison' ? '2px solid #D4AF37' : '2px solid transparent',
                padding: '0.5rem 0.75rem',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              👑 Vendor Tier Matrix
            </button>
            <button
              onClick={() => setActiveTab('services')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'services' ? '#D4AF37' : '#94a3b8',
                borderBottom: activeTab === 'services' ? '2px solid #D4AF37' : '2px solid transparent',
                padding: '0.5rem 0.75rem',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🚀 Ecosystem Add-Ons
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem', flex: 1, backgroundColor: '#f8fafc' }}>
          {activeTab === 'overview' && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                borderRadius: '18px',
                padding: '1.5rem',
                border: '1.5px solid #e2e8f0',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      ✓
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>100% Free Forever Template</h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Every registered business in Siwa receives this live baseline</span>
                    </div>
                  </div>
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                    ACTIVE
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {(settings?.free_tier_features || [
                    'Permanent Free Vanity URL & Search Listing',
                    'Verified Identity & GPS Oasis Map Navigation',
                    'Direct WhatsApp & Phone Customer Leads',
                    'High-Resolution Photo Showcase (Up to 6 photos)',
                    'Desktop & Mobile Responsive Minisite',
                    'Instant Tabletop & Front-Desk QR Code'
                  ]).map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                      <span style={{ color: '#16a34a', fontWeight: 900 }}>✔</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Watermark Notice */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px dashed rgba(212, 175, 55, 0.4)',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Public Minisite Watermark Notice</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Free minisites include the elegant <em>"Powered by Siwify.com"</em> watermark ribbon. Upgrading to a paid tier removes the watermark and unlocks full whitelabel authority.
                    </div>
                  </div>
                </div>
                <Link
                  href="/vendor/upgrade"
                  onClick={handleDismiss}
                  style={{
                    backgroundColor: '#D4AF37',
                    color: '#1a1000',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upgrade to Whitelabel →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Free Card */}
              <div style={{ background: '#fff', borderRadius: '18px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Entry Baseline</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: '0.25rem 0 0.75rem' }}>Free Template</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16a34a', marginBottom: '1rem' }}>$0 <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ lifetime</span></div>
                
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                  <li>Standard Identity & Contact Card</li>
                  <li>WhatsApp & Phone Leads</li>
                  <li>GPS Map & Hours of Operation</li>
                  <li>Max 6 Showcase Photos</li>
                  <li style={{ color: '#94a3b8' }}>Siwify Watermark included</li>
                </ul>

                <button onClick={handleDismiss} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                  Current Plan
                </button>
              </div>

              {/* Pro Card */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', borderRadius: '18px', padding: '1.5rem', border: '2px solid #D4AF37', boxShadow: '0 10px 25px -5px rgba(212,175,55,0.25)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '1.5rem', background: '#D4AF37', color: '#1a1000', fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '8px' }}>
                  MOST POPULAR
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase' }}>Full Authority</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', margin: '0.25rem 0 0.75rem' }}>Pro Tier</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D4AF37', marginBottom: '1rem' }}>EGP 999 <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ year</span></div>

                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                  <li><strong>Zero Watermark</strong> (100% Whitelabel)</li>
                  <li>Direct Room / Menu / Service Pricing</li>
                  <li>Sub-path deep links (/{'{slug}'}/rooms)</li>
                  <li>Unlimited Media & Hero Video Backgrounds</li>
                  <li>Package Builder & Tour Inquiries</li>
                  <li>Priority Search & Featured Carousel</li>
                </ul>

                <Link href="/vendor/upgrade" onClick={handleDismiss} style={{ display: 'block', textAlign: 'center', width: '100%', padding: '0.65rem', borderRadius: '10px', background: 'linear-gradient(135deg, #D4AF37, #f59e0b)', color: '#1a1000', fontWeight: 900, fontSize: '0.8rem', textDecoration: 'none', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>
                  Upgrade to Pro →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📸</div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Professional Media Production</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                  High-definition photography, drone desert shots, and cinematic 4K hero video captures by Siwify media crew.
                </p>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⭐</div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Homepage & Vibe Sponsorship</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                  Guaranteed top banner placement on the Siwify homepage, category filters, and curated explorer journeys.
                </p>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🌐</div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Custom Domain Connect</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                  Connect your own custom domain (e.g. <code>myecolodge.com</code>) directly to your Siwify cinematic engine.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.25rem 2rem',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          borderRadius: '0 0 24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
            <span>Need personalized help?</span>
            <a href="https://wa.me/201000000000?text=Hi%20Siwify%2C%20I%20want%20to%20upgrade%20my%20business%20minisite" target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <i className="fab fa-whatsapp" /> Chat with Partner Advisor
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleDismiss}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Continue to Dashboard
            </button>
            <Link
              href="/vendor/upgrade"
              onClick={handleDismiss}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                textDecoration: 'none',
                border: '1px solid #334155'
              }}
            >
              Explore Upgrade Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
