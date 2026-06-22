'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';
import { useLang } from '@/context/LangContext';

interface Field {
  id: string;
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  value: any;
  options?: any;
  help_text?: string;
  business_type_id?: string;
}

interface Section {
  id: string;
  name: string;
  icon: string;
  fields: Field[];
}

interface Typology {
  child:  { id: string; name: string; icon: string; color: string } | null;
  parent: { id: string; name: string; icon: string; color: string } | null;
}

export default function VendorStudio() {
  const { t, isRTL } = useLang();

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saveOk, setSaveOk]           = useState(false);
  const [business, setBusiness]       = useState<any>(null);
  const [typology, setTypology]       = useState<Typology>({ child: null, parent: null });
  const [sections, setSections]       = useState<Section[]>([]);
  const [activeTab, setActiveTab]     = useState<'core' | 'common' | 'unique'>('core');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData]       = useState<Record<string, any>>({});
  const [tierFeatures, setTierFeatures] = useState<Record<string, any>>({});

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

      const initialData: Record<string, any> = {};
      data.structure.forEach((s: Section) => {
        initialData[s.id] = {};
        s.fields.forEach((f: any) => { initialData[s.id][f.name] = f.value; });
      });
      setFormData(initialData);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (sectionId: string, fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [fieldName]: value }
    }));
  };

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/story', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ data: formData })
      });
      if (res.ok) {
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 3000);
      } else throw new Error('Failed to save');
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Group Sections
  const { coreSections, commonSections, uniqueSections } = useMemo(() => {
    const core: Section[] = [];
    const common: Section[] = [];
    const unique: Section[] = [];

    sections.forEach(s => {
      if (s.id === 'basic') {
        core.push(s);
      } else {
        const hasUniqueField = s.fields.some(f => f.business_type_id === typology.child?.id);
        if (hasUniqueField) unique.push(s);
        else common.push(s);
      }
    });

    return { coreSections: core, commonSections: common, uniqueSections: unique };
  }, [sections, typology]);

  // Handle Tab Switch
  useEffect(() => {
    let list: Section[] = [];
    if (activeTab === 'core') list = coreSections;
    else if (activeTab === 'common') list = commonSections;
    else if (activeTab === 'unique') list = uniqueSections;

    if (list.length > 0 && !list.some(s => s.id === activeSection)) {
      setActiveSection(list[0].id);
    }
  }, [activeTab, coreSections, commonSections, uniqueSections]);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', gap: '1.5rem' }}>
      <div style={{ width: 56, height: 56, border: '4px solid rgba(212,175,55,0.15)', borderTop: '4px solid #D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.8rem' }}>{t.preparingStudio || 'Loading Studio...'}</p>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const currentSection  = sections.find(s => s.id === activeSection);
  const allFields       = sections.flatMap(s => s.fields.map(f => ({ ...f, section_id: s.id, required: !!f.required })));
  const accentColor     = typology.child?.color  || '#D4AF37';

  // Stats
  const totalFields  = allFields.filter(f => f.name !== 'initialized').length;
  const filledFields = allFields.filter(f => {
    const val = formData[f.section_id]?.[f.name];
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'string') return val.trim().length > 0;
    return !!val;
  }).length;
  const overallPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  const currentList = activeTab === 'core' ? coreSections : activeTab === 'common' ? commonSections : uniqueSections;

  const tabDefs = [
    { id: 'core',   label: t.tabCore || 'Core Info',   icon: 'fa-fingerprint', color: '#D4AF37', count: coreSections.length },
    { id: 'common', label: t.tabCommon || 'Universal', icon: 'fa-globe',        color: '#3b82f6', count: commonSections.length },
    { id: 'unique', label: t.tabUnique || 'Unique', icon: 'fa-star',         color: '#10b981', count: uniqueSections.length },
  ];

  const sidebarLabel =
    activeTab === 'core' ? t.coreSections || 'Core Sections' :
    activeTab === 'common' ? t.universalSections || 'Universal Sections' :
    t.typologySections || 'Type-specific Sections';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#f8fafc', color: '#1a1a1a',
      fontFamily: isRTL ? "'Cairo', 'Segoe UI', sans-serif" : "'Inter', system-ui, sans-serif",
    }}>

      {/* ─── TOP NAVIGATION & TABS ──────────────────────────────────── */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        direction: isRTL ? 'rtl' : 'ltr',
      }}>
        <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
              <i className="fas fa-sun" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>{t.siwaStudio || 'Siwa Oasis Studio'}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>{t.swiftDataEntry || 'Vendor Engine'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-start' : 'flex-end', marginRight: isRTL ? 0 : '1rem', marginLeft: isRTL ? '1rem' : 0 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>{t.completion || 'Completion'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? '#10b981' : accentColor, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: overallPct === 100 ? '#10b981' : '#1e293b' }}>{overallPct}%</span>
              </div>
            </div>

            <Link href={`/business/${business?.id}`} target="_blank" className="btn btn-outline" style={{ border: '1px solid #e2e8f0', color: '#64748b', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
              <i className="fas fa-external-link-alt" style={{ marginRight: isRTL ? 0 : '0.5rem', marginLeft: isRTL ? '0.5rem' : 0 }}></i>
              {t.preview || 'Preview'}
            </Link>

            <button onClick={saveChanges} disabled={saving} style={{
              background: saveOk ? '#10b981' : '#0f172a', color: '#fff', border: 'none',
              padding: '0.6rem 1.5rem', borderRadius: '10px',
              fontSize: '0.75rem', fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: saveOk ? '0 4px 10px rgba(16,185,129,0.3)' : '0 4px 10px rgba(15,23,42,0.2)',
              transition: 'all 0.2s',
            }}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : saveOk ? <i className="fas fa-check"></i> : <i className="fas fa-cloud-upload-alt"></i>}
              {saving ? (t.saving || 'Saving...') : saveOk ? (t.saved || 'Saved!') : (t.publish || 'Publish Changes')}
            </button>
          </div>
        </div>

        {/* CATEGORIZATION TABS */}
        <div style={{ display: 'flex', padding: '0 2rem', gap: '2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          {tabDefs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '1rem 0', background: 'none', border: 'none',
                  borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                  color: isActive ? '#0f172a' : '#94a3b8',
                  fontWeight: isActive ? 900 : 700,
                  fontSize: '0.75rem', letterSpacing: isRTL ? '0' : '1px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.2s',
                }}
              >
                <i className={`fas ${tab.icon}`} style={{ color: isActive ? tab.color : '#cbd5e1' }}></i>
                {tab.label}
                <span style={{
                  background: isActive ? `${tab.color}15` : '#f1f5f9',
                  color: isActive ? tab.color : '#94a3b8',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem',
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* SUB-SECTIONS NAVIGATION */}
        <aside style={{ width: '280px', background: '#fff', borderRight: isRTL ? 'none' : '1px solid #e2e8f0', borderLeft: isRTL ? '1px solid #e2e8f0' : 'none', overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: isRTL ? '0' : '1px', marginBottom: '1rem' }}>
            {sidebarLabel}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentList.map(s => {
              const isActive = activeSection === s.id;

              const secFields = allFields.filter(f => f.section_id === s.id && f.name !== 'initialized');
              const secFilled = secFields.filter(f => {
                const val = formData[s.id]?.[f.name];
                if (!val) return false;
                if (Array.isArray(val)) return val.length > 0;
                if (typeof val === 'string') return val.trim().length > 0;
                return !!val;
              }).length;
              const secPct = secFields.length > 0 ? Math.round((secFilled / secFields.length) * 100) : 0;

              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    padding: '1rem',
                    background: isActive ? '#f8fafc' : '#fff',
                    border: isActive ? `1px solid ${accentColor}40` : '1px solid transparent',
                    borderRadius: '12px', textAlign: isRTL ? 'right' : 'left',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.02)' : 'none',
                    transition: 'all 0.2s',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: isActive ? accentColor : '#f1f5f9', color: isActive ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#0f172a' : '#64748b' }}>{s.name}</div>
                    <div style={{ fontSize: '0.6rem', color: secPct === 100 ? '#10b981' : '#94a3b8', fontWeight: 700, marginTop: '2px' }}>
                      {secPct === 100 ? (t.completed || 'Completed') : `${secPct}%`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* FORM CANVAS */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', background: '#f8fafc' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>

            {/* BUSINESS HEADER — core / basic section */}
            {activeTab === 'core' && currentSection?.id === 'basic' && (
              <div style={{
                background: '#fff', borderRadius: '24px', padding: '2rem', marginBottom: '2rem',
                border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '16px', background: `${accentColor}15`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    <i className={`fas ${typology.child?.icon || 'fa-building'}`}></i>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', letterSpacing: '1px' }}>
                        ID: {business?.id?.split('-')[0]}
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: `${accentColor}15`, color: accentColor, padding: '4px 10px', borderRadius: '8px', letterSpacing: '1px' }}>
                        {typology.parent?.name?.toUpperCase()} &gt; {typology.child?.name?.toUpperCase()}
                      </span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', textAlign: isRTL ? 'right' : 'left' }}>
                      {business?.name}
                    </h1>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION CANVAS */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#f8fafc', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                  <i className={`fas ${currentSection?.icon}`}></i>
                </div>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{currentSection?.name}</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{t.fillDetails || 'Please fill in this section\'s details.'}</p>
                </div>
              </div>

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

          </div>
        </main>
      </div>

    </div>
  );
}
