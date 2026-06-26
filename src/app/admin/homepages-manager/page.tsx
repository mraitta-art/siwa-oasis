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

  // Load homepages dynamically from the API
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
        fetchHomepages(); // Reload list to include the newly created page
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
        // Update local state directly
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'draft':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'archived':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-zinc-50 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-sm font-medium shadow-sm transition-all duration-200"
            >
              <span className="inline-block transition-transform group-hover:-translate-x-0.5">←</span> Admin Dashboard
            </Link>
          </div>
          <span className="text-xs text-slate-400 font-medium">Siwa Oasis Site Builder</span>
        </div>

        {/* Header Block */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Homepage Manager
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl">
              Create, configure, and customize landing pages and mini-sites. Toggle statuses, edit content structures, and preview changes in real time.
            </p>
          </div>

          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className="self-start md:self-center px-5 py-3 bg-gradient-to-r from-[#556B2F] to-[#6b8e23] hover:from-[#445625] hover:to-[#55721c] text-white font-semibold rounded-xl shadow-md shadow-emerald-900/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg font-bold leading-none">+</span> Create New Homepage
            </button>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-2 shadow-sm">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Create New Form Modal Card */}
        {showNewForm && (
          <div className="mb-10 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Configure New Homepage</h3>
              <button 
                onClick={() => setShowNewForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Page Name</label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="e.g., Hotels & Resorts, Health & Spa"
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Page Type</label>
                <select
                  value={newPageType}
                  onChange={(e) => setNewPageType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-200 text-sm font-medium"
                >
                  <option value="custom">✨ Custom Campaign</option>
                  <option value="category">📂 Category Page</option>
                  <option value="service">⚙️ Service Page</option>
                  <option value="main">🏠 Main Homepage</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHomepage}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#b89528] text-white font-semibold rounded-xl text-sm shadow-md shadow-amber-900/10 hover:shadow-lg transition-all duration-200"
              >
                Create Page
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#556B2F]/20 border-t-[#556B2F] rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium text-sm animate-pulse">Loading homepages...</p>
          </div>
        ) : homepages.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Homepages Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Create your first homepage configuration to get started building custom landing pages.</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-[#556B2F] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
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
                className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                        {homepage.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-md font-medium">
                        {getTypeLabel(homepage.type)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                      URL Slug: 
                      <span className="font-mono text-[#556B2F] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-xs">
                        {homepage.slug}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status selection pill */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-400 mr-1.5 uppercase tracking-wider">Status:</span>
                      <select
                        value={homepage.status}
                        onChange={(e) => handleStatusChange(homepage.id, e.target.value as any)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 ${getStatusBadgeStyles(homepage.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 text-center">
                  <div>
                    <div className="text-xl font-extrabold text-slate-800">{homepage.sections}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Sections</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700 py-1">{homepage.lastModified}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Last Saved</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 py-1">Active</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Integration</div>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex gap-2 flex-wrap">
                    <Link
                      href={`/admin/homepage-editor/${homepage.id}`}
                      className="px-4 py-2 bg-[#556B2F] hover:bg-[#445625] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1"
                    >
                      ✏️ Edit Sections
                    </Link>
                    <Link
                      href={`/admin/homepage-sections/${homepage.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1"
                    >
                      📋 Section Details
                    </Link>
                    <Link
                      href={`/admin/homepage-preview/${homepage.id}`}
                      className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1"
                    >
                      👁️ Real Preview
                    </Link>
                  </div>

                  <button
                    onClick={() => handleDeleteHomepage(homepage.id, homepage.name)}
                    className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-all duration-200 ml-auto flex items-center gap-1"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats footer block */}
        <div className="mt-16 border-t border-slate-200/80 pt-10">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Homepage Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-slate-900 mb-1">{homepages.length}</div>
              <div className="text-xs font-semibold text-slate-500">Total Configured</div>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-emerald-600 mb-1">
                {homepages.filter(h => h.status === 'published').length}
              </div>
              <div className="text-xs font-semibold text-slate-500">Published Live</div>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-amber-500 mb-1">
                {homepages.filter(h => h.status === 'draft').length}
              </div>
              <div className="text-xs font-semibold text-slate-500">In Draft</div>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-[#556B2F] mb-1">
                {homepages.reduce((sum, h) => sum + h.sections, 0)}
              </div>
              <div className="text-xs font-semibold text-slate-500">Combined Sections</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
