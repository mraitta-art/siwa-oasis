'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Package {
  id: string;
  package_name: string;
  package_type: 'bundle' | 'tier' | 'service_package' | 'combo';
  base_price: number;
  package_price: number;
  savings_percentage: number;
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  quantity_sold: number;
  quantity_available: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  valid_until: string;
}

const PKG_CSS = `
  .vp-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
  }
  .vp-card {
    background: #ffffff; border: 1px solid #eef0f5; border-radius: 22px;
    padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .vp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
  .vp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }

  .vp-badge {
    font-size: 0.58rem; font-weight: 900; padding: 3px 9px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;
  }
  .vp-badge.active { background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
  .vp-badge.draft { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
  .vp-badge.featured { background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3); }

  .vp-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.6);
    backdrop-filter: blur(4px); z-index: 500;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .vp-modal {
    background: #fff; border-radius: 24px; padding: 2rem;
    max-width: 520px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  }
`;

export default function VendorPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([
    {
      id: '1',
      package_name: 'Desert Experience & Sunset Dinner Package',
      package_type: 'service_package',
      base_price: 180,
      package_price: 140,
      savings_percentage: 22,
      status: 'active',
      is_featured: true,
      quantity_sold: 14,
      quantity_available: 50,
      approval_status: 'approved',
      valid_until: '2026-12-31',
    },
    {
      id: '2',
      package_name: 'Siwa Salt Lake Thermal Spa Day Pass',
      package_type: 'bundle',
      base_price: 90,
      package_price: 70,
      savings_percentage: 22,
      status: 'active',
      is_featured: false,
      quantity_sold: 26,
      quantity_available: 100,
      approval_status: 'approved',
      valid_until: '2026-10-15',
    },
  ]);

  const [slug, setSlug] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('');

  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then(d => { if (d?.business) setSlug(d.business.slug || d.business.id || ''); })
      .catch(() => {});
  }, []);

  const filtered = packages.filter(p => filterStatus === 'all' || p.status === filterStatus);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newPkgName || !newPkgPrice) return;
    const base = Number(newBasePrice) || Number(newPkgPrice);
    const price = Number(newPkgPrice);
    const savings = base > price ? Math.round(((base - price) / base) * 100) : 0;

    const created: Package = {
      id: Date.now().toString(),
      package_name: newPkgName,
      package_type: 'service_package',
      base_price: base,
      package_price: price,
      savings_percentage: savings,
      status: 'active',
      is_featured: false,
      quantity_sold: 0,
      quantity_available: 20,
      approval_status: 'approved',
      valid_until: '2026-12-31',
    };
    setPackages([created, ...packages]);
    setShowModal(false);
    setNewPkgName(''); setNewPkgPrice(''); setNewBasePrice('');
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PKG_CSS }} />
      <div className="vp-root">

        {/* Top Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
              📦 My Packages & Deals
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
              Create promotional experience packages and bundled offers for travelers
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {slug && (
              <Link href={`/${slug}`} target="_blank" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', background: '#fdf8ee', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #fde68a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} /> Preview Minisite
              </Link>
            )}
            <button
              onClick={() => setShowModal(true)}
              style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c842)', color: '#1a1000', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(212,175,55,0.3)' }}
            >
              <i className="fas fa-plus" /> Create Package
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['all', 'active', 'draft'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{ padding: '0.45rem 1.1rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 800, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: filterStatus === st ? '#0f172a' : '#f1f5f9', color: filterStatus === st ? '#fff' : '#64748b', transition: 'all 0.2s' }}
            >
              {st === 'all' ? 'All Packages' : st}
            </button>
          ))}
        </div>

        {/* Package Grid */}
        <div className="vp-grid">
          {filtered.map(pkg => (
            <div key={pkg.id} className="vp-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className={`vp-badge ${pkg.status}`}>{pkg.status}</span>
                {pkg.is_featured && <span className="vp-badge featured">⭐ Featured</span>}
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                {pkg.package_name}
              </h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#D4AF37' }}>${pkg.package_price}</span>
                {pkg.base_price > pkg.package_price && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>${pkg.base_price}</span>
                )}
                {pkg.savings_percentage > 0 && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '6px' }}>
                    Save {pkg.savings_percentage}%
                  </span>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>
                <span>Sold: <strong style={{ color: '#0f172a' }}>{pkg.quantity_sold}</strong></span>
                <span>Valid: <strong style={{ color: '#0f172a' }}>{pkg.valid_until}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="vp-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="vp-modal" onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.25rem' }}>Create New Deal Package</h2>
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Package Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunset Desert Tour & Bedouin Dinner"
                    value={newPkgName}
                    onChange={e => setNewPkgName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Special Price ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="120"
                      value={newPkgPrice}
                      onChange={e => setNewPkgPrice(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Original Price ($)</label>
                    <input
                      type="number"
                      placeholder="150"
                      value={newBasePrice}
                      onChange={e => setNewBasePrice(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', background: '#D4AF37', color: '#1a1000', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                    Save Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
