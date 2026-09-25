'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DynamicForm from '@/components/DynamicForm';
import SectionContentStudio from '@/components/SectionContentStudio';
import { useLang } from '@/context/LangContext';

function ContentManagementContent() {
  const { isRTL } = useLang();
  const searchParams = useSearchParams();
  const paramBiz = searchParams.get('businessId') || searchParams.get('business');
  const paramSec = searchParams.get('section');

  const copy = isRTL
    ? {
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
        openOrchestrator: 'فتح لوحة التحكم الكاملة',
      }
    : {
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
        openOrchestrator: 'Open Full Orchestrator',
      };

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [sectionControls, setSectionControls] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'fields' | 'components'>('content');
  const [fields, setFields] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  // ── Load businesses & handle deep-linked businessId ────────────────
  useEffect(() => {
    fetch('/api/jana/businesses')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBusinesses(list);
        if (paramBiz) {
          const matched = list.find((b: any) => b.id === paramBiz);
          if (matched) setBusinessId(matched.id);
        }
      })
      .finally(() => setLoading(false));
  }, [paramBiz]);

  // ── Load sections + controls when business changes ────────────────
  useEffect(() => {
    if (!businessId) {
      setBusiness(null);
      setSections([]);
      setSectionId('');
      return;
    }
    const next = businesses.find((b) => b.id === businessId);
    setBusiness(next || null);
    if (!next) return;

    Promise.all([
      fetch(`/api/jana/sections?type=${next.type_id}`).then((r) => r.json()),
      fetch(`/api/jana/businesses?id=${businessId}`).then((r) => r.json()),
      fetch(`/api/admin/businesses/${businessId}/section-controls`).then((r) => r.json()),
    ]).then(([secData, fullBiz, controlData]) => {
      const secs = Array.isArray(secData) ? secData : [];
      setSections(secs);
      setBusiness(fullBiz);
      const ctrl: Record<string, any> = {};
      (controlData?.controls || []).forEach((c: any) => { ctrl[c.section_id] = c; });
      setSectionControls(ctrl);
      setSectionId((cur) => {
        if (paramSec && secs.some((s: any) => s.id === paramSec)) return paramSec;
        return cur || secs[0]?.id || '';
      });
    });
  }, [businessId, businesses, paramSec]);

  // ── Load fields + components when section changes ─────────────────
  useEffect(() => {
    if (!business || !sectionId) { setFields([]); setComponents([]); return; }
    Promise.all([
      fetch(`/api/jana/forms?business=${encodeURIComponent(business.id)}&section=${encodeURIComponent(sectionId)}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/admin/sections/${encodeURIComponent(sectionId)}/components`).then((r) => r.ok ? r.json() : []),
    ]).then(([f, c]) => {
      setFields(Array.isArray(f) ? f : []);
      setComponents(Array.isArray(c) ? c : []);
    }).catch(() => { setFields([]); setComponents([]); });
  }, [business, sectionId]);

  // ── Filtered business list ─────────────────────────────────────────
  const visibleBusinesses = useMemo(() =>
    businesses.filter((b) =>
      `${b.name || ''} ${b.vendor_name || ''} ${b.type_name || ''}`.toLowerCase().includes(filter.toLowerCase())
    ), [businesses, filter]);

  const section = sections.find((s) => s.id === sectionId);

  // ── Save handler passed to SectionContentStudio ───────────────────
  async function handleStudioSave(nextCustomData: Record<string, any>) {
    setSaving(true);
    setSaveMessage('');
    try {
      const changedCustomData = Object.fromEntries(
        Object.entries(nextCustomData).filter(([key, value]) =>
          JSON.stringify(value) !== JSON.stringify(business.custom_data?.[key])
        )
      );
      const res = await fetch('/api/jana/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, custom_data: changedCustomData }),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || `Save failed (HTTP ${res.status})`);
      }
      setBusiness((prev: any) => ({ ...prev, custom_data: nextCustomData }));
      setSaveMessage('All media, placements, captions, and blog stories saved successfully!');
    } catch (err: any) {
      setSaveMessage(err.message || 'Save failed');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function handleFieldChange(sectionKey: string, fieldName: string, value: any) {
    setBusiness((prev: any) => ({
      ...prev,
      custom_data: {
        ...(prev?.custom_data || {}),
        [sectionKey]: { ...(prev?.custom_data?.[sectionKey] || {}), [fieldName]: value },
      },
    }));
  }

  if (loading) return <div style={{ padding: '3rem', color: '#64748b' }}>Loading content workspace...</div>;

  return (
    <main
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', textAlign: isRTL ? 'right' : 'left' }}
    >
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ color: '#D4AF37', fontSize: '0.68rem', fontWeight: 900, letterSpacing: isRTL ? 0 : '1.5px' }}>{copy.eyebrow}</div>
          <h1 style={{ margin: '0.35rem 0', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{copy.title}</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{copy.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link href="/jana/setup" style={{ padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '9px', color: '#475569', textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>
            {copy.setup}
          </Link>
          <Link href="/jana/sections" style={{ padding: '0.65rem 0.9rem', background: '#0f172a', borderRadius: '9px', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>
            {copy.schema}
          </Link>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left: Business Sidebar */}
        <aside style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={copy.findBusiness}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', background: '#fff', direction: isRTL ? 'rtl' : 'ltr' }}
            />
          </div>
          <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {visibleBusinesses.map((b) => (
              <button
                key={b.id}
                onClick={() => { setBusinessId(b.id); setActiveTab('content'); }}
                style={{ display: 'block', width: '100%', textAlign: isRTL ? 'right' : 'left', padding: '0.9rem 1rem', border: 0, borderBottom: '1px solid #f1f5f9', background: b.id === businessId ? '#fffbeb' : '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <strong style={{ display: 'block', color: b.id === businessId ? '#a16207' : '#1e293b', fontSize: '0.84rem' }}>{b.name}</strong>
                <span style={{ display: 'block', marginTop: '0.2rem', color: '#64748b', fontSize: '0.7rem' }}>
                  {b.type_name || 'Unclassified'} · {b.vendor_name || b.vendor_email || 'No vendor'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Right: Content Workspace */}
        <div style={{ minWidth: 0 }}>
          {!business ? (
            <div style={{ background: '#fff', border: '1.5px dashed #cbd5e1', borderRadius: '16px', padding: '6rem 2rem', textAlign: 'center', color: '#64748b' }}>
              <i className="fas fa-store" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }} />
              {copy.selectBusiness}
            </div>
          ) : (
            <>
              {/* Business Header */}
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{business.name}</h2>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                    {business.type_name} · Tier:{' '}
                    <strong style={{ color: '#D4AF37' }}>{business.subscription_tier || 'free'}</strong>
                  </span>
                </div>
                {/* Open Full Orchestrator — deep-links to same section */}
                <Link
                  href={`/jana/businesses/${business.id}/orchestrate?section=${sectionId}`}
                  style={{ padding: '0.55rem 0.9rem', border: '1.5px solid #6366f1', borderRadius: '8px', color: '#4f46e5', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 900, background: '#eef2ff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <i className="fas fa-sliders" /> {copy.openOrchestrator}
                </Link>
                <Link
                  href={`/${business.slug || business.id}`}
                  target="_blank"
                  style={{ padding: '0.55rem 0.9rem', border: '1.5px solid #D4AF37', borderRadius: '8px', color: '#a16207', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 900, background: '#fffdf5', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <i className="fas fa-external-link-alt" /> View Live Minisite
                </Link>
                <select
                  value={sectionId}
                  onChange={(e) => { setSectionId(e.target.value); setActiveTab('content'); }}
                  style={{ minWidth: '240px', padding: '0.65rem', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.is_universal ? ' · Universal' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Workspace Tabs */}
              <div role="tablist" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1.5px solid #e2e8f0', marginBottom: '1.25rem' }}>
                {([
                  ['content', `${copy.contentMedia}`, 'fa-photo-film'],
                  ['fields', `${copy.fields} (${fields.length})`, 'fa-list-check'],
                  ['components', `${copy.components} (${components.length})`, 'fa-cubes'],
                ] as const).map(([tab, label, icon]) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ padding: '0.75rem 1.25rem', border: 0, borderBottom: activeTab === tab ? '3px solid #D4AF37' : '3px solid transparent', background: 'transparent', color: activeTab === tab ? '#D4AF37' : '#64748b', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    <i className={`fas ${icon}`} style={{ marginRight: isRTL ? 0 : '0.45rem', marginLeft: isRTL ? '0.45rem' : 0 }} />
                    {label}
                  </button>
                ))}
              </div>

              {/* TAB 1: Content & Media Studio (shared component) */}
              {activeTab === 'content' && (
                <SectionContentStudio
                  businessId={business.id}
                  businessName={business.name}
                  sectionId={sectionId}
                  sections={sections}
                  customData={business.custom_data || {}}
                  sectionControls={sectionControls}
                  onSave={handleStudioSave}
                  saving={saving}
                  message={saveMessage}
                />
              )}

              {/* TAB 2: Fields */}
              {activeTab === 'fields' && (
                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 900 }}>Section Fields</h3>
                  <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.75rem' }}>
                    Edit this business section's assigned form fields.
                  </p>
                  {fields.length > 0 ? (
                    <DynamicForm
                      fields={fields}
                      data={business.custom_data || {}}
                      onChange={handleFieldChange}
                      sections={section ? [section] : []}
                      userRole="admin"
                      businessName={business.name}
                    />
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No fields are assigned to this section.</p>
                  )}
                </section>
              )}

              {/* TAB 3: Components */}
              {activeTab === 'components' && (
                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Section Components</h3>
                      <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.75rem' }}>
                        Reusable structured components configured for this section.
                      </p>
                    </div>
                    <Link
                      href={`/admin/sections/${sectionId}/add-components`}
                      style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', background: '#0f172a', color: '#fff', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800 }}
                    >
                      Manage Library
                    </Link>
                  </div>
                  {components.length > 0 ? (
                    <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                      {components.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                          <div>
                            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.82rem' }}>{c.label || c.component_type}</strong>
                            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{c.component_type} · {c.is_repeatable ? 'Repeatable' : 'Single'}</span>
                          </div>
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>Order #{c.display_order ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: '1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>No components assigned to this section yet.</p>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ContentManagementPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', color: '#64748b' }}>Loading content workspace...</div>}>
      <ContentManagementContent />
    </Suspense>
  );
}
