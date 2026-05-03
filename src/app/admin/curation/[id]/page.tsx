'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * ADMIN CONTENT CURATION STUDIO
 * This is where the Admin takes total authority over vendor content.
 * 1. Curate the Hero Carousel (Select approved photos)
 * 2. Control Omnichannel Distribution (Main Site vs Minisite)
 * 3. Lock/Hide specific fields per vendor.
 */
export default function CurationStudioPage() {
  const { id } = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Curation State (Local overrides)
  const [curationData, setCurationData] = useState<any>({
    approved_slides: [], // IDs of photos approved for the hero
    distribution_overrides: {}, // { field_id: { main_site: bool, minisite: bool } }
    hidden_fields: [] // Array of field IDs to hide
  });

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const bRes = await fetch(`/api/admin/businesses?id=${id}`);
      const data = await bRes.json();
      setBusiness(data);
      
      if (data.curation_data) {
        setCurationData(typeof data.curation_data === 'string' ? JSON.parse(data.curation_data) : data.curation_data);
      }

      const fRes = await fetch(`/api/admin/forms?type=${data.type_id}`);
      const schema = await fRes.json();
      setFields(schema);

      // Extract unique sections from schema
      const uniqueSections = Array.from(new Set(schema.map((f: any) => f.section_id)));
      const sRes = await fetch('/api/admin/sections');
      const allSections = await sRes.json();
      setSections(allSections.filter((s: any) => uniqueSections.includes(s.id)));

    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveCuration() {
    setSaving(true);
    try {
      await fetch(`/api/admin/businesses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          curation_data: curationData
        })
      });
      alert('Curation saved successfully.');
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  const toggleSlide = (photoUrl: string) => {
    const current = curationData.approved_slides || [];
    const next = current.includes(photoUrl) 
      ? current.filter((u: string) => u !== photoUrl)
      : [...current, photoUrl];
    setCurationData({ ...curationData, approved_slides: next });
  };

  const toggleDistribution = (fieldId: string, channel: 'main_site' | 'minisite') => {
    const overrides = { ...curationData.distribution_overrides };
    if (!overrides[fieldId]) overrides[fieldId] = { main_site: true, minisite: true };
    overrides[fieldId][channel] = !overrides[fieldId][channel];
    setCurationData({ ...curationData, distribution_overrides: overrides });
  };

  const toggleHidden = (fieldId: string) => {
    const hidden = [...(curationData.hidden_fields || [])];
    const next = hidden.includes(fieldId)
      ? hidden.filter(id => id !== fieldId)
      : [...hidden, fieldId];
    setCurationData({ ...curationData, hidden_fields: next });
  };

  if (loading) return <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading Content Studio...</div>;

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/admin/businesses" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-arrow-left"></i> BACK TO REGISTRY
            </Link>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.75rem', color: '#1e293b' }}>
              Content Curation: <span style={{ color: '#D4AF37' }}>{business.name}</span>
            </h1>
          </div>
          <button 
            onClick={saveCuration}
            disabled={saving}
            style={{ background: '#1e293b', color: '#fff', padding: '1rem 2.5rem', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
          >
            {saving ? 'SAVING...' : 'SAVE CURATION'}
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          
          {/* LEFT: CONTENT MODERATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* HERO CAROUSEL CURATION */}
            <section style={{ background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                  <i className="fas fa-images"></i>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Hero Carousel Curation</h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Select the photos that will appear in the high-fidelity minisite hero.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {fields.filter(f => f.field_type === 'gallery').map(field => {
                  const gallery = business.custom_data[field.name] || [];
                  return (Array.isArray(gallery) ? gallery : []).map((item: any, idx: number) => {
                    const url = typeof item === 'object' ? item.url : item;
                    const isApproved = curationData.approved_slides?.includes(url);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleSlide(url)}
                        style={{ 
                          position: 'relative', height: '120px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', 
                          border: isApproved ? '4px solid #D4AF37' : '1px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                      >
                        <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isApproved ? 1 : 0.6 }} />
                        {isApproved && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#D4AF37', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.6rem', padding: '4px', textAlign: 'center' }}>
                          {field.section_id.toUpperCase()}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </section>

            {/* FIELD-LEVEL OMNICHANNEL CONTROL */}
            <section style={{ background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '2rem' }}>Omnichannel & Visibility Control</h2>
              
              {sections.map(section => (
                <div key={section.id} style={{ marginBottom: '2.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', letterSpacing: '1px', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    {section.name.toUpperCase()}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {fields.filter(f => f.section_id === section.id).map(field => {
                      const isHidden = curationData.hidden_fields?.includes(field.id);
                      const dist = curationData.distribution_overrides?.[field.id] || { main_site: true, minisite: true };
                      
                      return (
                        <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: isHidden ? '#f8fafc' : '#fff', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                          <div style={{ opacity: isHidden ? 0.5 : 1 }}>
                            <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{field.label}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Type: {field.field_type}</div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            {/* OMNICHANNEL TOGGLES */}
                            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                              <button 
                                onClick={() => toggleDistribution(field.id, 'main_site')}
                                style={{ border: 'none', background: dist.main_site ? '#D4AF37' : 'transparent', color: dist.main_site ? '#fff' : '#64748b', fontSize: '0.6rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                              >MAIN SITE</button>
                              <button 
                                onClick={() => toggleDistribution(field.id, 'minisite')}
                                style={{ border: 'none', background: dist.minisite ? '#1e293b' : 'transparent', color: dist.minisite ? '#fff' : '#64748b', fontSize: '0.6rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                              >MINISITE</button>
                            </div>

                            {/* VISIBILITY TOGGLE */}
                            <button 
                              onClick={() => toggleHidden(field.id)}
                              style={{ 
                                background: isHidden ? '#ef4444' : '#fff', color: isHidden ? '#fff' : '#64748b', 
                                border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              <i className={isHidden ? 'fas fa-eye-slash' : 'fas fa-eye'}></i> {isHidden ? 'HIDDEN' : 'VISIBLE'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          </div>

          {/* RIGHT: SUMMARY & STATUS */}
          <aside>
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '2rem', color: '#fff', position: 'sticky', top: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Curation Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Approved Slides</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#D4AF37' }}>{curationData.approved_slides?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Hidden Fields</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ef4444' }}>{curationData.hidden_fields?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Omnichannel Rules</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{Object.keys(curationData.distribution_overrides || {}).length}</span>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, letterSpacing: '1px', marginBottom: '1rem' }}>LIVE SITE STATUS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: '12px', height: '12px', background: '#27ae60', borderRadius: '50%' }}></div>
                   <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Minisite Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', opacity: 0.5 }}>
                   <div style={{ width: '12px', height: '12px', background: '#94a3b8', borderRadius: '50%' }}></div>
                   <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Search Discovery Active</span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
