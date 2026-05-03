'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface YouTubeCarouselPlayerProps {
  videoId: string;
  isActive: boolean;
  title?: string;
  showControls?: boolean;
  autoplay?: boolean;
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
        mute: 1, // Must be muted for autoplay
        playsinline: 1
      },
      events: {
        onReady: (event: any) => {
          setIsLoaded(true);
          if (isActive && autoplay) {
            event.target.playVideo();
            setIsPlaying(true);
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
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

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    }
  };

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
        pointerEvents: 'none' // We use our own controls
      }}></div>

      {!isLoaded && (
        <div style={{ position: 'absolute', inset: 0, background: `url(${thumbnailUrl}) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '1rem 2rem', borderRadius: '4px' }}>
              <i className="fas fa-spinner fa-spin"></i> LOADING STORY...
           </div>
        </div>
      )}

      {showControls && isLoaded && (
        <div 
          onClick={togglePlay}
          style={{ 
            position: 'absolute', 
            inset: 0, 
            cursor: 'pointer', 
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!isPlaying && (
             <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,175,55,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-play" style={{ fontSize: '2rem', color: '#1a1a2e', marginLeft: '5px' }}></i>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
