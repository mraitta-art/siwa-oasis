'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from './AdvancedHeroCarousel';

interface AutomatedMinisiteHeroProps {
  businessName: string;
  businessLogo?: string;
  customData: any;
  curationData?: any;
  activeSections: any[];
  tierFeatures?: {
    hero_automation?: boolean;
    [key: string]: any;
  };
  settings?: {
    site_name?: string;
    logo_url?: string;
    watermark_text?: string;
    show_watermark?: boolean;
    show_platform_anchor?: boolean;
    primaryColor?: string;
    primary_color?: string;
    overlayOpacity?: number;
    height?: string;
    showLogoInHero?: boolean;
    carousel_autoplay?: boolean;
    carousel_interval?: number;
    showGovernanceLink?: boolean;
    governanceLabel?: string;
    governanceUrl?: string;
  };
}

export default function AutomatedMinisiteHero({
  businessName,
  businessLogo,
  customData = {},
  activeSections = [],
  tierFeatures = {},
  settings = {}
}: AutomatedMinisiteHeroProps) {
  const slides = useMemo(() => {
    const allSlides: any[] = [];
    const primaryColor = settings.primaryColor || (settings as any).primary_color || '#D4AF37';
    const capturedSectionIds = new Set<string>();

    const isHeroVideo = (url: string) => {
      if (!url) return false;
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
      return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.includes('/video/upload/');
    };

    activeSections.forEach(section => {
      const sectionOptions = (() => {
        try { return typeof section.options === 'string' ? JSON.parse(section.options) : section.options || {}; } catch { return {}; }
      })();
      if (Array.isArray(sectionOptions.placements) && !sectionOptions.placements.includes('carousel')) return;
      capturedSectionIds.add(section.id);
      const sectionData = customData[section.id] || {};
      const miniBlog = sectionData.section_blog || sectionData.mini_blog || sectionData.section_news || sectionData.description || `Experience our unique ${section.name.toLowerCase()} DNA.`;
      
      // TIER CHECK: Is YouTube allowed?
      const allowedMedia = tierFeatures.allowedMediaTypes || ['image'];
      const youtubeStory = (allowedMedia.includes('youtube') && sectionData.youtube_story) ? sectionData.youtube_story : null;
      
      // Support photos from both vendor_gallery (section.gallery) AND custom_data (sectionData.section_gallery)
      const galleryFromSection = Array.isArray(section.gallery) ? section.gallery : [];
      const galleryFromData = Array.isArray(sectionData.section_gallery) 
        ? sectionData.section_gallery 
        : (sectionData.section_gallery ? [sectionData.section_gallery] : []);
      const galleryFromDataDirect = Array.isArray(sectionData.gallery) ? sectionData.gallery : [];
      
      const photos = [...galleryFromSection, ...galleryFromData, ...galleryFromDataDirect].filter(Boolean);

      // CURATION FILTER: Photos marked as "is_hero", placement "hero"/"both", or approved
      const featuredPhotos = photos.filter((p: any) => {
        if (!p) return false;
        const isHero = p.is_hero === true || p.is_hero === 1 || p.placement === 'hero' || p.placement === 'both';
        const isApproved = p.approval_status === 'approved' || p.approval_status === undefined;
        const isMinisiteVisible = p.show_on_minisite !== 0 && p.show_on_minisite !== false;
        return isHero && isApproved && isMinisiteVisible;
      });

      if (youtubeStory) {
        allSlides.push({
          id: `${section.id}_yt`,
          type: 'youtube',
          mediaUrl: youtubeStory,
          maxDuration: tierFeatures.max_youtube_duration,
          title: "", 
          subtitle: miniBlog,
          caption: (businessName || '').toUpperCase(), 
          ctaText: `READ MORE`,
          ctaLink: `#${section.id}`,
          animation: 'fade'
        });
      }

      // Add featured photos from section gallery as hero slides
      featuredPhotos.forEach((photo: any, idx: number) => {
        const url = typeof photo === 'object' ? photo.url : photo;
        const caption = typeof photo === 'object' ? photo.caption : '';
        const slideData = typeof photo === 'object' && photo.slide_data 
          ? (typeof photo.slide_data === 'string' ? JSON.parse(photo.slide_data) : photo.slide_data)
          : {};
        
        const isVid = url ? isHeroVideo(url) : false;
        const hasMedia = !!url;
        
        allSlides.push({
          id: `${section.id}_img_${idx}`,
          type: !hasMedia ? 'branded' : (isVid ? 'video' : 'image'),
          mediaUrl: url || null,
          title: slideData.title || caption || section.name,
          subtitle: slideData.subtitle || `DISCOVER THE ${(section.name || '').toUpperCase()} EXPERIENCE`,
          caption: (businessName || '').toUpperCase(), 
          ctaText: slideData.cta_label || `EXPLORE ${(section.name || '').toUpperCase()}`,
          ctaLink: slideData.cta_url || `#${section.id}`,
          animation: !hasMedia ? 'fade' : (isVid ? 'fade' : 'kenburns'),
          displayMode: photo.display_mode || (hasMedia ? 'image' : 'text_only'),
          showCaption: slideData.show_overlay !== false && photo.show_caption !== false,
          bgColor: photo.bg_color || (hasMedia ? null : 'linear-gradient(135deg, #0f172a, #1e293b)')
        });
      });

      // Fallback slide (if NOTHING is featured across sections, show the first photo as a courtesy)
      if (!youtubeStory && featuredPhotos.length === 0 && photos.length > 0) {
        const firstPhoto = photos[0];
        const url = (typeof firstPhoto === 'object' ? firstPhoto.url : firstPhoto) || '';
        const caption = (typeof firstPhoto === 'object' ? firstPhoto.caption : '') || '';
        const isVid = url ? isHeroVideo(url) : false;
        const hasMedia = !!url;

        allSlides.push({
          id: `${section.id}_img_first`,
          type: !hasMedia ? 'branded' : (isVid ? 'video' : 'image'),
          mediaUrl: url || null,
          title: caption || section.name,
          subtitle: `EXPLORE OUR ${(section.name || '').toUpperCase()}`,
          caption: (businessName || '').toUpperCase(),
          ctaText: 'EXPLORE',
          ctaLink: `#${section.id}`,
          animation: !hasMedia ? 'fade' : (isVid ? 'fade' : 'kenburns'),
          bgColor: hasMedia ? null : 'linear-gradient(135deg, #0f172a, #1e293b)'
        });
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // SECOND PASS: Scan customData directly...
    // ═══════════════════════════════════════════════════════════════
    Object.entries(customData).forEach(([sectionKey, sectionData]: [string, any]) => {
      if (capturedSectionIds.has(sectionKey)) return; 
      if (!sectionData || typeof sectionData !== 'object') return;
      
      const gallery = sectionData.section_gallery || [];
      const photos = Array.isArray(gallery) ? gallery : [];
      const heroPhotos = photos.filter((p: any) => p && p.is_hero);
      
      heroPhotos.forEach((photo: any, idx: number) => {
        const url = typeof photo === 'object' ? photo.url : photo;
        const caption = typeof photo === 'object' ? photo.caption : '';
        const isVid = url ? isHeroVideo(url) : false;
        const hasMedia = !!url;

        allSlides.push({
          id: `${sectionKey}_direct_${idx}`,
          type: !hasMedia ? 'branded' : (isVid ? 'video' : 'image'),
          mediaUrl: url || null,
          title: caption || sectionKey.replace(/_/g, ' ').toUpperCase(),
          subtitle: `DISCOVER MORE`,
          caption: (businessName || '').toUpperCase(),
          ctaText: 'READ FULL STORY',
          ctaLink: `#${sectionKey}`,
          animation: !hasMedia ? 'fade' : (isVid ? 'fade' : 'kenburns'),
          displayMode: photo.display_mode || (hasMedia ? 'image' : 'text_only'),
          showCaption: photo.show_caption !== false,
          bgColor: photo.bg_color || (hasMedia ? null : 'linear-gradient(135deg, #0f172a, #1e293b)')
        });
      });
    });

    // FINAL QUOTA CAP: Enforce absolute maximum slides from tier
    const finalLimit = tierFeatures.maxSlides || 10;
    return allSlides.slice(0, finalLimit);
  }, [customData, activeSections, businessName, settings, tierFeatures.allowedMediaTypes, tierFeatures.maxSlides]);

  // Lock Check
  if (!tierFeatures.hero_automation) {
    return (
      <div style={{ height: settings.height || '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <i className="fas fa-sun fa-3x" style={{ color: settings.primaryColor || '#D4AF37', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>AUTHENTIC EXPERIENCE</h2>
          <p style={{ opacity: 0.6 }}>Scroll to explore {businessName}</p>
        </div>
      </div>
    );
  }

  const visual = customData.visual_dna || {};

  const brandName = settings.site_name || 'SiWiFy.com';
  const brandLogo = settings.logo_url;
  const watermarkText = settings.watermark_text || brandName;
  const showPlatformAnchor = settings.show_platform_anchor !== false;
  const showWatermark = !tierFeatures.remove_watermark && settings.show_watermark !== false;
  const primaryColor = settings.primaryColor || (settings as any).primary_color || '#D4AF37';

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* 🏛️ PLATFORM ANCHOR (Top-Left) - Dynamic from Site Settings */}
      {showPlatformAnchor && (
        <Link href="/" style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '0.5rem 1.25rem',
          borderRadius: '50px',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s'
        }}>
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} style={{ height: '22px', objectFit: 'contain' }} />
          ) : (
            <i className="fas fa-sun" style={{ color: primaryColor, fontSize: '1.2rem' }}></i>
          )}
          <span style={{ 
            color: '#fff', 
            fontWeight: 900, 
            fontSize: '0.8rem', 
            letterSpacing: '2px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>{brandName}</span>
        </Link>
      )}

      {/* MODERN BUSINESS LOGO OVERLAY */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        right: '2rem', // Moved to right to avoid collision with master logo
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        {businessLogo ? (
          <img src={businessLogo} alt={businessName} style={{ height: '50px', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.3))', objectFit: 'contain' }} />
        ) : (
          <div style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: '1.25rem',
            letterSpacing: '4px',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            borderLeft: `3px solid ${primaryColor}`,
            paddingLeft: '1rem'
          }}>
            {(businessName || '').toUpperCase()}
          </div>
        )}
      </div>

      {/* THE CINEMATIC CAROUSEL */}
      <AdvancedHeroCarousel
        slides={slides}
        height={settings.height || '100vh'}
        autoPlay={settings.carousel_autoplay !== false}
        autoPlayInterval={settings.carousel_interval || 8000}
        showProgress={true}
        showIndicators={true}
        visualSettings={{
          watermarkText: watermarkText
        }}
      />

      {/* FREEMIUM WATERMARK OVERLAY - Dynamic from Site Settings */}
      {showWatermark && (
        <div style={{
          position: 'absolute',
          bottom: '3rem',
          right: '2rem',
          zIndex: 1000,
          background: 'rgba(15,23,42,0.6)',
          color: 'rgba(255,255,255,0.9)',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '0.65rem',
          fontWeight: 900,
          letterSpacing: '2px',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          POWERED BY {watermarkText}
        </div>
      )}

      {/* BOTTOM SCROLL INDICATOR */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        color: '#fff',
        opacity: 0.5,
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '3px',
        textAlign: 'center'
      }}>
        SCROLL TO EXPLORE STORY
        <div style={{ width: '1px', height: '40px', background: '#fff', margin: '1rem auto 0', opacity: 0.5 }}></div>
      </div>
    </div>
  );
}
