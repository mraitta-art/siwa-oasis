'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  author_id: number;
  author_name: string;
  category_id: number;
  category_name: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string;
  created_at: string;
  views: number;
  reading_time: number;
  tags: Array<{id: number; name: string; slug: string}>;
}

export default function BlogAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'layouts' | 'templates' | 'integration'>('posts');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [migrationRunning, setMigrationRunning] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [filterStatus]);

  async function loadPosts() {
    setLoading(true);
    try {
      const url = filterStatus === 'all' 
        ? '/api/jana/blog'
        : `/api/jana/blog?status=${filterStatus}`;
      
      const res = await fetch(url);
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

  async function runMigration() {
    setMigrationRunning(true);
    try {
      const res = await fetch('/api/jana/blog/migrate', {
        method: 'POST'
      });
      
      if (res.ok) {
        const result = await res.json();
        alert('✅ Blog database migration completed successfully!');
        console.log('Migration result:', result);
      } else {
        const error = await res.json();
        alert('❌ Migration failed: ' + (error.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('❌ Migration failed: ' + e.message);
    } finally {
      setMigrationRunning(false);
    }
  }

  async function deletePost(id: number) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/jana/blog/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        loadPosts();
      } else {
        const data = await res.json().catch(() => ({}));
        alert('❌ Failed to delete post: ' + (data.error || `Server error ${res.status}`));
      }
    } catch (e: any) {
      console.error('Failed to delete post:', e);
      alert('❌ Failed to delete post: ' + e.message);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#22c55e';
      case 'draft': return '#f59e0b';
      case 'scheduled': return '#3b82f6';
      default: return '#6b7280';
    }
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  boxShadow: '0 8px 20px rgba(59,130,246,0.4)'
                }}>
                  📝
                </div>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
                    Blog Manager
                  </h1>
                  <p style={{ opacity: 0.85, fontSize: '0.95rem', color: '#cbd5e1', margin: 0 }}>
                    Create, edit, and manage blog posts
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={runMigration}
                disabled={migrationRunning}
                style={{
                  padding: '1rem 1.5rem',
                  background: migrationRunning ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: migrationRunning ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 16px rgba(16,185,129,0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {migrationRunning ? 'Running...' : 'Setup Database'}
              </button>
              <button
                onClick={() => router.push('/jana/blog/editor')}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(59,130,246,0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                + New Post
              </button>
            </div>
          </div>
        </div>

        {/* Hub Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '2rem',
          background: '#fff', borderRadius: '12px', padding: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
        }}>
          {[
            { key: 'posts' as const, label: 'Posts', icon: 'fa-newspaper' },
            { key: 'layouts' as const, label: 'Layout Builder', icon: 'fa-table-cells-large' },
            { key: 'templates' as const, label: 'Templates', icon: 'fa-swatchbook' },
            { key: 'integration' as const, label: 'Integration', icon: 'fa-plug' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'posts') {
                  setActiveTab('posts');
                } else {
                  router.push(`/jana/blog-${tab.key === 'layouts' ? 'layout-builder' : tab.key === 'templates' ? 'templates' : 'integration'}`);
                }
              }}
              style={{
                flex: 1, padding: '0.75rem 1rem', border: 'none', borderRadius: '8px',
                background: activeTab === tab.key ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.5rem',
              }}
            >
              <i className={`fas ${tab.icon}`} style={{ fontSize: '0.75rem' }}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Posts
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>
              {posts.length}
            </div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Published
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e' }}>
              {posts.filter(p => p.status === 'published').length}
            </div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Drafts
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>
              {posts.filter(p => p.status === 'draft').length}
            </div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Views
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6' }}>
              {posts.reduce((sum, p) => sum + (p.views || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>Filter:</span>
          {[
            { key: 'all', label: 'All', count: posts.length },
            { key: 'published', label: 'Published', count: posts.filter(p => p.status === 'published').length },
            { key: 'draft', label: 'Drafts', count: posts.filter(p => p.status === 'draft').length }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              style={{
                padding: '0.6rem 1.2rem',
                background: filterStatus === filter.key ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' : '#f8fafc',
                color: filterStatus === filter.key ? '#fff' : '#64748b',
                border: filterStatus === filter.key ? 'none' : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Posts List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem' }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p style={{ color: '#64748b' }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '5rem 3rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>📝</div>
            <h3 style={{ color: '#0f172a', marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>No Blog Posts Yet</h3>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Create your first blog post to get started
            </p>
            <button
              onClick={() => router.push('/jana/blog/editor')}
              style={{
                padding: '1rem 2.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(59,130,246,0.3)'
              }}
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {posts.map(post => (
              <div
                key={post.id}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {post.featured_image && (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                          {post.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{
                            padding: '0.3rem 0.8rem',
                            background: getStatusColor(post.status),
                            color: '#fff',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'capitalize'
                          }}>
                            {post.status}
                          </span>
                          {post.category_name && (
                            <span style={{
                              padding: '0.3rem 0.8rem',
                              background: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {post.category_name}
                            </span>
                          )}
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            👁️ {post.views || 0} views
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            ⏱️ {post.reading_time || 0} min read
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {post.excerpt && (
                      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                        {post.excerpt.substring(0, 150)}...
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link
                        href={`/jana/blog/edit?id=${post.id}`}
                        style={{
                          padding: '0.6rem 1.5rem',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                          color: '#fff',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => deletePost(post.id)}
                        style={{
                          padding: '0.6rem 1.5rem',
                          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
