/**
 * SMART CATEGORY DETECTOR FOR SIWA OASIS BUSINESSES
 * Accurately detects Parent Category and Child Typology from text, URLs, and metadata.
 */

export interface DetectedCategory {
  parentId: string;
  parentName: string;
  childId: string;
  childName: string;
  confidence: number; // 0.0 to 1.0
  reasons: string[];
}

interface CategoryRule {
  parentId: string;
  parentName: string;
  childId: string;
  childName: string;
  patterns: RegExp[];
  weight: number;
  reason: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  // ── 1. AGRICULTURE & INDUSTRY FACTORIES ──
  {
    parentId: 'agriculture_industry',
    parentName: 'Agriculture, Natural Resources & Production',
    childId: 'water_factory',
    childName: 'Water Bottling & Natural Spring Factory',
    patterns: [
      /water (?:bottling|factory|plant|source|spring|refinery|production)/i,
      /natural (?:mineral|spring) water/i,
      /bottled water/i,
      /(?:مصنع|تعبئة|محطة)\s*(?:مياه|المياه|مياه طبيعية|مياه معدنية)/i,
      /مياه سيوة|مياه اكوا/i
    ],
    weight: 0.95,
    reason: 'Recognized water bottling or natural spring production facility keywords'
  },
  {
    parentId: 'agriculture_industry',
    parentName: 'Agriculture, Natural Resources & Production',
    childId: 'olive_mill',
    childName: 'Olive Mill & Oil Production',
    patterns: [
      /olive (?:mill|oil|press|cold press|extra virgin|refinery|processing|extraction)/i,
      /virgin olive oil/i,
      /معصرة (?:زيتون|الزيتون)/i,
      /زيت زيتون (?:بكر|سيوة|معصور على البارد)/i,
      /انتاج زيت الزيتون/i
    ],
    weight: 0.95,
    reason: 'Recognized olive oil mill, cold press, or olive processing terms'
  },
  {
    parentId: 'agriculture_industry',
    parentName: 'Agriculture, Natural Resources & Production',
    childId: 'date_factory',
    childName: 'Date Packaging & Processing Factory',
    patterns: [
      /date (?:factory|packaging|processing|packing|farm processing|sorting)/i,
      /siwan? dates/i,
      /deglet|siwi dates|date palm products/i,
      /(?:مصنع|تعبئة|تغليف|فرز)\s*(?:تمور|التمور|بلح|البلح)/i,
      /تمور سيوة|بلح سيوة/i
    ],
    weight: 0.95,
    reason: 'Recognized date processing, packaging, and sorting factory terms'
  },
  {
    parentId: 'agriculture_industry',
    parentName: 'Agriculture, Natural Resources & Production',
    childId: 'salt_factory',
    childName: 'Salt Processing & Refining Factory',
    patterns: [
      /salt (?:factory|refinery|processing|quarry|refining|export|mining|iodized)/i,
      /rock salt (?:production|refinery|plant)/i,
      /siwa (?:raw )?salt (?:industry|plant)/i,
      /(?:مصنع|تكرير|استخراج|معالجة)\s*(?:ملح|الملح|الملح الصخري)/i,
      /ملح سيوة الطبيعي/i
    ],
    weight: 0.95,
    reason: 'Recognized industrial salt extraction, refining, or processing plant terms'
  },
  {
    parentId: 'agriculture_industry',
    parentName: 'Agriculture, Natural Resources & Production',
    childId: 'herbal_factory',
    childName: 'Herbal & Botanical Production',
    patterns: [
      /herbal (?:factory|production|processing|extraction|drying)/i,
      /medicinal (?:plants|herbs) (?:processing|factory|distillation)/i,
      /essential oils? (?:distillery|production)/i,
      /(?:مصنع|استخلاص|تجفيف)\s*(?:اعشاب|الأعشاب|نباتات طبية|زيوت عطرية)/i
    ],
    weight: 0.9,
    reason: 'Recognized botanical, medicinal herb processing or essential oil distillation terms'
  },

