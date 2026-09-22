'use client';

import React, { useState, useEffect, useRef } from 'react';
import RichBlogEditor from '@/components/RichBlogEditor';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface GalleryItem {
  id?: string;
  url: string;
  caption: string;
  is_hero?: boolean;
  placement?: 'carousel' | 'body' | 'both';
  slide_data?: {
    title?: string;
    cta_label?: string;
    cta_url?: string;
    show_overlay?: boolean;
  };
}

export interface ContentMeta {
  galleryStatus?: 'draft' | 'approved' | 'suspended';
  blogStatus?: 'draft' | 'approved' | 'suspended';
  galleryOnMain?: boolean;
  galleryOnMinisite?: boolean;
  blogOnMain?: boolean;
  blogOnMinisite?: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parseGallery(value: unknown): GalleryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { url: item, caption: '', is_hero: false, placement: 'carousel' as const };
      }
      const rawSlide = item?.slide_data;
      const slideData =
        typeof rawSlide === 'string'
          ? (() => { try { return JSON.parse(rawSlide); } catch { return {}; } })()
          : rawSlide || {};
      return {
        id: item?.id || undefined,
        url: item?.url || '',
        caption: item?.caption || '',
        is_hero: !!item?.is_hero,
        placement: item?.placement === 'body' || item?.placement === 'both' ? item.placement : ('carousel' as const),
        slide_data: slideData,
      };
    })
    .filter((item) => item.url);
}

