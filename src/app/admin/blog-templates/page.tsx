'use client';

import React, { useState } from 'react';
import blogComponents from '@/lib/blog-components';

export default function BlogTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(blogComponents.map(c => c.category)))];

  const filteredComponents = blogComponents.filter(comp => {
    const matchCategory = selectedCategory === 'all' || comp.category === selectedCategory;
    const matchSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       comp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 10px 24px rgba(59,130,246,0.4)'
              }}>
                📝
              </div>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Blog Templates
                </h1>
                <p style={{ fontSize: '1rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
                  Pre-built blog components and mini-website templates
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{blogComponents.length}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Templates</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{categories.length - 1}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Categories</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>100%</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Responsive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search templates..."
              style={{
                flex: 1,
                minWidth: '250px',
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: selectedCategory === cat ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' : '#f1f5f9',
                    color: selectedCategory === cat ? '#fff' : '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {filteredComponents.map(component => (
            <div
              key={component.id}
              style={{
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                      {component.name}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      {component.description}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                    color: '#0f172a',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}>
                    {component.category}
                  </span>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {component.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Code Preview */}
                <div style={{
                  background: '#0f172a',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: 700
                  }}>
                    HTML/CSS
                  </div>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    color: '#e2e8f0',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {component.code}
                  </pre>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(component.code);
                      alert('✅ Code copied to clipboard!');
                    }}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(59,130,246,0.3)'
                    }}
                  >
                    📋 Copy Code
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(34,197,94,0.3)'
                    }}
                  >
                    👁️ Live Preview
                  </button>
                  <button
                    style={{
                      padding: '1rem 2rem',
                      background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(212,175,55,0.3)'
                    }}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              No Templates Found
            </h3>
            <p style={{ color: '#64748b' }}>
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
