'use client';

import React, { useState, useEffect } from 'react';

export interface WhatsAppTemplateItem {
  id: string;
  name: string;
  categoryKey: string;
  targetAudience: 'all' | 'new_unclaimed' | 'active_vendor' | 'tourist_client' | 'inactive_reactivation';
  isHidden: boolean;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  includedFeatures: string[];
}

interface WhatsAppTemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORY_OPTIONS = [
  { key: 'transport', label: '🛺 Transportation & Tuk-Tuk' },
  { key: 'safari', label: '🚙 4x4 Desert Safari' },
  { key: 'wellness', label: '🌿 Health, Salt Lakes & Wellness' },
  { key: 'tour_operator', label: '🗺️ Tour Operators & Itineraries' },
  { key: 'hotel', label: '🏨 Hotels & Eco-Lodges' },
  { key: 'dining', label: '🍲 Restaurants & Dining' },
  { key: 'crafts', label: '🏺 Siwan Crafts & Dates/Olives' },
  { key: 'general', label: '⭐ General Platform Partners' },
];

const AUDIENCE_OPTIONS = [
  { key: 'all', label: '👥 Everyone (General)' },
  { key: 'new_unclaimed', label: '🎁 New Unclaimed Partners (Onboarding)' },
  { key: 'active_vendor', label: '✅ Active Verified Partners (Updates)' },
  { key: 'tourist_client', label: '🛺 Direct Tourists & Clients (Showcase)' },
  { key: 'inactive_reactivation', label: '⚡ Re-activation Campaign' },
];

