'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from './AdvancedHeroCarousel';
import { resolveSectionId } from '@/lib/section-registry';

interface AutomatedMinisiteHeroProps {
  businessId?: string;
  businessName: string;
  businessLogo?: string;
  logoSize?: string;
  logoPosition?: string;
  customData: any;
  curationData?: any;
  activeSections: any[];
  activeSectionId?: string | null;
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
  /** Callback so carousel CTAs can directly switch the active tab in the parent */
  onSectionNavigate?: (sectionId: string) => void;
}

export default function AutomatedMinisiteHero({
  businessId,
  businessName,
  businessLogo,
  logoSize,
  logoPosition,
  customData = {},
  activeSections = [],
  activeSectionId = null,
  tierFeatures = {},
  settings = {},
  onSectionNavigate,
}: AutomatedMinisiteHeroProps) {
  // Admin-saved carousel override: if admin saved slides for this business via
  // /jana/hero-carousel, those take priority over the auto-generated slides.
  const [adminSlides, setAdminSlides] = useState<any[] | null>(null);

  useEffect(() => {
    if (!businessId) return;
    const sectionId = activeSectionId || activeSections[0]?.id || '';
    const siteId = sectionId ? `biz_${businessId}_tab_${sectionId}_hero` : `biz_${businessId}_hero`;
    setAdminSlides(null);
    fetch(`/api/jana/hero-carousel?siteId=${encodeURIComponent(siteId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const fetched: any[] = data?.slides || [];
        // Only use admin slides if the admin actually saved something
        if (fetched.length > 0) {
          setAdminSlides(fetched);
        }
      })
      .catch(() => {/* fall back to auto-generated slides silently */});
  }, [businessId, activeSectionId, activeSections]);

  const slides = useMemo(() => {
    const allSlides: any[] = [];
    const capturedSectionIds = new Set<string>();
    // The hero is the business-wide carousel. Collect eligible media from every
    // active section so the first tab cannot hide images stored in later tabs.
    const heroSections = activeSections || [];
    const activeCanonicalIds = new Set(
      heroSections
        .map((section: any) => resolveSectionId(String(section?.id || '')))
        .filter(Boolean)
    );

    const isHeroVideo = (url: string) => {
      if (!url) return false;
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
      return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.includes('/video/upload/');
    };

    heroSections.forEach((section: any) => {
      const sectionId = resolveSectionId(String(section?.id || ''));
      if (!sectionId || sectionId === 'sec_7_investment') return;

      const sectionOptions = (() => {
        try {
          return typeof section.options === 'string' ? JSON.parse(section.options) : section.options || {};
        } catch {
          return {};
        }
      })();

      if (Array.isArray(sectionOptions.placements) && !sectionOptions.placements.includes('carousel')) return;
      capturedSectionIds.add(sectionId);

      const sectionData = customData[sectionId] || customData[section?.id] || {};
      const sectionName = section?.name || sectionId.replace(/_/g, ' ');
      const miniBlog = sectionData.section_blog || sectionData.mini_blog || sectionData._media?.mini_blog || sectionData.section_news || sectionData.description || `Experience our unique ${sectionName.toLowerCase()} DNA.`;

      const allowedMedia = tierFeatures.allowedMediaTypes || ['image'];
      const youtubeStory = (allowedMedia.includes('youtube') && sectionData.youtube_story) ? sectionData.youtube_story : null;

      const galleryFromSection = Array.isArray(section.gallery) ? section.gallery : [];
      const galleryFromData = Array.isArray(sectionData.section_gallery)
        ? sectionData.section_gallery
        : (sectionData.section_gallery ? [sectionData.section_gallery] : []);
      const galleryFromDataDirect = Array.isArray(sectionData.gallery) ? sectionData.gallery : [];
      const galleryFromMedia = Array.isArray(sectionData._media?.images) ? sectionData._media.images : [];
      const photos = [...galleryFromSection, ...galleryFromData, ...galleryFromDataDirect, ...galleryFromMedia].filter(Boolean);

      const isSelectedForCarousel = (photo: any) => {
        if (typeof photo === 'string') return true;
        if (!photo) return false;
        if (photo.is_minisite_carousel !== undefined) return photo.is_minisite_carousel !== false;
        if (photo.in_carousel !== undefined) return photo.in_carousel !== false;
        if (photo.placement !== undefined) return photo.placement !== 'body';
        return true;
      };
      const carouselPhotos = photos.filter(isSelectedForCarousel);

      const featuredPhotos = carouselPhotos.filter((p: any) => {
        if (!p) return false;
        const isApproved = p.approval_status === 'approved' || p.approval_status === undefined;
        const isMinisiteVisible = p.show_on_minisite !== 0 && p.show_on_minisite !== false;
        return isApproved && isMinisiteVisible;
      });

      if (youtubeStory) {
        allSlides.push({
          id: `${sectionId}_yt`,
          type: 'youtube',
          mediaUrl: youtubeStory,
          maxDuration: tierFeatures.max_youtube_duration,
          title: '',
          subtitle: miniBlog,
          caption: (businessName || '').toUpperCase(),
          ctaText: 'READ MORE',
          ctaLink: `#${sectionId}`,
          animation: 'fade'
        });
      }

      featuredPhotos.forEach((photo: any, idx: number) => {
        const url = typeof photo === 'object' ? photo.url : photo;
        const caption = typeof photo === 'object' ? photo.caption : '';
        const slideData = typeof photo === 'object' && photo.slide_data
          ? (typeof photo.slide_data === 'string' ? JSON.parse(photo.slide_data) : photo.slide_data)
          : {};

        const isVid = url ? isHeroVideo(url) : false;
        const hasMedia = !!url;

        allSlides.push({
          id: `${sectionId}_img_${idx}`,
          type: !hasMedia ? 'branded' : (isVid ? 'video' : 'image'),
          mediaUrl: url || null,
          title: slideData.title || caption || sectionName,
          subtitle: slideData.subtitle || `DISCOVER THE ${(sectionName || '').toUpperCase()} EXPERIENCE`,
          caption: (businessName || '').toUpperCase(),
          ctaText: slideData.cta_label || `EXPLORE ${(sectionName || '').toUpperCase()}`,
          ctaLink: slideData.cta_url || `#${sectionId}`,
          animation: !hasMedia ? 'fade' : (isVid ? 'fade' : 'kenburns'),
          displayMode: photo.display_mode || (hasMedia ? 'image' : 'text_only'),
          showCaption: slideData.show_overlay !== false && photo.show_caption !== false,
          bgColor: photo.bg_color || (hasMedia ? null : 'linear-gradient(135deg, #0f172a, #1e293b)')
        });
      });
    });

    Object.entries(customData).forEach(([sectionKey, sectionData]: [string, any]) => {
      const canonicalKey = resolveSectionId(sectionKey);
      if (sectionKey === 'investment-opportunity' || sectionKey === 'investment_opportunity' || canonicalKey === 'sec_7_investment') return;
      if (capturedSectionIds.has(canonicalKey)) return;
      if (!activeCanonicalIds.has(canonicalKey)) return;
      if (!sectionData || typeof sectionData !== 'object') return;

      const gallery = sectionData.section_gallery || sectionData._media?.images || [];
      const photos = Array.isArray(gallery) ? gallery : [];
      const heroPhotos = photos.filter((p: any) => {
        if (!p || typeof p !== 'object') return false;
        if (p.is_minisite_carousel !== undefined) return p.is_minisite_carousel !== false;
        if (p.in_carousel !== undefined) return p.in_carousel !== false;
        if (p.placement !== undefined) return p.placement !== 'body';
        return p.is_hero === true;
      });

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
          subtitle: 'DISCOVER MORE',
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

    // ── HERO DECISION ENGINE SORTING & CURATION ─────────────────────
    // 1. Separate real media slides from branded text-only fallbacks
    const mediaSlides = allSlides.filter(s => s.mediaUrl && s.type !== 'branded');
    // 2. Deduplicate media slides by mediaUrl
    const seenMedia = new Set<string>();
    const uniqueMediaSlides = mediaSlides.filter(s => {
      if (!s.mediaUrl || seenMedia.has(s.mediaUrl)) return false;
      seenMedia.add(s.mediaUrl);
      return true;
    });

    // 3. Only explicitly selected media becomes a slide. Empty sections do not
    // create synthetic hero slides or pad the carousel with unrelated text.
    let curatedSlides = [...uniqueMediaSlides];

    const finalLimit = tierFeatures.maxSlides || 10;
    const explicitAdminMedia = (adminSlides || []).filter((slide: any) =>
      slide?.mediaUrl || slide?.type === 'youtube'
    );
    const mergedSlides = [...explicitAdminMedia, ...curatedSlides].filter((slide, index, list) => {
      const mediaKey = slide.mediaUrl || slide.id;
      return list.findIndex(candidate => (candidate.mediaUrl || candidate.id) === mediaKey) === index;
    });
    if (mergedSlides.length === 0) {
      const coverUrl = customData?.basic?.cover_image || customData?.sec_1_identity?.cover_image || customData?.cover_image;
      if (coverUrl) {
        mergedSlides.push({
          id: 'default_cover',
          type: 'image',
          mediaUrl: coverUrl,
          title: (businessName || '').toUpperCase(),
          subtitle: 'SIWA OASIS',
          caption: 'AUTHENTIC EXPERIENCE',
          animation: 'kenburns',
        });
      }
    }

    return mergedSlides.slice(0, finalLimit);
  }, [adminSlides, customData, activeSections, activeSectionId, businessName, settings, tierFeatures.allowedMediaTypes, tierFeatures.maxSlides]);

  // Lock Check: Only lock if tier explicitly disables hero automation
  if (tierFeatures.hero_automation === false) {
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

  // Dynamic Logo Scale & Position Controls
  const rawSize = logoSize || customData?.basic?.logo_size || customData?.logo_size;
  const rawPos = logoPosition || customData?.basic?.logo_position || customData?.logo_position || 'left';

  const logoHeight = (() => {
    if (!rawSize) return '75px';
    if (typeof rawSize === 'string' && (rawSize.endsWith('px') || rawSize.endsWith('rem') || rawSize.endsWith('%'))) return rawSize;
    switch (String(rawSize).toLowerCase()) {
      case 'sm': case 'small': return '48px';
      case 'md': case 'medium': return '75px';
      case 'lg': case 'large': return '115px';
      case 'xl': case 'xlarge': return '155px';
      case 'enlarge': case 'xxl': case 'max': return '195px';
      default: return `${rawSize}px`;
    }
  })();

  const isLeftLogo = String(rawPos).toLowerCase() === 'left';
  const isCenterLogo = String(rawPos).toLowerCase() === 'center';

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* 🏛️ PLATFORM ANCHOR - Dynamic placement away from business logo */}
      {showPlatformAnchor && (
        <Link href="/" style={{
          position: 'absolute',
          top: '2rem',
          left: isLeftLogo ? 'auto' : '2rem',
          right: isLeftLogo ? '2rem' : 'auto',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(12px)',
          padding: '0.5rem 1.25rem',
          borderRadius: '50px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
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

      {/* MODERN BUSINESS LOGO OVERLAY (Left, Right, or Center Banner) */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: isLeftLogo ? '2rem' : (isCenterLogo ? '50%' : 'auto'),
        right: !isLeftLogo && !isCenterLogo ? '2rem' : 'auto',
        transform: isCenterLogo ? 'translateX(-50%)' : 'none',
        zIndex: 1500,
        pointerEvents: 'none',
        transition: 'all 0.3s ease'
      }}>
        {businessLogo ? (
          <img 
            src={businessLogo} 
            alt={businessName} 
            style={{ 
              height: logoHeight, 
              maxHeight: '230px',
              maxWidth: '360px',
              filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.45))', 
              objectFit: 'contain',
              borderRadius: '12px'
            }} 
          />
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
        onSectionNavigate={onSectionNavigate}
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
