'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SectionControl {
  id: string;
  name: string;
  icon: string;
  visible: boolean;
  label: string;
  order: number;
  fieldCount: number;
  filledCount: number;
}

interface MinisiteSettings {
  is_published: boolean;
  slug: string;
  minisite_color?: string;
  minisite_font?: string;
}

const COLOR_PRESETS = [
  { label: 'Sand Gold',   value: '#D4AF37', bg: '#fdf8ee' },
  { label: 'Oasis Green', value: '#2d6a4f', bg: '#f0fdf4' },
  { label: 'Desert Terracotta', value: '#c1440e', bg: '#fff7ed' },
  { label: 'Royal Midnight',  value: '#1e3a5f', bg: '#eff6ff' },
  { label: 'Slate Charcoal',  value: '#475569', bg: '#f8fafc' },
];

const MS_CSS = `
  .ms-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
  }
  .ms-card {
    background: #ffffff; border: 1px solid #eef0f5; border-radius: 22px;
    padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    margin-bottom: 1.5rem; transition: box-shadow 0.2s;
  }
  .ms-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); }

  .ms-pub-banner {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 1rem; padding: 1.25rem 1.5rem; border-radius: 18px; border: 1px solid;
    margin-bottom: 1.5rem; transition: all 0.2s;
  }
  .ms-pub-banner.live { background: rgba(34,197,94,0.05); border-color: rgba(34,197,94,0.25); }
  .ms-pub-banner.draft { background: #fdfbf5; border-color: rgba(212,175,55,0.25); }

  .ms-sec-item {
    display: flex; align-items: center; gap: 0.85rem;
    padding: 0.85rem 1rem; border-radius: 14px;
    background: #fafafa; border: 1px solid #f1f5f9;
    margin-bottom: 0.6rem; transition: all 0.18s;
  }
  .ms-sec-item:hover { background: #fff; border-color: #e2e8f0; }

  .ms-toggle {
    width: 36px; height: 20px; border-radius: 10px;
    border: none; cursor: pointer; position: relative;
    transition: background 0.2s; flex-shrink: 0; padding: 0;
  }
  .ms-toggle.on { background: #10b981; }
  .ms-toggle.off { background: #cbd5e1; }
  .ms-toggle::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px; border-radius: 50%; background: #fff;
    transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .ms-toggle.on::after { transform: translateX(16px); }

  .ms-btn-icon {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff; color: #64748b;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; cursor: pointer; transition: all 0.15s;
  }
  .ms-btn-icon:hover { background: #f1f5f9; color: #0f172a; }
`;

