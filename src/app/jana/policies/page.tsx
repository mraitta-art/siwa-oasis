'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface VisibilityPolicy {
  id: string;
  name: string;
  description: string;
  role: string;
  allowed_fields: string[];
}

interface Section {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  is_universal: boolean;
  curation_policy?: string;
}

interface BusinessType {
  id: string;
  name: string;
  is_parent: boolean;
  parent_id?: string | null;
  sections: string[];
  own_sections: string[];
}

interface Field {
  id: string;
  name: string;
  label: string;
  field_type: string;
  section_id: string;
  business_type_id: string;
  required: boolean;
  vendor_editable: boolean;
  show_on_public: boolean;
  required_feature?: string;
}

interface Override {
  id: string;
  business_id: string;
  business_name: string;
  section_id: string;
  section_name: string;
  custom_label?: string;
  admin_locked_label?: number;
  admin_hidden?: number;
  admin_disabled?: number;
  cta_phone?: string;
}

const css = {
  input: (): React.CSSProperties => ({
    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
    background: '#fff', color: '#1e293b',
  }),
  label: (): React.CSSProperties => ({
    fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8',
    letterSpacing: '1.5px', textTransform: 'uppercase' as const,
    marginBottom: '0.4rem', display: 'block',
  }),
  btn: (color: string, light = false): React.CSSProperties => ({
    padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontWeight: 900, fontSize: '0.75rem', transition: 'all 0.2s',
    background: light ? `${color}15` : color,
    color: light ? color : '#fff',
    boxShadow: light ? 'none' : `0 4px 12px ${color}40`,
  }),
};

