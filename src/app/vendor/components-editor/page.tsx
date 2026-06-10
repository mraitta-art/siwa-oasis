'use client';

import { useState, useEffect } from 'react';

interface ComponentField {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'tel' | 'email' | 'select' | 'image' | 'time' | 'date' | 'checkbox';
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface SectionComponent {
  id: string;
  component_type: string;
  label: string;
  is_required: boolean;
  is_repeatable: boolean;
  max_items: number;
  config: {
    fields: ComponentField[];
  };
}

interface ComponentData {
  id?: string;
  title?: string;
  data: Record<string, any>;
  status: 'draft' | 'published';
}

export default function VendorComponentsEditorPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [components, setComponents] = useState<SectionComponent[]>([]);
  const [componentData, setComponentData] = useState<Record<string, ComponentData[]>>({});
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    try {
      const res = await fetch('/api/vendor/sections/available');
      if (res.ok) {
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          handleSectionSelect(data[0].id);
        }
      }
    } catch (err) {
      console.error('Load sections error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSectionSelect(sectionId: string) {
    setSelectedSection(sectionId);
    try {
      const [componentsRes, dataRes] = await Promise.all([
        fetch(`/api/vendor/sections/${sectionId}/components`),
        fetch(`/api/vendor/sections/${sectionId}/component-data`)
      ]);

      if (componentsRes.ok) {
        const comps = await componentsRes.json();
        setComponents(Array.isArray(comps) ? comps : []);
      }

      if (dataRes.ok) {
        const data = await dataRes.json();
        setComponentData(data || {});
      }
    } catch (err) {
      console.error('Load components error:', err);
    }
  }

  const updateComponentData = (componentId: string, dataIndex: number, fieldName: string, value: any) => {
    const key = componentId;
    const updated = [...(componentData[key] || [])];
    if (!updated[dataIndex]) {
      updated[dataIndex] = { data: {}, status: 'draft' };
    }
    updated[dataIndex].data[fieldName] = value;
    setComponentData({
      ...componentData,
      [key]: updated
    });
  };

  const addComponentInstance = (componentId: string) => {
    const key = componentId;
    const current = componentData[key] || [];
    if (current.length < 100) {
      setComponentData({
        ...componentData,
        [key]: [...current, { data: {}, status: 'draft' }]
      });
    }
  };

  const removeComponentInstance = (componentId: string, dataIndex: number) => {
    const key = componentId;
    setComponentData({
      ...componentData,
      [key]: componentData[key].filter((_, idx) => idx !== dataIndex)
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/sections/${selectedSection}/component-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(componentData)
      });

      if (res.ok) {
        alert('✅ Component data saved!');
        handleSectionSelect(selectedSection);
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Error saving data');
    } finally {
      setSaving(false);
    }
  };

  const S = {
    container: {
      minHeight: '100vh',
      background: '#1a1a1a',
      color: '#fff',
      padding: '2rem'
    },
    header: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '2rem',
      color: '#D4AF37'
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    sidebar: {
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '1px solid #556B2F',
      padding: '1rem',
      height: 'fit-content'
    },
    sectionItem: {
      padding: '0.75rem 1rem',
      marginBottom: '0.5rem',
      borderRadius: '4px',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    sectionItemActive: {
      background: '#556B2F',
      borderColor: '#D4AF37'
    },
    content: {
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '1px solid #556B2F',
      padding: '2rem'
    },
    componentBlock: {
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    componentHeader: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      color: '#D4AF37',
      marginBottom: '1.5rem',
      paddingBottom: '0.75rem',
      borderBottom: '1px solid #556B2F'
    },
    componentInstance: {
      background: '#2a2a2a',
      padding: '1.5rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      border: '1px solid #556B2F'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    label: {
      fontWeight: '500',
      color: '#D4AF37',
      fontSize: '0.9rem'
    },
    input: {
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      padding: '0.75rem',
      color: '#fff',
      fontSize: '1rem'
    },
    textarea: {
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      padding: '0.75rem',
      color: '#fff',
      fontSize: '1rem',
      minHeight: '120px',
      fontFamily: 'inherit'
    },
    select: {
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      padding: '0.75rem',
      color: '#fff',
      fontSize: '1rem'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    addButton: {
      background: '#10b981',
      color: '#fff'
    },
    removeButton: {
      background: '#ef4444',
      color: '#fff',
      padding: '0.5rem 1rem',
      fontSize: '0.85rem'
    },
    saveButton: {
      background: '#D4AF37',
      color: '#1a1a1a',
      marginTop: '2rem'
    }
  };

  if (loading) {
    return <div style={S.container}>⏳ Loading components...</div>;
  }

  const currentSection = sections.find(s => s.id === selectedSection);

  return (
    <div style={S.container}>
      <div style={S.header}>📝 Fill in Section Components</div>

      <div style={S.mainContent}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          {sections.map(section => (
            <div
              key={section.id}
              style={{
                ...S.sectionItem,
                ...(selectedSection === section.id ? S.sectionItemActive : {})
              }}
              onClick={() => handleSectionSelect(section.id)}
            >
              {section.name}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={S.content}>
          {components.length === 0 ? (
            <div style={{ color: '#aaa' }}>
              No components yet. Admin needs to add components to this section.
            </div>
          ) : (
            <>
              {components.map(component => (
                <div key={component.id} style={S.componentBlock}>
                  <div style={S.componentHeader}>
                    {component.label}
                    {component.is_required && <span style={{ color: '#ef4444' }}> *</span>}
                  </div>

                  {/* Existing data instances */}
                  {(componentData[component.id] || []).map((instance, idx) => (
                    <div key={idx} style={S.componentInstance}>
                      <form style={S.form}>
                        {component.config?.fields?.map((field: ComponentField) => (
                          <div key={field.name} style={S.formGroup}>
                            <label style={S.label}>
                              {field.label}
                              {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                            </label>

                            {field.type === 'textarea' ? (
                              <textarea
                                style={S.textarea}
                                value={instance.data[field.name] || ''}
                                onChange={(e) =>
                                  updateComponentData(component.id, idx, field.name, e.target.value)
                                }
                                placeholder={field.placeholder}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                style={S.select}
                                value={instance.data[field.name] || ''}
                                onChange={(e) =>
                                  updateComponentData(component.id, idx, field.name, e.target.value)
                                }
                              >
                                <option value="">Select...</option>
                                {field.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'checkbox' ? (
                              <input
                                type="checkbox"
                                checked={instance.data[field.name] || false}
                                onChange={(e) =>
                                  updateComponentData(component.id, idx, field.name, e.target.checked)
                                }
                                style={{ width: '20px', height: '20px' }}
                              />
                            ) : (
                              <input
                                type={field.type}
                                style={S.input}
                                value={instance.data[field.name] || ''}
                                onChange={(e) =>
                                  updateComponentData(component.id, idx, field.name, e.target.value)
                                }
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        ))}
                      </form>

                      {component.is_repeatable && (componentData[component.id]?.length || 0) > 1 && (
                        <button
                          style={S.removeButton}
                          onClick={() => removeComponentInstance(component.id, idx)}
                        >
                          ❌ Remove
                        </button>
                      )}
                    </div>
                  ))}

                  {component.is_repeatable &&
                    (componentData[component.id]?.length || 0) < component.max_items && (
                      <button
                        style={S.addButton}
                        onClick={() => addComponentInstance(component.id)}
                      >
                        ➕ Add Another {component.label}
                      </button>
                    )}
                </div>
              ))}

              <button style={{ ...S.button, ...S.saveButton }} onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : '✅ Save All Components'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
