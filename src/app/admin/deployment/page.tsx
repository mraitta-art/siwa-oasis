'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
interface DeployLog {
  id: string;
  triggeredBy: string;
  triggeredAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: 'running' | 'success' | 'failed';
  commitHash?: string;
  output?: string;
  error?: string;
}

interface GitInfo { branch?: string; hash?: string; dirty?: boolean }

interface StatusData {
  running: boolean;
  lastDeploy: DeployLog | null;
  history: DeployLog[];
  git: GitInfo;
  serverTime: string;
}

interface ScheduleConfig {
  enabled: boolean;
  preset: 'nightly' | 'every6h' | 'every12h' | 'custom' | 'off';
  cronExpression: string;
  timezone: string;
  nextRun?: string;
  lastRun?: string;
  alarms: {
    browserPush: boolean;
    webhookUrl: string;
    onFailOnly: boolean;
    emailAddress: string;
  };
}

// ── Presets ────────────────────────────────────────────────────────────────
const PRESETS = [
  { id: 'nightly',  label: 'Every night at 2:00 AM', cron: '0 2 * * *' },
  { id: 'every6h',  label: 'Every 6 hours',           cron: '0 */6 * * *' },
  { id: 'every12h', label: 'Every 12 hours',          cron: '0 */12 * * *' },
  { id: 'custom',   label: 'Custom cron expression',  cron: '' },
  { id: 'off',      label: 'Disabled',                cron: '' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtDur(ms?: number) {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  return s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}
function statusColor(status: string) {
  if (status === 'success') return '#22c55e';
  if (status === 'failed')  return '#ef4444';
  return '#f59e0b';
}
function statusLabel(status: string) {
  if (status === 'success') return '✅ Success';
  if (status === 'failed')  return '❌ Failed';
  return '⚙️ Running';
}

// ── Component ──────────────────────────────────────────────────────────────
export default function DeploymentPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [localSchedule, setLocalSchedule] = useState<ScheduleConfig | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [runnerStatus, setRunnerStatus] = useState<'unknown' | 'running' | 'stopped'>('unknown');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch status ──────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/deployment/status');
      const data = await res.json();
      setStatus(data);
      setDeploying(data.running);
    } catch {}
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/deployment/schedule');
      const data = await res.json();
      setSchedule(data);
      setLocalSchedule(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchSchedule();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus, fetchSchedule]);

  // ── Deploy now ─────────────────────────────────────────────────────────
  async function triggerDeploy() {
    if (deploying) return;
    setDeploying(true);
    setDeployMsg('Deploying...');
    try {
      const res = await fetch('/api/admin/deployment/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'admin-dashboard' }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployMsg(`✅ Deploy started — Job ID: ${data.jobId}`);
      } else {
        setDeployMsg(`❌ ${data.error ?? 'Failed to start deploy.'}`);
        setDeploying(false);
      }
    } catch {
      setDeployMsg('❌ Network error — could not start deploy.');
      setDeploying(false);
    }
    setTimeout(() => setDeployMsg(''), 8000);
  }

  // ── Save schedule ─────────────────────────────────────────────────────
  async function saveSchedule() {
    if (!localSchedule) return;
    setSavingSchedule(true);
    setScheduleMsg('');
    try {
      const res = await fetch('/api/admin/deployment/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSchedule),
      });
      const data = await res.json();
      if (res.ok) {
        setSchedule(data.config);
        setLocalSchedule(data.config);
        setScheduleMsg('✅ Schedule saved!');
      } else {
        setScheduleMsg(`❌ ${data.error}`);
      }
    } catch {
      setScheduleMsg('❌ Network error');
    }
    setSavingSchedule(false);
    setTimeout(() => setScheduleMsg(''), 5000);
  }

  // ── Test webhook ──────────────────────────────────────────────────────
  async function testWebhook() {
    const url = localSchedule?.alarms?.webhookUrl;
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '🔔 Test alarm from Siwa.Today Deploy Control Center' }),
      });
      setScheduleMsg('✅ Test webhook sent!');
    } catch {
      setScheduleMsg('❌ Webhook failed — check URL');
    }
    setTimeout(() => setScheduleMsg(''), 5000);
  }

  // ── Request browser notifications ─────────────────────────────────────
  async function requestBrowserPush() {
    if (!('Notification' in window)) {
      setScheduleMsg('❌ Browser notifications not supported.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('🔔 Siwa Deploy Alarms', { body: 'You will now receive deployment notifications.' });
      setScheduleMsg('✅ Browser notifications enabled!');
    } else {
      setScheduleMsg('⚠️ Notification permission denied.');
    }
    setTimeout(() => setScheduleMsg(''), 5000);
  }

  const ls = localSchedule;
  const s = status;

  const isRunning = s?.running ?? false;
  const ringColor = isRunning ? '#f59e0b' : (s?.lastDeploy?.status === 'failed' ? '#ef4444' : '#22c55e');
  const ringLabel = isRunning ? 'Deploying…' : (s?.lastDeploy?.status === 'failed' ? 'Last Deploy Failed' : 'System Live');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", padding: '2rem' }}>
      {/* ── Page Header ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, ${ringColor}88, ${ringColor}22)`, border: `3px solid ${ringColor}`, boxShadow: `0 0 24px ${ringColor}88`, animation: isRunning ? 'pulse-ring 1.2s ease-in-out infinite' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {isRunning ? '⚙️' : s?.lastDeploy?.status === 'failed' ? '❌' : '🚀'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Deployment Control Center</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              {ringLabel} &nbsp;·&nbsp; Branch: <span style={{ color: '#60a5fa' }}>{s?.git?.branch ?? '…'}</span>
              &nbsp;·&nbsp; Commit: <span style={{ color: '#818cf8' }}>{s?.git?.hash ?? '…'}</span>
              {s?.git?.dirty && <span style={{ color: '#f59e0b', marginLeft: 6 }}>⚠ Uncommitted changes</span>}
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <a href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', border: '1px solid #334155', borderRadius: 8, padding: '0.4rem 1rem', display: 'inline-block' }}>← Admin Home</a>
          </div>
        </div>

        <style>{`
          @keyframes pulse-ring {
            0%, 100% { box-shadow: 0 0 18px #f59e0b88; }
            50% { box-shadow: 0 0 36px #f59e0bcc; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* ── Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>

          {/* ── Card 1: Deploy Now ── */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem', backdropFilter: 'blur(12px)' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 2 }}>🚀 Deploy Now</h2>

            {/* Status summary */}
            {s?.lastDeploy && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', borderLeft: `4px solid ${statusColor(s.lastDeploy.status)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{statusLabel(s.lastDeploy.status)}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#1e293b', padding: '2px 8px', borderRadius: 99 }}>by {s.lastDeploy.triggeredBy}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 6, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <span>🕐 {fmtTime(s.lastDeploy.triggeredAt)}</span>
                  <span>⏱ {fmtDur(s.lastDeploy.durationMs)}</span>
                  {s.lastDeploy.commitHash && <span>🔖 {s.lastDeploy.commitHash}</span>}
                </div>
              </div>
            )}

            <button
              id="deploy-now-btn"
              onClick={triggerDeploy}
              disabled={deploying}
              style={{ width: '100%', padding: '1rem', borderRadius: 10, border: 'none', cursor: deploying ? 'not-allowed' : 'pointer', background: deploying ? 'linear-gradient(135deg, #374151, #1f2937)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', boxShadow: deploying ? 'none' : '0 4px 24px #6366f144' }}
            >
              {deploying ? (
                <>
                  <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #60a5fa', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Deploying in progress…
                </>
              ) : (
                <>🚀 PUSH TO PRODUCTION NOW</>
              )}
            </button>

            {deployMsg && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: deployMsg.startsWith('✅') ? '#22c55e' : '#ef4444', textAlign: 'center' }}>{deployMsg}</p>
            )}

            {/* What happens info */}
            <div style={{ marginTop: '1.25rem', background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '0.875rem', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.7 }}>
              <strong style={{ color: '#c7d2fe' }}>What happens when you deploy:</strong><br />
              1. All local code changes are committed to Git<br />
              2. Changes are pushed to GitHub automatically<br />
              3. Vercel detects the push and rebuilds the live site<br />
              4. Live site at siwa.today updates in ~2–4 minutes
            </div>
          </div>

          {/* ── Card 2: Deploy History ── */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem', backdropFilter: 'blur(12px)' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 2 }}>📜 Deploy History</h2>

            {(!s?.history || s.history.length === 0) ? (
              <div style={{ textAlign: 'center', color: '#475569', padding: '2rem 0' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                No deployments yet. Click Deploy Now to start!
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {s.history.map((log) => (
                  <div key={log.id} style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${statusColor(log.status)}33`, borderRadius: 10, padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: statusColor(log.status) }}>{statusLabel(log.status)}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{fmtTime(log.triggeredAt)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {log.durationMs !== undefined && <span>⏱ {fmtDur(log.durationMs)}</span>}
                      {log.commitHash && <span>🔖 {log.commitHash}</span>}
                      <span>👤 {log.triggeredBy}</span>
                    </div>
                    {expandedLog === log.id && (log.output || log.error) && (
                      <pre style={{ marginTop: 8, background: '#0f172a', borderRadius: 6, padding: '0.625rem', fontSize: '0.7rem', color: '#94a3b8', overflowX: 'auto', maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {log.output ?? log.error}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Card 3: Schedule Builder ── */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 2 }}>📅 Auto-Deploy Schedule</h2>
              {ls && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.8rem', color: ls.enabled ? '#22c55e' : '#64748b' }}>{ls.enabled ? 'ON' : 'OFF'}</span>
                  <div
                    id="schedule-toggle"
                    onClick={() => setLocalSchedule(prev => prev ? { ...prev, enabled: !prev.enabled } : prev)}
                    style={{ width: 44, height: 24, borderRadius: 99, background: ls.enabled ? '#22c55e' : '#334155', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', top: 3, left: ls.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                </label>
              )}
            </div>

            {ls && (
              <>
                {/* Preset selector */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Schedule Preset</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {PRESETS.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: 8, background: ls.preset === p.id ? 'rgba(99,102,241,0.15)' : 'transparent', border: `1px solid ${ls.preset === p.id ? '#6366f1' : 'transparent'}`, transition: 'all 0.15s' }}>
                        <input type="radio" name="preset" value={p.id} checked={ls.preset === p.id} onChange={() => setLocalSchedule(prev => prev ? { ...prev, preset: p.id as ScheduleConfig['preset'], cronExpression: p.cron || prev.cronExpression, enabled: p.id !== 'off' } : prev)} style={{ accentColor: '#6366f1' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: ls.preset === p.id ? 600 : 400 }}>{p.label}</span>
                        {p.cron && <code style={{ marginLeft: 'auto', fontSize: '0.7rem', background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#818cf8' }}>{p.cron}</code>}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom cron */}
                {ls.preset === 'custom' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Custom Cron Expression</label>
                    <input
                      id="custom-cron-input"
                      type="text"
                      value={ls.cronExpression}
                      onChange={e => setLocalSchedule(prev => prev ? { ...prev, cronExpression: e.target.value } : prev)}
                      placeholder="e.g. 0 3 * * 1 (every Monday at 3am)"
                      style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontFamily: 'monospace', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {/* Next run info */}
                {schedule?.nextRun && ls.enabled && (
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e33', borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#86efac' }}>
                    ⏰ Next scheduled deploy: <strong>{fmtTime(schedule.nextRun)}</strong>
                  </div>
                )}
                {schedule?.lastRun && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
                    Last auto-deploy: {fmtTime(schedule.lastRun)}
                  </div>
                )}

                <button
                  id="save-schedule-btn"
                  onClick={saveSchedule}
                  disabled={savingSchedule}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: 'none', cursor: savingSchedule ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', letterSpacing: 1, transition: 'opacity 0.2s', opacity: savingSchedule ? 0.6 : 1 }}
                >
                  {savingSchedule ? 'Saving…' : '💾 Save Schedule'}
                </button>
              </>
            )}
          </div>

          {/* ── Card 4: Alarms & Notifications ── */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem', backdropFilter: 'blur(12px)' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 2 }}>🔔 Alarms & Notifications</h2>

            {ls && (
              <>
                {/* Browser push */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', background: 'rgba(0,0,0,0.2)', borderRadius: 10, marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🖥️ Browser Notifications</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Popup alerts in this browser</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button id="enable-browser-push-btn" onClick={requestBrowserPush} style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer' }}>Enable</button>
                    <div onClick={() => setLocalSchedule(prev => prev ? { ...prev, alarms: { ...prev.alarms, browserPush: !prev.alarms.browserPush } } : prev)}
                      style={{ width: 40, height: 22, borderRadius: 99, background: ls.alarms.browserPush ? '#6366f1' : '#334155', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', top: 3, left: ls.alarms.browserPush ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                </div>

                {/* Alarm mode */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', background: 'rgba(0,0,0,0.2)', borderRadius: 10, marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🎯 Alarm Mode</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{ls.alarms.onFailOnly ? 'Alert on failure only' : 'Alert on every deploy'}</div>
                  </div>
                  <div onClick={() => setLocalSchedule(prev => prev ? { ...prev, alarms: { ...prev.alarms, onFailOnly: !prev.alarms.onFailOnly } } : prev)}
                    style={{ width: 40, height: 22, borderRadius: 99, background: ls.alarms.onFailOnly ? '#ef4444' : '#22c55e', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', top: 3, left: ls.alarms.onFailOnly ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>

                {/* Webhook URL */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Webhook URL (Slack / Discord / Custom)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      id="webhook-url-input"
                      type="url"
                      value={ls.alarms.webhookUrl}
                      onChange={e => setLocalSchedule(prev => prev ? { ...prev, alarms: { ...prev.alarms, webhookUrl: e.target.value } } : prev)}
                      placeholder="https://hooks.slack.com/services/..."
                      style={{ flex: 1, padding: '0.625rem 0.875rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: '0.8rem', outline: 'none' }}
                    />
                    <button id="test-webhook-btn" onClick={testWebhook} style={{ padding: '0.625rem 0.875rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      🧪 Test
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Alert Email Address</label>
                  <input
                    id="alert-email-input"
                    type="email"
                    value={ls.alarms.emailAddress}
                    onChange={e => setLocalSchedule(prev => prev ? { ...prev, alarms: { ...prev.alarms, emailAddress: e.target.value } } : prev)}
                    placeholder="admin@siwa.today"
                    style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>Email alerts require an SMTP service (Resend / Nodemailer) — configure in .env</p>
                </div>

                {scheduleMsg && (
                  <p style={{ fontSize: '0.85rem', color: scheduleMsg.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: '0.75rem', textAlign: 'center' }}>{scheduleMsg}</p>
                )}

                <button
                  id="save-alarms-btn"
                  onClick={saveSchedule}
                  disabled={savingSchedule}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', letterSpacing: 1 }}
                >
                  💾 Save Alarm Settings
                </button>

                {/* How to start runner */}
                <div style={{ marginTop: '1.25rem', background: 'rgba(245,158,11,0.07)', border: '1px solid #f59e0b22', borderRadius: 8, padding: '0.875rem', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.7 }}>
                  <strong style={{ color: '#fcd34d' }}>⚡ To enable auto-scheduling, start the runner:</strong><br />
                  <code style={{ background: '#0f172a', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4, color: '#a5f3fc' }}>
                    node scripts/schedule-runner.js
                  </code>
                  <br />Or use <strong>SYNC-MASTER.ps1</strong> option [9] to launch it in a background window.
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom: Watcher Status Card ── */}
        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', backdropFilter: 'blur(12px)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 2 }}>⚡ Quick Actions</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { id: 'btn-vercel', label: '🌐 Vercel Dashboard', href: 'https://vercel.com', color: '#0ea5e9' },
              { id: 'btn-github', label: '📦 GitHub Repo', href: 'https://github.com', color: '#8b5cf6' },
              { id: 'btn-refresh', label: '🔄 Refresh Status', href: '#', color: '#10b981', onClick: fetchStatus },
            ].map(btn => (
              <a key={btn.id} id={btn.id} href={btn.href} onClick={btn.onClick ? (e) => { e.preventDefault(); btn.onClick(); } : undefined} target={btn.href !== '#' ? '_blank' : undefined} rel="noreferrer"
                style={{ padding: '0.625rem 1.25rem', background: `${btn.color}18`, border: `1px solid ${btn.color}44`, borderRadius: 8, color: btn.color, fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}>
                {btn.label}
              </a>
            ))}
          </div>
          <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#475569' }}>
            Status auto-refreshes every 5 seconds &nbsp;·&nbsp; Last checked: {fmtTime(s?.serverTime)}
          </p>
        </div>
      </div>
    </div>
  );
}
