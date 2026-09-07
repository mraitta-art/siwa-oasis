'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type GalleryItem = { url: string; caption: string };
type ContentMeta = {
  galleryStatus?: 'draft' | 'approved' | 'suspended';
  blogStatus?: 'draft' | 'approved' | 'suspended';
  galleryOnMain?: boolean;
  galleryOnMinisite?: boolean;
  blogOnMain?: boolean;
  blogOnMinisite?: boolean;
};

const EMPTY_META: ContentMeta = {
  galleryStatus: 'draft', blogStatus: 'draft',
  galleryOnMain: false, galleryOnMinisite: true,
  blogOnMain: false, blogOnMinisite: true,
};

function parseGallery(value: unknown): GalleryItem[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string'
    ? { url: item, caption: '' }
    : { url: item?.url || '', caption: item?.caption || '' }
  ).filter(item => item.url);
}

export default function ContentManagementPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [sectionControls, setSectionControls] = useState<Record<string, any>>({});
  const [sectionLabel, setSectionLabel] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [newImage, setNewImage] = useState({ url: '', caption: '' });
  const [blogTitle, setBlogTitle] = useState('');
  const [blogBody, setBlogBody] = useState('');
  const [meta, setMeta] = useState<ContentMeta>(EMPTY_META);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/jana/businesses')
      .then(response => response.json())
      .then(data => setBusinesses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!businessId) {
      setBusiness(null); setSections([]); setSectionId(''); return;
    }
    const nextBusiness = businesses.find(item => item.id === businessId);
    setBusiness(nextBusiness || null);
    if (!nextBusiness) return;
    Promise.all([
      fetch(`/api/jana/sections?type=${nextBusiness.type_id}`).then(response => response.json()),
      fetch(`/api/jana/businesses?id=${businessId}`).then(response => response.json()),
      fetch(`/api/admin/businesses/${businessId}/section-controls`).then(response => response.json()),
    ]).then(([sectionData, fullBusiness, controlData]) => {
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setBusiness(fullBusiness);
      const controls: Record<string, any> = {};
      (controlData?.controls || []).forEach((control: any) => { controls[control.section_id] = control; });
      setSectionControls(controls);
      const first = (Array.isArray(sectionData) ? sectionData : [])[0];
      setSectionId(current => current || first?.id || '');
    });
  }, [businessId, businesses]);

  useEffect(() => {
    const data = business?.custom_data?.[sectionId] || {};
    const storedMeta = business?.custom_data?.section_content_meta?.[sectionId] || {};
    setSectionLabel(business?.custom_data?.section_labels?.[sectionId] || '');
    setGallery(parseGallery(data.section_gallery));
    setBlogTitle(data.section_blog_title || '');
    setBlogBody(data.section_blog || data.mini_blog || '');
    setMeta({ ...EMPTY_META, ...storedMeta });
    setNewImage({ url: '', caption: '' });
  }, [business, sectionId]);

  const visibleBusinesses = useMemo(() => businesses.filter(item =>
    `${item.name || ''} ${item.vendor_name || ''} ${item.type_name || ''}`.toLowerCase().includes(filter.toLowerCase())
  ), [businesses, filter]);
  const section = sections.find(item => item.id === sectionId);

  function updateMeta(key: keyof ContentMeta, value: boolean | string) {
    setMeta(current => ({ ...current, [key]: value }));
  }

  function addImage() {
    if (!newImage.url.trim()) return;
    setGallery(current => [...current, { url: newImage.url.trim(), caption: newImage.caption.trim() }]);
    setNewImage({ url: '', caption: '' });
  }

  async function saveContent() {
    if (!business || !sectionId) return;
    setSaving(true); setMessage('');
    const customData = { ...(business.custom_data || {}) };
    customData.section_labels = {
      ...(customData.section_labels || {}),
      [sectionId]: sectionLabel.trim(),
    };
    customData[sectionId] = {
      ...(customData[sectionId] || {}),
      section_gallery: gallery,
      section_blog_title: blogTitle,
      section_blog: blogBody,
    };
    customData.section_content_meta = {
      ...(customData.section_content_meta || {}),
      [sectionId]: meta,
    };
    try {
      const response = await fetch('/api/jana/businesses', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, custom_data: customData }),
      });
      if (!response.ok) throw new Error('Save failed');
      setBusiness((current: any) => ({ ...current, custom_data: customData }));
      setMessage('Content saved. Placement and moderation settings are active for this business.');
    } catch (error: any) {
      setMessage(error.message || 'Save failed');
    } finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: '3rem', color: '#64748b' }}>Loading content workspace...</div>;

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ color: '#a16207', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1.5px' }}>CONTENT OPERATIONS</div>
          <h1 style={{ margin: '0.35rem 0', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>Business Content Management</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Curate section images, captions, stories, and publication placement.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link href="/jana/setup" style={{ padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '9px', color: '#475569', textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>Setup authority</Link>
          <Link href="/jana/sections" style={{ padding: '0.65rem 0.9rem', background: '#0f172a', borderRadius: '9px', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>Section schema</Link>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <aside style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Find business..." style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          </div>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {visibleBusinesses.map(item => (
              <button key={item.id} onClick={() => setBusinessId(item.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.9rem 1rem', border: 0, borderBottom: '1px solid #f1f5f9', background: item.id === businessId ? '#fffbeb' : '#fff', cursor: 'pointer' }}>
                <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.82rem' }}>{item.name}</strong>
                <span style={{ display: 'block', marginTop: '0.2rem', color: '#64748b', fontSize: '0.68rem' }}>{item.type_name || 'Unclassified'} · {item.vendor_name || item.vendor_email || 'No vendor'}</span>
              </button>
            ))}
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          {!business ? (
            <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '14px', padding: '5rem 2rem', textAlign: 'center', color: '#64748b' }}>Select a business to manage its section content.</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}><h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{business.name}</h2><span style={{ color: '#64748b', fontSize: '0.72rem' }}>{business.type_name} · Plan: {business.subscription_tier || 'free'}</span></div>
                <select value={sectionId} onChange={event => setSectionId(event.target.value)} style={{ minWidth: '220px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  {sections.map(item => <option key={item.id} value={item.id}>{item.name}{item.is_universal ? ' · Universal' : ''}</option>)}
                </select>
              </div>

              <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.8px', marginBottom: '0.4rem' }}>MINISITE SECTION NAME</label>
                <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                  <input value={sectionLabel} onChange={event => setSectionLabel(event.target.value)} placeholder={section?.name || 'Default section name'} disabled={!!sectionControls[sectionId]?.admin_locked_label} style={{ flex: 1, padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '7px', background: sectionControls[sectionId]?.admin_locked_label ? '#f8fafc' : '#fff' }} />
                  {sectionControls[sectionId]?.admin_locked_label && <span style={{ color: '#b91c1c', fontSize: '0.7rem', fontWeight: 800 }}><i className="fas fa-lock" /> Locked</span>}
                </div>
                <div style={{ marginTop: '0.4rem', color: '#94a3b8', fontSize: '0.68rem' }}>This name appears as the tab title on the business minisite and is saved with the section content.</div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: '1rem' }}>
                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>Images & captions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input value={newImage.url} onChange={event => setNewImage(current => ({ ...current, url: event.target.value }))} placeholder="Image URL" style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '7px' }} />
                    <input value={newImage.caption} onChange={event => setNewImage(current => ({ ...current, caption: event.target.value }))} placeholder="Caption" style={{ padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '7px' }} />
                    <button onClick={addImage} style={{ padding: '0 0.8rem', border: 0, borderRadius: '7px', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Add</button>
                  </div>
                  {gallery.map((item, index) => <div key={`${item.url}-${index}`} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr) auto', gap: '0.7rem', alignItems: 'center', padding: '0.65rem 0', borderTop: '1px solid #f1f5f9' }}>
                    <img src={item.url} alt={item.caption || 'Section preview'} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: '6px', background: '#f1f5f9' }} />
                    <div style={{ minWidth: 0 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem', color: '#475569' }}>{item.url}</div><input value={item.caption} onChange={event => setGallery(current => current.map((entry, i) => i === index ? { ...entry, caption: event.target.value } : entry))} placeholder="Add image caption" style={{ width: '100%', marginTop: '0.3rem', boxSizing: 'border-box', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '5px' }} /></div>
                    <button onClick={() => setGallery(current => current.filter((_, i) => i !== index))} title="Remove image" style={{ border: 0, background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', width: 30, height: 30, cursor: 'pointer' }}><i className="fas fa-trash" /></button>
                  </div>)}
                  {gallery.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>No images in this section yet.</p>}
                </section>

                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>Publication controls</h3>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.35rem' }}>Content status</label>
                  <select value={meta.galleryStatus} onChange={event => updateMeta('galleryStatus', event.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '7px', marginBottom: '0.9rem' }}><option value="draft">Draft</option><option value="approved">Approved</option><option value="suspended">Suspended</option></select>
                  {[['galleryOnMain', 'Main website carousel'], ['galleryOnMinisite', 'Business minisite carousel']].map(([key, label]) => <label key={key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '0.7rem 0', fontSize: '0.75rem', color: '#475569' }}><input type="checkbox" checked={!!meta[key as keyof ContentMeta]} onChange={event => updateMeta(key as keyof ContentMeta, event.target.checked)} />{label}</label>)}
                  <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.7rem', lineHeight: 1.5 }}>Placement is separate from approval. Suspended content remains saved but is excluded from publication.</div>
                </section>
              </div>

              <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', marginTop: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>Section story / small blog</h3>
                <input value={blogTitle} onChange={event => setBlogTitle(event.target.value)} placeholder="Story title" style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '7px', marginBottom: '0.7rem' }} />
                <textarea value={blogBody} onChange={event => setBlogBody(event.target.value)} placeholder="Write the section story..." rows={7} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '7px', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.8rem' }}><select value={meta.blogStatus} onChange={event => updateMeta('blogStatus', event.target.value)} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '7px' }}><option value="draft">Blog draft</option><option value="approved">Blog approved</option><option value="suspended">Blog suspended</option></select>{[['blogOnMain', 'Show story on main carousel'], ['blogOnMinisite', 'Show story on minisite']].map(([key, label]) => <label key={key} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.73rem', color: '#475569' }}><input type="checkbox" checked={!!meta[key as keyof ContentMeta]} onChange={event => updateMeta(key as keyof ContentMeta, event.target.checked)} />{label}</label>)}</div>
              </section>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>{message && <span style={{ color: message.includes('failed') ? '#b91c1c' : '#15803d', fontSize: '0.75rem' }}>{message}</span>}<button onClick={saveContent} disabled={saving || !section} style={{ padding: '0.75rem 1.2rem', border: 0, borderRadius: '8px', background: saving ? '#94a3b8' : '#0f172a', color: '#fff', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : 'Save content & placement'}</button></div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
