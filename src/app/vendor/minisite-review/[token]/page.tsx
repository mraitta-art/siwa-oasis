'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import MinisiteBuilderRenderer from '@/components/MinisiteBuilderRenderer';
import {
  VENDOR_AGREEMENT_SECTIONS,
  VENDOR_AGREEMENT_VERSION,
  VENDOR_MINISITE_RESPONSIBILITY_ACKNOWLEDGMENT,
  type VendorAgreementLanguage,
} from '@/lib/vendor-agreement';
import type { MinisiteLayout } from '@/lib/minisite-layout';

interface ReviewPayload {
  business: {
    id: string;
    name: string;
    slug: string;
    type_id: string;
    type_name: string;
    custom_data: any;
    gallery: any[];
    blogs: any[];
    tourProducts: any[];
    vendorPhone: string;
    siteSettings: Record<string, unknown>;
  };
  handoff: { id: string; revision: number; status: string; layout: MinisiteLayout };
  agreementVersion: string;
}

export default function VendorMinisiteReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [language, setLanguage] = useState<VendorAgreementLanguage>('en');
  const [name, setName] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [responsibilityAcknowledged, setResponsibilityAcknowledged] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/vendor/minisite-review/${encodeURIComponent(token)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load the review.');
        setPayload(data);
      })
      .catch(cause => setError(cause.message || 'Unable to load the review.'));
  }, [token]);

  async function respond(action: 'accept' | 'request_changes') {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/vendor/minisite-review/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          name,
          authorized,
          responsibilityAcknowledged,
          agreementAccepted,
          agreementVersion: VENDOR_AGREEMENT_VERSION,
          language,
          note: changeNote,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to record your response.');
      setSuccess(action === 'accept'
        ? 'Your review, agreement acceptance, and responsibility confirmation were recorded. Continue to vendor registration to manage this business.'
        : 'Your requested changes were sent to the SiWiFy team.');
      if (action === 'request_changes') {
        setPayload(current => current ? { ...current, handoff: { ...current.handoff, status: 'changes_requested' } } : current);
      } else {
        setPayload(current => current ? { ...current, handoff: { ...current.handoff, status: 'accepted' } } : current);
      }
    } catch (cause: any) {
      setError(cause.message || 'Unable to record your response.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !payload) {
    return <main style={pageStyle}><section style={cardStyle}><h1>Minisite review unavailable</h1><p>{error}</p><Link href="/">Return to SiWiFy</Link></section></main>;
  }
  if (!payload) return <main style={pageStyle}><section style={cardStyle}>Loading private minisite preview…</section></main>;

  const accepted = payload.handoff.status === 'accepted';
  const closed = ['changes_requested', 'published'].includes(payload.handoff.status);
  const agreementSections = VENDOR_AGREEMENT_SECTIONS;

  return (
    <main style={pageStyle}>
      <header style={{ ...cardStyle, marginBottom: 20 }}>
        <p style={{ margin: 0, color: '#9a6b00', fontWeight: 800 }}>PRIVATE VENDOR REVIEW · REVISION {payload.handoff.revision}</p>
        <h1 style={{ margin: '8px 0', color: '#0f172a' }}>{payload.business.name} minisite</h1>
        <p style={{ margin: 0, color: '#475569' }}>Review the prepared page below. It is not published by accepting this invitation.</p>
      </header>

      <section style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <MinisiteBuilderRenderer layout={payload.handoff.layout} business={payload.business} />
      </section>

      {accepted ? (
        <section style={cardStyle}>
          <h2>Acceptance recorded</h2>
          <p>{success || 'Thank you. Your review, agreement acceptance, and responsibility confirmation have been recorded.'}</p>
          <p>This response does not itself publish the page or activate your vendor account. Admins may publish a prepared revision separately. To manage <strong>{payload.business.name}</strong>, continue to vendor registration.</p>
          <Link href={`/signup?businessId=${encodeURIComponent(payload.business.id)}&typeId=${encodeURIComponent(payload.business.type_id)}`} style={primaryLink}>Continue to vendor registration</Link>
        </section>
      ) : closed ? (
        <section style={cardStyle}><h2>Response recorded</h2><p>{success || 'Your response has been recorded. The SiWiFy team will follow up.'}</p></section>
      ) : (
        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div><h2 style={{ margin: 0 }}>Vendor participation agreement</h2><small>Version {payload.agreementVersion}</small></div>
            <div>
              <button type="button" onClick={() => setLanguage('en')} style={language === 'en' ? activeLanguage : languageStyle}>English</button>
              <button type="button" onClick={() => setLanguage('ar')} style={language === 'ar' ? activeLanguage : languageStyle}>العربية</button>
            </div>
          </div>
          <div style={{ maxHeight: 360, overflow: 'auto', margin: '16px 0', padding: 16, border: '1px solid #e2e8f0', borderRadius: 10, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            {agreementSections.map(section => (
              <article key={section.title} style={{ marginBottom: 14 }}>
                <strong>{language === 'ar' ? section.titleAr : section.title}</strong>
                <p style={{ lineHeight: 1.7, margin: '5px 0' }}>{language === 'ar' ? section.bodyAr : section.body}</p>
              </article>
            ))}
          </div>

          <label style={fieldLabel}>Your full name
            <input value={name} onChange={event => setName(event.target.value)} maxLength={255} style={inputStyle} />
          </label>
          <label style={{ ...checkLabel, marginTop: 12 }}>
            <input type="checkbox" checked={authorized} onChange={event => setAuthorized(event.target.checked)} />
            I confirm that I am the owner or authorized representative of this business.
          </label>
          <label style={{ ...checkLabel, marginTop: 10, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <input
              type="checkbox"
              checked={responsibilityAcknowledged}
              onChange={event => setResponsibilityAcknowledged(event.target.checked)}
            />
            {VENDOR_MINISITE_RESPONSIBILITY_ACKNOWLEDGMENT[language]}
          </label>
          <label style={{ ...checkLabel, marginTop: 10 }}>
            <input type="checkbox" checked={agreementAccepted} onChange={event => setAgreementAccepted(event.target.checked)} />
            I have reviewed and accept the Vendor Participation Agreement, version {payload.agreementVersion}.
          </label>

          {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
          {success && <p role="status" style={{ color: '#166534' }}>{success}</p>}

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
            <label style={fieldLabel}>Request changes (optional)
              <textarea value={changeNote} onChange={event => setChangeNote(event.target.value)} maxLength={2000} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Describe what should be corrected before you accept." />
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button type="button" disabled={busy || !name.trim() || !authorized || !responsibilityAcknowledged || !agreementAccepted} onClick={() => respond('accept')} style={primaryButton}>
                {busy ? 'Submitting…' : 'Confirm responsibility & accept'}
              </button>
              <button type="button" disabled={busy || !changeNote.trim()} onClick={() => respond('request_changes')} style={secondaryButton}>
                Request changes
              </button>
            </div>
          </div>
        </section>
      )}
      <footer style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>SiWiFy · Private vendor review</footer>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f1f5f9', padding: '24px max(16px, calc((100vw - 1100px) / 2))', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,.05)' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: 11, border: '1px solid #cbd5e1', borderRadius: 8, font: 'inherit' };
const fieldLabel: React.CSSProperties = { display: 'block', fontWeight: 700, color: '#334155' };
const checkLabel: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.6 };
const languageStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' };
const activeLanguage: React.CSSProperties = { ...languageStyle, background: '#0f172a', color: '#fff' };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 9, padding: '11px 16px', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 9, padding: '11px 16px', background: '#fff', color: '#334155', fontWeight: 800, cursor: 'pointer' };
const primaryLink: React.CSSProperties = { display: 'inline-block', borderRadius: 9, padding: '11px 16px', background: '#0f172a', color: '#fff', fontWeight: 800, textDecoration: 'none' };
