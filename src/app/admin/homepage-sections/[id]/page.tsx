'use client';

import Link from 'next/link';
import { useState, use } from 'react';

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
  const [sections, setSections] = useState<SectionData[]>([
    {
      id: '1',
      title: 'Hero Section',
      type: 'hero',
      content: 'Hotels & Resorts - Main headline',
      items: 1,
      order: 1,
    },
    {
      id: '2',
      title: 'Featured Properties',
      type: 'gallery',
      content: 'Showcase 3-6 featured hotels',
      items: 5,
      order: 2,
    },
    {
      id: '3',
      title: 'Testimonials',
      type: 'testimonials',
      content: 'Guest reviews and ratings',
      items: 4,
      order: 3,
    },
  ]);

  const [editingSection, setEditingSection] = useState<SectionData | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/homepages-manager" className="text-gray-400 hover:text-[#D4AF37] transition-colors mb-4 block">
            ← Back to Homepages
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Manage Sections</h1>
          <p className="text-gray-400">Edit individual sections for Hotels & Resorts page</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sections List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div
                    key={section.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-[#D4AF37] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{section.title}</h3>
                        <p className="text-gray-400 text-sm">{section.content}</p>
                        <div className="flex gap-4 mt-3 text-sm text-gray-500">
                          <span>Type: <span className="text-[#D4AF37]">{section.type}</span></span>
                          <span>Items: <span className="text-[#D4AF37]">{section.items}</span></span>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-[#556B2F] rounded text-sm text-white font-semibold">
                        Position {section.order}
                      </span>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => setEditingSection(section)}
                        className="px-4 py-2 bg-[#556B2F] rounded text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        ✏️ Edit Content
                      </button>
                      <button className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                        🎨 Customize
                      </button>
                      <button className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                        ↑ Move Up
                      </button>
                      <button className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                        ↓ Move Down
                      </button>
                      <button className="px-4 py-2 bg-red-900 rounded text-red-200 text-sm font-semibold hover:bg-red-800 transition-colors">
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Add Section Button */}
            <button className="mt-8 px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity w-full">
              + Add New Section
            </button>
          </div>

          {/* Section Editor */}
          <div className="lg:col-span-1">
            {editingSection ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Edit Section</h2>
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
                      defaultValue={editingSection.title}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Content</label>
                    <textarea
                      defaultValue={editingSection.content}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Number of Items</label>
                    <input
                      type="number"
                      defaultValue={editingSection.items}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-700 space-y-2">
                    <button className="w-full px-4 py-2 bg-[#556B2F] rounded text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className="w-full px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-bold text-white mb-4">📊 Section Stats</h2>

                <div className="space-y-4">
                  <div className="bg-gray-800 rounded p-4 text-center">
                    <div className="text-3xl font-bold text-[#D4AF37] mb-1">{sections.length}</div>
                    <div className="text-sm text-gray-400">Total Sections</div>
                  </div>

                  <div className="bg-gray-800 rounded p-4 text-center">
                    <div className="text-3xl font-bold text-[#D4AF37] mb-1">{sections.reduce((sum, s) => sum + s.items, 0)}</div>
                    <div className="text-sm text-gray-400">Total Items</div>
                  </div>

                  <button className="w-full px-4 py-3 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors mt-6">
                    👁️ Preview Page
                  </button>

                  <button className="w-full px-4 py-3 bg-green-900 rounded text-green-200 text-sm font-semibold hover:bg-green-800 transition-colors">
                    ✓ Publish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Templates */}
        {!editingSection && (
          <div className="mt-12 border-t border-gray-800 pt-12">
            <h2 className="text-2xl font-bold text-white mb-8">Available Section Templates</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: 'Hero', icon: '🎬' },
                { name: 'Features', icon: '✨' },
                { name: 'Gallery', icon: '🖼️' },
                { name: 'Testimonials', icon: '💬' },
                { name: 'Team', icon: '👥' },
                { name: 'FAQ', icon: '❓' },
                { name: 'Pricing', icon: '💰' },
                { name: 'CTA', icon: '🎯' },
              ].map((template) => (
                <button
                  key={template.name}
                  className="p-4 bg-gray-900 border border-gray-800 rounded hover:border-[#D4AF37] transition-colors text-center"
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <div className="text-sm font-semibold text-white">{template.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
