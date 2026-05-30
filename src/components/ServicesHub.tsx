'use client';

import React, { useState, useEffect } from 'react';

interface ServicePillar {
  id: string;           // matches business_types.id exactly
  name: string;
  tagline: string;
  icon: string;         // FontAwesome class
  color: string;        // icon accent colour
  image_url: string;
  search_link: string;   // → /search/vibe?category=<id>
  is_visible: boolean;
  display_order: number;
  count?: number;       // live business count (optional)
}

// Fallback data if database fails
const FALLBACK_PILLARS: ServicePillar[] = [
  {
    id: 'accommodation',
    name: 'Stay & Shelter',
    tagline: 'Desert camps, Kershef lodges, eco-retreats, and full-service hotels.',
    icon: 'fa-bed',
    color: '#8b5cf6',
    image_url: 'https://images.unsplash.com/photo-1482192505345-5852b41ade5c?q=80&w=800',
    search_link: '/search/vibe?category=accommodation',
    is_visible: true,
    display_order: 1,
  },
  {
    id: 'food',
    name: 'Food & Gastronomy',
    tagline: 'Traditional Siwan kitchens, organic date harvests, and desert-side cafés.',
    icon: 'fa-utensils',
    color: '#f59e0b',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800',
    search_link: '/search/vibe?category=food',
    is_visible: true,
    display_order: 2,
  },
  {
    id: 'adventure',
    name: 'Adventure & Safari',
    tagline: '4×4 sand sea expeditions, camel treks, and heritage walking tours.',
    icon: 'fa-compass',
    color: '#10b981',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    search_link: '/search/vibe?category=adventure',
    is_visible: true,
    display_order: 3,
  },
  {
    id: 'wellness',
    name: 'Health & Wellness',
    tagline: 'Therapeutic sand baths, mineral salt lakes, and ancient hot springs.',
    icon: 'fa-spa',
    color: '#27ae60',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
    search_link: '/search/vibe?category=wellness',
    is_visible: true,
    display_order: 4,
  },
  {
    id: 'crafts',
    name: 'Crafts & Marketplace',
    tagline: 'Siwan embroidery, handmade pottery, rock salt lamps, and local olive oil.',
    icon: 'fa-store',
    color: '#ef4444',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
    search_link: '/search/vibe?category=crafts',
    is_visible: true,
    display_order: 5,
  },
  {
    id: 'logistics',
    name: 'Transport & Logistics',
    tagline: 'Local tuk-tuks, desert equipment rental, and guided transfer services.',
    icon: 'fa-truck-moving',
    color: '#64748b',
    image_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800',
    search_link: '/search/vibe?category=logistics',
    is_visible: true,
    display_order: 6,
  },
];

export default function ServicesHub() {
  const [pillars, setPillars] = useState<ServicePillar[]>(FALLBACK_PILLARS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Fetch from database on mount
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/jana/services?visibleOnly=true');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setPillars(data);
          }
        }
      } catch (error) {
        console.warn('Failed to load services from database, using fallback:', error);
        // Use fallback data
      }
    }
    fetchServices();
  }, []);

  return (
    <div
      style={{
        padding: '6rem 0',
        background: 'linear-gradient(180deg, #0a0f1d 0%, #0f172a 100%)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '0 1.5rem' }}>
        <span
          style={{
            color: '#D4AF37',
            fontWeight: 900,
            letterSpacing: '4px',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '1rem',
          }}
        >
          COMPLETE SERVICES DIRECTORY
        </span>
        <h2
          style={{
            color: '#fff',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 900,
            margin: '0 0 1.25rem 0',
            letterSpacing: '-1px',
          }}
        >
          Everything Siwa Offers
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.4)',
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '0.95rem',
            lineHeight: 1.7,
          }}
        >
          From therapeutic salt lakes and heritage architecture to organic food cooperatives
          and nomadic desert safaris — the full living ecosystem of Siwa Oasis.
        </p>
      </div>

      {/* ── Pillar Grid ── */}
      <div
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {pillars.map((pillar) => {
          const isHovered = hoveredId === pillar.id;
          return (
            <div
              key={pillar.id}
              onClick={() => (window.location.href = pillar.search_link)}
              onMouseEnter={() => setHoveredId(pillar.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'relative',
                height: '280px',
                borderRadius: '28px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isHovered
                  ? `1px solid ${pillar.color}55`
                  : '1px solid rgba(255,255,255,0.04)',
                boxShadow: isHovered
                  ? `0 24px 60px -12px ${pillar.color}33`
                  : '0 8px 24px rgba(0,0,0,0.4)',
                transform: isHovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Background photo */}
              <img
                src={pillar.image_url}
                alt={pillar.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />

              {/* Dark gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(135deg, rgba(10,15,29,0.85) 0%, rgba(10,15,29,0.5) 100%)',
                  zIndex: 1,
                }}
              />

              {/* Accent colour bar — left edge */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: pillar.color,
                  opacity: isHovered ? 1 : 0.5,
                  transition: 'opacity 0.3s',
                  zIndex: 2,
                }}
              />

              {/* Icon badge — top right */}
              <div
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(10,15,29,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${pillar.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: pillar.color,
                  fontSize: '1.25rem',
                  zIndex: 3,
                  transition: 'background 0.3s',
                }}
              >
                <i className={`fas ${pillar.icon}`} />
              </div>

              {/* Count badge — top left, only when data available */}
              {pillar.count !== undefined && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    left: '1.75rem',
                    background: 'rgba(10,15,29,0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '50px',
                    padding: '0.3rem 0.8rem',
                    color: '#D4AF37',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    zIndex: 3,
                  }}
                >
                  {pillar.count} LISTED
                </div>
              )}

              {/* Content — bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '2rem 2rem 1.75rem 2rem',
                  zIndex: 3,
                }}
              >
                <h3
                  style={{
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    margin: '0 0 0.6rem 0',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {pillar.name}
                </h3>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    margin: '0 0 1.25rem 0',
                  }}
                >
                  {pillar.tagline}
                </p>

                {/* CTA row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      color: pillar.color,
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Browse Services
                  </span>
                  <i
                    className="fas fa-chevron-right"
                    style={{
                      color: pillar.color,
                      fontSize: '0.6rem',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <button
          onClick={() => (window.location.href = '/search/vibe')}
          style={{
            padding: '1.1rem 3rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
            borderRadius: '50px',
            fontWeight: 900,
            fontSize: '0.85rem',
            letterSpacing: '2px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.08)';
            e.currentTarget.style.borderColor = '#D4AF37';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
          }}
        >
          EXPLORE FULL DIRECTORY &nbsp;<i className="fas fa-arrow-right" />
        </button>
      </div>
    </div>
  );
}
