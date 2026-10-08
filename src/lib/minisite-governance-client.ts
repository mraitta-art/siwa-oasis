/**
 * minisite-governance-client.ts
 *
 * CLIENT-SAFE constants extracted from minisite-governance.ts.
 * This file has ZERO server-side imports (no db, no mysql2).
 * Safe to import in 'use client' components.
 */

export type MinisiteMode = 'replace' | 'untied';
export type MinisiteTier = 'free' | 'standard' | 'premium' | 'admin';

export type MinisiteComponentType =
  | 'vendor_hero'
  | 'vendor_gallery'
  | 'vendor_services'
  | 'vendor_packages'
  | 'vendor_blog'
  | 'vendor_carousel'
  | 'text_section'
  | 'cta_section'
  | 'faq'
  | 'testimonials'
  | 'auctions_feed';

export interface MinisiteLayoutComponent {
  id: string;
  type: MinisiteComponentType;
  props: Record<string, unknown>;
  order: number;
}

export interface MinisiteSiteSettings {
  primary_color?: string;
  bg_color?: string;
  nav_bg_color?: string;
  text_color?: string;
  logo_override?: string;
  cover_override?: string;
  show_platform_nav?: boolean;
  show_platform_footer?: boolean;
  cta_text?: string;
  cta_link?: string;
}

