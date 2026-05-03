// Enhanced Carousel Integration System - User-Friendly Carousel Components
// This file provides easy-to-use carousel components with multiple layout options
// Note: Inline styles are intentional for portable, self-contained components
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState, useEffect } from 'react';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CarouselSlide {
  id: string;
  type: 'image' | 'youtube' | 'video';
  mediaUrl: string;
  title: string;
  subtitle: string;
  caption?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaType?: 'page' | 'search' | 'external' | 'custom';
  overlayOpacity?: number;
  animation?: 'fade' | 'zoom' | 'slide' | 'kenburns';
  transitionDuration?: number;
}

export interface CarouselConfig {
  // Basic Settings
  id?: string;
  layout: 'hero' | 'compact' | 'thumbnail' | 'minimal' | 'fullscreen' | 'card';
  
  // Slide Data
  slides: CarouselSlide[];
  loadFromAPI?: boolean;
  apiEndpoint?: string;
  
  // Display Options
  showIndicators: boolean;
  showArrows: boolean;
  showProgress: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showCaption: boolean;
  showCTA: boolean;
  
  // Behavior Settings
  autoPlay: boolean;
  autoPlayInterval: number;
  pauseOnHover: boolean;
  infiniteLoop: boolean;
  
  // Layout Settings
  height: string;
  transitionDuration: number;
  transitionType: 'fade' | 'slide' | 'zoom' | 'kenburns';
  
  // Styling
  overlayOpacity: number;
  overlayGradient: string;
  backgroundColor: string;
  textColor: string;
  titleSize: string;
  subtitleSize: string;
  borderRadius: number;
  padding: string;
  
  // Content
  title?: string;
  subtitle?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch carousel slides from API
 */
export async function fetchCarouselSlides(endpoint: string = '/api/jana/hero-carousel'): Promise<CarouselSlide[]> {
  try {
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      return data.slides || [];
    }
  } catch (error) {
    console.error('Failed to fetch carousel slides:', error);
  }
  return [];
}

/**
 * Extract YouTube video ID from URL
 * Note: This is also available in YouTubeFacade.tsx
 * Keeping local copy to avoid dependency coupling
 */
export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Create a sample slide for demonstration
 */
export function createSampleSlide(
  id: string,
  type: 'image' | 'youtube' | 'video' = 'image',
  mediaUrl: string = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
  title: string = 'Sample Slide',
  subtitle: string = 'Sample subtitle text'
): CarouselSlide {
  return {
    id,
    type,
    mediaUrl,
    title,
    subtitle,
    overlayOpacity: 0.5,
    animation: 'fade',
    transitionDuration: 1200
  };
}

// ============================================================================
// CAROUSEL LAYOUT COMPONENTS
// ============================================================================

// 1. Hero Carousel - Full-width dramatic hero
function HeroCarouselLayout({ config }: { config: CarouselConfig }) {
  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: `${config.borderRadius}px`, overflow: 'hidden' }}>
      <AdvancedHeroCarousel
        slides={config.slides}
        autoPlayInterval={config.autoPlayInterval}
        showIndicators={config.showIndicators}
        showArrows={config.showArrows}
        showProgress={config.showProgress}
        height={config.height}
        transitionDuration={config.transitionDuration}
      />
    </div>
  );
}

// 2. Compact Carousel - Smaller, contained
function CompactCarouselLayout({ config }: { config: CarouselConfig }) {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      borderRadius: `${config.borderRadius}px`, 
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
    }}>
      <AdvancedHeroCarousel
        slides={config.slides}
        autoPlayInterval={config.autoPlayInterval}
        showIndicators={config.showIndicators}
        showArrows={config.showArrows}
        showProgress={config.showProgress}
        height={config.height}
        transitionDuration={config.transitionDuration}
      />
    </div>
  );
}

