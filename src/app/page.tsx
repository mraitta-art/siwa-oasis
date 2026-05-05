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
        
        // 1. MASTER INTRO VIDEO (Pure Cinema - No Text)
        const siwaIntroVideo = {
          id: 'siwa_intro',
          type: 'youtube',
          mediaUrl: 'https://www.youtube.com/watch?v=k1nfk9KeJlU',
          title: "",
          subtitle: "",
          caption: "",
          ctaText: "",
          ctaLink: "",
          showControls: false
        };

        // 2. ELITE LOGISTICS
        const logisticsSlide = {
          id: 'service_logistics',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000',
          title: "ELITE LOGISTICS",
          subtitle: "Seamless private transitions from Cairo to the heart of the Oasis.",
          caption: "FULL SERVICE",
          ctaText: "VIEW TRANSFERS",
          ctaLink: "/logistics",
          animation: 'kenburns'
        };

        // 3. CURATED EXPEDITIONS
        const toursSlide = {
          id: 'service_tours',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=2000',
          title: "CURATED EXPEDITIONS",
          subtitle: "Narrative-driven desert safaris and salt-lake therapies.",
          caption: "DISCOVERY",
          ctaText: "EXPLORE TOURS",
          ctaLink: "/expeditions",
          animation: 'kenburns'
        };

        // 4. SIWAN CONCIERGE
        const conciergeSlide = {
          id: 'service_concierge',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1540979388789-6ece48a17499?q=80&w=2000',
          title: "SIWAN CONCIERGE",
          subtitle: "24/7 Personal assistants dedicated to your oasis mastery.",
          caption: "WE CARE",
          ctaText: "MEET YOUR GUIDE",
          ctaLink: "/concierge",
          animation: 'kenburns'
        };

        setCarouselSlides([siwaIntroVideo, logisticsSlide, toursSlide, conciergeSlide, ...manual, ...featured]);
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
      
      {/* 🏛️ ELITE NAVIGATION (Brand Signature Only) */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '3rem 4rem', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(15,23,42,0.8), transparent)' }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <i className="fas fa-sun" style={{ color: '#D4AF37', fontSize: '1.5rem' }}></i>
          <span>SIWA.<span style={{ color: '#D4AF37' }}>TODAY</span></span>
        </div>
      </nav>

      {/* 🎬 CINEMATIC HERO (Pure Cinema - No Text) */}
      <section style={{ height: '85vh', position: 'relative' }}>
        <AdvancedHeroCarousel
          slides={carouselSlides}
          height="85vh"
          autoPlay={true}
          showIndicators={true}
          showArrows={true}
        />
      </section>

      {/* 🔍 DISCOVERY DNA SEARCH (Elite Glass Redesign) */}
      <section id="discovery" style={{ 
        background: '#0a0f1d', padding: '6rem 4rem', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative Background Glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '400px', height: '400px', background: 'rgba(212,175,55,0.05)', filter: 'blur(150px)', pointerEvents: 'none' }}></div>
        
        <div style={{ 
          width: 'min(100%, 1200px)', margin: '0 auto', background: 'rgba(255,255,255,0.02)', 
          backdropFilter: 'blur(40px)', padding: '3.5rem', borderRadius: '40px', 
          border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)'
        }}>
          <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '6px', marginBottom: '1rem', textTransform: 'uppercase' }}>Architectural Search</div>
                <h2 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>DISCOVER YOUR <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4AF37' }}>SPACE</span></h2>
             </div>
             <button 
               onClick={handleSearch}
               disabled={isSearching}
               className="gold-pulse"
               style={{ 
                 background: '#D4AF37', color: '#0a0f1d', border: 'none', padding: '1.25rem 4rem', borderRadius: '16px', 
                 fontWeight: 900, cursor: 'pointer', transition: 'all 0.4s ease', fontSize: '0.9rem', letterSpacing: '2px',
                 boxShadow: '0 10px 30px rgba(212,175,55,0.3)'
               }}
             >
               {isSearching ? 'SEEKING...' : 'DISCOVER'}
             </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
             {[
               { label: 'ERA', state: 'era', options: ['Ancient', 'Traditional', 'Modern'] },
               { label: 'MATERIAL', state: 'material', options: ['Kershef', 'Stone', 'Mud'] },
               { label: 'VIBE', state: 'vibe', options: ['Spiritual', 'Adventure', 'Peaceful'] },
               { label: 'EXPERIENCE', state: 'experience', options: ['Honeymoon', 'Family', 'Nomad'] }
             ].map((f) => (
               <div key={f.state} style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, letterSpacing: '2px', display: 'block', marginBottom: '1rem' }}>{f.label}</label>
                  <select 
                    value={(filters as any)[f.state]} 
                    onChange={e => setFilters({...filters, [f.state]: e.target.value})}
                    style={{ 
                      width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', 
                      color: '#fff', padding: '0.5rem 0', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', outline: 'none',
                      appearance: 'none'
                    }}
                  >
                     <option value="" style={{ background: '#0a0f1d' }}>Any {f.label}</option>
                     {f.options.map(opt => <option key={opt} value={opt} style={{ background: '#0a0f1d' }}>{opt}</option>)}
                  </select>
                  <i className="fas fa-chevron-down" style={{ position: 'absolute', right: 0, bottom: '1rem', fontSize: '0.7rem', color: '#D4AF37', pointerEvents: 'none' }}></i>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 💎 RESULTS / FLOATING GALLERY */}
      <section id="results" style={{ padding: '12rem 4rem', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
           <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '8px', marginBottom: '2rem' }}>THE COLLECTION</div>
           <h2 style={{ fontSize: '4rem', fontWeight: 900, color: '#0a0f1d', letterSpacing: '-3px' }}>CURATED <span style={{ color: '#D4AF37' }}>LANDMARKS</span></h2>
           <div style={{ width: '60px', height: '2px', background: '#D4AF37', margin: '2rem auto' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '5rem', maxWidth: 1500, margin: '0 auto' }}>
           {(searchResults.length > 0 ? searchResults : carouselSlides.filter(s => s.id !== 'siwa_intro').slice(0, 3)).map((item: any, i: number) => {
             const name = item.name || item.title || 'Siwa Boutique';
             const image = item.mediaUrl || (item.custom_data ? Object.values(item.custom_data).find((v:any) => v.section_gallery)?.[0]?.url : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62');
             const slug = item.slug || item.id;

             return (
              <Link href={`/${slug}`} key={i} style={{ textDecoration: 'none' }} className="gallery-card-link">
                <div className="gallery-card" style={{ transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <div style={{ height: '500px', overflow: 'hidden', position: 'relative', borderRadius: '40px', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.1)' }}>
                    <img src={image} alt={name} className="card-image" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1.2s ease' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,29,0.4), transparent)' }}></div>
                    <div style={{ position: 'absolute', top: 35, right: 35, background: 'rgba(255,255,255,0.95)', color: '#0a0f1d', padding: '0.75rem 1.5rem', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '2px' }}>
                      PREMIER
                    </div>
                  </div>
                  <div style={{ padding: '2.5rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>CHAPTER 01-08</span>
                        <div style={{ flexGrow: 1, height: '1px', background: '#f1f5f9' }}></div>
                    </div>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0a0f1d', marginBottom: '1rem', letterSpacing: '-1px' }}>{name}</h3>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.8, maxWidth: '90%' }}>A narrative journey through the architectural heritage of the Siwa Oasis.</p>
                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0a0f1d', letterSpacing: '1px' }}>RESERVE EXPERIENCE</span>
                       <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem', color: '#D4AF37' }}></i>
                    </div>
                  </div>
                </div>
              </Link>
             );
           })}
        </div>

        {/* CSS INJECTIONS FOR MODERN HOVERS */}
        <style jsx global>{`
          .gallery-card:hover {
            transform: translateY(-15px);
          }
          .gallery-card:hover .card-image {
            transform: scale(1.08);
          }
          .gold-pulse:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(212,175,55,0.4);
          }
        `}</style>
      </section>

      {/* 🌍 FOOTER (Global Navigation) */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8rem 4rem', background: '#0a0f1d', color: '#fff' }}>
         <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
            <div>
               <div style={{ fontWeight: 900, letterSpacing: '8px', fontSize: '1.25rem', color: '#fff', marginBottom: '1.5rem' }}>SIWA.TODAY</div>
               <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.8 }}>The Gold Standard of Siwa Oasis Experiences. Authenticity verified through architectural heritage.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>EXPLORE</span>
               <Link href="#discovery" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Heritage DNA</Link>
               <Link href="#results" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>The Collection</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>JOURNEY</span>
               <Link href="/expeditions" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Curated Tours</Link>
               <Link href="/concierge" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Personal Concierge</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>LOGISTICS</span>
               <Link href="/logistics" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Elite Transfers</Link>
               <Link href="/desert-support" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Safari Support</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '0.5rem' }}>PARTNER WITH US</span>
               <Link href="/be-a-partner" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Become a Partner</Link>
               <Link href="/investment" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Heritage Investment</Link>
               <Link href="/admin" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Partner Login</Link>
            </div>
         </div>

         <div style={{ marginTop: '8rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px' }}>
            © {new Date().getFullYear()} SIWA.TODAY • ALL RIGHTS RESERVED.
         </div>
      </footer>
    </div>
  );
}
