'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface HomepageSection {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'editable' | 'partial' | 'hardcoded';
  managerPath?: string;
  color: string;
}

const HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'hero-carousel',
    name: 'Hero Carousel',
    description: 'Full-screen carousel with slides, overlays, and CTAs',
    icon: 'fa-images',
    status: 'editable',
    managerPath: '/jana/hero-carousel',
    color: '#D4AF37',
  },
  {
    id: 'services-hub',
    name: 'Services Hub',
    description: 'Six service pillars: Accommodation, Food, Adventure, Wellness, Crafts, Logistics',
    icon: 'fa-server-group',
    status: 'editable',
    managerPath: '/jana/services-manager',
    color: '#8b5cf6',
  },
  {
    id: 'experience-categories',
    name: 'Experience Categories',
    description: 'Four discovery categories: Wellness, Slow Food, Crafts, Safaris',
    icon: 'fa-mountain-city',
    status: 'editable',
    managerPath: '/jana/experience-categories-manager',
    color: '#10b981',
  },
  {
    id: 'search-bar',
    name: 'Vibe Search Bar',
    description: 'Discovery search with filters and AI recommendations',
    icon: 'fa-search',
    status: 'hardcoded',
    color: '#f59e0b',
  },
  {
    id: 'blog',
    name: 'Blog Section',
    description: 'Featured blog posts and content showcase',
    icon: 'fa-newspaper',
    status: 'editable',
    managerPath: '/jana/blog',
    color: '#ef4444',
  },
  {
    id: 'journey-planner',
    name: 'Smart Journey Planner',
    description: 'Interactive trip planning tool with curated multi-day journey templates',
    icon: 'fa-route',
    status: 'editable',
    managerPath: '/jana/journey-templates-manager',
    color: '#06b6d4',
  },
  {
    id: 'ecosystem-map',
    name: 'Ecosystem Map',
    description: 'Interactive map visualization of Siwa ecosystem',
    icon: 'fa-map',
    status: 'hardcoded',
    color: '#8b5cf6',
  },
  {
    id: 'local-products',
    name: 'Local Products Showcase',
    description: 'Featured products and local crafts',
    icon: 'fa-store',
    status: 'hardcoded',
    color: '#ec4899',
  },
  {
    id: 'storytelling',
    name: 'Storytelling Section',
    description: 'Heritage narratives and cultural stories',
    icon: 'fa-book',
    status: 'hardcoded',
    color: '#a78bfa',
  },
  {
    id: 'partner-cta',
    name: 'Partner CTA',
    description: 'Call-to-action for vendor partnerships',
    icon: 'fa-handshake',
    status: 'hardcoded',
    color: '#64748b',
  },
];

export default function HomepageEditor() {
  const [sections, setSections] = useState<HomepageSection[]>(HOMEPAGE_SECTIONS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'editable' | 'hardcoded'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = sections.filter(section => {
    const matchesStatus = filterStatus === 'all' || section.status === filterStatus;
    const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          section.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const editableSections = sections.filter(s => s.status === 'editable');
  const hardcodedSections = sections.filter(s => s.status === 'hardcoded');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'editable':
        return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '✓ Editable', icon: 'fa-check-circle' };
      case 'partial':
        return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '⚠ Partial', icon: 'fa-exclamation-circle' };
      case 'hardcoded':
        return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '🔒 Hardcoded', icon: 'fa-lock' };
      default:
        return { bg: 'rgba(100,116,139,0.1)', color: '#64748b', label: 'Unknown', icon: 'fa-question-circle' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '2rem' }}>
      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#D4AF37', fontWeight: 900 }}>Homepage Editor</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
              Manage all homepage sections in one place
            </p>
          </div>
          <Link
            href="/jana/website"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <i className="fas fa-palette" />
            Visual Orchestrator
          </Link>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                FULLY EDITABLE
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>
                {editableSections.length}/10
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                sections have admin UI
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                STILL HARDCODED
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>
                {hardcodedSections.length}/10
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                sections need dev work
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                COMPLETION
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37' }}>
                {Math.round((editableSections.length / 10) * 100)}%
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                of homepage is editable
              </p>
            </div>
          </div>
          {/* Progress bar visual */}
          <div style={{ height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, #10b981 0%, #D4AF37 100%)`,
                width: `${(editableSections.length / 10) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            />
            <i
              className="fas fa-search"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { label: 'All', value: 'all' as const },
              { label: 'Editable', value: 'editable' as const },
              { label: 'Hardcoded', value: 'hardcoded' as const },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: filterStatus === value ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                  color: filterStatus === value ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredSections.map((section) => {
            const statusBadge = getStatusBadge(section.status);
            return (
              <div
                key={section.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: section.managerPath ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  if (section.managerPath) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = section.color;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                {/* Status Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem 0.75rem',
                    background: statusBadge.bg,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: statusBadge.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <i className={`fas ${statusBadge.icon}`} />
                  {statusBadge.label}
                </div>

                {/* Icon */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: section.color + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color: section.color,
                    }}
                  >
                    <i className={`fas ${section.icon}`} />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
                  {section.name}
                </h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {section.description}
                </p>

                {/* Action Button */}
                {section.managerPath ? (
                  <Link
                    href={section.managerPath}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      background: section.color + '20',
                      color: section.color,
                      border: `1px solid ${section.color}40`,
                      borderRadius: '6px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = section.color + '40';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = section.color + '20';
                    }}
                  >
                    ✏️ Edit {section.name.split(' ')[0]}
                  </Link>
                ) : (
                  <button
                    disabled
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      cursor: 'not-allowed',
                      opacity: 0.6,
                    }}
                  >
                    🔒 Coming Soon
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredSections.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.5)' }}>
            <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }} />
            <p>No sections found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
