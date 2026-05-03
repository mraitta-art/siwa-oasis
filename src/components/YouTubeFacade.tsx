'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface YouTubeFacadeProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  thumbnailQuality?: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault';
  onPlay?: () => void;
  onReady?: () => void;
}

/**
 * YouTube Facade Pattern Component
 * 
 * Features:
 * - Lazy loading: Only loads IFrame on user click
 * - Privacy mode: Uses youtube-nocookie.com domain
 * - Responsive: 16:9 aspect ratio wrapper
 * - API integration: Enables YouTube IFrame API
 * - High-quality thumbnail with play button overlay
 */
export default function YouTubeFacade({
  videoId,
  title = 'YouTube Video',
  className = '',
  autoplay = false,
  thumbnailQuality = 'maxresdefault',
  onPlay,
  onReady,
}: YouTubeFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract video ID if full URL is provided
  const extractVideoId = useCallback((input: string): string => {
    if (!input) return '';
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?]+)/,
      /(?:youtu\.be\/)([^&\s?]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return input;
  }, []);

  const cleanVideoId = extractVideoId(videoId);
  const thumbnailUrl = `https://img.youtube.com/vi/${cleanVideoId}/${thumbnailQuality}.jpg`;

  // Build IFrame URL with optimized parameters
  const buildEmbedUrl = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      rel: '0',
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      mute: autoplay ? '1' : '0',
      playsinline: '1',
      origin: origin,
    });
    
    return `https://www.youtube-nocookie.com/embed/${cleanVideoId}?${params.toString()}`;
  }, [cleanVideoId, autoplay]);

  // Handle play button click
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  // Handle IFrame load
  const handleIframeLoad = useCallback(() => {
    setIsLoaded(true);
    onReady?.();
  }, [onReady]);

  // Handle IFrame error
  const handleIframeError = useCallback(() => {
    setError(true);
    console.error('Failed to load YouTube video:', cleanVideoId);
  }, [cleanVideoId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Destroy IFrame to free resources
      if (iframeRef.current) {
        iframeRef.current.src = '';
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`youtube-facade-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        height: 0,
        overflow: 'hidden',
        background: '#000',
        borderRadius: '0.75rem',
      }}
    >
      {!isPlaying ? (
        /* ─── FACADE: Thumbnail + Play Button ─── */
        <div
          onClick={handlePlay}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            background: `url(${thumbnailUrl}) center/cover no-repeat`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          role="button"
          tabIndex={0}
          aria-label={`Play ${title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePlay();
            }
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.15)',
              transition: 'background 0.3s ease',
            }}
          />

          {/* Play button */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: '68px',
              height: '48px',
              background: 'rgba(255, 0, 0, 0.9)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.3s ease',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
              style={{ marginLeft: '3px' }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Video title overlay (optional) */}
          {title && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1.5rem 1rem 1rem',
                background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {title}
            </div>
          )}
        </div>
      ) : (
        /* ─── IFRAME: Loaded on demand ─── */
        <>
          {/* Loading state */}
          {!isLoaded && !error && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
                zIndex: 1,
              }}
            >
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                ></i>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>Loading video...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
                color: '#fff',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#f59e0b' }}></i>
              <p style={{ fontSize: '0.9rem' }}>Failed to load video</p>
              <button
                onClick={handlePlay}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#D4AF37',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: '#1a1a2e',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* YouTube IFrame */}
          <iframe
            ref={iframeRef}
            src={buildEmbedUrl()}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </>
      )}
    </div>
  );
}

/**
 * Batch utility to scan and replace YouTube URLs in content
 * Can be used to process rich text or component props
 */
export function processYouTubeContent(content: string): string {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
  
  return content.replace(youtubeRegex, (match, videoId) => {
    return `<!--YOUTUBE_FACADE:${videoId}-->`;
  });
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?]+)/,
    /(?:youtu\.be\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
