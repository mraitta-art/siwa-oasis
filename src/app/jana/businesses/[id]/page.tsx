'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';

/**
 * BUSINESS DNA EDITOR (High-Fidelity)
 * This is the master form where all Siwa-specific DNA is architected.
 */
export default function BusinessEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [biz, setBiz] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [tier, setTier] = useState<any>(null);
  const [adminControls, setAdminControls] = useState<Record<string, any>>({});
  const [journeyModules, setJourneyModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const bRes = await fetch(`/api/jana/businesses?id=${id}`);
      const business = await bRes.json();
      setBiz(business);

      const fRes = await fetch(`/api/jana/forms?type=${business.type_id}`);
      const schema = await fRes.json();
      setFields(schema);

      const sRes = await fetch('/api/jana/sections');
      const allSections = await sRes.json();
      const uniqueSectionIds = Array.from(new Set(schema.map((f: any) => f.section_id)));
      setSections(allSections.filter((s: any) => uniqueSectionIds.includes(s.id)));

      const tRes = await fetch('/api/jana/tiers');
      const allTiers = await tRes.json();
      const myTier = allTiers.find((t: any) => t.id === business.subscription_tier);
      setTier(myTier);

      const ctrlRes = await fetch(`/api/admin/businesses/${id}/section-controls`);
      const ctrlData = await ctrlRes.json();
      if (ctrlData.success && ctrlData.controls) {
        const controlsMap: Record<string, any> = {};
        ctrlData.controls.forEach((c: any) => {
          controlsMap[c.section_id] = c;
        });
        setAdminControls(controlsMap);
      }

      const capRes = await fetch(`/api/jana/businesses/${id}/capabilities`);
      const capData = await capRes.json();
      if (capData?.success) {
        setJourneyModules(capData.enabled_modules || []);
      }

    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function toggleJourneyModule(modId: string) {
    const next = journeyModules.includes(modId)
      ? journeyModules.filter(m => m !== modId)
      : [...journeyModules, modId];
    setJourneyModules(next);
    try {
      await fetch(`/api/jana/businesses/${id}/capabilities`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled_modules: next })
      });
    } catch (e) {
      console.error(e);
    }
  }

  const handleDataChange = (sectionId: string, name: string, value: any) => {
    setBiz((prev: any) => {
      const nextCustom = { ...prev.custom_data };
      if (!nextCustom[sectionId]) nextCustom[sectionId] = {};
      nextCustom[sectionId][name] = value;
      return { ...prev, custom_data: nextCustom };
    });
  };

  async function saveBusiness() {
    setSaving(true);
    try {
      await fetch('/api/jana/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name_ar: biz.name_ar || null, custom_data: biz.custom_data })
      });
      alert('Business DNA updated successfully!');
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function toggleAdminControl(sectionId: string, field: 'admin_locked_label' | 'admin_hidden' | 'admin_disabled') {
    const current = adminControls[sectionId] || { admin_locked_label: 0, admin_hidden: 0, admin_disabled: 0, cta_phone: '' };
    const nextVal = current[field] === 1 ? 0 : 1;
    
    // Optimistic UI update
    setAdminControls(prev => ({
      ...prev,
      [sectionId]: { ...current, [field]: nextVal }
    }));

    try {
      await fetch(`/api/admin/businesses/${id}/section-controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          adminLockedLabel: field === 'admin_locked_label' ? nextVal : current.admin_locked_label,
          adminHidden: field === 'admin_hidden' ? nextVal : current.admin_hidden,
          adminDisabled: field === 'admin_disabled' ? nextVal : current.admin_disabled,
          ctaPhone: current.cta_phone || null,
        })
      });
    } catch (e) { console.error(e); }
  }

  async function saveCtaPhone(sectionId: string, phone: string) {
    const current = adminControls[sectionId] || { admin_locked_label: 0, admin_hidden: 0, admin_disabled: 0 };
    setAdminControls(prev => ({ ...prev, [sectionId]: { ...current, cta_phone: phone } }));
    try {
      await fetch(`/api/admin/businesses/${id}/section-controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          adminLockedLabel: current.admin_locked_label,
          adminHidden: current.admin_hidden,
          adminDisabled: current.admin_disabled,
          ctaPhone: phone || null,
        })
      });
    } catch (e) { console.error(e); }
  }

  // ── Admin per-minisite field visibility (stored in custom_data.field_visibility) ──
  // 'hide_field'  -> remove label + value from the minisite body
  // 'hide_value'  -> keep the label but blank the value (raw value still saved for blog tokens)
  const fvMap: Record<string, Record<string, string>> = biz?.custom_data?.field_visibility || {};

  function applyVisibilityTo(sectionId: string, changes: Record<string, 'show' | 'hide_field' | 'hide_value'>) {
    setBiz((prev: any) => {
      const cd = { ...(prev.custom_data || {}) };
      const fv: Record<string, any> = { ...(cd.field_visibility || {}) };
      const sec = { ...(fv[sectionId] || {}) };
      Object.entries(changes).forEach(([name, mode]) => {
        if (mode === 'show') delete sec[name];
        else sec[name] = mode;
      });
      if (Object.keys(sec).length === 0) delete fv[sectionId];
      else fv[sectionId] = sec;
      cd.field_visibility = fv;
      return { ...prev, custom_data: cd };
    });
  }

  function setFieldVisibility(sectionId: string, fieldName: string, mode: 'show' | 'hide_field' | 'hide_value') {
    applyVisibilityTo(sectionId, { [fieldName]: mode });
  }

  function setSectionFieldsBulk(sectionId: string, mode: 'show' | 'hide_field' | 'hide_value') {
    const changes: Record<string, any> = {};
    fields.filter((f: any) => f.section_id === sectionId).forEach((f: any) => { changes[f.name] = mode; });
    applyVisibilityTo(sectionId, changes);
  }

  const bulkBtn = (bg: string): React.CSSProperties => ({
    padding: '0.2rem 0.45rem', background: bg, color: '#fff', border: 'none',
    borderRadius: '6px', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer',
  });

  if (loading) return (
    <div style={{ background: '#f8fafc', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <i className="fas fa-dna fa-spin fa-3x" style={{ color: '#D4AF37', marginBottom: '1rem' }}></i>
        <div style={{ fontWeight: 800, color: '#1e293b' }}>LOADING DNA ARCHITECT...</div>
      </div>
    </div>
  );

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <Link href="/jana/businesses" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-arrow-left"></i> BACK TO REGISTRY
            </Link>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.75rem', color: '#1e293b' }}>
              Edit Business DNA: <span style={{ color: '#D4AF37' }}>{biz.name}</span>
            </h1>
            {/* Arabic is optional and admin-entered: the column allows NULL and
                every public reader falls back to the English name. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>
                ARABIC NAME
              </span>
              <input
                dir="rtl"
                value={biz.name_ar || ''}
                placeholder="الاسم بالعربية"
                onChange={(e) => setBiz({ ...biz, name_ar: e.target.value })}
                style={{
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.85rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  minWidth: 260,
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href={`/jana/businesses/${id}/contact-dashboard`} className="btn btn-outline" style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
              <i className="fas fa-address-card" style={{ marginRight: '0.4rem' }}></i> CONTACT DASHBOARD
            </Link>
            <Link href={`/jana/businesses/${id}/orchestrate`} className="btn btn-outline" style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
              <i className="fas fa-photo-film" style={{ marginRight: '0.4rem' }}></i> BUSINESS CONTENT
            </Link>
            <Link href={`/${biz?.slug || id}`} target="_blank" className="btn btn-outline">VIEW MINISITE</Link>
            <button onClick={saveBusiness} disabled={saving} className="btn btn-primary">
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
             <DynamicForm 
                fields={fields} data={biz.custom_data || {}} onChange={handleDataChange} 
                sections={sections} userRole="admin" tierFeatures={tier?.features || {}}
             />
          </div>
          <aside>
             <div style={{ position: 'sticky', top: '2rem' }}>
                <div style={{ background: '#1e293b', color: '#fff', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                   <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>DNA Health Check</h4>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                     <span style={{ opacity: 0.6 }}>Sections Filled</span>
                     <span style={{ fontWeight: 800, color: '#D4AF37' }}>{Object.keys(biz.custom_data || {}).length} / {sections.length}</span>
                   </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                     <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', fontWeight: 800 }}>Journey Capabilities</h4>
                     <Link href="/jana/journey-planner" style={{ fontSize: '0.7rem', color: '#D4AF37', textDecoration: 'none', fontWeight: 800 }}>Planner &rarr;</Link>
                   </div>
                   <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.4 }}>
                     Select which journey planner sectors this vendor can create packages and receive bookings for:
                   </p>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                     {[
                       { id: 'accommodation', label: '🏨 Accommodation & Stays' },
                       { id: 'tours_safari', label: '🚙 Desert Safaris & Tours' },
                       { id: 'activities_wellness', label: '🏄 Activities & Wellness' },
                       { id: 'transportation', label: '🚐 Transfers & Logistics' },
                       { id: 'dining', label: '🍽️ Dining & Bedouin Feasts' },
                     ].map(m => (
                       <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}>
                         <input
                           type="checkbox"
                           checked={journeyModules.includes(m.id)}
                           onChange={() => toggleJourneyModule(m.id)}
                           style={{ accentColor: '#D4AF37' }}
                         />
                         {m.label}
                       </label>
                     ))}
                   </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                   <h4 style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#1e293b' }}>Section Controls (Admin)</h4>
                   <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {sections.map(s => {
                        const ctrl = adminControls[s.id] || { admin_locked_label: 0, admin_hidden: 0, admin_disabled: 0, cta_phone: '' };
                        return (
                          <li key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                               <i className={`fas ${s.icon}`} style={{ color: '#D4AF37' }}></i>
                               {s.name}
                             </div>
                             
                             {/* Controls */}
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1.5rem' }}>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#64748b', cursor: 'pointer' }}>
                                 <input type="checkbox" checked={ctrl.admin_hidden === 1} onChange={() => toggleAdminControl(s.id, 'admin_hidden')} />
                                 Force Hide from Public
                               </label>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#64748b', cursor: 'pointer' }}>
                                 <input type="checkbox" checked={ctrl.admin_locked_label === 1} onChange={() => toggleAdminControl(s.id, 'admin_locked_label')} />
                                 Lock Custom Tab Name
                               </label>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#64748b', cursor: 'pointer' }}>
                                 <input type="checkbox" checked={ctrl.admin_disabled === 1} onChange={() => toggleAdminControl(s.id, 'admin_disabled')} />
                                 Disable Vendor Editing
                               </label>
                               {/* Field visibility on the minisite body (admin) */}
                               {(() => {
                                 const sectionFields = fields.filter((f: any) => f.section_id === s.id);
                                 if (sectionFields.length === 0) return null;
                                 return (
                                   <div style={{ marginTop: '0.55rem', paddingTop: '0.5rem', borderTop: '1px dashed #f1f5f9' }}>
                                     <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>🧩 FIELD VISIBILITY ON MINISITE</div>
                                     <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                                       <button type="button" onClick={() => setSectionFieldsBulk(s.id, 'hide_field')} style={bulkBtn('#ef4444')}>Hide all fields</button>
                                       <button type="button" onClick={() => setSectionFieldsBulk(s.id, 'hide_value')} style={bulkBtn('#f59e0b')}>Hide all values</button>
                                       <button type="button" onClick={() => setSectionFieldsBulk(s.id, 'show')} style={bulkBtn('#10b981')}>Show all</button>
                                     </div>
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '190px', overflowY: 'auto' }}>
                                       {sectionFields.map((f: any) => {
                                         const mode = (fvMap[s.id] || {})[f.name] || 'show';
                                         return (
                                           <label key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.68rem', color: '#334155' }}>
                                             <span title={f.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label || f.name}</span>
                                             <select
                                               value={mode}
                                               onChange={(e) => setFieldVisibility(s.id, f.name, e.target.value as 'show' | 'hide_field' | 'hide_value')}
                                               style={{ fontSize: '0.62rem', padding: '0.15rem 0.3rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                                             >
                                               <option value="show">Show</option>
                                               <option value="hide_value">Hide value</option>
                                               <option value="hide_field">Hide field</option>
                                             </select>
                                           </label>
                                         );
                                       })}
                                     </div>
                                   </div>
                                 );
                               })()}
                               {/* CTA Phone Override */}
                               <div style={{ marginTop: '0.25rem' }}>
                                 <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                   📞 CTA PHONE OVERRIDE
                                 </div>
                                 <div style={{ display: 'flex', gap: '0.4rem' }}>
                                   <input
                                     type="tel"
                                     placeholder="e.g. +20 111 234 5678"
                                     value={ctrl.cta_phone || ''}
                                     onChange={e => setAdminControls(prev => ({ ...prev, [s.id]: { ...ctrl, cta_phone: e.target.value } }))}
                                     style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.68rem', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none' }}
                                   />
                                   <button
                                     onClick={() => saveCtaPhone(s.id, ctrl.cta_phone || '')}
                                     style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                                   >
                                     Save
                                   </button>
                                 </div>
                                 {ctrl.cta_phone && (
                                   <div style={{ fontSize: '0.58rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 700 }}>
                                     ✓ Active: {ctrl.cta_phone}
                                   </div>
                                 )}
                               </div>
                             </div>
                          </li>
                        );
                      })}
                   </ul>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
