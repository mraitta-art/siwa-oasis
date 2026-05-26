'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';
import { useAdmin } from '@/context/AdminContext';

interface Business {
  id: string; name: string; slug: string; type_id: string; type_name: string; type_icon: string;
  type_icon_color: string; status: string; subscription_tier: string; vendor_email: string | null;
  vendor_id: string | null; approved_by_vendor: boolean; views: number; template_name?: string;
}

export default function BusinessRegistryPage() {
  const { notify } = useAdmin();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard Registry State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [types, setTypes] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  
  const [newBiz, setNewBiz] = useState({
    name: '',
    type_id: '',
    subscription_tier: 'free',
    vendor_id: '',
    template_id: '',
    custom_data: {} as Record<string, any>
  });
  
  const [schemaFields, setSchemaFields] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => { 
    loadBusinesses(); 
    fetchMetadata();
  }, []);

  async function bulkAction(updates: any) {
    if (selectedIds.length === 0) return;
    setIsSyncing(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch('/api/jana/businesses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates })
        })
      ));
      notify(`Updated ${selectedIds.length} entities`, 'success');
      setSelectedIds([]);
      loadBusinesses();
    } catch (e) {
      notify('Bulk action failed', 'error');
    }
    setIsSyncing(false);
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} businesses?`)) return;
    setIsSyncing(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`/api/jana/businesses?id=${id}`, { method: 'DELETE' })
      ));
      notify('Bulk deletion complete', 'success');
      setSelectedIds([]);
      loadBusinesses();
    } catch (e) { notify('Deletion failed', 'error'); }
    setIsSyncing(false);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === businesses.length ? [] : businesses.map(b => b.id));
  };

  async function loadBusinesses() {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/businesses');
      if (res.ok) setBusinesses(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchMetadata() {
    try {
      const [tRes, sRes, vRes, tmplRes] = await Promise.all([
        fetch('/api/jana/types'),
        fetch('/api/jana/tiers'),
        fetch('/api/jana/vendors'),
        fetch('/api/jana/templates'),
      ]);
      if (tRes.ok) setTypes(await tRes.json());
      if (sRes.ok) setTiers(await sRes.json());
      if (vRes.ok) setVendors(await vRes.json());
      if (tmplRes.ok) setTemplates(await tmplRes.json());
    } catch (e) { console.error(e); }
  }

  // Fetch sections and fields for the selected type
  async function loadTypeSchema(typeId: string) {
    setIsSyncing(true);
    setSchemaFields([]);
    try {
      // For the simplified registry, we'll fetch all 'basic' and 'location' fields
      const res = await fetch(`/api/jana/forms?type=${typeId}`);
      if (res.ok) {
        setSchemaFields(await res.json());
      }
    } catch (e) { console.error(e); }
    setIsSyncing(false);
  }

  async function deleteBiz(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/jana/businesses?id=${id}`, { method: 'DELETE' });
    loadBusinesses();
  }

  const handleFieldChange = (name: string, value: any) => {
    setNewBiz(prev => ({
      ...prev,
      custom_data: { ...prev.custom_data, [name]: value }
    }));
  };

  async function submitRegistration() {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBiz),
      });
      if (res.ok) {
        const newBusiness = await res.json();
        // Redirect immediately to the DNA Editor (Data Feed) page
        window.location.href = `/jana/businesses/${newBusiness.id}/edit`;
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register business');
      }
    } catch (e) { console.error(e); }
    setIsSyncing(false);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i></div>;

  return (
    <div className="animate-in">
      <div className="card-header">
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}><i className="fas fa-building"></i> Business Registry</h3>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Register and manage governed business entities.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowWizard(!showWizard)}>
          <i className={`fas ${showWizard ? 'fa-times' : 'fa-plus'}`}></i> {showWizard ? 'CANCEL' : 'REGISTER BUSINESS'}
        </button>
      </div>

      {/* ── INLINE QUICK-REGISTER PANEL ── */}
      {showWizard && (
        <div style={{ background: '#fffbeb', border: '2px solid #D4AF37', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#92400e' }}><i className="fas fa-magic"></i> Register New Business Entity</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>BUSINESS NAME *</label>
              <input className="form-control" placeholder="e.g. Great Sand Sea Expedition"
                value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} />
            </div>
            {/* Business Type */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>BUSINESS TYPE *</label>
              <select className="form-control" value={newBiz.type_id}
                onChange={e => {
                  const tid = e.target.value;
                  setNewBiz({...newBiz, type_id: tid, template_id: ''});
                  // Show all templates: type-specific + universal (type_id = null)
                  setFilteredTemplates(templates.filter((t: any) => t.type_id === tid || !t.type_id));
                }}>
                <option value="">-- Select Type --</option>
                {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {/* Template — auto-resolves from tier when not set */}
            <div>
              {(() => {
                const selectedTier = tiers.find((t: any) => t.id === newBiz.subscription_tier);
                const tierHasDefault = selectedTier?.default_template_id;
                const tierDefaultName = selectedTier?.default_template_name || selectedTier?.default_template_id;
                return (
                  <>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: tierHasDefault ? '#6b7280' : '#ef4444', display: 'block', marginBottom: '0.3rem' }}>
                      TEMPLATE {tierHasDefault ? '(optional — tier has default)' : '* (required)'}
                    </label>
                    <select className="form-control" value={newBiz.template_id}
                      style={{ borderColor: newBiz.template_id ? '#10b981' : tierHasDefault ? '#d97706' : '#ef4444' }}
                      onChange={e => setNewBiz({...newBiz, template_id: e.target.value})}
                      disabled={!newBiz.type_id}>
                      <option value="">
                        {!newBiz.type_id 
                          ? '-- Pick a Type first --'
                          : tierHasDefault
                            ? `Will use: ${tierDefaultName} (from ${selectedTier?.name} tier)`
                            : '-- Select Template --'}
                      </option>
                      {filteredTemplates.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} {!t.type_id ? '🌐 Universal' : ''}</option>
                      ))}
                      {newBiz.type_id && filteredTemplates.length === 0 && !tierHasDefault && <option disabled>No templates available</option>}
                    </select>
                    {tierHasDefault && !newBiz.template_id && (
                      <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
                        ✅ Auto-assigns "{tierDefaultName}" from {selectedTier?.name} tier
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            {/* Tier */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>SUBSCRIPTION TIER</label>
              <select className="form-control" value={newBiz.subscription_tier}
                onChange={e => setNewBiz({...newBiz, subscription_tier: e.target.value})}>
                {tiers.length > 0 ? tiers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>) : (
                  <><option value="free">Free</option><option value="gold">Gold</option></>
                )}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {(() => {
              const selectedTier = tiers.find((t: any) => t.id === newBiz.subscription_tier);
              const tierHasDefault = selectedTier?.default_template_id;
              const canSubmit = !isSyncing && newBiz.name && newBiz.type_id && (newBiz.template_id || tierHasDefault);
              return (
                <>
                  <button className="btn btn-primary" onClick={submitRegistration} disabled={!canSubmit}>
                    {isSyncing ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> REGISTER &amp; PUBLISH</>}
                  </button>
                  {!newBiz.template_id && newBiz.type_id && !tierHasDefault && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                      ⚠️ A template must be assigned, or set a default template on the tier
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" checked={selectedIds.length === businesses.length && businesses.length > 0} onChange={toggleSelectAll} /></th>
              <th>Business Entity</th>
              <th>Typology</th>
              <th>Template</th>
              <th>Status / Tier</th>
              <th>Vendor Link</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(b => (
              <tr key={b.id} style={{ background: selectedIds.includes(b.id) ? '#f8fafc' : 'transparent' }}>
                <td><input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} /></td>
                <td>
                  <div style={{ fontWeight: 800 }}>{b.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>ID: {b.id.slice(0, 8)}...</div>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className={b.type_icon} style={{ color: b.type_icon_color }}></i>
                    {b.type_name}
                  </span>
                </td>
                <td>
                  {b.template_name
                    ? <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#475569' }}><i className="fas fa-layer-group" style={{ marginRight: '4px', color: '#D4AF37' }}></i>{b.template_name}</span>
                    : <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>⚠️ No Template</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span className={`badge badge-${b.status === 'active' ? 'success' : 'warning'}`}>{(b.status || 'inactive').toUpperCase()}</span>
                    <span className="subscription-badge">{(b.subscription_tier || 'free').toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                     <button 
                       onClick={() => {
                         fetch('/api/jana/businesses', { 
                           method: 'PATCH', 
                           headers: {'Content-Type':'application/json'}, 
                           body: JSON.stringify({ id: b.id, is_recommended: !(b as any).is_recommended })
                         }).then(() => loadBusinesses());
                       }}
                       style={{ background: (b as any).is_recommended ? '#dcfce7' : '#f1f5f9', color: (b as any).is_recommended ? '#166534' : '#94a3b8', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer' }}
                     >
                       <i className="fas fa-thumbs-up"></i> REC
                     </button>
                     <button 
                       onClick={() => {
                         fetch('/api/jana/businesses', { 
                           method: 'PATCH', 
                           headers: {'Content-Type':'application/json'}, 
                           body: JSON.stringify({ id: b.id, is_trusted: !(b as any).is_trusted })
                         }).then(() => loadBusinesses());
                       }}
                       style={{ background: (b as any).is_trusted ? '#eff6ff' : '#f1f5f9', color: (b as any).is_trusted ? '#1e40af' : '#94a3b8', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer' }}
                     >
                       <i className="fas fa-check-shield"></i> TRUSTED
                     </button>
                     <button 
                       onClick={() => {
                         fetch('/api/jana/businesses', { 
                           method: 'PATCH', 
                           headers: {'Content-Type':'application/json'}, 
                           body: JSON.stringify({ id: b.id, is_featured: !(b as any).is_featured })
                         }).then(() => loadBusinesses());
                       }}
                       style={{ background: (b as any).is_featured ? '#fffbeb' : '#f1f5f9', color: (b as any).is_featured ? '#92400e' : '#94a3b8', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer' }}
                     >
                       <i className="fas fa-star"></i> FEATURED
                     </button>
                  </div>
                </td>
                <td>
                  {b.vendor_email ? (
                    <div style={{ fontSize: '0.8rem' }}>
                      <i className="fas fa-user-circle" style={{ color: '#6b7280' }}></i> {b.vendor_email}
                      {!b.approved_by_vendor && <span className="badge badge-warning" style={{ fontSize: '0.6rem', display: 'block', width: 'fit-content', marginTop: '0.2rem' }}>PENDING VENDOR</span>}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Managed by System</span>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.views.toLocaleString()} <span style={{ color: '#9ca3af', fontWeight: 400 }}>views</span></div>
                </td>
                <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                       <select 
                         className="btn btn-xs btn-outline" 
                         style={{ color: '#8b5cf6', borderColor: '#8b5cf6', background: 'transparent', cursor: 'pointer', padding: '0.2rem 0.5rem', appearance: 'auto' }}
                         value={b.subscription_tier}
                         onChange={(e) => {
                           const newTier = e.target.value;
                           if (newTier && newTier !== b.subscription_tier) {
                             fetch('/api/jana/businesses', { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: b.id, subscription_tier: newTier })})
                             .then(() => loadBusinesses());
                           }
                         }}
                         title="Change Subscription Tier"
                       >
                         {tiers.length > 0 ? tiers.map(t => (
                           <option key={t.id} value={t.id} style={{color: '#000'}}>{t.name}</option>
                         )) : (
                           <>
                             <option value="free" style={{color: '#000'}}>Free</option>
                             <option value="pro" style={{color: '#000'}}>Pro</option>
                             <option value="gold" style={{color: '#000'}}>Gold</option>
                             <option value="premium" style={{color: '#000'}}>Premium</option>
                           </>
                         )}
                       </select>
                        <Link href={`/${b.slug || b.id}`} target="_blank" className="btn btn-xs btn-outline" style={{ color: '#10b981', borderColor: '#10b981' }} title="View Public Minisite">
                          <i className="fas fa-external-link-alt"></i> VIEW SITE
                        </Link>
                        <Link href={`/jana/curation/${b.id}`} className="btn btn-xs btn-outline gold-border" title="Curate Content">
                          <i className="fas fa-magic"></i> CURATE
                        </Link>
                        <Link href={`/jana/businesses/${b.id}/promote`} className="btn btn-xs btn-outline" style={{ color: '#10b981', borderColor: '#10b981' }} title="Promote to New Template">
                          <i className="fas fa-rocket"></i> PROMOTE
                        </Link>
                        <Link href={`/jana/businesses/${b.id}/orchestrate`} className="btn btn-xs btn-premium" title="Orchestrate Unified DNA">
                          <i className="fas fa-wand-sparkles"></i> ORCHESTRATE
                        </Link>
                       <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => deleteBiz(b.id, b.name)}><i className="fas fa-trash"></i></button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar animate-in" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', border: '1px solid #334155', borderRadius: '50px', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 1000 }}>
           <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 800, borderRight: '1px solid #334155', paddingRight: '1.5rem' }}>
              {selectedIds.length} ENTITIES SELECTED
           </div>
           <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-xs btn-outline" style={{ color: '#22c55e', borderColor: '#22c55e' }} onClick={() => bulkAction({ is_recommended: true })}>
                <i className="fas fa-thumbs-up"></i> RECOMMEND
              </button>
              <button className="btn btn-xs btn-outline" style={{ color: '#3b82f6', borderColor: '#3b82f6' }} onClick={() => bulkAction({ is_trusted: true })}>
                <i className="fas fa-check-shield"></i> TRUST
              </button>
              <button className="btn btn-xs btn-outline" style={{ color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => bulkAction({ is_featured: true })}>
                <i className="fas fa-star"></i> FEATURE
              </button>
              <button className="btn btn-xs btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={bulkDelete}>
                <i className="fas fa-trash"></i> DELETE
              </button>
           </div>
           <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem' }} onClick={() => setSelectedIds([])}>
              <i className="fas fa-times"></i>
           </button>
        </div>
      )}
    </div>
  );
}
