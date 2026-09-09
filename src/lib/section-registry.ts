export const CANONICAL_SECTION_IDS = [
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
] as const;

export type CanonicalSectionId = (typeof CANONICAL_SECTION_IDS)[number];

export const LEGACY_SECTION_ALIASES: Record<string, CanonicalSectionId> = {
  basic: 'sec_1_identity',
  business_info: 'sec_1_identity',
  vibe: 'sec_2_ambience',
  ambience: 'sec_2_ambience',
  sec_3_services: 'sec_5_experiences',
  experience: 'sec_5_experiences',
  sec_4_facilities: 'sec_3_facilities',
  sec_5_connectivity: 'sec_8_connector',
  sec_6_geographic: 'sec_2_ambience',
  investment: 'sec_7_investment',
  'investment-opportunity': 'sec_7_investment',
  'offers-packages': 'sec_8_connector',
  'discounts-promotions': 'sec_8_connector',
  sec_8_rates_offers: 'sec_8_connector',
  media: 'sec_9_marketplace_catalog',
};

export const CANONICAL_SECTIONS = [
  { id: 'sec_1_identity', name: 'Identity & Overview', label: 'Identity', emoji: '🏷️', color: '#2563eb', icon: 'fa-landmark', order: 1 },
  { id: 'sec_2_ambience', name: 'Vibe & Experience', label: 'Vibe', emoji: '✨', color: '#f59e0b', icon: 'fa-sun', order: 2 },
  { id: 'sec_3_facilities', name: 'Facilities & Amenities', label: 'Facilities', emoji: '🏢', color: '#0ea5e9', icon: 'fa-swimming-pool', order: 3 },
  { id: 'sec_4_gastronomy', name: 'Services & Activities', label: 'Services', emoji: '🛠️', color: '#f97316', icon: 'fa-utensils', order: 4 },
  { id: 'sec_5_experiences', name: 'Programs & Experiences', label: 'Experiences', emoji: '🧭', color: '#16a34a', icon: 'fa-hiking', order: 5 },
  { id: 'sec_6_guardian', name: 'Structure & Operations', label: 'Operations', emoji: '⚙️', color: '#64748b', icon: 'fa-building', order: 6 },
  { id: 'sec_7_investment', name: 'Investment & Partnerships', label: 'Investment', emoji: '📈', color: '#7c3aed', icon: 'fa-chart-line', order: 7 },
  { id: 'sec_8_connector', name: 'Offers, Packages & Discounts', label: 'Offers', emoji: '🏷️', color: '#dc2626', icon: 'fa-tags', order: 8 },
  { id: 'sec_9_marketplace_catalog', name: 'Media & Marketplace', label: 'Marketplace', emoji: '🛍️', color: '#0891b2', icon: 'fa-store', order: 9 },
  { id: 'sec_10_testimonials_faqs', name: 'Contact, Policies & Trust', label: 'Trust', emoji: '💬', color: '#059669', icon: 'fa-comments', order: 10 },
] as const;

export function resolveSectionId(id: string): string {
  return LEGACY_SECTION_ALIASES[id] || id;
}

export function normalizeSectionIds(value: unknown, fallbackToAll = false): string[] {
  let ids: unknown[] = [];
  if (Array.isArray(value)) ids = value;
  else if (typeof value === 'string') {
    try { ids = JSON.parse(value || '[]'); } catch { ids = []; }
  }
  const valid = ids
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    .map(resolveSectionId);
  return valid.length || fallbackToAll ? [...new Set(valid.length ? valid : CANONICAL_SECTION_IDS)] : [];
}
