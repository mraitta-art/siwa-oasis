'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

interface Package {
  id: string;
  name: string;
  description: string;
  business_ids: string[];
  pricing: any;
  active: boolean;
  created_at: string;
}

export default function PackagesManager() {
  const { notify } = useAdmin();
  const [packages, setPackages] = useState<Package[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [editingPkg, setEditingPkg] = useState<Partial<Package> | null>(null);
  const [selectedBizes, setSelectedBizes] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [pkgsRes, bizRes] = await Promise.all([
        fetch('/api/jana/packages'),
        fetch('/api/jana/businesses')
      ]);
      
      const pkgs = await pkgsRes.json();
      const bizes = await bizRes.json();
      
      setPackages(pkgs);
      setBusinesses(bizes);
    } catch (err) {
      notify('Failed to load packages', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!editingPkg?.name) return notify('Package name is required', 'error');
    
    setSaving(true);
    try {
      const isNew = !editingPkg.id;
      const method = isNew ? 'POST' : 'PUT';
      const payload = {
        ...editingPkg,
        business_ids: selectedBizes
      };

      const res = await fetch('/api/jana/packages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        notify(`Package ${isNew ? 'created' : 'updated'}!`, 'success');
        setEditingPkg(null);
        setSelectedBizes([]);
        loadData();
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      notify('Error saving package', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/jana/packages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Package deleted', 'success');
        loadData();
      }
    } catch (err) {
      notify('Delete failed', 'error');
    }
  };

  const startEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setSelectedBizes(Array.isArray(pkg.business_ids) ? pkg.business_ids : []);
  };

  if (loading) return <div className="loader-screen">SYNCING MARKETPLACE PACKAGES...</div>;

  return (
    <div className="packages-page">
      <div className="page-header">
        <div className="container">
          <Link href="/jana" className="back-link">← ADMIN DASHBOARD</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <div className="badge-premium">EXPERIENCE ARCHITECT</div>
                <h1 className="title">PACKAGES & OFFERS</h1>
                <p className="subtitle">Curate multi-business journeys and bundle vendor offers into premium experiences.</p>
             </div>
             {!editingPkg && (
               <button className="btn-create" onClick={() => { setEditingPkg({ name: '', description: '', active: true }); setSelectedBizes([]); }}>
                 <i className="fas fa-plus"></i> CREATE NEW PACKAGE
               </button>
             )}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '3rem' }}>
        {editingPkg ? (
          <div className="editor-card card-glass animate-in">
            <h2 className="section-title">{editingPkg.id ? 'Edit Experience' : 'New Experience Package'}</h2>
            
            <div className="grid-editor">
               <div className="form-main">
                  <div className="form-group">
                    <label className="dna-label">PACKAGE NAME</label>
                    <input 
                      className="dna-input" 
                      value={editingPkg.name || ''} 
                      onChange={e => setEditingPkg({...editingPkg, name: e.target.value})} 
                      placeholder="e.g. The Ultimate Siwan Sunset Journey"
                    />
                  </div>
                  <div className="form-group">
                    <label className="dna-label">DESCRIPTION / NARRATIVE</label>
                    <textarea 
                      className="dna-input" 
                      rows={4}
                      value={editingPkg.description || ''} 
                      onChange={e => setEditingPkg({...editingPkg, description: e.target.value})}
                      placeholder="Describe the curated experience..."
                    />
                  </div>
                  
                  <div style={{ marginTop: '2rem' }}>
                     <label className="dna-label">PRICING STRATEGY (JSON)</label>
                     <textarea 
                       className="dna-input" 
                       style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                       value={typeof editingPkg.pricing === 'string' ? editingPkg.pricing : JSON.stringify(editingPkg.pricing || { base: 0 }, null, 2)} 
                       onChange={e => {
                         try { setEditingPkg({...editingPkg, pricing: JSON.parse(e.target.value)}); }
                         catch { setEditingPkg({...editingPkg, pricing: e.target.value}); }
                       }}
                     />
                  </div>
               </div>

               <div className="form-sidebar">
                  <div className="selection-header">
                     <label className="dna-label">BUNDLE BUSINESSES & SELECT OFFERS</label>
                     <span className="count-badge">{selectedBizes.length} SELECTED</span>
                  </div>
                  
                  <div className="biz-selection-list">
                    {businesses.map(b => {
                      const isSelected = selectedBizes.includes(b.id);
                      const customData = typeof b.custom_data === 'string' ? JSON.parse(b.custom_data) : b.custom_data || {};
                      const offers = customData.sec_8_rates_offers || null;
                      
                      return (
                        <div key={b.id} className={`biz-select-card ${isSelected ? 'active' : ''}`} onClick={() => {
                          if (isSelected) setSelectedBizes(selectedBizes.filter(id => id !== b.id));
                          else setSelectedBizes([...selectedBizes, b.id]);
                        }}>
                           <div className="biz-info">
                              <i className={b.type_icon || 'fas fa-store'} style={{ color: b.type_icon_color || '#D4AF37' }}></i>
                              <div>
                                 <div className="biz-name">{b.name}</div>
                                 <div className="biz-type">{b.type_name}</div>
                              </div>
                           </div>
                           
                           {isSelected && offers && (
                             <div className="offers-preview animate-in">
                                <div className="offers-label">VENDOR OFFERS:</div>
                                {offers.active_discounts?.map((d: string, i: number) => (
                                  <div key={i} className="offer-tag">
                                    <i className="fas fa-tag"></i> {d}
                                  </div>
                                ))}
                                {offers.price_standard && <div className="offer-price">{offers.price_standard}</div>}
                             </div>
                           )}
                           
                           <div className="select-indicator">
                              {isSelected ? <i className="fas fa-check-circle"></i> : <i className="far fa-circle"></i>}
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>

            <div className="form-footer">
               <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                  {saving ? 'SYNCHRONIZING...' : 'SAVE PACKAGE DNA'}
               </button>
               <button className="btn-cancel" onClick={() => setEditingPkg(null)}>CANCEL</button>
            </div>
          </div>
        ) : (
          <div className="packages-grid">
            {packages.map(p => (
              <div key={p.id} className="package-card card-glass animate-in">
                 <div className="card-top">
                    <div className="badge-active">{p.active ? 'ACTIVE' : 'DRAFT'}</div>
                    <div className="card-actions">
                       <button onClick={() => startEdit(p)}><i className="fas fa-edit"></i></button>
                       <button onClick={() => handleDelete(p.id)}><i className="fas fa-trash"></i></button>
                    </div>
                 </div>
                 <h3 className="pkg-name">{p.name}</h3>
                 <p className="pkg-desc">{p.description}</p>
                 
                 <div className="pkg-businesses">
                    <div className="label">INCLUDED BUSINESSES:</div>
                    <div className="biz-icons">
                       {Array.isArray(p.business_ids) && p.business_ids.map(bid => {
                         const biz = businesses.find(b => b.id === bid);
                         if (!biz) return null;
                         return (
                           <div key={bid} className="biz-icon-pill" title={biz.name}>
                              <i className={biz.type_icon || 'fas fa-store'}></i>
                              <span>{biz.name}</span>
                           </div>
                         );
                       })}
                    </div>
                 </div>
                 
                 <div className="pkg-footer">
                    <div className="created-at">Created {new Date(p.created_at).toLocaleDateString()}</div>
                    <button className="btn-view" onClick={() => startEdit(p)}>ORCHESTRATE JOURNEY</button>
                 </div>
              </div>
            ))}
            
            {packages.length === 0 && (
              <div className="empty-state">
                 <i className="fas fa-box-open fa-3x"></i>
                 <h3>No experience packages curated yet.</h3>
                 <p>Start curating the best of Siwa into bundled journeys.</p>
                 <button className="btn-create-large" onClick={() => { setEditingPkg({ name: '', description: '', active: true }); setSelectedBizes([]); }}>
                   + INITIALIZE FIRST PACKAGE
                 </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;900&family=Inter:wght@400;600;800&display=swap');

        .packages-page {
          min-height: 100vh;
          background: #090e17;
          color: #fff;
          font-family: 'Inter', sans-serif;
          padding-bottom: 5rem;
        }

        .container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .page-header {
          background: radial-gradient(circle at top right, rgba(212,175,55,0.1), transparent), #0f172a;
          padding: 6rem 0 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .back-link {
          color: #D4AF37;
          text-decoration: none;
          font-weight: 800;
          font-size: 0.8rem;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 1.5rem;
        }

        .badge-premium {
          background: #D4AF37;
          color: #0f172a;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 1rem;
          display: inline-block;
        }

        .title {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          margin: 0;
          letter-spacing: -2px;
          line-height: 1;
        }

        .subtitle {
          margin: 0.5rem 0 0;
          color: #94a3b8;
          font-weight: 500;
        }

        .btn-create {
          background: #D4AF37;
          color: #0f172a;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 900;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);
        }

        .card-glass {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          backdrop-filter: blur(20px);
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2rem;
        }

        .package-card {
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: transform 0.3s;
        }
        
        .package-card:hover {
          transform: translateY(-5px);
          border-color: rgba(212, 175, 55, 0.2);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badge-active {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .card-actions {
          display: flex;
          gap: 1rem;
        }

        .card-actions button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 1rem;
          transition: color 0.3s;
        }

        .card-actions button:hover {
          color: #fff;
        }

        .pkg-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .pkg-desc {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.6;
          height: 3.2em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .pkg-businesses .label {
          font-size: 0.6rem;
          font-weight: 900;
          color: #D4AF37;
          letter-spacing: 1px;
          margin-bottom: 0.75rem;
        }

        .biz-icons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .biz-icon-pill {
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 12px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .pkg-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1.5rem;
        }

        .created-at {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
        }

        .btn-view {
          background: transparent;
          border: 1px solid #D4AF37;
          color: #D4AF37;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.7rem;
          cursor: pointer;
        }

        /* EDITOR STYLES */
        .editor-card {
          padding: 3rem;
        }

        .grid-editor {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 3rem;
        }

        .section-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          margin: 0 0 3rem 0;
          letter-spacing: -1px;
        }

        .dna-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: #D4AF37;
          letter-spacing: 1.5px;
          display: block;
          margin-bottom: 1rem;
          font-family: 'Outfit', sans-serif;
        }

        .dna-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1.2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1rem;
          color: #fff;
          font-weight: 600;
          outline: none;
          transition: all 0.3s;
          font-size: 0.9rem;
        }

        .biz-selection-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 600px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .biz-select-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .biz-select-card.active {
          background: rgba(212, 175, 55, 0.05);
          border-color: #D4AF37;
        }

        .biz-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .biz-info i {
          font-size: 1.2rem;
          width: 1.5rem;
          text-align: center;
        }

        .biz-name {
          font-weight: 800;
          font-size: 0.85rem;
        }

        .biz-type {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .offers-preview {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed rgba(212, 175, 55, 0.2);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .offers-label {
          font-size: 0.55rem;
          font-weight: 900;
          color: #D4AF37;
          letter-spacing: 1px;
        }

        .offer-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .offer-price {
          font-size: 0.75rem;
          font-weight: 900;
          color: #fff;
        }

        .select-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 1.2rem;
          color: #64748b;
        }

        .active .select-indicator {
          color: #D4AF37;
        }

        .form-footer {
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 1.5rem;
        }

        .btn-save {
          background: #D4AF37;
          color: #0f172a;
          border: none;
          padding: 1.25rem 3rem;
          border-radius: 50px;
          font-weight: 900;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 1.25rem 3rem;
          border-radius: 50px;
          font-weight: 800;
          cursor: pointer;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10rem 0;
          color: #475569;
          text-align: center;
        }

        .btn-create-large {
          margin-top: 2rem;
          background: transparent;
          border: 2px dashed #D4AF37;
          color: #D4AF37;
          padding: 1.5rem 3rem;
          border-radius: 20px;
          font-weight: 900;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: all 0.3s;
        }

        .btn-create-large:hover {
          background: rgba(212, 175, 55, 0.05);
          transform: scale(1.05);
        }

        .loader-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #090e17;
          color: #D4AF37;
          font-weight: 900;
          letter-spacing: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
        }

        @media (max-width: 1200px) {
          .grid-editor { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
