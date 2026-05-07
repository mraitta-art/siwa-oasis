'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Component catalogue: type → display info + manager route ──────────────────
const PALETTE = [
  { zone: 'header', key: 'navigation', name: 'Navigation Bar', icon: '🧭', manager: null, color: '#6366f1' },
  { zone: 'header', key: 'hero_carousel', name: 'Static Hero Carousel', icon: '🎬', manager: '/jana/hero-carousel', color: '#D4AF37' },
  { zone: 'header', key: 'search_bar', name: 'Search Bar', icon: '🔍', manager: '/jana/search-engines', color: '#0ea5e9' },
  { zone: 'body', key: 'blog', name: 'Master Blog / Articles', icon: '📰', manager: '/jana/blog', color: '#8b5cf6' },
  { zone: 'body', key: 'services', name: 'Business Listings', icon: '🏢', manager: '/jana/businesses', color: '#10b981' },
  { zone: 'body', key: 'testimonials', name: 'Testimonials', icon: '💬', manager: '/jana/data-manager', color: '#f59e0b' },
  { zone: 'body', key: 'map', name: 'Interactive Map', icon: '🗺️', manager: null, color: '#14b8a6' },
  { zone: 'body', key: 'cta_banner', name: 'Call-to-Action Banner', icon: '📣', manager: null, color: '#ef4444' },
  { zone: 'body', key: 'features', name: 'Feature Highlights', icon: '⭐', manager: null, color: '#84cc16' },
  { zone: 'footer', key: 'contact', name: 'Contact Info', icon: '📞', manager: null, color: '#64748b' },
  { zone: 'footer', key: 'social', name: 'Social Media Links', icon: '🔗', manager: null, color: '#1d4ed8' },
  { zone: 'footer', key: 'copyright', name: 'Copyright Bar', icon: '©️', manager: null, color: '#475569' },
];

const zoneColors: Record<string, string> = { header: '#D4AF37', body: '#10b981', footer: '#64748b' };

type Zone = 'header' | 'body' | 'footer';
interface Slot { id: string; key: string; zone: Zone; label: string; engine_id?: string; carousel_id?: string; }

type Mode = 'PAGES' | 'TEMPLATES';

