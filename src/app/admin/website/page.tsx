'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Component catalogue: type → display info + manager route ──────────────────
const PALETTE = [
  { zone: 'header', key: 'navigation',   name: 'Navigation Bar',         icon: '🧭', manager: null,                        color: '#6366f1' },
  { zone: 'header', key: 'hero_carousel',name: 'Static Hero Carousel',   icon: '🎬', manager: '/admin/hero-carousel',       color: '#D4AF37' },
  { zone: 'header', key: 'search_bar',   name: 'Search Bar',             icon: '🔍', manager: '/admin/search-engines',      color: '#0ea5e9' },
  { zone: 'body',   key: 'blog',         name: 'Master Blog / Articles', icon: '📰', manager: '/admin/blog',                color: '#8b5cf6' },
  { zone: 'body',   key: 'services',     name: 'Business Listings',      icon: '🏢', manager: '/admin/businesses',          color: '#10b981' },
  { zone: 'body',   key: 'testimonials', name: 'Testimonials',           icon: '💬', manager: '/admin/data-manager',        color: '#f59e0b' },
  { zone: 'body',   key: 'map',          name: 'Interactive Map',        icon: '🗺️', manager: null,                        color: '#14b8a6' },
  { zone: 'body',   key: 'cta_banner',   name: 'Call-to-Action Banner',  icon: '📣', manager: null,                        color: '#ef4444' },
  { zone: 'body',   key: 'features',     name: 'Feature Highlights',     icon: '⭐', manager: null,                        color: '#84cc16' },
  { zone: 'footer', key: 'contact',      name: 'Contact Info',           icon: '📞', manager: null,                        color: '#64748b' },
  { zone: 'footer', key: 'social',       name: 'Social Media Links',     icon: '🔗', manager: null,                        color: '#1d4ed8' },
  { zone: 'footer', key: 'copyright',    name: 'Copyright Bar',          icon: '©️', manager: null,                        color: '#475569' },
];

const zoneColors: Record<string, string> = { header: '#D4AF37', body: '#10b981', footer: '#64748b' };

type Zone = 'header' | 'body' | 'footer';
interface Slot { id: string; key: string; zone: Zone; label: string; }

