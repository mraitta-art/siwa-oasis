'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface TrialView {
  status: 'none' | 'active' | 'ending' | 'ended';
  started_at: string | null;
  expires_at: string | null;
  days_total: number;
  days_remaining: number;
  can_edit: boolean;
  minisite_stays_online: boolean;
}

interface ServiceView {
  key: string;
  label: string;
  description: string;
  category: string;
  state: 'active' | 'upgrade';
}

interface TrialState {
  trial: TrialView;
  defaultDays: number;
  tier: { id: string; name: string };
  quota: {
    photos: number | null;
    slides: number | null;
    videos: number | null;
    youtube: number | null;
    storageMB: number | null;
    photosUsed: number;
    slidesUsed: number;
    videosUsed: number;
    youtubeUsed: number;
  };
  services: ServiceView[];
  canManage: boolean;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * The free period, as the vendor experiences it.
 *
 * Deliberately calm: the period is a trial of the real service, so the card
 * reports what is on and how much room is left — never a "buy now" wall. The
 * admin controls are the same component, because the period is an admin
 * decision and should be editable where it is visible.
 */
export default function VendorTrialCard() {
  const [state, setState] = useState<TrialState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/vendor/trial');
      if (!response.ok) return;
      const data = await response.json();
      setState({
        trial: data.trial,
        defaultDays: data.defaultDays || 90,
        tier: data.tier || { id: 'free', name: 'Free' },
        quota: data.quota || {
          photos: null,
          slides: null,
          videos: null,
          youtube: null,
          storageMB: null,
          photosUsed: 0,
          slidesUsed: 0,
          videosUsed: 0,
          youtubeUsed: 0,
        },
        services: Array.isArray(data.services) ? data.services : [],
        canManage: Boolean(data.canManage),
      });
      setDays(String(data.defaultDays || 90));
    } catch {
      // Silent: the rest of the dashboard still works without this panel.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: 'start' | 'extend' | 'end') {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/vendor/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, days: Number(days) || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update the period.');
      setState(current => (current ? { ...current, trial: data.trial } : current));
      setMessage({
        tone: 'ok',
        text: action === 'end' ? 'Free period ended. The minisite is still online.' : `Saved — ${data.trial.days_remaining} days left.`,
      });
    } catch (error: any) {
      setMessage({ tone: 'warn', text: error?.message || 'Unable to update the period.' });
    } finally {
      setBusy(false);
    }
  }

  if (loading || !state) return null;

  const { trial, quota, services, canManage } = state;
  const photosUsed = Math.max(0, Number(quota.photosUsed) || 0);
  const photoLimit = quota.photos ?? null;
  const progress = trial.days_total > 0
    ? Math.min(100, Math.max(0, Math.round(((trial.days_total - trial.days_remaining) / trial.days_total) * 100)))
    : 0;
  const activeServices = services.filter(service => service.state === 'active').length;

  const tone =
    trial.status === 'ended'
      ? { bg: '#f8fafc', border: '#e2e8f0', chipBg: '#f1f5f9', chipFg: '#475569', accent: '#64748b' }
      : trial.status === 'ending'
        ? { bg: '#fffbeb', border: '#fde68a', chipBg: '#fef3c7', chipFg: '#92400e', accent: '#b45309' }
        : { bg: '#f0fdf4', border: '#bbf7d0', chipBg: '#dcfce7', chipFg: '#166534', accent: '#15803d' };

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
          <div style={{ fontSize: '0.62rem', letterSpacing: '1.2px', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase' }}>
            Free period
          </div>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            Your full service, for a limited time
          </h2>
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.68rem',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            background: tone.chipBg,
            color: tone.chipFg,
          }}
        >
          {trial.status === 'none'
            ? 'Not started'
            : trial.status === 'ended'
              ? 'Period ended'
              : `${trial.days_remaining} day${trial.days_remaining === 1 ? '' : 's'} left`}
        </span>
      </div>

      <div style={{ marginTop: '1rem', border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 16, padding: '1rem' }}>
        {trial.status === 'none' ? (
          <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, lineHeight: 1.65 }}>
            No free period recorded for this business yet. Everything below is switched on the moment it starts.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {trial.days_remaining}
              </strong>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b' }}>
                of {trial.days_total} days remaining
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8' }}>
                {trial.status === 'ended' ? 'Ended' : 'Ends'} {formatDate(trial.expires_at)}
              </span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, marginTop: '0.7rem', overflow: 'hidden' }}>
              <div style={{ width: `${trial.status === 'ended' ? 100 : progress}%`, height: '100%', background: tone.accent, borderRadius: 999 }} />
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.68rem', color: tone.chipFg, fontWeight: 700, lineHeight: 1.65 }}>
              {trial.status === 'ended'
                ? 'The period is over. Your minisite stays online for visitors and Google — editing and the growth tools wait for a plan.'
                : 'All services are switched on during this period. Your minisite is a real, public page — not a preview.'}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginTop: '0.85rem' }}>
        <Meter label="Photos" used={photosUsed} limit={photoLimit} />
        <Meter label="Carousel slide" used={Number(quota.slidesUsed) || 0} limit={quota.slides} />
        <Meter label="Uploaded video" used={Number(quota.videosUsed) || 0} limit={quota.videos} />
        <Meter label="YouTube embed" used={Number(quota.youtubeUsed) || 0} limit={quota.youtube} />
        <Meter label="Storage" used={null} limit={quota.storageMB} suffix=" MB" />
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, lineHeight: 1.7 }}>
        Carousel, uploaded video and YouTube are try-one features: you can test each of them, one at a time. Delete the one you have to try another.
      </div>

      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a' }}>
          Included services
        </span>
        <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8' }}>
          {activeServices}/{services.length} on · plan: {state.tier.name}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
        {services.map(service => {
          const on = service.state === 'active';
          return (
            <span
              key={service.key}
              title={service.description}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.64rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 999,
                background: on ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${on ? '#bbf7d0' : '#e2e8f0'}`,
                color: on ? '#166534' : '#94a3b8',
              }}
            >
              <i className={on ? 'fas fa-check' : 'far fa-circle'} style={{ fontSize: '0.55rem' }} />
              {service.label}
            </span>
          );
        })}
      </div>

      <div style={{ marginTop: '0.8rem', fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, lineHeight: 1.7 }}>
        The length of this period is set by SiWiFy. Nothing is deleted when it ends, and your minisite address never changes hands.
      </div>

      {canManage && (
        <div style={{ marginTop: '0.9rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.9rem', display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.62rem', letterSpacing: '1px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>
            SiWiFy control
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={event => setDays(event.target.value)}
              style={{ width: 90, border: '1px solid #e2e8f0', borderRadius: 9, padding: '0.45rem 0.6rem', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}
            />
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>days</span>
            <button
              type="button"
              onClick={() => act(trial.status === 'none' ? 'start' : 'extend')}
              disabled={busy}
              style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 9, padding: '0.45rem 0.85rem', fontSize: '0.7rem', fontWeight: 900, cursor: busy ? 'wait' : 'pointer' }}
            >
              {busy ? 'Saving…' : trial.status === 'none' ? 'Start period' : 'Extend'}
            </button>
            {trial.status !== 'none' && trial.status !== 'ended' && (
              <button
                type="button"
                onClick={() => act('end')}
                disabled={busy}
                style={{ background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 9, padding: '0.45rem 0.85rem', fontSize: '0.7rem', fontWeight: 900, cursor: busy ? 'wait' : 'pointer' }}
              >
                End now
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', fontWeight: 800, color: message.tone === 'ok' ? '#166534' : '#b45309' }}>
          {message.text}
        </div>
      )}
    </section>
  );
}

function Meter({ label, used, limit, suffix = '' }: { label: string; used: number | null; limit: number | null; suffix?: string }) {
  const ratio = used != null && limit ? Math.min(1, used / limit) : 0;
  return (
    <div style={{ border: '1px solid #eef0f5', borderRadius: 12, padding: '0.6rem 0.75rem', background: '#fff' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.6px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
        {used != null ? used : '—'}
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>
          {limit != null ? ` / ${limit}${suffix}` : ' · not limited'}
        </span>
      </div>
      {used != null && limit != null && (
        <div style={{ height: 4, background: '#eef0f5', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ width: `${ratio * 100}%`, height: '100%', background: ratio > 0.85 ? '#dc2626' : '#D4AF37' }} />
        </div>
      )}
    </div>
  );
}
