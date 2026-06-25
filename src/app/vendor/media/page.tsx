'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
  isHero?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

interface Section {
  id: string;
  name: string;
}

const S = {
  wrap: { minHeight: '100vh', background: '#f8fafc', padding: '2rem' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '2rem', fontWeight: 900, color: '#1a1a2e', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b' },
  tabsContainer: { display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', marginBottom: '2rem', overflowX: 'auto' as const },
  tab: (active: boolean) => ({
    padding: '1rem 1.5rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '3px solid #D4AF37' : 'none',
    cursor: 'pointer',
    fontWeight: active ? 'bold' : '500',
    color: active ? '#D4AF37' : '#64748b',
    fontSize: '1rem'
  }),
  uploadZone: { background: '#fff', border: '2px dashed #D4AF37', borderRadius: '16px', padding: '3rem', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.3s' },
  uploadZoneHover: { background: '#D4AF3710' },
  uploadIcon: { fontSize: '3rem', marginBottom: '1rem' },
  buttonGroup: { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' as const },
  button: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' },
  buttonPrimary: { background: '#556B2F', color: '#D4AF37' },
  buttonSecondary: { background: '#e2e8f0', color: '#1a1a2e' },
  gallery: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
  galleryItem: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  galleryImage: { height: '200px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  galleryInfo: { padding: '1rem' },
  caption: { fontSize: '0.9rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '0.5rem' },
  date: { fontSize: '0.75rem', color: '#94a3b8' },
  actions: { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  actionButton: { flex: 1, padding: '0.5rem', fontSize: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  heroButton: { background: '#10b981', color: '#fff' },
  deleteButton: { background: '#ef4444', color: '#fff' },
  message: { padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold' }
};

export default function VendorMediaPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'manage'>('upload');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadSections();
    loadGallery();
  }, []);

  async function loadSections() {
    try {
      const res = await fetch('/api/vendor/sections');
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
      if (data.length > 0) setSelectedSection(data[0].id);
    } catch (err) {
      console.error('Load sections error:', err);
    }
  }

  async function loadGallery() {
    try {
      const res = await fetch('/api/vendor/gallery');
      const data = await res.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load gallery error:', err);
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!selectedSection) {
      showMessage('error', 'Please select a section first');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sectionId', selectedSection);
        formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = ((i + e.loaded / e.total) / files.length) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              resolve(xhr.responseText);
            } else {
              reject(new Error('Upload failed'));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.open('POST', '/api/vendor/gallery/upload');
          xhr.send(formData);
        });
      }

      showMessage('success', `✓ Uploaded ${files.length} image(s)`);
      setUploadProgress(0);
      await loadGallery();
    } catch (err) {
      showMessage('error', 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function setAsHero(itemId: string) {
    try {
      const res = await fetch(`/api/vendor/gallery/${itemId}/hero`, { method: 'PATCH' });
      if (res.ok) {
        showMessage('success', '✓ Set as hero image');
        await loadGallery();
      }
    } catch (err) {
      showMessage('error', 'Failed to update image');
    }
  }

  async function deleteImage(itemId: string) {
    if (!confirm('Delete this image?')) return;
    
    try {
      const res = await fetch(`/api/vendor/gallery/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        showMessage('success', '✓ Image deleted');
        await loadGallery();
      }
    } catch (err) {
      showMessage('error', 'Failed to delete image');
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div style={S.wrap}>
      <div style={S.container}>
        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>📸 Media Gallery Manager</h1>
          <p style={S.subtitle}>Upload photos directly from your camera to section galleries</p>
        </div>

        {/* Messages */}
        {message && (
          <div style={{...S.message, background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b'}}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={S.tabsContainer}>
          <button style={S.tab(activeTab === 'upload')} onClick={() => setActiveTab('upload')}>
            📤 Upload
          </button>
          <button style={S.tab(activeTab === 'gallery')} onClick={() => setActiveTab('gallery')}>
            🖼️ Gallery
          </button>
          <button style={S.tab(activeTab === 'manage')} onClick={() => setActiveTab('manage')}>
            ⚙️ Manage
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            {/* Section Selector */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1a1a2e' }}>
                Select Section to Upload To
              </label>
              <select 
                value={selectedSection} 
                onChange={e => setSelectedSection(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
              >
                <option value="">Choose a section...</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Upload Zone */}
            <div 
              style={{...S.uploadZone, ...(dragOver ? S.uploadZoneHover : {})}}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <div style={S.uploadIcon}>📸</div>
              <h3 style={{ marginBottom: '0.5rem', color: '#1a1a2e' }}>
                Drag & Drop Photos Here
              </h3>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                or click buttons below to select
              </p>

              <div style={S.buttonGroup}>
                <label style={{...S.button, ...S.buttonPrimary, display: 'inline-block'}}>
                  📱 Camera (Mobile)
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    capture="environment"
                    multiple
                    onChange={e => handleFileUpload(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </label>
                
                <label style={{...S.button, ...S.buttonSecondary, display: 'inline-block'}}>
                  📁 File Gallery
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    multiple
                    onChange={e => handleFileUpload(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        background: '#D4AF37', 
                        height: '100%', 
                        width: `${uploadProgress}%`,
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#64748b' }}>{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem', color: '#166534' }}>
              <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '0.5rem' }}>✓ Direct Camera Upload</p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                <li>Works on mobile and desktop</li>
                <li>Supports JPG, PNG, GIF, WebP, MP4</li>
                <li>Max 10MB per file</li>
                <li>Unlimited uploads per section</li>
              </ul>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div>
            {gallery.length > 0 ? (
              <>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  {gallery.length} image{gallery.length !== 1 ? 's' : ''} uploaded
                </p>
                <div style={S.gallery}>
                  {gallery.map(item => (
                    <div key={item.id} style={S.galleryItem}>
                      <div style={S.galleryImage}>
                        <img 
                          src={item.url} 
                          alt={item.caption}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Approval Badge */}
                        {item.approval_status && (
                          <div style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: '#fff',
                            background: item.approval_status === 'approved' ? '#10b981' :
                                       item.approval_status === 'rejected' ? '#ef4444' : '#fbbf24'
                          }}>
                            {item.approval_status === 'approved' ? '✓ Approved' :
                             item.approval_status === 'rejected' ? '✗ Rejected' :
                             '⏳ Pending'}
                          </div>
                        )}
                      </div>
                      <div style={S.galleryInfo}>
                        <div style={S.caption}>{item.caption}</div>
                        <div style={S.date}>{new Date(item.uploadedAt).toLocaleDateString()}</div>
                        <div style={S.actions}>
                          <button 
                            style={{...S.actionButton, ...S.heroButton}}
                            onClick={() => setAsHero(item.id)}
                            disabled={item.isHero || item.approval_status === 'rejected'}
                            title={item.approval_status === 'rejected' ? 'Cannot set rejected image as hero' : ''}
                          >
                            {item.isHero ? '⭐ Hero' : 'Set as Hero'}
                          </button>
                          <button 
                            style={{...S.actionButton, ...S.deleteButton}}
                            onClick={() => deleteImage(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px' }}>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No images uploaded yet</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  style={{...S.button, ...S.buttonPrimary, marginTop: '1rem'}}
                >
                  Upload Your First Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1a1a2e' }}>
                Gallery Settings
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1a1a2e' }}>🎯 Auto-Feature Best Photo</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                    <span>Automatically set highest-quality image as hero</span>
                  </label>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>Hero images appear prominently in minisite carousels</p>
                </div>

                <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1a1a2e' }}>📧 Email on Upload</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }} />
                    <span>Send me email when all images are processed</span>
                  </label>
                </div>

                <div>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1a1a2e' }}>🗑️ Bulk Actions</h3>
                  <button style={{...S.button, background: '#ef4444', color: '#fff', marginRight: '0.5rem'}}>
                    Delete All
                  </button>
                  <button style={{...S.button, background: '#3b82f6', color: '#fff'}}>
                    Download Folder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
