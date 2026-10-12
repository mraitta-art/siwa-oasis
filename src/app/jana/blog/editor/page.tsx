'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RichBlogEditor from '@/components/RichBlogEditor';
import { resolveSectionId } from '@/lib/section-registry';

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
  type_id?: string;
  type_name?: string;
  parent_type_id?: string | null;
  parent_type_name?: string | null;
  published?: boolean | number;
}

interface BusinessTypeOption {
  id: string;
  name: string;
  parent_id?: string | null;
}

interface SectionCatalogItem {
  id: string;
  label: string;
  available: { en: boolean; ar: boolean };
}

interface TemplateSectionOption {
  id: string;
  name: string;
}

interface SiteBlogLocation {
  path: string;
  title: string;
  hasBlogBlock: boolean;
  isSearch: boolean;
}

type MinisiteBuildMode = 'section_based' | 'builder';

interface SectionBlogConflict {
  id?: string;
  postId?: string;
  title: string;
  status: string;
  source: 'blog_post' | 'section_blog';
  content: string;
  excerpt: string;
  language: string;
}

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

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [parentTypes, setParentTypes] = useState<BusinessTypeOption[]>([]);
  const [childTypes, setChildTypes] = useState<BusinessTypeOption[]>([]);
  const [selectedParentType, setSelectedParentType] = useState('');
  const [selectedChildType, setSelectedChildType] = useState('');
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [businessLoadError, setBusinessLoadError] = useState('');
  const [sectionPolicyLoading, setSectionPolicyLoading] = useState(false);
  const [sectionPolicyError, setSectionPolicyError] = useState('');
  const [sectionPolicyBusinessId, setSectionPolicyBusinessId] = useState('');
  const [minisiteBuildMode, setMinisiteBuildMode] = useState<MinisiteBuildMode | null>(null);
  const [availableBusinessSections, setAvailableBusinessSections] = useState<SectionCatalogItem[]>([]);
  const [templateSectionOptions, setTemplateSectionOptions] = useState<TemplateSectionOption[]>([]);
  const [templateSectionsError, setTemplateSectionsError] = useState('');
  const [siteBlogLocations, setSiteBlogLocations] = useState<SiteBlogLocation[]>([]);
  const [siteBlogLocationsLoading, setSiteBlogLocationsLoading] = useState(true);
  const [siteBlogLocationsError, setSiteBlogLocationsError] = useState('');
  const [minisiteBlogReady, setMinisiteBlogReady] = useState<boolean | null>(null);
  const [checkingMinisite, setCheckingMinisite] = useState(false);
  const [sectionBlogConflict, setSectionBlogConflict] = useState<SectionBlogConflict | null>(null);
  const [checkingSectionBlog, setCheckingSectionBlog] = useState(false);
  const [sectionBlogCheckError, setSectionBlogCheckError] = useState('');
  const [editingSectionBlogId, setEditingSectionBlogId] = useState('');
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
    target_page_slug: '/' as string,
    language: 'en' as 'en' | 'ar' | 'it' | 'de' | 'fr' | 'es',
  });
  const selectedBiz = businesses.find((business) => business.id === formData.target_business_id);
  const sectionOptions = React.useMemo(() => {
    if (!selectedBiz || minisiteBuildMode !== 'section_based' || sectionPolicyBusinessId !== selectedBiz.id || sectionPolicyError) return [];
    return availableBusinessSections;
  }, [availableBusinessSections, minisiteBuildMode, sectionPolicyBusinessId, sectionPolicyError, selectedBiz]);
  const selectedSectionUnavailable = Boolean(
    selectedBiz &&
    sectionPolicyBusinessId === selectedBiz.id &&
    !sectionPolicyLoading &&
    !sectionPolicyError &&
    formData.target_section_id &&
    !sectionOptions.some(section => section.id === formData.target_section_id)
  );
  const availableSectionCount = sectionOptions.filter(section => section.available[formData.language]).length;
  const selectedSiteBlogLocation = siteBlogLocations.find(page => page.path === formData.target_page_slug);
  const visibleChildTypes = childTypes.filter(type => type.parent_id === selectedParentType);
  const visibleBusinesses = businesses.filter(business =>
    (!selectedParentType || business.parent_type_id === selectedParentType) &&
    (!selectedChildType || business.type_id === selectedChildType)
  );

  useEffect(() => {
    loadCategories();
    loadTags();
    loadBusinesses();
    if (postId) {
      loadPost();
    } else {
      const qTargetType = searchParams.get('target_type');
      const qBizId = searchParams.get('businessId') || searchParams.get('business_id');
      const qSecId = searchParams.get('sectionId') || searchParams.get('section_id');
      const qTemplateId = searchParams.get('templateId') || searchParams.get('template_id');
      const qPageSlug = searchParams.get('pageSlug') || searchParams.get('page_slug');
      const qTitle = searchParams.get('title');

      if (qTargetType || qBizId || qSecId || qTemplateId || qPageSlug || qTitle) {
        setFormData((prev) => ({
          ...prev,
          target_type: (qTargetType as any) || (qBizId && qSecId ? 'business_section' : qBizId ? 'business_minisite' : qPageSlug ? 'mainsite' : prev.target_type),
          target_business_id: qBizId || prev.target_business_id,
          target_section_id: qSecId ? resolveSectionId(qSecId) : prev.target_section_id,
          target_template_id: qTemplateId || prev.target_template_id,
          target_page_slug: qPageSlug || prev.target_page_slug,
          title: qTitle || prev.title,
        }));
      }
    }
  }, [postId, searchParams]);

  useEffect(() => {
    loadTemplateSections();
    loadSiteBlogLocations();
  }, []);

  useEffect(() => {
    const refreshLocations = () => {
      if (document.visibilityState === 'visible') loadSiteBlogLocations();
    };
    window.addEventListener('focus', refreshLocations);
    return () => window.removeEventListener('focus', refreshLocations);
  }, []);

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

  async function loadTemplateSections() {
    setTemplateSectionsError('');
    try {
      const response = await fetch('/api/admin/sections?public=true');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load public sections');
      setTemplateSectionOptions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to load template blog section placements:', error);
      setTemplateSectionsError(error instanceof Error ? error.message : 'Unable to load public sections');
    }
  }

  async function loadSiteBlogLocations() {
    setSiteBlogLocationsLoading(true);
    setSiteBlogLocationsError('');
    try {
      const response = await fetch('/api/jana/blog/target/pages', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load main-site pages');
      setSiteBlogLocations(Array.isArray(result.pages) ? result.pages : []);
    } catch (error) {
      console.error('Failed to load main-site blog locations:', error);
      setSiteBlogLocationsError(error instanceof Error ? error.message : 'Unable to load main-site pages');
    } finally {
      setSiteBlogLocationsLoading(false);
    }
  }

  function renderSiteBlogPlacement() {
    const currentLocationIsMissing = Boolean(formData.target_page_slug && !selectedSiteBlogLocation);
    const editSlug = formData.target_page_slug === '/'
      ? 'main'
      : formData.target_page_slug === '/blog'
        ? 'blog'
        : formData.target_page_slug.startsWith('/p/')
          ? formData.target_page_slug.slice('/p/'.length)
          : formData.target_page_slug.split('/').filter(Boolean).pop() || 'main';

    return (
      <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
          Main-site page location
          <select
            value={formData.target_page_slug}
            disabled={siteBlogLocationsLoading || Boolean(siteBlogLocationsError) || siteBlogLocations.length === 0}
            onChange={event => setFormData(prev => ({ ...prev, target_page_slug: event.target.value }))}
            style={targetSelectStyle}
          >
            {currentLocationIsMissing && <option value={formData.target_page_slug} disabled>Page removed or unavailable — choose an active page</option>}
            {siteBlogLocations.map(page => (
              <option key={page.path} value={page.path}>
                {page.title} ({page.path})
              </option>
            ))}
          </select>
        </label>
        {siteBlogLocationsLoading && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading current website pages…</div>}
        {siteBlogLocationsError && <div role="alert" style={{ fontSize: '0.8rem', color: '#b91c1c' }}>Could not load website pages: {siteBlogLocationsError}</div>}
        {!siteBlogLocationsLoading && !siteBlogLocationsError && siteBlogLocations.length === 0 && (
          <div role="alert" style={{ fontSize: '0.8rem', color: '#b91c1c' }}>No configured website pages are available for blog placement.</div>
        )}
        {currentLocationIsMissing && <div role="alert" style={{ fontSize: '0.8rem', color: '#b45309' }}>This post’s previous page no longer exists. Choose an active page to place it again.</div>}
        {selectedSiteBlogLocation && (
          <div role="status" style={{ fontSize: '0.8rem', color: selectedSiteBlogLocation.hasBlogBlock ? '#166534' : '#b45309' }}>
            {selectedSiteBlogLocation.hasBlogBlock
              ? `Blog location is ready on ${selectedSiteBlogLocation.title}.`
              : <>Add a Blog component to this page before publishing. <Link href={`/jana/website?page=${encodeURIComponent(editSlug)}`} target="_blank">Open this page in the Visual Editor</Link>.</>}
          </div>
        )}
        <button
          type="button"
          onClick={loadSiteBlogLocations}
          disabled={siteBlogLocationsLoading}
          style={{ justifySelf: 'start', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.7rem', background: '#fff', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Refresh page list
        </button>
      </div>
    );
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
      setBusinessesLoading(true);
      setBusinessLoadError('');
      const [businessResponse, parentResponse] = await Promise.all([
        fetch(`/api/jana/businesses?includeType=true&t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/business-types?is_parent=true&t=${Date.now()}`, { cache: 'no-store' }),
      ]);
      const businessData = await businessResponse.json();
      const parentData = await parentResponse.json();
      if (!businessResponse.ok) throw new Error(businessData.error || 'Unable to load businesses');
      if (!parentResponse.ok) throw new Error(parentData.error || 'Unable to load business categories');

      const businessList: BusinessOption[] = Array.isArray(businessData) ? businessData : [];
      const parents: BusinessTypeOption[] = Array.isArray(parentData) ? parentData : [];
      const childResponse = parents.length
        ? await fetch(`/api/business-types?parent_ids=${parents.map(type => encodeURIComponent(type.id)).join(',')}&t=${Date.now()}`, { cache: 'no-store' })
        : null;
      const childData = childResponse ? await childResponse.json() : [];
      if (childResponse && !childResponse.ok) throw new Error(childData.error || 'Unable to load business types');

      setBusinesses(businessList);
      setParentTypes(parents);
      setChildTypes(Array.isArray(childData) ? childData : []);
    } catch (error) {
      console.error('Failed to load blog target businesses:', error);
      setBusinessLoadError(error instanceof Error ? error.message : 'Unable to load businesses');
      setBusinesses([]);
    } finally {
      setBusinessesLoading(false);
    }
  }

  useEffect(() => {
    const selected = businesses.find(business => business.id === formData.target_business_id);
    if (!selected) return;
    setSelectedParentType(selected.parent_type_id || '');
    setSelectedChildType(selected.type_id || '');
  }, [businesses, formData.target_business_id]);

  useEffect(() => {
    if (!selectedBiz) {
      setAvailableBusinessSections([]);
      setSectionPolicyBusinessId('');
      setSectionPolicyError('');
      setSectionPolicyLoading(false);
      setMinisiteBuildMode(null);
      return;
    }

    const controller = new AbortController();
    setAvailableBusinessSections([]);
    setSectionPolicyBusinessId('');
    setSectionPolicyError('');
    setMinisiteBuildMode(null);
    setSectionPolicyLoading(true);
    const sectionParams = new URLSearchParams({
      business_id: selectedBiz.id,
      language: formData.language,
      t: String(Date.now()),
    });
    if (postId) sectionParams.set('exclude_post_id', postId);
    if (editingSectionBlogId) sectionParams.set('exclude_section_blog_id', editingSectionBlogId);
    fetch(`/api/jana/blog/target/sections?${sectionParams.toString()}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load visible minisite sections');
        return result;
      })
      .then(result => {
        setMinisiteBuildMode(result.mode === 'builder' ? 'builder' : 'section_based');
        const sections = Array.isArray(result.sections) ? result.sections : [];
        setAvailableBusinessSections(sections.map((section: SectionCatalogItem) => ({
          id: section.id,
          label: section.label,
          available: {
            en: Boolean(section.available?.en),
            ar: Boolean(section.available?.ar),
          },
        })));
        setSectionPolicyBusinessId(selectedBiz.id);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('Unable to load visible business minisite sections:', error);
          setSectionPolicyError(error instanceof Error ? error.message : 'Unable to load visible business minisite sections');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSectionPolicyLoading(false);
      });

    return () => controller.abort();
  }, [editingSectionBlogId, formData.language, postId, selectedBiz]);

  useEffect(() => {
    if (!selectedBiz || !minisiteBuildMode || sectionPolicyBusinessId !== selectedBiz.id || postId) return;
    const expectedTarget = minisiteBuildMode === 'builder' ? 'business_minisite' : 'business_section';
    if (formData.target_type === 'business_minisite' || formData.target_type === 'business_section') {
      if (formData.target_type !== expectedTarget) {
        setFormData(prev => ({ ...prev, target_type: expectedTarget, target_section_id: minisiteBuildMode === 'builder' ? '' : prev.target_section_id }));
      }
    }
  }, [formData.target_type, minisiteBuildMode, postId, sectionPolicyBusinessId, selectedBiz]);

  useEffect(() => {
    if (!selectedBiz || businessesLoading || sectionPolicyLoading || sectionPolicyBusinessId !== selectedBiz.id || sectionPolicyError) return;
    if (sectionOptions.some(section => section.id === formData.target_section_id)) return;
    if (postId || editingSectionBlogId) return;
    setFormData(prev => ({ ...prev, target_section_id: sectionOptions[0]?.id || '' }));
  }, [businessesLoading, editingSectionBlogId, formData.target_section_id, postId, sectionOptions, sectionPolicyBusinessId, sectionPolicyError, sectionPolicyLoading, selectedBiz]);

  useEffect(() => {
    const targetBusiness = businesses.find((business) => business.id === formData.target_business_id);
    if (formData.target_type !== 'business_minisite' || !targetBusiness?.slug) {
      setMinisiteBlogReady(null);
      setCheckingMinisite(false);
      return;
    }

    const controller = new AbortController();
    setCheckingMinisite(true);
    setMinisiteBlogReady(null);
    fetch(`/api/jana/minisite-layout?slug=${encodeURIComponent(targetBusiness.slug)}`, { signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to check minisite layout');
        return result;
      })
      .then(result => {
        const components = Array.isArray(result.layout?.components) ? result.layout.components : [];
        setMinisiteBlogReady(components.some((component: { type?: string }) => component.type === 'vendor_blog'));
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('Unable to check whether minisite accepts blog posts:', error);
          setMinisiteBlogReady(false);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingMinisite(false);
      });

    return () => controller.abort();
  }, [businesses, formData.target_business_id, formData.target_type]);

  useEffect(() => {
    if (
      formData.target_type !== 'business_section' ||
      minisiteBuildMode !== 'section_based' ||
      !formData.target_business_id ||
      !formData.target_section_id
    ) {
      setSectionBlogConflict(null);
      setCheckingSectionBlog(false);
      return;
    }

    const controller = new AbortController();
    setCheckingSectionBlog(true);
    setSectionBlogConflict(null);
    setSectionBlogCheckError('');
    const params = new URLSearchParams({
      business_id: formData.target_business_id,
      section_id: formData.target_section_id,
      language: formData.language,
    });
    if (postId) params.set('exclude_post_id', postId);
    if (editingSectionBlogId) params.set('exclude_section_blog_id', editingSectionBlogId);

    fetch(`/api/jana/blog/target?${params.toString()}`, { signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to check section blog');
        return result;
      })
      .then(result => setSectionBlogConflict(result.conflict || null))
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('Unable to check section blog availability:', error);
          setSectionBlogCheckError(error instanceof Error ? error.message : 'Unable to check section blog availability');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingSectionBlog(false);
      });

    return () => controller.abort();
  }, [editingSectionBlogId, formData.language, formData.target_business_id, formData.target_section_id, formData.target_type, minisiteBuildMode, postId]);

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
          target_section_id: post.target_section_id ? resolveSectionId(post.target_section_id) : '',
          target_template_id: post.target_template_id || 'hotel',
          target_page_slug: post.target_page_slug || '/blog',
          language: post.language === 'ar' ? 'ar' : 'en',
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

    if (formData.target_type === 'mainsite' || formData.target_type === 'landing_page') {
      if (siteBlogLocationsLoading) {
        alert('Please wait while the current website pages are loaded.');
        return;
      }
      if (siteBlogLocationsError) {
        alert(`Could not verify the selected page: ${siteBlogLocationsError}`);
        return;
      }
      if (!selectedSiteBlogLocation) {
        alert('Choose an active main-site page for this blog post.');
        return;
      }
      if (status === 'published' && !selectedSiteBlogLocation.hasBlogBlock) {
        alert(`Add a Blog component to ${selectedSiteBlogLocation.title} before publishing this post there.`);
        return;
      }
    }

    if (
      (formData.target_type === 'business_minisite' || formData.target_type === 'business_section') &&
      !formData.target_business_id
    ) {
      alert('Please select a target business for this blog post.');
      return;
    }
    if (['business_minisite', 'business_section'].includes(formData.target_type)) {
      if (sectionPolicyLoading || !minisiteBuildMode) {
        alert('Please wait while this business minisite type is checked.');
        return;
      }
      if (sectionPolicyError) {
        alert(`Could not verify this business minisite: ${sectionPolicyError}`);
        return;
      }
      if (formData.target_type === 'business_section') {
        if (minisiteBuildMode !== 'section_based') {
          alert('Business Section Blog can only be used with a section-based minisite.');
          return;
        }
        if (!sectionOptions.some(section => section.id === formData.target_section_id)) {
          alert('Choose an essential section currently shown on this business minisite before saving.');
          return;
        }
      } else if (minisiteBuildMode !== 'builder') {
        alert('Business Minisite blog feed can only be used with a custom-builder minisite.');
        return;
      }
    }
    if (status === 'published' && formData.target_type === 'business_minisite' && minisiteBlogReady !== true) {
      alert('Add the Vendor Blog block to this business minisite before publishing to its blog feed.');
      return;
    }
    if (formData.target_type === 'business_section' &&
        (checkingSectionBlog || sectionBlogCheckError ||
          (sectionBlogConflict && sectionBlogConflict.id !== editingSectionBlogId))) {
      alert(checkingSectionBlog
        ? 'Please wait while the selected section blog availability is checked.'
        : sectionBlogCheckError || `This section already has a ${formData.language === 'ar' ? 'Arabic' : 'English'} blog: "${sectionBlogConflict?.title}". Edit it or choose another language.`);
      return;
    }

    setSaving(true);
    try {
      const editingLegacySectionBlog = Boolean(editingSectionBlogId);
      const url = editingLegacySectionBlog
        ? '/api/jana/blog/target'
        : postId ? `/api/jana/blog/${postId}` : '/api/jana/blog';
      const method = editingLegacySectionBlog || postId ? 'PUT' : 'POST';
      const payload = editingLegacySectionBlog
        ? {
          blog_id: editingSectionBlogId,
          business_id: formData.target_business_id,
          section_id: formData.target_section_id,
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          language: formData.language,
          add_to_section_content: formData.target_type === 'business_section',
        }
        : {
          ...formData,
          target_section_id: formData.target_type === 'business_minisite' ? null : formData.target_section_id,
          status,
        };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(editingLegacySectionBlog
          ? '✅ Existing section blog updated successfully.'
          : `✅ Post ${status === 'published' ? 'published' : 'saved'} successfully and synced to target!`);
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
              { id: 'mainsite', icon: '🌐', label: 'Main Site Page', desc: 'Choose the exact website page where this post appears' },
              { id: 'business_section', icon: '📑', label: 'Business Section Blog', desc: minisiteBuildMode === 'builder' ? 'Only for section-based minisites' : 'Injected into an essential visible section tab' },
              { id: 'business_minisite', icon: '🏢', label: 'Business Minisite', desc: minisiteBuildMode === 'section_based' ? 'Only for custom builder minisites' : 'General feed on a custom builder minisite' },
              { id: 'template_typology', icon: '🎨', label: 'Category Template', desc: 'Across all hotels, camps, etc.' },
              { id: 'landing_page', icon: '🧭', label: 'Static Landing Page', desc: 'Specific guide or journey page' },
            ].map((scope) => {
              const incompatible = Boolean(
                selectedBiz &&
                minisiteBuildMode &&
                ((scope.id === 'business_section' && minisiteBuildMode !== 'section_based') ||
                  (scope.id === 'business_minisite' && minisiteBuildMode !== 'builder'))
              );
              return (
              <button
                key={scope.id}
                type="button"
                disabled={incompatible}
                onClick={() => setFormData((prev) => ({
                  ...prev,
                  target_type: scope.id as any,
                  target_section_id: scope.id === 'business_minisite' ? '' : prev.target_section_id,
                }))}
                style={{
                  padding: '1rem',
                  borderRadius: '14px',
                  border: `2px solid ${formData.target_type === scope.id ? '#3b82f6' : '#e2e8f0'}`,
                  background: incompatible ? '#f1f5f9' : formData.target_type === scope.id ? '#eff6ff' : '#fafafa',
                  textAlign: 'left',
                  cursor: incompatible ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: incompatible ? 0.55 : 1,
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{scope.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: formData.target_type === scope.id ? '#1e40af' : '#0f172a' }}>
                  {scope.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{scope.desc}</div>
              </button>
              );
            })}
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
            {(formData.target_type === 'business_minisite' || formData.target_type === 'business_section') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                  Parent business category
                  <select
                    value={selectedParentType}
                    onChange={event => {
                      setSelectedParentType(event.target.value);
                      setSelectedChildType('');
                      setFormData(prev => ({ ...prev, target_business_id: '' }));
                    }}
                    style={targetSelectStyle}
                  >
                    <option value="">Choose a parent category</option>
                    {parentTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                  Child business type
                  <select
                    value={selectedChildType}
                    disabled={!selectedParentType}
                    onChange={event => {
                      setSelectedChildType(event.target.value);
                      setFormData(prev => ({ ...prev, target_business_id: '' }));
                    }}
                    style={targetSelectStyle}
                  >
                    <option value="">All child types</option>
                    {visibleChildTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                  Business / minisite
                  <select
                    value={formData.target_business_id}
                    disabled={!selectedParentType || businessesLoading || businesses.length === 0}
                    onChange={event => setFormData(prev => ({ ...prev, target_business_id: event.target.value }))}
                    style={targetSelectStyle}
                  >
                    <option value="">Choose a business</option>
                    {visibleBusinesses.map(business => (
                      <option key={business.id} value={business.id}>
                        {business.name} (/{business.slug}) — {business.type_name || 'Business'}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                  Blog language
                  <select
                    value={formData.language}
                    onChange={event => setFormData(prev => ({ ...prev, language: event.target.value as 'en' | 'ar' | 'it' | 'de' | 'fr' | 'es' }))}
                    style={targetSelectStyle}
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="ar">🇸🇦 العربية (Arabic)</option>
                    <option value="it">🇮🇹 Italiano (Italian)</option>
                    <option value="de">🇩🇪 Deutsch (German)</option>
                    <option value="fr">🇫🇷 Français (French)</option>
                    <option value="es">🇪🇸 Español (Spanish)</option>
                  </select>
                </label>
                {businessLoadError && <div role="alert" style={{ gridColumn: '1 / -1', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700 }}>{businessLoadError}</div>}
                {businessesLoading && <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: '0.8rem' }}>Loading business directory…</div>}
                {!businessLoadError && !businessesLoading && businesses.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: '0.8rem' }}>No businesses are available to select.</div>}
              </div>
            )}

            {/* SCOPE 1: MAINSITE */}
            {formData.target_type === 'mainsite' && (
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                ✅ <strong>Main-site placement:</strong> choose a page with a Blog component. Blog category remains attached to the post regardless of its page.
                {renderSiteBlogPlacement()}
              </div>
            )}

            {/* SCOPE 2: BUSINESS MINISITE */}
            {formData.target_type === 'business_minisite' && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {minisiteBuildMode === 'builder' && selectedBiz && (
                  <div style={{ fontSize: '0.8rem', color: minisiteBlogReady ? '#16a34a' : '#b45309' }}>
                    {checkingMinisite ? 'Checking minisite blog setup…' : minisiteBlogReady
                      ? <>✅ Blog feed is enabled. Publish on: <a href={`/${selectedBiz.slug}`} target="_blank" rel="noreferrer">/{selectedBiz.slug}</a></>
                      : <>⚠️ This minisite does not have a Vendor Blog block yet. <Link href={`/jana/minisite-builder?slug=${encodeURIComponent(selectedBiz.slug)}`} target="_blank">Open its minisite builder</Link> and add the block.</>}
                  </div>
                )}
                {minisiteBuildMode === 'builder' && (
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    This is a custom-builder minisite. The post will go to its general blog feed; no section tab is required.
                  </div>
                )}
                {minisiteBuildMode === 'section_based' && (
                  <div role="status" style={{ fontSize: '0.8rem', color: '#b45309' }}>
                    This minisite is section-based. Choose <strong>Business Section Blog</strong> to select one of its essential visible sections.
                  </div>
                )}
                {selectedBiz && !minisiteBuildMode && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Checking whether this minisite uses section tabs or a custom builder…</div>}
                {selectedBiz && (
                  <div role="status" style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#eff6ff', color: '#1e40af', fontSize: '0.8rem' }}>
                    {formData.language === 'ar' ? 'Arabic' : 'English'} posts are published to the business-wide feed.
                  </div>
                )}
              </div>
            )}

            {/* SCOPE 3: BUSINESS SECTION */}
            {formData.target_type === 'business_section' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {minisiteBuildMode === 'builder' && (
                  <div role="alert" style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#b45309' }}>
                    This business uses a custom-builder minisite, not section tabs. Choose <strong>Business Minisite</strong> to publish to its general blog feed.
                  </div>
                )}
                {minisiteBuildMode === 'section_based' && (
                <>
                <div role="status" style={{ gridColumn: '1 / -1', padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#eff6ff', color: '#1e40af', fontSize: '0.8rem' }}>
                  Every section has a blog area as part of this business minisite. A post is not created automatically: choose a section and language. If a post already exists, it will be shown below so you can update it instead of duplicating it.
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                    2. Select Target Section Tab (اختر القسم):
                  </label>
                  <select
                    value={formData.target_section_id}
                    disabled={businessesLoading || sectionPolicyLoading || Boolean(sectionPolicyError) || sectionOptions.length === 0}
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
                    {selectedSectionUnavailable && <option value={formData.target_section_id} disabled>Current section is not an essential visible section</option>}
                    {sectionOptions.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.label} — EN: {section.available.en ? 'available' : 'occupied'} · AR: {section.available.ar ? 'available' : 'occupied'}
                      </option>
                    ))}
                  </select>
                </div>
                {sectionOptions.length > 0 && !sectionPolicyLoading && !sectionPolicyError && (
                  <div role="status" style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#475569' }}>
                    {availableSectionCount} of {sectionOptions.length} essential visible sections do not yet have a {formData.language === 'ar' ? 'Arabic' : 'English'} blog. Existing blogs can be updated; each section supports one post per language.
                  </div>
                )}
                {selectedBiz && <button type="button" onClick={loadBusinesses} disabled={businessesLoading} style={{ justifySelf: 'start', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.7rem', background: '#fff', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Refresh business sections</button>}
                {sectionPolicyLoading && <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#64748b' }}>Checking which sections are currently shown on this minisite…</div>}
                {sectionPolicyError && <div role="alert" style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#b91c1c' }}>Could not verify the sections shown on this minisite: {sectionPolicyError}</div>}
                {selectedSectionUnavailable && <div role="alert" style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#b45309' }}>This post’s section is not an essential section currently shown on this minisite. Choose an available section to retarget it, or update the minisite’s section settings.</div>}
                {selectedBiz && !sectionPolicyLoading && !sectionPolicyError && sectionPolicyBusinessId === selectedBiz.id && sectionOptions.length === 0 && (
                  <div role="status" style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#b45309' }}>
                    This business has no currently visible sections to target. Enable a section for the business and make it visible on the minisite first.
                  </div>
                )}

                {selectedBiz && formData.target_section_id && (
                  <div style={{ gridColumn: '1 / -1', padding: '0.6rem 0.9rem', background: '#eff6ff', borderRadius: '10px', fontSize: '0.8rem', color: '#1e40af' }}>
                    ⚡ <strong>Direct Section Injection:</strong> Saving will immediately sync this blog into{' '}
                    <code>
                      https://siwify.com/{selectedBiz.slug}/{formData.target_section_id}
                    </code>
                  </div>
                )}
                {selectedBiz && (
                  <div role="status" style={{ gridColumn: '1 / -1', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', background: sectionBlogConflict ? '#fff7ed' : '#f0fdf4', color: sectionBlogConflict ? '#9a3412' : '#166534' }}>
                    {sectionBlogCheckError
                      ? `⚠️ Could not verify the section: ${sectionBlogCheckError}`
                      : checkingSectionBlog
                      ? 'Checking whether this section already has a blog…'
                      : sectionBlogConflict
                        ? `⚠️ This section already has an ${formData.language === 'ar' ? 'Arabic' : 'English'} blog. You can update it below, or choose the other language.`
                        : `✅ No ${formData.language === 'ar' ? 'Arabic' : 'English'} blog exists for this section yet.`}
                  </div>
                )}
                </>
                )}
              </div>
            )}

            {formData.target_type === 'business_section' && sectionBlogConflict && selectedBiz && (
              <div style={{ marginTop: '0.8rem', padding: '0.9rem', border: '1px solid #fed7aa', borderRadius: '10px', background: '#fff7ed', color: '#7c2d12', fontSize: '0.82rem' }}>
                <strong>
                  Existing {sectionBlogConflict.language === 'ar' ? 'Arabic' : 'English'} blog: {sectionBlogConflict.title}
                </strong>
                {sectionBlogConflict.excerpt && <p style={{ margin: '0.4rem 0' }}>{sectionBlogConflict.excerpt}</p>}
                <p style={{ margin: '0.4rem 0', color: '#9a3412' }}>
                  {sectionBlogConflict.content.replace(/<[^>]*>/g, ' ').slice(0, 220)}
                  {sectionBlogConflict.content.length > 220 ? '…' : ''}
                </p>
                {sectionBlogConflict.postId ? (
                  <Link
                    href={`/jana/blog/editor?id=${encodeURIComponent(sectionBlogConflict.postId)}`}
                    style={{ display: 'inline-block', marginTop: '0.3rem', fontWeight: 800, color: '#9a3412' }}
                  >
                    Open this blog to update it
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionBlogId(sectionBlogConflict.id || '');
                      setFormData(prev => ({
                        ...prev,
                        title: sectionBlogConflict.title,
                        slug: generateSlug(sectionBlogConflict.title),
                        excerpt: sectionBlogConflict.excerpt,
                        content: sectionBlogConflict.content,
                        language: sectionBlogConflict.language === 'ar' ? 'ar' : 'en',
                      }));
                    }}
                    style={{ marginTop: '0.3rem', padding: '0.45rem 0.7rem', border: 0, borderRadius: '7px', background: '#9a3412', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Load this blog to edit
                  </button>
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
                    disabled={templateSectionOptions.length === 0 || Boolean(templateSectionsError)}
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
                    {templateSectionOptions.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                  {templateSectionsError && <div role="alert" style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#b91c1c' }}>Could not load public section placements: {templateSectionsError}</div>}
                </div>
              </div>
            )}

            {/* SCOPE 5: MAIN-SITE PAGE */}
            {formData.target_type === 'landing_page' && (
              <div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Choose an active main-site page. The selected category is global and applies to this blog wherever it is shown.
                </div>
                {renderSiteBlogPlacement()}
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
                  disabled={saving ||
                    (['mainsite', 'landing_page'].includes(formData.target_type) &&
                      (siteBlogLocationsLoading || Boolean(siteBlogLocationsError) || !selectedSiteBlogLocation || !selectedSiteBlogLocation.hasBlogBlock)) ||
                    (['business_minisite', 'business_section'].includes(formData.target_type) &&
                      (sectionPolicyLoading || !minisiteBuildMode || Boolean(sectionPolicyError))) ||
                    (formData.target_type === 'business_minisite' && (checkingMinisite || minisiteBlogReady !== true)) ||
                    (formData.target_type === 'business_section' &&
                      !editingSectionBlogId &&
                      (checkingSectionBlog || Boolean(sectionBlogConflict) || Boolean(sectionBlogCheckError)))}
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
                  {saving ? 'Publishing...' : editingSectionBlogId ? '✅ Update Existing Blog' : '🚀 Publish Now'}
                </button>

                <button
                  type="button"
                  onClick={() => savePost('draft')}
                  disabled={saving || Boolean(editingSectionBlogId) ||
                    (['mainsite', 'landing_page'].includes(formData.target_type) &&
                      (siteBlogLocationsLoading || Boolean(siteBlogLocationsError) || !selectedSiteBlogLocation)) ||
                    (['business_minisite', 'business_section'].includes(formData.target_type) &&
                      (sectionPolicyLoading || !minisiteBuildMode || Boolean(sectionPolicyError))) ||
                    (formData.target_type === 'business_section' &&
                      (checkingSectionBlog || Boolean(sectionBlogConflict) || Boolean(sectionBlogCheckError)))}
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
                  {editingSectionBlogId ? 'Existing published blog updates publish immediately' : '💾 Save as Draft'}
                </button>
              </div>
            </div>

            {/* Category */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Category (التصنيف)
              </label>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Blog categories are shared across main-site pages and business minisites.
              </div>
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

const targetSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '2px solid #cbd5e1',
  fontSize: '0.9rem',
  background: '#fff',
};

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>⏳ Loading Blog Editor...</div>}>
      <BlogEditorContent />
    </Suspense>
  );
}
