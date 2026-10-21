'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Handoff {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  revision: number;
  status: string;
  vendor_phone: string | null;
  whatsapp_error: string | null;
  accepted_name: string | null;
  accepted_at: string | null;
  changes_requested_note: string | null;
  created_at: string;
  updated_at: string;
}

const statuses = ['all', 'draft', 'sent', 'delivered', 'read', 'failed', 'followup_due', 'replied', 'accepted', 'changes_requested', 'published', 'expired'];

export default function MinisiteHandoffsPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/jana/minisite-handoffs');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load minisite handoffs.');
      setHandoffs(data.handoffs || []);
    } catch (cause: any) {
      setError(cause.message || 'Unable to load minisite handoffs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function inspect(handoffId: string) {
    try {
      const response = await fetch(`/api/jana/minisite-handoffs?handoffId=${encodeURIComponent(handoffId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load handoff history.');
      setSelected(data);
    } catch (cause: any) {
      setError(cause.message || 'Unable to load handoff history.');
    }
  }

  async function updateStatus(handoffId: string, status: 'followup_due' | 'replied') {
    setUpdatingId(handoffId);
    setError('');
    try {
      const response = await fetch('/api/jana/minisite-handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', handoffId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update CRM status.');
      await load();
      if (selected?.id === handoffId) await inspect(handoffId);
    } catch (cause: any) {
      setError(cause.message || 'Unable to update CRM status.');
    } finally {
      setUpdatingId('');
    }
  }

  const filtered = filter === 'all' ? handoffs : handoffs.filter(handoff => handoff.status === filter);

  return (
    <main style={mainStyle}>
      <header style={headerStyle}>
        <div>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: 1.5, color: '#d4af37', fontWeight: 900 }}>VENDOR DELIVERY CRM</p>
          <h1 style={{ margin: '6px 0', fontSize: 28 }}>Minisite review & follow-up</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Track WhatsApp provider delivery, vendor decisions, and publication approval by revision.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/jana/minisite-builder" style={buttonLink}>Build a minisite</Link>
          <button type="button" onClick={() => void load()} style={buttonStyle}>Refresh</button>
        </div>
      </header>

      <section style={statsGrid}>
        {['sent', 'delivered', 'read', 'followup_due', 'accepted', 'changes_requested'].map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)} style={statCard}>
            <span style={{ textTransform: 'capitalize', color: '#64748b' }}>{status.replace('_', ' ')}</span>
            <strong style={{ fontSize: 24, color: '#0f172a' }}>{handoffs.filter(handoff => handoff.status === status).length}</strong>
          </button>
        ))}
      </section>

      {error && <p role="alert" style={errorStyle}>{error}</p>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '16px 0' }}>
        {statuses.map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)} style={{ ...filterButton, ...(filter === status ? selectedFilter : {}) }}>
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={contentGrid}>
        <section style={panelStyle}>
          {loading ? <p>Loading CRM…</p> : filtered.length === 0 ? <p style={{ color: '#64748b' }}>No handoffs in this view. Build a draft minisite to start.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr><th>Business / Revision</th><th>Status</th><th>WhatsApp</th><th>Updated</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(handoff => (
                    <tr key={handoff.id}>
                      <td><strong>{handoff.business_name}</strong><br /><small>/{handoff.business_slug} · r{handoff.revision}</small></td>
                      <td><span style={statusStyle}>{handoff.status.replace('_', ' ')}</span></td>
                      <td>{handoff.vendor_phone || 'Not set'}{handoff.whatsapp_error && <small style={{ display: 'block', color: '#b91c1c' }}>{handoff.whatsapp_error}</small>}</td>
                      <td>{new Date(handoff.updated_at).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <button type="button" onClick={() => void inspect(handoff.id)} style={smallButton}>History</button>
                          <Link href={`/jana/minisite-builder?slug=${encodeURIComponent(handoff.business_slug)}`} style={smallLink}>Edit</Link>
                          {['sent', 'delivered', 'read', 'failed', 'followup_due'].includes(handoff.status) && (
                            <>
                              <button type="button" disabled={updatingId === handoff.id} onClick={() => void updateStatus(handoff.id, 'followup_due')} style={smallButton}>Follow up</button>
                              <button type="button" disabled={updatingId === handoff.id} onClick={() => void updateStatus(handoff.id, 'replied')} style={smallButton}>Log reply</button>
                            </>
                          )}
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
          <h2 style={{ marginTop: 0 }}>Revision activity</h2>
          {!selected ? <p style={{ color: '#64748b' }}>Select a handoff to inspect delivery and acceptance events.</p> : (
            <>
              <strong>{selected.business?.name} · Revision {selected.revision}</strong>
              <p>Status: <b>{selected.status.replace('_', ' ')}</b></p>
              {selected.accepted_name && <p>Accepted by: {selected.accepted_name} · {selected.accepted_at ? new Date(selected.accepted_at).toLocaleString() : ''}</p>}
              {selected.changes_requested_note && <p>Requested changes: {selected.changes_requested_note}</p>}
              <ol style={{ paddingLeft: 20 }}>
                {(selected.events || []).map((event: any) => (
                  <li key={event.id} style={{ marginBottom: 10 }}>
                    <strong>{String(event.event_type).replaceAll('_', ' ')}</strong>
                    <small style={{ display: 'block', color: '#64748b' }}>{new Date(event.created_at).toLocaleString()}</small>
                    {event.payload?.note && <small>{event.payload.note}</small>}
                    {event.payload?.provider_status && <small>Provider: {event.payload.provider_status}</small>}
                    {event.payload?.responsibility_acknowledgment && (
                      <small style={{ display: 'block', marginTop: 4 }}>
                        Vendor responsibility and content-rights confirmation: {event.payload.responsibility_acknowledgment}
                      </small>
                    )}
                  </li>
                ))}
              </ol>
              <Link href={`/jana/minisite-builder/preview?handoffId=${encodeURIComponent(selected.id)}`} target="_blank" style={smallLink}>Preview this revision</Link>
            </>
          )}
        </aside>
      </div>
      <p style={{ color: '#64748b', fontSize: 12, marginTop: 16 }}>“Sent” means Meta accepted the request. Delivered/read statuses require configured WhatsApp webhooks. Vendor replies are logged by an admin; inbound WhatsApp replies are not connected yet.</p>
    </main>
  );
}

const mainStyle: React.CSSProperties = { maxWidth: 1500, margin: '0 auto', padding: 24, color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid #e2e8f0' };
const buttonStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', background: '#fff', cursor: 'pointer', fontWeight: 800 };
const buttonLink: React.CSSProperties = { ...buttonStyle, background: '#0f172a', color: '#fff', textDecoration: 'none' };
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginTop: 18 };
const statCard: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer' };
const filterButton: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 99, background: '#fff', padding: '7px 11px', cursor: 'pointer', textTransform: 'capitalize' };
const selectedFilter: React.CSSProperties = { background: '#0f172a', color: '#fff' };
const contentGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 16, alignItems: 'start' };
const panelStyle: React.CSSProperties = { minWidth: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, overflow: 'auto' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 };
const statusStyle: React.CSSProperties = { display: 'inline-block', padding: '4px 8px', background: '#f1f5f9', borderRadius: 99, fontSize: 11, textTransform: 'capitalize', fontWeight: 800 };
const smallButton: React.CSSProperties = { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11 };
const smallLink: React.CSSProperties = { display: 'inline-block', color: '#1d4ed8', fontWeight: 800, fontSize: 11, textDecoration: 'none', padding: 6 };
const errorStyle: React.CSSProperties = { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: 10, borderRadius: 8 };
