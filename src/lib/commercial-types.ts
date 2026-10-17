/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SIWIFY — COMMERCIAL BOOKING & MULTI-SECTOR DATA CONTRACTS
 *  Supports 6 Sectors: Accommodation, Dining, Products, Transports, Activities, Tours
 *  With 3 Commercial Layers: Standard Direct Booking, Packages, Discounts, & Offers
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type SectorType = 
  | 'accommodation'
  | 'dining'
  | 'products'
  | 'transports'
  | 'activities'
  | 'tours';

export type CommercialKind = 
  | 'direct'      // Standard single item or service booking
  | 'package'     // Bundled multi-experience or multi-day package
  | 'discount'    // Discounted rate (percentage or early bird)
  | 'offer';      // Special limited-time deal or seasonal promo

export interface CommercialOption {
  id: string;
  name_en: string;
  name_ar: string;
  price_delta?: number;
  multiplier?: number;
  description_en?: string;
  capacity?: string;
}

export interface CommercialItem {
  id: string;
  sector: SectorType;
  kind: CommercialKind;
  business_id?: string;
  business_name: string;
  business_slug?: string;
  business_phone?: string;
  whatsapp_number?: string;
  
  // Title & description
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  
  // Visuals
  image: string;
  icon?: string;
  badge_en?: string;
  badge_ar?: string;
  
  // Pricing
  price: number;
  original_price?: number;
  discount_percentage?: number;
  price_unit: string; // e.g. 'night', 'person', 'trip', 'bottle', 'kg', 'session'
  currency: string;   // 'EGP'
  
  // Sector-specific options
  options?: CommercialOption[];
  
  // Package inclusions (for 'package' kind)
  inclusions?: string[];
  
  // Deal terms (for 'discount' and 'offer' kinds)
  valid_until?: string;
  promo_code?: string;
  minimum_order?: number; // e.g. min 2 nights, min 2 persons, min 3 jars
  
  // Ratings & location
  rating?: number;
  reviews_count?: number;
  location_name?: string;

  // Vibe & Retreat timeline integration
  vibe_tags?: string[]; // e.g. ['lake_view', 'silence', 'desert_dunes', 'heritage', 'wellness', 'relaxation']
  check_in_time?: string;
  check_out_time?: string;
  duration_label?: string;

  // Architectural, Sensory & Culinary DNA (Dining, Lodging, Venues)
  building_material?: string; // e.g. 'Hand-hewn Kershef Mudbrick & Palm Wood', 'Bedouin Starlight Sand Pit'
  view_type?: string;         // e.g. 'Waterfront Salt Lake Horizon', 'Endless Golden Dunes', 'Old Shali Citadel'
  vibe_ambience?: string;     // e.g. 'Candlelit Acoustic Silence', 'Fireplace Starlight Circle'
  seating_style?: string;     // e.g. 'Handwoven Bedouin Kilims on Soft Sand', 'Carved Wooden Terrace'
  menu_highlights?: string[]; // e.g. ['Subterranean Mandi Lamb', 'Siwan Date Salad', 'Wild Mint Tea']
  dietary_tags?: string[];    // e.g. ['Farm-to-Table', 'Vegetarian Available', '100% Organic']
}



export interface BookingPayload {
  item_id: string;
  item_title: string;
  sector: SectorType;
  kind: CommercialKind;
  business_id?: string;
  business_name: string;
  business_phone?: string;
  whatsapp_number?: string;
  
  // Customer details
  customer_name: string;
  customer_phone: string;
  customer_notes?: string;
  
  // Booking specific parameters
  start_date?: string;
  end_date?: string;
  start_time?: string;
  adults_count: number;
  children_count: number;
  quantity: number;
  selected_option_id?: string;
  selected_option_name?: string;
  
  // Calculated financial breakdown
  unit_price: number;
  total_price: number;
  discount_applied?: number;
  currency: string;
}