const EMPTY_META: ContentMeta = {
  galleryStatus: 'draft',
  blogStatus: 'draft',
  galleryOnMain: false,
  galleryOnMinisite: true,
  blogOnMain: false,
  blogOnMinisite: true,
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

export interface SectionContentStudioProps {
  /** The business UUID */
  businessId: string;
  /** Display name for the business (used in upload metadata) */
  businessName: string;
  /** The currently active section ID */
  sectionId: string;
  /** All available sections for this business type */
  sections: Array<{ id: string; name: string; icon?: string }>;
  /** The full custom_data object from the business record */
  customData: Record<string, any>;
  /** Per-section admin control records (keyed by section_id) */
  sectionControls?: Record<string, any>;
  /**
   * Called when the user clicks "Save". Receives the updated customData
   * so the parent page can PATCH the API.
   */
  onSave: (nextCustomData: Record<string, any>) => Promise<void> | void;
  /** External saving state — disables the save button */
  saving?: boolean;
  /** Optional message to display (success / error) */
  message?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function SectionContentStudio({
  businessId,
  businessName,
  sectionId,
  sections,
  customData,
  sectionControls = {},
  onSave,
  saving = false,
  message: externalMessage,
}: SectionContentStudioProps) {
  const section = sections.find((s) => s.id === sectionId);

  // Local state
  const [sectionLabel, setSectionLabel] = useState('');
  const [sectionLabelAr, setSectionLabelAr] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [newImage, setNewImage] = useState({ url: '', caption: '' });
  const [blogTitle, setBlogTitle] = useState('');
  const [blogBody, setBlogBody] = useState('');
  const [blogTitleAr, setBlogTitleAr] = useState('');
  const [blogBodyAr, setBlogBodyAr] = useState('');
  const [meta, setMeta] = useState<ContentMeta>(EMPTY_META);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [localMessage, setLocalMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Hydrate from customData whenever sectionId or customData changes ──
  useEffect(() => {
    const sData = customData?.[sectionId] || {};
    const storedMeta = customData?.section_content_meta?.[sectionId] || {};
    setSectionLabel(
      customData?.section_labels?.[sectionId] ||
      customData?.basic?.section_labels?.[sectionId] || ''
    );
    setSectionLabelAr(
      customData?.section_labels_ar?.[sectionId] ||
      customData?.basic?.section_labels_ar?.[sectionId] || ''
    );
    setGallery(parseGallery(sData.section_gallery));
    setBlogTitle(sData.section_blog_title || '');
    setBlogBody(sData.section_blog || sData.mini_blog || '');
    setBlogTitleAr(sData.section_blog_title_ar || '');
    setBlogBodyAr(sData.section_blog_ar || '');
    setMeta({ ...EMPTY_META, ...storedMeta });
    setNewImage({ url: '', caption: '' });
    setActiveMediaIndex(null);
    setLocalMessage('');
  }, [sectionId, customData]);

  // ── Gallery helpers ──────────────────────────────────────────────────

  function addImageManual() {
    if (!newImage.url.trim()) return;
    setGallery((prev) => [
      ...prev,
      { url: newImage.url.trim(), caption: newImage.caption.trim(), placement: 'carousel', is_hero: prev.length === 0 },
    ]);
    setNewImage({ url: '', caption: '' });
  }

  async function uploadMultipleFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadProgress({ total: fileArray.length, done: 0 });
    const newEntries: GalleryItem[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessName', businessName || 'General');
      formData.append('sectionName', section?.name || sectionId);

      try {
        const res = await fetch('/api/jana/media/upload', { method: 'POST', body: formData });
        const result = await res.json();
        if (res.ok && (result.url || result.localUrl)) {
          newEntries.push({
            url: result.url || result.localUrl,
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            placement: 'carousel',
            is_hero: gallery.length === 0 && newEntries.length === 0,
          });
        }
      } catch (err) {
        console.error('Upload error', file.name, err);
      } finally {
        setUploadProgress({ total: fileArray.length, done: i + 1 });
      }
    }

    if (newEntries.length > 0) {
      setGallery((prev) => [...prev, ...newEntries]);
      setLocalMessage(`✓ Uploaded ${newEntries.length} file(s) successfully.`);
    } else {
      setLocalMessage('⚠️ Upload failed. Check file format and size.');
    }
    setUploadProgress(null);
  }

  function handleDropFiles(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) uploadMultipleFiles(e.dataTransfer.files);
  }

  function handleReorderGallery(from: number, to: number) {
    if (from === to) return;
    setGallery((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function updateGalleryItem(index: number, updates: Partial<GalleryItem>) {
    setGallery((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  function setHeroItem(index: number) {
    setGallery((prev) => prev.map((item, i) => ({ ...item, is_hero: i === index })));
  }

  function removeGalleryItem(index: number) {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Save ────────────────────────────────────────────────────────────

  async function handleSave() {
    const nextCustomData: Record<string, any> = { ...(customData || {}) };

    // Section labels (both top-level and nested in `basic`)
    nextCustomData.section_labels = { ...(nextCustomData.section_labels || {}), [sectionId]: sectionLabel.trim() };
    nextCustomData.section_labels_ar = { ...(nextCustomData.section_labels_ar || {}), [sectionId]: sectionLabelAr.trim() };
    nextCustomData.basic = {
      ...(nextCustomData.basic || {}),
      section_labels: { ...(nextCustomData.basic?.section_labels || {}), [sectionId]: sectionLabel.trim() },
      section_labels_ar: { ...(nextCustomData.basic?.section_labels_ar || {}), [sectionId]: sectionLabelAr.trim() },
    };

    // Section content
    nextCustomData[sectionId] = {
      ...(nextCustomData[sectionId] || {}),
      section_gallery: gallery,
      section_blog_title: blogTitle,
      section_blog: blogBody,
      section_blog_title_ar: blogTitleAr,
      section_blog_ar: blogBodyAr,
    };

    // Publication meta
    nextCustomData.section_content_meta = {
      ...(nextCustomData.section_content_meta || {}),
      [sectionId]: meta,
    };

    try {
      await onSave(nextCustomData);
      setLocalMessage('✓ Content & media saved successfully.');
    } catch (err: any) {
      setLocalMessage(`⚠️ ${err?.message || 'Save failed.'}`);
    }
  }

  const adminLocked = !!sectionControls[sectionId]?.admin_locked_label;
  const displayMessage = externalMessage || localMessage;

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>

      {/* Section Name Overrides */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.8px', marginBottom: '0.5rem' }}>
          MINISITE SECTION NAME
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <input
            value={sectionLabel}
            onChange={(e) => setSectionLabel(e.target.value)}
            placeholder={`English Label (${section?.name || 'Default'})`}
            disabled={adminLocked}
            style={{ padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, background: adminLocked ? '#f8fafc' : '#fff' }}
          />
          <input
            value={sectionLabelAr}
            onChange={(e) => setSectionLabelAr(e.target.value)}
            placeholder="اسم القسم بالعربية"
            dir="rtl"
            disabled={adminLocked}
            style={{ padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, background: adminLocked ? '#f8fafc' : '#fff', textAlign: 'right' }}
          />
        </div>
        {adminLocked && (
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
            🔒 Section label is locked by admin.
          </p>
        )}
      </section>

      {/* Multi-Media Gallery */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
              Section Multi-Media Album &amp; Carousel
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>
              Batch upload photos or videos. Drag to reorder carousel. Set the hero cover slide.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!uploadProgress}
            style={{ padding: '0.6rem 1rem', background: '#D4AF37', color: '#1a1000', border: 0, borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: uploadProgress ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(212,175,55,0.3)' }}
          >
            <i className="fas fa-plus" /> {uploadProgress ? 'Uploading Batch...' : 'Batch Upload Files'}
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={(e) => e.target.files && uploadMultipleFiles(e.target.files)} style={{ display: 'none' }} />
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDropFiles}
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '2rem 1.5rem', borderRadius: '12px', border: `2px dashed ${isDragOver ? '#D4AF37' : '#cbd5e1'}`, background: isDragOver ? '#fefce8' : '#f8fafc', textAlign: 'center', cursor: 'pointer', marginBottom: '1.25rem', transition: 'all 0.2s' }}
        >
          <i className="fas fa-cloud-arrow-up" style={{ fontSize: '2rem', color: isDragOver ? '#D4AF37' : '#94a3b8', marginBottom: '0.5rem', display: 'block' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
            Drag &amp; drop multiple images or videos here, or click to browse
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            PNG, JPG, WebP, GIF, MP4, MOV — batch uploads supported
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '0.4rem' }}>
              <span>Uploading Batch...</span>
              <span>{uploadProgress.done} of {uploadProgress.total}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#dbeafe', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        {/* Manual URL Adder */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <input
            value={newImage.url}
            onChange={(e) => setNewImage((p) => ({ ...p, url: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addImageManual()}
            placeholder="Or paste external media URL (https://...)"
            style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
          />
          <input
            value={newImage.caption}
            onChange={(e) => setNewImage((p) => ({ ...p, caption: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addImageManual()}
            placeholder="Optional Caption"
            style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }}
          />
          <button
            onClick={addImageManual}
            style={{ padding: '0 1.25rem', border: 0, borderRadius: '8px', background: '#0f766e', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
          >
            + Add
          </button>
        </div>

        {/* Gallery Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {gallery.map((item, index) => {
            const isVideo = /\.(mp4|mov|webm)$/i.test(item.url) || item.url.includes('/video/upload/');
            const isEditing = activeMediaIndex === index;
            return (
              <div
                key={`${item.url}-${index}`}
                draggable
                onDragStart={() => setDraggedItemIndex(index)}
                onDragOver={(e) => { e.preventDefault(); if (dragOverItemIndex !== index) setDragOverItemIndex(index); }}
                onDragLeave={() => setDragOverItemIndex(null)}
                onDrop={() => {
                  if (draggedItemIndex !== null) handleReorderGallery(draggedItemIndex, index);
                  setDraggedItemIndex(null);
                  setDragOverItemIndex(null);
                }}
                style={{
                  background: '#fff',
                  border: item.is_hero ? '2px solid #D4AF37' : dragOverItemIndex === index ? '2px dashed #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: item.is_hero ? '0 4px 16px rgba(212,175,55,0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                  opacity: draggedItemIndex === index ? 0.4 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Media Preview */}
                <div style={{ height: '160px', position: 'relative', background: '#0f172a' }}>
                  {isVideo ? (
                    <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={item.url} alt={item.caption || 'Media item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {item.is_hero && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#D4AF37', color: '#1a1000', fontSize: '0.62rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <i className="fas fa-crown" /> HERO COVER
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', fontSize: '0.75rem' }} title="Drag to reorder">
                    <i className="fas fa-grip-vertical" />
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {/* Caption */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Caption</label>
                    <input
                      value={item.caption}
                      onChange={(e) => updateGalleryItem(index, { caption: e.target.value })}
                      placeholder="Add slide caption..."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}
                    />
                  </div>

                  {/* Placement Selector */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>Placement:</label>
                    <select
                      value={item.placement || 'carousel'}
                      onChange={(e) => updateGalleryItem(index, { placement: e.target.value as GalleryItem['placement'] })}
                      style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}
                    >
                      <option value="carousel">Carousel Only</option>
                      <option value="body">Body Grid Only</option>
                      <option value="both">Both Places</option>
                    </select>
                  </div>

                  {/* Slide CTA Accordion */}
                  <button
                    type="button"
                    onClick={() => setActiveMediaIndex(isEditing ? null : index)}
                    style={{ background: isEditing ? '#fefce8' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', fontSize: '0.68rem', fontWeight: 800, color: isEditing ? '#a16207' : '#475569', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span><i className="fas fa-layer-group" style={{ marginRight: '4px' }} /> Slide Headline &amp; CTA</span>
                    <i className={`fas fa-chevron-${isEditing ? 'up' : 'down'}`} />
                  </button>

                  {isEditing && (
                    <div style={{ padding: '0.6rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <input
                        value={item.slide_data?.title || ''}
                        onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, title: e.target.value } })}
                        placeholder="Slide Title (e.g. Desert Suite)"
                        style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <input
                          value={item.slide_data?.cta_label || ''}
                          onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, cta_label: e.target.value } })}
                          placeholder="CTA Label (e.g. Book)"
                          style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                        />
                        <input
                          value={item.slide_data?.cta_url || ''}
                          onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, cta_url: e.target.value } })}
                          placeholder="CTA URL / Link"
                          style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                        />
                      </div>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.68rem', color: '#475569', fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={!!item.slide_data?.show_overlay}
                          onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, show_overlay: e.target.checked } })}
                        />
                        Show overlay on slide
                      </label>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => setHeroItem(index)}
                      style={{ border: 0, background: 'none', color: item.is_hero ? '#D4AF37' : '#94a3b8', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <i className="fas fa-star" /> {item.is_hero ? 'Primary Cover' : 'Make Cover'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(index)}
                      style={{ border: 0, background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', padding: '4px 8px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <i className="fas fa-trash" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {gallery.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            No media in this section yet. Drag files into the box above to get started.
          </div>
        )}
      </section>

      {/* Publication & Moderation Settings */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>Publication Status</h4>
          <select
            value={meta.galleryStatus}
            onChange={(e) => setMeta((p) => ({ ...p, galleryStatus: e.target.value as ContentMeta['galleryStatus'] }))}
            style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <option value="approved">Approved &amp; Live</option>
            <option value="draft">Draft Mode</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>Placement Switches</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {([
              ['galleryOnMinisite', 'Show in Business Minisite Carousel'],
              ['galleryOnMain', 'Promote to Main Website Carousel'],
            ] as const).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={!!meta[key]}
                  onChange={(e) => setMeta((p) => ({ ...p, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Rich Blog / Story Editor */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
          Section Story &amp; Interactive Blog
        </h3>
        <input
          value={blogTitle}
          onChange={(e) => setBlogTitle(e.target.value)}
          placeholder="Story title (English)"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '0.75rem', fontWeight: 700 }}
        />
        <RichBlogEditor
          value={blogBody}
          onChange={setBlogBody}
          minHeight="240px"
          businessName={businessName}
          sectionName={section?.name || sectionId}
          placeholder="Write the section story with photos, fonts, headings, and links..."
        />
        <input
          value={blogTitleAr}
          onChange={(e) => setBlogTitleAr(e.target.value)}
          placeholder="عنوان القصة بالعربية"
          dir="rtl"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', margin: '1rem 0 0.75rem', textAlign: 'right', fontWeight: 700 }}
        />
        <RichBlogEditor
          value={blogBodyAr}
          onChange={setBlogBodyAr}
          minHeight="240px"
          businessName={businessName}
          sectionName={section?.name || sectionId}
          dir="rtl"
          placeholder="اكتب قصة القسم باللغة العربية..."
        />
      </section>

      {/* Save Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        {displayMessage && (
          <span style={{ color: displayMessage.includes('⚠️') || displayMessage.includes('failed') ? '#b91c1c' : '#15803d', fontSize: '0.8rem', fontWeight: 800 }}>
            {displayMessage}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !sectionId}
          style={{
            padding: '0.8rem 1.75rem',
            border: 0,
            borderRadius: '10px',
            background: saving ? '#94a3b8' : 'linear-gradient(135deg, #D4AF37, #f59e0b)',
            color: '#1a1000',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(212,175,55,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`} />
          {saving ? 'Saving Content...' : 'Save All & Publish Live'}
        </button>
      </div>
    </div>
  );
}
