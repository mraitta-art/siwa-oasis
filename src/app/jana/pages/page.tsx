'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface PageEntry {
  slug: string;
  type: 'page' | 'search';
  label: string;
  url: string;
  editUrl: string;
  componentCount?: number;
  isMain: boolean;
}

const ICON_MAP: Record<string, string> = {
  main: '🏠', about: '📖', contact: '📞', investment: '💼', services: '🏢',
};

function slugToLabel(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function pageIcon(slug: string, type: string): string {
  if (type === 'search') return '🔍';
  return ICON_MAP[slug] || '📄';
}

export default function PagesManager() {
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState<'page' | 'search'>('page');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState<'all' | 'page' | 'search'>('all');

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/website/list');
      if (!res.ok) throw new Error('Failed to load');
      const data: { type: string }[] = await res.json();

      const parsed: PageEntry[] = data.map(row => {
        const t = row.type;
        let slug: string;
        let type: 'page' | 'search';

        if (t.startsWith('website_search_')) {
          slug = t.replace('website_search_', '');
          type = 'search';
        } else {
          slug = t.replace('website_', '');
          type = 'page';
        }

        const isMain = slug === 'main';
        return {
          slug,
          type,
          label: isMain ? '🏠 Homepage (Main)' : slugToLabel(slug),
          url: isMain ? '/' : `/p/${slug}`,
          editUrl: `/jana/website?page=${slug}`,
          isMain,
        };
      });

      // Main always first
      parsed.sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
      setPages(parsed);
    } catch (e) {
      notify('Failed to load pages', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleCreate = async () => {
    const slug = slugify(newSlug);
    if (!slug) { notify('Enter a valid page name', false); return; }
    if (pages.some(p => p.slug === slug)) { notify(`Page "${slug}" already exists`, false); return; }

    const id = newType === 'search' ? `website_search_${slug}` : `website_${slug}`;
    const res = await fetch('/api/jana/website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        header_components: [],
        body_components: [],
        footer_components: [],
        site_settings: {},
      }),
    });

    if (res.ok) {
      notify(`✅ Page "${slug}" created`);
      setCreating(false);
      setNewSlug('');
      loadPages();
    } else {
      notify('Failed to create page', false);
    }
  };

  const handleDelete = async (page: PageEntry) => {
    if (page.isMain) { notify('Cannot delete the main homepage', false); return; }
    const id = page.type === 'search' ? `website_search_${page.slug}` : `website_${page.slug}`;
    setDeleting(page.slug);
    const res = await fetch(`/api/jana/website?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify(`🗑️ Page "${page.slug}" deleted`);
      loadPages();
    } else {
      notify('Failed to delete', false);
    }
    setDeleting(null);
  };

  const filtered = pages.filter(p => {
    const matchSearch = p.slug.includes(search.toLowerCase()) || p.label.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.type === filter;
    return matchSearch && matchFilter;
  });

  const totalPages  = pages.filter(p => p.type === 'page').length;
  const totalSearch = pages.filter(p => p.type === 'search').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/jana" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>
              ← ADMIN DASHBOARD
            </Link>
            <h1 style={{ margin: '0.5rem 0 0', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
              📋 Pages Manager
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              All published pages on this site — create, preview, edit, or delete.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="/" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
              👁 Preview Site
            </a>
            <Link href="/jana/website"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.1rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', color: '#D4AF37', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
              🎨 Visual Editor
            </Link>
            <button
              onClick={() => { setCreating(true); setNewSlug(''); }}
              style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem' }}>
              + New Page
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', background: toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.ok ? '#10b981' : '#ef4444'}`, color: toast.ok ? '#6ee7b7' : '#fca5a5' }}>
            {toast.msg}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Pages', value: pages.length, color: '#D4AF37', icon: '📋' },
            { label: 'Content Pages', value: totalPages, color: '#10b981', icon: '📄' },
            { label: 'Search Pages', value: totalSearch, color: '#0ea5e9', icon: '🔍' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginTop: '0.1rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Create Page Form */}
        {creating && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem', border: '1px solid rgba(212,175,55,0.35)' }}>
            <h3 style={{ color: '#fff', fontWeight: 900, margin: '0 0 1.25rem' }}>✨ Create New Page</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.4rem' }}>PAGE SLUG (URL)</label>
                <input
                  autoFocus
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder="e.g. about-us, services, contact"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}
                />
                {newSlug && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
                    URL: <span style={{ color: '#D4AF37', fontWeight: 700 }}>
                      {newType === 'search' ? '/search/' : '/p/'}{slugify(newSlug)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.4rem' }}>TYPE</label>
                <select value={newType} onChange={e => setNewType(e.target.value as any)}
                  style={{ padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <option value="page">📄 Content Page</option>
                  <option value="search">🔍 Search Page</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleCreate}
                  style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ✓ Create
                </button>
                <button onClick={() => setCreating(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pages..."
              style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '0.85rem' }}
            />
            <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '0.8rem' }}>🔍</span>
          </div>
          {(['all', 'page', 'search'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s',
                background: filter === f ? '#D4AF37' : 'rgba(255,255,255,0.07)',
                color: filter === f ? '#0f172a' : '#64748b' }}>
              {f === 'all' ? 'All Pages' : f === 'page' ? '📄 Content' : '🔍 Search'}
            </button>
          ))}
        </div>

        {/* Pages List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading pages…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: '#1e293b', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.08)', color: '#475569' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <p style={{ fontWeight: 700 }}>{search ? 'No pages match your search' : 'No pages yet — create your first one!'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>
              {filtered.length} page{filtered.length !== 1 ? 's' : ''}
            </div>
            {filtered.map(page => (
              <div key={page.slug}
                style={{ background: '#1e293b', borderRadius: '12px', border: page.isMain ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: '1rem', alignItems: 'center', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = page.isMain ? 'rgba(212,175,55,0.5)' : 'rgba(148,163,184,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = page.isMain ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)')}>

                {/* Icon */}
                <div style={{ width: 48, height: 48, borderRadius: '10px', background: page.isMain ? 'rgba(212,175,55,0.12)' : page.type === 'search' ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  {pageIcon(page.slug, page.type)}
                </div>

                {/* Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem' }}>{page.label}</span>
                    {page.isMain && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '20px', background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>MAIN</span>
                    )}
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: page.type === 'search' ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.06)', color: page.type === 'search' ? '#38bdf8' : '#64748b' }}>
                      {page.type === 'search' ? '🔍 Search' : '📄 Content'}
                    </span>
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    {page.url}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <a href={page.url} target="_blank" rel="noopener noreferrer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.45rem 0.85rem', borderRadius: '7px', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    👁 View
                  </a>
                  <Link href={page.editUrl}
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', padding: '0.45rem 0.85rem', borderRadius: '7px', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    ✏️ Edit
                  </Link>
                  {!page.isMain && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete page "${page.slug}"? This cannot be undone.`)) {
                          handleDelete(page);
                        }
                      }}
                      disabled={deleting === page.slug}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.45rem 0.85rem', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', opacity: deleting === page.slug ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                      {deleting === page.slug ? '…' : '🗑 Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div style={{ marginTop: '2.5rem', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.8 }}>
            <strong style={{ color: '#D4AF37' }}>📄 Content pages</strong> are served at <code style={{ color: '#94a3b8' }}>/p/[slug]</code> and built with the Visual Editor.<br />
            <strong style={{ color: '#38bdf8' }}>🔍 Search pages</strong> are specialized search views with custom filters and engines.<br />
            <strong style={{ color: '#D4AF37' }}>🏠 Homepage (Main)</strong> is served at <code style={{ color: '#94a3b8' }}>/</code> and cannot be deleted.
          </p>
        </div>

      </div>
    </div>
  );
}
