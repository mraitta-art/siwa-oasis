'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SiteComponent {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  zone: 'header' | 'body' | 'footer';
  category?: string;
  enabled: boolean;
  manager_url?: string;
  default_props?: string;
  required_props?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

type FilterZone = 'all' | 'header' | 'body' | 'footer';

export default function ComponentRegistryPage() {
  const [components, setComponents] = useState<SiteComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterZone, setFilterZone] = useState<FilterZone>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SiteComponent | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    icon: '',
    zone: 'body' as 'header' | 'body' | 'footer',
    category: '',
    manager_url: '',
    sort_order: 999
  });

  useEffect(() => {
    loadComponents();
  }, []);

  async function loadComponents() {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/site-components');
      if (res.ok) {
        const data = await res.json();
        setComponents(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      showToast('Failed to load components', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveComponent() {
    if (!formData.key || !formData.name || !formData.zone) {
      showToast('Key, name, and zone are required', 'error');
      return;
    }

    try {
      const url = editingComponent
        ? `/api/jana/site-components`
        : `/api/jana/site-components`;

      const method = editingComponent ? 'PUT' : 'POST';
      const body = editingComponent
        ? { id: editingComponent.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showToast(`Component ${editingComponent ? 'updated' : 'created'} successfully`, 'success');
        setShowModal(false);
        setEditingComponent(null);
        setFormData({ key: '', name: '', description: '', icon: '', zone: 'body', category: '', manager_url: '', sort_order: 999 });
        loadComponents();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save component', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  async function deleteComponent(id: string) {
    if (!confirm('Delete this component?')) return;

    try {
      const res = await fetch(`/api/jana/site-components?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Component deleted', 'success');
        loadComponents();
      } else {
        showToast('Failed to delete component', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  async function toggleEnabled(comp: SiteComponent) {
    try {
      const res = await fetch('/api/jana/site-components', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comp.id, enabled: !comp.enabled })
      });

      if (res.ok) {
        loadComponents();
      }
    } catch (e) {
      showToast('Failed to update component', 'error');
    }
  }

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openModal(comp?: SiteComponent) {
    if (comp) {
      setEditingComponent(comp);
      setFormData({
        key: comp.key,
        name: comp.name,
        description: comp.description || '',
        icon: comp.icon || '',
        zone: comp.zone,
        category: comp.category || '',
        manager_url: comp.manager_url || '',
        sort_order: comp.sort_order
      });
    } else {
      setEditingComponent(null);
      setFormData({ key: '', name: '', description: '', icon: '', zone: 'body', category: '', manager_url: '', sort_order: 999 });
    }
    setShowModal(true);
  }

  const filteredComponents = components.filter(c => {
    const zoneMatch = filterZone === 'all' || c.zone === filterZone;
    const categoryMatch = filterCategory === 'all' || c.category === filterCategory;
    const searchMatch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.key.toLowerCase().includes(searchTerm.toLowerCase());
    return zoneMatch && categoryMatch && searchMatch;
  });

  const categories = Array.from(new Set(components.map(c => c.category).filter(Boolean)));
  const zones = ['header', 'body', 'footer'] as const;

  const zoneColor = (zone: string) => {
    return { header: '#D4AF37', body: '#10b981', footer: '#64748b' }[zone] || '#64748b';
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>Component Registry</h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.6 }}>Control which components are available in the site builder</p>
          </div>
          <button
            onClick={() => openModal()}
            style={{
              padding: '0.75rem 2rem',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Register Component
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              flex: 1,
              minWidth: 200
            }}
          />

          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value as FilterZone)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              background: '#fff'
            }}
          >
            <option value="all">All Zones</option>
            {zones.map(z => (
              <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              background: '#fff'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Components Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            Loading components...
          </div>
        ) : filteredComponents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '1rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            No components found
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredComponents.map(comp => (
              <div
                key={comp.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>{comp.icon || '📦'}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{comp.name}</h3>
                      <code style={{ fontSize: '0.75rem', color: '#64748b' }}>{comp.key}</code>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={comp.enabled}
                      onChange={() => toggleEnabled(comp)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      {comp.enabled ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>

                {/* Zone & Category */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: zoneColor(comp.zone),
                      color: '#fff',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {comp.zone}
                  </span>
                  {comp.category && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        background: '#e5e7eb',
                        color: '#374151',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}
                    >
                      {comp.category}
                    </span>
                  )}
                </div>

                {/* Description */}
                {comp.description && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.75rem 0' }}>
                    {comp.description}
                  </p>
                )}

                {/* Manager Link */}
                {comp.manager_url && (
                  <div style={{ marginBottom: '1rem' }}>
                    <Link
                      href={comp.manager_url}
                      style={{
                        fontSize: '0.8rem',
                        color: '#0ea5e9',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      ⚙️ Manage {comp.name}
                    </Link>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => openModal(comp)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#e0e7ff',
                      color: '#4f46e5',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteComponent(comp.id)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: 500,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 900 }}>
              {editingComponent ? 'Edit Component' : 'Register New Component'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Component Key *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g., hero_carousel"
                  disabled={!!editingComponent}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Hero Carousel"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this component does..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box',
                    minHeight: 80,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Zone *
                  </label>
                  <select
                    value={formData.zone}
                    onChange={e => setFormData({ ...formData, zone: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="header">Header</option>
                    <option value="body">Body</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Hero, Search"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., 🎬"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxSizing: 'border-box',
                      fontSize: '1.5rem',
                      textAlign: 'center'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Manager URL
                </label>
                <input
                  type="text"
                  value={formData.manager_url}
                  onChange={e => setFormData({ ...formData, manager_url: e.target.value })}
                  placeholder="e.g., /jana/hero-carousel"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={saveComponent}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Component
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            padding: '1rem 1.5rem',
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            borderRadius: '0.5rem',
            fontWeight: 600,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 100
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
