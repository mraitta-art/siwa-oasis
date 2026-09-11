'use client';

import React, { useState, useEffect } from 'react';

export default function ModerationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/businesses');
      const all = await res.json();
      const queue = all.filter((b: any) => {
        const status = String(b.status || '').toLowerCase();
        const published = Number(b.published ?? 0);
        return status === 'pending' || status === 'rejected' || (status === 'active' && published === 0);
      });
      setItems(queue);
    } catch (error) {
      console.error('Failed to load moderation queue', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  async function updateDecision(id: string, decision: 'approved' | 'published' | 'rejected' | 'hidden' | 'pending', notes = '') {
    const res = await fetch('/api/jana/google-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', businessId: id, decision, notes })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Unable to update approval state.');
      return;
    }

    setItems(prev => prev.filter(i => i.id !== id));
    alert(`${decision === 'published' ? 'Published' : decision === 'rejected' ? 'Rejected' : decision === 'hidden' ? 'Hidden from public' : 'Approved'} successfully.`);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin"></i></div>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-check-circle"></i> Admin Approval Queue</h3>
        <span className="badge badge-warning">{items.length} pending tasks</span>
      </div>

      <div className="notification-banner">
        <i className="fas fa-search-shield"></i> Only the admin can approve, reject, or publish a source import. Public and vendor-facing pages never receive hidden or pending records.
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#9ca3af' }}>
          <i className="fas fa-coffee" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}></i>
          Queue is empty. All imports are approved, rejected, or hidden from public publication.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td>{item.type_name || item.type_id}</td>
                <td>
                  <span className={`badge ${item.status === 'pending' ? 'badge-warning' : item.status === 'rejected' ? 'badge-danger' : 'badge-info'}`}>
                    {(item.status || 'pending').toUpperCase()}
                  </span>
                </td>
                <td>{item.custom_data?.source_provenance?.source_url || 'Imported by admin'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-xs btn-success" onClick={() => updateDecision(item.id, 'approved')}>Approve</button>
                    <button className="btn btn-xs btn-primary" onClick={() => updateDecision(item.id, 'published')}>Publish</button>
                    <button className="btn btn-xs btn-outline" onClick={() => updateDecision(item.id, 'hidden')}>Hide</button>
                    <button className="btn btn-xs btn-danger" onClick={() => updateDecision(item.id, 'rejected')}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
