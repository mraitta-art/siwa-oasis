'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CardCustomLink, CardLinkType } from '@/lib/commercial-types';
import { DEFAULT_COMMERCIAL_ITEMS } from '@/lib/commercial-catalog';

const GOLD = '#D4AF37';

const LINK_TYPE_OPTIONS: { value: CardLinkType; label: string; icon: string; hint: string }[] = [
  { value: 'platform_vendor', label: 'Platform Vendor', icon: '🛡️', hint: 'Registered vendor on Siwify – gets a verified badge' },
  { value: 'external_ota', label: 'External OTA', icon: '🏨', hint: 'Booking.com, TripAdvisor, Viator, etc.' },
  { value: 'direct_partner', label: 'Direct Partner', icon: '🤝', hint: 'External partner not on platform' },
  { value: 'social_contact', label: 'Social / Contact', icon: '💬', hint: 'WhatsApp, Instagram, Telegram, Phone link' },
  { value: 'custom', label: 'Custom Link', icon: '🌐', hint: 'Any other URL (review site, map, blog, etc.)' },
];

const SECTOR_ICONS: Record<string, string> = {
  accommodation: '🛖', dining: '🍽️', transports: '🚙',
  activities: '🌊', tours: '🏛️', products: '🫒',
};

const EMPTY_LINK: Omit<CardCustomLink, 'id'> = {
  title: '',
  url: '',
  type: 'external_ota',
  badge_text: '',
  icon: '',
  accent_color: '',
  benchmark_price: undefined,
  ota_name: '',
  is_registered_vendor: false,
  is_active: true,
};

function uid() {
  return 'lnk_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();
}

