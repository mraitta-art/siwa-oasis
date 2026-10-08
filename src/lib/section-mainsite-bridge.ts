/**
 * section-mainsite-bridge.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines the bidirectional bridge between:
 *   1. Business minisite section tabs  (sec_1_identity, sec_5_experiences, …)
 *   2. Main site pages/concepts        (/packages, /accommodations, …)
 *   3. Minisite builder component types (vendor_packages, vendor_gallery, …)
 *   4. Database tables / API endpoints  (tour_products, vendor_gallery, …)
 *
 * This file is the SINGLE SOURCE OF TRUTH for how sections connect across the
 * platform.  Nothing is removed from existing registries — this EXTENDS them.
 *
 * Usage:
 *   import { SECTION_BRIDGE, getSectionBridge } from '@/lib/section-mainsite-bridge';
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { CanonicalSectionId } from './section-registry';
import type { MinisiteComponentType } from './minisite-governance';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectionDataSource {
  /** DB table that holds the records for this section */
  table: string;
  /** Column name that scopes records to a business */
  businessIdColumn: string;
  /** Additional WHERE conditions (SQL fragment, no leading AND) */
  extraWhere?: string;
  /** Default ORDER BY clause */
  orderBy?: string;
  /** Columns to SELECT (defaults to '*') */
  selectColumns?: string;
}

export interface SectionApiEndpoint {
  /** Full relative path of the API route */
  path: string;
  /** Query-param name that accepts business slug or id */
  businessParam: string;
  /** HTTP method(s) this endpoint accepts */
  methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>;
  /** Brief description of what this endpoint does */
  description: string;
}

export interface MainSiteMirror {
  /** URL of the corresponding main-site public page */
  url: string;
  /** Human-readable label for the main-site page */
  label: string;
  /** FontAwesome icon for the main-site mirror */
  icon: string;
  /** Colour used in the builder UI to distinguish this mirror */
  color: string;
}

export interface SectionBridgeEntry {
  /** Canonical section ID (from section-registry.ts) */
  sectionId: CanonicalSectionId;
  /** Short display label for this bridge */
  label: string;
  /** Minisite builder component types that belong to this section */
  builderComponents: MinisiteComponentType[];
  /** Primary data source for this section */
  primarySource: SectionDataSource;
  /** Optional secondary data sources (e.g. gallery + blog for identity) */
  secondarySources?: SectionDataSource[];
  /** REST API endpoints that read/write data for this section */
  apiEndpoints: SectionApiEndpoint[];
  /** Corresponding main-site page/concept */
  mainSiteMirror: MainSiteMirror;
  /**
   * Whether editing data through the minisite builder writes to the SAME
   * table the main site reads from (true = shared, false = isolated).
   */
  isSharedDataSource: boolean;
  /** Admin navigation path in Jana dashboard for this section's content */
  adminContentPath: string;
  /** Vendor navigation path for self-service content management */
  vendorContentPath?: string;
}

// ─── Bridge Registry ─────────────────────────────────────────────────────────

