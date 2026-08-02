'use client';

import { useState, useEffect } from 'react';
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
  { label: 'Desert Rose', value: '#c1440e', bg: '#fff7ed' },
  { label: 'Night Blue',  value: '#1e3a5f', bg: '#eff6ff' },
  { label: 'Palm Grey',   value: '#475569', bg: '#f8fafc' },
];

export default function VendorMinisitePage() {
  const [settings, setSettings] = useState<MinisiteSettings | null>(null);
  const [sections, setSections] = useState<SectionControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'appearance' | 'publish'>('sections');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/vendor/story');
      const data = await res.json();
      const biz = data.business || {};
      setSettings({
        is_published: !!biz.is_published,
        slug: biz.slug || '',
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
    const url = `${window.location.origin}/${settings?.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 font-semibold">
      Loading minisite settings...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 border-b border-slate-100 pb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">🌐 Minisite Settings</h1>
          <p className="text-slate-400 font-semibold text-sm">Control your minisite sections, appearance and visibility</p>
        </div>
        <div className="flex items-center gap-3">
          {settings?.slug && (
            <Link href={`/${settings.slug}`} target="_blank" className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl transition flex items-center gap-2">
              <i className="fas fa-external-link-alt text-xs text-slate-400"></i> Preview
            </Link>
          )}
          <button onClick={saveSettings} disabled={saving} className="px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold text-sm rounded-2xl transition disabled:opacity-50 flex items-center gap-2">
            {saving ? '⏳' : '💾'} {saving ? 'Saving...' : savedMsg || 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Live status banner */}
      <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border ${settings?.is_published ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${settings?.is_published ? 'bg-emerald-500 shadow-sm shadow-emerald-300 animate-pulse' : 'bg-slate-300'}`} />
          <div>
            <span className={`font-extrabold text-sm ${settings?.is_published ? 'text-emerald-700' : 'text-slate-600'}`}>
              {settings?.is_published ? 'Minisite is Live' : 'Minisite is in Draft'}
            </span>
            {settings?.slug && (
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-xs text-slate-400 font-mono">/{settings.slug}</code>
                <button onClick={copyUrl} className="text-xs text-[#D4AF37] font-bold hover:text-amber-600 transition">
                  {copied ? '✓ Copied' : 'Copy URL'}
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={togglePublish}
          disabled={publishing}
          className={`px-5 py-2.5 font-extrabold text-sm rounded-2xl transition disabled:opacity-50 ${
            settings?.is_published
              ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
          }`}
        >
          {publishing ? '⏳ ...' : settings?.is_published ? '⏸ Unpublish' : '🚀 Publish Now'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit mb-6">
        {(['sections', 'appearance', 'publish'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition capitalize ${
              activeTab === tab ? 'bg-white text-[#D4AF37] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'sections' ? '📋 Sections' : tab === 'appearance' ? '🎨 Appearance' : '🚀 Publish'}
          </button>
        ))}
      </div>

      {/* ── SECTIONS TAB ── */}
      {activeTab === 'sections' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-800 text-base">Section Visibility & Order</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Toggle sections on/off and reorder how they appear on your minisite</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              {sections.filter(s => s.visible).length} visible
            </span>
          </div>

          <div className="space-y-3">
            {sections.map((section, idx) => {
              const fillPct = section.fieldCount > 0 ? Math.round((section.filledCount / section.fieldCount) * 100) : 0;
              return (
                <div
                  key={section.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                    section.visible ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-50 border-slate-100 opacity-60'
                  }`}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => moveSection(section.id, 'up')} disabled={idx === 0} className="w-6 h-5 flex items-center justify-center text-slate-300 hover:text-slate-500 disabled:opacity-20 transition text-xs">
                      ▲
                    </button>
                    <button onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1} className="w-6 h-5 flex items-center justify-center text-slate-300 hover:text-slate-500 disabled:opacity-20 transition text-xs">
                      ▼
                    </button>
                  </div>

                  {/* Icon */}
                  <span className="text-2xl flex-shrink-0">{section.icon}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-extrabold text-sm text-slate-800">{section.name}</span>
                      <span className="text-xs text-slate-400 font-semibold">{fillPct}% filled</span>
                    </div>
                    {/* Editable label */}
                    <input
                      type="text"
                      value={section.label}
                      onChange={e => updateLabel(section.id, e.target.value)}
                      placeholder="Custom tab label..."
                      className="w-full max-w-xs px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-amber-50 transition"
                    />
                    {/* Fill progress */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 max-w-[100px] h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: fillPct === 100 ? '#22c55e' : '#D4AF37' }}></div>
                      </div>
                      <Link href="/vendor/sections" className="text-xs text-[#D4AF37] font-bold hover:text-amber-600 transition">
                        Edit →
                      </Link>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={section.visible} onChange={() => toggleSection(section.id)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── APPEARANCE TAB ── */}
      {activeTab === 'appearance' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-extrabold text-slate-800 text-base">Minisite Colors & Fonts</h2>

          {/* Color presets */}
          <div>
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Brand Color</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setSettings(p => p ? { ...p, minisite_color: c.value } : p)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition ${settings?.minisite_color === c.value ? 'border-slate-400 shadow-sm' : 'border-transparent hover:border-slate-200'}`}
                  style={{ background: c.bg }}
                >
                  <div className="w-8 h-8 rounded-full shadow-sm" style={{ background: c.value }} />
                  <span className="text-xs font-bold text-slate-600">{c.label}</span>
                </button>
              ))}
              {/* Custom color input */}
              <label className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition cursor-pointer">
                <input
                  type="color"
                  value={settings?.minisite_color || '#D4AF37'}
                  onChange={e => setSettings(p => p ? { ...p, minisite_color: e.target.value } : p)}
                  className="w-8 h-8 rounded-full cursor-pointer border-none"
                />
                <span className="text-xs font-bold text-slate-400">Custom</span>
              </label>
            </div>
          </div>

          {/* Font selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Font Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['Inter', 'Playfair Display', 'Cairo', 'Outfit', 'Lora'].map(font => (
                <button
                  key={font}
                  onClick={() => setSettings(p => p ? { ...p, minisite_font: font } : p)}
                  className={`p-3 rounded-2xl border-2 text-left transition ${settings?.minisite_font === font ? 'border-[#D4AF37] bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                >
                  <span className="block text-sm font-bold text-slate-700" style={{ fontFamily: font }}>{font}</span>
                  <span className="block text-xs text-slate-400 mt-0.5" style={{ fontFamily: font }}>Aa Bb Cc 123</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview note */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 font-semibold">
            💡 Changes will be visible on your minisite after saving. 
            {settings?.slug && <Link href={`/${settings.slug}`} target="_blank" className="ml-1 text-[#D4AF37] font-extrabold hover:underline">Preview ↗</Link>}
          </div>
        </div>
      )}

      {/* ── PUBLISH TAB ── */}
      {activeTab === 'publish' && (
        <div className="space-y-5">
          <div className={`rounded-3xl border p-6 shadow-sm ${settings?.is_published ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-4 mb-5">
              <div className="text-4xl">{settings?.is_published ? '🟢' : '⚪'}</div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">{settings?.is_published ? 'Your Minisite is Live!' : 'Minisite Not Published Yet'}</h2>
                <p className="text-sm text-slate-500 font-semibold">
                  {settings?.is_published ? 'Visitors can find and view your business on Siwa Oasis.' : 'Your minisite is hidden from the public. Publish to go live.'}
                </p>
              </div>
            </div>

            {settings?.slug && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 mb-4">
                <i className="fas fa-link text-slate-400 text-sm"></i>
                <code className="flex-1 text-sm text-slate-600 font-mono break-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://siwa.today'}/{settings.slug}
                </code>
                <button onClick={copyUrl} className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition ${copied ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}

            <button
              onClick={togglePublish}
              disabled={publishing}
              className={`w-full py-4 font-extrabold text-base rounded-2xl transition disabled:opacity-50 ${
                settings?.is_published
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-white shadow-lg shadow-amber-200'
              }`}
            >
              {publishing ? '⏳ Please wait...' : settings?.is_published ? '⏸ Unpublish Minisite' : '🚀 Publish My Minisite'}
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">📋 Publishing Checklist</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Business name & description filled', done: sections.some(s => s.filledCount > 0) },
                { label: 'At least 1 section with content', done: sections.filter(s => s.filledCount > 0).length >= 1 },
                { label: 'Contact information provided', done: false },
                { label: 'At least 1 visible section', done: sections.some(s => s.visible) },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${item.done ? 'bg-emerald-50 border-emerald-200/60' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${item.done ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                    {item.done ? '✓' : '○'}
                  </div>
                  <span className={`text-sm font-bold ${item.done ? 'text-emerald-700' : 'text-slate-500'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