export default function VendorMinisitePage() {
  const [settings, setSettings] = useState<MinisiteSettings | null>(null);
  const [sections, setSections] = useState<SectionControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/vendor/story');
      const data = await res.json();
      const biz = data.business || {};
      setSettings({
        is_published: !!biz.is_published,
        slug: biz.slug || biz.id || '',
        minisite_color: biz.minisite_color || '#D4AF37',
        minisite_font: biz.minisite_font || 'Inter',
      });

      if (data.structure) {
        const customData = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data || '{}') : (biz.custom_data || {});
        const hiddenSections: string[] = customData.hidden_sections || [];
        const sectionLabels: Record<string, string> = customData.section_labels || {};
        const sectionOrder: string[] = customData.section_order || [];

        const mapped: SectionControl[] = data.structure.map((s: any, idx: number) => ({
          id: s.id,
          name: s.name,
          icon: s.icon || '📋',
          visible: !hiddenSections.includes(s.id),
          label: sectionLabels[s.id] || s.name,
          order: sectionOrder.indexOf(s.id) !== -1 ? sectionOrder.indexOf(s.id) : idx,
          fieldCount: s.fields.length,
          filledCount: s.fields.filter((f: any) => f.value !== null && f.value !== '' && f.value !== undefined).length,
        }));
        mapped.sort((a, b) => a.order - b.order);
        setSections(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(id: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  }

  function moveSection(id: string, dir: 'up' | 'down') {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  function updateLabel(id: string, label: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, label } : s));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const hiddenSections = sections.filter(s => !s.visible).map(s => s.id);
      const sectionLabels: Record<string, string> = {};
      const sectionOrder = sections.map(s => s.id);
      sections.forEach(s => { sectionLabels[s.id] = s.label; });

      await fetch('/api/vendor/minisite/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hidden_sections: hiddenSections,
          section_labels: sectionLabels,
          section_order: sectionOrder,
          minisite_color: settings?.minisite_color,
          minisite_font: settings?.minisite_font,
        }),
      });
      setSavedMsg('✓ Settings saved');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (e) {
      setSavedMsg('⚠️ Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    setPublishing(true);
    try {
      const newState = !settings?.is_published;
      await fetch('/api/vendor/minisite/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newState }),
      });
      setSettings(p => p ? { ...p, is_published: newState } : p);
    } catch (e) { console.error(e); }
    finally { setPublishing(false); }
  }

  function copyUrl() {
    if (!settings?.slug) return;
    const url = `${window.location.origin}/${settings.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#94a3b8', fontWeight: 600 }}>
      Loading minisite settings...
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MS_CSS }} />
      <div className="ms-root">

        {/* Top Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
              🌐 Minisite & Theme Studio
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
              Customize your vanity URL, brand colors, section visibility and live status
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {settings?.slug && (
              <Link href={`/${settings.slug}`} target="_blank" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', background: '#fdf8ee', padding: '0.55rem 1.1rem', borderRadius: '12px', border: '1px solid #fde68a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} /> View Live Minisite
              </Link>
            )}
            <button
              onClick={saveSettings}
              disabled={saving}
              style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c842)', color: '#1a1000', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(212,175,55,0.3)' }}
            >
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`} />
              {saving ? 'Saving...' : savedMsg || 'Save Theme'}
            </button>
          </div>
        </div>

        {/* Live Banner */}
        <div className={`ms-pub-banner ${settings?.is_published ? 'live' : 'draft'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: settings?.is_published ? '#22c55e' : '#f59e0b', boxShadow: settings?.is_published ? '0 0 8px rgba(34,197,94,0.6)' : 'none' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: settings?.is_published ? '#166534' : '#92400e' }}>
                {settings?.is_published ? 'Minisite is Published & Live' : 'Minisite is in Draft Mode'}
              </div>
              {settings?.slug && (
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Vanity URL: <strong style={{ color: '#0f172a' }}>/{settings.slug}</strong></span>
                  <button onClick={copyUrl} style={{ background: 'none', border: 'none', color: '#D4AF37', fontWeight: 800, cursor: 'pointer', fontSize: '0.68rem' }}>
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={togglePublish}
            disabled={publishing}
            style={{ padding: '0.55rem 1.25rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, border: 'none', cursor: 'pointer', background: settings?.is_published ? '#dc2626' : '#16a34a', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            {publishing ? 'Updating...' : settings?.is_published ? 'Unpublish to Draft' : '🚀 Publish Live Now'}
          </button>
        </div>

        {/* Brand Theme Card */}
        <div className="ms-card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.25rem' }}>🎨 Brand Color Preset</h2>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, marginBottom: '1.25rem' }}>Select your primary brand accent color for headings, buttons and badges</p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {COLOR_PRESETS.map(cp => {
              const isSelected = settings?.minisite_color === cp.value;
              return (
                <button
                  key={cp.value}
                  onClick={() => setSettings(p => p ? { ...p, minisite_color: cp.value } : p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '14px', border: `2px solid ${isSelected ? cp.value : '#e2e8f0'}`, background: isSelected ? cp.bg : '#fff', cursor: 'pointer', transition: 'all 0.18s' }}
                >
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: cp.value }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 900 : 600, color: '#0f172a' }}>{cp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Visibility & Ordering */}
        <div className="ms-card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.25rem' }}>📋 Minisite Sections & Ordering</h2>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, marginBottom: '1.25rem' }}>Toggle visibility and reorder navigation tabs on your public minisite</p>

          {sections.map((sec, i) => (
            <div key={sec.id} className="ms-sec-item">
              <button
                className={`ms-toggle ${sec.visible ? 'on' : 'off'}`}
                onClick={() => toggleSection(sec.id)}
                title={sec.visible ? 'Hide section' : 'Show section'}
              />
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{sec.icon}</span>
              <input
                type="text"
                value={sec.label}
                onChange={e => updateLabel(sec.id, e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 700, color: sec.visible ? '#0f172a' : '#94a3b8', textDecoration: sec.visible ? 'none' : 'line-through' }}
              />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                {sec.filledCount}/{sec.fieldCount} filled
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="ms-btn-icon" onClick={() => moveSection(sec.id, 'up')} disabled={i === 0}>
                  <i className="fas fa-chevron-up" />
                </button>
                <button className="ms-btn-icon" onClick={() => moveSection(sec.id, 'down')} disabled={i === sections.length - 1}>
                  <i className="fas fa-chevron-down" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
