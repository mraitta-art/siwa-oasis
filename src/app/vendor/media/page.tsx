'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
  section_id?: string;
  section_name?: string;
  isHero?: boolean;
  is_hero?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  resource_type?: 'image' | 'video' | 'raw';
}

interface Section {
  id: string;
  name: string;
}

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  resourceType: 'image' | 'video';
  result?: { url: string };
  errorMsg?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CSS = `
  :root {
    --gold: #D4AF37;
    --gold-l: #f0c842;
    --gold-bg: rgba(212,175,55,0.08);
    --dark: #0f172a;
    --mid: #1e293b;
    --muted: #64748b;
    --border: #e2e8f0;
    --radius: 18px;
  }

  /* Reset */
  .vm-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .vm-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: var(--dark); min-height: 100vh;
  }

  /* ── Header ── */
  .vm-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;
  }
  .vm-title { font-size: clamp(1.2rem, 4vw, 1.6rem); font-weight: 900; color: var(--dark); }
  .vm-subtitle { font-size: 0.78rem; color: var(--muted); margin-top: 3px; }

  /* ── Tab bar ── */
  .vm-tabs {
    display: flex; gap: 6px; background: #f1f5f9; padding: 5px; border-radius: 14px;
    margin-bottom: 1.5rem; overflow-x: auto; flex-shrink: 0;
    scrollbar-width: none;
  }
  .vm-tabs::-webkit-scrollbar { display: none; }
  .vm-tab {
    padding: 0.5rem 1.1rem; border-radius: 10px; border: none; cursor: pointer;
    font-size: 0.78rem; font-weight: 800; white-space: nowrap;
    transition: all 0.2s; background: transparent; color: var(--muted);
    display: flex; align-items: center; gap: 6px;
  }
  .vm-tab.active { background: var(--dark); color: #fff; }
  .vm-tab:hover:not(.active) { background: #e2e8f0; color: var(--dark); }

  /* ── Upload zone ── */
  .vm-upload-card {
    background: #fff; border: 1px solid var(--border); border-radius: var(--radius);
    padding: clamp(1rem, 4vw, 1.75rem);
  }
  .vm-field-label {
    font-size: 0.75rem; font-weight: 800; color: var(--dark); margin-bottom: 4px;
  }
  .vm-field-hint { font-size: 0.68rem; color: var(--muted); margin-bottom: 8px; }
  .vm-select {
    width: 100%; padding: 0.7rem 1rem; border-radius: 12px;
    border: 1.5px solid var(--gold); font-size: 0.85rem; font-weight: 800;
    color: var(--dark); background: #fffdf5; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D4AF37' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
    padding-right: 2.5rem;
  }

  /* Camera / capture buttons grid */
  .vm-capture-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem; margin: 1.25rem 0;
  }
  .vm-capture-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 1.25rem 0.75rem; border-radius: 16px; border: none;
    cursor: pointer; font-size: 0.75rem; font-weight: 800; transition: all 0.2s;
    position: relative; overflow: hidden;
  }
  .vm-capture-btn .icon { font-size: 1.6rem; }
  .vm-capture-btn.cam  { background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; }
  .vm-capture-btn.vid  { background: #fdf4ff; color: #7e22ce; border: 1.5px solid #e9d5ff; }
  .vm-capture-btn.file { background: #f0fdf4; color: #15803d; border: 1.5px solid #bbf7d0; }
  .vm-capture-btn.drag { background: var(--gold-bg); color: #92400e; border: 1.5px dashed rgba(212,175,55,0.5); }
  .vm-capture-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
  .vm-capture-btn input {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
  }

  /* Drag & drop overlay */
  .vm-drop-overlay {
    border: 2px dashed var(--gold); background: var(--gold-bg); border-radius: var(--radius);
    padding: 2rem; text-align: center; transition: all 0.2s;
    margin: 1rem 0;
  }
  .vm-drop-overlay.dragging { background: rgba(212,175,55,0.15); border-color: var(--gold-l); }

  /* Upload queue */
  .vm-queue { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .vm-queue-item {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
    background: #f8fafc; border-radius: 12px; border: 1px solid var(--border);
  }
  .vm-queue-thumb {
    width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
    background: var(--mid);
  }
  .vm-queue-info { flex: 1; min-width: 0; }
  .vm-queue-name {
    font-size: 0.75rem; font-weight: 700; color: var(--dark);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vm-progress-bar {
    height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 6px; overflow: hidden;
  }
  .vm-progress-fill { height: 100%; background: var(--gold); transition: width 0.3s; border-radius: 2px; }
  .vm-queue-status { font-size: 0.62rem; font-weight: 800; margin-top: 4px; }
  .vm-queue-status.done  { color: #16a34a; }
  .vm-queue-status.error { color: #dc2626; }
  .vm-queue-status.uploading { color: var(--gold); }

  /* ── Gallery grid ── */
  .vm-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  @media (min-width: 480px)  { .vm-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
  @media (min-width: 640px)  { .vm-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1024px) { .vm-grid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; } }
  @media (min-width: 1280px) { .vm-grid { grid-template-columns: repeat(5, 1fr); } }

  .vm-img-card {
    position: relative; border-radius: 16px; overflow: hidden; background: var(--dark);
    border: 1px solid #e2e8f0; aspect-ratio: 4/3;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .vm-img-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.14); }
  .vm-img-card img, .vm-img-card video {
    width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s;
    display: block;
  }
  .vm-img-card:hover img { transform: scale(1.06); }
  .vm-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%);
    opacity: 0; transition: opacity 0.2s;
    display: flex; flex-direction: column; justify-content: space-between; padding: 0.75rem;
  }
  .vm-img-card:hover .vm-img-overlay { opacity: 1; }

  /* Mobile: always show overlay on touch */
  @media (hover: none) {
    .vm-img-overlay { opacity: 1; background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%); }
  }

  .vm-badge {
    position: absolute; z-index: 2; font-size: 0.55rem; font-weight: 900;
    padding: 2px 7px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.4px;
  }
  .vm-badge.hero   { top: 8px; left: 8px; background: linear-gradient(135deg, #D4AF37, #f0c842); color: #2a1a00; }
  .vm-badge.status { top: 8px; right: 8px; }
  .vm-badge.approved { background: rgba(34,197,94,0.92); color: #fff; }
  .vm-badge.pending  { background: rgba(245,158,11,0.92); color: #fff; }
  .vm-badge.rejected { background: rgba(239,68,68,0.92); color: #fff; }
  .vm-badge.section  { bottom: 8px; left: 8px; background: rgba(15,23,42,0.88); color: #fff; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; backdrop-filter: blur(4px); }
  .vm-badge.video-tag { bottom: 8px; right: 8px; background: rgba(126,34,206,0.88); color: #fff; backdrop-filter: blur(4px); }

  .vm-play-btn {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    z-index: 2; pointer-events: none;
  }
  .vm-play-icon {
    width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.92);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3); font-size: 1.1rem; color: var(--dark);
    opacity: 0.9;
  }

  /* Caption edit inline */
  .vm-caption-input {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px;
    color: #fff; font-size: 0.68rem; font-weight: 600; padding: 3px 7px;
    width: 100%; outline: none;
  }
  .vm-caption-input::placeholder { color: rgba(255,255,255,0.5); }

  /* Action buttons in overlay */
  .vm-actions { display: flex; gap: 5px; justify-content: flex-end; }
  .vm-action-btn {
    padding: 5px 10px; border-radius: 8px; border: none; cursor: pointer;
    font-size: 0.65rem; font-weight: 800; display: inline-flex; align-items: center;
    gap: 3px; transition: all 0.15s;
  }
  .vm-action-btn.gold  { background: var(--gold); color: #1a1000; }
  .vm-action-btn.gold:hover  { background: var(--gold-l); }
  .vm-action-btn.danger { background: rgba(239,68,68,0.9); color: #fff; }
  .vm-action-btn.danger:hover { background: #dc2626; }

  /* ── Filter bar ── */
  .vm-filter-bar {
    display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  .vm-filter-chip {
    padding: 0.4rem 0.9rem; border-radius: 20px; border: 1.5px solid var(--border);
    font-size: 0.72rem; font-weight: 700; cursor: pointer; background: #fff; color: var(--muted);
    transition: all 0.15s; white-space: nowrap;
  }
  .vm-filter-chip.active { border-color: var(--gold); background: var(--gold-bg); color: #92400e; }

  /* ── Video lightbox ── */
  .vm-lightbox {
    position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  }
  .vm-lightbox-inner {
    position: relative; max-width: 900px; width: 100%; max-height: 90vh;
    border-radius: var(--radius); overflow: hidden;
  }
  .vm-lightbox-close {
    position: absolute; top: 12px; right: 12px; z-index: 10;
    background: rgba(0,0,0,0.7); border: none; color: #fff; width: 36px; height: 36px;
    border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex;
    align-items: center; justify-content: center;
  }

  /* ── Floating Action Button (mobile) ── */
  .vm-fab {
    display: none; position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 100;
    width: 58px; height: 58px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--gold-l));
    border: none; cursor: pointer; box-shadow: 0 6px 24px rgba(212,175,55,0.5);
    color: #1a1000; font-size: 1.5rem; align-items: center; justify-content: center;
    transition: transform 0.2s; -webkit-tap-highlight-color: transparent;
  }
  @media (max-width: 640px) { .vm-fab { display: flex; } }
  .vm-fab:hover { transform: scale(1.1); }

  /* ── Toast ── */
  .vm-toast {
    margin-bottom: 1rem; padding: 0.75rem 1.25rem; border-radius: 14px;
    font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;
  }
  .vm-toast.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .vm-toast.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

  /* ── Empty state ── */
  .vm-empty { text-align: center; padding: 4rem 2rem; }
  .vm-empty-icon {
    width: 64px; height: 64px; border-radius: 50%; background: #fdf8ee;
    border: 1px solid #fde68a; display: inline-flex; align-items: center; justify-content: center;
    color: var(--gold); font-size: 1.5rem; margin-bottom: 1rem;
  }
  .vm-empty h3 { font-size: 1rem; font-weight: 900; color: var(--dark); margin-bottom: 8px; }
  .vm-empty p { font-size: 0.78rem; color: var(--muted); max-width: 320px; margin: 0 auto 1.25rem; }

  /* ── Info tip ── */
  .vm-tip {
    background: #fdf8ee; border: 1px solid #fde68a; border-radius: 14px;
    padding: 0.9rem 1.1rem; margin-bottom: 1.25rem;
    display: flex; align-items: flex-start; gap: 0.7rem;
    font-size: 0.76rem; color: #78350f; line-height: 1.55; font-weight: 500;
  }

  /* Responsive utility */
  .vm-header-actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
  @media (max-width: 480px) {
    .vm-header { flex-direction: column; align-items: flex-start; }
    .vm-upload-card { padding: 1rem; }
    .vm-capture-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function VendorMediaPage() {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'upload'>('photos');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<Record<string, string>>({});

  const fileRef     = useRef<HTMLInputElement>(null);
  const cameraRef   = useRef<HTMLInputElement>(null);
  const videoRef    = useRef<HTMLInputElement>(null);
  const dropRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSections();
    loadGallery();
    loadVendorSlug();
  }, []);

  async function loadVendorSlug() {
    try {
      const r = await fetch('/api/vendor/story');
      const d = await r.json();
      if (d?.business) setSlug(d.business.slug || d.business.id || '');
    } catch (_) {}
  }

  async function loadSections() {
    try {
      const r = await fetch('/api/vendor/sections');
      const d = await r.json();
      const arr = Array.isArray(d) ? d : [];
      setSections(arr);
      if (arr.length > 0) setSelectedSection(arr[0].id);
    } catch (_) {}
  }

  async function loadGallery() {
    try {
      const r = await fetch('/api/vendor/gallery');
      const d = await r.json();
      setGallery(Array.isArray(d) ? d : []);
    } catch (_) {}
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!selectedSection) { toast('error', 'Please select a content section first'); return; }

    const newItems: UploadFile[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
      resourceType: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    setActiveTab('upload');

    // Upload each file sequentially
    for (let i = 0; i < newItems.length; i++) {
      const idx = uploadQueue.length + i; // position in the queue array (after setState)
      setUploadQueue(prev => {
        const updated = [...prev];
        if (updated[idx]) updated[idx] = { ...updated[idx], status: 'uploading' };
        return updated;
      });

      try {
        const formData = new FormData();
        formData.append('file', newItems[i].file);
        formData.append('sectionId', selectedSection);
        formData.append('caption', newItems[i].file.name.replace(/\.[^/.]+$/, ''));

        const r = await fetch('/api/vendor/gallery/upload', { method: 'POST', body: formData });
        const data = await r.json();

        setUploadQueue(prev => {
          const updated = [...prev];
          if (updated[idx]) {
            updated[idx] = {
              ...updated[idx],
              status: r.ok ? 'done' : 'error',
              progress: 100,
              result: data,
              errorMsg: !r.ok ? (data?.error || 'Upload failed') : undefined,
            };
          }
          return updated;
        });
      } catch {
        setUploadQueue(prev => {
          const updated = [...prev];
          if (updated[idx]) updated[idx] = { ...updated[idx], status: 'error' };
          return updated;
        });
      }
    }

    toast('success', `✓ ${files.length} file${files.length > 1 ? 's' : ''} processed — check gallery!`);
    await loadGallery();
  }, [selectedSection, uploadQueue.length]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function setAsHero(id: string) {
    try {
      await fetch(`/api/vendor/gallery/${id}/hero`, { method: 'PATCH' });
      toast('success', '⭐ Set as main cover');
      await loadGallery();
    } catch { toast('error', 'Failed to update cover'); }
  }

  async function saveCaption(id: string) {
    const cap = editingCaption[id];
    if (cap == null) return;
    try {
      await fetch(`/api/vendor/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: cap }),
      });
      setEditingCaption(prev => { const n = { ...prev }; delete n[id]; return n; });
      await loadGallery();
    } catch { toast('error', 'Failed to save caption'); }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This will also remove it from cloud storage.')) return;
    try {
      await fetch(`/api/vendor/gallery/${id}`, { method: 'DELETE' });
      toast('success', '✓ Deleted');
      setGallery(prev => prev.filter(g => g.id !== id));
    } catch { toast('error', 'Failed to delete'); }
  }

  function toast(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const photos = gallery.filter(g => !g.resource_type || g.resource_type === 'image' || g.resource_type === 'raw');
  const videos = gallery.filter(g => g.resource_type === 'video');

  const filteredPhotos = filterSection === 'all' ? photos : photos.filter(g => g.section_id === filterSection);
  const filteredVideos = filterSection === 'all' ? videos : videos.filter(g => g.section_id === filterSection);

  // ── Render ────────────────────────────────────────────────────────────────────

  function renderMediaCard(item: GalleryItem) {
    const isVideo = item.resource_type === 'video';
    const statusClass = item.approval_status === 'approved' ? 'approved' : item.approval_status === 'rejected' ? 'rejected' : 'pending';
    const caption = editingCaption[item.id] ?? item.caption ?? '';

    return (
      <div key={item.id} className="vm-img-card">
        {/* Badges */}
        {(item.isHero || item.is_hero) && <span className="vm-badge hero">⭐ Cover</span>}
        <span className={`vm-badge status ${statusClass}`}>
          {item.approval_status === 'approved' ? 'Active' : item.approval_status === 'rejected' ? 'Rejected' : 'Pending'}
        </span>
        {item.section_name && <span className="vm-badge section">📍 {item.section_name}</span>}
        {isVideo && <span className="vm-badge video-tag">▶ Video</span>}

        {/* Media */}
        {isVideo ? (
          <>
            <video
              src={item.url}
              preload="metadata"
              muted
              playsInline
              style={{ cursor: 'pointer' }}
              onClick={() => setLightboxUrl(item.url)}
            />
            <div className="vm-play-btn" onClick={() => setLightboxUrl(item.url)} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              <div className="vm-play-icon">▶</div>
            </div>
          </>
        ) : (
          <img src={item.url} alt={item.caption || 'Gallery image'} loading="lazy" />
        )}

        {/* Hover overlay */}
        <div className="vm-img-overlay">
          <input
            className="vm-caption-input"
            value={caption}
            placeholder="Add caption..."
            onChange={e => setEditingCaption(prev => ({ ...prev, [item.id]: e.target.value }))}
            onBlur={() => saveCaption(item.id)}
            onKeyDown={e => e.key === 'Enter' && saveCaption(item.id)}
          />
          <div className="vm-actions">
            {!(item.isHero || item.is_hero) && (
              <button className="vm-action-btn gold" onClick={() => setAsHero(item.id)}>⭐ Cover</button>
            )}
            <button className="vm-action-btn danger" onClick={() => deleteItem(item.id)}>
              🗑
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderFilterChips() {
    return (
      <div className="vm-filter-bar">
        <button className={`vm-filter-chip${filterSection === 'all' ? ' active' : ''}`} onClick={() => setFilterSection('all')}>
          All ({activeTab === 'photos' ? photos.length : videos.length})
        </button>
        {sections.map(s => {
          const count = (activeTab === 'photos' ? photos : videos).filter(g => g.section_id === s.id).length;
          if (count === 0) return null;
          return (
            <button
              key={s.id}
              className={`vm-filter-chip${filterSection === s.id ? ' active' : ''}`}
              onClick={() => setFilterSection(s.id)}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>
    );
  }

  function renderEmptyState(type: 'photo' | 'video') {
    return (
      <div className="vm-empty">
        <div className="vm-empty-icon">{type === 'photo' ? '📷' : '🎬'}</div>
        <h3>No {type === 'photo' ? 'photos' : 'videos'} yet</h3>
        <p>Upload high-quality {type === 'photo' ? 'images' : 'videos'} to bring your minisite to life.</p>
        <button
          onClick={() => setActiveTab('upload')}
          style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
        >
          Upload Now →
        </button>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hidden file inputs */}
      <input ref={fileRef}   type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />
      <input ref={videoRef}  type="file" accept="video/*" capture="environment" style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />

      {/* Video lightbox */}
      {lightboxUrl && (
        <div className="vm-lightbox" onClick={() => setLightboxUrl(null)}>
          <div className="vm-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="vm-lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
            <video src={lightboxUrl} controls autoPlay playsInline style={{ width: '100%', maxHeight: '90vh', background: '#000' }} />
          </div>
        </div>
      )}

      <div className="vm-root">

        {/* ── Header ── */}
        <div className="vm-header">
          <div>
            <h1 className="vm-title">📸 Media Management</h1>
            <p className="vm-subtitle">Upload photos & videos to your minisite sections • Auto-saved to Cloudinary</p>
          </div>
          <div className="vm-header-actions">
            {slug && (
              <Link
                href={`/${slug}`}
                target="_blank"
                style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold)', background: '#fdf8ee', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #fde68a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                🔗 View Minisite
              </Link>
            )}
            <button
              onClick={() => setActiveTab('upload')}
              style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c842)', color: '#1a1000', border: 'none', padding: '0.5rem 1.15rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              ＋ Upload
            </button>
          </div>
        </div>

        {/* ── Toast ── */}
        {message && <div className={`vm-toast ${message.type}`}>{message.text}</div>}

        {/* ── Tabs ── */}
        <div className="vm-tabs">
          <button className={`vm-tab${activeTab === 'photos' ? ' active' : ''}`} onClick={() => setActiveTab('photos')}>
            📸 Photos ({photos.length})
          </button>
          <button className={`vm-tab${activeTab === 'videos' ? ' active' : ''}`} onClick={() => setActiveTab('videos')}>
            🎬 Videos ({videos.length})
          </button>
          <button className={`vm-tab${activeTab === 'upload' ? ' active' : ''}`} onClick={() => setActiveTab('upload')}>
            ⬆ Upload {uploadQueue.length > 0 ? `(${uploadQueue.filter(u => u.status === 'uploading').length} uploading)` : ''}
          </button>
        </div>

        {/* ── Tab: Upload ── */}
        {activeTab === 'upload' && (
          <div className="vm-upload-card">

            {/* Section selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="vm-field-label">1. Select Content Section</label>
              <p className="vm-field-hint">Photos & videos will appear in this section's tab on your minisite.</p>
              <select
                className="vm-select"
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
              >
                {sections.length === 0 && <option>Loading sections…</option>}
                {sections.map(s => <option key={s.id} value={s.id}>📍 {s.name}</option>)}
              </select>
            </div>

            {/* Capture method buttons */}
            <label className="vm-field-label">2. Choose Upload Method</label>
            <div className="vm-capture-grid">
              <button className="vm-capture-btn cam" onClick={() => cameraRef.current?.click()}>
                <span className="icon">📷</span>
                <span>Take Photo</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>Mobile Camera</span>
              </button>
              <button className="vm-capture-btn vid" onClick={() => videoRef.current?.click()}>
                <span className="icon">🎬</span>
                <span>Record Video</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>Mobile Camera</span>
              </button>
              <button className="vm-capture-btn file" onClick={() => fileRef.current?.click()}>
                <span className="icon">🖼</span>
                <span>From Gallery</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>Any file type</span>
              </button>
              <div
                className={`vm-capture-btn drag${dragOver ? ' active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
              >
                <span className="icon">📦</span>
                <span>Drag & Drop</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>Drop files here</span>
              </div>
            </div>

            {/* Tip */}
            <div className="vm-tip">
              <span>☁</span>
              <span>
                Files are automatically uploaded to <strong>Cloudinary</strong> and available on both local and production.
                Limits: <strong>images 10MB</strong>, <strong>videos 50MB</strong> (upgrade plan to increase).
                All uploads require <strong>admin approval</strong> before appearing live on your minisite.
              </span>
            </div>

            {/* Upload queue */}
            {uploadQueue.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="vm-field-label">Upload Queue ({uploadQueue.length})</label>
                  <button
                    onClick={() => setUploadQueue([])}
                    style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear ✕
                  </button>
                </div>
                <div className="vm-queue">
                  {uploadQueue.map((item, i) => (
                    <div key={i} className="vm-queue-item">
                      {item.resourceType === 'video'
                        ? <div className="vm-queue-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎬</div>
                        : <img className="vm-queue-thumb" src={item.preview} alt="" />
                      }
                      <div className="vm-queue-info">
                        <div className="vm-queue-name">{item.file.name}</div>
                        <div className="vm-progress-bar">
                          <div className="vm-progress-fill" style={{ width: item.status === 'done' ? '100%' : item.status === 'uploading' ? '70%' : '0%' }} />
                        </div>
                        <div className={`vm-queue-status ${item.status}`}>
                          {item.status === 'done' ? '✓ Uploaded to Cloudinary'
                            : item.status === 'error' ? `✗ ${item.errorMsg || 'Upload failed'}`
                              : item.status === 'uploading' ? '↑ Uploading…'
                                : '⏳ Queued'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Photos ── */}
        {activeTab === 'photos' && (
          <div>
            {renderFilterChips()}
            {filteredPhotos.length === 0
              ? renderEmptyState('photo')
              : <div className="vm-grid">{filteredPhotos.map(renderMediaCard)}</div>
            }
          </div>
        )}

        {/* ── Tab: Videos ── */}
        {activeTab === 'videos' && (
          <div>
            {renderFilterChips()}
            {filteredVideos.length === 0
              ? renderEmptyState('video')
              : <div className="vm-grid">{filteredVideos.map(renderMediaCard)}</div>
            }
          </div>
        )}

      </div>

      {/* ── Mobile FAB ── */}
      <button className="vm-fab" onClick={() => setActiveTab('upload')} aria-label="Upload media">
        ＋
      </button>
    </>
  );
}
