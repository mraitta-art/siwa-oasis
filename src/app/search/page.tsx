'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);

  // Load all businesses on mount as browse-all
  useEffect(() => {
    async function loadAll() {
      try {
        const res = await fetch('/api/discovery/search?q=');
        if (res.ok) {
          const data = await res.json();
          setBusinesses(data.results || []);
        }
      } catch {}
    }
    loadAll();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    setLoading(false);
  };

  const displayItems = results.length > 0 ? results : businesses;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 900, letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i className="fas fa-sun" style={{ color: '#D4AF37' }}></i>
          SIWA.<span style={{ color: '#D4AF37' }}>TODAY</span>
        </Link>
        <Link href="/login" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem' }}>LOGIN</Link>
      </nav>

      {/* Search Header */}
      <div style={{ padding: '4rem 3rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '1rem' }}>
          DISCOVER <span style={{ color: '#D4AF37' }}>SIWA</span>
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Explore the heritage, cuisine, and adventures of the Oasis.</p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search businesses, tours, restaurants..."
            style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #334155', background: '#1e293b', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '1rem 2rem', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#000', fontWeight: 900, cursor: 'pointer' }}
          >
            {loading ? '...' : 'SEARCH'}
          </button>
        </form>
      </div>

      {/* Results */}
      <div style={{ padding: '2rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {displayItems.map((item: any) => (
            <Link key={item.id} href={`/business/${item.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#1e293b', borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155',
                transition: 'all 0.3s', cursor: 'pointer'
              }}>
                <div style={{ height: '160px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-sun" style={{ fontSize: '2rem', color: '#D4AF37', opacity: 0.3 }}></i>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: '0 0 0.5rem 0' }}>{item.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#D4AF37', background: 'rgba(212,175,55,0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                      {(item.type_id || item.type || 'BUSINESS').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{item.subscription_tier || 'free'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {displayItems.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
            <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
            <p style={{ fontWeight: 700 }}>No results found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
