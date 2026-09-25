'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import DynamicForm from '@/components/DynamicForm';
import SectionContentStudio from '@/components/SectionContentStudio';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';
import {
  filterCoreSectionsForBusinessType,
  getEffectiveSectionLabel,
  isSectionHidden,
  resolveSectionId,
} from '@/lib/section-registry';

/**
 * UNIFIED BUSINESS DNA ORCHESTRATOR
 * State-of-the-art dashboard for feeding business data and architecture.
 * CONTENT tab powered by the shared SectionContentStudio component.
 */

type Tab = 'IDENTITY' | 'ARCHITECTURE' | 'CONTENT' | 'COMMERCIAL' | 'BRANDING' | 'MEDIA' | 'READINESS';

export default function BusinessOrchestrator() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { notify } = useAdmin();

  const businessId = Array.isArray(id) ? id[0] : id;
  const fieldParam = searchParams.get('field');
  const sectionParam = searchParams.get('section');

  // ── Top-level state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('field') || sectionParam ? 'CONTENT' : 'IDENTITY') as Tab
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biz, setBiz] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionControls, setSectionControls] = useState<Record<string, any>>({});
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [studioSaving, setStudioSaving] = useState(false);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [minisiteControl, setMinisiteControl] = useState<any>({ minisiteStatus: 'active' });
  const [commercialLoading, setCommercialLoading] = useState(false);
  const initialCustomDataRef = useRef<Record<string, any>>({});

  // ── Load business data ─────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const isPlaceholderId = !businessId || /\{?business[_-]?id\}?/i.test(businessId);
      if (isPlaceholderId) {
        setBiz(null);
        setLoading(false);
        return;
      }

      try {
        const bizRes = await fetch(`/api/jana/businesses?id=${businessId}`);
        const bizData = await bizRes.json();
        if (bizData.error) throw new Error(bizData.error);

        const secRes = await fetch(bizData.type_id ? `/api/jana/sections?type=${bizData.type_id}` : '/api/jana/sections');
        const rawSections = await secRes.json();
        const orderedSections = Array.isArray(rawSections) ? rawSections : [];
        const canonicalSections = Array.from(
          new Map(orderedSections.map((s: any) => [resolveSectionId(s.id), s])).values()
        );

        const typeRes = await fetch(`/api/jana/types?id=${bizData.type_id}`);
        const typeData = typeRes.ok ? await typeRes.json() : {};
        const blueprint = typeData.blueprint || {
          hidden_sections: typeData.hidden_sections || [],
          hidden_fields: typeData.hidden_fields || [],
        };

        const customData =
          bizData.custom_data && typeof bizData.custom_data === 'string'
            ? JSON.parse(bizData.custom_data)
            : bizData.custom_data || {};

        initialCustomDataRef.current = customData;
        setBiz({ ...bizData, custom_data: customData, blueprint });
        setSections(canonicalSections);

        const fieldRes = await fetch(`/api/jana/forms?type=${bizData.type_id}`);
        let fieldData = await fieldRes.json();
        fieldData = fieldData.filter((f: any) => !blueprint.hidden_fields?.includes(f.name));
        setBiz((prev: any) => ({ ...prev, fields: fieldData }));

        const controlsRes = await fetch(`/api/admin/businesses/${businessId}/section-controls`);
        const controlsData = controlsRes.ok ? await controlsRes.json() : { controls: [] };
        const normalizedControls = Array.isArray(controlsData.controls)
          ? Object.fromEntries(controlsData.controls.map((c: any) => [c.section_id, c]))
          : Object.fromEntries((controlsData || []).map((c: any) => [c.section_id, c]));
        setSectionControls(normalizedControls);

        // Load the business-scoped commercial and minisite state for the
        // Commercial and Readiness steps without duplicating catalog data.
        setCommercialLoading(true);
        const [marketplaceRes, minisiteRes] = await Promise.all([
          fetch(`/api/jana/marketplace?businessId=${encodeURIComponent(businessId)}&status=all`),
          fetch(`/api/minisite-services/${encodeURIComponent(businessId)}`),
        ]);
        if (marketplaceRes.ok) {
          const marketplaceData = await marketplaceRes.json();
          setMarketplaceItems(Array.isArray(marketplaceData) ? marketplaceData : []);
        }
        if (minisiteRes.ok) {
          setMinisiteControl(await minisiteRes.json());
        }
        setCommercialLoading(false);

        // Deep-link section activation
        if (sectionParam) {
          setActiveSectionId(sectionParam);
        } else {
          const hiddenSections = customData.basic?.hidden_sections || customData.hidden_sections || [];
          const firstActive = canonicalSections.find((s: any) => !hiddenSections.includes(s.id));
          if (firstActive) setActiveSectionId(firstActive.id);
        }
      } catch (err: any) {
        setCommercialLoading(false);
        notify(err.message || 'Failed to load orchestrator data', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [businessId, fieldParam, notify, sectionParam]);

  // ── Helpers ────────────────────────────────────────────────────────

  const updateBiz = (updates: any) => setBiz((prev: any) => ({ ...prev, ...updates }));

  const updateCustomData = (sectionId: string, fieldName: string, value: any) => {
    setBiz((prev: any) => ({
      ...prev,
      custom_data: {
        ...prev.custom_data,
        [sectionId]: { ...(prev.custom_data?.[sectionId] || {}), [fieldName]: value },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Always include identity keys in the diff — never skip basic/sec_1_identity
      const ALWAYS_INCLUDE_KEYS = ['basic', 'sec_1_identity', 'section_labels', 'section_labels_ar'];
      const changedCustomData = Object.fromEntries(
        Object.entries(biz.custom_data || {}).filter(([key, value]) =>
          ALWAYS_INCLUDE_KEYS.includes(key) ||
          JSON.stringify(value) !== JSON.stringify(initialCustomDataRef.current[key])
        )
      );

      // Extract logo from custom_data so it is also saved to the direct column
      const logoUrl =
        biz.custom_data?.sec_1_identity?.business_logo ||
        biz.custom_data?.basic?.business_logo ||
        biz.logo_url ||
        null;

      const res = await fetch('/api/jana/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: businessId,
          name: biz.name,
          type_id: biz.type_id,
          subscription_tier: biz.subscription_tier,
          vendor_id: biz.vendor_id,
          template_id: biz.template_id,
          status: biz.status,
          published: biz.published,
          description: biz.description,
          short_description: biz.short_description,
          phone: biz.phone,
          email: biz.email,
          website: biz.website,
          address: biz.address,
          city: biz.city,
          ...(logoUrl ? { logo_url: logoUrl } : {}),
          ...(biz.cover_image ? { cover_image: biz.cover_image } : {}),
          custom_data: changedCustomData,
        }),
      });
      if (res.ok) {
        initialCustomDataRef.current = biz.custom_data || {};
        notify('Business DNA Synchronized', 'success');
      } else {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || `Save failed (HTTP ${res.status})`);
      }
    } catch (err: any) {
      notify(err.message || 'Synchronization Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  /** Called by SectionContentStudio when user saves the content section */
  const handleStudioSave = async (nextCustomData: Record<string, any>) => {
    setStudioSaving(true);
    try {
      // ALWAYS include identity + basic keys — never skip them via diff.
      // Logo lives in basic.business_logo AND sec_1_identity.business_logo.
      // If either key was unchanged in the diff it would be silently dropped,
      // causing the logo to revert to the previous value on next page load.
      const ALWAYS_INCLUDE_KEYS = ['basic', 'sec_1_identity', 'section_labels', 'section_labels_ar'];

      const changedCustomData = Object.fromEntries(
        Object.entries(nextCustomData).filter(([key, value]) =>
          ALWAYS_INCLUDE_KEYS.includes(key) ||
          JSON.stringify(value) !== JSON.stringify(biz.custom_data?.[key])
        )
      );

      // Also extract logo_url and save it directly on the business row
      // so it is always accessible without parsing custom_data.
      const logoUrl =
        nextCustomData?.sec_1_identity?.business_logo ||
        nextCustomData?.basic?.business_logo ||
        nextCustomData?.business_logo ||
        null;

      const payload: Record<string, any> = { id: businessId, custom_data: changedCustomData };
      if (logoUrl) payload.logo_url = logoUrl;

      const res = await fetch('/api/jana/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Content save failed' }));
        throw new Error(err.error || `Content save failed (HTTP ${res.status})`);
      }
      setBiz((prev: any) => ({ ...prev, custom_data: nextCustomData, logo_url: logoUrl || prev.logo_url }));
      initialCustomDataRef.current = nextCustomData;
      notify('Content & Media synced', 'success');
    } catch (err: any) {
      notify(err.message || 'Content save failed', 'error');
      throw err;
    } finally {
      setStudioSaving(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────

  if (loading) return <div className="loader-screen">ORCHESTRATING DNA...</div>;
  if (!biz) return <div className="loader-screen" style={{ color: '#ef4444' }}>BUSINESS ENTITY NOT FOUND</div>;

  const hiddenSections = sections
    .filter((s) => isSectionHidden(s.id, biz.custom_data, sectionControls[s.id], []))
    .map((s) => s.id);
  const visibleSections = sections.filter((s) => !hiddenSections.includes(s.id));
  const activeSectionIds = visibleSections.map((s) => s.id);
  const identityData = biz.custom_data?.sec_1_identity || biz.custom_data?.basic || biz.custom_data?.business_info || {};
  const galleryCount = Object.values(biz.custom_data || {}).reduce((count: number, value: any) => {
    const gallery = Array.isArray(value?.section_gallery) ? value.section_gallery : [];
    return count + gallery.length;
  }, 0);
  const approvedMarketplaceItems = marketplaceItems.filter((item) => ['approved', 'published'].includes(String(item.status || '').toLowerCase()));
  const minisiteReady = minisiteControl.minisiteStatus === 'active';
  const readinessChecks = [
    { label: 'Business identity', complete: Boolean(biz.name && biz.slug) },
    { label: 'Public sections', complete: activeSectionIds.length > 0 },
    { label: 'Contact details', complete: Boolean(identityData.phone || identityData.whatsapp || identityData.email) },
    { label: 'Logo or gallery media', complete: Boolean(identityData.business_logo || identityData.logo || galleryCount > 0) },
    { label: 'Minisite service', complete: minisiteReady },
    { label: 'Approved commercial items', complete: approvedMarketplaceItems.length > 0 },
  ];
  const readinessComplete = readinessChecks.every((check) => check.complete);

  return (
    <div className="orchestrator-page">
      <style>{`
        @media (max-width: 768px) {
          .orchestrator-header { padding: 1.5rem !important; }
          .orchestrator-header > div > div { flex-direction: column; align-items: flex-start !important; gap: 1.5rem; }
          .orchestrator-header .btn { width: 100%; justify-content: center; }
          .orchestrator-tabs { overflow-x: auto; white-space: nowrap; padding-bottom: 0.5rem; }
          .tab-btn { font-size: 0.6rem !important; padding: 0.8rem 1.2rem !important; }
          .tab-content { padding: 1rem !important; }
          .tab-content[style*="display: flex"] { flex-direction: column !important; }
          .dna-sidebar { width: 100% !important; position: relative !important; top: 0 !important; margin-bottom: 2rem; }
          .grid-responsive { grid-template-columns: 1fr !important; }
          .glass-card { border-radius: 0 !important; border: none !important; background: transparent !important; box-shadow: none !important; }
          .section-title { font-size: 1.5rem !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="orchestrator-header">
        <div className="container-fluid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="badge-premium">GOVERNANCE COMMAND CENTER</div>
              <h1 className="title" style={{ color: '#0f172a' }}>{biz.name?.toUpperCase()}</h1>
              <p style={{ margin: '1rem 0 0', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px' }}>
                <i className="fas fa-fingerprint"></i> UUID: {businessId}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href={`/jana/content?businessId=${businessId}&section=${activeSectionId || ''}`} className="btn btn-outline">
                <i className="fas fa-photo-film"></i> MEDIA STUDIO
              </Link>
              <Link href={`/${biz.slug}`} target="_blank" className="btn btn-outline">
                <i className="fas fa-external-link-alt"></i> VIEW MINISITE
              </Link>
              <button onClick={handleSave} disabled={saving} className="btn btn-premium">
                {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                {saving ? 'SYNCHRONIZING...' : 'SAVE ALL CHANGES'}
              </button>
            </div>
          </div>

          <div className="orchestrator-tabs">
            {(['IDENTITY', 'ARCHITECTURE', 'CONTENT', 'COMMERCIAL', 'BRANDING', 'MEDIA', 'READINESS'] as Tab[]).map((t) => (
              <button
                key={t}
                className={`tab-btn ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-fluid" style={{ marginTop: '2rem', paddingBottom: '10rem' }}>
        <div className="glass-card animate-in">

          {/* ── TAB 1: IDENTITY ── */}
          {activeTab === 'IDENTITY' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">System Identity</h2>
              <div className="grid-responsive">
                <div className="form-group">
                  <label className="dna-label">Business Name</label>
                  <input type="text" className="dna-input" value={biz.name || ''} onChange={(e) => updateBiz({ name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="dna-label">URL Slug</label>
                  <input type="text" className="dna-input" value={biz.slug || ''} onChange={(e) => updateBiz({ slug: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="dna-label">Business Category (Typology)</label>
                  <div className="dna-input" style={{ opacity: 0.6, background: '#f1f5f9' }}>{biz.type_name || 'Generic Business'}</div>
                </div>
              </div>
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(212,175,55,0.05)', borderRadius: '16px', border: '1px dashed rgba(212,175,55,0.2)', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                <i className="fas fa-info-circle" style={{ color: '#D4AF37', marginRight: '10px' }}></i>
                Core Brand Assets (Logo, Phone, Email, Address) have been moved to <strong>Chapter 1: HERITAGE &amp; IDENTITY</strong> for cinematic centralization.
              </div>
            </div>
          )}

          {/* ── TAB 2: ARCHITECTURE ── */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Global Architecture Governance</h2>
              <div className="grid-responsive" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', marginBottom: '1.5rem', letterSpacing: '2px' }}>CHAPTER VISIBILITY CONTROLS</h3>
                  <div className="section-grid-mini" style={{ display: 'grid', gap: '1rem' }}>
                    {sections.map((s) => {
                      const isHidden = isSectionHidden(s.id, biz.custom_data, sectionControls[s.id], []);
                      const effectiveLabel = getEffectiveSectionLabel(s.id, s.name, biz.custom_data, sectionControls[s.id]);
                      return (
                        <div
                          key={s.id}
                          className={`section-item-toggle ${!isHidden ? 'active' : ''}`}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isHidden ? '#f8fafc' : 'rgba(99,102,241,0.05)', border: isHidden ? '1px solid #e2e8f0' : '1px solid rgba(99,102,241,0.3)', padding: '1.25rem', borderRadius: '16px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <i className={`fas ${s.icon}`} style={{ color: isHidden ? '#94a3b8' : '#6366f1' }}></i>
                            <div>
                              <div style={{ fontWeight: 800, color: isHidden ? '#94a3b8' : '#0f172a', fontSize: '0.85rem' }}>{effectiveLabel}</div>
                              <div style={{ fontSize: '0.55rem', fontWeight: 900, color: isHidden ? '#94a3b8' : '#6366f1', letterSpacing: '1px' }}>
                                {isHidden ? 'HIDDEN FROM PUBLIC NAV' : 'VISIBLE ON MINISITE'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const hidden = [...(biz.custom_data?.basic?.hidden_sections || biz.custom_data?.hidden_sections || [])];
                              const visible = [...(biz.custom_data?.basic?.visible_sections || biz.custom_data?.visible_sections || [])];

                              let nextHidden: string[];
                              let nextVisible: string[];

                              if (isHidden) {
                                // Enabling section for this specific business
                                nextHidden = hidden.filter((hid: string) => resolveSectionId(hid) !== resolveSectionId(s.id));
                                nextVisible = Array.from(new Set([...visible, s.id]));
                              } else {
                                // Disabling/hiding section for this specific business
                                nextVisible = visible.filter((vis: string) => resolveSectionId(vis) !== resolveSectionId(s.id));
                                nextHidden = Array.from(new Set([...hidden, s.id]));
                              }

                              setBiz((prev: any) => ({
                                ...prev,
                                custom_data: {
                                  ...prev.custom_data,
                                  basic: {
                                    ...(prev.custom_data?.basic || {}),
                                    hidden_sections: nextHidden,
                                    visible_sections: nextVisible,
                                  },
                                  hidden_sections: nextHidden,
                                  visible_sections: nextVisible,
                                }
                              }));

                              if (!isHidden && activeSectionId === s.id) {
                                setActiveSectionId(sections.find((sec) => !nextHidden.includes(sec.id))?.id || null);
                              }
                            }}
                            style={{ background: isHidden ? '#334155' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}
                          >
                            {isHidden ? 'ENABLE SECTION' : 'DISABLE / HIDE'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99,102,241,0.05)', borderRadius: '16px', border: '1px dashed rgba(99,102,241,0.2)', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                    <i className="fas fa-shield-check" style={{ color: '#6366f1', marginRight: '10px' }}></i>
                    Architecture is inherited from <strong>{biz.type_name || 'Typology'}</strong>. You can hide chapters from the public, but the underlying data remains synchronized.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: CONTENT (powered by SectionContentStudio) ── */}
          {activeTab === 'CONTENT' && (
            <div className="tab-content animate-in" style={{ display: 'flex', gap: '2rem' }}>
              {/* Section sidebar */}
              <aside className="dna-sidebar" style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '2rem', height: 'fit-content' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', marginBottom: '1rem', paddingLeft: '1rem' }}>
                  ACTIVE DNA LAYERS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {visibleSections.filter((s) => activeSectionIds.includes(s.id)).map((s) => {
                    const sData = biz.custom_data?.[s.id] || {};
                    const dataPoints = Object.keys(sData).filter((k) => k !== 'initialized' && sData[k]).length;
                    const isFed = dataPoints > 0;
                    return (
                      <button
                        key={s.id}
                        className={`dna-nav-btn ${activeSectionId === s.id ? 'active' : ''}`}
                        onClick={() => setActiveSectionId(s.id)}
                        style={{ padding: '1rem', fontSize: '0.8rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <i className={`fas ${s.icon}`} style={{ width: '1.2rem', textAlign: 'center' }}></i>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {biz.custom_data?.basic?.section_labels?.[s.id] || s.name}
                          </span>
                        </div>
                        {isFed && <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '0.7rem' }}></i>}
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Content area */}
              <main style={{ flex: 1, minWidth: 0 }}>
                {activeSectionId ? (
                  <div key={activeSectionId} className="animate-in">
                    {/* Sticky section header */}
                    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '1rem 0', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-1px', color: '#0f172a' }}>
                        <i className={`fas ${visibleSections.find((s) => s.id === activeSectionId)?.icon}`} style={{ color: '#D4AF37', marginRight: '1rem' }}></i>
                        {visibleSections.find((s) => s.id === activeSectionId)?.name} Feeding
                      </h2>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>
                        LAYER: {activeSectionId.toUpperCase()}
                      </div>
                    </div>

                    {/* Direct Injection Banner */}
                    {fieldParam && (
                      <div style={{ marginBottom: '2rem', padding: '1.5rem 2rem', borderRadius: '16px', background: 'linear-gradient(90deg, rgba(212,175,55,0.05), rgba(255,255,255,0))', borderLeft: '4px solid #D4AF37', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#D4AF37', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                          <i className="fas fa-crosshairs"></i>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', marginBottom: '0.25rem' }}>DIRECT INJECTION ACTIVE</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            Editing field <strong style={{ color: '#D4AF37' }}>{fieldParam.toUpperCase()}</strong> for <strong style={{ color: '#D4AF37' }}>{biz.name}</strong>.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Shared Content Studio ── */}
                    <SectionContentStudio
                      businessId={businessId as string}
                      businessName={biz.name}
                      sectionId={activeSectionId}
                      sections={visibleSections}
                      customData={biz.custom_data || {}}
                      sectionControls={sectionControls}
                      onSave={handleStudioSave}
                      saving={studioSaving}
                    />

                    {/* DynamicForm fields below the studio */}
                    <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                      <DynamicForm
                        fields={biz.fields?.filter((f: any) => (f.section_id || 'basic') === activeSectionId) || []}
                        data={biz.custom_data || {}}
                        sections={sections}
                        userRole="admin"
                        onChange={updateCustomData}
                        businessName={biz.name}
                        business={biz}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                    Select a section from the sidebar to begin editing.
                  </div>
                )}
              </main>
            </div>
          )}

          {/* ── TAB 4: COMMERCIAL ── */}
          {activeTab === 'COMMERCIAL' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Tours, Packages &amp; Offers</h2>
              <p style={{ maxWidth: 760, color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                Prepare commercial content for this business using the canonical marketplace records. Items created here remain connected to approval, pricing, discounts, and minisite visibility policies.
              </p>

              <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '2rem' }}>
                {[
                  { label: 'Approved items', value: approvedMarketplaceItems.length, color: '#15803d' },
                  { label: 'Draft / review items', value: marketplaceItems.length - approvedMarketplaceItems.length, color: '#b45309' },
                  { label: 'Minisite status', value: minisiteControl.minisiteStatus || 'active', color: minisiteReady ? '#15803d' : '#b91c1c' },
                ].map((metric) => (
                  <div key={metric.label} style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>{metric.label}</div>
                    <div style={{ color: metric.color, fontSize: '1.8rem', fontWeight: 900, marginTop: '0.4rem' }}>{commercialLoading ? '...' : metric.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <Link href={`/admin/packages?businessId=${businessId}`} className="btn btn-premium"><i className="fas fa-box-open" /> Create tours &amp; packages</Link>
                <Link href={`/admin/offers?businessId=${businessId}`} className="btn btn-outline"><i className="fas fa-tags" /> Create offers</Link>
                <Link href={`/admin/discounts?businessId=${businessId}`} className="btn btn-outline"><i className="fas fa-percent" /> Configure discounts</Link>
                <Link href={`/jana/catalog?businessId=${businessId}`} className="btn btn-outline"><i className="fas fa-clipboard-check" /> Review catalog</Link>
                <Link href={`/jana/vendor-services?businessId=${businessId}`} className="btn btn-outline"><i className="fas fa-concierge-bell" /> Manage services</Link>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 900, color: '#0f172a' }}>Assigned commercial items</div>
                {marketplaceItems.length === 0 ? (
                  <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center' }}>No tours, packages, offers, or discounts are assigned yet.</div>
                ) : marketplaceItems.map((item) => (
                  <div key={item.id} style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div><strong>{item.title}</strong><div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.25rem' }}>{item.item_type} · {item.currency} {item.price_amount}</div></div>
                    <span style={{ color: ['approved', 'published'].includes(String(item.status).toLowerCase()) ? '#15803d' : '#b45309', fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase' }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: BRANDING ── */}
          {activeTab === 'BRANDING' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Minisite Navigation Branding</h2>

              {/* Live Preview Bar */}
              <div style={{ marginBottom: '3rem' }}>
                <label className="dna-label">LIVE NAVIGATION PREVIEW</label>
                <div style={{ background: 'rgba(255,255,255,0.95)', padding: '1rem 2rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#1e293b', fontWeight: 900, fontSize: '0.8rem' }}>{(biz.name || 'BUSINESS NAME').toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    {sections.filter((s) => activeSectionIds.includes(s.id)).map((s) => {
                      const label = biz.custom_data?.basic?.section_labels?.[s.id] || s.name;
                      return (
                        <div key={s.id} style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', borderBottom: '2px solid #D4AF37', paddingBottom: '2px' }}>
                          {(label || '').toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '4px 12px', border: '1px solid #D4AF37', borderRadius: '4px', color: '#D4AF37', fontSize: '0.6rem', fontWeight: 900 }}>SiWiFy.com</div>
                </div>
              </div>

              <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {sections.filter((s) => activeSectionIds.includes(s.id)).map((s) => (
                  <div key={s.id} className="form-group" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <i className={`fas ${s.icon}`} style={{ color: '#94a3b8', fontSize: '0.8rem' }}></i>
                      <label className="dna-label" style={{ margin: 0 }}>{s.name.toUpperCase()} NAVIGATION LABEL</label>
                    </div>
                    <input
                      type="text"
                      className="dna-input"
                      placeholder={s.name}
                      value={biz.custom_data?.basic?.section_labels?.[s.id] || ''}
                      onChange={(e) => {
                        const next = { ...(biz.custom_data?.basic?.section_labels || {}) };
                        next[s.id] = e.target.value;
                        updateCustomData('basic', 'section_labels', next);
                      }}
                    />
                    <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 700 }}>Default: {s.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 5: MEDIA ── */}
          {activeTab === 'MEDIA' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Unified Business Media Assets</h2>
              <div className="media-grid">
                <div style={{ padding: '6rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <i className="fas fa-film fa-3x" style={{ opacity: 0.1, marginBottom: '1.5rem' }}></i>
                  <div style={{ fontWeight: 700, opacity: 0.4 }}>
                    Media Library is data-driven. Assets appear after feeding the CONTENT tab.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                    <Link href="/jana/hero-carousel" className="btn btn-premium" style={{ display: 'inline-flex' }}>
                      OPEN HERO MANAGER
                    </Link>
                    <Link href={`/jana/content`} className="btn btn-outline" style={{ display: 'inline-flex' }}>
                      <i className="fas fa-photo-film"></i> OPEN MEDIA STUDIO
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 7: READINESS ── */}
          {activeTab === 'READINESS' && (
            <div className="tab-content animate-in">
              <h2 className="section-title">Publish Readiness</h2>
              <p style={{ maxWidth: 760, color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                This checklist is calculated from the selected business record and its approved public content.
              </p>
              <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 760 }}>
                {readinessChecks.map((check) => (
                  <div key={check.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '12px', border: `1px solid ${check.complete ? '#bbf7d0' : '#fde68a'}`, background: check.complete ? '#f0fdf4' : '#fffbeb' }}>
                    <i className={`fas ${check.complete ? 'fa-check-circle' : 'fa-circle-exclamation'}`} style={{ color: check.complete ? '#15803d' : '#b45309' }} />
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{check.label}</span>
                    <span style={{ marginLeft: 'auto', color: check.complete ? '#15803d' : '#b45309', fontSize: '0.7rem', fontWeight: 900 }}>{check.complete ? 'READY' : 'ACTION NEEDED'}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href={`/${biz.slug}`} target="_blank" className="btn btn-outline"><i className="fas fa-external-link-alt" /> Preview minisite</Link>
                <span style={{ color: readinessComplete ? '#15803d' : '#b45309', fontWeight: 900, fontSize: '0.8rem' }}>{readinessComplete ? 'Business is ready for review.' : 'Complete the outstanding actions before publishing.'}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@300;500;900&display=swap');

        .orchestrator-page {
          min-height: 100vh;
          background: #f8fafc;
          padding-bottom: 5rem;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        .container-fluid {
          width: 100%;
          max-width: 1800px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .orchestrator-header {
          background: radial-gradient(circle at top right, rgba(212,175,55,0.05), transparent), #ffffff;
          padding: 6rem 0 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .badge-premium {
          display: inline-block; background: #D4AF37; color: #fff;
          padding: 6px 16px; border-radius: 50px; font-size: 0.6rem;
          font-weight: 900; letter-spacing: 2px; margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(212,175,55,0.2);
          font-family: 'Outfit', sans-serif;
        }

        .title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 900; margin: 0; letter-spacing: -2px;
          text-shadow: 0 10px 40px rgba(0,0,0,0.05);
          line-height: 1;
        }

        .orchestrator-tabs { display: flex; gap: clamp(1rem, 2vw, 3rem); margin-top: 4rem; flex-wrap: wrap; }
        .tab-btn {
          background: none; border: none; color: #94a3b8;
          font-weight: 900; font-size: 0.75rem; letter-spacing: 2px;
          padding: 1rem 0; cursor: pointer; border-bottom: 3px solid transparent;
          transition: all 0.3s; font-family: 'Outfit', sans-serif;
        }
        .tab-btn:hover { color: #0f172a; }
        .tab-btn.active { color: #D4AF37; border-bottom-color: #D4AF37; }

        .tab-content { padding: 2.5rem; }

        .glass-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .animate-in { animation: fadeInUp 0.4s ease forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem; font-weight: 900; color: #0f172a;
          margin: 0 0 2rem; letter-spacing: -1px;
        }

        .grid-responsive { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }

        .dna-label {
          font-size: 0.6rem; font-weight: 900; color: #D4AF37;
          letter-spacing: 1.5px; display: block; margin-bottom: 1rem;
          font-family: 'Outfit', sans-serif;
        }

        .dna-input {
          width: 100%;
          background: #f8fafc;
          border: 1.2px solid #e2e8f0;
          border-radius: 12px; padding: 1rem; color: #0f172a;
          font-weight: 600; outline: none; transition: all 0.3s;
          font-size: 0.9rem;
          box-sizing: border-box;
        }
        .dna-input:focus { border-color: #D4AF37; background: #ffffff; box-shadow: 0 0 15px rgba(212,175,55,0.1); }

        .section-grid-mini { display: grid; gap: 0.75rem; }

        .section-item-toggle {
          background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 1rem; border-radius: 12px; display: flex; justify-content: space-between;
          align-items: center; font-weight: 800; color: #64748b; cursor: pointer; transition: all 0.3s;
        }
        .section-item-toggle:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-2px); }
        .section-item-toggle.active { border-color: #D4AF37; background: rgba(212,175,55,0.06); color: #0f172a; }

        .dna-sidebar {
          display: flex; flex-direction: column; gap: 0.75rem;
          border-right: 1px solid #e2e8f0; padding-right: 2rem;
        }

        .dna-nav-btn {
          background: transparent; border: none; text-align: left;
          padding: 1rem; border-radius: 12px; font-weight: 800;
          color: #94a3b8; cursor: pointer; transition: all 0.4s;
          display: flex; align-items: center; gap: 1rem;
          font-family: 'Outfit', sans-serif;
        }
        .dna-nav-btn:hover:not(.active) { background: #f8fafc; color: #0f172a; }
        .dna-nav-btn.active {
          background: #ffffff;
          color: #D4AF37; border: 1px solid rgba(212,175,55,0.2);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }

        .btn-premium {
          padding: 1rem 2.5rem; border-radius: 50px;
          background: linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%);
          color: #1a1a2e; border: none; font-weight: 900; letter-spacing: 1.5px; cursor: pointer;
          box-shadow: 0 12px 30px rgba(212,175,55,0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; gap: 0.75rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          text-decoration: none;
        }
        .btn-premium:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(212,175,55,0.4); }

        .btn-outline {
          padding: 1rem 2.5rem; border-radius: 50px;
          background: transparent; color: #0f172a; border: 1.5px solid #e2e8f0;
          font-weight: 900; letter-spacing: 1.5px; cursor: pointer; transition: all 0.4s;
          display: flex; align-items: center; gap: 0.75rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          text-decoration: none;
        }
        .btn-outline:hover { border-color: #D4AF37; background: rgba(212,175,55,0.05); transform: translateY(-2px); }

        .loader-screen {
          height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #f8fafc; color: #D4AF37; font-weight: 900; letter-spacing: 10px;
          font-family: 'Outfit', sans-serif; font-size: 1.2rem;
        }

        .media-grid { display: grid; gap: 1.5rem; }
      `}</style>
    </div>
  );
}
