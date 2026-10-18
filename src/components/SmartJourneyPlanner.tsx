'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface CatalogItem {
  id: string;
  is_visible: boolean;
  vendor_business_ids?: string[];
  image?: string;
  icon?: string;
  title_en?: string;
  title_ar?: string;
  name_en?: string;
  name_ar?: string;
  category?: string;
  category_ar?: string;
  duration?: string;
  duration_ar?: string;
  base_price_egp?: number;
  price_per_night?: number;
  rate_per_day?: number;
  price_per_person?: number;
  highlight_en?: string;
  highlight_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  badge_en?: string;
  badge_ar?: string;
  room_types?: RoomTypeOption[];

  // Rich Accommodation & Stay Planner specific attributes
  business_id?: string;
  business_slug?: string;
  business_name?: string;
  business_phone?: string | null;
  whatsapp_number?: string;
  provider_type?: 'hotel' | 'operator' | 'siwify_direct' | 'artisan';
  provider_badge?: string;
  is_trusted?: boolean;
  setting_location?: string;
  vibe_tags?: string[];
  accommodation_type?: string;
  view_type?: string;
  building_material?: string;
  has_pool?: boolean;
  hot_spring?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  ota_benchmark_price?: number;
  ota_name?: string;
  external_check_url?: string | null;
  minisite_url?: string;
  direct_discount_note?: string;
  rating?: number;
  reviews_count?: number;
  location_name?: string;
  gallery_images?: string[];
}

export interface RoomTypeOption {
  id: string;
  name_en: string;
  name_ar: string;
  multiplier: number;
  capacity: string;
}

export interface StayPeriod {
  id: string;
  item_id: string;
  hotel_name: string;
  room_type_id: string;
  room_type_name: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  nights: number;
  price_per_night: number;
  total_price: number;
}

export interface TourBooking {
  id: string;
  item: CatalogItem;
  tour_date: string;
  departure_time: string;
  return_time: string;
  guide_language: string;
  price_per_person: number;
  total_price: number;
}

export interface TransportLeg {
  id: string;
  item_id: string;
  vehicle_name: string;
  route_label: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  days: number;
  rate_per_day: number;
  total_price: number;
}

export interface DiningBooking {
  id: string;
  item: CatalogItem;
  dining_date: string;
  time_slot: string;
  guests_count: number;
  price_per_person: number;
  total_price: number;
}

export interface ActivityBooking {
  id: string;
  item: CatalogItem;
  activity_date: string;
  time_slot: string;
  duration_hours: string;
  price_per_person: number;
  total_price: number;
}

export interface CustomWish {
  id: string;
  category: string;
  title: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  duration?: string;
  notes?: string;
  is_custom_wish: true;
}

export interface SmartJourneyPlannerProps {
  title?: string;
  subtitle?: string;
  mode?: 'all' | 'accommodation' | 'safaris' | 'activities' | 'transport' | 'dining';
  category?: string;
}

// ─── DEFAULT CONFIGURATION & ROOM TYPES ─────────────────────────────────────

const DEFAULT_ROOM_TYPES: RoomTypeOption[] = [
  { id: 'standard', name_en: 'Authentic Mudbrick Room', name_ar: 'غرفة كرشيف تقليدية', multiplier: 1.0, capacity: '2 Guests' },
  { id: 'deluxe', name_en: 'Deluxe Salt & Palm Suite', name_ar: 'جناح ملحي فاخر مع إطلالة النخيل', multiplier: 1.35, capacity: '2-3 Guests' },
  { id: 'glamp', name_en: 'Royal Desert Glamping Tent', name_ar: 'خيمة فندقية ملكية في الكثبان', multiplier: 1.5, capacity: '2 Guests' },
  { id: 'villa', name_en: 'Private Bedouin Chalet / Villa', name_ar: 'شاليه / فيلا بدوية خاصة', multiplier: 1.9, capacity: '4-6 Guests' },
];

const DEFAULT_ACCOMMODATIONS: CatalogItem[] = [
  {
    id: 'stay_authentic_ecolodge',
    is_visible: true,
    name_en: 'Heritage Salt & Palm Eco-Lodge',
    name_ar: 'نزل بيئي تقليدي من حجر الكرشيف والملح',
    desc_en: 'Authentic candlelit kershef lodge surrounded by organic date palms and freshwater spring.',
    price_per_night: 1800,
    badge_en: 'Eco Certified',
    icon: '🛖',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    room_types: DEFAULT_ROOM_TYPES,
    ota_benchmark_price: 2250,
    ota_name: 'Booking.com',
    external_check_url: 'https://www.booking.com/searchresults.html?ss=Siwa+Oasis',
    direct_discount_note: 'Book direct on Siwify & save 450 EGP vs Booking.com + welcome herbal tea',
  },
  {
    id: 'stay_luxury_desert_camp',
    is_visible: true,
    name_en: 'Great Sand Sea Luxury Glamping Camp',
    name_ar: 'مخيم فندقي فاخر في قلب بحر الرمال الأعظم',
    desc_en: 'Bedouin royal canvas suite, private campfire, dune sunrise viewing, private bath.',
    price_per_night: 2400,
    badge_en: 'Stargazer Choice',
    icon: '⛺',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80',
    room_types: DEFAULT_ROOM_TYPES,
    ota_benchmark_price: 2950,
    ota_name: 'Booking.com',
    external_check_url: 'https://www.booking.com/searchresults.html?ss=Siwa+Camp',
    direct_discount_note: 'Direct Bedouin Offer: Save 550 EGP vs OTAs + private sunset campfire ceremony',
  },
  {
    id: 'stay_oasis_chalet',
    is_visible: true,
    name_en: 'Fatnas Island Sunset Palm Villa',
    name_ar: 'فيلا واحة فطناس بإطلالة الغروب والبحيرة',
    desc_en: 'Private secluded waterfront retreat directly facing the sunset salt lake with private garden.',
    price_per_night: 2900,
    badge_en: 'Waterfront Sunset',
    icon: '🌴',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    room_types: DEFAULT_ROOM_TYPES,
    ota_benchmark_price: 3600,
    ota_name: 'Booking.com',
    external_check_url: 'https://www.booking.com/searchresults.html?ss=Siwa+Villa',
    direct_discount_note: 'Siwify Exclusive: Save 700 EGP + complimentary Fatnas salt lake boat session',
  },
];

const DEFAULT_EXPERIENCES: CatalogItem[] = [
  {
    id: 'exp_great_sand_sea',
    is_visible: true,
    title_en: '4x4 Great Sand Sea Safari & Sunset Sandboarding',
    title_ar: 'سفاري بحر الرمال الأعظم بسيارات الدفع الرباعي',
    category: 'Safari & Adventure',
    duration: 'Half Day / Sunset',
    base_price_egp: 1250,
    highlight_en: 'Giant dunes crossing, fossil ocean site, Bedouin tea & sandboarding',
    icon: '🚙',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
    ota_benchmark_price: 1550,
    ota_name: 'TripAdvisor',
    external_check_url: 'https://www.tripadvisor.com/Search?q=Siwa+Safari',
    direct_discount_note: 'Direct Booking Perk: Save 300 EGP + private dune sandboarding instructor included',
  },
  {
    id: 'exp_salt_lakes',
    is_visible: true,
    title_en: 'Salt Lakes Floating & Crystal Mineral Pools',
    title_ar: 'الطفو في بحيرات الملح وعيون المياه المعدنية العلاجية',
    category: 'Wellness & Nature',
    duration: '3-4 Hours',
    base_price_egp: 450,
    highlight_en: 'Zero-gravity salt float + pure olive oil rinse in ancient palms',
    icon: '🌊',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
    ota_benchmark_price: 600,
    ota_name: 'Viator',
    external_check_url: 'https://www.viator.com/searchResults/all?text=Siwa+Salt+Lakes',
    direct_discount_note: 'Direct Oasis Offer: Save 150 EGP + fresh spring rinse & local dates included',
  },
  {
    id: 'exp_shali_amun_oracle',
    is_visible: true,
    title_en: 'Ancient Fortress of Shali & Temple of the Oracle Walk',
    title_ar: 'جولة تاريخية في قلعة شالي القديمة ومعبد الوحي آمون',
    category: 'Heritage & History',
    duration: '2.5 Hours',
    base_price_egp: 350,
    highlight_en: 'Kershef mud-brick fortress climb with local Siwan storyteller',
    icon: '🏛️',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    ota_benchmark_price: 480,
    ota_name: 'GetYourGuide',
    external_check_url: 'https://www.getyourguide.com/s/?q=Siwa',
    direct_discount_note: 'Direct Heritage Offer: Native Siwi elder guide + sunset tea atop Shali citadel',
  },
];

const DEFAULT_TRANSPORTS: CatalogItem[] = [
  {
    id: 'trans_vip_cairo_transfer',
    is_visible: true,
    name_en: 'VIP Private Direct Transfer (Cairo / Alex <-> Siwa)',
    name_ar: 'توصيل سياحي خاص ومباشر (القاهرة / الإسكندرية إلى سيوة)',
    desc_en: 'Door-to-door luxury air-conditioned van with refreshments and rest stops.',
    rate_per_day: 3500,
    icon: '🚐',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
  },
  {
    id: 'trans_4x4_safari_cruiser',
    is_visible: true,
    name_en: 'Private 4x4 Land Cruiser with Siwan Desert Pilot',
    name_ar: 'سيارة لاندكروزر دفع رباعي خاصة مع سائق خبير بالصحراء',
    desc_en: 'Fully desert-equipped 4WD with air conditioning, deflation gear, and licensed pilot.',
    rate_per_day: 1800,
    icon: '🚙',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
  },
  {
    id: 'trans_local_tuktuk_oasis',
    is_visible: true,
    name_en: 'Local Oasis Shuttle & Sightseeing Vehicle',
    name_ar: 'وسيلة تنقل سيوية خفيفة للجولات المحلية داخل الواحة',
    desc_en: 'Daily on-demand local transit between palm groves, Shali fortress, and salt lakes.',
    rate_per_day: 600,
    icon: '🛺',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
  },
];