// 3. Thumbnail Carousel - With thumbnail navigation
function ThumbnailCarouselLayout({ config }: { config: CarouselConfig }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: config.padding }}>
      {/* Main Carousel */}
      <div style={{ 
        borderRadius: `${config.borderRadius}px`, 
        overflow: 'hidden',
        marginBottom: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
      }}>
        <AdvancedHeroCarousel
          slides={config.slides}
          autoPlayInterval={config.autoPlayInterval}
          showIndicators={false}
          showArrows={config.showArrows}
          showProgress={config.showProgress}
          height={config.height}
          transitionDuration={config.transitionDuration}
        />
      </div>
      
      {/* Thumbnails */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.5rem' }}>
        {config.slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(index)}
            style={{
              flexShrink: 0,
              width: '120px',
              height: '80px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: currentIndex === index ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              opacity: currentIndex === index ? 1 : 0.6
            }}
          >
            <img 
              src={slide.mediaUrl} 
              alt={slide.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// 4. Minimal Carousel - Clean, simple
function MinimalCarouselLayout({ config }: { config: CarouselConfig }) {
  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto',
      borderRadius: `${config.borderRadius}px`, 
      overflow: 'hidden'
    }}>
      <AdvancedHeroCarousel
        slides={config.slides}
        autoPlayInterval={config.autoPlayInterval}
        showIndicators={config.showIndicators}
        showArrows={config.showArrows}
        showProgress={false}
        height={config.height}
        transitionDuration={config.transitionDuration}
      />
    </div>
  );
}

// 5. Fullscreen Carousel - Edge to edge
function FullscreenCarouselLayout({ config }: { config: CarouselConfig }) {
  return (
    <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', position: 'relative' }}>
      <AdvancedHeroCarousel
        slides={config.slides}
        autoPlayInterval={config.autoPlayInterval}
        showIndicators={config.showIndicators}
        showArrows={config.showArrows}
        showProgress={config.showProgress}
        height={config.height}
        transitionDuration={config.transitionDuration}
      />
    </div>
  );
}

