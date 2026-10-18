export interface JourneyCatalogItemBase {
  id: string;
  is_visible: boolean;
  vendor_business_ids: string[];
  image?: string;
  icon?: string;

  // Bridge to commercial-links admin system (links curated in /admin/commercial-links appear on journey cards)
  commercial_item_id?: string;

  // Dynamic Provider & Service Operator Details (Controlled by Admin / Vendor system)
  business_id?: string;
  business_name?: string;
  business_slug?: string;
  business_phone?: string | null;
  whatsapp_number?: string;
  provider_type?: 'hotel' | 'operator' | 'siwify_direct' | 'artisan';
  parent_business_type_id?: string;
  child_business_type_id?: string;
  provider_badge?: string;
  is_trusted?: boolean;

  // Dynamic Admin OTA benchmark & booking comparison links
  ota_benchmark_price?: number;
  ota_name?: string;
  external_check_url?: string | null;
  minisite_url?: string;
  direct_discount_note?: string;
  rating?: number;
  reviews_count?: number;
  // Vibe, View & Sectional Experience DNA
  vibe_tags?: string[];
  setting_location?: 'on_lake' | 'on_lake_and_pool' | 'dune' | 'multiple_views' | 'oasis_palms' | 'citadel' | 'spring' | string;
  view_type?: string;
  vibe_ambience?: string;
  seating_style?: string;
  menu_highlights?: string[];
  vehicle_type?: string;
  treatment_type?: string;
}


export interface JourneyExperience extends JourneyCatalogItemBase {
  title_en: string;
  title_ar: string;
  category: string;
  category_ar: string;
  duration: string;
  duration_ar: string;
  base_price_egp: number;
  highlight_en: string;
  highlight_ar: string;
}

export interface JourneyAccommodation extends JourneyCatalogItemBase {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  price_per_night: number;
  badge_en: string;
  badge_ar: string;
}

export interface JourneyTransport extends JourneyCatalogItemBase {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  rate_per_day: number;
}

export interface JourneyMeal extends JourneyCatalogItemBase {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  price_per_person: number;
}

export interface JourneyCustomizerCatalog {
  version: 1;
  bundle_discount_percent: number;
  experiences: JourneyExperience[];
  accommodations: JourneyAccommodation[];
  transports: JourneyTransport[];
  meals: JourneyMeal[];
}

