'use client';

import React, { useState, useEffect } from 'react';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import Link from 'next/link';

export default function CarouselPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCarousel();
  }, []);

  async function loadCarousel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jana/hero-carousel');
      if (!res.ok) throw new Error('Failed to load carousel');
      
      const data = await res.json();
      
      if (!data.slides || data.slides.length === 0) {
        setError('No slides configured. Add slides in the admin panel.');
      } else {
        setSlides(data.slides);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load carousel');
      console.error('Carousel load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(212,175,55,0.2)',
            borderTop: '4px solid #D4AF37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <p style={{ color: '#D4AF37', fontSize: '1.2rem', fontWeight: 700 }}>
            Loading Cinematic Experience...
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎬</div>
          <h1 style={{
            color: '#D4AF37',
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: '1rem'
          }}>
            Carousel Not Available
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.1rem',
            marginBottom: '2rem',
            lineHeight: 1.6
          }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/jana/hero-carousel"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
                color: '#1a1a2e',
                padding: '1rem 2.5rem',
                borderRadius: '50px',
                fontWeight: 800,
                textDecoration: 'none',
                fontSize: '1rem',
                boxShadow: '0 10px 30px rgba(212,175,55,0.3)'
              }}
            >
              🎨 Create Slides
            </Link>
            <button
              onClick={loadCarousel}
              style={{
                background: 'transparent',
                border: '2px solid #D4AF37',
                color: '#D4AF37',
                padding: '1rem 2.5rem',
                borderRadius: '50px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success - Show carousel
  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <AdvancedHeroCarousel
        slides={slides}
        autoPlayInterval={8000}
        transitionDuration={1200}
        height="100vh"
        showIndicators={true}
        showArrows={true}
        showProgress={true}
      />
      
      {/* Admin Quick Access Button */}
      <Link
        href="/jana/hero-carousel"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)',
          color: '#1a1a2e',
          padding: '1rem 2rem',
          borderRadius: '50px',
          fontWeight: 800,
          textDecoration: 'none',
          fontSize: '0.9rem',
          boxShadow: '0 10px 30px rgba(212,175,55,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ✏️ Edit Carousel
      </Link>
    </div>
  );
}
