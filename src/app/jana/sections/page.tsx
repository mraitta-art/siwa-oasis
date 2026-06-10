'use client';

import { useState, useEffect } from 'react';

interface Section {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('fa-layer-group');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    try {
      setLoading(true);
      const res = await fetch('/api/jana/sections');
      if (res.ok) {
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError('Section name is required');
      return;
    }

    try {
      const res = await fetch('/api/jana/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon,
          description: '',
          is_universal: true
        })
      });

      if (res.ok) {
        setSuccess('Section created successfully');
        setName('');
        setIcon('fa-layer-group');
        setError('');
        loadSections();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to create section');
      }
    } catch (err) {
      setError('Error creating section');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this section?')) return;

    try {
      const res = await fetch('/api/jana/sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setSuccess('Section deleted');
        loadSections();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete section');
      }
    } catch (err) {
      setError('Error deleting section');
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>
          <i className="fas fa-layer-group" style={{ marginRight: '0.5rem', color: '#D4AF37' }}></i>
          Section Architect
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Manage universal sections for your platform</p>
      </div>

      {/* Form */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Section</h3>
        
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Section name"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          <input
            type="text"
            placeholder="Icon class (e.g., fa-star)"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              background: '#D4AF37',
              color: '#1a1a2e',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Create
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div>
        <h3>Sections ({sections.length})</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
            Loading sections...
          </div>
        ) : sections.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#f8fafc',
            borderRadius: '8px',
            color: '#64748b'
          }}>
            No sections created yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {sections.map(section => (
              <div
                key={section.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <i
                    className={`fas ${section.icon}`}
                    style={{
                      fontSize: '1.5rem',
                      color: '#D4AF37'
                    }}
                  ></i>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {section.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {section.icon}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(section.id)}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <i className="fas fa-trash" style={{ marginRight: '0.25rem' }}></i>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
