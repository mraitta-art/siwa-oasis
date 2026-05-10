'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Component catalogue: type → display info + manager route ──────────────────
const PALETTE = [
  { zone: 'header', key: 'navigation', name: 'Navigation Bar', icon: '🧭', manager: null, color: '#6366f1' },
  { zone: 'header', key: 'hero_carousel', name: 'Static Hero Carousel', icon: '🎬', manager: '/jana/hero-carousel', color: '#D4AF37' },
  { zone: 'header', key: 'search_bar', name: 'Search Bar (Compact)', icon: '🔍', manager: '/jana/search-engines', color: '#0ea5e9' },
  { zone: 'body', key: 'search_bar', name: 'Search Engine (Full Block)', icon: '🔍', manager: '/jana/search-engines', color: '#0ea5e9' },
  { zone: 'body', key: 'blog', name: 'Master Blog / Articles', icon: '📰', manager: '/jana/blog', color: '#8b5cf6' },
  { zone: 'body', key: 'services', name: 'Business Listings', icon: '🏢', manager: '/jana/businesses', color: '#10b981' },
  { zone: 'body', key: 'testimonials', name: 'Testimonials', icon: '💬', manager: '/jana/data-manager', color: '#f59e0b' },
  { zone: 'body', key: 'map', name: 'Interactive Map', icon: '🗺️', manager: null, color: '#14b8a6' },
  { zone: 'body', key: 'cta_banner', name: 'Call-to-Action Banner', icon: '📣', manager: null, color: '#ef4444' },
  { zone: 'body', key: 'featured_vibe', name: 'Featured Vibe Story', icon: '🪄', manager: null, color: '#D4AF37' },
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
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState('main'); // Can be page slug OR template ID
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeZone, setActiveZone] = useState<Zone>('body');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast(null), 4000); 
  };
  const notify = showToast; // Alias for consistency

  // PAGE SETTINGS
  const [siteSettings, setSiteSettings] = useState<{
    site_name: string; primary_color: string; tagline: string; show_logo_in_hero: boolean; carousel_autoplay: boolean; carousel_interval: number; logo_url?: string; show_watermark?: boolean; logo_height?: number;
  }>({
    site_name: 'Siwa Today', primary_color: '#D4AF37', tagline: 'Experience the magic of the oasis.', show_logo_in_hero: false, carousel_autoplay: true, carousel_interval: 8000, logo_url: '', show_watermark: true, logo_height: 40
  });

  // TEMPLATE META
  const [templateMeta, setTemplateMeta] = useState({ name: '', type_id: '', level: 'basic' });
  const [dynamicComponents, setDynamicComponents] = useState<typeof PALETTE>([]);
  const [searchEngines, setSearchEngines] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);

  // Initial Fetches
  useEffect(() => {
    fetch('/api/jana/website/list').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPages(data.map(p => p.type.replace('website_', '')));
    }).catch(e => console.error('List load failed', e));

    fetch('/api/jana/templates').then(r => r.json()).then(data => {
      setTemplates(Array.isArray(data) ? data : []);
    }).catch(e => console.error('Templates load failed', e));

    fetch('/api/jana/component-library').then(r => r.json()).then(data => {
      const dynamicPalettes = (Array.isArray(data) ? data : []).map(comp => ({
        zone: 'body' as Zone, key: `dynamic_${comp.id}`, name: `${comp.name} (Data)`,
        icon: comp.type === 'carousel' ? '🎠' : comp.type === 'gallery' ? '🖼️' : '📰',
        manager: '/jana/component-library', color: '#ec4899', isDynamic: true
      }));
      setDynamicComponents(dynamicPalettes);
    }).catch(e => console.error('Components load failed', e));

    fetch('/api/jana/search-engines').then(r => r.json()).then(data => setSearchEngines(Array.isArray(data) ? data : [])).catch(() => {});
    fetch('/api/jana/types').then(r => r.json()).then(data => setTypes(Array.isArray(data) ? data : [])).catch(() => {});
    fetch('/api/jana/tiers').then(r => r.json()).then(data => setTiers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // When Mode or CurrentPage changes, load the layout
  useEffect(() => {
    if (mode === 'PAGES') {
      fetch(`/api/jana/website?id=website_${currentPage}`).then(r => r.json()).then(data => {
        const t = data[0];
        if (!t) return setSlots([]);
        if (t.site_settings) setSiteSettings(s => ({ ...s, ...t.site_settings }));
        const all: Slot[] = [
          ...(t.header_components || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'header' as Zone, label: c.name, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id })),
          ...(t.body_components || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'body' as Zone, label: c.name, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id })),
          ...(t.footer_components || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'footer' as Zone, label: c.name, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id })),
        ];
        setSlots(all);
      }).catch(e => console.error('Page load failed', e));
    } else {
      // TEMPLATES Mode
      const tmpl = templates.find(t => t.id === currentPage);
      if (!tmpl) return setSlots([]);
      setTemplateMeta({ name: tmpl.name || '', type_id: tmpl.type_id || '', level: tmpl.level || 'basic' });
      const comps = Array.isArray(tmpl.layout) ? tmpl.layout : [];
      const all: Slot[] = comps.map((c: any) => ({
        id: c.id, key: c.type, zone: (c.zone || 'body') as Zone, label: c.name, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id
      }));
      setSlots(all);
    }
  }, [currentPage, mode, templates]);

  // Mode Switch Handler
  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'PAGES') {
      setCurrentPage(pages[0] || 'main');
    } else {
      setCurrentPage(templates[0]?.id || '');
    }
  };

  const addSlot = (item: typeof PALETTE[0]) => {
    const exists = slots.find(s => s.key === item.key && s.zone === item.zone);
    if (exists) { showToast(`${item.name} is already added.`); return; }
    setSlots(prev => [...prev, { id: `${item.key}_${Date.now()}`, key: item.key, zone: item.zone as Zone, label: item.name }]);
    showToast(`✅ ${item.name} added`);
  };

  const removeSlot = (id: string) => setSlots(prev => prev.filter(s => s.id !== id));
  const moveSlot = (id: string, dir: 'up' | 'down') => {
    setSlots(prev => {
      const zSlots = prev.filter(s => s.zone === activeZone);
      const otherSlots = prev.filter(s => s.zone !== activeZone);
      const i = zSlots.findIndex(s => s.id === id);
      if (i < 0) return prev;
      const swap = dir === 'up' ? i - 1 : i + 1;
      if (swap < 0 || swap >= zSlots.length) return prev;
      [zSlots[i], zSlots[swap]] = [zSlots[swap], zSlots[i]];
      return [...otherSlots, ...zSlots];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const toComp = (s: Slot) => ({
        id: s.id, type: s.key, name: s.label, zone: s.zone,
        props: { title: s.label, engine_id: s.engine_id, carousel_id: s.carousel_id }
      });

      if (mode === 'PAGES') {
        const body = {
          id: `website_${currentPage}`,
          header_components: slots.filter(s => s.zone === 'header').map(toComp),
          body_components: slots.filter(s => s.zone === 'body').map(toComp),
          footer_components: slots.filter(s => s.zone === 'footer').map(toComp),
          site_settings: siteSettings,
        };
        const res = await fetch('/api/jana/website', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Failed to save page');
        showToast(`🚀 ${(currentPage || '').toUpperCase()} published!`);
        if (!pages.includes(currentPage)) setPages([...pages, currentPage]);
      } else {
        if (!templateMeta.level) {
          showToast('❌ You must assign a Tier (Level) to this Blueprint!');
          setSaving(false);
          return;
        }
        const body = {
          id: currentPage,
          name: templateMeta.name,
          type_id: templateMeta.type_id || null, // null for universal
          level: templateMeta.level,
          layout: slots.map(toComp), // Save everything flat, it has 'zone' property
          features: {}
        };
        const res = await fetch('/api/jana/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Failed to save template');
        showToast(`🛡️ BLUEPRINT SECURED & LOCKED!`);
      }
    } catch (e: any) {
      console.error(e);
      showToast('❌ Save failed.');
    }
    setSaving(false);
  };

  const createItem = () => {
    if (mode === 'PAGES') {
      const slug = newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!slug) return;
      setCurrentPage(slug);
      setSlots([]);
      setShowNewPageModal(false);
      setNewPageName('');
      showToast(`✨ New page "${slug}" created`);
    } else {
      const slug = newPageName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (!slug) return;
      const newTmpl = { id: slug, name: newPageName, type_id: '', level: 'basic', layout: [] };
      setTemplates([...templates, newTmpl]);
      setCurrentPage(slug);
      setTemplateMeta({ name: newPageName, type_id: '', level: 'basic' });
      setSlots([]);
      setShowNewPageModal(false);
      setNewPageName('');
      showToast(`✨ New blueprint "${newPageName}" ready to design`);
    }
  };

  const FULL_PALETTE = [...PALETTE, ...dynamicComponents];
  const palettFor = (zone: Zone) => FULL_PALETTE.filter(p => p.zone === zone);
  const slotsFor = (zone: Zone) => slots.filter(s => s.zone === zone);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div style={{ background: '#020617', color: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 200, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#D4AF37,#F5E6AD)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#1a1a2e', boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}>S</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.5px' }}>{mode === 'TEMPLATES' ? 'MINISITE GOVERNANCE' : 'PORTAL ARCHITECT'}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Mode: <span style={{ color: mode === 'TEMPLATES' ? '#10b981' : '#D4AF37', fontWeight: 900 }}>{mode === 'TEMPLATES' ? 'Blueprint Engineering' : 'Portal Orchestration'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => handleModeSwitch('PAGES')}
              style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', background: mode === 'PAGES' ? '#D4AF37' : 'transparent', fontSize: '0.7rem', fontWeight: 900, color: mode === 'PAGES' ? '#1a1a2e' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              <i className="fas fa-globe" style={{ marginRight: '8px' }}></i> MAIN PORTAL
            </button>
            <button
              onClick={() => handleModeSwitch('TEMPLATES')}
              style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', background: mode === 'TEMPLATES' ? '#10b981' : 'transparent', fontSize: '0.7rem', fontWeight: 900, color: mode === 'TEMPLATES' ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              <i className="fas fa-microchip" style={{ marginRight: '8px' }}></i> MINISITE BLUEPRINTS
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {mode === 'PAGES' && (
            <select
              value={currentPage || ''}
              onChange={e => setCurrentPage(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}
            >
              {pages.map(p => <option key={p} value={p} style={{ color: '#000' }}>{(p || '').toUpperCase()} PAGE</option>)}
            </select>
          )}

          {mode === 'TEMPLATES' && (
            <select
              value={currentPage || ''}
              onChange={e => setCurrentPage(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}
            >
              {templates.map(t => <option key={t.id} value={t.id} style={{ color: '#000' }}>{(t.name || 'Unnamed Template').toUpperCase()}</option>)}
            </select>
          )}

          <button onClick={() => setShowNewPageModal(true)} style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid #D4AF37', borderRadius: 8, color: '#D4AF37', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
            + NEW {mode === 'PAGES' ? 'PAGE' : 'TEMPLATE'}
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
          <button onClick={save} disabled={saving} style={{ padding: '0.6rem 1.5rem', background: mode === 'TEMPLATES' ? '#10b981' : 'linear-gradient(135deg,#D4AF37,#F59E0B)', border: 'none', borderRadius: 8, color: mode === 'TEMPLATES' ? '#fff' : '#1a1a2e', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}>
            {saving ? '⏳ Saving…' : (mode === 'TEMPLATES' ? '🔒 SECURE TEMPLATE' : '🚀 Publish')}
          </button>
        </div>
      </div>

      {/* ── Settings Bar ────────────────────────────────────────── */}
      {mode === 'PAGES' ? (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 2rem', overflowX: 'auto' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px' }}>PAGE CONFIG</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>TITLE:</span>
            <input value={siteSettings.site_name} onChange={e => setSiteSettings(s => ({ ...s, site_name: e.target.value }))} placeholder="Title" style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, width: 140 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>TAGLINE:</span>
            <input value={siteSettings.tagline} onChange={e => setSiteSettings(s => ({ ...s, tagline: e.target.value }))} placeholder="Description" style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, width: '100%' }} />
          </div>

          <div style={{ width: '1px', height: '24px', background: '#eee' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37' }}>PLATFORM LOGO:</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  value={siteSettings.logo_url || ''} 
                  onChange={e => setSiteSettings(s => ({ ...s, logo_url: e.target.value }))} 
                  placeholder="Portal Logo URL" 
                  style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, width: 200 }} 
                />
                <label className="upload-btn-mini" style={{ cursor: 'pointer', background: '#f1f5f9', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, border: '1px solid #e2e8f0' }}>
                   <i className="fas fa-cloud-upload-alt"></i>
                   <input 
                     type="file" 
                     hidden 
                     accept="image/*" 
                     onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file) return;
                       showToast('Uploading Platform Logo...');
                       try {
                         const fd = new FormData();
                         fd.append('file', file);
                         fd.append('businessName', 'Platform');
                         fd.append('sectionName', 'branding');
                         const res = await fetch('/api/upload', { method: 'POST', body: fd });
                         const data = await res.json();
                         if (data.url) {
                            setSiteSettings(s => ({ ...s, logo_url: data.url }));
                            showToast('✅ Platform Logo Updated');
                         }
                       } catch (err) { showToast('❌ Logo Upload Failed'); }
                     }}
                   />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37' }}>HEIGHT (PX):</span>
              <input 
                type="number"
                value={siteSettings.logo_height || 40} 
                onChange={e => setSiteSettings(s => ({ ...s, logo_height: parseInt(e.target.value) || 40 }))} 
                style={{ padding: '0.4rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, width: 60 }} 
              />
            </div>

            <div style={{ width: '1px', height: '20px', background: '#eee' }}></div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(212,175,55,0.05)', padding: '4px 10px', borderRadius: '6px' }}>
              <input 
                type="checkbox" 
                checked={siteSettings.show_watermark !== false} 
                onChange={e => setSiteSettings(s => ({ ...s, show_watermark: e.target.checked }))} 
              />
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#1e293b' }}>
                <i className="fas fa-certificate" style={{ color: '#D4AF37', marginRight: '4px' }}></i>
                GLOBAL SIGNATURE (ADMIN ONLY)
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderBottom: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 2rem', overflowX: 'auto' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#10b981', letterSpacing: '2px' }}>TEMPLATE GOVERNANCE</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Name:</span>
            <input value={templateMeta.name} onChange={e => setTemplateMeta(s => ({ ...s, name: e.target.value }))} placeholder="Template Name" style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Applies To:</span>
            <select value={templateMeta.type_id || ''} onChange={e => setTemplateMeta(s => ({ ...s, type_id: e.target.value }))} style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 700 }}>
              <option value="">🌐 UNIVERSAL (All Types)</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name} Only</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Subscription Tier:</span>
            <select value={templateMeta.level || 'basic'} onChange={e => setTemplateMeta(s => ({ ...s, level: e.target.value }))} style={{ padding: '0.4rem', borderRadius: 6, border: '2px solid #D4AF37', fontSize: '0.7rem', fontWeight: 800, background: '#fffbeb' }}>
              <option value="basic">Basic Tier (Free)</option>
              {tiers.filter(t => t.id !== 'free').map(t => <option key={t.id} value={t.id}>{t.name} Tier</option>)}
            </select>
          </div>
        </div>
      )}

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
                  {item.manager && mode === 'PAGES' && <div style={{ fontSize: '0.55rem', color: item.color, fontWeight: 600 }}>Edit Content →</div>}
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
              slotsFor(activeZone).map((slot) => {
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
                        {mode === 'TEMPLATES' ? `VENDOR DATA AUTO-INJECTS HERE` : `PREVIEW OF ${(slot.key || '').toUpperCase()}`}
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
                                {eng.name}
                              </option>
                            ))}
                          </select>
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
                            placeholder={mode === 'TEMPLATES' ? "Leave empty (uses Vendor photos)" : "e.g. main_hero"}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}
                          />
                        </div>
                      )}

                      {slot.key === 'featured_vibe' && (
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>VIBE CATEGORY</label>
                            <input 
                              value={slot.props?.vibe || ''} 
                              onChange={e => {
                                const next = [...slots];
                                const i = next.findIndex(s => s.id === slot.id);
                                next[i].props = { ...(next[i].props || {}), vibe: e.target.value };
                                setSlots(next);
                              }}
                              placeholder="e.g. Salt Lakes" 
                              style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700 }} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>STORY TITLE</label>
                            <input 
                              value={slot.props?.title || ''} 
                              onChange={e => {
                                const next = [...slots];
                                const i = next.findIndex(s => s.id === slot.id);
                                next[i].props = { ...(next[i].props || {}), title: e.target.value };
                                setSlots(next);
                              }}
                              placeholder="e.g. The Turquoise Miracles" 
                              style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700 }} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>DESCRIPTION</label>
                            <textarea 
                              value={slot.props?.description || ''} 
                              onChange={e => {
                                const next = [...slots];
                                const i = next.findIndex(s => s.id === slot.id);
                                next[i].props = { ...(next[i].props || {}), description: e.target.value };
                                setSlots(next);
                              }}
                              placeholder="Tell the story..." 
                              style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700, minHeight: '80px' }} 
                            />
                          </div>
                        </div>
                      )}

                      {def?.manager && mode === 'PAGES' && (
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

      {/* New Page/Template Modal */}
      {showNewPageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 24, width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>Create New {mode === 'PAGES' ? 'Page' : 'Blueprint'}</h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>Enter a name for your new {mode === 'PAGES' ? 'page' : 'template'}.</p>
            <input autoFocus value={newPageName} onChange={e => setNewPageName(e.target.value)} placeholder={mode === 'PAGES' ? "e.g. About Us" : "e.g. Premium Desert Lodge"} style={{ width: '100%', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '1rem', marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowNewPageModal(false)} style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={createItem} style={{ flex: 2, padding: '1rem', background: mode === 'TEMPLATES' ? '#10b981' : '#D4AF37', border: 'none', borderRadius: 12, color: mode === 'TEMPLATES' ? '#fff' : '#1a1a2e', fontWeight: 900, cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ 
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', 
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#D4AF37' : '#0f172a', 
          color: '#fff', padding: '1rem 2rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.85rem', 
          zIndex: 9999, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : toast.type === 'info' ? 'fa-info-circle' : 'fa-check-circle'}`}></i>
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .tab-btn.active { background: #D4AF37 !important; color: #1a1a2e !important; }
      `}</style>
    </div>
  );
}
