'use client';

import React, { useState, useEffect } from 'react';
import MasterCard from './MasterCard';

export default function VibeSearch({ engineId }: { engineId?: string }) {
  const [availableVibes, setAvailableVibes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Dynamic Config
  useEffect(() => {
    async function loadConfig() {
      const url = engineId ? `/api/discovery/vibe-config?engineId=${engineId}` : '/api/discovery/vibe-config';
      const res = await fetch(url);
      const data = await res.json();
      if (data.options) setAvailableVibes(data.options);
      setLoading(false);
    }
    loadConfig();
  }, [engineId]);

  // 2. Trigger Search when tags change
  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      const res = await fetch('/api/discovery/vibe-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: selectedTags, engineId })
      });
      const data = await res.json();
      setResults(data);
      setLoading(false);
    }
    performSearch();
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="vibe-search-container" style={{ margin: '4rem 0' }}>
      
      {/* Dynamic Vibe Selection UI */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>
          What is your Siwa Story today?
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px', margin: '0 auto' }}>
          {availableVibes.map(vibe => {
            const isActive = selectedTags.includes(vibe);
            return (
              <button
                key={vibe}
                onClick={() => toggleTag(vibe)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '100px',
                  border: isActive ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                  background: isActive ? 'rgba(212, 175, 55, 0.1)' : '#fff',
                  color: isActive ? '#D4AF37' : '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 10px 20px -5px rgba(212, 175, 55, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-circle-notch'}`} style={{ fontSize: '0.7rem' }}></i>
                {vibe.toUpperCase()}
              </button>
            );
          })}
        </div>
        {selectedTags.length > 0 && (
          <button 
            onClick={() => setSelectedTags([])}
            style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '1px' }}
          >
            <i className="fas fa-times-circle" style={{ marginRight: '0.5rem' }}></i> RESET SELECTION
          </button>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37' }}></i>
          <div style={{ marginTop: '1rem', fontWeight: 800, fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '2px' }}>CURATING EXPERIENCES...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {results.length > 0 ? (
            results.map(biz => {
              const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
              // Dynamically hunt for the best image
              const sectionValues = Object.values(data || {}) as any[];
              const image = data?.business_logo || data?.logo || sectionValues.find(s => s?.section_gallery)?.[0]?.url || 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&q=80&w=1200';
              
              // 1. Extract dynamic hint/teaser from custom_data
              let hint = '';
              if (data) {
                const basic = data.basic || {};
                hint = basic.description || basic.summary || basic.about || '';
                
                if (!hint) {
                  for (const section of Object.values(data)) {
                    if (section && typeof section === 'object') {
                      const text = (section as any).mini_blog || (section as any).description || (section as any).about || (section as any).summary;
                      if (text && typeof text === 'string') {
                        hint = text.replace(/<[^>]*>/g, '');
                        break;
                      }
                    }
                  }
                }
              }
              if (!hint) {
                hint = `Explore authentic ${biz.type_name.toLowerCase()} experiences in the historical heart of Siwa Oasis.`;
              }
              if (hint.length > 110) {
                hint = hint.slice(0, 110) + '...';
              }

              // 2. Build premium category and governance badges
              let badge = biz.type_name || '';
              if (biz.is_featured) badge = `⭐ FEATURED • ${badge}`;
              else if (biz.is_recommended) badge = `🏆 RECOMMENDED • ${badge}`;
              else if (biz.is_trusted) badge = `🛡️ VERIFIED • ${badge}`;
              
              return (
                <MasterCard
                  key={biz.id}
                  title={biz.name}
                  description={hint}
                  image={image}
                  tag={badge}
                  onCardClick={() => window.location.href = `/business/${biz.id}`}
                  links={[
                    { label: 'Explore Journey', icon: 'fa-arrow-right', onClick: () => window.location.href = `/business/${biz.id}` }
                  ]}
                />
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
              <i className="fas fa-search fa-3x" style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}></i>
              <h3 style={{ color: '#1e293b' }}>No direct matches for this specific combination.</h3>
              <p style={{ color: '#64748b' }}>Try broadening your search or selecting a single vibe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
