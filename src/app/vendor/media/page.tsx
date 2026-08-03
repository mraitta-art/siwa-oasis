'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
  section_id?: string;
  section_name?: string;
  isHero?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

interface Section {
  id: string;
  name: string;
}

const MEDIA_CSS = `
  .vm-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
  }
  .vm-card {
    background: #ffffff; border: 1px solid #eef0f5; border-radius: 22px;
    padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s;
  }
  .vm-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); }

  /* Drag drop zone */
  .vm-dropzone {
    border: 2px dashed rgba(212,175,55,0.4);
    background: linear-gradient(135deg, rgba(212,175,55,0.03), rgba(240,200,66,0.01));
    border-radius: 20px; padding: 3rem 2rem; text-align: center;
    cursor: pointer; transition: all 0.25s;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .vm-dropzone.active, .vm-dropzone:hover {
    border-color: #D4AF37;
    background: linear-gradient(135deg, rgba(212,175,55,0.08), rgba(240,200,66,0.03));
    transform: scale(1.005);
  }
  .vm-drop-icon {
    width: 64px; height: 64px; border-radius: 20px;
    background: rgba(212,175,55,0.12); color: #D4AF37;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; margin-bottom: 1rem;
    box-shadow: 0 4px 16px rgba(212,175,55,0.2);
  }

  /* Gallery grid */
  .vm-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem;
  }
  .vm-img-card {
    position: relative; border-radius: 18px; overflow: hidden;
    background: #0f172a; border: 1px solid #e2e8f0;
    aspect-ratio: 4/3;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .vm-img-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
  .vm-img-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
  .vm-img-card:hover img { transform: scale(1.06); }
  .vm-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%);
    opacity: 0; transition: opacity 0.2s;
    display: flex; flex-direction: column; justify-content: space-between; padding: 0.85rem;
  }
  .vm-img-card:hover .vm-img-overlay { opacity: 1; }

  .vm-hero-badge {
    position: absolute; top: 10px; left: 10px; z-index: 2;
    background: linear-gradient(135deg, #D4AF37, #f0c842);
    color: #2a1a00; font-size: 0.55rem; font-weight: 900;
    padding: 3px 8px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .vm-section-tag {
    position: absolute; bottom: 10px; left: 10px; z-index: 2;
    background: rgba(15,23,42,0.85); color: #fff; font-size: 0.58rem; font-weight: 700;
    padding: 3px 8px; border-radius: 10px; backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.15); max-width: 140px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .vm-status-badge {
    position: absolute; top: 10px; right: 10px; z-index: 2;
    font-size: 0.52rem; font-weight: 900; padding: 2px 7px; border-radius: 10px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .vm-status-badge.approved { background: rgba(34,197,94,0.9); color: #fff; }
  .vm-status-badge.pending  { background: rgba(245,158,11,0.9); color: #fff; }

  .vm-btn-sm {
    padding: 6px 12px; border-radius: 8px; font-size: 0.68rem; font-weight: 800;
    border: none; cursor: pointer; transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 4px; text-decoration: none;
  }
  .vm-btn-gold { background: #D4AF37; color: #1a1000; }
  .vm-btn-gold:hover { background: #f0c842; }
  .vm-btn-danger { background: rgba(239,68,68,0.85); color: #fff; }
  .vm-btn-danger:hover { background: #dc2626; }
`;

