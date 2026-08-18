'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  image_url: string;
  search_link: string;
  display_order: number;
  is_visible: boolean;
}

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Load services
  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/jana/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to load services' });
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      setMessage({ type: 'error', text: 'Failed to load services. Check your connection.' });
    }
    setLoading(false);
  };

  const handleSave = async (service: Service) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/jana/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Service saved successfully.' });
        await fetchServices();
        setEditing(null);
        setShowForm(false);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save service.' });
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      setMessage({ type: 'error', text: 'Failed to save service. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const res = await fetch('/api/jana/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_visible: !currentVisibility }),
      });

      if (!res.ok) {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to toggle visibility.' });
      } else {
        setMessage({ type: 'success', text: 'Visibility updated successfully.' });
      }
      fetchServices();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      setMessage({ type: 'error', text: 'Failed to toggle visibility.' });
    }
  };

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      const res = await fetch('/api/jana/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, display_order: newOrder }),
      });

      if (!res.ok) {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to reorder service.' });
      } else {
        setMessage({ type: 'success', text: 'Service order updated.' });
      }
      fetchServices();
    } catch (error) {
      console.error('Failed to reorder:', error);
      setMessage({ type: 'error', text: 'Failed to reorder service.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      const res = await fetch(`/api/jana/services?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete service.' });
      } else {
        setMessage({ type: 'success', text: 'Service deleted successfully.' });
        fetchServices();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      setMessage({ type: 'error', text: 'Failed to delete service.' });
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#fff' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', maxWidth: '1400px', margin: '0 auto 2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#D4AF37' }}>Services Manager</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0' }}>Manage homepage service pillars</p>
        </div>
      </div>
      {message && (
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto 1rem',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
            color: message.type === 'success' ? '#10b981' : '#f87171',
            border: message.type === 'success' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
          }}
        >
          {message.text}
        </div>
      )}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => { setEditing(null); setShowForm(!showForm); }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#D4AF37',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancel' : '+ Add Service'}
          </button>
          <Link href="/jana/website" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Back to Website Builder
          </Link>
        </div>

      {/* New/Edit Form */}
      {showForm && (
        <ServiceForm
          service={editing || { id: '', name: '', tagline: '', icon: '', color: '#D4AF37', image_url: '', search_link: '', display_order: services.length + 1, is_visible: true }}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Services List */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {services.map((service) => (
            <div key={service.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', position: 'relative' }}>
              {/* Visibility Badge */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem 0.75rem', background: service.is_visible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', borderRadius: '20px', fontSize: '0.75rem', color: service.is_visible ? '#10b981' : '#ef4444' }}>
                {service.is_visible ? '✓ Visible' : '✗ Hidden'}
              </div>

              {/* Image Preview */}
              <img src={service.image_url} alt={service.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />

              {/* Content */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <i className={`fas ${service.icon}`} style={{ color: service.color, fontSize: '1.2rem' }} />
                  <h3 style={{ margin: 0, color: '#fff' }}>{service.name}</h3>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>{service.tagline}</p>
              </div>

              {/* Order */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Display Order</label>
                <input
                  type="number"
                  value={service.display_order}
                  onChange={(e) => handleReorder(service.id, parseInt(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={() => { setEditing(service); setShowForm(true); }}
                  style={{ padding: '0.5rem', background: 'rgba(100,200,255,0.2)', color: '#64c8ff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggleVisibility(service.id, service.is_visible)}
                  style={{ padding: '0.5rem', background: service.is_visible ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: service.is_visible ? '#ef4444' : '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {service.is_visible ? '👁️ Hide' : '👁️ Show'}
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Service Form Component
// ─────────────────────────────────────────────────────────────────────
interface ServiceFormProps {
  service: Service;
  onSave: (service: Service) => void;
  onCancel: () => void;
}

function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [form, setForm] = useState(service);

  useEffect(() => {
    setForm(service);
  }, [service]);

  const handleChange = (field: keyof Service, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChange('image_url', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const canSave = Boolean(form.id && form.name && form.icon);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem' }}>
      <h2 style={{ marginTop: 0, color: '#D4AF37' }}>{form.id ? 'Edit Service' : 'New Service'}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ID */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Service ID (unique slug)</label>
          <input
            type="text"
            value={form.id}
            onChange={(e) => handleChange('id', e.target.value)}
            disabled={!!service.id}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Name */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Service Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Icon */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Font Awesome Icon (e.g., fa-bed)</label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => handleChange('icon', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Color */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Icon Color (hex)</label>
          <input
            type="text"
            value={form.color}
            onChange={(e) => handleChange('color', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Full width: Tagline */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Tagline (short description)</label>
          <textarea
            value={form.tagline}
            onChange={(e) => handleChange('tagline', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', minHeight: '80px' }}
          />
        </div>

        {/* Image URL / Upload */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Image URL or upload</label>
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="Paste an image URL or use the upload field"
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageFileChange}
            style={{ width: '100%', marginTop: '0.75rem', color: '#fff' }}
          />
          {form.image_url && (
            <img
              src={form.image_url}
              alt="preview"
              style={{ marginTop: '1rem', maxWidth: '200px', borderRadius: '4px', objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Search Link */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Search Link (destination URL)</label>
          <input
            type="text"
            value={form.search_link}
            onChange={(e) => handleChange('search_link', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
        <button
          onClick={() => onSave(form)}
          disabled={!canSave}
          style={{
            padding: '0.75rem 1.5rem',
            background: canSave ? '#D4AF37' : 'rgba(212,175,55,0.4)',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: canSave ? 'pointer' : 'not-allowed',
            opacity: canSave ? 1 : 0.7,
          }}
        >
          💾 Save Service
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
