'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import MinisiteQRCode from '@/components/MinisiteQRCode';
import { useMinisiteLang } from '@/components/minisite/MinisiteLang';
import { componentDefault, label as minisiteLabel } from '@/lib/minisite-i18n';
import { MinisiteLayout, MinisiteLayoutComponent } from '@/lib/minisite-layout';

export interface BusinessContext {
  id: string;
  slug: string;
  name: string;
  type_id: string;
  type_name?: string;
  /** Arabic typology name, handed in only when the address is Arabic. */
  type_name_ar?: string | null;
  custom_data: any;
  gallery: any[];
  blogs: any[];
  tourProducts: any[];
  siteSettings?: any;
  vendorPhone?: string;
}

export interface MinisiteBuilderRendererProps {
  layout: MinisiteLayout;
  business: BusinessContext;
  showQRCode?: boolean;
}

export default function MinisiteBuilderRenderer({
  layout,
  business,
  showQRCode = false,
}: MinisiteBuilderRendererProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [brandHeroSlides, setBrandHeroSlides] = useState<any[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<Record<string, any[]>>({});

  // Slide resolution is centralized here so every carousel key is fetched at
  // most once per page render. The previous flow pre-fetched the brand-hero
  // key unconditionally on mount AND let vendor_carousel blocks re-fetch the
  // same key inside AdvancedHeroCarousel.
  const brandHeroKey = `biz_${business.id}_hero`;
  const brandHeroFallbackKey = `biz_${business.id}_tab_sec_1_identity_hero`;
  const mode = layout.mode || 'replace';
  // The route's MinisiteLangProvider owns the language; the layout's `lang` is
  // only the seeds' fallback for a preview rendered outside a provider, so one
  // answer can disagree with the header toggle nobody has to chase.
  const { ar: providerAr } = useMinisiteLang();
  const pageIsArabic = providerAr || (layout.site_settings as any)?.lang === 'ar';
  const typeLabel = (pageIsArabic ? business.type_name_ar || business.type_name : business.type_name) || '';

  let needsBrandHero = false;
  const instanceKeys: string[] = [];
  for (const comp of layout.components || []) {
    if (comp.type === 'vendor_hero' && mode === 'replace') needsBrandHero = true;
    if (comp.type !== 'vendor_carousel') continue;
    const carouselId = typeof comp.props?.carouselId === 'string' ? comp.props.carouselId.trim() : '';
    if (!carouselId || carouselId === brandHeroKey) {
      // Legacy block sharing the brand-hero key — served by the brand loader.
      needsBrandHero = true;
    } else {
      instanceKeys.push(carouselId);
    }
  }
  const uniqueInstanceKeys = Array.from(new Set(instanceKeys));
  const instanceKeysSignature = uniqueInstanceKeys.slice().sort().join('|');

  useEffect(() => {
    let cancelled = false;
    setBrandHeroSlides([]);
    setCarouselSlides({});

    const fetchSlides = async (siteId: string): Promise<any[]> => {
      const response = await fetch(`/api/jana/hero-carousel?siteId=${encodeURIComponent(siteId)}`);
      if (!response.ok) {
        console.error(`Failed to load minisite hero carousel ${siteId}: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data?.slides) ? data.slides : [];
    };

    const loadSlides = async () => {
      // 1. Per-instance carousel blocks: exactly one fetch per unique key.
      const loaded: Record<string, any[]> = {};
      await Promise.all(uniqueInstanceKeys.map(async siteId => {
        loaded[siteId] = await fetchSlides(siteId);
      }));
      if (cancelled) return;
      setCarouselSlides(loaded);

      // 2. Brand hero backdrop: main slides, then identity-tab slides, then
      //    approved section galleries. Later sources run only when the
      //    earlier ones come back empty.
      if (!needsBrandHero) return;
      let slides = await fetchSlides(brandHeroKey);
      if (slides.length === 0) {
        slides = await fetchSlides(brandHeroFallbackKey);
      }

      // Section-gallery photos are only a fallback for businesses without a
      // configured carousel. Merging them into an existing carousel made every
      // new section upload compete with (and visually displace) the real slides.
      if (slides.length === 0) {
        const rawData = business.custom_data || {};
        const sectionMetadata = rawData.section_content_meta || {};
        for (const [sectionId, sectionData] of Object.entries(rawData)) {
          if (!sectionData || typeof sectionData !== 'object') continue;
          const metadata = sectionMetadata[sectionId] || {};
          if (metadata.galleryStatus && metadata.galleryStatus !== 'approved') continue;
          if (metadata.galleryOnMinisite === false) continue;
          const section = sectionData as Record<string, any>;
          const gallery = Array.isArray(section.section_gallery)
            ? section.section_gallery
            : section.section_gallery ? [section.section_gallery] : [];
          for (const item of gallery) {
            const mediaUrl = typeof item === 'string' ? item : item?.url;
            if (typeof mediaUrl !== 'string' || !mediaUrl.trim()) continue;
            if (item?.approval_status && item.approval_status !== 'approved') continue;
            if (item?.show_on_minisite === false || item?.show_on_minisite === 0) continue;
            slides.push({
              id: item?.id || `${sectionId}-${slides.length}`,
              type: 'image',
              mediaUrl: mediaUrl.trim(),
              title: '',
              subtitle: '',
              showCaption: false,
            });
          }
        }
      }

      const uniqueSlides = slides.filter((slide, index, all) =>
        ['image', 'video', 'youtube', 'embed', 'branded'].includes(slide?.type) &&
        typeof slide.mediaUrl === 'string' &&
        slide.mediaUrl.trim() &&
        all.findIndex(candidate => candidate?.mediaUrl === slide.mediaUrl) === index
      );
      if (!cancelled) setBrandHeroSlides(uniqueSlides);
    };

    loadSlides().catch(error => {
      console.error('Failed to load minisite hero carousel:', error);
    });

    return () => {
      cancelled = true;
    };
    // instanceKeys/needsBrandHero re-derive from layout; the signature deps
    // summarize them so this runs once per distinct key set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id, instanceKeysSignature, needsBrandHero]);

  // The vendor_hero backdrop paints its own headline over the slides, so
  // per-slide captions are stripped here only; standalone carousel blocks
  // keep them. Memoized so the child's effect sees a stable identity.
  const heroBackdropSlides = useMemo(
    () =>
      brandHeroSlides.map(slide => ({
        ...slide,
        title: '',
        subtitle: '',
        caption: '',
        ctaLink: undefined,
        ctaText: undefined,
        showCaption: false,
      })),
    [brandHeroSlides]
  );

  const siteSettings = layout.site_settings || {};
  const primaryColor = siteSettings.primary_color || '#D4AF37';
  const bgColor = siteSettings.bg_color || '#090e17';
  const navBg = siteSettings.nav_bg_color || 'rgba(9, 14, 23, 0.85)';
  const textColor = siteSettings.text_color || '#f8fafc';

  // Extract vendor custom data for 'replace' mode
  const rawData = business.custom_data || {};
  const identity = {
    ...(rawData.basic || {}),
    ...(rawData.sec_1_identity || {}),
    ...(rawData.business_info || {}),
  };
  const customGallery = Object.entries(rawData).flatMap(([sectionId, sectionData]) => {
    if (!sectionData || typeof sectionData !== 'object') return [];
    const metadata = rawData.section_content_meta?.[sectionId] || {};
    if (metadata.galleryStatus !== undefined && metadata.galleryStatus !== 'approved') return [];
    if (metadata.galleryOnMinisite === false) return [];
    const section = sectionData as Record<string, any>;
    const gallery = section.section_gallery;
    const legacyGallery = section._media?.images;
    const items = Array.isArray(gallery) ? gallery : gallery ? [gallery] : [];
    const legacyItems = Array.isArray(legacyGallery) ? legacyGallery : [];
    return [...items, ...legacyItems]
      .map((item: any, index: number) => {
        const url = typeof item === 'string' ? item : item?.url;
        if (typeof url !== 'string' || !url.trim()) return null;
        return {
          ...(typeof item === 'object' && item ? item : {}),
          id: item?.id || `${sectionId}-custom-${index}`,
          url: url.trim(),
          caption: item?.caption || '',
        };
      })
      .filter(Boolean);
  });
  const galleryItems = [...(business.gallery || []), ...customGallery].filter(
    (item, index, items) =>
      items.findIndex(
        candidate =>
          candidate.url?.trim().replace(/\/$/, '').toLowerCase() ===
          item.url?.trim().replace(/\/$/, '').toLowerCase()
      ) === index
  );
  const logoUrl =
    siteSettings.logo_override ||
    identity.business_logo ||
    identity.logo ||
    identity.logo_url ||
    rawData.logo_url ||
    '';
  const coverUrl =
    siteSettings.cover_override ||
    identity.cover_image ||
    identity.hero_image ||
    identity.cover_image_url ||
    rawData.cover_image ||
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop';
  const phone = business.vendorPhone || identity.phone || identity.mobile || '';

  // Render individual component block
  const renderComponent = (comp: MinisiteLayoutComponent) => {
    const props = comp.props || {};

    switch (comp.type) {
      // ──────────────────────────────────────────────
      // 1. VENDOR HERO
      // ──────────────────────────────────────────────
      case 'vendor_hero': {
        const title =
          mode === 'untied'
            ? props.title || componentDefault('vendor_hero', 'title', pageIsArabic)
            : business.name || componentDefault('vendor_hero', 'title', pageIsArabic);
        const subtitle =
          mode === 'untied'
            ? props.subtitle || ''
            : identity.tagline ||
              identity.description?.substring(0, 180) ||
              typeLabel ||
              '';
        const heroCover = mode === 'untied' ? props.coverImage || coverUrl : coverUrl;
        const heroLogo = mode === 'untied' ? props.logoUrl || logoUrl : logoUrl;
        const ctaBtnText = props.ctaText || (phone ? 'Direct WhatsApp' : 'Get in Touch');
        const ctaBtnLink =
          props.ctaLink ||
          (phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : '#contact');

        return (
          <section
            key={comp.id}
            style={{
              position: 'relative',
              height: 'clamp(380px, 55vh, 600px)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: `linear-gradient(to bottom, rgba(9, 14, 23, 0.45), rgba(9, 14, 23, 0.9)), url(${heroCover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: 'clamp(2rem, 6vw, 4rem) 1.5rem',
              color: '#ffffff',
              textAlign: 'center',
            }}
          >
            {mode === 'replace' && heroBackdropSlides.length > 0 && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <AdvancedHeroCarousel
                  slides={heroBackdropSlides}
                  height="100%"
                  autoPlay
                  autoPlayInterval={6000}
                  showIndicators={heroBackdropSlides.length > 1}
                  showArrows={heroBackdropSlides.length > 1}
                  showProgress={heroBackdropSlides.length > 1}
                />
              </div>
            )}
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '850px', width: '100%', margin: '0 auto' }}>
              {heroLogo && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <img
                    src={heroLogo}
                    alt={title}
                    style={{
                      width: 'clamp(64px, 12vw, 100px)',
                      height: 'clamp(64px, 12vw, 100px)',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${primaryColor}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  />
                </div>
              )}
              {typeLabel && mode === 'replace' && (
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    letterSpacing: '3px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: primaryColor,
                    background: 'rgba(212, 175, 55, 0.12)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    marginBottom: '0.75rem',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                  }}
                >
                  {typeLabel}
                </div>
              )}
              <h1
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.6rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  marginBottom: '1rem',
                  lineHeight: 1.15,
                  textShadow: '0 4px 16px rgba(0,0,0,0.6)',
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  style={{
                    fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.6,
                    maxWidth: '680px',
                    margin: '0 auto 2rem',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  {subtitle}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href={ctaBtnLink}
                  target={ctaBtnLink.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: primaryColor,
                    color: '#000000',
                    fontWeight: 900,
                    padding: '0.85rem 1.8rem',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <i className="fab fa-whatsapp" /> {ctaBtnText}
                </a>
              </div>
            </div>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 2. VENDOR GALLERY
      // ──────────────────────────────────────────────
      case 'vendor_gallery': {
        const title = props.title || componentDefault('vendor_gallery', 'title', pageIsArabic);
        const subtitle = props.subtitle || componentDefault('vendor_gallery', 'subtitle', pageIsArabic);

        // Replace mode uses approved gallery items; untied uses props.images
        const sectionGalleryItems =
          mode === 'untied'
            ? Array.isArray(props.images)
              ? props.images.map((url: string, idx: number) => ({ id: idx, url, caption: '' }))
              : []
            : galleryItems;

        if (sectionGalleryItems.length === 0) return null;

        return (
          <section
            key={comp.id}
            style={{
              padding: 'clamp(3rem, 6vw, 5rem) 1.5rem',
              maxWidth: 1280,
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)',
                  fontWeight: 900,
                  color: textColor,
                  marginBottom: '0.5rem',
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {sectionGalleryItems.slice(0, 12).map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedImage(item.url)}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    aspectRatio: '4/3',
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.caption || 'Gallery photo'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                  />
                  {item.caption && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '0.75rem',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    >
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 3. VENDOR SERVICES & AMENITIES
      // ──────────────────────────────────────────────
      case 'vendor_services': {
        const title = props.title || componentDefault('vendor_services', 'title', pageIsArabic);
        const subtitle = props.subtitle || componentDefault('vendor_services', 'subtitle', pageIsArabic);

        let servicesList: string[] = [];
        if (mode === 'untied') {
          servicesList = Array.isArray(props.services) ? props.services : [];
        } else {
          const vibe = rawData.vibe || rawData.sec_3_services || {};
          const rawAmenities = vibe.amenities || identity.amenities || [];
          if (Array.isArray(rawAmenities)) {
            servicesList = rawAmenities.map((a: any) =>
              typeof a === 'object' ? a.name || a.label || JSON.stringify(a) : String(a)
            );
          } else if (typeof rawAmenities === 'string') {
            servicesList = rawAmenities.split(',').map((s) => s.trim());
          }
        }

        if (servicesList.length === 0) return null;

        return (
          <section
            key={comp.id}
            style={{
              padding: 'clamp(3rem, 6vw, 4.5rem) 1.5rem',
              maxWidth: 1100,
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
                  fontWeight: 900,
                  color: textColor,
                  marginBottom: '0.4rem',
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              {servicesList.map((service, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: textColor,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: `${primaryColor}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: primaryColor,
                      fontSize: '0.9rem',
                    }}
                  >
                    <i className="fas fa-check" />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{service}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 4. VENDOR PACKAGES & TOURS
      // ──────────────────────────────────────────────
      case 'vendor_packages': {
        const isArabic = pageIsArabic;
        // Default wording lives in the shared dictionary, not inline here — an
        // admin override (`props.title`) still wins over it.
        const title = props.title || componentDefault('vendor_packages', 'title', isArabic);
        const subtitle = props.subtitle || componentDefault('vendor_packages', 'subtitle', isArabic);
        const packages =
          mode === 'untied'
            ? Array.isArray(props.packages)
              ? props.packages
              : []
            : business.tourProducts || [];

        if (packages.length === 0) return null;

        const getCategoryMeta = (cat: string) => {
          const c = String(cat || '').toLowerCase();
          if (c.includes('hotel') || c.includes('lodge') || c.includes('camp') || c.includes('stay')) {
            return { icon: 'fa-hotel', label: isArabic ? 'إقامة فندقية' : 'Hotel Stay' };
          }
          if (c.includes('safari') || c.includes('transport') || c.includes('transfer') || c.includes('4x4')) {
            return { icon: 'fa-truck-monster', label: isArabic ? 'سفاري ونقل 4x4' : 'Safari & 4x4' };
          }
          if (c.includes('food') || c.includes('dining') || c.includes('restaurant') || c.includes('feast')) {
            return { icon: 'fa-utensils', label: isArabic ? 'طعام وعشاء بدوي' : 'Dining & Feast' };
          }
          if (c.includes('wellness') || c.includes('salt') || c.includes('spa') || c.includes('spring')) {
            return { icon: 'fa-spa', label: isArabic ? 'استشفاء وملاحات' : 'Wellness & Salt' };
          }
          if (c.includes('tour') || c.includes('operator') || c.includes('bundle') || c.includes('all-inclusive')) {
            return { icon: 'fa-compass', label: isArabic ? 'باقة سياحية شاملة' : 'Tour Operator Bundle' };
          }
          return { icon: 'fa-box-open', label: isArabic ? 'باقة مميزة' : 'Experience Offer' };
        };

        return (
          <section
            id="sec_5_experiences"
            key={comp.id}
            style={{
              padding: 'clamp(3rem, 6vw, 5rem) 1.5rem',
              maxWidth: 1280,
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: `${primaryColor}15`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}35`,
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                }}
              >
                <i className="fas fa-box-open" /> {isArabic ? 'باقات وبرامج وتجارب سياحية' : 'PACKAGES & ITINERARIES'}
              </div>
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.3rem)',
                  fontWeight: 900,
                  color: textColor,
                  margin: '0 0 0.5rem 0',
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', maxWidth: 640, margin: '0 auto' }}>
                  {subtitle}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '1.5rem',
              }}
            >
              {packages.map((pkg: any, idx: number) => {
                const pkgTitle = (isArabic && pkg.title_ar ? pkg.title_ar : pkg.title || pkg.name || 'Special Package');
                const pkgDesc = (isArabic && pkg.description_ar ? pkg.description_ar : pkg.description || '');
                const currentPrice = Number(pkg.price || pkg.package_price || pkg.base_price || 0);
                const originalPrice = Number(pkg.original_price || pkg.base_price || 0);
                const hasDiscount = originalPrice > currentPrice;
                const discountPct = pkg.savings_percentage || (hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);
                const catMeta = getCategoryMeta(pkg.category || pkg.vendor_category || pkg.package_type);
                const highlights: string[] = Array.isArray(pkg.highlights) ? pkg.highlights : (Array.isArray(pkg.inclusions) ? pkg.inclusions : []);
                const bookingPhone = (business.vendorPhone || identity.whatsapp || identity.phone || '').replace(/[^0-9]/g, '');
                const bookingText = encodeURIComponent(
                  isArabic
                    ? `مرحباً ${business.name}! أرغب في حجز والاستفسار عن: "${pkgTitle}" بسعر ${currentPrice} ${pkg.currency || 'EGP'}.`
                    : `Hello ${business.name}! I would like to book or inquire about: "${pkgTitle}" (${currentPrice} ${pkg.currency || 'EGP'}).`
                );
                const waUrl = bookingPhone ? `https://wa.me/${bookingPhone}?text=${bookingText}` : '#contact';

                return (
                  <div
                    key={pkg.id || idx}
                    style={{
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      position: 'relative',
                    }}
                  >
                    {/* Cover image or fallback badge */}
                    <div style={{ position: 'relative', height: '180px', background: '#090e17' }}>
                      {pkg.cover_image ? (
                        <img
                          src={pkg.cover_image}
                          alt={pkgTitle}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${primaryColor}60`, fontSize: '2.5rem' }}>
                          <i className={`fas ${catMeta.icon}`} />
                        </div>
                      )}

                      {/* Category Tag */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: isArabic ? 'auto' : '12px',
                          right: isArabic ? '12px' : 'auto',
                          background: 'rgba(15,23,42,0.85)',
                          backdropFilter: 'blur(8px)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <i className={`fas ${catMeta.icon}`} style={{ color: primaryColor }} />
                        {catMeta.label}
                      </div>

                      {/* Discount Badge */}
                      {discountPct > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: isArabic ? 'auto' : '12px',
                            left: isArabic ? '12px' : 'auto',
                            background: '#dc2626',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            boxShadow: '0 4px 10px rgba(220,38,38,0.4)',
                          }}
                        >
                          {discountPct}% {isArabic ? 'خصم' : 'OFF'}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          color: textColor,
                          margin: '0 0 0.5rem 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {pkgTitle}
                      </h3>

                      {pkgDesc && (
                        <p
                          style={{
                            fontSize: '0.84rem',
                            color: 'rgba(255,255,255,0.65)',
                            lineHeight: 1.6,
                            margin: '0 0 1rem 0',
                            flex: 1,
                          }}
                        >
                          {pkgDesc.length > 130 ? `${pkgDesc.substring(0, 130)}...` : pkgDesc}
                        </p>
                      )}

                      {/* Highlights */}
                      {highlights.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                          {highlights.slice(0, 3).map((hl: string, hIdx: number) => (
                            <span
                              key={hIdx}
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.85)',
                              }}
                            >
                              ✦ {hl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pricing & Booking CTA */}
                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '1rem',
                          borderTop: '1px solid rgba(255,255,255,0.07)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          {hasDiscount && originalPrice > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>
                              {originalPrice} {pkg.currency || 'EGP'}
                            </div>
                          )}
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: primaryColor }}>
                            {currentPrice > 0 ? `${currentPrice} ${pkg.currency || 'EGP'}` : (isArabic ? 'تواصل للسعر' : 'Inquire')}
                          </div>
                        </div>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            padding: '0.55rem 1.15rem',
                            borderRadius: '10px',
                            background: primaryColor,
                            color: '#000000',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: `0 4px 12px ${primaryColor}30`,
                            transition: 'transform 0.15s',
                          }}
                        >
                          <i className="fab fa-whatsapp" /> {isArabic ? 'احجز العرض' : 'Book Deal'}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 5. VENDOR BLOG & STORIES
      // ──────────────────────────────────────────────
      case 'vendor_blog': {
        const title = props.title || componentDefault('vendor_blog', 'title', pageIsArabic);
        const blogLayout = ['grid', 'list', 'featured', 'masonry', 'minimal'].includes(props.blogLayout)
          ? props.blogLayout
          : 'grid';
        const blogs =
          mode === 'untied'
            ? Array.isArray(props.posts)
              ? props.posts
              : []
            : business.blogs || [];

        if (blogs.length === 0) return null;

        return (
          <section
            key={comp.id}
            style={{
              padding: 'clamp(3rem, 6vw, 4.5rem) 1.5rem',
              maxWidth: 1200,
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
                  fontWeight: 900,
                  color: textColor,
                }}
              >
                {title}
              </h2>
            </div>
            <div
              style={{
                display: blogLayout === 'masonry' ? 'block' : 'grid',
                gridTemplateColumns: blogLayout === 'list' || blogLayout === 'minimal'
                  ? 'minmax(0, 1fr)'
                  : 'repeat(auto-fill, minmax(280px, 1fr))',
                columnCount: blogLayout === 'masonry' ? 3 : undefined,
                columnGap: blogLayout === 'masonry' ? '1.25rem' : undefined,
                gap: '1.25rem',
              }}
            >
              {blogs.map((b: any, idx: number) => (
                <div
                  key={b.id || idx}
                  lang={b.language || undefined}
                  dir={b.language === 'ar' ? 'rtl' : 'ltr'}
                  style={{
                    display: blogLayout === 'list' ? 'flex' : blogLayout === 'masonry' ? 'inline-block' : 'block',
                    width: blogLayout === 'masonry' ? '100%' : undefined,
                    breakInside: blogLayout === 'masonry' ? 'avoid' : undefined,
                    gridColumn: blogLayout === 'featured' && idx === 0 ? '1 / -1' : undefined,
                    padding: blogLayout === 'featured' && idx === 0 ? '2rem' : '1.5rem',
                    marginBottom: blogLayout === 'masonry' ? '1.25rem' : undefined,
                    borderRadius: blogLayout === 'minimal' ? 0 : 16,
                    background: blogLayout === 'minimal' ? 'transparent' : 'rgba(255,255,255,0.03)',
                    border: blogLayout === 'minimal' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {b.category_name && (
                    <div style={{ marginBottom: '0.55rem', color: textColor, fontSize: '0.7rem', fontWeight: 800, opacity: 0.7 }}>
                      {b.category_name}
                    </div>
                  )}
                  <h3
                    style={{
                      fontSize: blogLayout === 'featured' && idx === 0 ? '1.5rem' : '1.05rem',
                      fontWeight: 800,
                      color: textColor,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {b.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.65)',
                      lineHeight: 1.6,
                      marginBottom: 0,
                    }}
                  >
                    {b.excerpt || b.content?.substring(0, 130)}...
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 6. VENDOR PRIVATE CAROUSEL
      // ──────────────────────────────────────────────
      case 'vendor_carousel': {
        // Each carousel block can own its slide set; legacy layouts without a
        // carouselId keep the shared brand-hero key for backward compatibility.
        const carouselName =
          typeof props.carouselId === 'string' && props.carouselId.trim()
            ? props.carouselId.trim()
            : `biz_${business.id}_hero`;
        // Slides are pre-resolved by the parent effect (one fetch per key),
        // so the carousel never fetches again on mount. Nothing renders while
        // a key is unresolved — matching the previous loading behavior.
        const blockSlides =
          carouselName === brandHeroKey
            ? brandHeroSlides
            : carouselSlides[carouselName];
        if (!Array.isArray(blockSlides) || blockSlides.length === 0) {
          return null;
        }
        return (
          <section key={comp.id} style={{ position: 'relative' }}>
            <AdvancedHeroCarousel
              slides={blockSlides}
              height="clamp(420px, 60vh, 680px)"
              isDynamic={false}
              autoPlay={props.autoPlay !== false}
              autoPlayInterval={props.autoPlayInterval || 6000}
              showIndicators={props.showIndicators !== false}
              showArrows={props.showArrows !== false}
              showProgress={props.showProgress !== false}
            />
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 7. TEXT & STORY SECTION
      // ──────────────────────────────────────────────
      case 'text_section': {
        const title = props.title || componentDefault('text_section', 'title', pageIsArabic);
        const content =
          props.content ||
          (mode === 'replace'
            ? identity.description || identity.section_blog || componentDefault('text_section', 'content', pageIsArabic)
            : componentDefault('text_section', 'content', pageIsArabic));

        return (
          <section
            key={comp.id}
            style={{
              padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem',
              maxWidth: 850,
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            {title && (
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
                  fontWeight: 900,
                  color: textColor,
                  marginBottom: '1rem',
                }}
              >
                {title}
              </h2>
            )}
            <p
              style={{
                fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                lineHeight: 1.8,
                color: 'rgba(255,255,255,0.8)',
                whiteSpace: 'pre-line',
              }}
            >
              {content}
            </p>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 8. CTA CALLOUT
      // ──────────────────────────────────────────────
      case 'cta_section': {
        const title = props.title || componentDefault('cta_section', 'title', pageIsArabic);
        const description =
          props.description || componentDefault('cta_section', 'description', pageIsArabic);
        const btnText = props.buttonText || (phone ? componentDefault('cta_section', 'buttonText', pageIsArabic) : (pageIsArabic ? 'تواصل مع صاحب النشاط' : 'Contact Host'));
        const btnLink =
          props.buttonLink ||
          (phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : '#contact');

        return (
          <section
            id="sec_8_connector"
            key={comp.id}
            style={{
              padding: 'clamp(3rem, 6vw, 4.5rem) 1.5rem',
              maxWidth: 960,
              margin: '2rem auto',
            }}
          >
            <div
              style={{
                borderRadius: '24px',
                padding: 'clamp(2rem, 5vw, 3.5rem) 2rem',
                background: `linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(255,255,255,0.02))`,
                border: `1px solid ${primaryColor}40`,
                textAlign: 'center',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
                  fontWeight: 900,
                  color: '#ffffff',
                  marginBottom: '0.8rem',
                }}
              >
                {title}
              </h2>
              {description && (
                <p
                  style={{
                    color: 'rgba(255,255,255,0.75)',
                    maxWidth: 580,
                    margin: '0 auto 1.8rem',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                  }}
                >
                  {description}
                </p>
              )}
              <a
                href={btnLink}
                target={btnLink.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 2rem',
                  background: primaryColor,
                  color: '#000000',
                  fontWeight: 900,
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                {btnText}
              </a>
            </div>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 9. FAQ ACCORDION
      // ──────────────────────────────────────────────
      case 'faq': {
        const title = props.title || componentDefault('faq', 'title', pageIsArabic);
        const rawFaqs = Array.isArray(props.faqs)
          ? props.faqs
          : [
              {
                q: 'What is the best way to get here?',
                a: 'Siwa is accessible by private 4x4 or public bus from Cairo and Alexandria.',
              },
              {
                q: 'Are reservations required in advance?',
                a: 'Advance booking is strongly recommended during the high winter season.',
              },
            ];

        return (
          <section
            key={comp.id}
            style={{
              padding: 'clamp(3rem, 6vw, 4.5rem) 1.5rem',
              maxWidth: 820,
              margin: '0 auto',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 900,
                color: textColor,
                textAlign: 'center',
                marginBottom: '2rem',
              }}
            >
              {title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rawFaqs.map((faq: any, idx: number) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '1.15rem 1.4rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 700,
                        color: textColor,
                        fontSize: '0.95rem',
                      }}
                    >
                      <span>{faq.q || faq.question}</span>
                      <i
                        className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
                        style={{ color: primaryColor, fontSize: '0.8rem' }}
                      />
                    </div>
                    {isOpen && (
                      <p
                        style={{
                          margin: '0.8rem 0 0',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.88rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {faq.a || faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      // ──────────────────────────────────────────────
      // 10. TESTIMONIALS
      // ──────────────────────────────────────────────
      case 'testimonials': {
        const title = props.title || componentDefault('testimonials', 'title', pageIsArabic);
        const rawReviews = Array.isArray(props.testimonials)
          ? props.testimonials
          : [
              {
                name: 'Sarah M.',
                text: 'An exceptional experience immersed in the silence and timeless beauty of the oasis.',
                rating: 5,
              },
              {
                name: 'Tarek E.',
                text: 'Authentic architecture and warm hospitality that truly honors Siwan heritage.',
                rating: 5,
              },
            ];

        return (
          <section
            key={comp.id}
            style={{
              padding: 'clamp(3rem, 6vw, 4.5rem) 1.5rem',
              maxWidth: 1100,
              margin: '0 auto',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
                fontWeight: 900,
                color: textColor,
                textAlign: 'center',
                marginBottom: '2rem',
              }}
            >
              {title}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {rawReviews.map((rev: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.75rem',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                      fontSize: '0.92rem',
                      marginBottom: '1rem',
                    }}
                  >
                    &ldquo;{rev.text || rev.quote}&rdquo;
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: primaryColor, fontSize: '0.85rem' }}>
                      {rev.name || 'Visitor'}
                    </span>
                    <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>★★★★★</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bgColor,
        color: textColor,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Platform minimal navigation banner if enabled */}
      {siteSettings.show_platform_nav !== false && (
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(12px)',
            background: navBg,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 900,
              fontSize: '0.85rem',
              letterSpacing: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <i className="fas fa-sun" style={{ color: primaryColor }} />
            <span>SIWIFY</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/"
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Browse the marketplace
            </Link>
          </div>
        </nav>
      )}

      {/* Render All Layout Components */}
      <main>
        {Array.isArray(layout.components) &&
          layout.components.map((comp) => renderComponent(comp))}
      </main>

      {showQRCode && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
          <MinisiteQRCode businessName={business.name} slug={business.slug} businessId={business.id} src="qr" />
        </div>
      )}

      {/* Optional Platform Footer */}
      {siteSettings.show_platform_footer !== false && (
        <footer
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '1px',
          }}
        >
          <div>
            {pageIsArabic
              ? <>على منصة <strong style={{ color: primaryColor }}>SiWiFy</strong> — {minisiteLabel('platform_footer_tagline', true)}</>
              : <>Listed on <strong style={{ color: primaryColor }}>SiWiFy</strong> — {minisiteLabel('platform_footer_tagline', false)}</>}
          </div>
        </footer>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={selectedImage}
            alt="Enlarged preview"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        </div>
      )}
    </div>
  );
}
