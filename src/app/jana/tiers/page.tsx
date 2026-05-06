'use client';

import React, { useState, useEffect } from 'react';

export default function InteractiveTiersPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const res2 = await fetch('/api/jana/data-manager/export'); 
    const data = await res2.json();
    setTiers(data.subscription_tiers || []);
    
    const res3 = await fetch('/api/jana/sections');
    const sectionsData = await res3.json();
    setSections(sectionsData);
    
    setLoading(false);
  }

  function startEdit(tier: any) {
    setEditId(tier.id);
    const features = typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features;
    setEditData({ ...tier, features });
  }

  async function save() {
    if (!editData) return;
    
    // Auto-generate an ID for new tiers based on the name
    const payload = { ...editData };
    if (payload.id === 'new_tier') {
      payload.id = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    }

    const res = await fetch('/api/jana/tiers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setEditId(null);
      loadData();
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
                  
                  <h4 style={{ fontSize: '0.8rem', marginTop: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>PREMIUM FEATURES</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editData.features.remove_watermark || false}
                        onChange={e => setEditData({...editData, features: {...editData.features, remove_watermark: e.target.checked}})}
                      />
                      Remove "Siwa Today" Watermark
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editData.features.allow_direct_contact || false}
                        onChange={e => setEditData({...editData, features: {...editData.features, allow_direct_contact: e.target.checked}})}
                      />
                      Allow Direct Contact (Show Phone/Email/WhatsApp)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editData.features.allow_custom_logo || false}
                        onChange={e => setEditData({...editData, features: {...editData.features, allow_custom_logo: e.target.checked}})}
                      />
                      Allow Custom Business Logo in Hero
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editData.features.show_verified_badge || false}
                        onChange={e => setEditData({...editData, features: {...editData.features, show_verified_badge: e.target.checked}})}
                      />
                      Show "SIWA TRUST VERIFIED" Badge
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editData.features.allow_youtube_story || false}
                        onChange={e => setEditData({...editData, features: {...editData.features, allow_youtube_story: e.target.checked}})}
                      />
                      Allow Cinematic YouTube Integration
                    </label>
                  </div>

                  <h4 style={{ fontSize: '0.8rem', marginTop: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>PUBLIC VISIBILITY SECTIONS</h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                    {sections.map(s => (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={(editData.features.allowed_public_sections || []).includes(s.id)}
                          onChange={e => {
                            const current = editData.features.allowed_public_sections || [];
                            const next = e.target.checked ? [...current, s.id] : current.filter((id: string) => id !== s.id);
                            setEditData({...editData, features: {...editData.features, allowed_public_sections: next}});
                          }}
                        />
                        {s.name}
                      </label>
                    ))}
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
                      <span>Watermark</span>
                      <strong>{features.remove_watermark ? 'Removed' : 'Required'}</strong>
                    </div>
                    <div className="permission-item">
                      <span>Direct Contact</span>
                      <strong>{features.allow_direct_contact ? 'Yes' : 'Hidden'}</strong>
                    </div>
                    <div className="permission-item">
                      <span>Custom Logo</span>
                      <strong>{features.allow_custom_logo ? 'Yes' : 'Text Only'}</strong>
                    </div>
                    <div className="permission-item">
                      <span>Verified Badge</span>
                      <strong>{features.show_verified_badge ? 'Yes' : 'No'}</strong>
                    </div>
                    <div className="permission-item">
                      <span>Storage (Dynamic)</span>
                      <strong>{features.maxStorageMB} MB</strong>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1rem', borderTop: '1px dashed #eee', paddingTop: '1rem' }}>
                    <h5 style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Public Sections</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {(features.allowed_public_sections || []).length > 0 ? (
                        features.allowed_public_sections.map((sid: string) => (
                          <span key={sid} style={{ fontSize: '0.6rem', background: '#f1f5f9', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>{sid}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>None selected</span>
                      )}
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
