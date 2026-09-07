'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const GROUPS = [
  { key: 'presentation', label: 'Presentation & Media', color: '#0f766e' },
  { key: 'conversion', label: 'Conversion & Contact', color: '#b45309' },
  { key: 'trust', label: 'Trust & Branding', color: '#7c3aed' },
];

export default function VendorTemplateChooserPage() {
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/vendor/template-options');
    if (!response.ok) return;
    const result = await response.json();
    setData(result);
    setSelected(result.business?.template_id || '');
  }
  useEffect(() => { load(); }, []);

  async function chooseTemplate(templateId: string) {
    setMessage('');
    const response = await fetch('/api/vendor/template-options', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || 'This template is unavailable.'); return; }
    setSelected(templateId);
    setMessage('Template selected. Your minisite content stays unchanged.');
  }

  if (!data) return <div style={{ padding: '3rem', color: '#64748b' }}>Loading template choices...</div>;
  const trialEnds = data.trial?.trial_ends_at ? new Date(data.trial.trial_ends_at).toLocaleDateString() : '6 months from activation';

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div><div style={{ color: '#0f766e', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px' }}>MINISITE DESIGN LIBRARY</div><h1 style={{ margin: '0.35rem 0', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900 }}>Choose your minisite look</h1><p style={{ margin: 0, color: '#64748b', maxWidth: '620px' }}>Every vendor gets a beautiful Free template. During your six-month welcome period, eligible templates for your business category are available to try.</p></div>
        <Link href="/vendor/minisite" style={{ color: '#0f766e', fontWeight: 800, textDecoration: 'none' }}>Manage content and publish <i className="fas fa-arrow-right" /></Link>
      </header>

      <section style={{ background: '#0f172a', color: '#fff', borderRadius: '18px', padding: '1.2rem 1.4rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div><div style={{ color: '#f0c842', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>WELCOME TEMPLATE TRIAL</div><strong style={{ display: 'block', marginTop: '0.25rem' }}>Try eligible designs until {trialEnds}</strong></div>
        <div style={{ color: '#cbd5e1', fontSize: '0.78rem', alignSelf: 'center' }}>Your QR code, content, and URL remain unchanged when you switch.</div>
      </section>

      {message && <div role="status" style={{ padding: '0.8rem 1rem', marginBottom: '1rem', borderRadius: '10px', background: '#ecfdf5', color: '#166534', fontWeight: 700, fontSize: '0.8rem' }}>{message}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1rem' }}>
        {data.templates.map((template: any) => {
          const settings = template.settings || {};
          const isFree = template.tier === 'free' || template.tier === 'basic';
          const eligible = isFree || !!template.tier_eligible;
          const active = selected === template.id;
          const groups = settings.feature_groups || [];
          return <article key={template.id} style={{ background: '#fff', border: active ? '2px solid #0f766e' : '1px solid #e5e7eb', borderRadius: '14px', padding: '1.2rem', display: 'flex', flexDirection: 'column', minHeight: '250px', boxShadow: active ? '0 10px 24px rgba(15,118,110,0.12)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}><div><h2 style={{ margin: 0, fontSize: '1.05rem' }}>{template.name}</h2><span style={{ color: isFree ? '#15803d' : '#b45309', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>{isFree ? 'Free forever' : eligible ? 'Trial eligible' : 'Upgrade required'}</span></div>{active && <i className="fas fa-check-circle" style={{ color: '#0f766e' }} />}</div>
            <p style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5, minHeight: '2.4rem' }}>{settings.description || 'A responsive minisite design for your business.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>{GROUPS.map(group => { const included = groups.some((item: any) => item.id === group.key || item.key === group.key); return <span key={group.key} style={{ padding: '0.3rem 0.45rem', borderRadius: '5px', background: included ? `${group.color}12` : '#f8fafc', color: included ? group.color : '#94a3b8', fontSize: '0.6rem', fontWeight: 800 }}>{included ? '✓' : '·'} {group.label}</span>; })}</div>
            <button disabled={!eligible || active} onClick={() => chooseTemplate(template.id)} style={{ marginTop: 'auto', width: '100%', padding: '0.7rem', border: 0, borderRadius: '9px', background: active ? '#ccfbf1' : eligible ? '#0f766e' : '#e2e8f0', color: active ? '#115e59' : eligible ? '#fff' : '#94a3b8', fontWeight: 900, cursor: eligible && !active ? 'pointer' : 'not-allowed' }}>{active ? 'Currently selected' : eligible ? 'Select template' : 'Upgrade to unlock'}</button>
          </article>;
        })}
      </div>
    </div>
  );
}