export default function PoliciesDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'search_policies' | 'fields' | 'overrides'>('matrix');
  const [policies, setPolicies] = useState<VisibilityPolicy[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<VisibilityPolicy> | null>(null);

  // Search/Filters states
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldSectionFilter, setFieldSectionFilter] = useState('');
  const [overrideSearch, setOverrideSearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [policiesRes, fieldsRes, sectionsRes, typesRes] = await Promise.all([
        fetch('/api/jana/policies?t=' + Date.now()),
        fetch('/api/jana/forms?t=' + Date.now()),
        fetch('/api/jana/sections?t=' + Date.now()),
        fetch('/api/jana/types?t=' + Date.now()),
      ]);

      if (policiesRes.ok) {
        const data = await policiesRes.json();
        setPolicies(data.policies || []);
        setOverrides(data.overrides || []);
      }
      if (fieldsRes.ok) {
        setFields(await fieldsRes.json());
      }
      if (sectionsRes.ok) {
        setSections(await sectionsRes.json());
      }
      if (typesRes.ok) {
        setBusinessTypes(await typesRes.json());
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
    setLoading(false);
  }

  async function savePolicy() {
    if (!editing?.id || !editing?.name) return;
    setSaving(true);
    const isNew = !policies.find(p => p.id === editing.id);
    const res = await fetch('/api/jana/policies', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await loadAllData();
    }
    setSaving(false);
  }

  async function deletePolicy(id: string) {
    if (!confirm('Are you sure you want to delete this visibility policy?')) return;
    setSaving(true);
    const res = await fetch(`/api/jana/policies?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadAllData();
    }
    setSaving(false);
  }

  const toggleFieldInPolicy = (fieldKey: string) => {
    const current = editing?.allowed_fields || [];
    const next = current.includes(fieldKey)
      ? current.filter(k => k !== fieldKey)
      : [...current, fieldKey];
    setEditing({ ...editing, allowed_fields: next });
  };

  // Helper to check if a section is active for a business type
  const isSectionAssignedToType = (sectionId: string, type: BusinessType) => {
    if (sections.find(s => s.id === sectionId)?.is_universal) return true;
    const list = type.is_parent ? type.sections : type.own_sections;
    return Array.isArray(list) && list.includes(sectionId);
  };

  // Filters for fields table
  const filteredFields = fields.filter(f => {
    const matchesSearch = f.label.toLowerCase().includes(fieldSearch.toLowerCase()) || 
                          f.name.toLowerCase().includes(fieldSearch.toLowerCase());
    const matchesSection = !fieldSectionFilter || f.section_id === fieldSectionFilter;
    return matchesSearch && matchesSection;
  });

  // Filters for overrides table
  const filteredOverrides = overrides.filter(o => 
    o.business_name.toLowerCase().includes(overrideSearch.toLowerCase()) || 
    (o.section_name || '').toLowerCase().includes(overrideSearch.toLowerCase())
  );

  // Quick stats calculations
  const totalFields = fields.length;
  const totalSections = sections.length;
  const totalOverrides = overrides.length;
  const totalPolicies = policies.length;

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-shield-alt fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '1rem' }} />
          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85rem' }}>LOADING GOVERNANCE MATRIX...</div>
        </div>
      </div>
    );
  }

  const cssTab = (active: boolean) => ({
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: '0.72rem',
    letterSpacing: '0.5px',
    transition: 'all 0.2s',
    background: active ? '#D4AF37' : '#fff',
    color: active ? '#fff' : '#64748b',
    boxShadow: active ? '0 4px 12px rgba(212,175,55,0.25)' : 'none',
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderColor: active ? '#D4AF37' : '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  });

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', padding: '2.5rem' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.85rem', color: '#0f172a' }}>
              🛡️ Policy & <span style={{ color: '#D4AF37' }}>Governance Dashboard</span>
            </h1>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Bulls-eye governance matrix for listing components, field visibilities, curation rules, and active overrides.
            </p>
          </div>
          <div>
            <Link href="/jana/sections" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
              <i className="fas fa-cog" /> SECTION ARCHITECT
            </Link>
          </div>
        </header>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Fields Registered', value: totalFields, icon: 'fa-list-alt', color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Content Chapters', value: totalSections, icon: 'fa-layer-group', color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'Custom Business Overrides', value: totalOverrides, icon: 'fa-user-cog', color: '#10b981', bg: '#ecfdf5' },
            { label: 'Target Role Policies', value: totalPolicies, icon: 'fa-user-shield', color: '#eab308', bg: '#fefce8' },
          ].map((stat, idx) => (
            <div key={idx} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                <i className={`fas ${stat.icon}`} />
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem' }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { key: 'matrix', label: 'Section Matrix Map', icon: 'fa-th-large' },
            { key: 'fields', label: 'Fields Directory', icon: 'fa-list' },
            { key: 'search_policies', label: 'Role Visibility Engine', icon: 'fa-eye' },
            { key: 'overrides', label: 'Business Overrides', icon: 'fa-sliders-h' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              style={cssTab(activeSubTab === tab.key)}
            >
              <i className={`fas ${tab.icon}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB CONTENT: MATRIX MAP ──────────────────────────────── */}
        {activeSubTab === 'matrix' && (
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Typology Assignment Matrix</h3>
            <p style={{ margin: '0 0 2rem 0', fontSize: '0.75rem', color: '#64748b' }}>
              Bulls-eye mapping showing which active chapters are enabled or inherited across all business typologies.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business Typology</th>
                    {sections.map(s => (
                      <th key={s.id} style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                        <i className={`fas ${s.icon}`} style={{ display: 'block', color: '#D4AF37', fontSize: '0.9rem', marginBottom: '0.25rem' }} />
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {businessTypes.map(type => (
                    <tr key={type.id} style={{ borderBottom: '1px solid #f1f5f9', background: type.is_parent ? '#f8fafc' : '#fff' }}>
                      <td style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: type.is_parent ? '#0f172a' : '#475569' }}>
                          {type.is_parent ? '📂' : '└─'} {type.name}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.2rem', fontFamily: 'monospace' }}>{type.id}</span>
                      </td>
                      {sections.map(sec => {
                        const assigned = isSectionAssignedToType(sec.id, type);
                        return (
                          <td key={sec.id} style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                            {assigned ? (
                              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#10b981', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <i className="fas fa-check" /> ON
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', opacity: 0.4 }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: FIELDS DIRECTORY ────────────────────────── */}
        {activeSubTab === 'fields' && (
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Global Fields Governance Directory</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Search and audit properties, validation rules, public visibilities, and tier-gating rules for all form fields.</p>
              </div>
              
              {/* Search & Filter bar */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  placeholder="Search fields key or label..." 
                  value={fieldSearch} 
                  onChange={e => setFieldSearch(e.target.value)} 
                  style={{ ...css.input(), width: '220px', padding: '0.5rem 0.85rem', fontSize: '0.75rem' }} 
                />
                <select 
                  value={fieldSectionFilter} 
                  onChange={e => setFieldSectionFilter(e.target.value)} 
                  style={{ ...css.input(), width: '180px', padding: '0.5rem 0.85rem', fontSize: '0.75rem' }}
                >
                  <option value="">-- All Sections --</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Field Label / Key</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section Chapter</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Field Type</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Required</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Vendor Editable</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Public Visible</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Feature / Tier Lock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFields.map(field => (
                    <tr key={field.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>{field.label}</div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.15rem' }}>{field.name}</div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#475569' }}>
                        {sections.find(s => s.id === field.section_id)?.name || field.section_id}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                          {field.field_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: field.required ? '#ef4444' : '#94a3b8' }}>
                          {field.required ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: field.vendor_editable ? '#10b981' : '#f59e0b' }}>
                          {field.vendor_editable ? 'YES' : 'ADMIN_ONLY'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {field.show_on_public ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#dcfce7', color: '#10b981', padding: '2px 8px', borderRadius: '6px' }}>PUBLIC</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '6px' }}>HIDDEN</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {field.required_feature ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ca8a04', background: '#fef9c3', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fas fa-lock" /> {field.required_feature}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>None (Free Tiers Allowed)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredFields.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
                        No fields found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: SEARCH/VISIBILITY POLICIES ──────────────── */}
        {activeSubTab === 'search_policies' && (
          <>
            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Role Visibility Policies</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Define target permission rules for public users, guests, salespeople, or supporting agents.</p>
                </div>
                <button onClick={() => setEditing({ id: '', name: '', description: '', role: 'public', allowed_fields: [] })} style={{ ...cssTab(false), background: '#10b981', color: '#fff', borderColor: '#10b981' }}>
                  <i className="fas fa-plus" /> New Policy
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
                {policies.map(policy => (
                  <div key={policy.id} style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#1e293b' }}>{policy.name}</h4>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                          ID: <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{policy.id}</code> · Role: <strong style={{ color: '#D4AF37' }}>{policy.role.toUpperCase()}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => setEditing(policy)} style={{ border: 'none', background: '#f1f5f9', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', color: '#6366f1' }}>Edit</button>
                        {!['sa', 'ca', 'sm', 'sa2', 's', 'v', 'p'].includes(policy.id) && (
                          <button onClick={() => deletePolicy(policy.id)} style={{ border: 'none', background: '#fee2e2', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', color: '#ef4444' }}>Delete</button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{policy.description || 'No description provided.'}</p>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Allowed Fields Access</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {policy.allowed_fields.includes('*') ? (
                          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#10b981', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>FULL ACCESS (*)</span>
                        ) : (
                          <>
                            {policy.allowed_fields.map(f => (
                              <span key={f} style={{ fontSize: '0.6rem', fontWeight: 800, color: '#4f46e5', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>{f}</span>
                            ))}
                            {policy.allowed_fields.length === 0 && (
                              <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ef4444', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>BLOCKED ACCESS</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal editing visibility policies */}
            {editing && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '2px' }}>POLICY BUILDER</div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{editing.id ? 'Edit Visibility Policy' : 'Create Custom Policy'}</h3>
                    </div>
                    <button onClick={() => setEditing(null)} style={{ width: 36, height: 36, borderRadius: '10px', background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      <i className="fas fa-times" />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Policy ID</label>
                        <input style={css.input()} value={editing.id || ''} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={policies.some(p => p.id === editing.id)} placeholder="e.g. guest_limited" />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Target Role</label>
                        <select style={css.input()} value={editing.role || 'public'} onChange={e => setEditing({ ...editing, role: e.target.value })}>
                          <option value="public">Public (Guest)</option>
                          <option value="vendor">Vendor (Paid User)</option>
                          <option value="salesman">Salesman</option>
                          <option value="support_agent">Support Agent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Policy Name</label>
                      <input style={css.input()} value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Limited Guest View" />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Description</label>
                      <textarea style={{ ...css.input(), minHeight: '60px' }} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="State the purpose of this rule matrix..." />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Whitelisted Allowed Fields</label>
                      <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', background: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', gridColumn: '1 / -1' }}>
                            <input type="checkbox" checked={editing.allowed_fields?.includes('*')} onChange={() => toggleFieldInPolicy('*')} />
                            <strong style={{ fontSize: '0.72rem', color: '#15803d' }}>* GRANT FULL ACCESS (ALL FIELDS)</strong>
                          </label>
                          
                          {Array.from(new Set(fields.map(f => f.name))).map(fieldName => {
                            const field = fields.find(f => f.name === fieldName);
                            const label = field?.label || fieldName;
                            const isChecked = editing.allowed_fields?.includes(fieldName) || editing.allowed_fields?.includes('*');
                            return (
                              <label key={fieldName} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem 0.6rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.7rem', color: '#475569' }}>
                                <input type="checkbox" checked={isChecked} onChange={() => toggleFieldInPolicy(fieldName)} disabled={editing.allowed_fields?.includes('*')} />
                                <span>{label} <small style={{ color: '#94a3b8' }}>({fieldName})</small></span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
                      <button onClick={() => setEditing(null)} style={{ ...css.btn('#e2e8f0', true), flex: 1, color: '#64748b' }}>Cancel</button>
                      <button onClick={savePolicy} disabled={saving} style={{ ...css.btn('#1e293b'), flex: 1 }}>
                        {saving ? 'Saving...' : 'Save Policy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── TAB CONTENT: BUSINESS OVERRIDES ──────────────────────── */}
        {activeSubTab === 'overrides' && (
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Active Custom Business Overrides</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Audit custom configurations, telephone overrides, locked tabs, and disabled sections per individual business.</p>
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Filter by business name..." 
                  value={overrideSearch} 
                  onChange={e => setOverrideSearch(e.target.value)} 
                  style={{ ...css.input(), width: '250px', padding: '0.5rem 0.85rem', fontSize: '0.75rem' }} 
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section Chapter</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Custom Label</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Force Hidden</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Vendor Locked</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CTA Phone Override</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverrides.map(override => (
                    <tr key={override.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>{override.business_name}</div>
                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.15rem' }}>ID: {override.business_id}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                          {override.section_name || override.section_id}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        {override.custom_label ? (
                          <span style={{ fontSize: '0.72rem', color: '#1e293b', fontWeight: 800, background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                            "{override.custom_label}"
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Default</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        {override.admin_hidden === 1 ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#fee2e2', color: '#ef4444', padding: '3px 8px', borderRadius: '6px' }}>HIDDEN</span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        {override.admin_disabled === 1 ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#fff3cd', color: '#856404', padding: '3px 8px', borderRadius: '6px' }}>LOCKED</span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        {override.cta_phone ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <i className="fas fa-phone-alt" /> {override.cta_phone}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Default Phone</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                        <Link href={`/jana/businesses/${override.business_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#6366f1', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 900, textDecoration: 'none' }}>
                          <i className="fas fa-edit" /> Manage Overrides
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredOverrides.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
                        No business overrides configured in the registry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
