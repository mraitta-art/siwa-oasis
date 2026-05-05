'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

/**
 * SIWA OASIS — ELITE CONCIERGE HOME PAGE
 * Invisible Excellence & DNA Discovery.
 */
export default function HomePage() {
  const [carouselSlides, setCarouselSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [filters, setFilters] = useState({
    era: '',
    material: '',
    vibe: '',
    experience: ''
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [manualRes, featuredRes] = await Promise.all([
          fetch('/api/jana/hero-carousel'),
          fetch('/api/discovery/featured')
        ]);
        const manual = manualRes.ok ? (await manualRes.json()).slides || [] : [];
        const featured = featuredRes.ok ? (await featuredRes.json()).slides || [] : [];
        
        // Ensure a high-fidelity YouTube video of Siwa is the first slide
        const siwaIntroVideo = {
          id: 'siwa_intro',
          type: 'youtube',
          mediaUrl: 'https://www.youtube.com/watch?v=kY_uAn3V8Bw', // Cinematic Siwa Intro
          title: "THE LAST AUTHENTIC OASIS",
          subtitle: "Journey into a land where time stands still and heritage breathes.",
          caption: "SIWA TODAY",
          ctaText: "BEGIN JOURNEY",
          ctaLink: "#discovery",
          showControls: false // ACTIVATES THE CINEMATIC SHIELD
        };

        setCarouselSlides([siwaIntroVideo, ...manual, ...featured]);
      } catch (e) { console.error('Hero init fail:', e); }
      setLoading(false);
    }
    init();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/discovery/search?${params.toString()}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      // Smooth scroll to results
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { console.error('Search error:', e); }
    setIsSearching(false);
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
       <i className="fas fa-sun fa-spin fa-4x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
       <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>CURATING EXPERIENCE...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      
      {/* 🏛️ ELITE NAVIGATION */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '2.5rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(15,23,42,0.8), transparent)' }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <i className="fas fa-sun" style={{ color: '#D4AF37' }}></i>
          <span>SIWA <span style={{ color: '#D4AF37' }}>TODAY</span></span>
        </div>
        <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>
              <span>EXPLORE</span>
              <span>JOURNEY</span>
              <span>LOGISTICS</span>
           </div>
           <Link href="/be-a-partner" style={{ background: '#D4AF37', color: '#1a1a2e', padding: '0.8rem 2rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, textDecoration: 'none', boxShadow: '0 10px 20px rgba(212,175,55,0.2)' }}>PARTNER WITH US</Link>
        </div>
      </nav>

      {/* 🎬 CINEMATIC HERO (Video + Multi-Images) */}
      <section style={{ height: '85vh', position: 'relative' }}>
        <AdvancedHeroCarousel
          slides={carouselSlides}
          height="85vh"
          autoPlay={true}
          showIndicators={true}
          showArrows={true}
        />
      </section>

      {/* 🔍 DISCOVERY DNA SEARCH (Positioned BELOW Hero) */}
      <section id="discovery" style={{ 
        background: '#0f172a', padding: '6rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ 
          width: 'min(100%, 1200px)', margin: '0 auto', background: 'rgba(255,255,255,0.03)', 
          padding: '3rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)'
        }}>
          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '4px', marginBottom: '0.75rem' }}>ELITE DISCOVERY</div>
                <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>FIND YOUR <span style={{ color: '#D4AF37' }}>SOUL</span> IN SIWA</h2>
             </div>
             <button 
               onClick={handleSearch}
               disabled={isSearching}
               style={{ 
                 background: '#D4AF37', color: '#1a1a2e', border: 'none', padding: '1.2rem 4.5rem', borderRadius: '14px', 
                 fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', fontSize: '0.85rem', letterSpacing: '1px'
               }}
             >
               {isSearching ? 'FINDING...' : 'DISCOVER EXPERIENCE'}
             </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
             <div className="dna-filter">
                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>HISTORICAL ERA</label>
                <select 
                  value={filters.era} 
                  onChange={e => setFilters({...filters, era: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1.1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                   <option value="">Any Era</option>
                   <option value="Ancient">Ancient Shali</option>
                   <option value="Traditional">Traditional Siwan</option>
                   <option value="Modern">Modern Luxury</option>
                </select>
             </div>
             <div className="dna-filter">
                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>CONSTRUCTION MATERIAL</label>
                <select 
                  value={filters.material} 
                  onChange={e => setFilters({...filters, material: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1.1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                   <option value="">Any Material</option>
                   <option value="Kershef">Kershef (Salt Brick)</option>
                   <option value="Stone">Limestone</option>
                   <option value="Mud">Mud/Clay</option>
                </select>
             </div>
             <div className="dna-filter">
                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>JOURNEY VIBE</label>
                <select 
                  value={filters.vibe} 
                  onChange={e => setFilters({...filters, vibe: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1.1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                   <option value="">Any Vibe</option>
                   <option value="Spiritual">Spiritual Retreat</option>
                   <option value="Adventure">Desert Adventure</option>
                   <option value="Peaceful">Peaceful Sanctuary</option>
                </select>
             </div>
             <div className="dna-filter">
                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>EXPERIENCE TYPE</label>
                <select 
                  value={filters.experience} 
                  onChange={e => setFilters({...filters, experience: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1.1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                   <option value="">Any Type</option>
                   <option value="Honeymoon">Honeymoon</option>
                   <option value="Family">Family Escape</option>
                   <option value="Nomad">Digital Nomad</option>
                </select>
             </div>
          </div>
        </div>
      </section>

      {/* 💎 RESULTS / CURATED DISCOVERY */}
      <section id="results" style={{ padding: '10rem 4rem', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
           <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '6px', marginBottom: '1.5rem' }}>CURATED DISCOVERY</div>
           <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px' }}>THE SOUL OF THE <span style={{ color: '#D4AF37' }}>OASIS</span></h2>
           <p style={{ color: '#64748b', fontSize: '1.25rem', maxWidth: '750px', margin: '2rem auto 0', lineHeight: 1.8 }}>Hand-picked Siwan establishments verified for their architectural soul and heritage excellence.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '4rem', maxWidth: 1400, margin: '0 auto' }}>
           {(searchResults.length > 0 ? searchResults : carouselSlides.filter(s => s.id !== 'siwa_intro').slice(0, 3)).map((item: any, i: number) => {
             const name = item.name || item.title || 'Siwa Boutique';
             const image = item.mediaUrl || (item.custom_data ? Object.values(item.custom_data).find((v:any) => v.section_gallery)?.[0]?.url : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62');
             const slug = item.slug || item.id;

             return (
              <Link href={`/${slug}`} key={i} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <div style={{ height: '350px', overflow: 'hidden', position: 'relative' }}>
                    <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', color: '#D4AF37', padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, border: '1px solid rgba(212,175,55,0.3)', letterSpacing: '1px' }}>
                      <i className="fas fa-crown" style={{ marginRight: '0.6rem' }}></i> PREMIER CHOICE
                    </div>
                  </div>
                  <div style={{ padding: '3rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <span style={{ background: '#f8fafc', padding: '5px 12px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>HERITAGE</span>
                        <span style={{ background: '#f8fafc', padding: '5px 12px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>TRADITIONAL</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>{name}</h3>
                    <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.8, marginBottom: '2.5rem', opacity: 0.8 }}>Explore the architectural mastery and deep silence of this Siwan landmark.</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
                       <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px' }}>EXPLORE STORY <i className="fas fa-arrow-right" style={{ marginLeft: '0.75rem' }}></i></span>
                       <div style={{ display: 'flex', gap: '-8px' }}>
                          {[1,2,3,4].map(n => <div key={n} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#94a3b8' }}><i className="fas fa-check"></i></div>)}
                       </div>
                    </div>
                  </div>
                </div>
              </Link>
             );
           })}
        </div>
      </section>

      {/* 🌍 FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6rem 4rem', textAlign: 'center', background: '#0a0f1d' }}>
         <div style={{ fontWeight: 900, letterSpacing: '12px', fontSize: '1.75rem', color: '#fff', marginBottom: '1.5rem' }}>SIWA TODAY</div>
         <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', letterSpacing: '1px' }}>The Gold Standard of Siwa Oasis Experiences.</p>
      </footer>
    </div>
  );
}
