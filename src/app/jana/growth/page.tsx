'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/**
 * Growth Playbook & Signals.
 *
 * One screen for the gradual plan: it reports what the data says is missing
 * (steps are derived server-side, never hand-ticked), lists the vendors that
 * need a human this week, and lets support send the weekly digest or grant a
 * reach pass without leaving the page.
 */

type StepStatus = 'done' | 'ready' | 'blocked';

type Step = {
  key: string;
  title: string;
  owner: string;
  why: string;
  metric: string;
  status: StepStatus;
  fix: string;
};

type Totals = {
  claimed: number;
  shared: number;
  never_shared: number;
  contactable: number;
  views7: number;
  taps7: number;
  taps30: number;
  digest_sent_7: number;
  digest_overdue: number;
  trial_active: number;
  trial_ending: number;
  pass_active: number;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  url: string;
  tier: string;
  service_level: string;
  phone: string | null;
  views7: number;
  views30: number;
  taps7: number;
  taps30: number;
  topChannel: string | null;
  topSource: string | null;
  trial_status: string;
  trial_days_left: number;
  pledge_status: string;
  pledge_days_left: number | null;
  digest_last_sent_at: string | null;
  digest_due_days: number | null;
  pass_expires_at: string | null;
};

type Alert = {
  key: string;
  severity: 'high' | 'medium' | 'low';
  business_id: string;
  business_name: string;
  message: string;
  action: string;
};

type Payload = {
  generated_at: string;
  totals: Totals;
  steps: Step[];
  alerts: Alert[];
  rows: Row[];
};

const STATUS_STYLE: Record<StepStatus, { bg: string; fg: string; label: string }> = {
  done: { bg: '#dcfce7', fg: '#166534', label: 'DONE' },
  ready: { bg: '#fef3c7', fg: '#92400e', label: 'DO THIS' },
  blocked: { bg: '#fee2e2', fg: '#991b1b', label: 'BLOCKED' },
};

const SEVERITY_COLOR: Record<Alert['severity'], string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#64748b',
};

function prettyTier(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—';
}

function fmtDay(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function Tile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 0.95rem' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.8px', color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: tone || '#0f172a', lineHeight: 1.2 }}>{value}</div>
      {hint ? <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{hint}</div> : null}
    </div>
  );
}