  // ── 2. TRAVEL & ADVENTURE ──
  {
    parentId: 'adventure',
    parentName: 'Travel & Adventure',
    childId: 'travel_agency',
    childName: 'Travel Agency & Tour Operator',
    patterns: [
      /travel (?:agency|services|tours?|packages?|desk)/i,
      /tour (?:operator|company|agency|service)/i,
      /tourism (?:services|agency)/i,
      /booking (?:tours|excursions)/i,
      /travel & tourism/i,
      /(?:شركة|وكالة|مكتب)\s*(?:سياحة|سفريات|رحلات|حجوزات)/i
    ],
    weight: 0.9,
    reason: 'Recognized travel agency, tour operator, or booking agency terms'
  },
  {
    parentId: 'adventure',
    parentName: 'Travel & Adventure',
    childId: 'safari_operator',
    childName: 'Safari Operator & Great Sand Sea Tours',
    patterns: [
      /safari|desert safari|dune bashing|great sand sea|4x4 expedition|sandboarding/i,
      /desert camp tour|overnight desert tour/i,
      /رحلات سفاري|سفاري سيوة|بحر الرمال الاعظم|تزلج على الرمال/i
    ],
    weight: 0.9,
    reason: 'Recognized safari, desert expedition, or Great Sand Sea operator terms'
  },

  // ── 3. ACCOMMODATION & HOSPITALITY ──
  {
    parentId: 'accommodation',
    parentName: 'Hotels & Accommodation',
    childId: 'eco_lodge',
    childName: 'Eco Lodge & Traditional Karshif Stays',
    patterns: [
      /eco[\s-]?lodge|karshif lodge|sustainable stay|bio architecture|mud brick lodge/i,
      /نزل بيئي|بيئي|كرشيف|نزل سيوة التقليدي/i
    ],
    weight: 0.9,
    reason: 'Recognized eco-lodge or traditional Karshif architecture stay'
  },
  {
    parentId: 'accommodation',
    parentName: 'Hotels & Accommodation',
    childId: 'camp',
    childName: 'Desert Camp & Glamping',
    patterns: [
      /desert camp|glamping|tent stay|bedouin camp|oasis camp/i,
      /مخيم|كامب|مخيم بدوي|تخييم/i
    ],
    weight: 0.88,
    reason: 'Recognized desert camping, glamping, or Bedouin tent accommodation'
  },
  {
    parentId: 'accommodation',
    parentName: 'Hotels & Accommodation',
    childId: 'hotel',
    childName: 'Hotel & Resort',
    patterns: [
      /hotel|resort|boutique hotel|inn|suites|guest rooms|accommodation|check-in|check-out/i,
      /booking\.com\/hotel|tripadvisor\.[a-z.]+\/Hotel_Review/i,
      /فندق|منتجع|اوتيل|شاليهات|غرف فندقية/i
    ],
    weight: 0.85,
    reason: 'Recognized hotel, resort, or lodging property attributes'
  },
  {
    parentId: 'accommodation',
    parentName: 'Hotels & Accommodation',
    childId: 'guest_house',
    childName: 'Guest House & Villa',
    patterns: [
      /guest[\s-]?house|villa|homestay|holiday home|bed and breakfast|b&b|apartment rental/i,
      /بيت ضيافة|دار ضيافة|فيلا للايجار/i
    ],
    weight: 0.85,
    reason: 'Recognized guest house, villa, or holiday home rental'
  },

  // ── 4. FOOD & BEVERAGE ──
  {
    parentId: 'food_beverage',
    parentName: 'Food & Dining',
    childId: 'restaurant',
    childName: 'Restaurant & Traditional Dining',
    patterns: [
      /restaurant|dining|cuisine|traditional kitchen|lunch|dinner|grill|tagine/i,
      /tripadvisor\.[a-z.]+\/Restaurant_Review/i,
      /مطعم|اكلات سيوية|طاجن|مشويات|مأكولات/i
    ],
    weight: 0.88,
    reason: 'Recognized restaurant, dining, or traditional food venue'
  },
  {
    parentId: 'food_beverage',
    parentName: 'Food & Dining',
    childId: 'cafe',
    childName: 'Cafe & Bedouin Tea Lounge',
    patterns: [
      /cafe|coffee shop|tea lounge|bedouin tea|juice bar|bakery/i,
      /كافيه|مقهى|شاي سيوة|شاي باللويزة|عصائر/i
    ],
    weight: 0.88,
    reason: 'Recognized cafe, tea lounge, or beverage bar'
  },

