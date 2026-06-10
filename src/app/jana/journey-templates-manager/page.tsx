'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  subtitle: string;
  duration_days: number;
  themes: string[];
  services: string[];
  featured_image_url: string;
  icon: string;
  color: string;
  highlights: string[];
  itinerary_details: any[];
  featured_businesses: string[];
  estimated_cost_usd_min: number;
  estimated_cost_usd_max: number;
  difficulty_level: 'easy' | 'moderate' | 'challenging';
  best_season: string;
  max_group_size: number;
  admin_notes: string;
  display_order: number;
  is_featured: boolean;
  is_visible: boolean;
  is_investment_journey: boolean;
  investment_types: string[];
  investment_description: string;
  minimum_investment_usd: number;
  estimated_roi_percent: number;
  investment_partner_name: string;
  investment_partner_contact: string;
  featured_properties: any[];
  success_stories: any[];
  requirements_text: string;
}

export default function JourneyTemplatesManager() {
  const [templates, setTemplates] = useState<JourneyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<JourneyTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/jana/journey-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
    setLoading(false);
  };

  const handleSave = async (template: JourneyTemplate) => {
    try {
      const res = await fetch('/api/jana/journey-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (res.ok) {
        fetchTemplates();
        setEditing(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      await fetch('/api/jana/journey-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_visible: !currentVisibility }),
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await fetch('/api/jana/journey-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_featured: !currentFeatured }),
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
    }
  };

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      await fetch('/api/jana/journey-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, display_order: newOrder }),
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journey template?')) return;
    try {
      await fetch(`/api/jana/journey-templates?id=${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#fff' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', maxWidth: '1400px', margin: '0 auto 2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#D4AF37' }}>Journey Templates Manager</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0' }}>Create curated multi-day journey experiences</p>
        </div>
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
            {showForm ? 'Cancel' : '+ Add Journey'}
          </button>
          <Link href="/jana/homepage-editor" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Back
          </Link>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <JourneyForm
          template={editing || {
            id: '',
            name: '',
            description: '',
            subtitle: '',
            duration_days: 3,
            themes: [],
            services: [],
            featured_image_url: '',
            icon: 'fa-map',
            color: '#D4AF37',
            highlights: [],
            itinerary_details: [],
            featured_businesses: [],
            estimated_cost_usd_min: 0,
            estimated_cost_usd_max: 0,
            difficulty_level: 'moderate',
            best_season: '',
            max_group_size: 10,
            admin_notes: '',
            display_order: templates.length + 1,
            is_featured: false,
            is_visible: true,
            is_investment_journey: false,
            investment_types: [],
            investment_description: '',
            minimum_investment_usd: 0,
            estimated_roi_percent: 0,
            investment_partner_name: '',
            investment_partner_contact: '',
            featured_properties: [],
            success_stories: [],
            requirements_text: '',
          }}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* List */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {templates.map((template) => (
            <div key={template.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Image */}
              <img src={template.featured_image_url} alt={template.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />

              {/* Content */}
              <div style={{ padding: '1.5rem' }}>
                {/* Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {template.is_featured && (
                    <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(212,175,55,0.2)', color: '#D4AF37', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      ⭐ Featured
                    </span>
                  )}
                  {template.is_investment_journey && (
                    <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      💼 Investment
                    </span>
                  )}
                  <span style={{ padding: '0.25rem 0.75rem', background: template.is_visible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: template.is_visible ? '#10b981' : '#ef4444', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {template.is_visible ? '✓ Visible' : '✗ Hidden'}
                  </span>
                  <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(100,200,255,0.2)', color: '#64c8ff', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {template.duration_days}D
                  </span>
                  <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(168,85,247,0.2)', color: '#a78bfa', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {template.difficulty_level}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
                  {template.name}
                </h3>

                {/* Subtitle */}
                <p style={{ margin: '0 0 0.75rem 0', color: '#D4AF37', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {template.subtitle}
                </p>

                {/* Description */}
                <p style={{ margin: '0 0 1rem 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {template.description}
                </p>

                {/* Highlights */}
                {template.highlights && template.highlights.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      HIGHLIGHTS
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {template.highlights.slice(0, 3).map((highlight) => (
                        <span key={highlight} style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                          {highlight}
                        </span>
                      ))}
                      {template.highlights.length > 3 && (
                        <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          +{template.highlights.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>Cost</div>
                    <div>${template.estimated_cost_usd_min} - ${template.estimated_cost_usd_max}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>Group Size</div>
                    <div>Up to {template.max_group_size} people</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>Best Season</div>
                    <div>{template.best_season}</div>
                  </div>
                </div>

                {/* Order */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Display Order</label>
                  <input
                    type="number"
                    value={template.display_order}
                    onChange={(e) => handleReorder(template.id, parseInt(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    onClick={() => { setEditing(template); setShowForm(true); }}
                    style={{ padding: '0.5rem', background: 'rgba(100,200,255,0.2)', color: '#64c8ff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(template.id, template.is_featured)}
                    style={{ padding: '0.5rem', background: template.is_featured ? 'rgba(212,175,55,0.2)' : 'rgba(100,116,139,0.2)', color: template.is_featured ? '#D4AF37' : '#64748b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    {template.is_featured ? '⭐ Unfeature' : '☆ Feature'}
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(template.id, template.is_visible)}
                    style={{ padding: '0.5rem', background: template.is_visible ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: template.is_visible ? '#ef4444' : '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    {template.is_visible ? '👁️ Hide' : '👁️ Show'}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', gridColumn: '3/4' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Journey Form Component
// ─────────────────────────────────────────────────────────────────────
interface JourneyFormProps {
  template: JourneyTemplate;
  onSave: (template: JourneyTemplate) => void;
  onCancel: () => void;
}

function JourneyForm({ template, onSave, onCancel }: JourneyFormProps) {
  const [form, setForm] = useState(template);
  const [highlightsText, setHighlightsText] = useState((form.highlights || []).join('\n'));

  const handleChange = (field: keyof JourneyTemplate, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = () => {
    // Convert highlights text back to array
    const highlightsArray = highlightsText.split('\n').filter(h => h.trim());
    onSave({ ...form, highlights: highlightsArray });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem' }}>
      <h2 style={{ marginTop: 0, color: '#D4AF37' }}>{form.id ? 'Edit Journey' : 'Create New Journey'}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ID */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Journey ID</label>
          <input
            type="text"
            value={form.id}
            onChange={(e) => handleChange('id', e.target.value)}
            disabled={!!template.id}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Name */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Journey Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Subtitle */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Subtitle</label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Description */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', minHeight: '100px' }}
          />
        </div>

        {/* Duration */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Duration (Days)</label>
          <input
            type="number"
            value={form.duration_days}
            onChange={(e) => handleChange('duration_days', parseInt(e.target.value))}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Difficulty Level</label>
          <select
            value={form.difficulty_level}
            onChange={(e) => handleChange('difficulty_level', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          >
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="challenging">Challenging</option>
          </select>
        </div>

        {/* Cost Range */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Min Cost (USD)</label>
          <input
            type="number"
            value={form.estimated_cost_usd_min}
            onChange={(e) => handleChange('estimated_cost_usd_min', parseInt(e.target.value))}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Max Cost (USD)</label>
          <input
            type="number"
            value={form.estimated_cost_usd_max}
            onChange={(e) => handleChange('estimated_cost_usd_max', parseInt(e.target.value))}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Best Season */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Best Season</label>
          <input
            type="text"
            placeholder="e.g., October to April"
            value={form.best_season}
            onChange={(e) => handleChange('best_season', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Max Group Size */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Max Group Size</label>
          <input
            type="number"
            value={form.max_group_size}
            onChange={(e) => handleChange('max_group_size', parseInt(e.target.value))}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Icon */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Icon (FontAwesome)</label>
          <input
            type="text"
            placeholder="e.g., fa-map"
            value={form.icon}
            onChange={(e) => handleChange('icon', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Color */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Color (Hex)</label>
          <input
            type="text"
            placeholder="#D4AF37"
            value={form.color}
            onChange={(e) => handleChange('color', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Featured Image URL */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Featured Image URL</label>
          <input
            type="text"
            value={form.featured_image_url}
            onChange={(e) => handleChange('featured_image_url', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
          {form.featured_image_url && <img src={form.featured_image_url} alt="preview" style={{ marginTop: '1rem', maxWidth: '200px', borderRadius: '4px' }} />}
        </div>

        {/* Highlights */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Highlights (one per line)</label>
          <textarea
            value={highlightsText}
            onChange={(e) => setHighlightsText(e.target.value)}
            placeholder="Highlight 1&#10;Highlight 2&#10;Highlight 3"
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', minHeight: '80px', fontFamily: 'monospace' }}
          />
        </div>

        {/* Admin Notes */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Admin Notes (internal)</label>
          <textarea
            value={form.admin_notes}
            onChange={(e) => handleChange('admin_notes', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', minHeight: '60px' }}
          />
        </div>
      </div>

      {/* Investment Section */}
      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid rgba(212,175,55,0.3)' }}>
        <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>💼 Investment Opportunity (Optional)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Is Investment Journey */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
              <input
                type="checkbox"
                checked={form.is_investment_journey}
                onChange={(e) => handleChange('is_investment_journey', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              Mark as Investment Journey
            </label>
          </div>

          {form.is_investment_journey && (
            <>
              {/* Investment Types */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Investment Types (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., real_estate, timeshare, wholesale"
                  value={(form.investment_types || []).join(', ')}
                  onChange={(e) => handleChange('investment_types', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                />
              </div>

              {/* Investment Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Investment Description</label>
                <textarea
                  value={form.investment_description}
                  onChange={(e) => handleChange('investment_description', e.target.value)}
                  placeholder="Describe the investment opportunity..."
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', minHeight: '80px' }}
                />
              </div>

              {/* Minimum Investment */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Minimum Investment (USD)</label>
                <input
                  type="number"
                  value={form.minimum_investment_usd}
                  onChange={(e) => handleChange('minimum_investment_usd', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                />
              </div>

              {/* Estimated ROI */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Estimated Annual ROI (%)</label>
                <input
                  type="number"
                  value={form.estimated_roi_percent}
                  onChange={(e) => handleChange('estimated_roi_percent', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                />
              </div>

              {/* Investment Partner Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Investment Partner / Broker Name</label>
                <input
                  type="text"
                  value={form.investment_partner_name}
                  onChange={(e) => handleChange('investment_partner_name', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                />
              </div>

              {/* Investment Partner Contact */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Contact Info (Email / Phone)</label>
                <input
                  type="text"
                  value={form.investment_partner_contact}
                  onChange={(e) => handleChange('investment_partner_contact', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                />
              </div>

              {/* Requirements */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Investor Requirements</label>
                <textarea
                  value={form.requirements_text}
                  onChange={(e) => handleChange('requirements_text', e.target.value)}
                  placeholder="e.g., Minimum net worth, citizenship requirements, documentation needed..."
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', minHeight: '60px' }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={handleSave}
          style={{ padding: '0.75rem 1.5rem', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          💾 Save Journey
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
