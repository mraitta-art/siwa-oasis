export const BRAND_SECTORS = {
  'siwa-stay': {
    category: 'accommodation',
    sectionId: 'sec_3_facilities',
    label: 'Siwa Stay',
    icon: 'fa-bed',
    image_url: 'https://images.unsplash.com/photo-1482192505345-5852b41ade5c?q=80&w=800',
    title: 'Find your stay in Siwa Oasis',
    description: 'Explore hotels, eco-lodges, camps, retreats, and accommodation offers from Siwify and local providers.',
    accent: '#D4AF37',
  },
  'siwa-go': {
    category: 'logistics',
    sectionId: 'sec_5_experiences',
    label: 'Siwa Go',
    icon: 'fa-compass',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    title: 'Move and explore Siwa Oasis',
    description: 'Plan the journey, book transport, and discover tours, activities, and local guides across Siwa.',
    accent: '#F97316',
  },
  'siwa-retreats': {
    category: 'wellness',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Retreats',
    icon: 'fa-spa',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
    title: 'Rest and restore in Siwa',
    description: 'Explore wellness stays, salt lakes, hot springs, sand baths, spas, and restorative retreats.',
    accent: '#34D399',
  },
  'siwa-products': {
    category: 'crafts,agriculture_industry,production_trade',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Products',
    icon: 'fa-store',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
    title: 'Discover products grown and made in Siwa',
    description: 'Shop organic Siwi dates, cold-pressed olive oils, salt rock lamps, handmade crafts, and artisan goods.',
    accent: '#F59E0B',
  },
  'siwa-society': {
    category: 'arts_culture,education_research,events_entertainment,media_content,services_professional',
    sectionId: 'sec_5_experiences',
    label: 'Siwa Society',
    icon: 'fa-people-group',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800',
    title: 'Meet the people and culture of Siwa',
    description: 'Discover cultural organizations, community events, educators, creators, and local professional services.',
    accent: '#A78BFA',
  },
  'siwa-table': {
    category: 'food',
    sectionId: 'sec_4_gastronomy',
    label: 'Siwa Table',
    icon: 'fa-utensils',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800',
    title: 'Taste Siwa Oasis',
    description: 'Explore restaurants, cafes, Bedouin desert dining, underground roasted feasts, and oasis gastronomy.',
    accent: '#FB7185',
  },
  'siwa-experiences': {
    category: 'adventure',
    sectionId: 'sec_5_experiences',
    label: 'Siwa Experiences',
    icon: 'fa-compass',
    title: 'Explore Siwa Oasis',
    description: 'Discover tours, journeys, activities, guides, and packages, with their participating service providers.',
    accent: '#F97316',
  },
  'siwa-retreat': {
    category: 'wellness',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Retreat',
    icon: 'fa-spa',
    title: 'Rest and restore in Siwa',
    description: 'Explore wellness stays, salt lakes, hot springs, sand baths, spas, and restorative retreats.',
    accent: '#34D399',
  },
  'siwa-move': {
    category: 'logistics',
    sectionId: 'sec_6_guardian',
    label: 'Siwa Move',
    icon: 'fa-car',
    title: 'Move around Siwa with ease',
    description: 'Find transfers, tuk-tuks, 4x4 transport, rentals, and mobility offers from local providers.',
    accent: '#38BDF8',
  },
  'siwa-craft': {
    category: 'crafts',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Craft',
    icon: 'fa-paint-brush',
    title: 'Discover craft and makers in Siwa',
    description: 'Explore handmade goods, workshops, artisan businesses, and local product offers.',
    accent: '#F59E0B',
  },
  'siwa-grown-produced': {
    category: 'agriculture_industry',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Grown & Produced',
    icon: 'fa-seedling',
    title: 'Explore what Siwa grows and makes',
    description: 'Connect with farms, date and olive producers, food processors, factories, and trade suppliers.',
    accent: '#10B981',
  },
  'siwa-invest': {
    category: 'investment_parent',
    sectionId: 'sec_7_investment',
    label: 'Siwa Invest',
    icon: 'fa-chart-line',
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
    title: 'Invest in Siwa Oasis',
    description: 'Explore approved investments and partnerships from Siwify and businesses across Siwa.',
    accent: '#D4AF37',
  },
  'siwa-services': {
    category: 'services_professional',
    sectionId: 'sec_6_guardian',
    label: 'Siwa Services',
    icon: 'fa-handshake',
    title: 'Find services across Siwa businesses',
    description: 'Discover local operators and professional providers supporting stays, dining, journeys, transport, and trade.',
    accent: '#38BDF8',
  },
} as const;

export const BRAND_SECTOR_HERO: Record<string, { image: string; tagline: string; gradient: string }> = {
  'siwa-stay': { image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1400', tagline: "Rest beneath Siwa's ancient sky", gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(212,175,55,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-go': { image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1400', tagline: 'Explore the great Siwa desert', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(249,115,22,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-table': { image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1400', tagline: 'Savour the flavours of the oasis', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(251,113,133,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-retreats': { image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1400', tagline: 'Restore your body. Reconnect with the earth.', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(52,211,153,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-retreat': { image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1400', tagline: 'Restore your body. Reconnect with the earth.', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(52,211,153,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-products': { image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1400', tagline: 'Made in Siwa. Grown in Siwa.', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(245,158,11,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-move': { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1400', tagline: 'Move freely across the oasis', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(56,189,248,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-invest': { image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1400', tagline: 'Invest in the next Siwa story', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(212,175,55,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-society': { image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1400', tagline: 'Culture, community, and craft', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(167,139,250,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
  'siwa-experiences': { image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1400', tagline: 'Every moment, extraordinary', gradient: 'linear-gradient(160deg,rgba(7,11,8,0.85) 0%,rgba(249,115,22,0.25) 60%,rgba(7,11,8,0.92) 100%)' },
};

export type BrandSectorSlug = keyof typeof BRAND_SECTORS;

export const HOME_BRAND_SECTOR_SLUGS = [
  'siwa-stay',
  'siwa-table',
  'siwa-go',
  'siwa-retreats',
  'siwa-products',
  'siwa-invest',
  'siwa-society',
] as const satisfies readonly BrandSectorSlug[];

export const BRAND_ROUTE_BY_TYPE: Record<string, string> = {
  accommodation: 'siwa-stay',
  hotel: 'siwa-stay',
  camps: 'siwa-stay',
  lodge: 'siwa-stay',
  food: 'siwa-table',
  restaurant: 'siwa-table',
  cafe: 'siwa-table',
  dining: 'siwa-table',
  gastronomy: 'siwa-table',
  adventure: 'siwa-go',
  activities: 'siwa-go',
  tours: 'siwa-go',
  journeys: 'siwa-go',
  arts_culture: 'siwa-society',
  events_entertainment: 'siwa-society',
  wellness: 'siwa-retreats',
  logistics: 'siwa-go',
  transportation: 'siwa-go',
  crafts: 'siwa-products',
  agriculture_industry: 'siwa-products',
  production_trade: 'siwa-products',
  investment_parent: 'siwa-invest',
  services_professional: 'siwa-society',
  education_research: 'siwa-society',
  media_content: 'siwa-society',
};

export function getBrandRouteForType(
  typeId: string,
  types: readonly { id: string; parent_id?: string | null }[] = [],
): string | undefined {
  const visited = new Set<string>();
  let currentId: string | null = typeId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const directRoute = BRAND_ROUTE_BY_TYPE[currentId];
    if (directRoute) return directRoute;
    currentId = types.find(type => type.id === currentId)?.parent_id || null;
  }

  return undefined;
}
