'use client';

import React from 'react';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import VibeSearch from '@/components/VibeSearch';

export default function GlobalExperienceSearchPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '10rem' }}>
      
      {/* 1. CINEMATIC CAROUSEL (Always at the top) */}
      <AdvancedHeroCarousel 
        carouselName="main_hero" 
        height="85vh" 
        autoPlay={true} 
      />

      {/* 2. DYNAMIC VIBE SEARCH (Interaction Layer) */}
      <div className="container" style={{ marginTop: '-6rem', position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.9)', 
          backdropFilter: 'blur(30px)', 
          padding: '4rem', 
          borderRadius: '40px', 
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)', 
          border: '1px solid rgba(255,255,255,0.8)' 
        }}>
          <VibeSearch />
        </div>
      </div>

    </div>
  );
}
