'use client';

import React, { useEffect, useMemo, useState } from 'react';

/**
 * Prospect Intake.
 *
 * A vendor you can name and phone is a product, not a lead: this page turns the
 * two fields into an unclaimed business + a signed review link. The three modes
 * below are three commercial bets, so each one states what it produces, when to
 * pick it, what the vendor receives, and what the admin must do next.
 */

type Mode = 'baseline_send' | 'baseline_manual' | 'build_first';

type ModeSpec = {
  id: Mode;
  label: string;
  badge: string;
  badgeColor: string;
  tagline: string;
  vision: string;
  what: string[];
  when: string;
  sees: string;
  next: string;
  risk: string;
  button: string;
};

const MODES: ModeSpec[] = [
  {
    id: 'baseline_send',
    label: 'Send the free baseline now',
    badge: 'RECOMMENDED',
    badgeColor: '#166534',
    tagline: 'Name + phone → live page + WhatsApp link in one press.',
    vision:
      'Speed wins in Siwa. A vendor who receives a real page with his own name on it answers; a vendor asked to fill a form does not. The page is the hook, the negotiation comes after he replies.',
    what: [
      'Creates the business unclaimed (he stays the owner, not you).',
      'Writes vendor_phone — the column every send path reads.',
      'Resolves the typology template and drafts a 4-block baseline (hero, gallery, services, CTA).',
      'Issues a signed review link valid 7 days and sends the approved WhatsApp template.',
      'Promotes the record to Level 2 “curated” the moment it goes out.',
    ],
    when: 'You confirmed the number and he already knows SiWiFy — a visit, a referral, or a previous message.',
    sees: 'The review page: his free baseline, the 7 agreement sections, the mutual-visibility pledge, one acceptance button.',
    next: 'Watch “read” then “accepted” on the pipeline board. Do not call the same day. No reply in 7 days → resend once, then park.',
    risk: 'Delivery depends on an approved template. A cold number can come back “failed” — the page always returns a manual link as fallback.',
    button: 'Create & send invitation',
  },
  {
    id: 'baseline_manual',
    label: 'Prepare it, I send it myself',
    badge: 'HUMAN-FIRST',
    badgeColor: '#92400e',
    tagline: 'Same page and token — but the first message comes from your own number.',
    vision:
      'In a market this small, a message from a person beats a broadcast every time, and it carries no template-approval risk. Use the machine to build, use your thumb to open the relationship.',
    what: [
      'Creates the business unclaimed and writes vendor_phone.',
      'Drafts the free baseline and issues the same 7-day review token.',
      'Returns a ready wa.me link with the Arabic message already written.',
      'Nothing is sent by the API — no campaign row, no template log.',
    ],
    when: 'Cold number, first contact, or the WhatsApp Cloud API is not configured yet.',
    sees: 'The same review page, arriving from your own WhatsApp.',
    next: 'Send from your phone, then log the reply with “Log response” on the pipeline board so the funnel stays honest.',
    risk: 'Nothing is recorded as “sent” automatically. If you skip logging, the dashboard will under-report and you will chase the wrong vendors.',
    button: 'Create & give me the WhatsApp text',
  },
  {
    id: 'build_first',
    label: 'Build it first, send later',
    badge: 'SLOW BUT BEST',
    badgeColor: '#1e40af',
    tagline: 'Create the shell only. Shape the layout before the vendor ever sees it.',
    vision:
      'For the ten vendors you actually want — the anchor hotels, the best safaris — the page must look hand-made. This mode buys the time to do that, and protects you from sending something thin to your most valuable prospect.',
    what: [
      'Creates the business unclaimed and writes vendor_phone.',
      'Resolves the template so the builder opens on the right typology.',
      'Creates no handoff and no token: nothing can leak to the vendor.',
    ],
    when: 'High-value target, or the page needs a photo and pricing pass before anyone sees it.',
    sees: 'Nothing. He is not contacted by this action.',
    next: 'Open the Build Studio from the result, shape the layout, save the draft, then send from the builder — it uses the identical token path.',
    risk: 'Momentum cools fast. Give yourself one day per vendor, not one week.',
    button: 'Create the shell',
  },
];