  // ── 5. WELLNESS & HEALING ──
  {
    parentId: 'wellness',
    parentName: 'Wellness, Healing & Springs',
    childId: 'hot_spring',
    childName: 'Hot Spring & Healing Natural Waters',
    patterns: [
      /hot spring|sulfur spring|cleopatra spring|natural pool|healing water|mineral spring/i,
      /عين كليوباترا|عين سخنة|عين فطناس|مياه كبريتية|ينابيع حارة/i
    ],
    weight: 0.92,
    reason: 'Recognized natural hot spring or sulfur therapeutic spring'
  },
  {
    parentId: 'wellness',
    parentName: 'Wellness, Healing & Springs',
    childId: 'sand_bath',
    childName: 'Sand Bath Therapy & Salt Caves',
    patterns: [
      /sand bath|mountain takrour sand bath|salt cave|halotherapy|psammatherapy/i,
      /دفن بالرمال|علاج بالرمال|جبل تكرور|كهف الملح/i
    ],
    weight: 0.92,
    reason: 'Recognized Takrour sand bath therapy or salt cave healing'
  },

  // ── 6. CRAFTS & ARTISANS ──
  {
    parentId: 'crafts',
    parentName: 'Crafts, Heritage & Artisans',
    childId: 'souvenir_shop',
    childName: 'Handicrafts & Souvenir Shop',
    patterns: [
      /handicraft|siwan embroidery|pottery|salt rock lamp|palm basket|silver jewelry|bazaar/i,
      /مشغولات يدوية|تطريز سيوي|اباجورات ملح|خزف|فضة سيوة|بازار/i
    ],
    weight: 0.88,
    reason: 'Recognized Siwan handicrafts, embroidery, salt lamps, or artisan shop'
  },

  // ── 7. TRANSPORTATION ──
  {
    parentId: 'transportation',
    parentName: 'Transportation & Transfers',
    childId: 'taxi_transfer',
    childName: 'Taxi & Local Transfer Service',
    patterns: [
      /taxi|transfer|airport pickup|car rental|4x4 rental|bus service|shuttle/i,
      /تاكسي|توصيل|ايجار سيارات|ليموزين|نقل سياحي/i
    ],
    weight: 0.88,
    reason: 'Recognized taxi, transfer, rental, or intercity transportation'
  }
];

export function detectBusinessCategory(text: string, url: string = ''): DetectedCategory {
  const combined = `${url} \n ${text || ''}`.trim();
  
  if (!combined) {
    return {
      parentId: 'accommodation',
      parentName: 'Hotels & Accommodation',
      childId: 'hotel',
      childName: 'Hotel & Resort',
      confidence: 0.5,
      reasons: ['Default baseline category']
    };
  }

  let bestMatch: CategoryRule | null = null;
  let highestScore = 0;
  const matchedReasons: string[] = [];

  for (const rule of CATEGORY_RULES) {
    let matchCount = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(combined)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const score = Math.min(0.99, rule.weight + (matchCount - 1) * 0.05);
      matchedReasons.push(`${rule.childName}: ${rule.reason} (${matchCount} keyword hits)`);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = rule;
      }
    }
  }

  if (bestMatch) {
    return {
      parentId: bestMatch.parentId,
      parentName: bestMatch.parentName,
      childId: bestMatch.childId,
      childName: bestMatch.childName,
      confidence: Number(highestScore.toFixed(2)),
      reasons: [bestMatch.reason]
    };
  }

  if (/booking\.com|agoda\.com|airbnb/i.test(url || combined)) {
    return {
      parentId: 'accommodation',
      parentName: 'Hotels & Accommodation',
      childId: 'hotel',
      childName: 'Hotel & Resort',
      confidence: 0.8,
      reasons: ['Detected OTA booking domain URL']
    };
  }

  return {
    parentId: 'accommodation',
    parentName: 'Hotels & Accommodation',
    childId: 'hotel',
    childName: 'Hotel & Resort',
    confidence: 0.5,
    reasons: ['No specific factory or activity keywords detected, defaulting to accommodation']
  };
}
