'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import RichBlogEditor from '@/components/RichBlogEditor';
import DynamicForm from '@/components/DynamicForm';
import { useLang } from '@/context/LangContext';

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

type ContentMeta = {
  galleryStatus?: 'draft' | 'approved' | 'suspended';
  blogStatus?: 'draft' | 'approved' | 'suspended';
  galleryOnMain?: boolean;
  galleryOnMinisite?: boolean;
  blogOnMain?: boolean;
  blogOnMinisite?: boolean;
};

const EMPTY_META: ContentMeta = {
  galleryStatus: 'draft', blogStatus: 'draft',
  galleryOnMain: false, galleryOnMinisite: true,
  blogOnMain: false, blogOnMinisite: true,
};

function parseGallery(value: unknown): GalleryItem[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === 'string') {
      return { url: item, caption: '', is_hero: false, placement: 'carousel' as const };
    }
    const rawSlide = item?.slide_data;
    const slideData = typeof rawSlide === 'string' ? (() => { try { return JSON.parse(rawSlide); } catch { return {}; } })() : (rawSlide || {});
    return {
      id: item?.id || undefined,
      url: item?.url || '',
      caption: item?.caption || '',
      is_hero: !!item?.is_hero,
      placement: (item?.placement === 'body' || item?.placement === 'both') ? item.placement : 'carousel',
      slide_data: slideData
    };
  }).filter(item => item.url);
}

