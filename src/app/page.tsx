'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

/**
 * SIWA OASIS — ELITE CONCIERGE HOME PAGE
 * Premium "Discovery DNA" Engine for high-end travelers.
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
        setCarouselSlides([...manual, ...featured]);
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
    } catch (e) { console.error('Search error:', e); }
    setIsSearching(false);
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
       <i className="fas fa-sun fa-spin fa-4x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
       <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>CURATING YOUR EXPERIENCE...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      
      {/* 🏛️ ELITE NAVIGATION */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '2.5rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <i className="fas fa-sun" style={{ color: '#D4AF37' }}></i>
          <span>SIWA <span style={{ color: '#D4AF37' }}>TODAY</span></span>
        </div>
        <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>
              <span>EXPLORE</span>
              <span>HERITAGE</span>
              <span>LOGISTICS</span>
           </div>
           <Link href="/be-a-partner" style={{ background: '#D4AF37', color: '#1a1a2e', padding: '0.8rem 2rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, textDecoration: 'none', boxShadow: '0 10px 20px rgba(212,175,55,0.2)' }}>PARTNER WITH US</Link>
        </div>
      </nav>

      {/* 🎬 CINEMATIC HERO */}
      <section style={{ height: '100vh', position: 'relative' }}>
        <AdvancedHeroCarousel
          slides={carouselSlides}
          height="100vh"
          autoPlay={true}
          showIndicators={true}
          showArrows={true}
        />

        {/* 🔍 DISCOVERY DNA SEARCH (Floating) */}
        <div style={{ 
          position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 100, 
          width: 'min(90%, 1100px)', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(30px)', 
          padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)'
        }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>DISCOVERY DNA</div>
                <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>FIND YOUR <span style={{ color: '#D4AF37' }}>SOUL</span> IN SIWA</h2>
             </div>
             <button 
               onClick={handleSearch}
               disabled={isSearching}
               style={{ 
                 background: '#D4AF37', color: '#1a1a2e', border: 'none', padding: '1rem 3rem', borderRadius: '12px', 
                 fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s' 
               }}
             >
               {isSearching ? 'FINDING...' : 'DISCOVER EXPERIENCE'}
             </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
             {/* ERA FILTER */}
             <div className="dna-filter">
                <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>HISTORICAL ERA</label>
                <select 
                  value={filters.era} 
                  onChange={e => setFilters({...filters, era: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                   <option value="">Any Era</option>
                   <option value="Ancient">Ancient Shali</option>
                   <option value="Traditional">Traditional Siwan</option>
                   <option value="Modern">Modern Luxury</option>
                </select>
             </div>
             {/* MATERIAL FILTER */}
             <div className="dna-filter">
                <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>CONSTRUCTION MATERIAL</label>
                <select 
                  value={filters.material} 
                  onChange={e => setFilters({...filters, material: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                   <option value="">Any Material</option>
                   <option value="Kershef">Kershef (Salt Brick)</option>
                   <option value="Stone">Limestone</option>
                   <option value="Mud">Mud/Clay</option>
                </select>
             </div>
             {/* VIBE FILTER */}
             <div className="dna-filter">
                <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>JOURNEY VIBE</label>
                <select 
                  value={filters.vibe} 
                  onChange={e => setFilters({...filters, vibe: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                   <option value="">Any Vibe</option>
                   <option value="Spiritual">Spiritual Retreat</option>
                   <option value="Adventure">Desert Adventure</option>
                   <option value="Peaceful">Peaceful Sanctuary</option>
                </select>
             </div>
             {/* EXPERIENCE FILTER */}
             <div className="dna-filter">
                <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>EXPERIENCE TYPE</label>
                <select 
                  value={filters.experience} 
                  onChange={e => setFilters({...filters, experience: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}
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
      <section style={{ padding: '8rem 4rem', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
           <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '5px', marginBottom: '1rem' }}>PREMIER COLLECTION</div>
           <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a' }}>THE SOUL OF THE <span style={{ color: '#D4AF37' }}>OASIS</span></h2>
           <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '700px', margin: '1.5rem auto 0' }}>Discover hand-picked establishments that define the Siwan Gold Standard.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '3rem', maxWidth: 1400, margin: '0 auto' }}>
           {(searchResults.length > 0 ? searchResults : carouselSlides.slice(0, 3)).map((item: any, i: number) => {
             const name = item.name || item.title || 'Siwa Boutique';
             const image = item.mediaUrl || (item.custom_data ? Object.values(item.custom_data).find((v:any) => v.section_gallery)?.[0]?.url : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62');
             const slug = item.slug || item.id;

             return (
              <Link href={`/${slug}`} key={i} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', transition: 'all 0.4s' }}>
                  <div style={{ height: '320px', overflow: 'hidden', position: 'relative' }}>
                    <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 25, right: 25, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)', color: '#D4AF37', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 900, border: '1px solid rgba(212,175,55,0.3)' }}>
                      <i className="fas fa-crown" style={{ marginRight: '0.5rem' }}></i> PREMIER CHOICE
                    </div>
                  </div>
                  <div style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>HERITAGE</span>
                        <span style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>TRADITIONAL</span>
                    </div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>{name}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>Experience the absolute silence and architectural mastery of this Siwa Oasis landmark.</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#D4AF37' }}>EXPLORE CHAPTERS <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></span>
                       <div style={{ display: 'flex', gap: '-5px' }}>
                          {[1,2,3,4].map(n => <div key={n} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f1f5f9', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8' }}><i className="fas fa-check"></i></div>)}
                       </div>
                    </div>
                  </div>
                </div>
              </Link>
             );
           })}
        </div>
      </section>

      {/* 🏛️ THE 8 GOLD STANDARDS (Showing "We Care") */}
      <section style={{ padding: '8rem 4rem', background: '#0f172a', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
             <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '5px', marginBottom: '1.5rem' }}>THE SIWA STANDARD</div>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem', lineHeight: 1.1 }}>WE CARE ABOUT EVERY <span style={{ color: '#D4AF37' }}>DETAIL</span></h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.6, lineHeight: 1.8, marginBottom: '3rem' }}>
                  Our platform is built on an immutable 8-chapter governance framework. We don't just list businesses; we curate their DNA. From the era of construction to the salt-density of the walls, we ensure your experience is authentic.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                   <div>
                      <h4 style={{ color: '#D4AF37', fontWeight: 900, marginBottom: '1rem' }}>Heritage Control</h4>
                      <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Verified historical eras and materials for every establishment.</p>
                   </div>
                   <div>
                      <h4 style={{ color: '#D4AF37', fontWeight: 900, marginBottom: '1rem' }}>Full Service</h4>
                      <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Integrated logistics and 24/7 Siwan concierge support.</p>
                   </div>
                </div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[
                  { n: 'IDENTITY', i: 'fa-landmark' },
                  { n: 'AMBIENCE', i: 'fa-sun' },
                  { n: 'SERVICES', i: 'fa-hotel' },
                  { n: 'FACILITIES', i: 'fa-swimming-pool' },
                  { n: 'CONTACTS', i: 'fa-wifi' },
                  { n: 'GEOGRAPHY', i: 'fa-map-marked-alt' },
                  { n: 'INVESTMENT', i: 'fa-chart-line' },
                  { n: 'OFFERS', i: 'fa-tags' }
                ].map((s, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                     <i className={`fas ${s.i}`} style={{ fontSize: '1.5rem', color: '#D4AF37', marginBottom: '1rem' }}></i>
                     <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '2px' }}>{s.n}</div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* 🌍 FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5rem 4rem', textAlign: 'center' }}>
         <div style={{ fontWeight: 900, letterSpacing: '10px', fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>SIWA TODAY</div>
         <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>The Gold Standard of Siwa Oasis Governance & Storytelling.</p>
      </footer>
    </div>
  );
}
