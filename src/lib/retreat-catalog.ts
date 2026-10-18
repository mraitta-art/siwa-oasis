import { RetreatProgram } from './retreat-types';
import { DEFAULT_COMMERCIAL_ITEMS } from './commercial-catalog';

const findItem = (id: string) => {
  const found = DEFAULT_COMMERCIAL_ITEMS.find(item => item.id === id);
  if (!found) {
    console.warn(`[RetreatCatalog] Item ID "${id}" not found in commercial catalog. Using fallback.`);
    const prefix = id.split('_')[0];
    const fallback = DEFAULT_COMMERCIAL_ITEMS.find(item => item.id.startsWith(prefix)) || DEFAULT_COMMERCIAL_ITEMS[0];
    return fallback;
  }
  return found;
};


export const SIGNATURE_RETREAT_PROGRAMS: RetreatProgram[] = [
  {
    id: 'retreat_silence_3days',
    slug: 'lake-silence-retreat',
    title_en: '3-Day Inner Silence & Lake Sanctuary',
    title_ar: 'خلوة الصمت الداخلي وبحيرات الملح لـ 3 أيام',
    tagline_en: 'Listen to the message silently — from calm water horizons to starlit desert dunes.',
    tagline_ar: 'استمع إلى رسالة السكينة في صمت تام — من ضفاف بحيرات الملح الهادئة إلى نجوم الكثبان الرملية.',
    duration_days: 3,
    duration_nights: 2,
    hero_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80',
    badge_en: 'Vibe Signature Series',
    badge_ar: 'سلسلة تجارب السكينة الخاصة',
    base_price_egp: 13500,
    discounted_price_egp: 11475, // 15% Full Package Bundle discount
    discount_percentage: 15,
    vibe_tags: ['lake_silence', 'desert_stars', 'heritage_wisdom', 'healing_salt'],
    inclusions_en: [
      '2 Nights curated luxury eco-stays (1 Night Waterfront Salt Chalet + 1 Night Starlight Dune Camp)',
      'Private 4x4 Land Cruiser throughout journey',
      'Daily curated wellness & silent floating sessions',
      'All organic farm meals & desert dune feasts',
      'Historical Temple of the Oracle private access'
    ],
    inclusions_ar: [
      'إقامة ليلتين مختارتين بعناية (ليلة شاليه مواجه للبحيرة + ليلة مخيم النجوم بالصحراء)',
      'سيارة دفع رباعي لاندكروزر خاصة طوال أيام البرنامج',
      'جلسات يومية للطفو الاستشفائي والتأمل في الطبيعة',
      'كافة الوجبات العضوية وولائم العشاء الصحراوي',
      'زيارة خاصة لمعبد الوحي وقلعة شالي الأثرية'
    ],
    days: [
      // ── DAY 1: LAKE SILENCE & FLOATING ────────────────────────────────────
      {
        day_number: 1,
        vibe_key: 'lake_silence',
        vibe_title_en: 'Day 1 Vibe: Lake Silence & Meditation',
        vibe_title_ar: 'اليوم الأول: سكينة بحيرات الملح والتأمل الصامت',
        vibe_quote_en: '“Step out of the noise. Listen to the silent whisper of the endless reflective salt waters.”',
        vibe_quote_ar: '«اخرج من صخب العالم، واستمع لهمس السكينة المنعكس على مرآة مياه الملح اللانهائية.»',
        vibe_badge_en: 'Waterfront Reflection',
        vibe_badge_ar: 'إطلالة بحيرة الملح',
        vibe_view: 'Aghurmi Salt Lake Shore',
        vibe_color: '#2a7258',
        accommodation: findItem('acc_aghurmi_lake_sanctuary'),
        transport: findItem('trn_package_round_transfer'),
        dining: findItem('din_lake_candlelit'),
        activity: findItem('act_salt_lake_float'),


        day_price: 4800,
        timeline: [
          {
            id: 'd1_t1',
            time_start: '12:00',
            time_end: '13:00',
            sector: 'transports',
            title_en: 'Siwa Arrival & Scenic Transfer',
            title_ar: 'الوصول إلى سيوة والانتقال المريح إلى البحيرة',
            description_en: 'Private climate-controlled transfer from Siwa Oasis center directly to the peaceful waterfront.',
            description_ar: 'استقبال خاص وانتقال هادئ ومريح نحو البحيرات الملحية.',
            business_name: 'Siwa Eco Transport Fleet',
            location_name: 'Siwa Oasis Gateway',
            price: 600
          },
          {
            id: 'd1_t2',
            time_start: '14:00',
            time_end: '15:30',
            sector: 'accommodation',
            title_en: 'Check-in: Waterfront Salt Chalet',
            title_ar: 'تسجيل الوصول: شاليه بحيرة أغورمي الملحية',
            description_en: 'Settle into your candlelit mudbrick suite overlooking the tranquil turquoise waters.',
            description_ar: 'استلام جناحك البيئي الهادئ والاستمتاع بترحيب الشاي السيوي بالأعشاب.',
            business_name: 'Aghurmi Salt Lake Eco Sanctuary',
            location_name: 'Aghurmi Salt Lake Shore',
            price: 2600,
            is_customizable: true
          },
          {
            id: 'd1_t3',
            time_start: '16:30',
            time_end: '18:00',
            sector: 'activities',
            title_en: 'Hyper-Saline Zero-Gravity Float Therapy',
            title_ar: 'جلسة الطفو وانعدام الجاذبية في بحيرات الملح',
            description_en: 'Effortless weightless floating in 95% mineral saline waters with guided breathing reflection.',
            description_ar: 'الطفو الطبيعي فوق المياه الغنية بالمعادن لتصفية الذهن والتخلص من التوتر العصبي.',
            business_name: 'Siwa Pure Salt & Wellness Spa',
            location_name: 'Aghurmi Salt Lakes',
            price: 450,
            is_customizable: true
          },
          {
            id: 'd1_t4',
            time_start: '19:30',
            time_end: '21:00',
            sector: 'dining',
            title_en: 'Candlelit Organic Sunset Dining',
            title_ar: 'عشاء الشموع العضوي على ضفاف البحيرة',
            description_en: 'Farm-to-table Siwan dinner featuring slow-cooked dishes, date salad, and fresh herbal infusions.',
            description_ar: 'وجبة عشاء استثنائية من خيرات واحة سيوة مع سلطة البلح وزيت الزيتون البكر.',
            business_name: 'Abdu Heritage Restaurant & Garden',
            location_name: 'Waterfront Terrace',
            price: 380,
            is_customizable: true
          }
        ]
      },

      // ── DAY 2: DEEP DUNES & STARLIGHT ─────────────────────────────────────
      {
        day_number: 2,
        vibe_key: 'desert_stars',
        vibe_title_en: 'Day 2 Vibe: Deep Desert Dunes & Cosmic Silence',
        vibe_title_ar: 'اليوم الثاني: هيبة الكثبان الرملية وسكينة النجوم',
        vibe_quote_en: '“Move from calm waters to the mighty sands. Here, silence is profound and the universe is your ceiling.”',
        vibe_quote_ar: '«انتقل من هدوء الماء إلى جلال الرمال الذهبية الشاهقة حيث سقفك مجرة كاملة من النجوم.»',
        vibe_badge_en: 'Endless Dunes & Stars',
        vibe_badge_ar: 'كثبان ذهبية وسماء مرصعة',
        vibe_view: 'Great Sand Sea Horizon',
        vibe_color: '#d97706',
        accommodation: findItem('acc_dunes_glamping_camp'),
        transport: findItem('trn_landcruiser_4x4'),
        dining: findItem('din_package_dune_sunset'),
        activity: findItem('act_package_oasis_wellness_day'),

        day_price: 5900,
        timeline: [
          {
            id: 'd2_t1',
            time_start: '08:30',
            time_end: '09:30',
            sector: 'dining',
            title_en: 'Sunrise Organic Farm Breakfast',
            title_ar: 'إفطار شروق الشمس من مزارع النخيل العضوية',
            description_en: 'Freshly baked date bread, local goat cheese, wild honey, and freshly pressed olive oil.',
            description_ar: 'خبز التمر الطازج والجبن السيوي وعسل البرسيم وزيت الزيتون.',
            business_name: 'Aghurmi Salt Lake Eco Sanctuary',
            location_name: 'Lake Shore Deck',
            price: 250
          },
          {
            id: 'd2_t2',
            time_start: '11:00',
            time_end: '13:00',
            sector: 'transports',
            title_en: '4x4 Cruiser Deep Sand Expedition',
            title_ar: 'انطلاق سيارة الدفع الرباعي نحو عمق بحر الرمال الأعظم',
            description_en: 'Private Land Cruiser journey across rolling golden crests, navigating into total wilderness.',
            description_ar: 'رحلة استكشافية باللاندكروزر لاجتياز الكثبان الذهبية الشاهقة والوصول للمخيم الصحراوي.',
            business_name: 'Great Sand Sea 4x4 Adventures',
            location_name: 'Great Sand Sea',
            price: 1800,
            is_customizable: true
          },
          {
            id: 'd2_t3',
            time_start: '15:30',
            time_end: '17:00',
            sector: 'activities',
            title_en: 'Natural Hot Sulphur Spring Soak & Sandboard',
            title_ar: 'الاستحمام في عين كبريتية دافئة والتزلج على الرمال',
            description_en: 'Restorative mineral soak in the natural hot spring of Bir Wahed, surrounded by 360-degree sand crests.',
            description_ar: 'السباحة في نبع بئر واحد الكبريتي الدافئ وسط الصحراء وجلسة تزلج رملي ممتعة.',
            business_name: 'Siwa Wellness Expeditions',
            location_name: 'Bir Wahed Oasis Lake',
            price: 550,
            is_customizable: true
          },
          {
            id: 'd2_t4',
            time_start: '17:30',
            time_end: '18:30',
            sector: 'accommodation',
            title_en: 'Check-in: Starlight Glamping Camp',
            title_ar: 'استلام الخيمة الفاخرة بمخيم النجوم',
            description_en: 'Settle into your handwoven Bedouin dome tent with plush bedding isolated from all city lights.',
            description_ar: 'الاستقرار في الخيمة البدوية الفاخرة مع فراش وثيق وإطلالة غير محجوبة على الأفق.',
            business_name: 'Great Sand Sea Dune Camp',
            location_name: 'Deep Dunes, Siwa',
            price: 2400,
            is_customizable: true
          },
          {
            id: 'd2_t5',
            time_start: '19:30',
            time_end: '22:00',
            sector: 'dining',
            title_en: 'Underground Mandi Starlight Banquet',
            title_ar: 'وليمة المندي السيوي وسهرة الشاي حول نار الحطب',
            description_en: 'Slow-cooked pit feast served on Bedouin floor rugs by lantern light, with live Siwan acoustic flute.',
            description_ar: 'عشاء فاخر مطهو تحت الرمال مع شاي الزردة السيوي على الحطب والموسيقى الواحاتية الهادئة.',
            business_name: 'Abdu Heritage Restaurant & Garden',
            location_name: 'Dune Starlight Circle',
            price: 1850,
            is_customizable: true
          }
        ]
      },

      // ── DAY 3: HERITAGE WISDOM & ANCIENT ENERGY ───────────────────────────
      {
        day_number: 3,
        vibe_key: 'heritage_wisdom',
        vibe_title_en: 'Day 3 Vibe: Heritage Wisdom & Reset',
        vibe_title_ar: 'اليوم الثالث: حكمة التاريخ وتجدد الروح',
        vibe_quote_en: '“Connect with the ancestors at the Temple of the Oracle and depart carrying the timeless oasis peace.”',
        vibe_quote_ar: '«تواصل مع طاقة الأجداد في معبد الوحي، وغادر الواحة محملاً بالسكينة التي لا تنتهي.»',
        vibe_badge_en: 'Ancient Heritage',
        vibe_badge_ar: 'عبق التاريخ والبركة',
        vibe_view: 'Old Shali Citadel & Olive Groves',
        vibe_color: '#15803d',
        accommodation: findItem('acc_taziry_standard'),
        transport: findItem('trn_landcruiser_4x4'),
        dining: findItem('din_abdu_feast'),
        activity: findItem('act_package_oasis_wellness_day'),
        tour: findItem('tur_shali_oracle_walk'),

        day_price: 2800,
        timeline: [
          {
            id: 'd3_t1',
            time_start: '07:00',
            time_end: '08:00',
            sector: 'activities',
            title_en: 'Dune Sunrise Silent Walking Meditation',
            title_ar: 'تأمل المشي الصامت مع شروق شمس الصحراء',
            description_en: 'Barefoot walk along pristine morning dunes as the first golden rays awaken the desert.',
            description_ar: 'مسير صامت بأقدام حافية فوق الرمال النقية مع تدفق خيوط الشروق الأولى.',
            business_name: 'Great Sand Sea Dune Camp',
            location_name: 'Camp Ridge',
            price: 200
          },
          {
            id: 'd3_t2',
            time_start: '10:00',
            time_end: '12:30',
            sector: 'tours',
            title_en: 'Private Guided Oracle Temple & Shali Pilgrimage',
            title_ar: 'جولة خاصة في معبد آمون وقلعة شالي القديمة',
            description_en: 'Follow the footsteps of Alexander the Great with a master historian through 2,500 years of mystical history.',
            description_ar: 'استكشاف معبد الوحي وجبل الموتى وقلعة شالي الفخارية القديمة بصحبة مرشد تراثي متخصص.',
            business_name: 'Alexander Oracle Expeditions',
            location_name: 'Aghurmi & Old Shali',
            price: 850,
            is_customizable: true
          },
          {
            id: 'd3_t3',
            time_start: '13:00',
            time_end: '14:30',
            sector: 'dining',
            title_en: 'Palm Garden Farewell Oasis Lunch',
            title_ar: 'غداء الوداع في حدائق النخيل الأثرية',
            description_en: 'Light Mediterranean and Siwan farewell mezze in an ancient shaded date grove.',
            description_ar: 'غداء خفيف وسط أشجار النخيل المعمرة مع عصير الليمون بالنعناع وزيت الزيتون البكر.',
            business_name: 'Abdu Heritage Restaurant & Garden',
            location_name: 'Ancient Palm Garden',
            price: 350
          },
          {
            id: 'd3_t4',
            time_start: '15:30',
            time_end: '16:30',
            sector: 'transports',
            title_en: 'Comfort Departure Transfer & Integration Pack',
            title_ar: 'الانتقال الختامي وهدية الواحة الاستشفائية',
            description_en: 'Comfortable transfer to your travel departure point, with a curated gift bottle of pure Siwan salt & cold-pressed oil.',
            description_ar: 'انتقال مريح إلى محطة المغادرة مع هدية تذكارية من ملح الكريستال النقي وزيت الزيتون.',
            business_name: 'Siwa Eco Transport Fleet',
            location_name: 'Departure Hub',
            price: 400
          }
        ]
      }
    ]
  },

  // ── 2. THE 4-DAY HEALER'S WATERS & DESERT DEEP DIVE ──────────────────────
  {
    id: 'retreat_healer_4days',
    slug: 'healers-waters-retreat',
    title_en: '4-Day The Healer’s Waters & Ancient Oasis',
    title_ar: 'خلوة المياه الشافية والواحة القديمة لـ 4 أيام',
    tagline_en: 'Submerge into hot mineral springs, ancient salt therapy, and organic eco-living.',
    tagline_ar: 'انغمس في الينابيع المعدنية الدافئة والعلاج بالملح الصخري والحياة العضوية النقية.',
    duration_days: 4,
    duration_nights: 3,
    hero_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    badge_en: 'Deep Reset',
    badge_ar: 'تجديد حيوي متكامل',
    base_price_egp: 18000,
    discounted_price_egp: 15300,
    discount_percentage: 15,
    vibe_tags: ['hot_springs', 'salt_healing', 'organic_food', 'silence'],
    inclusions_en: [
      '3 Nights in Premier Eco-Lodges',
      'Daily therapeutic sulfur and hyper-saline baths',
      'Full-board organic farm meals',
      'Private dedicated transport & wellness concierge'
    ],
    inclusions_ar: [
      'إقامة 3 ليالٍ في منتجعات بيئية متفوقة',
      'جلسات استشفائية يومية في العيون الكبريتية وبحيرات الملح',
      'إقامة كاملة مع وجبات عضوية من مزارع الواحة',
      'مواصلات خاصة ومرشد صحي متفرغ طوال الرحلة'
    ],
    days: [] // dynamically cloned from silence_3days with extra day
  }
];

