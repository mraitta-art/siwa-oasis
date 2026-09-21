'use client';

/**
 * Page Templates Manager
 * Admins can create and govern page templates for vendors to use in their mini-sites
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface TemplateItem {
  id: string;
  name: string;
  tier?: string;
  description?: string;
  components: any[];
  isActive?: boolean;
  allowComponentReorder?: boolean;
  allowStyleCustomization?: boolean;
}

export default function PageTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier: 'free',
    selectedSections: [] as string[],
    allowComponentReorder: true,
    allowStyleCustomization: true,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/jana/page-builder/templates?t=' + Date.now()),
        fetch('/api/jana/sections?t=' + Date.now()),
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      setTemplates(Array.isArray(tData) ? tData : []);
      setSections(Array.isArray(sData) ? sData : []);
    } catch {
      notify('Failed to load templates', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      tier: 'free',
      selectedSections: sections.slice(0, 3).map(s => s.id),
      allowComponentReorder: true,
      allowStyleCustomization: true,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (tmpl: TemplateItem) => {
    setEditingTemplate(tmpl);
    const existingSecIds = (tmpl.components || [])
      .map(c => c.props?.sectionId || c.id?.replace('section-', ''))
      .filter(Boolean);

    setFormData({
      name: tmpl.name || '',
      description: tmpl.description || '',
      tier: tmpl.tier || 'free',
      selectedSections: existingSecIds.length > 0 ? existingSecIds : sections.slice(0, 3).map(s => s.id),
      allowComponentReorder: tmpl.allowComponentReorder !== false,
      allowStyleCustomization: tmpl.allowStyleCustomization !== false,
      isActive: tmpl.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notify('Template name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const components = formData.selectedSections.map((secId, idx) => ({
        id: `section-${secId}`,
        type: 'section_block',
        order: idx,
        props: { sectionId: secId }
      }));

      const body = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        tier: formData.tier,
        components,
        isActive: formData.isActive,
        allowComponentReorder: formData.allowComponentReorder,
        allowStyleCustomization: formData.allowStyleCustomization,
      };

      const url = editingTemplate
        ? `/api/jana/page-builder/templates/${editingTemplate.id}`
        : '/api/jana/page-builder/templates';

      const method = editingTemplate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Save failed');

      notify(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
      setModalOpen(false);
      await loadAll();
    } catch {
      notify('Failed to save template', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      const res = await fetch(`/api/jana/page-builder/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Template deleted');
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        notify('Failed to delete', 'error');
      }
    } catch {
      notify('Failed to delete', 'error');
    }
  };

  const toggleSectionSelection = (secId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSections: prev.selectedSections.includes(secId)
        ? prev.selectedSections.filter(id => id !== secId)
        : [...prev.selectedSections, secId]
    }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px' }}>LOADING TEMPLATES…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '2rem' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '2rem', zIndex: 9999,
          padding: '1rem 1.75rem', borderRadius: '14px', fontWeight: 800, fontSize: '0.85rem',
          background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', animation: 'slideDown 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Link href="/jana" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800 }}>
                ← Admin Hub
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>Minisite Governance</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
              📋 Page & Minisite Templates
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Create and govern pre-built templates that vendors can use in their minisites.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={openCreateModal}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#D4AF37', color: '#0f172a', border: 'none', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(212,175,55,0.25)' }}
            >
              <i className="fas fa-plus" /> Create Template
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <i className="fas fa-shield-halved" style={{ color: '#D4AF37', fontSize: '1.2rem', marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, color: '#D4AF37', fontSize: '0.9rem' }}>Governance: Pre-built Structure for Vendors</div>
            <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.6, marginTop: '0.2rem' }}>
              Templates define the approved structure that vendors can adopt for their minisites. Vendors customize content and imagery within these boundaries while preserving platform brand consistency.
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {templates.map(tmpl => {
            const tierColors: Record<string, { bg: string; text: string }> = {
              free: { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8' },
              basic: { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
              pro: { bg: 'rgba(212,175,55,0.2)', text: '#D4AF37' },
              premium: { bg: 'rgba(168,85,247,0.2)', text: '#c084fc' },
            };
            const tierBadge = tierColors[tmpl.tier || 'free'] || tierColors.free;

            return (
              <div
                key={tmpl.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                      {tmpl.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', minHeight: '34px' }}>
                      {tmpl.description || 'Standard layout template for registered oasis vendors.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: tierBadge.bg, color: tierBadge.text, textTransform: 'uppercase' }}>
                      {tmpl.tier || 'Free'} Tier
                    </span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: tmpl.isActive !== false ? '#10b981' : '#ef4444' }}>
                      {tmpl.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '0.85rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>SECTIONS</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>{tmpl.components?.length || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>REORDER</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: tmpl.allowComponentReorder !== false ? '#10b981' : '#64748b', marginTop: '2px' }}>
                      {tmpl.allowComponentReorder !== false ? '✓ YES' : '✗ NO'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>CUSTOM STYLES</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: tmpl.allowStyleCustomization !== false ? '#10b981' : '#64748b', marginTop: '2px' }}>
                      {tmpl.allowStyleCustomization !== false ? '✓ YES' : '✗ NO'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => openEditModal(tmpl)}
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    <i className="fas fa-edit" style={{ marginRight: '0.4rem' }} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id, tmpl.name)}
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    title="Delete Template"
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </div>
            );
          })}

          {templates.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', background: '#1e293b', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)' }}>
              <i className="fas fa-layer-group fa-3x" style={{ color: '#64748b', marginBottom: '1rem', display: 'block' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>No Templates Created Yet</div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
                Click "Create Template" to define your first structural layout for vendor minisites.
              </p>
              <button
                onClick={openCreateModal}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#D4AF37', color: '#0f172a', border: 'none', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                + Create Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#1e293b', borderRadius: '24px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '2px' }}>MINISITE TEMPLATE ARCHITECT</div>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Eco-Lodge Standard, Safari Camp Premium"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of when vendors should use this template…"
                  style={{ width: '100%', minHeight: '70px', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Required Subscription Tier
                </label>
                <select
                  value={formData.tier}
                  onChange={e => setFormData(f => ({ ...f, tier: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="free">Free Tier (Standard)</option>
                  <option value="basic">Basic Tier</option>
                  <option value="pro">Pro Tier (Gold)</option>
                  <option value="premium">Premium Tier (Diamond VIP)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Included Sections ({formData.selectedSections.length} selected)
                </label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.5rem' }}>
                  {sections.map(sec => {
                    const isChecked = formData.selectedSections.includes(sec.id);
                    return (
                      <label
                        key={sec.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.45rem 0.6rem', borderRadius: '8px', cursor: 'pointer',
                          background: isChecked ? 'rgba(212,175,55,0.12)' : 'transparent',
                          marginBottom: '2px', transition: 'background 0.15s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSectionSelection(sec.id)}
                          style={{ accentColor: '#D4AF37', width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isChecked ? '#D4AF37' : '#cbd5e1' }}>
                          {sec.name}
                        </span>
                        {sec.is_universal && (
                          <span style={{ fontSize: '0.6rem', color: '#60a5fa', marginLeft: 'auto' }}>🌐 Universal</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={formData.allowComponentReorder}
                    onChange={e => setFormData(f => ({ ...f, allowComponentReorder: e.target.checked }))}
                    style={{ accentColor: '#D4AF37' }}
                  />
                  Allow Vendor to Reorder Sections
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={formData.allowStyleCustomization}
                    onChange={e => setFormData(f => ({ ...f, allowStyleCustomization: e.target.checked }))}
                    style={{ accentColor: '#D4AF37' }}
                  />
                  Allow Custom Colors & Styles
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#D4AF37', color: '#0f172a', fontWeight: 900, cursor: 'pointer' }}
                >
                  {saving ? 'Saving…' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
