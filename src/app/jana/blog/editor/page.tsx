'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RichBlogEditor from '@/components/RichBlogEditor';

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface BusinessOption {
  id: string;
  name: string;
  slug: string;
  type_name?: string;
}

const SECTION_OPTIONS = [
  { id: 'sec_1_identity', label: '1. Identity & Core Story (الهوية والقصة الأساسية)' },
  { id: 'sec_2_story', label: '2. Heritage & Legacy (التراث والقصة التأسيسية)' },
  { id: 'sec_3_facilities', label: '3. Facilities & Rooms (المرافق والغرف والإقامة)' },
  { id: 'sec_4_amenities', label: '4. Amenities & Comfort (وسائل الراحة والخدمات)' },
  { id: 'sec_5_experiences', label: '5. Tours & Experiences (الجولات والرحلات والتجارب)' },
  { id: 'sec_6_gallery', label: '6. Visual Media Gallery (المعرض البصري)' },
  { id: 'sec_7_reviews', label: '7. Guest Reviews & Praise (آراء الضيوف والتقييمات)' },
  { id: 'sec_8_policies', label: '8. Rules & Booking Policies (السياسات والشروط)' },
  { id: 'sec_9_marketplace_catalog', label: '9. Packages & Special Offers (الباقات والعروض الخاصة)' },
  { id: 'sec_10_contact', label: '10. Contact & Location Guide (التواصل والوصول)' },
];

const TEMPLATE_TYPOLOGIES = [
  { id: 'hotel', label: '🏨 Hotel & Resort (الفنادق والمنتجعات)' },
  { id: 'siwa_lodge', label: '🏡 Siwa Traditional Lodge (اللوجات البيئية السيوية)' },
  { id: 'desert_camp', label: '⛺ Desert Safari Camp (مخيمات السفاري والصحراء)' },
  { id: 'eco_lodge', label: '🌿 Eco Lodge & Retreat (منتجعات الاسترخاء البيئي)' },
  { id: 'restaurant', label: '🍽️ Restaurant & Dining (المطاعم والمأكولات)' },
  { id: 'siwan_kitchen', label: '🥘 Siwan Traditional Kitchen (المطابخ السيوية التراثية)' },
  { id: 'safari_4x4', label: '🚙 Safari & 4x4 Expedition (رحلات السفاري والدفع الرباعي)' },
  { id: 'nature_tour', label: '🌴 Nature & Lake Tours (جولات الطبيعة والبحيرات)' },
  { id: 'heritage_tour', label: '🏛️ Cultural & Historical Tours (الجولات التراثية والتاريخية)' },
  { id: 'artisan_shop', label: '🏺 Artisan & Handmade Crafts (الحرف اليدوية والمنتجات)' },
];

