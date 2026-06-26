'use client';

import Link from 'next/link';
import { useState, use, useEffect } from 'react';

interface SectionData {
  id: string;
  title: string;
  type: string;
  content: string;
  items: number;
  order: number;
}

export default function HomepageSectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [sections, setSections] = useState<SectionData[]>([]);
  const [pageName, setPageName] = useState('');
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [editingSection, setEditingSection] = useState<SectionData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/homepages/${id}`);
        const data = await res.json();
        if (data.success && data.page) {
          setPageData(data.page);
          setPageName(data.page.name || 'Untitled Page');
          const mapped: SectionData[] = (data.page.sections || []).map((s: any) => ({
            id: s.id,
            title: s.name || 'Untitled Section',
            type: s.type || 'hero',
            content: s.content || '',
            items: s.items || (s.images?.length || 1),
            order: s.order || 0
          }));
          setSections(mapped.sort((a, b) => a.order - b.order));
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

  const handleSaveChanges = async (updatedSectionsList = sections) => {
    try {
      setIsSaving(true);
      const updated = updatedSectionsList.map((s, idx) => {
        const existing = (pageData?.sections || []).find((x: any) => x.id === s.id) || {};
        return {
          ...existing,
          id: s.id,
          name: s.title,
          type: s.type,
          content: s.content,
          items: s.items,
          order: idx + 1,
          enabled: existing.enabled !== undefined ? existing.enabled : true
        };
      });

      const res = await fetch(`/api/homepages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pageData,
          sections: updated
        }),
      });

      if (res.ok) {
        setPageData((prev: any) => prev ? { ...prev, sections: updated } : null);
      } else {
        alert('Failed to save layout changes.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while saving sections.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionSave = (updated: SectionData) => {
    const updatedList = sections.map(s => s.id === updated.id ? updated : s);
    setSections(updatedList);
    setEditingSection(null);
    handleSaveChanges(updatedList);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) {
      return;
    }

    const newSections = [...sections];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[swapWith]] = [newSections[swapWith], newSections[index]];
    
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    setSections(newSections);
    handleSaveChanges(newSections);
  };

  const removeSection = (sectionId: string) => {
    if (!confirm('Are you sure you want to remove this section from this page layout?')) {
      return;
    }
    const filtered = sections.filter(s => s.id !== sectionId);
    setSections(filtered);
    if (editingSection?.id === sectionId) {
      setEditingSection(null);
    }
    handleSaveChanges(filtered);
  };

  const addSection = (type: string, titleName: string) => {
    const newSec: SectionData = {
      id: Date.now().toString(),
      title: titleName,
      type: type,
      content: `Add description or custom copy for ${titleName} component here...`,
      items: 3,
      order: sections.length + 1
    };
    const updatedList = [...sections, newSec];
    setSections(updatedList);
    handleSaveChanges(updatedList);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-semibold text-xs animate-pulse">Loading page sections...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <Link href="/admin/homepages-manager" className="group text-slate-450 hover:text-slate-700 text-xs font-bold transition-colors mb-2 inline-flex items-center gap-1 uppercase tracking-wider">
              ← Homepage Manager
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Section Details</h1>
            <p className="text-slate-500 text-xs font-medium">Fine-tune elements and view details for <span className="text-slate-800 font-bold">{pageName}</span></p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/homepage-editor/${id}`}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              ✏️ Open Visual Editor
            </Link>
            <Link
              href={`/admin/homepage-preview/${id}`}
              className="px-3.5 py-1.5 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              👁️ Preview Live Content
            </Link>
          </div>
        </div>

        {/* Main Content Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sections List */}
          <div className="lg:col-span-2 space-y-4">
            {sections.length === 0 ? (
              <div className="py-12 bg-white border border-slate-200 rounded-xl text-center p-8">
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No layout sections found</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">Open the visual editor to populate sections or use template presets to get started.</p>
              </div>
            ) : (
              sections.map((section, index) => (
                <div
                  key={section.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-350 transition-all duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight mb-1">{section.title}</h3>
                      <p className="text-slate-500 text-xs font-medium max-w-lg">{section.content || 'No description provided.'}</p>
                      <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Type: <span className="text-slate-750 font-black">{section.type}</span></span>
                        <span>Items: <span className="text-slate-750 font-black">{section.items}</span></span>
                      </div>
                    </div>

                    <span className="self-start sm:self-center px-2 py-0.5 border border-slate-200 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">
                      Position {index + 1}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-3.5 border-t border-slate-100">
                    <button
                      onClick={() => setEditingSection(section)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded transition-colors"
                    >
                      ✏️ Edit Copy & Details
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded transition-colors"
                    >
                      ↑ Move Up
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === sections.length - 1}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded transition-colors"
                    >
                      ↓ Move Down
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="px-2.5 py-1.5 border border-slate-200 hover:border-rose-350 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded transition-colors ml-auto"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Quick Saves Status Indicator */}
            {isSaving && (
              <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-3.5 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Autosaving layout...
              </div>
            )}
          </div>

          {/* Section Editor & Presets (Right) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Inline Editor */}
            {editingSection ? (
              <div className="bg-white border border-slate-350 rounded-xl p-5 transition-all duration-150">
                <div className="flex items-center justify-between pb-2 mb-5 border-b border-slate-200">
                  <h2 className="text-xs font-black text-slate-900">Modify Content</h2>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Section Heading</label>
                    <input
                      type="text"
                      value={editingSection.title}
                      onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-950 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description / Paragraph</label>
                    <textarea
                      value={editingSection.content}
                      onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-950 text-xs font-medium"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Item Limit / Count</label>
                    <input
                      type="number"
                      value={editingSection.items}
                      min="1"
                      max="10"
                      onChange={(e) => setEditingSection({ ...editingSection, items: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-950 text-xs font-medium"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex gap-2.5">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="w-1/2 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-550 text-xs font-bold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSectionSave(editingSection)}
                      className="w-1/2 py-1.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Preset add template drawer */
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-4">
                  🧩 Add Preset Component
                </h2>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Hero Banner', type: 'hero', icon: '🎬' },
                    { name: 'Highlights', type: 'features', icon: '✨' },
                    { name: 'Gallery Grid', type: 'gallery', icon: '🖼️' },
                    { name: 'Reviews', type: 'testimonials', icon: '💬' },
                    { name: 'Our Team', type: 'team', icon: '👥' },
                    { name: 'FAQ Block', type: 'faq', icon: '❓' },
                    { name: 'Pricing Plans', type: 'pricing', icon: '💰' },
                    { name: 'Form / Contact', type: 'cta', icon: '🎯' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => addSection(preset.type, preset.name)}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-lg transition-all duration-150 text-center flex flex-col items-center justify-center group"
                    >
                      <div className="text-2xl mb-1 group-hover:scale-105 transition-transform duration-150">{preset.icon}</div>
                      <div className="text-[10px] font-bold text-slate-700 leading-tight">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
