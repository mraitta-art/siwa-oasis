'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: null as number | null,
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    published_at: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadCategories();
    loadTags();
    if (postId) {
      loadPost();
    }
  }, [postId]);

  async function loadCategories() {
    try {
      const res = await fetch('/api/admin/blog/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  }

  async function loadTags() {
    try {
      const res = await fetch('/api/admin/blog/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch (e) {
      console.error('Failed to load tags:', e);
    }
  }

  async function loadPost() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`);
      if (res.ok) {
        const post = await res.json();
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          featured_image: post.featured_image || '',
          category_id: post.category_id || null,
          status: post.status || 'draft',
          published_at: post.published_at || '',
          meta_title: post.meta_title || '',
          meta_description: post.meta_description || '',
          meta_keywords: post.meta_keywords || '',
          tags: post.tags?.map((t: any) => t.name) || []
        });
      }
    } catch (e) {
      console.error('Failed to load post:', e);
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function handleTitleChange(title: string) {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title
    }));
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmed]
      }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, featured_image: data.url }));
      }
    } catch (e) {
      console.error('Failed to upload image:', e);
    }
  }

  async function savePost(status: 'draft' | 'published' | 'scheduled') {
    if (!formData.title || !formData.content) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const url = postId ? `/api/admin/blog/${postId}` : '/api/admin/blog';
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status
        })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ Post ${status === 'published' ? 'published' : 'saved'} successfully!`);
        router.push('/admin/blog');
      } else {
        const error = await res.json();
        alert('❌ Failed to save: ' + (error.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('❌ Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                ✏️
              </div>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  {postId ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  {postId ? 'Update your blog post' : 'Write and publish your story'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href="/admin/blog"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                ← Back
              </Link>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                👁️ {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Title */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Post Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter an engaging title..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              />
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                Slug: <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>/{formData.slug || 'your-post-slug'}</span>
              </div>
            </div>

            {/* Content */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post content here... (Supports Markdown)"
                rows={20}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                💡 Tip: Use Markdown formatting for rich text
              </div>
            </div>

            {/* Excerpt */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary of your post..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'grid', gap: '1.5rem', height: 'fit-content' }}>
            {/* Featured Image */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Featured Image
              </label>
              {formData.featured_image ? (
                <div style={{ marginBottom: '0.75rem' }}>
                  <img
                    src={formData.featured_image}
                    alt="Featured"
                    style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem' }}
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Remove Image
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'block',
                  padding: '2rem',
                  background: '#f8fafc',
                  border: '2px dashed #e2e8f0',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Click to upload</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {/* Category */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Category
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : null }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                aria-label="Post category"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Tags
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                  placeholder="Add tag..."
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  onClick={() => addTag(tagInput)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1e40af',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1,
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  marginBottom: '0.75rem'
                }}
                aria-label="Post status"
              >
                <option value="draft">📝 Draft</option>
                <option value="published">✅ Published</option>
                <option value="scheduled">📅 Scheduled</option>
              </select>
              {formData.status === 'scheduled' && (
                <input
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              )}
            </div>

            {/* Save Actions */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => savePost('published')}
                disabled={saving}
                style={{
                  padding: '1rem',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 16px rgba(34,197,94,0.3)'
                }}
              >
                {saving ? '⏳ Saving...' : '🚀 Publish Post'}
              </button>
              <button
                onClick={() => savePost('draft')}
                disabled={saving}
                style={{
                  padding: '1rem',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 16px rgba(245,158,11,0.3)'
                }}
              >
                {saving ? '⏳ Saving...' : '💾 Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogPostEditor() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="spinner"></div><p>Loading Blog Editor...</p></div>}>
      <BlogEditorContent />
    </Suspense>
  );
}
