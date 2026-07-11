'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface BusinessType {
  id: string;
  name: string;
  icon: string;
  icon_color?: string;
  is_parent: boolean;
  parent_id?: string | null;
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
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sectionDeleteModal, setSectionDeleteModal] = useState<Section | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [typesRes, sectionsRes] = await Promise.all([
        fetch('/api/jana/types?t=' + Date.now()),
        fetch('/api/jana/sections?t=' + Date.now())
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
      const isParent = type.is_parent || Number(type.is_parent) === 1;
      // Parents manage 'sections'; children manage their own extra 'own_sections'
      setSelectedSections(isParent ? (type.sections || []) : (type.own_sections || []));
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
      // Fetch the current type data to preserve all fields
      const typeRes = await fetch('/api/jana/types?id=' + selectedType + '&t=' + Date.now());
      if (!typeRes.ok) {
        setError('Could not load type data. Please try again.');
        return;
      }
      const currentType = await typeRes.json();

      // Determine correct field: parents use 'sections', children use 'own_sections'
      const isParent = currentType.is_parent || Number(currentType.is_parent) === 1;
      const updatedBody = {
        id: currentType.id,
        name: currentType.name,
        icon: currentType.icon,
        icon_color: currentType.icon_color,
        description: currentType.description,
        is_parent: currentType.is_parent,
        parent_id: currentType.parent_id,
        active: currentType.active !== false,
        sections: isParent ? selectedSections : (currentType.sections || []),
        own_sections: isParent ? (currentType.own_sections || []) : selectedSections,
      };

      const res = await fetch('/api/jana/types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBody)
      });

      if (res.ok) {
        setSuccess('✅ Sections saved successfully!');
        setError('');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError('Failed to save: ' + (errData.error || res.statusText));
      }
    } catch (err) {
      setError('Error saving sections. Please try again.');
    }
  }

  async function handleSaveSection() {
    if (!sectionName.trim()) {
      setError('Section name required');
      return;
    }

    try {
      const method = editingSectionId ? 'PUT' : 'POST';
      const body: any = {
        name: sectionName.trim(),
        icon: sectionIcon,
        affects_mini_sites: true
      };
      
      if (editingSectionId) {
        body.id = editingSectionId;
      }

      const res = await fetch('/api/jana/sections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setSuccess(editingSectionId ? '✅ Section updated!' : '✅ Section created!');
        setSectionName('');
        setSectionIcon('fa-layer-group');
        setEditingSectionId(null);
        setError('');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save section');
      }
    } catch (err) {
      setError('Error saving section');
    }
  }

  async function handleDeleteSection(section: Section) {
    setSectionDeleteModal(section);
  }

  async function executeDeleteSection() {
    if (!sectionDeleteModal) return;
    const id = sectionDeleteModal.id;
    try {
      const res = await fetch(`/api/jana/sections?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('✅ Section deleted!');
        setSectionDeleteModal(null);
        if (selectedSections.includes(id)) {
          setSelectedSections(prev => prev.filter(s => s !== id));
        }
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete section');
      }
    } catch (err) {
      setError('Error deleting section');
    }
  }

  function downloadSectionBackup(section: Section) {
    const backup = {
      exported_at: new Date().toISOString(),
      warning: 'Backup created before section deletion.',
      section
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_section_${section.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleEditSection(section: Section) {
    setEditingSectionId(section.id);
    setSectionName(section.name);
    setSectionIcon(section.icon);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              {businessTypes.filter(t => t.is_parent || Number(t.is_parent) === 1).map(parent => (
                <div key={parent.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => handleSelectType(parent.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem',
                      border: selectedType === parent.id ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: selectedType === parent.id ? '#fffbeb' : '#f8fafc',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      borderLeft: `4px solid ${parent.icon_color || '#1e293b'}`
                    }}
                  >
                    <i className={`fas ${parent.icon}`} style={{ marginRight: '0.5rem', color: parent.icon_color || '#D4AF37' }}></i>
                    {parent.name}
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                      ({(parent.sections || []).length} locked sections)
                    </span>
                  </button>
                  
                  {businessTypes.filter(t => t.parent_id === parent.id).map(child => (
                    <button
                      key={child.id}
                      onClick={() => handleSelectType(child.id)}
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.6rem 0.6rem 2rem',
                        border: selectedType === child.id ? '2px solid #D4AF37' : '1px solid transparent',
                        borderRadius: '6px',
                        background: selectedType === child.id ? '#fffbeb' : 'transparent',
                        cursor: 'pointer',
                        fontWeight: selectedType === child.id ? 'bold' : 'normal',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <i className={`fas ${child.icon}`} style={{ marginRight: '0.5rem', color: child.icon_color || '#8b5cf6', fontSize: '0.8rem' }}></i>
                      <div style={{ flex: 1 }}>
                        {child.name}
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                          ({(child.own_sections || []).length} extra)
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              
              {/* Orphan Types (in case some have no parent but aren't parents themselves, which shouldn't happen but fallback) */}
              {businessTypes.filter(t => !t.is_parent && Number(t.is_parent) !== 1 && !t.parent_id).map(orphan => (
                 <button
                   key={orphan.id}
                   onClick={() => handleSelectType(orphan.id)}
                   style={{
                     textAlign: 'left',
                     padding: '0.75rem',
                     border: selectedType === orphan.id ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                     borderRadius: '6px',
                     background: selectedType === orphan.id ? '#fffbeb' : '#f9fafb',
                     cursor: 'pointer',
                     fontWeight: selectedType === orphan.id ? 'bold' : 'normal'
                   }}
                 >
                   <i className={`fas ${orphan.icon}`} style={{ marginRight: '0.5rem', color: '#D4AF37' }}></i>
                   {orphan.name}
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
            border: editingSectionId ? '2px solid #D4AF37' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <h3 style={{ margin: 0 }}>{editingSectionId ? '✏️ Edit Section' : 'Create New Section'}</h3>
               {editingSectionId && (
                 <button 
                   onClick={() => {
                     setEditingSectionId(null);
                     setSectionName('');
                     setSectionIcon('fa-layer-group');
                   }}
                   style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                 >
                   Cancel Edit
                 </button>
               )}
            </div>
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
                onClick={handleSaveSection}
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
                {editingSectionId ? '✓ Save Changes' : '+ Create Section'}
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
                      padding: '0.5rem 0.75rem',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      style={{ cursor: 'pointer', width: '1.2rem', height: '1.2rem' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.75rem', cursor: 'pointer' }} onClick={() => toggleSection(section.id)}>
                      <i className={`fas ${section.icon}`} style={{ color: '#D4AF37' }}></i>
                      <span style={{ fontWeight: 'bold' }}>{section.name}</span>
                      {section.affects_mini_sites && (
                        <span style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#0c4a6e', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                          Mini Sites
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleEditSection(section); }}
                        style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                        title="Edit Section"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDeleteSection(section); }}
                        style={{ background: '#fee2e2', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}
                        title="Delete Section"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
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

      {/* SECTION DELETE WARNING MODAL */}
      {sectionDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Delete Section</div>
                <div style={{ opacity: 0.85, fontSize: '0.85rem' }}>This action cannot be undone</div>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', color: '#1e293b', fontWeight: 600 }}>
                Delete section: <span style={{ color: '#dc2626' }}>«{sectionDeleteModal.name}»</span>
              </p>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e' }}>
                This section will be <strong>removed from all business types</strong> that currently use it, and all its auto-generated form fields will be permanently deleted.
              </div>
              <button
                onClick={() => downloadSectionBackup(sectionDeleteModal)}
                style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', background: '#f8fafc', border: '2px dashed #94a3b8', borderRadius: '8px', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                📥 Download JSON Backup First (Recommended)
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setSectionDeleteModal(null)}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteSection}
                  style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                >
                  🗑️ Yes, Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
