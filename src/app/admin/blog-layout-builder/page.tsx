'use client';

import React, { useState } from 'react';

interface BlogLayoutConfig {
  columns: number;
  cardStyle: string;
  showImage: boolean;
  showTitle: boolean;
  showExcerpt: boolean;
  showAuthor: boolean;
  showDate: boolean;
  showReadMore: boolean;
  postCount: number;
  gap: number;
}

export default function BlogLayoutBuilder() {
  const [config, setConfig] = useState<BlogLayoutConfig>({
    columns: 3,
    cardStyle: 'basic',
    showImage: true,
    showTitle: true,
    showExcerpt: true,
    showAuthor: false,
    showDate: true,
    showReadMore: true,
    postCount: 6,
    gap: 24
  });

  const [copied, setCopied] = useState(false);

  const samplePosts = Array.from({ length: config.postCount }, (_, i) => ({
    id: i + 1,
    title: `Blog Post ${i + 1}`,
    excerpt: 'This is a sample blog post excerpt that demonstrates the layout...',
    author: 'John Doe',
    date: 'Jan 15, 2024',
    image: 'https://via.placeholder.com/400x250'
  }));

  function updateConfig(field: keyof BlogLayoutConfig, value: any) {
    setConfig(prev => ({ ...prev, [field]: value }));
  }

  function generateCode() {
    return `<BlogGrid
  columns={${config.columns}}
  cardStyle="${config.cardStyle}"
  posts={posts}
  showImage={${config.showImage}}
  showTitle={${config.showTitle}}
  showExcerpt={${config.showExcerpt}}
  showAuthor={${config.showAuthor}}
  showDate={${config.showDate}}
  showReadMore={${config.showReadMore}}
  gap={${config.gap}}
/>`;
  }

  function copyCode() {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              🎨
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                Blog Layout Builder
              </h1>
              <p style={{ fontSize: '1rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
                Design and configure blog grid layouts for any page
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
          {/* Configuration Panel */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Grid Layout */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Grid Layout
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => updateConfig('columns', num)}
                    style={{
                      padding: '1rem',
                      background: config.columns === num ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' : '#f1f5f9',
                      color: config.columns === num ? '#fff' : '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      cursor: 'pointer'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.75rem' }}>
                {config.columns} column{config.columns > 1 ? 's' : ''} per row
              </p>
            </div>

            {/* Card Style */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Card Style
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {[
                  { value: 'basic', label: '📄 Basic Card' },
                  { value: 'featured', label: '⭐ Featured' },
                  { value: 'horizontal', label: '↔️ Horizontal' },
                  { value: 'minimal', label: '✨ Minimal' }
                ].map(style => (
                  <button
                    key={style.value}
                    onClick={() => updateConfig('cardStyle', style.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: config.cardStyle === style.value ? 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)' : '#f1f5f9',
                      color: config.cardStyle === style.value ? '#0f172a' : '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Display Options
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[
                  { key: 'showImage', label: 'Show Image' },
                  { key: 'showTitle', label: 'Show Title' },
                  { key: 'showExcerpt', label: 'Show Excerpt' },
                  { key: 'showAuthor', label: 'Show Author' },
                  { key: 'showDate', label: 'Show Date' },
                  { key: 'showReadMore', label: 'Show Read More' }
                ].map(option => (
                  <label key={option.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config[option.key as keyof BlogLayoutConfig] as boolean}
                      onChange={(e) => updateConfig(option.key as keyof BlogLayoutConfig, e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Post Count & Gap */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Layout Settings
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                    Number of Posts: {config.postCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={config.postCount}
                    onChange={(e) => updateConfig('postCount', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                    aria-label="Number of posts"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                    Gap Between Cards: {config.gap}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    step="4"
                    value={config.gap}
                    onChange={(e) => updateConfig('gap', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                    aria-label="Gap between cards"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <button
                onClick={copyCode}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: copied ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  marginBottom: '0.75rem'
                }}
              >
                {copied ? '✅ Code Copied!' : '📋 Copy Code'}
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                💾 Save as Template
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>
              Live Preview
            </h3>
            
            {/* Preview Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
              gap: `${config.gap}px`
            }}>
              {samplePosts.map(post => (
                <div
                  key={post.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {config.showImage && (
                    <div style={{ height: config.columns === 1 ? '300px' : '180px', background: '#f1f5f9' }}>
                      <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '1.25rem' }}>
                    {config.showTitle && (
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                        {post.title}
                      </h4>
                    )}
                    {(config.showAuthor || config.showDate) && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        {config.showAuthor && <span>{post.author}</span>}
                        {config.showAuthor && config.showDate && <span> · </span>}
                        {config.showDate && <span>{post.date}</span>}
                      </div>
                    )}
                    {config.showExcerpt && (
                      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.5' }}>
                        {post.excerpt}
                      </p>
                    )}
                    {config.showReadMore && (
                      <button style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}>
                        Read More →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Generated Code */}
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Generated Code
              </h4>
              <pre style={{
                background: '#0f172a',
                borderRadius: '12px',
                padding: '1.5rem',
                color: '#e2e8f0',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                overflow: 'auto'
              }}>
                {generateCode()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