export default function VendorMediaPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('gallery');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSections(); loadGallery(); loadVendorSlug(); }, []);

  async function loadVendorSlug() {
    try {
      const res = await fetch('/api/vendor/story');
      const d = await res.json();
      if (d?.business) setSlug(d.business.slug || d.business.id || '');
    } catch (_) {}
  }

  async function loadSections() {
    try {
      const res = await fetch('/api/vendor/sections');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setSections(arr);
      if (arr.length > 0) setSelectedSection(arr[0].id);
    } catch (err) { console.error(err); }
  }

  async function loadGallery() {
    try {
      const res = await fetch('/api/vendor/gallery');
      const data = await res.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!selectedSection) { showMessage('error', 'Please select a content section first'); return; }
    setLoading(true);
    setUploadProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sectionId', selectedSection);
        formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));
        
        await fetch('/api/vendor/gallery/upload', {
          method: 'POST',
          body: formData,
        });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      showMessage('success', `✓ ${files.length} photo${files.length > 1 ? 's' : ''} uploaded successfully to section!`);
      setUploadProgress(0);
      await loadGallery();
      setActiveTab('gallery');
    } catch {
      showMessage('error', 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function setAsHero(id: string) {
    try {
      const res = await fetch(`/api/vendor/gallery/${id}/hero`, { method: 'PATCH' });
      if (res.ok) { showMessage('success', '⭐ Set as main cover image'); await loadGallery(); }
    } catch { showMessage('error', 'Failed to update cover'); }
  }

  async function deleteImage(id: string) {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetch(`/api/vendor/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) { showMessage('success', '✓ Image deleted'); await loadGallery(); }
    } catch { showMessage('error', 'Failed to delete'); }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  const filteredGallery = filterSection === 'all'
    ? gallery
    : gallery.filter(img => img.section_id === filterSection);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MEDIA_CSS }} />
      <div className="vm-root">

        {/* Top bar */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
              📸 Section Media & Photo Gallery
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
              Upload and link photos to specific content sections of your minisite
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {slug && (
              <Link href={`/${slug}`} target="_blank" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', background: '#fdf8ee', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #fde68a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} /> Preview Minisite
              </Link>
            )}
            <button
              onClick={() => setActiveTab('upload')}
              style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c842)', color: '#1a1000', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(212,175,55,0.3)' }}
            >
              <i className="fas fa-plus" /> Upload to Section
            </button>
          </div>
        </div>

        {/* Info Tip Card */}
        <div style={{ background: '#fdf8ee', border: '1px solid #fde68a', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.25rem', color: '#D4AF37', flexShrink: 0, marginTop: '2px' }}>💡</div>
          <div style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.5, fontWeight: 500 }}>
            <strong>How photo mapping works:</strong> Each photo is assigned to a specific content section (e.g., <em>Rooms & Suites</em>, <em>Menu & Dining</em>, or <em>Desert Safari</em>). Photos assigned to a section automatically appear in that section's gallery tab on your live minisite! You can also manage section photos directly inside <Link href="/vendor/sections" style={{ color: '#D4AF37', fontWeight: 800, textDecoration: 'none' }}>Content & Profile →</Link>
          </div>
        </div>

        {/* Toast Message */}
        {message && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1.25rem', borderRadius: '14px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', background: message.type === 'success' ? '#f0fdf4' : '#fef2f2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
            {message.text}
          </div>
        )}

        {/* Tab & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('gallery')}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, border: 'none', cursor: 'pointer', background: activeTab === 'gallery' ? '#0f172a' : '#f1f5f9', color: activeTab === 'gallery' ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
            >
              <i className="fas fa-images" /> Photo Gallery ({gallery.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, border: 'none', cursor: 'pointer', background: activeTab === 'upload' ? '#0f172a' : '#f1f5f9', color: activeTab === 'upload' ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
            >
              <i className="fas fa-cloud-upload-alt" /> Upload New
            </button>
          </div>

          {activeTab === 'gallery' && sections.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Filter by Section:</span>
              <select
                value={filterSection}
                onChange={e => setFilterSection(e.target.value)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', background: '#fff' }}
              >
                <option value="all">All Sections ({gallery.length})</option>
                {sections.map(s => {
                  const count = gallery.filter(g => g.section_id === s.id).length;
                  return (
                    <option key={s.id} value={s.id}>{s.name} ({count})</option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: UPLOAD */}
        {activeTab === 'upload' && (
          <div className="vm-card" style={{ maxWidth: 720 }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                1. Select Content Section to Attach Photos To
              </label>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, marginBottom: '0.6rem' }}>
                Photos uploaded here will be displayed inside this specific section's tab on your public minisite.
              </p>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #D4AF37', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', background: '#fffdf5' }}
              >
                {sections.map(s => (
                  <option key={s.id} value={s.id}>📍 {s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>
              2. Select or Drag & Drop Photo Files
            </div>

            <input
              type="file"
              ref={fileRef}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFileUpload(e.target.files)}
            />

            <div
              className={`vm-dropzone${dragOver ? ' active' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
            >
              <div className="vm-drop-icon">
                <i className="fas fa-images" />
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
                Click or drag & drop photos here
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                Supports JPG, PNG, WEBP up to 10MB each
              </div>
            </div>

            {loading && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', marginBottom: '4px' }}>
                  <span>Uploading photos to section...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#D4AF37', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GALLERY */}
        {activeTab === 'gallery' && (
          <div>
            {filteredGallery.length === 0 ? (
              <div className="vm-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fdf8ee', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: '1.5rem', marginBottom: '1rem' }}>
                  <i className="fas fa-camera" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>No photos found in this view</h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, maxWidth: 360, margin: '0 auto 1.25rem' }}>
                  Upload high-quality images of your rooms, food, products, or safari tours to bring your minisite to life.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Upload Photos Now →
                </button>
              </div>
            ) : (
              <div className="vm-grid">
                {filteredGallery.map(img => (
                  <div key={img.id} className="vm-img-card">
                    {img.isHero && <span className="vm-hero-badge">⭐ Main Cover</span>}
                    <span className={`vm-status-badge ${img.approval_status === 'approved' ? 'approved' : 'pending'}`}>
                      {img.approval_status === 'approved' ? 'Active' : 'Pending'}
                    </span>
                    <img src={img.url} alt={img.caption} />
                    {img.section_name && (
                      <span className="vm-section-tag">📍 {img.section_name}</span>
                    )}
                    <div className="vm-img-overlay">
                      <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {img.caption || 'Image'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {!img.isHero && (
                          <button className="vm-btn-sm vm-btn-gold" onClick={() => setAsHero(img.id)} title="Set as main cover">
                            ⭐ Cover
                          </button>
                        )}
                        <button className="vm-btn-sm vm-btn-danger" onClick={() => deleteImage(img.id)} title="Delete photo">
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
