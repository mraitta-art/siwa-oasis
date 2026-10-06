import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Standard industry feature presets for WhatsApp Client Showcase
 */
export const CATEGORY_FEATURE_PRESETS: Record<string, { en: string[]; ar: string[] }> = {
  transport: {
    en: [
      '🛺 Licensed & Clean Tuk-Tuk / Transfer Vehicle',
      '👤 Verified Local Siwan Driver',
      '🌅 Salt Lakes, Dakrour & Sunset Trips',
      '💬 English & Arabic Speaking',
      '📍 Free Hotel Pickup & Drop-off in Siwa',
      '⚡ Fixed, Transparent & Fair Pricing',
    ],
    ar: [
      '🛺 توك توك / سيارة نقل مرخصة ونظيفة',
      '👤 سائق سيوي محلي معتمد وموثوق',
      '🌅 جولات بحيرات الملح، جبل الدكرور وغروب الفطناس',
      '💬 يتحدث العربية والإنجليزية للترحيب بالضيوف',
      '📍 استقبال وتوصيل مباشر من وإلى فندقك في سيوة',
      '⚡ أسعار ثابتة ومناسبة بدون عمولات خفية',
    ],
  },
  safari: {
    en: [
      '🚙 Equipped 4x4 Land Cruiser with Desert Permits',
      '🏜️ Great Sand Sea Dune Bashing & Sandboarding',
      '⛺ Hot Spring & Bedouin Tea at Sunset Camp',
      '🧭 Expert Desert Guide with 10+ Years Experience',
    ],
    ar: [
      '🚙 سيارة دفع رباعي 4x4 مجهزة بتصاريح الصحراء',
      '🏜️ سفاري بحر الرمال الأعظم والتزلج على الرمال',
      '⛺ استراحة عند بئر المياه الكبريتية وشاي بدوي عند الغروب',
      '🧭 دليل صحراوي خبير بأمان ودروب الواحة',
    ],
  },
  wellness: {
    en: [
      '🧂 Crystal Clear Healing Salt Lakes Floating Sessions',
      '🏜️ Natural Hot Sand Baths at Mount Dakrour (Rheumatism & Joint Relief)',
      '♨️ Natural Warm Sulfur Mineral Springs Relaxation',
      '🌿 Organic Siwan Olive Oil & Salt Scrub Therapeutic Massages',
      '🧘 Private Quiet Wellness Oasis & Sunset Meditation',
      '🍵 Traditional Siwan Herbal Detox Teas & Fresh Dates',
    ],
    ar: [
      '🧂 جلسات طفو واستشفاء في بحيرات الملح الكريستالية النقية',
      '🏜️ حمامات الرمال الساخنة بجبل الدكرور لعلاج الروماتيزم وتجديد الطاقة',
      '♨️ عيون المياه الكبريتية الساخنة الطبيعية للاسترخاء والعافية',
      '🌿 مساج وجلسات تقشير بالملح الصخري وزيوت الزيتون العضوية',
      '🧘 جلسات هدوء وتأمل بين واحات النخيل وقت الغروب',
      '🍵 ضيافة شاي الأعشاب السيوية المنقية للجسم وتمور الواحة الطبيعية',
    ],
  },
  tour_operator: {
    en: [
      '🗺️ All-Inclusive Multi-Day Siwa Itineraries (Safari + Hotel + Camp + Salt Lakes)',
      '🚐 Private Group & Corporate Retreat Logistics from Cairo & Alexandria',
      '🧭 Certified Multilingual Siwan Guides with Deep Cultural Knowledge',
      '⛺ Tailor-Made Sunset Camps, Stargazing & Bedouin Dinners',
      '🎟️ Desert Permits, Heritage Site Entrance & 24/7 Ground Support Included',
      '🤝 Custom Tailored Bundles matching your exact budget (0% Hidden Fees)',
    ],
    ar: [
      '🗺️ برامج سياحية متكاملة شاملة (سفاري 4x4 + إقامة بفندق/مخيم + بحيرات الملح + وجبات)',
      '🚐 تنظيم كامل لرحلات المجموعات والشركات من القاهرة والإسكندرية',
      '🧭 مرشدين سياحيين سيويين معتمدين ومتعددي اللغات',
      '⛺ تجهيز مخيمات خاصة لمشاهدة النجوم وحفلات عشاء بدوية فاخرة',
      '🎟️ استخراج تصاريح الصحراء وتذاكر المزارات ودعم ميداني 24/7',
      '🤝 باقات مخصصة تناسب ميزانيتك وجدولك بدون أي عمولات وسيطة',
    ],
  },
  hotel: {
    en: [
      '🏨 Authentic Siwan Architecture & Salt-Rock Decor',
      '🌴 Lush Palm Garden & Quiet Mountain Views',
      '🍳 Traditional Siwan Breakfast Included',
      '❄️ Air-Conditioned Rooms with Private Bathrooms',
    ],
    ar: [
      '🏨 عمارة كرجيف سيوية أصلية بديكورات صخور الملح',
      '🌴 حدائق نخيل هادئة وإطلالات ساحرة على الجبل',
      '🍳 إفطار سيوي طازج مشمول مع الإقامة',
      '❄️ غرف مكيفة ومجهزة بحمام خاص وواي فاي',
    ],
  },
  dining: {
    en: [
      '🍲 Authentic Siwan Tagines & Wood-Fired Specialties',
      '🌿 Fresh Organic Farm-to-Table Ingredients',
      '🕯️ Romantic Candlelit Palm Garden Seating',
      '☕ Complimentary Siwan Herbal Tea & Dates',
    ],
    ar: [
      '🍲 طواجن سيوية أصلية ومشاوي على الحطب',
      '🌿 مكونات طبيعية طازجة من مزارع سيوة العضوية',
      '🕯️ جلسات نخيل بدوية رومانسية تحت النجوم',
      '☕ ضيافة شاي لويزة وتمور سيوية فاخرة',
    ],
  },
  crafts: {
    en: [
      '🏺 100% Authentic Handmade Siwan Heritage Crafts',
      '🌴 Organic Cold-Pressed Siwan Olive Oil & Premium Dates',
      '🧂 Handcrafted Natural Salt Lamps & Healing Salt Stones',
      '📦 Safe Delivery Across Egypt & Export Support',
    ],
    ar: [
      '🏺 مشغولات تراثية سيوية يدوية أصلية 100%',
      '🌴 زيت زيتون سيوي عضوي معصور على البارد وتمور فاخرة',
      '🧂 أباجورات ملح صخري طبيعي ومنتجات استشفاء',
      '📦 شحن آمن لجميع محافظات مصر وتجهيز طلبيات التصدير',
    ],
  },
  general: {
    en: [
      '⭐ Verified Partner on SiWiFy.com',
      '💬 Instant WhatsApp Booking & Inquiries',
      '📍 Centrally Located in Siwa Oasis',
      '🤝 100% Direct Contact with 0% Hidden Commission',
    ],
    ar: [
      '⭐ شريك معتمد وموثق على منصة SiWiFy.com',
      '💬 حجز وتواصل فوري وسريع عبر الواتساب',
      '📍 موقع متميز يسهل الوصول إليه في واحة سيوة',
      '🤝 تواصل مباشر 100% بدون أي عمولات وسيطة',
    ],
  },
};

