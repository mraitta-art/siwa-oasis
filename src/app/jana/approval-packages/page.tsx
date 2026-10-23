'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ServiceLevel = 'template' | 'curated' | 'managed';

interface PackageRow {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  is_claimed: number | null;
  subscription_tier: string | null;
  service_level: ServiceLevel;
  account_manager_id: string | null;
  account_manager_name: string | null;
  type_name: string | null;
  parent_type_name: string | null;
  revision: number;
  status: string;
  vendor_phone: string | null;
  token_expires_at: string | null;
  whatsapp_message_id: string | null;
  whatsapp_error: string | null;
  agreement_version: string | null;
  agreement_language: string | null;
  accepted_name: string | null;
  accepted_at: string | null;
  changes_requested_note: string | null;
  prepared_by_name: string | null;
  component_count: number;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  level_reason: string | null;
  is_expired_link: boolean;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  awaiting_send: number;
  in_review: number;
  changes_requested: number;
  approved: number;
  expired: number;
  failed: number;
  by_level: Record<string, number>;
}

interface Staff {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
}

interface DetailResponse {
  package: PackageRow & { layout: any };
  events: Array<{ id: number | string; event_type: string; payload: any; actor_id: string | null; created_at: string }>;
  transitions: Array<{
    id: string;
    from_level: string | null;
    to_level: string;
    trigger_type: string;
    reason: string | null;
    created_at: string;
  }>;
}

const IN_REVIEW_STATUSES = ['sent', 'delivered', 'read', 'followup_due', 'replied'];
const APPROVED_STATUSES = ['accepted', 'published'];
const SERVICE_LEVELS: ServiceLevel[] = ['template', 'curated', 'managed'];

const TABS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All packages' },
  { id: 'draft', label: 'Awaiting send' },
  { id: 'in_review', label: 'In review' },
  { id: 'changes_requested', label: 'Changes requested' },
  { id: 'approved', label: 'Approved' },
  { id: 'expired', label: 'Expired' },
  { id: 'failed', label: 'Failed' },
];

