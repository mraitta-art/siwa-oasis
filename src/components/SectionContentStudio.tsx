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
  caption_ar?: string;
  is_hero?: boolean;
  in_carousel?: boolean;
  placement?: 'carousel' | 'body' | 'both';
  slide_data?: {
    title?: string;
    title_ar?: string;
    target_section_id?: string;
    cta_label?: string;
    cta_label_ar?: string;
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
        return {
          url: item,
          caption: '',
          caption_ar: '',
          is_hero: false,
          in_carousel: true,
          placement: 'carousel' as const,
        };
      }
      const rawSlide = item?.slide_data;
      const slideData =
        typeof rawSlide === 'string'
          ? (() => { try { return JSON.parse(rawSlide); } catch { return {}; } })()
          : rawSlide || {};

      const inCarousel = item?.in_carousel !== undefined
        ? !!item.in_carousel
        : (item?.placement !== 'body');

      return {
        id: item?.id || undefined,
        url: item?.url || '',
        caption: item?.caption || '',
        caption_ar: item?.caption_ar || '',
        is_hero: !!item?.is_hero,
        in_carousel: inCarousel,
        placement: item?.placement === 'body' || item?.placement === 'both' ? item.placement : ('carousel' as const),
        slide_data: slideData,
      };
    })
    .filter((item) => item.url);
}