export default function MultiPageSiteBuilder() {
  const [mode, setMode] = useState<Mode>('PAGES');
  const [pages, setPages] = useState<string[]>(['main']);
  const [types, setTypes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState('main');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeZone, setActiveZone] = useState<Zone>('body');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  const [siteSettings, setSiteSettings] = useState<{
    site_name: string;
    primary_color: string;
    tagline: string;
    show_logo_in_hero: boolean;
    carousel_autoplay: boolean;
    carousel_interval: number;
    logo_url?: string;
  }>({
    site_name: 'Siwa Today',
    primary_color: '#D4AF37',
    tagline: 'Experience the magic of the oasis.',
    show_logo_in_hero: false,
    carousel_autoplay: true,
    carousel_interval: 8000,
    logo_url: ''
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const [dynamicComponents, setDynamicComponents] = useState<typeof PALETTE>([]);

  // Load pages list
  useEffect(() => {
    fetch('/api/jana/website/list').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPages(data.map(p => p.type.replace('website_', '')));
    }).catch(() => { });
  }, []);

  // Load specific page layout
  useEffect(() => {
    const configId = mode === 'TEMPLATES' ? `template_${currentPage}` : `website_${currentPage}`;
    fetch(`/api/jana/website?id=${configId}`).then(r => r.json()).then(data => {
      const t = data[0];
      if (!t) {
        setSlots([]); // Reset if new page/template
        return;
      }
      if (t.site_settings) setSiteSettings(s => ({ ...s, ...t.site_settings }));
      const all: Slot[] = [
        ...(t.header_components || []).map((c: any) => ({
          id: c.id, key: c.type, zone: 'header' as Zone, label: c.name,
          engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id
        })),
        ...(t.body_components || []).map((c: any) => ({
          id: c.id, key: c.type, zone: 'body' as Zone, label: c.name,
          engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id
        })),
        ...(t.footer_components || []).map((c: any) => ({
          id: c.id, key: c.type, zone: 'footer' as Zone, label: c.name,
          engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id
        })),
      ];
      setSlots(all);
    }).catch(() => { });

    // Fetch dynamic Data-Bound components
    fetch('/api/jana/component-library').then(r => r.json()).then(data => {
      const dynamicPalettes = (Array.isArray(data) ? data : []).map(comp => ({
        zone: 'body' as Zone,
        key: `dynamic_${comp.id}`,
        name: `${comp.name} (Data)`,
        icon: comp.type === 'carousel' ? '🎠' : comp.type === 'gallery' ? '🖼️' : '📰',
        manager: '/jana/component-library',
        color: '#ec4899',
        isDynamic: true
      }));
      setDynamicComponents(dynamicPalettes);
    }).catch(() => { });

    // Fetch search engines for dropdowns
    fetch('/api/jana/search-engines').then(r => r.json()).then(data => {
      setSearchEngines(Array.isArray(data) ? data : []);
    }).catch(() => { });

    // Fetch business types for Template Mode
    fetch('/api/jana/types').then(r => r.json()).then(data => {
      setTypes(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, [currentPage, mode]);

  const [searchEngines, setSearchEngines] = useState<any[]>([]);

  const addSlot = (item: typeof PALETTE[0]) => {
    const exists = slots.find(s => s.key === item.key && s.zone === item.zone);
    if (exists) { showToast(`${item.name} is already on the page.`); return; }
    setSlots(prev => [...prev, { id: `${item.key}_${Date.now()}`, key: item.key, zone: item.zone as Zone, label: item.name }]);
    showToast(`✅ ${item.name} added`);
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

  const save = async () => {
    setSaving(true);
    const toComp = (s: Slot) => ({
      id: s.id,
      type: s.key,
      name: s.label,
      props: { title: s.label, engine_id: s.engine_id, carousel_id: s.carousel_id }
    });
    const configId = mode === 'TEMPLATES' ? `template_${currentPage}` : `website_${currentPage}`;
    const body = {
      id: configId,
      header_components: slots.filter(s => s.zone === 'header').map(toComp),
      body_components: slots.filter(s => s.zone === 'body').map(toComp),
      footer_components: slots.filter(s => s.zone === 'footer').map(toComp),
      site_settings: siteSettings,
    };
    const res = await fetch('/api/jana/website', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    showToast(res.ok ? `🚀 ${currentPage.toUpperCase()} published!` : '❌ Save failed.');
    if (res.ok && mode === 'PAGES' && !pages.includes(currentPage)) setPages([...pages, currentPage]);
  };

  const createPage = () => {
    const slug = newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) return;
    setCurrentPage(slug);
    setSlots([]);
    setShowNewPageModal(false);
    setNewPageName('');
    showToast(`✨ New page "${slug}" created (unsaved)`);
  };

  const FULL_PALETTE = [...PALETTE, ...dynamicComponents];
  const palettFor = (zone: Zone) => FULL_PALETTE.filter(p => p.zone === zone);
  const slotsFor = (zone: Zone) => slots.filter(s => s.zone === zone);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div style={{ background: '#0f172a', color: '#fff', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#D4AF37,#F5E6AD)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#1a1a2e' }}>S</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '-0.5px' }}>{mode === 'TEMPLATES' ? 'BLUEPRINT ARCHITECT' : 'MULTI-PAGE BUILDER'}</div>
              <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Editing: <span style={{ color: mode === 'TEMPLATES' ? '#10b981' : '#D4AF37', fontWeight: 900 }}>{currentPage.toUpperCase()} {mode === 'TEMPLATES' ? 'BLUEPRINT' : ''}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => { setMode('PAGES'); setCurrentPage('main'); }}
              style={{ padding: '0.4rem 1.25rem', border: 'none', borderRadius: '7px', background: mode === 'PAGES' ? '#D4AF37' : 'transparent', fontSize: '0.65rem', fontWeight: 900, color: mode === 'PAGES' ? '#1a1a2e' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s' }}>
              GLOBAL PAGES
            </button>
            <button
              onClick={() => { setMode('TEMPLATES'); setCurrentPage(types[0]?.id || ''); }}
              style={{ padding: '0.4rem 1.25rem', border: 'none', borderRadius: '7px', background: mode === 'TEMPLATES' ? '#10b981' : 'transparent', fontSize: '0.65rem', fontWeight: 900, color: mode === 'TEMPLATES' ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s' }}>
              BLUEPRINTS
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {mode === 'PAGES' && (
            <>
              <select
                value={currentPage}
                onChange={e => setCurrentPage(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}
              >
                {pages.map(p => <option key={p} value={p} style={{ color: '#000' }}>{p.toUpperCase()} PAGE</option>)}
              </select>
              <button onClick={() => setShowNewPageModal(true)} style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid #D4AF37', borderRadius: 8, color: '#D4AF37', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ NEW PAGE</button>
            </>
          )}

          {mode === 'TEMPLATES' && (
            <select
              value={currentPage}
              onChange={e => setCurrentPage(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}
            >
              {types.map(t => <option key={t.id} value={t.id} style={{ color: '#000' }}>{t.name.toUpperCase()} BLUEPRINT</option>)}
            </select>
          )}

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
          <Link href={mode === 'TEMPLATES' ? `/jana/types` : (currentPage === 'main' ? '/' : `/p/${currentPage}`)} target="_blank" style={{ padding: '0.5rem 1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700 }}>👁 {mode === 'TEMPLATES' ? 'Registry' : 'Preview'}</Link>
          <button onClick={save} disabled={saving} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg,#D4AF37,#F59E0B)', border: 'none', borderRadius: 8, color: '#1a1a2e', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}>
            {saving ? '⏳ Saving…' : '🚀 Publish'}
          </button>
        </div>
      </div>

      {/* ── Settings Bar ────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 2rem', overflowX: 'auto' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px' }}>CONFIG</div>
        <input value={siteSettings.site_name} onChange={e => setSiteSettings(s => ({ ...s, site_name: e.target.value }))} placeholder="Title" style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, width: 140 }} />
        <input value={siteSettings.tagline} onChange={e => setSiteSettings(s => ({ ...s, tagline: e.target.value }))} placeholder="Description" style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, flex: 1 }} />
        <input type="color" value={siteSettings.primary_color} onChange={e => setSiteSettings(s => ({ ...s, primary_color: e.target.value }))} style={{ width: 30, height: 30, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
      </div>

      {/* ── Main Layout: Palette | Canvas ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: Component Palette */}
        <div style={{ background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '4px' }}>
            {(['header', 'body', 'footer'] as Zone[]).map(z => (
              <button key={z} onClick={() => setActiveZone(z)} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: 6, background: activeZone === z ? zoneColors[z] : '#f1f5f9', color: activeZone === z ? '#fff' : '#64748b', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>{z}</button>
            ))}
          </div>
          <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '1rem' }}>BLOCKS FOR {activeZone.toUpperCase()}</div>
            {palettFor(activeZone).map(item => (
              <button key={item.key} onClick={() => addSlot(item)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: `1px solid ${item.color}22`, borderRadius: 10, background: `${item.color}08`, marginBottom: '0.5rem', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#0f172a' }}>{item.name}</div>
                  {item.manager && <div style={{ fontSize: '0.55rem', color: item.color, fontWeight: 600 }}>Edit Content →</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Canvas */}
        <div style={{ padding: '2rem', overflowY: 'auto', background: '#f8fafc' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {slotsFor(activeZone).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '2px dashed #cbd5e1', borderRadius: 20, color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem' }}>＋</div>
                <div style={{ fontWeight: 800 }}>No {activeZone} blocks added</div>
                <div style={{ fontSize: '0.7rem' }}>Select a component from the left to start building</div>
              </div>
            ) : (
              slotsFor(activeZone).map((slot, idx) => {
                const def = FULL_PALETTE.find(p => p.key === slot.key);
                const color = def?.color || '#64748b';
                const zSlots = slotsFor(activeZone);
                const zIdx = zSlots.findIndex(s => s.id === slot.id);

                return (
                  <div key={slot.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${color}33`, marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: `${color}05`, borderBottom: `1px solid ${color}11` }}>
                      <span style={{ fontSize: '1.2rem' }}>{def?.icon}</span>
                      <div style={{ flex: 1, fontWeight: 800, fontSize: '0.8rem' }}>{slot.label}</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => moveSlot(slot.id, 'up')} disabled={zIdx === 0} style={{ padding: '2px 8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', opacity: zIdx === 0 ? 0.3 : 1 }}>↑</button>
                        <button onClick={() => moveSlot(slot.id, 'down')} disabled={zIdx === zSlots.length - 1} style={{ padding: '2px 8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', opacity: zIdx === zSlots.length - 1 ? 0.3 : 1 }}>↓</button>
                        <button onClick={() => removeSlot(slot.id)} style={{ padding: '2px 8px', background: '#fff', border: '1px solid #fee2e2', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ flex: 1, height: '40px', background: `${color}05`, borderRadius: 6, border: `1px dashed ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: color, fontWeight: 700 }}>
                        PREVIEW OF {slot.key.toUpperCase()}
                      </div>

                      {slot.key === 'search_bar' && (
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>LINKED SEARCH ENGINE</label>
                          <select
                            value={slot.engine_id || ''}
                            onChange={e => {
                              const next = [...slots];
                              const i = next.findIndex(s => s.id === slot.id);
                              next[i].engine_id = e.target.value;
                              setSlots(next);
                            }}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            <option value="">Default (Global Search)</option>
                            {searchEngines.map(eng => (
                              <option key={eng.id} value={eng.id}>
                                {eng.name} {eng.validation?.isValid ? '🟢' : '⚠️'}
                              </option>
                            ))}
                          </select>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                            Choose the search logic (Policy) this bar will use.
                          </div>
                        </div>
                      )}

                      {slot.key === 'hero_carousel' && (
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>CAROUSEL CONTENT ID</label>
                          <input
                            value={slot.carousel_id || ''}
                            onChange={e => {
                              const next = [...slots];
                              const i = next.findIndex(s => s.id === slot.id);
                              next[i].carousel_id = e.target.value.toLowerCase().replace(/\s+/g, '_');
                              setSlots(next);
                            }}
                            placeholder="e.g. main_hero or about_hero"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}
                          />
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                            Every page can have its own unique set of slides.
                          </div>
                        </div>
                      )}

                      {def?.manager && (
                        <Link
                          href={`${def.manager}${slot.carousel_id ? `?siteId=${slot.carousel_id}` : ''}`}
                          style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: color, color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800 }}
                        >
                          MANAGE CONTENT
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Page Modal */}
      {showNewPageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 24, width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>Create New Page</h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>Enter a name for your custom website page.</p>
            <input autoFocus value={newPageName} onChange={e => setNewPageName(e.target.value)} placeholder="e.g. About Us" style={{ width: '100%', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '1rem', marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowNewPageModal(false)} style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={createPage} style={{ flex: 2, padding: '1rem', background: '#D4AF37', border: 'none', borderRadius: 12, color: '#1a1a2e', fontWeight: 900, cursor: 'pointer' }}>Create Page</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', padding: '1rem 2rem', borderRadius: 50, fontWeight: 700, fontSize: '0.85rem', zIndex: 9999 }}>{toast}</div>
      )}
    </div>
  );
}
