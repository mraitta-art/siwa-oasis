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

export default function AdminVendorModalPage() {
  const [settings, setSettings] = useState<VendorModalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/vendor-modal-settings');
        const data = await res.json();
        setSettings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/admin/vendor-modal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMsg('Settings saved successfully!');
        setTimeout(() => setMsg(''), 4000);
      } else {
        setMsg('Error saving settings');
      }
    } catch (e) {
      setMsg('Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Loading Vendor Ecosystem & Modal Governance...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Link href="/admin" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
              ← Admin Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            Vendor Ecosystem Modal & Watermark Governance
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
            Control when the onboarding declaration modal pops up for vendors and configure public free minisite watermarks.
          </p>
        </div>

        {msg && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '0.6rem 1.25rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}>
            {msg}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Modal Timing & Kill Switch */}
        <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⏱️ Modal Timing & Trigger Controls
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Master Kill Switch
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enabled: true })}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: '1.5px solid',
                    borderColor: settings.enabled ? '#16a34a' : '#e2e8f0',
                    background: settings.enabled ? 'rgba(34,197,94,0.1)' : '#fff',
                    color: settings.enabled ? '#16a34a' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  🟢 ACTIVE (POPUP ON)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enabled: false })}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: '1.5px solid',
                    borderColor: !settings.enabled ? '#dc2626' : '#e2e8f0',
                    background: !settings.enabled ? 'rgba(220,38,38,0.1)' : '#fff',
                    color: !settings.enabled ? '#dc2626' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  🔴 PAUSED / DISABLED
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Recurrence Frequency (Timing Off Cycle)
              </label>
              <select
                value={settings.frequency}
                onChange={e => setSettings({ ...settings, frequency: e.target.value as any })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, background: '#fff' }}
              >
                <option value="every_session">Every Browser Session (Aggressive)</option>
                <option value="every_24h">Once Every 24 Hours</option>
                <option value="every_3d">Once Every 3 Days (Recommended)</option>
                <option value="every_7d">Once Every 7 Days</option>
                <option value="once_only">Once on Registration Only</option>
                <option value="disabled">Disabled Entirely</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Public Watermark & Brand Protection */}
        <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏷️ Public Minisite Watermark Authority
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Watermark on Free Minisites
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enable_watermark: true })}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: '1.5px solid',
                    borderColor: settings.enable_watermark ? '#D4AF37' : '#e2e8f0',
                    background: settings.enable_watermark ? 'rgba(212,175,55,0.12)' : '#fff',
                    color: settings.enable_watermark ? '#92400e' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  🛡️ ENABLE WATERMARK
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enable_watermark: false })}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: '1.5px solid',
                    borderColor: !settings.enable_watermark ? '#64748b' : '#e2e8f0',
                    background: !settings.enable_watermark ? '#f1f5f9' : '#fff',
                    color: !settings.enable_watermark ? '#0f172a' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  NO WATERMARK
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Watermark Text
              </label>
              <input
                type="text"
                value={settings.watermark_text}
                onChange={e => setSettings({ ...settings, watermark_text: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
            * Note: Paid tiers (Standard / Pro / Premium) automatically have the watermark removed to guarantee 100% whitelabel authority for their business brand.
          </p>
        </div>

        {/* Section 3: Promotional Content Customizer */}
        <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✍️ Modal Promotional Copy
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Top Promo Badge
              </label>
              <input
                type="text"
                value={settings.promo_badge}
                onChange={e => setSettings({ ...settings, promo_badge: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Modal Headline
              </label>
              <input
                type="text"
                value={settings.headline}
                onChange={e => setSettings({ ...settings, headline: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Subtitle / Description
              </label>
              <textarea
                rows={2}
                value={settings.subtitle}
                onChange={e => setSettings({ ...settings, subtitle: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.85rem 2rem',
              borderRadius: '14px',
              backgroundColor: '#D4AF37',
              color: '#1a1000',
              fontWeight: 900,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,175,55,0.3)',
              transition: 'opacity 0.2s'
            }}
          >
            {saving ? 'Saving Changes...' : 'Save Modal & Watermark Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
