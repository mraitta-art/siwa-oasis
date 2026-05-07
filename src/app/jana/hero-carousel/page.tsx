'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  mediaUrl: string;
  type: 'image' | 'youtube';
  ctaText?: string;
  ctaLink?: string;
  displayOrder: number;
}

export default function HeroCarouselManager() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState('main');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState<Partial<CarouselSlide>>({
    title: '',
    subtitle: '',
    mediaUrl: '',
    type: 'image',
    ctaText: '',
    ctaLink: '',
    displayOrder: 0
  });

  // Fetch slides on mount
  useEffect(() => {
    // Restore siteId from session storage if available
    const savedSiteId = sessionStorage.getItem('siwa_carousel_siteId');
    if (savedSiteId && savedSiteId !== siteId) {
      setSiteId(savedSiteId);
    } else {
      fetchSlides();
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('siwa_carousel_siteId', siteId);
    fetchSlides();
  }, [siteId]);

  async function fetchSlides() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/hero-carousel?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        // The API returns { slides: [...] }
        const fetchedSlides = data.slides || [];
        setSlides(fetchedSlides.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0)));
      }
    } catch (err) {
      console.error('Failed to fetch slides:', err);
      showMessage('error', 'Failed to load slides');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type: string, text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }

  function resetForm() {
    // Calculate next display order correctly
    const nextOrder = slides.length > 0 
      ? Math.max(...slides.map(s => s.displayOrder || 0)) + 1 
      : 0;

    setFormData({
      title: '',
      subtitle: '',
      mediaUrl: '',
      type: 'image',
      ctaText: '',
      ctaLink: '',
      displayOrder: nextOrder
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(slide: CarouselSlide) {
    setFormData(slide);
    setEditingId(slide.id);
    setShowForm(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const uploadResults: {url: string, name: string}[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          showMessage('error', `File ${file.name} too large (max 10MB)`);
          continue;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const res = await fetch('/api/jana/media/upload', {
          method: 'POST',
          body: uploadFormData
        });

        if (res.ok) {
          const data = await res.json();
          uploadResults.push({ url: data.url, name: file.name });
        }
      }

      if (uploadResults.length > 0) {
        // If only one file, update current form
        if (uploadResults.length === 1) {
          setFormData(prev => ({ ...prev, mediaUrl: uploadResults[0].url, type: 'image' }));
          showMessage('success', 'Image uploaded!');
        } else {
          // If multiple, auto-create slides for others and update local list
          const newSlides: CarouselSlide[] = [];
          let currentMaxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.displayOrder || 0)) : -1;
          
          uploadResults.forEach((result, idx) => {
            newSlides.push({
              id: `slide_${Date.now()}_${idx}`,
              title: result.name.split('.')[0].replace(/[-_]/g, ' '),
              mediaUrl: result.url,
              type: 'image',
              displayOrder: currentMaxOrder + idx + 1
            });
          });

          const finalSlides = [...slides, ...newSlides];
          
          // Save the batch immediately to the database
          const res = await fetch('/api/jana/hero-carousel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slides: finalSlides, siteId })
          });

          if (res.ok) {
            setSlides(finalSlides);
            showMessage('success', `Uploaded and saved ${uploadResults.length} slides!`);
          }
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      showMessage('error', 'Failed to upload images');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!formData.title?.trim() || !formData.mediaUrl?.trim()) {
      showMessage('error', 'Title and Media URL are required');
      return;
    }

    setSaving(true);
    try {
      let updatedSlides;
      if (editingId) {
        updatedSlides = slides.map(s => s.id === editingId ? { ...s, ...formData } as CarouselSlide : s);
      } else {
        const nextOrder = slides.length > 0 
          ? Math.max(...slides.map(s => s.displayOrder || 0)) + 1 
          : 0;

        const newSlide = {
          ...formData,
          id: `slide_${Date.now()}`,
          displayOrder: nextOrder
        } as CarouselSlide;
        updatedSlides = [...slides, newSlide];
      }

      const res = await fetch('/api/jana/hero-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: updatedSlides, siteId })
      });

      if (res.ok) {
        showMessage('success', editingId ? 'Slide updated!' : 'Slide created!');
        setSlides(updatedSlides);
        resetForm();
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      showMessage('error', 'Error saving carousel');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    const updatedSlides = slides.filter(s => s.id !== id);
    
    try {
      const res = await fetch('/api/jana/hero-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: updatedSlides, siteId })
      });

      if (res.ok) {
        showMessage('success', 'Slide deleted');
        setSlides(updatedSlides);
      } else {
        showMessage('error', 'Failed to delete');
      }
    } catch (err) {
      showMessage('error', 'Error deleting slide');
    }
  }

  async function moveSlide(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slides.length - 1) return;

    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];

    // Update displayOrder
    const finalSlides = newSlides.map((s, i) => ({ ...s, displayOrder: i }));

    try {
      const res = await fetch('/api/jana/hero-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: finalSlides, siteId })
      });

      if (res.ok) {
        setSlides(finalSlides);
      }
    } catch (err) {
      showMessage('error', 'Failed to reorder');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <Link href="/jana" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 800 }}>
              ← ADMIN DASHBOARD
            </Link>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', margin: '0.5rem 0 0 0', letterSpacing: '-1px' }}>
              HERO CAROUSEL
            </h1>
            <p style={{ color: '#64748b' }}>Manage cinematic slides for your marketplace and minisites</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>CAROUSEL ID / NAME:</label>
              <input 
                type="text"
                value={siteId} 
                onChange={(e) => setSiteId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="e.g. home_hero"
                style={{ border: 'none', fontWeight: 700, color: '#D4AF37', outline: 'none', background: 'transparent', width: '150px' }}
              />
              <select 
                onChange={(e) => setSiteId(e.target.value)}
                style={{ border: 'none', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">-- PRESETS --</option>
                <option value="main_hero">Main Hero</option>
                <option value="main_gallery">Main Gallery</option>
                <option value="hotels_hero">Hotels Hero</option>
                <option value="partner_logos">Partner Logos</option>
              </select>
            </div>

            {!showForm && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                style={{
                  background: '#D4AF37', color: '#fff', border: 'none', padding: '1rem 2rem',
                  borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(212,175,55,0.3)'
                }}
              >
                + ADD NEW SLIDE
              </button>
            )}
          </div>
        </div>

        {/* Message Overlay */}
        {message.text && (
          <div style={{
            background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: message.type === 'error' ? '#991b1b' : '#166534',
            padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem',
            borderLeft: `4px solid ${message.type === 'error' ? '#dc2626' : '#16a34a'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Editor Form */}
        {showForm && (
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '3rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem' }}>{editingId ? 'Edit Slide' : 'Create New Slide'}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>TITLE</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                  placeholder="e.g. Discover Siwa Oasis"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>SUBTITLE</label>
                <input
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                  placeholder="Short descriptive text"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>TYPE</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                >
                  <option value="image">Image</option>
                  <option value="youtube">YouTube Video</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>MEDIA URL / YOUTUBE URL</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <input
                    name="mediaUrl"
                    value={formData.mediaUrl}
                    onChange={handleInputChange}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                    placeholder="https://..."
                  />
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <button style={{ 
                      background: '#D4AF37', color: '#fff', border: 'none', padding: '0.75rem 1rem', 
                      borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                    }}>
                      {saving ? '...' : 'UPLOAD'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleFileUpload} 
                      style={{ 
                        position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' 
                      }} 
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Provide a URL or upload files. <strong>TIP: You can select multiple images to add them all at once!</strong>
                </p>
                
                {/* PREVIEW AREA */}
                {formData.mediaUrl && (
                  <div style={{ marginTop: '1.5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', height: '150px' }}>
                    {formData.type === 'image' ? (
                      <img 
                        src={formData.mediaUrl} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x150?text=Invalid+Image+URL'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
                        <i className="fab fa-youtube fa-3x"></i>
                        <span style={{ marginLeft: '1rem' }}>YouTube Preview (URL Set)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>BUTTON TEXT</label>
                <input
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                  placeholder="e.g. Explore Now"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>BUTTON LINK</label>
                <input
                  name="ctaLink"
                  value={formData.ctaLink}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                  placeholder="/search or external url"
                />
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: '#10b981', color: '#fff', border: 'none', padding: '1rem 2.5rem',
                  borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'SAVING...' : 'SAVE SLIDE'}
              </button>
              <button
                onClick={resetForm}
                style={{
                  background: '#64748b', color: '#fff', border: 'none', padding: '1rem 2.5rem',
                  borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* List View */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem' }}>Loading slides...</div>
          ) : slides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '1rem', border: '2px dashed #e2e8f0' }}>
              No slides configured. Add your first slide to populate the homepage.
            </div>
          ) : (
            slides.map((slide, index) => (
              <div key={slide.id} style={{
                background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem',
                display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: '2rem', alignItems: 'center'
              }}>
                <div style={{ height: '120px', borderRadius: '0.5rem', overflow: 'hidden', background: '#f1f5f9' }}>
                  {slide.type === 'image' ? (
                    <img src={slide.mediaUrl} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
                      <i className="fab fa-youtube fa-2x"></i>
                    </div>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>{slide.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{slide.subtitle || 'No subtitle'}</p>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', background: '#fef3c7', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                      {(slide.type || 'IMAGE').toUpperCase()}
                    </span>
                    {slide.ctaText && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CTA: {slide.ctaText}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button onClick={() => moveSlide(index, 'up')} disabled={index === 0} style={{ padding: '0.5rem', cursor: 'pointer' }}>↑</button>
                    <button onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} style={{ padding: '0.5rem', cursor: 'pointer' }}>↓</button>
                  </div>
                  <button onClick={() => startEdit(slide)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', cursor: 'pointer' }}>EDIT</button>
                  <button onClick={() => handleDelete(slide.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', cursor: 'pointer' }}>DEL</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
