'use client';

import React, { useState } from 'react';
import SchemaBuilder from './components/SchemaBuilder';
import DataFiller from './components/DataFiller';

type Stage = '1' | '2';

export default function UnifiedStudioPage() {
  const [stage, setStage] = useState<Stage>('1');
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);

  function handleTypologySelected(typeId: string, typeName: string) {
    setSelectedTypeId(typeId);
    setSelectedTypeName(typeName);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '2rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '16px', background: 'linear-gradient(135deg, #D4AF37 0%, #f59e0b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                  🏗️
                </div>
                <div>
                  <h1 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Unified Building Studio</h1>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    Define the blueprint, then fill the data — one seamless flow
                  </div>
                </div>
              </div>
            </div>
            {/* Breadcrumb state */}
            {selectedTypeId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.75rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <i className="fas fa-layer-group" style={{ color: '#D4AF37', fontSize: '0.85rem' }}></i>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem' }}>{selectedTypeName}</span>
                <button onClick={() => { setSelectedTypeId(null); setSelectedTypeName(null); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Stage Toggle */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '6px', gap: '4px' }}>
            {([
              { id: '1' as Stage, icon: 'fa-drafting-compass', label: 'Stage 1 — Schema Builder', sub: 'Define category, sections & fields' },
              { id: '2' as Stage, icon: 'fa-fill-drip', label: 'Stage 2 — Data Filler', sub: 'Select business & fill its data' },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setStage(tab.id)} style={{
                padding: '0.85rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: stage === tab.id ? '#fff' : 'transparent',
                boxShadow: stage === tab.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.75rem'
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '10px', background: stage === tab.id ? '#D4AF3720' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${tab.icon}`} style={{ color: stage === tab.id ? '#D4AF37' : '#94a3b8', fontSize: '0.85rem' }}></i>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.8rem', color: stage === tab.id ? '#1e293b' : '#94a3b8' }}>{tab.label}</div>
                  <div style={{ fontSize: '0.6rem', color: stage === tab.id ? '#64748b' : '#475569' }}>{tab.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Flow indicator */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 2.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>
          {/* Stage 1 steps */}
          <span style={{ color: stage === '1' ? '#D4AF37' : (selectedTypeId ? '#10b981' : '#94a3b8'), display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {selectedTypeId && stage === '2' ? <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> : <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i>}
            1A Pick Category
          </span>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
          <span style={{ color: stage === '1' ? '#3b82f6' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i>
            1B Define Sections
          </span>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
          <span style={{ color: stage === '1' ? '#8b5cf6' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i>
            1C Add Fields
          </span>
          <span style={{ margin: '0 0.5rem', color: '#e2e8f0' }}>│</span>
          <span style={{ color: stage === '2' ? '#D4AF37' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i>
            2A Select Business
          </span>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
          <span style={{ color: stage === '2' ? '#3b82f6' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i>
            2B Fill Data
          </span>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
          <span style={{ color: stage === '2' ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fas fa-rocket" style={{ fontSize: '0.6rem' }}></i>
            Publish Live
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 2.5rem' }}>

        {/* Cross-stage category reminder */}
        {stage === '2' && selectedTypeId && (
          <div style={{ background: '#fef3c7', borderRadius: '14px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #fde68a' }}>
            <i className="fas fa-layer-group" style={{ color: '#D4AF37' }}></i>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
              Filling data for <strong>{selectedTypeName}</strong> businesses — using the schema you defined in Stage 1
            </span>
            <button onClick={() => setStage('1')} style={{ marginLeft: 'auto', background: '#fff', border: '1px solid #fde68a', color: '#92400e', padding: '0.35rem 0.9rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>
              ← BACK TO SCHEMA
            </button>
          </div>
        )}

        {/* Stage content */}
        {stage === '1' && (
          <SchemaBuilder
            onTypologySelected={handleTypologySelected}
            selectedTypeId={selectedTypeId}
          />
        )}

        {stage === '2' && (
          <DataFiller
            selectedTypeId={selectedTypeId}
            selectedTypeName={selectedTypeName}
          />
        )}
      </div>
    </div>
  );
}
