'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Section {
  id: string;
  section_type: 'hero' | 'features' | 'gallery' | 'testimonials' | 'team' | 'faq' | 'pricing' | 'cta';
  title: string;
  business_name: string;
  business_type: string;
  status: 'draft' | 'published' | 'archived';
  approval_status: 'pending' | 'approved' | 'rejected';
  visible_on_minisite: boolean;
  visible_on_main_site: boolean;
  is_featured: boolean;
  items_count: number;
  last_modified: string;
}

export default function AdminSectionVisibilityPage() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      section_type: 'testimonials',
      title: 'Guest Reviews',
      business_name: 'Siwa Palace Hotel',
      business_type: 'hotel',
      status: 'published',
      approval_status: 'approved',
      visible_on_minisite: true,
      visible_on_main_site: true,
      is_featured: true,
      items_count: 5,
      last_modified: '2026-06-10',
    },
    {
      id: '2',
      section_type: 'gallery',
      title: 'Room Photos',
      business_name: 'Siwa Palace Hotel',
      business_type: 'hotel',
      status: 'published',
      approval_status: 'approved',
      visible_on_minisite: true,
      visible_on_main_site: false,
      is_featured: false,
      items_count: 12,
      last_modified: '2026-06-08',
    },
    {
      id: '3',
      section_type: 'features',
      title: 'Our Services',
      business_name: 'Desert Tours Co',
      business_type: 'tour_operator',
      status: 'published',
      approval_status: 'approved',
      visible_on_minisite: true,
      visible_on_main_site: true,
      is_featured: false,
      items_count: 8,
      last_modified: '2026-06-09',
    },
    {
      id: '4',
      section_type: 'team',
      title: 'Our Team',
      business_name: 'Restaurant Siwa',
      business_type: 'restaurant',
      status: 'draft',
      approval_status: 'pending',
      visible_on_minisite: false,
      visible_on_main_site: false,
      is_featured: false,
      items_count: 6,
      last_modified: '2026-06-11',
    },
    {
      id: '5',
      section_type: 'faq',
      title: 'Frequently Asked Questions',
      business_name: 'Desert Tours Co',
      business_type: 'tour_operator',
      status: 'published',
      approval_status: 'approved',
      visible_on_minisite: true,
      visible_on_main_site: true,
      is_featured: true,
      items_count: 10,
      last_modified: '2026-06-07',
    },
  ]);

  const [filterBusiness, setFilterBusiness] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');

  const filteredSections = sections.filter((sec) => {
    if (filterBusiness !== 'all' && sec.business_name !== filterBusiness) return false;
    if (filterType !== 'all' && sec.section_type !== filterType) return false;
    if (filterApproval !== 'all' && sec.approval_status !== filterApproval) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      hero: '🎬',
      features: '✨',
      gallery: '🖼️',
      testimonials: '💬',
      team: '👥',
      faq: '❓',
      pricing: '💰',
      cta: '🎯',
    };
    return icons[type] || '📋';
  };

  const toggleMinisiteVisibility = (id: string) => {
    setSections(
      sections.map((sec) =>
        sec.id === id ? { ...sec, visible_on_minisite: !sec.visible_on_minisite } : sec
      )
    );
  };

  const toggleMainSiteVisibility = (id: string) => {
    setSections(
      sections.map((sec) =>
        sec.id === id ? { ...sec, visible_on_main_site: !sec.visible_on_main_site } : sec
      )
    );
  };

  const toggleFeatured = (id: string) => {
    setSections(
      sections.map((sec) =>
        sec.id === id ? { ...sec, is_featured: !sec.is_featured } : sec
      )
    );
  };

  const approveSection = (id: string) => {
    setSections(
      sections.map((sec) =>
        sec.id === id
          ? { ...sec, approval_status: 'approved', status: 'published' }
          : sec
      )
    );
  };

  const rejectSection = (id: string) => {
    setSections(
      sections.map((sec) =>
        sec.id === id ? { ...sec, approval_status: 'rejected' } : sec
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <Link href="/admin" className="text-slate-400 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition-colors mb-4 block">
            ← Control Center
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                <span className="text-[#D4AF37]">📋</span> Section Visibility
              </h1>
              <p className="text-slate-500 text-sm">Control minisite & main website block display rules</p>
            </div>
            <Link href="/jana/sections" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 transition font-bold text-xs uppercase tracking-wider">
              Manage Section Fields
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Businesses</option>
            {Array.from(new Set(sections.map((s) => s.business_name))).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Section Types</option>
            <option value="hero">Hero Carousel</option>
            <option value="features">Experience Highlights</option>
            <option value="gallery">Gallery</option>
            <option value="testimonials">Testimonials</option>
            <option value="faq">FAQ</option>
            <option value="pricing">Pricing</option>
          </select>

          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-auto">
            Showing {filteredSections.length} of {sections.length}
          </div>
        </div>

        {/* Visibility Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm mb-12">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Section Block</th>
                  <th className="px-6 py-4 text-left">Business Name</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Size</th>
                  <th className="px-6 py-4 text-left">Minisite</th>
                  <th className="px-6 py-4 text-left">Main Portal</th>
                  <th className="px-6 py-4 text-left">Feature Pin</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSections.map((section) => (
                  <tr key={section.id} className="hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-amber-50 p-2 rounded-xl">{getTypeIcon(section.section_type)}</span>
                        <div>
                          <div className="text-slate-800 font-extrabold">{section.title}</div>
                          <div className="text-xs text-slate-400 font-semibold mt-1">Modified: {section.last_modified}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{section.business_name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {section.section_type}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {section.items_count} rows
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleMinisiteVisibility(section.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition ${
                          section.visible_on_minisite
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-400 border border-slate-200/50 hover:bg-slate-100'
                        }`}
                      >
                        {section.visible_on_minisite ? '✓ Visible' : '✗ Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleMainSiteVisibility(section.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition ${
                          section.visible_on_main_site
                            ? 'bg-blue-50 text-blue-600 border border-blue-200/50 hover:bg-blue-100'
                            : 'bg-slate-50 text-slate-400 border border-slate-200/50 hover:bg-slate-100'
                        }`}
                      >
                        {section.visible_on_main_site ? '👁️ Shown' : '🙈 Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleFeatured(section.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition ${
                          section.is_featured
                            ? 'bg-amber-100 text-[#D4AF37] border border-amber-200/50 hover:bg-amber-200/50'
                            : 'bg-slate-50 text-slate-400 border border-slate-200/50 hover:bg-slate-100'
                        }`}
                      >
                        {section.is_featured ? '⭐ Featured' : '☆ Pin'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${section.status === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-amber-50 text-amber-600 border border-amber-200/50'}`}>
                          {section.status}
                        </span>
                        {section.approval_status === 'pending' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-600 border border-amber-200/50 uppercase tracking-wider">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition">
                          ✏️ Edit
                        </button>
                        {section.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveSection(section.id)}
                              className="px-3 py-1.5 text-xs bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold transition"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => rejectSection(section.id)}
                              className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <button className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-rose-700 font-bold transition">
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">{sections.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Blocks</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 mb-1">
              {sections.filter((s) => s.visible_on_minisite).length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Minisites</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-blue-600 mb-1">
              {sections.filter((s) => s.visible_on_main_site).length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Main Site</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-[#D4AF37] mb-1">
              {sections.filter((s) => s.is_featured).length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-semibold">Featured Blocks</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="text-2xl font-black text-amber-600 mb-1">
              {sections.filter((s) => s.approval_status === 'pending').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</div>
          </div>
        </div>

        {/* Control Legend */}
        <div className="mt-12 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <span className="text-[#D4AF37]">📖</span> Control Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="font-extrabold text-slate-700 mb-2">Minisite Visibility</div>
              <p className="text-slate-400 font-semibold leading-relaxed">
                Controls whether this section block appears on the vendor's own mini website. Vendors can see and populate this.
              </p>
            </div>
            <div>
              <div className="font-extrabold text-blue-600 mb-2">Main Site Visibility</div>
              <p className="text-slate-400 font-semibold leading-relaxed">
                Controls whether this section block appears on the main homepage directories, searches, or catalog layouts.
              </p>
            </div>
            <div>
              <div className="font-extrabold text-[#D4AF37] mb-2">Featured Pin</div>
              <p className="text-slate-400 font-semibold leading-relaxed">
                Marks this section as featured content. Featured sections are pinned to the top of homepage slider categories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
