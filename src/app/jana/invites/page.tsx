'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface InviteRecord {
  token: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  parent_type_name: string;
  child_type_name: string;
  subscription_tier: 'free' | 'pro' | 'verified_partner';
  dispatch_mode: 'direct' | 'gatekeeper';
  status: 'pending' | 'accepted' | 'expired' | 'claimed';
  created_at: string;
  accepted_at: string | null;
  expires_at: string | null;
  admin_notes: string | null;
  is_claimed: boolean;
  published: boolean;
  has_minisite: boolean;
  whatsapp: string;
  phone: string;
  onboard_url: string;
  vendor_url: string;
  minisite_url: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  claimed: number;
  withMinisite: number;
  direct: number;
  gatekeeper: number;
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  verified_partner: 'Verified Partner',
};

const TIER_COLORS: Record<string, string> = {
  free: '#64748b',
  pro: '#D4AF37',
  verified_partner: '#10b981',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  accepted: '#10b981',
  expired: '#ef4444',
  claimed: '#6366f1',
};

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  accepted: '✅',
  expired: '❌',
  claimed: '🏆',
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InvitesCRMPage() {
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired' | 'claimed'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'direct' | 'gatekeeper'>('all');
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/jana/invites');
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to load invites');
        return;
      }
      setInvites(data.invites || []);
      setStats(data.stats);
    } catch (e: any) {
      setError(e?.message || 'Error loading invites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAction(token: string, action: 'expire' | 'reset') {
    try {
      setActionLoading(token + action);
      await fetch('/api/jana/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveNote(token: string) {
    try {
      setActionLoading(token + 'note');
      await fetch('/api/jana/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, admin_notes: noteText }),
      });
      setInvites(prev => prev.map(i => i.token === token ? { ...i, admin_notes: noteText } : i));
      setEditingNote(null);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  function copyLink(url: string, key: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const filtered = invites.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (filterMode !== 'all' && inv.dispatch_mode !== filterMode) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inv.business_name?.toLowerCase().includes(q) &&
          !inv.business_slug?.toLowerCase().includes(q) &&
          !inv.whatsapp?.includes(q)) return false;
    }
    return true;
  });

  const st: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif",
    padding: '2rem',
    color: '#0f172a',
  };

  return (
    <div style={st}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/jana" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
            ← Control Center
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>📋 Invites CRM</h1>
            <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Track vendor invitations, onboarding acceptance & minisite setup
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadData}
            style={{ padding: '0.55rem 1rem', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
          <Link
            href="/jana/whatsapp-outreach"
            style={{ padding: '0.55rem 1rem', borderRadius: '10px', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none' }}
          >
            💬 WhatsApp Outreach
          </Link>
        </div>
      </div>

      {/* STATS ROW */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Sent', value: stats.total, icon: '📨', color: '#6366f1' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: '#f59e0b' },
            { label: 'Accepted', value: stats.accepted, icon: '✅', color: '#10b981' },
            { label: 'Expired', value: stats.expired, icon: '❌', color: '#ef4444' },
            { label: 'Claimed', value: stats.claimed, icon: '🏆', color: '#8b5cf6' },
            { label: 'Minisite Live', value: stats.withMinisite, icon: '🌐', color: '#0ea5e9' },
            { label: 'Direct Mode', value: stats.direct, icon: '⚡', color: '#D4AF37' },
            { label: 'Gatekeeper', value: stats.gatekeeper, icon: '🔒', color: '#64748b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '0.85rem 1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search business name, slug, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '0.84rem', outline: 'none', minWidth: '240px' }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '0.84rem', cursor: 'pointer' }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">⏳ Pending</option>
          <option value="accepted">✅ Accepted</option>
          <option value="expired">❌ Expired</option>
          <option value="claimed">🏆 Claimed</option>
        </select>
        <select
          value={filterMode}
          onChange={e => setFilterMode(e.target.value as any)}
          style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '0.84rem', cursor: 'pointer' }}
        >
          <option value="all">All Modes</option>
          <option value="direct">⚡ Direct</option>
          <option value="gatekeeper">🔒 Gatekeeper</option>
        </select>
        <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: 'auto' }}>
          {filtered.length} of {invites.length} invites
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem 1.25rem', color: '#dc2626', marginBottom: '1rem', fontSize: '0.88rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #D4AF37', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading invite records...
        </div>
      )}

      {/* INVITES TABLE */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
          <div style={{ fontWeight: 700, color: '#475569' }}>No invites found</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Send WhatsApp invites from the outreach page to see tracking here.</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(inv => (
            <div key={inv.token} style={{
              background: '#fff',
              borderRadius: '16px',
              border: `1px solid ${inv.status === 'accepted' ? '#bbf7d0' : inv.status === 'expired' ? '#fecaca' : '#e2e8f0'}`,
              padding: '1.25rem 1.5rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {/* TOP ROW */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  {/* Business name + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>{inv.business_name}</span>
                    <span style={{ background: STATUS_COLORS[inv.status] + '18', color: STATUS_COLORS[inv.status], border: `1px solid ${STATUS_COLORS[inv.status]}40`, borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>
                      {STATUS_ICONS[inv.status]} {inv.status.toUpperCase()}
                    </span>
                    <span style={{ background: TIER_COLORS[inv.subscription_tier] + '18', color: TIER_COLORS[inv.subscription_tier], border: `1px solid ${TIER_COLORS[inv.subscription_tier]}40`, borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>
                      {TIER_LABELS[inv.subscription_tier]}
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      {inv.dispatch_mode === 'gatekeeper' ? '🔒 Gatekeeper' : '⚡ Direct'}
                    </span>
                    {inv.has_minisite && (
                      <span style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>
                        🌐 Minisite Live
                      </span>
                    )}
                    {inv.is_claimed && (
                      <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}>
                        🔑 Account Claimed
                      </span>
                    )}
                  </div>

                  {/* Type info */}
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.6rem' }}>
                    {inv.parent_type_name && <span>{inv.parent_type_name}</span>}
                    {inv.child_type_name && <span> → {inv.child_type_name}</span>}
                    {' · '}
                    <span style={{ color: '#94a3b8' }}>/{inv.business_slug}</span>
                  </div>

                  {/* Timestamps */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>📨 Sent: {timeAgo(inv.created_at)}</span>
                    {inv.accepted_at && <span style={{ color: '#10b981', fontWeight: 700 }}>✅ Accepted: {timeAgo(inv.accepted_at)}</span>}
                    {!inv.accepted_at && inv.expires_at && (
                      <span style={{ color: new Date(inv.expires_at) < new Date() ? '#ef4444' : '#f59e0b' }}>
                        ⏰ Expires: {timeAgo(inv.expires_at)}
                      </span>
                    )}
                    {inv.whatsapp && <span>📱 {inv.whatsapp}</span>}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* Copy onboard link */}
                    <button
                      onClick={() => copyLink(inv.onboard_url, inv.token + 'onboard')}
                      title="Copy invite link"
                      style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {copied === inv.token + 'onboard' ? '✓ Copied!' : '🔗 Invite Link'}
                    </button>

                    {/* Open vendor dashboard */}
                    <a href={inv.vendor_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                    >
                      📱 Dashboard
                    </a>

                    {/* Open minisite */}
                    <a href={inv.minisite_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                    >
                      🌐 Minisite
                    </a>

                    {/* Resend via WhatsApp */}
                    {inv.whatsapp && (
                      <a
                        href={`https://wa.me/${inv.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً! رابط انضمامك لسيوايفاي: ${inv.onboard_url}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}
                      >
                        💬 Resend
                      </a>
                    )}
                  </div>

                  {/* Reset / Expire actions */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => handleAction(inv.token, 'expire')}
                        disabled={actionLoading === inv.token + 'expire'}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: '7px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Expire
                      </button>
                    )}
                    {inv.status !== 'accepted' && (
                      <button
                        onClick={() => handleAction(inv.token, 'reset')}
                        disabled={actionLoading === inv.token + 'reset'}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: '7px', background: '#fefce8', border: '1px solid #fef08a', color: '#854d0e', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ADMIN NOTES */}
              <div style={{ marginTop: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                {editingNote === inv.token ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      rows={2}
                      placeholder="Admin notes about this vendor..."
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #D4AF37', background: '#fffbeb', color: '#0f172a', fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <button
                        onClick={() => handleSaveNote(inv.token)}
                        disabled={actionLoading === inv.token + 'note'}
                        style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#D4AF37', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>
                      Notes:
                    </span>
                    <span style={{ flex: 1, fontSize: '0.82rem', color: inv.admin_notes ? '#475569' : '#cbd5e1', fontStyle: inv.admin_notes ? 'normal' : 'italic' }}>
                      {inv.admin_notes || 'No notes yet'}
                    </span>
                    <button
                      onClick={() => { setEditingNote(inv.token); setNoteText(inv.admin_notes || ''); }}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
