'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CHAPTERS, CHAPTER_LABELS, CHAPTER_ICONS, CHAPTER_COLORS,
  BLUEPRINT_CORE, BlueprintAtom, BlueprintSchema, Chapter,
} from '@/lib/governance/blueprint-core';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AtomRow extends BlueprintAtom { usage_count?: number; active?: boolean; }
interface MediaRow { id: string; url: string; public_id?: string; type: 'image' | 'video'; caption?: string; is_pinned: boolean; pin_order: number; chapter: Chapter; }
interface PostRow { id: string; title: string; body: string | null; cover_url: string | null; category: string | null; published: boolean; created_at: string; }
interface Typology { id: string; name: string; icon: string; icon_color: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'schema',  icon: '🧬', label: 'Field Schema' },
  { id: 'gallery', icon: '🖼️', label: 'Media Gallery' },
  { id: 'pins',    icon: '🎠', label: 'Carousel Pins' },
  { id: 'blog',    icon: '📝', label: 'Mini Blog' },
] as const;

type TabId = typeof TABS[number]['id'];

const LAYER_META = {
  0: { icon: '🔒', label: 'Core',     color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  1: { icon: '🔵', label: 'Standard', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  2: { icon: '🟠', label: 'Private',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
} as const;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BlueprintEditor() {
  const params = useParams();
  const typeId = params?.typeId as string;

  const [activeTab, setActiveTab] = useState<TabId>('schema');
  const [typology, setTypology] = useState<Typology | null>(null);
  const [schema, setSchema] = useState<BlueprintSchema>({ chapters: {} });
  const [allAtoms, setAllAtoms] = useState<AtomRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Gallery
  const [galleryChapter, setGalleryChapter] = useState<Chapter>('identity');
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pins
  const [pins, setPins] = useState<MediaRow[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Blog
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [editPost, setEditPost] = useState<Partial<PostRow> | null>(null);
  const [postSaving, setPostSaving] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  // ── Loaders ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!typeId) return;
    Promise.all([fetchTypology(), fetchAtoms(), fetchSchema()]).then(() => setLoading(false));
  }, [typeId]);

  useEffect(() => {
    if (activeTab === 'gallery') fetchMedia(galleryChapter);
  }, [activeTab, galleryChapter]);

  useEffect(() => {
    if (activeTab === 'pins') fetchPins();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'blog') fetchPosts();
  }, [activeTab]);

  const fetchTypology = async () => {
    const res = await fetch(`/api/jana/types?id=${typeId}`);
    if (res.ok) setTypology(await res.json());
  };

  const fetchAtoms = async () => {
    const res = await fetch('/api/jana/blueprints/atoms');
    if (res.ok) setAllAtoms(await res.json());
  };

  const fetchSchema = async () => {
    const res = await fetch(`/api/jana/blueprints/schema?type_id=${typeId}`);
    if (res.ok) setSchema(await res.json());
  };

  const fetchMedia = async (ch: Chapter) => {
    const res = await fetch(`/api/jana/blueprints/media?business_id=${typeId}&chapter=${ch}`);
    if (res.ok) setMedia(await res.json());
  };

  const fetchPins = async () => {
    const res = await fetch(`/api/jana/blueprints/pins?business_id=${typeId}`);
    if (res.ok) setPins(await res.json());
  };

  const fetchPosts = async () => {
    const res = await fetch(`/api/jana/blueprints/posts?business_id=${typeId}`);
    if (res.ok) setPosts(await res.json());
  };

  // ── Schema helpers ──────────────────────────────────────────────────────────
  const getChapterLayer = (ch: Chapter, layer: 1 | 2): string[] =>
    schema.chapters[ch]?.[`layer${layer}`] || [];

  const toggleAtom = (ch: Chapter, layer: 1 | 2, atomId: string) => {
    setSchema(prev => {
      const chapters = { ...prev.chapters };
      const chData: { layer1: string[]; layer2: string[] } = {
        layer1: chapters[ch]?.layer1 ? [...chapters[ch]!.layer1!] : [],
        layer2: chapters[ch]?.layer2 ? [...chapters[ch]!.layer2!] : [],
      };
      const key = `layer${layer}` as 'layer1' | 'layer2';
      const current = chData[key];
      chData[key] = current.includes(atomId)
        ? current.filter(id => id !== atomId)
        : [...current, atomId];
      chapters[ch] = chData;
      return { chapters };
    });
  };

  const saveSchema = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch('/api/jana/blueprints/schema', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_id: typeId, schema }),
      });
      const d = await res.json();
      setSaveMsg(res.ok ? '✅ Schema saved!' : `❌ ${d.error}`);
    } finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
  };

  // ── Media helpers ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadLoading(true);
    for (const file of files) {
      try {
        // Upload to Cloudinary via signed upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'siwa_oasis');
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          { method: 'POST', body: formData }
        );
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) {
          await fetch('/api/jana/blueprints/media', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: typeId, chapter: galleryChapter, url: cloudData.secure_url, public_id: cloudData.public_id, type: file.type.startsWith('video') ? 'video' : 'image' }),
          });
        }
      } catch (err) { console.error('Upload error:', err); }
    }
    setUploadLoading(false);
    fetchMedia(galleryChapter);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteMedia = async (id: string) => {
    await fetch(`/api/jana/blueprints/media?id=${id}`, { method: 'DELETE' });
    fetchMedia(galleryChapter);
    fetchPins();
  };

  const handleTogglePin = async (id: string) => {
    await fetch('/api/jana/blueprints/pins', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id, business_id: typeId }),
    });
    fetchMedia(galleryChapter);
    fetchPins();
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
    await fetch('/api/jana/blueprints/media', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, caption }),
    });
  };

  // ── Pin drag ─────────────────────────────────────────────────────────────────
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...pins];
    const [item] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, item);
    setPins(reordered);
    setDragIdx(idx);
  };
  const handleDragEnd = async () => {
    setDragIdx(null);
    await fetch('/api/jana/blueprints/pins', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', items: pins.map((p, i) => ({ id: p.id, pin_order: i })) }),
    });
  };

  // ── Blog helpers ────────────────────────────────────────────────────────────
  const handleSavePost = async () => {
    if (!editPost?.title) return;
    setPostSaving(true);
    const isNew = !editPost.id;
    const method = isNew ? 'POST' : 'PUT';
    await fetch('/api/jana/blueprints/posts', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editPost, business_id: typeId }),
    });
    setPostSaving(false);
    setShowPostForm(false);
    setEditPost(null);
    fetchPosts();
  };

  const handleDeletePost = async (id: string) => {
    await fetch(`/api/jana/blueprints/posts?id=${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  const color = typology?.icon_color || '#6366f1';

  if (loading) return (
    <div style={{ background: '#08090a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚛️</div>
        <div style={{ color: '#475569', fontWeight: 700 }}>Loading Blueprint Editor...</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#08090a', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Top Bar */}
      <div style={{ padding: '1.5rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/jana/blueprints" style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', letterSpacing: '2px' }}>← BLUEPRINTS</Link>
          <span style={{ color: '#334155' }}>/</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={typology?.icon || 'fas fa-building'} style={{ color, fontSize: '0.9rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.5px' }}>{typology?.name?.toUpperCase()}</div>
            <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>Blueprint Editor · {typeId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href={`/jana/blueprints/atoms`}>
            <button style={ghostBtn}>⚛️ Atom Registry</button>
          </Link>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ padding: '0 3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0', background: 'rgba(255,255,255,0.01)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '1.1rem 2rem', background: 'none', border: 'none', color: activeTab === tab.id ? '#fff' : '#475569', fontWeight: activeTab === tab.id ? 900 : 700, fontSize: '0.85rem', cursor: 'pointer', borderBottom: activeTab === tab.id ? `2px solid ${color}` : '2px solid transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* TAB 1 — FIELD SCHEMA                                       */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'schema' && (
        <div style={{ padding: '2.5rem 3rem', maxWidth: '1100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>🧬 Field Schema</h2>
              <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0.35rem 0 0', fontWeight: 500 }}>Configure which fields are active per chapter for this business type</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {saveMsg && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: saveMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{saveMsg}</span>}
              <button onClick={saveSchema} disabled={saving}
                style={{ padding: '0.75rem 1.5rem', background: `linear-gradient(135deg,${color},${color}cc)`, color: '#000', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'SAVING...' : '💾 SAVE SCHEMA'}
              </button>
            </div>
          </div>

          {/* Layer Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {Object.entries(LAYER_META).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{v.icon}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: v.color }}>{v.label}</span>
              </div>
            ))}
          </div>

          {/* Chapter Accordions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {CHAPTERS.map(ch => {
              const chColor = CHAPTER_COLORS[ch];
              const coreFields = BLUEPRINT_CORE[ch] || [];
              const l1Selected = getChapterLayer(ch, 1);
              const l2Selected = getChapterLayer(ch, 2);
              const chAtoms = allAtoms.filter(a => a.chapter === ch && a.active !== false);
              const l1Atoms = chAtoms.filter(a => (a.layer_default ?? 1) === 1);
              const l2Atoms = chAtoms.filter(a => (a.layer_default ?? 1) === 2);

              return (
                <ChapterAccordion key={ch}
                  ch={ch} color={chColor}
                  coreFields={coreFields}
                  l1Atoms={l1Atoms} l2Atoms={l2Atoms}
                  l1Selected={l1Selected} l2Selected={l2Selected}
                  onToggle={toggleAtom}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* TAB 2 — MEDIA GALLERY                                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'gallery' && (
        <div style={{ padding: '2.5rem 3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>🖼️ Media Gallery</h2>
              <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0.35rem 0 0', fontWeight: 500 }}>Upload chapter photos · pin to hero carousel · add captions</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
                style={{ padding: '0.75rem 1.5rem', background: '#ec4899', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', opacity: uploadLoading ? 0.6 : 1 }}>
                {uploadLoading ? '⏳ UPLOADING...' : '📤 UPLOAD MEDIA'}
              </button>
            </div>
          </div>

          {/* Chapter Tab Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {CHAPTERS.map(ch => (
              <button key={ch} onClick={() => setGalleryChapter(ch)}
                style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                  background: galleryChapter === ch ? CHAPTER_COLORS[ch] + '33' : 'rgba(255,255,255,0.04)',
                  color: galleryChapter === ch ? CHAPTER_COLORS[ch] : '#64748b',
                  outline: galleryChapter === ch ? `1px solid ${CHAPTER_COLORS[ch]}55` : 'none',
                }}>
                {CHAPTER_ICONS[ch]} {CHAPTER_LABELS[ch]}
              </button>
            ))}
          </div>

          {/* Upload Drop Zone */}
          <div onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '2rem', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color; (e.currentTarget as HTMLDivElement).style.background = color + '08'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
            <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>Click or drag & drop images / videos</div>
            <div style={{ fontSize: '0.7rem', color: '#374151', marginTop: '0.25rem' }}>Chapter: {CHAPTER_ICONS[galleryChapter]} {CHAPTER_LABELS[galleryChapter]}</div>
          </div>

          {/* Masonry Grid */}
          {media.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#374151', fontSize: '0.9rem' }}>
              No media uploaded for {CHAPTER_LABELS[galleryChapter]} yet
            </div>
          ) : (
            <div style={{ columns: '3 280px', gap: '1rem' }}>
              {media.map(m => (
                <div key={m.id} style={{ breakInside: 'avoid', marginBottom: '1rem', position: 'relative', borderRadius: '14px', overflow: 'hidden', border: m.is_pinned ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.08)', transition: 'all 0.2s' }}>
                  {m.is_pinned && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: color, color: '#000', fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', zIndex: 2, letterSpacing: '1px' }}>📌 PINNED</div>
                  )}
                  {m.type === 'video' ? (
                    <video src={m.url} controls style={{ width: '100%', display: 'block', background: '#000' }} />
                  ) : (
                    <img src={m.url} alt={m.caption || ''} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.85)' }}>
                    <input defaultValue={m.caption || ''} onBlur={e => handleUpdateCaption(m.id, e.target.value)}
                      placeholder="Add caption..."
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.75rem', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button onClick={() => handleTogglePin(m.id)}
                        style={{ flex: 1, padding: '5px', borderRadius: '8px', border: 'none', background: m.is_pinned ? color + '33' : 'rgba(255,255,255,0.06)', color: m.is_pinned ? color : '#64748b', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>
                        {m.is_pinned ? '📌 Unpin' : '📌 Pin to Carousel'}
                      </button>
                      <button onClick={() => handleDeleteMedia(m.id)}
                        style={{ width: '30px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* TAB 3 — CAROUSEL PINS                                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'pins' && (
        <div style={{ padding: '2.5rem 3rem', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left — Reorder list */}
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>🎠 Carousel Pins</h2>
              <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0.35rem 0 0', fontWeight: 500 }}>Drag to reorder · sets the minisite hero carousel sequence</p>
            </div>

            {pins.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '16px', color: '#374151' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📌</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>No pinned images yet</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Go to Gallery tab → pin images to add them here</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pins.map((pin, idx) => (
                  <div key={pin.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.25rem',
                      background: dragIdx === idx ? `${color}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${dragIdx === idx ? color + '44' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '14px', cursor: 'grab', transition: 'all 0.15s',
                    }}>
                    <div style={{ color: '#475569', fontWeight: 900, fontSize: '0.8rem', width: '20px', textAlign: 'center' }}>☰</div>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: color, width: '24px', textAlign: 'center' }}>#{idx + 1}</div>
                    <img src={pin.url} alt="" style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>{pin.caption || 'No caption'}</div>
                      <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '2px' }}>
                        {CHAPTER_ICONS[pin.chapter]} {CHAPTER_LABELS[pin.chapter]}
                      </div>
                    </div>
                    <button onClick={() => handleTogglePin(pin.id)}
                      style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>
                      Unpin
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Live Preview */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#475569', letterSpacing: '2px', marginBottom: '1rem' }}>MINISITE PREVIEW</div>
            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#111' }}>
              {pins.length > 0 ? (
                <CarouselPreview pins={pins} color={color} />
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: '0.85rem' }}>
                  Pin images to preview carousel
                </div>
              )}
              <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>{pins.length} slides · auto-synced to minisite hero</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* TAB 4 — MINI BLOG                                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'blog' && (
        <div style={{ padding: '2.5rem 3rem', maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>📝 Mini Blog</h2>
              <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0.35rem 0 0', fontWeight: 500 }}>Write posts that appear in the minisite blog feed</p>
            </div>
            <button onClick={() => { setEditPost({ title: '', body: '', cover_url: '', category: '', published: false }); setShowPostForm(true); }}
              style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}>
              + NEW POST
            </button>
          </div>

          {/* Post List */}
          {posts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '16px', color: '#374151' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>No posts yet</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Create the first post for this business type</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {posts.map(post => (
                <div key={post.id} style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', alignItems: 'flex-start', transition: 'all 0.2s' }}>
                  {post.cover_url && <img src={post.cover_url} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{post.title}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: '5px', background: post.published ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: post.published ? '#10b981' : '#64748b', border: post.published ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
                        {post.published ? '● PUBLISHED' : '○ DRAFT'}
                      </span>
                      {post.category && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{post.category}</span>}
                    </div>
                    {post.body && <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{post.body}</div>}
                    <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.5rem' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={() => { setEditPost(post); setShowPostForm(true); }}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>✏️ Edit</button>
                    <button onClick={() => handleDeletePost(post.id)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Post Editor Modal */}
          {showPostForm && editPost && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>{editPost.id ? '✏️ Edit Post' : '📝 New Post'}</h2>
                  <button onClick={() => { setShowPostForm(false); setEditPost(null); }} style={closeBtn}>✕</button>
                </div>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle2}>Title</label>
                    <input value={editPost.title || ''} onChange={e => setEditPost(p => ({ ...p, title: e.target.value }))}
                      placeholder="Post title" style={inputStyle2} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle2}>Category</label>
                      <input value={editPost.category || ''} onChange={e => setEditPost(p => ({ ...p, category: e.target.value }))}
                        placeholder="News, Story, Tips..." style={inputStyle2} />
                    </div>
                    <div>
                      <label style={labelStyle2}>Cover Image URL</label>
                      <input value={editPost.cover_url || ''} onChange={e => setEditPost(p => ({ ...p, cover_url: e.target.value }))}
                        placeholder="https://..." style={inputStyle2} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle2}>Body</label>
                    <textarea value={editPost.body || ''} onChange={e => setEditPost(p => ({ ...p, body: e.target.value }))}
                      rows={8} placeholder="Write your post content here..."
                      style={{ ...inputStyle2, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <input type="checkbox" id="pub-toggle" checked={!!editPost.published}
                      onChange={e => setEditPost(p => ({ ...p, published: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <label htmlFor="pub-toggle" style={{ fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', color: editPost.published ? '#10b981' : '#64748b' }}>
                      {editPost.published ? '● Published — visible on minisite' : '○ Draft — not yet visible'}
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleSavePost} disabled={postSaving}
                      style={{ flex: 1, padding: '0.9rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', opacity: postSaving ? 0.6 : 1 }}>
                      {postSaving ? 'SAVING...' : '💾 SAVE POST'}
                    </button>
                    <button onClick={() => { setShowPostForm(false); setEditPost(null); }}
                      style={{ padding: '0.9rem 1.5rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chapter Accordion Component ──────────────────────────────────────────────
function ChapterAccordion({ ch, color, coreFields, l1Atoms, l2Atoms, l1Selected, l2Selected, onToggle }: {
  ch: Chapter; color: string; coreFields: string[];
  l1Atoms: AtomRow[]; l2Atoms: AtomRow[];
  l1Selected: string[]; l2Selected: string[];
  onToggle: (ch: Chapter, layer: 1 | 2, atomId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const l1Count = l1Selected.length;
  const l2Count = l2Selected.length;

  return (
    <div style={{ border: `1px solid ${open ? color + '33' : 'rgba(255,255,255,0.06)'}`, borderRadius: '18px', overflow: 'hidden', transition: 'all 0.2s' }}>
      {/* Accordion Header */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '1.25rem 1.5rem', background: open ? color + '0a' : 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
          {CHAPTER_ICONS[ch]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: open ? color : '#fff' }}>{CHAPTER_LABELS[ch]}</div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
            🔒 {coreFields.length} core · 🔵 {l1Count}/{l1Atoms.length} standard · 🟠 {l2Count}/{l2Atoms.length} private
          </div>
        </div>
        <span style={{ color: '#475569', fontSize: '0.8rem', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderTop: `1px solid ${color}22` }}>
          {/* Layer 0 — Core */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔒 LAYER 0 — CORE <span style={{ fontWeight: 600, color: '#374151' }}>(always active)</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {coreFields.map(f => (
                <div key={f} style={{ padding: '5px 12px', borderRadius: '8px', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🔒 {f}
                </div>
              ))}
            </div>
          </div>

          {/* Layer 1 — Standard */}
          {l1Atoms.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', letterSpacing: '2px', marginBottom: '0.75rem' }}>🔵 LAYER 1 — STANDARD</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {l1Atoms.map(atom => {
                  const active = l1Selected.includes(atom.id);
                  return (
                    <button key={atom.id} onClick={() => onToggle(ch, 1, atom.id)}
                      title={atom.display_hint || atom.id}
                      style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${active ? '#6366f155' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: active ? '#818cf8' : '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {atom.icon && <i className={`fas ${atom.icon}`} style={{ fontSize: '0.7rem' }} />}
                      {atom.label}
                      {active && <span style={{ color: '#6366f1', marginLeft: '2px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Layer 2 — Private */}
          {l2Atoms.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#f59e0b', letterSpacing: '2px', marginBottom: '0.75rem' }}>🟠 LAYER 2 — PRIVATE</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {l2Atoms.map(atom => {
                  const active = l2Selected.includes(atom.id);
                  return (
                    <button key={atom.id} onClick={() => onToggle(ch, 2, atom.id)}
                      title={atom.display_hint || atom.id}
                      style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${active ? '#f59e0b55' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)', color: active ? '#fbbf24' : '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {atom.icon && <i className={`fas ${atom.icon}`} style={{ fontSize: '0.7rem' }} />}
                      {atom.label}
                      {active && <span style={{ color: '#f59e0b', marginLeft: '2px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {l1Atoms.length === 0 && l2Atoms.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: '#374151', padding: '1rem', textAlign: 'center' }}>
              No atoms in registry for this chapter yet. <Link href="/jana/blueprints/atoms" style={{ color: '#6366f1', fontWeight: 700 }}>Seed defaults ↗</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Carousel Preview Component ────────────────────────────────────────────────
function CarouselPreview({ pins, color }: { pins: MediaRow[]; color: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % pins.length), 3000);
    return () => clearInterval(t);
  }, [pins.length]);

  const current = pins[idx];
  return (
    <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
      <img src={current.url} alt={current.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
      {current.caption && (
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{current.caption}</div>
      )}
      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '0.75rem', right: '1rem', display: 'flex', gap: '4px' }}>
        {pins.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? '16px' : '6px', height: '6px', borderRadius: '3px', background: i === idx ? color : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const ghostBtn: React.CSSProperties = { padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' };
const closeBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem' };
const labelStyle2: React.CSSProperties = { display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '0.4rem' };
const inputStyle2: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
