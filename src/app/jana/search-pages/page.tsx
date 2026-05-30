'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * SEARCH PAGES MANAGER
 * Admin interface for creating and managing fully customizable search pages
 * Features:
 * - Create new search pages with custom URLs
 * - Assign search engines/modules
 * - Configure hero carousel
 * - Add custom components
 * - Full CRUD operations
 */

interface SearchPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  search_engine_id: string | null;
  hero_enabled: boolean;
  hero_carousel_id: string;
  is_published: boolean;
  created_at: string;
}

export default function SearchPagesManager() {
  const [pages, setPages] = useState<SearchPage[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<SearchPage> | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    search_engine_id: '',
    hero_enabled: true,
    hero_carousel_id: 'discovery',
    hero_height_vh: 85,
    hero_autoplay: true,
    is_published: true
  });

  useEffect(() => {
    Promise.all([loadPages(), loadEngines()]);
  }, []);

  async function loadPages() {
    try {
      const res = await fetch('/api/jana/search-pages');
      if (res.ok) {
        setPages(await res.json());
      }
    } catch (e) {
      console.error('Failed to load search pages:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadEngines() {
    try {
      const res = await fetch('/api/jana/search-engines');
      if (res.ok) {
        setEngines(await res.json());
      }
    } catch (e) {
      console.error('Failed to load search engines:', e);
    }
  }

  async function savePage() {
    try {
      const url = editingPage?.id
        ? '/api/jana/search-pages'
        : '/api/jana/search-pages';

      const method = editingPage?.id ? 'PUT' : 'POST';
      const body = editingPage?.id
        ? { id: editingPage.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingPage(null);
        setFormData({
          slug: '',
          title: '',
          description: '',
          search_engine_id: '',
          hero_enabled: true,
          hero_carousel_id: 'discovery',
          hero_height_vh: 85,
          hero_autoplay: true,
          is_published: true
        });
        loadPages();
        alert(`Search page ${editingPage?.id ? 'updated' : 'created'} successfully!`);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (e) {
      alert(`Failed to save: ${e}`);
    }
  }

  async function deletePage(id: string, title: string) {
    if (!confirm(`Delete search page "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/jana/search-pages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadPages();
        alert('Search page deleted successfully');
      }
    } catch (e) {
      alert(`Failed to delete: ${e}`);
    }
  }

  const editPage = (page: SearchPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      description: page.description,
      search_engine_id: page.search_engine_id || '',
      hero_enabled: page.hero_enabled,
      hero_carousel_id: page.hero_carousel_id,
      hero_height_vh: 85,
      hero_autoplay: true,
      is_published: page.is_published
    });
    setShowModal(true);
  };

  const newPage = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      description: '',
      search_engine_id: '',
      hero_enabled: true,
      hero_carousel_id: 'discovery',
      hero_height_vh: 85,
      hero_autoplay: true,
      is_published: true
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin fa-2x"></i>
        <p>Loading search pages...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>🔍 Search Pages Manager</h1>
          <p style={{ color: '#64748b', margin: '0.5rem 0 0' }}>Create and manage fully customizable search pages</p>
        </div>
        <button
          onClick={newPage}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#D4AF37',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          + New Search Page
        </button>
      </div>

      {/* Search Pages Grid */}
      {pages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <i className="fas fa-search fa-3x" style={{ color: '#cbd5e1', marginBottom: '1rem' }}></i>
          <p style={{ color: '#64748b' }}>No search pages yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {pages.map(page => (
            <div
              key={page.id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{page.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.3rem 0 0' }}>
                    <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                      /search/{page.slug}
                    </code>
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.3rem 0.6rem',
                    background: page.is_published ? '#d1fae5' : '#fecaca',
                    color: page.is_published ? '#065f46' : '#991b1b',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                >
                  {page.is_published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '1rem 0' }}>
                {page.description || 'No description'}
              </p>

              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
                {page.search_engine_id && (
                  <div>
                    <strong>Engine:</strong> {engines.find(e => e.id === page.search_engine_id)?.name || page.search_engine_id}
                  </div>
                )}
                {page.hero_enabled && (
                  <div>
                    <strong>Hero:</strong> {page.hero_carousel_id}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <a
                  href={`/search/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textAlign: 'center'
                  }}
                >
                  👁 Preview
                </a>
                <button
                  onClick={() => editPage(page)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    background: '#D4AF37',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#1a1a2e',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => deletePage(page.id, page.title)}
                  style={{
                    padding: '0.6rem 1rem',
                    background: '#fecaca',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#991b1b',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>
              {editingPage?.id ? '✏️ Edit Search Page' : '➕ New Search Page'}
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Page Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="e.g. vibe-search, luxury-hotels"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                URL will be: /search/{formData.slug}
              </small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Page title"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Page description"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  minHeight: '80px',
                  fontFamily: 'sans-serif',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Search Engine</label>
              <select
                value={formData.search_engine_id}
                onChange={e => setFormData({ ...formData, search_engine_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Default Vibe Search</option>
                {engines.map(eng => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name} ({eng.allowed_fields?.length || 0} fields)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.hero_enabled}
                    onChange={e => setFormData({ ...formData, hero_enabled: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Enable Hero Carousel
                </label>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Publish Page
                </label>
              </div>
            </div>

            {formData.hero_enabled && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Carousel ID</label>
                  <input
                    type="text"
                    value={formData.hero_carousel_id}
                    onChange={e => setFormData({ ...formData, hero_carousel_id: e.target.value })}
                    placeholder="e.g. discovery, main_hero"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Hero Height (vh)</label>
                  <input
                    type="number"
                    value={formData.hero_height_vh}
                    onChange={e => setFormData({ ...formData, hero_height_vh: parseInt(e.target.value) })}
                    min="40"
                    max="100"
                    step="5"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.hero_autoplay}
                      onChange={e => setFormData({ ...formData, hero_autoplay: e.target.checked })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Auto-play Carousel
                  </label>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Cancel
              </button>
              <button
                onClick={savePage}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#D4AF37',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {editingPage?.id ? 'Save Changes' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