const LANDING_PAGES = [
  { slug: '/journey-builder-advanced', label: '🧭 Custom Journey Builder (/journey-builder-advanced)' },
  { slug: '/experiences', label: '✨ Experiences & Activities (/experiences)' },
  { slug: '/salt-lakes', label: '🌊 Salt Lakes & Wellness Guide (/salt-lakes)' },
  { slug: '/safari', label: '🚙 Great Sand Sea Safari (/safari)' },
  { slug: '/about', label: '🏛️ About Siwa Oasis Guide (/about)' },
];

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: null as number | null,
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    published_at: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    tags: [] as string[],
    // Smart Target Distribution
    target_type: 'mainsite' as 'mainsite' | 'business_minisite' | 'business_section' | 'template_typology' | 'landing_page',
    target_business_id: '' as string,
    target_section_id: 'sec_1_identity' as string,
    target_template_id: 'hotel' as string,
    target_page_slug: '/experiences' as string,
  });

  useEffect(() => {
    loadCategories();
    loadTags();
    loadBusinesses();
    if (postId) {
      loadPost();
    }
  }, [postId]);

  async function loadCategories() {
    try {
      const res = await fetch('/api/jana/blog/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  }

  async function loadTags() {
    try {
      const res = await fetch('/api/jana/blog/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch (e) {
      console.error('Failed to load tags:', e);
    }
  }

  async function loadBusinesses() {
    try {
      const res = await fetch('/api/jana/whatsapp-outreach');
      if (res.ok) {
        const data = await res.json();
        if (data.businesses) {
          setBusinesses(data.businesses);
        }
      }
    } catch (e) {
      console.error('Failed to load businesses:', e);
    }
  }

  async function loadPost() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/blog/${postId}`);
      if (res.ok) {
        const data = await res.json();
        const post = data.post || data;
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          featured_image: post.featured_image || '',
          category_id: post.category_id || null,
          status: post.status || 'draft',
          published_at: post.published_at || '',
          meta_title: post.meta_title || '',
          meta_description: post.meta_description || '',
          meta_keywords: post.meta_keywords || '',
          tags: post.tags?.map((t: any) => t.name) || [],
          target_type: post.target_type || 'mainsite',
          target_business_id: post.target_business_id || '',
          target_section_id: post.target_section_id || 'sec_1_identity',
          target_template_id: post.target_template_id || 'hotel',
          target_page_slug: post.target_page_slug || '/experiences',
        });
      }
    } catch (e) {
      console.error('Failed to load post:', e);
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function handleTitleChange(title: string) {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title,
    }));
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmed],
      }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }

  async function savePost(status: 'draft' | 'published' | 'scheduled') {
    if (!formData.title || !formData.content) {
      alert('Title and content are required');
      return;
    }

    if (
      (formData.target_type === 'business_minisite' || formData.target_type === 'business_section') &&
      !formData.target_business_id
    ) {
      alert('Please select a target business for this blog post.');
      return;
    }

    setSaving(true);
    try {
      const url = postId ? `/api/jana/blog/${postId}` : '/api/jana/blog';
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status,
        }),
      });

      if (res.ok) {
        alert(`✅ Post ${status === 'published' ? 'published' : 'saved'} successfully and synced to target!`);
        router.push('/jana/blog');
      } else {
        const error = await res.json();
        alert('❌ Failed to save: ' + (error.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('❌ Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const selectedBiz = businesses.find((b) => b.id === formData.target_business_id);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  boxShadow: '0 8px 20px rgba(59,130,246,0.4)',
                }}
              >
                ✏️
              </div>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  {postId ? 'Edit Blog Post' : 'Create & Distribute Blog Post'}
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Write, customize, and choose exactly where this story appears (Mainsite, Business Minisite, Section, Template, or Landing Page)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href="/jana/blog"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                ← Back to List
              </Link>
            </div>
          </div>
        </div>

        {/* 🎯 SMART MULTI-TARGET DISTRIBUTION SELECTOR */}
        <div
          style={{
            background: '#fff',
            borderRadius: '18px',
            padding: '1.75rem',
            marginBottom: '2rem',
            border: '2px solid #3b82f6',
            boxShadow: '0 8px 30px rgba(59,130,246,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🎯</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                Publishing Destination & Placement Scope (محدد وجهة ومكان النشر)
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Choose where this blog story should be injected and published.
              </div>
            </div>
          </div>

          {/* TARGET SCOPE TABS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { id: 'mainsite', icon: '🌐', label: 'Main Portal Blog', desc: 'siwify.com/blog & homepage feed' },
              { id: 'business_section', icon: '📑', label: 'Business Section Blog', desc: 'Injected into specific section tab' },
              { id: 'business_minisite', icon: '🏢', label: 'Business Minisite', desc: 'Minisite general blog feed' },
              { id: 'template_typology', icon: '🎨', label: 'Category Template', desc: 'Across all hotels, camps, etc.' },
              { id: 'landing_page', icon: '🧭', label: 'Static Landing Page', desc: 'Specific guide or journey page' },
            ].map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, target_type: scope.id as any }))}
                style={{
                  padding: '1rem',
                  borderRadius: '14px',
                  border: `2px solid ${formData.target_type === scope.id ? '#3b82f6' : '#e2e8f0'}`,
                  background: formData.target_type === scope.id ? '#eff6ff' : '#fafafa',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{scope.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: formData.target_type === scope.id ? '#1e40af' : '#0f172a' }}>
                  {scope.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{scope.desc}</div>
              </button>
            ))}
          </div>

          {/* TARGET SPECIFIC CONFIGURATION CONTROLS */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* SCOPE 1: MAINSITE */}
            {formData.target_type === 'mainsite' && (
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                ✅ <strong>Main Portal Distribution:</strong> This post will be published on the global blog feed at{' '}
                <code>siwify.com/blog</code> and categorized under your selected category.
              </div>
            )}

            {/* SCOPE 2: BUSINESS MINISITE */}
            {formData.target_type === 'business_minisite' && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  Select Target Business (اختر النشاط التجاري):
                </label>
                <select
                  value={formData.target_business_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, target_business_id: e.target.value }))}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#fff',
                  }}
                >
                  <option value="">-- Choose a business from directory --</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (/{b.slug}) — {b.type_name}
                    </option>
                  ))}
                </select>
                {selectedBiz && (
                  <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                    🔗 Will be published on: <code>https://siwify.com/{selectedBiz.slug}</code>
                  </div>
                )}
              </div>
            )}

            {/* SCOPE 3: BUSINESS SECTION */}
            {formData.target_type === 'business_section' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                    1. Select Target Business (اختر النشاط):
                  </label>
                  <select
                    value={formData.target_business_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_business_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #cbd5e1',
                      fontSize: '0.9rem',
                      background: '#fff',
                    }}
                  >
                    <option value="">-- Choose a business --</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (/{b.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                    2. Select Target Section Tab (اختر القسم):
                  </label>
                  <select
                    value={formData.target_section_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_section_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #cbd5e1',
                      fontSize: '0.9rem',
                      background: '#fff',
                    }}
                  >
                    {SECTION_OPTIONS.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBiz && formData.target_section_id && (
                  <div style={{ gridColumn: '1 / -1', padding: '0.6rem 0.9rem', background: '#eff6ff', borderRadius: '10px', fontSize: '0.8rem', color: '#1e40af' }}>
                    ⚡ <strong>Direct Section Injection:</strong> Saving will immediately sync this blog into{' '}
                    <code>
                      https://siwify.com/{selectedBiz.slug}/{formData.target_section_id}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* SCOPE 4: TEMPLATE TYPOLOGY */}
            {formData.target_type === 'template_typology' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                    Select Business Typology Template (تصنيف القالب):
                  </label>
                  <select
                    value={formData.target_template_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_template_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #cbd5e1',
                      fontSize: '0.9rem',
                      background: '#fff',
                    }}
                  >
                    {TEMPLATE_TYPOLOGIES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                    Default Section Placement (القسم الافتراضي):
                  </label>
                  <select
                    value={formData.target_section_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_section_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #cbd5e1',
                      fontSize: '0.9rem',
                      background: '#fff',
                    }}
                  >
                    {SECTION_OPTIONS.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* SCOPE 5: LANDING PAGE */}
            {formData.target_type === 'landing_page' && (
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                  Select Target Landing Page (اختر صفحة الهبوط):
                </label>
                <select
                  value={formData.target_page_slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, target_page_slug: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#fff',
                  }}
                >
                  {LANDING_PAGES.map((page) => (
                    <option key={page.slug} value={page.slug}>
                      {page.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* MAIN EDITOR FORM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
          {/* LEFT: TITLE, EXCERPT, RICH CONTENT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Title */}
            <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Article Title (عنوان المقال) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Discovering the Ancient Healing Salt Lakes of Siwa"
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Slug:</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Summary / Excerpt (الموجز / الوصف المختصر)
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="A short compelling summary of this story..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Content Editor */}
            <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                Full Article Content & Media (محتوى المقال الكامل والوسائط) *
              </label>
              <RichBlogEditor
                value={formData.content}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                placeholder="Write your story, insert images, format headings, add quotes..."
              />
            </div>
          </div>

          {/* RIGHT SIDEBAR: PUBLISH, CATEGORY, MEDIA, TAGS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Publish Actions */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                Publishing Actions
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => savePost('published')}
                  disabled={saving}
                  style={{
                    padding: '0.9rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #15803d, #22c55e)',
                    color: '#fff',
                    border: 0,
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    cursor: saving ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                  }}
                >
                  {saving ? 'Publishing...' : '🚀 Publish Now'}
                </button>

                <button
                  type="button"
                  onClick={() => savePost('draft')}
                  disabled={saving}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: saving ? 'wait' : 'pointer',
                  }}
                >
                  💾 Save as Draft
                </button>
              </div>
            </div>

            {/* Category */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Category (التصنيف)
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value ? Number(e.target.value) : null }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  background: '#fff',
                }}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Image */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Featured Image (الصورة البارزة)
              </label>
              <input
                type="url"
                value={formData.featured_image}
                onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.value }))}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  marginBottom: '0.75rem',
                }}
              />
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt="Preview"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px' }}
                />
              )}
            </div>

            {/* Tags */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Tags (الوسوم)
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                  placeholder="Add tag..."
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  style={{ padding: '0.5rem 0.85rem', background: '#0f172a', color: '#fff', border: 0, borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '50px',
                      background: '#f1f5f9',
                      color: '#1e293b',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>⏳ Loading Blog Editor...</div>}>
      <BlogEditorContent />
    </Suspense>
  );
}
