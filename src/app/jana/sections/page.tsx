'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface BusinessType {
  id: string;
  name: string;
  icon: string;
  is_parent: boolean;
  sections: string[];
  own_sections: string[];
  description: string;
}

interface Section {
  id: string;
  name: string;
  icon: string;
  affects_mini_sites: boolean;
  business_types: string[];
}

export default function SectionsPage() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [sectionName, setSectionName] = useState('');
  const [sectionIcon, setSectionIcon] = useState('fa-layer-group');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [typesRes, sectionsRes] = await Promise.all([
        fetch('/api/jana/types'),
        fetch('/api/jana/sections')
      ]);

      if (typesRes.ok) {
        const types = await typesRes.json();
        setBusinessTypes(Array.isArray(types) ? types : []);
      }
      if (sectionsRes.ok) {
        const secs = await sectionsRes.json();
        setSections(Array.isArray(secs) ? secs : []);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectType(typeId: string) {
    setSelectedType(typeId);
    const type = businessTypes.find(t => t.id === typeId);
    if (type) {
      setSelectedSections(type.sections || []);
    } else {
      setSelectedSections([]);
    }
  }

  async function handleSaveSections() {
    if (!selectedType) {
      setError('Select a business type first');
      return;
    }

    try {
      const res = await fetch('/api/jana/types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedType,
          sections: selectedSections
        })
      });

      if (res.ok) {
        setSuccess('✅ Sections updated! Affects mini sites.');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error saving sections');
    }
  }

  async function handleCreateSection() {
    if (!sectionName.trim()) {
      setError('Section name required');
      return;
    }

    try {
      const res = await fetch('/api/jana/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sectionName.trim(),
          icon: sectionIcon,
          affects_mini_sites: true
        })
      });

      if (res.ok) {
        setSuccess('✅ Section created!');
        setSectionName('');
        setSectionIcon('fa-layer-group');
        setError('');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error creating section');
    }
  }

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ margin: 0, marginBottom: '1rem' }}>
        <i className="fas fa-layer-group" style={{ marginRight: '0.5rem', color: '#D4AF37' }}></i>
        Section Architect - Business Type Hierarchy
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Manage sections per business type. Sections affect mini sites visibility and search pages.
      </p>

      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '1rem',
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
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left: Business Types List */}
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{ marginTop: 0 }}>Business Types</h3>
          {loading ? (
            <p style={{ color: '#94a3b8' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {businessTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    border: selectedType === type.id ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: selectedType === type.id ? '#fffbeb' : '#f9fafb',
                    cursor: 'pointer',
                    fontWeight: selectedType === type.id ? 'bold' : 'normal'
                  }}
                >
                  <i className={`fas ${type.icon}`} style={{ marginRight: '0.5rem', color: '#D4AF37' }}></i>
                  {type.name}
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                    ({type.sections?.length || 0} sections)
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Section Selection & Creation */}
        <div>
          {/* Create Section */}
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ marginTop: 0 }}>Create New Section</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Section name"
                value={sectionName}
                onChange={e => setSectionName(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <input
                type="text"
                placeholder="Icon class (fa-...)"
                value={sectionIcon}
                onChange={e => setSectionIcon(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <button
                onClick={handleCreateSection}
                style={{
                  background: '#D4AF37',
                  color: '#1a1a2e',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                + Create Section
              </button>
            </div>
          </div>

          {/* Assign Sections to Type */}
          {selectedType && (
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{ marginTop: 0 }}>
                Sections for {businessTypes.find(t => t.id === selectedType)?.name}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                ℹ️ Selected sections appear in mini sites and search pages for this business type
              </p>
              
              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                {sections.map(section => (
                  <label
                    key={section.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <i className={`fas ${section.icon}`} style={{ color: '#D4AF37' }}></i>
                    <span style={{ fontWeight: 'bold' }}>{section.name}</span>
                    {section.affects_mini_sites && (
                      <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#0c4a6e', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                        Affects Mini Sites
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={handleSaveSections}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ✓ Save Section Assignments
              </button>
            </div>
          )}

          {!selectedType && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              color: '#64748b'
            }}>
              Select a business type to manage sections
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
}
