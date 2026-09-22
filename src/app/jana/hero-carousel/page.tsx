'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  caption?: string;
  mediaUrl: string | null;
  type: 'image' | 'youtube' | 'video' | 'branded';
  ctaText?: string;
  ctaLink?: string;
  targetSectionId?: string;
  displayOrder: number;
  imageFit?: 'cover' | 'contain';
  imagePosition?: 'center' | 'top' | 'bottom';
  bgColor?: string;
  overlayOpacity?: number;
  animation?: string;
  // Text styling fields
  titleColor?: string;
  titleSize?: number;
  subtitleSize?: number;
  textAlign?: 'center' | 'left' | 'right';
  fontFamily?: string;
  // source tracks where this slide came from (for display only)
  _source?: 'manual' | 'business' | 'journey' | 'investment' | 'workflow';
  isOverride?: boolean;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:v=|v\/|vi\/|vi=|video\/|embed\/|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/shorts\/)([^#&?\s]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

type TargetScope = 'main' | 'minisite' | 'readymade';

interface DynamicBusinessSection {
  id: string;
  name: string;
  icon?: string;
  custom_label?: string;
  admin_hidden?: boolean;
  admin_disabled?: boolean;
}

const MAIN_PAGE_PRESETS = [
  { id: 'discovery', label: '🏠 Homepage', url: '/' },
  { id: 'main_hero', label: '🏠 Homepage (Main)', url: '/' },
  { id: 'accommodations_hero', label: '🏨 Accommodations & Lodges', url: '/accommodations' },
  { id: 'restaurants_hero', label: '🍴 Restaurants & Dining', url: '/restaurants' },
  { id: 'transportation_hero', label: '🚗 Transportation & 4x4', url: '/transportation' },
  { id: 'activities_hero', label: '🐪 Activities & Safari', url: '/activities' },
  { id: 'food-beverage_hero', label: '🍽️ Food & Dining', url: '/food-beverage' },
  { id: 'crafts-wellness_hero', label: '🧂 Crafts & Wellness', url: '/crafts-wellness' },
  { id: 'production-trade_hero', label: '🌴 Production & Trade', url: '/production-trade' },
  { id: 'services_hero', label: '🏛️ Services Hub', url: '/services' },
  { id: 'journeys_hero', label: '✈️ Journeys & Tours', url: '/journeys' },
  { id: 'offers_hero', label: '🎁 Special Offers', url: '/offers' },
  { id: 'packages_hero', label: '📦 Travel Packages', url: '/packages' },
  { id: 'discounts_hero', label: '💰 Seasonal Discounts', url: '/discounts' },
  { id: 'auctions_hero', label: '🔨 Live Auctions', url: '/auctions' },
  { id: 'investment-opportunities_hero', label: '💎 Investment Deals', url: '/investment-opportunities' },
  { id: 'blog_hero', label: '📰 Stories & Blog', url: '/blog' },
  { id: 'be-a-partner_hero', label: '🤝 Be a Partner', url: '/be-a-partner' },
  { id: 'categories_hero', label: '🗺️ Category Taxonomy', url: '/categories' },
  { id: 'search_hero', label: '🔍 Search & Compare', url: '/discovery/compare' },
];

const READYMADE_PAGE_PRESETS = [
  { id: 'orchestrator_home', label: '⚡ Orchestrator Dynamic Home', url: '/p/main' },
  { id: 'search_hub', label: '🧭 Discovery Hub Page', url: '/p/search' },
  { id: 'landing_exclusive', label: '🌟 Exclusive Member Landing', url: '/p/exclusive' },
];

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  manual:     { label: '⭐ Manual',     color: '#D4AF37', bg: 'rgba(212,175,55,0.15)' },
  business:   { label: '🏢 Business',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  journey:    { label: '✈️ Journey',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  investment: { label: '💼 Investment', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  workflow:   { label: '📋 Workflow',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

const DEFAULT_STARTER_SLIDES: Record<string, Array<Omit<CarouselSlide, 'id' | 'displayOrder'>>> = {
  activities_hero: [
    {
      title: 'Desert Safaris & Great Sand Sea',
      subtitle: 'Experience towering golden dunes, 4x4 dune bashing, and desert expeditions in Siwa',
      caption: 'Adrenaline & Nature',
      mediaUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1600',
      type: 'image',
      ctaText: 'Explore Safaris',
      ctaLink: '/activities',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
    {
      title: 'Salt Lakes & Ancient Oasis Springs',
      subtitle: 'Float effortlessly in crystal hyper-saline waters and Cleopatra natural bath',
      caption: 'Natural Healing',
      mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600',
      type: 'image',
      ctaText: 'Discover Springs',
      ctaLink: '/activities',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
    {
      title: 'Shali Fortress & Historical Walks',
      subtitle: 'Uncover centuries of authentic Berber architecture, ancient oracles, and sacred tombs',
      caption: 'Heritage & Culture',
      mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1600',
      type: 'image',
      ctaText: 'View Tours',
      ctaLink: '/activities',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  accommodations_hero: [
    {
      title: 'Authentic Eco-Lodges & Salt Rock Retreats',
      subtitle: 'Traditional architecture handcrafted from natural Kershef and palm trunks',
      caption: 'Serene Stays',
      mediaUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfe4c?q=80&w=1600',
      type: 'image',
      ctaText: 'Browse Lodges',
      ctaLink: '/accommodations',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
    {
      title: 'Desert Camps Under the Starlit Sky',
      subtitle: 'Fall asleep under the Milky Way in comfortable desert camp retreats',
      caption: 'Desert Glamping',
      mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600',
      type: 'image',
      ctaText: 'Explore Camps',
      ctaLink: '/accommodations',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  transportation_hero: [
    {
      title: '4x4 Desert Transport & Private Dune Cruisers',
      subtitle: 'Expert local drivers for desert expeditions, dune safaris, and transfers',
      caption: 'Safe & Reliable',
      mediaUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1600',
      type: 'image',
      ctaText: 'Book Transport',
      ctaLink: '/transportation',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  'food-beverage_hero': [
    {
      title: 'Siwan Gastronomy & Bedouin Feasts',
      subtitle: 'Taste authentic Siwan recipes, fresh date delicacies, and wood-fired dishes',
      caption: 'Flavors of Siwa',
      mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600',
      type: 'image',
      ctaText: 'Discover Dining',
      ctaLink: '/food-beverage',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  restaurants_hero: [
    {
      title: 'Authentic Siwan Dining & Desert Feasts',
      subtitle: 'Taste authentic Siwan recipes, fresh date delicacies, and wood-fired dishes',
      caption: 'Flavours of Siwa',
      mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600',
      type: 'image',
      ctaText: 'Discover Restaurants',
      ctaLink: '/restaurants',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  'crafts-wellness_hero': [
    {
      title: 'Therapeutic Salt Caves & Natural Wellness',
      subtitle: 'Rejuvenate with ancient salt therapies, hot sand baths, and natural herbs',
      caption: 'Holistic Wellness',
      mediaUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600',
      type: 'image',
      ctaText: 'Explore Wellness',
      ctaLink: '/crafts-wellness',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  'production-trade_hero': [
    {
      title: 'Siwan Organic Dates & Pure Olive Oil',
      subtitle: 'Finest organic produce harvested directly from heritage Siwa palm groves',
      caption: 'Organic Heritage',
      mediaUrl: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=1600',
      type: 'image',
      ctaText: 'View Products',
      ctaLink: '/production-trade',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  services_hero: [
    {
      title: 'Verified Businesses & Local Guides Directory',
      subtitle: 'Find licensed local operators, artisans, logistics, and concierge services',
      caption: 'Trusted Partners',
      mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600',
      type: 'image',
      ctaText: 'Browse Directory',
      ctaLink: '/services',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  journeys_hero: [
    {
      title: 'Curated Siwa Expeditions & Multi-Day Itineraries',
      subtitle: 'Handcrafted itineraries tailored to your pace, vibe, and travel duration',
      caption: 'Tailored Expeditions',
      mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600',
      type: 'image',
      ctaText: 'Start Planning',
      ctaLink: '/journeys',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  offers_hero: [
    {
      title: 'Exclusive Deals & Seasonal Offers in Siwa',
      subtitle: 'Unlock special promotions and discounted packages from top local providers',
      caption: 'Special Savings',
      mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600',
      type: 'image',
      ctaText: 'View Offers',
      ctaLink: '/offers',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  packages_hero: [
    {
      title: 'All-Inclusive Travel Packages & Desert Tours',
      subtitle: 'Complete bundles combining lodging, 4x4 safaris, dining, and local guides',
      caption: 'Curated Experiences',
      mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600',
      type: 'image',
      ctaText: 'Explore Packages',
      ctaLink: '/packages',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  discounts_hero: [
    {
      title: 'Seasonal Discounts & Group Promotions',
      subtitle: 'Save on excursions, stays, and activities across the oasis',
      caption: 'Seasonal Discounts',
      mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600',
      type: 'image',
      ctaText: 'Browse Discounts',
      ctaLink: '/discounts',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  auctions_hero: [
    {
      title: 'Live & Upcoming Oasis Auctions',
      subtitle: 'Bid on unique experiences, prime dates harvest, artisan crafts, and stays',
      caption: 'Live Bidding',
      mediaUrl: 'https://images.unsplash.com/photo-1579618218290-24a26f634559?q=80&w=1600',
      type: 'image',
      ctaText: 'Join Auctions',
      ctaLink: '/auctions',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  'investment-opportunities_hero': [
    {
      title: 'Heritage Investment & Partnership Opportunities',
      subtitle: 'Discover sustainable eco-tourism, hospitality, and agriculture ventures in Siwa',
      caption: 'Oasis Opportunities',
      mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600',
      type: 'image',
      ctaText: 'Explore Investments',
      ctaLink: '/investment-opportunities',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  blog_hero: [
    {
      title: 'Siwa Stories & Cultural Chronicles',
      subtitle: 'Articles, traveler guides, traditions, and historical narratives from the oasis',
      caption: 'Oasis Stories',
      mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1600',
      type: 'image',
      ctaText: 'Read Stories',
      ctaLink: '/blog',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  'be-a-partner_hero': [
    {
      title: 'Grow Your Business in Siwa Oasis',
      subtitle: 'Join the premier digital marketplace for hotels, camps, restaurants, and safaris',
      caption: 'Vendor Ecosystem',
      mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600',
      type: 'image',
      ctaText: 'Join as Partner',
      ctaLink: '/be-a-partner#register',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
  categories_hero: [
    {
      title: 'Explore Siwa by Category & Atmosphere',
      subtitle: 'Navigate accommodations, dining, desert safaris, wellness, and trade',
      caption: 'Full Taxonomy',
      mediaUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1600',
      type: 'image',
      ctaText: 'Browse Categories',
      ctaLink: '/categories',
      overlayOpacity: 0.4,
      animation: 'kenburns',
    },
  ],
};

function HeroCarouselManagerContent() {
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<{ id: string; name: string; slug?: string; type_id?: string }[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string; slug?: string; type_id?: string } | null>(null);
  const [dynamicMainPages, setDynamicMainPages] = useState<{ slug: string; title: string }[]>([]);
  const [businessSections, setBusinessSections] = useState<DynamicBusinessSection[]>([]);
  const [loadingBusinessSections, setLoadingBusinessSections] = useState(false);

  const initialSiteId = searchParams?.get('siteId') || 'discovery';
  const initialBusinessId = searchParams?.get('businessId') || (
    initialSiteId.startsWith('biz_') 
      ? initialSiteId.replace(/^biz_/, '').replace(/_tab_.*$/, '').replace(/_hero$/, '')
      : ''
  );

  const initialScope: TargetScope = (searchParams?.get('targetScope') as TargetScope) || (
    initialBusinessId ? 'minisite' : (initialSiteId.startsWith('readymade_') ? 'readymade' : 'main')
  );

  const initialTab = searchParams?.get('minisiteTab') || (
    initialSiteId.includes('_tab_') ? initialSiteId.split('_tab_')[1]?.replace(/_hero$/, '') : 'main'
  );

  const [targetScope, setTargetScope] = useState<TargetScope>(initialScope);
  const [mainPagePreset, setMainPagePreset] = useState(searchParams?.get('mainPreset') || (initialScope === 'main' ? initialSiteId : 'discovery'));
  const [customMainPath, setCustomMainPath] = useState(searchParams?.get('customMainPath') || '');
  const [businessId, setBusinessId] = useState(initialBusinessId);
  const [minisiteTab, setMinisiteTab] = useState(initialTab);
  const [customMinisiteTab, setCustomMinisiteTab] = useState(searchParams?.get('customMinisiteTab') || '');
  const [readyMadeId, setReadyMadeId] = useState(searchParams?.get('readyMadeId') || (initialSiteId.startsWith('readymade_') ? initialSiteId.replace(/^readymade_/, '') : 'orchestrator_home'));
  const [customReadyMadePath, setCustomReadyMadePath] = useState(searchParams?.get('customReadyMadePath') || '');

  const [allSlides, setAllSlides] = useState<CarouselSlide[]>([]);
  const [deletedDynamicIds, setDeletedDynamicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [availableSections, setAvailableSections] = useState<{id:string;name:string}[]>([]);

  // Dynamically load real business sections, custom labels, and controls for the selected business
  useEffect(() => {
    if (!businessId) {
      setBusinessSections([]);
      return;
    }
    let isMounted = true;
    setLoadingBusinessSections(true);

    Promise.all([
      fetch(`/api/jana/businesses?id=${encodeURIComponent(businessId)}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/admin/businesses/${encodeURIComponent(businessId)}/section-controls`).then(r => r.ok ? r.json() : null),
    ]).then(async ([bizData, controlsData]) => {
      if (!isMounted || !bizData) {
        if (isMounted) {
          setBusinessSections([]);
          setLoadingBusinessSections(false);
        }
        return;
      }
      const typeId = bizData.type_id;
      const controls: Record<string, any> = {};
      (controlsData?.controls || []).forEach((c: any) => { controls[c.section_id] = c; });
      const customLabels = bizData.custom_data?.section_labels || bizData.custom_data?.basic?.section_labels || {};

      let rawSections: any[] = [];
      if (typeId) {
        try {
          const secRes = await fetch(`/api/jana/sections?type=${encodeURIComponent(typeId)}`);
          if (secRes.ok) {
            rawSections = await secRes.json();
          }
        } catch {}
      }

      const activeSections: DynamicBusinessSection[] = (Array.isArray(rawSections) ? rawSections : [])
        .filter((s: any) => {
          const ctrl = controls[s.id];
          return !ctrl?.admin_hidden && !ctrl?.admin_disabled;
        })
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          icon: s.icon || 'fa-layer-group',
          custom_label: controls[s.id]?.custom_label || customLabels[s.id] || s.name,
          admin_hidden: !!controls[s.id]?.admin_hidden,
          admin_disabled: !!controls[s.id]?.admin_disabled,
        }));

      if (isMounted) {
        setBusinessSections(activeSections);
        setLoadingBusinessSections(false);
      }
    }).catch(() => {
      if (isMounted) {
        setBusinessSections([]);
        setLoadingBusinessSections(false);
      }
    });

    return () => { isMounted = false; };
  }, [businessId]);

  const computedMinisiteTabs = React.useMemo(() => {
    const tabs: { id: string; label: string; icon: string; tabParam: string }[] = [
      { id: 'main', label: '🏠 Main Minisite Hero Banner', icon: 'fa-home', tabParam: '' }
    ];
    businessSections.forEach(sec => {
      tabs.push({
        id: sec.id,
        label: sec.custom_label || sec.name,
        icon: sec.icon || 'fa-layer-group',
        tabParam: sec.id
      });
    });
    tabs.push({ id: 'custom', label: '✍️ Custom Tab', icon: 'fa-pen', tabParam: '' });
    return tabs;
  }, [businessSections]);

  const getCarouselTarget = () => {
    if (targetScope === 'minisite') {
      const biz = businesses.find(b => b.id === businessId);
      const bizName = biz ? biz.name : (businessId ? `Minisite ${businessId}` : 'Select Vendor Minisite');
      const slugPath = biz ? (biz.slug ? `/${biz.slug}` : `/business/${biz.id}`) : `/business/${businessId || 'id'}`;

      let tabQuery = '';
      let tabLabel = 'Main Minisite Hero';
      let tabSuffix = 'hero';

      if (minisiteTab === 'custom') {
        const cleanCustom = customMinisiteTab.trim().toLowerCase();
        tabQuery = cleanCustom ? `?tab=${cleanCustom}` : '';
        tabLabel = cleanCustom ? `Custom Tab (${cleanCustom})` : 'Custom Tab';
        tabSuffix = cleanCustom ? `tab_${cleanCustom}_hero` : 'hero';
      } else if (minisiteTab && minisiteTab !== 'main') {
        const foundSec = businessSections.find(s => s.id === minisiteTab);
        tabQuery = `#${minisiteTab}`;
        tabLabel = foundSec ? (foundSec.custom_label || foundSec.name) : `Section: ${minisiteTab}`;
        tabSuffix = `tab_${minisiteTab}_hero`;
      }

      const siteId = businessId ? `biz_${businessId}_${tabSuffix}` : 'discovery';
      const url = `${slugPath}${tabQuery}`;
      const title = biz ? `${biz.name} — ${tabLabel}` : 'Vendor Minisite Carousel';

      return { siteId, url, title, scopeLabel: '🏢 Vendor Business Minisite', bizName, tabLabel };
    }

    if (targetScope === 'readymade') {
      const isCustom = customReadyMadePath.trim().length > 0;
      const key = isCustom ? customReadyMadePath.trim() : readyMadeId;
      const url = key.startsWith('/') ? key : `/p/${key.replace(/^p\//, '')}`;
      const cleanKey = key.replace(/^\//, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const siteId = `readymade_${cleanKey}`;
      const presetFound = READYMADE_PAGE_PRESETS.find(p => p.id === readyMadeId);
      const title = isCustom ? `Exclusive Dynamic Page (${key})` : (presetFound ? presetFound.label : `Ready-Made Page (${key})`);

      return { siteId, url, title, scopeLabel: '🚀 Exclusive Standalone Page' };
    }

    // Main website scope
    if (customMainPath.trim()) {
      const cleanPath = customMainPath.trim().startsWith('/') ? customMainPath.trim() : `/${customMainPath.trim()}`;
      const slugKey = cleanPath.replace(/^\//, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      return {
        siteId: `page_${slugKey}`,
        url: cleanPath,
        title: `Main Website Custom Page (${cleanPath})`,
        scopeLabel: '🏠 Main Website Page',
      };
    }

    const preset = MAIN_PAGE_PRESETS.find(p => p.id === mainPagePreset);
    if (preset) {
      return {
        siteId: preset.id,
        url: preset.url,
        title: `Main Website: ${preset.label}`,
        scopeLabel: '🏠 Main Website Page',
      };
    }

    if (mainPagePreset && mainPagePreset !== 'discovery') {
      const cleanSlug = mainPagePreset.replace(/_hero$/, '');
      return {
        siteId: mainPagePreset,
        url: `/${cleanSlug}`,
        title: `Main Website: ${cleanSlug.replace(/-/g, ' ')}`,
        scopeLabel: '🏠 Main Website Page',
      };
    }

    return {
      siteId: MAIN_PAGE_PRESETS[0].id,
      url: MAIN_PAGE_PRESETS[0].url,
      title: `Main Website: ${MAIN_PAGE_PRESETS[0].label}`,
      scopeLabel: '🏠 Main Website Page',
    };
  };

  const currentTarget = getCarouselTarget();
  const siteId = currentTarget.siteId;
  const previewHref = currentTarget.url;

  const updateUrlState = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('targetScope', targetScope);
    params.set('siteId', currentTarget.siteId);
    if (targetScope === 'main') {
      params.set('mainPreset', mainPagePreset);
      if (customMainPath) params.set('customMainPath', customMainPath);
    } else if (targetScope === 'minisite') {
      if (businessId) params.set('businessId', businessId);
      params.set('minisiteTab', minisiteTab);
      if (customMinisiteTab) params.set('customMinisiteTab', customMinisiteTab);
    } else if (targetScope === 'readymade') {
      params.set('readyMadeId', readyMadeId);
      if (customReadyMadePath) params.set('customReadyMadePath', customReadyMadePath);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  useEffect(() => {
    updateUrlState();
  }, [targetScope, mainPagePreset, customMainPath, businessId, minisiteTab, customMinisiteTab, readyMadeId, customReadyMadePath]);

  const defaultFormData: Partial<CarouselSlide> = {
    title: '',
    subtitle: '',
    caption: '',
    mediaUrl: '',
    type: 'image',
    ctaText: '',
    ctaLink: '',
    displayOrder: 0,
    imageFit: 'cover',
    imagePosition: 'center',
    bgColor: '#000000',
    overlayOpacity: 0.4,
    animation: 'kenburns',
    titleColor: '#FFFFFF',
    titleSize: 0,
    subtitleSize: 0,
    textAlign: 'center',
    fontFamily: '',
  };

  const [formData, setFormData] = useState<Partial<CarouselSlide>>(defaultFormData);

  const showMsg = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 6000);
  };

  useEffect(() => {
    fetch('/api/jana/businesses')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const nextBusinesses = Array.isArray(data)
          ? data.map((business: any) => ({ id: business.id, name: business.name, slug: business.slug }))
          : [];
        setBusinesses(nextBusinesses);
        setSelectedBusiness(nextBusinesses.find(business => business.id === businessId) || null);
      })
      .catch(() => setBusinesses([]));
  }, [businessId]);

  useEffect(() => {
    setSelectedBusiness(businesses.find(business => business.id === businessId) || null);
  }, [businesses, businessId]);

  const loadAllSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/hero-carousel?siteId=${encodeURIComponent(siteId)}`);
      if (res.ok) {
        const data = await res.json();
        const fetched: CarouselSlide[] = (data.slides || []).map((s: any, i: number) => ({
          ...s,
          displayOrder: s.displayOrder ?? i,
          // Trust _source from API first; only fall back to id-prefix detection for legacy slides
          _source: s._source || (
            s.id?.startsWith('slide_') ? 'manual' :
            s.id?.startsWith('business_') ? 'business' :
            s.id?.startsWith('journey_') ? 'journey' :
            s.id?.startsWith('investment_') ? 'investment' :
            s.id?.startsWith('workflow_') ? 'workflow' : 'manual'
          ),
        }));
        setAllSlides(fetched);
        setDeletedDynamicIds(data.deletedDynamicIds || []);
      }
    } catch (err) {
      showMsg('error', 'Failed to load slides');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { loadAllSlides(); }, [loadAllSlides]);

  // Save the FULL carousel config (all slides the admin sees), along with deletedDynamicIds
  const saveSlideConfig = async (slides: CarouselSlide[], deletedIds: string[] = deletedDynamicIds) => {
    const slidesToSave = slides.map(({ _source, ...s }, idx) => ({
      ...s,
      displayOrder: idx
    }));

    const res = await fetch('/api/jana/hero-carousel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        slides: slidesToSave, 
        deletedDynamicIds: deletedIds, 
        siteId
      }),
    });
    return res.ok;
  };

  const handleDelete = async (slide: CarouselSlide) => {
    if (!confirm(`Remove "${slide.title}" from the carousel?`)) return;

    const isDynamic = slide.id.startsWith('business_') || 
                      slide.id.startsWith('journey_') || 
                      slide.id.startsWith('investment_') || 
                      slide.id.startsWith('workflow_');

    const newDeletedIds = isDynamic 
      ? [...deletedDynamicIds.filter(id => id !== slide.id), slide.id] 
      : deletedDynamicIds;

    if (isDynamic) {
      setDeletedDynamicIds(newDeletedIds);
    }

    const updatedSlides = allSlides.filter(s => s.id !== slide.id);
    const reIndexed = updatedSlides.map((s, idx) => ({ ...s, displayOrder: idx }));
    setAllSlides(reIndexed);

    const ok = await saveSlideConfig(reIndexed, newDeletedIds);
    if (ok) {
      showMsg('success', `"${slide.title}" removed from carousel.`);
      loadAllSlides();
    } else {
      showMsg('error', 'Failed to save changes');
      loadAllSlides(); // revert
    }
  };

  const handleGenerateStarterSlides = async () => {
    const starters = DEFAULT_STARTER_SLIDES[siteId] || [
      {
        title: `${currentTarget.title}`,
        subtitle: 'Experience authentic desert hospitality and curated adventures in Siwa Oasis',
        caption: 'Siwa Oasis',
        mediaUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1600',
        type: 'image' as const,
        ctaText: 'Explore Now',
        ctaLink: previewHref,
        overlayOpacity: 0.4,
        animation: 'kenburns',
      }
    ];

    const generated: CarouselSlide[] = starters.map((s, idx) => ({
      id: `slide_${Date.now()}_${idx}`,
      title: s.title,
      subtitle: s.subtitle,
      caption: s.caption,
      mediaUrl: s.mediaUrl,
      type: s.type || 'image',
      ctaText: s.ctaText,
      ctaLink: s.ctaLink,
      displayOrder: idx,
      _source: 'manual',
      imageFit: 'cover',
      imagePosition: 'center',
      bgColor: '#000000',
      overlayOpacity: s.overlayOpacity ?? 0.4,
      animation: s.animation || 'kenburns',
      titleColor: '#FFFFFF',
      titleSize: 0,
      subtitleSize: 0,
      textAlign: 'center',
    }));

    setSaving(true);
    setAllSlides(generated);
    const ok = await saveSlideConfig(generated);
    setSaving(false);
    if (ok) {
      showMsg('success', `✨ Generated ${generated.length} starter slides for ${currentTarget.title}!`);
      loadAllSlides();
    } else {
      showMsg('error', 'Failed to save starter slides');
    }
  };

  const handleMoveSlide = async (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === allSlides.length - 1) return;
    const next = [...allSlides];
    const target = dir === 'up' ? index - 1 : index + 1;
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((s, i) => ({ ...s, displayOrder: i }));
    setAllSlides(reordered);
    // For reorder we only need to save the manual slides (auto slides keep their own order from DB)
    await saveSlideConfig(reordered);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSaving(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        
        // 1. Instant client preview so user sees it right away
        const clientPreviewUrl = URL.createObjectURL(file);
        const derivedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        setShowForm(true);
        setFormData(prev => ({
          ...prev,
          mediaUrl: clientPreviewUrl,
          type: isVideo ? 'video' : 'image',
          title: prev.title?.trim() ? prev.title : derivedTitle,
        }));

        // 2. Perform background upload to server/Cloudinary
        const fd = new FormData();
        fd.append('file', file);
        fd.append('businessName', currentTarget.bizName || currentTarget.title || 'General');
        fd.append('sectionName', currentTarget.tabLabel ? `Hero ${currentTarget.tabLabel}` : 'Hero');
        
        const res = await fetch('/api/jana/media/upload', { method: 'POST', body: fd });
        const data = await res.json();

        if (!res.ok) {
          const message = data?.error || 'Upload failed. Check file type or auth.';
          showMsg('error', message);
          continue;
        }

        const fileUrl = data.url || data.localUrl || clientPreviewUrl;
        if (!fileUrl) {
          showMsg('error', 'Upload succeeded but no URL was returned.');
          continue;
        }

        setFormData(prev => ({
          ...prev,
          mediaUrl: fileUrl,
          type: isVideo ? 'video' : 'image',
        }));
        showMsg('success', `✅ ${isVideo ? 'Video' : 'Image'} ready! Click "+ Add to Carousel" (or "Update Slide") below to save.`);
      }
    } catch (err: any) {
      showMsg('error', err?.message || 'Upload failed');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleQuickUploadNewSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSaving(true);
    try {
      const newCreatedSlides: CarouselSlide[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        const derivedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        const fd = new FormData();
        fd.append('file', file);
        fd.append('businessName', currentTarget.bizName || currentTarget.title || 'General');
        fd.append('sectionName', currentTarget.tabLabel ? `Hero ${currentTarget.tabLabel}` : 'Hero');

        const res = await fetch('/api/jana/media/upload', { method: 'POST', body: fd });
        const data = await res.json();

        if (!res.ok) {
          showMsg('error', data?.error || 'Upload failed');
          continue;
        }

        const fileUrl = data.url || data.localUrl || '';
        if (fileUrl) {
          newCreatedSlides.push({
            id: `slide_${Date.now()}_${i}`,
            title: derivedTitle,
            subtitle: `Welcome to ${currentTarget.title}`,
            caption: currentTarget.title,
            mediaUrl: fileUrl,
            type: isVideo ? 'video' : 'image',
            ctaText: 'Explore',
            ctaLink: previewHref,
            displayOrder: allSlides.length + newCreatedSlides.length,
            _source: 'manual',
            imageFit: 'cover',
            imagePosition: 'center',
            bgColor: '#000000',
            overlayOpacity: 0.4,
            animation: 'kenburns',
            titleColor: '#FFFFFF',
            titleSize: 0,
            subtitleSize: 0,
            textAlign: 'center',
          });
        }
      }

      if (newCreatedSlides.length > 0) {
        const updated = [...allSlides, ...newCreatedSlides].map((s, idx) => ({ ...s, displayOrder: idx }));
        setAllSlides(updated);
        const ok = await saveSlideConfig(updated);
        if (ok) {
          showMsg('success', `✨ Added ${newCreatedSlides.length} new slide(s) to ${currentTarget.title}!`);
          loadAllSlides();
        } else {
          showMsg('error', 'Failed to save slide config');
        }
      }
    } catch (err: any) {
      showMsg('error', err?.message || 'Quick upload failed');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) { showMsg('error', 'Title is required'); return; }
    if (formData.type !== 'branded' && !formData.mediaUrl?.trim()) {
      showMsg('error', 'Media URL is required for image/video/YouTube slides'); return;
    }
    if (formData.type === 'youtube') {
      const ytId = extractYouTubeId(formData.mediaUrl || '');
      if (!ytId) { showMsg('error', 'Invalid YouTube URL. Paste the full video URL.'); return; }
    }

    setSaving(true);
    try {
      let updated: CarouselSlide[];
      if (editingId) {
        const isDynamic = !editingId.startsWith('slide_');
        updated = allSlides.map(s =>
          s.id === editingId
            ? {
                ...s,
                ...formData,
                id: editingId,
                ...(isDynamic ? { isOverride: true } : {}),
                imageFit: (formData.imageFit as 'cover' | 'contain' | undefined) || s.imageFit || 'cover',
                imagePosition: (formData.imagePosition as 'center' | 'top' | 'bottom' | undefined) || s.imagePosition || 'center',
              } as CarouselSlide
            : s
        );
      } else {
        const newSlide: CarouselSlide = {
          ...formData,
          id: `slide_${Date.now()}`,
          title: formData.title!,
          mediaUrl: formData.mediaUrl || null,
          type: formData.type || 'image',
          displayOrder: allSlides.length,
          _source: 'manual',
          imageFit: (formData.imageFit as 'cover' | 'contain' | undefined) || 'cover',
          imagePosition: (formData.imagePosition as 'center' | 'top' | 'bottom' | undefined) || 'center',
        };
        updated = [...allSlides, newSlide];
      }
      const reIndexed = updated.map((s, i) => ({ ...s, displayOrder: i }));
      setAllSlides(reIndexed);
      const ok = await saveSlideConfig(reIndexed);
      if (ok) {
        showMsg('success', editingId ? '✅ Slide updated and saved!' : '✅ Slide added to carousel!');
        setShowForm(false);
        setEditingId(null);
        loadAllSlides();
      } else {
        showMsg('error', 'Failed to save — check your connection and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (slide: CarouselSlide) => {
    setFormData({
      ...defaultFormData,
      ...slide,
      mediaUrl: slide.mediaUrl || '',
      displayOrder: slide.displayOrder ?? allSlides.length,
    });
    setEditingId(slide.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      ...defaultFormData,
      displayOrder: allSlides.length,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const ytPreviewId = formData.type === 'youtube' ? extractYouTubeId(formData.mediaUrl || '') : null;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '1rem 0', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div className="carousel-header-row" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/jana" style={{ color: '#d97706', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>
              ← ADMIN DASHBOARD
            </Link>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '0.35rem 0 0', letterSpacing: '-0.5px' }}>
              🎬 Hero Carousel Manager
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Targeting: <strong style={{ color: '#d97706' }}>{currentTarget.title}</strong> (`{siteId}`)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <a 
              href={previewHref} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <i className="fas fa-external-link-alt" style={{ color: '#d97706' }} /> Open Target Page: {previewHref}
            </a>
            <div style={{ position: 'relative' }}>
              <button style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(217,119,6,0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-upload" /> {saving ? 'Uploading...' : 'Quick Upload from Device'}
              </button>
              <input type="file" accept="image/*,video/*" multiple onChange={handleQuickUploadNewSlide} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            </div>
            {!showForm && (
              <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
                + Add Custom Slide
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Carousel Target Scope Toolbar */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          {/* Header Row & Target Destination Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
              <i className="fas fa-crosshairs" style={{ color: '#d97706' }} /> DYNAMIC CAROUSEL TARGET SELECTOR
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748b' }}>
              <span>Live Destination:</span>
              <a href={previewHref} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'underline' }}>
                https://siwify.com{previewHref}
              </a>
            </div>
          </div>

          {/* Scope Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {[
              { id: 'main', label: '🏠 Main Website Pages', icon: 'fa-globe' },
              { id: 'minisite', label: '🏢 Vendor Business Minisites & Tabs', icon: 'fa-store' },
              { id: 'readymade', label: '🚀 Dynamic Ready-Made & Exclusive Pages', icon: 'fa-bolt' },
            ].map(tab => {
              const isActive = targetScope === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTargetScope(tab.id as TargetScope);
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#0f172a' : '#64748b',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <i className={`fas ${tab.icon}`} style={{ color: isActive ? '#d97706' : '#94a3b8' }} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sub-controls based on Target Scope */}
          {targetScope === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                Select Main Website Target Page:
              </div>

              {/* Main Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {MAIN_PAGE_PRESETS.map(preset => {
                  const isActive = !customMainPath && mainPagePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setCustomMainPath('');
                        setMainPagePreset(preset.id);
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isActive ? '#d97706' : '#cbd5e1',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: isActive ? '#fffdf5' : '#ffffff',
                        color: isActive ? '#d97706' : '#334155',
                        boxShadow: isActive ? '0 2px 6px rgba(217,119,6,0.12)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Pages / Custom Main Path */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {dynamicMainPages.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                    <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>⚡ Dynamic Page:</span>
                    <select
                      value={mainPagePreset}
                      onChange={e => {
                        setCustomMainPath('');
                        setMainPagePreset(e.target.value);
                      }}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }}
                    >
                      <option value="discovery">-- Select Orchestrator Page --</option>
                      {dynamicMainPages.map(dp => (
                        <option key={dp.slug} value={`page_${dp.slug}`}>
                          {dp.title} (`/${dp.slug}`)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                  <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>✏️ Custom Main Route:</span>
                  <input
                    type="text"
                    placeholder="e.g. /events or /exclusive-deals"
                    value={customMainPath}
                    onChange={e => setCustomMainPath(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }}
                  />
                  {customMainPath && (
                    <button onClick={() => setCustomMainPath('')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}>Clear</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {targetScope === 'minisite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {/* Business Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#0f172a', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap' }}>1. Select Minisite Business:</span>
                <select
                  value={businessId}
                  onChange={e => {
                    const nextBusinessId = e.target.value;
                    setBusinessId(nextBusinessId);
                    setSelectedBusiness(businesses.find(business => business.id === nextBusinessId) || null);
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  style={{ flex: 1, minWidth: '260px', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: businessId ? '#fffdf5' : '#ffffff', color: businessId ? '#d97706' : '#0f172a', fontWeight: 800, outline: 'none' }}
                >
                  <option value="">-- Choose Vendor Minisite Business --</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} ({b.slug ? `/${b.slug}` : `/business/${b.id}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Minisite Tab / Sub-Page Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800 }}>
                    2. Select Minisite Hero or Dynamic Section:
                  </span>
                  {loadingBusinessSections && (
                    <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700 }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.35rem' }} /> Loading business sections...
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {computedMinisiteTabs.map(tab => {
                    const isActive = minisiteTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setMinisiteTab(tab.id);
                          setShowForm(false);
                          setEditingId(null);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: isActive ? '#d97706' : '#cbd5e1',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: isActive ? '#d97706' : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          transition: 'all 0.2s',
                        }}
                      >
                        {tab.icon && <i className={`fas ${tab.icon}`} style={{ fontSize: '0.75rem', opacity: isActive ? 1 : 0.7 }} />}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {minisiteTab === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', maxWidth: '380px' }}>
                    <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800 }}>Custom Tab Key:</span>
                    <input
                      type="text"
                      placeholder="e.g. booking or menu"
                      value={customMinisiteTab}
                      onChange={e => setCustomMinisiteTab(e.target.value)}
                      style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {targetScope === 'readymade' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                Select Exclusive Dynamic Page / Standalone Landing:
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
                  <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>🚀 Preset Page:</span>
                  <select
                    value={readyMadeId}
                    onChange={e => {
                      setCustomReadyMadePath('');
                      setReadyMadeId(e.target.value);
                    }}
                    style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }}
                  >
                    {READYMADE_PAGE_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>{p.label} (`{p.url}`)</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                  <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>✏️ Custom Page Route:</span>
                  <input
                    type="text"
                    placeholder="e.g. /p/vip-landing or /custom-hero"
                    value={customReadyMadePath}
                    onChange={e => setCustomReadyMadePath(e.target.value)}
                    style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }}
                  />
                  {customReadyMadePath && (
                    <button onClick={() => setCustomReadyMadePath('')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}>Clear</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Target Active Status Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fffdf5', borderRadius: '10px', border: '1px dashed #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#d97706', fontWeight: 900 }}>{currentTarget.scopeLabel}:</span>
              <span style={{ color: '#0f172a', fontWeight: 800 }}>{currentTarget.title}</span>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>DB Storage Key: <code style={{ color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>hero_carousel_{siteId}</code></span>
            </div>
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#059669', fontWeight: 800, fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ecfdf5', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}
            >
              <i className="fas fa-play" /> Live Preview: {previewHref}
            </a>
          </div>

        </div>

        {/* Message */}
        {message.text && (
          <div style={{ padding: '1rem 1.5rem', borderRadius: '10px', marginBottom: '1.5rem', background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`, color: message.type === 'error' ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
            {message.text}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#0f172a', fontWeight: 900, margin: 0 }}>{editingId ? '✏️ Edit Slide' : '+ New Slide'}</h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
            </div>

            <div className="carousel-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* TYPE */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>SLIDE TYPE</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['image', 'youtube', 'video', 'branded'] as const).map(t => (
                    <button key={t} onClick={() => setFormData(p => ({ ...p, type: t }))}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '2px solid', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s',
                        borderColor: formData.type === t ? '#d97706' : '#cbd5e1',
                        background: formData.type === t ? '#fffdf5' : '#ffffff',
                        color: formData.type === t ? '#d97706' : '#64748b' }}>
                      {t === 'image' ? '🖼 Image' : t === 'youtube' ? '▶ YouTube' : t === 'video' ? '🎥 Video' : '✨ Text/Branded'}
                    </button>
                  ))}
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TITLE *</label>
                <input value={formData.title || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Discover Siwa Oasis"
                  style={{ width: '100%', padding: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* SUBTITLE */}
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>SUBTITLE</label>
                <input value={formData.subtitle || ''} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Short description"
                  style={{ width: '100%', padding: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* CAPTION */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>CAPTION (Badge label shown above title)</label>
                <input value={formData.caption || ''} onChange={e => setFormData(p => ({ ...p, caption: e.target.value }))}
                  placeholder="e.g. FEATURED · SIWA OASIS"
                  style={{ width: '100%', padding: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* TARGET SECTION (manual or picker) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TARGET SECTION (optional)</label>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <input value={formData.targetSectionId || ''} onChange={e => setFormData(p => ({ ...p, targetSectionId: e.target.value }))}
                    placeholder="Enter element id (e.g. offers, gallery) or pick below"
                    style={{ flex: 1, padding: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }} />
                  <button type="button" onClick={async () => {
                    // Load sections and open picker
                    try {
                      const res = await fetch('/api/jana/page-sections?slug=main');
                      if (res.ok) {
                        const data = await res.json();
                        setAvailableSections(data.sections || []);
                      } else {
                        setAvailableSections([]);
                      }
                    } catch (e) { setAvailableSections([]); }
                    setShowSectionPicker(true);
                  }} style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Select</button>
                  {formData.targetSectionId && (
                    <button onClick={() => setFormData(p => ({ ...p, targetSectionId: '' }))} style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b', padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer' }}>Clear</button>
                  )}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                  If set, clicking the slide CTA or navigating to this slide (via arrows) will scroll the visitor to the selected section on the homepage.
                </div>
              </div>

              {/* MEDIA URL / YOUTUBE URL */}
              {formData.type !== 'branded' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                    {formData.type === 'youtube' ? 'YOUTUBE URL (paste the full video link)' : 'MEDIA URL / UPLOAD'}
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input value={formData.mediaUrl || ''} onChange={e => setFormData(p => ({ ...p, mediaUrl: e.target.value }))}
                      placeholder={formData.type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                      style={{ flex: 1, padding: '0.75rem', background: '#ffffff', border: `1px solid ${formData.type === 'youtube' && formData.mediaUrl && !extractYouTubeId(formData.mediaUrl) ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', color: '#0f172a', outline: 'none' }} />
                    {formData.type !== 'youtube' && (
                      <>
                        <div style={{ position: 'relative' }}>
                          <button style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {saving ? '...' : '⬆ Upload'}
                          </button>
                          <input type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            📷 Camera
                          </button>
                          <input type="file" accept="image/*,video/*" capture="environment" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </div>
                      </>
                    )}
                  </div>
                  {/* YouTube validation feedback */}
                  {formData.type === 'youtube' && formData.mediaUrl && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: extractYouTubeId(formData.mediaUrl) ? '#10b981' : '#ef4444' }}>
                      {extractYouTubeId(formData.mediaUrl) ? `✅ Valid YouTube ID: ${extractYouTubeId(formData.mediaUrl)}` : '❌ Cannot extract YouTube ID — check the URL format'}
                    </div>
                  )}
                  {/* YouTube preview thumbnail */}
                  {ytPreviewId && (
                    <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', maxWidth: 320, position: 'relative' }}>
                      <img src={`https://img.youtube.com/vi/${ytPreviewId}/hqdefault.jpg`} alt="YouTube thumbnail" style={{ width: '100%', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 50, height: 36, background: 'rgba(255,0,0,0.85)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 6, left: 8, background: 'rgba(0,0,0,0.7)', color: '#10b981', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>✓ YOUTUBE PREVIEW</div>
                    </div>
                  )}

                  {(formData.type === 'image' || formData.type === 'video') && formData.mediaUrl && (
                    <div style={{ marginTop: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', padding: '0.75rem', maxWidth: 420, background: '#0f172a' }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>{formData.type === 'video' ? 'Uploaded video preview' : 'Uploaded image preview'}</div>
                      {formData.type === 'video' ? (
                        <video controls src={formData.mediaUrl} style={{ width: '100%', borderRadius: 10, maxHeight: 280, background: '#000' }} />
                      ) : (
                        <img src={formData.mediaUrl} alt="Uploaded preview" style={{ width: '100%', borderRadius: 10, objectFit: 'contain', maxHeight: 280 }} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {(formData.type === 'image' || formData.type === 'video') && (
                <>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>IMAGE FIT</label>
                    <select value={formData.imageFit || 'cover'} onChange={e => setFormData(p => ({ ...p, imageFit: e.target.value as 'cover' | 'contain' }))}
                      style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="cover">Cover (fill placeholder)</option>
                      <option value="contain">Contain (show full image)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>IMAGE POSITION</label>
                    <select value={formData.imagePosition || 'center'} onChange={e => setFormData(p => ({ ...p, imagePosition: e.target.value as 'center' | 'top' | 'bottom' }))}
                      style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                </>
              )}

              {/* CTA */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>BUTTON TEXT</label>
                <input value={formData.ctaText || ''} onChange={e => setFormData(p => ({ ...p, ctaText: e.target.value }))}
                  placeholder="e.g. Explore Now"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>BUTTON LINK</label>
                <input value={formData.ctaLink || ''} onChange={e => setFormData(p => ({ ...p, ctaLink: e.target.value }))}
                  placeholder="/search/vibe"
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* ANIMATION + OVERLAY */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>ANIMATION</label>
                <select value={formData.animation || 'kenburns'} onChange={e => setFormData(p => ({ ...p, animation: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                  <option value="kenburns">Ken Burns (Cinematic Zoom)</option>
                  <option value="fade">Fade</option>
                  <option value="zoom">Zoom</option>
                  <option value="slide">Slide</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>OVERLAY DARKNESS (0–1)</label>
                <input type="range" min="0" max="1" step="0.05" value={formData.overlayOpacity ?? 0.4} onChange={e => setFormData(p => ({ ...p, overlayOpacity: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#D4AF37' }} />
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{Math.round((formData.overlayOpacity ?? 0.4) * 100)}% dark overlay</div>
              </div>

              {/* ── TEXT STYLING ─────────────────────────────────────── */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>🎨 TEXT STYLING</div>
                <div className="carousel-text-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TITLE COLOR</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="color" value={formData.titleColor || '#FFFFFF'} onChange={e => setFormData(p => ({ ...p, titleColor: e.target.value }))}
                        style={{ width: 44, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                      <input value={formData.titleColor || '#FFFFFF'} onChange={e => setFormData(p => ({ ...p, titleColor: e.target.value }))}
                        style={{ flex: 1, padding: '0.5rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TEXT ALIGNMENT</label>
                    <select value={formData.textAlign || 'center'} onChange={e => setFormData(p => ({ ...p, textAlign: e.target.value as 'center'|'left'|'right' }))}
                      style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="center">⊙ Center</option>
                      <option value="left">⇐ Left</option>
                      <option value="right">⇒ Right</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>FONT FAMILY</label>
                    <select value={formData.fontFamily || ''} onChange={e => setFormData(p => ({ ...p, fontFamily: e.target.value }))}
                      style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="">Default (Inherit)</option>
                      <option value="'Inter', sans-serif">Inter (Modern)</option>
                      <option value="'Playfair Display', serif">Playfair Display (Elegant)</option>
                      <option value="'Outfit', sans-serif">Outfit (Clean)</option>
                      <option value="'Cinzel', serif">Cinzel (Luxury)</option>
                      <option value="'Lora', serif">Lora (Classic)</option>
                      <option value="'Montserrat', sans-serif">Montserrat (Bold)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>TITLE SIZE (rem, 0=auto)</label>
                    <input type="number" min="0" max="10" step="0.5" value={formData.titleSize || 0} onChange={e => setFormData(p => ({ ...p, titleSize: parseFloat(e.target.value) || 0 }))}
                      placeholder="0 = auto" style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>SUBTITLE SIZE (rem, 0=auto)</label>
                    <input type="number" min="0" max="5" step="0.25" value={formData.subtitleSize || 0} onChange={e => setFormData(p => ({ ...p, subtitleSize: parseFloat(e.target.value) || 0 }))}
                      placeholder="0 = auto" style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>PREVIEW</label>
                      <div style={{ padding: '0.5rem 0.75rem', background: formData.bgColor || '#1e293b', borderRadius: 8, textAlign: formData.textAlign || 'center', fontFamily: formData.fontFamily || 'inherit' }}>
                        <div style={{ color: formData.titleColor || '#fff', fontWeight: 900, fontSize: formData.titleSize ? `${formData.titleSize}rem` : '1rem' }}>Title Preview</div>
                        <div style={{ color: '#ccc', fontSize: formData.subtitleSize ? `${formData.subtitleSize}rem` : '0.7rem', marginTop: 2 }}>Subtitle preview</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section picker modal */}
            {showSectionPicker && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
                <div style={{ width: 720, maxWidth: '95%', background: '#0b1220', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#fff' }}>Select Page Section</strong>
                    <button onClick={() => setShowSectionPicker(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
                    {availableSections.length === 0 && (
                      <div style={{ color: '#94a3b8', padding: '1rem' }}>No sections found for this page.</div>
                    )}
                    {availableSections.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 700 }}>{s.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{s.id}</div>
                        </div>
                        <div>
                          <button onClick={() => { setFormData(p => ({ ...p, targetSectionId: s.id })); setShowSectionPicker(false); }} style={{ background: '#D4AF37', color: '#071025', border: 'none', padding: '0.45rem 0.8rem', borderRadius: 8, cursor: 'pointer' }}>Choose</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.9rem 2rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingId ? '✓ Update Slide' : '+ Add to Carousel'}
              </button>
              <button onClick={resetForm}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.9rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Live Interactive Preview Player */}
        {!loading && allSlides.length > 0 && (
          <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.25)', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem' }}>
                  🎬 Live Carousel Preview: {selectedBusiness ? selectedBusiness.name : 'Homepage Discovery'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '12px' }}>
                  Slide {((previewIndex % allSlides.length) + 1)} of {allSlides.length}
                </span>
              </div>
              <a href={previewHref} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>
                Open Full Page →
              </a>
            </div>

            {(() => {
              const currentSlide = allSlides[previewIndex % allSlides.length] || allSlides[0];
              const ytId = currentSlide.type === 'youtube' ? extractYouTubeId(currentSlide.mediaUrl || '') : null;

              return (
                <div style={{ position: 'relative', height: '320px', background: currentSlide.bgColor || '#050b14', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {/* Media background */}
                  {currentSlide.type === 'youtube' && ytId ? (
                    <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                  ) : currentSlide.type === 'image' && currentSlide.mediaUrl ? (
                    <img src={currentSlide.mediaUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: currentSlide.imageFit || 'cover', objectPosition: currentSlide.imagePosition || 'center', opacity: 0.85 }} />
                  ) : currentSlide.type === 'video' && currentSlide.mediaUrl ? (
                    <video src={currentSlide.mediaUrl} autoPlay loop muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: currentSlide.imageFit || 'cover', objectPosition: currentSlide.imagePosition || 'center' }} />
                  ) : null}

                  {/* Darkness overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${currentSlide.overlayOpacity ?? 0.4})` }} />

                  {/* Slide Content */}
                  <div style={{ position: 'relative', zIndex: 2, padding: '2rem', textAlign: currentSlide.textAlign || 'center', maxWidth: '700px', width: '100%', fontFamily: currentSlide.fontFamily || 'inherit' }}>
                    {currentSlide.caption && (
                      <div style={{ display: 'inline-block', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px', marginBottom: '0.6rem' }}>
                        {currentSlide.caption}
                      </div>
                    )}
                    <h2 style={{ color: currentSlide.titleColor || '#FFFFFF', fontSize: currentSlide.titleSize ? `${currentSlide.titleSize}rem` : '1.8rem', fontWeight: 900, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
                      {currentSlide.title}
                    </h2>
                    {currentSlide.subtitle && (
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: currentSlide.subtitleSize ? `${currentSlide.subtitleSize}rem` : '0.95rem', margin: '0.5rem 0 0', textShadow: '0 1px 5px rgba(0,0,0,0.7)' }}>
                        {currentSlide.subtitle}
                      </p>
                    )}
                    {currentSlide.ctaText && (
                      <div style={{ marginTop: '1.25rem' }}>
                        <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #D4AF37, #f0c842)', color: '#0f172a', fontWeight: 900, padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.8rem', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}>
                          {currentSlide.ctaText} →
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Left / Right Nav Arrows */}
                  <button
                    onClick={() => setPreviewIndex(prev => (prev - 1 + allSlides.length) % allSlides.length)}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setPreviewIndex(prev => (prev + 1) % allSlides.length)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ›
                  </button>

                  {/* Dot Indicators */}
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.4rem', zIndex: 3 }}>
                    {allSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewIndex(idx)}
                        style={{ width: (previewIndex % allSlides.length) === idx ? 24 : 8, height: 8, borderRadius: 4, background: (previewIndex % allSlides.length) === idx ? '#D4AF37' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Slides List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }} />
            <p style={{ marginTop: '1rem' }}>Loading all carousel slides...</p>
          </div>
        ) : allSlides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff', borderRadius: '16px', border: '2px dashed #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
            <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 900, margin: '0 0 0.5rem' }}>
              No Custom Carousel Slides for {currentTarget.title} Yet
            </h3>
            <p style={{ maxWidth: 640, margin: '0 auto 1.5rem', fontSize: '0.85rem', lineHeight: 1.6, color: '#64748b' }}>
              The live public page at <strong style={{ color: '#d97706' }}>{previewHref}</strong> currently displays the clean static <strong style={{ color: '#0f172a' }}>Thematic Category Banner</strong>.
              Add slides or generate curated starter slides to activate the full-screen cinematic slideshow on that page!
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <button
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <i className="fas fa-upload" /> {saving ? 'Uploading...' : 'Quick Upload from Device'}
                </button>
                <input type="file" accept="image/*,video/*" multiple onChange={handleQuickUploadNewSlide} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
              <button
                onClick={handleGenerateStarterSlides}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(217,119,6,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <i className="fas fa-magic" /> {saving ? 'Generating...' : 'Generate Curated Starter Slides'}
              </button>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                + Add Custom Slide
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>{allSlides.length} slides · exactly as they appear on the homepage</span>
            </div>

            {/* ⚠️ Warning if slide #1 is YouTube/video */}
            {allSlides[0] && (allSlides[0].type === 'youtube' || allSlides[0].type === 'video') && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                  <div>
                    <div style={{ color: '#fcd34d', fontWeight: 800, fontSize: '0.85rem' }}>⚡ Performance Tip</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      Your first slide is a <strong style={{ color: '#fcd34d' }}>{allSlides[0].type.toUpperCase()}</strong> — this causes a loading delay on page open because the browser needs time to connect to YouTube. Put an image or text slide first for instant loading.
                    </div>
                  </div>
                </div>
                {allSlides.length > 1 && (
                  <button
                    onClick={async () => {
                      const next = [...allSlides];
                      [next[0], next[1]] = [next[1], next[0]];
                      const reordered = next.map((s, i) => ({ ...s, displayOrder: i }));
                      setAllSlides(reordered);
                      await saveSlideConfig(reordered);
                      showMsg('success', '✅ Fixed! YouTube slide moved to position 2. Fast image is now first.');
                    }}
                    style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    ⚡ Quick Fix — Move to Position 2
                  </button>
                )}
              </div>
            )}

            {allSlides.map((slide, index) => {
              const src = SOURCE_LABELS[slide._source || 'manual'] || SOURCE_LABELS.manual;
              const ytId = slide.type === 'youtube' ? extractYouTubeId(slide.mediaUrl || '') : null;
              return (
                <div key={slide.id}
                  className="carousel-slide-row"
                  style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '52px 90px 1fr auto', gap: '1rem', alignItems: 'center', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>

                  {/* Order controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                    <button onClick={() => handleMoveSlide(index, 'up')} disabled={index === 0}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: index === 0 ? '#334155' : '#94a3b8', borderRadius: '6px', width: 28, height: 28, cursor: index === 0 ? 'default' : 'pointer', fontWeight: 900 }}>▲</button>
                    <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.8rem' }}>{index + 1}</span>
                    <button onClick={() => handleMoveSlide(index, 'down')} disabled={index === allSlides.length - 1}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: index === allSlides.length - 1 ? '#334155' : '#94a3b8', borderRadius: '6px', width: 28, height: 28, cursor: index === allSlides.length - 1 ? 'default' : 'pointer', fontWeight: 900 }}>▼</button>
                  </div>

                  {/* Preview */}
                  <div style={{ width: 90, height: 60, borderRadius: '8px', overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                    {slide.type === 'youtube' && ytId ? (
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : slide.type === 'image' && slide.mediaUrl ? (
                      <img src={slide.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: slide.imageFit || 'cover', objectPosition: slide.imagePosition || 'center' }} />
                    ) : slide.type === 'video' && slide.mediaUrl ? (
                      <video src={slide.mediaUrl} muted style={{ width: '100%', height: '100%', objectFit: slide.imageFit || 'cover', objectPosition: slide.imagePosition || 'center' }} />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <h3 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '0.95rem' }}>{slide.title}</h3>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: src.bg, color: src.color }}>{src.label}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>{slide.type.toUpperCase()}</span>
                    </div>
                    {slide.subtitle && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>{slide.subtitle}</p>}
                    {(slide.type === 'image' || slide.type === 'video') && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>Fit: {slide.imageFit || 'cover'}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>Position: {slide.imagePosition || 'center'}</span>
                      </div>
                    )}
                    {slide.type === 'youtube' && (
                      <p style={{ color: ytId ? '#10b981' : '#ef4444', fontSize: '0.7rem', margin: '0.25rem 0 0', fontWeight: 700 }}>
                        {ytId ? `✅ YouTube ID: ${ytId}` : `❌ Invalid YouTube URL: ${slide.mediaUrl}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="carousel-slide-actions" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={() => startEdit(slide)}
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(slide)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      🗑 Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div style={{ marginTop: '2rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: '#D4AF37' }}>⭐ Manual slides</strong> are ones you added here. 
            <strong style={{ color: '#3b82f6' }}> 🏢 Business</strong>, 
            <strong style={{ color: '#10b981' }}> ✈️ Journey</strong>, 
            <strong style={{ color: '#8b5cf6' }}> 💼 Investment</strong> slides come from your database.
            <strong style={{ color: '#f59e0b' }}> 📋 Workflow</strong> slides are default placeholders (only shown when no manual slides exist).
            <br/>
            Once you save a slide here, the carousel goes into <strong style={{ color: '#D4AF37' }}>full manual mode</strong> — you control every slide shown.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HeroCarouselManager() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0f172a', color: '#D4AF37', display: 'grid', placeItems: 'center', fontWeight: 800 }}>Loading carousel manager...</div>}>
      <HeroCarouselManagerContent />
    </Suspense>
  );
}
