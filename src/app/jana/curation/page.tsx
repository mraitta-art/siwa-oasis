'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * 🏛️ CURATION CONTROL CENTER
 * Entry point for managing high-fidelity content curation across all businesses.
 */
export default function CurationDashboard() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/jana/businesses');
        const data = await res.json();
        setBusinesses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load businesses:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.type_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <i className="fas fa-fingerprint fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
       <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>SYNCING CURATION REPOSITORY...</div>
    </div>
  );

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '3rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', color: '#0f172a', letterSpacing: '-1px' }}>
              Curation <span style={{ color: '#D4AF37' }}>Studio</span>
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
              Moderating high-fidelity content, hero carousels, and omnichannel distribution rules.
            </p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input 
              type="text" 
              placeholder="Filter by name or typology..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ 
                padding: '1rem 1rem 1rem 3.5rem', 
                borderRadius: '16px', 
                border: '1px solid #e2e8f0', 
                width: '350px', 
                fontSize: '0.9rem', 
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                outline: 'none',
                transition: 'all 0.3s'
              }} 
            />
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          {[
            { label: 'Total Entities', value: businesses.length, icon: 'fa-building', color: '#1e293b' },
            { label: 'Curation Active', value: businesses.filter(b => b.curation_data).length, icon: 'fa-check-circle', color: '#27ae60' },
            { label: 'Pending Review', value: businesses.filter(b => !b.curation_data).length, icon: 'fa-clock', color: '#f59e0b' },
            { label: 'Premium Tiers', value: businesses.filter(b => ['gold', 'vip'].includes(b.subscription_tier)).length, icon: 'fa-crown', color: '#D4AF37' }
          ].map((stat, i) => (
            <div key={i} style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: `${stat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, fontSize: '1.25rem' }}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>{stat.label.toUpperCase()}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* BUSINESS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(biz => (
            <div key={biz.id} style={{ 
              background: '#fff', 
              borderRadius: '24px', 
              border: '1px solid #e2e8f0', 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '20px', background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#cbd5e1'
                }}>
                  <i className="fas fa-store"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{biz.name}</h3>
                    {biz.curation_data && <i className="fas fa-certificate" style={{ color: '#D4AF37', fontSize: '0.8rem' }} title="Curated"></i>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '0.25rem' }}>
                    {biz.type_name?.toUpperCase()} • <span style={{ color: '#D4AF37' }}>{biz.subscription_tier?.toUpperCase()}</span>
                  </div>
                </div>
                <Link 
                  href={`/jana/curation/${biz.id}`}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '12px', 
                    background: '#0f172a', 
                    color: '#fff', 
                    textDecoration: 'none', 
                    fontSize: '0.75rem', 
                    fontWeight: 900,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  STUDIO
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px' }}>
                 <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>CAROUSEL PHOTOS</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{JSON.parse(biz.curation_data || '{}').approved_slides?.length || 0} Approved</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>OMNICHANNEL</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{Object.keys(JSON.parse(biz.curation_data || '{}').distribution_overrides || {}).length} Overrides</div>
                 </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '8rem 0' }}>
            <i className="fas fa-search-minus fa-4x" style={{ color: '#cbd5e1', marginBottom: '2rem' }}></i>
            <h2 style={{ color: '#0f172a', margin: 0 }}>No entities found.</h2>
            <p style={{ color: '#64748b' }}>Try searching for a different name or typology.</p>
          </div>
        )}

      </div>
    </main>
  );
}
