'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const ALL_SECTIONS = [
  { id: 'sec_1_identity',            name: 'Identity & Heritage',            icon: 'fa-landmark',      tier: 'free' },
  { id: 'sec_2_ambience',            name: 'Design & Ambience',              icon: 'fa-sun',           tier: 'free' },
  { id: 'sec_3_facilities',          name: 'Infrastructure & Pools',         icon: 'fa-swimming-pool', tier: 'basic' },
  { id: 'sec_4_gastronomy',          name: 'Culinary Craft',                 icon: 'fa-utensils',      tier: 'basic' },
  { id: 'sec_5_experiences',         name: 'Experiences & Programs',         icon: 'fa-hiking',        tier: 'basic' },
  { id: 'sec_6_guardian',            name: 'Sustainability DNA',             icon: 'fa-leaf',          tier: 'basic' },
  { id: 'sec_7_investment',          name: 'Business & Investment',          icon: 'fa-chart-line',    tier: 'premium' },
  { id: 'sec_8_connector',           name: 'Rates, Offers & Access',         icon: 'fa-tags',          tier: 'premium' },
  { id: 'sec_9_marketplace_catalog', name: 'Marketplace & Products Catalog', icon: 'fa-store',         tier: 'premium' },
  { id: 'sec_10_testimonials_faqs',  name: 'Testimonials & FAQs',            icon: 'fa-comments',      tier: 'premium' },
];

const TIER_ORDER = ['free', 'basic', 'premium', 'gold', 'vip'];
const TIER_COLORS: Record<string, string> = {
  free: '#64748b', basic: '#3b82f6', premium: '#D4AF37', gold: '#f59e0b', vip: '#8b5cf6'
};

interface Business {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  type_name: string;
  admin_overrides: any;
}