export default function WhatsAppTemplateManagerModal({
  isOpen,
  onClose,
  onSaved,
}: WhatsAppTemplateManagerModalProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/whatsapp-templates');
      if (res.ok) {
        const data = await res.json();
        const list = data.templates || [];
        setTemplates(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      const res = await fetch('/api/jana/whatsapp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });
      if (res.ok) {
        alert('✅ WhatsApp message templates & audience rules saved successfully!');
        if (onSaved) onSaved();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save templates');
    } finally {
      setSaving(false);
    }
  }

  function handleCreateTemplate() {
    const newId = `template_${Date.now()}`;
    const newTpl: WhatsAppTemplateItem = {
      id: newId,
      name: 'New Custom Template',
      categoryKey: 'general',
      targetAudience: 'new_unclaimed',
      isHidden: false,
      titleAr: 'رسالة واتساب مخصصة جديدة',
      titleEn: 'New Custom WhatsApp Template',
      contentAr: 'مرحباً {name}! 🌴\n\nنرحب بكم في منصة SiWiFy.com:\n🔗 {minisiteUrl}',
      contentEn: 'Hello {name}! 🌴\n\nWelcome to SiWiFy.com:\n🔗 {minisiteUrl}',
      includedFeatures: ['Verified Partner'],
    };
    setTemplates((prev) => [newTpl, ...prev]);
    setSelectedId(newId);
  }

  function updateSelectedTemplate(updates: Partial<WhatsAppTemplateItem>) {
    if (!selectedId) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, ...updates } : t))
    );
  }

  function handleDeleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) {
      const remaining = templates.filter((t) => t.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  if (!isOpen) return null;

  const selectedTemplate = templates.find((t) => t.id === selectedId);

  const filteredTemplates = templates.filter((t) => {
    if (filterAudience !== 'all' && t.targetAudience !== filterAudience) return false;
    if (filterCategory !== 'all' && t.categoryKey !== filterCategory) return false;
    return true;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#fff',
          width: '100%',
          maxWidth: '1200px',
          height: '92vh',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(99,102,241,0.08))',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>
              MESSAGE &amp; AUDIENCE GOVERNANCE DASHBOARD
            </div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.35rem', fontWeight: 900, color: '#fff' }}>
              WhatsApp Template &amp; Delivery Rules Manager
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleCreateTemplate}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '12px',
                background: '#D4AF37',
                color: '#0f172a',
                fontWeight: 900,
                fontSize: '0.78rem',
                border: 0,
                cursor: 'pointer',
              }}
            >
              + Create Template
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 0,
                color: '#fff',
                width: 36,
                height: 36,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY (TWO PANE: LIST & EDITOR) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT PANE: TEMPLATE LIST */}
          <div
            style={{
              width: '360px',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            {/* FILTER BAR */}
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '0.45rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.75rem',
                }}
              >
                <option value="all">📁 All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={filterAudience}
                onChange={(e) => setFilterAudience(e.target.value)}
                style={{
                  padding: '0.45rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.75rem',
                }}
              >
                <option value="all">👥 All Audiences ("Who gets what")</option>
                {AUDIENCE_OPTIONS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {/* TEMPLATE ITEMS */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>⏳ Loading templates...</div>
              ) : (
                filteredTemplates.map((t) => {
                  const isSelected = selectedId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? '#D4AF37' : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        opacity: t.isHidden ? 0.45 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? '#D4AF37' : '#fff' }}>
                          {t.name}
                        </div>
                        {t.isHidden ? (
                          <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 900 }}>👁️ Hidden</span>
                        ) : (
                          <span style={{ fontSize: '0.6rem', color: '#22c55e', fontWeight: 900 }}>🟢 Active</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                        {t.categoryKey.toUpperCase()} · {t.targetAudience}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: TEMPLATE DETAIL EDITOR */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {selectedTemplate ? (
              <>
                {/* TOP SETTINGS ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', display: 'block', marginBottom: '0.35rem' }}>
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => updateSelectedTemplate({ name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', display: 'block', marginBottom: '0.35rem' }}>
                      Industry Category
                    </label>
                    <select
                      value={selectedTemplate.categoryKey}
                      onChange={(e) => updateSelectedTemplate({ categoryKey: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', display: 'block', marginBottom: '0.35rem' }}>
                      Target Audience ("Who gets this")
                    </label>
                    <select
                      value={selectedTemplate.targetAudience}
                      onChange={(e) => updateSelectedTemplate({ targetAudience: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      {AUDIENCE_OPTIONS.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visibility toggle */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', display: 'block', marginBottom: '0.35rem' }}>
                      Template Visibility
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <input
                        type="checkbox"
                        checked={!selectedTemplate.isHidden}
                        onChange={(e) => updateSelectedTemplate({ isHidden: !e.target.checked })}
                        style={{ accentColor: '#22c55e', width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: !selectedTemplate.isHidden ? '#86efac' : '#ef4444' }}>
                        {!selectedTemplate.isHidden ? '🟢 Visible in Dispatcher' : '👁️ Hidden from Dispatcher'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* ARABIC MESSAGE CONTENT */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37' }}>
                      🇸🇦 Arabic Message Template (نص الرسالة بالعربية)
                    </label>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Variables: &#123;name&#125;, &#123;parentType&#125;, &#123;childType&#125;, &#123;minisiteUrl&#125;, &#123;claimUrl&#125;</span>
                  </div>
                  <textarea
                    value={selectedTemplate.contentAr}
                    onChange={(e) => updateSelectedTemplate({ contentAr: e.target.value })}
                    rows={8}
                    dir="rtl"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: '#020617',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#cbd5e1',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                      fontFamily: "'Noto Sans Arabic', 'Inter', sans-serif",
                    }}
                  />
                </div>

                {/* ENGLISH MESSAGE CONTENT */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37' }}>
                      🇬🇧 English Message Template
                    </label>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Variables: &#123;name&#125;, &#123;minisiteUrl&#125;, &#123;claimUrl&#125;</span>
                  </div>
                  <textarea
                    value={selectedTemplate.contentEn}
                    onChange={(e) => updateSelectedTemplate({ contentEn: e.target.value })}
                    rows={7}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: '#020617',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#cbd5e1',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                </div>

                {/* DELETE BUTTON */}
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    style={{ background: 'none', border: 0, color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    🗑️ Delete This Template
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                Select a template from the left list to edit or create a new one.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {templates.length} Total Templates · {templates.filter((t) => !t.isHidden).length} Active · {templates.filter((t) => t.isHidden).length} Hidden
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
                border: 0,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                padding: '0.65rem 1.6rem',
                borderRadius: '12px',
                background: '#D4AF37',
                color: '#0f172a',
                fontWeight: 900,
                fontSize: '0.85rem',
                border: 0,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(212,175,55,0.25)',
              }}
            >
              {saving ? 'Saving...' : '💾 Save All Templates & Rules'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
