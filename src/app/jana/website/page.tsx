'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface PaletteItem {
  zone: string;
  key: string;
  name: string;
  icon: string;
  manager: string | null;
  color: string;
  desc: string;
  isDynamic?: boolean;
}

// ── Component catalogue — SYNCED with DynamicHomepageRenderer ─────────────────
const PALETTE: PaletteItem[] = [
  // ── Header zone ──
  { zone: 'header', key: 'hero_carousel',  name: 'Hero Carousel',           icon: '🎬', manager: '/jana/hero-carousel',  color: '#D4AF37', desc: 'Full-screen cinematic slideshow' },
  { zone: 'header', key: 'search_bar',     name: 'Search Bar (Compact)',    icon: '🔍', manager: '/jana/search-engines', color: '#0ea5e9', desc: 'Compact header search widget' },

  // ── Body zone ──
  { zone: 'body',   key: 'hero_carousel',        name: 'Hero Carousel',            icon: '🎬', manager: '/jana/hero-carousel',  color: '#D4AF37', desc: 'Full-screen cinematic slideshow' },
  { zone: 'body',   key: 'services_hub',          name: 'Services Hub',             icon: '🏛️', manager: '/jana/businesses',     color: '#6366f1', desc: 'Directory of all services & categories' },
  { zone: 'body',   key: 'experience_categories', name: 'Experience Categories',    icon: '🎭', manager: null,                  color: '#8b5cf6', desc: 'Interactive category cards' },
  { zone: 'body',   key: 'search_bar',            name: 'Search Engine (Full)',     icon: '🔍', manager: '/jana/search-engines', color: '#0ea5e9', desc: 'Full-width search block' },
  { zone: 'body',   key: 'smart_journey_planner', name: 'Journey Planner',         icon: '🗓️', manager: null,                  color: '#14b8a6', desc: 'AI-powered trip planning tool' },
  { zone: 'body',   key: 'ecosystem_map',         name: 'Interactive Map',         icon: '🗺️', manager: null,                  color: '#10b981', desc: 'Full ecosystem map of Siwa' },
  { zone: 'body',   key: 'local_products',        name: 'Local Products',          icon: '🫒', manager: null,                  color: '#84cc16', desc: 'Showcase of artisan & local goods' },
  { zone: 'body',   key: 'storytelling_section',  name: 'Storytelling',            icon: '📖', manager: null,                  color: '#f59e0b', desc: 'Heritage & culture narratives' },
  { zone: 'body',   key: 'partner_cta',           name: 'Partner CTA',             icon: '🤝', manager: null,                  color: '#ef4444', desc: 'Call-to-action for partnerships' },
  { zone: 'body',   key: 'blog',                  name: 'Blog / Articles',         icon: '📰', manager: '/jana/blog',           color: '#8b5cf6', desc: 'Latest blog posts feed' },
  { zone: 'body',   key: 'featured_vibe',         name: 'Featured Vibe Story',     icon: '🪄', manager: null,                  color: '#D4AF37', desc: 'Highlighted experience story' },
  { zone: 'body',   key: 'investment_feed',       name: 'Investment Marketplace',  icon: '💎', manager: null,                  color: '#ec4899', desc: 'Heritage investment opportunities' },
  { zone: 'body',   key: 'services',              name: 'Business Listings CTA',   icon: '🏢', manager: '/jana/businesses',     color: '#10b981', desc: 'Simple verified-businesses banner' },

  // ── Footer zone ──
  { zone: 'footer', key: 'partner_cta',    name: 'Partner CTA (Footer)',     icon: '🤝', manager: null,                  color: '#ef4444', desc: 'Footer partnership call-to-action' },
  { zone: 'footer', key: 'blog',           name: 'Recent Articles (Footer)', icon: '📰', manager: '/jana/blog',           color: '#8b5cf6', desc: 'Blog posts in footer area' },
];

const ZONE_COLORS: Record<string, string> = { header: '#D4AF37', body: '#10b981', footer: '#64748b' };

// ── Theme Presets (curated Oasis palettes) ────────────────────────────────────
const THEME_PRESETS = [
  { id: 'warm_sand',        name: '🏜️ Warm Sand (Light Oasis)',      bg_color: '#FAF6F0', nav_bg_color: '#556B2F', primary_color: '#FFB700' },
  { id: 'midnight_desert',  name: '🌙 Midnight Desert (Dark Modern)', bg_color: '#0a0f1d', nav_bg_color: '#1e293b', primary_color: '#00CED1' },
  { id: 'dark_olive',       name: '🌿 Classic Dark Olive',            bg_color: '#2C3E25', nav_bg_color: '#1a2417', primary_color: '#FFB700' },
  { id: 'lagoon_springs',   name: '🌊 Lagoon Springs (Turquoise)',    bg_color: '#EBF7F6', nav_bg_color: '#20B2AA', primary_color: '#FF7F50' },
];

type Zone = 'header' | 'body' | 'footer';
interface Slot { id: string; key: string; zone: Zone; label: string; engine_id?: string; carousel_id?: string; props?: Record<string, any>; }
interface PageMeta { slug: string; saved: boolean; type: 'page' | 'search'; }
type Mode = 'PAGES' | 'TEMPLATES';

