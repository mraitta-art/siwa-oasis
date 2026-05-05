'use client';

import React, { useState, useEffect } from 'react';

export default function UpgradesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    const res = await fetch('/api/jana/upgrades');
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }

  async function approve(requestId: string) {
    if (!confirm('Approve this upgrade and grant higher access?')) return;
    try {
      const res = await fetch('/api/jana/upgrades/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        alert('Upgrade successful! Features are now unlocked for this vendor.');
        loadRequests();
      } else {
        const d = await res.json();
        alert('Error: ' + d.error);
      }
    } catch (e) {
      alert('Network error');
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-clipboard-list"></i> Upgrade Requests</h3>
        <span className="badge badge-info">{requests.length} pending</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Business</th>
            <th>Client Name</th>
            <th>Requested Tier</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r: any) => (
            <tr key={r.id}>
              <td><strong>{r.business_name}</strong></td>
              <td>{r.client_name}</td>
              <td><span className="subscription-badge">{r.requested_tier}</span></td>
              <td><span className="badge badge-warning">{r.status}</span></td>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-xs btn-success" onClick={() => approve(r.id)}>Approve</button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No pending upgrade requests.</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}
