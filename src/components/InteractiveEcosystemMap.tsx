'use client';

import React, { useState } from 'react';

interface MapNode {
  id: string;
  name: string;
  category: string;
  x: number; // SVG coordinates
  y: number;
  description: string;
  statLabel: string;
  statValue: string;
  link: string;
  icon: string;
}

export default function InteractiveEcosystemMap({ title, subtitle }: { title?: string; subtitle?: string }) {
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);

  const nodes: MapNode[] = [
    {
      id: 'shali',
      name: 'Shali Fortress',
      category: 'Heritage & Culture',
      x: 480,
      y: 280,
      description: 'The ancient 13th-century clay fortress built from Kershef (salt bricks). Walk its labyrinthine mud walls and historical relics.',
      statLabel: 'CONSTRUCTION ERA',
      statValue: '1200s AD',
      link: '/search/vibe?q=shali',
      icon: 'fa-landmark'
    },
    {
      id: 'salt-lakes',
      name: 'Saline Therapeutic Lakes',
      category: 'Wellness & Healing',
      x: 720,
      y: 190,
      description: 'Extremely high-density hyper-salinity salt pools. Float effortlessly and soak in natural minerals that rejuvenate the skin.',
      statLabel: 'SALINITY DENSITY',
      statValue: '95% Pure Salt',
      link: '/search/vibe?q=salt',
      icon: 'fa-water'
    },
    {
      id: 'cleopatra',
      name: 'Cleopatra\'s Pool',
      category: 'Healing Springs',
      x: 580,
      y: 350,
      description: 'The legendary natural thermal spring pool where Queen Cleopatra allegedly swam. Features bubbling natural stone-filtered water.',
      statLabel: 'WATER TEMP',
      statValue: '29°C Stable',
      link: '/search/vibe?q=cleopatra',
      icon: 'fa-swimming-pool'
    },
    {
      id: 'amellal',
      name: 'Adrere Amellal Eco-Retreat',
      category: 'Eco-Luxury Lodging',
      x: 230,
      y: 240,
      description: 'The world-famous eco-lodge built directly into the white mountain. Operates completely without electricity to preserve desert silence.',
      statLabel: 'CARBON EMISSIONS',
      statValue: 'Net Zero',
      link: '/search/vibe?q=lodge',
      icon: 'fa-leaf'
    },
    {
      id: 'orchards',
      name: 'Organic Date & Olive Orchards',
      category: 'Agriculture & Food',
      x: 350,
      y: 380,
      description: 'Generations of family-owned orchards harvesting organic Siwan dates and premium cold-pressed olive oils using ancient irrigation.',
      statLabel: 'ORGANIC STATUS',
      statValue: '100% Certified',
      link: '/search/vibe?q=date',
      icon: 'fa-seedling'
    }
  ];

  return (
    <div style={{ padding: '6rem 0', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '4px', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>
            {subtitle || 'GEOGRAPHIC LAYOUT'}
          </span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 900, margin: 0 }}>
            {title || 'Interactive Ecosystem Map'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '1.25rem', maxWidth: '650px', margin: '1.25rem auto 0 auto', lineHeight: 1.6 }}>
            Hover or click geographical milestones on our lightweight Oasis render to view real-time ecological indices, salinity indexes, and thermal values.
          </p>
        </div>

        {/* Map Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', position: 'relative' }}>
          
          {/* Map canvas */}
          <div style={{ 
            position: 'relative', 
            background: 'rgba(10,15,29,0.5)', 
            borderRadius: '40px',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)',
            padding: '1rem'
          }}>
            
            {/* SVG Illustration Container */}
            <svg 
              viewBox="0 0 1000 500" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                background: '#0a0f1d', 
                borderRadius: '30px'
              }}
            >
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Stylized Lakes */}
              <path d="M 680,180 Q 720,130 780,180 T 880,190 T 700,230 Z" fill="rgba(30, 144, 255, 0.05)" stroke="rgba(30, 144, 255, 0.2)" strokeWidth="2" strokeDasharray="5,5" />
              <path d="M 540,330 Q 580,310 610,340 T 640,360 T 560,370 Z" fill="rgba(30, 144, 255, 0.05)" stroke="rgba(30, 144, 255, 0.2)" strokeWidth="1" />

              {/* Desert Roads / Paths */}
              <path d="M 200,240 Q 350,260 480,280 T 720,190" fill="none" stroke="rgba(212, 175, 55, 0.04)" strokeWidth="3" strokeDasharray="10,5" />
              <path d="M 480,280 Q 530,300 580,350 T 350,380" fill="none" stroke="rgba(212, 175, 55, 0.04)" strokeWidth="2" strokeDasharray="10,5" />

              {/* Oasis Vegetation Blocks (Orchards) */}
              <circle cx="350" cy="380" r="45" fill="rgba(16, 185, 129, 0.03)" />
              <circle cx="390" cy="390" r="30" fill="rgba(16, 185, 129, 0.02)" />

              {/* Node Hotspots */}
              {nodes.map(n => {
                const isActive = activeNode?.id === n.id;
                return (
                  <g 
                    key={n.id} 
                    transform={`translate(${n.x}, ${n.y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseOver={() => setActiveNode(n)}
                    onClick={() => setActiveNode(n)}
                  >
                    {/* Ripple Rings */}
                    <circle r={isActive ? 24 : 14} fill="rgba(212, 175, 55, 0.08)" style={{ transition: 'all 0.3s' }} />
                    <circle r={isActive ? 16 : 9} fill="rgba(212, 175, 55, 0.15)" style={{ transition: 'all 0.3s' }} />
                    
                    {/* Core Anchor Node */}
                    <circle r="5" fill="#D4AF37" />

                    {/* Node Text Label */}
                    <text 
                      y="-25" 
                      textAnchor="middle" 
                      fill={isActive ? '#fff' : 'rgba(255,255,255,0.4)'} 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 900, 
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        transition: 'fill 0.3s'
                      }}
                    >
                      {n.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Float Info Glass Overlay (Absolute) */}
            {activeNode && (
              <div 
                className="animate-in"
                style={{
                  position: 'absolute',
                  bottom: '2rem',
                  left: '2rem',
                  right: '2rem',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  padding: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  zIndex: 10
                }}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    {activeNode.category}
                  </span>
                  <h4 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
                    {activeNode.name}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
                    {activeNode.description}
                  </p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.5rem', 
                  borderLeft: '1px solid rgba(255,255,255,0.1)', 
                  paddingLeft: '1.5rem' 
                }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '1px' }}>{activeNode.statLabel}</span>
                    <strong style={{ display: 'block', fontSize: '1.25rem', color: '#D4AF37', fontWeight: 900, marginTop: '2px' }}>{activeNode.statValue}</strong>
                  </div>

                  <button
                    onClick={() => window.location.href = activeNode.link}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#D4AF37',
                      color: '#0a0f1d',
                      border: 'none',
                      borderRadius: '50px',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    EXPLORE DATA
                  </button>
                </div>
              </div>
            )}

          </div>
          
        </div>

      </div>
    </div>
  );
}