const EMPTY_META: ContentMeta = {
  galleryStatus: 'approved',
  blogStatus: 'approved',
  galleryOnMain: false,
  galleryOnMinisite: true,
  blogOnMain: false,
  blogOnMinisite: true,
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

export interface SectionContentStudioProps {
  businessId: string;
  businessName: string;
  sectionId: string;
  sections: Array<{ id: string; name: string; icon?: string }>;
  customData: Record<string, any>;
  sectionControls?: Record<string, any>;
  onSave: (nextCustomData: Record<string, any>) => Promise<void>;
  saving?: boolean;
  message?: string;
}

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
  const [activeSubTab, setActiveSubTab] = useState<'gallery_carousel' | 'bilingual_blog'>('gallery_carousel');
  const [blogLangTab, setBlogLangTab] = useState<'en' | 'ar'>('en');

  const [sectionLabel, setSectionLabel] = useState('');
  const [sectionLabelAr, setSectionLabelAr] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [newImage, setNewImage] = useState({ url: '', caption: '', caption_ar: '' });
  
  const [blogTitle, setBlogTitle] = useState('');
  const [blogBody, setBlogBody] = useState('');
  const [blogTitleAr, setBlogTitleAr] = useState('');
  const [blogBodyAr, setBlogBodyAr] = useState('');
  
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [meta, setMeta] = useState<ContentMeta>(EMPTY_META);
  
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number } | string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeSlideConfigIndex, setActiveSlideConfigIndex] = useState<number | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [localMessage, setLocalMessage] = useState('');

  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const directCarouselInputRef = useRef<HTMLInputElement>(null);

  // ── Hydrate from customData whenever sectionId or customData changes ──
  useEffect(() => {
    const sData = customData?.[sectionId] || {};
    const storedMeta = customData?.section_content_meta?.[sectionId] || {};
    
    setLogoUrl(customData?.sec_1_identity?.business_logo || customData?.basic?.business_logo || customData?.business_logo || '');
    setPhone(customData?.basic?.phone || customData?.sec_1_identity?.phone || customData?.phone || '');
    setWhatsapp(customData?.basic?.whatsapp || customData?.sec_1_identity?.whatsapp || customData?.whatsapp || '');
    setWhatsappMsg(customData?.basic?.whatsapp_message || customData?.sec_1_identity?.whatsapp_message || customData?.whatsapp_message || '');
    
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
    setNewImage({ url: '', caption: '', caption_ar: '' });
    setActiveSlideConfigIndex(null);
    setLocalMessage('');
  }, [sectionId, customData]);

  // ── Logo Upload ───────────────────────────────────────────────────────
  async function uploadLogoFile(file: File) {
    setUploadProgress('Uploading brand logo from device...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessName', businessName || 'general');
      formData.append('sectionName', 'branding');

      const res = await fetch('/api/jana/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && (result.url || result.localUrl)) {
        const uploadedUrl = result.url || result.localUrl;
        setLogoUrl(uploadedUrl);
        setLocalMessage('✓ Logo uploaded successfully! Click "Save All" to apply.');
      } else {
        setLocalMessage(`⚠️ Logo upload failed: ${result.error || `HTTP ${res.status}`}`);
      }
    } catch (err: any) {
      setLocalMessage(`⚠️ Logo upload error: ${err?.message || 'Network error'}`);
    }
    setUploadProgress(null);
  }

  // ── Batch Upload into Master Gallery ───────────────────────────────────
  async function uploadMultipleFiles(files: FileList | File[], autoAddToCarousel: boolean = true) {
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
            caption_ar: '',
            in_carousel: autoAddToCarousel,
            placement: autoAddToCarousel ? 'carousel' : 'body',
            is_hero: gallery.length === 0 && newEntries.length === 0,
            slide_data: {
              title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              show_overlay: true
            }
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
      setLocalMessage(`✓ Uploaded ${newEntries.length} file(s) into the master section gallery.`);
    } else {
      setLocalMessage('⚠️ Upload failed. Please check file format and size.');
    }
    setUploadProgress(null);
  }

  function handleDropFiles(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) uploadMultipleFiles(e.dataTransfer.files, true);
  }

  async function handleGenerateAiStory() {
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/jana/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName || 'Siwa Oasis Entity',
          sectionName: sectionLabel || section?.name || sectionId,
          typology: customData?.type_name || 'Experience & Hospitality',
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.title) setBlogTitle(data.title);
        if (data.story) setBlogBody(data.story);
        if (data.title_ar) setBlogTitleAr(data.title_ar);
        if (data.story_ar) setBlogBodyAr(data.story_ar);
        setLocalMessage('✨ AI generated high-fidelity bilingual story (English & Arabic) successfully!');
      } else {
        alert(data.error || 'Failed to generate story');
      }
    } catch (err: any) {
      alert(err.message || 'AI generation error');
    } finally {
      setGeneratingAi(false);
    }
  }

  // ── Manual Media Adder ────────────────────────────────────────────────
  function addImageManual() {
    if (!newImage.url.trim()) return;
    setGallery((prev) => [
      ...prev,
      {
        url: newImage.url.trim(),
        caption: newImage.caption.trim(),
        caption_ar: newImage.caption_ar.trim(),
        in_carousel: true,
        placement: 'carousel',
        is_hero: prev.length === 0,
        slide_data: {
          title: newImage.caption.trim() || undefined,
          show_overlay: true
        }
      },
    ]);
    setNewImage({ url: '', caption: '', caption_ar: '' });
  }

  // ── Gallery & Carousel Item Mutators ──────────────────────────────────
  function updateGalleryItem(index: number, updates: Partial<GalleryItem>) {
    setGallery((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  function toggleCarouselStatus(index: number) {
    setGallery((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nextInCarousel = !item.in_carousel;
        return {
          ...item,
          in_carousel: nextInCarousel,
          placement: nextInCarousel ? 'carousel' : 'body',
        };
      })
    );
  }

  function setHeroItem(index: number) {
    setGallery((prev) => prev.map((item, i) => ({ ...item, is_hero: i === index })));
  }

  function removeGalleryItem(index: number) {
    setGallery((prev) => prev.filter((_, i) => i !== index));
    if (activeSlideConfigIndex === index) setActiveSlideConfigIndex(null);
  }

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= gallery.length || fromIndex === toIndex) return;
    setGallery((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  // ── Save Handler ───────────────────────────────────────────────────────
  async function handleSave() {
    const nextCustomData: Record<string, any> = { ...(customData || {}) };

    // Format section labels
    nextCustomData.section_labels = { ...(nextCustomData.section_labels || {}), [sectionId]: sectionLabel.trim() };
    nextCustomData.section_labels_ar = { ...(nextCustomData.section_labels_ar || {}), [sectionId]: sectionLabelAr.trim() };
    
    // Core Basic & Brand Identity Assets
    nextCustomData.basic = {
      ...(nextCustomData.basic || {}),
      business_logo: logoUrl || nextCustomData.basic?.business_logo,
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      whatsapp_message: whatsappMsg.trim(),
      section_labels: { ...(nextCustomData.basic?.section_labels || {}), [sectionId]: sectionLabel.trim() },
      section_labels_ar: { ...(nextCustomData.basic?.section_labels_ar || {}), [sectionId]: sectionLabelAr.trim() },
    };

    nextCustomData.sec_1_identity = {
      ...(nextCustomData.sec_1_identity || {}),
      business_logo: logoUrl,
      logo: logoUrl,
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      whatsapp_message: whatsappMsg.trim(),
    };

    // Ensure placement aligns with in_carousel
    const normalizedGallery = gallery.map((item) => ({
      ...item,
      placement: item.in_carousel ? (item.placement === 'body' ? 'carousel' : item.placement || 'carousel') : 'body'
    }));

    // Section Content
    nextCustomData[sectionId] = {
      ...(nextCustomData[sectionId] || {}),
      section_gallery: normalizedGallery,
      section_blog_title: blogTitle.trim(),
      section_blog: blogBody,
      section_blog_title_ar: blogTitleAr.trim(),
      section_blog_ar: blogBodyAr,
    };

    // Publication Meta
    nextCustomData.section_content_meta = {
      ...(nextCustomData.section_content_meta || {}),
      [sectionId]: meta,
    };

    try {
      await onSave(nextCustomData);
      setLocalMessage('✓ All media, carousel slides, captions, and bilingual stories saved successfully!');
    } catch (err: any) {
      setLocalMessage(`⚠️ Save error: ${err?.message || 'Failed to persist updates'}`);
    }
  }

  const adminLocked = !!sectionControls[sectionId]?.admin_locked_label;
  const displayMessage = externalMessage || localMessage;
  const activeCarouselSlides = gallery.filter((item) => item.in_carousel);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* ── 0. MINISITE READINESS & CAROUSEL POLICY DIAGNOSTIC ── */}
      <section style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#0f172a', color: '#D4AF37', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.5px' }}>
              ⚡ MINISITE &amp; CAROUSEL POLICY HEALTH
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>
              {section?.name || sectionId} Live Readiness
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Minisite rules automatically enforced
          </div>
        </div>

        {/* Diagnostic Badges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          
          {/* Logo Status */}
          <div style={{ background: logoUrl ? '#f0fdf4' : '#fffbeb', border: logoUrl ? '1px solid #86efac' : '1px solid #fcd34d', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className={`fas ${logoUrl ? 'fa-check-circle' : 'fa-triangle-exclamation'}`} style={{ color: logoUrl ? '#16a34a' : '#d97706', fontSize: '1.1rem' }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: logoUrl ? '#166534' : '#92400e' }}>
                {logoUrl ? 'Brand Logo Active' : 'Logo Not Uploaded'}
              </div>
              <div style={{ fontSize: '0.65rem', color: logoUrl ? '#15803d' : '#b45309' }}>
                {logoUrl ? 'Displays in navigation & hero' : 'Upload logo below for identity'}
              </div>
            </div>
          </div>

          {/* Carousel Presentation Status */}
          <div style={{ background: activeCarouselSlides.length >= 2 ? '#f0fdf4' : (activeCarouselSlides.length === 1 ? '#eff6ff' : '#fff1f2'), border: activeCarouselSlides.length >= 2 ? '1px solid #86efac' : (activeCarouselSlides.length === 1 ? '1px solid #93c5fd' : '1px solid #fecdd3'), borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className={`fas ${activeCarouselSlides.length >= 2 ? 'fa-film' : (activeCarouselSlides.length === 1 ? 'fa-info-circle' : 'fa-circle-xmark')}`} style={{ color: activeCarouselSlides.length >= 2 ? '#16a34a' : (activeCarouselSlides.length === 1 ? '#2563eb' : '#e11d48'), fontSize: '1.1rem' }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: activeCarouselSlides.length >= 2 ? '#166534' : (activeCarouselSlides.length === 1 ? '#1e40af' : '#9f1239') }}>
                {activeCarouselSlides.length >= 2 ? `${activeCarouselSlides.length} Carousel Slides Active` : (activeCarouselSlides.length === 1 ? '1 Slide in Carousel' : 'Carousel Empty (0 Slides)')}
              </div>
              <div style={{ fontSize: '0.65rem', color: activeCarouselSlides.length >= 2 ? '#15803d' : (activeCarouselSlides.length === 1 ? '#1d4ed8' : '#be123c') }}>
                {activeCarouselSlides.length >= 2 ? 'Slides will animate automatically' : (activeCarouselSlides.length === 1 ? 'Add 1+ more photo for slider' : 'Upload photos and click "+ Add to Carousel"')}
              </div>
            </div>
          </div>

          {/* Bilingual Narrative Status */}
          <div style={{ background: (blogBody && blogBodyAr) ? '#f0fdf4' : (blogBody || blogBodyAr ? '#eff6ff' : '#faf5ff'), border: (blogBody && blogBodyAr) ? '1px solid #86efac' : '1px solid #e9d5ff', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-feather-pointed" style={{ color: (blogBody && blogBodyAr) ? '#16a34a' : '#7e22ce', fontSize: '1.1rem' }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: (blogBody && blogBodyAr) ? '#166534' : '#6b21a8' }}>
                {(blogBody && blogBodyAr) ? 'Bilingual Story Complete' : (blogBody ? 'English Story Active (Arabic empty)' : 'No Story Written Yet')}
              </div>
              <div style={{ fontSize: '0.65rem', color: (blogBody && blogBodyAr) ? '#15803d' : '#7e22ce' }}>
                {(blogBody && blogBodyAr) ? 'Published for EN & AR explorers' : 'Use "✨ Generate with AI" button below'}
              </div>
            </div>
          </div>

        </div>

        {/* Collapsible Policy Requirements */}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div><i className="fas fa-check" style={{ color: '#16a34a', marginRight: '4px' }} /> Landscape images (16:9) recommended for Hero Carousel</div>
          <div><i className="fas fa-check" style={{ color: '#16a34a', marginRight: '4px' }} /> Square logo (1:1) recommended for Brand Logo</div>
          <div><i className="fas fa-check" style={{ color: '#16a34a', marginRight: '4px' }} /> Max 10MB per image, 50MB per video</div>
        </div>
      </section>

      {/* ── 1. BRAND IDENTITY & CONTACT BAR ── */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-shield-cat" style={{ color: '#D4AF37', fontSize: '1.1rem' }} />
              Brand Logo &amp; Direct Contact Controls
            </h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>
              Upload your official device logo and configure the fixed Phone &amp; WhatsApp direct chatting buttons.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Brand Logo"
                style={{ height: '42px', width: '42px', objectFit: 'cover', borderRadius: '10px', border: '1.5px solid #D4AF37', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              />
            )}
            <button
              type="button"
              onClick={() => logoFileInputRef.current?.click()}
              disabled={typeof uploadProgress === 'string'}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#fff',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <i className="fas fa-upload" /> {typeof uploadProgress === 'string' ? 'Uploading...' : (logoUrl ? 'Change Logo' : 'Upload Logo from Device')}
            </button>
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  uploadLogoFile(e.target.files[0]);
                }
              }}
            />
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 800 }}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Contact Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
              DIRECT CALL PHONE
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 100 123 4567"
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#15803d', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
              WHATSAPP NUMBER
            </label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+20 100 123 4567"
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #86efac', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: '#f0fdf4', color: '#14532d', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
              PRE-FILLED WHATSAPP MESSAGE (OPTIONAL)
            </label>
            <input
              value={whatsappMsg}
              onChange={(e) => setWhatsappMsg(e.target.value)}
              placeholder="e.g. Hello! I am interested in your offers and packages on SiWiFy."
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Section Names (EN/AR) */}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: '#64748b', marginBottom: '0.25rem' }}>
              SECTION TAB NAME (ENGLISH)
            </label>
            <input
              value={sectionLabel}
              onChange={(e) => setSectionLabel(e.target.value)}
              placeholder={`English Label (${section?.name || 'Default'})`}
              disabled={adminLocked}
              style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, boxSizing: 'border-box', background: adminLocked ? '#f8fafc' : '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: '#64748b', marginBottom: '0.25rem', textAlign: 'right' }}>
              اسم القسم (بالعربية)
            </label>
            <input
              value={sectionLabelAr}
              onChange={(e) => setSectionLabelAr(e.target.value)}
              placeholder="اسم القسم بالعربية"
              dir="rtl"
              disabled={adminLocked}
              style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, boxSizing: 'border-box', textAlign: 'right', background: adminLocked ? '#f8fafc' : '#fff' }}
            />
          </div>
        </div>
      </section>

      {/* ── STUDIO SUB-TABS (Gallery & Carousel VS Bilingual Story) ── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('gallery_carousel')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: activeSubTab === 'gallery_carousel' ? '#fff' : 'transparent',
            borderBottom: activeSubTab === 'gallery_carousel' ? '3px solid #D4AF37' : '3px solid transparent',
            color: activeSubTab === 'gallery_carousel' ? '#0f172a' : '#64748b',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <i className="fas fa-images" style={{ color: '#D4AF37' }} />
          Section Media Gallery &amp; Carousel Slider
          <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 7px', borderRadius: '12px', color: '#475569' }}>
            {activeCarouselSlides.length} in Carousel / {gallery.length} total
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bilingual_blog')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: activeSubTab === 'bilingual_blog' ? '#fff' : 'transparent',
            borderBottom: activeSubTab === 'bilingual_blog' ? '3px solid #D4AF37' : '3px solid transparent',
            color: activeSubTab === 'bilingual_blog' ? '#0f172a' : '#64748b',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <i className="fas fa-feather-pointed" style={{ color: '#6366f1' }} />
          Section Interactive Story &amp; Mini-Blog
          <span style={{ fontSize: '0.65rem', background: '#eff6ff', padding: '2px 7px', borderRadius: '12px', color: '#2563eb' }}>
            EN 🇬🇧 &amp; AR 🇪🇬
          </span>
        </button>
      </div>

      {/* ── 2. MEDIA GALLERY & CAROUSEL VIEW ── */}
      {activeSubTab === 'gallery_carousel' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>

          {/* Master Media Upload Bar */}
          <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                  Section Media Repository
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                  Upload photos/videos with individual captions. Then choose which ones appear on the section carousel slider.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={!!uploadProgress}
                  style={{ padding: '0.6rem 1.1rem', background: '#D4AF37', color: '#1a1000', border: 0, borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: uploadProgress ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(212,175,55,0.3)' }}
                >
                  <i className="fas fa-cloud-arrow-up" /> {uploadProgress ? 'Uploading...' : 'Batch Upload from Device'}
                </button>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && uploadMultipleFiles(e.target.files, true)}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDropFiles}
              onClick={() => galleryFileInputRef.current?.click()}
              style={{
                padding: '1.75rem 1.5rem',
                borderRadius: '14px',
                border: `2px dashed ${isDragOver ? '#D4AF37' : '#cbd5e1'}`,
                background: isDragOver ? '#fefce8' : '#f8fafc',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '1rem',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-images" style={{ fontSize: '2rem', color: isDragOver ? '#D4AF37' : '#94a3b8', marginBottom: '0.5rem', display: 'block' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                Drag &amp; drop images or videos here, or click to browse files
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Supports PNG, JPG, WebP, GIF, MP4, MOV. Images will be stored in this section's media library.
              </div>
            </div>

            {/* Upload Progress Indicator */}
            {uploadProgress && (
              <div style={{ padding: '0.9rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', marginBottom: '1rem' }}>
                {typeof uploadProgress === 'string' ? (
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }} />
                    {uploadProgress}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '0.35rem' }}>
                      <span>Uploading Media Batch...</span>
                      <span>{uploadProgress.done} of {uploadProgress.total}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#dbeafe', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s' }} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Manual URL Adder */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: '0.5rem' }}>
              <input
                value={newImage.url}
                onChange={(e) => setNewImage((p) => ({ ...p, url: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addImageManual()}
                placeholder="Or paste external media URL (https://...)"
                style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem' }}
              />
              <input
                value={newImage.caption}
                onChange={(e) => setNewImage((p) => ({ ...p, caption: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addImageManual()}
                placeholder="English Caption"
                style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem' }}
              />
              <input
                value={newImage.caption_ar}
                onChange={(e) => setNewImage((p) => ({ ...p, caption_ar: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addImageManual()}
                placeholder="الوصف بالعربية"
                dir="rtl"
                style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem', textAlign: 'right' }}
              />
              <button
                type="button"
                onClick={addImageManual}
                style={{ padding: '0 1.25rem', border: 0, borderRadius: '8px', background: '#0f766e', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                + Add Media
              </button>
            </div>
          </section>

          {/* ── ACTIVE CAROUSEL SLIDER CONTROLS & REORDERING ── */}
          <section style={{ background: '#fff', border: '1.5px solid #D4AF37', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(212,175,55,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '3px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, marginBottom: '0.35rem' }}>
                  <i className="fas fa-sliders" /> LIVE CAROUSEL SEQUENCER
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                  Active Section Carousel Slides ({activeCarouselSlides.length})
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                  Reorder slides anytime with ⬆️/⬇️ buttons or drag &amp; drop. Link slides directly to blogs or other section pages!
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => directCarouselInputRef.current?.click()}
                  style={{
                    padding: '0.5rem 0.9rem',
                    background: '#1e293b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <i className="fas fa-plus-circle" /> Add Direct to Carousel
                </button>
                <input
                  ref={directCarouselInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && uploadMultipleFiles(e.target.files, true)}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Active Carousel Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
              {gallery.map((item, index) => {
                if (!item.in_carousel) return null;
                const isVideo = /\.(mp4|mov|webm)$/i.test(item.url) || item.url.includes('/video/upload/');
                const isConfiguring = activeSlideConfigIndex === index;

                return (
                  <div
                    key={`${item.url}-${index}`}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => { e.preventDefault(); if (dragOverIndex !== index) setDragOverIndex(index); }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={() => {
                      if (draggedIndex !== null) moveItem(draggedIndex, index);
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    style={{
                      background: '#fff',
                      border: item.is_hero ? '2px solid #D4AF37' : dragOverIndex === index ? '2px dashed #2563eb' : '1px solid #cbd5e1',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: item.is_hero ? '0 4px 16px rgba(212,175,55,0.18)' : '0 2px 8px rgba(0,0,0,0.03)',
                      opacity: draggedIndex === index ? 0.35 : 1,
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Slide Preview Header */}
                    <div style={{ height: '160px', position: 'relative', background: '#090e17' }}>
                      {isVideo ? (
                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      ) : (
                        <img src={item.url} alt={item.caption || 'Slide'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}

                      {/* Cover Badge */}
                      {item.is_hero && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: '#D4AF37', color: '#1a1000', fontSize: '0.62rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                          <i className="fas fa-crown" /> HERO COVER
                        </div>
                      )}

                      {/* Reorder Arrows */}
                      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.65)', borderRadius: '6px', padding: '2px', backdropFilter: 'blur(4px)' }}>
                        <button
                          type="button"
                          onClick={() => moveItem(index, index - 1)}
                          disabled={index === 0}
                          style={{ border: 'none', background: 'transparent', color: index === 0 ? '#64748b' : '#fff', cursor: index === 0 ? 'default' : 'pointer', padding: '2px 5px', fontSize: '0.75rem' }}
                          title="Move Left / Earlier"
                        >
                          <i className="fas fa-arrow-left" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, index + 1)}
                          disabled={index === gallery.length - 1}
                          style={{ border: 'none', background: 'transparent', color: index === gallery.length - 1 ? '#64748b' : '#fff', cursor: index === gallery.length - 1 ? 'default' : 'pointer', padding: '2px 5px', fontSize: '0.75rem' }}
                          title="Move Right / Later"
                        >
                          <i className="fas fa-arrow-right" />
                        </button>
                      </div>
                    </div>

                    {/* Slide Body */}
                    <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      
                      {/* Bilingual Captions */}
                      <div>
                        <input
                          value={item.caption}
                          onChange={(e) => updateGalleryItem(index, { caption: e.target.value })}
                          placeholder="English Slide Caption..."
                          style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}
                        />
                        <input
                          value={item.caption_ar || ''}
                          onChange={(e) => updateGalleryItem(index, { caption_ar: e.target.value })}
                          placeholder="وصف الشريحة بالعربية..."
                          dir="rtl"
                          style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'right' }}
                        />
                      </div>

                      {/* Slide-to-Blog & Section Link Connector Accordion */}
                      <button
                        type="button"
                        onClick={() => setActiveSlideConfigIndex(isConfiguring ? null : index)}
                        style={{
                          background: isConfiguring ? '#fefce8' : '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '5px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: isConfiguring ? '#a16207' : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>
                          <i className="fas fa-link" style={{ marginRight: '4px', color: '#D4AF37' }} />
                          Connect to Page / Blog &amp; CTA
                        </span>
                        <i className={`fas fa-chevron-${isConfiguring ? 'up' : 'down'}`} />
                      </button>

                      {isConfiguring && (
                        <div style={{ padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          
                          {/* Target Section / Page Selector */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: '#475569', marginBottom: '2px' }}>
                              TARGET PAGE / SECTION TO OPEN ON CLICK
                            </label>
                            <select
                              value={item.slide_data?.target_section_id || ''}
                              onChange={(e) => updateGalleryItem(index, {
                                slide_data: {
                                  ...item.slide_data,
                                  target_section_id: e.target.value,
                                  cta_url: e.target.value ? `#${e.target.value}` : item.slide_data?.cta_url
                                }
                              })}
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                            >
                              <option value="">No linked section (Standalone slide)</option>
                              {sections.map((s) => (
                                <option key={s.id} value={s.id}>
                                  Open Chapter: {customData?.basic?.section_labels?.[s.id] || s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Slide Title */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <input
                              value={item.slide_data?.title || ''}
                              onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, title: e.target.value } })}
                              placeholder="Slide Headline (EN)"
                              style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                            />
                            <input
                              value={item.slide_data?.title_ar || ''}
                              onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, title_ar: e.target.value } })}
                              placeholder="عنوان الشريحة (عربي)"
                              dir="rtl"
                              style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem', textAlign: 'right' }}
                            />
                          </div>

                          {/* CTA Label & URL */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <input
                              value={item.slide_data?.cta_label || ''}
                              onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, cta_label: e.target.value } })}
                              placeholder="CTA Button (e.g. Read Story)"
                              style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                            />
                            <input
                              value={item.slide_data?.cta_url || ''}
                              onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, cta_url: e.target.value } })}
                              placeholder="CTA URL (e.g. #story or https://)"
                              style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                            />
                          </div>

                          <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.68rem', color: '#475569', fontWeight: 700 }}>
                            <input
                              type="checkbox"
                              checked={item.slide_data?.show_overlay !== false}
                              onChange={(e) => updateGalleryItem(index, { slide_data: { ...item.slide_data, show_overlay: e.target.checked } })}
                            />
                            Show dark overlay &amp; text on slide
                          </label>
                        </div>
                      )}

                      {/* Card Action Controls */}
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
                          onClick={() => toggleCarouselStatus(index)}
                          style={{ border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', borderRadius: '6px', padding: '3px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                          title="Remove from Carousel but keep in Gallery"
                        >
                          <i className="fas fa-eye-slash" /> Remove from Carousel
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {activeCarouselSlides.length === 0 && (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No active slides in the carousel. Activate images from the Master Gallery below or click "Add Direct to Carousel".
              </div>
            )}
          </section>

          {/* ── ALL MASTER GALLERY ITEMS (LIBRARY VIEW) ── */}
          <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
              All Uploaded Media Library ({gallery.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {gallery.map((item, index) => {
                const isVideo = /\.(mp4|mov|webm)$/i.test(item.url) || item.url.includes('/video/upload/');
                return (
                  <div key={`${item.url}-lib-${index}`} style={{ border: item.in_carousel ? '1.5px solid #D4AF37' : '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '110px', background: '#000', position: 'relative' }}>
                      {isVideo ? (
                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      ) : (
                        <img src={item.url} alt={item.caption || 'Media'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      {item.in_carousel && (
                        <span style={{ position: 'absolute', top: 6, left: 6, background: '#16a34a', color: '#fff', fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                          ✓ IN CAROUSEL
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.caption || 'Untitled Media'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => toggleCarouselStatus(index)}
                          style={{
                            border: 'none',
                            background: item.in_carousel ? '#fee2e2' : '#dcfce7',
                            color: item.in_carousel ? '#b91c1c' : '#15803d',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {item.in_carousel ? 'Hide from Carousel' : '+ Add to Carousel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGalleryItem(index)}
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                          title="Delete from Library"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      )}

      {/* ── 3. BILINGUAL INTERACTIVE STORY & MINI-BLOG VIEW ── */}
      {activeSubTab === 'bilingual_blog' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                Section Narrative Story &amp; Mini-Blog
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                Write rich stories with photos, quotes, and dynamic variables (e.g. <code>{'{{phone}}'}</code>, <code>{'{{price}}'}</code>). Fully optimized for English and Arabic.
              </p>
            </div>

            {/* Language Switcher & AI Generator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleGenerateAiStory}
                disabled={generatingAi}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  cursor: generatingAi ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(99,102,241,0.25)'
                }}
              >
                <i className={generatingAi ? "fas fa-spinner fa-spin" : "fas fa-wand-magic-sparkles"} />
                {generatingAi ? 'Generating Story with AI...' : '✨ Generate Bilingual Story with AI'}
              </button>

              <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setBlogLangTab('en')}
                  style={{
                    border: 'none',
                    background: blogLangTab === 'en' ? '#1e293b' : 'transparent',
                    color: blogLangTab === 'en' ? '#fff' : '#64748b',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  🇬🇧 English Story
                </button>
                <button
                  type="button"
                  onClick={() => setBlogLangTab('ar')}
                  style={{
                    border: 'none',
                    background: blogLangTab === 'ar' ? '#D4AF37' : 'transparent',
                    color: blogLangTab === 'ar' ? '#1a1000' : '#64748b',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  🇪🇬 القصة بالعربية
                </button>
              </div>
            </div>
          </div>

          {/* English Story Editor */}
          {blogLangTab === 'en' && (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                  STORY HEADLINE (ENGLISH)
                </label>
                <input
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  placeholder="e.g. The Timeless Magic of Siwa's Salt Lakes & Springs"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                  STORY CONTENT &amp; MEDIA (ENGLISH)
                </label>
                <RichBlogEditor
                  value={blogBody}
                  onChange={setBlogBody}
                  minHeight="320px"
                  businessName={businessName}
                  sectionName={section?.name || sectionId}
                  dir="ltr"
                  placeholder="Write the English story. Use the 'Insert Photo/Video' button to place media directly into your narrative..."
                />
              </div>
            </div>
          )}

          {/* Arabic Story Editor */}
          {blogLangTab === 'ar' && (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem', textAlign: 'right' }}>
                  عنوان القصة (باللغة العربية)
                </label>
                <input
                  value={blogTitleAr}
                  onChange={(e) => setBlogTitleAr(e.target.value)}
                  placeholder="مثال: سحر بحيرات الملح وعيون الماء الطبيعية في سيوة"
                  dir="rtl"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', textAlign: 'right' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem', textAlign: 'right' }}>
                  محتوى القصة والصور (باللغة العربية)
                </label>
                <RichBlogEditor
                  value={blogBodyAr}
                  onChange={setBlogBodyAr}
                  minHeight="320px"
                  businessName={businessName}
                  sectionName={section?.name || sectionId}
                  dir="rtl"
                  placeholder="اكتب القصة باللغة العربية مع إمكانية إدراج الصور ومقاطع الفيديو مباشرة في النص..."
                />
              </div>
            </div>
          )}

          {/* Publication & Moderation Settings */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                PUBLICATION STATUS
              </label>
              <select
                value={meta.galleryStatus}
                onChange={(e) => setMeta((p) => ({ ...p, galleryStatus: e.target.value as ContentMeta['galleryStatus'] }))}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <option value="approved">Approved &amp; Live Publicly</option>
                <option value="draft">Draft Mode (Hidden from public)</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#475569', marginBottom: '0.3rem' }}>
                MINISITE SHOWCASE
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: '#334155', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={meta.blogOnMinisite !== false}
                    onChange={(e) => setMeta((p) => ({ ...p, blogOnMinisite: e.target.checked }))}
                  />
                  Show Mini-Blog Story on Minisite Section Page
                </label>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: '#334155', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={meta.galleryOnMinisite !== false}
                    onChange={(e) => setMeta((p) => ({ ...p, galleryOnMinisite: e.target.checked }))}
                  />
                  Show Section Carousel Slider on Minisite
                </label>
              </div>
            </div>
          </div>

        </section>
      )}

      {/* ── SAVE ACTION BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <div style={{ flex: 1 }}>
          {displayMessage && (
            <span style={{ color: displayMessage.includes('⚠️') || displayMessage.includes('failed') ? '#b91c1c' : '#15803d', fontSize: '0.82rem', fontWeight: 800 }}>
              {displayMessage}
            </span>
          )}
        </div>
        <button
          type="button"
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
          {saving ? 'Saving...' : 'Save All Changes & Publish Live'}
        </button>
      </div>

    </div>
  );
}