export const SECTION_BRIDGE: Record<CanonicalSectionId, SectionBridgeEntry> = {

  // ── sec_1_identity ─────────────────────────────────────────────────────────
  sec_1_identity: {
    sectionId: 'sec_1_identity',
    label: 'Identity & Overview',
    builderComponents: ['vendor_hero', 'vendor_gallery', 'vendor_blog', 'text_section', 'cta_section'],
    primarySource: {
      table: 'businesses',
      businessIdColumn: 'id',
      selectColumns: 'id, name, slug, logo_url, cover_image, description, custom_data, subscription_tier, vendor_phone, vendor_whatsapp, is_trusted',
    },
    secondarySources: [
      {
        table: 'vendor_gallery',
        businessIdColumn: 'business_id',
        extraWhere: "approval_status = 'approved' AND show_on_minisite = 1 AND section_id = 'sec_1_identity'",
        orderBy: 'display_order ASC, created_at DESC',
      },
      {
        table: 'section_blogs',
        businessIdColumn: 'business_id',
        extraWhere: "status = 'published' AND show_on_minisite = 1 AND section_id = 'sec_1_identity'",
        orderBy: 'published_at DESC',
      },
    ],
    apiEndpoints: [
      { path: '/api/jana/businesses', businessParam: 'id', methods: ['GET', 'POST', 'PUT'], description: 'Business profile read/write' },
      { path: '/api/vendor/gallery', businessParam: 'businessId', methods: ['GET', 'POST', 'DELETE'], description: 'Section gallery images' },
    ],
    mainSiteMirror: {
      url: '/',
      label: 'Homepage / Business Cards',
      icon: 'fa-home',
      color: '#2563eb',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/content',
    vendorContentPath: '/vendor/sections',
  },

  // ── sec_2_ambience ─────────────────────────────────────────────────────────
  sec_2_ambience: {
    sectionId: 'sec_2_ambience',
    label: 'Vibe & Ambience',
    builderComponents: ['vendor_gallery', 'vendor_blog', 'vendor_carousel', 'text_section'],
    primarySource: {
      table: 'vendor_gallery',
      businessIdColumn: 'business_id',
      extraWhere: "approval_status = 'approved' AND show_on_minisite = 1 AND section_id = 'sec_2_ambience'",
      orderBy: 'display_order ASC, created_at DESC',
    },
    secondarySources: [
      {
        table: 'section_blogs',
        businessIdColumn: 'business_id',
        extraWhere: "status = 'published' AND show_on_minisite = 1 AND section_id = 'sec_2_ambience'",
        orderBy: 'published_at DESC',
      },
    ],
    apiEndpoints: [
      { path: '/api/vendor/gallery', businessParam: 'businessId', methods: ['GET', 'POST', 'DELETE'], description: 'Ambience gallery images' },
      { path: '/api/jana/hero-carousel', businessParam: 'siteId', methods: ['GET', 'POST'], description: 'Hero carousel slides per section' },
    ],
    mainSiteMirror: {
      url: '/activities',
      label: 'Activities & Experiences',
      icon: 'fa-sun',
      color: '#f59e0b',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/content',
    vendorContentPath: '/vendor/sections',
  },

  // ── sec_3_facilities ───────────────────────────────────────────────────────
  sec_3_facilities: {
    sectionId: 'sec_3_facilities',
    label: 'Facilities & Amenities',
    builderComponents: ['vendor_services', 'vendor_gallery', 'text_section'],
    primarySource: {
      table: 'vendor_gallery',
      businessIdColumn: 'business_id',
      extraWhere: "approval_status = 'approved' AND show_on_minisite = 1 AND section_id = 'sec_3_facilities'",
      orderBy: 'display_order ASC',
    },
    apiEndpoints: [
      { path: '/api/vendor/gallery', businessParam: 'businessId', methods: ['GET', 'POST'], description: 'Facilities gallery' },
      { path: '/api/jana/sections', businessParam: 'businessId', methods: ['GET', 'PUT'], description: 'Section fields' },
    ],
    mainSiteMirror: {
      url: '/accommodations',
      label: 'Accommodations & Amenities',
      icon: 'fa-swimming-pool',
      color: '#0ea5e9',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/content',
    vendorContentPath: '/vendor/sections',
  },

  // ── sec_4_gastronomy ───────────────────────────────────────────────────────
  sec_4_gastronomy: {
    sectionId: 'sec_4_gastronomy',
    label: 'Services & Gastronomy',
    builderComponents: ['vendor_services', 'vendor_gallery', 'vendor_blog', 'text_section', 'cta_section'],
    primarySource: {
      table: 'vendor_gallery',
      businessIdColumn: 'business_id',
      extraWhere: "approval_status = 'approved' AND show_on_minisite = 1 AND section_id = 'sec_4_gastronomy'",
      orderBy: 'display_order ASC',
    },
    apiEndpoints: [
      { path: '/api/vendor/gallery', businessParam: 'businessId', methods: ['GET', 'POST'], description: 'Services gallery' },
    ],
    mainSiteMirror: {
      url: '/restaurants',
      label: 'Restaurants & Dining',
      icon: 'fa-utensils',
      color: '#f97316',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/content',
    vendorContentPath: '/vendor/sections',
  },

  // ── sec_5_experiences ──────────────────────────────────────────────────────
  sec_5_experiences: {
    sectionId: 'sec_5_experiences',
    label: 'Programs & Experiences (Packages)',
    builderComponents: ['vendor_packages', 'vendor_gallery', 'vendor_blog', 'text_section', 'cta_section'],
    primarySource: {
      table: 'tour_products',
      businessIdColumn: 'vendor_business_id',
      extraWhere: 'is_active = 1',
      orderBy: 'is_featured DESC, created_at DESC',
      selectColumns: 'id, title, description, price, currency, duration_label, image_url, booking_url, is_featured, category',
    },
    secondarySources: [
      {
        table: 'vendor_gallery',
        businessIdColumn: 'business_id',
        extraWhere: "approval_status = 'approved' AND show_on_minisite = 1 AND section_id = 'sec_5_experiences'",
        orderBy: 'display_order ASC',
      },
    ],
    apiEndpoints: [
      { path: '/api/vendor/packages', businessParam: 'businessId', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Tour packages & experiences' },
      { path: '/api/jana/packages', businessParam: 'businessId', methods: ['GET', 'POST', 'PUT'], description: 'Admin packages management' },
    ],
    mainSiteMirror: {
      url: '/packages',
      label: 'Packages & Journeys',
      icon: 'fa-box-open',
      color: '#16a34a',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/packages',
    vendorContentPath: '/vendor/packages',
  },

  // ── sec_6_guardian ─────────────────────────────────────────────────────────
  sec_6_guardian: {
    sectionId: 'sec_6_guardian',
    label: 'Structure & Operations',
    builderComponents: ['text_section', 'faq', 'vendor_blog'],
    primarySource: {
      table: 'businesses',
      businessIdColumn: 'id',
      selectColumns: 'id, name, custom_data',
    },
    apiEndpoints: [
      { path: '/api/jana/sections', businessParam: 'businessId', methods: ['GET', 'PUT'], description: 'Operations fields' },
    ],
    mainSiteMirror: {
      url: '/services',
      label: 'Services Hub',
      icon: 'fa-building',
      color: '#64748b',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/content',
    vendorContentPath: '/vendor/sections',
  },

  // ── sec_7_investment ───────────────────────────────────────────────────────
  sec_7_investment: {
    sectionId: 'sec_7_investment',
    label: 'Investment & Partnerships',
    builderComponents: ['text_section', 'cta_section', 'vendor_blog', 'auctions_feed'],
    primarySource: {
      table: 'businesses',
      businessIdColumn: 'id',
      selectColumns: 'id, name, custom_data',
      extraWhere: "JSON_EXTRACT(custom_data, '$.sec_7_investment') IS NOT NULL",
    },
    apiEndpoints: [
      { path: '/api/jana/auctions', businessParam: 'businessId', methods: ['GET'], description: 'Investment & auction feed' },
    ],
    mainSiteMirror: {
      url: '/investment-opportunities',
      label: 'Investment Opportunities',
      icon: 'fa-chart-line',
      color: '#7c3aed',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/content',
    vendorContentPath: '/vendor/investment-opportunities',
  },

  // ── sec_8_connector ────────────────────────────────────────────────────────
  sec_8_connector: {
    sectionId: 'sec_8_connector',
    label: 'Offers, Packages & Discounts',
    builderComponents: ['vendor_packages', 'cta_section', 'text_section'],
    primarySource: {
      table: 'tour_products',
      businessIdColumn: 'vendor_business_id',
      extraWhere: "is_active = 1 AND (is_featured = 1 OR discount_percent > 0)",
      orderBy: 'discount_percent DESC, is_featured DESC',
      selectColumns: 'id, title, description, price, currency, discount_percent, image_url, booking_url',
    },
    secondarySources: [
      {
        table: 'marketplace_items',
        businessIdColumn: 'business_id',
        extraWhere: "status = 'approved'",
        orderBy: 'created_at DESC',
      },
    ],
    apiEndpoints: [
      { path: '/api/vendor/packages', businessParam: 'businessId', methods: ['GET', 'POST'], description: 'Offers & discounted packages' },
      { path: '/api/jana/marketplace', businessParam: 'businessId', methods: ['GET', 'POST'], description: 'Marketplace items' },
    ],
    mainSiteMirror: {
      url: '/offers',
      label: 'Offers & Discounts',
      icon: 'fa-tags',
      color: '#dc2626',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/catalog',
    vendorContentPath: '/vendor/packages',
  },

  // ── sec_9_marketplace_catalog ──────────────────────────────────────────────
  sec_9_marketplace_catalog: {
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Media & Marketplace',
    builderComponents: ['vendor_gallery', 'vendor_packages', 'vendor_blog', 'text_section', 'cta_section'],
    primarySource: {
      table: 'marketplace_items',
      businessIdColumn: 'business_id',
      extraWhere: "status = 'approved'",
      orderBy: 'is_featured DESC, created_at DESC',
      selectColumns: 'id, title, description, price, currency, image_url, booking_url, category, is_featured',
    },
    secondarySources: [
      {
        table: 'vendor_gallery',
        businessIdColumn: 'business_id',
        extraWhere: "approval_status = 'approved' AND show_on_minisite = 1 AND section_id = 'sec_9_marketplace_catalog'",
        orderBy: 'display_order ASC',
      },
    ],
    apiEndpoints: [
      { path: '/api/jana/marketplace', businessParam: 'businessId', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Marketplace catalog items' },
      { path: '/api/vendor/submit-item', businessParam: 'businessId', methods: ['GET', 'POST'], description: 'Vendor marketplace submission' },
    ],
    mainSiteMirror: {
      url: '/activities',
      label: 'Platform Marketplace',
      icon: 'fa-store',
      color: '#0891b2',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/catalog',
    vendorContentPath: '/vendor/submit-item',
  },

  // ── sec_10_testimonials_faqs ───────────────────────────────────────────────
  sec_10_testimonials_faqs: {
    sectionId: 'sec_10_testimonials_faqs',
    label: 'Contact, Policies & Trust',
    builderComponents: ['testimonials', 'faq', 'cta_section', 'text_section'],
    primarySource: {
      table: 'businesses',
      businessIdColumn: 'id',
      selectColumns: 'id, name, vendor_phone, vendor_whatsapp, custom_data',
    },
    apiEndpoints: [
      { path: '/api/jana/sections', businessParam: 'businessId', methods: ['GET', 'PUT'], description: 'FAQs and trust content' },
    ],
    mainSiteMirror: {
      url: '/be-a-partner',
      label: 'Contact & Trust Hub',
      icon: 'fa-comments',
      color: '#059669',
    },
    isSharedDataSource: true,
    adminContentPath: '/jana/content',
    vendorContentPath: '/vendor/sections',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get bridge entry for a canonical section id.
 */
export function getSectionBridge(sectionId: string): SectionBridgeEntry | null {
  return SECTION_BRIDGE[sectionId as CanonicalSectionId] ?? null;
}

/**
 * Get all sections that a given builder component type belongs to.
 */
export function getSectionsForComponent(componentType: MinisiteComponentType): CanonicalSectionId[] {
  return (Object.values(SECTION_BRIDGE) as SectionBridgeEntry[])
    .filter((entry) => entry.builderComponents.includes(componentType))
    .map((entry) => entry.sectionId);
}

/**
 * Get the main-site mirror URL for a section.
 */
export function getMainSiteMirrorUrl(sectionId: string): string | null {
  return SECTION_BRIDGE[sectionId as CanonicalSectionId]?.mainSiteMirror.url ?? null;
}

/**
 * Get the primary DB table for a section.
 */
export function getPrimaryTable(sectionId: string): string | null {
  return SECTION_BRIDGE[sectionId as CanonicalSectionId]?.primarySource.table ?? null;
}

/**
 * Build an API query path for a specific section and business.
 */
export function buildSectionApiUrl(sectionId: string, businessId: string): string | null {
  const bridge = getSectionBridge(sectionId);
  if (!bridge || bridge.apiEndpoints.length === 0) return null;
  const endpoint = bridge.apiEndpoints[0];
  return `${endpoint.path}?${endpoint.businessParam}=${encodeURIComponent(businessId)}`;
}

/**
 * Get all bridge entries ordered by section order (matches CANONICAL_SECTIONS).
 */
export function getAllBridges(): SectionBridgeEntry[] {
  const ORDER: CanonicalSectionId[] = [
    'sec_1_identity',
    'sec_2_ambience',
    'sec_3_facilities',
    'sec_4_gastronomy',
    'sec_5_experiences',
    'sec_6_guardian',
    'sec_7_investment',
    'sec_8_connector',
    'sec_9_marketplace_catalog',
    'sec_10_testimonials_faqs',
  ];
  return ORDER.map((id) => SECTION_BRIDGE[id]);
}

/**
 * Check if a section shares its data with the main site (vs isolated).
 */
export function isSectionShared(sectionId: string): boolean {
  return SECTION_BRIDGE[sectionId as CanonicalSectionId]?.isSharedDataSource ?? true;
}
