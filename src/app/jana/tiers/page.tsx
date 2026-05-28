'use client';

import React, { useState, useEffect } from 'react';

export default function InteractiveTiersPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [tiersRes, sectionsRes, templatesRes] = await Promise.all([
      fetch('/api/jana/tiers'),
      fetch('/api/jana/sections'),
      fetch('/api/jana/templates'),
    ]);
    
    if (tiersRes.ok) setTiers(await tiersRes.json());
    if (sectionsRes.ok) setSections(await sectionsRes.json());
    if (templatesRes.ok) setTemplates(await templatesRes.json());
    
    setLoading(false);
  }

  function startEdit(tier: any) {
    setEditId(tier.id);
    const features = typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features;
    setEditData({ ...tier, features, default_template_id: tier.default_template_id || '' });
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

  async function seedEssentials() {
    setSeeding(true);
    try {
      const res = await fetch('/api/setup/seed-essentials');
      const data = await res.json();
      if (data.success) {
        alert('✅ Essentials Template Pipeline Complete!\n\n' + data.steps.join('\n'));
        loadData();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    } catch (e) {
      alert('Failed to seed essentials');
    }
    setSeeding(false);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin"></i></div>;

  // Check if Essentials template exists
  const hasEssentials = templates.some((t: any) => t.id === 'essentials_free');
  const freeTier = tiers.find(t => t.id === 'free');
  const freeTierLinked = freeTier?.default_template_id === 'essentials_free';

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-shield-alt"></i> Vendor Tiers Manager</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!hasEssentials && !editId && (
            <button className="btn btn-sm" onClick={seedEssentials} disabled={seeding}
              style={{ background: '#10b981', color: '#fff', border: 'none', fontWeight: 700 }}>
              <i className={`fas ${seeding ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i> Seed Essentials Template
            </button>
          )}
          {!editId && <button className="btn btn-primary btn-sm" onClick={() => startEdit({ id: 'new_tier', name: 'New Tier', price_amount: 0, features: {} })}><i className="fas fa-plus"></i> Create Tier</button>}
        </div>
      </div>

      {/* ── ESSENTIALS STATUS BANNER ── */}
      {!hasEssentials ? (
        <div style={{ 
          padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1rem',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ color: '#d97706', fontSize: '1.25rem' }}></i>
          <div>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.85rem' }}>Essentials Template Not Found</div>
            <div style={{ fontSize: '0.75rem', color: '#a16207' }}>Click "Seed Essentials Template" above to create the free template and auto-link it to the Free tier. This allows free vendors to get a working minisite immediately.</div>
          </div>
        </div>
      ) : (
        <div style={{ 
          padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1rem',
          background: freeTierLinked ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : '#fffbeb',
          border: `1px solid ${freeTierLinked ? '#86efac' : '#fbbf24'}`, 
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <i className={`fas ${freeTierLinked ? 'fa-check-circle' : 'fa-info-circle'}`} style={{ color: freeTierLinked ? '#16a34a' : '#d97706', fontSize: '1.25rem' }}></i>
          <div>
            <div style={{ fontWeight: 800, color: freeTierLinked ? '#166534' : '#92400e', fontSize: '0.85rem' }}>
              {freeTierLinked ? '✅ Essentials Template Active' : '⚠️ Essentials Template exists but not linked to Free tier'}
            </div>
            <div style={{ fontSize: '0.75rem', color: freeTierLinked ? '#15803d' : '#a16207' }}>
              {freeTierLinked 
                ? 'Free vendors will automatically receive the Essentials template on registration.' 
                : 'Edit the Free tier below and set "Essentials" as the default template.'}
            </div>
          </div>
        </div>
      )}

      <div className="notification-banner">
        <i className="fas fa-info-circle"></i> Define the rules and limits for your marketplace levels. Each tier can have a default template that auto-assigns to vendors.
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

                  {/* ── DEFAULT TEMPLATE ASSIGNMENT ── */}
                  <h4 style={{ fontSize: '0.8rem', marginTop: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem', color: '#D4AF37' }}>
                    <i className="fas fa-layer-group" style={{ marginRight: '0.3rem' }}></i> DEFAULT TEMPLATE
                  </h4>
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>Auto-assign to vendors on this tier</label>
                    <select className="form-control" 
                      value={editData.default_template_id || ''}
                      onChange={e => setEditData({...editData, default_template_id: e.target.value || null})}
                      style={{ borderColor: editData.default_template_id ? '#10b981' : '#f59e0b' }}>
                      <option value="">-- No Default (Manual Assignment) --</option>
                      {templates.map((tmpl: any) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          {tmpl.name} {tmpl.level ? `(${tmpl.level})` : ''} {!tmpl.type_id ? '🌐 Universal' : ''}
                        </option>
                      ))}
                    </select>
                    {!editData.default_template_id && (
                      <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600, marginTop: '0.25rem' }}>
                        ⚠️ Without a default template, vendors on this tier must be manually assigned a template.
                      </div>
                    )}
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

                  {/* ── JOURNEY MARKETPLACE PERMISSIONS ── */}
                  <h4 style={{ fontSize: '0.8rem', marginTop: '1.5rem', paddingBottom: '0.25rem', borderBottom: '2px solid #D4AF37', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-route" /> JOURNEY MARKETPLACE
                  </h4>
                  <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '0.5rem 0.75rem', marginTop: '0.25rem', marginBottom: '0.5rem', fontSize: '0.7rem', color: '#92400e', border: '1px solid #fde68a' }}>
                    Control what vendors on this tier can do inside the Journey Marketplace.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
                    {[
                      { key: 'journey_marketplace_access', label: 'Access Journey Marketplace', desc: 'Can see the Journey Requests menu item', color: '#6b7280' },
                      { key: 'journey_view_requests',      label: 'View Customer Journey Requests', desc: 'Can see the list of open journey requests', color: '#3b82f6' },
                      { key: 'journey_submit_offer',       label: 'Submit Formal Offers', desc: 'Can send a structured offer to customers', color: '#8b5cf6' },
                      { key: 'journey_contact_email',      label: 'Contact via Email', desc: 'Email address revealed in offers', color: '#8b5cf6' },
                      { key: 'journey_contact_phone',      label: 'Contact via Phone', desc: 'Phone number revealed in offers', color: '#D4AF37' },
                      { key: 'journey_contact_whatsapp',   label: 'Contact via WhatsApp', desc: 'WhatsApp link visible to customers', color: '#25D366' },
                    ].map(({ key, label, desc, color }) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.75rem', cursor: 'pointer', padding: '0.5rem 0.6rem', borderRadius: '8px', background: (editData.features[key] ? '#f0fdf4' : '#f8fafc'), border: `1px solid ${editData.features[key] ? '#86efac' : '#e2e8f0'}`, transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          style={{ marginTop: '1px', accentColor: color }}
                          checked={editData.features[key] || false}
                          onChange={e => setEditData({ ...editData, features: { ...editData.features, [key]: e.target.checked } })}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                            {label}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: '0.1rem' }}>{desc}</div>
                        </div>
                      </label>
                    ))}
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

                  {/* ── DEFAULT TEMPLATE BADGE ── */}
                  <div style={{ 
                    marginBottom: '1rem', padding: '0.5rem 0.75rem', borderRadius: '8px',
                    background: t.default_template_id ? '#f0fdf4' : '#fef9c3',
                    border: `1px solid ${t.default_template_id ? '#86efac' : '#fde68a'}`,
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <i className={`fas ${t.default_template_id ? 'fa-layer-group' : 'fa-exclamation-circle'}`} 
                       style={{ color: t.default_template_id ? '#16a34a' : '#d97706', fontSize: '0.85rem' }}></i>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>Default Template</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: t.default_template_id ? '#166534' : '#92400e' }}>
                        {t.default_template_name || (t.default_template_id ? t.default_template_id : 'Not Set')}
                      </div>
                    </div>
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

                  {/* ── JOURNEY MARKETPLACE SUMMARY ── */}
                  <div style={{ marginTop: '1rem', borderTop: '1px dashed #eee', paddingTop: '1rem' }}>
                    <h5 style={{ fontSize: '0.65rem', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <i className="fas fa-route" /> Journey Marketplace
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {[
                        { key: 'journey_marketplace_access', label: 'Access',    icon: 'fa-eye' },
                        { key: 'journey_view_requests',      label: 'View',      icon: 'fa-list' },
                        { key: 'journey_submit_offer',       label: 'Offer',     icon: 'fa-file-invoice' },
                        { key: 'journey_contact_email',      label: 'Email',     icon: 'fa-envelope' },
                        { key: 'journey_contact_phone',      label: 'Phone',     icon: 'fa-phone' },
                        { key: 'journey_contact_whatsapp',   label: 'WhatsApp',  icon: 'fab fa-whatsapp' },
                      ].map(({ key, label, icon }) => (
                        <span key={key} style={{
                          fontSize: '0.62rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700,
                          background: features[key] ? '#dcfce7' : '#f1f5f9',
                          color: features[key] ? '#166534' : '#94a3b8',
                          border: `1px solid ${features[key] ? '#86efac' : '#e2e8f0'}`,
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        }}>
                          <i className={`fas ${icon}`} style={{ fontSize: '0.55rem' }} />{label} {features[key] ? '✓' : '✗'}
                        </span>
                      ))}
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
