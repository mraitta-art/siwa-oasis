'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  description: string;
  layout: any[];
  features: any;
}

export default function TemplateArchitect() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/jana/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.map((t: any) => ({
          ...t,
          layout: typeof t.layout === 'string' ? JSON.parse(t.layout) : t.layout || [],
          features: typeof t.features === 'string' ? JSON.parse(t.features) : t.features || {}
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type: string, text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }

  async function handleSave() {
    if (!editingTemplate?.id || !editingTemplate?.name) {
      showMessage('error', 'ID and Name are required');
      return;
    }

    try {
      const res = await fetch('/api/jana/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      });

      if (res.ok) {
        showMessage('success', 'Template saved to library');
        fetchTemplates();
        setEditingTemplate(null);
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Failed to save');
      }
    } catch (e) {
      showMessage('error', 'Error saving template');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure? This will remove this master blueprint.')) return;
    try {
      const res = await fetch(`/api/jana/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showMessage('success', 'Template deleted');
        fetchTemplates();
      }
    } catch (e) {
      showMessage('error', 'Delete failed');
    }
  }

  function addComponent(type: string) {
    if (!editingTemplate) return;
    const newComponent = {
      id: `comp_${Date.now()}`,
      type,
      props: type === 'hero_carousel' ? { carouselName: 'main_hero' } : {}
    };
    setEditingTemplate({
      ...editingTemplate,
      layout: [...(editingTemplate.layout || []), newComponent]
    });
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
              TEMPLATE ARCHITECT
            </h1>
            <p style={{ color: '#64748b' }}>Define the visual DNA and feature sets for your minisite marketplace.</p>
          </div>
          {!editingTemplate && (
            <button 
              onClick={() => setEditingTemplate({ id: '', name: '', description: '', layout: [], features: {} })}
              className="btn btn-primary"
              style={{ background: '#D4AF37', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 800, color: '#fff', cursor: 'pointer' }}
            >
              + CREATE MASTER BLUEPRINT
            </button>
          )}
        </div>

        {message.text && (
          <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '2rem', background: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#991b1b' : '#166534', border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
            {message.text}
          </div>
        )}

        {editingTemplate ? (
          <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontWeight: 900, marginBottom: '2rem' }}>{editingTemplate.id ? 'Edit Blueprint' : 'New Blueprint'}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>TEMPLATE ID (No spaces)</label>
                <input 
                  value={editingTemplate.id || ''} 
                  onChange={e => setEditingTemplate({...editingTemplate, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  placeholder="e.g. hotel_premium"
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>PUBLIC NAME</label>
                <input 
                  value={editingTemplate.name || ''} 
                  onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                  placeholder="e.g. Eco-Resort Premium Template"
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem' }}>
              
              {/* Layout Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 900, fontSize: '1.2rem' }}>Component Layout</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => addComponent('hero_carousel')} style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>+ CAROUSEL</button>
                    <button onClick={() => addComponent('blog')} style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>+ BLOG FEED</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {editingTemplate.layout?.map((c, i) => (
                    <div key={c.id} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', background: '#D4AF37', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>{i + 1}</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.type.toUpperCase()}</div>
                          {c.type === 'hero_carousel' && (
                            <input 
                              placeholder="Carousel Name (e.g. home_hero)" 
                              value={c.props?.carouselName || ''}
                              onChange={e => {
                                const newLayout = [...(editingTemplate.layout || [])];
                                newLayout[i].props.carouselName = e.target.value;
                                setEditingTemplate({...editingTemplate, layout: newLayout});
                              }}
                              style={{ fontSize: '0.7rem', border: 'none', background: 'transparent', color: '#D4AF37', fontWeight: 700, outline: 'none' }}
                            />
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newLayout = editingTemplate.layout?.filter((_, idx) => idx !== i);
                          setEditingTemplate({...editingTemplate, layout: newLayout});
                        }}
                        style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800 }}
                      >REMOVE</button>
                    </div>
                  ))}
                  {editingTemplate.layout?.length === 0 && (
                    <div style={{ padding: '3rem', border: '2px dashed #e2e8f0', borderRadius: '16px', textAlign: 'center', color: '#94a3b8' }}>
                      Add components to define the visual flow.
                    </div>
                  )}
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '1.5rem' }}>Feature DNA</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { id: 'captions', name: 'Enable Image Captions' },
                    { id: 'booking', name: 'Enable Global Booking Button' },
                    { id: 'verification', name: 'Show Heritage Verified Badge' },
                    { id: 'youtube_bg', name: 'Automated YouTube Backgrounds' }
                  ].map(f => (
                    <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={!!editingTemplate.features?.[f.id]} 
                        onChange={e => setEditingTemplate({
                          ...editingTemplate, 
                          features: { ...editingTemplate.features, [f.id]: e.target.checked }
                        })}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ marginTop: '4rem', display: 'flex', gap: '1rem' }}>
              <button onClick={handleSave} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '1rem 3rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>SAVE BLUEPRINT</button>
              <button onClick={() => setEditingTemplate(null)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '1rem 3rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {templates.map(t => (
              <div key={t.id} style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                   <div style={{ background: '#D4AF37', color: '#fff', padding: '4px 12px', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 800 }}>MASTER BLUEPRINT</div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setEditingTemplate(t)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800 }}>EDIT</button>
                      <button onClick={() => handleDelete(t.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800 }}>DEL</button>
                   </div>
                </div>
                <h3 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>ID: {t.id}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {t.layout.map((c: any, i: number) => (
                    <span key={i} style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>{c.type.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            ))}
            {templates.length === 0 && !loading && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10rem', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                <h3>No Master Blueprints Found</h3>
                <p>Start by creating your first template to define your ecosystem's DNA.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
