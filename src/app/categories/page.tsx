'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

interface BusinessType {
  id: string;
  name: string;
  icon?: string;
  icon_color?: string;
  is_parent?: boolean | number;
  parent_id?: string | null;
  description?: string;
}

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'accommodation': 'accommodations',
  'transportation': 'transportation',
  'food-beverage': 'food-beverage',
  'food': 'food-beverage',
  'restaurant': 'restaurants',
  'activities-tours': 'activities',
  'activity': 'activities',
  'crafts-wellness': 'crafts-wellness',
  'production-trade': 'production-trade',
};

export default function CategoriesPage() {
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [businessCounts, setBusinessCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. Check if an admin visual builder layout is configured for categories
    fetch('/api/jana/website?id=website_categories')
      .then(r => r.ok ? r.json() : [])
      .then(res => {
        const config = Array.isArray(res) ? res[0] : res;
        const layout = [
          ...(config?.header_components || []),
          ...(config?.body_components || []),
          ...(config?.footer_components || []),
        ];
        if (layout.length > 0) {
          setBuilderConfig({ ...config, layout });
        }
      })
      .catch(() => {});

    // 2. Fetch live typologies and live businesses to calculate category counts
    Promise.all([
      fetch('/api/jana/types').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/jana/businesses').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([typesData, businessesData]) => {
      const validTypes = Array.isArray(typesData) ? typesData : [];
      const validBiz = Array.isArray(businessesData) ? businessesData : [];
      
      const counts: Record<string, number> = {};
      validBiz.forEach((b: any) => {
        const tid = b.type_id;
        if (tid) {
          counts[tid] = (counts[tid] || 0) + 1;
        }
      });

      setTypes(validTypes);
      setBusinessCounts(counts);
      setLoading(false);
    });
  }, []);

  // If a builder layout is saved in Site Builder, render dynamic layout
  if (builderConfig) {
    return <DynamicHomepageRenderer layout={builderConfig.layout} settings={builderConfig.site_settings || null} pageId="categories" />;
  }

  // Filter parents and children
  const parents = types.filter(t => t.is_parent || Number(t.is_parent) === 1 || !t.parent_id);
  const filteredParents = parents.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    types.filter(c => c.parent_id === p.id).some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalBusinesses = Object.values(businessCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <Link href="/" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 900, letterSpacing: '2px', fontSize: '1.1rem' }}>
            SIWIFY PLATFORM
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Home</Link>
            <Link href="/search" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Discovery</Link>
            <Link href="/journeys" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Journeys</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div style={{ padding: '4rem 1.5rem 2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '1rem' }}>
          OFFICIAL SIWA DIRECTORY
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '-0.5px', color: '#fff' }}>
          Explore by Business Category
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 2rem' }}>
          Discover verified eco-lodges, desert safari operators, traditional gastronomy, artisan workshops, and local trade across the Siwa Oasis ecosystem.
        </p>

        {/* Search Filter Bar */}
        <div style={{ maxWidth: '500px', margin: '0 auto 2.5rem', position: 'relative' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search categories or services..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.9rem 1rem 0.9rem 2.8rem',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              backdropFilter: 'blur(8px)',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: 700 }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem', color: '#D4AF37' }} /> Loading official categories...
          </div>
        ) : filteredParents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>No matching categories found for &quot;{searchQuery}&quot;.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filteredParents.map(parent => {
              const children = types.filter(t => t.parent_id === parent.id);
              const parentCount = children.reduce((acc, c) => acc + (businessCounts[c.id] || 0), businessCounts[parent.id] || 0);
              const routeSlug = CATEGORY_SLUG_MAP[parent.id] || parent.id.replace(/_/g, '-');
              const targetUrl = `/${routeSlug}`;

              return (
                <div
                  key={parent.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: parent.icon_color || '#D4AF37' }} />
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: '14px',
                        background: `${parent.icon_color || '#D4AF37'}20`,
                        border: `1px solid ${parent.icon_color || '#D4AF37'}40`,
                        color: parent.icon_color || '#D4AF37',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem'
                      }}>
                        <i className={`fas ${parent.icon || 'fa-store'}`} />
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {parentCount} {parentCount === 1 ? 'Business' : 'Businesses'}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem' }}>
                      {parent.name}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
                      {parent.description || `Explore verified listings, services, and packages under ${parent.name}.`}
                    </p>

                    {/* Sub-typologies pills */}
                    {children.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                        {children.map(child => (
                          <span
                            key={child.id}
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.04)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}
                          >
                            {child.name} {businessCounts[child.id] ? `(${businessCounts[child.id]})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href={targetUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#f8fafc',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>Browse {parent.name}</span>
                    <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem', color: parent.icon_color || '#D4AF37' }} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Directory Stats */}
        <div style={{ marginTop: '4rem', padding: '2rem', borderRadius: '24px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(212,175,55,0.2)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', marginBottom: '0.25rem' }}>{parents.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Core Sectors</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', marginBottom: '0.25rem' }}>{types.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Sub-Typologies</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', marginBottom: '0.25rem' }}>{totalBusinesses}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Registered Businesses</div>
          </div>
        </div>
      </div>
    </div>
  );
}
