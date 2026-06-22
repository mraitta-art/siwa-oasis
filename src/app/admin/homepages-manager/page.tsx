'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Homepage {
  id: string;
  name: string;
  slug: string;
  type: 'main' | 'category' | 'service' | 'custom';
  status: 'draft' | 'published' | 'archived';
  lastModified: string;
  sections: number;
}

export default function HomepagesManagerPage() {
  const [homepages, setHomepages] = useState<Homepage[]>([
    {
      id: '1',
      name: 'Main Homepage',
      slug: '/',
      type: 'main',
      status: 'published',
      lastModified: '2024-01-15',
      sections: 5,
    },
    {
      id: '2',
      name: 'Services Page',
      slug: '/services',
      type: 'service',
      status: 'published',
      lastModified: '2024-01-14',
      sections: 3,
    },
    {
      id: '3',
      name: 'Categories Page',
      slug: '/categories',
      type: 'category',
      status: 'published',
      lastModified: '2024-01-13',
      sections: 2,
    },
  ]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageType, setNewPageType] = useState<'main' | 'category' | 'service' | 'custom'>('custom');

  const handleCreateHomepage = () => {
    if (!newPageName) return;

    const newPage: Homepage = {
      id: Date.now().toString(),
      name: newPageName,
      slug: `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`,
      type: newPageType,
      status: 'draft',
      lastModified: new Date().toISOString().split('T')[0],
      sections: 0,
    };

    setHomepages([...homepages, newPage]);
    setNewPageName('');
    setShowNewForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-900 text-green-200';
      case 'draft':
        return 'bg-yellow-900 text-yellow-200';
      case 'archived':
        return 'bg-gray-900 text-gray-400';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'main':
        return '🏠 Main';
      case 'category':
        return '📂 Category';
      case 'service':
        return '⚙️ Service';
      case 'custom':
        return '✨ Custom';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Link href="/admin" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
              ← Admin
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Homepage Manager</h1>
          <p className="text-gray-400">Manage multiple homepages independently</p>
        </div>

        {/* Create New Button */}
        <div className="mb-8">
          {!showNewForm ? (
            <button
              onClick={() => setShowNewForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            >
              + Create New Homepage
            </button>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Create New Homepage</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Page Name</label>
                  <input
                    type="text"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="e.g., Hotels & Resorts"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Page Type</label>
                  <select
                    value={newPageType}
                    onChange={(e) => setNewPageType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="custom">Custom</option>
                    <option value="category">Category</option>
                    <option value="service">Service</option>
                    <option value="main">Main</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateHomepage}
                    className="px-6 py-2 bg-[#556B2F] rounded text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewForm(false)}
                    className="px-6 py-2 bg-gray-800 rounded text-gray-300 font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Homepages List */}
        <div className="space-y-4">
          {homepages.map((homepage) => (
            <div
              key={homepage.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-[#D4AF37] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{homepage.name}</h3>
                    <span className="text-sm text-gray-500">{getTypeLabel(homepage.type)}</span>
                  </div>
                  <p className="text-gray-400 text-sm">URL: <span className="font-mono text-[#D4AF37]">{homepage.slug}</span></p>
                </div>

                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(homepage.status)}`}>
                  {homepage.status.charAt(0).toUpperCase() + homepage.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-2xl font-bold text-[#D4AF37]">{homepage.sections}</div>
                  <div className="text-xs text-gray-400">Sections</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-sm text-gray-300">{homepage.lastModified}</div>
                  <div className="text-xs text-gray-400">Last Modified</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-sm text-gray-300">5.2k views</div>
                  <div className="text-xs text-gray-400">This week</div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Link
                  href={`/admin/homepage-editor/${homepage.id}`}
                  className="px-4 py-2 bg-[#556B2F] rounded text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  ✏️ Edit
                </Link>
                <Link
                  href={`/admin/homepage-preview/${homepage.id}`}
                  className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  👁️ Preview
                </Link>
                <Link
                  href={`/admin/homepage-sections/${homepage.id}`}
                  className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  📋 Sections
                </Link>
                <button className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                  ⚙️ Settings
                </button>
                <button className="px-4 py-2 bg-red-900 rounded text-red-200 text-sm font-semibold hover:bg-red-800 transition-colors">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-800 pt-12">
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{homepages.length}</div>
            <div className="text-gray-400">Total Homepages</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{homepages.filter(h => h.status === 'published').length}</div>
            <div className="text-gray-400">Published</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-2">{homepages.filter(h => h.status === 'draft').length}</div>
            <div className="text-gray-400">Draft</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{homepages.reduce((sum, h) => sum + h.sections, 0)}</div>
            <div className="text-gray-400">Total Sections</div>
          </div>
        </div>
      </div>
    </div>
  );
}