export default function AdminOverridesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Business | null>(null);
  const [overrideSections, setOverrideSections] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/admin-overrides');
      if (res.ok) setBusinesses(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const openBusiness = (biz: Business) => {
    setSelected(biz);
    const overrides = biz.admin_overrides || {};
    setOverrideSections(Array.isArray(overrides.allowed_sections) ? overrides.allowed_sections : []);
    setNote(overrides.note || '');
    setSaveMsg('');
  };

  const toggleSection = (sectionId: string) => {
    setOverrideSections(prev =>
      prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]
    );
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/jana/admin-overrides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selected.id, allowed_sections: overrideSections, note })
      });
      if (res.ok) {
        setSaveMsg('✅ Overrides saved successfully!');
        fetchBusinesses();
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg('❌ Save failed. Please try again.');
      }
    } catch (e) { setSaveMsg('❌ Network error'); }
    setSaving(false);
  };

  const clearOverrides = async () => {
    if (!selected || !confirm(`Clear all overrides for ${selected.name}?`)) return;
    const res = await fetch(`/api/jana/admin-overrides?businessId=${selected.id}`, { method: 'DELETE' });
    if (res.ok) {
      setOverrideSections([]);
      setNote('');
      setSaveMsg('✅ Overrides cleared.');
      fetchBusinesses();
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  // Determine if a section is in the business's tier by default
  const tierSections = (tier: string): string[] => {
    const FREE = ['sec_1_identity', 'sec_2_ambience'];
    const BASIC = [...FREE, 'sec_3_facilities', 'sec_4_gastronomy', 'sec_5_experiences', 'sec_6_guardian'];
    const PREMIUM = [...BASIC, 'sec_7_investment', 'sec_8_connector', 'sec_9_marketplace_catalog', 'sec_10_testimonials_faqs'];
    if (['vip', 'gold', 'premium'].includes(tier)) return PREMIUM;
    if (tier === 'basic') return BASIC;
    return FREE;
  };

  const filtered = businesses.filter(b => {
    if (tierFilter && b.subscription_tier !== tierFilter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasCustomOverrides = (biz: Business) => {
    const ov = biz.admin_overrides;
    return ov && Array.isArray(ov.allowed_sections) && ov.allowed_sections.length > 0;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: "'Inter', sans-serif" }}>

      {/* LEFT: Business list */}
      <div style={{ width: '380px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <i className="fas fa-arrow-left"></i> ADMIN PANEL
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
            <i className="fas fa-shield-alt" style={{ color: '#D4AF37', marginRight: '0.75rem' }}></i>
            Section Overrides
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>
            Grant vendors access to premium sections outside their tier.
          </p>
        </div>

        {/* Filters */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text" placeholder="Search by name..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
          />
          <select
            value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
          >
            <option value="">All Tiers</option>
            {TIER_ORDER.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>

        {/* Business list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#D4AF37' }}>
              <i className="fas fa-circle-notch fa-spin fa-2x"></i>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.85rem' }}>No businesses found</div>
          ) : filtered.map(biz => {
            const isActive = selected?.id === biz.id;
            const hasOv = hasCustomOverrides(biz);
            const color = TIER_COLORS[biz.subscription_tier] || '#64748b';
            return (
              <button
                key={biz.id}
                onClick={() => openBusiness(biz)}
                style={{
                  width: '100%', padding: '1rem 1.5rem', background: isActive ? 'rgba(212,175,55,0.05)' : 'transparent',
                  border: 'none', borderLeft: isActive ? '3px solid #D4AF37' : '3px solid transparent',
                  textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color, letterSpacing: '0.5px' }}>{biz.subscription_tier?.toUpperCase().slice(0, 3)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#fff' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{biz.type_name || 'Business'}</div>
                </div>
                {hasOv && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} title="Has admin overrides"></div>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.65rem', color: '#475569' }}>
          {filtered.length} businesses • {filtered.filter(hasCustomOverrides).length} with overrides
        </div>
      </div>

      {/* RIGHT: Override editor */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selected ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', opacity: 0.4 }}>
            <i className="fas fa-shield-alt fa-4x" style={{ color: '#D4AF37' }}></i>
            <div style={{ fontWeight: 900, letterSpacing: '3px', fontSize: '0.8rem' }}>SELECT A BUSINESS</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Choose a business from the list to manage its section overrides</div>
          </div>
        ) : (
          <div style={{ padding: '2.5rem', maxWidth: '800px' }}>
            
            {/* Business Header */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', letterSpacing: '2px', marginBottom: '0.5rem' }}>MANAGING OVERRIDES FOR</div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{selected.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, background: `${TIER_COLORS[selected.subscription_tier]}20`, color: TIER_COLORS[selected.subscription_tier], padding: '4px 12px', borderRadius: '8px', border: `1px solid ${TIER_COLORS[selected.subscription_tier]}40` }}>
                    {selected.subscription_tier?.toUpperCase()} TIER
                  </span>
                  <Link href={`/p/${selected.slug}`} target="_blank" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.7rem' }}>
                    <i className="fas fa-external-link-alt" style={{ marginRight: '0.3rem' }}></i>VIEW MINISITE
                  </Link>
                </div>
              </div>
              {selected.admin_overrides?.granted_by && (
                <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#475569' }}>
                  <div>Last override by:</div>
                  <div style={{ color: '#94a3b8', fontWeight: 700 }}>{selected.admin_overrides.granted_by}</div>
                  <div>{new Date(selected.admin_overrides.granted_at || '').toLocaleDateString()}</div>
                </div>
              )}
            </div>

            {/* Info banner */}
            <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <i className="fas fa-info-circle" style={{ color: '#D4AF37', marginTop: '2px' }}></i>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Sections marked <span style={{ color: '#22c55e', fontWeight: 700 }}>green</span> are included in the vendor&apos;s current tier.
                Sections you toggle <span style={{ color: '#D4AF37', fontWeight: 700 }}>gold</span> will be granted as exceptions (&quot;asked &amp; excused&quot;).
                Free-tier vendors with overrides can edit sections but cannot see admin-only or premium analytics.
              </div>
            </div>

            {/* Sections grid */}
            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '2px', marginBottom: '1.25rem' }}>CHAPTER ACCESS CONTROL</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {ALL_SECTIONS.map(section => {
                const inTier = tierSections(selected.subscription_tier).includes(section.id);
                const isOverride = overrideSections.includes(section.id);
                const isEnabled = inTier || isOverride;
                
                return (
                  <div
                    key={section.id}
                    onClick={() => !inTier && toggleSection(section.id)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: inTier
                        ? '1px solid rgba(34,197,94,0.25)'
                        : isOverride
                          ? '1px solid rgba(212,175,55,0.4)'
                          : '1px solid rgba(255,255,255,0.06)',
                      background: inTier
                        ? 'rgba(34,197,94,0.04)'
                        : isOverride
                          ? 'rgba(212,175,55,0.06)'
                          : 'rgba(255,255,255,0.02)',
                      cursor: inTier ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                      background: inTier ? 'rgba(34,197,94,0.1)' : isOverride ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: inTier ? '#22c55e' : isOverride ? '#D4AF37' : '#475569',
                    }}>
                      <i className={`fas ${section.icon}`}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isEnabled ? '#fff' : '#64748b' }}>{section.name}</div>
                      <div style={{ fontSize: '0.62rem', marginTop: '2px', color: inTier ? '#22c55e' : isOverride ? '#D4AF37' : '#475569', fontWeight: 700 }}>
                        {inTier ? '✓ IN TIER' : isOverride ? '★ ADMIN OVERRIDE' : `REQUIRES ${section.tier.toUpperCase()}`}
                      </div>
                    </div>
                    {!inTier && (
                      <div style={{
                        width: 24, height: 24, borderRadius: '6px', flexShrink: 0,
                        background: isOverride ? '#D4AF37' : 'rgba(255,255,255,0.05)',
                        border: isOverride ? '2px solid #D4AF37' : '2px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        {isOverride && <i className="fas fa-check" style={{ fontSize: '0.7rem', color: '#0f172a' }}></i>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Note */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                OVERRIDE REASON / NOTE
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g., Vendor requested investment section for partnership proposal (valid until Q3 2026)"
                rows={3}
                style={{
                  width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                  fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={save} disabled={saving}
                style={{
                  padding: '0.9rem 2rem', background: '#D4AF37', color: '#0f172a', border: 'none',
                  borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem', cursor: saving ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  boxShadow: '0 8px 20px rgba(212,175,55,0.25)', transition: 'all 0.2s',
                }}
              >
                {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-shield-alt"></i>}
                {saving ? 'Saving...' : 'Save Overrides'}
              </button>

              {selected.admin_overrides?.allowed_sections?.length > 0 && (
                <button
                  onClick={clearOverrides}
                  style={{
                    padding: '0.9rem 1.5rem', background: 'transparent', color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', fontWeight: 700,
                    fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-times-circle" style={{ marginRight: '0.5rem' }}></i>
                  Clear All Overrides
                </button>
              )}

              {saveMsg && (
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444' }}>
                  {saveMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