export default function MultiPageSiteBuilder() {
  const dragSrcId = React.useRef<string | null>(null);
  const [mode, setMode]                 = useState<Mode>('PAGES');
  const [pages, setPages]               = useState<PageMeta[]>([{ slug: 'main', saved: true, type: 'page' }]);
  const [types, setTypes]               = useState<any[]>([]);
  const [templates, setTemplates]       = useState<any[]>([]);
  const [currentPage, setCurrentPage]   = useState('main');
  const [pageSearch, setPageSearch]     = useState('');
  const [slots, setSlots]               = useState<Slot[]>([]);
  const [activeZone, setActiveZone]     = useState<Zone>('body');
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [dynamicComponents, setDynamic] = useState<PaletteItem[]>([]);
  const [searchEngines, setSearchEngines] = useState<any[]>([]);
  const [tiers, setTiers]               = useState<any[]>([]);
  const [toast, setToast]               = useState<{ msg: string; type: 'success'|'error'|'info' }|null>(null);

  // Modals
  const [showNewModal, setShowNewModal]       = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [newPageName, setNewPageName]         = useState('');
  const [renameTarget, setRenameTarget]       = useState('');
  const [renameValue, setRenameValue]         = useState('');
  const [deleteTarget, setDeleteTarget]       = useState('');
  const [editingSlot, setEditingSlot]         = useState<Slot | null>(null);
  const [editSlotProps, setEditSlotProps]    = useState<Record<string, any>>({});
  const [showPageStyleModal, setShowPageStyleModal] = useState(false);
  const [dragEnabledSlotId, setDragEnabledSlotId] = useState<string | null>(null);

  // Template meta
  const [templateMeta, setTemplateMeta] = useState({ name: '', type_id: '', level: 'basic' });

  // Site settings — default to Warm Sand (light oasis)
  const [siteSettings, setSiteSettings] = useState({
    site_name: 'Siwa Today', primary_color: '#FFB700',
    tagline: 'Experience the magic of the oasis.',
    show_logo_in_hero: false, carousel_autoplay: true, carousel_interval: 8000,
    logo_url: '', show_watermark: true, logo_height: 40,
    bg_color: '#FAF6F0', nav_bg_color: '#556B2F',
  });

  // Helper: detect which preset matches current settings (or 'custom')
  const detectPreset = () => {
    const s = siteSettings;
    const match = THEME_PRESETS.find(p => p.bg_color === s.bg_color && p.nav_bg_color === s.nav_bg_color && p.primary_color === s.primary_color);
    return match?.id || 'custom';
  };

  // Apply a theme preset
  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSiteSettings(s => ({ ...s, bg_color: preset.bg_color, nav_bg_color: preset.nav_bg_color, primary_color: preset.primary_color }));
    notify(`✅ Theme: ${preset.name}`);
  };

  // Drag-and-drop slot reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragSrcId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const srcId = dragSrcId.current;
    if (!srcId || srcId === targetId) return;
    setSlots(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(s => s.id === srcId);
      const toIdx   = arr.findIndex(s => s.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    dragSrcId.current = null;
  };
  const handleDragEnd = () => { dragSrcId.current = null; };

  const notify = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Ctrl+S to save
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  // Initial data fetch
  useEffect(() => {
    fetch('/api/jana/website/list').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const loadedPages = data.map(p => {
          const type_str = p.type || '';
          if (type_str.startsWith('website_search_')) {
            return { slug: type_str.replace('website_search_', ''), saved: true, type: 'search' as const };
          } else {
            return { slug: type_str.replace('website_', ''), saved: true, type: 'page' as const };
          }
        });
        setPages(loadedPages);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const pageParam = params.get('page');
          if (pageParam && loadedPages.some(p => p.slug === pageParam)) {
            setCurrentPage(pageParam);
          }
        }
      }
    }).catch(() => {});

    fetch('/api/jana/templates').then(r => r.json()).then(data => setTemplates(Array.isArray(data) ? data : [])).catch(() => {});

    fetch('/api/jana/component-library').then(r => r.json()).then(data => {
      setDynamic((Array.isArray(data) ? data : []).map(c => ({
        zone: 'body' as Zone, key: `dynamic_${c.id}`,
        name: `${c.name} (Data)`,
        icon: c.type === 'carousel' ? '🎠' : c.type === 'gallery' ? '🖼️' : '📰',
        manager: '/jana/component-library', color: '#ec4899', isDynamic: true,
        desc: c.description || 'Custom dynamic component',
      })));
    }).catch(() => {});

    fetch('/api/jana/search-engines').then(r => r.json()).then(d => setSearchEngines(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/jana/types').then(r => r.json()).then(d => setTypes(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/jana/tiers').then(r => r.json()).then(d => setTiers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Default layout seeded into the builder when no modules are saved yet
  const DEFAULT_MAIN_SLOTS: Slot[] = [
    { id: 'h1', key: 'hero_carousel',        zone: 'body', label: 'Hero Carousel',        props: { carousel_id: 'discovery' } },
    { id: 'h2', key: 'services_hub',          zone: 'body', label: 'Services Hub',          props: {} },
    { id: 'h3', key: 'experience_categories', zone: 'body', label: 'Experience Categories', props: {} },
    { id: 'h4', key: 'search_bar',            zone: 'body', label: 'Search Engine (Full)',  props: {} },
    { id: 'h5', key: 'smart_journey_planner', zone: 'body', label: 'Journey Planner',       props: {} },
    { id: 'h6', key: 'ecosystem_map',         zone: 'body', label: 'Interactive Map',       props: {} },
    { id: 'h7', key: 'local_products',        zone: 'body', label: 'Local Products',        props: {} },
    { id: 'h8', key: 'storytelling_section',  zone: 'body', label: 'Storytelling',          props: {} },
    { id: 'h9', key: 'partner_cta',           zone: 'body', label: 'Partner CTA',           props: {} },
  ];

  // Load layout when page/template changes
  useEffect(() => {
    if (mode === 'PAGES') {
      const currentPageData = pages.find(p => p.slug === currentPage);
      const pageType = currentPageData?.type || 'page';
      const pageId = pageType === 'search' ? `website_search_${currentPage}` : `website_${currentPage}`;
      
      fetch(`/api/jana/website?id=${pageId}`).then(r => r.json()).then(data => {
        const t = data[0];
        if (!t) {
          // No config in DB at all — show defaults for main, empty for others
          setSlots(currentPage === 'main' ? DEFAULT_MAIN_SLOTS : []);
          return;
        }
        if (t.site_settings) setSiteSettings(s => ({ ...s, ...t.site_settings }));

        const allLoaded = [
          ...(t.header_components || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'header' as Zone, label: c.name || c.type, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id, props: c.props })),
          ...(t.body_components   || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'body'   as Zone, label: c.name || c.type, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id, props: c.props })),
          ...(t.footer_components || []).map((c: any) => ({ id: c.id, key: c.type, zone: 'footer' as Zone, label: c.name || c.type, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id, props: c.props })),
        ];

        // Config exists in DB — always respect it, even if empty (admin cleared the page)
        setSlots(allLoaded);
      }).catch(() => setSlots([]));
    } else {
      const tmpl = templates.find(t => t.id === currentPage);
      if (!tmpl) return setSlots([]);
      setTemplateMeta({ name: tmpl.name || '', type_id: tmpl.type_id || '', level: tmpl.level || 'basic' });
      const comps = Array.isArray(tmpl.layout) ? tmpl.layout : [];
      setSlots(comps.map((c: any) => ({ id: c.id, key: c.type, zone: (c.zone || 'body') as Zone, label: c.name, engine_id: c.props?.engine_id, carousel_id: c.props?.carousel_id, props: c.props })));
    }
  }, [currentPage, mode, templates]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setCurrentPage(m === 'PAGES' ? (pages[0]?.slug || 'main') : (templates[0]?.id || ''));
  };

  // ── Slot helpers ────────────────────────────────────────────────────────────
  const FULL_PALETTE = [...PALETTE, ...dynamicComponents];
  const palettFor = (z: Zone) => FULL_PALETTE.filter(p => p.zone === z);
  const slotsFor  = (z: Zone) => slots.filter(s => s.zone === z);

  const isAdded = (item: typeof PALETTE[0]) => slots.some(s => s.key === item.key && s.zone === item.zone);
  const addSlot = (item: typeof PALETTE[0]) => {
    if (isAdded(item)) {
      // Allow re-adding with a unique ID for power users
      const count = slots.filter(s => s.key === item.key && s.zone === item.zone).length;
      setSlots(prev => [...prev, { id: `${item.key}_${Date.now()}`, key: item.key, zone: item.zone as Zone, label: `${item.name} #${count + 1}` }]);
      notify(`✅ ${item.name} #${count + 1} added`);
      return;
    }
    setSlots(prev => [...prev, { id: `${item.key}_${Date.now()}`, key: item.key, zone: item.zone as Zone, label: item.name }]);
    notify(`✅ ${item.name} added`);
  };
  const removeSlot = (id: string) => setSlots(prev => prev.filter(s => s.id !== id));
  const moveSlot = (id: string, dir: 'up'|'down') => {
    setSlots(prev => {
      const zone = prev.find(s => s.id === id)?.zone; if (!zone) return prev;
      const zSlots = prev.filter(s => s.zone === zone);
      const others = prev.filter(s => s.zone !== zone);
      const i = zSlots.findIndex(s => s.id === id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= zSlots.length) return prev;
      [zSlots[i], zSlots[j]] = [zSlots[j], zSlots[i]];
      return [...others, ...zSlots];
    });
  };
  const updateSlotProp = (id: string, field: string, value: string) => {
    setSlots(prev => prev.map(s => s.id !== id ? s : { ...s, [field]: value, props: { ...(s.props || {}), [field]: value } }));
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      const toComp = (s: Slot) => ({ id: s.id, type: s.key, name: s.label, zone: s.zone, props: { title: s.label, engine_id: s.engine_id, carousel_id: s.carousel_id, ...(s.props || {}) } });
      if (mode === 'PAGES') {
        const currentPageData = pages.find(p => p.slug === currentPage);
        const pageType = currentPageData?.type || 'page';
        const pageId = pageType === 'search' ? `website_search_${currentPage}` : `website_${currentPage}`;
        
        const res = await fetch('/api/jana/website', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: pageId,
            header_components: slotsFor('header').map(toComp),
            body_components:   slotsFor('body').map(toComp),
            footer_components: slotsFor('footer').map(toComp),
            site_settings: siteSettings,
          }),
        });
        if (!res.ok) throw new Error('Failed');
        setPages(prev => prev.map(p => p.slug === currentPage ? { ...p, saved: true } : p));
        if (!pages.find(p => p.slug === currentPage)) setPages(prev => [...prev, { slug: currentPage, saved: true, type: 'page' }]);
        notify(`🚀 ${currentPage.toUpperCase()} published!`);
      } else {
        if (!templateMeta.level) { notify('❌ Assign a Subscription Tier first!', 'error'); setSaving(false); return; }
        const res = await fetch('/api/jana/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentPage, name: templateMeta.name, type_id: templateMeta.type_id || null, level: templateMeta.level, layout: slots.map(toComp), features: {} }),
        });
        if (!res.ok) throw new Error('Failed');
        notify(`🛡️ Blueprint secured!`);
      }
    } catch { notify('❌ Save failed.', 'error'); }
    setSaving(false);
  };

  // ── Create page/template ─────────────────────────────────────────────────
  const createItem = async () => {
    if (mode === 'PAGES') {
      const slug = newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!slug) return;
      if (pages.find(p => p.slug === slug)) { notify('⚠️ Page already exists!', 'error'); return; }

      // ── Immediately write a blank record to DB so /p/{slug} never 404s ──
      try {
        await fetch('/api/jana/website', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `website_${slug}`,
            header_components: [],
            body_components: [],
            footer_components: [],
            site_settings: { ...siteSettings, page_slug: slug },
          }),
        });
      } catch { /* non-fatal – page still opens as draft */ }

      setPages(prev => [...prev, { slug, saved: false, type: 'page' }]);
      setCurrentPage(slug); setSlots([]);
      setShowNewModal(false); setNewPageName('');
      notify(`✨ "${slug}" created – add blocks then 🚀 Publish!`, 'info');
    } else {
      const slug = newPageName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (!slug) return;
      setTemplates(prev => [...prev, { id: slug, name: newPageName, type_id: '', level: 'basic', layout: [] }]);
      setCurrentPage(slug); setTemplateMeta({ name: newPageName, type_id: '', level: 'basic' }); setSlots([]);
      setShowNewModal(false); setNewPageName('');
      notify(`✨ Blueprint "${newPageName}" ready`, 'info');
    }
  };

  // ── Delete page ─────────────────────────────────────────────────────────
  const deletePage = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const pg = pages.find(p => p.slug === deleteTarget);
      if (pg?.saved) {
        const pageType = pg.type || 'page';
        const pageId = pageType === 'search' ? `website_search_${deleteTarget}` : `website_${deleteTarget}`;
        const res = await fetch(`/api/jana/website?id=${pageId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      }
      const remaining = pages.filter(p => p.slug !== deleteTarget);
      setPages(remaining);
      if (currentPage === deleteTarget) setCurrentPage(remaining[0]?.slug || 'main');
      notify(`🗑️ "${deleteTarget}" deleted`);
    } catch (e: any) { notify(`❌ ${e.message}`, 'error'); }
    setDeleting(false); setShowDeleteModal(false); setDeleteTarget('');
  };

  // ── Rename page ─────────────────────────────────────────────────────────
  const renamePage = async () => {
    const pg = pages.find(p => p.slug === renameTarget);
    if (!pg) return;
    const newSlug = renameValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!newSlug || newSlug === renameTarget) { setShowRenameModal(false); return; }
    if (pages.find(p => p.slug === newSlug)) { notify('⚠️ Name already taken!', 'error'); return; }
    if (pg.saved) {
      try {
        const pageType = pg.type || 'page';
        const oldPageId = pageType === 'search' ? `website_search_${renameTarget}` : `website_${renameTarget}`;
        const newPageId = pageType === 'search' ? `website_search_${newSlug}` : `website_${newSlug}`;
        
        const res = await fetch(`/api/jana/website?id=${oldPageId}`);
        const data = await res.json();
        const cfg = data[0];
        if (cfg) {
          await fetch('/api/jana/website', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cfg, id: newPageId }) });
          await fetch(`/api/jana/website?id=${oldPageId}`, { method: 'DELETE' });
        }
      } catch (e: any) { notify(`❌ Rename failed: ${e.message}`, 'error'); setShowRenameModal(false); return; }
    }
    setPages(prev => prev.map(p => p.slug === renameTarget ? { slug: newSlug, saved: pg?.saved || false, type: pg.type } : p));
    if (currentPage === renameTarget) setCurrentPage(newSlug);
    notify(`✅ Renamed to "${newSlug}"`);
    setShowRenameModal(false); setRenameTarget(''); setRenameValue('');
  };

  // ── Edit slot ───────────────────────────────────────────────────────────
  const openEditSlotModal = (slot: Slot) => {
    setEditingSlot(slot);
    setEditSlotProps({ label: slot.label, engine_id: slot.engine_id || '', carousel_id: slot.carousel_id || '', ...(slot.props || {}) });
    setShowEditSlotModal(true);
  };

  const saveEditSlot = () => {
    if (!editingSlot || !editSlotProps.label?.trim()) { notify('❌ Label cannot be empty', 'error'); return; }
    const { label, engine_id, carousel_id, ...restProps } = editSlotProps;
    setSlots(prev => prev.map(s => s.id === editingSlot.id ? { 
      ...s, 
      label, 
      engine_id: engine_id || undefined, 
      carousel_id: carousel_id || undefined, 
      props: restProps 
    } : s));
    notify(`✅ Slot updated: "${label}"`);
    setShowEditSlotModal(false);
    setEditingSlot(null);
    setEditSlotProps({});
  };

  // ── Derived state ────────────────────────────────────────────────────────
  const currentDraft = mode === 'PAGES' ? !pages.find(p => p.slug === currentPage)?.saved : false;
  const filteredPages = pages.filter(p => p.slug.toLowerCase().includes(pageSearch.toLowerCase()));
  const filteredTemplates = templates.filter((t: any) => (t.name || '').toLowerCase().includes(pageSearch.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', minWidth: '1200px', background: '#0a0f1e', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'auto', overflowY: 'hidden' }}>

      {/* ═══════════════════════ TOP BAR ══════════════════════════════════ */}
      <div style={{ background: 'linear-gradient(90deg,#020617,#0f172a)', color: '#fff', padding: '10px 1.5rem', minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', flexShrink: 0, zIndex: 100, gap: '1rem' }}>

        {/* Left: brand + mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#D4AF37,#F5E6AD)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#1a1a2e', fontSize: '0.9rem', boxShadow: '0 0 18px rgba(212,175,55,0.4)' }}>S</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '-0.2px' }}>
                {mode === 'TEMPLATES' ? 'MINISITE GOVERNANCE' : 'PORTAL ARCHITECT'}
              </div>
              <div style={{ fontSize: '0.55rem', opacity: 0.4, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {mode === 'TEMPLATES' ? 'Blueprint Engineering' : 'Portal Orchestration'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.07)', gap: '2px' }}>
            {([['PAGES','🌐 MAIN PORTAL','#D4AF37','#1a1a2e'],['TEMPLATES','🛡️ BLUEPRINTS','#10b981','#fff']] as const).map(([m,label,bg,fg]) => (
              <button key={m} onClick={() => switchMode(m as Mode)} style={{ padding: '0.35rem 1.1rem', border: 'none', borderRadius: '6px', background: mode === m ? bg : 'transparent', fontSize: '0.65rem', fontWeight: 900, color: mode === m ? fg : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: status + actions */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.35rem 0.85rem', borderRadius: '8px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: currentDraft ? '#f59e0b' : '#10b981', display: 'inline-block', boxShadow: `0 0 6px ${currentDraft ? '#f59e0b' : '#10b981'}` }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {mode === 'PAGES' ? currentPage : (templates.find((t:any)=>t.id===currentPage)?.name || '—')}
            </span>
            {currentDraft && <span style={{ fontSize: '0.5rem', background: '#f59e0b', color: '#1a1a2e', padding: '1px 5px', borderRadius: 4, fontWeight: 900 }}>DRAFT</span>}
          </div>

          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)' }} />

          {mode === 'PAGES' && (
            currentDraft ? (
              <div style={{ padding: '0.38rem 0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, cursor: 'not-allowed' }} title="Publish first to preview">
                👁 Preview (Unpublished)
              </div>
            ) : (
              <a href={currentPage === 'main' ? '/' : (pages.find(p => p.slug === currentPage)?.type === 'search' ? `/search/${currentPage}` : `/p/${currentPage}`)} target="_blank" rel="noopener noreferrer"
                style={{ padding: '0.38rem 0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                👁 Preview
              </a>
            )
          )}

          <button onClick={save} disabled={saving}
            style={{ padding: '0.42rem 1.4rem', background: mode==='TEMPLATES' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#D4AF37,#F59E0B)', border: 'none', borderRadius: 8, color: mode==='TEMPLATES' ? '#fff' : '#1a1a2e', fontWeight: 900, fontSize: '0.75rem', cursor: saving ? 'wait' : 'pointer', boxShadow: mode==='TEMPLATES' ? '0 0 18px rgba(16,185,129,0.25)' : '0 0 18px rgba(212,175,55,0.25)', transition: 'all 0.2s' }}>
            {saving ? '⏳ Saving…' : mode === 'TEMPLATES' ? '🔒 SECURE' : '🚀 PUBLISH'}
          </button>
          <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.2)', userSelect: 'none' }}>Ctrl+S</span>
        </div>
      </div>

      {/* ═══════════════════════ SETTINGS BAR ════════════════════════════ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0 1.5rem', height: 46, overflowX: 'auto', flexShrink: 0 }}>
        {mode === 'PAGES' ? (
          <>
            <div style={{ fontSize: '0.5rem', fontWeight: 900, color: '#cbd5e1', letterSpacing: '2px', whiteSpace: 'nowrap' }}>PAGE CONFIG</div>
            <Sep />
            <Field label="TITLE">
              <input value={siteSettings.site_name} onChange={e => setSiteSettings(s=>({...s,site_name:e.target.value}))} placeholder="Site Name" style={fieldStyle(140)} />
            </Field>
            <Field label="TAGLINE">
              <input value={siteSettings.tagline} onChange={e => setSiteSettings(s=>({...s,tagline:e.target.value}))} placeholder="Tagline" style={{...fieldStyle(220), flex:1}} />
            </Field>
            <Sep />
            <Field label="LOGO URL">
              <input value={siteSettings.logo_url||''} onChange={e => setSiteSettings(s=>({...s,logo_url:e.target.value}))} placeholder="https://…" style={fieldStyle(160)} />
              <label style={{ cursor:'pointer', background:'#f8fafc', padding:'3px 8px', borderRadius:'6px', fontSize:'0.58rem', fontWeight:800, border:'1px solid #e2e8f0', whiteSpace:'nowrap', color:'#64748b', marginRight:'4px' }}>
                ☁ Device
                <input type="file" hidden accept="image/*" onChange={async e=>{
                  const file=e.target.files?.[0]; if(!file) return;
                  notify('Uploading…','info');
                  try{
                    const fd=new FormData(); fd.append('file',file); fd.append('businessName','Platform'); fd.append('sectionName','branding');
                    const r=await fetch('/api/upload',{method:'POST',body:fd}); const d=await r.json();
                    if(d.url){setSiteSettings(s=>({...s,logo_url:d.url}));notify('✅ Logo updated');}
                  }catch{notify('❌ Upload failed','error');}
                }}/>
              </label>
              <label style={{ cursor:'pointer', background:'#f8fafc', padding:'3px 8px', borderRadius:'6px', fontSize:'0.58rem', fontWeight:800, border:'1px solid #e2e8f0', whiteSpace:'nowrap', color:'#64748b' }}>
                📷 Camera
                <input type="file" hidden accept="image/*" capture="environment" onChange={async e=>{
                  const file=e.target.files?.[0]; if(!file) return;
                  notify('Uploading…','info');
                  try{
                    const fd=new FormData(); fd.append('file',file); fd.append('businessName','Platform'); fd.append('sectionName','branding');
                    const r=await fetch('/api/upload',{method:'POST',body:fd}); const d=await r.json();
                    if(d.url){setSiteSettings(s=>({...s,logo_url:d.url}));notify('✅ Logo updated');}
                  }catch{notify('❌ Upload failed','error');}
                }}/>
              </label>
            </Field>
            <Field label="H(px)">
              <input type="number" value={siteSettings.logo_height||40} onChange={e => setSiteSettings(s=>({...s,logo_height:parseInt(e.target.value)||40}))} style={fieldStyle(58)} />
            </Field>
            <label style={{ display:'flex', alignItems:'center', gap:'0.35rem', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              <input type="checkbox" checked={siteSettings.show_watermark!==false} onChange={e=>setSiteSettings(s=>({...s,show_watermark:e.target.checked}))} />
              <span style={{ fontSize:'0.6rem', fontWeight:900, color:'#475569' }}>🏅 SIGNATURE</span>
            </label>
            <Sep />
            <Field label="🎨 THEME">
              <select
                value={detectPreset()}
                onChange={e => applyPreset(e.target.value)}
                style={{ ...selectStyle, background: '#fffbeb', border: '1.5px solid #D4AF37', fontWeight: 900, color: '#1a1a2e', minWidth: 200 }}
              >
                <option value="custom">✏️ Custom Palette</option>
                {THEME_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Sep />
            <Field label="PRIMARY">
              <input type="color" value={siteSettings.primary_color||'#FFB700'} onChange={e => setSiteSettings(s=>({...s,primary_color:e.target.value}))} style={{ width: 32, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
            </Field>
            <Field label="BG COLOR">
              <input type="color" value={siteSettings.bg_color||'#FAF6F0'} onChange={e => setSiteSettings(s=>({...s,bg_color:e.target.value}))} style={{ width: 32, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
            </Field>
            <Field label="NAV BG">
              <input type="color" value={siteSettings.nav_bg_color||'#556B2F'} onChange={e => setSiteSettings(s=>({...s,nav_bg_color:e.target.value}))} style={{ width: 32, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
            </Field>
          </>
        ) : (
          <>
            <div style={{ fontSize:'0.5rem', fontWeight:900, color:'#10b981', letterSpacing:'2px', whiteSpace:'nowrap' }}>TEMPLATE GOVERNANCE</div>
            <Sep />
            <Field label="NAME">
              <input value={templateMeta.name} onChange={e => setTemplateMeta(s=>({...s,name:e.target.value}))} placeholder="Template name" style={fieldStyle(180)} />
            </Field>
            <Field label="APPLIES TO">
              <select value={templateMeta.type_id||''} onChange={e=>setTemplateMeta(s=>({...s,type_id:e.target.value}))} style={selectStyle}>
                <option value="">🌐 UNIVERSAL</option>
                {types.map(t=><option key={t.id} value={t.id}>{t.name} Only</option>)}
              </select>
            </Field>
            <Field label="TIER">
              <select value={templateMeta.level||'basic'} onChange={e=>setTemplateMeta(s=>({...s,level:e.target.value}))} style={{...selectStyle, border:'2px solid #D4AF37', background:'#fffbeb', fontWeight:800}}>
                <option value="basic">Basic (Free)</option>
                {tiers.filter(t=>t.id!=='free').map(t=><option key={t.id} value={t.id}>{t.name} Tier</option>)}
              </select>
            </Field>
          </>
        )}
      </div>

      {/* ═══════════════════════ 3-COLUMN BODY ═══════════════════════════ */}
      <div className="builder-layout">

        {/* ─── COL 1 · Pages / Templates List ──────────────────────────── */}
        <div className="builder-col-1" style={{ background:'#0d1526', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Panel header */}
          <div style={{ padding:'0.85rem 0.85rem 0.7rem', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.65rem' }}>
              <div>
                <div style={{ fontSize:'0.58rem', fontWeight:900, color:mode==='TEMPLATES'?'#10b981':'#D4AF37', letterSpacing:'2px' }}>
                  {mode==='PAGES' ? '📄 PAGES' : '🛡️ BLUEPRINTS'}
                </div>
                <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.28)', marginTop:'2px' }}>
                  {mode==='PAGES'
                    ? `${pages.length} page${pages.length!==1?'s':''} · ${pages.filter(p=>p.saved).length} live`
                    : `${templates.length} template${templates.length!==1?'s':''}`}
                </div>
              </div>
              <button onClick={()=>setShowNewModal(true)}
                style={{ width:28, height:28, background:mode==='TEMPLATES'?'rgba(16,185,129,0.12)':'rgba(212,175,55,0.12)', border:`1px solid ${mode==='TEMPLATES'?'#10b981':'#D4AF37'}30`, borderRadius:'8px', color:mode==='TEMPLATES'?'#10b981':'#D4AF37', fontSize:'1rem', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                +
              </button>
            </div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:'0.55rem', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)', fontSize:'0.65rem', pointerEvents:'none' }}>🔍</span>
              <input value={pageSearch} onChange={e=>setPageSearch(e.target.value)} placeholder="Search…"
                style={{ width:'100%', padding:'0.38rem 0.5rem 0.38rem 1.75rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, color:'#fff', fontSize:'0.68rem', outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>

          {/* Items list */}
          <div style={{ flex:1, overflowY:'auto', padding:'0.4rem' }}>
            {mode === 'PAGES' ? (
              filteredPages.length === 0
                ? <div style={{ textAlign:'center', padding:'2.5rem 1rem', color:'rgba(255,255,255,0.18)', fontSize:'0.68rem' }}>No pages found</div>
                : filteredPages.map(page => {
                  const active = currentPage === page.slug;
                  return (
                    <div key={page.slug} onClick={()=>setCurrentPage(page.slug)}
                      style={{ padding:'0.55rem 0.65rem', borderRadius:10, marginBottom:'0.25rem', background:active?'rgba(212,175,55,0.1)':'rgba(255,255,255,0.02)', border:`1px solid ${active?'rgba(212,175,55,0.25)':'rgba(255,255,255,0.04)'}`, cursor:'pointer', transition:'all 0.18s', display:'flex', alignItems:'center', gap:'0.55rem' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:page.saved?'#10b981':'#f59e0b', flexShrink:0, boxShadow:`0 0 5px ${page.saved?'#10b98166':'#f59e0b66'}`, display:'inline-block' }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.72rem', color:active?'#D4AF37':'rgba(255,255,255,0.78)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {page.slug === 'main' ? '🏠 Home' : page.type === 'search' ? `🔍 ${page.slug}` : `📄 ${page.slug}`}
                        </div>
                        <div style={{ fontSize:'0.56rem', color:page.saved?'rgba(255,255,255,0.25)':'#f59e0b', fontWeight:600, marginTop:'1px' }}>
                          {page.saved ? (page.type === 'search' ? '● Search Page' : '● Live') : '○ Draft – not published'}
                        </div>
                      </div>
                      {/* Quick actions */}
                      <div style={{ display:'flex', gap:'3px', flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                        <a href={page.slug==='main'?'/':page.type==='search'?`/search/${page.slug}`:`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" title="Preview"
                          style={iconBtn('#fff')}>👁</a>
                        {page.slug !== 'main' && <>
                          <button title="Rename" onClick={()=>{setRenameTarget(page.slug);setRenameValue(page.slug);setShowRenameModal(true);}} style={iconBtn('#fff')}>✏️</button>
                          <button title="Delete" onClick={()=>{setDeleteTarget(page.slug);setShowDeleteModal(true);}} style={iconBtn('#ef4444','#ef444420','#ef444440')}>🗑</button>
                        </>}
                      </div>
                    </div>
                  );
                })
            ) : (
              filteredTemplates.length === 0
                ? <div style={{ textAlign:'center', padding:'2.5rem 1rem', color:'rgba(255,255,255,0.18)', fontSize:'0.68rem' }}>No blueprints found</div>
                : filteredTemplates.map((tmpl:any) => {
                  const active = currentPage === tmpl.id;
                  return (
                    <div key={tmpl.id} onClick={()=>setCurrentPage(tmpl.id)}
                      style={{ padding:'0.55rem 0.65rem', borderRadius:10, marginBottom:'0.25rem', background:active?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.02)', border:`1px solid ${active?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.04)'}`, cursor:'pointer', transition:'all 0.18s', display:'flex', alignItems:'center', gap:'0.55rem' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.72rem', color:active?'#10b981':'rgba(255,255,255,0.78)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          🛡️ {tmpl.name||'Unnamed'}
                        </div>
                        <div style={{ fontSize:'0.56rem', color:'rgba(255,255,255,0.25)', marginTop:'1px' }}>{tmpl.level||'basic'} tier</div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Stats footer */}
          {mode === 'PAGES' && (
            <div style={{ padding:'0.65rem 1rem', borderTop:'1px solid rgba(255,255,255,0.05)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem', flexShrink:0 }}>
              <Stat label="Live" value={pages.filter(p=>p.saved).length} color="#10b981" />
              <Stat label="Drafts" value={pages.filter(p=>!p.saved).length} color="#f59e0b" />
            </div>
          )}
        </div>

        {/* ─── COL 2 · Component Palette ───────────────────────────────── */}
        <div className="builder-col-2" style={{ background:'#fff', borderRight:'1px solid #f1f5f9', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'0.65rem', borderBottom:'1px solid #f1f5f9', display:'flex', gap:'4px', flexShrink:0 }}>
            {(['header','body','footer'] as Zone[]).map(z => (
              <button key={z} onClick={()=>setActiveZone(z)}
                style={{ flex:1, padding:'0.4rem', border:'none', borderRadius:6, background:activeZone===z?ZONE_COLORS[z]:'#f8fafc', color:activeZone===z?'#fff':'#64748b', fontSize:'0.6rem', fontWeight:800, cursor:'pointer', textTransform:'uppercase', transition:'all 0.2s' }}>
                {z}
              </button>
            ))}
          </div>
          <div style={{ padding:'0.65rem', overflowY:'auto', flex:1 }}>
            <div style={{ fontSize:'0.5rem', fontWeight:900, color:'#cbd5e1', letterSpacing:'1.5px', marginBottom:'0.65rem' }}>
              BLOCKS · {activeZone.toUpperCase()}
            </div>
            {palettFor(activeZone).map((item, pi) => {
              const added = isAdded(item);
              return (
                <button key={`${item.key}_${pi}`} onClick={()=>addSlot(item)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.55rem', padding:'0.6rem 0.65rem', border:`1px solid ${added ? item.color+'50' : item.color+'20'}`, borderRadius:10, background: added ? `${item.color}12` : `${item.color}05`, marginBottom:'0.4rem', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative' }}>
                  <span style={{ fontSize:'1.05rem', flexShrink:0, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', background:`${item.color}15`, borderRadius:7 }}>{item.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.68rem', color:'#0f172a', display:'flex', alignItems:'center', gap:'0.35rem' }}>
                      {item.name}
                      {added && <span style={{ fontSize:'0.5rem', background:`${item.color}20`, color:item.color, padding:'1px 5px', borderRadius:4, fontWeight:900 }}>ADDED</span>}
                    </div>
                    <div style={{ fontSize:'0.52rem', color:'#94a3b8', fontWeight:500, marginTop:'2px', lineHeight:1.3 }}>{(item as any).desc || ''}</div>
                    {item.manager && mode==='PAGES' && <div style={{ fontSize:'0.48rem', color:item.color, fontWeight:700, marginTop:'2px', letterSpacing:'0.3px' }}>⚙️ HAS CONTENT MANAGER</div>}
                  </div>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: added ? item.color : `${item.color}40`, flexShrink:0, boxShadow: added ? `0 0 6px ${item.color}60` : 'none', transition:'all 0.2s' }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── COL 3 · Canvas ──────────────────────────────────────────── */}
        <div className="builder-col-3" style={{ padding:'1.25rem 1.5rem', overflowY:'auto', background:'#f8fafc' }}>
          <div style={{ maxWidth:820, margin:'0 auto' }}>

            {/* Zone tabs + summary */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <div>
                <h2 style={{ margin:0, fontSize:'1rem', fontWeight:900, color:'#0f172a' }}>
                  {activeZone.charAt(0).toUpperCase()+activeZone.slice(1)} Zone
                </h2>
                <p style={{ margin:'3px 0 0', fontSize:'0.65rem', color:'#94a3b8' }}>
                  {slotsFor(activeZone).length} block{slotsFor(activeZone).length!==1?'s':''}
                  {mode==='PAGES' ? ` · editing ${currentPage}` : ` · template`}
                </p>
              </div>
              <div style={{ display:'flex', gap:'5px' }}>
                {(['header','body','footer'] as Zone[]).map(z => (
                  <button key={z} onClick={()=>setActiveZone(z)}
                    style={{ padding:'0.3rem 0.75rem', border:`1px solid ${activeZone===z?ZONE_COLORS[z]:'#e2e8f0'}`, borderRadius:6, background:activeZone===z?`${ZONE_COLORS[z]}12`:'#fff', color:activeZone===z?ZONE_COLORS[z]:'#94a3b8', fontSize:'0.58rem', fontWeight:800, cursor:'pointer', textTransform:'uppercase', transition:'all 0.18s' }}>
                    {z} ({slotsFor(z).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Empty state */}
            {slotsFor(activeZone).length === 0 ? (
              <div style={{ textAlign:'center', padding:'5rem 2rem', border:'2px dashed #e2e8f0', borderRadius:20, color:'#94a3b8', background:'#fff' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>＋</div>
                <div style={{ fontWeight:800, fontSize:'0.95rem' }}>No {activeZone} blocks added</div>
                <div style={{ fontSize:'0.68rem', marginTop:'0.4rem', opacity:0.7 }}>Pick a component from the palette →</div>
              </div>
            ) : (
              slotsFor(activeZone).map(slot => {
                const def   = FULL_PALETTE.find(p => p.key === slot.key);
                const color = def?.color || '#64748b';
                const zSlots = slotsFor(activeZone);
                const idx    = zSlots.findIndex(s => s.id === slot.id);
                return (
                  <div
                    key={slot.id}
                    draggable={dragEnabledSlotId === slot.id}
                    onDragStart={e => handleDragStart(e, slot.id)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, slot.id)}
                    onDragEnd={handleDragEnd}
                    style={{ background:'#fff', borderRadius:14, border:`1px solid ${color}20`, marginBottom:'0.9rem', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden' }}
                  >
                    {/* Block header */}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', padding:'0.6rem 0.9rem', background:`linear-gradient(90deg,${color}08,transparent)`, borderBottom:`1px solid ${color}12` }}>
                      {/* Drag handle */}
                      <div 
                        title="Drag to reorder" 
                        onMouseEnter={() => setDragEnabledSlotId(slot.id)}
                        onMouseLeave={() => setDragEnabledSlotId(null)}
                        style={{ color:'#cbd5e1', fontSize:'1rem', cursor:'grab', flexShrink:0, lineHeight:1, padding:'0 4px 0 0', userSelect:'none' }}
                      >
                        ⠿
                      </div>
                      <div style={{ width:30, height:30, borderRadius:8, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.95rem', flexShrink:0 }}>{def?.icon}</div>
                      <div style={{ flex:1, fontWeight:800, fontSize:'0.78rem', color:'#0f172a' }}>
                        {slot.label}
                        <span style={{ display:'block', fontSize:'0.52rem', color:'#cbd5e1', fontWeight:500, marginTop:'1px' }}>drag to reorder · zone: {slot.zone}</span>
                      </div>
                      <div className="block-actions" style={{ display:'flex', gap:'6px', flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                        <button onClick={e=>{e.stopPropagation();moveSlot(slot.id,'up');}} disabled={idx===0} style={actionBtn(idx===0, '#64748b', '#f8fafc', '#e2e8f0')} title="Move Up">↑ Up</button>
                        <button onClick={e=>{e.stopPropagation();moveSlot(slot.id,'down');}} disabled={idx===zSlots.length-1} style={actionBtn(idx===zSlots.length-1, '#64748b', '#f8fafc', '#e2e8f0')} title="Move Down">↓ Down</button>
                        <button onClick={e=>{e.stopPropagation();openEditSlotModal(slot);}} title="Edit Config" style={actionBtn(false, '#0ea5e9', '#f0f9ff', '#bfdbfe')}>✏️ Edit</button>
                        <button onClick={e=>{e.stopPropagation();removeSlot(slot.id);}} title="Remove Component" style={actionBtn(false, '#ef4444', '#fff0f0', '#fecaca')}>✕ Delete</button>
                      </div>
                    </div>

                    {/* Block body */}
                    <div style={{ padding:'0.85rem', display:'flex', flexDirection:'column', gap:'0.65rem' }}>
                      <div style={{ background:`${color}06`, borderRadius:8, border:`1px dashed ${color}25`, padding:'0.5rem 0.75rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                        <div style={{ fontSize:'1.2rem', flexShrink:0 }}>{def?.icon}</div>
                        <div>
                          <div style={{ fontSize:'0.6rem', color, fontWeight:800, letterSpacing:'0.5px' }}>
                            {mode==='TEMPLATES' ? 'VENDOR DATA AUTO-INJECTS' : `MODULE · ${slot.key.toUpperCase()}`}
                          </div>
                          <div style={{ fontSize:'0.55rem', color:'#94a3b8', fontWeight:500, marginTop:'2px' }}>{(def as any)?.desc || 'Renderable homepage module'}</div>
                        </div>
                      </div>

                      {/* Search engine picker */}
                      {slot.key === 'search_bar' && (
                        <ConfigBox label="LINKED SEARCH ENGINE">
                          <select value={slot.engine_id||''} onChange={e=>updateSlotProp(slot.id,'engine_id',e.target.value)} style={selectStyle}>
                            <option value="">Default (Global Search)</option>
                            {searchEngines.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                        </ConfigBox>
                      )}

                      {/* Carousel ID */}
                      {slot.key === 'hero_carousel' && (
                        <ConfigBox label="CAROUSEL CONTENT ID">
                          <input value={slot.props?.carousel_id||slot.carousel_id||''} onChange={e=>updateSlotProp(slot.id,'carousel_id',e.target.value.toLowerCase().replace(/\s+/g,'_'))} placeholder={mode==='TEMPLATES'?"Leave empty (uses Vendor photos)":"e.g. main_hero"} style={{...fieldStyle('100%'),width:'100%'}} />
                        </ConfigBox>
                      )}

                      {/* Featured vibe props */}
                      {slot.key === 'featured_vibe' && (
                        <ConfigBox label="VIBE STORY SETTINGS">
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                            {[['Category','vibe','e.g. Salt Lakes'],['Title','title','e.g. The Turquoise Miracles']].map(([l,f,ph])=>(
                              <div key={f}>
                                <div style={{ fontSize:'0.55rem', fontWeight:900, color:'#94a3b8', marginBottom:'3px' }}>{l}</div>
                                <input value={slot.props?.[f]||''} onChange={e=>{const n=[...slots];const i=n.findIndex(s=>s.id===slot.id);n[i].props={...(n[i].props||{}),[f]:e.target.value};setSlots(n);}} placeholder={ph} style={{...fieldStyle('100%'),width:'100%'}} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop:'0.5rem' }}>
                            <div style={{ fontSize:'0.55rem', fontWeight:900, color:'#94a3b8', marginBottom:'3px' }}>Description</div>
                            <textarea value={slot.props?.description||''} onChange={e=>{const n=[...slots];const i=n.findIndex(s=>s.id===slot.id);n[i].props={...(n[i].props||{}),description:e.target.value};setSlots(n);}} placeholder="Tell the story…" style={{ width:'100%', padding:'0.45rem 0.6rem', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:'0.7rem', fontWeight:600, minHeight:68, resize:'vertical', boxSizing:'border-box' }} />
                          </div>
                        </ConfigBox>
                      )}

                      {def?.manager && mode==='PAGES' && (
                        <Link href={`${def.manager}${slot.carousel_id?`?siteId=${slot.carousel_id}`:''}`}
                          style={{ alignSelf:'flex-start', padding:'0.38rem 0.85rem', background:color, color:'#fff', textDecoration:'none', borderRadius:7, fontSize:'0.6rem', fontWeight:800, display:'flex', alignItems:'center', gap:5 }}>
                          ⚙️ MANAGE CONTENT
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

      {/* ═══════════════════════ MODALS ══════════════════════════════════ */}

      {/* New Page/Blueprint */}
      {showNewModal && (
        <Modal onClose={()=>{setShowNewModal(false);setNewPageName('');}}>
          <ModalIcon>{mode==='PAGES'?'📄':'🛡️'}</ModalIcon>
          <h3 style={modalTitle}>Create New {mode==='PAGES'?'Page':'Blueprint'}</h3>
          <p style={modalSub}>{mode==='PAGES'?'The name becomes the URL slug (e.g. "About Us" → /about-us)':'Name your minisite blueprint'}</p>
          <input autoFocus value={newPageName} onChange={e=>setNewPageName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')createItem();if(e.key==='Escape'){setShowNewModal(false);setNewPageName('');}}}
            placeholder={mode==='PAGES'?"e.g. About Us":"e.g. Premium Desert Lodge"} style={modalInput} />
          {newPageName && (
            <div style={{ fontSize:'0.62rem', color:'#94a3b8', marginBottom:'1rem', padding:'0.35rem 0.75rem', background:'#f8fafc', borderRadius:6 }}>
              Slug: <strong style={{color:'#0f172a'}}>{newPageName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}</strong>
            </div>
          )}
          <div style={{ display:'flex', gap:'0.65rem' }}>
            <button onClick={()=>{setShowNewModal(false);setNewPageName('');}} style={modalCancelBtn}>Cancel</button>
            <button onClick={createItem} style={modalConfirmBtn(mode==='TEMPLATES'?'linear-gradient(135deg,#10b981,#059669)':'linear-gradient(135deg,#D4AF37,#F59E0B)', mode==='TEMPLATES'?'#fff':'#1a1a2e')}>
              Create {mode==='PAGES'?'Page':'Blueprint'}
            </button>
          </div>
        </Modal>
      )}

      {/* Rename Page */}
      {showRenameModal && (
        <Modal onClose={()=>setShowRenameModal(false)}>
          <ModalIcon>✏️</ModalIcon>
          <h3 style={modalTitle}>Rename Page</h3>
          <p style={modalSub}>Current: <code style={{background:'#f1f5f9',padding:'2px 6px',borderRadius:4,fontSize:'0.75rem'}}>{renameTarget}</code></p>
          <div style={{ marginBottom:'1rem', padding:'0.5rem 0.75rem', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, fontSize:'0.68rem', color:'#92400e' }}>
            ⚠️ If already published, the URL will change. Update any links referencing this page.
          </div>
          <input autoFocus value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')renamePage();if(e.key==='Escape')setShowRenameModal(false);}}
            placeholder="New page name" style={modalInput} />
          {renameValue && (
            <div style={{ fontSize:'0.62rem', color:'#94a3b8', marginBottom:'1rem', padding:'0.35rem 0.75rem', background:'#f8fafc', borderRadius:6 }}>
              New slug: <strong style={{color:'#0f172a'}}>{renameValue.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}</strong>
            </div>
          )}
          <div style={{ display:'flex', gap:'0.65rem' }}>
            <button onClick={()=>setShowRenameModal(false)} style={modalCancelBtn}>Cancel</button>
            <button onClick={renamePage} style={modalConfirmBtn('linear-gradient(135deg,#6366f1,#4f46e5)','#fff')}>✅ Rename</button>
          </div>
        </Modal>
      )}

      {/* Edit Slot */}
      {showEditSlotModal && editingSlot && (
        <Modal onClose={()=>{setShowEditSlotModal(false);setEditingSlot(null);}}>
          <ModalIcon>✏️</ModalIcon>
          <h3 style={modalTitle}>Edit Block Configuration</h3>
          <p style={modalSub}>Update the configuration for this component</p>
          
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <div>
              <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>DISPLAY LABEL</div>
              <input autoFocus value={editSlotProps.label || ''} onChange={e=>setEditSlotProps(p=>({...p, label: e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')saveEditSlot();if(e.key==='Escape'){setShowEditSlotModal(false);setEditingSlot(null);}}} placeholder="Block label" style={modalInput} />
            </div>

            {/* Custom prop editors based on component type */}
            {editingSlot.key === 'search_bar' && (
              <div>
                <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SEARCH ENGINE</div>
                <select value={editSlotProps.engine_id||''} onChange={e=>setEditSlotProps(p=>({...p, engine_id: e.target.value}))} style={{...modalInput, height: 'auto'}}>
                  <option value="">Default (Global Search)</option>
                  {searchEngines.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            )}

            {editingSlot.key === 'hero_carousel' && (
              <div>
                <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>CAROUSEL ID</div>
                <input value={editSlotProps.carousel_id||''} onChange={e=>setEditSlotProps(p=>({...p, carousel_id: e.target.value}))} placeholder="e.g. discovery" style={modalInput} />
              </div>
            )}

            {editingSlot.key === 'featured_vibe' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>VIBE CATEGORY (e.g. Salt Lakes)</div>
                  <input value={editSlotProps.vibe||''} onChange={e=>setEditSlotProps(p=>({...p, vibe: e.target.value}))} style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>TITLE (e.g. The Turquoise Miracles)</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>DESCRIPTION</div>
                  <textarea value={editSlotProps.description||''} onChange={e=>setEditSlotProps(p=>({...p, description: e.target.value}))} style={{...modalInput, minHeight: 80, resize: 'vertical'}} />
                </div>
              </>
            )}
            
            {editingSlot.key === 'smart_journey_planner' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>CUSTOM TITLE (Optional)</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Ready-Made Experiences" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>CUSTOM SUBTITLE (Optional)</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. CURATED JOURNEYS" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'blog' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SECTION TITLE</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Latest from Siwa" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Stories & Insights" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>MAX POSTS TO SHOW</div>
                  <input type="number" value={editSlotProps.maxPosts||''} onChange={e=>setEditSlotProps(p=>({...p, maxPosts: parseInt(e.target.value)||undefined}))} placeholder="e.g. 6" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'investment_feed' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SECTION TITLE</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Heritage Investment" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Invest in Siwa's future" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'services' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>HEADING TEXT</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Verified Businesses" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. The Gold Standard" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>BUTTON TEXT</div>
                  <input value={editSlotProps.buttonText||''} onChange={e=>setEditSlotProps(p=>({...p, buttonText: e.target.value}))} placeholder="e.g. EXPLORE THE COLLECTION" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>BUTTON LINK</div>
                  <input value={editSlotProps.buttonLink||''} onChange={e=>setEditSlotProps(p=>({...p, buttonLink: e.target.value}))} placeholder="e.g. /search/vibe" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'experience_categories' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SECTION TITLE</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Discover Experiences" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Curated adventures" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'ecosystem_map' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>MAP TITLE</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Siwa Ecosystem" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Explore the oasis" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'local_products' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SECTION TITLE</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Artisan Products" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Handcrafted with love" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'storytelling_section' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SECTION TITLE</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Siwa Stories" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Heritage & Culture" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'partner_cta' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>CTA HEADING</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Become a Partner" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>CTA SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Join the Siwa ecosystem" style={modalInput} />
                </div>
              </>
            )}

            {editingSlot.key === 'services_hub' && (
              <>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>HUB TITLE</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="e.g. Services Directory" style={modalInput} />
                </div>
                <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>SUBTITLE</div>
                  <input value={editSlotProps.subtitle||''} onChange={e=>setEditSlotProps(p=>({...p, subtitle: e.target.value}))} placeholder="e.g. Everything Siwa offers" style={modalInput} />
                </div>
              </>
            )}

            {/* Catch-all Title Override */}
            {!['search_bar', 'hero_carousel', 'featured_vibe', 'smart_journey_planner', 'blog', 'investment_feed', 'services', 'experience_categories', 'ecosystem_map', 'local_products', 'storytelling_section', 'partner_cta', 'services_hub'].includes(editingSlot.key) && (
               <div>
                  <div style={{ fontSize:'0.6rem', fontWeight:900, color:'#64748b', marginBottom:'4px' }}>OVERRIDE TITLE (Optional)</div>
                  <input value={editSlotProps.title||''} onChange={e=>setEditSlotProps(p=>({...p, title: e.target.value}))} placeholder="Custom section title" style={modalInput} />
                </div>
            )}
          </div>

          <div style={{ marginBottom:'1rem', padding:'0.5rem 0.75rem', background:'#f0f9ff', border:'1px solid #bfdbfe', borderRadius:8, fontSize:'0.68rem', color:'#0c4a6e' }}>
            ℹ️ Component Type: <strong>{editingSlot.key}</strong>
          </div>
          <div style={{ display:'flex', gap:'0.65rem' }}>
            <button onClick={()=>{setShowEditSlotModal(false);setEditingSlot(null);}} style={modalCancelBtn}>Cancel</button>
            <button onClick={saveEditSlot} style={modalConfirmBtn('linear-gradient(135deg,#0ea5e9,#0284c7)','#fff')}>✅ Save Config</button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <Modal onClose={()=>{setShowDeleteModal(false);setDeleteTarget('');}}>
          <div style={{ width:56, height:56, background:'#fef2f2', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', margin:'0 auto 1.25rem' }}>🗑️</div>
          <h3 style={{...modalTitle, textAlign:'center'}}>Delete Page?</h3>
          <p style={{...modalSub, textAlign:'center'}}>You are about to permanently delete: <strong style={{color:'#ef4444'}}>{deleteTarget}</strong></p>
          <div style={{ marginBottom:'1.5rem', padding:'0.6rem 0.75rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:'0.68rem', color:'#991b1b', textAlign:'center' }}>
            This cannot be undone. All components and settings will be lost.
          </div>
          <div style={{ display:'flex', gap:'0.65rem' }}>
            <button onClick={()=>{setShowDeleteModal(false);setDeleteTarget('');}} style={modalCancelBtn}>Cancel</button>
            <button onClick={deletePage} disabled={deleting} style={modalConfirmBtn('linear-gradient(135deg,#ef4444,#dc2626)','#fff')}>
              {deleting?'⏳ Deleting…':'🗑️ Delete Forever'}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'1.75rem', left:'50%', transform:'translateX(-50%)', background:toast.type==='error'?'#ef4444':toast.type==='info'?'#1e293b':'#0f172a', color:'#fff', padding:'0.8rem 1.75rem', borderRadius:14, fontWeight:800, fontSize:'0.8rem', zIndex:9999, boxShadow:'0 20px 40px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', gap:'0.65rem', borderLeft:`3px solid ${toast.type==='error'?'#fca5a5':toast.type==='info'?'#D4AF37':'#10b981'}`, animation:'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)', whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp { from{transform:translate(-50%,100%);opacity:0} to{transform:translate(-50%,0);opacity:1} }
        @keyframes fadeIn  { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        *{box-sizing:border-box} body{margin:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:99px}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#6366f1!important}
        
        .builder-layout {
          display: grid;
          grid-template-columns: 240px 270px 1fr;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }
      `}</style>
    </div>
  );
}

// ── Tiny helper components ────────────────────────────────────────────────────
function Sep() { return <div style={{ width:1, height:24, background:'#f1f5f9', flexShrink:0 }} />; }
function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0 }}>
      <span style={{ fontSize:'0.56rem', fontWeight:900, color:'#94a3b8', whiteSpace:'nowrap' }}>{label}:</span>
      {children}
    </div>
  );
}
function Stat({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', padding:'0.3rem 0.5rem', borderRadius:6 }}>
      <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.3)' }}>{label}</span>
      <span style={{ fontSize:'0.7rem', fontWeight:900, color }}>{value}</span>
    </div>
  );
}
function ConfigBox({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ padding:'0.65rem', background:'#f8fafc', borderRadius:8, border:'1px solid #f1f5f9' }}>
      <div style={{ fontSize:'0.55rem', fontWeight:900, color:'#94a3b8', marginBottom:'0.4rem', letterSpacing:'1px' }}>{label}</div>
      {children}
    </div>
  );
}
function Modal({ children, onClose }: { children:React.ReactNode; onClose:()=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,15,30,0.85)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', padding:'2.25rem', borderRadius:24, width:430, boxShadow:'0 30px 70px rgba(0,0,0,0.5)', animation:'fadeIn 0.25s ease' }}>
        {children}
      </div>
    </div>
  );
}
function ModalIcon({ children }: { children:React.ReactNode }) {
  return <div style={{ fontSize:'1.6rem', marginBottom:'1rem' }}>{children}</div>;
}

