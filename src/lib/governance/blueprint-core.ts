// ================================================================
// SIWA OASIS: Blueprint Core Constants
// Layer 0 hardcoded fields — never stored in DB, always injected at render
// Reuses FIELD_TYPES from governance/constants.ts
// ================================================================

import { FIELD_TYPES } from './constants';

export const CHAPTERS = [
  'identity',
  'vibe',
  'amenities',
  'cuisine',
  'programs',
  'ecology',
  'invest',
  'offers',
] as const;

export type Chapter = typeof CHAPTERS[number];

export const CHAPTER_LABELS: Record<Chapter, string> = {
  identity:  'IDENTITY',
  vibe:      'VIBE',
  amenities: 'AMENITIES',
  cuisine:   'CUISINE',
  programs:  'PROGRAMS',
  ecology:   'ECOLOGY',
  invest:    'INVEST',
  offers:    'OFFERS',
};

export const CHAPTER_ICONS: Record<Chapter, string> = {
  identity:  '🏛️',
  vibe:      '✨',
  amenities: '🎯',
  cuisine:   '🍽️',
  programs:  '📅',
  ecology:   '🌿',
  invest:    '💰',
  offers:    '🎁',
};

export const CHAPTER_COLORS: Record<Chapter, string> = {
  identity:  '#6366f1',
  vibe:      '#ec4899',
  amenities: '#14b8a6',
  cuisine:   '#f59e0b',
  programs:  '#8b5cf6',
  ecology:   '#10b981',
  invest:    '#D4AF37',
  offers:    '#ef4444',
};

// Layer 0 — CORE — hardcoded, always present, never editable
export const BLUEPRINT_CORE: Record<Chapter, string[]> = {
  identity:  ['name', 'type', 'phone', 'location', 'logo', 'cover_image'],
  vibe:      ['atmosphere', 'target_audience'],
  amenities: ['wifi', 'parking', 'accessibility'],
  cuisine:   ['food_available'],
  programs:  ['bookable'],
  ecology:   ['eco_certified'],
  invest:    ['pricing_available'],
  offers:    ['has_offers'],
};

// Atom field types — matches FIELD_TYPES keys from governance/constants.ts
export type FieldTypeKey = keyof typeof FIELD_TYPES;

export interface AtomValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

