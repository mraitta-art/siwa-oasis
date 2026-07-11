'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';
import { useLang } from '@/context/LangContext';

/* ─── Interfaces ───────────────────────────────────────────────── */
interface Field { id: string; name: string; label: string; field_type: string; required: boolean; value: any; options?: any; help_text?: string; business_type_id?: string; }
interface Section { id: string; name: string; icon: string; fields: Field[]; }
interface Typology { child: { id: string; name: string; icon: string; color: string } | null; parent: { id: string; name: string; icon: string; color: string } | null; }
interface GalleryItem { id: string; url: string; caption: string; is_hero: boolean; show_on_main: boolean; show_on_minisite: boolean; approval_status: string; uploadedAt: string; }
interface BlogPost { id: string; title: string; excerpt: string; status: string; show_on_main: boolean; show_on_minisite: boolean; created_at: string; published_at: string | null; }

export default function VendorStudio() {
  const { t, isRTL } = useLang();

  /* ── Global state ──────────────────────────────────────────── */
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saveOk, setSaveOk]             = useState(false);
  const [business, setBusiness]         = useState<any>(null);
  const [typology, setTypology]         = useState<Typology>({ child: null, parent: null });
  const [sections, setSections]         = useState<Section[]>([]);
  const [activeTab, setActiveTab]       = useState<'core' | 'common' | 'unique'>('core');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData]         = useState<Record<string, any>>({});
  const [tierFeatures, setTierFeatures] = useState<Record<string, any>>({});

  /* ── Section content panel tabs ────────────────────────────── */
  const [sectionPanel, setSectionPanel] = useState<'fields' | 'gallery' | 'blog'>('fields');

  /* ── Gallery state ─────────────────────────────────────────── */
  const [gallery, setGallery]           = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  /* ── Blog state ────────────────────────────────────────────── */
  const [blogs, setBlogs]               = useState<BlogPost[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogForm, setBlogForm]         = useState<{ title: string; content: string; show_on_main: boolean; show_on_minisite: boolean } | null>(null);
  const [blogSaving, setBlogSaving]     = useState(false);

  /* ── Load ──────────────────────────────────────────────────── */
  useEffect(() => { loadStory(); }, []);

  async function loadStory() {
    try {
      const res  = await fetch('/api/vendor/story');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setBusiness(data.business);
      setTypology(data.typology || { child: null, parent: null });
      setSections(data.structure);
      setTierFeatures(data.tierFeatures || {});

      if (data.structure.length > 0) {
        const basic = data.structure.find((s: Section) => s.id === 'basic');
        setActiveSection(basic ? basic.id : data.structure[0].id);
      }

      const initial: Record<string, any> = {};
      data.structure.forEach((s: Section) => {
        initial[s.id] = {};
        s.fields.forEach((f: any) => { initial[s.id][f.name] = f.value; });
      });
      setFormData(initial);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* When active section changes, load its content */
  useEffect(() => {
    if (!activeSection) return;
    setSectionPanel('fields');
    setGallery([]);
    setBlogs([]);
  }, [activeSection]);

  /* ── Load gallery for current section ─────────────────────── */
  async function loadGallery(sectionId: string) {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/vendor/gallery?section=${sectionId}`);
      const data = await res.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch (e) {
      setGallery([]);
    } finally {
      setGalleryLoading(false);
    }
  }

  /* ── Load blogs for current section ───────────────────────── */
  async function loadBlogs(sectionId: string) {
    setBlogsLoading(true);
    try {
      const res = await fetch(`/api/vendor/sections/${sectionId}/blogs`);
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setBlogs([]);
    } finally {
      setBlogsLoading(false);
    }
  }

  /* ── Switch section panel ──────────────────────────────────── */
  function switchPanel(panel: 'fields' | 'gallery' | 'blog') {
    setSectionPanel(panel);
    if (!activeSection) return;
    if (panel === 'gallery') loadGallery(activeSection);
    if (panel === 'blog') loadBlogs(activeSection);
  }

  /* ── Upload image ──────────────────────────────────────────── */
  async function handleImageUpload(files: FileList | null) {
    if (!files || !activeSection) return;
    setUploadingImg(true);
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('file', files[i]);
      fd.append('sectionId', activeSection);
      fd.append('caption', files[i].name);
      fd.append('show_on_main', 'true');
      fd.append('show_on_minisite', 'true');
      try {
        await fetch('/api/vendor/gallery/upload', { method: 'POST', body: fd });
      } catch (e) { /* ignore */ }
    }
    setUploadingImg(false);
    loadGallery(activeSection);
  }

  /* ── Update image caption/visibility ──────────────────────── */
  async function updateImage(imgId: string, fields: Partial<GalleryItem>) {
    await fetch(`/api/vendor/gallery/${imgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
    if (activeSection) loadGallery(activeSection);
  }

  /* ── Delete image ──────────────────────────────────────────── */
  async function deleteImage(imgId: string) {
    if (!confirm('Delete this image?')) return;
    await fetch(`/api/vendor/gallery/${imgId}`, { method: 'DELETE' });
    if (activeSection) loadGallery(activeSection);
  }

  /* ── Save blog post ────────────────────────────────────────── */
  async function saveBlog() {
    if (!blogForm || !activeSection) return;
    if (!blogForm.title || !blogForm.content) return;
    setBlogSaving(true);
    try {
      const res = await fetch(`/api/vendor/sections/${activeSection}/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogForm)
      });
      if (res.ok) {
        setBlogForm(null);
        loadBlogs(activeSection);
      }
    } finally {
      setBlogSaving(false);
    }
  }

  /* ── Delete blog ────────────────────────────────────────────── */
  async function deleteBlog(blogId: string) {
    if (!confirm('Delete this blog post?') || !activeSection) return;
    await fetch(`/api/vendor/sections/${activeSection}/blogs/${blogId}`, { method: 'DELETE' });
    loadBlogs(activeSection);
  }

  /* ── Toggle blog visibility ────────────────────────────────── */
  async function toggleBlogVisibility(blog: BlogPost, field: 'show_on_main' | 'show_on_minisite') {
    if (!activeSection) return;
    await fetch(`/api/vendor/sections/${activeSection}/blogs/${blog.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: blog.title, content: blog.excerpt || '', [field]: !blog[field], show_on_main: blog.show_on_main, show_on_minisite: blog.show_on_minisite })
    });
    loadBlogs(activeSection);
  }

  /* ── Form fields ───────────────────────────────────────────── */
  const handleInputChange = (sectionId: string, fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], [fieldName]: value } }));
  };

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/story', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData })
      });
      if (res.ok) { setSaveOk(true); setTimeout(() => setSaveOk(false), 3000); }
      else throw new Error('Failed to save');
    } catch (e: any) { console.error(e.message); }
    finally { setSaving(false); }
  }

  /* ── Section grouping ──────────────────────────────────────── */
  const { coreSections, commonSections, uniqueSections } = useMemo(() => {
    const core: Section[] = [], common: Section[] = [], unique: Section[] = [];
    sections.forEach(s => {
      if (s.id === 'basic') core.push(s);
      else {
        const hasUnique = s.fields.some(f => f.business_type_id === typology.child?.id);
        if (hasUnique) unique.push(s); else common.push(s);
      }
    });
    return { coreSections: core, commonSections: common, uniqueSections: unique };
  }, [sections, typology]);

  useEffect(() => {
    const list = activeTab === 'core' ? coreSections : activeTab === 'common' ? commonSections : uniqueSections;
    if (list.length > 0 && !list.some(s => s.id === activeSection)) setActiveSection(list[0].id);
  }, [activeTab, coreSections, commonSections, uniqueSections]);

  /* ── Helpers ───────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', gap: '1.5rem' }}>
      <div style={{ width: 56, height: 56, border: '4px solid rgba(212,175,55,0.15)', borderTop: '4px solid #D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.8rem' }}>Loading Studio...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const currentSection  = sections.find(s => s.id === activeSection);
  const allFields       = sections.flatMap(s => s.fields.map(f => ({ ...f, section_id: s.id, required: !!f.required })));
  const accentColor     = typology.child?.color || '#D4AF37';
  const totalFields     = allFields.filter(f => f.name !== 'initialized').length;
  const filledFields    = allFields.filter(f => { const v = formData[f.section_id]?.[f.name]; if (!v) return false; if (Array.isArray(v)) return v.length > 0; if (typeof v === 'string') return v.trim().length > 0; return !!v; }).length;
  const overallPct      = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  const currentList     = activeTab === 'core' ? coreSections : activeTab === 'common' ? commonSections : uniqueSections;
  const tabDefs         = [
    { id: 'core',   label: t.tabCore   || 'Core Info',  icon: 'fa-fingerprint', color: '#D4AF37', count: coreSections.length },
    { id: 'common', label: t.tabCommon || 'Universal',  icon: 'fa-globe',       color: '#3b82f6', count: commonSections.length },
    { id: 'unique', label: t.tabUnique || 'Unique',     icon: 'fa-star',        color: '#10b981', count: uniqueSections.length },
  ];

  /* ── Shared styles ─────────────────────────────────────────── */
  const panelBtnStyle = (active: boolean, color = accentColor) => ({
    padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', transition: 'all 0.15s',
    background: active ? color : '#f1f5f9',
    color: active ? (color === '#D4AF37' ? '#1a1a2e' : '#fff') : '#64748b',
    display: 'flex', alignItems: 'center', gap: '0.4rem',
  });

  const toggle = (active: boolean) => ({
    width: 36, height: 20, borderRadius: 10, cursor: 'pointer', border: 'none',
    background: active ? '#10b981' : '#cbd5e1', position: 'relative' as const,
    transition: 'background 0.2s', flexShrink: 0,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', color: '#1a1a1a', fontFamily: isRTL ? "'Cairo', 'Segoe UI', sans-serif" : "'Inter', system-ui, sans-serif" }}>

      {/* ─── HEADER ──────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', direction: isRTL ? 'rtl' : 'ltr' }}>
        <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
              <i className="fas fa-sun" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>Siwa Oasis Studio</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>Vendor Engine</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>Completion</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? '#10b981' : accentColor, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: overallPct === 100 ? '#10b981' : '#1e293b' }}>{overallPct}%</span>
              </div>
            </div>

            <Link href={`/business/${business?.id}`} target="_blank" style={{ border: '1px solid #e2e8f0', color: '#64748b', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-external-link-alt"></i> Preview
            </Link>

            <button onClick={saveChanges} disabled={saving} style={{ background: saveOk ? '#10b981' : '#0f172a', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : saveOk ? <i className="fas fa-check"></i> : <i className="fas fa-cloud-upload-alt"></i>}
              {saving ? 'Saving...' : saveOk ? 'Saved!' : 'Publish Changes'}
            </button>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div style={{ display: 'flex', padding: '0 2rem', gap: '2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          {tabDefs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent', color: activeTab === tab.id ? '#0f172a' : '#94a3b8', fontWeight: activeTab === tab.id ? 900 : 700, fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.id ? tab.color : '#cbd5e1' }}></i>
              {tab.label}
              <span style={{ background: activeTab === tab.id ? `${tab.color}15` : '#f1f5f9', color: activeTab === tab.id ? tab.color : '#94a3b8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem' }}>{tab.count}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ─── MAIN ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* SIDEBAR */}
        <aside style={{ width: '260px', background: '#fff', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '1.5rem', flexShrink: 0 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem' }}>SECTIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentList.map(s => {
              const isActive = activeSection === s.id;
              const secFields = allFields.filter(f => f.section_id === s.id && f.name !== 'initialized');
              const secFilled = secFields.filter(f => { const v = formData[s.id]?.[f.name]; if (!v) return false; if (Array.isArray(v)) return v.length > 0; if (typeof v === 'string') return v.trim().length > 0; return !!v; }).length;
              const secPct = secFields.length > 0 ? Math.round((secFilled / secFields.length) * 100) : 0;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: '1rem', background: isActive ? '#f8fafc' : '#fff', border: isActive ? `1px solid ${accentColor}40` : '1px solid transparent', borderRadius: '12px', textAlign: isRTL ? 'right' : 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.02)' : 'none', transition: 'all 0.2s', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: isActive ? accentColor : '#f1f5f9', color: isActive ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#0f172a' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: '0.6rem', color: secPct === 100 ? '#10b981' : '#94a3b8', fontWeight: 700, marginTop: '2px' }}>{secPct === 100 ? 'Complete' : `${secPct}%`}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CANVAS */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8fafc' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>

            {/* Business header card for core/basic */}
            {activeTab === 'core' && currentSection?.id === 'basic' && (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem 2rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '14px', background: `${accentColor}15`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                    <i className={`fas ${typology.child?.icon || 'fa-building'}`}></i>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '6px' }}>ID: {business?.id?.split('-')[0]}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: `${accentColor}15`, color: accentColor, padding: '3px 8px', borderRadius: '6px' }}>{typology.parent?.name} › {typology.child?.name}</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{business?.name}</h1>
                  </div>
                </div>
              </div>
            )}

            {/* Section card */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

              {/* Section title + panel switcher */}
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#f8fafc', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    <i className={`fas ${currentSection?.icon}`}></i>
                  </div>
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{currentSection?.name}</h2>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>Manage fields, images and blog posts for this section</p>
                  </div>
                </div>

                {/* Panel Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button style={panelBtnStyle(sectionPanel === 'fields')} onClick={() => switchPanel('fields')}>
                    <i className="fas fa-list-alt"></i> Fields
                  </button>
                  <button style={panelBtnStyle(sectionPanel === 'gallery', '#6366f1')} onClick={() => switchPanel('gallery')}>
                    <i className="fas fa-images"></i> Gallery
                  </button>
                  <button style={panelBtnStyle(sectionPanel === 'blog', '#f59e0b')} onClick={() => switchPanel('blog')}>
                    <i className="fas fa-feather-alt"></i> Blog
                  </button>
                </div>
              </div>

              {/* ── PANEL: FIELDS ─────────────────────────────── */}
              {sectionPanel === 'fields' && (
                <div style={{ padding: '2rem' }}>
                  <DynamicForm
                    fields={allFields.filter(f => f.section_id === activeSection)}
                    data={formData}
                    onChange={handleInputChange}
                    userRole="vendor"
                    sections={sections}
                    tierFeatures={tierFeatures}
                    businessName={business?.name}
                    typology={typology.child?.name}
                    business={business}
                  />
                </div>
              )}

              {/* ── PANEL: GALLERY ────────────────────────────── */}
              {sectionPanel === 'gallery' && (
                <div style={{ padding: '2rem' }}>

                  {/* Upload controls */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button
                      disabled={uploadingImg}
                      onClick={() => cameraRef.current?.click()}
                      style={{ padding: '0.75rem 1.25rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <i className="fas fa-camera"></i> Camera
                    </button>
                    <button
                      disabled={uploadingImg}
                      onClick={() => fileRef.current?.click()}
                      style={{ padding: '0.75rem 1.25rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <i className="fas fa-folder-open"></i> {uploadingImg ? 'Uploading...' : 'Choose Files'}
                    </button>
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files)} />
                    <input ref={fileRef}   type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files)} />

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <i className="fas fa-info-circle" style={{ color: '#6366f1' }}></i>
                      Each image can be toggled to show on the <strong>main site</strong> and/or your <strong>mini site</strong>
                    </div>
                  </div>

                  {galleryLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <i className="fas fa-spinner fa-spin fa-2x"></i>
                      <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Loading images...</div>
                    </div>
                  )}

                  {!galleryLoading && gallery.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                      <i className="fas fa-images" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
                      <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>No images yet</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Upload photos from your camera or device to showcase this section</div>
                    </div>
                  )}

                  {!galleryLoading && gallery.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                      {gallery.map(img => (
                        <div key={img.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                          {/* Image preview */}
                          <div style={{ aspectRatio: '16/9', background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                            <img src={img.url} alt={img.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            {img.approval_status === 'pending' && (
                              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px' }}>⏳ PENDING</div>
                            )}
                            {img.approval_status === 'approved' && (
                              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px' }}>✓ APPROVED</div>
                            )}
                            <button onClick={() => deleteImage(img.id)} style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '6px', width: 28, height: 28, cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                          </div>

                          {/* Caption input */}
                          <div style={{ padding: '0.75rem' }}>
                            <input
                              type="text"
                              value={img.caption}
                              onChange={e => {
                                const newCaption = e.target.value;
                                setGallery(prev => prev.map(i => i.id === img.id ? { ...i, caption: newCaption } : i));
                              }}
                              onBlur={e => updateImage(img.id, { caption: e.target.value })}
                              placeholder="Add caption..."
                              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', color: '#1e293b', background: '#f8fafc', boxSizing: 'border-box' }}
                            />

                            {/* Visibility toggles */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                <button
                                  onClick={() => updateImage(img.id, { show_on_main: !img.show_on_main })}
                                  style={{ ...toggle(img.show_on_main), border: 'none' }}
                                  title={img.show_on_main ? 'Visible on main site' : 'Hidden from main site'}
                                >
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: img.show_on_main ? 16 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                </button>
                                Main Site
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                <button
                                  onClick={() => updateImage(img.id, { show_on_minisite: !img.show_on_minisite })}
                                  style={{ ...toggle(img.show_on_minisite), border: 'none' }}
                                  title={img.show_on_minisite ? 'Visible on mini site' : 'Hidden from mini site'}
                                >
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: img.show_on_minisite ? 16 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                </button>
                                Mini Site
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── PANEL: BLOG ───────────────────────────────── */}
              {sectionPanel === 'blog' && (
                <div style={{ padding: '2rem' }}>

                  {/* New blog form */}
                  {blogForm ? (
                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 900, color: '#92400e' }}>✍️ Write New Blog Post</h3>
                      <input
                        type="text" placeholder="Post title..."
                        value={blogForm.title}
                        onChange={e => setBlogForm(prev => prev ? { ...prev, title: e.target.value } : prev)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #fcd34d', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', boxSizing: 'border-box' }}
                      />
                      <textarea
                        placeholder="Write your story here..."
                        value={blogForm.content}
                        onChange={e => setBlogForm(prev => prev ? { ...prev, content: e.target.value } : prev)}
                        rows={8}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #fcd34d', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                      />

                      {/* Visibility toggles */}
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                          <button onClick={() => setBlogForm(prev => prev ? { ...prev, show_on_main: !prev.show_on_main } : prev)} style={{ ...toggle(blogForm.show_on_main), border: 'none' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: blogForm.show_on_main ? 16 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </button>
                          Show on Main Website
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                          <button onClick={() => setBlogForm(prev => prev ? { ...prev, show_on_minisite: !prev.show_on_minisite } : prev)} style={{ ...toggle(blogForm.show_on_minisite), border: 'none' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: blogForm.show_on_minisite ? 16 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </button>
                          Show on Mini Site
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setBlogForm(null)} style={{ padding: '0.6rem 1.25rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                        <button onClick={saveBlog} disabled={blogSaving} style={{ padding: '0.6rem 1.5rem', background: '#f59e0b', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {blogSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                          {blogSaving ? 'Submitting...' : 'Submit Post'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setBlogForm({ title: '', content: '', show_on_main: true, show_on_minisite: true })} style={{ marginBottom: '1.5rem', padding: '0.75rem 1.5rem', background: '#f59e0b', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-plus"></i> Write New Blog Post
                    </button>
                  )}

                  {blogsLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <i className="fas fa-spinner fa-spin fa-2x"></i>
                      <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Loading blog posts...</div>
                    </div>
                  )}

                  {!blogsLoading && blogs.length === 0 && !blogForm && (
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                      <i className="fas fa-feather-alt" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
                      <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>No posts yet</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Share your story about this section — it will appear on your mini site and the main directory</div>
                    </div>
                  )}

                  {!blogsLoading && blogs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {blogs.map(blog => (
                        <div key={blog.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>{blog.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>{blog.excerpt}</div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* Status badge */}
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', background: blog.status === 'published' ? '#dcfce7' : '#fef3c7', color: blog.status === 'published' ? '#166534' : '#92400e' }}>
                                {blog.status === 'published' ? '✅ Published' : '⏳ Pending Approval'}
                              </span>

                              {/* Visibility toggles */}
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                <button onClick={() => toggleBlogVisibility(blog, 'show_on_main')} style={{ ...toggle(blog.show_on_main), border: 'none' }}>
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: blog.show_on_main ? 17 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                                </button>
                                Main Site
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                <button onClick={() => toggleBlogVisibility(blog, 'show_on_minisite')} style={{ ...toggle(blog.show_on_minisite), border: 'none' }}>
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: blog.show_on_minisite ? 17 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                                </button>
                                Mini Site
                              </label>

                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto' }}>{new Date(blog.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button onClick={() => deleteBlog(blog.id)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
