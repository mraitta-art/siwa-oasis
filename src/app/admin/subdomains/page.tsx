'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SubdomainEntry {
  subdomain: string;
  target_route: string;
  label: string;
  category: string;
  active: boolean;
  is_primary?: boolean;
  description?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Subdomains', icon: '🌐' },
  { id: 'accommodations', label: 'Accommodations', icon: '🏨' },
  { id: 'transportation', label: 'Transportation', icon: '🚗' },
  { id: 'activities', label: 'Activities & Safari', icon: '🐪' },
  { id: 'food-beverage', label: 'Food & Dining', icon: '🍽️' },
  { id: 'crafts-wellness', label: 'Crafts & Wellness', icon: '🧂' },
  { id: 'production-trade', label: 'Production & Trade', icon: '🌴' },
  { id: 'blog', label: 'Stories & Blog', icon: '📖' },
  { id: 'offers', label: 'Deals & Offers', icon: '🎁' },
  { id: 'packages', label: 'Packages', icon: '📦' },
  { id: 'journeys', label: 'Journeys', icon: '🗺️' },
  { id: 'partner', label: 'Partner Onboarding', icon: '🤝' },
  { id: 'custom', label: 'Custom Aliases', icon: '✨' },
];

export default function AdminSubdomainsPage() {
  const [subdomains, setSubdomains] = useState<SubdomainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // New Subdomain Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState<Partial<SubdomainEntry>>({
    subdomain: '',
    target_route: '/',
    label: '',
    category: 'custom',
    active: true,
    description: '',
  });

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch('/api/admin/subdomains')
      .then(res => res.json())
      .then(data => {
        setSubdomains(data.subdomains || []);
      })
      .catch(() => notify('Failed to load subdomains', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const saveAll = async (updatedList?: SubdomainEntry[]) => {
    setSaving(true);
    const listToSave = updatedList || subdomains;
    try {
      const res = await fetch('/api/admin/subdomains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomains: listToSave }),
      });
      if (res.ok) {
        notify('Subdomain rules saved and live on server!');
        if (updatedList) setSubdomains(updatedList);
      } else {
        notify('Failed to save rules', 'error');
      }
    } catch {
      notify('Failed to save rules', 'error');
    }
    setSaving(false);
  };

  const toggleActive = (subdomainStr: string) => {
    const updated = subdomains.map(s => s.subdomain === subdomainStr ? { ...s, active: !s.active } : s);
    setSubdomains(updated);
    saveAll(updated);
  };

  const updateTargetRoute = (subdomainStr: string, newRoute: string) => {
    setSubdomains(prev => prev.map(s => s.subdomain === subdomainStr ? { ...s, target_route: newRoute } : s));
  };

  const deleteSubdomain = (subdomainStr: string) => {
    if (!window.confirm(`Are you sure you want to remove the subdomain alias "${subdomainStr}.siwify.com"?`)) return;
    const updated = subdomains.filter(s => s.subdomain !== subdomainStr);
    setSubdomains(updated);
    saveAll(updated);
  };

  const handleAddSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSub = (newSubdomain.subdomain || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '');

    if (!cleanSub) {
      notify('Please provide a valid subdomain slug', 'error');
      return;
    }

    if (subdomains.some(s => s.subdomain === cleanSub)) {
      notify(`Subdomain "${cleanSub}" already exists`, 'error');
      return;
    }

    const entry: SubdomainEntry = {
      subdomain: cleanSub,
      target_route: newSubdomain.target_route || '/',
      label: newSubdomain.label || cleanSub,
      category: newSubdomain.category || 'custom',
      active: true,
      description: newSubdomain.description || 'Custom admin alias',
    };

    const updated = [entry, ...subdomains];
    setSubdomains(updated);
    saveAll(updated);
    setShowAddModal(false);
    setNewSubdomain({ subdomain: '', target_route: '/', label: '', category: 'custom', active: true, description: '' });
  };

  const filtered = subdomains.filter(s => {
    const matchesSearch = !search ||
      s.subdomain.toLowerCase().includes(search.toLowerCase()) ||
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.target_route.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '4px' }}>LOADING SUBDOMAINS…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '2rem', zIndex: 9999,
          padding: '1rem 1.75rem', borderRadius: '14px', fontWeight: 800, fontSize: '0.85rem',
          background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background: '#0f172a', color: '#fff', padding: '1.5rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '3px' }}>GOVERNANCE & SEO</div>
            <h1 style={{ margin: '0.2rem 0 0', fontSize: '1.4rem', fontWeight: 900 }}>Subdomains & SEO Keyword Manager</h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              Choose, configure, and modify search-optimized subdomains (e.g. <code>siwastay.siwify.com</code> ➔ <code>/accommodations</code>)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: '#D4AF37', color: '#000', border: 'none', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              + Add Subdomain
            </button>
            <button
              onClick={() => saveAll()}
              disabled={saving}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save & Publish'}
            </button>
            <Link
              href="/admin"
              style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800 }}
            >
              ← Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 3rem' }}>

        {/* Search & Category Tabs */}
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subdomains, target paths, or keywords (e.g. siwastay, tours)…"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
              Showing {filtered.length} of {subdomains.length} configured subdomains
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap',
                  background: selectedCategory === cat.id ? '#0f172a' : '#f1f5f9',
                  color: selectedCategory === cat.id ? '#fff' : '#64748b',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ marginRight: '0.35rem' }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subdomains Table */}
        <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#fafbfd', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem' }}>Subdomain (Full Host)</th>
                <th style={{ padding: '1rem 1.25rem' }}>Target Route (Destination)</th>
                <th style={{ padding: '1rem 1.25rem' }}>Label & SEO Role</th>
                <th style={{ padding: '1rem 1.25rem' }}>Category</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr
                  key={item.subdomain}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: item.active ? (index % 2 === 0 ? '#ffffff' : '#fafafa') : '#fef2f2',
                    transition: 'background 0.15s'
                  }}
                >
                  {/* Status Toggle */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <button
                      onClick={() => toggleActive(item.subdomain)}
                      style={{
                        padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                        fontWeight: 900, fontSize: '0.65rem',
                        background: item.active ? '#dcfce7' : '#fee2e2',
                        color: item.active ? '#15803d' : '#b91c1c'
                      }}
                    >
                      {item.active ? '● LIVE' : '○ OFF'}
                    </button>
                  </td>

                  {/* Subdomain host */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                        {item.subdomain}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>.siwify.com</span>
                      {item.is_primary && (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900 }}>
                          ★ PRIMARY
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    )}
                  </td>

                  {/* Target Route */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <input
                      type="text"
                      value={item.target_route}
                      onChange={e => updateTargetRoute(item.subdomain, e.target.value)}
                      style={{
                        padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1',
                        fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, width: '100%', maxWidth: '260px',
                        background: '#fff'
                      }}
                    />
                  </td>

                  {/* Label */}
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    {item.label}
                  </td>

                  {/* Category Tag */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'capitalize' }}>
                      {item.category.replace('-', ' ')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <a
                        href={`http://127.0.0.1:3000/?subdomain=${item.subdomain}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Test locally in new tab"
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#3b82f6', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 800 }}
                      >
                        Test ↗
                      </a>
                      <button
                        onClick={() => deleteSubdomain(item.subdomain)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', fontSize: '0.7rem' }}
                        title="Delete Subdomain"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              No subdomains found matching your search.
            </div>
          )}
        </div>
      </main>

      {/* Add Subdomain Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', maxWidth: '520px', width: '100%', padding: '2.5rem', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '2px' }}>NEW DOMAIN ALIAS</div>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Add SEO Subdomain</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleAddSubdomain} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Subdomain Prefix (e.g. <code>siwaecolodges</code>) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input
                    type="text"
                    required
                    value={newSubdomain.subdomain || ''}
                    onChange={e => setNewSubdomain(s => ({ ...s, subdomain: e.target.value }))}
                    placeholder="e.g. siwaecolodges"
                    style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <span style={{ fontWeight: 800, color: '#64748b', fontSize: '0.8rem' }}>.siwify.com</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Target Destination Route *
                </label>
                <input
                  type="text"
                  required
                  value={newSubdomain.target_route || ''}
                  onChange={e => setNewSubdomain(s => ({ ...s, target_route: e.target.value }))}
                  placeholder="e.g. /accommodations or /activities?tag=safari"
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Label / Display Title
                </label>
                <input
                  type="text"
                  value={newSubdomain.label || ''}
                  onChange={e => setNewSubdomain(s => ({ ...s, label: e.target.value }))}
                  placeholder="e.g. Siwa Eco Lodges Finder"
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={newSubdomain.category || 'custom'}
                  onChange={e => setNewSubdomain(s => ({ ...s, category: e.target.value }))}
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Description / SEO Purpose (optional)
                </label>
                <input
                  type="text"
                  value={newSubdomain.description || ''}
                  onChange={e => setNewSubdomain(s => ({ ...s, description: e.target.value }))}
                  placeholder="e.g. Captures organic traffic for eco lodge searches"
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#D4AF37', color: '#000', fontWeight: 900, cursor: 'pointer' }}
                >
                  Create & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
