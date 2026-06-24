'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionSlot {
  id: string;
  type: string;
  props: Record<string, any>;
  visible: boolean;
}

interface HomepageConfig {
  body_components: SectionSlot[];
  site_settings: Record<string, any>;
}

// ─── Section catalogue — maps type → display metadata ─────────────────────────
const SECTION_CATALOGUE: Record<string, {
  label: string; icon: string; color: string;
  deepEditor?: string; propsSchema: { key: string; label: string; type: 'text' | 'number' | 'toggle' | 'select'; options?: string[]; hint?: string }[];
}> = {
  hero_carousel: {
    label: 'Hero Carousel', icon: '🎬', color: '#D4AF37',
    deepEditor: '/jana/hero-carousel',
    propsSchema: [
      { key: 'carousel_id', label: 'Carousel ID', type: 'text', hint: 'e.g. main_hero' },
      { key: 'autoPlayInterval', label: 'Auto-play (ms)', type: 'number', hint: '8000 = 8 seconds' },
      { key: 'showIndicators', label: 'Show Dots', type: 'toggle' },
      { key: 'showArrows', label: 'Show Arrows', type: 'toggle' },
      { key: 'showProgress', label: 'Show Progress Bar', type: 'toggle' },
      { key: 'isDynamic', label: 'Use Dynamic Slides', type: 'toggle' },
      { key: 'includeBusinesses', label: 'Include Business Slides', type: 'toggle' },
      { key: 'includeJourneys', label: 'Include Journey Slides', type: 'toggle' },
      { key: 'includeInvestment', label: 'Include Investment Slides', type: 'toggle' },
      { key: 'contentAlign', label: 'Text Alignment', type: 'select', options: ['center', 'left', 'right'] },
    ]
  },
  search_bar: {
    label: 'Vibe Search', icon: '🔍', color: '#f59e0b',
    deepEditor: '/jana/search-engines',
    propsSchema: [
      { key: 'engine_id', label: 'Search Engine ID', type: 'text', hint: 'Leave blank for default' },
    ]
  },
  blog: {
    label: 'Blog Section', icon: '📰', color: '#ef4444',
    deepEditor: '/jana/blog',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text', hint: 'e.g. Stories from Siwa' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
      { key: 'maxPosts', label: 'Max Posts', type: 'number', hint: 'Default: 3' },
    ]
  },
  experience_categories: {
    label: 'Experience Categories', icon: '🏔️', color: '#10b981',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  smart_journey_planner: {
    label: 'Journey Planner', icon: '✈️', color: '#06b6d4',
    deepEditor: '/jana/journey-templates-manager',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  investment_feed: {
    label: 'Investment Feed', icon: '💼', color: '#8b5cf6',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  featured_vibe: {
    label: 'Featured Vibe', icon: '⭐', color: '#f97316',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
    ]
  },
  services_hub: {
    label: 'Services Hub', icon: '🏢', color: '#a78bfa',
    deepEditor: '/jana/businesses',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  ecosystem_map: {
    label: 'Ecosystem Map', icon: '🗺️', color: '#22c55e',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  local_products: {
    label: 'Local Products', icon: '🛍️', color: '#ec4899',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  storytelling_section: {
    label: 'Storytelling', icon: '📖', color: '#a78bfa',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  partner_cta: {
    label: 'Partner CTA', icon: '🤝', color: '#64748b',
    propsSchema: [
      { key: 'title', label: 'Section Title', type: 'text' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text' },
    ]
  },
  services: {
    label: 'Services CTA Banner', icon: '🏷️', color: '#0ea5e9',
    propsSchema: [
      { key: 'title', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Sub-heading', type: 'text' },
      { key: 'buttonText', label: 'Button Text', type: 'text' },
      { key: 'buttonLink', label: 'Button Link', type: 'text' },
    ]
  },
};

const DEFAULT_HOMEPAGE: SectionSlot[] = [
  { id: 'hero_carousel_1', type: 'hero_carousel', visible: true, props: { carousel_id: 'main_hero', isDynamic: true, includeBusinesses: true, includeJourneys: true, includeInvestment: true, showIndicators: true, showArrows: true, showProgress: true } },
  { id: 'search_bar_1', type: 'search_bar', visible: true, props: {} },
  { id: 'experience_categories_1', type: 'experience_categories', visible: true, props: { title: 'Explore Siwa', subtitle: 'Discover authentic experiences' } },
  { id: 'featured_vibe_1', type: 'featured_vibe', visible: true, props: {} },
  { id: 'smart_journey_planner_1', type: 'smart_journey_planner', visible: true, props: {} },
  { id: 'investment_feed_1', type: 'investment_feed', visible: true, props: {} },
  { id: 'blog_1', type: 'blog', visible: true, props: { maxPosts: 3 } },
  { id: 'partner_cta_1', type: 'partner_cta', visible: true, props: {} },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HomepageEditor() {
  const [sections, setSections] = useState<SectionSlot[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [addingType, setAddingType] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [tab, setTab] = useState<'sections' | 'settings'>('sections');

  const notify = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/website?id=website_main');
      if (res.ok) {
        const data = await res.json();
        const config = Array.isArray(data) ? data[0] : data;
        const raw: any[] = config?.body_components || [];
        // Normalise — ensure each slot has visible + id
        const normalised: SectionSlot[] = raw.map((s, i) => ({
          id: s.id || `${s.type}_${i}`,
          type: s.type || 'unknown',
          props: s.props || {},
          visible: s.visible !== false,
        }));
        setSections(normalised.length > 0 ? normalised : DEFAULT_HOMEPAGE);
        setSiteSettings(config?.site_settings || {});
      } else {
        setSections(DEFAULT_HOMEPAGE);
      }
    } catch {
      setSections(DEFAULT_HOMEPAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/jana/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'website_main',
          body_components: sections,
          site_settings: siteSettings,
          header_components: [],
          footer_components: [],
        }),
      });
      if (res.ok) {
        notify('ok', '✅ Homepage saved & deployed!');
        setDirty(false);
      } else {
        notify('err', '❌ Save failed. Try again.');
      }
    } catch {
      notify('err', '❌ Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
    setDirty(true);
  };

  const updateProp = (id: string, key: string, val: any) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, props: { ...s.props, [key]: val } } : s));
    setDirty(true);
  };

  const move = (index: number, dir: 'up' | 'down') => {
    const next = [...sections];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    setDirty(true);
  };

  const remove = (id: string) => {
    if (!confirm('Remove this section from the homepage?')) return;
    setSections(prev => prev.filter(s => s.id !== id));
    if (expandedId === id) setExpandedId(null);
    setDirty(true);
  };

  const addSection = () => {
    if (!addingType) return;
    const newSlot: SectionSlot = {
      id: `${addingType}_${Date.now()}`,
      type: addingType,
      props: {},
      visible: true,
    };
    setSections(prev => [...prev, newSlot]);
    setAddingType('');
    setShowAddPanel(false);
    setDirty(true);
    setExpandedId(newSlot.id);
  };

  // ─── Drag-and-drop ───────────────────────────────────────────────────────────
  const onDragStart = (i: number) => setDragging(i);
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragging === null || dragging === i) { setDragging(null); setDragOver(null); return; }
    const next = [...sections];
    const [item] = next.splice(dragging, 1);
    next.splice(i, 0, item);
    setSections(next);
    setDirty(true);
    setDragging(null);
    setDragOver(null);
  };

  const visibleCount = sections.filter(s => s.visible).length;
  const totalCount = sections.length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .hp-section-row { transition: all 0.2s ease; }
        .hp-section-row:hover { background: rgba(255,255,255,0.04) !important; }
        .hp-section-row.dragging-over { border-color: #D4AF37 !important; background: rgba(212,175,55,0.08) !important; }
        .hp-prop-input { width: 100%; padding: 0.6rem 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none; box-sizing: border-box; }
        .hp-prop-input:focus { border-color: #D4AF37; }
        .hp-tab { padding: 0.65rem 1.5rem; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.82rem; transition: all 0.2s; }
        .hp-tab.active { background: #D4AF37; color: #0a0f1a; }
        .hp-tab:not(.active) { background: rgba(255,255,255,0.06); color: #64748b; }
        .hp-tab:not(.active):hover { background: rgba(255,255,255,0.1); color: #94a3b8; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 640px) {
          .hp-header { flex-direction: column !important; gap: 1rem !important; }
          .hp-section-grid { grid-template-columns: 36px 1fr auto !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="hp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <Link href="/jana" style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1.5px', textDecoration: 'none' }}>
              ← ADMIN DASHBOARD
            </Link>
            <h1 style={{ margin: '0.4rem 0 0.2rem', fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #D4AF37 0%, #FFB700 50%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Homepage Editor
            </h1>
            <p style={{ color: '#475569', margin: 0, fontSize: '0.875rem' }}>
              Drag to reorder · toggle visibility · edit props · save to deploy
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
              👁 Preview
            </a>
            <Link href="/jana/website?page=main" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.1rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', color: '#D4AF37', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
              🎨 Visual Builder
            </Link>
            <button
              onClick={save}
              disabled={saving || !dirty}
              style={{ padding: '0.65rem 1.5rem', background: dirty ? '#D4AF37' : 'rgba(255,255,255,0.05)', color: dirty ? '#0a0f1a' : '#475569', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: dirty ? 'pointer' : 'not-allowed', fontSize: '0.85rem', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '⏳ Saving...' : dirty ? '💾 Save Changes' : '✓ Saved'}
            </button>
          </div>
        </div>

        {/* ── Message ───────────────────────────────────────────────────────── */}
        {msg && (
          <div style={{ marginBottom: '1.5rem', padding: '0.9rem 1.25rem', borderRadius: '10px', background: msg.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${msg.type === 'ok' ? '#10b981' : '#ef4444'}`, color: msg.type === 'ok' ? '#6ee7b7' : '#fca5a5', fontWeight: 700, fontSize: '0.875rem' }}>
            {msg.text}
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Sections', value: totalCount, color: '#D4AF37' },
            { label: 'Visible', value: visibleCount, color: '#10b981' },
            { label: 'Hidden', value: totalCount - visibleCount, color: '#64748b' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ── Progress bar ──────────────────────────────────────────────────── */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(visibleCount / Math.max(totalCount, 1)) * 100}%`, background: 'linear-gradient(90deg, #10b981, #D4AF37)', transition: 'width 0.4s ease', borderRadius: 10 }} />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button className={`hp-tab ${tab === 'sections' ? 'active' : ''}`} onClick={() => setTab('sections')}>📋 Sections</button>
          <button className={`hp-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>⚙️ Site Settings</button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: SECTIONS
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'sections' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem', color: '#475569' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse-dot 1.5s infinite' }}>⏳</div>
                <p>Loading homepage layout…</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {sections.map((section, index) => {
                    const meta = SECTION_CATALOGUE[section.type];
                    const isExpanded = expandedId === section.id;
                    const isDraggingOver = dragOver === index;
                    const isThisDragging = dragging === index;

                    return (
                      <div
                        key={section.id}
                        className={`hp-section-row${isDraggingOver ? ' dragging-over' : ''}`}
                        draggable
                        onDragStart={() => onDragStart(index)}
                        onDragOver={(e) => onDragOver(e, index)}
                        onDrop={(e) => onDrop(e, index)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        style={{
                          background: isExpanded ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.025)',
                          border: `1px solid ${isExpanded ? 'rgba(212,175,55,0.4)' : isDraggingOver ? '#D4AF37' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 14,
                          overflow: 'hidden',
                          opacity: isThisDragging ? 0.4 : section.visible ? 1 : 0.5,
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* ── Row header ── */}
                        <div
                          className="hp-section-grid"
                          style={{ display: 'grid', gridTemplateColumns: '36px 36px 1fr auto', alignItems: 'center', padding: '0.85rem 1rem', gap: '0.75rem', cursor: 'pointer' }}
                          onClick={() => setExpandedId(isExpanded ? null : section.id)}
                        >
                          {/* Drag handle */}
                          <div title="Drag to reorder" style={{ cursor: 'grab', color: '#334155', fontSize: '1.1rem', textAlign: 'center', userSelect: 'none' }}>⠿</div>

                          {/* Icon */}
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: (meta?.color || '#64748b') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                            {meta?.icon || '🧩'}
                          </div>

                          {/* Info */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: section.visible ? '#fff' : '#475569' }}>
                                {meta?.label || section.type}
                              </span>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: section.visible ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: section.visible ? '#10b981' : '#64748b' }}>
                                {section.visible ? '● VISIBLE' : '○ HIDDEN'}
                              </span>
                              <span style={{ fontSize: '0.62rem', color: '#334155', fontFamily: 'monospace' }}>#{index + 1}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                              {Object.entries(section.props).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => `${k}: ${v}`).slice(0, 3).join(' · ') || 'No custom props'}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => move(index, 'up')} disabled={index === 0} title="Move up" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: index === 0 ? '#1e293b' : '#64748b', borderRadius: 7, width: 30, height: 30, cursor: index === 0 ? 'default' : 'pointer', fontSize: '0.8rem' }}>▲</button>
                            <button onClick={() => move(index, 'down')} disabled={index === sections.length - 1} title="Move down" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: index === sections.length - 1 ? '#1e293b' : '#64748b', borderRadius: 7, width: 30, height: 30, cursor: index === sections.length - 1 ? 'default' : 'pointer', fontSize: '0.8rem' }}>▼</button>
                            <button onClick={() => toggleVisible(section.id)} title={section.visible ? 'Hide section' : 'Show section'} style={{ background: section.visible ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', border: `1px solid ${section.visible ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`, color: section.visible ? '#10b981' : '#475569', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', fontSize: '0.8rem' }}>
                              {section.visible ? '👁' : '🚫'}
                            </button>
                            <button onClick={() => remove(section.id)} title="Remove section" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', fontSize: '0.8rem' }}>🗑</button>
                          </div>
                        </div>

                        {/* ── Expanded props panel ── */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 1rem 1rem', background: 'rgba(0,0,0,0.2)' }}>
                            {meta?.propsSchema && meta.propsSchema.length > 0 ? (
                              <>
                                <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '1rem', textTransform: 'uppercase' }}>⚙ Section Properties</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                  {meta.propsSchema.map(field => (
                                    <div key={field.key}>
                                      <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                        {field.label}
                                      </label>
                                      {field.type === 'toggle' ? (
                                        <button
                                          onClick={() => updateProp(section.id, field.key, !section.props[field.key])}
                                          style={{ padding: '0.45rem 1rem', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', background: section.props[field.key] !== false ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)', color: section.props[field.key] !== false ? '#10b981' : '#64748b' }}
                                        >
                                          {section.props[field.key] !== false ? '✓ Enabled' : '○ Disabled'}
                                        </button>
                                      ) : field.type === 'select' ? (
                                        <select
                                          className="hp-prop-input"
                                          value={section.props[field.key] || ''}
                                          onChange={e => updateProp(section.id, field.key, e.target.value)}
                                        >
                                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      ) : field.type === 'number' ? (
                                        <input
                                          type="number"
                                          className="hp-prop-input"
                                          value={section.props[field.key] || ''}
                                          placeholder={field.hint || ''}
                                          onChange={e => updateProp(section.id, field.key, Number(e.target.value))}
                                        />
                                      ) : (
                                        <input
                                          type="text"
                                          className="hp-prop-input"
                                          value={section.props[field.key] || ''}
                                          placeholder={field.hint || ''}
                                          onChange={e => updateProp(section.id, field.key, e.target.value)}
                                        />
                                      )}
                                      {field.hint && field.type !== 'toggle' && (
                                        <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.2rem' }}>{field.hint}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p style={{ color: '#334155', fontSize: '0.8rem', margin: 0 }}>No configurable properties for this section.</p>
                            )}

                            {/* Deep editor link */}
                            {meta?.deepEditor && (
                              <Link href={meta.deepEditor} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', padding: '0.55rem 1rem', background: `${meta.color}18`, border: `1px solid ${meta.color}40`, borderRadius: 8, color: meta.color, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
                                ✏️ Open Full Editor → {meta.label}
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Add section panel ─────────────────────────────────────── */}
                {showAddPanel ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 14, padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '1rem' }}>+ ADD SECTION</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
                      {Object.entries(SECTION_CATALOGUE).map(([type, meta]) => (
                        <button
                          key={type}
                          onClick={() => setAddingType(type)}
                          style={{ padding: '0.75rem', borderRadius: 10, border: `2px solid ${addingType === type ? meta.color : 'rgba(255,255,255,0.07)'}`, background: addingType === type ? meta.color + '18' : 'transparent', color: addingType === type ? meta.color : '#475569', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s' }}
                        >
                          <div>{meta.icon} {meta.label}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={addSection} disabled={!addingType} style={{ padding: '0.65rem 1.5rem', background: addingType ? '#D4AF37' : 'rgba(255,255,255,0.05)', color: addingType ? '#0a0f1a' : '#334155', border: 'none', borderRadius: 8, fontWeight: 900, cursor: addingType ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>
                        Add Section
                      </button>
                      <button onClick={() => { setShowAddPanel(false); setAddingType(''); }} style={{ padding: '0.65rem 1rem', background: 'transparent', color: '#475569', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddPanel(true)}
                    style={{ width: '100%', padding: '1rem', background: 'rgba(212,175,55,0.04)', border: '2px dashed rgba(212,175,55,0.2)', borderRadius: 14, color: '#D4AF37', cursor: 'pointer', fontWeight: 800, fontSize: '0.875rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'}
                  >
                    + Add Section
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: SITE SETTINGS
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { key: 'carousel_interval', label: 'Carousel Interval (ms)', type: 'number', hint: '8000 = 8 seconds between slides' },
              { key: 'site_title', label: 'Site Title', type: 'text', hint: 'Shown in browser tab' },
              { key: 'site_description', label: 'Meta Description', type: 'text', hint: 'SEO description (150 chars)' },
              { key: 'primary_color', label: 'Primary Accent Color', type: 'text', hint: 'e.g. #D4AF37' },
              { key: 'logo_url', label: 'Logo URL', type: 'text', hint: 'https://... or /images/logo.png' },
              { key: 'whatsapp_number', label: 'WhatsApp Contact', type: 'text', hint: '+201XXXXXXXXX' },
              { key: 'footer_tagline', label: 'Footer Tagline', type: 'text', hint: 'Short brand tagline' },
            ].map(field => (
              <div key={field.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  {field.label}
                </label>
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  className="hp-prop-input"
                  value={siteSettings[field.key] || ''}
                  placeholder={field.hint}
                  onChange={e => {
                    setSiteSettings(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }));
                    setDirty(true);
                  }}
                />
                {field.hint && <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.3rem' }}>{field.hint}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Bottom save bar (fixed when dirty) ─────────────────────────── */}
        {dirty && (
          <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(10,15,26,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 50, padding: '0.75rem 1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.85rem' }}>● Unsaved changes</span>
            <button onClick={() => { load(); setDirty(false); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#64748b', borderRadius: 25, padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
              Discard
            </button>
            <button onClick={save} disabled={saving} style={{ background: '#D4AF37', color: '#0a0f1a', border: 'none', borderRadius: 25, padding: '0.45rem 1.25rem', cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem' }}>
              {saving ? '⏳ Saving…' : '💾 Save & Deploy'}
            </button>
          </div>
        )}

        {/* ── Info footer ─────────────────────────────────────────────────── */}
        <div style={{ marginTop: '3rem', padding: '1.25rem', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.8 }}>
            <strong style={{ color: '#D4AF37' }}>⠿ Drag</strong> rows to reorder sections · <strong style={{ color: '#10b981' }}>👁</strong> toggle visibility without removing · <strong style={{ color: '#D4AF37' }}>▼ click a row</strong> to expand and edit its props · Use <strong style={{ color: '#D4AF37' }}>Visual Builder</strong> for full drag-and-drop block editing.
          </p>
        </div>
      </div>
    </div>
  );
}