// A BlueprintAtom is a self-describing, reusable field unit
export interface BlueprintAtom {
  id: string;                // 'wifi', 'star_rating', 'check_in_time'
  label: string;             // 'WiFi Available'
  type: FieldTypeKey;        // from FIELD_TYPES in constants.ts
  chapter: Chapter;
  options?: string[];        // for select/multiselect/checkbox_group
  validation?: AtomValidation;
  display_hint?: string;     // tooltip/help text
  icon?: string;             // FontAwesome class
  layer_default?: 0 | 1 | 2; // which layer this atom belongs to by default
  tags?: string[];           // e.g. ['hospitality', 'eco', 'dining']
  sort_order?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Blueprint schema stored in business_types.blueprint_schema
export interface ChapterSchema {
  layer1: string[]; // atom IDs
  layer2: string[]; // atom IDs
}

export type BlueprintSchema = {
  chapters: Partial<Record<Chapter, ChapterSchema>>;
};

// Seed atoms — pre-built from SIWA_DEFS amenities + standard fields
export const DEFAULT_SEED_ATOMS: Omit<BlueprintAtom, 'created_at' | 'updated_at'>[] = [
  // IDENTITY
  { id: 'description',      label: 'Description',          type: 'textarea',       chapter: 'identity',  icon: 'fa-align-left',   layer_default: 1, tags: ['all'] },
  { id: 'hours',            label: 'Opening Hours',        type: 'text',           chapter: 'identity',  icon: 'fa-clock',        layer_default: 1, tags: ['all'] },
  { id: 'website',          label: 'Website URL',          type: 'url',            chapter: 'identity',  icon: 'fa-link',         layer_default: 1, tags: ['all'] },
  { id: 'email',            label: 'Email Address',        type: 'email',          chapter: 'identity',  icon: 'fa-envelope',     layer_default: 1, tags: ['all'] },
  { id: 'star_rating',      label: 'Star Rating',          type: 'star_rating',    chapter: 'identity',  icon: 'fa-star',         layer_default: 2, tags: ['hospitality'] },
  { id: 'rooms',            label: 'Number of Rooms',      type: 'number',         chapter: 'identity',  icon: 'fa-bed',          layer_default: 2, tags: ['hospitality'] },
  { id: 'check_in',         label: 'Check-in Time',        type: 'text',           chapter: 'identity',  icon: 'fa-sign-in-alt',  layer_default: 2, tags: ['hospitality'] },
  { id: 'check_out',        label: 'Check-out Time',       type: 'text',           chapter: 'identity',  icon: 'fa-sign-out-alt', layer_default: 2, tags: ['hospitality'] },
  // VIBE
  { id: 'atmosphere',       label: 'Atmosphere Tags',      type: 'multiselect',    chapter: 'vibe',      icon: 'fa-wind',         layer_default: 1, tags: ['all'], options: ['Peaceful','Vibrant','Romantic','Family-Friendly','Adventurous','Luxurious'] },
  { id: 'music',            label: 'Music / Entertainment',type: 'text',           chapter: 'vibe',      icon: 'fa-music',        layer_default: 2, tags: ['dining','nightlife'] },
  { id: 'dress_code',       label: 'Dress Code',           type: 'text',           chapter: 'vibe',      icon: 'fa-tshirt',       layer_default: 2, tags: ['hospitality','dining'] },
  // AMENITIES
  { id: 'private_pool',     label: 'Private Pool',         type: 'boolean',        chapter: 'amenities', icon: 'fa-swimmer',      layer_default: 2, tags: ['hospitality'] },
  { id: 'spa',              label: 'Spa',                  type: 'boolean',        chapter: 'amenities', icon: 'fa-spa',          layer_default: 2, tags: ['hospitality','wellness'] },
  { id: 'gym',              label: 'Fitness / Gym',        type: 'boolean',        chapter: 'amenities', icon: 'fa-dumbbell',     layer_default: 2, tags: ['hospitality'] },
  { id: 'restaurant_onsite',label: 'Restaurant On-site',   type: 'boolean',        chapter: 'amenities', icon: 'fa-utensils',     layer_default: 1, tags: ['hospitality'] },
  { id: 'ac',               label: 'Air Conditioning',     type: 'boolean',        chapter: 'amenities', icon: 'fa-snowflake',    layer_default: 1, tags: ['all'] },
  { id: 'garden',           label: 'Garden',               type: 'boolean',        chapter: 'amenities', icon: 'fa-leaf',         layer_default: 1, tags: ['all'] },
  { id: 'pets_allowed',     label: 'Pets Allowed',         type: 'boolean',        chapter: 'amenities', icon: 'fa-paw',          layer_default: 1, tags: ['all'] },
  // CUISINE
  { id: 'halal',            label: 'Halal Certified',      type: 'boolean',        chapter: 'cuisine',   icon: 'fa-check-circle', layer_default: 1, tags: ['dining'] },
  { id: 'vegetarian',       label: 'Vegetarian Options',   type: 'boolean',        chapter: 'cuisine',   icon: 'fa-seedling',     layer_default: 1, tags: ['dining'] },
  { id: 'cuisine_type',     label: 'Cuisine Type',         type: 'multiselect',    chapter: 'cuisine',   icon: 'fa-globe',        layer_default: 2, tags: ['dining'], options: ['Egyptian','Mediterranean','International','Siwan Traditional','BBQ','Seafood'] },
  { id: 'seating_capacity', label: 'Seating Capacity',     type: 'number',         chapter: 'cuisine',   icon: 'fa-chair',        layer_default: 2, tags: ['dining'] },
  { id: 'delivery',         label: 'Delivery Available',   type: 'boolean',        chapter: 'cuisine',   icon: 'fa-motorcycle',   layer_default: 2, tags: ['dining'] },
  { id: 'menu_url',         label: 'Menu URL',             type: 'url',            chapter: 'cuisine',   icon: 'fa-book-open',    layer_default: 2, tags: ['dining'] },
  // PROGRAMS
  { id: 'booking_required', label: 'Booking Required',     type: 'boolean',        chapter: 'programs',  icon: 'fa-calendar-check', layer_default: 1, tags: ['all'] },
  { id: 'group_size_min',   label: 'Min Group Size',       type: 'number',         chapter: 'programs',  icon: 'fa-users',        layer_default: 2, tags: ['tours','activities'] },
  { id: 'group_size_max',   label: 'Max Group Size',       type: 'number',         chapter: 'programs',  icon: 'fa-users',        layer_default: 2, tags: ['tours','activities'] },
  { id: 'duration',         label: 'Duration',             type: 'text',           chapter: 'programs',  icon: 'fa-hourglass',    layer_default: 2, tags: ['tours','activities'] },
  // ECOLOGY
  { id: 'solar_powered',    label: 'Solar Powered',        type: 'boolean',        chapter: 'ecology',   icon: 'fa-solar-panel',  layer_default: 1, tags: ['eco'] },
  { id: 'eco_materials',    label: 'Eco Materials',        type: 'boolean',        chapter: 'ecology',   icon: 'fa-leaf',         layer_default: 1, tags: ['eco'] },
  { id: 'plastic_free',     label: 'Plastic-Free Policy',  type: 'boolean',        chapter: 'ecology',   icon: 'fa-recycle',      layer_default: 1, tags: ['eco'] },
  // INVEST
  { id: 'price_per_night',  label: 'Price Per Night (EGP)',type: 'number',         chapter: 'invest',    icon: 'fa-money-bill',   layer_default: 1, tags: ['hospitality'] },
  { id: 'min_investment',   label: 'Min Investment (EGP)', type: 'number',         chapter: 'invest',    icon: 'fa-chart-line',   layer_default: 2, tags: ['invest'] },
  { id: 'roi_estimate',     label: 'ROI Estimate (%)',     type: 'number',         chapter: 'invest',    icon: 'fa-percentage',   layer_default: 2, tags: ['invest'] },
  // OFFERS
  { id: 'discount_pct',     label: 'Discount (%)',         type: 'number',         chapter: 'offers',    icon: 'fa-tag',          layer_default: 1, tags: ['all'] },
  { id: 'offer_expires',    label: 'Offer Expires',        type: 'text',           chapter: 'offers',    icon: 'fa-calendar-times', layer_default: 1, tags: ['all'] },
  { id: 'promo_code',       label: 'Promo Code',           type: 'text',           chapter: 'offers',    icon: 'fa-barcode',      layer_default: 2, tags: ['all'] },
];
