'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MobileVendorDashboard() {
  const [stats, setStats] = useState({
    dnaCompletion: 85,
    activeLeads: 4,
    totalViews: '1.2k',
    lastUpdate: '2 hours ago'
  });

  const chapters = [
    { id: 'sec_1_identity', name: 'Identity', icon: 'fa-id-card', color: '#D4AF37', progress: 100 },
    { id: 'sec_2_vibe', name: 'Vibe & Design', icon: 'fa-palette', color: '#8b5cf6', progress: 90 },
    { id: 'sec_3_amenities', name: 'Amenities', icon: 'fa-swimming-pool', color: '#3b82f6', progress: 40 },
    { id: 'sec_4_cuisine', name: 'Cuisine', icon: 'fa-utensils', color: '#ef4444', progress: 100 },
    { id: 'sec_8_offers', name: 'Offers', icon: 'fa-tags', color: '#22c55e', progress: 0 },
  ];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '1.5rem', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>COMMAND CENTER</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>SIWA TODAY</h1>
        </div>
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #D4AF37', overflow: 'hidden' }}>
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </header>

      {/* QUICK STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(212,175,55,0.1)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D4AF37' }}>{stats.activeLeads}</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6, letterSpacing: '1px' }}>NEW LEADS</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.totalViews}</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6, letterSpacing: '1px' }}>SITE VIEWS</div>
        </div>
      </div>

      {/* DNA PROGRESS SECTION */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>BUSINESS DNA STATUS</h2>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#22c55e' }}>{stats.dnaCompletion}% COMPLETE</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.dnaCompletion}%`, height: '100%', background: 'linear-gradient(90deg, #D4AF37, #F59E0B)', borderRadius: '10px' }}></div>
        </div>
      </section>

      {/* ACTION GRID */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px', opacity: 0.6 }}>CHAPTER MANAGEMENT</h2>
          <i className="fas fa-ellipsis-h"></i>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {chapters.map(chapter => (
            <Link key={chapter.id} href="/jana/fast-track" style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '20px', 
                border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' 
              }}>
                <div style={{ 
                  width: '45px', height: '45px', borderRadius: '12px', background: `${chapter.color}20`, 
                  color: chapter.color, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <i className={`fas ${chapter.icon}`}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{chapter.name}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.4 }}>{chapter.progress}% Updated</div>
                </div>
                <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${chapter.progress}%`, background: chapter.color, borderRadius: '2px' }}></div>
                </div>
                <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem', opacity: 0.3 }}></i>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRIMARY MOBILE ACTIONS (STICKY FOOTER) */}
      <div style={{ 
        position: 'fixed', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', 
        display: 'flex', gap: '1rem'
      }}>
        <button style={{ 
          flex: 1, padding: '1.25rem', borderRadius: '20px', background: '#D4AF37', 
          color: '#0f172a', fontWeight: 900, border: 'none', boxShadow: '0 10px 20px rgba(212,175,55,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
        }}>
          <i className="fas fa-camera"></i> QUICK UPLOAD
        </button>
        <button style={{ 
          width: '60px', height: '60px', borderRadius: '20px', background: '#1e293b', 
          color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <i className="fas fa-globe"></i>
        </button>
      </div>

      <div style={{ height: '100px' }}></div> {/* Spacer for sticky footer */}
    </div>
  );
}
