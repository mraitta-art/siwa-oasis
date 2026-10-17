import fs from 'fs';
import path from 'path';
import { CardCustomLink, CommercialItem } from './commercial-types';
import { DEFAULT_COMMERCIAL_ITEMS } from './commercial-catalog';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'commercial-card-links.json');

export interface CommercialLinksRecord {
  item_id: string;
  custom_links: CardCustomLink[];
  updated_at: string;
}

// Built-in starter links showcasing registered platform vendors, OTA benchmarks, and direct partners
export const INITIAL_CUSTOM_LINKS: Record<string, CardCustomLink[]> = {
  acc_taziry_standard: [
    {
      id: 'lnk_taziry_platform',
      title: 'Taziry Lodge Platform Profile',
      url: '/jana/vendors?search=taziry',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Verified Partner 🛡️',
      accent_color: '#16a34a',
      icon: '🛡️',
      is_active: true
    },
    {
      id: 'lnk_taziry_booking',
      title: 'Booking.com Price Check',
      url: 'https://www.booking.com/searchresults.html?ss=Siwa+Oasis',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'Booking.com (EGP 2,750) ↗',
      benchmark_price: 2750,
      ota_name: 'Booking.com',
      accent_color: '#003580',
      icon: '🏨',
      is_active: true
    },
    {
      id: 'lnk_taziry_tripadvisor',
      title: 'TripAdvisor Traveler Reviews',
      url: 'https://www.tripadvisor.com/Hotels-g303856-Siwa_Matrouh_Governorate-Hotels.html',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'TripAdvisor 4.9★ ↗',
      ota_name: 'TripAdvisor',
      accent_color: '#00aa6c',
      icon: '⭐',
      is_active: true
    }
  ],
  acc_aghurmi_lake_sanctuary: [
    {
      id: 'lnk_aghurmi_platform',
      title: 'Aghurmi Sanctuary Verified Page',
      url: '/jana/vendors?search=aghurmi',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Verified Partner 🛡️',
      accent_color: '#16a34a',
      icon: '🛡️',
      is_active: true
    },
    {
      id: 'lnk_aghurmi_booking',
      title: 'Booking.com Benchmark',
      url: 'https://www.booking.com/searchresults.html?ss=Siwa+Oasis',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'Booking.com (EGP 3,200) ↗',
      benchmark_price: 3200,
      ota_name: 'Booking.com',
      accent_color: '#003580',
      icon: '🏨',
      is_active: true
    }
  ],
  acc_dunes_glamping_camp: [
    {
      id: 'lnk_glamping_platform',
      title: 'Siwa Desert Glamping Official',
      url: '/jana/vendors?search=glamping',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Verified Partner 🛡️',
      accent_color: '#16a34a',
      icon: '⛺',
      is_active: true
    },
    {
      id: 'lnk_glamping_ota',
      title: 'External Glamping Price Check',
      url: 'https://www.tripadvisor.com/Hotels-g303856-Siwa_Matrouh_Governorate-Hotels.html',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'OTA Rate: EGP 2,950 ↗',
      benchmark_price: 2950,
      ota_name: 'TripAdvisor',
      accent_color: '#00aa6c',
      icon: '⭐',
      is_active: true
    }
  ],
  din_abdu_feast: [
    {
      id: 'lnk_abdu_platform',
      title: 'Abdu Restaurant Official Profile',
      url: '/jana/vendors?search=abdu',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Verified Partner 🛡️',
      accent_color: '#16a34a',
      icon: '🍽️',
      is_active: true
    },
    {
      id: 'lnk_abdu_tripadvisor',
      title: 'TripAdvisor Heritage Dining',
      url: 'https://www.tripadvisor.com/Restaurants-g303856-Siwa_Matrouh_Governorate.html',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'TripAdvisor Reviews ↗',
      benchmark_price: 480,
      ota_name: 'TripAdvisor Concierge',
      accent_color: '#00aa6c',
      icon: '⭐',
      is_active: true
    },
    {
      id: 'lnk_abdu_google',
      title: 'Google Maps & Live Photos',
      url: 'https://maps.google.com/?q=Abdu+Restaurant+Siwa',
      type: 'custom',
      is_registered_vendor: false,
      badge_text: 'Google Maps 4.8★ ↗',
      accent_color: '#ea4335',
      icon: '📍',
      is_active: true
    }
  ],
  din_lake_candlelit: [
    {
      id: 'lnk_lake_platform',
      title: 'Aghurmi Lake Deck Official Profile',
      url: '/jana/vendors?search=aghurmi',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Verified Partner 🛡️',
      accent_color: '#16a34a',
      icon: '🕯️',
      is_active: true
    },
    {
      id: 'lnk_lake_dining_ota',
      title: 'OTA Luxury Dining Reference',
      url: 'https://www.tripadvisor.com/Restaurants-g303856-Siwa_Matrouh_Governorate.html',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'OTA Rate: EGP 550 ↗',
      benchmark_price: 550,
      ota_name: 'TripAdvisor Luxury',
      accent_color: '#00aa6c',
      icon: '⭐',
      is_active: true
    }
  ],
  trn_cairo_siwa_bus_coach: [
    {
      id: 'lnk_westdelta_platform',
      title: 'Siwa Royal Express Fleet Hub',
      url: '/jana/vendors?search=express',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Fleet Partner 🛡️',
      accent_color: '#0284c7',
      icon: '🚌',
      is_active: true
    },
    {
      id: 'lnk_bus_station_check',
      title: 'TripAdvisor Station & Coach Reviews',
      url: 'https://www.tripadvisor.com/Attractions-g303856-Activities-c59-Siwa_Matrouh_Governorate.html',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'Benchmark Rate: EGP 550 ↗',
      benchmark_price: 550,
      ota_name: 'OTA Transit',
      accent_color: '#475569',
      icon: '🎫',
      is_active: true
    }
  ],
  trn_landcruiser_4x4: [
    {
      id: 'lnk_desert_riders_platform',
      title: 'Siwa Desert 4x4 Pilots Guild',
      url: '/jana/vendors?search=riders',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Verified Pilot 🛡️',
      accent_color: '#16a34a',
      icon: '🚙',
      is_active: true
    },
    {
      id: 'lnk_viator_4x4',
      title: 'Viator Safari Price Check',
      url: 'https://www.viator.com/Egypt-tours/4WD-Tours/d723-tag21703',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'Viator Rate: EGP 2,400 ↗',
      benchmark_price: 2400,
      ota_name: 'Viator',
      accent_color: '#00aa6c',
      icon: '⭐',
      is_active: true
    }
  ],
  act_salt_lake_float: [
    {
      id: 'lnk_salt_platform',
      title: 'Zaytoun Salt Sanctuary Profile',
      url: '/jana/vendors?search=salt',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Verified Partner 🛡️',
      accent_color: '#16a34a',
      icon: '🌊',
      is_active: true
    },
    {
      id: 'lnk_salt_viator',
      title: 'TripAdvisor / Viator Salt Basin Float',
      url: 'https://www.viator.com/Egypt-tours/Thermal-Spas-and-Hot-Springs/d723-tag21882',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'OTA Float Rate: EGP 420 ↗',
      benchmark_price: 420,
      ota_name: 'Viator',
      accent_color: '#00aa6c',
      icon: '⭐',
      is_active: true
    }
  ],
  tur_shali_oracle_walk: [
    {
      id: 'lnk_amun_platform',
      title: 'Amun Cultural Expeditions Profile',
      url: '/jana/vendors?search=amun',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Licensed Guide 🛡️',
      accent_color: '#16a34a',
      icon: '🏛️',
      is_active: true
    },
    {
      id: 'lnk_amun_viator',
      title: 'Viator Guided Tour Check',
      url: 'https://www.viator.com/Egypt-tours/Historical-and-Heritage-Tours/d723-tag21443',
      type: 'external_ota',
      is_registered_vendor: false,
      badge_text: 'Viator Rate: EGP 900 ↗',
      benchmark_price: 900,
      ota_name: 'Viator',
      accent_color: '#00aa6c',
      icon: '⭐',
      is_active: true
    }
  ],
  prd_extra_virgin_olive_oil: [
    {
      id: 'lnk_harvest_platform',
      title: 'Siwa Organic Olive Press Official',
      url: '/jana/vendors?search=press',
      type: 'platform_vendor',
      is_registered_vendor: true,
      badge_text: 'Platform Certified Mill 🛡️',
      accent_color: '#16a34a',
      icon: '🫒',
      is_active: true
    },
    {
      id: 'lnk_harvest_direct',
      title: 'Direct Mill WhatsApp Hotline',
      url: 'https://wa.me/201009876543?text=Order%20Cold%20Pressed%20Olive%20Oil',
      type: 'social_contact',
      is_registered_vendor: false,
      badge_text: 'WhatsApp Direct 💬',
      accent_color: '#25D366',
      icon: '💬',
      is_active: true
    }
  ]
};

/**
 * Load saved custom links from data/commercial-card-links.json
 */
export function getSavedCustomLinks(): Record<string, CardCustomLink[]> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      // Save initial defaults
      fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_CUSTOM_LINKS, null, 2), 'utf-8');
      return INITIAL_CUSTOM_LINKS;
    }
    const content = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return { ...INITIAL_CUSTOM_LINKS, ...parsed };
  } catch (err) {
    console.error('Error reading commercial-card-links.json:', err);
    return INITIAL_CUSTOM_LINKS;
  }
}

/**
 * Save custom links to data/commercial-card-links.json
 */
export function saveCustomLinks(linksMap: Record<string, CardCustomLink[]>): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(linksMap, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving commercial-card-links.json:', err);
    return false;
  }
}

/**
 * Enrich commercial items with admin-configured links
 */
export function getEnrichedCommercialItems(baseItems: CommercialItem[] = DEFAULT_COMMERCIAL_ITEMS): CommercialItem[] {
  const customLinksMap = getSavedCustomLinks();

  return baseItems.map(item => {
    const itemCustomLinks = customLinksMap[item.id] || [];
    return {
      ...item,
      custom_links: itemCustomLinks
    };
  });
}