function matchesTab(row: PackageRow, tab: string) {
  if (tab === 'all') return true;
  if (tab === 'in_review') return IN_REVIEW_STATUSES.includes(row.status);
  if (tab === 'approved') return APPROVED_STATUSES.includes(row.status);
  return row.status === tab;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function levelBadge(level: ServiceLevel): React.CSSProperties {
  const palette: Record<ServiceLevel, React.CSSProperties> = {
    template: { background: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' },
    curated: { background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' },
    managed: { background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' },
  };
  return { ...badgeStyle, ...palette[level] };
}

export default function ApprovalPackagesPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tab, setTab] = useState('all');
  const [level, setLevel] = useState('');
  const [term, setTerm] = useState('');
  const [appliedTerm, setAppliedTerm] = useState('');
  const [selected, setSelected] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ staff: '1' });
      if (level) params.set('level', level);
      if (appliedTerm) params.set('q', appliedTerm);
      const response = await fetch(`/api/jana/approval-packages?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load approval packages.');
      setRows(data.packages || []);
      setStats(data.stats || null);
      setStaff(data.staff || []);
    } catch (cause: any) {
      setError(cause.message || 'Unable to load approval packages.');
    } finally {
      setLoading(false);
    }
  }, [level, appliedTerm]);

  useEffect(() => { void load(); }, [load]);

  async function inspect(packageId: string) {
    setBusy(`open:${packageId}`);
    setError('');
    try {
      const response = await fetch(`/api/jana/approval-packages?packageId=${encodeURIComponent(packageId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load the package history.');
      setSelected(data);
    } catch (cause: any) {
      setError(cause.message || 'Unable to load the package history.');
    } finally {
      setBusy('');
    }
  }

  async function post(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/jana/approval-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The action could not be completed.');
      setNotice(data.message || 'Saved.');
      await load();
      const openId = selected?.package?.id;
      if (openId) await inspect(openId);
      return true;
    } catch (cause: any) {
      setError(cause.message || 'The action could not be completed.');
      return false;
    } finally {
      setBusy('');
    }
  }

  const filtered = useMemo(() => rows.filter(row => matchesTab(row, tab)), [rows, tab]);
  const counts = useMemo(() => ({
    all: rows.length,
    draft: rows.filter(row => row.status === 'draft').length,
    in_review: rows.filter(row => IN_REVIEW_STATUSES.includes(row.status)).length,
    changes_requested: rows.filter(row => row.status === 'changes_requested').length,
    approved: rows.filter(row => APPROVED_STATUSES.includes(row.status)).length,
    expired: rows.filter(row => row.status === 'expired').length,
    failed: rows.filter(row => row.status === 'failed').length,
  }), [rows]);

  return (
    <main style={mainStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>3-LEVEL VENDOR SYSTEM · LEVEL 2</p>
          <h1 style={{ margin: '6px 0', fontSize: 28 }}>Approval packages</h1>
          <p style={{ margin: 0, color: '#64748b', maxWidth: 760 }}>
            Curated minisites the Siwa team prepares for a single vendor. Each package is a revision with its own
            review link, WhatsApp delivery trail and legally hashed acceptance. Batch template outreach (Level 1) is
            excluded here and lives in <Link href="/jana/outreach" style={inlineLink}>Template Outreach</Link>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/jana/outreach" style={buttonLink}>Level 1 outreach</Link>
          <Link href="/jana/minisite-builder" style={buttonLink}>Minisite builder</Link>
          <button type="button" onClick={() => void load()} style={buttonStyle} disabled={loading}>Refresh</button>
        </div>
      </header>

      {error && <p role="alert" style={errorStyle}>{error}</p>}
      {notice && <p role="status" style={noticeStyle}>{notice}</p>}

      <section style={statsGrid}>
        {[
          { id: 'draft', label: 'Awaiting send', value: counts.draft },
          { id: 'in_review', label: 'In review', value: counts.in_review },
          { id: 'changes_requested', label: 'Changes requested', value: counts.changes_requested },
          { id: 'approved', label: 'Approved', value: counts.approved },
          { id: 'expired', label: 'Expired', value: counts.expired },
          { id: 'failed', label: 'Failed', value: counts.failed },
        ].map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => setTab(card.id)}
            style={{ ...statCard, ...(tab === card.id ? statCardActive : {}) }}
          >
            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>{card.label}</span>
            <strong style={{ fontSize: 24, color: '#0f172a' }}>{card.value}</strong>
          </button>
        ))}
        <div style={statCard}>
          <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>Vendors by level</span>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {SERVICE_LEVELS.map(candidate => (
              <span key={candidate} style={levelBadge(candidate)}>
                {candidate} {stats?.by_level?.[candidate] ?? 0}
              </span>
            ))}
          </span>
        </div>
      </section>

      <div style={toolbarStyle}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map(candidate => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setTab(candidate.id)}
              style={{ ...filterButton, ...(tab === candidate.id ? selectedFilter : {}) }}
            >
              {candidate.label} <small style={{ opacity: 0.7 }}>{(counts as any)[candidate.id] ?? 0}</small>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={level} onChange={event => setLevel(event.target.value)} style={inputStyle} aria-label="Filter by service level">
            <option value="">All service levels</option>
            {SERVICE_LEVELS.map(candidate => (
              <option key={candidate} value={candidate}>{candidate}</option>
            ))}
          </select>
          <form
            onSubmit={event => { event.preventDefault(); setAppliedTerm(term.trim()); }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              value={term}
              onChange={event => setTerm(event.target.value)}
              placeholder="Business name or slug"
              style={{ ...inputStyle, minWidth: 220 }}
              aria-label="Search packages by business"
            />
            <button type="submit" style={buttonStyle}>Search</button>
            {(appliedTerm || term) && (
              <button type="button" style={buttonStyle} onClick={() => { setTerm(''); setAppliedTerm(''); }}>Clear</button>
            )}
          </form>
        </div>
      </div>

      <div style={contentGrid}>
        <section style={panelStyle}>
          {loading ? <p>Loading packages…</p> : filtered.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              No curated packages in this view. Build one from the minisite builder, then send it from
              {' '}<Link href="/jana/minisite-handoffs" style={inlineLink}>Review, WhatsApp &amp; Publish</Link>.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Business</th>
                    <th style={{ textAlign: 'left' }}>Level</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'left' }}>Package</th>
                    <th style={{ textAlign: 'left' }}>Owner</th>
                    <th style={{ textAlign: 'left' }}>Updated</th>
                    <th style={{ textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} style={selected?.package?.id === row.id ? { background: '#f8fafc' } : undefined}>
                      <td>
                        <strong>{row.business_name}</strong>
                        <small style={cellHintStyle}>
                          /{row.business_slug} · {row.parent_type_name ? `${row.parent_type_name} › ` : ''}{row.type_name || 'untyped'}
                        </small>
                      </td>
                      <td><span style={levelBadge(row.service_level)}>{row.service_level}</span></td>
                      <td>
                        <span style={statusStyle}>{row.status.replaceAll('_', ' ')}</span>
                        {row.is_expired_link && <small style={{ ...cellHintStyle, color: '#b45309' }}>review link expired</small>}
                      </td>
                      <td>
                        r{row.revision} · {row.component_count} components
                        <small style={cellHintStyle}>
                          {row.accepted_name ? `accepted by ${row.accepted_name}` : `prepared by ${row.prepared_by_name || 'unknown'}`}
                        </small>
                      </td>
                      <td>{row.account_manager_name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                      <td>{formatDate(row.updated_at)}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <button type="button" style={smallButton} disabled={busy === `open:${row.id}`} onClick={() => void inspect(row.id)}>
                            {busy === `open:${row.id}` ? 'Opening…' : 'Open'}
                          </button>
                          <Link href={`/jana/minisite-builder?slug=${encodeURIComponent(row.business_slug)}`} style={smallLink}>Builder</Link>
                          <Link
                            href={`/jana/minisite-builder/preview?handoffId=${encodeURIComponent(row.id)}`}
                            target="_blank"
                            style={smallLink}
                          >
                            Preview
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Package detail</h2>
          {!selected ? (
            <p style={{ color: '#64748b' }}>Open a package to see its revision, delivery trail and level controls.</p>
          ) : (
            <PackageDetail
              detail={selected}
              staff={staff}
              busy={busy}
              onSetLevel={(nextLevel, reason) => void post(
                { action: 'set_level', businessId: selected.package.business_id, level: nextLevel, reason },
                'level'
              )}
              onAssignManager={managerId => void post(
                { action: 'assign_account_manager', businessId: selected.package.business_id, accountManagerId: managerId },
                'manager'
              )}
              onLogResponse={(status, note) => void post(
                { action: 'log_response', packageId: selected.package.id, status, note },
                'response'
              )}
            />
          )}
        </aside>
      </div>

      <p style={{ color: '#64748b', fontSize: 12, marginTop: 16 }}>
        Only curated packages are listed: a handoff is Level 1 when batch-send stamped
        {' '}<code>layout.outreach.template_id</code>, so automated template outreach never appears on this board.
        Review links are stored hashed, which is why an existing link cannot be re-displayed — send a new revision
        to issue a fresh one.
      </p>
    </main>
  );
}

