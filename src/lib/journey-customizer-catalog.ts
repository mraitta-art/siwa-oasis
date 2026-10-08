export interface JourneyCatalogItemBase {
  id: string;
  is_visible: boolean;
  vendor_business_ids: string[];
  image?: string;
  icon?: string;
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
      vendor_business_ids: [],
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
    },
    {
      id: 'exp_great_sand_sea',
      is_visible: true,
      vendor_business_ids: [],
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
    },
    {
      id: 'exp_shali_amun_oracle',
      is_visible: true,
      vendor_business_ids: [],
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
    },
    {
      id: 'exp_bir_wahed_hotspring',
      is_visible: true,
      vendor_business_ids: [],
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
    },
    {
      id: 'exp_bedouin_camp_dinner',
      is_visible: true,
      vendor_business_ids: [],
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
    },
    {
      id: 'exp_olive_dates_workshop',
      is_visible: true,
      vendor_business_ids: [],
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
    },
  ],
  accommodations: [
    {
      id: 'ecolodge_premium', is_visible: true, vendor_business_ids: [],
      name_en: 'Authentic Kershef Mud-Brick Eco-Lodge',
      name_ar: 'إيكولودج كرشيف بيئي أصيل (طراز سيوة التاريخي)',
      desc_en: 'Salt-rock walls, beeswax candles, spring-fed pool, zero-noise sanctuary',
      desc_ar: 'جدران من أحجار الملح والطين، شموع عسل النحل، بركة ماء عذب، هدوء تام',
      price_per_night: 2200,
      badge_en: 'Signature Siwa Style', badge_ar: 'الطابع السيوى الفريد',
    },
    {
      id: 'desert_glamping', is_visible: true, vendor_business_ids: [],
      name_en: 'Luxury Desert Safari Glamping Camp',
      name_ar: 'مخيم سفاري فندقي فاخر وسط الكثبان',
      desc_en: 'Private Bedouin tent, private ensuite bathroom, private firepit under stars',
      desc_ar: 'خيمة بدوية مجهزة بحمام خاص، جلسة نار خاصة، إطلالة مفتوحة على المجرة',
      price_per_night: 1800,
      badge_en: 'Desert Under the Stars', badge_ar: 'سحر الصحراء',
    },
    {
      id: 'boutique_resort', is_visible: true, vendor_business_ids: [],
      name_en: 'Boutique Siwan Palm Garden Resort',
      name_ar: 'منتجع واحة النخيل البوتيكي الفاخر',
      desc_en: 'Modern amenities with oasis architecture, A/C, heated natural spring plunge pool',
      desc_ar: 'راحة فندقية متكاملة مع طابع معماري واحاتي، تكييف، ومسبح عيون طبيعية',
      price_per_night: 2600,
      badge_en: 'Maximum Comfort', badge_ar: 'أقصى درجات الراحة',
    },
    {
      id: 'own_stay', is_visible: true, vendor_business_ids: [],
      name_en: 'I have arranged my own accommodation',
      name_ar: 'لدي حجز إقامة مسبق (تنسيق الجولات والأنشطة فقط)',
      desc_en: 'We will coordinate all transfers and activities from your hotel/camp',
      desc_ar: 'سنقوم بالتنسيق التام لاستقبالك وانطلاقك من مقر إقامتك المختار',
      price_per_night: 0,
      badge_en: 'Activities Only', badge_ar: 'أنشطة فقط',
    },
  ],
  transports: [
    {
      id: 'private_4x4', is_visible: true, vendor_business_ids: [],
      name_en: 'Dedicated Private 4x4 Land Cruiser (Full Stay)',
      name_ar: 'سيارة لاندكروزر دفع رباعي 4x4 خاصة طوال فترة الرحلة',
      desc_en: 'Desert-certified driver, fuel, 24/7 flexibility across town & deep dunes',
      desc_ar: 'سائق محترف خبير بالدروب الصحراوية، شامل الوقود والتنقلات الكاملة',
      rate_per_day: 1400,
    },
    {
      id: 'local_tuktuk_ecobuggy', is_visible: true, vendor_business_ids: [],
      name_en: 'Local Siwan Eco-Buggy & Town Shuttle',
      name_ar: 'عربة إيكو-بجي محلية وسيارات نقل بلدية لداخل الواحة',
      desc_en: 'Charming slow-paced commute through palm groves and ancient alleys',
      desc_ar: 'تنقل واحاتي هادئ وممتع بين أزقة شالي وحقول النخيل والمزارع',
      rate_per_day: 500,
    },
    {
      id: 'cairo_transfer_4x4', is_visible: true, vendor_business_ids: [],
      name_en: 'VIP Cairo / Alex Roundtrip + Local 4x4 Package',
      name_ar: 'باقة الانتقال VIP من القاهرة / الإسكندرية + دفع رباعي بالواحة',
      desc_en: 'Door-to-door private high-end van transfer + desert 4x4 on arrival',
      desc_ar: 'توصيل خاص ذهاب وعودة من باب منزلك مع سيارة سفاري مخصصة في سيوة',
      rate_per_day: 2900,
    },
  ],
  meals: [
    {
      id: 'mandi_lamb', is_visible: true, vendor_business_ids: [],
      name_en: 'Bedouin Lamb Under Sand (Mendhi)',
      name_ar: 'عشاء المدمون السيوى (لحم ضأن مطهو تحت الرمال)',
      desc_en: 'Slow-roasted succulent lamb, spiced rice, Siwan soups & salads cooked over underground embers',
      desc_ar: 'لحم ضأن طازج مطهو على الجمر تحت الأرض، أرز بالبهارات السيوية، شوربة وعسل تمر',
      price_per_person: 450,
    },
    {
      id: 'organic_vegan', is_visible: true, vendor_business_ids: [],
      name_en: 'Organic Siwan Vegan Feast',
      name_ar: 'وليمة سيوية نباتية عضوية من مزارع النخيل والزيتون',
      desc_en: 'Seasonal oasis vegetables, fresh pomegranate, olive oil delicacies, sun-dried dates and herbal bread',
      desc_ar: 'أطباق نباتية طازجة من مزارع سيوة، زيت زيتون بكر، تغميسات وخبز التنور السيوى الساخن',
      price_per_person: 280,
    },
    {
      id: 'breakfast_only', is_visible: true, vendor_business_ids: [],
      name_en: 'Breakfast Only / Flexible Dining',
      name_ar: 'إفطار واحاتي فقط وتناول وجبات حرة',
      desc_en: 'Traditional breakfast included; explore local cafes and oasis kitchens at your own pace',
      desc_ar: 'إفطار محلي شهي مع حرية استكشاف واختيار المطاعم والمطابخ الشعبية بنفسك',
      price_per_person: 0,
    },
  ],
};
