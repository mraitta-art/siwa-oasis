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
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gray-400 hover:text-[#D4AF37] transition-colors mb-4 block">
            ← Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">📋 Section Visibility Control</h1>
          <p className="text-gray-400">Manage section visibility on vendor minisites and main website</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap items-center">
          <select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Businesses</option>
            <option value="Siwa Palace Hotel">Siwa Palace Hotel</option>
            <option value="Desert Tours Co">Desert Tours Co</option>
            <option value="Restaurant Siwa">Restaurant Siwa</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Section Types</option>
            <option value="hero">Hero</option>
            <option value="features">Features</option>
            <option value="gallery">Gallery</option>
            <option value="testimonials">Testimonials</option>
            <option value="team">Team</option>
            <option value="faq">FAQ</option>
            <option value="pricing">Pricing</option>
            <option value="cta">CTA</option>
          </select>

          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Approval Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="text-gray-400 text-sm ml-auto">
            Showing {filteredSections.length} of {sections.length}
          </div>
        </div>

        {/* Sections Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Section</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Business</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Items</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Minisite</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Main Site</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Featured</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSections.map((section) => (
                <tr key={section.id} className="border-b border-gray-900 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(section.section_type)}</span>
                      <div>
                        <div className="text-white font-semibold">{section.title}</div>
                        <div className="text-xs text-gray-500">{section.items_count} items</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{section.business_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm px-2 py-1 bg-gray-800 rounded text-gray-300 capitalize">
                      {section.section_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{section.items_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMinisiteVisibility(section.id)}
                      className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                        section.visible_on_minisite
                          ? 'bg-green-900 text-green-200 hover:bg-green-800'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {section.visible_on_minisite ? '✅ Show' : '❌ Hide'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMainSiteVisibility(section.id)}
                      className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                        section.visible_on_main_site
                          ? 'bg-blue-900 text-blue-200 hover:bg-blue-800'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {section.visible_on_main_site ? '👁️ Show' : '🙈 Hide'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFeatured(section.id)}
                      className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                        section.is_featured
                          ? 'bg-[#D4AF37] text-black hover:bg-[#FFB700]'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {section.is_featured ? '⭐ Featured' : '☆ Not Featured'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          section.status === 'published'
                            ? 'bg-green-900 text-green-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}
                      >
                        {section.status}
                      </span>
                      {section.approval_status === 'pending' && (
                        <span className="text-xs px-2 py-1 rounded font-semibold bg-yellow-900 text-yellow-200">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-[#556B2F] hover:opacity-90 rounded text-white transition-opacity">
                        ✏️ Edit
                      </button>
                      {section.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveSection(section.id)}
                            className="px-3 py-1 text-xs bg-green-900 hover:bg-green-800 rounded text-green-200 transition-colors"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => rejectSection(section.id)}
                            className="px-3 py-1 text-xs bg-red-900 hover:bg-red-800 rounded text-red-200 transition-colors"
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      <button className="px-3 py-1 text-xs bg-red-900 hover:bg-red-800 rounded text-red-200 transition-colors">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats Dashboard */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">{sections.length}</div>
            <div className="text-gray-400 text-sm">Total Sections</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {sections.filter((s) => s.visible_on_minisite).length}
            </div>
            <div className="text-gray-400 text-sm">Visible on Minisite</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {sections.filter((s) => s.visible_on_main_site).length}
            </div>
            <div className="text-gray-400 text-sm">Visible on Main Site</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">
              {sections.filter((s) => s.is_featured).length}
            </div>
            <div className="text-gray-400 text-sm">Featured Sections</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {sections.filter((s) => s.approval_status === 'pending').length}
            </div>
            <div className="text-gray-400 text-sm">Pending Approval</div>
          </div>
        </div>

        {/* Control Legend */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">📖 Control Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="font-semibold text-[#D4AF37] mb-2">Minisite Visibility</div>
              <p className="text-sm text-gray-400">
                Controls whether this section appears on the vendor's mini website. They can see their own sections here.
              </p>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-2">Main Site Visibility</div>
              <p className="text-sm text-gray-400">
                Controls whether this section appears on the main website (homepages, carousels, featured sections).
              </p>
            </div>
            <div>
              <div className="font-semibold text-[#D4AF37] mb-2">Featured</div>
              <p className="text-sm text-gray-400">
                Marks this section as featured content. Featured sections get prominent placement on homepage carousels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
