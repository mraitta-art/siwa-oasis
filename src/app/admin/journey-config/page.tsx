'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';

export default function AdminJourneyConfigPage() {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/journeys/config')
      .then(r => r.json())
      .then(d => {
        setRaw(JSON.stringify(d, null, 2));
      })
      .catch(() => setRaw('{}'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setMessage('');
    try {
      const payload = JSON.parse(raw);
      const res = await fetch('/api/journeys/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) setMessage('Saved successfully');
      else setMessage('Save failed: ' + (data.error || 'unknown'));
    } catch (e: any) {
      setMessage('Invalid JSON: ' + e.message);
    }
    setSaving(false);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Journey Configuration (Admin)</h1>
      <p style={{ color: '#666' }}>Edit the JSON configuration for categories and vibes. Changes take effect immediately for the planner component.</p>
      {loading ? <p>Loading…</p> : (
        <>
          <textarea value={raw} onChange={e => setRaw(e.target.value)} style={{ width: '100%', minHeight: '480px', fontFamily: 'monospace', fontSize: '0.9rem', padding: '1rem' }} />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: '0.6rem 1rem', background: '#D4AF37', border: 'none', borderRadius: '8px', fontWeight: 700 }}>{saving ? 'Saving…' : 'Save'}</button>
            <a href="/" style={{ padding: '0.6rem 1rem', background: '#f3f4f6', borderRadius: '8px', display: 'inline-block', textDecoration: 'none', color: '#111' }}>View Site</a>
          </div>
          {message && <div style={{ marginTop: '1rem', color: message.startsWith('Saved') ? 'green' : 'crimson' }}>{message}</div>}
        </>
      )}
      <p style={{ marginTop: '1.25rem', color: '#999' }}><strong>Note:</strong> This page is not access-controlled by the editor. Please wire it to your admin auth flow (middleware) to restrict access.</p>
    </div>
  );
}
