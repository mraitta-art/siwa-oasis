/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SIWIFY — RETREAT PROGRAM & MULTI-DAY VIBE ORCHESTRATION CONTRACTS
 *  Supports Day-by-Day Vibe Journeys combining Accommodation, Transports,
 *  Dining, Activities, and Tours with start/end schedules and standalone reuse.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { CommercialItem } from './commercial-types';

export interface RetreatTimeSlot {
  id: string;
  time_start: string;       // e.g. "07:30"
  time_end: string;         // e.g. "09:00"
  sector: 'accommodation' | 'transports' | 'activities' | 'dining' | 'tours';
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  business_id?: string;
  business_name: string;
  location_name: string;
  item_id?: string;
  price: number;
  is_customizable?: boolean;
}

export interface RetreatDayProgram {
  day_number: number;
  vibe_key: 'lake_silence' | 'desert_stars' | 'heritage_wisdom' | 'hot_springs' | 'salt_healing';
  vibe_title_en: string;
  vibe_title_ar: string;
  vibe_quote_en: string;
  vibe_quote_ar: string;
  vibe_badge_en: string;
  vibe_badge_ar: string;
  vibe_view: string; // e.g. "Lake View", "Endless Dunes", "Ancient Citadel"
  vibe_color: string;
  
  // Selected daily modular commercial items:
  accommodation: CommercialItem;
  transport: CommercialItem;
  dining: CommercialItem;
  activity: CommercialItem;
  tour?: CommercialItem;

  timeline: RetreatTimeSlot[];
  day_price: number;
}

export interface RetreatProgram {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  tagline_en: string;
  tagline_ar: string;
  duration_days: number;
  duration_nights: number;
  hero_image: string;
  badge_en: string;
  badge_ar: string;
  base_price_egp: number;
  discounted_price_egp: number;
  discount_percentage: number;
  vibe_tags: string[];
  inclusions_en: string[];
  inclusions_ar: string[];
  days: RetreatDayProgram[];
}

export interface RetreatBookingPayload {
  retreat_id: string;
  retreat_title: string;
  start_date: string;
  end_date: string;
  adults_count: number;
  children_count: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_notes?: string;
  total_price: number;
  currency: string;
  custom_days?: Array<{
    day_number: number;
    accommodation_id: string;
    transport_id: string;
    dining_id: string;
    activity_id: string;
  }>;
}