const DEFAULT_MEALS: CatalogItem[] = [
  {
    id: 'meal_bedouin_sunset_feast',
    is_visible: true,
    name_en: 'Traditional Under-Sand Roasted Lamb (Radm) Feast',
    name_ar: 'وليمة لحم الردم البدوي المطهو تحت رمال الصحراء',
    desc_en: 'Slow-cooked lamb under hot desert sand, Siwan spiced rice, fresh garden salad, and lemongrass tea.',
    price_per_person: 450,
    icon: '🔥',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  },
  {
    id: 'meal_palm_garden_lunch',
    is_visible: true,
    name_en: 'Organic Palm Grove Farm-to-Table Lunch',
    name_ar: 'غداء ريفي عضوي في مزارع النخيل وعيون المياه',
    desc_en: 'Freshly baked Siwan flatbread, sun-ripened olives, local duck or chicken tajine, date sweet.',
    price_per_person: 280,
    icon: '🍽️',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  },
];

// ─── STYLES & LUXURY PALETTE ────────────────────────────────────────────────

const S = {
  wrap: { padding: '5rem 0', background: '#0a0d14', color: '#f8fafc', borderTop: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' } as React.CSSProperties,
  goldBadge: {
    background: 'rgba(212,175,55,0.15)', color: '#D4AF37',
    border: '1px solid rgba(212,175,55,0.3)', padding: '0.25rem 0.75rem',
    borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px',
    textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  },
  h2: { fontSize: 'clamp(1.85rem, 3.2vw, 2.5rem)', fontWeight: 900, margin: '0.5rem 0', letterSpacing: '-0.5px' } as React.CSSProperties,
  sub: { color: '#94a3b8', fontSize: '0.95rem', maxWidth: '680px', lineHeight: 1.6 } as React.CSSProperties,
  card: {
    background: '#111520', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px', padding: '1.5rem', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '0.75rem 1rem', background: '#0a0d14',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff',
    fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s',
  } as React.CSSProperties,
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function SmartJourneyPlanner({
  title,
  subtitle,
  mode: propMode,
  category: propCategory,
}: SmartJourneyPlannerProps) {
  // Determine effective mode: 'all' or standalone category ('accommodation', 'safaris', etc.)
  const initialMode = useMemo(() => {
    if (propMode) return propMode;
    if (propCategory) {
      const lower = propCategory.toLowerCase();
      if (lower.includes('accom') || lower.includes('hotel') || lower.includes('stay')) return 'accommodation';
      if (lower.includes('advent') || lower.includes('safari') || lower.includes('tour') || lower.includes('exp')) return 'safaris';
      if (lower.includes('logis') || lower.includes('trans') || lower.includes('move')) return 'transport';
      if (lower.includes('food') || lower.includes('rest') || lower.includes('dine') || lower.includes('table')) return 'dining';
      if (lower.includes('well') || lower.includes('retreat')) return 'activities';
    }
    return 'all';
  }, [propMode, propCategory]);

  const [activeMode, setActiveMode] = useState<SmartJourneyPlannerProps['mode']>(initialMode);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'accommodation' | 'safaris' | 'activities' | 'transport' | 'dining'>('accommodation');

  // Loaded Catalog Data
  const [catalog, setCatalog] = useState<{
    bundle_discount_percent: number;
    experiences: CatalogItem[];
    accommodations: CatalogItem[];
    transports: CatalogItem[];
    meals: CatalogItem[];
  }>({
    bundle_discount_percent: 15,
    experiences: DEFAULT_EXPERIENCES,
    accommodations: DEFAULT_ACCOMMODATIONS,
    transports: DEFAULT_TRANSPORTS,
    meals: DEFAULT_MEALS,
  });

  // ── MULTI-ITEM & MULTI-PERIOD STATE ───────────────────────────────────────
  
  // 1. Multiple Accommodations with room types & dates
  const [stayPeriods, setStayPeriods] = useState<StayPeriod[]>([]);
  // Stay configurator form state
  const [pendingStayItem, setPendingStayItem] = useState<CatalogItem | null>(null);
  const [stayConfig, setStayConfig] = useState({
    room_type_id: 'standard',
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '14:00',
    end_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    end_time: '11:00',
  });

  // 2. Multiple Tours & Safaris
  const [tourBookings, setTourBookings] = useState<TourBooking[]>([]);
  
  // 3. Multiple Transport Legs
  const [transportLegs, setTransportLegs] = useState<TransportLeg[]>([]);
  const [pendingTransItem, setPendingTransItem] = useState<CatalogItem | null>(null);
  const [transConfig, setTransConfig] = useState({
    route_label: 'Cairo -> Siwa VIP Transfer',
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '07:00',
    end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    end_time: '16:00',
    coverage_days: 1,
  });

  // 4. Multiple Dining Bookings
  const [diningBookings, setDiningBookings] = useState<DiningBooking[]>([]);

  // 5. Multiple Activities Bookings
  const [activityBookings, setActivityBookings] = useState<ActivityBooking[]>([]);

  // 6. Crowdsourced Custom Wishes
  const [customWishes, setCustomWishes] = useState<CustomWish[]>([]);
  const [showCustomWishModal, setShowCustomWishModal] = useState(false);
  const [wishInput, setWishInput] = useState({
    title: '',
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '14:00',
    notes: '',
  });

  // Guests & Preferences
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guideLanguage, setGuideLanguage] = useState('English');

  // Side-Part Inspector Drawer state
  const [inspectingItem, setInspectingItem] = useState<{
    item: CatalogItem;
    category: string;
  } | null>(null);

  // Customer Contact & Dispatch State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // ── ACCOMMODATION MANIFEST & BUDGET EXPANDER STATE ─────────────────────────
  const [isAccManifestOpen, setIsAccManifestOpen] = useState(true);
  const [isCalculatorCollapsed, setIsCalculatorCollapsed] = useState(false);
  const [editingStayId, setEditingStayId] = useState<string | null>(null);
  const [showCalendarAuditModal, setShowCalendarAuditModal] = useState(false);

  // ── LOAD DRAFT FROM LOCALSTORAGE ON MOUNT ─────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('siwify_journey_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.stayPeriods)) setStayPeriods(parsed.stayPeriods);
        if (Array.isArray(parsed.tourBookings)) setTourBookings(parsed.tourBookings);
        if (Array.isArray(parsed.transportLegs)) setTransportLegs(parsed.transportLegs);
        if (Array.isArray(parsed.diningBookings)) setDiningBookings(parsed.diningBookings);
        if (Array.isArray(parsed.activityBookings)) setActivityBookings(parsed.activityBookings);
        if (Array.isArray(parsed.customWishes)) setCustomWishes(parsed.customWishes);
        if (parsed.adults) setAdults(parsed.adults);
        if (parsed.children) setChildren(parsed.children);
      }
    } catch {}

    // Fetch dynamic journey customizer catalog
    fetch('/api/journeys/customizer')
      .then(r => r.json())
      .then(d => {
        if (d?.catalog) {
          setCatalog(prev => ({
            ...prev,
            ...d.catalog,
            experiences: d.catalog.experiences?.length ? d.catalog.experiences : prev.experiences,
            transports: d.catalog.transports?.length ? d.catalog.transports : prev.transports,
            meals: d.catalog.meals?.length ? d.catalog.meals : prev.meals,
          }));
        }
      })
      .catch(() => {});

    // Fetch live accommodation vendors from DB & Master Template baseline
    fetch('/api/accommodation-vendors?limit=60')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          const liveAccommodations: CatalogItem[] = data.items.map((item: any) => ({
            id: item.id || `acc_${item.business_id}`,
            is_visible: true,
            vendor_business_ids: item.business_id ? [item.business_id] : [],
            name_en: item.title_en || item.business_name,
            name_ar: item.title_ar || item.business_name,
            desc_en: item.desc_en,
            desc_ar: item.desc_ar,
            price_per_night: item.price || 1800,
            badge_en: item.is_trusted ? 'Verified Sanctuary' : (item.badge_en || 'Siwa Haven'),
            icon: item.accommodation_type === 'glamping' ? '⛺' : item.accommodation_type === 'villa' ? '🏡' : '🛖',
            image: item.image || item.gallery_images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
            room_types: (item.options && item.options.length > 0) ? item.options : DEFAULT_ROOM_TYPES,
            
            // Rich Accommodation & Provider Attributes
            business_id: item.business_id,
            business_slug: item.business_slug,
            business_name: item.business_name,
            business_phone: item.business_phone,
            whatsapp_number: item.whatsapp_number,
            provider_type: item.provider_type || 'hotel',
            provider_badge: item.provider_badge || (item.is_trusted ? 'Verified Hotel Partner 🛡️' : 'Hotel Partner'),
            is_trusted: item.is_trusted,
            setting_location: item.setting_location,
            vibe_tags: item.vibe_tags,
            accommodation_type: item.accommodation_type,
            view_type: item.view_type,
            building_material: item.building_material,
            has_pool: item.has_pool,
            hot_spring: item.hot_spring,
            check_in_time: item.check_in_time || '14:00',
            check_out_time: item.check_out_time || '11:00',
            ota_benchmark_price: item.comparison_links?.ota_benchmark_price,
            ota_name: item.comparison_links?.ota_name || 'Booking.com',
            external_check_url: item.external_check_url || item.comparison_links?.booking_com_url,
            minisite_url: item.minisite_url,
            direct_discount_note: item.direct_discount_note,
            rating: item.rating,
            reviews_count: item.reviews_count,
            location_name: item.location_name,
            gallery_images: item.gallery_images,
          }));

          setCatalog(prev => ({
            ...prev,
            accommodations: liveAccommodations,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // ── SAVE DRAFT TO LOCALSTORAGE ON UPDATES ──────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('siwify_journey_draft', JSON.stringify({
        stayPeriods,
        tourBookings,
        transportLegs,
        diningBookings,
        activityBookings,
        customWishes,
        adults,
        children,
        updated_at: Date.now(),
      }));
    } catch {}
  }, [stayPeriods, tourBookings, transportLegs, diningBookings, activityBookings, customWishes, adults, children]);

  // If initialMode changed from props, sync activeMode
  useEffect(() => {
    setActiveMode(initialMode);
    if (initialMode !== 'all') {
      setActiveCategoryTab(initialMode as any);
    }
  }, [initialMode]);

  // ── DYNAMIC CALCULATIONS & COMBO PRICING ───────────────────────────────────

  const totalNights = useMemo(() => {
    return stayPeriods.reduce((sum, s) => sum + s.nights, 0);
  }, [stayPeriods]);

  const accommodationSubtotal = useMemo(() => {
    return stayPeriods.reduce((sum, s) => sum + s.total_price, 0);
  }, [stayPeriods]);

  const pricingSummary = useMemo(() => {
    let subtotal = 0;
    const totalGuests = adults + children * 0.5;

    // 1. Accommodations
    stayPeriods.forEach(s => {
      subtotal += s.total_price;
    });

    // 2. Tours
    tourBookings.forEach(t => {
      subtotal += t.price_per_person * adults + t.price_per_person * 0.5 * children;
    });

    // 3. Transports
    transportLegs.forEach(l => {
      subtotal += l.total_price;
    });

    // 4. Dining
    diningBookings.forEach(d => {
      subtotal += d.price_per_person * totalGuests;
    });

    // 5. Activities
    activityBookings.forEach(a => {
      subtotal += a.price_per_person * totalGuests;
    });

    // Count parent sectors for combo discount
    let sectorCount = 0;
    if (stayPeriods.length > 0) sectorCount++;
    if (tourBookings.length > 0) sectorCount++;
    if (transportLegs.length > 0) sectorCount++;
    if (diningBookings.length > 0) sectorCount++;
    if (activityBookings.length > 0) sectorCount++;
    if (customWishes.length > 0) sectorCount++;

    const isComboUnlocked = sectorCount >= 3;
    const discountPercent = isComboUnlocked ? (catalog.bundle_discount_percent || 15) : 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    return {
      subtotal,
      sectorCount,
      isComboUnlocked,
      discountPercent,
      discountAmount,
      finalTotal,
    };
  }, [stayPeriods, tourBookings, transportLegs, diningBookings, activityBookings, customWishes.length, adults, children, catalog.bundle_discount_percent]);

  // ── ACTION HANDLERS: ADDING / REMOVING MULTI-ITEMS ─────────────────────────

  const handleAddStayPeriod = (item: CatalogItem) => {
    const diff = Math.abs(new Date(stayConfig.end_date).getTime() - new Date(stayConfig.start_date).getTime());
    const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

    const roomTypes = item.room_types || DEFAULT_ROOM_TYPES;
    const selectedRoom = roomTypes.find(r => r.id === stayConfig.room_type_id) || roomTypes[0];
    const basePrice = item.price_per_night || 1800;
    const pricePerNight = Math.round(basePrice * selectedRoom.multiplier);
    const totalPrice = pricePerNight * nights;

    const newStay: StayPeriod = {
      id: `stay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      item_id: item.id,
      hotel_name: item.name_en || 'Oasis Accommodation',
      room_type_id: selectedRoom.id,
      room_type_name: selectedRoom.name_en,
      start_date: stayConfig.start_date,
      start_time: stayConfig.start_time,
      end_date: stayConfig.end_date,
      end_time: stayConfig.end_time,
      nights,
      price_per_night: pricePerNight,
      total_price: totalPrice,
    };

    setStayPeriods(prev => [...prev, newStay]);
    setPendingStayItem(null);
  };

  const handleRemoveStayPeriod = (stayId: string) => {
    setStayPeriods(prev => prev.filter(s => s.id !== stayId));
  };

  const handleUpdateStayPeriod = (stayId: string, updates: Partial<StayPeriod>) => {
    setStayPeriods(prev => prev.map(s => {
      if (s.id !== stayId) return s;
      const updated = { ...s, ...updates };
      // Recalculate nights and prices if dates or room changed
      const diff = Math.abs(new Date(updated.end_date).getTime() - new Date(updated.start_date).getTime());
      const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      updated.nights = nights;
      updated.total_price = updated.price_per_night * nights;
      return updated;
    }));
  };

  const handleToggleTour = (item: CatalogItem) => {
    const exists = tourBookings.find(t => t.item.id === item.id);
    if (exists) {
      setTourBookings(prev => prev.filter(t => t.item.id !== item.id));
    } else {
      const defaultDate = stayPeriods[0]?.start_date || new Date().toISOString().split('T')[0];
      setTourBookings(prev => [
        ...prev,
        {
          id: `tour_${Date.now()}_${item.id}`,
          item,
          tour_date: defaultDate,
          departure_time: '14:30',
          return_time: '19:00',
          guide_language: guideLanguage,
          price_per_person: item.base_price_egp || 500,
          total_price: (item.base_price_egp || 500) * (adults + children * 0.5),
        },
      ]);
    }
  };

  const handleAddTransportLeg = (item: CatalogItem) => {
    const days = Math.max(1, transConfig.coverage_days || 1);
    const rate = item.rate_per_day || 1800;
    const newLeg: TransportLeg = {
      id: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      item_id: item.id,
      vehicle_name: item.name_en || 'Private Transit',
      route_label: transConfig.route_label,
      start_date: transConfig.start_date,
      start_time: transConfig.start_time,
      end_date: transConfig.end_date,
      end_time: transConfig.end_time,
      days,
      rate_per_day: rate,
      total_price: rate * days,
    };
    setTransportLegs(prev => [...prev, newLeg]);
    setPendingTransItem(null);
  };

  const handleToggleDining = (item: CatalogItem) => {
    const exists = diningBookings.find(d => d.item.id === item.id);
    if (exists) {
      setDiningBookings(prev => prev.filter(d => d.item.id !== item.id));
    } else {
      const date = stayPeriods[0]?.start_date || new Date().toISOString().split('T')[0];
      setDiningBookings(prev => [
        ...prev,
        {
          id: `meal_${Date.now()}_${item.id}`,
          item,
          dining_date: date,
          time_slot: '19:30',
          guests_count: adults + children,
          price_per_person: item.price_per_person || 300,
          total_price: (item.price_per_person || 300) * (adults + children * 0.5),
        },
      ]);
    }
  };

  const handleToggleActivity = (item: CatalogItem) => {
    const exists = activityBookings.find(a => a.item.id === item.id);
    if (exists) {
      setActivityBookings(prev => prev.filter(a => a.item.id !== item.id));
    } else {
      const date = stayPeriods[0]?.start_date || new Date().toISOString().split('T')[0];
      setActivityBookings(prev => [
        ...prev,
        {
          id: `act_${Date.now()}_${item.id}`,
          item,
          activity_date: date,
          time_slot: '10:00',
          duration_hours: item.duration || '3 Hours',
          price_per_person: item.base_price_egp || 450,
          total_price: (item.base_price_egp || 450) * (adults + children * 0.5),
        },
      ]);
    }
  };

  const handleAddCustomWish = () => {
    if (!wishInput.title.trim()) return;
    const newWish: CustomWish = {
      id: `wish_${Date.now()}`,
      category: activeCategoryTab,
      title: wishInput.title,
      start_date: wishInput.start_date,
      start_time: wishInput.start_time,
      end_time: wishInput.end_time,
      notes: wishInput.notes,
      is_custom_wish: true,
    };
    setCustomWishes(prev => [...prev, newWish]);
    setShowCustomWishModal(false);
    setWishInput({
      title: '',
      start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '14:00',
      notes: '',
    });
  };

  // ── FINAL RESERVATION DISPATCH ────────────────────────────────────────────

  const handleDispatchReservation = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide your name and WhatsApp / phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryDates = stayPeriods.length > 0
        ? `${stayPeriods[0].start_date} to ${stayPeriods[stayPeriods.length - 1].end_date}`
        : transportLegs.length > 0
        ? `${transportLegs[0].start_date} to ${transportLegs[transportLegs.length - 1].end_date}`
        : `${new Date().toISOString().split('T')[0]}`;

      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        duration_days: Math.max(1, totalNights, transportLegs.reduce((sum, l) => sum + l.days, 0)),
        travel_dates: primaryDates,
        adults_count: adults,
        children_count: children,
        guide_language: guideLanguage,
        special_notes: specialNotes,
        selected_experiences: tourBookings.map(t => ({
          id: t.item.id,
          title_en: t.item.title_en,
          base_price_egp: t.price_per_person,
          timing: { start_date: t.tour_date, start_time: t.departure_time, end_time: t.return_time },
        })),
        accommodation_preference: stayPeriods.map(s => `${s.hotel_name} [${s.room_type_name}, ${s.nights}N (${s.start_date})]`).join(' | ') || 'None',
        transport_preference: transportLegs.map(l => `${l.vehicle_name} [${l.route_label}, ${l.start_date}]`).join(' | ') || 'None',
        meal_preference: diningBookings.map(d => `${d.item.name_en} [${d.dining_date} ${d.time_slot}]`).join(' | ') || 'None',
        custom_wishes: customWishes,
        manifest_details: {
          stay_periods: stayPeriods,
          transport_legs: transportLegs,
          tour_bookings: tourBookings,
          dining_bookings: diningBookings,
          activity_bookings: activityBookings,
          total_price: pricingSummary.finalTotal,
        },
      };

      const res = await fetch('/api/journeys/custom-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.request_code) {
        setBookingSuccess(data);
        localStorage.removeItem('siwify_journey_draft');
      } else {
        alert(data.error || 'Failed to submit reservation. Please try again.');
      }
    } catch {
      alert('Network error while dispatching journey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── RESERVATION CONFIRMED VIEW ───────────────────────────────────────────

  if (bookingSuccess) {
    return (
      <section style={S.wrap}>
        <div style={S.inner}>
          <div style={{ ...S.card, textAlign: 'center', padding: '4.5rem 2rem', maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ width: '84px', height: '84px', background: 'rgba(212,175,55,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '2.75rem', color: '#D4AF37' }} />
            </div>
            <span style={S.goldBadge}>RESERVATION DISPATCHED</span>
            <h2 style={{ ...S.h2, marginTop: '1rem' }}>Your Siwa Itinerary is Reserved!</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, margin: '1rem auto 2rem', maxWidth: '520px' }}>
              Reference Tracking Code: <strong style={{ color: '#D4AF37', fontSize: '1.25rem' }}>{bookingSuccess.request_code}</strong>
            </p>

            <div style={{ background: '#0a0d14', padding: '1.5rem', borderRadius: '18px', textAlign: 'left', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Summary of Confirmed Selections:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>
                {stayPeriods.map((s, idx) => (
                  <li key={idx}>🏨 <strong>Stay {idx + 1}:</strong> {s.hotel_name} ({s.room_type_name}, {s.nights} nights: {s.start_date} to {s.end_date})</li>
                ))}
                {transportLegs.map((l, idx) => (
                  <li key={idx}>🚐 <strong>Transport Leg {idx + 1}:</strong> {l.vehicle_name} ({l.route_label}, {l.start_date})</li>
                ))}
                {tourBookings.map((t, idx) => (
                  <li key={idx}>🚙 <strong>Safari Tour:</strong> {t.item.title_en} ({t.tour_date} at {t.departure_time})</li>
                ))}
                {diningBookings.map((d, idx) => (
                  <li key={idx}>🍽️ <strong>Dining:</strong> {d.item.name_en} ({d.dining_date} at {d.time_slot})</li>
                ))}
                {customWishes.map((w, idx) => (
                  <li key={idx} style={{ color: '#ec4899' }}>✨ <strong>Custom Wish:</strong> {w.title} ({w.start_date})</li>
                ))}
              </ul>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Estimated Cost:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>{pricingSummary.finalTotal.toLocaleString()} EGP</span>
              </div>
            </div>

            {bookingSuccess.whatsapp_url && (
              <a
                href={bookingSuccess.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  background: '#25D366', color: '#000', padding: '1rem 2.5rem',
                  borderRadius: '50px', fontWeight: 900, fontSize: '1rem',
                  textDecoration: 'none', boxShadow: '0 10px 25px rgba(37,211,102,0.3)',
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '1.3rem' }} /> Open Itinerary on WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ─── MAIN PLANNER WORKSPACE ───────────────────────────────────────────────

  const isStandaloneMode = activeMode !== 'all';
  const categoryHeaderTitle = activeMode === 'accommodation' ? 'Accommodation & Stay Planner'
    : activeMode === 'safaris' ? 'Desert Safaris & Tours Program'
    : activeMode === 'transport' ? 'Transfers & Logistics Route Planner'
    : activeMode === 'dining' ? 'Dining & Bedouin Feast Planner'
    : activeMode === 'activities' ? 'Activities & Wellness Healing Planner'
    : title || 'Craft Your Custom Siwa Itinerary';

  const categoryHeaderSub = activeMode === 'accommodation'
    ? 'Plan your stay across multiple hotels, ecolodges, and desert camps. Select different room types and exact check-in/out dates for each stay.'
    : activeMode === 'safaris'
    ? 'Select multiple desert tours, sunset safaris, and historical walking programs with exact dates and departure times.'
    : activeMode === 'transport'
    ? 'Configure multiple transit legs (arrival, in-oasis 4x4 cruiser, return transfer) with door-to-door timing.'
    : subtitle || 'Select your accommodations, desert safaris, private transfers, and culinary feasts with exact dates and combo discounts.';

  return (
    <section style={S.wrap} id="smart-journey-planner">
      <style>{`
        .sjp-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 390px;
          gap: 2rem;
          align-items: start;
        }
        .sjp-right-panel {
          position: sticky;
          top: 5.5rem;
          width: 100%;
          max-height: calc(100vh - 6.5rem);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(212,175,55,0.3) transparent;
        }
        @media (max-width: 1024px) {
          .sjp-workspace {
            grid-template-columns: 1fr !important;
            gap: 2rem;
          }
          .sjp-right-panel {
            position: static !important;
            max-height: none !important;
            overflow-y: visible !important;
            margin-top: 1.5rem;
          }
        }
      `}</style>

      <div style={S.inner}>
        {/* Header Block with Mode Switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={S.goldBadge}>
                <i className="fas fa-sparkles" /> {isStandaloneMode ? `${activeMode?.toUpperCase()} PLANNER` : 'SMART JOURNEY PLANNER'}
              </span>
              {isStandaloneMode && (
                <button
                  onClick={() => setActiveMode('all')}
                  style={{
                    background: 'rgba(212,175,55,0.1)', color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.25)', padding: '0.2rem 0.65rem',
                    borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  Switch to Complete Journey Builder &rarr;
                </button>
              )}
            </div>
            <h2 style={S.h2}>{categoryHeaderTitle}</h2>
            <p style={S.sub}>{categoryHeaderSub}</p>
          </div>

          {/* Combo Deal Flash Notifier Banner */}
          <div style={{
            background: pricingSummary.isComboUnlocked ? 'rgba(16,185,129,0.15)' : 'rgba(212,175,55,0.12)',
            border: `1px solid ${pricingSummary.isComboUnlocked ? '#10b981' : '#D4AF37'}`,
            padding: '1rem 1.5rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{ fontSize: '1.75rem' }}>{pricingSummary.isComboUnlocked ? '🎉' : '🔥'}</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: pricingSummary.isComboUnlocked ? '#10b981' : '#D4AF37' }}>
                {pricingSummary.isComboUnlocked ? 'COMBO DISCOUNT ACTIVE: 15% OFF!' : 'BUNDLE 3+ SECTORS & SAVE 15%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {pricingSummary.isComboUnlocked
                  ? `Saved ${pricingSummary.discountAmount.toLocaleString()} EGP across your itinerary!`
                  : `Select from 3 sectors to unlock 15% off (${pricingSummary.sectorCount}/3 active)`}
              </div>
            </div>
          </div>
        </div>

        {/* Master Category Tabs (visible in 'all' mode, or can switch between them) */}
        {!isStandaloneMode && (
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { id: 'accommodation', label: '1. Accommodation & Stays', icon: 'fa-bed', count: stayPeriods.length },
              { id: 'safaris', label: '2. Safaris & Desert Tours', icon: 'fa-compass', count: tourBookings.length },
              { id: 'transport', label: '3. Transfers & Logistics', icon: 'fa-car', count: transportLegs.length },
              { id: 'dining', label: '4. Dining & Feasts', icon: 'fa-utensils', count: diningBookings.length },
              { id: 'activities', label: '5. Activities & Wellness', icon: 'fa-spa', count: activityBookings.length },
            ].map((cat) => {
              const active = activeCategoryTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryTab(cat.id as any)}
                  style={{
                    background: active ? '#D4AF37' : '#111520',
                    color: active ? '#000' : '#cbd5e1',
                    border: active ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                    padding: '0.85rem 1.4rem', borderRadius: '16px',
                    fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                  }}
                >
                  <i className={`fas ${cat.icon}`} />
                  {cat.label}
                  {cat.count > 0 && (
                    <span style={{
                      background: active ? '#000' : '#10b981',
                      color: active ? '#D4AF37' : '#fff',
                      padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900,
                    }}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Workspace: Left (Selection & Period Builder) + Right (Live Itinerary Manifest) */}
        <div className="sjp-workspace">
          
          {/* LEFT COLUMN: ACTIVE SECTOR BUILDER */}
          <div>
            {/* ════════════ 1. ACCOMMODATION SECTOR ════════════ */}
            {(activeMode === 'accommodation' || activeCategoryTab === 'accommodation') && (
              <div>
                {/* Active Stay Periods List */}
                {stayPeriods.length > 0 && (
                  <div style={{ ...S.card, marginBottom: '2rem', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981', margin: 0 }}>
                        <i className="fas fa-bed" style={{ marginRight: '0.5rem' }} /> Planned Stays ({stayPeriods.length} Stays, {totalNights} Total Nights)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Multi-hotel periods configured</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {stayPeriods.map((stay, idx) => (
                        <div key={stay.id} style={{
                          background: '#0a0d14', border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex',
                          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                        }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                              <span style={{ color: '#D4AF37', marginRight: '0.5rem' }}>Period {idx + 1}:</span>
                              {stay.hotel_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                              <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{stay.room_type_name}</span> &bull; {stay.nights} Nights ({stay.start_date} at {stay.start_time} to {stay.end_date} at {stay.end_time})
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>{stay.total_price.toLocaleString()} EGP</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{stay.price_per_night.toLocaleString()} / night</div>
                            </div>
                            <button
                              onClick={() => handleRemoveStayPeriod(stay.id)}
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}
                              title="Remove stay period"
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accommodations Catalog Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.accommodations.map((stay) => {
                    const isConfiguring = pendingStayItem?.id === stay.id;
                    const stayCount = stayPeriods.filter(s => s.item_id === stay.id).length;

                    return (
                      <div key={stay.id} style={{ ...S.card, border: isConfiguring ? '2px solid #D4AF37' : S.card.border }}>
                        {/* Property Visual Header with Image Preview */}
                        <div style={{ position: 'relative', height: '140px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', background: '#070b08' }}>
                          <img
                            src={stay.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'}
                            alt={stay.name_en || 'Siwa Accommodation'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(7,11,8,0.92) 0%, transparent 60%)',
                          }} />

                          {/* Badges on top */}
                          <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {stay.badge_en && (
                              <span style={{ background: '#D4AF37', color: '#000', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900 }}>
                                {stay.badge_en}
                              </span>
                            )}
                            {stay.has_pool && (
                              <span style={{ background: 'rgba(59,130,246,0.85)', color: '#fff', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800 }}>
                                🏊 Pool
                              </span>
                            )}
                            {stay.hot_spring && (
                              <span style={{ background: 'rgba(236,72,153,0.85)', color: '#fff', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800 }}>
                                ♨️ Hot Spring
                              </span>
                            )}
                          </div>

                          {/* Setting / Vista tag at bottom of image */}
                          <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', right: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                              📍 {stay.setting_location?.replace(/_/g, ' ') || 'Siwa Oasis'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#D4AF37', fontWeight: 800 }}>
                              {stay.room_types?.length || 2} Room Tiers
                            </span>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#fff' }}>{stay.name_en}</h4>
                        
                        {/* ── Provider Attribution Header Strip ── */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          marginBottom: '0.65rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(212, 175, 55, 0.08)',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          fontSize: '0.72rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.85rem' }}>
                              {stay.provider_type === 'hotel' ? '🏨' : stay.provider_type === 'operator' ? '🧭' : '🛡️'}
                            </span>
                            <span style={{ color: '#94a3b8' }}>Provider:</span>
                            {stay.business_slug ? (
                              <Link
                                href={`/${stay.business_slug}`}
                                style={{ color: '#f1f5f9', fontWeight: 800, textDecoration: 'none', borderBottom: '1px dotted rgba(212,175,55,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title="View Provider Minisite & Verified Profile"
                              >
                                {stay.business_name || stay.name_en} ↗
                              </Link>
                            ) : (
                              <span style={{ color: '#f1f5f9', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {stay.business_name || stay.name_en}
                              </span>
                            )}
                          </div>
                          <span style={{
                            flexShrink: 0,
                            background: stay.is_trusted !== false ? 'rgba(16,185,129,0.18)' : 'rgba(212,175,55,0.18)',
                            color: stay.is_trusted !== false ? '#34d399' : '#D4AF37',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            letterSpacing: '0.3px',
                          }}>
                            {stay.provider_badge || (stay.provider_type === 'hotel' ? 'Direct Hotel' : 'Verified Host')}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, minHeight: '40px', margin: '0 0 0.85rem' }}>
                          {stay.desc_en}
                        </p>

                        {/* ── OTA Booking Site Link & Benchmark Price ── */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: '10px',
                        }}>
                          {stay.external_check_url ? (
                            <a
                              href={stay.external_check_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: '#60a5fa',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                                background: 'rgba(96, 165, 250, 0.12)',
                                border: '1px solid rgba(96, 165, 250, 0.25)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                transition: 'all 0.2s',
                              }}
                            >
                              <span>🏨 Check on {stay.ota_name || 'Booking.com'} ↗</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span>🏨</span> Verified Platform Direct
                            </span>
                          )}

                          {stay.ota_benchmark_price && stay.ota_benchmark_price > (stay.price_per_night || 0) && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              OTA: <span style={{ textDecoration: 'line-through', color: '#f87171' }}>{stay.ota_benchmark_price.toLocaleString()} EGP</span>
                            </div>
                          )}
                        </div>

                        {/* ── OUR OFFER / Direct Platform Advantage ── */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.2) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '10px',
                          padding: '0.55rem 0.75rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <span style={{ fontSize: '0.95rem' }}>🛡️</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#34d399', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              OUR OFFER · DIRECT PLATFORM ADVANTAGE
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#d1fae5', fontWeight: 700, lineHeight: 1.3 }}>
                              {stay.direct_discount_note || (
                                stay.ota_benchmark_price && stay.ota_benchmark_price > (stay.price_per_night || 0)
                                  ? `Book direct on Siwify & save ${(stay.ota_benchmark_price - (stay.price_per_night || 0)).toLocaleString()} EGP vs ${stay.ota_name || 'Booking.com'}`
                                  : 'Best Rate Guarantee + Local Oasis Perks'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Pricing & Minisite Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{stay.price_per_night} EGP</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}> / night</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {stay.minisite_url && (
                              <Link
                                href={stay.minisite_url}
                                target="_blank"
                                style={{
                                  color: '#D4AF37',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                  background: 'rgba(212,175,55,0.1)',
                                  border: '1px solid rgba(212,175,55,0.25)',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                }}
                              >
                                Minisite ↗
                              </Link>
                            )}
                            <button
                              onClick={() => setInspectingItem({ item: stay, category: 'accommodation' })}
                              style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Inspect &rarr;
                            </button>
                          </div>
                        </div>

                        {/* Room & Period Configurator Inline Drawer */}
                        {isConfiguring ? (
                          <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 800, marginBottom: '0.5rem' }}>
                              SELECT ROOM TYPE & STAY DATES:
                            </div>

                            {/* Room Type Selector */}
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '0.25rem' }}>ROOM / SUITE TYPE</label>
                              <select
                                value={stayConfig.room_type_id}
                                onChange={(e) => setStayConfig({ ...stayConfig, room_type_id: e.target.value })}
                                style={{ ...S.input, padding: '0.5rem' }}
                              >
                                {(stay.room_types || DEFAULT_ROOM_TYPES).map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.name_en} ({Math.round((stay.price_per_night || 1800) * r.multiplier)} EGP / night)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Dates and Times */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>CHECK-IN</label>
                                <input
                                  type="date"
                                  value={stayConfig.start_date}
                                  onChange={(e) => setStayConfig({ ...stayConfig, start_date: e.target.value })}
                                  style={{ ...S.input, padding: '0.4rem', fontSize: '0.75rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>CHECK-OUT</label>
                                <input
                                  type="date"
                                  value={stayConfig.end_date}
                                  onChange={(e) => setStayConfig({ ...stayConfig, end_date: e.target.value })}
                                  style={{ ...S.input, padding: '0.4rem', fontSize: '0.75rem' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleAddStayPeriod(stay)}
                                style={{ flex: 1, padding: '0.65rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Confirm Stay Period
                              </button>
                              <button
                                onClick={() => setPendingStayItem(null)}
                                style={{ padding: '0.65rem 0.85rem', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPendingStayItem(stay);
                              setStayConfig(prev => ({
                                ...prev,
                                room_type_id: stay.room_types?.[0]?.id || 'standard',
                              }));
                            }}
                            style={{
                              width: '100%', padding: '0.75rem',
                              background: stayCount > 0 ? '#10b981' : '#D4AF37',
                              color: stayCount > 0 ? '#fff' : '#000',
                              border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                            }}
                          >
                            {stayCount > 0 ? `+ Add Another Period (${stayCount} Booked)` : '+ Configure Dates & Room'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════ 2. SAFARIS & DESERT TOURS ════════════ */}
            {(activeMode === 'safaris' || activeCategoryTab === 'safaris') && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.experiences.map((exp) => {
                    const booking = tourBookings.find(t => t.item.id === exp.id);
                    return (
                      <div key={exp.id} style={{ ...S.card, border: booking ? '2px solid #D4AF37' : S.card.border, padding: '1.25rem' }}>
                        {/* Visual Safari Photo Header */}
                        <div style={{ position: 'relative', height: '145px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', background: '#070b08' }}>
                          <img
                            src={exp.image || 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80'}
                            alt={exp.title_en || 'Siwa Safari'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(7,11,8,0.92) 0%, transparent 60%)',
                          }} />
                          <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', display: 'flex', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>{exp.icon || '🚙'}</span>
                          </div>
                          {exp.duration && (
                            <span style={{
                              position: 'absolute', top: '0.6rem', right: '0.6rem',
                              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                              color: '#D4AF37', padding: '0.25rem 0.65rem', borderRadius: '10px',
                              fontSize: '0.68rem', fontWeight: 800, border: '1px solid rgba(212,175,55,0.3)',
                            }}>
                              {exp.duration}
                            </span>
                          )}
                          {exp.category && (
                            <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                              📍 {exp.category}
                            </div>
                          )}
                        </div>

                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{exp.title_en}</h4>
                        
                        {/* ── Provider Attribution Header Strip ── */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          marginBottom: '0.65rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(212, 175, 55, 0.08)',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          fontSize: '0.72rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.85rem' }}>
                              {exp.provider_type === 'hotel' ? '🏨' : exp.provider_type === 'artisan' ? '🌴' : '🧭'}
                            </span>
                            <span style={{ color: '#94a3b8' }}>Operated by:</span>
                            {exp.business_slug ? (
                              <Link
                                href={`/${exp.business_slug}`}
                                style={{ color: '#f1f5f9', fontWeight: 800, textDecoration: 'none', borderBottom: '1px dotted rgba(212,175,55,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title="View Operator Profile & Minisite"
                              >
                                {exp.business_name || 'Bedouin Tour Guild'} ↗
                              </Link>
                            ) : (
                              <span style={{ color: '#f1f5f9', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {exp.business_name || 'Siwa Verified Operator'}
                              </span>
                            )}
                          </div>
                          <span style={{
                            flexShrink: 0,
                            background: exp.is_trusted !== false ? 'rgba(16,185,129,0.18)' : 'rgba(212,175,55,0.18)',
                            color: exp.is_trusted !== false ? '#34d399' : '#D4AF37',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            letterSpacing: '0.3px',
                          }}>
                            {exp.provider_badge || 'Local Operator 🛡️'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, minHeight: '44px', margin: '0 0 1rem' }}>
                          {exp.highlight_en}
                        </p>

                        {/* Timing Schedule Controls if selected */}
                        {booking && (
                          <div style={{ background: '#0a0d14', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800, marginBottom: '0.35rem' }}>TOUR DATE & TIME:</div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <input
                                type="date"
                                value={booking.tour_date}
                                onChange={(e) => {
                                  const date = e.target.value;
                                  setTourBookings(prev => prev.map(t => t.id === booking.id ? { ...t, tour_date: date } : t));
                                }}
                                style={{ ...S.input, padding: '0.4rem', fontSize: '0.75rem' }}
                              />
                              <input
                                type="time"
                                value={booking.departure_time}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  setTourBookings(prev => prev.map(t => t.id === booking.id ? { ...t, departure_time: time } : t));
                                }}
                                style={{ ...S.input, width: '90px', padding: '0.4rem', fontSize: '0.75rem' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* ── Safari Booking Site Link & Comparison ── */}
                        {(exp.external_check_url || exp.ota_benchmark_price) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            marginBottom: '0.65rem',
                            padding: '0.45rem 0.65rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            borderRadius: '10px',
                          }}>
                            {exp.external_check_url && (
                              <a
                                href={exp.external_check_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  color: '#60a5fa',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                  background: 'rgba(96, 165, 250, 0.12)',
                                  border: '1px solid rgba(96, 165, 250, 0.25)',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                }}
                              >
                                <span>🧭 Check on {exp.ota_name || 'TripAdvisor'} ↗</span>
                              </a>
                            )}
                            {exp.ota_benchmark_price && exp.ota_benchmark_price > (exp.base_price_egp || 0) && (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                OTA: <span style={{ textDecoration: 'line-through', color: '#f87171' }}>{exp.ota_benchmark_price.toLocaleString()} EGP</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── OUR OFFER banner for Safaris ── */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(180, 130, 20, 0.18) 100%)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          borderRadius: '10px',
                          padding: '0.5rem 0.75rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <span style={{ fontSize: '0.9rem' }}>🛡️</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              OUR OFFER · LOCAL OASIS DIRECT
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#fef08a', fontWeight: 700, lineHeight: 1.3 }}>
                              {exp.direct_discount_note || 'Licensed Bedouin guide, certified 4x4 cruiser & equipment included'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{exp.base_price_egp} EGP</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}> / person</span>
                          </div>
                          <button
                            onClick={() => setInspectingItem({ item: exp, category: 'safaris' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => handleToggleTour(exp)}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: booking ? '#10b981' : '#D4AF37',
                            color: booking ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {booking ? '✓ Added to Tour Program' : '+ Add to Tour Program'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════ 3. TRANSFERS & LOGISTICS ════════════ */}
            {(activeMode === 'transport' || activeCategoryTab === 'transport') && (
              <div>
                {/* Active Transport Legs List */}
                {transportLegs.length > 0 && (
                  <div style={{ ...S.card, marginBottom: '2rem', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#3b82f6', margin: 0 }}>
                        <i className="fas fa-car" style={{ marginRight: '0.5rem' }} /> Configured Transit Legs ({transportLegs.length} Legs)
                      </h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {transportLegs.map((leg, idx) => (
                        <div key={leg.id} style={{
                          background: '#0a0d14', border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex',
                          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                        }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                              <span style={{ color: '#3b82f6', marginRight: '0.5rem' }}>Leg {idx + 1}:</span>
                              {leg.route_label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                              {leg.vehicle_name} &bull; {leg.start_date} at {leg.start_time} ({leg.days} Days)
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>{leg.total_price.toLocaleString()} EGP</div>
                            </div>
                            <button
                              onClick={() => setTransportLegs(prev => prev.filter(l => l.id !== leg.id))}
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transports Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.transports.map((trans) => {
                    const isConfiguring = pendingTransItem?.id === trans.id;
                    const legCount = transportLegs.filter(l => l.item_id === trans.id).length;

                    return (
                      <div key={trans.id} style={{ ...S.card, border: isConfiguring ? '2px solid #3b82f6' : S.card.border, padding: '1.25rem' }}>
                        {/* Visual Transport Vehicle Photo Header */}
                        <div style={{ position: 'relative', height: '140px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', background: '#070b08' }}>
                          <img
                            src={trans.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80'}
                            alt={trans.name_en || 'Siwa Transport'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(7,11,8,0.92) 0%, transparent 60%)',
                          }} />
                          <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem' }}>
                            <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>{trans.icon || '🚐'}</span>
                          </div>
                          <div style={{
                            position: 'absolute', top: '0.6rem', right: '0.6rem',
                            background: 'rgba(59,130,246,0.85)', color: '#fff',
                            padding: '0.25rem 0.65rem', borderRadius: '10px',
                            fontSize: '0.68rem', fontWeight: 800,
                          }}>
                            Direct VIP
                          </div>
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{trans.name_en}</h4>
                        
                        {/* ── Provider Attribution Header Strip ── */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          marginBottom: '0.65rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          fontSize: '0.72rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.85rem' }}>🚙</span>
                            <span style={{ color: '#94a3b8' }}>Fleet Operator:</span>
                            {trans.business_slug ? (
                              <Link
                                href={`/${trans.business_slug}`}
                                style={{ color: '#f1f5f9', fontWeight: 800, textDecoration: 'none', borderBottom: '1px dotted rgba(59,130,246,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title="View Transport Fleet Minisite"
                              >
                                {trans.business_name || 'Licensed Fleet Operator'} ↗
                              </Link>
                            ) : (
                              <span style={{ color: '#f1f5f9', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {trans.business_name || 'Siwa Certified Transport Fleet'}
                              </span>
                            )}
                          </div>
                          <span style={{
                            flexShrink: 0,
                            background: 'rgba(59,130,246,0.18)',
                            color: '#60a5fa',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            letterSpacing: '0.3px',
                          }}>
                            {trans.provider_badge || 'Licensed Carrier 🛡️'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>{trans.desc_en}</p>

                        {/* ── OUR OFFER banner for Transport ── */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 64, 175, 0.18) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '10px',
                          padding: '0.45rem 0.75rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <span style={{ fontSize: '0.85rem' }}>🛡️</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#60a5fa', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              OUR OFFER · PRIVATE DIRECT ROUTE
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#bfdbfe', fontWeight: 700, lineHeight: 1.3 }}>
                              {trans.direct_discount_note || 'Verified 4x4 Land Cruiser or AC Van with licensed Siwi driver included'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{trans.rate_per_day} EGP <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ day</span></span>
                          <button
                            onClick={() => setInspectingItem({ item: trans, category: 'transport' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        {isConfiguring ? (
                          <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(59,130,246,0.3)', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 800, marginBottom: '0.5rem' }}>CONFIGURE ROUTE LEG:</div>

                            <div style={{ marginBottom: '0.5rem' }}>
                              <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>ROUTE / PURPOSE</label>
                              <select
                                value={transConfig.route_label}
                                onChange={(e) => setTransConfig({ ...transConfig, route_label: e.target.value })}
                                style={{ ...S.input, padding: '0.4rem' }}
                              >
                                <option value="Cairo <-> Siwa VIP Direct Transfer">Cairo &harr; Siwa VIP Direct Transfer</option>
                                <option value="Alexandria <-> Siwa Private Van">Alexandria &harr; Siwa Private Van</option>
                                <option value="In-Oasis 4x4 Cruiser (Desert Safaris & Lakes)">In-Oasis 4x4 Cruiser (Desert Safaris & Lakes)</option>
                                <option value="Local Oasis Sightseeing & Daily Shuttle">Local Oasis Sightseeing & Daily Shuttle</option>
                              </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>DATE</label>
                                <input
                                  type="date"
                                  value={transConfig.start_date}
                                  onChange={(e) => setTransConfig({ ...transConfig, start_date: e.target.value })}
                                  style={{ ...S.input, padding: '0.4rem', fontSize: '0.75rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>TIME</label>
                                <input
                                  type="time"
                                  value={transConfig.start_time}
                                  onChange={(e) => setTransConfig({ ...transConfig, start_time: e.target.value })}
                                  style={{ ...S.input, padding: '0.4rem', fontSize: '0.75rem' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleAddTransportLeg(trans)}
                                style={{ flex: 1, padding: '0.65rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Add Transit Leg
                              </button>
                              <button
                                onClick={() => setPendingTransItem(null)}
                                style={{ padding: '0.65rem 0.85rem', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPendingTransItem(trans)}
                            style={{
                              width: '100%', padding: '0.75rem',
                              background: legCount > 0 ? '#3b82f6' : '#D4AF37',
                              color: legCount > 0 ? '#fff' : '#000',
                              border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                            }}
                          >
                            {legCount > 0 ? `+ Add Another Leg (${legCount} Booked)` : '+ Add Transit Leg'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════ 4. DINING & FEASTS ════════════ */}
            {(activeMode === 'dining' || activeCategoryTab === 'dining') && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.meals.map((meal) => {
                    const booking = diningBookings.find(d => d.item.id === meal.id);
                    return (
                      <div key={meal.id} style={{ ...S.card, border: booking ? '2px solid #D4AF37' : S.card.border, padding: '1.25rem' }}>
                        {/* Visual Dining Photo Header */}
                        <div style={{ position: 'relative', height: '140px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', background: '#070b08' }}>
                          <img
                            src={meal.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'}
                            alt={meal.name_en || 'Siwa Dining'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(7,11,8,0.92) 0%, transparent 60%)',
                          }} />
                          <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem' }}>
                            <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>{meal.icon || '🍽️'}</span>
                          </div>
                          <div style={{
                            position: 'absolute', top: '0.6rem', right: '0.6rem',
                            background: 'rgba(212,175,55,0.85)', color: '#000',
                            padding: '0.25rem 0.65rem', borderRadius: '10px',
                            fontSize: '0.68rem', fontWeight: 900,
                          }}>
                            Authentic Feast
                          </div>
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{meal.name_en}</h4>
                        
                        {/* ── Provider Attribution Header Strip ── */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          marginBottom: '0.65rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(212, 175, 55, 0.08)',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          fontSize: '0.72rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.85rem' }}>🍽️</span>
                            <span style={{ color: '#94a3b8' }}>Oasis Kitchen:</span>
                            {meal.business_slug ? (
                              <Link
                                href={`/${meal.business_slug}`}
                                style={{ color: '#f1f5f9', fontWeight: 800, textDecoration: 'none', borderBottom: '1px dotted rgba(212,175,55,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title="View Dining Venue Minisite"
                              >
                                {meal.business_name || 'Authentic Oasis Kitchen'} ↗
                              </Link>
                            ) : (
                              <span style={{ color: '#f1f5f9', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {meal.business_name || 'Siwa Heritage Dining'}
                              </span>
                            )}
                          </div>
                          <span style={{
                            flexShrink: 0,
                            background: meal.is_trusted !== false ? 'rgba(16,185,129,0.18)' : 'rgba(212,175,55,0.18)',
                            color: meal.is_trusted !== false ? '#34d399' : '#D4AF37',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            letterSpacing: '0.3px',
                          }}>
                            {meal.provider_badge || 'Verified Kitchen 🛡️'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, minHeight: '44px', margin: '0 0 1rem' }}>{meal.desc_en}</p>

                        {/* Timing controls when selected */}
                        {booking && (
                          <div style={{ background: '#0a0d14', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800, marginBottom: '0.35rem' }}>DINING DATE & TIME:</div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <input
                                type="date"
                                value={booking.dining_date}
                                onChange={(e) => {
                                  const date = e.target.value;
                                  setDiningBookings(prev => prev.map(d => d.id === booking.id ? { ...d, dining_date: date } : d));
                                }}
                                style={{ ...S.input, padding: '0.4rem', fontSize: '0.75rem' }}
                              />
                              <input
                                type="time"
                                value={booking.time_slot}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  setDiningBookings(prev => prev.map(d => d.id === booking.id ? { ...d, time_slot: time } : d));
                                }}
                                style={{ ...S.input, width: '90px', padding: '0.4rem', fontSize: '0.75rem' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* ── OUR OFFER banner for Dining ── */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(180, 130, 20, 0.18) 100%)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          borderRadius: '10px',
                          padding: '0.45rem 0.75rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <span style={{ fontSize: '0.85rem' }}>🛡️</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              OUR OFFER · CHEF DIRECT FEAST
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#fef08a', fontWeight: 700, lineHeight: 1.3 }}>
                              {meal.direct_discount_note || 'Guaranteed fresh organic oasis harvest, dates & private garden seating'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{meal.price_per_person} EGP <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ person</span></span>
                          <button
                            onClick={() => setInspectingItem({ item: meal, category: 'dining' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => handleToggleDining(meal)}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: booking ? '#10b981' : '#D4AF37',
                            color: booking ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {booking ? '✓ Added to Dining Schedule' : '+ Book Table / Feast'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════ 5. ACTIVITIES & WELLNESS ════════════ */}
            {(activeMode === 'activities' || activeCategoryTab === 'activities') && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.experiences.slice(0, 2).map((act) => {
                    const booking = activityBookings.find(a => a.item.id === act.id);
                    return (
                      <div key={act.id} style={{ ...S.card, border: booking ? '2px solid #D4AF37' : S.card.border, padding: '1.25rem' }}>
                        {/* Visual Activity Photo Header */}
                        <div style={{ position: 'relative', height: '140px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', background: '#070b08' }}>
                          <img
                            src={act.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80'}
                            alt={act.title_en || 'Siwa Activity'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(7,11,8,0.92) 0%, transparent 60%)',
                          }} />
                          <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem' }}>
                            <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>{act.icon || '🏄'}</span>
                          </div>
                          <div style={{
                            position: 'absolute', top: '0.6rem', right: '0.6rem',
                            background: 'rgba(16,185,129,0.85)', color: '#000',
                            padding: '0.25rem 0.65rem', borderRadius: '10px',
                            fontSize: '0.68rem', fontWeight: 900,
                          }}>
                            Wellness
                          </div>
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{act.title_en}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>{act.highlight_en}</p>

                        {/* ── OUR OFFER banner for Activities ── */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.2) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '10px',
                          padding: '0.45rem 0.75rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          <span style={{ fontSize: '0.85rem' }}>🛡️</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#34d399', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              OUR OFFER · WELLNESS & HEALING
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#d1fae5', fontWeight: 700, lineHeight: 1.3 }}>
                              {act.direct_discount_note || 'Direct Oasis Access: Private mineral spring float & virgin olive oil rinse'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{act.base_price_egp} EGP</span>
                          <button
                            onClick={() => setInspectingItem({ item: act, category: 'activities' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => handleToggleActivity(act)}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: booking ? '#10b981' : '#D4AF37',
                            color: booking ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {booking ? '✓ Added Activity' : '+ Add Activity'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* "+ Add Custom Selection" (Crowdsourced discovery) */}
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '18px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.35rem' }}>
                Looking for an unlisted place, camp, or special tour?
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1rem' }}>
                Add your custom wish directly to your itinerary. Our local team will arrange it with verified providers and review it for our official catalog.
              </p>
              <button
                onClick={() => setShowCustomWishModal(true)}
                style={{
                  background: 'rgba(236,72,153,0.12)', color: '#ec4899',
                  border: '1px solid rgba(236,72,153,0.3)', padding: '0.65rem 1.5rem',
                  borderRadius: '30px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <i className="fas fa-plus" /> + Add Custom Selection
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY COMPREHENSIVE ITINERARY MANIFEST */}
          <div className="sjp-right-panel" id="journey-calculator-manifest">
            <div style={{ ...S.card, border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: isCalculatorCollapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
                paddingBottom: isCalculatorCollapsed ? '0' : '1rem',
                marginBottom: isCalculatorCollapsed ? '0' : '1.25rem',
              }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🧮</span>
                    <span>{isStandaloneMode ? `${activeMode?.toUpperCase()} CALCULATOR` : 'JOURNEY CALCULATOR'}</span>
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700, marginTop: '0.2rem' }}>
                    {stayPeriods.length + tourBookings.length + transportLegs.length + diningBookings.length + activityBookings.length + customWishes.length} Items &bull; <strong style={{ color: '#10b981' }}>{pricingSummary.finalTotal.toLocaleString()} EGP</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCalculatorCollapsed(!isCalculatorCollapsed)}
                  aria-label={isCalculatorCollapsed ? 'Expand Calculator' : 'Collapse Calculator'}
                  style={{
                    background: isCalculatorCollapsed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                    border: isCalculatorCollapsed ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                    color: isCalculatorCollapsed ? '#34d399' : '#cbd5e1',
                    borderRadius: '20px',
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <i className={`fas fa-chevron-${isCalculatorCollapsed ? 'down' : 'up'}`} />
                  <span>{isCalculatorCollapsed ? 'Expand' : 'Collapse'}</span>
                </button>
              </div>

              {!isCalculatorCollapsed && (
                <>

              {/* Guests Count Controls */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', background: '#0a0d14', padding: '0.75rem', borderRadius: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Adults</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', width: '100%', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Children (50%)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              {/* ── SPECIALIZED COLLAPSIBLE ACCOMMODATION MANIFEST & BUDGET ADJUSTER ── */}
              <div style={{
                background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(7, 24, 16, 0.95) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                marginBottom: '1.25rem',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(16, 185, 129, 0.2)',
              }}>
                {/* Collapsible Header with Distinct Oasis Emerald / Gold Character */}
                <button
                  type="button"
                  onClick={() => setIsAccManifestOpen(!isAccManifestOpen)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: 'none',
                    borderBottom: isAccManifestOpen ? '1px solid rgba(16, 185, 129, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#10b981', fontSize: '0.85rem'
                    }}>
                      <i className="fas fa-bed" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#34d399', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Accommodation Calculations
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {stayPeriods.length} Stays &bull; {totalNights} Nights
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#10b981' }}>
                        {accommodationSubtotal.toLocaleString()} EGP
                      </span>
                      <div style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>Stay Subtotal</div>
                    </div>
                    <i
                      className={`fas fa-chevron-${isAccManifestOpen ? 'up' : 'down'}`}
                      style={{ fontSize: '0.75rem', color: '#34d399', transition: 'transform 0.2s' }}
                    />
                  </div>
                </button>

                {/* Collapsible Body */}
                {isAccManifestOpen && (
                  <div style={{ padding: '0.85rem 1rem' }}>
                    {stayPeriods.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                        <i className="fas fa-bed" style={{ fontSize: '1.2rem', color: 'rgba(16,185,129,0.4)', marginBottom: '0.35rem', display: 'block' }} />
                        No stays selected yet. Choose a lodge or camp from above to start your accommodation budget.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {stayPeriods.map((s, idx) => {
                          const isEditing = editingStayId === s.id;
                          return (
                            <div
                              key={s.id}
                              style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '10px',
                                padding: '0.65rem 0.75rem',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                                    <span style={{ color: '#D4AF37', marginRight: '0.3rem' }}>#{idx + 1}</span>
                                    {s.hotel_name}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>
                                    {s.room_type_name}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10b981' }}>
                                    {s.total_price.toLocaleString()} EGP
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                    {s.nights}N @ {s.price_per_night.toLocaleString()}/n
                                  </div>
                                </div>
                              </div>

                              {/* Time & Date Checker Badge */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '0.35rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.68rem',
                                color: '#94a3b8',
                                marginTop: '0.35rem',
                              }}>
                                <div>
                                  <i className="far fa-calendar-alt" style={{ color: '#D4AF37', marginRight: '0.35rem' }} />
                                  <span>{s.start_date} <strong style={{ color: '#fff' }}>({s.start_time})</strong></span>
                                  <span style={{ margin: '0 0.35rem', color: '#64748b' }}>&rarr;</span>
                                  <span>{s.end_date} <strong style={{ color: '#fff' }}>({s.end_time})</strong></span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingStayId(isEditing ? null : s.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#D4AF37',
                                    cursor: 'pointer',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    textDecoration: 'underline',
                                    padding: 0,
                                  }}
                                >
                                  {isEditing ? 'Close' : 'Adjust'}
                                </button>
                              </div>

                              {/* Inline Time Checker & Budget Adjuster Form */}
                              {isEditing && (
                                <div style={{
                                  marginTop: '0.6rem',
                                  paddingTop: '0.6rem',
                                  borderTop: '1px dashed rgba(16, 185, 129, 0.25)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.5rem',
                                }}>
                                  <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                                    Adjust Timing & Stay Dates:
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>Check-in Date</label>
                                      <input
                                        type="date"
                                        value={s.start_date}
                                        onChange={(e) => handleUpdateStayPeriod(s.id, { start_date: e.target.value })}
                                        style={{ ...S.input, padding: '0.25rem 0.4rem', fontSize: '0.7rem' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>Check-out Date</label>
                                      <input
                                        type="date"
                                        value={s.end_date}
                                        onChange={(e) => handleUpdateStayPeriod(s.id, { end_date: e.target.value })}
                                        style={{ ...S.input, padding: '0.25rem 0.4rem', fontSize: '0.7rem' }}
                                      />
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>Check-in Time</label>
                                      <input
                                        type="time"
                                        value={s.start_time}
                                        onChange={(e) => handleUpdateStayPeriod(s.id, { start_time: e.target.value })}
                                        style={{ ...S.input, padding: '0.25rem 0.4rem', fontSize: '0.7rem' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>Check-out Time</label>
                                      <input
                                        type="time"
                                        value={s.end_time}
                                        onChange={(e) => handleUpdateStayPeriod(s.id, { end_time: e.target.value })}
                                        style={{ ...S.input, padding: '0.25rem 0.4rem', fontSize: '0.7rem' }}
                                      />
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStayPeriod(s.id)}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '6px',
                                        padding: '0.25rem 0.6rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <i className="fas fa-trash" style={{ marginRight: '0.25rem' }} /> Remove Stay
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setEditingStayId(null)}
                                      style={{
                                        background: '#10b981',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Done
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Calendar & Timing Overview Trigger */}
                    {stayPeriods.length > 0 && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          <i className="fas fa-calendar-check" style={{ color: '#34d399', marginRight: '0.35rem' }} />
                          {stayPeriods[0]?.start_date} &rarr; {stayPeriods[stayPeriods.length - 1]?.end_date}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCalendarAuditModal(true)}
                          style={{
                            background: 'rgba(212, 175, 55, 0.15)',
                            color: '#D4AF37',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '12px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          View Schedule &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Other Itinerary Elements (Tours, Transports, Dining, Wishes) */}
              <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                  Other Experiences & Transit ({tourBookings.length + transportLegs.length + diningBookings.length + customWishes.length})
                </div>

                {/* 2. Transports */}
                {transportLegs.map((l, idx) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>🚐 Leg {idx + 1}: {l.route_label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{l.start_date} at {l.start_time}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{l.total_price.toLocaleString()} EGP</span>
                  </div>
                ))}

                {/* 3. Tours */}
                {tourBookings.map((t, idx) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>🚙 {t.item.title_en}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.tour_date} at {t.departure_time}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{((t.price_per_person) * (adults + children * 0.5)).toLocaleString()} EGP</span>
                  </div>
                ))}

                {/* 4. Dining */}
                {diningBookings.map((d, idx) => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>🍽️ {d.item.name_en}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{d.dining_date} at {d.time_slot}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{((d.price_per_person) * (adults + children * 0.5)).toLocaleString()} EGP</span>
                  </div>
                ))}

                {/* 5. Custom Wishes */}
                {customWishes.map((w, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#ec4899' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>✨ {w.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{w.start_date} (Custom Wish)</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Admin Quote</span>
                  </div>
                ))}

                {tourBookings.length === 0 && transportLegs.length === 0 && diningBookings.length === 0 && customWishes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b', fontSize: '0.75rem' }}>
                    No extra tours or transit legs added.
                  </div>
                )}
              </div>

              {/* Pricing Totals */}
              <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: '14px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  <span>Subtotal:</span>
                  <span>{pricingSummary.subtotal.toLocaleString()} EGP</span>
                </div>
                {pricingSummary.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#10b981', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span>Combo Discount ({pricingSummary.discountPercent}%):</span>
                    <span>-{pricingSummary.discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#fff', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Estimated Total:</span>
                  <span style={{ color: '#10b981' }}>{pricingSummary.finalTotal.toLocaleString()} EGP</span>
                </div>
              </div>

              {/* Customer Contact Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={S.input}
                />
                <input
                  type="tel"
                  placeholder="WhatsApp / Phone Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={S.input}
                />
              </div>

              {/* Dispatch Button */}
              <button
                onClick={handleDispatchReservation}
                disabled={isSubmitting || pricingSummary.subtotal === 0}
                style={{
                  width: '100%', padding: '1rem',
                  background: pricingSummary.subtotal === 0 ? '#18281b' : 'linear-gradient(135deg, #D4AF37, #f0c842)',
                  color: pricingSummary.subtotal === 0 ? '#64748b' : '#000',
                  border: 'none', borderRadius: '50px', fontWeight: 900, fontSize: '0.9rem',
                  cursor: pricingSummary.subtotal === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: pricingSummary.subtotal > 0 ? '0 10px 25px rgba(212,175,55,0.25)' : 'none',
                }}
              >
                {isSubmitting ? (
                  <span><i className="fas fa-spinner fa-spin" /> Dispatching...</span>
                ) : (
                  <span><i className="fab fa-whatsapp" /> Reserve & Dispatch Itinerary</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
        </div>
      </div>

      {/* ─── SIDE-PART INSPECTOR DRAWER ("sidepart") ────────────────────────── */}
      {inspectingItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'flex-end',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        }}>
          <div
            onClick={() => setInspectingItem(null)}
            style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
          />

          <div style={{
            position: 'relative', width: '100%', maxWidth: '460px', height: '100%',
            background: '#111520', borderLeft: '1px solid rgba(255,255,255,0.1)',
            padding: '2.5rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', boxShadow: '-20px 0 50px rgba(0,0,0,0.8)',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={S.goldBadge}>
                  {inspectingItem.category.toUpperCase()} DETAILS
                </span>
                <button
                  onClick={() => setInspectingItem(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              {inspectingItem.item.image && (
                <img
                  src={inspectingItem.item.image}
                  alt="Offering Preview"
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', marginBottom: '1.5rem' }}
                />
              )}

              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem' }}>
                {inspectingItem.item.title_en || inspectingItem.item.name_en}
              </h3>
              {(inspectingItem.item.title_ar || inspectingItem.item.name_ar) && (
                <div style={{ fontSize: '0.95rem', color: '#D4AF37', fontWeight: 700, marginBottom: '1rem' }} dir="rtl">
                  {inspectingItem.item.title_ar || inspectingItem.item.name_ar}
                </div>
              )}

              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {inspectingItem.item.highlight_en || inspectingItem.item.desc_en}
              </p>

              {inspectingItem.category === 'accommodation' && (
                <div style={{ background: '#0a0d14', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    AVAILABLE ROOM TYPES
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.8 }}>
                    {(inspectingItem.item.room_types || DEFAULT_ROOM_TYPES).map(r => (
                      <li key={r.id}><strong>{r.name_en}:</strong> {Math.round((inspectingItem.item.price_per_night || 1800) * r.multiplier)} EGP / night ({r.capacity})</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Booking Site Comparison & Our Offer in Inspector ── */}
              {(inspectingItem.item.external_check_url || inspectingItem.item.ota_benchmark_price || inspectingItem.item.direct_discount_note) && (
                <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                    COMMERCIAL RATES & BOOKING BENCHMARK
                  </div>
                  
                  {inspectingItem.item.external_check_url && (
                    <div style={{ marginBottom: '0.65rem' }}>
                      <a
                        href={inspectingItem.item.external_check_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          color: '#60a5fa',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          background: 'rgba(96, 165, 250, 0.12)',
                          border: '1px solid rgba(96, 165, 250, 0.3)',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                        }}
                      >
                        <span>🏨 Check Price on {inspectingItem.item.ota_name || 'Booking.com'} ↗</span>
                      </a>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.75rem',
                  }}>
                    <span style={{ fontSize: '1rem' }}>🛡️</span>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        OUR OFFER · DIRECT PLATFORM ADVANTAGE
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#d1fae5', fontWeight: 700, marginTop: '2px' }}>
                        {inspectingItem.item.direct_discount_note || 'Best Rate Guarantee + Local Oasis Perks + Verified Authentic Host'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => {
                  if (inspectingItem.category === 'accommodation') {
                    setPendingStayItem(inspectingItem.item);
                  } else if (inspectingItem.category === 'safaris') {
                    handleToggleTour(inspectingItem.item);
                  } else if (inspectingItem.category === 'transport') {
                    setPendingTransItem(inspectingItem.item);
                  } else if (inspectingItem.category === 'dining') {
                    handleToggleDining(inspectingItem.item);
                  }
                  setInspectingItem(null);
                }}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: '#D4AF37', color: '#000',
                  border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '0.9rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <i className="fas fa-plus" /> Select & Configure This Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD CUSTOM SELECTION ────────────────────────────────────── */}
      {showCustomWishModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#111520', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', maxWidth: '520px', width: '100%', padding: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                Add Custom Place or Experience
              </h3>
              <button onClick={() => setShowCustomWishModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Custom Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Private sunset dune camp or Dakrour sand bath session"
                  value={wishInput.title}
                  onChange={(e) => setWishInput({ ...wishInput, title: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Target Date</label>
                  <input
                    type="date"
                    value={wishInput.start_date}
                    onChange={(e) => setWishInput({ ...wishInput, start_date: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Preferred Time</label>
                  <input
                    type="time"
                    value={wishInput.start_time}
                    onChange={(e) => setWishInput({ ...wishInput, start_time: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Notes & Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements, room preferences, allergies, or questions..."
                  value={wishInput.notes}
                  onChange={(e) => setWishInput({ ...wishInput, notes: e.target.value })}
                  style={{ ...S.input, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowCustomWishModal(false)}
                  style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomWish}
                  style={{ background: '#ec4899', color: '#fff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Add Wish to Itinerary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── MODAL: DAY CALENDAR & TIMING AUDITOR ───────────────────────────── */}
      {showCalendarAuditModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#0d150f', border: '1.5px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '24px', maxWidth: '640px', width: '100%', padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(16, 185, 129, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.2)', color: '#34d399',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                }}>
                  <i className="fas fa-calendar-alt" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                    Stay Schedule & Day Calendar Checker
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Audit your stay periods, check-in windows, and budget breakdown
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarAuditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Overall Stay Summary Metrics */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
              background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem',
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Properties</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>{stayPeriods.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Nights</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D4AF37' }}>{totalNights} Nights</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Accommodations Budget</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{accommodationSubtotal.toLocaleString()} EGP</div>
              </div>
            </div>

            {/* Chronological Stay Cards with Day Indicators */}
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem', marginBottom: '1.5rem' }}>
              {stayPeriods.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '14px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: '#10b981', color: '#000',
                        fontSize: '0.7rem', fontWeight: 900, padding: '0.15rem 0.5rem', borderRadius: '10px',
                      }}>
                        Stay {idx + 1}
                      </span>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{s.hotel_name}</strong>
                    </div>
                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}>
                      {s.total_price.toLocaleString()} EGP
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Room Tier:</span> <strong style={{ color: '#D4AF37' }}>{s.room_type_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Duration:</span> <strong>{s.nights} Nights</strong> (@ {s.price_per_night.toLocaleString()} / night)
                    </div>
                  </div>

                  <div style={{
                    marginTop: '0.5rem', paddingTop: '0.5rem',
                    borderTop: '1px dashed rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '0.72rem', color: '#94a3b8',
                  }}>
                    <div>
                      <i className="fas fa-sign-in-alt" style={{ color: '#10b981', marginRight: '0.3rem' }} />
                      Check-in: <strong style={{ color: '#fff' }}>{s.start_date} at {s.start_time}</strong>
                    </div>
                    <div>
                      <i className="fas fa-sign-out-alt" style={{ color: '#ef4444', marginRight: '0.3rem' }} />
                      Check-out: <strong style={{ color: '#fff' }}>{s.end_date} at {s.end_time}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowCalendarAuditModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#000',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
