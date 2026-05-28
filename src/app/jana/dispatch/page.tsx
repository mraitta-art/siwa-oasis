'use client';

import React, { useState, useEffect } from 'react';

export default function DispatcherPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For dispatching
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [targetType, setTargetType] = useState('');
  const [targetVendor, setTargetVendor] = useState('');
  const [revealContact, setRevealContact] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch('/api/journeys?admin=true');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.journeys || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleDispatch(id: number) {
    setDispatching(true);
    try {
      const res = await fetch(`/api/journeys/${id}/dispatch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distribution_status: 'dispatched',
          target_business_type_id: targetType || null,
          target_vendor_id: targetVendor || null,
          reveal_contact: revealContact
        })
      });
      if (res.ok) {
        setSelectedReq(null);
        loadRequests();
      } else {
        alert('Failed to dispatch');
      }
    } catch (e) {
      console.error(e);
      alert('Error dispatching');
    }
    setDispatching(false);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin"></i></div>;

  const pending = requests.filter(r => r.distribution_status === 'admin_review');
  const dispatched = requests.filter(r => r.distribution_status === 'dispatched');

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-route"></i> Marketplace Dispatcher</h3>
      </div>

      <div className="notification-banner">
        <i className="fas fa-info-circle"></i> Review incoming customer requests from the Marketplace and dispatch them to the correct business categories or specific vendors.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
        
        {/* PENDING COLUMN */}
        <div>
          <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem' }}>
            <i className="fas fa-inbox" /> Pending Review ({pending.length})
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pending.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: '12px', color: '#94a3b8' }}>
                No pending requests.
              </div>
            ) : pending.map(req => (
              <div key={req.id} className="card" style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer', transition: 'all 0.2s', transform: selectedReq?.id === req.id ? 'scale(1.02)' : 'none' }} onClick={() => setSelectedReq(req)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>{req.request_type}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>#{req.id}</span>
                </div>
                <div style={{ fontWeight: 700 }}>{req.customer_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.customer_email}</div>
                
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {req.budget && <div><strong>Budget:</strong> {req.budget}</div>}
                  {req.duration && <div><strong>Duration:</strong> {req.duration}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTION / DISPATCH COLUMN */}
        <div>
          {selectedReq ? (
            <div className="card" style={{ borderTop: '4px solid #10b981', position: 'sticky', top: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                Dispatch Request #{selectedReq.id}
              </h4>
              
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.5rem' }}><strong>Type:</strong> {selectedReq.request_type}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong>Customer:</strong> {selectedReq.customer_name}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong>Dates/Details:</strong> {selectedReq.arrival_date} / {selectedReq.special_requests}</div>
                {selectedReq.custom_details && (
                  <pre style={{ background: '#e2e8f0', padding: '0.5rem', borderRadius: '4px', fontSize: '0.7rem', overflowX: 'auto', marginTop: '0.5rem' }}>
                    {selectedReq.custom_details}
                  </pre>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Route to Category (Optional)</label>
                <select className="form-control" value={targetType} onChange={e => setTargetType(e.target.value)}>
                  <option value="">-- All Categories --</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="journey">Journeys & Tours</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="shop">Shops</option>
                </select>
                <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>If set, only vendors in this category will see it.</small>
              </div>

              <div className="form-group">
                <label className="form-label">Route to Specific Vendor (Optional)</label>
                <input type="text" className="form-control" placeholder="Vendor ID..." value={targetVendor} onChange={e => setTargetVendor(e.target.value)} />
                <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>If set, ONLY this specific vendor will see it.</small>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem', background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.8rem', color: '#92400e', cursor: 'pointer' }}>
                  <input type="checkbox" checked={revealContact} onChange={e => setRevealContact(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#d97706' }} />
                  Reveal Customer Contact Data to Vendor?
                </label>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#b45309' }}>
                  If unchecked, the customer's name and email will be hidden. Vendors will only be able to communicate by submitting an official offer through the platform.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, background: '#10b981', border: 'none' }} onClick={() => handleDispatch(selectedReq.id)} disabled={dispatching}>
                  {dispatching ? 'Dispatching...' : 'Approve & Dispatch'}
                </button>
                <button className="btn btn-outline" onClick={() => setSelectedReq(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem' }}>
                <i className="fas fa-paper-plane" /> Dispatched ({dispatched.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dispatched.map(req => (
                  <div key={req.id} className="card" style={{ opacity: 0.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>{req.request_type}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>#{req.id}</span>
                    </div>
                    <div style={{ fontWeight: 700 }}>{req.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                      <strong>Routing:</strong> {req.target_business_type_id || 'All Categories'} {req.target_vendor_id ? `(Vendor: ${req.target_vendor_id})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