export default function GrowthPlaybookPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState<string>('');
  const [notice, setNotice] = useState('');
  const [digestText, setDigestText] = useState('');
  const [digestFor, setDigestFor] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/jana/growth', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load signals');
      setData(json as Payload);
    } catch (err: any) {
      setError(err?.message || 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const rows = data?.rows || [];
  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      row.name.toLowerCase().includes(needle)
      || row.slug.toLowerCase().includes(needle)
      || row.tier.toLowerCase().includes(needle)
    );
  }, [rows, filter]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/jana/growth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
  }, []);

  const previewDigest = useCallback(async (row: Row) => {
    setBusy(`preview:${row.id}`);
    setDigestFor(row.id);
    try {
      const { ok, json } = await post({ action: 'send_digest', businessId: row.id, dryRun: true });
      if (!ok) throw new Error(json?.error || 'Preview failed');
      setDigestText(json?.text || '');
      setNotice(`Preview ready for ${row.name}.`);
    } catch (err: any) {
      setNotice(err?.message || 'Preview failed');
    } finally {
      setBusy('');
    }
  }, [post]);

  const sendDigest = useCallback(async (row: Row) => {
    setBusy(`send:${row.id}`);
    try {
      const { ok, json } = await post({ action: 'send_digest', businessId: row.id });
      if (json?.text) setDigestText(json.text);
      setDigestFor(row.id);
      if (json?.sent) {
        setNotice(`Digest sent to ${row.name}.`);
        await load();
      } else if (json?.reason === 'digest_template_not_configured') {
        setNotice('WhatsApp digest template not configured — copy the text below into WhatsApp Web.');
      } else if (!ok) {
        setNotice(json?.error || 'Send failed');
      } else {
        setNotice(`No send performed for ${row.name}.`);
      }
    } catch (err: any) {
      setNotice(err?.message || 'Send failed');
    } finally {
      setBusy('');
    }
  }, [post, load]);

  const setPass = useCallback(async (row: Row, days: number) => {
    setBusy(`pass:${row.id}`);
    try {
      const { ok, json } = await post({ action: 'set_pass', businessId: row.id, days });
      setNotice(ok
        ? (days > 0 ? `Reach pass set for ${row.name} (${days} days).` : `Reach pass cleared for ${row.name}.`)
        : (json?.error || 'Pass update failed'));
      if (ok) await load();
    } catch (err: any) {
      setNotice(err?.message || 'Pass update failed');
    } finally {
      setBusy('');
    }
  }, [post, load]);

  const copyText = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Copied to clipboard.');
    } catch {
      setNotice('Copy failed — select the text manually.');
    }
  }, []);

  const totals = data?.totals;
  const selected = rows.find((row) => row.id === digestFor) || null;

  return (
    <div className="gp-wrap" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Collapses to one column on a phone, same breakpoint idea as the admin drawer. */}
      <style>{`
        .gp-wrap { padding: 1.5rem; }
        .gp-split { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(300px, 1.1fr); gap: 1rem; align-items: start; }
        @media (max-width: 820px) {
          .gp-split { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .gp-wrap { padding: 0.85rem; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1.4px', color: '#94a3b8' }}>VENDOR ACQUISITION</div>
          <h1 style={{ margin: '0.15rem 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Growth Playbook &amp; Signals</h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: 720 }}>
            Steps are computed from live data, not ticked by hand. Fix the top blocked step first, then work the
            &ldquo;needs a human&rdquo; list left to right.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter vendor / slug / tier"
            style={{ padding: '0.55rem 0.75rem', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: '0.8rem', minWidth: 220, background: '#fff' }}
          />
          <button
            onClick={() => void load()}
            disabled={loading}
            style={{ padding: '0.55rem 0.95rem', borderRadius: 9, border: '1px solid #0f172a', background: loading ? '#94a3b8' : '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: '0.78rem', fontWeight: 700 }}>
          {notice}
          <button onClick={() => setNotice('')} style={{ float: 'right', border: 'none', background: 'transparent', color: '#1e3a8a', cursor: 'pointer', fontWeight: 900 }}>×</button>
        </div>
      ) : null}

      {error ? (
        <div style={{ padding: '0.9rem 1rem', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>
          {error}
        </div>
      ) : null}

      {/* 5 steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {(data?.steps || []).map((step, index) => {
          const style = STATUS_STYLE[step.status] || STATUS_STYLE.blocked;
          return (
            <div key={step.key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8' }}>STEP {index + 1}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 900, padding: '0.15rem 0.45rem', borderRadius: 20, background: style.bg, color: style.fg, letterSpacing: '0.5px' }}>{style.label}</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>{step.title.replace(/^Step \d+ · /, '')}</div>
              <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>{step.why}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', marginTop: 'auto' }}>{step.metric}</div>
              <div style={{ fontSize: '0.66rem', color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: '0.4rem' }}>
                <b>{step.owner}:</b> {step.fix}
              </div>
            </div>
          );
        })}
        {!data && loading ? (
          <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 14, padding: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>Loading steps…</div>
        ) : null}
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <Tile label="CLAIMED VENDORS" value={totals?.claimed ?? '—'} hint={`${totals?.shared ?? 0} shared their link`} />
        <Tile label="VISITS · 7D" value={totals?.views7 ?? '—'} hint="proves the link was shared" />
        <Tile label="TAPS · 7D" value={totals?.taps7 ?? '—'} tone="#0f766e" hint={`${totals?.taps30 ?? 0} in 30d`} />
        <Tile label="TAPS · 30D" value={totals?.taps30 ?? '—'} hint="contact intent" />
        <Tile label="DIGESTS · 7D" value={totals?.digest_sent_7 ?? '—'} hint={`${totals?.digest_overdue ?? 0} overdue`} tone={totals && totals.digest_overdue > 0 ? '#b45309' : undefined} />
        <Tile label="TRIALS ACTIVE" value={totals?.trial_active ?? '—'} hint={`${totals?.trial_ending ?? 0} end in ≤14d`} />
        <Tile label="REACH PASSES" value={totals?.pass_active ?? '—'} hint="paid featured placement" />
        <Tile label="NEVER SHARED" value={totals?.never_shared ?? '—'} tone={totals && totals.never_shared > 0 ? '#b91c1c' : undefined} hint="zero visits in 7d" />
      </div>

      <div className="gp-split" style={{ marginBottom: '1.25rem' }}>
        {/* Alerts */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8' }}>NEEDS A HUMAN THIS WEEK</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>{data?.alerts.length ?? 0}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: 320, overflowY: 'auto' }}>
            {(data?.alerts || []).map((alert) => {
              const row = rows.find((item) => item.id === alert.business_id);
              return (
                <div key={alert.key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', borderLeft: `3px solid ${SEVERITY_COLOR[alert.severity]}`, paddingLeft: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0f172a' }}>{alert.business_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.4 }}>{alert.message}</div>
                  </div>
                  {row && alert.action === 'Send digest' ? (
                    <button
                      onClick={() => void sendDigest(row)}
                      disabled={busy !== ''}
                      style={{ padding: '0.25rem 0.55rem', borderRadius: 7, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Send
                    </button>
                  ) : row && alert.action === 'Send share kit' ? (
                    <button
                      onClick={() => void copyText(row.url)}
                      style={{ padding: '0.25rem 0.55rem', borderRadius: 7, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Copy link
                    </button>
                  ) : null}
                </div>
              );
            })}
            {data && data.alerts.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700 }}>Nothing urgent. Work the share rate instead.</div>
            ) : null}
          </div>
        </div>

        {/* Digest panel */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8', marginBottom: '0.5rem' }}>WEEKLY DIGEST</div>
          <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.5, marginBottom: '0.6rem' }}>
            {selected
              ? <>Draft for <b>{selected.name}</b> — {selected.views7} visits, {selected.taps7} taps in the last 7 days.</>
              : 'Pick a vendor below to preview the message they will receive.'}
          </div>
          <textarea
            value={digestText}
            onChange={(event) => setDigestText(event.target.value)}
            placeholder="Preview appears here…"
            rows={7}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.78rem', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', background: '#f8fafc' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => void copyText(digestText)}
              disabled={!digestText}
              style={{ padding: '0.45rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: '0.74rem', cursor: digestText ? 'pointer' : 'not-allowed' }}
            >
              Copy text
            </button>
            <button
              onClick={() => selected && void sendDigest(selected)}
              disabled={!selected || busy !== ''}
              style={{ padding: '0.45rem 0.8rem', borderRadius: 8, border: '1px solid #0f766e', background: '#0f766e', color: '#fff', fontWeight: 800, fontSize: '0.74rem', cursor: selected ? 'pointer' : 'not-allowed' }}
            >
              {busy.startsWith('send:') ? 'Sending…' : 'Send on WhatsApp'}
            </button>
            {selected ? (
              <a
                href={`https://wa.me/${String(selected.phone || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '0.45rem 0.8rem', borderRadius: 8, border: '1px solid #25D366', background: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: '0.74rem', textDecoration: 'none' }}
              >
                Open WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Vendor signals */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', color: '#94a3b8' }}>VENDOR SIGNALS</div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>
            {filtered.length} of {rows.length} claimed
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                {['Vendor', 'Tier', 'Visits 7d', 'Taps 7d / 30d', 'Top channel', 'Source', 'Trial', 'Pledge', 'Digest', 'Actions'].map((head) => (
                  <th key={head} style={{ padding: '0.55rem 0.7rem', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{head.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const digestLabel = row.digest_due_days === null ? 'Never' : `${row.digest_due_days}d ago`;
                const passActive = row.pass_expires_at && new Date(row.pass_expires_at).getTime() > Date.now();
                return (
                  <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.55rem 0.7rem' }}>
                      <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 900, color: '#0f172a', textDecoration: 'none' }}>{row.name}</a>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>/{row.slug}</div>
                    </td>
                    <td style={{ padding: '0.55rem 0.7rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800 }}>{prettyTier(row.tier)}</div>
                      <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>{row.service_level}</div>
                    </td>
                    <td style={{ padding: '0.55rem 0.7rem', fontWeight: 800, color: row.views7 === 0 ? '#b91c1c' : '#0f172a' }}>{row.views7}</td>
                    <td style={{ padding: '0.55rem 0.7rem', fontWeight: 800, color: row.taps30 > 0 ? '#0f766e' : '#94a3b8' }}>{row.taps7} / {row.taps30}</td>
                    <td style={{ padding: '0.55rem 0.7rem', color: '#475569' }}>{row.topChannel || '—'}</td>
                    <td style={{ padding: '0.55rem 0.7rem', color: '#475569' }}>{row.topSource || '—'}</td>
                    <td style={{ padding: '0.55rem 0.7rem', color: row.trial_status === 'active' && row.trial_days_left <= 14 ? '#b45309' : '#475569', whiteSpace: 'nowrap' }}>
                      {row.trial_status === 'active' ? `${row.trial_days_left}d left` : row.trial_status === 'expired' ? 'Expired' : 'None'}
                    </td>
                    <td style={{ padding: '0.55rem 0.7rem', color: row.pledge_status === 'expired' ? '#b91c1c' : '#475569' }}>{row.pledge_status}</td>
                    <td style={{ padding: '0.55rem 0.7rem', color: row.digest_due_days !== null && row.digest_due_days >= 7 ? '#b45309' : '#475569', whiteSpace: 'nowrap' }}>{digestLabel}</td>
                    <td style={{ padding: '0.55rem 0.7rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          onClick={() => void previewDigest(row)}
                          disabled={busy !== ''}
                          style={{ padding: '0.22rem 0.45rem', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {busy === `preview:${row.id}` ? '…' : 'Preview'}
                        </button>
                        <button
                          onClick={() => void sendDigest(row)}
                          disabled={busy !== ''}
                          style={{ padding: '0.22rem 0.45rem', borderRadius: 6, border: '1px solid #0f766e', background: '#0f766e', color: '#fff', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {busy === `send:${row.id}` ? '…' : 'Send'}
                        </button>
                        <button
                          onClick={() => void setPass(row, passActive ? 0 : 120)}
                          disabled={busy !== ''}
                          title={passActive ? `Pass ends ${fmtDay(row.pass_expires_at)}` : 'Grant a 120-day reach pass'}
                          style={{ padding: '0.22rem 0.45rem', borderRadius: 6, border: `1px solid ${passActive ? '#f59e0b' : '#cbd5e1'}`, background: passActive ? '#fef3c7' : '#fff', color: '#0f172a', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {busy === `pass:${row.id}` ? '…' : passActive ? 'Clear pass' : '+120d'}
                        </button>
                        <Link
                          href={`/jana/minisite-builder?slug=${encodeURIComponent(row.slug)}`}
                          style={{ padding: '0.22rem 0.45rem', borderRadius: 6, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontSize: '0.62rem', fontWeight: 800, textDecoration: 'none' }}
                        >
                          Build
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    No claimed vendors match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '0.9rem', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
        {data?.generated_at ? `Signals generated ${new Date(data.generated_at).toLocaleString('en-GB')}. ` : ''}
        Taps are recorded on `page_views` (page_type = minisite_tap); no extra table, no cron.
      </div>
    </div>
  );
}