// Populate 4-day clone with 4th day
SIGNATURE_RETREAT_PROGRAMS[1].days = [
  ...SIGNATURE_RETREAT_PROGRAMS[0].days,
  {
    day_number: 4,
    vibe_key: 'salt_healing',
    vibe_title_en: 'Day 4 Vibe: Total Physical & Mental Rebirth',
    vibe_title_ar: 'اليوم الرابع: تجدد الصفاء الجسدي والذهني الكامل',
    vibe_quote_en: '“Depart as a new person, grounded in the ancient frequency of Siwa Oasis.”',
    vibe_quote_ar: '«غادر الواحة كإنسان جديد متصل بترددات الأرض وسكينة الطبيعة الأزلية.»',
    vibe_badge_en: 'Total Renewal',
    vibe_badge_ar: 'تجدد شامل',
    vibe_view: 'Mountain of the Dead & Palms',
    vibe_color: '#0d9488',
    accommodation: findItem('acc_taziry_standard'),
    transport: findItem('trn_package_round_transfer'),
    dining: findItem('din_abdu_feast'),
    activity: findItem('act_salt_lake_float'),

    day_price: 3600,
    timeline: [
      {
        id: 'd4_t1',
        time_start: '09:00',
        time_end: '11:00',
        sector: 'activities',
        title_en: 'Final Salt Lake Floating & Crystal Grounding',
        title_ar: 'جلسة الطفو الختامية وتثبيت الطاقة بالملح الصخري',
        description_en: 'Closing private float session to lock in deep musculoskeletal relaxation.',
        description_ar: 'جلسة طفو استرخائية أخيرة في مياه الملح الصافي قبل الاستعداد للمغادرة.',
        business_name: 'Siwa Pure Salt & Wellness Spa',
        location_name: 'Aghurmi Lakes',
        price: 450
      },
      {
        id: 'd4_t2',
        time_start: '12:00',
        time_end: '14:00',
        sector: 'dining',
        title_en: 'Nutrient-Dense Oasis Farewell Banquet',
        title_ar: 'وليمة الغداء الختامية الغنية بالمعادن',
        description_en: 'Nourishing Siwan lunch packed with local herbs, dates, and organic greens.',
        description_ar: 'غداء صحي متكامل مع الأعشاب السيوية الطازجة.',
        business_name: 'Abdu Heritage Restaurant & Garden',
        location_name: 'Garden Deck',
        price: 350
      },
      {
        id: 'd4_t3',
        time_start: '15:00',
        time_end: '16:00',
        sector: 'transports',
        title_en: 'VIP Farewell Departure Transfer',
        title_ar: 'توديع كبار الزوار والانتقال الختامي',
        description_en: 'Private executive transfer to flight or highway coach point.',
        description_ar: 'توديع خاص وانتقال سلس ومريح إلى نقطة السفر.',
        business_name: 'Siwa Eco Transport Fleet',
        location_name: 'Siwa Station / Airport',
        price: 500
      }
    ]
  }
];
