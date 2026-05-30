'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  image_url: string;
  link: string;
  display_order: number;
  is_visible: boolean;
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Load categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/jana/experience-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
    setLoading(false);
  };

  const handleSave = async (category: Category) => {
    try {
      const res = await fetch('/api/jana/experience-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (res.ok) {
        fetchCategories();
        setEditing(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      await fetch('/api/jana/experience-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_visible: !currentVisibility }),
      });
      fetchCategories();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      await fetch('/api/jana/experience-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, display_order: newOrder }),
      });
      fetchCategories();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await fetch(`/api/jana/experience-categories?id=${id}`, { method: 'DELETE' });
      fetchCategories();
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
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#D4AF37' }}>Experience Categories Manager</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0' }}>Manage "Discover the Living Spirit" section</p>
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
            {showForm ? 'Cancel' : '+ Add Category'}
          </button>
          <Link href="/jana/website" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Back to Website Builder
          </Link>
        </div>
      </div>

      {/* New/Edit Form */}
      {showForm && (
        <CategoryForm
          category={editing || { id: '', title: '', subtitle: '', icon: '', color: '#D4AF37', image_url: '', link: '', display_order: categories.length + 1, is_visible: true }}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Categories List */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {categories.map((category) => (
            <div key={category.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', position: 'relative' }}>
              {/* Visibility Badge */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem 0.75rem', background: category.is_visible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', borderRadius: '20px', fontSize: '0.75rem', color: category.is_visible ? '#10b981' : '#ef4444' }}>
                {category.is_visible ? '✓ Visible' : '✗ Hidden'}
              </div>

              {/* Image Preview */}
              <img src={category.image_url} alt={category.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />

              {/* Content */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <i className={`fas ${category.icon}`} style={{ color: category.color, fontSize: '1.2rem' }} />
                  <h3 style={{ margin: 0, color: '#fff' }}>{category.title}</h3>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>{category.subtitle}</p>
              </div>

              {/* Order */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Display Order</label>
                <input
                  type="number"
                  value={category.display_order}
                  onChange={(e) => handleReorder(category.id, parseInt(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={() => { setEditing(category); setShowForm(true); }}
                  style={{ padding: '0.5rem', background: 'rgba(100,200,255,0.2)', color: '#64c8ff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggleVisibility(category.id, category.is_visible)}
                  style={{ padding: '0.5rem', background: category.is_visible ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: category.is_visible ? '#ef4444' : '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {category.is_visible ? '👁️ Hide' : '👁️ Show'}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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
// Category Form Component
// ─────────────────────────────────────────────────────────────────────
interface CategoryFormProps {
  category: Category;
  onSave: (category: Category) => void;
  onCancel: () => void;
}

function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [form, setForm] = useState(category);

  const handleChange = (field: keyof Category, value: any) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem' }}>
      <h2 style={{ marginTop: 0, color: '#D4AF37' }}>{form.id ? 'Edit Category' : 'New Category'}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ID */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Category ID (unique slug)</label>
          <input
            type="text"
            value={form.id}
            onChange={(e) => handleChange('id', e.target.value)}
            disabled={!!category.id}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Title */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Category Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>

        {/* Icon */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Font Awesome Icon (e.g., fa-spa)</label>
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

        {/* Full width: Subtitle */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Subtitle (description)</label>
          <textarea
            value={form.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', minHeight: '80px' }}
          />
        </div>

        {/* Image URL */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Image URL</label>
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
          {form.image_url && <img src={form.image_url} alt="preview" style={{ marginTop: '1rem', maxWidth: '200px', borderRadius: '4px' }} />}
        </div>

        {/* Link */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Link (destination URL)</label>
          <input
            type="text"
            value={form.link}
            onChange={(e) => handleChange('link', e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={() => onSave(form)}
          style={{ padding: '0.75rem 1.5rem', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          💾 Save Category
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
