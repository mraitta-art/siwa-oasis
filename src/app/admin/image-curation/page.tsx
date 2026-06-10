'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface GalleryImage {
  id: string;
  vendor_id: string;
  vendor_name: string;
  section_id: string;
  section_name: string;
  business_name: string;
  url: string;
  caption: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_hero: boolean;
  uploaded_at: string;
}

const S = {
  wrap: { minHeight: '100vh', background: '#f8fafc', padding: '2rem' },
  container: { maxWidth: '1400px', margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '2rem', fontWeight: 900, color: '#1a1a2e', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b', marginBottom: '1.5rem' },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '12px' },
  filterGroup: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#1a1a2e' },
  select: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.95rem' },
  gallery: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' },
  imageCard: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid transparent', transition: 'all 0.3s' },
  imageCardPending: { borderColor: '#fbbf24' },
  imageCardApproved: { borderColor: '#10b981' },
  imageCardRejected: { borderColor: '#ef4444' },
  imageContainer: { height: '250px', background: '#000', overflow: 'hidden', position: 'relative' as const },
  image: { width: '100%', height: '100%', objectFit: 'cover' as const },
  statusBadge: { position: 'absolute' as const, top: '0.5rem', right: '0.5rem', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' },
  statusPending: { background: '#fbbf24' },
  statusApproved: { background: '#10b981' },
  statusRejected: { background: '#ef4444' },
  info: { padding: '1.5rem' },
  businessName: { fontSize: '1.1rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '0.5rem' },
  sectionName: { fontSize: '0.9rem', color: '#556B2F', fontWeight: 'bold', marginBottom: '0.5rem' },
  vendorName: { fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' },
  caption: { fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', fontStyle: 'italic' },
  actions: { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' },
  actionBtn: { flex: 1, padding: '0.6rem', borderRadius: '6px', border: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' },
  approveBtn: { background: '#10b981', color: '#fff' },
  rejectBtn: { background: '#ef4444', color: '#fff' },
  heroToggle: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px', fontSize: '0.85rem' },
  heroCheckbox: { cursor: 'pointer' },
  message: { padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }
};

export default function AdminImageCurationPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [filterSection, setFilterSection] = useState('');
  const [sections, setSections] = useState<{id: string, name: string}[]>([]);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    loadImages();
    loadSections();
  }, [filterStatus, filterSection]);

  async function loadImages() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterSection) params.append('section', filterSection);

      const res = await fetch(`/api/admin/image-curation?${params}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load error:', err);
      showMessage('error', 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }

  async function loadSections() {
    try {
      const res = await fetch('/api/admin/sections');
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load sections error:', err);
    }
  }

  async function approveImage(imageId: string) {
    try {
      const res = await fetch(`/api/admin/image-curation/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'approved' })
      });
      
      if (res.ok) {
        showMessage('success', '✓ Image approved for hero carousel');
        await loadImages();
      }
    } catch (err) {
      showMessage('error', 'Failed to approve image');
    }
  }

  async function rejectImage(imageId: string) {
    try {
      const res = await fetch(`/api/admin/image-curation/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'rejected' })
      });
      
      if (res.ok) {
        showMessage('success', '✓ Image rejected');
        await loadImages();
      }
    } catch (err) {
      showMessage('error', 'Failed to reject image');
    }
  }

  async function setAsHero(imageId: string, isHero: boolean) {
    try {
      const res = await fetch(`/api/admin/image-curation/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hero: !isHero })
      });
      
      if (res.ok) {
        showMessage('success', isHero ? '✓ Removed from hero' : '✓ Set as hero image');
        await loadImages();
      }
    } catch (err) {
      showMessage('error', 'Failed to update hero status');
    }
  }

  function showMessage(type: 'success'|'error', text: string) {
    setMessage({type, text});
    setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div style={S.wrap}>
      <div style={S.container}>
        <div style={S.header}>
          <h1 style={S.title}>🖼️ Hero Carousel Image Approval</h1>
          <p style={S.subtitle}>Review and approve vendor images for minisite hero carousels</p>
        </div>

        {message && (
          <div style={{...S.message, background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b'}}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div style={S.filters}>
          <div style={S.filterGroup}>
            <label style={S.label}>Status</label>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value as any)}
              style={S.select}
            >
              <option value="all">All Images</option>
              <option value="pending">⏳ Pending Review</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.label}>Section</label>
            <select 
              value={filterSection} 
              onChange={e => setFilterSection(e.target.value)}
              style={S.select}
            >
              <option value="">All Sections</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.label}>Pending Count</label>
            <div style={{...S.select, textAlign: 'center', background: '#fef3c7', fontWeight: 'bold', color: '#92400e', padding: '0.75rem'}}>
              {images.filter(i => i.approval_status === 'pending').length}
            </div>
          </div>
        </div>

        {/* Gallery */}
        {loading ? (
          <div style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>
            Loading images...
          </div>
        ) : images.length === 0 ? (
          <div style={{textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px', color: '#64748b'}}>
            No images found
          </div>
        ) : (
          <div style={S.gallery}>
            {images.map(img => (
              <div 
                key={img.id} 
                style={{
                  ...S.imageCard,
                  ...(img.approval_status === 'pending' ? S.imageCardPending : 
                     img.approval_status === 'approved' ? S.imageCardApproved : 
                     S.imageCardRejected)
                }}
              >
                <div style={S.imageContainer}>
                  <img src={img.url} alt={img.caption} style={S.image} />
                  <div style={{...S.statusBadge, ...(img.approval_status === 'pending' ? S.statusPending :
                                                     img.approval_status === 'approved' ? S.statusApproved :
                                                     S.statusRejected)}}>
                    {img.approval_status === 'pending' ? '⏳ Pending' :
                     img.approval_status === 'approved' ? '✅ Approved' :
                     '❌ Rejected'}
                  </div>
                </div>

                <div style={S.info}>
                  <div style={S.businessName}>{img.business_name}</div>
                  <div style={S.sectionName}>📍 {img.section_name}</div>
                  <div style={S.vendorName}>👤 {img.vendor_name}</div>
                  <div style={S.caption}>"{img.caption}"</div>

                  {/* Action Buttons */}
                  <div style={S.actions}>
                    {img.approval_status !== 'approved' && (
                      <button 
                        onClick={() => approveImage(img.id)}
                        style={{...S.actionBtn, ...S.approveBtn}}
                      >
                        ✓ Approve
                      </button>
                    )}
                    {img.approval_status !== 'rejected' && (
                      <button 
                        onClick={() => rejectImage(img.id)}
                        style={{...S.actionBtn, ...S.rejectBtn}}
                      >
                        ✕ Reject
                      </button>
                    )}
                  </div>

                  {/* Hero Toggle */}
                  {img.approval_status === 'approved' && (
                    <label style={S.heroToggle}>
                      <input 
                        type="checkbox" 
                        checked={img.is_hero}
                        onChange={() => setAsHero(img.id, img.is_hero)}
                        style={S.heroCheckbox}
                      />
                      <span>⭐ Featured Hero</span>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
