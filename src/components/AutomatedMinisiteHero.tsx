'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from './AdvancedHeroCarousel';

interface AutomatedMinisiteHeroProps {
  businessName: string;
  businessLogo?: string;
  customData: any;
  activeSections: any[];
  tierFeatures?: {
    hero_automation?: boolean;
    [key: string]: any;
  };
  settings?: {
    primaryColor?: string;
    overlayOpacity?: number;
    height?: string;
    showLogoInHero?: boolean;
    carousel_autoplay?: boolean;
    carousel_interval?: number;
    showGovernanceLink?: boolean;
    governanceLabel?: string;
    governanceUrl?: string;
  };
}

export default function AutomatedMinisiteHero({
  businessName,
  businessLogo,
  customData = {},
  activeSections = [],
  tierFeatures = {},
  settings = {}
}: AutomatedMinisiteHeroProps) {
  // Lock Check
  if (!tierFeatures.hero_automation) {
    return (
      <div style={{ height: settings.height || '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <i className="fas fa-sun fa-3x" style={{ color: settings.primaryColor || '#D4AF37', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>AUTHENTIC EXPERIENCE</h2>
          <p style={{ opacity: 0.6 }}>Scroll to explore {businessName}</p>
        </div>
      </div>
    );
  }

  const slides = useMemo(() => {
    const allSlides: any[] = [];
    const primaryColor = settings.primaryColor || (settings as any).primary_color || '#D4AF37';

    activeSections.forEach(section => {
      const sectionData = customData[section.id] || {};
      // SMART FALLBACK: Look for any narrative field
      const miniBlog = sectionData.mini_blog || sectionData.section_news || sectionData.description || `Experience our unique ${section.name.toLowerCase()} DNA.`;
      const youtubeStory = sectionData.youtube_story;
      const gallery = sectionData.section_gallery || [];
      const photos = Array.isArray(gallery) ? gallery : [gallery].filter(Boolean);

      // Rule: Each section gets at least one slide. 
      if (youtubeStory) {
        allSlides.push({
          id: `${section.id}_yt`,
          type: 'youtube',
          mediaUrl: youtubeStory,
          title: "", // NO HEADER
          subtitle: miniBlog, // FULL STORY
          caption: businessName.toUpperCase(), 
          ctaText: `READ MORE`,
          ctaLink: `#${section.id}`,
          animation: 'fade'
        });
      }

      // Add photos from gallery
      photos.forEach((photo: any, idx: number) => {
        const url = typeof photo === 'object' ? photo.url : photo;
        const caption = typeof photo === 'object' ? photo.caption : '';
        
        allSlides.push({
          id: `${section.id}_img_${idx}`,
          type: 'image',
          mediaUrl: url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000', // Watermark Fallback
          title: caption || "", // Use photo caption as title
          subtitle: miniBlog, // FULL STORY
          caption: businessName.toUpperCase(), 
          ctaText: `VIEW ${section.name.toUpperCase()}`,
          ctaLink: `#${section.id}`,
          animation: 'kenburns'
        });
      });

      // Fallback slide (Total Watermark)
      if (!youtubeStory && photos.length === 0) {
        allSlides.push({
          id: `${section.id}_fallback`,
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=2000', // SIWA WATERMARK
          title: section.name,
          subtitle: miniBlog || `Welcome to our ${section.name.toLowerCase()} experience. Discover our unique story and vision in the sections below.`,
          caption: businessName.toUpperCase(),
          ctaText: 'EXPLORE',
          ctaLink: `#${section.id}`,
          animation: 'kenburns'
        });
      }
    });

    return allSlides;
  }, [customData, activeSections, businessName, settings]);

  const visual = customData.visual_dna || {};

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* 🏛️ PERMANENT PLATFORM ANCHOR (Top-Left) */}
      <Link href="/" style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(10px)',
        padding: '0.5rem 1.25rem',
        borderRadius: '50px',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.3s'
      }}>
        <i className="fas fa-sun" style={{ color: settings.primaryColor || '#D4AF37', fontSize: '1.2rem' }}></i>
        <span style={{ 
          color: '#fff', 
          fontWeight: 900, 
          fontSize: '0.8rem', 
          letterSpacing: '2px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>SIWA TODAY</span>
      </Link>

      {/* MODERN BUSINESS LOGO OVERLAY (Optional) */}
      {settings.showLogoInHero && (
        <div style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem', // Moved to right to avoid collision with master logo
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          {businessLogo ? (
            <img src={businessLogo} alt={businessName} style={{ height: '50px', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.3))' }} />
          ) : (
            <div style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '4px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              borderLeft: `3px solid ${settings.primaryColor || '#D4AF37'}`,
              paddingLeft: '1rem'
            }}>
              {businessName.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* THE CINEMATIC CAROUSEL */}
      <AdvancedHeroCarousel
        slides={slides}
        height={settings.height || '100vh'}
        autoPlay={settings.carousel_autoplay !== false}
        autoPlayInterval={settings.carousel_interval || 8000}
        showProgress={true}
        showIndicators={true}
      />

      {/* BOTTOM SCROLL INDICATOR */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        color: '#fff',
        opacity: 0.5,
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '3px',
        textAlign: 'center'
      }}>
        SCROLL TO EXPLORE STORY
        <div style={{ width: '1px', height: '40px', background: '#fff', margin: '1rem auto 0', opacity: 0.5 }}></div>
      </div>
    </div>
  );
}
