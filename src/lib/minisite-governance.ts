import { query } from '@/lib/db';

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

/**
 * The main-site page concept this component mirrors.
 * Matches mainSiteMirror.url in section-mainsite-bridge.ts.
 */
export type MainSitePageRef =
  | '/'
  | '/packages'
  | '/offers'
  | '/accommodations'
  | '/activities'
  | '/restaurants'
  | '/services'
  | '/investment-opportunities'
  | '/blog'
  | '*';


export const DEFAULT_TIER_RULES: Record<MinisiteTier, MinisiteComponentType[]> = {
  // Free: all standard components — admin builds the layout, vendors don't touch this
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
  // Premium: standard + private per-vendor carousel
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
  // Admin: everything including auctions feed
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
  {
    label: string;
    icon: string;
    description: string;
    vendorScoped: boolean;
    tier: MinisiteTier;
    /** Main-site pages this component feeds data from / shares data with */
    mainSitePages: MainSitePageRef[];
    /** Canonical section IDs on the business minisite this component appears in */
    canonicalSections: string[];
  }
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


export function getBusinessTier(business: any): MinisiteTier {
  if (!business) return 'free';

  // Admin / master businesses get full access
  if (business.is_master || business.is_admin_business) return 'admin';

  const tierCode = String(
    business.subscription_tier ||
      business.tier_slug ||
      business.tier_name ||
      business.tier ||
      ''
  ).toLowerCase();

  // Admin-level overrides
  if (tierCode.includes('admin') || tierCode.includes('master')) return 'admin';

  // Premium tier codes — vip, gold, pro, premium, plus
  if (
    tierCode.includes('premium') ||
    tierCode.includes('pro') ||
    tierCode.includes('vip') ||
    tierCode.includes('gold') ||
    tierCode.includes('elite') ||
    tierCode.includes('enterprise')
  ) {
    return 'premium';
  }

  // Standard tier codes
  if (
    tierCode.includes('standard') ||
    tierCode.includes('silver') ||
    tierCode.includes('plus') ||
    tierCode.includes('basic') ||
    tierCode.includes('starter') ||
    tierCode.includes('essential')
  ) {
    return 'standard';
  }

  // If the business is claimed, trusted, or published — treat as standard minimum
  // so the admin can build a full layout for them
  if (business.is_claimed || business.is_trusted || business.published || business.active) {
    return 'standard';
  }

  return 'free';
}

export async function getTierRules(tier: MinisiteTier): Promise<MinisiteComponentType[]> {
  try {
    const rows = await query<any>(
      "SELECT config FROM website_configs WHERE type = 'minisite_governance' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const parsed = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
      if (parsed && Array.isArray(parsed[tier])) {
        return parsed[tier] as MinisiteComponentType[];
      }
    }
  } catch (err) {
    console.warn('[Governance] Using default tier rules fallback:', err);
  }
  return DEFAULT_TIER_RULES[tier] || DEFAULT_TIER_RULES.free;
}

export async function getAllTierRules(): Promise<Record<MinisiteTier, MinisiteComponentType[]>> {
  try {
    const rows = await query<any>(
      "SELECT config FROM website_configs WHERE type = 'minisite_governance' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const parsed = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
      if (parsed && typeof parsed === 'object') {
        return {
          free: Array.isArray(parsed.free) ? parsed.free : DEFAULT_TIER_RULES.free,
          standard: Array.isArray(parsed.standard) ? parsed.standard : DEFAULT_TIER_RULES.standard,
          premium: Array.isArray(parsed.premium) ? parsed.premium : DEFAULT_TIER_RULES.premium,
          admin: Array.isArray(parsed.admin) ? parsed.admin : DEFAULT_TIER_RULES.admin,
        };
      }
    }
  } catch (err) {
    console.warn('[Governance] Failed to read governance overrides:', err);
  }
  return DEFAULT_TIER_RULES;
}

export function validateMinisiteLayout(
  components: any[],
  allowedTypes: MinisiteComponentType[]
): any[] {
  if (!Array.isArray(components)) return [];
  const allowedSet = new Set<string>(allowedTypes);

  return components
    .filter((comp) => comp && typeof comp.type === 'string' && allowedSet.has(comp.type))
    .map((comp, idx) => ({
      id: comp.id || `comp_${idx}_${Date.now()}`,
      type: comp.type as MinisiteComponentType,
      order: typeof comp.order === 'number' ? comp.order : idx,
      props: typeof comp.props === 'object' && comp.props !== null ? comp.props : {},
    }))
    .sort((a, b) => a.order - b.order);
}
