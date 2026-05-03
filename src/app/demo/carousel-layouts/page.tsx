'use client';

import React, { useState } from 'react';
import { EasyCarouselSection, carouselPresets, CarouselSlide } from '@/lib/carousel-integration';

// Sample carousel slides for demonstration
const sampleSlides: CarouselSlide[] = [
  {
    id: 'slide-1',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    title: 'Discover Siwa Oasis',
    subtitle: 'Experience the beauty of ancient traditions',
    caption: 'Mountain landscapes at sunset',
    ctaText: 'Explore Now',
    ctaLink: '/explore',
    ctaType: 'page',
    overlayOpacity: 0.5,
    animation: 'fade',
    transitionDuration: 1200
  },
  {
    id: 'slide-2',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
    title: 'Local Business Directory',
    subtitle: 'Connect with trusted local vendors',
    caption: 'Support local businesses',
    ctaText: 'Browse Directory',
    ctaLink: '/directory',
    ctaType: 'page',
    overlayOpacity: 0.5,
    animation: 'zoom',
    transitionDuration: 1000
  },
  {
    id: 'slide-3',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&h=1080&fit=crop',
    title: 'Plan Your Visit',
    subtitle: 'Everything you need to know about Siwa',
    caption: 'Plan your perfect trip',
    ctaText: 'Start Planning',
    ctaLink: '/plan',
    ctaType: 'page',
    overlayOpacity: 0.5,
    animation: 'slide',
    transitionDuration: 800
  },
  {
    id: 'slide-4',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop',
    title: 'Cultural Heritage',
    subtitle: 'Preserving traditions for future generations',
    caption: 'Rich cultural history',
    ctaText: 'Learn More',
    ctaLink: '/culture',
    ctaType: 'page',
    overlayOpacity: 0.5,
    animation: 'kenburns',
    transitionDuration: 1500
  }
];

type PresetKey = keyof typeof carouselPresets;

export default function CarouselLayoutDemo() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('heroFullwidth');
  const [slideCount, setSlideCount] = useState(4);

  const presetKeys = Object.keys(carouselPresets) as PresetKey[];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '4rem 2rem',
        textAlign: 'center',
        color: '#fff'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>
          🎬 Carousel Layout Showcase
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
          Explore all available carousel layouts and choose the perfect one for your website
        </p>
      </div>

      {/* Controls */}
      <div style={{
        maxWidth: '1400px',
        margin: '-3rem auto 2rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Preset Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Choose Carousel Layout:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {presetKeys.map(preset => {
                const p = carouselPresets[preset];
                return (
                  <button
                    key={preset}
                    onClick={() => setSelectedPreset(preset)}
                    style={{
                      padding: '1rem',
                      background: selectedPreset === preset 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' 
                        : '#f8fafc',
                      color: selectedPreset === preset ? '#fff' : '#64748b',
                      border: selectedPreset === preset ? 'none' : '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ marginBottom: '0.25rem', textTransform: 'capitalize' }}>
                      {preset.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: 0.8,
                      fontWeight: 500
                    }}>
                      {p.height} • {p.transitionType}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slide Count */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Number of Slides: {slideCount}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
              style={{ width: '100%', height: '8px', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>

            {/* Quick Settings */}
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Quick Settings:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Height:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{carouselPresets[selectedPreset].height}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Auto Play:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{carouselPresets[selectedPreset].autoPlayInterval / 1000}s</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Transition:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{carouselPresets[selectedPreset].transitionType}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Duration:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{carouselPresets[selectedPreset].transitionDuration}ms</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Preview */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <EasyCarouselSection
          preset={selectedPreset}
          slides={sampleSlides.slice(0, slideCount)}
        />
      </div>

      {/* Code Example */}
      <div style={{
        maxWidth: '1400px',
        margin: '2rem auto',
        padding: '2rem',
        background: '#0f172a',
        borderRadius: '16px',
        color: '#fff'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          💻 How to Use This Carousel
        </h3>
        <pre style={{
          background: '#1e293b',
          padding: '1.5rem',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '0.85rem',
          lineHeight: '1.6'
        }}>
{`import { EasyCarouselSection } from '@/lib/carousel-integration';

// Add this to your page:
<EasyCarouselSection 
  preset="${selectedPreset}" 
  loadFromAPI={true}
  title="Featured Carousel"
  subtitle="Browse our amazing content"
/>`}
        </pre>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        background: '#fff',
        marginTop: '2rem'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
          🚀 Ready to Add Carousels to Your Site?
        </h3>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          Choose a layout above and copy the code to add it to any page!
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/CAROUSEL_INTEGRATION_GUIDE.md"
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            📖 Read Carousel Documentation
          </a>
          <a
            href="/jana/hero-carousel"
            style={{
              padding: '1rem 2rem',
              background: '#fff',
              color: '#3b82f6',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              border: '2px solid #3b82f6'
            }}
          >
            🎨 Manage Carousel Slides
          </a>
        </div>
      </div>
    </div>
  );
}