type Result = {
  ok: boolean;
  mode: Mode;
  business: { id: string; name: string; slug: string; template_source: string; template_id: string | null };
  links: { public_url: string; builder_url: string; claim_url: string };
  handoff: { id: string; revision: number; status: string } | null;
  invitation: {
    sent: boolean;
    message_id?: string | null;
    review_url: string | null;
    wa_link: string | null;
    expires_at: string | null;
    reason: string | null;
  };
  next: string[];
  crm_contact?: { id: string; full_name: string } | null;
};

type RecentRow = {
  handoff_id: string;
  status: string;
  revision: number;
  created_at: string;
  whatsapp_message_id: string | null;
  whatsapp_error: string | null;
  token_expires_at: string | null;
  business_id: string;
  name: string;
  slug: string;
  vendor_phone: string | null;
  is_claimed: number | boolean;
  mode: string | null;
  public_url: string | null;
  claim_url: string | null;
};

type BulkRow = { phone: string; name: string };

type BulkResult = {
  ok: boolean;
  summary: { submitted: number; created: number; skipped: number; cap: number };
  type: { id: string; name: string };
  results: Array<{
    ok: boolean;
    phone: string;
    name?: string;
    slug?: string;
    public_url?: string;
    review_url?: string;
    wa_link?: string;
    expires_at?: string;
    reason?: string;
    existing?: { name: string; slug: string; is_claimed: boolean; claim_url: string };
  }>;
  next: string[];
};

/**
 * Read a pasted list where the shape is unknown: "01001234567", "0100…, كابتن أحمد",
 * or "كابتن محمود 0123…". The first digit run becomes the phone, everything else the name.
 */
function parseBulk(text: string): BulkRow[] {
  const rows: BulkRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/\+?\d[\d\s\-().]{6,}\d/);
    if (!match || match.index === undefined) {
      rows.push({ phone: '', name: line });
      continue;
    }
    const phone = match[0];
    const name = `${line.slice(0, match.index)} ${line.slice(match.index + match[0].length)}`
      .replace(/[,;|\-–—]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    rows.push({ phone, name });
  }
  return rows.slice(0, 12);
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#92400e',
  sent: '#1e40af',
  delivered: '#1e40af',
  read: '#0f766e',
  replied: '#0f766e',
  changes_requested: '#b45309',
  accepted: '#166534',
  published: '#166534',
  failed: '#b91c1c',
  expired: '#64748b',
};

const BULK_REASON: Record<string, string> = {
  invalid_phone: 'BAD NUMBER',
  duplicate_in_paste: 'REPEATED IN PASTE',
  already_exists: 'ALREADY ON PLATFORM',
};

