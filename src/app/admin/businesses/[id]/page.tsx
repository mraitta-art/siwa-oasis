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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const bRes = await fetch(`/api/admin/businesses?id=${id}`);
      const business = await bRes.json();
      setBiz(business);

      const fRes = await fetch(`/api/admin/forms?type=${business.type_id}`);
      const schema = await fRes.json();
      setFields(schema);

      const sRes = await fetch('/api/admin/sections');
      const allSections = await sRes.json();
      const uniqueSectionIds = Array.from(new Set(schema.map((f: any) => f.section_id)));
      setSections(allSections.filter((s: any) => uniqueSectionIds.includes(s.id)));

      const tRes = await fetch('/api/admin/tiers');
      const allTiers = await tRes.json();
      const myTier = allTiers.find((t: any) => t.id === business.subscription_tier);
      setTier(myTier);

    } catch (e) { console.error(e); }
    setLoading(false);
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
      await fetch('/api/admin/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, custom_data: biz.custom_data })
      });
      alert('Business DNA updated successfully!');
    } catch (e) { console.error(e); }
    setSaving(false);
  }

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
            <Link href="/admin/businesses" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-arrow-left"></i> BACK TO REGISTRY
            </Link>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.75rem', color: '#1e293b' }}>
              Edit Business DNA: <span style={{ color: '#D4AF37' }}>{biz.name}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href={`/business/${id}`} target="_blank" className="btn btn-outline">VIEW MINISITE</Link>
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
                <div style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                   <h4 style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#1e293b' }}>Active Modules</h4>
                   <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {sections.map(s => (
                        <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                           <i className={`fas ${s.icon}`} style={{ width: '15px', color: '#D4AF37' }}></i>
                           {s.name}
                           {biz.custom_data?.[s.id] && <i className="fas fa-check-circle" style={{ color: '#22c55e', marginLeft: 'auto' }}></i>}
                        </li>
                      ))}
                   </ul>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
