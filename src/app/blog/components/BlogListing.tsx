'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category_name: string | null;
  created_at: string | null;
  views: number;
  reading_time: number;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export default function BlogListing() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch('/api/blog');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '6rem 2rem',
        textAlign: 'center',
        color: '#fff'
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem' }}>
          📝 Our Blog
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Insights, guides, and updates from the Siwa Oasis team
        </p>
      </div>

      {/* Posts Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p style={{ color: '#64748b' }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📝</div>
            <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>No Posts Yet</h2>
            <p style={{ color: '#64748b' }}>Check back soon for new content!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.3s ease'
                }}
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '220px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem'
                  }}>
                    📝
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  {post.category_name && (
                    <span style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.8rem',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: '0.75rem'
                    }}>
                      {post.category_name}
                    </span>
                  )}
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                    {post.excerpt?.substring(0, 120)}...
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span>📅 {formatDate(post.created_at)}</span>
                    <span>⏱️ {post.reading_time || 0} min</span>
                    <span>👁️ {post.views || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
