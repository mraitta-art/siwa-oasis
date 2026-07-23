'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Component {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  zone: string;
  category?: string | null;
  enabled?: boolean | number | null;
  manager_url?: string | null;
  version?: string | null;
  deprecation_notice?: string | null;
  component_config?: Record<string, any>;
  config_schema?: any;
  type?: string | null;
  is_active?: boolean | number | null;
  is_global?: boolean | number | null;
  usage_count?: number | null;
  created_at?: string | null;
  deprecated?: boolean | number | null;
}

interface ConfigField {
  name: string;
  type: string;
  label: string;
  default?: any;
  options?: string[];
  min?: number;
  max?: number;
}

export default function ComponentLibrary() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [editingConfig, setEditingConfig] = useState<Record<string, any>>({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filter, setFilter] = useState({ zone: 'all', category: 'all' });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const dataSources = { sections: [] as any[], fields: [] as any[] };

  const getGradient = (type?: string | null) => 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
  const getIcon = (type?: string | null) => '📦';

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getComponentConfig = (component: Component) => {
    const raw = (component as any).component_config;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return raw || {};
  };

  const toggleMinisiteAccess = async (component: Component) => {
    const currentConfig = getComponentConfig(component);
    const nextConfig = { ...currentConfig, minisite_access: !Boolean(currentConfig.minisite_access) };

    try {
      const res = await fetch('/api/jana/site-components', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: component.id, component_config: nextConfig })
      });

      if (res.ok) {
        showToast(nextConfig.minisite_access ? 'Minisite access enabled' : 'Minisite access disabled', 'success');
        fetchComponents();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update minisite access', 'error');
      }
    } catch (error) {
      showToast('Error updating minisite access', 'error');
    }
  };

  const fetchComponents = async () => {
    try {
      const res = await fetch('/api/jana/site-components');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load components');
      }

      setComponents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setComponents([]);
      showToast(error?.message || 'Failed to load components', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/jana/site-components', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: active })
      });

      if (res.ok) {
        showToast(active ? 'Component enabled' : 'Component disabled', 'success');
        fetchComponents();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update component', 'error');
      }
    } catch (error) {
      showToast('Error updating component', 'error');
    }
  };

  const deleteComponent = async (id: string) => {
    if (!confirm('Delete this component?')) return;

    try {
      const res = await fetch(`/api/jana/site-components?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Component deleted', 'success');
        fetchComponents();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete component', 'error');
      }
    } catch (error) {
      showToast('Error deleting component', 'error');
    }
  };

  const loadComponents = () => fetchComponents();

  useEffect(() => {
    fetchComponents();
  }, []);

  const openConfigEditor = async (component: Component) => {
    setSelectedComponent(component);
    try {
      const res = await fetch(`/api/jana/site-components/config/${component.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load config');
      }

      setEditingConfig(data.currentConfig || {});
    } catch (error: any) {
      setEditingConfig({});
      showToast(error?.message || 'Failed to load config', 'error');
    }
    setShowConfigModal(true);
  };

  const saveConfig = async () => {
    if (!selectedComponent) return;

    try {
      const res = await fetch(`/api/jana/site-components/config/${selectedComponent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component_config: editingConfig })
      });

      if (res.ok) {
        showToast('✅ Configuration saved', 'success');
        setShowConfigModal(false);
        fetchComponents();
      } else {
        showToast('Failed to save config', 'error');
      }
    } catch (error) {
      showToast('Error saving config', 'error');
    }
  };

  const resetConfig = async () => {
    if (!selectedComponent) return;
    if (!confirm('Reset to default configuration?')) return;

    try {
      const res = await fetch(`/api/jana/site-components/config/${selectedComponent.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('✅ Configuration reset', 'success');
        setEditingConfig({});
        setShowConfigModal(false);
        fetchComponents();
      }
    } catch (error) {
      showToast('Error resetting config', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  boxShadow: '0 8px 20px rgba(212,175,55,0.4)'
                }}>
                  📦
                </div>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
                    Component Library
                  </h1>
                  <p style={{ opacity: 0.85, fontSize: '0.95rem', color: '#cbd5e1', margin: 0 }}>
                    Create, manage, and reuse components across your site
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                color: '#0f172a',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(212,175,55,0.4)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(212,175,55,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(212,175,55,0.4)';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>+</span>
              Create Component
            </button>
          </div>
        </div>

        {/* Stats Bar */}
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
              Total Components
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>
              {components.length}
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
              Active
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e' }}>
              {components.filter(c => Boolean(c.enabled ?? c.is_active)).length}
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
              Carousels
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37' }}>
              {components.filter(c => (c.type || c.key || '').toString().includes('carousel')).length}
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
              Blog Sidebars
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6' }}>
              {components.filter(c => (c.type || c.key || '').toString().includes('blog')).length}
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
            { key: 'all', label: `All`, icon: '📦', count: components.length },
            { key: 'carousel', label: 'Carousels', icon: '🎬', count: components.filter(c => (c.type || c.key || '').toString().includes('carousel')).length },
            { key: 'blog_sidebar', label: 'Blog Sidebars', icon: '📰', count: components.filter(c => (c.type || c.key || '').toString().includes('blog')).length }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key)}
              style={{
                padding: '0.6rem 1.2rem',
                background: filterType === filter.key ? 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)' : '#f8fafc',
                color: filterType === filter.key ? '#0f172a' : '#64748b',
                border: filterType === filter.key ? 'none' : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (filterType !== filter.key) {
                  e.currentTarget.style.background = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== filter.key) {
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
              <span style={{
                background: filterType === filter.key ? 'rgba(15,23,42,0.15)' : '#e2e8f0',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Components Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem' }}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading components...</p>
          </div>
        ) : components.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '5rem 3rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>📦</div>
            <h3 style={{ color: '#0f172a', marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>No Components Yet</h3>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem' }}>
              Create your first reusable component to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '1rem 2.5rem',
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                color: '#0f172a',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(212,175,55,0.3)'
              }}
            >
              Create Your First Component
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {components.map(comp => (
              <div
                key={comp.id}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: Boolean(comp.enabled ?? comp.is_active) ? '2px solid #22c55e' : '2px solid #e2e8f0',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{
                    width: '72px',
                    height: '72px',
                    background: getGradient(comp.type),
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    flexShrink: 0,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                  }}>
                    {getIcon(comp.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                        {comp.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          padding: '0.4rem 0.9rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'capitalize'
                        }}>
                          {String(comp.type ?? comp.key ?? '').replace(/_/g, ' ')}
                        </span>
                        <span style={{
                          padding: '0.4rem 0.9rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          {comp.category}
                        </span>
                        <span style={{
                          padding: '0.4rem 0.9rem',
                          background: Boolean(comp.is_global) ? '#dcfce7' : '#fef3c7',
                          color: Boolean(comp.is_global) ? '#166534' : '#92400e',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          {Boolean(comp.is_global) ? '🌐 Global' : '🔒 Private'}
                        </span>
                        <span style={{
                          padding: '0.4rem 0.9rem',
                          background: Boolean(comp.enabled ?? comp.is_active) ? '#dcfce7' : '#fee2e2',
                          color: Boolean(comp.enabled ?? comp.is_active) ? '#166534' : '#991b1b',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          {Boolean(comp.enabled ?? comp.is_active) ? '✓ Active' : '✗ Inactive'}
                        </span>
                        <span style={{
                          padding: '0.4rem 0.9rem',
                          background: Boolean(getComponentConfig(comp).minisite_access) ? '#dcfce7' : '#fef3c7',
                          color: Boolean(getComponentConfig(comp).minisite_access) ? '#166534' : '#92400e',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          {Boolean(getComponentConfig(comp).minisite_access) ? '🧩 Minisite enabled' : '🔒 Hidden from minisites'}
                        </span>
                      </div>
                    </div>

                    {comp.description && (
                      <p style={{ color: '#64748b', margin: '0 0 1rem 0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {comp.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#64748b', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: 600 }}>📊 Used {comp.usage_count ?? 0} {((comp.usage_count ?? 0) === 1 ? 'time' : 'times')}</span>
                      <span style={{ fontWeight: 600 }}>📅 Created {comp.created_at ? new Date(comp.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                    {comp.manager_url ? (
                      <Link
                        href={`${comp.manager_url}${comp.manager_url.includes('?') ? '&' : '?'}componentId=${encodeURIComponent(comp.id)}`}
                        style={{
                          padding: '0.7rem 1.5rem',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                          color: '#fff',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 8px rgba(59,130,246,0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(59,130,246,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(59,130,246,0.3)';
                        }}
                      >
                        🔧 Deep Edit
                      </Link>
                    ) : (
                      <button
                        onClick={() => openConfigEditor(comp)}
                        style={{
                          padding: '0.7rem 1.5rem',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 8px rgba(59,130,246,0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        ✏️ Edit Config
                      </button>
                    )}
                    <button
                      onClick={() => openConfigEditor(comp)}
                      style={{
                        padding: '0.7rem 1.5rem',
                        background: '#e2e8ff',
                        color: '#1e3a8a',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 8px rgba(59,130,246,0.12)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      ⚙️ Configure
                    </button>
                    <button
                      onClick={() => toggleActive(comp.id, !Boolean(comp.enabled ?? comp.is_active))}
                      style={{
                        padding: '0.7rem 1.5rem',
                        background: Boolean(comp.enabled ?? comp.is_active) ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' : 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: Boolean(comp.enabled ?? comp.is_active) ? '0 4px 8px rgba(239,68,68,0.3)' : '0 4px 8px rgba(34,197,94,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {Boolean(comp.enabled ?? comp.is_active) ? '⏸️ Disable' : '▶️ Enable'}
                    </button>
                    <button
                      onClick={() => toggleMinisiteAccess(comp)}
                      style={{
                        padding: '0.7rem 1.5rem',
                        background: Boolean(getComponentConfig(comp).minisite_access) ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' : 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 8px rgba(100,116,139,0.2)'
                      }}
                    >
                      {Boolean(getComponentConfig(comp).minisite_access) ? '🧩 Allow on Minisite' : '🔒 Hide from Minisite'}
                    </button>
                    <button
                      onClick={() => deleteComponent(comp.id)}
                      style={{
                        padding: '0.7rem 1.5rem',
                        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 8px rgba(220,38,38,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div style={{
          marginTop: '3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <Link
            href="/jana/hero-carousel"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
              padding: '2rem',
              borderRadius: '16px',
              textDecoration: 'none',
              color: '#0f172a',
              boxShadow: '0 8px 20px rgba(212,175,55,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(212,175,55,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(212,175,55,0.3)';
            }}
          >
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              🎬 Create Carousel
            </h3>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
              Build a carousel and save to library
            </p>
          </Link>

          <Link
            href="/jana/blog/sidebar-builder"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              padding: '2rem',
              borderRadius: '16px',
              textDecoration: 'none',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(59,130,246,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(59,130,246,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)';
            }}
          >
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              📰 Create Blog Sidebar
            </h3>
            <p style={{ margin: 0, opacity: 0.95, fontSize: '0.95rem' }}>
              Design sidebar and save to library
            </p>
          </Link>

          <Link
            href="/jana/website"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
              padding: '2rem',
              borderRadius: '16px',
              textDecoration: 'none',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(139,92,246,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.3)';
            }}
          >
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              🏗️ Open Site Builder
            </h3>
            <p style={{ margin: 0, opacity: 0.95, fontSize: '0.95rem' }}>
              Assign components to pages
            </p>
          </Link>
        </div>

        {/* Create Data-Bound Component Modal */}
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 800 }}>Create Data-Bound Component</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Bind a layout component directly to a business form field.</p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name');
                const type = formData.get('type');
                const sourceField = formData.get('sourceField');

                const source = typeof sourceField === 'string' ? sourceField : '';
                const res = await fetch('/api/jana/component-library', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name,
                    type,
                    category: 'dynamic',
                    is_global: true,
                    config: {
                      dataSource: source.startsWith('section:') ? 'form_section' : 'form_field',
                      sourceField: source.replace('section:', ''),
                      displayStyle: type === 'carousel' ? 'slider' : 'grid'
                    }
                  })
                });
                if (res.ok) {
                  setShowCreateModal(false);
                  loadComponents();
                } else {
                  alert('Failed to save component');
                }
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Component Name</label>
                  <input required name="name" type="text" placeholder="e.g. Master Hotel Gallery" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Component Type</label>
                  <select required name="type" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}>
                    <option value="carousel">Carousel (Mixed Media: Images & Videos)</option>
                    <option value="blog">Blog (Text / Mini-Blogs)</option>
                    <option value="gallery">Gallery (Grid)</option>
                    <option value="map">Interactive Map (Location / Google Maps)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Bind to Form Data</label>
                  <select required name="sourceField" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}>
                    <option value="">-- Select a Data Source --</option>
                    <optgroup label="Entire Form Sections">
                      {dataSources.sections.map(s => (
                        <option key={`section:${s.id}`} value={`section:${s.id}`}>
                          Section: {s.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Specific Form Fields">
                      {dataSources.fields.map(f => (
                        <option key={f.name} value={f.name}>
                          Field: {f.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <small style={{ color: '#64748b', display: 'block', marginTop: '0.5rem', lineHeight: '1.4' }}>Bind this component to an entire Section (each entry becomes a slide/post) or a specific Field.</small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>Create Component</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
