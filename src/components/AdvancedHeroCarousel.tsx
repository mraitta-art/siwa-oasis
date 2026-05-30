'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import YouTubeFacade, { extractYouTubeId } from './YouTubeFacade';
import YouTubeCarouselPlayer from './YouTubeCarouselPlayer';

interface Slide {
  id: string;
  type: 'image' | 'youtube' | 'video' | 'branded';
  mediaUrl: string | null;
  title: string;
  subtitle: string;
  caption?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaType?: 'page' | 'search' | 'external' | 'custom';
  overlayOpacity?: number;
  animation?: 'fade' | 'zoom' | 'slide' | 'kenburns';
  transitionDuration?: number;
  maxDuration?: number;
  displayMode?: 'image' | 'text_only';
  bgColor?: string;
  showCaption?: boolean;
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
  isDynamic?: boolean;
  includeDynamicOptions?: {
    businesses?: boolean;
    journeys?: boolean;
    investment?: boolean;
    registration?: boolean;
  };
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
  isDynamic = false,
  includeDynamicOptions = {
    businesses: true,
    journeys: true,
    investment: true,
    registration: true
  },
  visualSettings = {}
}: AdvancedCarouselProps & { autoPlay?: boolean }) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(initialSlides.length === 0 && !!carouselName);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fetch slides if a carouselName is provided
  useEffect(() => {
    if (carouselName && initialSlides.length === 0) {
      async function fetchSlides() {
        try {
          let url: string;
          
          if (isDynamic) {
            // Fetch from dynamic carousel endpoint with parameters
            const params = new URLSearchParams();
            params.set('businesses', includeDynamicOptions.businesses !== false ? 'true' : 'false');
            params.set('journeys', includeDynamicOptions.journeys !== false ? 'true' : 'false');
            params.set('investment', includeDynamicOptions.investment !== false ? 'true' : 'false');
            params.set('registration', includeDynamicOptions.registration !== false ? 'true' : 'false');
            url = `/api/jana/hero-carousel-dynamic?${params.toString()}`;
          } else {
            // Fetch from static carousel endpoint
            url = `/api/jana/hero-carousel?siteId=${carouselName}`;
          }
          
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setSlides(data.slides || []);
          } else {
            console.warn(`Carousel fetch returned ${res.status}, using fallback`);
          }
        } catch (e) {
          console.error('Failed to fetch named carousel:', carouselName, e);
        } finally {
          setLoading(false);
        }
      }
      fetchSlides();
    } else if (initialSlides.length > 0) {
      setSlides(initialSlides);
      setLoading(false);
    }
  }, [carouselName, initialSlides, isDynamic, includeDynamicOptions]);

  const align = visualSettings.contentAlign || 'center';
  const titleSize = visualSettings.titleSize ? `${visualSettings.titleSize}rem` : 'clamp(2.5rem, 7vw, 5.5rem)';
  const subtitleSize = visualSettings.subtitleSize ? `${visualSettings.subtitleSize}rem` : 'clamp(1.1rem, 2.5vw, 1.6rem)';

  const validSlides = slides.filter(s => s.type === 'branded' || (s.mediaUrl && s.mediaUrl.length > 0));

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
      <section style={{ height, background: 'linear-gradient(135deg, #556B2F, #6B8E23)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#FFB700' }}></i>
      </section>
    );
  }

  if (!validSlides || validSlides.length === 0) {
    return (
      <section style={{ height, background: 'linear-gradient(135deg, #556B2F, #20B2AA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <SlideMedia 
              slide={s} 
              animation={String(animation)} 
              isActive={index === currentSlide} 
              muted={Boolean(isMuted)} 
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.3}), rgba(0,0,0,${overlayOpacity}))`
            }} />
          </div>
        ))}
      </div>

      {/* CLICKABLE SLIDE AREA */}
      {slide.ctaLink ? (
        <a 
          href={slide.ctaLink} 
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
            {slide.showCaption !== false && slide.caption && (
              <div style={{
                display: 'inline-block', 
                background: 'linear-gradient(135deg, #FFB700, #FF9500)',
                color: '#000',
                padding: '0.5rem 1.5rem', 
                borderRadius: '50px', 
                fontSize: '0.8rem',
                fontWeight: 800, 
                letterSpacing: '2px', 
                textTransform: 'uppercase', 
                marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(255, 183, 0, 0.3)'
              }}>
                {slide.caption}
              </div>
            )}
            <h1 style={{ fontSize: titleSize, fontWeight: 900, margin: '0 0 1.5rem 0', lineHeight: 1.1, color: visualSettings.titleColor || '#FFFFFF', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
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
                letterSpacing: '0.5px',
                color: '#FFFFFF'
              }}>
                {slide.subtitle}
              </p>
            )}
            {slide.ctaText && (
              <div style={{ 
                display: 'inline-block',
                padding: '1rem 2.5rem', 
                background: 'linear-gradient(135deg, rgba(255, 183, 0, 0.25), rgba(255, 149, 0, 0.25))',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 183, 0, 0.6)',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#FFB700',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                {slide.ctaText} →
              </div>
            )}
          </div>
        </a>
      ) : (
        <div 
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
            cursor: 'default'
          }}
        >
          <div style={{
            maxWidth: '1000px',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
            transition: 'all 0.6s ease-out'
          }}>
            {slide.showCaption !== false && slide.caption && (
              <div style={{
                display: 'inline-block', 
                background: 'linear-gradient(135deg, #FFB700, #FF9500)',
                color: '#000',
                padding: '0.5rem 1.5rem', 
                borderRadius: '50px', 
                fontSize: '0.8rem',
                fontWeight: 800, 
                letterSpacing: '2px', 
                textTransform: 'uppercase', 
                marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(255, 183, 0, 0.3)'
              }}>
                {slide.caption}
              </div>
            )}
            <h1 style={{ fontSize: titleSize, fontWeight: 900, margin: '0 0 1.5rem 0', lineHeight: 1.1, color: visualSettings.titleColor || '#FFFFFF', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
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
                letterSpacing: '0.5px',
                color: '#FFFFFF'
              }}>
                {slide.subtitle}
              </p>
            )}
            {slide.ctaText && (
              <div style={{ 
                display: 'inline-block',
                padding: '1rem 2.5rem', 
                background: 'linear-gradient(135deg, rgba(255, 183, 0, 0.25), rgba(255, 149, 0, 0.25))',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 183, 0, 0.6)',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#FFB700',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                {slide.ctaText} →
              </div>
            )}
          </div>
        </div>
      )}

       {showArrows && validSlides.length > 1 && (
        <>
           <button onClick={goToPrev} style={{ position: 'absolute', left: '2rem', top: '50%', zIndex: 20, background: 'rgba(255, 183, 0, 0.2)', border: '2px solid rgba(255, 183, 0, 0.6)', color: '#FFB700', fontSize: '2rem', cursor: 'pointer', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', backdropFilter: 'blur(5px)' }}>‹</button>
          <button onClick={goToNext} style={{ position: 'absolute', right: '2rem', top: '50%', zIndex: 20, background: 'rgba(255, 183, 0, 0.2)', border: '2px solid rgba(255, 183, 0, 0.6)', color: '#FFB700', fontSize: '2rem', cursor: 'pointer', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', backdropFilter: 'blur(5px)' }}>›</button>
        </>
      )}

      {/* SOUND CONTROL */}
      {slide.type === 'youtube' && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMuted(!isMuted); }}
          style={{ 
            position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 30,
            background: 'rgba(32, 178, 170, 0.3)', border: '2px solid rgba(0, 206, 209, 0.6)',
            color: '#00CED1', padding: '0.8rem', borderRadius: '50%', cursor: 'pointer',
            width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)', transition: 'all 0.3s ease'
          }}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
        </button>
      )}
    </section>
  );
}

function SlideMedia({ slide, animation, isActive, muted }: { slide: Slide; animation: string; isActive: boolean; muted: boolean }) {
  if (slide.type === 'youtube') return <YouTubeBackground videoUrl={slide.mediaUrl || ''} isActive={isActive} muted={muted} maxDuration={slide.maxDuration} />;
  if (slide.type === 'video') return <video src={slide.mediaUrl || undefined} autoPlay muted loop style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
  
  if (slide.displayMode === 'text_only' || slide.type === 'branded') {
    // Determine background color for branded slides - SIWA OASIS Desert Sunset Palette
    let bgGradient = 'linear-gradient(135deg, #556B2F, #6B8E23)';
    
    // Color-code workflow steps with desert sunset theme
    if (slide.id?.includes('workflow_register')) {
      bgGradient = 'linear-gradient(135deg, #556B2F 0%, #20B2AA 100%)'; // Dark Olive to Turquoise
    } else if (slide.id?.includes('workflow_match')) {
      bgGradient = 'linear-gradient(135deg, #556B2F 0%, #00CED1 100%)'; // Olive to Cyan
    } else if (slide.id?.includes('workflow_offers')) {
      bgGradient = 'linear-gradient(135deg, #FF9500 0%, #FFB700 100%)'; // Orange to Gold (Sun)
    } else if (slide.id?.includes('workflow_book')) {
      bgGradient = 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'; // Green to Lime (Palms)
    }
    
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: slide.bgColor || bgGradient,
        transition: 'background 1s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Decorative elements for workflow slides */}
        {slide.id?.includes('workflow_') && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255, 183, 0, 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(102, 187, 106, 0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'pulse 4s ease-in-out infinite'
          }} />
        )}
        
        {slide.type === 'branded' && !slide.id?.includes('workflow_') && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10vw',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.03)',
            whiteSpace: 'nowrap',
            letterSpacing: '2rem',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            SIWA TODAY
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, backgroundImage: `url(${slide.mediaUrl})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      animation: isActive && animation === 'kenburns' ? 'kenburns-advanced 20s infinite' : 'none'
    }} />
  );
}

function YouTubeBackground({ videoUrl, isActive, muted, maxDuration }: { videoUrl: string; isActive: boolean; muted: boolean; maxDuration?: number }) {
  const videoId = extractYouTubeId(videoUrl) || '';
  if (!videoId) return <div style={{ position: 'absolute', inset: 0, background: '#000' }} />;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <YouTubeCarouselPlayer videoId={videoId} isActive={isActive} title="Video" showControls={false} autoplay={true} muted={muted} maxDuration={maxDuration} />
    </div>
  );
}
