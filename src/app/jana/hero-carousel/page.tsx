'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  caption?: string;
  mediaUrl: string | null;
  type: 'image' | 'youtube' | 'video' | 'branded';
  ctaText?: string;
  ctaLink?: string;
  displayOrder: number;
  imageFit?: 'cover' | 'contain';
  imagePosition?: 'center' | 'top' | 'bottom';
  bgColor?: string;
  overlayOpacity?: number;
  animation?: string;
  // Text styling fields
  titleColor?: string;
  titleSize?: number;
  subtitleSize?: number;
  textAlign?: 'center' | 'left' | 'right';
  fontFamily?: string;
  // source tracks where this slide came from (for display only)
  _source?: 'manual' | 'business' | 'journey' | 'investment' | 'workflow';
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:v=|v\/|vi\/|vi=|video\/|embed\/|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/shorts\/)([^#&?\s]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  manual:     { label: '⭐ Manual',     color: '#D4AF37', bg: 'rgba(212,175,55,0.15)' },
  business:   { label: '🏢 Business',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  journey:    { label: '✈️ Journey',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  investment: { label: '💼 Investment', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  workflow:   { label: '📋 Workflow',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

export default function HeroCarouselManager() {
  const [allSlides, setAllSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CarouselSlide>>({
    title: '',
    subtitle: '',
    caption: '',
    mediaUrl: '',
    type: 'image',
    ctaText: '',
    ctaLink: '',
    displayOrder: 0,
    imageFit: 'cover',
    imagePosition: 'center',
    bgColor: '#000000',
    overlayOpacity: 0.4,
    animation: 'kenburns',
    titleColor: '#FFFFFF',
    titleSize: 0,
    subtitleSize: 0,
    textAlign: 'center',
    fontFamily: '',
  });

  const showMsg = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 6000);
  };

  // Load ALL slides from the dynamic endpoint — same view as homepage
  const loadAllSlides = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch what the homepage actually sees
      const res = await fetch('/api/jana/hero-carousel-dynamic?businesses=true&journeys=true&investment=true&registration=true');
      if (res.ok) {
        const data = await res.json();
        const fetched: CarouselSlide[] = (data.slides || []).map((s: any, i: number) => ({
          ...s,
          displayOrder: s.displayOrder ?? i,
          _source: s._source || (
            s.id?.startsWith('business_') ? 'business' :
            s.id?.startsWith('journey_') ? 'journey' :
            s.id?.startsWith('investment_') ? 'investment' :
            s.id?.startsWith('workflow_') ? 'workflow' : 'manual'
          ),
        }));
        setAllSlides(fetched);
      }
    } catch (err) {
      showMsg('error', 'Failed to load slides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAllSlides(); }, [loadAllSlides]);

  // Save manual slides only — auto-generated ones are always fresh from DB.
  // IMPORTANT: re-assign displayOrder by array index here so the sort in the
  // dynamic endpoint always reflects the admin's intended order.
  const saveManualSlides = async (slides: CarouselSlide[]) => {
    const manualSlides = slides
      .filter(s => !['business', 'journey', 'investment', 'workflow'].includes(s._source || ''))
      .map(({ _source, ...s }, idx) => ({ ...s, displayOrder: idx })); // ← fix: re-index here

    const res = await fetch('/api/jana/hero-carousel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides: manualSlides, siteId: 'main' }),
    });
    return res.ok;
  };

  // For auto-generated slides that admin wants to hide, we save them as "excluded" IDs
  const getExcludedIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('carousel_excluded_ids') || '[]'); }
    catch { return []; }
  };
  const setExcludedIds = (ids: string[]) => {
    localStorage.setItem('carousel_excluded_ids', JSON.stringify(ids));
  };

  const handleDelete = async (slide: CarouselSlide) => {
    if (!confirm(`Remove "${slide.title}" from the carousel?`)) return;

    if (['business', 'journey', 'investment', 'workflow'].includes(slide._source || '')) {
      // For auto-generated: we convert it to a manual "excluded" marker by removing it from view
      // The real fix: save all current slides as manual overrides, which means auto-generated
      // slides won't appear (since manual slides take full control when present)
      showMsg('info', 'Converting carousel to full manual mode to allow removal...');
    }

    const updatedSlides = allSlides.filter(s => s.id !== slide.id);
    setAllSlides(updatedSlides);

    // Save ALL current slides (minus deleted) as manual — this gives full control
    const ok = await saveManualSlides(updatedSlides);
    if (ok) {
      showMsg('success', `"${slide.title}" removed. Carousel saved.`);
      loadAllSlides();
    } else {
      showMsg('error', 'Failed to save changes');
      loadAllSlides(); // revert
    }
  };

  const handleMoveSlide = async (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === allSlides.length - 1) return;
    const next = [...allSlides];
    const target = dir === 'up' ? index - 1 : index + 1;
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((s, i) => ({ ...s, displayOrder: i }));
    setAllSlides(reordered);
    await saveManualSlides(reordered);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSaving(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append('file', file);
        fd.append('businessName', 'General');
        fd.append('sectionName', 'Hero');
        const res = await fetch('/api/jana/media/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          const isVideo = file.type.startsWith('video/');
          setFormData(prev => ({
            ...prev,
            mediaUrl: data.url,
            type: isVideo ? 'video' : 'image',
          }));
          showMsg('success', `${isVideo ? 'Video' : 'Image'} uploaded!`);
        }
      }
    } catch {
      showMsg('error', 'Upload failed');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) { showMsg('error', 'Title is required'); return; }
    if (formData.type !== 'branded' && !formData.mediaUrl?.trim()) {
      showMsg('error', 'Media URL is required for image/video/YouTube slides'); return;
    }
    if (formData.type === 'youtube') {
      const ytId = extractYouTubeId(formData.mediaUrl || '');
      if (!ytId) { showMsg('error', 'Invalid YouTube URL. Paste the full video URL.'); return; }
    }

    setSaving(true);
    try {
      let updated: CarouselSlide[];
      if (editingId) {
        // Replace the matching slide in-place, mark as manual
        updated = allSlides.map(s =>
          s.id === editingId ? { ...s, ...formData, _source: 'manual' } as CarouselSlide : s
        );
      } else {
        const newSlide: CarouselSlide = {
          ...formData,
          id: `slide_${Date.now()}`,
          title: formData.title!,
          mediaUrl: formData.mediaUrl || null,
          type: formData.type || 'image',
          displayOrder: allSlides.length,
          _source: 'manual',
        };
        updated = [...allSlides, newSlide];
      }
      // Re-index displayOrder to match current array positions (prevents sort scramble)
      const reIndexed = updated.map((s, i) => ({ ...s, displayOrder: i }));
      setAllSlides(reIndexed);
      const ok = await saveManualSlides(reIndexed);
      if (ok) {
        showMsg('success', editingId ? 'Slide updated!' : 'Slide added to carousel!');
        setShowForm(false);
        setEditingId(null);
        loadAllSlides();
      } else {
        showMsg('error', 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (slide: CarouselSlide) => {
    setFormData({ ...slide });
    setEditingId(slide.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ title: '', subtitle: '', caption: '', mediaUrl: '', type: 'image', ctaText: '', ctaLink: '', displayOrder: allSlides.length, imageFit: 'cover', imagePosition: 'center', bgColor: '#000000', overlayOpacity: 0.4, animation: 'kenburns', titleColor: '#FFFFFF', titleSize: 0, subtitleSize: 0, textAlign: 'center', fontFamily: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const ytPreviewId = formData.type === 'youtube' ? extractYouTubeId(formData.mediaUrl || '') : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/jana" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>
              ← ADMIN DASHBOARD
            </Link>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0 0', letterSpacing: '-1px' }}>
              🎬 Hero Carousel
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>
              Full control — manage every slide that appears on the homepage hero.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
              <i className="fas fa-eye" /> Preview Site
            </a>
            {!showForm && (
              <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem' }}>
                + Add Slide
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{ padding: '1rem 1.5rem', borderRadius: '10px', marginBottom: '1.5rem', background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`, color: message.type === 'error' ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
            {message.text}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#fff', fontWeight: 900, margin: 0 }}>{editingId ? '✏️ Edit Slide' : '+ New Slide'}</h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* TYPE */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>SLIDE TYPE</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['image', 'youtube', 'video', 'branded'] as const).map(t => (
                    <button key={t} onClick={() => setFormData(p => ({ ...p, type: t }))}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '2px solid', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s',
                        borderColor: formData.type === t ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                        background: formData.type === t ? 'rgba(212,175,55,0.15)' : 'transparent',
                        color: formData.type === t ? '#D4AF37' : '#64748b' }}>
                      {t === 'image' ? '🖼 Image' : t === 'youtube' ? '▶ YouTube' : t === 'video' ? '🎥 Video' : '✨ Text/Branded'}
                    </button>
                  ))}
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TITLE *</label>
                <input value={formData.title || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Discover Siwa Oasis"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* SUBTITLE */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>SUBTITLE</label>
                <input value={formData.subtitle || ''} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Short description"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* CAPTION */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>CAPTION (Badge label shown above title)</label>
                <input value={formData.caption || ''} onChange={e => setFormData(p => ({ ...p, caption: e.target.value }))}
                  placeholder="e.g. FEATURED · SIWA OASIS"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* MEDIA URL / YOUTUBE URL */}
              {formData.type !== 'branded' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                    {formData.type === 'youtube' ? 'YOUTUBE URL (paste the full video link)' : 'MEDIA URL / UPLOAD'}
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input value={formData.mediaUrl || ''} onChange={e => setFormData(p => ({ ...p, mediaUrl: e.target.value }))}
                      placeholder={formData.type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                      style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: `1px solid ${formData.type === 'youtube' && formData.mediaUrl && !extractYouTubeId(formData.mediaUrl) ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', color: '#fff', outline: 'none' }} />
                    {formData.type !== 'youtube' && (
                      <>
                        <div style={{ position: 'relative' }}>
                          <button style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {saving ? '...' : '⬆ Upload'}
                          </button>
                          <input type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            📷 Camera
                          </button>
                          <input type="file" accept="image/*,video/*" capture="environment" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </div>
                      </>
                    )}
                  </div>
                  {/* YouTube validation feedback */}
                  {formData.type === 'youtube' && formData.mediaUrl && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: extractYouTubeId(formData.mediaUrl) ? '#10b981' : '#ef4444' }}>
                      {extractYouTubeId(formData.mediaUrl) ? `✅ Valid YouTube ID: ${extractYouTubeId(formData.mediaUrl)}` : '❌ Cannot extract YouTube ID — check the URL format'}
                    </div>
                  )}
                  {/* YouTube preview thumbnail */}
                  {ytPreviewId && (
                    <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', maxWidth: 320, position: 'relative' }}>
                      <img src={`https://img.youtube.com/vi/${ytPreviewId}/hqdefault.jpg`} alt="YouTube thumbnail" style={{ width: '100%', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 50, height: 36, background: 'rgba(255,0,0,0.85)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 6, left: 8, background: 'rgba(0,0,0,0.7)', color: '#10b981', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>✓ YOUTUBE PREVIEW</div>
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>BUTTON TEXT</label>
                <input value={formData.ctaText || ''} onChange={e => setFormData(p => ({ ...p, ctaText: e.target.value }))}
                  placeholder="e.g. Explore Now"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>BUTTON LINK</label>
                <input value={formData.ctaLink || ''} onChange={e => setFormData(p => ({ ...p, ctaLink: e.target.value }))}
                  placeholder="/search/vibe"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* ANIMATION + OVERLAY */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>ANIMATION</label>
                <select value={formData.animation || 'kenburns'} onChange={e => setFormData(p => ({ ...p, animation: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                  <option value="kenburns">Ken Burns (Cinematic Zoom)</option>
                  <option value="fade">Fade</option>
                  <option value="zoom">Zoom</option>
                  <option value="slide">Slide</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>OVERLAY DARKNESS (0–1)</label>
                <input type="range" min="0" max="1" step="0.05" value={formData.overlayOpacity ?? 0.4} onChange={e => setFormData(p => ({ ...p, overlayOpacity: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#D4AF37' }} />
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{Math.round((formData.overlayOpacity ?? 0.4) * 100)}% dark overlay</div>
              </div>

              {/* ── TEXT STYLING ─────────────────────────────────────── */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>🎨 TEXT STYLING</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TITLE COLOR</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="color" value={formData.titleColor || '#FFFFFF'} onChange={e => setFormData(p => ({ ...p, titleColor: e.target.value }))}
                        style={{ width: 44, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                      <input value={formData.titleColor || '#FFFFFF'} onChange={e => setFormData(p => ({ ...p, titleColor: e.target.value }))}
                        style={{ flex: 1, padding: '0.5rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TEXT ALIGNMENT</label>
                    <select value={formData.textAlign || 'center'} onChange={e => setFormData(p => ({ ...p, textAlign: e.target.value as 'center'|'left'|'right' }))}
                      style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="center">⊙ Center</option>
                      <option value="left">⇐ Left</option>
                      <option value="right">⇒ Right</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>FONT FAMILY</label>
                    <select value={formData.fontFamily || ''} onChange={e => setFormData(p => ({ ...p, fontFamily: e.target.value }))}
                      style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="">Default (Inherit)</option>
                      <option value="'Inter', sans-serif">Inter (Modern)</option>
                      <option value="'Playfair Display', serif">Playfair Display (Elegant)</option>
                      <option value="'Outfit', sans-serif">Outfit (Clean)</option>
                      <option value="'Cinzel', serif">Cinzel (Luxury)</option>
                      <option value="'Lora', serif">Lora (Classic)</option>
                      <option value="'Montserrat', sans-serif">Montserrat (Bold)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TITLE SIZE (rem, 0=auto)</label>
                    <input type="number" min="0" max="10" step="0.5" value={formData.titleSize || 0} onChange={e => setFormData(p => ({ ...p, titleSize: parseFloat(e.target.value) || 0 }))}
                      placeholder="0 = auto" style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>SUBTITLE SIZE (rem, 0=auto)</label>
                    <input type="number" min="0" max="5" step="0.25" value={formData.subtitleSize || 0} onChange={e => setFormData(p => ({ ...p, subtitleSize: parseFloat(e.target.value) || 0 }))}
                      placeholder="0 = auto" style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>PREVIEW</label>
                      <div style={{ padding: '0.5rem 0.75rem', background: formData.bgColor || '#1e293b', borderRadius: 8, textAlign: formData.textAlign || 'center', fontFamily: formData.fontFamily || 'inherit' }}>
                        <div style={{ color: formData.titleColor || '#fff', fontWeight: 900, fontSize: formData.titleSize ? `${formData.titleSize}rem` : '1rem' }}>Title Preview</div>
                        <div style={{ color: '#ccc', fontSize: formData.subtitleSize ? `${formData.subtitleSize}rem` : '0.7rem', marginTop: 2 }}>Subtitle preview</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.9rem 2rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingId ? '✓ Update Slide' : '+ Add to Carousel'}
              </button>
              <button onClick={resetForm}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.9rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Slides List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }} />
            <p style={{ marginTop: '1rem' }}>Loading all carousel slides...</p>
          </div>
        ) : allSlides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: '#1e293b', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.1)', color: '#64748b' }}>
            <p>No slides yet. Click <strong style={{ color: '#D4AF37' }}>+ Add Slide</strong> to begin.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>{allSlides.length} slides · exactly as they appear on the homepage</span>
            </div>

            {/* ⚠️ Warning if slide #1 is YouTube/video */}
            {allSlides[0] && (allSlides[0].type === 'youtube' || allSlides[0].type === 'video') && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                  <div>
                    <div style={{ color: '#fcd34d', fontWeight: 800, fontSize: '0.85rem' }}>⚡ Performance Tip</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      Your first slide is a <strong style={{ color: '#fcd34d' }}>{allSlides[0].type.toUpperCase()}</strong> — this causes a loading delay on page open because the browser needs time to connect to YouTube. Put an image or text slide first for instant loading.
                    </div>
                  </div>
                </div>
                {allSlides.length > 1 && (
                  <button
                    onClick={async () => {
                      const next = [...allSlides];
                      [next[0], next[1]] = [next[1], next[0]];
                      const reordered = next.map((s, i) => ({ ...s, displayOrder: i }));
                      setAllSlides(reordered);
                      await saveManualSlides(reordered);
                      showMsg('success', '✅ Fixed! YouTube slide moved to position 2. Fast image is now first.');
                    }}
                    style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    ⚡ Quick Fix — Move to Position 2
                  </button>
                )}
              </div>
            )}

            {allSlides.map((slide, index) => {
              const src = SOURCE_LABELS[slide._source || 'manual'] || SOURCE_LABELS.manual;
              const ytId = slide.type === 'youtube' ? extractYouTubeId(slide.mediaUrl || '') : null;
              return (
                <div key={slide.id}
                  style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '52px 90px 1fr auto', gap: '1rem', alignItems: 'center', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>

                  {/* Order controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                    <button onClick={() => handleMoveSlide(index, 'up')} disabled={index === 0}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: index === 0 ? '#334155' : '#94a3b8', borderRadius: '6px', width: 28, height: 28, cursor: index === 0 ? 'default' : 'pointer', fontWeight: 900 }}>▲</button>
                    <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.8rem' }}>{index + 1}</span>
                    <button onClick={() => handleMoveSlide(index, 'down')} disabled={index === allSlides.length - 1}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: index === allSlides.length - 1 ? '#334155' : '#94a3b8', borderRadius: '6px', width: 28, height: 28, cursor: index === allSlides.length - 1 ? 'default' : 'pointer', fontWeight: 900 }}>▼</button>
                  </div>

                  {/* Preview */}
                  <div style={{ width: 90, height: 60, borderRadius: '8px', overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                    {slide.type === 'youtube' && ytId ? (
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : slide.type === 'image' && slide.mediaUrl ? (
                      <img src={slide.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: slide.bgColor || '#1e293b' }}>
                        <i className={`fas ${slide.type === 'video' ? 'fa-video' : slide.type === 'youtube' ? 'fa-youtube' : 'fa-star'}`} style={{ color: '#D4AF37', fontSize: '1.5rem' }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <h3 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '0.95rem' }}>{slide.title}</h3>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: src.bg, color: src.color }}>{src.label}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>{slide.type.toUpperCase()}</span>
                    </div>
                    {slide.subtitle && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>{slide.subtitle}</p>}
                    {slide.type === 'youtube' && (
                      <p style={{ color: ytId ? '#10b981' : '#ef4444', fontSize: '0.7rem', margin: '0.25rem 0 0', fontWeight: 700 }}>
                        {ytId ? `✅ YouTube ID: ${ytId}` : `❌ Invalid YouTube URL: ${slide.mediaUrl}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={() => startEdit(slide)}
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(slide)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div style={{ marginTop: '2rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: '#D4AF37' }}>⭐ Manual slides</strong> are ones you added here. 
            <strong style={{ color: '#3b82f6' }}> 🏢 Business</strong>, 
            <strong style={{ color: '#10b981' }}> ✈️ Journey</strong>, 
            <strong style={{ color: '#8b5cf6' }}> 💼 Investment</strong> slides come from your database.
            <strong style={{ color: '#f59e0b' }}> 📋 Workflow</strong> slides are default placeholders (only shown when no manual slides exist).
            <br/>
            Once you save a slide here, the carousel goes into <strong style={{ color: '#D4AF37' }}>full manual mode</strong> — you control every slide shown.
          </p>
        </div>
      </div>
    </div>
  );
}
