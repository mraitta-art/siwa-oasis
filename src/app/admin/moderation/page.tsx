'use client';

import React, { useState, useEffect } from 'react';

export default function ModerationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In real app, fetch pending edits from businesses table or a specific drafts table
    fetch('/api/admin/businesses')
      .then(res => res.json())
      .then(all => {
        setItems(all.filter((b: any) => b.approved_by_vendor === false && b.vendor_id !== null));
        setLoading(false);
      });
  }, []);

  async function approve(id: string) {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_by_vendor: true, status: 'active' })
    });
    if (res.ok) {
      setItems(items.filter(i => i.id !== id));
      alert('Business approved and live!');
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin"></i></div>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-check-circle"></i> Verification Queue</h3>
        <span className="badge badge-warning">{items.length} pending tasks</span>
      </div>

      <div className="notification-banner">
        <i className="fas fa-search-shield"></i> Review and approve business listings created by vendors before they go public on the marketplace.
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#9ca3af' }}>
          <i className="fas fa-coffee" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}></i>
          Queue is empty. All listings are verified and active.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Type</th>
              <th>Vendor</th>
              <th>Date Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td>{item.type_name}</td>
                <td>{item.vendor_email}</td>
                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-xs btn-success" onClick={() => approve(item.id)}>Approve</button>
                    <button className="btn btn-xs btn-outline">Review Details</button>
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
