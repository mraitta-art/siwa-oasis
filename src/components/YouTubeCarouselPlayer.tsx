'use client';
// ELITE REBUILD: 2026-05-05-23:55 (Cache Purge)

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface YouTubeCarouselPlayerProps {
  videoId: string;
  isActive: boolean;
  title?: string;
  showControls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  maxDuration?: number;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function YouTubeCarouselPlayer({
  videoId,
  isActive,
  title = 'Video',
  showControls = true,
  autoplay = true,
  muted = true,
  maxDuration,
}: YouTubeCarouselPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);

  // 1. Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 2. Initialize Player
  const initPlayer = useCallback(() => {
    if (playerRef.current) return;
    
    playerRef.current = new window.YT.Player(containerId.current, {
      videoId: videoId,
      playerVars: {
        autoplay: autoplay && isActive ? 1 : 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        mute: 1, // REQUIRED for autoplay in all modern browsers
        enablejsapi: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        playsinline: 1
      },
      events: {
        onReady: (event: any) => {
          setIsLoaded(true);
          if (isActive && autoplay) {
            event.target.mute(); // Double-ensure mute
            event.target.playVideo();
            setIsPlaying(true);
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          // Auto-loop for cinematic background effect
          if (event.data === window.YT.PlayerState.ENDED) {
             event.target.playVideo();
          }
        }
      }
    });
  }, [videoId, isActive, autoplay]);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const original = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (original) original();
        initPlayer();
      };
    }
  }, [initPlayer]);

  // 3. Handle Active State Changes (Play/Pause)
  useEffect(() => {
    if (isLoaded && playerRef.current) {
      if (isActive) {
        playerRef.current.playVideo();
        setIsPlaying(true);
      } else {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    }
  }, [isActive, isLoaded]);

  // 4. Handle Mute State Changes
  useEffect(() => {
    if (isLoaded && playerRef.current) {
      if (muted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        console.log("🔊 YouTube Player: unMuted and volume set to 100");
      }
    }
  }, [muted, isLoaded]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    }
  };

  const unmute = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      setIsPlaying(true);
      playerRef.current.playVideo();
    }
  };

  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);
  const timeCheckInterval = useRef<any>(null);

  useEffect(() => {
    // Only enforce the limit if maxDuration is a positive number
    if (isPlaying && maxDuration && maxDuration > 0 && playerRef.current) {
      timeCheckInterval.current = setInterval(() => {
        if (!playerRef.current || !playerRef.current.getCurrentTime) return;
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime >= maxDuration) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
          setShowUpgradeOverlay(true);
          clearInterval(timeCheckInterval.current);
        }
      }, 1000);
    } else {
      clearInterval(timeCheckInterval.current);
    }
    return () => clearInterval(timeCheckInterval.current);
  }, [isPlaying, maxDuration]);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div id={containerId.current} style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        width: '120vw', 
        height: '120vh', 
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', // PREVENT USER INTERFERENCE
        filter: showUpgradeOverlay ? 'blur(10px) brightness(0.4)' : 'none',
        transition: 'filter 0.8s ease'
      }}></div>

      {/* 🔇 MINIMALIST AUDIO CONTROL (Bottom Right) */}
      {!showUpgradeOverlay && (
        <div 
          onClick={unmute}
          style={{ 
            position: 'absolute', 
            bottom: '40px', 
            right: '40px', 
            zIndex: 100, 
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <i className="fas fa-volume-up" style={{ color: '#fff', fontSize: '0.8rem' }}></i>
        </div>
      )}

      {showUpgradeOverlay && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ 
            background: '#1e293b', padding: '3rem', borderRadius: '24px', border: '1px solid #D4AF37', 
            textAlign: 'center', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            animation: 'slide-up-fade 0.5s ease-out'
          }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#D4AF37' }}>
              <i className="fas fa-crown fa-2x"></i>
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>TEASER COMPLETE</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              You are experiencing a 30-second Free Trial preview. Upgrade to **Gold Premier** to unlock full-length cinematic stories.
            </p>
            <button style={{ background: '#D4AF37', color: '#1a1a2e', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', width: '100%', fontSize: '0.8rem', letterSpacing: '1px' }}>
              UPGRADE TO GOLD
            </button>
          </div>
          <style>{`
            @keyframes slide-up-fade {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {!isLoaded && (
        <div style={{ position: 'absolute', inset: 0, background: `url(${thumbnailUrl}) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '1rem 2rem', borderRadius: '4px' }}>
              <i className="fas fa-spinner fa-spin"></i> LOADING STORY...
           </div>
        </div>
      )}

    </div>
  );
}