function PackageDetail({
  detail,
  staff,
  busy,
  onSetLevel,
  onAssignManager,
  onLogResponse,
}: {
  detail: DetailResponse;
  staff: Staff[];
  busy: string;
  onSetLevel: (level: ServiceLevel, reason: string) => void;
  onAssignManager: (managerId: string) => void;
  onLogResponse: (status: string, note: string) => void;
}) {
  const pkg = detail.package;
  const [levelDraft, setLevelDraft] = useState<ServiceLevel>(pkg.service_level || 'template');
  const [reason, setReason] = useState('');
  const [managerDraft, setManagerDraft] = useState(pkg.account_manager_id || '');
  const [responseStatus, setResponseStatus] = useState('replied');
  const [note, setNote] = useState('');

  useEffect(() => {
    setLevelDraft(pkg.service_level || 'template');
    setManagerDraft(pkg.account_manager_id || '');
    setReason('');
    setNote('');
    setResponseStatus('replied');
  }, [pkg.id, pkg.service_level, pkg.account_manager_id]);

  const componentTypes: string[] = Array.isArray(pkg.layout?.components)
    ? Array.from(new Set(pkg.layout.components.map((component: any) => String(component?.type || 'unknown'))))
    : [];

  return (
    <div>
      <strong style={{ fontSize: 16 }}>{pkg.business_name}</strong>
      <small style={{ display: 'block', color: '#64748b', marginBottom: 10 }}>
        revision {pkg.revision} · {pkg.status.replaceAll('_', ' ')} · {pkg.component_count} components
      </small>

      <dl style={metaListStyle}>
        <div><dt style={metaTermStyle}>Service level</dt><dd style={metaValueStyle}><span style={levelBadge(pkg.service_level)}>{pkg.service_level}</span></dd></div>
        <div><dt style={metaTermStyle}>Prepared by</dt><dd style={metaValueStyle}>{pkg.prepared_by_name || '—'}</dd></div>
        <div><dt style={metaTermStyle}>Account manager</dt><dd style={metaValueStyle}>{pkg.account_manager_name || 'Unassigned'}</dd></div>
        <div><dt style={metaTermStyle}>Category</dt><dd style={metaValueStyle}>{pkg.parent_type_name ? `${pkg.parent_type_name} › ` : ''}{pkg.type_name || '—'}</dd></div>
        <div><dt style={metaTermStyle}>Vendor phone</dt><dd style={metaValueStyle}>{pkg.vendor_phone || '—'}</dd></div>
        <div><dt style={metaTermStyle}>Sent</dt><dd style={metaValueStyle}>{formatDate(pkg.sent_at)}</dd></div>
        <div><dt style={metaTermStyle}>Viewed</dt><dd style={metaValueStyle}>{formatDate(pkg.viewed_at)}</dd></div>
        <div><dt style={metaTermStyle}>Responded</dt><dd style={metaValueStyle}>{formatDate(pkg.responded_at)}</dd></div>
        <div><dt style={metaTermStyle}>Agreement</dt><dd style={metaValueStyle}>{pkg.agreement_version ? `${pkg.agreement_version} · ${pkg.agreement_language || 'en'}` : '—'}</dd></div>
        <div><dt style={metaTermStyle}>Accepted</dt><dd style={metaValueStyle}>{pkg.accepted_name ? `${pkg.accepted_name} · ${formatDate(pkg.accepted_at)}` : '—'}</dd></div>
        <div><dt style={metaTermStyle}>Review link</dt><dd style={metaValueStyle}>{pkg.is_expired_link ? 'Expired' : pkg.token_expires_at ? `Valid until ${formatDate(pkg.token_expires_at)}` : 'No active link'}</dd></div>
      </dl>

      {pkg.changes_requested_note && <p style={warningStyle}>Requested changes: {pkg.changes_requested_note}</p>}
      {pkg.whatsapp_error && <p style={warningStyle}>WhatsApp error: {pkg.whatsapp_error}</p>}
      {componentTypes.length > 0 && (
        <p style={{ fontSize: 12, color: '#475569' }}>
          Components: {componentTypes.join(', ')}
        </p>
      )}

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Service level</legend>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SERVICE_LEVELS.map(candidate => (
            <button
              key={candidate}
              type="button"
              onClick={() => setLevelDraft(candidate)}
              style={{ ...filterButton, ...(levelDraft === candidate ? selectedFilter : {}) }}
            >
              {candidate}
            </button>
          ))}
        </div>
        <input
          value={reason}
          onChange={event => setReason(event.target.value)}
          placeholder="Reason (written to the level audit trail)"
          style={{ ...inputStyle, width: '100%', marginTop: 8 }}
        />
        <button
          type="button"
          style={{ ...buttonStyle, marginTop: 8 }}
          disabled={busy === 'level' || levelDraft === pkg.service_level}
          onClick={() => onSetLevel(levelDraft, reason)}
        >
          {busy === 'level' ? 'Saving…' : `Move to ${levelDraft}`}
        </button>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Account manager</legend>
        <select value={managerDraft} onChange={event => setManagerDraft(event.target.value)} style={{ ...inputStyle, width: '100%' }}>
          <option value="">Unassigned</option>
          {staff.map(person => (
            <option key={person.id} value={person.id}>
              {person.display_name || person.email} · {person.role}
            </option>
          ))}
        </select>
        <button
          type="button"
          style={{ ...buttonStyle, marginTop: 8 }}
          disabled={busy === 'manager' || managerDraft === (pkg.account_manager_id || '')}
          onClick={() => onAssignManager(managerDraft)}
        >
          {busy === 'manager' ? 'Saving…' : 'Save owner'}
        </button>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Log a vendor response</legend>
        <select value={responseStatus} onChange={event => setResponseStatus(event.target.value)} style={{ ...inputStyle, width: '100%' }}>
          <option value="replied">Replied</option>
          <option value="followup_due">Follow-up due</option>
          <option value="changes_requested">Changes requested</option>
        </select>
        <textarea
          value={note}
          onChange={event => setNote(event.target.value)}
          placeholder="What the vendor said (max 500 characters)"
          rows={3}
          style={{ ...inputStyle, width: '100%', marginTop: 8, resize: 'vertical' }}
        />
        <button
          type="button"
          style={{ ...buttonStyle, marginTop: 8 }}
          disabled={busy === 'response' || (responseStatus === 'changes_requested' && !note.trim())}
          onClick={() => onLogResponse(responseStatus, note)}
        >
          {busy === 'response' ? 'Saving…' : 'Log response'}
        </button>
      </fieldset>

      <h3 style={{ fontSize: 14, marginBottom: 6 }}>Delivery history</h3>
      {detail.events.length === 0 ? <p style={{ color: '#64748b', fontSize: 12 }}>No events recorded yet.</p> : (
        <ol style={{ paddingLeft: 18, fontSize: 12 }}>
          {detail.events.map(event => (
            <li key={event.id} style={{ marginBottom: 8 }}>
              <strong>{event.event_type.replaceAll('_', ' ')}</strong>
              <small style={{ display: 'block', color: '#64748b' }}>{formatDate(event.created_at)}</small>
              {event.payload?.note && <small style={{ display: 'block' }}>{event.payload.note}</small>}
              {event.payload?.provider_status && <small style={{ display: 'block' }}>Provider: {event.payload.provider_status}</small>}
            </li>
          ))}
        </ol>
      )}

      <h3 style={{ fontSize: 14, marginBottom: 6 }}>Level history</h3>
      {detail.transitions.length === 0 ? <p style={{ color: '#64748b', fontSize: 12 }}>No level changes yet.</p> : (
        <ol style={{ paddingLeft: 18, fontSize: 12 }}>
          {detail.transitions.map(transition => (
            <li key={transition.id} style={{ marginBottom: 8 }}>
              <strong>{transition.from_level || 'new'} → {transition.to_level}</strong>
              <small style={{ display: 'block', color: '#64748b' }}>
                {transition.trigger_type} · {formatDate(transition.created_at)}
              </small>
              {transition.reason && <small style={{ display: 'block' }}>{transition.reason}</small>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const mainStyle: React.CSSProperties = { maxWidth: 1500, margin: '0 auto', padding: 24, color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid #e2e8f0' };
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, letterSpacing: 1.5, color: '#d4af37', fontWeight: 900 };
const buttonStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', background: '#fff', cursor: 'pointer', fontWeight: 800 };
const buttonLink: React.CSSProperties = { ...buttonStyle, background: '#0f172a', color: '#fff', textDecoration: 'none' };
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginTop: 18 };
const statCard: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'default', textAlign: 'left' };
const statCardActive: React.CSSProperties = { borderColor: '#0f172a', boxShadow: '0 0 0 2px #0f172a inset' };
const toolbarStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '16px 0' };
const filterButton: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 99, background: '#fff', padding: '7px 11px', cursor: 'pointer' };
const selectedFilter: React.CSSProperties = { background: '#0f172a', color: '#fff' };
const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 11px', background: '#fff', fontSize: 13 };
const contentGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 16, alignItems: 'start' };
const panelStyle: React.CSSProperties = { minWidth: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const cellHintStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontSize: 11, marginTop: 2 };
const statusStyle: React.CSSProperties = { display: 'inline-block', padding: '4px 8px', background: '#f1f5f9', borderRadius: 99, fontSize: 11, textTransform: 'capitalize', fontWeight: 800 };
const badgeStyle: React.CSSProperties = { display: 'inline-block', padding: '2px 8px', border: '1px solid #cbd5e1', borderRadius: 99, fontSize: 11, fontWeight: 800, textTransform: 'capitalize' };
const smallButton: React.CSSProperties = { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11 };
const smallLink: React.CSSProperties = { display: 'inline-block', color: '#1d4ed8', fontWeight: 800, fontSize: 11, textDecoration: 'none', padding: 6 };
const inlineLink: React.CSSProperties = { color: '#1d4ed8', fontWeight: 700 };
const errorStyle: React.CSSProperties = { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: 10, borderRadius: 8 };
const noticeStyle: React.CSSProperties = { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: 10, borderRadius: 8 };
const warningStyle: React.CSSProperties = { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: 8, borderRadius: 8, fontSize: 12 };
const fieldsetStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, margin: '0 0 12px' };
const legendStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#334155', padding: '0 6px' };
const metaListStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, margin: '0 0 12px' };
const metaTermStyle: React.CSSProperties = { margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700 };
const metaValueStyle: React.CSSProperties = { margin: 0, fontSize: 12 };
