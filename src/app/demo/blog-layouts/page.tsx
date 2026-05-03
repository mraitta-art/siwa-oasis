'use client';

import React, { useState } from 'react';
import { EasyBlogSection, blogPresets, BlogPost } from '@/lib/blog-integration';

// Sample blog posts for demonstration
const samplePosts: BlogPost[] = [
  {
    id: 1,
    title: 'Getting Started with Siwa Oasis Marketplace',
    slug: 'getting-started',
    excerpt: 'Learn how to navigate and use all the features of our marketplace platform. This comprehensive guide covers everything from registration to making your first transaction.',
    featured_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    category_name: 'Tutorial',
    author_name: 'Ahmed Hassan',
    created_at: '2024-01-15T10:00:00Z',
    reading_time: 5,
    views: 1250
  },
  {
    id: 2,
    title: 'Top 10 Business Tips for Siwa Entrepreneurs',
    slug: 'business-tips-siwa',
    excerpt: 'Discover the best strategies for growing your business in the Siwa Oasis region. From marketing to customer service, we cover it all.',
    featured_image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop',
    category_name: 'Business',
    author_name: 'Sara Mohamed',
    created_at: '2024-01-12T14:30:00Z',
    reading_time: 7,
    views: 2340
  },
  {
    id: 3,
    title: 'Understanding Local Market Trends in 2024',
    slug: 'market-trends-2024',
    excerpt: 'An in-depth analysis of the current market trends affecting local businesses and how you can leverage them for growth.',
    featured_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    category_name: 'Analysis',
    author_name: 'Mohamed Ali',
    created_at: '2024-01-10T09:15:00Z',
    reading_time: 8,
    views: 1890
  },
  {
    id: 4,
    title: 'How to Optimize Your Minisite for Better Engagement',
    slug: 'optimize-minisite',
    excerpt: 'Tips and tricks to make your minisite more attractive and engaging for visitors. Learn about design, content, and user experience.',
    featured_image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop',
    category_name: 'Guide',
    author_name: 'Fatma Ibrahim',
    created_at: '2024-01-08T16:45:00Z',
    reading_time: 6,
    views: 1560
  },
  {
    id: 5,
    title: 'Success Stories: Local Businesses Thriving Online',
    slug: 'success-stories',
    excerpt: 'Inspiring stories from local businesses that have successfully transitioned to online platforms and achieved remarkable growth.',
    featured_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    category_name: 'Success',
    author_name: 'Omar Khaled',
    created_at: '2024-01-05T11:20:00Z',
    reading_time: 10,
    views: 3200
  },
  {
    id: 6,
    title: 'Digital Marketing Strategies for Small Businesses',
    slug: 'digital-marketing',
    excerpt: 'Effective digital marketing strategies that small businesses can implement with limited budgets to reach more customers.',
    featured_image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=600&fit=crop',
    category_name: 'Marketing',
    author_name: 'Layla Mahmoud',
    created_at: '2024-01-03T13:00:00Z',
    reading_time: 9,
    views: 2780
  },
  {
    id: 7,
    title: 'Customer Service Excellence in the Digital Age',
    slug: 'customer-service',
    excerpt: 'How to provide outstanding customer service in an increasingly digital world while maintaining personal connections.',
    featured_image: 'https://images.unsplash.com/photo-1556745757-b55ce343b148?w=800&h=600&fit=crop',
    category_name: 'Service',
    author_name: 'Youssef Adel',
    created_at: '2024-01-01T08:30:00Z',
    reading_time: 6,
    views: 1450
  },
  {
    id: 8,
    title: 'Financial Planning for Business Growth',
    slug: 'financial-planning',
    excerpt: 'Essential financial planning tips to help your business grow sustainably and manage cash flow effectively.',
    featured_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    category_name: 'Finance',
    author_name: 'Nour Hesham',
    created_at: '2023-12-28T15:45:00Z',
    reading_time: 8,
    views: 2100
  },
  {
    id: 9,
    title: 'Building Strong Community Partnerships',
    slug: 'community-partnerships',
    excerpt: 'The importance of community partnerships and how to build mutually beneficial relationships with local organizations.',
    featured_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
    category_name: 'Community',
    author_name: 'Amina Saleh',
    created_at: '2023-12-25T10:00:00Z',
    reading_time: 7,
    views: 1680
  }
];

type PresetKey = keyof typeof blogPresets;

export default function BlogLayoutDemo() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('miniSiteStandard');
  const [postCount, setPostCount] = useState(6);

  const presetKeys = Object.keys(blogPresets) as PresetKey[];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '4rem 2rem',
        textAlign: 'center',
        color: '#fff'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>
          🎨 Blog Layout Showcase
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
          Explore all available blog layouts and choose the perfect one for your website or minisite
        </p>
      </div>

      {/* Controls */}
      <div style={{
        maxWidth: '1400px',
        margin: '-3rem auto 2rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Preset Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Choose Layout Preset:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {presetKeys.map(preset => (
                <button
                  key={preset}
                  onClick={() => setSelectedPreset(preset)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: selectedPreset === preset 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' 
                      : '#f1f5f9',
                    color: selectedPreset === preset ? '#fff' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                  }}
                >
                  {preset.replace(/([A-Z])/g, ' $1').trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Post Count Slider */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Number of Posts: {postCount}
            </label>
            <input
              type="range"
              min="1"
              max="9"
              value={postCount}
              onChange={(e) => setPostCount(parseInt(e.target.value))}
              style={{ width: '100%', height: '8px', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              <span>1</span>
              <span>5</span>
              <span>9</span>
            </div>
          </div>
        </div>

        {/* Current Preset Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>
            Current: {selectedPreset.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Layout:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{blogPresets[selectedPreset].layout}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Columns:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{blogPresets[selectedPreset].columns}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Card Style:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{blogPresets[selectedPreset].cardStyle}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Images:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{blogPresets[selectedPreset].showImage ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Preview */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <EasyBlogSection
          preset={selectedPreset}
          posts={samplePosts.slice(0, postCount)}
          title="Sample Blog Section"
          subtitle="This is how your blog will look with the selected layout"
        />
      </div>

      {/* Code Example */}
      <div style={{
        maxWidth: '1400px',
        margin: '2rem auto',
        padding: '2rem',
        background: '#0f172a',
        borderRadius: '16px',
        color: '#fff'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          💻 How to Use This Layout
        </h3>
        <pre style={{
          background: '#1e293b',
          padding: '1.5rem',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '0.9rem',
          lineHeight: '1.6'
        }}>
{`import { EasyBlogSection } from '@/lib/blog-integration';

// Add this to your page:
<EasyBlogSection 
  preset="${selectedPreset}" 
  loadFromAPI={true}
  postCount={${postCount}}
  title="Your Blog Title"
  subtitle="Your subtitle here"
/>`}
        </pre>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        background: '#fff',
        marginTop: '2rem'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
          🚀 Ready to Add Blogs to Your Site?
        </h3>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          Choose a layout above and copy the code to add it to any page!
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/BLOG_INTEGRATION_GUIDE.md"
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            📖 Read Full Documentation
          </a>
          <a
            href="/jana/blog-layout-builder"
            style={{
              padding: '1rem 2rem',
              background: '#fff',
              color: '#3b82f6',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              border: '2px solid #3b82f6'
            }}
          >
            🎨 Try Visual Builder
          </a>
        </div>
      </div>
    </div>
  );
}