/**
 * Smart Value Pitch Generator (Tailored to Parent / Child Typology)
 */
function buildSmartWelcomePitch(params: {
  name: string;
  slug: string;
  parentTypeName: string;
  childTypeName: string;
  categoryKey: string;
  vanityUrl: string;
  socialToolkitUrl: string;
  mobileDashboardUrl: string;
  claimUrl: string;
}) {
  const { name, parentTypeName, childTypeName, categoryKey, vanityUrl, socialToolkitUrl, mobileDashboardUrl, claimUrl } = params;

  // Industry-specific upgrade bullet points
  let upgradeBulletsAr = `• الظهور في النتيجة #1 في بحث سيوة والخرائط أمام آلاف السياح.\n• علامة التوثيق الذهبية (Verified Gold Badge) لزيادة ثقة العملاء.\n• إمكانية تحصيل العربون والدفع الإلكتروني المسبق للجولات والحجوزات.\n• نظام إدارة الحجوزات والرسائل التلقائية عبر الواتساب (CRM).`;
  let upgradeBulletsEn = `• #1 Priority ranking on Siwa search results & interactive maps.\n• Verified Gold Trust Badge to maximize tourist booking confidence.\n• Accept online deposits & automated reservation calendar.\n• Customer Leads CRM with automated WhatsApp confirmations.`;

  if (categoryKey === 'wellness') {
    upgradeBulletsAr = `• إتاحة حجز برامج الاستشفاء وجلسات الدكرور وبحيرات الملح مع استمارات طبية مسبقة.\n• تحصيل العربون الإلكتروني المسبق لتأكيد مواعيد الجلسات ومجموعات الاستشفاء.\n• تصدر نتائج محركات البحث لجذب راغبي السياحة العلاجية من مصر ودول الخليج وأوروبا.\n• علامة التوثيق الذهبية كمركز استشفاء معتمد رسمياً في واحة سيوة.`;
    upgradeBulletsEn = `• Enable online bookings for multi-day Salt Lake & Mount Dakrour wellness retreats.\n• Collect advance deposits & medical intake notes directly.\n• Top SEO ranking for health tourists looking for Siwa healing therapies.\n• Official Verified Gold Medical & Wellness Center Badge.`;
  } else if (categoryKey === 'tour_operator') {
    upgradeBulletsAr = `• نظام دمج الباقات المتكاملة (حجز Safari 4x4 + إقامة + نقل + وجبات في فاتورة واحدة للعميل).\n• تحصيل دفعات وحجوزات المجموعات السياحية والشركات مباشرة عبر المنصة.\n• استخراج كشوفات وجداول البرامج السياحية (Itinerary PDFs) تلقائياً بهوية شركتك.\n• الصدارة في صفحات "برامج سيوة المتكاملة" والرحلات الشاملة لزيادة مبيعاتك.`;
    upgradeBulletsEn = `• Multi-Service Package Bundler (Book 4x4 + Hotel + Meals + Transfers in one single guest checkout).\n• Online group deposit & seat management for corporate & private retreats.\n• Automated branded Customer Itinerary PDF generator.\n• Top placement on Siwa All-Inclusive Tour Packages directory.`;
  }

  // Arabic tailored pitch
  const arPitch = `مرحباً بك يا كابتن/صاحب نشاط *${name}* في سيوة! 🌴✨

يسر منصة *SiWiFy.com* إعلامك باعتماد وتوثيق نشاطك في دليل الواحة السياحي تحت تصنيف:
🏷️ *${parentTypeName || 'الأنشطة السياحية'} ➔ ${childTypeName || 'خدمات سيوة'}*

🎁 *الخدمات المجانية المتاحة لك فوراً 100%:*
━━━━━━━━━━━━━━━━━━
1️⃣ *موقعك المصغر الرسمي (Minisite)* بدون عمولة (0%):
🔗 ${vanityUrl}
(شاركه مع زوارك لحجز جولاتك وخدماتك مباشرة على الواتساب)

2️⃣ *تطبيق صانع فيديوهات الريلز والستوري المجاني:*
📲 ${socialToolkitUrl}
(صمم بوستات وفيديوهات احترافية باسمك ولوجو نشاطك بضغطة واحدة)

3️⃣ *لوحة تحكم موبايل خاصة بك لمتابعة نشاطك:*
📊 ${mobileDashboardUrl}

4️⃣ *تأكيد وتفعيل ملكية حسابك كشريك رسمي:*
🔑 ${claimUrl}

━━━━━━━━━━━━━━━━━━
🚀 *لماذا وكيف ترقّي باقتك إلى (SiWiFy Premium)؟*
━━━━━━━━━━━━━━━━━━
⭐ *لماذا الترقية لـ ${childTypeName}؟*
${upgradeBulletsAr}

💡 *كيف ترقّي؟*
يمكنك الترقية بضغطة واحدة من داخل لوحة تحكمك أو الرد على هذه الرسالة للتواصل مع فريق الدعم الفني مباشرة.

نتشرف بنجاحك معنا في واحة سيوة! 🌿✨`;

  // English tailored pitch
  const enPitch = `Welcome *${name}* to the Siwa Oasis Digital Platform! 🌴✨

Your business has been officially verified on *SiWiFy.com* under:
🏷️ *${parentTypeName || 'Tourism Category'} ➔ ${childTypeName || 'Siwa Partner'}*

🎁 *Your 100% Free Included Services:*
━━━━━━━━━━━━━━━━━━
1️⃣ *Official Verified Minisite (0% Commission Direct Bookings):*
🔗 ${vanityUrl}
(Share with your guests to get instant WhatsApp direct bookings)

2️⃣ *Free Video Reels & Social Media Growth Toolkit:*
📲 ${socialToolkitUrl}
(Create branded Instagram & TikTok stories with your business name in 1 click)

3️⃣ *Private Mobile Dashboard to manage your details:*
📊 ${mobileDashboardUrl}

4️⃣ *Claim and activate your official partner ownership:*
🔑 ${claimUrl}

━━━━━━━━━━━━━━━━━━
🚀 *Why & How to Upgrade to (SiWiFy Premium)?*
━━━━━━━━━━━━━━━━━━
⭐ *Why Upgrade for ${childTypeName}?*
${upgradeBulletsEn}

💡 *How to Upgrade?*
Upgrade with 1-click in your mobile dashboard or reply to this message to connect with our Partner Success team.

We look forward to growing your business in Siwa Oasis! 🌿✨`;

  return { arPitch, enPitch };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const origin = searchParams.get('origin') || 'https://siwify.com';

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const business = await queryOne(`
      SELECT b.*, 
             bt.name as type_name, bt.icon as type_icon, bt.id as type_id, bt.parent_id as parent_type_id,
             parent_bt.name as parent_type_name, parent_bt.icon as parent_type_icon
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
      WHERE b.id = ? OR b.slug = ?
    `, [businessId, businessId]) as any;

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData: Record<string, any> = {};
    try {
      customData = typeof business.custom_data === 'string'
        ? JSON.parse(business.custom_data)
        : business.custom_data || {};
    } catch {
      customData = {};
    }

    const showcase = customData.whatsapp_showcase || {};

    // Detect category key for presets & smart pitches
    const typeIdStr = String(business.type_id || '').toLowerCase();
    const parentIdStr = String(business.parent_type_id || '').toLowerCase();
    let categoryKey = 'general';

    if (
      typeIdStr.includes('wellness') || typeIdStr.includes('health') || typeIdStr.includes('spa') ||
      typeIdStr.includes('salt') || typeIdStr.includes('dakrour') || typeIdStr.includes('healing') ||
      typeIdStr.includes('bath') || typeIdStr.includes('spring') || parentIdStr.includes('wellness') || parentIdStr.includes('crafts-wellness')
    ) {
      categoryKey = 'wellness';
    } else if (
      typeIdStr.includes('tour_operator') || typeIdStr.includes('operator') || typeIdStr.includes('journey') ||
      typeIdStr.includes('package') || typeIdStr.includes('itinerary') || typeIdStr.includes('planner') ||
      typeIdStr.includes('agency') || typeIdStr.includes('trip') || parentIdStr.includes('journey') || parentIdStr.includes('tour')
    ) {
      categoryKey = 'tour_operator';
    } else if (typeIdStr.includes('trans') || typeIdStr.includes('move') || typeIdStr.includes('tuk') || typeIdStr.includes('driver') || parentIdStr.includes('trans')) {
      categoryKey = 'transport';
    } else if (typeIdStr.includes('safari') || typeIdStr.includes('desert') || parentIdStr.includes('safari')) {
      categoryKey = 'safari';
    } else if (typeIdStr.includes('hotel') || typeIdStr.includes('camp') || typeIdStr.includes('stay') || typeIdStr.includes('lodge') || parentIdStr.includes('stay') || parentIdStr.includes('hotel') || parentIdStr.includes('accommodations')) {
      categoryKey = 'hotel';
    } else if (typeIdStr.includes('food') || typeIdStr.includes('eat') || typeIdStr.includes('rest') || typeIdStr.includes('cafe') || parentIdStr.includes('food')) {
      categoryKey = 'dining';
    } else if (typeIdStr.includes('craft') || typeIdStr.includes('date') || typeIdStr.includes('olive') || typeIdStr.includes('oil') || parentIdStr.includes('craft') || parentIdStr.includes('production-trade')) {
      categoryKey = 'crafts';
    }

    const defaultPresets = CATEGORY_FEATURE_PRESETS[categoryKey] || CATEGORY_FEATURE_PRESETS.general;

    const vanityUrl = `${origin}/${business.slug}`;
    const socialToolkitUrl = `${origin}/vendor/social-toolkit?slug=${business.slug}`;
    const mobileDashboardUrl = `${origin}/jana/businesses/${business.id}/mobile`;
    const claimUrl = `${origin}/vendor/claim?slug=${business.slug}`;

    // Smart Pitch Generator
    const { arPitch, enPitch } = buildSmartWelcomePitch({
      name: business.name,
      slug: business.slug,
      parentTypeName: business.parent_type_name || 'سياحة وضيافة سيوة',
      childTypeName: business.type_name || 'نشاط معتمد',
      categoryKey,
      vanityUrl,
      socialToolkitUrl,
      mobileDashboardUrl,
      claimUrl,
    });

    const data = {
      businessId: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone || customData.basic?.phone || customData.sec_1_identity?.phone || '',
      whatsapp: customData.basic?.whatsapp || customData.sec_1_identity?.whatsapp || business.phone || '',
      type_name: business.type_name || 'Business',
      type_icon: business.type_icon || 'fa-tag',
      parent_type_name: business.parent_type_name || 'Siwa Tourism',
      parent_type_icon: business.parent_type_icon || 'fa-layer-group',
      categoryKey,
      
      // Photos for showcase
      personalPhoto: showcase.personal_photo || customData.basic?.driver_photo || customData.sec_1_identity?.personal_photo || business.logo_url || '',
      servicePhoto1: showcase.service_photo_1 || customData.basic?.vehicle_photo_1 || (Array.isArray(customData.basic?.gallery) ? customData.basic.gallery[0] : '') || '',
      servicePhoto2: showcase.service_photo_2 || customData.basic?.vehicle_photo_2 || (Array.isArray(customData.basic?.gallery) ? customData.basic.gallery[1] : '') || '',
      
      // Selected features / highlights
      selectedFeaturesEn: showcase.features_en || defaultPresets.en,
      selectedFeaturesAr: showcase.features_ar || defaultPresets.ar,
      availablePresets: defaultPresets,
      
      // Custom notes
      customNoteAr: showcase.custom_note_ar || '',
      customNoteEn: showcase.custom_note_en || '',
      
      // Smart Auto-Generated Pitches
      smartWelcomePitchAr: arPitch,
      smartWelcomePitchEn: enPitch,

      // Links
      minisiteUrl: vanityUrl,
      socialToolkitUrl,
      mobileDashboardUrl,
      claimUrl,
    };

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load showcase data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      businessId,
      personalPhoto,
      servicePhoto1,
      servicePhoto2,
      selectedFeaturesEn,
      selectedFeaturesAr,
      customNoteAr,
      customNoteEn,
      syncToMinisite = true,
    } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const business = await queryOne(`SELECT id, custom_data FROM businesses WHERE id = ? OR slug = ?`, [businessId, businessId]) as any;
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData: Record<string, any> = {};
    try {
      customData = typeof business.custom_data === 'string'
        ? JSON.parse(business.custom_data)
        : business.custom_data || {};
    } catch {
      customData = {};
    }

    // Save WhatsApp showcase config
    customData.whatsapp_showcase = {
      personal_photo: personalPhoto || '',
      service_photo_1: servicePhoto1 || '',
      service_photo_2: servicePhoto2 || '',
      features_en: selectedFeaturesEn || [],
      features_ar: selectedFeaturesAr || [],
      custom_note_ar: customNoteAr || '',
      custom_note_en: customNoteEn || '',
      updated_at: new Date().toISOString(),
    };

    // If syncToMinisite is requested, synchronize into standard custom_data keys
    if (syncToMinisite) {
      if (!customData.basic) customData.basic = {};
      if (!customData.sec_1_identity) customData.sec_1_identity = {};

      if (personalPhoto) {
        customData.basic.driver_photo = personalPhoto;
        customData.basic.personal_photo = personalPhoto;
        customData.sec_1_identity.driver_photo = personalPhoto;
      }
      if (servicePhoto1) customData.basic.vehicle_photo_1 = servicePhoto1;
      if (servicePhoto2) customData.basic.vehicle_photo_2 = servicePhoto2;

      // Also append to gallery if not present
      const gallery = Array.isArray(customData.basic.gallery) ? [...customData.basic.gallery] : [];
      [servicePhoto1, servicePhoto2, personalPhoto].forEach((photo) => {
        if (photo && !gallery.includes(photo)) {
          gallery.push(photo);
        }
      });
      customData.basic.gallery = gallery;

      // Sync highlights
      customData.basic.highlights_ar = selectedFeaturesAr;
      customData.basic.highlights_en = selectedFeaturesEn;
    }

    await execute(
      `UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(customData), business.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Showcase features & photos synchronized successfully!',
      whatsapp_showcase: customData.whatsapp_showcase,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save showcase' }, { status: 500 });
  }
}
