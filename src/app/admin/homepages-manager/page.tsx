'use client';

import { useState, useEffect } from 'react';
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
  const [homepages, setHomepages] = useState<Homepage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageType, setNewPageType] = useState<'main' | 'category' | 'service' | 'custom'>('custom');

  const fetchHomepages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/homepages');
      const data = await res.json();
      if (data.success) {
        setHomepages(data.homepages || []);
      } else {
        setError(data.error || 'Failed to fetch homepages');
      }
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while loading pages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepages();
  }, []);

  const handleCreateHomepage = async () => {
    if (!newPageName.trim()) return;

    try {
      setError(null);
      const generatedSlug = newPageName.trim() === 'Main Homepage' 
        ? '/' 
        : `/${newPageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

      const res = await fetch('/api/homepages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPageName,
          type: newPageType,
          slug: generatedSlug,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewPageName('');
        setShowNewForm(false);
        fetchHomepages();
      } else {
        alert('Failed to create homepage: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error creating homepage');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const res = await fetch(`/api/homepages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setHomepages(prev =>
          prev.map(p => (p.id === id ? { ...p, status: newStatus } : p))
        );
      } else {
        alert('Failed to update status: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleDeleteHomepage = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the homepage "${name}"? This will permanently delete its sections configuration file.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/homepages/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setHomepages(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Failed to delete homepage: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting homepage');
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'published':
        return 'border-emerald-350 text-emerald-800 bg-white';
      case 'draft':
        return 'border-amber-350 text-amber-800 bg-white';
      case 'archived':
        return 'border-slate-300 text-slate-500 bg-white';
      default:
        return 'border-slate-200 text-slate-600 bg-white';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'main':
        return '🏠 Main Site';
      case 'category':
        return '📂 Category Landing';
      case 'service':
        return '⚙️ Service Channel';
      case 'custom':
        return '✨ Custom Campaign';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              ← Admin Dashboard
            </Link>
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Site Builder</span>
        </div>

        {/* Header Block */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Homepage Manager
            </h1>
            <p className="text-slate-500 text-sm font-medium max-w-xl">
              Create, configure, and customize landing pages and mini-sites. All settings are saved dynamically to filesystem configuration files.
            </p>
          </div>

          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2.5 border border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white font-bold rounded-lg text-xs transition-all duration-150"
            >
              + Create New Homepage
            </button>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold bg-white">
            ⚠️ {error}
          </div>
        )}

        {/* Create New Form Card */}
        {showNewForm && (
          <div className="mb-10 border border-slate-350 rounded-xl p-6 bg-white transition-all duration-200">
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900">Configure New Homepage</h3>
              <button 
                onClick={() => setShowNewForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Page Name</label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="e.g., Hotels & Resorts, Health & Spa"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 focus:ring-0 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Page Type</label>
                <select
                  value={newPageType}
                  onChange={(e) => setNewPageType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-0 text-xs font-medium"
                >
                  <option value="custom">✨ Custom Campaign</option>
                  <option value="category">📂 Category Page</option>
                  <option value="service">⚙️ Service Page</option>
                  <option value="main">🏠 Main Homepage</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-lg text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHomepage}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-955 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Create Page
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold text-xs animate-pulse">Loading pages...</p>
          </div>
        ) : homepages.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-12 text-center bg-white">
            <div className="text-3xl mb-2">📄</div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Homepages Configured</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">Create a homepage configuration to get started building custom landing pages.</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 border border-slate-900 text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              + Create First Homepage
            </button>
          </div>
        ) : (
          /* Homepages List Grid */
          <div className="grid grid-cols-1 gap-6">
            {homepages.map((homepage) => (
              <div
                key={homepage.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-350 transition-all duration-150 flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {homepage.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 border border-slate-200 text-slate-500 rounded font-bold uppercase tracking-wider">
                        {getTypeLabel(homepage.type).split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs font-semibold">
                      URL: <span className="font-mono text-slate-700 bg-slate-50 border border-slate-150 px-1 py-0.5 rounded">{homepage.slug}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 select-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                    <select
                      value={homepage.status}
                      onChange={(e) => handleStatusChange(homepage.id, e.target.value as any)}
                      className={`px-3 py-1 rounded border text-xs font-bold cursor-pointer focus:outline-none focus:ring-0 ${getStatusBadgeStyles(homepage.status)}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5 border border-slate-150 rounded-lg p-3 text-center">
                  <div>
                    <div className="text-base font-black text-slate-800">{homepage.sections}</div>
                    <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Sections</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-600 py-0.5">{homepage.lastModified}</div>
                    <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Last Saved</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-600 py-0.5">Filesystem JSON</div>
                    <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Data Source</div>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
                  <div className="flex gap-2 flex-wrap">
                    <Link
                      href={`/admin/homepage-editor/${homepage.id}`}
                      className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all duration-150"
                    >
                      ✏️ Edit Sections
                    </Link>
                    <Link
                      href={`/admin/homepage-sections/${homepage.id}`}
                      className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all duration-150"
                    >
                      📋 Section Details
                    </Link>
                    <Link
                      href={`/admin/homepage-preview/${homepage.id}`}
                      className="px-3.5 py-1.5 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all duration-150"
                    >
                      👁️ Real Preview
                    </Link>
                  </div>

                  <button
                    onClick={() => handleDeleteHomepage(homepage.id, homepage.name)}
                    className="px-3 py-1.5 border border-slate-200 hover:border-rose-350 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg transition-all duration-150"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats footer block */}
        <div className="mt-16 border-t border-slate-200 pt-10">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Homepage Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900 mb-0.5">{homepages.length}</div>
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Configured</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900 mb-0.5">
                {homepages.filter(h => h.status === 'published').length}
              </div>
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Published Live</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900 mb-0.5">
                {homepages.filter(h => h.status === 'draft').length}
              </div>
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">In Draft</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900 mb-0.5">
                {homepages.reduce((sum, h) => sum + h.sections, 0)}
              </div>
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Combined Sections</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
