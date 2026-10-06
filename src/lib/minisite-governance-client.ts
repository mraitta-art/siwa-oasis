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
  { label: string; icon: string; description: string; vendorScoped: boolean; tier: MinisiteTier }
> = {
  vendor_hero: {
    label: 'Brand Hero & Cover',
    icon: 'fa-id-card',
    description: 'Header with logo, banner, rating, verified badge, and contact action.',
    vendorScoped: true,
    tier: 'free',
  },
  vendor_gallery: {
    label: 'Visual Media Gallery',
    icon: 'fa-images',
    description: 'Responsive media grid showcasing vendor photographs and spaces.',
    vendorScoped: true,
    tier: 'free',
  },
  text_section: {
    label: 'Narrative & Rich Text',
    icon: 'fa-align-left',
    description: 'Custom rich text, story block, or about paragraph.',
    vendorScoped: false,
    tier: 'free',
  },
  cta_section: {
    label: 'Direct Action Callout',
    icon: 'fa-bullhorn',
    description: 'Conversion banner with custom button, call or booking redirect.',
    vendorScoped: false,
    tier: 'free',
  },
  vendor_services: {
    label: 'Service & Amenity Cards',
    icon: 'fa-concierge-bell',
    description: 'Curated list of amenities, features, or core service offerings.',
    vendorScoped: true,
    tier: 'free',
  },
  vendor_packages: {
    label: 'Packages & Catalog',
    icon: 'fa-box-open',
    description: 'Bookable tours, packages, or product catalog showcase.',
    vendorScoped: true,
    tier: 'free',
  },
  vendor_blog: {
    label: 'Stories & Insights',
    icon: 'fa-newspaper',
    description: 'Published articles, updates, and desert guides by this vendor.',
    vendorScoped: true,
    tier: 'free',
  },
  faq: {
    label: 'Accordion FAQ',
    icon: 'fa-circle-question',
    description: 'Frequently asked questions with expandable answers.',
    vendorScoped: false,
    tier: 'free',
  },
  testimonials: {
    label: 'Endorsements & Reviews',
    icon: 'fa-quote-left',
    description: 'Client reviews, trust quotes, and guest experiences.',
    vendorScoped: false,
    tier: 'free',
  },
  vendor_carousel: {
    label: 'Private Hero Carousel',
    icon: 'fa-film',
    description: 'Cinematic sliding carousel isolated specifically to this vendor.',
    vendorScoped: true,
    tier: 'premium',
  },
  auctions_feed: {
    label: 'Commercial Deals & Auction',
    icon: 'fa-gavel',
    description: 'Platform commercial auction feeds or exclusive bids.',
    vendorScoped: false,
    tier: 'admin',
  },
};
