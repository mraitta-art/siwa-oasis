'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CHAPTERS, CHAPTER_LABELS, CHAPTER_ICONS, CHAPTER_COLORS,
  BlueprintAtom, Chapter,
} from '@/lib/governance/blueprint-core';
import { FIELD_TYPES } from '@/lib/governance/constants';

const LAYER_META = {
  0: { label: 'Core',     color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '🔒' },
  1: { label: 'Standard', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', icon: '🔵' },
  2: { label: 'Private',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: '🟠' },
} as const;

interface AtomRow extends BlueprintAtom { usage_count?: number; }

const BLANK_ATOM: Partial<AtomRow> = {
  id: '', label: '', type: 'text', chapter: 'identity',
  icon: '', display_hint: '', layer_default: 1, tags: [], options: [],
};

export default function AtomRegistryPage() {
  const [atoms, setAtoms] = useState<AtomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [filterLayer, setFilterLayer] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAtom, setEditAtom] = useState<Partial<AtomRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fetchAtoms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ active: 'false' });
      if (filterChapter !== 'all') params.set('chapter', filterChapter);
      if (filterLayer !== 'all') params.set('layer', filterLayer);
      const res = await fetch(`/api/jana/blueprints/atoms?${params}`);
      setAtoms(await res.json());
    } finally { setLoading(false); }
  }, [filterChapter, filterLayer]);

  useEffect(() => { fetchAtoms(); }, [fetchAtoms]);

  const handleSeed = async () => {
    setSeeding(true); setSeedMsg('');
    try {
      const res = await fetch('/api/jana/blueprints/atoms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      const data = await res.json();
      setSeedMsg(`✅ Seeded ${data.seeded} atoms from Siwa defaults`);
      fetchAtoms();
    } catch { setSeedMsg('❌ Seed failed'); }
    finally { setSeeding(false); }
  };

  const handleSave = async () => {
    if (!editAtom?.id || !editAtom.label || !editAtom.type || !editAtom.chapter) {
      setSaveMsg('❌ id, label, type and chapter are required'); return;
    }
    setSaving(true); setSaveMsg('');
    const isNew = !atoms.find(a => a.id === editAtom.id);
    try {
      const res = await fetch('/api/jana/blueprints/atoms', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAtom),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(`❌ ${data.error}`); return; }
      setSaveMsg('✅ Saved!');
      setTimeout(() => { setShowForm(false); setEditAtom(null); setSaveMsg(''); fetchAtoms(); }, 800);
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (atom: AtomRow) => {
    await fetch('/api/jana/blueprints/atoms', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...atom, active: !atom.active }),
    });
    fetchAtoms();
  };

  const filtered = atoms.filter(a => {
    const q = search.toLowerCase();
    return !q || a.id.includes(q) || a.label.toLowerCase().includes(q);
  });

  const groupedByChapter = CHAPTERS.reduce((acc, ch) => {
    acc[ch] = filtered.filter(a => a.chapter === ch);
    return acc;
  }, {} as Record<Chapter, AtomRow[]>);

  const totalActive = atoms.filter(a => a.active !== false).length;
  const totalAtoms = atoms.length;

  return (
    <div style={{ background: '#08090a', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: '2rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Link href="/jana/blueprints" style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', letterSpacing: '2px' }}>
                ← BLUEPRINTS
              </Link>
              <span style={{ color: '#334155', fontSize: '0.75rem' }}>/</span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px' }}>ATOM REGISTRY</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
              ⚛️ Atom Registry
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0 0', fontWeight: 500 }}>
              Global field library — define once, reference everywhere
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#6366f1' }}>{totalActive}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>ACTIVE ATOMS</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)' }} />
            <button
              onClick={handleSeed}
              disabled={seeding}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '1px', opacity: seeding ? 0.6 : 1 }}
            >
              {seeding ? '⏳ SEEDING...' : '🌱 SEED DEFAULTS'}
            </button>
            <button
              onClick={() => { setEditAtom({ ...BLANK_ATOM }); setShowForm(true); setSaveMsg(''); }}
              style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '1px' }}
            >
              + NEW ATOM
            </button>
          </div>
        </div>
        {seedMsg && <div style={{ maxWidth: '1400px', margin: '1rem auto 0', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>{seedMsg}</div>}
      </div>

      {/* Legend */}
      <div style={{ padding: '1rem 3rem', background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {Object.entries(LAYER_META).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: v.color }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{v.icon} {v.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
          {totalAtoms} total · {totalActive} active
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '1.5rem 3rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search atoms..."
          style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', width: '200px', outline: 'none' }}
        />
        <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)}
          style={{ padding: '0.6rem 1rem', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
          <option value="all">All Chapters</option>
          {CHAPTERS.map(ch => <option key={ch} value={ch}>{CHAPTER_ICONS[ch]} {CHAPTER_LABELS[ch]}</option>)}
        </select>
        <select value={filterLayer} onChange={e => setFilterLayer(e.target.value)}
          style={{ padding: '0.6rem 1rem', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
          <option value="all">All Layers</option>
          <option value="0">🔒 Layer 0 — Core</option>
          <option value="1">🔵 Layer 1 — Standard</option>
          <option value="2">🟠 Layer 2 — Private</option>
        </select>
      </div>

      {/* Atom Grid by Chapter */}
      <div style={{ padding: '0 3rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', fontSize: '1rem' }}>Loading atoms...</div>
        ) : (
          CHAPTERS.filter(ch => filterChapter === 'all' || filterChapter === ch).map(ch => {
            const chAtoms = groupedByChapter[ch];
            if (!chAtoms.length) return null;
            return (
              <div key={ch} style={{ marginBottom: '2.5rem' }}>
                {/* Chapter Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${CHAPTER_COLORS[ch]}33` }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${CHAPTER_COLORS[ch]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    {CHAPTER_ICONS[ch]}
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '1rem', color: CHAPTER_COLORS[ch], letterSpacing: '2px' }}>{CHAPTER_LABELS[ch]}</span>
                  <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px' }}>{chAtoms.length} atoms</span>
                </div>

                {/* Atom Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {chAtoms.map(atom => {
                    const layer = atom.layer_default ?? 1;
                    const lm = LAYER_META[layer as 0 | 1 | 2];
                    const isInactive = atom.active === false;
                    return (
                      <div key={atom.id} style={{
                        background: isInactive ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isInactive ? 'rgba(255,255,255,0.05)' : lm.border}`,
                        borderRadius: '16px', padding: '1.25rem',
                        opacity: isInactive ? 0.5 : 1,
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                        onMouseEnter={e => { if (!isInactive) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {atom.icon && <i className={`fas ${atom.icon}`} style={{ color: lm.color, fontSize: '0.9rem', width: '16px' }} />}
                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{atom.label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button onClick={() => { setEditAtom({ ...atom }); setShowForm(true); setSaveMsg(''); }}
                              style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>
                              ✏️
                            </button>
                            <button onClick={() => handleToggleActive(atom)}
                              style={{ width: '28px', height: '28px', borderRadius: '8px', background: isInactive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: 'none', color: isInactive ? '#10b981' : '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>
                              {isInactive ? '✓' : '✕'}
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '3px 7px', borderRadius: '5px', background: lm.bg, color: lm.color, border: `1px solid ${lm.border}` }}>
                            {lm.icon} {lm.label}
                          </span>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '3px 7px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                            {atom.type}
                          </span>
                          {(atom.usage_count ?? 0) > 0 && (
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '3px 7px', borderRadius: '5px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                              {atom.usage_count} types
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.65rem', color: '#4b5563', fontFamily: 'monospace', fontWeight: 600 }}>
                          id: {atom.id}
                        </div>
                        {atom.display_hint && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem', fontStyle: 'italic' }}>
                            {atom.display_hint}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Atom Form Modal */}
      {showForm && editAtom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                {atoms.find(a => a.id === editAtom.id) ? '✏️ Edit Atom' : '⚛️ New Atom'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditAtom(null); setSaveMsg(''); }}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* ID */}
              <div>
                <label style={labelStyle}>Atom ID (slug)</label>
                <input value={editAtom.id || ''} onChange={e => setEditAtom(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="e.g. wifi, star_rating" disabled={!!atoms.find(a => a.id === editAtom.id)}
                  style={{ ...inputStyle, fontFamily: 'monospace', opacity: atoms.find(a => a.id === editAtom.id) ? 0.5 : 1 }} />
              </div>
              {/* Label */}
              <div>
                <label style={labelStyle}>Label</label>
                <input value={editAtom.label || ''} onChange={e => setEditAtom(p => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. WiFi Available" style={inputStyle} />
              </div>
              {/* Type + Chapter (2 cols) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Field Type</label>
                  <select value={editAtom.type || 'text'} onChange={e => setEditAtom(p => ({ ...p, type: e.target.value as any }))} style={selectStyle}>
                    {Object.entries(FIELD_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Chapter</label>
                  <select value={editAtom.chapter || 'identity'} onChange={e => setEditAtom(p => ({ ...p, chapter: e.target.value as Chapter }))} style={selectStyle}>
                    {CHAPTERS.map(ch => <option key={ch} value={ch}>{CHAPTER_ICONS[ch]} {CHAPTER_LABELS[ch]}</option>)}
                  </select>
                </div>
              </div>
              {/* Layer + Icon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Default Layer</label>
                  <select value={editAtom.layer_default ?? 1} onChange={e => setEditAtom(p => ({ ...p, layer_default: Number(e.target.value) as 0 | 1 | 2 }))} style={selectStyle}>
                    <option value={0}>🔒 Layer 0 — Core</option>
                    <option value={1}>🔵 Layer 1 — Standard</option>
                    <option value={2}>🟠 Layer 2 — Private</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Icon (FontAwesome)</label>
                  <input value={editAtom.icon || ''} onChange={e => setEditAtom(p => ({ ...p, icon: e.target.value }))}
                    placeholder="fa-wifi" style={inputStyle} />
                </div>
              </div>
              {/* Display Hint */}
              <div>
                <label style={labelStyle}>Display Hint (tooltip)</label>
                <input value={editAtom.display_hint || ''} onChange={e => setEditAtom(p => ({ ...p, display_hint: e.target.value }))}
                  placeholder="Short help text for admins" style={inputStyle} />
              </div>
              {/* Options (for select types) */}
              {['select', 'multiselect', 'checkbox_group'].includes(editAtom.type || '') && (
                <div>
                  <label style={labelStyle}>Options (comma-separated)</label>
                  <input value={(editAtom.options || []).join(', ')}
                    onChange={e => setEditAtom(p => ({ ...p, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="Option A, Option B, Option C" style={inputStyle} />
                </div>
              )}
              {/* Tags */}
              <div>
                <label style={labelStyle}>Tags (comma-separated)</label>
                <input value={(editAtom.tags || []).join(', ')}
                  onChange={e => setEditAtom(p => ({ ...p, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  placeholder="hospitality, eco, dining" style={inputStyle} />
              </div>

              {saveMsg && <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: saveMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>{saveMsg}</div>}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: '0.9rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'SAVING...' : 'SAVE ATOM'}
                </button>
                <button onClick={() => { setShowForm(false); setEditAtom(null); setSaveMsg(''); }}
                  style={{ padding: '0.9rem 1.5rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '0.4rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
