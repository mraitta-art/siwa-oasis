'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';

interface FieldDef { 
  id: string; 
  name: string; 
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox'; 
  required?: boolean; 
  options?: string[] 
}

interface Section {
  id: string;
  name: string;
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'gallery' | 'team' | 'faq' | 'pricing' | 'packages' | 'offers' | 'discounts' | 'investments' | 'business_form';
  order: number;
  enabled: boolean;
  images?: string[];
  fields?: FieldDef[];
}

export default function HomepageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [sections, setSections] = useState<Section[]>([]);
  const [pageSettings, setPageSettings] = useState({
    title: '',
    description: '',
    theme: 'light',
    layout: 'standard',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const availableSectionTypes = [
    { value: 'hero', label: '🎬 Hero Section', description: 'Large banner with headline' },
    { value: 'features', label: '✨ Features', description: 'Highlight key features' },
    { value: 'testimonials', label: '💬 Testimonials', description: 'Customer reviews' },
    { value: 'cta', label: '🎯 Call to Action', description: 'Button or form' },
    { value: 'gallery', label: '🖼️ Gallery', description: 'Image showcase' },
    { value: 'team', label: '👥 Team', description: 'Team members' },
    { value: 'faq', label: '❓ FAQ', description: 'Frequently asked questions' },
    { value: 'pricing', label: '💰 Pricing', description: 'Pricing plans' },
    { value: 'packages', label: '📦 Packages', description: 'Business packages & bundles' },
    { value: 'offers', label: '🎁 Offers', description: 'Limited time offers' },
    { value: 'discounts', label: '🏷️ Discounts', description: 'Discount campaigns' },
    { value: 'investments', label: '💼 Investment Opportunities', description: 'Investment listings' },
    { value: 'business_form', label: '🧾 Business Form', description: 'Custom form for business submissions' },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/homepages/${id}`);
        const data = await res.json();
        if (data.success && data.page) {
          setPageSettings({
            title: data.page.title || data.page.name || '',
            description: data.page.description || '',
            theme: data.page.theme || 'light',
            layout: data.page.layout || 'standard',
          });
          setSections(data.page.sections || []);
        } else {
          alert('Failed to load page config');
        }
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const toggleSection = (sectionId: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  async function uploadFile(file: File) {
    const reader = new FileReader();
    const dataUrl: string = await new Promise((res, rej) => {
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

    const filename = `${Date.now()}_${file.name}`;
    const resp = await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data: dataUrl }),
    });
    const j = await resp.json();
    if (j?.success && j.url) return j.url;
    throw new Error(j?.error || 'Upload failed');
  }

  const handleFileSelect = async (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, images: [...(s.images||[]), url] } : s));
      if (editingSection && editingSection.id === sectionId) {
        setEditingSection(prev => prev ? { ...prev, images: [...(prev.images||[]), url] } : null);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Image upload failed');
    }
  };

  const removeImage = (sectionId: string, idx: number) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, images: (s.images || []).filter((_, i) => i !== idx) } : s));
    if (editingSection && editingSection.id === sectionId) {
      setEditingSection(prev => prev ? { ...prev, images: (prev.images || []).filter((_, i) => i !== idx) } : null);
    }
  };

  const addSection = (type: string) => {
    const newSection: Section = {
      id: Date.now().toString(),
      name: availableSectionTypes.find((t) => t.value === type)?.label.split(' ').slice(1).join(' ') || type,
      type: type as any,
      order: Math.max(...sections.map((s) => s.order), 0) + 1,
      enabled: true,
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
    if (editingSection?.id === sectionId) {
      setEditingSection(null);
    }
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const moveIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index].order, newSections[moveIndex].order] = [
      newSections[moveIndex].order,
      newSections[index].order,
    ];

    newSections.sort((a, b) => a.order - b.order);
    setSections(newSections);
  };

  const handleSavePage = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/homepages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: pageSettings.title,
          description: pageSettings.description,
          theme: pageSettings.theme,
          layout: pageSettings.layout,
          sections 
        }),
      });
      if (res.ok) {
        alert('Homepage configuration saved successfully!');
      } else {
        const j = await res.json();
        alert('Save failed: ' + (j?.error || res.statusText));
      }
    } catch (err) {
      console.error(err);
      alert('Save error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionSave = (updated: Section) => {
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditingSection(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-semibold text-xs animate-pulse">Loading page settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header toolbar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <Link href="/admin/homepages-manager" className="group text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors mb-2 inline-flex items-center gap-1 uppercase tracking-wider">
              ← Homepage Manager
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Homepage Editor</h1>
            <p className="text-slate-500 text-xs font-medium">Design structures and layouts for <span className="text-slate-800 font-bold">{pageSettings.title || 'Untitled Page'}</span></p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/homepage-preview/${id}`}
              className="px-3.5 py-2 border border-slate-250 hover:bg-slate-50 text-slate-705 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              👁️ View Preview
            </Link>
            <button
              onClick={handleSavePage}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-905 hover:bg-slate-950 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '💾 Save Page'}
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Page settings drawer (Left) */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-4">
                📄 Page Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Page Title</label>
                  <input
                    type="text"
                    value={pageSettings.title}
                    onChange={(e) => setPageSettings({ ...pageSettings, title: e.target.value })}
                    placeholder="Enter page title"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={pageSettings.description}
                    onChange={(e) => setPageSettings({ ...pageSettings, description: e.target.value })}
                    placeholder="Brief description for SEO and headings"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 text-xs font-medium"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Theme</label>
                    <select
                      value={pageSettings.theme}
                      onChange={(e) => setPageSettings({ ...pageSettings, theme: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-950 text-xs font-medium"
                    >
                      <option value="light">☀️ Light Theme</option>
                      <option value="dark">🌙 Dark Theme</option>
                      <option value="golden">✨ Golden Desert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Layout</label>
                    <select
                      value={pageSettings.layout}
                      onChange={(e) => setPageSettings({ ...pageSettings, layout: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-950 text-xs font-medium"
                    >
                      <option value="standard">Standard</option>
                      <option value="minimal">Minimalist</option>
                      <option value="showcase">Showcase Grid</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSavePage}
                  className="w-full mt-2 py-2 border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold rounded-lg text-xs transition-colors"
                >
                  Quick Save Settings
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-4">⚡ Page Status</h2>
              <div className="space-y-2">
                <button
                  onClick={handleSavePage}
                  className="w-full px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 text-left text-xs font-bold rounded-lg transition-colors"
                >
                  ✓ Page config is active
                </button>
                <Link
                  href={`/admin/homepage-sections/${id}`}
                  className="w-full px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 block text-xs font-bold rounded-lg transition-colors"
                >
                  📋 Configure Datasets
                </Link>
              </div>
            </div>

          </div>

          {/* Sections manager list (Right/Center) */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-5 flex items-center justify-between">
                <span>📋 Layout Sections ({sections.length})</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Management</span>
              </h2>

              {sections.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg mb-6">
                  <div className="text-2xl mb-2">🧩</div>
                  <h4 className="text-xs font-bold text-slate-600 mb-0.5">No sections added yet</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Select a component template below to start structuring your homepage.</p>
                </div>
              ) : (
                <div className="space-y-3 mb-8">
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                      <div
                        key={section.id}
                        className={`border rounded-lg p-4 transition-all duration-150 ${
                          section.enabled 
                            ? 'bg-white border-slate-200' 
                            : 'bg-white border-slate-150 opacity-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={section.enabled}
                              onChange={() => toggleSection(section.id)}
                              className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 border-slate-350 accent-slate-900 cursor-pointer"
                              title="Toggle Visibility"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                {section.name}
                                {!section.enabled && <span className="text-[9px] border border-slate-250 text-slate-500 px-1 rounded uppercase font-bold">Hidden</span>}
                              </div>
                              <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider">{section.type}</div>
                            </div>
                          </div>

                          <div className="flex gap-1.5 self-end sm:self-center">
                            <button
                              onClick={() => moveSection(section.id, 'up')}
                              disabled={index === 0}
                              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-500 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                              title="Move Up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveSection(section.id, 'down')}
                              disabled={index === sections.length - 1}
                              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-500 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                              title="Move Down"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => setEditingSection(section)}
                              className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-705 text-xs font-bold rounded transition-colors"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => removeSection(section.id)}
                              className="px-2.5 py-1 border border-slate-200 hover:border-rose-350 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded transition-colors"
                              title="Delete Component"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Add New Section block */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Add Layout Component</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSectionTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => addSection(type.value)}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-lg transition-all duration-150 text-left group"
                    >
                      <div className="font-bold text-slate-800 text-xs group-hover:text-slate-950 transition-colors">{type.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editing Section Drawer Details Modal */}
            {editingSection && (
              <div className="bg-white border border-slate-350 rounded-xl p-5 transition-all duration-200">
                <div className="flex items-center justify-between pb-2 mb-5 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Configure Component: {editingSection.name}</h3>
                    <p className="text-[10px] text-slate-400">Settings for {editingSection.type} element</p>
                  </div>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Section Custom Name</label>
                    <input
                      type="text"
                      value={editingSection.name}
                      onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-950 text-xs font-medium"
                    />
                  </div>

                  {/* Business Form Fields Editor */}
                  {editingSection.type === 'business_form' && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-3">Custom Form Fields</h4>
                      <div className="space-y-3">
                        {(editingSection.fields || []).map((field, idx) => (
                          <div key={field.id} className="flex flex-wrap gap-2 items-center border border-slate-200 p-2.5 rounded-lg bg-white">
                            <input 
                              type="text" 
                              value={field.name} 
                              onChange={(e) => {
                                const name = e.target.value;
                                setEditingSection(prev => {
                                  if (!prev) return null;
                                  const fields = [...(prev.fields || [])];
                                  fields[idx] = { ...fields[idx], name };
                                  return { ...prev, fields };
                                });
                              }}
                              placeholder="Field Label"
                              className="px-2 py-1 bg-white text-slate-800 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-950" 
                            />
                            
                            <select 
                              value={field.type} 
                              onChange={(e) => {
                                const type = e.target.value as any;
                                setEditingSection(prev => {
                                  if (!prev) return null;
                                  const fields = [...(prev.fields || [])];
                                  fields[idx] = { ...fields[idx], type };
                                  return { ...prev, fields };
                                });
                              }}
                              className="px-2 py-1 bg-white text-slate-800 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-950"
                            >
                              <option value="text">Text Input</option>
                              <option value="number">Numeric</option>
                              <option value="textarea">Paragraph text</option>
                              <option value="select">Dropdown select</option>
                              <option value="checkbox">Toggle box</option>
                            </select>

                            <label className="text-xs text-slate-500 flex items-center gap-1 select-none">
                              <input 
                                type="checkbox" 
                                checked={field.required} 
                                onChange={(e) => {
                                  const required = e.target.checked;
                                  setEditingSection(prev => {
                                    if (!prev) return null;
                                    const fields = [...(prev.fields || [])];
                                    fields[idx] = { ...fields[idx], required };
                                    return { ...prev, fields };
                                  });
                                }}
                                className="rounded text-slate-900 border-slate-350 accent-slate-900"
                              /> 
                              Required
                            </label>

                            <button 
                              onClick={() => {
                                setEditingSection(prev => {
                                  if (!prev) return null;
                                  const fields = (prev.fields || []).filter((_, i) => i !== idx);
                                  return { ...prev, fields };
                                });
                              }} 
                              className="ml-auto text-rose-600 text-xs font-bold hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ))}

                        <button 
                          onClick={() => {
                            const newField: FieldDef = { 
                              id: Math.random().toString(36).slice(2, 9), 
                              name: 'New Field Label', 
                              type: 'text', 
                              required: false 
                            };
                            setEditingSection(prev => prev ? { ...prev, fields: [...(prev.fields || []), newField] } : null);
                          }}
                          className="px-3 py-1.5 border border-slate-900 text-slate-900 hover:bg-slate-50 text-xs font-bold rounded transition-colors"
                        >
                          + Add Field Element
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image Uploader for Hero or Gallery */}
                  {(editingSection.type === 'hero' || editingSection.type === 'gallery') && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-3">Component Images</label>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(editingSection.id, e)}
                          className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-slate-250 file:text-xs file:font-semibold file:bg-white file:text-slate-700 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(editingSection.images || []).map((img, i) => (
                          <div key={i} className="aspect-[4/3] bg-slate-100 rounded overflow-hidden relative border border-slate-200 group">
                            <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeImage(editingSection.id, i)} 
                              className="absolute top-1 right-1 bg-slate-900 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] leading-none"
                              title="Delete Image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2 border-t border-slate-100 justify-end">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSectionSave(editingSection)}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Apply Updates
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