export interface MinisiteLayout {
  mode: MinisiteMode;
  components: MinisiteLayoutComponent[];
  site_settings?: MinisiteSiteSettings;
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_TIER_RULES: Record<MinisiteTier, MinisiteComponentType[]> = {
  free: [
    'vendor_hero',
    'vendor_gallery',
    'vendor_services',
    'vendor_blog',
    'vendor_packages',
    'text_section',
    'cta_section',
    'faq',
    'testimonials',
  ],
  standard: [
    'vendor_hero',
    'vendor_gallery',
    'vendor_services',
    'vendor_blog',
    'vendor_packages',
    'text_section',
    'cta_section',
    'faq',
    'testimonials',
  ],
  premium: [
    'vendor_hero',
    'vendor_gallery',
    'vendor_services',
    'vendor_blog',
    'vendor_packages',
    'vendor_carousel',
    'text_section',
    'cta_section',
    'faq',
    'testimonials',
  ],
  admin: [
    'vendor_hero',
    'vendor_gallery',
    'vendor_services',
    'vendor_blog',
    'vendor_packages',
    'vendor_carousel',
    'text_section',
    'cta_section',
    'faq',
    'testimonials',
    'auctions_feed',
  ],
};

export const COMPONENT_META: Record<
  MinisiteComponentType,
  { label: string; icon: string; description: string; vendorScoped: boolean; tier: MinisiteTier; mainSitePages: string[]; canonicalSections: string[] }
> = {
  vendor_hero: {
    label: 'Brand Hero & Cover',
    icon: 'fa-id-card',
    description: 'Header with logo, banner, rating, verified badge, and contact action.',
    vendorScoped: true,
    tier: 'free',
    mainSitePages: ['/'],
    canonicalSections: ['sec_1_identity'],
  },
  vendor_gallery: {
    label: 'Visual Media Gallery',
    icon: 'fa-images',
    description: 'Responsive media grid showcasing vendor photographs and spaces.',
    vendorScoped: true,
    tier: 'free',
    mainSitePages: ['/'],
    canonicalSections: ['sec_1_identity', 'sec_2_ambience', 'sec_3_facilities', 'sec_4_gastronomy', 'sec_5_experiences', 'sec_9_marketplace_catalog'],
  },
  text_section: {
    label: 'Narrative & Rich Text',
    icon: 'fa-align-left',
    description: 'Custom rich text, story block, or about paragraph.',
    vendorScoped: false,
    tier: 'free',
    mainSitePages: ['*'],
    canonicalSections: ['sec_1_identity', 'sec_2_ambience', 'sec_3_facilities', 'sec_4_gastronomy', 'sec_6_guardian', 'sec_7_investment', 'sec_8_connector', 'sec_9_marketplace_catalog', 'sec_10_testimonials_faqs'],
  },
  cta_section: {
    label: 'Direct Action & Deals Banner',
    icon: 'fa-bullhorn',
    description: 'Special promotional offers, discounts, or direct WhatsApp booking action.',
    vendorScoped: false,
    tier: 'free',
    mainSitePages: ['/offers', '*'],
    canonicalSections: ['sec_8_connector', 'sec_1_identity'],
  },
  vendor_services: {
    label: 'Service & Amenity Cards',
    icon: 'fa-concierge-bell',
    description: 'Curated list of amenities, features, or core service offerings.',
    vendorScoped: true,
    tier: 'free',
    mainSitePages: ['/accommodations', '/services'],
    canonicalSections: ['sec_3_facilities', 'sec_4_gastronomy'],
  },
  vendor_packages: {
    label: 'Packages & Itineraries',
    icon: 'fa-box-open',
    description: 'Bookable tour packages, desert safaris, and multi-day travel itineraries.',
    vendorScoped: true,
    tier: 'free',
    mainSitePages: ['/packages'],
    canonicalSections: ['sec_5_experiences'],
  },
  vendor_blog: {
    label: 'Stories & Insights',
    icon: 'fa-newspaper',
    description: 'Published articles, updates, and desert guides by this vendor.',
    vendorScoped: true,
    tier: 'free',
    mainSitePages: ['/blog'],
    canonicalSections: ['sec_1_identity', 'sec_2_ambience', 'sec_4_gastronomy', 'sec_5_experiences', 'sec_6_guardian', 'sec_7_investment', 'sec_9_marketplace_catalog'],
  },
  faq: {
    label: 'Accordion FAQ',
    icon: 'fa-circle-question',
    description: 'Frequently asked questions with expandable answers.',
    vendorScoped: false,
    tier: 'free',
    mainSitePages: ['*'],
    canonicalSections: ['sec_6_guardian', 'sec_10_testimonials_faqs'],
  },
  testimonials: {
    label: 'Endorsements & Reviews',
    icon: 'fa-quote-left',
    description: 'Client reviews, trust quotes, and guest experiences.',
    vendorScoped: false,
    tier: 'free',
    mainSitePages: ['*'],
    canonicalSections: ['sec_10_testimonials_faqs'],
  },
  vendor_carousel: {
    label: 'Private Hero Carousel',
    icon: 'fa-film',
    description: 'Cinematic sliding carousel isolated specifically to this vendor.',
    vendorScoped: true,
    tier: 'premium',
    mainSitePages: ['*'],
    canonicalSections: ['sec_2_ambience'],
  },
  auctions_feed: {
    label: 'Commercial Deals & Auction',
    icon: 'fa-gavel',
    description: 'Platform commercial auction feeds or exclusive bids.',
    vendorScoped: false,
    tier: 'admin',
    mainSitePages: ['/investment-opportunities', '/offers'],
    canonicalSections: ['sec_7_investment'],
  },
};

/** Canonical section label map for bridge display */
export const CANONICAL_SECTION_LABELS: Record<string, { label: string; emoji: string; color: string; mainSiteUrl: string }> = {
  sec_1_identity:            { label: 'Identity & Overview',        emoji: '🏷️', color: '#2563eb', mainSiteUrl: '/' },
  sec_2_ambience:            { label: 'Vibe & Ambience',            emoji: '✨', color: '#f59e0b', mainSiteUrl: '/activities' },
  sec_3_facilities:          { label: 'Facilities & Amenities',     emoji: '🏢', color: '#0ea5e9', mainSiteUrl: '/accommodations' },
  sec_4_gastronomy:          { label: 'Services & Gastronomy',      emoji: '🛠️', color: '#f97316', mainSiteUrl: '/restaurants' },
  sec_5_experiences:         { label: 'Programs & Packages',        emoji: '🧭', color: '#16a34a', mainSiteUrl: '/packages' },
  sec_6_guardian:            { label: 'Structure & Operations',     emoji: '⚙️', color: '#64748b', mainSiteUrl: '/services' },
  sec_7_investment:          { label: 'Investment & Partnerships',  emoji: '📈', color: '#7c3aed', mainSiteUrl: '/investment-opportunities' },
  sec_8_connector:           { label: 'Special Offers & Deals',     emoji: '🏷️', color: '#dc2626', mainSiteUrl: '/offers' },
  sec_9_marketplace_catalog: { label: 'Media & Marketplace',        emoji: '🛍️', color: '#0891b2', mainSiteUrl: '/activities' },
  sec_10_testimonials_faqs:  { label: 'Contact, Policies & Trust',  emoji: '💬', color: '#059669', mainSiteUrl: '/be-a-partner' },
};

