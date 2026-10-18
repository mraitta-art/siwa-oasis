'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import AccommodationMasterTemplate from '@/components/AccommodationMasterTemplate';
import {
  AccommodationTemplateTier,
  TIER_META,
  TIER_ORDER,
  ACCOMMODATION_SECTIONS,
  ACCOMMODATION_FIELDS,
  getAccommodationTemplateSpecification,
  CANONICAL_ACCOMMODATION_PRESETS,
} from '@/lib/accommodation-template-registry';

export default function JanaAccommodationTemplatePage() {
  const [selectedTier, setSelectedTier] = useState<AccommodationTemplateTier>('luxury_estate');
  const [activeSectionId, setActiveSectionId] = useState<string>('sec_discovery_taxonomy');
  const [templateValues, setTemplateValues] = useState<Record<string, any>>(
    CANONICAL_ACCOMMODATION_PRESETS.luxury_estate
  );
  const [businessIdInput, setBusinessIdInput] = useState<string>('gagal-hotel');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Update preset data whenever tier switches
  useEffect(() => {
    setTemplateValues(CANONICAL_ACCOMMODATION_PRESETS[selectedTier] || {});
  }, [selectedTier]);

  const currentSpec = getAccommodationTemplateSpecification(selectedTier);
  const activeSection = currentSpec.sections.find((s) => s.id === activeSectionId) || currentSpec.sections[0];

  const handleFieldChange = (key: string, val: any) => {
    setTemplateValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleApplyToBusiness = async () => {
    if (!businessIdInput.trim()) {
      alert('Please enter a business slug or ID');
      return;
    }
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/accommodation-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessIdInput.trim(),
          tier: selectedTier,
          template_values: templateValues,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply template');
      setSaveStatus(`✅ Success: Applied ${TIER_META[selectedTier].label} (${data.appliedFieldsCount} fields) to ${businessIdInput}`);
    } catch (err: any) {
      setSaveStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070b08',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <MarketplaceHeader title="Accommodation Template Hierarchy" accentColor="#D4AF37" />

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: 'clamp(1.5rem, 3vw, 2.5rem) 1.25rem' }}>
        {/* Header Kicker */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#D4AF37',
              padding: '0.35rem 0.9rem',
              borderRadius: '30px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
            }}
          >
            <span>✦</span>
            <span>Master Template Architecture</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              color: '#f8fafc',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Accommodation Master Specification
          </h1>
          <p style={{ margin: 0, color: 'rgba(248,250,252,0.65)', maxWidth: '850px', fontSize: '0.92rem', lineHeight: 1.6 }}>
            The <strong>Level 4 Luxury Estate</strong> represents the complete master template with all 12 sections and 50+ fields. 
            Lower templates (Level 3 Premium Lodge, Level 2 Standard Camp, and Level 1 Basic Listing) inherit strictly from this root schema.
          </p>
        </div>

        {/* ── 1. TIER SELECTOR BOARD (4 TIERS) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {TIER_ORDER.slice().reverse().map((tierKey) => {
            const meta = TIER_META[tierKey];
            const isSelected = selectedTier === tierKey;
            const spec = getAccommodationTemplateSpecification(tierKey);

            return (
              <div
                key={tierKey}
                onClick={() => setSelectedTier(tierKey)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #132016, #18281b)' : '#0d150f',
                  border: isSelected ? `2px solid ${meta.color}` : '1px solid rgba(212,175,55,0.18)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 12px 30px ${meta.color}25` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{meta.icon}</span>
                  <span
                    style={{
                      background: isSelected ? meta.color : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#070b08' : 'rgba(248,250,252,0.7)',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      padding: '3px 8px',
                      borderRadius: '20px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    LEVEL {meta.level}
                  </span>
                </div>

                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc', marginBottom: '0.35rem' }}>
                  {meta.label}
                </div>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: 'rgba(248,250,252,0.65)', lineHeight: 1.5 }}>
                  {meta.description}
                </p>

                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: meta.color,
                    fontWeight: 700,
                  }}
                >
                  <span>{spec.sectionsCount} / {ACCOMMODATION_SECTIONS.length} Sections Active</span>
                  <span>{spec.fieldsCount} Fields</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 2. TWO-COLUMN WORKBENCH: LIVE SPECIFICATION & REALTIME PREVIEW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* LEFT: Section Navigator and Fields Inspector */}
          <div
            style={{
              background: '#0d150f',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '20px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                  Tier Configuration Blueprint
                </h2>
                <div style={{ fontSize: '0.74rem', color: 'rgba(248,250,252,0.5)' }}>
                  Active Tier: <strong style={{ color: TIER_META[selectedTier].color }}>{TIER_META[selectedTier].label}</strong>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700 }}>
                {currentSpec.sectionsCount} Sections Available
              </span>
            </div>

            {/* Section Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              {currentSpec.sections.map((sec) => {
                const isActive = activeSection?.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSectionId(sec.id)}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #1f3624, #2a4c33)' : '#132016',
                      border: isActive ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                      color: isActive ? '#f8fafc' : 'rgba(248,250,252,0.7)',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {/* Selected Section Details */}
            {activeSection && (
              <div style={{ background: '#101c13', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#D4AF37', marginBottom: '0.2rem' }}>
                  {activeSection.label}
                </div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.74rem', color: 'rgba(248,250,252,0.65)' }}>
                  {activeSection.description}
                </p>

                {/* Form Inputs for this section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {activeSection.fields.map((fld) => (
                    <div key={fld.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc' }}>
                          {fld.label} {fld.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        <span style={{ fontSize: '0.62rem', color: 'rgba(248,250,252,0.4)', textTransform: 'uppercase' }}>
                          {fld.type}
                        </span>
                      </div>

                      {fld.type === 'select' ? (
                        <select
                          value={templateValues[fld.key] || ''}
                          onChange={(e) => handleFieldChange(fld.key, e.target.value)}
                          style={{
                            background: '#0d150f',
                            border: '1px solid rgba(212,175,55,0.25)',
                            color: '#f8fafc',
                            padding: '0.55rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            outline: 'none',
                          }}
                        >
                          {(fld.options || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : fld.type === 'boolean' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(fld.key, true)}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '8px',
                              background: templateValues[fld.key] ? '#D4AF37' : '#0d150f',
                              color: templateValues[fld.key] ? '#070b08' : '#f8fafc',
                              border: '1px solid rgba(212,175,55,0.2)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Yes / Active
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(fld.key, false)}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '8px',
                              background: !templateValues[fld.key] ? 'rgba(255,255,255,0.1)' : '#0d150f',
                              color: !templateValues[fld.key] ? '#f8fafc' : 'rgba(248,250,252,0.5)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            No / Disabled
                          </button>
                        </div>
                      ) : fld.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={templateValues[fld.key] || ''}
                          onChange={(e) => handleFieldChange(fld.key, e.target.value)}
                          placeholder={fld.placeholder}
                          style={{
                            background: '#0d150f',
                            border: '1px solid rgba(212,175,55,0.25)',
                            color: '#f8fafc',
                            padding: '0.55rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                      ) : fld.key === 'room_types' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.6)' }}>
                              Configure multiple room tier options & multipliers
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = Array.isArray(templateValues.room_types) ? templateValues.room_types : [];
                                const newId = `room_${current.length + 1}`;
                                handleFieldChange('room_types', [
                                  ...current,
                                  {
                                    id: newId,
                                    name_en: `New Room Tier ${current.length + 1}`,
                                    name_ar: `فئة غرفة جديدة ${current.length + 1}`,
                                    capacity: '2 Guests',
                                    multiplier: 1.0 + (current.length * 0.25),
                                    desc: 'Private en-suite bathroom with oasis vista'
                                  }
                                ]);
                              }}
                              style={{
                                background: 'rgba(212,175,55,0.15)',
                                border: '1px solid #D4AF37',
                                color: '#D4AF37',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              + Add Room Option
                            </button>
                          </div>

                          {/* Existing Room Tiers List */}
                          {(Array.isArray(templateValues.room_types) ? templateValues.room_types : []).map((rm: any, idx: number) => (
                            <div
                              key={rm.id || idx}
                              style={{
                                background: '#0d150f',
                                border: '1px solid rgba(212,175,55,0.2)',
                                borderRadius: '8px',
                                padding: '0.6rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem',
                              }}
                            >
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Tier Name (e.g. Royal Suite)"
                                  value={rm.name_en || ''}
                                  onChange={(e) => {
                                    const next = [...templateValues.room_types];
                                    next[idx] = { ...next[idx], name_en: e.target.value };
                                    handleFieldChange('room_types', next);
                                  }}
                                  style={{
                                    flex: 2,
                                    background: '#132016',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#f8fafc',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    outline: 'none',
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Capacity (e.g. 2 Guests)"
                                  value={rm.capacity || ''}
                                  onChange={(e) => {
                                    const next = [...templateValues.room_types];
                                    next[idx] = { ...next[idx], capacity: e.target.value };
                                    handleFieldChange('room_types', next);
                                  }}
                                  style={{
                                    flex: 1,
                                    background: '#132016',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#f8fafc',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    outline: 'none',
                                  }}
                                />
                                <input
                                  type="number"
                                  step="0.05"
                                  title="Price Multiplier (e.g. 1.0 = Base, 1.5 = +50%)"
                                  placeholder="Multiplier"
                                  value={rm.multiplier ?? 1.0}
                                  onChange={(e) => {
                                    const next = [...templateValues.room_types];
                                    next[idx] = { ...next[idx], multiplier: parseFloat(e.target.value) || 1.0 };
                                    handleFieldChange('room_types', next);
                                  }}
                                  style={{
                                    width: '75px',
                                    background: '#132016',
                                    border: '1px solid rgba(212,175,55,0.25)',
                                    color: '#D4AF37',
                                    fontWeight: 700,
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    outline: 'none',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = templateValues.room_types.filter((_: any, i: number) => i !== idx);
                                    handleFieldChange('room_types', next);
                                  }}
                                  style={{
                                    background: 'rgba(239,68,68,0.15)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    color: '#ef4444',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.5rem',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={fld.type === 'number' || fld.type === 'price' ? 'number' : 'text'}
                          value={templateValues[fld.key] !== undefined ? templateValues[fld.key] : ''}
                          onChange={(e) => handleFieldChange(fld.key, fld.type === 'number' || fld.type === 'price' ? Number(e.target.value) : e.target.value)}
                          placeholder={fld.placeholder}
                          style={{
                            background: '#0d150f',
                            border: '1px solid rgba(212,175,55,0.25)',
                            color: '#f8fafc',
                            padding: '0.55rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            outline: 'none',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply To Business Action Box */}
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #132016, #18281b)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: '16px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#D4AF37', marginBottom: '0.4rem' }}>
                Deploy Blueprint to Live Vendor
              </div>
              <p style={{ margin: '0 0 0.9rem', fontSize: '0.74rem', color: 'rgba(248,250,252,0.65)' }}>
                Target business will immediately adopt this template tier and populate on Siwa-Stay filters.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={businessIdInput}
                  onChange={(e) => setBusinessIdInput(e.target.value)}
                  placeholder="Business slug (e.g. gagal-hotel)"
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    background: '#070b08',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#f8fafc',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyToBusiness}
                  disabled={isSaving}
                  style={{
                    background: '#D4AF37',
                    color: '#070b08',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.25rem',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(212,175,55,0.25)',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Applying...' : 'Apply Tier Blueprint →'}
                </button>
              </div>

              {saveStatus && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: saveStatus.startsWith('✅') ? '#86efac' : '#f87171' }}>
                  {saveStatus}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live Visual Rendering of Selected Template Tier */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Live Architectural Preview
              </span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.5)' }}>
                Updates in realtime
              </span>
            </div>

            <AccommodationMasterTemplate
              tier={selectedTier}
              data={templateValues}
              accentColor="#D4AF37"
              mode="preview"
            />
          </div>

        </div>
      </main>
    </div>
  );
}
