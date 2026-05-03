'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import YouTubeFacade, { extractYouTubeId } from './YouTubeFacade';
import YouTubeCarouselPlayer from './YouTubeCarouselPlayer';

interface Slide {
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

interface AdvancedCarouselProps {
  slides?: Slide[];
  carouselName?: string;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  showProgress?: boolean;
  height?: string;
  transitionDuration?: number;
  visualSettings?: {
    titleSize?: number;
    subtitleSize?: number;
    titleColor?: string;
    contentAlign?: 'center' | 'left' | 'right';
    primaryFont?: string;
  };
}

export default function AdvancedHeroCarousel({
  slides: initialSlides = [],
  carouselName,
  autoPlay = true,
  autoPlayInterval = 8000,
  showIndicators = true,
  showArrows = true,
  showProgress = true,
  height = '100vh',
  transitionDuration = 1200,
  visualSettings = {}
}: AdvancedCarouselProps & { autoPlay?: boolean }) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(initialSlides.length === 0 && !!carouselName);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fetch slides if a carouselName is provided
  useEffect(() => {
    if (carouselName && initialSlides.length === 0) {
      async function fetchSlides() {
        try {
          const res = await fetch(`/api/jana/hero-carousel?siteId=${carouselName}`);
          if (res.ok) {
            const data = await res.json();
            setSlides(data.slides || []);
          }
        } catch (e) {
          console.error('Failed to fetch named carousel:', carouselName, e);
        } finally {
          setLoading(false);
        }
      }
      fetchSlides();
    }
  }, [carouselName, initialSlides]);

  const align = visualSettings.contentAlign || 'center';
  const titleSize = visualSettings.titleSize ? `${visualSettings.titleSize}rem` : 'clamp(2.5rem, 7vw, 5.5rem)';
  const subtitleSize = visualSettings.subtitleSize ? `${visualSettings.subtitleSize}rem` : 'clamp(1.1rem, 2.5vw, 1.6rem)';

  const validSlides = slides.filter(s => s.mediaUrl && (s.title || s.subtitle));

  const goToNext = useCallback(() => {
    if (isTransitioning || validSlides.length <= 1) return;
    setDirection('next');
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % validSlides.length);
    setTimeout(() => setIsTransitioning(false), transitionDuration);
  }, [isTransitioning, validSlides.length, transitionDuration]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || validSlides.length <= 1) return;
    setDirection('prev');
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + validSlides.length) % validSlides.length);
    setTimeout(() => setIsTransitioning(false), transitionDuration);
  }, [isTransitioning, validSlides.length, transitionDuration]);

  useEffect(() => {
    if (validSlides.length <= 1 || isPaused || !autoPlay) return;
    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / autoPlayInterval) * 100, 100));
    }, 50);
    timerRef.current = setTimeout(goToNext, autoPlayInterval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentSlide, autoPlayInterval, validSlides.length, isPaused, goToNext, autoPlay]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    setIsTransitioning(true);
    setCurrentSlide(index);
    setProgress(0);
    setTimeout(() => setIsTransitioning(false), transitionDuration);
  }, [isTransitioning, currentSlide, transitionDuration]);

  if (loading) {
    return (
      <section style={{ height, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i>
      </section>
    );
  }

  if (!validSlides || validSlides.length === 0) {
    return (
      <section style={{ height, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}><h2>{carouselName || 'Cinematic Carousel'}</h2></div>
      </section>
    );
  }

  const slide = validSlides[currentSlide];
  const overlayOpacity = slide.overlayOpacity ?? 0.5;
  const animation = slide.animation || 'kenburns';

  return (
    <section
      style={{
        height, position: 'relative', overflow: 'hidden', background: '#000',
        fontFamily: visualSettings.primaryFont || 'inherit'
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {validSlides.map((s, index) => (
          <div
            key={s.id}
            style={{
              position: 'absolute', inset: 0, opacity: index === currentSlide ? 1 : 0,
              zIndex: index === currentSlide ? 1 : 0,
              transition: `opacity ${transitionDuration}ms ease-in-out`
            }}
          >
            <SlideMedia slide={s} animation={animation} isActive={index === currentSlide} />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.3}), rgba(0,0,0,${overlayOpacity}))`
            }} />
          </div>
        ))}
      </div>

      {/* CLICKABLE SLIDE AREA */}
      <a 
        href={slide.ctaLink || '#'} 
        style={{
          position: 'relative', 
          zIndex: 10, 
          height: '100%', 
          display: 'flex',
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: align === 'center' ? 'center' : (align === 'left' ? 'flex-start' : 'flex-end'),
          textAlign: align, 
          padding: '2rem 10%', 
          color: '#fff',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
      >
        <div style={{
          maxWidth: '1000px',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
          transition: 'all 0.6s ease-out'
        }}>
          {slide.caption && (
            <div style={{
              display: 'inline-block', 
              background: 'rgba(212, 175, 55, 0.9)', 
              color: '#1a1a2e',
              padding: '0.5rem 1.5rem', 
              borderRadius: '50px', 
              fontSize: '0.8rem',
              fontWeight: 800, 
              letterSpacing: '2px', 
              textTransform: 'uppercase', 
              marginBottom: '1.5rem'
            }}>
              {slide.caption}
            </div>
          )}
          <h1 style={{ fontSize: titleSize, fontWeight: 900, margin: '0 0 1.5rem 0', lineHeight: 1.1, color: visualSettings.titleColor || '#fff' }}>
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p style={{ 
              fontSize: subtitleSize, 
              opacity: 0.95, 
              maxWidth: '900px', 
              margin: align === 'center' ? '0 auto 3rem' : '0 0 3rem', 
              lineHeight: 1.8,
              fontWeight: 400,
              letterSpacing: '0.5px'
            }}>
              {slide.subtitle}
            </p>
          )}
          {slide.ctaText && (
            <div style={{ 
              display: 'inline-block',
              padding: '1rem 2.5rem', 
              background: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50px',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              {slide.ctaText} →
            </div>
          )}
        </div>
      </a>

      {showArrows && validSlides.length > 1 && (
        <>
          <button onClick={goToPrev} style={{ position: 'absolute', left: '2rem', top: '50%', zIndex: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>‹</button>
          <button onClick={goToNext} style={{ position: 'absolute', right: '2rem', top: '50%', zIndex: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>›</button>
        </>
      )}
    </section>
  );
}

function SlideMedia({ slide, animation, isActive }: { slide: Slide; animation: string; isActive: boolean }) {
  if (slide.type === 'youtube') return <YouTubeBackground videoUrl={slide.mediaUrl} isActive={isActive} />;
  if (slide.type === 'video') return <video src={slide.mediaUrl} autoPlay muted loop style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
  return (
    <div style={{
      position: 'absolute', inset: 0, backgroundImage: `url(${slide.mediaUrl})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      animation: isActive && animation === 'kenburns' ? 'kenburns-advanced 20s infinite' : 'none'
    }} />
  );
}

function YouTubeBackground({ videoUrl, isActive }: { videoUrl: string; isActive: boolean }) {
  const videoId = extractYouTubeId(videoUrl) || '';
  if (!videoId) return <div style={{ position: 'absolute', inset: 0, background: '#000' }} />;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <YouTubeCarouselPlayer videoId={videoId} isActive={isActive} title="Video" showControls={false} autoplay={true} />
    </div>
  );
}
