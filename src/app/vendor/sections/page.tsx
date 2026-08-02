'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';
import { useLang } from '@/context/LangContext';

/* ─── Interfaces ───────────────────────────────────────────────── */
interface Field { id: string; name: string; label: string; field_type: string; required: boolean; value: any; options?: any; help_text?: string; business_type_id?: string; }
interface Section { id: string; name: string; icon: string; fields: Field[]; enable_gallery: boolean; enable_blog: boolean; }
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
  const [activeTab, setActiveTab]       = useState<'core' | 'common' | 'unique' | 'minisite_settings'>('core');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData]         = useState<Record<string, any>>({});
  const [tierFeatures, setTierFeatures] = useState<Record<string, any>>({});

  /* ── Minisite customization ─────────────────────────────────── */
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>({});
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [sectionControls, setSectionControls] = useState<Record<string, any>>({});
  const [labelsSaving, setLabelsSaving] = useState(false);
  const [labelsSaved, setLabelsSaved] = useState(false);

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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSection, setRequestSection] = useState('');
  const [requestFieldName, setRequestFieldName] = useState('');
  const [requestFieldLabel, setRequestFieldLabel] = useState('');
  const [requestFieldType, setRequestFieldType] = useState('text');
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [vendorRequests, setVendorRequests] = useState<any[]>([]);

  useEffect(() => { 
    loadStory(); 
    fetchFieldRequests();
  }, []);

  async function fetchFieldRequests() {
    try {
      const res = await fetch('/api/vendor/field-requests');
      const data = await res.json();
      if (data.requests) setVendorRequests(data.requests);
    } catch {}
  }

  async function submitFieldRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestSection || !requestFieldLabel || !requestFieldName) {
      setRequestMsg('❌ Please fill in all required fields.');
      return;
    }
    setRequestSubmitting(true);
    setRequestMsg('');
    try {
      const res = await fetch('/api/vendor/field-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: requestSection,
          field_name: requestFieldName,
          field_label: requestFieldLabel,
          field_type: requestFieldType,
          reason: requestReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRequestMsg('✅ Suggestion sent successfully to admin!');
        setRequestFieldLabel('');
        setRequestFieldName('');
        setRequestReason('');
        fetchFieldRequests();
      } else {
        setRequestMsg(`❌ ${data.error || 'Failed to submit suggestion'}`);
      }
    } catch {
      setRequestMsg('❌ Network error. Please try again.');
    } finally {
      setRequestSubmitting(false);
      setTimeout(() => setRequestMsg(''), 5000);
    }
  }

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

      // Load existing minisite customisations
      const biz = data.business || {};
      const existingLabels = biz.custom_data?.section_labels || biz.custom_data?.basic?.section_labels || {};
      const existingHidden = biz.custom_data?.basic?.hidden_sections || biz.custom_data?.hidden_sections || [];
      
      // Override legacy labels with exact DB custom_labels if they exist
      if (data.sectionControls) {
        setSectionControls(data.sectionControls);
        Object.entries(data.sectionControls).forEach(([secId, ctrl]: [string, any]) => {
          if (ctrl.custom_label) existingLabels[secId] = ctrl.custom_label;
        });
      }

      setSectionLabels(existingLabels);
      setHiddenSections(existingHidden);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* When active section changes, reset tab and load content */
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

  async function saveMinisiteSettings() {
    setLabelsSaving(true);
    try {
      const res = await fetch('/api/vendor/story', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: formData,
          section_labels: sectionLabels,
          hidden_sections: hiddenSections,
        })
      });
      if (res.ok) { setLabelsSaved(true); setTimeout(() => setLabelsSaved(false), 3000); }
      else throw new Error('Failed to save minisite settings');
    } catch (e: any) { console.error(e.message); }
    finally { setLabelsSaving(false); }
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
  const currentList     = activeTab === 'core' ? coreSections : activeTab === 'common' ? commonSections : activeTab === 'unique' ? uniqueSections : [];
  
  const tabDefs         = [
    { id: 'core',             label: t.tabCore   || 'Core Info',         icon: 'fa-fingerprint', color: '#D4AF37', count: coreSections.length },
    { id: 'common',           label: t.tabCommon || 'Universal',         icon: 'fa-globe',       color: '#3b82f6', count: commonSections.length },
    { id: 'unique',           label: t.tabUnique || 'Unique',            icon: 'fa-star',        color: '#10b981', count: uniqueSections.length },
    { id: 'minisite_settings',label: '⚙️ Tab Labels & Visibility',        icon: 'fa-sliders-h',   color: '#8b5cf6', count: sections.length },
  ];

  /* ── Premium Sub-Tabs Style ────────────────────────────────── */
  const subTabStyle = (active: boolean, color: string) => ({
    padding: '0.75rem 1.5rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? `3px solid ${color}` : '3px solid transparent',
    color: active ? '#0f172a' : '#94a3b8',
    fontWeight: active ? 900 : 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.25s ease',
  });

  const toggleStyle = (active: boolean) => ({
    width: 32,
    height: 18,
    borderRadius: 9,
    cursor: 'pointer',
    border: 'none',
    background: active ? '#10b981' : '#e2e8f0',
    position: 'relative' as const,
    transition: 'all 0.2s',
    flexShrink: 0,
    padding: 0,
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
          {tabDefs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent', color: isActive ? '#0f172a' : '#94a3b8', fontWeight: isActive ? 900 : 700, fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' }}>
                <i className={`fas ${tab.icon}`} style={{ color: isActive ? tab.color : '#cbd5e1' }}></i>
                {tab.label}
                <span style={{ background: isActive ? `${tab.color}15` : '#f1f5f9', color: isActive ? tab.color : '#94a3b8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem' }}>{tab.count}</span>
              </button>
            );
          })}
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

          {/* Request custom fields */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <button
              onClick={() => {
                if (sections.length > 0) setRequestSection(sections[0].id);
                setShowRequestModal(true);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1.5px dashed #D4AF37',
                background: '#fffdf5',
                color: '#92702a',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#fef8ee'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#fffdf5'; }}
            >
              <i className="fas fa-lightbulb" style={{ color: '#D4AF37' }}></i>
              Suggest Custom Field
            </button>
          </div>
        </aside>

        {/* CANVAS */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', background: '#f8fafc' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>

            {/* ─── MINISITE SETTINGS PANEL ─────────────────────────── */}
            {activeTab === 'minisite_settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Header card */}
                <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem 2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '14px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: '1.3rem' }}>
                      <i className="fas fa-sliders-h"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Tab Labels & Visibility</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Rename navigation tabs & hide sections on your public minisite</div>
                    </div>
                  </div>
                  <button onClick={saveMinisiteSettings} disabled={labelsSaving} style={{ background: labelsSaved ? '#10b981' : '#8b5cf6', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, cursor: labelsSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}>
                    {labelsSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : labelsSaved ? <><i className="fas fa-check"></i> Saved!</> : <><i className="fas fa-save"></i> Save Settings</>}
                  </button>
                </div>

                {/* Info note */}
                <div style={{ background: '#ede9fe', borderRadius: '14px', padding: '1rem 1.5rem', border: '1px solid #ddd6fe', fontSize: '0.8rem', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fas fa-info-circle"></i>
                  <span>Changes here affect how your minisite navigation looks to visitors. Tab names default to the system section name if left blank.</span>
                </div>

                {/* Section rows */}
                {sections.map(s => {
                  const isHidden = hiddenSections.includes(s.id);
                  const currentLabel = sectionLabels[s.id] || '';
                  return (
                    <div key={s.id} style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem 1.75rem', border: isHidden ? '1.5px solid #fecaca' : '1.5px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
                      {/* Section Icon & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 200px' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '10px', background: isHidden ? '#fef2f2' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isHidden ? '#f87171' : '#64748b', fontSize: '0.9rem', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                          <i className={`fas ${s.icon}`}></i>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isHidden ? '#94a3b8' : '#1e293b' }}>{s.name}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontFamily: 'monospace' }}>{s.id}</div>
                        </div>
                      </div>

                      {/* Label Input */}
                      <div style={{ flex: '2 1 260px' }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', display: 'block', marginBottom: '0.3rem' }}>
                          CUSTOM TAB LABEL {sectionControls[s.id]?.admin_locked_label && <i className="fas fa-lock" style={{color: '#ef4444', marginLeft: '4px'}} title="Locked by Admin"></i>}
                        </label>
                        <input
                          type="text"
                          placeholder={s.name + ' (default)'}
                          value={currentLabel}
                          onChange={e => setSectionLabels(prev => ({ ...prev, [s.id]: e.target.value }))}
                          disabled={isHidden || sectionControls[s.id]?.admin_locked_label}
                          style={{ width: '100%', padding: '0.55rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: (isHidden || sectionControls[s.id]?.admin_locked_label) ? '#f8fafc' : '#fff', fontSize: '0.82rem', color: '#1e293b', outline: 'none', opacity: isHidden ? 0.5 : 1, boxSizing: 'border-box' }}
                        />
                        {sectionControls[s.id]?.admin_locked_label ? (
                          <div style={{ fontSize: '0.6rem', color: '#ef4444', marginTop: '0.25rem' }}>This label has been locked by the site administrator.</div>
                        ) : currentLabel ? (
                          <div style={{ fontSize: '0.6rem', color: '#8b5cf6', marginTop: '0.25rem' }}>✓ Visitors will see: <strong>{currentLabel}</strong></div>
                        ) : null}
                      </div>

                      {/* Visibility Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setHiddenSections(prev => isHidden ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', borderRadius: '10px', border: '1.5px solid', borderColor: isHidden ? '#fca5a5' : '#6ee7b7', background: isHidden ? '#fef2f2' : '#f0fdf4', color: isHidden ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <i className={`fas ${isHidden ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          {isHidden ? 'HIDDEN' : 'VISIBLE'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Save bottom button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={saveMinisiteSettings} disabled={labelsSaving} style={{ background: labelsSaved ? '#10b981' : '#8b5cf6', color: '#fff', border: 'none', padding: '0.85rem 2.5rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 900, cursor: labelsSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}>
                    {labelsSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : labelsSaved ? <><i className="fas fa-check"></i> Saved!</> : <><i className="fas fa-cloud-upload-alt"></i> Save Minisite Settings</>}
                  </button>
                </div>
              </div>
            )}

            {/* ─── NORMAL SECTION CANVAS ───────────────────────────── */}
            {activeTab !== 'minisite_settings' && (<>
            {activeTab === 'core' && currentSection?.id === 'basic' && (
              <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', marginBottom: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '16px', background: `${accentColor}15`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    <i className={`fas ${typology.child?.icon || 'fa-building'}`}></i>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', letterSpacing: '1px' }}>ID: {business?.id?.split('-')[0]}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: `${accentColor}15`, color: accentColor, padding: '4px 10px', borderRadius: '8px', letterSpacing: '1px' }}>{typology.parent?.name} › {typology.child?.name}</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{business?.name}</h1>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Section Canvas Card */}
            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', overflow: 'hidden' }}>

              {sectionControls[activeTab]?.admin_disabled ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>
                    <i className="fas fa-ban"></i>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Section Disabled</h2>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#64748b', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                    This section has been temporarily disabled by the site administrator. You cannot edit it at this time.
                  </p>
                </div>
              ) : (
                <>
                  {/* Title & Info */}
                  <div style={{ padding: '2.5rem 2.5rem 0', display: 'flex', alignItems: 'center', gap: '1.25rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#f8fafc', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                      <i className={`fas ${currentSection?.icon}`}></i>
                    </div>
                    <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{currentSection?.name}</h2>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Please fill in this section's details.</p>
                    </div>
                  </div>

                  {/* Sub-Tabs Selector — tabs shown only if admin enabled them for this section */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 2.5rem', marginTop: '1.5rem', gap: '1.5rem', direction: isRTL ? 'rtl' : 'ltr' }}>
                <button style={subTabStyle(sectionPanel === 'fields', accentColor)} onClick={() => switchPanel('fields')}>
                  <i className="fas fa-list-alt"></i> Fields
                </button>
                {currentSection?.enable_gallery !== false && (
                  <button style={subTabStyle(sectionPanel === 'gallery', '#6366f1')} onClick={() => switchPanel('gallery')}>
                    <i className="fas fa-images"></i> Gallery
                  </button>
                )}
                {currentSection?.enable_blog !== false && (
                  <button style={subTabStyle(sectionPanel === 'blog', '#f59e0b')} onClick={() => switchPanel('blog')}>
                    <i className="fas fa-feather-alt"></i> Blog
                  </button>
                )}
              </div>

              {/* ── PANEL: FIELDS ─────────────────────────────── */}
              {sectionPanel === 'fields' && (
                <div style={{ padding: '2.5rem' }}>
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
                <div style={{ padding: '2.5rem' }}>

                  {/* Upload Controls Bar */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      disabled={uploadingImg}
                      onClick={() => cameraRef.current?.click()}
                      style={{ padding: '0.75rem 1.25rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <i className="fas fa-camera"></i> Camera
                    </button>
                    <button
                      disabled={uploadingImg}
                      onClick={() => fileRef.current?.click()}
                      style={{ padding: '0.75rem 1.25rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <i className="fas fa-folder-open"></i> {uploadingImg ? 'Uploading...' : 'Choose Files'}
                    </button>
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files)} />
                    <input ref={fileRef}   type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files)} />

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <i className="fas fa-info-circle" style={{ color: '#6366f1' }}></i>
                      Configure visibility options below each image placeholder.
                    </div>
                  </div>

                  {galleryLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <i className="fas fa-spinner fa-spin fa-2x"></i>
                      <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Loading images...</div>
                    </div>
                  )}

                  {!galleryLoading && gallery.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                      <i className="fas fa-images" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1.25rem', display: 'block' }}></i>
                      <div style={{ fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>No images uploaded yet</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Upload photos from your camera or local files to feature in this section.</div>
                    </div>
                  )}

                  {!galleryLoading && gallery.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                      {gallery.map(img => (
                        <div key={img.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                          {/* Image Thumbnail Container */}
                          <div style={{ aspectRatio: '16/10', background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                            <img src={img.url} alt={img.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            {img.approval_status === 'pending' && (
                              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '999px', letterSpacing: '0.5px' }}>⏳ PENDING</div>
                            )}
                            {img.approval_status === 'approved' && (
                              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '999px', letterSpacing: '0.5px' }}>✓ APPROVED</div>
                            )}
                            <button onClick={() => deleteImage(img.id)} style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '8px', width: 28, height: 28, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>✕</button>
                          </div>

                          {/* Controls & Edit fields */}
                          <div style={{ padding: '1rem' }}>
                            <input
                              type="text"
                              value={img.caption}
                              onChange={e => {
                                const newCaption = e.target.value;
                                setGallery(prev => prev.map(i => i.id === img.id ? { ...i, caption: newCaption } : i));
                              }}
                              onBlur={e => updateImage(img.id, { caption: e.target.value })}
                              placeholder="Image description..."
                              style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', color: '#1e293b', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' }}
                            />

                            {/* Visibility Toggles */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'space-between' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                                <button
                                  onClick={() => updateImage(img.id, { show_on_main: !img.show_on_main })}
                                  style={toggleStyle(img.show_on_main)}
                                >
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: img.show_on_main ? 16 : 2, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                </button>
                                Main Site
                              </label>

                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                                <button
                                  onClick={() => updateImage(img.id, { show_on_minisite: !img.show_on_minisite })}
                                  style={toggleStyle(img.show_on_minisite)}
                                >
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: img.show_on_minisite ? 16 : 2, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
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
                <div style={{ padding: '2.5rem' }}>

                  {/* New Blog Post Form */}
                  {blogForm ? (
                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 900, color: '#92400e' }}>✍️ Write New Blog Post</h3>
                      <input
                        type="text" placeholder="Article Title..."
                        value={blogForm.title}
                        onChange={e => setBlogForm(prev => prev ? { ...prev, title: e.target.value } : prev)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #fcd34d', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', boxSizing: 'border-box', outline: 'none' }}
                      />
                      <textarea
                        placeholder="Write your article details here..."
                        value={blogForm.content}
                        onChange={e => setBlogForm(prev => prev ? { ...prev, content: e.target.value } : prev)}
                        rows={8}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #fcd34d', borderRadius: '10px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }}
                      />

                      {/* Toggles */}
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                          <button onClick={() => setBlogForm(prev => prev ? { ...prev, show_on_main: !prev.show_on_main } : prev)} style={toggleStyle(blogForm.show_on_main)}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: blogForm.show_on_main ? 16 : 2, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                          </button>
                          Show on Main Directory
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                          <button onClick={() => setBlogForm(prev => prev ? { ...prev, show_on_minisite: !prev.show_on_minisite } : prev)} style={toggleStyle(blogForm.show_on_minisite)}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: blogForm.show_on_minisite ? 16 : 2, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                          </button>
                          Show on Mini Site
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setBlogForm(null)} style={{ padding: '0.6rem 1.25rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                        <button onClick={saveBlog} disabled={blogSaving} style={{ padding: '0.6rem 1.5rem', background: '#f59e0b', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {blogSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                          {blogSaving ? 'Publishing...' : 'Publish Post'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setBlogForm({ title: '', content: '', show_on_main: true, show_on_minisite: true })} style={{ marginBottom: '2rem', padding: '0.75rem 1.5rem', background: '#f59e0b', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                      <i className="fas fa-feather-alt" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1.25rem', display: 'block' }}></i>
                      <div style={{ fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>No blog posts written yet</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Share updates, stories, or announcements specific to this section.</div>
                    </div>
                  )}

                  {!blogsLoading && blogs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {blogs.map(blog => (
                        <div key={blog.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>{blog.title}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>{blog.excerpt}</div>
                            
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* Status badge */}
                              <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '3px 10px', borderRadius: '999px', background: blog.status === 'published' ? '#dcfce7' : '#fef3c7', color: blog.status === 'published' ? '#15803d' : '#d97706', letterSpacing: '0.5px' }}>
                                {blog.status === 'published' ? '✓ PUBLISHED' : '⏳ PENDING'}
                              </span>

                              {/* Visibility toggles */}
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                                <button onClick={() => toggleBlogVisibility(blog, 'show_on_main')} style={toggleStyle(blog.show_on_main)}>
                                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: blog.show_on_main ? 17 : 3, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                                </button>
                                Main Site
                              </label>

                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                                <button onClick={() => toggleBlogVisibility(blog, 'show_on_minisite')} style={toggleStyle(blog.show_on_minisite)}>
                                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: blog.show_on_minisite ? 17 : 3, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                                </button>
                                Mini Site
                              </label>

                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 'auto' }}>{new Date(blog.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <button onClick={() => deleteBlog(blog.id)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '0.6rem 0.8rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

                </>
              )}
            </div>
            {/* Close normal section canvas conditional */}
            </>)}

          </div>
        </main>
      </div>

      {/* ─── CUSTOM FIELD REQUEST MODAL ───────────────────────── */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1.5px solid #fde68a',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#fdf8ee', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  <i className="fas fa-lightbulb"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Suggest Custom Field</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Propose additional fields to website administrators</p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem' }}>
              <form onSubmit={submitFieldRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Select Section */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Target Profile Section *</label>
                  <select
                    value={requestSection}
                    onChange={e => setRequestSection(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>

                {/* Field Label & Name */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Field Display Label *</label>
                    <input
                      type="text"
                      placeholder="e.g. Campfire Area Size"
                      value={requestFieldLabel}
                      onChange={e => {
                        setRequestFieldLabel(e.target.value);
                        // Auto-generate a clean system key
                        setRequestFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30));
                      }}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>System Key (Automatic)</label>
                    <input
                      type="text"
                      disabled
                      value={requestFieldName}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', color: '#94a3b8', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Field Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Field Data Type *</label>
                  <select
                    value={requestFieldType}
                    onChange={e => setRequestFieldType(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="text">Single Line Text</option>
                    <option value="textarea">Multi-line Narrative / Textarea</option>
                    <option value="boolean">Yes / No Toggle</option>
                    <option value="select">Dropdown Choice Selector</option>
                    <option value="multiselect">Multi-select Checklist Choices</option>
                  </select>
                </div>

                {/* Business Case / Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Business Requirement / Reason *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how this field helps represent your business..."
                    value={requestReason}
                    onChange={e => setRequestReason(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                {requestMsg && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    background: requestMsg.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
                    color: requestMsg.startsWith('✅') ? '#047857' : '#b91c1c',
                    border: requestMsg.startsWith('✅') ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  }}>
                    {requestMsg}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestSubmitting}
                    style={{ flex: 2, padding: '0.85rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#D4AF37,#f0c842)', color: '#5a3e00', fontWeight: 900, fontSize: '0.85rem', cursor: requestSubmitting ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(212,175,55,0.2)' }}
                  >
                    {requestSubmitting ? 'Sending...' : 'Submit Suggestion'}
                  </button>
                </div>
              </form>

              {/* Log of suggestions */}
              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.5px' }}>YOUR SUGGESTIONS LOG</h4>
                {vendorRequests.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No past suggestions found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {vendorRequests.map(r => (
                      <div key={r.id} style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>{r.field_label}</div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>Section: {r.section_name || r.section_id} · Type: {r.field_type}</div>
                        </div>
                        <div>
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 900,
                            padding: '3px 8px',
                            borderRadius: '20px',
                            background: r.status === 'approved' ? '#dcfce7' : r.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color: r.status === 'approved' ? '#15803d' : r.status === 'rejected' ? '#b91c1c' : '#d97706',
                            textTransform: 'uppercase',
                          }}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