export default function ContentManagementPage() {
  const { isRTL } = useLang();
  const copy = isRTL ? {
    eyebrow: 'استوديو الوسائط وإدارة المحتوى',
    title: 'إدارة محتوى الأقسام والوسائط المتعددة',
    description: 'رفع متعدد للصور والفيديو، تعديل العناوين ونصوص الشرائح، التحكم في ترتيب وأماكن النشر.',
    setup: 'إعداد الصلاحيات',
    schema: 'مخطط الأقسام',
    findBusiness: 'البحث عن نشاط تجاري...',
    selectBusiness: 'اختر نشاطاً تجارياً لإدارة محتواه وألبوماته.',
    contentMedia: 'المحتوى والوسائط',
    fields: 'الحقول',
    components: 'المكونات',
    sectionName: 'اسم قسم الموقع المصغر',
    mediaGallery: 'ألبوم الوسائط المتعددة للقسم',
    uploadZone: 'اسحب وأفلت الصور والفيديوهات هنا أو انقر للاختيار المتعدد',
    upload: 'رفع ملفات متعددة',
    takePhoto: 'التقاط صورة',
    uploading: 'جاري الرفع...',
    save: 'حفظ المحتوى والنشر للجميع',
    story: 'قصة القسم / مدونة تفاعلية'
  } : {
    eyebrow: 'MEDIA STUDIO & CONTENT OPS',
    title: 'Business Content & Media Management',
    description: 'Bulk multi-upload for images & videos, inline slide overlay editor, placement & live reordering.',
    setup: 'Setup authority',
    schema: 'Section schema',
    findBusiness: 'Find business...',
    selectBusiness: 'Select a business to manage its media and section content.',
    contentMedia: 'Content & Media Studio',
    fields: 'Fields',
    components: 'Components',
    sectionName: 'MINISITE SECTION NAME',
    mediaGallery: 'Section Multi-Media Album & Carousel',
    uploadZone: 'Drag & drop multiple images or videos here, or click to browse',
    upload: 'Batch Upload Files',
    takePhoto: 'Take Photo',
    uploading: 'Uploading Batch...',
    save: 'Save All & Publish Live',
    story: 'Section Story & Interactive Blog'
  };

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [sectionControls, setSectionControls] = useState<Record<string, any>>({});
  const [sectionLabel, setSectionLabel] = useState('');
  const [sectionLabelAr, setSectionLabelAr] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [newImage, setNewImage] = useState({ url: '', caption: '' });
  const [blogTitle, setBlogTitle] = useState('');
  const [blogBody, setBlogBody] = useState('');
  const [blogTitleAr, setBlogTitleAr] = useState('');
  const [blogBodyAr, setBlogBodyAr] = useState('');
  const [meta, setMeta] = useState<ContentMeta>(EMPTY_META);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'fields' | 'components'>('content');
  const [fields, setFields] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/jana/businesses')
      .then(response => response.json())
      .then(data => setBusinesses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!businessId) {
      setBusiness(null); setSections([]); setSectionId(''); return;
    }
    const nextBusiness = businesses.find(item => item.id === businessId);
    setBusiness(nextBusiness || null);
    if (!nextBusiness) return;
    Promise.all([
      fetch(`/api/jana/sections?type=${nextBusiness.type_id}`).then(response => response.json()),
      fetch(`/api/jana/businesses?id=${businessId}`).then(response => response.json()),
      fetch(`/api/admin/businesses/${businessId}/section-controls`).then(response => response.json()),
    ]).then(([sectionData, fullBusiness, controlData]) => {
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setBusiness(fullBusiness);
      const controls: Record<string, any> = {};
      (controlData?.controls || []).forEach((control: any) => { controls[control.section_id] = control; });
      setSectionControls(controls);
      const first = (Array.isArray(sectionData) ? sectionData : [])[0];
      setSectionId(current => current || first?.id || '');
    });
  }, [businessId, businesses]);

  useEffect(() => {
    const data = business?.custom_data?.[sectionId] || {};
    const storedMeta = business?.custom_data?.section_content_meta?.[sectionId] || {};
    setSectionLabel(business?.custom_data?.section_labels?.[sectionId] || '');
    setSectionLabelAr(business?.custom_data?.section_labels_ar?.[sectionId] || business?.custom_data?.basic?.section_labels_ar?.[sectionId] || '');
    setGallery(parseGallery(data.section_gallery));
    setBlogTitle(data.section_blog_title || '');
    setBlogBody(data.section_blog || data.mini_blog || '');
    setBlogTitleAr(data.section_blog_title_ar || '');
    setBlogBodyAr(data.section_blog_ar || '');
    setMeta({ ...EMPTY_META, ...storedMeta });
    setNewImage({ url: '', caption: '' });
    setActiveTab('content');
    setActiveMediaIndex(null);
  }, [business, sectionId]);

  useEffect(() => {
    if (!business || !sectionId) {
      setFields([]); setComponents([]); return;
    }
    Promise.all([
      fetch(`/api/jana/forms?business=${encodeURIComponent(business.id)}&section=${encodeURIComponent(sectionId)}`).then(response => response.ok ? response.json() : []),
      fetch(`/api/admin/sections/${encodeURIComponent(sectionId)}/components`).then(response => response.ok ? response.json() : []),
    ]).then(([fieldData, componentData]) => {
      setFields(Array.isArray(fieldData) ? fieldData : []);
      setComponents(Array.isArray(componentData) ? componentData : []);
    }).catch(() => { setFields([]); setComponents([]); });
  }, [business, sectionId]);

  const visibleBusinesses = useMemo(() => businesses.filter(item =>
    `${item.name || ''} ${item.vendor_name || ''} ${item.type_name || ''}`.toLowerCase().includes(filter.toLowerCase())
  ), [businesses, filter]);
  const section = sections.find(item => item.id === sectionId);

  function updateMeta(key: keyof ContentMeta, value: boolean | string) {
    setMeta(current => ({ ...current, [key]: value }));
  }

  function handleFieldChange(sectionKey: string, fieldName: string, value: any) {
    setBusiness((current: any) => ({
      ...current,
      custom_data: {
        ...(current?.custom_data || {}),
        [sectionKey]: { ...(current?.custom_data?.[sectionKey] || {}), [fieldName]: value },
      },
    }));
  }

  function addImageManual() {
    if (!newImage.url.trim()) return;
    setGallery(current => [...current, { 
      url: newImage.url.trim(), 
      caption: newImage.caption.trim(),
      placement: 'carousel',
      is_hero: current.length === 0
    }]);
    setNewImage({ url: '', caption: '' });
  }

  async function uploadMultipleFiles(files: FileList | File[]) {
    if (!files || files.length === 0 || !business || !sectionId) return;

    const fileArray = Array.from(files);
    setUploadProgress({ total: fileArray.length, done: 0 });

    const newEntries: GalleryItem[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessName', business.name || 'General');
      formData.append('sectionName', section?.name || sectionId);

      try {
        const response = await fetch('/api/jana/media/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (response.ok && (result.url || result.localUrl)) {
          const uploadedUrl = result.url || result.localUrl;
          newEntries.push({
            url: uploadedUrl,
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            placement: 'carousel',
            is_hero: gallery.length === 0 && newEntries.length === 0
          });
        }
      } catch (err) {
        console.error('Upload error on file', file.name, err);
      } finally {
        setUploadProgress({ total: fileArray.length, done: i + 1 });
      }
    }

    if (newEntries.length > 0) {
      setGallery(current => [...current, ...newEntries]);
      setMessage(`Successfully uploaded ${newEntries.length} media file(s).`);
    } else {
      setMessage('Media upload failed. Please check file format and sizes.');
    }

    setUploadProgress(null);
  }

  function handleDropFiles(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadMultipleFiles(e.dataTransfer.files);
    }
  }

  function handleReorderGallery(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setGallery(prev => {
      const next = [...prev];
      const [movedItem] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedItem);
      return next;
    });
  }

  function updateGalleryItem(index: number, updates: Partial<GalleryItem>) {
    setGallery(current => current.map((item, i) => i === index ? { ...item, ...updates } : item));
  }

  function setHeroItem(index: number) {
    setGallery(current => current.map((item, i) => ({
      ...item,
      is_hero: i === index
    })));
  }

  async function saveContent() {
    if (!business || !sectionId) return;
    setSaving(true); setMessage('');
    const customData = { ...(business.custom_data || {}) };
    customData.section_labels = {
      ...(customData.section_labels || {}),
      [sectionId]: sectionLabel.trim(),
    };
    customData.section_labels_ar = {
      ...(customData.section_labels_ar || {}),
      [sectionId]: sectionLabelAr.trim(),
    };
    customData[sectionId] = {
      ...(customData[sectionId] || {}),
      section_gallery: gallery,
      section_blog_title: blogTitle,
      section_blog: blogBody,
      section_blog_title_ar: blogTitleAr,
      section_blog_ar: blogBodyAr,
    };
    customData.section_content_meta = {
      ...(customData.section_content_meta || {}),
      [sectionId]: meta,
    };
    try {
      const response = await fetch('/api/jana/businesses', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, custom_data: customData }),
      });
      if (!response.ok) throw new Error('Save failed');
      setBusiness((current: any) => ({ ...current, custom_data: customData }));
      setMessage('All media, placements, captions, and blog stories saved successfully!');
    } catch (error: any) {
      setMessage(error.message || 'Save failed');
    } finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: '3rem', color: '#64748b' }}>Loading content workspace...</div>;

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', textAlign: isRTL ? 'right' : 'left' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ color: '#D4AF37', fontSize: '0.68rem', fontWeight: 900, letterSpacing: isRTL ? 0 : '1.5px' }}>{copy.eyebrow}</div>
          <h1 style={{ margin: '0.35rem 0', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{copy.title}</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{copy.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link href="/jana/setup" style={{ padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '9px', color: '#475569', textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>{copy.setup}</Link>
          <Link href="/jana/sections" style={{ padding: '0.65rem 0.9rem', background: '#0f172a', borderRadius: '9px', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>{copy.schema}</Link>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left Businesses Sidebar */}
        <aside style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <input value={filter} onChange={event => setFilter(event.target.value)} placeholder={copy.findBusiness} style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', background: '#fff', direction: isRTL ? 'rtl' : 'ltr' }} />
          </div>
          <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {visibleBusinesses.map(item => (
              <button key={item.id} onClick={() => setBusinessId(item.id)} style={{ display: 'block', width: '100%', textAlign: isRTL ? 'right' : 'left', padding: '0.9rem 1rem', border: 0, borderBottom: '1px solid #f1f5f9', background: item.id === businessId ? '#fffbeb' : '#fff', cursor: 'pointer', transition: 'background 0.15s' }}>
                <strong style={{ display: 'block', color: item.id === businessId ? '#a16207' : '#1e293b', fontSize: '0.84rem' }}>{item.name}</strong>
                <span style={{ display: 'block', marginTop: '0.2rem', color: '#64748b', fontSize: '0.7rem' }}>{item.type_name || 'Unclassified'} · {item.vendor_name || item.vendor_email || 'No vendor'}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Content Workspace */}
        <div style={{ minWidth: 0 }}>
          {!business ? (
            <div style={{ background: '#fff', border: '1.5px dashed #cbd5e1', borderRadius: '16px', padding: '6rem 2rem', textAlign: 'center', color: '#64748b' }}>
              <i className="fas fa-store" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }} />
              {copy.selectBusiness}
            </div>
          ) : (
            <>
              {/* Header Selector bar */}
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{business.name}</h2>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>{business.type_name} · Tier: <strong style={{ color: '#D4AF37' }}>{business.subscription_tier || 'free'}</strong></span>
                </div>
                <Link href={`/${business.slug || business.id}`} target="_blank" style={{ padding: '0.55rem 0.9rem', border: '1.5px solid #D4AF37', borderRadius: '8px', color: '#a16207', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 900, background: '#fffdf5', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <i className="fas fa-external-link-alt" /> View Live Minisite
                </Link>
                <select value={sectionId} onChange={event => setSectionId(event.target.value)} style={{ minWidth: '240px', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem' }}>
                  {sections.map(item => <option key={item.id} value={item.id}>{item.name}{item.is_universal ? ' · Universal' : ''}</option>)}
                </select>
              </div>

              {/* Workspace Navigation Tabs */}
              <div role="tablist" aria-label="Business section workspace" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1.5px solid #e2e8f0', marginBottom: '1.25rem' }}>
                {[
                  ['content', copy.contentMedia, 'fa-photo-film'],
                  ['fields', `${copy.fields} (${fields.length})`, 'fa-list-check'],
                  ['components', `${copy.components} (${components.length})`, 'fa-cubes'],
                ].map(([tab, label, icon]) => (
                  <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab as typeof activeTab)} style={{ padding: '0.75rem 1.25rem', border: 0, borderBottom: activeTab === tab ? '3px solid #D4AF37' : '3px solid transparent', background: 'transparent', color: activeTab === tab ? '#D4AF37' : '#64748b', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <i className={`fas ${icon}`} style={{ marginRight: isRTL ? 0 : '0.45rem', marginLeft: isRTL ? '0.45rem' : 0 }} />{label}
                  </button>
                ))}
              </div>

              {/* SECTION NAME OVERRIDES */}
              {activeTab === 'content' && (
                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: isRTL ? 0 : '0.8px', marginBottom: '0.5rem' }}>{copy.sectionName}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input value={sectionLabel} onChange={event => setSectionLabel(event.target.value)} placeholder={`English Label (${section?.name || 'Default'})`} disabled={!!sectionControls[sectionId]?.admin_locked_label} style={{ padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, background: sectionControls[sectionId]?.admin_locked_label ? '#f8fafc' : '#fff' }} />
                    <input value={sectionLabelAr} onChange={event => setSectionLabelAr(event.target.value)} placeholder="اسم القسم بالعربية" dir="rtl" disabled={!!sectionControls[sectionId]?.admin_locked_label} style={{ padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, background: sectionControls[sectionId]?.admin_locked_label ? '#f8fafc' : '#fff', textAlign: 'right' }} />
                  </div>
                </section>
              )}

              {/* TAB 1: CONTENT & RICH MEDIA STUDIO */}
              {activeTab === 'content' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {/* MULTI-MEDIA GALLERY CARD */}
                  <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{copy.mediaGallery}</h3>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>Upload multiple photos or videos simultaneously. Drag items to reorder the section carousel.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => fileInputRef.current?.click()} disabled={!!uploadProgress} style={{ padding: '0.6rem 1rem', background: '#D4AF37', color: '#1a1000', border: 0, borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: uploadProgress ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(212,175,55,0.3)' }}>
                          <i className="fas fa-plus" /> {uploadProgress ? copy.uploading : copy.upload}
                        </button>
                        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={e => e.target.files && uploadMultipleFiles(e.target.files)} style={{ display: 'none' }} />
                      </div>
                    </div>

                    {/* DRAG AND DROP ZONE */}
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDropFiles}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '2rem 1.5rem',
                        borderRadius: '12px',
                        border: `2px dashed ${isDragOver ? '#D4AF37' : '#cbd5e1'}`,
                        background: isDragOver ? '#fefce8' : '#f8fafc',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginBottom: '1.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className="fas fa-cloud-arrow-up" style={{ fontSize: '2rem', color: isDragOver ? '#D4AF37' : '#94a3b8', marginBottom: '0.5rem', display: 'block' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{copy.uploadZone}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>Supports PNG, JPG, WebP, GIF, MP4, MOV (Batch Uploads Supported)</div>
                    </div>

                    {/* UPLOAD PROGRESS BAR */}
                    {uploadProgress && (
                      <div style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '0.4rem' }}>
                          <span>Uploading Batch...</span>
                          <span>{uploadProgress.done} of {uploadProgress.total}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#dbeafe', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s' }} />
                        </div>
                      </div>
                    )}

                    {/* MANUAL URL ADDER */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <input value={newImage.url} onChange={event => setNewImage(current => ({ ...current, url: event.target.value }))} placeholder="Or paste external media URL (https://...)" style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }} />
                      <input value={newImage.caption} onChange={event => setNewImage(current => ({ ...current, caption: event.target.value }))} placeholder="Optional Caption" style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem' }} />
                      <button onClick={addImageManual} style={{ padding: '0 1.25rem', border: 0, borderRadius: '8px', background: '#0f766e', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>+ Add</button>
                    </div>

                    {/* INTERACTIVE MEDIA CARDS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {gallery.map((item, index) => {
                        const isVideo = item.url.toLowerCase().endsWith('.mp4') || item.url.toLowerCase().endsWith('.mov') || item.url.includes('/video/upload/');
                        const isEditing = activeMediaIndex === index;

                        return (
                          <div
                            key={`${item.url}-${index}`}
                            draggable
                            onDragStart={() => setDraggedItemIndex(index)}
                            onDragOver={e => { e.preventDefault(); if (dragOverItemIndex !== index) setDragOverItemIndex(index); }}
                            onDragLeave={() => setDragOverItemIndex(null)}
                            onDrop={() => {
                              if (draggedItemIndex !== null) handleReorderGallery(draggedItemIndex, index);
                              setDraggedItemIndex(null);
                              setDragOverItemIndex(null);
                            }}
                            style={{
                              background: '#ffffff',
                              border: item.is_hero ? '2px solid #D4AF37' : (dragOverItemIndex === index ? '2px dashed #2563eb' : '1px solid #e2e8f0'),
                              borderRadius: '14px',
                              overflow: 'hidden',
                              boxShadow: item.is_hero ? '0 4px 16px rgba(212,175,55,0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                              opacity: draggedItemIndex === index ? 0.4 : 1,
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {/* Card Media Preview Header */}
                            <div style={{ height: '160px', position: 'relative', background: '#0f172a' }}>
                              {isVideo ? (
                                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                              ) : (
                                <img src={item.url} alt={item.caption || 'Media item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}

                              {/* Hero Badge */}
                              {item.is_hero && (
                                <div style={{ position: 'absolute', top: 8, left: 8, background: '#D4AF37', color: '#1a1000', fontSize: '0.62rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <i className="fas fa-crown" /> HERO COVER
                                </div>
                              )}

                              {/* Grip Handle */}
                              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', fontSize: '0.75rem' }} title="Drag to reorder in carousel">
                                <i className="fas fa-grip-vertical" />
                              </div>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Caption</label>
                                <input
                                  value={item.caption}
                                  onChange={e => updateGalleryItem(index, { caption: e.target.value })}
                                  placeholder="Add slide caption..."
                                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}
                                />
                              </div>

                              {/* Placement selector */}
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>Placement:</label>
                                <select
                                  value={item.placement || 'carousel'}
                                  onChange={e => updateGalleryItem(index, { placement: e.target.value as any })}
                                  style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}
                                >
                                  <option value="carousel">Carousel Only</option>
                                  <option value="body">Body Grid Only</option>
                                  <option value="both">Both Places</option>
                                </select>
                              </div>

                              {/* Rich Overlay Accordion Button */}
                              <button
                                type="button"
                                onClick={() => setActiveMediaIndex(isEditing ? null : index)}
                                style={{ background: isEditing ? '#fefce8' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', fontSize: '0.68rem', fontWeight: 800, color: isEditing ? '#a16207' : '#475569', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              >
                                <span><i className="fas fa-layer-group" style={{ marginRight: '4px' }} /> Slide Headline & CTA</span>
                                <i className={`fas fa-chevron-${isEditing ? 'up' : 'down'}`} />
                              </button>

                              {/* Rich Overlay Details */}
                              {isEditing && (
                                <div style={{ padding: '0.6rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                  <input
                                    value={item.slide_data?.title || ''}
                                    onChange={e => updateGalleryItem(index, { slide_data: { ...item.slide_data, title: e.target.value } })}
                                    placeholder="Slide Title (e.g. Desert Suite)"
                                    style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                                  />
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                    <input
                                      value={item.slide_data?.cta_label || ''}
                                      onChange={e => updateGalleryItem(index, { slide_data: { ...item.slide_data, cta_label: e.target.value } })}
                                      placeholder="CTA Label (e.g. Book)"
                                      style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                                    />
                                    <input
                                      value={item.slide_data?.cta_url || ''}
                                      onChange={e => updateGalleryItem(index, { slide_data: { ...item.slide_data, cta_url: e.target.value } })}
                                      placeholder="CTA URL / Link"
                                      style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem' }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Card Actions Footer */}
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
                                  onClick={() => setGallery(current => current.filter((_, i) => i !== index))}
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

                  {/* PUBLICATION & MODERATION SETTINGS */}
                  <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>Publication Status</h4>
                      <select value={meta.galleryStatus} onChange={event => updateMeta('galleryStatus', event.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <option value="approved">Approved & Live</option>
                        <option value="draft">Draft Mode</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>Placement Switches</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                          <input type="checkbox" checked={!!meta.galleryOnMinisite} onChange={event => updateMeta('galleryOnMinisite', event.target.checked)} />
                          Show in Business Minisite Carousel
                        </label>
                        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                          <input type="checkbox" checked={!!meta.galleryOnMain} onChange={event => updateMeta('galleryOnMain', event.target.checked)} />
                          Promote to Main Website Carousel
                        </label>
                      </div>
                    </div>
                  </section>

                  {/* INTERACTIVE BLOG / STORY EDITOR */}
                  <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{copy.story}</h3>
                    <input value={blogTitle} onChange={event => setBlogTitle(event.target.value)} placeholder="Story title (English)" style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '0.75rem', fontWeight: 700 }} />
                    <RichBlogEditor value={blogBody} onChange={setBlogBody} minHeight="240px" businessName={business.name} sectionName={section?.name || sectionId} placeholder="Write the section story with photos, fonts, headings, and links..." />
                    <input value={blogTitleAr} onChange={event => setBlogTitleAr(event.target.value)} placeholder="عنوان القصة بالعربية" dir="rtl" style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', margin: '1rem 0 0.75rem', textAlign: 'right', fontWeight: 700 }} />
                    <RichBlogEditor value={blogBodyAr} onChange={setBlogBodyAr} minHeight="240px" businessName={business.name} sectionName={section?.name || sectionId} dir="rtl" placeholder="اكتب قصة القسم باللغة العربية..." />
                  </section>
                </div>
              )}

              {/* TAB 2: FIELDS */}
              {activeTab === 'fields' && (
                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 900 }}>Section Fields</h3>
                  <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.75rem' }}>Edit this business section’s assigned form fields.</p>
                  {fields.length > 0 ? (
                    <DynamicForm fields={fields} data={business.custom_data || {}} onChange={handleFieldChange} sections={section ? [section] : []} userRole="admin" businessName={business.name} />
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No fields are assigned to this section.</p>
                  )}
                </section>
              )}

              {/* TAB 3: COMPONENTS */}
              {activeTab === 'components' && (
                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Section Components</h3>
                      <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.75rem' }}>Reusable structured components configured for this section.</p>
                    </div>
                    <Link href={`/admin/sections/${sectionId}/add-components`} style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', background: '#0f172a', color: '#fff', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800 }}>Manage Library</Link>
                  </div>
                  {components.length > 0 ? (
                    <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                      {components.map(component => (
                        <div key={component.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                          <div>
                            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.82rem' }}>{component.label || component.component_type}</strong>
                            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{component.component_type} · {component.is_repeatable ? 'Repeatable' : 'Single'}</span>
                          </div>
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>Order #{component.display_order ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: '1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>No components assigned to this section yet.</p>
                  )}
                </section>
              )}

              {/* SAVE ACTION BAR */}
              <div style={{ display: 'flex', justifyContent: isRTL ? 'flex-start' : 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                {message && (
                  <span style={{ color: message.includes('failed') ? '#b91c1c' : '#15803d', fontSize: '0.8rem', fontWeight: 800 }}>
                    {message}
                  </span>
                )}
                <button
                  onClick={saveContent}
                  disabled={saving || !section}
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
                    gap: '0.5rem'
                  }}
                >
                  <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                  {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving Content...') : copy.save}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
