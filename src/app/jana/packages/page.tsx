'use client';

import React, { useState, useEffect } from 'react';

interface Package {
  id: string;
  name: string;
  description: string;
  business_ids: string[];
  active: boolean;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    Promise.all([
      fetch('/api/jana/businesses').then(r => r.json()),
      // In real app, /api/jana/packages
      Promise.resolve([])
    ]).then(([biz, pkgs]) => {
      setBusinesses(biz);
      setPackages(pkgs);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin"></i></div>;

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-box-open"></i> Experience Packages</h3>
        <button className="btn btn-primary btn-sm"><i className="fas fa-plus"></i> Create Package</button>
      </div>

      <div className="notification-banner">
        <i className="fas fa-gift"></i> Create curated bundles of multiple businesses (e.g., "The Romantic Siwa Weekend" featuring a hotel, a specific restaurant, and a tour).
      </div>

      <div className="grid-2">
        {packages.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', border: '2px dashed #eee', borderRadius: '1rem', gridColumn: '1 / -1' }}>
            <i className="fas fa-box-open" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}></i>
            No experience packages created yet.
          </div>
        )}
      </div>

      <h4 style={{ marginTop: '2rem' }}>Quick Selection for New Package</h4>
      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: '0.5rem', padding: '1rem' }}>
        <div className="permission-matrix">
          {businesses.map(b => (
            <div key={b.id} className="permission-item">
              <input type="checkbox" />
              <span>{b.name} <small>({b.type_name})</small></span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
