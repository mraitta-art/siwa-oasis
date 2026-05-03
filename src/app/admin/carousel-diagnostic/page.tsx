'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CarouselDiagnostic() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCarousel();
  }, []);

  async function checkCarousel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/hero-carousel');
      const data = await res.json();
      setApiResponse(data);
      setSlides(data.slides || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          color: '#D4AF37', 
          fontSize: '2.5rem', 
          fontWeight: 900,
          marginBottom: '2rem'
        }}>
          🎬 Carousel Diagnostic Tool
        </h1>

        {/* Status */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #334155'
        }}>
          <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem' }}>
            Status
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>API Status:</span>
              <span style={{ 
                color: error ? '#ef4444' : '#22c55e',
                fontWeight: 700
              }}>
                {error ? '❌ Error' : '✅ Working'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Total Slides:</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {slides.length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>YouTube Slides:</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {slides.filter((s: any) => s.type === 'youtube').length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Image Slides:</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {slides.filter((s: any) => s.type === 'image').length}
              </span>
            </div>
          </div>
          <button
            onClick={checkCarousel}
            style={{
              marginTop: '1rem',
              padding: '0.7rem 1.5rem',
              background: '#D4AF37',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#7f1d1d',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>Error:</h3>
            <p style={{ color: '#fff', fontFamily: 'monospace' }}>{error}</p>
          </div>
        )}

        {/* Raw API Response */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #334155'
        }}>
          <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem' }}>
            Raw API Response
          </h2>
          <pre style={{
            background: '#0f172a',
            padding: '1rem',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px',
            color: '#22c55e',
            fontSize: '0.85rem',
            fontFamily: 'monospace'
          }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>

        {/* Slides Detail */}
        {slides.length > 0 && (
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #334155'
          }}>
            <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem' }}>
              Slides Detail
            </h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {slides.map((slide: any, index: number) => (
                <div
                  key={slide.id || index}
                  style={{
                    background: '#0f172a',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ color: '#D4AF37', margin: 0 }}>
                      Slide #{index + 1}
                    </h3>
                    <span style={{
                      padding: '0.3rem 0.8rem',
                      background: slide.type === 'youtube' ? '#ef4444' : 
                                  slide.type === 'image' ? '#3b82f6' : '#8b5cf6',
                      color: '#fff',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {slide.type}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Media URL:</span>
                      <p style={{ 
                        color: '#fff', 
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        marginTop: '0.3rem',
                        wordBreak: 'break-all'
                      }}>
                        {slide.mediaUrl || '(empty)'}
                      </p>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8' }}>Title:</span>
                      <p style={{ color: '#fff', marginTop: '0.3rem' }}>
                        {slide.title || '(empty)'}
                      </p>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8' }}>Subtitle:</span>
                      <p style={{ color: '#fff', marginTop: '0.3rem' }}>
                        {slide.subtitle || '(empty)'}
                      </p>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8' }}>Caption:</span>
                      <p style={{ color: '#fff', marginTop: '0.3rem' }}>
                        {slide.caption || '(empty)'}
                      </p>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8' }}>CTA Text:</span>
                      <p style={{ color: '#fff', marginTop: '0.3rem' }}>
                        {slide.ctaText || '(empty)'}
                      </p>
                    </div>

                    <div>
                      <span style={{ color: '#94a3b8' }}>CTA Link:</span>
                      <p style={{ 
                        color: '#fff', 
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        marginTop: '0.3rem'
                      }}>
                        {slide.ctaLink || '(empty)'}
                      </p>
                    </div>

                    {slide.captionStyle && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Caption Style:</span>
                        <pre style={{ 
                          color: '#22c55e',
                          fontSize: '0.75rem',
                          marginTop: '0.3rem',
                          background: '#1e293b',
                          padding: '0.5rem',
                          borderRadius: '4px'
                        }}>
                          {JSON.stringify(slide.captionStyle, null, 2)}
                        </pre>
                      </div>
                    )}

                    {slide.titleStyle && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Title Style:</span>
                        <pre style={{ 
                          color: '#22c55e',
                          fontSize: '0.75rem',
                          marginTop: '0.3rem',
                          background: '#1e293b',
                          padding: '0.5rem',
                          borderRadius: '4px'
                        }}>
                          {JSON.stringify(slide.titleStyle, null, 2)}
                        </pre>
                      </div>
                    )}

                    {slide.backgroundStyle && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Background Style:</span>
                        <pre style={{ 
                          color: '#22c55e',
                          fontSize: '0.75rem',
                          marginTop: '0.3rem',
                          background: '#1e293b',
                          padding: '0.5rem',
                          borderRadius: '4px'
                        }}>
                          {JSON.stringify(slide.backgroundStyle, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* YouTube Preview */}
                  {slide.type === 'youtube' && slide.mediaUrl && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <span style={{ color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>
                        YouTube Preview:
                      </span>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '56.25%',
                        background: '#000',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        {(() => {
                          const patterns = [
                            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
                            /youtube\.com\/watch\?.*v=([^&\s]+)/,
                          ];
                          
                          let videoId = '';
                          for (const pattern of patterns) {
                            const match = slide.mediaUrl.match(pattern);
                            if (match && match[1]) {
                              videoId = match[1];
                              break;
                            }
                          }

                          if (!videoId) {
                            return (
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ef4444'
                              }}>
                                ❌ Invalid YouTube URL
                              </div>
                            );
                          }

                          return (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=1`}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                border: 'none'
                              }}
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              title="YouTube preview"
                            />
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/admin/hero-carousel"
            style={{
              padding: '0.8rem 1.5rem',
              background: '#D4AF37',
              color: '#0f172a',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            🎨 Edit Carousel
          </Link>
          <Link
            href="/carousel"
            style={{
              padding: '0.8rem 1.5rem',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            🎬 View Carousel Page
          </Link>
          <Link
            href="/"
            style={{
              padding: '0.8rem 1.5rem',
              background: '#8b5cf6',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            🏠 View Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