// 6. Card Carousel - Inside a card container
function CardCarouselLayout({ config }: { config: CarouselConfig }) {
  return (
    <div style={{
      background: config.backgroundColor,
      borderRadius: `${config.borderRadius}px`,
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0'
    }}>
      {config.title && (
        <h2 style={{ 
          fontSize: config.titleSize, 
          fontWeight: 900, 
          color: config.textColor,
          marginBottom: config.subtitle ? '0.5rem' : '1.5rem'
        }}>
          {config.title}
        </h2>
      )}
      {config.subtitle && (
        <p style={{ 
          fontSize: config.subtitleSize, 
          color: '#64748b',
          marginBottom: '1.5rem'
        }}>
          {config.subtitle}
        </p>
      )}
      <div style={{ 
        borderRadius: `${config.borderRadius}px`, 
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <AdvancedHeroCarousel
          slides={config.slides}
          autoPlayInterval={config.autoPlayInterval}
          showIndicators={config.showIndicators}
          showArrows={config.showArrows}
          showProgress={config.showProgress}
          height={config.height}
          transitionDuration={config.transitionDuration}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EASY CAROUSEL COMPONENT
// ============================================================================

export function EasyCarouselSection({ 
  preset, 
  slides = [],
  title,
  subtitle,
  loadFromAPI = false,
  autoPlayInterval,
  height
}: { 
  preset: keyof typeof carouselPresets; 
  slides?: CarouselSlide[];
  title?: string;
  subtitle?: string;
  loadFromAPI?: boolean;
  autoPlayInterval?: number;
  height?: string;
}) {
  const [fetchedSlides, setFetchedSlides] = useState<CarouselSlide[]>(slides);
  const [loading, setLoading] = useState(loadFromAPI && !slides.length);
  
  const presetConfig = carouselPresets[preset];
  
  useEffect(() => {
    if (loadFromAPI && !slides.length) {
      fetchCarouselSlides(presetConfig.apiEndpoint).then(fetched => {
        setFetchedSlides(fetched);
        setLoading(false);
      });
    }
  }, [loadFromAPI, slides.length, presetConfig.apiEndpoint]);

  if (loading) {
    return (
      <div style={{ 
        background: presetConfig.backgroundColor, 
        padding: presetConfig.padding,
        textAlign: 'center'
      }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p style={{ color: '#64748b' }}>Loading carousel...</p>
      </div>
    );
  }

  if (!fetchedSlides.length) {
    return null;
  }

  const config: CarouselConfig = {
    ...presetConfig,
    slides: fetchedSlides,
    title: title || presetConfig.title,
    subtitle: subtitle || presetConfig.subtitle,
    autoPlayInterval: autoPlayInterval || presetConfig.autoPlayInterval,
    height: height || presetConfig.height
  };

  switch (presetConfig.layout) {
    case 'hero':
      return <HeroCarouselLayout config={config} />;
    case 'compact':
      return <CompactCarouselLayout config={config} />;
    case 'thumbnail':
      return <ThumbnailCarouselLayout config={config} />;
    case 'minimal':
      return <MinimalCarouselLayout config={config} />;
    case 'fullscreen':
      return <FullscreenCarouselLayout config={config} />;
    case 'card':
      return <CardCarouselLayout config={config} />;
    default:
      return <HeroCarouselLayout config={config} />;
  }
}

// ============================================================================
// FULL CONTROL CAROUSEL COMPONENT
// ============================================================================

export function AdvancedCarouselSection({ config }: { config: CarouselConfig }) {
  const [slides, setSlides] = useState<CarouselSlide[]>(config.slides);
  const [loading, setLoading] = useState(config.loadFromAPI && !config.slides.length);
  
  useEffect(() => {
    if (config.loadFromAPI) {
      fetchCarouselSlides(config.apiEndpoint).then(fetched => {
        setSlides(fetched);
        setLoading(false);
      });
    }
  }, [config.loadFromAPI, config.slides.length, config.apiEndpoint]);

  if (loading) {
    return (
      <div style={{ 
        background: config.backgroundColor, 
        padding: config.padding,
        textAlign: 'center'
      }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p style={{ color: '#64748b' }}>Loading carousel...</p>
      </div>
    );
  }

  if (!slides.length) {
    return null;
  }

  const finalConfig: CarouselConfig = {
    ...config,
    slides
  };

  switch (config.layout) {
    case 'hero':
      return <HeroCarouselLayout config={finalConfig} />;
    case 'compact':
      return <CompactCarouselLayout config={finalConfig} />;
    case 'thumbnail':
      return <ThumbnailCarouselLayout config={finalConfig} />;
    case 'minimal':
      return <MinimalCarouselLayout config={finalConfig} />;
    case 'fullscreen':
      return <FullscreenCarouselLayout config={finalConfig} />;
    case 'card':
      return <CardCarouselLayout config={finalConfig} />;
    default:
      return <HeroCarouselLayout config={finalConfig} />;
  }
}

// ============================================================================
// PRESET CONFIGURATIONS - Ready to use!
// ============================================================================

export const carouselPresets = {
  // Hero - Full-width dramatic carousel
  heroFullwidth: {
    layout: 'hero' as const,
    slides: [],
    showIndicators: true,
    showArrows: true,
    showProgress: true,
    showTitle: true,
    showSubtitle: true,
    showCaption: false,
    showCTA: true,
    autoPlay: true,
    autoPlayInterval: 8000,
    pauseOnHover: true,
    infiniteLoop: true,
    height: '100vh',
    transitionDuration: 1200,
    transitionType: 'fade' as const,
    overlayOpacity: 0.5,
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    titleSize: '3.5rem',
    subtitleSize: '1.25rem',
    borderRadius: 0,
    padding: '0',
    apiEndpoint: '/api/jana/hero-carousel',
    title: '',
    subtitle: ''
  },

  // Compact - Contained carousel
  compactContained: {
    layout: 'compact' as const,
    slides: [],
    showIndicators: true,
    showArrows: true,
    showProgress: true,
    showTitle: true,
    showSubtitle: true,
    showCaption: false,
    showCTA: true,
    autoPlay: true,
    autoPlayInterval: 6000,
    pauseOnHover: true,
    infiniteLoop: true,
    height: '600px',
    transitionDuration: 1000,
    transitionType: 'fade' as const,
    overlayOpacity: 0.5,
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
    backgroundColor: '#ffffff',
    textColor: '#ffffff',
    titleSize: '2.5rem',
    subtitleSize: '1.1rem',
    borderRadius: 16,
    padding: '2rem',
    apiEndpoint: '/api/jana/hero-carousel',
    title: '',
    subtitle: ''
  },

  // Thumbnail - With thumbnail navigation
  thumbnailNav: {
    layout: 'thumbnail' as const,
    slides: [],
    showIndicators: false,
    showArrows: true,
    showProgress: false,
    showTitle: true,
    showSubtitle: true,
    showCaption: false,
    showCTA: true,
    autoPlay: true,
    autoPlayInterval: 10000,
    pauseOnHover: true,
    infiniteLoop: true,
    height: '500px',
    transitionDuration: 800,
    transitionType: 'slide' as const,
    overlayOpacity: 0.5,
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
    backgroundColor: '#f8fafc',
    textColor: '#ffffff',
    titleSize: '2rem',
    subtitleSize: '1rem',
    borderRadius: 12,
    padding: '2rem',
    apiEndpoint: '/api/jana/hero-carousel',
    title: '',
    subtitle: ''
  },

  // Minimal - Clean and simple
  minimalClean: {
    layout: 'minimal' as const,
    slides: [],
    showIndicators: true,
    showArrows: false,
    showProgress: false,
    showTitle: true,
    showSubtitle: true,
    showCaption: false,
    showCTA: false,
    autoPlay: true,
    autoPlayInterval: 7000,
    pauseOnHover: false,
    infiniteLoop: true,
    height: '500px',
    transitionDuration: 1000,
    transitionType: 'fade' as const,
    overlayOpacity: 0.4,
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
    backgroundColor: '#ffffff',
    textColor: '#ffffff',
    titleSize: '2rem',
    subtitleSize: '1rem',
    borderRadius: 12,
    padding: '2rem',
    apiEndpoint: '/api/jana/hero-carousel',
    title: '',
    subtitle: ''
  },

  // Fullscreen - Edge to edge
  fullscreenEdge: {
    layout: 'fullscreen' as const,
    slides: [],
    showIndicators: true,
    showArrows: true,
    showProgress: true,
    showTitle: true,
    showSubtitle: true,
    showCaption: true,
    showCTA: true,
    autoPlay: true,
    autoPlayInterval: 9000,
    pauseOnHover: true,
    infiniteLoop: true,
    height: '100vh',
    transitionDuration: 1500,
    transitionType: 'zoom' as const,
    overlayOpacity: 0.6,
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    titleSize: '4rem',
    subtitleSize: '1.5rem',
    borderRadius: 0,
    padding: '0',
    apiEndpoint: '/api/jana/hero-carousel',
    title: '',
    subtitle: ''
  },

  // Card - Inside card container
  cardContainer: {
    layout: 'card' as const,
    slides: [],
    showIndicators: true,
    showArrows: true,
    showProgress: false,
    showTitle: true,
    showSubtitle: true,
    showCaption: false,
    showCTA: true,
    autoPlay: true,
    autoPlayInterval: 6000,
    pauseOnHover: true,
    infiniteLoop: true,
    height: '450px',
    transitionDuration: 1000,
    transitionType: 'fade' as const,
    overlayOpacity: 0.5,
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
    backgroundColor: '#ffffff',
    textColor: '#ffffff',
    titleSize: '2rem',
    subtitleSize: '1rem',
    borderRadius: 16,
    padding: '2rem',
    apiEndpoint: '/api/jana/hero-carousel',
    title: '',
    subtitle: ''
  }
};