export default function CommercialLinksAdmin() {
  const [linksMap, setLinksMap] = useState<Record<string, CardCustomLink[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(DEFAULT_COMMERCIAL_ITEMS[0]?.id ?? '');
  const [editingLink, setEditingLink] = useState<CardCustomLink | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState<Omit<CardCustomLink, 'id'>>({ ...EMPTY_LINK });
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/admin/commercial-links')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setLinksMap(d.links_map ?? {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const saveAll = useCallback(async (map: Record<string, CardCustomLink[]>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/commercial-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_map: map }),
      });
      const d = await res.json();
      if (d.success) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const currentLinks = linksMap[selectedItemId] ?? [];

  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    const updated = { ...linksMap, [selectedItemId]: [...currentLinks, { id: uid(), ...newLink }] };
    setLinksMap(updated);
    saveAll(updated);
    setNewLink({ ...EMPTY_LINK });
    setShowAddForm(false);
  };

  const deleteLink = (linkId: string) => {
    const updated = { ...linksMap, [selectedItemId]: currentLinks.filter(l => l.id !== linkId) };
    setLinksMap(updated);
    saveAll(updated);
  };

  const toggleActive = (linkId: string) => {
    const updated = {
      ...linksMap,
      [selectedItemId]: currentLinks.map(l => l.id === linkId ? { ...l, is_active: !l.is_active } : l),
    };
    setLinksMap(updated);
    saveAll(updated);
  };

  const moveLink = (idx: number, dir: -1 | 1) => {
    const arr = [...currentLinks];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    const updated = { ...linksMap, [selectedItemId]: arr };
    setLinksMap(updated);
    saveAll(updated);
  };

  const saveEdit = () => {
    if (!editingLink) return;
    const updated = {
      ...linksMap,
      [selectedItemId]: currentLinks.map(l => l.id === editingLink.id ? editingLink : l),
    };
    setLinksMap(updated);
    saveAll(updated);
    setEditingLink(null);
  };

  // Filter items list
  const allItems = DEFAULT_COMMERCIAL_ITEMS;
  const filteredItems = allItems.filter(it => {
    const matchSector = sectorFilter === 'all' || it.sector === sectorFilter;
    const matchSearch = !searchTerm || it.title_en.toLowerCase().includes(searchTerm.toLowerCase()) || it.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSector && matchSearch;
  });

  const selectedItem = allItems.find(it => it.id === selectedItemId);
  const sectors = Array.from(new Set(allItems.map(it => it.sector)));

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: '#f1f5f9', fontSize: '0.82rem', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', fontSize: '1rem', fontWeight: 700 }}>
        Loading Commercial Links Manager…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', fontFamily: 'inherit' }}>
      {/* ── TOP BAR ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        padding: '0.85rem 1.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link href="/admin" style={{ color: GOLD, fontSize: '0.72rem', fontWeight: 900, textDecoration: 'none', border: '1px solid rgba(212,175,55,0.3)', padding: '5px 14px', borderRadius: '8px', background: 'rgba(212,175,55,0.08)' }}>
            ← Control Center
          </Link>
          <span style={{ color: '#334155' }}>/</span>
          <span style={{ color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.04em' }}>🔗 Card Links Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {savedFlash && (
            <div style={{ background: '#052e16', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', padding: '5px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#4ade80' }}>
              ✓ Saved!
            </div>
          )}
          <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>
            {allItems.length} Items · {Object.values(linksMap).reduce((s, a) => s + a.length, 0)} Links Total
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', minHeight: 'calc(100vh - 60px)', gap: 0 }}>
        {/* ── LEFT SIDEBAR — Item List ── */}
        <div style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="🔍 Search items..."
              style={{ ...inputStyle, fontSize: '0.8rem' }}
            />
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setSectorFilter('all')} style={{
                padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800,
                background: sectorFilter === 'all' ? GOLD : 'rgba(255,255,255,0.06)', color: sectorFilter === 'all' ? '#0f172a' : '#94a3b8',
              }}>All</button>
              {sectors.map(s => (
                <button key={s} type="button" onClick={() => setSectorFilter(s)} style={{
                  padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800,
                  background: sectorFilter === s ? GOLD : 'rgba(255,255,255,0.06)', color: sectorFilter === s ? '#0f172a' : '#94a3b8',
                }}>
                  {SECTOR_ICONS[s]} {s}
                </button>
              ))}
            </div>
          </div>

          {/* Item List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredItems.map(it => {
              const isActive = it.id === selectedItemId;
              const linkCount = (linksMap[it.id] ?? []).filter(l => l.is_active !== false).length;
              const totalCount = (linksMap[it.id] ?? []).length;
              return (
                <button key={it.id} type="button" onClick={() => { setSelectedItemId(it.id); setShowAddForm(false); setEditingLink(null); }} style={{
                  width: '100%', textAlign: 'left', padding: '0.85rem 1.1rem', border: 'none', cursor: 'pointer',
                  background: isActive ? 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))' : 'transparent',
                  borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                  display: 'flex', alignItems: 'flex-start', gap: '0.7rem',
                  transition: 'all 0.15s',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' }}>{it.icon ?? SECTOR_ICONS[it.sector]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isActive ? '#f1f5f9' : '#94a3b8', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.title_en}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.business_name}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {totalCount > 0 ? (
                      <span style={{
                        background: linkCount > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                        color: linkCount > 0 ? '#4ade80' : '#f87171',
                        border: `1px solid ${linkCount > 0 ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.62rem', fontWeight: 800,
                      }}>
                        {linkCount}/{totalCount}
                      </span>
                    ) : (
                      <span style={{ color: '#334155', fontSize: '0.62rem' }}>no links</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL — Link Editor ── */}
        <div style={{ overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#0b1120' }}>

          {/* Item Header */}
          {selectedItem && (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px', padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', gap: '1.1rem',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              {selectedItem.image && (
                <img src={selectedItem.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                  {SECTOR_ICONS[selectedItem.sector]} {selectedItem.sector} · {selectedItem.business_name}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedItem.title_en}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '3px' }}>
                  ID: <code style={{ color: '#64748b' }}>{selectedItem.id}</code>
                </div>
              </div>
              <button type="button" onClick={() => { setShowAddForm(!showAddForm); setEditingLink(null); }} style={{
                background: showAddForm ? 'rgba(212,175,55,0.2)' : `linear-gradient(135deg, ${GOLD}, #f0c842)`,
                color: showAddForm ? GOLD : '#0f172a',
                border: showAddForm ? `1px solid ${GOLD}40` : 'none',
                borderRadius: '12px', padding: '0.6rem 1.25rem',
                fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: showAddForm ? 'none' : `0 4px 16px ${GOLD}40`,
              }}>
                {showAddForm ? '✕ Cancel' : '+ Add Link'}
              </button>
            </div>
          )}

          {/* ── ADD LINK FORM ── */}
          {showAddForm && (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: `1px solid ${GOLD}30`,
              borderRadius: '20px', padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1rem',
              boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '0.65rem' }}>
                ✦ Add New Link
              </div>

              {/* Link Type Selector */}
              <div>
                <label style={labelStyle}>Link Type</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {LINK_TYPE_OPTIONS.map(opt => {
                    const isSelected = newLink.type === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => setNewLink(l => ({ ...l, type: opt.value }))} style={{
                        padding: '0.4rem 0.9rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 800,
                        background: isSelected ? `${GOLD}20` : 'rgba(255,255,255,0.05)',
                        color: isSelected ? GOLD : '#64748b',
                        outline: isSelected ? `1.5px solid ${GOLD}60` : '1px solid rgba(255,255,255,0.08)',
                        transition: 'all 0.15s',
                      }} title={opt.hint}>
                        {opt.icon} {opt.label}
                      </button>
                    );
                  })}
                </div>
                {newLink.type === 'platform_vendor' && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', color: '#4ade80', fontWeight: 700 }}>
                    🛡️ This will display a verified platform partner badge on the card.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={labelStyle}>Display Title *</label>
                  <input value={newLink.title} onChange={e => setNewLink(l => ({ ...l, title: e.target.value }))} placeholder="e.g. Booking.com Price Check" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Button Badge Text</label>
                  <input value={newLink.badge_text ?? ''} onChange={e => setNewLink(l => ({ ...l, badge_text: e.target.value }))} placeholder="e.g. Booking.com (EGP 2,750) ↗" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>URL *</label>
                <input value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} placeholder="https://... or /jana/vendors?search=..." style={inputStyle} />
                <div style={{ fontSize: '0.66rem', color: '#475569', marginTop: '4px' }}>
                  Use full https:// for external links, or /path for internal pages (platform vendors, sections, etc.)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 160px', gap: '0.7rem', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Icon</label>
                  <input value={newLink.icon ?? ''} onChange={e => setNewLink(l => ({ ...l, icon: e.target.value }))} placeholder="🏨" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>OTA / Platform Name</label>
                  <input value={newLink.ota_name ?? ''} onChange={e => setNewLink(l => ({ ...l, ota_name: e.target.value }))} placeholder="e.g. Booking.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Reference / OTA Price (EGP)</label>
                  <input type="number" value={newLink.benchmark_price ?? ''} onChange={e => setNewLink(l => ({ ...l, benchmark_price: e.target.value ? Number(e.target.value) : undefined }))} placeholder="e.g. 2750" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Accent Color</label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input type="color" value={newLink.accent_color || '#D4AF37'} onChange={e => setNewLink(l => ({ ...l, accent_color: e.target.value }))} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none', padding: 0 }} />
                    <input value={newLink.accent_color ?? ''} onChange={e => setNewLink(l => ({ ...l, accent_color: e.target.value }))} placeholder="#003580" style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!newLink.is_registered_vendor} onChange={e => setNewLink(l => ({ ...l, is_registered_vendor: e.target.checked }))} style={{ accentColor: '#4ade80', width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Show Verified Partner Badge 🛡️</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newLink.is_active !== false} onChange={e => setNewLink(l => ({ ...l, is_active: e.target.checked }))} style={{ accentColor: GOLD, width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Visible to public</span>
                </label>
                <div style={{ marginLeft: 'auto' }}>
                  <button type="button" onClick={addLink} disabled={!newLink.title || !newLink.url} style={{
                    background: (!newLink.title || !newLink.url) ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${GOLD}, #f0c842)`,
                    color: (!newLink.title || !newLink.url) ? '#475569' : '#0f172a',
                    border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem',
                    fontSize: '0.82rem', fontWeight: 900, cursor: (!newLink.title || !newLink.url) ? 'not-allowed' : 'pointer',
                    boxShadow: (!newLink.title || !newLink.url) ? 'none' : `0 4px 16px ${GOLD}40`,
                  }}>
                    + Add Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT FORM ── */}
          {editingLink && (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '20px', padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ✏️ Editing: {editingLink.title}
                </div>
                <button type="button" onClick={() => setEditingLink(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={labelStyle}>Display Title</label>
                  <input value={editingLink.title} onChange={e => setEditingLink(l => l ? { ...l, title: e.target.value } : l)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Badge Text</label>
                  <input value={editingLink.badge_text ?? ''} onChange={e => setEditingLink(l => l ? { ...l, badge_text: e.target.value } : l)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>URL</label>
                <input value={editingLink.url} onChange={e => setEditingLink(l => l ? { ...l, url: e.target.value } : l)} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '0.7rem' }}>
                <div>
                  <label style={labelStyle}>Icon</label>
                  <input value={editingLink.icon ?? ''} onChange={e => setEditingLink(l => l ? { ...l, icon: e.target.value } : l)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>OTA / Platform Name</label>
                  <input value={editingLink.ota_name ?? ''} onChange={e => setEditingLink(l => l ? { ...l, ota_name: e.target.value } : l)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Reference Price (EGP)</label>
                  <input type="number" value={editingLink.benchmark_price ?? ''} onChange={e => setEditingLink(l => l ? { ...l, benchmark_price: e.target.value ? Number(e.target.value) : undefined } : l)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!editingLink.is_registered_vendor} onChange={e => setEditingLink(l => l ? { ...l, is_registered_vendor: e.target.checked } : l)} style={{ accentColor: '#4ade80', width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Verified Partner Badge</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingLink.is_active !== false} onChange={e => setEditingLink(l => l ? { ...l, is_active: e.target.checked } : l)} style={{ accentColor: GOLD, width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Active (visible)</span>
                </label>
                <button type="button" onClick={saveEdit} style={{
                  marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none',
                  borderRadius: '10px', padding: '0.55rem 1.25rem', fontSize: '0.8rem', fontWeight: 900, color: '#fff', cursor: 'pointer',
                }}>
                  ✓ Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ── LINK LIST ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {currentLinks.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '2.5rem',
                textAlign: 'center', color: '#334155',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔗</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.35rem', color: '#475569' }}>No links configured yet</div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>Click "+ Add Link" above to add platform vendors, OTA benchmarks, social contacts, or custom links.</div>
              </div>
            ) : (
              currentLinks.map((link, idx) => {
                const isEditing = editingLink?.id === link.id;
                const isPV = link.type === 'platform_vendor' || link.is_registered_vendor;
                const typeInfo = LINK_TYPE_OPTIONS.find(o => o.value === link.type);
                return (
                  <div key={link.id} style={{
                    background: link.is_active === false
                      ? 'rgba(15,23,42,0.5)'
                      : 'linear-gradient(135deg, #0f172a, #1e293b)',
                    border: `1px solid ${link.is_active === false ? 'rgba(255,255,255,0.04)' : (isPV ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)')}`,
                    borderRadius: '16px', padding: '0.9rem 1.1rem',
                    display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap',
                    opacity: link.is_active === false ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}>
                    {/* Drag order */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                      <button type="button" onClick={() => moveLink(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? '#1e293b' : '#475569', cursor: idx === 0 ? 'not-allowed' : 'pointer', lineHeight: 1, fontSize: '0.8rem' }}>▲</button>
                      <button type="button" onClick={() => moveLink(idx, 1)} disabled={idx === currentLinks.length - 1} style={{ background: 'none', border: 'none', color: idx === currentLinks.length - 1 ? '#1e293b' : '#475569', cursor: idx === currentLinks.length - 1 ? 'not-allowed' : 'pointer', lineHeight: 1, fontSize: '0.8rem' }}>▼</button>
                    </div>

                    {/* Icon */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      background: isPV ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.05)',
                      border: isPV ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    }}>
                      {link.icon ?? typeInfo?.icon ?? '🔗'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#f1f5f9' }}>{link.title}</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {typeInfo?.icon} {typeInfo?.label}
                        </span>
                        {isPV && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: '8px', background: 'rgba(22,163,74,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                            🛡️ Verified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.url}
                      </div>
                      {link.benchmark_price && (
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                          Reference Price: <strong style={{ color: '#94a3b8' }}>EGP {link.benchmark_price.toLocaleString()}</strong>
                          {link.ota_name && <span style={{ color: '#475569' }}> via {link.ota_name}</span>}
                        </div>
                      )}
                    </div>

                    {/* Badge preview */}
                    {link.badge_text && (
                      <div style={{
                        fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                        borderRadius: '20px', background: 'rgba(255,255,255,0.06)',
                        color: link.accent_color || '#94a3b8', border: '1px solid rgba(255,255,255,0.08)',
                        flexShrink: 0, whiteSpace: 'nowrap',
                      }}>
                        {link.badge_text}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button type="button" onClick={() => toggleActive(link.id)} title={link.is_active !== false ? 'Hide from public' : 'Show to public'} style={{
                        background: link.is_active !== false ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${link.is_active !== false ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px', padding: '0.3rem 0.55rem',
                        fontSize: '0.72rem', color: link.is_active !== false ? '#4ade80' : '#475569', cursor: 'pointer',
                      }}>
                        {link.is_active !== false ? '👁' : '🙈'}
                      </button>
                      <button type="button" onClick={() => { setEditingLink(link); setShowAddForm(false); }} style={{
                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '8px', padding: '0.3rem 0.55rem',
                        fontSize: '0.72rem', color: '#a5b4fc', cursor: 'pointer',
                      }}>
                        ✏️
                      </button>
                      <button type="button" onClick={() => deleteLink(link.id)} style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: '8px', padding: '0.3rem 0.55rem',
                        fontSize: '0.72rem', color: '#f87171', cursor: 'pointer',
                      }}>
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tips */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem 1.15rem',
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.65rem' }}>
              💡 How Links Work on Cards
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {[
                { icon: '🛡️', label: 'Platform Vendor', desc: 'Gets a green Verified badge — links to Siwify vendor profile' },
                { icon: '🏨', label: 'External OTA', desc: 'Booking.com, TripAdvisor, Viator — shows external rate for comparison' },
                { icon: '🤝', label: 'Direct Partner', desc: 'External non-registered operator with a direct booking link' },
                { icon: '💬', label: 'Social Contact', desc: 'WhatsApp, Instagram or phone — direct communication' },
                { icon: '🌐', label: 'Custom', desc: 'Any URL: Google Maps, review site, blog post, video' },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>{t.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#334155', lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
