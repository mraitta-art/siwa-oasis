'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ComponentTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

interface SelectedComponent {
  templateId: string;
  label: string;
  isRequired: boolean;
  isRepeatable: boolean;
  maxItems: number;
}

export default function AddComponentsPage() {
  const router = useRouter();
  const params = useParams();
  const sectionId = params.id as string;

  const [templates, setTemplates] = useState<ComponentTemplate[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch('/api/admin/component-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Load templates error:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleComponent = (templateId: string, template: ComponentTemplate) => {
    const exists = selectedComponents.find(c => c.templateId === templateId);
    if (exists) {
      setSelectedComponents(selectedComponents.filter(c => c.templateId !== templateId));
    } else {
      setSelectedComponents([
        ...selectedComponents,
        {
          templateId,
          label: template.name,
          isRequired: false,
          isRepeatable: ['team_member', 'testimonial', 'faq', 'pricing'].includes(templateId),
          maxItems: 10
        }
      ]);
    }
  };

  const updateComponent = (templateId: string, field: string, value: any) => {
    setSelectedComponents(selectedComponents.map(c =>
      c.templateId === templateId ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sections/${sectionId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: selectedComponents
        })
      });

      if (res.ok) {
        alert('✅ Components added! Section is ready for vendor content.');
        router.push('/admin/sections');
      } else {
        alert('Failed to save components');
      }
    } catch (err) {
      alert('Error saving components');
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
    subtitle: {
      fontSize: '1rem',
      color: '#aaa',
      marginBottom: '2rem',
      maxWidth: '800px'
    },
    mainContent: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    section: {
      marginBottom: '3rem'
    },
    sectionTitle: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      color: '#D4AF37',
      marginBottom: '1.5rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #556B2F'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    card: {
      background: '#2a2a2a',
      border: '1px solid #556B2F',
      borderRadius: '8px',
      padding: '1.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative' as const
    },
    cardSelected: {
      borderColor: '#D4AF37',
      background: '#3a3a2a'
    },
    cardIcon: {
      fontSize: '2.5rem',
      marginBottom: '0.75rem'
    },
    cardName: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    cardDescription: {
      fontSize: '0.85rem',
      color: '#aaa',
      lineHeight: '1.4'
    },
    checkbox: {
      position: 'absolute' as const,
      top: '1rem',
      right: '1rem',
      width: '24px',
      height: '24px',
      cursor: 'pointer'
    },
    selectedList: {
      background: '#2a2a2a',
      border: '1px solid #556B2F',
      borderRadius: '8px',
      padding: '2rem',
      maxWidth: '600px'
    },
    selectedItem: {
      background: '#1a1a1a',
      padding: '1.5rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      border: '1px solid #556B2F'
    },
    selectedItemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    selectedItemTitle: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: '#D4AF37'
    },
    removeButton: {
      background: '#ef4444',
      color: '#fff',
      border: 'none',
      padding: '0.35rem 0.75rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: 'bold'
    },
    checkboxGroup: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1rem',
      flexWrap: 'wrap' as const
    },
    checkboxItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    fieldGroup: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1rem'
    },
    field: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.35rem'
    },
    label: {
      fontSize: '0.85rem',
      color: '#aaa',
      fontWeight: '500'
    },
    input: {
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      padding: '0.5rem',
      color: '#fff',
      fontSize: '0.9rem'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '2rem'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    continueButton: {
      background: '#D4AF37',
      color: '#1a1a1a',
      flex: 1
    },
    skipButton: {
      background: '#556B2F',
      color: '#fff'
    }
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div style={S.container}>
      <div style={S.header}>⚙️ Add Components to Your Section</div>
      <div style={S.subtitle}>
        Select which components (Location, Hours, Team, etc.) vendors should fill in for this section.
        Vendors will see these components in their dashboard and can add their business details.
      </div>

      <div style={S.mainContent}>
        {/* Available Templates */}
        {!loading && (
          <>
            {categories.map(category => (
              <div key={category} style={S.section}>
                <div style={S.sectionTitle}>
                  {category === 'Basic' && '🏗️ Basic Components'}
                  {category === 'Showcase' && '✨ Showcase Components'}
                  {category === 'Advanced' && '🔧 Advanced Components'}
                </div>

                <div style={S.grid}>
                  {templates
                    .filter(t => t.category === category)
                    .map(template => {
                      const isSelected = selectedComponents.some(c => c.templateId === template.id);
                      return (
                        <div
                          key={template.id}
                          style={{
                            ...S.card,
                            ...(isSelected ? S.cardSelected : {})
                          }}
                          onClick={() => toggleComponent(template.id, template)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={S.checkbox}
                          />
                          <div style={S.cardIcon}>{template.icon}</div>
                          <div style={S.cardName}>{template.name}</div>
                          <div style={S.cardDescription}>{template.description}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Selected Components Configuration */}
        {selectedComponents.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>⚙️ Configure Selected Components</div>
            <div style={S.selectedList}>
              {selectedComponents.map(comp => {
                const template = templates.find(t => t.id === comp.templateId);
                return (
                  <div key={comp.templateId} style={S.selectedItem}>
                    <div style={S.selectedItemHeader}>
                      <div style={S.selectedItemTitle}>{comp.label}</div>
                      <button
                        style={S.removeButton}
                        onClick={() => toggleComponent(comp.templateId, template!)}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={S.checkboxGroup}>
                      <div style={S.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={comp.isRequired}
                          onChange={(e) => updateComponent(comp.templateId, 'isRequired', e.target.checked)}
                        />
                        <label>Required for vendors</label>
                      </div>

                      <div style={S.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={comp.isRepeatable}
                          onChange={(e) => updateComponent(comp.templateId, 'isRepeatable', e.target.checked)}
                        />
                        <label>Allow multiple items</label>
                      </div>
                    </div>

                    {comp.isRepeatable && (
                      <div style={S.field}>
                        <label style={S.label}>Maximum items allowed:</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={comp.maxItems}
                          onChange={(e) => updateComponent(comp.templateId, 'maxItems', parseInt(e.target.value))}
                          style={S.input}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedComponents.length > 0 && (
          <div style={{ ...S.section, ...S.selectedList, background: '#556B2F', border: 'none' }}>
            <div style={S.sectionTitle}>✅ Summary</div>
            <div style={{ color: '#fff', lineHeight: '1.8' }}>
              <div>📝 Components selected: <strong>{selectedComponents.length}</strong></div>
              <div>🔒 Required: <strong>{selectedComponents.filter(c => c.isRequired).length}</strong></div>
              <div>🔄 Repeatable: <strong>{selectedComponents.filter(c => c.isRepeatable).length}</strong></div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#ddd' }}>
                Vendors will see these components in their content manager and can add/edit the details for their business.
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={S.buttonGroup}>
          <button
            style={{ ...S.button, ...S.skipButton }}
            onClick={() => router.push('/admin/sections')}
          >
            Skip Components
          </button>
          <button
            style={{ ...S.button, ...S.continueButton }}
            onClick={handleSave}
            disabled={saving || selectedComponents.length === 0}
          >
            {saving ? '⏳ Saving...' : `✅ Add ${selectedComponents.length} Component${selectedComponents.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
