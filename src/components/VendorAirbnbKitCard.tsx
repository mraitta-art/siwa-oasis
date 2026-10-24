'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface AirbnbSection {
  heading: string;
  body: string;
}

interface AirbnbKitState {
  title: string;
  summary: string;
  sections: AirbnbSection[];
  amenities: string[];
  photoGuidance: string[];
  checklist: Array<{ label: string; done: boolean }>;
  warnings: string[];
}

interface DraftCheck {
  blocked: boolean;
  removed: string[];
  cleaned: string;
}

/**
 * Airbnb content pack.
 *
 * Airbnb gives no content API and suspends listings that carry outside links or
 * contact details, so the only useful thing we can hand a host is compliant copy
 * plus a checker for whatever they already wrote. Nothing here publishes.
 */
export default function VendorAirbnbKitCard() {
  const [kit, setKit] = useState<AirbnbKitState | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [check, setCheck] = useState<DraftCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/vendor/airbnb-kit');
      if (!response.ok) return;
      const data = await response.json();
      setKit(data.kit || null);
    } catch {
      // A missing kit is not an error the vendor has to act on.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage({ tone: 'ok', text: `${label} copied.` });
    } catch {
      setMessage({ tone: 'warn', text: 'Copy failed — select the text manually.' });
    }
  }

  async function runCheck() {
    if (!draft.trim()) return;
    setChecking(true);
    setMessage(null);
    try {
      const response = await fetch('/api/vendor/airbnb-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not check this text.');
      setCheck({ blocked: Boolean(data.blocked), removed: data.removed || [], cleaned: data.cleaned || '' });
    } catch (error: any) {
      setMessage({ tone: 'warn', text: error?.message || 'Could not check this text.' });
    } finally {
      setChecking(false);
    }
  }

  const ready = kit?.checklist.filter(item => item.done).length || 0;
  const total = kit?.checklist.length || 0;

  return (
    <section
      style={{
        marginBottom: '1.5rem',
        background: '#fff',
        border: '1px solid #eef0f5',
        borderRadius: '22px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '1.2px', fontWeight: 900, color: '#FF5A5F', textTransform: 'uppercase' }}>
            Airbnb
          </div>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            Listing content pack
          </h2>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginTop: 4, lineHeight: 1.6, maxWidth: 420 }}>
            Ready-to-paste title and description, written to Airbnb&apos;s rules. We never post on your behalf and never touch a live listing.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!loading && total > 0 && (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: '0.64rem',
                fontWeight: 900,
                whiteSpace: 'nowrap',
                background: ready === total ? '#dcfce7' : '#f8fafc',
                color: ready === total ? '#166534' : '#64748b',
                border: `1px solid ${ready === total ? '#bbf7d0' : '#e2e8f0'}`,
              }}
            >
              {ready}/{total} ready
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen(current => !current)}
            style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '0.5rem 0.95rem', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}
          >
            {open ? 'Hide pack' : 'Open pack'}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
          {loading ? (
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>Building your pack…</div>
          ) : !kit ? (
            <div style={{ color: '#b45309', fontSize: '0.78rem', fontWeight: 700 }}>
              Could not build the pack right now. Reload the page and try again.
            </div>
          ) : (
            <>
              <Block label="Title" hint={`${kit.title.length}/50 characters`} onCopy={() => copyText(kit.title, 'Title')} value={kit.title} />
              <Block label="Summary line" hint={`${kit.summary.length} characters`} onCopy={() => copyText(kit.summary, 'Summary')} value={kit.summary} />

              {kit.sections.map(section => (
                <Block
                  key={section.heading}
                  label={section.heading}
                  hint={`${section.body.length} characters`}
                  onCopy={() => copyText(`${section.heading}\n${section.body}`, section.heading)}
                  value={section.body}
                />
              ))}

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a' }}>Amenities found in your profile</span>
                  <button
                    type="button"
                    onClick={() => copyText(kit.amenities.join(', '), 'Amenities')}
                    disabled={kit.amenities.length === 0}
                    style={{ background: '#fff', color: '#0f766e', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.3rem 0.65rem', fontSize: '0.64rem', fontWeight: 900, cursor: kit.amenities.length ? 'pointer' : 'not-allowed' }}
                  >
                    Copy list
                  </button>
                </div>
                {kit.amenities.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                    {kit.amenities.map(amenity => (
                      <span
                        key={amenity}
                        style={{ fontSize: '0.64rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0f766e' }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
                    No amenity flags in your profile yet — connect these to Airbnb manually.
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 1rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Photo guidance</span>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: 4 }}>
                  {kit.photoGuidance.map(line => (
                    <li key={line} style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.6 }}>{line}</li>
                  ))}
                </ul>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 1rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Before you publish</span>
                <div style={{ display: 'grid', gap: 5 }}>
                  {kit.checklist.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: item.done ? '#166534' : '#64748b', fontWeight: 700 }}>
                      <i className={item.done ? 'fas fa-circle-check' : 'far fa-circle'} style={{ fontSize: '0.62rem' }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border: '1px solid #fde68a', background: '#fffbeb', borderRadius: 14, padding: '0.9rem 1rem', display: 'grid', gap: 5 }}>
                {kit.warnings.map(warning => (
                  <div key={warning} style={{ fontSize: '0.68rem', color: '#92400e', lineHeight: 1.65, fontWeight: 600 }}>{warning}</div>
                ))}
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 1rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: '#0f172a' }}>Check text you already wrote</span>
                <span style={{ display: 'block', fontSize: '0.66rem', color: '#64748b', marginTop: 2, lineHeight: 1.6 }}>
                  Paste your Airbnb description to see the exact words that could get the listing flagged.
                </span>
                <textarea
                  value={draft}
                  onChange={event => { setDraft(event.target.value); setCheck(null); }}
                  rows={4}
                  placeholder="Paste the description you plan to publish…"
                  style={{ width: '100%', marginTop: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.6rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', resize: 'vertical' }}
                />
                <button
                  type="button"
                  onClick={runCheck}
                  disabled={checking || !draft.trim()}
                  style={{ marginTop: '0.5rem', background: checking ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: 9, padding: '0.45rem 0.9rem', fontSize: '0.7rem', fontWeight: 900, cursor: checking ? 'wait' : 'pointer' }}
                >
                  {checking ? 'Checking…' : 'Check this text'}
                </button>

                {check && (
                  <div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: check.blocked ? '#b91c1c' : '#166534' }}>
                      {check.blocked
                        ? `Found ${check.removed.join(', ')}. Airbnb can suspend a listing for this.`
                        : 'No links, phone numbers, emails or handles found. Safe to publish.'}
                    </div>
                    {check.blocked && (
                      <>
                        <code style={{ display: 'block', padding: '0.45rem 0.55rem', background: '#f8fafc', border: '1px solid #eef0f5', borderRadius: 8, fontSize: '0.72rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {check.cleaned}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText(check.cleaned, 'Cleaned text')}
                          style={{ justifySelf: 'start', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.35rem 0.7rem', fontSize: '0.66rem', fontWeight: 900, cursor: 'pointer' }}
                        >
                          Copy cleaned text
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {message && (
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: message.tone === 'ok' ? '#166534' : '#b45309' }}>{message.text}</span>
          )}
        </div>
      )}
    </section>
  );
}

function Block({
  label,
  hint,
  value,
  onCopy,
}: {
  label: string;
  hint: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.75rem 0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a' }}>{label}</span>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8' }}>{hint}</span>
      </div>
      {value ? (
        <code style={{ display: 'block', margin: '0.4rem 0', padding: '0.45rem 0.55rem', background: '#f8fafc', border: '1px solid #eef0f5', borderRadius: 8, fontSize: '0.72rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {value}
        </code>
      ) : (
        <div style={{ margin: '0.4rem 0', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
          Nothing yet — add this to your SiWiFy profile and it will appear here.
        </div>
      )}
      <button
        type="button"
        onClick={onCopy}
        disabled={!value}
        style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.35rem 0.7rem', fontSize: '0.66rem', fontWeight: 900, cursor: value ? 'pointer' : 'not-allowed', opacity: value ? 1 : 0.5 }}
      >
        Copy
      </button>
    </div>
  );
}
