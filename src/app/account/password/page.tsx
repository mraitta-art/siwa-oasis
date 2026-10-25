'use client';

import { useEffect, useState } from 'react';

/**
 * Self-service password reset for any signed-in account. Reachable at
 * /account/password and linked from the dashboard header, so the owner never
 * has to ask for a password change again.
 */
export default function ChangePasswordPage() {
  const [email, setEmail] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmail(data?.user?.email || data?.email || ''))
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ kind: 'error', text: 'The two new passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: 'error', text: data.error || 'Could not change the password.' });
      } else {
        setStatus({ kind: 'success', text: 'Password changed. Use the new one the next time you sign in.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setStatus({ kind: 'error', text: 'Network error. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  const field: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.9rem',
    background: '#fff',
    color: '#0f172a',
    boxSizing: 'border-box',
  };
  const label: React.CSSProperties = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 900,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '0.4rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '20px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Account security
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem' }}>Change your password</h1>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.5rem' }}>
          {email ? <>Signed in as <strong style={{ color: '#0f172a' }}>{email}</strong></> : 'Signed in'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={label} htmlFor="current">Current password</label>
            <input id="current" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={field} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={label} htmlFor="next">New password</label>
            <input id="next" type="password" autoComplete="new-password" required minLength={10} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={field} />
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.35rem' }}>At least 10 characters.</div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={label} htmlFor="confirm">Repeat new password</label>
            <input id="confirm" type="password" autoComplete="new-password" required minLength={10} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={field} />
          </div>

          {status && (
            <div style={{ background: status.kind === 'error' ? '#fef2f2' : '#f0fdf4', color: status.kind === 'error' ? '#dc2626' : '#16a34a', padding: '0.7rem 0.9rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
              {status.text}
            </div>
          )}

          <button type="submit" disabled={saving} style={{ width: '100%', padding: '0.85rem', background: saving ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <a href="/jana" style={{ display: 'block', textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textDecoration: 'none' }}>
          ← Back to dashboard
        </a>
      </div>
    </div>
  );
}
