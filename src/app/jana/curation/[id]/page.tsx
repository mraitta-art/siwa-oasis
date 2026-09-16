'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WhatsAppInviteModal from '@/components/WhatsAppInviteModal';

interface SectionControl {
  section_id: string;
  custom_label?: string;
  admin_locked_label?: number;
  admin_hidden?: number;
  admin_disabled?: number;
  cta_phone?: string;
}

interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
  slide_data?: any;
  is_hero?: boolean | number;
  placement?: string;
  show_on_main?: boolean | number;
  show_on_minisite?: boolean | number;
  approval_status?: string;
  section_id: string;
  section_name?: string;
}

interface ComponentInstance {
  id?: string;
  data_id?: string;
  component_id?: string;
  title?: string;
  status?: string;
  data: any;
  display_order?: number;
}

interface SectionComponent {
  id: string;
  section_id: string;
  component_type: string;
  label: string;
  config?: any;
  is_required?: boolean | number;
  is_repeatable?: boolean | number;
  max_items?: number;
  instances: ComponentInstance[];
}

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  section_id: string;
  section_name?: string;
  status: string;
  show_on_main: boolean | number;
  show_on_minisite: boolean | number;
  created_at?: string;
}

export default function UnifiedCurationStudio() {
  const { id } = useParams();
  const router = useRouter();

  // Core Data State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [business, setBusiness] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [otherBusinesses, setOtherBusinesses] = useState<any[]>([]);

  // Editable Working State
  const [activeTab, setActiveTab] = useState<'navigation' | 'media' | 'dna' | 'components' | 'blogs' | 'governance'>('navigation');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  
  const [sectionControls, setSectionControls] = useState<Record<string, SectionControl>>({});
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [curationData, setCurationData] = useState<any>({
    approved_slides: [],
    distribution_overrides: {},
    hidden_fields: [],
    field_locks: []
  });
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [components, setComponents] = useState<SectionComponent[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [businessUpdates, setBusinessUpdates] = useState<Record<string, any>>({});

  // Direct media adder modal / quick input
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaSection, setNewMediaSection] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');

  // Blog editor modal
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  // WhatsApp Access Modal
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Load all data
  useEffect(() => {
    if (id) loadCurationData();
  }, [id]);

  async function loadCurationData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/curation/${id}`);
      if (!res.ok) throw new Error('Failed to load curation data');
      const data = await res.json();

      setBusiness(data.business);
      setSections(data.sections || []);
      setFormFields(data.formFields || []);
      setOtherBusinesses(data.otherBusinesses || []);
      setGallery(data.gallery || []);
      setComponents(data.components || []);
      setBlogs(data.blogs || []);

      setCustomData(data.business.custom_data || {});
      setCurationData(data.business.curation_data || { approved_slides: [], distribution_overrides: {}, hidden_fields: [], field_locks: [] });
      setSectionControls(data.sectionControls || {});
      setBusinessUpdates({
        name: data.business.name,
        subscription_tier: data.business.subscription_tier,
        status: data.business.status,
        is_trusted: data.business.is_trusted === 1 || data.business.is_trusted === true,
        is_master: data.business.is_master === 1 || data.business.is_master === true,
        is_featured: data.business.is_featured === 1 || data.business.is_featured === true,
        is_recommended: data.business.is_recommended === 1 || data.business.is_recommended === true,
      });

      if (data.sections?.length > 0 && !newMediaSection) {
        setNewMediaSection(data.sections[0].id);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error loading curation data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // --- SAVE ALL WORKSPACE CHANGES ---
  async function handleSaveAll() {
    setSaving(true);
    try {
      // Gather component instance updates
      const componentDataUpdates: any[] = [];
      components.forEach(comp => {
        comp.instances.forEach(inst => {
          componentDataUpdates.push({
            data_id: inst.data_id,
            component_id: comp.id,
            title: inst.title,
            data: inst.data,
            status: inst.status || 'pending_approval',
            display_order: inst.display_order || 0
          });
        });
      });

      const payload = {
        businessUpdates,
        customData,
        curationData,
        sectionControls,
        galleryUpdates: gallery,
        blogUpdates: blogs,
        componentDataUpdates
      };

      const res = await fetch(`/api/jana/curation/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save changes');

      showToast('✅ All content controls and curation saved successfully!', 'success');
      // Refresh to ensure synced DB values
      await loadCurationData();
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(`❌ ${err.message || 'Error saving changes'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  // --- SECTION CONTROL HELPERS ---
  const updateSectionControl = (sectionId: string, updates: Partial<SectionControl>) => {
    setSectionControls(prev => {
      const current = prev[sectionId] || { section_id: sectionId, admin_hidden: 0, admin_locked_label: 0, admin_disabled: 0 };
      return {
        ...prev,
        [sectionId]: { ...current, ...updates }
      };
    });
  };

  const updateSectionLabelAr = (sectionId: string, arLabel: string) => {
    setCustomData(prev => {
      const basic = prev.basic || {};
      const labelsAr = basic.section_labels_ar || prev.section_labels_ar || {};
      return {
        ...prev,
        basic: {
          ...basic,
          section_labels_ar: { ...labelsAr, [sectionId]: arLabel }
        },
        section_labels_ar: { ...labelsAr, [sectionId]: arLabel }
      };
    });
  };

  // --- CONTENT DNA HELPERS ---
  const handleCustomDataChange = (sectionId: string, fieldName: string, value: any) => {
    setCustomData(prev => {
      const next = { ...prev };
      if (!next[sectionId]) next[sectionId] = {};
      next[sectionId][fieldName] = value;
      return next;
    });
  };

  const toggleFieldDistribution = (fieldId: string, channel: 'main_site' | 'minisite') => {
    setCurationData((prev: any) => {
      const overrides = { ...(prev.distribution_overrides || {}) };
      if (!overrides[fieldId]) overrides[fieldId] = { main_site: true, minisite: true };
      overrides[fieldId][channel] = !overrides[fieldId][channel];
      return { ...prev, distribution_overrides: overrides };
    });
  };

  const toggleFieldHidden = (fieldId: string) => {
    setCurationData((prev: any) => {
      const hidden = [...(prev.hidden_fields || [])];
      const next = hidden.includes(fieldId) ? hidden.filter(h => h !== fieldId) : [...hidden, fieldId];
      return { ...prev, hidden_fields: next };
    });
  };

  const toggleFieldLock = (fieldId: string) => {
    setCurationData((prev: any) => {
      const locks = [...(prev.field_locks || [])];
      const next = locks.includes(fieldId) ? locks.filter(l => l !== fieldId) : [...locks, fieldId];
      return { ...prev, field_locks: next };
    });
  };

  // --- HERO & GALLERY HELPERS ---
  const toggleHeroSlide = (url: string) => {
    setCurationData((prev: any) => {
      const slides = [...(prev.approved_slides || [])];
      const next = slides.includes(url) ? slides.filter(u => u !== url) : [...slides, url];
      return { ...prev, approved_slides: next };
    });
  };

  const updateGalleryItem = (itemId: string, updates: Partial<GalleryItem>) => {
    setGallery(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const handleAddMedia = () => {
    if (!newMediaUrl.trim()) return;
    const tempId = `new-${Date.now()}`;
    const newItem: GalleryItem = {
      id: tempId,
      url: newMediaUrl.trim(),
      caption: newMediaCaption.trim(),
      section_id: newMediaSection || (sections[0]?.id || 'sec_1_identity'),
      is_hero: true,
      placement: 'both',
      show_on_minisite: true,
      show_on_main: true,
      approval_status: 'approved'
    };
    setGallery(prev => [newItem, ...prev]);
    toggleHeroSlide(newMediaUrl.trim());
    setNewMediaUrl('');
    setNewMediaCaption('');
    showToast('Media added to working gallery. Click SAVE CHANGES to commit.', 'info');
  };

  // --- COMPONENT DATA HELPERS ---
  const updateComponentInstance = (componentId: string, instIndex: number, field: string, val: any) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id !== componentId) return comp;
      const nextInsts = [...comp.instances];
      if (nextInsts[instIndex]) {
        nextInsts[instIndex] = {
          ...nextInsts[instIndex],
          [field]: val
        };
      }
      return { ...comp, instances: nextInsts };
    }));
  };

  const updateComponentInstanceData = (componentId: string, instIndex: number, key: string, val: any) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id !== componentId) return comp;
      const nextInsts = [...comp.instances];
      if (nextInsts[instIndex]) {
        nextInsts[instIndex] = {
          ...nextInsts[instIndex],
          data: { ...nextInsts[instIndex].data, [key]: val }
        };
      }
      return { ...comp, instances: nextInsts };
    }));
  };

  const addComponentInstance = (componentId: string) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id !== componentId) return comp;
      const newInst: ComponentInstance = {
        component_id: comp.id,
        title: `New ${comp.label} Item`,
        status: 'published',
        data: {},
        display_order: comp.instances.length
      };
      return { ...comp, instances: [...comp.instances, newInst] };
    }));
  };

  const removeComponentInstance = (componentId: string, instIndex: number) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id !== componentId) return comp;
      return { ...comp, instances: comp.instances.filter((_, idx) => idx !== instIndex) };
    }));
  };

  // --- BLOG HELPERS ---
  const updateBlogPost = (blogId: string, updates: Partial<BlogPost>) => {
    setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, ...updates } : b));
  };

  if (loading) {
    return (
      <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
        <i className="fas fa-sliders-h fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '1.5rem' }}></i>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '2px' }}>LOADING UNIFIED CURATION STUDIO...</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Synchronizing omnichannel controls, sections, and media rules.</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
        <h2>Business Not Found</h2>
        <Link href="/jana/curation" style={{ color: '#D4AF37' }}>Return to Curation Dashboard</Link>
      </div>
    );
  }

  const minisiteSlug = business.slug || business.id;
  const arabicLabels = customData?.basic?.section_labels_ar || customData?.section_labels_ar || {};

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ── TOP STICKY COMMAND BAR ────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
        padding: '0.85rem 2rem', color: '#fff'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Identity & Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/jana/curation" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }} title="All Businesses">
              <i className="fas fa-th-large" /> Studio
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>

            {/* Quick Switcher Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-building" style={{ color: '#D4AF37', fontSize: '0.9rem' }} />
              <select
                value={business.id}
                onChange={(e) => router.push(`/jana/curation/${e.target.value}`)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)', color: '#fff', border: '1px solid rgba(212,175,55,0.4)',
                  padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800,
                  outline: 'none', cursor: 'pointer', maxWidth: '280px'
                }}
              >
                {otherBusinesses.map((b: any) => (
                  <option key={b.id} value={b.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {b.name} ({b.subscription_tier?.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Badges */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 9px', borderRadius: '12px',
              background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
              color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase'
            }}>
              <i className={`fas ${business.type_icon || 'fa-tag'}`} /> {business.type_name || 'Business'}
            </span>

            {businessUpdates.is_trusted && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 9px', borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981', fontSize: '0.7rem', fontWeight: 900
              }}>
                <i className="fas fa-check-circle" /> TRUSTED
              </span>
            )}
          </div>

          {/* Quick Actions & Unified Save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href={`/${minisiteSlug}`}
              target="_blank"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.75rem', fontWeight: 800,
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-external-link-alt" style={{ color: '#D4AF37' }} /> PREVIEW MINISITE
            </Link>

            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '10px',
                background: '#25D366', color: '#fff', border: 'none',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,211,102,0.35)', transition: 'all 0.2s'
              }}
              title="Copy or send Barcode & Temporary Access via WhatsApp"
            >
              <i className="fab fa-whatsapp" style={{ fontSize: '0.9rem' }} /> WHATSAPP ACCESS
            </button>

            <Link
              href={`/jana/businesses/${id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.08)', color: '#94a3b8', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.75rem', fontWeight: 800
              }}
              title="Open full DNA schema architect"
            >
              <i className="fas fa-dna" /> DNA ARCHITECT
            </Link>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.75rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #f59e0b 100%)',
                color: '#1a1000', border: 'none', fontWeight: 900, fontSize: '0.82rem',
                cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(212,175,55,0.35)',
                transition: 'transform 0.15s'
              }}
            >
              <i className={saving ? "fas fa-spinner fa-spin" : "fas fa-save"} />
              {saving ? 'SAVING ALL CONTROLS...' : 'SAVE ALL CHANGES'}
            </button>
          </div>
        </div>
      </header>

      {/* ── TOAST NOTIFICATIONS ────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : (toast.type === 'info' ? '#2563eb' : '#0f172a'),
          color: '#fff', padding: '1rem 1.75rem', borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontWeight: 800, fontSize: '0.85rem',
          border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <i className={toast.type === 'error' ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle'} style={{ color: '#D4AF37' }} />
          {toast.message}
        </div>
      )}

      {/* ── MAIN WORKSPACE CONTAINER ─────────────────────────────────── */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Workspace Mode Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem', background: '#fff', padding: '0.5rem',
          borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem',
          overflowX: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          {[
            { id: 'navigation', label: 'Section & Header Governance', icon: 'fa-layer-group', count: sections.length },
            { id: 'media', label: 'Hero Carousel & Gallery', icon: 'fa-images', count: gallery.length },
            { id: 'dna', label: 'Content DNA & Fields', icon: 'fa-align-left', count: formFields.length },
            { id: 'components', label: 'Interactive Widgets', icon: 'fa-puzzle-piece', count: components.length },
            { id: 'blogs', label: 'Section Blogs & Stories', icon: 'fa-newspaper', count: blogs.length },
            { id: 'governance', label: 'Brand & Platform Trust', icon: 'fa-shield-alt' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.75rem 1.25rem', borderRadius: '12px', border: 'none',
                  background: isActive ? '#0f172a' : 'transparent',
                  color: isActive ? '#D4AF37' : '#64748b',
                  fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                <i className={`fas ${tab.icon}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    padding: '2px 7px', borderRadius: '10px', fontSize: '0.65rem',
                    background: isActive ? 'rgba(212,175,55,0.2)' : '#f1f5f9',
                    color: isActive ? '#D4AF37' : '#94a3b8'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: SECTION & HEADER GOVERNANCE (REMOVES TITLE + COMPONENTS)   */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'navigation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Info Banner */}
            <div style={{
              background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '20px', padding: '1.5rem 2rem', color: '#fff',
              border: '1px solid rgba(212,175,55,0.25)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem'
            }}>
              <div>
                <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                  Minisite Header & Section Architecture
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  Control which sections appear on <strong style={{ color: '#D4AF37' }}>{business.name}</strong>&apos;s minisite. 
                  Checking <strong style={{ color: '#ef4444' }}>&quot;Force Hide from Public&quot;</strong> deactivates all section components 
                  <strong style={{ color: '#fff' }}> and completely removes the title from the minisite header navigation tabs and mobile drawer</strong>.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                  Total Sections: <strong style={{ color: '#fff' }}>{sections.length}</strong>
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                  Force Hidden: <strong style={{ color: '#ef4444' }}>{Object.values(sectionControls).filter(c => c.admin_hidden === 1).length}</strong>
                </span>
              </div>
            </div>

            {/* Sections Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '1.5rem' }}>
              {sections.map(section => {
                const ctrl = sectionControls[section.id] || { section_id: section.id, admin_hidden: 0, admin_locked_label: 0, admin_disabled: 0, cta_phone: '', custom_label: '' };
                const isHidden = ctrl.admin_hidden === 1;
                const isLocked = ctrl.admin_locked_label === 1;
                const isDisabled = ctrl.admin_disabled === 1;
                const currentAr = arabicLabels[section.id] || '';

                return (
                  <div
                    key={section.id}
                    style={{
                      background: isHidden ? '#f8fafc' : '#fff',
                      borderRadius: '20px', padding: '1.75rem',
                      border: isHidden ? '2px dashed #cbd5e1' : '1.5px solid #e2e8f0',
                      boxShadow: isHidden ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
                      opacity: isHidden ? 0.75 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px',
                          background: isHidden ? '#e2e8f0' : '#fef3c7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isHidden ? '#64748b' : '#D4AF37', fontSize: '1.1rem'
                        }}>
                          <i className={`fas ${section.icon || 'fa-layer-group'}`} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                            {section.name}
                          </h3>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {section.id}
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 900,
                        background: isHidden ? '#fee2e2' : '#dcfce7',
                        color: isHidden ? '#b91c1c' : '#15803d',
                        border: isHidden ? '1px solid #fca5a5' : '1px solid #86efac'
                      }}>
                        {isHidden ? 'HIDDEN FROM MINISITE' : 'ACTIVE ON MINISITE'}
                      </span>
                    </div>

                    {/* Master Governance Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', background: '#f8fafc', borderRadius: '14px', marginBottom: '1.25rem' }}>
                      
                      {/* CRITICAL TOGGLE: Force Hide (Wipes Title & Components) */}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: isHidden ? '#ef4444' : '#1e293b' }}>
                            Force Hide from Public
                          </strong>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Removes components &amp; purges title from header tabs
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isHidden}
                          onChange={(e) => updateSectionControl(section.id, { admin_hidden: e.target.checked ? 1 : 0 })}
                          style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }}
                        />
                      </label>

                      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.2rem 0' }} />

                      {/* Lock Custom Label */}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                            Lock Custom Tab Name
                          </span>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            Prevents vendor from changing header title
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isLocked}
                          onChange={(e) => updateSectionControl(section.id, { admin_locked_label: e.target.checked ? 1 : 0 })}
                          style={{ width: '18px', height: '18px', accentColor: '#D4AF37', cursor: 'pointer' }}
                        />
                      </label>

                      {/* Disable Vendor Editing */}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                            Disable Vendor Editing
                          </span>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            Locks section inputs inside vendor studio
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isDisabled}
                          onChange={(e) => updateSectionControl(section.id, { admin_disabled: e.target.checked ? 1 : 0 })}
                          style={{ width: '18px', height: '18px', accentColor: '#1e293b', cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    {/* Header Tab Labels (EN & AR) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                          Header Title (English)
                        </label>
                        <input
                          type="text"
                          placeholder={section.name}
                          value={ctrl.custom_label || ''}
                          onChange={(e) => updateSectionControl(section.id, { custom_label: e.target.value })}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px',
                            border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700,
                            outline: 'none', background: '#fff'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                          Header Title (عربي)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="الاسم بالعربية"
                          value={currentAr}
                          onChange={(e) => updateSectionLabelAr(section.id, e.target.value)}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px',
                            border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700,
                            outline: 'none', background: '#fff'
                          }}
                        />
                      </div>
                    </div>

                    {/* CTA Phone Override */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        📞 Section CTA Phone Override
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +20 111 234 5678 (leave empty to use business default)"
                        value={ctrl.cta_phone || ''}
                        onChange={(e) => updateSectionControl(section.id, { cta_phone: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px',
                          border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600,
                          outline: 'none', background: '#fff'
                        }}
                      />
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: HERO CAROUSEL & GALLERY STUDIO                             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'media' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Quick Media Ingestion Bar */}
            <div style={{
              background: '#fff', padding: '1.5rem 2rem', borderRadius: '20px',
              border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                <i className="fas fa-cloud-upload-alt" style={{ color: '#D4AF37', marginRight: '0.5rem' }} />
                Direct Media Ingestion for Minisite &amp; Hero
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="url"
                  placeholder="Image URL (https://images.unsplash.com/... or Cloudinary URL)"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  style={{ padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
                />
                <select
                  value={newMediaSection}
                  onChange={(e) => setNewMediaSection(e.target.value)}
                  style={{ padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', background: '#fff' }}
                >
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Caption or highlight"
                  value={newMediaCaption}
                  onChange={(e) => setNewMediaCaption(e.target.value)}
                  style={{ padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
                />
                <button
                  onClick={handleAddMedia}
                  style={{
                    padding: '0.65rem 1.5rem', background: '#0f172a', color: '#D4AF37',
                    border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem',
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  + Add to Minisite
                </button>
              </div>
            </div>

            {/* Hero Carousel Approved Slides Section */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                    <i className="fas fa-star" style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
                    Hero Carousel Approved Slides ({curationData.approved_slides?.length || 0})
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Click any slide below to toggle its appearance in the high-fidelity minisite hero carousel.
                  </p>
                </div>
              </div>

              {gallery.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fas fa-images fa-3x" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <div>No photos uploaded yet for this business. Use the ingestion bar above to add photos.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {gallery.map((item, idx) => {
                    const isApprovedHero = curationData.approved_slides?.includes(item.url) || item.is_hero === 1 || item.is_hero === true;
                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => {
                          toggleHeroSlide(item.url);
                          updateGalleryItem(item.id, { is_hero: !isApprovedHero });
                        }}
                        style={{
                          position: 'relative', height: '140px', borderRadius: '14px', overflow: 'hidden',
                          cursor: 'pointer', border: isApprovedHero ? '3.5px solid #D4AF37' : '1px solid #e2e8f0',
                          boxShadow: isApprovedHero ? '0 6px 15px rgba(212,175,55,0.3)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <img src={item.url} alt={item.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isApprovedHero ? 1 : 0.65 }} />
                        
                        {isApprovedHero && (
                          <div style={{
                            position: 'absolute', top: '8px', right: '8px', background: '#D4AF37',
                            color: '#1a1000', width: '26px', height: '26px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900
                          }}>
                            <i className="fas fa-check" />
                          </div>
                        )}

                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                          padding: '1rem 0.5rem 0.4rem', color: '#fff', fontSize: '0.65rem'
                        }}>
                          <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.section_name || item.section_id}
                          </div>
                          {item.caption && (
                            <div style={{ opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.caption}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gallery Moderation & Placement Table */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                Gallery Moderation, Placements &amp; Rich Slide Data
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '0.75rem' }}>PREVIEW</th>
                      <th style={{ padding: '0.75rem' }}>SECTION</th>
                      <th style={{ padding: '0.75rem' }}>APPROVAL</th>
                      <th style={{ padding: '0.75rem' }}>PLACEMENT</th>
                      <th style={{ padding: '0.75rem' }}>CHANNELS</th>
                      <th style={{ padding: '0.75rem' }}>CAPTION &amp; OVERLAY CTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gallery.map(item => {
                      const slideData = typeof item.slide_data === 'string' ? JSON.parse(item.slide_data || '{}') : (item.slide_data || {});
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* Preview */}
                          <td style={{ padding: '0.75rem' }}>
                            <img src={item.url} alt="" style={{ width: '55px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                          </td>

                          {/* Section */}
                          <td style={{ padding: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                            {item.section_name || item.section_id}
                          </td>

                          {/* Approval Status */}
                          <td style={{ padding: '0.75rem' }}>
                            <select
                              value={item.approval_status || 'approved'}
                              onChange={(e) => updateGalleryItem(item.id, { approval_status: e.target.value })}
                              style={{
                                padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                                background: item.approval_status === 'approved' ? '#dcfce7' : (item.approval_status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                                color: item.approval_status === 'approved' ? '#166534' : (item.approval_status === 'rejected' ? '#991b1b' : '#92400e'),
                                border: 'none', cursor: 'pointer'
                              }}
                            >
                              <option value="approved">Approved</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>

                          {/* Placement */}
                          <td style={{ padding: '0.75rem' }}>
                            <select
                              value={item.placement || 'both'}
                              onChange={(e) => updateGalleryItem(item.id, { placement: e.target.value })}
                              style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              <option value="both">Both (Hero &amp; Body)</option>
                              <option value="carousel">Hero Carousel Only</option>
                              <option value="body">Body Section Only</option>
                            </select>
                          </td>

                          {/* Omnichannel Toggles */}
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => updateGalleryItem(item.id, { show_on_minisite: !item.show_on_minisite })}
                                style={{
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                                  background: (item.show_on_minisite === 1 || item.show_on_minisite === true || item.show_on_minisite === undefined) ? '#0f172a' : '#e2e8f0',
                                  color: (item.show_on_minisite === 1 || item.show_on_minisite === true || item.show_on_minisite === undefined) ? '#D4AF37' : '#94a3b8'
                                }}
                              >
                                Minisite
                              </button>
                              <button
                                type="button"
                                onClick={() => updateGalleryItem(item.id, { show_on_main: !item.show_on_main })}
                                style={{
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                                  background: (item.show_on_main === 1 || item.show_on_main === true) ? '#D4AF37' : '#e2e8f0',
                                  color: (item.show_on_main === 1 || item.show_on_main === true) ? '#1a1000' : '#94a3b8'
                                }}
                              >
                                Main Site
                              </button>
                            </div>
                          </td>

                          {/* Caption & CTA */}
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <input
                                type="text"
                                placeholder="Caption..."
                                value={item.caption || ''}
                                onChange={(e) => updateGalleryItem(item.id, { caption: e.target.value })}
                                style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
                              />
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <input
                                  type="text"
                                  placeholder="CTA Button Label (e.g. Reserve Now)"
                                  value={slideData.cta_label || ''}
                                  onChange={(e) => updateGalleryItem(item.id, { slide_data: { ...slideData, cta_label: e.target.value } })}
                                  style={{ flex: 1, padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.7rem' }}
                                />
                                <input
                                  type="text"
                                  placeholder="CTA URL / Anchor (#packages)"
                                  value={slideData.cta_url || ''}
                                  onChange={(e) => updateGalleryItem(item.id, { slide_data: { ...slideData, cta_url: e.target.value } })}
                                  style={{ flex: 1, padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.7rem' }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: CONTENT DNA & FORM FIELDS (LIVING DATA EDITOR)              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dna' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Filter by Section Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setSelectedSectionFilter('all')}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                  background: selectedSectionFilter === 'all' ? '#0f172a' : '#fff',
                  color: selectedSectionFilter === 'all' ? '#D4AF37' : '#64748b',
                  fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                All Sections
              </button>
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSectionFilter(s.id)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                    background: selectedSectionFilter === s.id ? '#0f172a' : '#fff',
                    color: selectedSectionFilter === s.id ? '#D4AF37' : '#64748b',
                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Sections Field Editors */}
            {sections
              .filter(s => selectedSectionFilter === 'all' || selectedSectionFilter === s.id)
              .map(section => {
                const secFields = formFields.filter(f => f.section_id === section.id);
                const secData = customData[section.id] || {};

                return (
                  <div key={section.id} style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                        <i className={`fas ${section.icon || 'fa-layer-group'}`} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{section.name}</h3>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{secFields.length} Defined Schema Fields</span>
                      </div>
                    </div>

                    {secFields.length === 0 ? (
                      <div style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No fields defined for this section in the current typology.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {secFields.map(field => {
                          const isHidden = curationData.hidden_fields?.includes(field.id);
                          const isLocked = curationData.field_locks?.includes(field.id);
                          const dist = curationData.distribution_overrides?.[field.id] || { main_site: true, minisite: true };
                          const val = secData[field.name];

                          return (
                            <div
                              key={field.id}
                              style={{
                                padding: '1.25rem', borderRadius: '14px',
                                background: isHidden ? '#f8fafc' : '#fff',
                                border: '1px solid',
                                borderColor: isHidden ? '#cbd5e1' : '#f1f5f9',
                                display: 'flex', flexDirection: 'column', gap: '0.75rem'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{field.label}</strong>
                                  <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
                                    {field.name} ({field.field_type})
                                  </span>
                                </div>

                                {/* Controls */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  {/* Omnichannel Distribution */}
                                  <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                                    <button
                                      type="button"
                                      onClick={() => toggleFieldDistribution(field.id, 'main_site')}
                                      style={{
                                        border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
                                        background: dist.main_site ? '#D4AF37' : 'transparent',
                                        color: dist.main_site ? '#fff' : '#64748b'
                                      }}
                                    >
                                      Main Site
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleFieldDistribution(field.id, 'minisite')}
                                      style={{
                                        border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
                                        background: dist.minisite ? '#0f172a' : 'transparent',
                                        color: dist.minisite ? '#D4AF37' : '#64748b'
                                      }}
                                    >
                                      Minisite
                                    </button>
                                  </div>

                                  {/* Lock */}
                                  <button
                                    type="button"
                                    onClick={() => toggleFieldLock(field.id)}
                                    style={{
                                      border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                                      background: isLocked ? '#fee2e2' : '#fff', color: isLocked ? '#b91c1c' : '#64748b'
                                    }}
                                  >
                                    <i className={isLocked ? "fas fa-lock" : "fas fa-lock-open"} /> {isLocked ? 'LOCKED' : 'LOCK'}
                                  </button>

                                  {/* Visibility */}
                                  <button
                                    type="button"
                                    onClick={() => toggleFieldHidden(field.id)}
                                    style={{
                                      border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                                      background: isHidden ? '#ef4444' : '#fff', color: isHidden ? '#fff' : '#64748b'
                                    }}
                                  >
                                    <i className={isHidden ? "fas fa-eye-slash" : "fas fa-eye"} /> {isHidden ? 'HIDDEN' : 'VISIBLE'}
                                  </button>
                                </div>
                              </div>

                              {/* Live Value Editor */}
                              <div>
                                {field.field_type === 'textarea' || field.field_type === 'rich_text' ? (
                                  <textarea
                                    rows={3}
                                    value={typeof val === 'string' ? val : (val !== undefined ? JSON.stringify(val) : '')}
                                    onChange={(e) => handleCustomDataChange(section.id, field.name, e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                                  />
                                ) : field.field_type === 'boolean' ? (
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!val}
                                      onChange={(e) => handleCustomDataChange(section.id, field.name, e.target.checked)}
                                      style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }}
                                    />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{val ? 'Enabled / True' : 'Disabled / False'}</span>
                                  </label>
                                ) : (
                                  <input
                                    type="text"
                                    value={typeof val === 'string' ? val : (val !== undefined ? JSON.stringify(val) : '')}
                                    onChange={(e) => handleCustomDataChange(section.id, field.name, e.target.value)}
                                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                                  />
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: INTERACTIVE WIDGETS & COMPONENTS                            */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'components' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                Section Dynamic Components (Repeatable Instances)
              </h3>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                Manage interactive repeaters like FAQs, Pricing tiers, Testimonial cards, and Team rosters attached to this business.
              </p>

              {components.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fas fa-puzzle-piece fa-3x" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <div>No interactive component types defined for these sections yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {components.map(comp => (
                    <div key={comp.id} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>
                            {comp.label} ({comp.component_type})
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            Assigned to: {comp.section_id}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addComponentInstance(comp.id)}
                          style={{
                            padding: '0.4rem 1rem', borderRadius: '8px', background: '#0f172a',
                            color: '#D4AF37', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer'
                          }}
                        >
                          + Add New {comp.label}
                        </button>
                      </div>

                      {comp.instances.length === 0 ? (
                        <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          No items added yet. Click &quot;Add New {comp.label}&quot; to populate.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {comp.instances.map((inst, idx) => (
                            <div key={idx} style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Item Title / Header"
                                  value={inst.title || ''}
                                  onChange={(e) => updateComponentInstance(comp.id, idx, 'title', e.target.value)}
                                  style={{ fontWeight: 800, fontSize: '0.85rem', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '60%' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <select
                                    value={inst.status || 'published'}
                                    onChange={(e) => updateComponentInstance(comp.id, idx, 'status', e.target.value)}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removeComponentInstance(comp.id, idx)}
                                    style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                                  >
                                    <i className="fas fa-trash" />
                                  </button>
                                </div>
                              </div>

                              {/* Key-Value Quick Editor */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                {['content', 'description', 'price', 'role', 'subtitle', 'features'].map(prop => (
                                  <div key={prop}>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                      {prop}
                                    </label>
                                    <input
                                      type="text"
                                      value={inst.data?.[prop] !== undefined ? String(inst.data[prop]) : ''}
                                      onChange={(e) => updateComponentInstanceData(comp.id, idx, prop, e.target.value)}
                                      placeholder={`e.g. ${prop}...`}
                                      style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: SECTION BLOGS & EDITORIAL                                  */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'blogs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                    Section Stories &amp; Blog Posts
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Curate and publish in-depth stories, chef specials, or heritage updates linked to specific sections.
                  </p>
                </div>
              </div>

              {blogs.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fas fa-newspaper fa-3x" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <div>No blog posts authored for this business yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {blogs.map(blog => (
                    <div key={blog.id} style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <input
                            type="text"
                            value={blog.title}
                            onChange={(e) => updateBlogPost(blog.id, { title: e.target.value })}
                            style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '380px' }}
                          />
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                            Section: {blog.section_name || blog.section_id}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {/* Channel Toggles */}
                          <button
                            type="button"
                            onClick={() => updateBlogPost(blog.id, { show_on_minisite: !blog.show_on_minisite })}
                            style={{
                              padding: '4px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                              background: blog.show_on_minisite ? '#0f172a' : '#e2e8f0',
                              color: blog.show_on_minisite ? '#D4AF37' : '#94a3b8'
                            }}
                          >
                            Minisite
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlogPost(blog.id, { show_on_main: !blog.show_on_main })}
                            style={{
                              padding: '4px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                              background: blog.show_on_main ? '#D4AF37' : '#e2e8f0',
                              color: blog.show_on_main ? '#1a1000' : '#94a3b8'
                            }}
                          >
                            Main Site
                          </button>
                          
                          {/* Status */}
                          <select
                            value={blog.status}
                            onChange={(e) => updateBlogPost(blog.id, { status: e.target.value })}
                            style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 800 }}
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                          </select>
                        </div>
                      </div>

                      {/* Content excerpt editor */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>
                          STORY CONTENT / EXCERPT
                        </label>
                        <textarea
                          rows={3}
                          value={blog.content || blog.excerpt || ''}
                          onChange={(e) => updateBlogPost(blog.id, { content: e.target.value, excerpt: e.target.value.substring(0, 160) })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: BRAND & PLATFORM TRUST GOVERNANCE                          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'governance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                Heritage Trust, Subscription &amp; Brand Presentation
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* Trust Badges */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 900, color: '#1e293b' }}>
                    Authenticity &amp; Authority Badges
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>Verified Heritage Business</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Displays golden &quot;TRUSTED&quot; shield across registry &amp; minisite</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!businessUpdates.is_trusted}
                        onChange={(e) => setBusinessUpdates(prev => ({ ...prev, is_trusted: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                      />
                    </label>

                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>Master Blueprint Template</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Designates as archetype for this typology</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!businessUpdates.is_master}
                        onChange={(e) => setBusinessUpdates(prev => ({ ...prev, is_master: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }}
                      />
                    </label>

                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>Featured Spotlight</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Boosted placement on main search index</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!businessUpdates.is_featured}
                        onChange={(e) => setBusinessUpdates(prev => ({ ...prev, is_featured: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
                      />
                    </label>
                  </div>
                </div>

                {/* Tier & Status */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 900, color: '#1e293b' }}>
                    Subscription Tier &amp; Minisite Lifecycle
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                        SUBSCRIPTION TIER
                      </label>
                      <select
                        value={businessUpdates.subscription_tier || 'free'}
                        onChange={(e) => setBusinessUpdates(prev => ({ ...prev, subscription_tier: e.target.value }))}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        <option value="free">Free Tier</option>
                        <option value="basic">Basic Tier</option>
                        <option value="premium">Premium Tier</option>
                        <option value="gold">Gold Tier</option>
                        <option value="vip">VIP Tier</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                        REGISTRY STATUS
                      </label>
                      <select
                        value={businessUpdates.status || 'active'}
                        onChange={(e) => setBusinessUpdates(prev => ({ ...prev, status: e.target.value }))}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        <option value="active">Active (Visible)</option>
                        <option value="pending">Pending Review</option>
                        <option value="suspended">Suspended (Offline)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Brand Logo Presentation */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 900, color: '#1e293b' }}>
                    Brand Logo &amp; Hero Sizing
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                        LOGO URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={customData?.basic?.business_logo || customData?.business_info?.business_logo || ''}
                        onChange={(e) => handleCustomDataChange('basic', 'business_logo', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                          LOGO SIZE
                        </label>
                        <select
                          value={customData?.basic?.logo_size || 'lg'}
                          onChange={(e) => handleCustomDataChange('basic', 'logo_size', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          <option value="sm">Small (48px)</option>
                          <option value="md">Medium (72px)</option>
                          <option value="lg">Large (96px)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.3rem' }}>
                          LOGO POSITION
                        </label>
                        <select
                          value={customData?.basic?.logo_position || 'left'}
                          onChange={(e) => handleCustomDataChange('basic', 'logo_position', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          <option value="left">Left Aligned</option>
                          <option value="center">Centered</option>
                          <option value="right">Right Aligned</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── WHATSAPP INVITE MODAL ── */}
      <WhatsAppInviteModal
        businessId={business.id}
        businessName={business.name}
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </main>
  );
}