export default function ProspectIntakePage() {
  const [mode, setMode] = useState<Mode>('baseline_send');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [typeId, setTypeId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [existing, setExisting] = useState<any | null>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [waConfigured, setWaConfigured] = useState(true);
  const [copied, setCopied] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const spec = useMemo(() => MODES.find((item) => item.id === mode) || MODES[0], [mode]);
  const bulkRows = useMemo(() => parseBulk(bulkText), [bulkText]);

  const load = async () => {
    try {
      const res = await fetch('/api/jana/prospects', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setTypes(Array.isArray(json.types) ? json.types : []);
      setRecent(Array.isArray(json.recent) ? json.recent : []);
      setWaConfigured(Boolean(json.whatsapp_configured));
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
    }
  };

  useEffect(() => { void load(); }, []);

  const copy = async (value: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(tag);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setError('Copy failed — select the text manually.');
    }
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    setExisting(null);
    try {
      const res = await fetch('/api/jana/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, name, phone, typeId, note }),
      });
      const json = await res.json();
      if (res.status === 409 && json?.existing) {
        setExisting(json.existing);
        return;
      }
      if (!res.ok) throw new Error(json?.error || 'Failed to create prospect');
      setResult(json as Result);
      setName('');
      setPhone('');
      setNote('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to create prospect');
    } finally {
      setBusy(false);
    }
  };

  const runBulk = async () => {
    if (!typeId || bulkRows.length === 0) return;
    setBusy(true);
    setError('');
    setResult(null);
    setExisting(null);
    setBulkResult(null);
    try {
      const res = await fetch('/api/jana/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', typeId, note: note || 'bulk list', items: bulkRows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Bulk create failed');
      setBulkResult(json as BulkResult);
      setBulkText('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Bulk create failed');
    } finally {
      setBusy(false);
    }
  };

  const card = (option: ModeSpec) => {
    const active = option.id === mode;
    return (
      <button
        key={option.id}
        onClick={() => setMode(option.id)}
        style={{
          textAlign: 'left', cursor: 'pointer', background: '#fff',
          border: active ? '2px solid #0f172a' : '1px solid #e2e8f0',
          borderRadius: 14, padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.45rem',
          boxShadow: active ? '0 10px 24px rgba(15,23,42,0.08)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.58rem', fontWeight: 900, padding: '0.16rem 0.45rem', borderRadius: 20, background: '#f1f5f9', color: option.badgeColor, letterSpacing: '0.6px' }}>
            {option.badge}
          </span>
          {active ? <span style={{ fontSize: '0.58rem', fontWeight: 900, color: '#0f172a' }}>SELECTED</span> : null}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>{option.label}</div>
        <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>{option.tagline}</div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.55, borderTop: '1px dashed #e2e8f0', paddingTop: '0.45rem' }}>
          <b>The vision:</b> {option.vision}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#0f172a', fontWeight: 800, marginTop: '0.15rem' }}>What happens</div>
        <ul style={{ margin: 0, paddingInlineStart: '1rem', fontSize: '0.7rem', color: '#475569', lineHeight: 1.55 }}>
          {option.what.map((line) => <li key={line}>{line}</li>)}
        </ul>
        {[
          ['Use it when', option.when],
          ['Vendor sees', option.sees],
          ['Your next move', option.next],
          ['Risk', option.risk],
        ].map(([label, text]) => (
          <div key={label} style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.5 }}>
            <b style={{ color: '#0f172a' }}>{label}:</b> {text}
          </div>
        ))}
      </button>
    );
  };

  return (
    <div className="pi-wrap" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* The admin shell collapses to a drawer under 768px; these grids must do the same
          or a phone scrolls sideways, which is where this page is actually used. */}
      <style>{`
        .pi-wrap { padding: 1.5rem; }
        .pi-modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; }
        .pi-split { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(300px, 1.15fr); gap: 1rem; align-items: start; }
        @media (max-width: 820px) {
          .pi-split { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .pi-wrap { padding: 0.85rem; }
          .pi-modes { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1.4px', color: '#94a3b8' }}>VENDOR ACQUISITION</div>
        <h1 style={{ margin: '0.15rem 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Prospect Intake — name + phone → claimable page</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: 860 }}>
          One vendor, one number, one record. Pick the mode first — each one is a different commercial bet, not a preference.
          {!waConfigured ? ' ⚠ WhatsApp template is not configured: every mode will hand you a manual link instead of sending.' : ''}
        </p>
      </div>

      <div className="pi-modes" style={{ marginBottom: '1.1rem' }}>
        {MODES.map(card)}
      </div>

      <div className="pi-split">
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8', marginBottom: '0.6rem' }}>THE ONLY THREE FIELDS THAT MATTER</div>

          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Business name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Al Negma Hotel / النجمة"
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: '0.8rem', marginBottom: '0.6rem' }}
          />

          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>WhatsApp / phone</label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="01xxxxxxxxx or 201xxxxxxxxx"
            inputMode="tel"
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: '0.8rem', marginBottom: '0.2rem' }}
          />
          <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
            Local 01… is converted to 201… automatically. This becomes <code>vendor_phone</code> — the field every send reads.
          </div>

          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Typology (child type only)</label>
          <select
            value={typeId}
            onChange={(event) => setTypeId(event.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: '0.8rem', marginBottom: '0.6rem', background: '#fff' }}
          >
            <option value="">Select a specific category…</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}{type.name_ar ? ` — ${type.name_ar}` : ''}
              </option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Where you got it (optional)</label>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. field visit 12 Oct / Google Maps"
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: '0.8rem', marginBottom: '0.75rem' }}
          />

          <button
            onClick={() => void submit()}
            disabled={busy || !name.trim() || !phone.trim() || !typeId}
            style={{
              width: '100%', padding: '0.7rem', borderRadius: 10, border: 'none',
              background: busy || !name.trim() || !phone.trim() || !typeId ? '#94a3b8' : '#0f172a',
              color: '#fff', fontWeight: 900, fontSize: '0.82rem',
              cursor: busy ? 'wait' : (!name.trim() || !phone.trim() || !typeId ? 'not-allowed' : 'pointer'),
            }}
          >
            {busy ? 'Working…' : spec.button}
          </button>

          <div style={{ marginTop: '0.7rem', fontSize: '0.66rem', color: '#64748b', lineHeight: 1.55 }}>
            <b>Not on this page:</b> no scraping, no invented numbers, no claiming on the vendor&apos;s behalf.
            A prospect stays <code>is_claimed = 0</code> until he accepts the agreement himself.
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8' }}>HAVE A LIST? PASTE THE NUMBERS</div>
              <button onClick={() => setBulkOpen((open) => !open)} style={{ ...pill('#fff', '#0f172a'), fontSize: '0.62rem' }}>
                {bulkOpen ? 'Hide' : 'Open'}
              </button>
            </div>

            {bulkOpen ? (
              <>
                <div style={{ fontSize: '0.68rem', color: '#64748b', margin: '0.5rem 0', lineHeight: 1.55 }}>
                  One row per line. The name is optional — without one the record is named after the typology you picked plus the
                  last 4 digits, and the vendor can rename it himself when he claims the page.
                </div>
                <textarea
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  rows={6}
                  placeholder={'01001234567\n01009876543, كابتن أحمد\nكابتن محمود 01234567890'}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: '0.78rem', fontFamily: 'inherit', marginBottom: '0.4rem' }}
                />
                <div style={{ fontSize: '0.66rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.55 }}>
                  <b>{bulkRows.length}</b> row(s) read · max 12 per paste · uses the typology selected above.
                  Bulk always runs <b>HUMAN-FIRST</b>: nothing is sent by the API, every row returns a one-tap WhatsApp link.
                </div>
                <button
                  onClick={() => void runBulk()}
                  disabled={busy || !typeId || bulkRows.length === 0}
                  style={{
                    width: '100%', padding: '0.7rem', borderRadius: 10, border: 'none',
                    background: busy || !typeId || bulkRows.length === 0 ? '#94a3b8' : '#D4AF37',
                    color: '#0f172a', fontWeight: 900, fontSize: '0.82rem',
                    cursor: busy ? 'wait' : (!typeId || bulkRows.length === 0 ? 'not-allowed' : 'pointer'),
                  }}
                >
                  {busy ? 'Working…' : `Build ${bulkRows.length || ''} page(s) & links`}
                </button>
                <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '0.45rem', lineHeight: 1.55 }}>
                  Why 12: one number that fires 40 templated messages at strangers gets flagged by WhatsApp and the whole channel
                  goes quiet. Send in batches, never paste the same number twice.
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div>
          {error ? (
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {error}
            </div>
          ) : null}

          {bulkResult ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8' }}>BATCH RESULT</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                    {bulkResult.summary.created} created · {bulkResult.summary.skipped} skipped
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {bulkResult.type.name} · {bulkResult.summary.submitted} row(s) pasted (cap {bulkResult.summary.cap})
                  </div>
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>
                  MANUAL SEND ONLY
                </span>
              </div>

              <div style={{ marginTop: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {bulkResult.results.map((row, index) => (
                  <div key={`${row.phone}-${index}`} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.5rem 0.6rem', background: row.ok ? '#fff' : '#fff7ed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#0f172a' }}>
                        {row.name || row.existing?.name || '—'}
                        <span style={{ color: '#94a3b8', fontWeight: 700 }}> · {row.phone || '—'}</span>
                      </div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: row.ok ? '#166534' : '#b45309' }}>
                        {row.ok ? 'READY' : BULK_REASON[row.reason || ''] || String(row.reason || 'skipped').toUpperCase()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      {row.wa_link ? <a href={row.wa_link} target="_blank" rel="noopener noreferrer" style={pill('#f0fdf4', '#166534')}>WhatsApp</a> : null}
                      {row.review_url ? <a href={row.review_url} target="_blank" rel="noopener noreferrer" style={pill('#fff', '#1e40af')}>Review link</a> : null}
                      {row.public_url ? <a href={row.public_url} target="_blank" rel="noopener noreferrer" style={pill('#fff', '#0f172a')}>Page</a> : null}
                      {row.existing?.claim_url ? <a href={row.existing.claim_url} target="_blank" rel="noopener noreferrer" style={pill('#fff', '#0f172a')}>Existing claim link</a> : null}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '0.7rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.8px', color: '#94a3b8', marginBottom: '0.3rem' }}>HOW TO WORK THIS BATCH</div>
                <ol style={{ margin: 0, paddingInlineStart: '1.1rem', fontSize: '0.74rem', color: '#475569', lineHeight: 1.6 }}>
                  {bulkResult.next.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            </div>
          ) : null}

          {existing ? (
            <div style={{ padding: '0.9rem', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#92400e', marginBottom: '0.3rem' }}>Already on the platform — not creating a duplicate</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a' }}>{existing.name} <span style={{ color: '#94a3b8', fontWeight: 700 }}>/{existing.slug}</span></div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <a href={existing.public_url} target="_blank" rel="noopener noreferrer" style={pill('#fff', '#0f172a')}>Open page</a>
                <a href={existing.claim_url} target="_blank" rel="noopener noreferrer" style={pill('#0f172a', '#fff')}>Send claim link</a>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#92400e', marginTop: '0.45rem' }}>
                {existing.is_claimed ? 'He already claimed it.' : 'Unclaimed: the fastest win here is the claim link, not a new invitation.'}
              </div>
            </div>
          ) : null}

          {result ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8' }}>CREATED</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{result.business.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>/{result.business.slug} · template: {result.business.template_source}</div>
                </div>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: 20,
                  background: result.invitation.sent ? '#dcfce7' : '#fef3c7',
                  color: result.invitation.sent ? '#166534' : '#92400e',
                }}>
                  {result.invitation.sent ? 'WHATSAPP SENT' : result.mode === 'build_first' ? 'NOT CONTACTED' : 'READY TO SEND'}
                </span>
              </div>

              {result.invitation.reason && !result.invitation.sent && result.mode !== 'build_first' ? (
                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.45rem 0.6rem' }}>
                  Provider note: {result.invitation.reason}
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                <a href={result.links.public_url} target="_blank" rel="noopener noreferrer" style={pill('#fff', '#0f172a')}>Public page</a>
                <a href={result.links.builder_url} style={pill('#0f172a', '#fff')}>Build Studio</a>
                {result.invitation.review_url ? (
                  <a href={result.invitation.review_url} target="_blank" rel="noopener noreferrer" style={pill('#fff', '#1e40af')}>Review link (vendor view)</a>
                ) : null}
                {result.invitation.wa_link ? (
                  <a href={result.invitation.wa_link} target="_blank" rel="noopener noreferrer" style={pill('#f0fdf4', '#166534')}>Open WhatsApp</a>
                ) : null}
                {result.invitation.review_url ? (
                  <button onClick={() => void copy(result.invitation.review_url || '', 'review')} style={pill('#fff', '#475569')}>
                    {copied === 'review' ? 'Copied' : 'Copy link'}
                  </button>
                ) : null}
              </div>

              {result.invitation.expires_at ? (
                <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '0.45rem' }}>
                  Token expires {new Date(result.invitation.expires_at).toLocaleString('en-GB')} · 7 days.
                  {result.crm_contact ? ` Also exists in CRM as “${result.crm_contact.full_name}”.` : ''}
                </div>
              ) : null}

              <div style={{ marginTop: '0.7rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.8px', color: '#94a3b8', marginBottom: '0.3rem' }}>WHAT YOU DO NEXT</div>
                <ol style={{ margin: 0, paddingInlineStart: '1.1rem', fontSize: '0.74rem', color: '#475569', lineHeight: 1.6 }}>
                  {result.next.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            </div>
          ) : bulkResult ? null : (
            <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 14, padding: '1.1rem', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.7 }}>
              <b style={{ color: '#0f172a' }}>What you get back:</b> a public page, a builder link, a 7-day vendor review link,
              and either a sent WhatsApp message or copy-ready text. The record is unclaimed until he accepts.
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginTop: '1.1rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8' }}>PROSPECTS SENT — STILL UNCLAIMED</div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>{recent.length}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                {['Vendor', 'Phone', 'Mode', 'Handoff', 'Sent', 'Token', 'Actions'].map((head) => (
                  <th key={head} style={{ padding: '0.55rem 0.7rem', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{head.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.handoff_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.55rem 0.7rem' }}>
                    <a href={row.public_url || '#'} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 900, color: '#0f172a', textDecoration: 'none' }}>{row.name}</a>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>/{row.slug}</div>
                  </td>
                  <td style={{ padding: '0.55rem 0.7rem', color: '#475569' }}>{row.vendor_phone || '—'}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: '#475569' }}>{row.mode || '—'}</td>
                  <td style={{ padding: '0.55rem 0.7rem', fontWeight: 900, color: STATUS_COLOR[row.status] || '#475569' }}>
                    {row.status}{row.revision ? <span style={{ color: '#94a3b8', fontWeight: 600 }}> · v{row.revision}</span> : null}
                  </td>
                  <td style={{ padding: '0.55rem 0.7rem', color: '#475569', whiteSpace: 'nowrap' }}>
                    {row.whatsapp_message_id ? 'yes' : row.whatsapp_error ? 'failed' : 'no'}
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{new Date(row.created_at).toLocaleDateString('en-GB')}</div>
                  </td>
                  <td style={{ padding: '0.55rem 0.7rem', color: '#475569', whiteSpace: 'nowrap' }}>
                    {row.token_expires_at ? new Date(row.token_expires_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.7rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <a href={`/jana/minisite-builder?slug=${encodeURIComponent(row.slug)}`} style={pill('#0f172a', '#fff')}>Build</a>
                      <a href={row.claim_url || '#'} target="_blank" rel="noopener noreferrer" style={pill('#fff', '#0f172a')}>Claim link</a>
                      <a href="/jana/minisite-handoffs" style={pill('#fff', '#475569')}>Board</a>
                    </div>
                  </td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    No unclaimed prospects yet. Create one above — it will appear here until the vendor accepts.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '0.9rem', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, lineHeight: 1.6 }}>
        Each send writes to <code>minisite_vendor_handoffs</code> with a hashed 7-day token — the same evidence the L2 board produces.
        AI is not used here on purpose: a phone number must come from a human source, not a guess.
      </div>
    </div>
  );
}

function pill(background: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.28rem 0.6rem', borderRadius: 8,
    border: `1px solid ${color === '#fff' ? '#0f172a' : '#cbd5e1'}`,
    background, color, fontSize: '0.66rem', fontWeight: 800,
    textDecoration: 'none', cursor: 'pointer',
  };
}