export default function SiteBuilderPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeZone, setActiveZone] = useState<Zone>('body');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState({ 
    site_name: 'Siwa Today', 
    primary_color: '#D4AF37', 
    tagline: 'Experience the magic of the oasis.',
    show_logo_in_hero: false,
    carousel_autoplay: true,
    carousel_interval: 8000
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const [dynamicComponents, setDynamicComponents] = useState<typeof PALETTE>([]);

  // Load saved layout and dynamic components
  useEffect(() => {
    fetch('/api/admin/website?type=main').then(r => r.json()).then(data => {
      const t = data[0];
      if (!t) return;
      if (t.site_settings) setSiteSettings(s => ({ ...s, ...t.site_settings }));
      const all: Slot[] = [
        ...(t.header_components || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'header' as Zone, label: c.name })),
        ...(t.body_components   || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'body'   as Zone, label: c.name })),
        ...(t.footer_components || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'footer' as Zone, label: c.name })),
      ];
      setSlots(all);
    }).catch(() => {});

    // Fetch dynamic Data-Bound components from Component Library
    fetch('/api/admin/component-library').then(r => r.json()).then(data => {
      const dynamicPalettes = (Array.isArray(data) ? data : []).map(comp => ({
        zone: 'body' as Zone, // Data-bound components usually go in the body
        key: `dynamic_${comp.id}`,
        name: `${comp.name} (Data-Bound)`,
        icon: comp.type === 'carousel' ? '🎠' : comp.type === 'gallery' ? '🖼️' : '📰',
        manager: '/admin/component-library',
        color: '#ec4899',
        isDynamic: true
      }));
      setDynamicComponents(dynamicPalettes);
    }).catch(() => {});
  }, []);

  // Add component slot
  const addSlot = (item: typeof PALETTE[0]) => {
    const exists = slots.find(s => s.key === item.key && s.zone === item.zone);
    if (exists) { showToast(`${item.name} is already on the page.`); return; }
    setSlots(prev => [...prev, { id: `${item.key}_${Date.now()}`, key: item.key, zone: item.zone as Zone, label: item.name }]);
    showToast(`✅ ${item.name} added to ${item.zone}`);
  };

  const removeSlot = (id: string) => setSlots(prev => prev.filter(s => s.id !== id));

  const moveSlot = (id: string, dir: 'up' | 'down') => {
    setSlots(prev => {
      const i = prev.findIndex(s => s.id === id);
      if (i < 0) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? i - 1 : i + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[i], next[swap]] = [next[swap], next[i]];
      return next;
    });
  };

  // Save layout back to API
  const save = async () => {
    setSaving(true);
    const toComp = (s: Slot) => ({ id: s.id, type: s.key, name: s.label, props: { title: s.label } });
    const body = {
      id: 'website_main',
      business_type_id: null,
      header_components: slots.filter(s => s.zone === 'header').map(toComp),
      body_components:   slots.filter(s => s.zone === 'body').map(toComp),
      footer_components: slots.filter(s => s.zone === 'footer').map(toComp),
      site_settings: siteSettings,
    };
    const res = await fetch('/api/admin/website', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    showToast(res.ok ? '🚀 Layout published!' : '❌ Save failed.');
  };

  const FULL_PALETTE = [...PALETTE, ...dynamicComponents];
  const palettFor = (zone: Zone) => FULL_PALETTE.filter(p => p.zone === zone);
  const slotsFor  = (zone: Zone) => slots.filter(s => s.zone === zone);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div style={{ background: '#0f172a', color: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#D4AF37,#F5E6AD)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#1a1a2e', fontSize: '1.1rem' }}>S</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.5px' }}>SITE BUILDER</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Layout Composer — add blocks, manage content in their editors</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/" target="_blank" style={{ padding: '0.5rem 1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700 }}>👁 Preview Site</Link>
          <button onClick={save} disabled={saving} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg,#D4AF37,#F59E0B)', border: 'none', borderRadius: 8, color: '#1a1a2e', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}>
            {saving ? '⏳ Saving…' : '🚀 Publish Layout'}
          </button>
        </div>
      </div>

      {/* ── Zone Tabs ───────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 0, padding: '0 2rem' }}>
        {(['header', 'body', 'footer'] as Zone[]).map(z => (
          <button key={z} onClick={() => setActiveZone(z)} style={{ padding: '0.9rem 1.5rem', border: 'none', borderBottom: activeZone === z ? `3px solid ${zoneColors[z]}` : '3px solid transparent', background: 'none', fontWeight: activeZone === z ? 800 : 500, color: activeZone === z ? '#0f172a' : '#64748b', fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {z === 'header' ? '⬆' : z === 'footer' ? '⬇' : '▦'} {z} <span style={{ background: zoneColors[z], color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.65rem', marginLeft: 6 }}>{slotsFor(z).length}</span>
          </button>
        ))}
        {/* Global Settings inline */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="show-logo-hero"
              checked={siteSettings.show_logo_in_hero} 
              onChange={e => setSiteSettings(s => ({...s, show_logo_in_hero: e.target.checked}))} 
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="show-logo-hero" style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}>LOGO</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
            <input 
              type="checkbox" 
              id="carousel-auto"
              checked={siteSettings.carousel_autoplay} 
              onChange={e => setSiteSettings(s => ({...s, carousel_autoplay: e.target.checked}))} 
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="carousel-auto" style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}>AUTOPLAY</label>
            <input 
              type="number" 
              value={siteSettings.carousel_interval} 
              onChange={e => setSiteSettings(s => ({...s, carousel_interval: parseInt(e.target.value)}))} 
              style={{ width: 60, padding: '2px 5px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.7rem', fontWeight: 800 }} 
              step="1000"
              min="2000"
            />
            <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>ms</span>
          </div>
          <input value={siteSettings.site_name} onChange={e => setSiteSettings(s => ({...s, site_name: e.target.value}))} placeholder="Site Name" style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, width: 140 }} />
          <input type="color" value={siteSettings.primary_color} onChange={e => setSiteSettings(s => ({...s, primary_color: e.target.value}))} style={{ width: 36, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} title="Brand Color" />
        </div>
      </div>

      {/* ── Main Layout: Palette | Canvas ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 130px)' }}>

        {/* LEFT: Component Palette */}
        <div style={{ background: '#fff', borderRight: '1px solid #e2e8f0', padding: '1.5rem 1rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1rem' }}>ADD TO {activeZone.toUpperCase()}</div>
          {palettFor(activeZone).map(item => (
            <button key={item.key} onClick={() => addSlot(item)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: `1px solid ${item.color}22`, borderRadius: 10, background: `${item.color}08`, marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
              <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>{item.name}</div>
                {item.manager && <div style={{ fontSize: '0.6rem', color: item.color, fontWeight: 600, marginTop: 2 }}>→ {item.manager}</div>}
              </div>
              <span style={{ fontSize: '1.1rem', color: item.color, fontWeight: 900 }}>+</span>
            </button>
          ))}

          {/* Quick nav to managers */}
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '0.75rem' }}>CONTENT MANAGERS</div>
            {[
              { label: '🎬 Hero Carousel', href: '/admin/hero-carousel' },
              { label: '📰 Blog Manager',  href: '/admin/blog' },
              { label: '🏢 Businesses',    href: '/admin/businesses' },
              { label: '🔍 Search Engines',href: '/admin/search-engines' },
              { label: '📦 Component Lib', href: '/admin/component-library' },
            ].map(m => (
              <Link key={m.href} href={m.href} style={{ display: 'block', padding: '0.5rem 0.75rem', borderRadius: 6, textDecoration: 'none', color: '#334155', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                {m.label} →
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT: Canvas */}
        <div style={{ padding: '2rem', overflowY: 'auto', background: '#f8fafc' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>

            {/* Zone label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: zoneColors[activeZone] }} />
              <span style={{ fontWeight: 900, fontSize: '0.7rem', letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase' }}>{activeZone} zone — {slotsFor(activeZone).length} component(s)</span>
            </div>

            {/* Component Slots */}
            {slotsFor(activeZone).length === 0 && (
              <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '2px dashed #e2e8f0', borderRadius: 16, color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>＋</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>No components yet</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Click a block from the left panel to add it here</div>
              </div>
            )}

            {slotsFor(activeZone).map((slot, idx) => {
              const def = FULL_PALETTE.find(p => p.key === slot.key && p.zone === activeZone) || FULL_PALETTE.find(p => p.key === slot.key);
              const color = def?.color || '#64748b';
              const manager = def?.manager || null;
              const icon = def?.icon || '📦';
              const zSlots = slotsFor(activeZone);
              const zIdx = zSlots.findIndex(s => s.id === slot.id);

              return (
                <div key={slot.id} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${color}33`, marginBottom: '1rem', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
                  {/* Slot header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', background: `${color}08`, borderBottom: `1px solid ${color}22` }}>
                    <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{slot.label}</div>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>{slot.key} — {activeZone}</div>
                    </div>
                    {/* Reorder */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => moveSlot(slot.id, 'up')} disabled={zIdx === 0} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.7rem', opacity: zIdx === 0 ? 0.3 : 1 }}>↑</button>
                      <button onClick={() => moveSlot(slot.id, 'down')} disabled={zIdx === zSlots.length - 1} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.7rem', opacity: zIdx === zSlots.length - 1 ? 0.3 : 1 }}>↓</button>
                    </div>
                    <button onClick={() => removeSlot(slot.id)} style={{ padding: '4px 10px', border: '1px solid #fecaca', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.75rem', color: '#ef4444' }}>✕</button>
                  </div>

                  {/* Slot body: visual preview shell + manage button */}
                  <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Mini preview */}
                    <div style={{ flex: 1, minHeight: 70, background: `${color}06`, borderRadius: 10, border: `1px dashed ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: color, fontSize: '0.8rem', fontWeight: 700 }}>
                      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                      <span style={{ opacity: 0.7 }}>{slot.label} — content managed separately</span>
                    </div>

                    {/* Manager link */}
                    {manager ? (
                      <Link href={manager} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.75rem 1.25rem', background: color, borderRadius: 10, textDecoration: 'none', color: '#fff', fontWeight: 800, fontSize: '0.72rem', minWidth: 110, textAlign: 'center', boxShadow: `0 6px 16px ${color}44`, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '1.1rem' }}>✏️</span>
                        Manage Content
                        <span style={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: 400 }}>{manager.replace('/admin/', '')}</span>
                      </Link>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.75rem 1.25rem', background: '#f1f5f9', borderRadius: 10, color: '#64748b', fontWeight: 700, fontSize: '0.72rem', minWidth: 110, textAlign: 'center' }}>
                        <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                        Static Block
                        <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>no editor needed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Full page summary at bottom */}
            {slots.length > 0 && (
              <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1rem' }}>FULL PAGE LAYOUT PREVIEW</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(['header', 'body', 'footer'] as Zone[]).map(z => (
                    slotsFor(z).map((s, i) => {
                      const d = FULL_PALETTE.find(p => p.key === s.key);
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: `${zoneColors[z]}08`, borderRadius: 8, border: `1px solid ${zoneColors[z]}22` }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: zoneColors[z], textTransform: 'uppercase', width: 50 }}>{z}</span>
                          <span style={{ fontSize: '0.9rem' }}>{d?.icon}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, flex: 1 }}>{s.label}</span>
                          {d?.manager && <Link href={d.manager} style={{ fontSize: '0.65rem', color: zoneColors[z], fontWeight: 700, textDecoration: 'none' }}>Edit →</Link>}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', padding: '1rem 2rem', borderRadius: 50, fontWeight: 700, fontSize: '0.85rem', zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
