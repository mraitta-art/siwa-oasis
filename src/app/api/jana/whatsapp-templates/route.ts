import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TEMPLATES_CONFIG_KEY = 'whatsapp_message_templates';

export interface WhatsAppTemplateItem {
  id: string;
  name: string;
  categoryKey: string; // 'transport' | 'safari' | 'wellness' | 'tour_operator' | 'hotel' | 'dining' | 'crafts' | 'general'
  parentTypeId?: string; // e.g. 'logistics', 'adventure', 'wellness', 'accommodation', 'food', 'crafts'
  childTypeId?: string;  // e.g. 'tuk_tuk', '4x4_safari', 'sand_bath', etc.
  targetAudience: 'all' | 'new_unclaimed' | 'active_vendor' | 'tourist_client' | 'inactive_reactivation';
  isHidden: boolean;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  includedFeatures: string[];
  updatedAt?: string;
}

const DEFAULT_TEMPLATES: WhatsAppTemplateItem[] = [
  // 1. LOGISTICS & TRANSPORT -> Tuk-Tuk
  {
    id: 'transport_tuktuk_welcome',
    name: 'Tuk-Tuk Drivers Welcome & Minisite (أهلاً يا كابتن)',
    categoryKey: 'transport',
    parentTypeId: 'logistics',
    childTypeId: 'tuk_tuk',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب وتفعيل لسائقي التوك توك في سيوة',
    titleEn: 'Welcome & Free Minisite for Tuk-Tuk Drivers',
    contentAr: `أهلاً وسهلاً بيك يا كابتن *{name}*! 🛺🌴✨\nمعاك *جنا* من منصة *SiWiFy.com*، وبحب أقولك إننا جهزنالك كارت وصفحة شخصية مجانية تماماً ليك ولمركبتك في سيوة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *خدماتك المجانية المتاحة فوراً على تليفونك:*\n1️⃣ موقعك وكارتك للحجز المباشر (مكسبك كامل في جيبك 0% عمولة): {minisiteUrl}\n2️⃣ تطبيق خفيف على موبايلك لمتابعة مشاويرك وأسعارك: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات وستوري واتساب باسمك: {socialToolkitUrl}\n\n🔑 *لتأكيد اسمك واستلام صفحتك مجاناً:*\n👉 {claimUrl}\n\nلو محتاج أي مساعدة، رد عليا هنا وأنا معاك خطوة بخطوة يا كابتن! 🌿🤝`,
    contentEn: `Welcome Captain *{name}*! 🛺🌴✨\nThis is *Jana* from *SiWiFy.com*.\nWe built a 100% free digital card & booking minisite for you in Siwa:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Your Free Tools:*\n1️⃣ Direct Booking Card (0% Commission): {minisiteUrl}\n2️⃣ Mobile Command App: {mobileDashboardUrl}\n3️⃣ Video Reels & WhatsApp Story Maker: {socialToolkitUrl}\n\n🔑 *Claim your page for free:*\n👉 {claimUrl}\n\nReply here if you need any help! 🌿🤝`,
    includedFeatures: ['Licensed Tuk-Tuk', 'Verified Local Driver', 'Salt Lakes & Sunset Tours'],
  },
  // 2. LOGISTICS & TRANSPORT -> General Transfers
  {
    id: 'transport_transfers_welcome',
    name: 'Car & Airport Transfers Onboarding (نقل وسيارات سياحية)',
    categoryKey: 'transport',
    parentTypeId: 'logistics',
    childTypeId: 'airport_transfer',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب بخدمات النقل والسيارات السياحية',
    titleEn: 'Welcome for Airport & Long-Range Transfers',
    contentAr: `مرحباً بك يا كابتن *{name}*! 🚐🌴✨\nمعاك *جنا* من منصة *SiWiFy.com*، ويسرنا إبلاغك باعتماد وتوثيق سيارتك/خدمتك لنقل الزوار في سيوة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *خدماتك المجانية المتاحة لك فوراً:*\n1️⃣ موقعك الرسمي لاستقبال طلبات النقل والمشاوير بدون أي عمولة (0%): {minisiteUrl}\n2️⃣ تطبيق موبايل لتحديث أسعار المشاوير والمحافظات: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات دعائية لسيارتك: {socialToolkitUrl}\n\n🔑 *لتفعيل صفحتك وتأكيد بياناتك مجاناً:*\n👉 {claimUrl}\n\nنتشرف بوجودك شريكاً معتمداً في واحة سيوة! 🌿`,
    contentEn: `Welcome Captain *{name}*! 🚐🌴✨\nYour passenger transfer service is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Included Free:*\n1️⃣ Direct Booking Minisite: {minisiteUrl}\n2️⃣ Rates & Trips Mobile App: {mobileDashboardUrl}\n3️⃣ Social Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['Cairo & Matrouh Airport Transfers', 'Air-Conditioned Vehicle', 'Verified Chauffeur'],
  },
  // 3. ADVENTURE -> 4x4 Safari & Sandboarding
  {
    id: 'adventure_safari_welcome',
    name: 'Desert Safari 4x4 & Great Sand Sea (سفاري بحر الرمال)',
    categoryKey: 'safari',
    parentTypeId: 'adventure',
    childTypeId: 'safari_4x4',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب بكباتن ومنظمي سفاري 4x4',
    titleEn: 'Welcome & Free Minisite for 4x4 Safari Guides',
    contentAr: `مرحباً بك يا كابتن *{name}*! 🚙🏜️✨\nمعاك *جنا* من منصة *SiWiFy.com*، وبحب أقولك إننا وثقنا نشاطك وسيارات الدفع الرباعي لسفاري بحر الرمال:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *المزايا المجانية الجاهزة لك فوراً:*\n1️⃣ موقعك المصغر لعرض صور رحلاتك وتفاصيل الدفع الرباعي (0% عمولة): {minisiteUrl}\n2️⃣ لوحة تحكم على تليفونك لمتابعة الحجوزات والبرامج: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات ريلز وتيك توك احترافية لشغل السفاري: {socialToolkitUrl}\n\n🔑 *لتأكيد وتفعيل صفحتك مجاناً:*\n👉 {claimUrl}\n\nلو حابب تضيف صور لسياراتك أو مخيمك الصحراوي، رد عليا هنا فوراً! ⛺🌄`,
    contentEn: `Welcome Captain *{name}*! 🚙🏜️✨\nYour 4x4 Desert Safari is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Included Features:*\n1️⃣ Safari Minisite: {minisiteUrl}\n2️⃣ Mobile Trips Hub: {mobileDashboardUrl}\n3️⃣ Desert Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['4x4 Land Cruiser', 'Great Sand Sea Dune Bashing', 'Desert Hot Springs & Campfires'],
  },
  // 4. WELLNESS -> Salt Baths & Sand Therapies
  {
    id: 'wellness_onboarding',
    name: 'Health & Wellness Onboarding (مراكز الاستشفاء والعافية)',
    categoryKey: 'wellness',
    parentTypeId: 'wellness',
    childTypeId: 'sand_bath',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد مراكز الاستشفاء والعافية وبحيرات الملح',
    titleEn: 'Welcome & Activation for Wellness & Salt Centers',
    contentAr: `مرحباً بكم في مركز *{name}* للاستشفاء والعافية في سيوة! 🌴✨\nمعاكم *جنا* من منصة *SiWiFy.com*، ويسعدنا إبلاغكم بتوثيق مركزكم في دليل سيوة السياحي الطبي:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *الخدمات المجانية المتاحة لمركزكم فوراً:*\n1️⃣ صفحة عرض رسمية لحجز جلسات الاستشفاء والطفو (0% عمولة): {minisiteUrl}\n2️⃣ صانع فيديوهات السوشيال ميديا وريلز العلاج الطبيعي: {socialToolkitUrl}\n3️⃣ لوحة تحكم لمتابعة المواعيد والجلسات من الموبايل: {mobileDashboardUrl}\n\n🔑 *لتأكيد وتفعيل ملف المركز رسمياً:*\n👉 {claimUrl}\n\nنتشرف بدعم السياحة العلاجية معكم في واحة سيوة! 🌿💆‍♂️`,
    contentEn: `Welcome *{name}* to the Siwa Oasis Wellness Hub! 🌴✨\n\nYour wellness center is verified under:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Your 100% Free Included Tools:*\n1️⃣ Official Minisite: {minisiteUrl}\n2️⃣ Social Reels Creator: {socialToolkitUrl}\n3️⃣ Mobile Command Center: {mobileDashboardUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['Healing Salt Lakes', 'Dakrour Sand Baths', 'Sulfur Springs', 'Herbal Massages'],
  },
  // 5. ACCOMMODATION -> Eco-Lodges & Camps
  {
    id: 'accommodation_welcome',
    name: 'Eco-Lodges, Camps & Hotels (الفنادق والمخيمات البيئية)',
    categoryKey: 'hotel',
    parentTypeId: 'accommodation',
    childTypeId: 'glamping_tent',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد الفنادق والإيكولودج والمخيمات',
    titleEn: 'Welcome for Eco-Lodges, Camps & Hotels',
    contentAr: `مرحباً بإدارة *{name}* في واحة سيوة! 🏨🌴✨\nمعاكم *جنا* من منصة *SiWiFy.com*، ويسرنا إعلامكم باعتماد وتوثيق منشأتكم الفندقية في دليل سيوة الرسمي:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *الخدمات المجانية المتاحة لمنشأتكم:*\n1️⃣ موقعكم المصغر الرسمي لعرض الغرف والمخيمات بدون أي عمولة (0%): {minisiteUrl}\n2️⃣ لوحة تحكم موبايل سريعة لتحديث الأسعار والصور: {mobileDashboardUrl}\n3️⃣ تطبيق صانع ريلز وستوري لحسابكم على إنستغرام: {socialToolkitUrl}\n\n🔑 *لتأكيد وتفعيل الحساب كشريك رسمي:*\n👉 {claimUrl}\n\nنتمنى لكم موسماً سياحياً مزدهراً في سيوة! 🌿⭐`,
    contentEn: `Welcome *{name}* to Siwa Oasis Accommodations! 🏨🌴✨\nYour lodge/hotel has been verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Included Tools:*\n1️⃣ Official Minisite (0% Commission): {minisiteUrl}\n2️⃣ Mobile Room & Rates Dashboard: {mobileDashboardUrl}\n3️⃣ Instagram Reels Generator: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['Authentic Siwan Architecture', 'Salt-Rock Decor', 'Palm Garden & Mountain Views'],
  },
  // 6. FOOD & BEVERAGE -> Bedouin Dining & Restaurants
  {
    id: 'food_dining_welcome',
    name: 'Restaurants & Bedouin Dinners (المطاعم والعشاء البدوي)',
    categoryKey: 'dining',
    parentTypeId: 'food',
    childTypeId: 'desert_dining_event',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب بالمطاعم وجلسات العشاء البدوي',
    titleEn: 'Welcome for Restaurants & Bedouin Diners',
    contentAr: `مرحباً بإدارة مطعم/جلسات *{name}* في سيوة! 🍲🌴✨\nمعاكم *جنا* من منصة *SiWiFy.com*، وبحب أبلغكم بتوثيق مطعمكم وخدماتكم في دليل الضيافة السيوية:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *مزاياكم المجانية الفورية:*\n1️⃣ موقع رسمي لعرض قائمة الطعام وأطباق أبو مردم وحجز الطاولات (0% عمولة): {minisiteUrl}\n2️⃣ لوحة تحكم لتعديل أرقام الدليفري وأوقات العمل: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات شهية لأطباقكم السيوية: {socialToolkitUrl}\n\n🔑 *لتأكيد واستلام الصفحة مجاناً:*\n👉 {claimUrl}\n\nبالهناء والشفاء لكل ضيوف سيوة! 🌿🕯️`,
    contentEn: `Welcome *{name}* to Siwa Dining Guide! 🍲🌴✨\nYour restaurant is verified on *SiWiFy.com* under:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Menu & Table Booking Minisite: {minisiteUrl}\n2️⃣ Mobile Store Dashboard: {mobileDashboardUrl}\n3️⃣ Branded Food Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['Authentic Siwan Tagines', 'Wood-Fired Specialties', 'Farm-to-Table Ingredients'],
  },
  // 7. CRAFTS & TRADING -> Dates, Olive Oil & Salt Lamps
  {
    id: 'crafts_trade_welcome',
    name: 'Siwan Crafts, Dates & Olive Oil (منتجات التمور والزيتون والحرف)',
    categoryKey: 'crafts',
    parentTypeId: 'crafts',
    childTypeId: 'date_olive',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب بتجار ومصنعي تمور وزيت زيتون وحرف سيوة',
    titleEn: 'Welcome for Siwan Dates, Olive Oil & Craft Shops',
    contentAr: `مرحباً بكم في متجر *{name}* لمنتجات وخيرات سيوة! 🏺🌴✨\nمعاكم *جنا* من منصة *SiWiFy.com*، ويسعدنا توثيق متجركم في دليل المنتجات التراثية والطبيعية للواحة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *مزاياكم المجانية المتاحة فوراً:*\n1️⃣ كتالوج وموقع رسمي لعرض منتجات التمور، زيت الزيتون، وأباجورات الملح (0% عمولة): {minisiteUrl}\n2️⃣ لوحة إدارة من الموبايل لإضافة صور المنتجات والأسعار: {mobileDashboardUrl}\n3️⃣ صانع ريلز وفيديوهات دعائية لمنتجاتكم: {socialToolkitUrl}\n\n🔑 *لتأكيد ملكية المتجر واستلام الكتالوج مجاناً:*\n👉 {claimUrl}\n\nنتشرف بنشر خيرات سيوة معكم لجميع الزوار! 🌿📦`,
    contentEn: `Welcome *{name}* to Siwa Oasis Heritage & Natural Products! 🏺🌴✨\nYour shop is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Product Showcase Minisite: {minisiteUrl}\n2️⃣ Mobile Catalog App: {mobileDashboardUrl}\n3️⃣ Video Reels Creator: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['Organic Cold-Pressed Olive Oil', 'Siwan Premium Dates', 'Handcrafted Salt Lamps'],
  },
  // 8. TOUR OPERATOR -> Multi-Day Programs
  {
    id: 'tour_operator_onboarding',
    name: 'Tour Operators & Itineraries Onboarding (شركات ومنظمي البرامج)',
    categoryKey: 'tour_operator',
    parentTypeId: 'adventure',
    childTypeId: 'tour_operator',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد منظمي الرحلات والبرامج السياحية',
    titleEn: 'Welcome & Activation for Tour Operators',
    contentAr: `مرحباً بشركة/منظم رحلات *{name}* في سيوة! 🌴✨\nمعاكم *جنا* من منصة *SiWiFy.com*، وتم توثيق نشاطكم لتنظيم البرامج المتكاملة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *مزاياكم المجانية:*\n1️⃣ موقعكم المصغر لعرض باقات وبرامج الواحة (0% عمولة): {minisiteUrl}\n2️⃣ صانع فيديوهات الريلز للرحلات: {socialToolkitUrl}\n3️⃣ لوحة إدارة البرامج من الموبايل: {mobileDashboardUrl}\n\n🔑 *لتأكيد وتفعيل الحساب رسمياً:*\n👉 {claimUrl}\n\nنتمنى لكم رحلات موفقة ومميزة في سيوة! 🌿🗺️`,
    contentEn: `Welcome *{name}* to Siwa Oasis Tour Operations! 🌴✨\n\nYour agency is verified under:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Included Tools:*\n1️⃣ Verified Itinerary Minisite: {minisiteUrl}\n2️⃣ Tour Reels Maker: {socialToolkitUrl}\n3️⃣ Mobile Dashboard: {mobileDashboardUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['All-Inclusive Itineraries', 'Cairo Group Logistics', 'Desert Permits Included'],
  },
  // 9. CLIENT SHOWCASE
  {
    id: 'client_showcase_general',
    name: 'Client / Tourist Showcase Pitch (بطاقة عرض للزبائن والسياح)',
    categoryKey: 'general',
    targetAudience: 'tourist_client',
    isHidden: false,
    titleAr: 'بطاقة عرض الخدمة للزبائن والسياح',
    titleEn: 'Direct Tourist Showcase & Booking Pitch',
    contentAr: `🌴 مرحباً بك في واحة سيوة! ✨\n\nنقدم لك خدمة موثوقة ومباشرة مع: *{name}*\n🏷️ *{parentType} ➔ {childType}*\n\n📸 *معرض الصور والمركبة / الخدمة:*\n{photoLinks}\n\n✨ *المميزات والخدمات المشمولة:*\n{featureList}\n\n🌐 *للتفاصيل والحجز المباشر بدون عمولة (0%):*\n{minisiteUrl}\n\nنتمنى لكم إقامة وتجربة لا تُنسى في سيوة! 🌿`,
    contentEn: `🌴 Welcome to Siwa Oasis! ✨\n\nHere is verified direct service details for: *{name}*\n🏷️ *{parentType} ➔ {childType}*\n\n📸 *Photos & Showcase:*\n{photoLinks}\n\n✨ *Highlights & Inclusions:*\n{featureList}\n\n🌐 *Direct Minisite & 0% Commission Booking:*\n{minisiteUrl}\n\nHave a magical journey in Siwa Oasis! 🌿`,
    includedFeatures: ['Verified Partner', 'Instant Booking', '0% Commission'],
  },
];

export async function GET() {
  try {
    await requireAdmin();

    const config = await queryOne(
      `SELECT value FROM website_configs WHERE key = ? AND type = 'whatsapp_templates'`,
      [TEMPLATES_CONFIG_KEY]
    ) as any;

    let templates: WhatsAppTemplateItem[] = DEFAULT_TEMPLATES;
    if (config?.value) {
      try {
        const parsed = JSON.parse(config.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          templates = parsed;
        }
      } catch {}
    }

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { templates } = body;

    if (!Array.isArray(templates)) {
      return NextResponse.json({ error: 'templates array required' }, { status: 400 });
    }

    const jsonStr = JSON.stringify(templates);

    // Save into website_configs
    const existing = await queryOne(
      `SELECT id FROM website_configs WHERE key = ? AND type = 'whatsapp_templates'`,
      [TEMPLATES_CONFIG_KEY]
    );

    if (existing) {
      await execute(
        `UPDATE website_configs SET value = ?, updated_at = NOW() WHERE key = ? AND type = 'whatsapp_templates'`,
        [jsonStr, TEMPLATES_CONFIG_KEY]
      );
    } else {
      await execute(
        `INSERT INTO website_configs (\`key\`, type, value, created_at, updated_at) VALUES (?, 'whatsapp_templates', ?, NOW(), NOW())`,
        [TEMPLATES_CONFIG_KEY, jsonStr]
      );
    }

    return NextResponse.json({ success: true, count: templates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save templates' }, { status: 500 });
  }
}