// Styles
const fieldStyle = (w: number|string): React.CSSProperties => ({
  padding:'0.32rem 0.6rem', border:'1.5px solid #e2e8f0', borderRadius:6, fontSize:'0.68rem', fontWeight:700, width:typeof w==='number'?w:w, transition:'border-color 0.2s',
});
const selectStyle: React.CSSProperties = {
  padding:'0.32rem 0.5rem', borderRadius:6, border:'1.5px solid #e2e8f0', fontSize:'0.68rem', fontWeight:700, background:'#fff', cursor:'pointer',
};
const iconBtn = (color:string, bg='rgba(255,255,255,0.07)', border='rgba(255,255,255,0.1)'): React.CSSProperties => ({
  width:22, height:22, borderRadius:5, background:bg, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', cursor:'pointer', textDecoration:'none', color, flexShrink:0,
});
const actionBtn = (disabled:boolean, color:string, bg:string, border:string): React.CSSProperties => ({
  padding: '0.3rem 0.6rem', background: bg, border: `1px solid ${border}`, borderRadius: 6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, fontWeight: 800, fontSize: '0.65rem', color, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', transition: 'all 0.2s'
});
const modalTitle: React.CSSProperties = { margin:'0 0 0.25rem', fontWeight:900, fontSize:'1.15rem', color:'#0f172a' };
const modalSub:   React.CSSProperties = { margin:'0 0 1.25rem', fontSize:'0.75rem', color:'#64748b', lineHeight:1.5 };
const modalInput: React.CSSProperties = { width:'100%', padding:'0.85rem 1rem', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:'0.9rem', marginBottom:'0.65rem', boxSizing:'border-box' };
const modalCancelBtn: React.CSSProperties = { flex:1, padding:'0.8rem', border:'1.5px solid #e2e8f0', borderRadius:12, fontWeight:800, cursor:'pointer', color:'#64748b', background:'#fff', fontSize:'0.78rem' };
const modalConfirmBtn = (bg:string, color:string): React.CSSProperties => ({ flex:2, padding:'0.8rem', background:bg, border:'none', borderRadius:12, color, fontWeight:900, cursor:'pointer', fontSize:'0.82rem' });