export const DEFAULT_JOURNEY_CUSTOMIZER: JourneyCustomizerCatalog = {
  version: 1,
  bundle_discount_percent: 15,
  experiences: [
    {
      id: 'exp_salt_lakes',
      is_visible: true,
      vendor_business_ids: ['biz_cleopatra_springs'],
      commercial_item_id: 'act_salt_lake_float',
      business_id: 'biz_cleopatra_springs',
      business_name: 'Siwa Salt & Mineral Sanctuary',
      business_slug: 'siwa-salt-sanctuary',
      provider_type: 'operator',
      provider_badge: 'Verified Mineral Sanctuary',
      is_trusted: true,
      title_en: 'Salt Lakes Floating & Crystal Mineral Pools Therapy',
      title_ar: 'الطفو في بحيرات الملح وعيون المياه المعدنية العلاجية',
      category: 'Wellness & Nature',
      category_ar: 'استشفاء وطبيعة',
      duration: '3-4 Hours',
      duration_ar: '٣ - ٤ ساعات',
      base_price_egp: 450,
      highlight_en: 'Zero-gravity salt float + pure olive oil rinse in ancient palms',
      highlight_ar: 'طفو حر مضاد للجاذبية في أنقى بحيرات الملح مع غسيل بزيت الزيتون البكر',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
      icon: '🌊',
      ota_benchmark_price: 600,
      ota_name: 'Viator',
      external_check_url: 'https://www.viator.com/searchResults/all?text=Siwa+Salt+Lakes',
      direct_discount_note: 'Direct Sanctuary Pass: Save 150 EGP + private freshwater spring rinse & date oil therapy',
      rating: 4.9,
      reviews_count: 178,
    },
    {
      id: 'exp_great_sand_sea',
      is_visible: true,
      vendor_business_ids: ['biz_siwa_desert_riders'],
      commercial_item_id: 'trn_landcruiser_4x4',
      business_id: 'biz_siwa_desert_riders',
      business_name: 'Siwa Desert Pilots Syndicate',
      business_slug: 'siwa-desert-riders',
      provider_type: 'operator',
      provider_badge: 'Bedouin 4WD Guild',
      is_trusted: true,
      title_en: '4x4 Great Sand Sea Safari & Sunset Sandboarding',
      title_ar: 'سفاري بحر الرمال الأعظم بسيارات الدفع الرباعي والتزلج على الكثبان',
      category: 'Safari & Adventure',
      category_ar: 'سفاري ومغامرة',
      duration: 'Half Day / Sunset',
      duration_ar: 'نصف يوم حتى الغروب',
      base_price_egp: 1250,
      highlight_en: 'Giant dunes crossing, fossil ocean site, Bedouin tea & sandboarding',
      highlight_ar: 'عبور أضخم الكثبان الرملية، وادي الحيتان والمتحجرات، وشاي باللويزة على الرمال',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
      icon: '🚙',
      ota_benchmark_price: 1550,
      ota_name: 'TripAdvisor',
      external_check_url: 'https://www.tripadvisor.com/Search?q=Siwa+Safari',
      direct_discount_note: 'Direct Bedouin Pilot Advantage: Save 300 EGP + certified desert pilot & pro sandboarding gear',
      rating: 5.0,
      reviews_count: 185,
    },
    {
      id: 'exp_shali_amun_oracle',
      is_visible: true,
      vendor_business_ids: ['biz_amun_expeditions'],
      commercial_item_id: 'tur_shali_oracle_walk',
      business_id: 'biz_amun_expeditions',
      business_name: 'Amun Oasis Cultural Expeditions',
      business_slug: 'amun-expeditions',
      provider_type: 'operator',
      provider_badge: 'Siwan Heritage Guild',
      is_trusted: true,
      title_en: 'Ancient Fortress of Shali & Temple of the Oracle Walk',
      title_ar: 'جولة تاريخية في قلعة شالي القديمة ومعبد الوحي آمون',
      category: 'Heritage & History',
      category_ar: 'تراث وتاريخ',
      duration: '2.5 Hours',
      duration_ar: 'ساعتان ونصف',
      base_price_egp: 550,
      highlight_en: '13th-century Kershef salt-clay citadel & Alexander the Great footprint',
      highlight_ar: 'أطلال مدينة الكرشيف الطينية وقلعة شالي وخطى الإسكندر الأكبر التاريخية',
      image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=80',
      icon: '🏛️',
      ota_benchmark_price: 750,
      ota_name: 'GetYourGuide',
      external_check_url: 'https://www.getyourguide.com/siwa-oasis-l104107/',
      direct_discount_note: 'Direct Storyteller Advantage: Native Siwi historian + rooftop sunset tea access',
      rating: 5.0,
      reviews_count: 120,
    },
    {
      id: 'exp_bir_wahed_hotspring',
      is_visible: true,
      vendor_business_ids: ['biz_siwa_desert_riders'],
      business_id: 'biz_siwa_desert_riders',
      business_name: 'Siwa Desert Pilots Syndicate',
      business_slug: 'siwa-desert-riders',
      provider_type: 'operator',
      provider_badge: 'Desert Spring Guides',
      is_trusted: true,
      title_en: 'Bir Wahed Hot & Cold Sulfur Springs Retreat',
      title_ar: 'واحة بئر واحد الكبريتية الساخنة والباردة وسط الصحراء',
      category: 'Wellness & Desert',
      category_ar: 'استشفاء وصحراء',
      duration: '3 Hours',
      duration_ar: '٣ ساعات',
      base_price_egp: 700,
      highlight_en: 'Natural warm sulfur thermal spring surrounded by deep desert sands',
      highlight_ar: 'استحمام علاجي في مياه كبريتية دافئة تتدفق تلقائياً في قلب الرمال',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      icon: '♨️',
      ota_benchmark_price: 900,
      ota_name: 'TripAdvisor',
      external_check_url: 'https://www.tripadvisor.com/Attractions-g303856-Activities-c57-Siwa_Matrouh_Governorate.html',
      direct_discount_note: 'Direct Mineral Healing: Save 200 EGP + private sulfur spring plunge & hot Bedouin tea',
      rating: 4.8,
      reviews_count: 95,
    },
    {
      id: 'exp_bedouin_camp_dinner',
      is_visible: true,
      vendor_business_ids: ['biz_taziry'],
      business_id: 'biz_taziry',
      business_name: 'Taziry Ecolodge & Heritage Village',
      business_slug: 'taziry-ecolodge',
      provider_type: 'hotel',
      provider_badge: 'Certified Eco-Lodge Property',
      is_trusted: true,
      title_en: 'Bedouin Night Campfire, Mandi Dinner & Deep Stargazing',
      title_ar: 'سهرة بدوية أصيلة وعشاء مدمون تحت قبة النجوم والمجرات',
      category: 'Culinary & Culture',
      category_ar: 'مأكولات وأمسيات',
      duration: 'Evening (4-5 Hours)',
      duration_ar: 'أمسية (٤ - ٥ ساعات)',
      base_price_egp: 950,
      highlight_en: 'Traditional underground fire pit slow-roasted dinner & astronomy session',
      highlight_ar: 'عشاء المدمون السيوى المطهو تحت التراب ومراقبة النجوم بالتيليسكوب',
      image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&q=80',
      icon: '🌌',
      ota_benchmark_price: 1250,
      ota_name: 'Viator VIP Dining',
      external_check_url: 'https://www.viator.com/Egypt-tours/Desert-Dining/d723-g12',
      direct_discount_note: 'Direct Host Advantage: Save 300 EGP + private bonfire circle & astronomy telescope session',
      rating: 4.9,
      reviews_count: 140,
    },
    {
      id: 'exp_olive_dates_workshop',
      is_visible: true,
      vendor_business_ids: ['biz_siwa_harvest'],
      business_id: 'biz_siwa_harvest',
      business_name: 'Siwa Palm Oasis Cooperative',
      business_slug: 'siwa-organic-press',
      provider_type: 'artisan',
      provider_badge: 'Oasis Farmers Cooperative',
      is_trusted: true,
      title_en: 'Organic Olive Grove, Date Harvest & Siwan Herbal Workshop',
      title_ar: 'جولة مزارع الزيتون العضوي وجني التمور وصناعة الزيوت العطرية',
      category: 'Agritourism & Crafts',
      category_ar: 'سياحة زراعية وحرف',
      duration: '2 Hours',
      duration_ar: 'ساعتان',
      base_price_egp: 400,
      highlight_en: 'Cold-pressed extra virgin tasting & hands-on date confectionery making',
      highlight_ar: 'تذوق زيت الزيتون المعصور على البارد وتصنيع حبات التمر السيوية الفاخرة',
      image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80',
      icon: '🌴',
      ota_benchmark_price: 550,
      ota_name: 'TripAdvisor Experience',
      external_check_url: 'https://www.tripadvisor.com/Attractions-g303856-Activities-Siwa_Matrouh_Governorate.html',
      direct_discount_note: 'Direct Grower Perk: Complimentary 250ml cold-pressed virgin olive oil sample bottle',
      rating: 4.8,
      reviews_count: 88,
    },
  ],
  accommodations: [
    {
      id: 'ecolodge_premium', is_visible: true, vendor_business_ids: ['biz_taziry'],
      commercial_item_id: 'acc_taziry_standard',
      business_id: 'biz_taziry', business_name: 'Taziry Ecolodge & Heritage Village', business_slug: 'taziry-ecolodge',
      provider_type: 'hotel', provider_badge: 'Direct from Hotel', is_trusted: true,
      name_en: 'Authentic Kershef Mud-Brick Eco-Lodge',
      name_ar: 'إيكولودج كرشيف بيئي أصيل (طراز سيوة التاريخي)',
      desc_en: 'Salt-rock walls, beeswax candles, spring-fed pool, zero-noise sanctuary',
      desc_ar: 'جدران من أحجار الملح والطين، شموع عسل النحل، بركة ماء عذب، هدوء تام',
      price_per_night: 2200,
      badge_en: 'Signature Siwa Style', badge_ar: 'الطابع السيوى الفريد',
      ota_benchmark_price: 2750, ota_name: 'Booking.com',
      external_check_url: 'https://www.booking.com/searchresults.html?ss=Siwa+Oasis',
      direct_discount_note: 'Book direct on Siwify & save 550 EGP vs Booking.com + free sunset dunes tea',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      icon: '🛖',
    },
    {
      id: 'desert_glamping', is_visible: true, vendor_business_ids: ['biz_aghurmi_retreat'],
      commercial_item_id: 'acc_dunes_glamping_camp',
      business_id: 'biz_aghurmi_retreat', business_name: 'Aghurmi Salt Lake Eco Sanctuary', business_slug: 'aghurmi-retreat',
      provider_type: 'hotel', provider_badge: 'Direct from Camp', is_trusted: true,
      name_en: 'Luxury Desert Safari Glamping Camp',
      name_ar: 'مخيم سفاري فندقي فاخر وسط الكثبان',
      desc_en: 'Private Bedouin tent, private ensuite bathroom, private firepit under stars',
      desc_ar: 'خيمة بدوية مجهزة بحمام خاص، جلسة نار خاصة، إطلالة مفتوحة على المجرة',
      price_per_night: 1800,
      badge_en: 'Desert Under the Stars', badge_ar: 'سحر الصحراء',
      ota_benchmark_price: 2300, ota_name: 'Booking.com',
      external_check_url: 'https://www.booking.com/searchresults.html?ss=Siwa+Camp',
      direct_discount_note: 'Direct Camp Rate: Save 500 EGP + private firewood & Bedouin tea ceremony',
      image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80',
      icon: '⛺',
    },
    {
      id: 'boutique_resort', is_visible: true, vendor_business_ids: ['biz_siwa_resort'],
      commercial_item_id: 'acc_aghurmi_lake_sanctuary',
      business_id: 'biz_siwa_resort', business_name: 'Siwan Palm Garden Resort', business_slug: 'siwan-palm-resort',
      provider_type: 'hotel', provider_badge: 'Direct Hotel Partner', is_trusted: true,
      name_en: 'Boutique Siwan Palm Garden Resort',
      name_ar: 'منتجع واحة النخيل البوتيكي الفاخر',
      desc_en: 'Modern amenities with oasis architecture, A/C, heated natural spring plunge pool',
      desc_ar: 'راحة فندقية متكاملة مع طابع معماري واحاتي، تكييف، ومسبح عيون طبيعية',
      price_per_night: 2600,
      badge_en: 'Maximum Comfort', badge_ar: 'أقصى درجات الراحة',
      ota_benchmark_price: 3200, ota_name: 'Booking.com',
      external_check_url: 'https://www.booking.com/searchresults.html?ss=Siwa+Resort',
      direct_discount_note: 'Direct Resort Benefit: Save 600 EGP vs Booking.com + welcome date basket',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      icon: '🌴',
    },
    {
      id: 'own_stay', is_visible: true, vendor_business_ids: [],
      provider_type: 'siwify_direct', provider_badge: 'Siwify Concierge', is_trusted: true,
      name_en: 'I have arranged my own accommodation',
      name_ar: 'لدي حجز إقامة مسبق (تنسيق الجولات والأنشطة فقط)',
      desc_en: 'We will coordinate all transfers and activities from your hotel/camp',
      desc_ar: 'سنقوم بالتنسيق التام لاستقبالك وانطلاقك من مقر إقامتك المختار',
      price_per_night: 0,
      badge_en: 'Activities Only', badge_ar: 'أنشطة فقط',
      icon: '🧭',
    },
  ],
  transports: [
    {
      id: 'private_4x4', is_visible: true, vendor_business_ids: ['biz_siwa_desert_riders'],
      commercial_item_id: 'trn_landcruiser_4x4',
      business_id: 'biz_siwa_desert_riders', business_name: 'Siwa Desert Pilots Syndicate', business_slug: 'siwa-desert-riders',
      provider_type: 'operator', provider_badge: 'Licensed 4WD Pilot', is_trusted: true,
      name_en: 'Dedicated Private 4x4 Land Cruiser (Full Stay)',
      name_ar: 'سيارة لاندكروزر دفع رباعي 4x4 خاصة طوال فترة الرحلة',
      desc_en: 'Desert-certified driver, fuel, 24/7 flexibility across town & deep dunes',
      desc_ar: 'سائق محترف خبير بالدروب الصحراوية، شامل الوقود والتنقلات الكاملة',
      rate_per_day: 1400,
      ota_benchmark_price: 1800, ota_name: 'Hotel Concierge',
      external_check_url: 'https://www.tripadvisor.com/Attractions-g303856-Activities-c59-Siwa_Matrouh_Governorate.html',
      direct_discount_note: 'Direct Pilot Rate: Save 400 EGP/day + zero fuel surcharges & free sandboard included',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
      icon: '🚙',
    },
    {
      id: 'local_tuktuk_ecobuggy', is_visible: true, vendor_business_ids: ['biz_siwa_shuttle'],
      business_id: 'biz_siwa_shuttle', business_name: 'Siwa Town Green Fleet', business_slug: 'siwa-shuttle',
      provider_type: 'operator', provider_badge: 'Local Oasis Shuttle', is_trusted: true,
      name_en: 'Local Siwan Eco-Buggy & Town Shuttle',
      name_ar: 'عربة إيكو-بجي محلية وسيارات نقل بلدية لداخل الواحة',
      desc_en: 'Charming slow-paced commute through palm groves and ancient alleys',
      desc_ar: 'تنقل واحاتي هادئ وممتع بين أزقة شالي وحقول النخيل والمزارع',
      rate_per_day: 500,
      ota_benchmark_price: 650, ota_name: 'Local Taxi Estimate',
      direct_discount_note: 'On-Call Local Driver: Flat rate unlimited short trips within town & lakes',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
      icon: '🛺',
    },
    {
      id: 'cairo_transfer_4x4', is_visible: true, vendor_business_ids: ['biz_west_delta_siwa'],
      commercial_item_id: 'trn_cairo_siwa_bus_coach',
      business_id: 'biz_west_delta_siwa', business_name: 'West Delta & Siwa Royal Express', business_slug: 'siwa-royal-express',
      provider_type: 'operator', provider_badge: 'Official Oasis Transport Operator', is_trusted: true,
      name_en: 'VIP Cairo / Alex Roundtrip + Local 4x4 Package',
      name_ar: 'باقة الانتقال VIP من القاهرة / الإسكندرية + دفع رباعي بالواحة',
      desc_en: 'Door-to-door private high-end van transfer + desert 4x4 on arrival',
      desc_ar: 'توصيل خاص ذهاب وعودة من باب منزلك مع سيارة سفاري مخصصة في سيوة',
      rate_per_day: 2900,
      ota_benchmark_price: 3600, ota_name: 'Cairo Travel Desk',
      external_check_url: 'https://www.tripadvisor.com/Travel-g303856-s301/Siwa:Egypt:Arriving.And.Departing.html',
      direct_discount_note: 'VIP Transfer Privilege: Save 700 EGP + doorstep pickup, luggage assistance & rest stop snacks',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
      icon: '🚐',
    },
  ],
  meals: [
    {
      id: 'mandi_lamb', is_visible: true, vendor_business_ids: ['biz_abdu_restaurant'],
      commercial_item_id: 'din_abdu_feast',
      business_id: 'biz_abdu_restaurant', business_name: 'Abdu Heritage Restaurant & Garden', business_slug: 'abdu-restaurant',
      provider_type: 'operator', provider_badge: 'Heritage Kitchen & Garden', is_trusted: true,
      name_en: 'Bedouin Lamb Under Sand (Mendhi)',
      name_ar: 'عشاء المدمون السيوى (لحم ضأن مطهو تحت الرمال)',
      desc_en: 'Slow-roasted succulent lamb, spiced rice, Siwan soups & salads cooked over underground embers',
      desc_ar: 'لحم ضأن طازج مطهو على الجمر تحت الأرض، أرز بالبهارات السيوية، شوربة وعسل تمر',
      price_per_person: 450,
      ota_benchmark_price: 580, ota_name: 'TripAdvisor Dining',
      external_check_url: 'https://www.tripadvisor.com/Restaurants-g303856-Siwa_Matrouh_Governorate.html',
      direct_discount_note: 'Direct Table Privilege: Save 130 EGP + guaranteed outdoor garden table & free mint tea',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
      icon: '🔥',
    },
    {
      id: 'organic_vegan', is_visible: true, vendor_business_ids: ['biz_aghurmi_retreat'],
      commercial_item_id: 'din_lake_candlelit',
      business_id: 'biz_aghurmi_retreat', business_name: 'Aghurmi Sanctuary Culinary Crew', business_slug: 'aghurmi-retreat',
      provider_type: 'hotel', provider_badge: 'Organic Farm-to-Table', is_trusted: true,
      name_en: 'Organic Siwan Vegan Feast',
      name_ar: 'وليمة سيوية نباتية عضوية من مزارع النخيل والزيتون',
      desc_en: 'Seasonal oasis vegetables, fresh pomegranate, olive oil delicacies, sun-dried dates and herbal bread',
      desc_ar: 'أطباق نباتية طازجة من مزارع سيوة، زيت زيتون بكر، تغميسات وخبز التنور السيوى الساخن',
      price_per_person: 280,
      ota_benchmark_price: 360, ota_name: 'Local Cafe Menu',
      direct_discount_note: 'Farm Direct Special: 100% organic palm grove harvest & fresh clay-oven bread',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      icon: '🌿',
    },
    {
      id: 'breakfast_only', is_visible: true, vendor_business_ids: [],
      provider_type: 'siwify_direct', provider_badge: 'Flexible Dining Choice', is_trusted: true,
      name_en: 'Breakfast Only / Flexible Dining',
      name_ar: 'إفطار واحاتي فقط وتناول وجبات حرة',
      desc_en: 'Traditional breakfast included; explore local cafes and oasis kitchens at your own pace',
      desc_ar: 'إفطار محلي شهي مع حرية استكشاف واختيار المطاعم والمطابخ الشعبية بنفسك',
      price_per_person: 0,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      icon: '🍽️',
    },
  ],
};
