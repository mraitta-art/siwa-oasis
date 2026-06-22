'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FieldDef { id: string; name: string; type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox'; required?: boolean; options?: string[] }

interface Section {
  id: string;
  name: string;
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'gallery' | 'team' | 'faq' | 'pricing' | 'packages' | 'offers' | 'discounts' | 'investments' | 'business_form';
  order: number;
  enabled: boolean;
  images?: string[];
  fields?: FieldDef[]; // for business_form sections
}

export default function HomepageEditorPage({ params }: { params: { id: string } }) {
  const [sections, setSections] = useState<Section[]>([
    { id: '1', name: 'Hero Section', type: 'hero', order: 1, enabled: true, images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop'] },
    { id: '2', name: 'Features', type: 'features', order: 2, enabled: true },
    { id: '3', name: 'Testimonials', type: 'testimonials', order: 3, enabled: false },
    { id: '4', name: 'Call to Action', type: 'cta', order: 4, enabled: true },
  ]);

  const [pageSettings, setPageSettings] = useState({
    title: 'Hotels & Resorts',
    description: 'Discover the best accommodation options',
    theme: 'dark',
    layout: 'standard',
  });

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
    { value: 'business_form', label: '🧾 Business Form', description: 'Custom form for business submissions (packages/offers/etc)' },
  ];

  const toggleSection = (id: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Upload helper: read file as base64 and POST to /api/uploads
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
    } catch (err) {
      console.error('Upload failed', err);
      alert('Image upload failed');
    }
  };

  const removeImage = (sectionId: string, idx: number) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, images: (s.images || []).filter((_, i) => i !== idx) } : s));
  };

  const addSection = (type: string) => {
    const newSection: Section = {
      id: Date.now().toString(),
      name: availableSectionTypes.find((t) => t.value === type)?.label || type,
      type: type as any,
      order: Math.max(...sections.map((s) => s.order), 0) + 1,
      enabled: true,
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/homepages-manager" className="text-gray-400 hover:text-[#D4AF37] transition-colors mb-4 block">
            ← Back to Homepages
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Homepage Editor</h1>
          <p className="text-gray-400">Manage sections and layout for this page</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Page Settings */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">📄 Page Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Page Title</label>
                  <input
                    type="text"
                    value={pageSettings.title}
                    onChange={(e) => setPageSettings({ ...pageSettings, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                  <textarea
                    value={pageSettings.description}
                    onChange={(e) => setPageSettings({ ...pageSettings, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Theme</label>
                  <select
                    value={pageSettings.theme}
                    onChange={(e) => setPageSettings({ ...pageSettings, theme: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="golden">Golden</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Layout</label>
                  <select
                    value={pageSettings.layout}
                    onChange={(e) => setPageSettings({ ...pageSettings, layout: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="showcase">Showcase</option>
                  </select>
                </div>

                <button className="w-full px-4 py-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded text-white font-semibold hover:opacity-90 transition-opacity">
                  Save Settings
                </button>
              </div>
            </div>

            {/* Save page and sections to API */}
            <div className="mt-6">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/homepages/${params.id}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pageSettings, sections }),
                    });
                    if (res.ok) {
                      alert('Saved homepage');
                    } else {
                      const j = await res.json();
                      alert('Save failed: ' + (j?.error || res.statusText));
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Save error');
                  }
                }}
                className="w-full px-4 py-2 bg-blue-800 rounded text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Save Page
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
              <h2 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors text-left">
                  👁️ Preview
                </button>
                <button className="w-full px-4 py-2 bg-green-900 rounded text-green-200 text-sm font-semibold hover:bg-green-800 transition-colors text-left">
                  ✓ Publish
                </button>
                <button className="w-full px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors text-left">
                  📋 Duplicate
                </button>
                <button className="w-full px-4 py-2 bg-red-900 rounded text-red-200 text-sm font-semibold hover:bg-red-800 transition-colors text-left">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>

          {/* Sections Management */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">📋 Page Sections ({sections.length})</h2>

              {/* Current Sections */}
              <div className="space-y-3 mb-6">
                {sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <div
                      key={section.id}
                      className="bg-gray-800 border border-gray-700 rounded p-4 hover:border-[#D4AF37] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={section.enabled}
                            onChange={() => toggleSection(section.id)}
                            className="w-5 h-5 rounded accent-[#D4AF37]"
                          />
                          <div>
                            <div className="font-semibold text-white">{section.name}</div>
                            <div className="text-xs text-gray-500">{section.type}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={index === 0}
                            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={index === sections.length - 1}
                            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => setEditingSection(section)}
                            className="p-2 rounded hover:bg-gray-700 transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removeSection(section.id)}
                            className="p-2 rounded hover:bg-red-900 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Add Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3">Add New Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableSectionTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => addSection(type.value)}
                      className="p-3 bg-gray-800 border border-gray-700 rounded hover:border-[#D4AF37] transition-colors text-left text-sm"
                    >
                      <div className="font-semibold text-white">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section Editor */}
            {editingSection && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Edit: {editingSection.name}</h2>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Section Title</label>
                    <input
                      type="text"
                      defaultValue={editingSection.name}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  {/* Business Form section editor */}
                  {editingSection.type === 'business_form' && (
                    <div className="mt-4 bg-gray-800 p-4 rounded">
                      <h3 className="text-sm font-bold text-white mb-3">Business Form Fields</h3>
                      <div className="space-y-2">
                        {(editingSection.fields || []).map((f, idx) => (
                          <div key={f.id} className="flex gap-2 items-center">
                            <input type="text" defaultValue={f.name} onBlur={(e) => {
                              const name = e.currentTarget.value;
                              setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, fields: (s.fields||[]).map((ff,i)=> i===idx?{...ff,name}:ff) } : s));
                            }} className="px-2 py-1 bg-gray-700 rounded text-white text-sm" />
                            <select defaultValue={f.type} onChange={(e) => {
                              const t = e.currentTarget.value as any;
                              setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, fields: (s.fields||[]).map((ff,i)=> i===idx?{...ff,type:t}:ff) } : s));
                            }} className="px-2 py-1 bg-gray-700 rounded text-white text-sm">
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="textarea">Textarea</option>
                              <option value="select">Select</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                            <label className="text-sm text-gray-300 flex items-center gap-1"><input type="checkbox" defaultChecked={f.required} onChange={(e) => {
                              const req = e.currentTarget.checked;
                              setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, fields: (s.fields||[]).map((ff,i)=> i===idx?{...ff,required:req}:ff) } : s));
                            }} /> Required</label>
                            <button onClick={() => setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, fields: (s.fields||[]).filter((_,i)=>i!==idx) } : s))} className="ml-auto text-red-400">Remove</button>
                          </div>
                        ))}

                        <div>
                          <button onClick={() => {
                            const newField: FieldDef = { id: Math.random().toString(36).slice(2,9), name: 'New Field', type: 'text', required: false };
                            setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, fields: [ ...(s.fields||[]), newField ] } : s));
                          }} className="px-3 py-1 bg-green-700 rounded text-white text-sm">Add Field</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Section Content</label>
                    <textarea
                      placeholder="Add your content here..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                      rows={5}
                    />
                  </div>

                    {/* Image management for hero/gallery sections */}
                    {(editingSection.type === 'hero' || editingSection.type === 'gallery') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Images</label>
                        <div className="flex gap-3 items-center mb-3">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleFileSelect(editingSection.id, e)}
                            className="text-sm text-gray-400"
                          />
                          <button
                            onClick={() => {
                              // trigger file dialog programmatically if needed
                              const el = document.createElement('input');
                              el.type = 'file'; el.accept = 'image/*'; el.capture = 'environment';
                              el.onchange = (ev: any) => handleFileSelect(editingSection.id, ev);
                              el.click();
                            }}
                            className="px-3 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                          >
                            Add From Device / Camera
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {(editingSection.images || []).map((img, i) => (
                            <div key={i} className="w-40 h-24 bg-gray-700 rounded overflow-hidden relative">
                              <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" />
                              <button onClick={() => removeImage(editingSection.id, i)} className="absolute top-1 right-1 bg-red-700 text-white rounded px-2 py-0.5 text-xs">Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-[#556B2F] rounded text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Cancel
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
