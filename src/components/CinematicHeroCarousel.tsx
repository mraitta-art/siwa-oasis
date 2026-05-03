'use client';

import React, { useState, useEffect, useCallback } from 'react';
import YouTubeCarouselPlayer from './YouTubeCarouselPlayer';

interface Slide {
  id: string;
  type: 'image' | 'youtube' | 'video';
  mediaUrl: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
  animation?: 'fade' | 'zoom' | 'slide' | 'kenburns';
}

interface CinematicHeroCarouselProps {
  slides: Slide[];
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  height?: string;
}

export default function CinematicHeroCarousel({
  slides,
  autoPlayInterval = 6000,
  showIndicators = true,
  showArrows = true,
  height = '100vh'
}: CinematicHeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isMuted, setIsMuted] = useState(true);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [currentSlide, autoPlayInterval, slides.length]);

  const goToNext = useCallback(() => {
    if (isTransitioning || slides.length <= 1) return;
    setDirection('next');
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [isTransitioning, slides.length]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || slides.length <= 1) return;
    setDirection('prev');
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [isTransitioning, slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [isTransitioning, currentSlide]);

  if (!slides || slides.length === 0) {
    return (
      <section
        style={{
          height,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <i className="fas fa-images" style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}></i>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>No Slides Configured</h2>
          <p style={{ opacity: 0.7 }}>Add slides through the website builder</p>
        </div>
      </section>
    );
  }

  const slide = slides[currentSlide];
  const overlayOpacity = slide.overlayOpacity ?? 0.5;

  return (
    <section
      style={{
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000'
      }}
    >
      {/* Slide Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning 
            ? `scale(${direction === 'next' ? 1.1 : 0.95})` 
            : 'scale(1)',
          transition: 'opacity 1s ease-in-out, transform 6s ease-out'
        }}
      >
        {/* Media Background */}
        {slide.type === 'youtube' ? (
          <div style={{ position: 'absolute', inset: 0 }}>
             <YouTubeCarouselPlayer 
                videoId={extractVideoId(slide.mediaUrl)} 
                isActive={!isTransitioning} 
                autoplay={true}
                showControls={false}
                muted={isMuted}
             />
             {isMuted && (
                <div 
                  onClick={() => setIsMuted(false)}
                  style={{ 
                    position: 'absolute', bottom: '10rem', right: '3rem', zIndex: 100,
                    background: 'rgba(212,175,55,0.9)', color: '#fff', padding: '0.5rem 1rem',
                    borderRadius: '2rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <i className="fas fa-volume-mute"></i> TAP FOR SOUND
                </div>
             )}
          </div>
        ) : slide.type === 'video' ? (
          <video
            src={slide.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${slide.mediaUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: slide.animation === 'kenburns' ? 'kenburns 20s ease-in-out infinite' : 'none'
            }}
          />
        )}

        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              to bottom,
              rgba(0,0,0,${overlayOpacity * 0.5}) 0%,
              rgba(0,0,0,${overlayOpacity}) 50%,
              rgba(0,0,0,${overlayOpacity * 1.5}) 100%
            )`
          }}
        />
      </div>

      {/* Content Overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem',
          color: '#fff'
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(30px)' : 'translateY(0)',
            transition: 'opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s'
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 900,
              margin: 0,
              textShadow: '0 10px 40px rgba(0,0,0,0.8)',
              letterSpacing: '-2px',
              lineHeight: 1.1,
              marginBottom: '1.5rem'
            }}
          >
            {slide.title}
          </h1>

          {/* Subtitle */}
          {slide.subtitle && (
            <p
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                opacity: 0.95,
                maxWidth: '700px',
                margin: '0 auto 2.5rem',
                fontWeight: 500,
                textShadow: '0 4px 20px rgba(0,0,0,0.6)',
                lineHeight: 1.6
              }}
            >
              {slide.subtitle}
            </p>
          )}

          {/* CTA Button */}
          {slide.ctaText && (
            <a
              href={slide.ctaLink || '#'}
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                color: '#1a1a2e',
                padding: '1.2rem 3.5rem',
                borderRadius: '4px',
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: '2px',
                textDecoration: 'none',
                boxShadow: '0 15px 40px rgba(212,175,55,0.4)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(212,175,55,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(212,175,55,0.4)';
              }}
            >
              {slide.ctaText}
            </a>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            style={{
              position: 'absolute',
              left: '2rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              color: '#fff',
              fontSize: '1.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ‹
          </button>
          <button
            onClick={goToNext}
            style={{
              position: 'absolute',
              right: '2rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              color: '#fff',
              fontSize: '1.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && slides.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: currentSlide === index ? '48px' : '12px',
                height: '12px',
                borderRadius: '6px',
                background: currentSlide === index 
                  ? 'linear-gradient(135deg, #D4AF37, #F59E0B)' 
                  : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s ease-out',
                boxShadow: currentSlide === index 
                  ? '0 4px 15px rgba(212,175,55,0.5)' 
                  : 'none'
              }}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {slides.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '3rem',
            right: '3rem',
            zIndex: 20,
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 700,
            opacity: 0.8
          }}
        >
          <span style={{ fontSize: '1.5rem', color: '#D4AF37' }}>
            {String(currentSlide + 1).padStart(2, '0')}
          </span>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span>{String(slides.length).padStart(2, '0')}</span>
        </div>
      )}

      {/* Kenburns Animation Keyframes */}
      <style>{`
        @keyframes kenburns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.15) translate(-2%, -2%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
    </section>
  );
}

// Helper to extract YouTube video ID
function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}
