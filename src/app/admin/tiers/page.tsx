'use client';

import React, { useState, useEffect } from 'react';

export default function InteractiveTiersPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => { loadTiers(); }, []);

  async function loadTiers() {
    setLoading(true);
    const res = await fetch('/api/admin/upgrades'); // We use this or a general tiers fetch
    // Actually using a direct query or new api/admin/tiers
    const res2 = await fetch('/api/admin/data-manager/export'); 
    const data = await res2.json();
    setTiers(data.subscription_tiers || []);
    setLoading(false);
  }

  function startEdit(tier: any) {
    setEditId(tier.id);
    const features = typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features;
    setEditData({ ...tier, features });
  }

  async function save() {
    if (!editData) return;
    const res = await fetch('/api/admin/tiers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    if (res.ok) {
      setEditId(null);
      loadTiers();
      alert('Policy updated platform-wide!');
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin"></i></div>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-shield-alt"></i> Dynamic Policy & Tier Manager</h3>
        {!editId && <button className="btn btn-primary btn-sm" onClick={() => startEdit({ id: 'new_tier', name: 'New Tier', price_amount: 0, features: {} })}><i className="fas fa-plus"></i> Create Tier</button>}
      </div>

      <div className="notification-banner">
        <i className="fas fa-info-circle"></i> Define the rules and limits for your marketplace levels. Changes here are enforced strictly across the platform.
      </div>

      <div className="grid-3">
        {tiers.map(t => {
          const features = typeof t.features === 'string' ? JSON.parse(t.features) : t.features;
          const isEditing = editId === t.id;

          return (
            <div key={t.id} className="card" style={{ borderTop: `4px solid #D4AF37`, position: 'relative' }}>
              {isEditing ? (
                <div className="animate-in">
                  <div className="form-group">
                    <label className="form-label">Tier Name</label>
                    <input type="text" className="form-control" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Price</label>
                      <input type="number" className="form-control" value={editData.price_amount} onChange={e => setEditData({...editData, price_amount: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Period</label>
                      <select className="form-control" value={editData.price_period} onChange={e => setEditData({...editData, price_period: e.target.value})}>
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                        <option value="once">One-time</option>
                      </select>
                    </div>
                  </div>
                  
                  <h4 style={{ fontSize: '0.8rem', marginTop: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>RESOURCE LIMITS</h4>
                  <div className="grid-2" style={{ gap: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Businesses</label>
                      <input type="number" className="form-control btn-xs" value={editData.features.maxBusinesses} onChange={e => setEditData({...editData, features: {...editData.features, maxBusinesses: parseInt(e.target.value)}})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Slides</label>
                        <input type="number" className="form-control btn-xs" value={editData.features.maxSlides} onChange={e => setEditData({...editData, features: {...editData.features, maxSlides: parseInt(e.target.value)}})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Storage (MB)</label>
                        <input type="number" className="form-control btn-xs" value={editData.features.maxStorageMB} onChange={e => setEditData({...editData, features: {...editData.features, maxStorageMB: parseInt(e.target.value)}})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Blocks</label>
                        <input type="number" className="form-control btn-xs" value={editData.features.maxCustomBlocks} onChange={e => setEditData({...editData, features: {...editData.features, maxCustomBlocks: parseInt(e.target.value)}})} />
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={save}>Save Changes</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>{t.name}</h3>
                    <button className="btn btn-xs btn-outline" onClick={() => startEdit(t)}><i className="fas fa-cog"></i></button>
                  </div>
                  <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#D4AF37' }}>${t.price_amount}</span>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>/{t.price_period}</span>
                  </div>
                  <div className="permission-matrix" style={{ fontSize: '0.75rem' }}>
                    <div className="permission-item">
                      <span>Max Businesses</span>
                      <strong>{features.maxBusinesses}</strong>
                    </div>
                    <div className="permission-item">
                      <span>Media Gallery</span>
                      <strong>{features.maxImages} imgs</strong>
                    </div>
                    <div className="permission-item">
                      <span>Carousels</span>
                      <strong>{features.maxSlides} slides</strong>
                    </div>
                    <div className="permission-item">
                      <span>Storage (Dynamic)</span>
                      <strong>{features.maxStorageMB} MB</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
