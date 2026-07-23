'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CHAPTERS, CHAPTER_LABELS, CHAPTER_ICONS, CHAPTER_COLORS } from '@/lib/governance/blueprint-core';

interface Typology {
  id: string;
  name: string;
  icon: string;
  icon_color: string;
  business_count: number;
  blueprint_schema: string | null;
  hidden_sections: string[];
}

const LEGEND = [
  { icon: '⚛️', label: 'Atom Registry', color: '#6366f1', desc: 'Global field library' },
  { icon: '🔒', label: 'Core',     color: '#94a3b8', desc: 'Always present' },
  { icon: '🔵', label: 'Standard', color: '#6366f1', desc: 'Type defaults' },
  { icon: '🟠', label: 'Private',  color: '#f59e0b', desc: 'Type-specific' },
  { icon: '🖼️', label: 'Gallery',  color: '#ec4899', desc: 'Chapter media' },
  { icon: '🎠', label: 'Carousel', color: '#14b8a6', desc: 'Hero pins' },
  { icon: '📝', label: 'Blog',     color: '#10b981', desc: 'Mini posts' },
];

export default function BlueprintDashboard() {
  const [typologies, setTypologies] = useState<Typology[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAtoms, setTotalAtoms] = useState<number>(0);

  useEffect(() => {
    Promise.all([fetchTypologies(), fetchAtomCount()]);
  }, []);

  const fetchTypologies = async () => {
    try {
      const res = await fetch('/api/jana/types');
      const data = await res.json();
      setTypologies(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAtomCount = async () => {
    try {
      const res = await fetch('/api/jana/blueprints/atoms');
      const data = await res.json();
      setTotalAtoms(Array.isArray(data) ? data.length : 0);
    } catch {}
  };

  const getLayerCounts = (t: Typology) => {
    try {
      const schema = t.blueprint_schema ? JSON.parse(t.blueprint_schema) : null;
      if (!schema?.chapters) return { l1: 0, l2: 0 };
      let l1 = 0, l2 = 0;
      for (const ch of Object.values(schema.chapters) as any[]) {
        l1 += (ch.layer1 || []).length;
        l2 += (ch.layer2 || []).length;
      }
      return { l1, l2 };
    } catch { return { l1: 0, l2: 0 }; }
  };

  const totalVendors = typologies.reduce((acc, t) => acc + (t.business_count || 0), 0);
  const capacityLimit = 1000;
  const isNearLimit = totalVendors > (capacityLimit * 0.9);
  const typesWithBlueprint = typologies.filter(t => t.blueprint_schema).length;

  return (
    <div className="animate-in" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100vh', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <div className="blueprint-dashboard-shell" style={{ maxWidth: '1440px', margin: '0 auto', padding: 'clamp(1rem, 2vw, 2rem) clamp(1rem, 3vw, 2rem) 3rem' }}>
        {isNearLimit && (
          <div className="card" style={{ marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(254,242,242,0.95)', borderRadius: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
            <div style={{ padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', fontSize: '1.1rem' }} />
                <div>
                  <div style={{ fontWeight: 900, color: '#ef4444', fontSize: '0.8rem' }}>CAPACITY WARNING</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Platform at {Math.round((totalVendors / capacityLimit) * 100)}% capacity ({totalVendors}/{capacityLimit} vendors)</div>
                </div>
              </div>
              <button style={{ padding: '0.6rem 1.1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>SCALE</button>
            </div>
          </div>
        )}

        <div className="card blueprint-hero" style={{ padding: 'clamp(1.25rem, 2vw, 2rem)', marginBottom: '1.25rem', borderRadius: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 18px 50px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '760px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', letterSpacing: '3px', marginBottom: '0.65rem' }}>GOVERNANCE COMMAND CENTER</div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, margin: 0, letterSpacing: '-1px', color: '#0f172a' }}>
                Global Blueprint Status
              </h1>
              <p style={{ margin: '0.7rem 0 0', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '660px' }}>
                Review blueprint coverage, chapter readiness, and typology health from a single streamlined workspace.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { val: typologies.length, label: 'TYPOLOGIES' },
                { val: typesWithBlueprint, label: 'CONFIGURED' },
                { val: totalAtoms, label: 'ATOMS', color: '#6366f1' },
                { val: totalVendors, label: 'VENDORS' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', minWidth: '72px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color || '#0f172a' }}>{s.val}</div>
                  <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#64748b', letterSpacing: '1px', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
              <div style={{ width: '1px', height: '46px', background: 'rgba(148,163,184,0.24)' }} />
              <Link href="/jana/blueprints/atoms">
                <button style={{ padding: '0.75rem 1.15rem', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 24px rgba(99,102,241,0.18)' }}>
                  ⚛️ ATOM REGISTRY
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="blueprint-legend" style={{ padding: '1rem 1.2rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem', boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#475569', letterSpacing: '2px', display: 'flex', alignItems: 'center' }}>LAYER LEGEND</div>
          {LEGEND.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem' }}>{l.icon}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: l.color }}>{l.label}</span>
              <span style={{ fontSize: '0.65rem', color: '#475569' }}>{l.desc}</span>
            </div>
          ))}
        </div>

        <div className="blueprint-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: '260px', background: 'rgba(248,250,252,0.95)', borderRadius: '24px', border: '1px solid rgba(226,232,240,0.95)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
        ) : typologies.map(t => {
          const layerCounts = getLayerCounts(t);
          const color = t.icon_color || '#6366f1';
          const hasSchema = !!t.blueprint_schema;
          const activeChapters = 8 - (t.hidden_sections?.length || 0);

          return (
            <div key={t.id} className="blueprint-card" style={{
              background: 'rgba(255,255,255,0.95)',
              border: `1px solid ${hasSchema ? color + '33' : 'rgba(148,163,184,0.18)'}`,
              borderRadius: '22px', padding: '1.35rem',
              position: 'relative', overflow: 'hidden',
              transition: 'all 0.25s',
              boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px ${color}18`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              {/* BG Glow */}
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px', background: color, filter: 'blur(80px)', opacity: 0.07, pointerEvents: 'none' }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    <i className={t.icon || 'fas fa-building'} style={{ color }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, letterSpacing: '0.5px' }}>{t.name.toUpperCase()}</h2>
                    <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 700 }}>{t.id}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.6rem', fontWeight: 900, padding: '5px 10px', borderRadius: '8px',
                  background: hasSchema ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: hasSchema ? '#10b981' : '#ef4444',
                  border: hasSchema ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                }}>
                  {hasSchema ? '● CONFIGURED' : '○ NOT SET'}
                </div>
              </div>

              {/* Stats Row */}
              <div className="blueprint-card-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { v: activeChapters, label: 'CHAPTERS', sub: '/8', color: color },
                  { v: t.business_count || 0, label: 'UNITS', color: '#94a3b8' },
                  { v: layerCounts.l1, label: '🔵 STD', color: '#6366f1' },
                  { v: layerCounts.l2, label: '🟠 PRIV', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(248,250,252,0.95)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center', border: '1px solid rgba(226,232,240,0.95)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.v}<span style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 600 }}>{s.sub || ''}</span></div>
                    <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#475569', letterSpacing: '0.5px', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Chapter Pills */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {CHAPTERS.map(ch => {
                  const hidden = t.hidden_sections?.some(h => h.includes(ch));
                  return (
                    <div key={ch} title={CHAPTER_LABELS[ch]} style={{
                      fontSize: '0.6rem', fontWeight: 800, padding: '3px 7px', borderRadius: '5px',
                      background: hidden ? 'rgba(239,68,68,0.08)' : `${CHAPTER_COLORS[ch]}18`,
                      color: hidden ? '#ef444488' : CHAPTER_COLORS[ch],
                      border: `1px solid ${hidden ? 'rgba(239,68,68,0.15)' : CHAPTER_COLORS[ch] + '33'}`,
                    }}>
                      {CHAPTER_ICONS[ch]}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link href={`/jana/blueprints/${t.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 8px 18px rgba(15,23,42,0.08)' }}>
                    ✏️ EDIT BLUEPRINT
                  </button>
                </Link>
                <button style={{ padding: '0.8rem 1rem', borderRadius: '12px', background: '#f8fafc', color: '#334155', border: '1px solid rgba(148,163,184,0.2)', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
                  SYNC
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
      @media (max-width: 768px) {
        .blueprint-dashboard-shell { padding: 1rem !important; }
        .blueprint-hero { padding: 1.25rem !important; }
        .blueprint-legend { padding: 1rem !important; grid-template-columns: 1fr !important; }
        .blueprint-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
        .blueprint-card-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }`}</style>
    </div>
  );
}
