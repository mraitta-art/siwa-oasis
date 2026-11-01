'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from './AdvancedHeroCarousel';
import { resolveSectionId } from '@/lib/section-registry';
import { BRAND_MARK_URL } from '@/lib/brand-assets';
import { buildFieldsIndexFromSections, type ResolvedField } from '@/lib/slide-blocks';
import type { ListingKind } from '@/lib/listing-kind';
import { useMinisiteLang } from './minisite/MinisiteLang';
import { label, labelWith, pick } from '@/lib/minisite-i18n';

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
  /**
   * Optional hook for the parent (VanityBusinessClient) to observe the raw
   * admin slides so the body field renderer can automatically skip any field
   * already claimed by an approved hero block (Model A: per-slide picks).
   */
  onAdminSlidesChange?: (slides: any[]) => void;
  /**
   * The minisite's public specialization. Forwarded verbatim to the info-blocks
   * overlay so a spec-sheet block formats price-bearing fields with the kind's
   * basis (total /month /night). `null` prints raw values.
   */
  listingKind?: ListingKind | null;
  /** Currency the units are priced in. Defaults to EGP when the caller has no signal. */
  currency?: string;
  /**
   * Developer / location / unit / plan fields contributed by the four-axis
   * resolver. Merged into the section-based index the overlay reads, so a
   * slide can pick `developer.name` or `location.area` alongside a typology
   * field. A business without those linked rows passes nothing and the picker
   * stays scoped to sections.
   */
  axes?: Record<string, ResolvedField> | null;
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
  onAdminSlidesChange,
  listingKind = null,
  currency = 'EGP',
  axes,
}: AutomatedMinisiteHeroProps) {
  // Prefer the minisite-wide admin carousel, then the active section's carousel.
  const [adminSlides, setAdminSlides] = useState<any[] | null>(null);
  // Arabic-first toggle from MinisiteLangProvider. Falls back to true when the
  // hero is rendered outside a provider (e.g. marketing pages).
  const { ar: langIsArabic } = useMinisiteLang();

  useEffect(() => {
    if (!businessId) return;
    const sectionId = activeSectionId || activeSections[0]?.id || '';
    const siteIds = [
      `biz_${businessId}_hero`,
      ...(sectionId ? [`biz_${businessId}_tab_${sectionId}_hero`] : []),
    ];
    setAdminSlides(null);
    let cancelled = false;

    const loadSlides = async () => {
      for (const siteId of siteIds) {
        const response = await fetch(`/api/jana/hero-carousel?siteId=${encodeURIComponent(siteId)}`);
        if (!response.ok) {
          console.error(`Failed to load minisite hero carousel ${siteId}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const fetched: any[] = Array.isArray(data?.slides) ? data.slides : [];
        if (fetched.length > 0) {
          if (!cancelled) setAdminSlides(fetched);
          return;
        }
      }
    };

    loadSlides().catch(error => {
      console.error('Failed to load minisite hero carousel:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [businessId, activeSectionId, activeSections]);

  // Publish the raw admin slides (the ones that carry `.blocks`) upward so
  // the body field renderer can subtract any field already shown on the hero.
  useEffect(() => {
    if (typeof onAdminSlidesChange === 'function') {
      onAdminSlidesChange(adminSlides || []);
    }
  }, [adminSlides, onAdminSlidesChange]);

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

      capturedSectionIds.add(sectionId);

      const sectionData = customData[sectionId] || customData[section?.id] || {};
      // A section name is admin-authored and comes in both scripts; the hero
      // prints it in the language the minisite is showing. English captions are
      // set in caps, so the value is cased once here rather than at every
      // template, which keeps the Arabic sentence in its natural case.
      const sectionNameRaw =
        pick(langIsArabic, section?.name_ar, section?.name) || sectionId.replace(/_/g, ' ');
      const sectionName = langIsArabic ? sectionNameRaw : sectionNameRaw.toUpperCase();
      const miniBlog = sectionData.section_blog || sectionData.mini_blog || sectionData._media?.mini_blog || sectionData.section_news || sectionData.description || labelWith('hero_story_dna', langIsArabic, { section: sectionName });

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
          ctaText: label('hero_read_more', langIsArabic),
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
          subtitle: slideData.subtitle || labelWith('hero_discover_experience', langIsArabic, { section: sectionName }),
          caption: (businessName || '').toUpperCase(),
          ctaText: slideData.cta_label || labelWith('hero_explore_section', langIsArabic, { section: sectionName }),
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
        // This branch has no section row to read a name from, only the stored
        // key, so the label is built from the key in the language being shown.
        const keyNameRaw = pick(langIsArabic, sectionData?.section_name_ar, sectionKey.replace(/_/g, ' '));
        const keyName = langIsArabic ? keyNameRaw : keyNameRaw.toUpperCase();

        allSlides.push({
          id: `${sectionKey}_direct_${idx}`,
          type: !hasMedia ? 'branded' : (isVid ? 'video' : 'image'),
          mediaUrl: url || null,
          title: caption || keyName,
          subtitle: label('hero_discover_more', langIsArabic),
          caption: (businessName || '').toUpperCase(),
          ctaText: label('hero_read_full_story', langIsArabic),
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
    const curatedSlides = [...uniqueMediaSlides];

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
          subtitle: label('hero_marketplace', langIsArabic),
          caption: label('hero_verified_book_direct', langIsArabic),
          animation: 'kenburns',
        });
      }
    }

    return mergedSlides.slice(0, finalLimit);
    // `langIsArabic` belongs in this list: the captions below are built from it,
    // and a slide memo that ignores it would keep serving English text after the
    // visitor pressed the language toggle.
  }, [adminSlides, customData, activeSections, activeSectionId, businessName, settings, tierFeatures.allowedMediaTypes, tierFeatures.maxSlides, langIsArabic]);

  // Lock Check: Only lock if tier explicitly disables hero automation
  if (tierFeatures.hero_automation === false) {
    return (
      <div style={{ height: settings.height || '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dir={langIsArabic ? 'rtl' : 'ltr'}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <i className="fas fa-sun fa-3x" style={{ color: settings.primaryColor || '#D4AF37', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{label('hero_authentic_experience', langIsArabic)}</h2>
          <p style={{ opacity: 0.6 }}>{labelWith('hero_scroll_explore', langIsArabic, { name: businessName })}</p>
        </div>
      </div>
    );
  }

  const visual = customData.visual_dna || {};

  const brandName = settings.site_name || 'SiWiFy.com';
  const brandLogo = settings.logo_url || BRAND_MARK_URL;
  const watermarkText = settings.watermark_text || brandName;
  const showPlatformAnchor = settings.show_platform_anchor !== false;
  const showWatermark = !tierFeatures.remove_watermark && settings.show_watermark !== false;
  const primaryColor = settings.primaryColor || (settings as any).primary_color || '#D4AF37';

  // Dynamic Logo Scale & Position Controls
  const rawSize = logoSize || customData?.basic?.logo_size || customData?.logo_size || customData?.sec_1_identity?.logo_size;
  const rawPos = logoPosition || customData?.basic?.logo_position || customData?.logo_position || customData?.sec_1_identity?.logo_position || 'left';

  const logoHeight = (() => {
    if (!rawSize) return '75px';
    if (typeof rawSize === 'string' && (rawSize.endsWith('px') || rawSize.endsWith('rem') || rawSize.endsWith('%') || rawSize.startsWith('clamp'))) return rawSize;
    switch (String(rawSize).toLowerCase()) {
      case 'sm': case 'small': return 'clamp(36px, 6vw, 48px)';
      case 'md': case 'medium': return 'clamp(54px, 9vw, 75px)';
      case 'lg': case 'large': return 'clamp(80px, 14vw, 115px)';
      case 'xl': case 'xlarge': return 'clamp(110px, 18vw, 155px)';
      case 'enlarge': case 'xxl': case 'max': return 'clamp(140px, 22vw, 195px)';
      default: return `${rawSize}px`;
    }
  })();

  const isLeftLogo = String(rawPos).toLowerCase() === 'left';
  const isCenterLogo = String(rawPos).toLowerCase() === 'center';

  // Fields index for hero blocks: fieldName → label + resolved value.
  // Rebuilds whenever activeSections, customData, or language changes.
  // Cheap enough (a few dozen fields) to compute on every render.
  const fieldsIndex = useMemo(
    () => buildFieldsIndexFromSections({
      sections: activeSections,
      customData,
      ar: langIsArabic,
      axes: axes || undefined,
    }),
    [activeSections, customData, langIsArabic, axes],
  );
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* 🏛️ PLATFORM ANCHOR - Dynamic placement away from business logo */}
      {
        // The edges are logical, not physical: the anchor keeps clear of the
        // business plate whichever side the script is read from, so the pairing
        // survives the toggle instead of stacking on top of itself in Arabic.
        showPlatformAnchor && (
          <Link href="/" style={{
            position: 'absolute',
            top: 'clamp(0.75rem, 2vw, 2rem)',
            insetInlineStart: isLeftLogo ? 'auto' : 'clamp(0.75rem, 3vw, 2rem)',
            insetInlineEnd: isLeftLogo ? 'clamp(0.75rem, 3vw, 2rem)' : 'auto',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(12px)',
            padding: '0.4rem 1rem',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'all 0.3s',
            maxWidth: 'min(45vw, 220px)',
            overflow: 'hidden'
          }}>
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} style={{ height: '20px', objectFit: 'contain', flexShrink: 0 }} />
          ) : (
            <i className="fas fa-sun" style={{ color: primaryColor, fontSize: '1rem', flexShrink: 0 }}></i>
          )}
            <span style={{ 
              color: '#fff', 
              fontWeight: 900, 
              fontSize: '0.75rem', 
              letterSpacing: '1.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>{brandName}</span>
          </Link>
        )
      }

      {/* MODERN BUSINESS LOGO OVERLAY (Start, Center, or End Banner) */}
      <div style={{
        position: 'absolute',
        top: 'clamp(0.75rem, 2vw, 2rem)',
        // A side plate is pinned to its edge; a centered plate spans the whole
        // inline axis and lets flexbox do the centering. Centering with
        // `left: 50%` + `translateX(-50%)` only works in one direction — in
        // Arabic it would push the logo off the screen.
        ...(isCenterLogo
          ? { insetInlineStart: 0, insetInlineEnd: 0, maxWidth: 'min(90vw, 420px)' }
          : {
              insetInlineStart: isLeftLogo ? 'clamp(0.75rem, 3vw, 2rem)' : 'auto',
              insetInlineEnd: isLeftLogo ? 'auto' : 'clamp(0.75rem, 3vw, 2rem)',
              maxWidth: 'min(50vw, 360px)',
            }),
        zIndex: 1500,
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
        display: 'flex',
        justifyContent: isLeftLogo ? 'flex-start' : (isCenterLogo ? 'center' : 'flex-end'),
        margin: '0 auto',
      }}>
        {businessLogo ? (
          <img 
            src={businessLogo} 
            alt={businessName} 
            style={{ 
              height: logoHeight, 
              maxHeight: 'min(230px, 25vh)',
              maxWidth: '100%',
              filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.45))', 
              objectFit: 'contain',
              borderRadius: '12px'
            }} 
          />
        ) : (
          <div style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)',
            letterSpacing: 'clamp(1px, 0.5vw, 4px)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            borderInlineStart: `3px solid ${primaryColor}`,
            paddingInlineStart: '0.75rem',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
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
        fieldsIndex={fieldsIndex}
        blocksAccent={primaryColor}
        // The blocks sit inside this minisite, so they follow its language:
        // a zone the admin picked as "start" has to land on the Arabic right.
        blocksRtl={langIsArabic}
        blocksAr={langIsArabic}
        blocksListingKind={listingKind}
        blocksCurrency={currency}
      />

      {/* FREEMIUM WATERMARK OVERLAY - Dynamic from Site Settings */}
      {showWatermark && (
        <div style={{
          position: 'absolute',
          bottom: '3rem',
          insetInlineEnd: '2rem',
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
          {labelWith('hero_powered_by', langIsArabic, { name: watermarkText })}
        </div>
      )}

      {/* BOTTOM SCROLL INDICATOR */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: 100,
        color: '#fff',
        opacity: 0.5,
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '3px',
        textAlign: 'center'
      }}>
        {label('hero_scroll_story', langIsArabic)}
        <div style={{ width: '1px', height: '40px', background: '#fff', margin: '1rem auto 0', opacity: 0.5 }}></div>
      </div>
    </div>
  );
}
