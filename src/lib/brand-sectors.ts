export const BRAND_SECTORS = {
  'siwa-stay': {
    category: 'accommodation',
    sectionId: 'sec_3_facilities',
    label: 'Siwa Stay',
    icon: 'fa-bed',
    image_url: 'https://images.unsplash.com/photo-1482192505345-5852b41ade5c?q=80&w=800',
    title: 'Find your stay in Siwa Oasis',
    description: 'Explore hotels, eco-lodges, camps, retreats, and accommodation offers from Siwify and local providers.',
    accent: '#287a55',
  },
  'siwa-go': {
    category: 'adventure,logistics',
    sectionId: 'sec_5_experiences',
    label: 'Siwa Go',
    icon: 'fa-compass',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    title: 'Move and explore Siwa Oasis',
    description: 'Plan the journey, book transport, and discover tours, activities, and local guides across Siwa.',
    accent: '#287a55',
  },
  'siwa-retreats': {
    category: 'wellness',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Retreats',
    icon: 'fa-spa',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
    title: 'Rest and restore in Siwa',
    description: 'Explore wellness stays, salt lakes, hot springs, sand baths, spas, and restorative retreats.',
    accent: '#58765a',
  },
  'siwa-products': {
    category: 'food,crafts,agriculture_industry,production_trade',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Products',
    icon: 'fa-store',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
    title: 'Discover products grown and made in Siwa',
    description: 'Shop local food, dates, olive products, crafts, handmade goods, and products from Siwa producers.',
    accent: '#9b6832',
  },
  'siwa-society': {
    category: 'arts_culture,education_research,events_entertainment,media_content,services_professional',
    sectionId: 'sec_5_experiences',
    label: 'Siwa Society',
    icon: 'fa-people-group',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800',
    title: 'Meet the people and culture of Siwa',
    description: 'Discover cultural organizations, community events, educators, creators, and local professional services.',
    accent: '#64776b',
  },
  'siwa-table': {
    category: 'food',
    sectionId: 'sec_4_gastronomy',
    label: 'Siwa Table',
    title: 'Taste Siwa Oasis',
    description: 'Find restaurants, cafes, kitchens, local food experiences, and dining offers across Siwa.',
    accent: '#b4533c',
  },
  'siwa-experiences': {
    category: 'adventure',
    sectionId: 'sec_5_experiences',
    label: 'Siwa Experiences',
    title: 'Explore Siwa Oasis',
    description: 'Discover tours, journeys, activities, guides, and packages, with their participating service providers.',
    accent: '#287a55',
  },
  'siwa-retreat': {
    category: 'wellness',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Retreat',
    title: 'Rest and restore in Siwa',
    description: 'Explore wellness stays, salt lakes, hot springs, sand baths, spas, and restorative retreats.',
    accent: '#58765a',
  },
  'siwa-move': {
    category: 'logistics',
    sectionId: 'sec_6_guardian',
    label: 'Siwa Move',
    title: 'Move around Siwa with ease',
    description: 'Find transfers, tuk-tuks, 4x4 transport, rentals, and mobility offers from local providers.',
    accent: '#a15d2b',
  },
  'siwa-craft': {
    category: 'crafts',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Craft',
    title: 'Discover craft and makers in Siwa',
    description: 'Explore handmade goods, workshops, artisan businesses, and local product offers.',
    accent: '#9b6832',
  },
  'siwa-grown-produced': {
    category: 'agriculture_industry',
    sectionId: 'sec_9_marketplace_catalog',
    label: 'Siwa Grown & Produced',
    title: 'Explore what Siwa grows and makes',
    description: 'Connect with farms, date and olive producers, food processors, factories, and trade suppliers.',
    accent: '#477448',
  },
  'siwa-invest': {
    category: 'investment_parent',
    sectionId: 'sec_7_investment',
    label: 'Siwa Invest',
    icon: 'fa-chart-line',
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
    title: 'Invest in Siwa Oasis',
    description: 'Explore approved investments and partnerships from Siwify and businesses across Siwa.',
    accent: '#98713a',
  },
  'siwa-services': {
    category: 'services_professional',
    sectionId: 'sec_6_guardian',
    label: 'Siwa Services',
    title: 'Find services across Siwa businesses',
    description: 'Discover local operators and professional providers supporting stays, dining, journeys, transport, and trade.',
    accent: '#64776b',
  },
} as const;

export type BrandSectorSlug = keyof typeof BRAND_SECTORS;

export const HOME_BRAND_SECTOR_SLUGS = [
  'siwa-stay',
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
  food: 'siwa-products',
  restaurant: 'siwa-products',
  cafe: 'siwa-products',
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