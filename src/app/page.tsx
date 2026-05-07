'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import VibeSearch from '@/components/VibeSearch';

export default function Home() {
  const [carouselSlides, setCarouselSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselInterval, setCarouselInterval] = useState(8000);

  useEffect(() => {
    async function init() {
      try {
        const [manualRes, featuredRes, configRes] = await Promise.all([
          fetch('/api/jana/hero-carousel'),
          fetch('/api/discovery/featured'),
          fetch('/api/jana/hero-carousel?siteId=main_hero') // Fetching config
        ]);
        const manual = manualRes.ok ? (await manualRes.json()).slides || [] : [];
        const featured = featuredRes.ok ? (await featuredRes.json()).slides || [] : [];
        const configData = configRes.ok ? await configRes.json() : {};
        
        // Dynamic Interval from Admin
        if (configData.config?.autoPlayInterval) {
          setCarouselInterval(configData.config.autoPlayInterval);
        }

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

        setCarouselSlides([
          siwaIntroVideo, 
          logisticsSlide, 
          toursSlide, 
          conciergeSlide, 
          ...manual, 
          ...featured
        ]);
      } catch (e) { console.error('Hero init fail:', e); }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
       <i className="fas fa-sun fa-spin fa-4x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
       <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>CURATING EXPERIENCE...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      
      {/* 🏛️ ELITE NAVIGATION (Brand Signature Only) */}
      <nav style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, 
        padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem)', 
        display: 'flex', justifyContent: 'flex-start', alignItems: 'center', 
        background: 'linear-gradient(to bottom, rgba(15,23,42,0.8), transparent)' 
      }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1rem, 3vw, 1.25rem)', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <i className="fas fa-sun" style={{ color: '#D4AF37', fontSize: '1.5rem' }}></i>
          <span>SIWA.<span style={{ color: '#D4AF37' }}>TODAY</span></span>
        </div>
      </nav>

      <section style={{ height: '85vh', minHeight: '500px', position: 'relative' }}>
        <AdvancedHeroCarousel
          slides={carouselSlides}
          height="85vh"
          autoPlay={true}
          autoPlayInterval={carouselInterval}
          showIndicators={true}
          showArrows={false}
        />
      </section>

      {/* 🔍 DISCOVERY DNA SEARCH (New Dynamic Vibe Search) */}
      <section id="discovery" style={{ 
        background: '#0a0f1d', padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 4rem)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative Background Glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '400px', height: '400px', background: 'rgba(212,175,55,0.05)', filter: 'blur(150px)', pointerEvents: 'none' }}></div>
        
        <div className="container" style={{ 
          maxWidth: '1200px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', 
          backdropFilter: 'blur(40px)', padding: 'clamp(1.5rem, 5vw, 3.5rem)', borderRadius: '40px', 
          border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)'
        }}>
          <VibeSearch />
        </div>
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
               <Link href="/search/vibe" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>The Collection</Link>
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
