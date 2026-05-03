'use client';

import React, { useState } from 'react';
import { blogPresets, BlogPost } from '@/lib/blog-integration';

type PresetKey = keyof typeof blogPresets;

export default function BlogIntegrationTool() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('miniSiteStandard');
  const [postCount, setPostCount] = useState(6);
  const [title, setTitle] = useState('Latest Blog Posts');
  const [subtitle, setSubtitle] = useState('Stay updated with our latest news');
  const [loadFromAPI, setLoadFromAPI] = useState(true);
  const [copied, setCopied] = useState(false);

  const presetKeys = Object.keys(blogPresets) as PresetKey[];

  const preset = blogPresets[selectedPreset];

  const generateCode = () => {
    if (loadFromAPI) {
      return `import { EasyBlogSection } from '@/lib/blog-integration';

// Add this to your page component:
<EasyBlogSection 
  preset="${selectedPreset}" 
  loadFromAPI={true}
  postCount={${postCount}}
  title="${title}"
  subtitle="${subtitle}"
/>`;
    } else {
      return `import { EasyBlogSection } from '@/lib/blog-integration';

// Define your posts
const posts = [
  {
    id: 1,
    title: 'Your First Post',
    excerpt: 'Post excerpt here...',
    featured_image: '/image1.jpg',
    category_name: 'Category',
    created_at: '2024-01-15'
  },
  // Add more posts...
];

// Add this to your page component:
<EasyBlogSection 
  preset="${selectedPreset}" 
  posts={posts}
  postCount={${postCount}}
  title="${title}"
  subtitle="${subtitle}"
/>`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 8px 20px rgba(59,130,246,0.4)'
            }}>
              🔌
            </div>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.25rem', margin: 0 }}>
                Blog Integration Tool
              </h1>
              <p style={{ opacity: 0.85, fontSize: '1rem', margin: 0 }}>
                Configure and generate blog sections for any page
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Configuration Panel */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>
              ⚙️ Configuration
            </h2>

            {/* Preset Selection */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
                1. Choose Layout Preset
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {presetKeys.map(presetKey => {
                  const p = blogPresets[presetKey];
                  return (
                    <button
                      key={presetKey}
                      onClick={() => setSelectedPreset(presetKey)}
                      style={{
                        padding: '1rem',
                        background: selectedPreset === presetKey
                          ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
                          : '#f8fafc',
                        color: selectedPreset === presetKey ? '#fff' : '#64748b',
                        border: selectedPreset === presetKey ? 'none' : '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ marginBottom: '0.25rem' }}>
                        {presetKey.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        fontWeight: 500
                      }}>
                        {p.layout} • {p.columns} cols
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post Count */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
                2. Number of Posts: {postCount}
              </label>
              <input
                type="range"
                min="1"
                max="12"
                value={postCount}
                onChange={(e) => setPostCount(parseInt(e.target.value))}
                style={{ width: '100%', height: '8px', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                <span>1</span>
                <span>6</span>
                <span>12</span>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
                3. Section Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="Enter title..."
              />
            </div>

            {/* Subtitle */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
                4. Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="Enter subtitle..."
              />
            </div>

            {/* Data Source */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
                5. Data Source
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setLoadFromAPI(true)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: loadFromAPI
                      ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                      : '#f8fafc',
                    color: loadFromAPI ? '#fff' : '#64748b',
                    border: loadFromAPI ? 'none' : '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📡 Load from API
                </button>
                <button
                  onClick={() => setLoadFromAPI(false)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: !loadFromAPI
                      ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                      : '#f8fafc',
                    color: !loadFromAPI ? '#fff' : '#64748b',
                    border: !loadFromAPI ? 'none' : '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📝 Manual Posts
                </button>
              </div>
            </div>

            {/* Copy Code Button */}
            <button
              onClick={copyToClipboard}
              style={{
                width: '100%',
                padding: '1rem',
                background: copied
                  ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(59,130,246,0.3)'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Code to Clipboard'}
            </button>
          </div>

          {/* Preview & Code Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Generated Code */}
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '2rem',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
                💻 Generated Code
              </h3>
              <pre style={{
                background: '#1e293b',
                padding: '1.5rem',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                maxHeight: '400px'
              }}>
                {generateCode()}
              </pre>
            </div>

            {/* Preset Details */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                📊 Current Preset Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Layout</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{preset.layout}</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Columns</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{preset.columns}</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Card Style</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{preset.cardStyle}</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Show Image</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{preset.showImage ? '✓ Yes' : '✗ No'}</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Show Author</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{preset.showAuthor ? '✓ Yes' : '✗ No'}</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Show Date</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{preset.showDate ? '✓ Yes' : '✗ No'}</div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#dbeafe', borderRadius: '8px', border: '2px solid #3b82f6' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem' }}>
                  💡 Best For:
                </div>
                <div style={{ color: '#1e40af', fontSize: '0.9rem' }}>
                  {selectedPreset === 'formHelp' && 'Forms, help sections, and resource pages'}
                  {selectedPreset === 'miniSiteStandard' && 'Mini-sites and general blog pages'}
                  {selectedPreset === 'landingFeatured' && 'Landing pages and hero sections'}
                  {selectedPreset === 'compactGrid' && 'Sidebars, footers, and compact spaces'}
                  {selectedPreset === 'minimalText' && 'Clean, text-focused layouts'}
                  {selectedPreset === 'magazineStyle' && 'Professional magazine-style websites'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          marginTop: '2rem',
          padding: '2rem',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
            🔗 Quick Links
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="/demo/blog-layouts"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f8fafc',
                color: '#3b82f6',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                border: '2px solid #3b82f6'
              }}
            >
              🎨 View Live Demo
            </a>
            <a
              href="/BLOG_INTEGRATION_GUIDE.md"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f8fafc',
                color: '#10b981',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                border: '2px solid #10b981'
              }}
            >
              📖 Read Documentation
            </a>
            <a
              href="/admin/blog"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f8fafc',
                color: '#f59e0b',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                border: '2px solid #f59e0b'
              }}
            >
              📝 Manage Blog Posts
            </a>
            <a
              href="/admin/blog-layout-builder"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f8fafc',
                color: '#8b5cf6',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                border: '2px solid #8b5cf6'
              }}
            >
              🛠️ Visual Layout Builder
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
